import React, { useMemo } from 'react';
import rough from 'roughjs';
import type { RoomLayoutProps } from '../../types';

export const MezzanineRoomLayout: React.FC<RoomLayoutProps> = ({
  x = 0,
  y = 0,
  width,
  height,
  colors,
  useRough = true,
  roughness = 0.8,
  seed = 84,
  className = '',
}) => {
  const roughPaths = useMemo(() => {
    if (!useRough) return null;
    const rc = rough.generator();
    const paths: Array<{ d: string; stroke: string; strokeWidth: number; fill?: string }> = [];

    // Outer boundary
    const outer = rc.rectangle(x + 4, y + 4, width - 8, height - 8, {
      fill: colors.bg,
      fillStyle: 'solid',
      stroke: colors.border,
      strokeWidth: 2,
      roughness,
      seed,
    });
    paths.push(...rc.toPaths(outer));

    // WC Box (bottom-left)
    const wcW = Math.round(width * 0.32);
    const wcH = Math.round(height * 0.38);
    const wc = rc.rectangle(x + 4, y + height - wcH - 4, wcW, wcH, {
      stroke: colors.border,
      strokeWidth: 1.5,
      roughness,
      seed: seed + 1,
    });
    paths.push(...rc.toPaths(wc));

    // Kitchen Counter (top-left)
    const kitchW = Math.round(width * 0.4);
    const kitchH = Math.round(height * 0.22);
    const kitch = rc.rectangle(x + 4, y + 4, kitchW, kitchH, {
      stroke: '#4B5563',
      strokeWidth: 1.2,
      roughness,
      seed: seed + 2,
    });
    paths.push(...rc.toPaths(kitch));

    return paths;
  }, [useRough, x, y, width, height, colors, roughness, seed]);

  const wcW = Math.round(width * 0.32);
  const wcH = Math.round(height * 0.38);
  const wcY = y + height - wcH - 4;

  const kitchW = Math.round(width * 0.4);
  const kitchH = Math.round(height * 0.22);

  // Stairs geometry (along right wall: ~25% width, ~50% height)
  const stairW = Math.round(width * 0.22);
  const stairH = Math.round(height * 0.52);
  const stairX = x + width - stairW - 8;
  const stairY = y + 8;
  const numSteps = 5;
  const stepHeight = stairH / numSteps;

  // Door Arc geometry (bottom-center or bottom-left next to WC)
  const doorSize = Math.min(32, Math.round(width * 0.2));
  const doorX = x + wcW + 12;
  const doorY = y + height - 8;

  // Balcony geometry (top-right side or top center)
  const balcW = Math.round(width * 0.3);
  const balcX = x + Math.round(width * 0.45);

  return (
    <g className={`mezzanine-layout ${className}`.trim()} data-testid="mezzanine-layout">
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
            y={wcY}
            width={wcW}
            height={wcH}
            fill="none"
            stroke={colors.border}
            strokeWidth={1.5}
          />
          <rect
            x={x + 4}
            y={y + 4}
            width={kitchW}
            height={kitchH}
            fill="#F3F4F6"
            stroke="#4B5563"
            strokeWidth={1.2}
            rx={2}
          />
        </>
      )}

      {/* 1. Door Arc (Cửa chính vào phòng) */}
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

      {/* 2. Balcony / Window (Ban công phơi / cửa sổ thoáng) */}
      <g data-element="balcony" className="qlnt-arch-balcony">
        <rect
          x={balcX}
          y={y + 4}
          width={balcW}
          height={6}
          fill="#DBEAFE"
          stroke="#3B82F6"
          strokeWidth={1.5}
        />
        <line x1={balcX + 4} y1={y + 1} x2={balcX + balcW - 4} y2={y + 1} stroke="#2563EB" strokeWidth={1.5} strokeDasharray="3 2" />
        <text x={balcX + balcW / 2} y={y + 20} textAnchor="middle" fontSize="8" fill="#3B82F6">
          Ban công
        </text>
      </g>

      {/* 3. Mezzanine Staircase (Cầu thang gác lửng có bậc thang) */}
      <g data-element="stairs" className="qlnt-arch-stairs">
        <rect
          x={stairX}
          y={stairY}
          width={stairW}
          height={stairH}
          fill="#F9FAFB"
          stroke="#374151"
          strokeWidth={1.2}
        />
        {Array.from({ length: numSteps }).map((_, i) => (
          <line
            key={`step-${i}`}
            x1={stairX}
            y1={stairY + (i + 1) * stepHeight}
            x2={stairX + stairW}
            y2={stairY + (i + 1) * stepHeight}
            stroke="#6B7280"
            strokeWidth={1}
          />
        ))}
        {/* Stair direction indicator arrow UP */}
        <line
          x1={stairX + stairW / 2}
          y1={stairY + stairH - 4}
          x2={stairX + stairW / 2}
          y2={stairY + 8}
          stroke="#10B981"
          strokeWidth={1.5}
          markerEnd="url(#arrow)"
        />
        <text
          x={stairX + stairW / 2}
          y={stairY + stairH / 2 + 3}
          textAnchor="middle"
          fontSize="7"
          fill="#374151"
          fontWeight="bold"
        >
          Lên gác
        </text>
      </g>

      {/* 4. Kitchenette (Bếp tầng 1) */}
      <g data-element="kitchen" className="qlnt-arch-kitchen">
        {/* Sink circle */}
        <circle cx={x + 16} cy={y + 14} r={6} fill="#E5E7EB" stroke="#6B7280" strokeWidth={1} />
        {/* Stove rings */}
        <circle cx={x + kitchW - 14} cy={y + 14} r={5} fill="none" stroke="#EF4444" strokeWidth={1} />
        <text x={x + kitchW / 2} y={y + kitchH - 5} textAnchor="middle" fontSize="8" fill="#6B7280">
          Khu bếp
        </text>
      </g>

      {/* 5. WC (Vệ sinh tầng 1) */}
      <g data-element="wc" className="qlnt-arch-wc">
        <ellipse cx={x + 16} cy={wcY + 16} rx={7} ry={9} fill="#E5E7EB" stroke="#6B7280" strokeWidth={1} />
        <rect x={x + wcW - 16} y={wcY + 8} width={10} height={10} fill="#E5E7EB" stroke="#6B7280" strokeWidth={1} />
        <text x={x + wcW / 2} y={wcY + wcH - 6} textAnchor="middle" fontSize="8" fill="#6B7280">
          WC
        </text>
      </g>
    </g>
  );
};
