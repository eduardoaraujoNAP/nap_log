import { ActivityStatus as PrismaStatus } from '@prisma/client';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { ActivityRepository } from './activity.repository';
import { Activity, ActivityStatus } from './activity.types';
const statuses: Record<ActivityStatus, PrismaStatus> = {
 draft:PrismaStatus.DRAFT, awaiting_assignment:PrismaStatus.AWAITING_ASSIGNMENT,
 assigned:PrismaStatus.ASSIGNED, accepted:PrismaStatus.ACCEPTED,
 en_route:PrismaStatus.EN_ROUTE, near_destination:PrismaStatus.NEAR_DESTINATION,
 on_site:PrismaStatus.ON_SITE, in_service:PrismaStatus.IN_SERVICE,
 completed:PrismaStatus.COMPLETED, failed:PrismaStatus.FAILED,
 rescheduled:PrismaStatus.RESCHEDULED, canceled:PrismaStatus.CANCELED,
 returned:PrismaStatus.RETURNED,
};
@Injectable()
export class PrismaActivityRepository implements ActivityRepository {
 constructor(private readonly prisma: PrismaService) {}
 async create(a:Activity):Promise<Activity>{return this.map(await this.prisma.activity.create({data:{id:a.id,tenantId:a.tenantId,externalReference:a.externalReference,description:a.description,address:a.address,status:statuses[a.status],version:a.version,createdAt:new Date(a.createdAt),updatedAt:new Date(a.updatedAt)}}))}
 async findAll(tenantId:string):Promise<Activity[]>{return (await this.prisma.activity.findMany({where:{tenantId},orderBy:{updatedAt:'desc'}})).map(r=>this.map(r))}
 async findById(tenantId:string,id:string):Promise<Activity|undefined>{const r=await this.prisma.activity.findUnique({where:{tenantId_id:{tenantId,id}},include:{assignments:{where:{endedAt:null},take:1}}});return r?this.map(r,r.assignments[0]?.driverId):undefined}
 async save(a:Activity):Promise<Activity>{return this.prisma.$transaction(async tx=>{const current=await tx.activity.findUniqueOrThrow({where:{tenantId_id:{tenantId:a.tenantId,id:a.id}}});const row=await tx.activity.update({where:{tenantId_id:{tenantId:a.tenantId,id:a.id}},data:{status:statuses[a.status],version:{increment:1},...(a.assignedDriverId?{assignments:{create:{tenant:{connect:{id:a.tenantId}},driver:{connect:{tenantId_id:{tenantId:a.tenantId,id:a.assignedDriverId}}}}}}:{}),events:{create:{tenant:{connect:{id:a.tenantId}},type:'activity.status_changed',payload:{from:current.status,to:a.status}}}}});return this.map(row,a.assignedDriverId)})}
 private map(r:{id:string;tenantId:string;externalReference:string|null;description:string;address:string;status:PrismaStatus;version:number;createdAt:Date;updatedAt:Date},driverId?:string):Activity{return{id:r.id,tenantId:r.tenantId,...(r.externalReference?{externalReference:r.externalReference}:{}),description:r.description,address:r.address,status:r.status.toLowerCase() as ActivityStatus,...(driverId?{assignedDriverId:driverId}:{}),version:r.version,createdAt:r.createdAt.toISOString(),updatedAt:r.updatedAt.toISOString()}}
}
