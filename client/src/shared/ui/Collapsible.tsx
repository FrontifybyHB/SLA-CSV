import { useState, useId, type ReactNode } from 'react'

export interface CollapsibleProps {
  title: string
  defaultOpen?: boolean
  children: ReactNode
}

export function Collapsible({ title, defaultOpen = false, children }: CollapsibleProps) {
  const contentId = useId()
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="border border-sla-border rounded-md bg-sla-surface">
      <button
        type="button"
        className="w-full flex items-center gap-2 p-3 bg-none border-none rounded-inherit text-sla-text font-base font-semibold text-left cursor-pointer focus:outline-none focus:shadow-focus"
        aria-expanded={open}
        aria-controls={contentId}
        onClick={() => setOpen((value) => !value)}
      >
        <span className="text-sla-text-muted" aria-hidden="true">
          {open ? '−' : '+'}
        </span>
        {title}
      </button>
      <div id={contentId} className="p-3 sm:p-4 border-t border-sla-border" hidden={!open}>
        {children}
      </div>
    </div>
  )
}