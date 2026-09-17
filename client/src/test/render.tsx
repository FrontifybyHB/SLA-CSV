import { render } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import type { ReactElement } from 'react'
import { createQueryClient } from '@/app/query-client'

export function renderWithProviders(ui: ReactElement) {
  const queryClient = createQueryClient()
  return render(
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
    </BrowserRouter>
  )
}