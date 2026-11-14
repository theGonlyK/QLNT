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
  SEED_MONTH_PERIOD,
  seedDatabaseIfNeeded,
} from '../seed/hanoiMotelSeed';
import { GAME_COPYWRITING } from '../copywriting/gameCopywriting';

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
}

export interface RoomQuickPickItem {
  room: Room;
  tenantName?: string;
  noticeType: RoomNoticeType;
  hasBrokenDevice: boolean;
  billingStatus?: Billing['status'];
}

export class LedgerController {
  private readonly database: AppDatabase;
  private renderer: IGameRenderer | null;
  private monthPeriod: string;

  private landlord: Landlord | null = null;
  private property: Property | null = null;
  private rooms: Room[] = [];
  private tenants: Tenant[] = [];
  private meterReadings: MeterReading[] = [];
  private billings: Billing[] = [];
  private paymentRecords: PaymentRecord[] = [];
  private maintenanceRequests: MaintenanceRequest[] = [];
  private roomAuditLogs: RoomAuditLog[] = [];
  private devicesByRoomId: Record<string, RoomDeviceDTO[]> = {};
  private previewByRoomId: Record<string, BillingPreviewState> = {};
  private initialized = false;

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

    this.landlord = landlords[0] ?? seed.landlord;
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
      const baseDevices = (seed.devicesByRoomId[room.id] ?? []).map((d) => ({ ...d }));
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
    this.initialized = true;

    if (this.renderer) {
      await this.syncAllToRenderer();
    }
  }

  async syncAllToRenderer(): Promise<void> {
    if (!this.renderer || !this.property) return;

    await this.renderer.renderBuilding({
      propertyId: this.property.id,
      totalFloors: this.property.total_floors,
      roomsPerFloor: 4,
      position: { x: 0, y: 0, z: 0 },
    });

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

    for (const room of this.rooms) {
      if (room.status === 'RENTED') occupiedCount += 1;
      if (room.status === 'EMPTY') vacantCount += 1;

      const notice = this.getRoomNoticeType(room.id);
      if (notice === 'PAYMENT_DUE') paymentDueCount += 1;
      if (notice === 'BILL_PENDING') pendingVerifyCount += 1;

      const hasBroken = (this.devicesByRoomId[room.id] ?? []).some((d) => d.isBroken);
      if (hasBroken) brokenDeviceCount += 1;
    }

    return {
      totalRooms: this.rooms.length,
      occupiedCount,
      paymentDueCount,
      pendingVerifyCount,
      brokenDeviceCount,
      vacantCount,
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
