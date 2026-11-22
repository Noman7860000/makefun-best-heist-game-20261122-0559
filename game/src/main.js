// main.js — entry point: wire the canvas, the game, and the loop.
//
// The loop runs on requestAnimationFrame with the frame delta clamped to
// 50 ms, so a hiccup never teleports the thief across the room. With
// `?shot=<name>` in the URL the game jumps straight into a canned scene
// and freezes, which is how the entry's screenshots are taken.

import { CANVAS_HEIGHT, CANVAS_WIDTH } from './config.js';
import { Game } from './game.js';

const canvas = document.getElementById('game');
canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;

const game = new Game(canvas);
game.applyShotFromUrl();
// Exposed for play-testing and debugging in the browser console.
window.__game = game;

window.addEventListener('keydown', (e) => game.onKeyDown(e));
window.addEventListener('keyup', (e) => game.onKeyUp(e.code));
canvas.addEventListener('click', (e) => game.onClick(e.clientX, e.clientY));
// The canvas keeps keyboard focus so arrow keys always reach the game.
canvas.setAttribute('tabindex', '0');
canvas.focus();

let last = performance.now();
function loop(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  game.frame(dt);
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
