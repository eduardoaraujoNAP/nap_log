import type { ApiActivity, AssignActivityInput, CreateActivityInput, CreateDriverInput, CreateVehicleInput, DriverRecord, LatestPosition, VehicleRecord } from "./types";

export class ApiError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
    this.name = "ApiError";
  }
}

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`/api${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init.headers },
  });
  if (!response.ok) {
    const body = await response.json().catch(() => null) as { message?: string | string[] } | null;
    const detail = Array.isArray(body?.message) ? body.message.join("; ") : body?.message;
    throw new ApiError(response.status, detail ?? `A API respondeu com status ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export const activitiesApi = {
  list: () => apiRequest<ApiActivity[]>("/activities", { cache: "no-store" }),
  create: (input: CreateActivityInput) => apiRequest<ApiActivity>("/activities", { method: "POST", body: JSON.stringify(input) }),
  assign: (id: string, input: AssignActivityInput) => apiRequest<ApiActivity>(`/activities/${id}/assign`, { method: "POST", body: JSON.stringify(input) }),
};

export const trackingApi = {
  positions: () => apiRequest<LatestPosition[]>("/tracking/positions", { cache: "no-store" }),
};

export const fleetApi = {
  drivers: () => apiRequest<DriverRecord[]>("/drivers", { cache: "no-store" }),
  createDriver: (input:CreateDriverInput) => apiRequest<DriverRecord>("/drivers", { method:"POST",body:JSON.stringify(input) }),
  vehicles: () => apiRequest<VehicleRecord[]>("/vehicles", { cache: "no-store" }),
  createVehicle: (input:CreateVehicleInput) => apiRequest<VehicleRecord>("/vehicles", { method:"POST",body:JSON.stringify(input) }),
};
