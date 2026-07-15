import type { ProofGenerationJob } from "./jobs.js";

export interface OutboxEvent {
  id: string;
  tenantId: string;
  eventType: string;
  payload: unknown;
  attempts: number;
}

export interface QueueMessage<T = unknown> {
  queue: "proof-generation";
  name: string;
  jobId: string;
  data: T;
}

export interface OutboxTransaction {
  selectPending(limit: number): Promise<OutboxEvent[]>;
  markPublished(id: string): Promise<void>;
  markFailed(id: string, attempts: number, nextAttemptAt: Date, error: string): Promise<void>;
}

export interface OutboxDatabase {
  transaction<T>(work: (transaction: OutboxTransaction) => Promise<T>): Promise<T>;
}

export interface JobPublisher { publish(message: QueueMessage): Promise<void> }

function isRecord(value: unknown): value is Record<string, unknown> { return typeof value === "object" && value !== null && !Array.isArray(value); }

export function mapOutboxEvent(event: OutboxEvent): QueueMessage<ProofGenerationJob> {
  if (event.eventType !== "proof.requested") throw new Error(`Unsupported outbox event type: ${event.eventType}`);
  if (!isRecord(event.payload)) throw new Error("proof.requested payload is invalid");
  const payload = event.payload;
  if (!isRecord(payload.snapshot)) throw new Error("proof.requested payload snapshot is invalid");
  for (const field of ["activityId", "proofId", "publicValidationUrl"] as const) if (typeof payload[field] !== "string" || !payload[field]) throw new Error(`proof.requested payload.${field} is required`);
  if (!Number.isInteger(payload.version) || Number(payload.version) < 1) throw new Error("proof.requested payload.version is invalid");
  const snapshot = payload.snapshot;
  for (const field of ["companyName", "activityReference", "address", "driverName", "vehicleDescription", "completedAt"] as const) if (typeof snapshot[field] !== "string" || !snapshot[field]) throw new Error(`proof.requested payload.snapshot.${field} is required`);
  if (!Array.isArray(snapshot.evidenceHashes) || !Array.isArray(snapshot.timeline)) throw new Error("proof.requested snapshot collections are invalid");
  return { queue: "proof-generation", name: "generate", jobId: event.id, data: { activityId: payload.activityId as string, proofId: payload.proofId as string, tenantId: event.tenantId, version: payload.version as number, publicValidationUrl: payload.publicValidationUrl as string, snapshot: payload.snapshot as unknown as ProofGenerationJob["snapshot"] } };
}

export function outboxBackoff(attempts: number, now = new Date()): Date {
  const delay = Math.min(2_000 * 2 ** Math.max(0, attempts), 15 * 60_000);
  return new Date(now.getTime() + delay);
}

export class OutboxDispatcher {
  constructor(private readonly database: OutboxDatabase, private readonly publisher: JobPublisher, private readonly batchSize = 25) {}

  dispatchBatch(): Promise<number> {
    return this.database.transaction(async transaction => {
      const events = await transaction.selectPending(this.batchSize);
      for (const event of events) {
        try { await this.publisher.publish(mapOutboxEvent(event)); await transaction.markPublished(event.id); }
        catch (reason) { const attempts = event.attempts + 1; const message = reason instanceof Error ? reason.message : "Unknown outbox publishing error"; await transaction.markFailed(event.id, attempts, outboxBackoff(event.attempts), message.slice(0, 1_000)); }
      }
      return events.length;
    });
  }
}
