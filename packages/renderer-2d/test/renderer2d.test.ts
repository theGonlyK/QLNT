import { describe, expect, it } from 'vitest';
import {
  MIN_TOUCH_TARGET_SIZE,
  NOTICE_BADGE_SIZE,
  ROOM_STATUS_COLORS,
  NOTICE_BADGE_COLORS,
  getRoomDisplayStatus,
  getRoomStatusColors,
  hashString,
  generateRoughRect,
  optimizeSvgString,
} from '../src';
import type { FloorMapRoomDTO } from '@qlnt/shared-types';

describe('Renderer 2D Status Colors & Constants', () => {
  it('strictly adheres to the 4 required status colors', () => {
    // EMPTY: #DCFCE7 (bg) / #22C55E (border)
    expect(ROOM_STATUS_COLORS.EMPTY.bg.toUpperCase()).toBe('#DCFCE7');
    expect(ROOM_STATUS_COLORS.EMPTY.border.toUpperCase()).toBe('#22C55E');

    // OCCUPIED: #FEFCE8 (bg) / #A16207 (border)
    expect(ROOM_STATUS_COLORS.OCCUPIED.bg.toUpperCase()).toBe('#FEFCE8');
    expect(ROOM_STATUS_COLORS.OCCUPIED.border.toUpperCase()).toBe('#A16207');

    // PAYMENT_DUE: #F59E0B
    expect(ROOM_STATUS_COLORS.PAYMENT_DUE.border.toUpperCase()).toBe('#F59E0B');
    expect(ROOM_STATUS_COLORS.PAYMENT_DUE.badge?.toUpperCase()).toBe('#F59E0B');
    expect(NOTICE_BADGE_COLORS.PAYMENT_DUE.toUpperCase()).toBe('#F59E0B');

    // BROKEN: #EF4444
    expect(ROOM_STATUS_COLORS.BROKEN.border.toUpperCase()).toBe('#EF4444');
    expect(ROOM_STATUS_COLORS.BROKEN.badge?.toUpperCase()).toBe('#EF4444');
    expect(NOTICE_BADGE_COLORS.BROKEN.toUpperCase()).toBe('#EF4444');
  });

  it('enforces min touch target >= 44x44px and badge 24x24px', () => {
    expect(MIN_TOUCH_TARGET_SIZE).toBeGreaterThanOrEqual(44);
    expect(NOTICE_BADGE_SIZE).toBe(24);
  });
});

describe('getRoomDisplayStatus', () => {
  it('correctly maps room states', () => {
    const emptyRoom: FloorMapRoomDTO = {
      roomId: 'r1',
      roomNumber: '101',
      status: 'EMPTY',
      hasPaymentNotice: false,
      hasBrokenDevice: false,
    };
    expect(getRoomDisplayStatus(emptyRoom)).toBe('EMPTY');

    const occupiedRoom: FloorMapRoomDTO = {
      roomId: 'r2',
      roomNumber: '102',
      status: 'RENTED',
      tenantName: 'Nguyen Van A',
      hasPaymentNotice: false,
      hasBrokenDevice: false,
    };
    expect(getRoomDisplayStatus(occupiedRoom)).toBe('OCCUPIED');

    const paymentDueRoom: FloorMapRoomDTO = {
      roomId: 'r3',
      roomNumber: '103',
      status: 'RENTED',
      hasPaymentNotice: true,
      hasBrokenDevice: false,
    };
    expect(getRoomDisplayStatus(paymentDueRoom)).toBe('PAYMENT_DUE');

    const brokenRoom: FloorMapRoomDTO = {
      roomId: 'r4',
      roomNumber: '104',
      status: 'RENTED',
      hasPaymentNotice: false,
      hasBrokenDevice: true,
    };
    expect(getRoomDisplayStatus(brokenRoom)).toBe('BROKEN');

    // Broken device takes priority over payment notice
    const bothAlertsRoom: FloorMapRoomDTO = {
      roomId: 'r5',
      roomNumber: '105',
      status: 'RENTED',
      hasPaymentNotice: true,
      hasBrokenDevice: true,
    };
    expect(getRoomDisplayStatus(bothAlertsRoom)).toBe('BROKEN');
  });

  it('returns valid colors for all display statuses', () => {
    const statuses = ['EMPTY', 'OCCUPIED', 'PAYMENT_DUE', 'BROKEN'] as const;
    for (const s of statuses) {
      const colors = getRoomStatusColors(s);
      expect(colors).toBeDefined();
      expect(colors.bg).toBeDefined();
      expect(colors.border).toBeDefined();
    }
  });
});

describe('RoughJS & Deterministic Rendering', () => {
  it('generates reproducible paths using deterministic seeds', () => {
    const seed = hashString('room-101');
    expect(typeof seed).toBe('number');
    expect(seed).toBeGreaterThan(0);

    const paths1 = generateRoughRect(0, 0, 100, 100, { seed });
    const paths2 = generateRoughRect(0, 0, 100, 100, { seed });

    expect(paths1.length).toBeGreaterThan(0);
    expect(paths1[0]?.d).toBe(paths2[0]?.d);
  });
});

describe('SVG Optimization with SVGO', () => {
  it('optimizes SVG strings without corrupting tags', () => {
    const rawSvg = '<svg width="24" height="24" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#EF4444" /></svg>';
    const optimized = optimizeSvgString(rawSvg);
    expect(optimized).toContain('<svg');
    expect(optimized).toContain('viewBox="0 0 24 24"');
    expect(optimized.length).toBeLessThanOrEqual(rawSvg.length);
  });
});
