export interface BackoffOptions { attempts: number; baseDelayMs: number; maxDelayMs: number; jitter: () => number; sleep: (ms: number) => Promise<void>; }
const defaults: BackoffOptions = { attempts: 3, baseDelayMs: 500, maxDelayMs: 8_000, jitter: Math.random, sleep: (ms) => new Promise((resolve) => setTimeout(resolve, ms)) };
export async function withBackoff<T>(operation: () => Promise<T>, options: Partial<BackoffOptions> = {}): Promise<T> {
  const config = { ...defaults, ...options }; let last: unknown;
  for (let attempt = 0; attempt < config.attempts; attempt++) try { return await operation(); } catch (error) { last = error; if (attempt + 1 < config.attempts) { const ceiling = Math.min(config.maxDelayMs, config.baseDelayMs * 2 ** attempt); await config.sleep(Math.round(ceiling * (.5 + config.jitter() * .5))); } }
  throw last;
}
