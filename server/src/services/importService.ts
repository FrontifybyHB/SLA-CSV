import type {
  ImportInput,
  ImportResult,
} from "../contracts/import.js";
import type { DatasetSummary } from "../contracts/repository.js";
import type { IDatasetRepository } from "../contracts/repository.interface.js";
import { SlaDatasetImporter } from "./SlaDatasetImporter.js";

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
    if (this.importer) {
      const res = await this.importer.importDataset({
        bytes: input.bytes,
        filename: input.filename,
        policyVersion: this.checklist.policyVersion,
        userId,
        checklistFormat: this.checklist.format,
        checklistVersion: this.checklist.version,
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
        fileHash: res.fileHash,
        policyVersion: res.policyVersion,
        startDate: new Date(),
        endDate: new Date(),
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