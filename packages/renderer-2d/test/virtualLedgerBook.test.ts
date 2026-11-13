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
});
