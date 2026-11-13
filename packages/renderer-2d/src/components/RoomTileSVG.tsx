import React, { useMemo } from 'react';
import { MIN_TOUCH_TARGET_SIZE } from '../constants';
import type { RoomTileSVGProps } from '../types';
import { generateRoughRect, hashString } from '../utils/roughUtils';
import { getRoomDisplayStatus, getRoomStatusColors } from '../utils/statusUtils';
import { NoticeBadgeSVG } from './NoticeBadgeSVG';

export const RoomTileSVG: React.FC<RoomTileSVGProps> = ({
  room,
  x = 0,
  y = 0,
  width = 130,
  height = 80,
  isSelected = false,
  statusOverride,
  useRough = true,
  roughness = 1.0,
  className = '',
  onClick,
}) => {
  // Ensure strict adherence to min touch target (>= 44x44px)
  const effectiveWidth = Math.max(width, MIN_TOUCH_TARGET_SIZE);
  const effectiveHeight = Math.max(height, MIN_TOUCH_TARGET_SIZE);

  const displayStatus = statusOverride ?? getRoomDisplayStatus(room);
  const colors = getRoomStatusColors(displayStatus);

  // Generate deterministic rough paths for hand-drawn architectural style
  const roughPaths = useMemo(() => {
    if (!useRough) return null;
    const seed = hashString(room.roomId || room.roomNumber || 'room');
    return generateRoughRect(x, y, effectiveWidth, effectiveHeight, {
      fill: colors.bg,
      stroke: isSelected ? '#2563EB' : colors.border,
      strokeWidth: isSelected ? 2.5 : 1.5,
      roughness,
      seed,
    });
  }, [useRough, x, y, effectiveWidth, effectiveHeight, colors, isSelected, roughness, room.roomId, room.roomNumber]);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClick?.(room);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick?.(room);
    }
  };

  const statusLabel =
    displayStatus === 'EMPTY'
      ? 'Trống'
      : room.tenantName
      ? room.tenantName
      : displayStatus === 'BROKEN'
      ? 'Có sự cố'
      : displayStatus === 'PAYMENT_DUE'
      ? 'Chờ thu tiền'
      : 'Đang thuê';

  return (
    <g
      className={`qlnt-room-tile qlnt-status-${displayStatus.toLowerCase()} ${
        isSelected ? 'qlnt-room-selected' : ''
      } ${className}`.trim()}
      data-testid={`room-tile-${room.roomId}`}
      data-room-id={room.roomId}
      data-status={displayStatus}
      data-touch-target="true"
      style={{ cursor: onClick ? 'pointer' : 'default', outline: 'none' }}
      role="button"
      tabIndex={onClick ? 0 : undefined}
      aria-label={`Phòng ${room.roomNumber}, trạng thái ${statusLabel}`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
    >
      {/* Hand-drawn sketchy background from roughjs, or SVG rounded rect fallback */}
      {roughPaths && roughPaths.length > 0 ? (
        roughPaths.map((p, index) => (
          <path
            key={`rough-${index}`}
            d={p.d}
            stroke={p.stroke}
            strokeWidth={p.strokeWidth}
            fill={p.fill || 'none'}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))
      ) : (
        <rect
          x={x}
          y={y}
          width={effectiveWidth}
          height={effectiveHeight}
          rx={8}
          fill={colors.bg}
          stroke={isSelected ? '#2563EB' : colors.border}
          strokeWidth={isSelected ? 2.5 : 1.5}
        />
      )}

      {/* Invisible touch/hit target ensuring at least 44x44px clickable area */}
      <rect
        x={x}
        y={y}
        width={effectiveWidth}
        height={effectiveHeight}
        rx={8}
        fill="transparent"
        style={{ pointerEvents: 'all' }}
      />

      {/* Room Number */}
      <text
        x={x + 12}
        y={y + 26}
        fill={colors.text}
        fontSize="15"
        fontWeight="bold"
        fontFamily="ui-sans-serif, system-ui, sans-serif"
        style={{ pointerEvents: 'none', userSelect: 'none' }}
      >
        P.{room.roomNumber}
      </text>

      {/* Tenant Name or Status text */}
      <text
        x={x + 12}
        y={y + 48}
        fill="#4B5563"
        fontSize="12"
        fontFamily="ui-sans-serif, system-ui, sans-serif"
        style={{ pointerEvents: 'none', userSelect: 'none' }}
      >
        {statusLabel.length > 14 ? `${statusLabel.slice(0, 13)}…` : statusLabel}
      </text>

      {/* Notice Badges in top-right corner (24x24px) */}
      {displayStatus === 'BROKEN' && (
        <g
          transform={`translate(${x + effectiveWidth - 28}, ${y + 6})`}
          style={{ pointerEvents: 'none' }}
        >
          <NoticeBadgeSVG type="BROKEN" size={24} />
        </g>
      )}

      {displayStatus === 'PAYMENT_DUE' && (
        <g
          transform={`translate(${x + effectiveWidth - 28}, ${y + 6})`}
          style={{ pointerEvents: 'none' }}
        >
          <NoticeBadgeSVG type="PAYMENT_DUE" size={24} />
        </g>
      )}
    </g>
  );
};
