import React, { useEffect, useMemo, useState } from 'react';
import type {
  FloorMapDTO,
  RoomAuditLog,
  RoomDetailDTO,
  RoomDetailTab,
} from '@qlnt/shared-types';
import {
  MIN_TOUCH_TARGET_SIZE,
  RewardBadgeSVG,
  VirtualLedgerBook,
} from '@qlnt/renderer-2d';
import type { BillingPreviewState } from '../bridge/ledgerController';
import { GAME_COPYWRITING } from '../copywriting/gameCopywriting';
import { HANOI_MOTEL_BANK_INFO } from '../seed/hanoiMotelSeed';
import { renderVietQRSvgString } from '../utils/vietqrLocal';

export type LedgerContentStage = 'hidden' | 'popping' | 'visible' | 'folding';

export interface LedgerOverlayHostProps {
  isBookOpen: boolean;
  currentFloor: number;
  totalFloors?: number;
  floorMap: FloorMapDTO;
  roomDetail: RoomDetailDTO | null;
  activeTab: RoomDetailTab;
  previewState: BillingPreviewState | null;
  auditLogs: RoomAuditLog[];
  tenantRewardPoints: number;
  landlordReputation: number;
  isMobileViewport?: boolean;
  initialAnimationState?: 'OPENING' | 'OPEN' | 'CLOSING' | 'CLOSED';
  initialContentStage?: LedgerContentStage;
  onAnimationStateChange?: (state: 'OPENING' | 'OPEN' | 'CLOSING' | 'CLOSED') => void;
  onContentStageChange?: (stage: LedgerContentStage) => void;
  onFlipFloor: (floorNumber: number) => void;
  onOpenRoomDetail: (roomId: string) => void;
  onSwitchTab: (roomId: string, tab: RoomDetailTab) => void;
  onPreviewBilling: (roomId: string, newElectric: number, newWater: number) => void;
  onCommitBillingReading: (roomId: string, newElectric: number, newWater: number) => void;
  onUploadLocalBillImage: (roomId: string, dataUrl: string) => void;
  onApproveBillOneTouch: (roomId: string) => void;
  onReportDeviceBroken: (roomId: string, deviceId: string) => void;
  onResolveDeviceMaintenance: (roomId: string, deviceId: string) => void;
  onCloseRoomDetail: () => void;
  onCloseBook: () => void;
}

/**
 * Intercept closing action to execute the legacy single-step 3D book folding animation
 * before calling parent's unmount/close callback.
 */
export function closeLedgerWithTransition(
  onStateChange: (state: 'CLOSING' | 'CLOSED') => void,
  onCloseComplete: () => void,
  durationMs = 450
): ReturnType<typeof setTimeout> {
  onStateChange('CLOSING');
  return setTimeout(() => {
    onStateChange('CLOSED');
    onCloseComplete();
  }, durationMs);
}

/**
 * 2-Stage reverse transition when closing the ledger:
 * - Stage 1 (0ms - 250ms): Pop-up panel folds down flat (folding).
 * - Stage 2 (250ms - 600ms): Book cover folds back to spine (closing).
 * - At 600ms: Book is CLOSED and parent unmount callback is called.
 */
export function closeLedgerStagedWithTransition(
  onContentStageChange: (stage: 'folding') => void,
  onAnimStateChange: (state: 'CLOSING' | 'CLOSED') => void,
  onCloseComplete: () => void,
  stage1FoldDurationMs = 250,
  stage2BookCloseDurationMs = 350
): { clear: () => void } {
  onContentStageChange('folding');
  const timer1 = setTimeout(() => {
    onAnimStateChange('CLOSING');
  }, stage1FoldDurationMs);
  const timer2 = setTimeout(() => {
    onAnimStateChange('CLOSED');
    onCloseComplete();
  }, stage1FoldDurationMs + stage2BookCloseDurationMs);

  return {
    clear: () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    },
  };
}

const SAMPLE_LOCAL_BILL_DATA_URL =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 100" width="200" height="100"><rect width="200" height="100" fill="#ecfdf5"/><text x="16" y="42" font-size="13" fill="#065f46">BIEN LAI LOCAL</text><text x="16" y="64" font-size="11" fill="#047857">Chuyen khoan thanh cong</text></svg>'
  );

export const LedgerOverlayHost: React.FC<LedgerOverlayHostProps> = ({
  isBookOpen,
  currentFloor,
  totalFloors = 3,
  floorMap,
  roomDetail,
  activeTab,
  previewState,
  auditLogs,
  tenantRewardPoints,
  landlordReputation,
  isMobileViewport = false,
  initialAnimationState,
  initialContentStage,
  onAnimationStateChange,
  onContentStageChange,
  onFlipFloor,
  onOpenRoomDetail,
  onSwitchTab,
  onPreviewBilling,
  onCommitBillingReading,
  onUploadLocalBillImage,
  onApproveBillOneTouch,
  onReportDeviceBroken,
  onResolveDeviceMaintenance,
  onCloseRoomDetail,
  onCloseBook,
}) => {
  const [animationState, setAnimationState] = useState<
    'OPENING' | 'OPEN' | 'CLOSING' | 'CLOSED'
  >(() => {
    return initialAnimationState ?? (isBookOpen ? 'OPENING' : 'CLOSED');
  });

  const [contentStage, setContentStage] = useState<LedgerContentStage>(() => {
    if (initialContentStage) return initialContentStage;
    if (!isBookOpen) return 'hidden';
    if (initialAnimationState === 'OPEN') return 'visible';
    if (initialAnimationState === 'CLOSING') return 'folding';
    return 'hidden';
  });

  const openTimer1Ref = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const openTimer2Ref = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const stagedCloseRef = React.useRef<{ clear: () => void } | null>(null);
  const hasMountedRef = React.useRef(false);
  const [isPageTurning, setIsPageTurning] = useState(false);
  const pageTurnTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevPageRef = React.useRef<{ roomId?: string; floor: number }>({
    roomId: roomDetail?.roomId,
    floor: currentFloor,
  });

  useEffect(() => {
    onAnimationStateChange?.(animationState);
  }, [animationState, onAnimationStateChange]);

  useEffect(() => {
    onContentStageChange?.(contentStage);
  }, [contentStage, onContentStageChange]);

  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      if (initialAnimationState === 'OPEN' || initialAnimationState === 'CLOSING') {
        return;
      }
    }

    if (isBookOpen) {
      setAnimationState('OPENING');
      setContentStage('hidden');

      openTimer1Ref.current = setTimeout(() => {
        setAnimationState('OPEN');
        setContentStage('popping');
      }, 1400);

      openTimer2Ref.current = setTimeout(() => {
        setContentStage('visible');
      }, 2100);
    } else {
      setAnimationState('CLOSED');
      setContentStage('hidden');
    }

    return () => {
      if (openTimer1Ref.current) clearTimeout(openTimer1Ref.current);
      if (openTimer2Ref.current) clearTimeout(openTimer2Ref.current);
    };
  }, [isBookOpen]);

  useEffect(() => {
    const prev = prevPageRef.current;
    const hasPageChanged =
      prev.roomId !== roomDetail?.roomId || prev.floor !== currentFloor;
    prevPageRef.current = {
      roomId: roomDetail?.roomId,
      floor: currentFloor,
    };

    if (animationState !== 'OPEN') {
      setIsPageTurning(false);
      return;
    }

    if (!hasPageChanged) {
      return;
    }

    setIsPageTurning(true);
    if (pageTurnTimerRef.current) {
      clearTimeout(pageTurnTimerRef.current);
    }
    pageTurnTimerRef.current = setTimeout(() => {
      setIsPageTurning(false);
    }, 750);

    return () => {
      if (pageTurnTimerRef.current) {
        clearTimeout(pageTurnTimerRef.current);
      }
    };
  }, [roomDetail?.roomId, currentFloor, animationState]);

  useEffect(() => {
    return () => {
      if (stagedCloseRef.current) {
        stagedCloseRef.current.clear();
      }
      if (pageTurnTimerRef.current) {
        clearTimeout(pageTurnTimerRef.current);
      }
    };
  }, []);

  const handleInterceptCloseBook = () => {
    if (
      animationState === 'CLOSING' ||
      animationState === 'CLOSED' ||
      contentStage === 'folding'
    ) {
      return;
    }
    if (stagedCloseRef.current) stagedCloseRef.current.clear();

    stagedCloseRef.current = closeLedgerStagedWithTransition(
      (stage) => setContentStage(stage),
      (animState) => setAnimationState(animState),
      () => onCloseBook(),
      250,
      350
    );
  };

  const getPanelStageStyle = (): React.CSSProperties => {
    const base: React.CSSProperties = {
      transformOrigin: 'bottom center',
      transformStyle: 'preserve-3d',
    };

    if (contentStage === 'hidden') {
      return {
        ...base,
        opacity: 0,
        pointerEvents: 'none',
        transform: 'rotateX(-90deg) scale(0.95)',
        transition: 'none',
      };
    }
    if (contentStage === 'popping') {
      return {
        ...base,
        animation: 'popUpStandUp 700ms cubic-bezier(0.16, 1, 0.3, 1) forwards',
      };
    }
    if (contentStage === 'folding') {
      return {
        ...base,
        opacity: 0,
        pointerEvents: 'none',
        transform: 'rotateX(-90deg) scale(0.95)',
        animation: 'popUpFoldDown 250ms cubic-bezier(0.4, 0, 0.2, 1) forwards',
      };
    }
    // visible
    return {
      ...base,
      opacity: 1,
      transform: 'rotateX(0deg) scale(1)',
      pointerEvents: 'auto',
      boxShadow:
        '0 25px 40px -10px rgba(0, 0, 0, 0.35), 0 12px 18px -6px rgba(0, 0, 0, 0.2)',
    };
  };

  const [electricInput, setElectricInput] = useState<number>(
    roomDetail?.latestReading?.newElectric ?? 0
  );
  const [waterInput, setWaterInput] = useState<number>(
    roomDetail?.latestReading?.newWater ?? 0
  );

  useEffect(() => {
    if (!roomDetail?.latestReading) return;
    setElectricInput(roomDetail.latestReading.newElectric);
    setWaterInput(roomDetail.latestReading.newWater);
  }, [
    roomDetail?.roomId,
    roomDetail?.latestReading?.newElectric,
    roomDetail?.latestReading?.newWater,
  ]);

  const activeAmount =
    previewState?.calculation.totalAmount ??
    roomDetail?.latestBilling?.totalAmount ??
    roomDetail?.basePrice ??
    0;

  const vietQrSvg = useMemo(() => {
    if (!roomDetail) return '';
    return renderVietQRSvgString(
      {
        bankBin: HANOI_MOTEL_BANK_INFO.bankBin,
        accountNumber: HANOI_MOTEL_BANK_INFO.accountNumber,
        accountName: HANOI_MOTEL_BANK_INFO.accountName,
        amount: activeAmount,
        description: `QLNT ${roomDetail.roomNumber} T11`,
      },
      148
    );
  }, [roomDetail, activeAmount]);

  if (!isBookOpen && animationState !== 'CLOSING') {
    return null;
  }
  if (animationState === 'CLOSED') {
    return null;
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !roomDetail) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onUploadLocalBillImage(roomDetail.roomId, reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const billingStatus = roomDetail?.latestBilling?.status ?? 'UNPAID';
  const brokenDevices = (roomDetail?.devices ?? []).filter((d) => d.isBroken);

  const page1Copy = roomDetail
    ? billingStatus === 'PAID'
      ? GAME_COPYWRITING.billPaid(roomDetail.roomNumber, 2)
      : billingStatus === 'PENDING_APPROVAL'
        ? GAME_COPYWRITING.billPending(roomDetail.roomNumber)
        : GAME_COPYWRITING.paymentDue(
            roomDetail.roomNumber,
            activeAmount,
            roomDetail.latestBilling?.monthPeriod ?? '2026-11'
          )
    : '';

  const bookAnimState: 'opening' | 'open' | 'closing' =
    animationState === 'OPENING'
      ? 'opening'
      : animationState === 'CLOSING'
        ? 'closing'
        : 'open';

  return (
    <div
      className={`fixed inset-0 flex justify-center p-2 md:p-4 overflow-y-auto ${
        animationState === 'OPENING'
          ? 'ledger-overlay-opening backdrop-blur-md'
          : animationState === 'CLOSING'
            ? 'ledger-overlay-closing'
            : 'ledger-overlay-open backdrop-blur-md'
      }`}
      style={{
        zIndex: 20,
        background:
          'radial-gradient(ellipse at 50% 12%, rgba(55, 45, 36, 0.88) 0%, rgba(24, 19, 16, 0.94) 65%, rgba(12, 10, 8, 0.98) 100%)',
        boxShadow: 'inset 0 30px 90px rgba(0, 0, 0, 0.7)',
        perspective: '1600px',
        transformStyle: 'preserve-3d',
        transition:
          'opacity 450ms ease, backdrop-filter 450ms ease, -webkit-backdrop-filter 450ms ease',
      }}
      data-testid="ledger-overlay-host"
      data-animation-state={animationState}
      data-content-stage={contentStage}
      role="dialog"
      aria-modal="true"
      aria-label="Lớp phủ Sổ Quản lý Ảo F04"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleInterceptCloseBook();
        }
      }}
    >
      {/* Embedded CSS for smooth backdrop fade during opening/closing and 3D Pop-up */}
      <style>{`
        @keyframes ledgerBackdropFadeIn {
          0% {
            opacity: 0;
            backdrop-filter: blur(0px);
            -webkit-backdrop-filter: blur(0px);
          }
          100% {
            opacity: 1;
            backdrop-filter: blur(8px);
            -webkit-backdrop-filter: blur(8px);
          }
        }
        @keyframes ledgerBackdropFadeOut {
          0% {
            opacity: 1;
            backdrop-filter: blur(8px);
            -webkit-backdrop-filter: blur(8px);
          }
          100% {
            opacity: 0;
            backdrop-filter: blur(0px);
            -webkit-backdrop-filter: blur(0px);
          }
        }
        .ledger-overlay-opening {
          animation: ledgerBackdropFadeIn 900ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .ledger-overlay-closing {
          animation: ledgerBackdropFadeOut 350ms cubic-bezier(0.4, 0, 1, 1) forwards;
          pointer-events: none;
        }
        .ledger-overlay-open {
          opacity: 1;
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
        }
        @keyframes popUpStandUp {
          0% {
            opacity: 0;
            transform: rotateX(-90deg) scale(0.92);
          }
          65% {
            opacity: 1;
            transform: rotateX(8deg) scale(1.02);
          }
          100% {
            opacity: 1;
            transform: rotateX(0deg) scale(1);
          }
        }
        @keyframes popUpFoldDown {
          0% {
            opacity: 1;
            transform: rotateX(0deg) scale(1);
          }
          100% {
            opacity: 0;
            transform: rotateX(-90deg) scale(0.92);
          }
        }
        @keyframes popUpContentRise {
          0% {
            opacity: 0;
            transform: rotateX(-90deg) scale(0.92);
          }
          65% {
            opacity: 1;
            transform: rotateX(8deg) scale(1.02);
          }
          100% {
            opacity: 1;
            transform: rotateX(0deg) scale(1);
          }
        }
        @keyframes popUpContentFold {
          0% {
            opacity: 1;
            transform: rotateX(0deg) scale(1);
          }
          100% {
            opacity: 0;
            transform: rotateX(-90deg) scale(0.92);
          }
        }
      `}</style>
      <div
        className={`flex flex-col w-full gap-3 my-auto ${
          isMobileViewport ? 'max-w-[390px]' : 'max-w-5xl'
        }`}
        style={{
          transformStyle: 'preserve-3d',
        }}
      >
        {/* Core 2D Virtual Ledger Book (@qlnt/renderer-2d) */}
        <div className="min-h-[420px]" style={{ transformStyle: 'preserve-3d' }}>
          <VirtualLedgerBook
            animationState={bookAnimState}
            contentStage={contentStage}
            isPageTurning={isPageTurning}
            floorMap={floorMap}
            totalFloors={totalFloors}
            activeFloor={currentFloor}
            onFloorChange={onFlipFloor}
            roomDetail={roomDetail}
            activeTab={activeTab}
            onTabChange={(tab) => {
              if (roomDetail) onSwitchTab(roomDetail.roomId, tab);
            }}
            onOpenRoomDetail={onOpenRoomDetail}
            onCloseRoomDetail={onCloseRoomDetail}
            onCloseBook={handleInterceptCloseBook}
            onApproveBill={() => {
              if (roomDetail) onApproveBillOneTouch(roomDetail.roomId);
            }}
          />
        </div>

        {/* Interactive F04 Controls Panel for the Active Room */}
        {roomDetail && (
          <div
            className="popup-standup-card bg-amber-50 border-2 border-amber-900/30 rounded-xl p-3 md:p-4 shadow-2xl text-stone-900 space-y-3"
            data-testid="f04-interactive-panel"
            data-content-stage={contentStage}
            style={getPanelStageStyle()}
          >
            {/* Page 1 Controls: Meter Preview/Commit + VietQR Offline + Local Bill Upload + 1-Touch Approve */}
            {activeTab === 'PAGE_1_BILLING' && (
              <div className="space-y-3" data-testid="f04-page-1-controls">
                <p
                  className="text-xs md:text-sm bg-amber-100/90 border border-amber-300 rounded-lg p-2.5 text-amber-950 font-medium"
                  data-testid="page-1-copywriting"
                >
                  {page1Copy}
                </p>

                <div
                  className={`grid gap-3 ${
                    isMobileViewport ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'
                  }`}
                >
                  {/* Left: Meter Inputs (Preview vs Commit) */}
                  <div className="bg-white rounded-lg border border-stone-200 p-3 space-y-2.5">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div>
                        <h3 className="text-sm font-bold text-stone-800">
                          Chốt chỉ số điện nước (Phòng {roomDetail.roomNumber})
                        </h3>
                        <p
                          className="text-[11px] font-semibold text-amber-800"
                          data-testid="ledger-room-area-price"
                        >
                          {roomDetail.areaSqm} m² • {roomDetail.basePrice.toLocaleString('vi-VN')} đ/tháng
                        </p>
                      </div>
                      {previewState && (
                        <span
                          className="text-[11px] font-bold px-2 py-0.5 rounded bg-sky-100 text-sky-800"
                          data-testid="preview-state-badge"
                        >
                          Xem trước (Chưa lưu)
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <label className="text-xs font-medium text-stone-700 flex flex-col gap-1">
                        <span>Điện mới (kWh)</span>
                        <input
                          type="number"
                          value={electricInput}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setElectricInput(val);
                            onPreviewBilling(roomDetail.roomId, val, waterInput);
                          }}
                          className="border border-stone-300 rounded px-2 py-2 text-sm font-semibold"
                          style={{ minHeight: `${MIN_TOUCH_TARGET_SIZE}px` }}
                          data-testid="input-new-electric"
                        />
                      </label>
                      <label className="text-xs font-medium text-stone-700 flex flex-col gap-1">
                        <span>Nước mới (m³)</span>
                        <input
                          type="number"
                          value={waterInput}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setWaterInput(val);
                            onPreviewBilling(roomDetail.roomId, electricInput, val);
                          }}
                          className="border border-stone-300 rounded px-2 py-2 text-sm font-semibold"
                          style={{ minHeight: `${MIN_TOUCH_TARGET_SIZE}px` }}
                          data-testid="input-new-water"
                        />
                      </label>
                    </div>

                    {previewState && (
                      <div
                        className="text-xs bg-sky-50 border border-sky-200 rounded p-2 space-y-1"
                        data-testid="preview-calculation-box"
                      >
                        <div>
                          Tiền điện dự kiến:{' '}
                          <b>
                            {previewState.calculation.electricCharge.toLocaleString('vi-VN')} đ
                          </b>{' '}
                          ({previewState.calculation.electricConsumed} kWh)
                        </div>
                        <div>
                          Tiền nước dự kiến:{' '}
                          <b>
                            {previewState.calculation.waterCharge.toLocaleString('vi-VN')} đ
                          </b>{' '}
                          ({previewState.calculation.waterConsumed} m³)
                        </div>
                        <div className="text-sm font-bold text-sky-900">
                          Tổng dự kiến:{' '}
                          {previewState.calculation.totalAmount.toLocaleString('vi-VN')} đ
                        </div>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          onPreviewBilling(roomDetail.roomId, electricInput, waterInput)
                        }
                        style={{ minHeight: `${MIN_TOUCH_TARGET_SIZE}px` }}
                        className="flex-1 px-3 py-2 rounded-lg bg-stone-200 hover:bg-stone-300 text-stone-800 text-xs font-bold"
                        data-testid="btn-preview-billing"
                      >
                        Tính nháp
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          onCommitBillingReading(roomDetail.roomId, electricInput, waterInput)
                        }
                        style={{ minHeight: `${MIN_TOUCH_TARGET_SIZE}px` }}
                        className="flex-1 px-3 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold"
                        data-testid="btn-commit-billing"
                      >
                        Lưu chốt số & Tạo hóa đơn
                      </button>
                    </div>
                  </div>

                  {/* Right: Local VietQR SVG + Upload Local Bill + 1-Touch Approve */}
                  <div className="bg-white rounded-lg border border-stone-200 p-3 flex flex-col justify-between gap-2.5">
                    <div className="flex items-start gap-3">
                      <div
                        className="shrink-0 border border-stone-200 rounded p-1 bg-white"
                        data-testid="vietqr-local-svg"
                        dangerouslySetInnerHTML={{ __html: vietQrSvg }}
                      />
                      <div className="text-xs space-y-1">
                        <div className="font-bold text-stone-800">
                          VietQR Offline ({HANOI_MOTEL_BANK_INFO.bankName})
                        </div>
                        <div>STK: {HANOI_MOTEL_BANK_INFO.accountNumber}</div>
                        <div>Chủ TK: {HANOI_MOTEL_BANK_INFO.accountName}</div>
                        <div className="font-bold text-red-600 text-sm">
                          {activeAmount.toLocaleString('vi-VN')} đ
                        </div>
                        <div className="text-[11px] text-stone-500">
                          Nội dung: QLNT {roomDetail.roomNumber} T11
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <label
                        className="flex-1 inline-flex items-center justify-center px-3 py-2 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold cursor-pointer text-center"
                        style={{ minHeight: `${MIN_TOUCH_TARGET_SIZE}px` }}
                        data-testid="upload-bill-label"
                      >
                        <span>Tải ảnh Bill (Local)</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileUpload}
                          className="sr-only"
                          data-testid="input-upload-bill"
                        />
                      </label>

                      <button
                        type="button"
                        onClick={() =>
                          onUploadLocalBillImage(roomDetail.roomId, SAMPLE_LOCAL_BILL_DATA_URL)
                        }
                        style={{ minHeight: `${MIN_TOUCH_TARGET_SIZE}px` }}
                        className="px-3 py-2 rounded-lg bg-sky-100 hover:bg-sky-200 text-sky-900 text-xs font-bold"
                        data-testid="btn-simulate-bill-upload"
                      >
                        Gửi Bill Mẫu
                      </button>

                      {billingStatus !== 'PAID' && (
                        <button
                          type="button"
                          onClick={() => onApproveBillOneTouch(roomDetail.roomId)}
                          style={{ minHeight: `${MIN_TOUCH_TARGET_SIZE}px` }}
                          className="w-full px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow"
                          data-testid="btn-approve-one-touch"
                        >
                          Duyệt Bill 1 Chạm (+2 Sao Uy Tín)
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Page 2 Controls: Device Broken / Maintenance Resolution */}
            {activeTab === 'PAGE_2_DEVICES' && (
              <div className="space-y-2.5" data-testid="f04-page-2-controls">
                {brokenDevices.length > 0 && (
                  <p
                    className="text-xs md:text-sm bg-red-50 border border-red-300 rounded-lg p-2.5 text-red-900 font-medium"
                    data-testid="page-2-copywriting"
                  >
                    {GAME_COPYWRITING.deviceBroken(
                      roomDetail.roomNumber,
                      brokenDevices[0]!.name
                    )}
                  </p>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {roomDetail.devices.map((device) => (
                    <div
                      key={device.deviceId}
                      className="flex items-center justify-between gap-2 bg-white border border-stone-200 rounded-lg p-2.5"
                      data-testid={`device-control-${device.deviceId}`}
                    >
                      <div className="text-xs">
                        <div className="font-bold text-stone-800">{device.name}</div>
                        <div
                          className={
                            device.isBroken ? 'text-red-600 font-semibold' : 'text-emerald-700'
                          }
                        >
                          {device.isBroken ? 'Đang báo hỏng' : 'Hoạt động tốt'}
                        </div>
                      </div>

                      {device.isBroken ? (
                        <button
                          type="button"
                          onClick={() =>
                            onResolveDeviceMaintenance(roomDetail.roomId, device.deviceId)
                          }
                          style={{ minHeight: `${MIN_TOUCH_TARGET_SIZE}px` }}
                          className="px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
                          data-testid={`btn-resolve-device-${device.deviceId}`}
                        >
                          Hoàn tất sửa chữa
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() =>
                            onReportDeviceBroken(roomDetail.roomId, device.deviceId)
                          }
                          style={{ minHeight: `${MIN_TOUCH_TARGET_SIZE}px` }}
                          className="px-3 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold"
                          data-testid={`btn-report-broken-${device.deviceId}`}
                        >
                          Báo hỏng
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Page 3 Controls: Reputation Score + Immutable Audit Log Timeline */}
            {activeTab === 'PAGE_3_AUDIT' && (
              <div className="space-y-3" data-testid="f04-page-3-controls">
                <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-stone-200 rounded-lg p-3">
                  <div className="flex items-center gap-3">
                    <RewardBadgeSVG stars={landlordReputation} size={48} />
                    <div>
                      <div className="text-xs text-stone-500">Điểm Sao Uy Tín Khách Thuê</div>
                      <div
                        className="text-lg font-extrabold text-amber-700"
                        data-testid="tenant-reward-points"
                      >
                        {tenantRewardPoints} điểm
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-stone-500">Uy Tín Chủ Nhà</div>
                    <div
                      className="text-base font-bold text-emerald-700"
                      data-testid="landlord-reputation-score"
                    >
                      ★ {landlordReputation.toFixed(2)} / 5.00
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-stone-200 rounded-lg p-3 space-y-2 max-h-48 overflow-y-auto">
                  <h4 className="text-xs font-bold uppercase text-stone-700">
                    Dòng thời gian RoomAuditLog ({auditLogs.length})
                  </h4>
                  {auditLogs.length === 0 ? (
                    <p className="text-xs text-stone-500 italic">
                      Chưa có biến động được ghi nhận.
                    </p>
                  ) : (
                    <ul className="space-y-1.5" data-testid="audit-log-timeline">
                      {auditLogs.map((log) => (
                        <li
                          key={log.id}
                          className="text-xs border-l-2 border-amber-500 pl-2.5 py-0.5"
                          data-testid={`audit-log-item-${log.id}`}
                        >
                          <div className="flex items-center justify-between text-[11px] text-stone-500">
                            <span className="font-semibold text-stone-700">
                              {log.action_type} ({log.actor_role})
                            </span>
                            <span>{log.created_at.slice(0, 19).replace('T', ' ')}</span>
                          </div>
                          <div className="text-stone-800">{log.change_summary}</div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
