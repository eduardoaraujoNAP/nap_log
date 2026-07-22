import { HealthController } from '../src/modules/health/health.controller';

describe('HealthController', () => {
  it('reports a healthy API process', () => {
    const result = new HealthController({} as never).check();
    expect(result.status).toBe('ok');
    expect(result.service).toBe('nap-log-api');
    expect(Number.isNaN(Date.parse(result.timestamp))).toBe(false);
  });
  it('reports readiness after checking PostgreSQL', async () => {
    const query = jest.fn().mockResolvedValue([{ value: 1 }]);
    const result = await new HealthController({ $queryRaw: query } as never).ready();
    expect(result.status).toBe('ok');
    expect(query).toHaveBeenCalledTimes(1);
  });
});
