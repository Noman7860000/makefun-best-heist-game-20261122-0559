// audio.js — tiny synthesised sound effects, no audio files.
//
// Every sound is an oscillator (or two) through the Web Audio API, so the
// game ships no samples and makes no network request. Audio starts only
// after the player's first gesture, as browsers require.

let ctx = null;
let muted = false;

/** Create (or reuse) the audio context after a user gesture. */
export function ensureAudio() {
  if (ctx === null) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
  }
  if (ctx.state === 'suspended') ctx.resume();
}

/** Toggle mute; returns the new muted state. */
export function toggleMute() {
  muted = !muted;
  return muted;
}

export function isMuted() {
  return muted;
}

/** Play one oscillator note: frequency, seconds, wave shape, volume. */
function tone(freq, seconds, type = 'sine', volume = 0.12, delay = 0) {
  if (ctx === null || muted) return;
  const start = ctx.currentTime + delay;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(volume, start + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + seconds);
  osc.connect(gain).connect(ctx.destination);
  osc.start(start);
  osc.stop(start + seconds + 0.05);
}

/** A soft two-note chime when loot is pocketed. */
export function playPickup() {
  tone(880, 0.14, 'sine', 0.14);
  tone(1318, 0.22, 'sine', 0.12, 0.09);
}

/** The diamond's brighter fanfare. */
export function playDiamond() {
  tone(659, 0.14, 'triangle', 0.14);
  tone(988, 0.14, 'triangle', 0.14, 0.09);
  tone(1318, 0.3, 'triangle', 0.13, 0.18);
}

/** A short rising sting when a guard or camera spots the thief. */
export function playSpotted() {
  tone(220, 0.16, 'sawtooth', 0.09);
  tone(311, 0.24, 'sawtooth', 0.09, 0.12);
}

/** The coin's high ping as it lands and distracts a guard. */
export function playCoin() {
  tone(1568, 0.1, 'square', 0.05);
  tone(2093, 0.16, 'square', 0.045, 0.07);
}

/** A low whoosh for the smoke pellet. */
export function playSmoke() {
  tone(320, 0.3, 'sine', 0.1);
  tone(180, 0.4, 'sine', 0.09, 0.08);
}

/** The getaway arpeggio on a clean win. */
export function playWin() {
  [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.28, 'triangle', 0.13, i * 0.11));
}

/** A low falling note when the heist is busted. */
export function playBusted() {
  tone(196, 0.5, 'sawtooth', 0.1);
  tone(131, 0.8, 'sawtooth', 0.1, 0.3);
}
