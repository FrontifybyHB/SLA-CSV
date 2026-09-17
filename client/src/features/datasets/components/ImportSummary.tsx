import { Button } from '@/shared/ui/Button'
import { Card } from '@/shared/ui/Card'
import { formatCount } from '@/shared/lib/format'
import type { UploadResult } from '../model/upload.types'

export interface ImportSummaryProps {
  result: UploadResult
  onView: () => void
  onDismiss: () => void
}

export function ImportSummary({ result, onView, onDismiss }: ImportSummaryProps) {
  return (
    <Card
      title={result.duplicate ? 'Dataset already imported' : 'Import complete'}
      actions={
        <Button variant="ghost" size="sm" onClick={onDismiss}>
          Dismiss
        </Button>
      }
    >
      <p className="import-summary__status">
        {result.duplicate
          ? 'This file was already imported. Showing the existing dataset.'
          : 'The CSV was parsed, validated, and saved atomically.'}
      </p>
      <dl className="summary-grid import-summary__grid">
        <div className="summary-item">
          <dt className="summary-item__label">Dataset</dt>
          <dd className="summary-item__value">{result.datasetId.slice(0, 8)}…</dd>
        </div>
        {result.observationCount !== undefined && (
          <div className="summary-item">
            <dt className="summary-item__label">Rows imported</dt>
            <dd className="summary-item__value">{formatCount(result.observationCount)}</dd>
          </div>
        )}
        {result.slotCount !== undefined && (
          <div className="summary-item">
            <dt className="summary-item__label">Slots</dt>
            <dd className="summary-item__value">{formatCount(result.slotCount)}</dd>
          </div>
        )}
        {result.issueCount !== undefined && (
          <div className="summary-item">
            <dt className="summary-item__label">Issues</dt>
            <dd className="summary-item__value">{formatCount(result.issueCount)}</dd>
          </div>
        )}
      </dl>
      <div className="import-summary__actions">
        <Button variant="secondary" onClick={onView}>
          View dataset
        </Button>
      </div>
    </Card>
  )
}