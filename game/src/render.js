// render.js — everything the player sees, drawn on one canvas.
//
// The look: a gallery at night. Dark slate floor under warm ceiling pools,
// gold-trimmed walls, a glass vault glowing around the diamond. Danger is
// always readable at a glance: guard cones are amber, camera cones are red,
// loot glows, and the alarm meter sits in the HUD bar at the top. All art
// is drawn in code — no image files.

import { CANVAS_HEIGHT, CANVAS_WIDTH, EXIT_ZONE, HUD_HEIGHT, LIGHT_POOLS, LOOT, OBSTACLES, ROOM } from './config.js';

const GOLD = '#c9a227';
const WALL_FILL = '#232733';
const FLOOR_A = '#171a24';
const FLOOR_B = '#1b1f2c';

/** Draw the floor: tiles, grout lines and warm light pools. */
function drawFloor(ctx, time) {
  ctx.fillStyle = FLOOR_A;
  ctx.fillRect(ROOM.x, ROOM.y, ROOM.w, ROOM.h);
  // Checker tiles.
  const tile = 76;
  for (let ty = ROOM.y; ty < ROOM.y + ROOM.h; ty += tile) {
    for (let tx = ROOM.x; tx < ROOM.x + ROOM.w; tx += tile) {
      const odd = (Math.floor((tx - ROOM.x) / tile) + Math.floor((ty - ROOM.y) / tile)) % 2 === 0;
      if (!odd) continue;
      ctx.fillStyle = FLOOR_B;
      ctx.fillRect(tx, ty, tile, tile);
    }
  }
  // Grout lines.
  ctx.strokeStyle = 'rgba(255,255,255,0.045)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let tx = ROOM.x; tx <= ROOM.x + ROOM.w; tx += tile) {
    ctx.moveTo(tx, ROOM.y);
    ctx.lineTo(tx, ROOM.y + ROOM.h);
  }
  for (let ty = ROOM.y; ty <= ROOM.y + ROOM.h; ty += tile) {
    ctx.moveTo(ROOM.x, ty);
    ctx.lineTo(ROOM.x + ROOM.w, ty);
  }
  ctx.stroke();
  // Warm pools under the ceiling lights, gently breathing.
  for (const pool of LIGHT_POOLS) {
    const pulse = 0.05 + 0.012 * Math.sin(time * 0.7 + pool.x);
    const g = ctx.createRadialGradient(pool.x, pool.y, 10, pool.x, pool.y, pool.r);
    g.addColorStop(0, `rgba(255, 214, 130, ${pulse + 0.05})`);
    g.addColorStop(1, 'rgba(255, 214, 130, 0)');
    ctx.fillStyle = g;
    ctx.fillRect(pool.x - pool.r, pool.y - pool.r, pool.r * 2, pool.r * 2);
  }
}

/** Draw the room's walls with a gold inner trim. */
function drawWalls(ctx) {
  const t = 16;
  ctx.fillStyle = WALL_FILL;
  ctx.fillRect(ROOM.x - t, ROOM.y - t, ROOM.w + 2 * t, t);
  ctx.fillRect(ROOM.x - t, ROOM.y + ROOM.h, ROOM.w + 2 * t, t);
  ctx.fillRect(ROOM.x - t, ROOM.y, t, ROOM.h);
  ctx.fillRect(ROOM.x + ROOM.w, ROOM.y, t, ROOM.h);
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 2;
  ctx.strokeRect(ROOM.x - 1, ROOM.y - 1, ROOM.w + 2, ROOM.h + 2);
  // Skirting shadow inside the walls.
  ctx.strokeStyle = 'rgba(0,0,0,0.45)';
  ctx.lineWidth = 4;
  ctx.strokeRect(ROOM.x + 2, ROOM.y + 2, ROOM.w - 4, ROOM.h - 4);
}

/** One vision cone polygon: amber for guards, red for cameras. */
function drawCone(ctx, polygon, fill, edge) {
  ctx.beginPath();
  ctx.moveTo(polygon[0].x, polygon[0].y);
  for (let i = 1; i < polygon.length; i++) ctx.lineTo(polygon[i].x, polygon[i].y);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = edge;
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

/** Draw one obstacle by kind. */
function drawObstacle(ctx, o, time) {
  if (o.kind === 'vault') {
    // Glass display case: dark base, glowing glass, gold frame.
    const glow = ctx.createRadialGradient(640, 420, 8, 640, 420, 130);
    glow.addColorStop(0, 'rgba(120, 220, 255, 0.22)');
    glow.addColorStop(1, 'rgba(120, 220, 255, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(o.x - 70, o.y - 70, o.w + 140, o.h + 140);
    ctx.fillStyle = '#10131c';
    ctx.fillRect(o.x, o.y, o.w, o.h);
    ctx.fillStyle = 'rgba(150, 225, 255, 0.16)';
    ctx.fillRect(o.x + 4, o.y + 4, o.w - 8, o.h - 8);
    ctx.strokeStyle = GOLD;
    ctx.lineWidth = 2.5;
    ctx.strokeRect(o.x, o.y, o.w, o.h);
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(o.x + 8, o.y + o.h - 8);
    ctx.lineTo(o.x + o.w - 8, o.y + 8);
    ctx.stroke();
    return;
  }
  if (o.kind === 'pedestal') {
    ctx.fillStyle = '#2a2f3f';
    ctx.fillRect(o.x, o.y, o.w, o.h);
    ctx.fillStyle = '#343a4e';
    ctx.fillRect(o.x + 5, o.y + 5, o.w - 10, o.h - 10);
    ctx.strokeStyle = GOLD;
    ctx.lineWidth = 2;
    ctx.strokeRect(o.x, o.y, o.w, o.h);
    return;
  }
  if (o.kind === 'case') {
    ctx.fillStyle = '#222634';
    ctx.fillRect(o.x, o.y, o.w, o.h);
    ctx.fillStyle = 'rgba(180, 200, 255, 0.10)';
    ctx.fillRect(o.x + 3, o.y + 3, o.w - 6, o.h - 6);
    ctx.strokeStyle = '#4a5168';
    ctx.lineWidth = 2;
    ctx.strokeRect(o.x, o.y, o.w, o.h);
    return;
  }
  if (o.kind === 'crates') {
    ctx.fillStyle = '#3a2f22';
    ctx.fillRect(o.x, o.y, o.w, o.h);
    ctx.strokeStyle = '#6b5636';
    ctx.lineWidth = 2;
    ctx.strokeRect(o.x, o.y, o.w, o.h);
    ctx.beginPath();
    ctx.moveTo(o.x, o.y);
    ctx.lineTo(o.x + o.w, o.y + o.h);
    ctx.moveTo(o.x + o.w, o.y);
    ctx.lineTo(o.x, o.y + o.h);
    ctx.stroke();
    return;
  }
  if (o.kind === 'planter') {
    ctx.fillStyle = '#1f3325';
    ctx.fillRect(o.x, o.y, o.w, o.h);
    ctx.fillStyle = '#2c5236';
    ctx.beginPath();
    ctx.arc(o.x + o.w / 2, o.y + o.h / 2, 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#3a7a4a';
    ctx.beginPath();
    ctx.arc(o.x + o.w / 2 - 10, o.y + o.h / 2 - 8, 12, 0, Math.PI * 2);
    ctx.arc(o.x + o.w / 2 + 12, o.y + o.h / 2 + 6, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#556b52';
    ctx.lineWidth = 2;
    ctx.strokeRect(o.x, o.y, o.w, o.h);
    return;
  }
  // pillar
  ctx.fillStyle = '#2c3145';
  ctx.beginPath();
  ctx.arc(o.x + o.w / 2, o.y + o.h / 2, o.w / 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 2;
  ctx.stroke();
}

/** Draw one loot item, with a glow and a small label. */
function drawLoot(ctx, item, time, taken) {
  if (taken) return;
  const bob = Math.sin(time * 2.2 + item.x) * 3;
  const glow = ctx.createRadialGradient(item.x, item.y + bob, 4, item.x, item.y + bob, 46);
  const color = item.kind === 'diamond' ? '120, 220, 255' : '255, 205, 90';
  glow.addColorStop(0, `rgba(${color}, 0.5)`);
  glow.addColorStop(1, `rgba(${color}, 0)`);
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(item.x, item.y + bob, 46, 0, Math.PI * 2);
  ctx.fill();
  if (item.kind === 'diamond') {
    // Faceted gem, slowly turning its sparkle.
    ctx.save();
    ctx.translate(item.x, item.y + bob);
    ctx.rotate(Math.sin(time * 0.8) * 0.15);
    ctx.fillStyle = '#bfefff';
    ctx.beginPath();
    ctx.moveTo(0, -16);
    ctx.lineTo(13, -4);
    ctx.lineTo(8, 13);
    ctx.lineTo(-8, 13);
    ctx.lineTo(-13, -4);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(0, -16);
    ctx.lineTo(13, -4);
    ctx.lineTo(0, 2);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#5fb8dd';
    ctx.beginPath();
    ctx.moveTo(-13, -4);
    ctx.lineTo(0, 2);
    ctx.lineTo(-8, 13);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  } else if (item.kind === 'gold') {
    ctx.fillStyle = '#f2c14e';
    for (let i = -1; i <= 1; i++) {
      ctx.fillRect(item.x + i * 13 - 8, item.y + bob - 6 + Math.abs(i) * 5, 16, 10);
    }
    ctx.strokeStyle = '#a87f1f';
    ctx.lineWidth = 1.5;
    for (let i = -1; i <= 1; i++) {
      ctx.strokeRect(item.x + i * 13 - 8, item.y + bob - 6 + Math.abs(i) * 5, 16, 10);
    }
  } else if (item.kind === 'painting') {
    ctx.fillStyle = '#7a5c2e';
    ctx.fillRect(item.x - 16, item.y - 12 + bob, 32, 24);
    ctx.fillStyle = '#1d2f57';
    ctx.fillRect(item.x - 12, item.y - 8 + bob, 24, 16);
    ctx.fillStyle = '#e8c85a';
    ctx.beginPath();
    ctx.arc(item.x, item.y - 2 + bob, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#2c4a6b';
    ctx.fillRect(item.x - 12, item.y + 2 + bob, 24, 6);
  } else {
    // Jade fox: a small green statue.
    ctx.fillStyle = '#3fae6a';
    ctx.beginPath();
    ctx.arc(item.x, item.y - 4 + bob, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(item.x - 7, item.y - 10 + bob);
    ctx.lineTo(item.x - 3, item.y - 18 + bob);
    ctx.lineTo(item.x + 1, item.y - 10 + bob);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#2c7a4a';
    ctx.fillRect(item.x - 8, item.y + 4 + bob, 16, 7);
  }
  ctx.font = '600 11px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(255, 235, 170, 0.9)';
  ctx.fillText(item.name, item.x, item.y + 34 + bob);
}

/** Draw the thief: a hooded figure in dark cloth with a gold mask line. */
function drawPlayer(ctx, player, time) {
  const { x, y } = player;
  const bob = player.moving ? Math.sin(time * 14) * 1.5 : 0;
  // A soft pool of light under the thief, so they always read against the
  // dark floor — even inside a guard's amber cone.
  const pool = ctx.createRadialGradient(x, y, 4, x, y, 38);
  pool.addColorStop(0, 'rgba(255, 220, 130, 0.16)');
  pool.addColorStop(1, 'rgba(255, 220, 130, 0)');
  ctx.fillStyle = pool;
  ctx.beginPath();
  ctx.arc(x, y, 38, 0, Math.PI * 2);
  ctx.fill();
  ctx.save();
  ctx.translate(x, y + bob);
  // Soft shadow.
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.beginPath();
  ctx.ellipse(0, 12, 14, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  // Hooded cloak, ringed in gold so the thief reads at a glance.
  ctx.fillStyle = '#151a28';
  ctx.beginPath();
  ctx.arc(0, 0, 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 2.5;
  ctx.stroke();
  // Hood point facing the direction of travel.
  ctx.fillStyle = '#1d2334';
  ctx.beginPath();
  ctx.moveTo(Math.cos(player.angle) * 16, Math.sin(player.angle) * 16);
  ctx.lineTo(Math.cos(player.angle + 2.5) * 12, Math.sin(player.angle + 2.5) * 12);
  ctx.lineTo(Math.cos(player.angle - 2.5) * 12, Math.sin(player.angle - 2.5) * 12);
  ctx.closePath();
  ctx.fill();
  // Gold mask line.
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(Math.cos(player.angle - 0.5) * 8, Math.sin(player.angle - 0.5) * 8);
  ctx.lineTo(Math.cos(player.angle + 0.5) * 8, Math.sin(player.angle + 0.5) * 8);
  ctx.stroke();
  ctx.restore();
  if (player.sneaking) {
    ctx.font = '600 11px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(180, 210, 255, 0.85)';
    ctx.fillText('sneaking', x, y - 24);
  }
}

/** Draw one guard: navy uniform, cap, and a ? or ! when suspicious. */
function drawGuard(ctx, guard, time) {
  const { x, y } = guard;
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.beginPath();
  ctx.ellipse(x, y + 13, 15, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = guard.state === 'alert' ? '#5a2020' : '#232c4a';
  ctx.beginPath();
  ctx.arc(x, y, 15, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = guard.state === 'alert' ? '#ff6b5e' : '#7d86b3';
  ctx.lineWidth = 2;
  ctx.stroke();
  // Cap brim in the facing direction.
  ctx.fillStyle = '#141a2e';
  ctx.beginPath();
  ctx.arc(x + Math.cos(guard.angle) * 6, y + Math.sin(guard.angle) * 6, 8, 0, Math.PI * 2);
  ctx.fill();
  // Flashlight dot ahead.
  ctx.fillStyle = 'rgba(255, 240, 180, 0.9)';
  ctx.beginPath();
  ctx.arc(x + Math.cos(guard.angle) * 17, y + Math.sin(guard.angle) * 17, 2.5, 0, Math.PI * 2);
  ctx.fill();
  const mark = guard.state === 'alert' ? '!' : guard.suspicion > 0.25 ? '?' : null;
  if (mark) {
    const pulse = guard.state === 'alert' ? 1 + 0.15 * Math.sin(time * 8) : 1;
    ctx.font = `900 ${Math.round(22 * pulse)}px system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillStyle = guard.state === 'alert' ? '#ff6b5e' : '#ffd23e';
    ctx.fillText(mark, x, y - 24);
  }
  ctx.font = '600 10px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(200, 205, 230, 0.75)';
  ctx.fillText(guard.name, x, y + 30);
}

/** Draw one wall camera: a small housing with a lens and a red blink. */
function drawCamera(ctx, camera, time) {
  const { x, y } = camera;
  ctx.fillStyle = '#2a2f3f';
  ctx.fillRect(x - 9, y - 7, 18, 14);
  ctx.strokeStyle = '#565e78';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(x - 9, y - 7, 18, 14);
  const blink = Math.sin(time * 3) > 0;
  ctx.fillStyle = camera.seeingPlayer || blink ? '#ff3b30' : '#7a2020';
  ctx.beginPath();
  ctx.arc(x + Math.cos(camera.angle) * 10, y + Math.sin(camera.angle) * 10, 3.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.font = '600 10px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(200, 205, 230, 0.7)';
  ctx.fillText(camera.name, x, y + 22);
}

/** Draw the glowing green exit: the skylight vent. */
function drawExit(ctx, time, diamondHeld) {
  const pulse = 0.5 + 0.2 * Math.sin(time * 3);
  const glow = ctx.createRadialGradient(
    EXIT_ZONE.x + EXIT_ZONE.w / 2, EXIT_ZONE.y + EXIT_ZONE.h / 2, 4,
    EXIT_ZONE.x + EXIT_ZONE.w / 2, EXIT_ZONE.y + EXIT_ZONE.h / 2, 70,
  );
  glow.addColorStop(0, `rgba(80, 255, 150, ${diamondHeld ? pulse : 0.18})`);
  glow.addColorStop(1, 'rgba(80, 255, 150, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(EXIT_ZONE.x - 40, EXIT_ZONE.y - 40, EXIT_ZONE.w + 80, EXIT_ZONE.h + 80);
  ctx.fillStyle = diamondHeld ? '#123524' : '#1c2431';
  ctx.fillRect(EXIT_ZONE.x, EXIT_ZONE.y, EXIT_ZONE.w, EXIT_ZONE.h);
  ctx.strokeStyle = diamondHeld ? '#50ff96' : '#4a5568';
  ctx.lineWidth = 2.5;
  ctx.strokeRect(EXIT_ZONE.x, EXIT_ZONE.y, EXIT_ZONE.w, EXIT_ZONE.h);
  ctx.font = '900 15px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = diamondHeld ? '#8dffb9' : '#8a94a8';
  ctx.fillText('EXIT', EXIT_ZONE.x + EXIT_ZONE.w / 2, EXIT_ZONE.y + EXIT_ZONE.h / 2 + 5);
  if (!diamondHeld) {
    ctx.font = '600 10px system-ui, sans-serif';
    ctx.fillStyle = 'rgba(200, 205, 230, 0.7)';
    ctx.textAlign = 'right';
    ctx.fillText('locked — take the diamond first', EXIT_ZONE.x + EXIT_ZONE.w + 6, EXIT_ZONE.y + EXIT_ZONE.h + 16);
  }
}

/** The HUD bar: title, alarm meter, loot, gadgets, timer. */
function drawHud(ctx, game) {
  ctx.fillStyle = '#0d0f16';
  ctx.fillRect(0, 0, CANVAS_WIDTH, HUD_HEIGHT);
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, HUD_HEIGHT);
  ctx.lineTo(CANVAS_WIDTH, HUD_HEIGHT);
  ctx.stroke();
  ctx.textBaseline = 'alphabetic';

  // Title block.
  ctx.textAlign = 'left';
  ctx.fillStyle = '#f2e6c0';
  ctx.font = '900 22px Georgia, serif';
  ctx.fillText('MIDNIGHT LEDGER', 20, 30);
  ctx.fillStyle = 'rgba(200, 205, 230, 0.75)';
  ctx.font = '12px system-ui, sans-serif';
  ctx.fillText('The Meridian Gallery — one room, one diamond, one way out', 20, 52);

  // Alarm meter, centre.
  const meterX = 470;
  const meterW = 340;
  const meterY = 22;
  const frac = game.alarm.fraction();
  const mood = game.alarm.mood();
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.font = '900 12px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('ALARM', meterX, meterY - 6);
  ctx.fillStyle = '#222634';
  ctx.fillRect(meterX, meterY, meterW, 18);
  const grad = ctx.createLinearGradient(meterX, 0, meterX + meterW, 0);
  grad.addColorStop(0, '#3fae6a');
  grad.addColorStop(0.55, '#f2c14e');
  grad.addColorStop(1, '#ff3b30');
  ctx.fillStyle = grad;
  ctx.fillRect(meterX, meterY, Math.max(0, meterW * frac), 18);
  ctx.strokeStyle = 'rgba(255,255,255,0.5)';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(meterX, meterY, meterW, 18);
  ctx.fillStyle = '#ffffff';
  ctx.font = '900 13px system-ui, sans-serif';
  ctx.fillText(`${Math.round(game.alarm.value)}%`, meterX + meterW + 10, meterY + 14);
  ctx.fillStyle = mood === 'hot' ? '#ff6b5e' : mood === 'wary' ? '#f2c14e' : 'rgba(200, 205, 230, 0.75)';
  ctx.font = '600 11px system-ui, sans-serif';
  ctx.fillText(
    mood === 'hot' ? 'SPOTTED — break line of sight!' : mood === 'wary' ? 'They heard something…' : 'Unseen. Stay in the dark.',
    meterX, meterY + 34,
  );

  // Loot, gadgets and timer, right.
  const rightX = CANVAS_WIDTH - 20;
  ctx.textAlign = 'right';
  ctx.fillStyle = '#f2e6c0';
  ctx.font = '900 15px system-ui, sans-serif';
  ctx.fillText(`◆ ${game.player.lootTaken.length}/4   ★ ${game.player.score}`, rightX, 28);
  ctx.fillStyle = 'rgba(200, 205, 230, 0.8)';
  ctx.font = '12px system-ui, sans-serif';
  ctx.fillText(
    `Smoke [Q] ×${game.player.smokeLeft}    Coin [F] ×${game.player.coinsLeft}    ${formatTime(game.elapsed)}`,
    rightX, 52,
  );

  // Objective line under the bar.
  ctx.textAlign = 'left';
  ctx.fillStyle = 'rgba(242, 230, 192, 0.9)';
  ctx.font = '600 12px system-ui, sans-serif';
  ctx.fillText(game.objectiveText(), 20, HUD_HEIGHT - 6);
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

/** A dark veil over the room for the title / end screens. */
function drawVeil(ctx, alpha) {
  ctx.fillStyle = `rgba(5, 7, 12, ${alpha})`;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
}

/** Centered panel helper for the overlay screens. */
function drawPanel(ctx, x, y, w, h) {
  ctx.fillStyle = 'rgba(10, 12, 20, 0.92)';
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, w, h);
}

function drawTitle(ctx, game) {
  drawVeil(ctx, 0.72);
  drawPanel(ctx, 290, 130, 700, 520);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#f2e6c0';
  ctx.font = '900 52px Georgia, serif';
  ctx.fillText('MIDNIGHT LEDGER', 640, 210);
  ctx.fillStyle = GOLD;
  ctx.font = '600 17px system-ui, sans-serif';
  ctx.fillText('A one-room heist at the Meridian Gallery', 640, 244);
  ctx.fillStyle = 'rgba(230, 233, 245, 0.92)';
  ctx.font = '15px system-ui, sans-serif';
  const lines = [
    'Cross the gallery, crack the glass vault and take the Star of Meridian,',
    'then slip out through the skylight vent — before the alarm fills.',
    '',
    'Amber cones are the guards. Red cones are the cameras. Both raise',
    'the alarm while they see you; it falls again when you break away.',
    'Smoke [Q] blinds them. A coin [F or click] sends a guard to look.',
    'Hold Shift to sneak. Extra loot is worth the risk.',
  ];
  lines.forEach((line, i) => ctx.fillText(line, 640, 292 + i * 24));
  ctx.fillStyle = '#f2c14e';
  ctx.font = '900 19px system-ui, sans-serif';
  ctx.fillText('Press ENTER or click to begin', 640, 500);
  ctx.fillStyle = 'rgba(200, 205, 230, 0.75)';
  ctx.font = '12px system-ui, sans-serif';
  ctx.fillText('WASD / arrows to move · Shift to sneak · Q smoke · F / click coin · M mute · R restart', 640, 536);
  ctx.fillText('Best getaway: ' + (game.bestScore > 0 ? `${game.bestScore} points` : 'none yet — make it yours'), 640, 566);
}

function drawEnd(ctx, game) {
  drawVeil(ctx, 0.66);
  drawPanel(ctx, 340, 190, 600, 400);
  ctx.textAlign = 'center';
  if (game.state === 'won') {
    ctx.fillStyle = '#8dffb9';
    ctx.font = '900 44px Georgia, serif';
    ctx.fillText('CLEAN GETAWAY', 640, 268);
    ctx.fillStyle = 'rgba(230, 233, 245, 0.92)';
    ctx.font = '16px system-ui, sans-serif';
    ctx.fillText('The Star of Meridian is yours. The gallery never saw you leave.', 640, 306);
  } else {
    ctx.fillStyle = '#ff6b5e';
    ctx.font = '900 44px Georgia, serif';
    ctx.fillText('BUSTED', 640, 268);
    ctx.fillStyle = 'rgba(230, 233, 245, 0.92)';
    ctx.font = '16px system-ui, sans-serif';
    ctx.fillText(game.bustedReason, 640, 306);
  }
  const p = game.player;
  const timeBonus = Math.max(0, 600 - Math.floor(game.elapsed) * 5);
  const alarmBonus = Math.round((100 - game.alarm.value) * 2);
  ctx.fillStyle = '#f2e6c0';
  ctx.font = '15px system-ui, sans-serif';
  const rows = [
    `Loot pocketed: ${p.lootTaken.length}/4 — ${p.score} points`,
    `Time bonus: ${timeBonus}   ·   Quiet bonus: ${alarmBonus}`,
    `Final score: ${p.score + timeBonus + alarmBonus}`,
  ];
  rows.forEach((row, i) => ctx.fillText(row, 640, 356 + i * 28));
  ctx.fillStyle = '#f2c14e';
  ctx.font = '900 18px system-ui, sans-serif';
  ctx.fillText('Press R or click to play again', 640, 492);
  ctx.fillStyle = 'rgba(200, 205, 230, 0.75)';
  ctx.font = '12px system-ui, sans-serif';
  ctx.fillText('Best getaway: ' + game.bestScore + ' points', 640, 524);
}

/** The full frame: HUD, room, cones, actors, overlays. */
export function render(ctx, game) {
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  ctx.fillStyle = '#0a0c12';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  drawFloor(ctx, game.time);
  drawWalls(ctx);
  drawExit(ctx, game.time, game.player.diamondHeld);
  for (const o of OBSTACLES) drawObstacle(ctx, o, game.time);

  // Vision cones under the actors, so the floor reads as danger first.
  for (const cam of game.cameras) {
    drawCone(
      ctx,
      cam.conePolygon(),
      cam.seeingPlayer ? 'rgba(255, 59, 48, 0.34)' : 'rgba(255, 59, 48, 0.16)',
      cam.seeingPlayer ? 'rgba(255, 90, 80, 0.7)' : 'rgba(255, 90, 80, 0.35)',
    );
  }
  for (const g of game.guards) {
    const alert = g.state === 'alert';
    drawCone(
      ctx,
      g.conePolygon(),
      alert ? 'rgba(255, 120, 40, 0.30)' : 'rgba(255, 210, 62, 0.16)',
      alert ? 'rgba(255, 140, 60, 0.7)' : 'rgba(255, 210, 62, 0.35)',
    );
  }

  for (const item of LOOT) drawLoot(ctx, item, game.time, game.player.hasLoot(item.id));

  // Smoke clouds.
  for (const c of game.smoke) {
    const g = ctx.createRadialGradient(c.x, c.y, 4, c.x, c.y, c.r);
    g.addColorStop(0, 'rgba(200, 200, 210, 0.5)');
    g.addColorStop(1, 'rgba(200, 200, 210, 0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Coin in flight / on the floor.
  if (game.coin) {
    ctx.fillStyle = '#ffd23e';
    ctx.beginPath();
    ctx.arc(game.coin.x, game.coin.y, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#a87f1f';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.font = '600 11px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(255, 230, 150, 0.9)';
    ctx.fillText('clink!', game.coin.x, game.coin.y - 12);
  }

  for (const cam of game.cameras) drawCamera(ctx, cam, game.time);
  for (const g of game.guards) drawGuard(ctx, g, game.time);
  drawPlayer(ctx, game.player, game.time);

  // Red vignette while spotted: the caught moment, made visible.
  if (game.alarm.spotted && game.state === 'playing') {
    const pulse = 0.22 + 0.1 * Math.sin(game.time * 9);
    const vg = ctx.createRadialGradient(640, 430, 260, 640, 430, 720);
    vg.addColorStop(0, 'rgba(255, 40, 30, 0)');
    vg.addColorStop(1, `rgba(255, 40, 30, ${pulse})`);
    ctx.fillStyle = vg;
    ctx.fillRect(0, HUD_HEIGHT, CANVAS_WIDTH, CANVAS_HEIGHT - HUD_HEIGHT);
    ctx.font = '900 26px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ff6b5e';
    ctx.fillText('SPOTTED!', 640, 140);
  }

  drawHud(ctx, game);
  if (game.state === 'title') drawTitle(ctx, game);
  if (game.state === 'won' || game.state === 'busted') drawEnd(ctx, game);
}
