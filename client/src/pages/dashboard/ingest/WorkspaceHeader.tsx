import { useState, type ChangeEvent } from 'react'
import { Button } from '@/shared/ui/Button'
import { Icon } from '@/shared/ui/Icon'

const CLUSTER_OPTIONS = [
  'US-EAST-01 (ACTIVE_STREAM)',
  'EU-WEST-02 (IDLE)',
  'AP-SOUTH-01 (STAGING)',
] as const

export function WorkspaceHeader() {
  const [cluster, setCluster] = useState<string>(CLUSTER_OPTIONS[0])

  function handleCluster(e: ChangeEvent<HTMLSelectElement>) {
    setCluster(e.target.value)
  }

  return (
    <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center sm:justify-between gap-3 mb-4 p-3 sm:p-3.5 border border-sla-outline-variant/60 rounded-sm bg-white shadow-[0_1px_2px_rgb(16_24_40/0.06)]">
      <div className="flex flex-wrap items-center gap-2 sm:gap-3 min-w-0">
        <span className="px-2 py-1 border border-sky-300 rounded-sm bg-sky-50 text-sla-primary font-mono text-label-md font-semibold whitespace-nowrap">
          NODE // INGEST_PIPELINE
        </span>

        <span className="flex items-center gap-1.5 font-mono text-label-md text-sla-outline">
          <label htmlFor="ingest-cluster" className="whitespace-nowrap">CLUSTER:</label>
          <select
            id="ingest-cluster"
            value={cluster}
            onChange={handleCluster}
            className="max-w-[13.75rem] px-2 py-1 border border-sla-outline-variant rounded-sm bg-sla-surface text-sla-on-surface font-mono text-label-md cursor-pointer focus:outline-none focus:border-sla-primary focus:bg-white"
          >
            {CLUSTER_OPTIONS.map((opt) => (
              <option key={opt}>{opt}</option>
            ))}
          </select>
        </span>

        <span aria-hidden="true" className="text-sla-outline-variant hidden sm:inline">/</span>

        <span className="flex items-center gap-1.5 font-mono text-label-md text-sla-outline">
          INGEST_MODE:
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 border border-emerald-300 rounded-sm bg-emerald-50 text-emerald-800 font-mono text-label-md font-medium whitespace-nowrap">
            <span aria-hidden="true" className="w-[0.375rem] h-[0.375rem] rounded-full bg-emerald-500" />
            CONTINUOUS_BUFFER
          </span>
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button variant="secondary" size="sm">
          <Icon name="science" size={16} />
          Validate Schema Dry-Run
        </Button>
        <Button variant="secondary" size="sm">
          <Icon name="download" size={16} />
          Download Spec (.csv)
        </Button>
        <Button variant="primary" size="sm">
          <Icon name="refresh" size={16} />
          Re-index Selected
        </Button>
      </div>
    </div>
  )
}