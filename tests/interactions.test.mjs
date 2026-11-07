import test from "node:test";
import assert from "node:assert/strict";
import { build } from "esbuild";
import { JSDOM } from "jsdom";
import { mkdir, rm } from "node:fs/promises";

// A DOM integration test, not a browser or GPU simulation. Only rendering/motion
// and platform APIs are substituted; application state and event handlers run.
test("phone celebration journey, session persistence, exports, surprises, and reset", async () => {
  const dom = new JSDOM('<!doctype html><div id="root"></div>', {
    url: "http://localhost:5173/",
  });
  const w = dom.window;
  for (const key of [
    "window",
    "document",
    "HTMLElement",
    "Element",
    "HTMLInputElement",
    "SVGElement",
    "CustomEvent",
    "Event",
    "MouseEvent",
    "sessionStorage",
  ])
    globalThis[key] = key === "window" ? w : w[key];
  Object.defineProperty(globalThis, "navigator", {
    value: w.navigator,
    configurable: true,
  });
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  globalThis.innerWidth = w.innerWidth = 390;
  globalThis.innerHeight = w.innerHeight = 844;
  globalThis.devicePixelRatio = 3;
  let canvasFrames = 0,
    painted = 0,
    downloaded = "",
    clipboard = "",
    notes = 0;
  let pendingFrame;
  globalThis.requestAnimationFrame = (fn) => {
    pendingFrame = fn;
    return ++canvasFrames;
  };
  globalThis.cancelAnimationFrame = () => {};
  globalThis.IntersectionObserver = class {
    observe() {}
    disconnect() {}
  };
  w.matchMedia = () => ({
    matches: true,
    addListener() {},
    removeListener() {},
    addEventListener() {},
    removeEventListener() {},
  });
  w.scrollTo = () => {};
  w.HTMLElement.prototype.scrollIntoView = () => {};
  w.HTMLDialogElement.prototype.showModal = function () {
    this.open = true;
  };
  Object.defineProperty(w.document, "fonts", {
    value: { ready: Promise.resolve() },
  });
  const context = {
    setTransform() {},
    clearRect() {},
    beginPath() {},
    moveTo() {},
    lineTo() {},
    stroke() {
      painted++;
    },
    fillRect() {},
    strokeRect() {},
    ellipse() {},
    fill() {},
    bezierCurveTo() {},
    save() {},
    restore() {},
    translate() {},
    rotate() {},
    fillText() {},
    measureText(t) {
      return { width: [...t].length * 16 };
    },
    createRadialGradient() {
      return { addColorStop() {} };
    },
  };
  w.HTMLCanvasElement.prototype.getContext = () => context;
  w.HTMLCanvasElement.prototype.toBlob = function (cb) {
    cb(new Blob(["png"], { type: "image/png" }));
  };
  const clickAnchor = w.HTMLAnchorElement.prototype.click;
  w.HTMLAnchorElement.prototype.click = function () {
    if (this.download) downloaded = this.download;
    else clickAnchor.call(this);
  };
  const oldCreate = URL.createObjectURL,
    oldRevoke = URL.revokeObjectURL;
  URL.createObjectURL = () => "blob:test";
  URL.revokeObjectURL = () => {};
  Object.defineProperty(w.navigator, "clipboard", {
    value: {
      writeText: async (t) => {
        clipboard = t;
      },
    },
    configurable: true,
  });
  w.AudioContext = class {
    currentTime = 0;
    destination = {};
    async resume() {}
    async suspend() {}
    close() {}
    createOscillator() {
      notes++;
      return {
        frequency: { setValueAtTime() {}, exponentialRampToValueAtTime() {} },
        connect() {},
        disconnect() {},
        start() {},
        stop() {},
      };
    }
    createGain() {
      return {
        gain: { setValueAtTime() {}, exponentialRampToValueAtTime() {} },
        connect() {},
        disconnect() {},
      };
    }
  };
  const dir = new URL("../.test-build/", import.meta.url);
  await mkdir(dir, { recursive: true });
  await build({
    entryPoints: ["src/App.jsx"],
    outfile: ".test-build/App.mjs",
    bundle: true,
    format: "esm",
    platform: "node",
    jsx: "automatic",
    external: [
      "react",
      "react-dom",
      "react-dom/*",
      "lucide-react",
      "react-router-dom",
    ],
    plugins: [
      {
        name: "platform-render-mocks",
        setup(b) {
          b.onResolve({ filter: /DiyaScene$/ }, () => ({
            path: "scene",
            namespace: "mock",
          }));
          b.onResolve({ filter: /^motion\/react$/ }, () => ({
            path: "motion",
            namespace: "mock",
          }));
          b.onResolve({ filter: /^gsap(?:\/ScrollTrigger)?$/ }, () => ({
            path: "gsap",
            namespace: "mock",
          }));
          b.onLoad({ filter: /.*/, namespace: "mock" }, (a) => ({
            loader: "jsx",
            contents:
              a.path === "scene"
                ? `export default function Scene(){return <div role="img" aria-label="3D diya test substitute"/>}`
                : a.path === "gsap"
                  ? `export const ScrollTrigger={};export const gsap={registerPlugin(){},context(){return{revert(){}}}};`
                  : `import React from 'react';const cache={};export const motion=new Proxy({},{get:(_,tag)=>cache[tag]||(cache[tag]=React.forwardRef(({initial,animate,exit,transition,...p},ref)=>React.createElement(tag,{...p,ref})))});export const AnimatePresence=({children})=>children;export const useReducedMotion=()=>true;`,
          }));
        },
      },
    ],
  });
  const { act } = await import("react");
  const { createRoot } = await import("react-dom/client");
  const { default: App } = await import("../.test-build/App.mjs");
  let root = createRoot(document.getElementById("root"));
  const mount = () =>
    act(async () => {
      root.render(
        (await import("react")).createElement(
          (await import("react-router-dom")).MemoryRouter,
          null,
          (await import("react")).createElement(App),
        ),
      );
    });
  const click = (el) =>
    act(async () => {
      assert.ok(el, "control exists");
      el.click();
      await new Promise((r) => setTimeout(r, 5));
    });
  const button = (text) =>
    [...document.querySelectorAll("button")].find((b) =>
      b.textContent.includes(text),
    );
  const fill = (id, value) =>
    act(() => {
      const el = document.getElementById(id);
      Object.getOwnPropertyDescriptor(
        w.HTMLInputElement.prototype,
        "value",
      ).set.call(el, value);
      el.dispatchEvent(new w.Event("input", { bubbles: true }));
    });
  try {
    await mount();
    assert.equal(document.querySelectorAll(".diya-tile").length, 12);
    assert.equal(document.querySelectorAll(".wish-card").length, 5);
    await click(button("Light a Diya"));
    assert.equal(
      notes,
      2,
      "lighting from the hero plays the two-tone ignition chime",
    );
    assert.equal(
      document.querySelector('[data-testid="diya-count"]').textContent,
      "1",
    );
    await click(document.querySelector('[aria-label="Light diya 2"]'));
    await click(document.querySelector('[aria-label="Light diya 2"]'));
    assert.equal(
      notes,
      4,
      "a new diya plays a chime; a duplicate tap stays silent",
    );
    assert.equal(
      document.querySelector('[data-testid="diya-count"]').textContent,
      "2",
    );
    assert.equal(JSON.parse(sessionStorage.getItem("jyoti-lit")).length, 2);
    await act(() => root.unmount());
    root = createRoot(document.getElementById("root"));
    await mount();
    assert.equal(
      document.querySelector('[data-testid="diya-count"]').textContent,
      "2",
    );
    for (let i = 3; i <= 12; i++)
      await click(document.querySelector(`[aria-label="Light diya ${i}"]`));
    assert.equal(
      document.querySelector('[data-testid="diya-count"]').textContent,
      "12",
    );
    await click(button("Light a Diya"));
    assert.equal(
      document.querySelector('[data-testid="diya-count"]').textContent,
      "12",
    );
    await click(button("Reset diyas"));
    assert.equal(
      document.querySelector('[data-testid="diya-count"]').textContent,
      "0",
    );
    const bursts = [];
    w.addEventListener("jyoti-burst", (e) => bursts.push(e.detail));
    await click(document.querySelector('a[href="/fireworks"]'));
    await click(button("Grand Celebration"));
    await click(button("Launch a spark"));
    await act(() =>
      document.getElementById("fireworks").dispatchEvent(
        new w.MouseEvent("click", {
          bubbles: true,
          clientX: 120,
          clientY: 250,
        }),
      ),
    );
    assert.ok(bursts.some((b) => b.x === 120 && b.y === 250));
    assert.ok(canvasFrames > 0);
    assert.equal(
      document.querySelector(".fireworks-canvas").width,
      390,
      "phone fireworks cap the pixel density even on a high-DPI screen",
    );
    pendingFrame?.(16.67);
    assert.ok(painted > 0);
    for (const selector of [".lantern-one", ".lantern-two", ".moon"])
      await click(document.querySelector(selector));
    assert.ok(bursts.some((b) => b.kind === "sparkle"));
    assert.ok(bursts.some((b) => b.count === 6));
    await fill("from", "Asha");
    await fill("to", "Priya");
    for (const style of ["Traditional", "Romantic", "Family", "Friends"]) {
      await click(document.querySelector(`input[value="${style}"]`));
      await act(() =>
        document
          .querySelector("form")
          .dispatchEvent(
            new w.Event("submit", { bubbles: true, cancelable: true }),
          ),
      );
      assert.ok(
        document
          .querySelector(".generated-text")
          .textContent.includes("Dear Priya,"),
      );
      assert.ok(
        document
          .querySelector(".generated-text")
          .textContent.includes("With love, Asha."),
      );
    }
    const text = document.querySelector(".generated-text").textContent;
    await click(button("Copy greeting"));
    assert.equal(clipboard, text);
    assert.equal(
      new URL(document.querySelector(".card-tools a").href).searchParams.get(
        "text",
      ),
      text,
    );
    await click(button("Download PNG"));
    assert.equal(downloaded, "deepotsava-diwali-greeting.png");
    for (const card of document.querySelectorAll(".wish-card")) {
      await click(card.querySelector("button"));
      assert.equal(clipboard, card.querySelector("p").textContent);
      assert.equal(
        new URL(card.querySelector("a").href).searchParams.get("text"),
        clipboard,
      );
    }
    await click(document.querySelector(".gift-card"));
    assert.ok(document.querySelector("dialog").open);
    assert.match(document.querySelector("dialog h2").textContent, /Asha/);
    assert.ok(bursts.some((b) => b.kind === "confetti"));
    await click(button("Carry this light"));
    assert.equal(document.querySelector("dialog"), null);
    const sound = document.querySelector(".music-toggle");
    assert.equal(sound.getAttribute("aria-pressed"), "false");
    await click(sound);
    assert.equal(sound.getAttribute("aria-pressed"), "true");
    assert.ok(notes > 0);
    await click(sound);
    assert.equal(sound.getAttribute("aria-pressed"), "false");
    await click(document.querySelector(".menu-toggle"));
    assert.equal(
      document.querySelector(".menu-toggle").getAttribute("aria-expanded"),
      "true",
    );
    await click(document.querySelector("nav a"));
    assert.equal(
      document.querySelector(".menu-toggle").getAttribute("aria-expanded"),
      "false",
    );
    assert.equal(
      document.querySelector(".menu-toggle").getAttribute("aria-controls"),
      "main-navigation",
    );
    await click(document.querySelector(".menu-toggle"));
    await act(() =>
      document.dispatchEvent(
        new w.KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
      ),
    );
    assert.equal(
      document.querySelector(".menu-toggle").getAttribute("aria-expanded"),
      "false",
    );
    await click(document.querySelector(".menu-toggle"));
    await act(() =>
      document
        .querySelector("main")
        .dispatchEvent(new w.Event("pointerdown", { bubbles: true })),
    );
    assert.equal(
      document.querySelector(".menu-toggle").getAttribute("aria-expanded"),
      "false",
    );
    await click(button("Celebrate Again"));
    assert.equal(
      document.querySelector('[data-testid="diya-count"]').textContent,
      "0",
    );
    assert.equal(document.getElementById("from").value, "");
    assert.equal(document.getElementById("to").value, "");
    assert.match(
      document.querySelector(".generated-text").textContent,
      /someone special/,
    );
  } finally {
    await act(() => root.unmount());
    dom.window.close();
    await rm(dir, { recursive: true, force: true });
    w.HTMLAnchorElement.prototype.click = clickAnchor;
    URL.createObjectURL = oldCreate;
    URL.revokeObjectURL = oldRevoke;
  }
});
