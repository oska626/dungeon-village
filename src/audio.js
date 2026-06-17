/**
 * audio.js — Procedural 8-bit music via Web Audio API
 * No external files needed. Three tracks: day / night / battle.
 */

// ── Note frequencies (Hz) ────────────────────────────────────────────────────
const NOTE = {
  C3:130.81, D3:146.83, E3:164.81, F3:174.61, G3:196.00, A3:220.00, B3:246.94,
  C4:261.63, D4:293.66, E4:329.63, F4:349.23, G4:392.00, A4:440.00, B4:493.88,
  C5:523.25, D5:587.33, E5:659.25, F5:698.46, G5:783.99, A5:880.00, B5:987.77,
  C6:1046.5,
  Bb3:233.08, Eb4:311.13, Ab4:415.30, Bb4:466.16, Eb5:622.25, Ab5:830.61,
  _: 0, // rest
}

// ── Sequences ────────────────────────────────────────────────────────────────
// Each step: [noteKey, durationBeats]
// BPM and wave type are per-track

const TRACKS = {
  day: {
    bpm: 132,
    wave: 'square',
    // Bright C-major melody (village morning feel)
    melody: [
      ['E4',1],['G4',1],['C5',1],['_',0.5],['B4',0.5],
      ['A4',1],['G4',1],['E4',1],['_',1],
      ['D4',1],['F4',1],['A4',1],['G4',0.5],['F4',0.5],
      ['E4',1],['C4',1],['_',1],['_',1],
      ['G4',1],['A4',1],['B4',1],['C5',1],
      ['A4',1.5],['G4',0.5],['E4',1],['_',1],
      ['F4',1],['G4',0.5],['A4',0.5],['G4',1],['E4',1],
      ['C4',2],['_',2],
    ],
    bass: [
      ['C3',2],['G3',2],['A3',2],['E3',2],
      ['F3',2],['C3',2],['G3',2],['G3',2],
      ['C3',2],['G3',2],['A3',2],['E3',2],
      ['F3',2],['G3',2],['C3',4],
    ],
  },
  night: {
    bpm: 72,
    wave: 'sine',
    // A-minor mysterious melody
    melody: [
      ['A4',2],['_',0.5],['G4',1],['F4',0.5],
      ['E4',2],['_',1],['D4',1],
      ['C4',1],['E4',1],['A4',2],['_',1],
      ['B4',1.5],['A4',0.5],['G4',1],['_',1],
      ['F4',1],['G4',1],['A4',2],['_',1],
      ['E4',1],['D4',1],['C4',2],['_',1],
      ['A3',2],['_',1],['E4',1],['F4',1],
      ['A4',3],['_',2],
    ],
    bass: [
      ['A3',4],['E3',4],
      ['C3',4],['G3',4],
      ['F3',4],['C3',4],
      ['A3',4],['E3',4],
    ],
  },
  battle: {
    bpm: 168,
    wave: 'sawtooth',
    // Fast driving minor riff
    melody: [
      ['A4',0.5],['_',0.5],['A4',0.5],['C5',0.5],['A4',0.5],['G4',0.5],['F4',0.5],['E4',0.5],
      ['A4',0.5],['_',0.5],['A4',0.5],['B4',0.5],['C5',0.5],['_',0.5],['C5',0.5],['B4',0.5],
      ['G4',0.5],['_',0.5],['G4',0.5],['A4',0.5],['Bb4',0.5],['_',0.5],['A4',0.5],['G4',0.5],
      ['E4',1],['_',0.5],['E4',0.5],['F4',0.5],['G4',0.5],['A4',1],
      ['A4',0.5],['_',0.5],['A4',0.5],['C5',0.5],['E5',0.5],['D5',0.5],['C5',0.5],['B4',0.5],
      ['A4',0.5],['G4',0.5],['F4',0.5],['E4',0.5],['D4',0.5],['E4',0.5],['F4',0.5],['G4',0.5],
      ['A4',2],['_',0.5],['G4',0.5],['F4',0.5],['E4',0.5],
      ['A3',2],['_',2],
    ],
    bass: [
      ['A3',0.5],['_',0.5],['A3',0.5],['_',0.5],['A3',0.5],['_',0.5],['G3',0.5],['_',0.5],
      ['A3',0.5],['_',0.5],['A3',0.5],['_',0.5],['C3',0.5],['_',0.5],['C3',0.5],['_',0.5],
      ['G3',0.5],['_',0.5],['G3',0.5],['_',0.5],['Bb3',0.5],['_',0.5],['G3',0.5],['_',0.5],
      ['E3',1],['_',0.5],['E3',0.5],['A3',2],
      ['A3',0.5],['_',0.5],['A3',0.5],['_',0.5],['E3',0.5],['_',0.5],['E3',0.5],['_',0.5],
      ['F3',0.5],['_',0.5],['F3',0.5],['_',0.5],['G3',0.5],['_',0.5],['G3',0.5],['_',0.5],
      ['A3',2],['E3',2],
      ['A3',2],['_',2],
    ],
  },
}

// ── Web Audio state ──────────────────────────────────────────────────────────
let ctx = null
let masterGain = null
let enabled = true
let volume = 0.25
let currentTrackKey = null
let sequencerHandle = null   // { stop() } returned by playSequence
let pendingKey = null        // queued while ctx suspended

function ensureCtx() {
  if (ctx) return
  ctx = new (window.AudioContext || window.webkitAudioContext)()
  masterGain = ctx.createGain()
  masterGain.gain.value = volume
  masterGain.connect(ctx.destination)
}

// ── Sequencer ────────────────────────────────────────────────────────────────
function playSequence(trackDef) {
  ensureCtx()
  const { bpm, wave, melody, bass } = trackDef
  const beat = 60 / bpm  // seconds per beat
  let stopped = false
  let timeouts = []

  function scheduleVoice(steps, gainAmt, detune = 0) {
    let t = ctx.currentTime + 0.05
    const loop = () => {
      if (stopped) return
      let cursor = t
      for (const [key, dur] of steps) {
        const freq = NOTE[key]
        const durSec = dur * beat
        if (freq > 0) {
          const osc = ctx.createOscillator()
          const g = ctx.createGain()
          osc.type = wave
          osc.frequency.value = freq
          osc.detune.value = detune
          g.gain.setValueAtTime(gainAmt, cursor)
          g.gain.exponentialRampToValueAtTime(0.0001, cursor + durSec * 0.85)
          osc.connect(g)
          g.connect(masterGain)
          osc.start(cursor)
          osc.stop(cursor + durSec)
        }
        cursor += durSec
      }
      // Loop: schedule next iteration before this one ends
      const loopDelay = (cursor - ctx.currentTime - 0.1) * 1000
      const h = setTimeout(() => { t = cursor; loop() }, Math.max(0, loopDelay))
      timeouts.push(h)
    }
    loop()
  }

  scheduleVoice(melody, 0.18)
  scheduleVoice(bass, 0.12, -1200)  // bass one octave down via detune cents would be huge, just lower gain

  return {
    stop() {
      stopped = true
      timeouts.forEach(clearTimeout)
    }
  }
}

// ── Fade helpers (master gain) ───────────────────────────────────────────────
function fadeGainTo(targetVol, ms) {
  if (!masterGain) return
  const now = ctx.currentTime
  masterGain.gain.cancelScheduledValues(now)
  masterGain.gain.setValueAtTime(masterGain.gain.value, now)
  masterGain.gain.linearRampToValueAtTime(targetVol, now + ms / 1000)
}

// ── Public API ───────────────────────────────────────────────────────────────
export function initAudio() {
  // Defer ctx creation until user gesture
}

export function setMusicEnabled(on) {
  enabled = on
  if (!on) {
    if (sequencerHandle) {
      fadeGainTo(0, 600)
      setTimeout(() => { sequencerHandle?.stop(); sequencerHandle = null }, 700)
    }
  } else if (currentTrackKey) {
    playTrack(currentTrackKey, true)
  }
}

export function setMusicVolume(v) {
  volume = Math.max(0, Math.min(1, v))
  if (masterGain) masterGain.gain.value = volume
}

export function playTrack(key, force = false) {
  if (!enabled) { currentTrackKey = key; return }
  if (key === currentTrackKey && !force) return
  currentTrackKey = key

  const trackDef = TRACKS[key]
  if (!trackDef) return

  // If AudioContext is suspended (autoplay policy), queue and resume on gesture
  ensureCtx()
  if (ctx.state === 'suspended') {
    pendingKey = key
    const resume = () => {
      ctx.resume().then(() => {
        if (pendingKey) { const k = pendingKey; pendingKey = null; playTrack(k, true) }
      })
    }
    document.addEventListener('click',   resume, { once: true })
    document.addEventListener('keydown', resume, { once: true })
    return
  }

  // Crossfade: fade out old, start new
  if (sequencerHandle) {
    const old = sequencerHandle
    fadeGainTo(0, 800)
    setTimeout(() => { old.stop() }, 900)
  }

  masterGain.gain.cancelScheduledValues(ctx.currentTime)
  masterGain.gain.setValueAtTime(0, ctx.currentTime)
  masterGain.gain.linearRampToValueAtTime(volume, ctx.currentTime + 1.2)

  sequencerHandle = playSequence(trackDef)
}

export function stopAll() {
  if (sequencerHandle) { sequencerHandle.stop(); sequencerHandle = null }
  currentTrackKey = null
}
