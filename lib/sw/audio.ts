"use client";

/**
 * Moteur audio Conseil Jedi — sons synthétisés Web Audio.
 *
 * Pas d'assets : tout est généré à la volée via OscillatorNode + filtres.
 * Avantages : pas de droits, pas de poids, instantané. Limites : pas un
 * vrai sabre — c'est évocateur, pas Hollywoodien.
 *
 * Opt-in strict : `localStorage.speetch_audio_enabled = "true"` pour activer.
 * Par défaut OFF — un admin tool qui beep sans demander = pire UX.
 *
 * Toutes les fonctions `play*` sont **safe no-op** si audio désactivé,
 * AudioContext indisponible (SSR, vieux navigateur), ou prefers-reduced-motion.
 */

const STORAGE_KEY = "speetch_audio_enabled";
const LISTENERS = new Set<(enabled: boolean) => void>();

let cachedCtx: AudioContext | null = null;

function getContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (cachedCtx) return cachedCtx;
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioCtx) return null;
    cachedCtx = new AudioCtx();
    return cachedCtx;
  } catch {
    return null;
  }
}

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
}

export function isAudioEnabled(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

export function setAudioEnabled(enabled: boolean): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, enabled ? "true" : "false");
  } catch {
    /* noop */
  }
  // Reprend le ctx si suspendu (autoplay policy) — ne fait rien si déjà actif.
  if (enabled) {
    const ctx = getContext();
    if (ctx && ctx.state === "suspended") {
      void ctx.resume();
    }
  }
  LISTENERS.forEach((l) => l(enabled));
}

export function subscribeAudio(listener: (enabled: boolean) => void): () => void {
  LISTENERS.add(listener);
  return () => {
    LISTENERS.delete(listener);
  };
}

function canPlay(): AudioContext | null {
  if (!isAudioEnabled()) return null;
  if (prefersReducedMotion()) return null;
  return getContext();
}

/* ─── Sabre laser — allumage : sweep ascendant 60→180 Hz, ~0.6s ───────── */
export function playLightsaberIgnite(): void {
  const ctx = canPlay();
  if (!ctx) return;
  const now = ctx.currentTime;

  const osc1 = ctx.createOscillator();
  const osc2 = ctx.createOscillator();
  osc1.type = "sawtooth";
  osc2.type = "sawtooth";
  osc1.frequency.setValueAtTime(60, now);
  osc1.frequency.exponentialRampToValueAtTime(180, now + 0.25);
  osc2.frequency.setValueAtTime(63, now);
  osc2.frequency.exponentialRampToValueAtTime(186, now + 0.25);

  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.Q.value = 1.2;
  filter.frequency.setValueAtTime(380, now);
  filter.frequency.linearRampToValueAtTime(820, now + 0.25);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.16, now + 0.05);
  gain.gain.linearRampToValueAtTime(0.1, now + 0.35);
  gain.gain.linearRampToValueAtTime(0, now + 0.6);

  osc1.connect(filter);
  osc2.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);

  osc1.start(now);
  osc2.start(now);
  osc1.stop(now + 0.65);
  osc2.stop(now + 0.65);
}

/* ─── Sabre laser — extinction : sweep descendant 180→60 Hz, ~0.5s ────── */
export function playLightsaberOff(): void {
  const ctx = canPlay();
  if (!ctx) return;
  const now = ctx.currentTime;

  const osc1 = ctx.createOscillator();
  const osc2 = ctx.createOscillator();
  osc1.type = "sawtooth";
  osc2.type = "sawtooth";
  osc1.frequency.setValueAtTime(180, now);
  osc1.frequency.exponentialRampToValueAtTime(55, now + 0.4);
  osc2.frequency.setValueAtTime(186, now);
  osc2.frequency.exponentialRampToValueAtTime(58, now + 0.4);

  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.Q.value = 1.0;
  filter.frequency.setValueAtTime(820, now);
  filter.frequency.linearRampToValueAtTime(280, now + 0.4);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.14, now);
  gain.gain.linearRampToValueAtTime(0, now + 0.5);

  osc1.connect(filter);
  osc2.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);

  osc1.start(now);
  osc2.start(now);
  osc1.stop(now + 0.55);
  osc2.stop(now + 0.55);
}

/* ─── Force chime — accord sine 3 notes (do/mi/sol) avec decay ─────────── */
export function playForceChime(): void {
  const ctx = canPlay();
  if (!ctx) return;
  const now = ctx.currentTime;

  const frequencies = [523.25, 659.25, 783.99]; // C5, E5, G5 — accord majeur

  frequencies.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, now);

    const gain = ctx.createGain();
    const startTime = now + i * 0.08; // léger arpège
    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(0.12, startTime + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 1.6);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(startTime);
    osc.stop(startTime + 1.7);
  });
}

/* ─── R2-D2 beep — 2 chirps rapides montants ────────────────────────────── */
export function playR2Beep(): void {
  const ctx = canPlay();
  if (!ctx) return;
  const now = ctx.currentTime;

  const chirps = [
    { start: 0, fromHz: 1200, toHz: 1800, dur: 0.08 },
    { start: 0.12, fromHz: 900, toHz: 2400, dur: 0.1 },
  ];

  chirps.forEach((c) => {
    const osc = ctx.createOscillator();
    osc.type = "square";
    osc.frequency.setValueAtTime(c.fromHz, now + c.start);
    osc.frequency.exponentialRampToValueAtTime(c.toHz, now + c.start + c.dur);

    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.Q.value = 6;
    filter.frequency.value = 1800;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, now + c.start);
    gain.gain.linearRampToValueAtTime(0.08, now + c.start + 0.01);
    gain.gain.linearRampToValueAtTime(0, now + c.start + c.dur);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now + c.start);
    osc.stop(now + c.start + c.dur + 0.02);
  });
}

/* ─── Click feedback subtil (pour boutons clés) ──────────────────────────── */
export function playClickBlip(): void {
  const ctx = canPlay();
  if (!ctx) return;
  const now = ctx.currentTime;

  const osc = ctx.createOscillator();
  osc.type = "sine";
  osc.frequency.setValueAtTime(880, now);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.05, now + 0.005);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.1);
}
