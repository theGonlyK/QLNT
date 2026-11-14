import { describe, it, expect, vi } from 'vitest';
import * as THREE from 'three';
import { AssetLoader } from '../src/loaders/assetLoader';

describe('AssetLoader', () => {
  it('instantiates and provides cache operations', () => {
    const loader = new AssetLoader();
    const group = new THREE.Group();
    group.name = 'TestModel';

    loader.setCache('models/desk.glb', group);

    expect(loader.hasCache('models/desk.glb')).toBe(true);
    expect(loader.hasCache('unknown')).toBe(false);

    const retrieved = loader.getCache('models/desk.glb');
    expect(retrieved).toBeDefined();
    expect(retrieved?.scene.name).toBe('TestModel');
    // Ensure cloned instance is independent
    expect(retrieved?.scene).not.toBe(group);

    loader.clearCache();
    expect(loader.hasCache('models/desk.glb')).toBe(false);
    loader.dispose();
  });

  it('loads via custom loader mock', async () => {
    const mockScene = new THREE.Group();
    mockScene.name = 'MockLoaded';

    const customLoader = {
      loadAsync: vi.fn().mockResolvedValue({
        scene: mockScene,
        animations: [],
        scenes: [mockScene],
        cameras: [],
        asset: {},
        userData: {},
      }),
      parseAsync: vi.fn(),
    } as unknown as import('three/examples/jsm/loaders/GLTFLoader.js').GLTFLoader;

    const loader = new AssetLoader({ customLoader });
    const result1 = await loader.load('http://example.com/model.glb');
    expect(result1.scene.name).toBe('MockLoaded');
    expect(customLoader.loadAsync).toHaveBeenCalledTimes(1);

    // Second call should return from cache without calling loader again
    const result2 = await loader.load('http://example.com/model.glb');
    expect(result2.scene.name).toBe('MockLoaded');
    expect(customLoader.loadAsync).toHaveBeenCalledTimes(1);

    loader.dispose();
  });
});
