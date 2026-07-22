import { Global, Module, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';
import { PrismaService } from '../src/database/prisma.service';
import { FleetModule } from '../src/modules/fleet/fleet.module';
import { IamModule } from '../src/modules/iam/iam.module';
import { TenantModule } from '../src/modules/tenant/tenant.module';

@Global() @Module({providers:[{provide:PrismaService,useValue:{}}],exports:[PrismaService]})
class FakeDatabaseModule{}
@Module({imports:[ConfigModule.forRoot({isGlobal:true,ignoreEnvFile:true}),FakeDatabaseModule,TenantModule,IamModule,FleetModule]})
class FleetE2eModule{}

describe('Fleet HTTP (e2e)',()=>{
 const tenantA='865fe12e-62f8-432b-9509-75b125959370',tenantB='f838fb2b-2a47-480f-b816-3b0229b77c91',company='11111111-1111-4111-8111-111111111111';
 let app:NestFastifyApplication;
 beforeAll(async()=>{
  process.env.NODE_ENV='test';process.env.DEV_AUTH_BYPASS='true';
  app=await NestFactory.create<NestFastifyApplication>(FleetE2eModule,new FastifyAdapter(),{logger:false});
  app.setGlobalPrefix('v1');app.useGlobalPipes(new ValidationPipe({transform:true,whitelist:true,forbidNonWhitelisted:true}));
  await app.init();await app.getHttpAdapter().getInstance().ready();
 });
 afterAll(async()=>{await app.close();delete process.env.DEV_AUTH_BYPASS});
 it('requires an authenticated tenant',async()=>{const response=await app.inject({method:'GET',url:'/v1/drivers'});expect(response.statusCode).toBe(401)});
 it('validates DTOs and persists normalized records',async()=>{
  const invalid=await app.inject({method:'POST',url:'/v1/vehicles',headers:{'x-tenant-id':tenantA},payload:{companyId:company,plate:'INVALID'}});
  expect(invalid.statusCode).toBe(400);
  const created=await app.inject({method:'POST',url:'/v1/drivers',headers:{'x-tenant-id':tenantA},payload:{companyId:company,name:'  João Motorista  ',document:'DOC-1'}});
  expect(created.statusCode).toBe(201);expect(created.json()).toMatchObject({tenantId:tenantA,name:'João Motorista',document:'DOC-1'});
 });
 it('does not expose records across tenants',async()=>{
  const own=await app.inject({method:'GET',url:'/v1/drivers',headers:{'x-tenant-id':tenantA}});
  const foreign=await app.inject({method:'GET',url:'/v1/drivers',headers:{'x-tenant-id':tenantB}});
  expect(own.json()).toHaveLength(1);expect(foreign.json()).toEqual([]);
 });
});
