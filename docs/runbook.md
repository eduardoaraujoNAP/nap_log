# Runbook do piloto

## Verificações rotineiras

- API e dependências respondendo aos health checks.
- Espaço livre do PostgreSQL, MinIO e volume de backups.
- Idade da fila mais antiga e quantidade de itens na DLQ.
- Motoristas sem atualização de GPS e comandos móveis pendentes.
- Falhas de geração de PDF e entrega de webhooks.

## Backup e restauração

1. Executar backup lógico diário do PostgreSQL e cópia versionada dos buckets MinIO.
2. Criptografar e copiar o conjunto para um destino fora do nó de produção.
3. Registrar checksum, horário, versão do schema e resultado no inventário de backups.
4. Restaurar mensalmente em ambiente isolado e executar smoke tests de login, consulta de atividade e comprovante.

## Incidentes

- Suspender ingestão externa quando houver risco de corrupção ou falta de espaço.
- Preservar logs de auditoria e correlation IDs; nunca copiar PII para canais de suporte.
- Revogar sessões e dispositivos comprometidos pelo Keycloak/API.
- Reprocessar outbox ou webhooks somente por operação idempotente e auditada.
