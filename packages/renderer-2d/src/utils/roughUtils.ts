import rough from 'roughjs';
import type { PathInfo } from 'roughjs/bin/core';

export function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash) || 1;
}

export function generateRoughRect(
  x: number,
  y: number,
  width: number,
  height: number,
  options: {
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
    roughness?: number;
    seed?: number;
  } = {}
): PathInfo[] {
  const rc = rough.generator();
  const drawable = rc.rectangle(x, y, width, height, {
    fill: options.fill,
    fillStyle: options.fill ? 'solid' : undefined,
    stroke: options.stroke || '#000000',
    strokeWidth: options.strokeWidth ?? 1.5,
    roughness: options.roughness ?? 1.0,
    seed: options.seed ?? 1,
  });
  return rc.toPaths(drawable);
}
