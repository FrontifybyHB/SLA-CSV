import { useRef, useState, type DragEvent } from 'react'
import { Button } from '@/shared/ui/Button'
import { Icon } from '@/shared/ui/Icon'
import { Spinner } from '@/shared/ui/Spinner'
import { StatusBadge } from '@/shared/ui/StatusBadge'
import { formatCount } from '@/shared/lib/format'
import { useUploadQueue, type QueuedFile } from '../hooks/useUploadQueue'
import type { UploadResult } from '../model/upload.types'

export interface CsvUploadFormProps {
  /** Called once per successfully imported file (filename included — the API result has none). */
  onUploaded: (result: UploadResult, file: File) => void
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

function RowBadge({ item }: { item: QueuedFile }) {
  if (item.status === 'done') {
    return (
      <StatusBadge tone={item.result?.duplicate ? 'neutral' : 'success'}>
        {item.result?.duplicate ? 'Duplicate' : 'Imported'}
      </StatusBadge>
    )
  }
  if (item.status === 'uploading') return <StatusBadge tone="neutral">Uploading…</StatusBadge>
  if (item.status === 'error' || item.error) return <StatusBadge tone="danger">Failed</StatusBadge>
  return <StatusBadge tone="neutral">Queued</StatusBadge>
}

export function CsvUploadForm({ onUploaded }: CsvUploadFormProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [batchError, setBatchError] = useState<string | null>(null)
  const dragDepth = useRef(0)
  const { items, uploading, progress, addFiles, removeFile, clearFinished, cancel, uploadAll } =
    useUploadQueue()

  const queued = items.filter((i) => i.status === 'queued' && !i.error)
  const invalid = items.filter((i) => i.error && i.status === 'queued')

  function openPicker() {
    inputRef.current?.click()
  }

  function handleDrop(event: DragEvent) {
    event.preventDefault()
    dragDepth.current = 0
    setDragging(false)
    setBatchError(null)
    addFiles(Array.from(event.dataTransfer.files ?? []))
  }

  async function handleUploadAll() {
    setBatchError(null)
    if (queued.length === 0) {
      setBatchError(
        invalid.length > 0
          ? 'Fix or remove the highlighted files first (only .csv up to 5 MB).'
          : 'Choose one or more CSV files first — click the panel or drag files onto it.',
      )
      return
    }
    const summary = await uploadAll((file, result) => onUploaded(result, file))
    if (summary.failed.length > 0 && summary.succeeded.length === 0) {
      setBatchError(
        summary.failed.length === 1
          ? summary.failed[0].message
          : `${summary.failed.length} of ${summary.failed.length + summary.succeeded.length} files failed. See rows below.`,
      )
    }
  }

  const doneCount = items.filter((i) => i.status === 'done').length

  return (
    <div className="flex flex-col gap-3">
      {/* Functional dropzone: click opens the picker, drag-and-drop works. */}
      <div
        role="button"
        tabIndex={0}
        aria-label="Choose CSV files to upload. Click to browse, or drag and drop files here."
        onClick={openPicker}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            openPicker()
          }
        }}
        onDragEnter={(e) => {
          e.preventDefault()
          dragDepth.current += 1
          setDragging(true)
        }}
        onDragOver={(e) => e.preventDefault()}
        onDragLeave={(e) => {
          e.preventDefault()
          dragDepth.current = Math.max(0, dragDepth.current - 1)
          if (dragDepth.current === 0) setDragging(false)
        }}
        onDrop={handleDrop}
        className={[
          'flex flex-col items-center gap-1.5 w-full rounded-xl border-2 border-dashed px-5 py-7 text-center cursor-pointer',
          'transition-all duration-200 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-sla-primary focus-visible:ring-offset-2',
          dragging
            ? 'border-sla-primary bg-sla-primary/5 scale-[1.01] shadow-md'
            : 'border-sla-outline-variant bg-sla-bg/70 hover:border-sla-primary hover:bg-sla-primary/[0.04] hover:shadow-sm',
        ].join(' ')}
      >
        <span
          className={[
            'flex items-center justify-center w-12 h-12 rounded-xl border bg-white shadow-sm transition-transform duration-200',
            dragging ? 'scale-110 text-sla-primary' : 'text-sla-primary-container border-sla-outline-variant',
          ].join(' ')}
        >
          <Icon name="cloud_upload" size={26} />
        </span>
        <span className="text-[0.9375rem] font-semibold text-sla-on-surface">
          {dragging ? 'Drop CSV files to queue them' : 'Stage telemetry CSVs'}
        </span>
        <span className="max-w-[26rem] text-[0.8125rem] leading-relaxed text-sla-secondary">
          Click to browse or drag &amp; drop — select <strong>multiple files at once</strong>, then
          upload the whole batch.
        </span>
        <span className="mt-1 font-mono text-[11px] text-sla-text-muted">
          RFC-4180 · max 5 MB each · agent_id, timestamp, status (+ latency_ms, service, region)
        </span>
        <input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv"
          multiple
          disabled={uploading}
          aria-hidden="true"
          tabIndex={-1}
          className="hidden"
          onChange={(event) => {
            setBatchError(null)
            addFiles(Array.from(event.target.files ?? []))
            event.target.value = ''
          }}
        />
      </div>

      {batchError ? (
        <p
          role="alert"
          className="rounded-lg border border-sla-danger/30 bg-sla-danger-soft px-3 py-2 text-[0.8125rem] leading-relaxed text-sla-danger"
        >
          {batchError}
        </p>
      ) : null}

      {items.length > 0 ? (
        <ul className="flex flex-col gap-1.5" aria-label="Upload queue">
          {items.map((item) => (
            <li
              key={item.id}
              className={[
                'flex items-center gap-2.5 rounded-lg border bg-white px-3 py-2 transition-colors duration-150',
                item.error && item.status !== 'uploading'
                  ? 'border-sla-danger/40'
                  : item.status === 'done'
                    ? 'border-sla-success/40'
                    : 'border-sla-outline-variant/70',
              ].join(' ')}
            >
              <Icon
                name={item.status === 'done' ? 'check_circle' : item.error ? 'warning' : 'description'}
                size={17}
                className={
                  item.status === 'done'
                    ? 'text-sla-success shrink-0'
                    : item.error
                      ? 'text-sla-danger shrink-0'
                      : 'text-sla-secondary shrink-0'
                }
              />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[0.8125rem] font-medium text-sla-on-surface">
                  {item.file.name}
                </span>
                <span className="block font-mono text-[11px] text-sla-text-muted">
                  {formatBytes(item.file.size)}
                  {item.status === 'done' && item.result?.observationCount !== undefined
                    ? ` · ${formatCount(item.result.observationCount)} rows`
                    : null}
                  {item.error ? ` · ${item.error}` : null}
                </span>
              </span>
              <RowBadge item={item} />
              {item.status !== 'uploading' ? (
                <button
                  type="button"
                  onClick={() => removeFile(item.id)}
                  aria-label={`Remove ${item.file.name} from queue`}
                  className="shrink-0 rounded-md p-1 text-sla-text-muted transition-colors hover:bg-sla-bg hover:text-sla-on-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-sla-primary"
                >
                  <Icon name="close" size={15} />
                </button>
              ) : (
                <Spinner />
              )}
            </li>
          ))}
        </ul>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          pending={uploading}
          disabled={uploading}
          onClick={() => void handleUploadAll()}
          className="min-w-[11rem]"
        >
          {uploading ? <Spinner /> : <Icon name="cloud_upload" size={16} />}
          {uploading
            ? `Uploading ${progress.done + 1} of ${progress.total}…`
            : queued.length > 1
              ? `Upload ${queued.length} CSVs`
              : 'Upload CSV'}
        </Button>
        {uploading ? (
          <Button type="button" variant="secondary" size="sm" onClick={cancel}>
            Cancel
          </Button>
        ) : null}
        {doneCount > 0 && !uploading ? (
          <Button type="button" variant="ghost" size="sm" onClick={clearFinished}>
            Clear finished
          </Button>
        ) : null}
        {uploading && progress.total > 1 ? (
          <span className="font-mono text-[11px] text-sla-text-muted" role="status">
            {progress.done}/{progress.total} done
          </span>
        ) : null}
      </div>

      {uploading && progress.total > 1 ? (
        <div
          className="h-1.5 overflow-hidden rounded-full bg-sla-surface-container"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={progress.total}
          aria-valuenow={progress.done}
          aria-label="Batch upload progress"
        >
          <div
            className="h-full rounded-full bg-sla-primary-container transition-all duration-300 ease-out"
            style={{ width: `${(progress.done / progress.total) * 100}%` }}
          />
        </div>
      ) : null}
    </div>
  )
}
