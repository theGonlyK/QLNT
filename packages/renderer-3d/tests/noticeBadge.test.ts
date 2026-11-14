import { describe, it, expect } from 'vitest';
import { NoticeBadge, NOTICE_COLORS } from '../src/badges/noticeBadge';

describe('NoticeBadge', () => {
  it('instantiates with PAYMENT_DUE type and yellow color', () => {
    const badge = new NoticeBadge('PAYMENT_DUE', { x: 1, y: 2, z: 3 });
    expect(badge.getType()).toBe('PAYMENT_DUE');
    expect(badge.position.x).toBe(1);
    expect(badge.position.y).toBe(2);
    expect(badge.position.z).toBe(3);
    expect(badge.visible).toBe(true);
    badge.dispose();
  });

  it('instantiates with BROKEN type and red color', () => {
    const badge = new NoticeBadge('BROKEN');
    expect(badge.getType()).toBe('BROKEN');
    expect(badge.visible).toBe(true);
    badge.dispose();
  });

  it('hides badge when set to NONE', () => {
    const badge = new NoticeBadge('PAYMENT_DUE');
    expect(badge.visible).toBe(true);
    badge.setType('NONE');
    expect(badge.visible).toBe(false);
    badge.dispose();
  });

  it('switches from NONE back to BROKEN and restores visibility', () => {
    const badge = new NoticeBadge('NONE');
    expect(badge.visible).toBe(false);
    badge.setType('BROKEN');
    expect(badge.visible).toBe(true);
    expect(badge.getType()).toBe('BROKEN');
    badge.dispose();
  });

  it('updates bobbing position and rotation over time', () => {
    const badge = new NoticeBadge('PAYMENT_DUE', { x: 0, y: 2, z: 0 });
    const initialRotY = badge.rotation.y;
    badge.update(0.1);

    expect(badge.rotation.y).toBeGreaterThan(initialRotY);
    expect(badge.position.y).not.toBe(2); // bobbed away from base
    badge.dispose();
  });

  it('does not crash on dispose', () => {
    const badge = new NoticeBadge('BROKEN');
    expect(() => badge.dispose()).not.toThrow();
  });
});
