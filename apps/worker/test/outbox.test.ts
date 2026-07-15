import assert from "node:assert/strict";
import test from "node:test";
import { mapOutboxEvent, outboxBackoff, OutboxDispatcher, type JobPublisher, type OutboxEvent, type OutboxTransaction } from "../src/outbox.js";

const event: OutboxEvent = { id: "event-1", tenantId: "tenant-1", eventType: "proof.requested", attempts: 0, payload: { activityId: "activity-1", proofId: "proof-1", version: 1, publicValidationUrl: "https://proof.test/p/opaque", snapshot: { companyName: "Company", activityReference: "ENT-1", address: "Rua A, 10", driverName: "Driver", vehicleDescription: "Van ABC-1234", completedAt: "2026-07-15T00:00:00Z", evidenceHashes: [], timeline: [] } } };

test("maps proof.requested to an idempotent proof job", () => {
  const message = mapOutboxEvent(event);
  assert.equal(message.queue, "proof-generation"); assert.equal(message.jobId, event.id); assert.equal(message.data.tenantId, event.tenantId); assert.equal(message.data.activityId, "activity-1");
  assert.throws(() => mapOutboxEvent({ ...event, eventType: "unknown" }), /Unsupported/);
});

test("computes capped exponential outbox backoff", () => {
  const now = new Date("2026-07-15T00:00:00Z");
  assert.equal(outboxBackoff(0, now).getTime() - now.getTime(), 2_000);
  assert.equal(outboxBackoff(3, now).getTime() - now.getTime(), 16_000);
  assert.equal(outboxBackoff(99, now).getTime() - now.getTime(), 15 * 60_000);
});

test("publishes and marks success while retaining failed events", async () => {
  const second = { ...event, id: "event-2", attempts: 2 };
  const published: string[] = [], marked: string[] = [], failed: Array<{ id: string; attempts: number }> = [];
  const transaction: OutboxTransaction = { selectPending: async limit => { assert.equal(limit, 10); return [event, second]; }, markPublished: async id => { marked.push(id); }, markFailed: async (id, attempts) => { failed.push({ id, attempts }); } };
  let transactionCalls = 0;
  const database = { transaction: async <T>(work: (tx: OutboxTransaction) => Promise<T>) => { transactionCalls++; return work(transaction); } };
  const publisher: JobPublisher = { publish: async message => { published.push(message.jobId); if (message.jobId === "event-2") throw new Error("redis unavailable"); } };
  const count = await new OutboxDispatcher(database, publisher, 10).dispatchBatch();
  assert.equal(count, 2); assert.equal(transactionCalls, 1); assert.deepEqual(published, ["event-1", "event-2"]); assert.deepEqual(marked, ["event-1"]); assert.deepEqual(failed, [{ id: "event-2", attempts: 3 }]);
});
