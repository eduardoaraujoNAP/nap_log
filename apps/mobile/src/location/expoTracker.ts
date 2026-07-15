import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import type { LocalStore, LocationTracker } from '../offline/contracts';
import { openSQLiteLocalStore } from '../offline/sqliteLocalStore';
import { DEFAULT_TRACKING_POLICY, type TrackingPolicy } from './policy';
import type { LocationPoint, TrackerStartResult } from './types';
import { createUuid } from '../utils/id';
export const LOCATION_TASK = 'nap-log-active-journey-location';
function mapPoint(journeyId: string, location: Location.LocationObject): LocationPoint {
  const recordedAt = new Date(location.timestamp).toISOString();
  return { id: createUuid(), journeyId, recordedAt, latitude: location.coords.latitude, longitude: location.coords.longitude, accuracy: location.coords.accuracy, speed: location.coords.speed, heading: location.coords.heading };
}
TaskManager.defineTask(LOCATION_TASK, async ({ data, error }) => {
  if (error || !data) return;
  const store = await openSQLiteLocalStore(); await store.initialize();
  const journeyId = await store.getMetadata('activeJourneyId'); if (!journeyId) return;
  const locations = (data as { locations?: Location.LocationObject[] }).locations ?? [];
  await store.saveLocationPoints(locations.map((value) => mapPoint(journeyId, value)));
});
export class ExpoLocationTracker implements LocationTracker {
  constructor(private readonly store: LocalStore, private readonly policy: TrackingPolicy = DEFAULT_TRACKING_POLICY) {}
  async startJourney(journeyId: string): Promise<TrackerStartResult> {
    const foreground = await Location.requestForegroundPermissionsAsync();
    if (foreground.status !== 'granted') return { permission: 'foreground-denied', active: false };
    const background = await Location.requestBackgroundPermissionsAsync();
    if (background.status !== 'granted') return { permission: 'background-denied', active: false };
    await this.store.setMetadata('activeJourneyId', journeyId);
    if (!(await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK))) await Location.startLocationUpdatesAsync(LOCATION_TASK, {
      accuracy: Location.Accuracy.Balanced, timeInterval: this.policy.timeIntervalMs, distanceInterval: this.policy.distanceIntervalM,
      pausesUpdatesAutomatically: false, showsBackgroundLocationIndicator: true,
      foregroundService: { notificationTitle: 'Jornada em andamento', notificationBody: 'O NAP Log registra sua rota durante a jornada.', notificationColor: '#176B5B' },
    });
    return { permission: 'granted', active: true };
  }
  async stopJourney() { await this.store.setMetadata('activeJourneyId', ''); if (await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK)) await Location.stopLocationUpdatesAsync(LOCATION_TASK); }
}
