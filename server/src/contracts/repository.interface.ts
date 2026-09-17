import type { PreparedImport } from "./import.js";
import type { SaveImportResult, DatasetSummary } from "./repository.js";

export interface IDatasetRepository {
  findByHash(
    fileHash: string,
    policyVersion: string,
    userId: string,
  ): Promise<DatasetSummary | null>;

  findByFingerprint(
    hash: string,
    policyVersion: string,
    userId: string,
  ): Promise<DatasetSummary | null>;

  listDatasets(userId: string): Promise<DatasetSummary[]>;

  findById(datasetId: string, userId: string): Promise<DatasetSummary | null>;

  saveImport(input: PreparedImport): Promise<SaveImportResult>;
}