import React, { useEffect, useRef, useState } from 'react';
import type { IGameRenderer, RoomDetailTab } from '@qlnt/shared-types';
import { MIN_TOUCH_TARGET_SIZE } from '@qlnt/renderer-2d';
import { ThreeGameRenderer } from '@qlnt/renderer-3d';
import type { RoomQuickPickItem } from '../bridge/ledgerController';

export interface Canvas3DStageProps {
  roomsWithNotices: RoomQuickPickItem[];
  onAttachRenderer?: (renderer: IGameRenderer | null) => void;
  onSelectFloor: (floorNumber: number) => void;
  onSelectRoom: (roomId: string, tab?: RoomDetailTab) => void;
  isMobileViewport?: boolean;
}

const ROOM_STATUS_LABELS: Record<string, string> = {
  RENTED: 'Đang thuê',
  EMPTY: 'Phòng trống',
  MAINTENANCE: 'Bảo trì',
};

export const Canvas3DStage: React.FC<Canvas3DStageProps> = ({
  roomsWithNotices,
  onAttachRenderer,
  onSelectFloor,
  onSelectRoom,
  isMobileViewport = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [webglReady, setWebglReady] = useState(false);

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
      onAttachRenderer?.(null);
      renderer?.dispose();
    };
  }, [onAttachRenderer]);

  const floors = [3, 2, 1];

  return (
    <section
      className="relative w-full h-full min-h-[460px] rounded-xl overflow-hidden border border-stone-700 bg-slate-900 text-stone-100 shadow-xl"
      style={{ zIndex: 10 }}
      data-testid="canvas-3d-stage"
      aria-label="Không gian tòa nhà 3D Isometric"
    >
      {/* WebGL Canvas Layer */}
      <canvas
        ref={canvasRef}
        className="w-full h-full block min-h-[460px]"
        data-testid="three-game-canvas"
        data-webgl-ready={webglReady ? 'true' : 'false'}
      />

      {/* Isometric Stage Quick-Pick & Notice Overlay */}
      <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 md:p-4 bg-gradient-to-t from-slate-950/85 via-slate-900/20 to-slate-950/60">
        {/* Top Floor Selector Bar */}
        <div className="pointer-events-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 bg-slate-900/85 backdrop-blur px-3 py-1.5 rounded-lg border border-slate-700">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-400" />
            <span className="text-xs font-semibold text-amber-200">
              Cảnh 3D Isometric (45° / 35.264°)
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {[1, 2, 3].map((floorNum) => (
              <button
                key={floorNum}
                type="button"
                onClick={() => onSelectFloor(floorNum)}
                style={{ minHeight: `${MIN_TOUCH_TARGET_SIZE}px` }}
                className="px-3 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow transition-colors"
                data-testid={`stage-floor-btn-${floorNum}`}
              >
                Mở Tầng {floorNum}
              </button>
            ))}
          </div>
        </div>

        {/* Bottom 3-Floor Isometric Room Quick-Pick Grid */}
        <div className="pointer-events-auto space-y-2 max-h-[65%] overflow-y-auto pr-1">
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
                        className="relative flex flex-col items-start justify-center p-2.5 rounded-lg bg-slate-800/90 hover:bg-slate-700 border border-slate-600 text-left transition-all"
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
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
