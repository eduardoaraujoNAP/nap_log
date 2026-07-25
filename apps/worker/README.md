# NAP Log Worker

Worker BullMQ responsável por jobs assíncronos e pelo dispatcher do outbox PostgreSQL.

## Variáveis de ambiente

| Variável               | Uso                                                                   |
| ---------------------- | --------------------------------------------------------------------- |
| `REDIS_URL`            | Redis/BullMQ; padrão `redis://127.0.0.1:6379`                         |
| `DATABASE_URL`         | PostgreSQL do outbox; sem ela o dispatcher fica desabilitado          |
| `S3_ENDPOINT`          | Endpoint privado S3/MinIO                                             |
| `S3_BUCKET`            | Bucket privado de comprovantes                                        |
| `S3_REGION`            | Região S3; padrão `us-east-1`                                         |
| `S3_ACCESS_KEY`        | Credencial de acesso ao S3 (`S3_ACCESS_KEY_ID` permanece compatível)  |
| `S3_SECRET_KEY`        | Segredo de acesso ao S3 (`S3_SECRET_ACCESS_KEY` permanece compatível) |
| `S3_FORCE_PATH_STYLE`  | Use `false` para desabilitar path-style; padrão habilitado            |
| `INTERNAL_API_URL`     | URL base da API interna, sem `/v1`                                    |
| `INTERNAL_SERVICE_KEY` | Chave enviada somente no header `x-service-key`                       |
| `HEALTH_PORT`          | Porta do endpoint `/health`; padrão `3002`                            |
| `WORKER_CONCURRENCY`   | Concorrência por fila; padrão `5`                                     |
| `OUTBOX_INTERVAL_MS`   | Intervalo de polling do outbox; padrão `2000`                         |

Após o upload determinístico do comprovante, o worker chama `POST /v1/internal/proofs/:id/ready`. Respostas não-2xx e falhas de rede mantêm o job retryable. Segredos nunca são incluídos nas mensagens de erro ou logs estruturados.
