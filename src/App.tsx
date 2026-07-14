import { useEffect, useMemo, useState } from 'react';
import {
  encounters,
  elevatorPrompts,
  inboxActions,
  inboxMessages,
  type EncounterChoice,
  type InboxAction,
  type SkillCategory,
} from './game/content';

const SAVE_KEY = 'wrs-quest-floor-1-save';
const SETTINGS_KEY = 'wrs-quest-settings';

const skillCategories: SkillCategory[] = [
  'Professionalism',
  'People Skills',
  'Problem Solving',
  'Operations',
];

type Screen =
  | 'title'
  | 'briefing'
  | 'encounter'
  | 'outcome'
  | 'inbox'
  | 'elevator'
  | 'review'
  | 'how-to'
  | 'settings';

interface DecisionRecord {
  encounter: string;
  choice: string;
  outcome: string;
  skills: string[];
  category: SkillCategory;
}

interface RunState {
  xp: number;
  trust: number;
  credits: number;
  time: number;
  allies: string[];
  modifiers: string[];
  skills: Record<SkillCategory, number>;
  decisions: DecisionRecord[];
  inboxCorrect: number;
  inboxErrors: number;
  elevatorCorrect: number;
  elevatorErrors: number;
}

interface GameSettings {
  sound: boolean;
  reducedMotion: boolean;
  textSpeed: 'Standard' | 'Fast';
}

interface SavedGame {
  run: RunState;
  screen: Screen;
  encounterIndex: number;
}

const initialSkills = (): Record<SkillCategory, number> => ({
  Professionalism: 0,
  'People Skills': 0,
  'Problem Solving': 0,
  Operations: 0,
});

const createInitialRun = (): RunState => ({
  xp: 0,
  trust: 0,
  credits: 10,
  time: 5,
  allies: [],
  modifiers: [],
  skills: initialSkills(),
  decisions: [],
  inboxCorrect: 0,
  inboxErrors: 0,
  elevatorCorrect: 0,
  elevatorErrors: 0,
});

const loadSettings = (): GameSettings => {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    return raw
      ? JSON.parse(raw)
      : { sound: true, reducedMotion: false, textSpeed: 'Standard' };
  } catch {
    return { sound: true, reducedMotion: false, textSpeed: 'Standard' };
  }
};

const loadSave = (): SavedGame | null => {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const effectLabel = (label: string, value?: number) => {
  if (!value) return null;
  return `${label} ${value > 0 ? '+' : ''}${value}`;
};

function App() {
  const [screen, setScreen] = useState<Screen>('title');
  const [run, setRun] = useState<RunState>(createInitialRun);
  const [encounterIndex, setEncounterIndex] = useState(0);
  const [lastChoice, setLastChoice] = useState<EncounterChoice | null>(null);
  const [settings, setSettings] = useState<GameSettings>(loadSettings);
  const [hasSave, setHasSave] = useState(Boolean(loadSave()));
  const [debugOpen, setDebugOpen] = useState(false);

  const [inboxIndex, setInboxIndex] = useState(0);
  const [inboxSeconds, setInboxSeconds] = useState(50);
  const [inboxCombo, setInboxCombo] = useState(0);
  const [inboxFeedback, setInboxFeedback] = useState<{
    correct: boolean;
    text: string;
  } | null>(null);

  const [elevatorIndex, setElevatorIndex] = useState(0);
  const [elevatorSeconds, setElevatorSeconds] = useState(35);
  const [elevatorFeedback, setElevatorFeedback] = useState<{
    correct: boolean;
    text: string;
  } | null>(null);

  useEffect(() => {
    document.body.classList.toggle('reduced-motion', settings.reducedMotion);
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    if (screen === 'title' || screen === 'how-to' || screen === 'settings') return;
    const save: SavedGame = { run, screen, encounterIndex };
    localStorage.setItem(SAVE_KEY, JSON.stringify(save));
    setHasSave(true);
  }, [run, screen, encounterIndex]);

  useEffect(() => {
    if (screen !== 'inbox' || inboxFeedback) return;
    const timer = window.setInterval(
      () => setInboxSeconds((seconds) => Math.max(0, seconds - 1)),
      1000,
    );
    return () => window.clearInterval(timer);
  }, [screen, inboxFeedback]);

  useEffect(() => {
    if (screen === 'inbox' && inboxSeconds === 0) beginElevator();
  }, [inboxSeconds, screen]);

  useEffect(() => {
    if (screen !== 'elevator' || elevatorFeedback) return;
    const timer = window.setInterval(
      () => setElevatorSeconds((seconds) => Math.max(0, seconds - 1)),
      1000,
    );
    return () => window.clearInterval(timer);
  }, [screen, elevatorFeedback]);

  useEffect(() => {
    if (screen === 'elevator' && elevatorSeconds === 0) finishFloor();
  }, [elevatorSeconds, screen]);

  const promotionScore = useMemo(
    () =>
      run.xp +
      run.trust * 8 +
      run.inboxCorrect * 7 +
      run.elevatorCorrect * 12 -
      run.inboxErrors * 4 -
      run.elevatorErrors * 6,
    [run],
  );

  const promoted =
    run.xp >= 78 && run.trust >= 0 && run.elevatorCorrect >= 2;
  const stars = promotionScore >= 185 ? 3 : promotionScore >= 130 ? 2 : 1;

  function startNewShift() {
    localStorage.removeItem(SAVE_KEY);
    setRun(createInitialRun());
    setEncounterIndex(0);
    setLastChoice(null);
    setInboxIndex(0);
    setInboxCombo(0);
    setInboxFeedback(null);
    setElevatorIndex(0);
    setElevatorFeedback(null);
    setScreen('briefing');
  }

  function continueShift() {
    const saved = loadSave();
    if (!saved) return startNewShift();
    setRun(saved.run);
    setEncounterIndex(saved.encounterIndex);
    setLastChoice(null);

    if (saved.screen === 'inbox') {
      beginInbox(saved.run);
    } else if (saved.screen === 'elevator') {
      beginElevator(saved.run);
    } else if (saved.screen === 'review') {
      setScreen('review');
    } else {
      setScreen(saved.screen === 'outcome' ? 'encounter' : saved.screen);
    }
  }

  function chooseEncounter(choice: EncounterChoice) {
    setLastChoice(choice);
    setRun((current) => {
      const nextAllies = choice.effect.ally
        ? Array.from(new Set([...current.allies, choice.effect.ally]))
        : current.allies;
      const nextModifiers = choice.effect.modifier
        ? Array.from(new Set([...current.modifiers, choice.effect.modifier]))
        : current.modifiers;

      return {
        ...current,
        xp: Math.max(0, current.xp + (choice.effect.xp ?? 0)),
        trust: current.trust + (choice.effect.trust ?? 0),
        credits: Math.max(0, current.credits + (choice.effect.credits ?? 0)),
        time: clamp(current.time + (choice.effect.time ?? 0), -5, 12),
        allies: nextAllies,
        modifiers: nextModifiers,
        skills: {
          ...current.skills,
          [choice.category]: current.skills[choice.category] + 1,
        },
        decisions: [
          ...current.decisions,
          {
            encounter: encounters[encounterIndex].title,
            choice: choice.label,
            outcome: choice.outcome,
            skills: choice.skills,
            category: choice.category,
          },
        ],
      };
    });
    setScreen('outcome');
  }

  function advanceEncounter() {
    if (encounterIndex < encounters.length - 1) {
      setEncounterIndex((index) => index + 1);
      setLastChoice(null);
      setScreen('encounter');
      return;
    }
    beginInbox();
  }

  function beginInbox(sourceRun: RunState = run) {
    const bonus = sourceRun.time * 2;
    const penalty =
      (sourceRun.modifiers.includes('phishingFlood') ? 8 : 0) +
      (sourceRun.modifiers.includes('systemCompromised') ? 8 : 0) +
      (sourceRun.modifiers.includes('extraSpam') ? 4 : 0);
    const allyBonus =
      (sourceRun.modifiers.includes('clearBrief') ? 4 : 0) +
      (sourceRun.modifiers.includes('phishHint') ? 5 : 0);

    setInboxIndex(0);
    setInboxCombo(0);
    setInboxFeedback(null);
    setInboxSeconds(clamp(50 + bonus + allyBonus - penalty, 32, 75));
    setScreen('inbox');
  }

  function sortInbox(action: InboxAction) {
    if (inboxFeedback) return;
    const message = inboxMessages[inboxIndex];
    const correct = action === message.correctAction;

    setRun((current) => ({
      ...current,
      xp: Math.max(0, current.xp + (correct ? 7 + inboxCombo * 2 : -2)),
      trust: current.trust + (correct ? 0 : -1),
      credits: Math.max(0, current.credits + (correct ? 2 : 0)),
      skills: {
        ...current.skills,
        [message.category]: current.skills[message.category] + (correct ? 1 : 0),
      },
      inboxCorrect: current.inboxCorrect + (correct ? 1 : 0),
      inboxErrors: current.inboxErrors + (correct ? 0 : 1),
    }));

    if (correct) {
      setInboxCombo((combo) => combo + 1);
      setInboxFeedback({
        correct: true,
        text: `Correct: ${message.rationale}`,
      });
    } else {
      setInboxCombo(0);
      setInboxSeconds((seconds) => Math.max(0, seconds - 5));
      setInboxFeedback({
        correct: false,
        text: `Better action: ${message.correctAction}. ${message.rationale}`,
      });
    }
  }

  function nextInboxMessage() {
    if (inboxIndex >= inboxMessages.length - 1) {
      beginElevator();
      return;
    }
    setInboxIndex((index) => index + 1);
    setInboxFeedback(null);
  }

  function beginElevator(sourceRun: RunState = run) {
    const allyBonus = Math.min(sourceRun.allies.length * 3, 12);
    const routePenalty =
      (sourceRun.modifiers.includes('lostBadge') ? 6 : 0) +
      (sourceRun.modifiers.includes('managerDistrust') ? 3 : 0);
    const shieldBonus = sourceRun.modifiers.includes('securityShield') ? 5 : 0;

    setElevatorIndex(0);
    setElevatorFeedback(null);
    setElevatorSeconds(clamp(35 + allyBonus + shieldBonus - routePenalty, 25, 55));
    setScreen('elevator');
  }

  function answerElevator(choiceIndex: number) {
    if (elevatorFeedback) return;
    const prompt = elevatorPrompts[elevatorIndex];
    const choice = prompt.choices[choiceIndex];

    setRun((current) => ({
      ...current,
      xp: Math.max(0, current.xp + (choice.correct ? 12 : -3)),
      trust: current.trust + (choice.correct ? 1 : -1),
      credits: Math.max(0, current.credits + (choice.correct ? 3 : 0)),
      skills: {
        ...current.skills,
        [choice.category]: current.skills[choice.category] + (choice.correct ? 1 : 0),
      },
      elevatorCorrect: current.elevatorCorrect + (choice.correct ? 1 : 0),
      elevatorErrors: current.elevatorErrors + (choice.correct ? 0 : 1),
    }));

    if (!choice.correct) {
      const protectedByAlly = run.allies.length > run.elevatorErrors;
      setElevatorSeconds((seconds) =>
        Math.max(0, seconds - (protectedByAlly ? 2 : 6)),
      );
      setElevatorFeedback({
        correct: false,
        text: `${choice.feedback}${
          protectedByAlly
            ? ' An ally limits the damage from this mistake.'
            : ''
        }`,
      });
    } else {
      setElevatorFeedback({ correct: true, text: choice.feedback });
    }
  }

  function nextElevatorPrompt() {
    if (elevatorIndex >= elevatorPrompts.length - 1) {
      finishFloor();
      return;
    }
    setElevatorIndex((index) => index + 1);
    setElevatorFeedback(null);
  }

  function finishFloor() {
    setScreen('review');
  }

  function resetSave() {
    localStorage.removeItem(SAVE_KEY);
    setHasSave(false);
    setRun(createInitialRun());
    setEncounterIndex(0);
    setScreen('title');
    setDebugOpen(false);
  }

  function debugJump(target: 'encounter' | 'inbox' | 'elevator' | 'review') {
    if (target === 'encounter') {
      setEncounterIndex(0);
      setScreen('encounter');
    } else if (target === 'inbox') {
      beginInbox();
    } else if (target === 'elevator') {
      beginElevator();
    } else {
      setScreen('review');
    }
    setDebugOpen(false);
  }

  return (
    <div className="app-shell">
      <div className="background-grid" />
      {screen !== 'title' && screen !== 'how-to' && screen !== 'settings' && (
        <StatusHud run={run} />
      )}

      <main className="game-frame" aria-live="polite">
        {screen === 'title' && (
          <TitleScreen
            hasSave={hasSave}
            onNew={startNewShift}
            onContinue={continueShift}
            onHowTo={() => setScreen('how-to')}
            onSettings={() => setScreen('settings')}
          />
        )}

        {screen === 'briefing' && (
          <BriefingScreen onContinue={() => setScreen('encounter')} />
        )}

        {screen === 'encounter' && (
          <EncounterScreen
            encounterIndex={encounterIndex}
            onChoose={chooseEncounter}
          />
        )}

        {screen === 'outcome' && lastChoice && (
          <OutcomeScreen choice={lastChoice} onContinue={advanceEncounter} />
        )}

        {screen === 'inbox' && (
          <InboxScreen
            index={inboxIndex}
            seconds={inboxSeconds}
            combo={inboxCombo}
            feedback={inboxFeedback}
            hasHint={run.modifiers.includes('phishHint')}
            onSort={sortInbox}
            onNext={nextInboxMessage}
          />
        )}

        {screen === 'elevator' && (
          <ElevatorScreen
            index={elevatorIndex}
            seconds={elevatorSeconds}
            allies={run.allies}
            feedback={elevatorFeedback}
            onAnswer={answerElevator}
            onNext={nextElevatorPrompt}
          />
        )}

        {screen === 'review' && (
          <ReviewScreen
            run={run}
            score={promotionScore}
            stars={stars}
            promoted={promoted}
            onReplay={startNewShift}
            onTitle={() => setScreen('title')}
          />
        )}

        {screen === 'how-to' && (
          <HowToScreen onBack={() => setScreen('title')} />
        )}

        {screen === 'settings' && (
          <SettingsScreen
            settings={settings}
            onChange={setSettings}
            onBack={() => setScreen('title')}
          />
        )}
      </main>

      <button
        className="debug-trigger"
        aria-label="Open developer controls"
        onClick={() => setDebugOpen((open) => !open)}
      >
        DEV
      </button>

      {debugOpen && (
        <aside className="debug-panel">
          <strong>Scene Jump</strong>
          <button onClick={() => debugJump('encounter')}>Encounter 1</button>
          <button onClick={() => debugJump('inbox')}>Inbox Zero</button>
          <button onClick={() => debugJump('elevator')}>Elevator</button>
          <button onClick={() => debugJump('review')}>Review</button>
          <button className="danger" onClick={resetSave}>
            Reset save
          </button>
        </aside>
      )}
    </div>
  );
}

function StatusHud({ run }: { run: RunState }) {
  return (
    <header className="status-hud">
      <div className="brand-mini">
        <span>WRS</span> QUEST
      </div>
      <div className="hud-stat">
        <small>XP</small>
        <strong>{run.xp}</strong>
      </div>
      <div className="hud-stat">
        <small>TRUST</small>
        <strong className={run.trust < 0 ? 'negative' : ''}>{run.trust}</strong>
      </div>
      <div className="hud-stat">
        <small>CREDITS</small>
        <strong>{run.credits}</strong>
      </div>
      <div className="hud-stat wide">
        <small>ALLIES</small>
        <strong>{run.allies.length ? run.allies.join(' • ') : 'NONE YET'}</strong>
      </div>
    </header>
  );
}

function TitleScreen({
  hasSave,
  onNew,
  onContinue,
  onHowTo,
  onSettings,
}: {
  hasSave: boolean;
  onNew: () => void;
  onContinue: () => void;
  onHowTo: () => void;
  onSettings: () => void;
}) {
  return (
    <section className="title-screen panel comic-panel">
      <div className="warning-ribbon">OMNICORP EMERGENCY NETWORK</div>
      <p className="eyebrow">A WORKPLACE READINESS ADVENTURE</p>
      <h1>
        WRS <span>QUEST</span>
      </h1>
      <h2>CORPOCALYPSE</h2>
      <p className="subtitle">Climb the corporate ladder. Survive your first shift.</p>
      <div className="title-art" aria-hidden="true">
        <div className="tower">
          <span className="floor-lit" />
          <span />
          <span />
          <span />
          <span />
        </div>
        <div className="alarm-pulse" />
        <div className="silhouette employee-one" />
        <div className="silhouette employee-two" />
      </div>
      <div className="menu-stack">
        <button className="primary-action" onClick={onNew}>
          NEW SHIFT
        </button>
        <button disabled={!hasSave} onClick={onContinue}>
          CONTINUE SHIFT
        </button>
        <button onClick={onHowTo}>HOW TO PLAY</button>
        <button onClick={onSettings}>SETTINGS</button>
      </div>
      <p className="fine-print">Floor 1 vertical slice • Intern Orientation</p>
    </section>
  );
}

function BriefingScreen({ onContinue }: { onContinue: () => void }) {
  return (
    <section className="panel briefing-screen">
      <div className="scene-heading">
        <span className="location-tag">FLOOR 1</span>
        <span className="danger-tag">LOCKDOWN ACTIVE</span>
      </div>
      <h1>Intern Orientation</h1>
      <div className="comic-strip">
        <article>
          <div className="panel-number">08:01</div>
          <h3>First day.</h3>
          <p>You enter OmniCorp expecting forms, badges, and an awkward office tour.</p>
        </article>
        <article>
          <div className="panel-number">08:03</div>
          <h3>Bad timing.</h3>
          <p>The alarms activate. Employees in business attire begin shuffling toward HR.</p>
        </article>
        <article>
          <div className="panel-number">08:05</div>
          <h3>New objective.</h3>
          <p>Restore critical operations, protect the team, and reach the promotion elevator.</p>
        </article>
      </div>
      <div className="mission-card">
        <strong>YOUR SHIFT</strong>
        <p>
          Make workplace decisions. Your choices change your allies, resources, time,
          and the difficulty of the challenges ahead.
        </p>
      </div>
      <button className="primary-action" onClick={onContinue}>
        CLOCK IN
      </button>
    </section>
  );
}

function EncounterScreen({
  encounterIndex,
  onChoose,
}: {
  encounterIndex: number;
  onChoose: (choice: EncounterChoice) => void;
}) {
  const encounter = encounters[encounterIndex];
  return (
    <section className="panel encounter-screen">
      <div className="scene-heading">
        <span className="location-tag">{encounter.location}</span>
        <span>
          ENCOUNTER {encounterIndex + 1}/{encounters.length}
        </span>
      </div>
      <div className="character-row">
        <div className="character-portrait" aria-hidden="true">
          <span>{encounter.speaker.slice(0, 1)}</span>
        </div>
        <div>
          <p className="eyebrow">{encounter.role}</p>
          <h1>{encounter.speaker}</h1>
        </div>
      </div>
      <div className="alert-box">⚠ {encounter.alert}</div>
      <h2>{encounter.title}</h2>
      <p className="situation-copy">{encounter.situation}</p>
      <div className="choice-grid">
        {encounter.choices.map((choice, index) => (
          <button
            className="choice-card"
            key={choice.id}
            onClick={() => onChoose(choice)}
          >
            <span className="choice-key">{String.fromCharCode(65 + index)}</span>
            <span>
              <strong>{choice.label}</strong>
              <small>{choice.detail}</small>
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}

function OutcomeScreen({
  choice,
  onContinue,
}: {
  choice: EncounterChoice;
  onContinue: () => void;
}) {
  const effects = [
    effectLabel('XP', choice.effect.xp),
    effectLabel('Trust', choice.effect.trust),
    effectLabel('Credits', choice.effect.credits),
    effectLabel('Time', choice.effect.time),
  ].filter(Boolean);

  return (
    <section className="panel outcome-screen">
      <p className="eyebrow">CONSEQUENCE RECORDED</p>
      <h1>{choice.label}</h1>
      <p className="outcome-copy">{choice.outcome}</p>
      <div className="effect-row">
        {effects.map((effect) => (
          <span key={effect}>{effect}</span>
        ))}
        {choice.effect.ally && <span>Ally: {choice.effect.ally}</span>}
      </div>
      <div className="skill-callout">
        <small>WORKPLACE SKILLS</small>
        <strong>{choice.skills.join(' • ')}</strong>
      </div>
      <p className="consequence-note">
        This choice will alter a later challenge. Decisions do more than award points.
      </p>
      <button className="primary-action" onClick={onContinue}>
        CONTINUE SHIFT
      </button>
    </section>
  );
}

function InboxScreen({
  index,
  seconds,
  combo,
  feedback,
  hasHint,
  onSort,
  onNext,
}: {
  index: number;
  seconds: number;
  combo: number;
  feedback: { correct: boolean; text: string } | null;
  hasHint: boolean;
  onSort: (action: InboxAction) => void;
  onNext: () => void;
}) {
  const message = inboxMessages[index];
  return (
    <section className="panel challenge-screen">
      <div className="challenge-header">
        <div>
          <p className="eyebrow">JOB CHALLENGE</p>
          <h1>Inbox Zero</h1>
        </div>
        <div className={`timer ${seconds <= 15 ? 'critical' : ''}`}>{seconds}s</div>
      </div>
      <div className="challenge-meter">
        <span style={{ width: `${((index + 1) / inboxMessages.length) * 100}%` }} />
      </div>
      <div className="challenge-meta">
        <span>
          MESSAGE {index + 1}/{inboxMessages.length}
        </span>
        <span>COMBO x{combo}</span>
      </div>
      <article className="email-card">
        <div className="email-topline">
          <strong>{message.sender}</strong>
          <span>{message.category}</span>
        </div>
        <h2>{message.subject}</h2>
        <p>{message.preview}</p>
        {hasHint && message.correctAction === 'Report Phishing' && (
          <div className="ally-hint">Security Bot: This sender does not match OmniCorp records.</div>
        )}
      </article>
      {!feedback ? (
        <div className="action-grid">
          {inboxActions.map((action) => (
            <button key={action} onClick={() => onSort(action)}>
              {action}
            </button>
          ))}
        </div>
      ) : (
        <div className={`feedback-card ${feedback.correct ? 'success' : 'failure'}`}>
          <strong>{feedback.correct ? 'SORTED' : 'MISROUTED'}</strong>
          <p>{feedback.text}</p>
          <button className="primary-action" onClick={onNext}>
            {index === inboxMessages.length - 1 ? 'RUN TO ELEVATOR' : 'NEXT MESSAGE'}
          </button>
        </div>
      )}
    </section>
  );
}

function ElevatorScreen({
  index,
  seconds,
  allies,
  feedback,
  onAnswer,
  onNext,
}: {
  index: number;
  seconds: number;
  allies: string[];
  feedback: { correct: boolean; text: string } | null;
  onAnswer: (choiceIndex: number) => void;
  onNext: () => void;
}) {
  const prompt = elevatorPrompts[index];
  return (
    <section className="panel elevator-screen">
      <div className="challenge-header">
        <div>
          <p className="eyebrow">PROMOTION GATE</p>
          <h1>Elevator Escape</h1>
        </div>
        <div className={`timer ${seconds <= 10 ? 'critical' : ''}`}>{seconds}s</div>
      </div>
      <div className="elevator-doors" aria-hidden="true">
        <div />
        <span>{index + 1}</span>
        <div />
      </div>
      <div className="ally-line">
        <small>ACTIVE SUPPORT</small>
        <strong>{allies.length ? allies.join(' • ') : 'No allies — mistakes cost full time'}</strong>
      </div>
      <div className="threat-card">
        <span>OBSTACLE {index + 1}</span>
        <h2>{prompt.threat}</h2>
        <p>{prompt.context}</p>
      </div>
      {!feedback ? (
        <div className="choice-grid compact">
          {prompt.choices.map((choice, choiceIndex) => (
            <button
              className="choice-card"
              key={choice.label}
              onClick={() => onAnswer(choiceIndex)}
            >
              <span className="choice-key">{choiceIndex + 1}</span>
              <span>
                <strong>{choice.label}</strong>
                <small>{choice.skill}</small>
              </span>
            </button>
          ))}
        </div>
      ) : (
        <div className={`feedback-card ${feedback.correct ? 'success' : 'failure'}`}>
          <strong>{feedback.correct ? 'ROUTE CLEARED' : 'TIME LOST'}</strong>
          <p>{feedback.text}</p>
          <button className="primary-action" onClick={onNext}>
            {index === elevatorPrompts.length - 1 ? 'OPEN ELEVATOR' : 'NEXT OBSTACLE'}
          </button>
        </div>
      )}
    </section>
  );
}

function ReviewScreen({
  run,
  score,
  stars,
  promoted,
  onReplay,
  onTitle,
}: {
  run: RunState;
  score: number;
  stars: number;
  promoted: boolean;
  onReplay: () => void;
  onTitle: () => void;
}) {
  const strongestCategory = skillCategories.reduce((best, category) =>
    run.skills[category] > run.skills[best] ? category : best,
  );

  return (
    <section className="panel review-screen">
      <p className="eyebrow">OMNICORP PERFORMANCE REVIEW</p>
      <h1>{promoted ? 'PROMOTION EARNED' : 'SHIFT SURVIVED'}</h1>
      <div className="promotion-badge">
        <small>{promoted ? 'NEW TITLE' : 'CURRENT TITLE'}</small>
        <strong>{promoted ? 'JUNIOR ASSOCIATE' : 'INTERN'}</strong>
      </div>
      <div className="star-row" aria-label={`${stars} out of 3 stars`}>
        {[1, 2, 3].map((star) => (
          <span className={star <= stars ? 'earned' : ''} key={star}>
            ★
          </span>
        ))}
      </div>
      <div className="review-grid">
        <div>
          <small>PERFORMANCE SCORE</small>
          <strong>{score}</strong>
        </div>
        <div>
          <small>XP</small>
          <strong>{run.xp}</strong>
        </div>
        <div>
          <small>TRUST</small>
          <strong>{run.trust}</strong>
        </div>
        <div>
          <small>CREDITS</small>
          <strong>{run.credits}</strong>
        </div>
        <div>
          <small>INBOX ACCURACY</small>
          <strong>
            {run.inboxCorrect}/{inboxMessages.length}
          </strong>
        </div>
        <div>
          <small>ELEVATOR CLEARS</small>
          <strong>
            {run.elevatorCorrect}/{elevatorPrompts.length}
          </strong>
        </div>
      </div>
      <div className="skill-report">
        <div className="skill-report-heading">
          <div>
            <small>STRONGEST TRACK</small>
            <strong>{strongestCategory}</strong>
          </div>
          <div>
            <small>ALLIES EARNED</small>
            <strong>{run.allies.length}</strong>
          </div>
        </div>
        {skillCategories.map((category) => (
          <div className="skill-bar" key={category}>
            <span>{category}</span>
            <div>
              <i style={{ width: `${Math.min(100, run.skills[category] * 18)}%` }} />
            </div>
            <strong>{run.skills[category]}</strong>
          </div>
        ))}
      </div>
      <details className="decision-log">
        <summary>Review decision consequences</summary>
        {run.decisions.map((decision) => (
          <article key={`${decision.encounter}-${decision.choice}`}>
            <strong>{decision.encounter}</strong>
            <span>{decision.choice}</span>
            <p>{decision.outcome}</p>
            <small>{decision.skills.join(' • ')}</small>
          </article>
        ))}
      </details>
      {!promoted && (
        <p className="promotion-tip">
          Promotion requires 78 XP, nonnegative Trust, and at least two cleared elevator obstacles.
        </p>
      )}
      <div className="button-row">
        <button className="primary-action" onClick={onReplay}>
          REPLAY FLOOR
        </button>
        <button onClick={onTitle}>TITLE SCREEN</button>
        <button disabled>FLOOR 2 — LOCKED</button>
      </div>
    </section>
  );
}

function HowToScreen({ onBack }: { onBack: () => void }) {
  return (
    <section className="panel info-screen">
      <p className="eyebrow">FIELD MANUAL</p>
      <h1>How to Play</h1>
      <div className="info-grid">
        <article>
          <span>01</span>
          <h2>Make decisions</h2>
          <p>Choose how to handle real workplace situations. Every choice changes the run.</p>
        </article>
        <article>
          <span>02</span>
          <h2>Build your reputation</h2>
          <p>Earn XP for promotion, Trust through strong decisions, and Credits for future upgrades.</p>
        </article>
        <article>
          <span>03</span>
          <h2>Complete job challenges</h2>
          <p>Apply the same skills under time pressure in Inbox Zero and Elevator Escape.</p>
        </article>
        <article>
          <span>04</span>
          <h2>Replay differently</h2>
          <p>Alternate choices create different allies, timers, penalties, and performance results.</p>
        </article>
      </div>
      <div className="control-note">
        Mouse, touch, and keyboard focus are supported. All essential information is text based.
      </div>
      <button className="primary-action" onClick={onBack}>
        BACK
      </button>
    </section>
  );
}

function SettingsScreen({
  settings,
  onChange,
  onBack,
}: {
  settings: GameSettings;
  onChange: (settings: GameSettings) => void;
  onBack: () => void;
}) {
  return (
    <section className="panel info-screen settings-screen">
      <p className="eyebrow">SYSTEM OPTIONS</p>
      <h1>Settings</h1>
      <label>
        <span>
          <strong>Sound</strong>
          <small>Prepared for future music and effect integration.</small>
        </span>
        <input
          type="checkbox"
          checked={settings.sound}
          onChange={(event) =>
            onChange({ ...settings, sound: event.target.checked })
          }
        />
      </label>
      <label>
        <span>
          <strong>Reduced motion</strong>
          <small>Disables pulsing, sliding, and animated warning effects.</small>
        </span>
        <input
          type="checkbox"
          checked={settings.reducedMotion}
          onChange={(event) =>
            onChange({ ...settings, reducedMotion: event.target.checked })
          }
        />
      </label>
      <label>
        <span>
          <strong>Text speed</strong>
          <small>Reserved for future animated dialogue scenes.</small>
        </span>
        <select
          value={settings.textSpeed}
          onChange={(event) =>
            onChange({
              ...settings,
              textSpeed: event.target.value as GameSettings['textSpeed'],
            })
          }
        >
          <option>Standard</option>
          <option>Fast</option>
        </select>
      </label>
      <button className="primary-action" onClick={onBack}>
        SAVE AND RETURN
      </button>
    </section>
  );
}

export default App;
