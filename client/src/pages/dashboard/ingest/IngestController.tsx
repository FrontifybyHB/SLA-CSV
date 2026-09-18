import { Card } from '@/shared/ui/Card'
import { Icon } from '@/shared/ui/Icon'
import { CsvUploadForm } from '@/features/datasets'
import type { UploadResult } from '@/features/datasets'

interface IngestControllerProps {
  /** Called once per imported file. */
  onUploaded: (result: UploadResult, file: File) => void
  autoIndex: boolean
  onAutoIndexChange: (next: boolean) => void
}

export function IngestController({ onUploaded, autoIndex, onAutoIndexChange }: IngestControllerProps) {
  return (
    <Card
      title="CSV ingestion"
      actions={<span className="font-mono text-[11px] text-sla-text-muted">RFC-4180 STRICT</span>}
    >
      <CsvUploadForm onUploaded={onUploaded} />

      <div className="mt-3 flex items-center justify-between gap-3 border-t border-sla-outline-variant/50 pt-3 font-mono text-[12px] text-sla-secondary">
        <label htmlFor="ingest-autoindex" className="cursor-pointer">
          Auto-select newest dataset
        </label>
        <button
          id="ingest-autoindex"
          type="button"
          role="switch"
          aria-checked={autoIndex}
          onClick={() => onAutoIndexChange(!autoIndex)}
          className={[
            'relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-sla-primary focus-visible:ring-offset-2',
            autoIndex ? 'bg-sla-primary-container' : 'bg-sla-outline-variant',
          ].join(' ')}
        >
          <span
            className={[
              'inline-block h-4 w-4 rounded-full bg-white shadow transition-transform duration-200',
              autoIndex ? 'translate-x-[1.125rem]' : 'translate-x-0.5',
            ].join(' ')}
          />
        </button>
      </div>

      <p className="mt-2 flex items-start gap-1.5 font-mono text-[11px] leading-relaxed text-sla-text-muted">
        <Icon name="verified_user" size={14} />
        <span>
          {autoIndex
            ? 'New imports are selected automatically. Checksum (SHA-256) is calculated server-side pre-ingest.'
            : 'Auto-select is off — new imports land in the inventory without changing your selection.'}
        </span>
      </p>
    </Card>
  )
}
