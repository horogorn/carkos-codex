// ============================================================================
// THE CARKOS CODEX — 2.5D compositor
// WebGL paints environments only. This module blits that frame, then stamps
// woodcut plates (vessels, NPCs, monsters) as cards: integer-cell parallax,
// contact shadow, 1px rim, 2px keyline, front fog from the GL alpha, and a
// short hit flash. The ASCII rasterizer in main.js is unchanged.
//
// Imports: ./state.js, ./art2d.js, ./typography.js, ./assets/*.js.
// Does not import shaders.js (main.js passes the depth uniform in).
// ============================================================================

import { state } from "./state.js";
import { vesselPalette } from "./art2d.js";
import { HOTSPOT_LUM } from "./typography.js";
import { drawVesselClassBody } from "./assets/vessels.js";
import { drawNpcPlate } from "./assets/npcs.js";
import { drawMonsterPlate } from "./assets/monsters.js";

const PARALLAX_AMPLITUDE = 2.25;
const GLYPH_HOLD_LUM = 0.042;
const FOG_CAP = 0.35;
const FLASH_ALPHA = 0.55;
const FLASH_FRAMES = 6;
const FLASH_LUM_CAP = Math.min(0.9, HOTSPOT_LUM);
const DETAIL_SCALE = 0.72;
const FEET_LOCAL = 30;
const BUST_IDS = new Set(["exile", "fenwarden", "frogknight"]);
const TORCH_WORLD = [-0.62, -0.78, -1.55];
const WARM = [255, 207, 112];

let layerCanvas = null;
let layerCtx = null;
let plateCanvas = null;
let plateCtx = null;
let blitImage = null;
let blitW = 0;
let blitH = 0;
let fogT = null;
let heldPlate = null;
let heldKey = "";
let flashLeft = 0;
let flashStrength = 0;
let lastPulse = 0;
let flashHold = null;

function ensureBuffers(w, h) {
  if (layerCanvas && blitW === w && blitH === h) return;
  layerCanvas = document.createElement("canvas");
  layerCanvas.width = w;
  layerCanvas.height = h;
  layerCtx = layerCanvas.getContext("2d", { willReadFrequently: true });
  plateCanvas = document.createElement("canvas");
  plateCanvas.width = w;
  plateCanvas.height = h;
  plateCtx = plateCanvas.getContext("2d", { willReadFrequently: true });
  blitImage = new ImageData(w, h);
  fogT = new Uint8Array(w * h);
  heldPlate = null;
  heldKey = "";
  blitW = w;
  blitH = h;
  layerCtx.imageSmoothingEnabled = false;
  plateCtx.imageSmoothingEnabled = false;
}

function sub(a, b) {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}

function dot(a, b) {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

function cross(a, b) {
  return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
}

function normalize(v) {
  const l = Math.hypot(v[0], v[1], v[2]) || 1;
  return [v[0] / l, v[1] / l, v[2] / l];
}

function floorYFor(envCode) {
  if (envCode > 3.5 && envCode < 5.5) return -1.62;
  if (envCode > 2.5 && envCode < 3.5) return -1.55;
  return -1.65;
}

/** Matches the raymarch camera in shaders.js, including its sway terms. */
export function cameraPose(envCode, time) {
  const combat = envCode > 5.5;
  if (combat) {
    return {
      ro: [-0.45 + Math.sin(time * 0.35) * 0.08, -0.58 + Math.cos(time * 0.4) * 0.04, -3.75],
      look: [0.15, 0.05, 0.8],
      floorY: -1.65,
      fogK: 0.026,
      combat: true
    };
  }
  return {
    ro: [Math.sin(time * 0.22) * 0.2, -0.05 + Math.cos(time * 0.3) * 0.05, -4.35],
    look: [0, -0.08, 0],
    floorY: floorYFor(envCode),
    fogK: 0.018,
    combat: false
  };
}

function cameraBasis(pose) {
  const f = normalize(sub(pose.look, pose.ro));
  const r = normalize(cross([0, 1, 0], f));
  const u = cross(f, r);
  return { f, r, u };
}

function rayThrough(pose, col, row, cols, rows) {
  const glX = col + 0.5;
  const glY = rows - 1 - row + 0.5;
  const uvx = (glX - 0.5 * cols) / rows;
  const uvy = (glY - 0.5 * rows) / rows;
  const { f, r, u } = cameraBasis(pose);
  return normalize([
    f[0] * 1.18 + uvx * r[0] + uvy * u[0],
    f[1] * 1.18 + uvx * r[1] + uvy * u[1],
    f[2] * 1.18 + uvx * r[2] + uvy * u[2]
  ]);
}

function floorHitZ(pose, col, row, cols, rows) {
  const rd = rayThrough(pose, col, row, cols, rows);
  if (rd[1] >= -1e-4) return pose.ro[2] + 4;
  const t = (pose.floorY - pose.ro[1]) / rd[1];
  if (t < 0) return pose.ro[2] + 4;
  return pose.ro[2] + rd[2] * t;
}

function projectWorld(pose, p, cols, rows) {
  const { f, r, u } = cameraBasis(pose);
  const d = sub(p, pose.ro);
  const dz = dot(d, f);
  if (dz <= 0.05) return null;
  const uvx = (1.18 * dot(d, r)) / dz;
  const uvy = (1.18 * dot(d, u)) / dz;
  const glX = uvx * rows + 0.5 * cols;
  const glY = uvy * rows + 0.5 * rows;
  const col = glX - 0.5;
  const row = rows - (glY - 0.5) - 1;
  return { x: col, y: row };
}

function poseWithoutSway(envCode, time) {
  const live = cameraPose(envCode, time);
  if (live.combat) return { ...live, ro: [-0.45, -0.58, -3.75] };
  return { ...live, ro: [0, -0.05, -4.35] };
}

/** Screen shift of the floor point under the feet, so the card tracks the camera. */
function swayCells(envCode, time, cols, rows, col, row) {
  const still = poseWithoutSway(envCode, time);
  const live = cameraPose(envCode, time);
  const rd = rayThrough(still, col, row, cols, rows);
  if (rd[1] >= -1e-4) return { x: 0, y: 0 };
  const t = (still.floorY - still.ro[1]) / rd[1];
  if (t < 0) return { x: 0, y: 0 };
  const p = [still.ro[0] + rd[0] * t, still.floorY, still.ro[2] + rd[2] * t];
  const a = projectWorld(still, p, cols, rows);
  const b = projectWorld(live, p, cols, rows);
  if (!a || !b) return { x: 0, y: 0 };
  return { x: b.x - a.x, y: b.y - a.y };
}

function leviathanFraction(cols, rows) {
  const vert = rows > cols;
  if (vert) return { x: 0.5, y: 0.72, scale: DETAIL_SCALE };
  const half = (95 * DETAIL_SCALE) / 2;
  const x = Math.max(0.62, (cols - half - 1) / cols);
  return { x, y: 0.48, scale: DETAIL_SCALE };
}

function buildPlates(screen, cols, rows) {
  const vert = rows > cols;
  const palette = vesselPalette(state.godKey);
  const godRgb = [palette.gr, palette.gg, palette.gb];
  const plates = [];
  const clsKey = state.clsKey || "penitent";
  const wpnTier = state.weaponTier || 0;

  if (screen === "camp") {
    const place = vert
      ? { x: 0.34, y: 0.64, scale: 0.58 }
      : { x: 0.3, y: 0.63, scale: 0.78 };
    plates.push({
      id: "vessel",
      ...place,
      depth: 1,
      flipX: false,
      sway: true,
      envCode: state.dungeon ? 5 : 4,
      light: { fx: 0.54, fy: 0.7, rgb: WARM },
      bust: false,
      hit: false,
      draw(ctx) {
        drawVesselClassBody(ctx, clsKey, palette, state.time, wpnTier);
      }
    });
  } else if (screen === "encounter" && state.encounter) {
    const mon = vert
      ? { x: 0.64, y: 0.46, scale: 0.52 }
      : { x: 0.66, y: 0.48, scale: 0.85 };
    const hero = vert
      ? { x: 0.26, y: 0.66, scale: 0.62 }
      : { x: 0.24, y: 0.66, scale: 0.92 };
    const artId = state.encounter.artId;
    plates.push({
      id: artId,
      ...mon,
      depth: 0.85,
      flipX: false,
      sway: true,
      envCode: 6,
      light: { pointer: true, rgb: WARM },
      bust: BUST_IDS.has(artId),
      hit: true,
      draw(ctx) {
        drawMonsterPlate(ctx, artId, state.time, godRgb);
      }
    });
    plates.push({
      id: "hero",
      ...hero,
      depth: 1.18,
      flipX: true,
      sway: true,
      envCode: 6,
      light: { pointer: true, rgb: WARM },
      bust: false,
      hit: false,
      torch: true,
      draw(ctx) {
        drawVesselClassBody(ctx, clsKey, palette, state.time, wpnTier);
      }
    });
  } else if (screen === "wild") {
    const lev = leviathanFraction(cols, rows);
    const warden = vert
      ? { x: 0.5, y: 0.28, scale: DETAIL_SCALE }
      : { x: 0.24, y: 0.58, scale: DETAIL_SCALE };
    plates.push({
      id: "mirevisage",
      ...lev,
      depth: 0.78,
      flipX: false,
      sway: true,
      envCode: 3,
      light: { pointer: true, rgb: [palette.gr, palette.gg, palette.gb] },
      bust: false,
      hit: false,
      draw(ctx) {
        drawMonsterPlate(ctx, "mirevisage", state.time, godRgb);
      }
    });
    plates.push({
      id: "fenwarden",
      ...warden,
      depth: 0.92,
      flipX: false,
      sway: true,
      envCode: 3,
      light: { pointer: true, rgb: [palette.gr, palette.gg, palette.gb] },
      bust: true,
      hit: false,
      draw(ctx) {
        drawNpcPlate(ctx, "fenwarden", state.time, godRgb);
      }
    });
  } else if (screen === "dungeon" && state.dungeon) {
    const room = state.dungeon.rooms[state.dungeon.currentRoomId];
    if (room && !room.cleared) {
      if (room.type === "wandering") {
        plates.push({
          id: "frogknight",
          x: 0.5,
          y: 0.56,
          scale: DETAIL_SCALE,
          depth: 0.82,
          flipX: false,
          sway: true,
          envCode: 1,
          light: { pointer: true, rgb: WARM },
          bust: true,
          hit: false,
          draw(ctx) {
            drawNpcPlate(ctx, "frogknight", state.time, godRgb);
          }
        });
      } else if (room.type === "combat" || room.type === "boss") {
        const tier2 = state.dungeon.tier === 2;
        const artId = tier2 ? "marionette" : "exile";
        const scale = room.type === "boss" ? (vert ? 0.78 : 0.84) : DETAIL_SCALE;
        plates.push({
          id: artId,
          x: 0.5,
          y: 0.52,
          scale,
          depth: 0.8,
          flipX: false,
          sway: true,
          envCode: 1,
          light: { pointer: true, rgb: WARM },
          bust: BUST_IDS.has(artId),
          hit: false,
          draw(ctx) {
            drawMonsterPlate(ctx, artId, state.time, godRgb);
          }
        });
      }
    }
  }

  plates.sort((a, b) => a.depth - b.depth);
  return plates;
}

/** Click anchors for plates whose screen position is not the old hotspot. */
export function fenPlateFractions(cols, rows) {
  const plates = buildPlates("wild", cols, rows);
  const out = {};
  for (const plate of plates) out[plate.id] = { x: plate.x, y: plate.y };
  return out;
}

function lightOf(plate, cols, rows) {
  if (plate.light.pointer) {
    return { x: state.pointerX * cols, y: state.pointerY * rows, rgb: plate.light.rgb };
  }
  return { x: plate.light.fx * cols, y: plate.light.fy * rows, rgb: plate.light.rgb };
}

function placePlate(plate, cols, rows) {
  const parallaxX = (state.pointerX - 0.5) * 2 * PARALLAX_AMPLITUDE * plate.depth;
  const parallaxY = (state.pointerY - 0.5) * 2 * PARALLAX_AMPLITUDE * plate.depth;
  const anchorX = Math.round(plate.x * cols);
  const anchorY = Math.round(plate.y * rows);
  let sway = { x: 0, y: 0 };
  if (plate.sway) {
    sway = swayCells(plate.envCode, state.time, cols, rows, anchorX, anchorY + FEET_LOCAL * plate.scale);
  }
  return {
    x: anchorX + Math.round(parallaxX) + Math.round(sway.x),
    y: anchorY + Math.round(parallaxY) + Math.round(sway.y)
  };
}

/**
 * Farthest plate's floor depth. shaders.js writes front transmittance up to
 * this z into the framebuffer alpha. Town and other empty scenes use 0.
 */
export function referenceEntityZ(envCode, cols, rows) {
  const plates = buildPlates(state.screen, cols, rows);
  if (!plates.length) return 0;
  const pose = cameraPose(envCode, state.time);
  let farthest = -1e9;
  for (const plate of plates) {
    const at = placePlate(plate, cols, rows);
    const feetRow = at.y + FEET_LOCAL * plate.scale;
    const z = floorHitZ(pose, at.x, feetRow, cols, rows);
    if (z > farthest) farthest = z;
  }
  return Number.isFinite(farthest) ? farthest : 0;
}

export function blitWebGLTo2D(glPixels, ctx, w, h) {
  ensureBuffers(w, h);
  const dst = blitImage.data;
  const src = glPixels;
  for (let y = 0; y < h; y++) {
    const srcRow = (h - 1 - y) * w * 4;
    const dstRow = y * w * 4;
    for (let x = 0; x < w; x++) {
      const s = srcRow + x * 4;
      const d = dstRow + x * 4;
      dst[d] = src[s];
      dst[d + 1] = src[s + 1];
      dst[d + 2] = src[s + 2];
      dst[d + 3] = 255;
      fogT[y * w + x] = src[s + 3];
    }
  }
  ctx.putImageData(blitImage, 0, 0);
}

function sourceOverPixel(dst, di, sr, sg, sb, sa) {
  if (sa <= 0) return;
  const s = sa / 255;
  const da = dst[di + 3] / 255;
  const outA = s + da * (1 - s);
  if (outA <= 1e-4) return;
  dst[di] = (sr * s + dst[di] * da * (1 - s)) / outA;
  dst[di + 1] = (sg * s + dst[di + 1] * da * (1 - s)) / outA;
  dst[di + 2] = (sb * s + dst[di + 2] * da * (1 - s)) / outA;
  dst[di + 3] = outA * 255;
}

function alphaBounds(data, w, h) {
  let minX = w;
  let minY = h;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (data[(y * w + x) * 4 + 3] > 16) {
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < 0) return null;
  return { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1, r: maxX, b: maxY };
}

function capChannels(r, g, b) {
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  if (lum <= FLASH_LUM_CAP) return [r, g, b];
  const s = FLASH_LUM_CAP / lum;
  return [r * s, g * s, b * s];
}

function processPlatePixels(img, plate, pose, zRef, fogScale) {
  const { width: w, height: h, data } = img;
  const bounds = alphaBounds(data, w, h);
  if (!bounds) return null;

  if (plate.bust) {
    const feather = Math.max(1, 10 * plate.scale);
    const start = bounds.b - feather;
    for (let y = Math.max(0, Math.floor(start)); y <= bounds.b; y++) {
      const fade = Math.max(0, Math.min(1, (bounds.b - y) / feather));
      const keep = fade * fade * (3 - 2 * fade);
      for (let x = bounds.x; x <= bounds.r; x++) {
        const a = (y * w + x) * 4 + 3;
        data[a] *= keep;
      }
    }
  }

  const roZ = pose.ro[2];
  const denom = zRef - roZ;
  const feetRow = bounds.b;
  const feetCol = bounds.x + bounds.w * 0.5;
  const zPlate = floorHitZ(pose, feetCol, feetRow, w, h);
  const ratio = Math.abs(denom) < 1e-3 ? 1 : (zPlate - roZ) / denom;
  const power = ratio * ratio;

  const flash = plate.hit ? consumeFlash() : 0;
  const flashA = flash > 0.01 ? FLASH_ALPHA * Math.min(1, flash) : 0;

  for (let y = bounds.y; y <= bounds.b; y++) {
    for (let x = bounds.x; x <= bounds.r; x++) {
      const i = (y * w + x) * 4;
      const a = data[i + 3];
      if (a < 8) continue;
      const tRef = Math.max(fogT[y * w + x] / 255, 1e-4);
      const transmit = Math.pow(tRef, power);
      let fogA = Math.min(FOG_CAP, (1 - transmit) * 0.6);
      if (fogScale !== 1) fogA = Math.min(FOG_CAP, fogA * fogScale);
      if (fogA > 0.001) {
        data[i] = data[i] * (1 - fogA) + 4 * fogA;
        data[i + 1] = data[i + 1] * (1 - fogA) + 3 * fogA;
        data[i + 2] = data[i + 2] * (1 - fogA) + 3 * fogA;
      }
      if (flashA > 0) {
        let r = data[i] * (1 - flashA) + 184 * flashA;
        let g = data[i + 1] * (1 - flashA) + 50 * flashA;
        let b = data[i + 2] * (1 - flashA) + 45 * flashA;
        [r, g, b] = capChannels(r, g, b);
        data[i] = r;
        data[i + 1] = g;
        data[i + 2] = b;
      }
    }
  }
  return { bounds, zPlate };
}

let flashRead = 0;

function consumeFlash() {
  return flashRead;
}

function beginFrameFlash() {
  if (flashHold != null) {
    flashRead = flashHold;
    return;
  }
  if (state.combatPulse > lastPulse + 0.25) {
    flashLeft = FLASH_FRAMES;
    flashStrength = Math.min(1, state.combatPulse);
  }
  lastPulse = state.combatPulse;
  if (flashLeft <= 0) {
    flashRead = 0;
    return;
  }
  flashRead = flashStrength;
  flashLeft -= 1;
}

function stampKeylineAndPlate(layerImg, plateImg, bounds) {
  const w = layerImg.width;
  const h = layerImg.height;
  const src = plateImg.data;
  const dst = layerImg.data;
  const radius = 2;
  for (let y = Math.max(0, bounds.y - radius); y <= Math.min(h - 1, bounds.b + radius); y++) {
    for (let x = Math.max(0, bounds.x - radius); x <= Math.min(w - 1, bounds.r + radius); x++) {
      let cover = 0;
      for (let dy = -radius; dy <= radius && cover === 0; dy++) {
        const yy = y + dy;
        if (yy < 0 || yy >= h) continue;
        for (let dx = -radius; dx <= radius; dx++) {
          if (dx * dx + dy * dy > radius * radius) continue;
          const xx = x + dx;
          if (xx < 0 || xx >= w) continue;
          if (src[(yy * w + xx) * 4 + 3] > 24) {
            cover = 1;
            break;
          }
        }
      }
      if (!cover) continue;
      if (src[(y * w + x) * 4 + 3] > 24) continue;
      sourceOverPixel(dst, (y * w + x) * 4, 4, 3, 3, 128);
    }
  }
  for (let y = bounds.y; y <= bounds.b; y++) {
    for (let x = bounds.x; x <= bounds.r; x++) {
      const i = (y * w + x) * 4;
      sourceOverPixel(dst, i, src[i], src[i + 1], src[i + 2], src[i + 3]);
    }
  }
}

function stampRim(layerImg, plateImg, bounds, sx, sy, rgb) {
  const w = layerImg.width;
  const h = layerImg.height;
  const src = plateImg.data;
  const dst = layerImg.data;
  const y0 = Math.max(0, bounds.y - 1);
  const y1 = Math.min(h - 1, bounds.b + 1);
  const x0 = Math.max(0, bounds.x - 1);
  const x1 = Math.min(w - 1, bounds.r + 1);
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const ox = x - sx;
      const oy = y - sy;
      if (ox < 0 || oy < 0 || ox >= w || oy >= h) continue;
      const aShift = src[(oy * w + ox) * 4 + 3];
      const aHere = src[(y * w + x) * 4 + 3];
      if (aShift > 24 && aHere < 16) {
        sourceOverPixel(dst, (y * w + x) * 4, rgb[0], rgb[1], rgb[2], Math.min(255, aShift));
      }
    }
  }
}

function drawGrounding(ctx, bounds, light) {
  const feetX = bounds.x + bounds.w * 0.5;
  const feetY = bounds.b;
  const plateW = bounds.w;
  const dx = light.x - feetX;
  const shift = Math.max(-plateW * 0.22, Math.min(plateW * 0.22, -dx * 0.18));
  ctx.save();
  ctx.globalCompositeOperation = "source-over";
  ctx.fillStyle = "rgba(4, 3, 3, 0.35)";
  ctx.beginPath();
  ctx.ellipse(feetX, feetY, plateW * 0.48, plateW * 0.14, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(3, 2, 2, 0.85)";
  ctx.beginPath();
  ctx.ellipse(feetX + shift, feetY, plateW * 0.55 * 0.5, plateW * 0.12 * 0.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function applyGlyphHold(img, key) {
  const data = img.data;
  if (!heldPlate || heldKey !== key || heldPlate.length !== data.length) {
    heldPlate = new Uint8ClampedArray(data);
    heldKey = key;
    return;
  }
  for (let i = 0; i < data.length; i += 4) {
    const a = data[i + 3];
    const ha = heldPlate[i + 3];
    if (a < 8 || ha < 8) {
      heldPlate[i] = data[i];
      heldPlate[i + 1] = data[i + 1];
      heldPlate[i + 2] = data[i + 2];
      heldPlate[i + 3] = data[i + 3];
      continue;
    }
    const lum = (0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]) / 255;
    const prev = (0.299 * heldPlate[i] + 0.587 * heldPlate[i + 1] + 0.114 * heldPlate[i + 2]) / 255;
    if (Math.abs(lum - prev) < GLYPH_HOLD_LUM) {
      data[i] = heldPlate[i];
      data[i + 1] = heldPlate[i + 1];
      data[i + 2] = heldPlate[i + 2];
      data[i + 3] = heldPlate[i + 3];
    } else {
      heldPlate[i] = data[i];
      heldPlate[i + 1] = data[i + 1];
      heldPlate[i + 2] = data[i + 2];
      heldPlate[i + 3] = data[i + 3];
    }
  }
}

function drawTorch(ctx, cols, rows) {
  const pose = cameraPose(6, state.time);
  const flickerWorld = Math.sin(state.time * 14) * 0.02;
  const projected = projectWorld(
    pose,
    [TORCH_WORLD[0], TORCH_WORLD[1] + flickerWorld, TORCH_WORLD[2]],
    cols,
    rows
  );
  const x = Math.round(projected ? projected.x : cols * 0.35);
  const y = Math.round(projected ? projected.y : rows * 0.77);
  ctx.save();
  ctx.globalCompositeOperation = "source-over";
  const glow = ctx.createRadialGradient(x, y, 0.4, x, y, 5.5);
  glow.addColorStop(0, "rgba(255, 207, 112, 0.95)");
  glow.addColorStop(0.5, "rgba(210, 110, 40, 0.28)");
  glow.addColorStop(1, "rgba(210, 110, 40, 0)");
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(x, y, 5.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#ffcf70";
  ctx.beginPath();
  ctx.ellipse(x, y, 1.5, 3.1, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#fff1c4";
  ctx.beginPath();
  ctx.ellipse(x, y + 0.6, 0.7, 1.4, 0, 0, Math.PI * 2);
  ctx.fill();
  for (let i = 0; i < 12; i++) {
    const life = (state.time * 0.35 + i * 0.083) % 1;
    const sx = Math.round(x + Math.sin(i * 2.399 + state.time * 1.7) * (1.1 + life * 3.2));
    const sy = Math.round(y - 2 - life * 10);
    const a = (1 - life) * 0.75;
    ctx.fillStyle = `rgba(255, ${176 + (i % 3) * 18}, 96, ${a.toFixed(3)})`;
    ctx.fillRect(sx, sy, 1, 1);
  }
  ctx.restore();
}

/** Keep a hit flash up for still-frame captures (`?shot=enc0hit`). */
export function setHitFlashHold(strength) {
  flashHold = strength == null ? null : Math.max(0, Math.min(1, strength));
}

export function composite25DEntities(ctx, w, h, screen, t) {
  ensureBuffers(w, h);
  beginFrameFlash();
  const plates = buildPlates(screen, w, h);
  layerCtx.clearRect(0, 0, w, h);
  if (!plates.length) return;

  const envCode = plates[0].envCode;
  const pose = cameraPose(envCode, t);
  const zRef = referenceEntityZ(envCode, w, h);
  const fogScale = screen === "encounter" ? 1 + 0.5 * state.combatPulse : 1;
  let torch = false;

  for (const plate of plates) {
    const at = placePlate(plate, w, h);
    const light = lightOf(plate, w, h);
    plateCtx.setTransform(1, 0, 0, 1, 0, 0);
    plateCtx.globalCompositeOperation = "source-over";
    plateCtx.globalAlpha = 1;
    plateCtx.clearRect(0, 0, w, h);
    plateCtx.save();
    plateCtx.translate(at.x, at.y);
    plateCtx.scale(plate.flipX ? -plate.scale : plate.scale, plate.scale);
    plate.draw(plateCtx);
    plateCtx.restore();

    const img = plateCtx.getImageData(0, 0, w, h);
    const processed = processPlatePixels(img, plate, pose, zRef, fogScale);
    if (!processed) continue;
    plateCtx.putImageData(img, 0, 0);

    if (plate.bust) drawGrounding(layerCtx, processed.bounds, light);
    else {
      const feetX = processed.bounds.x + processed.bounds.w * 0.5;
      const feetY = processed.bounds.b;
      const plateW = processed.bounds.w;
      const dx = light.x - feetX;
      const shift = Math.max(-plateW * 0.22, Math.min(plateW * 0.22, -dx * 0.18));
      layerCtx.save();
      layerCtx.fillStyle = "rgba(3, 2, 2, 0.85)";
      layerCtx.beginPath();
      layerCtx.ellipse(feetX + shift, feetY, plateW * 0.55 * 0.5, plateW * 0.12 * 0.5, 0, 0, Math.PI * 2);
      layerCtx.fill();
      layerCtx.restore();
    }

    const layerImg = layerCtx.getImageData(0, 0, w, h);
    stampKeylineAndPlate(layerImg, img, processed.bounds);
    const ldx = light.x - (processed.bounds.x + processed.bounds.w * 0.5);
    const ldy = light.y - (processed.bounds.y + processed.bounds.h * 0.5);
    const llen = Math.hypot(ldx, ldy) || 1;
    let sx = Math.round(ldx / llen);
    let sy = Math.round(ldy / llen);
    if (sx === 0 && sy === 0) sx = ldx >= 0 ? 1 : -1;
    stampRim(layerImg, img, processed.bounds, sx, sy, light.rgb);
    layerCtx.putImageData(layerImg, 0, 0);
    if (plate.torch) torch = true;
  }

  const room = state.dungeon && state.dungeon.rooms[state.dungeon.currentRoomId];
  const holdKey = `${screen}|${w}x${h}|${state.clsKey}|${state.godKey}|${state.encounter ? state.encounter.artId : ""}|${room ? room.type : ""}|${room ? room.cleared : ""}`;
  const held = layerCtx.getImageData(0, 0, w, h);
  applyGlyphHold(held, holdKey);
  layerCtx.putImageData(held, 0, 0);

  if (torch) drawTorch(layerCtx, w, h);

  ctx.save();
  ctx.globalCompositeOperation = "source-over";
  ctx.drawImage(layerCanvas, 0, 0);
  ctx.restore();
}
