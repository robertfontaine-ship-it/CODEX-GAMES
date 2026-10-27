import { describe, expect, it } from 'vitest';
import { activateAbility, createCombat, distance, respawn, restoreRelay, spawnEnemy, startBoss, stepCombat, walkable, type RoleId } from './engine';
const run = (s: ReturnType<typeof createCombat>, seconds: number, input = { x: 0, y: 0 }) => {
  for (let i = 0; i < seconds * 60; i++) stepCombat(s, input, 1 / 60, () => 0);
};
describe('real-time survival simulation', () => {
  it('normalizes diagonal movement and prevents walking through walls', () => {
    const straight = createCombat('tech'), diagonal = createCombat('tech');
    straight.player.x = diagonal.player.x = 800;
    run(straight, .25, { x: 1, y: 0 }); run(diagonal, .25, { x: 1, y: 1 });
    expect(distance(straight.player, { x: 800, y: 500 })).toBeCloseTo(distance(diagonal.player, { x: 800, y: 500 }));
    run(straight, 3, { x: 0, y: -1 });
    expect(walkable(straight.player)).toBe(true); expect(straight.player.y).toBeGreaterThanOrEqual(414);
  });
  it('automatically aims and clears a nearby enemy without spending energy', () => {
    const s = createCombat('tech'); s.player.x = 850; s.spawnIn = 100;
    spawnEnemy(s, { x: 980, y: 500 }); run(s, 2);
    expect(s.kills).toBe(1); expect(s.xp).toBe(5); expect(s.player.energy).toBe(60);
  });
  it('uses contact immunity to prevent frame-by-frame damage', () => {
    const s = createCombat('tech'); s.player.x = 850; s.player.shotIn = 100; s.spawnIn = 100;
    spawnEnemy(s, { x: 850, y: 500 }); run(s, .5);
    expect(s.player.hp).toBe(90);
  });
  it.each<RoleId>(['marketing', 'tech', 'sports', 'entrepreneur', 'fashion', 'operations'])('gives %s an energy cost and enforced cooldown', role => {
    const s = createCombat(role); s.player.x = 850; spawnEnemy(s, { x: 900, y: 500 });
    expect(activateAbility(s)).toBe(true); expect(s.player.energy).toBe(35);
    expect(activateAbility(s)).toBe(false); expect(s.player.energy).toBe(35);
  });
  it('never blocks basic movement or attacks when energy is exhausted', () => {
    const s = createCombat('tech'); s.player.x = 850; s.player.energy = 0; s.spawnIn = 100;
    spawnEnemy(s, { x: 980, y: 500 }); expect(activateAbility(s)).toBe(false);
    run(s, 2, { x: .1, y: 0 }); expect(s.player.x).toBeGreaterThan(850); expect(s.kills).toBe(1);
  });
  it('requires two distinct relays and prevents repeat reward farming', () => {
    const s = createCombat('sports');
    expect(startBoss(s)).toBe(false); restoreRelay(s, 'marketing'); restoreRelay(s, 'marketing');
    expect(s.xp).toBe(20); expect(startBoss(s)).toBe(false);
    restoreRelay(s, 'tech'); expect(startBoss(s)).toBe(true); expect(startBoss(s)).toBe(false);
    expect(s.enemies.filter(e => e.boss)).toHaveLength(1);
  });
  it('telegraphs the boss slam before dealing damage', () => {
    const s = createCombat('tech'); s.player.x = 1600; s.player.shotIn = 100; s.spawnIn = 100;
    spawnEnemy(s, { x: 1680, y: 500 }, true); s.enemies[0].attackIn = 0;
    run(s, .5); expect(s.player.hp).toBe(100); expect(s.enemies[0].windup).toBeGreaterThan(0);
    run(s, .5); expect(s.player.hp).toBe(75);
  });
  it('finishes on boss defeat and freezes the completed simulation', () => {
    const s = createCombat('tech'); spawnEnemy(s, { x: 1700, y: 500 }, true); s.enemies[0].hp = 0;
    stepCombat(s, { x: 0, y: 0 }, 1 / 60); expect(s.status).toBe('won');
    const elapsed = s.elapsed; run(s, 1); expect(s.elapsed).toBe(elapsed);
  });
  it('keeps permanent progress and resets temporary upgrades at checkpoint after defeat', () => {
    const s = createCombat('fashion'); s.player.x = 620; s.player.y = 150; restoreRelay(s, 'marketing');
    s.honor = 15; s.damageBoost = 8; s.speedBoost = 20; s.player.hp = 0; s.bossStarted = true;
    stepCombat(s, { x: 0, y: 0 }, 1 / 60); expect(s.status).toBe('dead'); respawn(s);
    expect(s.status).toBe('playing'); expect(s.player.x).toBe(620); expect(s.player.y).toBe(150);
    expect(s.relays).toEqual(['marketing']); expect(s.honor).toBe(15); expect(s.xp).toBe(20);
    expect(s.damageBoost).toBe(0); expect(s.speedBoost).toBe(0); expect(s.bossStarted).toBe(false);
  });
  it('does not apply invalid time deltas or move after death', () => {
    const s = createCombat('tech'); stepCombat(s, { x: 1, y: 0 }, NaN); expect(s.player.x).toBe(150);
    s.status = 'dead'; run(s, 1, { x: 1, y: 0 }); expect(s.player.x).toBe(150);
  });
});
