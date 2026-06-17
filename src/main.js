import { G } from './state.js'
import { initState } from './state.js'
import { GAME_DATA } from './data.js'
import { canvas, resize, screenToGrid, render } from './render.js'
import { updateTopBar, updateResourceDisplay, updateStars, tickEconomy, closeLevelUp } from './economy.js'
import { updateAdventurer, recalcSynergies, applyResidentBonuses } from './fsm.js'
import { tickSiege, tickResourceRespawn, restartGame as _restartGame, openWallMenu, closeWallMenu, upgradeWall, repairWall, openForge, closeForge, forgeUpgrade, repairBuilding } from './systems.js'
import {
  addLog, buildBuildPanel, selectBuilding, cancelPlacing, placeBuilding,
  showBuildingInfo, upgradeBuilding, refineBuilding, instantCompleteBuilding,
  buildAdvPanel, buildResidentPanel, buildQuestPanel, buildSynergyPanel,
  switchLeftTab, switchRightTab, setSpeed, updateQuestProgress, claimQuest,
  openDungeonMenu, enterDungeon, battleAction, returnFromDungeon, closeDungeon,
  recruitAdventurer, triggerBounty, forceLevelUp,
  openSkillTree, closeSkillTree, confirmPromotion,
  initTutorialPanel,
} from './ui.js'
import { saveGame, loadGame, hasSave, deleteSave, getSaveInfo, applyDifficulty, DIFFICULTIES } from './save.js'
import { initAudio, playTrack, setMusicEnabled, setMusicVolume, stopAll } from './audio.js'

// ── Options state ──
let selectedDiff = 'normal'
let fxEnabled = true
export { fxEnabled }

// ── Window exports for HTML onclick ──
Object.assign(window, {
  cancelPlacing, upgradeBuilding, refineBuilding, repairBuilding, instantCompleteBuilding,
  claimQuest, switchLeftTab, switchRightTab, setSpeed,
  openDungeonMenu, enterDungeon, battleAction, returnFromDungeon, closeDungeon,
  recruitAdventurer, triggerBounty, forceLevelUp, closeLevelUp,
  openWallMenu, closeWallMenu, upgradeWall, repairWall,
  openForge, closeForge, forgeUpgrade,
  openSkillTree, closeSkillTree, confirmPromotion,
  restartGame, manualSave,
})

// ── Canvas events ──
canvas.addEventListener('click', e => {
  const rect = canvas.getBoundingClientRect()
  const sx = e.clientX - rect.left, sy = e.clientY - rect.top
  const { x: gx, y: gy } = screenToGrid(sx, sy)
  if (gx < 0 || gy < 0 || gx >= G.gridW || gy >= G.gridH) return
  if (G.placingBuilding) {
    if (G.grid[gy][gx] === 0) placeBuilding(G.placingBuilding, gx, gy)
    else addLog('此格已被佔用！', '')
    return
  }
  const bld = G.buildings.find(b => b.gx === gx && b.gy === gy)
  if (bld) { G.selectedBuildingOnMap = bld; showBuildingInfo(bld) }
  else {
    G.selectedBuildingOnMap = null
    document.getElementById('bld-info').innerHTML = '<div style="color:var(--text-dim);font-size:13px;">點擊建築查看詳情</div>'
  }
})
canvas.addEventListener('contextmenu', e => { e.preventDefault(); cancelPlacing() })

// ── Game loop ──
let lastTime = 0, panelTimer = 0, autoSaveTimer = 0

function gameLoop(ts) {
  if (G.gameOver) return
  const dt = Math.min((ts - lastTime) / 1000, 0.1)
  lastTime = ts

  if (!G.paused) {
    G.adventurers.forEach(adv => updateAdventurer(adv, dt))
    tickEconomy(dt)
    tickResourceRespawn(dt)
    tickSiege(dt)
  }
  render()

  panelTimer += dt
  if (panelTimer > 0.6) {
    panelTimer = 0
    updateTopBar(); updateResourceDisplay(); buildAdvPanel()
    if (document.getElementById('right-tab-residents').style.display !== 'none') buildResidentPanel()
  }

  autoSaveTimer += dt
  if (autoSaveTimer > 120) {
    autoSaveTimer = 0
    saveGame()
    flashSaveIndicator()
  }

  requestAnimationFrame(gameLoop)
}

// ── Save indicator flash ──
function flashSaveIndicator() {
  const el = document.getElementById('save-indicator')
  el.classList.add('show')
  setTimeout(() => el.classList.remove('show'), 2000)
}

export function manualSave() {
  saveGame(); flashSaveIndicator()
}

// ── Init game world ──
function initWorld() {
  initState()
  applyDifficulty(selectedDiff)
  applyResidentBonuses(); recalcSynergies()
  updateTopBar(); updateResourceDisplay(); updateStars()
  buildBuildPanel(); buildQuestPanel()
  setSpeed(1)
  document.getElementById('bld-info').innerHTML = '<div style="color:var(--text-dim);font-size:13px;">點擊建築查看詳情</div>'
  addLog('🏯 山寨物語開始！建造設施，吸引冒險者，壯大你的村莊！', 'level')
}

// ── Start game (hide overlay, start loop) ──
function startGameLoop() {
  document.getElementById('start-overlay').classList.add('hidden')
  initTutorialPanel()
  resize()
  lastTime = performance.now()
  requestAnimationFrame(gameLoop)
  playTrack('day')
}

// ── Restart (called from game over) ──
function restartGame() {
  stopAll()
  deleteSave()
  // Reset all G fields
  const fresh = {
    gold:800, day:1, dayTick:0, dayLength:240, popularity:0, satisfaction:0,
    townLevel:1, townExp:0, townExpNeeded:200,
    buildings:[], adventurers:[], monsters:[], residents:[],
    selectedBuilding:null, placingBuilding:null, speed:1, townIncome:0,
    gridW:22, gridH:16, grid:[],
    atkBuff:0, defBuff:0, expBuff:0, satisfactionBuff:0, incomeBuff:1,
    maxAdventurers:4,
    stats:{ kills:0, totalGold:0, dungeons:0, synergies:0 },
    quests:{},
    synergies:[], activeSynergyMap:{},
    selectedBuildingOnMap:null,
    dungeon:{ active:false, floorData:null, hero:null, enemy:null, floorIndex:0, dungeonId:null, potions:3 },
    unlockedClasses: new Set(['novice','knight','fire_mage','ranger']),
    wall:{ level:0, hp:0, maxHp:0 },
    resourceNodes:[], globalResources:{ wood:0, stone:0, iron:0, water:0, crystal:0 },
    siege:{ active:false, timer:0, interval:180, siegeMonsters:[], warningShown:false },
    nightSiege:{ timer:0, nextIn:90 },
    gameOver:false, bounty:{ active:false, elite:null },
    _lastPanelGold:-1, _buildPanelDirty:true, _lastAdvKey:'', _lastResCount:-1,
    _lastQuestKey:'', _usedNames:null, _questFlash:null,
    buildingCacheDirty:true, buildingCacheKey:'', advIdCounter:1,
    difficulty:'normal', _monsterAtkMult:1, _monsterHpMult:1,
    timeOfDay:0, dayPhase:'day', paused:false,
    tutorial:{ active:true, step:0, steps:[
      { id:'build_house',  text:'建造一間房屋',           done:false },
      { id:'recruit',      text:'招募第一位冒險者',       done:false },
      { id:'build_shop',   text:'建造一間武器店或鎧甲店', done:false },
      { id:'dungeon',      text:'送冒險者進入地下城',     done:false },
    ]},
  }
  Object.assign(G, fresh)
  document.getElementById('gameover-overlay').classList.remove('show')
  document.getElementById('event-log').innerHTML = ''
  initWorld()
  startGameLoop()
}

// ── Options panel ──
function openOptions() {
  document.getElementById('options-overlay').classList.add('show')
  renderDiffCards()
}
function closeOptions() {
  document.getElementById('options-overlay').classList.remove('show')
}
function renderDiffCards() {
  document.querySelectorAll('.diff-card').forEach(card => {
    card.classList.toggle('selected', card.dataset.diff === selectedDiff)
  })
}

// ── Star field background ──
function initStarField() {
  const bg = document.getElementById('star-canvas-bg')
  for (let i = 0; i < 120; i++) {
    const s = document.createElement('div')
    const size = Math.random() * 2 + 0.5
    Object.assign(s.style, {
      position: 'absolute',
      left: Math.random() * 100 + '%',
      top: Math.random() * 100 + '%',
      width: size + 'px', height: size + 'px',
      borderRadius: '50%',
      background: '#fff',
      opacity: Math.random() * 0.6 + 0.1,
      animation: `shimmer ${2 + Math.random() * 4}s ease infinite`,
      animationDelay: Math.random() * 4 + 's',
    })
    bg.appendChild(s)
  }
}

// ── Boot ──
function boot() {
  initStarField()
  resize()
  window.addEventListener('resize', resize)

  // Diff card clicks
  document.querySelectorAll('.diff-card').forEach(card => {
    card.addEventListener('click', () => {
      selectedDiff = card.dataset.diff
      renderDiffCards()
    })
  })

  // SFX / BGM toggle
  document.getElementById('sfx-on').addEventListener('click', () => {
    document.getElementById('sfx-on').classList.add('active')
    document.getElementById('sfx-off').classList.remove('active')
    setMusicEnabled(true)
  })
  document.getElementById('sfx-off').addEventListener('click', () => {
    document.getElementById('sfx-off').classList.add('active')
    document.getElementById('sfx-on').classList.remove('active')
    setMusicEnabled(false)
  })

  // FX toggle
  document.getElementById('fx-on').addEventListener('click', () => {
    fxEnabled = true
    document.getElementById('fx-on').classList.add('active')
    document.getElementById('fx-off').classList.remove('active')
  })
  document.getElementById('fx-off').addEventListener('click', () => {
    fxEnabled = false
    document.getElementById('fx-off').classList.add('active')
    document.getElementById('fx-on').classList.remove('active')
  })

  // Options confirm
  document.getElementById('btn-options-confirm').addEventListener('click', closeOptions)

  // Delete save
  document.getElementById('btn-delete-save').addEventListener('click', () => {
    if (confirm('確定要刪除存檔嗎？')) {
      deleteSave()
      updateStartMenu()
      alert('存檔已刪除')
    }
  })

  // Options open
  document.getElementById('btn-options').addEventListener('click', openOptions)

  // New game
  document.getElementById('btn-new-game').addEventListener('click', () => {
    initWorld()
    startGameLoop()
  })

  // Load game
  document.getElementById('btn-load-game').addEventListener('click', () => {
    if (!hasSave()) return
    if (loadGame()) {
      applyDifficulty(G.difficulty || selectedDiff)
      applyResidentBonuses(); recalcSynergies()
      updateTopBar(); updateResourceDisplay(); updateStars()
      buildBuildPanel(); buildQuestPanel()
      setSpeed(G.speed || 1)
      document.getElementById('bld-info').innerHTML = '<div style="color:var(--text-dim);font-size:13px;">點擊建築查看詳情</div>'
      addLog('📂 讀取存檔成功！第 ' + G.day + ' 天繼續冒險！', 'level')
      startGameLoop()
    }
  })

  updateStartMenu()
}

function updateStartMenu() {
  const loadBtn = document.getElementById('btn-load-game')
  const preview = document.getElementById('save-preview')
  const deleteBtn = document.getElementById('btn-delete-save')
  const info = getSaveInfo()
  if (info) {
    loadBtn.classList.remove('disabled')
    preview.style.display = 'block'
    preview.innerHTML = `存檔：第 <span>${info.day}</span> 天 · <span>${info.gold}</span>💰 · ${info.savedAt}`
    deleteBtn.style.display = 'inline-block'
  } else {
    loadBtn.classList.add('disabled')
    preview.style.display = 'none'
    deleteBtn.style.display = 'none'
  }
}

boot()
