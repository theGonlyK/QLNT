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

describe('ThreeGameRenderer — 3D interaction, raycast, hover & camera controls', () => {
  let r: ThreeGameRenderer;

  beforeEach(() => {
    r = new ThreeGameRenderer({ width: 800, height: 600 });
  });

  afterEach(() => r.dispose());

  it('renderBuilding centers procedural building around x = 0 and sets room userData', async () => {
    await r.renderBuilding(buildingData);
    const meshes = r.scene.children.filter(
      (c): c is THREE.Mesh =>
        c instanceof THREE.Mesh && c.userData['type'] === 'building',
    );
    expect(meshes.length).toBe(12);

    const avgX = meshes.reduce((sum, m) => sum + m.position.x, 0) / meshes.length;
    expect(avgX).toBeCloseTo(0, 5);

    const first = meshes.find(
      (m) => m.userData['floor'] === 0 && m.userData['room'] === 0,
    );
    expect(first?.userData['roomId']).toBe('room-1');
  });

  it('renderBuilding arranges rooms in 3D grid along both X and Z axes when blockGrid is provided', async () => {
    await r.renderBuilding({
      propertyId: 'p-grid-test',
      totalFloors: 3,
      roomsPerFloor: 4,
      position: { x: 0, y: 0, z: 0 },
      blockGrid: { cols: 2, rows: 2 },
    } as any);

    const meshes = (r as any).buildingMeshes;
    expect(meshes.length).toBe(12);

    // Kiểm tra có ít nhất 2 giá trị z khác nhau (thể hiện 2 hàng phòng theo chiều sâu)
    const zPositions = new Set(meshes.map((m: any) => Math.round(m.position.z * 100) / 100));
    expect(zPositions.size).toBeGreaterThanOrEqual(2);
  });

  it('supports setBuildingBlockShape and getBuildingBlockShape', () => {
    r.setBuildingBlockShape(3, 4);
    expect(r.getBuildingBlockShape()).toEqual({ cols: 3, rows: 4 });
  });

  it('renders presets TOWER_2x2x6, CCMN_3x2x4, and CUBE_3x3x3 with precise 3D geometry and corridor gaps', async () => {
    // 1. TOWER_2x2x6 (2 cols, 2 rows, 6 floors = 24 rooms)
    await r.renderBuilding({
      propertyId: 'tower-test',
      totalFloors: 6,
      roomsPerFloor: 4,
      position: { x: 0, y: 0, z: 0 },
      blockGrid: { cols: 2, rows: 2 },
    } as any);

    let meshes = (r as any).buildingMeshes as THREE.Mesh[];
    expect(meshes.length).toBe(24);
    let avgX = meshes.reduce((s, m) => s + m.position.x, 0) / meshes.length;
    let avgZ = meshes.reduce((s, m) => s + m.position.z, 0) / meshes.length;
    expect(avgX).toBeCloseTo(0, 5);
    expect(avgZ).toBeCloseTo(0, 5);

    // Check corridor gap along Z is 0.25 (row step = 1.0 + 0.25 = 1.25)
    const zSorted = Array.from(new Set(meshes.map((m) => Math.round(m.position.z * 1000) / 1000))).sort((a, b) => a - b);
    expect(zSorted.length).toBe(2);
    expect(zSorted[1]! - zSorted[0]!).toBeCloseTo(1.25, 3);

    // Check gapX is 0.1 (col step = 1.0 + 0.10 = 1.10)
    const xSorted = Array.from(new Set(meshes.map((m) => Math.round(m.position.x * 1000) / 1000))).sort((a, b) => a - b);
    expect(xSorted.length).toBe(2);
    expect(xSorted[1]! - xSorted[0]!).toBeCloseTo(1.10, 3);

    // 2. CUBE_3x3x3 (3 cols, 3 rows, 3 floors = 27 rooms)
    await r.renderBuilding({
      propertyId: 'cube-test',
      totalFloors: 3,
      roomsPerFloor: 9,
      position: { x: 0, y: 0, z: 0 },
      blockGrid: { cols: 3, rows: 3 },
    } as any);

    meshes = (r as any).buildingMeshes as THREE.Mesh[];
    expect(meshes.length).toBe(27);
    avgX = meshes.reduce((s, m) => s + m.position.x, 0) / meshes.length;
    avgZ = meshes.reduce((s, m) => s + m.position.z, 0) / meshes.length;
    expect(avgX).toBeCloseTo(0, 5);
    expect(avgZ).toBeCloseTo(0, 5);

    const cubeZ = Array.from(new Set(meshes.map((m) => Math.round(m.position.z * 1000) / 1000))).sort((a, b) => a - b);
    expect(cubeZ.length).toBe(3);
    expect(cubeZ[1]! - cubeZ[0]!).toBeCloseTo(1.25, 3);
    expect(cubeZ[2]! - cubeZ[1]!).toBeCloseTo(1.25, 3);

    // 3. CCMN_3x2x4 (3 cols, 2 rows, 4 floors = 24 rooms)
    await r.renderBuilding({
      propertyId: 'ccmn-test',
      totalFloors: 4,
      roomsPerFloor: 6,
      position: { x: 0, y: 0, z: 0 },
      blockGrid: { cols: 3, rows: 2 },
    } as any);

    meshes = (r as any).buildingMeshes as THREE.Mesh[];
    expect(meshes.length).toBe(24);
    avgX = meshes.reduce((s, m) => s + m.position.x, 0) / meshes.length;
    avgZ = meshes.reduce((s, m) => s + m.position.z, 0) / meshes.length;
    expect(avgX).toBeCloseTo(0, 5);
    expect(avgZ).toBeCloseTo(0, 5);
  });

  it('getRoomBadgeAnchor returns THREE.Vector3 on visible exterior face with slot / kind support', async () => {
    await r.renderBuilding(buildingData);
    const anchorNotice = r.getRoomBadgeAnchor('room-1', 'ROOM_NOTICE');
    const anchorBroken = r.getRoomBadgeAnchor('room-1', 'DEVICE_BROKEN');
    const anchorSlot0 = r.getRoomBadgeAnchor('room-1', 0);
    const anchorSlot1 = r.getRoomBadgeAnchor('room-1', 1);

    expect(anchorNotice).toBeInstanceOf(THREE.Vector3);
    expect(anchorBroken).toBeInstanceOf(THREE.Vector3);

    const mesh = r.findRoomMesh('room-1')!;
    // room-1 is floor 0, room 0 -> rowIdx 0 < rows - 1 (1) -> back row (anchor on top)
    expect(anchorNotice.x).toBeCloseTo(mesh.position.x - 0.18, 4);
    expect(anchorNotice.y).toBeCloseTo(mesh.position.y + 0.78, 4);
    expect(anchorNotice.z).toBeCloseTo(mesh.position.z, 4);

    expect(anchorBroken.x).toBeCloseTo(mesh.position.x + 0.18, 4);
    expect(anchorSlot0.x).toBeCloseTo(anchorNotice.x, 4);
    expect(anchorSlot1.x).toBeCloseTo(anchorBroken.x, 4);

    // Front-row room (room-3: floor 0, room 2 -> rowIdx 1 === rows - 1) anchors in front
    const anchorFront = r.getRoomBadgeAnchor('room-3', 'ROOM_NOTICE');
    const meshFront = r.findRoomMesh('room-3')!;
    expect(anchorFront.x).toBeCloseTo(meshFront.position.x - 0.18, 4);
    expect(anchorFront.y).toBeCloseTo(meshFront.position.y + 0.25, 4);
    expect(anchorFront.z).toBeCloseTo(meshFront.position.z + 0.68, 4);

    // Missing room fallback
    const fallback = r.getRoomBadgeAnchor('unknown-room-id');
    expect(fallback).toBeInstanceOf(THREE.Vector3);
    expect(fallback.y).toBe(2.2);
  });

  it('renderBuilding assigns distinct colors across floors', async () => {
    await r.renderBuilding(buildingData);
    const floor0 = r.scene.children.find(
      (c): c is THREE.Mesh =>
        c instanceof THREE.Mesh &&
        c.userData['type'] === 'building' &&
        c.userData['floor'] === 0,
    );
    const floor1 = r.scene.children.find(
      (c): c is THREE.Mesh =>
        c instanceof THREE.Mesh &&
        c.userData['type'] === 'building' &&
        c.userData['floor'] === 1,
    );
    expect(floor0).toBeDefined();
    expect(floor1).toBeDefined();
    const mat0 = floor0!.material as THREE.MeshLambertMaterial;
    const mat1 = floor1!.material as THREE.MeshLambertMaterial;
    expect(mat0.color.getHex()).not.toBe(mat1.color.getHex());
  });

  it('pickBuildingRoom returns room info when ray hits a room and null when outside', async () => {
    await r.renderBuilding(buildingData);

    const hit = r.pickBuildingRoom(0, 0);
    expect(hit).not.toBeNull();
    expect(typeof hit?.floorIndex).toBe('number');
    expect(typeof hit?.roomIndex).toBe('number');
    expect(hit?.roomId).toMatch(/^room-\d+$/);

    const miss = r.pickBuildingRoom(1, 1);
    expect(miss).toBeNull();
  });

  it('setHoveredRoom highlights target room emissive and resets previous room', async () => {
    await r.renderBuilding(buildingData);

    r.setHoveredRoom(0, 1);
    const room01 = r.scene.children.find(
      (c): c is THREE.Mesh =>
        c instanceof THREE.Mesh &&
        c.userData['type'] === 'building' &&
        c.userData['floor'] === 0 &&
        c.userData['room'] === 1,
    )!;
    const mat01 = room01.material as THREE.MeshLambertMaterial;
    expect(mat01.emissive.getHex()).not.toBe(0x000000);

    r.setHoveredRoom(1, 2);
    const room12 = r.scene.children.find(
      (c): c is THREE.Mesh =>
        c instanceof THREE.Mesh &&
        c.userData['type'] === 'building' &&
        c.userData['floor'] === 1 &&
        c.userData['room'] === 2,
    )!;
    const mat12 = room12.material as THREE.MeshLambertMaterial;
    expect(mat01.emissive.getHex()).toBe(0x000000);
    expect(mat12.emissive.getHex()).not.toBe(0x000000);

    r.setHoveredRoom(null, null);
    expect(mat12.emissive.getHex()).toBe(0x000000);
  });

  it('orbitCamera rotates camera around Y axis while keeping elevation and distance', () => {
    const initialPos = r.camera.position.clone();
    const initialDist = initialPos.length();

    r.orbitCamera(Math.PI / 4);

    expect(r.camera.position.y).toBeCloseTo(initialPos.y, 4);
    expect(r.camera.position.length()).toBeCloseTo(initialDist, 4);
    expect(r.camera.position.x).not.toBeCloseTo(initialPos.x, 2);
  });

  it('zoomCamera clamps zoom between 0.6 and 2.5', () => {
    r.zoomCamera(1.5);
    expect(r.camera.zoom).toBeCloseTo(1.5, 4);

    r.zoomCamera(10);
    expect(r.camera.zoom).toBe(2.5);

    r.zoomCamera(0.1);
    expect(r.camera.zoom).toBe(0.6);
  });

  it('resetIsometricCamera restores default 45°/35.264° isometric position and zoom = 1', () => {
    const defaultPos = r.camera.position.clone();
    r.orbitCamera(Math.PI / 3);
    r.zoomCamera(1.8);

    r.resetIsometricCamera();

    expect(r.camera.zoom).toBe(1);
    expect(r.camera.position.x).toBeCloseTo(defaultPos.x, 4);
    expect(r.camera.position.y).toBeCloseTo(defaultPos.y, 4);
    expect(r.camera.position.z).toBeCloseTo(defaultPos.z, 4);
  });

  it('resetFloorIsometricCamera sets camera to 45° corridor view (Yaw 45°, Pitch 35.264°, Zoom 1.215)', () => {
    r.resetFloorIsometricCamera();

    const yawRad = THREE.MathUtils.degToRad(45);
    const pitchRad = THREE.MathUtils.degToRad(35.264);
    const distance = (r as any).frustumSize * 1.5;

    const expectedX = distance * Math.sin(yawRad) * Math.cos(pitchRad);
    const expectedY = distance * Math.sin(pitchRad);
    const expectedZ = distance * Math.cos(yawRad) * Math.cos(pitchRad);

    expect(r.camera.zoom).toBe(1.215);
    expect(r.camera.position.x).toBeCloseTo(expectedX, 4);
    expect(r.camera.position.y).toBeCloseTo(expectedY, 4);
    expect(r.camera.position.z).toBeCloseTo(expectedZ, 4);
  });

  it('setHoveredFloor highlights all rooms of target floor with emissive #fbbf24 and resets others', async () => {
    await r.renderBuilding(buildingData);

    r.setHoveredFloor(1);

    const buildingMeshes = r.scene.children.filter(
      (c): c is THREE.Mesh =>
        c instanceof THREE.Mesh && c.userData['type'] === 'building',
    );
    expect(buildingMeshes.length).toBe(12);

    for (const mesh of buildingMeshes) {
      const mat = mesh.material as THREE.MeshLambertMaterial;
      if (mesh.userData['floor'] === 1) {
        expect(mat.emissive.getHex()).toBe(0xfbbf24);
        expect(mat.emissiveIntensity).toBe(0.5);
      } else {
        expect(mat.emissive.getHex()).toBe(0x000000);
        expect(mat.emissiveIntensity).toBe(0);
      }
    }

    // Switch hover to floor 0
    r.setHoveredFloor(0);
    for (const mesh of buildingMeshes) {
      const mat = mesh.material as THREE.MeshLambertMaterial;
      if (mesh.userData['floor'] === 0) {
        expect(mat.emissive.getHex()).toBe(0xfbbf24);
        expect(mat.emissiveIntensity).toBe(0.5);
      } else {
        expect(mat.emissive.getHex()).toBe(0x000000);
        expect(mat.emissiveIntensity).toBe(0);
      }
    }

    // Clear hover with null
    r.setHoveredFloor(null);
    for (const mesh of buildingMeshes) {
      const mat = mesh.material as THREE.MeshLambertMaterial;
      expect(mat.emissive.getHex()).toBe(0x000000);
      expect(mat.emissiveIntensity).toBe(0);
    }
  });

  it('transitionToFloor sets ALL building meshes to visible = false', async () => {
    await r.renderBuilding(buildingData);

    const buildingMeshes = r.scene.children.filter(
      (c): c is THREE.Mesh =>
        c instanceof THREE.Mesh && c.userData['type'] === 'building',
    );
    expect(buildingMeshes.length).toBe(12);
    expect(buildingMeshes.every((m) => m.visible)).toBe(true);

    await r.transitionToFloor(1);

    expect(buildingMeshes.every((m) => m.visible === false)).toBe(true);
    expect(r.camera.zoom).toBe(1.215);

    const yawRad = THREE.MathUtils.degToRad(45);
    const pitchRad = THREE.MathUtils.degToRad(35.264);
    const distance = (r as any).frustumSize * 1.5;
    expect(r.camera.position.x).toBeCloseTo(distance * Math.sin(yawRad) * Math.cos(pitchRad), 4);
    expect(r.camera.position.y).toBeCloseTo(distance * Math.sin(pitchRad), 4);
    expect(r.camera.position.z).toBeCloseTo(distance * Math.cos(yawRad) * Math.cos(pitchRad), 4);
  });

  it('transitionToBuilding restores visible = true for all building meshes', async () => {
    await r.renderBuilding(buildingData);

    const buildingMeshes = r.scene.children.filter(
      (c): c is THREE.Mesh =>
        c instanceof THREE.Mesh && c.userData['type'] === 'building',
    );

    await r.transitionToFloor(1);
    expect(buildingMeshes.every((m) => m.visible === false)).toBe(true);

    await r.transitionToBuilding();
    expect(buildingMeshes.every((m) => m.visible === true)).toBe(true);
    expect(r.camera.zoom).toBe(1);

    const bYawRad = THREE.MathUtils.degToRad(45);
    const bPitchRad = THREE.MathUtils.degToRad(35.264);
    const bDistance = (r as any).frustumSize * 2;
    expect(r.camera.position.x).toBeCloseTo(bDistance * Math.sin(bYawRad) * Math.cos(bPitchRad), 4);
    expect(r.camera.position.y).toBeCloseTo(bDistance * Math.sin(bPitchRad), 4);
    expect(r.camera.position.z).toBeCloseTo(bDistance * Math.cos(bYawRad) * Math.cos(bPitchRad), 4);
  });
});

describe('ThreeGameRenderer — per-room NoticeBadge positioning, bindRoomIds & projection', () => {
  let r: ThreeGameRenderer;

  beforeEach(() => {
    r = new ThreeGameRenderer({ width: 800, height: 600 });
  });

  afterEach(() => r.dispose());

  function buildMappings() {
    const mappings: Array<{
      roomId: string;
      floorIndex: number;
      roomIndex: number;
      roomNumber: string;
    }> = [];
    for (let f = 0; f < 3; f++) {
      for (let roomIdx = 0; roomIdx < 4; roomIdx++) {
        const roomNumber = `P${f + 1}0${roomIdx + 1}`;
        mappings.push({
          roomId: `uuid-${roomNumber.toLowerCase()}`,
          floorIndex: f,
          roomIndex: roomIdx,
          roomNumber,
        });
      }
    }
    return mappings;
  }

  it('does not spawn exterior NoticeBadge in main scene for room notices or broken devices', async () => {
    const rClean = new ThreeGameRenderer({ canvas: document.createElement('canvas'), width: 800, height: 600 });
    await rClean.renderBuilding({
      propertyId: 'p-clean-test',
      totalFloors: 3,
      roomsPerFloor: 4,
      position: { x: 0, y: 0, z: 0 },
    });
    rClean.bindRoomIds([{ roomId: 'r-1', floorIndex: 0, roomIndex: 0 }]);
    rClean.setRoomNotice('r-1', 'PAYMENT_DUE');
    rClean.setDeviceStatus('r-1', 'd-1', 'BROKEN');

    // Kiểm tra scene chính không có bất kỳ NoticeBadge nào
    const exteriorBadges = rClean.scene.children.filter((c) => c.name.startsWith('NoticeBadge_'));
    expect(exteriorBadges.length).toBe(0);

    // Nhưng khối phòng vẫn đổi màu cảnh báo
    const mesh = (rClean as any).findRoomMesh('r-1');
    expect(mesh.material.color.getHex()).toBe(0xef4444);
    rClean.dispose();
  });

  it('updates room material colors without spawning exterior NoticeBadge for P101 and P204', async () => {
    await r.renderBuilding(buildingData);
    const mappings = buildMappings();
    r.bindRoomIds(mappings);

    r.setRoomNotice('uuid-p101', 'PAYMENT_DUE');
    r.setDeviceStatus('uuid-p204', 'ac', 'BROKEN');

    const p101Badge = r.getNoticeBadge('room:uuid-p101');
    const p204Badge = r.getNoticeBadge('device:uuid-p204:ac');

    // No exterior badges in scene or badges map
    expect(p101Badge).toBeUndefined();
    expect(p204Badge).toBeUndefined();
    const exteriorBadges = r.scene.children.filter((c) => c.name.startsWith('NoticeBadge_'));
    expect(exteriorBadges).toHaveLength(0);

    const p101Mesh = r.findRoomMesh('uuid-p101')!;
    const p204Mesh = r.findRoomMesh('uuid-p204')!;
    expect(p101Mesh).toBeDefined();
    expect(p204Mesh).toBeDefined();
    expect(p101Mesh.userData['legacyRoomId']).toBe('room-1');
    expect(p101Mesh.userData['roomNumber']).toBe('P101');
    expect(p204Mesh.userData['roomNumber']).toBe('P204');

    // Room material colors: P101 yellow tint (#f59e0b), P204 red (#ef4444), P104 unchanged
    const p104Mesh = r.findRoomMesh('uuid-p104')!;
    expect((p101Mesh.material as THREE.MeshLambertMaterial).color.getHex()).toBe(0xf59e0b);
    expect((p101Mesh.material as THREE.MeshLambertMaterial).emissive.getHex()).toBe(0x331a00);
    expect(p101Mesh.receiveShadow).toBe(false);

    expect((p204Mesh.material as THREE.MeshLambertMaterial).color.getHex()).toBe(0xef4444);
    expect((p204Mesh.material as THREE.MeshLambertMaterial).emissive.getHex()).toBe(0x3b0707);
    expect(p204Mesh.receiveShadow).toBe(false);

    expect((p104Mesh.material as THREE.MeshLambertMaterial).color.getHex()).toBe(
      p104Mesh.userData['baseColor'],
    );
    expect(p104Mesh.receiveShadow).toBe(true);

    // Clearing notice restores P101 baseColor and removes badge
    r.setRoomNotice('uuid-p101', 'NONE');
    expect(r.getNoticeBadge('room:uuid-p101')).toBeUndefined();
    expect((p101Mesh.material as THREE.MeshLambertMaterial).color.getHex()).toBe(
      p101Mesh.userData['baseColor'],
    );
    expect((p101Mesh.material as THREE.MeshLambertMaterial).emissive.getHex()).toBe(0x000000);
    expect(p101Mesh.receiveShadow).toBe(true);
  });

  it('getProjectedRoomPositions returns distinct (x, y) pixel coordinates for every room', async () => {
    await r.renderBuilding(buildingData);
    r.bindRoomIds(buildMappings());

    const projected = r.getProjectedRoomPositions(800, 600);
    expect(projected).toHaveLength(12);

    const coordKeys = new Set(
      projected.map((p) => `${Math.round(p.x)}:${Math.round(p.y)}`),
    );
    expect(coordKeys.size).toBe(12);

    const p101 = projected.find((p) => p.roomNumber === 'P101');
    const p204 = projected.find((p) => p.roomNumber === 'P204');
    expect(p101).toBeDefined();
    expect(p204).toBeDefined();
    expect(p101!.roomId).toBe('uuid-p101');
    expect(p204!.roomId).toBe('uuid-p204');
    expect(p101!.x).not.toBeCloseTo(p204!.x, 1);
    expect(p101!.y).not.toBeCloseTo(p204!.y, 1);
  });

  it('configures alert room meshes with vibrant emissive and disables receiveShadow', async () => {
    const r2 = new ThreeGameRenderer({ canvas: document.createElement('canvas'), width: 800, height: 600 });
    await r2.renderBuilding({
      propertyId: 'p-shadow-test',
      totalFloors: 3,
      roomsPerFloor: 4,
      position: { x: 0, y: 0, z: 0 },
    });
    r2.bindRoomIds([{ roomId: 'room-broken', floorIndex: 1, roomIndex: 1 }]);
    r2.setDeviceStatus('room-broken', 'd1', 'BROKEN');

    const brokenMesh = (r2 as any).findRoomMesh('room-broken');
    expect(brokenMesh).toBeDefined();
    expect(brokenMesh.receiveShadow).toBe(false);
    expect(brokenMesh.castShadow).toBe(true);
    expect(brokenMesh.material.emissive.getHex()).toBe(0x3b0707);
  });

  it('anchors notice badges accurately to target room mesh without spilling into front rooms', async () => {
    const r2 = new ThreeGameRenderer({ canvas: document.createElement('canvas'), width: 800, height: 600 });
    await r2.renderBuilding({
      propertyId: 'p-anchor-test',
      totalFloors: 3,
      roomsPerFloor: 4,
      position: { x: 0, y: 0, z: 0 },
      blockGrid: { cols: 2, rows: 2 },
    } as any);

    r2.bindRoomIds([
      { roomId: 'room-back', floorIndex: 1, roomIndex: 0 }, // Row 0 (hàng sau)
      { roomId: 'room-front', floorIndex: 1, roomIndex: 2 }, // Row 1 (hàng trước)
    ]);

    const backAnchor = r2.getRoomBadgeAnchor('room-back', 'ROOM_NOTICE');
    const backMesh = (r2 as any).findRoomMesh('room-back');
    // Anchor phòng hàng sau phải neo trên đỉnh/thân của chính nó, không vượt sang z của hàng trước
    expect(Math.abs(backAnchor.z - backMesh.position.z)).toBeLessThan(0.3);

    const frontAnchor = r2.getRoomBadgeAnchor('room-front', 'ROOM_NOTICE');
    const frontMesh = (r2 as any).findRoomMesh('room-front');
    // Anchor phòng hàng trước neo ra mặt trước
    expect(frontAnchor.z).toBeGreaterThan(frontMesh.position.z);
  });

  it('preserves room mesh alert status without exterior badges when building layout is re-rendered', async () => {
    const r2 = new ThreeGameRenderer({ canvas: document.createElement('canvas'), width: 800, height: 600 });
    await r2.renderBuilding({
      propertyId: 'p-reposition-test',
      totalFloors: 2,
      roomsPerFloor: 4,
      position: { x: 0, y: 0, z: 0 },
      blockGrid: { cols: 2, rows: 2 },
    } as any);

    r2.bindRoomIds([
      { roomId: 'room-target', floorIndex: 0, roomIndex: 0 },
    ]);
    r2.setRoomNotice('room-target', 'PAYMENT_DUE');

    const badgeBefore = r2.getNoticeBadge('room:room-target');
    expect(badgeBefore).toBeUndefined();
    const targetMeshBefore = (r2 as any).findRoomMesh('room-target');
    expect((targetMeshBefore.material as THREE.MeshLambertMaterial).color.getHex()).toBe(0xf59e0b);

    // Re-render building at a different position
    await r2.renderBuilding({
      propertyId: 'p-reposition-test',
      totalFloors: 2,
      roomsPerFloor: 4,
      position: { x: 10, y: 5, z: 10 },
      blockGrid: { cols: 2, rows: 2 },
    } as any);
    r2.bindRoomIds([
      { roomId: 'room-target', floorIndex: 0, roomIndex: 0 },
    ]);

    const badgeAfter = r2.getNoticeBadge('room:room-target');
    expect(badgeAfter).toBeUndefined();
    const targetMeshAfter = (r2 as any).findRoomMesh('room-target');
    expect(targetMeshAfter).toBeDefined();
    expect(targetMeshAfter.position.x).toBeGreaterThan(8);
    expect((targetMeshAfter.material as THREE.MeshLambertMaterial).color.getHex()).toBe(0xf59e0b);

    const exteriorBadges = r2.scene.children.filter((c) => c.name.startsWith('NoticeBadge_'));
    expect(exteriorBadges).toHaveLength(0);
    r2.dispose();
  });
});
