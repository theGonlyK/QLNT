import * as THREE from 'three';
import type {
  IGameRenderer,
  BuildingRenderDTO,
  AvatarSkinDTO,
  Vector3D,
  DeviceStatus,
  RoomNoticeType,
  FloorMapDTO,
  RoomDetailDTO,
  RoomDetailTab,
} from '@qlnt/shared-types';
import { createIsometricCamera } from './camera/isometricCamera';
import {
  setupIsometricLighting,
  type IsometricLightingResult,
} from './lighting/isometricLighting';
import { AssetLoader } from './loaders/assetLoader';
import { NoticeBadge } from './badges/noticeBadge';
import { AvatarController } from './avatar/avatarController';
import {
  SnapshotExporter,
  type SnapshotOptions,
} from './snapshot/snapshotExporter';
import {
  FloorCutawayRenderer,
  type FloorCutawayRoomConfig,
  type PickedFloorRoom,
  type PickedRoomInfoPlaque,
  type PickedFloorNoticeBadge,
} from './cutaway/floorCutawayRenderer';

const FLOOR_PALETTE = [
  0x4a90d9,
  0x5ba3e8,
  0x3d7ec7,
  0x6cb4f5,
  0x3572b8,
] as const;

export interface PickedBuildingRoom {
  floorIndex: number;
  roomIndex: number;
  roomId: string;
}

export type BuildingBlockGridConfig = {
  cols: number;
  rows: number;
};

export type ExtendedBuildingRenderDTO = BuildingRenderDTO & {
  blockGrid?: BuildingBlockGridConfig;
};

export type {
  FloorCutawayRoomConfig,
  PickedFloorRoom,
  PickedRoomInfoPlaque,
  PickedFloorNoticeBadge,
};

export interface ThreeGameRendererOptions {
  /** The canvas element to render into. If omitted, an OffscreenCanvas is used (Node / headless). */
  canvas?: HTMLCanvasElement;
  /** Width of the viewport in pixels (default: 800) */
  width?: number;
  /** Height of the viewport in pixels (default: 600) */
  height?: number;
  /** Frustum half-size for isometric camera (default: 10) */
  frustumSize?: number;
  /** Custom AssetLoader instance (optional) */
  assetLoader?: AssetLoader;
}

/**
 * ThreeGameRenderer — a Three.js implementation of IGameRenderer.
 *
 * Owns the WebGL scene, isometric orthographic camera, warm lighting setup,
 * GLTF asset management, notice badges, avatar controller, and animation loop.
 * Satisfies the full IGameRenderer contract from @qlnt/shared-types.
 */
export class ThreeGameRenderer implements IGameRenderer {
  readonly scene: THREE.Scene;
  readonly camera: THREE.OrthographicCamera;
  readonly renderer: THREE.WebGLRenderer;
  readonly lighting: IsometricLightingResult;
  readonly assetLoader: AssetLoader;

  private readonly width: number;
  private readonly height: number;
  private readonly frustumSize: number;

  /** Map of avatarId → avatar mesh group */
  private readonly avatars = new Map<string, THREE.Group>();

  /** Map of avatarId → AvatarController */
  private readonly avatarControllers = new Map<string, AvatarController>();

  /** Map of badgeKey → NoticeBadge */
  private readonly badges = new Map<string, NoticeBadge>();

  /** Procedural building room meshes for raycasting */
  private buildingMeshes: THREE.Mesh[] = [];

  /** Map of `${floor}-${room}` → room mesh */
  private readonly buildingMeshMap = new Map<string, THREE.Mesh>();

  /** Key of currently hovered room (`${floor}-${room}`) */
  private hoveredRoomKey: string | null = null;

  /** Shared raycaster for picking 3D rooms */
  private readonly raycaster = new THREE.Raycaster();

  /** Floor cutaway renderer instance when viewing a single floor */
  private floorCutawayRenderer: FloorCutawayRenderer | null = null;

  /** Current procedural building block layout { cols (along X), rows (along Z) } */
  private currentBlockGrid: { cols: number; rows: number } = { cols: 2, rows: 2 };

  constructor(options: ThreeGameRendererOptions = {}) {
    this.width = options.width ?? 800;
    this.height = options.height ?? 600;
    this.frustumSize = options.frustumSize ?? 10;

    // Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x1a1a2e);

    // Isometric camera (Yaw 45°, Pitch 35.264°, Y-up)
    this.camera = createIsometricCamera(
      this.frustumSize,
      this.width / this.height,
    );

    // Isometric Lighting (Ambient + Directional with shadow mapping)
    this.lighting = setupIsometricLighting(this.scene);

    // Asset Loader
    this.assetLoader = options.assetLoader ?? new AssetLoader();

    // Renderer — use provided canvas or create a headless one
    const canvas = options.canvas;
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
    });
    this.renderer.setSize(this.width, this.height);
    this.renderer.setPixelRatio(1);
    this.renderer.shadowMap.enabled = true;
  }

  // =========================================================
  // IGameRenderer — 3D Building & Avatar
  // =========================================================

  /**
   * Sets default 3D block grid shape (columns along X, rows along Z)
   * used when rendering procedural buildings.
   */
  setBuildingBlockShape(cols: number, rows: number): void {
    this.currentBlockGrid = {
      cols: Math.max(1, cols),
      rows: Math.max(1, rows),
    };
  }

  /**
   * Returns a copy of the current 3D block grid shape.
   */
  getBuildingBlockShape(): { cols: number; rows: number } {
    return { ...this.currentBlockGrid };
  }

  async renderBuilding(buildingData: ExtendedBuildingRenderDTO): Promise<void> {
    // Remove existing building meshes and reset picking/hover state
    const toRemove = this.scene.children.filter(
      (c) => c.userData['type'] === 'building',
    );
    toRemove.forEach((c) => this.scene.remove(c));
    this.buildingMeshes = [];
    this.buildingMeshMap.clear();
    this.hoveredRoomKey = null;

    const { totalFloors, roomsPerFloor, position, scale, propertyId } = buildingData;
    const sx = scale?.x ?? 1;
    const sy = scale?.y ?? 1;
    const sz = scale?.z ?? 1;

    // Check if a pre-cached GLB model exists for this property
    const cachedEntry = this.assetLoader.getCache(propertyId);
    if (cachedEntry) {
      const model = cachedEntry.scene;
      model.position.set(position.x, position.y, position.z);
      model.scale.set(sx, sy, sz);
      model.userData['type'] = 'building';
      model.userData['propertyId'] = propertyId;
      this.scene.add(model);
      model.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          this.buildingMeshes.push(child);
        }
      });
      return;
    }

    // Determine grid dimensions X x Z
    const cols =
      buildingData.blockGrid?.cols ??
      Math.max(1, Math.ceil(roomsPerFloor / 2));
    const rows =
      buildingData.blockGrid?.rows ??
      (roomsPerFloor > cols ? Math.ceil(roomsPerFloor / cols) : 1);
    this.currentBlockGrid = { cols, rows };

    // Procedural layout: center grid around (0, y, 0) per floor and room
    const gapX = 0.1;
    const gapY = 0.1;
    const gapZ = 0.25; // corridor gap
    const offsetX = -((cols - 1) * (sx + gapX)) / 2;
    const offsetZ = -((rows - 1) * (sz + gapZ)) / 2;
    const offsetY = 0;

    for (let f = 0; f < totalFloors; f++) {
      const baseColor = FLOOR_PALETTE[f % FLOOR_PALETTE.length]!;
      for (let r = 0; r < roomsPerFloor; r++) {
        const colIdx = r % cols;
        const rowIdx = Math.floor(r / cols);
        const posX = position.x + offsetX + colIdx * (sx + gapX);
        const posY = position.y + offsetY + f * (sy + gapY);
        const posZ = position.z + offsetZ + rowIdx * (sz + gapZ);

        const geo = new THREE.BoxGeometry(sx, sy, sz);
        const mat = new THREE.MeshLambertMaterial({ color: baseColor });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(posX, posY, posZ);

        const legacyRoomId = `room-${f * roomsPerFloor + r + 1}`;
        mesh.userData['type'] = 'building';
        mesh.userData['floor'] = f;
        mesh.userData['room'] = r;
        mesh.userData['colIdx'] = colIdx;
        mesh.userData['rowIdx'] = rowIdx;
        mesh.userData['cols'] = cols;
        mesh.userData['rows'] = rows;
        mesh.userData['legacyRoomId'] = legacyRoomId;
        mesh.userData['roomId'] = legacyRoomId;
        mesh.userData['baseColor'] = baseColor;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        this.scene.add(mesh);
        this.buildingMeshes.push(mesh);
        this.buildingMeshMap.set(`${f}-${r}`, mesh);
      }
    }

    // Refresh room mesh colors and reposition any active badges to the newly rendered layout
    for (const mesh of this.buildingMeshes) {
      const roomId = mesh.userData['roomId'];
      if (roomId) {
        this.updateRoomMeshColor(roomId);
      }
    }
    this.updateBadgePositions();
  }

  spawnAvatar(
    avatarId: string,
    roomPosition: Vector3D,
    skinConfig: AvatarSkinDTO,
  ): void {
    if (this.avatars.has(avatarId)) {
      return; // already spawned
    }

    let group: THREE.Group;
    let animations: THREE.AnimationClip[] = [];

    // Attempt to retrieve preloaded character asset
    const cachedEntry = this.assetLoader.getCache(skinConfig.modelId);
    if (cachedEntry) {
      group = cachedEntry.scene;
      animations = cachedEntry.animations;
    } else {
      // Procedural capsule: cylinder + sphere
      group = new THREE.Group();
      const bodyGeo = new THREE.CylinderGeometry(0.2, 0.2, 1, 8);
      const headGeo = new THREE.SphereGeometry(0.2, 8, 8);
      const mat = new THREE.MeshLambertMaterial({ color: 0xe8c07d });
      const body = new THREE.Mesh(bodyGeo, mat);
      const head = new THREE.Mesh(headGeo, mat);
      head.position.y = 0.75;
      body.castShadow = true;
      head.castShadow = true;
      group.add(body, head);
    }

    group.position.set(roomPosition.x, roomPosition.y, roomPosition.z);
    group.userData['avatarId'] = avatarId;
    this.scene.add(group);
    this.avatars.set(avatarId, group);

    // Create AvatarController
    const controller = new AvatarController({
      model: group,
      animations,
      defaultAction: 'idle',
    });
    this.avatarControllers.set(avatarId, controller);
  }

  moveAvatar(
    avatarId: string,
    targetPosition: Vector3D,
    onComplete?: () => void,
  ): void {
    const controller = this.avatarControllers.get(avatarId);
    if (!controller) {
      // Fallback: direct group position if controller not present
      const group = this.avatars.get(avatarId);
      if (!group) return;
      group.position.set(targetPosition.x, targetPosition.y, targetPosition.z);
      onComplete?.();
      return;
    }

    controller.moveTo(targetPosition, 2.5, onComplete);
    // For synchronous / immediate callers that don't tick update(), update position immediately as well
    controller.model.position.set(targetPosition.x, targetPosition.y, targetPosition.z);
    onComplete?.();
  }

  bindRoomIds(
    mappings: Array<{
      roomId: string;
      floorIndex: number;
      roomIndex: number;
      roomNumber?: string;
    }>,
  ): void {
    for (const mapping of mappings) {
      const mesh = this.buildingMeshMap.get(
        `${mapping.floorIndex}-${mapping.roomIndex}`,
      );
      if (!mesh) continue;
      mesh.userData['roomId'] = mapping.roomId;
      if (mapping.roomNumber !== undefined) {
        mesh.userData['roomNumber'] = mapping.roomNumber;
      }
    }
    for (const mapping of mappings) {
      this.updateRoomMeshColor(mapping.roomId);
    }
    this.updateBadgePositions();
  }

  findRoomMesh(roomId: string): THREE.Mesh | undefined {
    return this.buildingMeshes.find(
      (m) =>
        m.userData['roomId'] === roomId ||
        m.userData['legacyRoomId'] === roomId,
    );
  }

  getRoomBadgeAnchor(
    roomId: string,
    kind?: 'ROOM_NOTICE' | 'DEVICE_BROKEN' | number,
  ): THREE.Vector3 {
    const mesh = this.findRoomMesh(roomId);
    if (mesh) {
      const isDevice = kind === 'DEVICE_BROKEN' || kind === 1;
      const rowIdx = (mesh.userData['rowIdx'] as number | undefined) ?? 0;
      const rows = (mesh.userData['rows'] as number | undefined) ?? 1;

      if (rowIdx === rows - 1) {
        // Front row room: anchor in front of that room mesh
        const x = mesh.position.x + (isDevice ? 0.18 : -0.18);
        const y = mesh.position.y + 0.25;
        const z = mesh.position.z + 0.5 + 0.18;
        return new THREE.Vector3(x, y, z);
      } else {
        // Back or middle row room: anchor ON TOP of that room mesh
        const x = mesh.position.x + (isDevice ? 0.18 : -0.18);
        const y = mesh.position.y + 0.5 + 0.28;
        const z = mesh.position.z;
        return new THREE.Vector3(x, y, z);
      }
    }
    return new THREE.Vector3(0, 2.2, 0);
  }

  private updateBadgePositions(): void {
    for (const [key, badge] of this.badges.entries()) {
      if (key.startsWith('device:')) {
        const parts = key.split(':');
        const roomId = parts.slice(1, -1).join(':');
        if (this.findRoomMesh(roomId)) {
          const anchor = this.getRoomBadgeAnchor(roomId, 'DEVICE_BROKEN');
          badge.setAnchorPosition(anchor.x, anchor.y, anchor.z);
        }
      } else if (key.startsWith('room:')) {
        const roomId = key.slice('room:'.length);
        if (this.findRoomMesh(roomId)) {
          const anchor = this.getRoomBadgeAnchor(roomId, 'ROOM_NOTICE');
          badge.setAnchorPosition(anchor.x, anchor.y, anchor.z);
        }
      }
    }
  }

  private hasBrokenDeviceForRoom(roomId: string): boolean {
    const mesh = this.findRoomMesh(roomId);
    const candidates = new Set<string>([roomId]);
    if (mesh) {
      if (typeof mesh.userData['roomId'] === 'string') {
        candidates.add(mesh.userData['roomId']);
      }
      if (typeof mesh.userData['legacyRoomId'] === 'string') {
        candidates.add(mesh.userData['legacyRoomId']);
      }
    }
    for (const key of this.badges.keys()) {
      for (const candidate of candidates) {
        if (key.startsWith(`device:${candidate}:`)) {
          return true;
        }
      }
    }
    return false;
  }

  private hasRoomNoticeForRoom(roomId: string): boolean {
    const mesh = this.findRoomMesh(roomId);
    const candidates = new Set<string>([roomId]);
    if (mesh) {
      if (typeof mesh.userData['roomId'] === 'string') {
        candidates.add(mesh.userData['roomId']);
      }
      if (typeof mesh.userData['legacyRoomId'] === 'string') {
        candidates.add(mesh.userData['legacyRoomId']);
      }
    }
    for (const candidate of candidates) {
      if (this.badges.has(`room:${candidate}`)) {
        return true;
      }
    }
    return false;
  }

  private updateRoomMeshColor(roomId: string): void {
    const isBroken = this.hasBrokenDeviceForRoom(roomId);
    const hasNotice = this.hasRoomNoticeForRoom(roomId);

    this.scene.children
      .filter(
        (c) =>
          c.userData['type'] === 'building' &&
          (c.userData['roomId'] === roomId ||
            c.userData['legacyRoomId'] === roomId),
      )
      .forEach((c) => {
        if (
          c instanceof THREE.Mesh &&
          (c.material instanceof THREE.MeshLambertMaterial ||
            c.material instanceof THREE.MeshStandardMaterial)
        ) {
          const baseColor =
            typeof c.userData['baseColor'] === 'number'
              ? c.userData['baseColor']
              : 0x4a90d9;
          if (isBroken) {
            c.material.color.set(0xef4444);
            c.material.emissive.setHex(0x3b0707);
            c.material.emissiveIntensity = 1;
            c.receiveShadow = false;
            c.castShadow = true;
          } else if (hasNotice) {
            c.material.color.set(0xf59e0b);
            c.material.emissive.setHex(0x331a00);
            c.material.emissiveIntensity = 1;
            c.receiveShadow = false;
            c.castShadow = true;
          } else {
            c.material.color.set(baseColor);
            c.material.emissive.setHex(0x000000);
            c.material.emissiveIntensity = 1;
            c.receiveShadow = true;
            c.castShadow = true;
          }
        }
      });
  }

  setDeviceStatus(
    roomId: string,
    deviceId: string,
    status: DeviceStatus,
  ): void {
    // 1. Manage 3D Notice Badge for broken device
    const badgeKey = `device:${roomId}:${deviceId}`;
    if (status === 'BROKEN') {
      const anchor = this.getRoomBadgeAnchor(roomId, 'DEVICE_BROKEN');
      let badge = this.badges.get(badgeKey);
      if (!badge) {
        badge = new NoticeBadge('BROKEN', anchor);
        this.scene.add(badge);
        this.badges.set(badgeKey, badge);
      } else {
        badge.setType('BROKEN');
        badge.setAnchorPosition(anchor.x, anchor.y, anchor.z);
      }
    } else {
      const badge = this.badges.get(badgeKey);
      if (badge) {
        this.scene.remove(badge);
        badge.dispose();
        this.badges.delete(badgeKey);
      }
    }

    // 2. Update room material tint
    this.updateRoomMeshColor(roomId);
  }

  setRoomNotice(roomId: string, type: RoomNoticeType): void {
    const badgeKey = `room:${roomId}`;
    if (type === 'NONE') {
      const badge = this.badges.get(badgeKey);
      if (badge) {
        this.scene.remove(badge);
        badge.dispose();
        this.badges.delete(badgeKey);
      }
      this.updateRoomMeshColor(roomId);
      return;
    }

    const anchor = this.getRoomBadgeAnchor(roomId, 'ROOM_NOTICE');
    let badge = this.badges.get(badgeKey);
    if (!badge) {
      badge = new NoticeBadge(type, anchor);
      this.scene.add(badge);
      this.badges.set(badgeKey, badge);
    } else {
      badge.setType(type);
      badge.setAnchorPosition(anchor.x, anchor.y, anchor.z);
    }

    this.updateRoomMeshColor(roomId);
  }

  getProjectedRoomPositions(
    viewportWidth: number,
    viewportHeight: number,
  ): Array<{
    floorIndex: number;
    roomIndex: number;
    roomId: string;
    roomNumber?: string;
    x: number;
    y: number;
  }> {
    this.camera.updateMatrixWorld();
    const results: Array<{
      floorIndex: number;
      roomIndex: number;
      roomId: string;
      roomNumber?: string;
      x: number;
      y: number;
    }> = [];

    for (const mesh of this.buildingMeshes) {
      const floorIndex = mesh.userData['floor'];
      const roomIndex = mesh.userData['room'];
      const roomId = mesh.userData['roomId'];
      const roomNumber = mesh.userData['roomNumber'];

      if (
        typeof floorIndex !== 'number' ||
        typeof roomIndex !== 'number' ||
        typeof roomId !== 'string'
      ) {
        continue;
      }

      const projected = new THREE.Vector3(
        mesh.position.x,
        mesh.position.y,
        mesh.position.z + 0.72,
      ).project(this.camera);

      const x = ((projected.x + 1) / 2) * viewportWidth;
      const y = ((-projected.y + 1) / 2) * viewportHeight;

      results.push({
        floorIndex,
        roomIndex,
        roomId,
        ...(typeof roomNumber === 'string' ? { roomNumber } : {}),
        x,
        y,
      });
    }

    return results;
  }

  async playMinigameAction(
    _actionType: string,
    _toolSkin?: string,
  ): Promise<void> {
    return Promise.resolve();
  }

  // =========================================================
  // IGameRenderer — Ledger Book (Virtual Management Book F04)
  // =========================================================

  async openLedgerBook(
    _monthKey: string,
    _initialFloorIndex: number,
    _floorMapData: FloorMapDTO,
  ): Promise<void> {
    return Promise.resolve();
  }

  async flipLedgerFloorPage(
    _targetFloorIndex: number,
    _floorMapData: FloorMapDTO,
  ): Promise<void> {
    return Promise.resolve();
  }

  async openRoomDetailSinglePage(
    _roomId: string,
    _activeTab: RoomDetailTab,
    _roomDetailData: RoomDetailDTO,
  ): Promise<void> {
    return Promise.resolve();
  }

  async switchRoomDetailPageTab(
    _roomId: string,
    _targetTab: RoomDetailTab,
    _roomDetailData: RoomDetailDTO,
  ): Promise<void> {
    return Promise.resolve();
  }

  refreshRoomDetailView(
    _roomId: string,
    _updatedDetailData: RoomDetailDTO,
  ): void {
    // placeholder
  }

  async closeRoomDetailToFloorMap(
    _updatedFloorMapData: FloorMapDTO,
  ): Promise<void> {
    return Promise.resolve();
  }

  async closeLedgerBookTo3DScene(): Promise<void> {
    return Promise.resolve();
  }

  // =========================================================
  // 3D Interaction & Camera Controls
  // =========================================================

  /**
   * Raycasts against building room meshes at normalized device coordinates [-1, 1].
   */
  pickBuildingRoom(ndcX: number, ndcY: number): PickedBuildingRoom | null {
    if (this.buildingMeshes.length === 0) {
      return null;
    }

    this.camera.updateMatrixWorld();
    this.scene.updateMatrixWorld(true);
    this.raycaster.setFromCamera(new THREE.Vector2(ndcX, ndcY), this.camera);

    const intersects = this.raycaster.intersectObjects(this.buildingMeshes, false);
    if (intersects.length === 0) {
      return null;
    }

    const hit = intersects[0]!.object;
    const floorIndex = hit.userData['floor'];
    const roomIndex = hit.userData['room'];
    const roomId = hit.userData['roomId'];

    if (
      typeof floorIndex === 'number' &&
      typeof roomIndex === 'number' &&
      typeof roomId === 'string'
    ) {
      return { floorIndex, roomIndex, roomId };
    }

    return null;
  }

  /**
   * Highlights the hovered room mesh with a bright yellow emissive tint and resets any previous room.
   */
  setHoveredRoom(floorIndex: number | null, roomIndex: number | null): void {
    if (this.hoveredRoomKey !== null) {
      const prevMesh = this.buildingMeshMap.get(this.hoveredRoomKey);
      if (prevMesh && prevMesh.material instanceof THREE.MeshLambertMaterial) {
        const roomId = prevMesh.userData['roomId'];
        if (roomId && (this.hasBrokenDeviceForRoom(roomId) || this.hasRoomNoticeForRoom(roomId))) {
          this.updateRoomMeshColor(roomId);
        } else {
          prevMesh.material.emissive.setHex(0x000000);
          prevMesh.material.emissiveIntensity = 1;
        }
      }
      this.hoveredRoomKey = null;
    }

    if (floorIndex === null || roomIndex === null) {
      return;
    }

    const key = `${floorIndex}-${roomIndex}`;
    const nextMesh = this.buildingMeshMap.get(key);
    if (nextMesh && nextMesh.material instanceof THREE.MeshLambertMaterial) {
      nextMesh.material.emissive.setHex(0xfbbf24);
      nextMesh.material.emissiveIntensity = 0.6;
      this.hoveredRoomKey = key;
    }
  }

  /**
   * Highlights all room meshes belonging to the specified floor with a warm yellow emissive glow (#fbbf24)
   * and resets meshes on other floors. When floorIndex is null, resets emissive on all building meshes.
   *
   * @param floorIndex - Index of the floor to highlight, or null to clear highlight.
   */
  setHoveredFloor(floorIndex: number | null): void {
    for (const mesh of this.buildingMeshes) {
      if (
        mesh.material instanceof THREE.MeshLambertMaterial ||
        mesh.material instanceof THREE.MeshStandardMaterial
      ) {
        if (floorIndex !== null && mesh.userData['floor'] === floorIndex) {
          mesh.material.emissive.setHex(0xfbbf24);
          mesh.material.emissiveIntensity = 0.5;
        } else {
          const roomId = mesh.userData['roomId'];
          if (roomId && (this.hasBrokenDeviceForRoom(roomId) || this.hasRoomNoticeForRoom(roomId))) {
            this.updateRoomMeshColor(roomId);
          } else {
            mesh.material.emissive.setHex(0x000000);
            mesh.material.emissiveIntensity = 0;
          }
        }
      }
    }
  }

  /**
   * Orbits the camera horizontally around the Y axis centered at the origin.
   */
  orbitCamera(deltaRadians: number): void {
    if (!Number.isFinite(deltaRadians)) {
      return;
    }

    const cos = Math.cos(deltaRadians);
    const sin = Math.sin(deltaRadians);
    const { x, z } = this.camera.position;

    this.camera.position.x = x * cos - z * sin;
    this.camera.position.z = x * sin + z * cos;
    this.camera.lookAt(0, 0, 0);
    this.camera.updateMatrixWorld();
  }

  /**
   * Adjusts camera zoom by a multiplicative factor, clamped to [0.6, 2.5].
   */
  zoomCamera(factor: number): void {
    if (!Number.isFinite(factor) || factor <= 0) {
      return;
    }

    this.camera.zoom = THREE.MathUtils.clamp(
      this.camera.zoom * factor,
      0.6,
      2.5,
    );
    this.camera.updateProjectionMatrix();
  }

  /**
   * Resets the camera to the default 45° yaw / 35.264° pitch isometric view and zoom = 1.
   */
  resetIsometricCamera(): void {
    const yawRad = THREE.MathUtils.degToRad(45);
    const pitchRad = THREE.MathUtils.degToRad(35.264);
    const distance = this.frustumSize * 2;

    this.camera.position.set(
      distance * Math.sin(yawRad) * Math.cos(pitchRad),
      distance * Math.sin(pitchRad),
      distance * Math.cos(yawRad) * Math.cos(pitchRad),
    );
    this.camera.up.set(0, 1, 0);
    this.camera.lookAt(0, 0, 0);
    this.camera.zoom = 1;
    this.camera.updateProjectionMatrix();
    this.camera.updateMatrixWorld();
  }

  /**
   * Resets the camera to the default floor corridor isometric view
   * (Yaw = 45°, Pitch = 35.264°, Zoom = 1.215).
   */
  resetFloorIsometricCamera(): void {
    const yawRad = THREE.MathUtils.degToRad(45);
    const pitchRad = THREE.MathUtils.degToRad(35.264);
    const distance = this.frustumSize * 1.5;

    this.camera.position.set(
      distance * Math.sin(yawRad) * Math.cos(pitchRad),
      distance * Math.sin(pitchRad),
      distance * Math.cos(yawRad) * Math.cos(pitchRad),
    );
    this.camera.up.set(0, 1, 0);
    this.camera.lookAt(0, 0, 0);
    this.camera.zoom = 1.215;
    this.camera.updateProjectionMatrix();
    this.camera.updateMatrixWorld();
  }

  // =========================================================
  // 3D Floor Cutaway View & Transitions
  // =========================================================

  /**
   * Renders the 3D Isometric Cutaway view of a single floor with rooms, furniture,
   * avatars, notice badges, and corridor.
   */
  async renderFloorCutaway(
    floorIndex: number,
    rooms: FloorCutawayRoomConfig[],
  ): Promise<void> {
    if (!this.floorCutawayRenderer) {
      this.floorCutawayRenderer = new FloorCutawayRenderer({
        assetLoader: this.assetLoader,
      });
      this.scene.add(this.floorCutawayRenderer.group);
    }

    this.floorCutawayRenderer.buildFloorCutaway(floorIndex, rooms);
    return Promise.resolve();
  }

  /**
   * Clears the active 3D floor cutaway view and frees its resources.
   */
  clearFloorCutaway(): void {
    if (this.floorCutawayRenderer) {
      this.scene.remove(this.floorCutawayRenderer.group);
      this.floorCutawayRenderer.dispose();
      this.floorCutawayRenderer = null;
    }
  }

  /**
   * Transitions camera and scene to focus on a specific floor.
   * Hides ALL building meshes so they do not block the cutaway corridor,
   * and moves the camera closer.
   */
  async transitionToFloor(_floorIndex: number): Promise<void> {
    // Hide all building meshes so corridor and rooms in cutaway view are completely clean
    for (const mesh of this.buildingMeshes) {
      mesh.visible = false;
    }

    // Hide all building-level notice badges so they do not float in the floor cutaway scene
    for (const badge of this.badges.values()) {
      badge.visible = false;
    }

    // Move camera closer/focused on the target floor with corridor isometric view
    // (Yaw = 45 deg, Pitch = 35.264 deg, Zoom = 1.215)
    this.resetFloorIsometricCamera();

    return Promise.resolve();
  }

  /**
   * Restores building view: reveals all building meshes, clears cutaway,
   * restores building notice badges, and resets camera to full isometric view.
   */
  async transitionToBuilding(): Promise<void> {
    for (const mesh of this.buildingMeshes) {
      mesh.visible = true;
    }
    for (const badge of this.badges.values()) {
      if (badge.getType() !== 'NONE') {
        badge.visible = true;
      }
    }
    this.clearFloorCutaway();
    this.resetIsometricCamera();
    return Promise.resolve();
  }

  /**
   * Raycasts against active notice badges in the floor cutaway scene.
   */
  pickFloorNoticeBadge(
    ndcX: number,
    ndcY: number,
  ): PickedFloorNoticeBadge | null {
    if (!this.floorCutawayRenderer) {
      return null;
    }

    this.camera.updateMatrixWorld();
    this.scene.updateMatrixWorld(true);
    this.raycaster.setFromCamera(new THREE.Vector2(ndcX, ndcY), this.camera);

    return this.floorCutawayRenderer.pickNoticeBadge(this.raycaster);
  }

  /**
   * Raycasts against the active floor cutaway rooms at normalized device coordinates [-1, 1].
   */
  pickFloorRoom(ndcX: number, ndcY: number): PickedFloorRoom | null {
    if (!this.floorCutawayRenderer) {
      return null;
    }

    this.camera.updateMatrixWorld();
    this.scene.updateMatrixWorld(true);
    this.raycaster.setFromCamera(new THREE.Vector2(ndcX, ndcY), this.camera);

    return this.floorCutawayRenderer.pickRoom(this.raycaster);
  }

  /**
   * Raycasts against active room info plaques in the floor cutaway scene.
   */
  pickRoomInfoPlaque(
    ndcX: number,
    ndcY: number,
  ): { roomId: string; roomCode: string } | null {
    if (!this.floorCutawayRenderer) {
      return null;
    }

    this.camera.updateMatrixWorld();
    this.scene.updateMatrixWorld(true);
    this.raycaster.setFromCamera(new THREE.Vector2(ndcX, ndcY), this.camera);

    return this.floorCutawayRenderer.pickRoomInfoPlaque(this.raycaster);
  }

  /**
   * Highlights the hovered room info plaque on the corridor wall in cutaway scene.
   */
  setFloorHoveredInfoPlaque(roomId: string | null): void {
    this.floorCutawayRenderer?.setHoveredRoomInfoPlaque(roomId);
  }

  /**
   * Highlights the hovered room on the floor cutaway view.
   */
  setFloorHoveredRoom(roomId: string | null): void {
    this.floorCutawayRenderer?.setHoveredRoom(roomId);
  }

  /**
   * Returns the current FloorCutawayRenderer instance if active.
   */
  getFloorCutawayRenderer(): FloorCutawayRenderer | null {
    return this.floorCutawayRenderer;
  }

  // =========================================================
  // Simulation Loop & Utilities
  // =========================================================

  /**
   * Advances the animation mixer, avatar controllers, and bobbing notice badges.
   *
   * @param delta - Elapsed time since last frame in seconds.
   */
  update(delta: number): void {
    for (const controller of this.avatarControllers.values()) {
      controller.update(delta);
    }
    for (const badge of this.badges.values()) {
      badge.update(delta);
    }
    this.floorCutawayRenderer?.update(delta);
  }

  /**
   * Returns an active avatar controller by avatarId.
   */
  getAvatarController(avatarId: string): AvatarController | undefined {
    return this.avatarControllers.get(avatarId);
  }

  /**
   * Returns a notice badge by its key.
   */
  getNoticeBadge(key: string): NoticeBadge | undefined {
    return this.badges.get(key);
  }

  /**
   * Takes a 2D snapshot of the 3D scene (PNG / WebP).
   */
  takeSnapshot(options?: SnapshotOptions): string {
    return SnapshotExporter.takeSnapshot(
      this.renderer,
      this.scene,
      this.camera,
      options,
    );
  }

  /** Render one frame (useful for testing / headless rendering). */
  renderFrame(): void {
    this.renderer.render(this.scene, this.camera);
  }

  /** Clean up WebGL resources. */
  dispose(): void {
    this.clearFloorCutaway();

    for (const badge of this.badges.values()) {
      badge.dispose();
    }
    this.badges.clear();

    for (const controller of this.avatarControllers.values()) {
      controller.dispose();
    }
    this.avatarControllers.clear();

    this.assetLoader.dispose();
    this.renderer.dispose();
    this.scene.clear();
    this.avatars.clear();
    this.buildingMeshes = [];
    this.buildingMeshMap.clear();
    this.hoveredRoomKey = null;
  }
}
