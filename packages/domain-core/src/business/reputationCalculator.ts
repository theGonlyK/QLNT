export type ReputationEvent =
  | 'FAST_MAINTENANCE'
  | 'PROMPT_BILLING_VERIFY'
  | 'OVERDUE_MAINTENANCE'
  | 'BILLING_DISPUTE'
  | 'TENANT_COMPLIMENT'
  | 'TENANT_COMPLAINT';

export const REPUTATION_DELTAS: Record<ReputationEvent, number> = {
  FAST_MAINTENANCE: 0.1,
  PROMPT_BILLING_VERIFY: 0.05,
  TENANT_COMPLIMENT: 0.2,
  OVERDUE_MAINTENANCE: -0.2,
  BILLING_DISPUTE: -0.3,
  TENANT_COMPLAINT: -0.25,
};

export function calculateNewReputation(
  currentStars: number,
  eventOrDelta: ReputationEvent | number
): number {
  const delta = typeof eventOrDelta === 'number' ? eventOrDelta : REPUTATION_DELTAS[eventOrDelta];
  const newRating = currentStars + delta;
  // Giới hạn trong khoảng 1.0 đến 5.0
  const clamped = Math.min(5.0, Math.max(1.0, newRating));
  return Math.round(clamped * 100) / 100;
}
