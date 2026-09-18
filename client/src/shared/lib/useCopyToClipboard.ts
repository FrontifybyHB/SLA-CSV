import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Copy-to-clipboard with legacy fallback and transient "copied" state.
 * Consolidates the identical logic previously duplicated in
 * DashboardTopNav and ApiExampleSection.
 */
export function useCopyToClipboard(resetAfterMs = 2000): {
  copied: boolean
  copy: (text: string) => Promise<void>
} {
  const [copied, setCopied] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(
    () => () => {
      if (timeoutRef.current !== null) clearTimeout(timeoutRef.current)
    },
    [],
  )

  const copy = useCallback(
    async (text: string) => {
      try {
        if (navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(text)
        } else {
          throw new Error('clipboard-unavailable')
        }
      } catch {
        const ta = document.createElement('textarea')
        ta.value = text
        ta.setAttribute('readonly', '')
        ta.style.position = 'fixed'
        ta.style.opacity = '0'
        document.body.appendChild(ta)
        ta.select()
        try {
          document.execCommand('copy')
        } catch {
          /* no-op */
        }
        document.body.removeChild(ta)
      }

      setCopied(true)
      if (timeoutRef.current !== null) clearTimeout(timeoutRef.current)
      timeoutRef.current = setTimeout(() => setCopied(false), resetAfterMs)
    },
    [resetAfterMs],
  )

  return { copied, copy }
}
