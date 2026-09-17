import { useState } from 'react'
import { Card } from '@/shared/ui/Card'
import { Icon } from '@/shared/ui/Icon'
import { CsvUploadForm } from '@/features/datasets'
import type { UploadResult } from '@/features/datasets'

interface IngestControllerProps {
  onUploaded: (result: UploadResult) => void
}

export function IngestController({ onUploaded }: IngestControllerProps) {
  const [autoIndex, setAutoIndex] = useState(true)

  return (
    <Card
      title="CSV INGESTION CONTROLLER"
      actions={<span className="text-label-sm font-mono text-sla-outline">RFC-4180 STRICT</span>}
    >
      <div className="flex flex-col items-center gap-0 w-full p-5 sm:p-7 border-2 dashed border-sla-outline-variant rounded-sm bg-sla-bg/70 text-center transition-colors hover:border-sla-primary hover:bg-sla-primary/4" role="group" aria-label="Stage telemetry batch CSV file">
        <div className="flex items-center justify-center w-12 h-12 mb-3 border border-sla-outline-variant rounded-sm bg-white text-sla-primary-container shadow-[0_1px_2px_rgb(16_24_40/0.06)]">
          <Icon name="cloud_upload" size={26} />
        </div>
        <p className="text-headline-sm font-semibold">Stage Telemetry Batch</p>
        <p className="text-body-md text-sla-secondary mt-1 mb-4 max-w-[24rem]">
          Drag & drop target CSV or click to mount stream file into active buffer.
        </p>

        <div className="w-full p-3 border border-sla-outline-variant rounded-sm bg-white font-mono text-label-md text-left">
          <div className="flex flex-wrap justify-between gap-1 pb-1.5 mb-1.5 border-b border-sla-outline-variant/40">
            <span className="text-sla-outline">Accepted Spec:</span>
            <span className="text-sla-on-surface font-medium">RFC-4180 Standard CSV</span>
          </div>
          <div className="flex flex-wrap justify-between gap-1 pb-1.5 mb-1.5 border-b border-sla-outline-variant/40">
            <span className="text-sla-outline">Batch Limit:</span>
            <span className="text-sla-on-surface font-medium">Max 5 MB</span>
          </div>
          <div className="flex flex-wrap justify-between gap-1">
            <span className="text-sla-outline">Required Headers:</span>
            <span className="text-sla-primary font-medium overflow-wrap-anywhere">timestamp, service_id, response_time_ms, http_status</span>
          </div>
        </div>

        <p className="flex items-start gap-1.5 mt-3.5 font-mono text-label-sm text-sla-outline text-left">
          <Icon name="verified_user" size={14} />
          <span>Checksum SHA-256 calculated automatically pre-ingest</span>
        </p>
      </div>

      <div className="mt-4">
        <CsvUploadForm onUploaded={onUploaded} />
      </div>

      <div className="flex items-center justify-between gap-3 mt-4 pt-3 border-t border-sla-outline-variant/50 font-mono text-label-md text-sla-secondary">
        <label htmlFor="ingest-autoindex" className="cursor-pointer">Auto-index post ingest</label>
        <span className="inline-flex items-center gap-2 cursor-pointer">
          <input
            id="ingest-autoindex"
            type="checkbox"
            checked={autoIndex}
            onChange={(e) => setAutoIndex(e.target.checked)}
            className="w-4 h-4 accent-sla-primary-container"
          />
          <span className={autoIndex ? 'font-semibold text-sla-primary' : 'text-sla-outline'}>
            {autoIndex ? 'Active' : 'Disabled'}
          </span>
        </span>
      </div>
    </Card>
  )
}