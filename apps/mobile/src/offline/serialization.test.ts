import { describe, expect, it } from 'vitest';
import type { Activity } from '../domain/activity';
import { commandFromRow, deserializeActivity, serializeActivity } from './serialization';
describe('local serialization', () => {
  it('round-trips an activity', () => { const value: Activity = { id: '1', code: 'A', customer: 'C', address: 'X', window: '8h', kind: 'Entrega', status: 'assigned' }; expect(deserializeActivity(serializeActivity(value))).toEqual(value); });
  it('maps an outbox row', () => expect(commandFromRow({ id: 'c', type: 't', aggregate_id: 'a', occurred_at: 'now', sequence: 1, payload: '{"ok":true}', attempts: 0 })).toMatchObject({ aggregateId: 'a', payload: { ok: true } }));
});
