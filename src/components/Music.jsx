import { useRef, useState, useEffect } from "react";
import { Volume2, VolumeX } from "lucide-react";
export default function Music({ notify }) {
  const [playing, setPlaying] = useState(false);
  const audio = useRef(null),
    timer = useRef(null);
  useEffect(
    () => () => {
      clearInterval(timer.current);
      audio.current?.close();
    },
    [],
  );
  async function toggle() {
    try {
      if (playing) {
        clearInterval(timer.current);
        await audio.current.suspend();
        setPlaying(false);
        return;
      }
      const Audio = window.AudioContext || window.webkitAudioContext;
      if (!Audio) throw new Error("Audio is unavailable in this browser.");
      if (!audio.current) audio.current = new Audio();
      const ctx = audio.current;
      await ctx.resume();
      // Original pentatonic composition: soft plucked tones over a tanpura-like drone.
      let step = 0;
      const notes = [261.63, 293.66, 329.63, 392, 440, 392, 329.63, 293.66];
      function note(f, duration, gain) {
        const o = ctx.createOscillator(),
          g = ctx.createGain();
        o.type = "sine";
        o.frequency.value = f;
        g.gain.setValueAtTime(0.0001, ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(gain, ctx.currentTime + 0.03);
        g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
        o.connect(g);
        g.connect(ctx.destination);
        o.start();
        o.stop(ctx.currentTime + duration);
      }
      const tick = () => {
        note(notes[step++ % notes.length], 1.8, 0.11);
        if (step % 4 === 1) {
          note(130.81, 3, 0.07);
          note(196, 3, 0.03);
        }
      };
      tick();
      timer.current = setInterval(tick, 720);
      setPlaying(true);
    } catch (e) {
      notify(e.message || "Music could not start. Please try again.");
    }
  }
  return (
    <button
      className="music-toggle"
      onClick={toggle}
      aria-label={playing ? "Mute festive music" : "Play festive music"}
      aria-pressed={playing}
    >
      {playing ? <Volume2 size={16} /> : <VolumeX size={16} />}
      <span>Music {playing ? "on" : "off"}</span>
      <span className={playing ? "sound-dot active" : "sound-dot"} />
    </button>
  );
}
