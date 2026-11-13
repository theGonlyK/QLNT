import type { FloorMapRoomDTO } from '@qlnt/shared-types';
import { ROOM_STATUS_COLORS } from '../constants';
import type { RoomDisplayStatus, RoomTileColors } from '../types';

export function getRoomDisplayStatus(
  room: Pick<FloorMapRoomDTO, 'status' | 'hasPaymentNotice' | 'hasBrokenDevice'>
): RoomDisplayStatus {
  if (room.hasBrokenDevice) {
    return 'BROKEN';
  }
  if (room.hasPaymentNotice) {
    return 'PAYMENT_DUE';
  }
  if (room.status === 'EMPTY') {
    return 'EMPTY';
  }
  return 'OCCUPIED';
}

export function getRoomStatusColors(status: RoomDisplayStatus): RoomTileColors {
  return ROOM_STATUS_COLORS[status];
}
