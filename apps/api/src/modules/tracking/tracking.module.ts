import { Controller, Get, Injectable, Module } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { RequirePermissions } from '../iam/auth.decorators';
import { TenantContext } from '../tenant/tenant.context';
import { TenantModule } from '../tenant/tenant.module';

export interface LatestPosition {
  journeyId:string;driverId:string;driverName:string;latitude:number;longitude:number;
  accuracy:number;recordedAt:string;status:'online'|'stale';
}

export const POSITION_STALE_AFTER_MS = 2 * 60 * 1000;

export function positionStatus(recordedAt: Date, now = new Date()): LatestPosition['status'] {
  return now.getTime() - recordedAt.getTime() > POSITION_STALE_AFTER_MS ? 'stale' : 'online';
}

@Injectable()
export class TrackingService {
  constructor(private readonly prisma:PrismaService){}
  async latest(tenantId:string):Promise<LatestPosition[]> {
    const rows=await this.prisma.$queryRaw<Array<{journey_id:string;driver_id:string;driver_name:string;latitude:number;longitude:number;accuracy:number;recorded_at:Date}>>(Prisma.sql`
      SELECT DISTINCT ON (j.driver_id)
        gp.journey_id, j.driver_id, d.name AS driver_name,
        gp.latitude, gp.longitude, gp.accuracy, gp.recorded_at
      FROM gps_points gp
      JOIN journeys j ON j.tenant_id = gp.tenant_id AND j.id = gp.journey_id
      JOIN drivers d ON d.tenant_id = j.tenant_id AND d.id = j.driver_id
      WHERE gp.tenant_id = ${tenantId}::uuid AND j.status = 'active' AND j.ended_at IS NULL
      ORDER BY j.driver_id, gp.recorded_at DESC
    `);
    const now = new Date();
    return rows.map(row=>({journeyId:row.journey_id,driverId:row.driver_id,driverName:row.driver_name,latitude:row.latitude,longitude:row.longitude,accuracy:row.accuracy,recordedAt:row.recorded_at.toISOString(),status:positionStatus(row.recorded_at,now)}));
  }
}

@Controller('tracking')
@RequirePermissions('activities:read')
export class TrackingController {
  constructor(private readonly service:TrackingService,private readonly tenant:TenantContext){}
  @Get('positions') positions(){return this.service.latest(this.tenant.id)}
}

@Module({imports:[TenantModule],controllers:[TrackingController],providers:[TrackingService]})
export class TrackingModule{}
