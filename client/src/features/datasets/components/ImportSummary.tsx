import { Button } from '@/shared/ui/Button'
import { Card } from '@/shared/ui/Card'
import { Icon } from '@/shared/ui/Icon'
import { Stat } from '@/shared/ui/Stat'
import { formatCount } from '@/shared/lib/format'
import type { UploadResult } from '../model/upload.types'

export interface ImportSummaryProps {
  result: UploadResult
  /** Original file name (the API result carries no filename). */
  filename?: string
  onView: () => void
  onDismiss: () => void
}

function formatLatency(value: number | null | undefined): string {
  if (value === null || value === undefined) return '—'
  return `${value}ms`
}

export function ImportSummary({ result, filename, onView, onDismiss }: ImportSummaryProps) {
  const metrics = result.metrics
  const services = metrics ? Object.values(metrics.services) : []
  const invalidRows = result.invalidRows ?? metrics?.invalidRows ?? 0
  const duplicateRows = result.duplicateRows ?? metrics?.duplicateRows ?? 0

  return (
    <Card
      title={result.duplicate ? 'Dataset already imported' : 'Import complete'}
      actions={
        <Button variant="ghost" size="sm" onClick={onDismiss}>
          Dismiss
        </Button>
      }
      className="border-sla-success/50"
    >
      <p className="flex items-start gap-2 text-[0.8125rem] leading-relaxed text-sla-secondary">
        <Icon
          name={result.duplicate ? 'info' : 'check_circle'}
          size={16}
          className="mt-0.5 shrink-0 text-sla-success"
        />
        <span>
          {filename ? <strong className="font-semibold text-sla-on-surface">{filename}</strong> : null}
          {filename ? ' — ' : null}
          {result.duplicate
            ? 'This file was already imported. Showing the existing dataset.'
            : 'Parsed, validated and saved atomically.'}
        </span>
      </p>
      <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-4">
        <Stat label="Dataset" value={`${result.datasetId.slice(0, 8)}…`} hint={result.datasetId} />
        {result.observationCount !== undefined && (
          <Stat label="Rows kept" value={formatCount(result.observationCount)} />
        )}
        {result.slotCount !== undefined && (
          <Stat label="Slots" value={formatCount(result.slotCount)} />
        )}
        {result.issueCount !== undefined && (
          <Stat label="Issues" value={formatCount(result.issueCount)} />
        )}
        {invalidRows > 0 && (
          <Stat label="Rows quarantined" value={formatCount(invalidRows)} hint="Invalid rows skipped, kept as issues" />
        )}
        {duplicateRows > 0 && (
          <Stat label="Duplicates collapsed" value={formatCount(duplicateRows)} />
        )}
        {metrics && metrics.missingSlotsTotal > 0 && (
          <Stat label="Missing slots filled" value={formatCount(metrics.missingSlotsTotal)} hint="Gaps filled as UNKNOWN" />
        )}
      </dl>
      {services.length > 0 && (
        <div className="mt-3 border-t border-sla-outline-variant/50 pt-3 overflow-x-auto">
          <p className="font-mono text-label-sm font-semibold text-sla-secondary mb-2">
            PER-SERVICE BREAKDOWN
          </p>
          <table className="w-full font-mono text-label-sm">
            <thead>
              <tr className="text-left text-sla-secondary">
                <th className="pr-3 pb-1 font-medium">Service</th>
                <th className="pr-3 pb-1 font-medium text-right">Uptime</th>
                <th className="pr-3 pb-1 font-medium text-right">Up</th>
                <th className="pr-3 pb-1 font-medium text-right">Down</th>
                <th className="pr-3 pb-1 font-medium text-right">Unknown</th>
                <th className="pr-3 pb-1 font-medium text-right">Missing</th>
                <th className="pb-1 font-medium text-right">p95</th>
              </tr>
            </thead>
            <tbody>
              {services.map((s) => (
                <tr key={s.service} className="border-t border-sla-outline-variant/40">
                  <td className="pr-3 py-1 font-semibold text-sla-on-surface">{s.service}</td>
                  <td className="pr-3 py-1 text-right">{s.uptimePercentage.toFixed(2)}%</td>
                  <td className="pr-3 py-1 text-right">{formatCount(s.upSlots)}</td>
                  <td className="pr-3 py-1 text-right">{formatCount(s.downSlots)}</td>
                  <td className="pr-3 py-1 text-right">{formatCount(s.unknownSlots)}</td>
                  <td className="pr-3 py-1 text-right">{formatCount(s.missingSlots)}</td>
                  <td className="py-1 text-right">{formatLatency(s.p95LatencyMs)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className="mt-3 border-t border-sla-outline-variant/50 pt-3">
        <Button variant="secondary" size="sm" onClick={onView}>
          View dataset
        </Button>
      </div>
    </Card>
  )
}
