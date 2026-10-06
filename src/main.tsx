import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import { StyleProviders } from '@shared/ui/StyleProviders'
import { createQueryClient } from '@shared/ui/api/queryClient'
import './index.css'
import '@shared/ui/css/skin.css'
import '@shared/ui/i18n'
import App from './App.tsx'

const queryClient = createQueryClient()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <StyleProviders>
        <App />
      </StyleProviders>
    </QueryClientProvider>
  </StrictMode>,
)
