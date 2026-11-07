export const BURN_SECONDS = 38;
export const SPARKLER_COLORS = [
  { id: "red", name: "Red", hex: "#ff354c" },
  { id: "green", name: "Green", hex: "#25ee87" },
  { id: "blue", name: "Blue", hex: "#3c8cff" },
  { id: "yellow", name: "Yellow", hex: "#ffdb50" },
  { id: "purple", name: "Purple", hex: "#b968ff" },
  { id: "pink", name: "Pink", hex: "#ff55ba" },
  { id: "rainbow", name: "Rainbow", hex: "#ffe4b7" },
];
export const RGB = Object.fromEntries(
  SPARKLER_COLORS.map((c) => [
    c.hex,
    [1, 3, 5].map((i) =>
      Math.pow(parseInt(c.hex.slice(i, i + 2), 16) / 255, 2.2),
    ),
  ]),
);
const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
export class SparklerModel {
  constructor({ random = Math.random } = {}) {
    this.random = random;
    this.mode = "classic";
    this.color = "yellow";
    this.low = false;
    this.reduced = false;
    this.aspect = 1;
    this.width = 12;
    this.time = 0;
    this.elapsed = 0;
    this.burning = false;
    this.hasLit = false;
    this.tip = { x: 0, y: 0.96 };
    this.normalized = { x: 0.5, y: 0.42 };
    this.queue = [];
    this.particles = [];
    this.trails = [];
    this.smoke = [];
    this.rotation = 0;
    this.speed = 0;
    this.credit = 0;
    this.smokeCredit = 0;
    this.stroke = 0;
    this.wake = () => {};
  }
  get cap() {
    return this.reduced ? 300 : this.low ? 1000 : 2400;
  }
  get trailCap() {
    return this.low ? 2200 : 5000;
  }
  get progress() {
    return this.elapsed / BURN_SECONDS;
  }
  get remaining() {
    return Math.max(0, BURN_SECONDS - this.elapsed);
  }
  get active() {
    return (
      Math.abs(this.rotation) > 0.001 ||
      this.burning ||
      this.queue.length > 0 ||
      this.particles.length > 0 ||
      this.trails.length > 0 ||
      this.smoke.length > 0
    );
  }
  get coatTip() {
    return 3.35 - this.progress * 1.45;
  }
  get brightness() {
    return this.burning
      ? Math.min(1, this.remaining / 3) *
          (0.3 + 0.7 * Math.pow(1 - this.progress, 0.3))
      : 0;
  }
  world(x, y) {
    return { x: (x - 0.5) * this.width, y: (0.5 - y) * 12 };
  }
  resize(aspect) {
    this.aspect = aspect;
    this.width = 12 * aspect;
    this.tip = this.world(this.normalized.x, this.normalized.y);
    this.queue = [];
    this.wake();
  }
  setColor(id) {
    if (!SPARKLER_COLORS.some((c) => c.id === id)) return;
    this.color = id;
    if (id === "rainbow") {
      if (this.mode !== "painting") this.mode = "rainbow";
    } else if (
      this.mode === "rainbow" ||
      (this.mode === "classic" && id !== "yellow")
    )
      this.mode = "painting";
    this.wake();
  }
  setMode(mode) {
    if (!["classic", "rainbow", "painting"].includes(mode)) return;
    this.mode = mode;
    if (mode === "classic") this.color = "yellow";
    if (mode === "rainbow") this.color = "rainbow";
    this.wake();
  }
  input(x, y) {
    this.normalized = { x: clamp(x, 0.03, 0.97), y: clamp(y, 0.08, 0.94) };
    this.queue.push({ ...this.normalized });
    if (this.queue.length > 128) this.queue.splice(0, this.queue.length - 128);
    this.wake();
  }
  nudge(x, y) {
    this.input(this.normalized.x + x, this.normalized.y + y);
  }
  ignite() {
    if (this.burning) return false;
    this.elapsed = 0;
    this.hasLit = true;
    this.burning = true;
    this.credit = 0;
    this.wake();
    return true;
  }
  clear() {
    this.particles = [];
    this.trails = [];
    this.smoke = [];
    this.wake();
  }
  restart() {
    this.burning = false;
    this.hasLit = false;
    this.elapsed = 0;
    this.rotation = 0;
    this.speed = 0;
    this.queue = [];
    this.clear();
    this.normalized = { x: 0.5, y: 0.42 };
    this.tip = this.world(0.5, 0.42);
    this.wake();
  }
  pickColor() {
    if (this.color === "rainbow")
      return SPARKLER_COLORS[Math.floor(this.random() * 6)].hex;
    return SPARKLER_COLORS.find((c) => c.id === this.color).hex;
  }
  spark(x, y, motion = 0) {
    if (this.particles.length >= this.cap) return;
    const angle = this.random() * Math.PI * 2,
      speed = (0.25 + this.random() * 2.3) * (0.5 + 0.5 * this.brightness);
    this.particles.push({
      x,
      y,
      px: x,
      py: y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed + 0.2,
      color: this.pickColor(),
      life: 0.28 + this.random() * 1.05,
      total: 1.33,
      size: (1.2 + this.random() * 2.4) * (1 + Math.min(motion, 15) * 0.025),
    });
  }
  path(from, to) {
    if (!this.burning) return;
    const dx = to.x - from.x,
      dy = to.y - from.y,
      d = Math.hypot(dx, dy);
    if (d < 0.001) return;
    const steps = Math.min(120, Math.max(1, Math.ceil(d / 0.045))),
      life = this.mode === "painting" ? 12 : 2.4;
    let previous = from;
    for (let i = 1; i <= steps; i++) {
      const next = {
        x: from.x + (dx * i) / steps,
        y: from.y + (dy * i) / steps,
      };
      this.trails.push({
        ax: previous.x,
        ay: previous.y,
        bx: next.x,
        by: next.y,
        color: this.pickColor(),
        born: this.time,
        life,
        width: 0.018 + Math.min(this.speed, 30) * 0.0016,
      });
      if (i % 2 === 0 && !this.reduced) this.spark(next.x, next.y, this.speed);
      previous = next;
    }
    if (this.trails.length > this.trailCap)
      this.trails.splice(0, this.trails.length - this.trailCap);
  }
  step(delta) {
    const dt = clamp(delta, 0, 0.1);
    this.time += dt;
    if (this.burning) {
      const oldLength = this.coatTip;
      this.elapsed = Math.min(BURN_SECONDS, this.elapsed + dt);
      const shortened = oldLength - this.coatTip;
      this.tip.x += Math.sin(this.rotation) * shortened;
      this.tip.y -= Math.cos(this.rotation) * shortened;
      this.normalized = {
        x: this.tip.x / this.width + 0.5,
        y: 0.5 - this.tip.y / 12,
      };
      if (this.elapsed >= BURN_SECONDS) this.burning = false;
    }
    let dx = 0,
      dy = 0;
    for (const input of this.queue) {
      const next = this.world(input.x, input.y),
        old = this.tip;
      dx += next.x - old.x;
      dy += next.y - old.y;
      this.speed = Math.min(
        40,
        Math.hypot(next.x - old.x, next.y - old.y) / Math.max(dt, 0.005),
      );
      this.path(old, next);
      this.tip = next;
      this.normalized = { ...input };
    }
    this.queue = [];
    const targetRotation = this.reduced
      ? 0
      : clamp(-dx * 1.2 + dy * 0.15, -0.32, 0.32);
    this.rotation +=
      (targetRotation - this.rotation) * (1 - Math.exp(-dt * 12));
    this.speed *= Math.exp(-dt * 6);
    if (this.burning) {
      this.credit +=
        dt * (this.reduced ? 45 : this.low ? 160 : 300) * this.brightness;
      const count = Math.floor(this.credit);
      this.credit -= count;
      for (let i = 0; i < count; i++)
        this.spark(this.tip.x, this.tip.y, this.speed);
      this.smokeCredit += dt * (this.low ? 5 : 9);
      if (this.smokeCredit >= 1) {
        this.smokeCredit %= 1;
        this.smoke.push({
          x: this.tip.x,
          y: this.tip.y,
          life: 1.8,
          total: 1.8,
          vx: (this.random() - 0.5) * 0.15,
          size: 0.1 + this.random() * 0.15,
        });
      }
    }
    for (const p of this.particles) {
      p.px = p.x;
      p.py = p.y;
      p.vx *= Math.exp(-dt * 0.8);
      p.vy = p.vy * Math.exp(-dt * 0.8) - 2.7 * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
    }
    this.particles = this.particles.filter((p) => p.life > 0).slice(-this.cap);
    for (const p of this.smoke) {
      p.x += p.vx * dt;
      p.y += dt * 0.3;
      p.size += dt * 0.12;
      p.life -= dt;
    }
    this.smoke = this.smoke.filter((p) => p.life > 0).slice(-40);
    this.trails = this.trails
      .filter((t) => this.time - t.born < t.life)
      .slice(-this.trailCap);
  }
  snapshot() {
    return {
      ready: true,
      burning: this.burning,
      hasLit: this.hasLit,
      remaining: this.remaining,
      progress: this.progress,
      mode: this.mode,
      color: this.color,
    };
  }
}
