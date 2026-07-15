import { describe, expect, it } from 'vitest';
import { MemoryStore } from './memoryStore';
import { Outbox } from './outbox';
describe('outbox', () => {
  it('persists and acknowledges a command', async () => {
    const store = new MemoryStore(); const outbox = new Outbox(store);
    const command = await outbox.add('test', 'activity-1', { ok: true });
    expect(await store.pendingCommands()).toHaveLength(1);
    await store.acknowledge([command.id]);
    expect(await store.pendingCommands()).toHaveLength(0);
  });
});
