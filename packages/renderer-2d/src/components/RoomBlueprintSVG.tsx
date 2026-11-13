import React from 'react';
import { MIN_TOUCH_TARGET_SIZE } from '../constants';
import type { RoomBlueprintSVGProps } from '../types';
import { getRoomDisplayStatus, getRoomStatusColors } from '../utils/statusUtils';
import { hashString } from '../utils/roughUtils';
import { NoticeBadgeSVG } from './NoticeBadgeSVG';
import { StandardSingleRoomLayout } from './layouts/StandardSingleRoomLayout';
import { MezzanineRoomLayout } from './layouts/MezzanineRoomLayout';
import { StudioApartmentLayout } from './layouts/StudioApartmentLayout';

export const RoomBlueprintSVG: React.FC<RoomBlueprintSVGProps> = ({
  room,
  layoutType = 'STANDARD_SINGLE',
  width = 240,
  height = 200,
  statusOverride,
  useRough = true,
  roughness = 0.8,
  isSelected = false,
  showNoticeBadge = true,
  className = '',
  onClick,
}) => {
  // Ensure touch target >= 44x44px
  const effectiveWidth = Math.max(width, MIN_TOUCH_TARGET_SIZE);
  const effectiveHeight = Math.max(height, MIN_TOUCH_TARGET_SIZE);

  const displayStatus = statusOverride ?? getRoomDisplayStatus(room);
  const colors = getRoomStatusColors(displayStatus);
  const seed = hashString(room.roomId || room.roomNumber || 'blueprint');

  const layoutProps = {
    x: 0,
    y: 0,
    width: effectiveWidth,
    height: effectiveHeight,
    colors,
    useRough,
    roughness,
    seed,
  };

  const renderLayout = () => {
    switch (layoutType) {
      case 'MEZZANINE':
        return <MezzanineRoomLayout {...layoutProps} />;
      case 'STUDIO_MINI':
        return <StudioApartmentLayout {...layoutProps} />;
      case 'STANDARD_SINGLE':
      default:
        return <StandardSingleRoomLayout {...layoutProps} />;
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    if (onClick) {
      e.stopPropagation();
      onClick(room);
    }
  };

  const hasNotice = showNoticeBadge && (room.hasBrokenDevice || room.hasPaymentNotice);
  const noticeType = room.hasBrokenDevice ? 'BROKEN' : 'PAYMENT_DUE';

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`0 0 ${effectiveWidth} ${effectiveHeight}`}
      width={effectiveWidth}
      height={effectiveHeight}
      className={`qlnt-room-blueprint qlnt-status-${displayStatus.toLowerCase()} ${
        isSelected ? 'qlnt-room-selected' : ''
      } ${className}`.trim()}
      data-testid="room-blueprint-svg"
      data-layout={layoutType}
      data-room-id={room.roomId}
      data-status={displayStatus}
      data-touch-target="true"
      style={{ cursor: onClick ? 'pointer' : 'default', overflow: 'visible' }}
      onClick={handleClick}
      role={onClick ? 'button' : 'img'}
      tabIndex={onClick ? 0 : undefined}
      aria-label={`Mặt bằng phòng ${room.roomNumber}`}
    >
      <defs>
        <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#10B981" />
        </marker>
      </defs>

      {/* Architectural Layout Core */}
      {renderLayout()}

      {/* Room Badge Header */}
      <g className="qlnt-blueprint-label" transform="translate(10, 16)">
        <rect x={0} y={-10} width={Math.max(48, room.roomNumber.length * 10 + 20)} height={18} rx={4} fill="#1F2937" opacity={0.85} />
        <text x={8} y={3} fontSize="11" fontWeight="bold" fill="#FFFFFF" fontFamily="sans-serif">
          P.{room.roomNumber}
        </text>
      </g>

      {/* Notice Badge (Payment or Broken) */}
      {hasNotice && (
        <g
          transform={`translate(${effectiveWidth - 30}, 8)`}
          className="qlnt-blueprint-notice-badge"
          data-testid="notice-badge"
        >
          <NoticeBadgeSVG type={noticeType} size={24} pulse={displayStatus === 'BROKEN'} />
        </g>
      )}
    </svg>
  );
};

/**
 * Pure SVG String Generator for testing, SVGO auditing, and Three.js Texture Atlas generation
 */
export function generateRoomBlueprintSvgString(props: RoomBlueprintSVGProps): string {
  const {
    room,
    layoutType = 'STANDARD_SINGLE',
    width = 240,
    height = 200,
    statusOverride,
    showNoticeBadge = true,
  } = props;

  const effectiveWidth = Math.max(width, MIN_TOUCH_TARGET_SIZE);
  const effectiveHeight = Math.max(height, MIN_TOUCH_TARGET_SIZE);
  const displayStatus = statusOverride ?? getRoomDisplayStatus(room);
  const colors = getRoomStatusColors(displayStatus);

  let layoutContent = '';

  if (layoutType === 'STANDARD_SINGLE') {
    const wcW = Math.round(effectiveWidth * 0.35);
    const wcH = Math.round(effectiveHeight * 0.4);
    const bedW = Math.round(effectiveWidth * 0.42);
    const bedH = Math.round(effectiveHeight * 0.45);
    const bedX = effectiveWidth - bedW - 10;
    const bedY = effectiveHeight - bedH - 10;
    const deskW = Math.round(effectiveWidth * 0.35);
    const deskH = Math.round(effectiveHeight * 0.22);
    const deskX = effectiveWidth - deskW - 10;
    const doorSize = Math.min(36, Math.round(effectiveWidth * 0.22));

    layoutContent = `
      <rect x="4" y="4" width="${effectiveWidth - 8}" height="${effectiveHeight - 8}" fill="${colors.bg}" stroke="${colors.border}" stroke-width="2" rx="4"/>
      <g data-element="door-arc" class="qlnt-arch-door">
        <line x1="10" y1="${effectiveHeight - 8}" x2="10" y2="${effectiveHeight - 8 - doorSize}" stroke="#374151" stroke-width="1.5"/>
        <path d="M 10 ${effectiveHeight - 8 - doorSize} A ${doorSize} ${doorSize} 0 0 1 ${10 + doorSize} ${effectiveHeight - 8}" fill="none" stroke="#9CA3AF" stroke-width="1.2" stroke-dasharray="2 2"/>
      </g>
      <g data-element="window" class="qlnt-arch-window">
        <line x1="${Math.round(effectiveWidth * 0.45)}" y1="4" x2="${Math.round(effectiveWidth * 0.75)}" y2="4" stroke="#2563EB" stroke-width="3"/>
      </g>
      <g data-element="bed" class="qlnt-arch-bed">
        <rect x="${bedX}" y="${bedY}" width="${bedW}" height="${bedH}" fill="#F3F4F6" stroke="#4B5563" stroke-width="1.2" rx="2"/>
        <text x="${bedX + bedW / 2}" y="${bedY + bedH / 2 + 4}" text-anchor="middle" font-size="9" fill="#6B7280">Giường</text>
      </g>
      <g data-element="desk" class="qlnt-arch-desk">
        <rect x="${deskX}" y="10" width="${deskW}" height="${deskH}" fill="#F9FAFB" stroke="#4B5563" stroke-width="1.2" rx="2"/>
        <text x="${deskX + deskW / 2}" y="${10 + deskH / 2 + 4}" text-anchor="middle" font-size="9" fill="#6B7280">Bàn</text>
      </g>
      <g data-element="wc" class="qlnt-arch-wc">
        <rect x="4" y="4" width="${wcW}" height="${wcH}" fill="none" stroke="${colors.border}" stroke-width="1.5"/>
        <text x="${4 + wcW / 2}" y="${4 + wcH / 2 + 4}" text-anchor="middle" font-size="8" fill="#6B7280">WC</text>
      </g>
    `;
  } else if (layoutType === 'MEZZANINE') {
    const wcW = Math.round(effectiveWidth * 0.32);
    const wcH = Math.round(effectiveHeight * 0.38);
    const wcY = effectiveHeight - wcH - 4;
    const stairW = Math.round(effectiveWidth * 0.22);
    const stairH = Math.round(effectiveHeight * 0.52);
    const stairX = effectiveWidth - stairW - 8;
    const balcW = Math.round(effectiveWidth * 0.3);
    const balcX = Math.round(effectiveWidth * 0.45);

    layoutContent = `
      <rect x="4" y="4" width="${effectiveWidth - 8}" height="${effectiveHeight - 8}" fill="${colors.bg}" stroke="${colors.border}" stroke-width="2" rx="4"/>
      <g data-element="stairs" class="qlnt-arch-stairs">
        <rect x="${stairX}" y="8" width="${stairW}" height="${stairH}" fill="#F9FAFB" stroke="#374151" stroke-width="1.2"/>
        <text x="${stairX + stairW / 2}" y="${8 + stairH / 2}" text-anchor="middle" font-size="7" fill="#374151">Lên gác</text>
      </g>
      <g data-element="kitchen" class="qlnt-arch-kitchen">
        <rect x="4" y="4" width="${Math.round(effectiveWidth * 0.4)}" height="${Math.round(effectiveHeight * 0.22)}" fill="#F3F4F6" stroke="#4B5563"/>
        <text x="${4 + Math.round(effectiveWidth * 0.2)}" y="${16}" text-anchor="middle" font-size="8" fill="#6B7280">Bếp</text>
      </g>
      <g data-element="balcony" class="qlnt-arch-balcony">
        <rect x="${balcX}" y="4" width="${balcW}" height="6" fill="#DBEAFE" stroke="#3B82F6"/>
      </g>
      <g data-element="wc" class="qlnt-arch-wc">
        <rect x="4" y="${wcY}" width="${wcW}" height="${wcH}" fill="none" stroke="${colors.border}" stroke-width="1.5"/>
        <text x="${4 + wcW / 2}" y="${wcY + wcH / 2}" text-anchor="middle" font-size="8" fill="#6B7280">WC</text>
      </g>
    `;
  } else if (layoutType === 'STUDIO_MINI') {
    const wcW = Math.round(effectiveWidth * 0.3);
    const wcH = Math.round(effectiveHeight * 0.38);
    const bedW = Math.round(effectiveWidth * 0.38);
    const bedH = Math.round(effectiveHeight * 0.45);
    const sofaW = Math.round(effectiveWidth * 0.36);
    const sofaH = Math.round(effectiveHeight * 0.22);
    const balcW = Math.round(effectiveWidth * 0.28);

    layoutContent = `
      <rect x="4" y="4" width="${effectiveWidth - 8}" height="${effectiveHeight - 8}" fill="${colors.bg}" stroke="${colors.border}" stroke-width="2" rx="4"/>
      <g data-element="kitchen-l" class="qlnt-arch-kitchen-l">
        <rect x="8" y="${wcH + 12}" width="${Math.round(effectiveWidth * 0.18)}" height="${Math.round(effectiveHeight * 0.28)}" fill="#F3F4F6"/>
        <text x="24" y="${wcH + 30}" font-size="7" fill="#6B7280">Bếp L</text>
      </g>
      <g data-element="sofa" class="qlnt-arch-sofa">
        <rect x="${effectiveWidth - sofaW - 12}" y="${effectiveHeight - sofaH - 12}" width="${sofaW}" height="${sofaH}" fill="#EDE9FE"/>
        <text x="${effectiveWidth - sofaW / 2 - 12}" y="${effectiveHeight - sofaH / 2 - 10}" text-anchor="middle" font-size="8" fill="#6D28D9">Sofa</text>
      </g>
      <g data-element="balcony-wash" class="qlnt-arch-balcony-wash">
        <rect x="${wcW + 8}" y="4" width="${balcW}" height="12" fill="#DBEAFE"/>
        <text x="${wcW + 8 + balcW / 2}" y="13" text-anchor="middle" font-size="7" fill="#1E40AF">Máy giặt</text>
      </g>
      <g data-element="bed" class="qlnt-arch-bed">
        <rect x="${effectiveWidth - bedW - 10}" y="10" width="${bedW}" height="${bedH}" fill="#F9FAFB"/>
        <text x="${effectiveWidth - bedW / 2 - 10}" y="${10 + bedH / 2}" text-anchor="middle" font-size="8" fill="#6B7280">Giường đôi</text>
      </g>
      <g data-element="wc" class="qlnt-arch-wc">
        <rect x="4" y="4" width="${wcW}" height="${wcH}" fill="none" stroke="${colors.border}"/>
        <text x="${4 + wcW / 2}" y="${4 + wcH / 2}" text-anchor="middle" font-size="8" fill="#6B7280">WC</text>
      </g>
    `;
  }

  let badgeMarkup = '';
  if (showNoticeBadge && (room.hasBrokenDevice || room.hasPaymentNotice)) {
    const isBroken = !!room.hasBrokenDevice;
    const badgeBg = isBroken ? '#EF4444' : '#F59E0B';
    const badgeClass = isBroken ? 'qlnt-badge-broken' : 'qlnt-badge-payment';
    badgeMarkup = `
      <g transform="translate(${effectiveWidth - 30}, 8)" class="qlnt-blueprint-notice-badge ${badgeClass}" data-testid="notice-badge">
        <circle cx="12" cy="12" r="10" fill="${badgeBg}"/>
        <text x="12" y="16" text-anchor="middle" font-size="12" font-weight="bold" fill="#FFFFFF">!</text>
      </g>
    `;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${effectiveWidth} ${effectiveHeight}" width="${effectiveWidth}" height="${effectiveHeight}" data-layout="${layoutType}" data-room-id="${room.roomId}" data-status="${displayStatus}" data-touch-target="true">
    ${layoutContent}
    <g class="qlnt-blueprint-label" transform="translate(10, 16)">
      <rect x="0" y="-10" width="48" height="18" rx="4" fill="#1F2937" opacity="0.85"/>
      <text x="8" y="3" font-size="11" font-weight="bold" fill="#FFFFFF">${room.roomNumber}</text>
    </g>
    ${badgeMarkup}
  </svg>`.trim();
}
