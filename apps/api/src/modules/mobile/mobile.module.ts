import { Body, Controller, Module, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { TenantContext } from '../tenant/tenant.context';
import { RequirePermissions } from '../iam/auth.decorators';
import { TenantModule } from '../tenant/tenant.module';
import { GpsBatchDto, MobileCommandsBatchDto } from './mobile.dto';
import { MobileService } from './mobile.service';
@RequirePermissions('mobile:execute') @Controller()
export class MobileController{
 constructor(private readonly service:MobileService,private readonly tenant:TenantContext){}
 @Post('mobile/commands:batch') commands(@Body()dto:MobileCommandsBatchDto){return this.service.commands(this.tenant.id,dto.commands)}
 @Post('journeys/:id/gps:batch') gps(@Param('id',ParseUUIDPipe)id:string,@Body()dto:GpsBatchDto){return this.service.gps(this.tenant.id,id,dto.points)}
}
@Module({imports:[TenantModule],controllers:[MobileController],providers:[MobileService]})export class MobileModule{}
