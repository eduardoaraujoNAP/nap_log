import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import type { FleetRepository } from './fleet.repository';
import type { CreateDriverInput, CreateVehicleInput } from './fleet.types';

@Injectable()
export class PrismaFleetRepository implements FleetRepository {
 constructor(private readonly prisma:PrismaService){}
 async listDrivers(tenantId:string){return this.prisma.driver.findMany({where:{tenantId},orderBy:{name:'asc'}})}
 async createDriver(tenantId:string,input:CreateDriverInput){await this.assertCompany(tenantId,input.companyId);try{return await this.prisma.driver.create({data:{tenantId,...input}})}catch(error){this.translate(error);throw error}}
 async listVehicles(tenantId:string){return this.prisma.vehicle.findMany({where:{tenantId},orderBy:{plate:'asc'}})}
 async createVehicle(tenantId:string,input:CreateVehicleInput){await this.assertCompany(tenantId,input.companyId);try{return await this.prisma.vehicle.create({data:{tenantId,...input}})}catch(error){this.translate(error);throw error}}
 private async assertCompany(tenantId:string,id:string){const company=await this.prisma.company.findUnique({where:{tenantId_id:{tenantId,id}}});if(!company)throw new NotFoundException('Company not found')}
 private translate(error:unknown){if(error instanceof Prisma.PrismaClientKnownRequestError&&error.code==='P2002')throw new ConflictException('Fleet record already exists')}
}
