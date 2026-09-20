import { Button } from './Button'
import { Icon } from './Icon'

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
    <div
      className={[
        'flex flex-col items-center gap-2 p-6 text-center rounded-[5px] border border-sla-danger/30 bg-sla-danger-soft',
        className ?? '',
      ]
        .filter(Boolean)
        .join(' ')}
      role="alert"
    >
      <span
        className="flex items-center justify-center w-9 h-9 rounded-full bg-sla-danger/10 text-sla-danger"
        aria-hidden="true"
      >
        <Icon name="error" size={22} />
      </span>
      <p className="text-base font-semibold text-sla-danger">{title}</p>
      <p className="text-base text-sla-danger/90 max-w-[44ch]">{message}</p>
      {requestId && <p className="text-sm text-sla-danger/70 font-mono">Request ID: {requestId}</p>}
      {onRetry ? (
        <div className="mt-3">
          <Button
            variant="secondary"
            onClick={onRetry}
            className="border-sla-danger/50 text-sla-danger hover:bg-sla-danger hover:border-sla-danger hover:text-white"
          >
            {retryLabel}
          </Button>
        </div>
      ) : null}
    </div>
  )
}