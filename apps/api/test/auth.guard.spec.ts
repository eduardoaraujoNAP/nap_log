import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { TenantContext } from '../src/modules/tenant/tenant.context';
import { JwtAuthGuard } from '../src/modules/iam/jwt-auth.guard';
import { PermissionsGuard } from '../src/modules/iam/permissions.guard';

const context=(headers:Record<string,string>,user?:unknown)=>({getHandler:()=>class{},getClass:()=>class{},switchToHttp:()=>({getRequest:()=>({headers,user})})}) as unknown as ExecutionContext;
const reflector=(value:unknown)=>({getAllAndOverride:jest.fn().mockReturnValue(value)}) as unknown as Reflector;
const config=(values:Record<string,string>)=>({get:(key:string,fallback?:string)=>values[key]??fallback}) as ConfigService;

describe('OIDC guards',()=>{
 it('rejects a missing bearer token',async()=>{const guard=new JwtAuthGuard(reflector(false),config({NODE_ENV:'production',OIDC_ISSUER:'https://id/realms/x',OIDC_AUDIENCE:'api'}),new TenantContext());await expect(guard.canActivate(context({}))).rejects.toBeInstanceOf(UnauthorizedException)});
 it('ignores a spoofed tenant header without a token',async()=>{const guard=new JwtAuthGuard(reflector(false),config({NODE_ENV:'production',OIDC_ISSUER:'https://id/realms/x',OIDC_AUDIENCE:'api'}),new TenantContext());await expect(guard.canActivate(context({'x-tenant-id':'spoof'}))).rejects.toBeInstanceOf(UnauthorizedException)});
 it('forbids development bypass in production',()=>{expect(()=>new JwtAuthGuard(reflector(false),config({NODE_ENV:'production',DEV_AUTH_BYPASS:'true'}),new TenantContext())).toThrow('DEV_AUTH_BYPASS cannot be enabled in production')});
 it('denies a missing permission',()=>{const guard=new PermissionsGuard(reflector(['activities:write']));expect(()=>guard.canActivate(context({}, {permissions:['activities:read']}))).toThrow('Permission denied')});
});
