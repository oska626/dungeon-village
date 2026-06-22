/**
 * data.js — All static game data (GAME_DATA)
 * Buildings, classes, monsters, dungeons, quests, equipment, walls, resources.
 * This file should be edited when adding new content.
 * No game logic here — pure data only.
 */

export const GAME_DATA = {
  buildings: [
    { id:"inn",        name:"旅館",   emoji:"🏨", cost:200, buildTime:30, baseIncome:15, popularity:10, satisfaction:8,  buffStat:"hp",  buffAmt:10, desc:"恢復HP，每日穩定收入",         color:"#2d6a4f", roofStyle:"peak",    roofColor:"#c85a2a", synergyWith:["cake_shop"], synergyBonus:"滿足度+50%",      unlockPop:0  },
    { id:"weapon_shop",name:"武器店", emoji:"⚔️",  cost:350, buildTime:20, baseIncome:20, popularity:15, satisfaction:12, buffStat:"atk", buffAmt:5,  desc:"提升ATK，高收益商業",           color:"#8b1a1a", roofStyle:"tower",   roofColor:"#6a1010", flagColor:"#cc2222", synergyWith:["armor_shop"], synergyBonus:"ATK+DEF+15%",    unlockPop:0  },
    { id:"cake_shop",  name:"蛋糕店", emoji:"🎂",  cost:150, buildTime:15, baseIncome:10, popularity:20, satisfaction:20, buffStat:"satisfaction", buffAmt:15, desc:"大幅提升滿足度人氣", color:"#7a4a8a", roofStyle:"chimney", roofColor:"#5a3a6a", synergyWith:["inn"],  synergyBonus:"旅館回血+30%",   unlockPop:0  },
    { id:"armor_shop", name:"防具店", emoji:"🛡️",  cost:400, buildTime:20, baseIncome:18, popularity:12, satisfaction:10, buffStat:"def", buffAmt:8,  desc:"提升DEF+格擋率，Lv3達28%格擋", color:"#1a4a7a", roofStyle:"tower",   roofColor:"#0a2a5a", flagColor:"#2244cc", synergyWith:["weapon_shop"], synergyBonus:"武器店收入+25%", unlockPop:0  },
    { id:"magic_tower",name:"魔法塔", emoji:"🔮",  cost:600, buildTime:50, baseIncome:30, popularity:25, satisfaction:15, buffStat:"atk", buffAmt:15, desc:"解鎖魔法職業，強化魔法師",       color:"#4a1a7a", roofStyle:"dome",    roofColor:"#8822cc", roofIcon:"🌙", synergyWith:["guild"], synergyBonus:"EXP+40%",       unlockPop:40 },
    { id:"guild",      name:"公會",   emoji:"🏛️",  cost:500, buildTime:40, baseIncome:25, popularity:30, satisfaction:5,  buffStat:"exp", buffAmt:20, desc:"加速等級成長",                   color:"#7a5a00", roofStyle:"tower",   roofColor:"#5a4000", flagColor:"#ddaa00", synergyWith:["magic_tower"], synergyBonus:"魔法塔人氣+20%", unlockPop:30 },
    { id:"market",     name:"市集",   emoji:"🏪",  cost:300, buildTime:35, baseIncome:22, popularity:18, satisfaction:14, buffStat:"gold",buffAmt:10, desc:"提升金幣掉落，吸引商人",         color:"#5a3a1a", roofStyle:"awning",  roofColor:"#cc6600", synergyWith:["cake_shop","inn"], synergyBonus:"商業收入+20%", unlockPop:20 },
    { id:"temple",     name:"神殿",   emoji:"⛩️",  cost:700, buildTime:60, baseIncome:12, popularity:35, satisfaction:25, buffStat:"def", buffAmt:12, desc:"大幅提升人氣，聖域庇護",         color:"#3a2a6a", roofStyle:"dome",    roofColor:"#cc4400", roofIcon:"✦", synergyWith:["guild"], synergyBonus:"居民幸福感+30%", unlockPop:60 },
    { id:"forge",      name:"打鐵店", emoji:"🔨",  cost:450, buildTime:30, baseIncome:18, popularity:12, satisfaction:8,  buffStat:"atk", buffAmt:8,  desc:"冒險者可升級裝備，需資源",       color:"#5a3010", roofStyle:"chimney", roofColor:"#3a2000", synergyWith:["weapon_shop","armor_shop"], synergyBonus:"裝備升級費-30%", unlockPop:25 },
    { id:"house",      name:"住宅",   emoji:"🏡",  cost:120, buildTime:5,  baseIncome:5,  popularity:5,  satisfaction:3,  buffStat:"hp",  buffAmt:5,  desc:"提供一個冒險者居住，必須先建才可招募", color:"#3a5a2a", roofStyle:"peak", roofColor:"#a05020", synergyWith:["inn"], synergyBonus:"旅館回血+15%",   unlockPop:0, isHouse:true },
  ],

  adventurerClasses: [
    // ── Tier 0 Starter ──
    { id:"novice",      name:"見習生",   emoji:"🧑",  baseHP:100, baseATK:8,  baseDEF:5,  baseSPD:1.2,  unlockPop:0,   color:"#aaaaaa", expToLevel:100, goldCapacity:150, mpMax:5,  attackType:"melee",  attackRange:1, baseBlock:0.05, skill:{ name:"蠻力",   emoji:"💪", mpCost:2, dmgMult:1.8, skillType:"melee"  } },
    // ── Tier 1 (promoted from novice) ──
    { id:"warrior",     name:"戰士",     emoji:"⚔️",  baseHP:180, baseATK:22, baseDEF:18, baseSPD:1.0,  unlockPop:0,   color:"#cc8844", expToLevel:150, goldCapacity:250, mpMax:6,  attackType:"melee",  attackRange:1, baseBlock:0.15, skill:{ name:"破甲斬", emoji:"⚔️", mpCost:2, dmgMult:2.0, skillType:"melee"  } },
    { id:"mage",        name:"法師",     emoji:"🪄",  baseHP:100, baseATK:28, baseDEF:6,  baseSPD:1.0,  unlockPop:0,   color:"#9966cc", expToLevel:150, goldCapacity:250, mpMax:10, attackType:"magic",  attackRange:3, baseBlock:0.05, skill:{ name:"魔力彈", emoji:"✨", mpCost:2, dmgMult:2.2, skillType:"magic"  } },
    // ── Tier 2 ──
    { id:"knight",      name:"騎士",     emoji:"🗡️",  baseHP:200, baseATK:18, baseDEF:20, baseSPD:0.9,  unlockPop:50,  color:"#5599ff", expToLevel:200, goldCapacity:300, mpMax:8,  attackType:"melee",  attackRange:1, baseBlock:0.20, skill:{ name:"聖斬",   emoji:"⚡", mpCost:3, dmgMult:2.5, skillType:"melee"  } },
    { id:"berserker",   name:"狂戰士",   emoji:"🪓",  baseHP:160, baseATK:38, baseDEF:8,  baseSPD:1.3,  unlockPop:0,   color:"#cc3300", expToLevel:220, goldCapacity:300, mpMax:4,  attackType:"melee",  attackRange:1, baseBlock:0.08, skill:{ name:"狂暴",   emoji:"🩸", mpCost:2, dmgMult:2.8, skillType:"melee"  } },
    { id:"fire_mage",   name:"火焰法師", emoji:"🔥",  baseHP:120, baseATK:35, baseDEF:8,  baseSPD:1.0,  unlockPop:80,  color:"#ff5522", expToLevel:250, goldCapacity:400, mpMax:12, attackType:"magic",  attackRange:4, baseBlock:0.05, skill:{ name:"炎爆",   emoji:"🔥", mpCost:4, dmgMult:3.5, skillType:"magic"  } },
    { id:"ice_mage",    name:"冰霜法師", emoji:"❄️",  baseHP:130, baseATK:30, baseDEF:10, baseSPD:0.9,  unlockPop:0,   color:"#44aacc", expToLevel:250, goldCapacity:350, mpMax:12, attackType:"magic",  attackRange:4, baseBlock:0.05, skill:{ name:"冰霜術", emoji:"❄️", mpCost:3, dmgMult:2.8, skillType:"magic"  } },
    { id:"ranger",      name:"遊俠",     emoji:"🏹",  baseHP:150, baseATK:22, baseDEF:12, baseSPD:1.4,  unlockPop:60,  color:"#55cc44", expToLevel:180, goldCapacity:250, mpMax:6,  attackType:"ranged", attackRange:5, baseBlock:0.08, skill:{ name:"連射",   emoji:"🎯", mpCost:2, dmgMult:2.0, skillType:"ranged" } },
    { id:"assassin",    name:"刺客",     emoji:"🗡",  baseHP:110, baseATK:42, baseDEF:9,  baseSPD:1.6,  unlockPop:90,  color:"#aa44aa", expToLevel:220, goldCapacity:350, mpMax:7,  attackType:"melee",  attackRange:1, baseBlock:0.10, skill:{ name:"暗殺",   emoji:"💀", mpCost:3, dmgMult:4.0, skillType:"melee"  } },
    // ── Tier 3 (max) ──
    { id:"paladin",     name:"聖騎士",   emoji:"✨",  baseHP:250, baseATK:25, baseDEF:28, baseSPD:0.85, unlockPop:100, color:"#ffdd55", expToLevel:300, goldCapacity:500, mpMax:10, attackType:"magic",  attackRange:3, baseBlock:0.25, skill:{ name:"神聖光", emoji:"✨", mpCost:5, dmgMult:3.0, skillType:"magic"  } },
    { id:"dark_knight", name:"暗黑騎士", emoji:"🌑",  baseHP:230, baseATK:28, baseDEF:22, baseSPD:0.9,  unlockPop:0,   color:"#442266", expToLevel:300, goldCapacity:450, mpMax:8,  attackType:"melee",  attackRange:1, baseBlock:0.22, skill:{ name:"黑暗劍", emoji:"💜", mpCost:4, dmgMult:2.8, skillType:"melee"  } },
    { id:"archmage",    name:"大魔法師", emoji:"🌌",  baseHP:140, baseATK:50, baseDEF:10, baseSPD:0.95, unlockPop:0,   color:"#cc44ff", expToLevel:350, goldCapacity:500, mpMax:20, attackType:"magic",  attackRange:5, baseBlock:0.05, skill:{ name:"天隕石", emoji:"☄️", mpCost:6, dmgMult:5.0, skillType:"magic"  } },
    { id:"dark_witch",  name:"黑暗魔女", emoji:"🧙",  baseHP:130, baseATK:45, baseDEF:8,  baseSPD:1.1,  unlockPop:0,   color:"#882244", expToLevel:320, goldCapacity:480, mpMax:16, attackType:"magic",  attackRange:4, baseBlock:0.05, skill:{ name:"詛咒",   emoji:"🔮", mpCost:4, dmgMult:2.5, skillType:"magic"  } },
    { id:"sniper",      name:"狙擊手",   emoji:"🎯",  baseHP:140, baseATK:32, baseDEF:10, baseSPD:1.5,  unlockPop:0,   color:"#44bb44", expToLevel:200, goldCapacity:300, mpMax:6,  attackType:"ranged", attackRange:7, baseBlock:0.08, skill:{ name:"爆頭",   emoji:"💥", mpCost:2, dmgMult:3.5, skillType:"ranged" } },
    { id:"beast_master",name:"御獸師",   emoji:"🐺",  baseHP:170, baseATK:25, baseDEF:15, baseSPD:1.2,  unlockPop:0,   color:"#886622", expToLevel:220, goldCapacity:280, mpMax:8,  attackType:"melee",  attackRange:2, baseBlock:0.12, skill:{ name:"狼嚙",   emoji:"🐺", mpCost:3, dmgMult:2.0, skillType:"melee"  } },
    { id:"shadow",      name:"暗影刺客", emoji:"🌙",  baseHP:120, baseATK:50, baseDEF:10, baseSPD:1.8,  unlockPop:0,   color:"#664488", expToLevel:280, goldCapacity:400, mpMax:8,  attackType:"melee",  attackRange:1, baseBlock:0.12, skill:{ name:"死亡印", emoji:"💀", mpCost:3, dmgMult:4.5, skillType:"melee"  } },
  ],

  // ── Class promotion skill tree ──
  // active: triggered in combat (cooldown in seconds)
  // passive: applied once when promoted (stat bonuses)
  classSkills: {
    warrior:     { active:{ id:'shield_bash',  name:'盾擊',     emoji:'🛡', cd:15, dmgMult:1.8, skillType:'melee',  desc:'重擊造成180%傷害' },
                   passive:{ id:'iron_body',    name:'鐵身術',   emoji:'💪', desc:'最大HP +25%，DEF +20%',    statEffect:{ hpMult:1.25, defMult:1.2  } } },
    mage:        { active:{ id:'mana_bolt',    name:'魔力彈',   emoji:'✨', cd:12, dmgMult:2.2, skillType:'magic',  desc:'造成220%魔法傷害' },
                   passive:{ id:'arcane_mind',  name:'秘術之心', emoji:'🧠', desc:'MP上限 +80%，ATK +15%',    statEffect:{ mpMult:1.8,  atkMult:1.15 } } },
    knight:      { active:{ id:'holy_slash',   name:'聖斬衝',   emoji:'⚡', cd:18, dmgMult:2.5, skillType:'melee',  desc:'造成250%傷害' },
                   passive:{ id:'guard_stance', name:'守護姿態', emoji:'🔰', desc:'格擋率 +15%',               statEffect:{ blockBonus:0.15 } } },
    berserker:   { active:{ id:'berserk_blow', name:'狂暴衝撞', emoji:'🩸', cd:20, dmgMult:3.0, skillType:'melee',  desc:'造成300%傷害，自身-5%HP', selfDmgPct:0.05 },
                   passive:{ id:'blood_thirst', name:'嗜血',     emoji:'🦷', desc:'攻擊時回復傷害8%的HP',      statEffect:{ bloodThirst:true } } },
    fire_mage:   { active:{ id:'fireball',     name:'炎爆術',   emoji:'🔥', cd:22, dmgMult:3.5, skillType:'magic',  desc:'造成350%火焰傷害' },
                   passive:{ id:'fire_aura',    name:'火焰護體', emoji:'🌋', desc:'ATK +25%',                  statEffect:{ atkMult:1.25 } } },
    ice_mage:    { active:{ id:'blizzard',     name:'冰風暴',   emoji:'❄️', cd:25, dmgMult:2.8, skillType:'magic',  desc:'造成280%冰雪傷害' },
                   passive:{ id:'frost_body',   name:'冰霜之體', emoji:'🧊', desc:'DEF +30%，HP +15%',         statEffect:{ defMult:1.3, hpMult:1.15 } } },
    ranger:      { active:{ id:'multishot',    name:'連環射擊', emoji:'🎯', cd:14, dmgMult:1.5, skillType:'ranged', desc:'連射造成150%傷害×2' },
                   passive:{ id:'eagle_eye',    name:'鷹眼',     emoji:'👁', desc:'攻擊距離 +2，ATK +10%',     statEffect:{ rangeFlatBonus:2, atkMult:1.1 } } },
    assassin:    { active:{ id:'backstab',     name:'背刺',     emoji:'💀', cd:16, dmgMult:4.0, skillType:'melee',  desc:'造成400%暗殺傷害' },
                   passive:{ id:'shadow_step',  name:'影步',     emoji:'🌑', desc:'攻速 +30%，ATK +10%',       statEffect:{ speedMult:0.7, atkMult:1.1 } } },
    paladin:     { active:{ id:'divine_light', name:'神聖光輝', emoji:'☀️', cd:28, dmgMult:3.0, skillType:'magic',  desc:'造成300%傷害，回復20%HP', healPct:0.2 },
                   passive:{ id:'holy_aura',    name:'聖光護體', emoji:'✨', desc:'全隊HP回復 +30%，DEF +15%', statEffect:{ defMult:1.15, holyAura:true } } },
    dark_knight: { active:{ id:'soul_drain',   name:'靈魂汲取', emoji:'💜', cd:24, dmgMult:2.8, skillType:'melee',  desc:'造成280%傷害，汲取50%為HP', healPct:0.5 },
                   passive:{ id:'dark_aura',    name:'暗黑護體', emoji:'🌑', desc:'受傷時反彈10%，HP +20%',    statEffect:{ hpMult:1.2, darkAura:true } } },
    archmage:    { active:{ id:'meteor',       name:'天降隕石', emoji:'☄️', cd:35, dmgMult:5.0, skillType:'magic',  desc:'造成500%魔法傷害' },
                   passive:{ id:'mana_well',    name:'魔力源泉', emoji:'💧', desc:'MP回速 ×2，ATK +20%',       statEffect:{ mpRegenMult:2, atkMult:1.2 } } },
    dark_witch:  { active:{ id:'hex',          name:'詛咒',     emoji:'🔮', cd:20, dmgMult:2.5, skillType:'magic',  desc:'造成250%傷害，穿透防禦', ignoreDef:true },
                   passive:{ id:'dark_pact',    name:'暗黑契約', emoji:'📿', desc:'ATK +30%，HP -10%',         statEffect:{ atkMult:1.3, hpMult:0.9 } } },
    sniper:      { active:{ id:'headshot',     name:'精準爆頭', emoji:'💥', cd:20, dmgMult:3.5, skillType:'ranged', desc:'造成350%傷害，穿透防禦', ignoreDef:true },
                   passive:{ id:'camouflage',   name:'自然偽裝', emoji:'🌿', desc:'攻擊距離 +3，ATK +15%',     statEffect:{ rangeFlatBonus:3, atkMult:1.15 } } },
    beast_master:{ active:{ id:'wolf_strike',  name:'狼群衝擊', emoji:'🐺', cd:18, dmgMult:2.0, skillType:'melee',  desc:'造成200%×2連擊傷害' },
                   passive:{ id:'beast_bond',   name:'獸族羈絆', emoji:'🤝', desc:'ATK +20%，HP +25%',         statEffect:{ atkMult:1.2, hpMult:1.25 } } },
    shadow:      { active:{ id:'death_mark',   name:'死亡印記', emoji:'🌙', cd:18, dmgMult:4.5, skillType:'melee',  desc:'造成450%傷害' },
                   passive:{ id:'vanish',       name:'消影術',   emoji:'👻', desc:'攻速 +40%，ATK +15%',       statEffect:{ speedMult:0.6, atkMult:1.15 } } },
  },

  // ── Promotion chains ──
  classPromotions: {
    novice:    { reqLevel: 5,  branches: ['warrior',    'mage'],        desc:'選擇你的戰鬥風格！' },
    warrior:   { reqLevel: 15, branches: ['knight',     'berserker'],   desc:'精進戰技，走向王者之路！' },
    mage:      { reqLevel: 15, branches: ['fire_mage',  'ice_mage'],    desc:'掌握元素的力量！' },
    knight:    { reqLevel: 25, branches: ['paladin',    'dark_knight'], desc:'選擇光明或黑暗！' },
    fire_mage: { reqLevel: 25, branches: ['archmage',   'dark_witch'],  desc:'登上魔法的巔峰！' },
    ranger:    { reqLevel: 15, branches: ['sniper',     'beast_master'],desc:'精通遠程或馭獸之術！' },
    assassin:  { reqLevel: 20, branches: ['shadow',     'shadow'],      desc:'化為暗影，成為終極刺客！' },
    berserker: { reqLevel: 25, branches: ['dark_knight','shadow'],      desc:'暴力的極致！' },
    ice_mage:  { reqLevel: 25, branches: ['archmage',   'dark_witch'],  desc:'冰雪昇華為最強魔法！' },
  },

  monsters: [
    { id:"slime",  name:"史萊姆", emoji:"🟢", hp:30,  atk:4,  def:2,  goldMin:3,  goldMax:8,  expReward:12,  spawnWeight:40, night:false },
    { id:"goblin", name:"哥布林", emoji:"👺", hp:60,  atk:10, def:5,  goldMin:8,  goldMax:18, expReward:28,  spawnWeight:30, night:false },
    { id:"orc",    name:"獸人",   emoji:"👹", hp:120, atk:18, def:10, goldMin:18, goldMax:38, expReward:55,  spawnWeight:18, night:false },
    { id:"witch",  name:"黑女巫", emoji:"🧙‍♀️",hp:90,  atk:22, def:6,  goldMin:15, goldMax:30, expReward:44,  spawnWeight:10, night:false },
    { id:"dragon", name:"小龍",   emoji:"🐉", hp:250, atk:30, def:20, goldMin:45, goldMax:90, expReward:110, spawnWeight:2,  night:false },
  ],

  nightMonsters: [
    { id:"skeleton", name:"骷髏",   emoji:"💀", hp:70,  atk:14, def:4,  goldMin:10, goldMax:22, expReward:35,  spawnWeight:35 },
    { id:"ghost",    name:"幽靈",   emoji:"👻", hp:50,  atk:18, def:0,  goldMin:8,  goldMax:20, expReward:30,  spawnWeight:30 },
    { id:"vampire",  name:"吸血鬼", emoji:"🧛", hp:110, atk:20, def:8,  goldMin:20, goldMax:40, expReward:60,  spawnWeight:20 },
    { id:"nightfiend",name:"夜魔",  emoji:"😈", hp:90,  atk:25, def:6,  goldMin:18, goldMax:35, expReward:50,  spawnWeight:12 },
    { id:"lich",     name:"巫妖",   emoji:"🧟", hp:200, atk:28, def:12, goldMin:40, goldMax:80, expReward:100, spawnWeight:3  },
  ],

  wallTiers: [
    { level:1, name:"木欄",     color:"#8B6914", topColor:"#aa8822", hp:80,  repair:20,  emoji:"🪵" },
    { level:2, name:"泥牆",     color:"#8B7355", topColor:"#aa9966", hp:160, repair:40,  emoji:"🧱" },
    { level:3, name:"石牆",     color:"#777788", topColor:"#9999aa", hp:280, repair:80,  emoji:"⬛" },
    { level:4, name:"鐵牆",     color:"#556677", topColor:"#7799aa", hp:450, repair:150, emoji:"⚙️" },
    { level:5, name:"原力氣牆", color:"#442266", topColor:"#9933ff", hp:800, repair:300, emoji:"✨" },
  ],

  resources: [
    { id:"wood",   name:"木材", emoji:"🪵", color:"#8B4513" },
    { id:"stone",  name:"石材", emoji:"🪨", color:"#888888" },
    { id:"iron",   name:"鐵礦", emoji:"⛏️", color:"#667788" },
    { id:"water",  name:"水源", emoji:"💧", color:"#3399cc" },
    { id:"crystal",name:"水晶", emoji:"💎", color:"#aa88ff" },
  ],

  resourceNodes: [
    { type:"wood",   gx:3,  gy:2,  max:5, respawn:40  },
    { type:"wood",   gx:5,  gy:3,  max:5, respawn:40  },
    { type:"stone",  gx:1,  gy:4,  max:4, respawn:55  },
    { type:"stone",  gx:4,  gy:12, max:4, respawn:55  },
    { type:"iron",   gx:17, gy:3,  max:3, respawn:80  },
    { type:"iron",   gx:19, gy:10, max:3, respawn:80  },
    { type:"water",  gx:6,  gy:1,  max:6, respawn:30  },
    { type:"crystal",gx:20, gy:6,  max:2, respawn:120 },
  ],

  quests: [
    { id:"q_build1",    name:"第一棟建築",  desc:"建造任意建築 1 棟",         type:"build",        target:1,   reward:{ gold:120, pop:10 },                       milestone:false },
    { id:"q_build3",    name:"建設大師",    desc:"建造 3 棟不同建築",          type:"build",        target:3,   reward:{ gold:250, pop:20 },                       milestone:false },
    { id:"q_adv3",      name:"廣招天下",    desc:"同時擁有 3 位冒險者",        type:"adventurers",  target:3,   reward:{ gold:180, pop:15 },                       milestone:false },
    { id:"q_kill10",    name:"怪物剋星",    desc:"累計擊殺 10 隻怪物",         type:"kills",        target:10,  reward:{ gold:200, pop:20, expBonus:30 },          milestone:false },
    { id:"q_kill50",    name:"怪物終結者",  desc:"累計擊殺 50 隻怪物",         type:"kills",        target:50,  reward:{ gold:480, pop:40 },                       milestone:true  },
    { id:"q_resident1", name:"定居首例",    desc:"讓第一位冒險者成為居民",     type:"residents",    target:1,   reward:{ gold:320, pop:30, unlockClass:"paladin" }, milestone:true  },
    { id:"q_dungeon1",  name:"地下城初探",  desc:"完成一次地下城挑戰",         type:"dungeons",     target:1,   reward:{ gold:240, pop:20 },                       milestone:false },
    { id:"q_level3",    name:"村莊繁榮",    desc:"村莊升至 3 星",              type:"townLevel",    target:3,   reward:{ gold:600, pop:50, unlockClass:"assassin" },milestone:true  },
    { id:"q_synergy1",  name:"協同效應",    desc:"觸發任意建築連鎖效果",       type:"synergies",    target:1,   reward:{ gold:160, pop:15 },                       milestone:false },
    { id:"q_sat80",     name:"居民天堂",    desc:"滿足度達到 80",              type:"satisfaction", target:80,  reward:{ gold:280, pop:30 },                       milestone:false },
    { id:"q_house3",    name:"安居樂業",    desc:"建造 3 棟住宅",              type:"houses",       target:3,   reward:{ gold:200, pop:20 },                       milestone:false },
  ],

  residentJobs: [
    { id:"innkeeper",        name:"旅館掌櫃", bonus:"旅館收入 +30%",    reqBuilding:"inn"          },
    { id:"blacksmith",       name:"鐵匠",     bonus:"全員ATK +3",       reqBuilding:"weapon_shop"  },
    { id:"baker",            name:"甜點師",   bonus:"滿足度每日+5",     reqBuilding:"cake_shop"    },
    { id:"armorer",          name:"鎧甲師",   bonus:"全員DEF +3",       reqBuilding:"armor_shop"   },
    { id:"archmage",         name:"大魔法師", bonus:"魔法師EXP +50%",   reqBuilding:"magic_tower"  },
    { id:"guildmaster",      name:"公會長",   bonus:"冒險者上限 +3",    reqBuilding:"guild"        },
    { id:"merchant",         name:"商人",     bonus:"所有收入 +15%",    reqBuilding:"market"       },
    { id:"priest",           name:"神父",     bonus:"HP恢復速度 +40%",  reqBuilding:"temple"       },
    { id:"blacksmith_master",name:"鐵匠大師", bonus:"裝備升級費-25%",   reqBuilding:"forge"        },
  ],

  equipment: [
    { id:"sword",  name:"劍",   slot:"weapon",  emoji:"⚔️", tiers:[
      { name:"木劍",   atkBonus:2,  cost:{ wood:2 },          forge:false },
      { name:"鐵劍",   atkBonus:6,  cost:{ iron:2, wood:1 },  forge:true  },
      { name:"精鋼劍", atkBonus:12, cost:{ iron:4, crystal:1 },forge:true },
    ]},
    { id:"shield", name:"盾",   slot:"offhand", emoji:"🛡️", tiers:[
      { name:"木盾",   defBonus:3,  blockBonus:0.05, cost:{ wood:3 },          forge:false },
      { name:"鐵盾",   defBonus:8,  blockBonus:0.10, cost:{ iron:2, stone:1 }, forge:true  },
      { name:"精鋼盾", defBonus:15, blockBonus:0.18, cost:{ iron:4, crystal:1 },forge:true },
    ]},
    { id:"armor",  name:"甲",   slot:"body",    emoji:"🥋", tiers:[
      { name:"皮甲",   defBonus:4,  cost:{ wood:2, stone:1 }, forge:false },
      { name:"鐵甲",   defBonus:10, cost:{ iron:3, stone:2 }, forge:true  },
      { name:"精鋼甲", defBonus:18, cost:{ iron:5, crystal:2 },forge:true },
    ]},
    { id:"staff",  name:"法杖", slot:"weapon",  emoji:"🪄", tiers:[
      { name:"木杖",   atkBonus:4,  cost:{ wood:3 },              forge:false },
      { name:"水晶杖", atkBonus:10, cost:{ wood:2, crystal:1 },   forge:true  },
      { name:"龍晶杖", atkBonus:20, cost:{ iron:2, crystal:3 },   forge:true  },
    ]},
    { id:"bow",    name:"弓",   slot:"weapon",  emoji:"🏹", tiers:[
      { name:"木弓",   atkBonus:3,  cost:{ wood:3 },              forge:false },
      { name:"複合弓", atkBonus:8,  cost:{ wood:2, iron:1 },      forge:true  },
      { name:"精鋼弓", atkBonus:15, cost:{ iron:3, crystal:1 },   forge:true  },
    ]},
  ],

  dungeons: [
    { id:"cave",    name:"幽暗洞窟", emoji:"🕳", reqPop:0,   floors_data:[
      { name:"入口通道", diff:"easy",   monsters:["slime","goblin"], hpMult:1.0, atkMult:1.0, goldReward:35,  expReward:50,  itemReward:"小藥水" },
      { name:"深層走廊", diff:"normal", monsters:["goblin","orc"],   hpMult:1.3, atkMult:1.2, goldReward:65,  expReward:100, itemReward:"中藥水" },
      { name:"魔王室",   diff:"boss",   monsters:["orc","witch"],    hpMult:2.0, atkMult:1.5, goldReward:130, expReward:200, itemReward:"稀有裝備" },
    ]},
    { id:"forest",  name:"幽魂森林", emoji:"🌲", reqPop:50,  floors_data:[
      { name:"迷霧林道", diff:"normal", monsters:["goblin","witch"], hpMult:1.4, atkMult:1.2, goldReward:55,  expReward:85,  itemReward:"中藥水" },
      { name:"古樹神殿", diff:"hard",   monsters:["witch","orc"],    hpMult:1.8, atkMult:1.4, goldReward:100, expReward:150, itemReward:"魔法石" },
      { name:"森之魔王", diff:"boss",   monsters:["dragon"],         hpMult:2.5, atkMult:1.8, goldReward:220, expReward:320, itemReward:"龍晶" },
    ]},
    { id:"volcano", name:"熔岩火山", emoji:"🌋", reqPop:100, floors_data:[
      { name:"岩漿坑道", diff:"hard",   monsters:["orc","dragon"],   hpMult:2.0, atkMult:1.6, goldReward:90,  expReward:130, itemReward:"火焰石" },
      { name:"熔岩平原", diff:"hard",   monsters:["witch","dragon"], hpMult:2.5, atkMult:1.9, goldReward:160, expReward:230, itemReward:"熔岩盔甲" },
      { name:"火龍巢穴", diff:"boss",   monsters:["dragon"],         hpMult:4.0, atkMult:2.5, goldReward:360, expReward:560, itemReward:"龍王武器" },
    ]},
  ],

  satisfactionEffects: [
    { id:'hp_regen',   name:'HP回復 ×1.5', emoji:'💚', desc:'冒險者休息時HP回復速度提升50%' },
    { id:'mp_regen',   name:'MP回復 ×1.5', emoji:'💙', desc:'冒險者MP回復速度提升50%' },
    { id:'resource',   name:'資源+50%機率', emoji:'🌿', desc:'採集時50%機率額外獲得一份資源' },
    { id:'recruit',    name:'招募機率+25%', emoji:'🧙', desc:'每天吸引新冒險者的機率提升25%' },
    { id:'income',     name:'收入+15%',     emoji:'💰', desc:'所有建築日收入提升15%' },
    { id:'combat_dmg', name:'傷害+10%',     emoji:'⚔️', desc:'冒險者戰鬥傷害提升10%' },
  ],

  events: {
    math: [
      // diff 1 (townLevel 1-2) reward:200 penalty:100
      { q:'7 × 8 = ?',         opts:['54','56','58','64'],               ans:1, diff:1, reward:200, penalty:100 },
      { q:'36 ÷ 4 = ?',        opts:['7','8','9','10'],                  ans:2, diff:1, reward:200, penalty:100 },
      { q:'15 + 28 = ?',       opts:['41','43','45','47'],               ans:1, diff:1, reward:200, penalty:100 },
      { q:'64 - 37 = ?',       opts:['25','27','29','31'],               ans:1, diff:1, reward:200, penalty:100 },
      { q:'6 × 9 = ?',         opts:['48','52','54','56'],               ans:2, diff:1, reward:200, penalty:100 },
      { q:'100 ÷ 5 = ?',       opts:['15','18','20','25'],               ans:2, diff:1, reward:200, penalty:100 },
      { q:'13 × 7 = ?',        opts:['81','87','91','97'],               ans:2, diff:1, reward:200, penalty:100 },
      { q:'45 + 56 = ?',       opts:['99','101','103','105'],            ans:1, diff:1, reward:200, penalty:100 },
      { q:'8² = ?',            opts:['56','60','64','68'],               ans:2, diff:1, reward:200, penalty:100 },
      { q:'72 ÷ 9 = ?',        opts:['6','7','8','9'],                   ans:2, diff:1, reward:200, penalty:100 },
      // diff 2 (townLevel 3-4) reward:350 penalty:150
      { q:'17 × 13 = ?',       opts:['201','211','221','231'],           ans:2, diff:2, reward:350, penalty:150 },
      { q:'144 ÷ 12 = ?',      opts:['10','11','12','13'],               ans:2, diff:2, reward:350, penalty:150 },
      { q:'25% × 200 = ?',     opts:['40','50','60','70'],               ans:1, diff:2, reward:350, penalty:150 },
      { q:'2³ + 3² = ?',       opts:['13','15','17','19'],               ans:2, diff:2, reward:350, penalty:150 },
      { q:'123 + 456 = ?',     opts:['567','577','579','589'],           ans:2, diff:2, reward:350, penalty:150 },
      { q:'15 × 15 = ?',       opts:['205','215','225','235'],           ans:2, diff:2, reward:350, penalty:150 },
      { q:'1000 - 473 = ?',    opts:['517','527','537','547'],           ans:1, diff:2, reward:350, penalty:150 },
      { q:'7² - 4² = ?',       opts:['29','33','37','41'],               ans:1, diff:2, reward:350, penalty:150 },
      { q:'18 × 6 = ?',        opts:['96','102','108','114'],            ans:2, diff:2, reward:350, penalty:150 },
      { q:'360 ÷ 15 = ?',      opts:['20','22','24','26'],               ans:2, diff:2, reward:350, penalty:150 },
      // diff 3 (townLevel 5+) reward:500 penalty:200
      { q:'23 × 17 = ?',       opts:['371','381','391','401'],           ans:2, diff:3, reward:500, penalty:200 },
      { q:'15% × 480 = ?',     opts:['62','68','72','78'],               ans:2, diff:3, reward:500, penalty:200 },
      { q:'√225 = ?',          opts:['13','14','15','16'],               ans:2, diff:3, reward:500, penalty:200 },
      { q:'2⁸ = ?',            opts:['128','256','512','1024'],          ans:1, diff:3, reward:500, penalty:200 },
      { q:'35% × 140 = ?',     opts:['45','49','53','57'],               ans:1, diff:3, reward:500, penalty:200 },
      { q:'999 × 9 = ?',       opts:['8881','8901','8991','9001'],       ans:2, diff:3, reward:500, penalty:200 },
      { q:'12³ = ?',           opts:['1528','1628','1728','1828'],       ans:2, diff:3, reward:500, penalty:200 },
      { q:'7 × 8 × 9 = ?',     opts:['484','494','504','514'],           ans:2, diff:3, reward:500, penalty:200 },
      { q:'100² - 99² = ?',    opts:['101','199','201','299'],           ans:1, diff:3, reward:500, penalty:200 },
      { q:'13² + 5 = ?',       opts:['169','174','175','176'],           ans:1, diff:3, reward:500, penalty:200 },
    ],
    knowledge: [
      { q:'香港有幾多個法定假期？',              opts:['12','15','17','19'],          ans:2, rewardDesc:'全體冒險者 HP 滿血！' },
      { q:'世界最高峰係？',                       opts:['K2','聖母峰','洛子峰','馬卡魯峰'], ans:1, rewardDesc:'人氣 +15！' },
      { q:'地球距太陽大約幾多億公里？',          opts:['1億','1.5億','2億','2.5億'],  ans:1, rewardDesc:'+250💰' },
      { q:'人體成人有幾多塊骨頭？',              opts:['186','206','226','246'],      ans:1, rewardDesc:'隨機冒險者 ATK +8！' },
      { q:'光速大約每秒幾多公里？',              opts:['3萬','30萬','300萬','3000萬'], ans:1, rewardDesc:'滿足度 +15！' },
      { q:'奧運會幾年舉辦一次？',                opts:['2年','3年','4年','5年'],      ans:2, rewardDesc:'+300💰' },
      { q:'現代廣州話有幾多個聲調？',            opts:['4','6','8','9'],              ans:1, rewardDesc:'人氣 +10！' },
      { q:'一年有幾多個星期？',                  opts:['48','52','56','60'],          ans:1, rewardDesc:'+200💰' },
      { q:'水喺標準大氣壓下沸點係幾多度？',      opts:['90°C','95°C','100°C','105°C'], ans:2, rewardDesc:'全體冒險者 MP 恢復滿！' },
      { q:'美國面積排世界第幾大？',              opts:['第2','第3','第4','第5'],      ans:1, rewardDesc:'+350💰' },
    ],
    funny: [
      { q:'勇者去廁所，但廁所被怪物佔領，點算？',        opts:['忍住繼續打','求怪物讓路','去隔壁廁所','原地解決'] },
      { q:'村莊選吉祥物，誰贏得投票？',                  opts:['史萊姆','骷髏戰士','村長本人','一隻野貓'] },
      { q:'神秘商人願意以物換物，你給了佢？',            opts:['一個謎語','村長的帽子','一首歌','三個伏地挺身'] },
      { q:'冒險者練劍，劍飛出去插入了...',               opts:['市長辦公室','旅館招牌','怪物額頭','蛋糕店蛋糕'] },
      { q:'怪物首領寄來一封信，內容係...',               opts:['宣戰書','求職信','情書','外賣訂單'] },
      { q:'廚師今天落錯料，係...',                       opts:['鳳凰之淚','史萊姆液','龍血','村長的鞋墊'] },
      { q:'冒險者發夢見到寶藏，位置係...',               opts:['廁所地磚下','村長枕頭底','自己背囊','蛋糕店後廚'] },
      { q:'冒險者發現地下城有WiFi，結果...',             opts:['開始打機唔打怪','直播打怪','完全忘記回來','下載地圖省時間'] },
      { q:'村莊廚藝比賽冠軍係...',                       opts:['最強劍士','一隻史萊姆','村長','神秘蒙面人'] },
      { q:'一隻小怪物想加入村莊做冒險者，你？',         opts:['歡迎加入','要先面試','拒絕但送點心','問佢識唔識烹飪'] },
    ],
  },

  satisfactionNegEffects: [
    { id:'mon_hp',       name:'怪物HP +15%',       emoji:'💀', desc:'所有怪物最大HP提升15%' },
    { id:'build_cost',   name:'建築費 +20%',        emoji:'🏗', desc:'所有建築建造費用提升20%' },
    { id:'exp_loss',     name:'EXP -20%',           emoji:'📉', desc:'冒險者戰鬥經驗獲取減少20%' },
    { id:'slow_gather',  name:'採集 -30%',          emoji:'🌲', desc:'資源採集速度減慢30%' },
    { id:'wall_repair',  name:'城牆維修 +50%',      emoji:'🏰', desc:'城牆修理費用提升50%' },
    { id:'recruit_cost', name:'招募費 +30%',        emoji:'💸', desc:'招募冒險者費用提升30%' },
    { id:'max_hp',       name:'冒險者HP -15%',      emoji:'❤️', desc:'所有冒險者最大HP減少15%' },
    { id:'maintenance',  name:'每天維護費 -5金/棟', emoji:'🔧', desc:'每棟建築每天額外扣除5金維護費' },
    { id:'mon_atk',      name:'怪物ATK +10%',       emoji:'⚔️', desc:'所有怪物攻擊力提升10%' },
    { id:'dungeon_gold', name:'地城獎勵 -25%',      emoji:'🗝', desc:'地下城金幣獎勵減少25%' },
    { id:'sat_decay',    name:'滿足度每天 -3',      emoji:'😤', desc:'滿足度每天自然下降3點' },
    { id:'slow_heal',    name:'回血效率 -33%',      emoji:'💔', desc:'冒險者休息回血速度降低33%' },
    { id:'upgrade_cost', name:'升級費 +25%',        emoji:'⬆️', desc:'建築升級費用提升25%' },
    { id:'pop_slow',     name:'人氣增長 -20%',      emoji:'📊', desc:'人氣增長速度減少20%' },
    { id:'fast_siege',   name:'攻城間隔 -20%',      emoji:'⚡', desc:'敵人攻城間隔縮短20%' },
    { id:'lv1_recruit',  name:'招募固定Lv1',        emoji:'🔰', desc:'新冒險者初始等級固定為1級' },
  ],
}
