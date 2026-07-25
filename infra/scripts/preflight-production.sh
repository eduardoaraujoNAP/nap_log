#!/usr/bin/env sh
set -eu

env_file="${1:-.env.production}"
[ -f "$env_file" ] || { echo "Arquivo não encontrado: $env_file" >&2; exit 2; }
[ -r "$env_file" ] || { echo "Arquivo sem permissão de leitura: $env_file" >&2; exit 2; }

required='NODE_ENV POSTGRES_DB POSTGRES_USER POSTGRES_PASSWORD DATABASE_URL REDIS_PASSWORD REDIS_URL S3_ENDPOINT S3_PUBLIC_ENDPOINT S3_BUCKET S3_ACCESS_KEY S3_SECRET_KEY OIDC_ISSUER OIDC_AUDIENCE KEYCLOAK_HOSTNAME KEYCLOAK_ADMIN KEYCLOAK_ADMIN_PASSWORD INTERNAL_SERVICE_KEY INTERNAL_API_URL PUBLIC_PROOF_BASE_URL API_URL AUTH_URL AUTH_SECRET AUTH_KEYCLOAK_ID AUTH_KEYCLOAK_SECRET AUTH_KEYCLOAK_ISSUER APP_HOST API_HOST AUTH_HOST OBJECTS_HOST'
for name in $required; do
  line="$(grep -E "^${name}=" "$env_file" | tail -n 1 || true)"
  value="${line#*=}"
  [ -n "$line" ] && [ -n "$value" ] || { echo "Variável obrigatória ausente: $name" >&2; exit 2; }
  case "$value" in *replace-*|*change-me*) echo "Placeholder não substituído: $name" >&2; exit 2;; esac
done

value_of() { grep -E "^$1=" "$env_file" | tail -n 1 | cut -d= -f2-; }
[ "$(value_of NODE_ENV)" = production ] || { echo "NODE_ENV deve ser production" >&2; exit 2; }
for name in S3_PUBLIC_ENDPOINT PUBLIC_PROOF_BASE_URL AUTH_URL OIDC_ISSUER AUTH_KEYCLOAK_ISSUER; do
  case "$(value_of "$name")" in https://*) :;; *) echo "$name deve usar HTTPS" >&2; exit 2;; esac
done
for name in POSTGRES_PASSWORD REDIS_PASSWORD S3_SECRET_KEY KEYCLOAK_ADMIN_PASSWORD INTERNAL_SERVICE_KEY AUTH_SECRET AUTH_KEYCLOAK_SECRET; do
  [ "$(value_of "$name" | wc -c)" -ge 25 ] || { echo "$name deve ter pelo menos 24 caracteres" >&2; exit 2; }
done
for certificate in infra/nginx/certs/fullchain.pem infra/nginx/certs/privkey.pem; do
  [ -s "$certificate" ] || { echo "Certificado TLS ausente: $certificate" >&2; exit 2; }
done

if docker compose version >/dev/null 2>&1; then
  PRODUCTION_ENV_FILE="$env_file" docker compose --env-file "$env_file" -f docker-compose.prod.yml config --quiet
elif docker-compose version >/dev/null 2>&1; then
  PRODUCTION_ENV_FILE="$env_file" docker-compose --env-file "$env_file" -f docker-compose.prod.yml config --quiet
else
  echo "Docker Compose não encontrado" >&2
  exit 2
fi
printf 'Preflight de produção aprovado para %s\n' "$env_file"
