import { db, AppDatabase } from '../db/appDatabase';
import type { RoomAuditLog, ActorRole, RoomActionType, OutboxMutation } from '@qlnt/shared-types';

export interface CreateAuditLogParams {
  landlord_id: string;
  room_id: string;
  actor_id: string;
  actor_role: ActorRole;
  action_type: RoomActionType;
  change_summary: string;
  old_data?: Record<string, unknown> | null;
  new_data?: Record<string, unknown> | null;
}

export function generateUUID(): string {
  if (typeof globalThis !== 'undefined' && globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export async function recordRoomAuditLog(
  params: CreateAuditLogParams,
  database: AppDatabase = db
): Promise<RoomAuditLog> {
  const logId = generateUUID();
  const mutationId = generateUUID();
  const now = new Date().toISOString();

  const auditLog: RoomAuditLog = {
    id: logId,
    landlord_id: params.landlord_id,
    room_id: params.room_id,
    actor_id: params.actor_id,
    actor_role: params.actor_role,
    action_type: params.action_type,
    change_summary: params.change_summary,
    old_data: params.old_data ?? null,
    new_data: params.new_data ?? null,
    created_at: now,
  };

  const mutation: OutboxMutation = {
    mutation_id: mutationId,
    table_name: 'room_audit_logs',
    operation: 'INSERT',
    record_id: logId,
    payload: auditLog as unknown as Record<string, unknown>,
    client_timestamp: now,
    sync_status: 'PENDING',
    retry_count: 0,
  };

  await database.transaction('rw', database.room_audit_logs, database.outbox_mutations, async () => {
    await database.room_audit_logs.add(auditLog);
    await database.outbox_mutations.add(mutation);
  });

  return auditLog;
}
