import { Module } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { TenantModule } from '../tenant/tenant.module';
import { FleetController } from './fleet.controller';
import { FLEET_REPOSITORY, InMemoryFleetRepository } from './fleet.repository';
import { FleetService } from './fleet.service';
import { PrismaFleetRepository } from './prisma-fleet.repository';
@Module({imports:[TenantModule],controllers:[FleetController],providers:[FleetService,{provide:FLEET_REPOSITORY,inject:[PrismaService],useFactory:(prisma:PrismaService)=>process.env.NODE_ENV==='test'?new InMemoryFleetRepository():new PrismaFleetRepository(prisma)}]})
export class FleetModule{}
