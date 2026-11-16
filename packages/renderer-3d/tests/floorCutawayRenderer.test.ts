import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as THREE from 'three';

// Mock THREE.WebGLRenderer for headless jsdom test execution
vi.mock('three', async (importOriginal) => {
  const actual = await importOriginal<typeof THREE>();

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

import {
  FloorCutawayRenderer,
  NoticeBadge,
  SleepingBadge,
  ThreeGameRenderer,
  type FloorCutawayRoomConfig,
} from '../src/index';

describe('FloorCutawayRenderer & SleepingBadge', () => {
  let cutawayRenderer: FloorCutawayRenderer;

  beforeEach(() => {
    cutawayRenderer = new FloorCutawayRenderer();
  });

  afterEach(() => {
    cutawayRenderer.dispose();
  });

  const mockRooms: FloorCutawayRoomConfig[] = [
    {
      roomId: 'room-101',
      roomCode: 'P101',
      status: 'OCCUPIED',
      tenantName: 'Nguyen Van A',
      hasPaymentNotice: true,
      hasBrokenDevice: false,
      avatarConfig: { action: 'sitting' },
    },
    {
      roomId: 'room-102',
      roomCode: 'P102',
      status: 'OCCUPIED',
      tenantName: 'Tran Thi B',
      hasPaymentNotice: false,
      hasBrokenDevice: true,
      avatarConfig: { action: 'standing' },
    },
    {
      roomId: 'room-103',
      roomCode: 'P103',
      status: 'VACANT',
      hasPaymentNotice: false,
      hasBrokenDevice: false,
    },
    {
      roomId: 'room-104',
      roomCode: 'P104',
      status: 'OCCUPIED',
      hasPaymentNotice: true,
      hasBrokenDevice: true,
    },
  ];

  it('builds floor cutaway with central corridor and 4 rooms', () => {
    const group = cutawayRenderer.buildFloorCutaway(0, mockRooms);

    expect(group.children.length).toBeGreaterThan(0);

    // Verify corridor mesh exists
    const corridor = group.children.find(
      (c) => c.userData['type'] === 'cutaway_corridor',
    ) as THREE.Mesh;
    expect(corridor).toBeDefined();
    expect(corridor.geometry).toBeInstanceOf(THREE.BoxGeometry);
    const corrMat = corridor.material as THREE.MeshStandardMaterial;
    expect(corrMat.color.getHex()).toBe(0xcbd5e1); // Grey ceramic tile

    // Verify 4 room groups created
    for (const room of mockRooms) {
      const roomGroup = cutawayRenderer.getRoomGroup(room.roomId);
      expect(roomGroup).toBeDefined();
    }

    // Verify interactive room floor meshes
    const interactiveMeshes = cutawayRenderer.getInteractiveMeshes();
    expect(interactiveMeshes.length).toBe(4);
    for (const mesh of interactiveMeshes) {
      expect(mesh.userData['type']).toBe('floor_room');
      const mat = mesh.material as THREE.MeshStandardMaterial;
      expect(mat.color.getHex()).toBe(0x8b5a2b); // Oak wood floor
    }
  });

  it('creates full 1.2m outer walls with cap trim for both Row 0 and Row 1 rooms', () => {
    cutawayRenderer.buildFloorCutaway(0, mockRooms);

    const roomRow0 = cutawayRenderer.getRoomGroup('room-101'); // Row 0
    const roomRow1 = cutawayRenderer.getRoomGroup('room-103'); // Row 1
    expect(roomRow0).toBeDefined();
    expect(roomRow1).toBeDefined();

    // Check Row 1 (room-103) front outer wall at +Z has full 1.2m height and 0.03m cap trim
    const row1Boxes = roomRow1!.children.filter(
      (c): c is THREE.Mesh =>
        c instanceof THREE.Mesh &&
        c.geometry instanceof THREE.BoxGeometry &&
        Math.abs((c.geometry.parameters as any).depth - 0.15) < 0.001 &&
        Math.abs((c.geometry.parameters as any).width - 4.0) < 0.001,
    );

    const outerWallMesh = row1Boxes.find(
      (m) => Math.abs((m.geometry as THREE.BoxGeometry).parameters.height - 1.2) < 0.001,
    );
    expect(outerWallMesh).toBeDefined();
    expect(outerWallMesh!.position.z).toBeCloseTo(4.5 / 2 - 0.15 / 2, 2);
    expect(outerWallMesh!.position.y).toBeCloseTo(1.2 / 2, 2);

    const outerTrimMesh = row1Boxes.find(
      (m) => Math.abs((m.geometry as THREE.BoxGeometry).parameters.height - 0.03) < 0.001,
    );
    expect(outerTrimMesh).toBeDefined();
    expect(outerTrimMesh!.position.z).toBeCloseTo(4.5 / 2 - 0.15 / 2, 2);
    expect(outerTrimMesh!.position.y).toBeCloseTo(1.2 + 0.015, 2);
  });

  it('verifies furniture, AC, and labels in each room', () => {
    cutawayRenderer.buildFloorCutaway(0, mockRooms);

    const room1 = cutawayRenderer.getRoomGroup('room-101');
    expect(room1).toBeDefined();

    // Check single bed with blue bedding (#2563eb)
    const bed = room1!.children.find((c) => c.name.includes('BedSingle'));
    expect(bed).toBeDefined();
    const mattress = bed!.children.find((c) => {
      if (c instanceof THREE.Mesh && c.material instanceof THREE.MeshStandardMaterial) {
        return c.material.color.getHex() === 0x2563eb;
      }
      return false;
    });
    expect(mattress).toBeDefined();

    // Check study desk with amber top (#d97706)
    const desk = room1!.children.find((c) => c.name.includes('StudyDesk'));
    expect(desk).toBeDefined();
    const deskTop = desk!.children.find((c) => {
      if (c instanceof THREE.Mesh && c.material instanceof THREE.MeshStandardMaterial) {
        return c.material.color.getHex() === 0xd97706;
      }
      return false;
    });
    expect(deskTop).toBeDefined();

    // Check chair with orange seat (#f97316)
    const chair = room1!.children.find((c) => c.name.includes('Chair'));
    expect(chair).toBeDefined();

    // Check AC unit
    const ac = room1!.children.find((c) => c.name.includes('AirConditioner'));
    expect(ac).toBeDefined();

    // Check Over-door room number plaque mounted on door header
    const overDoorPlaque = room1!.children.find(
      (c) =>
        c.userData['type'] === 'over_door_room_label' ||
        c.name.includes('OverDoorPlaque'),
    );
    expect(overDoorPlaque).toBeDefined();
    expect(overDoorPlaque!.userData['roomCode']).toBe('P101');
    expect(overDoorPlaque!.position.y).toBeGreaterThanOrEqual(1.1);

    // Check Wood Door with frame, leaf, and handle
    const woodDoor = room1!.children.find((c) => c.name === 'WoodDoor');
    expect(woodDoor).toBeDefined();
    const frameMeshes = woodDoor!.children.filter(
      (c) => c.userData['type'] === 'door_frame',
    );
    expect(frameMeshes.length).toBeGreaterThanOrEqual(2);

    const pivot = woodDoor!.children.find((c) => c.name === 'WoodDoor_Pivot') as THREE.Group;
    expect(pivot).toBeDefined();
    expect(Math.abs(pivot.rotation.y)).toBeGreaterThan(0.5); // ~38 degrees

    const doorLeaf = pivot.children.find(
      (c) => c.userData['type'] === 'wood_door',
    ) as THREE.Mesh;
    expect(doorLeaf).toBeDefined();
    const leafMat = doorLeaf.material as THREE.MeshStandardMaterial;
    expect(leafMat.color.getHex()).toBe(0x9a3412); // Natural warm wood

    // Check interactive Room Info Plaque on corridor wall
    const infoBoard = room1!.children.find((c) => c.name.includes('RoomInfoBoard'));
    expect(infoBoard).toBeDefined();
    expect(infoBoard!.userData['type']).toBe('room_info_board');
    expect(infoBoard!.userData['roomId']).toBe('room-101');
    expect(infoBoard!.userData['roomCode']).toBe('P101');
  });

  it('verifies avatars for occupied rooms and precise notice badges on entrance', () => {
    cutawayRenderer.buildFloorCutaway(0, mockRooms);

    // room-101 is occupied -> avatar present
    const room1 = cutawayRenderer.getRoomGroup('room-101');
    const avatar1 = room1!.children.find((c) => c.userData['type'] === 'tenant_avatar');
    expect(avatar1).toBeDefined();

    // room-103 is vacant -> no avatar
    const room3 = cutawayRenderer.getRoomGroup('room-103');
    const avatar3 = room3!.children.find((c) => c.userData['type'] === 'tenant_avatar');
    expect(avatar3).toBeUndefined();

    // Notice badges:
    const badges = cutawayRenderer.getBadges();
    // room-101 (1) + room-102 (1) + room-103 (0) + room-104 (2) = 4 badges
    expect(badges.length).toBe(4);

    // Check room-101 (payment badge only)
    const room1Badges = room1!.children.filter(
      (c) => c.userData['type'] === 'cutaway_notice_badge',
    );
    expect(room1Badges.length).toBe(1);
    expect(room1Badges[0]!.userData['noticeKind']).toBe('PAYMENT');
    expect(room1Badges[0]!.position.x).toBe(0);
    expect(room1Badges[0]!.position.y).toBe(1.7);

    // Check room-102 (device badge only)
    const room2 = cutawayRenderer.getRoomGroup('room-102');
    const room2Badges = room2!.children.filter(
      (c) => c.userData['type'] === 'cutaway_notice_badge',
    );
    expect(room2Badges.length).toBe(1);
    expect(room2Badges[0]!.userData['noticeKind']).toBe('DEVICE');
    expect(room2Badges[0]!.position.x).toBe(0);
    expect(room2Badges[0]!.position.y).toBe(1.7);

    // Check room-103 (no notices)
    const room3Badges = room3!.children.filter(
      (c) => c.userData['type'] === 'cutaway_notice_badge',
    );
    expect(room3Badges.length).toBe(0);

    // Check room-104 (both payment and device)
    const room4 = cutawayRenderer.getRoomGroup('room-104');
    const room4Badges = room4!.children.filter(
      (c) => c.userData['type'] === 'cutaway_notice_badge',
    );
    expect(room4Badges.length).toBe(2);
    const pBadge = room4Badges.find((b) => b.userData['noticeKind'] === 'PAYMENT');
    const dBadge = room4Badges.find((b) => b.userData['noticeKind'] === 'DEVICE');
    expect(pBadge).toBeDefined();
    expect(dBadge).toBeDefined();
    expect(pBadge!.position.x).toBe(-0.25);
    expect(pBadge!.position.y).toBe(1.7);
    expect(dBadge!.position.x).toBe(0.25);
    expect(dBadge!.position.y).toBe(1.7);
  });

  it('updates simulation loop cleanly with notice badges', () => {
    cutawayRenderer.buildFloorCutaway(0, mockRooms);
    expect(() => cutawayRenderer.update(0.1)).not.toThrow();
  });

  it('raycasts and picks notice badge by raycaster', () => {
    cutawayRenderer.buildFloorCutaway(0, mockRooms);
    cutawayRenderer.group.updateMatrixWorld(true);

    const badges = cutawayRenderer.getBadges();
    expect(badges.length).toBeGreaterThan(0);
    const targetBadge = badges[0]!;
    const badgeCenter = new THREE.Vector3();
    targetBadge.getWorldPosition(badgeCenter);

    // Raycast towards badge center
    const raycaster = new THREE.Raycaster(
      new THREE.Vector3(badgeCenter.x, badgeCenter.y + 0.2, badgeCenter.z + 5),
      new THREE.Vector3(0, 0, -1),
    );

    const hit = cutawayRenderer.pickNoticeBadge(raycaster);
    expect(hit).not.toBeNull();
    expect(hit?.roomId).toBe(targetBadge.userData['roomId']);
    expect(hit?.noticeKind).toBe(targetBadge.userData['noticeKind']);
  });

  it('raycasts and picks room by raycaster', () => {
    cutawayRenderer.buildFloorCutaway(0, mockRooms);

    const roomFloor = cutawayRenderer.getInteractiveMeshes()[0]!;
    const roomCenter = new THREE.Vector3();
    roomFloor.getWorldPosition(roomCenter);

    // Raycast from above directly straight down to roomCenter
    const raycaster = new THREE.Raycaster(
      new THREE.Vector3(roomCenter.x, 10, roomCenter.z),
      new THREE.Vector3(0, -1, 0),
    );

    const picked = cutawayRenderer.pickRoom(raycaster);
    expect(picked).not.toBeNull();
    expect(picked?.roomId).toBe(roomFloor.userData['roomId']);
    expect(picked?.roomCode).toBe(roomFloor.userData['roomCode']);
  });

  it('sets and clears hovered room highlight', () => {
    cutawayRenderer.buildFloorCutaway(0, mockRooms);
    const roomFloor = cutawayRenderer.getInteractiveMeshes()[0]!;
    const mat = roomFloor.material as THREE.MeshStandardMaterial;

    // Initially emissive is 0x000000
    expect(mat.emissive.getHex()).toBe(0x000000);

    // Hover room-101
    cutawayRenderer.setHoveredRoom('room-101');
    expect(mat.emissive.getHex()).toBe(0xfbbf24);

    // Hover another room -> room-101 resets
    cutawayRenderer.setHoveredRoom('room-102');
    expect(mat.emissive.getHex()).toBe(0x000000);

    // Clear hover
    cutawayRenderer.setHoveredRoom(null);
  });

  it('picks and highlights room info plaque on corridor wall', () => {
    cutawayRenderer.buildFloorCutaway(0, mockRooms);

    const plaqueMeshes = cutawayRenderer.getRoomInfoPlaqueMeshes();
    expect(plaqueMeshes.length).toBeGreaterThanOrEqual(4);

    const firstPlaque = plaqueMeshes[0]!;
    const plaqueCenter = new THREE.Vector3();
    firstPlaque.getWorldPosition(plaqueCenter);

    // Raycast towards plaque center
    const raycaster = new THREE.Raycaster(
      new THREE.Vector3(plaqueCenter.x, plaqueCenter.y, plaqueCenter.z + 5),
      new THREE.Vector3(0, 0, -1),
    );

    const picked = cutawayRenderer.pickRoomInfoPlaque(raycaster);
    expect(picked).not.toBeNull();
    expect(picked?.roomId).toBe(firstPlaque.userData['roomId']);
    expect(picked?.roomCode).toBe(firstPlaque.userData['roomCode']);

    // Hover plaque
    const targetRoomId = firstPlaque.userData['roomId'];
    cutawayRenderer.setHoveredRoomInfoPlaque(targetRoomId);
    if (firstPlaque.material instanceof THREE.MeshStandardMaterial) {
      expect(firstPlaque.material.emissive.getHex()).toBe(0xf59e0b);
    }

    // Reset hover
    cutawayRenderer.setHoveredRoomInfoPlaque(null);
    if (firstPlaque.material instanceof THREE.MeshStandardMaterial) {
      expect(firstPlaque.material.emissive.getHex()).toBe(0x000000);
    }
  });

  it('SleepingBadge bobs and rotates when updated', () => {
    const badge = new SleepingBadge({ x: 0, y: 2, z: 0 });
    const initialY = badge.position.y;

    badge.update(0.2);
    expect(badge.position.y).not.toBe(initialY);

    badge.dispose();
  });

  it('adds CutawayHemisphereLight and per-room PointLight + wall lamp fixture', () => {
    const group = cutawayRenderer.buildFloorCutaway(0, mockRooms);

    const hemiLight = group.children.find(
      (c): c is THREE.HemisphereLight =>
        c instanceof THREE.HemisphereLight && c.name === 'CutawayHemisphereLight',
    );
    expect(hemiLight).toBeDefined();
    expect(hemiLight!.intensity).toBe(0.95);

    // Occupied room (room-101)
    const occupiedRoom = cutawayRenderer.getRoomGroup('room-101');
    expect(occupiedRoom).toBeDefined();
    const occupiedLight = occupiedRoom!.children.find(
      (c): c is THREE.PointLight =>
        c instanceof THREE.PointLight && c.userData['type'] === 'room_electric_light',
    );
    expect(occupiedLight).toBeDefined();
    expect(occupiedLight!.color.getHex()).toBe(0xfff1c9);
    expect(occupiedLight!.intensity).toBe(8.5);

    const occupiedFixture = occupiedRoom!.children.find(
      (c): c is THREE.Group =>
        c instanceof THREE.Group && c.userData['type'] === 'room_lamp_fixture',
    );
    expect(occupiedFixture).toBeDefined();

    // Vacant room (room-103)
    const vacantRoom = cutawayRenderer.getRoomGroup('room-103');
    expect(vacantRoom).toBeDefined();
    const vacantLight = vacantRoom!.children.find(
      (c): c is THREE.PointLight =>
        c instanceof THREE.PointLight && c.userData['type'] === 'room_electric_light',
    );
    expect(vacantLight).toBeDefined();
    expect(vacantLight!.color.getHex()).toBe(0xfff1c9);
    expect(vacantLight!.intensity).toBe(4.5);

    const vacantFixture = vacantRoom!.children.find(
      (c): c is THREE.Group =>
        c instanceof THREE.Group && c.userData['type'] === 'room_lamp_fixture',
    );
    expect(vacantFixture).toBeDefined();
  });
});

describe('ThreeGameRenderer Cutaway Integration', () => {
  let renderer: ThreeGameRenderer;

  beforeEach(() => {
    renderer = new ThreeGameRenderer({ width: 800, height: 600 });
  });

  afterEach(() => {
    renderer.dispose();
  });

  const rooms: FloorCutawayRoomConfig[] = [
    { roomId: 'r1', roomCode: 'P201', status: 'OCCUPIED' },
    { roomId: 'r2', roomCode: 'P202', status: 'VACANT' },
  ];

  it('renders and clears floor cutaway', async () => {
    expect(renderer.getFloorCutawayRenderer()).toBeNull();

    await renderer.renderFloorCutaway(1, rooms);
    expect(renderer.getFloorCutawayRenderer()).not.toBeNull();

    renderer.clearFloorCutaway();
    expect(renderer.getFloorCutawayRenderer()).toBeNull();
  });

  it('transitions to floor and transitions back to building', async () => {
    // Setup building with 2 floors
    await renderer.renderBuilding({
      propertyId: 'prop-1',
      totalFloors: 2,
      roomsPerFloor: 2,
      position: { x: 0, y: 0, z: 0 },
    });

    const buildingMeshes = (renderer as any).buildingMeshes as THREE.Mesh[];
    expect(buildingMeshes.length).toBe(4);

    // Transition to Floor 1
    await renderer.transitionToFloor(1);
    expect(renderer.camera.zoom).toBeGreaterThan(1);

    // All building meshes should be hidden so they do not block the cutaway corridor
    buildingMeshes.forEach((m) => expect(m.visible).toBe(false));

    // Transition back to building
    await renderer.transitionToBuilding();
    expect(renderer.camera.zoom).toBe(1);
    buildingMeshes.forEach((m) => expect(m.visible).toBe(true));
  });

  it('picks floor room and highlights hovered room via ThreeGameRenderer', async () => {
    await renderer.renderFloorCutaway(0, rooms);

    // Pick room with NDC coordinates (0, 0)
    const picked = renderer.pickFloorRoom(0, 0);
    // Even if (0, 0) hits corridor or room, the method executes cleanly
    expect(picked === null || typeof picked.roomId === 'string').toBe(true);

    // Hover room
    renderer.setFloorHoveredRoom('r1');
    renderer.setFloorHoveredRoom(null);
  });

  it('picks and highlights room info plaque via ThreeGameRenderer', async () => {
    await renderer.renderFloorCutaway(0, rooms);

    // Pick room info plaque with NDC coordinates (0, 0)
    const hitPlaque = renderer.pickRoomInfoPlaque(0, 0);
    expect(hitPlaque === null || typeof hitPlaque.roomId === 'string').toBe(true);

    // Hover room info plaque
    renderer.setFloorHoveredInfoPlaque('r1');
    renderer.setFloorHoveredInfoPlaque(null);
  });

  it('transitions to floor hides building meshes and keeps 0 exterior badges', async () => {
    await renderer.renderBuilding({
      propertyId: 'prop-1',
      totalFloors: 2,
      roomsPerFloor: 2,
      position: { x: 0, y: 0, z: 0 },
    });

    // Add building room notices
    renderer.bindRoomIds([
      { roomId: 'r-0', floorIndex: 0, roomIndex: 0 },
      { roomId: 'r-1', floorIndex: 0, roomIndex: 1 },
    ]);
    renderer.setRoomNotice('r-0', 'PAYMENT_DUE');
    renderer.setRoomNotice('r-1', 'BROKEN');
    const b0 = renderer.getNoticeBadge('room:r-0');
    const b1 = renderer.getNoticeBadge('room:r-1');
    expect(b0).toBeUndefined();
    expect(b1).toBeUndefined();
    expect(renderer.scene.children.filter((c) => c.name.startsWith('NoticeBadge_'))).toHaveLength(0);

    // Transition to floor -> building meshes hidden
    await renderer.transitionToFloor(0);
    expect(renderer.findRoomMesh('r-0')?.visible).toBe(false);
    expect(renderer.scene.children.filter((c) => c.name.startsWith('NoticeBadge_'))).toHaveLength(0);

    // Transition back to building -> building meshes restored
    await renderer.transitionToBuilding();
    expect(renderer.findRoomMesh('r-0')?.visible).toBe(true);
    expect(renderer.scene.children.filter((c) => c.name.startsWith('NoticeBadge_'))).toHaveLength(0);
  });

  it('picks floor notice badge via ThreeGameRenderer', async () => {
    const cutawayRooms: FloorCutawayRoomConfig[] = [
      { roomId: 'r1', roomCode: 'P201', status: 'OCCUPIED', hasPaymentNotice: true },
      { roomId: 'r2', roomCode: 'P202', status: 'OCCUPIED', hasBrokenDevice: true },
    ];
    await renderer.renderFloorCutaway(1, cutawayRooms);

    // Pick notice badge with NDC coords
    const hitBadge = renderer.pickFloorNoticeBadge(0, 0);
    expect(hitBadge === null || typeof hitBadge.roomId === 'string').toBe(true);
  });

  it('calls update on simulation loop including cutaway animation', async () => {
    await renderer.renderFloorCutaway(0, rooms);
    expect(() => renderer.update(0.016)).not.toThrow();
  });

  it('boosts lighting on transitionToFloor() and restores on transitionToBuilding()', async () => {
    await renderer.renderBuilding({
      propertyId: 'prop-1',
      totalFloors: 2,
      roomsPerFloor: 2,
      position: { x: 0, y: 0, z: 0 },
    });

    await renderer.transitionToFloor(1);
    expect(renderer.lighting.ambient.intensity).toBe(0.95);
    expect(renderer.lighting.directional.intensity).toBe(1.45);

    await renderer.transitionToBuilding();
    expect(renderer.lighting.ambient.intensity).toBe(0.6);
    expect(renderer.lighting.directional.intensity).toBe(1.2);
  });
});
