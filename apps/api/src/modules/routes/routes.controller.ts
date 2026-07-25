import { Body, Controller, Get, Post } from "@nestjs/common";
import { Param, ParseUUIDPipe } from "@nestjs/common";
import { RequirePermissions } from "../iam/auth.decorators";
import { TenantContext } from "../tenant/tenant.context";
import { CreateRouteDto } from "./routes.dto";
import { RoutesService } from "./routes.service";
@Controller("routes")
export class RoutesController {
  constructor(
    private readonly service: RoutesService,
    private readonly tenant: TenantContext,
  ) {}
  @Get() @RequirePermissions("activities:read") list() {
    return this.service.list(this.tenant.id);
  }
  @Post() @RequirePermissions("activities:write") create(
    @Body() dto: CreateRouteDto,
  ) {
    return this.service.create(this.tenant.id, dto);
  }
  @Post(":id/publish") @RequirePermissions("activities:write") publish(
    @Param("id", ParseUUIDPipe) id: string,
  ) {
    return this.service.transition(this.tenant.id, id, "published");
  }
  @Post(":id/start") @RequirePermissions("activities:write") start(
    @Param("id", ParseUUIDPipe) id: string,
  ) {
    return this.service.transition(this.tenant.id, id, "in_progress");
  }
  @Post(":id/complete") @RequirePermissions("activities:write") complete(
    @Param("id", ParseUUIDPipe) id: string,
  ) {
    return this.service.transition(this.tenant.id, id, "completed");
  }
}
