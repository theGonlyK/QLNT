import { Vector3D } from './vector3d';
import {
  AvatarSkinDTO,
  BuildingRenderDTO,
  FloorMapDTO,
  RoomDetailDTO,
} from './rendererDtos';

export type DeviceStatus = 'NORMAL' | 'BROKEN';
export type RoomNoticeType = 'NONE' | 'PAYMENT_DUE' | 'BILL_PENDING';
export type RoomDetailTab = 'PAGE_1_BILLING' | 'PAGE_2_DEVICES' | 'PAGE_3_AUDIT';

export interface IGameRenderer {
  // === Khối Cảnh 3D Tòa nhà & Nhân vật ===
  renderBuilding(buildingData: BuildingRenderDTO): Promise<void>;
  spawnAvatar(avatarId: string, roomPosition: Vector3D, skinConfig: AvatarSkinDTO): void;
  moveAvatar(avatarId: string, targetPosition: Vector3D, onComplete?: () => void): void;
  setDeviceStatus(roomId: string, deviceId: string, status: DeviceStatus): void;
  setRoomNotice(roomId: string, type: RoomNoticeType): void;
  playMinigameAction(actionType: string, toolSkin?: string): Promise<void>;

  // === Khối Điều khiển Sổ Quản lý Ảo F04 (Single-Page & Mặt bằng tầng) ===
  openLedgerBook(monthKey: string, initialFloorIndex: number, floorMapData: FloorMapDTO): Promise<void>;
  flipLedgerFloorPage(targetFloorIndex: number, floorMapData: FloorMapDTO): Promise<void>;
  openRoomDetailSinglePage(roomId: string, activeTab: RoomDetailTab, roomDetailData: RoomDetailDTO): Promise<void>;
  switchRoomDetailPageTab(roomId: string, targetTab: RoomDetailTab, roomDetailData: RoomDetailDTO): Promise<void>;
  refreshRoomDetailView(roomId: string, updatedDetailData: RoomDetailDTO): void;
  closeRoomDetailToFloorMap(updatedFloorMapData: FloorMapDTO): Promise<void>;
  closeLedgerBookTo3DScene(): Promise<void>;
}
