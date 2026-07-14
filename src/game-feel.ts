type GameScreen =
  | 'title'
  | 'briefing'
  | 'encounter'
  | 'outcome'
  | 'inbox'
  | 'elevator'
  | 'review'
  | 'info';

type SoundCue = 'tap' | 'confirm' | 'success' | 'failure' | 'promotion' | 'alarm';

const screenMessages: Record<GameScreen, string> = {
  title: 'OMNICORP EMERGENCY NETWORK // SHIFT ACCESS AVAILABLE',
  briefing: 'ALERT // FLOOR 1 LOCKDOWN // INTERN ORIENTATION COMPROMISED',
  encounter: 'LIVE DECISION // YOUR RESPONSE WILL ALTER THE SHIFT',
  outcome: 'CONSEQUENCE LOGGED // REPUTATION MODEL UPDATED',
  inbox: 'INBOX ZERO // TRIAGE VERIFIED MESSAGES BEFORE SYSTEM FAILURE',
  elevator: 'PROMOTION GATE // REACH THE ELEVATOR BEFORE LOCKDOWN',
  review: 'PERFORMANCE REVIEW // PROMOTION BOARD CALCULATING RESULTS',
  info: 'OMNICORP FIELD MANUAL // AUTHORIZED PERSONNEL ONLY',
};

let audioContext: AudioContext | null = null;
let lastScreen: GameScreen | null = null;
let observer: MutationObserver | null = null;
let scanQueued = false;

function soundEnabled() {
  try {
    const raw = localStorage.getItem('wrs-quest-settings');
    if (!raw) return true;
    const settings = JSON.parse(raw) as { sound?: boolean };
    return settings.sound !== false;
  } catch {
    return true;
  }
}

function getAudioContext() {
  if (!soundEnabled()) return null;
  const AudioContextConstructor =
    window.AudioContext ||
    (window as typeof window & { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!AudioContextConstructor) return null;
  audioContext ??= new AudioContextConstructor();
  if (audioContext.state === 'suspended') void audioContext.resume();
  return audioContext;
}

function tone(
  frequency: number,
  duration: number,
  gainValue: number,
  type: OscillatorType = 'square',
  delay = 0,
) {
  const context = getAudioContext();
  if (!context) return;

  const oscillator = context.createOscillator();
  const gain = context.createGain();
  const start = context.currentTime + delay;
  const end = start + duration;

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, start);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(gainValue, start + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, end);

  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start(start);
  oscillator.stop(end + 0.02);
}

function playSound(cue: SoundCue) {
  if (!soundEnabled()) return;

  if (cue === 'tap') {
    tone(210, 0.06, 0.035, 'square');
  } else if (cue === 'confirm') {
    tone(270, 0.08, 0.04, 'square');
    tone(410, 0.11, 0.035, 'triangle', 0.06);
  } else if (cue === 'success') {
    tone(330, 0.09, 0.045, 'triangle');
    tone(495, 0.11, 0.045, 'triangle', 0.07);
    tone(660, 0.14, 0.04, 'triangle', 0.14);
  } else if (cue === 'failure') {
    tone(180, 0.12, 0.05, 'sawtooth');
    tone(122, 0.18, 0.04, 'sawtooth', 0.08);
  } else if (cue === 'promotion') {
    [262, 330, 392, 523].forEach((frequency, index) =>
      tone(frequency, 0.18, 0.045, 'triangle', index * 0.1),
    );
  } else {
    tone(155, 0.15, 0.025, 'sine');
    tone(155, 0.15, 0.025, 'sine', 0.32);
  }
}

function detectScreen(): GameScreen {
  if (document.querySelector('.title-screen')) return 'title';
  if (document.querySelector('.briefing-screen')) return 'briefing';
  if (document.querySelector('.encounter-screen')) return 'encounter';
  if (document.querySelector('.outcome-screen')) return 'outcome';
  if (document.querySelector('.challenge-screen')) return 'inbox';
  if (document.querySelector('.elevator-screen')) return 'elevator';
  if (document.querySelector('.review-screen')) return 'review';
  return 'info';
}

function ensureAtmosphere() {
  const shell = document.querySelector('.app-shell');
  if (!shell || shell.querySelector('.world-atmosphere')) return;

  const atmosphere = document.createElement('div');
  atmosphere.className = 'world-atmosphere';
  atmosphere.setAttribute('aria-hidden', 'true');
  atmosphere.innerHTML = `
    <div class="alarm-beacon"><i></i></div>
    <div class="office-haze"></div>
    <div class="distant-workers"><i></i><i></i><i></i></div>
    <div class="energy-particles"></div>
  `;
  shell.prepend(atmosphere);

  const impactLayer = document.createElement('div');
  impactLayer.className = 'game-impact-layer';
  impactLayer.setAttribute('aria-hidden', 'true');
  shell.append(impactLayer);

  const ticker = document.createElement('div');
  ticker.className = 'comms-ticker';
  ticker.setAttribute('aria-hidden', 'true');
  ticker.innerHTML = '<strong>LIVE</strong><span></span>';
  shell.append(ticker);
}

function updateTicker(screen: GameScreen) {
  const ticker = document.querySelector<HTMLElement>('.comms-ticker span');
  if (ticker) ticker.textContent = screenMessages[screen];
}

function updateRankMeter() {
  const hud = document.querySelector<HTMLElement>('.status-hud');
  if (!hud) return;

  let meter = hud.querySelector<HTMLElement>('.rank-progress');
  if (!meter) {
    meter = document.createElement('div');
    meter.className = 'rank-progress';
    meter.innerHTML = `
      <span class="rank-label">INTERN</span>
      <i><b></b></i>
      <span class="rank-label next">JUNIOR ASSOCIATE</span>
    `;
    hud.append(meter);
  }

  const stats = Array.from(hud.querySelectorAll<HTMLElement>('.hud-stat'));
  const xpStat = stats.find((stat) => stat.querySelector('small')?.textContent?.trim() === 'XP');
  const xp = Number(xpStat?.querySelector('strong')?.textContent ?? 0);
  const percent = Math.min(100, Math.max(0, (xp / 78) * 100));
  meter.style.setProperty('--rank-progress', `${percent}%`);
  meter.classList.toggle('ready', percent >= 100);
}

function enhanceCharacter() {
  const screen = document.querySelector<HTMLElement>('.encounter-screen');
  const portrait = screen?.querySelector<HTMLElement>('.character-portrait');
  const speaker = screen?.querySelector('h1')?.textContent?.trim();
  if (!portrait || !speaker) return;

  const slug = speaker.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  portrait.dataset.character = slug;
  if (!portrait.querySelector('.portrait-body')) {
    portrait.insertAdjacentHTML(
      'beforeend',
      '<i class="portrait-body"></i><i class="portrait-badge"></i><i class="portrait-scan"></i>',
    );
  }
}

function animatePanel(screen: GameScreen) {
  const panel = document.querySelector<HTMLElement>('.game-frame > .panel');
  if (!panel) return;
  panel.classList.remove('feel-enter');
  void panel.offsetWidth;
  panel.classList.add('feel-enter');
  panel.dataset.gameScreen = screen;
}

function showOutcomeImpact() {
  const outcome = document.querySelector<HTMLElement>('.outcome-screen');
  const layer = document.querySelector<HTMLElement>('.game-impact-layer');
  if (!outcome || !layer || outcome.dataset.feelProcessed === 'true') return;

  outcome.dataset.feelProcessed = 'true';
  const effects = Array.from(outcome.querySelectorAll<HTMLElement>('.effect-row span'));
  layer.innerHTML = '';
  effects.slice(0, 5).forEach((effect, index) => {
    const chip = document.createElement('span');
    const text = effect.textContent?.trim() ?? '';
    chip.textContent = text;
    chip.className = text.includes('-') ? 'impact-chip negative' : 'impact-chip positive';
    chip.style.setProperty('--impact-index', String(index));
    layer.append(chip);
  });
  layer.classList.add('active');
  window.setTimeout(() => layer.classList.remove('active'), 2200);
}

function processFeedback() {
  const feedback = document.querySelector<HTMLElement>('.feedback-card');
  if (!feedback || feedback.dataset.feelProcessed === 'true') return;
  feedback.dataset.feelProcessed = 'true';

  const success = feedback.classList.contains('success');
  document.body.classList.remove('impact-success', 'impact-failure');
  document.body.classList.add(success ? 'impact-success' : 'impact-failure');
  playSound(success ? 'success' : 'failure');
  window.setTimeout(
    () => document.body.classList.remove('impact-success', 'impact-failure'),
    550,
  );
}

function buildReviewCelebration() {
  const review = document.querySelector<HTMLElement>('.review-screen');
  if (!review || review.dataset.feelProcessed === 'true') return;
  review.dataset.feelProcessed = 'true';

  const promoted = review.textContent?.includes('PROMOTION EARNED') ?? false;
  const stamp = document.createElement('div');
  stamp.className = promoted ? 'review-stamp promoted' : 'review-stamp survived';
  stamp.textContent = promoted ? 'APPROVED' : 'REVIEW REQUIRED';
  review.append(stamp);

  if (promoted) {
    const celebration = document.createElement('div');
    celebration.className = 'promotion-confetti';
    celebration.setAttribute('aria-hidden', 'true');
    for (let index = 0; index < 28; index += 1) {
      const piece = document.createElement('i');
      piece.style.setProperty('--confetti-index', String(index));
      piece.style.setProperty('--confetti-left', `${(index * 37) % 100}%`);
      celebration.append(piece);
    }
    review.append(celebration);
    playSound('promotion');
  }
}

function applyScreenState() {
  scanQueued = false;
  ensureAtmosphere();

  const screen = detectScreen();
  document.body.dataset.gameScreen = screen;
  updateTicker(screen);
  updateRankMeter();
  enhanceCharacter();
  showOutcomeImpact();
  processFeedback();
  buildReviewCelebration();

  if (screen !== lastScreen) {
    animatePanel(screen);
    if (screen === 'briefing') playSound('alarm');
    lastScreen = screen;
  }
}

function queueScan() {
  if (scanQueued) return;
  scanQueued = true;
  window.requestAnimationFrame(applyScreenState);
}

function handleButtonClick(event: MouseEvent) {
  const target = event.target;
  if (!(target instanceof Element)) return;
  const button = target.closest('button');
  if (!button || button.disabled) return;

  button.classList.remove('button-impact');
  void button.offsetWidth;
  button.classList.add('button-impact');

  const label = button.textContent?.trim().toUpperCase() ?? '';
  const confirmationLabels = [
    'NEW SHIFT',
    'CLOCK IN',
    'CONTINUE SHIFT',
    'RUN TO ELEVATOR',
    'OPEN ELEVATOR',
    'REPLAY FLOOR',
  ];
  playSound(confirmationLabels.some((text) => label.includes(text)) ? 'confirm' : 'tap');
}

export function installGameFeel() {
  if (observer) return;

  document.addEventListener('click', handleButtonClick, true);
  observer = new MutationObserver(queueScan);
  observer.observe(document.body, { childList: true, subtree: true, characterData: true });
  queueScan();
}
