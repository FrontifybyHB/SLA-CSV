import { useCallback, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { uploadDataset } from '../api/datasets.api'
import { datasetKeys } from '../api/datasets.keys'
import { validateUploadFile } from '../model/upload.validation'
import { getErrorMessage } from '@/shared/api/api-error'
import type { UploadResult } from '../model/upload.types'

export type QueuedFileStatus = 'queued' | 'uploading' | 'done' | 'error'

export interface QueuedFile {
  id: string
  file: File
  status: QueuedFileStatus
  /** Human-readable validation error (set synchronously on add). */
  error?: string
  result?: UploadResult
}

let queueSeq = 0
function nextId(): string {
  queueSeq += 1
  return `upload-${Date.now()}-${queueSeq}`
}

export interface UploadBatchSummary {
  succeeded: Array<{ file: File; result: UploadResult }>
  failed: Array<{ file: File; message: string }>
}

/**
 * Multi-file upload queue.
 *
 * The backend accepts exactly one raw CSV per `POST /datasets`
 * (`express.raw`, `Content-Type: text/csv`, filename via `?filename=`),
 * so "upload N files at once" is implemented client-side: files are
 * validated up-front, then uploaded sequentially with per-file status.
 * The dataset inventory is invalidated once the batch finishes.
 */
export function useUploadQueue() {
  const queryClient = useQueryClient()
  const [items, setItems] = useState<QueuedFile[]>([])
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState({ done: 0, total: 0 })
  const abortRef = useRef(false)

  const addFiles = useCallback((files: File[]) => {
    if (files.length === 0) return
    setItems((prev) => {
      const seen = new Set(prev.map((i) => `${i.file.name}:${i.file.size}`))
      const fresh: QueuedFile[] = []
      for (const file of files) {
        const key = `${file.name}:${file.size}`
        if (seen.has(key)) continue
        seen.add(key)
        const validation = validateUploadFile(file)
        fresh.push({
          id: nextId(),
          file,
          status: 'queued',
          error: validation.ok ? undefined : validation.message,
        })
      }
      return [...prev, ...fresh]
    })
  }, [])

  const removeFile = useCallback((id: string) => {
    // Only allow removing rows that are not mid-upload.
    setItems((prev) => prev.filter((i) => !(i.id === id && i.status !== 'uploading')))
  }, [])

  const clearFinished = useCallback(() => {
    setItems((prev) => prev.filter((i) => i.status === 'queued' || i.status === 'uploading'))
  }, [])

  const cancel = useCallback(() => {
    abortRef.current = true
  }, [])

  const uploadAll = useCallback(
    async (onFileDone?: (file: File, result: UploadResult) => void): Promise<UploadBatchSummary> => {
      const summary: UploadBatchSummary = { succeeded: [], failed: [] }
      const pending = items.filter((i) => i.status === 'queued' && !i.error)
      if (pending.length === 0 || uploading) return summary

      abortRef.current = false
      setUploading(true)
      setProgress({ done: 0, total: pending.length })

      let done = 0
      for (const item of pending) {
        if (abortRef.current) break
        setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, status: 'uploading' as const } : i)))
        try {
          // One raw-CSV POST per file — see api.upload() for the
          // ?filename= + text/csv contract the server requires.
          const result = await uploadDataset(item.file)
          summary.succeeded.push({ file: item.file, result })
          setItems((prev) =>
            prev.map((i) => (i.id === item.id ? { ...i, status: 'done' as const, result } : i)),
          )
          onFileDone?.(item.file, result)
        } catch (err) {
          const message = getErrorMessage(err)
          summary.failed.push({ file: item.file, message })
          setItems((prev) =>
            prev.map((i) => (i.id === item.id ? { ...i, status: 'error' as const, error: message } : i)),
          )
        } finally {
          done += 1
          setProgress({ done, total: pending.length })
        }
      }

      // One invalidation for the whole batch (not N).
      void queryClient.invalidateQueries({ queryKey: datasetKeys.list() })
      setUploading(false)
      return summary
    },
    [items, uploading, queryClient],
  )

  return { items, uploading, progress, addFiles, removeFile, clearFinished, cancel, uploadAll }
}
