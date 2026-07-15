import type { LocationPoint } from '../location/types';
import type { OutboxCommand } from '../offline/contracts';
export type ResultStatus = 'applied' | 'duplicate' | 'conflict' | 'rejected';
export interface CommandResult { clientCommandId: string; status: ResultStatus; reason?: string; journeyId?: string; }
export interface PointResult { clientPointId: string; status: ResultStatus; reason?: string; }
export interface ApiSyncConfig { apiUrl: string; deviceId: string; accessToken?: string; devAuthBypass: boolean; tenantId?: string; }
type Fetch = typeof fetch;
export class ApiRequestError extends Error { constructor(readonly status: number, message: string) { super(message); } }
const commandType: Record<string, string | undefined> = { 'activity.status.accepted': 'accept_activity', 'activity.status.on_site': 'arrive', 'journey.started': 'start_route' };
export class ApiSyncClient {
  constructor(readonly config: ApiSyncConfig, private readonly request: Fetch = fetch) {}
  isSupported(command: OutboxCommand) { return Boolean(commandType[command.type]); }
  async sendCommands(commands: OutboxCommand[]): Promise<CommandResult[]> {
    const body = { commands: commands.map((command) => ({ clientCommandId: command.id, deviceId: this.config.deviceId, type: commandType[command.type], occurredAt: command.occurredAt, payload: { ...(command.payload as object), activityId: command.aggregateId } })) };
    return this.json('/mobile/commands:batch', { method: 'POST', body: JSON.stringify(body) });
  }
  async sendGps(journeyId: string, points: LocationPoint[], idempotencyKey: string): Promise<PointResult[]> {
    return this.json(`/journeys/${journeyId}/gps:batch`, { method: 'POST', headers: { 'idempotency-key': idempotencyKey }, body: JSON.stringify({ points: points.map((point) => ({ clientPointId: point.id, latitude: point.latitude, longitude: point.longitude, accuracy: point.accuracy ?? 0, recordedAt: point.recordedAt })) }) });
  }
  async initiateEvidence(input: { activityId: string; kind: 'photo_material' | 'signature'; origin: 'camera' | 'signature_pad'; mimeType: string; size: number; sha256: string }) { return this.json<{ id: string; uploadUrl: string; expiresIn: number }>('/uploads:initiate', { method: 'POST', body: JSON.stringify(input) }); }
  async uploadEvidence(uploadUrl: string, body: Blob, file: { mimeType: string; size: number; sha256: string }) { const response = await this.request(uploadUrl, { method: 'PUT', headers: { 'content-type': file.mimeType, 'content-length': String(file.size), 'x-amz-meta-sha256': file.sha256 }, body }); if (!response.ok) throw new ApiRequestError(response.status, 'Upload falhou: ' + response.status); }
  async completeEvidence(uploadId: string, size: number, sha256: string) { return this.json(`/uploads/` + uploadId + `/complete`, { method: 'POST', body: JSON.stringify({ size, sha256 }) }); }
  async completeActivity(activityId: string, receiverName: string) { return this.json(`/activities/` + activityId + `/complete`, { method: 'POST', body: JSON.stringify({ receiverName }) }); }
  private async json<T>(path: string, init: RequestInit): Promise<T> { const response = await this.request(`${this.config.apiUrl.replace(/\/$/, '')}${path}`, { ...init, headers: { 'content-type': 'application/json', ...(this.config.accessToken ? { authorization: 'Bearer ' + this.config.accessToken } : {}), ...(this.config.devAuthBypass && this.config.tenantId ? { 'x-tenant-id': this.config.tenantId } : {}), ...init.headers } }); if (!response.ok) throw new ApiRequestError(response.status, 'API ' + response.status); return response.json() as Promise<T>; }
}
export function apiConfigFromEnv(accessToken: string | undefined, deviceId: string): ApiSyncConfig | undefined {
  const env = process.env; const apiUrl = env.EXPO_PUBLIC_API_URL; const devAuthBypass = typeof __DEV__ !== 'undefined' && __DEV__ && env.EXPO_PUBLIC_DEV_AUTH_BYPASS === 'true'; const tenantId = devAuthBypass ? env.EXPO_PUBLIC_TENANT_ID ?? env.TENANT_ID : undefined;
  return apiUrl && (accessToken || (devAuthBypass && tenantId)) ? { apiUrl, deviceId, accessToken, devAuthBypass, tenantId } : undefined;
}
