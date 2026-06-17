import { G } from './state.js'
import { GAME_DATA } from './data.js'

const SAVE_KEY = 'sanjai_monogatari_save'

// Fields that can't be JSON-serialised directly
const SET_FIELDS = ['unlockedClasses']

export function saveGame() {
  try {
    const snapshot = {}
    for (const [k, v] of Object.entries(G)) {
      if (typeof v === 'function') continue
      if (SET_FIELDS.includes(k)) { snapshot[k] = [...v]; continue }
      snapshot[k] = v
    }
    snapshot._savedAt = Date.now()
    localStorage.setItem(SAVE_KEY, JSON.stringify(snapshot))
    return true
  } catch (e) {
    console.error('Save failed', e)
    return false
  }
}

export function hasSave() {
  return !!localStorage.getItem(SAVE_KEY)
}

export function loadGame() {
  const raw = localStorage.getItem(SAVE_KEY)
  if (!raw) return false
  try {
    const snap = JSON.parse(raw)
    for (const [k, v] of Object.entries(snap)) {
      if (k === '_savedAt') continue
      if (SET_FIELDS.includes(k)) { G[k] = new Set(v); continue }
      G[k] = v
    }
    // Re-init quest entries for any quests added after the save
    GAME_DATA.quests.forEach(q => {
      if (!G.quests[q.id]) G.quests[q.id] = { progress: 0, claimed: false }
    })
    return true
  } catch (e) {
    console.error('Load failed', e)
    return false
  }
}

export function deleteSave() {
  localStorage.removeItem(SAVE_KEY)
}

export function getSaveInfo() {
  const raw = localStorage.getItem(SAVE_KEY)
  if (!raw) return null
  try {
    const snap = JSON.parse(raw)
    const d = new Date(snap._savedAt)
    return {
      day: snap.day,
      gold: snap.gold,
      townLevel: snap.townLevel,
      buildings: snap.buildings?.length ?? 0,
      savedAt: d.toLocaleDateString('zh-TW') + ' ' + d.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' }),
    }
  } catch { return null }
}

// ── Difficulty presets ──
export const DIFFICULTIES = {
  easy: {
    label: '簡單',
    desc: '收入×1.5，攻城間隔延長，怪物較弱',
    goldMult: 1.5,
    siegeInterval: 280,
    monsterAtkMult: 0.7,
    monsterHpMult: 0.7,
  },
  normal: {
    label: '普通',
    desc: '標準設定，原汁原味',
    goldMult: 1,
    siegeInterval: 180,
    monsterAtkMult: 1,
    monsterHpMult: 1,
  },
  hard: {
    label: '困難',
    desc: '收入×0.7，攻城頻繁，怪物強化',
    goldMult: 0.7,
    siegeInterval: 110,
    monsterAtkMult: 1.4,
    monsterHpMult: 1.5,
  },
}

export function applyDifficulty(diffKey) {
  const d = DIFFICULTIES[diffKey] || DIFFICULTIES.normal
  G.difficulty = diffKey
  G.incomeBuff = d.goldMult
  G.siege.interval = d.siegeInterval
  G._monsterAtkMult = d.monsterAtkMult
  G._monsterHpMult = d.monsterHpMult
}
