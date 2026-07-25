import { Injectable } from "@nestjs/common";
import { Prisma, ActivityStatus as DbStatus } from "@prisma/client";
import { PrismaService } from "../../database/prisma.service";
import { GpsPointDto, MobileCommandDto } from "./mobile.dto";
import { validateServerArrival } from "./mobile-geofence";
export type CommandResult = {
  clientCommandId: string;
  status: "applied" | "duplicate" | "conflict" | "rejected";
  reason?: string;
  journeyId?: string;
};
@Injectable()
export class MobileService {
  constructor(private readonly prisma: PrismaService) {}
  async assignedActivities(tenantId: string, driverId: string) {
    const driver = await this.prisma.driver.findUnique({
      where: { tenantId_id: { tenantId, id: driverId } },
    });
    if (!driver) return [];
    const route = await this.prisma.route.findFirst({
      where: {
        tenantId,
        driverId,
        status: { in: ["published", "in_progress"] },
      },
      orderBy: { plannedDate: "asc" },
      include: {
        stops: { orderBy: { sequence: "asc" }, include: { activity: true } },
      },
    });
    if (!route) return [];
    return route.stops
      .filter(
        (stop) =>
          !([DbStatus.CANCELED, DbStatus.RETURNED] as DbStatus[]).includes(
            stop.activity.status,
          ),
      )
      .map((stop) => {
        const row = stop.activity;
        return {
          id: row.id,
          code: row.externalReference ?? row.id.slice(0, 8),
          customer: row.description,
          address: row.address,
          ...(row.destinationLatitude != null
            ? { destinationLatitude: row.destinationLatitude }
            : {}),
          ...(row.destinationLongitude != null
            ? { destinationLongitude: row.destinationLongitude }
            : {}),
          window: "Parada " + stop.sequence,
          kind: "Entrega" as const,
          status: row.status.toLowerCase(),
          updatedAt: row.updatedAt.toISOString(),
          version: row.version,
          routeId: route.id,
          routeName: route.name,
          sequence: stop.sequence,
        };
      });
  }
  async commands(
    tenantId: string,
    items: MobileCommandDto[],
  ): Promise<CommandResult[]> {
    const results: CommandResult[] = [];
    for (const command of items)
      results.push(await this.command(tenantId, command));
    return results;
  }
  private async command(
    tenantId: string,
    c: MobileCommandDto,
  ): Promise<CommandResult> {
    const old = await this.prisma.mobileCommandReceipt.findUnique({
      where: {
        tenantId_deviceId_clientCommandId: {
          tenantId,
          deviceId: c.deviceId,
          clientCommandId: c.clientCommandId,
        },
      },
    });
    if (old) return { ...(old.result as CommandResult), status: "duplicate" };
    let result: CommandResult = {
      clientCommandId: c.clientCommandId,
      status: "rejected",
      reason: "invalid_payload",
    };
    try {
      result = await this.prisma.$transaction(async (tx) => {
        if (c.type === "start_route") {
          const driverId = String(c.payload.driverId ?? ""),
            routeId = String(c.payload.routeId ?? "");
          if (
            !/^[0-9a-f-]{36}$/i.test(driverId) ||
            !/^[0-9a-f-]{36}$/i.test(routeId)
          )
            return result;
          const route = await tx.route.findUnique({
            where: { tenantId_id: { tenantId, id: routeId } },
            include: { stops: true },
          });
          if (!route || route.driverId !== driverId)
            return {
              clientCommandId: c.clientCommandId,
              status: "rejected",
              reason: "route_not_found",
            };
          const active = await tx.journey.findFirst({
            where: { tenantId, driverId, status: "active", endedAt: null },
          });
          if (route.status === "in_progress" && active)
            return {
              clientCommandId: c.clientCommandId,
              status: "applied",
              journeyId: active.id,
            };
          if (route.status !== "published")
            return {
              clientCommandId: c.clientCommandId,
              status: "conflict",
              reason: "expected_published",
            };
          const changed = await tx.route.updateMany({
            where: { tenantId, id: routeId, status: "published" },
            data: { status: "in_progress" },
          });
          if (changed.count !== 1)
            return {
              clientCommandId: c.clientCommandId,
              status: "conflict",
              reason: "route_changed",
            };
          const j = await tx.journey.create({
            data: { tenantId, driverId, startedAt: new Date(c.occurredAt) },
          });
          await tx.activity.updateMany({
            where: {
              tenantId,
              id: { in: route.stops.map((stop) => stop.activityId) },
              status: { in: [DbStatus.ASSIGNED, DbStatus.ACCEPTED] },
            },
            data: { status: DbStatus.EN_ROUTE, version: { increment: 1 } },
          });
          return {
            clientCommandId: c.clientCommandId,
            status: "applied",
            journeyId: j.id,
          };
        }
        if (c.type === "finish_route") {
          const driverId = String(c.payload.driverId ?? ""),
            routeId = String(c.payload.routeId ?? "");
          if (
            !/^[0-9a-f-]{36}$/i.test(driverId) ||
            !/^[0-9a-f-]{36}$/i.test(routeId)
          )
            return result;
          const route = await tx.route.findUnique({
            where: { tenantId_id: { tenantId, id: routeId } },
            include: { stops: { include: { activity: true } } },
          });
          if (!route || route.driverId !== driverId)
            return {
              clientCommandId: c.clientCommandId,
              status: "rejected",
              reason: "route_not_found",
            };
          if (route.status === "completed")
            return { clientCommandId: c.clientCommandId, status: "applied" };
          if (route.status !== "in_progress")
            return {
              clientCommandId: c.clientCommandId,
              status: "conflict",
              reason: "expected_in_progress",
            };
          const final = new Set<DbStatus>([
            DbStatus.COMPLETED,
            DbStatus.FAILED,
            DbStatus.CANCELED,
            DbStatus.RETURNED,
          ]);
          if (route.stops.some((stop) => !final.has(stop.activity.status)))
            return {
              clientCommandId: c.clientCommandId,
              status: "conflict",
              reason: "unfinished_stops",
            };
          await tx.route.updateMany({
            where: { tenantId, id: routeId, status: "in_progress" },
            data: { status: "completed" },
          });
          await tx.journey.updateMany({
            where: { tenantId, driverId, status: "active", endedAt: null },
            data: { status: "completed", endedAt: new Date(c.occurredAt) },
          });
          return { clientCommandId: c.clientCommandId, status: "applied" };
        }
        const activityId = String(c.payload.activityId ?? "");
        const a = await tx.activity.findUnique({
          where: { tenantId_id: { tenantId, id: activityId } },
        });
        if (!a)
          return {
            clientCommandId: c.clientCommandId,
            status: "rejected",
            reason: "activity_not_found",
          };
        if (c.type === "arrive" && a.status === DbStatus.ON_SITE)
          return { clientCommandId: c.clientCommandId, status: "applied" };
        let arrivalAudit: Record<string, unknown> | undefined;
        if (
          c.type === "arrive" &&
          a.destinationLatitude != null &&
          a.destinationLongitude != null
        ) {
          const raw = c.payload.location;
          if (!raw || typeof raw !== "object")
            return {
              clientCommandId: c.clientCommandId,
              status: "rejected",
              reason: "arrival_location_required",
            };
          const source = raw as Record<string, unknown>;
          const reading = {
            latitude: Number(source.latitude),
            longitude: Number(source.longitude),
            accuracy: Number(source.accuracy),
            recordedAt: String(source.recordedAt ?? ""),
          };
          const validation = validateServerArrival(
            {
              latitude: a.destinationLatitude,
              longitude: a.destinationLongitude,
            },
            reading,
            c.occurredAt,
          );
          if (!validation.valid)
            return {
              clientCommandId: c.clientCommandId,
              status: "conflict",
              reason: validation.reason,
            };
          arrivalAudit = {
            location: reading,
            geofenceDistanceM: validation.distanceM,
          };
        }
        const transition = {
          accept_activity: [DbStatus.ASSIGNED, DbStatus.ACCEPTED],
          depart_activity: [DbStatus.ACCEPTED, DbStatus.EN_ROUTE],
          arrive: [DbStatus.EN_ROUTE, DbStatus.ON_SITE],
          start_service: [DbStatus.ON_SITE, DbStatus.IN_SERVICE],
        } as const;
        if (c.type === "fail_activity") {
          const reason = String(c.payload.reason ?? "").trim();
          if (!reason)
            return {
              clientCommandId: c.clientCommandId,
              status: "rejected",
              reason: "failure_reason_required",
            };
          if (a.status === DbStatus.FAILED)
            return { clientCommandId: c.clientCommandId, status: "applied" };
          const failureAllowed = new Set<DbStatus>([
            DbStatus.ASSIGNED,
            DbStatus.ACCEPTED,
            DbStatus.EN_ROUTE,
            DbStatus.ON_SITE,
            DbStatus.IN_SERVICE,
          ]);
          if (!failureAllowed.has(a.status))
            return {
              clientCommandId: c.clientCommandId,
              status: "conflict",
              reason: "activity_already_final",
            };
          await tx.activity.update({
            where: { tenantId_id: { tenantId, id: activityId } },
            data: {
              status: DbStatus.FAILED,
              version: { increment: 1 },
              events: {
                create: {
                  tenant: { connect: { id: tenantId } },
                  type: "activity.fail_activity",
                  payload: {
                    deviceId: c.deviceId,
                    occurredAt: c.occurredAt,
                    reason,
                    ...(String(c.payload.comment ?? "").trim()
                      ? { comment: String(c.payload.comment).trim() }
                      : {}),
                  },
                },
              },
            },
          });
          return { clientCommandId: c.clientCommandId, status: "applied" };
        }
        const pair = transition[c.type as keyof typeof transition];
        if (!pair) return result;
        const [expected, next] = pair;
        if (a.status === next)
          return { clientCommandId: c.clientCommandId, status: "applied" };
        if (a.status !== expected)
          return {
            clientCommandId: c.clientCommandId,
            status: "conflict",
            reason: "expected_" + expected.toLowerCase(),
          };
        await tx.activity.update({
          where: { tenantId_id: { tenantId, id: activityId } },
          data: {
            status: next,
            version: { increment: 1 },
            events: {
              create: {
                tenant: { connect: { id: tenantId } },
                type: `activity.${c.type}`,
                payload: {
                  deviceId: c.deviceId,
                  occurredAt: c.occurredAt,
                  ...arrivalAudit,
                },
              },
            },
          },
        });
        return { clientCommandId: c.clientCommandId, status: "applied" };
      });
    } catch {
      return {
        clientCommandId: c.clientCommandId,
        status: "rejected",
        reason: "invalid_reference",
      };
    }
    await this.prisma.mobileCommandReceipt.create({
      data: {
        tenantId,
        deviceId: c.deviceId,
        clientCommandId: c.clientCommandId,
        commandType: c.type,
        occurredAt: new Date(c.occurredAt),
        result: result as Prisma.InputJsonValue,
      },
    });
    return result;
  }
  async gps(tenantId: string, journeyId: string, points: GpsPointDto[]) {
    const journey = await this.prisma.journey.findUnique({
      where: { tenantId_id: { tenantId, id: journeyId } },
    });
    if (!journey || journey.status !== "active" || journey.endedAt)
      return points.map((p) => ({
        clientPointId: p.clientPointId,
        status: "rejected",
        reason: "journey_inactive",
      }));
    const output = [];
    for (const p of points) {
      const duplicate = await this.prisma.gpsPoint.findUnique({
        where: {
          tenantId_journeyId_clientPointId: {
            tenantId,
            journeyId,
            clientPointId: p.clientPointId,
          },
        },
      });
      if (duplicate) {
        output.push({ clientPointId: p.clientPointId, status: "duplicate" });
        continue;
      }
      await this.prisma
        .$executeRaw`INSERT INTO "gps_points" ("id","tenant_id","journey_id","client_point_id","latitude","longitude","accuracy","location","recorded_at") VALUES (gen_random_uuid(),${tenantId}::uuid,${journeyId}::uuid,${p.clientPointId}::uuid,${p.latitude},${p.longitude},${p.accuracy},ST_SetSRID(ST_MakePoint(${p.longitude},${p.latitude}),4326)::geography,${new Date(p.recordedAt)})`;
      output.push({ clientPointId: p.clientPointId, status: "applied" });
    }
    return output;
  }
}
