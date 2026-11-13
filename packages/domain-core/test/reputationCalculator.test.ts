import { describe, it, expect } from 'vitest';
import { calculateNewReputation } from '../src/business/reputationCalculator';

describe('reputationCalculator', () => {
  it('tăng sao khi hoàn thành sửa chữa nhanh (+0.1)', () => {
    const stars = calculateNewReputation(4.5, 'FAST_MAINTENANCE');
    expect(stars).toBe(4.6);
  });

  it('tăng sao khi duyệt bill kịp thời (+0.05)', () => {
    const stars = calculateNewReputation(4.8, 'PROMPT_BILLING_VERIFY');
    expect(stars).toBe(4.85);
  });

  it('trừ sao khi chậm trễ sửa chữa (-0.2)', () => {
    const stars = calculateNewReputation(4.0, 'OVERDUE_MAINTENANCE');
    expect(stars).toBe(3.8);
  });

  it('trừ sao khi có tranh chấp hóa đơn (-0.3)', () => {
    const stars = calculateNewReputation(3.5, 'BILLING_DISPUTE');
    expect(stars).toBe(3.2);
  });

  it('chặn trần tối đa 5.0 sao', () => {
    const stars = calculateNewReputation(4.95, 'TENANT_COMPLIMENT');
    expect(stars).toBe(5.0);
  });

  it('chặn sàn tối thiểu 1.0 sao', () => {
    const stars = calculateNewReputation(1.1, 'BILLING_DISPUTE');
    expect(stars).toBe(1.0);
  });
});
