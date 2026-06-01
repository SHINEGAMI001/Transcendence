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

  // Close panel on game input or escape
  useEffect(() => {
    if (!open) return;
    
    const handleKeyDown = (e) => {
      const keys = ['w', 'a', 's', 'd', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ', 'Escape'];
      if (keys.includes(e.key) || keys.includes(e.code)) {
        setOpen(false);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open]);

  return (
    <>
      {/* Floating settings button */}
      <button
        onClick={() => setOpen((o) => !o)}
        title="Settings"
        className="fixed top-5 right-5 z-50 w-12 h-12 rounded-full bg-dark-surface/90 border border-dark-border flex items-center justify-center text-text-primary hover:scale-105 transition-transform"
      >
        {/* Simple Gear Icon */}
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
          <circle cx="12" cy="12" r="3"></circle>
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
        </svg>
      </button>

      {/* Invisible backdrop to close on click outside */}
      {open && (
        <div 
          className="fixed inset-0 z-30" 
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sliding panel */}
      <div
        className={`fixed top-0 right-0 z-40 h-full w-64 bg-dark-surface/95 border-l border-dark-border p-5 transition-transform duration-300 shadow-2xl ${open ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="flex items-center justify-between mb-6 mt-16">
          <h3 className="text-lg font-bold tracking-wider">AUDIO</h3>
        </div>

        <div className="space-y-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="font-semibold text-sm">Sound Effects</p>
              </div>
              <button
                onClick={() => setSfxMuted((m) => !m)}
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs ${sfxMuted ? 'bg-accent/20 text-accent' : 'bg-dark-border text-text-primary'}`}
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
              className="w-full accent-accent"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="font-semibold text-sm">Background Music</p>
              </div>
              <button
                onClick={() => setMusicMuted((m) => !m)}
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs ${musicMuted ? 'bg-accent/20 text-accent' : 'bg-dark-border text-text-primary'}`}
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
              className="w-full accent-accent"
            />
          </div>
        </div>
      </div>
    </>
  )
}
