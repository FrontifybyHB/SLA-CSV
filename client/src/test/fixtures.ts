import type { DatasetSummary } from '@/features/datasets'

export function csvFile(contents: string, name = 'fixture.csv'): File {
  return new File([contents], name, { type: 'text/csv' })
}

export const sampleDataset: DatasetSummary = {
  datasetId: 'ds-1',
  filename: 'health.csv',
  fileHash: 'abc123',
  policyVersion: '1.0.0',
  startDate: '2026-09-01T00:00:00.000Z',
  endDate: '2026-09-15T00:00:00.000Z',
  agentCount: 3,
  observationCount: 119,
  slotCount: 4,
  issueCount: 1,
  uploadedAt: '2026-09-15T10:00:00.000Z',
}