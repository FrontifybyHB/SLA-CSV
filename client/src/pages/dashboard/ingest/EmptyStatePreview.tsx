import { useCallback } from 'react'
import { Button } from '@/shared/ui/Button'
import { Card } from '@/shared/ui/Card'
import { Icon } from '@/shared/ui/Icon'
import { IconButton } from '@/shared/ui/IconButton'
import { useCopyToClipboard } from '@/shared/lib/useCopyToClipboard'

const CURL_CMD =
  'curl -X POST https://sla.prod.internal/api/v1/datasets/ingest -F "cluster=eu-west" -F "file=@sla_dump.csv"'

export function EmptyStatePreview() {
  const { copied, copy } = useCopyToClipboard()

  const handleCopy = useCallback(() => void copy(CURL_CMD), [copy])

  return (
    <Card
      title="CLUSTER EMPTY STATE PREVIEW"
      actions={<span className="text-label-sm font-mono text-sla-outline">SEC_03 // NULL_ISLAND</span>}
    >
      <div className="flex flex-col md:flex-row md:items-start gap-4 sm:gap-6 p-4 sm:p-6 border border-sla-outline-variant rounded-sm bg-sla-bg/50">
        <div className="flex flex-col items-center justify-center w-28 h-28 sm:w-32 sm:h-32 flex-shrink-0 p-3 border-2 dashed border-sla-outline-variant rounded-sm bg-white shadow-[0_1px_2px_rgb(16_24_40/0.06)] text-sla-outline">
          <Icon name="database" size={36} />
          <div className="font-mono text-label-sm text-sla-secondary mt-2">EU-WEST</div>
          <div className="font-mono text-label-sm font-semibold text-amber-600 mt-0.5">METRICS: 0</div>
        </div>

        <div className="flex-1 min-w-0 w-full">
          <div className="flex items-start gap-2">
            <span aria-hidden="true" className="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0 mt-1.5" />
            <h3 className="text-headline-sm font-bold">No Datasets Ingested for Cluster EU-WEST</h3>
          </div>
          <p className="text-body-md leading-[1.55] text-sla-secondary mt-2">
            Target cluster repository has no historical telemetry logs or active time-series
            buffers mapped. You can ingest manually via terminal CLI or stage an ingestion
            payload.
          </p>

          <div className="flex items-start justify-between gap-2 mt-3 p-2.5 border border-sla-outline-variant rounded-sm bg-sla-surface font-mono text-label-md text-sla-on-surface">
            <code className="flex-1 overflow-x-auto whitespace-nowrap scrollbar-thin px-2">
              <span className="text-sla-outline mr-1">$</span>
              {CURL_CMD}
            </code>
            <IconButton
              label={copied ? 'Copied' : 'Copy CLI command'}
              onClick={handleCopy}
              className="p-1.5 rounded-sm bg-transparent text-sla-secondary hover:bg-sla-surface-container-low hover:text-sla-on-surface"
            >
              <Icon name={copied ? 'check_circle' : 'content_copy'} size={16} />
            </IconButton>
          </div>

          <div className="flex flex-wrap items-center gap-1 sm:gap-3 mt-2 text-label-md text-sla-outline">
            <span>Alternative:</span>
            <Button variant="link" className="p-0 border-none bg-transparent text-sla-primary font-semibold hover:underline">Drag a CSV file into SEC_01 dropzone</Button>
            <span aria-hidden="true">•</span>
            <Button variant="link" className="p-0 border-none bg-transparent text-sla-primary font-semibold hover:underline">Switch Target Cluster</Button>
          </div>
        </div>
      </div>
    </Card>
  )
}