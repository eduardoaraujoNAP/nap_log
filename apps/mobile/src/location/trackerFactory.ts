import type { LocalStore, LocationTracker } from '../offline/contracts';
import { FakeLocationTracker } from './fakeTracker';
export async function createLocationTracker(platform: string, store: LocalStore): Promise<LocationTracker> {
  if (platform === 'web' || platform === 'test') return new FakeLocationTracker();
  const { ExpoLocationTracker } = await import('./expoTracker'); return new ExpoLocationTracker(store);
}
