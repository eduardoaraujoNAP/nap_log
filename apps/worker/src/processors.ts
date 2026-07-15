import { UnrecoverableError, type Job, type Processor } from "bullmq";
import type { JobPayloads, JobResults, QueueName } from "./jobs.js";
import { completeProofGeneration } from "./proof-storage.js";

function unavailable(queueName: QueueName): never {
  throw new UnrecoverableError(`Processor for ${queueName} is not implemented yet`);
}

export const processors: { [Name in QueueName]: Processor<JobPayloads[Name], JobResults[Name], string> } = {
  "proof-generation": async (job: Job<JobPayloads["proof-generation"]>) => completeProofGeneration(job.data),
  "webhook-delivery": async (_job: Job<JobPayloads["webhook-delivery"]>) => unavailable("webhook-delivery"),
  notifications: async (_job: Job<JobPayloads["notifications"]>) => unavailable("notifications"),
  imports: async (_job: Job<JobPayloads["imports"]>) => unavailable("imports"),
};
