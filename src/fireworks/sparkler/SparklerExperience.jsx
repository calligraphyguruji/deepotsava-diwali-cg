import {
  Component,
  forwardRef,
  Suspense,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { Canvas } from "@react-three/fiber";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Flame,
  RotateCcw,
} from "lucide-react";
import { SparklerModel, SPARKLER_COLORS, BURN_SECONDS } from "./model.js";
import { SparklerSound } from "./sound.js";
import SparklerScene from "./SparklerScene";
import CanvasFallback from "./CanvasFallback";
import "./sparkler.css";
class SceneBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}
const MODES = [
  ["classic", "Classic Fuljhadi"],
  ["rainbow", "Rainbow Fuljhadi"],
  ["painting", "Light Painting"],
];
const SparklerExperience = forwardRef(function SparklerExperience(
  {
    low,
    reduced,
    paused,
    volume,
    muted,
    background,
    paletteHost,
    controlsHost,
    onState,
    notify,
    onRequestPlay,
  },
  ref,
) {
  const [model] = useState(() => new SparklerModel()),
    [view, setView] = useState(() => model.snapshot()),
    [preparing, setPreparing] = useState(false);
  const host = useRef(),
    canvas = useRef(),
    audio = useRef(),
    activePointer = useRef(null),
    alive = useRef(false),
    generation = useRef(0),
    lighting = useRef(false),
    burning = useRef(false),
    latest = useRef();
  latest.current = { paused, volume, muted, notify, onState, onRequestPlay };
  const report = useCallback(
    (snapshot) => {
      if (!alive.current) return;
      setView(snapshot);
      latest.current.onState({ ...snapshot, preparing: lighting.current });
      if (snapshot.burning)
        audio.current?.update(snapshot.progress, model.normalized.x);
      if (burning.current && !snapshot.burning) {
        audio.current?.stop();
        latest.current.notify(
          "Your Fuljhadi has gently burned out. Relight a fresh one to keep painting.",
        );
      }
      burning.current = snapshot.burning;
    },
    [model],
  );
  const ready = useCallback(() => {
    if (alive.current) {
      const snapshot = model.snapshot();
      setView(snapshot);
      latest.current.onState(snapshot);
    }
  }, [model]);
  useEffect(() => {
    alive.current = true;
    const a = new SparklerSound();
    audio.current = a;
    a.setMix(latest.current.volume, latest.current.muted);
    const visibility = () => {
      if (document.hidden) a.suspend();
      else if (!latest.current.paused) {
        a.resume()?.catch(() =>
          latest.current.notify("Tap Light Fuljhadi to resume sound."),
        );
        model.wake();
      }
    };
    document.addEventListener("visibilitychange", visibility);
    ready();
    return () => {
      alive.current = false;
      generation.current++;
      model.burning = false;
      model.clear();
      a.dispose();
      model.captureNext?.reject(
        new Error("Capture cancelled because the sparkler was closed."),
      );
      model.captureNext = null;
      document.removeEventListener("visibilitychange", visibility);
    };
  }, [model, ready]);
  useEffect(() => {
    audio.current?.setMix(volume, muted);
  }, [volume, muted]);
  useEffect(() => {
    if (paused) audio.current?.suspend();
    else if (!document.hidden) audio.current?.resume()?.catch(() => {});
    model.wake();
  }, [paused, model]);
  const light = useCallback(async () => {
    if (model.burning || lighting.current || !alive.current) return;
    lighting.current = true;
    const token = ++generation.current;
    setPreparing(true);
    latest.current.onState({ ...model.snapshot(), preparing: true });
    latest.current.onRequestPlay();
    try {
      await audio.current.prepare();
      if (audio.current.fallback)
        latest.current.notify(
          "The recording could not load; using a designed sizzling approximation.",
        );
    } catch (error) {
      latest.current.notify(error.message);
    }
    if (!alive.current || token !== generation.current) return;
    lighting.current = false;
    setPreparing(false);
    model.ignite();
    audio.current.start();
    burning.current = true;
    report(model.snapshot());
    latest.current.notify(
      "Your Fuljhadi is lit. Hold and drag to paint with light.",
    );
  }, [model, report]);
  const restart = useCallback(() => {
    generation.current++;
    lighting.current = false;
    setPreparing(false);
    audio.current?.stop();
    burning.current = false;
    model.restart();
    report(model.snapshot());
    latest.current.notify("A fresh, unlit Fuljhadi is ready.");
  }, [model, report]);
  const changeColor = useCallback(
    (id) => {
      model.setColor(id);
      report(model.snapshot());
    },
    [model, report],
  );
  const changeMode = useCallback(
    (mode) => {
      model.setMode(mode);
      report(model.snapshot());
    },
    [model, report],
  );
  const clear = useCallback(() => {
    model.clear();
    latest.current.notify(
      "Light trails cleared. Your Fuljhadi keeps its current burn.",
    );
  }, [model]);
  const capture = useCallback(async () => {
    if (!canvas.current) {
      latest.current.notify(
        "The scene is still loading. Please try capture again.",
      );
      return;
    }
    if (model.captureNext) return;
    let timeout;
    try {
      const blob = await new Promise((resolve, reject) => {
        model.captureNext = { resolve, reject };
        timeout = setTimeout(() => {
          model.captureNext = null;
          reject(new Error("Capture took too long. Please try again."));
        }, 4000);
        model.wake();
      });
      const url = URL.createObjectURL(blob),
        a = document.createElement("a");
      a.href = url;
      a.download = "deepotsava-fuljhadi-art.png";
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      latest.current.notify("Your light painting has been saved as a PNG.");
    } catch (error) {
      latest.current.notify(error.message);
    } finally {
      clearTimeout(timeout);
    }
  }, [model]);
  useImperativeHandle(
    ref,
    () => ({
      light,
      restart,
      clear,
      capture,
      cycleColor() {
        const index = SPARKLER_COLORS.findIndex((c) => c.id === model.color);
        changeColor(SPARKLER_COLORS[(index + 1) % SPARKLER_COLORS.length].id);
      },
      setMode: changeMode,
      refresh() {
        model.wake();
      },
    }),
    [light, restart, clear, capture, changeColor, changeMode, model],
  );
  function input(event) {
    const rect = host.current.getBoundingClientRect();
    const samples = event.nativeEvent.getCoalescedEvents?.() || [];
    for (const sample of samples.length ? samples : [event])
      model.input(
        (sample.clientX - rect.left) / rect.width,
        (sample.clientY - rect.top) / rect.height,
      );
  }
  const fallback = (
    <CanvasFallback
      model={model}
      background={background}
      canvasRef={canvas}
      paused={paused}
      low={low}
      onTick={report}
      onReady={ready}
    />
  );
  return (
    <>
      <div
        ref={host}
        className="sparkler-interaction"
        tabIndex={0}
        role="group"
        aria-label="Fuljhadi drawing area. Hold and drag with a mouse or one finger, or use arrow keys to move."
        onPointerDown={(event) => {
          if (
            event.button !== 0 ||
            activePointer.current !== null ||
            latest.current.paused
          )
            return;
          event.preventDefault();
          activePointer.current = event.pointerId;
          event.currentTarget.setPointerCapture(event.pointerId);
          input(event);
        }}
        onPointerMove={(event) => {
          if (
            event.pointerId === activePointer.current &&
            !latest.current.paused
          )
            input(event);
        }}
        onPointerUp={(event) => {
          if (event.pointerId !== activePointer.current) return;
          input(event);
          activePointer.current = null;
          if (event.currentTarget.hasPointerCapture(event.pointerId))
            event.currentTarget.releasePointerCapture(event.pointerId);
        }}
        onPointerCancel={() => {
          activePointer.current = null;
        }}
        onKeyDown={(event) => {
          const moves = {
            ArrowLeft: [-0.025, 0],
            ArrowRight: [0.025, 0],
            ArrowUp: [0, -0.025],
            ArrowDown: [0, 0.025],
          };
          if (moves[event.key]) {
            event.preventDefault();
            model.nudge(...moves[event.key]);
          }
          if ((event.key === "Enter" || event.key === " ") && !model.burning) {
            event.preventDefault();
            void light();
          }
        }}
      >
        <SceneBoundary fallback={fallback}>
          <Suspense
            fallback={
              <div className="sparkler-loading" role="status">
                Preparing your hand-held Fuljhadi…
              </div>
            }
          >
            <Canvas
              orthographic
              camera={{ position: [0, 0, 12], near: 0.1, far: 100, zoom: 1 }}
              dpr={low ? 1 : [1, 1.5]}
              frameloop="demand"
              gl={{
                alpha: false,
                antialias: !low,
                preserveDrawingBuffer: true,
                powerPreference: "low-power",
              }}
              fallback={fallback}
            >
              <SparklerScene
                model={model}
                low={low}
                reduced={reduced}
                paused={paused}
                background={background}
                onTick={report}
                onReady={ready}
                canvasRef={canvas}
              />
            </Canvas>
          </Suspense>
        </SceneBoundary>
      </div>
      <div className="sparkler-heading">
        <span>HOLD A LITTLE MAGIC</span>
        <h1>
          {view.mode === "painting" ? (
            <>
              Paint the <em>night.</em>
            </>
          ) : (
            <>
              Hold a little <em>light.</em>
            </>
          )}
        </h1>
        <p>
          {view.burning
            ? "Hold and drag to paint with light."
            : "Light your Fuljhadi, then hold and drag."}
        </p>
      </div>
      <div className="sparkler-burn">
        <div>
          <Flame size={14} />
          <span>
            {view.burning
              ? `${Math.ceil(view.remaining)}s of light`
              : view.hasLit
                ? "Burned out · ready to relight"
                : "Fresh Fuljhadi · 38s burn"}
          </span>
        </div>
        <progress
          max={BURN_SECONDS}
          value={view.hasLit ? view.remaining : BURN_SECONDS}
          aria-label="Fuljhadi burn remaining"
        />
      </div>
      {paletteHost &&
        createPortal(
          <div
            className="sparkler-palette"
            role="group"
            aria-label="Fuljhadi spark color"
          >
            {SPARKLER_COLORS.map((color) => (
              <button
                key={color.id}
                aria-label={`${color.name} sparks`}
                aria-pressed={view.color === color.id}
                onClick={() => changeColor(color.id)}
                title={color.name}
              >
                <span
                  style={{
                    background:
                      color.id === "rainbow"
                        ? "conic-gradient(#ff354c,#ffdb50,#25ee87,#3c8cff,#b968ff,#ff55ba,#ff354c)"
                        : color.hex,
                  }}
                />
                <small>{color.name}</small>
              </button>
            ))}
          </div>,
          paletteHost,
        )}
      {controlsHost &&
        createPortal(
          <div className="sparkler-tools">
            <h3>Paint the Night with Light</h3>
            <div
              className="sparkler-modes"
              role="group"
              aria-label="Fuljhadi celebration mode"
            >
              {MODES.map(([mode, label]) => (
                <button
                  key={mode}
                  aria-pressed={view.mode === mode}
                  onClick={() => changeMode(mode)}
                >
                  {label}
                </button>
              ))}
            </div>
            <p>
              Draw hearts, rings, stars, names, or an infinity sign. Light
              Painting keeps your freehand strokes for 12 seconds before they
              fade.
            </p>
            <div
              className="sparkler-nudge"
              role="group"
              aria-label="Move Fuljhadi without dragging"
            >
              {[
                [ArrowLeft, -0.03, 0, "Move Fuljhadi left"],
                [ArrowUp, 0, -0.03, "Move Fuljhadi up"],
                [ArrowDown, 0, 0.03, "Move Fuljhadi down"],
                [ArrowRight, 0.03, 0, "Move Fuljhadi right"],
              ].map(([Icon, x, y, label]) => (
                <button
                  key={label}
                  aria-label={label}
                  onClick={() => model.nudge(x, y)}
                >
                  <Icon size={18} />
                </button>
              ))}
            </div>
            <button className="sparkler-restart" onClick={restart}>
              <RotateCcw size={14} /> Restart with a fresh Fuljhadi
            </button>
            <small>
              Recorded CC0 sizzle and crackles · original designed match
              ignition. Volume and mute use the playground’s sound controls.
            </small>
            {preparing && (
              <p role="status">Preparing the sparkler recording…</p>
            )}
          </div>,
          controlsHost,
        )}
    </>
  );
});
export default SparklerExperience;
