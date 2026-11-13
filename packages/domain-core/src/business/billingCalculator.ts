import type { WaterCalcMethod } from '@qlnt/shared-types';

export interface BillingCalculationInput {
  roomRent: number;
  oldElectric: number;
  newElectric: number;
  electricUnitPrice: number;
  waterCalcMethod: WaterCalcMethod;
  waterUnitPrice: number;
  oldWater?: number;
  newWater?: number;
  tenantCount?: number;
  serviceCharge?: number;
  vehicleCharge?: number;
  previousDebt?: number;
}

export interface BillingCalculationResult {
  roomCharge: number;
  electricConsumed: number;
  electricCharge: number;
  waterConsumed: number;
  waterCharge: number;
  serviceCharge: number;
  vehicleCharge: number;
  previousDebt: number;
  totalAmount: number;
}

export function calculateBilling(input: BillingCalculationInput): BillingCalculationResult {
  const roomCharge = Math.max(0, input.roomRent);

  // Điện: công tơ mới - cũ (tối thiểu 0)
  const electricConsumed = Math.max(0, input.newElectric - input.oldElectric);
  const electricCharge = electricConsumed * Math.max(0, input.electricUnitPrice);

  // Nước: theo m³ (PER_M3) hoặc theo người (PER_PERSON theo REF-MKT-002)
  let waterConsumed = 0;
  let waterCharge = 0;

  if (input.waterCalcMethod === 'PER_PERSON') {
    const people = Math.max(0, input.tenantCount ?? 1);
    waterConsumed = 0;
    waterCharge = people * Math.max(0, input.waterUnitPrice);
  } else {
    const oldW = input.oldWater ?? 0;
    const newW = input.newWater ?? 0;
    waterConsumed = Math.max(0, newW - oldW);
    waterCharge = waterConsumed * Math.max(0, input.waterUnitPrice);
  }

  const serviceCharge = Math.max(0, input.serviceCharge ?? 0);
  const vehicleCharge = Math.max(0, input.vehicleCharge ?? 0);
  const previousDebt = input.previousDebt ?? 0;

  const totalAmount =
    roomCharge + electricCharge + waterCharge + serviceCharge + vehicleCharge + previousDebt;

  return {
    roomCharge,
    electricConsumed,
    electricCharge,
    waterConsumed,
    waterCharge,
    serviceCharge,
    vehicleCharge,
    previousDebt,
    totalAmount,
  };
}
