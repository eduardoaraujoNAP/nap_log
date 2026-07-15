import { Injectable } from '@nestjs/common';
import { Prisma, ActivityStatus as DbStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { GpsPointDto, MobileCommandDto } from './mobile.dto';
export type CommandResult={clientCommandId:string;status:'applied'|'duplicate'|'conflict'|'rejected';reason?:string;journeyId?:string};
@Injectable()
export class MobileService {
 constructor(private readonly prisma:PrismaService){}
 async commands(tenantId:string,items:MobileCommandDto[]):Promise<CommandResult[]> {
  const results:CommandResult[]=[];
  for(const command of items) results.push(await this.command(tenantId,command));
  return results;
 }
 private async command(tenantId:string,c:MobileCommandDto):Promise<CommandResult>{
  const old=await this.prisma.mobileCommandReceipt.findUnique({where:{tenantId_deviceId_clientCommandId:{tenantId,deviceId:c.deviceId,clientCommandId:c.clientCommandId}}});
  if(old)return{...(old.result as CommandResult),status:'duplicate'};
  let result:CommandResult={clientCommandId:c.clientCommandId,status:'rejected',reason:'invalid_payload'};
  try{result=await this.prisma.$transaction(async tx=>{
   if(c.type==='start_route'){const driverId=String(c.payload.driverId??'');if(!/^[0-9a-f-]{36}$/i.test(driverId))return result;const j=await tx.journey.create({data:{tenantId,driverId,startedAt:new Date(c.occurredAt)}});return{clientCommandId:c.clientCommandId,status:'applied',journeyId:j.id};}
   const activityId=String(c.payload.activityId??'');const a=await tx.activity.findUnique({where:{tenantId_id:{tenantId,id:activityId}}});if(!a)return{clientCommandId:c.clientCommandId,status:'rejected',reason:'activity_not_found'};
   const expected=c.type==='accept_activity'?DbStatus.ASSIGNED:DbStatus.EN_ROUTE;const next=c.type==='accept_activity'?DbStatus.ACCEPTED:DbStatus.ON_SITE;
   if(a.status!==expected)return{clientCommandId:c.clientCommandId,status:'conflict',reason:`expected_${expected.toLowerCase()}`};
   await tx.activity.update({where:{tenantId_id:{tenantId,id:activityId}},data:{status:next,version:{increment:1},events:{create:{tenant:{connect:{id:tenantId}},type:`activity.${c.type}`,payload:{deviceId:c.deviceId,occurredAt:c.occurredAt}}}}});
   return{clientCommandId:c.clientCommandId,status:'applied'};
  });}catch{return{clientCommandId:c.clientCommandId,status:'rejected',reason:'invalid_reference'};}
  await this.prisma.mobileCommandReceipt.create({data:{tenantId,deviceId:c.deviceId,clientCommandId:c.clientCommandId,commandType:c.type,occurredAt:new Date(c.occurredAt),result:result as Prisma.InputJsonValue}});
  return result;
 }
 async gps(tenantId:string,journeyId:string,points:GpsPointDto[]){
  const journey=await this.prisma.journey.findUnique({where:{tenantId_id:{tenantId,id:journeyId}}});
  if(!journey||journey.status!=='active'||journey.endedAt)return points.map(p=>({clientPointId:p.clientPointId,status:'rejected',reason:'journey_inactive'}));
  const output=[];for(const p of points){const duplicate=await this.prisma.gpsPoint.findUnique({where:{tenantId_journeyId_clientPointId:{tenantId,journeyId,clientPointId:p.clientPointId}}});if(duplicate){output.push({clientPointId:p.clientPointId,status:'duplicate'});continue;}
   await this.prisma.$executeRaw`INSERT INTO "gps_points" ("id","tenant_id","journey_id","client_point_id","latitude","longitude","accuracy","location","recorded_at") VALUES (gen_random_uuid(),${tenantId}::uuid,${journeyId}::uuid,${p.clientPointId}::uuid,${p.latitude},${p.longitude},${p.accuracy},ST_SetSRID(ST_MakePoint(${p.longitude},${p.latitude}),4326)::geography,${new Date(p.recordedAt)})`;
   output.push({clientPointId:p.clientPointId,status:'applied'});
  }return output;
 }
}
