export function drawVesselClassBody(ctx, clsKey, palette, t, wpnTier) {
  const { clothDark, clothMid, parchment, godGlow, gr, gg, gb } = palette;
  const sway = Math.sin(t * 1.1) * 1.2;
  if (clsKey === 'penitent') {

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
  } else if (clsKey === 'fendiver') {

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
  } else if (clsKey === 'flagellant') {

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
  } else if (clsKey === 'scavenger') {

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
  } else if (clsKey === 'cantor') {

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
}
