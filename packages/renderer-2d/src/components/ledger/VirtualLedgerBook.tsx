import React from 'react';
import type { FloorMapDTO, RoomDetailDTO, RoomDetailTab, FloorMapRoomDTO } from '@qlnt/shared-types';
import { MIN_TOUCH_TARGET_SIZE } from '../../constants';
import { BookmarkFloorTabs } from './BookmarkFloorTabs';
import { RoomDetailSinglePage } from './RoomDetailSinglePage';
import { FloorMapRenderer } from '../FloorMapRenderer';

export type LedgerContentStage = 'hidden' | 'popping' | 'visible' | 'folding';

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
  /**
   * Trạng thái hoạt ảnh mở / gập sổ 3D:
   * - 'opening': hoạt ảnh lật mở bìa sổ quanh trục bản lề (~600ms) và bung nội dung pop-up
   * - 'open': trạng thái sổ mở phẳng hoàn chỉnh (default)
   * - 'closing': hoạt ảnh gập sổ 3D phẳng về gáy sổ (~400ms)
   */
  animationState?: 'opening' | 'open' | 'closing';
  /**
   * Giai đoạn hiển thị nội dung sổ 3D theo chu trình 2 giai đoạn:
   * - 'hidden': ẩn hoàn toàn nội dung thẻ main (khi sách đang mở bìa 0 - 550ms)
   * - 'popping': kích hoạt hoạt ảnh Pop-up 3D trồi lên từ lòng sách (550 - 950ms)
   * - 'visible': hiển thị bình thường, sẵn sàng tương tác (default)
   * - 'folding': thu gọn nội dung trang trước khi gập bìa sổ (0 - 180ms)
   */
  contentStage?: LedgerContentStage;
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
  animationState = 'open',
  contentStage = 'visible',
}) => {
  const isDetailMode = Boolean(roomDetail);

  const handleRoomClick = (room: FloorMapRoomDTO) => {
    onOpenRoomDetail?.(room.roomId);
  };

  const animStateClass = `book-state-${animationState}`;
  const contentStageClass = `content-stage-${contentStage}`;

  const getMainStyle = (): React.CSSProperties => {
    const base: React.CSSProperties = {
      transformStyle: 'preserve-3d',
    };

    if (contentStage === 'hidden') {
      return {
        ...base,
        opacity: 0,
        pointerEvents: 'none',
        transform: 'translateY(20px) scale(0.95)',
      };
    }

    if (contentStage === 'popping') {
      return {
        ...base,
        animation: 'popUpContentRise 400ms cubic-bezier(0.16, 1, 0.3, 1) forwards',
      };
    }

    if (contentStage === 'folding') {
      return {
        ...base,
        opacity: 0,
        pointerEvents: 'none',
        transform: 'translateY(20px) scale(0.95)',
        animation: 'popUpContentFold 200ms cubic-bezier(0.4, 0, 0.2, 1) forwards',
      };
    }

    // contentStage === 'visible'
    return {
      ...base,
      opacity: 1,
      transform: 'none',
    };
  };

  return (
    <div
      className={`qlnt-virtual-ledger-book ${animStateClass} ${contentStageClass} relative flex flex-col w-full h-full max-w-5xl mx-auto bg-amber-50 rounded-xl shadow-2xl border-4 border-amber-900/40 overflow-hidden ${className}`.trim()}
      data-testid="virtual-ledger-book"
      data-mode={isDetailMode ? 'room-detail' : 'floor-map'}
      data-animation-state={animationState}
      data-content-stage={contentStage}
      role="main"
      aria-label="Sổ quản lý ảo F04"
      style={{
        perspective: '1400px',
        transformStyle: 'preserve-3d',
        transformOrigin: 'left center',
        animation:
          animationState === 'opening'
            ? 'bookOpenHinge 600ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards'
            : animationState === 'closing'
              ? 'bookCloseHinge 400ms cubic-bezier(0.4, 0, 0.2, 1) forwards'
              : undefined,
      }}
    >
      {/* Embedded CSS 3D Pop-up Book Keyframes */}
      <style>{`
        @keyframes bookOpenHinge {
          0% {
            transform: perspective(1400px) rotateY(-85deg) scale(0.92);
            opacity: 0.6;
          }
          60% {
            transform: perspective(1400px) rotateY(5deg) scale(1.02);
            opacity: 0.96;
          }
          100% {
            transform: perspective(1400px) rotateY(0deg) scale(1);
            opacity: 1;
          }
        }
        @keyframes bookCloseHinge {
          0% {
            transform: perspective(1400px) rotateY(0deg) scale(1);
            opacity: 1;
          }
          100% {
            transform: perspective(1400px) rotateY(-80deg) scale(0.9);
            opacity: 0;
          }
        }
        @keyframes spineShadowFade {
          0% {
            opacity: 0.85;
          }
          100% {
            opacity: 0.35;
          }
        }
        @keyframes pagePopUpUnfold {
          0% {
            transform: translateZ(-30px) scale(0.95);
            opacity: 0.75;
          }
          70% {
            transform: translateZ(6px) scale(1.01);
          }
          100% {
            transform: translateZ(0) scale(1);
            opacity: 1;
          }
        }
        @keyframes popUpContentRise {
          0% {
            opacity: 0;
            transform: translateY(25px) scale(0.92);
          }
          70% {
            opacity: 1;
            transform: translateY(-4px) scale(1.01);
          }
          100% {
            opacity: 1;
            transform: translateY(0px) scale(1);
          }
        }
        @keyframes popUpContentFold {
          0% {
            opacity: 1;
            transform: translateY(0px) scale(1);
          }
          100% {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
        }
        @keyframes frontCoverFlapOpen {
          0% {
            transform: perspective(1400px) rotateY(0deg);
            opacity: 1;
          }
          75% {
            opacity: 1;
          }
          100% {
            transform: perspective(1400px) rotateY(-180deg);
            opacity: 0;
          }
        }
        @keyframes frontCoverFlapClose {
          0% {
            transform: perspective(1400px) rotateY(-180deg);
            opacity: 0;
          }
          25% {
            opacity: 1;
          }
          100% {
            transform: perspective(1400px) rotateY(0deg);
            opacity: 1;
          }
        }
      `}</style>

      {/* 3D Front Cover Flap (Nắp bìa da lật mở 3D từ 0deg sang -180deg quanh lề trái gáy sách) */}
      <div
        data-testid="book-front-cover-flap"
        className="book-front-cover-flap pointer-events-none absolute inset-0 z-40 rounded-xl overflow-hidden shadow-2xl bg-gradient-to-br from-amber-950 via-amber-900 to-amber-950 border-4 border-amber-900 flex flex-col items-center justify-center select-none text-center"
        aria-hidden="true"
        style={{
          transformOrigin: 'left center',
          transformStyle: 'preserve-3d',
          backfaceVisibility: 'hidden',
          animation:
            animationState === 'opening'
              ? 'frontCoverFlapOpen 550ms cubic-bezier(0.2, 0.8, 0.2, 1) forwards'
              : animationState === 'closing'
                ? 'frontCoverFlapClose 350ms cubic-bezier(0.4, 0, 0.2, 1) forwards'
                : undefined,
          transform: animationState === 'open' ? 'rotateY(-180deg)' : undefined,
          opacity: animationState === 'open' ? 0 : undefined,
          pointerEvents: 'none',
        }}
      >
        <div className="absolute inset-3 border-2 border-dashed border-amber-500/40 rounded-lg pointer-events-none" />
        <div className="relative z-10 px-6 py-4 rounded-lg bg-stone-900/70 border border-amber-500/40 shadow-xl max-w-md">
          <div className="w-9 h-9 mx-auto mb-2 rounded-full border border-amber-400 flex items-center justify-center text-amber-300 font-serif font-bold text-sm shadow">
            F04
          </div>
          <h2 className="font-serif font-bold text-lg md:text-xl text-amber-200 tracking-wider uppercase">
            Sổ Quản Lý Phòng
          </h2>
          <p className="text-amber-400/80 text-xs mt-1 font-mono tracking-widest uppercase">
            Toà Nhà F04 — Phiên Bản 3D
          </p>
        </div>
      </div>

      {/* 3D Book Cover Outer Edge & Stitching Detail */}
      <div
        data-testid="book-cover-3d"
        className="book-cover-3d pointer-events-none absolute inset-0 rounded-xl border-4 border-amber-950/20 shadow-[inset_0_0_15px_rgba(78,42,15,0.2)] z-30"
        aria-hidden="true"
      >
        <div className="absolute inset-1 rounded-lg border border-dashed border-amber-800/30 pointer-events-none" />
      </div>
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

        {/* Book Spine Crease with Realistic Gradient Shadow */}
        <div
          data-testid="book-spine-crease"
          className="book-spine-crease absolute inset-y-0 left-16 w-3.5 pointer-events-none z-20"
          style={{
            background:
              'linear-gradient(to right, rgba(40, 20, 5, 0.35) 0%, rgba(80, 40, 10, 0.12) 40%, rgba(255, 255, 255, 0.12) 60%, rgba(30, 15, 5, 0.25) 100%)',
            boxShadow: 'inset 2px 0 6px -2px rgba(0,0,0,0.4)',
            animation:
              animationState === 'opening'
                ? 'spineShadowFade 600ms ease-out forwards'
                : undefined,
          }}
          aria-hidden="true"
        />

        {/* Content Pane: Either Floor Map 2D OR Room Detail Single-Page */}
        <main
          data-testid="virtual-ledger-book-main"
          data-content-stage={contentStage}
          className="flex-1 relative p-2 md:p-4 overflow-hidden bg-[#FAF7EE]"
          style={getMainStyle()}
        >
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
