import React, { useEffect, useMemo, useState } from 'react';
import { MIN_TOUCH_TARGET_SIZE } from '@qlnt/renderer-2d';
import type { Property, Room } from '@qlnt/shared-types';
import {
  BUILDING_AREA_PRESETS,
  type BuildingRegistrationInput,
  type RoomSetupDraft,
} from '../bridge/ledgerController';

export interface BuildingShapePreset {
  id: 'TOWER_2x2x6' | 'CCMN_3x2x4' | 'CUBE_3x3x3' | 'COMPACT_2x2x3' | 'LONG_4x2x2';
  label: string;
  sublabel: string;
  totalFloors: number;
  roomsPerFloor: number;
  cols: number;
  rows: number;
  totalRooms: number;
  description: string;
  icon: string;
}

export const BUILDING_SHAPE_PRESETS: readonly BuildingShapePreset[] = [
  {
    id: 'TOWER_2x2x6',
    label: 'Tháp 2x2x6',
    sublabel: '6 tầng · 4 phòng/tầng (24 phòng)',
    totalFloors: 6,
    roomsPerFloor: 4,
    cols: 2,
    rows: 2,
    totalRooms: 24,
    description: 'Tháp nhà ống cao tầng vươn cao',
    icon: '🏛️',
  },
  {
    id: 'CCMN_3x2x4',
    label: 'CCMN 3x2x4',
    sublabel: '4 tầng · 6 phòng/tầng (24 phòng)',
    totalFloors: 4,
    roomsPerFloor: 6,
    cols: 3,
    rows: 2,
    totalRooms: 24,
    description: 'Chung cư mini chữ nhật chuẩn',
    icon: '🏢',
  },
  {
    id: 'CUBE_3x3x3',
    label: 'Khối vuông 3x3x3',
    sublabel: '3 tầng · 9 phòng/tầng (27 phòng)',
    totalFloors: 3,
    roomsPerFloor: 9,
    cols: 3,
    rows: 3,
    totalRooms: 27,
    description: 'Khối vuông lập phương vững chãi',
    icon: '🧊',
  },
  {
    id: 'COMPACT_2x2x3',
    label: 'Nhà phố 2x2x3',
    sublabel: '3 tầng · 4 phòng/tầng (12 phòng)',
    totalFloors: 3,
    roomsPerFloor: 4,
    cols: 2,
    rows: 2,
    totalRooms: 12,
    description: 'Nhà phố 3 tầng nhỏ gọn (mặc định)',
    icon: '🏠',
  },
  {
    id: 'LONG_4x2x2',
    label: 'Dãy ngang 4x2x2',
    sublabel: '2 tầng · 8 phòng/tầng (16 phòng)',
    totalFloors: 2,
    roomsPerFloor: 8,
    cols: 4,
    rows: 2,
    totalRooms: 16,
    description: 'Dãy trọ ngang ven đô 2 tầng',
    icon: '🏘️',
  },
] as const;

export interface BuildingSetupModalProps {
  isOpen: boolean;
  property: Property | null;
  rooms: Room[];
  isMobileViewport?: boolean;
  onSaveBuilding: (input: BuildingRegistrationInput) => Promise<void>;
  onClose: () => void;
}

function clampInt(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, Math.round(value)));
}

function formatRoomNumber(floor: number, indexOnFloor: number): string {
  return `P${floor}${String(indexOnFloor).padStart(2, '0')}`;
}

function buildDrafts(
  totalFloors: number,
  roomsPerFloor: number,
  defaultAreaSqm: number,
  defaultBasePrice: number,
  previousDrafts: RoomSetupDraft[],
  existingRooms: Room[]
): RoomSetupDraft[] {
  const prevMap = new Map(previousDrafts.map((d) => [d.roomNumber, d]));
  const existingMap = new Map(existingRooms.map((r) => [r.room_number, r]));
  const result: RoomSetupDraft[] = [];

  for (let floor = 1; floor <= totalFloors; floor++) {
    for (let idx = 1; idx <= roomsPerFloor; idx++) {
      const roomNumber = formatRoomNumber(floor, idx);
      const fromPrev = prevMap.get(roomNumber);
      const fromExisting = existingMap.get(roomNumber);
      result.push({
        roomNumber,
        floorNumber: floor,
        areaSqm: fromPrev?.areaSqm ?? fromExisting?.area_sqm ?? defaultAreaSqm,
        basePrice: fromPrev?.basePrice ?? fromExisting?.base_price ?? defaultBasePrice,
        depositAmount:
          fromPrev?.depositAmount ??
          fromExisting?.deposit_amount ??
          (fromPrev?.basePrice ?? fromExisting?.base_price ?? defaultBasePrice),
        status: fromPrev?.status ?? fromExisting?.status ?? 'EMPTY',
      });
    }
  }
  return result;
}

function computeInitialRoomsPerFloor(property: Property | null, rooms: Room[]): number {
  if (!rooms.length) return 4;
  const floors = property?.total_floors ?? 3;
  let maxPerFloor = 1;
  for (let f = 1; f <= floors; f++) {
    const count = rooms.filter((r) => r.floor_number === f).length;
    if (count > maxPerFloor) maxPerFloor = count;
  }
  return clampInt(maxPerFloor, 1, 9);
}

export const BuildingSetupModal: React.FC<BuildingSetupModalProps> = ({
  isOpen,
  property,
  rooms,
  isMobileViewport = false,
  onSaveBuilding,
  onClose,
}) => {
  const initialFloors = clampInt(property?.total_floors ?? 3, 1, 6);
  const initialPerFloor = computeInitialRoomsPerFloor(property, rooms);
  const initialDefaultArea = rooms[0]?.area_sqm ?? 25;
  const initialDefaultPrice = rooms[0]?.base_price ?? 4000000;

  const [propertyName, setPropertyName] = useState(
    property?.name ?? 'Nhà trọ Hạnh Phúc — Cầu Giấy'
  );
  const [address, setAddress] = useState(
    property?.address ?? 'Ngõ 68 Cầu Giấy, Hà Nội'
  );
  const [totalFloors, setTotalFloors] = useState<number>(initialFloors);
  const [roomsPerFloor, setRoomsPerFloor] = useState<number>(initialPerFloor);
  const [defaultAreaSqm, setDefaultAreaSqm] = useState<number>(initialDefaultArea);
  const [defaultBasePrice, setDefaultBasePrice] = useState<number>(initialDefaultPrice);
  const [waterCalcMethod, setWaterCalcMethod] = useState<Property['water_calc_method']>(
    property?.water_calc_method ?? 'PER_M3'
  );
  const [electricUnitPrice, setElectricUnitPrice] = useState<number>(
    property?.electric_unit_price ?? 3800
  );
  const [waterUnitPrice, setWaterUnitPrice] = useState<number>(
    property?.water_unit_price ?? 30000
  );
  const [serviceFee, setServiceFee] = useState<number>(property?.service_fee ?? 150000);
  const [roomsDraft, setRoomsDraft] = useState<RoomSetupDraft[]>(() =>
    buildDrafts(
      initialFloors,
      initialPerFloor,
      initialDefaultArea,
      initialDefaultPrice,
      [],
      rooms
    )
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const floors = clampInt(property?.total_floors ?? 3, 1, 6);
    const perFloor = computeInitialRoomsPerFloor(property, rooms);
    const area = rooms[0]?.area_sqm ?? 25;
    const price = rooms[0]?.base_price ?? 4000000;

    setPropertyName(property?.name ?? 'Nhà trọ Hạnh Phúc — Cầu Giấy');
    setAddress(property?.address ?? 'Ngõ 68 Cầu Giấy, Hà Nội');
    setTotalFloors(floors);
    setRoomsPerFloor(perFloor);
    setDefaultAreaSqm(area);
    setDefaultBasePrice(price);
    setWaterCalcMethod(property?.water_calc_method ?? 'PER_M3');
    setElectricUnitPrice(property?.electric_unit_price ?? 3800);
    setWaterUnitPrice(property?.water_unit_price ?? 30000);
    setServiceFee(property?.service_fee ?? 150000);
    setRoomsDraft(buildDrafts(floors, perFloor, area, price, [], rooms));
    setErrorMessage(null);
  }, [isOpen, property, rooms]);

  const handleScaleChange = (nextFloors: number, nextPerFloor: number) => {
    const safeFloors = clampInt(nextFloors, 1, 6);
    const safePerFloor = clampInt(nextPerFloor, 1, 9);
    setTotalFloors(safeFloors);
    setRoomsPerFloor(safePerFloor);
    setRoomsDraft((prev) =>
      buildDrafts(safeFloors, safePerFloor, defaultAreaSqm, defaultBasePrice, prev, rooms)
    );
  };

  const applyBulkAreaAndPrice = (area: number, price: number) => {
    const safeArea = Math.max(10, Math.min(150, Number(area) || 20));
    const safePrice = Math.max(500000, Number(price) || 3000000);
    setDefaultAreaSqm(safeArea);
    setDefaultBasePrice(safePrice);
    setRoomsDraft((prev) =>
      prev.map((room) => ({
        ...room,
        areaSqm: safeArea,
        basePrice: safePrice,
        depositAmount: safePrice,
      }))
    );
  };

  const updateRoomDraft = (
    roomNumber: string,
    patch: Partial<Pick<RoomSetupDraft, 'areaSqm' | 'basePrice' | 'status'>>
  ) => {
    setRoomsDraft((prev) =>
      prev.map((room) => (room.roomNumber === roomNumber ? { ...room, ...patch } : room))
    );
  };

  const summary = useMemo(() => {
    const totalRooms = roomsDraft.length;
    const totalAreaSqm = roomsDraft.reduce((acc, r) => acc + (Number(r.areaSqm) || 0), 0);
    const averageAreaSqm = totalRooms > 0 ? Math.round((totalAreaSqm / totalRooms) * 10) / 10 : 0;
    const totalBaseRevenue = roomsDraft.reduce(
      (acc, r) => acc + (Number(r.basePrice) || 0),
      0
    );
    return {
      totalRooms,
      totalAreaSqm,
      averageAreaSqm,
      totalBaseRevenue,
    };
  }, [roomsDraft]);

  if (!isOpen) {
    return null;
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMessage(null);

    if (!propertyName.trim()) {
      setErrorMessage('Vui lòng nhập Tên tòa nhà.');
      return;
    }

    setIsSaving(true);
    try {
      await onSaveBuilding({
        propertyName: propertyName.trim(),
        address: address.trim() || 'Hà Nội',
        totalFloors,
        roomsPerFloor,
        waterCalcMethod,
        electricUnitPrice: Number(electricUnitPrice) || 3800,
        waterUnitPrice: Number(waterUnitPrice) || 30000,
        serviceFee: Number(serviceFee) || 150000,
        roomsDraft,
      });
      onClose();
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Không thể lưu cấu hình tòa nhà.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const floorNumbers = Array.from({ length: totalFloors }, (_, idx) => idx + 1);

  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-stone-950/80 backdrop-blur-sm p-2 md:p-4 overflow-y-auto"
      style={{ zIndex: 35 }}
      data-testid="building-setup-modal"
      role="dialog"
      aria-modal="true"
      aria-label="Đăng ký Diện tích và Số phòng Tòa nhà"
    >
      <form
        onSubmit={(e) => void handleSubmit(e)}
        className={`w-full my-auto rounded-2xl bg-amber-50 border-2 border-amber-900/40 shadow-2xl text-stone-900 overflow-hidden flex flex-col max-h-[92vh] ${
          isMobileViewport ? 'max-w-[378px]' : 'max-w-4xl'
        }`}
      >
        {/* Header */}
        <div className="bg-stone-900 text-amber-100 px-4 py-3 border-b border-amber-800/60 flex items-center justify-between gap-2 shrink-0">
          <div>
            <p className="text-[11px] uppercase tracking-wider font-bold text-amber-400">
              Cấu hình Quy mô & Diện tích Tòa nhà
            </p>
            <h2 className="text-sm md:text-base font-extrabold text-amber-100">
              Đăng ký Diện tích (m²) & Số phòng
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ minHeight: `${MIN_TOUCH_TARGET_SIZE}px` }}
            className="px-3 py-2 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-bold border border-stone-600 transition-colors"
            data-testid="btn-close-building-setup"
          >
            Đóng
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-4">
          {errorMessage && (
            <div
              className="rounded-lg bg-red-100 border border-red-300 px-3 py-2 text-xs font-semibold text-red-800"
              data-testid="building-setup-error"
            >
              {errorMessage}
            </div>
          )}

          {/* Section 1: Building Info & Scale */}
          <div className="bg-white rounded-xl border border-stone-200 p-3 space-y-3">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-amber-900">
              1. Thông tin Tòa nhà & Quy mô Tầng / Phòng
            </h3>

            <div
              className={`grid gap-2.5 ${
                isMobileViewport ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'
              }`}
            >
              <label className="text-xs font-bold text-stone-700 flex flex-col gap-1">
                <span>Tên tòa nhà *</span>
                <input
                  type="text"
                  value={propertyName}
                  onChange={(e) => setPropertyName(e.target.value)}
                  required
                  className="rounded-lg border border-stone-300 px-2.5 py-2 text-sm font-semibold text-stone-900"
                  data-testid="input-building-name"
                />
              </label>

              <label className="text-xs font-bold text-stone-700 flex flex-col gap-1">
                <span>Địa chỉ tòa nhà</span>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="rounded-lg border border-stone-300 px-2.5 py-2 text-sm font-semibold text-stone-900"
                  data-testid="input-building-address"
                />
              </label>
            </div>

            {/* Mẫu Khối Kiến Trúc Toà Nhà 3D Presets */}
            <div className="pt-1 border-t border-stone-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-stone-700">
                  Mẫu hình khối toà nhà 3D (Preset Catalog)
                </span>
                <span className="text-[11px] text-amber-800 font-semibold">
                  Click để tự động điền số tầng &amp; số phòng
                </span>
              </div>
              <div
                className={`grid gap-2 ${
                  isMobileViewport ? 'grid-cols-1' : 'grid-cols-2 md:grid-cols-3'
                }`}
                data-testid="building-shape-presets-grid"
              >
                {BUILDING_SHAPE_PRESETS.map((preset) => {
                  const isSelected =
                    totalFloors === preset.totalFloors && roomsPerFloor === preset.roomsPerFloor;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleScaleChange(preset.totalFloors, preset.roomsPerFloor)}
                      style={{ minHeight: `${MIN_TOUCH_TARGET_SIZE}px` }}
                      className={`rounded-xl border p-2.5 text-left transition-all ${
                        isSelected
                          ? 'bg-amber-100 border-amber-600 text-amber-950 ring-2 ring-amber-400 font-bold'
                          : 'bg-stone-50 hover:bg-amber-50 border-stone-300 text-stone-800'
                      }`}
                      data-testid={`building-preset-card-${preset.id}`}
                      data-preset-id={preset.id}
                      data-selected={isSelected ? 'true' : 'false'}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-extrabold flex items-center gap-1">
                          <span>{preset.icon}</span>
                          <span>{preset.label}</span>
                        </span>
                        {isSelected && (
                          <span className="text-[10px] bg-amber-600 text-white font-bold px-1.5 py-0.5 rounded">
                            Đang chọn
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-stone-600 mt-1">{preset.sublabel}</div>
                      <div className="text-[10px] text-stone-500 italic mt-0.5">
                        {preset.description}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div
              className={`grid gap-2.5 ${
                isMobileViewport ? 'grid-cols-2' : 'grid-cols-2 md:grid-cols-4'
              }`}
            >
              <label className="text-xs font-bold text-stone-700 flex flex-col gap-1">
                <span>Số tầng (1–6)</span>
                <input
                  type="number"
                  min={1}
                  max={6}
                  value={totalFloors}
                  onChange={(e) =>
                    handleScaleChange(Number(e.target.value), roomsPerFloor)
                  }
                  className="rounded-lg border border-stone-300 px-2.5 py-2 text-sm font-bold text-stone-900"
                  data-testid="input-total-floors"
                />
              </label>

              <label className="text-xs font-bold text-stone-700 flex flex-col gap-1">
                <span>Số phòng/tầng (1–9)</span>
                <input
                  type="number"
                  min={1}
                  max={9}
                  value={roomsPerFloor}
                  onChange={(e) =>
                    handleScaleChange(totalFloors, Number(e.target.value))
                  }
                  className="rounded-lg border border-stone-300 px-2.5 py-2 text-sm font-bold text-stone-900"
                  data-testid="input-rooms-per-floor"
                />
              </label>

              <label className="text-xs font-bold text-stone-700 flex flex-col gap-1">
                <span>Giá điện (đ/kWh)</span>
                <input
                  type="number"
                  min={0}
                  step={100}
                  value={electricUnitPrice}
                  onChange={(e) => setElectricUnitPrice(Number(e.target.value))}
                  className="rounded-lg border border-stone-300 px-2.5 py-2 text-sm font-semibold text-stone-900"
                  data-testid="input-electric-unit-price"
                />
              </label>

              <label className="text-xs font-bold text-stone-700 flex flex-col gap-1">
                <span>Giá nước (đ)</span>
                <input
                  type="number"
                  min={0}
                  step={1000}
                  value={waterUnitPrice}
                  onChange={(e) => setWaterUnitPrice(Number(e.target.value))}
                  className="rounded-lg border border-stone-300 px-2.5 py-2 text-sm font-semibold text-stone-900"
                  data-testid="input-water-unit-price"
                />
              </label>
            </div>

            <div
              className={`grid gap-2.5 ${
                isMobileViewport ? 'grid-cols-1' : 'grid-cols-2'
              }`}
            >
              <label className="text-xs font-bold text-stone-700 flex flex-col gap-1">
                <span>Cách tính nước</span>
                <select
                  value={waterCalcMethod}
                  onChange={(e) =>
                    setWaterCalcMethod(e.target.value as Property['water_calc_method'])
                  }
                  className="rounded-lg border border-stone-300 px-2.5 py-2 text-sm font-semibold text-stone-900 bg-white"
                  data-testid="select-water-calc-method"
                >
                  <option value="PER_M3">Theo khối (đ/m³)</option>
                  <option value="PER_PERSON">Theo đầu người (đ/người)</option>
                </select>
              </label>

              <label className="text-xs font-bold text-stone-700 flex flex-col gap-1">
                <span>Phí dịch vụ chung (đ/tháng)</span>
                <input
                  type="number"
                  min={0}
                  step={10000}
                  value={serviceFee}
                  onChange={(e) => setServiceFee(Number(e.target.value))}
                  className="rounded-lg border border-stone-300 px-2.5 py-2 text-sm font-semibold text-stone-900"
                  data-testid="input-service-fee"
                />
              </label>
            </div>
          </div>

          {/* Section 2: Area Presets & Bulk Apply */}
          <div className="bg-white rounded-xl border border-stone-200 p-3 space-y-3">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-amber-900">
              2. Mẫu Diện tích Chuẩn & Áp dụng Đồng loạt
            </h3>

            <div
              className={`grid gap-2 ${
                isMobileViewport ? 'grid-cols-1' : 'grid-cols-3'
              }`}
            >
              {BUILDING_AREA_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => applyBulkAreaAndPrice(preset.areaSqm, preset.basePrice)}
                  style={{ minHeight: `${MIN_TOUCH_TARGET_SIZE}px` }}
                  className={`rounded-xl border px-3 py-2 text-left transition-colors ${
                    defaultAreaSqm === preset.areaSqm
                      ? 'bg-amber-100 border-amber-600 text-amber-950'
                      : 'bg-stone-50 hover:bg-amber-50 border-stone-300 text-stone-800'
                  }`}
                  data-testid={`preset-btn-${preset.id}`}
                >
                  <div className="text-xs font-extrabold">{preset.label}</div>
                  <div className="text-[11px] text-stone-600">
                    {preset.basePrice.toLocaleString('vi-VN')} đ/tháng
                  </div>
                </button>
              ))}
            </div>

            <div
              className={`grid gap-2 items-end ${
                isMobileViewport ? 'grid-cols-1' : 'grid-cols-3'
              }`}
            >
              <label className="text-xs font-bold text-stone-700 flex flex-col gap-1">
                <span>Diện tích mặc định (m²)</span>
                <input
                  type="number"
                  min={10}
                  max={150}
                  value={defaultAreaSqm}
                  onChange={(e) => setDefaultAreaSqm(Number(e.target.value))}
                  className="rounded-lg border border-stone-300 px-2.5 py-2 text-sm font-bold text-stone-900"
                  data-testid="input-default-area-sqm"
                />
              </label>

              <label className="text-xs font-bold text-stone-700 flex flex-col gap-1">
                <span>Giá thuê mặc định (đ/tháng)</span>
                <input
                  type="number"
                  min={500000}
                  step={100000}
                  value={defaultBasePrice}
                  onChange={(e) => setDefaultBasePrice(Number(e.target.value))}
                  className="rounded-lg border border-stone-300 px-2.5 py-2 text-sm font-bold text-stone-900"
                  data-testid="input-default-base-price"
                />
              </label>

              <button
                type="button"
                onClick={() => applyBulkAreaAndPrice(defaultAreaSqm, defaultBasePrice)}
                style={{ minHeight: `${MIN_TOUCH_TARGET_SIZE}px` }}
                className="rounded-xl bg-stone-800 hover:bg-stone-700 text-amber-200 text-xs font-bold px-3 py-2 transition-colors"
                data-testid="btn-apply-bulk-area"
              >
                Áp dụng đồng loạt ({roomsDraft.length} phòng)
              </button>
            </div>
          </div>

          {/* Section 3: Per-Room Area & Price List */}
          <div className="bg-white rounded-xl border border-stone-200 p-3 space-y-3">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-amber-900">
              3. Tinh chỉnh Diện tích & Giá thuê Từng phòng
            </h3>

            <div className="space-y-3">
              {floorNumbers.map((floorNum) => {
                const floorRooms = roomsDraft.filter((r) => r.floorNumber === floorNum);
                return (
                  <div
                    key={floorNum}
                    className="rounded-lg border border-stone-200 bg-stone-50 p-2.5 space-y-2"
                  >
                    <div className="text-xs font-extrabold text-stone-700">
                      Tầng {floorNum} ({floorRooms.length} phòng)
                    </div>
                    <div
                      className={`grid gap-2 ${
                        isMobileViewport ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'
                      }`}
                    >
                      {floorRooms.map((room) => (
                        <div
                          key={room.roomNumber}
                          className="rounded-lg bg-white border border-stone-200 p-2 flex flex-wrap items-center gap-2"
                        >
                          <span className="font-extrabold text-xs text-amber-900 w-12 shrink-0">
                            {room.roomNumber}
                          </span>
                          <label className="flex-1 min-w-[78px] text-[11px] font-semibold text-stone-600 flex flex-col">
                            <span>DT (m²)</span>
                            <input
                              type="number"
                              min={10}
                              max={150}
                              value={room.areaSqm}
                              onChange={(e) =>
                                updateRoomDraft(room.roomNumber, {
                                  areaSqm: Number(e.target.value),
                                })
                              }
                              className="mt-0.5 rounded border border-stone-300 px-2 py-1 text-xs font-bold text-stone-900"
                              data-testid={`input-room-area-${room.roomNumber}`}
                            />
                          </label>
                          <label className="flex-[1.5] min-w-[104px] text-[11px] font-semibold text-stone-600 flex flex-col">
                            <span>Giá (đ)</span>
                            <input
                              type="number"
                              min={500000}
                              step={100000}
                              value={room.basePrice}
                              onChange={(e) =>
                                updateRoomDraft(room.roomNumber, {
                                  basePrice: Number(e.target.value),
                                })
                              }
                              className="mt-0.5 rounded border border-stone-300 px-2 py-1 text-xs font-bold text-stone-900"
                              data-testid={`input-room-price-${room.roomNumber}`}
                            />
                          </label>
                          <label className="flex-1 min-w-[92px] text-[11px] font-semibold text-stone-600 flex flex-col">
                            <span>Trạng thái</span>
                            <select
                              value={room.status ?? 'EMPTY'}
                              onChange={(e) =>
                                updateRoomDraft(room.roomNumber, {
                                  status: e.target.value as Room['status'],
                                })
                              }
                              className="mt-0.5 rounded border border-stone-300 px-1.5 py-1 text-xs font-semibold text-stone-900 bg-white"
                              data-testid={`select-room-status-${room.roomNumber}`}
                            >
                              <option value="EMPTY">Trống</option>
                              <option value="RENTED">Đang thuê</option>
                              <option value="MAINTENANCE">Bảo trì</option>
                            </select>
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Summary & Save Footer */}
        <div
          className="bg-amber-100 border-t border-amber-300 px-4 py-3 flex flex-wrap items-center justify-between gap-3 shrink-0"
          data-testid="building-setup-summary"
        >
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-bold text-stone-800">
            <span>{totalFloors} tầng</span>
            <span>{summary.totalRooms} phòng</span>
            <span className="text-amber-900">
              Tổng DT: {summary.totalAreaSqm} m² (TB {summary.averageAreaSqm} m²)
            </span>
            <span className="text-emerald-800">
              Dự kiến: {summary.totalBaseRevenue.toLocaleString('vi-VN')} đ/tháng
            </span>
          </div>

          <button
            type="submit"
            disabled={isSaving}
            style={{ minHeight: `${MIN_TOUCH_TARGET_SIZE}px` }}
            className="rounded-xl bg-amber-700 hover:bg-amber-600 disabled:opacity-60 text-white text-xs md:text-sm font-bold px-4 py-2.5 shadow transition-colors"
            data-testid="btn-save-building-setup"
          >
            {isSaving ? 'Đang lưu...' : 'Lưu & Dựng Tòa Nhà 3D/2D'}
          </button>
        </div>
      </form>
    </div>
  );
};
