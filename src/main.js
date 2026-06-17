import { G } from './state.js'
import { GAME_DATA } from './data.js'
import { canvas, resize, screenToGrid, render } from './render.js'
import { updateTopBar, updateResourceDisplay, updateStars, tickEconomy, closeLevelUp } from './economy.js'
import { updateAdventurer, recalcSynergies, applyResidentBonuses } from './fsm.js'
import { tickSiege, tickResourceRespawn, restartGame, openWallMenu, closeWallMenu, upgradeWall, repairWall, openForge, closeForge, forgeUpgrade, repairBuilding } from './systems.js'
import {
  addLog, buildBuildPanel, selectBuilding, cancelPlacing, placeBuilding,
  showBuildingInfo, upgradeBuilding, refineBuilding, buildAdvPanel, buildResidentPanel,
  buildQuestPanel, buildSynergyPanel, switchLeftTab, switchRightTab, setSpeed,
  updateQuestProgress, claimQuest, openDungeonMenu, enterDungeon, battleAction,
  returnFromDungeon, closeDungeon, recruitAdventurer, triggerBounty, forceLevelUp
} from './ui.js'

// ── Expose functions for HTML onclick handlers ──
Object.assign(window, {
  cancelPlacing, upgradeBuilding, refineBuilding, repairBuilding,
  claimQuest, switchLeftTab, switchRightTab, setSpeed,
  openDungeonMenu, enterDungeon, battleAction, returnFromDungeon, closeDungeon,
  recruitAdventurer, triggerBounty, forceLevelUp, closeLevelUp,
  openWallMenu, closeWallMenu, upgradeWall, repairWall,
  openForge, closeForge, forgeUpgrade, restartGame,
})

// ── Canvas click: place building or select ──
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
  if (bld) {
    G.selectedBuildingOnMap = bld
    showBuildingInfo(bld)
  } else {
    G.selectedBuildingOnMap = null
    document.getElementById('bld-info').innerHTML = '<div style="color:var(--text-dim);font-size:13px;">點擊建築查看詳情</div>'
  }
})

canvas.addEventListener('contextmenu', e => {
  e.preventDefault(); cancelPlacing()
})

// ── Game loop ──
let lastTime = 0, panelTimer = 0

function gameLoop(ts) {
  if (G.gameOver) return
  const dt = Math.min((ts - lastTime) / 1000, 0.1)
  lastTime = ts

  G.adventurers.forEach(adv => updateAdventurer(adv, dt))
  tickEconomy(dt)
  tickResourceRespawn(dt)
  tickSiege(dt)
  render()

  panelTimer += dt
  if (panelTimer > 0.6) {
    panelTimer = 0
    updateTopBar()
    updateResourceDisplay()
    buildAdvPanel()
    if (document.getElementById('right-tab-residents').style.display !== 'none') buildResidentPanel()
  }

  requestAnimationFrame(gameLoop)
}

// ── Init ──
function init() {
  resize()
  window.addEventListener('resize', resize)

  // Initialize quest state
  GAME_DATA.quests.forEach(q => {
    if (!G.quests[q.id]) G.quests[q.id] = { progress: 0, claimed: false }
  })

  // Initialize resource nodes
  GAME_DATA.resourceNodes.forEach((rn, i) => {
    if (!G.resourceNodes[i]) G.resourceNodes[i] = { ...rn, respawnTimer: 0, depleted: false }
  })

  // Initialize unlocked classes
  if (!G.unlockedClasses) G.unlockedClasses = new Set(['novice', 'knight'])

  // Grid
  G.grid = Array.from({ length: G.gridH }, () => Array(G.gridW).fill(0))

  applyResidentBonuses()
  recalcSynergies()
  updateTopBar()
  updateResourceDisplay()
  updateStars()
  buildBuildPanel()
  buildQuestPanel()

  setSpeed(1)

  addLog('🏯 山寨物語開始！建造設施，吸引冒險者，壯大你的村莊！', 'level')

  document.getElementById('bld-info').innerHTML = '<div style="color:var(--text-dim);font-size:13px;">點擊建築查看詳情</div>'

  lastTime = performance.now()
  requestAnimationFrame(gameLoop)
}

init()
