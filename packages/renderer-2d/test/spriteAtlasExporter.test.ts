import { describe, expect, it } from 'vitest';
import {
  isPowerOfTwo,
  createSvgDataUrl,
  createSpriteAtlasUrl,
  generateNoticeBillboardTexture,
} from '../src';

describe('Task 4: Sprite Atlas Exporter for Three.js Billboard Integration', () => {
  it('validates Power-of-Two dimensions correctly', () => {
    expect(isPowerOfTwo(512)).toBe(true);
    expect(isPowerOfTwo(1024)).toBe(true);
    expect(isPowerOfTwo(256)).toBe(true);
    expect(isPowerOfTwo(500)).toBe(false);
    expect(isPowerOfTwo(100)).toBe(false);
  });

  it('generates Power-of-Two Sprite Atlas URL with 512x512 or 1024x1024 dimensions', () => {
    const rawSvg = '<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="red"/></svg>';

    const atlas512 = createSpriteAtlasUrl(rawSvg, { size: 512 });
    expect(atlas512.width).toBe(512);
    expect(atlas512.height).toBe(512);
    expect(atlas512.dataUrl.startsWith('data:image/svg+xml;')).toBe(true);

    const atlas1024 = createSpriteAtlasUrl(rawSvg, { size: 1024 });
    expect(atlas1024.width).toBe(1024);
    expect(atlas1024.height).toBe(1024);
  });

  it('enforces Bottom-Center pivot (0.5, 0.0) and Alpha Test = 0.5', () => {
    const rawSvg = '<svg viewBox="0 0 100 100"><rect width="100" height="100" fill="blue"/></svg>';
    const result = createSpriteAtlasUrl(rawSvg);

    // Pivot default: bottom-center (0.5, 0.0)
    expect(result.pivot.x).toBe(0.5);
    expect(result.pivot.y).toBe(0.0);

    // Alpha test default: 0.5
    expect(result.alphaTest).toBe(0.5);
  });

  it('generates Notice Billboard Texture for PAYMENT_DUE and BROKEN', () => {
    const paymentBillboard = generateNoticeBillboardTexture('PAYMENT_DUE', { size: 512 });
    expect(paymentBillboard.width).toBe(512);
    expect(paymentBillboard.height).toBe(512);
    expect(paymentBillboard.svgString).toContain('F59E0B');
    expect(paymentBillboard.dataUrl).toContain('data:image/svg+xml;');

    const brokenBillboard = generateNoticeBillboardTexture('BROKEN', { size: 512 });
    expect(brokenBillboard.width).toBe(512);
    expect(brokenBillboard.height).toBe(512);
    expect(brokenBillboard.svgString).toContain('EF4444');
    expect(brokenBillboard.dataUrl).toContain('data:image/svg+xml;');
  });

  it('creates valid UTF-8 base64 or encoded dataUrl from SVG string', () => {
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"><text>Phòng trọ</text></svg>';
    const dataUrl = createSvgDataUrl(svg);
    expect(dataUrl.startsWith('data:image/svg+xml;utf8,') || dataUrl.startsWith('data:image/svg+xml;base64,')).toBe(true);
  });
});
