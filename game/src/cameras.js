// cameras.js — wall-mounted security cameras that sweep their arc.
//
// A camera is fixed to a wall and sweeps back and forth across its arc,
// painting a red cone on the floor. It never moves and never stops, so its
// rhythm is the one thing the player can count on: watch the sweep, cross
// when it looks away. A camera raises the alarm faster than a guard, but it
// cannot chase and it cannot hear a coin.

import { CAMERA_VIEW_HALF_ANGLE, CAMERA_VIEW_RANGE } from './config.js';
import { canSee } from './level.js';

export class Camera {
  constructor(def) {
    this.name = def.name;
    this.x = def.x;
    this.y = def.y;
    this.baseAngle = def.baseAngle;
    this.sweep = def.sweep;
    this.speed = def.speed;
    this.phase = 0;
    this.angle = def.baseAngle;
    this.seeingPlayer = false;
  }

  /** Advance the sweep; returns true while the camera sees the thief. */
  update(dt, player, smoke, solids) {
    this.phase += dt * this.speed;
    // Ping-pong sweep: sin gives a smooth back-and-forth across the arc.
    this.angle = this.baseAngle + Math.sin(this.phase) * this.sweep;
    const hiddenBySmoke = smoke.some((c) => Math.hypot(player.x - c.x, player.y - c.y) < c.r);
    this.seeingPlayer =
      !hiddenBySmoke &&
      canSee(this.x, this.y, this.angle, CAMERA_VIEW_HALF_ANGLE, CAMERA_VIEW_RANGE, player.x, player.y, solids);
    return this.seeingPlayer;
  }

  /** The cone's tip-to-arc polygon, for the renderer. */
  conePolygon() {
    const pts = [{ x: this.x, y: this.y }];
    const steps = 14;
    for (let i = 0; i <= steps; i++) {
      const a = this.angle - CAMERA_VIEW_HALF_ANGLE + (2 * CAMERA_VIEW_HALF_ANGLE * i) / steps;
      pts.push({ x: this.x + Math.cos(a) * CAMERA_VIEW_RANGE, y: this.y + Math.sin(a) * CAMERA_VIEW_RANGE });
    }
    return pts;
  }
}

/** Build the camera roster from the level's camera definitions. */
export function createCameras(defs) {
  return defs.map((d) => new Camera(d));
}
