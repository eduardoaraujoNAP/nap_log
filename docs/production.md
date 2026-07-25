# Implantação de produção

## Preparação

1. Copie `.env.production.example` para `.env.production`.
2. Substitua todos os valores `replace-*` por segredos aleatórios.
3. Configure DNS e TLS no proxy reverso para painel, API, Keycloak e o endpoint público do armazenamento (`S3_PUBLIC_ENDPOINT`).
4. Configure no Keycloak os claims `tenant_id`, `permissions` e, para motoristas, `driver_id`.
5. Crie o bucket privado definido por `S3_BUCKET`, com versionamento, criptografia e política de retenção.

Nunca versione `.env.production`. A API recusa inicialização em produção quando variáveis obrigatórias estão ausentes, o bypass está habilitado, os segredos internos são fracos ou as URLs públicas de comprovantes e armazenamento não usam HTTPS. O `S3_PUBLIC_ENDPOINT` deve encaminhar para o MinIO preservando o host usado na assinatura; o bucket continua privado.

## Validação e rollout

    PRODUCTION_ENV_FILE=.env.production docker compose --env-file .env.production -f docker-compose.prod.yml config
    PRODUCTION_ENV_FILE=.env.production docker compose --env-file .env.production -f docker-compose.prod.yml build
    PRODUCTION_ENV_FILE=.env.production docker compose --env-file .env.production -f docker-compose.prod.yml up -d

O serviço `migrate` aplica as migrações antes da API. O endpoint `/v1/health` é liveness e `/v1/health/ready` verifica acesso ao PostgreSQL.
Em volumes PostgreSQL novos, o bootstrap cria o schema isolado `keycloak`. Em bancos existentes, crie esse schema antes do primeiro rollout do serviço de identidade.

## Smoke tests

- Login e renovação de sessão no painel.
- Cadastro de motorista e veículo.
- Criação e atribuição de atividade.
- Login mobile com `tenant_id` e `driver_id`.
- Sincronização offline e envio de GPS.
- Upload de foto e assinatura.
- Geração e validação pública do comprovante.

Antes do go-live, execute restauração de backup em ambiente isolado conforme o runbook.
