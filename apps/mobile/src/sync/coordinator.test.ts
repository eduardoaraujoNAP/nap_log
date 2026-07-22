import { describe, expect, it, vi } from 'vitest';
import { MemoryStore } from '../offline/memoryStore';
import { Outbox } from '../offline/outbox';
import { ApiSyncClient } from './apiSyncClient';
import { SyncCoordinator } from './coordinator';
const config = { apiUrl: 'https://api.test', tenantId: 'tenant', deviceId: '11111111-1111-4111-8111-111111111111', devAuthBypass: true };
describe('sync coordinator', () => {
  it('acknowledges only applied/duplicate results and retains conflicts', async () => {
    const store = new MemoryStore(); const outbox = new Outbox(store); const applied = await outbox.add('activity.status.accepted', 'a1', {}); const conflict = await outbox.add('activity.status.on_site', 'a2', {}); await outbox.add('evidence.upload.requested', 'a3', {});
    const request = vi.fn(async (input:RequestInfo|URL) => new Response(JSON.stringify(String(input).endsWith('/mobile/activities') ? [] : [{ clientCommandId: applied.id, status: 'applied' }, { clientCommandId: conflict.id, status: 'conflict' }]), { status: 200 }));
    const report = await new SyncCoordinator(store, new ApiSyncClient(config, request)).synchronize(); const pending = await store.pendingCommands();
    expect(pending.map(({ id }) => id)).toContain(conflict.id); expect(pending).toHaveLength(2); expect(report).toMatchObject({ acknowledged: 1, conflicts: 1, pending: 2 });
  });
  it('does not acknowledge a partial response missing a command', async () => {
    const store = new MemoryStore(); const outbox = new Outbox(store); const first = await outbox.add('activity.status.accepted', 'a1', {}); await outbox.add('activity.status.on_site', 'a2', {});
    const request = vi.fn(async (input:RequestInfo|URL) => new Response(JSON.stringify(String(input).endsWith('/mobile/activities') ? [] : [{ clientCommandId: first.id, status: 'duplicate' }]), { status: 200 }));
    await new SyncCoordinator(store, new ApiSyncClient(config, request)).synchronize(); expect(await store.pendingCommands()).toHaveLength(1);
  });
});
