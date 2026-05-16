/**
 * Search.jsx — Advanced User Search Page (Protected)
 *
 * Searches users via GET /api/users/search/ with:
 * - Username query (q)
 * - Filters: level range, XP range
 * - Sorting: by id, xp, level, wins, losses (asc/desc)
 * - Pagination controls
 *
 * Each result card links to /user/:username (public profile).
 */

import { useState, useEffect } from 'react'
import { useSearchParams, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api, { BACKEND_ORIGIN } from '../api'
import { getAvatarUrl } from '../utils'

const PAGE_SIZE = 10

function Search() {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const { setIsLoggedIn } = useAuth()

  // Search state
  const [query, setQuery] = useState(searchParams.get('q') || '')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [hasSearched, setHasSearched] = useState(false)

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalUsers, setTotalUsers] = useState(0)

  // Filters
  const [showFilters, setShowFilters] = useState(false)
  const [levelMin, setLevelMin] = useState(searchParams.get('level_gt') || '')
  const [levelMax, setLevelMax] = useState(searchParams.get('level_lt') || '')
  const [levelExact, setLevelExact] = useState(searchParams.get('level') || '')
  const [xpMin, setXpMin] = useState(searchParams.get('xp_gt') || '')
  const [xpMax, setXpMax] = useState(searchParams.get('xp_lt') || '')
  const [xpExact, setXpExact] = useState(searchParams.get('xp') || '')

  // Sorting
  const [sortBy, setSortBy] = useState(searchParams.get('order') || '')
  const [sortDesc, setSortDesc] = useState(searchParams.get('desc') === 'true')

  // Trigger search when URL params change
  useEffect(() => {
    const q = searchParams.get('q') || ''
    const page = parseInt(searchParams.get('page') || '1', 10)
    setQuery(q)
    setCurrentPage(page)

    // Sync filter state from URL
    setLevelMin(searchParams.get('level_gt') || '')
    setLevelMax(searchParams.get('level_lt') || '')
    setLevelExact(searchParams.get('level') || '')
    setXpMin(searchParams.get('xp_gt') || '')
    setXpMax(searchParams.get('xp_lt') || '')
    setXpExact(searchParams.get('xp') || '')
    setSortBy(searchParams.get('order') || '')
    setSortDesc(searchParams.get('desc') === 'true')

    // Auto-open filter panel if any filter is active
    if (searchParams.get('level_gt') || searchParams.get('level_lt') || searchParams.get('level') ||
        searchParams.get('xp_gt') || searchParams.get('xp_lt') || searchParams.get('xp') ||
        searchParams.get('order')) {
      setShowFilters(true)
    }

    if (q.trim() || hasAnyFilter(searchParams)) {
      performSearch(searchParams)
    }
  }, [searchParams])

  function hasAnyFilter(params) {
    return params.get('level_gt') || params.get('level_lt') || params.get('level') ||
           params.get('xp_gt') || params.get('xp_lt') || params.get('xp') ||
           params.get('order') || params.get('desc')
  }

  async function performSearch(params) {
    setLoading(true)
    setError('')
    setHasSearched(true)
    try {
      const apiParams = { page_size: PAGE_SIZE }
      // Only include non-empty params
      for (const [key, val] of params.entries()) {
        if (val) apiParams[key] = val
      }
      if (!apiParams.page) apiParams.page = 1

      const response = await api.get('api/users/search/', {
        params: apiParams,
      })
      const data = response.data
      setResults(data['current data'] || [])
      setCurrentPage(data['current page'] || 1)
      setTotalPages(data['number of pages'] || 1)
      setTotalUsers(data['number of users found'] || 0)
    } catch (err) {
      if (err.response?.status === 401) {
        setIsLoggedIn(false)
        navigate('/login', { state: { message: 'Session expired. Please log in again.' } })
        return
      }
      setError('Search failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  function buildParams(page = 1) {
    const params = {}
    if (query.trim()) params.q = query.trim()
    if (page > 1) params.page = String(page)
    if (levelExact) params.level = levelExact
    else {
      if (levelMin) params.level_gt = levelMin
      if (levelMax) params.level_lt = levelMax
    }
    if (xpExact) params.xp = xpExact
    else {
      if (xpMin) params.xp_gt = xpMin
      if (xpMax) params.xp_lt = xpMax
    }
    if (sortBy) params.order = sortBy
    if (sortDesc) params.desc = 'true'
    
    return params
  }

  function handleSubmit(e) {
    e.preventDefault()
    const newParams = buildParams(1)
    const newParamsObj = new URLSearchParams(newParams)
    
    // If exact same params, React Router won't trigger useEffect, so force search
    if (searchParams.toString() === newParamsObj.toString()) {
      performSearch(newParamsObj)
    } else {
      setSearchParams(newParams)
    }
  }

  function goToPage(page) {
    setSearchParams(buildParams(page))
  }

  function handleClearFilters() {
    setLevelMin('')
    setLevelMax('')
    setLevelExact('')
    setXpMin('')
    setXpMax('')
    setXpExact('')
    setSortBy('')
    setSortDesc(false)
    const params = {}
    if (query.trim()) params.q = query.trim()
    setSearchParams(params)
  }

  // Replaced local getAvatarUrl with utils

  // Page number buttons (max 5)
  function getPageNumbers() {
    const pages = []
    let start = Math.max(1, currentPage - 2)
    let end = Math.min(totalPages, currentPage + 2)
    if (end - start < 4) {
      if (start === 1) end = Math.min(totalPages, start + 4)
      else start = Math.max(1, end - 4)
    }
    for (let i = start; i <= end; i++) pages.push(i)
    return pages
  }

  const activeFilterCount = [levelMin, levelMax, levelExact, xpMin, xpMax, xpExact, sortBy, sortDesc ? 'desc' : ''].filter(Boolean).length

  return (
    <div className="min-h-screen bg-dark-bg p-4 md:p-8">
      {/* Background blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 -right-32 w-96 h-96 bg-accent/8 rounded-full blur-3xl" />
        <div className="absolute bottom-20 -left-32 w-96 h-96 bg-accent-light/8 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-3xl mx-auto space-y-4">
        {/* Header + Search Bar */}
        <div className="bg-dark-surface/80 backdrop-blur-xl border border-dark-border rounded-2xl p-6 shadow-2xl shadow-accent-glow/10">
          <div className="flex items-center justify-between mb-5">
            <h1 className="text-2xl font-bold text-text-primary flex items-center gap-3">
              <span className="text-accent">🔍</span> Search Players
            </h1>
            <Link
              to="/"
              className="text-text-muted hover:text-accent transition-colors text-sm font-medium"
            >
              ← Back to Home
            </Link>
          </div>

          <form onSubmit={handleSubmit} className="flex gap-3">
            <input
              id="search-input"
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by username..."
              className="flex-1 px-4 py-3 bg-dark-bg border border-dark-border rounded-xl text-text-primary text-sm placeholder-text-muted focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/25 transition-all"
              autoFocus
            />
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-3 rounded-xl border text-sm font-semibold transition-all cursor-pointer flex items-center gap-2 ${
                showFilters || activeFilterCount > 0
                  ? 'bg-accent/15 border-accent/40 text-accent'
                  : 'bg-dark-bg border-dark-border text-text-muted hover:border-accent/30 hover:text-text-secondary'
              }`}
            >
              ⚙ Filters
              {activeFilterCount > 0 && (
                <span className="bg-accent text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>
            <button
              id="search-button"
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-accent hover:bg-accent-light text-white font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shrink-0"
            >
              {loading ? (
                <span className="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                'Search'
              )}
            </button>
          </form>

          {/* Result count */}
          {totalUsers > 0 && !loading && hasSearched && (
            <p className="text-text-muted text-xs mt-3">
              Found <span className="text-text-secondary font-semibold">{totalUsers}</span> player{totalUsers !== 1 ? 's' : ''}
              {searchParams.get('q') && <> matching "<span className="text-accent">{searchParams.get('q')}</span>"</>}
            </p>
          )}
        </div>

        {/* ========================================
            FILTER PANEL — Collapsible
            Level range, XP range, Sort by
            ======================================== */}
        {showFilters && (
          <div className="bg-dark-surface/80 backdrop-blur-xl border border-accent/20 rounded-2xl p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider flex items-center gap-2">
                <span className="text-accent">⚙</span> Search Filters
              </h3>
              {activeFilterCount > 0 && (
                <button
                  onClick={handleClearFilters}
                  className="text-xs text-text-muted hover:text-error transition-colors cursor-pointer"
                >
                  ✕ Clear all
                </button>
              )}
            </div>

            <div className="space-y-6">
              {/* Level Filter */}
              <div className="space-y-2 pb-4 border-b border-dark-border/50">
                <label className="text-xs font-bold text-text-primary uppercase tracking-wider">Level</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="text-[10px] text-text-muted uppercase mb-1 block">Exact Level</span>
                    <input
                      type="number"
                      min="0"
                      value={levelExact}
                      onChange={(e) => { setLevelExact(e.target.value); setLevelMin(''); setLevelMax('') }}
                      placeholder="e.g. 10"
                      className="w-full px-4 py-2.5 bg-dark-bg border border-dark-border rounded-lg text-text-primary text-sm placeholder-text-muted focus:outline-none focus:border-accent/50 transition-all"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-text-muted uppercase mb-1 block">Or Range</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        value={levelMin}
                        onChange={(e) => { setLevelMin(e.target.value); setLevelExact('') }}
                        placeholder="Min"
                        className="w-full px-4 py-2.5 bg-dark-bg border border-dark-border rounded-lg text-text-primary text-sm placeholder-text-muted focus:outline-none focus:border-accent/50 transition-all"
                      />
                      <span className="text-text-muted">—</span>
                      <input
                        type="number"
                        min="0"
                        value={levelMax}
                        onChange={(e) => { setLevelMax(e.target.value); setLevelExact('') }}
                        placeholder="Max"
                        className="w-full px-4 py-2.5 bg-dark-bg border border-dark-border rounded-lg text-text-primary text-sm placeholder-text-muted focus:outline-none focus:border-accent/50 transition-all"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* XP Filter */}
              <div className="space-y-2 pb-4 border-b border-dark-border/50">
                <label className="text-xs font-bold text-text-primary uppercase tracking-wider">Experience (XP)</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="text-[10px] text-text-muted uppercase mb-1 block">Exact XP</span>
                    <input
                      type="number"
                      min="0"
                      value={xpExact}
                      onChange={(e) => { setXpExact(e.target.value); setXpMin(''); setXpMax('') }}
                      placeholder="e.g. 1000"
                      className="w-full px-4 py-2.5 bg-dark-bg border border-dark-border rounded-lg text-text-primary text-sm placeholder-text-muted focus:outline-none focus:border-accent/50 transition-all"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-text-muted uppercase mb-1 block">Or Range</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        value={xpMin}
                        onChange={(e) => { setXpMin(e.target.value); setXpExact('') }}
                        placeholder="Min"
                        className="w-full px-4 py-2.5 bg-dark-bg border border-dark-border rounded-lg text-text-primary text-sm placeholder-text-muted focus:outline-none focus:border-accent/50 transition-all"
                      />
                      <span className="text-text-muted">—</span>
                      <input
                        type="number"
                        min="0"
                        value={xpMax}
                        onChange={(e) => { setXpMax(e.target.value); setXpExact('') }}
                        placeholder="Max"
                        className="w-full px-4 py-2.5 bg-dark-bg border border-dark-border rounded-lg text-text-primary text-sm placeholder-text-muted focus:outline-none focus:border-accent/50 transition-all"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Sort By */}
              <div className="space-y-2 max-w-sm">
                <label className="text-xs font-bold text-text-primary uppercase tracking-wider">Sort Results</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full px-4 py-2.5 bg-dark-bg border border-dark-border rounded-lg text-text-primary text-sm focus:outline-none focus:border-accent/50 transition-all cursor-pointer"
                  >
                    <option value="">Default (ID)</option>
                    <option value="level">Level</option>
                    <option value="xp">XP</option>
                    <option value="wins">Wins</option>
                    <option value="losses">Losses</option>
                  </select>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setSortDesc(false)}
                      className={`flex-1 py-2.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                        !sortDesc
                          ? 'bg-accent/15 border-accent/40 text-accent'
                          : 'bg-dark-bg border-dark-border text-text-muted hover:border-accent/30'
                      }`}
                    >
                      Asc
                    </button>
                    <button
                      type="button"
                      onClick={() => setSortDesc(true)}
                      className={`flex-1 py-2.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                        sortDesc
                          ? 'bg-accent/15 border-accent/40 text-accent'
                          : 'bg-dark-bg border-dark-border text-text-muted hover:border-accent/30'
                      }`}
                    >
                      Desc
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-dark-surface/80 backdrop-blur-xl border border-red-500/30 rounded-2xl p-6 text-center">
            <p className="text-error mb-3">{error}</p>
            <button
              onClick={() => performSearch(searchParams)}
              className="px-5 py-2 bg-accent hover:bg-accent-light text-white font-semibold rounded-lg transition-all cursor-pointer"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center py-16">
            <div className="flex flex-col items-center gap-4">
              <div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin" />
              <p className="text-text-muted text-sm">Searching players...</p>
            </div>
          </div>
        )}

        {/* No Results */}
        {!loading && !error && hasSearched && results.length === 0 && (
          <div className="bg-dark-surface/80 backdrop-blur-xl border border-dark-border rounded-2xl p-12 text-center">
            <p className="text-4xl mb-4">🏓</p>
            <p className="text-text-primary font-semibold text-lg mb-1">No players found</p>
            <p className="text-text-muted text-sm">Try a different username or adjust your filters</p>
          </div>
        )}

        {/* Results Grid */}
        {!loading && results.length > 0 && (
          <div className="grid gap-3">
            {results.map((user) => (
              <Link
                key={user.id}
                to={`/user/${user.username}`}
                id={`user-card-${user.id}`}
                className="group bg-dark-surface/80 backdrop-blur-xl border border-dark-border hover:border-accent/40 rounded-xl p-4 flex items-center gap-4 transition-all duration-200 hover:shadow-lg hover:shadow-accent/5"
              >
                {/* Avatar */}
                <div className="w-14 h-14 rounded-full border-2 border-accent/30 group-hover:border-accent/60 overflow-hidden shrink-0 flex items-center justify-center bg-accent/10 transition-all">
                  {getAvatarUrl(user.avatar) ? (
                    <img src={getAvatarUrl(user.avatar)} alt={user.username} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xl font-bold text-accent">{user.username?.charAt(0).toUpperCase()}</span>
                  )}
                </div>

                {/* User info */}
                <div className="flex-1 min-w-0">
                  <p className="text-text-primary font-semibold text-base group-hover:text-accent transition-colors truncate">
                    {user.username}
                  </p>
                  <p className="text-text-muted text-xs">Player #{user.id}</p>
                </div>

                {/* Win/Loss stats */}
                <div className="flex items-center gap-4 text-sm shrink-0">
                  <div className="text-center">
                    <p className="text-success font-bold">{user.wins}</p>
                    <p className="text-text-muted text-[10px] uppercase tracking-wider">W</p>
                  </div>
                  <div className="text-center">
                    <p className="text-error font-bold">{user.losses}</p>
                    <p className="text-text-muted text-[10px] uppercase tracking-wider">L</p>
                  </div>
                </div>

                <span className="text-text-muted group-hover:text-accent transition-colors text-lg">›</span>
              </Link>
            ))}
          </div>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-2 pb-6">
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage <= 1}
              className="px-3 py-2 text-sm font-medium rounded-lg border border-dark-border text-text-secondary hover:border-accent/40 hover:text-accent transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            >
              ← Prev
            </button>
            {getPageNumbers().map((page) => (
              <button
                key={page}
                onClick={() => goToPage(page)}
                className={`w-10 h-10 text-sm font-semibold rounded-lg border transition-all cursor-pointer ${
                  page === currentPage
                    ? 'bg-accent border-accent text-white shadow-lg shadow-accent/30'
                    : 'border-dark-border text-text-secondary hover:border-accent/40 hover:text-accent'
                }`}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className="px-3 py-2 text-sm font-medium rounded-lg border border-dark-border text-text-secondary hover:border-accent/40 hover:text-accent transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            >
              Next →
            </button>
          </div>
        )}

        {/* Empty state — no search yet */}
        {!hasSearched && !loading && (
          <div className="bg-dark-surface/80 backdrop-blur-xl border border-dark-border rounded-2xl p-12 text-center">
            <p className="text-4xl mb-4">🎮</p>
            <p className="text-text-primary font-semibold text-lg mb-1">Find your opponent</p>
            <p className="text-text-muted text-sm">Type a username above and press Search, or use filters to browse</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default Search
