import { ApiSyncClient } from '../sync/apiSyncClient';
import type { LocalStore } from '../offline/contracts';
import type { EvidenceFile, EvidenceManifest } from './types';
export type EvidenceFileLoader = (uri: string) => Promise<Blob>;
const defaultLoader: EvidenceFileLoader = async (uri) => { const response = await fetch(uri); if (!response.ok) throw new Error('Não foi possível ler a evidência local'); return response.blob(); };
export class EvidenceSynchronizer {
  constructor(private readonly store: LocalStore, private readonly api: ApiSyncClient, private readonly loadFile: EvidenceFileLoader = defaultLoader) {}
  async synchronize(manifestId: string): Promise<EvidenceManifest> {
    let manifest = await this.store.getEvidenceManifest(manifestId); if (!manifest) throw new Error('Manifesto não encontrado'); if (manifest.status === 'acknowledged') return manifest;
    for (let index = 0; index < manifest.files.length; index++) {
      let file = manifest.files[index];
      if (!file.upload) { const initiated = await this.api.initiateEvidence({ activityId: manifest.activityId, kind: file.kind, origin: file.source, mimeType: file.mimeType, size: file.size, sha256: file.sha256 }); file = { ...file, upload: { evidenceId: initiated.id, uploadUrl: initiated.uploadUrl, stage: 'initiated' } }; manifest = await this.saveFile(manifest, index, file); }
      let progress = file.upload; if (!progress) throw new Error('Etapa de upload ausente');
      if (progress.stage === 'initiated') { await this.api.uploadEvidence(progress.uploadUrl, await this.loadFile(file.localUri), file); progress = { ...progress, stage: 'uploaded' }; file = { ...file, upload: progress }; manifest = await this.saveFile(manifest, index, file); }
      if (progress.stage === 'uploaded') { await this.api.completeEvidence(progress.evidenceId, file.size, file.sha256); progress = { ...progress, stage: 'confirmed' }; file = { ...file, upload: progress }; manifest = await this.saveFile(manifest, index, file); }
    }
    await this.api.completeActivity(manifest.activityId, manifest.receiver.name);
    manifest = { ...manifest, status: 'acknowledged', error: undefined, updatedAt: new Date().toISOString() }; await this.store.saveEvidenceManifest(manifest); return manifest;
  }
  private async saveFile(manifest: EvidenceManifest, index: number, file: EvidenceFile) { const files = [...manifest.files]; files[index] = file; const updated = { ...manifest, files, status: 'queued' as const, error: undefined, updatedAt: new Date().toISOString() }; await this.store.saveEvidenceManifest(updated); return updated; }
}
