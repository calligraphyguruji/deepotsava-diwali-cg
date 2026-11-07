import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "motion/react";
import {
  ArrowLeft,
  Flame,
  Sparkles,
  Rocket,
  Wind,
  Volume2,
  VolumeX,
  Square,
  Pause,
  Play,
  Check,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { FIREWORKS, BY_ID } from "./catalog";
import { FireworkEngine } from "./engine";
import { FireworkAudio } from "./audio";
import FireworkPreview from "./FireworkPreview";
import PlaygroundStage from "./PlaygroundStage";
import "./fireworks.css";
export default function FireworksPage() {
  const reduced = useReducedMotion();
  const [selected, setSelected] = useState("rocket"),
    [filter, setFilter] = useState("all"),
    [position, setPosition] = useState({ x: 0.5, y: 0.45 });
  const [muted, setMuted] = useState(false),
    [volume, setVolume] = useState(0.4),
    [low, setLow] = useState(
      () =>
        window.innerWidth < 768 ||
        navigator.hardwareConcurrency <= 4 ||
        !!navigator.connection?.saveData,
    );
  const [paused, setPaused] = useState(false),
    [loading, setLoading] = useState(false),
    [status, setStatus] = useState("Choose your spark. The sky is yours."),
    [stats, setStats] = useState({ launches: 0, particles: 0 });
  const [finaleRunning, setFinaleRunning] = useState(false),
    [finaleDone, setFinaleDone] = useState(false),
    [progress, setProgress] = useState(0),
    [soundNote, setSoundNote] = useState(
      "Field recordings + original designed sound",
    );
  const audio = useRef(null),
    alive = useRef(false),
    pending = useRef(false),
    pausedRef = useRef(paused);
  pausedRef.current = paused;
  const [engine] = useState(
    () =>
      new FireworkEngine({
        sound: (event) => audio.current?.play(event),
        finale: () => {
          setFinaleRunning(false);
          setFinaleDone(true);
          setProgress(1);
          setStatus(
            "Happy Diwali! May your life shine brighter than a thousand fireworks.",
          );
        },
      }),
  );
  function rearmContinuous() {
    if (audio.current?.muted) return;
    for (const emitter of engine.emitters) {
      if (
        [
          "sparkler",
          "fountain",
          "spinner",
          "color",
          "rain",
          "butterfly",
          "lantern",
        ].includes(emitter.id)
      )
        emitter.ignited = false;
    }
    engine.wake?.();
  }
  useEffect(() => {
    alive.current = true;
    const a = new FireworkAudio();
    audio.current = a;
    document.title = "दीपोत्सव — The Fireworks Garden";
    const visibility = () => {
      if (document.hidden) a.suspend();
      else if (!pausedRef.current)
        a.resume()
          ?.then(rearmContinuous)
          .catch(() => setStatus("Tap Launch or Sound to resume audio."));
    };
    document.addEventListener("visibilitychange", visibility);
    return () => {
      alive.current = false;
      a.dispose();
      engine.stop();
      document.removeEventListener("visibilitychange", visibility);
      document.title = "दीपोत्सव — A celebration of light";
    };
  }, [engine]);
  useEffect(() => {
    audio.current?.setMuted(muted);
    audio.current?.setVolume(volume);
  }, [muted, volume]);
  useEffect(() => {
    if (paused) audio.current?.suspend();
    else if (!document.hidden)
      audio.current
        ?.resume()
        ?.then(rearmContinuous)
        .catch(() => {});
  }, [paused]);
  async function launch(id = selected, p = position, mode) {
    if (mode === "ground-required") {
      setStatus(
        "This is a ground firework. Tap the lit terrace at the bottom, or press Launch.",
      );
      return;
    }
    if (pending.current) return;
    pending.current = true;
    setLoading(true);
    try {
      if (!muted) await audio.current.prepare();
      if (audio.current.fallback)
        setSoundNote(
          "Recording unavailable: using designed sound approximations",
        );
    } catch (e) {
      setSoundNote(e.message);
    } finally {
      pending.current = false;
      if (alive.current) setLoading(false);
    }
    if (!alive.current) return;
    setPaused(false);
    setFinaleDone(false);
    const type = id === "multiple" ? selected : id;
    if (type === "finale") {
      if (engine.startFinale()) {
        setFinaleRunning(true);
        setProgress(0);
        setStatus(
          "The Grand Finale has begun. Twenty-six seconds of light and wonder.",
        );
      } else setStatus("Your finale is already in the sky. Enjoy the show.");
    } else if (id === "multiple" || id === "lanterns") {
      const firework = id === "lanterns" ? "lantern" : selected,
        count = id === "lanterns" ? 4 : 3;
      for (let i = 0; i < count; i++)
        engine.schedule(i * 0.25, () =>
          engine.launch(firework, {
            x: Math.max(
              0.08,
              Math.min(0.92, p.x + (i - (count - 1) / 2) * 0.14),
            ),
            y: p.y,
          }),
        );
      setStatus(
        id === "lanterns"
          ? "Four wishes, floating toward the stars."
          : `Launching three ${BY_ID[firework].name} fireworks.`,
      );
    } else {
      const accepted = engine.launch(type, p);
      setStatus(
        accepted
          ? `${BY_ID[type].name} ignited. ${BY_ID[type].description}`
          : "The sky is full of light. Let a few embers settle, then launch again.",
      );
    }
    engine.wake?.();
  }
  async function toggleSound() {
    if (muted) {
      setMuted(false);
      audio.current.setMuted(false);
      try {
        await audio.current.prepare();
        rearmContinuous();
      } catch (e) {
        setSoundNote(e.message);
      }
    } else setMuted(true);
  }
  function stop() {
    engine.stop();
    audio.current?.stop();
    setFinaleRunning(false);
    setFinaleDone(false);
    setProgress(0);
    setPaused(false);
    engine.wake?.();
    setStatus("The night is still. Choose another little spark.");
  }
  const def = BY_ID[selected],
    visible = FIREWORKS.filter((f) => filter === "all" || f.zone === filter);
  return (
    <div className="fw-page">
      <header className="fw-header">
        <Link to="/" className="fw-home">
          <ArrowLeft size={17} />
          <span>Back to Diwali</span>
        </Link>
        <Link to="/" className="fw-brand">
          <Flame size={23} /> दीपोत्सव
        </Link>
        <span className="fw-header-note">
          <span /> A VIRTUAL CELEBRATION
        </span>
      </header>
      <main className="fw-layout" id="fireworks-main">
        <section className="fw-arena" aria-label="Fireworks playground">
          <div className="fw-stage-wrap">
            <PlaygroundStage
              engine={engine}
              selected={selected}
              position={position}
              setPosition={setPosition}
              onLaunch={launch}
              low={low}
              reduced={reduced}
              paused={paused}
              onStats={(s) => {
                setStats(s);
                if (engine.finaleUntil > engine.time)
                  setProgress(1 - (engine.finaleUntil - engine.time) / 26);
              }}
            />
            <div className="fw-settings">
              <div className="fw-volume">
                <button
                  onClick={toggleSound}
                  aria-label={
                    muted ? "Turn firework sound on" : "Mute firework sound"
                  }
                  aria-pressed={!muted}
                >
                  {muted ? <VolumeX size={17} /> : <Volume2 size={17} />}
                  <span>{muted ? "Sound off" : "Sound on"}</span>
                </button>
                <label>
                  <span className="fw-sr-only">Master volume</span>
                  <input
                    aria-label="Master volume"
                    type="range"
                    min="0"
                    max="1"
                    step=".05"
                    value={volume}
                    onChange={(e) => setVolume(Number(e.target.value))}
                  />
                  <output>{Math.round(volume * 100)}%</output>
                </label>
              </div>
              <label className="fw-quality">
                <input
                  type="checkbox"
                  checked={low}
                  onChange={(e) => setLow(e.target.checked)}
                />
                <SlidersHorizontal size={14} /> Low graphics
              </label>
            </div>
            <div className="fw-playback">
              <button
                onClick={() => setPaused((p) => !p)}
                aria-label={paused ? "Resume celebration" : "Pause celebration"}
                aria-pressed={paused}
              >
                {paused ? <Play size={16} /> : <Pause size={16} />}
              </button>
              <button onClick={stop} aria-label="Stop all fireworks">
                <Square size={15} />
              </button>
              <span>{stats.launches} launched</span>
            </div>
            {paused && (
              <div className="fw-paused">
                <Pause size={22} /> Celebration paused
              </div>
            )}
            {finaleRunning && (
              <div className="fw-finale-progress">
                <div>
                  <Sparkles size={14} />
                  <span>GRAND FINALE</span>
                  <span>{Math.min(26, Math.floor(progress * 26))} / 26s</span>
                </div>
                <progress
                  value={progress}
                  max="1"
                  aria-label="Grand Finale progress"
                />
              </div>
            )}
            {finaleDone && (
              <motion.div
                className="fw-finale-message"
                initial={reduced ? false : { opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <button
                  onClick={() => setFinaleDone(false)}
                  aria-label="Dismiss Diwali greeting"
                >
                  <X size={18} />
                </button>
                <span>शुभ दीपावली</span>
                <h2>
                  HAPPY <em>DIWALI</em>
                </h2>
                <p>
                  May your life shine brighter
                  <br />
                  than a thousand fireworks!
                </p>
              </motion.div>
            )}
          </div>
          <div className="fw-launch-dock">
            <div className="fw-dock-main">
              <div className="fw-current">
                <FireworkPreview id={selected} color={def.color} />
                <div>
                  <span>READY TO LIGHT</span>
                  <strong>{def.name}</strong>
                  <small>{def.hindi}</small>
                </div>
              </div>
              <button
                className="fw-launch"
                disabled={loading}
                onClick={() => launch()}
              >
                <Sparkles size={19} />
                {loading
                  ? "Preparing sound…"
                  : selected === "finale"
                    ? "Start the finale"
                    : "Launch firework"}
              </button>
            </div>
            <div className="fw-quick-actions">
              <button disabled={loading} onClick={() => launch("multiple")}>
                <Rocket size={16} /> Launch multiple
              </button>
              <button disabled={loading} onClick={() => launch("lanterns")}>
                <Wind size={16} /> Release lanterns
              </button>
              <button
                disabled={loading || finaleRunning}
                onClick={() => launch("finale")}
              >
                <Sparkles size={16} />{" "}
                {finaleRunning ? "Finale playing…" : "Grand Finale"}
              </button>
            </div>
          </div>
        </section>
        <aside className="fw-panel" aria-label="Firework selection">
          <div className="fw-panel-title">
            <span>YOUR FESTIVAL COLLECTION</span>
            <h2>
              Choose your <em>spark.</em>
            </h2>
            <p>Fourteen ways to light up the night.</p>
          </div>
          <div className="fw-selected-preview">
            <FireworkPreview id={selected} color={def.color} />
            <div>
              <strong>{def.name}</strong>
              <span lang="hi">{def.hindi}</span>
              <p>{def.description}</p>
            </div>
          </div>
          <div className="fw-filter" role="group" aria-label="Filter fireworks">
            {[
              ["all", "All sparks"],
              ["sky", "Sky"],
              ["ground", "Ground"],
            ].map(([id, label]) => (
              <button
                key={id}
                onClick={() => setFilter(id)}
                aria-pressed={filter === id}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="fw-collection">
            {visible.map((f) => (
              <button
                className={`fw-card ${selected === f.id ? "is-selected" : ""}`}
                key={f.id}
                aria-pressed={selected === f.id}
                aria-label={`Select ${f.name}`}
                onClick={() => {
                  setSelected(f.id);
                  setStatus(
                    `${f.name} selected. ${f.zone === "ground" ? "Place it on the terrace." : "Choose a spot in the sky."}`,
                  );
                }}
              >
                <span className="fw-card-zone">
                  {f.zone === "sky" ? "SKY" : "GROUND"}
                </span>
                <FireworkPreview id={f.id} color={f.color} />
                <strong>{f.name}</strong>
                <span className="fw-card-hindi" lang="hi">
                  {f.hindi}
                </span>
                <span className="fw-card-description">{f.description}</span>
                <span className="fw-card-select">
                  {selected === f.id ? (
                    <>
                      <Check size={13} /> Selected
                    </>
                  ) : (
                    <>
                      Select <span>↗</span>
                    </>
                  )}
                </span>
              </button>
            ))}
          </div>
          <div className="fw-audio-note">
            <Volume2 size={13} />
            <div>
              <span>{soundNote}</span>
              <small>{def.audio}</small>
              <a href="/audio/ATTRIBUTION.md" target="_blank" rel="noreferrer">
                Audio credits & licenses ↗
              </a>
            </div>
          </div>
        </aside>
      </main>
      <div className="fw-status" role="status">
        {status}
      </div>
    </div>
  );
}
