import React from 'react';

export interface RewardBadgeSVGProps extends React.SVGProps<SVGSVGElement> {
  stars: number; // 1 to 5
  label?: string;
  size?: number;
  className?: string;
}

export const RewardBadgeSVG: React.FC<RewardBadgeSVGProps> = ({
  stars,
  label,
  size = 32,
  className = '',
  ...props
}) => {
  // Clamp between 1 and 5
  const normalizedStars = Math.max(1, Math.min(5, Math.round(stars || 1)));
  const defaultLabel = label ?? `Huy hiệu uy tín ${normalizedStars} sao`;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 40 40"
      width={size}
      height={size}
      className={`qlnt-reward-badge ${className}`.trim()}
      data-testid="reward-badge"
      data-stars={normalizedStars}
      aria-label={defaultLabel}
      role="img"
      {...props}
    >
      <title>{defaultLabel}</title>
      <defs>
        <linearGradient id="badgeGold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FDE047" />
          <stop offset="100%" stopColor="#EAB308" />
        </linearGradient>
        <filter id="badgeShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="1" stdDeviation="1" floodColor="#B45309" floodOpacity="0.3" />
        </filter>
      </defs>

      {/* Ribbon Ribs */}
      <path d="M12 28 L7 38 L14 34 L20 38 L20 28 Z" fill="#DC2626" />
      <path d="M28 28 L33 38 L26 34 L20 38 L20 28 Z" fill="#B91C1C" />

      {/* Golden Medal Circle */}
      <circle cx="20" cy="18" r="15" fill="url(#badgeGold)" stroke="#CA8A04" strokeWidth="1.5" filter="url(#badgeShadow)" />
      <circle cx="20" cy="18" r="12" fill="none" stroke="#FEF08A" strokeWidth="0.8" strokeDasharray="2 1.5" />

      {/* Star rendering (1 to 5 stars) */}
      <g className="qlnt-stars-group">
        {Array.from({ length: normalizedStars }).map((_, idx) => {
          // Spread stars horizontally
          const total = normalizedStars;
          const spacing = 5;
          const startX = 20 - ((total - 1) * spacing) / 2;
          const starX = startX + idx * spacing;
          const starY = total === 1 ? 18 : 17;

          return (
            <path
              key={`star-${idx}`}
              d="M0 -3.2 L0.9 -1 L3.2 -1 L1.4 0.5 L2 2.8 L0 1.4 L-2 2.8 L-1.4 0.5 L-3.2 -1 L-0.9 -1 Z"
              transform={`translate(${starX}, ${starY}) scale(0.9)`}
              fill="#B45309"
              stroke="#78350F"
              strokeWidth="0.4"
            />
          );
        })}
      </g>
    </svg>
  );
};
