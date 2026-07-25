import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ActivitiesModule } from "./modules/activities/activities.module";
import { HealthModule } from "./modules/health/health.module";
import { IamModule } from "./modules/iam/iam.module";
import { TenantModule } from "./modules/tenant/tenant.module";
import { DatabaseModule } from "./database/database.module";
import { MobileModule } from "./modules/mobile/mobile.module";
import { EvidenceModule } from "./modules/evidence/evidence.module";
import { validateConfiguration } from "./configuration";
import { TrackingModule } from "./modules/tracking/tracking.module";
import { RoutesModule } from "./modules/routes/routes.module";
import { FleetModule } from "./modules/fleet/fleet.module";
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateConfiguration }),
    DatabaseModule,
    HealthModule,
    TenantModule,
    IamModule,
    ActivitiesModule,
    MobileModule,
    EvidenceModule,
    TrackingModule,
    FleetModule,
    RoutesModule,
  ],
})
export class AppModule {}
