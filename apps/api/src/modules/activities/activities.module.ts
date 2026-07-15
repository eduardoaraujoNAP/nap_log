import { Module } from '@nestjs/common';
import { TenantModule } from '../tenant/tenant.module';
import { ActivitiesController } from './activities.controller';
import {
  ACTIVITY_REPOSITORY,
  InMemoryActivityRepository,
} from './activity.repository';
import { ActivitiesService } from './activities.service';
import { PrismaService } from '../../database/prisma.service';
import { PrismaActivityRepository } from './prisma-activity.repository';

@Module({
  imports: [TenantModule],
  controllers: [ActivitiesController],
  providers: [
    ActivitiesService,
    {
      provide: ACTIVITY_REPOSITORY,
      inject: [PrismaService],
      useFactory: (prisma: PrismaService) =>
        process.env.NODE_ENV === 'test'
          ? new InMemoryActivityRepository()
          : new PrismaActivityRepository(prisma),
    },
  ],
  exports: [ActivitiesService],
})
export class ActivitiesModule {}
