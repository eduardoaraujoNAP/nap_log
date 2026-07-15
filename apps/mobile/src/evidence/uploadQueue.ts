import type { LocalStore } from '../offline/contracts';
import { Outbox } from '../offline/outbox';
import type { EvidenceManifest } from './types';
export interface EvidenceUploadQueue { enqueue(manifest: EvidenceManifest): Promise<void>; acknowledge(manifestId: string): Promise<void>; }
export class LocalEvidenceUploadQueue implements EvidenceUploadQueue {
  constructor(private readonly store: LocalStore) {}
  async enqueue(manifest: EvidenceManifest) { const existing = await this.store.getEvidenceManifest(manifest.id); if (existing?.status === 'queued' || existing?.status === 'acknowledged') return; const queued = { ...manifest, status: 'queued' as const, updatedAt: new Date().toISOString() }; await this.store.saveEvidenceManifest(queued); await new Outbox(this.store).add('evidence.upload.requested', manifest.activityId, { manifestId: manifest.id }); }
  async acknowledge(manifestId: string) { const manifest = await this.store.getEvidenceManifest(manifestId); if (manifest) await this.store.saveEvidenceManifest({ ...manifest, status: 'acknowledged', updatedAt: new Date().toISOString() }); }
}
