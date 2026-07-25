export const apiActivityStatuses = [
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

export type ApiActivityStatus = (typeof apiActivityStatuses)[number];

export interface ApiActivity {
  id: string;
  tenantId: string;
  externalReference?: string;
  description: string;
  address: string;
  destinationLatitude?: number;
  destinationLongitude?: number;
  status: ApiActivityStatus;
  assignedDriverId?: string;
  version: number;
  createdAt: string;
  updatedAt: string;
  failure?: {
    reason: string;
    comment?: string;
    occurredAt: string;
    deviceId?: string;
  };
}

export interface CreateActivityInput {
  externalReference?: string;
  description: string;
  address: string;
  destinationLatitude?: number;
  destinationLongitude?: number;
}

export interface ActivityProof {
  id: string;
  activityId: string;
  version: number;
  status: string;
  sha256?: string | null;
  size?: number | null;
  validationUrl: string;
  downloadUrl?: string;
  expiresIn?: number;
}

export interface AssignActivityInput {
  driverId: string;
}

export interface LatestPosition {
  journeyId: string;
  driverId: string;
  driverName: string;
  latitude: number;
  longitude: number;
  accuracy: number;
  recordedAt: string;
  status: "online" | "stale";
}

export interface PlannedRoute {
  id: string;
  tenantId: string;
  name: string;
  plannedDate: string;
  status: "planned" | "published" | "in_progress" | "completed";
  driver: { id: string; name: string };
  stops: Array<{
    id: string;
    sequence: number;
    activity: {
      id: string;
      externalReference?: string | null;
      description: string;
      address: string;
      status: ApiActivityStatus;
    };
  }>;
}
export interface CreateRouteInput {
  name: string;
  plannedDate: string;
  driverId: string;
  activityIds: string[];
}

export interface DriverRecord {
  id: string;
  tenantId: string;
  companyId: string;
  name: string;
  document?: string | null;
}
export interface VehicleRecord {
  id: string;
  tenantId: string;
  companyId: string;
  plate: string;
}
export interface CreateDriverInput {
  companyId: string;
  name: string;
  document?: string;
}
export interface CreateVehicleInput {
  companyId: string;
  plate: string;
}
