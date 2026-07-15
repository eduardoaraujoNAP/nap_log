import type { Activity } from '../domain/activity';
import type { LocationPoint } from '../location/types';
import type { EvidenceManifest } from '../evidence/types';
import type { LocalStore, OutboxCommand } from './contracts';
import { pendingMigrations } from './migrations';
import { commandFromRow, deserializeActivity, serializeActivity, serializePayload, type OutboxRow } from './serialization';
type BindValue = string | number | null;
export interface SQLiteDatabaseAdapter {
  execAsync(source: string): Promise<void>;
  runAsync(source: string, ...params: BindValue[]): Promise<unknown>;
  getFirstAsync<T>(source: string, ...params: BindValue[]): Promise<T | null>;
  getAllAsync<T>(source: string, ...params: BindValue[]): Promise<T[]>;
  withTransactionAsync(task: () => Promise<void>): Promise<void>;
}
export class SQLiteLocalStore implements LocalStore {
  constructor(private readonly db: SQLiteDatabaseAdapter) {}
  async initialize() {
    await this.db.execAsync('PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL;');
    const row = await this.db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
    for (const migration of pendingMigrations(row?.user_version ?? 0)) await this.db.withTransactionAsync(async () => {
      for (const statement of migration.statements) await this.db.execAsync(statement);
      await this.db.execAsync(`PRAGMA user_version = ${migration.version}`);
    });
  }
  async listActivities() { return (await this.db.getAllAsync<{ body: string }>('SELECT body FROM activities ORDER BY updated_at, id')).map(({ body }) => deserializeActivity(body)); }
  async saveActivities(activities: Activity[]) { const now = new Date().toISOString(); await this.db.withTransactionAsync(async () => { for (const item of activities) await this.db.runAsync('INSERT INTO activities (id, body, updated_at) VALUES (?, ?, ?) ON CONFLICT(id) DO UPDATE SET body = excluded.body, updated_at = excluded.updated_at', item.id, serializeActivity(item), now); }); }
  async getMetadata(key: string) { return (await this.db.getFirstAsync<{ value: string }>('SELECT value FROM metadata WHERE key = ?', key))?.value; }
  async setMetadata(key: string, value: string) { await this.db.runAsync('INSERT INTO metadata (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value', key, value); }
  async saveEvidenceManifest(manifest: EvidenceManifest) { await this.db.runAsync('INSERT INTO evidence_manifests (id, activity_id, body, status, updated_at) VALUES (?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET body = excluded.body, status = excluded.status, updated_at = excluded.updated_at', manifest.id, manifest.activityId, JSON.stringify(manifest), manifest.status, manifest.updatedAt); }
  async getEvidenceManifest(id: string) { const row = await this.db.getFirstAsync<{ body: string }>('SELECT body FROM evidence_manifests WHERE id = ?', id); return row ? JSON.parse(row.body) as EvidenceManifest : undefined; }
  async saveLocationPoints(points: LocationPoint[]) { await this.db.withTransactionAsync(async () => { for (const p of points) await this.db.runAsync('INSERT OR IGNORE INTO location_buffer (id, journey_id, recorded_at, latitude, longitude, accuracy, speed, heading) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', p.id, p.journeyId, p.recordedAt, p.latitude, p.longitude, p.accuracy, p.speed, p.heading); }); }
  async pendingLocationPoints(journeyId: string, limit = 100) { return this.db.getAllAsync<LocationPoint>('SELECT id, journey_id AS journeyId, recorded_at AS recordedAt, latitude, longitude, accuracy, speed, heading FROM location_buffer WHERE journey_id = ? ORDER BY recorded_at, id LIMIT ?', journeyId, limit); }
  async acknowledgeLocationPoints(ids: string[]) { await this.db.withTransactionAsync(async () => { for (const id of ids) await this.db.runAsync('DELETE FROM location_buffer WHERE id = ?', id); }); }
  async enqueue(command: OutboxCommand) { await this.db.runAsync('INSERT OR IGNORE INTO outbox (id, type, aggregate_id, occurred_at, sequence, payload, attempts) VALUES (?, ?, ?, ?, ?, ?, ?)', command.id, command.type, command.aggregateId, command.occurredAt, command.sequence, serializePayload(command.payload), command.attempts); }
  async pendingCommands() { return (await this.db.getAllAsync<OutboxRow>('SELECT * FROM outbox ORDER BY sequence, occurred_at, id')).map(commandFromRow); }
  async acknowledge(ids: string[]) { await this.db.withTransactionAsync(async () => { for (const id of ids) await this.db.runAsync('DELETE FROM outbox WHERE id = ?', id); }); }
}
export async function openSQLiteLocalStore() { const SQLite = await import('expo-sqlite'); return new SQLiteLocalStore(await SQLite.openDatabaseAsync('nap-log.db')); }
