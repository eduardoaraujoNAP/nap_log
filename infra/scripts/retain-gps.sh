#!/usr/bin/env sh
set -eu

: "${GPS_RETENTION_DAYS:=90}"
: "${POSTGRES_DB:?POSTGRES_DB is required}"
: "${POSTGRES_USER:?POSTGRES_USER is required}"

case "$GPS_RETENTION_DAYS" in
  *[!0-9]*|"") echo "GPS_RETENTION_DAYS must be a positive integer" >&2; exit 2 ;;
esac
[ "$GPS_RETENTION_DAYS" -gt 0 ] || { echo "GPS_RETENTION_DAYS must be positive" >&2; exit 2; }

sql="DELETE FROM gps_points WHERE recorded_at < NOW() - INTERVAL '${GPS_RETENTION_DAYS} days';"
if [ "${CONFIRM_RETENTION:-}" != "yes" ]; then
  printf 'Dry-run. Set CONFIRM_RETENTION=yes to execute:\n%s\n' "$sql"
  exit 0
fi

docker-compose exec -T postgres psql \
  --username "$POSTGRES_USER" \
  --dbname "$POSTGRES_DB" \
  --set ON_ERROR_STOP=1 \
  --command "$sql"
