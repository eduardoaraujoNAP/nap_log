import { ActivityStatus } from "@prisma/client";
import { PrismaService } from "../src/database/prisma.service";
import { MobileCommandDto } from "../src/modules/mobile/mobile.dto";
import { MobileService } from "../src/modules/mobile/mobile.service";

describe("MobileService commands", () => {
  const tenantA = "865fe12e-62f8-432b-9509-75b125959370";
  const device = "f838fb2b-2a47-480f-b816-3b0229b77c91";
  const activity = "b557ebd7-d963-49a7-b94c-d2539395d106";
  const commandId = "b59bc2d7-3d1e-4ce7-87a9-3647afd843eb";
  const command = (id = commandId): MobileCommandDto => ({
    clientCommandId: id,
    deviceId: device,
    type: "accept_activity",
    occurredAt: "2026-07-15T12:00:00.000Z",
    payload: { activityId: activity },
  });
  function fake(
    status: ActivityStatus = ActivityStatus.ASSIGNED,
    owner = tenantA,
    destination?: { destinationLatitude: number; destinationLongitude: number },
  ) {
    const receipts = new Map<string, unknown>();
    const tx = {
      activity: {
        findUnique: jest.fn(({ where }) =>
          Promise.resolve(
            where.tenantId_id.tenantId === owner
              ? { status, ...destination }
              : null,
          ),
        ),
        update: jest.fn(() => Promise.resolve({})),
      },
      journey: { create: jest.fn() },
    };
    const prisma = {
      mobileCommandReceipt: {
        findUnique: jest.fn(({ where }) =>
          Promise.resolve(receipts.get(JSON.stringify(where))),
        ),
        create: jest.fn(({ data }) => {
          receipts.set(
            JSON.stringify({
              tenantId_deviceId_clientCommandId: {
                tenantId: data.tenantId,
                deviceId: data.deviceId,
                clientCommandId: data.clientCommandId,
              },
            }),
            { result: data.result },
          );
          return Promise.resolve(data);
        }),
      },
      $transaction: jest.fn((cb) => cb(tx)),
    } as unknown as PrismaService;
    return new MobileService(prisma);
  }
  it("returns duplicate for a repeated command", async () => {
    const service = fake();
    expect((await service.commands(tenantA, [command()]))[0].status).toBe(
      "applied",
    );
    expect((await service.commands(tenantA, [command()]))[0].status).toBe(
      "duplicate",
    );
  });
  it("does not resolve an activity owned by another tenant", async () => {
    expect(
      (
        await fake(ActivityStatus.ASSIGNED, "other").commands(tenantA, [
          command(),
        ])
      )[0].status,
    ).toBe("rejected");
  });
  it("reports conflict for an invalid transition", async () => {
    expect(
      (await fake(ActivityStatus.COMPLETED).commands(tenantA, [command()]))[0]
        .status,
    ).toBe("conflict");
  });
  it("returns only the published route in stop order", async () => {
    const row = {
      id: activity,
      externalReference: "ENT-1",
      description: "Cliente",
      address: "Rua A",
      destinationLatitude: -23.5614,
      destinationLongitude: -46.6559,
      status: ActivityStatus.ASSIGNED,
      updatedAt: new Date("2026-07-23T12:00:00Z"),
      version: 2,
    };
    const prisma = {
      driver: { findUnique: jest.fn().mockResolvedValue({ id: device }) },
      route: {
        findFirst: jest.fn().mockResolvedValue({
          id: "route-1",
          name: "Rota Centro",
          stops: [{ sequence: 1, activity: row }],
        }),
      },
    };
    await expect(
      new MobileService(prisma as unknown as PrismaService).assignedActivities(
        tenantA,
        device,
      ),
    ).resolves.toEqual([
      expect.objectContaining({
        id: activity,
        destinationLatitude: -23.5614,
        destinationLongitude: -46.6559,
        routeId: "route-1",
        routeName: "Rota Centro",
        sequence: 1,
        window: "Parada 1",
      }),
    ]);
    expect(prisma.route.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          tenantId: tenantA,
          driverId: device,
          status: { in: ["published", "in_progress"] },
        },
      }),
    );
  });
  it("starts the published route once and returns the server journey id", async () => {
    const routeId = "22222222-2222-4222-8222-222222222222";
    const tx = {
      route: {
        findUnique: jest.fn().mockResolvedValue({
          id: routeId,
          driverId: device,
          status: "published",
          stops: [{ activityId: activity }],
        }),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      journey: {
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest
          .fn()
          .mockResolvedValue({ id: "33333333-3333-4333-8333-333333333333" }),
      },
      activity: { updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
    };
    const prisma = {
      mobileCommandReceipt: {
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({}),
      },
      $transaction: jest.fn((work) => work(tx)),
    };
    const start: MobileCommandDto = {
      clientCommandId: commandId,
      deviceId: device,
      type: "start_route",
      occurredAt: "2026-07-23T12:00:00Z",
      payload: { routeId, driverId: device },
    };
    await expect(
      new MobileService(prisma as unknown as PrismaService).commands(tenantA, [
        start,
      ]),
    ).resolves.toEqual([
      expect.objectContaining({
        status: "applied",
        journeyId: "33333333-3333-4333-8333-333333333333",
      }),
    ]);
    expect(tx.route.updateMany).toHaveBeenCalledWith({
      where: { tenantId: tenantA, id: routeId, status: "published" },
      data: { status: "in_progress" },
    });
    expect(tx.activity.updateMany).toHaveBeenCalled();
  });
  it("applies service start and requires a reason for failure", async () => {
    const startService: MobileCommandDto = {
      ...command("26b9ca88-a895-4258-a861-c664182d3a92"),
      type: "start_service",
      payload: { activityId: activity },
    };
    await expect(
      fake(ActivityStatus.ON_SITE).commands(tenantA, [startService]),
    ).resolves.toEqual([expect.objectContaining({ status: "applied" })]);
    const failure: MobileCommandDto = {
      ...command("85ea5804-e85b-4a41-ad9d-6658528a3055"),
      type: "fail_activity",
      payload: { activityId: activity },
    };
    await expect(
      fake(ActivityStatus.EN_ROUTE).commands(tenantA, [failure]),
    ).resolves.toEqual([
      expect.objectContaining({
        status: "rejected",
        reason: "failure_reason_required",
      }),
    ]);
    failure.payload = {
      activityId: activity,
      reason: "Cliente ausente",
      comment: "Sem resposta no local",
    };
    await expect(
      fake(ActivityStatus.EN_ROUTE).commands(tenantA, [failure]),
    ).resolves.toEqual([expect.objectContaining({ status: "applied" })]);
  });
  it("enforces server geofence for georeferenced arrivals", async () => {
    const arrive: MobileCommandDto = {
      ...command("956d90d9-555c-4ee9-80ad-1067f0560267"),
      type: "arrive",
      occurredAt: "2026-07-24T12:00:00Z",
      payload: { activityId: activity },
    };
    const destination = {
      destinationLatitude: -23.5614,
      destinationLongitude: -46.6559,
    };
    await expect(
      fake(ActivityStatus.EN_ROUTE, tenantA, destination).commands(tenantA, [
        arrive,
      ]),
    ).resolves.toEqual([
      expect.objectContaining({
        status: "rejected",
        reason: "arrival_location_required",
      }),
    ]);
    arrive.payload = {
      activityId: activity,
      location: {
        latitude: -23.5714,
        longitude: -46.6559,
        accuracy: 5,
        recordedAt: "2026-07-24T11:59:00Z",
      },
    };
    await expect(
      fake(ActivityStatus.EN_ROUTE, tenantA, destination).commands(tenantA, [
        arrive,
      ]),
    ).resolves.toEqual([
      expect.objectContaining({
        status: "conflict",
        reason: "outside_geofence",
      }),
    ]);
    arrive.payload = {
      activityId: activity,
      location: {
        latitude: -23.5615,
        longitude: -46.6559,
        accuracy: 10,
        recordedAt: "2026-07-24T11:59:00Z",
      },
    };
    await expect(
      fake(ActivityStatus.EN_ROUTE, tenantA, destination).commands(tenantA, [
        arrive,
      ]),
    ).resolves.toEqual([expect.objectContaining({ status: "applied" })]);
  });
});
