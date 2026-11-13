import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';
import { AppDatabase } from '../src/db/appDatabase';
import { recordRoomAuditLog } from '../src/business/auditLogRecorder';

describe('auditLogRecorder', () => {
  let testDb: AppDatabase;

  beforeEach(async () => {
    testDb = new AppDatabase(`test_db_${Date.now()}`);
    await testDb.open();
  });

  it('tạo và ghi nhận RoomAuditLog Append-Only cùng OutboxMutation thành công', async () => {
    const log = await recordRoomAuditLog(
      {
        landlord_id: '11111111-1111-4111-a111-111111111111',
        room_id: '22222222-2222-4222-a222-222222222222',
        actor_id: '33333333-3333-4333-a333-333333333333',
        actor_role: 'LANDLORD',
        action_type: 'IN_PLACE_EDIT',
        change_summary: 'Cập nhật chỉ số điện mới từ 1200 lên 1280',
        old_data: { new_electric: 1200 },
        new_data: { new_electric: 1280 },
      },
      testDb
    );

    expect(log.id).toBeDefined();
    expect(log.change_summary).toBe('Cập nhật chỉ số điện mới từ 1200 lên 1280');
    expect(log.created_at).toBeDefined();

    // Kiểm tra trong Dexie table room_audit_logs
    const savedLog = await testDb.room_audit_logs.get(log.id);
    expect(savedLog).toBeDefined();
    expect(savedLog?.room_id).toBe('22222222-2222-4222-a222-222222222222');
    expect(savedLog?.action_type).toBe('IN_PLACE_EDIT');

    // Kiểm tra outbox_mutations được sinh đồng thời
    const mutations = await testDb.outbox_mutations.toArray();
    expect(mutations.length).toBe(1);
    expect(mutations[0]?.table_name).toBe('room_audit_logs');
    expect(mutations[0]?.operation).toBe('INSERT');
    expect(mutations[0]?.sync_status).toBe('PENDING');
  });
});
