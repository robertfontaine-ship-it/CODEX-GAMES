// Pure fixed-step simulation. Rendering, input, and React are kept outside this module.
export type RoleId = 'marketing' | 'tech' | 'sports' | 'entrepreneur' | 'fashion' | 'operations';
export type Point = { x: number; y: number };
export type Rect = Point & { w: number; h: number };
export const WORLD = { w: 1800, h: 1000 };
export const FLOORS: Rect[] = [
  { x: 40, y: 400, w: 1720, h: 200 },
  { x: 530, y: 100, w: 180, h: 800 },
  { x: 1180, y: 100, w: 180, h: 800 },
];
export const STATIONS = [
  { id: 'hq', x: 130, y: 435, label: 'Safe room · checkpoint' },
  { id: 'marketing', x: 610, y: 150, label: 'Marketing · required relay' },
  { id: 'tech', x: 1270, y: 150, label: 'Technology · required relay' },
  { id: 'service', x: 610, y: 850, label: 'Customer service · energy' },
  { id: 'staff', x: 1270, y: 850, label: 'Staff room · survivor choice' },
  { id: 'boss', x: 1650, y: 500, label: 'Gym gate · boss mission' },
] as const;
export type StationId = typeof STATIONS[number]['id'];
export const ROLES: Record<RoleId, { name: string; ability: string; description: string }> = {
  marketing: { name: 'Marketing', ability: 'Hype Train', description: 'Recover 20 health and gain speed for 5 seconds.' },
  tech: { name: 'Tech', ability: 'EMP Burst', description: 'Stun nearby zombies for 4 seconds.' },
  sports: { name: 'Sports Marketing', ability: 'Clutch Play', description: 'Sprint with contact immunity for 3 seconds.' },
  entrepreneur: { name: 'Entrepreneurship', ability: 'Resourceful', description: 'Deploy a gadget that damages nearby zombies.' },
  fashion: { name: 'Fashion', ability: 'Quick Change', description: 'Become undetectable and immune to contact for 4 seconds.' },
  operations: { name: 'Operations', ability: 'Fortify', description: 'Hold nearby zombies in place for 6 seconds and gain protection.' },
};
export type Enemy = Point & { id: number; hp: number; maxHp: number; boss: boolean; stunned: number; attackIn: number; windup: number };
export type Projectile = Point & { id: number; vx: number; vy: number; ttl: number; damage: number };
export type CombatState = {
  player: Point & { hp: number; energy: number; role: RoleId; invulnerable: number; buff: number; shotIn: number; abilityIn: number };
  enemies: Enemy[]; projectiles: Projectile[]; elapsed: number; spawnIn: number; nextId: number;
  xp: number; honor: number; kills: number; damageBoost: number; speedBoost: number; upgradeAt: number;
  relays: string[]; rescued: boolean; serviceUses: number; checkpoint: Point;
  status: 'playing' | 'dead' | 'won'; bossStarted: boolean; pulse: number; message: string;
};
export const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);
export function walkable(p: Point, radius = 14) {
  return FLOORS.some(r => p.x - radius >= r.x && p.x + radius <= r.x + r.w && p.y - radius >= r.y && p.y + radius <= r.y + r.h);
}
export function createCombat(role: RoleId): CombatState {
  return { player: { x: 150, y: 500, hp: 100, energy: 60, role, invulnerable: 0, buff: 0, shotIn: 0, abilityIn: 0 },
    enemies: [], projectiles: [], elapsed: 0, spawnIn: 3, nextId: 1, xp: 0, honor: 0, kills: 0,
    damageBoost: 0, speedBoost: 0, upgradeAt: 40, relays: [], rescued: false, serviceUses: 0,
    checkpoint: { x: 150, y: 500 }, status: 'playing', bossStarted: false, pulse: 0,
    message: 'Restore the Marketing and Technology relays. Explore classrooms between waves.' };
}
function move(body: Point, dx: number, dy: number, radius = 14) {
  if (walkable({ x: body.x + dx, y: body.y }, radius)) body.x += dx;
  if (walkable({ x: body.x, y: body.y + dy }, radius)) body.y += dy;
}
export function spawnEnemy(s: CombatState, position: Point, boss = false) {
  const maxHp = boss ? 500 : 40;
  s.enemies.push({ ...position, id: s.nextId++, hp: maxHp, maxHp, boss, stunned: 0, attackIn: 2, windup: 0 });
}
export function activateAbility(s: CombatState) {
  const p = s.player;
  if (s.status !== 'playing' || p.energy < 25 || p.abilityIn > 0) return false;
  p.energy -= 25; p.abilityIn = 8; s.pulse = .5;
  switch (p.role) {
    case 'marketing': p.hp = Math.min(100, p.hp + 20); p.buff = 5; break;
    case 'tech': s.enemies.filter(e => distance(e, p) < 240).forEach(e => { e.stunned = 4; }); break;
    case 'sports': p.buff = 3; p.invulnerable = 3; break;
    case 'entrepreneur': s.enemies.filter(e => distance(e, p) < 200).forEach(e => { e.hp -= 65; }); break;
    case 'fashion': p.buff = 4; p.invulnerable = 4; break;
    case 'operations': p.invulnerable = 3; s.enemies.filter(e => distance(e, p) < 200).forEach(e => { e.stunned = 6; }); break;
  }
  s.message = `${ROLES[p.role].ability} activated.`;
  return true;
}
export function nearbyStation(s: CombatState) {
  return STATIONS.find(station => distance(station, s.player) < 85);
}
export function restoreRelay(s: CombatState, id: 'marketing' | 'tech') {
  if (s.relays.includes(id)) return;
  s.relays.push(id); s.xp += 20; s.player.energy = Math.min(100, s.player.energy + 25);
  s.checkpoint = { x: s.player.x, y: s.player.y };
  s.message = `${id === 'tech' ? 'Technology' : 'Marketing'} relay restored. Checkpoint saved.`;
}
export function startBoss(s: CombatState) {
  if (s.relays.length < 2 || s.bossStarted || s.status !== 'playing') return false;
  s.bossStarted = true; spawnEnemy(s, { x: 1710, y: 500 }, true);
  s.message = 'Hall Monitor incoming. Red ring warns of a slam. Keep moving!'; return true;
}
export function respawn(s: CombatState) {
  if (s.status !== 'dead') return;
  Object.assign(s.player, s.checkpoint, { hp: 100, energy: 50, invulnerable: 2, buff: 0, shotIn: 0, abilityIn: 0 });
  s.enemies = []; s.projectiles = []; s.damageBoost = 0; s.speedBoost = 0;
  s.bossStarted = false; s.spawnIn = 5; s.status = 'playing'; s.pulse = 0;
  s.message = 'Back at checkpoint. XP, honor and relays kept; temporary upgrades lost.';
}
// Enemies use hall junction waypoints instead of becoming trapped against classroom walls.
function chaseTarget(enemy: Point, player: Point): Point {
  if (Math.abs(enemy.y - 500) < 45 && Math.abs(player.y - 500) < 70) return player;
  const enemyColumn = Math.abs(enemy.x - 620) < Math.abs(enemy.x - 1270) ? 620 : 1270;
  const playerColumn = Math.abs(player.x - 620) < Math.abs(player.x - 1270) ? 620 : 1270;
  if (Math.abs(enemy.y - 500) >= 45 && (enemyColumn !== playerColumn || Math.abs(player.y - 500) < 70)) return { x: enemyColumn, y: 500 };
  if (Math.abs(enemy.x - playerColumn) > 25 && Math.abs(player.y - 500) >= 70) return { x: playerColumn, y: 500 };
  return player;
}
export function stepCombat(s: CombatState, input: Point, dt: number, random = Math.random) {
  if (s.status !== 'playing' || !Number.isFinite(dt) || dt <= 0) return;
  dt = Math.min(dt, .05); s.elapsed += dt; s.pulse = Math.max(0, s.pulse - dt);
  const p = s.player;
  p.invulnerable = Math.max(0, p.invulnerable - dt); p.buff = Math.max(0, p.buff - dt);
  p.abilityIn = Math.max(0, p.abilityIn - dt); p.shotIn -= dt;
  const length = Math.hypot(input.x, input.y);
  const speed = (170 + s.speedBoost) * (p.buff > 0 && ['sports', 'marketing'].includes(p.role) ? 1.6 : 1);
  if (length > 0) move(p, input.x / Math.max(1, length) * speed * dt, input.y / Math.max(1, length) * speed * dt);
  // Safe room does not generate attacks, so classroom visits remain voluntary opportunities to regroup.
  const safe = distance(p, STATIONS[0]) < 95;
  s.spawnIn -= dt;
  if (!safe && s.spawnIn <= 0 && s.enemies.length < 26) {
    const wave = Math.floor(s.elapsed / 35) % 2 === 1;
    s.spawnIn = wave ? .9 : 4;
    const candidates = [{ x: 60, y: 500 }, { x: 1740, y: 500 }, { x: 620, y: 120 }, { x: 1270, y: 880 }].filter(pt => distance(pt, p) > 250);
    const pos = candidates[Math.min(candidates.length - 1, Math.floor(random() * candidates.length))];
    if (pos) spawnEnemy(s, pos);
  }
  const nearest = s.enemies.filter(e => e.hp > 0 && distance(e, p) < 330).sort((a, b) => distance(a, p) - distance(b, p))[0];
  if (nearest && p.shotIn <= 0) {
    const d = Math.max(1, distance(nearest, p)); p.shotIn = .45;
    s.projectiles.push({ x: p.x, y: p.y, id: s.nextId++, vx: (nearest.x - p.x) / d * 520, vy: (nearest.y - p.y) / d * 520, ttl: .8, damage: 20 + s.damageBoost });
  }
  for (const shot of s.projectiles) {
    shot.x += shot.vx * dt; shot.y += shot.vy * dt; shot.ttl -= dt;
    if (!walkable(shot, 2)) { shot.ttl = 0; continue; }
    const hit = s.enemies.find(e => e.hp > 0 && distance(e, shot) < (e.boss ? 28 : 18));
    if (hit) { hit.hp -= shot.damage; shot.ttl = 0; }
  }
  s.projectiles = s.projectiles.filter(shot => shot.ttl > 0);
  for (const e of s.enemies) {
    if (e.hp <= 0) continue;
    e.stunned = Math.max(0, e.stunned - dt);
    if (e.stunned > 0 || safe || (p.role === 'fashion' && p.buff > 0)) continue;
    e.attackIn -= dt;
    if (e.boss && e.windup > 0) {
      e.windup -= dt;
      if (e.windup <= 0 && distance(e, p) < 115 && p.invulnerable <= 0) { p.hp -= 25; p.invulnerable = 1; }
      continue;
    }
    if (e.boss && e.attackIn <= 0) { e.windup = .9; e.attackIn = 4; continue; }
    const target = chaseTarget(e, p), d = Math.max(1, distance(e, target));
    move(e, (target.x - e.x) / d * (e.boss ? 65 : 75) * dt, (target.y - e.y) / d * (e.boss ? 65 : 75) * dt, e.boss ? 26 : 16);
    if (distance(e, p) < (e.boss ? 42 : 30) && p.invulnerable <= 0) { p.hp -= e.boss ? 18 : 10; p.invulnerable = 1; }
  }
  for (const e of s.enemies.filter(e => e.hp <= 0)) {
    s.kills++; s.xp += e.boss ? 100 : 5;
    if (e.boss) { s.status = 'won'; s.message = 'Signal restored. A House has a safe route.'; }
  }
  s.enemies = s.enemies.filter(e => e.hp > 0);
  p.hp = Math.max(0, p.hp);
  if (p.hp <= 0) { s.status = 'dead'; s.message = 'You were overwhelmed. Return to the last classroom checkpoint.'; }
}
