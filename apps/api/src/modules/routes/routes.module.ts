import { Module } from "@nestjs/common";
import { TenantModule } from "../tenant/tenant.module";
import { RoutesController } from "./routes.controller";
import { RoutesService } from "./routes.service";
@Module({
  imports: [TenantModule],
  controllers: [RoutesController],
  providers: [RoutesService],
})
export class RoutesModule {}
