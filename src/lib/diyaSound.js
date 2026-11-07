// Original, short lighting chime. Created only from a visitor's lighting gesture.
let context;
export async function playDiyaSound() {
  try {
    const Audio = window.AudioContext || window.webkitAudioContext;
    if (!Audio) return;
    if (!context || context.state === "closed") context = new Audio();
    await context.resume();
    const now = context.currentTime;
    for (const [frequency, volume, delay] of [
      [660, 0.11, 0],
      [1320, 0.036, 0.045],
    ]) {
      const tone = context.createOscillator();
      const gain = context.createGain();
      const start = now + delay;
      tone.type = "sine";
      tone.frequency.setValueAtTime(frequency * 0.7, start);
      tone.frequency.exponentialRampToValueAtTime(frequency, start + 0.08);
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(volume, start + 0.025);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.65);
      tone.connect(gain);
      gain.connect(context.destination);
      tone.onended = () => {
        tone.disconnect();
        gain.disconnect();
      };
      tone.start(start);
      tone.stop(start + 0.7);
    }
  } catch {
    // Audio restrictions must never prevent a diya from lighting.
  }
}
