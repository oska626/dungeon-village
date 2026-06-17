import { G } from './state.js'
import { GAME_DATA } from './data.js'
import { SPRITES, MONSTER_SPRITES } from './sprites.js'

export const canvas = document.getElementById('gameCanvas')
export const ctx = canvas.getContext('2d')
const wrap = document.getElementById('world-wrap')

export let ISO_W = 44, ISO_H = 22, OFFSET_X = 0, OFFSET_Y = 0

// ── Sprite images ────────────────────────────────────────────────────────────
const IMG = {}
function loadImg(key, src) {
  const img = new Image()
  img.src = src
  IMG[key] = img
}
loadImg('grass',        '/sprites/grass.png')
loadImg('road',         '/sprites/road.png')
loadImg('bld_house',        '/sprites/house.png')
loadImg('bld_weapon_shop',  '/sprites/weapon_shop.png')
loadImg('bld_inn',          '/sprites/inn.png')
loadImg('bld_cake_shop',    '/sprites/cake_shop.png')
loadImg('bld_armor_shop',   '/sprites/armor_shop.png')
loadImg('bld_magic_tower',  '/sprites/magic_tower.png')
loadImg('bld_guild',        '/sprites/guild.png')
loadImg('bld_market',       '/sprites/market.png')
loadImg('bld_temple',       '/sprites/temple.png')
loadImg('bld_forge',        '/sprites/forge.png')
for (let i = 1; i <= 5; i++) loadImg('wall_' + i, '/sprites/walls/wall_' + i + '.png')

const offscreen = document.createElement('canvas')
const offCtx = offscreen.getContext('2d')

export function resize() {
  canvas.width = wrap.clientWidth
  canvas.height = wrap.clientHeight
  offscreen.width = canvas.width
  offscreen.height = canvas.height
  OFFSET_X = canvas.width / 2
  const gridPixH = (G.gridW + G.gridH) * (ISO_H / 2)
  OFFSET_Y = Math.max(40, (canvas.height - gridPixH) / 2)
  G.buildingCacheDirty = true
}
resize()
window.addEventListener('resize', resize)

export function gridToScreen(gx, gy) {
  return { x: OFFSET_X + (gx - gy) * (ISO_W / 2), y: OFFSET_Y + (gx + gy) * (ISO_H / 2) }
}
export function screenToGrid(sx, sy) {
  const rx = sx - OFFSET_X, ry = sy - OFFSET_Y
  return { x: Math.floor((rx / (ISO_W / 2) + ry / (ISO_H / 2)) / 2), y: Math.floor((ry / (ISO_H / 2) - rx / (ISO_W / 2)) / 2) }
}

export function shadeColor(c, amt) {
  let n = parseInt(c.replace('#',''), 16)
  const r = Math.min(255, Math.max(0, (n >> 16) + amt))
  const g = Math.min(255, Math.max(0, ((n >> 8) & 0xff) + amt))
  const b = Math.min(255, Math.max(0, (n & 0xff) + amt))
  return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('')
}

export let mouseGrid = { x: -1, y: -1 }
export let mouseScreen = { x: 0, y: 0 }
canvas.addEventListener('mousemove', e => {
  const r = canvas.getBoundingClientRect()
  mouseScreen = { x: e.clientX - r.left, y: e.clientY - r.top }
  mouseGrid = screenToGrid(mouseScreen.x, mouseScreen.y)
})

// ── Combat FX ──
export const combatFX = []
export const particles = []
const MAX_PARTICLES = 80

export function addCombatFX(sx, sy, text, color, type, tx, ty) {
  combatFX.push({ x: sx, y: sy, text, color, alpha: 1, life: 55, type: type || 'text', tx: tx || sx, ty: ty || sy, age: 0 })
}

export function spawnParticles(cx, cy, color, count, spread, speed) {
  const slots = Math.min(count, MAX_PARTICLES - particles.length)
  if (slots <= 0) { particles.splice(0, count) }
  const actual = Math.min(count, MAX_PARTICLES)
  for (let i = 0; i < actual; i++) {
    const angle = Math.random() * Math.PI * 2
    const spd = (0.5 + Math.random()) * speed
    particles.push({ x: cx, y: cy, vx: Math.cos(angle) * spd, vy: Math.sin(angle) * spd - 1, color, alpha: 1, r: 2 + Math.random() * 2, life: 20 + Math.floor(Math.random() * 20) })
  }
  if (particles.length > MAX_PARTICLES) particles.splice(0, particles.length - MAX_PARTICLES)
}

// ── Tile ──
function drawSpriteImg(key, x, y, clipDiamond = false) {
  const img = IMG[key]
  if (!img?.complete || !img.naturalWidth) return false
  const iw = ISO_W
  const ih = ISO_W * (img.naturalHeight / img.naturalWidth)
  if (clipDiamond) {
    ctx.save()
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.lineTo(x + ISO_W / 2, y + ISO_H / 2)
    ctx.lineTo(x, y + ISO_H)
    ctx.lineTo(x - ISO_W / 2, y + ISO_H / 2)
    ctx.closePath()
    ctx.clip()
  }
  ctx.drawImage(img, x - iw / 2, y + ISO_H - ih, iw, ih)
  if (clipDiamond) ctx.restore()
  return true
}

function drawTile(gx, gy, fillColor, strokeColor = 'rgba(0,0,0,0.3)') {
  const { x, y } = gridToScreen(gx, gy)

  if (fillColor === '#3a7d44' || fillColor === '#347040') {
    if (drawSpriteImg('grass', x, y, false)) return
  }

  if (fillColor === '#8b7355') {
    if (drawSpriteImg('road', x, y, false)) return
  }

  ctx.beginPath()
  ctx.moveTo(x, y); ctx.lineTo(x + ISO_W / 2, y + ISO_H / 2)
  ctx.lineTo(x, y + ISO_H); ctx.lineTo(x - ISO_W / 2, y + ISO_H / 2)
  ctx.closePath()
  ctx.fillStyle = fillColor; ctx.fill()
  ctx.strokeStyle = strokeColor; ctx.lineWidth = 0.5; ctx.stroke()
}

// ── Building (draws to given context) ──
function drawBuilding3DTo(targetCtx, gx, gy, bdata, bLevel, synActive, isSelected) {
  const dc = targetCtx
  const { x, y } = gridToScreen(gx, gy)
  const bw = ISO_W - 4
  const bh = 22 + bLevel * 5
  const bx = x - bw / 2
  const by = y - bh

  // Use AI sprite if available
  const sprKey = 'bld_' + bdata.id
  const sprImg = IMG[sprKey]
  if (sprImg?.complete && sprImg.naturalWidth > 0) {
    if (synActive) { dc.save(); dc.shadowColor = 'gold'; dc.shadowBlur = 14 }
    // Scale sprite: fit within 1 tile width
    const sw = ISO_W * 0.9
    const sh = sw * (sprImg.naturalHeight / sprImg.naturalWidth)
    dc.drawImage(sprImg, x - sw / 2, y + ISO_H - sh, sw, sh)
    // Level badge
    if (bLevel > 1) {
      dc.fillStyle = 'rgba(0,0,0,0.65)'; dc.fillRect(x - 8, y - sh * 0.6, 16, 10)
      dc.font = 'bold 8px sans-serif'; dc.fillStyle = '#ffdd55'; dc.textAlign = 'center'
      dc.fillText('Lv' + bLevel, x, y - sh * 0.6 + 8)
    }
    // Selection ring
    const sel = isSelected || (G.selectedBuildingOnMap?.gx === gx && G.selectedBuildingOnMap?.gy === gy)
    if (sel) { dc.strokeStyle = 'gold'; dc.lineWidth = 2.5; dc.strokeRect(x - sw / 2 - 2, y + ISO_H - sh - 2, sw + 4, sh + 4) }
    if (synActive) dc.restore()
    return
  }

  if (synActive) { dc.save(); dc.shadowColor = 'gold'; dc.shadowBlur = 10 }

  const bc = bdata.color || '#5a5a5a'
  dc.fillStyle = bc; dc.fillRect(bx, by, bw, bh)

  const rc = bdata.roofColor || shadeColor(bc, 30)
  const roofH = Math.max(5, Math.floor(bh * 0.22))
  dc.fillStyle = rc; dc.fillRect(bx, by, bw, roofH)

  const roof = bdata.roofStyle || 'flat'
  if (roof === 'peak' || roof === 'chimney') {
    dc.beginPath()
    dc.moveTo(bx, by); dc.lineTo(x, by - 8); dc.lineTo(bx + bw, by)
    dc.closePath(); dc.fillStyle = rc; dc.fill()
    dc.strokeStyle = 'rgba(0,0,0,0.3)'; dc.lineWidth = 0.8; dc.stroke()
    if (roof === 'chimney') {
      dc.fillStyle = shadeColor(bc, -20); dc.fillRect(x + 4, by - 14, 5, 10)
      const t = performance.now() / 900
      for (let si = 0; si < 3; si++) {
        const ox = Math.sin(t + si * 1.8) * 3
        dc.beginPath(); dc.arc(x + 6 + ox, by - 16 - si * 5, 2.5 - si * 0.4, 0, Math.PI * 2)
        dc.fillStyle = `rgba(200,200,200,${0.5 - si * 0.13})`; dc.fill()
      }
    }
  } else if (roof === 'dome') {
    dc.beginPath(); dc.arc(x, by, bw / 2, Math.PI, 0)
    dc.fillStyle = rc; dc.fill()
    dc.strokeStyle = 'rgba(0,0,0,0.25)'; dc.lineWidth = 0.8; dc.stroke()
    dc.beginPath(); dc.moveTo(x, by - bw / 2); dc.lineTo(x, by - bw / 2 - 8)
    dc.strokeStyle = 'rgba(200,180,255,0.9)'; dc.lineWidth = 1.5; dc.stroke()
    dc.beginPath(); dc.arc(x, by - bw / 2 - 9, 3, 0, Math.PI * 2)
    dc.fillStyle = bdata.roofIcon === '🌙' ? '#cc88ff' : '#ffee88'; dc.fill()
  } else if (roof === 'tower') {
    dc.fillStyle = shadeColor(rc, -10); dc.fillRect(x - 4, by - 12, 8, 12)
    dc.fillStyle = shadeColor(rc, 10)
    dc.fillRect(x - 5, by - 15, 4, 4); dc.fillRect(x + 1, by - 15, 4, 4)
    dc.beginPath(); dc.moveTo(x + 4, by - 12); dc.lineTo(x + 4, by - 22)
    dc.strokeStyle = 'rgba(160,130,80,0.9)'; dc.lineWidth = 1; dc.stroke()
    dc.beginPath(); dc.moveTo(x + 4, by - 22); dc.lineTo(x + 13, by - 17); dc.lineTo(x + 4, by - 12); dc.closePath()
    dc.fillStyle = bdata.flagColor || '#ff4444'; dc.fill()
  } else if (roof === 'awning') {
    dc.fillStyle = rc; dc.fillRect(bx - 3, by + roofH, bw + 6, 5)
    for (let si = 0; si < 4; si++) {
      dc.fillStyle = 'rgba(255,255,255,0.25)'
      dc.fillRect(bx + si * (bw / 4), by + roofH, bw / 8, 5)
    }
    for (let li = -1; li <= 1; li++) {
      dc.beginPath(); dc.arc(x + li * 9, by + roofH + 8, 2, 0, Math.PI * 2)
      dc.fillStyle = 'rgba(255,200,50,0.9)'; dc.fill()
    }
  }

  const winColor = 'rgba(255,220,100,0.65)'
  if (bw > 18) {
    dc.fillStyle = winColor
    dc.fillRect(bx + 4, by + roofH + 3, 5, 5)
    dc.fillRect(bx + bw - 9, by + roofH + 3, 5, 5)
    if (bLevel >= 2) dc.fillRect(bx + bw / 2 - 2, by + roofH + 3, 5, 5)
  }

  dc.fillStyle = shadeColor(bc, -30); dc.fillRect(x - 3, by + bh - 8, 7, 8)
  dc.strokeStyle = 'rgba(0,0,0,0.45)'; dc.lineWidth = 1; dc.strokeRect(bx, by, bw, bh)

  if (bdata.refined) {
    const shimmer = 0.15 + Math.abs(Math.sin(performance.now() / 800)) * 0.15
    dc.fillStyle = `rgba(255,220,50,${shimmer})`; dc.fillRect(bx, by, bw, bh)
  }

  if (synActive) dc.restore()

  dc.font = '13px serif'; dc.textAlign = 'center'
  dc.fillText(bdata.emoji, x, by + bh * 0.55)

  if (bLevel > 1) {
    dc.fillStyle = 'rgba(0,0,0,0.6)'; dc.fillRect(x - 8, by - 1, 16, 10)
    dc.font = 'bold 8px sans-serif'; dc.fillStyle = '#ffdd55'; dc.textAlign = 'center'
    dc.fillText('Lv' + bLevel, x, by + 7)
  }

  if (bdata.refined) {
    dc.font = '9px serif'; dc.textAlign = 'center'; dc.fillText('✨', bx + bw - 6, by + 4)
  }

  const sel = isSelected || (G.selectedBuildingOnMap && G.selectedBuildingOnMap.gx === gx && G.selectedBuildingOnMap.gy === gy)
  if (sel) {
    dc.strokeStyle = 'gold'; dc.lineWidth = 2.5; dc.strokeRect(bx - 2, by - 2, bw + 4, bh + 4)
  }
}

// ── Town walls ──
function drawTownWalls() {
  const wt = GAME_DATA.wallTiers[G.wall.level - 1]; if (!wt) return
  const hp = G.wall.hp / G.wall.maxHp
  const TOWN_X_MAX = 13
  const damaged = hp < 0.3
  const img = IMG['wall_' + G.wall.level]
  const useSprite = img?.complete && img.naturalWidth > 0

  ctx.save()
  if (damaged) ctx.globalAlpha = 0.75 + Math.sin(performance.now() / 120) * 0.25

  // Only draw top and bottom horizontal rows
  for (const gy of [0, 15]) {
    for (let gx = 0; gx <= TOWN_X_MAX; gx++) {
      const { x, y } = gridToScreen(gx, gy)
      if (useSprite) {
        const sw = ISO_W * 1.4
        const sh = sw * (img.naturalHeight / img.naturalWidth)
        ctx.drawImage(img, x - sw / 2, y + ISO_H - sh, sw, sh)
      } else {
        const h = 10 + G.wall.level * 3
        ctx.fillStyle = wt.color; ctx.fillRect(x - ISO_W / 2, y - h, ISO_W, h)
        ctx.fillStyle = wt.topColor; ctx.fillRect(x - ISO_W / 2, y - h, ISO_W, 3)
        if ((gx + gy) % 2 === 0) {
          ctx.fillStyle = shadeColor(wt.topColor, 20)
          ctx.fillRect(x - ISO_W / 2 + 2, y - h - 5, 7, 6)
          ctx.fillRect(x + ISO_W / 2 - 9, y - h - 5, 7, 6)
        }
        ctx.strokeStyle = 'rgba(0,0,0,0.45)'; ctx.lineWidth = 0.8
        ctx.strokeRect(x - ISO_W / 2, y - h, ISO_W, h)
      }
    }
  }
  ctx.restore()

  const bw = 200, bx = canvas.width / 2 - bw / 2, by = 8
  ctx.fillStyle = 'rgba(0,0,0,0.75)'; ctx.fillRect(bx - 1, by - 1, bw + 2, 14)
  ctx.fillStyle = hp > 0.5 ? '#44aa44' : hp > 0.25 ? '#ddaa00' : '#cc2222'
  ctx.fillRect(bx, by, bw * hp, 12)
  ctx.strokeStyle = 'rgba(255,255,255,0.15)'; ctx.lineWidth = 1; ctx.strokeRect(bx - 1, by - 1, bw + 2, 14)
  ctx.font = 'bold 10px sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#fff'
  ctx.fillText(`${wt.emoji} ${wt.name}  HP ${Math.ceil(G.wall.hp)} / ${G.wall.maxHp}`, canvas.width / 2, by + 9)
}

// ── Pixel sprite ──
function drawPixelSprite(spriteData, cx, cy, scale, flipX, walkFrame) {
  const { pixels, pal } = spriteData
  const pw = scale, ph = scale
  const cols = pixels[0].length
  const rows = pixels.length
  const offX = cx - (cols * pw) / 2
  const offY = cy - rows * ph
  const legRows = [rows - 3, rows - 2, rows - 1]

  pixels.forEach((row, ri) => {
    const isLeg = legRows.includes(ri)
    let legOff = 0
    if (isLeg && walkFrame !== undefined) {
      legOff = (ri === rows - 2 || ri === rows - 1)
        ? (walkFrame % 2 === 0 ? (ri % 2 === 0 ? 1 : -1) : (ri % 2 === 0 ? -1 : 1))
        : 0
    }
    row.forEach((px, ci) => {
      if (!px) return
      const color = pal[px]; if (!color) return
      const drawCi = flipX ? (cols - 1 - ci) : ci
      const sx = offX + drawCi * pw + legOff
      const sy = offY + ri * ph
      ctx.fillStyle = color; ctx.fillRect(sx, sy, pw, ph)
    })
  })
}

// ── Draw adventurer ──
function drawAdventurer(adv) {
  if (!adv.screenX) return
  const cls = GAME_DATA.adventurerClasses.find(c => c.id === adv.classId); if (!cls) return
  const x = adv.screenX, y = adv.screenY
  const scale = 2
  const walkFrame = Math.floor(performance.now() / 220)
  const isMoving = (adv.state === 'MovingToFacility' || adv.state === 'ExploringField' || adv.state === 'EnterTown' || adv.state === 'Combat')
  const flipX = adv._lastDx < 0

  if (adv._prevX !== undefined) {
    const dx = x - adv._prevX
    if (Math.abs(dx) > 0.3) adv._lastDx = dx
  }
  adv._prevX = x

  ctx.beginPath()
  ctx.ellipse(x, y + 2, 9, 3, 0, 0, Math.PI * 2)
  ctx.fillStyle = 'rgba(0,0,0,0.22)'; ctx.fill()

  const spriteDef = SPRITES[adv.classId] || SPRITES.novice
  let drawX = x, drawY = y
  const pose = adv._attackPose || 0
  if (adv.state === 'Combat') {
    if (adv.combatTarget && pose > 0) {
      const { x: tx, y: ty } = gridToScreen(adv.combatTarget.gx, adv.combatTarget.gy)
      const dx = tx - x, dy = ty - y
      const d = Math.sqrt(dx * dx + dy * dy) || 1
      drawX += (dx / d) * pose * 10; drawY += (dy / d) * pose * 5
    } else {
      drawX += (Math.random() - 0.5) * 1.2
    }
  }

  if (adv.state === 'Resting') {
    ctx.save(); ctx.globalAlpha = 0.7 + Math.sin(performance.now() / 400) * 0.3
    ctx.font = '8px serif'; ctx.textAlign = 'center'
    ctx.fillText('z', drawX + 9, drawY - 24 + Math.sin(performance.now() / 500) * 2)
    ctx.fillText('Z', drawX + 13, drawY - 30 + Math.sin(performance.now() / 500 + 1) * 2)
    ctx.restore()
  }

  ctx.save()
  if (adv.isResident) { ctx.shadowColor = 'gold'; ctx.shadowBlur = 8 }
  drawPixelSprite(spriteDef, drawX, drawY, scale, flipX, isMoving ? walkFrame : undefined)
  ctx.restore()

  const blockAnim = adv._blockAnim || 0
  if (blockAnim > 0) {
    ctx.save(); ctx.globalAlpha = blockAnim * 0.75
    ctx.strokeStyle = '#66ccff'; ctx.lineWidth = 3 + blockAnim * 4
    ctx.shadowColor = '#88ddff'; ctx.shadowBlur = 12
    ctx.beginPath(); ctx.arc(drawX, drawY - 8, 13 + blockAnim * 5, 0, Math.PI * 2); ctx.stroke()
    ctx.restore()
    ctx.save(); ctx.globalAlpha = blockAnim
    ctx.font = '11px serif'; ctx.textAlign = 'center'; ctx.fillText('🛡', drawX + 12, drawY - 14)
    ctx.restore()
  }

  if (adv.state === 'Combat') {
    const cls2 = GAME_DATA.adventurerClasses.find(c => c.id === adv.classId)
    if (cls2 && (cls2.attackType === 'ranged' || cls2.attackType === 'magic')) {
      ctx.save(); ctx.globalAlpha = 0.18
      ctx.strokeStyle = cls2.attackType === 'ranged' ? '#88ff44' : '#cc88ff'
      ctx.lineWidth = 1; ctx.setLineDash([3, 4])
      ctx.beginPath(); ctx.arc(drawX, drawY, cls2.attackRange * 20, 0, Math.PI * 2); ctx.stroke()
      ctx.setLineDash([]); ctx.restore()
    }
  }

  const hp = adv.hp / adv.maxHp
  const bw = 20
  ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillRect(x - bw / 2 - 1, y - 28, bw + 2, 5)
  ctx.fillStyle = hp > 0.5 ? '#44ee44' : hp > 0.25 ? '#eeaa22' : '#ee2222'
  ctx.fillRect(x - bw / 2, y - 27, bw * hp, 3)

  const stDot = { Idle:'#aaaaaa', ExploringField:'#ff6655', Combat:'#ff2244', Resting:'#44aaff', Shopping:'#ffaa00', MovingToFacility:'#cc88ff', EnterTown:'#88ff88', InDungeon:'#ff8822' }[adv.state] || '#888888'
  ctx.beginPath(); ctx.arc(x + 11, y - 25, 2.5, 0, Math.PI * 2)
  ctx.fillStyle = stDot; ctx.fill()

  if (adv.gold > 80) {
    ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(x - 13, y - 40, 26, 10)
    ctx.font = 'bold 7px sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#f0c040'
    ctx.fillText('💰' + Math.floor(adv.gold), x, y - 32)
  }

  if (adv.isResident) {
    ctx.font = '9px serif'; ctx.textAlign = 'center'; ctx.fillText('👑', x, y - 38)
  }

  ctx.font = '6px sans-serif'; ctx.textAlign = 'center'
  ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.fillText(adv.name, x, y - 29)
}

// ── Draw monster ──
function drawMonster(m) {
  if (m.dead) return
  const gpos = gridToScreen(m.gx, m.gy)
  const x = m.screenX !== undefined ? m.screenX : gpos.x
  const y = m.screenY !== undefined ? m.screenY : gpos.y
  const scale = m.isSiege ? Math.min(3.5, 2 + G.townLevel * 0.3) : 2
  const walkFrame = Math.floor(performance.now() / 300)
  const spriteDef = MONSTER_SPRITES[m.id]

  if (spriteDef) {
    const shadowR = 6 + (scale - 2) * 4
    ctx.beginPath(); ctx.ellipse(x, y + 2, shadowR, shadowR * 0.35, 0, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(0,0,0,0.22)'; ctx.fill()
    const bob = m.isSiege ? 0 : Math.sin(performance.now() / 500 + m.gx) * 1.2
    drawPixelSprite(spriteDef, x, y - 2 + bob, scale, m.isSiege ? true : false, walkFrame)
  } else {
    ctx.font = '18px serif'; ctx.textAlign = 'center'; ctx.fillText(m.emoji, x, y - 2)
  }

  const hp = m.hp / m.maxHp
  const barW = Math.floor(20 * scale * 0.7)
  ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(x - barW / 2 - 1, y - 24, barW + 2, 4)
  ctx.fillStyle = m.isSiege ? '#ff4400' : '#ee2222'
  ctx.fillRect(x - barW / 2, y - 23, barW * hp, 2)

  ctx.font = (m.isSiege ? 'bold ' : '') + '9px sans-serif'; ctx.textAlign = 'center'
  ctx.fillStyle = m.isSiege ? 'rgba(255,120,80,0.95)' : 'rgba(255,180,180,0.7)'
  ctx.fillText((m.isSiege ? '⚔ ' : '') + m.name, x, y - 26)
}

// ── Main render ──
export function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  // Ground tiles
  for (let gy = 0; gy < G.gridH; gy++) {
    for (let gx = 0; gx < G.gridW; gx++) {
      const cell = G.grid[gy]?.[gx]
      if (typeof cell === 'object') continue
      let tc = cell === 2 ? '#8b7355' : ((gx + gy) % 2 === 0 ? '#3a7d44' : '#347040')
      if (G.placingBuilding && mouseGrid.x === gx && mouseGrid.y === gy)
        tc = cell === 0 ? '#55ff88' : '#ff5544'
      drawTile(gx, gy, tc)
      if (cell === 0 && Math.sin(gx * 31 + gy * 17) > 0.72) {
        const { x, y } = gridToScreen(gx, gy)
        ctx.font = '10px serif'; ctx.textAlign = 'center'; ctx.fillStyle = 'rgba(80,160,80,.6)'
        ctx.fillText('🌿', x, y + ISO_H / 2 + 1)
      }
    }
  }

  // Field zone overlay
  ctx.save(); ctx.globalAlpha = 0.13
  for (let gx = 15; gx < G.gridW; gx++) for (let gy = 0; gy < G.gridH; gy++) if (G.grid[gy][gx] !== 2) drawTile(gx, gy, '#cc3333')
  ctx.restore()
  const { x: fx, y: fy } = gridToScreen(18, 1)
  ctx.font = 'bold 13px Noto Sans TC'; ctx.textAlign = 'center'
  ctx.fillStyle = 'rgba(255,80,80,.7)'; ctx.fillText('⚔ 探索區', fx, fy)

  if (G.wall.level > 0) drawTownWalls()

  // Resource nodes
  G.resourceNodes.forEach(n => {
    if (n.stock <= 0) return
    const { x, y } = gridToScreen(n.gx, n.gy)
    const rdata = GAME_DATA.resources.find(r => r.id === n.type)
    ctx.save(); ctx.globalAlpha = 0.85
    const nodeColors = { wood:'#6b3a1a', stone:'#666677', iron:'#445566', water:'#1a6688', crystal:'#5533aa' }
    drawTile(n.gx, n.gy, nodeColors[n.type] || '#555555', 'rgba(0,0,0,0.4)')
    ctx.restore()
    ctx.font = '11px serif'; ctx.textAlign = 'center'
    ctx.fillText(rdata ? rdata.emoji : '❓', x, y + ISO_H / 2)
    const stockPct = n.stock / n.max
    ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(x - 9, y - 4, 18, 3)
    ctx.fillStyle = rdata ? rdata.color : '#888'; ctx.fillRect(x - 9, y - 4, 18 * stockPct, 3)
  })

  // Buildings (offscreen cache)
  {
    const newKey = G.buildings.map(b => `${b.id}${b.gx}${b.gy}${b.level}${G.activeSynergyMap[b.id] ? 1 : 0}${b.hp || 0}${G.selectedBuildingOnMap === b ? 1 : 0}`).join('|')
    if (G.buildingCacheDirty || newKey !== G.buildingCacheKey) {
      G.buildingCacheKey = newKey; G.buildingCacheDirty = false
      offCtx.clearRect(0, 0, offscreen.width, offscreen.height)
      G.buildings.forEach(b => {
        const bd = GAME_DATA.buildings.find(d => d.id === b.id)
        const synActive = G.activeSynergyMap[b.id] === true
        drawBuilding3DTo(offCtx, b.gx, b.gy, bd, b.level, synActive, G.selectedBuildingOnMap === b)
      })
    }
    ctx.drawImage(offscreen, 0, 0)

    // House occupancy
    G.buildings.filter(b => b.id === 'house').forEach(house => {
      const occupant = G.adventurers.find(a => a.homeGX === house.gx && a.homeGY === house.gy)
      const { x, y } = gridToScreen(house.gx, house.gy)
      const bh = 28 + house.level * 5
      ctx.font = '9px serif'; ctx.textAlign = 'center'
      if (occupant) {
        const cls = GAME_DATA.adventurerClasses.find(c => c.id === occupant.classId)
        ctx.fillStyle = occupant.isHomeless ? '#ff4444' : 'rgba(255,255,255,0.85)'
        ctx.fillText(occupant.isHomeless ? '🏚' : (cls?.emoji || '🧙'), x, y - bh - 3)
        if (occupant.restTimer > 0) {
          ctx.fillStyle = 'rgba(255,100,100,0.7)'; ctx.fillText('💤', x + 10, y - bh - 3)
        }
      } else {
        ctx.fillStyle = 'rgba(100,200,100,0.6)'; ctx.fillText('空', x, y - bh - 3)
      }
    })

    // Building HP bars
    G.buildings.forEach(b => {
      if (b.hp !== undefined && b.hp < b.maxHp) {
        const { x, y } = gridToScreen(b.gx, b.gy)
        const bh = 28 + b.level * 6
        const hpPct = b.hp / b.maxHp
        ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillRect(x - 12, y - bh - 10, 24, 5)
        ctx.fillStyle = hpPct > 0.5 ? '#44ee44' : hpPct > 0.25 ? '#eeaa22' : '#ee2222'
        ctx.fillRect(x - 12, y - bh - 10, 24 * hpPct, 5)
        ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.lineWidth = 0.5; ctx.strokeRect(x - 12, y - bh - 10, 24, 5)
      }
    })
  }

  // Construction scaffolding
  G.buildings.forEach(b => {
    if (!b.constructing) return
    const { x, y } = gridToScreen(b.gx, b.gy)
    const bh = 28 + (b.level || 1) * 5
    const pct = b.constructTimer / b.constructTime
    ctx.save()
    ctx.globalAlpha = 0.85
    ctx.fillStyle = '#8B6914'
    ctx.fillRect(x - ISO_W / 2 + 2, y - bh - 4, 4, bh + 4)
    ctx.fillRect(x + ISO_W / 2 - 6, y - bh - 4, 4, bh + 4)
    for (let ri = 0; ri < 3; ri++) {
      const ry = y - bh * (0.25 + ri * 0.3)
      ctx.fillStyle = '#a07820'
      ctx.fillRect(x - ISO_W / 2 + 2, ry, ISO_W - 4, 3)
    }
    ctx.globalAlpha = 1
    ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(x - 14, y - bh - 16, 28, 6)
    ctx.fillStyle = '#f0a500'; ctx.fillRect(x - 13, y - bh - 15, 26 * pct, 4)
    ctx.font = '8px sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#fff'
    ctx.fillText('🔨 ' + Math.ceil((1 - pct) * b.constructTime) + 's', x, y - bh - 20)
    ctx.restore()
  })

  G.adventurers.forEach(a => drawAdventurer(a))
  G.monsters.forEach(m => { if (!m.dead) drawMonster(m) })

  // Particles
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i]
    ctx.save(); ctx.globalAlpha = p.alpha
    ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill()
    ctx.restore()
    p.x += p.vx; p.y += p.vy; p.vy += 0.12; p.alpha -= 1 / p.life; p.r *= 0.97
    if (p.alpha <= 0) particles.splice(i, 1)
  }

  // Day/night overlay
  {
    const t = G.timeOfDay
    let overlayColor = null
    if (t < 0.08) {
      // Deep night fading to dawn
      const f = t / 0.08
      overlayColor = `rgba(0,10,60,${0.45 * (1 - f) + 0.15 * f})`
    } else if (t < 0.18) {
      // Dawn: orange-red
      const f = (t - 0.08) / 0.10
      overlayColor = `rgba(200,80,20,${0.18 * (1 - f)})`
    } else if (t < 0.62) {
      // Day: no overlay
      overlayColor = null
    } else if (t < 0.72) {
      // Dusk: orange-purple fading in
      const f = (t - 0.62) / 0.10
      overlayColor = `rgba(160,60,100,${0.22 * f})`
    } else if (t < 0.82) {
      // Dusk deepening to night
      const f = (t - 0.72) / 0.10
      overlayColor = `rgba(${Math.floor(160*(1-f))},${Math.floor(60*(1-f))},${Math.floor(100*(1-f)+60*f)},${0.22 + 0.23*f})`
    } else {
      // Night
      overlayColor = 'rgba(0,10,60,0.45)'
    }
    if (overlayColor) {
      ctx.save(); ctx.globalAlpha = 1
      ctx.fillStyle = overlayColor
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.restore()
    }
    // Stars at night
    if (t > 0.75 || t < 0.12) {
      const starAlpha = t > 0.82 ? 0.7 : t < 0.08 ? 0.7 * (1 - t / 0.08) : (t - 0.75) / 0.07 * 0.7
      ctx.save(); ctx.globalAlpha = starAlpha
      const starSeed = 42
      for (let i = 0; i < 40; i++) {
        const sx = ((Math.sin(i * 127.1 + starSeed) * 0.5 + 0.5)) * canvas.width
        const sy = ((Math.sin(i * 311.7 + starSeed) * 0.5 + 0.5)) * canvas.height * 0.5
        const sr = 0.8 + (i % 3) * 0.4
        const twinkle = 0.5 + 0.5 * Math.sin(performance.now() / (800 + i * 200))
        ctx.globalAlpha = starAlpha * twinkle
        ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(sx, sy, sr, 0, Math.PI * 2); ctx.fill()
      }
      ctx.restore()
    }
    // Moon icon at night
    if (t > 0.78 || t < 0.10) {
      const moonAlpha = t > 0.82 ? 1 : t < 0.08 ? 1 - t / 0.08 : Math.min(1, (t - 0.78) / 0.04)
      ctx.save(); ctx.globalAlpha = moonAlpha * 0.85
      ctx.font = '20px serif'; ctx.textAlign = 'right'
      ctx.fillText('🌙', canvas.width - 12, 36)
      ctx.restore()
    }
    // Sun icon at day
    if (t > 0.15 && t < 0.65) {
      const sunAlpha = t < 0.22 ? (t - 0.15) / 0.07 : t > 0.58 ? 1 - (t - 0.58) / 0.07 : 1
      ctx.save(); ctx.globalAlpha = sunAlpha * 0.8
      ctx.font = '18px serif'; ctx.textAlign = 'right'
      ctx.fillText('☀️', canvas.width - 12, 36)
      ctx.restore()
    }
  }

  // Quest flash
  if (G._questFlash && G._questFlash.alpha > 0) {
    ctx.save(); ctx.globalAlpha = G._questFlash.alpha
    ctx.fillStyle = G._questFlash.color; ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.restore()
    G._questFlash.alpha -= G._questFlash.alpha / G._questFlash.timer
    G._questFlash.timer--
  }

  // Combat FX
  for (let i = combatFX.length - 1; i >= 0; i--) {
    const fx = combatFX[i]
    fx.age++
    const t = fx.age / fx.life
    ctx.save(); ctx.globalAlpha = fx.alpha

    if (fx.type === 'slash') {
      const prog = Math.min(1, fx.age / 12)
      for (let si = 0; si < 3; si++) {
        const ang = -0.5 + si * 0.35 + prog * 1.2
        const len = 18 + si * 6
        ctx.beginPath(); ctx.moveTo(fx.x, fx.y)
        ctx.lineTo(fx.x + Math.cos(ang) * len, fx.y + Math.sin(ang) * len * 0.5)
        ctx.strokeStyle = si === 1 ? '#ffffff' : fx.color; ctx.lineWidth = 3 - si; ctx.lineCap = 'round'; ctx.stroke()
      }
    } else if (fx.type === 'slash2') {
      const prog = Math.min(1, fx.age / 10); const len = 22 * prog
      ;[[-0.4, 0.3], [0.4, 0.3], [0, 0.6]].forEach(([ax, ay], si) => {
        ctx.beginPath()
        ctx.moveTo(fx.x - Math.cos(ax) * len * 0.5, fx.y - Math.sin(ay) * len * 0.5)
        ctx.lineTo(fx.x + Math.cos(ax) * len, fx.y + Math.sin(ay) * len)
        ctx.strokeStyle = si === 1 ? '#ffffff' : fx.color; ctx.lineWidth = 4 - si; ctx.lineCap = 'round'; ctx.stroke()
      })
    } else if (fx.type === 'arrow') {
      const prog = Math.min(1, fx.age / 18)
      const ax = fx.x + (fx.tx - fx.x) * prog
      const ay = fx.y + (fx.ty - fx.y) * prog - Math.sin(prog * Math.PI) * 14
      const angle = Math.atan2(fx.ty - fx.y, fx.tx - fx.x)
      ctx.save(); ctx.translate(ax, ay); ctx.rotate(angle)
      ctx.fillStyle = '#aa7733'; ctx.fillRect(-7, -1, 14, 2)
      ctx.fillStyle = '#ccaa55'; ctx.beginPath(); ctx.moveTo(7, 0); ctx.lineTo(2, -3); ctx.lineTo(2, 3); ctx.closePath(); ctx.fill()
      ctx.fillStyle = '#ffffff'; ctx.fillRect(-7, -3, 4, 2); ctx.fillRect(-7, 1, 4, 2)
      ctx.restore()
      for (let tr = 1; tr <= 4; tr++) {
        const tp = Math.max(0, prog - tr * 0.04)
        const tx2 = fx.x + (fx.tx - fx.x) * tp, ty2 = fx.y + (fx.ty - fx.y) * tp - Math.sin(tp * Math.PI) * 14
        ctx.beginPath(); ctx.arc(tx2, ty2, 2 - tr * 0.4, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(200,180,100,${0.3 - tr * 0.06})`; ctx.fill()
      }
    } else if (fx.type === 'multiArrow') {
      const prog = Math.min(1, fx.age / 18)
      ;[-0.25, 0, 0.25].forEach(offset => {
        const ax2 = fx.x + (fx.tx - fx.x) * prog
        const ay2 = fx.y + (fx.ty - fx.y) * prog - Math.sin(prog * Math.PI) * 14 + offset * 20 * prog
        const ang = Math.atan2(fx.ty - fx.y, fx.tx - fx.x) + offset * 0.3
        ctx.save(); ctx.translate(ax2, ay2); ctx.rotate(ang)
        ctx.fillStyle = '#aa7733'; ctx.fillRect(-6, -1, 12, 2)
        ctx.fillStyle = '#ffcc44'; ctx.beginPath(); ctx.moveTo(6, 0); ctx.lineTo(2, -2.5); ctx.lineTo(2, 2.5); ctx.closePath(); ctx.fill()
        ctx.restore()
      })
    } else if (fx.type === 'fireball') {
      const prog = Math.min(1, fx.age / 20)
      const bx2 = fx.x + (fx.tx - fx.x) * prog, by2 = fx.y + (fx.ty - fx.y) * prog
      const r = 6 - t * 2
      const grad = ctx.createRadialGradient(bx2, by2, 0, bx2, by2, r + 4)
      grad.addColorStop(0, 'rgba(255,255,200,0.95)'); grad.addColorStop(0.4, 'rgba(255,120,20,0.8)'); grad.addColorStop(1, 'rgba(180,30,0,0)')
      ctx.beginPath(); ctx.arc(bx2, by2, r + 4, 0, Math.PI * 2); ctx.fillStyle = grad; ctx.fill()
      for (let tr = 1; tr <= 5; tr++) {
        const tp = Math.max(0, prog - tr * 0.05)
        const tx3 = fx.x + (fx.tx - fx.x) * tp, ty3 = fx.y + (fx.ty - fx.y) * tp
        ctx.beginPath(); ctx.arc(tx3, ty3, 4 - tr * 0.6, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255,${80 + tr * 20},0,${0.5 - tr * 0.08})`; ctx.fill()
      }
    } else if (fx.type === 'explosion') {
      const r = (fx.age / fx.life) * 28
      const gr = ctx.createRadialGradient(fx.x, fx.y, 0, fx.x, fx.y, r)
      gr.addColorStop(0, `rgba(255,255,180,${fx.alpha})`); gr.addColorStop(0.4, `rgba(255,100,0,${fx.alpha * 0.8})`); gr.addColorStop(1, `rgba(180,30,0,0)`)
      ctx.beginPath(); ctx.arc(fx.x, fx.y, r, 0, Math.PI * 2); ctx.fillStyle = gr; ctx.fill()
      ctx.beginPath(); ctx.arc(fx.x, fx.y, r * 1.3, 0, Math.PI * 2)
      ctx.strokeStyle = `rgba(255,180,50,${fx.alpha * 0.5})`; ctx.lineWidth = 2; ctx.stroke()
    } else if (fx.type === 'holy') {
      const r = 8 + t * 12
      const gr = ctx.createRadialGradient(fx.x, fx.y - 10, 0, fx.x, fx.y, r + 10)
      gr.addColorStop(0, 'rgba(255,255,200,0.95)'); gr.addColorStop(0.5, 'rgba(220,200,255,0.6)'); gr.addColorStop(1, 'rgba(180,160,255,0)')
      ctx.fillStyle = gr; ctx.fillRect(fx.x - 6, fx.y - r - 10, 12, r * 2 + 10)
      ctx.strokeStyle = `rgba(255,240,150,${fx.alpha})`; ctx.lineWidth = 3; ctx.lineCap = 'round'
      ctx.beginPath(); ctx.moveTo(fx.x, fx.y - r - 10); ctx.lineTo(fx.x, fx.y + r); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(fx.x - r * 0.6, fx.y - r * 0.3); ctx.lineTo(fx.x + r * 0.6, fx.y - r * 0.3); ctx.stroke()
      for (let sp = 0; sp < 6; sp++) {
        const ang = sp * (Math.PI / 3) + t * Math.PI * 3; const sr = r * 0.7
        ctx.beginPath(); ctx.arc(fx.x + Math.cos(ang) * sr, fx.y + Math.sin(ang) * sr * 0.5, 2, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255,255,180,${fx.alpha * 0.8})`; ctx.fill()
      }
    } else if (fx.type === 'shadowstrike') {
      const prog = Math.min(1, fx.age / 10)
      ;[[-1, 1], [1, -1], [0, 1.5]].forEach(([dx, dy], si) => {
        const len = 20 * prog
        ctx.beginPath()
        ctx.moveTo(fx.x - dx * len * 0.3, fx.y - dy * len * 0.3)
        ctx.lineTo(fx.x + dx * len, fx.y + dy * len * 0.5)
        ctx.strokeStyle = si === 0 ? '#cc44ff' : '#8822cc'; ctx.lineWidth = 3 - si; ctx.lineCap = 'round'; ctx.stroke()
      })
    } else if (fx.type === 'hit') {
      for (let sp = 0; sp < 6; sp++) {
        const ang = sp * (Math.PI / 3) + t; const r2 = (4 + t * 8) * (1 - t)
        ctx.beginPath(); ctx.arc(fx.x + Math.cos(ang) * r2, fx.y + Math.sin(ang) * r2, 2, 0, Math.PI * 2)
        ctx.fillStyle = fx.color; ctx.fill()
      }
    } else if (fx.type === 'questBanner') {
      const scale2 = 1 + Math.sin(fx.age * 0.15) * 0.08
      ctx.save(); ctx.translate(fx.x, fx.y); ctx.scale(scale2, scale2)
      ctx.font = `bold ${Math.min(24, 14 + fx.age)}px Noto Sans TC`; ctx.textAlign = 'center'
      ctx.strokeStyle = 'rgba(0,0,0,0.8)'; ctx.lineWidth = 4; ctx.strokeText(fx.text, 0, 0)
      ctx.fillStyle = fx.color; ctx.fillText(fx.text, 0, 0); ctx.restore()
    } else {
      ctx.font = 'bold 14px sans-serif'; ctx.textAlign = 'center'
      ctx.strokeStyle = 'rgba(0,0,0,.7)'; ctx.lineWidth = 2.5
      ctx.strokeText(fx.text, fx.x, fx.y); ctx.fillStyle = fx.color; ctx.fillText(fx.text, fx.x, fx.y)
    }

    ctx.restore()
    fx.y -= 0.4; fx.alpha -= 1 / fx.life
    if (fx.alpha <= 0) combatFX.splice(i, 1)
  }
}
