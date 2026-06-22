import { G } from './state.js'
import { GAME_DATA } from './data.js'
import { addLog } from './ui.js'
import { updateTopBar, updateResourceDisplay } from './economy.js'

let _eventTimer = null
let _currentEvent = null
let _timeLeft = 10
const EVENT_SECONDS = 10

export function triggerRandomEvent() {
  if (G.day < 3 || G.paused || G.gameOver) return
  if (document.getElementById('event-overlay').classList.contains('show')) return

  // Pick category
  const cats = ['math', 'knowledge', 'funny']
  const cat = cats[Math.floor(Math.random() * cats.length)]

  let pool
  if (cat === 'math') {
    const diff = G.townLevel <= 2 ? 1 : G.townLevel <= 4 ? 2 : 3
    pool = GAME_DATA.events.math.filter(e => e.diff === diff)
  } else {
    pool = GAME_DATA.events[cat]
  }

  _currentEvent = { ...pool[Math.floor(Math.random() * pool.length)], cat }
  _timeLeft = EVENT_SECONDS

  _renderOverlay()
  document.getElementById('event-overlay').classList.add('show')
  G.paused = true
  document.getElementById('pause-overlay').classList.remove('show')

  _eventTimer = setInterval(() => {
    _timeLeft--
    _updateTimer()
    if (_timeLeft <= 0) { clearInterval(_eventTimer); _resolve(-1) }
  }, 1000)
}

export function chooseEvent(idx) {
  if (!_currentEvent) return
  clearInterval(_eventTimer)
  _resolve(idx)
}

function _resolve(idx) {
  const e = _currentEvent
  let resultText = '', good = false

  if (e.cat === 'funny') {
    const reward = _funnyReward()
    const choice = idx >= 0 ? e.opts[idx] : '超時'
    resultText = `「${choice}」→ ${reward}`
    good = true
  } else if (idx === -1) {
    if (e.cat === 'math') { G.gold = Math.max(0, G.gold - e.penalty); resultText = `⏱ 超時！損失 ${e.penalty}💰` }
    else resultText = '⏱ 超時！無獎勵'
  } else if (idx === e.ans) {
    good = true
    if (e.cat === 'math') { G.gold += e.reward; resultText = `✓ 正確！+${e.reward}💰` }
    else { _applyKnowledgeReward(e); resultText = `✓ 正確！${e.rewardDesc}` }
  } else {
    if (e.cat === 'math') { G.gold = Math.max(0, G.gold - e.penalty); resultText = `✗ 答錯！損失 ${e.penalty}💰` }
    else resultText = '✗ 答錯！無獎勵'
  }

  updateTopBar(); updateResourceDisplay()
  addLog(`📋 事件：${resultText}`, good ? 'level' : 'combat')

  const res = document.getElementById('event-result')
  res.textContent = resultText
  res.style.color = good ? 'var(--green-hi)' : 'var(--red-hi)'
  res.style.display = 'block'
  document.querySelectorAll('.event-opt').forEach(b => b.disabled = true)
  _currentEvent = null

  setTimeout(_closeOverlay, 2200)
}

function _applyKnowledgeReward(e) {
  const desc = e.rewardDesc
  if (desc.includes('HP')) G.adventurers.forEach(a => { a.hp = a.maxHp })
  else if (desc.includes('MP')) G.adventurers.forEach(a => { a.mp = a.mpMax })
  else if (desc.includes('💰')) G.gold += e.reward || parseInt(desc.match(/\d+/) || ['0'])
  else if (desc.includes('人氣')) G.popularity += parseInt(desc.match(/\d+/)?.[0] || 10)
  else if (desc.includes('滿足')) G.satisfaction = Math.min(100, G.satisfaction + parseInt(desc.match(/\d+/)?.[0] || 10))
  else if (desc.includes('ATK')) { const a = G.adventurers[Math.floor(Math.random() * G.adventurers.length)]; if (a) a.atk += 8 }
  // fallback gold from reward field
  if (!desc.includes('HP') && !desc.includes('MP') && !desc.includes('人氣') && !desc.includes('滿足') && !desc.includes('ATK')) {
    const m = desc.match(/\+(\d+)/)
    if (m) G.gold += parseInt(m[1])
  }
}

const _FUNNY_REWARDS = [
  { desc: '+100💰',               fn: () => { G.gold += 100 } },
  { desc: '+200💰',               fn: () => { G.gold += 200 } },
  { desc: '+300💰',               fn: () => { G.gold += 300 } },
  { desc: '全體HP滿血！',         fn: () => { G.adventurers.forEach(a => { a.hp = a.maxHp }) } },
  { desc: '人氣+15！',            fn: () => { G.popularity += 15 } },
  { desc: '滿足度+10！',          fn: () => { G.satisfaction = Math.min(100, G.satisfaction + 10) } },
  { desc: '木材+3！',             fn: () => { G.globalResources.wood = (G.globalResources.wood || 0) + 3 } },
  { desc: '石材+3！',             fn: () => { G.globalResources.stone = (G.globalResources.stone || 0) + 3 } },
  { desc: '冒險者EXP+80！',       fn: () => { const a = G.adventurers[Math.floor(Math.random() * G.adventurers.length)]; if (a) a.exp += 80 } },
  { desc: '+50💰 + 滿足+5！',     fn: () => { G.gold += 50; G.satisfaction = Math.min(100, G.satisfaction + 5) } },
]

function _funnyReward() {
  const r = _FUNNY_REWARDS[Math.floor(Math.random() * _FUNNY_REWARDS.length)]
  r.fn()
  return r.desc
}

function _renderOverlay() {
  const e = _currentEvent
  const catLabel = { math: '📐 數學挑戰', knowledge: '🌍 常識問答', funny: '😂 搞笑時刻' }[e.cat]
  let hint = ''
  if (e.cat === 'funny') hint = '🎲 每個選擇都有隨機獎勵！'
  else if (e.cat === 'math') hint = `答啱 +${e.reward}💰　答錯/超時 -${e.penalty}💰`
  else hint = `答啱：${e.rewardDesc}　答錯/超時：無獎勵`

  document.getElementById('event-cat').textContent = catLabel
  document.getElementById('event-q').textContent = e.q
  document.getElementById('event-hint').textContent = hint
  document.getElementById('event-result').style.display = 'none'
  document.getElementById('event-result').textContent = ''

  const optsEl = document.getElementById('event-opts')
  optsEl.innerHTML = e.opts.map((opt, i) =>
    `<button class="event-opt" onclick="chooseEvent(${i})">${opt}</button>`
  ).join('')

  _updateTimer()
}

function _updateTimer() {
  const fill = document.getElementById('event-timer-fill')
  const label = document.getElementById('event-timer-label')
  const pct = (_timeLeft / EVENT_SECONDS) * 100
  if (fill) {
    fill.style.width = pct + '%'
    fill.style.background = pct > 60 ? '#4caf50' : pct > 30 ? '#ff9800' : '#f44336'
  }
  if (label) label.textContent = _timeLeft + 's'
}

function _closeOverlay() {
  document.getElementById('event-overlay').classList.remove('show')
  G.paused = false
}
