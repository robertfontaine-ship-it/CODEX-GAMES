import { useEffect, useRef, useState } from 'react';
import { activateAbility, createCombat, FLOORS, nearbyStation, restoreRelay, respawn, ROLES, startBoss, STATIONS, stepCombat, WORLD, type CombatState, type RoleId, type StationId } from './engine';
import './combat.css';

type Props = { name: string; avatar: string; role: RoleId; onExit: () => void };
type Question = { prompt: string; options: string[]; correct: number; explanation: string };
const QUESTIONS: Record<'marketing' | 'tech' | 'service', Question[]> = {
  marketing: [
    { prompt: 'The relay must warn students without spreading an unverified rumor. Which message should you broadcast?', options: ['Repeat every group-chat warning.', 'Share the confirmed route, the official source, and the next action.', 'Post a dramatic headline to get attention.'], correct: 1, explanation: 'Clear communication gives the audience verified information and a useful next step.' },
    { prompt: 'Two teams need the same supplies. What supports a workable solution?', options: ['Listen to both needs and agree on priorities.', 'Give everything to the loudest team.', 'Avoid the conversation.'], correct: 0, explanation: 'Listening and agreeing on priorities supports teamwork and conflict resolution.' },
  ],
  tech: [
    { prompt: 'An unknown message asks for the school network password to restore the relay. What should you do?', options: ['Reply with the password.', 'Ask the group chat to vote.', 'Verify the request through an approved channel and protect the password.'], correct: 2, explanation: 'Verification and credential protection help keep systems secure.' },
  ],
  service: [
    { prompt: 'A frightened survivor says their supply request was ignored. Your best first response?', options: ['Listen, acknowledge the concern, and clarify what they need.', 'Promise everything before checking stock.', 'Tell them to calm down and wait.'], correct: 0, explanation: 'Acknowledging the concern and identifying the need is the first step toward a useful resolution.' },
    { prompt: 'The supply desk cannot provide the requested item. What comes next?', options: ['End the conversation.', 'Explain the limit and offer a practical alternative.', 'Blame the previous shift.'], correct: 1, explanation: 'Honest information and a practical alternative help maintain trust.' },
  ],
};

function draw(canvas: HTMLCanvasElement, s: CombatState, avatar: string) {
  const width = canvas.clientWidth, height = canvas.clientHeight;
  const dpr = window.devicePixelRatio || 1;
  if (canvas.width !== Math.round(width * dpr) || canvas.height !== Math.round(height * dpr)) { canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr); }
  const c = canvas.getContext('2d'); if (!c) return;
  c.setTransform(dpr, 0, 0, dpr, 0, 0); c.fillStyle = '#0a151b'; c.fillRect(0, 0, width, height);
  const scale = Math.min(width / 850, height / 570);
  const cameraX = Math.max(0, Math.min(WORLD.w - width / scale, s.player.x - width / scale / 2));
  const cameraY = Math.max(0, Math.min(WORLD.h - height / scale, s.player.y - height / scale / 2));
  c.save(); c.scale(scale, scale); c.translate(-cameraX, -cameraY);
  for (const r of FLOORS) {
    c.fillStyle = '#213a40'; c.fillRect(r.x, r.y, r.w, r.h); c.strokeStyle = '#628179'; c.lineWidth = 4; c.strokeRect(r.x, r.y, r.w, r.h);
    c.strokeStyle = '#2d494d'; c.lineWidth = 1;
    for (let x = r.x + 40; x < r.x + r.w; x += 40) { c.beginPath(); c.moveTo(x, r.y); c.lineTo(x, r.y + r.h); c.stroke(); }
  }
  c.font = 'bold 15px system-ui'; c.fillStyle = '#6e9891'; c.fillText('A HOUSE  /  FIRST RESPONSE', 170, 570); c.fillText('B HOUSE →', 1440, 570);
  for (const station of STATIONS) {
    const done = s.relays.includes(station.id) || (station.id === 'staff' && s.rescued);
    c.fillStyle = done ? '#a8d479' : station.id === 'boss' ? '#bd765e' : '#417d83';
    c.fillRect(station.x - 26, station.y - 25, 52, 50); c.strokeStyle = '#b9dbb5'; c.strokeRect(station.x - 26, station.y - 25, 52, 50);
    c.font = 'bold 11px system-ui'; c.textAlign = 'center'; c.fillStyle = '#e3ecda'; c.fillText(station.label, station.x, station.y - 40);
    c.fillText(done ? '✓' : station.id === 'boss' ? '!' : 'E', station.x, station.y + 5);
  }
  for (const e of s.enemies) {
    if (e.windup > 0) { c.beginPath(); c.arc(e.x, e.y, 115, 0, Math.PI * 2); c.fillStyle = '#f3664838'; c.fill(); c.strokeStyle = '#ff8064'; c.stroke(); }
    c.beginPath(); c.arc(e.x, e.y, e.boss ? 27 : 17, 0, Math.PI * 2); c.fillStyle = e.stunned ? '#7dcbd6' : e.boss ? '#cb8269' : '#87aa69'; c.fill();
    c.fillStyle = '#20342a'; c.fillRect(e.x - 8, e.y - 5, 5, 5); c.fillRect(e.x + 4, e.y - 5, 5, 5);
    c.fillStyle = '#13221a'; c.fillRect(e.x - 22, e.y - 38, 44, 4); c.fillStyle = '#e7ac7b'; c.fillRect(e.x - 22, e.y - 38, 44 * e.hp / e.maxHp, 4);
  }
  for (const shot of s.projectiles) { c.fillStyle = '#f0e5a0'; c.beginPath(); c.arc(shot.x, shot.y, 4, 0, Math.PI * 2); c.fill(); }
  const p = s.player;
  c.beginPath(); c.arc(p.x, p.y, 23, 0, Math.PI * 2); c.fillStyle = p.invulnerable > 0 ? '#a2dfde' : '#d5eb92'; c.fill();
  c.textAlign = 'center'; c.font = '29px system-ui'; c.fillText(avatar, p.x, p.y + 10);
  if (s.pulse > 0) { c.beginPath(); c.arc(p.x, p.y, 240 * (1 - s.pulse / .5), 0, Math.PI * 2); c.strokeStyle = '#d2ef96'; c.lineWidth = 4; c.stroke(); }
  c.restore();
  // Whole-campus overview remains visible while the main camera follows the player.
  const mx = width - 172, my = 18, factor = .085;
  c.fillStyle = '#071216e8'; c.fillRect(mx - 8, my - 8, 166, 105);
  c.fillStyle = '#4b6b65'; for (const r of FLOORS) c.fillRect(mx + r.x * factor, my + r.y * factor, r.w * factor, r.h * factor);
  c.fillStyle = '#e0f6a3'; c.beginPath(); c.arc(mx + p.x * factor, my + p.y * factor, 3, 0, Math.PI * 2); c.fill();
}

export default function CombatPrototype({ name, avatar, role, onExit }: Props) {
  const state = useRef(createCombat(role));
  const canvas = useRef<HTMLCanvasElement>(null);
  const keys = useRef(new Set<string>());
  const paused = useRef(false);
  const [view, setView] = useState(() => ({ ...state.current, player: { ...state.current.player } }));
  const [isPaused, setPaused] = useState(false);
  const [station, setStation] = useState<StationId | null>(null);
  const [feedback, setFeedback] = useState('');
  const [upgrade, setUpgrade] = useState(false);
  const stationRef = useRef<StationId | null>(null);
  const sync = () => setView({ ...state.current, player: { ...state.current.player } });
  const pause = (value: boolean) => { paused.current = value; setPaused(value); keys.current.clear(); };
  const interact = () => {
    const s = state.current;
    if (paused.current || s.status !== 'playing') return;
    const near = nearbyStation(s); if (!near) return;
    if (near.id === 'hq') { s.player.hp = 100; s.checkpoint = { x: 150, y: 500 }; s.message = 'Safe room: health restored and checkpoint set.'; sync(); return; }
    if (near.id === 'boss') { if (!startBoss(s)) s.message = s.bossStarted ? 'The Hall Monitor is already in the hall.' : 'Restore both classroom relays before opening the gym gate.'; sync(); return; }
    if (s.relays.includes(near.id) || (near.id === 'staff' && s.rescued)) { s.message = 'This classroom objective is complete.'; sync(); return; }
    if (near.id === 'service' && s.serviceUses >= 2) { s.message = 'Supply desk energy reserves exhausted for this mission.'; sync(); return; }
    stationRef.current = near.id; setStation(near.id); setFeedback(''); pause(true);
  };
  const actions = useRef({ interact, pause, sync }); actions.current = { interact, pause, sync };
  useEffect(() => {
    let frame = 0, previous = 0, accumulator = 0, hudTime = 0;
    const tick = (time: number) => {
      const delta = previous ? Math.min((time - previous) / 1000, .1) : 0; previous = time;
      if (!paused.current && state.current.status === 'playing') {
        accumulator += delta;
        while (accumulator >= 1 / 60) {
          const k = keys.current;
          stepCombat(state.current, { x: Number(k.has('d') || k.has('arrowright')) - Number(k.has('a') || k.has('arrowleft')), y: Number(k.has('s') || k.has('arrowdown')) - Number(k.has('w') || k.has('arrowup')) }, 1 / 60);
          accumulator -= 1 / 60;
        }
        if (state.current.xp >= state.current.upgradeAt && state.current.status === 'playing') { actions.current.pause(true); setUpgrade(true); }
      } else accumulator = 0;
      if (canvas.current) draw(canvas.current, state.current, avatar);
      hudTime += delta; if (hudTime > .1) { actions.current.sync(); hudTime = 0; }
      frame = requestAnimationFrame(tick);
    };
    const down = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if (!['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright',' ','e','p','escape'].includes(key)) return;
      if ((event.target as HTMLElement).closest('input,select,textarea') || ((event.target as HTMLElement).closest('button') && key === ' ')) return;
      event.preventDefault();
      keys.current.add(key);
      if (event.repeat) return;
      if (key === 'e') actions.current.interact();
      if (key === ' ' && !paused.current) { activateAbility(state.current); actions.current.sync(); }
      if ((key === 'p' || key === 'escape') && !stationRef.current) { if (!paused.current) actions.current.pause(true); }
    };
    const up = (event: KeyboardEvent) => keys.current.delete(event.key.toLowerCase());
    const blur = () => { keys.current.clear(); if (!paused.current) actions.current.pause(true); };
    const visibility = () => { if (document.hidden) blur(); };
    window.addEventListener('keydown', down); window.addEventListener('keyup', up); window.addEventListener('blur', blur); document.addEventListener('visibilitychange', visibility);
    frame = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(frame); window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); window.removeEventListener('blur', blur); document.removeEventListener('visibilitychange', visibility); keys.current.clear(); };
  }, [avatar]);
  function answer(index: number) {
    if (feedback || !station || station === 'hq' || station === 'boss') return;
    const s = state.current;
    if (station === 'staff') {
      s.rescued = true;
      if (index === 0) { s.honor += 15; s.xp += 15; s.player.energy = Math.min(100, s.player.energy + 10); setFeedback('You organize a safe escort. +15 honor, +15 XP, +10 energy.'); }
      else { s.honor += 5; s.xp += 5; setFeedback('You report the location so help can follow. +5 honor, +5 XP.'); }
    } else {
      const q = QUESTIONS[station][station === 'service' ? s.serviceUses : 0];
      if (index !== q.correct) { setFeedback(`Relay still offline. ${q.explanation} Review the choices and retry; there is no energy penalty.`); sync(); return; }
      if (station === 'service') { s.serviceUses++; s.player.energy = Math.min(100, s.player.energy + 30); s.xp += 10; }
      else restoreRelay(s, station);
      setFeedback(`${q.explanation} ${station === 'service' ? '+30 energy, +10 XP.' : '+25 energy, +20 XP. Checkpoint saved.'}`);
    }
    sync();
  }
  function closeStation() { stationRef.current = null; setStation(null); setFeedback(''); pause(false); sync(); }
  const q = station && ['marketing', 'tech', 'service'].includes(station) ? QUESTIONS[station as 'marketing' | 'tech' | 'service'][station === 'service' ? Math.min(view.serviceUses, 1) : 0] : null;
  const near = nearbyStation(view);
  return <section className="combat-prototype" aria-label="Corpocalypse 2.0 combat prototype">
    <header className="combat-top"><div><span>DEVELOPMENT PROTOTYPE · CHAPTER 01</span><h2>THE FIRST BELL</h2></div><button onClick={() => pause(true)}>Pause</button><button onClick={onExit}>Leave prototype</button></header>
    <div className="combat-layout"><div className="combat-stage"><canvas ref={canvas} aria-label="Top-down school halls. Move with WASD or arrow keys, E to enter classrooms, Space for class ability." />
      <div className="combat-location">A HOUSE / CONNECTED HALLS</div><div className="combat-hint">{near ? `E · ${near.label}` : Math.floor(view.elapsed / 35) % 2 ? 'HALL-CHANGE SURGE · Keep moving' : 'Explore classrooms · Basic attacks fire automatically'}</div>
      {(isPaused || view.status !== 'playing') && <div className="combat-overlay"><div className="combat-dialog" role="dialog" aria-modal="true" aria-label={station ? 'Classroom encounter' : 'Mission status'}>
        {view.status === 'dead' ? <><h2>Overwhelmed</h2><p>Return to your last classroom checkpoint. Keep XP, honor and relay progress; temporary damage and speed upgrades are lost.</p><button onClick={() => { respawn(state.current); pause(false); sync(); }}>Return to checkpoint</button></> : view.status === 'won' ? <><h2>Signal restored</h2><p>A House has a safe route. {view.kills} zombies cleared · {view.xp} XP · {view.honor} honor.</p><p>First combat slice complete. More school missions are still in development.</p><button onClick={onExit}>Return to campaign</button></> : station ? <>
          <span>CLASSROOM SAFE INTERACTION · HALLWAY TIME PAUSED</span><h2>{STATIONS.find(s => s.id === station)?.label}</h2>
          <p>{station === 'staff' ? 'A staff member has found a stranded survivor. How will you help?' : q?.prompt}</p>
          {!feedback && <div className="combat-choices">{(station === 'staff' ? ['Organize a safe escort before moving on.', 'Report the location and continue restoring the relay.'] : q?.options || []).map((option, i) => <button key={option} onClick={() => answer(i)}>{option}</button>)}</div>}
          {feedback && <p className="combat-feedback" role="status">{feedback}</p>}
          {feedback.includes('Relay still offline') && <button onClick={() => setFeedback('')}>Try again</button>}
          <button onClick={closeStation}>Return to hallway</button>
        </> : upgrade ? <><h2>Field upgrade earned</h2><p>Choose a temporary upgrade. It lasts until you are overwhelmed.</p><div className="combat-choices">{['Stronger textbook toss · +8 damage', 'Lighter backpack · +20 movement speed'].map((label, i) => <button key={label} onClick={() => { if (i === 0) state.current.damageBoost += 8; else state.current.speedBoost += 20; state.current.upgradeAt += 40; setUpgrade(false); pause(false); sync(); }}>{label}</button>)}</div></> : <><h2>Mission paused</h2><p>Move with WASD or arrows. E enters classrooms. Space uses your class ability. Restore both relays, then open the gym gate. The safe room restores health.</p><button onClick={() => pause(false)}>Resume mission</button></>}
      </div></div>}
    </div><aside className="combat-sidebar"><span>SURVIVOR SIGNAL</span><h2>{avatar} {name || 'Rookie'}</h2><p>{ROLES[role].name}</p><label>HEALTH {Math.ceil(view.player.hp)}/100<progress max={100} value={view.player.hp} /></label><label>ENERGY {view.player.energy}/100<progress max={100} value={view.player.energy} /></label><div className="combat-stats"><b>{view.xp}<small>XP</small></b><b>{view.honor}<small>HONOR</small></b><b>{view.kills}<small>CLEARED</small></b></div><article><span>RESTORE THE SIGNAL</span><p>{view.relays.includes('marketing') ? '✓' : '○'} Marketing relay</p><p>{view.relays.includes('tech') ? '✓' : '○'} Technology relay</p><p>{view.status === 'won' ? '✓' : '○'} Hall Monitor boss</p></article><p className="combat-log" aria-live="polite">{view.message}</p><button disabled={isPaused || view.status !== 'playing' || view.player.energy < 25 || view.player.abilityIn > 0} onClick={() => { activateAbility(state.current); sync(); }}>{ROLES[role].ability} {view.player.abilityIn > 0 ? `· ${Math.ceil(view.player.abilityIn)}s` : '· 25 energy'}</button><p className="combat-help">{ROLES[role].description}</p><p className="combat-help">WASD / arrows · Move<br />E · Interact<br />Space · Class ability<br />P / Escape · Pause<br />Temporary upgrades: +{view.damageBoost} damage, +{view.speedBoost} speed</p></aside></div>
    <nav className="combat-touch" aria-label="Touch controls">{[['↑','arrowup'],['←','arrowleft'],['↓','arrowdown'],['→','arrowright']].map(([label, key]) => <button key={key} aria-label={`Move ${key.replace('arrow','')}`} onPointerDown={e => { e.currentTarget.setPointerCapture(e.pointerId); keys.current.add(key); }} onPointerUp={() => keys.current.delete(key)} onPointerCancel={() => keys.current.delete(key)} onLostPointerCapture={() => keys.current.delete(key)}>{label}</button>)}<button onClick={interact}>Interact · E</button></nav>
  </section>;
}
