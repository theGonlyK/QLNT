import { describe, it, expect } from 'vitest';
import { calculateBilling } from '../src/business/billingCalculator';

describe('billingCalculator', () => {
  it('tính toán tiền điện và tiền nước theo số khối (PER_M3) chính xác', () => {
    const result = calculateBilling({
      roomRent: 3000000,
      oldElectric: 100,
      newElectric: 150, // tiêu thụ 50 kWh
      electricUnitPrice: 4000, // 50 * 4000 = 200,000đ
      waterCalcMethod: 'PER_M3',
      waterUnitPrice: 30000,
      oldWater: 10,
      newWater: 15, // tiêu thụ 5 m3 -> 5 * 30000 = 150,000đ
      serviceCharge: 100000,
      vehicleCharge: 100000,
      previousDebt: 50000,
    });

    expect(result.roomCharge).toBe(3000000);
    expect(result.electricConsumed).toBe(50);
    expect(result.electricCharge).toBe(200000);
    expect(result.waterConsumed).toBe(5);
    expect(result.waterCharge).toBe(150000);
    expect(result.serviceCharge).toBe(100000);
    expect(result.vehicleCharge).toBe(100000);
    expect(result.previousDebt).toBe(50000);
    expect(result.totalAmount).toBe(3000000 + 200000 + 150000 + 100000 + 100000 + 50000);
  });

  it('tính toán tiền nước theo khoán đầu người (PER_PERSON) theo REF-MKT-002', () => {
    const result = calculateBilling({
      roomRent: 2500000,
      oldElectric: 200,
      newElectric: 220, // tiêu thụ 20 kWh
      electricUnitPrice: 3500, // 20 * 3500 = 70,000đ
      waterCalcMethod: 'PER_PERSON',
      waterUnitPrice: 100000, // 100k/người
      tenantCount: 2, // 2 * 100k = 200,000đ
      serviceCharge: 50000,
    });

    expect(result.roomCharge).toBe(2500000);
    expect(result.electricConsumed).toBe(20);
    expect(result.electricCharge).toBe(70000);
    expect(result.waterConsumed).toBe(0);
    expect(result.waterCharge).toBe(200000);
    expect(result.serviceCharge).toBe(50000);
    expect(result.totalAmount).toBe(2500000 + 70000 + 200000 + 50000);
  });

  it('xử lý công tơ không biến động (chỉ số mới bằng cũ) và nợ âm (thừa tiền)', () => {
    const result = calculateBilling({
      roomRent: 4000000,
      oldElectric: 500,
      newElectric: 500,
      electricUnitPrice: 4000,
      waterCalcMethod: 'PER_M3',
      waterUnitPrice: 30000,
      oldWater: 20,
      newWater: 20,
      previousDebt: -100000, // Khách dư 100k từ tháng trước
    });

    expect(result.electricConsumed).toBe(0);
    expect(result.electricCharge).toBe(0);
    expect(result.waterConsumed).toBe(0);
    expect(result.waterCharge).toBe(0);
    expect(result.previousDebt).toBe(-100000);
    expect(result.totalAmount).toBe(3900000);
  });
});
