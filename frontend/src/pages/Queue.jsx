/**
 * Queue.jsx — Matchmaking Queue Page
 *
 * PURPOSE:
 * Shows the user while they are waiting in the matchmaking queue.
 */

import { Link } from 'react-router-dom'

function Queue() {
  return (
    <div className="min-h-screen bg-dark-bg flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative background blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-accent/10 rounded-full blur-[120px] animate-pulse" />
      </div>

      <div className="relative z-10 text-center space-y-8 max-w-md w-full">
        <div className="space-y-4">
          <div className="relative w-24 h-24 mx-auto">
            <div className="absolute inset-0 border-4 border-accent/20 rounded-full" />
            <div className="absolute inset-0 border-4 border-accent border-t-transparent rounded-full animate-spin" />
            <div className="absolute inset-4 bg-accent/20 rounded-full flex items-center justify-center">
              <span className="text-2xl">⏳</span>
            </div>
          </div>
          <h1 className="text-4xl font-bold text-text-primary tracking-tight">
            In Queue
          </h1>
          <p className="text-text-secondary text-lg">
            Finding worthy opponents...
          </p>
        </div>

        <div className="bg-dark-surface/50 border border-dark-border rounded-2xl p-6 backdrop-blur-md">
          <div className="flex justify-between items-center text-sm mb-4">
            <span className="text-text-muted italic">Time Elapsed</span>
            <span className="text-accent font-mono font-bold text-lg">00:42</span>
          </div>
          <div className="space-y-3">
            <div className="h-1.5 w-full bg-dark-border rounded-full overflow-hidden">
              <div className="h-full bg-accent w-1/3 animate-[loading_2s_ease-in-out_infinite]" />
            </div>
            <p className="text-xs text-text-muted">Estimated wait: ~1:30</p>
          </div>
        </div>

        <Link
          to="/"
          className="inline-block px-8 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 font-semibold rounded-xl transition-all duration-200 active:scale-95"
        >
          Cancel Matchmaking
        </Link>
      </div>
    </div>
  )
}

export default Queue
