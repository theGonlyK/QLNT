import 'fake-indexeddb/auto';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AppDatabase, useLedgerStore } from '@qlnt/domain-core';
import { MIN_TOUCH_TARGET_SIZE } from '@qlnt/renderer-2d';
import { App } from '../src/App';
import { LedgerController } from '../src/bridge/ledgerController';
import { BuildingSetupModal } from '../src/components/BuildingSetupModal';
import { Canvas3DStage } from '../src/components/Canvas3DStage';
import {
  LedgerOverlayHost,
  closeLedgerWithTransition,
} from '../src/components/LedgerOverlayHost';
import { LoginScreen } from '../src/components/LoginScreen';

function extractButtonStyles(html: string): string[] {
  const matches = html.match(/<button\b[^>]*>/g) ?? [];
  return matches;
}

describe('UI & Mobile 390x844 Responsive Integration', () => {
  const createdDbs: AppDatabase[] = [];

  afterEach(async () => {
    useLedgerStore.getState().closeLedgerBook();
    for (const testDb of createdDbs) {
      await testDb.delete();
    }
    createdDbs.length = 0;
  });

  async function createInitializedController() {
    const testDb = new AppDatabase(`qlnt_ui_test_${Date.now()}_${Math.random()}`);
    createdDbs.push(testDb);
    const controller = new LedgerController({ database: testDb });
    await controller.initialize();
    return controller;
  }

  it('renders App in Desktop and Mobile 390x844 viewports with 44px minimum touch targets', async () => {
    const controller = await createInitializedController();

    const desktopHtml = renderToStaticMarkup(
      React.createElement(App, { controller, initialMobileViewport: false })
    );
    expect(desktopHtml).toContain('data-viewport-mode="desktop"');
    expect(desktopHtml).toContain('Nhà trọ Hạnh Phúc');
    expect(desktopHtml).toContain('Mở Sổ Quản Lý F04');
    expect(desktopHtml).toContain('data-testid="canvas-3d-stage"');
    expect(desktopHtml).toContain('data-testid="yellow-notice-P101"');
    expect(desktopHtml).toContain('data-testid="hud-total-area"');
    expect(desktopHtml).toContain('data-testid="stage-room-area-P101"');
    expect(desktopHtml).toContain('data-testid="open-building-setup-btn"');
    expect(desktopHtml).toContain('data-testid="open-login-screen-btn"');

    const mobileHtml = renderToStaticMarkup(
      React.createElement(App, { controller, initialMobileViewport: true })
    );
    expect(mobileHtml).toContain('data-viewport-mode="mobile-390x844"');
    expect(mobileHtml).toContain('w-[390px]');
    expect(mobileHtml).toContain('min-h-[844px]');

    const buttons = extractButtonStyles(mobileHtml);
    expect(buttons.length).toBeGreaterThan(0);
    for (const btnTag of buttons) {
      expect(btnTag).toContain(`min-height:${MIN_TOUCH_TARGET_SIZE}px`);
    }
  });

  it('renders LedgerOverlayHost in 2D Floor Map mode and all 3 F04 Detail Pages with offline VietQR SVG', async () => {
    const controller = await createInitializedController();
    const p101 = controller.getRooms().find((r) => r.room_number === 'P101')!;
    const floorMap = controller.getFloorMapDTO(1);
    const roomDetail = controller.getRoomDetailDTO(p101.id)!;
    const preview = controller.previewRoomBilling(p101.id, 1340, 53);
    const auditLogs = controller.getRoomAuditLogs(p101.id);

    const noop = vi.fn();

    // 1. 2D Floor Map Mode (roomDetail = null)
    const floorMapHtml = renderToStaticMarkup(
      React.createElement(LedgerOverlayHost, {
        isBookOpen: true,
        currentFloor: 1,
        floorMap,
        roomDetail: null,
        activeTab: 'PAGE_1_BILLING',
        previewState: null,
        auditLogs: [],
        tenantRewardPoints: 0,
        landlordReputation: 4.8,
        onFlipFloor: noop,
        onOpenRoomDetail: noop,
        onSwitchTab: noop,
        onPreviewBilling: noop,
        onCommitBillingReading: noop,
        onUploadLocalBillImage: noop,
        onApproveBillOneTouch: noop,
        onReportDeviceBroken: noop,
        onResolveDeviceMaintenance: noop,
        onCloseRoomDetail: noop,
        onCloseBook: noop,
      })
    );
    expect(floorMapHtml).toContain('data-testid="virtual-ledger-book"');
    expect(floorMapHtml).toContain('data-mode="floor-map"');
    expect(floorMapHtml).toContain('Gập Sổ (3D)');

    // 2. Page 1: Billing + Preview + Local VietQR SVG + Copywriting
    const page1Html = renderToStaticMarkup(
      React.createElement(LedgerOverlayHost, {
        isBookOpen: true,
        currentFloor: 1,
        floorMap,
        roomDetail,
        activeTab: 'PAGE_1_BILLING',
        previewState: preview,
        auditLogs,
        tenantRewardPoints: 10,
        landlordReputation: 4.85,
        isMobileViewport: true,
        onFlipFloor: noop,
        onOpenRoomDetail: noop,
        onSwitchTab: noop,
        onPreviewBilling: noop,
        onCommitBillingReading: noop,
        onUploadLocalBillImage: noop,
        onApproveBillOneTouch: noop,
        onReportDeviceBroken: noop,
        onResolveDeviceMaintenance: noop,
        onCloseRoomDetail: noop,
        onCloseBook: noop,
      })
    );
    expect(page1Html).toContain('data-testid="f04-page-1-controls"');
    expect(page1Html).toContain('data-testid="preview-state-badge"');
    expect(page1Html).toContain('data-testid="vietqr-local-svg"');
    expect(page1Html).toContain('<svg');
    expect(page1Html).not.toContain('img.vietqr.io');
    expect(page1Html).toContain('Ting! Hóa đơn tháng 11 của phòng P101');
    expect(page1Html).toContain('Duyệt Bill 1 Chạm (+2 Sao Uy Tín)');

    for (const btnTag of extractButtonStyles(page1Html)) {
      expect(btnTag).toContain(`min-height:${MIN_TOUCH_TARGET_SIZE}px`);
    }

    // 3. Page 2: Devices & Broken/Resolve Controls
    const page2Html = renderToStaticMarkup(
      React.createElement(LedgerOverlayHost, {
        isBookOpen: true,
        currentFloor: 1,
        floorMap,
        roomDetail,
        activeTab: 'PAGE_2_DEVICES',
        previewState: null,
        auditLogs,
        tenantRewardPoints: 10,
        landlordReputation: 4.85,
        onFlipFloor: noop,
        onOpenRoomDetail: noop,
        onSwitchTab: noop,
        onPreviewBilling: noop,
        onCommitBillingReading: noop,
        onUploadLocalBillImage: noop,
        onApproveBillOneTouch: noop,
        onReportDeviceBroken: noop,
        onResolveDeviceMaintenance: noop,
        onCloseRoomDetail: noop,
        onCloseBook: noop,
      })
    );
    expect(page2Html).toContain('data-testid="f04-page-2-controls"');
    expect(page2Html).toContain('Báo hỏng');

    // 4. Page 3: Reputation Score & Audit Timeline
    const page3Html = renderToStaticMarkup(
      React.createElement(LedgerOverlayHost, {
        isBookOpen: true,
        currentFloor: 1,
        floorMap,
        roomDetail,
        activeTab: 'PAGE_3_AUDIT',
        previewState: null,
        auditLogs,
        tenantRewardPoints: 12,
        landlordReputation: 4.9,
        onFlipFloor: noop,
        onOpenRoomDetail: noop,
        onSwitchTab: noop,
        onPreviewBilling: noop,
        onCommitBillingReading: noop,
        onUploadLocalBillImage: noop,
        onApproveBillOneTouch: noop,
        onReportDeviceBroken: noop,
        onResolveDeviceMaintenance: noop,
        onCloseRoomDetail: noop,
        onCloseBook: noop,
      })
    );
    expect(page3Html).toContain('data-testid="f04-page-3-controls"');
    expect(page3Html).toContain('12 điểm');
    expect(page3Html).toContain('4.90 / 5.00');
  });

  it('renders LoginScreen and BuildingSetupModal with 44px touch targets and area presets', async () => {
    const controller = await createInitializedController();
    const noopAsync = vi.fn().mockResolvedValue(undefined);
    const noop = vi.fn();

    const loginHtml = renderToStaticMarkup(
      React.createElement(LoginScreen, {
        isOpen: true,
        isMobileViewport: true,
        onLogin: noopAsync,
        onQuickDemoLogin: noopAsync,
        onRegisterLandlord: noopAsync,
      })
    );
    expect(loginHtml).toContain('data-testid="login-screen"');
    expect(loginHtml).toContain('data-testid="tab-login-mode"');
    expect(loginHtml).toContain('data-testid="tab-register-mode"');
    expect(loginHtml).toContain('data-testid="input-login-identity"');
    expect(loginHtml).toContain('data-testid="input-login-pin"');
    expect(loginHtml).toContain('data-testid="btn-submit-login"');
    expect(loginHtml).toContain('data-testid="btn-quick-demo-login"');
    expect(loginHtml).toContain('0988123456');
    for (const btnTag of extractButtonStyles(loginHtml)) {
      expect(btnTag).toContain(`min-height:${MIN_TOUCH_TARGET_SIZE}px`);
    }

    const setupHtml = renderToStaticMarkup(
      React.createElement(BuildingSetupModal, {
        isOpen: true,
        property: controller.getProperty(),
        rooms: controller.getRooms(),
        isMobileViewport: false,
        onSaveBuilding: noopAsync,
        onClose: noop,
      })
    );
    expect(setupHtml).toContain('data-testid="building-setup-modal"');
    expect(setupHtml).toContain('data-testid="input-building-name"');
    expect(setupHtml).toContain('data-testid="input-total-floors"');
    expect(setupHtml).toContain('data-testid="input-rooms-per-floor"');
    expect(setupHtml).toContain('data-testid="preset-btn-STANDARD_20"');
    expect(setupHtml).toContain('data-testid="preset-btn-MEZZANINE_25"');
    expect(setupHtml).toContain('data-testid="preset-btn-STUDIO_35"');
    expect(setupHtml).toContain('data-testid="input-room-area-P101"');
    expect(setupHtml).toContain('data-testid="input-room-price-P101"');
    expect(setupHtml).toContain('data-testid="building-setup-summary"');
    expect(setupHtml).toContain('data-testid="btn-save-building-setup"');
    for (const btnTag of extractButtonStyles(setupHtml)) {
      expect(btnTag).toContain(`min-height:${MIN_TOUCH_TARGET_SIZE}px`);
    }
  });

  it('renders Canvas3DStage with collapsible corner room drawer and 3D camera controls (44px min-height)', async () => {
    const controller = await createInitializedController();
    const roomsWithNotices = controller.getRoomsWithNotices();
    const noop = vi.fn();

    const stageDesktopHtml = renderToStaticMarkup(
      React.createElement(Canvas3DStage, {
        roomsWithNotices,
        totalFloors: 3,
        onSelectFloor: noop,
        onSelectRoom: noop,
        isMobileViewport: false,
      })
    );

    expect(stageDesktopHtml).toContain('data-testid="stage-room-drawer"');
    expect(stageDesktopHtml).toContain('data-drawer-collapsed="false"');
    expect(stageDesktopHtml).toContain('data-testid="toggle-room-drawer-btn"');
    expect(stageDesktopHtml).toContain('▼ Thu nhỏ vào góc');
    expect(stageDesktopHtml).toContain('data-testid="btn-3d-zoom-in"');
    expect(stageDesktopHtml).toContain('data-testid="btn-3d-zoom-out"');
    expect(stageDesktopHtml).toContain('data-testid="btn-3d-reset-view"');

    for (const btnTag of extractButtonStyles(stageDesktopHtml)) {
      expect(btnTag).toContain(`min-height:${MIN_TOUCH_TARGET_SIZE}px`);
    }

    const stageMobileHtml = renderToStaticMarkup(
      React.createElement(Canvas3DStage, {
        roomsWithNotices,
        totalFloors: 3,
        onSelectFloor: noop,
        onSelectRoom: noop,
        isMobileViewport: true,
      })
    );
    expect(stageMobileHtml).toContain('data-testid="stage-room-drawer"');
    expect(stageMobileHtml).toContain('data-testid="toggle-room-drawer-btn"');
    for (const btnTag of extractButtonStyles(stageMobileHtml)) {
      expect(btnTag).toContain(`min-height:${MIN_TOUCH_TARGET_SIZE}px`);
    }
  });

  it('Canvas3DStage in BUILDING mode keeps building facade clean without individual room pins', async () => {
    const controller = await createInitializedController();
    const roomsWithNotices = controller.getRoomsWithNotices();
    const noop = vi.fn();

    const stageHtml = renderToStaticMarkup(
      React.createElement(Canvas3DStage, {
        roomsWithNotices,
        totalFloors: 3,
        viewMode: 'BUILDING',
        onSelectFloor: noop,
        onSelectRoom: noop,
        isMobileViewport: false,
      })
    );

    // 1. Facade is clean: no room pins layer or individual badges floating over building
    expect(stageHtml).not.toContain('data-testid="building-3d-pins-layer"');
    expect(stageHtml).not.toContain('data-testid="floor-3d-pins-layer"');
    expect(stageHtml).not.toContain('data-testid="building-3d-pin-P101"');
    expect(stageHtml).not.toContain('data-testid="floor-3d-pin-P101"');
    expect(stageHtml).not.toContain('data-testid="building-3d-yellow-badge-P101"');
    expect(stageHtml).not.toContain('data-testid="building-3d-red-badge-P204"');

    // 2. Room list remains accessible via the collapsible drawer with notice badges
    expect(stageHtml).toContain('data-testid="stage-room-card-P101"');
    expect(stageHtml).toContain('data-testid="stage-room-card-P204"');
    expect(stageHtml).toContain('data-testid="yellow-notice-P101"');
    expect(stageHtml).toContain('data-testid="red-notice-P204"');

    // 3. Floor selection buttons in Bottom Dock and Top Bar are available
    expect(stageHtml).toContain('data-testid="dock-floor-btn-1"');
    expect(stageHtml).toContain('data-testid="dock-floor-btn-2"');
    expect(stageHtml).toContain('data-testid="dock-floor-btn-3"');
    expect(stageHtml).toContain('data-testid="stage-floor-btn-1"');
    expect(stageHtml).toContain('data-testid="stage-floor-btn-2"');
    expect(stageHtml).toContain('data-testid="stage-floor-btn-3"');

    for (const btnTag of extractButtonStyles(stageHtml)) {
      expect(btnTag).toContain(`min-height:${MIN_TOUCH_TARGET_SIZE}px`);
    }
  });

  it('verifies that in FLOOR_3D mode, no floating HTML badges are rendered', async () => {
    const controller = await createInitializedController();
    const roomsWithNotices = controller.getRoomsWithNotices();
    const noop = vi.fn();

    // Floor 2 cutaway view
    const stageFloor2Html = renderToStaticMarkup(
      React.createElement(Canvas3DStage, {
        roomsWithNotices,
        totalFloors: 3,
        viewMode: 'FLOOR_3D',
        activeFloorIndex: 1, // Floor 2
        onSelectFloor: noop,
        onSelectRoom: noop,
        isMobileViewport: false,
      })
    );

    // Floor 2 cutaway: no floating HTML pins/badges layer
    expect(stageFloor2Html).not.toContain('data-testid="floor-3d-pins-layer"');
    expect(stageFloor2Html).not.toContain('data-testid="floor-3d-pin-P201"');
    expect(stageFloor2Html).not.toContain('data-testid="floor-3d-pin-P204"');
    expect(stageFloor2Html).not.toContain('data-testid="floor-3d-red-badge-P204"');
    expect(stageFloor2Html).not.toContain('data-testid="floor-3d-pin-P101"');
    expect(stageFloor2Html).not.toContain('data-testid="floor-3d-yellow-badge-P101"');

    // Floor 1 cutaway view
    const stageFloor1Html = renderToStaticMarkup(
      React.createElement(Canvas3DStage, {
        roomsWithNotices,
        totalFloors: 3,
        viewMode: 'FLOOR_3D',
        activeFloorIndex: 0, // Floor 1
        onSelectFloor: noop,
        onSelectRoom: noop,
        isMobileViewport: false,
      })
    );

    // Floor 1 cutaway: no floating HTML pins/badges layer
    expect(stageFloor1Html).not.toContain('data-testid="floor-3d-pins-layer"');
    expect(stageFloor1Html).not.toContain('data-testid="floor-3d-pin-P101"');
    expect(stageFloor1Html).not.toContain('data-testid="floor-3d-yellow-badge-P101"');
    expect(stageFloor1Html).not.toContain('data-testid="floor-3d-pin-P201"');
    expect(stageFloor1Html).not.toContain('data-testid="floor-3d-red-badge-P204"');
  });

  it('verifies interaction with room info plaque on the wall opens Sổ F04 in FLOOR_3D mode', async () => {
    const controller = await createInitializedController();
    const roomsWithNotices = controller.getRoomsWithNotices();
    const p202 = roomsWithNotices.find((r) => r.room.room_number === 'P202')!;
    const p204 = roomsWithNotices.find((r) => r.room.room_number === 'P204')!; // broken device
    const onSelectRoom = vi.fn();

    // Mock renderer interactions for room info plaque
    const mockRenderer = {
      pickRoomInfoPlaque: vi.fn((_x: number, _y: number) => ({
        roomId: p202.room.id,
        roomCode: p202.room.room_number,
      })),
      setFloorHoveredInfoPlaque: vi.fn(),
      pickFloorRoom: vi.fn(),
      setFloorHoveredRoom: vi.fn(),
    };

    // 1. Raycast hover on room info plaque
    const plaqueHit = mockRenderer.pickRoomInfoPlaque(0.1, 0.2);
    expect(plaqueHit).not.toBeNull();
    if (plaqueHit) {
      mockRenderer.setFloorHoveredInfoPlaque(plaqueHit.roomId);
      expect(mockRenderer.setFloorHoveredInfoPlaque).toHaveBeenCalledWith(p202.room.id);

      // Tooltip format specified in SPEC:
      const tooltipText = `Bảng Thông Tin Phòng ${plaqueHit.roomCode} · Nhấp để mở Sổ Quản Lý F04`;
      expect(tooltipText).toBe('Bảng Thông Tin Phòng P202 · Nhấp để mở Sổ Quản Lý F04');

      // 2. Click room info plaque of P202 (normal/billing room) -> opens PAGE_1_BILLING
      const matched = roomsWithNotices.find((r) => r.room.id === plaqueHit.roomId);
      const tab = matched?.hasBrokenDevice ? 'PAGE_2_DEVICES' : 'PAGE_1_BILLING';
      onSelectRoom(plaqueHit.roomId, tab);
      expect(onSelectRoom).toHaveBeenCalledWith(p202.room.id, 'PAGE_1_BILLING');
    }

    // 3. Click room info plaque of P204 (room with broken device) -> opens PAGE_2_DEVICES
    mockRenderer.pickRoomInfoPlaque.mockReturnValueOnce({
      roomId: p204.room.id,
      roomCode: p204.room.room_number,
    });
    const brokenHit = mockRenderer.pickRoomInfoPlaque(0.3, 0.4);
    expect(brokenHit).not.toBeNull();
    if (brokenHit) {
      const matched = roomsWithNotices.find((r) => r.room.id === brokenHit.roomId);
      const tab = matched?.hasBrokenDevice ? 'PAGE_2_DEVICES' : 'PAGE_1_BILLING';
      onSelectRoom(brokenHit.roomId, tab);
      expect(onSelectRoom).toHaveBeenCalledWith(p204.room.id, 'PAGE_2_DEVICES');
    }
  });

  it('verifies interaction with 3D notice badges in FLOOR_3D mode opens corresponding F04 tabs (PAYMENT -> Page 1, DEVICE -> Page 2)', async () => {
    const controller = await createInitializedController();
    const roomsWithNotices = controller.getRoomsWithNotices();
    const p201 = roomsWithNotices.find((r) => r.room.room_number === 'P201')!; // payment notice
    const p204 = roomsWithNotices.find((r) => r.room.room_number === 'P204')!; // broken device
    const onSelectRoom = vi.fn();

    // Mock renderer interactions for notice badge picking
    const mockRenderer = {
      pickFloorNoticeBadge: vi.fn((x: number, _y: number) => {
        if (x < 0) {
          return { roomId: p201.room.id, noticeKind: 'PAYMENT' as const };
        }
        return { roomId: p204.room.id, noticeKind: 'DEVICE' as const };
      }),
    };

    // 1. Raycast hover on payment notice badge
    const paymentHit = mockRenderer.pickFloorNoticeBadge(-0.2, 0.5);
    expect(paymentHit).not.toBeNull();
    if (paymentHit) {
      const matched = roomsWithNotices.find((r) => r.room.id === paymentHit.roomId);
      const roomCode = matched?.room.room_number ?? paymentHit.roomId;
      const tooltipText =
        paymentHit.noticeKind === 'PAYMENT'
          ? `Cảnh báo Hóa đơn · Phòng ${roomCode} · Nhấp để mở Sổ Quản Lý F04 (Hóa đơn)`
          : `Cảnh báo Thiết bị · Phòng ${roomCode} · Nhấp để mở Sổ Quản Lý F04 (Thiết bị)`;
      expect(tooltipText).toBe('Cảnh báo Hóa đơn · Phòng P201 · Nhấp để mở Sổ Quản Lý F04 (Hóa đơn)');

      // Click payment notice badge -> opens PAGE_1_BILLING
      const tab = paymentHit.noticeKind === 'PAYMENT' ? 'PAGE_1_BILLING' : 'PAGE_2_DEVICES';
      onSelectRoom(paymentHit.roomId, tab);
      expect(onSelectRoom).toHaveBeenCalledWith(p201.room.id, 'PAGE_1_BILLING');
    }

    // 2. Raycast hover on device notice badge
    const deviceHit = mockRenderer.pickFloorNoticeBadge(0.2, 0.5);
    expect(deviceHit).not.toBeNull();
    if (deviceHit) {
      const matched = roomsWithNotices.find((r) => r.room.id === deviceHit.roomId);
      const roomCode = matched?.room.room_number ?? deviceHit.roomId;
      const tooltipText =
        deviceHit.noticeKind === 'PAYMENT'
          ? `Cảnh báo Hóa đơn · Phòng ${roomCode} · Nhấp để mở Sổ Quản Lý F04 (Hóa đơn)`
          : `Cảnh báo Thiết bị · Phòng ${roomCode} · Nhấp để mở Sổ Quản Lý F04 (Thiết bị)`;
      expect(tooltipText).toBe('Cảnh báo Thiết bị · Phòng P204 · Nhấp để mở Sổ Quản Lý F04 (Thiết bị)');

      // Click device notice badge -> opens PAGE_2_DEVICES
      const tab = deviceHit.noticeKind === 'PAYMENT' ? 'PAGE_1_BILLING' : 'PAGE_2_DEVICES';
      onSelectRoom(deviceHit.roomId, tab);
      expect(onSelectRoom).toHaveBeenCalledWith(p204.room.id, 'PAGE_2_DEVICES');
    }
  });

  it('Canvas3DStage in BUILDING mode hovers whole floor and clicks floor to transition to cutaway', async () => {
    const controller = await createInitializedController();
    const roomsWithNotices = controller.getRoomsWithNotices();
    const onSelectFloorCutaway = vi.fn();
    const onSelectRoom = vi.fn();

    const element = React.createElement(Canvas3DStage, {
      roomsWithNotices,
      totalFloors: 3,
      viewMode: 'BUILDING',
      onSelectFloor: vi.fn(),
      onSelectFloorCutaway,
      onSelectRoom,
      isMobileViewport: false,
    });

    const markup = renderToStaticMarkup(element);
    expect(markup).toContain('data-testid="dock-floor-btn-2"');
    expect(markup).toContain('data-view-mode="BUILDING"');

    // Test floor raycast picking & hover calculation:
    // Floor 2 has 4 rooms: P201, P202, P203, P204
    const floor2Rooms = roomsWithNotices.filter((r) => r.room.floor_number === 2);
    expect(floor2Rooms.length).toBe(4);
    const floor2TotalArea = floor2Rooms.reduce((acc, r) => acc + (r.room.area_sqm || 0), 0);
    expect(floor2TotalArea).toBeGreaterThan(0);

    // Mock renderer interactions
    const mockRenderer = {
      pickBuildingRoom: vi.fn((_x: number, _y: number) => ({
        floorIndex: 1,
        roomIndex: 0,
        roomId: 'uuid-p201',
      })),
      setHoveredFloor: vi.fn(),
    };

    // 1. Hover floor 2 (floorIndex = 1) -> highlights all meshes on floor 2
    const hit = mockRenderer.pickBuildingRoom(0, 0);
    expect(hit).not.toBeNull();
    if (hit) {
      mockRenderer.setHoveredFloor(hit.floorIndex);
      expect(mockRenderer.setHoveredFloor).toHaveBeenCalledWith(1);

      // Tooltip text format specified in SPEC:
      const tooltipText = `Tầng ${hit.floorIndex + 1} · ${floor2Rooms.length} phòng · ${floor2TotalArea} m² · Nhấn để mở Mặt bằng 3D Tầng`;
      expect(tooltipText).toContain('Tầng 2 · 4 phòng');
      expect(tooltipText).toContain('Nhấn để mở Mặt bằng 3D Tầng');

      // 2. Click floor 2 -> transitions to floor cutaway directly without opening room F04 modal
      onSelectFloorCutaway(hit.floorIndex);
      expect(onSelectFloorCutaway).toHaveBeenCalledWith(1);
      expect(onSelectRoom).not.toHaveBeenCalled();
    }

    // 3. Unhover -> resets highlight
    mockRenderer.setHoveredFloor(null);
    expect(mockRenderer.setHoveredFloor).toHaveBeenCalledWith(null);
  });

  it('renders Canvas3DStage in FLOOR_3D mode with Back button, Bottom Dock, and active floor room elements', async () => {
    const controller = await createInitializedController();
    const roomsWithNotices = controller.getRoomsWithNotices();
    const noop = vi.fn();

    const stageFloor3DHtml = renderToStaticMarkup(
      React.createElement(Canvas3DStage, {
        roomsWithNotices,
        totalFloors: 3,
        viewMode: 'FLOOR_3D',
        activeFloorIndex: 1, // Floor 2
        onSelectFloor: noop,
        onSelectFloorCutaway: noop,
        onBackToBuilding: noop,
        onSelectRoom: noop,
        isMobileViewport: false,
      })
    );

    // 1. Check container attributes
    expect(stageFloor3DHtml).toContain('data-view-mode="FLOOR_3D"');
    expect(stageFloor3DHtml).toContain('data-active-floor="2"');

    // 2. Check Back button
    expect(stageFloor3DHtml).toContain('data-testid="btn-back-to-building"');
    expect(stageFloor3DHtml).toContain('◀ QUAY LẠI TOÀN CẢNH TÒA NHÀ');
    expect(stageFloor3DHtml).toContain('action-btn-back');

    // 3. Check Bottom Dock
    expect(stageFloor3DHtml).toContain('data-testid="floor-cutaway-dock"');
    expect(stageFloor3DHtml).toContain('data-testid="dock-floor-btn-1"');
    expect(stageFloor3DHtml).toContain('data-testid="dock-floor-btn-2"');
    expect(stageFloor3DHtml).toContain('data-testid="dock-floor-btn-3"');
    expect(stageFloor3DHtml).toContain('data-active="true"');

    // 4. Verify no floating HTML pins layer in FLOOR_3D mode (rendered in 3D scene directly)
    expect(stageFloor3DHtml).not.toContain('data-testid="floor-3d-pins-layer"');
    expect(stageFloor3DHtml).not.toContain('data-testid="floor-3d-pin-P201"');
    expect(stageFloor3DHtml).not.toContain('data-testid="floor-3d-pin-P204"');
    expect(stageFloor3DHtml).not.toContain('data-testid="floor-3d-red-badge-P204"');
    expect(stageFloor3DHtml).not.toContain('data-testid="floor-3d-pin-P101"');

    // 5. Room cards are accessible in corner drawer
    expect(stageFloor3DHtml).toContain('data-testid="stage-room-card-P201"');
    expect(stageFloor3DHtml).toContain('data-testid="stage-room-card-P204"');

    // 6. Reset button in FLOOR_3D mode shows "Góc chuẩn 45°"
    expect(stageFloor3DHtml).toContain('data-testid="btn-3d-reset-view"');
    expect(stageFloor3DHtml).toContain('title="Đặt lại góc nhìn Isometric 45°"');
    expect(stageFloor3DHtml).toContain('>Góc chuẩn 45°<');

    // 7. Check touch target size >= 44px
    for (const btnTag of extractButtonStyles(stageFloor3DHtml)) {
      expect(btnTag).toContain(`min-height:${MIN_TOUCH_TARGET_SIZE}px`);
    }
  });

  it('reset view button switches behavior between BUILDING (resetIsometricCamera) and FLOOR_3D (resetFloorIsometricCamera)', async () => {
    const controller = await createInitializedController();
    const roomsWithNotices = controller.getRoomsWithNotices();

    const buildingHtml = renderToStaticMarkup(
      React.createElement(Canvas3DStage, {
        roomsWithNotices,
        totalFloors: 3,
        viewMode: 'BUILDING',
        onSelectFloor: vi.fn(),
        onSelectRoom: vi.fn(),
      })
    );
    expect(buildingHtml).toContain('data-testid="btn-3d-reset-view"');
    expect(buildingHtml).toContain('title="Đặt lại góc nhìn Isometric 45°"');
    expect(buildingHtml).toContain('>Góc chuẩn 45°<');

    const floorHtml = renderToStaticMarkup(
      React.createElement(Canvas3DStage, {
        roomsWithNotices,
        totalFloors: 3,
        viewMode: 'FLOOR_3D',
        activeFloorIndex: 1,
        onSelectFloor: vi.fn(),
        onSelectRoom: vi.fn(),
      })
    );
    expect(floorHtml).toContain('data-testid="btn-3d-reset-view"');
    expect(floorHtml).toContain('title="Đặt lại góc nhìn Isometric 45°"');
    expect(floorHtml).toContain('>Góc chuẩn 45°<');

    // Verify mock renderer camera reset callbacks
    const mockRenderer = {
      resetIsometricCamera: vi.fn(),
      resetFloorIsometricCamera: vi.fn(),
    };

    // When viewMode === 'BUILDING': calls resetIsometricCamera
    const handleResetBuilding = (mode: 'BUILDING' | 'FLOOR_3D') => {
      if (mode === 'FLOOR_3D') {
        mockRenderer.resetFloorIsometricCamera?.() ?? mockRenderer.resetIsometricCamera();
      } else {
        mockRenderer.resetIsometricCamera();
      }
    };

    handleResetBuilding('BUILDING');
    expect(mockRenderer.resetIsometricCamera).toHaveBeenCalledTimes(1);
    expect(mockRenderer.resetFloorIsometricCamera).not.toHaveBeenCalled();

    // When viewMode === 'FLOOR_3D': calls resetFloorIsometricCamera
    handleResetBuilding('FLOOR_3D');
    expect(mockRenderer.resetFloorIsometricCamera).toHaveBeenCalledTimes(1);

    // Fallback if resetFloorIsometricCamera is not present:
    const mockLegacyRenderer = {
      resetIsometricCamera: vi.fn(),
    };
    const handleLegacyReset = () => {
      (mockLegacyRenderer as any)?.resetFloorIsometricCamera?.() ??
        mockLegacyRenderer.resetIsometricCamera();
    };
    handleLegacyReset();
    expect(mockLegacyRenderer.resetIsometricCamera).toHaveBeenCalledTimes(1);
  });

  it('renders building block shape preset selector dropdown on 3D stage HUD in BUILDING mode', async () => {
    const controller = await createInitializedController();
    const roomsWithNotices = controller.getRoomsWithNotices();
    const onSelectBlockPreset = vi.fn();

    // 1. BUILDING mode: renders dropdown with default preset label
    const buildingHtml = renderToStaticMarkup(
      React.createElement(Canvas3DStage, {
        roomsWithNotices,
        totalFloors: 3,
        viewMode: 'BUILDING',
        currentBlockPresetId: 'COMPACT_2x2x3',
        onSelectBlockPreset,
        onSelectFloor: vi.fn(),
        onSelectRoom: vi.fn(),
      })
    );
    expect(buildingHtml).toContain('data-testid="building-block-preset-dropdown"');
    expect(buildingHtml).toContain('🏛️ Khối: Nhà phố 2x2x3 ▾');
    expect(buildingHtml).toContain(`min-height:${MIN_TOUCH_TARGET_SIZE}px`);

    // 2. Switching preset id updates the dropdown button label
    const towerHtml = renderToStaticMarkup(
      React.createElement(Canvas3DStage, {
        roomsWithNotices,
        totalFloors: 6,
        viewMode: 'BUILDING',
        currentBlockPresetId: 'TOWER_2x2x6',
        onSelectBlockPreset,
        onSelectFloor: vi.fn(),
        onSelectRoom: vi.fn(),
      })
    );
    expect(towerHtml).toContain('data-testid="building-block-preset-dropdown"');
    expect(towerHtml).toContain('🏛️ Khối: Tháp 2x2x6 ▾');

    const cubeHtml = renderToStaticMarkup(
      React.createElement(Canvas3DStage, {
        roomsWithNotices,
        totalFloors: 3,
        viewMode: 'BUILDING',
        currentBlockPresetId: 'CUBE_3x3x3',
        onSelectBlockPreset,
        onSelectFloor: vi.fn(),
        onSelectRoom: vi.fn(),
      })
    );
    expect(cubeHtml).toContain('🏛️ Khối: Khối vuông 3x3x3 ▾');

    const ccmnHtml = renderToStaticMarkup(
      React.createElement(Canvas3DStage, {
        roomsWithNotices,
        totalFloors: 4,
        viewMode: 'BUILDING',
        currentBlockPresetId: 'CCMN_3x2x4',
        onSelectBlockPreset,
        onSelectFloor: vi.fn(),
        onSelectRoom: vi.fn(),
      })
    );
    expect(ccmnHtml).toContain('🏛️ Khối: CCMN 3x2x4 ▾');

    const longHtml = renderToStaticMarkup(
      React.createElement(Canvas3DStage, {
        roomsWithNotices,
        totalFloors: 2,
        viewMode: 'BUILDING',
        currentBlockPresetId: 'LONG_4x2x2',
        onSelectBlockPreset,
        onSelectFloor: vi.fn(),
        onSelectRoom: vi.fn(),
      })
    );
    expect(longHtml).toContain('🏛️ Khối: Dãy ngang 4x2x2 ▾');

    // 3. In FLOOR_3D mode: block preset dropdown is hidden (exterior only)
    const floor3DHtml = renderToStaticMarkup(
      React.createElement(Canvas3DStage, {
        roomsWithNotices,
        totalFloors: 3,
        viewMode: 'FLOOR_3D',
        activeFloorIndex: 0,
        onSelectFloor: vi.fn(),
        onSelectRoom: vi.fn(),
      })
    );
    expect(floor3DHtml).not.toContain('data-testid="building-block-preset-dropdown"');

    // 4. Verify touch-target size for all buttons in BUILDING stage
    const buttons = extractButtonStyles(buildingHtml);
    for (const btnTag of buttons) {
      expect(btnTag).toContain(`min-height:${MIN_TOUCH_TARGET_SIZE}px`);
    }
  });

  it('renders building shape preset catalog in BuildingSetupModal with auto-fill scale', async () => {
    const controller = await createInitializedController();
    const property = controller.getProperty();
    const rooms = controller.getRooms();

    const modalHtml = renderToStaticMarkup(
      React.createElement(BuildingSetupModal, {
        isOpen: true,
        property,
        rooms,
        onSaveBuilding: vi.fn().mockResolvedValue(undefined),
        onClose: vi.fn(),
      })
    );

    expect(modalHtml).toContain('data-testid="building-setup-modal"');
    expect(modalHtml).toContain('data-testid="building-shape-presets-grid"');

    // Verify all 5 building shape presets are present
    expect(modalHtml).toContain('data-testid="building-preset-card-TOWER_2x2x6"');
    expect(modalHtml).toContain('data-testid="building-preset-card-CCMN_3x2x4"');
    expect(modalHtml).toContain('data-testid="building-preset-card-CUBE_3x3x3"');
    expect(modalHtml).toContain('data-testid="building-preset-card-COMPACT_2x2x3"');
    expect(modalHtml).toContain('data-testid="building-preset-card-LONG_4x2x2"');

    // Verify default selected preset is COMPACT_2x2x3 (3 floors, 4 rooms/floor = 12 rooms)
    expect(modalHtml).toContain('data-selected="true"');

    // Verify minimum touch targets >= 44px for all buttons
    const buttons = extractButtonStyles(modalHtml);
    for (const btnTag of buttons) {
      expect(btnTag).toContain(`min-height:${MIN_TOUCH_TARGET_SIZE}px`);
    }
  });

  it('handles smooth opening and closing transition without abrupt unmount', async () => {
    const controller = await createInitializedController();
    const floorMap = controller.getFloorMapDTO(1);
    const onCloseBook = vi.fn();

    // 1. Initial render with isBookOpen = true -> starts in 'OPENING' with backdrop blur/darkening
    const openingHtml = renderToStaticMarkup(
      React.createElement(LedgerOverlayHost, {
        isBookOpen: true,
        currentFloor: 1,
        floorMap,
        roomDetail: null,
        activeTab: 'PAGE_1_BILLING',
        previewState: null,
        auditLogs: [],
        tenantRewardPoints: 0,
        landlordReputation: 4.8,
        onFlipFloor: vi.fn(),
        onOpenRoomDetail: vi.fn(),
        onSwitchTab: vi.fn(),
        onPreviewBilling: vi.fn(),
        onCommitBillingReading: vi.fn(),
        onUploadLocalBillImage: vi.fn(),
        onApproveBillOneTouch: vi.fn(),
        onReportDeviceBroken: vi.fn(),
        onResolveDeviceMaintenance: vi.fn(),
        onCloseRoomDetail: vi.fn(),
        onCloseBook,
        initialAnimationState: 'OPENING',
      })
    );
    expect(openingHtml).toContain('data-testid="ledger-overlay-host"');
    expect(openingHtml).toContain('data-animation-state="OPENING"');
    expect(openingHtml).toContain('ledger-overlay-opening');
    expect(openingHtml).toContain('data-animation-state="opening"');
    expect(openingHtml).toContain('book-state-opening');

    // 2. Open state -> fully open book and backdrop blur
    const openHtml = renderToStaticMarkup(
      React.createElement(LedgerOverlayHost, {
        isBookOpen: true,
        currentFloor: 1,
        floorMap,
        roomDetail: null,
        activeTab: 'PAGE_1_BILLING',
        previewState: null,
        auditLogs: [],
        tenantRewardPoints: 0,
        landlordReputation: 4.8,
        onFlipFloor: vi.fn(),
        onOpenRoomDetail: vi.fn(),
        onSwitchTab: vi.fn(),
        onPreviewBilling: vi.fn(),
        onCommitBillingReading: vi.fn(),
        onUploadLocalBillImage: vi.fn(),
        onApproveBillOneTouch: vi.fn(),
        onReportDeviceBroken: vi.fn(),
        onResolveDeviceMaintenance: vi.fn(),
        onCloseRoomDetail: vi.fn(),
        onCloseBook,
        initialAnimationState: 'OPEN',
      })
    );
    expect(openHtml).toContain('data-animation-state="OPEN"');
    expect(openHtml).toContain('ledger-overlay-open');
    expect(openHtml).toContain('data-animation-state="open"');
    expect(openHtml).toContain('book-state-open');

    // 3. Closing state -> smoothly folds book back, fades backdrop, does not abruptly unmount
    const closingHtml = renderToStaticMarkup(
      React.createElement(LedgerOverlayHost, {
        isBookOpen: true,
        currentFloor: 1,
        floorMap,
        roomDetail: null,
        activeTab: 'PAGE_1_BILLING',
        previewState: null,
        auditLogs: [],
        tenantRewardPoints: 0,
        landlordReputation: 4.8,
        onFlipFloor: vi.fn(),
        onOpenRoomDetail: vi.fn(),
        onSwitchTab: vi.fn(),
        onPreviewBilling: vi.fn(),
        onCommitBillingReading: vi.fn(),
        onUploadLocalBillImage: vi.fn(),
        onApproveBillOneTouch: vi.fn(),
        onReportDeviceBroken: vi.fn(),
        onResolveDeviceMaintenance: vi.fn(),
        onCloseRoomDetail: vi.fn(),
        onCloseBook,
        initialAnimationState: 'CLOSING',
      })
    );
    expect(closingHtml).toContain('data-animation-state="CLOSING"');
    expect(closingHtml).toContain('ledger-overlay-closing');
    expect(closingHtml).toContain('data-animation-state="closing"');
    expect(closingHtml).toContain('book-state-closing');

    // 4. Closed state (or isBookOpen = false) -> returns null / unmounts
    const closedHtml = renderToStaticMarkup(
      React.createElement(LedgerOverlayHost, {
        isBookOpen: false,
        currentFloor: 1,
        floorMap,
        roomDetail: null,
        activeTab: 'PAGE_1_BILLING',
        previewState: null,
        auditLogs: [],
        tenantRewardPoints: 0,
        landlordReputation: 4.8,
        onFlipFloor: vi.fn(),
        onOpenRoomDetail: vi.fn(),
        onSwitchTab: vi.fn(),
        onPreviewBilling: vi.fn(),
        onCommitBillingReading: vi.fn(),
        onUploadLocalBillImage: vi.fn(),
        onApproveBillOneTouch: vi.fn(),
        onReportDeviceBroken: vi.fn(),
        onResolveDeviceMaintenance: vi.fn(),
        onCloseRoomDetail: vi.fn(),
        onCloseBook,
      })
    );
    expect(closedHtml).toBe('');

    // 5. Test close interception and timer lifecycle (450ms transition)
    vi.useFakeTimers();
    const onStateChange = vi.fn();
    const timer = closeLedgerWithTransition(onStateChange, onCloseBook, 450);

    expect(onStateChange).toHaveBeenCalledWith('CLOSING');
    expect(onCloseBook).not.toHaveBeenCalled();

    // After 200ms into fold animation: still closing, not unmounted
    vi.advanceTimersByTime(200);
    expect(onCloseBook).not.toHaveBeenCalled();

    // After 450ms book fold complete: calls parent onCloseBook and marks CLOSED
    vi.advanceTimersByTime(250);
    expect(onStateChange).toHaveBeenCalledWith('CLOSED');
    expect(onCloseBook).toHaveBeenCalledTimes(1);

    clearTimeout(timer);
    vi.useRealTimers();
  });
});
