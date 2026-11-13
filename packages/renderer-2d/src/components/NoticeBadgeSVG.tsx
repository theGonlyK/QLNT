import React from 'react';
import { NOTICE_BADGE_COLORS, NOTICE_BADGE_SIZE } from '../constants';
import type { NoticeBadgeSVGProps } from '../types';

export const NoticeBadgeSVG: React.FC<NoticeBadgeSVGProps> = ({
  type,
  size = NOTICE_BADGE_SIZE,
  className = '',
  pulse,
  title,
  style,
  ...restProps
}) => {
  const isRed = type === 'BROKEN' || type === 'error' || type === 'red';
  const color = isRed ? NOTICE_BADGE_COLORS.BROKEN : NOTICE_BADGE_COLORS.PAYMENT_DUE;
  const shouldPulse = pulse ?? isRed;

  const badgeTitle =
    title ??
    (isRed
      ? 'Cảnh báo sự cố: Thiết bị đang hỏng cần sửa chữa'
      : 'Cảnh báo thu tiền: Đến hạn đóng tiền hoặc chờ duyệt hóa đơn');

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={badgeTitle}
      className={`qlnt-notice-badge ${shouldPulse ? 'qlnt-badge-pulse' : ''} ${className}`.trim()}
      style={{
        display: 'inline-block',
        verticalAlign: 'middle',
        overflow: 'visible',
        ...style,
      }}
      {...restProps}
    >
      <title>{badgeTitle}</title>

      <defs>
        <filter id={`qlnt-glow-${isRed ? 'red' : 'yellow'}`} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="1" stdDeviation="1.5" floodColor={color} floodOpacity="0.4" />
        </filter>
        {shouldPulse && (
          <style>{`
            @keyframes qlnt-pulse-anim {
              0%, 100% { transform: scale(1); opacity: 1; }
              50% { transform: scale(1.12); opacity: 0.85; }
            }
            .qlnt-badge-pulse {
              transform-origin: center;
              animation: qlnt-pulse-anim 1.5s ease-in-out infinite;
            }
          `}</style>
        )}
      </defs>

      {/* Background circle badge */}
      <circle
        cx="12"
        cy="12"
        r="10.5"
        fill={color}
        stroke="#FFFFFF"
        strokeWidth="1.5"
        filter={`url(#qlnt-glow-${isRed ? 'red' : 'yellow'})`}
      />

      {/* Exclamation mark stroke */}
      <path
        d="M12 7V13"
        stroke="#FFFFFF"
        strokeWidth="2.2"
        strokeLinecap="round"
      />

      {/* Exclamation mark dot */}
      <circle cx="12" cy="16.5" r="1.3" fill="#FFFFFF" />
    </svg>
  );
};
