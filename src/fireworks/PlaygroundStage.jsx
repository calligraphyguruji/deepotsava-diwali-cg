import { useEffect, useRef } from "react";
import { Crosshair } from "lucide-react";
import { BY_ID } from "./catalog";
import { makeBackdrop, makeSmoke, paintScene } from "./renderer";
export default function PlaygroundStage({
  engine,
  selected,
  position,
  setPosition,
  onLaunch,
  low,
  reduced,
  paused,
  onStats,
  onFrame,
}) {
  const canvas = useRef(),
    host = useRef(),
    drag = useRef(false),
    latest = useRef();
  latest.current = {
    selected,
    position,
    low,
    reduced,
    paused,
    onStats,
    onFrame,
  };
  useEffect(() => {
    const c = canvas.current,
      ctx = c.getContext("2d");
    if (!ctx) return;
    let width = 1,
      height = 1,
      frame = 0,
      last = 0,
      lastStats = 0,
      background,
      smoke = makeSmoke(),
      slowFrames = 0,
      adaptiveLow = false,
      paintVersion = 0;
    function resize() {
      const r = host.current.getBoundingClientRect();
      width = Math.max(r.width, 1);
      height = Math.max(r.height, 1);
      engine.height = (1000 * height) / width;
      const d = latest.current.low ? 1 : Math.min(devicePixelRatio || 1, 1.5);
      c.width = Math.round(width * d);
      c.height = Math.round(height * d);
      ctx.setTransform(c.width / 1000, 0, 0, c.height / engine.height, 0, 0);
      background = makeBackdrop(engine.height);
      wake();
    }
    function draw(t) {
      frame = 0;
      if (document.hidden) return;
      const opts = latest.current;
      if (opts.paused) {
        last = 0;
        return;
      }
      if (opts.low && last && t - last < 31) {
        frame = requestAnimationFrame(draw);
        return;
      }
      const dt = last ? Math.min((t - last) / 1000, 0.05) : 1 / 60;
      last = t;
      if (dt > 0.034) slowFrames++;
      else slowFrames = Math.max(0, slowFrames - 1);
      if (slowFrames > 45) adaptiveLow = true;
      engine.low = opts.low || adaptiveLow;
      engine.reduced = opts.reduced;
      engine.step(dt);
      paintScene(ctx, engine, background, {
        low: engine.low,
        position: opts.position,
        selected: opts.selected,
        smokeSprite: smoke,
      });
      c.__deepotsavaFrame = ++paintVersion;
      opts.onFrame?.();
      if (t - lastStats > 500) {
        lastStats = t;
        opts.onStats?.({
          particles: engine.particles.length,
          launches: engine.launched,
        });
      }
      if (engine.busy) frame = requestAnimationFrame(draw);
      else last = 0;
    }
    function wake() {
      if (!frame && !document.hidden) frame = requestAnimationFrame(draw);
    }
    function visibility() {
      if (document.hidden) {
        cancelAnimationFrame(frame);
        frame = 0;
        last = 0;
      } else wake();
    }
    engine.wake = wake;
    engine.resize = resize;
    const observer = new ResizeObserver(resize);
    observer.observe(host.current);
    resize();
    document.addEventListener("visibilitychange", visibility);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
      document.removeEventListener("visibilitychange", visibility);
      engine.wake = () => {};
      engine.resize = () => {};
    };
  }, [engine]);
  useEffect(() => {
    engine.resize?.();
  }, [engine, low]);
  useEffect(() => {
    engine.low = low;
    engine.reduced = reduced;
    engine.wake?.();
  }, [engine, selected, position, low, reduced, paused]);
  const getPosition = (e) => {
    const r = host.current.getBoundingClientRect();
    return {
      x: Math.max(0.05, Math.min(0.95, (e.clientX - r.left) / r.width)),
      y: Math.max(0.1, Math.min(0.58, (e.clientY - r.top) / r.height)),
    };
  };
  const ground = BY_ID[selected].zone === "ground";
  return (
    <div className="fw-stage" ref={host}>
      <canvas
        ref={canvas}
        aria-label="Interactive Diwali night sky. Use the launch button or tap the sky or ground."
        onPointerUp={(e) => {
          if (e.button !== 0) return;
          const p = getPosition(e),
            r = host.current.getBoundingClientRect(),
            inGround = (e.clientY - r.top) / r.height >= 0.7;
          onLaunch(
            selected,
            p,
            ground && !inGround ? "ground-required" : undefined,
          );
        }}
      />
      <div className="fw-scene-heading">
        <span>दीपोत्सव · THE FIREWORKS GARDEN</span>
        <h1>
          Make the night <em>yours.</em>
        </h1>
        <p>
          {ground
            ? "Tap the illuminated ground to ignite."
            : "Tap the sky to send your light upward."}{" "}
          Drag the marker to choose a position.
        </p>
      </div>
      <div
        className={`fw-ground-guide ${ground ? "visible" : ""}`}
        aria-hidden="true"
      >
        <span>GROUND LAUNCH ZONE</span>
      </div>
      <div
        className="fw-position"
        role="slider"
        tabIndex={0}
        aria-label="Launch position: use arrow keys or drag"
        aria-valuemin={5}
        aria-valuemax={95}
        aria-valuenow={Math.round(position.x * 100)}
        aria-valuetext={`${Math.round(position.x * 100)} percent across${ground ? " on the ground" : `, ${Math.round(position.y * 100)} percent down the sky`}`}
        style={{
          left: `${position.x * 100}%`,
          top: `${ground ? 84 : position.y * 100}%`,
        }}
        onPointerDown={(e) => {
          e.preventDefault();
          drag.current = true;
          e.currentTarget.setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          if (drag.current) setPosition(getPosition(e));
        }}
        onPointerUp={(e) => {
          drag.current = false;
          if (e.currentTarget.hasPointerCapture(e.pointerId))
            e.currentTarget.releasePointerCapture(e.pointerId);
        }}
        onPointerCancel={() => {
          drag.current = false;
        }}
        onKeyDown={(e) => {
          if (
            !["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)
          )
            return;
          e.preventDefault();
          setPosition((p) => ({
            x: Math.max(
              0.05,
              Math.min(
                0.95,
                p.x +
                  (e.key === "ArrowLeft"
                    ? -0.03
                    : e.key === "ArrowRight"
                      ? 0.03
                      : 0),
              ),
            ),
            y: Math.max(
              0.1,
              Math.min(
                0.58,
                p.y +
                  (e.key === "ArrowUp"
                    ? -0.03
                    : e.key === "ArrowDown"
                      ? 0.03
                      : 0),
              ),
            ),
          }));
        }}
      >
        <Crosshair size={23} />
        <span>DRAG TO PLACE</span>
      </div>
    </div>
  );
}
