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

export interface ThreeGameRendererOptions {
  /** The canvas element to render into. If omitted, an OffscreenCanvas is used (Node / headless). */
  canvas?: HTMLCanvasElement;
  /** Width of the viewport in pixels (default: 800) */
  width?: number;
  /** Height of the viewport in pixels (default: 600) */
  height?: number;
  /** Frustum half-size for isometric camera (default: 10) */
  frustumSize?: number;
}

/**
 * ThreeGameRenderer — a Three.js implementation of IGameRenderer.
 *
 * Owns the WebGL scene, isometric orthographic camera, and animation loop.
 * Satisfies the full IGameRenderer contract from @qlnt/shared-types.
 */
export class ThreeGameRenderer implements IGameRenderer {
  readonly scene: THREE.Scene;
  readonly camera: THREE.OrthographicCamera;
  readonly renderer: THREE.WebGLRenderer;

  private readonly width: number;
  private readonly height: number;

  /** Map of avatarId → avatar mesh group */
  private readonly avatars = new Map<string, THREE.Group>();

  constructor(options: ThreeGameRendererOptions = {}) {
    this.width = options.width ?? 800;
    this.height = options.height ?? 600;
    const frustumSize = options.frustumSize ?? 10;

    // Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x1a1a2e);

    // Isometric camera
    this.camera = createIsometricCamera(
      frustumSize,
      this.width / this.height,
    );

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

    const { totalFloors, roomsPerFloor, position, scale } = buildingData;
    const sx = scale?.x ?? 1;
    const sy = scale?.y ?? 1;
    const sz = scale?.z ?? 1;

    // Procedural placeholder: a simple box per floor
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
        this.scene.add(mesh);
      }
    }
  }

  spawnAvatar(
    avatarId: string,
    roomPosition: Vector3D,
    _skinConfig: AvatarSkinDTO,
  ): void {
    if (this.avatars.has(avatarId)) {
      return; // already spawned
    }
    const group = new THREE.Group();
    // Placeholder capsule: cylinder + sphere
    const bodyGeo = new THREE.CylinderGeometry(0.2, 0.2, 1, 8);
    const headGeo = new THREE.SphereGeometry(0.2, 8, 8);
    const mat = new THREE.MeshLambertMaterial({ color: 0xe8c07d });
    const body = new THREE.Mesh(bodyGeo, mat);
    const head = new THREE.Mesh(headGeo, mat);
    head.position.y = 0.75;
    group.add(body, head);
    group.position.set(roomPosition.x, roomPosition.y, roomPosition.z);
    group.userData['avatarId'] = avatarId;
    this.scene.add(group);
    this.avatars.set(avatarId, group);
  }

  moveAvatar(
    avatarId: string,
    targetPosition: Vector3D,
    onComplete?: () => void,
  ): void {
    const avatar = this.avatars.get(avatarId);
    if (!avatar) return;
    avatar.position.set(targetPosition.x, targetPosition.y, targetPosition.z);
    onComplete?.();
  }

  setDeviceStatus(
    roomId: string,
    _deviceId: string,
    _status: DeviceStatus,
  ): void {
    // Find room mesh and update material tint (placeholder)
    this.scene.children
      .filter(
        (c) =>
          c.userData['type'] === 'building' &&
          c.userData['roomId'] === roomId,
      )
      .forEach((c) => {
        if (c instanceof THREE.Mesh && c.material instanceof THREE.MeshLambertMaterial) {
          c.material.color.set(
            _status === 'BROKEN' ? 0xff4444 : 0x4a90d9,
          );
        }
      });
  }

  setRoomNotice(roomId: string, _type: RoomNoticeType): void {
    // placeholder — badge overlay would be rendered via HTML/CSS overlay
    void roomId;
  }

  async playMinigameAction(
    _actionType: string,
    _toolSkin?: string,
  ): Promise<void> {
    // placeholder — trigger animation clips
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
  // Utilities
  // =========================================================

  /** Render one frame (useful for testing / headless rendering). */
  renderFrame(): void {
    this.renderer.render(this.scene, this.camera);
  }

  /** Clean up WebGL resources. */
  dispose(): void {
    this.renderer.dispose();
    this.scene.clear();
    this.avatars.clear();
  }
}
