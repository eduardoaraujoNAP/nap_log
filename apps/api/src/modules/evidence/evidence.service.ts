import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomBytes, randomUUID } from "node:crypto";
import { ActivityStatus, Prisma } from "@prisma/client";
import { PrismaService } from "../../database/prisma.service";
import {
  CompleteActivityDto,
  CompleteUploadDto,
  InitiateUploadDto,
  ProofReadyDto,
} from "./evidence.dto";
function maskName(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .map(
      (part) => `${part[0] ?? ""}${"*".repeat(Math.max(0, part.length - 1))}`,
    )
    .join(" ");
}
@Injectable()
export class EvidenceService {
  private readonly s3: S3Client;
  private readonly downloadS3: S3Client;
  private readonly bucket: string;
  private readonly serviceKey: string;
  private readonly publicBase: string;
  constructor(
    private readonly prisma: PrismaService,
    c: ConfigService,
  ) {
    this.bucket = c.get("S3_BUCKET", "nap-log-private");
    this.serviceKey = c.get("INTERNAL_SERVICE_KEY", "change-me-worker-secret");
    this.publicBase = c.get(
      "PUBLIC_PROOF_BASE_URL",
      "http://localhost:3001/v1/public/proofs",
    );
    const options = {
      region: c.get("S3_REGION", "us-east-1"),
      forcePathStyle: true,
      credentials: {
        accessKeyId: c.get("S3_ACCESS_KEY", "minio"),
        secretAccessKey: c.get("S3_SECRET_KEY", "change-me"),
      },
    };
    this.s3 = new S3Client({ ...options, endpoint: c.get("S3_ENDPOINT") });
    this.downloadS3 = new S3Client({
      ...options,
      endpoint: c.get("S3_PUBLIC_ENDPOINT", c.get("S3_ENDPOINT")),
    });
  }
  async initiate(t: string, d: InitiateUploadDto) {
    const a = await this.prisma.activity.findUnique({
      where: { tenantId_id: { tenantId: t, id: d.activityId } },
    });
    if (!a) throw new NotFoundException("Activity not found");
    const id = randomUUID(),
      key = `tenants/${t}/activities/${d.activityId}/${id}`;
    await this.prisma.evidence.create({
      data: {
        id,
        tenantId: t,
        activityId: d.activityId,
        kind: d.kind,
        origin: d.origin,
        objectKey: key,
        mimeType: d.mimeType,
        expectedSize: d.size,
        expectedSha256: d.sha256,
      },
    });
    return {
      id,
      uploadUrl: await getSignedUrl(
        this.s3,
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: key,
          ContentType: d.mimeType,
          ContentLength: d.size,
          Metadata: { sha256: d.sha256 },
        }),
        { expiresIn: 900 },
      ),
      expiresIn: 900,
    };
  }
  async complete(t: string, id: string, d: CompleteUploadDto) {
    const e = await this.prisma.evidence.findUnique({
      where: { tenantId_id: { tenantId: t, id } },
    });
    if (!e) throw new NotFoundException("Upload not found");
    if (e.status === "confirmed") return e;
    if (e.expectedSize !== d.size || e.expectedSha256 !== d.sha256)
      throw new BadRequestException("Upload metadata mismatch");
    const h = await this.s3.send(
      new HeadObjectCommand({ Bucket: this.bucket, Key: e.objectKey }),
    );
    if (h.ContentLength !== d.size || h.Metadata?.sha256 !== d.sha256)
      throw new BadRequestException("Stored object mismatch");
    return this.prisma.evidence.update({
      where: { tenantId_id: { tenantId: t, id } },
      data: {
        status: "confirmed",
        actualSize: d.size,
        sha256: d.sha256,
        confirmedAt: new Date(),
      },
    });
  }
  async completeActivity(
    t: string,
    activityId: string,
    d: CompleteActivityDto,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const a = await tx.activity.findUnique({
        where: { tenantId_id: { tenantId: t, id: activityId } },
        include: {
          tenant: { select: { name: true } },
          company: { select: { name: true, taxId: true } },
          assignments: {
            where: { endedAt: null },
            orderBy: { assignedAt: "desc" },
            take: 1,
            include: { driver: { select: { name: true } } },
          },
          events: {
            orderBy: { occurredAt: "asc" },
            select: { type: true, occurredAt: true },
          },
        },
      });
      if (!a) throw new NotFoundException("Activity not found");
      const old = await tx.proof.findFirst({
        where: { tenantId: t, activityId },
        orderBy: { version: "desc" },
      });
      if (a.status === ActivityStatus.COMPLETED && old) return old;
      if (
        a.status !== ActivityStatus.ON_SITE &&
        a.status !== ActivityStatus.IN_SERVICE
      )
        throw new ConflictException("Invalid activity transition");
      const ev = await tx.evidence.findMany({
          where: { tenantId: t, activityId, status: "confirmed" },
        }),
        k = new Set(ev.map((e) => e.kind));
      if (!k.has("photo_material") || !k.has("signature"))
        throw new BadRequestException("Required evidence missing");
      const version = (old?.version ?? 0) + 1,
        completedAt = new Date();
      await tx.receiver.create({
        data: { tenantId: t, activityId, name: d.receiverName, version },
      });
      const manifest = {
          activityId,
          version,
          receiverName: d.receiverName,
          evidences: ev.map((e) => ({
            id: e.id,
            kind: e.kind,
            sha256: e.sha256,
            origin: e.origin,
            version: e.version,
          })),
        },
        publicCode = randomBytes(24).toString("base64url");
      const proof = await tx.proof.create({
        data: {
          tenantId: t,
          activityId,
          version,
          status: "pending",
          publicCode,
          manifest: manifest as Prisma.InputJsonValue,
        },
      });
      await tx.proofEvidence.createMany({
        data: ev.map((e) => ({
          tenantId: t,
          proofId: proof.id,
          evidenceId: e.id,
        })),
      });
      const events = a.events ?? [],
        arrival = events.find(
          (e) =>
            e.type === "activity.arrive_activity" ||
            e.type === "activity.arrived",
        ),
        snapshot = {
          companyName:
            a.company?.name ?? a.tenant?.name ?? "Empresa não informada",
          companyDocument: a.company?.taxId,
          activityReference: a.externalReference ?? a.id,
          address: a.address,
          driverName:
            a.assignments?.[0]?.driver.name ?? "Motorista não informado",
          vehicleDescription: "Veículo não informado",
          arrivedAt: arrival?.occurredAt.toISOString(),
          completedAt: completedAt.toISOString(),
          receiver: { nameMasked: maskName(d.receiverName) },
          evidenceHashes: ev.flatMap((e) => (e.sha256 ? [e.sha256] : [])),
          timeline: [
            ...events.map((e) => ({
              at: e.occurredAt.toISOString(),
              label: e.type,
            })),
            { at: completedAt.toISOString(), label: "Atividade concluída" },
          ],
        };
      await tx.outboxEvent.create({
        data: {
          tenantId: t,
          type: "proof.requested",
          aggregateId: proof.id,
          payload: {
            activityId,
            proofId: proof.id,
            version,
            publicValidationUrl: `${this.publicBase}/${publicCode}/validate`,
            snapshot,
          } as Prisma.InputJsonValue,
        },
      });
      await tx.activity.update({
        where: { tenantId_id: { tenantId: t, id: activityId } },
        data: { status: ActivityStatus.COMPLETED, version: { increment: 1 } },
      });
      return proof;
    });
  }
  async latestProof(tenantId: string, activityId: string) {
    const activity = await this.prisma.activity.findUnique({
      where: { tenantId_id: { tenantId, id: activityId } },
      select: { id: true },
    });
    if (!activity) throw new NotFoundException("Activity not found");
    const proof = await this.prisma.proof.findFirst({
      where: { tenantId, activityId },
      orderBy: { version: "desc" },
    });
    if (!proof) throw new NotFoundException("Proof not found");
    const base = {
      id: proof.id,
      activityId: proof.activityId,
      version: proof.version,
      status: proof.status,
      sha256: proof.sha256,
      size: proof.size,
      validationUrl: `${this.publicBase}/${proof.publicCode}/validate`,
    };
    if (proof.status !== "ready" || !proof.objectBucket || !proof.objectKey)
      return base;
    const expiresIn = 300;
    return {
      ...base,
      downloadUrl: await getSignedUrl(
        this.downloadS3,
        new GetObjectCommand({
          Bucket: proof.objectBucket,
          Key: proof.objectKey,
          ResponseContentType: "application/pdf",
          ResponseContentDisposition: `attachment; filename="comprovante-${activityId}-v${proof.version}.pdf"`,
        }),
        { expiresIn },
      ),
      expiresIn,
    };
  }
  async markProofReady(
    secret: string | undefined,
    id: string,
    d: ProofReadyDto,
  ) {
    if (secret !== this.serviceKey)
      throw new ForbiddenException("Invalid service key");
    const p = await this.prisma.proof.findUnique({
      where: { tenantId_id: { tenantId: d.tenantId, id } },
    });
    if (!p) throw new NotFoundException("Proof not found");
    if (p.status === "ready") return p;
    return this.prisma.proof.update({
      where: { tenantId_id: { tenantId: d.tenantId, id } },
      data: {
        status: "ready",
        objectBucket: d.bucket,
        objectKey: d.key,
        sha256: d.sha256,
        size: d.size,
      },
    });
  }
  async validatePublic(code: string) {
    const p = await this.prisma.proof.findUnique({
      where: { publicCode: code },
      select: {
        publicCode: true,
        status: true,
        version: true,
        sha256: true,
        size: true,
      },
    });
    if (!p) throw new NotFoundException("Proof not found");
    return {
      code: p.publicCode,
      status: p.status,
      version: p.version,
      sha256: p.sha256,
      size: p.size,
    };
  }
}
