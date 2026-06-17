/**
 * state.js — Global game state G + initState()
 * All mutable game data lives here.
 * Other modules import { G } and read/write it directly.
 */
import { GAME_DATA } from './data.js'

export const G = {
  gold: 800, day: 1, dayTick: 0, dayLength: 280,
  popularity: 0, satisfaction: 0,
  townLevel: 1, townExp: 0, townExpNeeded: 200,
  buildings: [], adventurers: [], monsters: [], residents: [],
  selectedBuilding: null, placingBuilding: null,
  speed: 1, townIncome: 0,
  gridW: 22, gridH: 16,
  grid: [],
  atkBuff: 0, defBuff: 0, expBuff: 0, satisfactionBuff: 0, incomeBuff: 1,
  maxAdventurers: 4,
  stats: { kills: 0, totalGold: 0, dungeons: 0, synergies: 0 },
  quests: {},
  synergies: [], activeSynergyMap: {},
  selectedBuildingOnMap: null,
  dungeon: { active: false, floorData: null, hero: null, enemy: null,
             floorIndex: 0, dungeonId: null, potions: 3 },
  unlockedClasses: new Set(['novice','knight','fire_mage','ranger']),
  wall: { level: 0, hp: 0, maxHp: 0 },
  resourceNodes: [],
  globalResources: { wood:0, stone:0, iron:0, water:0, crystal:0 },
  siege: { active:false, timer:0, interval:180, siegeMonsters:[], warningShown:false },
  gameOver: false,
  bounty: { active: false, elite: null },
  // UI dirty flags
  _lastPanelGold: -1, _buildPanelDirty: true,
  _lastAdvKey: '', _lastResCount: -1, _lastQuestKey: '',
  _usedNames: null, _questFlash: null,
  // Render cache
  buildingCacheDirty: true, buildingCacheKey: '',
  // FSM
  advIdCounter: 1,
  // Difficulty
  difficulty: 'normal',
  _monsterAtkMult: 1,
  _monsterHpMult: 1,
}

export function initState() {
  // Init grid
  for (let y = 0; y < G.gridH; y++) {
    G.grid[y] = []
    for (let x = 0; x < G.gridW; x++) G.grid[y][x] = 0
  }
  // Roads
  for (let x = 0; x < G.gridW; x++) { G.grid[7][x] = 2; G.grid[8][x] = 2 }
  for (let y = 0; y < G.gridH; y++) { G.grid[y][10] = 2; G.grid[y][11] = 2 }

  // Init quests
  GAME_DATA.quests.forEach(q => { G.quests[q.id] = { progress: 0, claimed: false } })

  // Init resource nodes
  GAME_DATA.resourceNodes.forEach(n => {
    G.resourceNodes.push({ ...n, stock: n.max, respawnTimer: 0 })
  })

  // Starter houses
  const starterHouses = [{ gx:6, gy:5 }, { gx:7, gy:5 }]
  starterHouses.forEach(pos => {
    G.grid[pos.gy][pos.gx] = 2
    G.buildings.push({ id:'house', gx:pos.gx, gy:pos.gy, level:1, hp:150, maxHp:150 })
  })
}
