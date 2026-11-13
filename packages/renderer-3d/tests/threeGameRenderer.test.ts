import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as THREE from 'three';
import type {
  BuildingRenderDTO,
  AvatarSkinDTO,
  Vector3D,
  FloorMapDTO,
  RoomDetailDTO,
} from '@qlnt/shared-types';

// ---------------------------------------------------------------------------
// Mock THREE.WebGLRenderer before any imports that may construct it
// ---------------------------------------------------------------------------
vi.mock('three', async (importOriginal) => {
  const actual = await importOriginal<typeof THREE>();

  // Minimal WebGLRenderer stub — exposes the same surface ThreeGameRenderer uses
  class MockWebGLRenderer {
    domElement: HTMLCanvasElement = document.createElement('canvas');
    shadowMap = { enabled: false };
    setSize = vi.fn();
    setPixelRatio = vi.fn();
    render = vi.fn();
    dispose = vi.fn();
  }

  return {
    ...actual,
    WebGLRenderer: MockWebGLRenderer,
  };
});

// Import AFTER the vi.mock hoisting
import { ThreeGameRenderer } from '../src/threeGameRenderer';
import { createIsometricCamera } from '../src/camera/isometricCamera';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const buildingData: BuildingRenderDTO = {
  propertyId: 'prop-01',
  totalFloors: 3,
  roomsPerFloor: 4,
  position: { x: 0, y: 0, z: 0 },
  scale: { x: 1, y: 1, z: 1 },
};

const avatarSkin: AvatarSkinDTO = {
  modelId: 'model-default',
  colorScheme: 'blue',
};

const roomPosition: Vector3D = { x: 2, y: 1, z: 0 };

const floorMapData: FloorMapDTO = {
  propertyId: 'prop-01',
  floorNumber: 1,
  rooms: [
    {
      roomId: 'room-1',
      roomNumber: '101',
      status: 'OCCUPIED',
      hasPaymentNotice: false,
      hasBrokenDevice: false,
    },
  ],
};

const roomDetailData: RoomDetailDTO = {
  roomId: 'room-1',
  roomNumber: '101',
  floorNumber: 1,
  basePrice: 3000000,
  areaSqm: 20,
  status: 'OCCUPIED',
  devices: [],
};

// ---------------------------------------------------------------------------
// Tests — IsometricCamera
// ---------------------------------------------------------------------------

describe('createIsometricCamera', () => {
  it('returns an OrthographicCamera instance', () => {
    const cam = createIsometricCamera();
    expect(cam).toBeInstanceOf(THREE.OrthographicCamera);
  });

  it('places camera at a non-zero distance from origin', () => {
    const cam = createIsometricCamera();
    expect(cam.position.length()).toBeGreaterThan(0);
  });

  it('looks toward origin (direction dot position < 0)', () => {
    const cam = createIsometricCamera();
    const dir = new THREE.Vector3();
    cam.getWorldDirection(dir);
    const normPos = cam.position.clone().normalize();
    // Looking AT origin means dir is roughly the negative of the position normal
    const dot = dir.dot(normPos.negate());
    expect(dot).toBeCloseTo(1, 1);
  });

  it('uses Y-up convention', () => {
    const cam = createIsometricCamera();
    expect(cam.up.y).toBe(1);
    expect(cam.up.x).toBe(0);
    expect(cam.up.z).toBe(0);
  });

  it('applies yaw of 45° — |X| ≈ |Z|', () => {
    const cam = createIsometricCamera();
    expect(Math.abs(cam.position.x)).toBeCloseTo(Math.abs(cam.position.z), 5);
  });

  it('applies pitch of ~35.264°', () => {
    const cam = createIsometricCamera();
    const p = cam.position;
    const h = Math.sqrt(p.x ** 2 + p.z ** 2);
    const measuredPitchDeg = THREE.MathUtils.radToDeg(Math.atan2(p.y, h));
    expect(measuredPitchDeg).toBeCloseTo(35.264, 1);
  });

  it('scales position with frustumSize', () => {
    const cam10 = createIsometricCamera(10);
    const cam20 = createIsometricCamera(20);
    expect(cam20.position.length()).toBeGreaterThan(cam10.position.length());
  });

  it('respects custom aspect ratio in frustum bounds', () => {
    const cam = createIsometricCamera(10, 16 / 9);
    // right = (frustumSize * aspect) / 2 = (10 * 16/9) / 2
    expect(cam.right).toBeCloseTo((10 * 16) / 9 / 2, 2);
  });

  it('near plane is positive', () => {
    const cam = createIsometricCamera();
    expect(cam.near).toBeGreaterThan(0);
  });

  it('far plane is greater than near plane', () => {
    const cam = createIsometricCamera();
    expect(cam.far).toBeGreaterThan(cam.near);
  });
});

// ---------------------------------------------------------------------------
// Tests — ThreeGameRenderer (uses mocked WebGLRenderer)
// ---------------------------------------------------------------------------

describe('ThreeGameRenderer — instantiation', () => {
  let renderer: ThreeGameRenderer;

  beforeEach(() => {
    renderer = new ThreeGameRenderer({ width: 400, height: 300 });
  });

  afterEach(() => renderer.dispose());

  it('constructs without throwing', () => {
    expect(renderer).toBeDefined();
  });

  it('exposes a THREE.Scene', () => {
    expect(renderer.scene).toBeInstanceOf(THREE.Scene);
  });

  it('exposes a THREE.OrthographicCamera (isometric)', () => {
    expect(renderer.camera).toBeInstanceOf(THREE.OrthographicCamera);
  });

  it('exposes a renderer object', () => {
    expect(renderer.renderer).toBeDefined();
  });
});

describe('ThreeGameRenderer — camera setup', () => {
  let r: ThreeGameRenderer;

  beforeEach(() => {
    r = new ThreeGameRenderer({ width: 800, height: 600 });
  });

  afterEach(() => r.dispose());

  it('camera position is non-zero', () => {
    expect(r.camera.position.length()).toBeGreaterThan(0);
  });

  it('camera is at isometric yaw 45° (|X| ≈ |Z|)', () => {
    expect(Math.abs(r.camera.position.x)).toBeCloseTo(
      Math.abs(r.camera.position.z),
      5,
    );
  });

  it('camera pitch is ~35.264°', () => {
    const p = r.camera.position;
    const h = Math.sqrt(p.x ** 2 + p.z ** 2);
    const pitch = THREE.MathUtils.radToDeg(Math.atan2(p.y, h));
    expect(pitch).toBeCloseTo(35.264, 1);
  });

  it('camera uses Y-up', () => {
    expect(r.camera.up.y).toBe(1);
  });
});

describe('ThreeGameRenderer — IGameRenderer contract', () => {
  let r: ThreeGameRenderer;

  beforeEach(() => {
    r = new ThreeGameRenderer({ width: 400, height: 300 });
  });

  afterEach(() => r.dispose());

  // --- building ---

  it('renderBuilding resolves without error', async () => {
    await expect(r.renderBuilding(buildingData)).resolves.toBeUndefined();
  });

  it('renderBuilding populates scene with totalFloors × roomsPerFloor meshes', async () => {
    await r.renderBuilding(buildingData);
    const buildings = r.scene.children.filter(
      (c) => c.userData['type'] === 'building',
    );
    expect(buildings.length).toBe(
      buildingData.totalFloors * buildingData.roomsPerFloor,
    );
  });

  it('renderBuilding re-renders without duplicating existing meshes', async () => {
    await r.renderBuilding(buildingData);
    await r.renderBuilding(buildingData);
    const buildings = r.scene.children.filter(
      (c) => c.userData['type'] === 'building',
    );
    expect(buildings.length).toBe(
      buildingData.totalFloors * buildingData.roomsPerFloor,
    );
  });

  it('renderBuilding with no scale still resolves', async () => {
    const data: BuildingRenderDTO = { ...buildingData, scale: undefined };
    await expect(r.renderBuilding(data)).resolves.toBeUndefined();
  });

  // --- avatar ---

  it('spawnAvatar adds avatar to scene', () => {
    r.spawnAvatar('avatar-1', roomPosition, avatarSkin);
    const found = r.scene.children.some(
      (c) => c.userData['avatarId'] === 'avatar-1',
    );
    expect(found).toBe(true);
  });

  it('spawnAvatar sets avatar position correctly', () => {
    r.spawnAvatar('avatar-pos', roomPosition, avatarSkin);
    const avatar = r.scene.children.find(
      (c) => c.userData['avatarId'] === 'avatar-pos',
    );
    expect(avatar?.position.x).toBeCloseTo(roomPosition.x);
    expect(avatar?.position.y).toBeCloseTo(roomPosition.y);
    expect(avatar?.position.z).toBeCloseTo(roomPosition.z);
  });

  it('spawnAvatar does not duplicate if called twice with same id', () => {
    r.spawnAvatar('avatar-dup', roomPosition, avatarSkin);
    r.spawnAvatar('avatar-dup', { x: 5, y: 0, z: 0 }, avatarSkin);
    const count = r.scene.children.filter(
      (c) => c.userData['avatarId'] === 'avatar-dup',
    ).length;
    expect(count).toBe(1);
  });

  it('moveAvatar updates avatar position', () => {
    r.spawnAvatar('avatar-move', roomPosition, avatarSkin);
    const target: Vector3D = { x: 10, y: 2, z: 5 };
    r.moveAvatar('avatar-move', target);
    const avatar = r.scene.children.find(
      (c) => c.userData['avatarId'] === 'avatar-move',
    );
    expect(avatar?.position.x).toBeCloseTo(target.x);
    expect(avatar?.position.y).toBeCloseTo(target.y);
    expect(avatar?.position.z).toBeCloseTo(target.z);
  });

  it('moveAvatar calls onComplete callback', () => {
    r.spawnAvatar('avatar-cb', roomPosition, avatarSkin);
    const cb = vi.fn();
    r.moveAvatar('avatar-cb', { x: 1, y: 0, z: 0 }, cb);
    expect(cb).toHaveBeenCalledOnce();
  });

  it('moveAvatar on unknown avatarId is a no-op (does not throw)', () => {
    expect(() =>
      r.moveAvatar('unknown-id', { x: 0, y: 0, z: 0 }),
    ).not.toThrow();
  });

  // --- device / notice ---

  it('setDeviceStatus BROKEN does not throw', () => {
    expect(() =>
      r.setDeviceStatus('room-1', 'device-1', 'BROKEN'),
    ).not.toThrow();
  });

  it('setDeviceStatus NORMAL does not throw', () => {
    expect(() =>
      r.setDeviceStatus('room-1', 'device-1', 'NORMAL'),
    ).not.toThrow();
  });

  it('setRoomNotice PAYMENT_DUE does not throw', () => {
    expect(() => r.setRoomNotice('room-1', 'PAYMENT_DUE')).not.toThrow();
  });

  it('setRoomNotice NONE does not throw', () => {
    expect(() => r.setRoomNotice('room-1', 'NONE')).not.toThrow();
  });

  it('setRoomNotice BILL_PENDING does not throw', () => {
    expect(() => r.setRoomNotice('room-1', 'BILL_PENDING')).not.toThrow();
  });

  // --- minigame ---

  it('playMinigameAction resolves', async () => {
    await expect(
      r.playMinigameAction('repair', 'wrench-skin'),
    ).resolves.toBeUndefined();
  });

  it('playMinigameAction with no toolSkin resolves', async () => {
    await expect(r.playMinigameAction('clean')).resolves.toBeUndefined();
  });

  // --- ledger book ---

  it('openLedgerBook resolves', async () => {
    await expect(
      r.openLedgerBook('2024-11', 0, floorMapData),
    ).resolves.toBeUndefined();
  });

  it('flipLedgerFloorPage resolves', async () => {
    await expect(r.flipLedgerFloorPage(1, floorMapData)).resolves.toBeUndefined();
  });

  it('openRoomDetailSinglePage PAGE_1_BILLING resolves', async () => {
    await expect(
      r.openRoomDetailSinglePage('room-1', 'PAGE_1_BILLING', roomDetailData),
    ).resolves.toBeUndefined();
  });

  it('openRoomDetailSinglePage PAGE_2_DEVICES resolves', async () => {
    await expect(
      r.openRoomDetailSinglePage('room-1', 'PAGE_2_DEVICES', roomDetailData),
    ).resolves.toBeUndefined();
  });

  it('switchRoomDetailPageTab resolves', async () => {
    await expect(
      r.switchRoomDetailPageTab('room-1', 'PAGE_3_AUDIT', roomDetailData),
    ).resolves.toBeUndefined();
  });

  it('refreshRoomDetailView does not throw', () => {
    expect(() => r.refreshRoomDetailView('room-1', roomDetailData)).not.toThrow();
  });

  it('closeRoomDetailToFloorMap resolves', async () => {
    await expect(
      r.closeRoomDetailToFloorMap(floorMapData),
    ).resolves.toBeUndefined();
  });

  it('closeLedgerBookTo3DScene resolves', async () => {
    await expect(r.closeLedgerBookTo3DScene()).resolves.toBeUndefined();
  });
});

describe('ThreeGameRenderer — IGameRenderer type contract (runtime method presence)', () => {
  it('implements all 13 required IGameRenderer methods', () => {
    const r = new ThreeGameRenderer();
    const methods = [
      'renderBuilding',
      'spawnAvatar',
      'moveAvatar',
      'setDeviceStatus',
      'setRoomNotice',
      'playMinigameAction',
      'openLedgerBook',
      'flipLedgerFloorPage',
      'openRoomDetailSinglePage',
      'switchRoomDetailPageTab',
      'refreshRoomDetailView',
      'closeRoomDetailToFloorMap',
      'closeLedgerBookTo3DScene',
    ] as const;

    for (const m of methods) {
      expect(typeof r[m], `method "${m}" should be a function`).toBe('function');
    }
    r.dispose();
  });
});

describe('ThreeGameRenderer — renderFrame', () => {
  it('renderFrame does not throw', () => {
    const r = new ThreeGameRenderer();
    expect(() => r.renderFrame()).not.toThrow();
    r.dispose();
  });
});

describe('ThreeGameRenderer — dispose', () => {
  it('dispose does not throw', () => {
    const r = new ThreeGameRenderer();
    expect(() => r.dispose()).not.toThrow();
  });

  it('dispose clears the scene', () => {
    const r = new ThreeGameRenderer();
    r.spawnAvatar('a', { x: 0, y: 0, z: 0 }, { modelId: 'm' });
    r.dispose();
    expect(r.scene.children.length).toBe(0);
  });
});
