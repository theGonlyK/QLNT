export type PaymentMethod = 'BANK_TRANSFER_MANUAL' | 'VIETQR_AUTO' | 'CASH';

export interface PaymentRecord {
  id: string; // UUID v4
  landlord_id: string;
  billing_id: string;
  room_id: string;
  amount_paid: number;
  payment_method: PaymentMethod;
  payment_date: string;
  verified_by?: string;
  note?: string;
  created_at: string;
}
