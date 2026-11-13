export type ContractStatus = 'ACTIVE' | 'EXPIRED' | 'TERMINATED';

export interface Contract {
  id: string; // UUID v4
  landlord_id: string;
  room_id: string;
  tenant_id: string;
  start_date: string;
  end_date: string;
  duration_months: number;
  monthly_rent: number;
  deposit_paid: number;
  payment_cycle_day: number;
  status: ContractStatus;
  contract_file_url?: string;
  created_at: string;
  updated_at: string;
}
