import { G } from './state.js'
import { GAME_DATA } from './data.js'
import { gridToScreen, addCombatFX, spawnParticles } from './render.js'
// addLog, updateQuestProgress, updateTopBar imported lazily to avoid circular init issues
import { addLog, updateQuestProgress } from './ui.js'
import { depositToTown, updateTopBar, updateResourceDisplay, checkTownLevelUp } from './economy.js'
import { autoForgeIfPossible } from './systems.js'

export function setState(adv, s) { adv.state = s; adv.stateTimer = 0 }

export function moveTowardGrid(adv, tgx, tgy, dt) {
  const t = gridToScreen(tgx, tgy)
  const tx = t.x, ty = t.y - 10
  const dx = tx - adv.screenX, dy = ty - adv.screenY
  const dist = Math.sqrt(dx * dx + dy * dy)
  if (dist < 4) return true
  const spd = 58 * adv.spd * G.speed
  adv.screenX += (dx / dist) * spd * dt; adv.screenY += (dy / dist) * spd * dt
  return false
}

export function createAdventurer() {
  const pop = G.popularity
  const avail = GAME_DATA.adventurerClasses.filter(c => G.unlockedClasses.has(c.id) && pop >= c.unlockPop)
  const cls = avail[Math.floor(Math.random() * avail.length)] || GAME_DATA.adventurerClasses[0]
  const level = Math.max(1, Math.floor(Math.random() * 3))
  const names = [
    '艾登','雷恩','莉娜','科爾','賽拉','菲恩','艾斯','洛可','妮亞','薩姆',
    '艾瑪','里昂','奧丁','薇薇','克拉','德魯','伊莉','賈斯','羅文','席拉',
    '凱登','艾娃','盧卡','諾亞','佐伊','伊森','梅雅','奧利','艾薇','芬恩',
    '卡爾','黛娜','波特','賽門','艾拉','麥斯','葛蕾','泰勒','布蕾','哈柏',
    '里奧','薩拉','傑克','安娜','湯姆','伊莎','金斯','瑪雅','東尼','羅拉',
    '雲峰','玉蘭','鐵柱','小紅','大壯','翠花','阿龍','秀英','建國','麗華',
    '志遠','曉燕','建明','淑芬','偉強','美玲','文傑','桂芳','國強','秀梅',
  ]
  if (!G._usedNames) G._usedNames = new Set()
  const unused = names.filter(n => !G._usedNames.has(n))
  const namePool = unused.length > 0 ? unused : names
  const chosenName = namePool[Math.floor(Math.random() * namePool.length)]
  G._usedNames.add(chosenName)

  return {
    id: G.advIdCounter++, name: chosenName,
    classId: cls.id, level,
    hp: cls.baseHP + level * 20, maxHp: cls.baseHP + level * 20,
    atk: cls.baseATK + level * 3, def: cls.baseDEF + level * 2, spd: cls.baseSPD,
    mp: cls.mpMax, mpMax: cls.mpMax,
    gold: 0, exp: 0, expNeeded: cls.expToLevel * level,
    goldCapacity: cls.goldCapacity + level * 50,
    satisfaction: 30 + Math.random() * 20,
    state: 'EnterTown', stateTimer: 0, targetBuilding: null,
    screenX: 0, screenY: 0,
    inFieldGX: 15 + Math.floor(Math.random() * 4), inFieldGY: Math.floor(Math.random() * 8) + 1,
    combatTarget: null, combatTimer: 0,
    isResident: false, residentJob: null,
    satisfactionTimer: 0,
    shieldLevel: 0, blockChance: 0,
    _blockAnim: 0, _attackPose: 0, _lastDx: 0, _prevX: undefined,
    homeGX: null, homeGY: null,
    restTimer: 0, isHomeless: false,
    skills: [], skillCooldowns: {}, canPromote: false,
    _passiveBlockBonus: 0, _rangeBonus: 0, _combatSpeedMult: 1, _mpRegenMult: 1,
    _bloodThirst: false, _darkAura: false, _holyAura: false,
  }
}

export function applySkillPassive(adv, passive) {
  const fx = passive.statEffect || {}
  if (fx.hpMult)        { adv.maxHp = Math.floor(adv.maxHp * fx.hpMult); adv.hp = adv.maxHp }
  if (fx.atkMult)       { adv.atk  = Math.floor(adv.atk  * fx.atkMult) }
  if (fx.defMult)       { adv.def  = Math.floor(adv.def  * fx.defMult) }
  if (fx.mpMult)        { adv.mpMax = Math.floor(adv.mpMax * fx.mpMult); adv.mp = adv.mpMax }
  if (fx.blockBonus)    { adv._passiveBlockBonus = (adv._passiveBlockBonus || 0) + fx.blockBonus }
  if (fx.rangeFlatBonus){ adv._rangeBonus = (adv._rangeBonus || 0) + fx.rangeFlatBonus }
  if (fx.speedMult)     { adv._combatSpeedMult = fx.speedMult }
  if (fx.mpRegenMult)   { adv._mpRegenMult = fx.mpRegenMult }
  if (fx.bloodThirst)   { adv._bloodThirst = true }
  if (fx.darkAura)      { adv._darkAura    = true }
  if (fx.holyAura)      { adv._holyAura    = true }
}

export function checkAdvLevelUp(adv) {
  if (adv.exp >= adv.expNeeded) {
    adv.exp -= adv.expNeeded; adv.level++
    const cls = GAME_DATA.adventurerClasses.find(c => c.id === adv.classId)
    adv.maxHp += 20; adv.hp = adv.maxHp; adv.atk += 3; adv.def += 2; adv.mpMax += 1; adv.mp = adv.mpMax
    if (cls) adv.expNeeded = cls.expToLevel * adv.level
    addLog(`🎉 ${adv.name} 升至 Lv.${adv.level}！`, 'level')
    G.popularity += 2
  }
  // Check if promotion is available
  const promo = GAME_DATA.classPromotions[adv.classId]
  if (promo && adv.level >= promo.reqLevel && !adv.canPromote) {
    adv.canPromote = true
    addLog(`✨ ${adv.name} 可以升職了！點擊冒險者資料查看！`, 'level')
  }
}

export function trySpawnMonster(adv) {
  if (G.monsters.filter(m => !m.dead).length >= G.adventurers.length * 2 + 4) return
  const wt = []; GAME_DATA.monsters.forEach(m => { for (let i = 0; i < m.spawnWeight; i++) wt.push(m) })
  const proto = wt[Math.floor(Math.random() * wt.length)]
  G.monsters.push({ ...proto, gx: 15 + Math.floor(Math.random() * 5), gy: 1 + Math.floor(Math.random() * (G.gridH - 3)), hp: proto.hp, maxHp: proto.hp, dead: false })
}

export function promoteResident(adv) {
  adv.isResident = true
  const jobCandidates = GAME_DATA.residentJobs.filter(j => G.buildings.some(b => b.id === j.reqBuilding))
  const usedJobs = G.residents.map(r => r.residentJob?.id)
  const freeJobs = jobCandidates.filter(j => !usedJobs.includes(j.id))
  adv.residentJob = freeJobs.length ? freeJobs[Math.floor(Math.random() * freeJobs.length)] : jobCandidates[0] || null
  G.residents.push(adv)
  addLog(`🏠 ${adv.name} 成為了村民！職業：${adv.residentJob?.name || '自由民'}`, 'resident')
  G.popularity += 5; G.townExp += 50
  applyResidentBonuses(); updateQuestProgress(); updateTopBar(); checkTownLevelUp()
  document.getElementById('res-count-val').textContent = G.residents.length
}

export function applyResidentBonuses() {
  G.atkBuff = 0; G.defBuff = 0; G.expBuff = 0; G.satisfactionBuff = 0; G.incomeBuff = 1
  G.maxAdventurers = 4 + G.townLevel * 2
  G.buildings.forEach(b => {
    const d = GAME_DATA.buildings.find(x => x.id === b.id); if (!d) return
    const mult = 1 + (b.level - 1) * 0.5
    if (d.buffStat === 'atk') G.atkBuff += d.buffAmt * mult
    if (d.buffStat === 'def') G.defBuff += d.buffAmt * mult
    if (d.buffStat === 'exp') G.expBuff += d.buffAmt * mult
    if (d.buffStat === 'satisfaction') G.satisfactionBuff += d.buffAmt * mult
  })
  G.residents.forEach(r => {
    if (!r.residentJob) return
    switch (r.residentJob.id) {
      case 'blacksmith':  G.atkBuff += 3; break
      case 'armorer':     G.defBuff += 3; break
      case 'baker':       G.satisfactionBuff += 5; break
      case 'merchant':    G.incomeBuff += 0.15; break
      case 'guildmaster': G.maxAdventurers += 3; break
    }
  })
  const armorShop = G.buildings.find(b => b.id === 'armor_shop')
  const armorLv = armorShop ? armorShop.level : 0
  G.adventurers.forEach(adv => {
    const cls = GAME_DATA.adventurerClasses.find(c => c.id === adv.classId)
    const base = cls ? cls.baseBlock : 0.05
    const shieldBonus = [0, 0.10, 0.18, 0.28][armorLv] || 0
    const armorerBonus = G.residents.filter(r => r.residentJob?.id === 'armorer').length * 0.08
    adv.shieldLevel = armorLv
    adv.blockChance = Math.min(0.60, base + shieldBonus + armorerBonus + (adv._passiveBlockBonus || 0))
  })
}

export function recalcSynergies() {
  G.activeSynergyMap = {}
  const newSynergies = []
  GAME_DATA.buildings.forEach(bd => {
    const placed = G.buildings.find(b => b.id === bd.id)
    if (!placed || !bd.synergyWith) return
    bd.synergyWith.forEach(partnerId => {
      const partner = G.buildings.find(b => b.id === partnerId); if (!partner) return
      const dist = Math.abs(placed.gx - partner.gx) + Math.abs(placed.gy - partner.gy)
      if (dist <= 4) {
        const synergyKey = `${bd.id}-${partnerId}`
        if (!newSynergies.includes(synergyKey)) {
          newSynergies.push(synergyKey)
          G.activeSynergyMap[bd.id] = true; G.activeSynergyMap[partnerId] = true
        }
      }
    })
  })
  const gained = newSynergies.filter(s => !G.synergies.includes(s))
  gained.forEach(s => {
    const [a, b] = s.split('-')
    const bdA = GAME_DATA.buildings.find(x => x.id === a)
    const bdB = GAME_DATA.buildings.find(x => x.id === b)
    if (bdA && bdB) {
      showSynergyPopup(`⚡ 連鎖！${bdA.emoji}${bdA.name} × ${bdB.emoji}${bdB.name}\n${bdA.synergyBonus}`)
      addLog(`⚡ 連鎖效果！${bdA.name} + ${bdB.name} → ${bdA.synergyBonus}`, 'build')
      G.stats.synergies++; updateQuestProgress()
    }
  })
  G.synergies = newSynergies
  applyResidentBonuses()
  // rebuild synergy panel if visible
  const panel = document.getElementById('left-tab-synergy')
  if (panel && panel.style.display !== 'none') {
    import('./ui.js').then(m => m.buildSynergyPanel())
  }
}

export function showSynergyPopup(text) {
  const old = document.querySelector('.synergy-popup'); if (old) old.remove()
  const div = document.createElement('div')
  div.className = 'synergy-popup'; div.style.whiteSpace = 'pre-line'; div.textContent = text
  document.body.appendChild(div)
  setTimeout(() => div.remove(), 2600)
}

export function updateAdventurer(adv, dt) {
  if (adv.state === 'InDungeon') return
  adv.stateTimer += dt * G.speed
  const mpRate = 0.3 * (adv._mpRegenMult || 1)
  adv.mp = Math.min(adv.mpMax, adv.mp + dt * G.speed * mpRate)
  // Tick active skill cooldowns
  for (const sid in adv.skillCooldowns) {
    adv.skillCooldowns[sid] = Math.max(0, adv.skillCooldowns[sid] - dt * G.speed)
  }

  adv.satisfactionTimer += dt * G.speed
  if (adv.satisfactionTimer > 5) {
    adv.satisfactionTimer = 0
    const nearShop = G.buildings.some(b => {
      const d = GAME_DATA.buildings.find(x => x.id === b.id)
      return d && d.buffStat === 'satisfaction'
    })
    adv.satisfaction = Math.min(100, adv.satisfaction + (nearShop ? 1 : 0.2))
    if (!adv.isResident && adv.satisfaction >= 85 && G.residents.length < 8 && adv.level >= 2) {
      promoteResident(adv)
    }
  }

  switch (adv.state) {
    case 'EnterTown':
      if (adv.homeGX !== null && adv.homeGY !== null) {
        const homeStillExists = G.buildings.find(b => b.id === 'house' && b.gx === adv.homeGX && b.gy === adv.homeGY)
        if (!homeStillExists) { adv.isHomeless = true; adv.homeGX = null; adv.homeGY = null }
      }
      if (adv.isHomeless) { setState(adv, 'Homeless'); break }
      if (adv.restTimer > 0) {
        adv.restTimer = Math.max(0, adv.restTimer - dt * G.speed)
        const hx = adv.homeGX ?? 5, hy = adv.homeGY ?? 7
        moveTowardGrid(adv, hx, hy, dt); break
      }
      {
        const hx2 = adv.homeGX ?? 5, hy2 = adv.homeGY ?? 7
        moveTowardGrid(adv, hx2, hy2, dt)
        if (adv.stateTimer > 2.5 / G.speed) setState(adv, 'Idle')
      }
      break

    case 'Homeless':
      moveTowardGrid(adv, 5, 7, dt)
      if (!adv.isHomeless) { setState(adv, 'Idle'); break }
      if (adv.stateTimer > 3 / G.speed) {
        adv.stateTimer = 0
        const vacantHouse = G.buildings.find(b =>
          b.id === 'house' && !b.constructing && !G.adventurers.some(a => a !== adv && a.homeGX === b.gx && a.homeGY === b.gy)
        )
        if (vacantHouse) {
          adv.homeGX = vacantHouse.gx; adv.homeGY = vacantHouse.gy; adv.isHomeless = false
          setState(adv, 'Idle')
          addLog(`🏠 ${adv.name} 搬入新住宅！可以再出戰了！`, 'earn')
        }
      }
      break

    case 'Idle':
      if (adv.stateTimer > (1.5 + Math.random() * 2.5) / G.speed) {
        const hpPct = adv.hp / adv.maxHp, goldPct = adv.gold / adv.goldCapacity
        if (hpPct < 0.25) {
          const inn = G.buildings.find(b => b.id === 'inn')
          if (inn) { adv.targetBuilding = inn; setState(adv, 'MovingToFacility') }
          else setState(adv, 'Resting')
        } else if (goldPct > 0.65 && G.buildings.length > 0) {
          const shops = G.buildings.filter(b => b.id !== 'inn' && b.id !== 'temple')
          if (shops.length) { adv.targetBuilding = shops[Math.floor(Math.random() * shops.length)]; setState(adv, 'MovingToFacility') }
          else setState(adv, 'ExploringField')
        } else if (hpPct > 0.4) {
          setState(adv, 'ExploringField')
        } else {
          const inn = G.buildings.find(b => b.id === 'inn')
          if (inn) { adv.targetBuilding = inn; setState(adv, 'MovingToFacility') }
          else setState(adv, 'Resting')
        }
      }
      break

    case 'MovingToFacility':
      if (!adv.targetBuilding) { setState(adv, 'Idle'); break }
      {
        const reached = moveTowardGrid(adv, adv.targetBuilding.gx, adv.targetBuilding.gy, dt)
        if (reached || adv.stateTimer > 4.5 / G.speed) {
          if (adv.targetBuilding.id === 'inn') setState(adv, 'Resting')
          else setState(adv, 'Shopping')
        }
      }
      break

    case 'Shopping': {
      const bd = GAME_DATA.buildings.find(d => d.id === adv.targetBuilding?.id)
      if (adv.stateTimer > 1.8 / G.speed && bd) {
        const spend = Math.min(adv.gold, 25 + Math.floor(Math.random() * 25))
        if (spend > 0 && adv.gold >= spend) {
          adv.gold -= spend
          const tax = spend * (0.55 + G.residents.filter(r => r.residentJob?.id === 'merchant').length * 0.05)
          depositToTown(tax, 'Shop Tax')
          if (bd.buffStat === 'atk') adv.atk += 1
          if (bd.buffStat === 'def') adv.def += 1
          adv.satisfaction = Math.min(100, adv.satisfaction + 3)
          G.satisfaction = Math.min(100, G.satisfaction + bd.satisfaction * 0.08)
          addLog(`${adv.name} 在${bd.emoji}消費 ${spend}金`, 'earn')
        }
        setState(adv, 'Idle')
      }
      break
    }

    case 'Resting': {
      const innCount = G.buildings.filter(b => b.id === 'inn').length
      const priestBonus = G.residents.filter(r => r.residentJob?.id === 'priest').length * 0.4
      const healRate = (7 + innCount * 5) * (1 + priestBonus) * dt * G.speed
      adv.hp = Math.min(adv.maxHp, adv.hp + healRate)
      adv.mp = Math.min(adv.mpMax, adv.mp + dt * G.speed * 0.8)
      if (adv.stateTimer > 0.4 / G.speed) {
        if (G.buildings.find(b => b.id === 'inn') && adv.gold >= 12) {
          adv.gold -= 12; depositToTown(8, 'Inn')
        }
      }
      if (adv.hp >= adv.maxHp * 0.88 || adv.stateTimer > 7 / G.speed) setState(adv, 'Idle')
      break
    }

    case 'GatheringResource': {
      if (!adv._gatherTarget) { setState(adv, 'ExploringField'); break }
      const rn = adv._gatherTarget
      const reachedNode = moveTowardGrid(adv, rn.gx, rn.gy, dt)
      if (reachedNode || adv.stateTimer > 6 / G.speed) {
        adv.stateTimer = 0
        if (rn.stock > 0) {
          rn.stock = Math.max(0, rn.stock - 1)
          const rdata = GAME_DATA.resources.find(r => r.id === rn.type)
          G.globalResources[rn.type] = (G.globalResources[rn.type] || 0) + 1
          addCombatFX(adv.screenX, adv.screenY - 20, '+1' + (rdata ? rdata.emoji : '?'), rdata ? rdata.color : '#888', 'text')
          addLog(`${adv.name} 採集了 ${rdata ? rdata.emoji : ''}${rdata ? rdata.name : rn.type}！`, 'earn')
          updateResourceDisplay()
        }
        if (rn.stock <= 0 || (G.globalResources[rn.type] || 0) >= 20) {
          adv._gatherTarget = null
          autoForgeIfPossible()
          setState(adv, 'EnterTown')
        } else {
          adv.stateTimer = 0
        }
      }
      if (adv.hp / adv.maxHp < 0.2) { adv._gatherTarget = null; setState(adv, 'EnterTown') }
      break
    }

    case 'ExploringField':
      moveTowardGrid(adv, adv.inFieldGX, adv.inFieldGY, dt)
      if (adv.stateTimer > (1.2 + Math.random() * 1.8) / G.speed) {
        adv.stateTimer = 0
        const cls2 = GAME_DATA.adventurerClasses.find(c => c.id === adv.classId)
        const detectRange = cls2 ? (cls2.attackType === 'melee' ? 2 : cls2.attackRange + 1) : 2
        const nearby = G.monsters.find(m => !m.dead && Math.abs(m.gx - adv.inFieldGX) < detectRange && Math.abs(m.gy - adv.inFieldGY) < detectRange)
        if (nearby) { adv.combatTarget = nearby; setState(adv, 'Combat') }
        else if (Math.random() < 0.35) trySpawnMonster(adv)
        else {
          if (Math.random() < 0.20) {
            const availNodes = G.resourceNodes.filter(n => n.stock > 0)
            if (availNodes.length) {
              adv._gatherTarget = availNodes[Math.floor(Math.random() * availNodes.length)]
              setState(adv, 'GatheringResource'); break
            }
          }
          adv.inFieldGX = 15 + Math.floor(Math.random() * 5)
          adv.inFieldGY = 1 + Math.floor(Math.random() * (G.gridH - 3))
        }
      }
      if (adv.hp / adv.maxHp < 0.28 || adv.gold >= adv.goldCapacity * 0.88 || adv.isHomeless) setState(adv, 'EnterTown')
      break

    case 'Combat':
      if (!adv.combatTarget || adv.combatTarget.dead) {
        adv.combatTarget = null; adv._attackPose = 0; setState(adv, 'ExploringField'); break
      }
      if (adv._attackPose > 0) adv._attackPose = Math.max(0, adv._attackPose - dt * G.speed * 3)
      if (adv._blockAnim > 0) adv._blockAnim = Math.max(0, adv._blockAnim - dt * G.speed * 4)
      {
        const cls = GAME_DATA.adventurerClasses.find(c => c.id === adv.classId)
        const atype = cls ? cls.attackType : 'melee'
        const attackRange = cls ? cls.attackRange : 1
        const m = adv.combatTarget
        const gridDist = Math.abs(adv.inFieldGX - m.gx) + Math.abs(adv.inFieldGY - m.gy)
        if (atype === 'melee' && gridDist > attackRange) {
          const reached = moveTowardGrid(adv, m.gx, m.gy, dt)
          if (reached) { adv.inFieldGX = m.gx; adv.inFieldGY = m.gy }
          adv.combatTimer += dt * G.speed * 0.3; break
        }
      }
      const attackThreshold = 0.75 * (adv._combatSpeedMult || 1)
      adv.combatTimer += dt * G.speed
      if (adv.combatTimer > attackThreshold) {
        adv.combatTimer = 0
        const m = adv.combatTarget
        const cls = GAME_DATA.adventurerClasses.find(c => c.id === adv.classId)
        const atype = cls ? cls.attackType : 'melee'
        const { x: mx, y: my } = gridToScreen(m.gx, m.gy)
        const ax = adv.screenX, ay = adv.screenY

        // Determine which skill to use: promoted active skill (CD ready) or base class skill
        const csEntry = GAME_DATA.classSkills[adv.classId]
        const activeSkill = csEntry ? csEntry.active : null
        const activeCdReady = activeSkill && (adv.skillCooldowns[activeSkill.id] || 0) === 0
        const useActiveSkill = activeCdReady && Math.random() < 0.35
        const useBaseSkill = !useActiveSkill && cls && adv.mp >= cls.skill.mpCost && Math.random() < 0.28
        const useSkill = useActiveSkill || useBaseSkill
        let dmgToMon

        if (useActiveSkill) {
          const def = activeSkill.ignoreDef ? 0 : m.def
          dmgToMon = Math.max(1, Math.floor(adv.atk * activeSkill.dmgMult) - def + Math.floor(Math.random() * 8))
          adv.skillCooldowns[activeSkill.id] = activeSkill.cd
          adv._attackPose = 1
          const stype = activeSkill.skillType || atype
          if (stype === 'melee') {
            addCombatFX(mx, my - 10, '', '#ffffff', 'slash2')
            spawnParticles(mx, my - 10, '#cc88ff', 10, 20, 3.5)
            setTimeout(() => addCombatFX(mx, my - 28, activeSkill.emoji + ' ' + dmgToMon, '#cc88ff', 'text'), 180)
          } else if (stype === 'ranged') {
            addCombatFX(ax, ay - 10, '', '#88ffaa', 'multiArrow', mx, my - 10)
            setTimeout(() => { spawnParticles(mx, my - 10, '#aaff88', 8, 16, 3); addCombatFX(mx, my - 28, activeSkill.emoji + ' ' + dmgToMon, '#88ff88', 'text') }, 340)
          } else {
            addCombatFX(ax, ay - 18, '', '#ff88ff', 'fireball', mx, my - 10)
            setTimeout(() => { addCombatFX(mx, my - 10, '', '#ff88ff', 'explosion'); spawnParticles(mx, my - 10, '#ff88ff', 14, 24, 4); addCombatFX(mx, my - 32, activeSkill.emoji + ' ' + dmgToMon, '#ff88ff', 'text') }, 400)
          }
          // Special active skill effects
          if (activeSkill.healPct)    { const heal = Math.floor(dmgToMon * activeSkill.healPct); adv.hp = Math.min(adv.maxHp, adv.hp + heal) }
          if (activeSkill.selfDmgPct) { adv.hp = Math.max(1, adv.hp - Math.floor(adv.maxHp * activeSkill.selfDmgPct)) }
        } else if (useBaseSkill) {
          dmgToMon = Math.max(1, Math.floor(adv.atk * cls.skill.dmgMult) - m.def + Math.floor(Math.random() * 6))
          adv.mp -= cls.skill.mpCost; adv._attackPose = 1
          const stype = cls.skill.skillType || atype
          if (stype === 'melee') {
            addCombatFX(mx, my - 10, '', '#ffffff', 'slash2')
            spawnParticles(mx, my - 10, '#ffcc44', 8, 18, 3)
            setTimeout(() => addCombatFX(mx, my - 28, cls.skill.emoji + ' ' + dmgToMon, '#ffee44', 'text'), 180)
          } else if (stype === 'ranged') {
            addCombatFX(ax, ay - 10, '', '#88ff44', 'multiArrow', mx, my - 10)
            setTimeout(() => { spawnParticles(mx, my - 10, '#aaff44', 6, 14, 2.5); addCombatFX(mx, my - 28, cls.skill.emoji + ' ' + dmgToMon, '#88ff44', 'text') }, 340)
          } else if (stype === 'magic') {
            const isMageDmg = (cls.id === 'fire_mage')
            addCombatFX(ax, ay - 18, '', isMageDmg ? '#ff6600' : '#ffeeaa', 'fireball', mx, my - 10)
            setTimeout(() => {
              addCombatFX(mx, my - 10, '', '#ff8800', isMageDmg ? 'explosion' : 'holy')
              spawnParticles(mx, my - 10, isMageDmg ? '#ff6600' : '#eeeeff', 12, 22, 3.5)
              addCombatFX(mx, my - 32, cls.skill.emoji + ' ' + dmgToMon, isMageDmg ? '#ff8844' : '#eeeeff', 'text')
            }, 400)
          }
        } else {
          dmgToMon = Math.max(1, adv.atk - m.def + Math.floor(Math.random() * 5))
          adv._attackPose = 0.6
          if (atype === 'melee') {
            addCombatFX(mx, my - 8, '', '#ffaa44', 'slash')
            spawnParticles(mx, my - 8, '#ffcc88', 5, 12, 2)
            setTimeout(() => addCombatFX(mx, my - 26, '-' + dmgToMon, '#ff5555', 'text'), 120)
          } else if (atype === 'ranged') {
            addCombatFX(ax, ay - 10, '', '#88ff44', 'arrow', mx, my - 10)
            setTimeout(() => { addCombatFX(mx, my - 10, '', '#aaffaa', 'hit'); addCombatFX(mx, my - 26, '-' + dmgToMon, '#88ff44', 'text') }, 320)
          } else if (atype === 'magic') {
            addCombatFX(ax, ay - 18, '', '#cc88ff', 'fireball', mx, my - 10)
            setTimeout(() => { addCombatFX(mx, my - 10, '', '#cc88ff', 'explosion'); spawnParticles(mx, my - 10, '#cc88ff', 7, 16, 2.5); addCombatFX(mx, my - 26, '-' + dmgToMon, '#cc88ff', 'text') }, 360)
          }
        }
        // Passive: blood thirst — heal on hit
        if (adv._bloodThirst && dmgToMon > 0) { adv.hp = Math.min(adv.maxHp, adv.hp + Math.floor(dmgToMon * 0.08)) }

        m.hp -= dmgToMon
        if (m.hp <= 0) {
          m.dead = true
          const gold = m.goldMin + Math.floor(Math.random() * (m.goldMax - m.goldMin))
          const exp = m.expReward
          const goldMult = 1 + (G.buildings.filter(b => b.id === 'market').length * 0.1) + G.expBuff / 200
          adv.gold = Math.min(adv.goldCapacity, adv.gold + Math.floor(gold * goldMult))
          adv.exp += exp * (1 + G.expBuff / 100)
          G.stats.kills++; G.stats.totalGold += gold
          spawnParticles(mx, my, '#f0a500', 10, 20, 3)
          addCombatFX(mx, my - 34, '+' + Math.floor(gold * goldMult) + '💰', '#f0a500', 'text')
          if (m.isElite) {
            const bonusGold = m.bountyGold || 80
            G.gold += bonusGold; G.bounty = { active: false }
            const btn = document.getElementById('bounty-btn')
            if (btn) { btn.textContent = '懸賞 🏴‍☠️'; btn.style.opacity = '1' }
            addLog(`🏆 ${adv.name} 擊殺精英怪【${m.name}】！獎勵 +${bonusGold}金 +${Math.floor(gold * goldMult)}金 +${exp}EXP！`, 'level')
            import('./ui.js').then(mod => mod.showQuestCompleteEffect('懸賞完成！+' + bonusGold + '金', false))
          } else {
            addLog(`${adv.name} 擊敗${m.name}！+${Math.floor(gold * goldMult)}金 +${exp}EXP`, 'combat')
          }
          G.popularity += m.isElite ? 3 : 0.5
          checkAdvLevelUp(adv)
          adv.combatTarget = null; adv._attackPose = 0
          setState(adv, 'ExploringField')
          updateQuestProgress()
          setTimeout(() => { const i = G.monsters.indexOf(m); if (i > -1) G.monsters.splice(i, 1) }, 1200)
        } else {
          const blockRoll = Math.random()
          const blocked = blockRoll < (adv.blockChance || 0)
          if (blocked) {
            adv._blockAnim = 1
            addCombatFX(ax, ay - 14, '🛡 BLOCK!', '#88ccff', 'text')
            spawnParticles(ax, ay - 10, '#88aaff', 5, 10, 1.5)
          } else {
            const dmgToAdv = Math.max(1, m.atk - adv.def + Math.floor(Math.random() * 4))
            adv.hp -= dmgToAdv
            addCombatFX(ax, ay - 18, '-' + dmgToAdv, '#ff8833', 'text')
            spawnParticles(ax, ay - 10, '#ff6644', 4, 10, 1.8)
            // Passive: dark aura — reflect 10% damage back
            if (adv._darkAura) {
              const reflect = Math.floor(dmgToAdv * 0.1); m.hp -= reflect
              if (m.hp <= 0 && !m.dead) { m.dead = true; setTimeout(() => { const i = G.monsters.indexOf(m); if (i > -1) G.monsters.splice(i, 1) }, 1200) }
            }
            if (adv.hp <= 0) {
              adv.hp = 1; adv._attackPose = 0; adv.restTimer = 10
              addLog(`💔 ${adv.name} 倒下了！需要回家休息 10 秒...`, 'combat')
              adv.combatTarget = null; setState(adv, 'EnterTown')
            }
          }
        }
      }
      break
  }
}
