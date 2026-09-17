import { memo } from 'react'

interface SectionHeadingProps {
  eyebrow: string
  title: string
  description?: string
  align?: 'left' | 'between'
}

export const SectionHeading = memo(function SectionHeading({
  eyebrow,
  title,
  description,
  align = 'left',
}: SectionHeadingProps) {
  const heading = (
    <>
      <div className="text-label-sm font-mono text-sla-primary font-semibold uppercase tracking-wide mb-1">
        {eyebrow}
      </div>
      <h2 className="text-[clamp(1.5rem,1.15rem+1vw,3.25rem)] leading-[1.2] font-semibold tracking-[-0.02em] text-sla-on-surface max-w-[22ch] text-balance">
        {title}
      </h2>
    </>
  )

  if (align === 'between') {
    return (
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-10">
        <div>{heading}</div>
        {description && (
          <p className="text-body-md leading-body-md text-sla-secondary max-w-[32rem] mb-0">
            {description}
          </p>
        )}
      </div>
    )
  }

  return (
    <div className="mb-10 min-w-0">
      {heading}
      {description && (
        <p className="text-body-md leading-body-md text-sla-secondary mt-3 max-w-[48rem]">
          {description}
        </p>
      )}
    </div>
  )
})