# Infraestrutura

O `docker-compose.yml` da raiz fornece as dependências de desenvolvimento e do piloto. As aplicações são executadas pelo workspace durante o desenvolvimento; imagens imutáveis da API e do painel serão adicionadas ao perfil de produção após os fluxos de persistência e autenticação estarem estabilizados.

Requisitos mínimos sugeridos para o piloto:

- 8 vCPU, 32 GB RAM e armazenamento SSD monitorado.
- Volume separado para PostgreSQL e MinIO.
- Destino externo para backups criptografados.
- DNS interno, certificado TLS válido e saída HTTPS para Mapbox, FCM e APNs.

Credenciais presentes nos defaults do Compose são exclusivamente locais e devem ser substituídas antes de qualquer homologação.

## Keycloak

O Compose importa automaticamente o realm `nap-log` em desenvolvimento. Ele
define os papéis `admin`, `manager`, `operator` e `driver`, além dos clientes
`nap-log-web` e `nap-log-mobile`. Nenhum usuário de demonstração é criado.

O segredo `change-me-dev-web-client-secret` do cliente web existe somente para
facilitar o bootstrap local. Ele deve ser obrigatoriamente rotacionado no
Keycloak e configurado por secret manager antes de homologação ou produção.

## Produção

O arquivo `docker-compose.prod.yml` contém API, painel, worker, migração e dependências com redes internas e health checks. As portas publicadas escutam em `127.0.0.1` e devem ficar atrás de proxy TLS.

O procedimento completo, incluindo secrets, DNS, Keycloak, S3, rollout, observabilidade, backup e rollback, está em [`docs/production.md`](../docs/production.md). A rotina diária de incidentes e restauração está em [`docs/runbook.md`](../docs/runbook.md).
