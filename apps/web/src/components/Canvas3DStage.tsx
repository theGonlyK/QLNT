import React, { useEffect, useRef, useState } from 'react';
import type { IGameRenderer, RoomDetailTab } from '@qlnt/shared-types';
import { MIN_TOUCH_TARGET_SIZE } from '@qlnt/renderer-2d';
import { ThreeGameRenderer } from '@qlnt/renderer-3d';
import type { RoomQuickPickItem } from '../bridge/ledgerController';

export interface Canvas3DStageProps {
  roomsWithNotices: RoomQuickPickItem[];
  totalFloors?: number;
  viewMode?: 'BUILDING' | 'FLOOR_3D';
  activeFloorIndex?: number;
  currentBlockPresetId?: string;
  onSelectBlockPreset?: (presetId: string) => void;
  onAttachRenderer?: (renderer: IGameRenderer | null) => void;
  onSelectFloor: (floorNumber: number) => void;
  onSelectFloorCutaway?: (floorIndex: number) => void;
  onBackToBuilding?: () => void;
  onSelectRoom: (roomId: string, tab?: RoomDetailTab) => void;
  isMobileViewport?: boolean;
}

export interface BuildingBlockPresetItem {
  id: 'TOWER_2x2x6' | 'CCMN_3x2x4' | 'CUBE_3x3x3' | 'COMPACT_2x2x3' | 'LONG_4x2x2';
  name: string;
  label: string;
  details: string;
  icon: string;
}

export const BUILDING_BLOCK_PRESET_ITEMS: readonly BuildingBlockPresetItem[] = [
  {
    id: 'TOWER_2x2x6',
    name: 'Tháp 2x2x6',
    label: 'Tháp 2x2x6',
    details: '6 tầng · 4P/tầng (24 phòng)',
    icon: '🏛️',
  },
  {
    id: 'CCMN_3x2x4',
    name: 'CCMN 3x2x4',
    label: 'CCMN 3x2x4',
    details: '4 tầng · 6P/tầng · 24 phòng',
    icon: '🏢',
  },
  {
    id: 'CUBE_3x3x3',
    name: 'Khối vuông 3x3x3',
    label: 'Khối vuông 3x3x3',
    details: '3 tầng · 9P/tầng · 27 phòng',
    icon: '🧊',
  },
  {
    id: 'COMPACT_2x2x3',
    name: 'Nhà phố 2x2x3',
    label: 'Nhà phố 2x2x3',
    details: '3 tầng · 4P/tầng · 12 phòng',
    icon: '🏠',
  },
  {
    id: 'LONG_4x2x2',
    name: 'Dãy ngang 4x2x2',
    label: 'Dãy ngang 4x2x2',
    details: '2 tầng · 8P/tầng · 16 phòng',
    icon: '🏘️',
  },
] as const;

const ROOM_STATUS_LABELS: Record<string, string> = {
  RENTED: 'Đang thuê',
  EMPTY: 'Phòng trống',
  MAINTENANCE: 'Bảo trì',
};

export const Canvas3DStage: React.FC<Canvas3DStageProps> = ({
  roomsWithNotices,
  totalFloors = 3,
  viewMode = 'BUILDING',
  activeFloorIndex = 0,
  currentBlockPresetId,
  onSelectBlockPreset,
  onAttachRenderer,
  onSelectFloor,
  onSelectFloorCutaway,
  onBackToBuilding,
  onSelectRoom,
  isMobileViewport = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rendererRef = useRef<ThreeGameRenderer | null>(null);
  const dragStateRef = useRef<{
    isPointerDown: boolean;
    isDragging: boolean;
    startX: number;
    startY: number;
    lastX: number;
  }>({
    isPointerDown: false,
    isDragging: false,
    startX: 0,
    startY: 0,
    lastX: 0,
  });
  const [webglReady, setWebglReady] = useState(false);
  const [isDrawerCollapsed, setIsDrawerCollapsed] = useState(false);
  const [isPresetDropdownOpen, setIsPresetDropdownOpen] = useState(false);
  const [hoveredNoticeBadgeInfo, setHoveredNoticeBadgeInfo] = useState<{
    roomId: string;
    roomCode: string;
    noticeKind: 'PAYMENT' | 'DEVICE';
    x: number;
    y: number;
  } | null>(null);
  const [hoveredPlaqueInfo, setHoveredPlaqueInfo] = useState<{
    roomId: string;
    roomCode: string;
    x: number;
    y: number;
  } | null>(null);
  const [hoveredRoomInfo, setHoveredRoomInfo] = useState<{
    item: RoomQuickPickItem;
    x: number;
    y: number;
  } | null>(null);
  const [hoveredFloorInfo, setHoveredFloorInfo] = useState<{
    floorIndex: number;
    roomCount: number;
    totalArea: number;
    x: number;
    y: number;
  } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let renderer: ThreeGameRenderer | null = null;
    let rafId = 0;
    let disposed = false;

    try {
      const rect = canvas.getBoundingClientRect();
      const width = Math.max(320, Math.round(rect.width || 800));
      const height = Math.max(240, Math.round(rect.height || 520));

      renderer = new ThreeGameRenderer({
        canvas,
        width,
        height,
        frustumSize: 10,
      });

      rendererRef.current = renderer;
      (window as unknown as { __QLNT_RENDERER__?: ThreeGameRenderer }).__QLNT_RENDERER__ = renderer;
      onAttachRenderer?.(renderer);
      setWebglReady(true);

      let lastTime = performance.now();
      const tick = (now: number) => {
        if (disposed || !renderer) return;
        const delta = Math.min(0.1, (now - lastTime) / 1000);
        lastTime = now;
        renderer.update(delta);
        renderer.renderFrame();
        rafId = requestAnimationFrame(tick);
      };
      rafId = requestAnimationFrame(tick);
    } catch {
      // Fallback gracefully if WebGL context is unavailable
      setWebglReady(false);
    }

    return () => {
      disposed = true;
      if (rafId) cancelAnimationFrame(rafId);
      (window as unknown as { __QLNT_RENDERER__?: ThreeGameRenderer | null }).__QLNT_RENDERER__ = null;
      rendererRef.current = null;
      onAttachRenderer?.(null);
      renderer?.dispose();
    };
  }, [onAttachRenderer]);

  const findRoomByGrid = (floorIndex: number, roomIndex: number): RoomQuickPickItem | null => {
    const floorNumber = floorIndex + 1;
    const floorRooms = roomsWithNotices.filter((item) => item.room.floor_number === floorNumber);
    return floorRooms[roomIndex] ?? null;
  };

  const getNdcFromPointer = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return null;
    return {
      ndcX: ((clientX - rect.left) / rect.width) * 2 - 1,
      ndcY: -((clientY - rect.top) / rect.height) * 2 + 1,
      localX: clientX - rect.left,
      localY: clientY - rect.top,
    };
  };

  const handleCanvasPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    dragStateRef.current = {
      isPointerDown: true,
      isDragging: false,
      startX: e.clientX,
      startY: e.clientY,
      lastX: e.clientX,
    };
  };

  const handleCanvasPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const drag = dragStateRef.current;
    if (drag.isPointerDown) {
      const dist = Math.hypot(e.clientX - drag.startX, e.clientY - drag.startY);
      if (dist > 5) {
        drag.isDragging = true;
      }
      if (drag.isDragging) {
        const deltaX = e.clientX - drag.lastX;
        drag.lastX = e.clientX;
        rendererRef.current?.orbitCamera(deltaX * 0.01);
        if (viewMode === 'FLOOR_3D') {
          rendererRef.current?.setFloorHoveredRoom(null);
          rendererRef.current?.setFloorHoveredInfoPlaque(null);
        } else {
          rendererRef.current?.setHoveredFloor(null);
        }
        setHoveredNoticeBadgeInfo(null);
        setHoveredRoomInfo(null);
        setHoveredPlaqueInfo(null);
        setHoveredFloorInfo(null);
        return;
      }
    }

    const ndc = getNdcFromPointer(e.clientX, e.clientY);
    if (!ndc) return;

    if (viewMode === 'FLOOR_3D') {
      const badgeHit = (rendererRef.current as any)?.pickFloorNoticeBadge?.(ndc.ndcX, ndc.ndcY) as
        | { roomId: string; noticeKind: 'PAYMENT' | 'DEVICE' }
        | null
        | undefined;
      if (badgeHit) {
        rendererRef.current?.setFloorHoveredInfoPlaque(null);
        rendererRef.current?.setFloorHoveredRoom(null);
        const matched = roomsWithNotices.find((item) => item.room.id === badgeHit.roomId);
        const roomCode = matched?.room.room_number ?? badgeHit.roomId;
        setHoveredNoticeBadgeInfo({
          roomId: badgeHit.roomId,
          roomCode,
          noticeKind: badgeHit.noticeKind,
          x: ndc.localX,
          y: ndc.localY,
        });
        setHoveredPlaqueInfo(null);
        setHoveredRoomInfo(null);
        return;
      }

      setHoveredNoticeBadgeInfo(null);

      const plaqueHit = rendererRef.current?.pickRoomInfoPlaque(ndc.ndcX, ndc.ndcY);
      if (plaqueHit) {
        rendererRef.current?.setFloorHoveredInfoPlaque(plaqueHit.roomId);
        rendererRef.current?.setFloorHoveredRoom(null);
        setHoveredPlaqueInfo({
          roomId: plaqueHit.roomId,
          roomCode: plaqueHit.roomCode,
          x: ndc.localX,
          y: ndc.localY,
        });
        setHoveredRoomInfo(null);
        return;
      }

      rendererRef.current?.setFloorHoveredInfoPlaque(null);
      setHoveredPlaqueInfo(null);

      const hit = rendererRef.current?.pickFloorRoom(ndc.ndcX, ndc.ndcY);
      if (!hit) {
        rendererRef.current?.setFloorHoveredRoom(null);
        setHoveredRoomInfo(null);
        return;
      }

      const matched =
        roomsWithNotices.find(
          (item) => item.room.id === hit.roomId || item.room.room_number === hit.roomCode
        ) ?? findRoomByGrid(hit.floorIndex, hit.roomIndex);

      if (!matched) {
        rendererRef.current?.setFloorHoveredRoom(null);
        setHoveredRoomInfo(null);
        return;
      }

      rendererRef.current?.setFloorHoveredRoom(matched.room.id);
      setHoveredRoomInfo({
        item: matched,
        x: ndc.localX,
        y: ndc.localY,
      });
      return;
    }

    // BUILDING mode: raycast whole floor
    const hit = rendererRef.current?.pickBuildingRoom(ndc.ndcX, ndc.ndcY) ?? null;
    if (!hit) {
      rendererRef.current?.setHoveredFloor(null);
      setHoveredFloorInfo(null);
      return;
    }

    const floorNumber = hit.floorIndex + 1;
    const roomsOnFloor = roomsWithNotices.filter(
      (item) => item.room.floor_number === floorNumber
    );
    const totalArea = roomsOnFloor.reduce(
      (acc, item) => acc + (item.room.area_sqm || 0),
      0
    );

    rendererRef.current?.setHoveredFloor(hit.floorIndex);
    setHoveredFloorInfo({
      floorIndex: hit.floorIndex,
      roomCount: roomsOnFloor.length,
      totalArea,
      x: ndc.localX,
      y: ndc.localY,
    });
  };

  const handleCanvasPointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const drag = dragStateRef.current;
    const dist = Math.hypot(e.clientX - drag.startX, e.clientY - drag.startY);
    const wasDragging = drag.isDragging;
    drag.isPointerDown = false;
    drag.isDragging = false;

    if (!wasDragging && dist <= 5) {
      const ndc = getNdcFromPointer(e.clientX, e.clientY);
      if (!ndc) return;

      if (viewMode === 'FLOOR_3D') {
        const badgeHit = (rendererRef.current as any)?.pickFloorNoticeBadge?.(ndc.ndcX, ndc.ndcY) as
          | { roomId: string; noticeKind: 'PAYMENT' | 'DEVICE' }
          | null
          | undefined;
        if (badgeHit) {
          const tab: RoomDetailTab =
            badgeHit.noticeKind === 'PAYMENT' ? 'PAGE_1_BILLING' : 'PAGE_2_DEVICES';
          onSelectRoom(badgeHit.roomId, tab);
          return;
        }

        const plaqueHit = rendererRef.current?.pickRoomInfoPlaque(ndc.ndcX, ndc.ndcY);
        if (plaqueHit) {
          const matched = roomsWithNotices.find(
            (item) => item.room.id === plaqueHit.roomId || item.room.room_number === plaqueHit.roomCode
          );
          const tab: RoomDetailTab = matched?.hasBrokenDevice ? 'PAGE_2_DEVICES' : 'PAGE_1_BILLING';
          onSelectRoom(plaqueHit.roomId, tab);
          return;
        }

        const hit = rendererRef.current?.pickFloorRoom(ndc.ndcX, ndc.ndcY);
        if (hit) {
          const matched =
            roomsWithNotices.find(
              (item) => item.room.id === hit.roomId || item.room.room_number === hit.roomCode
            ) ?? findRoomByGrid(hit.floorIndex, hit.roomIndex);
          if (matched) {
            onSelectRoom(
              matched.room.id,
              matched.hasBrokenDevice ? 'PAGE_2_DEVICES' : 'PAGE_1_BILLING'
            );
          }
        }
        return;
      }

      // BUILDING mode: clicking any room mesh in a floor transitions directly to floor cutaway
      const hit = rendererRef.current?.pickBuildingRoom(ndc.ndcX, ndc.ndcY) ?? null;
      if (hit) {
        if (onSelectFloorCutaway) {
          onSelectFloorCutaway(hit.floorIndex);
        } else {
          onSelectFloor(hit.floorIndex + 1);
        }
      }
    }
  };

  const handleCanvasPointerLeave = () => {
    dragStateRef.current.isPointerDown = false;
    dragStateRef.current.isDragging = false;
    if (viewMode === 'FLOOR_3D') {
      rendererRef.current?.setFloorHoveredRoom(null);
      rendererRef.current?.setFloorHoveredInfoPlaque(null);
    } else {
      rendererRef.current?.setHoveredFloor(null);
    }
    setHoveredNoticeBadgeInfo(null);
    setHoveredRoomInfo(null);
    setHoveredPlaqueInfo(null);
    setHoveredFloorInfo(null);
  };

  const handleCanvasWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    const factor = e.deltaY < 0 ? 1.1 : 0.9;
    rendererRef.current?.zoomCamera(factor);
  };

  const safeTotalFloors = Math.max(1, totalFloors);
  const floorAsc = Array.from({ length: safeTotalFloors }, (_, idx) => idx + 1);
  const floors = [...floorAsc].reverse();

  const activePreset =
    BUILDING_BLOCK_PRESET_ITEMS.find((p) => p.id === currentBlockPresetId) ??
    (totalFloors === 6
      ? BUILDING_BLOCK_PRESET_ITEMS[0]
      : totalFloors === 4
      ? BUILDING_BLOCK_PRESET_ITEMS[1]
      : totalFloors === 2
      ? BUILDING_BLOCK_PRESET_ITEMS[4]
      : totalFloors === 3 && roomsWithNotices.length > 20
      ? BUILDING_BLOCK_PRESET_ITEMS[2]
      : BUILDING_BLOCK_PRESET_ITEMS[3]);

  const currentPresetLabel = activePreset
    ? `🏛️ Khối: ${activePreset.name} ▾`
    : '🏛️ Khối toà nhà ▾';

  return (
    <section
      className="relative w-full h-full min-h-[460px] rounded-xl overflow-hidden border border-stone-700 bg-slate-900 text-stone-100 shadow-xl"
      style={{ zIndex: 10 }}
      data-testid="canvas-3d-stage"
      data-view-mode={viewMode}
      data-active-floor={activeFloorIndex + 1}
      aria-label={
        viewMode === 'FLOOR_3D'
          ? `Mặt bằng Tầng ${activeFloorIndex + 1} 3D Cutaway`
          : 'Không gian tòa nhà 3D Isometric'
      }
    >
      {/* WebGL Canvas Layer */}
      <canvas
        ref={canvasRef}
        className="w-full h-full block min-h-[460px]"
        style={{
          touchAction: 'none',
          cursor: (viewMode === 'BUILDING' ? hoveredFloorInfo : (hoveredNoticeBadgeInfo || hoveredPlaqueInfo || hoveredRoomInfo))
            ? 'pointer'
            : 'grab',
        }}
        data-testid="three-game-canvas"
        data-webgl-ready={webglReady ? 'true' : 'false'}
        onPointerDown={handleCanvasPointerDown}
        onPointerMove={handleCanvasPointerMove}
        onPointerUp={handleCanvasPointerUp}
        onPointerLeave={handleCanvasPointerLeave}
        onWheel={handleCanvasWheel}
      />

      {/* 3D Hover Floating Tooltip */}
      {viewMode === 'BUILDING' && hoveredFloorInfo && (
        <div
          data-testid="stage-3d-hover-tooltip"
          className="pointer-events-none absolute z-30 rounded-lg border border-amber-400/80 bg-slate-950/95 px-3 py-1.5 text-xs font-semibold text-amber-100 shadow-lg backdrop-blur"
          style={{
            left: `${Math.max(12, hoveredFloorInfo.x + 12)}px`,
            top: `${Math.max(12, hoveredFloorInfo.y - 36)}px`,
          }}
        >
          {`Tầng ${hoveredFloorInfo.floorIndex + 1} · ${hoveredFloorInfo.roomCount} phòng · ${hoveredFloorInfo.totalArea} m² · Nhấn để mở Mặt bằng 3D Tầng`}
        </div>
      )}

      {viewMode === 'FLOOR_3D' && hoveredNoticeBadgeInfo && (
        <div
          data-testid="stage-3d-hover-tooltip"
          className="pointer-events-none absolute z-30 rounded-lg border border-amber-400/80 bg-slate-950/95 px-3 py-1.5 text-xs font-semibold text-amber-100 shadow-lg backdrop-blur"
          style={{
            left: `${Math.max(12, hoveredNoticeBadgeInfo.x + 12)}px`,
            top: `${Math.max(12, hoveredNoticeBadgeInfo.y - 36)}px`,
          }}
        >
          {hoveredNoticeBadgeInfo.noticeKind === 'PAYMENT'
            ? `Cảnh báo Hóa đơn · Phòng ${hoveredNoticeBadgeInfo.roomCode} · Nhấp để mở Sổ Quản Lý F04 (Hóa đơn)`
            : `Cảnh báo Thiết bị · Phòng ${hoveredNoticeBadgeInfo.roomCode} · Nhấp để mở Sổ Quản Lý F04 (Thiết bị)`}
        </div>
      )}

      {viewMode === 'FLOOR_3D' && !hoveredNoticeBadgeInfo && hoveredPlaqueInfo && (
        <div
          data-testid="stage-3d-hover-tooltip"
          className="pointer-events-none absolute z-30 rounded-lg border border-amber-400/80 bg-slate-950/95 px-3 py-1.5 text-xs font-semibold text-amber-100 shadow-lg backdrop-blur"
          style={{
            left: `${Math.max(12, hoveredPlaqueInfo.x + 12)}px`,
            top: `${Math.max(12, hoveredPlaqueInfo.y - 36)}px`,
          }}
        >
          {`Bảng Thông Tin Phòng ${hoveredPlaqueInfo.roomCode} · Nhấp để mở Sổ Quản Lý F04`}
        </div>
      )}

      {viewMode === 'FLOOR_3D' && !hoveredNoticeBadgeInfo && !hoveredPlaqueInfo && hoveredRoomInfo && (
        <div
          data-testid="stage-3d-hover-tooltip"
          className="pointer-events-none absolute z-30 rounded-lg border border-amber-400/80 bg-slate-950/95 px-3 py-1.5 text-xs font-semibold text-amber-100 shadow-lg backdrop-blur"
          style={{
            left: `${Math.max(12, hoveredRoomInfo.x + 12)}px`,
            top: `${Math.max(12, hoveredRoomInfo.y - 36)}px`,
          }}
        >
          {`Phòng ${hoveredRoomInfo.item.room.room_number} • ${ROOM_STATUS_LABELS[hoveredRoomInfo.item.room.status] ?? hoveredRoomInfo.item.room.status} • ${hoveredRoomInfo.item.room.area_sqm} m² • Nhấn để mở Sổ F04`}
        </div>
      )}

      {/* Isometric Stage Quick-Pick & Notice Overlay */}
      <div className="absolute inset-0 z-20 pointer-events-none flex flex-col justify-between p-3 md:p-4 bg-gradient-to-t from-slate-950/35 via-transparent to-slate-950/35">
        {/* Top Floor Selector & 3D Camera Controls */}
        <div className="pointer-events-auto flex flex-wrap items-start justify-between gap-2">
          {viewMode === 'FLOOR_3D' ? (
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={onBackToBuilding}
                style={{ minHeight: `${MIN_TOUCH_TARGET_SIZE}px` }}
                className="action-btn-back px-3.5 py-2 rounded-lg bg-slate-800/95 hover:bg-slate-700 text-amber-300 hover:text-amber-200 text-xs font-bold border border-amber-500/50 shadow-lg flex items-center gap-1.5 transition-all select-none"
                data-testid="btn-back-to-building"
                title="Quay lại toàn cảnh tòa nhà 3D"
              >
                <span>◀ QUAY LẠI TOÀN CẢNH TÒA NHÀ</span>
              </button>
              <div className="flex items-center gap-2 bg-slate-900/85 backdrop-blur px-3 py-1.5 rounded-lg border border-slate-700">
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-400" />
                <span className="text-xs font-semibold text-emerald-200">
                  Mặt bằng Tầng {activeFloorIndex + 1} 3D Cutaway
                </span>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 bg-slate-900/85 backdrop-blur px-3 py-1.5 rounded-lg border border-slate-700">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-400" />
              <span className="text-xs font-semibold text-amber-200">
                Cảnh 3D Isometric (45° / 35.264°)
              </span>
            </div>
          )}

          <div className="flex flex-col items-end gap-1.5">
            {viewMode === 'BUILDING' && (
              <div className="flex flex-wrap items-center justify-end gap-1.5">
                {floorAsc.map((floorNum, idx) => (
                  <button
                    key={floorNum}
                    type="button"
                    onClick={() => {
                      if (onSelectFloorCutaway) {
                        onSelectFloorCutaway(idx);
                      } else {
                        onSelectFloor(floorNum);
                      }
                    }}
                    style={{ minHeight: `${MIN_TOUCH_TARGET_SIZE}px` }}
                    className="px-3 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow transition-colors"
                    data-testid={`stage-floor-btn-${floorNum}`}
                  >
                    Mở Tầng {floorNum}
                  </button>
                ))}
              </div>
            )}

            {/* 3D Camera Toolbar (Top-Right) */}
            <div className="flex flex-wrap items-center justify-end gap-1.5 bg-slate-900/85 backdrop-blur px-2 py-1 rounded-lg border border-slate-700">
              {(viewMode === 'BUILDING' || (viewMode as string) === 'BUILDING_3D') && (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsPresetDropdownOpen((prev) => !prev)}
                    style={{ minHeight: `${MIN_TOUCH_TARGET_SIZE}px` }}
                    className="px-3 py-2 rounded-md bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-bold border border-amber-500/60 transition-colors flex items-center gap-1.5 shadow select-none"
                    data-testid="building-block-preset-dropdown"
                    title="Chọn khối kiến trúc toà nhà 3D bên ngoài"
                    aria-expanded={isPresetDropdownOpen}
                    aria-haspopup="listbox"
                  >
                    <span>{currentPresetLabel}</span>
                  </button>

                  {isPresetDropdownOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsPresetDropdownOpen(false)}
                      />
                      <div
                        className="absolute right-0 top-full mt-1.5 z-50 w-64 rounded-xl border border-amber-500/50 bg-slate-900/95 backdrop-blur-md p-1.5 shadow-2xl space-y-1"
                        data-testid="building-block-preset-menu"
                        role="listbox"
                      >
                        <div className="px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-amber-400 border-b border-slate-700/80">
                          Khối kiến trúc 3D bên ngoài
                        </div>
                        {BUILDING_BLOCK_PRESET_ITEMS.map((preset) => {
                          const isSelected = activePreset?.id === preset.id;
                          return (
                            <button
                              key={preset.id}
                              type="button"
                              onClick={() => {
                                onSelectBlockPreset?.(preset.id);
                                setIsPresetDropdownOpen(false);
                              }}
                              style={{ minHeight: `${MIN_TOUCH_TARGET_SIZE}px` }}
                              className={`w-full px-2.5 py-2 rounded-lg text-left transition-colors flex flex-col justify-center ${
                                isSelected
                                  ? 'bg-amber-600/30 text-amber-200 border border-amber-500/70 font-bold'
                                  : 'bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-transparent'
                              }`}
                              data-testid={`building-block-preset-item-${preset.id}`}
                              data-preset-id={preset.id}
                              role="option"
                              aria-selected={isSelected}
                            >
                              <div className="flex items-center justify-between text-xs">
                                <span className="font-extrabold flex items-center gap-1.5">
                                  <span>{preset.icon}</span>
                                  <span>{preset.name}</span>
                                </span>
                                {isSelected && (
                                  <span className="text-[10px] text-amber-300 font-bold">✓ Hiện tại</span>
                                )}
                              </div>
                              <span className="text-[10px] text-slate-400 mt-0.5">{preset.details}</span>
                            </button>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>
              )}

              <button
                type="button"
                onClick={() => rendererRef.current?.zoomCamera(1.15)}
                style={{ minHeight: `${MIN_TOUCH_TARGET_SIZE}px` }}
                className="px-3 py-2 rounded-md bg-slate-800 hover:bg-slate-700 text-amber-200 text-xs font-bold border border-slate-600 transition-colors"
                data-testid="btn-3d-zoom-in"
                title="Phóng to"
              >
                + Phóng to
              </button>
              <button
                type="button"
                onClick={() => rendererRef.current?.zoomCamera(0.87)}
                style={{ minHeight: `${MIN_TOUCH_TARGET_SIZE}px` }}
                className="px-3 py-2 rounded-md bg-slate-800 hover:bg-slate-700 text-amber-200 text-xs font-bold border border-slate-600 transition-colors"
                data-testid="btn-3d-zoom-out"
                title="Thu nhỏ"
              >
                - Thu nhỏ
              </button>
              <button
                type="button"
                onClick={() => {
                  if (viewMode === 'FLOOR_3D') {
                    rendererRef.current?.resetFloorIsometricCamera?.() ??
                      rendererRef.current?.resetIsometricCamera();
                  } else {
                    rendererRef.current?.resetIsometricCamera();
                  }
                }}
                style={{ minHeight: `${MIN_TOUCH_TARGET_SIZE}px` }}
                className="px-3 py-2 rounded-md bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-bold border border-slate-600 transition-colors"
                data-testid="btn-3d-reset-view"
                title="Đặt lại góc nhìn Isometric 45°"
              >
                Góc chuẩn 45°
              </button>
            </div>
          </div>
        </div>

        {/* Bottom-Left Corner Collapsible Room & Floor Drawer */}
        <div
          className={`pointer-events-auto self-start rounded-xl border border-slate-700/80 bg-slate-900/85 backdrop-blur-md shadow-xl transition-all ${
            isDrawerCollapsed ? 'p-1.5' : isMobileViewport ? 'w-full p-2' : 'w-full max-w-md p-2'
          }`}
          data-testid="stage-room-drawer"
          data-drawer-collapsed={isDrawerCollapsed ? 'true' : 'false'}
        >
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => setIsDrawerCollapsed((prev) => !prev)}
              style={{ minHeight: `${MIN_TOUCH_TARGET_SIZE}px` }}
              className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-200 text-xs font-bold border border-slate-600 transition-colors flex items-center gap-1.5"
              data-testid="toggle-room-drawer-btn"
            >
              {isDrawerCollapsed
                ? `📋 Danh sách Phòng & Tầng (${roomsWithNotices.length}) ▲ Mở rộng`
                : '▼ Thu nhỏ vào góc'}
            </button>
          </div>

          {!isDrawerCollapsed && (
            <div className="mt-2 space-y-2 max-h-[250px] overflow-y-auto pr-1">
              {floors.map((floorNum) => {
                const floorRooms = roomsWithNotices.filter(
                  (item) => item.room.floor_number === floorNum
                );
                return (
                  <div
                    key={floorNum}
                    className="bg-slate-900/80 backdrop-blur-sm rounded-lg p-2 border border-slate-700/80"
                    data-testid={`stage-floor-row-${floorNum}`}
                  >
                    <div className="flex items-center justify-between mb-1.5 px-1">
                      <span className="text-xs font-bold uppercase tracking-wider text-amber-300">
                        Tầng {floorNum}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {floorRooms.length} phòng
                      </span>
                    </div>
                    <div
                      className={`grid gap-2 ${
                        isMobileViewport ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-4'
                      }`}
                    >
                      {floorRooms.map(({ room, tenantName, noticeType, hasBrokenDevice }) => {
                        const hasYellowNotice = noticeType !== 'NONE';
                        return (
                          <button
                            key={room.id}
                            type="button"
                            onClick={() =>
                              onSelectRoom(
                                room.id,
                                hasBrokenDevice ? 'PAGE_2_DEVICES' : 'PAGE_1_BILLING'
                              )
                            }
                            style={{ minHeight: `${MIN_TOUCH_TARGET_SIZE}px` }}
                            className="relative flex flex-col items-start justify-center p-2 rounded-lg bg-slate-800/90 hover:bg-slate-700 border border-slate-600 text-left transition-all"
                            data-testid={`stage-room-card-${room.room_number}`}
                            data-notice-type={noticeType}
                            data-broken-device={hasBrokenDevice ? 'true' : 'false'}
                          >
                            <div className="flex items-center justify-between w-full gap-1">
                              <span className="font-bold text-sm text-white">
                                {room.room_number}
                              </span>
                              <div className="flex items-center gap-1">
                                {hasYellowNotice && (
                                  <span
                                    className="inline-flex items-center justify-center w-5 h-5 rounded-full text-[11px] font-black text-slate-950"
                                    style={{ backgroundColor: '#F59E0B' }}
                                    title={
                                      noticeType === 'BILL_PENDING'
                                        ? 'Chờ duyệt bill'
                                        : 'Chờ thu tiền'
                                    }
                                    data-testid={`yellow-notice-${room.room_number}`}
                                  >
                                    !
                                  </span>
                                )}
                                {hasBrokenDevice && (
                                  <span
                                    className="inline-flex items-center justify-center w-5 h-5 rounded-full text-[11px] font-black text-white"
                                    style={{ backgroundColor: '#EF4444' }}
                                    title="Thiết bị báo hỏng"
                                    data-testid={`red-notice-${room.room_number}`}
                                  >
                                    !
                                  </span>
                                )}
                              </div>
                            </div>
                            <span className="text-[11px] text-slate-300 truncate w-full mt-0.5">
                              {tenantName ?? ROOM_STATUS_LABELS[room.status] ?? room.status}
                            </span>
                            <span
                              className="text-[10px] font-semibold text-amber-300/90 mt-0.5"
                              data-testid={`stage-room-area-${room.room_number}`}
                            >
                              {room.area_sqm} m²
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Dock for Floor Selection (Bottom-Center) */}
      <div
        className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center justify-center max-w-[90%]"
        data-testid="floor-cutaway-dock"
      >
        <div className="pointer-events-auto flex flex-wrap items-center justify-center gap-1.5 bg-slate-950/85 backdrop-blur-md px-3 py-2 rounded-xl border border-slate-700/80 shadow-2xl">
          <span className="text-[11px] font-semibold text-stone-400 hidden sm:inline mr-1">
            Chọn tầng:
          </span>
          {floorAsc.map((floorNum, idx) => {
            const isActive = viewMode === 'FLOOR_3D' && activeFloorIndex === idx;
            return (
              <button
                key={floorNum}
                type="button"
                onClick={() => {
                  if (onSelectFloorCutaway) {
                    onSelectFloorCutaway(idx);
                  } else {
                    onSelectFloor(floorNum);
                  }
                }}
                style={{
                  minHeight: `${MIN_TOUCH_TARGET_SIZE}px`,
                  minWidth: `${MIN_TOUCH_TARGET_SIZE}px`,
                }}
                className={`px-3 py-2 rounded-lg text-xs font-bold transition-all shadow ${
                  isActive
                    ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 ring-2 ring-amber-300 font-black'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600'
                }`}
                data-testid={`dock-floor-btn-${floorNum}`}
                data-active={isActive ? 'true' : 'false'}
                title={`Xem Mặt bằng Tầng ${floorNum} 3D Cutaway`}
              >
                {floorNum}. Tầng {floorNum}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
};
