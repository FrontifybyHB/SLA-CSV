import { memo } from 'react'
import { Icon } from '@/shared/ui/Icon'

interface TelemetryCardBase {
  label: string
  value: string
  footerIcon: string
  footerText: string
}

interface TelemetryCardWithDot extends TelemetryCardBase {
  statusDot: true
  valueSuffix?: never
  statusText?: never
}

interface TelemetryCardWithStatus extends TelemetryCardBase {
  statusDot?: never
  valueSuffix: string
  statusText: string
}

type TelemetryCardData = TelemetryCardWithDot | TelemetryCardWithStatus

const TELEMETRY_CARDS: readonly TelemetryCardData[] = [
  {
    label: 'Raft Cluster',
    value: 'us-east-1a',
    statusDot: true,
    footerIcon: 'swap_horiz',
    footerText: 'Quorum Met (5/5)',
  },
  {
    label: 'Ingestion SLA',
    value: '1.42M',
    valueSuffix: 'ev/s',
    statusText: 'Healthy',
    footerIcon: 'schedule',
    footerText: 'p99 < 14ms',
  },
] as const

const TRUST_PILLARS = [
  {
    icon: 'shield',
    title: 'Email + Password Session Auth',
    desc: 'Salted-and-hashed credentials with httpOnly session cookies and rotating refresh tokens.',
  },
  {
    icon: 'lock',
    title: 'Zero Third-Party Telemetry Retention',
    desc: 'Encrypted at rest with AWS KMS customer-managed keys (CMK) and mutual TLS in flight.',
  },
] as const

const TelemetryCard = memo(function TelemetryCard({ card }: { card: TelemetryCardData }) {
  const hasDot = 'statusDot' in card
  const hasStatus = 'statusText' in card
  const hasSuffix = 'valueSuffix' in card

  return (
    <div className="p-3.5 bg-sla-surface-container-lowest border border-sla-outline-variant/40 rounded-[8px]">
      <div className="flex items-center justify-between gap-2">
        <span className="text-body-sm text-sla-secondary">{card.label}</span>
        {hasDot && <span className="w-[0.375rem] h-[0.375rem] rounded-full bg-sla-tertiary flex-shrink-0" aria-hidden="true" />}
        {hasStatus && <span className="text-label-sm font-mono text-sla-tertiary font-semibold whitespace-nowrap">{card.statusText}</span>}
      </div>
      <div className="text-[1.25rem] leading-none font-mono font-semibold text-sla-on-surface mt-1 truncate">
        {card.value}
        {hasSuffix && <span className="text-body-sm font-normal text-sla-secondary">{card.valueSuffix}</span>}
      </div>
      <div className="flex items-center gap-1 mt-1 text-label-sm font-mono text-sla-secondary">
        <Icon name={card.footerIcon} size={12} />
        <span>{card.footerText}</span>
      </div>
    </div>
  )
})

export const TrustColumn = memo(function TrustColumn() {
  return (
    <section className="flex flex-col justify-between gap-6 min-w-0 lg:col-span-5">
      <div>
        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sm bg-sla-surface-container-high border border-sla-outline-variant/40 mb-3 w-fit">
          <Icon name="verified_user" size={13} className="text-sla-primary" filled />
          <span className="text-label-sm font-mono text-sla-primary uppercase tracking-wide">Enterprise Gateway v2.4</span>
        </div>
        <h1 className="text-headline-xl-mobile leading-headline-xl-mobile font-semibold tracking-[-0.02em] text-sla-on-surface sm:text-headline-xl sm:leading-headline-xl sm:tracking-[-0.025em]">
          High-velocity infrastructure observability.
        </h1>
        <p className="text-body-md leading-body-md text-sla-secondary mt-2">
          Access your telemetry cluster, SLA breach logs, and real-time ingestion pipelines with
          sub-second querying and deterministic SLO tracing.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
        {TELEMETRY_CARDS.map((card) => (
          <TelemetryCard key={card.label} card={card} />
        ))}
      </div>

      <div className="flex flex-col gap-3 pt-2">
        {TRUST_PILLARS.map((pillar) => (
          <div key={pillar.title} className="flex items-start gap-3">
            <div className="w-5 h-5 flex-shrink-0 rounded-sm bg-sla-surface-container flex items-center justify-center text-sla-primary mt-0.5">
              <Icon name={pillar.icon} size={14} />
            </div>
            <div className="min-w-0">
              <div className="text-body-md font-medium text-sla-on-surface">{pillar.title}</div>
              <div className="text-body-sm text-sla-secondary">{pillar.desc}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="p-3 bg-sla-surface-container border border-sla-outline-variant/30 rounded-[8px] text-label-sm font-mono text-sla-on-secondary-container overflow-hidden">
        <div className="flex items-center justify-between gap-2 pb-1 mb-1 border-b border-sla-outline-variant/20">
          <span className="text-[11px] font-mono text-sla-secondary">SESSION AUDIT HANDSHAKE</span>
          <span className="text-sla-tertiary text-[11px] font-mono whitespace-nowrap">TLS 1.3 / ECDHE-RSA</span>
        </div>
        <p className="text-[11px] font-mono text-sla-secondary whitespace-nowrap overflow-hidden text-ellipsis m-0">
          POST /auth/v2/challenge → 200 OK (latency: 18.2ms)
        </p>
        <p className="text-[11px] font-mono text-sla-secondary whitespace-nowrap overflow-hidden text-ellipsis m-0">
          Host fingerprint: sha256:d8f2b7...9a0c
        </p>
      </div>
    </section>
  )
})