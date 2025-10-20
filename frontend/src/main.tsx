import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import './i18n/config'
import App from './App.tsx'
import { AuthProvider } from './contexts/AuthContext'
import { TenantBrandingProvider } from './contexts/TenantBrandingContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <TenantBrandingProvider>
          <App />
        </TenantBrandingProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
