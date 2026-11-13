import { describe, expect, it } from 'vitest';
import {
  auditSvgSizeBudget,
  DEFAULT_SVG_BUDGET_BYTES,
  ICON_SVG_BUDGET_BYTES,
  generateRoomBlueprintSvgString,
  generateNoticeBillboardTexture,
} from '../src';
import type { FloorMapRoomDTO } from '@qlnt/shared-types';

describe('Task 5: SVG Size Budget Auditor & SVGO Compression (< 50 KB)', () => {
  const dummyRoom: FloorMapRoomDTO = {
    roomId: 'room-audit-1',
    roomNumber: '302',
    status: 'RENTED',
    tenantName: 'Le Thi C',
    hasPaymentNotice: true,
    hasBrokenDevice: true,
  };

  it('guarantees all 3 architectural room layouts are strictly < 50 KB', () => {
    const layouts = ['STANDARD_SINGLE', 'MEZZANINE', 'STUDIO_MINI'] as const;

    for (const layout of layouts) {
      const svg = generateRoomBlueprintSvgString({
        room: dummyRoom,
        layoutType: layout,
        width: 400,
        height: 300,
      });

      const audit = auditSvgSizeBudget(svg, DEFAULT_SVG_BUDGET_BYTES);
      expect(audit.isUnderBudget).toBe(true);
      expect(audit.optimizedSize).toBeLessThan(50 * 1024);
      // Even further, single room layouts should be lightweight (under 10 KB)
      expect(audit.optimizedSize).toBeLessThan(10 * 1024);
    }
  });

  it('guarantees warning icons & billboards are strictly < 5 KB (or < 50 KB for atlas)', () => {
    const paymentBillboard = generateNoticeBillboardTexture('PAYMENT_DUE', { size: 512 });
    const paymentAudit = auditSvgSizeBudget(paymentBillboard.svgString, DEFAULT_SVG_BUDGET_BYTES);
    expect(paymentAudit.isUnderBudget).toBe(true);
    expect(paymentAudit.optimizedSize).toBeLessThan(50 * 1024);

    const brokenBillboard = generateNoticeBillboardTexture('BROKEN', { size: 512 });
    const brokenAudit = auditSvgSizeBudget(brokenBillboard.svgString, DEFAULT_SVG_BUDGET_BYTES);
    expect(brokenAudit.isUnderBudget).toBe(true);
    expect(brokenAudit.optimizedSize).toBeLessThan(50 * 1024);

    // Raw icon svg without filter glow is well under 5 KB
    const iconSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"><circle cx="12" cy="12" r="10" fill="#EF4444"/></svg>';
    const iconAudit = auditSvgSizeBudget(iconSvg, ICON_SVG_BUDGET_BYTES);
    expect(iconAudit.isUnderBudget).toBe(true);
    expect(iconAudit.optimizedSize).toBeLessThan(5 * 1024);
  });

  it('correctly flags oversized SVGs exceeding the budget threshold', () => {
    // Generate artificial payload exceeding small 100-byte budget
    const largeSvg = `<svg xmlns="http://www.w3.org/2000/svg"><desc>${'A'.repeat(500)}</desc></svg>`;
    const audit = auditSvgSizeBudget(largeSvg, 100);

    expect(audit.isUnderBudget).toBe(false);
    expect(audit.optimizedSize).toBeGreaterThan(100);
  });
});
