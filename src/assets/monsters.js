export function drawMonsterPlate(ctx, artId, t, godRgb) {
  const [gr, gg, gb] = godRgb;
  if (artId === 'exile') {

    // Bone-Sworn Colossus
    ctx.strokeStyle = "#cfc7ba";
    ctx.lineWidth = 2;
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
    return true;
  }
  if (artId === 'mirevisage') {

    // Mire-Leviathan
    ctx.strokeStyle = "#9ec4cf";
    ctx.lineWidth = 2;
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
    return true;
  }
  if (artId === 'marionette') {

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
    return true;
  }
  return false;
}
