/**
 * AvatarUploader.jsx — Avatar Upload Component
 *
 * PURPOSE:
 * Allows users to select, preview, validate (type & size), and upload
 * an avatar image via PUT /api/avatar/update with multipart/form-data.
 *
 * PROPS:
 * - currentAvatar (string): URL of the current avatar (for display)
 * - onUploadSuccess (function): callback after successful upload
 */

import { useState, useRef } from 'react'
import axios from 'axios'

const API_BASE = 'http://localhost:8000/'
const MAX_FILE_SIZE = 7 * 1024 * 1024 // 7MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']

function AvatarUploader({ currentAvatar, onUploadSuccess }) {
  const fileInputRef = useRef(null)
  const [preview, setPreview] = useState(null)
  const [selectedFile, setSelectedFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

  function handleFileSelect(e) {
    const file = e.target.files?.[0]
    if (!file) return

    if (!ALLOWED_TYPES.includes(file.type)) {
      setMessage({
        type: 'error',
        text: 'Invalid file type. Please select JPEG, PNG, GIF, or WebP.',
      })
      return
    }

    if (file.size > MAX_FILE_SIZE) {
      setMessage({
        type: 'error',
        text: `File too large. Maximum size is 7MB. (Your file: ${(file.size / 1024 / 1024).toFixed(1)}MB)`,
      })
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      setPreview(event.target.result)
      setSelectedFile(file)
      setMessage({ type: '', text: '' })
    }
    reader.readAsDataURL(file)
  }

  async function handleUpload() {
    if (!selectedFile) return

    setUploading(true)
    setMessage({ type: '', text: '' })

    try {
      const formData = new FormData()
      formData.append('avatar', selectedFile)

      // Read CSRF token from cookie (Django default 'csrftoken')
      const getCookie = (name) => {
        const match = document.cookie.match(new RegExp('(^|;\\s*)' + name + '=([^;]*)'))
        return match ? decodeURIComponent(match[2]) : null
      }
      const csrfToken = getCookie('csrftoken') || getCookie('csrf') || null

      await axios.put(`${API_BASE}api/avatar/update`, formData, {
        withCredentials: true,
        headers: {
          'X-CSRFToken': csrfToken,
          'X-Requested-With': 'XMLHttpRequest',
        },
      })

      setMessage({ type: 'success', text: 'Avatar uploaded successfully!' })
      setPreview(null)
      setSelectedFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ''

      onUploadSuccess?.()
      setTimeout(() => setMessage({ type: '', text: '' }), 3000)
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.response?.data?.detail || 'Upload failed. Please try again.'
      setMessage({ type: 'error', text: errorMsg })
    } finally {
      setUploading(false)
    }
  }

  function handleCancel() {
    setPreview(null)
    setSelectedFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
    setMessage({ type: '', text: '' })
  }

  return (
    <div className="flex flex-col gap-4 w-full max-w-xs">
      <div className="border-2 border-dashed border-accent/40 hover:border-accent/60 rounded-lg p-4 text-center transition-colors cursor-pointer bg-accent/5">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          disabled={uploading}
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="text-accent hover:text-accent-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="text-2xl mb-1">📷</div>
          <p className="font-medium text-sm">{selectedFile ? 'Change Image' : (currentAvatar ? 'Replace Avatar' : 'Choose Image')}</p>
          <p className="text-xs text-text-muted mt-1">JPEG, PNG, GIF, or WebP (max 7MB)</p>
        </button>
      </div>

      {preview && (
        <div className="flex flex-col gap-3">
          <div className="relative w-24 h-24 mx-auto rounded-lg overflow-hidden border border-accent/30">
            <img src={preview} alt="Preview" className="w-full h-full object-cover" />
          </div>

          <div className="flex gap-2 justify-center">
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="px-3 py-2 bg-accent hover:bg-accent-light text-white font-semibold rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {uploading ? (
                <>
                  <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Uploading...
                </>
              ) : (
                '↑ Upload'
              )}
            </button>
            <button
              onClick={handleCancel}
              disabled={uploading}
              className="px-3 py-2 bg-dark-border text-text-primary hover:bg-dark-border/80 font-semibold rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {message.text && (
        <div className={`p-3 rounded-lg text-sm font-medium ${message.type === 'success' ? 'bg-success/20 text-success border border-success/30' : 'bg-error/20 text-error border border-error/30'}`}>
          {message.type === 'success' ? '✓ ' : '✕ '}
          {message.text}
        </div>
      )}
    </div>
  )
}

export default AvatarUploader
