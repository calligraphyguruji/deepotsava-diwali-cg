import { BY_ID } from "./catalog";
const TAU = Math.PI * 2;
export function makeBackdrop(height) {
  const canvas = document.createElement("canvas");
  canvas.width = 1000;
  canvas.height = Math.ceil(height);
  const c = canvas.getContext("2d");
  if (!c) return canvas;
  const sky = c.createLinearGradient(0, 0, 0, height);
  sky.addColorStop(0, "#070b21");
  sky.addColorStop(0.65, "#1e1638");
  sky.addColorStop(1, "#503043");
  c.fillStyle = sky;
  c.fillRect(0, 0, 1000, height);
  const haze = c.createRadialGradient(
    650,
    height * 0.6,
    0,
    650,
    height * 0.6,
    550,
  );
  haze.addColorStop(0, "#64324d28");
  haze.addColorStop(1, "#100d2400");
  c.fillStyle = haze;
  c.fillRect(0, 0, 1000, height);
  for (let i = 0; i < 130; i++) {
    const x = (i * 173.17) % 1000,
      y = (i * 67.34) % (height * 0.7);
    c.globalAlpha = 0.18 + (i % 7) * 0.1;
    c.fillStyle = i % 3 ? "#e7d8b9" : "#9ca6da";
    c.beginPath();
    c.arc(x, y, i % 9 ? 0.8 : 1.7, 0, TAU);
    c.fill();
  }
  c.globalAlpha = 1;
  c.fillStyle = "#f2dba2";
  c.shadowColor = "#f4ce84";
  c.shadowBlur = 20;
  c.beginPath();
  c.arc(825, height * 0.14, 23, 0, TAU);
  c.fill();
  c.shadowBlur = 0;
  c.fillStyle = "#0a0e25";
  c.beginPath();
  c.arc(834, height * 0.132, 23, 0, TAU);
  c.fill();
  for (let layer = 0; layer < 2; layer++) {
    for (let i = 0; i < 18; i++) {
      const x = i * 65 - 35 + (layer ? 25 : 0),
        base = height * (layer ? 0.79 : 0.72),
        w = 45 + ((i * 17) % 40),
        h = 45 + ((i * 29) % 90);
      c.fillStyle = layer ? "#111225" : "#1e1b35";
      c.fillRect(x, base - h, w, h + 60);
      if (i % 3 === 0) {
        c.beginPath();
        c.moveTo(x, base - h);
        c.quadraticCurveTo(
          x + w * 0.1,
          base - h - 26,
          x + w * 0.5,
          base - h - 40,
        );
        c.quadraticCurveTo(x + w * 0.9, base - h - 26, x + w, base - h);
        c.fill();
        c.fillRect(x + w * 0.48, base - h - 48, 2, 12);
      }
      if (i % 4 === 0) {
        c.fillRect(x + 5, base - h - 14, 8, 16);
        c.beginPath();
        c.arc(x + 9, base - h - 14, 6, Math.PI, TAU);
        c.fill();
      }
      c.fillStyle = layer ? "#db9b4755" : "#dfad4a22";
      for (let k = 0; k < 4; k++)
        if ((i + k) % 3) c.fillRect(x + 9 + k * 11, base - 28, 4, 9);
    }
  }
  const ground = height * 0.84;
  const floor = c.createLinearGradient(0, ground, 0, height);
  floor.addColorStop(0, "#352333");
  floor.addColorStop(1, "#111022");
  c.fillStyle = floor;
  c.fillRect(0, ground, 1000, height - ground);
  c.strokeStyle = "#d7a55d16";
  c.lineWidth = 1;
  for (let i = 0; i < 8; i++) {
    c.beginPath();
    c.moveTo(500, ground);
    c.lineTo(i * 200 - 200, height);
    c.stroke();
  }
  for (let i = 0; i < 4; i++) {
    const y = ground + (height - ground) * ((i * i) / 9);
    c.beginPath();
    c.moveTo(0, y);
    c.lineTo(1000, y);
    c.stroke();
  }
  c.strokeStyle = "#b78c4a55";
  c.beginPath();
  c.moveTo(0, height * 0.66);
  c.quadraticCurveTo(500, height * 0.78, 1000, height * 0.66);
  c.stroke();
  for (let i = 0; i < 38; i++) {
    const x = (i / 37) * 1000,
      t = x / 1000,
      y = height * 0.66 + 4 * t * (1 - t) * height * 0.06;
    c.fillStyle = ["#eab767", "#dd8983", "#c6a4e2"][i % 3];
    c.shadowColor = c.fillStyle;
    c.shadowBlur = 8;
    c.beginPath();
    c.arc(x, y, 2, 0, TAU);
    c.fill();
  }
  c.shadowBlur = 0;
  for (let i = 0; i < 11; i++) drawDiya(c, 35 + i * 94, ground + 18, 0.8);
  return canvas;
}
function drawDiya(c, x, y, s = 1) {
  c.save();
  c.translate(x, y);
  c.scale(s, s);
  c.fillStyle = "#c38d45";
  c.beginPath();
  c.ellipse(0, 0, 11, 5, 0, 0, Math.PI);
  c.fill();
  c.shadowColor = "#ffb44f";
  c.shadowBlur = 15;
  c.fillStyle = "#ffe4a3";
  c.beginPath();
  c.moveTo(0, -3);
  c.bezierCurveTo(-7, -11, 3, -13, 0, -20);
  c.bezierCurveTo(9, -10, 5, -5, 0, -3);
  c.fill();
  c.restore();
}
export function drawLantern(c, x, y, t = 0, scale = 1) {
  c.save();
  c.translate(x, y);
  c.scale(scale, scale);
  c.rotate(Math.sin(t * 0.8) * 0.05);
  c.shadowColor = "#ffb64a";
  c.shadowBlur = 25;
  const paper = c.createLinearGradient(-17, 0, 17, 0);
  paper.addColorStop(0, "#ab5420");
  paper.addColorStop(0.5, "#ffc277");
  paper.addColorStop(1, "#bb5827");
  c.fillStyle = paper;
  c.beginPath();
  c.moveTo(-18, -28);
  c.quadraticCurveTo(-23, -12, -16, 19);
  c.quadraticCurveTo(0, 25, 16, 19);
  c.quadraticCurveTo(23, -12, 18, -28);
  c.quadraticCurveTo(0, -33, -18, -28);
  c.fill();
  c.shadowBlur = 0;
  c.strokeStyle = "#ffdc9c66";
  for (let i = -1; i <= 1; i++) {
    c.beginPath();
    c.moveTo(i * 12, -27);
    c.quadraticCurveTo(i * 15, -4, i * 10, 19);
    c.stroke();
  }
  c.strokeStyle = "#704726";
  c.beginPath();
  c.ellipse(0, 20, 16, 4, 0, 0, TAU);
  c.stroke();
  drawDiya(c, 0, 16, 0.6);
  c.restore();
}
export function drawDevice(c, e, ground) {
  c.save();
  c.translate(e.x, ground);
  c.lineWidth = 2;
  if (e.id === "sparkler") {
    c.strokeStyle = "#8d8390";
    c.beginPath();
    c.moveTo(-10, 22);
    c.lineTo(20, -120);
    c.stroke();
    c.strokeStyle = "#a99c84";
    c.lineWidth = 5;
    c.beginPath();
    c.moveTo(20, -120 + (e.life / 4.5) * 55);
    c.lineTo(7, -58);
    c.stroke();
  } else if (e.id === "fountain" || e.id === "color") {
    const fill = c.createLinearGradient(-18, 0, 18, 0);
    fill.addColorStop(0, "#7f3c35");
    fill.addColorStop(0.5, e.id === "color" ? "#a78acb" : "#d99a52");
    fill.addColorStop(1, "#583239");
    c.fillStyle = fill;
    c.beginPath();
    c.moveTo(0, -30);
    c.lineTo(-20, 4);
    c.quadraticCurveTo(0, 12, 20, 4);
    c.closePath();
    c.fill();
    c.strokeStyle = "#efc075";
    c.beginPath();
    c.moveTo(-14, -5);
    c.lineTo(14, -5);
    c.stroke();
  } else if (e.id === "bomb" && !e.burst) {
    c.fillStyle = "#596849";
    c.beginPath();
    c.arc(0, -11, 13, 0, TAU);
    c.fill();
    c.strokeStyle = "#bd9959";
    for (let i = -7; i < 9; i += 5) {
      c.beginPath();
      c.moveTo(i, -23);
      c.lineTo(i, -1);
      c.stroke();
    }
    c.strokeStyle = "#b1a87c";
    c.beginPath();
    c.moveTo(0, -23);
    c.quadraticCurveTo(9, -37, 12, -22);
    c.stroke();
  } else if (e.id === "spinner") {
    c.rotate(e.angle || 0);
    c.fillStyle = "#ac6945";
    c.beginPath();
    c.ellipse(0, 0, 17, 6, 0, 0, TAU);
    c.fill();
    c.strokeStyle = "#efd08c";
    c.beginPath();
    c.ellipse(0, -1, 10, 3, 0, 0, TAU);
    c.stroke();
  } else if (e.id === "ladi") {
    for (let i = 0; i < 32; i++) {
      c.fillStyle = i <= e.pop ? "#5c4148" : "#a5444d";
      c.fillRect(-65 + i * 4, -8 + (i % 2) * 6, 3, 11);
    }
  } else if (e.id === "multishot" || e.id === "shell") {
    c.fillStyle = "#7c5379";
    c.fillRect(-13, -24, 26, 24);
    c.fillStyle = "#d6a35e";
    c.fillRect(-14, -26, 28, 4);
  }
  c.restore();
}
export function paintScene(
  ctx,
  engine,
  background,
  { low = false, position, selected, smokeSprite },
) {
  const h = engine.height;
  ctx.clearRect(0, 0, 1000, h);
  ctx.save();
  if (engine.shake && !engine.reduced)
    ctx.translate(
      Math.sin(engine.time * 90) * engine.shake * 3,
      Math.cos(engine.time * 80) * engine.shake * 2,
    );
  ctx.drawImage(background, 0, 0, 1000, h);
  if (engine.flash) {
    ctx.globalCompositeOperation = "screen";
    const glow = ctx.createRadialGradient(
      500,
      engine.ground,
      0,
      500,
      engine.ground,
      700,
    );
    glow.addColorStop(0, `rgba(255,192,117,${engine.flash * 0.27})`);
    glow.addColorStop(1, "rgba(120,90,200,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, 1000, h);
    ctx.globalCompositeOperation = "source-over";
  }
  for (const e of engine.emitters) {
    if (e.id === "lantern" && e.head) {
      drawLantern(
        ctx,
        e.head.x,
        e.head.y,
        e.life,
        Math.max(0.35, 1 - e.life * 0.045),
      );
      continue;
    }
    drawDevice(ctx, e, engine.ground);
    if (e.head) {
      ctx.fillStyle = "#fff1b5";
      ctx.shadowBlur = low ? 0 : 14;
      ctx.shadowColor = "#ffbd6b";
      ctx.beginPath();
      ctx.arc(e.head.x, e.head.y, e.id === "butterfly" ? 3 : 4, 0, TAU);
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }
  for (const p of engine.particles) {
    if (p.kind !== "smoke") continue;
    ctx.globalAlpha = Math.min(0.12, (p.life / p.total) * 0.16);
    const s = p.size * (2 - p.life / p.total);
    ctx.drawImage(smokeSprite, p.x - s, p.y - s, s * 2, s * 2);
  }
  ctx.globalCompositeOperation = "lighter";
  for (const p of engine.particles) {
    if (p.kind === "smoke") continue;
    const a = Math.max(0, p.life / p.total);
    ctx.globalAlpha = a;
    ctx.strokeStyle = p.color;
    ctx.lineWidth = p.size * (0.4 + 0.6 * a);
    ctx.beginPath();
    ctx.moveTo(
      p.px - p.vx * (p.kind === "rain" ? 0.045 : 0.014),
      p.py - p.vy * (p.kind === "rain" ? 0.045 : 0.014),
    );
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    if (!low && p.size > 1.8) {
      ctx.fillStyle = p.color;
      ctx.globalAlpha = a * 0.2;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * 2, 0, TAU);
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = "source-over";
  if (!engine.emitters.length && position) {
    const def = BY_ID[selected];
    ctx.save();
    ctx.globalAlpha = 0.45;
    drawDevice(
      ctx,
      { id: selected, x: position.x * 1000, life: 0, pop: -1, burst: false },
      engine.ground,
    );
    if (selected === "lantern")
      drawLantern(ctx, position.x * 1000, engine.ground - 40, 0, 0.7);
    ctx.restore();
  }
  ctx.restore();
}
export function makeSmoke() {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;
  const c = canvas.getContext("2d");
  const g = c.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, "#a09baf");
  g.addColorStop(0.35, "#766d93aa");
  g.addColorStop(1, "#766d9300");
  c.fillStyle = g;
  c.fillRect(0, 0, 128, 128);
  return canvas;
}
