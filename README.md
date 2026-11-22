# Midnight Ledger — a one-room heist

![best heist game](https://make.fun/badge/best-heist-game-20261122-0559.svg)
[![rank](https://make.fun/badge/best-heist-game-20261122-0559/Noman7860000/makefun-best-heist-game-20261122-0559/rank.svg)](https://make.fun/bounty/best-heist-game-20261122-0559)
[![reward](https://make.fun/badge/best-heist-game-20261122-0559/Noman7860000/makefun-best-heist-game-20261122-0559/reward.svg)](https://make.fun/bounty/best-heist-game-20261122-0559)

[Play the bounty on make.fun](https://make.fun/bounty/best-heist-game-20261122-0559) ·
[My referral link](https://make.fun/r/9y40b2n3)

A complete, original heist game that plays offline in a desktop browser
from its own files — no network requests, no libraries, no build step.

## The job

One room, one diamond, one way out. You are the thief crossing the
Meridian Gallery at night. Three guards walk their patrols with amber
vision cones, two wall cameras sweep red cones across the floor, and the
Star of Meridian sits in a glass vault in the middle of the room. Take it,
then slip out through the skylight vent — before the alarm fills.

## How it plays

- **Move** — WASD or arrow keys. Hold **Shift** to sneak (slower, and the
  alarm climbs half as fast while you are seen).
- **Loot** — walk over loot to pocket it. The diamond needs a short hold
  on the vault to crack the case. Extra loot (gold bars, a painting, a
  jade fox) is worth the risk.
- **Alarm meter** — being seen is not instant failure. The alarm climbs
  while a guard or camera has eyes on you and falls again the moment you
  break line of sight. At 100% the gallery locks down and the run is over.
  A guard that catches you in the open ends the run on the spot.
- **Tools, each with a cost** — **Q** drops a smoke pellet (2 per run)
  that blinds every watcher for a few seconds. **F** or a mouse click
  tosses a coin (3 per run); the nearest guard goes to investigate the
  clink.
- **Routes** — pedestals, display cases, crates, planters and pillars
  block sight as well as movement, so there is a left aisle, a right
  aisle, and a risky straight run past the vault.
- **Win / lose** — grab the diamond, reach the green EXIT vent. Score is
  loot plus time and quiet bonuses. Press **R** to run it again, **M** to
  mute.

## Play it

Serve `game/` with any static server and open `index.html` in desktop
Chrome, for example:

```sh
cd game && python3 -m http.server 8080
```

Then open http://localhost:8080. Sounds are synthesised in code with the
Web Audio API, so there are no audio files to load.

## Layout

- `main.ts` — the hand-in program (Node 22, stdlib only): copies `game/`
  and `screenshots/` to `/output` and writes `/output/dossier.json` with
  `buildDossier` from `vendor/makefun-game.ts`.
- `game/index.html` + `game/style.css` — the page.
- `game/src/config.js` — tuning and the gallery floor plan.
- `game/src/level.js` — collision and line of sight.
- `game/src/guards.js` — guard patrols, spotting, investigation.
- `game/src/cameras.js` — sweeping wall cameras.
- `game/src/alarm.js` — the alarm meter and recovery.
- `game/src/player.js` — the thief, gadgets and loot.
- `game/src/render.js` — all drawing on one canvas.
- `game/src/shots.js` — canned scenes for the screenshots (`?shot=`).
- `game/src/game.js` — state machine, loop, input, win and lose.
- `game/src/main.js` — entry point.
- `screenshots/` — real renders of the game in a browser.
- `vendor/makefun-game.ts` — the kit's dossier library, unchanged.

## Screenshots

- `1-cover.jpg` — mid-heist, slipping down the left aisle with the
  alarm climbing.
- `2-title.jpg` — the title screen.
- `3-alarm.jpg` — spotted in the open, alarm spiking.
- `4-escape.jpg` — diamond taken, slipping out through the vent while a
  guard chases a tossed coin.

## License

MIT — see [LICENSE](LICENSE).
