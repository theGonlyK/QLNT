import 'fake-indexeddb/auto';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AppDatabase, useLedgerStore } from '@qlnt/domain-core';
import type { IGameRenderer } from '@qlnt/shared-types';
import {
  BUILDING_BLOCK_PRESETS,
  clearStorageForTesting,
  LedgerController,
} from '../src/bridge/ledgerController';
import { useRendererBridge } from '../src/bridge/useRendererBridge';

function createMockRenderer(): IGameRenderer & {
  transitionToFloor: ReturnType<typeof vi.fn>;
  renderFloorCutaway: ReturnType<typeof vi.fn>;
  transitionToBuilding: ReturnType<typeof vi.fn>;
} {
  return {
    renderBuilding: vi.fn(async () => {}),
    spawnAvatar: vi.fn(),
    moveAvatar: vi.fn(),
    setDeviceStatus: vi.fn(),
    setRoomNotice: vi.fn(),
    playMinigameAction: vi.fn(async () => {}),
    openLedgerBook: vi.fn(async () => {}),
    flipLedgerFloorPage: vi.fn(async () => {}),
    openRoomDetailSinglePage: vi.fn(async () => {}),
    switchRoomDetailPageTab: vi.fn(async () => {}),
    refreshRoomDetailView: vi.fn(),
    closeRoomDetailToFloorMap: vi.fn(async () => {}),
    closeLedgerBookTo3DScene: vi.fn(async () => {}),
    transitionToFloor: vi.fn(async () => {}),
    renderFloorCutaway: vi.fn(async () => {}),
    transitionToBuilding: vi.fn(async () => {}),
  };
}

describe('LedgerController', () => {
  const createdDbs: AppDatabase[] = [];

  afterEach(async () => {
    useLedgerStore.getState().closeLedgerBook();
    for (const testDb of createdDbs) {
      await testDb.delete();
    }
    createdDbs.length = 0;
    clearStorageForTesting();
  });

  async function setupController() {
    const testDb = new AppDatabase(`qlnt_ctrl_test_${Date.now()}_${Math.random()}`);
    createdDbs.push(testDb);
    const renderer = createMockRenderer();
    const controller = new LedgerController({ database: testDb, renderer });
    await controller.initialize();
    return { testDb, renderer, controller };
  }

  it('defines BUILDING_BLOCK_PRESETS catalog correctly', () => {
    expect(BUILDING_BLOCK_PRESETS).toHaveLength(6);
    const ids = BUILDING_BLOCK_PRESETS.map((p) => p.id);
    expect(ids).toEqual([
      'TOWER_2x2x6',
      'CCMN_3x2x4',
      'CUBE_3x3x3',
      'COMPACT_2x2x3',
      'LONG_4x2x2',
      'CUSTOM',
    ]);
  });

  it('separates Preview State from Commit State without mutating IndexedDB during preview', async () => {
    const { testDb, renderer, controller } = await setupController();
    const p101 = controller.getRooms().find((r) => r.room_number === 'P101')!;
    const beforeDetail = controller.getRoomDetailDTO(p101.id)!;
    const beforeTotal = beforeDetail.latestBilling!.totalAmount;

    // Preview State: draft electric/water calculation
    const preview = controller.previewRoomBilling(p101.id, 1350, 55);
    expect(preview.calculation.electricConsumed).toBe(150);
    expect(preview.calculation.waterConsumed).toBe(10);
    expect(preview.calculation.totalAmount).not.toBe(beforeTotal);

    // IndexedDB and committed DTO must remain unchanged
    const dbBillingBeforeCommit = await testDb.billings.get(beforeDetail.latestBilling!.billingId);
    expect(dbBillingBeforeCommit?.total_amount).toBe(beforeTotal);
    expect(controller.getRoomDetailDTO(p101.id)?.latestBilling?.totalAmount).toBe(beforeTotal);

    // Commit State: persists to IndexedDB, clears preview, and notifies renderer
    const committedDetail = await controller.commitRoomBillingReading(p101.id, 1350, 55);
    expect(committedDetail.latestBilling?.totalAmount).toBe(preview.calculation.totalAmount);
    expect(controller.getPreviewState(p101.id)).toBeNull();

    const dbBillingAfterCommit = await testDb.billings.get(beforeDetail.latestBilling!.billingId);
    expect(dbBillingAfterCommit?.total_amount).toBe(preview.calculation.totalAmount);
    expect(renderer.setRoomNotice).toHaveBeenCalledWith(p101.id, 'PAYMENT_DUE');
  });

  it('supports local bill DataURL upload and 1-touch approval (+2 reputation & clears yellow notice)', async () => {
    const { testDb, renderer, controller } = await setupController();
    const p101 = controller.getRooms().find((r) => r.room_number === 'P101')!;
    const initialPoints = controller.getTenantRewardPoints(p101.id);

    const dataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJ';
    const pendingDetail = await controller.uploadLocalBillImage(p101.id, dataUrl);
    expect(pendingDetail.latestBilling?.status).toBe('PENDING_APPROVAL');
    expect(pendingDetail.latestBilling?.billImageUrl).toBe(dataUrl);
    expect(renderer.setRoomNotice).toHaveBeenCalledWith(p101.id, 'BILL_PENDING');

    const result = await controller.approveRoomBillOneTouch(p101.id);
    expect(result.roomDetail.latestBilling?.status).toBe('PAID');
    expect(result.reputationDelta).toBe(2);
    expect(result.newRewardPoints).toBe(initialPoints + 2);
    expect(renderer.setRoomNotice).toHaveBeenCalledWith(p101.id, 'NONE');

    const logs = controller.getRoomAuditLogs(p101.id);
    expect(logs[0]?.action_type).toBe('PAYMENT_VERIFIED');
    const payments = await testDb.payment_records.where('room_id').equals(p101.id).toArray();
    expect(payments.length).toBeGreaterThanOrEqual(1);
  });

  it('reports broken device (red badge) and resolves maintenance (clears red badge & logs audit)', async () => {
    const { testDb, renderer, controller } = await setupController();
    const p103 = controller.getRooms().find((r) => r.room_number === 'P103')!;
    const detailBefore = controller.getRoomDetailDTO(p103.id)!;
    const acDevice = detailBefore.devices[0]!;

    const brokenDetail = await controller.reportDeviceBroken(p103.id, acDevice.deviceId, 'Không lạnh');
    expect(brokenDetail.devices.find((d) => d.deviceId === acDevice.deviceId)?.isBroken).toBe(true);
    expect(renderer.setDeviceStatus).toHaveBeenCalledWith(p103.id, acDevice.deviceId, 'BROKEN');

    const resolvedDetail = await controller.resolveDeviceMaintenance(p103.id, acDevice.deviceId);
    expect(resolvedDetail.devices.find((d) => d.deviceId === acDevice.deviceId)?.isBroken).toBe(false);
    expect(renderer.setDeviceStatus).toHaveBeenCalledWith(p103.id, acDevice.deviceId, 'NORMAL');

    const requests = await testDb.maintenance_requests.where('room_id').equals(p103.id).toArray();
    expect(requests.some((r) => r.status === 'RESOLVED')).toBe(true);
    const logs = controller.getRoomAuditLogs(p103.id);
    expect(logs[0]?.action_type).toBe('DEVICE_STATUS');
  });

  it('supports 2-level close: Level 1 to 2D floor map and Level 2 to 3D scene', async () => {
    const { renderer, controller } = await setupController();
    const p201 = controller.getRooms().find((r) => r.room_number === 'P201')!;

    await controller.openBookForFloor(2);
    expect(useLedgerStore.getState().isBookOpen).toBe(true);
    expect(useLedgerStore.getState().currentFloor).toBe(2);
    expect(renderer.openLedgerBook).toHaveBeenCalledTimes(1);

    await controller.openRoomDetail(p201.id, 'PAGE_1_BILLING');
    expect(useLedgerStore.getState().selectedRoomId).toBe(p201.id);
    expect(renderer.openRoomDetailSinglePage).toHaveBeenCalledTimes(1);

    // Level 1 close: back to floor map
    const floorMap = await controller.closeRoomDetailToFloorMap();
    expect(floorMap.floorNumber).toBe(2);
    expect(useLedgerStore.getState().selectedRoomId).toBeNull();
    expect(useLedgerStore.getState().isBookOpen).toBe(true);
    expect(renderer.closeRoomDetailToFloorMap).toHaveBeenCalledTimes(1);

    // Level 2 close: fold ledger book back to 3D scene
    await controller.closeLedgerBookTo3DScene();
    expect(useLedgerStore.getState().isBookOpen).toBe(false);
    expect(renderer.closeLedgerBookTo3DScene).toHaveBeenCalledTimes(1);
  });

  it('supports Landlord local login, registration, logout, and Building area/room count setup', async () => {
    const { controller, renderer } = await setupController();

    // 1. Default demo login & invalid login check
    await expect(controller.loginLandlord('0988123456', 'wrong-pin')).rejects.toThrow(
      /Mã PIN không chính xác/
    );
    const demoLandlord = await controller.loginLandlord('0988123456', '123456');
    expect(demoLandlord.name).toBe('Nguyễn Minh Anh');
    expect(controller.isAuthenticated()).toBe(true);

    // 2. Register a new Landlord
    const newLandlord = await controller.registerLandlord({
      name: 'Trần Quốc Tuấn',
      phone: '0912345678',
      email: 'tuan.tran@qlnt.local',
      pin: '654321',
      packageTier: 'PRO',
    });
    expect(newLandlord.name).toBe('Trần Quốc Tuấn');
    expect(controller.getLandlord()?.id).toBe(newLandlord.id);
    expect(controller.isAuthenticated()).toBe(true);

    // 3. Register / Update Building with 4 floors x 3 rooms/floor = 12 rooms and custom area_sqm
    const drafts = controller.buildRoomSetupDrafts({
      totalFloors: 4,
      roomsPerFloor: 3,
      defaultAreaSqm: 25,
      defaultBasePrice: 4000000,
    });
    expect(drafts).toHaveLength(12);
    // Customize P101 to 30m2 and P403 to 35m2
    drafts[0]!.areaSqm = 30;
    drafts[0]!.basePrice = 4500000;
    drafts[11]!.areaSqm = 35;
    drafts[11]!.basePrice = 5200000;

    const updatedProperty = await controller.registerOrUpdateBuilding({
      propertyName: 'Chung cư Mini Tuấn Anh — Cầu Giấy',
      address: 'Số 88 Cầu Giấy, Hà Nội',
      totalFloors: 4,
      roomsPerFloor: 3,
      waterCalcMethod: 'PER_M3',
      electricUnitPrice: 4000,
      waterUnitPrice: 32000,
      serviceFee: 180000,
      roomsDraft: drafts,
    });

    expect(updatedProperty.total_floors).toBe(4);
    expect(updatedProperty.name).toBe('Chung cư Mini Tuấn Anh — Cầu Giấy');

    const rooms = controller.getRooms();
    expect(rooms).toHaveLength(12);
    const p101 = rooms.find((r) => r.room_number === 'P101')!;
    const p403 = rooms.find((r) => r.room_number === 'P403')!;
    expect(p101.area_sqm).toBe(30);
    expect(p101.base_price).toBe(4500000);
    expect(p403.floor_number).toBe(4);
    expect(p403.area_sqm).toBe(35);

    const summary = controller.getSummaryStats();
    // 10 rooms * 25m2 + 30m2 + 35m2 = 315m2
    expect(summary.totalRooms).toBe(12);
    expect(summary.totalAreaSqm).toBe(315);

    expect(renderer.renderBuilding).toHaveBeenLastCalledWith({
      propertyId: updatedProperty.id,
      totalFloors: 4,
      roomsPerFloor: 3,
      position: { x: 0, y: 0, z: 0 },
      blockGrid: { cols: 2, rows: 2 },
    });

    // 4. Logout & re-login with new Landlord credentials
    controller.logoutLandlord();
    expect(controller.isAuthenticated()).toBe(false);
    const relogged = await controller.loginLandlord('0912345678', '654321');
    expect(relogged.id).toBe(newLandlord.id);
    expect(controller.isAuthenticated()).toBe(true);
  });

  it('transitions between Building View and Floor 3D Cutaway View, and opens F04 from floor', async () => {
    const { controller, renderer } = await setupController();

    expect(controller.getViewMode()).toBe('BUILDING');
    expect(controller.getActiveFloorIndex()).toBe(0);

    // Select Floor 2 (floorIndex = 1)
    await controller.selectFloor(1);
    expect(controller.getViewMode()).toBe('FLOOR_3D');
    expect(controller.getActiveFloorIndex()).toBe(1);
    expect(renderer.transitionToFloor).toHaveBeenCalledWith(1);
    expect(renderer.renderFloorCutaway).toHaveBeenCalledWith(
      1,
      expect.arrayContaining([
        expect.objectContaining({
          roomNumber: 'P201',
          floorIndex: 1,
          floorNumber: 2,
        }),
      ])
    );

    // Open Room Detail F04 from floor cutaway
    const p202 = controller.getRooms().find((r) => r.room_number === 'P202')!;
    await controller.openRoomDetailFromFloor(p202.id, 'PAGE_1_BILLING');
    expect(useLedgerStore.getState().isBookOpen).toBe(true);
    expect(useLedgerStore.getState().selectedRoomId).toBe(p202.id);
    expect(renderer.openRoomDetailSinglePage).toHaveBeenCalled();

    // Back to building
    await controller.backToBuilding();
    expect(controller.getViewMode()).toBe('BUILDING');
    expect(renderer.transitionToBuilding).toHaveBeenCalled();
  });

  it('applyBuildingBlockPreset updates totalFloors and room count to match preset', async () => {
    const { testDb, renderer, controller } = await setupController();

    await controller.applyBuildingBlockPreset('TOWER_2x2x6');
    expect(controller.property?.total_floors).toBe(6);
    expect(controller.rooms.length).toBe(24);
    expect(controller.getRoomsPerFloor()).toBe(4);
    expect(controller.getCurrentBlockPresetId()).toBe('TOWER_2x2x6');
    expect(controller.getCurrentBlockGrid()).toEqual({ cols: 2, rows: 2 });

    const dbProperty = await testDb.properties.get(controller.property!.id);
    expect(dbProperty?.total_floors).toBe(6);
    const dbRooms = await testDb.rooms.toArray();
    expect(dbRooms.length).toBe(24);
    expect(renderer.renderBuilding).toHaveBeenLastCalledWith(
      expect.objectContaining({
        propertyId: controller.property!.id,
        totalFloors: 6,
        roomsPerFloor: 4,
        blockGrid: { cols: 2, rows: 2 },
      })
    );
  });

  it('applyBuildingBlockPreset supports CUBE_3x3x3 and prunes rooms when switching to COMPACT_2x2x3', async () => {
    const { testDb, controller } = await setupController();

    // Expand to CUBE_3x3x3: 3 cols x 3 rows x 3 floors = 27 rooms
    await controller.applyBuildingBlockPreset('CUBE_3x3x3');
    expect(controller.property?.total_floors).toBe(3);
    expect(controller.rooms.length).toBe(27);
    expect(controller.getRoomsPerFloor()).toBe(9);
    expect(controller.getCurrentBlockPresetId()).toBe('CUBE_3x3x3');
    expect(controller.getCurrentBlockGrid()).toEqual({ cols: 3, rows: 3 });

    let dbRooms = await testDb.rooms.toArray();
    expect(dbRooms.length).toBe(27);
    expect(dbRooms.some((r) => r.room_number === 'P109')).toBe(true);

    // Shrink down to COMPACT_2x2x3: 2 cols x 2 rows x 3 floors = 12 rooms
    await controller.applyBuildingBlockPreset('COMPACT_2x2x3');
    expect(controller.property?.total_floors).toBe(3);
    expect(controller.rooms.length).toBe(12);
    expect(controller.getRoomsPerFloor()).toBe(4);
    expect(controller.getCurrentBlockPresetId()).toBe('COMPACT_2x2x3');
    expect(controller.getCurrentBlockGrid()).toEqual({ cols: 2, rows: 2 });

    dbRooms = await testDb.rooms.toArray();
    expect(dbRooms.length).toBe(12);
    expect(dbRooms.some((r) => r.room_number === 'P109')).toBe(false);
    expect(dbRooms.some((r) => r.room_number === 'P101')).toBe(true);
  });

  it('applyBuildingBlockPreset supports CUSTOM preset with customConfig', async () => {
    const { testDb, controller } = await setupController();

    await controller.applyBuildingBlockPreset('CUSTOM', { cols: 3, rows: 1, floors: 5 });
    expect(controller.property?.total_floors).toBe(5);
    expect(controller.rooms.length).toBe(15);
    expect(controller.getRoomsPerFloor()).toBe(3);
    expect(controller.getCurrentBlockPresetId()).toBe('CUSTOM');
    expect(controller.getCurrentBlockGrid()).toEqual({ cols: 3, rows: 1 });

    const dbRooms = await testDb.rooms.toArray();
    expect(dbRooms.length).toBe(15);
  });

  it('applyBuildingBlockPreset supports CCMN_3x2x4 and LONG_4x2x2 presets', async () => {
    const { controller } = await setupController();

    // CCMN_3x2x4: 3 cols x 2 rows x 4 floors = 24 rooms, 6 rooms/floor
    await controller.applyBuildingBlockPreset('CCMN_3x2x4');
    expect(controller.property?.total_floors).toBe(4);
    expect(controller.rooms.length).toBe(24);
    expect(controller.getRoomsPerFloor()).toBe(6);
    expect(controller.getCurrentBlockPresetId()).toBe('CCMN_3x2x4');
    expect(controller.getCurrentBlockGrid()).toEqual({ cols: 3, rows: 2 });

    // LONG_4x2x2: 4 cols x 2 rows x 2 floors = 16 rooms, 8 rooms/floor
    await controller.applyBuildingBlockPreset('LONG_4x2x2');
    expect(controller.property?.total_floors).toBe(2);
    expect(controller.rooms.length).toBe(16);
    expect(controller.getRoomsPerFloor()).toBe(8);
    expect(controller.getCurrentBlockPresetId()).toBe('LONG_4x2x2');
    expect(controller.getCurrentBlockGrid()).toEqual({ cols: 4, rows: 2 });

    // Unknown preset rejection
    await expect(controller.applyBuildingBlockPreset('INVALID_PRESET')).rejects.toThrow(
      /Không tìm thấy cấu hình preset khối tòa nhà/
    );
  });

  it('useRendererBridge exposes currentBlockPresetId, currentBlockGrid, and applyBuildingBlockPreset', async () => {
    const { controller } = await setupController();
    let bridgeResult: ReturnType<typeof useRendererBridge> | null = null;
    function TestComponent() {
      const bridge = useRendererBridge(controller);
      bridgeResult = bridge;
      return React.createElement(
        'div',
        { 'data-preset': bridge.currentBlockPresetId },
        bridge.currentBlockPresetId
      );
    }
    renderToStaticMarkup(React.createElement(TestComponent));
    expect(bridgeResult).not.toBeNull();
    expect(bridgeResult!.currentBlockPresetId).toBe('COMPACT_2x2x3');
    expect(bridgeResult!.currentBlockGrid).toEqual({ cols: 2, rows: 2 });
    expect(typeof bridgeResult!.applyBuildingBlockPreset).toBe('function');

    await bridgeResult!.applyBuildingBlockPreset('TOWER_2x2x6');
    renderToStaticMarkup(React.createElement(TestComponent));
    expect(bridgeResult!.currentBlockPresetId).toBe('TOWER_2x2x6');
    expect(bridgeResult!.currentBlockGrid).toEqual({ cols: 2, rows: 2 });
    expect(bridgeResult!.totalFloors).toBe(6);
    expect(bridgeResult!.summary.totalRooms).toBe(24);
  });
});
