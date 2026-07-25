import { ActivityStatus } from "@prisma/client";
import { PrismaService } from "../src/database/prisma.service";
import { PrismaActivityRepository } from "../src/modules/activities/prisma-activity.repository";

describe("PrismaActivityRepository occurrences", () => {
  it("maps only the latest tenant-scoped failure event", async () => {
    const tenantId = "865fe12e-62f8-432b-9509-75b125959370";
    const prisma = {
      activity: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: "b557ebd7-d963-49a7-b94c-d2539395d106",
            tenantId,
            externalReference: "ENT-1",
            description: "Cliente",
            address: "Rua A",
            destinationLatitude: null,
            destinationLongitude: null,
            status: ActivityStatus.FAILED,
            version: 3,
            createdAt: new Date("2026-07-24T10:00:00Z"),
            updatedAt: new Date("2026-07-24T12:00:00Z"),
            assignments: [],
            events: [
              {
                occurredAt: new Date("2026-07-24T11:59:00Z"),
                payload: {
                  reason: "Cliente ausente",
                  comment: "Sem resposta no local",
                  deviceId: "f838fb2b-2a47-480f-b816-3b0229b77c91",
                },
              },
            ],
          },
        ]),
      },
    };
    const rows = await new PrismaActivityRepository(
      prisma as unknown as PrismaService,
    ).findAll(tenantId);
    expect(rows[0].failure).toEqual({
      reason: "Cliente ausente",
      comment: "Sem resposta no local",
      deviceId: "f838fb2b-2a47-480f-b816-3b0229b77c91",
      occurredAt: "2026-07-24T11:59:00.000Z",
    });
    expect(prisma.activity.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { tenantId },
        include: expect.objectContaining({
          events: {
            where: { type: "activity.fail_activity" },
            orderBy: { occurredAt: "desc" },
            take: 1,
          },
        }),
      }),
    );
  });
});
