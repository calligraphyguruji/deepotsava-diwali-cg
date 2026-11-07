// CC0 Ned Bouhalassa recording; synthetic match ignition is identified separately.
export class SparklerSound {
  constructor() {
    this.ctx = null;
    this.buffer = null;
    this.source = null;
    this.master = null;
    this.volume = 0.4;
    this.muted = false;
    this.disposed = false;
    this.loading = null;
    this.fallback = false;
    this.pops = new Set();
    this.nextPop = 0;
  }
  async prepare() {
    if (this.disposed) return;
    if (!this.ctx) {
      const Audio = window.AudioContext || window.webkitAudioContext;
      if (!Audio)
        throw new Error(
          "Audio is unavailable in this browser. The Fuljhadi remains interactive.",
        );
      this.ctx = new Audio();
      this.master = this.ctx.createGain();
      const limiter = this.ctx.createDynamicsCompressor();
      limiter.threshold.value = -16;
      limiter.ratio.value = 10;
      this.master.connect(limiter);
      limiter.connect(this.ctx.destination);
      this.setMix(this.volume, this.muted);
    }
    await this.ctx.resume();
    if (!this.loading)
      this.loading = (async () => {
        try {
          const res = await fetch("/audio/sparkler-recording.wav");
          if (!res.ok) throw new Error();
          this.buffer = await this.ctx.decodeAudioData(await res.arrayBuffer());
        } catch {
          this.fallback = true;
          const sr = this.ctx.sampleRate;
          this.buffer = this.ctx.createBuffer(1, sr * 4, sr);
          const data = this.buffer.getChannelData(0);
          let crack = 0;
          for (let i = 0; i < data.length; i++) {
            if (Math.random() < 100 / sr) crack = (Math.random() - 0.5) * 0.8;
            crack *= 0.96;
            data[i] = (Math.random() - 0.5) * 0.12 + crack;
          }
        }
        if (this.disposed) return;
        const fade = Math.floor(this.buffer.sampleRate * 0.025);
        for (let c = 0; c < this.buffer.numberOfChannels; c++) {
          const data = this.buffer.getChannelData(c);
          for (let i = 0; i < fade; i++) {
            data[i] *= i / fade;
            data[data.length - 1 - i] *= i / fade;
          }
        }
        let peak = 0.001,
          index = 0;
        const first = this.buffer.getChannelData(0);
        for (let i = fade; i < first.length - fade; i++)
          if (Math.abs(first[i]) > peak) {
            peak = Math.abs(first[i]);
            index = i;
          }
        const length = Math.min(
          Math.floor(this.buffer.sampleRate * 0.05),
          first.length,
        );
        this.pop = this.ctx.createBuffer(1, length, this.buffer.sampleRate);
        const out = this.pop.getChannelData(0),
          start = Math.max(
            0,
            Math.min(first.length - length, index - Math.floor(length * 0.15)),
          );
        for (let i = 0; i < length; i++)
          out[i] =
            (first[start + i] / peak) *
            0.65 *
            Math.min(1, i / (length * 0.12), (length - i) / (length * 0.3));
      })();
    await this.loading;
  }
  setMix(volume, muted) {
    this.volume = volume;
    this.muted = muted;
    if (this.master)
      this.master.gain.setTargetAtTime(
        muted ? 0 : volume,
        this.ctx.currentTime,
        0.03,
      );
  }
  start() {
    this.stop();
    if (!this.ctx || !this.buffer || this.disposed) return;
    const ctx = this.ctx,
      source = ctx.createBufferSource(),
      gain = ctx.createGain(),
      pan = ctx.createStereoPanner?.();
    source.buffer = this.buffer;
    source.loop = true;
    source.connect(gain);
    if (pan) {
      gain.connect(pan);
      pan.connect(this.master);
    } else gain.connect(this.master);
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.45, ctx.currentTime + 0.12);
    source.onended = () => {
      source.disconnect();
      gain.disconnect();
      pan?.disconnect();
    };
    source.start();
    this.source = source;
    this.nextPop = ctx.currentTime + 2.5;
    this.envelope = gain;
    this.pan = pan;
    // A short, original noisy match-strike, rather than an explosion.
    const ignition = ctx.createBuffer(
        1,
        Math.floor(ctx.sampleRate * 0.16),
        ctx.sampleRate,
      ),
      samples = ignition.getChannelData(0);
    for (let i = 0; i < samples.length; i++)
      samples[i] =
        (Math.random() * 2 - 1) * Math.exp((-i / samples.length) * 7) * 0.22;
    const match = ctx.createBufferSource();
    match.buffer = ignition;
    match.connect(this.master);
    match.onended = () => match.disconnect();
    match.start();
    this.match = match;
  }
  update(progress, position = 0.5) {
    if (!this.source) return;
    const remaining = 1 - progress,
      level =
        0.45 *
        (0.25 + 0.75 * Math.pow(Math.max(0, remaining), 0.35)) *
        Math.min(1, remaining * 8);
    this.envelope.gain.setTargetAtTime(
      Math.max(0.0001, level),
      this.ctx.currentTime,
      0.12,
    );
    if (this.pop && progress < 0.96 && this.ctx.currentTime >= this.nextPop) {
      this.nextPop = this.ctx.currentTime + 2 + Math.random() * 3;
      const pop = this.ctx.createBufferSource();
      pop.buffer = this.pop;
      pop.connect(this.envelope);
      this.pops.add(pop);
      pop.onended = () => {
        pop.disconnect();
        this.pops.delete(pop);
      };
      pop.start();
    }
    if (this.pan)
      this.pan.pan.setTargetAtTime(
        (position - 0.5) * 1.4,
        this.ctx.currentTime,
        0.06,
      );
  }
  stop() {
    for (const pop of this.pops) {
      try {
        pop.stop();
      } catch {}
    }
    this.pops.clear();
    if (this.source) {
      try {
        this.source.stop();
      } catch {}
      this.source = null;
    }
    if (this.match) {
      try {
        this.match.stop();
      } catch {}
      this.match = null;
    }
  }
  suspend() {
    if (this.ctx) void this.ctx.suspend();
  }
  resume() {
    if (this.ctx && !this.disposed) return this.ctx.resume();
  }
  dispose() {
    this.disposed = true;
    this.stop();
    void this.ctx?.close();
    this.buffer = null;
  }
}
