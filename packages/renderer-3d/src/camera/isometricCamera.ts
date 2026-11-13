import * as THREE from 'three';

/**
 * Creates and positions a THREE.OrthographicCamera with a fixed isometric view.
 *
 * Camera angles:
 * - Yaw: 45 degrees (rotation around Y axis)
 * - Pitch: 35.264 degrees (true isometric pitch = atan(1/sqrt(2)))
 * - Convention: Y-up, 1 unit = 1.0m
 *
 * @param frustumSize - The half-size of the orthographic frustum (default: 10)
 * @param aspect - The aspect ratio width/height (default: 1)
 * @returns Configured OrthographicCamera in isometric position
 */
export function createIsometricCamera(
  frustumSize: number = 10,
  aspect: number = 1,
): THREE.OrthographicCamera {
  const halfW = (frustumSize * aspect) / 2;
  const halfH = frustumSize / 2;

  const camera = new THREE.OrthographicCamera(
    -halfW,
    halfW,
    halfH,
    -halfH,
    0.1,
    1000,
  );

  // Isometric angles
  const yawDeg = 45;
  const pitchDeg = 35.264; // atan(1/sqrt(2)) ≈ 35.2644°

  const yawRad = THREE.MathUtils.degToRad(yawDeg);
  const pitchRad = THREE.MathUtils.degToRad(pitchDeg);

  // Position camera at a canonical distance along the isometric direction
  const distance = frustumSize * 2;
  camera.position.set(
    distance * Math.sin(yawRad) * Math.cos(pitchRad),
    distance * Math.sin(pitchRad),
    distance * Math.cos(yawRad) * Math.cos(pitchRad),
  );

  // Look at origin, Y-up
  camera.up.set(0, 1, 0);
  camera.lookAt(0, 0, 0);
  camera.updateMatrixWorld();

  return camera;
}
