import { useState } from 'react'
import { Button } from '@/shared/ui/Button'
import { Icon } from '@/shared/ui/Icon'
import { IconButton } from '@/shared/ui/IconButton'

export function SchemaAlert() {
  const [dismissed, setDismissed] = useState(false)
  if (dismissed) return null

  return (
    <div role="alert" className="p-4 border border-rose-300 border-l-4 border-l-rose-600 rounded-sm bg-rose-50 shadow-[0_1px_2px_rgb(16_24_40/0.06)]">
      <div className="flex items-start justify-between gap-2.5">
        <div className="flex items-start gap-2.5 min-w-0">
          <span className="text-rose-600 flex-shrink-0 mt-0.5">
            <Icon name="error" size={20} />
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-label-md font-bold uppercase tracking-wide text-rose-700">Schema Mismatch</span>
              <span className="px-1.5 py-0.125 border border-rose-400 rounded-sm bg-rose-100 text-rose-800 font-mono text-label-sm">ROW 48,201</span>
            </div>
            <p className="font-mono text-label-md leading-[1.6] text-rose-700 overflow-wrap-anywhere mt-1.5">
              Expected <strong>INT</strong> for <code className="px-1 rounded-[4px] bg-white/70 text-sla-on-surface font-bold">response_time_ms</code>, received <strong>"NULL"</strong>.
            </p>
            <p className="text-body-md text-rose-700 mt-1">
              Parsing interrupted. Pipeline throttled down to fail-safe dry quarantine mode.
            </p>
          </div>
        </div>
        <IconButton label="Dismiss alert" onClick={() => setDismissed(true)} className="p-1.5 rounded-sm bg-transparent text-sla-secondary hover:bg-sla-surface-container-low hover:text-sla-on-surface">
          <Icon name="close" size={16} />
        </IconButton>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 mt-3.5 pt-2.5 border-t border-rose-300 font-mono text-label-md">
        <span className="text-label-sm text-rose-700">Fix source file or pass --allow-nulls flag</span>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm">Isolate Row</Button>
          <Button variant="primary" size="sm">Skip Row</Button>
        </div>
      </div>
    </div>
  )
}