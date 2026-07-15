export interface SignaturePoint { x: number; y: number; stroke: number; }
export interface Receiver { name: string; document: string; }
export type EvidenceType = 'photo_material' | 'signature';
export interface EvidenceUploadProgress { evidenceId: string; uploadUrl: string; stage: 'initiated' | 'uploaded' | 'confirmed'; }
export interface EvidenceFile { id: string; kind: EvidenceType; localUri: string; mimeType: string; size: number; sha256: string; capturedAt: string; source: 'camera' | 'signature_pad'; signaturePoints?: SignaturePoint[]; upload?: EvidenceUploadProgress; }
export type EvidenceUploadStatus = 'local' | 'queued' | 'acknowledged' | 'error';
export interface EvidenceManifest { id: string; activityId: string; receiver: Receiver; files: EvidenceFile[]; status: EvidenceUploadStatus; updatedAt: string; error?: { kind: 'policy' | 'conflict' | 'network'; detail: string }; }
