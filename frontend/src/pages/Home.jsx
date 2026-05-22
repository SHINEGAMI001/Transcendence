/**
 * Home.jsx — Welcome Page (Pre-Login Landing)
 *
 * PURPOSE:
 * Shows the football stadium welcome screen for unauthenticated users
 * with login/register options. Logged-in users are auto-redirected to /lobby.
 */

import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import welcomeBg from '../assets/Welcome Page for 2D Football Game.png'

function Home() {
  const { isLoggedIn, loading } = useAuth()

  // --- Loading State ---
  if (loading) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  // --- Logged in → redirect to lobby ---
  if (isLoggedIn) {
    return <Navigate to="/lobby" replace />
  }

  // --- Welcome Page (unauthenticated) ---
  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Full-screen background image */}
      <div
        className="fixed inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${welcomeBg})` }}
      />

      {/* Dark overlay for readability */}
      <div className="fixed inset-0 bg-black/40" />

      {/* Spacer to push content to bottom */}
      <div className="flex-1" />

      {/* Bottom content area */}
      <div className="relative z-10 pb-8 px-6 flex flex-col items-center gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
        {/* Login / Sign In buttons side by side */}
        <div className="flex items-center justify-center gap-4">
          <Link
            to="/register"
            className="px-10 py-4 bg-accent hover:bg-accent-light text-white font-black text-lg rounded-2xl transition-all duration-300 hover:shadow-2xl hover:shadow-accent/40 hover:-translate-y-1 active:scale-95 text-center min-w-[180px] tracking-widest backdrop-blur-md"
          >
            REGISTER
          </Link>
          <Link
            to="/login"
            className="px-10 py-4 bg-white/10 border border-white/20 hover:border-accent/50 text-white font-black text-lg rounded-2xl transition-all duration-300 hover:bg-white/15 hover:shadow-xl active:scale-95 text-center min-w-[180px] tracking-widest backdrop-blur-md"
          >
            SIGN IN
          </Link>
        </div>

        {/* Policies notice */}
        <p className="text-white/40 text-[11px] text-center max-w-md leading-relaxed">
          By continuing, you agree to our{' '}
          <span className="underline cursor-pointer hover:text-white/60 transition-colors">Terms of Service</span>{' '}
          and{' '}
          <span className="underline cursor-pointer hover:text-white/60 transition-colors">Privacy Policy</span>.
        </p>
      </div>
    </div>
  )
}

export default Home
