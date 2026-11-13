import { Vector3D } from '../renderer/vector3d';

export type WaterCalcMethod = 'PER_M3' | 'PER_PERSON';

export interface Property {
  id: string; // UUID v4
  landlord_id: string;
  name: string;
  address: string;
  total_floors: number;
  coordinates_3d: Vector3D;
  is_public_on_map: boolean;
  water_calc_method: WaterCalcMethod;
  water_unit_price: number;
  electric_unit_price: number;
  service_fee: number;
  created_at: string;
  updated_at: string;
}
