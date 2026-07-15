import { describe, expect, it } from 'vitest';
import { LOCAL_SCHEMA_VERSION, pendingMigrations } from './migrations';
describe('local migrations', () => {
  it('migrates a new database', () => expect(pendingMigrations(0).map(({ version }) => version)).toEqual([1, 2, LOCAL_SCHEMA_VERSION]));
  it('does nothing when current', () => expect(pendingMigrations(LOCAL_SCHEMA_VERSION)).toEqual([]));
  it('rejects newer databases', () => expect(() => pendingMigrations(LOCAL_SCHEMA_VERSION + 1)).toThrow());
});
