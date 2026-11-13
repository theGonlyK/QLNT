export type DeviceCategory = 'FIXED' | 'FURNITURE' | 'ADDITIONAL' | 'SECURITY' | 'METER';
export type MaintenanceStatus = 'PENDING_ALERT' | 'IN_PROGRESS' | 'RESOLVED';

export interface MaintenanceRequest {
  id: string; // UUID v4
  landlord_id: string;
  room_id: string;
  tenant_id?: string;
  device_name: string;
  device_category: DeviceCategory;
  issue_description: string;
  photo_url?: string;
  status: MaintenanceStatus;
  reported_at: string;
  resolved_at?: string;
  repair_cost: number;
  resolved_by?: string;
}
