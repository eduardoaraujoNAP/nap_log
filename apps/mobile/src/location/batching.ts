import type { LocationBatch, LocationPoint } from './types';
export function buildLocationBatches(points: LocationPoint[], maxSize: number): LocationBatch[] {
  if (!Number.isInteger(maxSize) || maxSize < 1) throw new Error('Tamanho de lote inválido');
  const ordered = [...points].sort((a, b) => a.recordedAt.localeCompare(b.recordedAt) || a.id.localeCompare(b.id));
  const batches: LocationBatch[] = [];
  for (let index = 0; index < ordered.length; index += maxSize) {
    const group = ordered.slice(index, index + maxSize); const journeyId = group[0].journeyId;
    if (group.some((point) => point.journeyId !== journeyId)) throw new Error('Um lote não pode misturar jornadas');
    batches.push({ journeyId, points: group, idempotencyKey: `gps:${journeyId}:${group[0].id}:${group[group.length - 1].id}` });
  }
  return batches;
}
