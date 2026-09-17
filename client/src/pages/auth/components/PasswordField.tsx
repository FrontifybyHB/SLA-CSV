import { memo, useCallback, useState, type ChangeEvent, type FocusEvent, type ReactNode } from 'react'
import { Icon } from '@/shared/ui/Icon'
import { IconButton } from '@/shared/ui/IconButton'

interface PasswordFieldProps {
  id: string
  label: ReactNode
  value: string
  placeholder: string
  autoComplete?: string
  onChange: (value: string) => void
  onBlur?: (e: FocusEvent<HTMLInputElement>) => void
  rightSlot?: ReactNode
}

export const PasswordField = memo(function PasswordField({
  id,
  label,
  value,
  placeholder,
  autoComplete = 'current-password',
  onChange,
  onBlur,
  rightSlot,
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false)
  const toggle = useCallback(() => setVisible((v) => !v), [])

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <label htmlFor={id} className="text-label-md font-mono text-sla-on-surface">
          {label}
        </label>
        {rightSlot}
      </div>
      <div className="relative">
        <div className="relative bg-sla-surface-container-lowest border border-sla-outline-variant/60 rounded-[2px] transition-colors focus-within:border-sla-primary focus-within:shadow-focus">
          <input
            id={id}
            name={id}
            type={visible ? 'text' : 'password'}
            value={value}
            onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
            onBlur={onBlur}
            placeholder={placeholder}
            autoComplete={autoComplete}
            required
            className="w-full h-10 bg-transparent border-none text-sla-on-surface text-body-md font-sla pl-3 pr-10 focus:outline-none focus:ring-0"
          />
        </div>
        <IconButton
          label={visible ? 'Hide password' : 'Show password'}
          onClick={toggle}
          aria-pressed={visible}
          className="absolute inset-y-0 right-0 flex items-center px-3 text-sla-secondary hover:text-sla-on-surface transition-colors"
        >
          <Icon name={visible ? 'visibility_off' : 'visibility'} size={20} />
        </IconButton>
      </div>
    </div>
  )
})