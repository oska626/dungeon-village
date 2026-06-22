import { G } from './state.js'
import { GAME_DATA } from './data.js'
import { gridToScreen } from './render.js'
import { addLog, updateQuestProgress } from './ui.js'
import { applyResidentBonuses, createAdventurer } from './fsm.js'
import { playTrack } from './audio.js'

// Satisfaction system only activates at town level 2+
export function satSystemActive() { return G.townLevel >= 2 }
export function satTierCount() { return satSystemActive() ? Math.min(3, Math.floor(G.satisfaction / 30)) : 0 }
export function hasSatEffect(id) { return G.satisfactionBonuses.slice(0, satTierCount()).includes(id) }
export function hasNegEffect(id) { return satSystemActive() && (G.satisfactionNegBonuses || []).includes(id) }

export function renderSatPanel() {
  const panel = document.getElementById('sat-panel')
  if (!panel || panel.classList.contains('hidden')) return
  const tier = satTierCount()
  if (!satSystemActive()) {
    panel.innerHTML = '<div style="font-size:11px;color:var(--text-dim);text-align:center;padding:4px 0;">🔒 村等2解鎖滿足度系統</div>'
    return
  }
  const negFxList = (G.satisfactionNegBonuses || []).map(id => GAME_DATA.satisfactionNegEffects.find(e => e.id === id)).filter(Boolean)
  panel.innerHTML =
    '<div style="font-size:11px;color:var(--text-dim);margin-bottom:5px;">✨ 正加成 (每30點滿足度)</div>' +
    G.satisfactionBonuses.map((id, i) => {
      const fx = GAME_DATA.satisfactionEffects.find(e => e.id === id)
      const active = i < tier
      const threshold = (i + 1) * 30
      return `<div class="sat-tier ${active ? 'active' : 'inactive'}">
        <span class="sat-tier-badge">${threshold}+</span>
        <span>${fx.emoji} ${fx.name}</span>
        ${active ? '<span style="color:var(--green-hi);margin-left:auto;">✓</span>' : ''}
      </div>`
    }).join('') +
    (negFxList.length ? '<div style="font-size:11px;color:var(--red-hi);margin:7px 0 4px;">⚠️ 本局詛咒</div>' +
      negFxList.map(fx => `<div class="sat-tier inactive" style="border-color:rgba(255,80,80,.15);">
        <span class="sat-tier-badge" style="background:rgba(255,80,80,.2);color:var(--red-hi);">⚡</span>
        <span>${fx.emoji} ${fx.name}</span>
        <span style="color:var(--red-hi);margin-left:auto;">✗</span>
      </div>`).join('') : '')
}

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
  G.gold = Math.floor(G.gold)
  updateTopBar(); checkTownLevelUp()
}

export function checkTownLevelUp() {
  if (G.townExp >= G.townExpNeeded) {
    G.townExp -= G.townExpNeeded; G.townLevel++
    G.townExpNeeded = Math.floor(G.townExpNeeded * 1.75)
    showLevelUpOverlay(); updateStars(); applyResidentBonuses()
    addLog(`🏆 村莊升至 ${G.townLevel}星！`, 'level')
    if (G.townLevel === 2) {
      addLog('😊 滿足度系統解鎖！點擊頂欄滿足度查看加成', 'level')
      ;(G.satisfactionNegBonuses || []).forEach(id => {
        const fx = GAME_DATA.satisfactionNegEffects.find(e => e.id === id)
        if (fx) addLog(`⚠️ 本局詛咒：${fx.emoji} ${fx.name}`, 'combat')
      })
    }
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
    const incomeBonus = hasSatEffect('income') ? 1.15 : 1
    const income = d.baseIncome * (1 + (b.level - 1) * 0.5) * (1 + innkeeperBonus) * G.incomeBuff * incomeBonus * dt * G.speed * 0.1
    G.gold += income; G.townIncome += income; G.stats.totalGold += income
    if (b.refined) {
      if (b.id === 'cake_shop') G.satisfaction = Math.min(100, G.satisfaction + 3 * dt * G.speed / G.dayLength)
      if (b.id === 'market') G.gold += 50 * dt * G.speed / G.dayLength
      if (b.id === 'inn') G.adventurers.forEach(a => { if (a.state === 'Resting' || a.state === 'Idle') a.hp = Math.min(a.maxHp, a.hp + a.maxHp * 0.05 * dt * G.speed / G.dayLength) })
      // weapon_shop refined: +1 ATK per day handled in end-of-day block below
    }
  })
  const popRate = hasNegEffect('pop_slow') ? 0.8 : 1
  G.popularity += G.buildings.length * 0.002 * dt * G.speed * popRate
  G.popularity = Math.min(200, G.popularity)
  const prevSatTier = satTierCount()
  G.satisfaction = Math.min(100, G.satisfaction + G.satisfactionBuff * 0.0004 * dt * G.speed)
  const newSatTier = satTierCount()
  if (newSatTier > prevSatTier && newSatTier <= 3) {
    const fx = GAME_DATA.satisfactionEffects.find(e => e.id === G.satisfactionBonuses[newSatTier - 1])
    if (fx) addLog(`😊 滿足度達到${newSatTier * 30}！解鎖加成：${fx.emoji} ${fx.name}`, 'level')
  }

  if (G.dayTick >= G.dayLength / G.speed) {
    G.dayTick = 0; G.day++
    document.getElementById('day-num').textContent = G.day
    addLog(`第${G.day}天 — 日收入 ${Math.floor(G.townIncome)}金 | 人氣:${Math.floor(G.popularity)} | 滿足:${Math.floor(G.satisfaction)}`, 'earn')
    G.townIncome = 0

    if (satSystemActive()) {
      // Direction A: satisfaction penalties
      if (G.satisfaction === 0) {
        const pen = G.buildings.filter(b => !b.constructing).length * 3
        G.gold = Math.max(0, G.gold - pen)
        if (pen > 0) addLog(`😡 滿足度歸零！收入損失 ${pen}金`, 'combat')
      }
      if (G.satisfaction < 10 && Math.random() < 0.2 && G.adventurers.length > 0) {
        const idx = Math.floor(Math.random() * G.adventurers.length)
        const gone = G.adventurers.splice(idx, 1)[0]
        addLog(`😢 ${gone.name} 因村莊太差勁而離去！`, 'combat')
      }
      // Neg effect: sat_decay
      if (hasNegEffect('sat_decay')) G.satisfaction = Math.max(0, G.satisfaction - 3)
      // Neg effect: maintenance fee
      if (hasNegEffect('maintenance')) {
        const fee = G.buildings.filter(b => !b.constructing).length * 5
        G.gold = Math.max(0, G.gold - fee)
        if (fee > 0) addLog(`🔧 建築維護費 -${fee}金`, '')
      }
    }

    if (G.buildings.find(b => b.id === 'weapon_shop' && b.refined))
      G.adventurers.forEach(a => { a.atk += 1 })
    updateQuestProgress()
    if (G.adventurers.length < G.maxAdventurers && Math.random() < 0.25 + G.popularity / 300 + (hasSatEffect('recruit') ? 0.25 : 0)) {
      const adv = createAdventurer()
      const sp = gridToScreen(0, 7); adv.screenX = sp.x - 10; adv.screenY = sp.y
      G.adventurers.push(adv)
      const cls = GAME_DATA.adventurerClasses.find(c => c.id === adv.classId)
      addLog(`🧙 ${adv.name} (${cls ? cls.name : '???'}) 加入了村莊！`, 'level')
      document.getElementById('adv-count-val').textContent = G.adventurers.length
    }
    G.maxAdventurers = 4 + G.townLevel * 2 + G.residents.filter(r => r.residentJob?.id === 'guildmaster').length * 3
    updateTopBar()
  }
  G.gold = Math.floor(G.gold)
}
