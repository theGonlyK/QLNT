import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { main } from '../examples/demo_isometric_room';

describe('Demo Isometric Room Execution', () => {
  it('runs demo room composition and writes demo_room_isometric.png', async () => {
    await main();

    const outputPath = path.resolve(
      __dirname,
      '../../../scratch/renders/demo_room_isometric.png',
    );
    expect(fs.existsSync(outputPath)).toBe(true);

    const buffer = fs.readFileSync(outputPath);
    expect(buffer.length).toBeGreaterThan(100);

    // Verify PNG signature (magic bytes: 0x89 0x50 0x4E 0x47 0x0D 0x0A 0x1A 0x0A)
    const pngMagic = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    expect(buffer.subarray(0, 8).equals(pngMagic)).toBe(true);
  });
});
