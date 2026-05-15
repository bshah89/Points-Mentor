import type { BenefitState, BenefitUtilisation, UserCard } from '../types';

/**
 * Compute the period key for a benefit based on its reset type.
 * - monthly: '2026-05'
 * - half_yearly: '2026-H1' or '2026-H2'
 * - annual: '2026'
 * - none: 'permanent'
 */
export function getPeriodKey(resetType: string, date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;

  switch (resetType) {
    case 'monthly':
      return `${year}-${String(month).padStart(2, '0')}`;
    case 'half_yearly':
      return month <= 6 ? `${year}-H1` : `${year}-H2`;
    case 'annual':
      return String(year);
    default:
      return 'permanent';
  }
}

/**
 * Calculate the next reset date for a benefit.
 */
export function getNextResetDate(resetType: string, date: Date = new Date()): Date {
  const now = new Date(date);

  switch (resetType) {
    case 'monthly': {
      const next = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      return next;
    }
    case 'half_yearly': {
      const month = now.getMonth() + 1;
      if (month <= 6) {
        return new Date(now.getFullYear(), 5, 30, 23, 59, 59); // June 30
      }
      return new Date(now.getFullYear(), 11, 31, 23, 59, 59); // Dec 31
    }
    case 'annual': {
      return new Date(now.getFullYear(), 11, 31, 23, 59, 59); // Dec 31
    }
    default:
      return new Date(now.getFullYear() + 10, 0, 1);
  }
}

/**
 * Compute urgency level based on days until reset.
 */
export function getUrgency(daysUntilReset: number, resetType: string): 'green' | 'amber' | 'red' {
  if (resetType === 'none') return 'green';
  if (daysUntilReset <= 7) return 'red';
  if (daysUntilReset <= 14) return 'amber';
  return 'green';
}

/**
 * Compute benefit states for all user cards and their benefits.
 */
export function computeBenefitStates(
  userCards: UserCard[],
  utilisations: BenefitUtilisation[],
  now: Date = new Date()
): BenefitState[] {
  const states: BenefitState[] = [];

  for (const uc of userCards) {
    const card = uc.definition;
    if (!card || !uc.is_active) continue;

    for (const benefit of card.benefits) {
      if (benefit.is_perk || benefit.value_gbp === 0) continue;

      const periodKey = getPeriodKey(benefit.reset_type, now);
      const resetDate = getNextResetDate(benefit.reset_type, now);
      const daysUntilReset = Math.ceil(
        (resetDate.getTime() - now.getTime()) / 86400000
      );

      const util = utilisations.find(
        (u) => u.user_card_id === uc.id && u.benefit_id === benefit.id && u.period_key === periodKey
      );

      const usedGbp = util?.used_gbp ?? 0;
      const remainingGbp = Math.max(0, benefit.value_gbp - usedGbp);

      states.push({
        benefit,
        userCardId: uc.id,
        cardName: card.name,
        periodKey,
        usedGbp,
        remainingGbp,
        daysUntilReset,
        urgency: getUrgency(daysUntilReset, benefit.reset_type),
        resetDate,
      });
    }
  }

  return states;
}

/**
 * Total annual value of all benefits for a card (used in ROI calculation).
 */
export function totalAnnualBenefitValue(userCard: UserCard): number {
  const card = userCard.definition;
  if (!card) return 0;

  let total = 0;
  for (const b of card.benefits) {
    if (b.is_perk) continue;
    if (b.reset_type === 'monthly') {
      total += b.value_gbp * 12;
    } else if (b.reset_type === 'half_yearly') {
      total += b.value_gbp * 2;
    } else {
      total += b.value_gbp;
    }
  }
  return total;
}

/**
 * Annual fee ROI: returns net value (benefits - fee) and whether card is worth keeping.
 */
export function calculateROI(userCard: UserCard): {
  annualFee: number;
  benefitValue: number;
  netValue: number;
  isWorthKeeping: boolean;
  breakEvenSpend?: number;
} {
  const card = userCard.definition;
  if (!card) {
    return { annualFee: 0, benefitValue: 0, netValue: 0, isWorthKeeping: false };
  }

  const annualFee = card.annual_fee_gbp;
  const benefitValue = totalAnnualBenefitValue(userCard);
  const netValue = benefitValue - annualFee;

  // Estimate break-even spend (points value at ~1p per point)
  const earnRate = card.earn_rates.find((r) => r.category === 'default')?.rate ?? 0;
  const breakEvenSpend = earnRate > 0 ? (annualFee / (earnRate * 0.01)) : undefined;

  return {
    annualFee,
    benefitValue,
    netValue,
    isWorthKeeping: netValue >= 0,
    breakEvenSpend,
  };
}
