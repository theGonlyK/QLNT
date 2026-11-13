import type React from 'react';
import type { FloorMapDTO, FloorMapRoomDTO } from '@qlnt/shared-types';

export type RoomDisplayStatus = 'EMPTY' | 'OCCUPIED' | 'PAYMENT_DUE' | 'BROKEN';

export type RoomBlueprintLayoutType = 'STANDARD_SINGLE' | 'MEZZANINE' | 'STUDIO_MINI';

export interface RoomLayoutProps {
  x?: number;
  y?: number;
  width: number;
  height: number;
  colors: RoomTileColors;
  useRough?: boolean;
  roughness?: number;
  seed?: number;
  className?: string;
}

export interface RoomBlueprintSVGProps {
  room: FloorMapRoomDTO;
  layoutType?: RoomBlueprintLayoutType;
  width?: number;
  height?: number;
  statusOverride?: RoomDisplayStatus;
  useRough?: boolean;
  roughness?: number;
  isSelected?: boolean;
  showNoticeBadge?: boolean;
  className?: string;
  onClick?: (room: FloorMapRoomDTO) => void;
}

export type NoticeBadgeType =
  | 'PAYMENT_DUE'
  | 'BROKEN'
  | 'warning'
  | 'error'
  | 'yellow'
  | 'red';

export interface RoomTileColors {
  readonly bg: string;
  readonly border: string;
  readonly text: string;
  readonly badge?: string;
}

export interface NoticeBadgeSVGProps extends React.SVGProps<SVGSVGElement> {
  type: NoticeBadgeType;
  size?: number;
  className?: string;
  pulse?: boolean;
  title?: string;
}

export interface RoomTileSVGProps {
  room: FloorMapRoomDTO;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  isSelected?: boolean;
  statusOverride?: RoomDisplayStatus;
  useRough?: boolean;
  roughness?: number;
  className?: string;
  onClick?: (room: FloorMapRoomDTO) => void;
}

export interface FloorMapRendererProps {
  floorMap: FloorMapDTO;
  selectedRoomId?: string;
  onRoomClick?: (room: FloorMapRoomDTO) => void;
  columns?: number;
  roomWidth?: number;
  roomHeight?: number;
  gap?: number;
  padding?: number;
  showControls?: boolean;
  minScale?: number;
  maxScale?: number;
  initialScale?: number;
  useRough?: boolean;
  roughness?: number;
  className?: string;
  style?: React.CSSProperties;
}
