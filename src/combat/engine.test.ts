import { describe, expect, it } from "vitest";
import {
  activateAbility,
  chooseUpgrade,
  clearShot,
  createCombat,
  distance,
  respawn,
  restoreRelay,
  spawnEnemy,
  startBoss,
  stepCombat,
  walkable,
  type RoleId,
} from "./engine";
const run = (
  s: ReturnType<typeof createCombat>,
  seconds: number,
  input = { x: 0, y: 0 },
) => {
  for (let i = 0; i < seconds * 60; i++) stepCombat(s, input, 1 / 60, () => 0);
};
describe("real-time survival simulation", () => {
  it("normalizes diagonal movement and prevents walking through walls", () => {
    const straight = createCombat("tech"),
      diagonal = createCombat("tech");
    straight.player.x = diagonal.player.x = 800;
    run(straight, 0.25, { x: 1, y: 0 });
    run(diagonal, 0.25, { x: 1, y: 1 });
    expect(distance(straight.player, { x: 800, y: 500 })).toBeCloseTo(
      distance(diagonal.player, { x: 800, y: 500 }),
    );
    run(straight, 3, { x: 0, y: -1 });
    expect(walkable(straight.player)).toBe(true);
    expect(straight.player.y).toBeGreaterThanOrEqual(414);
  });
  it("automatically aims and clears a nearby enemy without spending energy", () => {
    const s = createCombat("tech");
    s.player.x = 850;
    s.spawnIn = 100;
    spawnEnemy(s, { x: 980, y: 500 });
    run(s, 2);
    expect(s.kills).toBe(1);
    expect(s.xp).toBe(5);
    expect(s.player.energy).toBe(62);
  });
  it("uses contact immunity to prevent frame-by-frame damage", () => {
    const s = createCombat("tech");
    s.player.x = 850;
    s.player.shotIn = 100;
    s.spawnIn = 100;
    spawnEnemy(s, { x: 850, y: 500 });
    run(s, 0.5);
    expect(s.player.hp).toBe(90);
  });
  it.each<RoleId>([
    "marketing",
    "tech",
    "sports",
    "entrepreneur",
    "fashion",
    "operations",
  ])("gives %s an energy cost and enforced cooldown", (role) => {
    const s = createCombat(role);
    s.player.x = 850;
    spawnEnemy(s, { x: 900, y: 500 });
    expect(activateAbility(s)).toBe(true);
    expect(s.player.energy).toBe(35);
    expect(activateAbility(s)).toBe(false);
    expect(s.player.energy).toBe(35);
  });
  it("never blocks basic movement or attacks when energy is exhausted", () => {
    const s = createCombat("tech");
    s.player.x = 850;
    s.player.energy = 0;
    s.spawnIn = 100;
    spawnEnemy(s, { x: 980, y: 500 });
    expect(activateAbility(s)).toBe(false);
    run(s, 2, { x: 0.1, y: 0 });
    expect(s.player.x).toBeGreaterThan(850);
    expect(s.kills).toBe(1);
  });
  it("requires two distinct relays and prevents repeat reward farming", () => {
    const s = createCombat("sports");
    expect(startBoss(s)).toBe(false);
    restoreRelay(s, "marketing");
    restoreRelay(s, "marketing");
    expect(s.xp).toBe(20);
    expect(startBoss(s)).toBe(false);
    restoreRelay(s, "tech");
    expect(startBoss(s)).toBe(false);
    run(s, 23);
    expect(s.surgeDone).toBe(true);
    expect(startBoss(s)).toBe(true);
    expect(startBoss(s)).toBe(false);
    expect(s.enemies.filter((e) => e.boss)).toHaveLength(1);
  });
  it("telegraphs the boss slam before dealing damage", () => {
    const s = createCombat("tech");
    s.player.x = 1600;
    s.player.shotIn = 100;
    s.spawnIn = 100;
    spawnEnemy(s, { x: 1680, y: 500 }, true);
    s.enemies[0].attackIn = 0;
    run(s, 0.5);
    expect(s.player.hp).toBe(100);
    expect(s.enemies[0].windup).toBeGreaterThan(0);
    run(s, 0.6);
    expect(s.player.hp).toBe(75);
  });
  it("finishes on boss defeat and freezes the completed simulation", () => {
    const s = createCombat("tech");
    spawnEnemy(s, { x: 1700, y: 500 }, true);
    s.enemies[0].hp = 0;
    stepCombat(s, { x: 0, y: 0 }, 1 / 60);
    expect(s.status).toBe("won");
    const elapsed = s.elapsed;
    run(s, 1);
    expect(s.elapsed).toBe(elapsed);
  });
  it("keeps permanent progress and resets temporary upgrades at checkpoint after defeat", () => {
    const s = createCombat("fashion");
    s.player.x = 620;
    s.player.y = 150;
    restoreRelay(s, "marketing");
    s.honor = 15;
    s.damageBoost = 8;
    s.speedBoost = 20;
    s.player.hp = 0;
    s.bossStarted = true;
    stepCombat(s, { x: 0, y: 0 }, 1 / 60);
    expect(s.status).toBe("dead");
    respawn(s);
    expect(s.status).toBe("playing");
    expect(s.player.x).toBe(620);
    expect(s.player.y).toBe(150);
    expect(s.relays).toEqual(["marketing"]);
    expect(s.honor).toBe(15);
    expect(s.xp).toBe(20);
    expect(s.damageBoost).toBe(0);
    expect(s.speedBoost).toBe(0);
    expect(s.bossStarted).toBe(false);
  });
  it("does not apply invalid time deltas or move after death", () => {
    const s = createCombat("tech");
    stepCombat(s, { x: 1, y: 0 }, NaN);
    expect(s.player.x).toBe(150);
    s.status = "dead";
    run(s, 1, { x: 1, y: 0 });
    expect(s.player.x).toBe(150);
  });
});

describe("Mission 1 release rules", () => {
  it("requires pickup collection for kill XP and restores a small amount of energy", () => {
    const s = createCombat("tech");
    s.player.x = 850;
    s.spawnIn = 999;
    spawnEnemy(s, { x: 1100, y: 500 });
    s.enemies[0].hp = 0;
    stepCombat(s, { x: 0, y: 0 }, 1 / 60);
    expect(s.kills).toBe(1);
    expect(s.xp).toBe(0);
    expect(s.pickups).toHaveLength(1);
    s.player.x = 1095;
    run(s, 0.2);
    expect(s.xp).toBe(5);
    expect(s.player.energy).toBe(62);
    expect(s.pickups).toHaveLength(0);
  });
  it("keeps relay progress and surge completion after boss defeat recovery", () => {
    const s = createCombat("sports");
    restoreRelay(s, "marketing");
    restoreRelay(s, "tech");
    run(s, 23);
    expect(startBoss(s)).toBe(true);
    s.player.hp = 0;
    stepCombat(s, { x: 0, y: 0 }, 1 / 60);
    respawn(s);
    expect(s.surgeDone).toBe(true);
    expect(s.relays).toHaveLength(2);
    expect(s.recoveries).toBe(1);
    expect(startBoss(s)).toBe(true);
  });
  it("only starts one surge and one reward per relay", () => {
    const s = createCombat("tech");
    restoreRelay(s, "marketing");
    restoreRelay(s, "tech");
    run(s, 5);
    const remaining = s.surgeLeft;
    restoreRelay(s, "tech");
    expect(s.surgeLeft).toBe(remaining);
    expect(s.xp).toBe(40);
  });
  it("provides a full warning interval and lets a moving player avoid the boss slam", () => {
    const s = createCombat("fashion");
    s.player.x = 1600;
    s.player.shotIn = 999;
    s.spawnIn = 999;
    spawnEnemy(s, { x: 1680, y: 500 }, true);
    s.enemies[0].attackIn = 0;
    run(s, 1.1, { x: -1, y: 0 });
    expect(s.player.hp).toBe(100);
  });
});

describe("playthrough and combat regressions", () => {
  it("avoids targeting through classroom walls", () => {
    const s = createCombat("tech");
    s.player.x = 800;
    s.player.y = 500;
    s.spawnIn = 999;
    spawnEnemy(s, { x: 620, y: 250 });
    expect(clearShot(s.player, s.enemies[0])).toBe(false);
    stepCombat(s, { x: 0, y: 0 }, 1 / 60);
    expect(s.projectiles).toHaveLength(0);
  });
  it.each<RoleId>([
    "marketing",
    "tech",
    "sports",
    "entrepreneur",
    "fashion",
    "operations",
  ])(
    "lets %s complete the required route and boss without a recovery",
    (role) => {
      const s = createCombat(role);
      const tick = (input: { x: number; y: number }) => {
        if (
          s.player.hp < 75 ||
          s.enemies.filter((e) => distance(e, s.player) < 180).length > 2
        )
          activateAbility(s);
        stepCombat(s, input, 1 / 60, () => 0.6);
        if (s.xp >= s.upgradeAt)
          chooseUpgrade(s, s.fireBoost < 0.16 ? "rapid" : "damage");
      };
      const go = (x: number, y: number) => {
        for (
          let frame = 0;
          distance(s.player, { x, y }) > 5 &&
          frame < 1800 &&
          s.status === "playing";
          frame++
        ) {
          const d = distance(s.player, { x, y });
          tick({ x: (x - s.player.x) / d, y: (y - s.player.y) / d });
        }
        expect(s.status, `route to ${x},${y}`).toBe("playing");
        expect(distance(s.player, { x, y })).toBeLessThan(6);
      };
      go(620, 500);
      go(620, 150);
      restoreRelay(s, "marketing");
      go(620, 500);
      go(1270, 500);
      go(1270, 150);
      restoreRelay(s, "tech");
      go(1270, 500);
      for (let i = 0; i < 23 * 60 && s.status === "playing"; i++)
        tick({ x: 0, y: 0 });
      expect(s.surgeDone).toBe(true);
      go(1650, 500);
      expect(startBoss(s)).toBe(true);
      let target = 1000;
      for (let i = 0; i < 120 * 60 && s.status === "playing"; i++) {
        if (Math.abs(s.player.x - target) < 10)
          target = target === 1000 ? 1710 : 1000;
        tick({
          x: Math.sign(target - s.player.x),
          y: Math.sign(500 - s.player.y) * 0.05,
        });
      }
      expect(s.status, `boss result: ${s.player.hp} hp, ${s.kills} kills`).toBe(
        "won",
      );
    },
  );
});
