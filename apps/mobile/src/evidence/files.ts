import type { EvidenceFile, SignaturePoint } from './types';
async function hashAndSize(uri: string) {
  const FileSystem = await import('expo-file-system'); const Crypto = await import('expo-crypto'); const info = await FileSystem.getInfoAsync(uri);
  if (!info.exists || !('size' in info) || !info.size) throw new Error('Arquivo de evidência vazio');
  const base64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 }); const bytes = Uint8Array.from(atob(base64), (character) => character.charCodeAt(0)); const digest = await Crypto.digest(Crypto.CryptoDigestAlgorithm.SHA256, bytes); const sha256 = Array.from(new Uint8Array(digest), (value) => value.toString(16).padStart(2, '0')).join('');
  return { size: info.size, sha256 };
}
export async function persistCameraPhoto(activityId: string, temporaryUri: string): Promise<EvidenceFile> {
  const FileSystem = await import('expo-file-system'); if (!FileSystem.documentDirectory) throw new Error('Armazenamento local indisponível');
  const directory = `${FileSystem.documentDirectory}evidence/`; await FileSystem.makeDirectoryAsync(directory, { intermediates: true }); const id = `${activityId}-${Date.now()}`; const localUri = `${directory}${id}.jpg`; await FileSystem.copyAsync({ from: temporaryUri, to: localUri });
  return { id, kind: 'photo_material', localUri, mimeType: 'image/jpeg', ...(await hashAndSize(localUri)), capturedAt: new Date().toISOString(), source: 'camera' };
}
export async function persistSignature(activityId: string, points: SignaturePoint[]): Promise<EvidenceFile> {
  const FileSystem = await import('expo-file-system'); if (!FileSystem.documentDirectory) throw new Error('Armazenamento local indisponível');
  const directory = `${FileSystem.documentDirectory}evidence/`; await FileSystem.makeDirectoryAsync(directory, { intermediates: true }); const id = `${activityId}-signature-${Date.now()}`; const localUri = `${directory}${id}.json`; await FileSystem.writeAsStringAsync(localUri, JSON.stringify({ version: 1, points }));
  return { id, kind: 'signature', localUri, mimeType: 'application/json', ...(await hashAndSize(localUri)), capturedAt: new Date().toISOString(), source: 'signature_pad', signaturePoints: points };
}
