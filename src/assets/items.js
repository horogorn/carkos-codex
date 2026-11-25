export function drawItemPlate(ctx, artId, t, godRgb) {
  const [gr, gg, gb] = godRgb;
  if (artId === 'censer') {

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
    ctx.lineWidth = 2;
    for (let s = 0; s < 3; s++) {
      const sy = -15 - ((t * 7 + s * 8) % 20);
      ctx.beginPath();
      ctx.arc(14 + Math.sin(t * 3 + s) * 4, sy, 3 + s, 0, Math.PI * 2);
      ctx.stroke();
    }
    return true;
  }
  if (artId === 'shard') {

    ctx.strokeStyle = `rgb(${gr}, ${gg}, ${gb})`;
    ctx.lineWidth = 2;
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
    return true;
  }
  if (artId === 'moss') {

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
    return true;
  }
  if (artId === 'reedbone') {

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
    return true;
  }
  if (artId === 'ration') {

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
    return true;
  }
  if (artId === 'torch') {

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
    return true;
  }
  return false;
}
