import axios from 'axios'

// Centralized API configuration using environment variables with fallbacks
const envOrigin = (import.meta.env.VITE_API_URL || '').trim()
const browserOrigin = typeof window !== 'undefined' && window.location?.origin ? window.location.origin : ''
export const BACKEND_ORIGIN = envOrigin || browserOrigin || 'http://localhost:8000'
export const API_BASE = BACKEND_ORIGIN.endsWith('/') ? BACKEND_ORIGIN : `${BACKEND_ORIGIN}/`

/**
 * Helper to extract CSRF token from document cookies
 */
export function getCsrfToken() {
  const match = document.cookie.match(/(^|;\s*)csrftoken=([^;]*)/)
  return match ? decodeURIComponent(match[2]) : ''
}

// Create a pre-configured axios instance
const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
})

// Interceptor to automatically add CSRF token to POST/PUT/DELETE requests
api.interceptors.request.use((config) => {
  const method = config.method?.toUpperCase()
  if (method && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
    const token = getCsrfToken()
    if (token) {
      config.headers['X-CSRFToken'] = token
    }
  }
  return config
}, (error) => {
  return Promise.reject(error)
})

export default api
