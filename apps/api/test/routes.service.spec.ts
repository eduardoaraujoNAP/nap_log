import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from "@nestjs/common";
import { ActivityStatus } from "@prisma/client";
import { PrismaService } from "../src/database/prisma.service";
import { RoutesService } from "../src/modules/routes/routes.service";
describe("RoutesService", () => {
  const tenant = "865fe12e-62f8-432b-9509-75b125959370",
    driverId = "f838fb2b-2a47-480f-b816-3b0229b77c91",
    a1 = "b557ebd7-d963-49a7-b94c-d2539395d106",
    a2 = "11111111-1111-4111-8111-111111111111";
  const input = {
    name: " Rota Centro ",
    plannedDate: "2026-07-24",
    driverId,
    activityIds: [a1, a2],
  };
  it("rejects duplicate activity identifiers before opening a transaction", async () => {
    const prisma = { $transaction: jest.fn() };
    await expect(
      new RoutesService(prisma as unknown as PrismaService).create(tenant, {
        ...input,
        activityIds: [a1, a1],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
  it("rejects a driver from another tenant", async () => {
    const tx = { driver: { findUnique: jest.fn().mockResolvedValue(null) } };
    const prisma = { $transaction: jest.fn((work) => work(tx)) };
    await expect(
      new RoutesService(prisma as unknown as PrismaService).create(
        tenant,
        input,
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(tx.driver.findUnique).toHaveBeenCalledWith({
      where: { tenantId_id: { tenantId: tenant, id: driverId } },
    });
  });
  it("plans ordered stops and assigns every available activity atomically", async () => {
    const route = { id: "22222222-2222-4222-8222-222222222222" };
    const tx = {
      driver: { findUnique: jest.fn().mockResolvedValue({ id: driverId }) },
      activity: {
        findMany: jest.fn().mockResolvedValue([
          { id: a1, status: ActivityStatus.AWAITING_ASSIGNMENT },
          { id: a2, status: ActivityStatus.AWAITING_ASSIGNMENT },
        ]),
        update: jest.fn().mockResolvedValue({}),
      },
      route: {
        create: jest.fn().mockResolvedValue(route),
        findUniqueOrThrow: jest
          .fn()
          .mockResolvedValue({ ...route, name: "Rota Centro" }),
      },
      assignment: { create: jest.fn().mockResolvedValue({}) },
    };
    const prisma = { $transaction: jest.fn((work) => work(tx)) };
    await expect(
      new RoutesService(prisma as unknown as PrismaService).create(
        tenant,
        input,
      ),
    ).resolves.toMatchObject({ name: "Rota Centro" });
    expect(tx.route.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        tenantId: tenant,
        driverId,
        name: "Rota Centro",
        stops: {
          create: [
            { tenantId: tenant, activityId: a1, sequence: 1 },
            { tenantId: tenant, activityId: a2, sequence: 2 },
          ],
        },
      }),
    });
    expect(tx.assignment.create).toHaveBeenCalledTimes(2);
    expect(tx.activity.update).toHaveBeenCalledTimes(2);
  });
  it("does not replan an activity that is already assigned", async () => {
    const tx = {
      driver: { findUnique: jest.fn().mockResolvedValue({ id: driverId }) },
      activity: {
        findMany: jest.fn().mockResolvedValue([
          { id: a1, status: ActivityStatus.ASSIGNED },
          { id: a2, status: ActivityStatus.AWAITING_ASSIGNMENT },
        ]),
      },
    };
    const prisma = { $transaction: jest.fn((work) => work(tx)) };
    await expect(
      new RoutesService(prisma as unknown as PrismaService).create(
        tenant,
        input,
      ),
    ).rejects.toBeInstanceOf(ConflictException);
  });
  it("publishes a planned route idempotently and audits every stop", async () => {
    const route = {
      id: "22222222-2222-4222-8222-222222222222",
      driverId,
      status: "planned",
      stops: [
        { activityId: a1, activity: { status: ActivityStatus.ASSIGNED } },
        { activityId: a2, activity: { status: ActivityStatus.ASSIGNED } },
      ],
    };
    const tx = {
      route: {
        findUnique: jest.fn().mockResolvedValue(route),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        findUniqueOrThrow: jest
          .fn()
          .mockResolvedValue({ ...route, status: "published" }),
      },
      activityEvent: { create: jest.fn().mockResolvedValue({}) },
      journey: { create: jest.fn(), updateMany: jest.fn() },
      activity: { updateMany: jest.fn() },
    };
    const prisma = { $transaction: jest.fn((work) => work(tx)) };
    await expect(
      new RoutesService(prisma as unknown as PrismaService).transition(
        tenant,
        route.id,
        "published",
      ),
    ).resolves.toMatchObject({ status: "published" });
    expect(tx.route.updateMany).toHaveBeenCalledWith({
      where: { tenantId: tenant, id: route.id, status: "planned" },
      data: { status: "published" },
    });
    expect(tx.activityEvent.create).toHaveBeenCalledTimes(2);
    expect(tx.journey.create).not.toHaveBeenCalled();
  });
  it("does not complete a route with unfinished stops", async () => {
    const route = {
      id: "22222222-2222-4222-8222-222222222222",
      driverId,
      status: "in_progress",
      stops: [
        { activityId: a1, activity: { status: ActivityStatus.EN_ROUTE } },
      ],
    };
    const tx = { route: { findUnique: jest.fn().mockResolvedValue(route) } };
    const prisma = { $transaction: jest.fn((work) => work(tx)) };
    await expect(
      new RoutesService(prisma as unknown as PrismaService).transition(
        tenant,
        route.id,
        "completed",
      ),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
