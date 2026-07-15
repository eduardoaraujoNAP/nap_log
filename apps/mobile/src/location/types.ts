export interface LocationPoint { id: string; journeyId: string; recordedAt: string; latitude: number; longitude: number; accuracy: number | null; speed: number | null; heading: number | null; }
export type LocationPermission = 'unknown' | 'foreground-denied' | 'background-denied' | 'granted';
export interface TrackerStartResult { permission: LocationPermission; active: boolean; }
export interface LocationBatch { idempotencyKey: string; journeyId: string; points: LocationPoint[]; }
