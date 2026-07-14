import { describe, expect, it } from 'vitest';
import {
  calculatePerformanceScore,
  calculateStars,
  isPromoted,
  PROMOTION_REQUIREMENTS,
  type PerformanceSnapshot,
} from './rules';

const passingRun: PerformanceSnapshot = {
  xp: PROMOTION_REQUIREMENTS.xp,
  trust: PROMOTION_REQUIREMENTS.trust,
  inboxCorrect: PROMOTION_REQUIREMENTS.inboxCorrect,
  inboxErrors: 3,
  elevatorCorrect: PROMOTION_REQUIREMENTS.elevatorCorrect,
  elevatorErrors: 2,
};

describe('promotion rules', () => {
  it('requires performance across decisions, Inbox Zero, and Elevator Escape', () => {
    expect(isPromoted(passingRun)).toBe(true);
  });

  it.each([
    ['XP', { ...passingRun, xp: PROMOTION_REQUIREMENTS.xp - 1 }],
    ['Trust', { ...passingRun, trust: PROMOTION_REQUIREMENTS.trust - 1 }],
    ['Inbox Zero', { ...passingRun, inboxCorrect: PROMOTION_REQUIREMENTS.inboxCorrect - 1 }],
    ['Elevator Escape', { ...passingRun, elevatorCorrect: PROMOTION_REQUIREMENTS.elevatorCorrect - 1 }],
  ])('blocks promotion when %s mastery is missing', (_label, run) => {
    expect(isPromoted(run)).toBe(false);
  });
});

describe('performance scoring', () => {
  it('rewards accuracy and penalizes mistakes', () => {
    expect(calculatePerformanceScore(passingRun)).toBe(125);
  });

  it('reserves three stars for an excellent run', () => {
    expect(calculateStars(179)).toBe(1);
    expect(calculateStars(180)).toBe(2);
    expect(calculateStars(299)).toBe(2);
    expect(calculateStars(300)).toBe(3);
  });
});
