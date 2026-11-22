// config.js — tuning constants and the Meridian Gallery floor plan.
//
// The whole heist happens in one room: a night-time gallery hall the thief
// crosses from the service door (bottom left) to the skylight vent (top
// right). Obstacles are solid rectangles: they block movement and sight, so
// they are the cover the player plans routes around.

export const CANVAS_WIDTH = 1280;
export const CANVAS_HEIGHT = 800;
export const HUD_HEIGHT = 76;

// The room's inner floor, inside its walls.
export const ROOM = { x: 36, y: 96, w: 1208, h: 668 };
export const WALL = 16;

// Player tuning.
export const PLAYER_RADIUS = 14;
export const PLAYER_SPEED = 178;
export const PLAYER_SNEAK_SPEED = 88;
export const PLAYER_START = { x: 96, y: 700 };

// The getaway: reach this zone after taking the Star of Meridian.
export const EXIT_ZONE = { x: 1152, y: 104, w: 76, h: 56 };

// Alarm tuning: how fast suspicion rises and falls.
export const ALARM_MAX = 100;
export const ALARM_GUARD_RATE = 46;
export const ALARM_CAMERA_RATE = 62;
export const ALARM_DECAY_RATE = 15;
export const ALARM_SNEAK_FACTOR = 0.5;
export const ALARM_SPOTTED_AT = 55;

// Gadget stock.
export const SMOKE_START = 2;
export const COIN_START = 3;
export const SMOKE_RADIUS = 105;
export const SMOKE_SECONDS = 4;

// Guard tuning.
export const GUARD_RADIUS = 15;
export const GUARD_VIEW_RANGE = 235;
export const GUARD_VIEW_HALF_ANGLE = 0.56; // ~32 degrees each side
export const GUARD_PATROL_SPEED = 56;
export const GUARD_CHASE_SPEED = 98;
export const GUARD_CATCH_DISTANCE = 27;
export const GUARD_INVESTIGATE_SECONDS = 3.2;

// Camera tuning.
export const CAMERA_VIEW_RANGE = 305;
export const CAMERA_VIEW_HALF_ANGLE = 0.44; // ~25 degrees each side
export const CAMERA_SWEEP_SPEED = 0.55;

// Loot values (score points).
export const LOOT_VALUES = { diamond: 500, gold: 150, painting: 200, jade: 120 };

// Cover pieces: solid rectangles that block movement and line of sight.
// The central glass vault holds the diamond; pedestals, cases, crates and
// planters make the two main routes (left aisle, right aisle) plus the
// risky straight run past the vault.
export const OBSTACLES = [
  { x: 588, y: 378, w: 104, h: 84, kind: 'vault' }, // the Star of Meridian
  { x: 280, y: 238, w: 72, h: 72, kind: 'pedestal' }, // jade statue
  { x: 928, y: 238, w: 72, h: 72, kind: 'pedestal' },
  { x: 416, y: 178, w: 184, h: 52, kind: 'case' },
  { x: 696, y: 596, w: 184, h: 52, kind: 'case' },
  { x: 176, y: 516, w: 124, h: 62, kind: 'crates' }, // gold bars
  { x: 980, y: 556, w: 124, h: 62, kind: 'crates' },
  { x: 176, y: 176, w: 62, h: 62, kind: 'planter' },
  { x: 1042, y: 176, w: 62, h: 62, kind: 'planter' },
  { x: 396, y: 470, w: 52, h: 52, kind: 'pillar' },
  { x: 832, y: 470, w: 52, h: 52, kind: 'pillar' },
  { x: 556, y: 214, w: 42, h: 42, kind: 'pillar' },
  { x: 682, y: 560, w: 42, h: 42, kind: 'pillar' },
];

// Loot pickups. The diamond is the job; the rest are optional scores.
export const LOOT = [
  { id: 'diamond', name: 'Star of Meridian', x: 640, y: 420, value: 500, kind: 'diamond' },
  { id: 'gold', name: 'Gold Bars', x: 238, y: 547, value: 150, kind: 'gold' },
  { id: 'painting', name: 'Midnight Canal', x: 964, y: 274, value: 200, kind: 'painting' },
  { id: 'jade', name: 'Jade Fox', x: 316, y: 274, value: 120, kind: 'jade' },
];

// Guard patrols: name, waypoints, speed. Facing follows movement.
export const GUARD_DEFS = [
  {
    name: 'Rook',
    waypoints: [
      { x: 210, y: 330 },
      { x: 1070, y: 330 },
    ],
    speed: 56,
  },
  {
    name: 'Bishop',
    waypoints: [
      { x: 1000, y: 180 },
      { x: 1000, y: 700 },
    ],
    speed: 50,
  },
  {
    name: 'Knight',
    waypoints: [
      { x: 520, y: 300 },
      { x: 760, y: 300 },
      { x: 760, y: 540 },
      { x: 520, y: 540 },
    ],
    speed: 62,
  },
];

// Wall cameras: position on a wall, sweep arc, sweep speed.
export const CAMERA_DEFS = [
  { name: 'Cam A', x: 420, y: 112, baseAngle: Math.PI / 2, sweep: 0.85, speed: 0.55 },
  { name: 'Cam B', x: 1228, y: 430, baseAngle: Math.PI, sweep: 0.9, speed: 0.48 },
];

// Warm ceiling light pools, for the renderer's floor lighting.
export const LIGHT_POOLS = [
  { x: 320, y: 260, r: 190 },
  { x: 640, y: 420, r: 230 },
  { x: 960, y: 260, r: 190 },
  { x: 480, y: 620, r: 190 },
  { x: 900, y: 620, r: 180 },
];
