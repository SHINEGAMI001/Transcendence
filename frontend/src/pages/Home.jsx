/**
 * Home.jsx — Landing Page
 *
 * PURPOSE:
 * Public landing page for the app. Shows different navigation
 * options depending on whether the user is logged in or not.
 *
 * CONDITIONAL RENDERING:
 * - Logged out → "Get Started" (register) + "Sign In" (login)
 * - Logged in → "Go to Profile" + "Play Game" (placeholder)
 * - Loading → buttons disabled while auth check is pending
 */

import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function Home() {
  // Read auth state to show contextual navigation
  const { isLoggedIn, loading } = useAuth()

  return (
    <div className="min-h-screen bg-dark-bg flex flex-col items-center justify-center p-4 relative">
      {/* Decorative background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent/5 rounded-full blur-3xl" />
      </div>

      <div className="relative text-center space-y-8">
        {/* Logo / Title */}
        <div>
          <h1 className="text-5xl md:text-7xl font-bold text-text-primary tracking-tight">
            Transcendence
          </h1>
          <p className="text-text-secondary mt-4 text-lg">
            The ultimate Pong arena
          </p>
        </div>

        {/* CTA buttons — change based on login status */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          {loading ? (
            /* Show disabled placeholder buttons while auth check runs */
            <>
              <div className="px-8 py-3.5 bg-dark-surface border border-dark-border text-text-muted font-semibold rounded-lg min-w-[180px] text-center opacity-50">
                Loading...
              </div>
            </>
          ) : isLoggedIn ? (
            /* User is logged in — show profile and game links */
            <>
              <Link
                to="/profile"
                className="px-8 py-3.5 bg-accent hover:bg-accent-light text-white font-semibold rounded-lg transition-all duration-200 hover:shadow-lg hover:shadow-accent/25 active:scale-[0.98] text-center min-w-[180px]"
              >
                My Profile
              </Link>
              <Link
                to="/"
                className="px-8 py-3.5 bg-dark-surface border border-dark-border hover:border-accent/50 text-text-primary font-semibold rounded-lg transition-all duration-200 hover:shadow-lg active:scale-[0.98] text-center min-w-[180px]"
              >
                Play Game
              </Link>
            </>
          ) : (
            /* User is not logged in — show register and login links */
            <>
              <Link
                to="/register"
                className="px-8 py-3.5 bg-accent hover:bg-accent-light text-white font-semibold rounded-lg transition-all duration-200 hover:shadow-lg hover:shadow-accent/25 active:scale-[0.98] text-center min-w-[180px]"
              >
                Get Started
              </Link>
              <Link
                to="/login"
                className="px-8 py-3.5 bg-dark-surface border border-dark-border hover:border-accent/50 text-text-primary font-semibold rounded-lg transition-all duration-200 hover:shadow-lg active:scale-[0.98] text-center min-w-[180px]"
              >
                Sign In
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default Home
