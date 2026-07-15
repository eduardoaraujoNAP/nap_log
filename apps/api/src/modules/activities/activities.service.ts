import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import {
  ACTIVITY_REPOSITORY,
  ActivityRepository,
} from './activity.repository';
import { Activity } from './activity.types';
import { AssignActivityDto } from './dto/assign-activity.dto';
import { CreateActivityDto } from './dto/create-activity.dto';

@Injectable()
export class ActivitiesService {
  constructor(
    @Inject(ACTIVITY_REPOSITORY)
    private readonly repository: ActivityRepository,
  ) {}

  list(tenantId: string): Promise<Activity[]> {
    return this.repository.findAll(tenantId);
  }

  async get(tenantId: string, id: string): Promise<Activity> {
    const activity = await this.repository.findById(tenantId, id);
    if (!activity) throw new NotFoundException('Activity not found');
    return activity;
  }

  create(tenantId: string, dto: CreateActivityDto): Promise<Activity> {
    const now = new Date().toISOString();
    return this.repository.create({
      id: randomUUID(),
      tenantId,
      ...dto,
      status: 'awaiting_assignment',
      version: 1,
      createdAt: now,
      updatedAt: now,
    });
  }

  async assign(
    tenantId: string,
    id: string,
    dto: AssignActivityDto,
  ): Promise<Activity> {
    const activity = await this.get(tenantId, id);
    if (activity.status !== 'awaiting_assignment') {
      throw new ConflictException(
        `Cannot assign activity in ${activity.status} status`,
      );
    }
    return this.repository.save({
      ...activity,
      assignedDriverId: dto.driverId,
      status: 'assigned',
      version: activity.version + 1,
      updatedAt: new Date().toISOString(),
    });
  }
}
