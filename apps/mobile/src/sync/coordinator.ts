import { buildLocationBatches } from "../location/batching";
import type { LocalStore } from "../offline/contracts";
import {
  ApiRequestError,
  ApiSyncClient,
  type ResultStatus,
} from "./apiSyncClient";
import { EvidenceSynchronizer } from "../evidence/synchronizer";
import { withBackoff, type BackoffOptions } from "./backoff";
export interface SyncReport {
  acknowledged: number;
  conflicts: number;
  rejected: number;
  pending: number;
  evidenceError?: string;
}
const acknowledged = (status: ResultStatus) =>
  status === "applied" || status === "duplicate";
export class SyncCoordinator {
  constructor(
    private readonly store: LocalStore,
    private readonly api: ApiSyncClient,
    private readonly retry: Partial<BackoffOptions> = {},
  ) {}
  async synchronize(): Promise<SyncReport> {
    let acknowledgedCount = 0;
    let conflicts = 0;
    let rejected = 0;
    let evidenceError: string | undefined;
    let finishJourney = false;
    const pending = await this.store.pendingCommands();
    const supported = pending
      .filter((command) => this.api.isSupported(command))
      .slice(0, 100);
    if (supported.length) {
      const results = await withBackoff(
        () => this.api.sendCommands(supported),
        this.retry,
      );
      const byId = new Map(
        results.map((result) => [result.clientCommandId, result]),
      );
      for (const command of supported) {
        const result = byId.get(command.id);
        if (!result || !acknowledged(result.status)) continue;
        if (command.type === "journey.started" && result.journeyId)
          await this.store.setMetadata("activeJourneyId", result.journeyId);
        if (command.type === "journey.ended") finishJourney = true;
      }
      const ids = supported
        .filter(({ id }) => acknowledged(byId.get(id)?.status ?? "rejected"))
        .map(({ id }) => id);
      conflicts += results.filter(({ status }) => status === "conflict").length;
      rejected += results.filter(({ status }) => status === "rejected").length;
      await this.store.acknowledge(ids);
      acknowledgedCount += ids.length;
    }
    const evidenceCommands = pending.filter(
      (command) => command.type === "evidence.upload.requested",
    );
    for (const command of evidenceCommands) {
      const manifestId = (command.payload as { manifestId?: string })
        .manifestId;
      if (!manifestId) continue;
      try {
        const completedManifest = await withBackoff(
          () =>
            new EvidenceSynchronizer(this.store, this.api).synchronize(
              manifestId,
            ),
          this.retry,
        );
        const activities = await this.store.listActivities();
        await this.store.saveActivities(
          activities.map((activity) =>
            activity.id === completedManifest.activityId
              ? { ...activity, status: "completed" as const }
              : activity,
          ),
        );
        await this.store.acknowledge([command.id]);
        acknowledgedCount++;
      } catch (error) {
        const manifest = await this.store.getEvidenceManifest(manifestId);
        const status = error instanceof ApiRequestError ? error.status : 0;
        const kind =
          status === 409
            ? "conflict"
            : status >= 400 && status < 500
              ? "policy"
              : "network";
        if (kind === "conflict") conflicts++;
        if (kind === "policy") rejected++;
        if (manifest) {
          evidenceError =
            error instanceof Error ? error.message : "Falha de sincronização";
          await this.store.saveEvidenceManifest({
            ...manifest,
            status: "error",
            error: {
              kind,
              detail:
                error instanceof Error
                  ? error.message
                  : "Falha de sincronização",
            },
            updatedAt: new Date().toISOString(),
          });
        }
      }
    }
    const journeyId = await this.store.getMetadata("activeJourneyId");
    if (journeyId) {
      const points = await this.store.pendingLocationPoints(journeyId, 500);
      for (const batch of buildLocationBatches(points, 100)) {
        const results = await withBackoff(
          () => this.api.sendGps(journeyId, batch.points, batch.idempotencyKey),
          this.retry,
        );
        const byId = new Map(
          results.map((result) => [result.clientPointId, result]),
        );
        const ids = batch.points
          .filter(({ id }) => acknowledged(byId.get(id)?.status ?? "rejected"))
          .map(({ id }) => id);
        conflicts += results.filter(
          ({ status }) => status === "conflict",
        ).length;
        rejected += results.filter(
          ({ status }) => status === "rejected",
        ).length;
        await this.store.acknowledgeLocationPoints(ids);
        acknowledgedCount += ids.length;
      }
    }
    if (finishJourney) await this.store.setMetadata("activeJourneyId", "");
    const remoteActivities = await withBackoff(
      () => this.api.listActivities(),
      this.retry,
    );
    await this.store.replaceActivities(remoteActivities);
    await this.store.setMetadata("syncConflictCount", String(conflicts));
    return {
      acknowledged: acknowledgedCount,
      conflicts,
      rejected,
      pending: (await this.store.pendingCommands()).length,
      evidenceError,
    };
  }
}
