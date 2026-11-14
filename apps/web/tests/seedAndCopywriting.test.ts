import 'fake-indexeddb/auto';
import { describe, expect, it, afterEach } from 'vitest';
import { AppDatabase, calculateBilling } from '@qlnt/domain-core';
import {
  HANOI_MOTEL_SEED,
  SEED_MONTH_PERIOD,
  createHanoiMotelSeed,
  seedDatabaseIfNeeded,
} from '../src/seed/hanoiMotelSeed';
import { GAME_COPYWRITING, formatVndCurrency } from '../src/copywriting/gameCopywriting';

describe('hanoiMotelSeed', () => {
  const createdDbs: AppDatabase[] = [];

  afterEach(async () => {
    for (const testDb of createdDbs) {
      await testDb.delete();
    }
    createdDbs.length = 0;
  });

  it('contains 1 Hanoi property, 3 floors, and 12 rooms P101-P304', () => {
    expect(HANOI_MOTEL_SEED.property.name).toBe(
      'Nhà trọ Hạnh Phúc — Ngõ 133 Xuân Thủy, Cầu Giấy, Hà Nội'
    );
    expect(HANOI_MOTEL_SEED.property.total_floors).toBe(3);
    expect(HANOI_MOTEL_SEED.rooms).toHaveLength(12);

    const roomNumbers = HANOI_MOTEL_SEED.rooms.map((r) => r.room_number);
    expect(roomNumbers).toEqual([
      'P101',
      'P102',
      'P103',
      'P104',
      'P201',
      'P202',
      'P203',
      'P204',
      'P301',
      'P302',
      'P303',
      'P304',
    ]);

    for (const floor of [1, 2, 3]) {
      expect(HANOI_MOTEL_SEED.rooms.filter((r) => r.floor_number === floor)).toHaveLength(4);
    }
  });

  it('has realistic status distribution (8 RENTED, 2 MAINTENANCE, 1 DEPOSIT_LOCKED, 1 VACANT)', () => {
    const { rooms, billings, maintenanceRequests, devicesByRoomId, roomSemanticStateById } =
      HANOI_MOTEL_SEED;

    expect(rooms.filter((r) => r.status === 'RENTED')).toHaveLength(8);
    expect(rooms.filter((r) => r.status === 'MAINTENANCE')).toHaveLength(2);
    expect(rooms.filter((r) => r.status === 'EMPTY')).toHaveLength(2);

    expect(billings.filter((b) => b.status === 'UNPAID')).toHaveLength(3);
    expect(billings.filter((b) => b.status === 'PENDING_APPROVAL')).toHaveLength(2);
    expect(billings.filter((b) => b.status === 'PAID')).toHaveLength(3);

    const pendingBills = billings.filter((b) => b.status === 'PENDING_APPROVAL');
    for (const bill of pendingBills) {
      expect(bill.bill_image_url).toMatch(/^data:image\//);
    }

    expect(maintenanceRequests).toHaveLength(2);
    const brokenRooms = Object.values(devicesByRoomId).filter((devs) =>
      devs.some((d) => d.isBroken)
    );
    expect(brokenRooms).toHaveLength(2);

    const semantics = Object.values(roomSemanticStateById);
    expect(semantics.filter((s) => s === 'DEPOSIT_LOCKED')).toHaveLength(1);
    expect(semantics.filter((s) => s === 'VACANT')).toHaveLength(1);
  });

  it('computes every billing total using calculateBilling from @qlnt/domain-core', () => {
    const seed = createHanoiMotelSeed();
    const { property, rooms, meterReadings, billings } = seed;

    for (const billing of billings) {
      const room = rooms.find((r) => r.id === billing.room_id);
      const reading = meterReadings.find((m) => m.billing_id === billing.id);
      expect(room).toBeDefined();
      expect(reading).toBeDefined();

      const expected = calculateBilling({
        roomRent: room!.base_price,
        oldElectric: reading!.old_electric,
        newElectric: reading!.new_electric,
        electricUnitPrice: property.electric_unit_price,
        waterCalcMethod: property.water_calc_method,
        waterUnitPrice: property.water_unit_price,
        oldWater: reading!.old_water,
        newWater: reading!.new_water,
        serviceCharge: property.service_fee,
      });

      expect(billing.month_period).toBe(SEED_MONTH_PERIOD);
      expect(billing.room_charge).toBe(expected.roomCharge);
      expect(billing.electric_charge).toBe(expected.electricCharge);
      expect(billing.water_charge).toBe(expected.waterCharge);
      expect(billing.service_charge).toBe(expected.serviceCharge);
      expect(billing.total_amount).toBe(expected.totalAmount);
    }
  });

  it('seeds IndexedDB idempotently via seedDatabaseIfNeeded', async () => {
    const testDb = new AppDatabase(`qlnt_seed_test_${Date.now()}`);
    createdDbs.push(testDb);

    const firstRun = await seedDatabaseIfNeeded(testDb);
    expect(firstRun).toBe(true);
    expect(await testDb.properties.count()).toBe(1);
    expect(await testDb.rooms.count()).toBe(12);
    expect(await testDb.billings.count()).toBe(8);
    expect(await testDb.maintenance_requests.count()).toBe(2);

    const secondRun = await seedDatabaseIfNeeded(testDb);
    expect(secondRun).toBe(false);
    expect(await testDb.rooms.count()).toBe(12);
  });
});

describe('gameCopywriting', () => {
  it('formats VND currency and produces friendly Vietnamese game messages', () => {
    expect(formatVndCurrency(3850000)).toContain('3');

    const dueMsg = GAME_COPYWRITING.paymentDue('P101', 4250000, '2026-11');
    expect(dueMsg).toContain('P101');
    expect(dueMsg).toContain('tháng 11');
    expect(dueMsg).toContain('VietQR');

    const pendingMsg = GAME_COPYWRITING.billPending('P103');
    expect(pendingMsg).toContain('P103');
    expect(pendingMsg).toContain('1 chạm');

    const paidMsg = GAME_COPYWRITING.billPaid('P103', 2);
    expect(paidMsg).toContain('P103');
    expect(paidMsg).toContain('+2 điểm Sao Uy Tín');

    const brokenMsg = GAME_COPYWRITING.deviceBroken('P204', 'Điều hòa Inverter');
    expect(brokenMsg).toContain('P204');
    expect(brokenMsg).toContain('Điều hòa Inverter');

    const resolvedMsg = GAME_COPYWRITING.maintenanceResolved('P204', 'Điều hòa Inverter');
    expect(resolvedMsg).toContain('P204');
    expect(resolvedMsg).toContain('Điều hòa Inverter');
  });
});
