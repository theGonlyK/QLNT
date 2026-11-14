import { describe, expect, it } from 'vitest';
import {
  buildVietQRPayload,
  computeCRC16CCITT,
  renderVietQRSvgString,
} from '../src/utils/vietqrLocal';

describe('vietqrLocal', () => {
  it('computes standard EMVCo CRC16-CCITT (0xFFFF, 0x1021)', () => {
    // Standard EMVCo check vector: "123456789" -> 0x29B1
    expect(computeCRC16CCITT('123456789')).toBe('29B1');

    const crcA = computeCRC16CCITT('00020101021253037045802VN6304');
    const crcB = computeCRC16CCITT('00020101021253037045802VN6304');
    const crcChanged = computeCRC16CCITT('00020101021153037045802VN6304');

    expect(crcA).toMatch(/^[0-9A-F]{4}$/);
    expect(crcA).toBe(crcB);
    expect(crcA).not.toBe(crcChanged);
  });

  it('builds valid EMVCo / NAPAS 247 VietQR payload with exact amount and CRC', () => {
    const payload = buildVietQRPayload({
      bankBin: '970436',
      accountNumber: '1012345678',
      amount: 4250000,
      description: 'QLNT P101 T11',
    });

    expect(payload.startsWith('000201010212')).toBe(true);
    expect(payload).toContain('A000000727');
    expect(payload).toContain('QRIBFTTA');
    expect(payload).toContain('970436');
    expect(payload).toContain('1012345678');
    expect(payload).toContain('5303704');
    expect(payload).toContain('54074250000');
    expect(payload).toContain('5802VN');
    expect(payload).toContain('QLNT P101 T11');

    // Last 8 chars are "6304" + 4-hex CRC of preceding substring
    const crcTagPrefix = payload.slice(-8, -4);
    const crcValue = payload.slice(-4);
    expect(crcTagPrefix).toBe('6304');
    expect(crcValue).toBe(computeCRC16CCITT(payload.slice(0, -4)));
  });

  it('renders an offline SVG QR code with zero external URLs and size < 50KB', () => {
    const svg = renderVietQRSvgString(
      {
        bankBin: '970436',
        accountNumber: '1012345678',
        amount: 3950000,
        description: 'QLNT P102 T11',
      },
      220
    );

    expect(svg.startsWith('<svg ')).toBe(true);
    expect(svg.endsWith('</svg>')).toBe(true);
    expect(svg).toContain('<rect');
    expect(svg.length).toBeLessThan(50 * 1024);

    // QLNT-D016: zero external URLs
    expect(svg).not.toContain('http://');
    expect(svg).not.toContain('https://');
    expect(svg).not.toContain('img.vietqr.io');
  });
});
