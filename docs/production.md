# Implantação em produção

Este guia cobre a implantação do NAP Log com Docker Compose em um único host. O proxy reverso, o DNS, os certificados e o armazenamento externo de backup são responsabilidades da infraestrutura.

## 1. Pré-requisitos

- Linux com Docker Engine, plugin Compose v2 e Git.
- 8 vCPU, 32 GB de RAM e volumes SSD separados para PostgreSQL e MinIO.
- DNS e certificados válidos para painel, API, Keycloak e objetos.
- Portas públicas 80/443 no proxy; portas dos containers ligadas somente a `127.0.0.1`.
- Destino externo, criptografado e monitorado para backups.
- Saída HTTPS liberada para os provedores usados pelo ambiente.

Use imagens e commits imutáveis. Não implante diretamente de uma árvore Git com alterações locais.

## 2. DNS e proxy reverso

| Serviço | Nome de exemplo | Destino local |
|---|---|---|
| Painel | `app.example.com` | `127.0.0.1:3000` |
| API | `api.example.com` | `127.0.0.1:3301` |
| Identidade | `auth.example.com` | `127.0.0.1:8280` |
| Objetos | `objects.example.com` | endpoint S3/MinIO |

O proxy deve terminar TLS, preservar `Host` e `X-Forwarded-*`, limitar tamanho e tempo de uploads e redirecionar HTTP para HTTPS. O host público do MinIO deve ser preservado porque participa da assinatura das URLs temporárias.

## 3. Segredos e configuração

Crie o arquivo local, que nunca deve ser versionado:

```sh
cp .env.production.example .env.production
chmod 600 .env.production
```

Substitua todos os valores `replace-*`. Gere segredos independentes com pelo menos 32 bytes aleatórios. Armazene-os em um secret manager e restrinja o arquivo à conta da implantação.

Revise especialmente:

- `DATABASE_URL` e `REDIS_URL`, que devem usar as mesmas senhas declaradas.
- `OIDC_ISSUER`, `AUTH_KEYCLOAK_ISSUER` e `KEYCLOAK_HOSTNAME`.
- `S3_PUBLIC_ENDPOINT` e `PUBLIC_PROOF_BASE_URL`, obrigatoriamente HTTPS.
- `AUTH_URL`, apontando para a URL pública do painel.
- `INTERNAL_SERVICE_KEY`, compartilhada somente entre API e worker.

A API recusa produção com bypass de autenticação, segredo interno fraco, variável obrigatória ausente ou URL pública insegura.

## 4. Keycloak e armazenamento

No Keycloak:

1. Crie ou importe o realm `nap-log`.
2. Configure clientes `nap-log-web`, `nap-log-mobile` e a audiência `nap-log-api`.
3. Configure os claims `tenant_id`, `permissions` e, para motoristas, `driver_id`.
4. Atribua somente `admin`, `manager`, `operator` ou `driver`, conforme a função.
5. Cadastre redirect URIs e web origins exatos; não use curingas em produção.

No S3/MinIO, crie o bucket privado de `S3_BUCKET`, ative versionamento, criptografia, retenção e CORS apenas para origens necessárias. Nunca conceda leitura pública ao bucket.

## 5. Validação antes do rollout

```sh
git status --short
pnpm install --frozen-lockfile
pnpm test
pnpm typecheck
pnpm lint
pnpm build
PRODUCTION_ENV_FILE=.env.production \
  docker compose --env-file .env.production -f docker-compose.prod.yml config --quiet
```

`git status` deve estar vazio e todos os comandos devem terminar com código zero. Faça um backup verificável antes de qualquer atualização.

## 6. Implantação

```sh
git fetch --tags
git checkout <commit-ou-tag-aprovado>
PRODUCTION_ENV_FILE=.env.production \
  docker compose --env-file .env.production -f docker-compose.prod.yml build
PRODUCTION_ENV_FILE=.env.production \
  docker compose --env-file .env.production -f docker-compose.prod.yml up -d
PRODUCTION_ENV_FILE=.env.production \
  docker compose --env-file .env.production -f docker-compose.prod.yml ps
```

O serviço `migrate` executa `prisma migrate deploy` antes da API. Não reverta migrações manualmente. Em banco já existente, garanta a existência do schema `keycloak` antes do primeiro rollout.

Valide:

```sh
curl --fail https://api.example.com/v1/health
curl --fail https://api.example.com/v1/health/ready
SMOKE_URL=https://api.example.com/v1/health \
  SMOKE_REQUESTS=500 SMOKE_CONCURRENCY=25 node infra/scripts/load-smoke.mjs
```

## 7. Smoke funcional

- Login, logout e renovação da sessão.
- Cadastro de motorista e veículo.
- Criação, roteirização, publicação e início de rota.
- Login mobile com `tenant_id` e `driver_id`.
- Operação offline, reconexão e idempotência da sincronização.
- Envio de GPS, chegada por geofence, ocorrência e finalização.
- Upload de foto/assinatura e geração do comprovante.
- Validação pública e download por URL temporária.
- Confirmação de isolamento entre tenants.

## 8. Observabilidade

Colete logs JSON de API e worker, métricas do host, PostgreSQL, Redis, MinIO, proxy e filas. Preserve correlation IDs, mas não envie PII ou segredos aos logs.

Alertas mínimos:

- liveness indisponível por 2 minutos ou readiness falhando por 1 minuto;
- worker sem heartbeat por 2 minutos, jobs falhando ou fila crescendo por 5 minutos;
- PostgreSQL ou MinIO acima de 80% do volume;
- certificado com menos de 30 dias para expirar;
- ausência do backup diário ou falha no checksum;
- último teste de restauração com mais de 30 dias.

## 9. Backup, retenção e restauração

Backup diário:

```sh
BACKUP_DIR=/mnt/backup POSTGRES_DB=nap_log POSTGRES_USER=nap_log \
  infra/scripts/backup.sh
```

Configure `MINIO_BACKUP_ALIAS` para espelhar também o bucket. Copie o resultado para outro domínio de falha e valide `SHA256SUMS`.

Retenção de GPS começa em dry-run:

```sh
POSTGRES_DB=nap_log POSTGRES_USER=nap_log GPS_RETENTION_DAYS=90 \
  infra/scripts/retain-gps.sh
```

Após revisar o SQL, agende com `CONFIRM_RETENTION=yes`. Preserve dados sujeitos a incidente, auditoria ou retenção legal.

Mensalmente, restaure PostgreSQL e objetos em ambiente isolado, execute o smoke funcional e registre duração e resultado. Um arquivo existente sem restauração testada não é considerado backup válido.

## 10. Rollback

1. Interrompa novas implantações e preserve logs.
2. Se o schema for compatível, volte API, worker e web ao commit anterior e mantenha os serviços de dados.
3. Se houver corrupção ou migração incompatível, suspenda a escrita, restaure o último backup validado em ambiente novo e altere o tráfego após o smoke.
4. Nunca use `prisma migrate reset` em produção.
5. Registre linha do tempo, impacto, versão e ação corretiva.

## 11. Checklist de go-live

- [ ] Commit/tag aprovado e pipeline verde.
- [ ] `.env.production` completo, protegido e fora do Git.
- [ ] DNS, TLS, renovação e headers do proxy validados.
- [ ] Keycloak com claims, papéis e redirect URIs revisados.
- [ ] Bucket privado, versionado e com retenção.
- [ ] Backup externo e restauração ensaiada.
- [ ] Alertas entregues ao plantão.
- [ ] Smoke técnico e funcional aprovados.
- [ ] Plano de rollback e responsáveis confirmados.
- [ ] APNs/FCM e push testados em aparelhos reais, quando habilitados.

## 12. Automação incluída

Antes do primeiro rollout, execute o preflight com o arquivo real:

```sh
infra/scripts/preflight-production.sh .env.production
```

Para construir, migrar e subir o stack a partir de uma árvore Git limpa:

```sh
PRODUCTION_ENV_FILE=.env.production infra/scripts/deploy-production.sh
```

O preflight recusa variáveis ausentes, placeholders, segredos curtos, URLs públicas sem HTTPS e Compose inválido. O deploy não prossegue com alterações locais.

Para o aplicativo, copie `apps/mobile/.env.production.example`, configure as três URLs/IDs públicos no ambiente EAS e use o perfil de `apps/mobile/eas.json`:

```sh
cd apps/mobile
eas build --platform all --profile production
eas submit --platform all --profile production
```

Credenciais de assinatura, projeto EAS, APNs/FCM e cadastros nas lojas devem ser fornecidos pelas contas oficiais da organização; não pertencem ao Git.

## 13. Nginx e TLS

O proxy reverso faz parte do Compose em `infra/nginx/default.conf.template`. Ele publica 80/443, redireciona HTTP para HTTPS e encaminha os hosts do painel, API, Keycloak e objetos. Configure no `.env.production`:

```env
APP_HOST=app.example.com
API_HOST=api.example.com
AUTH_HOST=auth.example.com
OBJECTS_HOST=objects.example.com
```

Instale um certificado que cubra os quatro nomes em `infra/nginx/certs/fullchain.pem` e a chave em `infra/nginx/certs/privkey.pem`. Os arquivos são ignorados pelo Git e o preflight bloqueia o deploy quando estiverem ausentes. Consulte `infra/nginx/README.md` para renovação e reload.
