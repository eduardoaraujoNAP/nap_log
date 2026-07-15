import { describe, expect, it, vi } from 'vitest';
import { withBackoff } from './backoff';
describe('network backoff', () => {
  it('retries unstable networks with bounded jitter', async () => { let calls = 0; const sleep = vi.fn(async (_ms: number) => {}); const result = await withBackoff(async () => { calls++; if (calls < 3) throw new Error('offline'); return 'ok'; }, { attempts: 3, baseDelayMs: 100, jitter: () => 0, sleep }); expect(result).toBe('ok'); expect(sleep).toHaveBeenCalledTimes(2); expect(sleep.mock.calls[0][0]).toBe(50); });
  it('surfaces the final network error', async () => await expect(withBackoff(async () => { throw new Error('offline'); }, { attempts: 2, sleep: async () => {} })).rejects.toThrow('offline'));
});
