export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface ArrivalReading extends Coordinates {
  accuracy: number;
  recordedAt: string;
}

export type ServerArrivalValidation =
  | { valid: true; distanceM: number }
  | {
      valid: false;
      reason: "invalid_location" | "location_stale" | "outside_geofence";
      distanceM?: number;
    };

const radians = (degrees: number) => (degrees * Math.PI) / 180;

export function validateServerArrival(
  destination: Coordinates,
  reading: ArrivalReading,
  occurredAt: string,
  radiusM = 150,
  maxAgeMs = 5 * 60_000,
): ServerArrivalValidation {
  if (
    !Number.isFinite(reading.latitude) ||
    reading.latitude < -90 ||
    reading.latitude > 90 ||
    !Number.isFinite(reading.longitude) ||
    reading.longitude < -180 ||
    reading.longitude > 180 ||
    !Number.isFinite(reading.accuracy) ||
    reading.accuracy < 0
  )
    return { valid: false, reason: "invalid_location" };
  const recordedAt = Date.parse(reading.recordedAt);
  const commandAt = Date.parse(occurredAt);
  if (
    !Number.isFinite(recordedAt) ||
    !Number.isFinite(commandAt) ||
    Math.abs(commandAt - recordedAt) > maxAgeMs
  )
    return { valid: false, reason: "location_stale" };
  const latitudeDelta = radians(reading.latitude - destination.latitude);
  const longitudeDelta = radians(reading.longitude - destination.longitude);
  const value =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(radians(destination.latitude)) *
      Math.cos(radians(reading.latitude)) *
      Math.sin(longitudeDelta / 2) ** 2;
  const distanceM =
    6_371_000 * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
  return distanceM <= radiusM + Math.min(50, reading.accuracy)
    ? { valid: true, distanceM }
    : { valid: false, reason: "outside_geofence", distanceM };
}
