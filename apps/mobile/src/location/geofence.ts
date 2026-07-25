export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface ArrivalLocation extends Coordinates {
  accuracy: number | null;
  recordedAt: string;
}

export type ArrivalValidation =
  | { allowed: true; distanceM?: number }
  | {
      allowed: false;
      reason: "location_missing" | "location_stale" | "outside_geofence";
      distanceM?: number;
    };

const earthRadiusM = 6_371_000;
const radians = (degrees: number) => (degrees * Math.PI) / 180;

export function distanceMeters(from: Coordinates, to: Coordinates) {
  const latitudeDelta = radians(to.latitude - from.latitude);
  const longitudeDelta = radians(to.longitude - from.longitude);
  const fromLatitude = radians(from.latitude);
  const toLatitude = radians(to.latitude);
  const value =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(fromLatitude) *
      Math.cos(toLatitude) *
      Math.sin(longitudeDelta / 2) ** 2;
  return earthRadiusM * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
}

export function validateArrival(
  destination: Coordinates | undefined,
  location: ArrivalLocation | undefined,
  now = Date.now(),
  radiusM = 150,
  maxAgeMs = 5 * 60_000,
): ArrivalValidation {
  if (!destination) return { allowed: true };
  if (!location) return { allowed: false, reason: "location_missing" };
  const recordedAt = Date.parse(location.recordedAt);
  if (!Number.isFinite(recordedAt) || now - recordedAt > maxAgeMs)
    return { allowed: false, reason: "location_stale" };
  const distanceM = distanceMeters(destination, location);
  const toleranceM =
    radiusM + Math.min(50, Math.max(0, location.accuracy ?? 0));
  return distanceM <= toleranceM
    ? { allowed: true, distanceM }
    : { allowed: false, reason: "outside_geofence", distanceM };
}
