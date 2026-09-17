export interface DatasetSummary {
  datasetId: string
  filename: string
  fileHash: string
  policyVersion: string
  startDate: string | null
  endDate: string | null
  agentCount: number
  observationCount: number
  slotCount: number
  issueCount: number
  uploadedAt: string
}

export interface UploadResult {
  duplicate: boolean
  datasetId: string
  observationCount?: number
  slotCount?: number
  issueCount?: number
  fileHash?: string
  policyVersion?: string
  uploadedAt?: string
}

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024

export const ALLOWED_UPLOAD_EXTENSIONS = ['.csv'] as const