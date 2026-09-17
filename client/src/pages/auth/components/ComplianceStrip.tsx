import { Fragment, memo } from 'react'
import { Icon } from '@/shared/ui/Icon'

const COMPLIANCE_ITEMS = [
  { icon: 'check_circle', iconClass: 'text-sla-tertiary', label: 'SOC-2 Type II Certified', filled: true },
  { icon: 'enhanced_encryption', iconClass: 'text-sla-primary', label: '256-bit AES Encryption at Rest', filled: true },
  { icon: 'database', iconClass: 'text-sla-on-surface', label: 'Zero Third-Party Telemetry Retention', filled: true },
  { icon: 'bolt', iconClass: 'text-sla-tertiary', label: 'SLO Violation Webhooks Active', filled: false },
] as const

export const ComplianceStrip = memo(function ComplianceStrip() {
  return (
    <section className="w-full bg-sla-surface-container-low border-y border-sla-outline-variant/30 py-4">
      <div className="auth-container flex flex-wrap items-center justify-center gap-4 sm:gap-10 text-label-md font-mono text-sla-secondary">
        {COMPLIANCE_ITEMS.map((item, index) => (
          <Fragment key={item.label}>
            {index > 0 && (
              <div aria-hidden="true" className="w-px h-5 bg-sla-outline-variant/60 hidden sm:block md:block lg:block" />
            )}
            <div className="flex items-center gap-2">
              <Icon name={item.icon} size={16} className={item.iconClass} filled={item.filled} />
              <span className="whitespace-nowrap">{item.label}</span>
            </div>
          </Fragment>
        ))}
      </div>
    </section>
  )
})