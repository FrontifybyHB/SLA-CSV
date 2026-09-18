import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Icon } from '@/shared/ui/Icon'
import { IconButton } from '@/shared/ui/IconButton'

interface SchemaAlertProps {
  issueCount: number
  datasetId: string | null
}

/**
 * Only renders when the selected dataset actually has quality issues.
 * Previously this alert was hardcoded and always visible with fabricated
 * row numbers — now it reflects the real `issueCount` from the API.
 */
export function SchemaAlert({ issueCount, datasetId }: SchemaAlertProps) {
  const [dismissed, setDismissed] = useState(false)
  if (dismissed || issueCount <= 0) return null

  return (
    <div role="alert" className="p-4 border border-amber-300 border-l-4 border-l-amber-500 rounded-sm bg-amber-50 shadow-[0_1px_2px_rgb(16_24_40/0.06)]">
      <div className="flex items-start justify-between gap-2.5">
        <div className="flex items-start gap-2.5 min-w-0">
          <span className="text-amber-600 flex-shrink-0 mt-0.5">
            <Icon name="warning" size={20} />
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-label-md font-bold uppercase tracking-wide text-amber-800">Data quality issues</span>
              <span className="px-1.5 py-0.125 border border-amber-400 rounded-sm bg-amber-100 text-amber-800 font-mono text-label-sm">
                {issueCount} row{issueCount === 1 ? '' : 's'} flagged
              </span>
            </div>
            <p className="text-body-md text-amber-800 mt-1.5">
              Some rows failed normalization (bad timestamps, unknown status values or missing
              fields) and were quarantined. The import itself completed.
            </p>
          </div>
        </div>
        <IconButton label="Dismiss alert" onClick={() => setDismissed(true)} className="p-1.5 rounded-sm bg-transparent text-sla-secondary hover:bg-sla-surface-container-low hover:text-sla-on-surface">
          <Icon name="close" size={16} />
        </IconButton>
      </div>

      {datasetId ? (
        <div className="flex flex-wrap items-center justify-end gap-2 mt-3 pt-2.5 border-t border-amber-300 font-mono text-label-md">
          <Link
            to={`/dashboard?dataset=${encodeURIComponent(datasetId)}`}
            className="text-sla-primary font-semibold hover:underline"
          >
            Inspect availability impact →
          </Link>
        </div>
      ) : null}
    </div>
  )
}
