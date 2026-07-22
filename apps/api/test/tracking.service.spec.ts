import {
  POSITION_STALE_AFTER_MS,
  positionStatus,
} from '../src/modules/tracking/tracking.module';

describe('tracking position status', () => {
  const now = new Date('2026-07-21T15:00:00.000Z');

  it('keeps a position online through the freshness window', () => {
    const recordedAt = new Date(now.getTime() - POSITION_STALE_AFTER_MS);

    expect(positionStatus(recordedAt, now)).toBe('online');
  });

  it('marks a position stale after the freshness window', () => {
    const recordedAt = new Date(now.getTime() - POSITION_STALE_AFTER_MS - 1);

    expect(positionStatus(recordedAt, now)).toBe('stale');
  });
});
