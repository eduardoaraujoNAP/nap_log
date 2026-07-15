import { describe, expect, it } from 'vitest';
import { validateEvidence } from './policy';
import type { EvidenceManifest } from './types';
const base: EvidenceManifest = { id: 'm', activityId: 'a', receiver: { name: '', document: '' }, files: [], status: 'local', updatedAt: 'now' };
describe('evidence policy', () => {
  it('blocks an incomplete completion', () => expect(validateEvidence(base)).toHaveLength(4));
  it('accepts camera photo and normalized signature', () => expect(validateEvidence({ ...base, receiver: { name: 'Maria', document: '12345' }, files: [{ id: 'p', kind: 'photo_material', source: 'camera', mimeType: 'image/jpeg', localUri: 'file://p', size: 10, sha256: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', capturedAt: 'now' }, { id: 's', kind: 'signature', source: 'signature_pad', mimeType: 'application/json', localUri: 'file://s', size: 10, sha256: 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb', capturedAt: 'now', signaturePoints: [{ x: 0, y: 0, stroke: 1 }, { x: .1, y: .1, stroke: 1 }, { x: .2, y: .2, stroke: 1 }] }] })).toEqual([]));
  it('rejects a non-camera photo', () => { const manifest = { ...base, files: [{ id: 'p', kind: 'photo_material' as const, source: 'signature_pad' as const, mimeType: 'x', localUri: 'file://x', size: 1, sha256: 'cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc', capturedAt: 'now' }] }; expect(validateEvidence(manifest)).toContain('Capture uma foto pela câmera.'); });
});
