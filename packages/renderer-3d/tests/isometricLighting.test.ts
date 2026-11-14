import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { setupIsometricLighting } from '../src/lighting/isometricLighting';

describe('setupIsometricLighting', () => {
  it('adds ambient and directional lights to the scene', () => {
    const scene = new THREE.Scene();
    const result = setupIsometricLighting(scene);

    expect(result.ambient).toBeInstanceOf(THREE.AmbientLight);
    expect(result.directional).toBeInstanceOf(THREE.DirectionalLight);
    expect(scene.children).toContain(result.ambient);
    expect(scene.children).toContain(result.directional);
  });

  it('uses warm ambient lighting (#F5F3EF) with intensity 0.6 by default', () => {
    const scene = new THREE.Scene();
    const result = setupIsometricLighting(scene);

    expect(result.ambient.color.getHex()).toBe(0xf5f3ef);
    expect(result.ambient.intensity).toBeCloseTo(0.6);
  });

  it('enables shadow mapping on directional light with custom bounds', () => {
    const scene = new THREE.Scene();
    const result = setupIsometricLighting(scene, {
      directionalPosition: [12, 24, 12],
      castShadow: true,
      shadowMapSize: 1024,
      shadowCameraBound: 20,
    });

    expect(result.directional.castShadow).toBe(true);
    expect(result.directional.position.x).toBe(12);
    expect(result.directional.position.y).toBe(24);
    expect(result.directional.position.z).toBe(12);
    expect(result.directional.shadow.mapSize.width).toBe(1024);
    expect(result.directional.shadow.camera.left).toBe(-20);
    expect(result.directional.shadow.camera.right).toBe(20);
  });
});
