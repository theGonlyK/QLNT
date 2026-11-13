import Dexie, { type EntityTable } from 'dexie';
import type {
  Landlord,
  Property,
  Room,
  Tenant,
  Contract,
  Billing,
  PaymentRecord,
  MeterReading,
  RoomAuditLog,
  MaintenanceRequest,
  OutboxMutation,
} from '@qlnt/shared-types';

export class AppDatabase extends Dexie {
  landlords!: EntityTable<Landlord, 'id'>;
  properties!: EntityTable<Property, 'id'>;
  rooms!: EntityTable<Room, 'id'>;
  tenants!: EntityTable<Tenant, 'id'>;
  contracts!: EntityTable<Contract, 'id'>;
  billings!: EntityTable<Billing, 'id'>;
  payment_records!: EntityTable<PaymentRecord, 'id'>;
  meter_readings!: EntityTable<MeterReading, 'id'>;
  room_audit_logs!: EntityTable<RoomAuditLog, 'id'>;
  maintenance_requests!: EntityTable<MaintenanceRequest, 'id'>;
  outbox_mutations!: EntityTable<OutboxMutation, 'mutation_id'>;

  constructor(dbName = 'qlnt_local_db') {
    super(dbName);

    this.version(1).stores({
      landlords: 'id, phone, email',
      properties: 'id, landlord_id, name',
      rooms: 'id, landlord_id, property_id, floor_number, room_number, status',
      tenants: 'id, landlord_id, room_id, full_name, phone, role',
      contracts: 'id, landlord_id, room_id, tenant_id, status',
      billings: 'id, landlord_id, room_id, month_period, status',
      payment_records: 'id, landlord_id, billing_id, room_id, payment_date',
      meter_readings: 'id, landlord_id, room_id, billing_id, month_period',
      room_audit_logs: 'id, landlord_id, room_id, actor_id, action_type, created_at',
      maintenance_requests: 'id, landlord_id, room_id, status, reported_at',
      outbox_mutations: 'mutation_id, table_name, record_id, sync_status, client_timestamp, [sync_status+client_timestamp]',
    });
  }
}

export const db = new AppDatabase();
