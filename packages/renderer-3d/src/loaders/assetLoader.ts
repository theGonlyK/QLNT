import * as THREE from 'three';
import { GLTFLoader, type GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';

export interface AssetCacheEntry {
  scene: THREE.Group;
  animations: THREE.AnimationClip[];
  rawGLTF?: GLTF;
}

export interface AssetLoaderOptions {
  customLoader?: GLTFLoader;
}

/**
 * AssetLoader wraps Three.js GLTFLoader with in-memory caching for .glb / .gltf models.
 * Clones the root scene on each retrieval so independent instances can be placed
 * and transformed without mutating cached geometry or other instances.
 */
export class AssetLoader {
  private readonly loader: GLTFLoader;
  private readonly cache = new Map<string, AssetCacheEntry>();

  constructor(options: AssetLoaderOptions = {}) {
    this.loader = options.customLoader ?? new GLTFLoader();
  }

  /**
   * Loads a GLTF/GLB asset from a URL or relative path.
   * Caches the parsed result.
   */
  async load(url: string): Promise<AssetCacheEntry> {
    const cached = this.cache.get(url);
    if (cached) {
      return this.cloneEntry(cached);
    }

    const gltf = await this.loader.loadAsync(url);
    const entry: AssetCacheEntry = {
      scene: gltf.scene,
      animations: gltf.animations ?? [],
      rawGLTF: gltf,
    };

    this.cache.set(url, entry);
    return this.cloneEntry(entry);
  }

  /**
   * Parses an ArrayBuffer or JSON string containing GLTF/GLB data.
   * Useful in testing and offline rendering workflows.
   */
  async parse(
    data: ArrayBuffer | string,
    path: string = '',
    cacheKey?: string,
  ): Promise<AssetCacheEntry> {
    if (cacheKey && this.cache.has(cacheKey)) {
      return this.cloneEntry(this.cache.get(cacheKey)!);
    }

    const gltf = await this.loader.parseAsync(data, path);
    const entry: AssetCacheEntry = {
      scene: gltf.scene,
      animations: gltf.animations ?? [],
      rawGLTF: gltf,
    };

    if (cacheKey) {
      this.cache.set(cacheKey, entry);
    }

    return this.cloneEntry(entry);
  }

  /**
   * Directly sets a pre-loaded model entry into the cache (useful for testing or procedural models).
   */
  setCache(key: string, scene: THREE.Group, animations: THREE.AnimationClip[] = []): void {
    this.cache.set(key, {
      scene,
      animations,
      rawGLTF: {
        scene,
        scenes: [scene],
        animations,
        cameras: [],
        asset: {},
        userData: {},
      } as unknown as GLTF,
    });
  }

  /**
   * Checks whether an asset is cached.
   */
  hasCache(key: string): boolean {
    return this.cache.has(key);
  }

  /**
   * Retrieves a cloned cached entry if available.
   */
  getCache(key: string): AssetCacheEntry | undefined {
    const cached = this.cache.get(key);
    return cached ? this.cloneEntry(cached) : undefined;
  }

  /**
   * Clears all cached entries.
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Disposes loader and cached geometries/materials.
   */
  dispose(): void {
    for (const entry of this.cache.values()) {
      entry.scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry?.dispose();
          if (Array.isArray(obj.material)) {
            obj.material.forEach((m) => m.dispose());
          } else {
            obj.material?.dispose();
          }
        }
      });
    }
    this.cache.clear();
  }

  private cloneEntry(entry: AssetCacheEntry): AssetCacheEntry {
    return {
      scene: entry.scene.clone(true),
      animations: [...entry.animations],
      rawGLTF: entry.rawGLTF,
    };
  }
}
