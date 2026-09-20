import { Suspense, lazy } from 'react'
import { Navigate } from 'react-router-dom'
import { useSession } from '@/features/auth/hooks/useSession'
import { AuthCard } from './components/AuthCard'
import { AppFooter } from '@/shared/ui/AppFooter'
import { GraphBackground } from '@/shared/ui/GraphBackground'
import { Skeleton } from '@/shared/ui/Skeleton'
import { AUTH_FOOTER_LINKS } from '@/shared/ui/siteNav'
import { AuthHeader } from './components/AuthHeader'

const TrustColumn = lazy(() =>
  import('./components/TrustColumn').then((m) => ({ default: m.TrustColumn })),
)
const ComplianceStrip = lazy(() =>
  import('./components/ComplianceStrip').then((m) => ({ default: m.ComplianceStrip })),
)

export function AuthPage() {
  const session = useSession()

  // Already signed in (valid access cookie, or refreshable session): don't
  // show the login form, go straight to the dashboard.
  if (session.data) {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <div className="min-h-screen flex flex-col bg-sla-bg text-sla-on-surface font-sla antialiased">
      <a href="#auth-main" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-60 focus:px-4 focus:py-2 focus:bg-sla-primary-container focus:text-sla-on-primary focus:rounded-sm focus:font-semibold focus:text-sm">
        Skip to content
      </a>

      <AuthHeader />

      <main id="auth-main" className="relative flex-1 flex items-center justify-center px-4 py-8 sm:px-6 sm:py-10 md:px-8 md:py-12 lg:px-12 lg:py-12">
        <GraphBackground gridSize={22} backgroundColor="transparent" fade="bottom" fadeColor="#f8f9ff" />
        <div className="relative auth-container w-full max-w-[1180px] mx-auto grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-10 items-start">
          <Suspense
            fallback={
              <div className="flex flex-col justify-between gap-6 min-w-0 lg:col-span-5" aria-label="Loading highlights">
                <Skeleton className="h-4 w-3/4" />
                <div style={{ display: 'block', height: 8 }} />
                <Skeleton className="h-4 w-3/4" />
              </div>
            }
          >
            <TrustColumn />
          </Suspense>
          <AuthCard />
        </div>
      </main>

      <Suspense fallback={null}>
        <ComplianceStrip />
      </Suspense>
      <AppFooter links={AUTH_FOOTER_LINKS} tagline="CSV-driven SLA observability." />
    </div>
  )
}