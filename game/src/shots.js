// shots.js — canned scenes for the entry's screenshots.
//
// `?shot=<name>` puts the game into a fixed, deterministic state and
// freezes the simulation, so a screenshot is a real render of the game's
// own code in a real gameplay moment: the title screen, a mid-heist sneak,
// a spotted alarm spike, and the getaway. Nothing here edits pixels — it
// only places the actors and sets the meter, then the renderer draws it.

/** Place a guard at a spot, facing an angle, in a given state. */
function placeGuard(guard, x, y, angle, state = 'patrol') {
  guard.x = x;
  guard.y = y;
  guard.angle = angle;
  guard.state = state;
  guard.suspicion = state === 'alert' ? 1 : 0;
  guard.lastSeen = null;
  guard.investigatePoint = null;
  guard.alertTimer = 3;
}

/** Point a camera at a fixed angle for the shot. */
function aimCamera(camera, angle) {
  camera.angle = angle;
  camera.phase = 0;
  camera.speed = 0; // frozen sweep, so the frame is identical every run
}

/**
 * Set up a named scene on a fresh game and freeze it. Returns true when
 * the name is known.
 */
export function setupShot(game, name) {
  if (name === 'title') {
    game.state = 'title';
    game.frozen = true;
    return true;
  }
  if (name === 'cover') {
    // Mid-heist: the thief slips down the left aisle toward the vault,
    // gold already pocketed, one guard turning toward the thief, alarm
    // climbing but recoverable.
    game.state = 'playing';
    game.player.x = 520;
    game.player.y = 540;
    game.player.angle = -0.6;
    game.player.takeLoot({ id: 'gold', value: 150, kind: 'gold' });
    game.alarm.value = 32;
    game.elapsed = 47;
    placeGuard(game.guards[0], 380, 330, 0, 'patrol');
    placeGuard(game.guards[1], 1000, 520, -Math.PI / 2, 'patrol');
    placeGuard(game.guards[2], 760, 300, Math.PI, 'patrol');
    aimCamera(game.cameras[0], Math.PI / 2 + 0.5);
    aimCamera(game.cameras[1], Math.PI + 0.4);
    game.frozen = true;
    return true;
  }
  if (name === 'alarm') {
    // Caught in the open: the thief is inside Rook's cone by the vault,
    // the alarm is spiking, the SPOTTED banner is up.
    game.state = 'playing';
    game.player.x = 700;
    game.player.y = 300;
    game.player.angle = Math.PI;
    game.player.takeLoot({ id: 'jade', value: 120, kind: 'jade' });
    game.alarm.value = 78;
    game.alarm.spotted = true;
    game.alarm.wasSpotted = true;
    game.elapsed = 83;
    placeGuard(game.guards[0], 560, 300, 0, 'alert');
    game.guards[0].lastSeen = { x: 700, y: 300 };
    placeGuard(game.guards[1], 1000, 620, -Math.PI / 2, 'patrol');
    placeGuard(game.guards[2], 760, 540, -Math.PI / 2, 'investigate');
    game.guards[2].investigatePoint = { x: 700, y: 300 };
    aimCamera(game.cameras[0], Math.PI / 2 - 0.3);
    aimCamera(game.cameras[1], Math.PI - 0.5);
    game.frozen = true;
    return true;
  }
  if (name === 'escape') {
    // The getaway: diamond taken, thief at the skylight vent, alarm
    // cooling, a guard sent chasing a tossed coin across the room.
    game.state = 'playing';
    game.player.x = 1140;
    game.player.y = 150;
    game.player.angle = -Math.PI / 2;
    game.player.takeLoot({ id: 'diamond', value: 500, kind: 'diamond' });
    game.player.takeLoot({ id: 'painting', value: 200, kind: 'painting' });
    game.player.takeLoot({ id: 'gold', value: 150, kind: 'gold' });
    game.player.coinsLeft = 2;
    game.player.smokeLeft = 1;
    game.alarm.value = 18;
    game.elapsed = 132;
    game.coin = { x: 320, y: 640 };
    placeGuard(game.guards[0], 420, 560, Math.PI / 2, 'investigate');
    game.guards[0].investigatePoint = { x: 320, y: 640 };
    placeGuard(game.guards[1], 1000, 300, Math.PI, 'patrol');
    placeGuard(game.guards[2], 520, 540, 0, 'patrol');
    aimCamera(game.cameras[0], Math.PI / 2 + 0.7);
    aimCamera(game.cameras[1], Math.PI + 0.6);
    game.frozen = true;
    return true;
  }
  return false;
}
