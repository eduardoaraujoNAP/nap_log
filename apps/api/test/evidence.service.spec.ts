import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ActivityStatus } from '@prisma/client';
import { PrismaService } from '../src/database/prisma.service';
import { EvidenceService } from '../src/modules/evidence/evidence.service';

describe('EvidenceService', () => {
  const tenant = '865fe12e-62f8-432b-9509-75b125959370';
  const activityId = 'f838fb2b-2a47-480f-b816-3b0229b77c91';
  const uploadId = 'b557ebd7-d963-49a7-b94c-d2539395d106';
  const hash = 'a'.repeat(64);
  const config = { get: (_key: string, fallback: unknown) => fallback } as ConfigService;

  function service(prisma: object): EvidenceService {
    return new EvidenceService(prisma as PrismaService, config);
  }

  it('does not initiate an upload for an activity from another tenant', async () => {
    const prisma = { activity: { findUnique: jest.fn().mockResolvedValue(null) } };
    await expect(service(prisma).initiate(tenant, {
      activityId,
      kind: 'photo_material',
      origin: 'camera',
      mimeType: 'image/jpeg',
      size: 100,
      sha256: hash,
    })).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.activity.findUnique).toHaveBeenCalledWith({
      where: { tenantId_id: { tenantId: tenant, id: activityId } },
    });
  });

  it('returns an already confirmed upload without accessing S3 again', async () => {
    const confirmed = {
      id: uploadId, tenantId: tenant, status: 'confirmed',
      expectedSize: 100, expectedSha256: hash, objectKey: 'private/key',
    };
    const prisma = {
      evidence: {
        findUnique: jest.fn().mockResolvedValue(confirmed),
        update: jest.fn(),
      },
    };
    const sut = service(prisma);
    (sut as unknown as { s3: { send: jest.Mock } }).s3 = { send: jest.fn() };
    await expect(sut.complete(tenant, uploadId, { size: 100, sha256: hash }))
      .resolves.toBe(confirmed);
    expect(prisma.evidence.update).not.toHaveBeenCalled();
    expect((sut as unknown as { s3: { send: jest.Mock } }).s3.send).not.toHaveBeenCalled();
  });

  it('rejects completion when a required evidence kind is missing', async () => {
    const tx = {
      activity: { findUnique: jest.fn().mockResolvedValue({ status: ActivityStatus.IN_SERVICE }) },
      proof: { findFirst: jest.fn().mockResolvedValue(null) },
      evidence: { findMany: jest.fn().mockResolvedValue([{ kind: 'photo_material' }]) },
    };
    const prisma = { $transaction: jest.fn((callback) => callback(tx)) };
    await expect(service(prisma).completeActivity(tenant, activityId, {
      receiverName: 'Maria',
    })).rejects.toBeInstanceOf(BadRequestException);
  });

  it('increments the proof version and snapshots the confirmed evidence', async () => {
    const proofCreate = jest.fn(({ data }) => Promise.resolve({ id: uploadId, ...data }));
    const tx = {
      activity: {
        findUnique: jest.fn().mockResolvedValue({ status: ActivityStatus.IN_SERVICE }),
        update: jest.fn().mockResolvedValue({}),
      },
      proof: {
        findFirst: jest.fn().mockResolvedValue({ version: 2 }),
        create: proofCreate,
      },
      evidence: { findMany: jest.fn().mockResolvedValue([
        { id: 'photo', kind: 'photo_material', sha256: hash, origin: 'camera', version: 1 },
        { id: 'signature', kind: 'signature', sha256: hash, origin: 'signature_pad', version: 1 },
      ]) },
      receiver: { create: jest.fn().mockResolvedValue({}) },
      proofEvidence: { createMany: jest.fn().mockResolvedValue({ count: 2 }) },
      outboxEvent: { create: jest.fn().mockResolvedValue({}) },
    };
    const prisma = { $transaction: jest.fn((callback) => callback(tx)) };
    const result = await service(prisma).completeActivity(tenant, activityId, {
      receiverName: 'Maria',
    });
    expect(result.version).toBe(3);
    expect(proofCreate).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ tenantId: tenant, activityId, version: 3, status: 'pending' }),
    }));
    expect(tx.proofEvidence.createMany).toHaveBeenCalled();
    expect(tx.outboxEvent.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ tenantId: tenant, type: 'proof.requested' }),
    }));
  });

  it('rejects an invalid worker secret and handles ready callback idempotently', async () => {
    const ready = { id: uploadId, tenantId: tenant, status: 'ready', sha256: hash };
    const prisma = { proof: { findUnique: jest.fn().mockResolvedValue(ready), update: jest.fn() } };
    const sut = service(prisma);
    const dto = { tenantId: tenant, bucket: 'proofs', key: 'proof.pdf', sha256: hash, size: 123 };
    await expect(sut.markProofReady('invalid', uploadId, dto)).rejects.toThrow('Invalid service key');
    await expect(sut.markProofReady('change-me-worker-secret', uploadId, dto)).resolves.toBe(ready);
    expect(prisma.proof.update).not.toHaveBeenCalled();
  });

  it('validates a public code without exposing the manifest or tenant', async () => {
    const prisma = { proof: { findUnique: jest.fn().mockResolvedValue({
      publicCode: 'opaque', status: 'ready', version: 2, sha256: hash, size: 123,
    }) } };
    await expect(service(prisma).validatePublic('opaque')).resolves.toEqual({
      code: 'opaque', status: 'ready', version: 2, sha256: hash, size: 123,
    });
    expect(prisma.proof.findUnique).toHaveBeenCalledWith(expect.objectContaining({
      where: { publicCode: 'opaque' },
      select: { publicCode: true, status: true, version: true, sha256: true, size: true },
    }));
  });
});
