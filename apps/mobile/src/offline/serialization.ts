import type { Activity } from '../domain/activity';
import type { OutboxCommand } from './contracts';
export function serializeActivity(value: Activity): string { return JSON.stringify(value); }
export function deserializeActivity(value: string): Activity {
  const parsed: unknown = JSON.parse(value);
  if (!parsed || typeof parsed !== 'object' || !('id' in parsed) || !('status' in parsed)) throw new Error('Atividade local inválida');
  return parsed as Activity;
}
export function serializePayload(value: unknown): string { return JSON.stringify(value ?? null); }
export type OutboxRow = { id: string; type: string; aggregate_id: string; occurred_at: string; sequence: number; payload: string; attempts: number };
export function commandFromRow(row: OutboxRow): OutboxCommand { return { id: row.id, type: row.type, aggregateId: row.aggregate_id, occurredAt: row.occurred_at, sequence: row.sequence, payload: JSON.parse(row.payload), attempts: row.attempts }; }
