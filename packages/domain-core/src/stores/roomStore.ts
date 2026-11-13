import { create } from 'zustand';
import type { Room, RoomStatus } from '@qlnt/shared-types';
import { db } from '../db/appDatabase';

export interface RoomState {
  rooms: Room[];
  selectedRoomId: string | null;
  statusFilter: RoomStatus | 'ALL';
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchRooms: (propertyId?: string) => Promise<void>;
  selectRoom: (roomId: string | null) => void;
  setStatusFilter: (filter: RoomStatus | 'ALL') => void;
  setRooms: (rooms: Room[]) => void;
}

export const useRoomStore = create<RoomState>((set) => ({
  rooms: [],
  selectedRoomId: null,
  statusFilter: 'ALL',
  isLoading: false,
  error: null,

  fetchRooms: async (propertyId?: string) => {
    set({ isLoading: true, error: null });
    try {
      let rooms: Room[];
      if (propertyId) {
        rooms = await db.rooms.where('property_id').equals(propertyId).toArray();
      } else {
        rooms = await db.rooms.toArray();
      }
      set({ rooms, isLoading: false });
    } catch (err: unknown) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },

  selectRoom: (roomId: string | null) => {
    set({ selectedRoomId: roomId });
  },

  setStatusFilter: (filter: RoomStatus | 'ALL') => {
    set({ statusFilter: filter });
  },

  setRooms: (rooms: Room[]) => {
    set({ rooms });
  },
}));
