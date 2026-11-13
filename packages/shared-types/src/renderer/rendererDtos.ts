import { Vector3D } from './vector3d';
import { RoomStatus } from '../entities/room';
import { DeviceCategory } from '../entities/maintenanceRequest';

export interface AvatarSkinDTO {
  modelId: string;
  colorScheme?: string;
  accessories?: string[];
}

export interface BuildingRenderDTO {
  propertyId: string;
  totalFloors: number;
  roomsPerFloor: number;
  position: Vector3D;
  scale?: Vector3D;
}

export interface FloorMapRoomDTO {
  roomId: string;
  roomNumber: string;
  status: RoomStatus;
  tenantName?: string;
  hasPaymentNotice: boolean;
  hasBrokenDevice: boolean;
}

export interface FloorMapDTO {
  propertyId: string;
  floorNumber: number;
  rooms: FloorMapRoomDTO[];
}

export interface RoomDeviceDTO {
  deviceId: string;
  name: string;
  category: DeviceCategory;
  isBroken: boolean;
  lastMaintained?: string;
}

export interface RoomDetailDTO {
  roomId: string;
  roomNumber: string;
  floorNumber: number;
  basePrice: number;
  areaSqm: number;
  status: RoomStatus;
  currentTenant?: {
    tenantId: string;
    fullName: string;
    phone: string;
    hometown?: string;
    tempResidenceStatus: string;
  };
  latestBilling?: {
    billingId: string;
    monthPeriod: string;
    roomCharge: number;
    electricCharge: number;
    waterCharge: number;
    serviceCharge: number;
    totalAmount: number;
    status: string;
    billImageUrl?: string;
  };
  latestReading?: {
    oldElectric: number;
    newElectric: number;
    oldWater: number;
    newWater: number;
  };
  devices: RoomDeviceDTO[];
}
