import test from "node:test";
import assert from "node:assert/strict";
import { build } from "esbuild";
import { JSDOM } from "jsdom";
import { mkdir, rm } from "node:fs/promises";
import { FIREWORKS } from "../src/fireworks/catalog.js";
test("fireworks page selection, ground taps, placement, multiple launches, controls, finale and navigation", async () => {
  const dom = new JSDOM('<!doctype html><div id="root"></div>', {
      url: "http://localhost/fireworks",
      pretendToBeVisual: true,
    }),
    w = dom.window;
  for (const k of [
    "window",
    "document",
    "HTMLElement",
    "Element",
    "HTMLInputElement",
    "SVGElement",
    "CustomEvent",
    "Event",
    "MouseEvent",
  ])
    globalThis[k] = k === "window" ? w : w[k];
  Object.defineProperty(globalThis, "navigator", {
    value: w.navigator,
    configurable: true,
  });
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  globalThis.devicePixelRatio = 3;
  w.innerWidth = 390;
  w.innerHeight = 844;
  w.matchMedia = () => ({
    matches: true,
    addListener() {},
    removeListener() {},
  });
  w.scrollTo = () => {};
  globalThis.ResizeObserver = class {
    observe() {}
    disconnect() {}
  };
  let next = 1,
    now = 0,
    draws = 0;
  const frames = new Map();
  globalThis.requestAnimationFrame = (fn) => {
    const id = next++;
    frames.set(id, fn);
    return id;
  };
  globalThis.cancelAnimationFrame = (id) => frames.delete(id);
  w.HTMLElement.prototype.getBoundingClientRect = () => ({
    x: 0,
    y: 0,
    left: 0,
    top: 0,
    right: 390,
    bottom: 500,
    width: 390,
    height: 500,
  });
  w.HTMLElement.prototype.setPointerCapture = function () {
    this.captured = true;
  };
  w.HTMLElement.prototype.hasPointerCapture = function () {
    return this.captured;
  };
  w.HTMLElement.prototype.releasePointerCapture = function () {
    this.captured = false;
  };
  const gradient = { addColorStop() {} };
  const ctx = new Proxy(
    {
      createLinearGradient: () => gradient,
      createRadialGradient: () => gradient,
      drawImage() {
        draws++;
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
  globalThis.__fwAudio = {
    prepared: 0,
    sounds: [],
    stopped: 0,
    disposed: 0,
    volume: 0.4,
    muted: false,
  };
  const dir = new URL("../.test-fireworks/", import.meta.url);
  await mkdir(dir, { recursive: true });
  await build({
    entryPoints: ["src/fireworks/FireworksPage.jsx"],
    outfile: ".test-fireworks/Page.mjs",
    bundle: true,
    format: "esm",
    platform: "node",
    jsx: "automatic",
    external: [
      "react",
      "react-dom",
      "react-dom/*",
      "react-router-dom",
      "lucide-react",
    ],
    loader: { ".css": "empty" },
    plugins: [
      {
        name: "platform-substitutes",
        setup(b) {
          b.onResolve({ filter: /^motion\/react$/ }, () => ({
            path: "motion",
            namespace: "mock",
          }));
          b.onResolve({ filter: /^\.\/audio$/ }, () => ({
            path: "audio",
            namespace: "mock",
          }));
          b.onLoad({ filter: /.*/, namespace: "mock" }, (a) => ({
            loader: "jsx",
            contents:
              a.path === "motion"
                ? `import React from 'react';const cache={};export const motion=new Proxy({},{get:(_,tag)=>cache[tag]||(cache[tag]=({initial,animate,exit,transition,...p})=>React.createElement(tag,p))});export const useReducedMotion=()=>true;`
                : `export class FireworkAudio{fallback=false;async prepare(){globalThis.__fwAudio.prepared++;}play(e){globalThis.__fwAudio.sounds.push(e);}stop(){globalThis.__fwAudio.stopped++;}suspend(){this.stop();}async resume(){}setVolume(v){globalThis.__fwAudio.volume=v;}setMuted(v){globalThis.__fwAudio.muted=v;}dispose(){globalThis.__fwAudio.disposed++;}}`,
          }));
        },
      },
    ],
  });
  const React = await import("react"),
    { act } = React,
    { createRoot } = await import("react-dom/client"),
    { MemoryRouter, Routes, Route } = await import("react-router-dom");
  const { default: Page } = await import("../.test-fireworks/Page.mjs");
  const root = createRoot(document.getElementById("root"));
  const click = async (el) =>
    act(async () => {
      assert.ok(el, "control exists");
      el.click();
    });
  const button = (text) =>
    [...document.querySelectorAll("button")].find((b) =>
      b.textContent.includes(text),
    );
  const byLabel = (text) => document.querySelector(`[aria-label="${text}"]`);
  async function advance(seconds) {
    await act(() => {
      for (let i = 0; i < seconds * 50; i++) {
        now += 20;
        const callbacks = [...frames.values()];
        frames.clear();
        callbacks.forEach((fn) => fn(now));
      }
    });
  }
  try {
    await act(() =>
      root.render(
        React.createElement(
          MemoryRouter,
          { initialEntries: ["/fireworks"] },
          React.createElement(
            Routes,
            null,
            React.createElement(Route, {
              path: "/fireworks",
              element: React.createElement(Page),
            }),
            React.createElement(Route, {
              path: "/",
              element: React.createElement("h1", null, "दीपोत्सव home"),
            }),
          ),
        ),
      ),
    );
    assert.equal(document.querySelectorAll(".fw-card").length, 14);
    assert.equal(__fwAudio.prepared, 0);
    assert.equal(__fwAudio.sounds.length, 0);
    await advance(0.1);
    assert.ok(draws > 0);
    assert.match(document.title, /दीपोत्सव/);
    for (const f of FIREWORKS.filter((f) => f.id !== "finale")) {
      await click(byLabel(`Select ${f.name}`));
      assert.equal(
        byLabel(`Select ${f.name}`).getAttribute("aria-pressed"),
        "true",
      );
      assert.match(
        document.querySelector(".fw-selected-preview").textContent,
        new RegExp(f.name),
      );
      await click(document.querySelector(".fw-launch"));
      await advance(0.2);
      assert.ok(
        __fwAudio.sounds.some((e) => e.id === f.id),
        `${f.name} launches with phase sound`,
      );
      await click(byLabel("Stop all fireworks"));
    }
    await click(button("Ground"));
    assert.equal(document.querySelectorAll(".fw-card").length, 7);
    await click(button("Sky"));
    assert.equal(document.querySelectorAll(".fw-card").length, 7);
    await click(button("All sparks"));
    await click(byLabel("Select Anar"));
    const c = document.querySelector(".fw-stage canvas");
    await act(async () =>
      c.dispatchEvent(
        new w.MouseEvent("pointerup", {
          bubbles: true,
          clientX: 180,
          clientY: 120,
          button: 0,
        }),
      ),
    );
    assert.match(
      document.querySelector('[role="status"]').textContent,
      /ground firework/,
    );
    await act(async () =>
      c.dispatchEvent(
        new w.MouseEvent("pointerup", {
          bubbles: true,
          clientX: 180,
          clientY: 450,
          button: 0,
        }),
      ),
    );
    await advance(0.3);
    assert.match(
      document.querySelector('[role="status"]').textContent,
      /Anar ignited/,
    );
    const marker = document.querySelector('[role="slider"]');
    await act(() =>
      marker.dispatchEvent(
        new w.KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }),
      ),
    );
    assert.equal(marker.getAttribute("aria-valuenow"), "53");
    await act(() => {
      marker.dispatchEvent(
        new w.MouseEvent("pointerdown", {
          bubbles: true,
          clientX: 200,
          clientY: 400,
        }),
      );
      marker.dispatchEvent(
        new w.MouseEvent("pointermove", {
          bubbles: true,
          clientX: 300,
          clientY: 400,
        }),
      );
      marker.dispatchEvent(
        new w.MouseEvent("pointerup", {
          bubbles: true,
          clientX: 300,
          clientY: 400,
        }),
      );
    });
    assert.equal(marker.getAttribute("aria-valuenow"), "77");
    await click(button("Launch multiple"));
    await advance(1);
    assert.match(
      document.querySelector('[role="status"]').textContent,
      /three Anar/,
    );
    await click(button("Release lanterns"));
    await advance(1);
    assert.match(
      document.querySelector('[role="status"]').textContent,
      /Four wishes/,
    );
    await click(byLabel("Pause celebration"));
    assert.ok(document.querySelector(".fw-paused"));
    const sounds = __fwAudio.sounds.length;
    await advance(1);
    assert.equal(__fwAudio.sounds.length, sounds);
    await click(byLabel("Resume celebration"));
    assert.equal(document.querySelector(".fw-paused"), null);
    await click(byLabel("Mute firework sound"));
    assert.equal(__fwAudio.muted, true);
    await click(byLabel("Turn firework sound on"));
    assert.equal(__fwAudio.muted, false);
    await act(() => {
      const range = byLabel("Master volume");
      Object.getOwnPropertyDescriptor(
        w.HTMLInputElement.prototype,
        "value",
      ).set.call(range, "0.2");
      range.dispatchEvent(new w.Event("input", { bubbles: true }));
      range.dispatchEvent(new w.Event("change", { bubbles: true }));
    });
    assert.equal(__fwAudio.volume, 0.2);
    const quality = document.querySelector(".fw-quality input");
    assert.equal(quality.checked, true);
    await click(quality);
    assert.equal(quality.checked, false);
    await click(byLabel("Stop all fireworks"));
    await click(button("Grand Finale"));
    assert.ok(button("Finale playing…").disabled);
    await advance(26.5);
    assert.ok(document.querySelector(".fw-finale-message"));
    assert.match(
      document.querySelector(".fw-finale-message").textContent,
      /HAPPY DIWALI/,
    );
    await click(byLabel("Dismiss Diwali greeting"));
    assert.equal(document.querySelector(".fw-finale-message"), null);
    await click(button("Grand Finale"));
    await advance(3);
    await click(byLabel("Stop all fireworks"));
    await advance(30);
    assert.equal(document.querySelector(".fw-finale-message"), null);
    await click(document.querySelector(".fw-home"));
    assert.match(document.querySelector("h1").textContent, /दीपोत्सव home/);
    assert.equal(__fwAudio.disposed, 1);
  } finally {
    await act(() => root.unmount());
    dom.window.close();
    await rm(dir, { recursive: true, force: true });
    delete globalThis.__fwAudio;
  }
});
