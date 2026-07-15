import type { EvidenceManifest } from './types';
export interface EvidencePolicy { requireReceiverName: boolean; requireReceiverDocument: boolean; requirePhoto: boolean; requireSignature: boolean; }
export const DEFAULT_EVIDENCE_POLICY: EvidencePolicy = { requireReceiverName: true, requireReceiverDocument: true, requirePhoto: true, requireSignature: true };
export function validateEvidence(manifest: EvidenceManifest, policy = DEFAULT_EVIDENCE_POLICY): string[] {
  const errors: string[] = [];
  if (policy.requireReceiverName && manifest.receiver.name.trim().length < 2) errors.push('Informe o nome do recebedor.');
  if (policy.requireReceiverDocument && manifest.receiver.document.replace(/\D/g, '').length < 5) errors.push('Informe um documento válido.');
  if (policy.requirePhoto && !manifest.files.some(({ kind, source }) => kind === 'photo_material' && source === 'camera')) errors.push('Capture uma foto pela câmera.');
  if (policy.requireSignature && !manifest.files.some(({ kind, signaturePoints }) => kind === 'signature' && (signaturePoints?.length ?? 0) >= 3)) errors.push('Colete a assinatura do recebedor.');
  return errors;
}
