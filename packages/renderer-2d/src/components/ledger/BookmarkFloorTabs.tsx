import React from 'react';
import { MIN_TOUCH_TARGET_SIZE } from '../../constants';

export interface BookmarkFloorTabsProps {
  totalFloors: number;
  activeFloor: number;
  onFloorChange?: (floor: number) => void;
  onSelectFloor?: (floor: number) => void;
  className?: string;
}

export const BookmarkFloorTabs: React.FC<BookmarkFloorTabsProps> = ({
  totalFloors,
  activeFloor,
  onFloorChange,
  onSelectFloor,
  className = '',
}) => {
  const handleFloorClick = (floor: number) => {
    onFloorChange?.(floor);
    onSelectFloor?.(floor);
  };

  const floors = Array.from({ length: Math.max(1, totalFloors) }, (_, i) => i + 1);

  return (
    <nav
      className={`qlnt-bookmark-floor-tabs flex flex-col gap-1.5 p-1 select-none ${className}`.trim()}
      data-testid="bookmark-floor-tabs"
      data-active-floor={activeFloor}
      aria-label="Thanh chọn tầng"
    >
      {floors.map((floor) => {
        const isActive = floor === activeFloor;
        return (
          <button
            key={`tab-floor-${floor}`}
            type="button"
            className={`qlnt-floor-tab flex items-center justify-center font-bold rounded-l-md transition-all ${
              isActive
                ? 'bg-amber-100 text-amber-900 border-l-4 border-amber-600 shadow-md font-extrabold translate-x-1'
                : 'bg-stone-200 text-stone-700 hover:bg-stone-300 opacity-80'
            }`}
            style={{
              minWidth: `${MIN_TOUCH_TARGET_SIZE}px`,
              minHeight: `${MIN_TOUCH_TARGET_SIZE}px`,
              padding: '8px 12px',
              cursor: 'pointer',
              border: isActive ? '1px solid #D97706' : '1px solid #D1D5DB',
              borderRight: 'none',
            }}
            data-testid={`floor-tab-${floor}`}
            data-floor={floor}
            data-active={isActive}
            aria-selected={isActive}
            aria-label={`Tầng ${floor}`}
            onClick={() => handleFloorClick(floor)}
          >
            <span className="text-sm tracking-wider">T{floor}</span>
          </button>
        );
      })}
    </nav>
  );
};
