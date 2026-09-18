import type { ObservationLog } from '@/features/reporting'

const CSV_COLUMNS = ['timestamp', 'service', 'agent_id', 'region', 'dataset_id', 'row', 'latency_ms', 'status'] as const

function escapeCell(value: string): string {
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value
}

/** Serializes observation logs to RFC-4180 CSV for the Export button. */
export function observationsToCsv(logs: ObservationLog[]): string {
  const lines = [
    CSV_COLUMNS.join(','),
    ...logs.map((l) =>
      [
        l.timestamp,
        l.service ?? '',
        l.agentId,
        l.region ?? '',
        l.datasetId,
        String(l.row),
        l.latencyMs === null ? '' : String(l.latencyMs),
        l.status,
      ]
        .map(escapeCell)
        .join(','),
    ),
  ]
  return `${lines.join('\n')}\n`
}

/** Triggers a client-side download of the given CSV text. */
export function downloadCsv(filename: string, csv: string): void {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}
