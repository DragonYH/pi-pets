<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://img.shields.io/badge/pi--pets-🐾-FF6B6B?style=for-the-badge">
    <img src="https://img.shields.io/badge/pi--pets-🐾-FF6B6B?style=for-the-badge" alt="pi-pets" height="48">
  </picture>
</p>

<p align="center">
  <strong>Virtual Pet System for <a href="https://github.com/earendil-works/pi-coding-agent">pi</a> Coding Agent</strong>
  <br>
  <sub>Hatch, raise, and bond with coding companions — right in your terminal</sub>
</p>

<p align="center">
  <a href="#-features"><img src="https://img.shields.io/badge/Features-📋-FF6B6B?style=flat-square"></a>
  <a href="#-installation"><img src="https://img.shields.io/badge/Installation-📦-00B894?style=flat-square"></a>
  <a href="#-usage"><img src="https://img.shields.io/badge/Usage-🚀-0984E3?style=flat-square"></a>
  <a href="#-downloading-pet-files"><img src="https://img.shields.io/badge/Pet_Files-📥-6C5CE7?style=flat-square"></a>
  <a href="#-species"><img src="https://img.shields.io/badge/Species-🐾-FD79A8?style=flat-square"></a>
  <a href="#-language"><img src="https://img.shields.io/badge/Language-🌐-00CECE?style=flat-square"></a>
  <a href="./README.zh-CN.md"><img src="https://img.shields.io/badge/🇨🇳_中文-FADB4A?style=flat-square"></a>
</p>

---

## 📋 Features

pi-pets is an **extension** for the [pi coding agent](https://github.com/earendil-works/pi-coding-agent) that brings a virtual pet to your terminal. Unlike purely cosmetic pet plugins, pi-pets pets **react to your coding activity** — they grow when you code well, get frustrated when errors pile up, and need your care to stay happy.

- ✅ **12 unique species** — each tied to a programming domain (Frontend, Systems, ML, DevOps, Security...)
- ✅ **Deterministic hatching** — seed-based PRNG (mulberry32) ensures the same seed always produces the same pet
- ✅ **5-tier rarity** — Common (60%) → Uncommon (25%) → Rare (10%) → Epic (4%) → Legendary (1%), with 1% shiny chance
- ✅ **5-stage growth** — Baby → Child → Teen → Adult → Elder, with XP from coding activity
- ✅ **7 emotional states** — Happy, Curious, Excited, Tired, Hungry, Frustrated, Sick — driven by needs and coding events
- ✅ **3-axis needs system** — hunger, energy, and happiness decay over time; feed and pet your companion to keep it healthy
- ✅ **Event-driven reactions** — XP rewards for completed turns, tool calls, test passes, and error fixes
- ✅ **Sprite-based animations** — imported pets use the same file format as Codex (pet.json + spritesheet.webp), rendered with true-color half-block ANSI art
- ✅ **Footer + Widget UI** — always-visible status line plus a toggleable widget panel with stats, art, and dialog bubbles
- ✅ **Global companion** — one pet across all your projects; seed derived from your pi config
- ✅ **i18n** — supports Chinese and English; auto-detects system language

## 📦 Installation

### Option 1: Install from npm (Recommended)

```bash
pi install npm:pi-pets
```

### Option 2: Install from GitHub

```bash
pi install git:github.com/DragonYH/pi-pets
```

### Option 3: Local Development

```bash
git clone https://github.com/DragonYH/pi-pets.git
cd pi-pets
npm install
pi install ./
```

### Verify Installation

Restart pi. Run `/pets hatch` to hatch your first pet.

## 🚀 Usage

Once installed, pi-pets **reacts automatically** to your coding sessions:

- **On session start** — loads your pet state and applies idle recovery
- **After each turn** — awards XP based on token usage
- **After tool calls** — tracks success/error, updates emotion (3+ consecutive errors → Frustrated)
- **On session shutdown** — saves pet state and cleans up timers

### Commands

| Command | Description |
|---------|-------------|
| `/pets` | Show all commands and help |
| `/pets hatch [seed]` | Hatch a new pet (optional seed string for determinism) |
| `/pets info` | Show detailed pet archive (species, rarity, stats, personality, skills) |
| `/pets list` | List hatched pets and switch interactively |
| `/pets pet` | Pet your companion (+happiness, +XP with values) |
| `/pets feed` | Feed your companion (+hunger, +XP with values) |
| `/pets rename <name>` | Rename your pet (1-32 chars, control chars filtered) |
| `/pets ui` | Show/hide the pet widget |
| `/pets release` | Release your pet permanently (confirmation required) |
| `/pets import <path>` | Import a sprite-based pet from a directory |
| `/pets clean [species]` | Clear image cache for a species (default: current pet) |
| `/pets delete <species>` | Delete species cache file (only if no pet uses this species) |
| `/pets lang <zh-CN\|en>` | Switch display language |
| `/pets help` | Show all commands and descriptions |

```bash
# Hatch with a custom seed for a specific pet
/pets hatch my-secret-seed

# Check on your pet
/pets info

# Delete a species (only if no pet uses it)
/pets delete meow

# Quick interaction
/pets pet
/pets feed

# Switch language
/pets lang zh-CN
```

### Step-by-Step Tutorial

**Step 1: Import a pet** — pi-pets needs sprite-based pet files to display your companion. Download pet files (pet.json + spritesheet.webp) from community sites, then import them:

```bash
/pets import /path/to/your-pet-folder
```

> 📥 **Where to get pet files:**
> - [Codex Pet Community](https://codex-pet.org/) — browser-based creator and community pet gallery
> - [PetDex](https://petdex.crafter.run/) — pet archive with spritesheets and species data

**Step 2: Hatch your first pet** — pi-pets randomly selects from your imported species:

```bash
/pets hatch
```

**Step 3: Interact with your pet** — it starts responding to your coding activity right away:

```bash
/pets pet      # Pet it for happiness
/pets feed     # Feed it when hungry
/pets info     # Check its stats and mood
/pets list     # Switch between multiple pets
```

**Step 4: Toggle the UI** — the pet appears in a widget panel in your terminal:

```bash
/pets ui       # Show/hide the pet widget
```

The footer status bar also shows your pet's species, name, level, emotion, and needs at a glance.

## 🧠 Architecture

```
┌────────────────────────────────────────────────────────────┐
│  pi Coding Agent                                           │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  [Chat Interface]                                    │  │
│  │                                                      │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │  Status Bar: Fox "小橘" Lv.4 :) *1500XP H:60 E:45   │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                            │
│  ┌─ Extension: pi-pets ─────────────────────────────────┐  │
│  │  session_start     ──►  load() + applyIdleRecovery() │  │
│  │  turn_end          ──►  onTurnComplete() → addXp()   │  │
│  │  tool_execution_end──►  onToolExecuted() → emotion   │  │
│  │  session_shutdown  ──►  save() + clearTimers()       │  │
│  │  setInterval(60s)  ──►  tick() → decayNeeds()        │  │
│  │  setInterval(500ms)──►  render() → setWidget()       │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                            │
│  ┌─ Persistence (~/.pi/pets/state.json) ────────────────┐  │
│  │  Bones (seed→PRNG): species, rarity, stats, shiny    │  │
│  │  Soul (LLM):      name, personality                  │  │
│  │  Runtime:         xp, level, stage, emotion, needs   │  │
│  └───────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────┘
```

### Events Handled

- **`session_start`** — load pet state, apply offline decay recovery
- **`turn_end`** — award turn-based XP, check level-up/evolution
- **`tool_execution_end`** — track success/error count, update emotion
- **`session_shutdown`** — save state, clear timers

## 📥 Downloading Pet Files

pi-pets uses sprite-based pet files compatible with the Codex ecosystem. Each pet needs a **pet.json** (metadata) and **spritesheet.webp** (animation frames) in the same directory.

### Recommended Sources

- **[Codex Pet](https://codex-pet.org/)** — Create and download pets with the web-based pet creator. Browse the community gallery for user-submitted pets, or design your own.

- **[PetDex](https://petdex.crafter.run/)** — A comprehensive pet archive featuring ready-to-use spritesheets and detailed species data.

### Importing Downloaded Pets

Once you have downloaded a pet file package, import it:

```bash
/pets import /path/to/downloaded-pet-folder
```

After importing, hatch the new species:

```bash
/pets hatch
```

pi-pets will randomly select from all species you've imported.

## 🐾 Species

| # | Species | Domain | High Stats |
|---|---------|--------|------------|
| 1 | **Pyrofox** (火狐) | Frontend | SNARK, CHAOS |
| 2 | **Rustacean** (铁甲蟹) | Systems | WISDOM, PATIENCE |
| 3 | **Pythonidae** (灵蟒) | Scripting/ML | WISDOM |
| 4 | **Gopher** (地鼠) | Backend | PATIENCE |
| 5 | **TypeWhale** (巨鲸) | Type Systems | DEBUGGING, WISDOM |
| 6 | **BashBat** (蝙蝠) | DevOps | CHAOS |
| 7 | **Kotlincat** (科猫) | Mobile | PATIENCE, DEBUGGING |
| 8 | **Javaroo** (袋鼠) | Enterprise | PATIENCE, WISDOM |
| 9 | **LispLizard** (蜥蜴) | Functional | WISDOM, CHAOS |
| 10 | **QueryQuail** (鹌鹑) | Database | DEBUGGING |
| 11 | **HexHound** (猎犬) | Security/Reversing | DEBUGGING, CHAOS |
| 12 | **PixelPanda** (熊猫) | Full-stack/Design | Balanced |

## 🌱 Growth Stages

| Stage | Level Range | XP Required | Unlocks |
|-------|-------------|-------------|---------|
| **Baby** (幼生体) | Lv 1-2 | 0-399 | Basic emotions |
| **Child** (成长体) | Lv 3-4 | 400-899 | Emotion interactions |
| **Teen** (进化体) | Lv 5-7 | 900-2,499 | Skill slot (P2) |
| **Adult** (完全体) | Lv 8-12 | 2,500-7,199 | Evolution + 2nd skill (P2) |
| **Elder** (究极体) | Lv 13+ | 7,200+ | Ultimate passive (P2) |

### XP Sources

| Event | XP |
|-------|-----|
| Turn completion | 5-15 |
| Tool call success | 3-8 |
| All tests passing | +20 |
| Error fixed | +25 |
| `/pets pet` | +2 (max 10/day) |
| `/pets feed` | +1 (max 5/day) |
| Session end | +10 |

## 💎 Rarity

| Rarity | Probability | Effect |
|--------|-------------|--------|
| **Common** | 60% | Standard name color |
| **Uncommon** | 25% | Green name |
| **Rare** | 10% | Blue name |
| **Epic** | 4% | Purple name + sparkle |
| **Legendary** | 1% | Gold name + unique idle |

> ✨ **Shiny**: 1% independent chance on any rarity — inverts colors + special marker.

## 😊 Emotions & Needs

**7 emotions** react to your coding activity:

- 😊 **Happy** — default, needs are comfortable
- 🤔 **Curious** — new files or tools encountered
- 🎉 **Excited** — tests all pass, level-up, evolution
- 😴 **Tired** — energy drops below 30%
- 🍽️ **Hungry** — hunger drops below 30%
- 😤 **Frustrated** — 3+ consecutive errors
- 🤒 **Sick** — any need hits 0 for 10+ minutes

**3-axis needs** decay in real time:

| Need | Decay Rate | Recovery |
|------|-----------|----------|
| Hunger | 0.025/min | `/pets feed` (+40) |
| Energy | 0.015/min (active) / 0.1/min (idle) | 30+ min idle (+20) |
| Happiness | 0.010/min | `/pets pet` (+15), coding success (+5) |

## 🌐 Language

pi-pets supports bilingual display (Chinese and English).

### Auto-detection

The language is automatically detected from your system environment variables:
- `LANG`, `LC_ALL`, or `LC_MESSAGES` starting with `zh` → Chinese
- Otherwise → English

### Manual Switching

Switch at runtime with the `/pets lang` command:

```bash
/pets lang zh-CN    # Switch to Chinese
/pets lang en       # Switch to English
```

Language preferences are per-session — the system language setting is re-evaluated on restart.

## 🏗️ Project Structure

```
pi-pets/
├── src/
│   ├── i18n/                      # Internationalization
│   │   ├── index.ts               # i18n core (t(), setLanguage, detect)
│   │   ├── en.ts                  # English translations
│   │   └── zh-CN.ts               # Chinese translations
│   ├── index.ts                   # Extension entry point
│   ├── types.ts                   # TypeScript type definitions
│   ├── config.ts                  # All constants and configuration
│   ├── prng.ts                    # Deterministic PRNG (mulberry32)
│   ├── species.ts                 # 12 species definitions
│   ├── hatchery.ts                # Pet hatching logic (seed→bones)
│   ├── name_generator.ts          # Fallback name pool (60 names)
│   ├── persistence.ts             # State save/load (~/.pi/pets/state.json)
│   ├── pet_instance.ts            # PetEngine — main state machine
│   ├── needs.ts                   # 3-axis need decay + recovery
│   ├── xp.ts                      # XP calculation + level curve
│   ├── evolution.ts               # Stage/growth logic
│   ├── commands.ts                # /pets command registration (multiple subcommands)
│   ├── events.ts                  # Lifecycle event binding + UI render loop
│   ├── renderer/                  # Pet rendering pipeline
│   │   ├── art-provider.ts        # Frame cache and animation state management
│   │   ├── cache.ts               # Persistent frame cache (~/.pi/pets/pet-cache/)
│   │   ├── converter.ts           # Spritesheet.webp → pixel grid conversion
│   │   ├── importer.ts            # pet.json + spritesheet.webp import workflow
│   │   └── renderer.ts            # ANSI half-block and text fallback rendering
│   └── ui/
│       ├── footer.ts              # Footer status line renderer
│       ├── widget.ts              # Widget panel (pet art + stat bars + bubbles)
│       ├── pet-overlay.ts         # Pet overlay display logic
│       ├── visual-utils.ts        # Visual utility functions
│       ├── overlay.ts             # Level-up / evolution overlays
│       └── bubbles.ts             # 7-emotion dialog bubble pool (i18n)
├── tsconfig.json
├── tsconfig.build.json
├── package.json
├── README.md
└── README.zh-CN.md
```

## 🛠️ For Developers

### Type-Check

```bash
npx tsc --noEmit
```

### Build

```bash
npm run build
```

### Run with pi

```bash
pi -e ./src/index.ts
```

## 📄 License

[MIT](./LICENSE)

---

<p align="center">
  <sub>Built for the <a href="https://github.com/earendil-works/pi-coding-agent">pi coding agent</a> ecosystem</sub>
  <br>
  <a href="./README.zh-CN.md"><img src="https://img.shields.io/badge/🇨🇳_阅读中文版本-FFD700?style=for-the-badge"></a>
</p>
