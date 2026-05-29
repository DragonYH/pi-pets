export const CONFIG = {
  // ---- Needs ----
  NEEDS_DECAY_RATES: {
    hunger: 0.5, // per minute
    energy: 0.3,
    happiness: 0.2,
  } as const,

  NEEDS_RECOVERY: {
    feed: 40,
    pet: 15,
    idleRecovery: 20, // after 30 min idle
  } as const,

  // ---- XP ----
  XP_REWARDS: {
    turnComplete: { min: 5, max: 15 },
    toolSuccess: { min: 3, max: 8 },
    testsAllPass: 20,
    errorFixed: 25,
    petCommand: 2,
    feedCommand: 1,
    sessionEnd: 10,
  } as const,

  // ---- Levels ----
  LEVEL_CURVE_BASE: 100,

  // ---- Growth thresholds ----
  GROWTH_THRESHOLDS: {
    baby: { minLevel: 1, maxLevel: 2 },
    child: { minLevel: 3, maxLevel: 4 },
    teen: { minLevel: 5, maxLevel: 7 },
    adult: { minLevel: 8, maxLevel: 12 },
    elder: { minLevel: 13, maxLevel: Infinity },
  } as const,

  // ---- Rarity ----
  RARITY_WEIGHTS: {
    common: 60,
    uncommon: 25,
    rare: 10,
    epic: 4,
    legendary: 1,
  } as const,

  SHINY_CHANCE: 0.01,

  // ---- Overlay ----
  OVERLAY_FULL_MIN_ROWS: 31,
  OVERLAY_COMPACT_MIN_ROWS: 10,

  // ---- Timers ----
  TICK_INTERVAL: 60_000,
  RENDER_INTERVAL: 500,
  BUBBLE_INTERVAL: 20_000,

  STAT_RANDOM_RANGE: 20,

  // ---- Persistence ----
  PERSISTENCE_PATH: '.pi/pets/state.json',

  // ---- Pet state schema version ----
  STATE_VERSION: 1 as const,

  // ---- Rendering ----

  PET_CACHE_DIR: '.pi/pets/pet-cache',
  SPRITESHEET_COLS: 8,
  SPRITESHEET_ROWS: 9,
  FRAME_WIDTH: 192,
  FRAME_HEIGHT: 208,
  RENDER_WIDTH: 34,
  RENDER_HEIGHT: 32,
  ALPHA_OPAQUE_THRESHOLD: 10,
  MIN_OPAQUE_RATIO: 0.005,
} as const;
