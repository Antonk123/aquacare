import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { initThemeBeforeMount } from './hooks/useTheme'
import './index.css'

// Apply persisted theme before React renders to avoid a flash of light mode
initThemeBeforeMount()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
