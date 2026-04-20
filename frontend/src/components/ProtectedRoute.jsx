/**
 * ProtectedRoute.jsx — Route Guard Component
 *
 * PURPOSE:
 * Prevents unauthorized users from accessing protected pages (like /profile).
 * Wraps around routes in App.jsx using React Router's <Outlet />.
 *
 * HOW IT WORKS:
 * 1. Reads { isLoggedIn, loading } from AuthContext
 * 2. If loading is true → shows a spinner (the initial session check
 *    in AuthContext hasn't finished yet — prevents flashing login page)
 * 3. If not logged in → redirects to /login via <Navigate />
 * 4. If logged in → renders <Outlet /> which shows the child route
 *
 * USAGE IN App.jsx:
 *   <Route element={<ProtectedRoute />}>
 *     <Route path="/profile" element={<Profile />} />
 *     <!-- more protected routes go here later -->
 *   </Route>
 */

import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function ProtectedRoute() {
  const { isLoggedIn, loading } = useAuth()

  // Still checking session — show a loading spinner
  // This prevents the login page from flashing for a split second
  // before the session check completes
  if (loading) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          {/* Spinning loader */}
          <svg
            className="animate-spin h-10 w-10 text-accent"
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          <p className="text-text-secondary text-sm">Verifying session...</p>
        </div>
      </div>
    )
  }

  // Not authenticated — redirect to login page
  // replace: true replaces the current history entry so user
  // can't press "back" to return to the protected page
  if (!isLoggedIn) {
    return <Navigate to="/login" replace />
  }

  // Authenticated — render the protected child route
  return <Outlet />
}

export default ProtectedRoute
