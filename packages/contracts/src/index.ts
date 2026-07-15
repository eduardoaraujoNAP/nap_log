export const activityStates = [
  "draft",
  "awaiting_assignment",
  "assigned",
  "accepted",
  "en_route",
  "near_destination",
  "on_site",
  "in_service",
  "completed",
  "failed",
  "rescheduled",
  "canceled",
  "returned",
] as const;

export type ActivityState = (typeof activityStates)[number];

export const activityOutcomes = [
  "delivered",
  "picked_up",
  "partial",
  "unsuccessful",
] as const;

export type ActivityOutcome = (typeof activityOutcomes)[number];

export interface ActivitySummary {
  id: string;
  tenantId: string;
  code: string;
  operationType: string;
  customerName: string;
  address: string;
  scheduledStart: string;
  scheduledEnd: string;
  state: ActivityState;
  outcome?: ActivityOutcome;
  driverName?: string;
  updatedAt: string;
}

export type MobileCommandResultStatus =
  | "applied"
  | "duplicate"
  | "conflict"
  | "rejected";

export interface MobileCommand<T = Record<string, unknown>> {
  clientCommandId: string;
  deviceId: string;
  aggregateId: string;
  aggregateVersion: number;
  commandType: string;
  occurredAt: string;
  localSequence: number;
  payload: T;
}

export interface MobileCommandResult {
  clientCommandId: string;
  status: MobileCommandResultStatus;
  serverVersion?: number;
  problem?: {
    type: string;
    title: string;
    detail?: string;
  };
}

export interface GpsPointInput {
  id: string;
  recordedAt: string;
  latitude: number;
  longitude: number;
  accuracyMeters: number;
  speedMetersPerSecond?: number;
  headingDegrees?: number;
}

export interface ApiProblem {
  type: string;
  title: string;
  status: number;
  detail?: string;
  correlationId?: string;
  errors?: Record<string, string[]>;
}
