import type {
  Billing,
  Contract,
  Landlord,
  MaintenanceRequest,
  MeterReading,
  PaymentRecord,
  Property,
  Room,
  RoomAuditLog,
  RoomDeviceDTO,
  Tenant,
} from '@qlnt/shared-types';
import { calculateBilling, db, type AppDatabase } from '@qlnt/domain-core';

export const SEED_LANDLORD_ID = '11111111-1111-4111-8111-111111111101';
export const SEED_PROPERTY_ID = '22222222-2222-4222-8222-222222222201';
export const SEED_MONTH_PERIOD = '2026-11';
export const SEED_TIMESTAMP = '2026-11-01T08:00:00.000Z';

export const HANOI_MOTEL_BANK_INFO = {
  bankBin: '970436',
  bankName: 'Vietcombank',
  accountNumber: '1012345678',
  accountName: 'NGUYEN MINH ANH',
} as const;

export type SeedRoomSemanticState =
  | 'OCCUPIED_UNPAID'
  | 'OCCUPIED_PENDING_VERIFY'
  | 'OCCUPIED_PAID'
  | 'MAINTENANCE_BROKEN'
  | 'DEPOSIT_LOCKED'
  | 'VACANT';

export interface HanoiMotelSeedData {
  landlord: Landlord;
  property: Property;
  rooms: Room[];
  tenants: Tenant[];
  contracts: Contract[];
  meterReadings: MeterReading[];
  billings: Billing[];
  paymentRecords: PaymentRecord[];
  maintenanceRequests: MaintenanceRequest[];
  roomAuditLogs: RoomAuditLog[];
  devicesByRoomId: Record<string, RoomDeviceDTO[]>;
  roomSemanticStateById: Record<string, SeedRoomSemanticState>;
}

const LOCAL_SAMPLE_BILL_DATA_URL =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg viewBox="0 0 180 90" width="180" height="90"><rect width="180" height="90" fill="#ecfdf5"/><text x="14" y="34" font-size="12" fill="#065f46">BIEN LAI CHUYEN KHOAN</text><text x="14" y="56" font-size="11" fill="#047857">Da chuyen khoan local</text></svg>'
  );

function makeUuid(prefix: string, index: number): string {
  return `${prefix}-0000-4000-8000-${String(index).padStart(12, '0')}`;
}

function buildDefaultDevices(roomId: string, brokenDeviceName?: string): RoomDeviceDTO[] {
  const catalog: Array<{ suffix: string; name: string; category: RoomDeviceDTO['category'] }> = [
    { suffix: 'ac', name: 'Điều hòa Inverter', category: 'FIXED' },
    { suffix: 'heater', name: 'Bình nóng lạnh', category: 'FIXED' },
    { suffix: 'bed', name: 'Giường gỗ 1m6', category: 'FURNITURE' },
    { suffix: 'wardrobe', name: 'Tủ quần áo 2 cánh', category: 'FURNITURE' },
    { suffix: 'meter', name: 'Công tơ điện nước', category: 'METER' },
  ];

  return catalog.map((item) => ({
    deviceId: `${roomId}-${item.suffix}`,
    name: item.name,
    category: item.category,
    isBroken: brokenDeviceName === item.name,
    lastMaintained: '2026-09-15',
  }));
}

interface RoomSeedBlueprint {
  floor: number;
  roomNumber: string;
  areaSqm: number;
  basePrice: number;
  semantic: SeedRoomSemanticState;
  tenantName?: string;
  tenantPhone?: string;
  hometown?: string;
  oldElectric?: number;
  newElectric?: number;
  oldWater?: number;
  newWater?: number;
  brokenDeviceName?: string;
  issueDescription?: string;
}

const ROOM_BLUEPRINTS: RoomSeedBlueprint[] = [
  // Tầng 1: P101 - P104
  {
    floor: 1,
    roomNumber: 'P101',
    areaSqm: 22,
    basePrice: 3500000,
    semantic: 'OCCUPIED_UNPAID',
    tenantName: 'Nguyễn Văn Hùng',
    tenantPhone: '0912345101',
    hometown: 'Nam Định',
    oldElectric: 1200,
    newElectric: 1315,
    oldWater: 45,
    newWater: 51,
  },
  {
    floor: 1,
    roomNumber: 'P102',
    areaSqm: 22,
    basePrice: 3500000,
    semantic: 'OCCUPIED_UNPAID',
    tenantName: 'Trần Thị Mai',
    tenantPhone: '0912345102',
    hometown: 'Thái Bình',
    oldElectric: 980,
    newElectric: 1085,
    oldWater: 38,
    newWater: 43,
  },
  {
    floor: 1,
    roomNumber: 'P103',
    areaSqm: 24,
    basePrice: 3800000,
    semantic: 'OCCUPIED_PENDING_VERIFY',
    tenantName: 'Lê Hoàng Nam',
    tenantPhone: '0912345103',
    hometown: 'Thanh Hóa',
    oldElectric: 1540,
    newElectric: 1660,
    oldWater: 60,
    newWater: 66,
  },
  {
    floor: 1,
    roomNumber: 'P104',
    areaSqm: 24,
    basePrice: 3800000,
    semantic: 'OCCUPIED_PAID',
    tenantName: 'Phạm Thu Hà',
    tenantPhone: '0912345104',
    hometown: 'Hải Phòng',
    oldElectric: 1110,
    newElectric: 1205,
    oldWater: 52,
    newWater: 57,
  },
  // Tầng 2: P201 - P204
  {
    floor: 2,
    roomNumber: 'P201',
    areaSqm: 22,
    basePrice: 3600000,
    semantic: 'OCCUPIED_UNPAID',
    tenantName: 'Đỗ Quang Minh',
    tenantPhone: '0912345201',
    hometown: 'Phú Thọ',
    oldElectric: 870,
    newElectric: 965,
    oldWater: 31,
    newWater: 36,
  },
  {
    floor: 2,
    roomNumber: 'P202',
    areaSqm: 22,
    basePrice: 3600000,
    semantic: 'OCCUPIED_PENDING_VERIFY',
    tenantName: 'Vũ Ngọc Ánh',
    tenantPhone: '0912345202',
    hometown: 'Hải Dương',
    oldElectric: 1030,
    newElectric: 1120,
    oldWater: 42,
    newWater: 47,
  },
  {
    floor: 2,
    roomNumber: 'P203',
    areaSqm: 25,
    basePrice: 4000000,
    semantic: 'OCCUPIED_PAID',
    tenantName: 'Bùi Đức Thắng',
    tenantPhone: '0912345203',
    hometown: 'Nghệ An',
    oldElectric: 1410,
    newElectric: 1510,
    oldWater: 64,
    newWater: 70,
  },
  {
    floor: 2,
    roomNumber: 'P204',
    areaSqm: 25,
    basePrice: 4000000,
    semantic: 'MAINTENANCE_BROKEN',
    tenantName: 'Hoàng Lan Chi',
    tenantPhone: '0912345204',
    hometown: 'Bắc Ninh',
    brokenDeviceName: 'Điều hòa Inverter',
    issueDescription: 'Điều hòa kêu to và không làm mát từ tối qua',
  },
  // Tầng 3: P301 - P304
  {
    floor: 3,
    roomNumber: 'P301',
    areaSqm: 23,
    basePrice: 3700000,
    semantic: 'OCCUPIED_PAID',
    tenantName: 'Ngô Minh Tuấn',
    tenantPhone: '0912345301',
    hometown: 'Vĩnh Phúc',
    oldElectric: 760,
    newElectric: 845,
    oldWater: 29,
    newWater: 34,
  },
  {
    floor: 3,
    roomNumber: 'P302',
    areaSqm: 23,
    basePrice: 3700000,
    semantic: 'MAINTENANCE_BROKEN',
    tenantName: 'Đặng Bảo Ngọc',
    tenantPhone: '0912345302',
    hometown: 'Hưng Yên',
    brokenDeviceName: 'Bình nóng lạnh',
    issueDescription: 'Bình nóng lạnh rò nước nhẹ ở van xả',
  },
  {
    floor: 3,
    roomNumber: 'P303',
    areaSqm: 24,
    basePrice: 3500000,
    semantic: 'DEPOSIT_LOCKED',
    tenantName: 'Trịnh Quốc Bảo',
    tenantPhone: '0912345303',
    hometown: 'Ninh Bình',
  },
  {
    floor: 3,
    roomNumber: 'P304',
    areaSqm: 24,
    basePrice: 3500000,
    semantic: 'VACANT',
  },
];

export function createHanoiMotelSeed(): HanoiMotelSeedData {
  const landlord: Landlord = {
    id: SEED_LANDLORD_ID,
    name: 'Nguyễn Minh Anh',
    phone: '0988123456',
    email: 'minhanh.nhatro@qlnt.local',
    reputation_stars: 4.8,
    package_tier: 'PRO',
    created_at: SEED_TIMESTAMP,
    updated_at: SEED_TIMESTAMP,
  };

  const property: Property = {
    id: SEED_PROPERTY_ID,
    landlord_id: SEED_LANDLORD_ID,
    name: 'Nhà trọ Hạnh Phúc — Ngõ 133 Xuân Thủy, Cầu Giấy, Hà Nội',
    address: 'Ngõ 133 Xuân Thủy, Dịch Vọng Hậu, Cầu Giấy, Hà Nội',
    total_floors: 3,
    coordinates_3d: { x: 0, y: 0, z: 0 },
    is_public_on_map: true,
    water_calc_method: 'PER_M3',
    water_unit_price: 30000,
    electric_unit_price: 3800,
    service_fee: 150000,
    created_at: SEED_TIMESTAMP,
    updated_at: SEED_TIMESTAMP,
  };

  const rooms: Room[] = [];
  const tenants: Tenant[] = [];
  const contracts: Contract[] = [];
  const meterReadings: MeterReading[] = [];
  const billings: Billing[] = [];
  const paymentRecords: PaymentRecord[] = [];
  const maintenanceRequests: MaintenanceRequest[] = [];
  const roomAuditLogs: RoomAuditLog[] = [];
  const devicesByRoomId: Record<string, RoomDeviceDTO[]> = {};
  const roomSemanticStateById: Record<string, SeedRoomSemanticState> = {};

  ROOM_BLUEPRINTS.forEach((bp, idx) => {
    const seq = idx + 1;
    const roomId = makeUuid('33333333', seq);
    const roomStatus: Room['status'] =
      bp.semantic === 'MAINTENANCE_BROKEN'
        ? 'MAINTENANCE'
        : bp.semantic === 'VACANT' || bp.semantic === 'DEPOSIT_LOCKED'
          ? 'EMPTY'
          : 'RENTED';

    const room: Room = {
      id: roomId,
      landlord_id: SEED_LANDLORD_ID,
      property_id: SEED_PROPERTY_ID,
      floor_number: bp.floor,
      room_number: bp.roomNumber,
      area_sqm: bp.areaSqm,
      base_price: bp.basePrice,
      deposit_amount: bp.semantic === 'VACANT' ? 0 : bp.basePrice,
      status: roomStatus,
      created_at: SEED_TIMESTAMP,
      updated_at: SEED_TIMESTAMP,
    };
    rooms.push(room);
    roomSemanticStateById[roomId] = bp.semantic;
    devicesByRoomId[roomId] = buildDefaultDevices(roomId, bp.brokenDeviceName);

    if (bp.tenantName) {
      const tenantId = makeUuid('44444444', seq);
      const tenant: Tenant = {
        id: tenantId,
        landlord_id: SEED_LANDLORD_ID,
        room_id: roomId,
        full_name: bp.tenantName,
        phone: bp.tenantPhone,
        hometown: bp.hometown,
        role: 'REPRESENTATIVE',
        temp_residence_status: bp.semantic === 'DEPOSIT_LOCKED' ? 'NOT_DECLARED' : 'DECLARED',
        reward_points: bp.semantic === 'OCCUPIED_PAID' ? 12 : 8,
        avatar_skin_config: {
          modelId: `avatar_style_${(seq % 3) + 1}`,
          colorScheme: bp.floor === 1 ? 'amber' : bp.floor === 2 ? 'teal' : 'indigo',
        },
        created_at: SEED_TIMESTAMP,
        updated_at: SEED_TIMESTAMP,
      };
      tenants.push(tenant);

      if (bp.semantic !== 'DEPOSIT_LOCKED') {
        const contractId = makeUuid('55555555', seq);
        const contract: Contract = {
          id: contractId,
          landlord_id: SEED_LANDLORD_ID,
          room_id: roomId,
          tenant_id: tenantId,
          start_date: '2026-06-01',
          end_date: '2027-05-31',
          duration_months: 12,
          monthly_rent: bp.basePrice,
          deposit_paid: bp.basePrice,
          payment_cycle_day: 5,
          status: 'ACTIVE',
          created_at: SEED_TIMESTAMP,
          updated_at: SEED_TIMESTAMP,
        };
        contracts.push(contract);

        if (
          bp.oldElectric !== undefined &&
          bp.newElectric !== undefined &&
          bp.oldWater !== undefined &&
          bp.newWater !== undefined
        ) {
          const billingId = makeUuid('66666666', seq);
          const readingId = makeUuid('77777777', seq);
          const calc = calculateBilling({
            roomRent: bp.basePrice,
            oldElectric: bp.oldElectric,
            newElectric: bp.newElectric,
            electricUnitPrice: property.electric_unit_price,
            waterCalcMethod: property.water_calc_method,
            waterUnitPrice: property.water_unit_price,
            oldWater: bp.oldWater,
            newWater: bp.newWater,
            serviceCharge: property.service_fee,
          });

          const meterReading: MeterReading = {
            id: readingId,
            landlord_id: SEED_LANDLORD_ID,
            room_id: roomId,
            billing_id: billingId,
            month_period: SEED_MONTH_PERIOD,
            old_electric: bp.oldElectric,
            new_electric: bp.newElectric,
            electric_consumed: calc.electricConsumed,
            old_water: bp.oldWater,
            new_water: bp.newWater,
            water_consumed: calc.waterConsumed,
            recorded_by: 'LANDLORD',
            recorded_at: SEED_TIMESTAMP,
          };
          meterReadings.push(meterReading);

          const billingStatus: Billing['status'] =
            bp.semantic === 'OCCUPIED_PAID'
              ? 'PAID'
              : bp.semantic === 'OCCUPIED_PENDING_VERIFY'
                ? 'PENDING_APPROVAL'
                : 'UNPAID';

          const billing: Billing = {
            id: billingId,
            landlord_id: SEED_LANDLORD_ID,
            room_id: roomId,
            contract_id: contractId,
            month_period: SEED_MONTH_PERIOD,
            room_charge: calc.roomCharge,
            electric_charge: calc.electricCharge,
            water_charge: calc.waterCharge,
            service_charge: calc.serviceCharge,
            vehicle_charge: calc.vehicleCharge,
            previous_debt: calc.previousDebt,
            total_amount: calc.totalAmount,
            status: billingStatus,
            bill_image_url:
              billingStatus === 'PENDING_APPROVAL' ? LOCAL_SAMPLE_BILL_DATA_URL : undefined,
            created_at: SEED_TIMESTAMP,
            updated_at: SEED_TIMESTAMP,
          };
          billings.push(billing);

          if (billingStatus === 'PAID') {
            paymentRecords.push({
              id: makeUuid('88888888', seq),
              landlord_id: SEED_LANDLORD_ID,
              billing_id: billingId,
              room_id: roomId,
              amount_paid: calc.totalAmount,
              payment_method: 'VIETQR_AUTO',
              payment_date: '2026-11-05T09:30:00.000Z',
              verified_by: SEED_LANDLORD_ID,
              note: `Thanh toán đủ hóa đơn ${SEED_MONTH_PERIOD} phòng ${bp.roomNumber}`,
              created_at: '2026-11-05T09:30:00.000Z',
            });

            roomAuditLogs.push({
              id: makeUuid('99999999', seq),
              landlord_id: SEED_LANDLORD_ID,
              room_id: roomId,
              actor_id: SEED_LANDLORD_ID,
              actor_role: 'LANDLORD',
              action_type: 'PAYMENT_VERIFIED',
              change_summary: `Xác nhận thanh toán ${SEED_MONTH_PERIOD} phòng ${bp.roomNumber} (+2 Sao Uy Tín)`,
              created_at: '2026-11-05T09:30:00.000Z',
            });
          } else {
            roomAuditLogs.push({
              id: makeUuid('99999999', seq),
              landlord_id: SEED_LANDLORD_ID,
              room_id: roomId,
              actor_id: SEED_LANDLORD_ID,
              actor_role: 'LANDLORD',
              action_type: 'IN_PLACE_EDIT',
              change_summary:
                billingStatus === 'PENDING_APPROVAL'
                  ? `Khách phòng ${bp.roomNumber} đã gửi biên lai chờ duyệt`
                  : `Chốt chỉ số điện nước tháng ${SEED_MONTH_PERIOD} phòng ${bp.roomNumber}`,
              created_at: SEED_TIMESTAMP,
            });
          }
        }
      } else {
        roomAuditLogs.push({
          id: makeUuid('99999999', seq),
          landlord_id: SEED_LANDLORD_ID,
          room_id: roomId,
          actor_id: SEED_LANDLORD_ID,
          actor_role: 'LANDLORD',
          action_type: 'STATUS_CHANGE',
          change_summary: `Đặt cọc giữ phòng ${bp.roomNumber} (${bp.basePrice.toLocaleString('vi-VN')} đ)`,
          created_at: SEED_TIMESTAMP,
        });
      }
    }

    if (bp.semantic === 'MAINTENANCE_BROKEN' && bp.brokenDeviceName) {
      maintenanceRequests.push({
        id: makeUuid('aaaaaaaa', seq),
        landlord_id: SEED_LANDLORD_ID,
        room_id: roomId,
        tenant_id: makeUuid('44444444', seq),
        device_name: bp.brokenDeviceName,
        device_category: 'FIXED',
        issue_description: bp.issueDescription ?? 'Thiết bị cần kiểm tra bảo trì',
        status: 'PENDING_ALERT',
        reported_at: '2026-11-10T10:15:00.000Z',
        repair_cost: 0,
      });

      roomAuditLogs.push({
        id: makeUuid('99999999', seq),
        landlord_id: SEED_LANDLORD_ID,
        room_id: roomId,
        actor_id: makeUuid('44444444', seq),
        actor_role: 'TENANT',
        action_type: 'DEVICE_STATUS',
        change_summary: `Báo hỏng ${bp.brokenDeviceName} tại phòng ${bp.roomNumber}`,
        created_at: '2026-11-10T10:15:00.000Z',
      });
    }
  });

  return {
    landlord,
    property,
    rooms,
    tenants,
    contracts,
    meterReadings,
    billings,
    paymentRecords,
    maintenanceRequests,
    roomAuditLogs,
    devicesByRoomId,
    roomSemanticStateById,
  };
}

export const HANOI_MOTEL_SEED: HanoiMotelSeedData = createHanoiMotelSeed();

export async function seedDatabaseIfNeeded(database: AppDatabase = db): Promise<boolean> {
  const existingProperties = await database.properties.count();
  if (existingProperties > 0) {
    return false;
  }

  const seed = createHanoiMotelSeed();

  await database.transaction(
    'rw',
    [
      database.landlords,
      database.properties,
      database.rooms,
      database.tenants,
      database.contracts,
      database.meter_readings,
      database.billings,
      database.payment_records,
      database.maintenance_requests,
      database.room_audit_logs,
    ],
    async () => {
      await database.landlords.add(seed.landlord);
      await database.properties.add(seed.property);
      await database.rooms.bulkAdd(seed.rooms);
      await database.tenants.bulkAdd(seed.tenants);
      await database.contracts.bulkAdd(seed.contracts);
      await database.meter_readings.bulkAdd(seed.meterReadings);
      await database.billings.bulkAdd(seed.billings);
      await database.payment_records.bulkAdd(seed.paymentRecords);
      await database.maintenance_requests.bulkAdd(seed.maintenanceRequests);
      await database.room_audit_logs.bulkAdd(seed.roomAuditLogs);
    }
  );

  return true;
}
