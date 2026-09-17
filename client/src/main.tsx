import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@/shared/styles/globals.css'
import { AppProviders } from '@/app/AppProviders'
import App from '@/app/App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppProviders>
      <App />
    </AppProviders>
  </StrictMode>,
)