import { describe, expect, it } from "vitest";
import { distanceMeters, validateArrival } from "./geofence";

const destination = { latitude: -23.5614, longitude: -46.6559 };
const now = Date.parse("2026-07-24T12:00:00Z");

describe("arrival geofence", () => {
  it("allows activities without destination coordinates", () => {
    expect(validateArrival(undefined, undefined, now)).toEqual({
      allowed: true,
    });
  });

  it("allows a recent accurate location inside the radius", () => {
    const result = validateArrival(
      destination,
      {
        latitude: -23.5615,
        longitude: -46.6559,
        accuracy: 10,
        recordedAt: "2026-07-24T11:59:00Z",
      },
      now,
    );
    expect(result.allowed).toBe(true);
    expect(distanceMeters(destination, destination)).toBe(0);
  });

  it("rejects stale or distant locations", () => {
    expect(
      validateArrival(
        destination,
        {
          ...destination,
          accuracy: 5,
          recordedAt: "2026-07-24T11:40:00Z",
        },
        now,
      ),
    ).toMatchObject({ allowed: false, reason: "location_stale" });
    expect(
      validateArrival(
        destination,
        {
          latitude: -23.5714,
          longitude: -46.6559,
          accuracy: 5,
          recordedAt: "2026-07-24T11:59:00Z",
        },
        now,
      ),
    ).toMatchObject({ allowed: false, reason: "outside_geofence" });
  });
});
