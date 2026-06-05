// Lightweight Web Audio sound engine. No external assets required.
// Generates short tones/noise procedurally so it ships instantly.

let ctx: AudioContext | null = null;
let muted = false;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC = window.AudioContext || (window as any).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === "suspended") ctx.resume().catch(() => {});
  return ctx;
}

export function setMuted(value: boolean) {
  muted = value;
  if (typeof window !== "undefined") {
    localStorage.setItem("wc_muted", value ? "1" : "0");
  }
  if (value) stopMusic();
  else if (musicWanted) startMusic();
}

export function isMuted(): boolean {
  if (typeof window !== "undefined") {
    const v = localStorage.getItem("wc_muted");
    if (v !== null) muted = v === "1";
  }
  return muted;
}

function tone(opts: {
  freq: number;
  to?: number;
  dur: number;
  type?: OscillatorType;
  gain?: number;
  delay?: number;
}) {
  const ac = getCtx();
  if (!ac || muted) return;
  const t0 = ac.currentTime + (opts.delay ?? 0);
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = opts.type ?? "sine";
  osc.frequency.setValueAtTime(opts.freq, t0);
  if (opts.to) osc.frequency.exponentialRampToValueAtTime(opts.to, t0 + opts.dur);
  const peak = opts.gain ?? 0.18;
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(peak, t0 + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + opts.dur);
  osc.connect(g).connect(ac.destination);
  osc.start(t0);
  osc.stop(t0 + opts.dur + 0.02);
}

function noise(opts: { dur: number; gain?: number; delay?: number; bandpass?: number }) {
  const ac = getCtx();
  if (!ac || muted) return;
  const t0 = ac.currentTime + (opts.delay ?? 0);
  const len = Math.floor(ac.sampleRate * opts.dur);
  const buf = ac.createBuffer(1, len, ac.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  const src = ac.createBufferSource();
  src.buffer = buf;
  const g = ac.createGain();
  const peak = opts.gain ?? 0.15;
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(peak, t0 + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + opts.dur);
  let node: AudioNode = src;
  if (opts.bandpass) {
    const bp = ac.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = opts.bandpass;
    bp.Q.value = 1.2;
    src.connect(bp);
    node = bp;
  }
  node.connect(g).connect(ac.destination);
  src.start(t0);
  src.stop(t0 + opts.dur + 0.02);
}

export const sfx = {
  click: () => tone({ freq: 520, to: 380, dur: 0.08, type: "triangle", gain: 0.1 }),

  spin: () => {
    // whirring spin: rising buzz + ticking
    tone({ freq: 220, to: 520, dur: 1.6, type: "sawtooth", gain: 0.07 });
    for (let i = 0; i < 10; i++) {
      tone({ freq: 1400, dur: 0.04, type: "square", gain: 0.05, delay: 0.15 + i * 0.13 });
    }
  },

  spinStop: () => {
    tone({ freq: 900, to: 200, dur: 0.35, type: "triangle", gain: 0.18 });
    noise({ dur: 0.18, gain: 0.1, bandpass: 1200 });
  },

  correct: () => {
    // happy arpeggio
    tone({ freq: 660, dur: 0.12, type: "triangle", gain: 0.18 });
    tone({ freq: 880, dur: 0.12, type: "triangle", gain: 0.18, delay: 0.1 });
    tone({ freq: 1320, dur: 0.22, type: "triangle", gain: 0.2, delay: 0.2 });
  },

  wrong: () => {
    tone({ freq: 280, to: 110, dur: 0.45, type: "sawtooth", gain: 0.18 });
    noise({ dur: 0.2, gain: 0.08, bandpass: 400, delay: 0.05 });
  },

  tick: () => tone({ freq: 1200, dur: 0.04, type: "square", gain: 0.06 }),

  var: () => {
    // VAR alert: two-note radio chime
    tone({ freq: 980, dur: 0.12, type: "square", gain: 0.14 });
    tone({ freq: 1320, dur: 0.18, type: "square", gain: 0.14, delay: 0.13 });
    noise({ dur: 0.4, gain: 0.04, bandpass: 2000, delay: 0.32 });
  },

  extraTime: () => {
    tone({ freq: 520, to: 780, dur: 0.18, type: "triangle", gain: 0.16 });
    tone({ freq: 780, to: 1040, dur: 0.18, type: "triangle", gain: 0.16, delay: 0.16 });
  },

  trophy: () => {
    // fanfare
    const notes = [523, 659, 784, 1047];
    notes.forEach((f, i) =>
      tone({ freq: f, dur: 0.25, type: "triangle", gain: 0.2, delay: i * 0.12 })
    );
    tone({ freq: 1047, dur: 0.5, type: "triangle", gain: 0.18, delay: 0.55 });
    noise({ dur: 0.6, gain: 0.05, bandpass: 6000, delay: 0.5 });
  },

  defeat: () => {
    const notes = [523, 466, 392, 311];
    notes.forEach((f, i) =>
      tone({ freq: f, dur: 0.3, type: "sawtooth", gain: 0.15, delay: i * 0.15 })
    );
  },

  whistle: () => {
    // referee whistle: high tone with fast tremolo
    const ac = getCtx();
    if (!ac || muted) return;
    const t0 = ac.currentTime;
    const osc = ac.createOscillator();
    const lfo = ac.createOscillator();
    const lfoGain = ac.createGain();
    const g = ac.createGain();
    osc.type = "sine";
    osc.frequency.value = 2400;
    lfo.frequency.value = 18;
    lfoGain.gain.value = 120;
    lfo.connect(lfoGain).connect(osc.frequency);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(0.22, t0 + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.6);
    osc.connect(g).connect(ac.destination);
    osc.start(t0);
    lfo.start(t0);
    osc.stop(t0 + 0.65);
    lfo.stop(t0 + 0.65);
  },
};
