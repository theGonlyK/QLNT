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
  /**
   * Tùy chọn truyền node con tùy chỉnh vào thẻ Pop-up dựng đứng (popup-standup-card)
   */
  children?: React.ReactNode;
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
  children,
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

  const getPopupCardStyle = (): React.CSSProperties => {
    const base: React.CSSProperties = {
      transformOrigin: 'bottom center',
      transformStyle: 'preserve-3d',
    };

    if (contentStage === 'hidden') {
      return {
        ...base,
        transform: 'rotateX(-90deg) scale(0.95)',
        opacity: 0,
        pointerEvents: 'none',
      };
    }

    if (contentStage === 'popping') {
      return {
        ...base,
        animation: 'popUpStandUp 600ms cubic-bezier(0.16, 1.2, 0.3, 1) forwards',
      };
    }

    if (contentStage === 'folding') {
      return {
        ...base,
        transform: 'rotateX(-85deg) scale(0.95)',
        opacity: 0,
        pointerEvents: 'none',
        animation: 'popUpStandDown 250ms cubic-bezier(0.4, 0, 0.2, 1) forwards',
      };
    }

    // contentStage === 'visible'
    return {
      ...base,
      transform: 'rotateX(0deg) scale(1)',
      opacity: 1,
      pointerEvents: 'auto',
    };
  };

  const getShadowStyle = (): React.CSSProperties => {
    const base: React.CSSProperties = {
      background:
        'radial-gradient(ellipse at center, rgba(30, 15, 5, 0.45) 0%, rgba(30, 15, 5, 0.15) 55%, transparent 75%)',
    };

    if (contentStage === 'hidden') {
      return {
        ...base,
        opacity: 0,
        transform: 'scaleX(0.5) scaleY(0.2)',
      };
    }

    if (contentStage === 'popping') {
      return {
        ...base,
        animation: 'popupShadowSpread 600ms cubic-bezier(0.16, 1.2, 0.3, 1) forwards',
      };
    }

    if (contentStage === 'folding') {
      return {
        ...base,
        opacity: 0,
        transform: 'scaleX(0.5) scaleY(0.2)',
        transition: 'opacity 250ms ease-out, transform 250ms ease-out',
      };
    }

    // contentStage === 'visible'
    return {
      ...base,
      opacity: 0.6,
      transform: 'scaleX(1) scaleY(1)',
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
        perspective: '1600px',
        transformStyle: 'preserve-3d',
        transformOrigin: 'left center',
        transform:
          animationState === 'open'
            ? 'rotateX(16deg) rotateY(-2deg)'
            : undefined,
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
            transform: perspective(1600px) rotateX(16deg) rotateY(-65deg) scale(0.92);
            opacity: 0.6;
          }
          60% {
            transform: perspective(1600px) rotateX(16deg) rotateY(3deg) scale(1.02);
            opacity: 0.98;
          }
          100% {
            transform: perspective(1600px) rotateX(16deg) rotateY(-2deg) scale(1);
            opacity: 1;
          }
        }
        @keyframes bookCloseHinge {
          0% {
            transform: perspective(1600px) rotateX(16deg) rotateY(-2deg) scale(1);
            opacity: 1;
          }
          100% {
            transform: perspective(1600px) rotateX(16deg) rotateY(-75deg) scale(0.9);
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
            transform: perspective(1600px) rotateY(0deg);
            opacity: 1;
          }
          75% {
            opacity: 1;
          }
          100% {
            transform: perspective(1600px) rotateY(-180deg);
            opacity: 0;
          }
        }
        @keyframes frontCoverFlapClose {
          0% {
            transform: perspective(1600px) rotateY(-180deg);
            opacity: 0;
          }
          25% {
            opacity: 1;
          }
          100% {
            transform: perspective(1600px) rotateY(0deg);
            opacity: 1;
          }
        }
        @keyframes popUpStandUp {
          0% {
            transform: rotateX(-90deg) scale(0.95);
            opacity: 0;
          }
          60% {
            transform: rotateX(8deg) scale(1.02);
            opacity: 1;
          }
          100% {
            transform: rotateX(0deg) scale(1);
            opacity: 1;
          }
        }
        @keyframes popUpStandDown {
          0% {
            transform: rotateX(0deg) scale(1);
            opacity: 1;
          }
          100% {
            transform: rotateX(-85deg) scale(0.95);
            opacity: 0;
          }
        }
        @keyframes popupShadowSpread {
          0% {
            opacity: 0;
            transform: scaleX(0.5) scaleY(0.2);
            filter: blur(2px);
          }
          60% {
            opacity: 0.7;
            transform: scaleX(1.05) scaleY(1.1);
            filter: blur(8px);
          }
          100% {
            opacity: 0.6;
            transform: scaleX(1) scaleY(1);
            filter: blur(6px);
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
      <header className="flex items-center justify-between px-4 py-2 bg-stone-900 text-stone-100 border-b-2 border-amber-800 shadow z-20">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-amber-500 shadow-sm" />
          <h1 className="font-serif font-bold text-sm md:text-base tracking-wide text-amber-200">
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

      {/* Main Ledger Body with Sidebar Bookmark Tabs and Two-Page Spread Content Area */}
      <div className="flex flex-1 relative overflow-hidden">
        {/* Left Bookmark Floor Tabs */}
        <aside className="w-14 md:w-16 bg-stone-100 border-r border-stone-300 flex flex-col justify-start py-2 z-10 flex-shrink-0">
          <BookmarkFloorTabs
            totalFloors={totalFloors}
            activeFloor={activeFloor}
            onFloorChange={onFloorChange}
          />
        </aside>

        {/* Content Pane: Two-Page Spread (Trang Trái & Trang Phải) */}
        <main
          data-testid="virtual-ledger-book-main"
          data-content-stage={contentStage}
          className="flex-1 relative p-1 md:p-3 overflow-hidden bg-[#FAF7EE]"
          style={getMainStyle()}
        >
          {/* Two-Page Spread Container */}
          <div className="flex flex-col md:flex-row w-full h-full relative">
            {/* Trang Trái (book-page-left): Ivory paper displaying embossed book title, room profile, tenant & meters */}
            <section
              data-testid="book-page-left"
              className="book-page-left flex-1 flex flex-col p-3 md:p-4 bg-[#FAF7EE] border-b md:border-b-0 md:border-r border-amber-900/10 text-stone-800 relative overflow-y-auto select-none rounded-l-lg"
              aria-label="Trang trái hồ sơ phòng"
            >
              {/* Embossed Vintage Header */}
              <div className="border-b-2 border-amber-800/30 pb-2 mb-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono tracking-widest text-amber-900/70 uppercase">
                    HỒ SƠ ĐỊA CHÍNH TOÀ NHÀ F04
                  </span>
                  <span className="text-[10px] font-serif font-bold text-amber-900 bg-amber-200/60 px-2 py-0.5 rounded border border-amber-800/20">
                    TẦNG {activeFloor}
                  </span>
                </div>
                <h2 className="font-serif font-bold text-base md:text-lg text-amber-950 tracking-wide mt-1 drop-shadow-sm uppercase">
                  {isDetailMode && roomDetail
                    ? `SỔ QUẢN LÝ PHÒNG ${roomDetail.roomNumber}`
                    : `SỔ QUẢN LÝ TẦNG ${activeFloor}`}
                </h2>
              </div>

              {isDetailMode && roomDetail ? (
                <>
                  {/* Room Overview Card */}
                  <div className="bg-amber-100/40 rounded-lg p-2.5 border border-amber-800/20 mb-3 space-y-1.5 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-stone-900 font-serif text-sm">
                        Phòng {roomDetail.roomNumber}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          roomDetail.status === 'RENTED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-stone-200 text-stone-700'
                        }`}
                      >
                        {roomDetail.status === 'RENTED' ? 'ĐANG THUÊ' : 'PHÒNG TRỐNG'}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-1 text-[11px] text-stone-700">
                      <div>
                        Diện tích: <b className="text-stone-900">{roomDetail.areaSqm} m²</b>
                      </div>
                      <div>
                        Giá niêm yết:{' '}
                        <b className="text-stone-900">
                          {roomDetail.basePrice.toLocaleString('vi-VN')} đ
                        </b>
                      </div>
                    </div>
                  </div>

                  {/* Tenant Profile */}
                  <div className="bg-white/70 rounded-lg p-2.5 border border-stone-300/80 mb-3 text-xs space-y-1.5 shadow-sm">
                    <h4 className="font-serif font-bold text-amber-950 border-b border-stone-200 pb-1 text-xs uppercase tracking-wider flex items-center gap-1.5">
                      <span>👤 Hồ sơ khách thuê đại diện</span>
                    </h4>
                    {roomDetail.currentTenant ? (
                      <div className="space-y-1 text-[11px]">
                        <div>
                          Họ tên: <b className="text-stone-900">{roomDetail.currentTenant.fullName}</b>
                        </div>
                        <div>
                          Số điện thoại:{' '}
                          <span className="font-mono text-stone-800">
                            {roomDetail.currentTenant.phone}
                          </span>
                        </div>
                        <div>
                          Quê quán:{' '}
                          <span className="text-stone-700">
                            {roomDetail.currentTenant.hometown ?? 'Chưa cập nhật'}
                          </span>
                        </div>
                        <div>
                          Tạm trú:{' '}
                          <span className="text-emerald-700 font-medium">
                            {roomDetail.currentTenant.tempResidenceStatus}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-stone-500 italic text-[11px]">
                        Phòng hiện chưa có người thuê.
                      </p>
                    )}
                  </div>

                  {/* Meter / Consumption Details */}
                  <div className="bg-white/70 rounded-lg p-2.5 border border-stone-300/80 mb-3 text-xs space-y-1.5 shadow-sm">
                    <h4 className="font-serif font-bold text-amber-950 border-b border-stone-200 pb-1 text-xs uppercase tracking-wider flex items-center gap-1.5">
                      <span>⚡ Chỉ số công tơ điện nước</span>
                    </h4>
                    {roomDetail.latestReading ? (
                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                        <div className="p-1.5 rounded bg-amber-50/80 border border-amber-200">
                          <div className="font-bold text-amber-900">Điện (kWh)</div>
                          <div className="text-[10px] text-stone-600">
                            Cũ: {roomDetail.latestReading.oldElectric} | Mới:{' '}
                            {roomDetail.latestReading.newElectric}
                          </div>
                          <div className="font-bold text-stone-900 mt-0.5">
                            Tiêu thụ:{' '}
                            {Math.max(
                              0,
                              roomDetail.latestReading.newElectric - roomDetail.latestReading.oldElectric
                            )}{' '}
                            kWh
                          </div>
                        </div>
                        <div className="p-1.5 rounded bg-sky-50/80 border border-sky-200">
                          <div className="font-bold text-sky-900">Nước (m³)</div>
                          <div className="text-[10px] text-stone-600">
                            Cũ: {roomDetail.latestReading.oldWater} | Mới:{' '}
                            {roomDetail.latestReading.newWater}
                          </div>
                          <div className="font-bold text-stone-900 mt-0.5">
                            Tiêu thụ:{' '}
                            {Math.max(
                              0,
                              roomDetail.latestReading.newWater - roomDetail.latestReading.oldWater
                            )}{' '}
                            m³
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-stone-500 italic text-[11px]">
                        Chưa ghi nhận chỉ số kỳ này.
                      </p>
                    )}
                  </div>

                  {/* Vintage Seal Footer */}
                  <div className="mt-auto pt-2 border-t border-dashed border-amber-800/20 flex items-center justify-between text-[10px] text-stone-500">
                    <span className="italic">Chứng thực toà nhà F04</span>
                    <span className="font-mono text-amber-800 font-semibold">[ĐÃ ĐỐI SOÁT]</span>
                  </div>
                </>
              ) : (
                <>
                  {/* Floor Map Overview */}
                  <div className="bg-amber-100/40 rounded-lg p-3 border border-amber-800/20 mb-3 space-y-2 text-xs">
                    <div className="font-serif font-bold text-stone-900">
                      Thống kê mặt bằng Tầng {activeFloor}
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div>
                        Tổng số phòng: <b className="text-stone-900">{floorMap.rooms.length} phòng</b>
                      </div>
                      <div>
                        Đang thuê:{' '}
                        <b className="text-emerald-700">
                          {floorMap.rooms.filter((r) => r.status === 'RENTED').length} phòng
                        </b>
                      </div>
                      <div>
                        Chờ thu tiền:{' '}
                        <b className="text-amber-800">
                          {floorMap.rooms.filter((r) => r.hasPaymentNotice).length} phòng
                        </b>
                      </div>
                      <div>
                        Thiết bị hỏng:{' '}
                        <b className="text-red-700">
                          {floorMap.rooms.filter((r) => r.hasBrokenDevice).length} phòng
                        </b>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white/70 rounded-lg p-3 border border-stone-300/80 space-y-2 text-xs shadow-sm">
                    <h4 className="font-serif font-bold text-amber-950 uppercase tracking-wider text-xs">
                      Danh sách phòng tầng {activeFloor}
                    </h4>
                    <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                      {floorMap.rooms.map((room) => (
                        <div
                          key={room.roomId}
                          onClick={() => handleRoomClick(room)}
                          className="flex items-center justify-between p-1.5 rounded hover:bg-amber-100/60 cursor-pointer border border-stone-200 text-[11px] transition-colors"
                        >
                          <span className="font-bold text-stone-800">Phòng {room.roomNumber}</span>
                          <span className="text-stone-600">{room.tenantName ?? 'Trống'}</span>
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                              room.status === 'RENTED'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-stone-200 text-stone-700'
                            }`}
                          >
                            {room.status === 'RENTED' ? 'Thuê' : 'Trống'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-auto pt-2 border-t border-dashed border-amber-800/20 text-[10px] text-stone-500 italic">
                    Nhấn vào từng phòng trên sơ đồ hoặc danh sách để mở hồ sơ chi tiết.
                  </div>
                </>
              )}
            </section>

            {/* Book Spine Crease in the center dividing the two pages */}
            <div
              data-testid="book-spine-crease"
              className="book-spine-crease hidden md:block w-3.5 relative pointer-events-none z-20 flex-shrink-0"
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

            {/* Trang Phải (book-page-right): Pop-up pedestal page with standup card & ground shadow */}
            <section
              data-testid="book-page-right"
              className="book-page-right flex-1 flex flex-col p-2 md:p-3 bg-[#F7F4E9] text-stone-800 relative overflow-hidden select-none rounded-r-lg"
              aria-label="Trang phải bệ đỡ 3D Pop-Up"
              style={{
                perspective: '1200px',
                transformStyle: 'preserve-3d',
              }}
            >
              {/* Pop-up Hinge Base Seam Line */}
              <div
                className="popup-hinge-crease absolute bottom-3 left-4 right-4 h-0.5 bg-amber-900/20 border-b border-dashed border-amber-800/30 pointer-events-none"
                aria-hidden="true"
              />

              {/* Ground Shadow Expanding Under Pop-up Card */}
              <div
                data-testid="popup-shadow-ground"
                data-content-stage={contentStage}
                className="popup-shadow-ground absolute bottom-2 left-6 right-6 h-6 rounded-full pointer-events-none z-0"
                style={getShadowStyle()}
                aria-hidden="true"
              />

              {/* Pop-up Standup Card */}
              <div
                data-testid="popup-standup-card"
                data-content-stage={contentStage}
                className="popup-standup-card relative z-10 flex-1 flex flex-col w-full h-full rounded-xl overflow-hidden shadow-2xl bg-white/95 border-2 border-amber-900/30"
                style={getPopupCardStyle()}
              >
                {children ? (
                  children
                ) : isDetailMode && roomDetail ? (
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
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
};
