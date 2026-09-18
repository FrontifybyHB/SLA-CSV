import { FileHasher } from "../domain/FileHasher.js";
import { SlaCsvProcessor, SlaProcessingResult } from "../domain/SlaCsvProcessor.js";
import type { IDatasetRepository } from "../contracts/repository.interface.js";
import type { QualityMetrics } from "../domain/QualityMetricsCalculator.js";
import type { AgentId, PreparedImport } from "../contracts/import.js";
import logger from "../middlewares/logger.js";

export interface ImportDatasetInput {
  bytes: Buffer;
  filename: string;
  policyVersion: string;
  userId: string;
  checklistFormat?: string;
  checklistVersion?: string;
}

export interface ImportDatasetOutput {
  reused: boolean;
  datasetId: string;
  fileHash: string;
  policyVersion: string;
  observationCount: number;
  slotCount: number;
  issueCount: number;
  startDate?: Date;
  endDate?: Date;
  uploadedAt?: Date;
  metrics?: QualityMetrics;
}

export class SlaDatasetImporter {
  constructor(
    private readonly processor: SlaCsvProcessor,
    private readonly repository: IDatasetRepository,
    private readonly fileHasher: FileHasher,
  ) {}

  async importDataset(input: ImportDatasetInput): Promise<ImportDatasetOutput> {
    const overallStart = process.hrtime.bigint();
    const fileSizeKb = Math.round(input.bytes.length / 1024);

    const fileHash = this.fileHasher.sha256(input.bytes);
    const policyVersion = input.policyVersion;

    // Check idempotency key: (file_sha256 + policy_version + owner user_id)
    const existing = await this.repository.findByHash(fileHash, policyVersion, input.userId);
    if (existing) {
      const elapsedMs = Number(process.hrtime.bigint() - overallStart) / 1_000_000;
      logger.info("CSV import skipped (duplicate)", {
        userId: input.userId,
        filename: input.filename,
        fileSizeKb,
        datasetId: existing.datasetId,
        totalTimeMs: Math.round(elapsedMs),
      });
      return {
        reused: true,
        datasetId: existing.datasetId,
        fileHash,
        policyVersion,
        observationCount: existing.observationCount,
        slotCount: existing.slotCount,
        issueCount: existing.issueCount,
        uploadedAt: existing.uploadedAt,
      };
    }

    // Process via Brain (zero I/O, deterministic)
    const processed: SlaProcessingResult = this.processor.process(input.bytes);

    // Prepare for DB persistence
    const sortedObs = [...processed.observations].sort(
      (a, b) => a.timestamp.getTime() - b.timestamp.getTime(),
    );
    const startDate = sortedObs[0]?.timestamp ?? new Date();
    const endDate = sortedObs[sortedObs.length - 1]?.timestamp ?? startDate;
    const uniqueAgents = new Set(processed.observations.map((o) => o.agentId));

    const prepared: PreparedImport = {
      userId: input.userId,
      filename: input.filename,
      fileHash,
      policyVersion,
      checklist: {
        format: input.checklistFormat ?? "sla-checklist",
        version: input.checklistVersion ?? policyVersion,
        startDate,
        endDate,
        agentCount: uniqueAgents.size,
      },
      observations: processed.observations.map((o) => ({
        agentId: o.agentId as AgentId,
        service: o.service,
        timestamp: o.timestamp,
        latencyMs: o.latencyMs,
        status: (o.status === "UP" ? "up" : o.status === "DOWN" ? "down" : "unknown"),
        region: o.region,
      })),
      slots: processed.slots.map((s) => ({
        slotKey: s.slotKey,
        service: s.service,
        startTime: s.startTime,
        endTime: s.endTime,
        durationSeconds: s.durationSeconds,
        uptimeSeconds: s.status === "UP" ? s.durationSeconds : 0,
        downtimeSeconds: s.status === "DOWN" ? s.durationSeconds : 0,
        unknownSeconds: s.status === "UNKNOWN" ? s.durationSeconds : 0,
        averageLatencyMs: s.medianLatencyMs,
      })),
      issues: processed.issues.map((iss) => ({
        row: iss.row,
        field: iss.field,
        message: iss.code ? `[${iss.code}] ${iss.message}` : iss.message,
      })),
    };

    const saveStart = process.hrtime.bigint();
    const saved = await this.repository.saveImport(prepared);
    const saveTimeMs = Number(process.hrtime.bigint() - saveStart) / 1_000_000;
    const totalTimeMs = Number(process.hrtime.bigint() - overallStart) / 1_000_000;

    logger.info("CSV import persisted", {
      userId: input.userId,
      filename: input.filename,
      fileSizeKb,
      datasetId: saved.datasetId,
      observationCount: saved.observationCount,
      slotCount: saved.slotCount,
      issueCount: saved.issueCount,
      processingTimeMs: processed.metrics?.processingTimeMs ?? 0,
      dbSaveTimeMs: Math.round(saveTimeMs),
      totalTimeMs: Math.round(totalTimeMs),
    });

    return {
      reused: false,
      datasetId: saved.datasetId,
      fileHash,
      policyVersion,
      observationCount: saved.observationCount,
      slotCount: saved.slotCount,
      issueCount: saved.issueCount,
      startDate,
      endDate,
      uploadedAt: new Date(),
      metrics: processed.metrics,
    };
  }
}
