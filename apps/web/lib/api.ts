import type { ApiActivity, AssignActivityInput, CreateActivityInput } from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
export const isApiConfigured = Boolean(API_URL);

export class ApiError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
    this.name = "ApiError";
  }
}

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  if (!API_URL) throw new ApiError(0, "API não configurada");
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
