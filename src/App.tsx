import { useMemo, useState } from 'react';

type RoleId = 'marketing' | 'tech' | 'sports' | 'entrepreneur' | 'fashion' | 'operations';
type Screen = 'title' | 'create' | 'a202' | 'briefing' | 'decision' | 'runner' | 'hub' | 'results';

type Role = {
  id: RoleId;
  name: string;
  icon: string;
  workplace: string;
  action: string;
  ability: string;
};

const roles: Role[] = [
  { id: 'marketing', name: 'Marketing', icon: '📣', workplace: 'Gain extra trust from strong communication.', action: 'Nearby survivors move faster.', ability: 'Hype Train' },
  { id: 'tech', name: 'Tech', icon: '💻', workplace: 'Complete repairs and device tasks faster.', action: 'Stun hazards and unlock electronic doors.', ability: 'EMP Burst' },
  { id: 'sports', name: 'Sports Marketing', icon: '🏀', workplace: 'Earn bonuses on teamwork challenges.', action: 'Burst sprint with reduced panic.', ability: 'Clutch Play' },
  { id: 'entrepreneur', name: 'Entrepreneurship', icon: '💡', workplace: 'Find extra supplies and opportunity routes.', action: 'Convert junk into a useful item.', ability: 'Resourceful' },
  { id: 'fashion', name: 'Fashion', icon: '👟', workplace: 'Spot visual details and presentation clues.', action: 'Escape one grab and enter stealth.', ability: 'Quick Change' },
  { id: 'operations', name: 'Operations', icon: '🛠️', workplace: 'Gain bonuses on safety and organization.', action: 'Deploy a temporary barricade.', ability: 'Fortify' },
];

const avatars = ['🧑🏾‍🎓', '👩🏽‍🎓', '🧑🏻‍🎓', '👩🏾‍💻', '🧑🏽‍💼', '👩🏻‍🎨'];

function App() {
  const [screen, setScreen] = useState<Screen>('title');
  const [name, setName] = useState('');
  const [period, setPeriod] = useState('1');
  const [avatar, setAvatar] = useState(avatars[0]);
  const [roleId, setRoleId] = useState<RoleId>('marketing');
  const [trust, setTrust] = useState(0);
  const [supplies, setSupplies] = useState(1);
  const [panic, setPanic] = useState(12);
  const [decision, setDecision] = useState<string | null>(null);
  const [runnerScore, setRunnerScore] = useState(0);

  const role = useMemo(() => roles.find((item) => item.id === roleId)!, [roleId]);
  const displayName = name.trim() || 'Rookie';

  function resetGame() {
    setTrust(0);
    setSupplies(1);
    setPanic(12);
    setDecision(null);
    setRunnerScore(0);
    setScreen('create');
  }

  function chooseDecision(choice: 'verify' | 'forward' | 'ignore') {
    setDecision(choice);
    if (choice === 'verify') {
      setTrust((value) => value + 2);
      setSupplies((value) => value + 1);
      setPanic((value) => Math.max(0, value - 4));
    } else if (choice === 'forward') {
      setTrust((value) => value - 1);
      setPanic((value) => value + 12);
    } else {
      setPanic((value) => value + 7);
    }
  }

  function runMove(move: 'jump' | 'slide' | 'dodge') {
    const gain = move === 'dodge' && roleId === 'sports' ? 18 : 12;
    setRunnerScore((value) => Math.min(100, value + gain));
    setPanic((value) => Math.min(100, value + 2));
  }

  return (
    <main className="outbreak-shell">
      <header className="game-hud">
        <div><strong>WOODSIDE OUTBREAK</strong><span>A House • 7:10 AM</span></div>
        {screen !== 'title' && screen !== 'create' && (
          <div className="hud-stats">
            <span>Trust {trust}</span><span>Supplies {supplies}</span><span>Panic {panic}%</span>
          </div>
        )}
      </header>

      {screen === 'title' && (
        <section className="hero-screen">
          <div className="school-mark">W</div>
          <p className="eyebrow">WRS QUEST PRESENTS</p>
          <h1>THE DAY<br />WOODSIDE FELL</h1>
          <p className="hero-copy">Funny. Fast. Stressful. Survive the school day using workplace skills, split-second decisions, and whatever is lying around.</p>
          <button className="primary" onClick={resetGame}>START MISSION 1</button>
          <p className="tiny">A202 → A House Hallway → Central Hub → 8:15 Bell</p>
        </section>
      )}

      {screen === 'create' && (
        <section className="panel wide">
          <p className="eyebrow">A202 • PLAYER SETUP</p>
          <h2>Create Your Survivor</h2>
          <label>Gamer tag<input value={name} onChange={(event) => setName(event.target.value)} maxLength={18} placeholder="Enter a name" /></label>
          <label>Class period<select value={period} onChange={(event) => setPeriod(event.target.value)}>{['1','2','3','4','5','6','7'].map((value) => <option key={value}>{value}</option>)}</select></label>
          <div className="avatar-grid">{avatars.map((item) => <button key={item} className={avatar === item ? 'selected avatar' : 'avatar'} onClick={() => setAvatar(item)}>{item}</button>)}</div>
          <h3>Choose a starting role</h3>
          <div className="role-grid">{roles.map((item) => (
            <button key={item.id} className={roleId === item.id ? 'role-card selected' : 'role-card'} onClick={() => setRoleId(item.id)}>
              <span className="role-icon">{item.icon}</span><strong>{item.name}</strong><small>{item.ability}</small>
            </button>
          ))}</div>
          <div className="role-details"><strong>{role.name}: {role.ability}</strong><span>{role.workplace}</span><span>{role.action}</span></div>
          <button className="primary" onClick={() => setScreen('a202')}>ENTER A202</button>
        </section>
      )}

      {screen === 'a202' && (
        <section className="scene a202-scene">
          <div className="scene-overlay">
            <p className="eyebrow">MISSION 1 • ORIENTATION IS MANDATORY</p>
            <div className="character-chip"><span>{avatar}</span><div><strong>{displayName}</strong><small>Period {period} • {role.name}</small></div></div>
            <h2>7:10 AM — A202</h2>
            <p>The bell rings. Laptops glow. Somebody is already asking whether this counts for a grade.</p>
            <p className="radio">PA SYSTEM: “Students and staff, remain in your current location…”</p>
            <button className="primary" onClick={() => setScreen('briefing')}>CHECK THE CLASSROOM</button>
          </div>
        </section>
      )}

      {screen === 'briefing' && (
        <section className="panel">
          <p className="eyebrow">7:26 AM • FIRST WARNING</p>
          <h2>Three messages hit at once.</h2>
          <div className="message-stack">
            <article><strong>Front Office</strong><p>Keep students in place. Do not use the central stairs.</p></article>
            <article><strong>Unknown Sender</strong><p>Emergency route changed. Send every student to B House immediately.</p></article>
            <article><strong>Teacher Chat</strong><p>Something is moving outside A House.</p></article>
          </div>
          <button className="primary" onClick={() => setScreen('decision')}>MAKE THE CALL</button>
        </section>
      )}

      {screen === 'decision' && (
        <section className="panel">
          <p className="eyebrow">WORKPLACE DECISION • INFORMATION SECURITY</p>
          <h2>What do you do?</h2>
          {!decision ? <div className="choice-list">
            <button onClick={() => chooseDecision('verify')}><strong>Verify through an official channel</strong><span>Confirm the route before moving anyone.</span></button>
            <button onClick={() => chooseDecision('forward')}><strong>Forward the B House message</strong><span>Move fast and warn everybody.</span></button>
            <button onClick={() => chooseDecision('ignore')}><strong>Ignore all three messages</strong><span>Wait until somebody else decides.</span></button>
          </div> : <div className={decision === 'verify' ? 'feedback good' : 'feedback bad'}>
            <h3>{decision === 'verify' ? 'Strong call.' : 'That made the situation worse.'}</h3>
            <p>{decision === 'verify' ? 'You confirm the B House message is fake. A safe stairwell remains open for a few minutes.' : 'Confusion spreads. The hallway gets louder and your panic rises.'}</p>
            <button className="primary" onClick={() => setScreen('runner')}>OPEN THE A202 DOOR</button>
          </div>}
        </section>
      )}

      {screen === 'runner' && (
        <section className="runner-screen">
          <div className="runner-hall">
            <div className="runner-zombie">🧟</div><div className="runner-player">{avatar}</div>
            <div className="obstacle one">🪑</div><div className="obstacle two">🎒</div><div className="obstacle three">🗑️</div>
          </div>
          <p className="eyebrow">7:35 AM • A HOUSE ESCAPE</p>
          <h2>Dodge the hallway chaos</h2>
          <div className="progress"><span style={{ width: `${runnerScore}%` }} /></div>
          <div className="runner-controls"><button onClick={() => runMove('jump')}>JUMP</button><button onClick={() => runMove('slide')}>SLIDE</button><button onClick={() => runMove('dodge')}>DODGE</button></div>
          {runnerScore >= 100 && <button className="primary" onClick={() => setScreen('hub')}>REACH THE CENTRAL HUB</button>}
        </section>
      )}

      {screen === 'hub' && (
        <section className="scene hub-scene"><div className="scene-overlay">
          <p className="eyebrow">8:14 AM • CENTRAL HUB</p>
          <h2>One minute until the bell.</h2>
          <p>The front office doors begin to close. A group is trapped near the B House entrance. The intercom crackles.</p>
          <p className="radio">“Do not let the 8:15 bell ring.”</p>
          <button className="danger-button" onClick={() => setScreen('results')}>HOLD THE DOORS</button>
        </div></section>
      )}

      {screen === 'results' && (
        <section className="panel results">
          <p className="eyebrow">MISSION 1 COMPLETE</p>
          <h2>8:15 AM — THE BELL RINGS</h2>
          <div className="alarm">BRRRRIIINNNGGG</div>
          <p>Hundreds of footsteps erupt from the center of the school.</p>
          <div className="score-grid"><span><strong>{trust}</strong>Trust</span><span><strong>{supplies}</strong>Supplies</span><span><strong>{runnerScore}</strong>Escape</span><span><strong>{role.ability}</strong>Ability</span></div>
          <div className="next-mission"><strong>NEXT: B HOUSE — HALL CHANGE HORDE</strong><span>8:20 AM</span></div>
          <button className="primary" onClick={resetGame}>PLAY AGAIN</button>
        </section>
      )}
    </main>
  );
}

export default App;
