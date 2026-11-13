import type { RoomDisplayStatus } from './types';

export const MIN_TOUCH_TARGET_SIZE = 44; // px
export const NOTICE_BADGE_SIZE = 24; // px

export const ROOM_STATUS_COLORS = {
  EMPTY: {
    bg: '#DCFCE7',
    border: '#22C55E',
    text: '#15803D',
  },
  OCCUPIED: {
    bg: '#FEFCE8',
    border: '#A16207',
    text: '#854D0E',
  },
  PAYMENT_DUE: {
    bg: '#FEF3C7',
    border: '#F59E0B',
    badge: '#F59E0B',
    text: '#B45309',
  },
  BROKEN: {
    bg: '#FEE2E2',
    border: '#EF4444',
    badge: '#EF4444',
    text: '#B91C1C',
  },
} as const satisfies Record<RoomDisplayStatus, { bg: string; border: string; text: string; badge?: string }>;

export const NOTICE_BADGE_COLORS = {
  PAYMENT_DUE: '#F59E0B',
  BROKEN: '#EF4444',
} as const;
