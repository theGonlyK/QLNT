import React, { useMemo } from 'react';
import rough from 'roughjs';
import type { RoomLayoutProps } from '../../types';

export const StandardSingleRoomLayout: React.FC<RoomLayoutProps> = ({
  x = 0,
  y = 0,
  width,
  height,
  colors,
  useRough = true,
  roughness = 0.8,
  seed = 42,
  className = '',
}) => {
  const roughPaths = useMemo(() => {
    if (!useRough) return null;
    const rc = rough.generator();
    const paths: Array<{ d: string; stroke: string; strokeWidth: number; fill?: string }> = [];

    // Outer Room boundary
    const outer = rc.rectangle(x + 4, y + 4, width - 8, height - 8, {
      fill: colors.bg,
      fillStyle: 'solid',
      stroke: colors.border,
      strokeWidth: 2,
      roughness,
      seed,
    });
    paths.push(...rc.toPaths(outer));

    // WC Partition (top-left 35% width, 40% height)
    const wcW = Math.round(width * 0.35);
    const wcH = Math.round(height * 0.4);
    const wc = rc.rectangle(x + 4, y + 4, wcW, wcH, {
      stroke: colors.border,
      strokeWidth: 1.5,
      roughness,
      seed: seed + 1,
    });
    paths.push(...rc.toPaths(wc));

    // Bed (bottom-right 40% width, 45% height)
    const bedW = Math.round(width * 0.42);
    const bedH = Math.round(height * 0.45);
    const bedX = x + width - bedW - 10;
    const bedY = y + height - bedH - 10;
    const bed = rc.rectangle(bedX, bedY, bedW, bedH, {
      stroke: '#4B5563',
      strokeWidth: 1.2,
      roughness,
      seed: seed + 2,
    });
    paths.push(...rc.toPaths(bed));

    // Desk (top-right 35% width, 22% height)
    const deskW = Math.round(width * 0.35);
    const deskH = Math.round(height * 0.22);
    const deskX = x + width - deskW - 10;
    const deskY = y + 10;
    const desk = rc.rectangle(deskX, deskY, deskW, deskH, {
      stroke: '#4B5563',
      strokeWidth: 1.2,
      roughness,
      seed: seed + 3,
    });
    paths.push(...rc.toPaths(desk));

    return paths;
  }, [useRough, x, y, width, height, colors, roughness, seed]);

  const wcW = Math.round(width * 0.35);
  const wcH = Math.round(height * 0.4);
  const bedW = Math.round(width * 0.42);
  const bedH = Math.round(height * 0.45);
  const bedX = x + width - bedW - 10;
  const bedY = y + height - bedH - 10;
  const deskW = Math.round(width * 0.35);
  const deskH = Math.round(height * 0.22);
  const deskX = x + width - deskW - 10;
  const deskY = y + 10;

  // Door Arc geometry at bottom-left
  const doorSize = Math.min(36, Math.round(width * 0.22));
  const doorX = x + 10;
  const doorY = y + height - 8;

  return (
    <g className={`standard-single-layout ${className}`.trim()} data-testid="standard-single-layout">
      {/* Background & Walls */}
      {roughPaths && roughPaths.length > 0 ? (
        roughPaths.map((p, idx) => (
          <path
            key={`r-${idx}`}
            d={p.d}
            stroke={p.stroke}
            strokeWidth={p.strokeWidth}
            fill={p.fill || 'none'}
            strokeLinecap="round"
          />
        ))
      ) : (
        <>
          <rect
            x={x + 4}
            y={y + 4}
            width={width - 8}
            height={height - 8}
            fill={colors.bg}
            stroke={colors.border}
            strokeWidth={2}
            rx={4}
          />
          <rect
            x={x + 4}
            y={y + 4}
            width={wcW}
            height={wcH}
            fill="none"
            stroke={colors.border}
            strokeWidth={1.5}
          />
          <rect
            x={bedX}
            y={bedY}
            width={bedW}
            height={bedH}
            fill="#F3F4F6"
            stroke="#4B5563"
            strokeWidth={1.2}
            rx={2}
          />
          <rect
            x={deskX}
            y={deskY}
            width={deskW}
            height={deskH}
            fill="#F9FAFB"
            stroke="#4B5563"
            strokeWidth={1.2}
            rx={2}
          />
        </>
      )}

      {/* Architectural Elements */}
      {/* 1. Door Arc (Cửa mở arc 90 độ) */}
      <g data-element="door-arc" className="qlnt-arch-door">
        <line x1={doorX} y1={doorY} x2={doorX} y2={doorY - doorSize} stroke="#374151" strokeWidth={1.5} />
        <path
          d={`M ${doorX} ${doorY - doorSize} A ${doorSize} ${doorSize} 0 0 1 ${doorX + doorSize} ${doorY}`}
          fill="none"
          stroke="#9CA3AF"
          strokeWidth={1.2}
          strokeDasharray="2 2"
        />
      </g>

      {/* 2. Window (Cửa sổ thông gió mặt thoáng) */}
      <g data-element="window" className="qlnt-arch-window">
        <line x1={x + Math.round(width * 0.45)} y1={y + 4} x2={x + Math.round(width * 0.75)} y2={y + 4} stroke="#2563EB" strokeWidth={3} />
        <line x1={x + Math.round(width * 0.45)} y1={y + 7} x2={x + Math.round(width * 0.75)} y2={y + 7} stroke="#93C5FD" strokeWidth={1} />
      </g>

      {/* 3. Bed details (Giường 1.6m x 2.0m + gối) */}
      <g data-element="bed" className="qlnt-arch-bed">
        {/* Pillow */}
        <rect
          x={bedX + 4}
          y={bedY + 4}
          width={bedW - 8}
          height={Math.round(bedH * 0.28)}
          fill="#E5E7EB"
          stroke="#9CA3AF"
          strokeWidth={1}
          rx={2}
        />
        <text
          x={bedX + bedW / 2}
          y={bedY + bedH / 2 + 8}
          textAnchor="middle"
          fontSize="9"
          fill="#6B7280"
          fontFamily="monospace"
        >
          Giường
        </text>
      </g>

      {/* 4. Desk details (Bàn học/làm việc) */}
      <g data-element="desk" className="qlnt-arch-desk">
        <text
          x={deskX + deskW / 2}
          y={deskY + deskH / 2 + 4}
          textAnchor="middle"
          fontSize="9"
          fill="#6B7280"
        >
          Bàn
        </text>
      </g>

      {/* 5. WC details (Nhà tắm / vệ sinh khép kín) */}
      <g data-element="wc" className="qlnt-arch-wc">
        {/* Toilet bowl sketch */}
        <ellipse cx={x + 14} cy={y + 16} rx={7} ry={9} fill="#E5E7EB" stroke="#6B7280" strokeWidth={1} />
        {/* Sink */}
        <rect x={x + wcW - 16} y={y + 8} width={12} height={10} fill="#E5E7EB" stroke="#6B7280" strokeWidth={1} rx={2} />
        <text
          x={x + wcW / 2}
          y={y + wcH - 6}
          textAnchor="middle"
          fontSize="8"
          fill="#6B7280"
        >
          WC
        </text>
      </g>
    </g>
  );
};
