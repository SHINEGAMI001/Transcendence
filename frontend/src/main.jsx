/**
 * main.jsx — Application Entry Point
 *
 * PURPOSE:
 * Mounts the React app into the DOM and wraps it with the
 * necessary providers:
 *
 * PROVIDER ORDER (outside → inside):
 * 1. StrictMode — React development checks (remove in production)
 * 2. BrowserRouter — enables client-side routing (react-router-dom)
 * 3. AuthProvider — global auth state (must be inside BrowserRouter
 *    because AuthContext may need to use router hooks in the future)
 * 4. App — the actual route definitions and pages
 */

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { NotificationProvider } from './context/NotificationContext'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <NotificationProvider>
          <App />
        </NotificationProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
// strictMode should be removed in production phase