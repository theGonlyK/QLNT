import React from 'react';
import type { FloorMapDTO, RoomDetailDTO, RoomDetailTab, FloorMapRoomDTO } from '@qlnt/shared-types';
import { MIN_TOUCH_TARGET_SIZE } from '../../constants';
import { BookmarkFloorTabs } from './BookmarkFloorTabs';
import { RoomDetailSinglePage } from './RoomDetailSinglePage';
import { FloorMapRenderer } from '../FloorMapRenderer';

export interface VirtualLedgerBookProps {
  floorMap: FloorMapDTO;
  totalFloors?: number;
  activeFloor?: number;
  onFloorChange?: (floor: number) => void;
  roomDetail?: RoomDetailDTO | null;
  activeTab?: RoomDetailTab;
  onTabChange?: (tab: RoomDetailTab) => void;
  onOpenRoomDetail?: (roomId: string) => void;
  onCloseRoomDetail?: () => void;
  onCloseBook?: () => void;
  onApproveBill?: (billingId: string) => void;
  className?: string;
}

export const VirtualLedgerBook: React.FC<VirtualLedgerBookProps> = ({
  floorMap,
  totalFloors = 5,
  activeFloor = floorMap.floorNumber,
  onFloorChange,
  roomDetail,
  activeTab = 'PAGE_1_BILLING',
  onTabChange,
  onOpenRoomDetail,
  onCloseRoomDetail,
  onCloseBook,
  onApproveBill,
  className = '',
}) => {
  const isDetailMode = Boolean(roomDetail);

  const handleRoomClick = (room: FloorMapRoomDTO) => {
    onOpenRoomDetail?.(room.roomId);
  };

  return (
    <div
      className={`qlnt-virtual-ledger-book relative flex flex-col w-full h-full max-w-5xl mx-auto bg-amber-50 rounded-xl shadow-2xl border-4 border-amber-900/40 overflow-hidden ${className}`.trim()}
      data-testid="virtual-ledger-book"
      data-mode={isDetailMode ? 'room-detail' : 'floor-map'}
      role="main"
      aria-label="Sổ quản lý ảo F04"
    >
      {/* Top Leather Binder Header */}
      <header className="flex items-center justify-between px-4 py-2.5 bg-stone-900 text-stone-100 border-b-2 border-amber-800 shadow">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-amber-500 shadow-sm" />
          <h1 className="font-serif font-bold text-base md:text-lg tracking-wide text-amber-200">
            SỔ QUẢN LÝ ẢO F04 — TẦNG {activeFloor}
          </h1>
        </div>

        {/* Level 2 Close Button (Gập sổ về 3D) */}
        {onCloseBook && (
          <button
            type="button"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold border border-stone-600 transition-colors shadow"
            style={{ minHeight: `${MIN_TOUCH_TARGET_SIZE}px` }}
            onClick={onCloseBook}
            data-testid="close-ledger-book-btn"
            aria-label="Đóng sổ, trở về mô hình 3D"
          >
            <span>Gập Sổ (3D)</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </header>

      {/* Main Ledger Body with Sidebar Bookmark Tabs and Content Area */}
      <div className="flex flex-1 relative overflow-hidden">
        {/* Left Bookmark Floor Tabs */}
        <aside className="w-16 bg-stone-100 border-r border-stone-300 flex flex-col justify-start py-2 z-10">
          <BookmarkFloorTabs
            totalFloors={totalFloors}
            activeFloor={activeFloor}
            onFloorChange={onFloorChange}
          />
        </aside>

        {/* Content Pane: Either Floor Map 2D OR Room Detail Single-Page */}
        <main className="flex-1 relative p-2 md:p-4 overflow-hidden bg-[#FAF7EE]">
          {isDetailMode && roomDetail ? (
            <RoomDetailSinglePage
              roomDetail={roomDetail}
              activeTab={activeTab}
              onTabChange={onTabChange}
              onClose={() => onCloseRoomDetail?.()}
              onApproveBill={onApproveBill}
            />
          ) : (
            <FloorMapRenderer
              floorMap={floorMap}
              onRoomClick={handleRoomClick}
              showControls={true}
              useRough={true}
              className="w-full h-full"
            />
          )}
        </main>
      </div>
    </div>
  );
};
