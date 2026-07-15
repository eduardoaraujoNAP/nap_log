import { Pool } from "pg";
import type { Queue } from "bullmq";
import { OutboxDispatcher } from "./outbox.js";
import { PostgresOutboxDatabase } from "./postgres-outbox.js";
import type { ProofGenerationJob } from "./jobs.js";

export function startOutboxDispatcher(queue: Queue<ProofGenerationJob>, databaseUrl: string, intervalMs = 2_000) {
  const pool = new Pool({ connectionString: databaseUrl, max: 5 });
  const dispatcher = new OutboxDispatcher(new PostgresOutboxDatabase(pool), { publish: async message => { await queue.add(message.name, message.data as ProofGenerationJob, { jobId: message.jobId }); } });
  let running = false;
  const tick = async () => { if (running) return; running = true; try { await dispatcher.dispatchBatch(); } catch (error) { console.error(JSON.stringify({ event: "outbox.error", error: error instanceof Error ? error.message : String(error) })); } finally { running = false; } };
  const timer = setInterval(() => { void tick(); }, intervalMs); timer.unref(); void tick();
  return { close: async () => { clearInterval(timer); while (running) await new Promise(resolve => setTimeout(resolve, 25)); await pool.end(); } };
}
