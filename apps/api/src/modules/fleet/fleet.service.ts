import { Inject, Injectable } from '@nestjs/common';
import { FLEET_REPOSITORY, type FleetRepository } from './fleet.repository';
import type { CreateDriverInput, CreateVehicleInput } from './fleet.types';
@Injectable()
export class FleetService {
 constructor(@Inject(FLEET_REPOSITORY)private readonly repository:FleetRepository){}
 listDrivers(tenantId:string){return this.repository.listDrivers(tenantId)}
 createDriver(tenantId:string,input:CreateDriverInput){return this.repository.createDriver(tenantId,{...input,document:input.document?.trim()||undefined,name:input.name.trim()})}
 listVehicles(tenantId:string){return this.repository.listVehicles(tenantId)}
 createVehicle(tenantId:string,input:CreateVehicleInput){return this.repository.createVehicle(tenantId,{...input,plate:input.plate.toUpperCase()})}
}
