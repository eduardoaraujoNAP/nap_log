import { Module } from '@nestjs/common';import { APP_GUARD } from '@nestjs/core';import { TenantModule } from '../tenant/tenant.module';import { JwtAuthGuard } from './jwt-auth.guard';import { PermissionsGuard } from './permissions.guard';
@Module({imports:[TenantModule],providers:[{provide:APP_GUARD,useClass:JwtAuthGuard},{provide:APP_GUARD,useClass:PermissionsGuard}]})export class IamModule{}
