import { describe, expect, it } from 'vitest';
import { buildLocationBatches } from './batching';
import type { LocationPoint } from './types';
const point = (id: string, time: string): LocationPoint => ({ id, journeyId: 'j1', recordedAt: time, latitude: -23, longitude: -46, accuracy: 10, speed: 2, heading: null });
describe('location batching', () => {
  it('orders, limits and creates stable idempotency keys', () => { const input = [point('b', '2026-01-01T00:01:00Z'), point('a', '2026-01-01T00:00:00Z'), point('c', '2026-01-01T00:02:00Z')]; const first = buildLocationBatches(input, 2); expect(first.map((batch) => batch.points.length)).toEqual([2, 1]); expect(first[0].points.map(({ id }) => id)).toEqual(['a', 'b']); expect(buildLocationBatches(input, 2)[0].idempotencyKey).toBe(first[0].idempotencyKey); });
  it('does not mix journeys', () => expect(() => buildLocationBatches([point('a', '1'), { ...point('b', '2'), journeyId: 'j2' }], 2)).toThrow());
});
