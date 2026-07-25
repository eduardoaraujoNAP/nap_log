import {
  Body,
  Controller,
  Get,
  Headers,
  Module,
  Param,
  ParseUUIDPipe,
  Post,
} from "@nestjs/common";
import { TenantContext } from "../tenant/tenant.context";
import { TenantModule } from "../tenant/tenant.module";
import { Public, RequirePermissions } from "../iam/auth.decorators";
import {
  CompleteActivityDto,
  CompleteUploadDto,
  InitiateUploadDto,
  ProofReadyDto,
} from "./evidence.dto";
import { EvidenceService } from "./evidence.service";
@RequirePermissions("evidence:write")
@Controller()
export class EvidenceController {
  constructor(
    private readonly s: EvidenceService,
    private readonly t: TenantContext,
  ) {}
  @Post("uploads:initiate") initiate(@Body() d: InitiateUploadDto) {
    return this.s.initiate(this.t.id, d);
  }
  @Post("uploads/:id/complete") complete(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() d: CompleteUploadDto,
  ) {
    return this.s.complete(this.t.id, id, d);
  }
  @Post("activities/:id/complete") activity(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() d: CompleteActivityDto,
  ) {
    return this.s.completeActivity(this.t.id, id, d);
  }
  @Get("activities/:id/proof")
  @RequirePermissions("evidence:read")
  proof(@Param("id", ParseUUIDPipe) id: string) {
    return this.s.latestProof(this.t.id, id);
  }
}
@Public()
@Controller("internal/proofs")
export class InternalProofController {
  constructor(private readonly s: EvidenceService) {}
  @Post(":id/ready") ready(
    @Headers("x-service-key") key: string | undefined,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() d: ProofReadyDto,
  ) {
    return this.s.markProofReady(key, id, d);
  }
}
@Public()
@Controller("public/proofs")
export class PublicProofController {
  constructor(private readonly s: EvidenceService) {}
  @Get(":code/validate") validate(@Param("code") code: string) {
    return this.s.validatePublic(code);
  }
}
@Module({
  imports: [TenantModule],
  controllers: [
    EvidenceController,
    InternalProofController,
    PublicProofController,
  ],
  providers: [EvidenceService],
})
export class EvidenceModule {}
