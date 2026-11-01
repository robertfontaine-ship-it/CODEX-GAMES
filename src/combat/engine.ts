// Deterministic simulation: UI and drawing stay outside the game rules.
export type RoleId =
  | "marketing"
  | "tech"
  | "sports"
  | "entrepreneur"
  | "fashion"
  | "operations";
export type Point = { x: number; y: number };
export type Rect = Point & { w: number; h: number };
export const WORLD = { w: 1800, h: 1000 };
export const FLOORS: Rect[] = [
  { x: 40, y: 400, w: 1720, h: 200 },
  { x: 530, y: 100, w: 180, h: 800 },
  { x: 1180, y: 100, w: 180, h: 800 },
];
export const STATIONS = [
  {
    id: "hq",
    x: 130,
    y: 435,
    label: "Safe room",
    short: "HQ",
    detail: "Restore health · checkpoint",
  },
  {
    id: "marketing",
    x: 620,
    y: 150,
    label: "Marketing lab",
    short: "01",
    detail: "Required · restore broadcast relay",
  },
  {
    id: "tech",
    x: 1270,
    y: 150,
    label: "Technology lab",
    short: "02",
    detail: "Required · restore network relay",
  },
  {
    id: "service",
    x: 620,
    y: 850,
    label: "Supply desk",
    short: "+",
    detail: "Optional · energy + recovery",
  },
  {
    id: "staff",
    x: 1270,
    y: 850,
    label: "Staff room",
    short: "S",
    detail: "Optional · survivor rescue",
  },
  {
    id: "boss",
    x: 1650,
    y: 500,
    label: "Gym gate",
    short: "03",
    detail: "Final objective · Hall Monitor",
  },
] as const;
export type StationId = (typeof STATIONS)[number]["id"];
export const ROLES: Record<
  RoleId,
  { name: string; ability: string; description: string; color: string }
> = {
  marketing: {
    name: "Marketing",
    ability: "Hype Train",
    description: "Recover 20 health. Move 60% faster for 5 seconds.",
    color: "#f4cc72",
  },
  tech: {
    name: "Tech",
    ability: "EMP Burst",
    description: "Stun every zombie within the signal ring for 4 seconds.",
    color: "#76d8e3",
  },
  sports: {
    name: "Sports Marketing",
    ability: "Clutch Play",
    description: "Sprint with contact immunity for 3 seconds.",
    color: "#ffad79",
  },
  entrepreneur: {
    name: "Entrepreneurship",
    ability: "Resourceful",
    description: "A salvaged gadget deals 65 area damage.",
    color: "#c4a3ff",
  },
  fashion: {
    name: "Fashion",
    ability: "Quick Change",
    description: "Vanish from enemies with damage immunity for 4 seconds.",
    color: "#f49ac1",
  },
  operations: {
    name: "Operations",
    ability: "Fortify",
    description:
      "Immobilize nearby zombies for 6 seconds. Gain 3 seconds of protection.",
    color: "#aadd9b",
  },
};
export type Enemy = Point & {
  id: number;
  hp: number;
  maxHp: number;
  boss: boolean;
  kind: "shambler" | "runner" | "brute" | "boss";
  stunned: number;
  attackIn: number;
  windup: number;
  flash: number;
};
export type Projectile = Point & {
  id: number;
  vx: number;
  vy: number;
  ttl: number;
  damage: number;
};
export type Pickup = Point & { id: number; xp: number };
export type Effect = Point & {
  id: number;
  text: string;
  color: string;
  ttl: number;
};
export type CombatState = {
  player: Point & {
    hp: number;
    energy: number;
    role: RoleId;
    invulnerable: number;
    buff: number;
    shotIn: number;
    abilityIn: number;
    facing: number;
  };
  enemies: Enemy[];
  projectiles: Projectile[];
  pickups: Pickup[];
  effects: Effect[];
  elapsed: number;
  spawnIn: number;
  nextId: number;
  xp: number;
  honor: number;
  kills: number;
  damageBoost: number;
  speedBoost: number;
  fireBoost: number;
  magnetBoost: number;
  upgradeAt: number;
  level: number;
  relays: string[];
  rescued: boolean;
  serviceUses: number;
  checkpoint: Point;
  recoveries: number;
  bossDefeated: boolean;
  status: "playing" | "dead" | "won";
  bossStarted: boolean;
  pulse: number;
  hitFlash: number;
  message: string;
  surgeLeft: number;
  surgeDone: boolean;
  surgeStarted: boolean;
  soundCue: number;
};
export const distance = (a: Point, b: Point) =>
  Math.hypot(a.x - b.x, a.y - b.y);
export function walkable(p: Point, radius = 14) {
  return FLOORS.some(
    (r) =>
      p.x - radius >= r.x &&
      p.x + radius <= r.x + r.w &&
      p.y - radius >= r.y &&
      p.y + radius <= r.y + r.h,
  );
}
export function createCombat(role: RoleId): CombatState {
  return {
    player: {
      x: 150,
      y: 500,
      hp: 100,
      energy: 60,
      role,
      invulnerable: 0,
      buff: 0,
      shotIn: 0,
      abilityIn: 0,
      facing: 0,
    },
    enemies: [],
    projectiles: [],
    pickups: [],
    effects: [],
    elapsed: 0,
    spawnIn: 3,
    nextId: 1,
    xp: 0,
    honor: 0,
    kills: 0,
    damageBoost: 0,
    speedBoost: 0,
    fireBoost: 0,
    magnetBoost: 0,
    level: 1,
    upgradeAt: 35,
    relays: [],
    rescued: false,
    serviceUses: 0,
    recoveries: 0,
    bossDefeated: false,
    checkpoint: { x: 150, y: 500 },
    status: "playing",
    bossStarted: false,
    pulse: 0,
    hitFlash: 0,
    surgeLeft: 0,
    surgeDone: false,
    surgeStarted: false,
    soundCue: 0,
    message:
      "Fontaine: Head east, then north to the Marketing lab. We need a clear evacuation broadcast.",
  };
}
function move(body: Point, dx: number, dy: number, radius = 14) {
  if (walkable({ x: body.x + dx, y: body.y }, radius)) body.x += dx;
  if (walkable({ x: body.x, y: body.y + dy }, radius)) body.y += dy;
}
export function effect(
  s: CombatState,
  p: Point,
  text: string,
  color = "#e6d59d",
) {
  s.effects.push({ ...p, id: s.nextId++, text, color, ttl: 0.8 });
  if (s.effects.length > 45) s.effects.shift();
}
export function spawnEnemy(
  s: CombatState,
  position: Point,
  boss = false,
  kind: Enemy["kind"] = "shambler",
) {
  if (boss) kind = "boss";
  const maxHp = boss
    ? 620
    : kind === "brute"
      ? 105
      : kind === "runner"
        ? 32
        : 40;
  s.enemies.push({
    ...position,
    id: s.nextId++,
    hp: maxHp,
    maxHp,
    boss,
    kind,
    stunned: 0,
    attackIn: 2,
    windup: 0,
    flash: 0,
  });
}
export function activateAbility(s: CombatState) {
  const p = s.player;
  if (s.status !== "playing" || p.energy < 25 || p.abilityIn > 0) return false;
  p.energy -= 25;
  p.abilityIn = 8;
  s.pulse = 0.5;
  s.soundCue++;
  switch (p.role) {
    case "marketing":
      p.hp = Math.min(100, p.hp + 20);
      p.buff = 5;
      break;
    case "tech":
      s.enemies
        .filter((e) => distance(e, p) < 240)
        .forEach((e) => {
          e.stunned = 4;
        });
      break;
    case "sports":
      p.buff = 3;
      p.invulnerable = 3;
      break;
    case "entrepreneur":
      s.enemies
        .filter((e) => distance(e, p) < 200)
        .forEach((e) => {
          e.hp -= 65;
          e.flash = 0.16;
          effect(s, e, "65");
        });
      break;
    case "fashion":
      p.buff = 4;
      p.invulnerable = 4;
      break;
    case "operations":
      p.invulnerable = 3;
      s.enemies
        .filter((e) => distance(e, p) < 200)
        .forEach((e) => {
          e.stunned = 6;
        });
      break;
  }
  s.message = `${ROLES[p.role].ability} activated.`;
  return true;
}
export function nearbyStation(s: CombatState) {
  return STATIONS.find((station) => distance(station, s.player) < 80);
}
export function objective(s: CombatState) {
  if (s.status === "won")
    return {
      station: STATIONS[5],
      title: "A House secured",
      detail: "Signal restored. The evacuation route is open.",
    };
  if (!s.relays.includes("marketing"))
    return {
      station: STATIONS[1],
      title: "Restore the broadcast relay",
      detail: "Head north at the first junction. Enter the Marketing lab.",
    };
  if (!s.relays.includes("tech"))
    return {
      station: STATIONS[2],
      title: "Bring the network online",
      detail: "Cross east, then head north to Technology.",
    };
  if (!s.surgeDone)
    return {
      station: STATIONS[5],
      title: "Survive the hall-change surge",
      detail: `${Math.ceil(s.surgeLeft)} seconds · Keep moving. Classrooms pause the action.`,
    };
  return {
    station: STATIONS[5],
    title: s.bossStarted ? "Defeat the Hall Monitor" : "Open the gym gate",
    detail: s.bossStarted
      ? "Leave the red slam ring before it lands."
      : "Both relays are online. Head to the east end of the hall.",
  };
}
export function restoreRelay(s: CombatState, id: "marketing" | "tech") {
  if (s.relays.includes(id)) return;
  s.relays.push(id);
  s.xp += 20;
  s.player.energy = Math.min(100, s.player.energy + 25);
  s.player.hp = Math.min(100, s.player.hp + 15);
  s.checkpoint = { x: s.player.x, y: s.player.y };
  s.message = `${id === "tech" ? "Network" : "Broadcast"} relay online. +25 energy, +15 health. Checkpoint saved.`;
  if (s.relays.length === 2) {
    s.surgeStarted = true;
    s.surgeLeft = 22;
    s.spawnIn = 1;
    s.message =
      "Both relays online. The bell just rang. Survive the 22-second hall-change surge!";
  }
}
export function startBoss(s: CombatState) {
  if (
    s.relays.length < 2 ||
    !s.surgeDone ||
    s.bossStarted ||
    s.status !== "playing"
  )
    return false;
  s.bossStarted = true;
  spawnEnemy(s, { x: 1710, y: 500 }, true);
  s.spawnIn = 3;
  s.message =
    "HALL MONITOR: No pass? No problem. Stay outside the red slam ring.";
  return true;
}
export function respawn(s: CombatState) {
  if (s.status !== "dead") return;
  Object.assign(s.player, s.checkpoint, {
    hp: 100,
    energy: 50,
    invulnerable: 3,
    buff: 0,
    shotIn: 0,
    abilityIn: 0,
  });
  s.enemies = [];
  s.projectiles = [];
  s.pickups = [];
  s.effects = [];
  s.damageBoost = 0;
  s.speedBoost = 0;
  s.fireBoost = 0;
  s.magnetBoost = 0;
  s.bossStarted = false;
  s.spawnIn = 5;
  s.status = "playing";
  s.pulse = 0;
  s.recoveries++;
  s.message =
    "Checkpoint recovered. Relays, XP and honor kept. Field upgrades lost.";
}
function chaseTarget(enemy: Point, player: Point): Point {
  if (Math.abs(enemy.y - 500) < 45 && Math.abs(player.y - 500) < 70)
    return player;
  const ec = Math.abs(enemy.x - 620) < Math.abs(enemy.x - 1270) ? 620 : 1270;
  const pc = Math.abs(player.x - 620) < Math.abs(player.x - 1270) ? 620 : 1270;
  if (
    Math.abs(enemy.y - 500) >= 45 &&
    (ec !== pc || Math.abs(player.y - 500) < 70)
  )
    return { x: ec, y: 500 };
  if (Math.abs(enemy.x - pc) > 25 && Math.abs(player.y - 500) >= 70)
    return { x: pc, y: 500 };
  return player;
}
// A ray test keeps the automatic weapon from wasting shots on enemies behind walls.
export function clearShot(a: Point, b: Point) {
  const steps = Math.ceil(distance(a, b) / 8);
  for (let i = 0; i <= steps; i++) {
    const t = i / Math.max(1, steps);
    if (!walkable({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t }, 2))
      return false;
  }
  return true;
}
export function chooseUpgrade(
  s: CombatState,
  id: "damage" | "speed" | "rapid" | "magnet",
) {
  if (s.xp < s.upgradeAt || s.status !== "playing") return false;
  if (id === "damage") s.damageBoost += 8;
  if (id === "speed") s.speedBoost += 20;
  if (id === "rapid") s.fireBoost = Math.min(0.24, s.fireBoost + 0.08);
  if (id === "magnet") {
    s.magnetBoost += 80;
    s.player.hp = Math.min(100, s.player.hp + 25);
  }
  s.level++;
  s.upgradeAt += 35;
  return true;
}
export function stepCombat(
  s: CombatState,
  input: Point,
  dt: number,
  random = Math.random,
) {
  if (s.status !== "playing" || !Number.isFinite(dt) || dt <= 0) return;
  dt = Math.min(dt, 0.05);
  s.elapsed += dt;
  s.pulse = Math.max(0, s.pulse - dt);
  s.hitFlash = Math.max(0, s.hitFlash - dt);
  s.effects.forEach((e) => {
    e.ttl -= dt;
    e.y -= dt * 26;
  });
  s.effects = s.effects.filter((e) => e.ttl > 0);
  const p = s.player;
  p.invulnerable = Math.max(0, p.invulnerable - dt);
  p.buff = Math.max(0, p.buff - dt);
  p.abilityIn = Math.max(0, p.abilityIn - dt);
  p.shotIn -= dt;
  const length = Math.hypot(input.x, input.y),
    speed =
      (185 + s.speedBoost) *
      (p.buff > 0 && ["sports", "marketing"].includes(p.role) ? 1.6 : 1);
  if (length > 0) {
    p.facing = Math.atan2(input.y, input.x);
    move(
      p,
      (input.x / Math.max(1, length)) * speed * dt,
      (input.y / Math.max(1, length)) * speed * dt,
    );
  }
  const safe = distance(p, STATIONS[0]) < 95;
  if (s.surgeLeft > 0) {
    s.surgeLeft = Math.max(0, s.surgeLeft - dt);
    if (s.surgeLeft === 0) {
      s.surgeDone = true;
      s.message = "The surge is over. Open the gym gate at the east end.";
    }
  }
  s.spawnIn -= dt;
  if (!safe && s.spawnIn <= 0 && s.enemies.length < 32) {
    const wave =
      s.surgeLeft > 0 ||
      (s.elapsed > 30 && Math.floor(s.elapsed / 40) % 3 === 1);
    s.spawnIn = s.bossStarted ? 2.8 : wave ? 0.85 : 2.6;
    const candidates = [
      { x: 65, y: 500 },
      { x: 1735, y: 500 },
      { x: 620, y: 125 },
      { x: 1270, y: 875 },
      { x: 620, y: 875 },
      { x: 1270, y: 125 },
    ].filter((pt) => distance(pt, p) > 280);
    const pos =
      candidates[
        Math.min(
          candidates.length - 1,
          Math.floor(random() * candidates.length),
        )
      ];
    if (pos) {
      const roll = random();
      spawnEnemy(
        s,
        pos,
        false,
        s.elapsed > 20 && roll > 0.78
          ? "brute"
          : s.elapsed > 12 && roll > 0.5
            ? "runner"
            : "shambler",
      );
    }
  }
  const nearest = s.enemies
    .filter((e) => e.hp > 0 && distance(e, p) < 350 && clearShot(p, e))
    .sort((a, b) => distance(a, p) - distance(b, p))[0];
  if (nearest && p.shotIn <= 0) {
    const d = Math.max(1, distance(nearest, p));
    p.shotIn = 0.42 - s.fireBoost;
    p.facing = Math.atan2(nearest.y - p.y, nearest.x - p.x);
    s.projectiles.push({
      x: p.x,
      y: p.y,
      id: s.nextId++,
      vx: ((nearest.x - p.x) / d) * 600,
      vy: ((nearest.y - p.y) / d) * 600,
      ttl: 0.65,
      damage: 20 + s.damageBoost,
    });
  }
  for (const shot of s.projectiles) {
    shot.x += shot.vx * dt;
    shot.y += shot.vy * dt;
    shot.ttl -= dt;
    if (!walkable(shot, 2)) {
      shot.ttl = 0;
      continue;
    }
    const hit = s.enemies.find(
      (e) =>
        e.hp > 0 &&
        distance(e, shot) < (e.boss ? 29 : e.kind === "brute" ? 23 : 18),
    );
    if (hit) {
      hit.hp -= shot.damage;
      hit.flash = 0.12;
      shot.ttl = 0;
      effect(s, hit, String(shot.damage));
      if (!hit.boss) {
        const d = Math.max(1, distance(hit, p));
        move(
          hit,
          ((hit.x - p.x) / d) * 9,
          ((hit.y - p.y) / d) * 9,
          hit.kind === "brute" ? 22 : 16,
        );
      }
    }
  }
  s.projectiles = s.projectiles.filter((shot) => shot.ttl > 0);
  const hurt = (amount: number) => {
    if (p.invulnerable > 0) return;
    p.hp -= amount;
    p.invulnerable = 1;
    s.hitFlash = 0.22;
    effect(s, p, `−${amount}`, "#ff8a79");
  };
  for (const e of s.enemies) {
    if (e.hp <= 0) continue;
    e.flash = Math.max(0, e.flash - dt);
    e.stunned = Math.max(0, e.stunned - dt);
    if (e.stunned > 0 || safe || (p.role === "fashion" && p.buff > 0)) continue;
    e.attackIn -= dt;
    if (e.boss && e.windup > 0) {
      e.windup -= dt;
      if (e.windup <= 0) {
        effect(s, e, "SLAM", "#ff8979");
        if (distance(e, p) < 115) hurt(25);
      }
      continue;
    }
    if (e.boss && e.attackIn <= 0 && distance(e, p) < 250) {
      e.windup = 1;
      e.attackIn = e.hp < e.maxHp / 2 ? 2.8 : 4;
      continue;
    }
    const target = chaseTarget(e, p),
      d = Math.max(1, distance(e, target));
    const es = e.boss
      ? e.hp < e.maxHp / 2
        ? 102
        : 85
      : e.kind === "runner"
        ? 142
        : e.kind === "brute"
          ? 65
          : 88;
    move(
      e,
      ((target.x - e.x) / d) * es * dt,
      ((target.y - e.y) / d) * es * dt,
      e.boss ? 26 : e.kind === "brute" ? 22 : 16,
    );
    // Gentle separation prevents every enemy collapsing into a single unrecognizable blob.
    for (const other of s.enemies) {
      if (other.id >= e.id || other.hp <= 0) continue;
      const sep = distance(e, other);
      if (sep > 0 && sep < 30)
        move(
          e,
          ((e.x - other.x) / sep) * 18 * dt,
          ((e.y - other.y) / sep) * 18 * dt,
          e.boss ? 26 : 16,
        );
    }
    if (distance(e, p) < (e.boss ? 42 : e.kind === "brute" ? 36 : 30))
      hurt(e.boss ? 18 : e.kind === "brute" ? 16 : 10);
  }
  for (const e of s.enemies.filter((e) => e.hp <= 0)) {
    s.kills++;
    if (e.boss) {
      s.xp += 100;
      s.bossDefeated = true;
      s.status = "won";
      s.message = "Signal restored. A House has a safe evacuation route.";
    } else {
      s.pickups.push({
        x: e.x,
        y: e.y,
        id: s.nextId++,
        xp: e.kind === "brute" ? 12 : 5,
      });
      effect(s, e, "✦", "#8eebb8");
    }
  }
  s.enemies = s.enemies.filter((e) => e.hp > 0);
  if (s.pickups.length > 120) s.pickups.splice(0, s.pickups.length - 120);
  s.pickups = s.pickups.filter((gem) => {
    const d = distance(gem, p);
    if (d < 115 + s.magnetBoost) {
      gem.x += ((p.x - gem.x) / Math.max(1, d)) * 380 * dt;
      gem.y += ((p.y - gem.y) / Math.max(1, d)) * 380 * dt;
    }
    if (distance(gem, p) < 22) {
      s.xp += gem.xp;
      p.energy = Math.min(100, p.energy + 2);
      effect(s, p, `+${gem.xp} XP`, "#8eebb8");
      return false;
    }
    return true;
  });
  p.hp = Math.max(0, p.hp);
  if (p.hp <= 0) {
    s.status = "dead";
    s.message = "Overwhelmed. Your last classroom checkpoint is ready.";
  }
}
