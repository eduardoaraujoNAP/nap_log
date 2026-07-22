import { Body, Controller, Get, Module, Param, ParseUUIDPipe, Post, Req, UnauthorizedException } from '@nestjs/common';
import type { FastifyRequest } from 'fastify';
import type { AuthPrincipal } from '../iam/jwt-auth.guard';
import { TenantContext } from '../tenant/tenant.context';
import { RequirePermissions } from '../iam/auth.decorators';
import { TenantModule } from '../tenant/tenant.module';
import { GpsBatchDto, MobileCommandsBatchDto } from './mobile.dto';
import { MobileService } from './mobile.service';
@RequirePermissions('mobile:execute') @Controller()
export class MobileController{
 constructor(private readonly service:MobileService,private readonly tenant:TenantContext){}
 @Get('mobile/activities') activities(@Req()request:FastifyRequest&{user?:AuthPrincipal}){
  const claim=request.user?.claims.driver_id;
  if(typeof claim!=='string'||!/^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(claim))throw new UnauthorizedException('Token has no valid driver_id');
  return this.service.assignedActivities(this.tenant.id,claim);
 }
 @Post('mobile/commands:batch') commands(@Body()dto:MobileCommandsBatchDto){return this.service.commands(this.tenant.id,dto.commands)}
 @Post('journeys/:id/gps:batch') gps(@Param('id',ParseUUIDPipe)id:string,@Body()dto:GpsBatchDto){return this.service.gps(this.tenant.id,id,dto.points)}
}
@Module({imports:[TenantModule],controllers:[MobileController],providers:[MobileService]})export class MobileModule{}
