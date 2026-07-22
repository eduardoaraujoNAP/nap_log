import type { Activity } from '../domain/activity';
import type { LocationPoint, TrackerStartResult } from '../location/types';
import type { EvidenceManifest } from '../evidence/types';

export interface OutboxCommand<T = unknown> {
  id: string;
  type: string;
  aggregateId: string;
  occurredAt: string;
  sequence: number;
  payload: T;
  attempts: number;
}

export interface LocalStore {
  initialize(): Promise<void>;
  listActivities(): Promise<Activity[]>;
  saveActivities(activities: Activity[]): Promise<void>;
  replaceActivities(activities: Activity[]): Promise<void>;
  getMetadata(key: string): Promise<string | undefined>;
  setMetadata(key: string, value: string): Promise<void>;
  saveEvidenceManifest(manifest: EvidenceManifest): Promise<void>;
  getEvidenceManifest(id: string): Promise<EvidenceManifest | undefined>;
  saveLocationPoints(points: LocationPoint[]): Promise<void>;
  pendingLocationPoints(journeyId: string, limit?: number): Promise<LocationPoint[]>;
  acknowledgeLocationPoints(pointIds: string[]): Promise<void>;
  enqueue(command: OutboxCommand): Promise<void>;
  pendingCommands(): Promise<OutboxCommand[]>;
  acknowledge(commandIds: string[]): Promise<void>;
}

export interface SyncTransport {
  push(commands: OutboxCommand[]): Promise<{ acknowledged: string[] }>;
  pull(cursor?: string): Promise<{ activities: Activity[]; cursor: string }>;
}

export interface LocationTracker {
  startJourney(journeyId: string): Promise<TrackerStartResult>;
  stopJourney(): Promise<void>;
}
