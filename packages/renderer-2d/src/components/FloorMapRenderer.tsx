import React, { useMemo } from 'react';
import { TransformComponent, TransformWrapper } from 'react-zoom-pan-pinch';
import { RotateCcw, ZoomIn, ZoomOut } from 'lucide-react';
import { MIN_TOUCH_TARGET_SIZE } from '../constants';
import type { FloorMapRendererProps } from '../types';
import { generateRoughRect, hashString } from '../utils/roughUtils';
import { RoomTileSVG } from './RoomTileSVG';

export const FloorMapRenderer: React.FC<FloorMapRendererProps> = ({
  floorMap,
  selectedRoomId,
  onRoomClick,
  columns,
  roomWidth = 140,
  roomHeight = 90,
  gap = 20,
  padding = 32,
  showControls = true,
  minScale = 0.5,
  maxScale = 3,
  initialScale = 1,
  useRough = true,
  roughness = 1.0,
  className = '',
  style,
}) => {
  const rooms = floorMap.rooms ?? [];

  // Determine grid layout
  const effectiveCols = useMemo(() => {
    if (columns && columns > 0) return columns;
    if (rooms.length <= 3) return Math.max(rooms.length, 1);
    if (rooms.length <= 6) return 3;
    if (rooms.length <= 8) return 4;
    return Math.min(5, Math.ceil(Math.sqrt(rooms.length * 1.5)));
  }, [columns, rooms.length]);

  const effectiveRows = Math.ceil(rooms.length / effectiveCols) || 1;

  // Floor Map SVG Dimensions
  const contentWidth = effectiveCols * roomWidth + (effectiveCols - 1) * gap;
  const contentHeight = effectiveRows * roomHeight + (effectiveRows - 1) * gap;

  const headerHeight = 60;
  const svgWidth = padding * 2 + contentWidth;
  const svgHeight = padding * 2 + headerHeight + contentHeight;

  // Background frame sketchy architectural border
  const framePaths = useMemo(() => {
    if (!useRough) return null;
    const seed = hashString(`floor-${floorMap.propertyId}-${floorMap.floorNumber}`);
    return generateRoughRect(12, 12, svgWidth - 24, svgHeight - 24, {
      fill: '#FAFAF9',
      stroke: '#CBD5E1',
      strokeWidth: 1.5,
      roughness,
      seed,
    });
  }, [useRough, svgWidth, svgHeight, floorMap.propertyId, floorMap.floorNumber, roughness]);

  return (
    <div
      className={`qlnt-floor-map-container relative w-full h-full min-h-[420px] bg-slate-100 flex flex-col ${className}`.trim()}
      style={{ minHeight: 420, position: 'relative', overflow: 'hidden', ...style }}
    >
      <TransformWrapper
        initialScale={initialScale}
        minScale={minScale}
        maxScale={maxScale}
        centerOnInit
        limitToBounds={false}
      >
        {({ zoomIn, zoomOut, resetTransform }) => (
          <>
            {/* Floating Zoom & Pan Controls (Min touch target 44x44px) */}
            {showControls && (
              <div
                className="qlnt-zoom-controls"
                style={{
                  position: 'absolute',
                  top: 16,
                  right: 16,
                  zIndex: 20,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                }}
              >
                <button
                  type="button"
                  onClick={() => zoomIn()}
                  aria-label="Phóng to mặt bằng"
                  title="Phóng to"
                  style={{
                    width: MIN_TOUCH_TARGET_SIZE,
                    height: MIN_TOUCH_TARGET_SIZE,
                    minWidth: MIN_TOUCH_TARGET_SIZE,
                    minHeight: MIN_TOUCH_TARGET_SIZE,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 8,
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #E2E8F0',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.08)',
                    cursor: 'pointer',
                  }}
                >
                  <ZoomIn size={20} color="#334155" />
                </button>
                <button
                  type="button"
                  onClick={() => zoomOut()}
                  aria-label="Thu nhỏ mặt bằng"
                  title="Thu nhỏ"
                  style={{
                    width: MIN_TOUCH_TARGET_SIZE,
                    height: MIN_TOUCH_TARGET_SIZE,
                    minWidth: MIN_TOUCH_TARGET_SIZE,
                    minHeight: MIN_TOUCH_TARGET_SIZE,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 8,
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #E2E8F0',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.08)',
                    cursor: 'pointer',
                  }}
                >
                  <ZoomOut size={20} color="#334155" />
                </button>
                <button
                  type="button"
                  onClick={() => resetTransform()}
                  aria-label="Đặt lại góc nhìn mặt bằng"
                  title="Góc nhìn ban đầu"
                  style={{
                    width: MIN_TOUCH_TARGET_SIZE,
                    height: MIN_TOUCH_TARGET_SIZE,
                    minWidth: MIN_TOUCH_TARGET_SIZE,
                    minHeight: MIN_TOUCH_TARGET_SIZE,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 8,
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #E2E8F0',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.08)',
                    cursor: 'pointer',
                  }}
                >
                  <RotateCcw size={18} color="#334155" />
                </button>
              </div>
            )}

            {/* Transform Pan & Zoom Viewport */}
            <TransformComponent
              wrapperStyle={{ width: '100%', height: '100%', flex: 1 }}
              contentStyle={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg
                width={svgWidth}
                height={svgHeight}
                viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                className="qlnt-floor-map-svg"
                style={{
                  display: 'block',
                  maxWidth: 'none',
                  filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.05))',
                }}
              >
                {/* Blueprint background grid pattern */}
                <defs>
                  <pattern
                    id="blueprint-grid"
                    width="20"
                    height="20"
                    patternUnits="userSpaceOnUse"
                  >
                    <path
                      d="M 20 0 L 0 0 0 20"
                      fill="none"
                      stroke="#E2E8F0"
                      strokeWidth="0.5"
                    />
                  </pattern>
                </defs>

                {/* Frame background */}
                {framePaths && framePaths.length > 0 ? (
                  framePaths.map((p, idx) => (
                    <path
                      key={`frame-${idx}`}
                      d={p.d}
                      stroke={p.stroke}
                      strokeWidth={p.strokeWidth}
                      fill={p.fill || 'none'}
                    />
                  ))
                ) : (
                  <rect
                    x={12}
                    y={12}
                    width={svgWidth - 24}
                    height={svgHeight - 24}
                    rx={12}
                    fill="#FAFAF9"
                    stroke="#CBD5E1"
                    strokeWidth={1.5}
                  />
                )}

                {/* Subtle architectural grid */}
                <rect
                  x={16}
                  y={16}
                  width={svgWidth - 32}
                  height={svgHeight - 32}
                  fill="url(#blueprint-grid)"
                  opacity={0.4}
                />

                {/* Floor Header */}
                <g className="qlnt-floor-header" transform={`translate(${padding}, ${padding})`}>
                  <text
                    x={0}
                    y={24}
                    fontSize="20"
                    fontWeight="700"
                    fill="#1E293B"
                    fontFamily="ui-sans-serif, system-ui, sans-serif"
                  >
                    Mặt bằng Tầng {floorMap.floorNumber}
                  </text>
                  <text
                    x={0}
                    y={44}
                    fontSize="13"
                    fill="#64748B"
                    fontFamily="ui-sans-serif, system-ui, sans-serif"
                  >
                    Tổng cộng: {rooms.length} phòng | Chọn phòng để xem chi tiết
                  </text>
                  {/* Divider line under header */}
                  <line
                    x1={0}
                    y1={52}
                    x2={contentWidth}
                    y2={52}
                    stroke="#E2E8F0"
                    strokeWidth={1.5}
                  />
                </g>

                {/* Room Grid */}
                <g
                  className="qlnt-floor-rooms"
                  transform={`translate(${padding}, ${padding + headerHeight})`}
                >
                  {rooms.length === 0 ? (
                    <text
                      x={contentWidth / 2}
                      y={contentHeight / 2}
                      textAnchor="middle"
                      fill="#94A3B8"
                      fontSize="14"
                    >
                      Không có phòng nào trên tầng này
                    </text>
                  ) : (
                    rooms.map((room, index) => {
                      const colIndex = index % effectiveCols;
                      const rowIndex = Math.floor(index / effectiveCols);
                      const roomX = colIndex * (roomWidth + gap);
                      const roomY = rowIndex * (roomHeight + gap);

                      return (
                        <RoomTileSVG
                          key={room.roomId || `room-${index}`}
                          room={room}
                          x={roomX}
                          y={roomY}
                          width={roomWidth}
                          height={roomHeight}
                          isSelected={selectedRoomId === room.roomId}
                          useRough={useRough}
                          roughness={roughness}
                          onClick={onRoomClick}
                        />
                      );
                    })
                  )}
                </g>
              </svg>
            </TransformComponent>
          </>
        )}
      </TransformWrapper>
    </div>
  );
};
