import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { createRemoteJWKSet, jwtVerify, JWTPayload } from 'jose';
import { FastifyRequest } from 'fastify';
import { TenantContext } from '../tenant/tenant.context';
import { IS_PUBLIC_KEY } from './auth.decorators';
export interface AuthPrincipal{subject:string;tenantId:string;permissions:string[];claims:JWTPayload}
@Injectable()
export class JwtAuthGuard implements CanActivate{
 private readonly bypass:boolean;private readonly issuer?:string;private readonly audience?:string;private readonly jwks?:ReturnType<typeof createRemoteJWKSet>;
 constructor(private readonly reflector:Reflector,private readonly config:ConfigService,private readonly tenant:TenantContext){
  const env=config.get('NODE_ENV','development');this.bypass=config.get('DEV_AUTH_BYPASS','false')==='true';
  if(this.bypass&&env==='production')throw new Error('DEV_AUTH_BYPASS cannot be enabled in production');
  this.issuer=config.get<string>('OIDC_ISSUER');this.audience=config.get<string>('OIDC_AUDIENCE');
  const uri=config.get<string>('OIDC_JWKS_URI')??(this.issuer?`${this.issuer.replace(/\/$/,'')}/protocol/openid-connect/certs`:undefined);
  if(uri)this.jwks=createRemoteJWKSet(new URL(uri));
 }
 async canActivate(context:ExecutionContext):Promise<boolean>{
  if(this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY,[context.getHandler(),context.getClass()]))return true;
  const request=context.switchToHttp().getRequest<FastifyRequest&{user?:AuthPrincipal}>();
  if(this.bypass){const raw=request.headers['x-tenant-id'],id=Array.isArray(raw)?raw[0]:raw;if(!id)throw new UnauthorizedException('Missing development tenant');this.tenant.set(id);request.user={subject:'dev-bypass',tenantId:id,permissions:['*'],claims:{}};return true}
  const auth=request.headers.authorization;if(!auth?.startsWith('Bearer ')||!this.jwks||!this.issuer||!this.audience)throw new UnauthorizedException('Bearer token required');
  const {payload}=await jwtVerify(auth.slice(7),this.jwks,{issuer:this.issuer,audience:this.audience}).catch(()=>{throw new UnauthorizedException('Invalid bearer token')});
  const tenantId=typeof payload.tenant_id==='string'?payload.tenant_id:undefined;if(!tenantId)throw new UnauthorizedException('Token has no tenant_id');
  const direct=Array.isArray(payload.permissions)?payload.permissions.filter((v):v is string=>typeof v==='string'):[];
  const realm=(payload.realm_access as {roles?:unknown} | undefined)?.roles;const roles=Array.isArray(realm)?realm.filter((v):v is string=>typeof v==='string'):[];
  this.tenant.set(tenantId);request.user={subject:payload.sub??'',tenantId,permissions:[...new Set([...direct,...roles])],claims:payload};return true;
 }
}
