import { memo } from 'react'

export const StatusBar = memo(function StatusBar() {
  return (
    <footer className="fixed left-0 right-0 bottom-0 z-50 flex items-center justify-between gap-2 h-7 px-3 sm:px-5 border-t border-sla-outline-variant/60 bg-white font-mono text-label-sm text-sla-secondary">
      <div className="flex items-center gap-3 min-w-0 overflow-hidden">
        <span className="flex items-center gap-1.5 font-medium text-sla-on-surface whitespace-nowrap">
          <span aria-hidden="true" className="w-2 h-2 rounded-full bg-sla-tertiary-container flex-shrink-0" />
          ENGINE: PARQUET_INDEXER_V4
        </span>
        <span className="hidden md:inline whitespace-nowrap">CLUSTER_PING: 0.8ms</span>
        <span className="hidden lg:inline whitespace-nowrap">STREAM: SYNCHRONIZED</span>
      </div>
      <div className="flex items-center gap-3 min-w-0 overflow-hidden">
        <span className="hidden md:inline whitespace-nowrap">INGEST_PIPELINE: PROD-US-EAST</span>
        <span className="font-semibold text-sla-tertiary-container whitespace-nowrap">SLO STATUS: 99.982% NORMAL</span>
      </div>
    </footer>
  )
})