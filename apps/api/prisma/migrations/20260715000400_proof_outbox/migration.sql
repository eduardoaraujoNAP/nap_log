CREATE EXTENSION IF NOT EXISTS "pgcrypto";
ALTER TABLE "proofs" ADD COLUMN "public_code" VARCHAR(80), ADD COLUMN "object_bucket" VARCHAR(120), ADD COLUMN "object_key" VARCHAR(500), ADD COLUMN "sha256" CHAR(64), ADD COLUMN "size" INTEGER;
UPDATE "proofs" SET "public_code" = encode(gen_random_bytes(24),'hex') WHERE "public_code" IS NULL;
ALTER TABLE "proofs" ALTER COLUMN "public_code" SET NOT NULL;
CREATE UNIQUE INDEX "proofs_public_code_key" ON "proofs"("public_code");
CREATE TABLE "outbox_events" ("id" UUID PRIMARY KEY, "tenant_id" UUID NOT NULL REFERENCES "tenants"("id"), "type" VARCHAR(100) NOT NULL, "aggregate_id" UUID NOT NULL, "payload" JSONB NOT NULL, "status" VARCHAR(24) NOT NULL DEFAULT 'pending', "attempts" INTEGER NOT NULL DEFAULT 0, "next_attempt_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "processed_at" TIMESTAMPTZ(3));
CREATE INDEX "outbox_dispatch_idx" ON "outbox_events"("status","next_attempt_at");
CREATE INDEX "outbox_tenant_type_idx" ON "outbox_events"("tenant_id","type","created_at");
