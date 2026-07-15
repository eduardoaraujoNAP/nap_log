import { Queue, Worker } from "bullmq";
import { defaultJobOptions, loadConfig, redisConnection } from "./config.js";
import { startHealthServer, type Heartbeat } from "./health.js";
import { queueNames, type JobPayloads, type JobResults, type QueueName } from "./jobs.js";
import { processors } from "./processors.js";
import { startOutboxDispatcher } from "./outbox-runtime.js";

const config = loadConfig();
const connection = redisConnection(config.redisUrl);
const names = Object.values(queueNames);
const queues = names.map(name => new Queue(name, { connection, defaultJobOptions }));

function createWorker<Name extends QueueName>(name: Name): Worker<JobPayloads[Name], JobResults[Name], string> {
  return new Worker<JobPayloads[Name], JobResults[Name], string>(name, processors[name], { connection, concurrency: config.concurrency });
}

const workers = names.map(name => createWorker(name));
const proofQueue = queues.find(queue => queue.name === queueNames.proofGeneration) as Queue<JobPayloads["proof-generation"]>;
const outbox = process.env.DATABASE_URL ? startOutboxDispatcher(proofQueue, process.env.DATABASE_URL, Number(process.env.OUTBOX_INTERVAL_MS ?? 2_000)) : undefined;
if (!outbox) console.warn(JSON.stringify({ event: "outbox.disabled", reason: "DATABASE_URL is not configured" }));

const now = new Date().toISOString();
const heartbeat: Heartbeat = { startedAt: now, lastBeatAt: now };
const heartbeatTimer = setInterval(() => { heartbeat.lastBeatAt = new Date().toISOString(); }, config.heartbeatIntervalMs);
heartbeatTimer.unref();
const healthServer = startHealthServer(config.healthPort, heartbeat);

for (const worker of workers) {
  worker.on("failed", (job, error) => console.error(JSON.stringify({ event: "job.failed", queue: worker.name, jobId: job?.id, error: error.message })));
  worker.on("error", error => console.error(JSON.stringify({ event: "worker.error", queue: worker.name, error: error.message })));
}

console.info(JSON.stringify({ event: "worker.started", queues: names, healthPort: config.healthPort }));

async function shutdown(signal: string): Promise<void> {
  console.info(JSON.stringify({ event: "worker.stopping", signal }));
  clearInterval(heartbeatTimer);
  await outbox?.close();
  await Promise.all(workers.map(worker => worker.close()));
  await Promise.all(queues.map(queue => queue.close()));
  await new Promise<void>((resolve, reject) => healthServer.close(error => error ? reject(error) : resolve()));
}

for (const signal of ["SIGTERM", "SIGINT"] as const) {
  process.once(signal, () => { void shutdown(signal).then(() => process.exit(0), error => { console.error(error); process.exit(1); }); });
}

export type { QueueName };
