import {
  FLOORS,
  STATIONS,
  WORLD,
  ROLES,
  objective,
  distance,
  type CombatState,
  type Point,
} from "./engine";
export function camera(canvas: HTMLCanvasElement, s: CombatState) {
  const width = canvas.clientWidth,
    height = canvas.clientHeight,
    scale =
      width < 600
        ? Math.max(width / 650, height / 820)
        : Math.min(width / 940, height / 620);
  return {
    scale,
    x: Math.max(
      0,
      Math.min(WORLD.w - width / scale, s.player.x - width / scale / 2),
    ),
    y: Math.max(
      0,
      Math.min(WORLD.h - height / scale, s.player.y - height / scale / 2),
    ),
    width,
    height,
  };
}
export function screenPoint(
  canvas: HTMLCanvasElement,
  s: CombatState,
  clientX: number,
  clientY: number,
): Point {
  const cam = camera(canvas, s),
    rect = canvas.getBoundingClientRect();
  return {
    x: (clientX - rect.left) / cam.scale + cam.x,
    y: (clientY - rect.top) / cam.scale + cam.y,
  };
}
export function draw(
  canvas: HTMLCanvasElement,
  s: CombatState,
  avatar: string,
  destination: Point | null,
) {
  const cam = camera(canvas, s),
    { width, height, scale } = cam,
    dpr = Math.min(2, window.devicePixelRatio || 1);
  if (
    canvas.width !== Math.round(width * dpr) ||
    canvas.height !== Math.round(height * dpr)
  ) {
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
  }
  const c = canvas.getContext("2d");
  if (!c) return;
  c.setTransform(dpr, 0, 0, dpr, 0, 0);
  c.fillStyle = "#101d22";
  c.fillRect(0, 0, width, height);
  c.save();
  c.scale(scale, scale);
  c.translate(-cam.x, -cam.y);
  // Blueprint backdrop, classrooms and school furniture are drawn assets, no remote dependencies.
  c.strokeStyle = "#ffffff04";
  c.lineWidth = 1;
  for (let x = 0; x < WORLD.w; x += 40) {
    c.beginPath();
    c.moveTo(x, 0);
    c.lineTo(x, WORLD.h);
    c.stroke();
  }
  for (let y = 0; y < WORLD.h; y += 40) {
    c.beginPath();
    c.moveTo(0, y);
    c.lineTo(WORLD.w, y);
    c.stroke();
  }
  const room = (
    x: number,
    y: number,
    w: number,
    h: number,
    label: string,
    sub: string,
  ) => {
    c.fillStyle = "#192c30";
    c.fillRect(x, y, w, h);
    c.strokeStyle = "#30484a";
    c.lineWidth = 2;
    c.strokeRect(x, y, w, h);
    c.font = "700 15px system-ui";
    c.textAlign = "center";
    c.fillStyle = "#6e9690";
    c.fillText(label, x + w / 2, y + 35);
    c.font = "10px system-ui";
    c.fillStyle = "#52716f";
    c.fillText(sub, x + w / 2, y + 54);
    for (let dx = x + 28; dx < x + w - 25; dx += 55) {
      c.fillStyle = "#263e3f";
      c.fillRect(dx, y + 80, 30, 23);
      c.fillStyle = "#395453";
      c.fillRect(dx, y + 84, 30, 3);
      c.fillStyle = "#30494a";
      c.fillRect(dx + 9, y + 110, 12, 12);
    }
  };
  room(275, 155, 220, 210, "MARKETING", "BROADCAST CONTROL");
  room(745, 155, 375, 210, "WOODSIDE HIGH", "A HOUSE · FIRST FLOOR");
  room(1395, 155, 260, 210, "TECHNOLOGY", "NETWORK CONTROL");
  room(275, 640, 220, 225, "SUPPLY DESK", "CUSTOMER SERVICE");
  room(745, 640, 375, 225, "STUDENT COMMONS", "WOLVERINES");
  room(1395, 640, 260, 225, "STAFF ROOM", "SURVIVOR SUPPORT");
  // One continuous floor fill avoids false wall lines across junctions.
  for (const r of FLOORS) {
    c.fillStyle = "#53615b";
    c.fillRect(r.x - 7, r.y - 7, r.w + 14, r.h + 14);
  }
  for (const r of FLOORS) {
    c.fillStyle = "#303e3e";
    c.fillRect(r.x, r.y, r.w, r.h);
  }
  c.save();
  c.beginPath();
  for (const r of FLOORS) c.rect(r.x, r.y, r.w, r.h);
  c.clip();
  c.strokeStyle = "#74878218";
  c.lineWidth = 1;
  for (let x = 40; x < 1800; x += 40) {
    c.beginPath();
    c.moveTo(x, 100);
    c.lineTo(x, 900);
    c.stroke();
  }
  for (let y = 100; y < 900; y += 40) {
    c.beginPath();
    c.moveTo(40, y);
    c.lineTo(1760, y);
    c.stroke();
  }
  c.setLineDash([18, 22]);
  c.strokeStyle = "#c7b87533";
  c.lineWidth = 2;
  c.beginPath();
  c.moveTo(210, 500);
  c.lineTo(1720, 500);
  c.stroke();
  c.setLineDash([]);
  c.restore();
  // Lockers line the walls and leave every navigable tile unobstructed.
  for (const start of [240, 755, 1400])
    for (let x = start; x < start + 250; x += 25) {
      for (const y of [376, 604]) {
        c.fillStyle = "#314b46";
        c.fillRect(x, y, 22, 20);
        c.strokeStyle = "#668578";
        c.strokeRect(x, y, 22, 20);
        c.fillStyle = "#a7b58c";
        c.fillRect(x + 16, y + 8, 2, 5);
      }
    }
  c.save();
  c.translate(955, 500);
  c.globalAlpha = 0.1;
  c.fillStyle = "#e3c474";
  c.font = "900 95px system-ui";
  c.textAlign = "center";
  c.fillText("W", 0, 34);
  c.restore();
  c.font = "700 11px system-ui";
  c.fillStyle = "#8ba197";
  c.textAlign = "left";
  c.fillText("A HOUSE  /  FIRST RESPONSE", 245, 583);
  const target = objective(s).station;
  for (const station of STATIONS) {
    const done =
      s.relays.includes(station.id) ||
      (station.id === "staff" && s.rescued) ||
      (station.id === "boss" && s.status === "won");
    const active = target.id === station.id,
      color = done ? "#94d8b0" : station.id === "boss" ? "#e5947c" : "#dbc685";
    if (active) {
      c.beginPath();
      c.arc(
        station.x,
        station.y,
        43 + Math.sin(s.elapsed * 3) * 3,
        0,
        Math.PI * 2,
      );
      c.fillStyle = "#e8cd7b0c";
      c.fill();
      c.strokeStyle = "#dcc77a66";
      c.lineWidth = 1;
      c.stroke();
    }
    c.fillStyle = "#0c1c20";
    c.fillRect(station.x - 28, station.y - 28, 56, 56);
    c.strokeStyle = color;
    c.lineWidth = 2;
    c.strokeRect(station.x - 28, station.y - 28, 56, 56);
    c.font = "800 17px system-ui";
    c.textAlign = "center";
    c.fillStyle = color;
    c.fillText(done ? "✓" : station.short, station.x, station.y + 6);
    c.font = "700 12px system-ui";
    c.fillStyle = "#e6e5d4";
    c.fillText(station.label.toUpperCase(), station.x, station.y - 47);
    if (distance(station, s.player) < 80) {
      c.font = "10px system-ui";
      c.fillStyle = "#f5dfa3";
      c.fillText("E / INTERACT", station.x, station.y + 47);
    }
  }
  if (destination) {
    c.beginPath();
    c.arc(destination.x, destination.y, 12, 0, Math.PI * 2);
    c.strokeStyle = "#f6dc8b";
    c.lineWidth = 2;
    c.stroke();
    c.beginPath();
    c.moveTo(destination.x - 18, destination.y);
    c.lineTo(destination.x + 18, destination.y);
    c.moveTo(destination.x, destination.y - 18);
    c.lineTo(destination.x, destination.y + 18);
    c.stroke();
  }
  for (const gem of s.pickups) {
    c.save();
    c.translate(gem.x, gem.y);
    c.rotate(Math.PI / 4);
    c.shadowBlur = 10;
    c.shadowColor = "#80dfad";
    c.fillStyle = "#9bf3c0";
    c.fillRect(-4, -4, 8, 8);
    c.restore();
  }
  for (const e of s.enemies) {
    const radius = e.boss ? 28 : e.kind === "brute" ? 23 : 17;
    if (e.windup > 0) {
      c.beginPath();
      c.arc(e.x, e.y, 115, 0, Math.PI * 2);
      c.fillStyle = "#f56c5833";
      c.fill();
      c.strokeStyle = "#ff8c75";
      c.lineWidth = 3;
      c.stroke();
      c.beginPath();
      c.arc(e.x, e.y, 115 * (1 - e.windup), 0, Math.PI * 2);
      c.stroke();
    }
    c.fillStyle = "#0005";
    c.beginPath();
    c.ellipse(e.x, e.y + radius - 2, radius, 8, 0, 0, Math.PI * 2);
    c.fill();
    c.save();
    c.translate(e.x, e.y);
    c.rotate(Math.atan2(s.player.y - e.y, s.player.x - e.x));
    c.fillStyle = e.flash
      ? "#f9e6bb"
      : e.stunned
        ? "#79ced3"
        : e.boss
          ? "#c16d57"
          : e.kind === "runner"
            ? "#c2b675"
            : e.kind === "brute"
              ? "#788a73"
              : "#7ea386";
    c.beginPath();
    c.roundRect(-radius, -radius * 0.8, radius * 1.7, radius * 1.6, 6);
    c.fill();
    c.strokeStyle = "#142a29";
    c.lineWidth = 2;
    c.stroke();
    c.fillStyle = "#b6c393";
    c.fillRect(radius * 0.15, -radius - 4, 15, 8);
    c.fillRect(radius * 0.15, radius - 4, 15, 8);
    c.fillStyle = "#d4d6ac";
    c.beginPath();
    c.arc(radius * 0.4, 0, radius * 0.6, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = "#ce614d";
    c.fillRect(radius * 0.6, -7, 4, 4);
    c.fillRect(radius * 0.6, 3, 4, 4);
    c.restore();
    if (e.hp < e.maxHp || e.boss) {
      c.fillStyle = "#091315";
      c.fillRect(e.x - 23, e.y - radius - 12, 46, 4);
      c.fillStyle = e.boss ? "#e59078" : "#bacb8a";
      c.fillRect(
        e.x - 23,
        e.y - radius - 12,
        (46 * Math.max(0, e.hp)) / e.maxHp,
        4,
      );
    }
    if (e.stunned) {
      c.fillStyle = "#a6f0f0";
      c.font = "bold 13px system-ui";
      c.textAlign = "center";
      c.fillText("ϟ", e.x, e.y - radius - 18);
    }
  }
  for (const shot of s.projectiles) {
    c.save();
    c.translate(shot.x, shot.y);
    c.rotate(s.elapsed * 18 + shot.id);
    c.fillStyle = "#f0d488";
    c.fillRect(-6, -4, 12, 8);
    c.fillStyle = "#fff0c3";
    c.fillRect(-3, -4, 2, 8);
    c.restore();
  }
  const p = s.player,
    color = ROLES[p.role].color;
  c.fillStyle = "#0006";
  c.beginPath();
  c.ellipse(p.x, p.y + 19, 22, 8, 0, 0, Math.PI * 2);
  c.fill();
  c.save();
  c.translate(p.x, p.y);
  c.globalAlpha = p.role === "fashion" && p.buff > 0 ? 0.5 : 1;
  c.strokeStyle = p.invulnerable > 0 ? "#a4eced" : color;
  c.lineWidth = 2;
  c.beginPath();
  c.arc(0, 0, 25, 0, Math.PI * 2);
  c.stroke();
  c.fillStyle = "#172d30";
  c.beginPath();
  c.arc(0, 0, 21, 0, Math.PI * 2);
  c.fill();
  c.font = "27px system-ui";
  c.textAlign = "center";
  c.fillText(avatar, 0, 10);
  c.rotate(p.facing);
  c.fillStyle = color;
  c.beginPath();
  c.moveTo(31, 0);
  c.lineTo(25, -4);
  c.lineTo(25, 4);
  c.fill();
  c.restore();
  if (s.pulse > 0) {
    c.beginPath();
    c.arc(p.x, p.y, 240 * (1 - s.pulse / 0.5), 0, Math.PI * 2);
    c.strokeStyle = color;
    c.lineWidth = 3;
    c.globalAlpha = s.pulse * 2;
    c.stroke();
    c.globalAlpha = 1;
  }
  for (const e of s.effects) {
    c.globalAlpha = Math.min(1, e.ttl * 2);
    c.font = "800 14px system-ui";
    c.textAlign = "center";
    c.fillStyle = e.color;
    c.fillText(e.text, e.x, e.y - 25);
    c.globalAlpha = 1;
  }
  // World-space direction marker points to the next junction when the goal is offscreen.
  let waypoint: Point = target;
  if (Math.abs(p.y - 500) > 60 && Math.abs(p.x - target.x) > 150)
    waypoint = { x: p.x < 940 ? 620 : 1270, y: 500 };
  else if (Math.abs(p.y - 500) < 70 && Math.abs(p.x - target.x) > 65)
    waypoint = { x: target.x, y: 500 };
  if (distance(p, target) > 100) {
    const a = Math.atan2(waypoint.y - p.y, waypoint.x - p.x);
    c.save();
    c.translate(p.x + Math.cos(a) * 67, p.y + Math.sin(a) * 67);
    c.rotate(a);
    c.fillStyle = "#e4cf87";
    c.beginPath();
    c.moveTo(9, 0);
    c.lineTo(-5, -6);
    c.lineTo(-2, 0);
    c.lineTo(-5, 6);
    c.fill();
    c.restore();
  }
  c.restore();
  const vignette = c.createRadialGradient(
    width / 2,
    height / 2,
    width * 0.15,
    width / 2,
    height / 2,
    width * 0.7,
  );
  vignette.addColorStop(0, "#0000");
  vignette.addColorStop(1, "#020b1260");
  c.fillStyle = vignette;
  c.fillRect(0, 0, width, height);
  if (s.hitFlash > 0) {
    c.strokeStyle = `rgba(244,108,83,${s.hitFlash * 3})`;
    c.lineWidth = 12;
    c.strokeRect(5, 5, width - 10, height - 10);
  }
  // Compact campus overview includes objectives, threats, and the survivor.
  const mx = width - 176,
    my = 22,
    f = 0.084;
  c.fillStyle = "#0a171ce8";
  c.fillRect(mx - 10, my - 12, 166, 108);
  c.strokeStyle = "#6c827455";
  c.lineWidth = 1;
  c.strokeRect(mx - 10, my - 12, 166, 108);
  for (const r of FLOORS) {
    c.fillStyle = "#46615c";
    c.fillRect(mx + r.x * f, my + r.y * f, r.w * f, r.h * f);
  }
  for (const station of STATIONS) {
    c.fillStyle = s.relays.includes(station.id)
      ? "#8cdaac"
      : station.id === target.id
        ? "#f5d87e"
        : "#a1b1a5";
    c.fillRect(mx + station.x * f - 2, my + station.y * f - 2, 4, 4);
  }
  for (const e of s.enemies) {
    c.fillStyle = e.boss ? "#ffa18c" : "#c57666";
    c.fillRect(mx + e.x * f - 1, my + e.y * f - 1, 2, 2);
  }
  c.fillStyle = "#fff5c5";
  c.beginPath();
  c.arc(mx + p.x * f, my + p.y * f, 3, 0, Math.PI * 2);
  c.fill();
  c.font = "8px system-ui";
  c.textAlign = "left";
  c.fillStyle = "#a9baae";
  c.fillText("A HOUSE / SCHEMATIC", mx, my + 88);
}
