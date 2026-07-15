import { Body, Controller, Get, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiTags } from '@nestjs/swagger';
import { TenantContext } from '../tenant/tenant.context';
import { RequirePermissions } from '../iam/auth.decorators';
import { ActivitiesService } from './activities.service';
import { Activity } from './activity.types';
import { AssignActivityDto } from './dto/assign-activity.dto';
import { CreateActivityDto } from './dto/create-activity.dto';

@ApiTags('activities')
@ApiHeader({ name: 'x-tenant-id', required: true })
@Controller('activities')
export class ActivitiesController {
  constructor(
    private readonly service: ActivitiesService,
    private readonly tenant: TenantContext,
  ) {}

  @Get()
  @RequirePermissions('activities:read')
  list(): Promise<Activity[]> { return this.service.list(this.tenant.id); }

  @Get(':id')
  @RequirePermissions('activities:read')
  get(@Param('id', ParseUUIDPipe) id: string): Promise<Activity> {
    return this.service.get(this.tenant.id, id);
  }

  @Post()
  @RequirePermissions('activities:write')
  @ApiOperation({ summary: 'Cria uma atividade aguardando atribuição' })
  create(@Body() dto: CreateActivityDto): Promise<Activity> {
    return this.service.create(this.tenant.id, dto);
  }

  @Post(':id/assign')
  @RequirePermissions('activities:write')
  @ApiOperation({ summary: 'Atribui uma atividade disponível a um motorista' })
  assign(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AssignActivityDto,
  ): Promise<Activity> {
    return this.service.assign(this.tenant.id, id, dto);
  }
}
