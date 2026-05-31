/**
 * useGameSounds.js
 * Client-side sound effects (Web Audio API) and background music playlist for the game.
 *
 * SFX are synthesized — no files needed.
 * Playlist uses files from public/sounds/track1.mp3, track2.mp3, etc.
 */

import { useEffect, useRef, useCallback } from 'react';

import track1 from './assets/sounds/track1.mp3';
import track2 from './assets/sounds/track2.mp3';
import track3 from './assets/sounds/track3.mp3';

// ── Web Audio context (shared, lazy) ─────────────────────────────────────────
let _audioCtx = null;
function getAudioCtx() {
  if (!_audioCtx) _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (_audioCtx.state === 'suspended') _audioCtx.resume();
  return _audioCtx;
}

// ── Settings sync ────────────────────────────────────────────────────────────
function loadSetting(key, fallback) {
  try {
    const v = localStorage.getItem(key)
    return v === null ? fallback : JSON.parse(v)
  } catch {
    return fallback
  }
}

let globalSfxVolume = loadSetting('sfxVolume', 80) / 100;
let globalSfxMuted = loadSetting('sfxMuted', false);
let globalMusicVolume = loadSetting('musicVolume', 70) / 100;
let globalMusicMuted = loadSetting('musicMuted', false);

// Global BGM ref so we can update volume instantly from settings
let currentBgmAudio = null;

window.addEventListener('audio-settings-changed', (e) => {
  if (!e.detail) return;
  if (e.detail.sfxVolume !== undefined) globalSfxVolume = e.detail.sfxVolume / 100;
  if (e.detail.sfxMuted !== undefined) globalSfxMuted = e.detail.sfxMuted;
  if (e.detail.musicVolume !== undefined) globalMusicVolume = e.detail.musicVolume / 100;
  if (e.detail.musicMuted !== undefined) globalMusicMuted = e.detail.musicMuted;
  
  if (currentBgmAudio) {
    currentBgmAudio.volume = globalMusicMuted ? 0 : globalMusicVolume;
  }
});

function getSfxVol(baseVolume) {
  return globalSfxMuted ? 0 : baseVolume * globalSfxVolume;
}

// ── Synthesized SFX generators ───────────────────────────────────────────────

function playKickSfx(volume = 0.4) {
  const vol = getSfxVol(volume);
  if (vol <= 0) return;
  const ctx = getAudioCtx();
  const t = ctx.currentTime;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(150, t);
  osc.frequency.exponentialRampToValueAtTime(40, t + 0.08);
  gain.gain.setValueAtTime(vol, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
  osc.connect(gain).connect(ctx.destination);
  osc.start(t);
  osc.stop(t + 0.12);
}

function playGoalSfx(volume = 0.6) {
  const vol = getSfxVol(volume);
  if (vol <= 0) return;
  const ctx = getAudioCtx();
  const t = ctx.currentTime;

  const freqs = [523, 659, 784]; // C5, E5, G5
  freqs.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(freq * 0.5, t);
    osc.frequency.exponentialRampToValueAtTime(freq, t + 0.1);
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(vol * 0.5, t + 0.05 + i * 0.04);
    gain.gain.linearRampToValueAtTime(vol * 0.35, t + 0.3);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.8);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t + i * 0.04);
    osc.stop(t + 0.8);
  });

  const bufferSize = ctx.sampleRate * 0.6;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * 0.3;
  const noise = ctx.createBufferSource();
  noise.buffer = buffer;
  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(vol * 0.15, t);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = 2000;
  filter.Q.value = 0.5;
  noise.connect(filter).connect(noiseGain).connect(ctx.destination);
  noise.start(t);
  noise.stop(t + 0.6);
}

function playMatchPointSfx(volume = 0.6) {
  const vol = getSfxVol(volume);
  if (vol <= 0) return;
  const ctx = getAudioCtx();
  const t = ctx.currentTime;

  const notes = [
    { freq: 220, start: 0,    dur: 0.3 },  // A3
    { freq: 330, start: 0.2,  dur: 0.5 },  // E4
    { freq: 440, start: 0.35, dur: 0.6 },  // A4
  ];

  notes.forEach(({ freq, start, dur }) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, t + start);
    gain.gain.linearRampToValueAtTime(vol * 0.35, t + start + 0.05);
    gain.gain.setValueAtTime(vol * 0.35, t + start + dur - 0.1);
    gain.gain.exponentialRampToValueAtTime(0.001, t + start + dur);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t + start);
    osc.stop(t + start + dur);
  });
}

function playVictorySfx(volume = 0.6) {
  const vol = getSfxVol(volume);
  if (vol <= 0) return;
  const ctx = getAudioCtx();
  const t = ctx.currentTime;

  const fanfare = [
    { freq: 523, start: 0,    dur: 0.2 },
    { freq: 659, start: 0.2,  dur: 0.2 },
    { freq: 784, start: 0.4,  dur: 0.2 },
    { freq: 1047, start: 0.6, dur: 0.8 },
  ];

  fanfare.forEach(({ freq, start, dur }) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(vol * 0.3, t + start);
    gain.gain.setValueAtTime(vol * 0.3, t + start + dur * 0.7);
    gain.gain.exponentialRampToValueAtTime(0.001, t + start + dur);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t + start);
    osc.stop(t + start + dur);
  });

  const harmony = [
    { freq: 392, start: 0.6, dur: 0.8 },  // G4
    { freq: 659, start: 0.6, dur: 0.8 },  // E5
  ];
  harmony.forEach(({ freq, start, dur }) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(vol * 0.2, t + start);
    gain.gain.exponentialRampToValueAtTime(0.001, t + start + dur);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t + start);
    osc.stop(t + start + dur);
  });
}

function playConnectedSfx(volume = 0.3) {
  const vol = getSfxVol(volume);
  if (vol <= 0) return;
  const ctx = getAudioCtx();
  const t = ctx.currentTime;

  [880, 1320].forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(vol, t + i * 0.1);
    gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.1 + 0.2);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t + i * 0.1);
    osc.stop(t + i * 0.1 + 0.2);
  });
}

// ── Playlist config ──────────────────────────────────────────────────────────
const PLAYLIST = [
  track1,
  track2,
  track3
];

// ── Hook ─────────────────────────────────────────────────────────────────────
export function useGameSounds(gameState, status) {
  const prevScoreRef = useRef(null);
  const matchPointFiredRef = useRef(false);
  const winnerFiredRef = useRef(false);
  const connectedFiredRef = useRef(false);
  
  const currentTrackIdxRef = useRef(0);
  const isPlayingRef = useRef(false);

  // ── Background music playlist ──────────────────────────────────────────────
  const playNextTrack = useCallback(() => {
    if (currentBgmAudio) {
      currentBgmAudio.pause();
      currentBgmAudio.onended = null;
    }
    const src = PLAYLIST[currentTrackIdxRef.current];
    currentBgmAudio = new Audio(src);
    currentBgmAudio.volume = globalMusicMuted ? 0 : globalMusicVolume;
    
    currentBgmAudio.onended = () => {
      currentTrackIdxRef.current = (currentTrackIdxRef.current + 1) % PLAYLIST.length;
      playNextTrack();
    };
    
    if (isPlayingRef.current) {
      currentBgmAudio.play().catch(() => {});
    }
  }, []);

  useEffect(() => {
    // Init playlist
    playNextTrack();

    const startMusic = () => {
      isPlayingRef.current = true;
      if (currentBgmAudio && currentBgmAudio.paused) {
        currentBgmAudio.play().catch(() => {});
      }
      window.removeEventListener('click', startMusic);
      window.removeEventListener('keydown', startMusic);
    };

    window.addEventListener('click', startMusic);
    window.addEventListener('keydown', startMusic);

    return () => {
      isPlayingRef.current = false;
      if (currentBgmAudio) {
        currentBgmAudio.pause();
        currentBgmAudio.onended = null;
      }
      window.removeEventListener('click', startMusic);
      window.removeEventListener('keydown', startMusic);
    };
  }, [playNextTrack]);

  // ── Connection sound ───────────────────────────────────────────────────────
  useEffect(() => {
    if (status === 'open' && !connectedFiredRef.current) {
      connectedFiredRef.current = true;
      playConnectedSfx(0.3);
    }
  }, [status]);

  // ── Goal scored ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!gameState?.score) return;
    const curr = gameState.score;
    const prev = prevScoreRef.current;

    if (prev && (curr.left !== prev.left || curr.right !== prev.right)) {
      playGoalSfx(0.6);
    }

    prevScoreRef.current = { left: curr.left, right: curr.right };
  }, [gameState?.score?.left, gameState?.score?.right]);

  // ── Match point (score = 4) ────────────────────────────────────────────────
  useEffect(() => {
    if (!gameState?.score) return;
    const isMatchPoint = gameState.score.left === 4 || gameState.score.right === 4;

    if (isMatchPoint && !matchPointFiredRef.current && !gameState.winner) {
      matchPointFiredRef.current = true;
      playMatchPointSfx(0.6);
    }
  }, [gameState?.score?.left, gameState?.score?.right, gameState?.winner]);

  // ── Victory ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (gameState?.winner && !winnerFiredRef.current) {
      winnerFiredRef.current = true;
      if (currentBgmAudio) currentBgmAudio.pause();
      playVictorySfx(0.6);
    }
  }, [gameState?.winner]);

  // ── Kick sound (exposed for external trigger) ──────────────────────────────
  const playKick = useCallback(() => {
    playKickSfx(0.4);
  }, []);

  return { playKick };
}
