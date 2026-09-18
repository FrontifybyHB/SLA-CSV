import { memo } from 'react'
import { DashboardHeader } from '@/shared/ui/DashboardHeader'
import { DASHBOARD_NAV_LINKS, useSignOut } from '@/shared/ui/dashboard-nav'
import { useDatasets } from '@/features/datasets'

interface DashboardTopNavProps {
  search: string
  onSearchChange: (value: string) => void
}

/** Single dashboard header (ingest flavour): brand + nav + status + sign out. */
export const DashboardTopNav = memo(function DashboardTopNav({
  search,
  onSearchChange,
}: DashboardTopNavProps) {
  const { data: datasets } = useDatasets()
  const { signOut, signingOut } = useSignOut()

  return (
    <DashboardHeader
      eyebrow="INGEST"
      search={{
        value: search,
        onChange: onSearchChange,
        placeholder: 'FILTER_DATASETS [CMD+K]',
        ariaLabel: 'Filter datasets',
      }}
      links={DASHBOARD_NAV_LINKS}
      status={
        <span className="hidden md:inline-flex items-center gap-1.5 px-2 py-0.5 border border-success bg-success-soft font-mono text-[11px] font-semibold text-success whitespace-nowrap rounded-sm">
          <span aria-hidden="true" className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
          {datasets ? `${datasets.length} dataset${datasets.length === 1 ? '' : 's'}` : '…'}
        </span>
      }
      userLabel="OP"
      onSignOut={() => void signOut()}
      signingOut={signingOut}
    />
  )
})
