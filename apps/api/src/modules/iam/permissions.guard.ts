import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from './auth.decorators';import { AuthPrincipal } from './jwt-auth.guard';
@Injectable()export class PermissionsGuard implements CanActivate{constructor(private readonly reflector:Reflector){}canActivate(c:ExecutionContext){const required=this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY,[c.getHandler(),c.getClass()])??[];if(!required.length)return true;const user=c.switchToHttp().getRequest<{user?:AuthPrincipal}>().user;if(!user||(!user.permissions.includes('*')&&!required.every(p=>user.permissions.includes(p))))throw new ForbiddenException('Permission denied');return true}}
