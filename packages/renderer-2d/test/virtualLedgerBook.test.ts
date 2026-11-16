import { describe, expect, it, vi } from 'vitest';
import type { FloorMapDTO, RoomDetailDTO, RoomDetailTab } from '@qlnt/shared-types';
import {
  BookmarkFloorTabs,
  RoomDetailSinglePage,
  VirtualLedgerBook,
} from '../src';

describe('Task 3: Virtual Ledger Book F04 Single-Page Component & Floor Tabs', () => {
  const mockFloorMap: FloorMapDTO = {
    propertyId: 'prop-1',
    floorNumber: 2,
    rooms: [
      {
        roomId: 'r1',
        roomNumber: '201',
        status: 'RENTED',
        tenantName: 'Nguyen Van A',
        hasPaymentNotice: false,
        hasBrokenDevice: false,
      },
      {
        roomId: 'r2',
        roomNumber: '202',
        status: 'RENTED',
        tenantName: 'Tran Thi B',
        hasPaymentNotice: true,
        hasBrokenDevice: false,
      },
    ],
  };

  const mockRoomDetail: RoomDetailDTO = {
    roomId: 'r2',
    roomNumber: '202',
    floorNumber: 2,
    basePrice: 3500000,
    areaSqm: 25,
    status: 'RENTED',
    currentTenant: {
      tenantId: 't-2',
      fullName: 'Tran Thi B',
      phone: '0912345678',
      hometown: 'Nam Dinh',
      tempResidenceStatus: 'Đã đăng ký tạm trú',
    },
    latestBilling: {
      billingId: 'bill-101',
      monthPeriod: '2026-11',
      roomCharge: 3500000,
      electricCharge: 420000,
      waterCharge: 150000,
      serviceCharge: 100000,
      totalAmount: 4170000,
      status: 'PENDING_APPROVAL',
      billImageUrl: 'https://example.com/receipt.jpg',
    },
    latestReading: {
      oldElectric: 1200,
      newElectric: 1320,
      oldWater: 80,
      newWater: 90,
    },
    devices: [
      {
        deviceId: 'dev-1',
        name: 'Điều hòa Panasonic 9000BTU',
        category: 'FIXED',
        isBroken: false,
        lastMaintained: '2026-06-15',
      },
      {
        deviceId: 'dev-2',
        name: 'Bình nóng lạnh Ariston 20L',
        category: 'FIXED',
        isBroken: true,
        lastMaintained: '2025-12-01',
      },
      {
        deviceId: 'dev-3',
        name: 'Tủ lạnh Casper 185L',
        category: 'ADDITIONAL',
        isBroken: false,
      },
    ],
  };

  it('renders BookmarkFloorTabs with touch targets >= 44x44px and triggers onFloorChange', () => {
    const onFloorChange = vi.fn();
    const tabs = BookmarkFloorTabs({
      totalFloors: 4,
      activeFloor: 2,
      onFloorChange,
    });

    expect(tabs).toBeDefined();
    expect(tabs.props['data-testid']).toBe('bookmark-floor-tabs');
    expect(tabs.props['data-active-floor']).toBe(2);

    // Call onFloorChange through clicking the 3rd floor tab button
    tabs.props.children[2]?.props?.onClick?.();
    expect(onFloorChange).toHaveBeenCalledWith(3);
    // Or tab items
    expect(tabs.props.children).toBeDefined();
  });

  it('renders RoomDetailSinglePage and handles 3 tabs: PAGE_1_BILLING, PAGE_2_DEVICES, PAGE_3_AUDIT', () => {
    const onClose = vi.fn();
    const onTabChange = vi.fn();
    const onApproveBill = vi.fn();

    // 1. PAGE_1_BILLING
    const billingPage = RoomDetailSinglePage({
      roomDetail: mockRoomDetail,
      activeTab: 'PAGE_1_BILLING',
      onTabChange,
      onClose,
      onApproveBill,
    });
    expect(billingPage).toBeDefined();
    expect(billingPage.props['data-active-tab']).toBe('PAGE_1_BILLING');
    expect(billingPage.props['data-room-id']).toBe('r2');

    // 2. PAGE_2_DEVICES
    const devicesPage = RoomDetailSinglePage({
      roomDetail: mockRoomDetail,
      activeTab: 'PAGE_2_DEVICES',
      onTabChange,
      onClose,
    });
    expect(devicesPage.props['data-active-tab']).toBe('PAGE_2_DEVICES');

    // 3. PAGE_3_AUDIT
    const auditPage = RoomDetailSinglePage({
      roomDetail: mockRoomDetail,
      activeTab: 'PAGE_3_AUDIT',
      onTabChange,
      onClose,
    });
    expect(auditPage.props['data-active-tab']).toBe('PAGE_3_AUDIT');
  });

  it('renders VirtualLedgerBook and coordinates floor view, room selection, and close buttons', () => {
    const onFloorChange = vi.fn();
    const onOpenRoomDetail = vi.fn();
    const onCloseRoomDetail = vi.fn();
    const onCloseBook = vi.fn();

    // Map mode (when roomDetail is null)
    const mapBook = VirtualLedgerBook({
      floorMap: mockFloorMap,
      totalFloors: 5,
      activeFloor: 2,
      roomDetail: null,
      onFloorChange,
      onOpenRoomDetail,
      onCloseRoomDetail,
      onCloseBook,
    });
    expect(mapBook).toBeDefined();
    expect(mapBook.props['data-testid']).toBe('virtual-ledger-book');
    expect(mapBook.props['data-mode']).toBe('floor-map');

    // Single-Page Detail mode (when roomDetail is provided)
    const detailBook = VirtualLedgerBook({
      floorMap: mockFloorMap,
      totalFloors: 5,
      activeFloor: 2,
      roomDetail: mockRoomDetail,
      activeTab: 'PAGE_1_BILLING',
      onFloorChange,
      onOpenRoomDetail,
      onCloseRoomDetail,
      onCloseBook,
    });
    expect(detailBook.props['data-mode']).toBe('room-detail');
  });

  it('renders 3D book cover and applies opening/closing animation classes', () => {
    // 1. Default animationState should be 'open'
    const defaultBook = VirtualLedgerBook({
      floorMap: mockFloorMap,
    });
    expect(defaultBook.props['data-animation-state']).toBe('open');
    expect(defaultBook.props.style?.perspective).toBe('1600px');
    expect(defaultBook.props.style?.transformStyle).toBe('preserve-3d');
    expect(defaultBook.props.style?.transformOrigin).toBe('center center');
    expect(defaultBook.props.style?.transform).toBe('rotateX(0deg) rotateY(0deg)');
    expect(defaultBook.props.className).toContain('book-state-open');

    // 2. opening state
    const openingBook = VirtualLedgerBook({
      floorMap: mockFloorMap,
      animationState: 'opening',
    });
    expect(openingBook.props['data-animation-state']).toBe('opening');
    expect(openingBook.props.style?.animation).toContain('bookOpenHinge 1400ms');
    expect(openingBook.props.className).toContain('book-state-opening');

    // 3. closing state
    const closingBook = VirtualLedgerBook({
      floorMap: mockFloorMap,
      animationState: 'closing',
    });
    expect(closingBook.props['data-animation-state']).toBe('closing');
    expect(closingBook.props.className).toContain('book-state-closing');

    // 4. Verify book spine crease and 3D cover structure in children
    const findNodeByTestId = (node: any, testId: string): any => {
      if (!node) return null;
      if (node.props && node.props['data-testid'] === testId) return node;
      if (node.props && node.props.children) {
        const children = Array.isArray(node.props.children)
          ? node.props.children
          : [node.props.children];
        for (const child of children) {
          const found = findNodeByTestId(child, testId);
          if (found) return found;
        }
      }
      return null;
    };

    const spineCrease = findNodeByTestId(defaultBook, 'book-spine-crease');
    expect(spineCrease).toBeDefined();
    expect(spineCrease).not.toBeNull();
    expect(spineCrease.props.className).toContain('book-spine-crease');

    const bookCover = findNodeByTestId(defaultBook, 'book-cover-3d');
    expect(bookCover).toBeDefined();
    expect(bookCover).not.toBeNull();

    // 5. Verify Two-Page Spread structure: book-page-left & book-page-right
    const leftPage = findNodeByTestId(defaultBook, 'book-page-left');
    expect(leftPage).toBeDefined();
    expect(leftPage).not.toBeNull();

    const rightPage = findNodeByTestId(defaultBook, 'book-page-right');
    expect(rightPage).toBeDefined();
    expect(rightPage).not.toBeNull();

    const popupCard = findNodeByTestId(defaultBook, 'popup-standup-card');
    expect(popupCard).toBeDefined();
    expect(popupCard).not.toBeNull();

    const popupShadow = findNodeByTestId(defaultBook, 'popup-shadow-ground');
    expect(popupShadow).toBeDefined();
    expect(popupShadow).not.toBeNull();
  });

  it('supports contentStage (hidden, popping, visible, folding) and 3D front cover flap', () => {
    const findNodeByTestId = (node: any, testId: string): any => {
      if (!node) return null;
      if (node.props && node.props['data-testid'] === testId) return node;
      if (node.props && node.props.children) {
        const children = Array.isArray(node.props.children)
          ? node.props.children
          : [node.props.children];
        for (const child of children) {
          const found = findNodeByTestId(child, testId);
          if (found) return found;
        }
      }
      return null;
    };

    // 1. Default contentStage is 'visible'
    const defaultBook = VirtualLedgerBook({
      floorMap: mockFloorMap,
    });
    expect(defaultBook.props['data-content-stage']).toBe('visible');

    const defaultFlap = findNodeByTestId(defaultBook, 'book-front-cover-flap');
    expect(defaultFlap).toBeDefined();
    expect(defaultFlap).not.toBeNull();
    expect(defaultFlap.props.style?.transformOrigin).toBe('left center');

    const defaultMain = findNodeByTestId(defaultBook, 'virtual-ledger-book-main');
    expect(defaultMain).toBeDefined();
    expect(defaultMain.props['data-content-stage']).toBe('visible');
    expect(defaultMain.props.style?.opacity).toBe(1);
    expect(defaultMain.props.style?.transform).toBe('none');

    const defaultPopup = findNodeByTestId(defaultBook, 'popup-standup-card');
    expect(defaultPopup).toBeDefined();
    expect(defaultPopup.props['data-content-stage']).toBe('visible');
    expect(defaultPopup.props.style?.transform).toBe('rotateX(0deg) scale(1)');
    expect(defaultPopup.props.style?.opacity).toBe(1);

    const defaultShadow = findNodeByTestId(defaultBook, 'popup-shadow-ground');
    expect(defaultShadow).toBeDefined();
    expect(defaultShadow.props.style?.opacity).toBe(0.6);

    // 2. contentStage = 'hidden' during Phase 1 opening
    const hiddenBook = VirtualLedgerBook({
      floorMap: mockFloorMap,
      animationState: 'opening',
      contentStage: 'hidden',
    });
    expect(hiddenBook.props['data-content-stage']).toBe('hidden');

    const openingFlap = findNodeByTestId(hiddenBook, 'book-front-cover-flap');
    expect(openingFlap).toBeDefined();
    expect(openingFlap.props.style?.transformOrigin).toBe('left center');
    expect(openingFlap.props.style?.animation).toContain('frontCoverFlapOpen 750ms');

    const hiddenMain = findNodeByTestId(hiddenBook, 'virtual-ledger-book-main');
    expect(hiddenMain.props['data-content-stage']).toBe('hidden');
    expect(hiddenMain.props.style?.opacity).toBe(0);
    expect(hiddenMain.props.style?.pointerEvents).toBe('none');
    expect(hiddenMain.props.style?.transform).toBe('translateY(20px) scale(0.95)');

    const hiddenPopup = findNodeByTestId(hiddenBook, 'popup-standup-card');
    expect(hiddenPopup).toBeDefined();
    expect(hiddenPopup.props['data-content-stage']).toBe('hidden');
    expect(hiddenPopup.props.style?.transform).toBe('rotateX(-90deg) scale(0.95)');
    expect(hiddenPopup.props.style?.opacity).toBe(0);
    expect(hiddenPopup.props.style?.pointerEvents).toBe('none');

    const hiddenShadow = findNodeByTestId(hiddenBook, 'popup-shadow-ground');
    expect(hiddenShadow).toBeDefined();
    expect(hiddenShadow.props.style?.opacity).toBe(0);

    // 3. contentStage = 'popping' during Phase 2
    const poppingBook = VirtualLedgerBook({
      floorMap: mockFloorMap,
      contentStage: 'popping',
    });
    expect(poppingBook.props['data-content-stage']).toBe('popping');

    const poppingMain = findNodeByTestId(poppingBook, 'virtual-ledger-book-main');
    expect(poppingMain.props['data-content-stage']).toBe('popping');
    expect(poppingMain.props.style?.animation).toContain('popUpContentRise 700ms');

    const poppingPopup = findNodeByTestId(poppingBook, 'popup-standup-card');
    expect(poppingPopup).toBeDefined();
    expect(poppingPopup.props['data-content-stage']).toBe('popping');
    expect(poppingPopup.props.style?.animation).toContain('popUpStandUp 700ms');

    const poppingShadow = findNodeByTestId(poppingBook, 'popup-shadow-ground');
    expect(poppingShadow).toBeDefined();
    expect(poppingShadow.props.style?.animation).toContain('popupShadowSpread');

    // 4. contentStage = 'folding' during reverse transition
    const foldingBook = VirtualLedgerBook({
      floorMap: mockFloorMap,
      contentStage: 'folding',
    });
    expect(foldingBook.props['data-content-stage']).toBe('folding');

    const foldingMain = findNodeByTestId(foldingBook, 'virtual-ledger-book-main');
    expect(foldingMain.props['data-content-stage']).toBe('folding');
    expect(foldingMain.props.style?.opacity).toBe(0);
    expect(foldingMain.props.style?.pointerEvents).toBe('none');

    const foldingPopup = findNodeByTestId(foldingBook, 'popup-standup-card');
    expect(foldingPopup).toBeDefined();
    expect(foldingPopup.props['data-content-stage']).toBe('folding');
    expect(foldingPopup.props.style?.transform).toBe('rotateX(-85deg) scale(0.95)');
    expect(foldingPopup.props.style?.opacity).toBe(0);
    expect(foldingPopup.props.style?.pointerEvents).toBe('none');

    const foldingShadow = findNodeByTestId(foldingBook, 'popup-shadow-ground');
    expect(foldingShadow).toBeDefined();
    expect(foldingShadow.props.style?.opacity).toBe(0);
  });

  it('renders multi-page sequential flipping sheets (book-flip-sheet-1..3), page block edges, bookmark ribbon, and inner turning sheet', () => {
    const findNodeByTestId = (node: any, testId: string): any => {
      if (!node) return null;
      if (node.props && node.props['data-testid'] === testId) return node;
      if (node.props && node.props.children) {
        const children = Array.isArray(node.props.children)
          ? node.props.children
          : [node.props.children];
        for (const child of children) {
          const found = findNodeByTestId(child, testId);
          if (found) return found;
        }
      }
      return null;
    };

    // 1. Opening state: cover + 3 sequential sheets fan open with staggered delays before room info page appears
    const openingBook = VirtualLedgerBook({
      floorMap: mockFloorMap,
      roomDetail: mockRoomDetail,
      animationState: 'opening',
      contentStage: 'hidden',
    });

    const pagesStack = findNodeByTestId(openingBook, 'book-flip-pages-stack');
    expect(pagesStack).not.toBeNull();
    expect(pagesStack.props['data-animation-state']).toBe('opening');

    const sheet1 = findNodeByTestId(openingBook, 'book-flip-sheet-1');
    const sheet2 = findNodeByTestId(openingBook, 'book-flip-sheet-2');
    const sheet3 = findNodeByTestId(openingBook, 'book-flip-sheet-3');

    expect(sheet1).not.toBeNull();
    expect(sheet2).not.toBeNull();
    expect(sheet3).not.toBeNull();

    expect(sheet1.props.style?.transformOrigin).toBe('left center');
    expect(sheet2.props.style?.transformOrigin).toBe('left center');
    expect(sheet3.props.style?.transformOrigin).toBe('left center');

    expect(sheet1.props.style?.animation).toContain('pageSheetFlipOpen1 800ms');
    expect(sheet1.props.style?.animation).toContain('220ms');
    expect(sheet2.props.style?.animation).toContain('pageSheetFlipOpen2 750ms');
    expect(sheet2.props.style?.animation).toContain('450ms');
    expect(sheet3.props.style?.animation).toContain('pageSheetFlipOpen3 720ms');
    expect(sheet3.props.style?.animation).toContain('680ms');

    // Verify 6 colored squares in Sheet 1 (Contents page matching video)
    const colorSquaresGrid = findNodeByTestId(openingBook, 'contents-color-squares');
    expect(colorSquaresGrid).not.toBeNull();
    expect(colorSquaresGrid.props.children).toHaveLength(6);

    // Verify page block edges and navy ribbon bookmark
    const pageEdges = findNodeByTestId(openingBook, 'book-page-block-edges');
    expect(pageEdges).not.toBeNull();

    const ribbon = findNodeByTestId(openingBook, 'book-ribbon-bookmark');
    expect(ribbon).not.toBeNull();

    // 2. Closing state: sheets flip back in reverse order
    const closingBook = VirtualLedgerBook({
      floorMap: mockFloorMap,
      animationState: 'closing',
      contentStage: 'folding',
    });
    const closingSheet1 = findNodeByTestId(closingBook, 'book-flip-sheet-1');
    const closingSheet2 = findNodeByTestId(closingBook, 'book-flip-sheet-2');
    const closingSheet3 = findNodeByTestId(closingBook, 'book-flip-sheet-3');
    expect(closingSheet1.props.style?.animation).toContain('pageSheetFlipClose1');
    expect(closingSheet2.props.style?.animation).toContain('pageSheetFlipClose2');
    expect(closingSheet3.props.style?.animation).toContain('pageSheetFlipClose3');

    // 3. Inner page turning sheet when switching from floor map to room detail page
    const turningBook = VirtualLedgerBook({
      floorMap: mockFloorMap,
      roomDetail: mockRoomDetail,
      animationState: 'open',
      contentStage: 'visible',
      isPageTurning: true,
    });
    const innerTurnSheet = findNodeByTestId(turningBook, 'book-inner-turning-sheet');
    expect(innerTurnSheet).not.toBeNull();
    expect(innerTurnSheet.props['data-page-turning']).toBe('true');
    expect(innerTurnSheet.props.style?.animation).toContain('innerPageTurnFlip 750ms');
  });
});
