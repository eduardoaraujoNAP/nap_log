import { ConflictException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { CreateDriverInput, CreateVehicleInput, DriverRecord, VehicleRecord } from './fleet.types';

export const FLEET_REPOSITORY=Symbol('FLEET_REPOSITORY');
export interface FleetRepository {
 listDrivers(tenantId:string):Promise<DriverRecord[]>;
 createDriver(tenantId:string,input:CreateDriverInput):Promise<DriverRecord>;
 listVehicles(tenantId:string):Promise<VehicleRecord[]>;
 createVehicle(tenantId:string,input:CreateVehicleInput):Promise<VehicleRecord>;
}
export class InMemoryFleetRepository implements FleetRepository {
 private drivers:DriverRecord[]=[];private vehicles:VehicleRecord[]=[];
 async listDrivers(tenantId:string){return this.drivers.filter(item=>item.tenantId===tenantId)}
 async createDriver(tenantId:string,input:CreateDriverInput){if(input.document&&this.drivers.some(item=>item.tenantId===tenantId&&item.document===input.document))throw new ConflictException('Driver document already exists');const item={id:randomUUID(),tenantId,...input};this.drivers.push(item);return item}
 async listVehicles(tenantId:string){return this.vehicles.filter(item=>item.tenantId===tenantId)}
 async createVehicle(tenantId:string,input:CreateVehicleInput){if(this.vehicles.some(item=>item.tenantId===tenantId&&item.plate===input.plate))throw new ConflictException('Vehicle plate already exists');const item={id:randomUUID(),tenantId,...input};this.vehicles.push(item);return item}
}
