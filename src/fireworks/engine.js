import { BY_ID, FINALE, PALETTE } from "./catalog.js";
const TAU = Math.PI * 2;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const rand = (a, b) => a + Math.random() * (b - a);
const gold = "#ffce75";

export class FireworkEngine {
  constructor({
    sound = () => {},
    finale = () => {},
    low = false,
    reduced = false,
  } = {}) {
    this.sound = sound;
    this.onFinale = finale;
    this.low = low;
    this.reduced = reduced;
    this.time = 0;
    this.height = 650;
    this.particles = [];
    this.emitters = [];
    this.events = [];
    this.flash = 0;
    this.shake = 0;
    this.finaleUntil = 0;
    this.launched = 0;
    this.lastCost = 0;
  }
  get cap() {
    return this.reduced ? 240 : this.low ? 900 : 3200;
  }
  get ground() {
    return this.height * 0.84;
  }
  get busy() {
    return (
      this.particles.length > 0 ||
      this.emitters.length > 0 ||
      this.events.length > 0 ||
      this.finaleUntil > this.time
    );
  }
  schedule(delay, fn) {
    this.events.push({ at: this.time + delay, fn });
  }
  audio(id, phase, x, y, duration) {
    this.sound({
      id,
      phase,
      x: clamp(x / 1000, 0, 1),
      distance: clamp(1 - y / this.height, 0, 1),
      duration,
    });
  }
  launch(id, position = { x: 0.5, y: 0.3 }) {
    const def = BY_ID[id];
    if (!def) return false;
    if (id === "finale") {
      return this.startFinale();
    }
    if (this.emitters.length >= 24) return false;
    const x = clamp(position.x, 0.05, 0.95) * 1000;
    const y =
      def.zone === "ground"
        ? this.ground
        : clamp(position.y, 0.1, 0.58) * this.height;
    this.emitters.push({
      id,
      x,
      y,
      start: this.time,
      life: 0,
      credit: 0,
      pop: -1,
      burst: false,
      duration: def.duration,
      seed: Math.random() * 100,
    });
    this.launched++;
    return true;
  }
  startFinale() {
    if (this.finaleUntil > this.time) return false;
    this.finaleUntil = this.time + 26;
    for (const [at, id, x, y] of FINALE)
      this.schedule(at, () => this.launch(id, { x, y }));
    this.schedule(26, () => {
      this.finaleUntil = 0;
      this.onFinale();
    });
    return true;
  }
  stop() {
    this.events = [];
    this.emitters = [];
    this.particles = [];
    this.finaleUntil = 0;
    this.flash = 0;
    this.shake = 0;
  }
  particle(
    x,
    y,
    vx,
    vy,
    color = gold,
    life = 1.8,
    gravity = 130,
    kind = "spark",
    size = 1.5,
  ) {
    if (this.particles.length >= this.cap) return;
    this.particles.push({
      x,
      y,
      px: x,
      py: y,
      vx,
      vy,
      color,
      life,
      total: life,
      gravity,
      kind,
      size,
      drag: kind === "smoke" ? 0.15 : 0.65,
    });
  }
  smoke(x, y, scale = 1) {
    this.particle(
      x,
      y,
      rand(-10, 10),
      rand(-24, -10),
      "#8b7c95",
      rand(1.5, 3),
      -4,
      "smoke",
      rand(14, 25) * scale,
    );
  }
  spray(e, dt, rate, fn) {
    e.credit += dt * rate * (this.reduced ? 0.18 : this.low ? 0.5 : 1);
    const count = Math.min(50, Math.floor(e.credit));
    e.credit -= count;
    for (let i = 0; i < count; i++) fn();
  }
  sphere(x, y, color, count = 200, speed = 190, life = 2.4) {
    for (
      let i = 0;
      i < count * (this.reduced ? 0.2 : this.low ? 0.55 : 1);
      i++
    ) {
      const z = rand(-1, 1),
        a = rand(0, TAU),
        r = Math.sqrt(1 - z * z) * rand(0.6, 1);
      this.particle(
        x,
        y,
        Math.cos(a) * speed * r,
        Math.sin(a) * speed * r,
        color,
        rand(life * 0.65, life),
        60,
        "spark",
        rand(1, 2.5) * (1 + z * 0.3),
      );
    }
    this.flash = Math.max(this.flash, this.reduced ? 0.12 : 0.5);
    this.smoke(x, y, 2);
  }
  burst(e, color = PALETTE[Math.floor(rand(0, PALETTE.length))], size = 1) {
    this.sphere(e.x, e.y, color, 220 * size, 190 * size, 2.6);
    this.audio(e.id, "burst", e.x, e.y);
  }
  rocket(e, t, dt, { delay = 0.15, flight = 1.1, shell = false } = {}) {
    if (t < delay) {
      e.head = { x: e.x, y: this.ground };
      this.spray(e, dt, 70, () =>
        this.particle(
          e.x,
          this.ground,
          rand(-25, 25),
          rand(-45, -10),
          gold,
          0.4,
        ),
      );
      return;
    }
    const p = clamp((t - delay) / flight, 0, 1);
    const hx = e.x + Math.sin(p * 8 + e.seed) * (e.id === "whistle" ? 8 : 2),
      hy = this.ground + (e.y - this.ground) * p * p;
    e.head = { x: hx, y: hy };
    if (p < 1) {
      this.spray(e, dt, 180, () =>
        this.particle(
          hx,
          hy,
          rand(-15, 15),
          rand(20, 80),
          gold,
          rand(0.2, 0.7),
          40,
        ),
      );
      if (Math.random() < dt * 10) this.smoke(hx, hy, 0.5);
    } else if (!e.burst) {
      e.burst = true;
      e.head = null;
      this.burst(
        e,
        e.id === "whistle" ? "#ff8ac6" : shell ? "#a4dfff" : undefined,
        shell ? 1.5 : 1,
      );
      if (shell) {
        this.schedule(0.35, () =>
          this.sphere(e.x, e.y, "#ffdca1", 100, 115, 3),
        );
      }
    }
  }
  updateEmitter(e, dt) {
    const t = this.time - e.start;
    e.life = t;
    if (!e.ignited) {
      e.ignited = true;
      this.audio(e.id, "ignite", e.x, e.y, Math.max(0.1, e.duration - t));
    }
    const behavior = BEHAVIORS[e.id];
    if (behavior) behavior(this, e, t, dt);
  }
  step(delta) {
    const dt = clamp(delta, 0, 0.05);
    this.time += dt;
    const ready = this.events.filter((event) => event.at <= this.time);
    this.events = this.events.filter((event) => event.at > this.time);
    ready.forEach((event) => event.fn());
    for (const e of this.emitters) this.updateEmitter(e, dt);
    this.emitters = this.emitters.filter((e) => e.life < e.duration);
    for (const p of this.particles) {
      p.px = p.x;
      p.py = p.y;
      const drag = Math.exp(-p.drag * dt);
      p.vx *= drag;
      p.vy = p.vy * drag + p.gravity * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
    }
    this.particles = this.particles.filter(
      (p) => p.life > 0 && p.y < this.height + 80,
    );
    this.flash = Math.max(0, this.flash - dt * 1.6);
    this.shake = Math.max(0, this.shake - dt * 7);
  }
}

export const BEHAVIORS = {
  sparkler(g, e, t, dt) {
    e.tip = {
      x: e.x + 20 - (t / 4.5) * 13,
      y: g.ground - 120 + (t / 4.5) * 55,
    };
    if (t < 4.25)
      g.spray(e, dt, 210, () => {
        const a = rand(0, TAU),
          s = rand(25, 155);
        g.particle(
          e.tip.x,
          e.tip.y,
          Math.cos(a) * s,
          Math.sin(a) * s,
          gold,
          rand(0.3, 1.3),
          150,
        );
      });
    if (Math.random() < dt * 5) g.smoke(e.tip.x, e.tip.y, 0.45);
  },
  rocket(g, e, t, dt) {
    g.rocket(e, t, dt);
  },
  whistle(g, e, t, dt) {
    g.rocket(e, t, dt, { delay: 0.2, flight: 1.45 });
  },
  shell(g, e, t, dt) {
    g.rocket(e, t, dt, { delay: 0.25, flight: 1.5, shell: true });
  },
  bomb(g, e, t, dt) {
    if (t < 0.8)
      g.spray(e, dt, 40, () =>
        g.particle(
          e.x + 8,
          g.ground - 18,
          rand(-25, 25),
          rand(-45, -10),
          gold,
          0.3,
        ),
      );
    else if (!e.burst) {
      e.burst = true;
      g.flash = g.reduced ? 0.25 : 0.9;
      g.shake = g.reduced ? 0 : 1;
      g.sphere(e.x, g.ground - 15, "#fff1bc", 130, 240, 0.7);
      for (let i = 0; i < 10; i++)
        g.smoke(e.x + rand(-25, 25), g.ground - 15, 2);
      g.audio(e.id, "burst", e.x, e.y);
    }
  },
  fountain(g, e, t, dt) {
    const power = Math.sin(clamp(t / 5, 0, 1) * Math.PI);
    g.spray(e, dt, 380, () =>
      g.particle(
        e.x + rand(-5, 5),
        g.ground - 20,
        rand(-65, 65) * power,
        -rand(130, 410) * power,
        gold,
        rand(1.1, 2.5),
        190,
      ),
    );
    if (Math.random() < dt * 12) g.smoke(e.x, g.ground - 25);
    g.flash = Math.max(g.flash, 0.035 * power);
  },
  spinner(g, e, t, dt) {
    const speed = Math.sin(clamp(t / 4.4, 0, 1) * Math.PI);
    e.angle = t * t * 20;
    g.spray(e, dt, 280, () => {
      const a = e.angle + rand(-0.25, 0.25),
        v = rand(90, 210) * speed;
      g.particle(
        e.x + Math.cos(a) * 12,
        g.ground + Math.sin(a) * 4,
        Math.cos(a) * v,
        Math.sin(a) * v * 0.26 - 20,
        gold,
        rand(0.5, 1.4),
        55,
      );
    });
    if (Math.random() < dt * 5) g.smoke(e.x, g.ground, 1.2);
  },
  lantern(g, e, t) {
    e.head = {
      x: e.x + Math.sin(t * 0.8 + e.seed) * 20,
      y: g.ground - 45 - t * 55,
    };
  },
  ladi(g, e, t) {
    const index = Math.min(31, Math.floor(t * 10));
    if (index > e.pop && t < 3.2) {
      e.pop = index;
      const x = e.x - 65 + index * 4;
      g.sphere(x, g.ground - 7, index % 3 ? "#ffc17a" : "#ff8f9a", 24, 80, 0.4);
      g.smoke(x, g.ground - 8, 0.65);
      g.audio(e.id, "pop", x, g.ground);
      g.flash = Math.max(g.flash, 0.15);
    }
  },
  multishot(g, e, t) {
    const index = Math.floor(t / 0.62);
    if (index > e.pop && index < 6) {
      e.pop = index;
      g.audio(e.id, "thump", e.x, g.ground);
      g.launch("rocket", {
        x: clamp(e.x / 1000 + (index - 2.5) * 0.045, 0.08, 0.92),
        y: clamp(e.y / g.height + (index % 2) * 0.1, 0.12, 0.5),
      });
    }
  },
  color(g, e, t, dt) {
    const power = Math.sin(clamp(t / 4.8, 0, 1) * Math.PI),
      color = PALETTE[Math.floor(t * 2) % PALETTE.length];
    g.spray(e, dt, 330, () => {
      const a = -Math.PI / 2 + Math.sin(t * 3) * 0.5 + rand(-0.18, 0.18),
        v = rand(130, 350) * power;
      g.particle(
        e.x,
        g.ground - 15,
        Math.cos(a) * v,
        Math.sin(a) * v,
        color,
        rand(1, 2),
        145,
        "spark",
        2,
      );
    });
    if (Math.random() < dt * 8) g.smoke(e.x, g.ground - 20);
  },
  rain(g, e, t, dt) {
    if (t < 3.2)
      g.spray(e, dt, 150, () =>
        g.particle(
          e.x + rand(-240, 240),
          e.y + rand(-35, 35),
          rand(-18, 18),
          rand(18, 45),
          gold,
          rand(2, 4),
          18,
          "rain",
          rand(1, 2),
        ),
      );
  },
  butterfly(g, e, t, dt) {
    e.head = {
      x: e.x + Math.sin(t * 3) * t * 24,
      y: g.ground - 35 - Math.abs(Math.sin(t * 2)) * t * 25,
    };
    g.spray(e, dt, 170, () => {
      const a = t * 28,
        s = rand(45, 115);
      g.particle(
        e.head.x,
        e.head.y,
        Math.cos(a) * s,
        Math.sin(a) * s,
        "#b0e9ad",
        rand(0.4, 1),
        35,
      );
      g.particle(
        e.head.x,
        e.head.y,
        -Math.cos(a) * s,
        -Math.sin(a) * s,
        "#ffb1dc",
        rand(0.4, 1),
        35,
      );
    });
  },
};
