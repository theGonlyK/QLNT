export type BillingStatus = 'UNPAID' | 'PENDING_APPROVAL' | 'PAID';

export interface Billing {
  id: string; // UUID v4
  landlord_id: string;
  room_id: string;
  contract_id?: string;
  month_period: string; // YYYY-MM
  room_charge: number;
  electric_charge: number;
  water_charge: number;
  service_charge: number;
  vehicle_charge: number;
  previous_debt: number;
  total_amount: number;
  status: BillingStatus;
  bill_image_url?: string;
  created_at: string;
  updated_at: string;
}
