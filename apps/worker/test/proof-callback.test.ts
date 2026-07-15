import assert from "node:assert/strict";
import test from "node:test";
import type { ProofGenerationJob, ProofGenerationResult } from "../src/jobs.js";
import { notifyProofReady, type Fetcher } from "../src/proof-callback.js";

const job = { proofId: "proof-123", tenantId: "tenant-456" } as ProofGenerationJob;
const result: ProofGenerationResult = { bucket: "private-proofs", objectKey: "tenants/tenant-456/proofs/a/v1/proof-123.pdf", sha256: "a".repeat(64), size: 2048, version: 1 };
const config = { internalApiUrl: "http://api.internal:3001/", serviceKey: "super-secret-value" };

test("posts the ready callback with service authentication and exact payload", async () => {
  let capturedUrl = "", capturedInit: RequestInit | undefined;
  const fake: Fetcher = async (input, init) => { capturedUrl = String(input); capturedInit = init; return new Response(null, { status: 204 }); };
  await notifyProofReady(job, result, config, fake);
  assert.equal(capturedUrl, "http://api.internal:3001/v1/internal/proofs/proof-123/ready");
  assert.equal(capturedInit?.method, "POST");
  assert.equal((capturedInit?.headers as Record<string, string>)["x-service-key"], config.serviceKey);
  assert.deepEqual(JSON.parse(String(capturedInit?.body)), { tenantId: "tenant-456", bucket: "private-proofs", key: result.objectKey, sha256: result.sha256, size: 2048 });
});

test("treats HTTP 500 as a retryable error without including the secret", async () => {
  const fake: Fetcher = async () => new Response(null, { status: 500 });
  await assert.rejects(notifyProofReady(job, result, config, fake), error => error instanceof Error && /HTTP 500/.test(error.message) && !error.message.includes(config.serviceKey));
});

test("accepts a successful 200 response", async () => {
  await assert.doesNotReject(notifyProofReady(job, result, config, async () => new Response("{}", { status: 200 })));
});
