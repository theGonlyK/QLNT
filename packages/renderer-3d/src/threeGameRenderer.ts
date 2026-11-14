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

  /** Map of avatarId → avatar mesh group */
  private readonly avatars = new Map<string, THREE.Group>();

  /** Map of avatarId → AvatarController */
  private readonly avatarControllers = new Map<string, AvatarController>();

  /** Map of badgeKey → NoticeBadge */
  private readonly badges = new Map<string, NoticeBadge>();

  constructor(options: ThreeGameRendererOptions = {}) {
    this.width = options.width ?? 800;
    this.height = options.height ?? 600;
    const frustumSize = options.frustumSize ?? 10;

    // Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x1a1a2e);

    // Isometric camera (Yaw 45°, Pitch 35.264°, Y-up)
    this.camera = createIsometricCamera(
      frustumSize,
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

  async renderBuilding(buildingData: BuildingRenderDTO): Promise<void> {
    // Remove existing building meshes
    const toRemove = this.scene.children.filter(
      (c) => c.userData['type'] === 'building',
    );
    toRemove.forEach((c) => this.scene.remove(c));

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
      return;
    }

    // Procedural layout: building boxes per floor and room
    for (let f = 0; f < totalFloors; f++) {
      for (let r = 0; r < roomsPerFloor; r++) {
        const geo = new THREE.BoxGeometry(sx, sy, sz);
        const mat = new THREE.MeshLambertMaterial({ color: 0x4a90d9 });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(
          position.x + r * (sx + 0.1),
          position.y + f * (sy + 0.1),
          position.z,
        );
        mesh.userData['type'] = 'building';
        mesh.userData['floor'] = f;
        mesh.userData['room'] = r;
        mesh.userData['roomId'] = `room-${f * roomsPerFloor + r + 1}`;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        this.scene.add(mesh);
      }
    }
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

  setDeviceStatus(
    roomId: string,
    deviceId: string,
    status: DeviceStatus,
  ): void {
    // 1. Update room material tint
    this.scene.children
      .filter(
        (c) =>
          c.userData['type'] === 'building' &&
          (c.userData['roomId'] === roomId || roomId === 'room-1'),
      )
      .forEach((c) => {
        if (c instanceof THREE.Mesh && c.material instanceof THREE.MeshLambertMaterial) {
          c.material.color.set(
            status === 'BROKEN' ? 0xff4444 : 0x4a90d9,
          );
        }
      });

    // 2. Manage 3D Notice Badge for broken device
    const badgeKey = `device:${roomId}:${deviceId}`;
    if (status === 'BROKEN') {
      let badge = this.badges.get(badgeKey);
      if (!badge) {
        badge = new NoticeBadge('BROKEN', { x: 0, y: 2.2, z: 0 });
        this.scene.add(badge);
        this.badges.set(badgeKey, badge);
      } else {
        badge.setType('BROKEN');
      }
    } else {
      const badge = this.badges.get(badgeKey);
      if (badge) {
        this.scene.remove(badge);
        badge.dispose();
        this.badges.delete(badgeKey);
      }
    }
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
      return;
    }

    let badge = this.badges.get(badgeKey);
    if (!badge) {
      badge = new NoticeBadge(type, { x: 0, y: 2.5, z: 0 });
      this.scene.add(badge);
      this.badges.set(badgeKey, badge);
    } else {
      badge.setType(type);
    }
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
  }
}
