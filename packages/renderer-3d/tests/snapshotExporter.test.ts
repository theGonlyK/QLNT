import { describe, it, expect, vi } from 'vitest';
import * as THREE from 'three';
import { SnapshotExporter } from '../src/snapshot/snapshotExporter';

describe('SnapshotExporter', () => {
  it('exports canvas to Data URL', () => {
    const canvas = document.createElement('canvas');
    canvas.toDataURL = vi.fn().mockReturnValue('data:image/png;base64,mockPngData');

    const renderer = {
      domElement: canvas,
      render: vi.fn(),
    } as unknown as THREE.WebGLRenderer;

    const dataUrl = SnapshotExporter.exportCanvasToDataURL(renderer, 'image/png');
    expect(dataUrl).toBe('data:image/png;base64,mockPngData');
    expect(canvas.toDataURL).toHaveBeenCalledWith('image/png', undefined);
  });

  it('exports canvas to Blob using canvas.toBlob', async () => {
    const canvas = document.createElement('canvas');
    const mockBlob = new Blob(['mock'], { type: 'image/png' });
    canvas.toBlob = vi.fn().mockImplementation((cb: (b: Blob | null) => void) => {
      cb(mockBlob);
    });

    const renderer = {
      domElement: canvas,
    } as unknown as THREE.WebGLRenderer;

    const blob = await SnapshotExporter.exportCanvasToBlob(renderer, 'image/png');
    expect(blob).toBe(mockBlob);
  });

  it('takeSnapshot renders frame and returns data URL', () => {
    const canvas = document.createElement('canvas');
    canvas.toDataURL = vi.fn().mockReturnValue('data:image/png;base64,renderedPng');

    const renderFn = vi.fn();
    const renderer = {
      domElement: canvas,
      render: renderFn,
    } as unknown as THREE.WebGLRenderer;

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera();

    const result = SnapshotExporter.takeSnapshot(renderer, scene, camera);
    expect(renderFn).toHaveBeenCalledWith(scene, camera);
    expect(result).toBe('data:image/png;base64,renderedPng');
  });
});
