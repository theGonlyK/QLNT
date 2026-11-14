import 'fake-indexeddb/auto';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AppDatabase, useLedgerStore } from '@qlnt/domain-core';
import { MIN_TOUCH_TARGET_SIZE } from '@qlnt/renderer-2d';
import { App } from '../src/App';
import { LedgerController } from '../src/bridge/ledgerController';
import { LedgerOverlayHost } from '../src/components/LedgerOverlayHost';

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
});
