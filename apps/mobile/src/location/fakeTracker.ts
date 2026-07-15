import type { LocationTracker } from '../offline/contracts';
import type { LocationPermission, TrackerStartResult } from './types';
export class FakeLocationTracker implements LocationTracker {
  active = false;
  constructor(private readonly permission: LocationPermission = 'granted') {}
  async startJourney(): Promise<TrackerStartResult> { this.active = this.permission === 'granted'; return { permission: this.permission, active: this.active }; }
  async stopJourney(): Promise<void> { this.active = false; }
}
