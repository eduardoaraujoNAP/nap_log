import assert from "node:assert/strict";
import test from "node:test";
import { defaultJobOptions, loadConfig, redisConnection } from "../src/config.js";
import { queueNames } from "../src/jobs.js";

test("declares the four stable queue names", () => {
  assert.deepEqual(Object.values(queueNames), ["proof-generation", "webhook-delivery", "notifications", "imports"]);
});

test("uses bounded exponential retry and retention", () => {
  assert.equal(defaultJobOptions.attempts, 5);
  assert.deepEqual(defaultJobOptions.backoff, { type: "exponential", delay: 2_000 });
  assert.equal(defaultJobOptions.removeOnComplete.count, 1_000);
  assert.equal(defaultJobOptions.removeOnFail.count, 5_000);
});

test("loads defaults and validates positive numeric settings", () => {
  assert.deepEqual(loadConfig({}), { redisUrl: "redis://127.0.0.1:6379", healthPort: 3002, concurrency: 5, heartbeatIntervalMs: 15_000 });
  assert.throws(() => loadConfig({ WORKER_CONCURRENCY: "0" }), /positive integer/);
  assert.throws(() => loadConfig({ REDIS_URL: "http://redis" }), /redis:\/\//);
});

test("parses authenticated TLS Redis URLs", () => {
  const connection = redisConnection("rediss://worker:secret@redis.internal:6380/2");
  assert.equal(connection.host, "redis.internal");
  assert.equal(connection.port, 6380);
  assert.equal(connection.username, "worker");
  assert.equal(connection.password, "secret");
  assert.equal(connection.db, 2);
  assert.deepEqual(connection.tls, {});
  assert.equal(connection.maxRetriesPerRequest, null);
});
