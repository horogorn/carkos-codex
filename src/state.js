// ============================================================================
// THE CARKOS CODEX — Runtime State, Stacked Inventory, Progression & Persistence
// Imports ONLY from ./lore.js to maintain a strict one-way dependency graph.
// ============================================================================

import { CLASSES, OMENS, QUESTS, TIME_PHASES } from "./lore.js";

const SAVE_KEY = "carkos_codex_save_v9";

// Deterministic PRNG (Mulberry32) for reproducible procedural faces
export function mulberry32(a) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function generateFaceParams(seed) {
  const rand = mulberry32(seed);
  return {
    tilt: (rand() - 0.5) * 0.22,
    poseOffset: (rand() - 0.5) * 4.5,
    headW: 11.5 + rand() * 2.8,
    headH: 15.5 + rand() * 2.5,
    jawW: 6.0 + rand() * 2.5,
    cheekHollow: 0.4 + rand() * 0.4,
    eyeY: -2.2 + (rand() - 0.5) * 1.4,
    eyeSep: 4.6 + rand() * 1.3,
    eyeSize: 1.6 + rand() * 0.6,
    squintLeft: rand() > 0.65,
    browAngle: 0.15 + rand() * 0.35,
    noseOffset: (rand() - 0.5) * 1.6,
    noseLen: 5.0 + rand() * 2.2,
    mouthW: 4.2 + rand() * 2.0,
    mouthSkew: (rand() - 0.5) * 1.8,
    hairStyle: Math.floor(rand() * 4),
    beardStyle: Math.floor(rand() * 3),
    scarType: Math.floor(rand() * 3),
    lesions: Array.from({ length: 14 }, () => ({
      x: (rand() - 0.5) * 18,
      y: (rand() - 0.5) * 22,
      r: 1.2 + rand() * 1.8
    }))
  };
}

// Transient visual queues shared across combat, dungeon, and main renderer
export const fallingDice = [];
export const floatingTexts = [];

export function spawnFloatText(nx, ny, text, color = "#f2eadc") {
  floatingTexts.push({ x: nx, y: ny, text, color, life: 1.0 });
}

// Mutable Master Game State
export const state = {
  screen: "title", // "title" | "forge" | "map" | "town" | "camp" | "dungeon" | "wild" | "encounter" | "gallery"
  prevScreen: "map",
  currentMapId: "miregate",
  viewArtId: null,
  inspectingItem: null,
  galleryArt: "sentinel",
  time: 0,
  edgesEnabled: true,
  verticalMode: false,
  pointerX: 0.5,
  pointerY: 0.5,
  hoveredHotspot: null,

  // Time of Day System
  day: 1,
  timeIdx: 1, // 0=DAWN, 1=DUSK, 2=NIGHT, 3=WITCHING HOUR
  stepCounter: 0,

  // Character & Progression
  seed: 84192,
  faceParams: null,
  clsKey: "penitent",
  omenKey: "oathbreaker",
  godKey: "veneratus",
  level: 1,
  xp: 0,
  nextXp: 100,
  pendingLevelUps: 0,
  hp: 14,
  maxHp: 14,
  shield: 0,
  sp: 15,
  torchTurns: 8,
  weaponTier: 0,
  brandLevel: 1,
  curses: new Set(),
  inventory: [
    { name: "Pitch Torch", qty: 3 },
    { name: "Tallow Ration", qty: 2 }
  ],
  activeQuest: null,
  completedQuests: new Set(),
  statBoosts: { str: 0, int: 0, fth: 0, wil: 0 },

  // Camp & Active Delve / Encounter
  camp: { hearth: 1, anvil: 1, totem: 1 },
  dungeon: null,
  encounter: null,
  combatPulse: 0,
  diceRolling: false
};

state.faceParams = generateFaceParams(state.seed);

// ============================================================================
// Stacked Inventory Helpers
// ============================================================================

export function addItem(name, qty = 1) {
  const existing = state.inventory.find((i) => i.name === name);
  if (existing) existing.qty += qty;
  else state.inventory.push({ name, qty });
}

export function removeItem(name, qty = 1) {
  const idx = state.inventory.findIndex((i) => i.name === name);
  if (idx === -1) return false;
  state.inventory[idx].qty -= qty;
  if (state.inventory[idx].qty <= 0) state.inventory.splice(idx, 1);
  return true;
}

export function getItemQty(name) {
  const found = state.inventory.find((i) => i.name === name);
  return found ? found.qty : 0;
}

// ============================================================================
// Progression & Clock Helpers
// ============================================================================

export function advanceTime(steps = 1) {
  for (let i = 0; i < steps; i++) {
    state.timeIdx++;
    if (state.timeIdx >= TIME_PHASES.length) {
      state.timeIdx = 0;
      state.day++;
    }
  }
  return { day: state.day, phase: TIME_PHASES[state.timeIdx] };
}

export function getComputedStats() {
  const base = { ...CLASSES[state.clsKey].stats };
  const bonus = OMENS[state.omenKey].bonus;
  for (const k in bonus) base[k] += bonus[k];
  for (const k in state.statBoosts) base[k] += state.statBoosts[k];
  return base;
}

export function grantXP(amount) {
  state.xp += amount;
  while (state.xp >= state.nextXp) {
    state.xp -= state.nextXp;
    state.level++;
    state.nextXp = state.level * 100;
    state.maxHp += 3;
    state.hp = state.maxHp;
    state.pendingLevelUps++;
    spawnFloatText(0.5, 0.35, `LEVEL UP! (LVL ${state.level})`, "#82d988");
  }
}

// ============================================================================
// LocalStorage Save / Load Persistence
// ============================================================================

export function saveGame() {
  try {
    const payload = {
      currentMapId: state.currentMapId,
      day: state.day,
      timeIdx: state.timeIdx,
      stepCounter: state.stepCounter,
      seed: state.seed,
      clsKey: state.clsKey,
      omenKey: state.omenKey,
      godKey: state.godKey,
      level: state.level,
      xp: state.xp,
      nextXp: state.nextXp,
      pendingLevelUps: state.pendingLevelUps,
      hp: state.hp,
      maxHp: state.maxHp,
      sp: state.sp,
      torchTurns: state.torchTurns,
      weaponTier: state.weaponTier,
      brandLevel: state.brandLevel,
      curses: Array.from(state.curses),
      inventory: state.inventory,
      activeQuestId: state.activeQuest ? state.activeQuest.id : null,
      completedQuests: Array.from(state.completedQuests),
      statBoosts: state.statBoosts,
      camp: state.camp,
      dungeon: state.dungeon
    };
    window.localStorage.setItem(SAVE_KEY, JSON.stringify(payload));
    return true;
  } catch {
    return false;
  }
}

export function hasSavedGame() {
  try {
    return Boolean(window.localStorage.getItem(SAVE_KEY));
  } catch {
    return false;
  }
}

export function loadGame() {
  try {
    const raw = window.localStorage.getItem(SAVE_KEY);
    if (!raw) return false;
    const data = JSON.parse(raw);

    state.currentMapId = data.currentMapId || "miregate";
    state.day = data.day ?? 1;
    state.timeIdx = data.timeIdx ?? 1;
    state.stepCounter = data.stepCounter ?? 0;
    state.seed = data.seed ?? 84192;
    state.faceParams = generateFaceParams(state.seed);
    state.clsKey = CLASSES[data.clsKey] ? data.clsKey : "penitent";
    state.omenKey = OMENS[data.omenKey] ? data.omenKey : "oathbreaker";
    state.godKey = data.godKey || "veneratus";
    state.level = data.level ?? 1;
    state.xp = data.xp ?? 0;
    state.nextXp = data.nextXp ?? 100;
    state.pendingLevelUps = data.pendingLevelUps ?? 0;
    state.hp = data.hp ?? 14;
    state.maxHp = data.maxHp ?? 14;
    state.sp = data.sp ?? 15;
    state.torchTurns = data.torchTurns ?? 8;
    state.weaponTier = data.weaponTier ?? 0;
    state.brandLevel = data.brandLevel ?? 1;
    state.curses = new Set(Array.isArray(data.curses) ? data.curses : []);
    state.inventory = Array.isArray(data.inventory)
      ? data.inventory
      : [
          { name: "Pitch Torch", qty: 3 },
          { name: "Tallow Ration", qty: 2 }
        ];
    state.activeQuest = data.activeQuestId
      ? QUESTS.find((q) => q.id === data.activeQuestId) || null
      : null;
    state.completedQuests = new Set(Array.isArray(data.completedQuests) ? data.completedQuests : []);
    state.statBoosts = data.statBoosts || { str: 0, int: 0, fth: 0, wil: 0 };
    state.camp = data.camp || { hearth: 1, anvil: 1, totem: 1 };
    state.dungeon = data.dungeon || null;

    // Reset transient UI/animation fields
    state.encounter = null;
    state.viewArtId = null;
    state.inspectingItem = null;
    state.hoveredHotspot = null;
    state.diceRolling = false;
    state.combatPulse = 0;
    fallingDice.length = 0;

    return true;
  } catch {
    return false;
  }
}

export function clearSave() {
  try {
    window.localStorage.removeItem(SAVE_KEY);
  } catch {
    // Ignore storage restriction errors
  }
}