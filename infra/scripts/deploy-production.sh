#!/usr/bin/env sh
set -eu

env_file="${PRODUCTION_ENV_FILE:-.env.production}"
infra/scripts/preflight-production.sh "$env_file"
[ -z "$(git status --short)" ] || { echo "A árvore Git possui alterações; abortei o deploy" >&2; exit 2; }

if docker compose version >/dev/null 2>&1; then
  compose() { PRODUCTION_ENV_FILE="$env_file" docker compose --env-file "$env_file" -f docker-compose.prod.yml "$@"; }
else
  compose() { PRODUCTION_ENV_FILE="$env_file" docker-compose --env-file "$env_file" -f docker-compose.prod.yml "$@"; }
fi
compose build
compose up -d
compose ps
printf 'Deploy iniciado. Valide /v1/health, /v1/health/ready e o smoke funcional.\n'
