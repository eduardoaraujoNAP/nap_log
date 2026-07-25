CREATE TABLE "routes" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "tenant_id" UUID NOT NULL, "driver_id" UUID NOT NULL, "name" VARCHAR(160) NOT NULL, "planned_date" DATE NOT NULL, "status" VARCHAR(24) NOT NULL DEFAULT 'planned', "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "routes_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "routes_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT,
  CONSTRAINT "routes_driver_fkey" FOREIGN KEY ("tenant_id", "driver_id") REFERENCES "drivers"("tenant_id", "id") ON DELETE RESTRICT
);
CREATE UNIQUE INDEX "routes_tenant_id_id_key" ON "routes"("tenant_id", "id");
CREATE INDEX "routes_tenant_date_status_idx" ON "routes"("tenant_id", "planned_date", "status");
CREATE INDEX "routes_tenant_driver_date_idx" ON "routes"("tenant_id", "driver_id", "planned_date");
CREATE TABLE "route_stops" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "tenant_id" UUID NOT NULL, "route_id" UUID NOT NULL, "activity_id" UUID NOT NULL, "sequence" INTEGER NOT NULL, "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "route_stops_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "route_stops_route_fkey" FOREIGN KEY ("tenant_id", "route_id") REFERENCES "routes"("tenant_id", "id") ON DELETE CASCADE,
  CONSTRAINT "route_stops_activity_fkey" FOREIGN KEY ("tenant_id", "activity_id") REFERENCES "activities"("tenant_id", "id") ON DELETE RESTRICT
);
CREATE UNIQUE INDEX "route_stops_tenant_route_sequence_key" ON "route_stops"("tenant_id", "route_id", "sequence");
CREATE UNIQUE INDEX "route_stops_tenant_route_activity_key" ON "route_stops"("tenant_id", "route_id", "activity_id");
CREATE INDEX "route_stops_tenant_activity_idx" ON "route_stops"("tenant_id", "activity_id");
