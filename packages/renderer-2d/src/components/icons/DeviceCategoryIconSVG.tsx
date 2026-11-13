import React from 'react';
import type { DeviceCategory } from '@qlnt/shared-types';

export type DeviceIconState = 'NORMAL' | 'BROKEN' | 'IN_PROGRESS';

export interface DeviceCategoryIconSVGProps extends React.SVGProps<SVGSVGElement> {
  category: DeviceCategory;
  state?: DeviceIconState;
  size?: number;
  className?: string;
  title?: string;
}

export const DeviceCategoryIconSVG: React.FC<DeviceCategoryIconSVGProps> = ({
  category,
  state = 'NORMAL',
  size = 24,
  className = '',
  title,
  ...props
}) => {
  const isBroken = state === 'BROKEN';
  const isInProgress = state === 'IN_PROGRESS';

  const stateClass = isBroken
    ? 'qlnt-device-broken animate-pulse'
    : isInProgress
    ? 'qlnt-device-in-progress'
    : 'qlnt-device-normal';

  const color = isBroken ? '#EF4444' : isInProgress ? '#F59E0B' : '#4B5563';
  const bgColor = isBroken ? '#FEE2E2' : isInProgress ? '#FEF3C7' : '#F3F4F6';

  const defaultTitle =
    title ??
    `${category} - ${
      isBroken ? 'Đang hỏng / Báo sự cố' : isInProgress ? 'Đang xử lý' : 'Bình thường'
    }`;

  const renderIconContent = () => {
    switch (category) {
      case 'FIXED':
        // Air conditioner / Fixed cooling fixture
        return (
          <g stroke={color} strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="5" width="18" height="9" rx="2" fill={bgColor} />
            <line x1="6" y1="11" x2="18" y2="11" />
            <line x1="7" y1="17" x2="8" y2="15" />
            <line x1="12" y1="18" x2="12" y2="15" />
            <line x1="17" y1="17" x2="16" y2="15" />
          </g>
        );

      case 'FURNITURE':
        // Bed / Furniture icon
        return (
          <g stroke={color} strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 4v16" />
            <path d="M2 8h18a2 2 0 0 1 2 2v10" />
            <path d="M2 17h20" />
            <path d="M6 8v4" />
          </g>
        );

      case 'ADDITIONAL':
        // Refrigerator / Home Appliance
        return (
          <g stroke={color} strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <rect x="5" y="3" width="14" height="18" rx="2" fill={bgColor} />
            <line x1="5" y1="10" x2="19" y2="10" />
            <line x1="8" y1="6" x2="8" y2="8" />
            <line x1="8" y1="13" x2="8" y2="16" />
          </g>
        );

      case 'SECURITY':
        // Shield / Smart Lock
        return (
          <g stroke={color} strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" fill={bgColor} />
            <circle cx="12" cy="11" r="2" />
            <line x1="12" y1="13" x2="12" y2="16" />
          </g>
        );

      case 'METER':
      default:
        // Gauge / Electricity & Water Meter
        return (
          <g stroke={color} strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z" fill={bgColor} />
            <path d="m14 14-4-4" />
            <circle cx="12" cy="12" r="2" fill={color} />
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
      className={`qlnt-device-icon ${stateClass} ${className}`.trim()}
      data-testid={`device-icon-${category.toLowerCase()}`}
      data-category={category}
      data-state={state}
      aria-label={defaultTitle}
      role="img"
      {...props}
    >
      <title>{defaultTitle}</title>
      {renderIconContent()}
    </svg>
  );
};
