import { describe, expect, it, vi } from 'vitest';
import { ApiSyncClient } from './apiSyncClient';

describe('ApiSyncClient development authentication', () => {
  it('sends tenant and driver identity in development bypass mode', async () => {
    const request = vi.fn().mockResolvedValue(new Response(JSON.stringify({ results: [] }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    }));
    const client = new ApiSyncClient({
      apiUrl: 'https://api.test',
      deviceId: 'device-id',
      devAuthBypass: true,
      tenantId: 'tenant-id',
      driverId: 'driver-id',
    }, request as typeof fetch);

    await client.sendCommands([]);

    const [, init] = request.mock.calls[0] as [string, RequestInit];
    expect(init.headers).toMatchObject({
      'x-tenant-id': 'tenant-id',
      'x-driver-id': 'driver-id',
    });
  });
});
