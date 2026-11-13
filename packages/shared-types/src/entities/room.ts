export type RoomStatus = 'EMPTY' | 'RENTED' | 'MAINTENANCE';

export interface Room {
  id: string; // UUID v4
  landlord_id: string;
  property_id: string;
  floor_number: number;
  room_number: string;
  area_sqm: number;
  base_price: number;
  deposit_amount: number;
  status: RoomStatus;
  created_at: string;
  updated_at: string;
}
