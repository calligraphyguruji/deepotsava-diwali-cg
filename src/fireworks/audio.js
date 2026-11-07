import { createFireworkOutput } from "./audioOutput.js";
const SOURCES = {
  sparkler: "/audio/sparkler-recording.wav",
  rocket: "/audio/rocket-recording.mp3",
  cracker: "/audio/firecracker-recording.mp3",
};
export const SOUND_PROFILES = {
  sparkler: { bright: 0.8, rate: 110, pulse: 0 },
  fountain: { bright: 0.72, rate: 210, pulse: 7 },
  spinner: { bright: 0.6, rate: 80, pulse: 28 },
  lantern: { bright: 0.035, rate: 7, pulse: 0.8 },
  color: { bright: 0.9, rate: 130, pulse: 4 },
  rain: { bright: 0.95, rate: 45, pulse: 13 },
  butterfly: { bright: 0.55, rate: 65, pulse: 18 },
  rocket: { bright: 0.7, rate: 45, pulse: 2 },
  whistle: { bright: 0.4, rate: 25, pulse: 3 },
  bomb: { bright: 0.7, rate: 30, pulse: 0 },
  ladi: { bright: 0.8, rate: 250, pulse: 33 },
  shell: { bright: 0.15, rate: 10, pulse: 0 },
  multishot: { bright: 0.3, rate: 35, pulse: 0 },
};
export class FireworkAudio {
  constructor() {
    this.ctx = null;
    this.voices = new Set();
    this.buffers = {};
    this.cache = new Map();
    this.volume = 2;
    this.muted = false;
    this.loading = null;
    this.disposed = false;
    this.fallback = false;
  }
  async prepare() {
    if (this.disposed) return;
    if (!this.ctx) {
      const Audio = window.AudioContext || window.webkitAudioContext;
      if (!Audio)
        throw new Error(
          "This browser cannot play Web Audio. Visual fireworks are still available.",
        );
      this.ctx = new Audio();
      const output = createFireworkOutput(this.ctx);
      this.master = output.master;
      this.bus = output.input;
      this.limiter = output.limiter;
      this.setVolume(this.volume);
    }
    await this.ctx.resume();
    if (!this.loading)
      this.loading = Promise.all(
        Object.entries(SOURCES).map(async ([id, url]) => {
          try {
            const response = await fetch(url);
            if (!response.ok) throw new Error();
            const buffer = await this.ctx.decodeAudioData(
              await response.arrayBuffer(),
            );
            if (!this.disposed) this.buffers[id] = buffer;
          } catch {
            this.fallback = true;
          }
        }),
      );
    await this.loading;
  }
  setVolume(value) {
    this.volume = Math.max(0, Math.min(2, value));
    if (this.master)
      this.master.gain.setTargetAtTime(
        this.muted ? 0 : this.volume,
        this.ctx.currentTime,
        0.02,
      );
  }
  setMuted(value) {
    this.muted = value;
    this.setVolume(this.volume);
    if (value) this.stop();
  }
  segment(id, offset = 0, length) {
    const key = `${id}:${offset}:${length}`;
    if (this.cache.has(key)) return this.cache.get(key);
    const src = this.buffers[id];
    if (!src) return null;
    const size = Math.max(
      1,
      Math.min(
        src.length - Math.floor(offset * src.sampleRate),
        Math.floor((length ?? src.duration) * src.sampleRate),
      ),
    );
    const out = this.ctx.createBuffer(
      src.numberOfChannels,
      size,
      src.sampleRate,
    );
    let peak = 0.001;
    for (let c = 0; c < src.numberOfChannels; c++) {
      const data = src
        .getChannelData(c)
        .subarray(
          Math.floor(offset * src.sampleRate),
          Math.floor(offset * src.sampleRate) + size,
        );
      out.copyToChannel(data, c);
      for (const v of data) peak = Math.max(peak, Math.abs(v));
    }
    for (let c = 0; c < out.numberOfChannels; c++) {
      const data = out.getChannelData(c);
      for (let i = 0; i < data.length; i++) data[i] *= 0.8 / peak;
    }
    if (this.cache.size >= 24)
      this.cache.delete(this.cache.keys().next().value);
    this.cache.set(key, out);
    return out;
  }
  noise(id, duration) {
    const key = `noise:${id}:${duration}`;
    if (this.cache.has(key)) return this.cache.get(key);
    const p = SOUND_PROFILES[id] || SOUND_PROFILES.rocket,
      sr = this.ctx.sampleRate,
      buffer = this.ctx.createBuffer(1, Math.ceil(sr * duration), sr),
      d = buffer.getChannelData(0);
    let low = 0,
      click = 0;
    for (let i = 0; i < d.length; i++) {
      const t = i / sr,
        white = Math.random() * 2 - 1;
      low = low * 0.97 + white * 0.03;
      if (Math.random() < p.rate / sr)
        click = (Math.random() > 0.5 ? 1 : -1) * 0.65;
      click *= 0.97;
      const fade = Math.min(1, t / 0.04, (duration - t) / 0.15),
        pulse = p.pulse ? 0.55 + 0.45 * Math.sin(t * p.pulse * Math.PI * 2) : 1;
      const build =
        id === "fountain" || id === "color"
          ? 0.3 + 0.7 * Math.sin((t / duration) * Math.PI)
          : id === "rain"
            ? 1 - t / duration
            : 1;
      d[i] = Math.max(
        -0.95,
        Math.min(
          0.95,
          ((white * p.bright + low * (1 - p.bright) * 5) * 0.25 * pulse +
            click) *
            fade *
            build,
        ),
      );
    }
    if (this.cache.size >= 24)
      this.cache.delete(this.cache.keys().next().value);
    this.cache.set(key, buffer);
    return buffer;
  }
  connect(source, volume, x, duration, delay = 0, rate = 1) {
    if (this.voices.size >= 40) {
      const oldest = this.voices.values().next().value;
      try {
        oldest.stop();
      } catch {}
      this.voices.delete(oldest);
    }
    const ctx = this.ctx,
      gain = ctx.createGain(),
      pan = ctx.createStereoPanner?.();
    source.playbackRate && (source.playbackRate.value = rate);
    gain.gain.value = volume;
    source.connect(gain);
    if (pan) {
      pan.pan.value = (x - 0.5) * 1.7;
      gain.connect(pan);
      pan.connect(this.bus);
    } else gain.connect(this.bus);
    source.onended = () => {
      source.disconnect();
      gain.disconnect();
      pan?.disconnect();
      this.voices.delete(source);
    };
    this.voices.add(source);
    source.start(ctx.currentTime + delay);
    source.stop(ctx.currentTime + delay + duration);
  }
  sample(buffer, volume, x, { delay = 0, rate = 1, duration } = {}) {
    if (!buffer) return;
    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    this.connect(
      source,
      volume,
      x,
      duration ?? buffer.duration / rate,
      delay,
      rate,
    );
  }
  tone(start, end, duration, volume, x, delay = 0) {
    const ctx = this.ctx,
      o = ctx.createOscillator(),
      gain = ctx.createGain(),
      now = ctx.currentTime + delay;
    o.type = "sine";
    o.frequency.setValueAtTime(start, now);
    o.frequency.exponentialRampToValueAtTime(Math.max(20, end), now + duration);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(volume, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    // The envelope is part of this oscillator's signal before the common spatial mixer.
    o.connect(gain);
    const proxy = {
      connect: (n) => gain.connect(n),
      disconnect: () => {
        o.disconnect();
        gain.disconnect();
      },
      start: (t) => o.start(t),
      stop: (t) => o.stop(t),
      set onended(fn) {
        o.onended = fn;
      },
    };
    this.connect(proxy, 1, x, duration, delay);
  }
  play({ id, phase, x = 0.5, distance = 0.4, duration = 1 }) {
    if (
      !this.ctx ||
      this.muted ||
      this.disposed ||
      this.ctx.state === "suspended"
    )
      return;
    const far = 1 - distance * 0.6;
    if (phase === "burst" || phase === "pop") {
      const cracker = id === "bomb" || id === "ladi";
      const buffer = cracker
        ? this.segment("cracker", 0.015, id === "ladi" ? 0.17 : 1.45)
        : this.segment("rocket", 1.14, 1.2);
      const rate = id === "shell" ? 0.72 : id === "ladi" ? 1.2 : 1;
      this.sample(
        buffer || this.noise(id, 0.45),
        far * (id === "ladi" ? 0.23 : 0.5),
        x,
        { rate },
      );
      if (id === "shell") {
        this.tone(95, 28, 0.8, 0.12, x);
        this.sample(buffer, 0.1 * far, x, { delay: 0.22, rate: 0.85 });
        this.sample(buffer, 0.05 * far, x, { delay: 0.5, rate: 0.7 });
      }
      return;
    }
    if (phase === "thump") {
      this.tone(130, 32, 0.2, 0.15, x);
      return;
    }
    if (id === "sparkler") {
      this.sample(
        this.segment("sparkler", 0, Math.min(4.5, duration)) ||
          this.noise(id, Math.min(4.5, duration)),
        0.36,
        x,
      );
      return;
    }
    if (id === "rocket" || id === "whistle") {
      const flight = id === "whistle" ? 1.65 : 1.25;
      const intro = this.segment("rocket", 0, 1.13);
      this.sample(intro || this.noise(id, flight), 0.25 * far, x, {
        rate: 1.13 / flight,
      });
      if (id === "whistle") this.tone(1100, 2800, 1.5, 0.045, x, 0.1);
      return;
    }
    if (id === "shell") {
      this.tone(110, 28, 0.25, 0.18, x);
      this.sample(this.noise("rocket", 1.75), 0.12, x);
      return;
    }
    if (id === "multishot" || id === "ladi") return; // Their sounds are driven by the individual thump/pop events.
    const length =
      id === "bomb"
        ? 0.8
        : id === "lantern"
          ? duration
          : Math.min(duration, 5.8);
    this.sample(
      this.noise(id, length),
      id === "lantern" ? 0.13 : id === "bomb" ? 0.16 : 0.3,
      x,
    );
    if (id === "butterfly") {
      for (let i = 0; i < 8; i++)
        this.tone(
          900 + (i % 3) * 250,
          1800 - (i % 3) * 200,
          0.22,
          0.018,
          x,
          i * 0.4,
        );
    }
  }
  stop() {
    for (const voice of this.voices) {
      try {
        voice.stop(this.ctx.currentTime);
      } catch {}
    }
    this.voices.clear();
  }
  suspend() {
    if (this.ctx) {
      this.stop();
      void this.ctx.suspend();
    }
  }
  resume() {
    if (this.ctx && !this.disposed) return this.ctx.resume();
  }
  dispose() {
    this.disposed = true;
    this.stop();
    void this.ctx?.close();
    this.cache.clear();
  }
}
