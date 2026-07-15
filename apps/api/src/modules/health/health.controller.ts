import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../iam/auth.decorators';

export interface HealthResponse {
  status: 'ok';
  service: 'nap-log-api';
  timestamp: string;
}

@ApiTags('health')
@Controller('health')
@Public()
export class HealthController {
  @Get()
  @ApiOperation({ summary: 'Verifica se o processo da API está disponível' })
  check(): HealthResponse {
    return {
      status: 'ok',
      service: 'nap-log-api',
      timestamp: new Date().toISOString(),
    };
  }
}
