import type { JobsOptions } from "bullmq";

export interface WorkerConfig {
  redisUrl: string;
  healthPort: number;
  concurrency: number;
  heartbeatIntervalMs: number;
}

function positiveInteger(value: string | undefined, fallback: number, name: string): number {
  if (value === undefined) return fallback;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) throw new Error(`${name} must be a positive integer`);
  return parsed;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): WorkerConfig {
  const redisUrl = env.REDIS_URL ?? "redis://127.0.0.1:6379";
  const protocol = new URL(redisUrl).protocol;
  if (protocol !== "redis:" && protocol !== "rediss:") throw new Error("REDIS_URL must use redis:// or rediss://");
  return {
    redisUrl,
    healthPort: positiveInteger(env.HEALTH_PORT, 3002, "HEALTH_PORT"),
    concurrency: positiveInteger(env.WORKER_CONCURRENCY, 5, "WORKER_CONCURRENCY"),
    heartbeatIntervalMs: positiveInteger(env.HEARTBEAT_INTERVAL_MS, 15_000, "HEARTBEAT_INTERVAL_MS"),
  };
}

export const defaultJobOptions = {
  attempts: 5,
  backoff: { type: "exponential", delay: 2_000 },
  removeOnComplete: { age: 24 * 60 * 60, count: 1_000 },
  removeOnFail: { age: 7 * 24 * 60 * 60, count: 5_000 },
} as const satisfies JobsOptions;

export function redisConnection(redisUrl: string) {
  const url = new URL(redisUrl);
  const database = url.pathname.slice(1);
  return {
    host: url.hostname,
    port: Number(url.port || 6379),
    username: url.username ? decodeURIComponent(url.username) : undefined,
    password: url.password ? decodeURIComponent(url.password) : undefined,
    db: database ? Number(database) : 0,
    tls: url.protocol === "rediss:" ? {} : undefined,
    maxRetriesPerRequest: null,
  };
}
