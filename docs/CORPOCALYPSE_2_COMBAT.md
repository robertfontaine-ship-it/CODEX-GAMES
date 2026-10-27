# Corpocalypse 2.0 — combat development slice

Branch: `feature/corpocalypse-2-combat`, based on `bd3143ba1362483f06fb70774b94d71e7aad9edc`.

## Preservation

The existing Woodside campaign remains available through **Enter A202**. The new mode is an explicit **Test Corpocalypse 2.0 Combat** button after character creation. Avatar, gamer tag, and the six existing role selections carry into the prototype.

The pinned corporate campaign in `preview/index.html`, corporate rules/content, playtest instrumentation, deployment workflows, and original README links are unchanged. Do not run `scripts/make-portable-preview.mjs` for this work: it replaces the preserved preview. Do not merge or deploy this prototype without a separate release decision.

## Implemented

- Top-down connected A House halls, wall collision, camera follow, minimap, normalized WASD/arrow movement, and touch controls.
- Fixed 60 Hz simulation independent of React rendering; capped elapsed-frame catch-up; input cleanup and pause when focus is lost.
- Automatic aimed textbook projectiles, slower exploration spawns alternating with stronger 35-second surge intervals, and bounded enemy count.
- Six role abilities with distinct effects, 25 energy cost, eight-second cooldown, and clear UI. No energy cost for movement or basic attacks.
- Two required classroom relay tasks award energy/XP and set checkpoints. Classroom interactions pause hallway time.
- Optional customer-service energy station (two rewarded encounters per mission) and staff scenario with honor/XP consequences. Failed relay answers allow review/retry without energy loss.
- Relay-gated Hall Monitor boss with visible slam windup, contact damage immunity windows, and mission completion.
- XP-based temporary damage/speed upgrades. On defeat, retain XP, honor, classroom progress and completed scenarios; lose temporary upgrades, enemies and projectiles; return to the last checkpoint. Boss restarts if unfinished.
- Safe room restores health. Prototype state is memory-only and never reads or modifies the corporate campaign's local saves.

## Run and check

```sh
npm ci
npm test
npm run build
npm run dev
```

Choose **Start Mission 1**, customize the survivor, then select **Test Corpocalypse 2.0 Combat**.

Movement: WASD/arrows or touch buttons. E enters nearby classrooms. Space uses the class ability. P/Escape pauses; use Resume to continue. The ability button also supports touch. Restore Marketing at the northwest junction and Technology at the northeast junction; then enter the gym gate at the east end.

## Scope and next work

This is a testable combat foundation, not a completed campaign. The current map is schematic, not a verified floor plan. Classroom characters, question bank, art, enemy variety, balance, sound, equipment, persistent character saves, additional missions and final accessibility/gamepad work remain. Operations currently uses a timed area immobilization/protection effect as a first approximation of its barricade; Marketing buffs the player until survivor ally movement is implemented.

Before expanding the map, playtest attack feel, keyboard/touch navigation, surge intensity and whether classroom rewards make voluntary visits worthwhile. Existing corporate playtest screen detection does not yet track this separate mode.

## Verification for this development increment

- Unchanged baseline: all 7 existing tests passed; TypeScript/Vite build passed.
- Combat increment: all 22 tests passed, including 15 new simulation cases; TypeScript/Vite build passed.
- Preservation check: no diff from the base commit in `preview/`, original game rules/content, playtest code, main entry point, README or deployment workflows.
- Browser QA could not run: no installed Chromium executable, and the browser download returned an invalid ZIP (`End of central directory record signature not found`). Keyboard/touch interface and visual layout require browser playtesting before release.
