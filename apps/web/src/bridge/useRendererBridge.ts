import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type {
  FloorMapDTO,
  IGameRenderer,
  RoomAuditLog,
  RoomDetailDTO,
  RoomDetailTab,
} from '@qlnt/shared-types';
import { useLedgerStore } from '@qlnt/domain-core';
import {
  LedgerController,
  type ApproveBillResult,
  type BillingPreviewState,
  type RoomQuickPickItem,
  type RoomSummarySnapshot,
} from './ledgerController';

export interface RendererBridgeState {
  isReady: boolean;
  error: string | null;
  isBookOpen: boolean;
  currentMonth: string;
  currentFloor: number;
  selectedRoomId: string | null;
  activeTab: RoomDetailTab;
  propertyName: string;
  propertyAddress: string;
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

  const computed = useMemo(() => {
    const property = controller.getProperty();
    const landlord = controller.getLandlord();
    const summary = controller.getSummaryStats();
    const roomsWithNotices = controller.getRoomsWithNotices();
    const floorMap = controller.getFloorMapDTO(currentFloor);
    const roomDetail = selectedRoomId ? controller.getRoomDetailDTO(selectedRoomId) : null;
    const previewState = selectedRoomId ? controller.getPreviewState(selectedRoomId) : null;
    const auditLogs = selectedRoomId ? controller.getRoomAuditLogs(selectedRoomId) : [];
    const tenantRewardPoints = selectedRoomId ? controller.getTenantRewardPoints(selectedRoomId) : 0;

    return {
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
