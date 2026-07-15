import { describe, expect, it } from 'vitest';
import { MemoryStore } from '../offline/memoryStore';
import type { EvidenceManifest } from './types';
import { LocalEvidenceUploadQueue } from './uploadQueue';
describe('evidence upload queue', () => {
  it('is idempotent and remains pending until explicit ACK', async () => { const store = new MemoryStore(); const queue = new LocalEvidenceUploadQueue(store); const manifest: EvidenceManifest = { id: 'm', activityId: 'a', receiver: { name: 'M', document: '12345' }, files: [], status: 'local', updatedAt: 'now' }; await queue.enqueue(manifest); await queue.enqueue(manifest); expect(await store.pendingCommands()).toHaveLength(1); expect((await store.getEvidenceManifest('m'))?.status).toBe('queued'); await queue.acknowledge('m'); expect((await store.getEvidenceManifest('m'))?.status).toBe('acknowledged'); });
});
