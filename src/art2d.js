// ============================================================================
// THE CARKOS CODEX — 2D Procedural Woodcut Art, Portraits & World Map
// Imports from ./lore.js, ./state.js, ./typography.js, and the asset modules.
// ============================================================================

import { CLASSES, MAP_LOCATIONS, PANTHEON } from "./lore.js";
import { mapLocationPosition, state, syncPeddlerPosition } from "./state.js";
import { RAMP_SEPARATION } from "./typography.js";
import { drawNpcPlate } from "./assets/npcs.js";
import { drawMonsterPlate } from "./assets/monsters.js";
import { drawItemPlate } from "./assets/items.js";
import { drawVesselClassBody } from "./assets/vessels.js";

// ============================================================================
// 1. Full-Detail Close-Up Woodcut Plates (NPCs, Monsters, Relics & Supplies)
// ============================================================================

export function drawDetailedArtwork(ctx, w, h, artId, t) {
  const cx = w * 0.5;
  const cy = h * 0.52;
  const sc = Math.min(w / 100, h / 78);
  const breathe = Math.sin(t * 1.6) * 1.3;
  const [gr, gg, gb] = PANTHEON[state.godKey].rgb.map((v) => Math.floor(v * 255));

  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, w, h);

  // Cursor-reactive chiaroscuro halo
  const bgGrad = ctx.createRadialGradient(state.pointerX * w, state.pointerY * h, 4, cx, cy, w * 0.56);
  bgGrad.addColorStop(0, `rgba(${gr}, ${gg}, ${gb}, 0.45)`);
  bgGrad.addColorStop(0.6, "rgba(35, 32, 28, 0.25)");
  bgGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, w, h);

  ctx.save();
  ctx.translate(cx, cy + breathe);
  ctx.scale(sc, sc);

  if (drawNpcPlate(ctx, artId, t, [gr, gg, gb])) {
  } else if (drawMonsterPlate(ctx, artId, t, [gr, gg, gb])) {
  } else {
    drawItemPlate(ctx, artId, t, [gr, gg, gb]);
  }

  ctx.restore();
}

export function drawWorldMap(ctx, w, h, t) {
  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, w, h);

  const bg = ctx.createRadialGradient(w * 0.5, h * 0.5, 10, w * 0.5, h * 0.5, w * 0.62);
  bg.addColorStop(0, "rgb(52, 46, 40)");
  bg.addColorStop(1, "rgb(6, 5, 5)");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  // Double border & compass rose
  ctx.strokeStyle = "#7a7065";
  ctx.lineWidth = 2;
  ctx.strokeRect(4, 4, w - 8, h - 8);
  ctx.strokeRect(7, 7, w - 14, h - 14);
  const crX = w - 18;
  const crY = 18;
  ctx.beginPath();
  ctx.moveTo(crX, crY - 9);
  ctx.lineTo(crX, crY + 9);
  ctx.moveTo(crX - 9, crY);
  ctx.lineTo(crX + 9, crY);
  ctx.stroke();

  // Northern Osscrown hatched mountain range
  ctx.strokeStyle = "#a69a8b";
  ctx.lineWidth = 2;
  for (let m = 0; m < 6; m++) {
    const mx = w * (0.28 + m * 0.085);
    const my = h * (0.16 + (m % 2) * 0.04);
    ctx.beginPath();
    ctx.moveTo(mx - 12, my + 12);
    ctx.lineTo(mx, my - 10);
    ctx.lineTo(mx + 12, my + 12);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(mx, my - 10);
    ctx.lineTo(mx + 5, my + 12);
    ctx.stroke();
  }

  // Southwest Quicksilver Fen marsh ripples
  ctx.strokeStyle = "#749aa6";
  ctx.lineWidth = 2;
  for (let wv = 0; wv < 5; wv++) {
    const wy = h * (0.64 + wv * 0.045);
    ctx.beginPath();
    ctx.moveTo(w * 0.12, wy);
    ctx.quadraticCurveTo(w * 0.28, wy + Math.sin(t * 2 + wv) * 2.5, w * 0.44, wy);
    ctx.stroke();
  }

  // East Reed-Pipe Woods canopy spires
  ctx.fillStyle = "#628a65";
  for (let tr = 0; tr < 9; tr++) {
    const tx = w * (0.66 + (tr % 3) * 0.08);
    const ty = h * (0.36 + Math.floor(tr / 3) * 0.11);
    ctx.beginPath();
    ctx.moveTo(tx - 3.5, ty + 8);
    ctx.lineTo(tx, ty - 8);
    ctx.lineTo(tx + 3.5, ty + 8);
    ctx.fill();
  }

  // Dotted pilgrim roads
  ctx.strokeStyle = "#c4a874";
  ctx.lineWidth = 2;
  ctx.setLineDash([2, 3]);
  ctx.beginPath();
  ctx.moveTo(w * 0.48, h * 0.28);
  ctx.lineTo(w * 0.24, h * 0.44);
  ctx.lineTo(w * 0.28, h * 0.74);
  ctx.lineTo(w * 0.62, h * 0.68);
  ctx.lineTo(w * 0.76, h * 0.46);
  ctx.lineTo(w * 0.48, h * 0.28);
  ctx.stroke();
  ctx.setLineDash([]);

  // Roaming Masked Peddler. Position lives on state so MAP_LOCATIONS stays static.
  syncPeddlerPosition(t);

  MAP_LOCATIONS.forEach((loc) => {
    const pos = mapLocationPosition(loc);
    const lx = pos.x * w;
    const ly = pos.y * h;
    const isCur = state.currentMapId === loc.id;
    ctx.fillStyle = loc.type === "merchant" ? "#ffe28a" : (isCur ? "#ff554d" : "#f2eadc");
    ctx.beginPath();
    if (loc.type === "dungeon") {
      ctx.rect(lx - 3.8, ly - 3.8, 7.6, 7.6);
    } else {
      ctx.arc(lx, ly, isCur ? 4.8 + Math.sin(t * 5) * 1.1 : 3.8, 0, Math.PI * 2);
    }
    ctx.fill();
  });
}

// ============================================================================
// 3. Expressive Protagonist Portrait (Flesh-Forge + Live Corrupting Mini-HUD)
// ============================================================================

export function drawExpressivePortrait(ctx, w, h, t) {
  const cx = w * 0.5;
  const cy = h * 0.50;
  const sc = Math.min(w / 56, h / 62);
  const p = state.faceParams;
  const curses = state.curses;
  const [gr, gg, gb] = PANTHEON[state.godKey].rgb.map((v) => Math.floor(v * 255));

  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, w, h);

  const bgGrad = ctx.createRadialGradient(cx - 8 * sc, cy - 6 * sc, 2, cx, cy, w * 0.58);
  bgGrad.addColorStop(0, curses.has("brand") ? "rgb(145, 25, 25)" : `rgba(${gr}, ${gg}, ${gb}, 0.42)`);
  bgGrad.addColorStop(0.65, "rgba(28, 25, 22, 0.35)");
  bgGrad.addColorStop(1, "rgb(0, 0, 0)");
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, w, h);

  ctx.save();
  const jx = curses.has("dread") ? (Math.random() - 0.5) * 1.4 : 0;
  ctx.translate(cx + jx * sc, cy + Math.sin(t * 1.7) * 0.55 * sc);
  ctx.scale(sc, sc);

  // Asymmetrical 3/4 cloaked shoulders + bone clasp
  const cloakGrad = ctx.createLinearGradient(-24, 10, 24, 32);
  cloakGrad.addColorStop(0, "#857c70");
  cloakGrad.addColorStop(0.55, "#423c36");
  cloakGrad.addColorStop(1, "#141210");
  ctx.fillStyle = cloakGrad;
  ctx.beginPath();
  ctx.moveTo(-25, 32);
  ctx.quadraticCurveTo(-20, 14, -7, 11);
  ctx.lineTo(6, 13);
  ctx.quadraticCurveTo(18, 16, 23, 32);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#e8e0d2";
  ctx.beginPath();
  ctx.arc(-9, 17, 1.8, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#5e564d";
  ctx.fillRect(-4.5, 6, 9, 9);

  // Head tilt & breathing motion
  ctx.save();
  ctx.rotate(p.tilt + Math.sin(t * 0.9) * 0.02);

  if (p.hairStyle === 1 || p.hairStyle === 3) {
    ctx.fillStyle = "#292420";
    ctx.beginPath();
    ctx.ellipse(0, 1, p.headW + 3.2, p.headH * 1.05, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Cranium & jaw with chiaroscuro lighting
  const skinGrad = ctx.createLinearGradient(-p.headW, -6, p.headW, 8);
  if (curses.has("blight")) {
    skinGrad.addColorStop(0, "#c2d1a3");
    skinGrad.addColorStop(0.55, "#5a6649");
    skinGrad.addColorStop(1, "#141c12");
  } else {
    skinGrad.addColorStop(0, "#f7efe2");
    skinGrad.addColorStop(0.52, "#9c9284");
    skinGrad.addColorStop(1, "#1c1916");
  }
  ctx.fillStyle = skinGrad;
  ctx.beginPath();
  ctx.ellipse(p.poseOffset * 0.25, -2, p.headW, p.headH * 0.85, 0, Math.PI, Math.PI * 2);
  ctx.lineTo(p.jawW + p.poseOffset * 0.4, p.headH * 0.68);
  ctx.quadraticCurveTo(p.poseOffset * 0.4, p.headH * 1.02, -p.jawW + p.poseOffset * 0.3, p.headH * 0.68);
  ctx.closePath();
  ctx.fill();

  // Hollow cheek shadow
  ctx.fillStyle = `rgba(8, 7, 6, ${p.cheekHollow})`;
  ctx.beginPath();
  ctx.ellipse(p.headW * 0.52 + p.poseOffset * 0.3, 3, p.headW * 0.45, p.headH * 0.65, 0.15, 0, Math.PI * 2);
  ctx.fill();

  // Cursor-tracking eyes & furrowed brow
  const lookX = (state.pointerX - 0.5) * 1.4;
  const lookY = (state.pointerY - 0.5) * 1.0;
  const eyeR = curses.has("dread") ? p.eyeSize * 1.45 : p.eyeSize;
  const blink = Math.sin(t * 0.8) > 0.985;

  [-p.eyeSep, p.eyeSep].forEach((baseEx, idx) => {
    const ex = baseEx + p.poseOffset * 0.45;
    const isSquint = idx === 0 && p.squintLeft;
    ctx.fillStyle = "#080706";
    ctx.beginPath();
    ctx.ellipse(ex, p.eyeY, eyeR * 1.35, isSquint ? eyeR * 0.7 : eyeR * 1.15, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "#171412";
    ctx.lineWidth = 2;
    const tiltDir = idx === 0 ? p.browAngle : -p.browAngle;
    ctx.beginPath();
    ctx.moveTo(ex - eyeR * 1.4, p.eyeY - eyeR * 1.2 - tiltDir * 2);
    ctx.lineTo(ex + eyeR * 1.4, p.eyeY - eyeR * 1.2 + tiltDir * 2);
    ctx.stroke();

    if (curses.has("drift")) {
      ctx.strokeStyle = "#c8d6de";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(ex - eyeR, p.eyeY + 0.5);
      ctx.quadraticCurveTo(ex, p.eyeY + 2.0, ex + eyeR, p.eyeY + 0.5);
      ctx.stroke();
    } else if (!blink && !curses.has("dread") && state.omenKey !== "sleepwalker") {
      ctx.fillStyle = "#f2eadc";
      ctx.beginPath();
      ctx.arc(ex + lookX * 0.55, p.eyeY + lookY * 0.45, eyeR * 0.45, 0, Math.PI * 2);
      ctx.fill();
    }
  });

  // Nose bridge
  const nx = p.poseOffset * 0.55 + p.noseOffset * 0.3;
  ctx.strokeStyle = "#141210";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(nx, p.eyeY + 0.5);
  ctx.lineTo(nx - 1.3, p.eyeY + p.noseLen);
  ctx.lineTo(nx + 1.5, p.eyeY + p.noseLen + 0.6);
  ctx.stroke();

  // Mouth & beard
  const mouthY = p.eyeY + p.noseLen + 4.2;
  const mx = p.poseOffset * 0.45;
  if (curses.has("dread")) {
    ctx.fillStyle = "#040303";
    ctx.beginPath();
    ctx.ellipse(mx, mouthY + 1.5, p.mouthW * 0.85, 4.5, 0, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.strokeStyle = "#141210";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(mx - p.mouthW, mouthY);
    ctx.quadraticCurveTo(mx, mouthY + p.mouthSkew, mx + p.mouthW, mouthY - 0.4);
    ctx.stroke();
  }

  if (p.beardStyle > 0) {
    ctx.strokeStyle = "#2e2924";
    ctx.lineWidth = 2;
    const strands = p.beardStyle === 2 ? 7 : 3;
    for (let b = -strands; b <= strands; b += 2) {
      ctx.beginPath();
      ctx.moveTo(mx + b * 1.1, mouthY + 2);
      ctx.lineTo(mx + b * 1.3, mouthY + (p.beardStyle === 2 ? 9 : 6));
      ctx.stroke();
    }
  }

  if (p.hairStyle > 0) {
    ctx.strokeStyle = "#332d28";
    ctx.lineWidth = 2;
    for (let hIdx = -3; hIdx <= 3; hIdx++) {
      ctx.beginPath();
      ctx.moveTo(hIdx * 3.2, -p.headH * 0.8);
      ctx.quadraticCurveTo(hIdx * 4.2, -p.headH * 0.3, hIdx * 4.6, p.hairStyle === 1 ? 8 : -3);
      ctx.stroke();
    }
  }

  if (state.omenKey === "oathbreaker" || p.scarType === 1) {
    ctx.strokeStyle = "#4a1c19";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-p.eyeSep - 2, p.eyeY + 2);
    ctx.lineTo(-p.eyeSep + 1, mouthY + 1);
    ctx.stroke();
  }

  // Class headgear overlays
  const gear = CLASSES[state.clsKey].gear;
  if (gear === "cage_helm") {
    ctx.strokeStyle = "#968c7e";
    ctx.lineWidth = 2;
    for (let bx = -8; bx <= 8; bx += 4) {
      ctx.beginPath();
      ctx.moveTo(bx, -p.headH);
      ctx.lineTo(bx * 0.85, p.headH * 0.8);
      ctx.stroke();
    }
  } else if (gear === "beak_mask") {
    ctx.fillStyle = "#7a8c82";
    ctx.beginPath();
    ctx.moveTo(mx - 5, p.eyeY + 1);
    ctx.lineTo(mx, mouthY + 6);
    ctx.lineTo(mx + 5, p.eyeY + 1);
    ctx.fill();
  } else if (gear === "bandages") {
    ctx.strokeStyle = "#dfd5c7";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-p.headW, -10);
    ctx.lineTo(p.headW, -5);
    ctx.moveTo(-p.headW, 5);
    ctx.lineTo(p.headW, 9);
    ctx.stroke();
  } else if (gear === "tattered_hood") {
    ctx.strokeStyle = "#736960";
    ctx.lineWidth = 2.8;
    ctx.beginPath();
    ctx.moveTo(-p.headW - 3, 18);
    ctx.quadraticCurveTo(-p.headW - 5, -14, 0, -p.headH - 5);
    ctx.quadraticCurveTo(p.headW + 5, -14, p.headW + 3, 18);
    ctx.stroke();
  } else if (gear === "veil_crown") {
    ctx.fillStyle = "#917db0";
    ctx.fillRect(-p.headW, p.eyeY - 2.5, p.headW * 2, 4.5);
  } else if (gear === "bark_crown") {
    ctx.strokeStyle = "#6d9971";
    ctx.lineWidth = 2;
    [-7, -2, 2, 7].forEach((tx, i) => {
      ctx.beginPath();
      ctx.moveTo(tx, -p.headH + 2);
      ctx.lineTo(tx * 1.35, -p.headH - 5 - (i % 2) * 3);
      ctx.stroke();
    });
  }

  // Active flesh-corruption overlays
  if (curses.has("blight")) {
    p.lesions.slice(0, 8).forEach((l) => {
      ctx.fillStyle = "#162413";
      ctx.beginPath();
      ctx.arc(l.x, l.y, l.r, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  if (curses.has("brand") || state.omenKey === "heretic") {
    ctx.strokeStyle = "#ff3b30";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -p.headH * 0.7);
    ctx.lineTo(0, -p.headH * 0.25);
    ctx.moveTo(-3.5, -p.headH * 0.5);
    ctx.lineTo(3.5, -p.headH * 0.5);
    ctx.stroke();
  }

  ctx.restore();
  ctx.restore();
}

// ============================================================================
// 4. Animated Title Screen Cover Emblem (*The Crowned Skull*)
// ============================================================================

export function drawCoverArt(ctx, w, h, t) {
  const cx = w * 0.5;
  const cy = h * 0.48;

  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, w, h);

  const grad = ctx.createRadialGradient(cx, cy - 6, 4, cx, cy, w * 0.45);
  grad.addColorStop(0, "rgb(185, 50, 45)");
  grad.addColorStop(0.5, "rgb(75, 25, 22)");
  grad.addColorStop(1, "rgb(0, 0, 0)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  const r = Math.min(w, h) * 0.24;
  ctx.fillStyle = "#e8e0d2";
  ctx.beginPath();
  ctx.arc(cx, cy, r, Math.PI * 0.85, Math.PI * 2.15);
  ctx.lineTo(cx + r * 0.65, cy + r * 0.95);
  ctx.lineTo(cx - r * 0.65, cy + r * 0.95);
  ctx.closePath();
  ctx.fill();

  // #fbf8f3 is source luminance ~0.974, so non-edge tips clear the 0.97 hotspot gate.
  ctx.strokeStyle = "#fbf8f3";
  ctx.lineWidth = 2;
  for (let a = -2.4; a <= -0.7; a += 0.28) {
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
    ctx.lineTo(cx + Math.cos(a) * (r + 10 + Math.sin(t * 3 + a) * 2), cy + Math.sin(a) * (r + 10));
    ctx.stroke();
  }

  ctx.fillStyle = "#050404";
  ctx.beginPath();
  ctx.ellipse(cx - r * 0.36, cy + r * 0.15, r * 0.23, r * 0.27, -0.15, 0, Math.PI * 2);
  ctx.ellipse(cx + r * 0.36, cy + r * 0.15, r * 0.23, r * 0.27, 0.15, 0, Math.PI * 2);
  ctx.fill();
}

// ============================================================================
// 5. Full-Body Grimdark Woodcut Vessel Plate (Flesh-Forge & Pack Effigy)
// ============================================================================

function luminanceOf(r, g, b) {
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

function compositedGlowLum(r, g, b, alpha) {
  return luminanceOf(
    r * alpha + 4 * (1 - alpha),
    g * alpha + 3 * (1 - alpha),
    b * alpha + 3 * (1 - alpha)
  );
}

function liftToLum(r, g, b, target) {
  const lum = luminanceOf(r, g, b);
  if (lum >= target - 1e-4) return [r, g, b];
  const t = Math.min(1, (target - lum) / Math.max(1e-4, 1 - lum));
  return [r, g, b].map((c) => Math.round(c + (255 - c) * t));
}

function rgbCss(channels) {
  return `rgb(${channels[0]}, ${channels[1]}, ${channels[2]})`;
}

/**
 * The only vessel cloth palette. Forge plates and the 2.5D compositor both
 * call this so patron colours are not re-derived.
 *
 * Brightest patron wash (center stop, alpha 0.30, over #040303). Subject
 * fills are lifted until they sit at least two ramp steps above it, so the
 * silhouette survives wherever the pointer parks the glow.
 */
export function vesselPalette(godKey) {
  const god = PANTHEON[godKey] || PANTHEON.veneratus;
  const [gr, gg, gb] = god.rgb.map((v) => Math.floor(v * 255));
  const halo = compositedGlowLum(gr, gg, gb, 0.30);
  const clothFloor = halo + RAMP_SEPARATION;
  const clothDarkRgb = liftToLum(
    Math.floor(18 + gr * 0.16),
    Math.floor(15 + gg * 0.16),
    Math.floor(15 + gb * 0.16),
    clothFloor
  );
  const clothMidRgb = liftToLum(
    Math.floor(54 + gr * 0.26),
    Math.floor(48 + gg * 0.26),
    Math.floor(44 + gb * 0.26),
    Math.max(clothFloor, luminanceOf(...clothDarkRgb) + RAMP_SEPARATION / 2)
  );
  const parchmentRgb = liftToLum(
    Math.floor(188 + gr * 0.22),
    Math.floor(178 + gg * 0.20),
    Math.floor(156 + gb * 0.18),
    clothFloor
  );
  return {
    clothDark: rgbCss(clothDarkRgb),
    clothMid: rgbCss(clothMidRgb),
    parchment: rgbCss(parchmentRgb),
    godGlow: `rgb(${Math.min(255, gr + 35)}, ${Math.min(255, gg + 35)}, ${Math.min(255, gb + 35)})`,
    gr,
    gg,
    gb
  };
}

export function drawFullBodyVessel(ctx, w, h, t) {
  const isVert = h > w;
  const clsKey = state.clsKey || "penitent";
  const { clothDark, clothMid, parchment, godGlow, gr, gg, gb } = vesselPalette(state.godKey);
  const wpnTier = state.weaponTier || 0;
  const breathe = Math.sin(t * 1.65) * 0.85;
  const sway = Math.sin(t * 1.1) * 1.2;

  // 1. Deep Risograph Pantheon Backdrop
  ctx.fillStyle = "#040303";
  ctx.fillRect(0, 0, w, h);

  const lx = state.pointerX * w;
  const ly = state.pointerY * h;
  const bgGrad = ctx.createRadialGradient(lx, ly, 4, w * 0.56, h * 0.48, Math.max(w, h) * 0.65);
  bgGrad.addColorStop(0, `rgba(${gr}, ${gg}, ${gb}, 0.30)`);
  bgGrad.addColorStop(0.55, `rgba(${Math.floor(gr * 0.42)}, ${Math.floor(gg * 0.36)}, ${Math.floor(gb * 0.36)}, 0.32)`);
  bgGrad.addColorStop(1, "rgba(4, 3, 3, 0.96)");
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, w, h);

  // Gritty hatched ground horizon
  const groundY = h * 0.87;
  ctx.fillStyle = "rgba(6, 5, 5, 0.85)";
  ctx.fillRect(0, groundY, w, h - groundY);
  ctx.strokeStyle = `rgba(${Math.floor(120 + gr * 0.3)}, ${Math.floor(110 + gg * 0.3)}, ${Math.floor(98 + gb * 0.3)}, 0.55)`;
  ctx.lineWidth = 2;
  for (let gx = 4; gx < w; gx += 4) {
    const hLen = 1.5 + ((gx * 17) % 5);
    ctx.beginPath();
    ctx.moveTo(gx, groundY);
    ctx.lineTo(gx - 2, groundY + hLen);
    ctx.stroke();
  }

  // 2. Full-Body Class Sculpture
  const figX = isVert ? w * 0.54 : w * 0.60;
  const figY = isVert ? h * 0.56 : h * 0.52;
  const sc = isVert ? Math.min(w / 68, h / 82) : Math.min(w / 106, h / 76);

  ctx.save();
  ctx.translate(figX, figY + breathe * sc * 0.45);
  ctx.scale(sc, sc);

  // Cast shadow under feet
  ctx.fillStyle = "#040303";
  ctx.beginPath();
  ctx.ellipse(0, 29, 19, 3.8, 0, 0, Math.PI * 2);
  ctx.fill();

  drawVesselClassBody(ctx, clsKey, { clothDark, clothMid, parchment, godGlow, gr, gg, gb }, t, wpnTier);


  ctx.restore();

  // 3. Framed Procedural Portrait Inset (Top-Left, *Blind Orphan* Grimoire Layout)
  const fw = isVert ? Math.floor(w * 0.34) : Math.floor(w * 0.24);
  const fh = Math.floor(fw * 1.15);
  const fx = Math.floor(w * 0.05);
  const fy = Math.floor(h * 0.06);

  ctx.fillStyle = "#040303";
  ctx.fillRect(fx - 2, fy - 2, fw + 4, fh + 4);
  ctx.strokeStyle = "#e3dccf";
  ctx.lineWidth = 2;
  ctx.strokeRect(fx - 1.5, fy - 1.5, fw + 3, fh + 3);

  ctx.fillStyle = "#f2eadc";
  [
    [fx - 1.5, fy - 1.5],
    [fx + fw + 1.5, fy - 1.5],
    [fx - 1.5, fy + fh + 1.5],
    [fx + fw + 1.5, fy + fh + 1.5]
  ].forEach(([rx, ry]) => {
    ctx.fillRect(rx - 1, ry - 1, 2, 2);
  });

  ctx.save();
  ctx.beginPath();
  ctx.rect(fx, fy, fw, fh);
  ctx.clip();
  ctx.translate(fx, fy);
  drawExpressivePortrait(ctx, fw, fh, t);
  ctx.restore();
}