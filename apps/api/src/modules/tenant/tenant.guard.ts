import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { FastifyRequest } from 'fastify';
import { TenantContext } from './tenant.context';

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

@Injectable()
export class TenantGuard implements CanActivate {
  constructor(private readonly context: TenantContext) {}

  canActivate(executionContext: ExecutionContext): boolean {
    const request = executionContext.switchToHttp().getRequest<FastifyRequest>();
    const value = request.headers['x-tenant-id'];
    const tenantId = Array.isArray(value) ? value[0] : value;
    if (!tenantId || !UUID_PATTERN.test(tenantId)) return false;
    this.context.set(tenantId);
    return true;
  }
}
