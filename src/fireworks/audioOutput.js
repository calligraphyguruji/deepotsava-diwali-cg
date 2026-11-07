// Shared mix compression, 0–200% output gain, and a bounded soft peak limiter.
export function createFireworkOutput(ctx) {
  const input = ctx.createDynamicsCompressor();
  input.threshold.value = -12;
  input.knee.value = 12;
  input.ratio.value = 6;
  input.attack.value = 0.003;
  input.release.value = 0.18;
  const master = ctx.createGain(),
    limiter = ctx.createWaveShaper();
  const curve = new Float32Array(2048);
  for (let i = 0; i < curve.length; i++) {
    const x = (i / (curve.length - 1)) * 2 - 1,
      a = Math.abs(x);
    curve[i] =
      Math.sign(x) *
      (a <= 0.8 ? a : 0.8 + 0.18 * (1 - Math.exp(-(a - 0.8) / 0.18)));
  }
  limiter.curve = curve;
  limiter.oversample = "2x";
  input.connect(master);
  master.connect(limiter);
  limiter.connect(ctx.destination);
  return { input, master, limiter };
}
