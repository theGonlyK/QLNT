import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { calculateBilling } from '@qlnt/domain-core';
import { MIN_TOUCH_TARGET_SIZE } from '@qlnt/renderer-2d';
import { ThreeGameRenderer } from '@qlnt/renderer-3d';
import type { FloorMapDTO, RoomDetailDTO } from '@qlnt/shared-types';
import { getAppMetadata } from '../src/App';

const currentDir = dirname(fileURLToPath(import.meta.url));
const appRoot = resolve(currentDir, '..');

describe('@qlnt/web bootstrap', () => {
  it('exposes expected app metadata for Prototype P1 and Mobile 390x844', () => {
    const metadata = getAppMetadata();
    expect(metadata.name).toBe('@qlnt/web');
    expect(metadata.title).toBe('QLNT — Prototype P1 (Sổ Quản Lý Ảo F04)');
    expect(metadata.viewport).toBe('width=device-width, initial-scale=1.0');
    expect(metadata.mobilePreset).toEqual({ width: 390, height: 844 });
  });

  it('configures index.html with mobile viewport and Prototype P1 title', () => {
    const html = readFileSync(resolve(appRoot, 'index.html'), 'utf8');
    expect(html).toContain('width=device-width, initial-scale=1.0');
    expect(html).toContain('QLNT — Prototype P1 (Sổ Quản Lý Ảo F04)');
    expect(html).toContain('/src/main.tsx');
  });

  it('declares @qlnt/web and all 4 workspace dependencies in package.json', () => {
    const pkg = JSON.parse(readFileSync(resolve(appRoot, 'package.json'), 'utf8')) as {
      name: string;
      dependencies: Record<string, string>;
      scripts: Record<string, string>;
    };

    expect(pkg.name).toBe('@qlnt/web');
    expect(pkg.dependencies['@qlnt/shared-types']).toBe('workspace:*');
    expect(pkg.dependencies['@qlnt/domain-core']).toBe('workspace:*');
    expect(pkg.dependencies['@qlnt/renderer-2d']).toBe('workspace:*');
    expect(pkg.dependencies['@qlnt/renderer-3d']).toBe('workspace:*');
    expect(pkg.scripts.dev).toBeDefined();
    expect(pkg.scripts.build).toBe('tsc --noEmit && vite build');
    expect(pkg.scripts.test).toBe('vitest run');
    expect(pkg.scripts.typecheck).toBe('tsc --noEmit');
  });

  it('resolves exports from all 4 workspace packages', () => {
    expect(typeof calculateBilling).toBe('function');
    expect(MIN_TOUCH_TARGET_SIZE).toBe(44);
    expect(typeof ThreeGameRenderer).toBe('function');

    // Compile-time check for @qlnt/shared-types DTOs
    const floorTypeCheck: FloorMapDTO | null = null;
    const roomTypeCheck: RoomDetailDTO | null = null;
    expect(floorTypeCheck).toBeNull();
    expect(roomTypeCheck).toBeNull();
  });
});
