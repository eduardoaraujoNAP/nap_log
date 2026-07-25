import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { ActivityStatus } from "@prisma/client";
import { PrismaService } from "../../database/prisma.service";
import { CreateRouteDto } from "./routes.dto";
const routeInclude = {
  driver: { select: { id: true, name: true } },
  stops: {
    orderBy: { sequence: "asc" as const },
    include: {
      activity: {
        select: {
          id: true,
          externalReference: true,
          description: true,
          address: true,
          status: true,
        },
      },
    },
  },
};
@Injectable()
export class RoutesService {
  constructor(private readonly prisma: PrismaService) {}
  list(tenantId: string) {
    return this.prisma.route.findMany({
      where: { tenantId },
      orderBy: [{ plannedDate: "asc" }, { createdAt: "desc" }],
      include: routeInclude,
    });
  }
  async create(tenantId: string, dto: CreateRouteDto) {
    const ids = [...new Set(dto.activityIds)];
    if (ids.length !== dto.activityIds.length)
      throw new BadRequestException("Activity list contains duplicates");
    return this.prisma.$transaction(async (tx) => {
      const driver = await tx.driver.findUnique({
        where: { tenantId_id: { tenantId, id: dto.driverId } },
      });
      if (!driver) throw new NotFoundException("Driver not found");
      const activities = await tx.activity.findMany({
        where: { tenantId, id: { in: ids } },
      });
      if (activities.length !== ids.length)
        throw new NotFoundException("One or more activities were not found");
      if (
        activities.some((a) => a.status !== ActivityStatus.AWAITING_ASSIGNMENT)
      )
        throw new ConflictException(
          "All activities must be awaiting assignment",
        );
      const route = await tx.route.create({
        data: {
          tenantId,
          driverId: dto.driverId,
          name: dto.name.trim(),
          plannedDate: new Date(`${dto.plannedDate}T00:00:00.000Z`),
          stops: {
            create: ids.map((activityId, index) => ({
              tenantId,
              activityId,
              sequence: index + 1,
            })),
          },
        },
      });
      for (const activityId of ids) {
        await tx.assignment.create({
          data: { tenantId, activityId, driverId: dto.driverId },
        });
        await tx.activity.update({
          where: { tenantId_id: { tenantId, id: activityId } },
          data: {
            status: ActivityStatus.ASSIGNED,
            version: { increment: 1 },
            events: {
              create: {
                tenant: { connect: { id: tenantId } },
                type: "activity.route_planned",
                payload: { routeId: route.id, driverId: dto.driverId },
              },
            },
          },
        });
      }
      return tx.route.findUniqueOrThrow({
        where: { tenantId_id: { tenantId, id: route.id } },
        include: routeInclude,
      });
    });
  }
  async transition(
    tenantId: string,
    id: string,
    target: "published" | "in_progress" | "completed",
  ) {
    const expected =
      target === "published"
        ? "planned"
        : target === "in_progress"
          ? "published"
          : "in_progress";
    return this.prisma.$transaction(async (tx) => {
      const route = await tx.route.findUnique({
        where: { tenantId_id: { tenantId, id } },
        include: { stops: { include: { activity: true } } },
      });
      if (!route) throw new NotFoundException("Route not found");
      if (route.status === target)
        return tx.route.findUniqueOrThrow({
          where: { tenantId_id: { tenantId, id } },
          include: routeInclude,
        });
      if (route.status !== expected)
        throw new ConflictException(`Route must be ${expected}`);
      if (
        target === "completed" &&
        route.stops.some(
          (stop) =>
            !([
              ActivityStatus.COMPLETED,
              ActivityStatus.FAILED,
              ActivityStatus.CANCELED,
              ActivityStatus.RETURNED,
            ] as ActivityStatus[]).includes(stop.activity.status),
        )
      )
        throw new ConflictException("All route stops must be finished");
      const changed = await tx.route.updateMany({
        where: { tenantId, id, status: expected },
        data: { status: target },
      });
      if (changed.count !== 1)
        throw new ConflictException("Route was changed concurrently");
      if (target === "in_progress") {
        await tx.journey.create({
          data: { tenantId, driverId: route.driverId },
        });
        await tx.activity.updateMany({
          where: {
            tenantId,
            id: { in: route.stops.map((stop) => stop.activityId) },
            status: { in: [ActivityStatus.ASSIGNED, ActivityStatus.ACCEPTED] },
          },
          data: { status: ActivityStatus.EN_ROUTE, version: { increment: 1 } },
        });
      }
      if (target === "completed")
        await tx.journey.updateMany({
          where: {
            tenantId,
            driverId: route.driverId,
            status: "active",
            endedAt: null,
          },
          data: { status: "completed", endedAt: new Date() },
        });
      for (const stop of route.stops)
        await tx.activityEvent.create({
          data: {
            tenantId,
            activityId: stop.activityId,
            type: `route.${target}`,
            payload: { routeId: id, driverId: route.driverId },
          },
        });
      return tx.route.findUniqueOrThrow({
        where: { tenantId_id: { tenantId, id } },
        include: routeInclude,
      });
    });
  }
}
