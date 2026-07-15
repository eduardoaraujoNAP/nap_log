export type ActivityStatus = "Em rota" | "No local" | "Pendente" | "Concluída" | "Atenção";

export interface Activity {
  id: string;
  reference: string;
  customer: string;
  address: string;
  driver: string;
  status: ActivityStatus;
  scheduledAt: string;
  kind: "Entrega" | "Coleta";
}

export interface DriverPosition {
  id: string;
  name: string;
  initials: string;
  vehicle: string;
  status: "Em rota" | "Disponível" | "Parado";
  lastUpdate: string;
  x: number;
  y: number;
}

export interface DashboardMetric {
  label: string;
  value: string;
  detail: string;
  trend?: string;
  tone: "blue" | "green" | "orange" | "purple";
}

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
