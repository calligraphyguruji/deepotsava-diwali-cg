export const blessings = [
  "May new beginnings find their way to you.",
  "May your home overflow with warmth and laughter.",
  "May every little light lead you to something beautiful.",
  "May peace, prosperity, and possibility be yours.",
  "May love always be the brightest light in your life.",
  "May the year ahead be as radiant as your heart.",
];
export function greeting(from, to, style) {
  const messages = {
    Traditional:
      "may the light of every diya bring you prosperity, peace, and beautiful new beginnings. Wishing you a blessed Diwali!",
    Romantic:
      "you are the light in my every season. May our Diwali sparkle with love and a lifetime of beautiful memories.",
    Family:
      "may our home be filled with laughter, our hearts with gratitude, and our days with togetherness. Happy Diwali to my wonderful family!",
    Friends:
      "here’s to bright adventures, endless laughter, and memories that shine brighter than fireworks. Happy Diwali, my friend!",
  };
  return `Dear ${to.trim() || "someone special"}, ${messages[style] || messages.Traditional} 🪔${from.trim() ? ` With love, ${from.trim()}.` : ""}`;
}
export const whatsappLink = (text) =>
  `https://wa.me/?text=${encodeURIComponent(text)}`;
export function wrapText(ctx, text, maxWidth) {
  const words = text.split(/\s+/);
  const lines = [];
  let line = "";
  for (const word of words) {
    if (ctx.measureText(word).width > maxWidth) {
      if (line) {
        lines.push(line);
        line = "";
      }
      let part = "";
      for (const char of word) {
        if (ctx.measureText(part + char).width > maxWidth) {
          lines.push(part);
          part = char;
        } else part += char;
      }
      line = part;
    } else if (
      ctx.measureText(`${line} ${word}`.trim()).width > maxWidth &&
      line
    ) {
      lines.push(line);
      line = word;
    } else line = `${line} ${word}`.trim();
  }
  if (line) lines.push(line);
  return lines;
}
export async function downloadGreeting(text) {
  await document.fonts.ready;
  const canvas = document.createElement("canvas");
  canvas.width = 1200;
  canvas.height = 1200;
  const c = canvas.getContext("2d");
  if (!c) throw new Error("Your browser cannot create images.");
  const bg = c.createRadialGradient(600, 500, 20, 600, 600, 850);
  bg.addColorStop(0, "#301b3b");
  bg.addColorStop(1, "#080b1f");
  c.fillStyle = bg;
  c.fillRect(0, 0, 1200, 1200);
  c.strokeStyle = "#b28b49";
  c.lineWidth = 2;
  c.strokeRect(55, 55, 1090, 1090);
  c.strokeRect(70, 70, 1060, 1060);
  c.textAlign = "center";
  c.fillStyle = "#d9b87a";
  c.font = '24px "Noto Serif Devanagari", "DM Sans"';
  c.fillText("दीपोत्सव  ·  A CELEBRATION OF LIGHT", 600, 165);
  c.font = '108px "Cormorant Garamond"';
  c.fillStyle = "#ffe3a2";
  c.fillText("Happy Diwali", 600, 365);
  c.font = '34px "DM Sans"';
  c.fillStyle = "#eee1cf";
  const lines = wrapText(c, text, 870);
  lines.forEach((line, i) => c.fillText(line, 600, 510 + i * 52));
  c.fillStyle = "#dcb264";
  c.beginPath();
  c.ellipse(600, 990, 86, 23, 0, 0, Math.PI);
  c.fill();
  c.fillStyle = "#ffde8c";
  c.beginPath();
  c.moveTo(600, 980);
  c.bezierCurveTo(550, 940, 610, 910, 601, 880);
  c.bezierCurveTo(650, 939, 635, 963, 600, 980);
  c.fill();
  const blob = await new Promise((resolve) =>
    canvas.toBlob(resolve, "image/png"),
  );
  if (!blob) throw new Error("Image download failed. Please try again.");
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "deepotsava-diwali-greeting.png";
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
