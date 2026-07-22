import type { Activity } from '../domain/activity';
import type { LocationPoint } from '../location/types';
import type { EvidenceManifest } from '../evidence/types';
import type { LocalStore, OutboxCommand } from './contracts';

export class MemoryStore implements LocalStore {
  private activities: Activity[] = [];
  private commands: OutboxCommand[] = [];
  private metadata = new Map<string, string>();
  private locations: LocationPoint[] = [];
  private evidence = new Map<string, EvidenceManifest>();
  async initialize() {}
  async listActivities() { return [...this.activities]; }
  async saveActivities(activities: Activity[]) { this.activities = [...activities]; }
  async replaceActivities(activities: Activity[]) { this.activities = [...activities]; }
  async getMetadata(key: string) { return this.metadata.get(key); }
  async setMetadata(key: string, value: string) { this.metadata.set(key, value); }
  async saveEvidenceManifest(manifest: EvidenceManifest) { this.evidence.set(manifest.id, structuredClone(manifest)); }
  async getEvidenceManifest(id: string) { const value = this.evidence.get(id); return value ? structuredClone(value) : undefined; }
  async saveLocationPoints(points: LocationPoint[]) { for (const point of points) if (!this.locations.some(({ id }) => id === point.id)) this.locations.push(point); }
  async pendingLocationPoints(journeyId: string, limit = 100) { return this.locations.filter((point) => point.journeyId === journeyId).sort((a, b) => a.recordedAt.localeCompare(b.recordedAt)).slice(0, limit); }
  async acknowledgeLocationPoints(ids: string[]) { const set = new Set(ids); this.locations = this.locations.filter(({ id }) => !set.has(id)); }
  async enqueue(command: OutboxCommand) {
    if (!this.commands.some(({ id }) => id === command.id)) this.commands.push(command);
  }
  async pendingCommands() { return [...this.commands]; }
  async acknowledge(ids: string[]) {
    const acknowledged = new Set(ids);
    this.commands = this.commands.filter(({ id }) => !acknowledged.has(id));
  }
}
