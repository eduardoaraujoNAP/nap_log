import { Pool, type PoolClient } from "pg";
import type { OutboxDatabase, OutboxEvent, OutboxTransaction } from "./outbox.js";

class PgTransaction implements OutboxTransaction {
  constructor(private readonly client: PoolClient) {}
  async selectPending(limit: number): Promise<OutboxEvent[]> {
    const result = await this.client.query<{ id: string; tenant_id: string; event_type: string; payload: unknown; attempts: number }>(`SELECT id, tenant_id, type AS event_type, payload, attempts FROM outbox_events WHERE status = $1 AND (next_attempt_at IS NULL OR next_attempt_at <= NOW()) ORDER BY created_at FOR UPDATE SKIP LOCKED LIMIT $2`, ["pending", limit]);
    return result.rows.map(row => ({ id: row.id, tenantId: row.tenant_id, eventType: row.event_type, payload: row.payload, attempts: row.attempts }));
  }
  async markPublished(id: string): Promise<void> { await this.client.query(`UPDATE outbox_events SET status = $1, processed_at = NOW() WHERE id = $2`, ["published", id]); }
  async markFailed(id: string, attempts: number, nextAttemptAt: Date, _error: string): Promise<void> { await this.client.query(`UPDATE outbox_events SET attempts = $1, next_attempt_at = $2 WHERE id = $3`, [attempts, nextAttemptAt, id]); }
}

export class PostgresOutboxDatabase implements OutboxDatabase {
  constructor(private readonly pool: Pool) {}
  async transaction<T>(work: (transaction: OutboxTransaction) => Promise<T>): Promise<T> {
    const client = await this.pool.connect();
    try { await client.query("BEGIN"); const result = await work(new PgTransaction(client)); await client.query("COMMIT"); return result; }
    catch (error) { await client.query("ROLLBACK"); throw error; }
    finally { client.release(); }
  }
}
