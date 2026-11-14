import 'fake-indexeddb/auto';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AppDatabase, useLedgerStore } from '@qlnt/domain-core';
import type { IGameRenderer } from '@qlnt/shared-types';
import { LedgerController } from '../src/bridge/ledgerController';

function createMockRenderer(): IGameRenderer {
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
  });

  async function setupController() {
    const testDb = new AppDatabase(`qlnt_ctrl_test_${Date.now()}_${Math.random()}`);
    createdDbs.push(testDb);
    const renderer = createMockRenderer();
    const controller = new LedgerController({ database: testDb, renderer });
    await controller.initialize();
    return { testDb, renderer, controller };
  }

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
});
