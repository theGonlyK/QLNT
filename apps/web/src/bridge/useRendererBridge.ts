import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type {
  FloorMapDTO,
  IGameRenderer,
  Landlord,
  Property,
  RoomAuditLog,
  RoomDetailDTO,
  RoomDetailTab,
} from '@qlnt/shared-types';
import { useLedgerStore } from '@qlnt/domain-core';
import {
  BUILDING_BLOCK_PRESETS,
  LedgerController,
  type ApproveBillResult,
  type BillingPreviewState,
  type BuildingBlockPreset,
  type BuildingBlockPresetId,
  type BuildingRegistrationInput,
  type RegisterLandlordInput,
  type RoomQuickPickItem,
  type RoomSetupDraft,
  type RoomSummarySnapshot,
  type ViewMode,
} from './ledgerController';

export {
  BUILDING_BLOCK_PRESETS,
  type BuildingBlockPreset,
  type BuildingBlockPresetId,
};

export interface RendererBridgeState {
  isReady: boolean;
  error: string | null;
  isAuthenticated: boolean;
  landlord: Landlord | null;
  property: Property | null;
  totalFloors: number;
  roomsPerFloor: number;
  viewMode: ViewMode;
  activeFloorIndex: number;
  isBookOpen: boolean;
  currentMonth: string;
  currentFloor: number;
  selectedRoomId: string | null;
  activeTab: RoomDetailTab;
  propertyName: string;
  propertyAddress: string;
  currentBlockPresetId: BuildingBlockPresetId;
  currentBlockGrid: { cols: number; rows: number };
  landlordReputation: number;
  summary: RoomSummarySnapshot;
  roomsWithNotices: RoomQuickPickItem[];
  floorMap: FloorMapDTO;
  roomDetail: RoomDetailDTO | null;
  previewState: BillingPreviewState | null;
  auditLogs: RoomAuditLog[];
  tenantRewardPoints: number;
  statusBanner: string | null;
  attachRenderer: (renderer: IGameRenderer | null) => void;
  selectFloor: (floorIndex: number) => Promise<void>;
  backToBuilding: () => Promise<void>;
  openRoomDetailFromFloor: (roomId: string, tab?: RoomDetailTab) => Promise<void>;
  loginLandlord: (phoneOrEmail: string, pin: string) => Promise<Landlord>;
  loginDemoLandlord: () => Promise<Landlord>;
  registerLandlord: (input: RegisterLandlordInput) => Promise<Landlord>;
  logoutLandlord: () => void;
  buildRoomSetupDrafts: (params: {
    totalFloors: number;
    roomsPerFloor: number;
    defaultAreaSqm: number;
    defaultBasePrice: number;
  }) => RoomSetupDraft[];
  registerOrUpdateBuilding: (input: BuildingRegistrationInput) => Promise<Property>;
  applyBuildingBlockPreset: (
    presetId: BuildingBlockPresetId | string,
    customConfig?: { cols: number; rows: number; floors: number }
  ) => Promise<void>;
  openBookForFloor: (floorNumber: number) => Promise<void>;
  flipFloor: (floorNumber: number) => Promise<void>;
  openRoomDetail: (roomId: string, tab?: RoomDetailTab) => Promise<void>;
  switchRoomTab: (roomId: string, tab: RoomDetailTab) => Promise<void>;
  previewRoomBilling: (roomId: string, newElectric: number, newWater: number) => BillingPreviewState;
  commitRoomBillingReading: (roomId: string, newElectric: number, newWater: number) => Promise<void>;
  uploadLocalBillImage: (roomId: string, dataUrl: string) => Promise<void>;
  approveRoomBillOneTouch: (roomId: string) => Promise<ApproveBillResult>;
  reportDeviceBroken: (roomId: string, deviceId: string, issue?: string) => Promise<void>;
  resolveDeviceMaintenance: (roomId: string, deviceId: string) => Promise<void>;
  closeRoomDetailToFloorMap: () => Promise<void>;
  closeLedgerBookTo3DScene: () => Promise<void>;
  clearStatusBanner: () => void;
}

export function useRendererBridge(externalController?: LedgerController): RendererBridgeState {
  const controllerRef = useRef<LedgerController>(externalController ?? new LedgerController());
  const controller = controllerRef.current;

  const [isReady, setIsReady] = useState<boolean>(controller.isInitialized());
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState<number>(0);
  const [statusBanner, setStatusBanner] = useState<string | null>(null);

  const isBookOpen = useLedgerStore((s) => s.isBookOpen);
  const currentMonth = useLedgerStore((s) => s.currentMonth);
  const currentFloor = useLedgerStore((s) => s.currentFloor);
  const selectedRoomId = useLedgerStore((s) => s.selectedRoomId);
  const activeTab = useLedgerStore((s) => s.activeTab);

  const bump = useCallback(() => {
    setVersion((v) => v + 1);
  }, []);

  useEffect(() => {
    let active = true;
    if (controller.isInitialized()) {
      setIsReady(true);
      return;
    }

    controller
      .initialize()
      .then(() => {
        if (!active) return;
        setIsReady(true);
        bump();
      })
      .catch((err: unknown) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : String(err));
      });

    return () => {
      active = false;
    };
  }, [controller, bump]);

  const attachRenderer = useCallback(
    (renderer: IGameRenderer | null) => {
      controller.attachRenderer(renderer);
    },
    [controller]
  );

  const selectFloor = useCallback(
    async (floorIndex: number) => {
      await controller.selectFloor(floorIndex);
      bump();
    },
    [controller, bump]
  );

  const backToBuilding = useCallback(async () => {
    await controller.backToBuilding();
    bump();
  }, [controller, bump]);

  const openRoomDetailFromFloor = useCallback(
    async (roomId: string, tab?: RoomDetailTab) => {
      await controller.openRoomDetailFromFloor(roomId, tab);
      bump();
    },
    [controller, bump]
  );

  const openBookForFloor = useCallback(
    async (floorNumber: number) => {
      await controller.openBookForFloor(floorNumber);
      bump();
    },
    [controller, bump]
  );

  const flipFloor = useCallback(
    async (floorNumber: number) => {
      await controller.flipFloor(floorNumber);
      bump();
    },
    [controller, bump]
  );

  const openRoomDetail = useCallback(
    async (roomId: string, tab?: RoomDetailTab) => {
      await controller.openRoomDetail(roomId, tab);
      bump();
    },
    [controller, bump]
  );

  const switchRoomTab = useCallback(
    async (roomId: string, tab: RoomDetailTab) => {
      await controller.switchRoomTab(roomId, tab);
      bump();
    },
    [controller, bump]
  );

  const previewRoomBilling = useCallback(
    (roomId: string, newElectric: number, newWater: number) => {
      const preview = controller.previewRoomBilling(roomId, newElectric, newWater);
      bump();
      return preview;
    },
    [controller, bump]
  );

  const commitRoomBillingReading = useCallback(
    async (roomId: string, newElectric: number, newWater: number) => {
      const detail = await controller.commitRoomBillingReading(roomId, newElectric, newWater);
      setStatusBanner(
        `Đã lưu chốt số phòng ${detail.roomNumber} (${detail.latestBilling?.totalAmount.toLocaleString('vi-VN') ?? 0} đ).`
      );
      bump();
    },
    [controller, bump]
  );

  const uploadLocalBillImage = useCallback(
    async (roomId: string, dataUrl: string) => {
      const detail = await controller.uploadLocalBillImage(roomId, dataUrl);
      setStatusBanner(`Đã tải ảnh chứng từ phòng ${detail.roomNumber} — chờ chủ trọ duyệt 1 chạm.`);
      bump();
    },
    [controller, bump]
  );

  const approveRoomBillOneTouch = useCallback(
    async (roomId: string) => {
      const result = await controller.approveRoomBillOneTouch(roomId);
      setStatusBanner(
        `Đã duyệt thanh toán phòng ${result.roomDetail.roomNumber} (+${result.reputationDelta} Sao Uy Tín).`
      );
      bump();
      return result;
    },
    [controller, bump]
  );

  const reportDeviceBroken = useCallback(
    async (roomId: string, deviceId: string, issue?: string) => {
      const detail = await controller.reportDeviceBroken(roomId, deviceId, issue);
      setStatusBanner(`Đã bật chấm than đỏ báo hỏng thiết bị tại phòng ${detail.roomNumber}.`);
      bump();
    },
    [controller, bump]
  );

  const resolveDeviceMaintenance = useCallback(
    async (roomId: string, deviceId: string) => {
      const detail = await controller.resolveDeviceMaintenance(roomId, deviceId);
      setStatusBanner(`Đã hoàn tất sửa chữa thiết bị tại phòng ${detail.roomNumber}.`);
      bump();
    },
    [controller, bump]
  );

  const closeRoomDetailToFloorMap = useCallback(async () => {
    await controller.closeRoomDetailToFloorMap();
    bump();
  }, [controller, bump]);

  const closeLedgerBookTo3DScene = useCallback(async () => {
    await controller.closeLedgerBookTo3DScene();
    bump();
  }, [controller, bump]);

  const clearStatusBanner = useCallback(() => {
    setStatusBanner(null);
  }, []);

  const loginLandlord = useCallback(
    async (phoneOrEmail: string, pin: string) => {
      const result = await controller.loginLandlord(phoneOrEmail, pin);
      setStatusBanner(`Đã đăng nhập tài khoản Chủ trọ ${result.name}.`);
      bump();
      return result;
    },
    [controller, bump]
  );

  const loginDemoLandlord = useCallback(async () => {
    const result = await controller.loginDemoLandlord();
    setStatusBanner(`Đã đăng nhập nhanh Chủ trọ Demo: ${result.name}.`);
    bump();
    return result;
  }, [controller, bump]);

  const registerLandlord = useCallback(
    async (input: RegisterLandlordInput) => {
      const result = await controller.registerLandlord(input);
      setStatusBanner(`Đã tạo tài khoản Chủ trọ ${result.name}.`);
      bump();
      return result;
    },
    [controller, bump]
  );

  const logoutLandlord = useCallback(() => {
    controller.logoutLandlord();
    setStatusBanner('Đã đăng xuất tài khoản Chủ trọ.');
    bump();
  }, [controller, bump]);

  const buildRoomSetupDrafts = useCallback(
    (params: {
      totalFloors: number;
      roomsPerFloor: number;
      defaultAreaSqm: number;
      defaultBasePrice: number;
    }) => controller.buildRoomSetupDrafts(params),
    [controller]
  );

  const registerOrUpdateBuilding = useCallback(
    async (input: BuildingRegistrationInput) => {
      const updated = await controller.registerOrUpdateBuilding(input);
      const nextSummary = controller.getSummaryStats();
      setStatusBanner(
        `Đã lưu tòa nhà ${updated.name}: ${updated.total_floors} tầng, ${nextSummary.totalRooms} phòng (${nextSummary.totalAreaSqm} m²).`
      );
      bump();
      return updated;
    },
    [controller, bump]
  );

  const applyBuildingBlockPreset = useCallback(
    async (
      presetId: BuildingBlockPresetId | string,
      customConfig?: { cols: number; rows: number; floors: number }
    ) => {
      await controller.applyBuildingBlockPreset(presetId, customConfig);
      const matched = BUILDING_BLOCK_PRESETS.find((p) => p.id === presetId);
      const label = matched ? matched.label : presetId;
      setStatusBanner(`Đã đổi khối toà nhà sang ${label}.`);
      bump();
    },
    [controller, bump]
  );

  const computed = useMemo(() => {
    const isAuthenticated = controller.isAuthenticated();
    const property = controller.getProperty();
    const landlord = controller.getLandlord();
    const totalFloors = property?.total_floors ?? 3;
    const roomsPerFloor = controller.getRoomsPerFloor();
    const currentBlockPresetId = controller.getCurrentBlockPresetId();
    const currentBlockGrid = controller.getCurrentBlockGrid();
    const viewMode = controller.getViewMode();
    const activeFloorIndex = controller.getActiveFloorIndex();
    const summary = controller.getSummaryStats();
    const roomsWithNotices = controller.getRoomsWithNotices();
    const floorMap = controller.getFloorMapDTO(currentFloor);
    const roomDetail = selectedRoomId ? controller.getRoomDetailDTO(selectedRoomId) : null;
    const previewState = selectedRoomId ? controller.getPreviewState(selectedRoomId) : null;
    const auditLogs = selectedRoomId ? controller.getRoomAuditLogs(selectedRoomId) : [];
    const tenantRewardPoints = selectedRoomId ? controller.getTenantRewardPoints(selectedRoomId) : 0;

    return {
      isAuthenticated,
      landlord,
      property,
      totalFloors,
      roomsPerFloor,
      currentBlockPresetId,
      currentBlockGrid,
      viewMode,
      activeFloorIndex,
      propertyName: property?.name ?? 'Nhà trọ Hạnh Phúc',
      propertyAddress: property?.address ?? 'Ngõ 133 Xuân Thủy, Cầu Giấy, Hà Nội',
      landlordReputation: landlord?.reputation_stars ?? 4.8,
      summary,
      roomsWithNotices,
      floorMap,
      roomDetail,
      previewState,
      auditLogs,
      tenantRewardPoints,
    };
    // version ensures recomputation after controller mutations
  }, [controller, currentFloor, selectedRoomId, version]);

  return {
    isReady,
    error,
    isBookOpen,
    currentMonth,
    currentFloor,
    selectedRoomId,
    activeTab,
    ...computed,
    statusBanner,
    attachRenderer,
    selectFloor,
    backToBuilding,
    openRoomDetailFromFloor,
    loginLandlord,
    loginDemoLandlord,
    registerLandlord,
    logoutLandlord,
    buildRoomSetupDrafts,
    registerOrUpdateBuilding,
    applyBuildingBlockPreset,
    openBookForFloor,
    flipFloor,
    openRoomDetail,
    switchRoomTab,
    previewRoomBilling,
    commitRoomBillingReading,
    uploadLocalBillImage,
    approveRoomBillOneTouch,
    reportDeviceBroken,
    resolveDeviceMaintenance,
    closeRoomDetailToFloorMap,
    closeLedgerBookTo3DScene,
    clearStatusBanner,
  };
}
