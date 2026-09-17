import { Button } from './Button'

export interface ErrorStateProps {
  title?: string
  message: string
  requestId?: string
  onRetry?: () => void
  retryLabel?: string
  className?: string
}

export function ErrorState({
  title = 'Something went wrong.',
  message,
  requestId,
  onRetry,
  retryLabel = 'Try again',
  className,
}: ErrorStateProps) {
  return (
    <div className={['flex flex-col items-center gap-2 p-6 text-center', className ?? ''].filter(Boolean).join(' ')} role="alert">
      <p className="text-base font-semibold">{title}</p>
      <p className="text-base text-sla-text-muted max-w-[44ch]">{message}</p>
      {requestId && <p className="text-sm text-sla-text-faint">Request ID: {requestId}</p>}
      {onRetry ? (
        <div className="mt-3">
          <Button variant="secondary" onClick={onRetry}>
            {retryLabel}
          </Button>
        </div>
      ) : null}
    </div>
  )
}