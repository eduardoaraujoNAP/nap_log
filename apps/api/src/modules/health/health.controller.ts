import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../iam/auth.decorators';
import { PrismaService } from '../../database/prisma.service';

export interface HealthResponse {
  status: 'ok';
  service: 'nap-log-api';
  timestamp: string;
}

@ApiTags('health')
@Controller('health')
@Public()
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}
  @Get()
  @ApiOperation({ summary: 'Verifica se o processo da API está disponível' })
  check(): HealthResponse {
    return {
      status: 'ok',
      service: 'nap-log-api',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('ready')
  @ApiOperation({ summary: 'Verifica se a API está pronta para receber tráfego' })
  async ready(): Promise<HealthResponse> {
    await this.prisma.$queryRaw`SELECT 1`;
    return { status: 'ok', service: 'nap-log-api', timestamp: new Date().toISOString() };
  }
}
