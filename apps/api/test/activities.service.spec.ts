import { ConflictException, NotFoundException } from '@nestjs/common';
import { InMemoryActivityRepository } from '../src/modules/activities/activity.repository';
import { ActivitiesService } from '../src/modules/activities/activities.service';

describe('ActivitiesService', () => {
  const tenantA = '865fe12e-62f8-432b-9509-75b125959370';
  const tenantB = 'f838fb2b-2a47-480f-b816-3b0229b77c91';
  let service: ActivitiesService;

  beforeEach(() => { service = new ActivitiesService(new InMemoryActivityRepository()); });

  it('isolates activities by tenant', async () => {
    const activity = await service.create(tenantA, { description: 'Entrega A', address: 'Rua A, 100' });
    await expect(service.get(tenantB, activity.id)).rejects.toBeInstanceOf(NotFoundException);
    await expect(service.list(tenantB)).resolves.toEqual([]);
  });

  it('assigns an available activity exactly once', async () => {
    const activity = await service.create(tenantA, { description: 'Entrega A', address: 'Rua A, 100' });
    const assigned = await service.assign(tenantA, activity.id, { driverId: tenantB });
    expect(assigned.status).toBe('assigned');
    expect(assigned.version).toBe(2);
    await expect(service.assign(tenantA, activity.id, { driverId: tenantB }))
      .rejects.toBeInstanceOf(ConflictException);
  });
});
