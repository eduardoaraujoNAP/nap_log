# NAP Log

Plataforma multiempresa para gestão logística, rastreamento de motoristas e comprovação digital de entregas e retiradas.

## Estrutura

- `apps/api`: API NestJS/Fastify e documentação OpenAPI.
- `apps/web`: painel operacional Next.js.
- `apps/mobile`: aplicativo React Native/Expo offline-first.
- `packages/contracts`: contratos TypeScript compartilhados.
- `docker-compose.yml`: PostgreSQL/PostGIS, Redis, MinIO e Keycloak para desenvolvimento e piloto.

## Desenvolvimento local

1. Copie `.env.example` para `.env` e troque todas as credenciais.
2. Suba os serviços com `docker compose up -d`.
3. Instale dependências com `pnpm install`.
4. Execute `pnpm dev`.

Antes do primeiro uso, configure um realm e os clientes web/mobile/API no Keycloak e crie o bucket privado definido por `S3_BUCKET` no MinIO.

## Princípios

- Isolamento por tenant em toda operação de negócio.
- Eventos e auditoria imutáveis.
- Comandos móveis idempotentes e sincronização offline por outbox.
- Evidências privadas, com hash e versões imutáveis.
- GPS apenas durante jornada autorizada.

Consulte [architecture.md](./architecture.md) para os requisitos de produto e arquitetura.
