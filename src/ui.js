import { G } from './state.js'
import { GAME_DATA } from './data.js'
import { canvas, combatFX, gridToScreen } from './render.js'
import { updateTopBar, updateResourceDisplay, checkTownLevelUp, depositToTown } from './economy.js'
import { applyResidentBonuses, recalcSynergies, createAdventurer, checkAdvLevelUp, promoteResident, applySkillPassive } from './fsm.js'
import { repairBuilding, openForge, buildForgeUI, forgeUpgrade, upgradeWall, repairWall, openWallMenu, closeWallMenu } from './systems.js'

// ── Logging ──
export function addLog(text, type) {
  const log = document.getElementById('event-log'); if (!log) return
  const e = document.createElement('div')
  e.className = 'log-entry' + (type ? ' log-' + type : '')
  e.innerHTML = '<span class="log-t">[D' + G.day + ']</span> ' + text
  log.insertBefore(e, log.firstChild)
  while (log.children.length > 120) log.removeChild(log.lastChild)
}

// ── Quest ──
export function showQuestCompleteEffect(questName, isMilestone) {
  const cx = canvas.width / 2, cy = canvas.height / 2
  const color = isMilestone ? '#f0a500' : '#52b788'
  const text = isMilestone ? `🏆 里程碑！${questName}` : `✅ 任務完成！${questName}`
  combatFX.push({ x: cx, y: cy - 20, text, color, alpha: 1, life: 160, type: 'questBanner', tx: cx, ty: cy, age: 0 })
  G._questFlash = { alpha: isMilestone ? 0.5 : 0.3, color, timer: 40 }
  const notif = document.getElementById('quest-notif'); if (notif) notif.style.display = 'inline-block'
}

export function updateQuestProgress() {
  let hasNew = false
  GAME_DATA.quests.forEach(q => {
    if (G.quests[q.id].claimed) return
    const prev = G.quests[q.id].progress
    switch (q.type) {
      case 'build':        G.quests[q.id].progress = G.buildings.length; break
      case 'adventurers':  G.quests[q.id].progress = G.adventurers.length; break
      case 'kills':        G.quests[q.id].progress = G.stats.kills; break
      case 'totalGold':    G.quests[q.id].progress = G.stats.totalGold; break
      case 'residents':    G.quests[q.id].progress = G.residents.length; break
      case 'dungeons':     G.quests[q.id].progress = G.stats.dungeons; break
      case 'townLevel':    G.quests[q.id].progress = G.townLevel; break
      case 'synergies':    G.quests[q.id].progress = G.stats.synergies; break
      case 'satisfaction': G.quests[q.id].progress = Math.floor(G.satisfaction); break
      case 'houses':       G.quests[q.id].progress = G.buildings.filter(b => b.id === 'house').length; break
    }
    if (G.quests[q.id].progress >= q.target && prev < q.target) {
      hasNew = true
      addLog(`📜 任務完成！「${q.name}」— 點擊任務欄領取獎勵`, 'quest')
      showQuestCompleteEffect(q.name, q.milestone)
    }
  })
  if (hasNew) { const notif = document.getElementById('quest-notif'); if (notif) notif.style.display = 'inline-block' }
  buildQuestPanel()
}

export function claimQuest(qid) {
  const q = GAME_DATA.quests.find(x => x.id === qid)
  if (!q || G.quests[qid].claimed || G.quests[qid].progress < q.target) return
  G.quests[qid].claimed = true
  if (q.reward.gold) G.gold += q.reward.gold
  if (q.reward.pop) G.popularity += q.reward.pop
  if (q.reward.unlockClass) {
    G.unlockedClasses.add(q.reward.unlockClass)
    const cls = GAME_DATA.adventurerClasses.find(c => c.id === q.reward.unlockClass)
    addLog(`🌟 解鎖新職業：${cls?.emoji}${cls?.name}！`, 'level')
  }
  addLog(`✅ 領取任務獎勵「${q.name}」 +${q.reward.gold || 0}金 +${q.reward.pop || 0}人氣`, 'quest')
  G.townExp += 50; updateTopBar(); checkTownLevelUp(); buildQuestPanel()
  document.getElementById('quest-notif').style.display = 'none'
}

// ── Building info ──
export function showBuildingInfo(b) {
  const d = GAME_DATA.buildings.find(x => x.id === b.id); if (!d) return
  if (b.constructing) {
    const pct = Math.floor(b.constructTimer / b.constructTime * 100)
    const remaining = Math.ceil(b.constructTime - b.constructTimer)
    const skipCost = Math.floor(d.cost * 0.5)
    const canSkip = G.gold >= skipCost
    document.getElementById('bld-info').innerHTML = `
      <div id="bld-info-title">🔨 ${d.emoji} ${d.name} 建造中…</div>
      <div style="font-size:12px;color:var(--text-dim);">剩餘 ${remaining} 秒</div>
      <div style="background:rgba(0,0,0,.4);border-radius:3px;height:8px;margin:6px 0;overflow:hidden;">
        <div style="background:var(--gold);height:100%;width:${pct}%;transition:width .5s;"></div>
      </div>
      <div id="bld-upgrade-btn" class="${canSkip ? '' : 'disabled'}"
           onclick="${canSkip ? `instantCompleteBuilding(${b.gx},${b.gy})` : ''}">
        ⚡ 即時完成 (${skipCost}💰)
      </div>`
    return
  }
  const upgradeCost = Math.floor(d.cost * (b.level * 0.8))
  const canUpgrade = b.level < 3 && G.gold >= upgradeCost
  const synActive = G.activeSynergyMap[b.id]
  if (b.hp === undefined) { b.maxHp = 100 + b.level * 50; b.hp = b.maxHp }
  const hpPct = b.hp / b.maxHp
  const repairCost = Math.floor((b.maxHp - b.hp) * 0.5)
  document.getElementById('bld-info').innerHTML = `
    <div id="bld-info-title">${d.emoji} ${d.name} Lv.${b.level}</div>
    <div style="font-size:13px;color:var(--text-dim);">${d.desc}</div>
    <div id="bld-info-stats" style="margin-top:4px;">
      <span class="bi-stat" style="color:var(--green-hi);">收入 +${Math.floor(d.baseIncome * (1 + (b.level - 1) * 0.5))}/day</span>
      <span class="bi-stat" style="color:var(--gold);">Buff ×${(1 + (b.level - 1) * 0.5).toFixed(1)}</span>
      ${synActive ? '<span class="bi-stat" style="color:gold;">⚡ 連鎖啟動</span>' : ''}
    </div>
    <div style="margin:4px 0;font-size:13px;">
      🏚 HP: <span style="color:${hpPct > 0.5 ? 'var(--green-hi)' : hpPct > 0.25 ? 'var(--gold)' : 'var(--red-hi)'}">${Math.ceil(b.hp)}/${b.maxHp}</span>
      ${b.hp < b.maxHp ? `<button class="forge-btn" style="margin-left:6px;font-size:17px;padding:2px 6px;" onclick="repairBuilding(${b.gx},${b.gy})">🔧 修復 (${repairCost}💰)</button>` : ''}
    </div>
    ${b.level < 3
      ? `<div id="bld-upgrade-btn" class="${canUpgrade ? '' : 'disabled'}" onclick="${canUpgrade ? `upgradeBuilding(${b.gx},${b.gy})` : ''}">
          ⬆ 升級至 Lv.${b.level + 1} (${upgradeCost}💰)
         </div>`
      : `<div style="font-size:12px;color:var(--gold);margin-bottom:4px;">✅ 最高等級</div>
         <div id="bld-upgrade-btn" class="${G.gold >= (d.cost * 2) && !b.refined ? '' : 'disabled'}"
              onclick="${!b.refined && G.gold >= (d.cost * 2) ? `refineBuilding(${b.gx},${b.gy})` : ''}">
           ${b.refined ? `✨ 已精煉 — ${b.refinedBonus || '特殊效果啟動'}` : `✨ 精煉 (${d.cost * 2}💰) — 解鎖特殊效果`}
         </div>`
    }`
}

export function refineBuilding(gx, gy) {
  const b = G.buildings.find(b => b.gx === gx && b.gy === gy); if (!b || b.refined) return
  const d = GAME_DATA.buildings.find(x => x.id === b.id); if (!d) return
  const cost = d.cost * 2
  if (G.gold < cost) { addLog(`精煉需要 ${cost}金`, ''); return }
  G.gold -= cost; b.refined = true
  const refineEffects = {
    inn: '每日自動回復全員HP 5%', weapon_shop: '冒險者ATK每日+1（永久累積）',
    cake_shop: '每天自動+3滿足度', armor_shop: '格擋率額外+10%',
    magic_tower: '魔法技能傷害×1.5', guild: '冒險者上限+5',
    market: '每日額外收入+50金', temple: '每5天隨機治癒一名瀕死冒險者',
    forge: '裝備升級資源消耗-50%',
  }
  b.refinedBonus = refineEffects[b.id] || '特殊效果啟動'
  addLog(`✨ ${d.emoji}${d.name} 精煉完成！效果：${b.refinedBonus}`, 'level')
  G.buildingCacheDirty = true; applyResidentBonuses(); showBuildingInfo(b); updateTopBar()
}

// ── Build panel ──
export function buildBuildPanel() {
  const c = document.getElementById('left-tab-build')
  const vacantHouses = G.buildings.filter(b => b.id === 'house' && !b.constructing && !G.adventurers.some(a => a.homeGX === b.gx && a.homeGY === b.gy)).length
  const totalHouses = G.buildings.filter(b => b.id === 'house').length
  c.innerHTML = `<div style="font-size:11px;color:var(--text-dim);margin-bottom:6px;">選擇建築後點擊地圖空格放置</div>
    <div style="font-size:11px;background:rgba(0,0,0,.3);border-radius:4px;padding:4px 7px;margin-bottom:7px;display:flex;align-items:center;gap:6px;">
      🏡 住宅：<span style="color:${vacantHouses > 0 ? 'var(--green-hi)' : 'var(--red-hi)'}">${vacantHouses} 空置</span> / ${totalHouses} 棟
      ${vacantHouses === 0 && totalHouses === 0 ? '<span style="color:var(--red-hi);font-size:10px;">⚠ 先建住宅才可招募</span>' : ''}
    </div>`
  GAME_DATA.buildings.forEach(b => {
    const afford = G.gold >= b.cost, locked = G.popularity < b.unlockPop
    const div = document.createElement('div')
    div.className = `build-card${afford && !locked ? '' : ' cant-afford'}`
    div.innerHTML = `
      <div class="bc-body">
        <div class="bc-img-wrap"><img class="bc-img" src="/sprites/${b.id}.png" alt="${b.name}" loading="lazy"></div>
        <div class="bc-info">
          <div class="bc-head"><span class="bc-name">${b.name}</span><span class="bc-cost">💰${b.cost}</span></div>
          <div class="bc-desc">${b.desc}</div>
          <div class="bc-stats">
            <span class="bc-stat income">+${b.baseIncome}/day</span>
            <span class="bc-stat pop">⭐+${b.popularity}</span>
            <span class="bc-stat buff">↑${b.buffStat}</span>
          </div>
          ${locked ? `<div class="bc-locked">🔒 需要人氣 ${b.unlockPop}</div>` : ''}
          ${b.synergyWith ? `<div style="font-size:11px;color:#9966ff;margin-top:2px;">⚡ ${b.synergyWith.map(id => GAME_DATA.buildings.find(x => x.id === id)?.emoji || '?').join(' ')}</div>` : ''}
        </div>
      </div>`
    div.onclick = () => { if (afford && !locked) selectBuilding(b) }
    c.appendChild(div)
  })
}

export function selectBuilding(bdata) {
  G.placingBuilding = bdata
  document.getElementById('place-hint').style.display = 'block'
  document.querySelectorAll('#left-tab-build .build-card').forEach(c => c.classList.remove('selected'))
  const idx = GAME_DATA.buildings.findIndex(b => b.id === bdata.id)
  document.querySelectorAll('#left-tab-build .build-card')[idx]?.classList.add('selected')
}

export function cancelPlacing() {
  G.placingBuilding = null; G._buildPanelDirty = true
  document.getElementById('place-hint').style.display = 'none'
  document.querySelectorAll('.build-card').forEach(c => c.classList.remove('selected'))
}

export function placeBuilding(bdata, gx, gy) {
  if (G.gold < bdata.cost) { addLog('💸 金幣不足！', ''); return }
  G.gold -= bdata.cost; G.grid[gy][gx] = 2
  const buildTime = bdata.buildTime || 20
  G.buildings.push({ id: bdata.id, gx, gy, level: 1, constructing: true, constructTimer: 0, constructTime: buildTime })
  G.buildingCacheDirty = true
  addLog(`🔨 開始建造 ${bdata.emoji}${bdata.name}！需 ${buildTime} 秒`, 'build')
  G.popularity += bdata.popularity; G.townExp += bdata.cost * 0.1
  cancelPlacing(); buildBuildPanel(); updateTopBar(); checkTownLevelUp()
  updateQuestProgress()
  // Tutorial hooks
  if (bdata.id === 'house') advanceTutorial('build_house')
  if (bdata.id === 'weapon_shop' || bdata.id === 'armor_shop') advanceTutorial('build_shop')
}

export function instantCompleteBuilding(gx, gy) {
  const b = G.buildings.find(x => x.gx === gx && x.gy === gy); if (!b || !b.constructing) return
  const d = GAME_DATA.buildings.find(x => x.id === b.id)
  const cost = Math.floor(d.cost * 0.5)
  if (G.gold < cost) { addLog(`即時完成需要 ${cost} 金幣！`, ''); return }
  G.gold -= cost; b.constructing = false; b.constructTimer = b.constructTime
  G.buildingCacheDirty = true
  addLog(`⚡ ${d.emoji}${d.name} 即時完成！花費 ${cost}金`, 'build')
  applyResidentBonuses(); recalcSynergies(); showBuildingInfo(b); updateTopBar()
}

export function upgradeBuilding(gx, gy) {
  const b = G.buildings.find(x => x.gx === gx && x.gy === gy); if (!b || b.level >= 3) return
  const d = GAME_DATA.buildings.find(x => x.id === b.id)
  const cost = Math.floor(d.cost * (b.level * 0.8))
  if (G.gold < cost) { addLog('💸 金幣不足！', ''); return }
  G.gold -= cost; b.level++; G.buildingCacheDirty = true
  addLog(`⬆ ${d.emoji}${d.name} 升級至 Lv.${b.level}！`, 'build')
  applyResidentBonuses(); showBuildingInfo(b); updateTopBar()
  G.townExp += cost * 0.15; checkTownLevelUp()
}

// ── Adventurer panel ──
export function buildAdvPanel() {
  const c = document.getElementById('right-tab-adventurers'); c.innerHTML = ''
  if (G.adventurers.length === 0) {
    c.innerHTML = '<div style="font-size:14px;color:var(--text-dim);text-align:center;padding:20px;">尚無冒險者<br>建造設施吸引他們！</div>'; return
  }
  G.adventurers.forEach(adv => {
    const cls = GAME_DATA.adventurerClasses.find(c => c.id === adv.classId)
    const stMap = { EnterTown:'state-town', Idle:'state-town', MovingToFacility:'state-moving', Shopping:'state-shopping', Resting:'state-resting', ExploringField:'state-field', Combat:'state-combat', InDungeon:'state-dungeon', Homeless:'state-field', GatheringResource:'state-field' }
    const slMap = { EnterTown:'進城', Idle:'待機', MovingToFacility:'移動', Shopping:'購物', Resting:'休息', ExploringField:'探索', Combat:'戰鬥', InDungeon:'⚔地下城中', GatheringResource:'採集', Homeless:'🏚無家可歸' }
    const div = document.createElement('div')
    div.className = `adv-row${adv.isResident ? ' resident' : ''}`
    div.innerHTML = `
      <div class="adv-row-head">
        <div><span class="adv-name">${cls?.emoji || '?'} ${adv.name}</span><span class="adv-class"> Lv.${adv.level} ${cls?.name || ''}</span></div>
        <span class="adv-state-badge ${stMap[adv.state] || 'state-town'}">${slMap[adv.state] || adv.state}</span>
      </div>
      <div class="adv-bars">
        <div class="bar-row"><span class="bar-lbl">HP</span><div class="bar-track"><div class="bar-fill bar-hp" style="width:${adv.hp / adv.maxHp * 100}%"></div></div><span class="bar-val">${Math.floor(adv.hp)}</span></div>
        <div class="bar-row"><span class="bar-lbl">💰</span><div class="bar-track"><div class="bar-fill bar-gold" style="width:${adv.gold / adv.goldCapacity * 100}%"></div></div><span class="bar-val">${Math.floor(adv.gold)}</span></div>
        <div class="bar-row"><span class="bar-lbl">😊</span><div class="bar-track"><div class="bar-fill bar-sat" style="width:${adv.satisfaction}%"></div></div><span class="bar-val">${Math.floor(adv.satisfaction)}%</span></div>
        <div class="bar-row"><span class="bar-lbl">EXP</span><div class="bar-track"><div class="bar-fill bar-exp" style="width:${adv.exp / adv.expNeeded * 100}%"></div></div><span class="bar-val">${Math.floor(adv.exp)}</span></div>
      </div>
      <div style="display:flex;gap:5px;margin-top:4px;font-size:12px;color:var(--text-dim);flex-wrap:wrap;">
        <span>⚔${adv.atk}</span><span>🛡${adv.def}</span><span>✨MP${Math.floor(adv.mp)}/${adv.mpMax}</span>
        ${adv.shieldLevel > 0 ? `<span style="color:#88ccff;">🛡×${adv.shieldLevel} ${Math.round((adv.blockChance || 0) * 100)}%格擋</span>` : ''}
        ${adv.isResident ? '<span style="color:var(--gold);">👑居民</span>' : ''}
        ${adv.state === 'InDungeon' ? `<span style="color:var(--orange-hi);">🗝 ${G.dungeon && G.dungeon.floorData ? G.dungeon.floorData.name : '地下城'}中</span>` : ''}
        ${adv.restTimer > 0 ? `<span style="color:var(--red-hi);">💤 休息中 ${Math.ceil(adv.restTimer)}s</span>` : ''}
        ${adv.isHomeless ? '<span style="color:var(--red-hi);">🏚 無家可歸！</span>' : ''}
        ${adv.homeGX ? `<span style="color:var(--text-dim);">🏠 (${adv.homeGX},${adv.homeGY})</span>` : ''}
      </div>
      ${adv.canPromote ? `<button class="adv-promote-btn" onclick="openSkillTree(${adv.id})">✨ 可升職！點擊查看</button>` : ''}
      ${renderAdvSkills(adv)}`
    c.appendChild(div)
  })
}

// ── Adv skill display ──
function renderAdvSkills(adv) {
  const cs = GAME_DATA.classSkills[adv.classId]
  if (!cs || adv.skills.length === 0) return ''
  const activeCD = adv.skillCooldowns[cs.active.id] || 0
  const cdText = activeCD > 0 ? `<span style="color:var(--red-hi);">CD ${Math.ceil(activeCD)}s</span>` : '<span style="color:var(--green-hi);">就緒</span>'
  return `<div class="adv-skills-row">
    <span class="skill-chip active-skill">${cs.active.emoji} ${cs.active.name} ${cdText}</span>
    <span class="skill-chip passive-skill">${cs.passive.emoji} ${cs.passive.name}</span>
  </div>`
}

// ── Skill Tree Overlay ──
export function openSkillTree(advId) {
  const adv = G.adventurers.find(a => a.id === advId); if (!adv) return
  const promo = GAME_DATA.classPromotions[adv.classId]; if (!promo) return
  G.paused = true

  const existing = document.getElementById('skill-tree-overlay')
  if (existing) existing.remove()

  const branches = [...new Set(promo.branches)]
  const branchHtml = branches.map(cid => {
    const cls = GAME_DATA.adventurerClasses.find(c => c.id === cid)
    const cs = GAME_DATA.classSkills[cid]
    if (!cls || !cs) return ''
    return `<div class="st-branch" onclick="confirmPromotion(${advId}, '${cid}')">
      <div class="st-branch-header">
        <span class="st-class-emoji">${cls.emoji}</span>
        <span class="st-class-name">${cls.name}</span>
      </div>
      <div class="st-stats">
        HP ${cls.baseHP} · ATK ${cls.baseATK} · DEF ${cls.baseDEF}
      </div>
      <div class="st-skill active">
        <span class="st-skill-type">主動</span>
        <span>${cs.active.emoji} <strong>${cs.active.name}</strong></span>
        <span class="st-skill-desc">${cs.active.desc}</span>
        <span class="st-skill-cd">⏱ CD ${cs.active.cd}s</span>
      </div>
      <div class="st-skill passive">
        <span class="st-skill-type passive">被動</span>
        <span>${cs.passive.emoji} <strong>${cs.passive.name}</strong></span>
        <span class="st-skill-desc">${cs.passive.desc}</span>
      </div>
      <div class="st-select-hint">點擊選擇</div>
    </div>`
  }).join('<div class="st-vs">VS</div>')

  const curCls = GAME_DATA.adventurerClasses.find(c => c.id === adv.classId)
  const overlay = document.createElement('div')
  overlay.id = 'skill-tree-overlay'
  overlay.innerHTML = `
    <div id="skill-tree-box">
      <div class="st-header">
        <span class="st-title">⚔ 職業升級</span>
        <button class="st-close" onclick="closeSkillTree()">✕</button>
      </div>
      <div class="st-current">
        ${curCls?.emoji} <strong>${adv.name}</strong> · ${curCls?.name} Lv.${adv.level}
      </div>
      <div class="st-desc">${promo.desc}</div>
      <div class="st-branches">${branchHtml}</div>
    </div>`
  document.body.appendChild(overlay)
}

export function closeSkillTree() {
  const el = document.getElementById('skill-tree-overlay')
  if (el) el.remove()
  G.paused = false
}

export function confirmPromotion(advId, newClassId) {
  const adv = G.adventurers.find(a => a.id === advId); if (!adv) return
  const newCls = GAME_DATA.adventurerClasses.find(c => c.id === newClassId)
  const cs = GAME_DATA.classSkills[newClassId]
  if (!newCls || !cs) return

  adv.classId = newClassId
  adv.canPromote = false
  // Recalculate base stats from new class
  adv.maxHp = newCls.baseHP + adv.level * 20
  adv.hp = adv.maxHp
  adv.atk = newCls.baseATK + adv.level * 3
  adv.def = newCls.baseDEF + adv.level * 2
  adv.spd = newCls.baseSPD
  adv.mpMax = newCls.mpMax
  adv.mp = adv.mpMax
  adv.expNeeded = newCls.expToLevel * adv.level

  // Apply passive skill
  applySkillPassive(adv, cs.passive)
  adv.skills = [cs.active.id, cs.passive.id]
  adv.skillCooldowns[cs.active.id] = 0

  addLog(`🌟 ${adv.name} 成功升職為 ${newCls.emoji} ${newCls.name}！習得技能：${cs.active.emoji}${cs.active.name} + ${cs.passive.emoji}${cs.passive.name}`, 'level')
  G.popularity += 5; G.townExp += 100
  applyResidentBonuses(); checkTownLevelUp(); updateTopBar()
  closeSkillTree()
  buildAdvPanel()
}

// ── Resident panel ──
export function buildResidentPanel() {
  const c = document.getElementById('right-tab-residents'); c.innerHTML = ''
  if (G.residents.length === 0) {
    c.innerHTML = '<div style="font-size:14px;color:var(--text-dim);text-align:center;padding:20px;line-height:1.8;">尚無居民<br>冒險者滿足度達85%<br>且等級≥2後自動定居！</div>'; return
  }
  G.residents.forEach(r => {
    const cls = GAME_DATA.adventurerClasses.find(c => c.id === r.classId)
    const div = document.createElement('div'); div.className = 'resident-card'
    div.innerHTML = `
      <div class="rc-head">
        <span class="rc-name">${cls?.emoji || '👤'} ${r.name}</span>
        <span class="rc-class">Lv.${r.level} ${cls?.name || ''}</span>
      </div>
      <div class="rc-bonus">📌 職業：${r.residentJob?.name || '自由民'}<br>🎁 ${r.residentJob?.bonus || '無特殊加成'}</div>
      <div class="rc-job" style="margin-top:3px;font-size:17px;color:var(--text-dim);">😊 滿足度 ${Math.floor(r.satisfaction)}%</div>`
    c.appendChild(div)
  })
  const summary = document.createElement('div')
  summary.style.cssText = 'background:rgba(0,0,0,.3);border-radius:5px;padding:8px;margin-top:4px;font-size:13px;line-height:1.8;'
  summary.innerHTML = `<div style="color:var(--gold);font-weight:700;margin-bottom:4px;">居民加成總覽</div>
    ATK +${G.atkBuff} | DEF +${G.defBuff}<br>EXP +${G.expBuff}% | 收入 ×${G.incomeBuff.toFixed(2)}<br>
    冒險者上限 ${G.maxAdventurers}`
  c.appendChild(summary)
}

// ── Quest panel ──
export function buildQuestPanel() {
  const c = document.getElementById('left-tab-quest'); c.innerHTML = ''
  const pending = GAME_DATA.quests.filter(q => !G.quests[q.id].claimed)
  const done = GAME_DATA.quests.filter(q => G.quests[q.id].claimed)
  if (pending.length === 0) { c.innerHTML = '<div style="font-size:14px;color:var(--green-hi);text-align:center;padding:12px;">🎉 所有任務完成！</div>'; return }
  pending.forEach(q => {
    const qst = G.quests[q.id]
    const pct = Math.min(100, qst.progress / q.target * 100)
    const complete = qst.progress >= q.target
    const div = document.createElement('div')
    div.className = `quest-card${complete ? ' complete' : ''}`
    div.innerHTML = `
      <div class="quest-name">${q.milestone ? '🏆' : '📋'} ${q.name}</div>
      <div class="quest-desc">${q.desc}</div>
      <div class="quest-bar-track"><div class="quest-bar-fill" style="width:${pct}%"></div></div>
      <div class="quest-progress">${qst.progress}/${q.target}</div>
      <div class="quest-reward">獎勵：💰${q.reward.gold || 0} ⭐${q.reward.pop || 0}${q.reward.unlockClass ? ` 🔓${q.reward.unlockClass}` : ''}</div>
      ${complete ? `<button class="btn-claim" onclick="claimQuest('${q.id}')">領取獎勵！</button>` : ''}`
    c.appendChild(div)
  })
  if (done.length > 0) {
    const h = document.createElement('div'); h.style.cssText = 'font-size:13px;color:var(--text-dim);margin:8px 0 4px;'; h.textContent = '✅ 已完成'; c.appendChild(h)
    done.slice(0, 3).forEach(q => {
      const d = document.createElement('div'); d.className = 'quest-card claimed'
      d.innerHTML = `<div class="quest-name" style="color:var(--text-dim);">✅ ${q.name}</div>`; c.appendChild(d)
    })
  }
}

// ── Synergy panel ──
export function buildSynergyPanel() {
  const c = document.getElementById('left-tab-synergy'); c.innerHTML = ''
  const header = document.createElement('div')
  header.style.cssText = 'font-size:13px;color:var(--text-dim);margin-bottom:8px;line-height:1.6;'
  header.textContent = '相鄰建築（距離≤4格）觸發連鎖Bonus，強化彼此效果'
  c.appendChild(header)
  GAME_DATA.buildings.forEach(b => {
    if (!b.synergyWith || !G.buildings.find(x => x.id === b.id)) return
    const active = G.activeSynergyMap[b.id]
    b.synergyWith.forEach(pid => {
      const partner = GAME_DATA.buildings.find(x => x.id === pid); if (!partner) return
      const div = document.createElement('div')
      div.style.cssText = `background:${active ? 'rgba(153,102,255,.15)' : 'rgba(0,0,0,.2)'};border:1px solid ${active ? 'var(--purple-hi)' : 'var(--border)'};border-radius:5px;padding:7px;margin-bottom:6px;`
      div.innerHTML = `
        <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
          <span style="font-size:14px;font-weight:700;">${b.emoji}${b.name} × ${partner.emoji}${partner.name}</span>
          <span style="font-size:13px;color:${active ? 'var(--green-hi)' : 'var(--red-hi)'};">${active ? '✅啟動' : '❌需鄰近'}</span>
        </div>
        <div style="font-size:13px;color:var(--purple-hi);">⚡ ${b.synergyBonus}</div>`
      c.appendChild(div)
    })
  })
  if (G.synergies.length === 0) c.innerHTML += '<div style="font-size:13px;color:var(--text-dim);padding:10px 0;">建造並鄰近擺放建築來觸發連鎖效果！</div>'
}

// ── Tabs ──
export function switchLeftTab(name) {
  ;['build', 'quest', 'synergy'].forEach(t => {
    document.getElementById('left-tab-' + t).style.display = t === name ? 'block' : 'none'
    document.getElementById('lt-' + t).classList.toggle('active', t === name)
  })
  if (name === 'quest') { buildQuestPanel(); document.getElementById('quest-notif').style.display = 'none' }
  if (name === 'build') buildBuildPanel()
  if (name === 'synergy') buildSynergyPanel()
}

export function switchRightTab(name) {
  ;['adventurers', 'residents', 'log'].forEach(t => {
    document.getElementById('right-tab-' + t).style.display = t === name ? 'block' : 'none'
  })
  document.getElementById('rt-adv').classList.toggle('active', name === 'adventurers')
  document.getElementById('rt-res').classList.toggle('active', name === 'residents')
  document.getElementById('rt-log').classList.toggle('active', name === 'log')
  if (name === 'adventurers') buildAdvPanel()
  if (name === 'residents') buildResidentPanel()
}

export function setSpeed(s) {
  G.speed = s
  document.querySelectorAll('.spd-btn').forEach(btn => {
    btn.classList.toggle('active',
      (s === 0.5 && btn.textContent === '½×') || (s === 1 && btn.textContent === '1×') ||
      (s === 2 && btn.textContent === '2×') || (s === 4 && btn.textContent === '4×'))
  })
}

// ── Recruit / Bounty / Force level ──
function getVacantHouse() {
  return G.buildings.find(b => b.id === 'house' && !b.constructing && !G.adventurers.some(a => a.homeGX === b.gx && a.homeGY === b.gy))
}

export function recruitAdventurer() {
  const house = getVacantHouse()
  if (!house) { addLog('🏡 需要先建造空置住宅才可招募冒險者！', ''); return }
  const cost = 80 + G.adventurers.length * 40
  if (G.gold < cost) { addLog('招募費用 ' + cost + '金 — 金幣不足！', ''); return }
  if (G.adventurers.length >= G.maxAdventurers) { addLog('冒險者已達上限 ' + G.maxAdventurers + '！', ''); return }
  G.gold -= cost
  const adv = createAdventurer()
  adv.homeGX = house.gx; adv.homeGY = house.gy; adv.isHomeless = false
  const sp = gridToScreen(0, 7); adv.screenX = sp.x - 15; adv.screenY = sp.y
  G.adventurers.push(adv)
  const cls = GAME_DATA.adventurerClasses.find(c => c.id === adv.classId)
  addLog('💎 招募了 ' + (cls ? cls.emoji : '') + adv.name + ' (' + (cls ? cls.name : '') + ') 住宅(' + house.gx + ',' + house.gy + ')', 'level')
  updateTopBar(); updateQuestProgress(); G._buildPanelDirty = true
  advanceTutorial('recruit')
}

const ELITE_TYPES = [
  { name:'骷髏王',   emoji:'💀', color:'#dddddd' },
  { name:'暗影巨人', emoji:'👤', color:'#334455' },
  { name:'炎魔',     emoji:'🔥', color:'#ff4400' },
  { name:'冰霜龍',   emoji:'❄️',  color:'#88ddff' },
  { name:'混沌惡魔', emoji:'😈', color:'#8800cc' },
]

export function triggerBounty() {
  const btn = document.getElementById('bounty-btn')
  if (G.bounty && G.bounty.active) { addLog('已有懸賞目標！請先擊殺現有精英怪！', ''); return }
  const cost = 50 + G.townLevel * 30
  if (G.gold < cost) { addLog(`發佈懸賞需要 ${cost} 金幣！`, ''); return }
  G.gold -= cost
  const bases = GAME_DATA.monsters
  const base = bases[Math.min(Math.floor(G.townLevel / 2), bases.length - 1)]
  const etype = ELITE_TYPES[Math.floor(Math.random() * Math.min(G.townLevel, ELITE_TYPES.length))]
  const eliteHp = base.hp * 20, eliteAtk = Math.floor(base.atk * 1.5)
  const goldReward = 80 + G.townLevel * 40, expReward = base.expReward * 8
  const elite = {
    ...base,
    id: 'elite_' + base.id, name: '【精英】' + etype.name, emoji: etype.emoji,
    hp: eliteHp, maxHp: eliteHp, atk: eliteAtk,
    goldMin: goldReward, goldMax: Math.floor(goldReward * 1.5), expReward,
    gx: 16 + Math.floor(Math.random() * 3), gy: 2 + Math.floor(Math.random() * 10),
    dead: false, isElite: true, spawnWeight: 0, bountyGold: goldReward,
  }
  G.monsters.push(elite); G.bounty = { active: true, elite }
  addLog(`🏴‍☠️ 懸賞發佈！【精英】${etype.name} 出現！擊殺獎勵 ${goldReward}金！`, 'level')
  if (btn) { btn.textContent = '懸賞中 💀'; btn.style.opacity = '0.6' }
  updateTopBar()
}

export function forceLevelUp() {
  const cost = Math.floor(G.townExpNeeded * 4)
  if (G.gold < cost) { addLog('升級費用 ' + cost + '金 — 不足！', ''); return }
  G.gold -= cost; G.townExp = G.townExpNeeded
  addLog('💫 花費' + cost + '金加速升星！', 'build')
  checkTownLevelUp(); updateTopBar()
}

// ── Dungeon ──
export function openDungeonMenu() {
  G.dungeon.active = false
  document.getElementById('dungeon-battle').style.display = 'none'
  document.getElementById('battle-result').style.display = 'none'
  const list = document.getElementById('dungeon-floor-list'); list.innerHTML = ''
  GAME_DATA.dungeons.forEach(dg => {
    const locked = G.popularity < dg.reqPop
    const section = document.createElement('div'); section.className = 'dungeon-floor'
    const floorsHTML = dg.floors_data.map((fl, fi) => `
      <div class="dungeon-floor" style="margin:4px 0;background:rgba(0,0,0,.3);">
        <div class="df-head">
          <span class="df-name">${fl.name}</span>
          <span class="df-diff diff-${fl.diff}">${{ easy:'簡單', normal:'普通', hard:'困難', boss:'Boss' }[fl.diff]}</span>
        </div>
        <div class="df-monsters">${fl.monsters.map(m => { const md = GAME_DATA.monsters.find(x => x.id === m); return '<span class="df-mon">' + (md ? md.emoji : '?') + ' ' + (md ? md.name : m) + '</span>' }).join('')}</div>
        <div class="df-rewards">💰${fl.goldReward} EXP+${fl.expReward} 🎁${fl.itemReward}</div>
        <button class="btn-enter-dungeon${locked ? ' locked' : ''}" onclick="${locked ? '' : "enterDungeon('" + dg.id + "'," + fi + ")"}">
          ${locked ? '🔒 需人氣' + dg.reqPop : '⚔ 挑戰此層'}
        </button>
      </div>`).join('')
    section.innerHTML = `<div class="df-head"><span class="df-name" style="font-size:17px;">${dg.emoji} ${dg.name}</span>${locked ? `<span style="font-size:13px;color:var(--red-hi);">🔒 人氣${dg.reqPop}+</span>` : ''}</div>` + floorsHTML
    list.appendChild(section)
  })
  document.getElementById('dungeon-overlay').classList.add('show')
}

export function enterDungeon(dungeonId, floorIndex) {
  const candidates = G.adventurers.filter(a => a.state !== 'InDungeon' && a.hp / a.maxHp > 0.3)
  if (!candidates.length) { addLog('沒有狀態良好的冒險者可挑戰地下城！', ''); return }
  const hero = candidates.sort((a, b) => b.level - a.level)[0]
  const dg = GAME_DATA.dungeons.find(d => d.id === dungeonId)
  const fl = dg.floors_data[floorIndex]
  const monProto = GAME_DATA.monsters.find(m => m.id === fl.monsters[Math.floor(Math.random() * fl.monsters.length)])
  hero.state = 'InDungeon'
  advanceTutorial('dungeon')
  const cls = GAME_DATA.adventurerClasses.find(c => c.id === hero.classId)
  G.dungeon = {
    active: true, hero, dungeonId, floorIndex, floorData: fl,
    potions: 2 + Math.floor(hero.level / 2),
    enemy: {
      ...monProto,
      hp: Math.floor(monProto.hp * fl.hpMult * (1 + hero.level * 0.1)),
      maxHp: Math.floor(monProto.hp * fl.hpMult * (1 + hero.level * 0.1)),
      atk: Math.floor(monProto.atk * fl.atkMult), def: monProto.def,
      name: fl.diff === 'boss' ? 'BOSS ' + monProto.name : monProto.name,
      level: Math.floor(fl.hpMult * 5),
    }
  }
  document.getElementById('dungeon-floor-list').style.display = 'none'
  document.getElementById('dungeon-battle').style.display = 'block'
  document.getElementById('battle-result').style.display = 'none'
  document.getElementById('b-hero-sprite').textContent = cls ? cls.emoji : '🧙'
  document.getElementById('b-hero-name').textContent = hero.name + ' Lv.' + hero.level
  document.getElementById('b-mon-sprite').textContent = monProto.emoji
  document.getElementById('b-mon-name').textContent = G.dungeon.enemy.name
  document.getElementById('b-mon-lv').textContent = G.dungeon.enemy.level
  document.getElementById('b-hero-mp').textContent = Math.floor(hero.mp)
  document.getElementById('ba-item').textContent = '🧪 藥水(' + G.dungeon.potions + ')'
  updateBattleUI()
  const blog = document.getElementById('battle-log-box'); blog.innerHTML = ''
  appendBattleLog('⚔ ' + hero.name + ' 進入 ' + dg.emoji + fl.name + '！', 'b-atk')
  appendBattleLog('遭遇 ' + G.dungeon.enemy.name + '！', 'b-mon')
  ;['ba-attack', 'ba-skill', 'ba-item', 'ba-flee'].forEach(id => { document.getElementById(id).className = 'ba-btn' })
  const skillBtnLabel = cls ? cls.skill.emoji + ' ' + cls.skill.name + ' (MP' + cls.skill.mpCost + ')' : '✨ 技能'
  document.getElementById('ba-skill').textContent = skillBtnLabel
}

function updateBattleUI() {
  const D = G.dungeon; if (!D || !D.hero || !D.enemy) return
  document.getElementById('b-hero-hp-bar').style.width = (D.hero.hp / D.hero.maxHp * 100) + '%'
  document.getElementById('b-hero-hp-txt').textContent = Math.floor(D.hero.hp) + '/' + D.hero.maxHp
  document.getElementById('b-mon-hp-bar').style.width = Math.max(0, D.enemy.hp / D.enemy.maxHp * 100) + '%'
  document.getElementById('b-mon-hp-txt').textContent = Math.floor(D.enemy.hp) + '/' + D.enemy.maxHp
  document.getElementById('b-hero-mp').textContent = Math.floor(D.hero.mp)
  document.getElementById('ba-item').textContent = '🧪 藥水(' + D.potions + ')'
  const cls = GAME_DATA.adventurerClasses.find(c => c.id === D.hero.classId)
  if (cls) document.getElementById('ba-skill').className = 'ba-btn' + (D.hero.mp < cls.skill.mpCost ? ' disabled' : '')
}

function appendBattleLog(text, cls) {
  const log = document.getElementById('battle-log-box')
  const el = document.createElement('div'); if (cls) el.className = cls
  el.textContent = text; log.appendChild(el); log.scrollTop = log.scrollHeight
}

export function battleAction(action) {
  const D = G.dungeon
  if (!D || !D.active || !D.enemy || D.enemy.hp <= 0 || D.hero.hp <= 0) return
  const cls = GAME_DATA.adventurerClasses.find(c => c.id === D.hero.classId)
  let heroDmg = 0
  switch (action) {
    case 'attack':
      heroDmg = Math.max(1, D.hero.atk - D.enemy.def + Math.floor(Math.random() * 8))
      appendBattleLog(D.hero.name + ' 攻擊 → -' + heroDmg + '！', 'b-atk'); break
    case 'skill':
      if (!cls || D.hero.mp < cls.skill.mpCost) { appendBattleLog('MP不足！', 'b-mon'); return }
      heroDmg = Math.max(1, Math.floor(D.hero.atk * cls.skill.dmgMult) - D.enemy.def + Math.floor(Math.random() * 12))
      D.hero.mp -= cls.skill.mpCost
      appendBattleLog(cls.skill.emoji + ' ' + cls.skill.name + '！ → -' + heroDmg + '！', 'b-special'); break
    case 'item':
      if (D.potions <= 0) { appendBattleLog('藥水用完了！', 'b-mon'); return }
      D.potions--
      const heal = Math.floor(D.hero.maxHp * 0.35 + D.hero.level * 5)
      D.hero.hp = Math.min(D.hero.maxHp, D.hero.hp + heal)
      D.hero.mp = Math.min(D.hero.mpMax, D.hero.mp + 3)
      appendBattleLog('🧪 藥水！恢復 +' + heal + 'HP +3MP', 'b-heal')
      updateBattleUI(); return
    case 'flee':
      appendBattleLog('🏃 撤退成功！', 'b-heal'); endDungeonBattle(false); return
  }
  D.enemy.hp -= heroDmg
  if (D.enemy.hp <= 0) { appendBattleLog('✨ 擊敗 ' + D.enemy.name + '！', 'b-special'); endDungeonBattle(true); return }
  const monDmg = Math.max(1, D.enemy.atk - D.hero.def + Math.floor(Math.random() * 6))
  D.hero.hp = Math.max(0, D.hero.hp - monDmg)
  appendBattleLog(D.enemy.emoji + ' 反擊 → -' + monDmg + '！', 'b-mon')
  if (D.hero.hp <= 0) { appendBattleLog('💀 戰鬥失敗！', 'b-mon'); endDungeonBattle(false); return }
  D.hero.mp = Math.min(D.hero.mpMax, D.hero.mp + 0.8)
  updateBattleUI()
}

function endDungeonBattle(won) {
  const D = G.dungeon; D.active = false
  const fl = D.floorData
  const res = document.getElementById('battle-result'); res.style.display = 'block'
  ;['ba-attack', 'ba-skill', 'ba-item', 'ba-flee'].forEach(id => { document.getElementById(id).className = 'ba-btn disabled' })
  if (won) {
    const goldGain = fl.goldReward + Math.floor(Math.random() * fl.goldReward * 0.5)
    const expGain = fl.expReward
    D.hero.gold = Math.min(D.hero.goldCapacity, D.hero.gold + goldGain)
    D.hero.exp += expGain; G.gold += Math.floor(goldGain * 0.3)
    G.stats.dungeons++; G.stats.totalGold += goldGain; G.popularity += 5; G.townExp += 30
    res.innerHTML = '<div style="color:var(--green-hi);font-size:15px;font-weight:700;">🎉 勝利！</div>'
      + '<div style="font-size:14px;margin:6px 0;color:var(--parchment);">💰+' + goldGain + ' EXP+' + expGain + '<br>🎁 ' + fl.itemReward + '！</div>'
      + '<button class="btn-action" onclick="returnFromDungeon()" style="font-size:17px;">返回村莊</button>'
    addLog('🗝 ' + D.hero.name + ' 完成地下城 ' + fl.name + '！+' + goldGain + '金', 'quest')
    checkAdvLevelUp(D.hero); updateQuestProgress(); checkTownLevelUp()
  } else {
    D.hero.hp = Math.max(1, Math.floor(D.hero.maxHp * 0.1))
    res.innerHTML = '<div style="color:var(--red-hi);font-size:15px;font-weight:700;">💀 失敗</div>'
      + '<div style="font-size:14px;margin:6px 0;color:var(--text-dim);">HP剩 ' + Math.floor(D.hero.hp) + '，下次再來！</div>'
      + '<button class="btn-action red" onclick="returnFromDungeon()" style="font-size:17px;">撤退回村</button>'
  }
}

export function returnFromDungeon() {
  const D = G.dungeon
  if (D && D.hero) { D.hero.state = 'EnterTown'; addLog(`🏃 ${D.hero.name} 正在返回村莊...`, '') }
  document.getElementById('dungeon-floor-list').style.display = 'block'
  document.getElementById('dungeon-battle').style.display = 'none'
  ;['ba-attack', 'ba-skill', 'ba-item', 'ba-flee'].forEach(id => { document.getElementById(id).className = 'ba-btn' })
}

export function closeDungeon() {
  const D = G.dungeon; if (D && D.active && D.hero) D.hero.state = 'EnterTown'
  document.getElementById('dungeon-overlay').classList.remove('show')
  document.getElementById('dungeon-floor-list').style.display = 'block'
  document.getElementById('dungeon-battle').style.display = 'none'
  ;['ba-attack', 'ba-skill', 'ba-item', 'ba-flee'].forEach(id => { document.getElementById(id).className = 'ba-btn' })
}

// ── Tutorial ─────────────────────────────────────────────────────────────────
export function initTutorialPanel() {
  const panel = document.getElementById('tutorial-panel')
  if (!panel) return
  renderTutorialPanel()
}

export function renderTutorialPanel() {
  const tut = G.tutorial
  const panel = document.getElementById('tutorial-panel')
  if (!panel) return
  if (!tut.active || tut.step >= tut.steps.length) {
    panel.style.display = 'none'
    return
  }
  panel.style.display = 'block'
  const current = tut.steps[tut.step]
  const items = tut.steps.map((s, i) => {
    const done = i < tut.step
    const active = i === tut.step
    return `<div class="tut-step ${done ? 'done' : ''} ${active ? 'active' : ''}">
      <span class="tut-icon">${done ? '✅' : active ? '▶' : '○'}</span>
      <span>${s.text}</span>
    </div>`
  }).join('')
  panel.innerHTML = `
    <div class="tut-header">📖 新手教學 <span class="tut-progress">${tut.step}/${tut.steps.length}</span></div>
    <div class="tut-steps">${items}</div>
    <div class="tut-hint">👆 ${current.text}</div>
    <button class="tut-skip" onclick="skipTutorial()">跳過教學</button>
  `
}

export function advanceTutorial(stepId) {
  const tut = G.tutorial
  if (!tut.active) return
  if (tut.step >= tut.steps.length) return
  if (tut.steps[tut.step].id !== stepId) return
  tut.steps[tut.step].done = true
  tut.step++
  if (tut.step >= tut.steps.length) {
    tut.active = false
    const panel = document.getElementById('tutorial-panel')
    if (panel) {
      panel.innerHTML = '<div class="tut-complete">🎉 教學完成！祝你遊玩愉快！</div>'
      panel.style.display = 'block'
      setTimeout(() => { panel.style.display = 'none' }, 3000)
    }
    addLog('🎓 新手教學完成！怪物強度恢復正常。', 'level')
    return
  }
  renderTutorialPanel()
}

export function skipTutorial() {
  G.tutorial.active = false
  G.tutorial.step = G.tutorial.steps.length
  const panel = document.getElementById('tutorial-panel')
  if (panel) panel.style.display = 'none'
  addLog('📖 已跳過新手教學。', '')
}

// expose for onclick
window.skipTutorial = skipTutorial
window.upgradeWall  = upgradeWall
window.repairWall   = repairWall
window.closeWallMenu = closeWallMenu
