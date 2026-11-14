import * as THREE from 'three';

export interface IsometricLightingConfig {
  /** Ambient light color (default: warm #F5F3EF / 0xF5F3EF) */
  ambientColor?: number | string;
  /** Ambient light intensity (default: 0.6) */
  ambientIntensity?: number;
  /** Directional light color (default: #FFFFFF / 0xFFFFFF) */
  directionalColor?: number | string;
  /** Directional light intensity (default: 1.2) */
  directionalIntensity?: number;
  /** Directional light position (default: [10, 20, 10]) */
  directionalPosition?: [number, number, number];
  /** Whether shadow map casting is enabled on directional light (default: true) */
  castShadow?: boolean;
  /** Shadow map resolution width and height (default: 2048) */
  shadowMapSize?: number;
  /** Shadow camera frustum bound (default: 15) */
  shadowCameraBound?: number;
}

export interface IsometricLightingResult {
  ambient: THREE.AmbientLight;
  directional: THREE.DirectionalLight;
}

/**
 * Sets up warm ambient and directional key lighting with soft shadow mapping
 * tailored for isometric orthographic projections.
 *
 * Angles: Key light positioned at top-front-right (10, 20, 10) to cast natural
 * shadows across isometric room surfaces.
 */
export function setupIsometricLighting(
  scene: THREE.Scene,
  config: IsometricLightingConfig = {},
): IsometricLightingResult {
  const ambientColor = config.ambientColor ?? 0xf5f3ef;
  const ambientIntensity = config.ambientIntensity ?? 0.6;
  const directionalColor = config.directionalColor ?? 0xffffff;
  const directionalIntensity = config.directionalIntensity ?? 1.2;
  const [dx, dy, dz] = config.directionalPosition ?? [10, 20, 10];
  const castShadow = config.castShadow ?? true;
  const shadowMapSize = config.shadowMapSize ?? 2048;
  const shadowCameraBound = config.shadowCameraBound ?? 15;

  // 1. Warm Ambient Light
  const ambient = new THREE.AmbientLight(ambientColor, ambientIntensity);
  ambient.name = 'IsometricAmbientLight';
  scene.add(ambient);

  // 2. Key Directional Light with Shadow Mapping
  const directional = new THREE.DirectionalLight(
    directionalColor,
    directionalIntensity,
  );
  directional.name = 'IsometricDirectionalLight';
  directional.position.set(dx, dy, dz);
  directional.castShadow = castShadow;

  if (castShadow) {
    directional.shadow.mapSize.width = shadowMapSize;
    directional.shadow.mapSize.height = shadowMapSize;
    directional.shadow.camera.near = 0.5;
    directional.shadow.camera.far = 100;
    directional.shadow.camera.left = -shadowCameraBound;
    directional.shadow.camera.right = shadowCameraBound;
    directional.shadow.camera.top = shadowCameraBound;
    directional.shadow.camera.bottom = -shadowCameraBound;
    directional.shadow.bias = -0.0005;
  }

  scene.add(directional);

  return { ambient, directional };
}
