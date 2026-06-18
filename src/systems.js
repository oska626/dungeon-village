import { G } from './state.js'
import { GAME_DATA } from './data.js'
import { gridToScreen, screenToGrid, addCombatFX, spawnParticles } from './render.js'
import { addLog, updateQuestProgress } from './ui.js'
import { updateTopBar, updateResourceDisplay, checkTownLevelUp } from './economy.js'
import { stopAll, playTrack } from './audio.js'
import { applyResidentBonuses, setState } from './fsm.js'

// ── Construction ticking ──
export function tickConstruction(dt) {
  let anyDone = false
  G.buildings.forEach(b => {
    if (!b.constructing) return
    b.constructTimer += dt * G.speed
    if (b.constructTimer >= b.constructTime) {
      b.constructing = false
      b.constructTimer = b.constructTime
      const bd = GAME_DATA.buildings.find(d => d.id === b.id)
      import('./ui.js').then(m => m.addLog(`🏗 ${bd?.emoji}${bd?.name} 建造完成！`, 'build'))
      G.buildingCacheDirty = true
      anyDone = true
    }
  })
  if (anyDone) {
    import('./economy.js').then(m => { m.updateTopBar(); m.updateResourceDisplay() })
    import('./fsm.js').then(m => { m.applyResidentBonuses(); m.recalcSynergies() })
  }
}

// ── Resource respawn ──
export function tickResourceRespawn(dt) {
  G.resourceNodes.forEach(n => {
    if (n.stock >= n.max) return
    n.respawnTimer += (dt * G.speed)
    if (n.respawnTimer >= n.respawn) { n.respawnTimer = 0; n.stock = Math.min(n.max, n.stock + 1) }
  })
}

// ── Siege waypoints ──
export const SIEGE_WAYPOINTS = [
  { gx: 21, gy: 8 },
  { gx: 15, gy: 8 },
  { gx: 9,  gy: 8 },
  { gx: 9,  gy: 7 },
  { gx: 6,  gy: 7 },
  { gx: 4,  gy: 7 },
]

// Second front: attack from the north (top edge → sweep down into town)
export const SIEGE_WAYPOINTS_NORTH = [
  { gx: 14, gy: 0 },
  { gx: 14, gy: 4 },
  { gx: 9,  gy: 4 },
  { gx: 7,  gy: 5 },
  { gx: 5,  gy: 6 },
  { gx: 4,  gy: 7 },
]

export const WALL_GX = 9  // wall boundary x position

function siegeMonsterStep(sm, dt) {
  if (sm._wpIdx === undefined) sm._wpIdx = 0
  const waypoints = sm.waypoints || SIEGE_WAYPOINTS
  const wp = waypoints[sm._wpIdx]; if (!wp) return

  // Block at wall if it's still standing
  const wallAlive = G.wall.level > 0 && G.wall.hp > 0
  if (wallAlive && wp.gx < WALL_GX) return  // don't advance past wall waypoints

  const target = gridToScreen(wp.gx, wp.gy)
  const tx = target.x, ty = target.y
  if (sm.screenX === undefined) { const s = gridToScreen(sm.gx, sm.gy); sm.screenX = s.x; sm.screenY = s.y }
  const dx = tx - sm.screenX, dy = ty - sm.screenY
  const dist = Math.sqrt(dx * dx + dy * dy)
  const spd = 35 * G.speed
  if (dist < 8) {
    sm.gx = wp.gx; sm.gy = wp.gy
    sm._wpIdx = Math.min(sm._wpIdx + 1, waypoints.length - 1)
  } else {
    sm.screenX += (dx / dist) * spd * dt; sm.screenY += (dy / dist) * spd * dt
    const g = screenToGrid(sm.screenX, sm.screenY)
    sm.gx = Math.max(0, Math.min(G.gridW - 1, g.x)); sm.gy = Math.max(0, Math.min(G.gridH - 1, g.y))
  }
}

function spawnSiegeWave(monsterPool, waveSize, label, alertText, waypoints, forceElite) {
  G.siege.active = true
  const wt = []; monsterPool.forEach(m => { for (let i = 0; i < m.spawnWeight; i++) wt.push(m) })
  const sizeMult = Math.max(1, (waveSize - 4) * 0.15)
  // A — exponential HP/ATK scaling per town level
  const hpBase = Math.pow(1.22, G.townLevel) * sizeMult * (G._monsterHpMult || 1)
  const atkBase = Math.pow(1.15, G.townLevel) * (G._monsterAtkMult || 1)
  // C — elite spawn chance scales with level (max 35%)
  const eliteChance = Math.min(0.35, 0.05 + G.townLevel * 0.025)
  // North front: spawn from top edge
  const isNorth = waypoints === SIEGE_WAYPOINTS_NORTH
  for (let i = 0; i < waveSize; i++) {
    const proto = wt[Math.floor(Math.random() * wt.length)]
    const isElite = forceElite || (!forceElite && Math.random() < eliteChance)
    const eliteMult = isElite ? 2.2 : 1
    const spawnGX = isNorth ? 14 : G.gridW - 1
    const spawnGY = isNorth ? 0 : 7 + Math.floor(Math.random() * 2)
    const spawnScreen = gridToScreen(spawnGX, spawnGY)
    G.siege.siegeMonsters.push({
      ...proto,
      name: isElite ? `精英${proto.name}` : proto.name,
      emoji: isElite ? `⭐${proto.emoji}` : proto.emoji,
      gx: spawnGX, gy: spawnGY,
      screenX: spawnScreen.x + Math.random() * 20, screenY: spawnScreen.y + Math.random() * 10,
      hp: Math.floor(proto.hp * hpBase * eliteMult),
      maxHp: Math.floor(proto.hp * hpBase * eliteMult),
      atk: Math.floor(proto.atk * atkBase * (isElite ? 1.5 : 1)),
      dead: false, attackTimer: 0, isSiege: true, _wpIdx: 0,
      waypoints: waypoints || null,
      isElite,
    })
  }
  const alertEl = document.getElementById('siege-alert')
  alertEl.style.display = 'block'; alertEl.textContent = alertText
  addLog(`🚨 ${label}！${waveSize}隻怪物進攻村莊！`, 'combat')
  setTimeout(() => { if (!G.siege.active) alertEl.style.display = 'none' }, 3000)
  playTrack('battle')
}

export function launchSiege() {
  const advScale = Math.floor(G.adventurers.length / 2)
  const baseSize = 2 + Math.floor(G.townLevel * 1.2) + advScale
  const waveSize = Math.min(baseSize, 8 + Math.floor(G.townLevel / 3))

  // During tutorial: cap wave at 1 monster, half atk
  if (G.tutorial?.active) {
    const savedAtk = G._monsterAtkMult
    G._monsterAtkMult = (G._monsterAtkMult || 1) * 0.5
    spawnSiegeWave(GAME_DATA.monsters, 1, '攻城', `👹 攻城！（教學模式：弱化怪物）`)
    G._monsterAtkMult = savedAtk
    return
  }

  // C — BOSS wave every 5 town levels
  if (!G.siege.lastBossLevel) G.siege.lastBossLevel = 0
  if (G.townLevel >= 5 && G.townLevel % 5 === 0 && G.siege.lastBossLevel < G.townLevel) {
    G.siege.lastBossLevel = G.townLevel
    // Pick strongest pool monster as BOSS, spawn 1 forced-elite
    const bossPool = [...GAME_DATA.monsters].sort((a, b) => b.hp - a.hp)
    spawnSiegeWave(bossPool, 1, `💀 BOSS來襲！（等級${G.townLevel}）`, `💀 BOSS波！強力精英怪物衝向村莊！`, null, true)
    // Plus a small escort wave
    const escortSize = Math.min(3, Math.floor(G.townLevel / 4))
    if (escortSize > 0) spawnSiegeWave(GAME_DATA.monsters, escortSize, 'BOSS護衛', `💀 BOSS護衛部隊！`, null, false)
    addLog(`💀 第${G.townLevel}級里程碑 BOSS攻城！`, 'combat')
    return
  }

  spawnSiegeWave(GAME_DATA.monsters, waveSize, '攻城', `👹 攻城！${waveSize}隻怪物衝向村莊！`)

  // B — second front from the north at level 8+
  if (G.townLevel >= 8) {
    const northSize = Math.max(2, Math.floor(waveSize * 0.6))
    spawnSiegeWave(GAME_DATA.monsters, northSize, '北路奇襲', `🗡 北路奇襲！${northSize}隻怪物從山嶺殺到！`, SIEGE_WAYPOINTS_NORTH)
    addLog(`🗡 雙路夾攻！北方同時有敵軍入侵！`, 'combat')
  }
}

export function launchNightRaid() {
  const advScale = Math.floor(G.adventurers.length / 2)
  const waveSize = Math.min(2 + Math.floor(G.townLevel * 0.8) + advScale, 6)
  // During tutorial: skip night raids entirely
  if (G.tutorial?.active) return
  spawnSiegeWave(GAME_DATA.nightMonsters, waveSize, '夜襲', `🌙 夜襲！${waveSize}隻夜間怪物出沒！`)
}

export function checkGameOver() {
  if (G.buildings.length === 0) {
    G.gameOver = true
    stopAll()
    document.getElementById('go-days').textContent = G.day
    document.getElementById('go-kills').textContent = G.stats.kills
    document.getElementById('gameover-overlay').classList.add('show')
    addLog('💀 所有建築物被摧毀！遊戲結束！', 'combat')
  }
}

// ── Night raid ticker (independent from day siege) ──
function tickNightSiege(dt) {
  if (G.dayPhase !== 'night') {
    G.nightSiege.timer = 0  // reset when not night
    return
  }
  if (G.siege.active) return  // don't stack raids
  G.nightSiege.timer += dt * G.speed
  if (G.nightSiege.timer >= G.nightSiege.nextIn && G.buildings.length > 0) {
    G.nightSiege.timer = 0
    // Next raid: 80–130 real-seconds of night time, scaled by difficulty
    const base = (G._monsterAtkMult || 1) > 1 ? 60 : 90
    G.nightSiege.nextIn = base + Math.random() * 40
    if (Math.random() < 0.65)  // 65% chance to actually raid (not every night triggers)
      launchNightRaid()
  }
}

export function tickSiege(dt) {
  if (G.gameOver) return
  tickConstruction(dt)
  tickNightSiege(dt)
  // Interval keeps shrinking past level 5; floor rises with difficulty
  const baseInterval = Math.max(15, 120 - G.townLevel * 10)
  G.siege.interval = baseInterval
  G.siege.timer += dt * G.speed

  if (!G.siege.warningShown && G.siege.timer > G.siege.interval * 0.8 && G.buildings.length > 0) {
    G.siege.warningShown = true
    const alert = document.getElementById('siege-alert')
    alert.style.display = 'block'
    alert.textContent = `⚠️ 敵軍逼近！約 ${Math.ceil((G.siege.interval - G.siege.timer) / G.speed)}秒後攻城！`
    setTimeout(() => { alert.style.display = 'none' }, 4000)
  }

  if (G.siege.timer >= G.siege.interval && G.buildings.length > 0) {
    G.siege.timer = 0; G.siege.warningShown = false; launchSiege()
  }

  if (G.siege.active) {
    G.siege.siegeMonsters = G.siege.siegeMonsters.filter(sm => !sm.dead)
    G.siege.siegeMonsters.forEach(sm => {
      siegeMonsterStep(sm, dt)
      sm.attackTimer = (sm.attackTimer || 0) + dt * G.speed
      if (sm.attackTimer > 1.2) {
        sm.attackTimer = 0
        // Attack wall if alive and monster is near wall
        const wallAlive = G.wall.level > 0 && G.wall.hp > 0
        if (wallAlive && sm.gx >= WALL_GX - 2) {
          const dmg = (sm.atk || 8) * 0.8
          G.wall.hp = Math.max(0, G.wall.hp - dmg)
          const { x, y } = gridToScreen(WALL_GX, sm.gy)
          addCombatFX(x, y - 20, '-' + Math.ceil(dmg), '#ff8800', 'text')
          if (G.wall.hp <= 0) {
            addLog('💥 城牆被摧毀！怪物湧入村莊！', 'combat')
            spawnParticles(x, y - 10, '#ff4400', 8, 12, 3)
          }
          return
        }
        const target = G.buildings.find(b => !wallAlive && Math.abs(b.gx - sm.gx) <= 2 && Math.abs(b.gy - sm.gy) <= 2)
        if (target) {
          if (target.hp === undefined) { target.maxHp = 100 + target.level * 50; target.hp = target.maxHp }
          const dmg = sm.atk || 8
          target.hp = Math.max(0, target.hp - dmg)
          G.buildingCacheDirty = true
          const { x, y } = gridToScreen(target.gx, target.gy)
          addCombatFX(x, y - 30, '-' + dmg, '#ff2222', 'text')
          spawnParticles(x, y - 20, '#ff4444', 3, 8, 2)
          if (target.hp <= 0) {
            const bd = GAME_DATA.buildings.find(d => d.id === target.id)
            addLog(`💥 ${bd?.name || target.id} 被摧毀！`, 'combat')
            if (target.id === 'house') {
              G.adventurers.forEach(a => {
                if (a.homeGX === target.gx && a.homeGY === target.gy) {
                  a.homeGX = null; a.homeGY = null; a.isHomeless = true
                  addLog(`😢 ${a.name} 的住宅被摧毀！無法出戰！`, 'combat')
                  setState(a, 'Homeless')
                }
              })
            }
            const tIdx = G.buildings.indexOf(target); if (tIdx !== -1) G.buildings.splice(tIdx, 1)
            if (G.selectedBuildingOnMap === target) G.selectedBuildingOnMap = null
            G.buildingCacheDirty = true
            checkGameOver()
          }
        }
      }
      G.adventurers.forEach(adv => {
        if (adv.state === 'Combat' || adv.state === 'InDungeon' || adv.state === 'Resting') return
        if (Math.abs(adv.inFieldGX - sm.gx) < 4 && Math.abs(adv.inFieldGY - sm.gy) < 4) {
          adv.combatTarget = sm; setState(adv, 'Combat')
        }
      })
    })
    if (G.siege.siegeMonsters.length === 0) {
      G.siege.active = false
      addLog('🛡 攻城擊退！村莊守住了！', 'level')
      document.getElementById('siege-alert').style.display = 'none'
      playTrack(G.dayPhase === 'night' ? 'night' : 'day')
    }
  }

}

// ── Wall ──
export function upgradeWall() {
  const nextLevel = G.wall.level + 1
  if (nextLevel > 5) { addLog('城牆已達最高等級！', ''); return }
  const wt = GAME_DATA.wallTiers[nextLevel - 1]
  const goldCost = 200 * nextLevel, stoneCost = nextLevel * 2, ironCost = nextLevel >= 3 ? nextLevel - 2 : 0
  if (G.gold < goldCost) { addLog(`升級城牆需要 ${goldCost}金`, ''); return }
  if ((G.globalResources.stone || 0) < stoneCost) { addLog(`升級城牆需要 ${stoneCost} 石材`, ''); return }
  if (ironCost > 0 && (G.globalResources.iron || 0) < ironCost) { addLog(`升級城牆需要 ${ironCost} 鐵礦`, ''); return }
  G.gold -= goldCost
  G.globalResources.stone = Math.max(0, (G.globalResources.stone || 0) - stoneCost)
  G.globalResources.iron = Math.max(0, (G.globalResources.iron || 0) - ironCost)
  G.wall.level = nextLevel; G.wall.maxHp = wt.hp; G.wall.hp = wt.hp
  addLog(`🏰 城牆升級至 ${wt.emoji}${wt.name}！HP:${wt.hp}`, 'build')
  updateTopBar(); updateResourceDisplay()
}

export function repairWall() {
  if (G.wall.level === 0) { addLog('尚未建造城牆！先升級城牆。', ''); return }
  const wt = GAME_DATA.wallTiers[G.wall.level - 1]
  if (G.gold < wt.repair) { addLog(`修復城牆需要 ${wt.repair}金`, ''); return }
  G.gold -= wt.repair; G.wall.hp = G.wall.maxHp
  addLog(`🔧 城牆修復完成！HP恢復至 ${G.wall.maxHp}`, 'build')
  updateTopBar()
}

export function repairBuilding(gx, gy) {
  const b = G.buildings.find(b => b.gx === gx && b.gy === gy); if (!b) return
  if (b.hp === undefined || b.hp === b.maxHp) { addLog('建築物無需修復', ''); return }
  const cost = Math.floor((b.maxHp - b.hp) * 0.5)
  if (G.gold < cost) { addLog(`修復需要 ${cost}金`, ''); return }
  G.gold -= cost; b.hp = b.maxHp
  const bd = GAME_DATA.buildings.find(d => d.id === b.id)
  addLog(`🔧 ${bd?.name || b.id} 修復完成！`, 'build')
  updateTopBar()
  import('./ui.js').then(m => m.showBuildingInfo(b))
}

export function openWallMenu() {
  closeWallMenu()
  const wl = G.wall.level
  const next = wl < 5 ? GAME_DATA.wallTiers[wl] : null
  const cur = wl > 0 ? GAME_DATA.wallTiers[wl - 1] : null
  const goldCost = next ? 200 * (wl + 1) : 0
  const stoneCost = next ? (wl + 1) * 2 : 0
  const ironCost = next && wl >= 2 ? wl - 1 : 0
  const statusLine = `${cur ? cur.emoji + cur.name : '無城牆'}  HP: ${Math.ceil(G.wall.hp)} / ${G.wall.maxHp}`
  const upgradeLine = next ? `升級至 ${next.emoji}${next.name}：💰${goldCost}  🪨${stoneCost}${ironCost > 0 ? '  ⛏️' + ironCost : ''}` : '已達最高等級！'
  const repairBtn = (wl > 0 && G.wall.hp < G.wall.maxHp) ? `<button class="btn-action" onclick="repairWall();closeWallMenu()">🔧 修復 (${GAME_DATA.wallTiers[wl - 1]?.repair}💰)</button>` : ''
  const upgradeBtn = next ? `<button class="btn-action" onclick="upgradeWall();closeWallMenu()">⬆ 升級 → ${next.name}</button>` : ''
  const popup = document.createElement('div')
  popup.id = 'wall-popup'
  popup.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:var(--bg-panel);border:2px solid var(--gold);border-radius:10px;padding:20px 24px;z-index:800;min-width:300px;text-align:center;box-shadow:0 0 30px rgba(240,165,0,0.3);'
  popup.innerHTML = `<div style="color:var(--gold);font-weight:700;font-size:15px;margin-bottom:12px;">🏰 城牆管理</div>
    <div style="color:var(--parchment);font-size:13px;margin-bottom:6px;">${statusLine}</div>
    <div style="color:var(--text-dim);font-size:12px;margin-bottom:16px;">${upgradeLine}</div>
    <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;">${repairBtn}${upgradeBtn}<button class="btn-action red" onclick="closeWallMenu()">✕ 關閉</button></div>`
  const backdrop = document.createElement('div')
  backdrop.id = 'wall-popup-backdrop'
  backdrop.style.cssText = 'position:fixed;inset:0;z-index:799;'
  backdrop.onclick = closeWallMenu
  document.body.appendChild(backdrop); document.body.appendChild(popup)
}

export function closeWallMenu() {
  const el = document.getElementById('wall-popup'); if (el) el.remove()
  const bd = document.getElementById('wall-popup-backdrop'); if (bd) bd.remove()
}

// ── Forge ──
export function autoForgeIfPossible() {
  if (!G.buildings.find(b => b.id === 'forge')) return
  const priority = ['sword', 'armor', 'shield', 'bow', 'staff']
  for (const eqId of priority) {
    const eq = GAME_DATA.equipment.find(e => e.id === eqId); if (!eq) continue
    const curTier = G.globalResources['eq_' + eqId] || 0
    if (curTier >= eq.tiers.length - 1) continue
    const nextTier = eq.tiers[curTier + 1]; if (!nextTier) continue
    const canAfford = Object.entries(nextTier.cost).every(([k, v]) => (G.globalResources[k] || 0) >= v)
    if (canAfford) { forgeUpgrade(eqId); G._buildPanelDirty = true; break }
  }
}

export function openForge() {
  if (!G.buildings.find(b => b.id === 'forge')) { addLog('需要先建造打鐵店！', ''); return }
  buildForgeUI(); document.getElementById('forge-overlay').classList.add('show')
}
export function closeForge() { document.getElementById('forge-overlay').classList.remove('show') }

export function buildForgeUI() {
  const c = document.getElementById('forge-content'); c.innerHTML = ''
  const resDiv = document.createElement('div')
  resDiv.style.cssText = 'background:rgba(0,0,0,.4);border-radius:5px;padding:8px;margin-bottom:10px;font-size:14px;display:flex;gap:10px;flex-wrap:wrap;'
  resDiv.innerHTML = `<span style="color:var(--text-dim);">庫存：</span>` +
    Object.entries(G.globalResources).filter(([k]) => !k.startsWith('eq_')).map(([k, v]) => {
      const rd = GAME_DATA.resources.find(r => r.id === k)
      return `<span>${rd ? rd.emoji : '?'} ${rd ? rd.name : k}: <b style="color:var(--gold)">${v}</b></span>`
    }).join('')
  c.appendChild(resDiv)
  GAME_DATA.equipment.forEach(eq => {
    const row = document.createElement('div'); row.className = 'forge-row'
    const curTier = G.globalResources['eq_' + eq.id] || 0
    const nextTier = curTier + 1 < eq.tiers.length ? eq.tiers[curTier + 1] : null
    const curData = eq.tiers[curTier]
    const costStr = nextTier ? Object.entries(nextTier.cost).map(([k, v]) => {
      const rd = GAME_DATA.resources.find(r => r.id === k)
      return `${rd ? rd.emoji : '?'}${v}`
    }).join(' ') : '最高等級'
    const canAfford = nextTier && Object.entries(nextTier.cost).every(([k, v]) => (G.globalResources[k] || 0) >= v)
    row.innerHTML = `
      <div style="font-size:20px;">${eq.emoji}</div>
      <div class="forge-info">
        <div class="forge-name">${eq.name} — ${curData.name} (Tier ${curTier + 1}/${eq.tiers.length})</div>
        <div class="forge-cost">
          ${curData.atkBonus ? `⚔+${curData.atkBonus} ` : ''}${curData.defBonus ? `🛡+${curData.defBonus} ` : ''}${curData.blockBonus ? `格擋+${Math.round(curData.blockBonus * 100)}% ` : ''}
          ${nextTier ? `→ 升級: ${costStr}` : ''}
        </div>
      </div>
      <button class="forge-btn${canAfford && nextTier ? '' : ' disabled'}" onclick="forgeUpgrade('${eq.id}')">
        ${nextTier ? (canAfford ? '⚒ 升級' : '材料不足') : '已滿級'}
      </button>`
    c.appendChild(row)
  })
}

export function forgeUpgrade(eqId) {
  const eq = GAME_DATA.equipment.find(e => e.id === eqId); if (!eq) return
  const curTier = G.globalResources['eq_' + eqId] || 0
  const nextTier = eq.tiers[curTier + 1]; if (!nextTier) return
  for (const [k, v] of Object.entries(nextTier.cost)) {
    if ((G.globalResources[k] || 0) < v) { addLog(`材料不足：需要 ${v} ${k}`, ''); return }
  }
  for (const [k, v] of Object.entries(nextTier.cost)) G.globalResources[k] = Math.max(0, (G.globalResources[k] || 0) - v)
  G.globalResources['eq_' + eqId] = (curTier + 1)
  G.adventurers.forEach(adv => {
    const cls = GAME_DATA.adventurerClasses.find(c => c.id === adv.classId)
    if (eq.slot === 'weapon' && ((cls?.attackType === 'melee' && eqId === 'sword') || (cls?.attackType === 'magic' && eqId === 'staff') || (cls?.attackType === 'ranged' && eqId === 'bow'))) {
      adv.atk += (nextTier.atkBonus || 0) - (eq.tiers[curTier].atkBonus || 0)
    }
    if (eq.slot === 'offhand' && eqId === 'shield') {
      adv.def += (nextTier.defBonus || 0) - (eq.tiers[curTier].defBonus || 0)
      adv.blockChance = (adv.blockChance || 0) + (nextTier.blockBonus || 0) - (eq.tiers[curTier].blockBonus || 0)
    }
    if (eq.slot === 'body' && eqId === 'armor') adv.def += (nextTier.defBonus || 0) - (eq.tiers[curTier].defBonus || 0)
  })
  addLog(`🔨 裝備升級！${eq.emoji}${eq.name} → ${nextTier.name}！`, 'level')
  updateResourceDisplay(); buildForgeUI()
}

export function restartGame() { location.reload() }
