import { describe, expect, it } from 'vitest';
import { DEFAULT_TRACKING_POLICY, normalizeTrackingPolicy } from './policy';
describe('tracking policy', () => {
  it('uses the operational baseline', () => expect(normalizeTrackingPolicy()).toEqual(DEFAULT_TRACKING_POLICY));
  it('accepts a safe configurable cadence', () => expect(normalizeTrackingPolicy({ timeIntervalMs: 60_000 }).timeIntervalMs).toBe(60_000));
  it('rejects excessive cadence', () => expect(() => normalizeTrackingPolicy({ timeIntervalMs: 1_000 })).toThrow());
});
