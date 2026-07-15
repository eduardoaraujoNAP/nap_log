import { Injectable, Scope } from '@nestjs/common';

@Injectable({ scope: Scope.REQUEST })
export class TenantContext {
  private tenantId?: string;

  set(id: string): void { this.tenantId = id; }

  get id(): string {
    if (!this.tenantId) throw new Error('Tenant context was not initialized');
    return this.tenantId;
  }
}
