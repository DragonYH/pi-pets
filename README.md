# pi-pets 🐾

A virtual pet system for [pi](https://github.com/earendil-works/pi-coding-agent) — hatch, raise, and bond with coding companions right in your terminal.

## Features

- **12 unique species** — each tied to a programming domain with distinct stats
- **Deterministic hatching** — seed-based PRNG ensures reproducible pets
- **Emotion system** — 7 emotional states driven by needs and coding events
- **Growth & evolution** — 5 stages from Baby to Elder, with XP from coding activity
- **Rarity system** — Common to Legendary, with 1% shiny chance
- **Needs system** — hunger, energy, and happiness decay over time
- **ASCII art animations** — 4-frame idle animations for species
- **Footer & Widget UI** — always-visible status line and toggleable widget panel

## Quick Start

```bash
# Clone and enter
git clone <repo> pi-pets && cd pi-pets

# Install
npm install

# Use with pi
pi -e ./src/index.ts
```

## Commands

| Command | Description |
|---------|-------------|
| `/pets hatch [seed]` | Hatch a new pet (optional seed for deterministic results) |
| `/pets status` | Show the pet widget panel |
| `/pets pet` | Pet/stroke your pet |
| `/pets feed` | Feed your pet |
| `/pets name <name>` | Rename your pet |
| `/pets toggle` | Show/hide the pet widget |
| `/pets release` | Release your pet (permanent) |

## Species

| Species | Domain | Stats |
|---------|--------|-------|
| 🦊 Pyrofox (火狐) | 前端开发 | SNARK++ |
| 🦀 Rustacean (铁甲蟹) | 系统编程 | PATIENCE++ |
| 🐍 Pythonidae (灵蟒) | 脚本/ML | WISDOM++ |
| 🐹 Gopher (地鼠) | 后端服务 | PATIENCE++ |
| 🐋 TypeWhale (巨鲸) | 类型系统 | DEBUGGING++ |
| 🦇 BashBat (蝙蝠) | DevOps | CHAOS++ |
| 🐱 Kotlincat (科猫) | 移动端 | BALANCED |
| 🦘 Javaroo (袋鼠) | 企业级 | PATIENCE++ |
| 🦎 LispLizard (蜥蜴) | 函数式 | WISDOM++ |
| 🐦 QueryQuail (鹌鹑) | 数据库 | DEBUGGING++ |
| 🐕 HexHound (猎犬) | 安全/逆向 | SNARK++ |
| 🐼 PixelPanda (熊猫) | 全栈/设计 | BALANCED |

## Growth Stages

| Stage | Level | Unlocks |
|-------|-------|---------|
| Baby (幼生体) | 1-2 | Basic emotions |
| Child (成长体) | 3-4 | Advanced interactions |
| Teen (进化体) | 5-7 | First skill slot (P2) |
| Adult (完全体) | 8-12 | Evolution + second skill (P2) |
| Elder (究极体) | 13+ | Passive ability (P2) |

## Project Structure

```
pi-pets/
├── package.json
├── src/
│   ├── index.ts            # Extension entry point
│   ├── config.ts           # Constants and configuration
│   ├── types.ts            # TypeScript type definitions
│   ├── prng.ts             # Deterministic PRNG (mulberry32)
│   ├── species.ts          # 12 species definitions
│   ├── hatchery.ts         # Pet hatching logic
│   ├── name_generator.ts   # Fallback name pool
│   ├── persistence.ts      # State save/load to ~/.pi/pets/state.json
│   ├── pet_instance.ts     # Main pet state machine
│   ├── needs.ts            # 3-axis need system
│   ├── emotions.ts         # Emotion state machine
│   ├── xp.ts               # XP calculation
│   ├── evolution.ts        # Stage/growth logic
│   ├── commands.ts         # /pets command registration
│   ├── events.ts           # Lifecycle event binding
│   └── ui/
│       ├── footer.ts       # Footer status line
│       ├── widget.ts       # Widget panel rendering
│       ├── overlay.ts      # Level-up/evolution overlays
│       ├── bubbles.ts      # Emotion-based dialog bubbles
│       └── art/            # ASCII art frames
│           ├── pyrofox.ts
│           ├── rustacean.ts
│           └── pythonidae.ts
└── README.md
```

## Persistence

Pet state is saved to `~/.pi/pets/state.json` automatically on every session shutdown and turn completion.

## Future (Phase 2)

- Skill system: Bug Sniffer, Test Whisperer, Lint Knight
- Branching evolution paths based on tool usage
- Pet tool exposed to LLM
- Multi-pet ecosystem
