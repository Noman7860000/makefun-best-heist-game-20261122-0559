// game.js — the heist itself: state machine, loop, input, win and lose.
//
// States: title -> playing -> won | busted, with R (or a click) to play
// again. The loop runs on requestAnimationFrame with a clamped delta so a
// slow frame never teleports the thief. The vault case takes a short hold
// to crack; the diamond is the only loot that gates the exit.

import { ALARM_MAX, CAMERA_DEFS, EXIT_ZONE, GUARD_DEFS, GUARD_VIEW_HALF_ANGLE, GUARD_VIEW_RANGE, LOOT } from './config.js';
import { Alarm } from './alarm.js';
import { createCameras } from './cameras.js';
import { createGuards, nearestGuard } from './guards.js';
import { canSee, pointInRect, solidRects } from './level.js';
import { Player } from './player.js';
import { render } from './render.js';
import { setupShot } from './shots.js';
import {
  ensureAudio,
  playBusted,
  playCoin,
  playDiamond,
  playPickup,
  playSmoke,
  playSpotted,
  playWin,
  toggleMute,
} from './audio.js';

const VAULT_CRACK_SECONDS = 1.1;
// Loot sits at the centre of solid cases, so the thief pockets it by
// reaching over the case from beside it: the closest a player centre can
// ever stand to the diamond is 56px (vault half-depth 42 + radius 14),
// so the pickup radius must clear that or the diamond — and the exit it
// gates — can never be reached.
const LOOT_PICKUP_DISTANCE = 64;

export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.state = 'title'; // title | playing | won | busted
    this.time = 0; // wall-clock seconds since load, for animation
    this.elapsed = 0; // seconds spent in the current run
    this.frozen = false; // screenshot mode: render, never advance
    this.bestScore = 0;
    this.bustedReason = '';
    this.coin = null; // the tossed coin on the floor, if any
    this.coinTimer = 0;
    this.smoke = [];
    this.keys = new Set();
    this.solids = solidRects();
    this.resetRun();
    this.loadBest();
  }

  /** Fresh run: new thief, guards, cameras, alarm, loot. */
  resetRun() {
    this.player = new Player();
    this.guards = createGuards(GUARD_DEFS);
    this.cameras = createCameras(CAMERA_DEFS);
    this.alarm = new Alarm();
    this.elapsed = 0;
    this.coin = null;
    this.coinTimer = 0;
    this.smoke = [];
    this.crackHeld = 0;
  }

  loadBest() {
    try {
      this.bestScore = Number(window.localStorage.getItem('midnight-ledger-best') || 0) || 0;
    } catch {
      this.bestScore = 0;
    }
  }

  saveBest(score) {
    if (score <= this.bestScore) return;
    this.bestScore = score;
    try {
      window.localStorage.setItem('midnight-ledger-best', String(score));
    } catch {
      // Private browsing or no storage: the score just lives for the session.
    }
  }

  /** The current objective, shown under the HUD bar. */
  objectiveText() {
    if (this.state === 'title') return 'One room. One diamond. One way out.';
    if (!this.player.diamondHeld) {
      return this.player.crackProgress > 0
        ? 'Cracking the vault case — hold still…'
        : 'Objective: reach the glass vault and take the Star of Meridian.';
    }
    return 'Diamond secured — reach the green EXIT vent, top right.';
  }

  finalScore() {
    const timeBonus = Math.max(0, 600 - Math.floor(this.elapsed) * 5);
    const alarmBonus = Math.round((ALARM_MAX - this.alarm.value) * 2);
    return this.player.score + timeBonus + alarmBonus;
  }

  startRun() {
    ensureAudio();
    this.resetRun();
    this.state = 'playing';
  }

  winRun() {
    this.state = 'won';
    playWin();
    this.saveBest(this.finalScore());
  }

  bustRun(reason) {
    this.state = 'busted';
    this.bustedReason = reason;
    playBusted();
    this.saveBest(this.finalScore());
  }

  /** One frame: advance the world (unless frozen) and draw it. */
  frame(dt) {
    this.time += dt;
    if (!this.frozen && this.state === 'playing') this.update(dt);
    render(this.ctx, this);
  }

  update(dt) {
    this.elapsed += dt;
    const player = this.player;

    player.update(dt, this.keys, this.solids);

    // Smoke clouds age out.
    for (const c of this.smoke) c.left -= dt;
    this.smoke = this.smoke.filter((c) => c.left > 0);

    // The tossed coin fades after a few seconds.
    if (this.coin) {
      this.coinTimer -= dt;
      if (this.coinTimer <= 0) this.coin = null;
    }

    // Watchers: guards and cameras.
    let seenByGuard = false;
    let seenByCamera = false;
    for (const g of this.guards) {
      const event = g.update(dt, player, this.smoke, this.solids);
      if (event === 'spotted') {
        seenByGuard = true;
        playSpotted();
      } else if (g.state === 'alert') {
        seenByGuard = seenByGuard || this.guardSees(g);
      }
      if (g.caughtPlayer) {
        this.bustRun('A guard caught you in the open. Next time, watch the cones.');
        return;
      }
    }
    for (const cam of this.cameras) {
      if (cam.update(dt, player, this.smoke, this.solids)) seenByCamera = true;
    }
    // A guard that already sees the thief keeps the alarm climbing.
    if (!seenByGuard) {
      seenByGuard = this.guards.some((g) => g.state === 'alert' && this.guardSees(g));
    }

    const alarmEvent = this.alarm.update(dt, seenByGuard, seenByCamera, player.sneaking);
    if (alarmEvent === 'spotted') playSpotted();
    if (alarmEvent === 'maxed') {
      this.bustRun('The alarm hit 100% — the gallery locked down with you inside.');
      return;
    }

    // Loot: walk over it to pocket it. The diamond needs a hold to crack.
    for (const item of LOOT) {
      if (player.hasLoot(item.id)) continue;
      const d = Math.hypot(player.x - item.x, player.y - item.y);
      if (d > LOOT_PICKUP_DISTANCE) continue;
      if (item.kind === 'diamond') {
        player.crackProgress += dt / VAULT_CRACK_SECONDS;
        if (player.crackProgress >= 1) {
          player.takeLoot(item);
          playDiamond();
        }
      } else {
        player.takeLoot(item);
        playPickup();
      }
    }
    if (player.crackProgress > 0 && !player.diamondHeld) {
      const diamond = LOOT.find((l) => l.kind === 'diamond');
      if (Math.hypot(player.x - diamond.x, player.y - diamond.y) > LOOT_PICKUP_DISTANCE) {
        player.crackProgress = 0;
      }
    }

    // The exit only opens once the diamond is pocketed.
    if (player.diamondHeld && pointInRect(player.x, player.y, EXIT_ZONE)) {
      this.winRun();
    }
  }

  /** Whether guard `g` currently has the thief in its cone and sight line. */
  guardSees(g) {
    if (this.smoke.some((c) => Math.hypot(this.player.x - c.x, this.player.y - c.y) < c.r)) return false;
    return canSee(g.x, g.y, g.angle, GUARD_VIEW_HALF_ANGLE, GUARD_VIEW_RANGE, this.player.x, this.player.y, this.solids);
  }

  /** Q: drop a smoke pellet at the thief's feet. */
  useSmoke() {
    if (this.state !== 'playing') return;
    const cloud = this.player.throwSmoke();
    if (cloud) {
      this.smoke.push(cloud);
      playSmoke();
    }
  }

  /** F or click: toss a coin where the mouse points; the nearest guard looks. */
  useCoin(x, y) {
    if (this.state !== 'playing') return;
    const landing = this.player.tossCoin(x, y);
    if (!landing) return;
    this.coin = landing;
    this.coinTimer = 4;
    playCoin();
    const guard = nearestGuard(this.guards, landing.x, landing.y, 380);
    if (guard) {
      guard.state = 'investigate';
      guard.investigatePoint = { x: landing.x, y: landing.y };
      guard.lastSeen = null;
    }
  }

  /** Keyboard input: the full event, so scrolling keys can be stopped. */
  onKeyDown(e) {
    const code = e.code;
    if (code === 'KeyM') {
      toggleMute();
      return;
    }
    if (this.state === 'title' && (code === 'Enter' || code === 'Space')) {
      this.startRun();
      return;
    }
    if ((this.state === 'won' || this.state === 'busted') && (code === 'KeyR' || code === 'Enter' || code === 'Space')) {
      this.startRun();
      return;
    }
    if (code === 'KeyR' && this.state === 'playing') {
      this.startRun();
      return;
    }
    if (code === 'KeyQ') {
      ensureAudio();
      this.useSmoke();
      return;
    }
    if (code === 'KeyF') {
      ensureAudio();
      this.useCoin(this.player.x + Math.cos(this.player.angle) * 150, this.player.y + Math.sin(this.player.angle) * 150);
      return;
    }
    this.keys.add(code);
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(code)) {
      // Keep the page from scrolling while the game is played.
      e.preventDefault();
    }
  }

  onKeyUp(code) {
    this.keys.delete(code);
  }

  /** Mouse click: start on the title screen, coin toss while playing. */
  onClick(clientX, clientY) {
    ensureAudio();
    if (this.state === 'title') {
      this.startRun();
      return;
    }
    if (this.state === 'won' || this.state === 'busted') {
      this.startRun();
      return;
    }
    const rect = this.canvas.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * this.canvas.width;
    const y = ((clientY - rect.top) / rect.height) * this.canvas.height;
    this.useCoin(x, y);
  }

  /** Apply a screenshot scene from the URL (?shot=cover etc.). */
  applyShotFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const shot = params.get('shot');
    if (!shot) return false;
    return setupShot(this, shot);
  }
}
