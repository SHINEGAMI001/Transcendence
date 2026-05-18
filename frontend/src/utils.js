import { BACKEND_ORIGIN } from './api'

/**
 * Builds a full avatar URL from a backend relative path
 * @param {string} avatarPath 
 * @param {number} [cacheBuster] 
 */
export function getAvatarUrl(avatarPath, cacheBuster = 0) {
  if (!avatarPath) return null
  if (avatarPath.startsWith('http')) return `${avatarPath}${cacheBuster ? `?t=${cacheBuster}` : ''}`
  return `${BACKEND_ORIGIN}${avatarPath}${cacheBuster ? `?t=${cacheBuster}` : ''}`
}

/**
 * Formats an ISO date string to a readable format
 * @param {string} dateString 
 */
export function formatDate(dateString) {
  if (!dateString) return 'Never'
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch (e) {
    return 'Invalid Date'
  }
}
