import React, { useMemo } from 'react';
import rough from 'roughjs';
import type { RoomLayoutProps } from '../../types';

export const StudioApartmentLayout: React.FC<RoomLayoutProps> = ({
  x = 0,
  y = 0,
  width,
  height,
  colors,
  useRough = true,
  roughness = 0.8,
  seed = 126,
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

    // WC Box (top-left)
    const wcW = Math.round(width * 0.3);
    const wcH = Math.round(height * 0.38);
    const wc = rc.rectangle(x + 4, y + 4, wcW, wcH, {
      stroke: colors.border,
      strokeWidth: 1.5,
      roughness,
      seed: seed + 1,
    });
    paths.push(...rc.toPaths(wc));

    return paths;
  }, [useRough, x, y, width, height, colors, roughness, seed]);

  const wcW = Math.round(width * 0.3);
  const wcH = Math.round(height * 0.38);

  // Door Arc at bottom-left
  const doorSize = Math.min(36, Math.round(width * 0.18));
  const doorX = x + 10;
  const doorY = y + height - 8;

  // Bed (top-right area)
  const bedW = Math.round(width * 0.38);
  const bedH = Math.round(height * 0.45);
  const bedX = x + width - bedW - 10;
  const bedY = y + 10;

  // Sofa (bottom-right / middle)
  const sofaW = Math.round(width * 0.36);
  const sofaH = Math.round(height * 0.22);
  const sofaX = x + width - sofaW - 12;
  const sofaY = y + height - sofaH - 12;

  // L-Shaped Kitchen (bottom-left to middle, or middle-left)
  const kitchLeftX = x + 8;
  const kitchLeftY = y + wcH + 12;
  const kitchArmW = Math.round(width * 0.18);
  const kitchArmH = Math.round(height * 0.28);
  const kitchBottomW = Math.round(width * 0.32);
  const kitchBottomH = Math.round(height * 0.14);

  // Balcony / Logia with washing machine (top-center / balcony)
  const balcW = Math.round(width * 0.28);
  const balcX = x + wcW + 8;
  const balcY = y + 4;

  return (
    <g className={`studio-apartment-layout ${className}`.trim()} data-testid="studio-apartment-layout">
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
        </>
      )}

      {/* 1. Door Arc */}
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

      {/* 2. L-Shaped Kitchen (Bếp chữ L riêng biệt) */}
      <g data-element="kitchen-l" className="qlnt-arch-kitchen-l">
        {/* Main arm */}
        <rect
          x={kitchLeftX}
          y={kitchLeftY}
          width={kitchArmW}
          height={kitchArmH}
          fill="#F3F4F6"
          stroke="#4B5563"
          strokeWidth={1.2}
        />
        {/* Bottom leg */}
        <rect
          x={kitchLeftX}
          y={kitchLeftY + kitchArmH - kitchBottomH}
          width={kitchBottomW}
          height={kitchBottomH}
          fill="#F3F4F6"
          stroke="#4B5563"
          strokeWidth={1.2}
        />
        {/* Sink & Induction cooktop */}
        <circle cx={kitchLeftX + kitchArmW / 2} cy={kitchLeftY + 14} r={5} fill="#E5E7EB" stroke="#6B7280" />
        <circle cx={kitchLeftX + kitchBottomW - 14} cy={kitchLeftY + kitchArmH - kitchBottomH / 2} r={4} fill="none" stroke="#EF4444" />
        <text
          x={kitchLeftX + kitchBottomW / 2 + 4}
          y={kitchLeftY + kitchArmH - 4}
          textAnchor="middle"
          fontSize="7"
          fill="#6B7280"
        >
          Bếp chữ L
        </text>
      </g>

      {/* 3. Balcony / Logia with washing machine (Ban công máy giặt) */}
      <g data-element="balcony-wash" className="qlnt-arch-balcony-wash">
        <rect x={balcX} y={balcY} width={balcW} height={12} fill="#DBEAFE" stroke="#3B82F6" strokeWidth={1.2} />
        {/* Washing machine cube */}
        <rect x={balcX + 4} y={balcY + 2} width={8} height={8} fill="#FFFFFF" stroke="#2563EB" strokeWidth={1} rx={1} />
        <circle cx={balcX + 8} cy={balcY + 6} r={2} fill="#3B82F6" />
        <text x={balcX + balcW / 2 + 6} y={balcY + 9} textAnchor="middle" fontSize="7" fill="#1E40AF">
          Logia/Máy giặt
        </text>
      </g>

      {/* 4. Bed (Giường ngủ master) */}
      <g data-element="bed" className="qlnt-arch-bed">
        <rect
          x={bedX}
          y={bedY}
          width={bedW}
          height={bedH}
          fill="#F9FAFB"
          stroke="#4B5563"
          strokeWidth={1.2}
          rx={2}
        />
        {/* Dual Pillows */}
        <rect x={bedX + 4} y={bedY + 4} width={Math.round((bedW - 12) / 2)} height={10} fill="#E5E7EB" stroke="#9CA3AF" rx={2} />
        <rect x={bedX + 8 + Math.round((bedW - 12) / 2)} y={bedY + 4} width={Math.round((bedW - 12) / 2)} height={10} fill="#E5E7EB" stroke="#9CA3AF" rx={2} />
        <text x={bedX + bedW / 2} y={bedY + bedH / 2 + 8} textAnchor="middle" fontSize="8" fill="#6B7280">
          Giường đôi
        </text>
      </g>

      {/* 5. Living Sofa (Sofa phòng khách CCMN) */}
      <g data-element="sofa" className="qlnt-arch-sofa">
        <rect
          x={sofaX}
          y={sofaY}
          width={sofaW}
          height={sofaH}
          fill="#EDE9FE"
          stroke="#7C3AED"
          strokeWidth={1.2}
          rx={4}
        />
        {/* Sofa cushions */}
        <line x1={sofaX + sofaW / 2} y1={sofaY + 4} x2={sofaX + sofaW / 2} y2={sofaY + sofaH - 4} stroke="#A78BFA" strokeWidth={1} />
        <text x={sofaX + sofaW / 2} y={sofaY + sofaH / 2 + 3} textAnchor="middle" fontSize="8" fill="#6D28D9">
          Sofa
        </text>
      </g>

      {/* 6. WC */}
      <g data-element="wc" className="qlnt-arch-wc">
        <ellipse cx={x + 16} cy={y + 18} rx={7} ry={9} fill="#E5E7EB" stroke="#6B7280" strokeWidth={1} />
        <rect x={x + wcW - 16} y={y + 8} width={10} height={10} fill="#E5E7EB" stroke="#6B7280" strokeWidth={1} />
        <text x={x + wcW / 2} y={y + wcH - 6} textAnchor="middle" fontSize="8" fill="#6B7280">
          WC
        </text>
      </g>
    </g>
  );
};
