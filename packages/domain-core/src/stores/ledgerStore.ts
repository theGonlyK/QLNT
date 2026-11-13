import { create } from 'zustand';
import type { RoomDetailTab } from '@qlnt/shared-types';

export interface LedgerState {
  isBookOpen: boolean;
  currentMonth: string; // YYYY-MM
  currentFloor: number;
  selectedRoomId: string | null;
  activeTab: RoomDetailTab;

  // Actions
  openLedgerBook: (monthKey: string, initialFloor?: number) => void;
  flipFloor: (floor: number) => void;
  openRoomDetail: (roomId: string, tab?: RoomDetailTab) => void;
  switchTab: (tab: RoomDetailTab) => void;
  closeRoomDetail: () => void;
  closeLedgerBook: () => void;
}

export const useLedgerStore = create<LedgerState>((set) => ({
  isBookOpen: false,
  currentMonth: new Date().toISOString().slice(0, 7),
  currentFloor: 1,
  selectedRoomId: null,
  activeTab: 'PAGE_1_BILLING',

  openLedgerBook: (monthKey: string, initialFloor = 1) => {
    set({
      isBookOpen: true,
      currentMonth: monthKey,
      currentFloor: initialFloor,
      selectedRoomId: null,
      activeTab: 'PAGE_1_BILLING',
    });
  },

  flipFloor: (floor: number) => {
    set({ currentFloor: floor });
  },

  openRoomDetail: (roomId: string, tab: RoomDetailTab = 'PAGE_1_BILLING') => {
    set({
      selectedRoomId: roomId,
      activeTab: tab,
    });
  },

  switchTab: (tab: RoomDetailTab) => {
    set({ activeTab: tab });
  },

  closeRoomDetail: () => {
    // Đóng cấp 1: Quay lại mặt bằng tầng 2D
    set({
      selectedRoomId: null,
      activeTab: 'PAGE_1_BILLING',
    });
  },

  closeLedgerBook: () => {
    // Đóng cấp 2: Gập sổ quay về không gian 3D
    set({
      isBookOpen: false,
      selectedRoomId: null,
    });
  },
}));
