export type RecordedBy = 'LANDLORD' | 'TENANT' | 'OFFICER_QR';

export interface MeterReading {
  id: string; // UUID v4
  landlord_id: string;
  room_id: string;
  billing_id?: string;
  month_period: string; // YYYY-MM
  old_electric: number;
  new_electric: number;
  electric_consumed: number;
  old_water: number;
  new_water: number;
  water_consumed: number;
  meter_photo_url?: string;
  recorded_by: RecordedBy;
  recorded_at: string;
}
