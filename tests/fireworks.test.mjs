import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { FireworkEngine, BEHAVIORS } from "../src/fireworks/engine.js";
import { FIREWORKS, FINALE } from "../src/fireworks/catalog.js";
import { FireworkAudio, SOUND_PROFILES } from "../src/fireworks/audio.js";
const run = (engine, seconds) => {
  for (let i = 0; i < Math.ceil(seconds * 50); i++) engine.step(0.02);
};
for (const def of FIREWORKS.filter((f) => f.id !== "finale")) {
  test(`${def.name}: distinct active behavior, phase sound events, and complete cleanup`, () => {
    const sounds = [],
      g = new FireworkEngine({ sound: (e) => sounds.push(e) });
    assert.equal(typeof BEHAVIORS[def.id], "function");
    assert.ok(g.launch(def.id, { x: 0.45, y: 0.25 }));
    run(g, 0.6);
    assert.ok(
      g.particles.length > 0 || g.emitters.some((e) => e.head),
      "effect emits particles or a moving lantern",
    );
    assert.ok(sounds.some((e) => e.id === def.id && e.phase === "ignite"));
    if (def.zone === "ground")
      assert.equal(g.emitters.find((e) => e.id === def.id).y, g.ground);
    run(g, 16);
    assert.equal(g.busy, false);
    assert.equal(g.particles.length, 0);
    if (["rocket", "whistle", "shell", "bomb"].includes(def.id))
      assert.ok(sounds.some((e) => e.id === def.id && e.phase === "burst"));
    if (def.id === "ladi")
      assert.ok(sounds.filter((e) => e.phase === "pop").length >= 25);
    if (def.id === "multishot")
      assert.equal(sounds.filter((e) => e.phase === "thump").length, 6);
  });
}
test("all effects coexist within a hard particle budget in low and reduced-motion modes", () => {
  for (const reduced of [false, true]) {
    const g = new FireworkEngine({ low: true, reduced });
    for (const def of FIREWORKS.filter((d) => d.id !== "finale"))
      g.launch(def.id);
    for (let i = 0; i < 1800; i++) {
      g.step(0.02);
      assert.ok(g.particles.length <= g.cap);
      if (reduced) assert.equal(g.shake, 0);
    }
    assert.equal(g.busy, false);
  }
});
test("finale covers each act, completes exactly once at 26 seconds, and is cancellable", () => {
  const sounds = [];
  let complete = 0;
  const g = new FireworkEngine({
    sound: (e) => sounds.push(e),
    finale: () => complete++,
  });
  assert.ok(g.startFinale());
  assert.equal(g.startFinale(), false);
  run(g, 25.8);
  assert.equal(complete, 0);
  run(g, 0.4);
  assert.equal(complete, 1);
  for (const id of [
    "lantern",
    "fountain",
    "whistle",
    "rocket",
    "multishot",
    "rain",
    "shell",
    "color",
  ])
    assert.ok(sounds.some((e) => e.id === id));
  run(g, 10);
  assert.equal(complete, 1);
  assert.equal(g.busy, false);
  g.startFinale();
  run(g, 2);
  g.stop();
  const count = sounds.length;
  run(g, 30);
  assert.equal(complete, 1);
  assert.equal(sounds.length, count);
  assert.equal(g.busy, false);
  assert.ok(FINALE.every(([t]) => t >= 0 && t < 26));
});
test("positions are clamped; rocket, whistle and shell explode at different times", () => {
  const times = [];
  const g = new FireworkEngine({
    sound: (e) => {
      if (e.phase === "burst") times.push([e.id, g.time]);
    },
  });
  for (const id of ["rocket", "whistle", "shell"])
    g.launch(id, { x: 2, y: -1 });
  run(g, 2);
  assert.deepEqual(
    times.map((a) => a[0]),
    ["rocket", "whistle", "shell"],
  );
  assert.ok(times[1][1] > times[0][1]);
  assert.ok(times[2][1] > times[1][1]);
  assert.equal(g.emitters[0].x, 950);
  assert.equal(g.emitters[0].y, g.height * 0.1);
  assert.equal(g.launch("missing"), false);
});
test("recording files and attribution are bundled, and designed sound profiles differ", async () => {
  assert.equal(
    new Set(Object.values(SOUND_PROFILES).map((x) => JSON.stringify(x))).size,
    13,
  );
  const wav = await readFile("public/audio/sparkler-recording.wav");
  assert.equal(wav.toString("ascii", 0, 4), "RIFF");
  assert.ok(wav.length > 100000);
  for (const file of ["rocket-recording.mp3", "firecracker-recording.mp3"]) {
    const data = await readFile("public/audio/" + file);
    assert.ok(data.length > 30000);
    assert.ok(!data.toString("utf8", 0, 60).includes("<html"));
  }
  assert.match(await readFile("public/audio/ATTRIBUTION.md", "utf8"), /CC0/);
});
test("audio starts only after preparation; per-type layers, mute, mixing limit, and disposal work", async () => {
  let created = 0;
  const starts = [];
  const oldWindow = globalThis.window,
    oldFetch = globalThis.fetch;
  const param = () => ({
    value: 0,
    setValueAtTime() {},
    exponentialRampToValueAtTime() {},
    setTargetAtTime(v) {
      this.value = v;
    },
  });
  const node = () => ({ connect() {}, disconnect() {} });
  function buffer(channels, length, sr) {
    const arrays = Array.from({ length: channels }, () =>
      new Float32Array(length).fill(0.1),
    );
    return {
      length,
      sampleRate: sr,
      numberOfChannels: channels,
      duration: length / sr,
      getChannelData: (c) => arrays[c],
      copyToChannel: (data, c) => arrays[c].set(data),
    };
  }
  class AudioContext {
    constructor() {
      created++;
      this.sampleRate = 8000;
      this.currentTime = 0;
      this.state = "suspended";
      this.destination = node();
    }
    async resume() {
      this.state = "running";
    }
    async suspend() {
      this.state = "suspended";
    }
    async close() {
      this.state = "closed";
    }
    createGain() {
      return { ...node(), gain: param() };
    }
    createDynamicsCompressor() {
      return {
        ...node(),
        threshold: param(),
        knee: param(),
        ratio: param(),
        attack: param(),
        release: param(),
      };
    }
    createStereoPanner() {
      return { ...node(), pan: param() };
    }
    createBuffer(...args) {
      return buffer(...args);
    }
    async decodeAudioData() {
      return buffer(1, 36000, 8000);
    }
    createBufferSource() {
      return {
        ...node(),
        playbackRate: param(),
        start(t) {
          starts.push({ kind: "sample", t, rate: this.playbackRate.value });
        },
        stop(t) {
          if (t === 0) this.onended?.();
        },
      };
    }
    createOscillator() {
      return {
        ...node(),
        frequency: param(),
        start(t) {
          starts.push({ kind: "tone", t });
        },
        stop(t) {
          if (t === 0) this.onended?.();
        },
      };
    }
  }
  globalThis.window = { AudioContext };
  globalThis.fetch = async () => ({
    ok: true,
    arrayBuffer: async () => new ArrayBuffer(4),
  });
  try {
    const a = new FireworkAudio();
    assert.equal(created, 0);
    await a.prepare();
    assert.equal(created, 1);
    assert.equal(starts.length, 0);
    assert.equal(Object.keys(a.buffers).length, 3);
    for (const id of Object.keys(SOUND_PROFILES)) {
      const before = starts.length;
      for (const phase of ["ignite", "burst", "pop", "thump"])
        a.play({ id, phase, x: 0.25, distance: 0.7, duration: 4.5 });
      assert.ok(starts.length > before, `${id} has audible layers`);
      assert.ok(a.voices.size <= 40);
    }
    assert.ok(starts.some((e) => e.kind === "tone"));
    assert.ok(starts.some((e) => e.kind === "sample" && e.rate !== 1));
    a.setVolume(0.2);
    assert.equal(a.master.gain.value, 0.2);
    a.setMuted(true);
    assert.equal(a.master.gain.value, 0);
    const count = starts.length;
    a.play({ id: "rocket", phase: "ignite" });
    assert.equal(starts.length, count);
    a.setMuted(false);
    a.dispose();
    assert.equal(a.ctx.state, "closed");
    assert.equal(a.voices.size, 0);
  } finally {
    globalThis.window = oldWindow;
    globalThis.fetch = oldFetch;
  }
});
