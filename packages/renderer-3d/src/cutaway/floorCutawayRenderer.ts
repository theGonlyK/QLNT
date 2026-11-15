import * as THREE from 'three';
import { NoticeBadge, type NoticeBadgeType } from '../badges/noticeBadge';
import type { AssetLoader } from '../loaders/assetLoader';

export interface FloorCutawayRoomConfig {
  roomId: string;
  roomCode?: string;
  roomNumber?: string;
  status?: 'OCCUPIED' | 'VACANT' | 'MAINTENANCE' | string;
  areaSqm?: number;
  tenantName?: string;
  hasPaymentNotice?: boolean;
  hasBrokenDevice?: boolean;
  noticeType?: 'PAYMENT_DUE' | 'BILL_PENDING' | 'BROKEN' | 'NONE' | string;
  avatarConfig?: {
    modelId?: string;
    action?: 'sitting' | 'standing' | 'sleeping';
  };
  [key: string]: unknown;
}

export interface PickedFloorRoom {
  roomId: string;
  roomCode: string;
  roomIndex: number;
  floorIndex: number;
}

export interface PickedRoomInfoPlaque {
  roomId: string;
  roomCode: string;
}

export interface PickedFloorNoticeBadge {
  roomId: string;
  noticeKind: 'PAYMENT' | 'DEVICE';
}

export interface FloorCutawayRendererOptions {
  assetLoader?: AssetLoader;
  wallHeight?: number;
  roomWidth?: number;
  roomDepth?: number;
  corridorWidth?: number;
}

/**
 * 3D Floating "Z Z" Sleeping / Vacant Badge.
 * Features procedural 3D stylized "Z" letters that gently bob and rotate.
 */
export class SleepingBadge extends THREE.Group {
  private baseY: number = 0;
  private elapsed: number = 0;
  public bobbingSpeed: number = 2.2;
  public bobbingAmplitude: number = 0.08;
  public rotationSpeed: number = 0.6;

  private readonly letterGroup: THREE.Group;
  private readonly auraRing: THREE.Mesh<THREE.TorusGeometry, THREE.MeshBasicMaterial>;

  constructor(initialPosition?: { x: number; y: number; z: number }) {
    super();
    this.name = 'SleepingBadge_ZZ';

    const lavenderColor = 0xa855f7; // Indigo/Purple
    const cyanColor = 0x38bdf8;     // Soft Cyan

    this.letterGroup = new THREE.Group();

    // Helper to create a 3D "Z" letter from three bars
    const createZLetter = (
      scale: number,
      color: number,
      offset: { x: number; y: number; z: number },
    ): THREE.Group => {
      const zGroup = new THREE.Group();
      const barMat = new THREE.MeshStandardMaterial({
        color,
        emissive: color,
        emissiveIntensity: 0.4,
        roughness: 0.3,
      });

      const barThickness = 0.035 * scale;
      const barLength = 0.18 * scale;

      // Top horizontal bar
      const topGeo = new THREE.BoxGeometry(barLength, barThickness, barThickness);
      const topMesh = new THREE.Mesh(topGeo, barMat);
      topMesh.position.set(0, barLength / 2, 0);

      // Diagonal bar
      const diagLength = barLength * 1.35;
      const diagGeo = new THREE.BoxGeometry(diagLength, barThickness, barThickness);
      const diagMesh = new THREE.Mesh(diagGeo, barMat);
      diagMesh.rotation.z = -Math.PI / 4;

      // Bottom horizontal bar
      const botGeo = new THREE.BoxGeometry(barLength, barThickness, barThickness);
      const botMesh = new THREE.Mesh(botGeo, barMat);
      botMesh.position.set(0, -barLength / 2, 0);

      zGroup.add(topMesh, diagMesh, botMesh);
      zGroup.position.set(offset.x, offset.y, offset.z);
      return zGroup;
    };

    // Big 'Z'
    const bigZ = createZLetter(1.0, lavenderColor, { x: -0.06, y: 0.15, z: 0 });
    // Medium 'z'
    const medZ = createZLetter(0.7, cyanColor, { x: 0.12, y: 0.28, z: 0.02 });

    this.letterGroup.add(bigZ, medZ);

    // Glowing aura ring beneath
    const ringGeo = new THREE.TorusGeometry(0.24, 0.012, 8, 24);
    const ringMat = new THREE.MeshBasicMaterial({
      color: cyanColor,
      transparent: true,
      opacity: 0.5,
    });
    this.auraRing = new THREE.Mesh(ringGeo, ringMat);
    this.auraRing.rotation.x = Math.PI / 2;
    this.auraRing.position.y = 0.02;

    this.add(this.letterGroup, this.auraRing);

    if (initialPosition) {
      this.position.set(initialPosition.x, initialPosition.y, initialPosition.z);
      this.baseY = initialPosition.y;
    } else {
      this.baseY = this.position.y;
    }
  }

  update(delta: number): void {
    this.elapsed += delta;
    this.position.y =
      this.baseY + Math.sin(this.elapsed * this.bobbingSpeed) * this.bobbingAmplitude;
    this.letterGroup.rotation.y = Math.sin(this.elapsed * this.rotationSpeed) * 0.2;
    this.auraRing.rotation.z += delta * 0.8;
  }

  dispose(): void {
    this.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.geometry?.dispose();
        if (Array.isArray(obj.material)) {
          obj.material.forEach((m) => m.dispose());
        } else if (obj.material) {
          obj.material.dispose();
        }
      }
    });
  }
}

/**
 * FloorCutawayRenderer — renders an entire building floor in 3D Isometric Cutaway view.
 *
 * Includes:
 * - Half-height cutaway walls (1.2m) with dark frame trim (#1e293b).
 * - Warm oak wood flooring for rooms (#8b5a2b) & grey ceramic tiles for corridor (#cbd5e1).
 * - Room furniture: single bed (#2563eb), study/work desk (#d97706), chair (#f97316), AC on wall.
 * - Tenant avatar for OCCUPIED rooms (chibi sitting at desk or standing).
 * - Badges: Yellow (!) for payment due, Red (!) for broken device, Z Z for vacant/sleeping.
 * - Room labels (e.g. P101..P304).
 * - Raycast picking and hover highlight.
 */
export class FloorCutawayRenderer {
  public readonly group: THREE.Group;
  public readonly assetLoader?: AssetLoader;

  private readonly wallHeight: number;
  private readonly roomWidth: number;
  private readonly roomDepth: number;
  private readonly corridorWidth: number;

  private interactiveMeshes: THREE.Mesh[] = [];
  private roomGroups = new Map<string, THREE.Group>();
  private roomFloorMeshes = new Map<string, THREE.Mesh>();
  private badges: Array<NoticeBadge | SleepingBadge> = [];
  private hoveredRoomKey: string | null = null;
  private roomInfoPlaqueMeshes: THREE.Mesh[] = [];
  private hoveredInfoPlaqueId: string | null = null;

  constructor(options: FloorCutawayRendererOptions = {}) {
    this.group = new THREE.Group();
    this.group.name = 'FloorCutaway_Root';
    this.assetLoader = options.assetLoader;

    this.wallHeight = options.wallHeight ?? 1.2;
    this.roomWidth = options.roomWidth ?? 4.0;
    this.roomDepth = options.roomDepth ?? 4.5;
    this.corridorWidth = options.corridorWidth ?? 1.6;
  }

  /**
   * Builds the entire floor cutaway scene for the given floor index and room configurations.
   */
  buildFloorCutaway(
    floorIndex: number,
    rooms: FloorCutawayRoomConfig[],
  ): THREE.Group {
    this.clear();

    const n = rooms.length;
    if (n === 0) {
      return this.group;
    }

    const wallThickness = 0.15;
    const roomGap = 0.25;
    const m = Math.max(1, Math.ceil(n / 2)); // columns count

    const colStepX = this.roomWidth + roomGap;
    const offsetX = -((m - 1) * colStepX) / 2;

    // 1. Central corridor
    const totalCorridorLength = m * colStepX + 1.2;
    const corridorGeo = new THREE.BoxGeometry(
      totalCorridorLength,
      0.15,
      this.corridorWidth,
    );
    const corridorMat = new THREE.MeshStandardMaterial({
      color: 0xcbd5e1, // Grey ceramic tile
      roughness: 0.6,
      metalness: 0.05,
    });
    const corridorMesh = new THREE.Mesh(corridorGeo, corridorMat);
    corridorMesh.position.set(0, -0.075, 0);
    corridorMesh.receiveShadow = true;
    corridorMesh.userData['type'] = 'cutaway_corridor';
    this.group.add(corridorMesh);

    // 2. Build each room
    for (let i = 0; i < n; i++) {
      const roomConfig = rooms[i]!;
      const row = i < m ? 0 : 1; // row 0: -Z side, row 1: +Z side
      const col = row === 0 ? i : i - m;

      const posX = offsetX + col * colStepX;
      const posZ =
        row === 0
          ? -(this.roomDepth / 2 + this.corridorWidth / 2)
          : +(this.roomDepth / 2 + this.corridorWidth / 2);

      const roomCode =
        roomConfig.roomCode ||
        (roomConfig.roomNumber
          ? roomConfig.roomNumber.startsWith('P')
            ? roomConfig.roomNumber
            : `P${roomConfig.roomNumber}`
          : `P${floorIndex + 1}0${i + 1}`);

      const roomGroup = this.createRoomMeshGroup({
        floorIndex,
        roomIndex: i,
        posX,
        posZ,
        row,
        roomConfig,
        roomCode,
        wallThickness,
      });

      this.group.add(roomGroup);
      this.roomGroups.set(roomConfig.roomId, roomGroup);
    }

    return this.group;
  }

  /**
   * Creates the visual and interactive elements of a single cutaway room.
   */
  private createRoomMeshGroup(params: {
    floorIndex: number;
    roomIndex: number;
    posX: number;
    posZ: number;
    row: number;
    roomConfig: FloorCutawayRoomConfig;
    roomCode: string;
    wallThickness: number;
  }): THREE.Group {
    const {
      floorIndex,
      roomIndex,
      posX,
      posZ,
      row,
      roomConfig,
      roomCode,
      wallThickness,
    } = params;

    const roomGroup = new THREE.Group();
    roomGroup.name = `Room_${roomCode}_${roomConfig.roomId}`;
    roomGroup.position.set(posX, 0, posZ);

    const W = this.roomWidth;
    const D = this.roomDepth;
    const H = this.wallHeight;
    const T = wallThickness;

    // --- A. Oak Wood Floor ---
    const floorGeo = new THREE.BoxGeometry(W, 0.15, D);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x8b5a2b, // Warm oak flooring
      roughness: 0.65,
      metalness: 0.05,
    });
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.position.set(0, -0.075, 0);
    floorMesh.receiveShadow = true;

    // Tag floor mesh for raycasting
    floorMesh.userData = {
      type: 'floor_room',
      roomId: roomConfig.roomId,
      roomCode,
      roomIndex,
      floorIndex,
      baseColor: 0x8b5a2b,
    };
    roomGroup.add(floorMesh);
    this.interactiveMeshes.push(floorMesh);
    this.roomFloorMeshes.set(roomConfig.roomId, floorMesh);
    this.roomFloorMeshes.set(roomCode, floorMesh);
    this.roomFloorMeshes.set(String(roomIndex), floorMesh);

    // --- B. Cutaway Walls (1.2m Height with #1e293b dark trim) ---
    const wallMat = new THREE.MeshStandardMaterial({
      color: 0xe0ded8,
      roughness: 0.85,
    });
    const trimMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.4,
      metalness: 0.2,
    });

    const addWallSegment = (
      width: number,
      height: number,
      depth: number,
      x: number,
      y: number,
      z: number,
    ) => {
      const geo = new THREE.BoxGeometry(width, height, depth);
      const wall = new THREE.Mesh(geo, wallMat);
      wall.position.set(x, y + height / 2, z);
      wall.castShadow = true;
      wall.receiveShadow = true;
      roomGroup.add(wall);

      // Dark top cap trim (0.03m height)
      const trimGeo = new THREE.BoxGeometry(width, 0.03, depth);
      const trim = new THREE.Mesh(trimGeo, trimMat);
      trim.position.set(x, y + height + 0.015, z);
      roomGroup.add(trim);
    };

    // Left wall (-X)
    addWallSegment(T, H, D, -W / 2 + T / 2, 0, 0);
    // Right wall (+X)
    addWallSegment(T, H, D, W / 2 - T / 2, 0, 0);

    if (row === 0) {
      // Row 0 is at -Z (Back row)
      // Back outer wall (-Z): full height 1.2m
      addWallSegment(W, H, T, 0, 0, -D / 2 + T / 2);

      // Corridor wall (+Z): leave a central door opening (1.0m wide)
      const segWidth = (W - 1.0) / 2;
      addWallSegment(segWidth, H, T, -W / 2 + segWidth / 2, 0, D / 2 - T / 2);
      addWallSegment(segWidth, H, T, W / 2 - segWidth / 2, 0, D / 2 - T / 2);
    } else {
      // Row 1 is at +Z (Front row towards camera)
      // Corridor wall (-Z): leave a central door opening
      const segWidth = (W - 1.0) / 2;
      addWallSegment(segWidth, H, T, -W / 2 + segWidth / 2, 0, -D / 2 + T / 2);
      addWallSegment(segWidth, H, T, W / 2 - segWidth / 2, 0, -D / 2 + T / 2);

      // Front outer wall (+Z facing camera): full height 1.2m with dark cap trim, identical to Row 0
      addWallSegment(W, H, T, 0, 0, D / 2 - T / 2);
    }

    // --- C. Wood Door With Handle (Swing ~38 deg into room) ---
    const door = this.createWoodDoor(row);
    if (row === 0) {
      door.position.set(0, 0, D / 2 - T / 2);
    } else {
      door.position.set(0, 0, -D / 2 + T / 2);
    }
    roomGroup.add(door);

    // --- D. Over-door Room Number Plaque (High-Res 512x160 Gold on Slate) ---
    const overDoorPlaque = this.createOverDoorPlaque(roomCode, roomConfig.roomId, row);
    roomGroup.add(overDoorPlaque);

    // --- E. Interactive Room Info Plaque on Corridor Wall (512x320) ---
    const infoBoard = this.createRoomInfoBoard(roomConfig, roomCode, row);
    roomGroup.add(infoBoard);

    // --- F. Furniture Layout ---
    // 1. Single Bed (bedSingle / procedural blue bed #2563eb)
    const bed = this.createBed();
    bed.position.set(-W / 2 + 0.9, 0, row === 0 ? -D / 2 + 1.25 : D / 2 - 1.25);
    roomGroup.add(bed);

    // 2. Study / Work Desk (#d97706)
    const desk = this.createDesk();
    const deskZ = row === 0 ? -D / 2 + 0.65 : D / 2 - 0.65;
    desk.position.set(W / 2 - 1.05, 0, deskZ);
    roomGroup.add(desk);

    // 3. Chair (#f97316)
    const chair = this.createChair();
    const chairZ = row === 0 ? deskZ + 0.65 : deskZ - 0.65;
    chair.position.set(W / 2 - 1.05, 0, chairZ);
    if (row !== 0) {
      chair.rotation.y = Math.PI;
    }
    roomGroup.add(chair);

    // 4. Air Conditioner on wall
    const ac = this.createAirConditioner();
    const acZ = row === 0 ? -D / 2 + T + 0.1 : D / 2 - T - 0.1;
    ac.position.set(0, H - 0.25, acZ);
    if (row !== 0) {
      ac.rotation.y = Math.PI;
    }
    roomGroup.add(ac);

    // --- G. Tenant Chibi Avatar for OCCUPIED rooms ---
    const isOccupied =
      roomConfig.status === 'OCCUPIED' ||
      Boolean(roomConfig.tenantName) ||
      Boolean(roomConfig.avatarConfig);

    if (isOccupied) {
      const action =
        roomConfig.avatarConfig?.action || (roomIndex % 2 === 0 ? 'sitting' : 'standing');
      const avatar = this.createChibiAvatar(action, chairZ, deskZ);
      avatar.userData['type'] = 'tenant_avatar';
      avatar.userData['roomId'] = roomConfig.roomId;
      roomGroup.add(avatar);
    }

    // --- H. Notice Badges (Yellow for Payment, Red for Broken Device) ---
    const hasPayment =
      Boolean(roomConfig.hasPaymentNotice) ||
      (Boolean(roomConfig.noticeType) &&
        roomConfig.noticeType !== 'NONE' &&
        roomConfig.noticeType !== 'BROKEN');
    const hasBroken = Boolean(roomConfig.hasBrokenDevice);
    const hasBoth = hasPayment && hasBroken;

    const doorZ = row === 0 ? D / 2 - T / 2 : -D / 2 + T / 2;

    if (hasPayment) {
      const pType: NoticeBadgeType =
        roomConfig.noticeType === 'BILL_PENDING' || roomConfig.noticeType === 'PAYMENT_DUE'
          ? (roomConfig.noticeType as NoticeBadgeType)
          : 'PAYMENT_DUE';
      const anchorX = hasBoth ? -0.25 : 0;
      const paymentBadge = new NoticeBadge(pType, {
        x: anchorX,
        y: 1.7,
        z: doorZ,
      });
      paymentBadge.userData = {
        type: 'cutaway_notice_badge',
        roomId: roomConfig.roomId,
        noticeKind: 'PAYMENT',
      };
      paymentBadge.traverse((child) => {
        child.userData = { ...paymentBadge.userData };
      });
      this.badges.push(paymentBadge);
      roomGroup.add(paymentBadge);
    }

    if (hasBroken) {
      const anchorX = hasBoth ? 0.25 : 0;
      const brokenBadge = new NoticeBadge('BROKEN', {
        x: anchorX,
        y: 1.7,
        z: doorZ,
      });
      brokenBadge.userData = {
        type: 'cutaway_notice_badge',
        roomId: roomConfig.roomId,
        noticeKind: 'DEVICE',
      };
      brokenBadge.traverse((child) => {
        child.userData = { ...brokenBadge.userData };
      });
      this.badges.push(brokenBadge);
      roomGroup.add(brokenBadge);
    }

    return roomGroup;
  }

  /**
   * Creates a natural warm wood door with dark frame, panel moldings, metal handle,
   * swinging ~38 degrees inside into the room to give 3D depth.
   */
  private createWoodDoor(row: number): THREE.Group {
    const doorGroup = new THREE.Group();
    doorGroup.name = 'WoodDoor';
    doorGroup.userData['type'] = 'wood_door';

    const frameWidth = 1.0;
    const doorHeight = this.wallHeight; // 1.2m
    const jambThickness = 0.06;
    const wallDepth = 0.16;

    // Dark wood material for frame
    const frameMat = new THREE.MeshStandardMaterial({
      color: 0x2c1810, // Dark wood frame
      roughness: 0.6,
      metalness: 0.1,
    });

    // 1. Frame Jambs & Header
    const jambGeo = new THREE.BoxGeometry(jambThickness, doorHeight, wallDepth);
    const leftJamb = new THREE.Mesh(jambGeo, frameMat);
    leftJamb.position.set(-frameWidth / 2 + jambThickness / 2, doorHeight / 2, 0);
    leftJamb.castShadow = true;
    leftJamb.receiveShadow = true;
    leftJamb.userData['type'] = 'door_frame';

    const rightJamb = new THREE.Mesh(jambGeo, frameMat);
    rightJamb.position.set(frameWidth / 2 - jambThickness / 2, doorHeight / 2, 0);
    rightJamb.castShadow = true;
    rightJamb.receiveShadow = true;
    rightJamb.userData['type'] = 'door_frame';

    const headerGeo = new THREE.BoxGeometry(frameWidth, 0.08, wallDepth + 0.01);
    const topHeader = new THREE.Mesh(headerGeo, frameMat);
    topHeader.position.set(0, doorHeight - 0.04, 0);
    topHeader.castShadow = true;
    topHeader.userData['type'] = 'door_frame';

    doorGroup.add(leftJamb, rightJamb, topHeader);

    // 2. Door Leaf with Panel Molding & Metal Handle
    const leafWidth = frameWidth - jambThickness * 2 - 0.02; // ~0.86m
    const leafHeight = doorHeight - 0.09; // ~1.11m
    const leafThickness = 0.045;

    // Warm natural wood material (#9a3412)
    const leafMat = new THREE.MeshStandardMaterial({
      color: 0x9a3412,
      roughness: 0.55,
      metalness: 0.05,
    });

    // Molding panel material
    const moldingMat = new THREE.MeshStandardMaterial({
      color: 0x78350f,
      roughness: 0.6,
    });

    // Brass / Gold metal handle material (#f59e0b)
    const handleMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      metalness: 0.8,
      roughness: 0.25,
    });

    // Door pivot group at hinge (left jamb inner edge)
    const pivot = new THREE.Group();
    pivot.name = 'WoodDoor_Pivot';
    pivot.position.set(-frameWidth / 2 + jambThickness, 0, 0);

    // Main door leaf slab
    const leafGeo = new THREE.BoxGeometry(leafWidth, leafHeight, leafThickness);
    const leafMesh = new THREE.Mesh(leafGeo, leafMat);
    leafMesh.position.set(leafWidth / 2, leafHeight / 2, 0);
    leafMesh.castShadow = true;
    leafMesh.receiveShadow = true;
    leafMesh.userData['type'] = 'wood_door';

    // Panel moldings on both front and back
    const panelGeo = new THREE.BoxGeometry(leafWidth * 0.72, leafHeight * 0.38, 0.008);
    const upperPanelFront = new THREE.Mesh(panelGeo, moldingMat);
    upperPanelFront.position.set(leafWidth / 2, leafHeight * 0.72, leafThickness / 2 + 0.004);
    const upperPanelBack = new THREE.Mesh(panelGeo, moldingMat);
    upperPanelBack.position.set(leafWidth / 2, leafHeight * 0.72, -leafThickness / 2 - 0.004);

    const lowerPanelFront = new THREE.Mesh(panelGeo, moldingMat);
    lowerPanelFront.position.set(leafWidth / 2, leafHeight * 0.28, leafThickness / 2 + 0.004);
    const lowerPanelBack = new THREE.Mesh(panelGeo, moldingMat);
    lowerPanelBack.position.set(leafWidth / 2, leafHeight * 0.28, -leafThickness / 2 - 0.004);

    // Metal handle (lever + backplate) near opening edge
    const handlePlateGeo = new THREE.BoxGeometry(0.035, 0.14, 0.015);
    const handleLeverGeo = new THREE.BoxGeometry(0.11, 0.025, 0.03);

    const handleX = leafWidth - 0.08;
    const handleY = leafHeight * 0.52;

    const plateFront = new THREE.Mesh(handlePlateGeo, handleMat);
    plateFront.position.set(handleX, handleY, leafThickness / 2 + 0.008);
    const leverFront = new THREE.Mesh(handleLeverGeo, handleMat);
    leverFront.position.set(handleX - 0.03, handleY, leafThickness / 2 + 0.025);

    const plateBack = new THREE.Mesh(handlePlateGeo, handleMat);
    plateBack.position.set(handleX, handleY, -leafThickness / 2 - 0.008);
    const leverBack = new THREE.Mesh(handleLeverGeo, handleMat);
    leverBack.position.set(handleX - 0.03, handleY, -leafThickness / 2 - 0.025);

    pivot.add(
      leafMesh,
      upperPanelFront,
      upperPanelBack,
      lowerPanelFront,
      lowerPanelBack,
      plateFront,
      leverFront,
      plateBack,
      leverBack,
    );

    // Swing open 38 degrees inside into the room:
    // Row 0 interior is -Z -> positive Y rotation turns leaf into -Z
    // Row 1 interior is +Z -> negative Y rotation turns leaf into +Z
    const openAngleRad = THREE.MathUtils.degToRad(38);
    pivot.rotation.y = row === 0 ? openAngleRad : -openAngleRad;

    doorGroup.add(pivot);
    return doorGroup;
  }

  /**
   * Creates a high-resolution Over-door Room Number Plaque mounted above
   * the door opening header facing the corridor.
   */
  private createOverDoorPlaque(
    roomCode: string,
    roomId: string,
    row: number,
  ): THREE.Group {
    const plaqueGroup = new THREE.Group();
    plaqueGroup.name = `OverDoorPlaque_${roomCode}`;
    plaqueGroup.userData = {
      type: 'over_door_room_label',
      isRoomLabel: true,
      roomCode,
      roomId,
    };

    const plaqueWidth = 0.68;
    const plaqueHeight = 0.22;
    const plaqueDepth = 0.035;

    // Plaque base (dark metallic)
    const baseGeo = new THREE.BoxGeometry(plaqueWidth, plaqueHeight, plaqueDepth);
    const baseMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.3,
      metalness: 0.8,
    });
    const baseMesh = new THREE.Mesh(baseGeo, baseMat);
    baseMesh.userData = {
      type: 'over_door_room_label',
      isRoomLabel: true,
      roomCode,
      roomId,
    };
    plaqueGroup.add(baseMesh);

    // Gold trim frame
    const trimGeo = new THREE.BoxGeometry(
      plaqueWidth + 0.02,
      plaqueHeight + 0.02,
      plaqueDepth * 0.6,
    );
    const trimMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      roughness: 0.35,
      metalness: 0.6,
    });
    const trimMesh = new THREE.Mesh(trimGeo, trimMat);
    trimMesh.position.z = -0.005;
    plaqueGroup.add(trimMesh);

    // Front high-res texture plane
    const texture = this.createOverDoorLabelTexture(roomCode);
    if (texture) {
      const planeGeo = new THREE.PlaneGeometry(plaqueWidth - 0.02, plaqueHeight - 0.02);
      const planeMat = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
      });
      const planeMesh = new THREE.Mesh(planeGeo, planeMat);
      planeMesh.position.z = plaqueDepth / 2 + 0.002;
      plaqueGroup.add(planeMesh);
    }

    // Position on header facing corridor
    const H = this.wallHeight;
    const D = this.roomDepth;
    if (row === 0) {
      // Facing +Z towards corridor
      plaqueGroup.position.set(0, H - 0.02, D / 2 + 0.02);
    } else {
      // Facing -Z towards corridor
      plaqueGroup.position.set(0, H - 0.02, -D / 2 - 0.02);
      plaqueGroup.rotation.y = Math.PI;
    }

    return plaqueGroup;
  }

  /**
   * Generates a crisp 512x160 canvas texture for the over-door room number plaque.
   */
  private createOverDoorLabelTexture(roomCode: string): THREE.Texture | null {
    if (typeof document === 'undefined' || typeof window === 'undefined') {
      return null;
    }
    if (typeof navigator !== 'undefined' && /jsdom/i.test(navigator.userAgent)) {
      return null;
    }

    try {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 160;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        return null;
      }

      // Dark metallic background
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, 512, 160);

      // Gold outer border
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 10;
      ctx.strokeRect(5, 5, 502, 150);

      // Gold inner accent border
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 2;
      ctx.strokeRect(14, 14, 484, 132);

      // Bold golden room number
      ctx.font = 'bold 84px system-ui, -apple-system, sans-serif';
      ctx.fillStyle = '#fde047';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(roomCode, 256, 80);

      const texture = new THREE.CanvasTexture(canvas);
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;
      texture.needsUpdate = true;
      return texture;
    } catch {
      return null;
    }
  }

  /**
   * Creates an interactive Room Info Plaque mounted on the corridor wall right of the door.
   * Plaque displays room code, area, tenant name, status, and button "👉 Mở Sổ F04".
   */
  private createRoomInfoBoard(
    roomConfig: FloorCutawayRoomConfig,
    roomCode: string,
    row: number,
  ): THREE.Group {
    const boardGroup = new THREE.Group();
    boardGroup.name = `RoomInfoBoard_${roomCode}`;
    boardGroup.userData = {
      type: 'room_info_board',
      roomId: roomConfig.roomId,
      roomCode,
    };

    const boardWidth = 0.6;
    const boardHeight = 0.42;
    const boardDepth = 0.03;

    // Plaque mesh
    const plaqueGeo = new THREE.BoxGeometry(boardWidth, boardHeight, boardDepth);
    const plaqueMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.35,
      metalness: 0.3,
    });
    const plaqueMesh = new THREE.Mesh(plaqueGeo, plaqueMat);
    plaqueMesh.castShadow = true;
    plaqueMesh.userData = {
      type: 'room_info_board',
      roomId: roomConfig.roomId,
      roomCode,
    };
    boardGroup.add(plaqueMesh);
    this.roomInfoPlaqueMeshes.push(plaqueMesh);

    // Front high-res texture plane (512x320)
    const texture = this.createRoomInfoBoardTexture(roomConfig, roomCode);
    if (texture) {
      const planeGeo = new THREE.PlaneGeometry(boardWidth - 0.02, boardHeight - 0.02);
      const planeMat = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
      });
      const planeMesh = new THREE.Mesh(planeGeo, planeMat);
      planeMesh.position.z = boardDepth / 2 + 0.002;
      planeMesh.userData = {
        type: 'room_info_board',
        roomId: roomConfig.roomId,
        roomCode,
      };
      boardGroup.add(planeMesh);
      this.roomInfoPlaqueMeshes.push(planeMesh);
    }

    // Border trim frame (#38bdf8 / cyan-gold)
    const borderGeo = new THREE.BoxGeometry(
      boardWidth + 0.02,
      boardHeight + 0.02,
      boardDepth * 0.5,
    );
    const borderMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      roughness: 0.3,
      metalness: 0.5,
    });
    const borderMesh = new THREE.Mesh(borderGeo, borderMat);
    borderMesh.position.z = -0.005;
    boardGroup.add(borderMesh);

    // Position on wall to the right of the door opening
    const D = this.roomDepth;
    const boardX = 0.88;
    const boardY = 0.68;

    if (row === 0) {
      boardGroup.position.set(boardX, boardY, D / 2 + 0.02);
    } else {
      boardGroup.position.set(boardX, boardY, -D / 2 - 0.02);
      boardGroup.rotation.y = Math.PI;
    }

    return boardGroup;
  }

  /**
   * Generates a 512x320 canvas texture for the wall room info plaque.
   */
  private createRoomInfoBoardTexture(
    roomConfig: FloorCutawayRoomConfig,
    roomCode: string,
  ): THREE.Texture | null {
    if (typeof document === 'undefined' || typeof window === 'undefined') {
      return null;
    }
    if (typeof navigator !== 'undefined' && /jsdom/i.test(navigator.userAgent)) {
      return null;
    }

    try {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 320;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        return null;
      }

      // Background
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, 512, 320);

      // Outer border
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 6;
      ctx.strokeRect(3, 3, 506, 314);

      // Line 1: Room Code & Area
      const area = roomConfig.areaSqm ?? 25;
      ctx.font = 'bold 38px system-ui, -apple-system, sans-serif';
      ctx.fillStyle = '#f8fafc';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText(`${roomCode} · ${area}m²`, 28, 22);

      // Divider line
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(28, 72);
      ctx.lineTo(484, 72);
      ctx.stroke();

      // Line 2: Tenant name
      const isVacant = roomConfig.status === 'VACANT';
      const tenantName =
        roomConfig.tenantName || (isVacant ? 'Phòng trống' : 'Đang thuê');
      ctx.font = '500 30px system-ui, -apple-system, sans-serif';
      ctx.fillStyle = '#cbd5e1';
      ctx.fillText(`Khách: ${tenantName}`, 28, 88);

      // Line 3: Status
      let statusText = '🟢 Bình thường';
      let statusColor = '#34d399';
      if (roomConfig.hasBrokenDevice) {
        statusText = '🔴 Hỏng điều hòa';
        statusColor = '#f87171';
      } else if (roomConfig.hasPaymentNotice) {
        statusText = '🟡 Chờ thu';
        statusColor = '#fbbf24';
      } else if (isVacant) {
        statusText = '⚪ Phòng trống';
        statusColor = '#94a3b8';
      }
      ctx.font = 'bold 30px system-ui, -apple-system, sans-serif';
      ctx.fillStyle = statusColor;
      ctx.fillText(statusText, 28, 140);

      // Line 4: Action button "👉 Mở Sổ F04"
      ctx.fillStyle = 'rgba(245, 158, 11, 0.2)';
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 3;
      ctx.fillRect(28, 215, 456, 75);
      ctx.strokeRect(28, 215, 456, 75);

      ctx.font = 'bold 32px system-ui, -apple-system, sans-serif';
      ctx.fillStyle = '#fde047';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('👉 Mở Sổ F04', 256, 252);

      const texture = new THREE.CanvasTexture(canvas);
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;
      texture.needsUpdate = true;
      return texture;
    } catch {
      return null;
    }
  }

  /**
   * Creates a procedural single bed with blue bedding (#2563eb).
   */
  private createBed(): THREE.Group {
    const bed = new THREE.Group();
    bed.name = 'BedSingle_Blue';

    // Wood base
    const baseGeo = new THREE.BoxGeometry(1.2, 0.22, 2.0);
    const baseMat = new THREE.MeshStandardMaterial({
      color: 0x8b5a2b,
      roughness: 0.7,
    });
    const baseMesh = new THREE.Mesh(baseGeo, baseMat);
    baseMesh.position.y = 0.11;
    baseMesh.castShadow = true;

    // Blue mattress & duvet (#2563eb)
    const mattressGeo = new THREE.BoxGeometry(1.16, 0.24, 1.95);
    const mattressMat = new THREE.MeshStandardMaterial({
      color: 0x2563eb,
      roughness: 0.5,
    });
    const mattressMesh = new THREE.Mesh(mattressGeo, mattressMat);
    mattressMesh.position.y = 0.32;
    mattressMesh.castShadow = true;

    // White pillow
    const pillowGeo = new THREE.BoxGeometry(0.75, 0.08, 0.45);
    const pillowMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      roughness: 0.8,
    });
    const pillowMesh = new THREE.Mesh(pillowGeo, pillowMat);
    pillowMesh.position.set(0, 0.46, -0.65);

    bed.add(baseMesh, mattressMesh, pillowMesh);
    return bed;
  }

  /**
   * Creates a study/work desk with warm amber oak top (#d97706).
   */
  private createDesk(): THREE.Group {
    const desk = new THREE.Group();
    desk.name = 'StudyDesk_Amber';

    // Desk top
    const topGeo = new THREE.BoxGeometry(1.2, 0.06, 0.65);
    const topMat = new THREE.MeshStandardMaterial({
      color: 0xd97706, // Amber wood
      roughness: 0.5,
    });
    const topMesh = new THREE.Mesh(topGeo, topMat);
    topMesh.position.y = 0.72;
    topMesh.castShadow = true;

    // Legs (dark metal)
    const legGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.69, 8);
    const legMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      metalness: 0.4,
      roughness: 0.4,
    });

    const lx = 0.54;
    const lz = 0.27;
    const positions = [
      [-lx, lz],
      [lx, lz],
      [-lx, -lz],
      [lx, -lz],
    ];

    positions.forEach(([x, z]) => {
      const leg = new THREE.Mesh(legGeo, legMat);
      leg.position.set(x!, 0.345, z!);
      leg.castShadow = true;
      desk.add(leg);
    });

    // Laptop on desk
    const laptopGeo = new THREE.BoxGeometry(0.32, 0.02, 0.24);
    const laptopMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      metalness: 0.6,
      roughness: 0.3,
    });
    const laptopMesh = new THREE.Mesh(laptopGeo, laptopMat);
    laptopMesh.position.set(0, 0.76, 0);

    desk.add(topMesh, laptopMesh);
    return desk;
  }

  /**
   * Creates a vibrant orange desk chair (#f97316).
   */
  private createChair(): THREE.Group {
    const chair = new THREE.Group();
    chair.name = 'Chair_Orange';

    const orangeMat = new THREE.MeshStandardMaterial({
      color: 0xf97316,
      roughness: 0.5,
    });
    const darkMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.4,
    });

    // Seat
    const seatGeo = new THREE.BoxGeometry(0.44, 0.06, 0.44);
    const seatMesh = new THREE.Mesh(seatGeo, orangeMat);
    seatMesh.position.y = 0.42;
    seatMesh.castShadow = true;

    // Backrest
    const backGeo = new THREE.BoxGeometry(0.42, 0.38, 0.05);
    const backMesh = new THREE.Mesh(backGeo, orangeMat);
    backMesh.position.set(0, 0.64, 0.2);
    backMesh.castShadow = true;

    // Center stand & base
    const standGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.38, 8);
    const standMesh = new THREE.Mesh(standGeo, darkMat);
    standMesh.position.y = 0.19;

    const baseGeo = new THREE.CylinderGeometry(0.22, 0.22, 0.04, 12);
    const baseMesh = new THREE.Mesh(baseGeo, darkMat);
    baseMesh.position.y = 0.02;

    chair.add(seatMesh, backMesh, standMesh, baseMesh);
    return chair;
  }

  /**
   * Creates an Air Conditioner unit mounted on the upper wall.
   */
  private createAirConditioner(): THREE.Group {
    const ac = new THREE.Group();
    ac.name = 'AirConditioner';

    // Main white body
    const bodyGeo = new THREE.BoxGeometry(0.85, 0.28, 0.22);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      roughness: 0.3,
    });
    const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
    bodyMesh.castShadow = true;

    // Vent slot
    const ventGeo = new THREE.BoxGeometry(0.75, 0.04, 0.02);
    const ventMat = new THREE.MeshBasicMaterial({ color: 0x94a3b8 });
    const ventMesh = new THREE.Mesh(ventGeo, ventMat);
    ventMesh.position.set(0, -0.09, 0.111);

    // Power LED (green dot)
    const ledGeo = new THREE.SphereGeometry(0.015, 8, 8);
    const ledMat = new THREE.MeshBasicMaterial({ color: 0x10b981 });
    const ledMesh = new THREE.Mesh(ledGeo, ledMat);
    ledMesh.position.set(0.35, -0.08, 0.115);

    ac.add(bodyMesh, ventMesh, ledMesh);
    return ac;
  }

  /**
   * Creates a chibi tenant avatar (sitting at desk or standing).
   */
  private createChibiAvatar(
    action: 'sitting' | 'standing' | 'sleeping',
    chairZ: number,
    _deskZ: number,
  ): THREE.Group {
    const avatar = new THREE.Group();
    avatar.name = `ChibiAvatar_${action}`;

    const skinMat = new THREE.MeshStandardMaterial({
      color: 0xfed7aa, // Peach skin tone
      roughness: 0.4,
    });
    const hairMat = new THREE.MeshStandardMaterial({
      color: 0x334155, // Dark slate hair
      roughness: 0.6,
    });
    const shirtMat = new THREE.MeshStandardMaterial({
      color: 0x3b82f6, // Blue shirt
      roughness: 0.5,
    });
    const pantsMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.6,
    });

    // Chibi Head (Cute sphere)
    const headGeo = new THREE.SphereGeometry(0.18, 12, 12);
    const headMesh = new THREE.Mesh(headGeo, skinMat);

    // Chibi Hair (half sphere cap)
    const hairGeo = new THREE.SphereGeometry(0.19, 12, 12, 0, Math.PI * 2, 0, Math.PI / 2);
    const hairMesh = new THREE.Mesh(hairGeo, hairMat);
    hairMesh.rotation.x = -Math.PI / 8;
    headMesh.add(hairMesh);

    // Chibi Torso
    const torsoGeo = new THREE.BoxGeometry(0.28, 0.32, 0.2);
    const torsoMesh = new THREE.Mesh(torsoGeo, shirtMat);
    torsoMesh.castShadow = true;

    if (action === 'sitting') {
      // Sitting on chair at desk
      avatar.position.set(this.roomWidth / 2 - 1.05, 0, chairZ);
      torsoMesh.position.y = 0.56;
      headMesh.position.y = 0.84;

      // Legs bent forward
      const legGeo = new THREE.BoxGeometry(0.09, 0.09, 0.22);
      const leftLeg = new THREE.Mesh(legGeo, pantsMat);
      leftLeg.position.set(-0.07, 0.44, -0.09);
      const rightLeg = new THREE.Mesh(legGeo, pantsMat);
      rightLeg.position.set(0.07, 0.44, -0.09);

      avatar.add(torsoMesh, headMesh, leftLeg, rightLeg);
    } else {
      // Standing
      avatar.position.set(this.roomWidth / 2 - 0.4, 0, chairZ);
      torsoMesh.position.y = 0.58;
      headMesh.position.y = 0.86;

      // Straight legs
      const legGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.38, 8);
      const leftLeg = new THREE.Mesh(legGeo, pantsMat);
      leftLeg.position.set(-0.07, 0.19, 0);
      const rightLeg = new THREE.Mesh(legGeo, pantsMat);
      rightLeg.position.set(0.07, 0.19, 0);

      avatar.add(torsoMesh, headMesh, leftLeg, rightLeg);
    }

    return avatar;
  }



  /**
   * Performs raycast picking against cutaway room meshes.
   */
  pickRoom(raycaster: THREE.Raycaster): PickedFloorRoom | null {
    if (this.interactiveMeshes.length === 0) {
      return null;
    }

    const intersects = raycaster.intersectObjects(this.interactiveMeshes, false);
    if (intersects.length === 0) {
      return null;
    }

    const hit = intersects[0]!.object;
    const roomId = hit.userData['roomId'];
    const roomCode = hit.userData['roomCode'];
    const roomIndex = hit.userData['roomIndex'];
    const floorIndex = hit.userData['floorIndex'];

    if (typeof roomId === 'string' && typeof roomCode === 'string') {
      return {
        roomId,
        roomCode,
        roomIndex: typeof roomIndex === 'number' ? roomIndex : 0,
        floorIndex: typeof floorIndex === 'number' ? floorIndex : 0,
      };
    }

    return null;
  }

  /**
   * Highlights the hovered room with a bright warm gold emissive glow (#fbbf24)
   * and restores any previously highlighted room.
   */
  setHoveredRoom(roomIdOrIndex: string | number | null): void {
    // Reset previous
    if (this.hoveredRoomKey !== null) {
      const prevMesh = this.roomFloorMeshes.get(this.hoveredRoomKey);
      if (prevMesh && prevMesh.material instanceof THREE.MeshStandardMaterial) {
        prevMesh.material.emissive.setHex(0x000000);
        prevMesh.material.emissiveIntensity = 1;
      }
      this.hoveredRoomKey = null;
    }

    if (roomIdOrIndex === null || roomIdOrIndex === undefined) {
      return;
    }

    const key = String(roomIdOrIndex);
    const targetMesh = this.roomFloorMeshes.get(key);
    if (targetMesh && targetMesh.material instanceof THREE.MeshStandardMaterial) {
      targetMesh.material.emissive.setHex(0xfbbf24);
      targetMesh.material.emissiveIntensity = 0.55;
      this.hoveredRoomKey = key;
    }
  }

  /**
   * Performs raycast picking against room info plaques mounted on the wall.
   */
  pickRoomInfoPlaque(raycaster: THREE.Raycaster): PickedRoomInfoPlaque | null {
    if (this.roomInfoPlaqueMeshes.length === 0) {
      return null;
    }

    const intersects = raycaster.intersectObjects(this.roomInfoPlaqueMeshes, false);
    if (intersects.length === 0) {
      return null;
    }

    const hit = intersects[0]!.object;
    const roomId = hit.userData['roomId'];
    const roomCode = hit.userData['roomCode'];

    if (typeof roomId === 'string' && typeof roomCode === 'string') {
      return { roomId, roomCode };
    }

    return null;
  }

  /**
   * Highlights the hovered room info plaque with a warm glow.
   */
  setHoveredRoomInfoPlaque(roomId: string | null): void {
    if (this.hoveredInfoPlaqueId === roomId) {
      return;
    }

    // Reset previous
    if (this.hoveredInfoPlaqueId !== null) {
      for (const mesh of this.roomInfoPlaqueMeshes) {
        if (mesh.userData['roomId'] === this.hoveredInfoPlaqueId) {
          if (mesh.material instanceof THREE.MeshStandardMaterial) {
            mesh.material.emissive.setHex(0x000000);
            mesh.material.emissiveIntensity = 1;
          }
        }
      }
      this.hoveredInfoPlaqueId = null;
    }

    if (!roomId) {
      return;
    }

    // Highlight target
    for (const mesh of this.roomInfoPlaqueMeshes) {
      if (mesh.userData['roomId'] === roomId) {
        if (mesh.material instanceof THREE.MeshStandardMaterial) {
          mesh.material.emissive.setHex(0xf59e0b);
          mesh.material.emissiveIntensity = 0.6;
        }
      }
    }
    this.hoveredInfoPlaqueId = roomId;
  }

  /**
   * Returns all room info plaque meshes.
   */
  getRoomInfoPlaqueMeshes(): THREE.Mesh[] {
    return this.roomInfoPlaqueMeshes;
  }

  /**
   * Performs raycast picking against 3D notice badges in the floor cutaway scene.
   */
  pickNoticeBadge(raycaster: THREE.Raycaster): PickedFloorNoticeBadge | null {
    const noticeBadges = this.badges.filter(
      (b): b is NoticeBadge => b instanceof NoticeBadge && b.visible,
    );
    if (noticeBadges.length === 0) {
      return null;
    }

    this.group.updateMatrixWorld(true);

    const intersects = raycaster.intersectObjects(noticeBadges, true);
    if (intersects.length === 0) {
      return null;
    }

    for (const hit of intersects) {
      let curr: THREE.Object3D | null = hit.object;
      while (curr && curr !== this.group) {
        if (
          curr.userData &&
          curr.userData['type'] === 'cutaway_notice_badge' &&
          typeof curr.userData['roomId'] === 'string' &&
          (curr.userData['noticeKind'] === 'PAYMENT' ||
            curr.userData['noticeKind'] === 'DEVICE')
        ) {
          return {
            roomId: curr.userData['roomId'],
            noticeKind: curr.userData['noticeKind'],
          };
        }
        curr = curr.parent;
      }
    }

    return null;
  }

  /**
   * Advances the animation of notice badges and sleeping badges.
   */
  update(delta: number): void {
    for (const badge of this.badges) {
      badge.update(delta);
    }
  }

  /**
   * Returns a room group by roomId.
   */
  getRoomGroup(roomId: string): THREE.Group | undefined {
    return this.roomGroups.get(roomId);
  }

  /**
   * Returns all interactive room meshes for raycasting.
   */
  getInteractiveMeshes(): THREE.Mesh[] {
    return this.interactiveMeshes;
  }

  /**
   * Returns all active badges.
   */
  getBadges(): Array<NoticeBadge | SleepingBadge> {
    return this.badges;
  }

  /**
   * Cleans up all resources and child meshes from the scene.
   */
  clear(): void {
    for (const badge of this.badges) {
      badge.dispose();
    }
    this.badges = [];

    this.group.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.geometry?.dispose();
        if (Array.isArray(obj.material)) {
          obj.material.forEach((m) => m.dispose());
        } else if (obj.material) {
          obj.material.dispose();
        }
      }
    });

    while (this.group.children.length > 0) {
      this.group.remove(this.group.children[0]!);
    }

    this.interactiveMeshes = [];
    this.roomInfoPlaqueMeshes = [];
    this.roomGroups.clear();
    this.roomFloorMeshes.clear();
    this.hoveredRoomKey = null;
    this.hoveredInfoPlaqueId = null;
  }

  dispose(): void {
    this.clear();
  }
}
