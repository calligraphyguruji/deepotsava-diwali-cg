import { useEffect, useRef } from "react";
export function burst(x, y, count = 1, kind = "firework") {
  window.dispatchEvent(
    new CustomEvent("jyoti-burst", { detail: { x, y, count, kind } }),
  );
}
export default function Fireworks({ reduced }) {
  const ref = useRef();
  useEffect(() => {
    const canvas = ref.current,
      ctx = canvas.getContext("2d");
    if (!ctx) return;
    let w = 0,
      h = 0,
      frame = 0,
      last = 0,
      particles = [],
      timers = new Set();
    const mobile =
      window.innerWidth < 768 ||
      (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4);
    const colors = ["#ffe4a0", "#ef83ac", "#b79be8", "#8bc9ff", "#ffb25a"];
    function resize() {
      w = innerWidth;
      h = innerHeight;
      const d = Math.min(devicePixelRatio || 1, mobile ? 1 : 1.5);
      canvas.width = w * d;
      canvas.height = h * d;
      ctx.setTransform(d, 0, 0, d, 0, 0);
    }
    function explosion(x, y, kind) {
      const color = colors[Math.floor(Math.random() * colors.length)];
      for (let i = 0; i < (reduced ? 16 : mobile ? 48 : 90); i++) {
        const a = Math.random() * Math.PI * 2,
          s = (Math.random() * 3 + 1) * (kind === "sparkle" ? 0.65 : 1.5);
        particles.push({
          x,
          y,
          px: x,
          py: y,
          vx: Math.cos(a) * s,
          vy: Math.sin(a) * s,
          life: 1,
          decay: 0.009 + Math.random() * 0.012,
          color:
            kind === "sparkle"
              ? "#ffd684"
              : kind === "confetti"
                ? colors[i % colors.length]
                : color,
          confetti: kind === "confetti",
          angle: a,
        });
      }
      particles = particles.slice(mobile ? -360 : -900);
      if (!frame) frame = requestAnimationFrame(draw);
    }
    function launch(e) {
      const { x, y, count, kind } = e.detail;
      for (let i = 0; i < count; i++) {
        const timer = setTimeout(
          () => {
            timers.delete(timer);
            explosion(
              x ?? w * (0.15 + Math.random() * 0.7),
              y ?? h * (0.15 + Math.random() * 0.45),
              kind,
            );
          },
          i * (reduced ? 100 : 180),
        );
        timers.add(timer);
      }
    }
    function draw(t) {
      const delta = Math.min((t - last) / 16.67 || 1, 2);
      last = t;
      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = "lighter";
      particles = particles.filter((p) => p.life > 0);
      for (const p of particles) {
        p.px = p.x;
        p.py = p.y;
        p.vx *= 0.985;
        p.vy += (p.confetti ? 0.06 : 0.025) * delta;
        p.x += p.vx * delta;
        p.y += p.vy * delta;
        p.life -= p.decay * delta;
        ctx.globalAlpha = Math.max(0, p.life);
        if (p.confetti) {
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.angle + t * 0.003);
          ctx.fillStyle = p.color;
          ctx.fillRect(-3, -1, 6, 3);
          ctx.restore();
        } else {
          ctx.strokeStyle = p.color;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(p.px - p.vx * 2, p.py - p.vy * 2);
          ctx.lineTo(p.x, p.y);
          ctx.stroke();
        }
      }
      ctx.globalAlpha = 1;
      if (particles.length) frame = requestAnimationFrame(draw);
      else {
        frame = 0;
        last = 0;
        ctx.clearRect(0, 0, w, h);
      }
    }
    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("jyoti-burst", launch);
    return () => {
      cancelAnimationFrame(frame);
      timers.forEach(clearTimeout);
      window.removeEventListener("resize", resize);
      window.removeEventListener("jyoti-burst", launch);
    };
  }, [reduced]);
  return <canvas ref={ref} className="fireworks-canvas" aria-hidden="true" />;
}

export function AmbientFireworks({ reduced }) {
  useEffect(() => {
    if (reduced) return;
    const sky = document.getElementById("fireworks");
    let skyVisible = false;
    const observer = new IntersectionObserver(
      ([entry]) => {
        skyVisible = entry.isIntersecting;
      },
      { threshold: 0.4 },
    );
    if (sky) observer.observe(sky);
    const entrance = setTimeout(() => {
      if (!document.hidden) burst(innerWidth * 0.8, innerHeight * 0.25, 2);
    }, 1800);
    const interval = setInterval(() => {
      if (skyVisible && !document.hidden)
        burst(
          innerWidth * (0.5 + Math.random() * 0.4),
          innerHeight * (0.2 + Math.random() * 0.4),
        );
    }, 5000);
    return () => {
      clearTimeout(entrance);
      clearInterval(interval);
      observer.disconnect();
    };
  }, [reduced]);
  return null;
}
