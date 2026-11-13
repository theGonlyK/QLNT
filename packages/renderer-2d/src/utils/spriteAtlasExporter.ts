import { NOTICE_BADGE_COLORS } from '../constants';
import { optimizeSvgString } from './svgOptimize';

export interface SpriteAtlasOptions {
  size?: 512 | 1024;
  pivot?: { x: number; y: number };
  alphaTest?: number;
  backgroundColor?: string;
}

export interface SpriteAtlasResult {
  width: number;
  height: number;
  pivot: { x: number; y: number };
  alphaTest: number;
  dataUrl: string;
  svgString: string;
}

/**
 * Checks whether a number is a power of 2 (e.g. 256, 512, 1024)
 */
export function isPowerOfTwo(n: number): boolean {
  return Number.isInteger(n) && n > 0 && (n & (n - 1)) === 0;
}

/**
 * Creates a valid data URL from an SVG string
 */
export function createSvgDataUrl(svgString: string): string {
  // Use encoded UTF-8 SVG data URI compatible across browser & Three.js SVGLoader / TextureLoader
  return `data:image/svg+xml;utf8,${encodeURIComponent(svgString)}`;
}

/**
 * Packages an SVG string into a Power-of-Two Sprite Atlas URL formatted for Three.js billboard sprites.
 */
export function createSpriteAtlasUrl(
  svgString: string,
  options: SpriteAtlasOptions = {}
): SpriteAtlasResult {
  const size = options.size ?? 512;
  const pivot = options.pivot ?? { x: 0.5, y: 0.0 }; // Default Bottom-Center pivot
  const alphaTest = options.alphaTest ?? 0.5;
  const backgroundColor = options.backgroundColor ?? 'transparent';

  // Ensure power of two
  const validSize = isPowerOfTwo(size) ? size : 512;

  // Wrap SVG in a standardized power-of-two viewBox if needed
  let finalSvg: string;
  if (svgString.includes('xmlns="http://www.w3.org/2000/svg"')) {
    // If it's already a full SVG, inject width and height
    finalSvg = svgString;
  } else {
    finalSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${validSize} ${validSize}" width="${validSize}" height="${validSize}">
      ${backgroundColor !== 'transparent' ? `<rect width="${validSize}" height="${validSize}" fill="${backgroundColor}"/>` : ''}
      ${svgString}
    </svg>`;
  }

  const optimized = optimizeSvgString(finalSvg);
  const dataUrl = createSvgDataUrl(optimized);

  return {
    width: validSize,
    height: validSize,
    pivot,
    alphaTest,
    dataUrl,
    svgString: optimized,
  };
}

/**
 * Generates standard Notice Billboard Texture (Yellow Payment or Red Broken Alert)
 * for direct binding to Three.js THREE.SpriteMaterial with AlphaTest = 0.5 and Pivot Bottom-Center.
 */
export function generateNoticeBillboardTexture(
  type: 'PAYMENT_DUE' | 'BROKEN',
  options: SpriteAtlasOptions = {}
): SpriteAtlasResult {
  const size = options.size ?? 512;
  const color = type === 'BROKEN' ? NOTICE_BADGE_COLORS.BROKEN : NOTICE_BADGE_COLORS.PAYMENT_DUE;
  const title = type === 'BROKEN' ? 'Cảnh báo hỏng hóc' : 'Cảnh báo nợ tiền';

  // Crisp high-resolution vector icon centered with 10% bottom margin for billboard pivot
  const iconRadius = Math.round(size * 0.38);
  const centerX = Math.round(size / 2);
  const centerY = Math.round(size * 0.45); // slightly elevated above bottom pivot

  const billboardSvg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
      <title>${title}</title>
      <defs>
        <filter id="billboardGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="4" stdDeviation="12" flood-color="${color}" flood-opacity="0.6"/>
        </filter>
      </defs>
      <!-- Circular Notice Badge -->
      <circle cx="${centerX}" cy="${centerY}" r="${iconRadius}" fill="${color}" filter="url(#billboardGlow)"/>
      <circle cx="${centerX}" cy="${centerY}" r="${iconRadius - 10}" fill="none" stroke="#FFFFFF" stroke-width="8" opacity="0.4"/>
      
      <!-- Exclamation Mark -->
      <g fill="#FFFFFF" text-anchor="middle">
        <rect x="${centerX - 16}" y="${centerY - iconRadius + 45}" width="32" height="${Math.round(iconRadius * 0.9)}" rx="16"/>
        <circle cx="${centerX}" cy="${centerY + iconRadius - 55}" r="18"/>
      </g>
    </svg>
  `.trim();

  return createSpriteAtlasUrl(billboardSvg, {
    size,
    pivot: options.pivot ?? { x: 0.5, y: 0.0 },
    alphaTest: options.alphaTest ?? 0.5,
    backgroundColor: options.backgroundColor ?? 'transparent',
  });
}

/**
 * Exports an SVG string into an HTMLCanvasElement
 */
export async function exportSvgToCanvas(
  svgString: string,
  canvas: HTMLCanvasElement,
  options: SpriteAtlasOptions = {}
): Promise<void> {
  const size = options.size ?? 512;
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.clearRect(0, 0, size, size);

  if (typeof Image === 'undefined') {
    // In Node / SSR / headless test environments without DOM Image
    return;
  }

  const dataUrl = createSvgDataUrl(svgString);
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      ctx.drawImage(img, 0, 0, size, size);
      resolve();
    };
    img.onerror = (e) => reject(e);
    img.src = dataUrl;
  });
}
