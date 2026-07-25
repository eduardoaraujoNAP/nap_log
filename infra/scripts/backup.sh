#!/usr/bin/env sh
set -eu

: "${BACKUP_DIR:?BACKUP_DIR is required}"
: "${POSTGRES_DB:?POSTGRES_DB is required}"
: "${POSTGRES_USER:?POSTGRES_USER is required}"

timestamp="$(date -u +%Y%m%dT%H%M%SZ)"
target="${BACKUP_DIR%/}/${timestamp}"
mkdir -p "$target"

docker-compose exec -T postgres pg_dump \
  --username "$POSTGRES_USER" \
  --dbname "$POSTGRES_DB" \
  --format=custom > "$target/postgres.dump"

if [ -n "${MINIO_BACKUP_ALIAS:-}" ]; then
  docker-compose exec -T minio mc mirror \
    --overwrite \
    "local/${S3_BUCKET:?S3_BUCKET is required}" \
    "${MINIO_BACKUP_ALIAS%/}/${timestamp}"
fi

sha256sum "$target/postgres.dump" > "$target/SHA256SUMS"
printf '%s\n' "$timestamp" > "$target/created-at.txt"
printf 'Backup concluído em %s\n' "$target"
