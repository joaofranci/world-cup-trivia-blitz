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
// Addictive stadium anthem — fast 128bpm with kick/snare/hihat,
// pumping bass, catchy lead hook & brass stabs. "Olé olé" energy.
// ============================================================
let musicWanted = false;
let musicTimer: ReturnType<typeof setInterval> | null = null;
let musicGain: GainNode | null = null;
let musicBus: BiquadFilterNode | null = null;
let barIndex = 0;

// 4-bar loop chord roots (Hz): i – VI – III – VII (Em – C – G – D)
const ROOTS = [82.41, 65.41, 98.0, 73.42];     // E2 C2 G2 D2
// Lead hook (in E minor pentatonic) — 16 sixteenth-notes per bar
// pitches as scale degrees; -1 = rest
const HOOK_DEGREES = [
  [0, 0, 2, 0, 4, 2, 0, -1,  5, 4, 2, 0, 2, 0, -1, -1],
  [0, 0, 2, 0, 4, 2, 0, -1,  7, 5, 4, 2, 0, -1, -1, -1],
  [0, 0, 2, 0, 4, 2, 0, -1,  5, 4, 2, 0, 2, 4, 5, 4],
  [7, 7, 5, 4, 5, 4, 2, 0,  2, 0, -1, 0, 2, 4, -1, -1],
];
// E minor pentatonic ascending (Hz) starting E4
const SCALE = [329.63, 392.0, 440.0, 493.88, 587.33, 659.25, 783.99, 880.0];

function ensureBus() {
  const ac = getCtx();
  if (!ac) return null;
  if (!musicGain) {
    musicGain = ac.createGain();
    musicGain.gain.value = 0.0001;

    musicBus = ac.createBiquadFilter();
    musicBus.type = "lowpass";
    musicBus.frequency.value = 9000;
    musicBus.Q.value = 0.3;

    musicBus.connect(musicGain);
    musicGain.connect(ac.destination);
  }
  return ac;
}

function kick(ac: AudioContext, t: number, dest: AudioNode) {
  const o = ac.createOscillator();
  const g = ac.createGain();
  o.type = "sine";
  o.frequency.setValueAtTime(150, t);
  o.frequency.exponentialRampToValueAtTime(45, t + 0.12);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.7, t + 0.005);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.25);
  o.connect(g).connect(dest);
  o.start(t); o.stop(t + 0.3);
}

function snare(ac: AudioContext, t: number, dest: AudioNode) {
  const len = Math.floor(ac.sampleRate * 0.18);
  const buf = ac.createBuffer(1, len, ac.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 1.6);
  const src = ac.createBufferSource(); src.buffer = buf;
  const bp = ac.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = 1800; bp.Q.value = 0.7;
  const g = ac.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.35, t + 0.005);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
  src.connect(bp).connect(g).connect(dest);
  src.start(t); src.stop(t + 0.2);
}

function hat(ac: AudioContext, t: number, dest: AudioNode, open = false) {
  const len = Math.floor(ac.sampleRate * (open ? 0.12 : 0.04));
  const buf = ac.createBuffer(1, len, ac.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  const src = ac.createBufferSource(); src.buffer = buf;
  const hp = ac.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = 7000;
  const g = ac.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(open ? 0.18 : 0.12, t + 0.003);
  g.gain.exponentialRampToValueAtTime(0.0001, t + (open ? 0.12 : 0.04));
  src.connect(hp).connect(g).connect(dest);
  src.start(t); src.stop(t + 0.15);
}

function bassNote(ac: AudioContext, t: number, freq: number, dur: number, dest: AudioNode) {
  const o = ac.createOscillator();
  const o2 = ac.createOscillator();
  const g = ac.createGain();
  o.type = "sawtooth"; o2.type = "square";
  o.frequency.value = freq; o2.frequency.value = freq * 0.5;
  const lp = ac.createBiquadFilter(); lp.type = "lowpass";
  lp.frequency.setValueAtTime(1400, t);
  lp.frequency.exponentialRampToValueAtTime(400, t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.25, t + 0.01);
  g.gain.setValueAtTime(0.25, t + dur * 0.7);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(lp); o2.connect(lp);
  lp.connect(g).connect(dest);
  o.start(t); o2.start(t);
  o.stop(t + dur + 0.02); o2.stop(t + dur + 0.02);
}

function leadNote(ac: AudioContext, t: number, freq: number, dur: number, dest: AudioNode) {
  const o = ac.createOscillator();
  const o2 = ac.createOscillator();
  const g = ac.createGain();
  o.type = "square"; o2.type = "sawtooth";
  o.frequency.value = freq; o2.frequency.value = freq * 1.01;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.16, t + 0.005);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); o2.connect(g);
  g.connect(dest);
  o.start(t); o2.start(t);
  o.stop(t + dur + 0.02); o2.stop(t + dur + 0.02);
}

function brassStab(ac: AudioContext, t: number, freq: number, dest: AudioNode) {
  const o = ac.createOscillator();
  const o2 = ac.createOscillator();
  const g = ac.createGain();
  o.type = "sawtooth"; o2.type = "sawtooth";
  o.frequency.value = freq; o2.frequency.value = freq * 1.5;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.18, t + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
  o.connect(g); o2.connect(g);
  g.connect(dest);
  o.start(t); o2.start(t);
  o.stop(t + 0.25); o2.stop(t + 0.25);
}

function scheduleBar() {
  const ac = ensureBus();
  if (!ac || !musicBus) return;
  const bpm = 128;
  const beat = 60 / bpm;          // 0.469s
  const sixteenth = beat / 4;
  const t0 = ac.currentTime + 0.05;

  const root = ROOTS[barIndex % ROOTS.length];
  const hook = HOOK_DEGREES[barIndex % HOOK_DEGREES.length];

  // Drums — four-on-the-floor kick, snare on 2 & 4, 8th hats
  for (let b = 0; b < 4; b++) {
    kick(ac, t0 + b * beat, musicBus);
    if (b === 1 || b === 3) snare(ac, t0 + b * beat, musicBus);
  }
  for (let i = 0; i < 8; i++) {
    hat(ac, t0 + i * (beat / 2), musicBus, i === 7);
  }

  // Bass — pumping 8th notes on root, octave on offbeats
  for (let i = 0; i < 8; i++) {
    const f = i % 2 === 0 ? root : root * 2;
    bassNote(ac, t0 + i * (beat / 2), f, beat / 2 * 0.95, musicBus);
  }

  // Lead hook — 16 sixteenth steps
  for (let i = 0; i < 16; i++) {
    const deg = hook[i];
    if (deg < 0) continue;
    leadNote(ac, t0 + i * sixteenth, SCALE[deg], sixteenth * 1.6, musicBus);
  }

  // Brass stabs on beats 1 & 3 every other bar — "olé!"
  if (barIndex % 2 === 1) {
    brassStab(ac, t0, root * 4, musicBus);
    brassStab(ac, t0 + beat * 2, root * 4, musicBus);
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
  musicGain.gain.exponentialRampToValueAtTime(0.32, ac.currentTime + 0.6);
  scheduleBar();
  // 4 beats @ 128 bpm = 1875ms per bar
  musicTimer = setInterval(scheduleBar, Math.round((60 / 128) * 4 * 1000));
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
    musicGain.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + 0.4);
  }
}

export function isMusicOn() {
  return musicWanted;
}


