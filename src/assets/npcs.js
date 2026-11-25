export function drawNpcPlate(ctx, artId, t, godRgb) {
  const [gr, gg, gb] = godRgb;
  if (artId === 'sentinel') {

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
    return true;
  }
  if (artId === 'frogknight') {

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
    return true;
  }
  if (artId === 'nighthag') {

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
    return true;
  }
  if (artId === 'priest') {

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
    return true;
  }
  if (artId === 'fenwarden') {

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
    return true;
  }
  if (artId === 'peddler') {

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
    return true;
  }
  if (artId === 'hermit') {

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
    return true;
  }
  return false;
}
