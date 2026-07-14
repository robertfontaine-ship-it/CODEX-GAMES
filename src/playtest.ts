type TrackedScreen =
  | 'title'
  | 'briefing'
  | 'encounter'
  | 'outcome'
  | 'inbox'
  | 'elevator'
  | 'review'
  | 'info';

interface ScreenTiming {
  screen: TrackedScreen;
  enteredAt: number;
  durationMs: number;
}

interface InteractionEvent {
  at: number;
  screen: TrackedScreen;
  action: string;
  result?: 'success' | 'failure';
}

interface PlaytestFeedback {
  fun: number | null;
  clarity: number | null;
  pace: number | null;
  consequences: 'yes' | 'no' | 'unsure' | null;
  comment: string;
}

interface PlaytestSession {
  version: 1;
  id: string;
  startedAt: string;
  finishedAt?: string;
  elapsedMs: number;
  promoted?: boolean;
  screens: ScreenTiming[];
  interactions: InteractionEvent[];
  feedback: PlaytestFeedback;
  viewport: {
    width: number;
    height: number;
    userAgent: string;
  };
}

const STORAGE_KEY = 'wrs-quest-playtest-sessions';
const ACTIVE_KEY = 'wrs-quest-active-playtest';

let activeSession: PlaytestSession | null = null;
let currentScreen: TrackedScreen = 'title';
let currentScreenEnteredAt = Date.now();
let observer: MutationObserver | null = null;
let scanQueued = false;
let lastClickedAction: InteractionEvent | null = null;

function isPlaytestMode() {
  const params = new URLSearchParams(window.location.search);
  return params.has('playtest') || localStorage.getItem('wrs-quest-playtest-mode') === 'true';
}

function sessionId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `playtest-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function createSession(): PlaytestSession {
  return {
    version: 1,
    id: sessionId(),
    startedAt: new Date().toISOString(),
    elapsedMs: 0,
    screens: [],
    interactions: [],
    feedback: {
      fun: null,
      clarity: null,
      pace: null,
      consequences: null,
      comment: '',
    },
    viewport: {
      width: window.innerWidth,
      height: window.innerHeight,
      userAgent: navigator.userAgent,
    },
  };
}

function loadActiveSession() {
  try {
    const raw = localStorage.getItem(ACTIVE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PlaytestSession;
    return parsed.version === 1 ? parsed : null;
  } catch {
    return null;
  }
}

function saveActiveSession() {
  if (!activeSession) return;
  activeSession.elapsedMs = Date.now() - Date.parse(activeSession.startedAt);
  localStorage.setItem(ACTIVE_KEY, JSON.stringify(activeSession));
}

function archiveSession() {
  if (!activeSession) return;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const sessions = raw ? (JSON.parse(raw) as PlaytestSession[]) : [];
    const next = [activeSession, ...sessions.filter((item) => item.id !== activeSession?.id)].slice(
      0,
      20,
    );
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([activeSession]));
  }
  localStorage.removeItem(ACTIVE_KEY);
}

function detectScreen(): TrackedScreen {
  if (document.querySelector('.title-screen')) return 'title';
  if (document.querySelector('.briefing-screen')) return 'briefing';
  if (document.querySelector('.encounter-screen')) return 'encounter';
  if (document.querySelector('.outcome-screen')) return 'outcome';
  if (document.querySelector('.challenge-screen')) return 'inbox';
  if (document.querySelector('.elevator-screen')) return 'elevator';
  if (document.querySelector('.review-screen')) return 'review';
  return 'info';
}

function closeCurrentScreenTiming(nextScreen: TrackedScreen) {
  if (!activeSession || nextScreen === currentScreen) return;
  activeSession.screens.push({
    screen: currentScreen,
    enteredAt: currentScreenEnteredAt,
    durationMs: Date.now() - currentScreenEnteredAt,
  });
  currentScreen = nextScreen;
  currentScreenEnteredAt = Date.now();
  saveActiveSession();
}

function addBadge() {
  if (document.querySelector('.playtest-mode-badge')) return;
  const badge = document.createElement('div');
  badge.className = 'playtest-mode-badge';
  badge.textContent = 'PLAYTEST MODE';
  badge.setAttribute('aria-hidden', 'true');
  document.body.append(badge);
}

function normalizeAction(button: HTMLButtonElement) {
  const choice = button.querySelector('strong')?.textContent?.trim();
  return choice || button.textContent?.replace(/\s+/g, ' ').trim() || 'Unknown action';
}

function onClick(event: MouseEvent) {
  if (!activeSession) return;
  const target = event.target;
  if (!(target instanceof Element)) return;
  const button = target.closest('button');
  if (!(button instanceof HTMLButtonElement) || button.disabled) return;

  const action = normalizeAction(button);
  const interaction: InteractionEvent = {
    at: Date.now(),
    screen: detectScreen(),
    action,
  };
  activeSession.interactions.push(interaction);
  lastClickedAction = interaction;

  if (action.toUpperCase().includes('NEW SHIFT')) {
    activeSession = createSession();
    currentScreen = 'title';
    currentScreenEnteredAt = Date.now();
  }

  saveActiveSession();
}

function processFeedbackCard() {
  const card = document.querySelector<HTMLElement>('.feedback-card');
  if (!card || card.dataset.playtestLogged === 'true' || !activeSession) return;
  card.dataset.playtestLogged = 'true';

  const result = card.classList.contains('success') ? 'success' : 'failure';
  if (lastClickedAction) lastClickedAction.result = result;
  saveActiveSession();
}

function ratingField(label: string, key: 'fun' | 'clarity' | 'pace') {
  const wrapper = document.createElement('fieldset');
  wrapper.className = 'playtest-rating';
  wrapper.innerHTML = `<legend>${label}</legend><div></div>`;
  const row = wrapper.querySelector('div')!;

  for (let rating = 1; rating <= 5; rating += 1) {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = String(rating);
    button.dataset.ratingKey = key;
    button.dataset.ratingValue = String(rating);
    button.setAttribute('aria-label', `${label}: ${rating} out of 5`);
    row.append(button);
  }
  return wrapper;
}

function reportText(session: PlaytestSession) {
  const failures = session.interactions.filter((event) => event.result === 'failure').length;
  const decisions = session.interactions.filter((event) =>
    ['encounter', 'inbox', 'elevator'].includes(event.screen),
  ).length;
  const seconds = Math.round(session.elapsedMs / 1000);

  return [
    `WRS Quest Floor 1 Playtest`,
    `Session: ${session.id}`,
    `Duration: ${seconds}s`,
    `Promoted: ${session.promoted ? 'Yes' : 'No'}`,
    `Tracked decisions: ${decisions}`,
    `Recorded failures: ${failures}`,
    `Fun: ${session.feedback.fun ?? 'Not rated'}/5`,
    `Clarity: ${session.feedback.clarity ?? 'Not rated'}/5`,
    `Pace: ${session.feedback.pace ?? 'Not rated'}/5`,
    `Consequences felt meaningful: ${session.feedback.consequences ?? 'Not rated'}`,
    `Comment: ${session.feedback.comment || 'None'}`,
  ].join('\n');
}

function downloadReport(session: PlaytestSession) {
  const blob = new Blob([JSON.stringify(session, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `wrs-quest-playtest-${session.id}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

async function copyReport(session: PlaytestSession, button: HTMLButtonElement) {
  const text = reportText(session);
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.append(textarea);
    textarea.select();
    document.execCommand('copy');
    textarea.remove();
  }
  const original = button.textContent;
  button.textContent = 'COPIED';
  window.setTimeout(() => {
    button.textContent = original;
  }, 1200);
}

function syncRatingButtons(panel: HTMLElement) {
  if (!activeSession) return;
  panel.querySelectorAll<HTMLButtonElement>('[data-rating-key]').forEach((button) => {
    const key = button.dataset.ratingKey as 'fun' | 'clarity' | 'pace';
    const value = Number(button.dataset.ratingValue);
    button.classList.toggle('selected', activeSession?.feedback[key] === value);
  });

  panel.querySelectorAll<HTMLButtonElement>('[data-consequence]').forEach((button) => {
    button.classList.toggle(
      'selected',
      activeSession?.feedback.consequences === button.dataset.consequence,
    );
  });
}

function buildPlaytestPanel() {
  const review = document.querySelector<HTMLElement>('.review-screen');
  if (!review || review.querySelector('.playtest-lab') || !activeSession) return;

  closeCurrentScreenTiming('review');
  activeSession.finishedAt = new Date().toISOString();
  activeSession.promoted = review.textContent?.includes('PROMOTION EARNED') ?? false;
  saveActiveSession();

  const panel = document.createElement('section');
  panel.className = 'playtest-lab';
  panel.innerHTML = `
    <div class="playtest-heading">
      <div>
        <small>ALPHA TESTING</small>
        <h2>Playtest Lab</h2>
      </div>
      <span>LOCAL DATA ONLY</span>
    </div>
    <p class="playtest-intro">Rate the experience while it is fresh. This report stays on this device unless you copy or export it.</p>
  `;

  panel.append(ratingField('How fun was the shift?', 'fun'));
  panel.append(ratingField('How clear were the choices?', 'clarity'));
  panel.append(ratingField('How was the pacing?', 'pace'));

  const consequenceField = document.createElement('fieldset');
  consequenceField.className = 'playtest-consequences';
  consequenceField.innerHTML = `
    <legend>Did earlier choices noticeably change later gameplay?</legend>
    <div>
      <button type="button" data-consequence="yes">YES</button>
      <button type="button" data-consequence="no">NO</button>
      <button type="button" data-consequence="unsure">NOT SURE</button>
    </div>
  `;
  panel.append(consequenceField);

  const commentLabel = document.createElement('label');
  commentLabel.className = 'playtest-comment';
  commentLabel.innerHTML = `
    <span>What was the best, weakest, or most confusing part?</span>
    <textarea maxlength="600" rows="4" placeholder="Optional playtest note"></textarea>
  `;
  panel.append(commentLabel);

  const summary = document.createElement('div');
  summary.className = 'playtest-summary';
  panel.append(summary);

  const actions = document.createElement('div');
  actions.className = 'playtest-actions';
  actions.innerHTML = `
    <button type="button" data-playtest-action="save">SAVE FEEDBACK</button>
    <button type="button" data-playtest-action="copy">COPY SUMMARY</button>
    <button type="button" data-playtest-action="export">EXPORT JSON</button>
  `;
  panel.append(actions);

  const updateSummary = () => {
    if (!activeSession) return;
    const seconds = Math.round(activeSession.elapsedMs / 1000);
    const failures = activeSession.interactions.filter((event) => event.result === 'failure').length;
    summary.textContent = `${seconds}s session • ${failures} recorded mistakes • ${activeSession.promoted ? 'Promoted' : 'Not promoted'}`;
  };

  panel.addEventListener('click', (event) => {
    if (!activeSession) return;
    const target = event.target;
    if (!(target instanceof HTMLButtonElement)) return;

    if (target.dataset.ratingKey) {
      const key = target.dataset.ratingKey as 'fun' | 'clarity' | 'pace';
      activeSession.feedback[key] = Number(target.dataset.ratingValue);
      syncRatingButtons(panel);
      saveActiveSession();
      return;
    }

    if (target.dataset.consequence) {
      activeSession.feedback.consequences = target.dataset.consequence as 'yes' | 'no' | 'unsure';
      syncRatingButtons(panel);
      saveActiveSession();
      return;
    }

    const action = target.dataset.playtestAction;
    const textarea = panel.querySelector<HTMLTextAreaElement>('textarea');
    activeSession.feedback.comment = textarea?.value.trim() ?? '';
    activeSession.elapsedMs = Date.now() - Date.parse(activeSession.startedAt);

    if (action === 'copy') void copyReport(activeSession, target);
    if (action === 'export') downloadReport(activeSession);
    if (action === 'save') {
      archiveSession();
      target.textContent = 'SAVED LOCALLY';
      target.disabled = true;
    }
    updateSummary();
  });

  const textarea = panel.querySelector<HTMLTextAreaElement>('textarea');
  textarea?.addEventListener('input', () => {
    if (!activeSession) return;
    activeSession.feedback.comment = textarea.value;
    saveActiveSession();
  });

  review.querySelector('.decision-log')?.insertAdjacentElement('afterend', panel);
  if (!panel.isConnected) review.append(panel);
  syncRatingButtons(panel);
  updateSummary();
}

function scan() {
  scanQueued = false;
  addBadge();
  const nextScreen = detectScreen();
  closeCurrentScreenTiming(nextScreen);
  processFeedbackCard();
  buildPlaytestPanel();
}

function queueScan() {
  if (scanQueued) return;
  scanQueued = true;
  requestAnimationFrame(scan);
}

export function installPlaytestIntelligence() {
  if (!isPlaytestMode() || observer) return;

  activeSession = loadActiveSession() ?? createSession();
  currentScreen = detectScreen();
  currentScreenEnteredAt = Date.now();
  saveActiveSession();

  document.addEventListener('click', onClick, true);
  observer = new MutationObserver(queueScan);
  observer.observe(document.body, { childList: true, subtree: true, characterData: true });
  window.addEventListener('beforeunload', saveActiveSession);
  queueScan();
}
