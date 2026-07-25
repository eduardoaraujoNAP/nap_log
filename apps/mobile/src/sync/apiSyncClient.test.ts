import { describe, expect, it, vi } from "vitest";
import { ApiSyncClient } from "./apiSyncClient";

describe("ApiSyncClient development authentication", () => {
  it("sends tenant and driver identity in development bypass mode", async () => {
    const request = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ results: [] }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );
    const client = new ApiSyncClient(
      {
        apiUrl: "https://api.test",
        deviceId: "device-id",
        devAuthBypass: true,
        tenantId: "tenant-id",
        driverId: "driver-id",
      },
      request as typeof fetch,
    );

    await client.sendCommands([]);

    const [, init] = request.mock.calls[0] as [string, RequestInit];
    expect(init.headers).toMatchObject({
      "x-tenant-id": "tenant-id",
      "x-driver-id": "driver-id",
    });
  });
  it("maps every activity transition to a supported API command", async () => {
    const request = vi
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify([]), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      );
    const client = new ApiSyncClient(
      {
        apiUrl: "https://api.test",
        deviceId: "device-id",
        devAuthBypass: true,
        tenantId: "tenant-id",
      },
      request as typeof fetch,
    );
    const types = ["accepted", "en_route", "on_site", "in_service", "failed"];
    const commands = types.map((status, sequence) => ({
      id: "command-" + sequence,
      type: "activity.status." + status,
      aggregateId: "activity-id",
      occurredAt: "2026-07-23T12:00:00Z",
      sequence,
      payload: status === "failed" ? { reason: "Cliente ausente" } : {},
      attempts: 0,
    }));
    expect(commands.every((command) => client.isSupported(command))).toBe(true);
    await client.sendCommands(commands);
    const body = JSON.parse(
      String((request.mock.calls[0][1] as RequestInit).body),
    );
    expect(body.commands.map((item: { type: string }) => item.type)).toEqual([
      "accept_activity",
      "depart_activity",
      "arrive",
      "start_service",
      "fail_activity",
    ]);
  });
});
