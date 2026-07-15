export interface Migration { version: number; statements: readonly string[]; }
export const LOCAL_SCHEMA_VERSION = 3;
export const migrations: readonly Migration[] = [
  { version: 1, statements: [
    'CREATE TABLE IF NOT EXISTS metadata (key TEXT PRIMARY KEY NOT NULL, value TEXT NOT NULL)',
    'CREATE TABLE IF NOT EXISTS activities (id TEXT PRIMARY KEY NOT NULL, body TEXT NOT NULL, updated_at TEXT NOT NULL)',
    'CREATE TABLE IF NOT EXISTS outbox (id TEXT PRIMARY KEY NOT NULL, type TEXT NOT NULL, aggregate_id TEXT NOT NULL, occurred_at TEXT NOT NULL, sequence INTEGER NOT NULL, payload TEXT NOT NULL, attempts INTEGER NOT NULL DEFAULT 0)',
    'CREATE INDEX IF NOT EXISTS outbox_sequence_idx ON outbox(sequence)',
  ] },
  { version: 2, statements: [
    'CREATE TABLE IF NOT EXISTS location_buffer (id TEXT PRIMARY KEY NOT NULL, journey_id TEXT NOT NULL, recorded_at TEXT NOT NULL, latitude REAL NOT NULL, longitude REAL NOT NULL, accuracy REAL, speed REAL, heading REAL)',
    'CREATE INDEX IF NOT EXISTS location_buffer_journey_time_idx ON location_buffer(journey_id, recorded_at)',
  ] },
  { version: 3, statements: [
    'CREATE TABLE IF NOT EXISTS evidence_manifests (id TEXT PRIMARY KEY NOT NULL, activity_id TEXT NOT NULL, body TEXT NOT NULL, status TEXT NOT NULL, updated_at TEXT NOT NULL)',
    'CREATE INDEX IF NOT EXISTS evidence_activity_idx ON evidence_manifests(activity_id)',
  ] },
];
export function pendingMigrations(currentVersion: number): readonly Migration[] {
  if (!Number.isInteger(currentVersion) || currentVersion < 0) throw new Error(`Versão local inválida: ${currentVersion}`);
  if (currentVersion > LOCAL_SCHEMA_VERSION) throw new Error(`Banco local ${currentVersion} é mais novo que o app ${LOCAL_SCHEMA_VERSION}`);
  return migrations.filter(({ version }) => version > currentVersion);
}
