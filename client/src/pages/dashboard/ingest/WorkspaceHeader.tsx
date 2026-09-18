import { Link } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { Button } from '@/shared/ui/Button'
import { Icon } from '@/shared/ui/Icon'

const CSV_TEMPLATE = [
  'agent_id,timestamp,latency_ms,status,service,region',
  'agent1,2025-01-15T10:00:00Z,45,UP,api,us-east',
  'agent2,2025-01-15T10:00:00Z,52,UP,api,us-east',
  'agent3,2025-01-15T10:00:00Z,,DOWN,api,us-east',
  '',
].join('\n')

/**
 * Workspace action bar. Every control here does something real:
 * template download (generated client-side), inventory refresh
 * (invalidates the datasets queries) and a link to the SLA overview.
 * The old fake cluster/mode selectors and dead buttons are gone.
 */
export function WorkspaceHeader() {
  const queryClient = useQueryClient()

  function handleDownloadTemplate() {
    const blob = new Blob([CSV_TEMPLATE], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'sla_template.csv'
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
    URL.revokeObjectURL(url)
  }

  function handleRefresh() {
    void queryClient.invalidateQueries({ queryKey: ['datasets'] })
  }

  return (
    <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center sm:justify-between gap-3 mb-4 p-3 sm:p-3.5 border border-sla-outline-variant/60 rounded-sm bg-white shadow-[0_1px_2px_rgb(16_24_40/0.06)]">
      <div className="flex flex-wrap items-center gap-2 sm:gap-3 min-w-0">
        <span className="px-2 py-1 border border-sky-300 rounded-sm bg-sky-50 text-sla-primary font-mono text-label-md font-semibold whitespace-nowrap">
          CSV INGEST WORKSPACE
        </span>
        <span className="font-mono text-label-md text-sla-secondary">
          Uploads are idempotent — re-uploading the same file returns the existing dataset.
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button variant="secondary" size="sm" onClick={handleDownloadTemplate}>
          <Icon name="download" size={16} />
          CSV template
        </Button>
        <Button variant="secondary" size="sm" onClick={handleRefresh}>
          <Icon name="refresh" size={16} />
          Refresh inventory
        </Button>
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 px-2.5 py-1.5 text-sm rounded-sm bg-sla-primary text-white hover:bg-sla-primary-hover font-medium no-underline"
        >
          <Icon name="monitoring" size={16} />
          SLA overview
        </Link>
      </div>
    </div>
  )
}
