import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Routes, Route, useLocation } from 'react-router-dom'
import { Spinner } from '@/shared/ui/Spinner'
import { RequireAuth } from '@/features/auth'
import { NotFound } from '@/pages/error/NotFound'

const LazyHome = lazy(() =>
  import('@/pages/home').then((m) => ({ default: m.SlaMonitorPage })),
)
const LazyDataset = lazy(() =>
  import('@/pages/dashboard/DashboardPage').then((m) => ({ default: m.DashboardPage })),
)
const LazyOverview = lazy(() =>
  import('@/pages/dashboard/overview/OverviewPage').then((m) => ({ default: m.OverviewPage })),
)
const LazyBreaches = lazy(() =>
  import('@/pages/dashboard/breaches/BreachLogsPage').then((m) => ({ default: m.BreachLogsPage })),
)
const LazyAuth = lazy(() =>
  import('@/pages/auth').then((m) => ({ default: m.AuthPage })),
)
const LazyEngineering = lazy(() =>
  import('@/pages/engineering').then((m) => ({ default: m.EngineeringOverviewPage })),
)

function Fallback() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
      <Spinner />
    </div>
  )
}

/**
 * Legacy alias: /dashboard/overview moved to /dashboard.
 * Preserves the query string (e.g. ?dataset=…) across the redirect.
 */
function OverviewRedirect() {
  const { search } = useLocation()
  return <Navigate to={{ pathname: '/dashboard', search }} replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<Fallback />}>
        <Routes>
          <Route path="/" element={<LazyHome />} />
          <Route path="/engineering" element={<LazyEngineering />} />
          <Route
            path="/dashboard"
            element={
              <RequireAuth>
                <LazyOverview />
              </RequireAuth>
            }
          />
          <Route
            path="/dashboard/dataset"
            element={
              <RequireAuth>
                <LazyDataset />
              </RequireAuth>
            }
          />
          <Route path="/dashboard/overview" element={<OverviewRedirect />} />
          <Route
            path="/dashboard/breaches"
            element={
              <RequireAuth>
                <LazyBreaches />
              </RequireAuth>
            }
          />
          <Route path="/login" element={<LazyAuth />} />
          <Route path="/register" element={<LazyAuth />} />
          <Route path="/auth" element={<LazyAuth />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}