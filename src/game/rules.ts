export interface PerformanceSnapshot {
  xp: number;
  trust: number;
  inboxCorrect: number;
  inboxErrors: number;
  elevatorCorrect: number;
  elevatorErrors: number;
}

export const PROMOTION_REQUIREMENTS = {
  xp: 78,
  trust: 0,
  inboxCorrect: 5,
  elevatorCorrect: 2,
} as const;

export function calculatePerformanceScore(run: PerformanceSnapshot) {
  return (
    run.xp +
    run.trust * 8 +
    run.inboxCorrect * 7 +
    run.elevatorCorrect * 12 -
    run.inboxErrors * 4 -
    run.elevatorErrors * 6
  );
}

export function isPromoted(run: PerformanceSnapshot) {
  return (
    run.xp >= PROMOTION_REQUIREMENTS.xp &&
    run.trust >= PROMOTION_REQUIREMENTS.trust &&
    run.inboxCorrect >= PROMOTION_REQUIREMENTS.inboxCorrect &&
    run.elevatorCorrect >= PROMOTION_REQUIREMENTS.elevatorCorrect
  );
}

export function calculateStars(score: number) {
  if (score >= 300) return 3;
  if (score >= 180) return 2;
  return 1;
}
