import { cloneElement, type ReactElement } from 'react'

export interface FieldProps {
  htmlFor: string
  label: string
  hint?: string
  error?: string
  children: ReactElement
}

export function Field({ htmlFor, label, hint, error, children }: FieldProps) {
  const hintId = `${htmlFor}-hint`
  const errorId = `${htmlFor}-error`
  const describedBy = [hint ? hintId : null, error ? errorId : null]
    .filter(Boolean)
    .join(' ')
    .trim()

  const control = cloneElement(children as ReactElement<Record<string, unknown>>, {
    'aria-invalid': error ? true : undefined,
    'aria-describedby': describedBy || undefined,
  })

  return (
    <div className="flex flex-col gap-2">
      <label className="text-label-sm font-semibold text-sla-on-surface" htmlFor={htmlFor}>
        {label}
      </label>
      {control}
      {hint && !error ? (
        <p id={hintId} className="text-label-sm text-sla-text-muted">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className="text-label-sm text-sla-danger" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}