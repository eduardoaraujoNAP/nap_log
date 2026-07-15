export const queueNames = {
  proofGeneration: "proof-generation",
  webhookDelivery: "webhook-delivery",
  notifications: "notifications",
  imports: "imports",
} as const;

export type QueueName = (typeof queueNames)[keyof typeof queueNames];

export interface ProofGenerationJob {
  activityId: string;
  proofId: string;
  tenantId: string;
  version: number;
  publicValidationUrl: string;
  snapshot: ProofSnapshot;
}

export interface ProofSnapshot {
  companyName: string; companyDocument?: string; activityReference: string;
  orderNumber?: string; invoiceNumber?: string; address: string; driverName: string;
  vehicleDescription: string; arrivedAt?: string; completedAt: string;
  receiver?: { nameMasked: string; documentMasked?: string };
  evidenceHashes: string[]; timeline: Array<{ at: string; label: string }>;
}

export interface ProofGenerationResult {
  bucket: string; objectKey: string; sha256: string; size: number; version: number;
}

export interface WebhookDeliveryJob {
  deliveryId: string;
  endpointId: string;
  eventId: string;
  tenantId: string;
}

export interface NotificationJob {
  notificationId: string;
  recipientId: string;
  channel: "push" | "email";
  tenantId: string;
}

export interface ImportJob {
  importId: string;
  objectKey: string;
  tenantId: string;
}

export interface JobPayloads {
  "proof-generation": ProofGenerationJob;
  "webhook-delivery": WebhookDeliveryJob;
  notifications: NotificationJob;
  imports: ImportJob;
}

export interface JobResults {
  "proof-generation": ProofGenerationResult;
  "webhook-delivery": never;
  notifications: never;
  imports: never;
}
