// ============================================================================
// THE CARKOS CODEX — Master Entry Point, ASCII Rasterizer, Audio & UI Wiring
// Imports all sibling src/ modules and registers cross-module callbacks.
// ============================================================================

import {
  CLASSES,
  GALLERY_LORE,
  ITEM_CATALOG,
  MAP_LOCATIONS,
  PANTHEON,
  QUESTS,
  TIME_PHASES
} from "./lore.js";

import {
  state,
  fallingDice,
  floatingTexts,
  generateFaceParams,
  spawnFloatText,
  addItem,
  removeItem,
  getItemQty,
  advanceTime,
  getComputedStats,
  grantXP,
  saveGame,
  hasSavedGame,
  loadGame
} from "./state.js";

import {
  resizeWebGL,
  renderWebGLFrame,
  getLastWebGLPixels
} from "./shaders.js";

import {
  drawDetailedArtwork,
  drawWorldMap,
  drawExpressivePortrait,
  drawCoverArt,
  drawFullBodyVessel
} from "./art2d.js";

import {
  configureDungeon,
  generateDungeon,
  getDungeonRenderParams,
  revealSecretInCurrentRoom,
  renderDungeonRoom,
  drawDungeonMinimapHUD,
  getDungeonHotspots,
  handleDungeonAction
} from "./dungeon.js";

import {
  configureCombat,
  launchPhysicalDice,
  updateAndDrawPhysicalDice,
  hideEncounterHUD,
  startEncounter,
  renderEncounterChoices,
  handleCombatAction
} from "./combat.js";

// ============================================================================
// 1. Canvas Setup & Sobel + Bayer 4x4 ASCII Rasterizer
// ============================================================================

const mainCanvas = document.getElementById("main-canvas");
const mCtx = mainCanvas.getContext("2d");

const miniCanvas = document.getElementById("mini-portrait");
const miniCtx = miniCanvas.getContext("2d");

const faceBuf = document.createElement("canvas");
const fCtx = faceBuf.getContext("2d", { willReadFrequently: true });
faceBuf.width = 56;
faceBuf.height = 62;
miniCanvas.width = 56 * 3;
miniCanvas.height = 62 * 3;

const buffer2D = document.createElement("canvas");
const bCtx = buffer2D.getContext("2d", { willReadFrequently: true });

let COLS = 132;
let ROWS = 80;
const CELL_W = 6;
const CELL_H = 8;

const RAMP = " .·,:;░▒+itIYVXRBM#%@█";
const BAYER4 = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5]
];

let lumGrid = new Float32Array(COLS * ROWS);

function configureDimensions() {
  COLS = state.verticalMode ? 76 : 132;
  ROWS = state.verticalMode ? 102 : 80;
  resizeWebGL(COLS, ROWS);
  buffer2D.width = COLS;
  buffer2D.height = ROWS;
  mainCanvas.width = COLS * CELL_W;
  mainCanvas.height = ROWS * CELL_H;
  lumGrid = new Float32Array(COLS * ROWS);
}

function renderPixelsToAscii(pixels, srcW, srcH, flipY, dstCtx, cellW, cellH, transparentBg = false) {
  const localLum = srcW === COLS && srcH === ROWS ? lumGrid : new Float32Array(srcW * srcH);

  for (let y = 0; y < srcH; y++) {
    const sy = flipY ? srcH - 1 - y : y;
    for (let x = 0; x < srcW; x++) {
      const i = (sy * srcW + x) * 4;
      localLum[y * srcW + x] =
        (0.299 * pixels[i] + 0.587 * pixels[i + 1] + 0.114 * pixels[i + 2]) / 255;
    }
  }

  if (transparentBg) {
    dstCtx.clearRect(0, 0, srcW * cellW, srcH * cellH);
  } else {
    dstCtx.fillStyle = "#040303";
    dstCtx.fillRect(0, 0, srcW * cellW, srcH * cellH);
  }

  dstCtx.font = `bold ${cellH}px "Courier New", Courier, monospace`;
  dstCtx.textBaseline = "top";

  for (let y = 0; y < srcH; y++) {
    const sy = flipY ? srcH - 1 - y : y;
    for (let x = 0; x < srcW; x++) {
      const lum = localLum[y * srcW + x];
      if (lum < 0.035) continue;

      let ch = " ";
      let isEdge = false;

      if (state.edgesEnabled && x > 0 && x < srcW - 1 && y > 0 && y < srcH - 1) {
        const tl = localLum[(y - 1) * srcW + (x - 1)];
        const t = localLum[(y - 1) * srcW + x];
        const tr = localLum[(y - 1) * srcW + (x + 1)];
        const l = localLum[y * srcW + (x - 1)];
        const r = localLum[y * srcW + (x + 1)];
        const bl = localLum[(y + 1) * srcW + (x - 1)];
        const b = localLum[(y + 1) * srcW + x];
        const br = localLum[(y + 1) * srcW + (x + 1)];

        const gx = -tl + tr - 2 * l + 2 * r - bl + br;
        const gy = -tl - 2 * t - tr + bl + 2 * b + br;

        if (Math.hypot(gx, gy) > 0.44) {
          isEdge = true;
          const ang = Math.atan2(gy, gx);
          const absA = Math.abs(ang);
          if (absA < 0.4 || absA > 2.74) ch = "|";
          else if (absA > 1.17 && absA < 1.97) ch = "-";
          else if ((ang > 0 && ang < 1.57) || ang < -1.57) ch = "/";
          else ch = "\\";
        }
      }

      if (!isEdge) {
        const dLum = Math.max(0, Math.min(1, lum + (BAYER4[y & 3][x & 3] / 16 - 0.5) * 0.14));
        ch = RAMP[Math.min(RAMP.length - 1, Math.floor(dLum * RAMP.length))];
      }
      if (ch === " ") continue;

      const pi = (sy * srcW + x) * 4;
      const pr = pixels[pi];
      const pg = pixels[pi + 1];
      const pb = pixels[pi + 2];
      const maxC = Math.max(pr, pg, pb, 1);
      const sc = Math.min(255, (90 + lum * 165) * (isEdge ? 1.22 : 1.0)) / maxC;
      dstCtx.fillStyle = `rgb(${Math.min(255, Math.floor(pr * sc))}, ${Math.min(255, Math.floor(pg * sc))}, ${Math.min(255, Math.floor(pb * sc))})`;
      dstCtx.fillText(ch, x * cellW, y * cellH);
    }
  }
}

function renderWebGL3D(envCode, propType, propState) {
  const pixels = renderWebGLFrame(envCode, propType, propState);
  renderPixelsToAscii(pixels, COLS, ROWS, true, mCtx, CELL_W, CELL_H, false);
}

function render2DToAscii(drawFn) {
  drawFn(bCtx, COLS, ROWS, state.time);
  renderPixelsToAscii(
    bCtx.getImageData(0, 0, COLS, ROWS).data,
    COLS,
    ROWS,
    false,
    mCtx,
    CELL_W,
    CELL_H,
    false
  );
}

// ============================================================================
// 2. Interactive Canvas Hotspots & Overlays
// ============================================================================

function getActiveCanvasHotspots() {
  if (state.screen === "map") {
    return MAP_LOCATIONS.map((loc) => ({
      id: loc.id,
      label: loc.name,
      x: loc.x,
      y: loc.y,
      r: 0.07
    }));
  }
  if (state.screen === "town" && !state.viewArtId) {
    return [
      { id: "tavern", label: "[TALLOW TAVERN: QUESTS]", x: 0.22, y: 0.62, r: 0.13 },
      { id: "shrine", label: "[EXILED SHRINE: LORE & CURE]", x: 0.50, y: 0.58, r: 0.11 },
      { id: "smith", label: "[SCRAP-SMITH: GEAR & TORCHES]", x: 0.78, y: 0.62, r: 0.13 }
    ];
  }
  if (state.screen === "camp" && !state.viewArtId) {
    return [
      { id: "totem", label: `[WARD-TOTEM LVL ${state.camp.totem}]`, x: 0.21, y: 0.56, r: 0.12 },
      { id: "hearth", label: `[ASHEN HEARTH LVL ${state.camp.hearth}]`, x: 0.52, y: 0.72, r: 0.13 },
      { id: "anvil", label: `[BONE-ANVIL LVL ${state.camp.anvil}]`, x: 0.78, y: 0.66, r: 0.12 }
    ];
  }
  if (state.screen === "wild" && !state.viewArtId) {
    return [
      { id: "fenwarden", label: "[SPEAK: FEN-WARDEN]", x: 0.24, y: 0.56, r: 0.13 },
      { id: "phantom", label: "[CONFRONT: THE MIRE-LEVIATHAN]", x: 0.56, y: 0.48, r: 0.14 }
    ];
  }
  if (state.screen === "dungeon") {
    return getDungeonHotspots(mainCanvas.width, mainCanvas.height);
  }
  return [];
}

function drawCanvasOverlays() {
  const god = PANTHEON[state.godKey];

  if (state.screen === "map" && !state.viewArtId) {
    MAP_LOCATIONS.forEach((loc) => {
      const px = loc.x * mainCanvas.width;
      const py = loc.y * mainCanvas.height;
      mCtx.font = 'bold 10.5px "Courier New", Courier, monospace';
      mCtx.textBaseline = "top";
      const tw = mCtx.measureText(loc.name).width;
      mCtx.fillStyle = "rgba(5, 4, 4, 0.88)";
      mCtx.fillRect(px - tw / 2 - 4, py + 11, tw + 8, 14);
      mCtx.fillStyle =
        loc.type === "merchant"
          ? "#ffe28a"
          : state.currentMapId === loc.id
            ? god.hex
            : "#cfc7ba";
      mCtx.fillText(loc.name, px - tw / 2, py + 13);
    });
  }

  drawDungeonMinimapHUD(mCtx, mainCanvas.width);

  if (state.hoveredHotspot && !state.viewArtId) {
    const hs = state.hoveredHotspot;
    const px = hs.x * mainCanvas.width;
    const py = hs.y * mainCanvas.height;
    mCtx.strokeStyle = god.hex;
    mCtx.lineWidth = 1.6;
    const box = hs.id.startsWith("dng-move-") ? 12 : 24;
    mCtx.strokeRect(px - box, py - box, box * 2, box * 2);

    mCtx.font = 'bold 11px "Courier New", Courier, monospace';
    mCtx.textBaseline = "top";
    const tw = mCtx.measureText(hs.label).width;
    const lx = Math.max(8, Math.min(mainCanvas.width - tw - 16, px - tw / 2));
    const ly = Math.max(12, py - box - 18);
    mCtx.fillStyle = "rgba(5, 4, 4, 0.92)";
    mCtx.fillRect(lx - 5, ly - 2, tw + 10, 16);
    mCtx.fillStyle = "#f2eadc";
    mCtx.fillText(hs.label, lx, ly + 1);
  }

  for (let i = floatingTexts.length - 1; i >= 0; i--) {
    const ft = floatingTexts[i];
    ft.y -= 0.0018;
    ft.life -= 0.014;
    if (ft.life <= 0) {
      floatingTexts.splice(i, 1);
      continue;
    }
    mCtx.font = 'bold 12px "Courier New", Courier, monospace';
    mCtx.textBaseline = "top";
    mCtx.fillStyle = ft.color;
    mCtx.globalAlpha = Math.min(1, ft.life * 1.4);
    mCtx.fillText(ft.text, ft.x * mainCanvas.width - 55, ft.y * mainCanvas.height);
    mCtx.globalAlpha = 1;
  }

  updateAndDrawPhysicalDice(mCtx, mainCanvas.width, mainCanvas.height);
}

// ============================================================================
// 3. Master Animation Loop
// ============================================================================

function loop() {
  state.time += 0.022;
  state.combatPulse = Math.max(0, state.combatPulse - 0.025);

  if (state.screen === "title") {
    render2DToAscii(drawCoverArt);
  } else if (state.screen === "forge") {
    render2DToAscii(drawFullBodyVessel);
  } else if (state.screen === "gallery") {
    render2DToAscii((ctx, w, h, t) => drawDetailedArtwork(ctx, w, h, state.galleryArt, t));
  } else {
    if (state.viewArtId === "vessel_effigy") {
      render2DToAscii(drawFullBodyVessel);
    } else if (state.viewArtId) {
      render2DToAscii((ctx, w, h, t) => drawDetailedArtwork(ctx, w, h, state.viewArtId, t));
    } else if (state.screen === "encounter" && state.encounter) {
      renderWebGL3D(6.0, state.encounter.monsterId, state.combatPulse);
    } else if (state.screen === "map") {
      render2DToAscii(drawWorldMap);
    } else if (state.screen === "town") {
      renderWebGL3D(0.0, 0.0, 0.0);
    } else if (state.screen === "dungeon" && state.dungeon) {
      const { envCode, propType, propState } = getDungeonRenderParams();
      renderWebGL3D(envCode, propType, propState);
    } else if (state.screen === "wild") {
      renderWebGL3D(3.0, 0.0, 0.0);
    } else if (state.screen === "camp") {
      const campEnv = state.dungeon ? 5.0 : 4.0;
      renderWebGL3D(campEnv, state.camp.hearth, state.camp.totem);
    }

    drawExpressivePortrait(fCtx, 56, 62, state.time);
    renderPixelsToAscii(
      fCtx.getImageData(0, 0, 56, 62).data,
      56,
      62,
      false,
      miniCtx,
      3,
      3,
      false
    );
  }

  drawCanvasOverlays();
  requestAnimationFrame(loop);
}

// ============================================================================
// 4. HUD, Panel & Dialogue Helpers
// ============================================================================

function showPanel(name) {
  ["title", "forge", "game", "gallery"].forEach((p) => {
    document.getElementById(`panel-${p}`).classList.toggle("hidden", p !== name);
  });
  document.getElementById("btn-gallery").classList.toggle("active", name === "gallery");
}

function updateForgeStats() {
  const s = getComputedStats();
  ["str", "int", "fth", "wil"].forEach((k) => {
    document.getElementById(`f-${k}`).textContent = s[k];
  });
}

function updateTimeHUD() {
  const el = document.getElementById("hud-time");
  const phase = TIME_PHASES[state.timeIdx];
  el.textContent = `DAY ${state.day} • ${phase}`;
  el.style.borderColor = state.timeIdx === 3 ? "#b8322d" : "#383028";
  el.style.color = state.timeIdx === 3 ? "#ff8a84" : "#e6dfd3";
}

function updateNavButtons() {
  const mapBtn = document.getElementById("btn-nav-map");
  const inDungeon =
    state.screen === "dungeon" ||
    (state.screen === "encounter" && Boolean(state.dungeon)) ||
    (state.screen === "camp" && Boolean(state.dungeon));
  mapBtn.disabled = inDungeon;
  mapBtn.title = inDungeon ? "Return to Entrance Stairs to exit dungeon!" : "Open World Map";
}

function updateHUD() {
  const cls = CLASSES[state.clsKey];
  const god = PANTHEON[state.godKey];
  const s = getComputedStats();

  document.getElementById("hud-class").textContent = cls.name;
  document.getElementById("hud-lvl").textContent = state.level;
  document.getElementById("hud-xp").textContent = `${state.xp}/${state.nextXp}`;
  document.getElementById("hud-god").textContent = god.name;
  document.getElementById("hud-brand").textContent = state.brandLevel;
  document.getElementById("hp-fill").style.width = `${(state.hp / state.maxHp) * 100}%`;

  document.getElementById("res-sp").textContent = `${state.sp} SP`;
  document.getElementById("res-torch").textContent = `${getItemQty("Pitch Torch")} (${state.torchTurns}t)`;
  document.getElementById("res-rat").textContent = `x${getItemQty("Tallow Ration")}`;
  document.getElementById("res-wpn").textContent = `+${state.weaponTier}`;

  ["str", "int", "fth", "wil"].forEach((k) => {
    document.getElementById(`g-${k}`).textContent = s[k];
  });

  const curseStr =
    state.curses.size === 0
      ? "Uncorrupted"
      : Array.from(state.curses)
          .map((c) => c.toUpperCase())
          .join(", ");
  document.getElementById("hud-curses").textContent = `HP: ${state.hp}/${state.maxHp} • FLESH: ${curseStr}`;

  document.getElementById("quest-tag").textContent = state.activeQuest
    ? `QUEST: ${state.activeQuest.title}`
    : "QUEST: None";

  const invBox = document.getElementById("inv-items");
  invBox.innerHTML =
    state.inventory.length === 0
      ? `<span style="color:#5c554d; font-style:italic;">Pack empty...</span>`
      : state.inventory
          .map((it) => `<button class="inv-item" data-item="${it.name}">${it.name} <strong>x${it.qty}</strong></button>`)
          .join("");
}

function setDialogue(tag, title, html, choices) {
  document.getElementById("game-tag").textContent = tag;
  document.getElementById("game-title").textContent = title;
  document.getElementById("game-lore").innerHTML = html;
  document.getElementById("game-choices").innerHTML = choices
    .map(
      (c, i) =>
        `<button class="choice-btn ${c.action === "open-levelup" ? "lvlup" : ""} ${c.isSecret ? "secret" : ""}" data-action="${c.action}"><span>[${i + 1}]</span> ${c.label}</button>`
    )
    .join("");
}

// ============================================================================
// 5. Pack Inspector, Vessel Effigy, World Map, Town, Fen, Camp & Peddler
// ============================================================================

function openVesselEffigy() {
  state.viewArtId = "vessel_effigy";
  const cls = CLASSES[state.clsKey];
  const god = PANTHEON[state.godKey];
  const itemButtons = state.inventory.map((it) => ({
    label: `Inspect Item: ${it.name} (x${it.qty})`,
    action: `pack-select-${it.name}`
  }));

  setDialogue(
    `Vessel Effigy // ${god.name} Vestments`,
    `${cls.name} (+${state.weaponTier} Blade)`,
    `${cls.lore}<br><br><em>Sweep your cursor across the plate to shift the chiaroscuro light over your armor and patron-dyed cloth.</em>`,
    [...itemButtons, { label: "← Close Vessel Effigy", action: "pack-close" }]
  );
}

function openPackInspector(selectedName = null) {
  if (state.inventory.length === 0) {
    openVesselEffigy();
    return;
  }

  const itemObj = state.inventory.find((i) => i.name === selectedName) || state.inventory[0];
  state.inspectingItem = itemObj.name;
  const meta = ITEM_CATALOG[itemObj.name] || {
    artId: "shard",
    usable: false,
    desc: "A mysterious artifact recovered from Carkos."
  };
  state.viewArtId = meta.artId;

  const itemButtons = state.inventory.map((it) => ({
    label: `Select: ${it.name} (x${it.qty})`,
    action: `pack-select-${it.name}`
  }));

  const actionChoices = [
    {
      label: "★ Inspect Full-Body Vessel Effigy",
      action: "pack-effigy",
      isSecret: true
    }
  ];
  if (meta.usable) {
    actionChoices.unshift({
      label: `★ Use / Consume ${itemObj.name} (x${itemObj.qty})`,
      action: `pack-use-${itemObj.name}`,
      isSecret: true
    });
  }

  setDialogue(
    `Satchel & Relics // Quantity: x${itemObj.qty}`,
    `${itemObj.name} (x${itemObj.qty})`,
    `${meta.desc}<br><br><em>Move your cursor across the woodcut plate to inspect its details.</em>`,
    [...actionChoices, ...itemButtons, { label: "← Close Pack", action: "pack-close" }]
  );
}

function usePackItem(name) {
  if (getItemQty(name) <= 0) return;
  playSFX(250, 0.2);

  if (name === "Tallow Ration") {
    removeItem(name, 1);
    state.hp = Math.min(state.maxHp, state.hp + 5);
    spawnFloatText(0.5, 0.5, "+5 VITALITY", "#82d988");
  } else if (name === "Pitch Torch") {
    removeItem(name, 1);
    state.torchTurns = 8;
    spawnFloatText(0.5, 0.5, "TORCH LIT (8 TURNS)", "#ffcf70");
  } else if (name === "Night-Watch Moss") {
    removeItem(name, 1);
    state.curses.delete("drift");
    spawnFloatText(0.5, 0.5, "DRIFT-SICKNESS CLEANSED", "#82d988");
  } else if (name === "Censer of Ways" || name === "Hollow Reed-Bone") {
    if (state.screen === "dungeon" && state.dungeon) {
      if (revealSecretInCurrentRoom()) {
        spawnFloatText(0.5, 0.42, "SECRET DOOR REVEALED!", "#ffe28a");
      } else {
        spawnFloatText(0.5, 0.45, "NO HIDDEN DOORS HERE", "#8f877b");
      }
    } else {
      spawnFloatText(0.5, 0.45, "USE INSIDE A DUNGEON", "#8f877b");
    }
  }

  updateHUD();
  saveGame();
  if (getItemQty(name) > 0) openPackInspector(name);
  else closePackInspector();
}

function closePackInspector() {
  state.viewArtId = null;
  state.inspectingItem = null;
  if (state.screen === "map") openWorldMap();
  else if (state.screen === "town") openTownMiregate();
  else if (state.screen === "camp") openCampScene();
  else if (state.screen === "wild") openQuicksilverFen();
  else if (state.screen === "dungeon") renderDungeonRoom();
  else if (state.screen === "encounter" && state.encounter) {
    renderEncounterChoices(`You face <strong>${state.encounter.name}</strong> in the dark.`);
  }
}

function openWorldMap() {
  if (state.dungeon) return;
  state.screen = "map";
  state.viewArtId = null;
  state.encounter = null;
  state.hoveredHotspot = null;
  fallingDice.length = 0;
  hideEncounterHUD();
  updateNavButtons();

  const curLoc = MAP_LOCATIONS.find((l) => l.id === state.currentMapId) || MAP_LOCATIONS[0];
  const choices = [{ label: `Enter ${curLoc.name} →`, action: `travel-${curLoc.id}` }];
  if (state.pendingLevelUps > 0) {
    choices.unshift({ label: `★ LEVEL UP AVAILABLE! (+1 Stat)`, action: "open-levelup" });
  }

  setDialogue(
    "The Waking Rind // Cartographic Chart",
    "World of Carkos",
    "Click any landmark or the roaming <strong>Masked Peddler</strong> on the chart to travel. Travelling advances the <em>Time of Day</em>.",
    choices
  );
}

function openTownMiregate() {
  state.screen = "town";
  state.currentMapId = "miregate";
  state.viewArtId = null;
  updateNavButtons();

  const phase = TIME_PHASES[state.timeIdx];
  const choices = [
    { label: "Tallow Tavern (Quests & Rumors)", action: "town-tavern" },
    { label: "Scrap-Smith (Buy Torches & Sharpen Blade)", action: "town-smith" },
    { label: "Exiled Shrine (Lore & Cleanse Curses)", action: "town-shrine" }
  ];

  let timeEncounterNote = "";
  if (state.timeIdx === 1 || state.timeIdx === 2) {
    timeEncounterNote =
      " By the dim lantern-light, <strong>The Weeping Sentinel</strong> stands watch near the palisade.";
    choices.push({ label: "Speak with The Weeping Sentinel (Dusk/Night)", action: "town-sentinel" });
  } else if (state.timeIdx === 3) {
    timeEncounterNote =
      " Through the Witching Hour fog glides <strong>The Pale Night-Hag</strong>, offering dark bargains.";
    choices.push({ label: "Parley with The Pale Night-Hag (Witching Hour)", action: "town-nighthag" });
  }
  choices.push({ label: "Leave Miregate → World Map", action: "open-map" });

  setDialogue(
    `3D Settlement // ${phase}`,
    "Town of Miregate",
    `Beneath the colossal skull of <strong>Veneratus</strong>, crooked roofs crowd the mud.${timeEncounterNote}`,
    choices
  );
}

function openQuicksilverFen() {
  state.screen = "wild";
  state.currentMapId = "fen";
  state.viewArtId = null;
  updateNavButtons();
  setDialogue(
    `3D Biome // ${TIME_PHASES[state.timeIdx]}`,
    "The Quicksilver Fen",
    "Silver mist drifts across sunken ruins. <em>Speak with the Fen-Warden (left) or confront The Mire-Leviathan rising from the ripples (center).</em>",
    [
      { label: "Speak with The Fen-Warden", action: "fen-warden" },
      { label: "Confront The Mire-Leviathan", action: "fen-fight" },
      { label: "Return to World Map", action: "open-map" }
    ]
  );
}

function openCampScene() {
  state.screen = "camp";
  state.viewArtId = null;
  state.hoveredHotspot = null;
  hideEncounterHUD();
  updateNavButtons();

  const isSubterranean = Boolean(state.dungeon);
  const choices = [
    { label: `Rest & Eat Ration (+${4 + state.camp.hearth * 2} HP, Dream Ward)`, action: "camp-rest" },
    {
      label: `Bone-Anvil: Upgrade Blade to +${state.weaponTier + 1} (${(state.weaponTier + 1) * 12} SP)`,
      action: "camp-sharpen"
    },
    { label: "Upgrade Camp Structures (Hearth/Anvil/Totem)", action: "camp-upgrades" },
    { label: "Blood & Ash Ritual (+1 Soul-Brand, -2 HP)", action: "camp-ritual" },
    {
      label: isSubterranean ? "Extinguish Fire → Resume Delve" : "Break Camp → World Map",
      action: "camp-leave"
    }
  ];

  if (state.pendingLevelUps > 0) {
    choices.unshift({ label: "★ LEVEL UP! Choose Stat to Increase", action: "open-levelup" });
  }

  setDialogue(
    isSubterranean ? "Subterranean Camp // Vault Alcove" : "Ashen Vigil // Moonlit Clearing",
    isSubterranean ? "Dying Embers in the Dark" : "Wilderness Camp",
    `Your cloaked figure sits beside the fire (<strong>Hearth Lvl ${state.camp.hearth}</strong> • <strong>Anvil Lvl ${state.camp.anvil}</strong> • <strong>Totem Lvl ${state.camp.totem}</strong>).`,
    choices
  );
}

function openPeddlerShop() {
  state.screen = "town";
  state.viewArtId = "peddler";
  setDialogue(
    "Wandering Caravan // Close-Up",
    "The Thin Masked Peddler",
    "The slender figure tilts his pale wooden mask. <em>\"Hehhehheh... silver weighs heavy on the road, traveler. Trade thy trinkets for fire and moss.\"</em>",
    [
      { label: `Buy 2 Pitch Torches (5 SP) [Have: x${getItemQty("Pitch Torch")}]`, action: "buy-torch" },
      { label: `Buy 2 Tallow Rations (6 SP) [Have: x${getItemQty("Tallow Ration")}]`, action: "buy-ration" },
      { label: `Buy Night-Watch Moss (10 SP) [Have: x${getItemQty("Night-Watch Moss")}]`, action: "buy-moss" },
      { label: "Sell Relics (+18–25 SP each)", action: "sell-relics" },
      { label: "Part Ways → World Map", action: "open-map" }
    ]
  );
}

// ============================================================================
// 6. Central Action Dispatcher
// ============================================================================

function handleAction(action) {
  playSFX(155);
  const stats = getComputedStats();

  // 1) Pack Inspector & Full-Body Effigy Actions
  if (action === "pack-effigy") {
    openVesselEffigy();
    return;
  }
  if (action.startsWith("pack-select-")) {
    openPackInspector(action.replace("pack-select-", ""));
    return;
  }
  if (action.startsWith("pack-use-")) {
    usePackItem(action.replace("pack-use-", ""));
    return;
  }
  if (action === "pack-close") {
    closePackInspector();
    return;
  }

  // 2) Delegate to Combat & Dungeon Modules
  if (handleCombatAction(action)) return;
  if (handleDungeonAction(action)) return;

  // 3) Map & Regional Travel
  if (action === "open-map") {
    openWorldMap();
  } else if (action === "open-camp") {
    openCampScene();
  } else if (action === "travel-miregate") {
    advanceTime(1);
    updateTimeHUD();
    openTownMiregate();
    saveGame();
  } else if (action === "travel-ossuary") {
    advanceTime(1);
    updateTimeHUD();
    generateDungeon("ossuary", 1);
  } else if (action === "travel-velkhar") {
    advanceTime(1);
    updateTimeHUD();
    generateDungeon("velkhar", 1);
  } else if (action === "travel-peddler") {
    advanceTime(1);
    updateTimeHUD();
    openPeddlerShop();
    saveGame();
  } else if (action === "travel-fen") {
    advanceTime(1);
    updateTimeHUD();
    openQuicksilverFen();
    saveGame();
  }

  // 4) Quicksilver Fen
  else if (action === "fen-warden") {
    state.viewArtId = "fenwarden";
    setDialogue(
      "Close-Up // Swamp Watcher",
      "The Fen-Warden",
      "His brass plague-beak clicks softly in the mist. <em>\"The Mire-Leviathan rises with backward eyes. Answer its riddle with keen Intellect, or strike it down.\"</em>",
      [{ label: "← Step back to The Fen", action: "travel-fen" }]
    );
  } else if (action === "fen-fight") {
    state.dungeon = null;
    startEncounter("mirevisage", false);
  }

  // 5) Level-Up Allocation
  else if (action === "open-levelup") {
    setDialogue(
      `Ascension // Level ${state.level}`,
      "Choose Vessel Growth",
      "Your trials in Carkos have tempered your mortal shell. Select an attribute to permanently increase (+1):",
      [
        { label: "Increase STRENGTH (+1 STR)", action: "lvl-str" },
        { label: "Increase INTELLECT (+1 INT)", action: "lvl-int" },
        { label: "Increase FAITH (+1 FTH)", action: "lvl-fth" },
        { label: "Increase WILL (+1 WIL)", action: "lvl-wil" }
      ]
    );
  } else if (action.startsWith("lvl-")) {
    const statKey = action.replace("lvl-", "");
    state.statBoosts[statKey]++;
    state.pendingLevelUps = Math.max(0, state.pendingLevelUps - 1);
    updateHUD();
    saveGame();
    openCampScene();
  }

  // 6) Town of Miregate & Time-of-Day Encounters
  else if (action === "town-sentinel") {
    state.viewArtId = "sentinel";
    setDialogue(
      "Nocturnal Vigil // Close-Up",
      "The Weeping Sentinel",
      "Dark rust-tears drip beneath his fluted visor. <em>\"Beware the Witching Hour, pilgrim—when the Pale Night-Hag walks Miregate's alleys.\"</em>",
      [{ label: "← Back to Miregate Square", action: "town-return" }]
    );
  } else if (action === "town-nighthag") {
    state.viewArtId = "nighthag";
    setDialogue(
      "Witching Hour // Close-Up",
      "The Pale Night-Hag",
      "Hollow red pinpoints gleam beneath her tattered veil. <em>\"Trade four drops of Vitality for ancient insight, traveler...\"</em>",
      [
        { label: "Accept Dark Bargain (-4 HP, +65 XP, +1 Brand)", action: "hag-bargain" },
        { label: "← Flee to Miregate Square", action: "town-return" }
      ]
    );
  } else if (action === "hag-bargain") {
    if (state.hp > 4) {
      state.hp -= 4;
      grantXP(65);
      state.brandLevel = Math.min(10, state.brandLevel + 1);
      state.curses.add("brand");
      updateHUD();
      saveGame();
      spawnFloatText(0.5, 0.45, "+65 XP • BRANDED", "#ff4d45");
    }
    openTownMiregate();
  } else if (action === "town-return") {
    openTownMiregate();
  } else if (action === "town-tavern") {
    if (state.activeQuest && getItemQty(state.activeQuest.targetItem) > 0) {
      const q = state.activeQuest;
      removeItem(q.targetItem, 1);
      state.sp += q.rewardSP;
      grantXP(q.rewardXP);
      state.completedQuests.add(q.id);
      state.activeQuest = null;
      updateHUD();
      saveGame();
      setDialogue(
        "Quest Fulfilled!",
        q.title,
        `The Hunched Chronicler clutches the relic, paying you <strong>${q.rewardSP} SP</strong> and granting <strong>+${q.rewardXP} XP</strong>!`,
        [{ label: "← Back to Miregate Square", action: "town-return" }]
      );
      return;
    }

    const avail = QUESTS.filter((q) => !state.completedQuests.has(q.id));
    const qChoices = avail.map((q) => ({
      label: `Accept: ${q.title} (${q.rewardSP} SP)`,
      action: `accept-${q.id}`
    }));
    setDialogue(
      "Tallow Tavern // Rumors",
      "The Hunched Chronicler",
      "Candle-smoke clings to parchment maps. <em>\"Bring me relics from the Sunken Ossuary or Old Velkhar, and I will pay in old silver.\"</em>",
      [...qChoices, { label: "← Back to Miregate Square", action: "town-return" }]
    );
  } else if (action.startsWith("accept-")) {
    const qid = action.replace("accept-", "");
    state.activeQuest = QUESTS.find((q) => q.id === qid) || null;
    updateHUD();
    saveGame();
    if (state.activeQuest) {
      setDialogue("Contract Bound", state.activeQuest.title, state.activeQuest.desc, [
        { label: "← Back to Miregate Square", action: "town-return" }
      ]);
    }
  } else if (action === "town-smith") {
    const sharpCost = (state.weaponTier + 1) * 10;
    setDialogue(
      "Miregate Forge",
      "The Scrap-Smith",
      "Sparks shower from a cracked whetstone. <em>\"Silver buys edge and fire, pilgrim.\"</em>",
      [
        { label: `Sharpen Blade to +${state.weaponTier + 1} (${sharpCost} SP)`, action: "smith-sharpen" },
        { label: `Buy 2 Pitch Torches (5 SP) [Have: x${getItemQty("Pitch Torch")}]`, action: "buy-torch" },
        { label: `Buy 2 Tallow Rations (6 SP) [Have: x${getItemQty("Tallow Ration")}]`, action: "buy-ration" },
        { label: "← Back to Miregate Square", action: "town-return" }
      ]
    );
  } else if (action === "smith-sharpen") {
    const cost = (state.weaponTier + 1) * 10;
    if (state.sp >= cost && state.weaponTier < 3) {
      state.sp -= cost;
      state.weaponTier++;
      updateHUD();
      saveGame();
      spawnFloatText(0.5, 0.5, `BLADE +${state.weaponTier}!`, "#ffe28a");
    }
    handleAction("town-smith");
  } else if (action === "town-shrine") {
    state.viewArtId = "priest";
    setDialogue(
      "Exiled Shrine // Close-Up",
      "Outcast Marrow-Priest",
      "His cracked bone-mitre gleams beneath the crimson vault. <em>\"Eight silver pieces will wash away thy flesh-curses.\"</em>",
      [
        { label: "Cleanse All Curses (8 SP)", action: "shrine-cleanse" },
        { label: "Hear Lore of Veneratus", action: "shrine-lore" },
        { label: "← Back to Miregate Square", action: "town-return" }
      ]
    );
  } else if (action === "shrine-cleanse") {
    if (state.sp >= 8) {
      state.sp -= 8;
      state.curses.clear();
      updateHUD();
      saveGame();
      spawnFloatText(0.5, 0.5, "FLESH CLEANSED", "#82d988");
    }
    handleAction("town-shrine");
  } else if (action === "shrine-lore") {
    setDialogue(
      "Codex Lore // The Crowned Skull",
      "The Fall of Veneratus",
      "<em>\"Aurelion cast his three eyes into the Well of Threads. From the cursed crimson eye rose Veneratus—whose colossal skull now crowns this very mountain.\"</em>",
      [{ label: "← Back to Miregate Square", action: "town-return" }]
    );
  }

  // 7) Merchant & Smith Purchases
  else if (action === "buy-torch") {
    if (state.sp >= 5) {
      state.sp -= 5;
      addItem("Pitch Torch", 2);
      if (state.torchTurns === 0) {
        removeItem("Pitch Torch", 1);
        state.torchTurns = 8;
      }
      updateHUD();
      saveGame();
      spawnFloatText(0.5, 0.5, `+2 TORCHES (x${getItemQty("Pitch Torch")})`, "#ffcf70");
      if (state.viewArtId === "peddler") openPeddlerShop();
      else handleAction("town-smith");
    }
  } else if (action === "buy-ration") {
    if (state.sp >= 6) {
      state.sp -= 6;
      addItem("Tallow Ration", 2);
      updateHUD();
      saveGame();
      spawnFloatText(0.5, 0.5, `+2 RATIONS (x${getItemQty("Tallow Ration")})`, "#82d988");
      if (state.viewArtId === "peddler") openPeddlerShop();
      else handleAction("town-smith");
    }
  } else if (action === "buy-moss") {
    if (state.sp >= 10) {
      state.sp -= 10;
      addItem("Night-Watch Moss", 1);
      updateHUD();
      saveGame();
      spawnFloatText(0.5, 0.5, `+1 MOSS (x${getItemQty("Night-Watch Moss")})`, "#82d988");
      if (state.viewArtId === "peddler") openPeddlerShop();
    }
  } else if (action === "sell-relics") {
    const sellables = ["Censer of Ways", "Crown-Shard", "Hollow Reed-Bone"];
    let earned = 0;
    sellables.forEach((sName) => {
      const q = getItemQty(sName);
      if (q > 0) {
        earned += q * (ITEM_CATALOG[sName].sellPrice || 18);
        removeItem(sName, q);
      }
    });
    if (earned > 0) {
      state.sp += earned;
      updateHUD();
      saveGame();
      spawnFloatText(0.5, 0.5, `+${earned} SP`, "#ffe28a");
    }
  }

  // 8) Camp Actions & Upgrades
  else if (action === "camp-rest") {
    if (getItemQty("Tallow Ration") > 0) {
      removeItem("Tallow Ration", 1);
      advanceTime(1);
      updateTimeHUD();
      const heal = 4 + state.camp.hearth * 2;
      state.hp = Math.min(state.maxHp, state.hp + heal);
      const d20 = Math.floor(Math.random() * 20) + 1;
      const dc = Math.max(7, 12 - state.camp.hearth);
      launchPhysicalDice(d20, stats.wil, "Dream Ward", () => {
        if (d20 + stats.wil < dc) {
          state.curses.add("drift");
          setDialogue(
            "Nightmare in the Mist",
            "Drift-Sickness",
            `Rolled ${d20 + stats.wil} vs DC ${dc}. Silver fog creeps into your camp (+${heal} HP, afflicted with Drift-Sickness).`,
            [{ label: "Continue Camp", action: "open-camp" }]
          );
        } else {
          setDialogue(
            "Serene Vigil",
            "Restored by Firelight",
            `Rolled ${d20 + stats.wil} vs DC ${dc}. You sleep peacefully beside the embers (+${heal} HP).`,
            [{ label: "Continue Camp", action: "open-camp" }]
          );
        }
        updateHUD();
        saveGame();
      });
    } else {
      setDialogue(
        "No Rations Left",
        "Empty Pack",
        "You have no Tallow Rations to restore Vitality. Buy rations in Miregate or from the Masked Peddler.",
        [{ label: "Continue Camp", action: "open-camp" }]
      );
    }
  } else if (action === "camp-sharpen") {
    const cost = (state.weaponTier + 1) * 12;
    if (state.weaponTier >= state.camp.anvil) {
      setDialogue(
        "Anvil Limit Reached",
        "Upgrade Bone-Anvil First",
        `Your Bone-Anvil (Lvl ${state.camp.anvil}) cannot forge beyond +${state.weaponTier}. Upgrade the Bone-Anvil first!`,
        [{ label: "Continue Camp", action: "open-camp" }]
      );
    } else if (state.sp >= cost) {
      state.sp -= cost;
      state.weaponTier++;
      updateHUD();
      saveGame();
      spawnFloatText(0.76, 0.55, `BLADE +${state.weaponTier}`, "#ffe28a");
      openCampScene();
    }
  } else if (action === "camp-upgrades") {
    setDialogue(
      "Camp Construction",
      "Fortify Ashen Vigil",
      `Spend Silver (<strong>${state.sp} SP</strong>) to permanently upgrade your camp:`,
      [
        { label: `Upgrade Ashen Hearth (Lvl ${state.camp.hearth}→${state.camp.hearth + 1}) [15 SP]`, action: "upg-hearth" },
        { label: `Upgrade Bone-Anvil (Lvl ${state.camp.anvil}→${state.camp.anvil + 1}) [15 SP]`, action: "upg-anvil" },
        { label: `Upgrade Ward-Totem (Lvl ${state.camp.totem}→${state.camp.totem + 1}) [15 SP]`, action: "upg-totem" },
        { label: "← Back to Campfire", action: "open-camp" }
      ]
    );
  } else if (action.startsWith("upg-")) {
    const part = action.replace("upg-", "");
    if (state.sp >= 15 && state.camp[part] < 3) {
      state.sp -= 15;
      state.camp[part]++;
      updateHUD();
      saveGame();
      spawnFloatText(0.5, 0.45, `${part.toUpperCase()} LVL ${state.camp[part]}!`, "#82d988");
    }
    handleAction("camp-upgrades");
  } else if (action === "camp-ritual") {
    if (state.hp > 2) {
      state.hp -= 2;
      state.brandLevel = Math.min(10, state.brandLevel + 1);
      if (state.brandLevel >= 4) state.curses.add("brand");
      updateHUD();
      saveGame();
      spawnFloatText(0.24, 0.50, "+1 SOUL-BRAND", PANTHEON[state.godKey].hex);
      openCampScene();
    }
  } else if (action === "camp-leave") {
    if (state.dungeon) {
      state.screen = "dungeon";
      updateNavButtons();
      renderDungeonRoom();
    } else {
      openWorldMap();
    }
  }
}

// ============================================================================
// 7. Web Audio Procedural Synth (Drone + Bone-Snap SFX)
// ============================================================================

let audioCtx = null;
let audioRunning = false;

function playSFX(pitch = 160, dur = 0.14) {
  if (!audioRunning || !audioCtx) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = "triangle";
  osc.frequency.setValueAtTime(pitch, audioCtx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(38, audioCtx.currentTime + dur);
  gain.gain.setValueAtTime(0.14, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + dur + 0.01);
}

document.getElementById("btn-audio").addEventListener("click", (e) => {
  const btn = e.target;
  if (!audioRunning) {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const master = audioCtx.createGain();
      master.gain.value = 0.075;
      const filter = audioCtx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 185;
      [36.71, 55.0, 73.42, 110.0].forEach((freq, i) => {
        const osc = audioCtx.createOscillator();
        osc.type = i % 2 === 0 ? "sawtooth" : "triangle";
        osc.frequency.value = freq;
        osc.connect(filter);
        osc.start();
      });
      filter.connect(master);
      master.connect(audioCtx.destination);
    }
    audioCtx.resume();
    audioRunning = true;
    btn.textContent = "Audio: ON";
    btn.classList.add("active");
  } else {
    audioCtx.suspend();
    audioRunning = false;
    btn.textContent = "Audio: OFF";
    btn.classList.remove("active");
  }
});

// ============================================================================
// 8. DOM Event Wiring & Scrivener's Press Export Tools
// ============================================================================

const viewportWrap = document.getElementById("viewport-wrap");

viewportWrap.addEventListener("mousemove", (e) => {
  const rect = mainCanvas.getBoundingClientRect();
  state.pointerX = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
  state.pointerY = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));

  const hotspots = getActiveCanvasHotspots();
  let found = null;
  for (const hs of hotspots) {
    if (Math.hypot(state.pointerX - hs.x, state.pointerY - hs.y) < hs.r) {
      found = hs;
      break;
    }
  }
  state.hoveredHotspot = found;
  viewportWrap.style.cursor = found ? "pointer" : "crosshair";
});

viewportWrap.addEventListener("click", () => {
  if (!state.hoveredHotspot || state.diceRolling) return;
  const id = state.hoveredHotspot.id;
  playSFX(190);

  if (state.screen === "map") {
    const loc = MAP_LOCATIONS.find((l) => l.id === id);
    if (!loc) return;
    state.currentMapId = loc.id;
    setDialogue(`Region // ${loc.type.toUpperCase()}`, loc.name, loc.desc, [
      { label: `Travel to ${loc.name} →`, action: `travel-${loc.id}` }
    ]);
  } else if (state.screen === "town") {
    handleAction(`town-${id}`);
  } else if (state.screen === "camp") {
    if (id === "hearth") handleAction("camp-rest");
    else if (id === "anvil") handleAction("camp-sharpen");
    else if (id === "totem") handleAction("camp-ritual");
  } else if (state.screen === "wild") {
    if (id === "fenwarden") handleAction("fen-warden");
    else if (id === "phantom") handleAction("fen-fight");
  } else if (state.screen === "dungeon") {
    handleAction(id);
  }
});

document.getElementById("game-choices").addEventListener("click", (e) => {
  const btn = e.target.closest(".choice-btn");
  if (!btn || state.diceRolling) return;
  handleAction(btn.dataset.action);
});

document.getElementById("inv-items").addEventListener("click", (e) => {
  const btn = e.target.closest(".inv-item");
  if (!btn || state.diceRolling) return;
  playSFX(210);
  openPackInspector(btn.dataset.item);
});

document.getElementById("btn-open-pack").addEventListener("click", () => {
  if (state.diceRolling) return;
  playSFX(210);
  openPackInspector();
});

// Flesh-Forge & Title Controls
document.getElementById("btn-start-forge").addEventListener("click", () => {
  playSFX(150);
  state.screen = "forge";
  showPanel("forge");
  updateForgeStats();
});

document.getElementById("class-grid").addEventListener("click", (e) => {
  const btn = e.target.closest(".chip-btn");
  if (!btn) return;
  playSFX(180);
  state.clsKey = btn.dataset.class;
  document.getElementById("forge-class-title").textContent = CLASSES[state.clsKey].name;
  document.getElementById("forge-class-lore").textContent = CLASSES[state.clsKey].lore;
  document
    .querySelectorAll("#class-grid .chip-btn")
    .forEach((b) => b.classList.toggle("selected", b === btn));
  updateForgeStats();
});

document.getElementById("omen-grid").addEventListener("click", (e) => {
  const btn = e.target.closest(".chip-btn");
  if (!btn) return;
  playSFX(165);
  state.omenKey = btn.dataset.omen;
  document
    .querySelectorAll("#omen-grid .chip-btn")
    .forEach((b) => b.classList.toggle("selected", b === btn));
  updateForgeStats();
});

document.getElementById("god-grid").addEventListener("click", (e) => {
  const btn = e.target.closest(".chip-btn");
  if (!btn) return;
  playSFX(140);
  state.godKey = btn.dataset.god;
  document.documentElement.style.setProperty("--accent", PANTHEON[state.godKey].hex);
  document
    .querySelectorAll("#god-grid .chip-btn")
    .forEach((b) => b.classList.toggle("selected", b === btn));
});

document.getElementById("btn-reroll-face").addEventListener("click", () => {
  playSFX(200);
  state.seed = Math.floor(10000 + Math.random() * 89999);
  state.faceParams = generateFaceParams(state.seed);
});

function enterPlayableMode() {
  showPanel("game");
  document.getElementById("hud-time").classList.remove("hidden");
  document.getElementById("btn-nav-map").classList.remove("hidden");
  document.getElementById("btn-nav-camp").classList.remove("hidden");
  document.documentElement.style.setProperty("--accent", PANTHEON[state.godKey].hex);
  updateTimeHUD();
  updateHUD();
}

document.getElementById("btn-begin").addEventListener("click", () => {
  playSFX(110, 0.25);
  state.dungeon = null;
  enterPlayableMode();
  openWorldMap();
  saveGame();
});

document.getElementById("btn-nav-map").addEventListener("click", () => {
  playSFX(170);
  openWorldMap();
});

document.getElementById("btn-nav-camp").addEventListener("click", () => {
  playSFX(170);
  openCampScene();
});

// Codex Archive Gallery
document.getElementById("btn-gallery").addEventListener("click", () => {
  playSFX(180);
  if (state.screen === "gallery") {
    state.screen = state.prevScreen;
    showPanel(
      ["map", "town", "camp", "dungeon", "wild", "encounter"].includes(state.screen)
        ? "game"
        : state.screen
    );
  } else {
    state.prevScreen = state.screen;
    state.screen = "gallery";
    showPanel("gallery");
    const info = GALLERY_LORE[state.galleryArt];
    document.getElementById("gal-title").textContent = info.title;
    document.getElementById("gal-lore").textContent = info.lore;
  }
});

document.getElementById("btn-exit-gallery").addEventListener("click", () => {
  playSFX(160);
  state.screen = state.prevScreen;
  showPanel(
    ["map", "town", "camp", "dungeon", "wild", "encounter"].includes(state.screen)
      ? "game"
      : state.screen
  );
});

document.getElementById("panel-gallery").addEventListener("click", (e) => {
  const btn = e.target.closest(".chip-btn");
  if (!btn || !btn.dataset.art) return;
  playSFX(190);
  state.galleryArt = btn.dataset.art;
  const info = GALLERY_LORE[state.galleryArt];
  document.getElementById("gal-title").textContent = info.title;
  document.getElementById("gal-lore").textContent = info.lore;
  document
    .querySelectorAll("#panel-gallery .chip-btn")
    .forEach((b) => b.classList.toggle("selected", b === btn));
});

// Scrivener's Press Toolbar (Sobel Toggle, 9:16 Reels, Transparent PNG, 8s WebM)
document.getElementById("btn-edges").addEventListener("click", (e) => {
  state.edgesEnabled = !state.edgesEnabled;
  e.target.textContent = `Sobel Edges: ${state.edgesEnabled ? "ON" : "OFF"}`;
  e.target.classList.toggle("active", state.edgesEnabled);
});

document.getElementById("btn-aspect").addEventListener("click", (e) => {
  state.verticalMode = !state.verticalMode;
  document.getElementById("main-frame").classList.toggle("vertical-mode", state.verticalMode);
  e.target.classList.toggle("active", state.verticalMode);
  configureDimensions();
});

document.getElementById("btn-merch").addEventListener("click", () => {
  const sc = 3;
  const exp = document.createElement("canvas");
  exp.width = COLS * CELL_W * sc;
  exp.height = ROWS * CELL_H * sc;
  const eCtx = exp.getContext("2d");
  const is3D = !state.viewArtId && ["town", "dungeon", "wild", "camp", "encounter"].includes(state.screen);

  if (is3D) {
    renderPixelsToAscii(getLastWebGLPixels(), COLS, ROWS, true, eCtx, CELL_W * sc, CELL_H * sc, true);
  } else {
    renderPixelsToAscii(
      bCtx.getImageData(0, 0, COLS, ROWS).data,
      COLS,
      ROWS,
      false,
      eCtx,
      CELL_W * sc,
      CELL_H * sc,
      true
    );
  }

  const a = document.createElement("a");
  a.href = exp.toDataURL("image/png");
  a.download = `carkos_woodcut_${state.screen}_${state.seed}.png`;
  a.click();
});

document.getElementById("btn-record").addEventListener("click", (e) => {
  const btn = e.target;
  if (btn.classList.contains("recording")) return;
  if (!mainCanvas.captureStream || typeof MediaRecorder === "undefined") {
    alert("Video recording is supported in Chrome, Edge, and Firefox.");
    return;
  }

  const stream = mainCanvas.captureStream(60);
  const chunks = [];
  const recorder = new MediaRecorder(stream, {
    mimeType: MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
      ? "video/webm;codecs=vp9"
      : "video/webm",
    videoBitsPerSecond: 6000000
  });

  recorder.ondataavailable = (ev) => {
    if (ev.data.size > 0) chunks.push(ev.data);
  };

  recorder.onstop = () => {
    const blob = new Blob(chunks, { type: "video/webm" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `carkos_codex_${state.screen}.webm`;
    a.click();
    URL.revokeObjectURL(url);
    btn.classList.remove("recording");
    btn.textContent = "Record 8s";
  };

  btn.classList.add("recording");
  let secs = 8;
  btn.textContent = `Rec (${secs}s)...`;
  recorder.start();

  const iv = setInterval(() => {
    secs--;
    if (secs > 0) {
      btn.textContent = `Rec (${secs}s)...`;
    } else {
      clearInterval(iv);
      recorder.stop();
    }
  }, 1000);
});

// ============================================================================
// 9. Boot Sequence & Saved Game Resume Injection
// ============================================================================

configureCombat({
  setDialogue,
  updateHUD,
  updateNavButtons,
  playSFX
});

configureDungeon({
  setDialogue,
  updateHUD,
  updateTimeHUD,
  updateNavButtons,
  launchPhysicalDice,
  startEncounter,
  openWorldMap
});

if (hasSavedGame()) {
  const titleChoices = document.querySelector("#panel-title .choices");
  if (titleChoices) {
    const resumeBtn = document.createElement("button");
    resumeBtn.className = "choice-btn lvlup";
    resumeBtn.innerHTML = "<span>[↻]</span> Resume Saved Pilgrimage →";
    resumeBtn.addEventListener("click", () => {
      if (loadGame()) {
        playSFX(140, 0.2);
        enterPlayableMode();
        if (state.dungeon) {
          state.screen = "dungeon";
          updateNavButtons();
          renderDungeonRoom();
        } else {
          openWorldMap();
        }
      }
    });
    titleChoices.prepend(resumeBtn);
  }
}

configureDimensions();
loop();