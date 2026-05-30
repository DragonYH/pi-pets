<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://img.shields.io/badge/pi--pets-🐾-FF6B6B?style=for-the-badge">
    <img src="https://img.shields.io/badge/pi--pets-🐾-FF6B6B?style=for-the-badge" alt="pi-pets" height="48">
  </picture>
</p>

<p align="center">
  <strong>Virtual Pet System for <a href="https://github.com/earendil-works/pi-coding-agent">pi</a> Coding Agent</strong>
  <br>
  <sub>Import sprite-based pets, hatch with deterministic seeds, and bond with coding companions — right in your terminal</sub>
</p>

<p align="center">
  <a href="#-features"><img src="https://img.shields.io/badge/Features-📋-FF6B6B?style=flat-square"></a>
  <a href="#-installation"><img src="https://img.shields.io/badge/Installation-📦-00B894?style=flat-square"></a>
  <a href="#-getting-started"><img src="https://img.shields.io/badge/Getting_Started-🚀-0984E3?style=flat-square"></a>
  <a href="#-commands"><img src="https://img.shields.io/badge/Commands-⌨️-6C5CE7?style=flat-square"></a>
  <a href="#-pet-files"><img src="https://img.shields.io/badge/Pet_Files-📥-FD79A8?style=flat-square"></a>
  <a href="#-language"><img src="https://img.shields.io/badge/Language-🌐-00CECE?style=flat-square"></a>
  <a href="./README.zh-CN.md"><img src="https://img.shields.io/badge/🇨🇳_中文-FADB4A?style=flat-square"></a>
</p>

---

## 📋 Features

pi-pets is an **extension** for the [pi coding agent](https://github.com/earendil-works/pi-coding-agent) that brings a virtual pet to your terminal. Unlike purely cosmetic pet plugins, pi-pets pets **react to your coding activity** — they grow when you code well, get frustrated when errors pile up, and need your care to stay happy.

- ✅ **Import-based species** — no built-in species; import any pet from the Codex ecosystem (`pet.json` + `spritesheet.webp`)
- ✅ **Deterministic hatching** — seed-based PRNG (mulberry32) ensures the same seed + species always produces the same pet
- ✅ **5-tier rarity** — Common (60%) → Uncommon (25%) → Rare (10%) → Epic (4%) → Legendary (1%), with 1% shiny chance
- ✅ **5-stage growth** — Baby → Child → Teen → Adult → Elder, with XP from coding activity
- ✅ **8 emotional states** — Happy, Curious, Excited, Tired, Hungry, Frustrated, Working, Sick — driven by needs and coding events
- ✅ **3-axis needs system** — hunger, energy, and happiness decay over time; feed and pet your companion to keep it healthy
- ✅ **Event-driven reactions** — XP rewards for completed turns, tool calls, test passes, and error fixes
- ✅ **Sprite-based animations** — imported pets use the Codex-compatible format (`pet.json` + `spritesheet.webp`), rendered with true-color half-block ANSI art
- ✅ **Overlay + Widget UI** — toggleable pet overlay with sprite art, stat bars, and dialog bubbles; optional compact mode for small terminals
- ✅ **Footer status line** — always-visible status showing your pet's name, level, emotion, and needs
- ✅ **Global companion** — one pet across all your projects; seed derived from your pi config
- ✅ **i18n** — supports Chinese and English; auto-detects system language

## 📦 Installation

### Option 1: Install from npm (Recommended)

```bash
pi install npm:@rokiy/pi-pets
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

Restart pi. You're ready to go — but first, you'll need to import a pet file before hatching (see [Getting Started](#-getting-started)).

## 🚀 Getting Started

pi-pets **reacts automatically** to your coding sessions once set up:

- **On session start** — loads your pet state and applies idle recovery
- **After each turn** — awards XP based on token usage
- **After tool calls** — tracks success/error, updates emotion (3+ consecutive errors → Frustrated)
- **On session shutdown** — saves pet state and cleans up timers

### Quick Start Workflow

Since pi-pets has **no built-in species**, you must import at least one pet file before you can hatch:

**Step 1: Download a pet file** from the [Codex Pet community](https://codex-pet.org/) or [PetDex](https://petdex.crafter.run/). Each pet needs a `pet.json` (metadata) and `spritesheet.webp` (animation frames) in the same directory.

**Step 2: Import the pet** into pi-pets:

```bash
/pets import /path/to/downloaded-pet-folder
```

This validates the pet file, converts the spritesheet into animated frames, and caches them for fast rendering.

**Step 3: Hatch your first pet** — pi-pets randomly selects from all species you've imported:

```bash
/pets hatch
# Or with a custom seed for deterministic results:
/pets hatch my-secret-seed
```

**Step 4: Interact** — your pet starts responding right away:

```bash
/pets pet      # Pet it for happiness
/pets feed     # Feed it when hungry
/pets info     # Check its stats and mood
/pets list     # Switch between multiple pets
```

**Step 5: Toggle the UI** — the pet overlay appears in your terminal:

```bash
/pets ui       # Show/hide the pet overlay
```

The footer status bar also shows your pet's species, name, level, emotion, and needs at a glance.

## ⌨️ Commands

| Command | Description |
|---------|-------------|
| `/pets` | Show all commands and help |
| `/pets hatch [seed]` | Hatch a new pet (optional seed string for determinism) |
| `/pets info` | Show detailed pet archive (species, rarity, stats, personality) |
| `/pets list` | List hatched pets and switch interactively |
| `/pets pet` | Pet your companion (+happiness, +XP) |
| `/pets feed` | Feed your companion (+hunger, +XP) |
| `/pets rename <name>` | Rename your pet (1-32 chars, control chars filtered) |
| `/pets ui` | Show/hide the pet overlay |
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

## 📥 Pet Files

pi-pets uses sprite-based pet files compatible with the Codex ecosystem. Each pet needs a **pet.json** (metadata) and **spritesheet.webp** (animation frames) in the same directory.

### Recommended Sources

- **[Codex Pet](https://codex-pet.org/)** — Create and download pets with the web-based pet creator. Browse the community gallery for user-submitted pets, or design your own.

- **[PetDex](https://petdex.crafter.run/)** — A comprehensive pet archive featuring ready-to-use spritesheets and detailed species data.

### File Format

- `pet.json` — species metadata (name, emoji, description)
- `spritesheet.webp` — 8-column × 9-row grid of animation frames (192×208px each), covering 9 animation states: idle, run, sleep, eat, attack, hurt, jump, play, failed

### Importing

Once you have downloaded a pet file package, import it:

```bash
/pets import /path/to/downloaded-pet-folder
```

After importing, you can hatch using the new species:

```bash
/pets hatch
```

pi-pets randomly selects from all species you've imported. You can import as many pets as you like and manage them with `/pets list`.

## 🌱 Growth Stages

| Stage | Level Range | XP Required | Unlocks |
|-------|-------------|-------------|---------|
| **Baby** | Lv 1-2 | 0-399 | Basic emotions |
| **Child** | Lv 3-4 | 400-899 | Emotion interactions |
| **Teen** | Lv 5-7 | 900-2,499 | — |
| **Adult** | Lv 8-12 | 2,500-7,199 | — |
| **Elder** | Lv 13+ | 7,200+ | — |

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

Level formula: `Level = floor(sqrt(XP / 100))`

## 💎 Rarity

| Rarity | Probability | Effect |
|--------|-------------|--------|
| **Common** | 60% | Standard name color |
| **Uncommon** | 25% | Green name |
| **Rare** | 10% | Blue name |
| **Epic** | 4% | Purple name + sparkle |
| **Legendary** | 1% | Gold name |

> ✨ **Shiny**: 1% independent chance on any rarity — inverts colors + special marker.

All rarity rolls are deterministic from your seed — the same seed + species always gives the same rarity.

## 😊 Emotions & Needs

**8 emotions** react to your coding activity:

- 😊 **Happy** — default, needs are comfortable
- 🤔 **Curious** — recently active with comfortable needs
- 🎉 **Excited** — tests all pass, level-up, evolution
- 😴 **Tired** — energy drops below 30%
- 🍽️ **Hungry** — hunger drops below 30%
- 😤 **Frustrated** — 3+ consecutive errors
- 💻 **Working** — active in the last 5 minutes
- 🤒 **Sick** — any need hits critically low (below 10)

**3-axis needs** decay in real time:

| Need | Decay Rate | Recovery |
|------|-----------|----------|
| Hunger | 0.025/min | `/pets feed` (+40) |
| Energy | 0.015/min (active) | 30+ min idle (+20) |
| Happiness | 0.010/min | `/pets pet` (+15), coding success (+5) |

## 🧠 Architecture

```
┌────────────────────────────────────────────────────────────┐
│  pi Coding Agent                                           │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  [Chat Interface]                                    │  │
│  │                                                      │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │  Status Bar: 🐾 "XiaoJu" Lv.4 🙂 *1500XP H:60 E:45 │  │
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
│  ┌─ Persistence (~/.pi/agent/pets/) ────────────────────┐  │
│  │  Bones (seed→PRNG): speciesId, rarity, stats, shiny  │  │
│  │  Soul:              name, personality                │  │
│  │  Runtime:           xp, level, stage, emotion, needs │  │
│  │  Cache:             ~/.pi/agent/pets/pet-cache/      │  │
│  └───────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────┘
```

### Events Handled

- **`session_start`** — load pet state, apply offline decay recovery
- **`turn_end`** — award turn-based XP, check level-up/evolution
- **`tool_execution_end`** — track success/error count, update emotion
- **`session_shutdown`** — save state, clear timers

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
│   ├── index.ts                   # Extension entry point
│   ├── types.ts                   # TypeScript type definitions
│   ├── config.ts                  # All constants and configuration
│   ├── pet_instance.ts            # PetEngine — main state machine
│   ├── commands.ts                # /pets command registration
│   ├── events.ts                  # Lifecycle event binding + UI render loop
│   ├── hatchery.ts                # Pet hatching logic (seed→bones)
│   ├── evolution.ts               # Stage/growth logic
│   ├── needs.ts                   # 3-axis need decay + recovery
│   ├── xp.ts                      # XP calculation + level curve
│   ├── species.ts                 # Species resolver (no built-in species — all imported)
│   ├── name_generator.ts          # Fallback name generator
│   ├── persistence.ts             # State save/load
│   ├── prng.ts                    # Deterministic PRNG (mulberry32)
│   ├── renderer/                  # Pet rendering pipeline
│   │   ├── art-provider.ts        # Frame cache and animation state management
│   │   ├── cache.ts               # Persistent frame cache
│   │   ├── converter.ts           # Spritesheet.webp → pixel grid conversion
│   │   ├── importer.ts            # pet.json + spritesheet.webp import workflow
│   │   └── renderer.ts            # ANSI half-block and text fallback rendering
│   ├── ui/                        # UI components
│   │   ├── pet-overlay.ts         # Pet overlay display logic
│   │   ├── widget.ts              # Widget panel rendering
│   │   ├── overlay.ts             # Level-up / evolution overlays
│   │   ├── bubbles.ts             # 8-emotion dialog bubble pool (i18n)
│   │   ├── footer.ts              # Footer status line renderer
│   │   └── visual-utils.ts        # ANSI visual utility functions
│   └── i18n/                      # Internationalization
│       ├── index.ts               # i18n core (t(), setLanguage, detect)
│       ├── en.ts                  # English translations
│       └── zh-CN.ts               # Chinese translations
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

### Tests

```bash
npm test
```

## 📄 License

[MIT](./LICENSE)

---

<p align="center">
  <sub>Built for the <a href="https://github.com/earendil-works/pi-coding-agent">pi coding agent</a> ecosystem</sub>
  <br>
  <a href="./README.zh-CN.md"><img src="https://img.shields.io/badge/🇨🇳_阅读中文版本-FFD700?style=for-the-badge"></a>
</p>
