import { memo, useCallback } from 'react'
import { Icon } from '@/shared/ui/Icon'
import { IconButton } from '@/shared/ui/IconButton'
import { useCopyToClipboard } from '@/shared/lib/useCopyToClipboard'

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

const CURL_SNIPPET = `curl -X POST ${API_BASE_URL}/api/v1/datasets \\
  -H "Authorization: Bearer $TOKEN" \\
  -H "Content-Type: text/csv" \\
  --data-binary @telemetry.csv`

interface CodeLine {
  className: string
  content: string
  indent?: 1 | 2
  suffix?: string
  highlight?: string
  highlightClass?: string
  highlightContent?: string
  suffix2?: string
}

const CODE_LINES: readonly CodeLine[] = [
  { className: 'text-sla-outline', content: '# Upload a CSV extract (same call the dashboard makes)' },
  { className: 'text-sla-primary font-semibold', content: 'curl', suffix: ` -X POST ${API_BASE_URL}/api/v1/datasets {'` },
  { indent: 1, className: '', content: '-H ', highlight: '"Authorization: Bearer $TOKEN"', suffix: ' {' },
  { indent: 1, className: '', content: '-H ', highlight: '"Content-Type: text/csv"', suffix: ' {' },
  { indent: 1, className: '', content: '--data-binary @telemetry.csv' },
  { className: 'text-sla-outline', content: '# 201 Created (or 200 when the file was already imported)' },
  { className: 'text-sla-secondary', content: '{' },
  { indent: 1, className: 'text-sla-primary font-semibold', content: '"success"', suffix: ': ', highlight: 'true', suffix2: ',' },
  { indent: 1, className: 'text-sla-primary font-semibold', content: '"data"', suffix: ': ', highlightClass: 'text-sla-secondary', highlightContent: '{' },
  { indent: 2, className: 'text-sla-primary font-semibold', content: '"duplicate"', suffix: ': ', highlight: 'false', suffix2: ',' },
  { indent: 2, className: 'text-sla-primary font-semibold', content: '"datasetId"', suffix: ': ', highlightClass: 'text-sla-tertiary', highlightContent: '"…"', suffix2: ',' },
  { indent: 2, className: 'text-sla-primary font-semibold', content: '"observationCount"', suffix: ': ', highlightClass: 'text-sla-on-surface font-semibold', highlightContent: '…', suffix2: ',' },
  { indent: 2, className: 'text-sla-primary font-semibold', content: '"slotCount"', suffix: ': ', highlightClass: 'text-sla-on-surface font-semibold', highlightContent: '…', suffix2: ',' },
  { indent: 2, className: 'text-sla-primary font-semibold', content: '"issueCount"', suffix: ': ', highlightClass: 'text-sla-on-surface font-semibold', highlightContent: '…' },
  { indent: 1, className: 'text-sla-secondary', content: '}' },
  { className: 'text-sla-secondary', content: '}' },
] as const

export const ApiExampleSection = memo(function ApiExampleSection() {
  const { copied, copy } = useCopyToClipboard()

  const handleCopy = useCallback(() => void copy(CURL_SNIPPET), [copy])

  return (
    <section id="api" className="py-12 sm:py-18 lg:py-24 xl:py-32 bg-sla-surface-container-lowest border-b border-sla-outline-variant/60">
      <div className="home-container">
        <div className="grid grid-cols-1 gap-8 lg:gap-12 lg:grid-cols-2 lg:items-start xl:items-center">
          <div className="min-w-0">
            <div className="text-label-sm font-mono text-sla-primary font-semibold uppercase tracking-wide mb-1">
              API
            </div>
            <h2 className="text-[clamp(1.5rem,1.15rem+1vw,3.25rem)] leading-[1.2] font-semibold tracking-[-0.02em] text-sla-on-surface max-w-[22ch] text-balance mb-4">
              Upload with any HTTP client.
            </h2>
            <p className="text-body-md leading-body-md text-sla-secondary mb-6">
              The dashboard calls the same endpoints you can call yourself.
              Authenticate with a Bearer token, POST the CSV bytes, and read
              back the import result envelope.
            </p>

            <div className="flex flex-col gap-3 mb-8">
              <div className="flex items-start gap-3 min-w-0">
                <Icon name="check_circle" size={20} className="text-sla-primary flex-shrink-0 mt-0.5" />
                <div>
                  <strong>Auth required:</strong>{' '}
                  <code className="font-mono text-sla-primary">/api/v1/datasets</code>{' '}
                  routes need a Bearer token.
                </div>
              </div>
              <div className="flex items-start gap-3 min-w-0">
                <Icon name="check_circle" size={20} className="text-sla-primary flex-shrink-0 mt-0.5" />
                <div>
                  <strong>Real response:</strong>{' '}
                  <code className="font-mono text-sla-primary">&#123; success, data &#125;</code>{' '}
                  with <code className="font-mono text-sla-primary">datasetId</code>, row/slot/issue counts, and a{' '}
                  <code className="font-mono text-sla-primary">duplicate</code> flag on re-upload.
                </div>
              </div>
            </div>

            <a href="/dashboard" className="inline-flex items-center gap-1.5 text-label-md font-mono font-semibold text-sla-primary text-nowrap transition-colors hover:text-sla-primary-container">
              <span>Try it in the dashboard</span>
              <Icon name="arrow_forward" size={16} />
            </a>
          </div>

          <div className="min-w-0">
            <div className="bg-sla-surface border border-sla-outline-variant/80 rounded-sm overflow-hidden shadow-[0_1px_2px_rgb(16_24_40/0.06)]">
              <div className="flex items-center justify-between gap-3 px-2.5 py-2 bg-sla-surface-container border-b border-sla-outline-variant/60">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <span className="w-3 h-3 rounded-full bg-sla-outline-variant flex-shrink-0" />
                  <span className="w-3 h-3 rounded-full bg-sla-outline-variant flex-shrink-0" />
                  <span className="w-3 h-3 rounded-full bg-sla-outline-variant flex-shrink-0" />
                  <span className="ml-2 text-label-sm font-mono text-sla-secondary truncate">bash — upload CSV</span>
                </div>
                <IconButton
                  label="Copy curl snippet"
                  onClick={handleCopy}
                  aria-live="polite"
                  className="text-label-sm font-mono text-sla-primary hover:underline px-1 py-0.5 flex items-center gap-1"
                >
                  <Icon name="content_copy" size={14} />
                  <span>{copied ? 'Copied!' : 'Copy'}</span>
                </IconButton>
              </div>

              <div className="overflow-x-auto max-w-full bg-sla-surface-container-lowest p-4 sm:p-5 font-mono text-label-sm leading-[1.625]">
                <pre className="m-0 whitespace-pre overflow-wrap-normal break-normal">
                  {CODE_LINES.map((line, i) => (
                    <span key={i} className={line.className}>
                      {line.indent === 2 ? '    ' : line.indent ? '  ' : ''}
                      {line.content}
                      {line.suffix}
                      {line.highlight && <span className={`font-mono ${line.highlightClass || ''}`}>{line.highlight}</span>}
                      {line.suffix2}
                      {line.highlightClass && line.highlightContent && <span className={line.highlightClass}>{line.highlightContent}</span>}
                      {i < CODE_LINES.length - 1 ? '\n' : ''}
                    </span>
                  ))}
                </pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
})