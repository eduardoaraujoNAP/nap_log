import { performance } from "node:perf_hooks";

const url = process.env.SMOKE_URL ?? "http://127.0.0.1:3301/v1/health";
const requests = Number(process.env.SMOKE_REQUESTS ?? 100);
const concurrency = Number(process.env.SMOKE_CONCURRENCY ?? 10);
if (!Number.isInteger(requests) || requests < 1 || !Number.isInteger(concurrency) || concurrency < 1)
  throw new Error("SMOKE_REQUESTS and SMOKE_CONCURRENCY must be positive integers");

const timings = [];
let cursor = 0;
let failures = 0;
async function worker() {
  while (cursor < requests) {
    cursor += 1;
    const started = performance.now();
    try {
      const response = await fetch(url);
      if (!response.ok) failures += 1;
    } catch {
      failures += 1;
    } finally {
      timings.push(performance.now() - started);
    }
  }
}
await Promise.all(Array.from({ length: Math.min(concurrency, requests) }, worker));
timings.sort((a, b) => a - b);
const percentile = (value) => timings[Math.min(timings.length - 1, Math.ceil(timings.length * value) - 1)];
const report = { url, requests, concurrency, failures, p50Ms: percentile(0.5), p95Ms: percentile(0.95), maxMs: timings.at(-1) };
console.log(JSON.stringify(report));
if (failures > 0) process.exitCode = 1;
