import assert from "node:assert/strict";
import test from "node:test";
import type { ProofGenerationJob } from "../src/jobs.js";
import { buildProofPdf, proofObjectKey, sha256 } from "../src/proof.js";

const job: ProofGenerationJob = { tenantId: "tenant-123", activityId: "activity-456", proofId: "proof-789", version: 2, publicValidationUrl: "https://proofs.example.test/p/opaque-token-only", snapshot: { companyName: "NAP Transportes", companyDocument: "**.***.***/****-**", activityReference: "ENT-10482", orderNumber: "PED-123", invoiceNumber: "NF-987", address: "Av. Paulista, 1000, São Paulo - SP", driverName: "Carlos Mendes", vehicleDescription: "Fiorino ABC-1D23", arrivedAt: "2026-07-15T12:30:00.000Z", completedAt: "2026-07-15T13:00:00.000Z", receiver: { nameMasked: "M*** S***", documentMasked: "***.***.***-12" }, evidenceHashes: ["a".repeat(64), "b".repeat(64)], timeline: [{ at: "2026-07-15T12:30:00.000Z", label: "Chegada confirmada" }, { at: "2026-07-15T13:00:00.000Z", label: "Entrega concluída" }] } };

test("builds a deterministic PDF and stable SHA-256", async () => {
  const first = await buildProofPdf(job), second = await buildProofPdf(job);
  assert.equal(Buffer.from(first.subarray(0, 5)).toString(), "%PDF-");
  assert.deepEqual(first, second); assert.match(sha256(first), /^[a-f0-9]{64}$/); assert.equal(sha256(first), sha256(second));
});
test("creates a private versioned object key", () => {
  assert.equal(proofObjectKey(job), "tenants/tenant-123/proofs/activity-456/v2/proof-789.pdf");
  assert.throws(() => proofObjectKey({ ...job, proofId: "../escape" }), /unsafe/); assert.throws(() => proofObjectKey({ ...job, version: 0 }), /positive integer/);
});
test("rejects public QR URLs without HTTPS", async () => { await assert.rejects(buildProofPdf({ ...job, publicValidationUrl: "http://example.test/p/token" }), /HTTPS/); });
