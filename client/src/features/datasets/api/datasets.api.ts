import { api } from '@/shared/api/client'
import type { DatasetSummary, UploadResult } from '../model/upload.types'

interface ApiEnvelope<T> {
  success: boolean
  data: T
}

export function listDatasets(signal?: AbortSignal): Promise<DatasetSummary[]> {
  return api
    .get<ApiEnvelope<DatasetSummary[]>>('/datasets', undefined, { signal })
    .then((res) => res.data)
}

export function getDataset(id: string, signal?: AbortSignal): Promise<DatasetSummary> {
  return api
    .get<ApiEnvelope<DatasetSummary>>(`/datasets/${encodeURIComponent(id)}`, undefined, {
      signal,
    })
    .then((res) => res.data)
}

export function uploadDataset(file: File, signal?: AbortSignal): Promise<UploadResult> {
  return api
    .upload<ApiEnvelope<UploadResult>>('/datasets', file, { signal })
    .then((res) => res.data)
}