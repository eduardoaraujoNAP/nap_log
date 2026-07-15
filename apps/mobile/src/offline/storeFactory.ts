import type { LocalStore } from './contracts';
import { MemoryStore } from './memoryStore';
export async function createLocalStore(platform: string): Promise<LocalStore> {
  if (platform === 'web' || platform === 'test') return new MemoryStore();
  const { openSQLiteLocalStore } = await import('./sqliteLocalStore');
  return openSQLiteLocalStore();
}
