/**
 * audio.js — Background music manager
 * Handles day / night / siege track switching with crossfade.
 * All tracks are royalty-free (freepd.com / Kevin MacLeod, CC0/CC-BY).
 */

// ── Track URLs ──────────────────────────────────────────────────────────────
// Replace any URL with your preferred CDN link if one stops working.
const TRACKS = {
  day:    'https://freepd.com/music/Arcane%20Playground.mp3',
  night:  'https://freepd.com/music/Night%20Cave.mp3',
  battle: 'https://freepd.com/music/Compressed%20Danger.mp3',
}

// Fallback: if primary URL fails, try these alternates (same key order)
const TRACKS_FALLBACK = {
  day:    'https://cdn.pixabay.com/audio/2022/11/22/audio_e2a06a4e7e.mp3',
  night:  'https://cdn.pixabay.com/audio/2022/10/13/audio_2f4c8a44f0.mp3',
  battle: 'https://cdn.pixabay.com/audio/2023/02/14/audio_8cdf804da4.mp3',
}

// ── State ───────────────────────────────────────────────────────────────────
let enabled = true
let volume = 0.35
let currentTrackKey = null
let activeAudio = null
let fadingAudio = null
const FADE_MS = 1500

// ── Internal helpers ────────────────────────────────────────────────────────
function createAudio(url, fallbackUrl) {
  const a = new Audio()
  a.loop = true
  a.volume = 0
  a.preload = 'auto'
  a.crossOrigin = 'anonymous'
  a.src = url
  a.onerror = () => {
    if (fallbackUrl && a.src !== fallbackUrl) {
      a.src = fallbackUrl
    }
  }
  return a
}

function fadeTo(audio, targetVol, ms, onDone) {
  const steps = 30
  const interval = ms / steps
  const step = (targetVol - audio.volume) / steps
  let count = 0
  const timer = setInterval(() => {
    count++
    audio.volume = Math.max(0, Math.min(1, audio.volume + step))
    if (count >= steps) {
      clearInterval(timer)
      audio.volume = targetVol
      if (onDone) onDone()
    }
  }, interval)
  return timer
}

// ── Public API ───────────────────────────────────────────────────────────────
export function initAudio() {
  // Pre-create all audio objects so they're ready
  // (actual playback starts on first user interaction to comply with browser autoplay policy)
}

export function setMusicEnabled(on) {
  enabled = on
  if (!on) {
    if (activeAudio) fadeTo(activeAudio, 0, 600, () => { activeAudio?.pause() })
    if (fadingAudio) { fadingAudio.pause(); fadingAudio = null }
  } else if (currentTrackKey) {
    playTrack(currentTrackKey, true)
  }
}

export function setMusicVolume(v) {
  volume = Math.max(0, Math.min(1, v))
  if (activeAudio) activeAudio.volume = volume
}

export function playTrack(key, force = false) {
  if (!enabled) { currentTrackKey = key; return }
  if (key === currentTrackKey && !force) return
  currentTrackKey = key

  const url = TRACKS[key]
  const fallback = TRACKS_FALLBACK[key]
  if (!url) return

  // Fade out current track
  if (activeAudio && !activeAudio.paused) {
    const old = activeAudio
    fadingAudio = old
    fadeTo(old, 0, FADE_MS, () => { old.pause(); old.src = '' })
  }

  // Start new track
  const a = createAudio(url, fallback)
  activeAudio = a
  a.play().catch(() => {
    // Autoplay blocked — will play on next user interaction
    document.addEventListener('click', () => a.play().catch(() => {}), { once: true })
    document.addEventListener('keydown', () => a.play().catch(() => {}), { once: true })
  })
  fadeTo(a, volume, FADE_MS)
}

export function stopAll() {
  if (activeAudio) { fadeTo(activeAudio, 0, 600, () => activeAudio?.pause()) }
  if (fadingAudio) { fadingAudio.pause() }
  currentTrackKey = null
}
