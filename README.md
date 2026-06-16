# 🏰 冒險村物語 — Dungeon Village

A browser-based RPG Town Management game inspired by Kairosoft's Dungeon Village 2.

## 🎮 Play

**Live:** https://dungeon-village.vercel.app

## ✨ Features

- **Isometric 2.5D town** with painter's algorithm rendering
- **Adventurer FSM AI** — 8 states (EnterTown, Idle, MovingToFacility, Shopping, Resting, ExploringField, Combat, GatheringResource)
- **Pixel sprite characters** — 6 adventurer classes, 5 monster types, walk animation & directional flipping
- **3-type combat animations** — melee slash arcs, ranged arrow projectiles, magic fireballs with explosion bursts
- **Building synergy system** — adjacency bonuses between complementary buildings
- **Resident settlement** — high-satisfaction adventurers become permanent villagers with job bonuses
- **Dungeon system** — 3 dungeons × 3 floors with manual turn-based combat (attack/skill/item/flee)
- **Quest system** — 11 tasks including milestone quests that unlock hidden classes
- **Town wall system** — 5 tiers (Wood → Mud → Stone → Iron → Force Field)
- **Resource gathering** — Wood, Stone, Iron, Water, Crystal nodes on the map
- **Siege system** — enemies attack the town periodically, Game Over if all buildings destroyed
- **Forge & equipment upgrades** — 5 equipment types × 3 tiers using gathered resources
- **Melee range constraint** (≤1 tile) and shield block mechanic tied to armor shop level

## 🚀 Deploy

This is a single static HTML file. No build step needed.

Deployed automatically via Vercel on every push to `main`.

## 🛠 Tech

- Pure HTML5 Canvas 2D — zero dependencies
- Single self-contained file (`index.html`)
- Google Fonts (Press Start 2P + Noto Sans TC)
