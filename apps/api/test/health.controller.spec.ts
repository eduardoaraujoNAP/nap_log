import { HealthController } from '../src/modules/health/health.controller';

describe('HealthController', () => {
  it('reports a healthy API process', () => {
    const result = new HealthController().check();
    expect(result.status).toBe('ok');
    expect(result.service).toBe('nap-log-api');
    expect(Number.isNaN(Date.parse(result.timestamp))).toBe(false);
  });
});
