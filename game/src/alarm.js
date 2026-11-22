// alarm.js — the alarm meter: suspicion that rises, and recovery.
//
// Being seen is not instant failure. The alarm climbs while any guard or
// camera has eyes on the thief and falls again the moment the thief breaks
// line of sight, so a bad step costs time and nerve, not the run — unless
// the meter fills all the way. Sneaking halves how fast it climbs.

import { ALARM_CAMERA_RATE, ALARM_DECAY_RATE, ALARM_GUARD_RATE, ALARM_MAX, ALARM_SNEAK_FACTOR, ALARM_SPOTTED_AT } from './config.js';

export class Alarm {
  constructor() {
    this.value = 0;
    this.maxed = false;
    this.spotted = false; // true while any watcher currently sees the thief
    this.wasSpotted = false;
  }

  /**
   * One tick. `seenByGuard` / `seenByCamera` say whether any watcher has
   * the thief right now; `sneaking` halves the climb. Returns 'spotted' on
   * the frame the alarm first notices the thief, 'maxed' when it fills.
   */
  update(dt, seenByGuard, seenByCamera, sneaking) {
    this.spotted = seenByGuard || seenByCamera;
    let event = null;
    if (this.spotted) {
      let rate = 0;
      if (seenByGuard) rate += ALARM_GUARD_RATE;
      if (seenByCamera) rate += ALARM_CAMERA_RATE;
      if (sneaking) rate *= ALARM_SNEAK_FACTOR;
      this.value = Math.min(ALARM_MAX, this.value + rate * dt);
      if (!this.wasSpotted) event = 'spotted';
    } else {
      this.value = Math.max(0, this.value - ALARM_DECAY_RATE * dt);
    }
    this.wasSpotted = this.spotted;
    if (this.value >= ALARM_MAX && !this.maxed) {
      this.maxed = true;
      event = 'maxed';
    }
    return event;
  }

  /** 0..1, for the HUD bar. */
  fraction() {
    return this.value / ALARM_MAX;
  }

  /** The meter's mood: calm, wary, or hot — drives its colour and pulse. */
  mood() {
    if (this.value >= ALARM_SPOTTED_AT) return 'hot';
    if (this.value >= 25) return 'wary';
    return 'calm';
  }

  reset() {
    this.value = 0;
    this.maxed = false;
    this.spotted = false;
    this.wasSpotted = false;
  }
}
