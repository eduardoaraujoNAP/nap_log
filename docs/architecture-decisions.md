# Decisões de arquitetura

## ADR-001 — Monólito modular

O backend começa como um único deploy NestJS, organizado por módulos de domínio. Processos demorados serão executados por workers separados usando uma fila compartilhada. A divisão em serviços independentes somente ocorrerá após métricas indicarem necessidade de escala ou isolamento operacional.

## ADR-002 — Isolamento multiempresa

`tenant` representa o cliente da plataforma; empresas e filiais pertencem a um tenant. Toda entidade de negócio leva `tenant_id`, e toda leitura ou escrita valida o tenant obtido da identidade autenticada. O header usado durante o desenvolvimento não será autoridade em produção.

## ADR-003 — Offline e idempotência

O aplicativo mantém banco local e outbox durável. Comandos recebem UUID, sequência local, horário de ocorrência e versão conhecida do agregado. O servidor responde individualmente com `applied`, `duplicate`, `conflict` ou `rejected`; nenhum arquivo é removido antes do ACK durável.

## ADR-004 — Evidências imutáveis

Fotos, assinaturas e comprovantes são objetos privados e versionados. Cada arquivo possui SHA-256 e metadados auditáveis. Uma correção cria nova versão, nunca substitui silenciosamente a anterior.

## ADR-005 — Operação on-premises do piloto

O piloto usa Docker Compose em um nó resiliente com PostgreSQL/PostGIS, Redis, MinIO e Keycloak. Backups são criptografados e copiados para fora do servidor. Alta disponibilidade em cluster fica condicionada aos resultados e requisitos do piloto.
