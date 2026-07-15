import type { ProofGenerationJob, ProofGenerationResult } from "./jobs.js";

export interface ProofCallbackConfig { internalApiUrl: string; serviceKey: string }
export type Fetcher = (input: string | URL | Request, init?: RequestInit) => Promise<Response>;

export async function notifyProofReady(job: ProofGenerationJob, result: ProofGenerationResult, config: ProofCallbackConfig, fetcher: Fetcher = fetch): Promise<void> {
  const baseUrl = config.internalApiUrl.replace(/\/$/, "");
  if (!baseUrl || !config.serviceKey) throw new Error("Internal proof callback is not configured");
  let response: Response;
  try {
    response = await fetcher(`${baseUrl}/v1/internal/proofs/${encodeURIComponent(job.proofId)}/ready`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-service-key": config.serviceKey },
      body: JSON.stringify({ tenantId: job.tenantId, bucket: result.bucket, key: result.objectKey, sha256: result.sha256, size: result.size }),
      signal: AbortSignal.timeout(10_000),
    });
  } catch (error) {
    throw new Error("Internal proof callback request failed", { cause: error });
  }
  if (!response.ok) throw new Error(`Internal proof callback returned HTTP ${response.status}`);
}

export function proofCallbackConfig(env: NodeJS.ProcessEnv = process.env): ProofCallbackConfig {
  const internalApiUrl = env.INTERNAL_API_URL, serviceKey = env.INTERNAL_SERVICE_KEY;
  if (!internalApiUrl || !serviceKey) throw new Error("INTERNAL_API_URL and INTERNAL_SERVICE_KEY are required for proof callbacks");
  return { internalApiUrl, serviceKey };
}
