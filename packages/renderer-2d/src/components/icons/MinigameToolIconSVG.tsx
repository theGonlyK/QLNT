import React from 'react';

export type MinigameToolType = 'pot' | 'pan' | 'broom' | 'slipper';

export interface MinigameToolIconSVGProps extends React.SVGProps<SVGSVGElement> {
  tool: MinigameToolType;
  size?: number;
  className?: string;
  title?: string;
}

export const MinigameToolIconSVG: React.FC<MinigameToolIconSVGProps> = ({
  tool,
  size = 24,
  className = '',
  title,
  ...props
}) => {
  const toolTitles: Record<MinigameToolType, string> = {
    pot: 'Nồi nấu (Đạo cụ minigame)',
    pan: 'Chảo rán (Đạo cụ minigame)',
    broom: 'Chổi quét (Đạo cụ minigame)',
    slipper: 'Dép tổ ong (Đạo cụ minigame)',
  };

  const defaultTitle = title ?? toolTitles[tool];

  const renderTool = () => {
    switch (tool) {
      case 'pot':
        // Cooking Pot with lid and side handles
        return (
          <g stroke="#374151" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round">
            {/* Pot Lid */}
            <path d="M7 8h10" />
            <path d="M10 8V6a2 2 0 0 1 4 0v2" />
            {/* Pot Body */}
            <path d="M5 9h14v8a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4V9z" fill="#E5E7EB" />
            {/* Handles */}
            <path d="M5 12H2" />
            <path d="M19 12h3" />
          </g>
        );

      case 'pan':
        // Frying pan with long handle
        return (
          <g stroke="#374151" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round">
            {/* Pan base circle */}
            <circle cx="10" cy="14" r="7" fill="#E5E7EB" />
            <circle cx="10" cy="14" r="5" stroke="#9CA3AF" />
            {/* Long handle */}
            <path d="M15 9l6-6" strokeWidth="2.2" stroke="#4B5563" />
            <circle cx="21" cy="3" r="1" fill="#374151" />
          </g>
        );

      case 'broom':
        // Cleaning Broom / Chổi
        return (
          <g stroke="#374151" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round">
            {/* Broom stick / handle */}
            <line x1="19" y1="3" x2="10" y2="12" stroke="#92400E" strokeWidth="2" />
            {/* Broom bristles bundle */}
            <path d="M11 11l-5 5 2 4 4-2 2-4" fill="#FCD34D" stroke="#D97706" />
            <line x1="7" y1="18" x2="5" y2="20" stroke="#D97706" />
            <line x1="9" y1="19" x2="8" y2="22" stroke="#D97706" />
            <line x1="11" y1="17" x2="11" y2="21" stroke="#D97706" />
          </g>
        );

      case 'slipper':
      default:
        // Vietnamese honeycomb slipper / Dép tổ ong huyền thoại
        return (
          <g stroke="#374151" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
            {/* Slipper sole */}
            <path
              d="M7 6c0-2 2-3 4-3s4 1 4 4v10c0 3-2 4-4 4s-4-1-4-4V6z"
              fill="#FEF08A"
              stroke="#CA8A04"
            />
            {/* Honeycomb strap holes */}
            <circle cx="9.5" cy="8" r="0.8" fill="#A16207" />
            <circle cx="12.5" cy="8" r="0.8" fill="#A16207" />
            <circle cx="9.5" cy="11" r="0.8" fill="#A16207" />
            <circle cx="12.5" cy="11" r="0.8" fill="#A16207" />
            <path d="M7 9h8" stroke="#CA8A04" strokeWidth="1.8" />
          </g>
        );
    }
  };

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={`qlnt-minigame-tool qlnt-tool-${tool} ${className}`.trim()}
      data-testid={`minigame-tool-${tool}`}
      data-tool={tool}
      aria-label={defaultTitle}
      role="img"
      {...props}
    >
      <title>{defaultTitle}</title>
      {renderTool()}
    </svg>
  );
};
