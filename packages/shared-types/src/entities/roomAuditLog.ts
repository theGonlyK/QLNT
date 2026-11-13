export type ActorRole = 'LANDLORD' | 'TENANT' | 'SYSTEM' | 'SALE';
export type RoomActionType =
  | 'IN_PLACE_EDIT'
  | 'STATUS_CHANGE'
  | 'DEVICE_STATUS'
  | 'PAYMENT_VERIFIED'
  | 'CONTRACT_RENEW';

export interface RoomAuditLog {
  id: string; // UUID v4
  landlord_id: string;
  room_id: string;
  actor_id: string;
  actor_role: ActorRole;
  action_type: RoomActionType;
  change_summary: string;
  old_data?: Record<string, unknown> | null;
  new_data?: Record<string, unknown> | null;
  created_at: string; // Immutable timestamp
}
