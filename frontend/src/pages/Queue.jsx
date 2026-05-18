/**
 * Queue.jsx — Placeholder
 *
 * Matchmaking queue has been removed. This page is no longer in use.
 * Kept as an empty placeholder for potential future room-waiting logic.
 */

import { Link } from 'react-router-dom'

function Queue() {
  return (
    <div className="min-h-screen bg-dark-bg flex flex-col items-center justify-center p-4">
      <div className="text-center space-y-4">
        <p className="text-4xl">🚧</p>
        <h1 className="text-2xl font-bold text-text-primary">Page Not Available</h1>
        <p className="text-text-secondary">This feature has been removed.</p>
        <Link
          to="/lobby"
          className="inline-block px-8 py-3 bg-accent hover:bg-accent-light text-white font-semibold rounded-xl transition-all"
        >
          Back to Lobby
        </Link>
      </div>
    </div>
  )
}

export default Queue
