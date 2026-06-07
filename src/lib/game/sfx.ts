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

// ============================================================
// Sophisticated cinematic anthem — orchestral chord progression
// Em – C – G – D, slow swelling pads + harp arpeggio + soft timpani
// ============================================================
let musicWanted = false;
let musicTimer: ReturnType<typeof setInterval> | null = null;
let musicGain: GainNode | null = null;
let musicBus: BiquadFilterNode | null = null;
let musicReverb: ConvolverNode | null = null;
let barIndex = 0;

// Chord voicings (Hz). Three voices per chord: root, third, fifth (with an extra higher tone).
const CHORDS: { name: string; notes: number[]; arp: number[] }[] = [
  // E minor
  { name: "Em", notes: [164.81, 196.0, 246.94, 329.63], arp: [329.63, 392.0, 493.88, 659.25] },
  // C major
  { name: "C",  notes: [130.81, 196.0, 261.63, 392.0],  arp: [261.63, 329.63, 392.0, 523.25] },
  // G major
  { name: "G",  notes: [196.0, 246.94, 392.0, 493.88],  arp: [392.0, 493.88, 587.33, 783.99] },
  // D major
  { name: "D",  notes: [146.83, 220.0, 293.66, 440.0],  arp: [293.66, 369.99, 440.0, 587.33] },
];

function ensureBus() {
  const ac = getCtx();
  if (!ac) return null;
  if (!musicGain) {
    musicGain = ac.createGain();
    musicGain.gain.value = 0.0001;

    // Warm low-pass for an orchestral, distant-stadium feel
    musicBus = ac.createBiquadFilter();
    musicBus.type = "lowpass";
    musicBus.frequency.value = 3800;
    musicBus.Q.value = 0.4;

    // Lightweight algorithmic reverb (impulse from decaying noise)
    musicReverb = ac.createConvolver();
    const len = Math.floor(ac.sampleRate * 1.8);
    const ir = ac.createBuffer(2, len, ac.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = ir.getChannelData(ch);
      for (let i = 0; i < len; i++) {
        d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3.2);
      }
    }
    musicReverb.buffer = ir;
    const wet = ac.createGain();
    wet.gain.value = 0.35;
    const dry = ac.createGain();
    dry.gain.value = 0.85;

    musicBus.connect(dry).connect(musicGain);
    musicBus.connect(musicReverb).connect(wet).connect(musicGain);
    musicGain.connect(ac.destination);
  }
  return ac;
}

// Sustained string-pad voice — slow attack, slow release
function pad(ac: AudioContext, t: number, freq: number, dur: number, level: number, dest: AudioNode) {
  const o1 = ac.createOscillator();
  const o2 = ac.createOscillator();
  const o3 = ac.createOscillator();
  o1.type = "sawtooth";
  o2.type = "sawtooth";
  o3.type = "triangle";
  o1.frequency.value = freq;
  o2.frequency.value = freq * 1.005; // slight detune for chorus shimmer
  o3.frequency.value = freq * 2;     // octave sparkle
  const g = ac.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(level, t + dur * 0.35);
  g.gain.setValueAtTime(level, t + dur * 0.7);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o1.connect(g);
  o2.connect(g);
  const g3 = ac.createGain();
  g3.gain.value = 0.35;
  o3.connect(g3).connect(g);
  g.connect(dest);
  o1.start(t); o2.start(t); o3.start(t);
  o1.stop(t + dur + 0.05); o2.stop(t + dur + 0.05); o3.stop(t + dur + 0.05);
}

// Plucked harp/celesta note
function pluck(ac: AudioContext, t: number, freq: number, dur: number, dest: AudioNode) {
  const o = ac.createOscillator();
  const g = ac.createGain();
  o.type = "sine";
  o.frequency.value = freq;
  // soft hammer harmonic
  const o2 = ac.createOscillator();
  const g2 = ac.createGain();
  o2.type = "triangle";
  o2.frequency.value = freq * 2;
  g2.gain.value = 0.15;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.22, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g);
  o2.connect(g2).connect(g);
  g.connect(dest);
  o.start(t); o2.start(t);
  o.stop(t + dur + 0.02); o2.stop(t + dur + 0.02);
}

// Soft timpani — low resonant thud
function timpani(ac: AudioContext, t: number, freq: number, dest: AudioNode) {
  const o = ac.createOscillator();
  const g = ac.createGain();
  o.type = "sine";
  o.frequency.setValueAtTime(freq * 1.4, t);
  o.frequency.exponentialRampToValueAtTime(freq, t + 0.08);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.5, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.6);
  o.connect(g).connect(dest);
  o.start(t); o.stop(t + 0.65);
}

function scheduleBar() {
  const ac = ensureBus();
  if (!ac || !musicBus) return;
  const bpm = 76;
  const beat = 60 / bpm;        // ~0.789s
  const barDur = beat * 4;       // 4/4
  const t0 = ac.currentTime + 0.05;

  const chord = CHORDS[barIndex % CHORDS.length];

  // Sustained string pad — full bar, soft
  chord.notes.forEach((f, i) => {
    pad(ac, t0, f, barDur * 1.05, i === 0 ? 0.09 : 0.07, musicBus!);
  });

  // Soft timpani on beat 1; light tap on beat 3
  timpani(ac, t0, chord.notes[0], musicBus!);
  timpani(ac, t0 + beat * 2, chord.notes[0] * 0.75, musicBus!);

  // Harp arpeggio — 8th notes, rising then resolving
  const pattern = [0, 1, 2, 3, 2, 1, 2, 3];
  for (let i = 0; i < 8; i++) {
    const t = t0 + i * (beat / 2);
    const note = chord.arp[pattern[i] % chord.arp.length];
    pluck(ac, t, note, 0.55, musicBus!);
  }

  barIndex++;
}

export function startMusic() {
  musicWanted = true;
  if (muted) return;
  const ac = ensureBus();
  if (!ac || !musicGain) return;
  if (musicTimer) return;
  musicGain.gain.cancelScheduledValues(ac.currentTime);
  musicGain.gain.exponentialRampToValueAtTime(0.28, ac.currentTime + 1.4);
  scheduleBar();
  // 4 beats @ 76 bpm ≈ 3157ms per bar
  musicTimer = setInterval(scheduleBar, Math.round((60 / 76) * 4 * 1000));
}

export function stopMusic() {
  musicWanted = false;
  if (musicTimer) {
    clearInterval(musicTimer);
    musicTimer = null;
  }
  const ac = getCtx();
  if (ac && musicGain) {
    musicGain.gain.cancelScheduledValues(ac.currentTime);
    musicGain.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + 0.8);
  }
}

export function isMusicOn() {
  return musicWanted;
}

