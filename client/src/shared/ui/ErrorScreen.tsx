import { Button } from './Button'

export interface ErrorScreenProps {
  title?: string
  message: string
  requestId?: string
  onRetry?: () => void
  retryLabel?: string
  statusCode?: number
}

export function ErrorScreen({
  title = 'Something went wrong',
  message,
  requestId,
  onRetry,
  retryLabel = 'Try again',
  statusCode,
}: ErrorScreenProps) {
  return (
    <div className="flex items-center justify-center min-h-[60vh] p-6 text-center" role="alert">
      <div className="flex flex-col items-center gap-4 max-w-[480px]">
        <div className="text-sla-error flex-shrink-0" aria-hidden="true">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
        </div>
        <h1 className="text-headline-lg font-semibold text-sla-on-surface m-0">
          {statusCode ? `${statusCode} — ${title}` : title}
        </h1>
        <p className="text-body-md text-sla-secondary m-0 max-w-[44ch]">{message}</p>
        {requestId && <p className="text-label-sm font-mono text-sla-on-surface-variant m-0">Request ID: {requestId}</p>}
        {onRetry && (
          <div className="flex gap-3 mt-2">
            <Button variant="primary" onClick={onRetry}>{retryLabel}</Button>
          </div>
        )}
      </div>
    </div>
  )
}