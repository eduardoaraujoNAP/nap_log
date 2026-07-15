export const activityStatuses = [
  'draft', 'awaiting_assignment', 'assigned', 'accepted', 'en_route',
  'near_destination', 'on_site', 'in_service', 'completed', 'failed',
  'rescheduled', 'canceled', 'returned',
] as const;

export type ActivityStatus = typeof activityStatuses[number];

export interface Activity {
  id: string;
  tenantId: string;
  externalReference?: string;
  description: string;
  address: string;
  status: ActivityStatus;
  assignedDriverId?: string;
  version: number;
  createdAt: string;
  updatedAt: string;
}
