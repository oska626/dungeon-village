# 山寨物語 — Claude Code Instructions

## Project Overview
Browser-based RPG Town Management game inspired by Kairosoft Dungeon Village 2.
Single canvas game, isometric 2.5D rendering, adventurer FSM AI, siege system.

## Architecture
```
src/
├── main.js      Entry point, game loop
├── state.js     Global state G + initState()
├── data.js      All static GAME_DATA (buildings, monsters, quests...)
├── render.js    Canvas 2D drawing (isometric tiles, sprites, FX)
├── ui.js        DOM panels, overlays, event listeners
├── fsm.js       Adventurer Finite State Machine (8 states)
├── economy.js   Building income, town level up, buffs
├── systems.js   Siege, resource respawn, forge, dungeon
├── sprites.js   Pixel sprite data (7×10 grid arrays)
└── style.css    All CSS variables and component styles
```

## Migration Status
- [x] data.js — Complete (all GAME_DATA migrated)
- [x] state.js — Complete (G state + initState)
- [x] style.css — Complete
- [ ] render.js — TODO: migrate drawTile, drawBuilding3D, drawAdventurer, drawMonster, drawTownWalls, FX system
- [ ] ui.js — TODO: migrate buildBuildPanel, buildAdvPanel, buildResidentPanel, buildQuestPanel, buildForgeUI, all overlays
- [ ] fsm.js — TODO: migrate updateAdventurer + all FSM cases
- [ ] economy.js — TODO: migrate tickEconomy, checkTownLevelUp, applyResidentBonuses
- [ ] systems.js — TODO: migrate tickSiege, launchSiege, tickResourceRespawn, dungeon battle
- [ ] sprites.js — TODO: migrate SPRITES and MONSTER_SPRITES pixel data

## Key Design Decisions
- All modules share the same G object from state.js (no prop drilling)
- Canvas uses ISO_W=44, ISO_H=22, isometric projection
- Offscreen canvas caches static buildings (dirty flag: buildingCacheDirty)
- Adventurer FSM states: EnterTown, Idle, MovingToFacility, Shopping, Resting, ExploringField, Combat, GatheringResource, InDungeon, Homeless
- Siege monsters follow SIEGE_WAYPOINTS array (smooth pathfinding)
- House buildings (id="house") are required before recruiting adventurers

## How to Develop
```bash
npm install
npm run dev      # localhost:3000 with hot reload
npm run build    # production build to dist/
```

## Deployment
Push to GitHub → Vercel auto-deploys from dist/ folder.
Vercel config: buildCommand="npm run build", outputDirectory="dist"

## Language
- Code: English
- Comments: English or Traditional Chinese (either fine)
- UI strings: Traditional Chinese
- Claude responses: Cantonese
