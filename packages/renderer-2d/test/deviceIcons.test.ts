import { describe, expect, it } from 'vitest';
import type { DeviceCategory } from '@qlnt/shared-types';
import {
  DeviceCategoryIconSVG,
  MinigameToolIconSVG,
  RewardBadgeSVG,
} from '../src';

describe('Task 2: Device Category Icons, Minigame Tools & Reward Badges', () => {
  const categories: DeviceCategory[] = [
    'FIXED',
    'FURNITURE',
    'ADDITIONAL',
    'SECURITY',
    'METER',
  ];

  it('supports all 5 DeviceCategory groups with 3 states (NORMAL, BROKEN, IN_PROGRESS)', () => {
    const states = ['NORMAL', 'BROKEN', 'IN_PROGRESS'] as const;

    for (const cat of categories) {
      for (const st of states) {
        const el = DeviceCategoryIconSVG({
          category: cat,
          state: st,
        });

        expect(el).toBeDefined();
        expect(el.props['data-category']).toBe(cat);
        expect(el.props['data-state']).toBe(st);

        if (st === 'BROKEN') {
          expect(el.props.className).toContain('qlnt-device-broken');
        } else if (st === 'IN_PROGRESS') {
          expect(el.props.className).toContain('qlnt-device-in-progress');
        }
      }
    }
  });

  it('enforces default size 24x24px and allows flexible resizing', () => {
    const defaultEl = DeviceCategoryIconSVG({ category: 'FIXED' });
    expect(defaultEl.props.width).toBe(24);
    expect(defaultEl.props.height).toBe(24);

    const scaledEl = DeviceCategoryIconSVG({ category: 'METER', size: 48 });
    expect(scaledEl.props.width).toBe(48);
    expect(scaledEl.props.height).toBe(48);
  });

  it('supports all 4 minigame tools (pot, pan, broom, slipper)', () => {
    const tools = ['pot', 'pan', 'broom', 'slipper'] as const;

    for (const tool of tools) {
      const el = MinigameToolIconSVG({ tool });
      expect(el).toBeDefined();
      expect(el.props['data-tool']).toBe(tool);
      expect(el.props.width).toBe(24);
      expect(el.props.height).toBe(24);
    }
  });

  it('supports RewardBadgeSVG with 1 to 5 stars', () => {
    for (let stars = 1; stars <= 5; stars++) {
      const badge = RewardBadgeSVG({ stars, label: `${stars} sao` });
      expect(badge).toBeDefined();
      expect(badge.props['data-stars']).toBe(stars);
      expect(badge.props['aria-label']).toContain(`${stars}`);
    }

    // Clamp stars between 1 and 5
    const clampedUnder = RewardBadgeSVG({ stars: 0 });
    expect(clampedUnder.props['data-stars']).toBe(1);

    const clampedOver = RewardBadgeSVG({ stars: 10 });
    expect(clampedOver.props['data-stars']).toBe(5);
  });
});
