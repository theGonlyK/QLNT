import * as THREE from 'three';

export interface SnapshotOptions {
  /** Target image MIME type (default: 'image/png') */
  mimeType?: 'image/png' | 'image/webp' | 'image/jpeg';
  /** Compression quality between 0.0 and 1.0 (for webp / jpeg) */
  quality?: number;
  /** Whether to call renderer.render(scene, camera) prior to capturing (default: true) */
  renderFirst?: boolean;
}

/**
 * Exporter utility for taking 2D raster snapshots (PNG, WebP) from Three.js WebGL scenes.
 */
export class SnapshotExporter {
  /**
   * Captures the current canvas buffer as a base64 Data URL.
   */
  static exportCanvasToDataURL(
    renderer: THREE.WebGLRenderer,
    mimeType: string = 'image/png',
    quality?: number,
  ): string {
    const canvas = renderer.domElement;
    if (!canvas || typeof canvas.toDataURL !== 'function') {
      throw new Error('Canvas element does not support toDataURL()');
    }
    return canvas.toDataURL(mimeType, quality);
  }

  /**
   * Captures the current canvas buffer as a Blob.
   */
  static exportCanvasToBlob(
    renderer: THREE.WebGLRenderer,
    mimeType: string = 'image/png',
    quality?: number,
  ): Promise<Blob> {
    const canvas = renderer.domElement;
    if (!canvas) {
      return Promise.reject(new Error('Renderer has no valid DOM element'));
    }

    if (typeof canvas.toBlob === 'function') {
      return new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Canvas toBlob returned null'));
            }
          },
          mimeType,
          quality,
        );
      });
    }

    // Fallback via data URL for environments lacking toBlob
    try {
      const dataUrl = this.exportCanvasToDataURL(renderer, mimeType, quality);
      const base64Data = dataUrl.split(',')[1];
      if (!base64Data) {
        throw new Error('Invalid Data URL format');
      }
      const binaryStr = atob(base64Data);
      const bytes = new Uint8Array(binaryStr.length);
      for (let i = 0; i < binaryStr.length; i++) {
        bytes[i] = binaryStr.charCodeAt(i);
      }
      return Promise.resolve(new Blob([bytes], { type: mimeType }));
    } catch (err) {
      return Promise.reject(err);
    }
  }

  /**
   * Convenience method to render the scene and take a snapshot in one call.
   */
  static takeSnapshot(
    renderer: THREE.WebGLRenderer,
    scene: THREE.Scene,
    camera: THREE.Camera,
    options: SnapshotOptions = {},
  ): string {
    if (options.renderFirst !== false) {
      renderer.render(scene, camera);
    }
    return this.exportCanvasToDataURL(
      renderer,
      options.mimeType ?? 'image/png',
      options.quality,
    );
  }
}
