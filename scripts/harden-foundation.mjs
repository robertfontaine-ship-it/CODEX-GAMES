// Foundation hardening v3
import { readFileSync, writeFileSync } from 'node:fs';

const appPath = 'src/App.tsx';
const stylesPath = 'src/styles.css';
let app = readFileSync(appPath, 'utf8');
let styles = readFileSync(stylesPath, 'utf8');

function replaceOnce(source, search, replacement, label) {
  if (!source.includes(search)) {
    throw new Error(`Could not find ${label}`);
  }
  return source.replace(search, replacement);
}

app = replaceOnce(
  app,
  "} from './game/content';\n",
  "} from './game/content';\nimport {\n  calculatePerformanceScore,\n  calculateStars,\n  isPromoted,\n  PROMOTION_REQUIREMENTS,\n} from './game/rules';\n",
  'game-rules import target',
);

app = replaceOnce(
  app,
  `interface GameSettings {\n  sound: boolean;\n  reducedMotion: boolean;\n  textSpeed: 'Standard' | 'Fast';\n}\n\ninterface SavedGame {\n  run: RunState;\n  screen: Screen;\n  encounterIndex: number;\n}\n`,
  `interface GameSettings {\n  sound: boolean;\n  reducedMotion: boolean;\n  textSpeed: 'Standard' | 'Fast';\n}\n\ninterface ChallengeFeedback {\n  correct: boolean;\n  text: string;\n}\n\ninterface SavedGame {\n  version: 2;\n  run: RunState;\n  screen: Screen;\n  encounterIndex: number;\n  lastChoice: EncounterChoice | null;\n  inboxIndex: number;\n  inboxSeconds: number;\n  inboxCombo: number;\n  inboxFeedback: ChallengeFeedback | null;\n  elevatorIndex: number;\n  elevatorSeconds: number;\n  elevatorFeedback: ChallengeFeedback | null;\n}\n`,
  'saved-game interface',
);

app = replaceOnce(
  app,
  `  const [debugOpen, setDebugOpen] = useState(false);\n`,
  `  const [debugOpen, setDebugOpen] = useState(false);\n  const devMode = useMemo(\n    () => new URLSearchParams(window.location.search).has('dev'),\n    [],\n  );\n`,
  'developer mode state',
);

app = replaceOnce(
  app,
  `  useEffect(() => {\n    if (screen === 'title' || screen === 'how-to' || screen === 'settings') return;\n    const save: SavedGame = { run, screen, encounterIndex };\n    localStorage.setItem(SAVE_KEY, JSON.stringify(save));\n    setHasSave(true);\n  }, [run, screen, encounterIndex]);\n`,
  `  useEffect(() => {\n    if (screen === 'title' || screen === 'how-to' || screen === 'settings') return;\n    const save: SavedGame = {\n      version: 2,\n      run,\n      screen,\n      encounterIndex,\n      lastChoice,\n      inboxIndex,\n      inboxSeconds,\n      inboxCombo,\n      inboxFeedback,\n      elevatorIndex,\n      elevatorSeconds,\n      elevatorFeedback,\n    };\n    localStorage.setItem(SAVE_KEY, JSON.stringify(save));\n    setHasSave(true);\n  }, [\n    run,\n    screen,\n    encounterIndex,\n    lastChoice,\n    inboxIndex,\n    inboxSeconds,\n    inboxCombo,\n    inboxFeedback,\n    elevatorIndex,\n    elevatorSeconds,\n    elevatorFeedback,\n  ]);\n`,
  'save-state effect',
);

app = replaceOnce(
  app,
  `  const promotionScore = useMemo(\n    () =>\n      run.xp +\n      run.trust * 8 +\n      run.inboxCorrect * 7 +\n      run.elevatorCorrect * 12 -\n      run.inboxErrors * 4 -\n      run.elevatorErrors * 6,\n    [run],\n  );\n\n  const promoted =\n    run.xp >= 78 && run.trust >= 0 && run.elevatorCorrect >= 2;\n  const stars = promotionScore >= 185 ? 3 : promotionScore >= 130 ? 2 : 1;\n`,
  `  const promotionScore = useMemo(() => calculatePerformanceScore(run), [run]);\n  const promoted = isPromoted(run);\n  const stars = calculateStars(promotionScore);\n`,
  'promotion calculation',
);

app = replaceOnce(
  app,
  `    setInboxIndex(0);\n    setInboxCombo(0);\n    setInboxFeedback(null);\n    setElevatorIndex(0);\n    setElevatorFeedback(null);\n`,
  `    setInboxIndex(0);\n    setInboxSeconds(50);\n    setInboxCombo(0);\n    setInboxFeedback(null);\n    setElevatorIndex(0);\n    setElevatorSeconds(35);\n    setElevatorFeedback(null);\n`,
  'new-shift challenge reset',
);

const continuePattern = /  function continueShift\(\) \{[\s\S]*?\n  \}\n\n  function chooseEncounter/;
if (!continuePattern.test(app)) {
  throw new Error('Could not find continue-shift function');
}
app = app.replace(
  continuePattern,
  `  function continueShift() {\n    const saved = loadSave();\n    if (!saved || saved.version !== 2) return startNewShift();\n\n    setRun(saved.run);\n    setEncounterIndex(saved.encounterIndex);\n    setLastChoice(saved.lastChoice);\n    setInboxIndex(saved.inboxIndex);\n    setInboxSeconds(saved.inboxSeconds);\n    setInboxCombo(saved.inboxCombo);\n    setInboxFeedback(saved.inboxFeedback);\n    setElevatorIndex(saved.elevatorIndex);\n    setElevatorSeconds(saved.elevatorSeconds);\n    setElevatorFeedback(saved.elevatorFeedback);\n    setScreen(saved.screen);\n  }\n\n  function chooseEncounter`,
);

app = replaceOnce(
  app,
  `      <div className="hud-stat">\n        <small>CREDITS</small>\n        <strong>{run.credits}</strong>\n      </div>\n      <div className="hud-stat wide">`,
  `      <div className="hud-stat">\n        <small>CREDITS</small>\n        <strong>{run.credits}</strong>\n      </div>\n      <div className="hud-stat">\n        <small>TIME BANK</small>\n        <strong className={run.time < 0 ? 'negative' : ''}>\n          {run.time > 0 ? '+' + run.time : run.time}\n        </strong>\n      </div>\n      <div className="hud-stat wide">`,
  'time-bank HUD',
);

app = replaceOnce(
  app,
  `          Promotion requires 78 XP, nonnegative Trust, and at least two cleared elevator obstacles.`,
  `          Promotion requires {PROMOTION_REQUIREMENTS.xp} XP, nonnegative Trust, at least{' '}\n          {PROMOTION_REQUIREMENTS.inboxCorrect} correct Inbox Zero decisions, and at least{' '}\n          {PROMOTION_REQUIREMENTS.elevatorCorrect} cleared elevator obstacles.`,
  'promotion requirement copy',
);

const debugPattern = /      <button\n        className="debug-trigger"[\s\S]*?      <\/button>\n\n      \{debugOpen && \(/;
if (!debugPattern.test(app)) {
  throw new Error('Could not find developer control block');
}
app = app.replace(
  debugPattern,
  `      {devMode && (\n        <button\n          className="debug-trigger"\n          aria-label="Open developer controls"\n          onClick={() => setDebugOpen((open) => !open)}\n        >\n          DEV\n        </button>\n      )}\n\n      {devMode && debugOpen && (`,
);

styles = styles.replace(/^@import url\([^\n]+\);\n\n/, '');
styles = replaceOnce(
  styles,
  'grid-template-columns: auto repeat(3, minmax(70px, auto)) minmax(180px, 1fr);',
  'grid-template-columns: auto repeat(4, minmax(70px, auto)) minmax(180px, 1fr);',
  'desktop HUD columns',
);

writeFileSync(appPath, app);
writeFileSync(stylesPath, styles);
console.log('WRS Quest foundation hardening applied.');
