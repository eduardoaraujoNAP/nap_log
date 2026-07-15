# NAP Log API

Fundação NestJS/Fastify. Após instalar o workspace, execute `pnpm --filter @nap-log/api start:dev`.
API em `/v1`, health em `/v1/health` e OpenAPI em `/docs`. Rotas de domínio exigem
`x-tenant-id` UUID. O repositório em memória é uma porta temporária para Prisma/PostgreSQL.
O workspace raiz deve incluir este pacote no Turborepo e fornecer lint compartilhado.

## Banco e objetos

Configure `DATABASE_URL` e aplique `pnpm --filter @nap-log/api prisma:migrate`.
Evidências usam bucket privado S3/MinIO por meio de `S3_ENDPOINT`, `S3_REGION`,
`S3_BUCKET`, `S3_ACCESS_KEY` e `S3_SECRET_KEY`. URLs de upload expiram em
15 minutos; o bucket não deve permitir leitura pública.

Em containers, o healthcheck consulta `/v1/health`. A imagem espera que migrations
sejam executadas como job separado antes do rollout.

## Autenticação

Configure `OIDC_ISSUER` e `OIDC_AUDIENCE` para validar JWT Bearer do Keycloak.
`OIDC_JWKS_URI` é opcional e, por padrão, deriva do issuer. O token deve conter
`tenant_id` e as permissões em `permissions` ou roles do realm. O cabeçalho
`x-tenant-id` é aceito somente com `DEV_AUTH_BYPASS=true` fora de produção;
essa combinação encerra a inicialização quando `NODE_ENV=production`.
