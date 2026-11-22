// player.js — the thief: movement, gadgets, loot.
//
// The thief walks with WASD or the arrow keys, holds Shift to sneak, and
// carries two tools, each with a cost because each is limited:
//   Q — smoke pellet: a cloud that blocks every watcher's sight for a while.
//   F or click — coin toss: a coin clinks where it lands and the nearest
//   guard goes to look at it.
// Loot is pocketed by walking over it (the diamond needs a short hold:
// stand on the vault a moment to crack the case).

import { COIN_START, PLAYER_RADIUS, PLAYER_SNEAK_SPEED, PLAYER_SPEED, PLAYER_START, SMOKE_RADIUS, SMOKE_SECONDS, SMOKE_START } from './config.js';
import { resolveCircle } from './level.js';

export class Player {
  constructor() {
    this.reset();
  }

  reset() {
    this.x = PLAYER_START.x;
    this.y = PLAYER_START.y;
    this.angle = 0; // facing, for the renderer's hood
    this.sneaking = false;
    this.moving = false;
    this.smokeLeft = SMOKE_START;
    this.coinsLeft = COIN_START;
    this.lootTaken = [];
    this.score = 0;
    this.diamondHeld = false;
    this.crackProgress = 0; // 0..1, cracking the vault case
  }

  /**
   * One tick. `keys` is the set of held key codes, `solids` the room's
   * solid rects. Returns 'moved' when the thief actually walked.
   */
  update(dt, keys, solids) {
    let dx = 0;
    let dy = 0;
    if (keys.has('KeyA') || keys.has('ArrowLeft')) dx -= 1;
    if (keys.has('KeyD') || keys.has('ArrowRight')) dx += 1;
    if (keys.has('KeyW') || keys.has('ArrowUp')) dy -= 1;
    if (keys.has('KeyS') || keys.has('ArrowDown')) dy += 1;
    this.sneaking = keys.has('ShiftLeft') || keys.has('ShiftRight');
    this.moving = dx !== 0 || dy !== 0;
    if (!this.moving) return null;
    const len = Math.hypot(dx, dy);
    dx /= len;
    dy /= len;
    this.angle = Math.atan2(dy, dx);
    const speed = this.sneaking ? PLAYER_SNEAK_SPEED : PLAYER_SPEED;
    const afterX = resolveCircle(this.x + dx * speed * dt, this.y, PLAYER_RADIUS, solids);
    const after = resolveCircle(afterX.x, this.y + dy * speed * dt, PLAYER_RADIUS, solids);
    this.x = after.x;
    this.y = after.y;
    return 'moved';
  }

  /** Drop a smoke pellet at the thief's feet. Returns the cloud or null. */
  throwSmoke() {
    if (this.smokeLeft <= 0) return null;
    this.smokeLeft -= 1;
    return { x: this.x, y: this.y, r: SMOKE_RADIUS, left: SMOKE_SECONDS };
  }

  /** Toss a coin to (x, y). Returns the landing point or null. */
  tossCoin(x, y) {
    if (this.coinsLeft <= 0) return null;
    this.coinsLeft -= 1;
    return { x, y };
  }

  /** Pocket a loot item: record it and add its value to the score. */
  takeLoot(item) {
    this.lootTaken.push(item.id);
    this.score += item.value;
    if (item.kind === 'diamond') this.diamondHeld = true;
  }

  hasLoot(id) {
    return this.lootTaken.includes(id);
  }
}
