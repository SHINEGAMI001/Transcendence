import { useEffect, useState } from 'react'

function loadSetting(key, fallback) {
  try {
    const v = localStorage.getItem(key)
    return v === null ? fallback : JSON.parse(v)
  } catch {
    return fallback
  }
}

function saveSetting(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {}
}

function dispatchChange(detail) {
  try {
    window.dispatchEvent(new CustomEvent('audio-settings-changed', { detail }))
  } catch {}
}

export default function SettingsPanel() {
  const [open, setOpen] = useState(false)
  const [sfxVolume, setSfxVolume] = useState(() => loadSetting('sfxVolume', 80))
  const [musicVolume, setMusicVolume] = useState(() => loadSetting('musicVolume', 70))
  const [sfxMuted, setSfxMuted] = useState(() => loadSetting('sfxMuted', false))
  const [musicMuted, setMusicMuted] = useState(() => loadSetting('musicMuted', false))

  // persist and broadcast when any setting changes
  useEffect(() => {
    saveSetting('sfxVolume', sfxVolume)
    saveSetting('musicVolume', musicVolume)
    saveSetting('sfxMuted', sfxMuted)
    saveSetting('musicMuted', musicMuted)
    dispatchChange({ sfxVolume, musicVolume, sfxMuted, musicMuted })
  }, [sfxVolume, musicVolume, sfxMuted, musicMuted])

  return (
    <>
      {/* Floating settings button */}
      <button
        onClick={() => setOpen((o) => !o)}
        title="Settings"
        className="fixed top-5 right-5 z-50 w-12 h-12 rounded-full bg-dark-surface/90 border border-dark-border flex items-center justify-center text-text-primary hover:scale-105 transition-transform"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-5 h-5">
          <path fill="currentColor" d="M12 8a4 4 0 100 8 4 4 0 000-8zm8.94 3a1 1 0 00-.11-.3l-1.3-2.25a1 1 0 00-.9-.52h-1.6a7.8 7.8 0 00-.46-1.05l.9-1.46a1 1 0 00-.12-1.2L15.9 1.7a1 1 0 00-1.24-.3l-1.6.78a7.8 7.8 0 00-1.2-.7L10 0H8l-.9 1.2c-.42.21-.82.45-1.2.7L4.3 1.2A1 1 0 003.06 1.5L1.9 3.4a1 1 0 00-.12 1.2l.9 1.46c-.17.35-.3.72-.4 1.1H1.6a1 1 0 00-.9.52L-.3 12.7a1 1 0 00.11.3l1.3 2.25a1 1 0 00.9.52h1.6c.1.38.23.75.4 1.1l-.9 1.46a1 1 0 00.12 1.2l1.16 1.9a1 1 0 001.24.3l1.6-.78c.38.25.78.49 1.2.7L8 24h2l.9-1.2c.42-.21.82-.45 1.2-.7l1.6.78a1 1 0 001.24-.3l1.16-1.9a1 1 0 00-.12-1.2l-.9-1.46c.17-.35.3-.72.46-1.05h1.6a1 1 0 00.9-.52l1.3-2.25a1 1 0 00.11-.3z" />
        </svg>
      </button>

      {/* Sliding panel */}
      <div
        className={`fixed top-0 right-0 z-40 h-full w-80 bg-dark-surface/95 border-l border-dark-border p-6 transition-transform duration-300 ${open ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">Settings</h3>
          <button onClick={() => setOpen(false)} className="text-text-muted">✕</button>
        </div>

        <div className="space-y-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="font-semibold">Sound Effects</p>
                <p className="text-xs text-text-muted">In-game SFX volume</p>
              </div>
              <button
                onClick={() => setSfxMuted((m) => !m)}
                className={`w-8 h-8 rounded-full flex items-center justify-center ${sfxMuted ? 'bg-accent/20 text-accent' : 'bg-dark-border text-text-primary'}`}
                title={sfxMuted ? 'Unmute SFX' : 'Mute SFX'}
              >
                {sfxMuted ? '🔇' : '🔊'}
              </button>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={sfxMuted ? 0 : sfxVolume}
              onChange={(e) => { setSfxVolume(Number(e.target.value)); if (sfxMuted && Number(e.target.value) > 0) setSfxMuted(false) }}
              className="w-full"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="font-semibold">Music</p>
                <p className="text-xs text-text-muted">Background music volume</p>
              </div>
              <button
                onClick={() => setMusicMuted((m) => !m)}
                className={`w-8 h-8 rounded-full flex items-center justify-center ${musicMuted ? 'bg-accent/20 text-accent' : 'bg-dark-border text-text-primary'}`}
                title={musicMuted ? 'Unmute Music' : 'Mute Music'}
              >
                {musicMuted ? '🔈' : '🎵'}
              </button>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={musicMuted ? 0 : musicVolume}
              onChange={(e) => { setMusicVolume(Number(e.target.value)); if (musicMuted && Number(e.target.value) > 0) setMusicMuted(false) }}
              className="w-full"
            />
          </div>

          <div className="pt-4 border-t border-dark-border">
            <p className="text-xs text-text-muted">Settings are saved locally in your browser.</p>
          </div>
        </div>
      </div>
    </>
  )
}
