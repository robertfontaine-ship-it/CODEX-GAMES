# Corpocalypse 2.0: Mission 1 playtest

## Release scope

The First Bell is a playable A House survival slice built on the existing combat branch. The map is a schematic, not an architectural floor plan. Six survivor roles, auto-targeted textbook combat, optional classroom encounters, two required relays, a 22-second hall-change surge, and the Hall Monitor form a complete mission loop.

## Controls

- WASD / arrows: move. Click or tap a visible floor tile to walk there using junction routing.
- E / Interact: use a nearby classroom, safe room, or gym gate.
- Space / ability button: class ability, 25 energy, 8-second cooldown.
- P / Escape: pause; press again to resume a manual pause.
- Touch: direction buttons, Interact, and class ability are available in a fixed bottom bar on small screens.
- Sound is off by default. It can be enabled with the header button.

Collect green XP pickups to earn temporary upgrades. Pick stronger attacks, faster fire, more movement speed, or wider pickup range with health recovery. Required classroom relays award energy, health, XP, and a checkpoint. Optional supply encounters and a staff-room rescue provide additional preparation.

## Survival identity

The Survivor-style influence is continuous movement, automatic combat, pickups, upgrade decisions, and distinct enemy pressure. Woodside identity comes from school hallways, textbook projectiles, six course-themed roles, classroom decisions that provide survival resources, a hall-change surge, and the Hall Monitor boss. Zombie enemies and non-graphic combat are stylized canvas art.

## Recovery and limits

Death retains relay progress, XP, honor, rescue decisions, and completed surge progress. Temporary upgrades, enemies, projectiles, and loose pickups are cleared. A failed boss can be retried at the gym gate. State is held for the current run; reloading the browser begins a new run. There is no account, server score collection, leaderboard, multiplayer, or student data transmission.

## Preservation

Original corporate preview, rules/content, scripts, and deployment workflows remain untouched in CODEX-GAMES. The former Woodside App source is copied to LegacyApp.tsx and available from the new menu. The existing combat branch is retained; release changes are saved on a separate development branch. The pinned corporate campaign link remains available.

## Verification

The original baseline passed 22 tests and built successfully. The revised suite includes pickup collection, wall occlusion, surge gating, checkpoint retention, boss attack avoidance, and deterministic complete required-route/boss playthroughs for all six classes. Tests use real movement, spawned enemies, abilities, and earned upgrades; no invulnerability or boss-health bypass is used. Browser tests additionally exercise the actual interface, modal flow, retry feedback, movement, and mission objectives.

Development-only `?qa` adds a simulation-speed selector and player coordinates to reduce time spent in automated browser checks. These controls are excluded by the production build. Browser acceleration is for functional verification, not a claim about ordinary human pacing or enjoyment.

## Next feedback

Play at normal speed. Assess readability of the next objective, movement responsiveness, whether enemy hits feel fair, usefulness of classroom preparation, and whether another run is appealing. Expand missions after tuning this slice from actual player feedback.
