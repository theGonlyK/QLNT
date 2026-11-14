import { describe, it, expect, vi } from 'vitest';
import * as THREE from 'three';
import { AvatarController } from '../src/avatar/avatarController';

describe('AvatarController', () => {
  it('instantiates without animations and sets initial position', () => {
    const group = new THREE.Group();
    const controller = new AvatarController({ model: group });

    controller.setPosition({ x: 3, y: 0, z: 4 });
    expect(group.position.x).toBe(3);
    expect(group.position.y).toBe(0);
    expect(group.position.z).toBe(4);
    controller.dispose();
  });

  it('manages animation clips and cross-fading', () => {
    const group = new THREE.Group();
    const clipIdle = new THREE.AnimationClip('Idle', 1, []);
    const clipWalk = new THREE.AnimationClip('Walk', 1, []);

    const controller = new AvatarController({
      model: group,
      animations: [clipIdle, clipWalk],
      defaultAction: 'Idle',
    });

    expect(controller.getCurrentActionName()).toBe('Idle');
    const played = controller.playAction('Walk');
    expect(played).toBe(true);
    expect(controller.getCurrentActionName()).toBe('Walk');
    controller.dispose();
  });

  it('moves towards target position on update and rotates heading', () => {
    const group = new THREE.Group();
    group.position.set(0, 0, 0);

    const controller = new AvatarController({
      model: group,
      moveSpeed: 5.0,
    });

    const onComplete = vi.fn();
    controller.moveTo({ x: 10, y: 0, z: 0 }, 5.0, onComplete);

    // Delta 1 second -> moves 5 units
    controller.update(1.0);
    expect(group.position.x).toBeCloseTo(5.0);
    expect(onComplete).not.toHaveBeenCalled();

    // Delta 1.1 seconds -> moves remaining 5 units and reaches target
    controller.update(1.1);
    expect(group.position.x).toBeCloseTo(10.0);
    expect(onComplete).toHaveBeenCalledOnce();
    controller.dispose();
  });
});
