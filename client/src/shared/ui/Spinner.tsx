export function Spinner() {
  return (
    <span className="inline-block w-4 h-4 border-2 border-sla-border border-t-sla-primary rounded-full animate-spin" role="status" aria-label="Loading" aria-live="polite">
      <span className="sr-only">Loading</span>
    </span>
  )
}