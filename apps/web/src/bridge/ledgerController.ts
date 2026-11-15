import type {
  Billing,
  FloorMapDTO,
  FloorMapRoomDTO,
  IGameRenderer,
  Landlord,
  MaintenanceRequest,
  MeterReading,
  PaymentRecord,
  Property,
  Room,
  RoomAuditLog,
  RoomDetailDTO,
  RoomDetailTab,
  RoomDeviceDTO,
  RoomNoticeType,
  Tenant,
} from '@qlnt/shared-types';
import {
  calculateBilling,
  calculateNewReputation,
  db,
  generateUUID,
  recordRoomAuditLog,
  useLedgerStore,
  type AppDatabase,
  type BillingCalculationResult,
} from '@qlnt/domain-core';
import {
  createHanoiMotelSeed,
  SEED_LANDLORD_ID,
  SEED_MONTH_PERIOD,
  seedDatabaseIfNeeded,
} from '../seed/hanoiMotelSeed';
import { GAME_COPYWRITING } from '../copywriting/gameCopywriting';

const AUTH_SESSION_STORAGE_KEY = 'qlnt_auth_session_v1';
const LANDLORD_PINS_STORAGE_KEY = 'qlnt_landlord_pins_v1';
const BUILDING_BLOCK_PRESET_STORAGE_KEY = 'qlnt_building_block_preset_v1';
const DEFAULT_SEED_PIN = '123456';
const memoryStorage = new Map<string, string>();

function readStorageItem(key: string): string | null {
  if (typeof globalThis !== 'undefined' && 'localStorage' in globalThis && globalThis.localStorage) {
    return globalThis.localStorage.getItem(key);
  }
  return memoryStorage.get(key) ?? null;
}

function writeStorageItem(key: string, value: string): void {
  if (typeof globalThis !== 'undefined' && 'localStorage' in globalThis && globalThis.localStorage) {
    globalThis.localStorage.setItem(key, value);
    return;
  }
  memoryStorage.set(key, value);
}

function removeStorageItem(key: string): void {
  if (typeof globalThis !== 'undefined' && 'localStorage' in globalThis && globalThis.localStorage) {
    globalThis.localStorage.removeItem(key);
    return;
  }
  memoryStorage.delete(key);
}

export function clearStorageForTesting(): void {
  memoryStorage.clear();
  if (typeof globalThis !== 'undefined' && 'localStorage' in globalThis && globalThis.localStorage) {
    globalThis.localStorage.clear();
  }
}

function readLandlordPins(): Record<string, string> {
  const raw = readStorageItem(LANDLORD_PINS_STORAGE_KEY);
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const pins: Record<string, string> = {};
    for (const [k, v] of Object.entries(parsed)) {
      if (typeof v === 'string') {
        pins[k] = v;
      }
    }
    return pins;
  } catch {
    return {};
  }
}

function writeLandlordPins(pins: Record<string, string>): void {
  writeStorageItem(LANDLORD_PINS_STORAGE_KEY, JSON.stringify(pins));
}

function buildStandardRoomDevices(roomId: string): RoomDeviceDTO[] {
  const catalog: Array<{ suffix: string; name: string; category: RoomDeviceDTO['category'] }> = [
    { suffix: 'ac', name: 'Điều hòa Inverter', category: 'FIXED' },
    { suffix: 'heater', name: 'Bình nóng lạnh', category: 'FIXED' },
    { suffix: 'bed', name: 'Giường gỗ 1m6', category: 'FURNITURE' },
    { suffix: 'wardrobe', name: 'Tủ quần áo 2 cánh', category: 'FURNITURE' },
    { suffix: 'meter', name: 'Công tơ điện nước', category: 'METER' },
  ];
  const today = new Date().toISOString().slice(0, 10);
  return catalog.map((item) => ({
    deviceId: `${roomId}-${item.suffix}`,
    name: item.name,
    category: item.category,
    isBroken: false,
    lastMaintained: today,
  }));
}

export interface BuildingAreaPreset {
  id: 'STANDARD_20' | 'MEZZANINE_25' | 'STUDIO_35';
  label: string;
  description: string;
  areaSqm: number;
  basePrice: number;
}

export const BUILDING_AREA_PRESETS: readonly BuildingAreaPreset[] = [
  {
    id: 'STANDARD_20',
    label: 'Phòng đơn (20 m²)',
    description: 'Phòng trọ khép kín tiêu chuẩn',
    areaSqm: 20,
    basePrice: 3200000,
  },
  {
    id: 'MEZZANINE_25',
    label: 'Gác lửng (25 m²)',
    description: 'Phòng có gác xép tối ưu không gian',
    areaSqm: 25,
    basePrice: 4000000,
  },
  {
    id: 'STUDIO_35',
    label: 'Studio CCMN (35 m²)',
    description: 'Căn hộ studio chung cư mini đủ nội thất',
    areaSqm: 35,
    basePrice: 5200000,
  },
] as const;

export type BuildingBlockPresetId =
  | 'TOWER_2x2x6'
  | 'CCMN_3x2x4'
  | 'CUBE_3x3x3'
  | 'COMPACT_2x2x3'
  | 'LONG_4x2x2'
  | 'CUSTOM';

export interface BuildingBlockPreset {
  id: BuildingBlockPresetId;
  name: string;
  label: string;
  description: string;
  cols: number; // X: số phòng ngang
  rows: number; // Z: số dãy phòng sâu
  floors: number; // Y: số tầng
  roomsPerFloor: number; // cols * rows
  totalRooms: number; // cols * rows * floors
}

export const BUILDING_BLOCK_PRESETS: readonly BuildingBlockPreset[] = [
  {
    id: 'TOWER_2x2x6',
    name: 'Tháp Nhà Ống (2x2x6)',
    label: 'Tháp Nhà Ống (2x2x6)',
    description: '2 phòng ngang × 2 dãy sâu × 6 tầng (24 phòng)',
    cols: 2,
    rows: 2,
    floors: 6,
    roomsPerFloor: 4,
    totalRooms: 24,
  },
  {
    id: 'CCMN_3x2x4',
    name: 'Chung Cư Mini (3x2x4)',
    label: 'Chung Cư Mini (3x2x4)',
    description: '3 phòng ngang × 2 dãy sâu × 4 tầng (24 phòng)',
    cols: 3,
    rows: 2,
    floors: 4,
    roomsPerFloor: 6,
    totalRooms: 24,
  },
  {
    id: 'CUBE_3x3x3',
    name: 'Khối Lập Phương (3x3x3)',
    label: 'Khối Lập Phương (3x3x3)',
    description: '3 phòng ngang × 3 dãy sâu × 3 tầng (27 phòng)',
    cols: 3,
    rows: 3,
    floors: 3,
    roomsPerFloor: 9,
    totalRooms: 27,
  },
  {
    id: 'COMPACT_2x2x3',
    name: 'Nhà Phố Tiêu Chuẩn (2x2x3)',
    label: 'Nhà Phố Tiêu Chuẩn (2x2x3)',
    description: '2 phòng ngang × 2 dãy sâu × 3 tầng (12 phòng)',
    cols: 2,
    rows: 2,
    floors: 3,
    roomsPerFloor: 4,
    totalRooms: 12,
  },
  {
    id: 'LONG_4x2x2',
    name: 'Dãy Trọ Ngang (4x2x2)',
    label: 'Dãy Trọ Ngang (4x2x2)',
    description: '4 phòng ngang × 2 dãy sâu × 2 tầng (16 phòng)',
    cols: 4,
    rows: 2,
    floors: 2,
    roomsPerFloor: 8,
    totalRooms: 16,
  },
  {
    id: 'CUSTOM',
    name: 'Tùy Chỉnh Tự Do',
    label: 'Tùy Chỉnh Tự Do',
    description: 'Tùy chỉnh số phòng ngang X, dãy Z và tầng Y',
    cols: 2,
    rows: 2,
    floors: 3,
    roomsPerFloor: 4,
    totalRooms: 12,
  },
] as const;

export interface RegisterLandlordInput {
  name: string;
  phone: string;
  email?: string;
  pin: string;
  packageTier?: Landlord['package_tier'];
}

export interface RoomSetupDraft {
  roomNumber: string;
  floorNumber: number;
  areaSqm: number;
  basePrice: number;
  depositAmount?: number;
  status?: Room['status'];
}

export interface BuildingRegistrationInput {
  propertyName: string;
  address: string;
  totalFloors: number;
  roomsPerFloor: number;
  waterCalcMethod: Property['water_calc_method'];
  electricUnitPrice: number;
  waterUnitPrice: number;
  serviceFee: number;
  roomsDraft: RoomSetupDraft[];
}

export interface BillingPreviewState {
  roomId: string;
  oldElectric: number;
  newElectric: number;
  oldWater: number;
  newWater: number;
  calculation: BillingCalculationResult;
}

export interface ApproveBillResult {
  roomDetail: RoomDetailDTO;
  reputationDelta: number;
  newRewardPoints: number;
  newLandlordReputation: number;
}

export interface RoomSummarySnapshot {
  totalRooms: number;
  occupiedCount: number;
  paymentDueCount: number;
  pendingVerifyCount: number;
  brokenDeviceCount: number;
  vacantCount: number;
  totalAreaSqm: number;
  averageAreaSqm: number;
}

export interface RoomQuickPickItem {
  room: Room;
  tenantName?: string;
  noticeType: RoomNoticeType;
  hasBrokenDevice: boolean;
  billingStatus?: Billing['status'];
}

export type ViewMode = 'BUILDING' | 'FLOOR_3D';

export interface FloorCutawayRoomConfig {
  roomId: string;
  roomNumber: string;
  floorIndex: number;
  floorNumber: number;
  roomIndex: number;
  status: Room['status'];
  areaSqm: number;
  basePrice: number;
  tenantName?: string;
  noticeType: RoomNoticeType;
  hasPaymentNotice: boolean;
  hasPaymentDue: boolean;
  hasBrokenDevice: boolean;
  devices: RoomDeviceDTO[];
  currentTenant?: {
    tenantId: string;
    fullName: string;
    phone: string;
    hometown?: string;
    tempResidenceStatus?: string;
  };
  latestBilling?: {
    billingId: string;
    monthPeriod: string;
    roomCharge: number;
    electricCharge: number;
    waterCharge: number;
    serviceCharge: number;
    totalAmount: number;
    status: Billing['status'];
    billImageUrl?: string;
  };
  latestReading?: {
    oldElectric: number;
    newElectric: number;
    oldWater: number;
    newWater: number;
  };
}

export class LedgerController {
  private readonly database: AppDatabase;
  private renderer: IGameRenderer | null;
  private monthPeriod: string;

  public landlord: Landlord | null = null;
  public property: Property | null = null;
  public rooms: Room[] = [];
  public currentBlockPresetId: BuildingBlockPresetId = 'COMPACT_2x2x3';
  public currentBlockGrid: { cols: number; rows: number } = { cols: 2, rows: 2 };

  private tenants: Tenant[] = [];
  private meterReadings: MeterReading[] = [];
  private billings: Billing[] = [];
  private paymentRecords: PaymentRecord[] = [];
  private maintenanceRequests: MaintenanceRequest[] = [];
  private roomAuditLogs: RoomAuditLog[] = [];
  private devicesByRoomId: Record<string, RoomDeviceDTO[]> = {};
  private previewByRoomId: Record<string, BillingPreviewState> = {};
  private authenticatedLandlordId: string | null = null;
  private initialized = false;
  private viewMode: ViewMode = 'BUILDING';
  private activeFloorIndex = 0;

  constructor(options?: {
    database?: AppDatabase;
    renderer?: IGameRenderer | null;
    monthPeriod?: string;
  }) {
    this.database = options?.database ?? db;
    this.renderer = options?.renderer ?? null;
    this.monthPeriod = options?.monthPeriod ?? SEED_MONTH_PERIOD;
  }

  attachRenderer(renderer: IGameRenderer | null): void {
    this.renderer = renderer;
    if (renderer && this.initialized) {
      void this.syncAllToRenderer();
    }
  }

  getMonthPeriod(): string {
    return this.monthPeriod;
  }

  getProperty(): Property | null {
    return this.property;
  }

  getLandlord(): Landlord | null {
    return this.landlord;
  }

  getRooms(): Room[] {
    return [...this.rooms];
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  isAuthenticated(): boolean {
    return this.authenticatedLandlordId !== null && this.landlord !== null;
  }

  getViewMode(): ViewMode {
    return this.viewMode;
  }

  getActiveFloorIndex(): number {
    return this.activeFloorIndex;
  }

  getCurrentBlockPresetId(): BuildingBlockPresetId {
    return this.currentBlockPresetId;
  }

  getCurrentBlockGrid(): { cols: number; rows: number } {
    return { ...this.currentBlockGrid };
  }

  getRoomsPerFloor(): number {
    if (!this.property || this.property.total_floors <= 0) {
      return Math.max(1, this.rooms.length);
    }
    return Math.max(
      1,
      ...Array.from({ length: this.property.total_floors }, (_, idx) => {
        const floor = idx + 1;
        return this.rooms.filter((r) => r.floor_number === floor).length;
      })
    );
  }

  async initialize(): Promise<void> {
    await seedDatabaseIfNeeded(this.database);
    const seed = createHanoiMotelSeed();

    const [
      landlords,
      properties,
      rooms,
      tenants,
      meterReadings,
      billings,
      paymentRecords,
      maintenanceRequests,
      roomAuditLogs,
    ] = await Promise.all([
      this.database.landlords.toArray(),
      this.database.properties.toArray(),
      this.database.rooms.toArray(),
      this.database.tenants.toArray(),
      this.database.meter_readings.toArray(),
      this.database.billings.toArray(),
      this.database.payment_records.toArray(),
      this.database.maintenance_requests.toArray(),
      this.database.room_audit_logs.toArray(),
    ]);

    const pins = readLandlordPins();
    const seedLandlord = landlords.find((l) => l.id === SEED_LANDLORD_ID) ?? landlords[0] ?? seed.landlord;
    if (!pins[seedLandlord.id]) {
      pins[seedLandlord.id] = DEFAULT_SEED_PIN;
      writeLandlordPins(pins);
    }

    let restoredLandlord: Landlord | null = null;
    const rawSession = readStorageItem(AUTH_SESSION_STORAGE_KEY);
    if (rawSession) {
      try {
        const parsed = JSON.parse(rawSession) as { landlordId?: string };
        if (parsed.landlordId) {
          restoredLandlord = landlords.find((l) => l.id === parsed.landlordId) ?? null;
        }
      } catch {
        restoredLandlord = null;
      }
    }

    this.authenticatedLandlordId = restoredLandlord ? restoredLandlord.id : null;
    this.landlord = restoredLandlord ?? seedLandlord;
    this.property = properties[0] ?? seed.property;
    this.rooms = rooms.sort((a, b) => a.room_number.localeCompare(b.room_number));
    this.tenants = tenants;
    this.meterReadings = meterReadings;
    this.billings = billings;
    this.paymentRecords = paymentRecords;
    this.maintenanceRequests = maintenanceRequests;
    this.roomAuditLogs = roomAuditLogs;

    // Build devices map from seed catalog and reflect active maintenance requests
    const devicesMap: Record<string, RoomDeviceDTO[]> = {};
    for (const room of this.rooms) {
      const baseDevices = (
        seed.devicesByRoomId[room.id] ?? buildStandardRoomDevices(room.id)
      ).map((d) => ({ ...d }));
      const activeAlerts = this.maintenanceRequests.filter(
        (m) => m.room_id === room.id && m.status !== 'RESOLVED'
      );
      for (const device of baseDevices) {
        const hasAlert = activeAlerts.some((m) => m.device_name === device.name);
        device.isBroken = hasAlert;
      }
      devicesMap[room.id] = baseDevices;
    }
    this.devicesByRoomId = devicesMap;

    const savedPresetId = readStorageItem(BUILDING_BLOCK_PRESET_STORAGE_KEY) as BuildingBlockPresetId | null;
    if (savedPresetId && BUILDING_BLOCK_PRESETS.some((p) => p.id === savedPresetId)) {
      this.currentBlockPresetId = savedPresetId;
      const matched = BUILDING_BLOCK_PRESETS.find((p) => p.id === savedPresetId);
      if (matched && matched.id !== 'CUSTOM') {
        this.currentBlockGrid = { cols: matched.cols, rows: matched.rows };
      }
    } else {
      const matched = BUILDING_BLOCK_PRESETS.find(
        (p) =>
          p.id !== 'CUSTOM' &&
          p.floors === this.property?.total_floors &&
          p.totalRooms === this.rooms.length
      );
      if (matched) {
        this.currentBlockPresetId = matched.id;
        this.currentBlockGrid = { cols: matched.cols, rows: matched.rows };
      } else {
        this.currentBlockPresetId = 'COMPACT_2x2x3';
        this.currentBlockGrid = { cols: 2, rows: 2 };
      }
    }

    this.initialized = true;

    if (this.renderer) {
      await this.syncAllToRenderer();
    }
  }

  async syncAllToRenderer(): Promise<void> {
    if (!this.renderer || !this.property) return;

    const roomsPerFloor = this.getRoomsPerFloor();
    await this.renderer.renderBuilding({
      propertyId: this.property.id,
      totalFloors: this.property.total_floors,
      roomsPerFloor,
      position: { x: 0, y: 0, z: 0 },
      blockGrid: this.currentBlockGrid,
    } as any);

    const roomsByFloor = new Map<number, Room[]>();
    for (const room of this.rooms) {
      const list = roomsByFloor.get(room.floor_number) ?? [];
      list.push(room);
      roomsByFloor.set(room.floor_number, list);
    }

    const mappings: Array<{
      roomId: string;
      floorIndex: number;
      roomIndex: number;
      roomNumber?: string;
    }> = [];
    for (const [floorNumber, floorRooms] of roomsByFloor.entries()) {
      const sortedFloorRooms = [...floorRooms].sort((a, b) =>
        a.room_number.localeCompare(b.room_number)
      );
      sortedFloorRooms.forEach((room, roomIndex) => {
        mappings.push({
          roomId: room.id,
          floorIndex: floorNumber - 1,
          roomIndex,
          roomNumber: room.room_number,
        });
      });
    }

    (
      this.renderer as {
        bindRoomIds?: (
          items: Array<{
            roomId: string;
            floorIndex: number;
            roomIndex: number;
            roomNumber?: string;
          }>
        ) => void;
      }
    ).bindRoomIds?.(mappings);

    for (const room of this.rooms) {
      const notice = this.getRoomNoticeType(room.id);
      this.renderer.setRoomNotice(room.id, notice);

      const devices = this.devicesByRoomId[room.id] ?? [];
      for (const device of devices) {
        if (device.isBroken) {
          this.renderer.setDeviceStatus(room.id, device.deviceId, 'BROKEN');
        }
      }
    }

    if (this.viewMode === 'FLOOR_3D') {
      const configs = this.getFloorCutawayRoomConfigs(this.activeFloorIndex);
      const r = this.renderer as {
        renderFloorCutaway?: (floorIndex: number, configs: FloorCutawayRoomConfig[]) => Promise<void>;
      };
      await r?.renderFloorCutaway?.(this.activeFloorIndex, configs);
    }
  }

  // === Local-First Landlord Authentication & Building Registration ===

  async loginLandlord(phoneOrEmail: string, pin: string): Promise<Landlord> {
    const identity = phoneOrEmail.trim().toLowerCase();
    const normalizedPin = pin.trim();
    if (!identity || !normalizedPin) {
      throw new Error('Vui lòng nhập đầy đủ Số điện thoại/Email và Mã PIN.');
    }

    const landlords = await this.database.landlords.toArray();
    const pool = landlords.length > 0 ? landlords : this.landlord ? [this.landlord] : [];
    const matched = pool.find(
      (l) => l.phone.trim().toLowerCase() === identity || l.email.trim().toLowerCase() === identity
    );
    if (!matched) {
      throw new Error('Không tìm thấy tài khoản Chủ trọ với SĐT hoặc Email này.');
    }

    const pins = readLandlordPins();
    const expectedPin =
      pins[matched.id] ??
      (matched.id === SEED_LANDLORD_ID || matched.phone === '0988123456'
        ? DEFAULT_SEED_PIN
        : undefined);

    if (!expectedPin || expectedPin !== normalizedPin) {
      throw new Error('Mã PIN không chính xác. Vui lòng kiểm tra lại.');
    }

    this.landlord = matched;
    this.authenticatedLandlordId = matched.id;
    writeStorageItem(
      AUTH_SESSION_STORAGE_KEY,
      JSON.stringify({ landlordId: matched.id, loggedInAt: new Date().toISOString() })
    );
    return matched;
  }

  async loginDemoLandlord(): Promise<Landlord> {
    return this.loginLandlord('0988123456', DEFAULT_SEED_PIN);
  }

  async registerLandlord(input: RegisterLandlordInput): Promise<Landlord> {
    const name = input.name.trim();
    const phone = input.phone.trim();
    const pin = input.pin.trim();

    if (name.length < 2) {
      throw new Error('Họ tên chủ trọ phải có ít nhất 2 ký tự.');
    }
    if (!/^0\d{9}$/.test(phone)) {
      throw new Error('Số điện thoại phải gồm 10 chữ số và bắt đầu bằng 0.');
    }
    if (pin.length < 4 || pin.length > 8) {
      throw new Error('Mã PIN phải có từ 4 đến 8 ký tự.');
    }

    const existingLandlords = await this.database.landlords.toArray();
    if (existingLandlords.some((l) => l.phone.trim() === phone)) {
      throw new Error('Số điện thoại này đã được đăng ký.');
    }

    const now = new Date().toISOString();
    const newLandlord: Landlord = {
      id: generateUUID(),
      name,
      phone,
      email: input.email?.trim() || `${phone}@qlnt.local`,
      reputation_stars: 5.0,
      package_tier: input.packageTier ?? 'FREE',
      created_at: now,
      updated_at: now,
    };

    await this.database.landlords.put(newLandlord);

    const pins = readLandlordPins();
    pins[newLandlord.id] = pin;
    writeLandlordPins(pins);

    this.landlord = newLandlord;
    this.authenticatedLandlordId = newLandlord.id;
    writeStorageItem(
      AUTH_SESSION_STORAGE_KEY,
      JSON.stringify({ landlordId: newLandlord.id, loggedInAt: now })
    );

    return newLandlord;
  }

  logoutLandlord(): void {
    this.authenticatedLandlordId = null;
    removeStorageItem(AUTH_SESSION_STORAGE_KEY);
  }

  buildRoomSetupDrafts(params: {
    totalFloors: number;
    roomsPerFloor: number;
    defaultAreaSqm: number;
    defaultBasePrice: number;
  }): RoomSetupDraft[] {
    const totalFloors = Math.max(1, Math.min(6, Math.round(params.totalFloors)));
    const roomsPerFloor = Math.max(1, Math.min(8, Math.round(params.roomsPerFloor)));
    const areaSqm = Math.max(10, Math.min(150, params.defaultAreaSqm));
    const basePrice = Math.max(0, Math.round(params.defaultBasePrice));

    const existingByNumber = new Map(this.rooms.map((r) => [r.room_number, r]));
    const drafts: RoomSetupDraft[] = [];

    for (let floor = 1; floor <= totalFloors; floor += 1) {
      for (let idx = 1; idx <= roomsPerFloor; idx += 1) {
        const roomNumber = `P${floor}${String(idx).padStart(2, '0')}`;
        const existing = existingByNumber.get(roomNumber);
        drafts.push({
          roomNumber,
          floorNumber: floor,
          areaSqm,
          basePrice,
          depositAmount: existing?.deposit_amount ?? basePrice,
          status: existing?.status ?? 'EMPTY',
        });
      }
    }

    return drafts;
  }

  async registerOrUpdateBuilding(input: BuildingRegistrationInput): Promise<Property> {
    const propertyName = input.propertyName.trim();
    if (!propertyName) {
      throw new Error('Tên tòa nhà không được để trống.');
    }
    if (input.totalFloors < 1 || input.totalFloors > 6) {
      throw new Error('Số tầng phải nằm trong khoảng từ 1 đến 6.');
    }
    if (input.roomsPerFloor < 1 || input.roomsPerFloor > 8) {
      throw new Error('Số phòng mỗi tầng phải nằm trong khoảng từ 1 đến 8.');
    }
    if (input.roomsDraft.length === 0) {
      throw new Error('Danh sách phòng đăng ký không được để trống.');
    }
    for (const draft of input.roomsDraft) {
      if (draft.areaSqm < 10 || draft.areaSqm > 150) {
        throw new Error(`Diện tích phòng ${draft.roomNumber} phải từ 10 đến 150 m².`);
      }
    }

    const now = new Date().toISOString();
    const landlordId = this.landlord?.id ?? this.property?.landlord_id ?? SEED_LANDLORD_ID;
    const propertyId = this.property?.id ?? generateUUID();

    const updatedProperty: Property = {
      id: propertyId,
      landlord_id: landlordId,
      name: propertyName,
      address: input.address.trim() || 'Hà Nội',
      total_floors: input.totalFloors,
      coordinates_3d: this.property?.coordinates_3d ?? { x: 0, y: 0, z: 0 },
      is_public_on_map: this.property?.is_public_on_map ?? true,
      water_calc_method: input.waterCalcMethod,
      water_unit_price: input.waterUnitPrice,
      electric_unit_price: input.electricUnitPrice,
      service_fee: input.serviceFee,
      created_at: this.property?.created_at ?? now,
      updated_at: now,
    };

    const existingByNumber = new Map(this.rooms.map((r) => [r.room_number, r]));
    const nextRooms: Room[] = input.roomsDraft.map((draft) => {
      const existing = existingByNumber.get(draft.roomNumber);
      return {
        id: existing?.id ?? generateUUID(),
        landlord_id: landlordId,
        property_id: propertyId,
        floor_number: draft.floorNumber,
        room_number: draft.roomNumber,
        area_sqm: draft.areaSqm,
        base_price: draft.basePrice,
        deposit_amount: draft.depositAmount ?? existing?.deposit_amount ?? draft.basePrice,
        status: draft.status ?? existing?.status ?? 'EMPTY',
        created_at: existing?.created_at ?? now,
        updated_at: now,
      };
    });

    const nextRoomIds = new Set(nextRooms.map((r) => r.id));
    const removedRoomIds = this.rooms
      .filter((r) => r.property_id === propertyId && !nextRoomIds.has(r.id))
      .map((r) => r.id);

    await this.database.transaction(
      'rw',
      this.database.properties,
      this.database.rooms,
      async () => {
        await this.database.properties.put(updatedProperty);
        if (removedRoomIds.length > 0) {
          await this.database.rooms.bulkDelete(removedRoomIds);
        }
        await this.database.rooms.bulkPut(nextRooms);
      }
    );

    this.property = updatedProperty;
    this.rooms = nextRooms.sort((a, b) => a.room_number.localeCompare(b.room_number));

    const nextDevicesByRoomId: Record<string, RoomDeviceDTO[]> = {};
    for (const room of this.rooms) {
      nextDevicesByRoomId[room.id] =
        this.devicesByRoomId[room.id] ?? buildStandardRoomDevices(room.id);
    }
    this.devicesByRoomId = nextDevicesByRoomId;

    const totalAreaSqm = Math.round(this.rooms.reduce((sum, r) => sum + r.area_sqm, 0) * 10) / 10;
    const anchorRoom = this.rooms[0];
    if (anchorRoom) {
      const auditLog = await recordRoomAuditLog(
        {
          landlord_id: landlordId,
          room_id: anchorRoom.id,
          actor_id: landlordId,
          actor_role: 'LANDLORD',
          action_type: 'IN_PLACE_EDIT',
          change_summary: `Cập nhật cấu hình tòa nhà: ${input.totalFloors} tầng, ${this.rooms.length} phòng, tổng diện tích ${totalAreaSqm} m²`,
          new_data: {
            propertyName: updatedProperty.name,
            totalFloors: input.totalFloors,
            roomsPerFloor: input.roomsPerFloor,
            totalRooms: this.rooms.length,
            totalAreaSqm,
          },
        },
        this.database
      );
      this.roomAuditLogs = [auditLog, ...this.roomAuditLogs];
    }

    const matchedPreset = BUILDING_BLOCK_PRESETS.find(
      (p) =>
        p.id !== 'CUSTOM' &&
        p.floors === input.totalFloors &&
        p.roomsPerFloor === input.roomsPerFloor
    );
    if (matchedPreset) {
      this.currentBlockPresetId = matchedPreset.id;
      this.currentBlockGrid = { cols: matchedPreset.cols, rows: matchedPreset.rows };
    } else {
      const cols = Math.ceil(input.roomsPerFloor / 2);
      const rows = Math.max(1, Math.ceil(input.roomsPerFloor / cols));
      this.currentBlockPresetId = 'CUSTOM';
      this.currentBlockGrid = { cols, rows };
    }
    writeStorageItem(BUILDING_BLOCK_PRESET_STORAGE_KEY, this.currentBlockPresetId);

    if (this.renderer) {
      await this.syncAllToRenderer();
    }

    return updatedProperty;
  }

  async applyBuildingBlockPreset(
    presetId: BuildingBlockPresetId | string,
    customConfig?: { cols: number; rows: number; floors: number }
  ): Promise<void> {
    if (!this.property) {
      throw new Error('Chưa khởi tạo dữ liệu tòa nhà.');
    }

    let cols: number;
    let rows: number;
    let floors: number;

    if (presetId === 'CUSTOM') {
      cols = Math.max(1, Math.min(8, customConfig?.cols ?? this.currentBlockGrid.cols));
      rows = Math.max(1, Math.min(8, customConfig?.rows ?? this.currentBlockGrid.rows));
      floors = Math.max(1, Math.min(6, customConfig?.floors ?? this.property.total_floors));
    } else {
      const preset = BUILDING_BLOCK_PRESETS.find((p) => p.id === presetId);
      if (!preset) {
        throw new Error(`Không tìm thấy cấu hình preset khối tòa nhà: ${presetId}`);
      }
      cols = preset.cols;
      rows = preset.rows;
      floors = preset.floors;
    }

    const roomsPerFloor = cols * rows;
    const now = new Date().toISOString();
    const landlordId = this.landlord?.id ?? this.property.landlord_id ?? SEED_LANDLORD_ID;
    const propertyId = this.property.id;

    const updatedProperty: Property = {
      ...this.property,
      total_floors: floors,
      updated_at: now,
    };

    const existingByNumber = new Map(this.rooms.map((r) => [r.room_number, r]));
    const targetRooms: Room[] = [];

    for (let floor = 1; floor <= floors; floor += 1) {
      for (let idx = 1; idx <= roomsPerFloor; idx += 1) {
        const roomNumber = `P${floor}${String(idx).padStart(2, '0')}`;
        const existing = existingByNumber.get(roomNumber);
        if (existing) {
          targetRooms.push({
            ...existing,
            floor_number: floor,
            updated_at: now,
          });
        } else {
          targetRooms.push({
            id: generateUUID(),
            landlord_id: landlordId,
            property_id: propertyId,
            floor_number: floor,
            room_number: roomNumber,
            area_sqm: 25,
            base_price: 4000000,
            deposit_amount: 4000000,
            status: 'EMPTY',
            created_at: now,
            updated_at: now,
          });
        }
      }
    }

    const targetRoomIds = new Set(targetRooms.map((r) => r.id));
    const removedRoomIds = this.rooms
      .filter((r) => !targetRoomIds.has(r.id))
      .map((r) => r.id);

    await this.database.transaction(
      'rw',
      this.database.properties,
      this.database.rooms,
      async () => {
        await this.database.properties.put(updatedProperty);
        if (removedRoomIds.length > 0) {
          await this.database.rooms.bulkDelete(removedRoomIds);
        }
        await this.database.rooms.bulkPut(targetRooms);
      }
    );

    this.property = updatedProperty;
    this.rooms = targetRooms.sort((a, b) => a.room_number.localeCompare(b.room_number));
    this.currentBlockPresetId = presetId as BuildingBlockPresetId;
    this.currentBlockGrid = { cols, rows };
    writeStorageItem(BUILDING_BLOCK_PRESET_STORAGE_KEY, presetId);

    const nextDevicesByRoomId: Record<string, RoomDeviceDTO[]> = {};
    for (const room of this.rooms) {
      nextDevicesByRoomId[room.id] =
        this.devicesByRoomId[room.id] ?? buildStandardRoomDevices(room.id);
    }
    this.devicesByRoomId = nextDevicesByRoomId;

    if (this.activeFloorIndex >= floors) {
      this.activeFloorIndex = Math.max(0, floors - 1);
    }
    const storeFloor = useLedgerStore.getState().currentFloor;
    if (storeFloor > floors) {
      useLedgerStore.getState().flipFloor(floors);
    }

    const totalAreaSqm = Math.round(this.rooms.reduce((sum, r) => sum + r.area_sqm, 0) * 10) / 10;
    const anchorRoom = this.rooms[0];
    if (anchorRoom) {
      const auditLog = await recordRoomAuditLog(
        {
          landlord_id: landlordId,
          room_id: anchorRoom.id,
          actor_id: landlordId,
          actor_role: 'LANDLORD',
          action_type: 'IN_PLACE_EDIT',
          change_summary: `Áp dụng khối toà nhà ${presetId}: ${cols}x${rows}x${floors} (${this.rooms.length} phòng, ${floors} tầng)`,
          new_data: {
            presetId,
            cols,
            rows,
            floors,
            roomsPerFloor,
            totalRooms: this.rooms.length,
            totalAreaSqm,
          },
        },
        this.database
      );
      this.roomAuditLogs = [auditLog, ...this.roomAuditLogs];
    }

    if (this.renderer) {
      await this.syncAllToRenderer();
    }
  }

  getRoomNoticeType(roomId: string): RoomNoticeType {
    const billing = this.getLatestBillingForRoom(roomId);
    if (!billing) return 'NONE';
    if (billing.status === 'PENDING_APPROVAL') return 'BILL_PENDING';
    if (billing.status === 'UNPAID') return 'PAYMENT_DUE';
    return 'NONE';
  }

  getLatestBillingForRoom(roomId: string): Billing | undefined {
    const roomBillings = this.billings
      .filter((b) => b.room_id === roomId)
      .sort((a, b) => b.month_period.localeCompare(a.month_period));
    return roomBillings[0];
  }

  getLatestReadingForRoom(roomId: string): MeterReading | undefined {
    const readings = this.meterReadings
      .filter((r) => r.room_id === roomId)
      .sort((a, b) => b.month_period.localeCompare(a.month_period));
    return readings[0];
  }

  getRepresentativeTenant(roomId: string): Tenant | undefined {
    return (
      this.tenants.find((t) => t.room_id === roomId && t.role === 'REPRESENTATIVE') ??
      this.tenants.find((t) => t.room_id === roomId)
    );
  }

  getTenantRewardPoints(roomId: string): number {
    return this.getRepresentativeTenant(roomId)?.reward_points ?? 0;
  }

  getRoomAuditLogs(roomId: string): RoomAuditLog[] {
    return this.roomAuditLogs
      .filter((log) => log.room_id === roomId)
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
  }

  getPreviewState(roomId: string): BillingPreviewState | null {
    return this.previewByRoomId[roomId] ?? null;
  }

  clearPreview(roomId: string): void {
    delete this.previewByRoomId[roomId];
  }

  getFloorMapDTO(floorNumber: number): FloorMapDTO {
    const floorRooms = this.rooms
      .filter((r) => r.floor_number === floorNumber)
      .sort((a, b) => a.room_number.localeCompare(b.room_number));

    const roomsDto: FloorMapRoomDTO[] = floorRooms.map((room) => {
      const tenant = this.getRepresentativeTenant(room.id);
      const notice = this.getRoomNoticeType(room.id);
      const devices = this.devicesByRoomId[room.id] ?? [];
      return {
        roomId: room.id,
        roomNumber: room.room_number,
        status: room.status,
        tenantName: tenant?.full_name,
        hasPaymentNotice: notice !== 'NONE',
        hasBrokenDevice: devices.some((d) => d.isBroken),
      };
    });

    return {
      propertyId: this.property?.id ?? '',
      floorNumber,
      rooms: roomsDto,
    };
  }

  getRoomDetailDTO(roomId: string): RoomDetailDTO | null {
    const room = this.rooms.find((r) => r.id === roomId);
    if (!room) return null;

    const tenant = this.getRepresentativeTenant(roomId);
    const billing = this.getLatestBillingForRoom(roomId);
    const reading = this.getLatestReadingForRoom(roomId);
    const devices = (this.devicesByRoomId[roomId] ?? []).map((d) => ({ ...d }));

    return {
      roomId: room.id,
      roomNumber: room.room_number,
      floorNumber: room.floor_number,
      basePrice: room.base_price,
      areaSqm: room.area_sqm,
      status: room.status,
      currentTenant: tenant
        ? {
            tenantId: tenant.id,
            fullName: tenant.full_name,
            phone: tenant.phone ?? '',
            hometown: tenant.hometown,
            tempResidenceStatus: tenant.temp_residence_status,
          }
        : undefined,
      latestBilling: billing
        ? {
            billingId: billing.id,
            monthPeriod: billing.month_period,
            roomCharge: billing.room_charge,
            electricCharge: billing.electric_charge,
            waterCharge: billing.water_charge,
            serviceCharge: billing.service_charge,
            totalAmount: billing.total_amount,
            status: billing.status,
            billImageUrl: billing.bill_image_url,
          }
        : undefined,
      latestReading: reading
        ? {
            oldElectric: reading.old_electric,
            newElectric: reading.new_electric,
            oldWater: reading.old_water,
            newWater: reading.new_water,
          }
        : undefined,
      devices,
    };
  }

  getSummaryStats(): RoomSummarySnapshot {
    let occupiedCount = 0;
    let paymentDueCount = 0;
    let pendingVerifyCount = 0;
    let brokenDeviceCount = 0;
    let vacantCount = 0;
    let totalAreaRaw = 0;

    for (const room of this.rooms) {
      if (room.status === 'RENTED') occupiedCount += 1;
      if (room.status === 'EMPTY') vacantCount += 1;
      totalAreaRaw += room.area_sqm;

      const notice = this.getRoomNoticeType(room.id);
      if (notice === 'PAYMENT_DUE') paymentDueCount += 1;
      if (notice === 'BILL_PENDING') pendingVerifyCount += 1;

      const hasBroken = (this.devicesByRoomId[room.id] ?? []).some((d) => d.isBroken);
      if (hasBroken) brokenDeviceCount += 1;
    }

    const totalAreaSqm = Math.round(totalAreaRaw * 10) / 10;
    const averageAreaSqm =
      this.rooms.length > 0 ? Math.round((totalAreaSqm / this.rooms.length) * 10) / 10 : 0;

    return {
      totalRooms: this.rooms.length,
      occupiedCount,
      paymentDueCount,
      pendingVerifyCount,
      brokenDeviceCount,
      vacantCount,
      totalAreaSqm,
      averageAreaSqm,
    };
  }

  getRoomsWithNotices(): RoomQuickPickItem[] {
    return this.rooms.map((room) => {
      const tenant = this.getRepresentativeTenant(room.id);
      const billing = this.getLatestBillingForRoom(room.id);
      const noticeType = this.getRoomNoticeType(room.id);
      const hasBrokenDevice = (this.devicesByRoomId[room.id] ?? []).some((d) => d.isBroken);
      return {
        room,
        tenantName: tenant?.full_name,
        noticeType,
        hasBrokenDevice,
        billingStatus: billing?.status,
      };
    });
  }

  // === Sổ F04 Navigation & 2-Level Close ===

  async openBookForFloor(floorNumber: number): Promise<FloorMapDTO> {
    const floorMap = this.getFloorMapDTO(floorNumber);
    const ledgerState = useLedgerStore.getState();
    if (!ledgerState.isBookOpen) {
      ledgerState.openLedgerBook(this.monthPeriod, floorNumber);
      await this.renderer?.openLedgerBook(this.monthPeriod, floorNumber, floorMap);
    } else {
      ledgerState.flipFloor(floorNumber);
      await this.renderer?.flipLedgerFloorPage(floorNumber, floorMap);
    }
    return floorMap;
  }

  async flipFloor(floorNumber: number): Promise<FloorMapDTO> {
    const floorMap = this.getFloorMapDTO(floorNumber);
    useLedgerStore.getState().flipFloor(floorNumber);
    await this.renderer?.flipLedgerFloorPage(floorNumber, floorMap);
    return floorMap;
  }

  async openRoomDetail(
    roomId: string,
    tab: RoomDetailTab = 'PAGE_1_BILLING'
  ): Promise<RoomDetailDTO> {
    const detail = this.getRoomDetailDTO(roomId);
    if (!detail) {
      throw new Error(`Không tìm thấy phòng với ID ${roomId}`);
    }
    const ledgerState = useLedgerStore.getState();
    if (!ledgerState.isBookOpen) {
      ledgerState.openLedgerBook(this.monthPeriod, detail.floorNumber);
    } else if (ledgerState.currentFloor !== detail.floorNumber) {
      ledgerState.flipFloor(detail.floorNumber);
    }
    ledgerState.openRoomDetail(roomId, tab);
    await this.renderer?.openRoomDetailSinglePage(roomId, tab, detail);
    return detail;
  }

  async switchRoomTab(roomId: string, tab: RoomDetailTab): Promise<RoomDetailDTO> {
    const detail = this.getRoomDetailDTO(roomId);
    if (!detail) {
      throw new Error(`Không tìm thấy phòng với ID ${roomId}`);
    }
    useLedgerStore.getState().switchTab(tab);
    await this.renderer?.switchRoomDetailPageTab(roomId, tab, detail);
    return detail;
  }

  async closeRoomDetailToFloorMap(): Promise<FloorMapDTO> {
    const currentFloor = useLedgerStore.getState().currentFloor;
    useLedgerStore.getState().closeRoomDetail();
    const floorMap = this.getFloorMapDTO(currentFloor);
    await this.renderer?.closeRoomDetailToFloorMap(floorMap);
    return floorMap;
  }

  async closeLedgerBookTo3DScene(): Promise<void> {
    useLedgerStore.getState().closeLedgerBook();
    await this.renderer?.closeLedgerBookTo3DScene();
  }

  // === 3D Floor Cutaway View & Navigation ===

  getFloorCutawayRoomConfigs(floorIndex: number): FloorCutawayRoomConfig[] {
    const floorNumber = floorIndex + 1;
    const floorRooms = this.rooms
      .filter((r) => r.floor_number === floorNumber)
      .sort((a, b) => a.room_number.localeCompare(b.room_number));

    return floorRooms.map((room, roomIndex) => {
      const tenant = this.getRepresentativeTenant(room.id);
      const billing = this.getLatestBillingForRoom(room.id);
      const reading = this.getLatestReadingForRoom(room.id);
      const noticeType = this.getRoomNoticeType(room.id);
      const devices = (this.devicesByRoomId[room.id] ?? []).map((d) => ({ ...d }));
      const hasBrokenDevice = devices.some((d) => d.isBroken);

      return {
        roomId: room.id,
        roomNumber: room.room_number,
        floorIndex,
        floorNumber: room.floor_number,
        roomIndex,
        status: room.status,
        areaSqm: room.area_sqm,
        basePrice: room.base_price,
        tenantName: tenant?.full_name,
        noticeType,
        hasPaymentNotice: noticeType !== 'NONE',
        hasPaymentDue: noticeType === 'PAYMENT_DUE',
        hasBrokenDevice,
        devices,
        currentTenant: tenant
          ? {
              tenantId: tenant.id,
              fullName: tenant.full_name,
              phone: tenant.phone ?? '',
              hometown: tenant.hometown,
              tempResidenceStatus: tenant.temp_residence_status,
            }
          : undefined,
        latestBilling: billing
          ? {
              billingId: billing.id,
              monthPeriod: billing.month_period,
              roomCharge: billing.room_charge,
              electricCharge: billing.electric_charge,
              waterCharge: billing.water_charge,
              serviceCharge: billing.service_charge,
              totalAmount: billing.total_amount,
              status: billing.status,
              billImageUrl: billing.bill_image_url,
            }
          : undefined,
        latestReading: reading
          ? {
              oldElectric: reading.old_electric,
              newElectric: reading.new_electric,
              oldWater: reading.old_water,
              newWater: reading.new_water,
            }
          : undefined,
      };
    });
  }

  async selectFloor(floorIndex: number): Promise<void> {
    const totalFloors = this.property?.total_floors ?? 3;
    const clampedIndex = Math.max(0, Math.min(totalFloors - 1, floorIndex));
    this.activeFloorIndex = clampedIndex;
    this.viewMode = 'FLOOR_3D';

    const configs = this.getFloorCutawayRoomConfigs(clampedIndex);

    const r = this.renderer as {
      transitionToFloor?: (floorIndex: number) => Promise<void>;
      renderFloorCutaway?: (floorIndex: number, configs: FloorCutawayRoomConfig[]) => Promise<void>;
    };

    if (r?.transitionToFloor) {
      await r.transitionToFloor(clampedIndex);
    }
    if (r?.renderFloorCutaway) {
      await r.renderFloorCutaway(clampedIndex, configs);
    }
  }

  async backToBuilding(): Promise<void> {
    this.viewMode = 'BUILDING';
    const r = this.renderer as {
      transitionToBuilding?: () => Promise<void>;
    };
    if (r?.transitionToBuilding) {
      await r.transitionToBuilding();
    }
  }

  async openRoomDetailFromFloor(
    roomId: string,
    tab?: RoomDetailTab
  ): Promise<void> {
    await this.openRoomDetail(roomId, tab ?? 'PAGE_1_BILLING');
  }

  // === Preview State vs Commit State (Page 1 Billing) ===

  previewRoomBilling(
    roomId: string,
    newElectric: number,
    newWater: number
  ): BillingPreviewState {
    const room = this.rooms.find((r) => r.id === roomId);
    if (!room) {
      throw new Error(`Không tìm thấy phòng với ID ${roomId}`);
    }

    const reading = this.getLatestReadingForRoom(roomId);
    const existingBilling = this.getLatestBillingForRoom(roomId);
    const oldElectric = reading?.old_electric ?? 0;
    const oldWater = reading?.old_water ?? 0;
    const electricUnitPrice = this.property?.electric_unit_price ?? 3800;
    const waterUnitPrice = this.property?.water_unit_price ?? 30000;
    const waterCalcMethod = this.property?.water_calc_method ?? 'PER_M3';
    const serviceCharge = existingBilling?.service_charge ?? 150000;

    const calculation = calculateBilling({
      roomRent: room.base_price,
      oldElectric,
      newElectric,
      electricUnitPrice,
      waterCalcMethod,
      waterUnitPrice,
      oldWater,
      newWater,
      serviceCharge,
    });

    const preview: BillingPreviewState = {
      roomId,
      oldElectric,
      newElectric,
      oldWater,
      newWater,
      calculation,
    };

    this.previewByRoomId[roomId] = preview;
    return preview;
  }

  async commitRoomBillingReading(
    roomId: string,
    newElectric: number,
    newWater: number
  ): Promise<RoomDetailDTO> {
    const room = this.rooms.find((r) => r.id === roomId);
    if (!room || !this.property) {
      throw new Error(`Không tìm thấy phòng với ID ${roomId}`);
    }

    const preview = this.previewRoomBilling(roomId, newElectric, newWater);
    const now = new Date().toISOString();
    const existingReading = this.getLatestReadingForRoom(roomId);
    const existingBilling = this.getLatestBillingForRoom(roomId);
    const landlordId = room.landlord_id;

    let updatedBilling: Billing;
    if (existingBilling) {
      updatedBilling = {
        ...existingBilling,
        room_charge: preview.calculation.roomCharge,
        electric_charge: preview.calculation.electricCharge,
        water_charge: preview.calculation.waterCharge,
        service_charge: preview.calculation.serviceCharge,
        total_amount: preview.calculation.totalAmount,
        status: 'UNPAID',
        updated_at: now,
      };
      await this.database.billings.put(updatedBilling);
      this.billings = this.billings.map((b) => (b.id === updatedBilling.id ? updatedBilling : b));
    } else {
      updatedBilling = {
        id: generateUUID(),
        landlord_id: landlordId,
        room_id: roomId,
        month_period: this.monthPeriod,
        room_charge: preview.calculation.roomCharge,
        electric_charge: preview.calculation.electricCharge,
        water_charge: preview.calculation.waterCharge,
        service_charge: preview.calculation.serviceCharge,
        vehicle_charge: 0,
        previous_debt: 0,
        total_amount: preview.calculation.totalAmount,
        status: 'UNPAID',
        created_at: now,
        updated_at: now,
      };
      await this.database.billings.add(updatedBilling);
      this.billings = [updatedBilling, ...this.billings];
    }

    if (existingReading) {
      const updatedReading: MeterReading = {
        ...existingReading,
        new_electric: newElectric,
        new_water: newWater,
        electric_consumed: preview.calculation.electricConsumed,
        water_consumed: preview.calculation.waterConsumed,
        recorded_at: now,
      };
      await this.database.meter_readings.put(updatedReading);
      this.meterReadings = this.meterReadings.map((r) =>
        r.id === updatedReading.id ? updatedReading : r
      );
    } else {
      const newReading: MeterReading = {
        id: generateUUID(),
        landlord_id: landlordId,
        room_id: roomId,
        billing_id: updatedBilling.id,
        month_period: this.monthPeriod,
        old_electric: preview.oldElectric,
        new_electric: newElectric,
        electric_consumed: preview.calculation.electricConsumed,
        old_water: preview.oldWater,
        new_water: newWater,
        water_consumed: preview.calculation.waterConsumed,
        recorded_by: 'LANDLORD',
        recorded_at: now,
      };
      await this.database.meter_readings.add(newReading);
      this.meterReadings = [newReading, ...this.meterReadings];
    }

    const auditLog = await recordRoomAuditLog(
      {
        landlord_id: landlordId,
        room_id: roomId,
        actor_id: landlordId,
        actor_role: 'LANDLORD',
        action_type: 'IN_PLACE_EDIT',
        change_summary: `Chốt chỉ số điện ${newElectric} kWh, nước ${newWater} m³ (${updatedBilling.total_amount.toLocaleString('vi-VN')} đ).`,
        old_data: existingReading
          ? {
              newElectric: existingReading.new_electric,
              newWater: existingReading.new_water,
            }
          : null,
        new_data: {
          newElectric,
          newWater,
          totalAmount: updatedBilling.total_amount,
        },
      },
      this.database
    );
    this.roomAuditLogs = [auditLog, ...this.roomAuditLogs];
    this.clearPreview(roomId);

    this.renderer?.setRoomNotice(roomId, 'PAYMENT_DUE');
    const detail = this.getRoomDetailDTO(roomId)!;
    this.renderer?.refreshRoomDetailView(roomId, detail);
    return detail;
  }

  async uploadLocalBillImage(roomId: string, dataUrl: string): Promise<RoomDetailDTO> {
    const billing = this.getLatestBillingForRoom(roomId);
    const room = this.rooms.find((r) => r.id === roomId);
    if (!billing || !room) {
      throw new Error(`Không có hóa đơn để tải ảnh bill cho phòng ${roomId}`);
    }

    const now = new Date().toISOString();
    const updatedBilling: Billing = {
      ...billing,
      bill_image_url: dataUrl,
      status: 'PENDING_APPROVAL',
      updated_at: now,
    };

    await this.database.billings.put(updatedBilling);
    this.billings = this.billings.map((b) => (b.id === billing.id ? updatedBilling : b));

    const tenant = this.getRepresentativeTenant(roomId);
    const auditLog = await recordRoomAuditLog(
      {
        landlord_id: room.landlord_id,
        room_id: roomId,
        actor_id: tenant?.id ?? room.landlord_id,
        actor_role: tenant ? 'TENANT' : 'LANDLORD',
        action_type: 'STATUS_CHANGE',
        change_summary: GAME_COPYWRITING.billPending(room.room_number),
        old_data: { status: billing.status },
        new_data: { status: 'PENDING_APPROVAL', hasBillImage: true },
      },
      this.database
    );
    this.roomAuditLogs = [auditLog, ...this.roomAuditLogs];

    this.renderer?.setRoomNotice(roomId, 'BILL_PENDING');
    const detail = this.getRoomDetailDTO(roomId)!;
    this.renderer?.refreshRoomDetailView(roomId, detail);
    return detail;
  }

  async approveRoomBillOneTouch(roomId: string): Promise<ApproveBillResult> {
    const billing = this.getLatestBillingForRoom(roomId);
    const room = this.rooms.find((r) => r.id === roomId);
    if (!billing || !room) {
      throw new Error(`Không có hóa đơn để duyệt cho phòng ${roomId}`);
    }

    const now = new Date().toISOString();
    const updatedBilling: Billing = {
      ...billing,
      status: 'PAID',
      updated_at: now,
    };

    const paymentRecord: PaymentRecord = {
      id: generateUUID(),
      landlord_id: room.landlord_id,
      billing_id: billing.id,
      room_id: roomId,
      amount_paid: billing.total_amount,
      payment_method: 'VIETQR_AUTO',
      payment_date: now,
      verified_by: room.landlord_id,
      note: 'Duyệt 1 chạm trên Sổ F04',
      created_at: now,
    };

    await this.database.transaction(
      'rw',
      this.database.billings,
      this.database.payment_records,
      async () => {
        await this.database.billings.put(updatedBilling);
        await this.database.payment_records.add(paymentRecord);
      }
    );

    this.billings = this.billings.map((b) => (b.id === billing.id ? updatedBilling : b));
    this.paymentRecords = [paymentRecord, ...this.paymentRecords];

    // Add +2 reward points to tenant & update landlord reputation via domain-core
    const reputationDelta = 2;
    let newRewardPoints = reputationDelta;
    const tenant = this.getRepresentativeTenant(roomId);
    if (tenant) {
      newRewardPoints = tenant.reward_points + reputationDelta;
      const updatedTenant: Tenant = {
        ...tenant,
        reward_points: newRewardPoints,
        updated_at: now,
      };
      await this.database.tenants.put(updatedTenant);
      this.tenants = this.tenants.map((t) => (t.id === tenant.id ? updatedTenant : t));
    }

    let newLandlordReputation = 5.0;
    if (this.landlord) {
      newLandlordReputation = calculateNewReputation(
        this.landlord.reputation_stars,
        'PROMPT_BILLING_VERIFY'
      );
      const updatedLandlord: Landlord = {
        ...this.landlord,
        reputation_stars: newLandlordReputation,
        updated_at: now,
      };
      await this.database.landlords.put(updatedLandlord);
      this.landlord = updatedLandlord;
    }

    const auditLog = await recordRoomAuditLog(
      {
        landlord_id: room.landlord_id,
        room_id: roomId,
        actor_id: room.landlord_id,
        actor_role: 'LANDLORD',
        action_type: 'PAYMENT_VERIFIED',
        change_summary: GAME_COPYWRITING.billPaid(room.room_number, reputationDelta),
        old_data: { status: billing.status },
        new_data: { status: 'PAID', reputationDelta, newRewardPoints },
      },
      this.database
    );
    this.roomAuditLogs = [auditLog, ...this.roomAuditLogs];

    this.renderer?.setRoomNotice(roomId, 'NONE');
    const detail = this.getRoomDetailDTO(roomId)!;
    this.renderer?.refreshRoomDetailView(roomId, detail);

    return {
      roomDetail: detail,
      reputationDelta,
      newRewardPoints,
      newLandlordReputation,
    };
  }

  // === Page 2: Device Broken & Maintenance Resolution ===

  async reportDeviceBroken(
    roomId: string,
    deviceId: string,
    issueDescription = 'Thiết bị gặp sự cố cần kiểm tra'
  ): Promise<RoomDetailDTO> {
    const room = this.rooms.find((r) => r.id === roomId);
    const devices = this.devicesByRoomId[roomId] ?? [];
    const targetDevice = devices.find((d) => d.deviceId === deviceId);
    if (!room || !targetDevice) {
      throw new Error(`Không tìm thấy thiết bị ${deviceId} tại phòng ${roomId}`);
    }

    const now = new Date().toISOString();
    this.devicesByRoomId[roomId] = devices.map((d) =>
      d.deviceId === deviceId ? { ...d, isBroken: true } : d
    );

    const tenant = this.getRepresentativeTenant(roomId);
    const request: MaintenanceRequest = {
      id: generateUUID(),
      landlord_id: room.landlord_id,
      room_id: roomId,
      tenant_id: tenant?.id,
      device_name: targetDevice.name,
      device_category: targetDevice.category,
      issue_description: issueDescription,
      status: 'PENDING_ALERT',
      reported_at: now,
      repair_cost: 0,
    };
    await this.database.maintenance_requests.add(request);
    this.maintenanceRequests = [request, ...this.maintenanceRequests];

    const auditLog = await recordRoomAuditLog(
      {
        landlord_id: room.landlord_id,
        room_id: roomId,
        actor_id: tenant?.id ?? room.landlord_id,
        actor_role: tenant ? 'TENANT' : 'LANDLORD',
        action_type: 'DEVICE_STATUS',
        change_summary: GAME_COPYWRITING.deviceBroken(room.room_number, targetDevice.name),
        old_data: { deviceId, isBroken: false },
        new_data: { deviceId, isBroken: true },
      },
      this.database
    );
    this.roomAuditLogs = [auditLog, ...this.roomAuditLogs];

    this.renderer?.setDeviceStatus(roomId, deviceId, 'BROKEN');
    const detail = this.getRoomDetailDTO(roomId)!;
    this.renderer?.refreshRoomDetailView(roomId, detail);
    return detail;
  }

  async resolveDeviceMaintenance(roomId: string, deviceId: string): Promise<RoomDetailDTO> {
    const room = this.rooms.find((r) => r.id === roomId);
    const devices = this.devicesByRoomId[roomId] ?? [];
    const targetDevice = devices.find((d) => d.deviceId === deviceId);
    if (!room || !targetDevice) {
      throw new Error(`Không tìm thấy thiết bị ${deviceId} tại phòng ${roomId}`);
    }

    const now = new Date().toISOString();
    const today = now.slice(0, 10);
    this.devicesByRoomId[roomId] = devices.map((d) =>
      d.deviceId === deviceId ? { ...d, isBroken: false, lastMaintained: today } : d
    );

    const openRequests = this.maintenanceRequests.filter(
      (m) => m.room_id === roomId && m.device_name === targetDevice.name && m.status !== 'RESOLVED'
    );
    for (const req of openRequests) {
      const updatedReq: MaintenanceRequest = {
        ...req,
        status: 'RESOLVED',
        resolved_at: now,
        resolved_by: room.landlord_id,
      };
      await this.database.maintenance_requests.put(updatedReq);
      this.maintenanceRequests = this.maintenanceRequests.map((m) =>
        m.id === req.id ? updatedReq : m
      );
    }

    const auditLog = await recordRoomAuditLog(
      {
        landlord_id: room.landlord_id,
        room_id: roomId,
        actor_id: room.landlord_id,
        actor_role: 'LANDLORD',
        action_type: 'DEVICE_STATUS',
        change_summary: GAME_COPYWRITING.maintenanceResolved(room.room_number, targetDevice.name),
        old_data: { deviceId, isBroken: true },
        new_data: { deviceId, isBroken: false, resolvedAt: today },
      },
      this.database
    );
    this.roomAuditLogs = [auditLog, ...this.roomAuditLogs];

    this.renderer?.setDeviceStatus(roomId, deviceId, 'NORMAL');
    const detail = this.getRoomDetailDTO(roomId)!;
    this.renderer?.refreshRoomDetailView(roomId, detail);
    return detail;
  }
}
