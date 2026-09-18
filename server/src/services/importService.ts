import type {
  ImportInput,
  ImportResult,
} from "../contracts/import.js";
import type { DatasetSummary } from "../contracts/repository.js";
import type { IDatasetRepository } from "../contracts/repository.interface.js";
import { SlaDatasetImporter } from "./SlaDatasetImporter.js";
import logger from "../middlewares/logger.js";

export interface ChecklistMetadata {
  format: string;
  version: string;
  policyVersion: string;
}

export class ImportService {
  constructor(
    private readonly repository: IDatasetRepository,
    private readonly checklist: ChecklistMetadata,
    private readonly importer?: SlaDatasetImporter,
  ) {}

  async execute(input: ImportInput, userId: string): Promise<ImportResult> {
    const startTime = process.hrtime.bigint();
    const fileSizeKb = Math.round(input.bytes.length / 1024);

    if (this.importer) {
      const res = await this.importer.importDataset({
        bytes: input.bytes,
        filename: input.filename,
        policyVersion: this.checklist.policyVersion,
        userId,
        checklistFormat: this.checklist.format,
        checklistVersion: this.checklist.version,
      });

      const elapsedMs = Number(process.hrtime.bigint() - startTime) / 1_000_000;
      logger.info("CSV import completed", {
        userId,
        filename: input.filename,
        fileSizeKb,
        datasetId: res.datasetId,
        reused: res.reused,
        observationCount: res.observationCount,
        slotCount: res.slotCount,
        issueCount: res.issueCount,
        processingTimeMs: res.metrics?.processingTimeMs ?? 0,
        totalTimeMs: Math.round(elapsedMs),
      });

      if (res.reused) {
        return {
          duplicate: true,
          datasetId: res.datasetId,
          uploadedAt: res.uploadedAt ?? new Date(),
        };
      }

      return {
        duplicate: false,
        datasetId: res.datasetId,
        observationCount: res.observationCount,
        slotCount: res.slotCount,
        issueCount: res.issueCount,
        invalidRows: res.metrics?.invalidRows ?? 0,
        duplicateRows: res.metrics?.duplicateRows ?? 0,
        fileHash: res.fileHash,
        policyVersion: res.policyVersion,
        startDate: res.startDate ?? new Date(),
        endDate: res.endDate ?? new Date(),
        metrics: res.metrics,
      };
    }

    const fileHash = "";
    const existing = await this.repository.findByFingerprint(
      fileHash,
      this.checklist.policyVersion,
      userId,
    );

    if (existing) {
      return {
        duplicate: true,
        datasetId: existing.datasetId,
        uploadedAt: existing.uploadedAt,
      };
    }

    return {
      duplicate: false,
      datasetId: "",
      observationCount: 0,
      slotCount: 0,
      issueCount: 0,
      invalidRows: 0,
      duplicateRows: 0,
      fileHash,
      policyVersion: this.checklist.policyVersion,
      startDate: new Date(),
      endDate: new Date(),
    };
  }

  async listDatasets(userId: string): Promise<DatasetSummary[]> {
    return this.repository.listDatasets(userId);
  }

  async getDataset(datasetId: string, userId: string): Promise<DatasetSummary | null> {
    return this.repository.findById(datasetId, userId);
  }
}