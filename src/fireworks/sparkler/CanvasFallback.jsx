import { useEffect, useRef } from "react";
import { SPARKLER_COLORS } from "./model.js";
// Keeps the interaction usable on devices without WebGL; normal mode is R3F.
export default function CanvasFallback({
  model,
  background,
  canvasRef,
  paused,
  low,
  onTick,
  onReady,
}) {
  const host = useRef(),
    latest = useRef();
  latest.current = { paused, low, onTick };
  useEffect(() => {
    const c = host.current,
      ctx = c.getContext("2d");
    canvasRef.current = c;
    if (!ctx) return;
    let frame = 0,
      last = 0,
      lastSnapshot = -1,
      width = 1,
      height = 1,
      wasBurning = false;
    function resize() {
      const r = c.getBoundingClientRect();
      width = Math.max(r.width, 1);
      height = Math.max(r.height, 1);
      c.width = width;
      c.height = height;
      model.resize(width / height);
      wake();
    }
    function draw(t) {
      frame = 0;
      const dt = last ? Math.min(0.05, (t - last) / 1000) : 1 / 60;
      last = t;
      if (!document.hidden && !latest.current.paused) model.step(dt);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, width, height);
      const bg = background();
      if (bg) ctx.drawImage(bg, 0, 0, width, height);
      ctx.save();
      ctx.setTransform(
        width / model.width,
        0,
        0,
        -height / 12,
        width / 2,
        height / 2,
      );
      for (const line of model.trails) {
        ctx.globalAlpha = Math.max(0, 1 - (model.time - line.born) / line.life);
        ctx.strokeStyle = line.color;
        ctx.lineWidth = line.width * 2;
        ctx.shadowBlur = 8;
        ctx.shadowColor = line.color;
        ctx.beginPath();
        ctx.moveTo(line.ax, line.ay);
        ctx.lineTo(line.bx, line.by);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;
      ctx.save();
      const a = model.rotation,
        len = model.coatTip;
      ctx.translate(
        model.tip.x + Math.sin(a) * len,
        model.tip.y - Math.cos(a) * len,
      );
      ctx.rotate(a);
      ctx.fillStyle = "#b77d58";
      ctx.beginPath();
      ctx.ellipse(0.2, -0.6, 0.5, 0.7, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.lineCap = "round";
      ctx.strokeStyle = "#b77d58";
      ctx.lineWidth = 0.6;
      ctx.beginPath();
      ctx.moveTo(0.25, -0.9);
      ctx.lineTo(0.4, -2);
      ctx.stroke();
      ctx.strokeStyle = "#aeb8c1";
      ctx.lineWidth = 0.025;
      ctx.beginPath();
      ctx.moveTo(0, -0.4);
      ctx.lineTo(0, 3.35);
      ctx.stroke();
      ctx.strokeStyle = "#6a655f";
      ctx.lineWidth = 0.07;
      ctx.beginPath();
      ctx.moveTo(0, 1.9);
      ctx.lineTo(0, len);
      ctx.stroke();
      for (let i = 0; i < 4; i++) {
        ctx.strokeStyle = i % 2 ? "#d59a76" : "#c88b67";
        ctx.lineWidth = 0.24;
        ctx.beginPath();
        ctx.moveTo(0.45, -i * 0.27);
        ctx.quadraticCurveTo(-0.15, 0.25 - i * 0.27, -0.02, -0.15 - i * 0.27);
        ctx.stroke();
      }
      ctx.restore();
      ctx.globalCompositeOperation = "lighter";
      for (const p of model.particles) {
        ctx.globalAlpha = p.life / p.total;
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 0.025;
        ctx.shadowBlur = 7;
        ctx.shadowColor = p.color;
        ctx.beginPath();
        ctx.moveTo(p.px, p.py);
        ctx.lineTo(p.x, p.y);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      if (model.burning) {
        ctx.fillStyle = SPARKLER_COLORS.find((c) => c.id === model.color).hex;
        ctx.shadowBlur = 20;
        ctx.shadowColor = ctx.fillStyle;
        ctx.beginPath();
        ctx.arc(model.tip.x, model.tip.y, 0.07, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
      if (model.time - lastSnapshot > 0.2 || wasBurning !== model.burning) {
        lastSnapshot = model.time;
        wasBurning = model.burning;
        latest.current.onTick(model.snapshot());
      }
      if (model.captureNext) {
        const request = model.captureNext;
        model.captureNext = null;
        c.toBlob(
          (blob) =>
            blob
              ? request.resolve(blob)
              : request.reject(new Error("Capture could not be created.")),
          "image/png",
        );
      }
      if (model.active && !latest.current.paused && !document.hidden)
        frame = requestAnimationFrame(draw);
      else last = 0;
    }
    function wake() {
      if (!frame) frame = requestAnimationFrame(draw);
    }
    model.wake = wake;
    const observer = new ResizeObserver(resize);
    observer.observe(c);
    resize();
    onReady();
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
      model.wake = () => {};
      canvasRef.current = null;
    };
  }, [model, background, canvasRef, onReady]);
  useEffect(() => {
    model.wake();
  }, [paused, low, model]);
  return (
    <>
      <canvas ref={host} />
      <span className="sparkler-compatibility">Canvas compatibility mode</span>
    </>
  );
}
