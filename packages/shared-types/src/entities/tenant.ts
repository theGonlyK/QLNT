import { AvatarSkinDTO } from '../renderer/rendererDtos';

export type TenantRole = 'REPRESENTATIVE' | 'ROOMMATE';
export type TempResidenceStatus = 'DECLARED' | 'NOT_DECLARED';

export interface Tenant {
  id: string; // UUID v4
  landlord_id: string;
  room_id: string;
  full_name: string;
  phone?: string;
  id_card_number?: string;
  id_card_front_url?: string;
  id_card_back_url?: string;
  birth_year?: number;
  hometown?: string;
  vehicle_plate?: string;
  role: TenantRole;
  temp_residence_status: TempResidenceStatus;
  reward_points: number;
  avatar_skin_config?: AvatarSkinDTO;
  created_at: string;
  updated_at: string;
}
