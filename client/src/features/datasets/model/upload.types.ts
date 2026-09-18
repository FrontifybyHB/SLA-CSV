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

export interface ServiceQualityMetrics {
  service: string
  expectedSlots: number
  observedSlots: number
  missingSlots: number
  upSlots: number
  downSlots: number
  unknownSlots: number
  uptimePercentage: number
  medianLatencyMs: number | null
  p95LatencyMs: number | null
}

export interface UploadMetrics {
  totalRows: number
  validRows: number
  invalidRows: number
  duplicateRows: number
  expectedSlotsTotal: number
  observedSlotsTotal: number
  missingSlotsTotal: number
  services: Record<string, ServiceQualityMetrics>
}

export interface UploadResult {
  duplicate: boolean
  datasetId: string
  observationCount?: number
  slotCount?: number
  issueCount?: number
  invalidRows?: number
  duplicateRows?: number
  fileHash?: string
  policyVersion?: string
  uploadedAt?: string
  metrics?: UploadMetrics
}

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024

export const ALLOWED_UPLOAD_EXTENSIONS = ['.csv'] as const