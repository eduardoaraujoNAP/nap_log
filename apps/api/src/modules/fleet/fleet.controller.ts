import { Body, Controller, Get, Post } from '@nestjs/common';
import { RequirePermissions } from '../iam/auth.decorators';
import { TenantContext } from '../tenant/tenant.context';
import { CreateDriverDto } from './dto/create-driver.dto';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { FleetService } from './fleet.service';
@Controller()
export class FleetController {
 constructor(private readonly service:FleetService,private readonly tenant:TenantContext){}
 @Get('drivers') @RequirePermissions('fleet:read') drivers(){return this.service.listDrivers(this.tenant.id)}
 @Post('drivers') @RequirePermissions('fleet:write') createDriver(@Body()dto:CreateDriverDto){return this.service.createDriver(this.tenant.id,dto)}
 @Get('vehicles') @RequirePermissions('fleet:read') vehicles(){return this.service.listVehicles(this.tenant.id)}
 @Post('vehicles') @RequirePermissions('fleet:write') createVehicle(@Body()dto:CreateVehicleDto){return this.service.createVehicle(this.tenant.id,dto)}
}
