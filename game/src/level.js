// level.js — room geometry: collision and line of sight.
//
// Everything here is pure geometry over rectangles and points, so the
// guards, cameras and the player all share the same rules about what
// blocks movement and what blocks a stare.

import { OBSTACLES, ROOM, WALL } from './config.js';

/** The room's solid shapes: its four walls plus every obstacle. */
export function solidRects() {
  const walls = [
    { x: ROOM.x - WALL, y: ROOM.y - WALL, w: ROOM.w + 2 * WALL, h: WALL },
    { x: ROOM.x - WALL, y: ROOM.y + ROOM.h, w: ROOM.w + 2 * WALL, h: WALL },
    { x: ROOM.x - WALL, y: ROOM.y, w: WALL, h: ROOM.h },
    { x: ROOM.x + ROOM.w, y: ROOM.y, w: WALL, h: ROOM.h },
  ];
  return walls.concat(OBSTACLES);
}

/** Whether point (x, y) lies inside rect r (inclusive of its edges). */
export function pointInRect(x, y, r) {
  return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
}

/** Whether a circle at (x, y) with radius r touches rect. */
export function circleHitsRect(x, y, r, rect) {
  const cx = Math.max(rect.x, Math.min(x, rect.x + rect.w));
  const cy = Math.max(rect.y, Math.min(y, rect.y + rect.h));
  const dx = x - cx;
  const dy = y - cy;
  return dx * dx + dy * dy < r * r;
}

/**
 * Push a circle out of every solid it overlaps. Called once per axis of
 * movement, so sliding along a wall feels natural.
 */
export function resolveCircle(x, y, r, solids) {
  let px = x;
  let py = y;
  for (const rect of solids) {
    if (!circleHitsRect(px, py, r, rect)) continue;
    const cx = Math.max(rect.x, Math.min(px, rect.x + rect.w));
    const cy = Math.max(rect.y, Math.min(py, rect.y + rect.h));
    let dx = px - cx;
    let dy = py - cy;
    const d2 = dx * dx + dy * dy;
    if (d2 === 0) {
      // Centre inside the rect: push out along the smallest penetration.
      const left = px - rect.x;
      const right = rect.x + rect.w - px;
      const top = py - rect.y;
      const bottom = rect.y + rect.h - py;
      const m = Math.min(left, right, top, bottom);
      if (m === left) px = rect.x - r;
      else if (m === right) px = rect.x + rect.w + r;
      else if (m === top) py = rect.y - r;
      else py = rect.y + rect.h + r;
      continue;
    }
    const d = Math.sqrt(d2);
    dx /= d;
    dy /= d;
    px = cx + dx * r;
    py = cy + dy * r;
  }
  return { x: px, y: py };
}

/** Whether segments (x1,y1)-(x2,y2) and (x3,y3)-(x4,y4) cross. */
function segmentsCross(x1, y1, x2, y2, x3, y3, x4, y4) {
  const d = (x2 - x1) * (y4 - y3) - (y2 - y1) * (x4 - x3);
  if (d === 0) return false;
  const t = ((x3 - x1) * (y4 - y3) - (y3 - y1) * (x4 - x3)) / d;
  const u = ((x3 - x1) * (y2 - y1) - (y3 - y1) * (x2 - x1)) / d;
  return t > 0 && t < 1 && u > 0 && u < 1;
}

/** Whether segment (x1,y1)-(x2,y2) touches rect r at all. */
export function segmentHitsRect(x1, y1, x2, y2, r) {
  if (pointInRect(x1, y1, r) || pointInRect(x2, y2, r)) return true;
  return (
    segmentsCross(x1, y1, x2, y2, r.x, r.y, r.x + r.w, r.y) ||
    segmentsCross(x1, y1, x2, y2, r.x + r.w, r.y, r.x + r.w, r.y + r.h) ||
    segmentsCross(x1, y1, x2, y2, r.x + r.w, r.y + r.h, r.x, r.y + r.h) ||
    segmentsCross(x1, y1, x2, y2, r.x, r.y + r.h, r.x, r.y)
  );
}

/**
 * Line of sight between two points: true when no solid rect (walls and
 * obstacles) crosses the segment between them.
 */
export function hasLineOfSight(x1, y1, x2, y2, solids) {
  for (const rect of solids) {
    if (segmentHitsRect(x1, y1, x2, y2, rect)) return false;
  }
  return true;
}

/** Smallest absolute difference between two angles, in radians. */
export function angleDifference(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= 2 * Math.PI;
  while (d < -Math.PI) d += 2 * Math.PI;
  return Math.abs(d);
}

/**
 * Whether a watcher at (wx, wy) facing `angle` with a cone of `halfAngle`
 * and `range` can see point (px, py): inside the cone and with a clear
 * line of sight. Smoke clouds are checked by the caller.
 */
export function canSee(wx, wy, angle, halfAngle, range, px, py, solids) {
  const dx = px - wx;
  const dy = py - wy;
  const dist = Math.hypot(dx, dy);
  if (dist > range) return false;
  if (dist < 1) return true;
  if (angleDifference(Math.atan2(dy, dx), angle) > halfAngle) return false;
  return hasLineOfSight(wx, wy, px, py, solids);
}
