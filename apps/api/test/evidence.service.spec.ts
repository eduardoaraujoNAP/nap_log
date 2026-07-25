import { BadRequestException, NotFoundException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { ActivityStatus } from "@prisma/client";
import { PrismaService } from "../src/database/prisma.service";
import { EvidenceService } from "../src/modules/evidence/evidence.service";

describe("EvidenceService", () => {
  const tenant = "865fe12e-62f8-432b-9509-75b125959370";
  const activityId = "f838fb2b-2a47-480f-b816-3b0229b77c91";
  const uploadId = "b557ebd7-d963-49a7-b94c-d2539395d106";
  const hash = "a".repeat(64);
  const config = {
    get: (_key: string, fallback: unknown) => fallback,
  } as ConfigService;

  function service(prisma: object): EvidenceService {
    return new EvidenceService(prisma as PrismaService, config);
  }

  it("does not initiate an upload for an activity from another tenant", async () => {
    const prisma = {
      activity: { findUnique: jest.fn().mockResolvedValue(null) },
    };
    await expect(
      service(prisma).initiate(tenant, {
        activityId,
        kind: "photo_material",
        origin: "camera",
        mimeType: "image/jpeg",
        size: 100,
        sha256: hash,
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.activity.findUnique).toHaveBeenCalledWith({
      where: { tenantId_id: { tenantId: tenant, id: activityId } },
    });
  });

  it("returns an already confirmed upload without accessing S3 again", async () => {
    const confirmed = {
      id: uploadId,
      tenantId: tenant,
      status: "confirmed",
      expectedSize: 100,
      expectedSha256: hash,
      objectKey: "private/key",
    };
    const prisma = {
      evidence: {
        findUnique: jest.fn().mockResolvedValue(confirmed),
        update: jest.fn(),
      },
    };
    const sut = service(prisma);
    (sut as unknown as { s3: { send: jest.Mock } }).s3 = { send: jest.fn() };
    await expect(
      sut.complete(tenant, uploadId, { size: 100, sha256: hash }),
    ).resolves.toBe(confirmed);
    expect(prisma.evidence.update).not.toHaveBeenCalled();
    expect(
      (sut as unknown as { s3: { send: jest.Mock } }).s3.send,
    ).not.toHaveBeenCalled();
  });

  it("rejects completion when a required evidence kind is missing", async () => {
    const tx = {
      activity: {
        findUnique: jest
          .fn()
          .mockResolvedValue({ status: ActivityStatus.IN_SERVICE }),
      },
      proof: { findFirst: jest.fn().mockResolvedValue(null) },
      evidence: {
        findMany: jest.fn().mockResolvedValue([{ kind: "photo_material" }]),
      },
    };
    const prisma = { $transaction: jest.fn((callback) => callback(tx)) };
    await expect(
      service(prisma).completeActivity(tenant, activityId, {
        receiverName: "Maria",
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it("increments the proof version and snapshots the confirmed evidence", async () => {
    const proofCreate = jest.fn(({ data }) =>
      Promise.resolve({ id: uploadId, ...data }),
    );
    const tx = {
      activity: {
        findUnique: jest.fn().mockResolvedValue({
          id: activityId,
          status: ActivityStatus.IN_SERVICE,
          externalReference: "ENT-123",
          address: "Rua A, 10",
          tenant: { name: "NAP Log" },
          company: { name: "NAP Transportes", taxId: "12.345.678/0001-90" },
          assignments: [{ driver: { name: "Carlos Mendes" } }],
          events: [
            {
              type: "activity.arrive_activity",
              occurredAt: new Date("2026-07-23T12:00:00.000Z"),
            },
          ],
        }),
        update: jest.fn().mockResolvedValue({}),
      },
      proof: {
        findFirst: jest.fn().mockResolvedValue({ version: 2 }),
        create: proofCreate,
      },
      evidence: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: "photo",
            kind: "photo_material",
            sha256: hash,
            origin: "camera",
            version: 1,
          },
          {
            id: "signature",
            kind: "signature",
            sha256: hash,
            origin: "signature_pad",
            version: 1,
          },
        ]),
      },
      receiver: { create: jest.fn().mockResolvedValue({}) },
      proofEvidence: { createMany: jest.fn().mockResolvedValue({ count: 2 }) },
      outboxEvent: { create: jest.fn().mockResolvedValue({}) },
    };
    const prisma = { $transaction: jest.fn((callback) => callback(tx)) };
    const result = await service(prisma).completeActivity(tenant, activityId, {
      receiverName: "Maria",
    });
    expect(result.version).toBe(3);
    expect(proofCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          tenantId: tenant,
          activityId,
          version: 3,
          status: "pending",
        }),
      }),
    );
    expect(tx.proofEvidence.createMany).toHaveBeenCalled();
    expect(tx.outboxEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          tenantId: tenant,
          type: "proof.requested",
          payload: expect.objectContaining({
            activityId,
            proofId: uploadId,
            version: 3,
            publicValidationUrl: expect.stringContaining("/validate"),
            snapshot: expect.objectContaining({
              companyName: "NAP Transportes",
              activityReference: "ENT-123",
              address: "Rua A, 10",
              driverName: "Carlos Mendes",
              receiver: { nameMasked: "M****" },
              evidenceHashes: [hash, hash],
            }),
          }),
        }),
      }),
    );
  });

  it("rejects an invalid worker secret and handles ready callback idempotently", async () => {
    const ready = {
      id: uploadId,
      tenantId: tenant,
      status: "ready",
      sha256: hash,
    };
    const prisma = {
      proof: {
        findUnique: jest.fn().mockResolvedValue(ready),
        update: jest.fn(),
      },
    };
    const sut = service(prisma);
    const dto = {
      tenantId: tenant,
      bucket: "proofs",
      key: "proof.pdf",
      sha256: hash,
      size: 123,
    };
    await expect(sut.markProofReady("invalid", uploadId, dto)).rejects.toThrow(
      "Invalid service key",
    );
    await expect(
      sut.markProofReady("change-me-worker-secret", uploadId, dto),
    ).resolves.toBe(ready);
    expect(prisma.proof.update).not.toHaveBeenCalled();
  });

  it("validates a public code without exposing the manifest or tenant", async () => {
    const prisma = {
      proof: {
        findUnique: jest.fn().mockResolvedValue({
          publicCode: "opaque",
          status: "ready",
          version: 2,
          sha256: hash,
          size: 123,
        }),
      },
    };
    await expect(service(prisma).validatePublic("opaque")).resolves.toEqual({
      code: "opaque",
      status: "ready",
      version: 2,
      sha256: hash,
      size: 123,
    });
    expect(prisma.proof.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { publicCode: "opaque" },
        select: {
          publicCode: true,
          status: true,
          version: true,
          sha256: true,
          size: true,
        },
      }),
    );
  });
  it("returns tenant-scoped proof status and signs only ready objects", async () => {
    const proof: {
      id: string;
      activityId: string;
      version: number;
      status: string;
      publicCode: string;
      sha256: string | null;
      size: number | null;
      objectBucket: string | null;
      objectKey: string | null;
    } = {
      id: uploadId,
      activityId,
      version: 2,
      status: "pending",
      publicCode: "opaque",
      sha256: null,
      size: null,
      objectBucket: null,
      objectKey: null,
    };
    const prisma = {
      activity: { findUnique: jest.fn().mockResolvedValue({ id: activityId }) },
      proof: { findFirst: jest.fn().mockResolvedValue(proof) },
    };
    await expect(
      service(prisma).latestProof(tenant, activityId),
    ).resolves.toEqual(
      expect.objectContaining({
        status: "pending",
        version: 2,
        validationUrl: expect.stringContaining("opaque/validate"),
      }),
    );
    expect(prisma.activity.findUnique).toHaveBeenCalledWith({
      where: { tenantId_id: { tenantId: tenant, id: activityId } },
      select: { id: true },
    });
    proof.status = "ready";
    proof.objectBucket = "proofs";
    proof.objectKey = "tenant/proof.pdf";
    proof.sha256 = hash;
    proof.size = 123;
    await expect(
      service(prisma).latestProof(tenant, activityId),
    ).resolves.toEqual(
      expect.objectContaining({
        status: "ready",
        downloadUrl: expect.stringContaining("tenant/proof.pdf"),
        expiresIn: 300,
      }),
    );
  });

  it("does not resolve a proof for an activity outside the tenant", async () => {
    const prisma = {
      activity: { findUnique: jest.fn().mockResolvedValue(null) },
      proof: { findFirst: jest.fn() },
    };
    await expect(
      service(prisma).latestProof(tenant, activityId),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.proof.findFirst).not.toHaveBeenCalled();
  });
});
