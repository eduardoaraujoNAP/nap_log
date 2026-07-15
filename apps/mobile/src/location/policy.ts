export interface TrackingPolicy { timeIntervalMs: number; distanceIntervalM: number; batchSize: number; }
export const DEFAULT_TRACKING_POLICY: TrackingPolicy = { timeIntervalMs: 30_000, distanceIntervalM: 100, batchSize: 100 };
export function normalizeTrackingPolicy(value: Partial<TrackingPolicy> = {}): TrackingPolicy {
  const policy = { ...DEFAULT_TRACKING_POLICY, ...value };
  if (policy.timeIntervalMs < 10_000 || policy.distanceIntervalM < 10 || policy.batchSize < 1 || policy.batchSize > 500) throw new Error('Política de rastreamento inválida');
  return policy;
}
