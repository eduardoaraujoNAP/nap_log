export const apiActivityStatuses = [
  "draft", "awaiting_assignment", "assigned", "accepted", "en_route",
  "near_destination", "on_site", "in_service", "completed", "failed",
  "rescheduled", "canceled", "returned",
] as const;

export type ApiActivityStatus = (typeof apiActivityStatuses)[number];

export interface ApiActivity {
  id: string;
  tenantId: string;
  externalReference?: string;
  description: string;
  address: string;
  status: ApiActivityStatus;
  assignedDriverId?: string;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateActivityInput {
  externalReference?: string;
  description: string;
  address: string;
}

export interface AssignActivityInput { driverId: string }

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

export interface DriverRecord { id:string;tenantId:string;companyId:string;name:string;document?:string|null }
export interface VehicleRecord { id:string;tenantId:string;companyId:string;plate:string }
export interface CreateDriverInput { companyId:string;name:string;document?:string }
export interface CreateVehicleInput { companyId:string;plate:string }
