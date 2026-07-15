import { describe, expect, it, vi } from 'vitest';
import { MemoryStore } from '../offline/memoryStore';
import { ApiSyncClient } from '../sync/apiSyncClient';
import type { EvidenceManifest } from './types';
import { EvidenceSynchronizer } from './synchronizer';
const config = { apiUrl: 'https://api.test', tenantId: 'tenant', deviceId: 'device', devAuthBypass: true };
const manifest: EvidenceManifest = { id: 'manifest', activityId: '11111111-1111-4111-8111-111111111111', receiver: { name: 'Maria', document: '12345' }, status: 'queued', updatedAt: 'now', files: [{ id: 'local-photo', kind: 'photo_material', source: 'camera', localUri: 'file:///photo.jpg', mimeType: 'image/jpeg', size: 3, sha256: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', capturedAt: 'now' }] };
describe('evidence synchronizer', () => {
  it('resumes after interruption without repeating acknowledged stages', async () => {
    const store = new MemoryStore(); await store.saveEvidenceManifest(manifest); let completeAttempts = 0;
    const request = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => { const url = String(input); if (url.endsWith('/uploads:initiate')) return new Response(JSON.stringify({ id: '22222222-2222-4222-8222-222222222222', uploadUrl: 'https://signed.test/object', expiresIn: 900 }), { status: 200 }); if (url === 'https://signed.test/object') { expect(new Headers(init?.headers).get('x-amz-meta-sha256')).toBe(manifest.files[0].sha256); return new Response(null, { status: 200 }); } if (url.includes('/uploads/')) { completeAttempts++; if (completeAttempts === 1) throw new Error('network interrupted'); return new Response('{}', { status: 200 }); } if (url.includes('/activities/')) return new Response('{}', { status: 200 }); throw new Error(url); });
    const sync = new EvidenceSynchronizer(store, new ApiSyncClient(config, request as typeof fetch), async () => new Blob(['abc']));
    await expect(sync.synchronize('manifest')).rejects.toThrow('network interrupted'); expect((await store.getEvidenceManifest('manifest'))?.files[0].upload?.stage).toBe('uploaded');
    await sync.synchronize('manifest'); const saved = await store.getEvidenceManifest('manifest'); expect(saved?.status).toBe('acknowledged'); expect(saved?.files[0].localUri).toBe('file:///photo.jpg'); expect(request.mock.calls.filter(([url]) => String(url) === 'https://signed.test/object')).toHaveLength(1);
  });
  it('is a no-op when final ACK was already persisted', async () => { const store = new MemoryStore(); await store.saveEvidenceManifest({ ...manifest, status: 'acknowledged' }); const request = vi.fn(); await new EvidenceSynchronizer(store, new ApiSyncClient(config, request as typeof fetch)).synchronize('manifest'); expect(request).not.toHaveBeenCalled(); });
});
