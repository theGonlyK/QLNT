import * as THREE from 'three';
import type { Vector3D } from '@qlnt/shared-types';

export interface AvatarControllerOptions {
  model: THREE.Group;
  animations?: THREE.AnimationClip[];
  defaultAction?: string;
  moveSpeed?: number;
}

/**
 * AvatarController wraps a 3D character mesh with:
 * - THREE.AnimationMixer playback (Idle, Walk, Run, etc.)
 * - Smooth positional movement towards target coordinates
 * - Heading rotation towards movement trajectory
 */
export class AvatarController {
  public readonly model: THREE.Group;
  public readonly mixer?: THREE.AnimationMixer;
  private readonly actions = new Map<string, THREE.AnimationAction>();
  private currentAction?: THREE.AnimationAction;
  private currentActionName?: string;

  private targetPosition: THREE.Vector3 | null = null;
  private moveSpeed: number = 2.5; // m/s
  private onMoveComplete?: () => void;

  constructor(options: AvatarControllerOptions) {
    this.model = options.model;
    this.moveSpeed = options.moveSpeed ?? 2.5;

    if (options.animations && options.animations.length > 0) {
      this.mixer = new THREE.AnimationMixer(this.model);
      for (const clip of options.animations) {
        const action = this.mixer.clipAction(clip);
        this.actions.set(clip.name.toLowerCase(), action);
      }

      const defaultName = options.defaultAction ?? 'idle';
      this.playAction(defaultName);
    }
  }

  /**
   * Plays a named animation clip with cross-fading.
   */
  playAction(name: string, fadeDuration: number = 0.25): boolean {
    if (!this.mixer) return false;

    const lower = name.toLowerCase();
    // Search exact or partial match
    let action = this.actions.get(lower);
    if (!action) {
      for (const [key, act] of this.actions.entries()) {
        if (key.includes(lower)) {
          action = act;
          break;
        }
      }
    }

    if (!action) return false;

    if (this.currentAction === action) return true;

    action.reset();
    action.fadeIn(fadeDuration);
    action.play();

    if (this.currentAction) {
      this.currentAction.fadeOut(fadeDuration);
    }

    this.currentAction = action;
    this.currentActionName = name;
    return true;
  }

  getCurrentActionName(): string | undefined {
    return this.currentActionName;
  }

  /**
   * Initiates movement towards a 3D target position.
   */
  moveTo(target: Vector3D, speed?: number, onComplete?: () => void): void {
    if (speed !== undefined) {
      this.moveSpeed = speed;
    }
    this.targetPosition = new THREE.Vector3(target.x, target.y, target.z);
    this.onMoveComplete = onComplete;

    // Switch to Walk action if available
    this.playAction('walk');
  }

  /**
   * Immediately sets the avatar position.
   */
  setPosition(pos: Vector3D): void {
    this.model.position.set(pos.x, pos.y, pos.z);
    this.targetPosition = null;
  }

  /**
   * Updates animations and step-by-step movement.
   */
  update(delta: number): void {
    // 1. Advance AnimationMixer
    if (this.mixer) {
      this.mixer.update(delta);
    }

    // 2. Advance Movement towards target
    if (this.targetPosition) {
      const current = this.model.position;
      const diff = this.targetPosition.clone().sub(current);
      const distance = diff.length();
      const step = this.moveSpeed * delta;

      if (distance <= step || distance < 0.001) {
        // Reached destination
        this.model.position.copy(this.targetPosition);
        this.targetPosition = null;

        // Return to Idle
        this.playAction('idle');

        // Trigger callback
        const cb = this.onMoveComplete;
        this.onMoveComplete = undefined;
        cb?.();
      } else {
        // Heading rotation: face movement direction in XZ plane
        if (Math.abs(diff.x) > 0.0001 || Math.abs(diff.z) > 0.0001) {
          const targetRotationY = Math.atan2(diff.x, diff.z);
          // Smooth slerp-like or direct rotation
          this.model.rotation.y = targetRotationY;
        }

        diff.normalize().multiplyScalar(step);
        current.add(diff);
      }
    }
  }

  /**
   * Disposes animation mixer and actions.
   */
  dispose(): void {
    if (this.mixer) {
      this.mixer.stopAllAction();
      this.mixer.uncacheRoot(this.model);
    }
    this.actions.clear();
    this.currentAction = undefined;
    this.targetPosition = null;
    this.onMoveComplete = undefined;
  }
}
