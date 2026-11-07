import test from "node:test";
import assert from "node:assert/strict";
import { build } from "esbuild";
import { JSDOM } from "jsdom";
import { mkdir, rm } from "node:fs/promises";

test("Fuljhadi mouse/touch drag, live colors, modes, accessible movement, clear, PNG, burnout and restart", async () => {
  const dom = new JSDOM(
      '<div id="root"></div><div id="palette"></div><div id="tools"></div>',
      { url: "http://localhost/fireworks", pretendToBeVisual: true },
    ),
    w = dom.window;
  for (const k of [
    "window",
    "document",
    "HTMLElement",
    "Element",
    "HTMLCanvasElement",
    "HTMLInputElement",
    "Event",
    "MouseEvent",
    "CustomEvent",
    "SVGElement",
  ])
    globalThis[k] = k === "window" ? w : w[k];
  Object.defineProperty(globalThis, "navigator", {
    value: w.navigator,
    configurable: true,
  });
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  globalThis.ResizeObserver = class {
    observe() {}
    disconnect() {}
  };
  w.HTMLElement.prototype.getBoundingClientRect = () => ({
    left: 0,
    top: 0,
    width: 390,
    height: 500,
  });
  let captured = false,
    painted = 0,
    filename = "",
    now = 0,
    next = 1;
  w.HTMLElement.prototype.setPointerCapture = () => {
    captured = true;
  };
  w.HTMLElement.prototype.hasPointerCapture = () => captured;
  w.HTMLElement.prototype.releasePointerCapture = () => {
    captured = false;
  };
  const frames = new Map();
  globalThis.requestAnimationFrame = (fn) => {
    const id = next++;
    frames.set(id, fn);
    return id;
  };
  globalThis.cancelAnimationFrame = (id) => frames.delete(id);
  const ctx = new Proxy(
    {
      stroke() {
        painted++;
      },
    },
    {
      get: (o, k) => (k in o ? o[k] : () => {}),
      set: (o, k, v) => {
        o[k] = v;
        return true;
      },
    },
  );
  w.HTMLCanvasElement.prototype.getContext = () => ctx;
  w.HTMLCanvasElement.prototype.toBlob = function (cb) {
    cb(new Blob(["artwork"], { type: "image/png" }));
  };
  w.HTMLAnchorElement.prototype.click = function () {
    filename = this.download;
  };
  const oldURL = URL.createObjectURL,
    oldRevoke = URL.revokeObjectURL;
  URL.createObjectURL = () => "blob:art";
  URL.revokeObjectURL = () => {};
  globalThis.__sparklerAudio = {
    starts: 0,
    stops: 0,
    muted: false,
    volume: 0.4,
    disposed: 0,
    progress: 0,
  };
  const dir = new URL("../.test-sparkler/", import.meta.url);
  await mkdir(dir, { recursive: true });
  await build({
    entryPoints: ["src/fireworks/sparkler/SparklerExperience.jsx"],
    outfile: ".test-sparkler/Experience.mjs",
    bundle: true,
    platform: "node",
    format: "esm",
    jsx: "automatic",
    loader: { ".css": "empty" },
    external: ["react", "react-dom", "react-dom/*", "lucide-react"],
    plugins: [
      {
        name: "gpu-and-audio-platform-substitutes",
        setup(b) {
          b.onResolve({ filter: /^@react-three\/fiber$/ }, () => ({
            path: "fiber",
            namespace: "mock",
          }));
          b.onResolve({ filter: /SparklerScene$/ }, () => ({
            path: "scene",
            namespace: "mock",
          }));
          b.onResolve({ filter: /^\.\/sound.js$/ }, () => ({
            path: "sound",
            namespace: "mock",
          }));
          b.onLoad({ filter: /.*/, namespace: "mock" }, (a) => ({
            loader: "jsx",
            contents:
              a.path === "fiber"
                ? `export const Canvas=({fallback})=>fallback;`
                : a.path === "scene"
                  ? `export default function Scene(){return null}`
                  : `export class SparklerSound{fallback=false;async prepare(){}start(){__sparklerAudio.starts++;}stop(){__sparklerAudio.stops++;}setMix(v,m){__sparklerAudio.volume=v;__sparklerAudio.muted=m;}update(p){__sparklerAudio.progress=p;}suspend(){}async resume(){}dispose(){__sparklerAudio.disposed++;this.stop();}}`,
          }));
        },
      },
    ],
  });
  const React = await import("react"),
    { act } = React,
    { createRoot } = await import("react-dom/client"),
    { default: Experience } = await import("../.test-sparkler/Experience.mjs");
  const root = createRoot(document.getElementById("root")),
    ref = React.createRef();
  let snapshot,
    paused = false,
    muted = false,
    volume = 0.4;
  const notes = [];
  const props = () => ({
    ref,
    low: true,
    reduced: false,
    paused,
    volume,
    muted,
    background: () => null,
    paletteHost: document.getElementById("palette"),
    controlsHost: document.getElementById("tools"),
    onState: (s) => (snapshot = s),
    notify: (n) => notes.push(n),
    onRequestPlay: () => {
      paused = false;
    },
  });
  const render = () =>
    act(() => root.render(React.createElement(Experience, props())));
  async function advance(seconds) {
    await act(() => {
      for (let i = 0; i < seconds * 60; i++) {
        now += 1000 / 60;
        const callbacks = [...frames.values()];
        frames.clear();
        callbacks.forEach((fn) => fn(now));
      }
    });
  }
  const click = async (el) =>
    act(async () => {
      assert.ok(el);
      el.click();
    });
  const label = (text) => document.querySelector(`[aria-label="${text}"]`);
  function pointer(area, type, x, y, id = 1, kind = "mouse") {
    const event = new w.MouseEvent(type, {
      bubbles: true,
      cancelable: true,
      clientX: x,
      clientY: y,
      button: 0,
    });
    Object.defineProperties(event, {
      pointerId: { value: id },
      pointerType: { value: kind },
      isPrimary: { value: true },
    });
    area.dispatchEvent(event);
    return event;
  }
  try {
    await render();
    await advance(0.1);
    assert.equal(snapshot.burning, false);
    assert.equal(__sparklerAudio.starts, 0);
    assert.equal(
      document.querySelectorAll(".sparkler-palette button").length,
      7,
    );
    const area = document.querySelector(".sparkler-interaction");
    await act(() => {
      const e = pointer(area, "pointerdown", 195, 250);
      assert.ok(e.defaultPrevented);
      assert.ok(captured);
      pointer(area, "pointermove", 230, 220);
      pointer(area, "pointerup", 230, 220);
    });
    await advance(0.1);
    assert.equal(snapshot.burning, false);
    assert.equal(captured, false);
    await act(async () => {
      await ref.current.light();
    });
    assert.ok(snapshot.burning);
    assert.equal(__sparklerAudio.starts, 1);
    await click(label("Red sparks"));
    assert.equal(snapshot.color, "red");
    assert.equal(label("Red sparks").getAttribute("aria-pressed"), "true");
    await act(() => {
      pointer(area, "pointerdown", 210, 240, 7, "touch");
      for (let i = 0; i <= 48; i++) {
        const a = (i / 48) * Math.PI * 2;
        pointer(
          area,
          "pointermove",
          195 + 70 * Math.cos(a),
          250 + 70 * Math.sin(a),
          7,
          "touch",
        );
      }
      pointer(area, "pointerup", 265, 250, 7, "touch");
    });
    await advance(0.2);
    assert.ok(painted > 10, "draws the user-generated trajectory");
    assert.equal(captured, false);
    await click(label("Rainbow sparks"));
    assert.equal(snapshot.color, "rainbow");
    await click(
      [...document.querySelectorAll(".sparkler-modes button")].find(
        (b) => b.textContent === "Rainbow Fuljhadi",
      ),
    );
    assert.equal(snapshot.mode, "rainbow");
    await click(
      [...document.querySelectorAll(".sparkler-modes button")].find(
        (b) => b.textContent === "Light Painting",
      ),
    );
    assert.equal(snapshot.mode, "painting");
    await click(label("Move Fuljhadi left"));
    await advance(0.1);
    await act(() =>
      area.dispatchEvent(
        new w.KeyboardEvent("keydown", {
          key: "ArrowUp",
          bubbles: true,
          cancelable: true,
        }),
      ),
    );
    await advance(0.1);
    await act(() => ref.current.clear());
    assert.ok(snapshot.burning);
    assert.ok(notes.some((n) => n.includes("cleared")));
    let capture;
    await act(() => {
      capture = ref.current.capture();
    });
    await advance(0.1);
    await act(async () => {
      await capture;
    });
    assert.equal(filename, "deepotsava-fuljhadi-art.png");
    muted = true;
    volume = 0.2;
    await render();
    assert.equal(__sparklerAudio.muted, true);
    assert.equal(__sparklerAudio.volume, 0.2);
    paused = true;
    await render();
    const before = snapshot.remaining;
    await advance(3);
    assert.equal(snapshot.remaining, before);
    paused = false;
    await render();
    await advance(39);
    assert.equal(snapshot.burning, false);
    assert.equal(snapshot.remaining, 0);
    assert.ok(notes.some((n) => n.includes("burned out")));
    await act(async () => {
      await ref.current.light();
    });
    assert.equal(__sparklerAudio.starts, 2);
    await act(() => ref.current.restart());
    assert.equal(snapshot.burning, false);
    assert.equal(snapshot.hasLit, false);
    assert.equal(snapshot.remaining, 38);
  } finally {
    await act(() => root.unmount());
    assert.equal(__sparklerAudio.disposed, 1);
    dom.window.close();
    await rm(dir, { recursive: true, force: true });
    URL.createObjectURL = oldURL;
    URL.revokeObjectURL = oldRevoke;
    delete globalThis.__sparklerAudio;
  }
});
