// guards.js — the gallery's night guards: patrol, spot, investigate.
//
// A guard walks its waypoint loop and looks where it walks. When it sees
// the thief it turns alert, hurries to the last seen spot, and stays
// suspicious for a while; when it loses the thief it investigates the spot
// it last saw them, then goes back to its patrol. Guards never teleport and
// never see through walls, smoke, or their own cone's edge — the player can
// always read the patrol and slip behind it.

import { GUARD_CATCH_DISTANCE, GUARD_CHASE_SPEED, GUARD_INVESTIGATE_SECONDS, GUARD_PATROL_SPEED, GUARD_VIEW_HALF_ANGLE, GUARD_VIEW_RANGE } from './config.js';
import { angleDifference, canSee, resolveCircle } from './level.js';

export class Guard {
  constructor(def) {
    this.name = def.name;
    this.waypoints = def.waypoints;
    this.speed = def.speed ?? GUARD_PATROL_SPEED;
    this.x = def.waypoints[0].x;
    this.y = def.waypoints[0].y;
    this.targetIndex = 1 % def.waypoints.length;
    this.angle = 0;
    this.state = 'patrol'; // patrol | alert | investigate | return
    this.alertTimer = 0;
    this.investigatePoint = null;
    this.lastSeen = null;
    this.suspicion = 0; // 0..1, shown as a "?" / "!" over the guard
    this.caughtPlayer = false;
  }

  /** Turn smoothly toward `targetAngle`, at most `rate` radians a second. */
  turnToward(targetAngle, dt, rate) {
    let diff = targetAngle - this.angle;
    while (diff > Math.PI) diff -= 2 * Math.PI;
    while (diff < -Math.PI) diff += 2 * Math.PI;
    const step = Math.max(-rate * dt, Math.min(rate * dt, diff));
    this.angle += step;
  }

  /** Move toward (tx, ty) at `speed`, sliding along solids; returns arrival. */
  moveToward(tx, ty, speed, dt, solids) {
    const dx = tx - this.x;
    const dy = ty - this.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 1) return true;
    const step = Math.min(dist, speed * dt);
    const nx = this.x + (dx / dist) * step;
    const ny = this.y + (dy / dist) * step;
    this.turnToward(Math.atan2(dy, dx), dt, 5.5);
    const afterX = resolveCircle(nx, this.y, 15, solids);
    const after = resolveCircle(afterX.x, ny, 15, solids);
    this.x = after.x;
    this.y = after.y;
    return Math.hypot(tx - this.x, ty - this.y) < 4;
  }

  /**
   * One tick. `player` is {x, y, hidden} and `smoke` is the list of smoke
   * clouds. Returns 'spotted' on the first frame the guard sees the thief.
   */
  update(dt, player, smoke, solids) {
    const hiddenBySmoke = smoke.some((c) => Math.hypot(player.x - c.x, player.y - c.y) < c.r);
    const sees = !hiddenBySmoke && canSee(this.x, this.y, this.angle, GUARD_VIEW_HALF_ANGLE, GUARD_VIEW_RANGE, player.x, player.y, solids);
    let spotted = false;
    if (sees) {
      this.lastSeen = { x: player.x, y: player.y };
      this.suspicion = 1;
      if (this.state !== 'alert') {
        this.state = 'alert';
        this.alertTimer = GUARD_INVESTIGATE_SECONDS;
        spotted = true;
      }
    } else if (this.suspicion > 0) {
      this.suspicion = Math.max(0, this.suspicion - dt * 0.35);
    }

    if (this.state === 'alert') {
      if (this.lastSeen) {
        const arrived = this.moveToward(this.lastSeen.x, this.lastSeen.y, GUARD_CHASE_SPEED, dt, solids);
        if (arrived || !sees) {
          this.alertTimer -= dt;
          if (this.alertTimer <= 0) {
            this.state = 'investigate';
            this.investigatePoint = { ...this.lastSeen };
          }
        } else {
          this.alertTimer = GUARD_INVESTIGATE_SECONDS;
        }
      }
    } else if (this.state === 'investigate' && this.investigatePoint) {
      const arrived = this.moveToward(this.investigatePoint.x, this.investigatePoint.y, this.speed * 1.25, dt, solids);
      if (arrived) {
        this.state = 'return';
        this.investigatePoint = null;
      }
    } else if (this.state === 'return') {
      const wp = this.waypoints[this.targetIndex];
      if (this.moveToward(wp.x, wp.y, this.speed, dt, solids)) {
        this.targetIndex = (this.targetIndex + 1) % this.waypoints.length;
        this.state = 'patrol';
      }
    } else {
      const wp = this.waypoints[this.targetIndex];
      if (this.moveToward(wp.x, wp.y, this.speed, dt, solids)) {
        this.targetIndex = (this.targetIndex + 1) % this.waypoints.length;
      }
    }

    if (Math.hypot(player.x - this.x, player.y - this.y) < GUARD_CATCH_DISTANCE) {
      this.caughtPlayer = true;
    }
    return sees && spotted ? 'spotted' : null;
  }

  /** The cone's tip-to-arc polygon, for the renderer. */
  conePolygon() {
    const pts = [{ x: this.x, y: this.y }];
    const steps = 14;
    for (let i = 0; i <= steps; i++) {
      const a = this.angle - GUARD_VIEW_HALF_ANGLE + (2 * GUARD_VIEW_HALF_ANGLE * i) / steps;
      pts.push({ x: this.x + Math.cos(a) * GUARD_VIEW_RANGE, y: this.y + Math.sin(a) * GUARD_VIEW_RANGE });
    }
    return pts;
  }

  /** How on-edge this guard is, 0 (calm) to 1 (fully alert). */
  alertness() {
    return this.state === 'alert' ? 1 : this.state === 'investigate' ? 0.6 : this.suspicion * 0.4;
  }
}

/** Build the guard roster from the level's patrol definitions. */
export function createGuards(defs) {
  return defs.map((d) => new Guard(d));
}

/**
 * The nearest guard to (x, y) within `maxDist`, or null. Used by the
 * coin toss: only a guard close enough hears it land.
 */
export function nearestGuard(guards, x, y, maxDist) {
  let best = null;
  let bestD = maxDist;
  for (const g of guards) {
    const d = Math.hypot(g.x - x, g.y - y);
    if (d < bestD) {
      bestD = d;
      best = g;
    }
  }
  return best;
}
