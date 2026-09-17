import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Spinner } from '@/shared/ui/Spinner'
import { RequireAuth } from '@/features/auth'
import { NotFound } from '@/pages/error/NotFound'

const LazyHome = lazy(() =>
  import('@/pages/home').then((m) => ({ default: m.SlaMonitorPage })),
)
const LazyDashboard = lazy(() =>
  import('@/pages/dashboard/DashboardPage').then((m) => ({ default: m.DashboardPage })),
)
const LazyAuth = lazy(() =>
  import('@/pages/auth').then((m) => ({ default: m.AuthPage })),
)

function Fallback() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
      <Spinner />
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<Fallback />}>
        <Routes>
          <Route path="/" element={<LazyHome />} />
          <Route
            path="/dashboard"
            element={
              <RequireAuth>
                <LazyDashboard />
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