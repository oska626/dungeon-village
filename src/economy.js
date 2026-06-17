import { G } from './state.js'
import { GAME_DATA } from './data.js'
import { gridToScreen } from './render.js'
import { addLog, updateQuestProgress } from './ui.js'
import { applyResidentBonuses, createAdventurer } from './fsm.js'
import { playTrack } from './audio.js'

export function updateTopBar() {
  document.getElementById('gold-val').textContent = Math.floor(G.gold)
  document.getElementById('pop-val').textContent = Math.floor(G.popularity)
  document.getElementById('sat-val').textContent = Math.floor(G.satisfaction)
  document.getElementById('adv-count-val').textContent = G.adventurers.length
  document.getElementById('adv-max-val').textContent = G.maxAdventurers
  document.getElementById('res-count-val').textContent = G.residents.length
}

export function updateResourceDisplay() {
  const el = document.getElementById('res-stockpile')
  if (el) el.textContent = `🪵${G.globalResources.wood || 0} 🪨${G.globalResources.stone || 0} ⛏️${G.globalResources.iron || 0} 💧${G.globalResources.water || 0} 💎${G.globalResources.crystal || 0}`
}

export function updateStars() {
  for (let i = 1; i <= 5; i++) document.getElementById('s' + i).classList.toggle('lit', i <= G.townLevel)
}

export function depositToTown(amount, src) {
  const real = amount * G.incomeBuff
  G.gold += real; G.townExp += real * 0.04; G.stats.totalGold += real
  updateTopBar(); checkTownLevelUp()
}

export function checkTownLevelUp() {
  if (G.townExp >= G.townExpNeeded) {
    G.townExp -= G.townExpNeeded; G.townLevel++
    G.townExpNeeded = Math.floor(G.townExpNeeded * 1.75)
    showLevelUpOverlay(); updateStars(); applyResidentBonuses()
    addLog(`🏆 村莊升至 ${G.townLevel}星！`, 'level')
    updateQuestProgress()
  }
}

export function showLevelUpOverlay() {
  G.gold += 300
  document.getElementById('lu-msg').textContent = `村莊達到 ${G.townLevel} 星！解鎖新冒險者上限！`
  document.getElementById('lu-rewards').innerHTML = [
    { rv: '+300💰', rl: '獎勵金幣' }, { rv: `${G.townLevel}★`, rl: '新星級' }, { rv: `+${G.townLevel * 2}🧙`, rl: '冒險者上限' }
  ].map(r => `<div class="lu-reward"><div class="rv">${r.rv}</div><div class="rl">${r.rl}</div></div>`).join('')
  const ov = document.getElementById('level-up-overlay'); ov.classList.add('show')
  const box = document.getElementById('level-up-box'); box.classList.remove('flash'); void box.offsetWidth; box.classList.add('flash')
}

export function closeLevelUp() { document.getElementById('level-up-overlay').classList.remove('show') }

// Phase thresholds: 4 equal phases × 1 min each = 4 min/day
const PHASE_NAMES = ['dawn', 'day', 'dusk', 'night']
function calcPhase(t) {
  if (t < 0.25) return 'dawn'
  if (t < 0.50) return 'day'
  if (t < 0.75) return 'dusk'
  return 'night'
}

export function tickEconomy(dt) {
  G.dayTick += dt * G.speed
  // Update timeOfDay (0–1 fraction)
  const dayDuration = G.dayLength / G.speed
  G.timeOfDay = (G.dayTick % dayDuration) / dayDuration
  const newPhase = calcPhase(G.timeOfDay)
  if (newPhase !== G.dayPhase) {
    G.dayPhase = newPhase
    const phaseLabels = { dawn: '🌅 清晨', day: '☀️ 白天', dusk: '🌇 黃昏', night: '🌙 深夜' }
    addLog(phaseLabels[newPhase] + ' 來臨', newPhase === 'night' ? 'combat' : '')
    // Switch BGM track based on phase (siege overrides this in systems.js)
    if (!G.siege.active) {
      playTrack(newPhase === 'night' ? 'night' : 'day')
    }
  }
  G.buildings.forEach(b => {
    if (b.constructing) return  // no income while building
    const d = GAME_DATA.buildings.find(x => x.id === b.id); if (!d) return
    const innkeeperBonus = G.residents.filter(r => r.residentJob?.id === 'innkeeper' && b.id === 'inn').length * 0.3
    const income = d.baseIncome * (1 + (b.level - 1) * 0.5) * (1 + innkeeperBonus) * G.incomeBuff * dt * G.speed * 0.1
    G.gold += income; G.townIncome += income; G.stats.totalGold += income
    if (b.refined) {
      if (b.id === 'cake_shop') G.satisfaction = Math.min(100, G.satisfaction + 3 * dt * G.speed / G.dayLength)
      if (b.id === 'market') G.gold += 50 * dt * G.speed / G.dayLength
      if (b.id === 'inn') G.adventurers.forEach(a => { if (a.state === 'Resting' || a.state === 'Idle') a.hp = Math.min(a.maxHp, a.hp + a.maxHp * 0.05 * dt * G.speed / G.dayLength) })
      if (b.id === 'weapon_shop' && Math.random() < dt * G.speed * 0.001) G.adventurers.forEach(a => { a.atk += 0.01 })
    }
  })
  G.popularity += G.buildings.length * 0.002 * dt * G.speed
  G.popularity = Math.min(200, G.popularity)
  G.satisfaction = Math.min(100, G.satisfaction + G.satisfactionBuff * 0.0004 * dt * G.speed)

  if (G.dayTick >= G.dayLength / G.speed) {
    G.dayTick = 0; G.day++
    document.getElementById('day-num').textContent = G.day
    addLog(`第${G.day}天 — 日收入 ${Math.floor(G.townIncome)}金 | 人氣:${Math.floor(G.popularity)} | 滿足:${Math.floor(G.satisfaction)}`, 'earn')
    G.townIncome = 0
    updateQuestProgress()
    if (G.adventurers.length < G.maxAdventurers && Math.random() < 0.25 + G.popularity / 300) {
      const adv = createAdventurer()
      const sp = gridToScreen(0, 7); adv.screenX = sp.x - 10; adv.screenY = sp.y
      G.adventurers.push(adv)
      const cls = GAME_DATA.adventurerClasses.find(c => c.id === adv.classId)
      addLog(`🧙 ${adv.name} (${cls.name}) 加入了村莊！`, 'level')
      document.getElementById('adv-count-val').textContent = G.adventurers.length
    }
    G.maxAdventurers = 4 + G.townLevel * 2 + G.residents.filter(r => r.residentJob?.id === 'guildmaster').length * 3
    updateTopBar()
  }
}
