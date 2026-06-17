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

## Migration Status — COMPLETE
All 10 modules fully migrated from monolithic index.html to Vite ES modules.
- [x] data.js, state.js, style.css, sprites.js
- [x] render.js — drawTile, drawBuilding3D, drawAdventurer, drawMonster, FX, day/night overlay
- [x] ui.js — all DOM panels, overlays, building placement, dungeon, forge
- [x] fsm.js — updateAdventurer, all 10 FSM states
- [x] economy.js — tickEconomy, day/night phase tracking, town level up
- [x] systems.js — siege, night raid, construction timer, forge, wall, resource respawn
- [x] save.js — localStorage save/load, difficulty presets (new file, not in original)

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
