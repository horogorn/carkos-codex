// ============================================================================
// THE CARKOS CODEX — Canonical Lore, Entities, Items & Static Data (Base Layer)
// Zero imports. All v10+ books, spells, scrolls, mercenaries, and skills will
// be added here without touching the rendering engine.
// ============================================================================

export const TIME_PHASES = ["DAWN", "DUSK", "NIGHT", "WITCHING HOUR"];

export const CLASSES = {
  penitent: {
    name: "Marrow-Penitent",
    gear: "cage_helm",
    gearId: 0,
    stats: { str: 7, int: 3, fth: 8, wil: 6 },
    lore: "Bound in a horned iron cage-helm to silence worldly doubts. Sworn to ascend Osscrown."
  },
  fendiver: {
    name: "Fen-Diver",
    gear: "beak_mask",
    gearId: 1,
    stats: { str: 6, int: 6, fth: 4, wil: 8 },
    lore: "Wears a long brass plague-beak hood stuffed with moss to resist the soporific mist."
  },
  flagellant: {
    name: "Cinder-Flagellant",
    gear: "bandages",
    gearId: 2,
    stats: { str: 5, int: 5, fth: 9, wil: 5 },
    lore: "Wrapped in ash-stiffened linens from The Cinder Basin. Carries smoldering coals beneath the tongue."
  },
  scavenger: {
    name: "Miregate Scavenger",
    gear: "tattered_hood",
    gearId: 3,
    stats: { str: 8, int: 5, fth: 3, wil: 7 },
    lore: "Hunched wanderer in a jagged cowl. Exiled from Osscrown to the mud-slums of Miregate."
  },
  cantor: {
    name: "Veil-Cantor",
    gear: "veil_crown",
    gearId: 4,
    stats: { str: 3, int: 9, fth: 6, wil: 8 },
    lore: "Wears a towering veiled mitre that bends shadow and false memory in deep catacombs."
  },
  rootwalker: {
    name: "Grafted Root-Walker",
    gear: "bark_crown",
    gearId: 5,
    stats: { str: 8, int: 4, fth: 7, wil: 5 },
    lore: "Crowned with branching petrified antlers fused directly into his brow."
  }
};

export const OMENS = {
  oathbreaker: { name: "Oath-Breaker", bonus: { str: 1 } },
  graverobber: { name: "Grave-Robber", bonus: { int: 1 } },
  sleepwalker: { name: "Sleep-Walker", bonus: { wil: 1 } },
  heretic:     { name: "Heresy-Marked", bonus: { fth: 1 } }
};

export const PANTHEON = {
  vaelmora:  { name: "VAEL-MORA",  skill: "Sanguine Talon",     rgb: [0.92, 0.22, 0.20], hex: "#b8322d", effect: "bleed" },
  aurelion:  { name: "AURELION",   skill: "Rebuke of the Void", rgb: [0.94, 0.78, 0.36], hex: "#c9a642", effect: "stun" },
  vespera:   { name: "VESPERA",    skill: "Sanctify Threshold", rgb: [0.68, 0.52, 0.88], hex: "#8e6bb8", effect: "ward" },
  arborkahn: { name: "ARBOR-KAHN", skill: "Earthen Palisade",   rgb: [0.46, 0.76, 0.48], hex: "#589c5e", effect: "shield" },
  ignissol:  { name: "IGNIS-SOL",  skill: "Hymn of Kindling",   rgb: [0.96, 0.54, 0.22], hex: "#d96b27", effect: "heal" },
  veneratus: { name: "VENERATUS",  skill: "Aegis of the Crown", rgb: [0.90, 0.84, 0.70], hex: "#b59b6d", effect: "counter" }
};

export const ITEM_CATALOG = {
  "Tallow Ration": {
    artId: "ration",
    usable: true,
    sellPrice: 2,
    desc: "Salted tallow wrapped in waxcloth. Eat to restore +5 Vitality (HP)."
  },
  "Pitch Torch": {
    artId: "torch",
    usable: true,
    sellPrice: 2,
    desc: "Resin-soaked pinewood torch. Light to replenish 8 turns of subterranean sight."
  },
  "Night-Watch Moss": {
    artId: "moss",
    usable: true,
    sellPrice: 6,
    desc: "Bitter silver-green swamp lichen. Chew to purge Drift-Sickness from your mind."
  },
  "Censer of Ways": {
    artId: "censer",
    usable: true,
    sellPrice: 18,
    desc: "Ornate brass ritual pipe. Smoke inside catacombs to reveal hidden secret doors."
  },
  "Hollow Reed-Bone": {
    artId: "reedbone",
    usable: true,
    sellPrice: 18,
    desc: "Carved bone flute pierced with wind-holes. Vibrates near hidden chambers."
  },
  "Crown-Shard": {
    artId: "shard",
    usable: false,
    sellPrice: 25,
    desc: "Crystalline sliver broken from Veneratus's sun-mitre. Sought by Miregate's Chronicler."
  }
};

export const GALLERY_LORE = {
  sentinel: {
    title: "The Weeping Sentinel",
    lore: "A disgraced Bone-Sworn knight guarding Miregate's palisades during Dusk and Night. Dark rust-tears weep endlessly from his fluted iron sallet helm."
  },
  priest: {
    title: "The Marrow-Priest",
    lore: "Exiled celebrant of the Atar. His cracked bone-mitre channels the lingering immortality of Veneratus."
  },
  frogknight: {
    title: "The Exiled Frog-Knight",
    lore: "A shivering sentinel huddled in the catacomb corridors, clutching his ornate frog-shaped helm in terror of the walking dead."
  },
  nighthag: {
    title: "The Pale Night-Hag",
    lore: "Emerges only during the Witching Hour. Her tattered veil hides a hollow smile, offering forbidden hexes in exchange for Vitality."
  },
  fenwarden: {
    title: "The Fen-Warden",
    lore: "Watcher at the edge of The Quicksilver Fen. His brass plague-beak is stuffed with night-watch moss to keep Drift-Sickness at bay."
  },
  peddler: {
    title: "The Thin Masked Peddler",
    lore: "A slender wanderer wearing a pale wooden mask, bartering relics, torches, and cryptic rumors along the pilgrim roads."
  },
  exile: {
    title: "The Bone-Sworn Colossus",
    lore: "A towering, arrow-pierced giant in corroded plate, dragging a monolith greatsword out of the Sunken Ossuary's shadows."
  },
  mirevisage: {
    title: "The Mire-Leviathan",
    lore: "A gaunt, spine-crested apparition rising from black mirror-water, its detached jaw bound with reeds."
  },
  marionette: {
    title: "The Pit-Beast of Velkhar",
    lore: "A colossal, four-legged subterranean horror with a crown of jagged dorsal spines and twin hypnotic eyes glowing in the dark."
  },
  hermit: {
    title: "The Reed-Pipe Hermit",
    lore: "A devotee of Arbor-Kahn whose face has fused with hollow petrified bark, whistling mournful chords in the wind."
  },
  censer:   { title: "The Censer of Ways",        lore: ITEM_CATALOG["Censer of Ways"].desc },
  shard:    { title: "Veneratus's Crown-Shard",   lore: ITEM_CATALOG["Crown-Shard"].desc },
  moss:     { title: "Night-Watch Moss",          lore: ITEM_CATALOG["Night-Watch Moss"].desc },
  reedbone: { title: "Hollow Reed-Bone",          lore: ITEM_CATALOG["Hollow Reed-Bone"].desc },
  ration:   { title: "Tallow Ration",             lore: ITEM_CATALOG["Tallow Ration"].desc },
  torch:    { title: "Pitch Torch",               lore: ITEM_CATALOG["Pitch Torch"].desc }
};

export const MAP_LOCATIONS = [
  {
    id: "miregate",
    type: "town",
    name: "MIREGATE (TOWN)",
    x: 0.48,
    y: 0.28,
    desc: "Lawless mud-slums beneath the colossal skull-citadel of Veneratus. Town encounters shift with the Time of Day."
  },
  {
    id: "ossuary",
    type: "dungeon",
    name: "SUNKEN OSSUARY",
    x: 0.24,
    y: 0.44,
    desc: "Multi-level subterranean catacombs. Only the Entrance Stairs lead back to the surface."
  },
  {
    id: "velkhar",
    type: "dungeon",
    name: "OLD VELKHAR RUINS",
    x: 0.76,
    y: 0.46,
    desc: "Deep pre-human labyrinth haunted by The Pit-Beast. Conceals secret vaults behind ancient murals."
  },
  {
    id: "fen",
    type: "wild",
    name: "QUICKSILVER FEN",
    x: 0.28,
    y: 0.74,
    desc: "Mirror-waters and silver mist. Speak with the Fen-Warden or confront The Mire-Leviathan."
  },
  {
    id: "peddler",
    type: "merchant",
    name: "MASKED PEDDLER",
    x: 0.62,
    y: 0.68,
    desc: "A wandering lantern flickers along the pilgrim road. Trade relics, buy Torches & Rations, or hear secrets."
  }
];

export const QUESTS = [
  {
    id: "q_censer",
    title: "Recover the Censer of Ways",
    targetItem: "Censer of Ways",
    rewardSP: 25,
    rewardXP: 75,
    desc: "The Chronicler in Miregate seeks the brass Censer lost inside The Sunken Ossuary."
  },
  {
    id: "q_shard",
    title: "Claim Veneratus's Crown-Shard",
    targetItem: "Crown-Shard",
    rewardSP: 40,
    rewardXP: 110,
    desc: "Delve deep into Old Velkhar Ruins and recover the fallen god's crystalline Crown-Shard."
  }
];

export const ENEMY_TEMPLATES = {
  exile: {
    monsterId: 0.0,
    artId: "exile",
    name: "BONE-SWORN COLOSSUS",
    maxHp: 14,
    atk: 3,
    parleyStat: "wil",
    parleyDC: 12,
    sp: 14,
    xp: 45,
    loot: "Censer of Ways",
    telegraphs: [
      "Raising monolith greatsword for a crushing cleave (3 DMG)...",
      "Lowering horned helm, preparing a charging thrust (4 DMG)..."
    ]
  },
  mirevisage: {
    monsterId: 1.0,
    artId: "mirevisage",
    name: "THE MIRE-LEVIATHAN",
    maxHp: 13,
    atk: 3,
    parleyStat: "int",
    parleyDC: 13,
    sp: 16,
    xp: 50,
    loot: "Night-Watch Moss",
    telegraphs: [
      "Chanting a silver lullaby from the black water (Drift-Sickness + 2 DMG)...",
      "Lashing out from the fog with drowned tendrils (3 DMG)..."
    ]
  },
  marionette: {
    monsterId: 2.0,
    artId: "marionette",
    name: "THE PIT-BEAST",
    maxHp: 17,
    atk: 4,
    parleyStat: "fth",
    parleyDC: 13,
    sp: 22,
    xp: 70,
    loot: "Crown-Shard",
    telegraphs: [
      "Crouching low on four pillar-limbs to pounce (4 DMG)...",
      "Fixing twin hypnotic eyes upon your soul (3 DMG + Dread)..."
    ]
  }
};