// ============================================================================
// THE CARKOS CODEX — 2D Procedural Woodcut Art, Portraits & World Map
// Imports ONLY from ./lore.js and ./state.js.
// ============================================================================

import { CLASSES, MAP_LOCATIONS, PANTHEON } from "./lore.js";
import { state } from "./state.js";

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

  if (artId === "sentinel") {
    const armGrad = ctx.createLinearGradient(-38, 12, 38, 35);
    armGrad.addColorStop(0, "#d9d0c1");
    armGrad.addColorStop(0.5, "#6b635a");
    armGrad.addColorStop(1, "#1a1715");
    ctx.fillStyle = armGrad;
    ctx.beginPath();
    ctx.moveTo(-44, 38);
    ctx.quadraticCurveTo(-34, 12, -14, 10);
    ctx.lineTo(14, 10);
    ctx.quadraticCurveTo(34, 12, 44, 38);
    ctx.closePath();
    ctx.fill();

    // Jagged layered gorget plates
    ctx.strokeStyle = "#171412";
    ctx.lineWidth = 1.6;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.arc(0, 12 + i * 5, 16 + i * 4, 0.2, Math.PI - 0.2);
      ctx.stroke();
    }

    // Fluted pointed iron sallet helm
    const helmGrad = ctx.createLinearGradient(-20, -25, 22, 10);
    helmGrad.addColorStop(0, "#f5ede0");
    helmGrad.addColorStop(0.45, "#9e9588");
    helmGrad.addColorStop(1, "#1f1c19");
    ctx.fillStyle = helmGrad;
    ctx.beginPath();
    ctx.moveTo(0, -34);
    ctx.quadraticCurveTo(18, -22, 20, -4);
    ctx.lineTo(15, 14);
    ctx.lineTo(0, 20);
    ctx.lineTo(-15, 14);
    ctx.lineTo(-20, -4);
    ctx.quadraticCurveTo(-18, -22, 0, -34);
    ctx.closePath();
    ctx.fill();

    // Fluted ridges
    ctx.strokeStyle = "#292520";
    ctx.lineWidth = 1.4;
    [-10, 0, 10].forEach((rx) => {
      ctx.beginPath();
      ctx.moveTo(0, -32);
      ctx.quadraticCurveTo(rx * 1.4, -12, rx, 12);
      ctx.stroke();
    });

    // Recessed visor slit & ember eye
    ctx.fillStyle = "#040303";
    ctx.beginPath();
    ctx.moveTo(-14, -5);
    ctx.lineTo(0, -2);
    ctx.lineTo(14, -5);
    ctx.lineTo(12, 1);
    ctx.lineTo(0, 3);
    ctx.lineTo(-12, 1);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = `rgb(${gr}, ${gg}, ${gb})`;
    ctx.beginPath();
    ctx.arc(-6, -1.5, 1.8 + Math.sin(t * 4) * 0.4, 0, Math.PI * 2);
    ctx.fill();

    // Animated dripping rust-tears
    ctx.strokeStyle = "#6e2620";
    ctx.lineWidth = 1.6;
    [-8, -5, 7].forEach((tx, idx) => {
      const dropLen = 6 + ((t * 5 + idx * 4) % 10);
      ctx.beginPath();
      ctx.moveTo(tx, 1);
      ctx.lineTo(tx, 1 + dropLen);
      ctx.stroke();
    });
  } else if (artId === "frogknight") {
    ctx.fillStyle = "#4d6b53";
    ctx.beginPath();
    ctx.moveTo(-42, 38);
    ctx.quadraticCurveTo(-30, 10, 0, 8);
    ctx.quadraticCurveTo(30, 10, 42, 38);
    ctx.fill();

    const fGrad = ctx.createLinearGradient(-22, -24, 22, 14);
    fGrad.addColorStop(0, "#a8cfa8");
    fGrad.addColorStop(0.55, "#4d6e52");
    fGrad.addColorStop(1, "#162418");
    ctx.fillStyle = fGrad;
    ctx.beginPath();
    ctx.ellipse(0, -6, 22, 17, 0, 0, Math.PI * 2);
    ctx.fill();

    [-11, 11].forEach((ex) => {
      ctx.fillStyle = "#8cb58e";
      ctx.beginPath();
      ctx.arc(ex, -21, 6.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#080a08";
      ctx.fillRect(ex - 4, -22, 8, 2.5);
    });

    ctx.strokeStyle = "#080a08";
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(-16, -2);
    ctx.quadraticCurveTo(0, 5, 16, -2);
    ctx.stroke();
  } else if (artId === "nighthag") {
    ctx.fillStyle = "#2b2629";
    ctx.beginPath();
    ctx.moveTo(-38, 38);
    ctx.quadraticCurveTo(-24, -14, 0, -34);
    ctx.quadraticCurveTo(24, -14, 38, 38);
    ctx.fill();

    ctx.fillStyle = "#e8dfe0";
    ctx.beginPath();
    ctx.ellipse(0, -6, 11, 16, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#080506";
    ctx.beginPath();
    ctx.arc(-4.5, -9, 2.8, 0, Math.PI * 2);
    ctx.arc(4.5, -9, 2.8, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#ff3b30";
    ctx.beginPath();
    ctx.arc(-4.5, -9, 1.0, 0, Math.PI * 2);
    ctx.arc(4.5, -9, 1.0, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "#080506";
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(-7, 2);
    ctx.quadraticCurveTo(0, 9, 7, 2);
    ctx.stroke();
  } else if (artId === "priest") {
    ctx.strokeStyle = `rgb(${gr}, ${gg}, ${gb})`;
    ctx.lineWidth = 1.5;
    for (let a = -Math.PI * 0.9; a <= -Math.PI * 0.1; a += 0.25) {
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * 16, -14 + Math.sin(a) * 16);
      ctx.lineTo(Math.cos(a) * 32, -14 + Math.sin(a) * 32);
      ctx.stroke();
    }

    ctx.fillStyle = "#4d463f";
    ctx.beginPath();
    ctx.moveTo(-40, 38);
    ctx.lineTo(-20, 8);
    ctx.lineTo(20, 8);
    ctx.lineTo(40, 38);
    ctx.fill();

    const mitreGrad = ctx.createLinearGradient(-16, -34, 16, -6);
    mitreGrad.addColorStop(0, "#f5ede0");
    mitreGrad.addColorStop(0.6, "#a69c8e");
    mitreGrad.addColorStop(1, "#332e29");
    ctx.fillStyle = mitreGrad;
    ctx.beginPath();
    ctx.moveTo(0, -37);
    ctx.lineTo(15, -14);
    ctx.lineTo(13, -4);
    ctx.lineTo(-13, -4);
    ctx.lineTo(-15, -14);
    ctx.closePath();
    ctx.fill();

    // Mitre crack & crimson sigil
    ctx.strokeStyle = "#2b2520";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(-4, -30);
    ctx.lineTo(-1, -22);
    ctx.lineTo(-6, -16);
    ctx.stroke();

    ctx.fillStyle = "#b82925";
    ctx.beginPath();
    ctx.arc(0, -18, 3.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#080706";
    ctx.beginPath();
    ctx.ellipse(0, 6, 13, 14, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#d6cfc2";
    ctx.beginPath();
    ctx.ellipse(-7, 9, 3.5, 5, -0.2, 0, Math.PI * 2);
    ctx.ellipse(7, 9, 3.5, 5, 0.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#ff453a";
    ctx.beginPath();
    ctx.arc(-5, 3, 1.8, 0, Math.PI * 2);
    ctx.arc(5, 3, 1.8, 0, Math.PI * 2);
    ctx.fill();
  } else if (artId === "fenwarden") {
    ctx.fillStyle = "#3a4542";
    ctx.beginPath();
    ctx.ellipse(0, -14, 34, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-36, 38);
    ctx.lineTo(-18, 6);
    ctx.lineTo(18, 6);
    ctx.lineTo(36, 38);
    ctx.fill();

    const hoodGrad = ctx.createLinearGradient(-18, -16, 18, 12);
    hoodGrad.addColorStop(0, "#9ab0a6");
    hoodGrad.addColorStop(0.5, "#4d5e57");
    hoodGrad.addColorStop(1, "#18211e");
    ctx.fillStyle = hoodGrad;
    ctx.beginPath();
    ctx.ellipse(0, -2, 17, 19, 0, 0, Math.PI * 2);
    ctx.fill();

    [-7.5, 7.5].forEach((gx) => {
      ctx.fillStyle = "#121715";
      ctx.beginPath();
      ctx.arc(gx, -4, 5.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#d9c282";
      ctx.lineWidth = 1.6;
      ctx.stroke();
      ctx.fillStyle = "#e6f5f0";
      ctx.beginPath();
      ctx.arc(gx - 1.5, -5.5, 1.5, 0, Math.PI * 2);
      ctx.fill();
    });

    const beakGrad = ctx.createLinearGradient(-8, 0, 8, 22);
    beakGrad.addColorStop(0, "#e6d298");
    beakGrad.addColorStop(0.6, "#8c7a4d");
    beakGrad.addColorStop(1, "#2b2416");
    ctx.fillStyle = beakGrad;
    ctx.beginPath();
    ctx.moveTo(-7, 1);
    ctx.quadraticCurveTo(0, 14, 0, 24);
    ctx.quadraticCurveTo(4, 14, 7, 1);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = "rgba(200, 225, 235, 0.55)";
    ctx.lineWidth = 1.3;
    for (let m = -1; m <= 1; m++) {
      ctx.beginPath();
      ctx.moveTo(m * 18 - 10, 22 + m * 4);
      ctx.quadraticCurveTo(Math.sin(t * 2 + m) * 14, 18 + m * 4, m * 18 + 18, 24 + m * 4);
      ctx.stroke();
    }
  } else if (artId === "peddler") {
    ctx.fillStyle = "#474039";
    ctx.beginPath();
    ctx.moveTo(-36, 38);
    ctx.quadraticCurveTo(-24, -10, 0, -30);
    ctx.quadraticCurveTo(24, -10, 36, 38);
    ctx.fill();

    // Hanging iron lantern glow
    const lanGrad = ctx.createRadialGradient(-22, 8, 1, -22, 8, 14);
    lanGrad.addColorStop(0, "#fff2c6");
    lanGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = lanGrad;
    ctx.beginPath();
    ctx.arc(-22, 8, 14, 0, Math.PI * 2);
    ctx.fill();

    const maskGrad = ctx.createLinearGradient(-13, -20, 11, 10);
    maskGrad.addColorStop(0, "#f5ede0");
    maskGrad.addColorStop(0.6, "#aba193");
    maskGrad.addColorStop(1, "#332e29");
    ctx.fillStyle = maskGrad;
    ctx.beginPath();
    ctx.ellipse(-2, -6, 11, 15, -0.08, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#080706";
    ctx.beginPath();
    ctx.arc(-6, -8, 2.3, 0, Math.PI * 2);
    ctx.arc(2, -8, 2.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(-2, 1, 2.5, 1.5, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "#cfc7ba";
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(16, 20);
    ctx.lineTo(8, 2);
    ctx.stroke();
  } else if (artId === "hermit") {
    ctx.strokeStyle = "#7a9e7d";
    ctx.lineWidth = 2.4;
    [-14, -6, 6, 14].forEach((bx, i) => {
      ctx.beginPath();
      ctx.moveTo(bx, -14);
      ctx.quadraticCurveTo(bx * 1.6, -26, bx * 2.1, -34 - (i % 2) * 5);
      ctx.stroke();
    });

    ctx.fillStyle = "#354736";
    ctx.beginPath();
    ctx.moveTo(-40, 38);
    ctx.quadraticCurveTo(-24, 12, 0, 10);
    ctx.quadraticCurveTo(24, 12, 40, 38);
    ctx.fill();

    const barkGrad = ctx.createLinearGradient(-16, -18, 18, 18);
    barkGrad.addColorStop(0, "#c2d4b8");
    barkGrad.addColorStop(0.55, "#63785d");
    barkGrad.addColorStop(1, "#1a2419");
    ctx.fillStyle = barkGrad;
    ctx.beginPath();
    ctx.ellipse(0, 0, 15, 22, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#060806";
    ctx.beginPath();
    ctx.ellipse(0, 6, 3.2, 8.5, 0, 0, Math.PI * 2);
    ctx.fill();
    [-8, 8].forEach((px) => {
      ctx.beginPath();
      ctx.arc(px, 2, 2.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(px * 0.8, 10, 1.8, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.fillStyle = "#c8ffba";
    ctx.fillRect(-8, -7, 4.5, 1.8);
    ctx.fillRect(3.5, -7, 4.5, 1.8);

    ctx.fillStyle = "#e3ffd9";
    for (let s = 0; s < 8; s++) {
      const sy = 6 - ((t * 9 + s * 6) % 34);
      const sx = Math.sin(t * 2.5 + s * 1.7) * 18;
      ctx.beginPath();
      ctx.arc(sx, sy, 1.1, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (artId === "exile") {
    // Bone-Sworn Colossus
    ctx.strokeStyle = "#cfc7ba";
    ctx.lineWidth = 1.6;
    [
      [-26, 4, -40, -18],
      [22, 2, 36, -20],
      [-16, -2, -26, -26]
    ].forEach(([x1, y1, x2, y2]) => {
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    });

    ctx.fillStyle = "#8f4235";
    ctx.beginPath();
    ctx.moveTo(-42, 38);
    ctx.lineTo(-28, 2);
    ctx.lineTo(28, 2);
    ctx.lineTo(42, 38);
    ctx.fill();

    ctx.fillStyle = "#e8dfd1";
    ctx.beginPath();
    ctx.ellipse(-2, -12, 15, 17, -0.18, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "#cfc7ba";
    ctx.lineWidth = 3.2;
    ctx.beginPath();
    ctx.moveTo(-14, -18);
    ctx.quadraticCurveTo(-26, -32, -18, -38);
    ctx.moveTo(10, -20);
    ctx.quadraticCurveTo(22, -34, 14, -40);
    ctx.stroke();

    ctx.fillStyle = "#ff3b30";
    ctx.beginPath();
    ctx.arc(-7, -13, 2.5, 0, Math.PI * 2);
    ctx.arc(3, -14, 2.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#dcd4c6";
    ctx.fillRect(28, -30, 6, 68);
    ctx.fillRect(19, 14, 24, 4);
  } else if (artId === "mirevisage") {
    // Mire-Leviathan
    ctx.strokeStyle = "#9ec4cf";
    ctx.lineWidth = 1.4;
    for (let r = 0; r < 4; r++) {
      const rad = 20 + r * 9 + Math.sin(t * 3 + r) * 2;
      ctx.beginPath();
      ctx.ellipse(0, 28, rad, rad * 0.25, 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.fillStyle = "#485c61";
    ctx.beginPath();
    ctx.moveTo(-14, -4);
    ctx.lineTo(-20, 28);
    ctx.lineTo(20, 28);
    ctx.lineTo(14, -4);
    ctx.fill();

    ctx.fillStyle = "#d2e3e8";
    ctx.beginPath();
    ctx.ellipse(0, -16, 14, 18, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#050708";
    ctx.beginPath();
    ctx.arc(-5, -18, 3.8, 0, Math.PI * 2);
    ctx.arc(5, -18, 3.8, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#ff453a";
    ctx.beginPath();
    ctx.arc(-5, -18, 1.3, 0, Math.PI * 2);
    ctx.arc(5, -18, 1.3, 0, Math.PI * 2);
    ctx.fill();

    const jawY = -1 + Math.sin(t * 2.5) * 1.5;
    ctx.fillStyle = "#b5c9cf";
    ctx.beginPath();
    ctx.ellipse(0, jawY, 8, 5, 0, 0, Math.PI);
    ctx.fill();
  } else if (artId === "marionette") {
    // Pit-Beast of Velkhar
    ctx.fillStyle = "#6e735c";
    ctx.beginPath();
    ctx.ellipse(4, 4, 26, 18, -0.1, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#cfc7ba";
    [-8, 0, 8, 16, 24].forEach((sx, idx) => {
      ctx.beginPath();
      ctx.moveTo(sx - 3, -12);
      ctx.lineTo(sx + 2, -26 - (idx % 2) * 5);
      ctx.lineTo(sx + 5, -10);
      ctx.fill();
    });

    ctx.strokeStyle = "#8c9176";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(-16, 8);
    ctx.lineTo(-24, 38);
    ctx.moveTo(22, 8);
    ctx.lineTo(30, 38);
    ctx.stroke();

    ctx.fillStyle = "#b5baa1";
    ctx.beginPath();
    ctx.ellipse(-18, -2, 13, 12, 0.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#ffe680";
    ctx.beginPath();
    ctx.arc(-23, -3, 2.6, 0, Math.PI * 2);
    ctx.arc(-13, -2, 2.6, 0, Math.PI * 2);
    ctx.fill();
  } else if (artId === "censer") {
    ctx.strokeStyle = "#e6c875";
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(-24, 16);
    ctx.quadraticCurveTo(-4, 18, 12, 4);
    ctx.stroke();

    ctx.fillStyle = "#f2dba0";
    ctx.beginPath();
    ctx.ellipse(14, 0, 8, 10, 0.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#ff5533";
    ctx.beginPath();
    ctx.ellipse(14, -8, 6, 2.5, 0.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "rgba(235, 230, 220, 0.7)";
    ctx.lineWidth = 1.4;
    for (let s = 0; s < 3; s++) {
      const sy = -15 - ((t * 7 + s * 8) % 20);
      ctx.beginPath();
      ctx.arc(14 + Math.sin(t * 3 + s) * 4, sy, 3 + s, 0, Math.PI * 2);
      ctx.stroke();
    }
  } else if (artId === "shard") {
    ctx.strokeStyle = `rgb(${gr}, ${gg}, ${gb})`;
    ctx.lineWidth = 1.4;
    for (let a = 0; a < Math.PI * 2; a += Math.PI / 6) {
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * 14, Math.sin(a) * 14);
      ctx.lineTo(Math.cos(a) * 28, Math.sin(a) * 28);
      ctx.stroke();
    }
    ctx.fillStyle = "#f2eadc";
    ctx.beginPath();
    ctx.moveTo(0, -26);
    ctx.lineTo(13, -4);
    ctx.lineTo(6, 24);
    ctx.lineTo(-9, 18);
    ctx.lineTo(-14, -6);
    ctx.closePath();
    ctx.fill();
  } else if (artId === "moss") {
    ctx.fillStyle = "#48694e";
    ctx.beginPath();
    ctx.ellipse(0, 14, 24, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    [
      [-10, 4, 8],
      [8, 2, 10],
      [0, -6, 12]
    ].forEach(([mx, my, mr]) => {
      ctx.fillStyle = "#b5e6ba";
      ctx.beginPath();
      ctx.arc(mx, my, mr, Math.PI, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#7da882";
      ctx.fillRect(mx - 2, my, 4, 12);
    });
  } else if (artId === "reedbone") {
    ctx.save();
    ctx.rotate(-0.45);
    ctx.fillStyle = "#ebe3d5";
    ctx.fillRect(-28, -4, 56, 8);
    ctx.fillStyle = "#080706";
    [-12, -4, 4, 12, 20].forEach((hx) => {
      ctx.beginPath();
      ctx.arc(hx, 0, 2.0, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();
  } else if (artId === "ration") {
    ctx.fillStyle = "#c9b89c";
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(-18, -11, 36, 22, 5);
    else ctx.rect(-18, -11, 36, 22);
    ctx.fill();
    ctx.strokeStyle = "#4a3f33";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-7, -11);
    ctx.lineTo(-7, 11);
    ctx.moveTo(7, -11);
    ctx.lineTo(7, 11);
    ctx.moveTo(-18, 0);
    ctx.lineTo(18, 0);
    ctx.stroke();
  } else if (artId === "torch") {
    ctx.save();
    ctx.rotate(0.35);
    ctx.fillStyle = "#7a6855";
    ctx.fillRect(-3, -6, 6, 34);
    ctx.fillStyle = "#cfc2ad";
    ctx.fillRect(-5, -14, 10, 10);
    ctx.fillStyle = "#ffcf70";
    ctx.beginPath();
    ctx.arc(0, -20 + Math.sin(t * 10) * 1.5, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  ctx.restore();
}

// ============================================================================
// 2. Cartographic World Map (*The Waking Rind*)
// ============================================================================

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
  ctx.lineWidth = 1.4;
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
  ctx.lineWidth = 1.6;
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
  ctx.lineWidth = 1.3;
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
  ctx.lineWidth = 1.4;
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

  // Roaming Masked Peddler caravan marker
  const peddlerNode = MAP_LOCATIONS.find((n) => n.id === "peddler");
  if (peddlerNode) {
    peddlerNode.x = 0.58 + Math.sin(t * 0.4) * 0.06;
    peddlerNode.y = 0.69 + Math.cos(t * 0.4) * 0.03;
  }

  MAP_LOCATIONS.forEach((loc) => {
    const lx = loc.x * w;
    const ly = loc.y * h;
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
    ctx.lineWidth = 1.6;
    const tiltDir = idx === 0 ? p.browAngle : -p.browAngle;
    ctx.beginPath();
    ctx.moveTo(ex - eyeR * 1.4, p.eyeY - eyeR * 1.2 - tiltDir * 2);
    ctx.lineTo(ex + eyeR * 1.4, p.eyeY - eyeR * 1.2 + tiltDir * 2);
    ctx.stroke();

    if (curses.has("drift")) {
      ctx.strokeStyle = "#c8d6de";
      ctx.lineWidth = 1.0;
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
  ctx.lineWidth = 1.4;
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
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(mx - p.mouthW, mouthY);
    ctx.quadraticCurveTo(mx, mouthY + p.mouthSkew, mx + p.mouthW, mouthY - 0.4);
    ctx.stroke();
  }

  if (p.beardStyle > 0) {
    ctx.strokeStyle = "#2e2924";
    ctx.lineWidth = 1.2;
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
    ctx.lineWidth = 1.4;
    for (let hIdx = -3; hIdx <= 3; hIdx++) {
      ctx.beginPath();
      ctx.moveTo(hIdx * 3.2, -p.headH * 0.8);
      ctx.quadraticCurveTo(hIdx * 4.2, -p.headH * 0.3, hIdx * 4.6, p.hairStyle === 1 ? 8 : -3);
      ctx.stroke();
    }
  }

  if (state.omenKey === "oathbreaker" || p.scarType === 1) {
    ctx.strokeStyle = "#4a1c19";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(-p.eyeSep - 2, p.eyeY + 2);
    ctx.lineTo(-p.eyeSep + 1, mouthY + 1);
    ctx.stroke();
  }

  // Class headgear overlays
  const gear = CLASSES[state.clsKey].gear;
  if (gear === "cage_helm") {
    ctx.strokeStyle = "#968c7e";
    ctx.lineWidth = 1.1;
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
    ctx.lineWidth = 1.8;
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
    ctx.lineWidth = 1.5;
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
    ctx.lineWidth = 1.4;
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

  // Animated sun-mitre crown spikes
  ctx.strokeStyle = "#f2eadc";
  ctx.lineWidth = 1.8;
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

export function drawFullBodyVessel(ctx, w, h, t) {
  const isVert = h > w;
  const clsKey = state.clsKey || "penitent";
  const god = PANTHEON[state.godKey] || PANTHEON.veneratus;
  const [gr, gg, gb] = god.rgb.map((v) => Math.floor(v * 255));
  const wpnTier = state.weaponTier || 0;
  const breathe = Math.sin(t * 1.65) * 0.85;
  const sway = Math.sin(t * 1.1) * 1.2;

  const clothDark = `rgb(${Math.floor(18 + gr * 0.16)}, ${Math.floor(15 + gg * 0.16)}, ${Math.floor(15 + gb * 0.16)})`;
  const clothMid  = `rgb(${Math.floor(54 + gr * 0.26)}, ${Math.floor(48 + gg * 0.26)}, ${Math.floor(44 + gb * 0.26)})`;
  const parchment = `rgb(${Math.floor(188 + gr * 0.22)}, ${Math.floor(178 + gg * 0.20)}, ${Math.floor(156 + gb * 0.18)})`;
  const godGlow   = `rgb(${Math.min(255, gr + 35)}, ${Math.min(255, gg + 35)}, ${Math.min(255, gb + 35)})`;

  // 1. Deep Risograph Pantheon Backdrop
  ctx.fillStyle = "#040303";
  ctx.fillRect(0, 0, w, h);

  const lx = state.pointerX * w;
  const ly = state.pointerY * h;
  const bgGrad = ctx.createRadialGradient(lx, ly, 4, w * 0.56, h * 0.48, Math.max(w, h) * 0.65);
  bgGrad.addColorStop(0, `rgba(${gr}, ${gg}, ${gb}, 0.56)`);
  bgGrad.addColorStop(0.55, `rgba(${Math.floor(gr * 0.42)}, ${Math.floor(gg * 0.36)}, ${Math.floor(gb * 0.36)}, 0.32)`);
  bgGrad.addColorStop(1, "rgba(4, 3, 3, 0.96)");
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, w, h);

  // Gritty hatched ground horizon
  const groundY = h * 0.87;
  ctx.fillStyle = "rgba(6, 5, 5, 0.85)";
  ctx.fillRect(0, groundY, w, h - groundY);
  ctx.strokeStyle = `rgba(${Math.floor(120 + gr * 0.3)}, ${Math.floor(110 + gg * 0.3)}, ${Math.floor(98 + gb * 0.3)}, 0.55)`;
  ctx.lineWidth = 1.0;
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

  if (clsKey === "penitent") {
    // --- MARROW-PENITENT ---
    ctx.strokeStyle = "#161311";
    ctx.lineWidth = 3.2;
    ctx.beginPath();
    ctx.moveTo(-4, 8); ctx.lineTo(-6, 20); ctx.lineTo(-4, 28); ctx.lineTo(-10, 29);
    ctx.moveTo(5, 8);  ctx.lineTo(9, 19);  ctx.lineTo(13, 27); ctx.lineTo(8, 29);
    ctx.stroke();
    ctx.strokeStyle = "#cfc7ba";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(-5, 11); ctx.lineTo(-5, 25);
    ctx.moveTo(6, 11);  ctx.lineTo(12, 25);
    ctx.stroke();

    ctx.fillStyle = clothDark;
    ctx.beginPath();
    ctx.moveTo(-12, -12);
    ctx.lineTo(-16, 16); ctx.lineTo(-11, 13); ctx.lineTo(-8, 19);
    ctx.lineTo(0, 14);   ctx.lineTo(7, 20);   ctx.lineTo(14, 15);
    ctx.lineTo(11, -12);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "#0b0908";
    ctx.beginPath();
    ctx.ellipse(0, -7, 10, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#e8dfd1";
    ctx.lineWidth = 1.6;
    for (let r = 0; r < 4; r++) {
      const ry = -13 + r * 3.4;
      ctx.beginPath();
      ctx.moveTo(-7.5 + r * 0.5, ry);
      ctx.quadraticCurveTo(0, ry + 2.2, 7.5 - r * 0.5, ry);
      ctx.stroke();
    }

    ctx.fillStyle = "#dfd5c7";
    ctx.beginPath();
    ctx.moveTo(3, -17);
    ctx.quadraticCurveTo(14, -19, 17, -9);
    ctx.lineTo(8, -6);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "#f2eadc";
    ctx.lineWidth = 1.6;
    [
      [7, -17, 11, -30],
      [11, -15, 19, -24],
      [-9, -15, -14, -25]
    ].forEach(([x1, y1, x2, y2]) => {
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    });

    ctx.fillStyle = "#ebe3d5";
    ctx.beginPath();
    ctx.ellipse(-1, -24, 6.2, 7.2, -0.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#080706";
    ctx.fillRect(-5, -24, 4.5, 2.2);
    ctx.strokeStyle = "#7a7065";
    ctx.lineWidth = 1.0;
    ctx.beginPath();
    ctx.moveTo(-3, -31); ctx.lineTo(-3, -18);
    ctx.moveTo(1, -31);  ctx.lineTo(1, -18);
    ctx.stroke();
    ctx.strokeStyle = "rgba(235, 228, 215, 0.55)";
    ctx.beginPath();
    ctx.moveTo(-7, -23);
    ctx.quadraticCurveTo(-13, -25 + Math.sin(t * 2.5) * 1.5, -17, -28);
    ctx.stroke();

    ctx.fillStyle = parchment;
    ctx.beginPath();
    ctx.moveTo(2, -5);
    ctx.lineTo(25, -16);
    ctx.quadraticCurveTo(21, 5, 12, 17);
    ctx.quadraticCurveTo(2, 10, 2, -5);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "#171412";
    ctx.lineWidth = 1.3;
    ctx.stroke();

    ctx.strokeStyle = "#d9d0c1";
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.moveTo(-10, -13); ctx.lineTo(-14, -2); ctx.lineTo(-22, -10);
    ctx.stroke();

    const flailX = -24 + sway * 1.3;
    const flailY = 17;
    ctx.strokeStyle = "#9e9588";
    ctx.lineWidth = 1.4;
    ctx.setLineDash([2.2, 1.8]);
    ctx.beginPath();
    ctx.moveTo(-22, -10);
    ctx.lineTo(flailX, flailY - 5);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = "#171412";
    ctx.beginPath();
    ctx.arc(flailX, flailY, 5.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = wpnTier > 0 ? godGlow : "#e8dfd1";
    ctx.lineWidth = 1.5;
    for (let a = 0; a < Math.PI * 2; a += Math.PI / 4) {
      ctx.beginPath();
      ctx.moveTo(flailX + Math.cos(a) * 4, flailY + Math.sin(a) * 4);
      ctx.lineTo(flailX + Math.cos(a) * 10.5, flailY + Math.sin(a) * 10.5);
      ctx.stroke();
    }
  } else if (clsKey === "fendiver") {
    // --- FEN-DIVER ---
    ctx.strokeStyle = "#141210";
    ctx.lineWidth = 3.2;
    ctx.beginPath();
    ctx.moveTo(-3, 8); ctx.lineTo(-5, 28); ctx.lineTo(-10, 29);
    ctx.moveTo(4, 8);  ctx.lineTo(6, 28);  ctx.lineTo(11, 29);
    ctx.stroke();

    ctx.fillStyle = clothDark;
    ctx.beginPath();
    ctx.moveTo(-10, -15); ctx.lineTo(10, -15);
    ctx.lineTo(24, 16);   ctx.lineTo(17, 7);
    ctx.lineTo(19, 23);   ctx.lineTo(11, 10);
    ctx.lineTo(12, 25);   ctx.lineTo(4, 12);
    ctx.lineTo(-12, 22);  ctx.lineTo(-9, 10);
    ctx.lineTo(-19, 19);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = clothMid;
    ctx.beginPath();
    ctx.moveTo(-8, -14); ctx.lineTo(8, -14); ctx.lineTo(6, 12); ctx.lineTo(-7, 12);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "#cfc7ba";
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.moveTo(-7, -3); ctx.lineTo(6, -3);
    ctx.moveTo(-7, 1);  ctx.lineTo(6, 1);
    ctx.stroke();

    ctx.strokeStyle = "#e8dfd1";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(8, -10);  ctx.lineTo(17, -16);
    ctx.moveTo(17, -16); ctx.lineTo(21, -22);
    ctx.moveTo(17, -16); ctx.lineTo(23, -18);
    ctx.moveTo(17, -16); ctx.lineTo(22, -13);
    ctx.stroke();

    ctx.fillStyle = "#171412";
    ctx.beginPath();
    ctx.moveTo(-15, -23);
    ctx.quadraticCurveTo(-2, -33, 12, -26);
    ctx.lineTo(18, -28);
    ctx.lineTo(10, -22);
    ctx.lineTo(-12, -20);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "#dfd5c7";
    ctx.lineWidth = 1.1;
    ctx.stroke();

    ctx.fillStyle = "#e6d298";
    ctx.beginPath();
    ctx.moveTo(-4, -22); ctx.lineTo(-19, -15); ctx.lineTo(-2, -16);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = godGlow;
    ctx.beginPath();
    ctx.arc(-5, -20, 1.3, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = wpnTier > 0 ? godGlow : "#f2eadc";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(-12, -2); ctx.lineTo(-26, -33);
    ctx.stroke();
    ctx.strokeStyle = "#b59b6d";
    ctx.beginPath();
    ctx.arc(-13, -4, 3.2, 0, Math.PI * 2);
    ctx.stroke();
  } else if (clsKey === "flagellant") {
    // --- CINDER-FLAGELLANT ---
    ctx.strokeStyle = "#dfd5c7";
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.moveTo(-4, 8); ctx.lineTo(-4, 27);
    ctx.moveTo(4, 8);  ctx.lineTo(4, 27);
    ctx.stroke();
    ctx.fillStyle = "#141210";
    ctx.fillRect(-7, 21, 5, 8);
    ctx.fillRect(2, 21, 5, 8);

    ctx.fillStyle = clothMid;
    ctx.beginPath();
    ctx.moveTo(-9, -14); ctx.lineTo(9, -14); ctx.lineTo(11, 14); ctx.lineTo(-11, 14);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = parchment;
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.moveTo(-8, -12); ctx.lineTo(8, -2);
    ctx.moveTo(8, -12);  ctx.lineTo(-8, -2);
    ctx.stroke();

    const emberPulse = 2.2 + Math.sin(t * 7) * 0.6;
    ctx.fillStyle = godGlow;
    ctx.beginPath();
    ctx.arc(0, -7, emberPulse, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = parchment;
    ctx.beginPath();
    ctx.moveTo(-7, -15); ctx.lineTo(0, -37); ctx.lineTo(7, -15);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#080706";
    ctx.beginPath();
    ctx.ellipse(0, -21, 4.2, 5.2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ff5533";
    ctx.fillRect(-2.5, -22, 1.5, 1.5);
    ctx.fillRect(1.0, -22, 1.5, 1.5);

    ctx.strokeStyle = "#e8dfd1";
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(-9, -12); ctx.lineTo(-13, 3); ctx.lineTo(-16, 13);
    ctx.stroke();

    const sx = 19;
    ctx.fillStyle = wpnTier > 0 ? godGlow : "#dcd4c6";
    ctx.beginPath();
    ctx.moveTo(sx, -31);
    ctx.lineTo(sx + 2.5, -18); ctx.lineTo(sx + 1.0, -15);
    ctx.lineTo(sx + 3.5, 8);   ctx.lineTo(sx - 3.5, 8);
    ctx.lineTo(sx - 1.5, -10); ctx.lineTo(sx - 2.5, -19);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "#b59b6d";
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.moveTo(sx - 8, 8); ctx.lineTo(sx + 8, 8);
    ctx.moveTo(sx, 8);     ctx.lineTo(sx, 20);
    ctx.stroke();
  } else if (clsKey === "scavenger") {
    // --- MIREGATE SCAVENGER (Stooped Standing Silhouette, Leaning on Tall Iron-Shod Staff + Raised Glowing Lantern) ---
    // Gaunt wrapped legs with crisp negative space
    ctx.strokeStyle = "#161311";
    ctx.lineWidth = 3.0;
    ctx.beginPath();
    ctx.moveTo(-4, 7); ctx.lineTo(-6, 19); ctx.lineTo(-5, 28); ctx.lineTo(-10, 29);
    ctx.moveTo(4, 7);  ctx.lineTo(7, 19);  ctx.lineTo(8, 28);  ctx.lineTo(13, 29);
    ctx.stroke();
    ctx.strokeStyle = "#cfc7ba";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(-5, 11); ctx.lineTo(-5, 25);
    ctx.moveTo(5, 11);  ctx.lineTo(7, 25);
    ctx.stroke();

    // Heavy scavenger pack of scrap & bones slung behind hunched back
    ctx.fillStyle = "#3a342e";
    ctx.beginPath();
    ctx.ellipse(8, -11, 7.5, 9.5, 0.25, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#cfc7ba";
    ctx.lineWidth = 1.1;
    ctx.stroke();

    // Tattered jagged cloak & patched tunic (deity-tinted)
    ctx.fillStyle = clothDark;
    ctx.beginPath();
    ctx.moveTo(-9, -15);
    ctx.lineTo(9, -14);
    ctx.lineTo(14, 15);
    ctx.lineTo(8, 10);
    ctx.lineTo(5, 17);
    ctx.lineTo(-1, 11);
    ctx.lineTo(-7, 17);
    ctx.lineTo(-12, 11);
    ctx.closePath();
    ctx.fill();

    // Bolted scrap-iron shoulder plate & diagonal satchel strap
    ctx.fillStyle = "#9e9588";
    ctx.beginPath();
    ctx.moveTo(1, -17); ctx.lineTo(11, -15); ctx.lineTo(9, -9); ctx.lineTo(0, -11);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = parchment;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(7, -14); ctx.lineTo(-7, 3);
    ctx.stroke();

    // Hunched-forward jagged pointed cowl & shadowed gaunt face
    ctx.fillStyle = clothMid;
    ctx.beginPath();
    ctx.moveTo(-11, -15);
    ctx.quadraticCurveTo(-8, -30, 1, -33);
    ctx.lineTo(6, -15);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#080706";
    ctx.beginPath();
    ctx.ellipse(-4, -20, 4.8, 5.8, -0.1, 0, Math.PI * 2);
    ctx.fill();
    // Broken bone half-mask & glowing eyes
    ctx.fillStyle = "#e8dfd1";
    ctx.beginPath();
    ctx.ellipse(-5, -18, 3.6, 2.8, 0, 0, Math.PI);
    ctx.fill();
    ctx.fillStyle = "#ffe596";
    ctx.fillRect(-7, -22, 1.5, 1.4);
    ctx.fillRect(-3.5, -22, 1.5, 1.4);

    // Towering iron-shod oak staff in right hand (planted into ground, taller than cowl)
    ctx.strokeStyle = wpnTier > 0 ? godGlow : "#c9b89c";
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.moveTo(17, 29);
    ctx.lineTo(13, -34);
    ctx.quadraticCurveTo(17, -38, 21, -34); // gnarled crook
    ctx.stroke();
    // Right arm gripping staff
    ctx.strokeStyle = "#dfd5c7";
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(7, -11); ctx.lineTo(13, -4); ctx.lineTo(15, -8);
    ctx.stroke();

    // Extended bony left arm holding glowing iron cage lantern clear of the body
    ctx.strokeStyle = "#e8dfd1";
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(-8, -12); ctx.lineTo(-16, -6); ctx.lineTo(-22, -16);
    ctx.stroke();

    const lx2 = -23 + sway * 0.7;
    const ly2 = -2;
    // Warm lantern radial glow + patron rim
    const lGlow = ctx.createRadialGradient(lx2, ly2, 1, lx2, ly2, 16);
    lGlow.addColorStop(0, "rgba(255, 232, 150, 0.96)");
    lGlow.addColorStop(0.5, `rgba(${gr}, ${gg}, ${gb}, 0.36)`);
    lGlow.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = lGlow;
    ctx.beginPath();
    ctx.arc(lx2, ly2, 16, 0, Math.PI * 2);
    ctx.fill();

    // Iron lantern chain & glowing cage
    ctx.fillStyle = "#ffe596";
    ctx.fillRect(lx2 - 3.5, ly2 - 5, 7, 10);
    ctx.strokeStyle = "#141210";
    ctx.lineWidth = 1.3;
    ctx.strokeRect(lx2 - 3.5, ly2 - 5, 7, 10);
    ctx.beginPath();
    ctx.moveTo(-22, -16); ctx.lineTo(lx2, ly2 - 7);
    ctx.lineTo(lx2 - 5, ly2 - 5); ctx.lineTo(lx2 + 5, ly2 - 5); ctx.closePath();
    ctx.stroke();
  } else if (clsKey === "cantor") {
    // --- VEIL-CANTOR ---
    ctx.fillStyle = clothDark;
    ctx.beginPath();
    ctx.moveTo(-8, -14); ctx.lineTo(8, -14); ctx.lineTo(15, 28); ctx.lineTo(-15, 28);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = clothMid;
    ctx.lineWidth = 1.4;
    [-6, 0, 6].forEach((fx) => {
      ctx.beginPath();
      ctx.moveTo(fx * 0.7, -12);
      ctx.lineTo(fx * 1.4, 27);
      ctx.stroke();
    });

    [
      [-9, -11],
      [-4, -7],
      [2, -4],
      [8, -1]
    ].forEach(([dx, dy]) => {
      ctx.fillStyle = "#e6c875";
      ctx.beginPath();
      ctx.arc(dx, dy, 3.0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#171412";
      ctx.lineWidth = 0.9;
      ctx.stroke();
    });

    ctx.fillStyle = "#d9bc75";
    ctx.beginPath();
    ctx.moveTo(0, -37); ctx.lineTo(8, -22); ctx.lineTo(6, -15);
    ctx.lineTo(-6, -15); ctx.lineTo(-8, -22);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#080706";
    ctx.fillRect(-5, -21, 10, 4);
    ctx.strokeStyle = godGlow;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(-7, -21); ctx.quadraticCurveTo(-15, -8, -13, 6);
    ctx.moveTo(7, -21);  ctx.quadraticCurveTo(15, -8, 13, 6);
    ctx.stroke();

    ctx.strokeStyle = "#dfd5c7";
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(8, -10); ctx.lineTo(18, -5);
    ctx.stroke();

    const cx2 = 19 + sway * 1.5;
    const cy2 = 10;
    ctx.strokeStyle = "#b59b6d";
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.moveTo(18, -5); ctx.lineTo(cx2, cy2 - 4);
    ctx.stroke();
    ctx.fillStyle = "#e6c875";
    ctx.beginPath();
    ctx.arc(cx2, cy2, 4.0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = godGlow;
    ctx.beginPath();
    ctx.arc(cx2, cy2 - 1, 2.0, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // --- GRAFTED ROOT-WALKER ---
    ctx.strokeStyle = "#7a9e7d";
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.moveTo(-5, 8); ctx.lineTo(-7, 28);
    ctx.moveTo(5, 8);  ctx.lineTo(8, 28);
    ctx.stroke();

    ctx.fillStyle = clothDark;
    ctx.beginPath();
    ctx.moveTo(-11, -14); ctx.lineTo(11, -14);
    ctx.lineTo(15, 18);   ctx.lineTo(6, 12);
    ctx.lineTo(0, 21);    ctx.lineTo(-7, 13);
    ctx.lineTo(-15, 19);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = "#cfc7ba";
    ctx.lineWidth = 1.8;
    [
      [-7, -14, -18, -26],
      [-9, -11, -21, -17],
      [-10, -8, -19, -9]
    ].forEach(([x1, y1, x2, y2]) => {
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    });

    ctx.fillStyle = "#d4ccb8";
    ctx.beginPath();
    ctx.ellipse(0, -21, 5.5, 7.0, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#e8dfd1";
    ctx.lineWidth = 1.7;
    ctx.beginPath();
    ctx.moveTo(-3, -27); ctx.lineTo(-13, -37);
    ctx.moveTo(-8, -32); ctx.lineTo(-6, -39);
    ctx.moveTo(3, -27);  ctx.lineTo(16, -40);
    ctx.moveTo(10, -34); ctx.lineTo(18, -33);
    ctx.moveTo(8, -32);  ctx.lineTo(8, -41);
    ctx.stroke();

    ctx.strokeStyle = "#9e9588";
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.moveTo(16, 27); ctx.lineTo(14, -20);
    ctx.stroke();
    ctx.strokeStyle = wpnTier > 0 ? godGlow : "#f2eadc";
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(14, -20);
    ctx.quadraticCurveTo(26, -24, 30, -9);
    ctx.stroke();
  }

  ctx.restore();

  // 3. Framed Procedural Portrait Inset (Top-Left, *Blind Orphan* Grimoire Layout)
  const fw = isVert ? Math.floor(w * 0.34) : Math.floor(w * 0.24);
  const fh = Math.floor(fw * 1.15);
  const fx = Math.floor(w * 0.05);
  const fy = Math.floor(h * 0.06);

  ctx.fillStyle = "#040303";
  ctx.fillRect(fx - 2, fy - 2, fw + 4, fh + 4);
  ctx.strokeStyle = "#e3dccf";
  ctx.lineWidth = 1.4;
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