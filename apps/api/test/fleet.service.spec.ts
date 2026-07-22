import { ConflictException } from '@nestjs/common';
import { FleetService } from '../src/modules/fleet/fleet.service';
import { InMemoryFleetRepository } from '../src/modules/fleet/fleet.repository';

describe('FleetService',()=>{
 const tenantA='865fe12e-62f8-432b-9509-75b125959370',tenantB='f838fb2b-2a47-480f-b816-3b0229b77c91',company='11111111-1111-4111-8111-111111111111';
 let service:FleetService;
 beforeEach(()=>{service=new FleetService(new InMemoryFleetRepository())});
 it('isolates drivers and vehicles by tenant',async()=>{
  await service.createDriver(tenantA,{companyId:company,name:'  Maria Silva  ',document:'123'});
  await service.createVehicle(tenantA,{companyId:company,plate:'abc1d23'});
  await expect(service.listDrivers(tenantB)).resolves.toEqual([]);
  await expect(service.listVehicles(tenantB)).resolves.toEqual([]);
  await expect(service.listDrivers(tenantA)).resolves.toEqual([expect.objectContaining({name:'Maria Silva'})]);
  await expect(service.listVehicles(tenantA)).resolves.toEqual([expect.objectContaining({plate:'ABC1D23'})]);
 });
 it('rejects duplicate documents and plates inside one tenant',async()=>{
  await service.createDriver(tenantA,{companyId:company,name:'Maria Silva',document:'123'});
  await expect(service.createDriver(tenantA,{companyId:company,name:'Outra Pessoa',document:'123'})).rejects.toBeInstanceOf(ConflictException);
  await service.createVehicle(tenantA,{companyId:company,plate:'ABC1D23'});
  await expect(service.createVehicle(tenantA,{companyId:company,plate:'abc1d23'})).rejects.toBeInstanceOf(ConflictException);
 });
});
