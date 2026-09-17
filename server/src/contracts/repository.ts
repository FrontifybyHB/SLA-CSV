export interface DatasetSummary {
  datasetId: string;
  filename: string;
  fileHash: string;
  policyVersion: string;
  startDate: Date;
  endDate: Date;
  agentCount: number;
  observationCount: number;
  slotCount: number;
  issueCount: number;
  uploadedAt: Date;
}

export interface SaveImportResult {
  datasetId: string;
  observationCount: number;
  slotCount: number;
  issueCount: number;
}