# Runbook operacional

Use este documento durante a operação. A preparação e implantação completas estão em [production.md](./production.md).

## Verificação diária

1. Consulte `/v1/health` e `/v1/health/ready`.
2. Confirme API, worker, PostgreSQL, Redis, MinIO e Keycloak saudáveis.
3. Verifique espaço livre, conexões do banco, idade da fila mais antiga, jobs falhos e heartbeat do worker.
4. Confirme a execução do backup, o checksum e a cópia fora do host.
5. Investigue motoristas sem GPS durante jornadas ativas e comandos móveis pendentes.

## Backup e restauração

Execute `infra/scripts/backup.sh` diariamente. Registre commit da aplicação, versão do schema, horário, tamanho, checksum e destino externo.

Uma vez por mês:

1. Provisione ambiente isolado sem acesso ao tráfego real.
2. Verifique `SHA256SUMS`.
3. Restaure PostgreSQL e o bucket.
4. Inicie a mesma versão da aplicação.
5. Teste login, consulta, rota, evidência e comprovante.
6. Registre RPO, RTO, duração e resultado.

Não restaure sobre o banco ativo durante um ensaio.

## Incidente

1. Classifique impacto e declare responsável.
2. Preserve logs, correlation IDs e versão; não copie PII para canais de suporte.
3. Suspenda ingestão ou escrita quando houver risco de corrupção ou falta de espaço.
4. Revogue sessões e dispositivos comprometidos pelo Keycloak.
5. Reprocesse outbox/jobs apenas por operação idempotente e auditada.
6. Aplique o rollback descrito em `production.md` quando necessário.
7. Após recuperar, documente causa, impacto e prevenção.

## Rotação de segredos

Rotacione um segredo por vez, atualize os consumidores e valide health/smoke. Priorize imediatamente qualquer credencial exposta. Para OIDC, preserve uma janela controlada de transição; para `INTERNAL_SERVICE_KEY`, atualize API e worker na mesma janela.

## Escalonamento

Mantenha fora do repositório a lista atual de responsáveis, contatos do plantão, provedores de DNS/TLS, Keycloak, armazenamento e destino de backup.
