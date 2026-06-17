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
    { id:"novice",    name:"見習生",   emoji:"🧑",  baseHP:100, baseATK:8,  baseDEF:5,  baseSPD:1.2,  unlockPop:0,   color:"#aaaaaa", expToLevel:100, goldCapacity:150, mpMax:5,  attackType:"melee",  attackRange:1, baseBlock:0.05, skill:{ name:"蠻力",   emoji:"💪", mpCost:2, dmgMult:1.8, skillType:"melee"  } },
    { id:"knight",    name:"騎士",     emoji:"🗡️",  baseHP:200, baseATK:18, baseDEF:20, baseSPD:0.9,  unlockPop:50,  color:"#5599ff", expToLevel:200, goldCapacity:300, mpMax:8,  attackType:"melee",  attackRange:1, baseBlock:0.20, skill:{ name:"聖斬",   emoji:"⚡", mpCost:3, dmgMult:2.5, skillType:"melee"  } },
    { id:"fire_mage", name:"火焰法師", emoji:"🔥",  baseHP:120, baseATK:35, baseDEF:8,  baseSPD:1.0,  unlockPop:80,  color:"#ff5522", expToLevel:250, goldCapacity:400, mpMax:12, attackType:"magic",  attackRange:4, baseBlock:0.05, skill:{ name:"炎爆",   emoji:"🔥", mpCost:4, dmgMult:3.5, skillType:"magic"  } },
    { id:"ranger",    name:"遊俠",     emoji:"🏹",  baseHP:150, baseATK:22, baseDEF:12, baseSPD:1.4,  unlockPop:60,  color:"#55cc44", expToLevel:180, goldCapacity:250, mpMax:6,  attackType:"ranged", attackRange:5, baseBlock:0.08, skill:{ name:"連射",   emoji:"🎯", mpCost:2, dmgMult:2.0, skillType:"ranged" } },
    { id:"paladin",   name:"聖騎士",   emoji:"✨",  baseHP:250, baseATK:25, baseDEF:28, baseSPD:0.85, unlockPop:100, color:"#ffdd55", expToLevel:300, goldCapacity:500, mpMax:10, attackType:"magic",  attackRange:3, baseBlock:0.25, skill:{ name:"神聖光", emoji:"✨", mpCost:5, dmgMult:3.0, skillType:"magic"  } },
    { id:"assassin",  name:"刺客",     emoji:"🗡",  baseHP:110, baseATK:42, baseDEF:9,  baseSPD:1.6,  unlockPop:90,  color:"#aa44aa", expToLevel:220, goldCapacity:350, mpMax:7,  attackType:"melee",  attackRange:1, baseBlock:0.10, skill:{ name:"暗殺",   emoji:"💀", mpCost:3, dmgMult:4.0, skillType:"melee"  } },
  ],

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
}
