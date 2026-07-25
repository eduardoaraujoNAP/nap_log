import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import type { ProofGenerationJob, ProofGenerationResult } from "./jobs.js";
import { buildProofPdf, proofObjectKey, sha256 } from "./proof.js";
import { notifyProofReady, proofCallbackConfig } from "./proof-callback.js";

const required = (name: string): string => {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required for proof generation`);
  return value;
};
const credential = (primary: string, legacy: string): string =>
  process.env[primary] ?? required(legacy);
export async function generateAndStoreProof(
  job: ProofGenerationJob,
): Promise<ProofGenerationResult> {
  const bucket = required("S3_BUCKET"),
    bytes = await buildProofPdf(job),
    digest = sha256(bytes),
    objectKey = proofObjectKey(job);
  const client = new S3Client({
    region: process.env.S3_REGION ?? "us-east-1",
    endpoint: required("S3_ENDPOINT"),
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE !== "false",
    credentials: {
      accessKeyId: credential("S3_ACCESS_KEY", "S3_ACCESS_KEY_ID"),
      secretAccessKey: credential("S3_SECRET_KEY", "S3_SECRET_ACCESS_KEY"),
    },
  });
  try {
    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: objectKey,
        Body: bytes,
        ContentType: "application/pdf",
        Metadata: {
          sha256: digest,
          tenant: job.tenantId,
          version: String(job.version),
        },
      }),
    );
  } finally {
    client.destroy();
  }
  return {
    bucket,
    objectKey,
    sha256: digest,
    size: bytes.length,
    version: job.version,
  };
}

export async function completeProofGeneration(
  job: ProofGenerationJob,
): Promise<ProofGenerationResult> {
  const result = await generateAndStoreProof(job);
  await notifyProofReady(job, result, proofCallbackConfig());
  return result;
}
