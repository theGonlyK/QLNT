import { useState } from 'react';
import { MIN_TOUCH_TARGET_SIZE } from '@qlnt/renderer-2d';
import { useRendererBridge } from './bridge/useRendererBridge';
import type { LedgerController } from './bridge/ledgerController';
import { Canvas3DStage } from './components/Canvas3DStage';
import { LedgerOverlayHost } from './components/LedgerOverlayHost';
import { LoginScreen } from './components/LoginScreen';
import { BuildingSetupModal } from './components/BuildingSetupModal';

export interface AppMetadata {
  name: string;
  title: string;
  viewport: string;
  mobilePreset: {
    width: number;
    height: number;
  };
}

export function getAppMetadata(): AppMetadata {
  return {
    name: '@qlnt/web',
    title: 'QLNT — Prototype P1 (Sổ Quản Lý Ảo F04)',
    viewport: 'width=device-width, initial-scale=1.0',
    mobilePreset: {
      width: 390,
      height: 844,
    },
  };
}

export interface AppProps {
  initialMobileViewport?: boolean;
  controller?: LedgerController;
}

export function App(props: AppProps) {
  const { initialMobileViewport = false, controller } = props;
  const metadata = getAppMetadata();
  const [isMobileViewport, setIsMobileViewport] = useState<boolean>(initialMobileViewport);
  const [isLoginOpen, setIsLoginOpen] = useState<boolean>(false);
  const [isBuildingSetupOpen, setIsBuildingSetupOpen] = useState<boolean>(false);
  const bridge = useRendererBridge(controller);

  return (
    <main
      className={`min-h-screen bg-stone-950 text-stone-100 flex flex-col transition-all ${
        isMobileViewport
          ? 'w-[390px] max-w-[390px] min-h-[844px] mx-auto border-x-4 border-amber-700/60 shadow-2xl'
          : 'w-full'
      }`}
      data-testid="qlnt-web-app"
      data-viewport-mode={isMobileViewport ? 'mobile-390x844' : 'desktop'}
    >
      {/* Top HUD Bar */}
      <header className="bg-stone-900 border-b border-stone-700 px-3 py-2.5 md:px-5 flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-400 shrink-0" />
            <h1 className="font-bold text-sm md:text-base text-amber-200 truncate">
              {bridge.propertyName}
            </h1>
          </div>
          <p className="text-[11px] text-stone-400 truncate">
            {bridge.propertyAddress} • {metadata.title}
          </p>
        </div>

        {/* Quick Stats Pills */}
        <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-semibold">
          <span className="px-2 py-1 rounded bg-slate-800 text-slate-200">
            Đang ở: {bridge.summary.occupiedCount}/{bridge.summary.totalRooms}
          </span>
          <span
            className="px-2 py-1 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
            data-testid="hud-total-area"
          >
            Tổng DT: {bridge.summary.totalAreaSqm} m²
          </span>
          <span
            className="px-2 py-1 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40"
            data-testid="hud-payment-due-count"
          >
            Chờ thu: {bridge.summary.paymentDueCount}
          </span>
          <span
            className="px-2 py-1 rounded bg-sky-500/20 text-sky-300 border border-sky-500/40"
            data-testid="hud-pending-verify-count"
          >
            Chờ duyệt: {bridge.summary.pendingVerifyCount}
          </span>
          <span
            className="px-2 py-1 rounded bg-red-500/20 text-red-300 border border-red-500/40"
            data-testid="hud-broken-count"
          >
            Báo hỏng: {bridge.summary.brokenDeviceCount}
          </span>
        </div>

        {/* Primary HUD Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setIsLoginOpen(true)}
            style={{ minHeight: `${MIN_TOUCH_TARGET_SIZE}px` }}
            className="px-3 py-2 rounded-lg bg-stone-800 hover:bg-stone-700 text-amber-200 text-xs font-bold border border-stone-600 transition-colors"
            data-testid="open-login-screen-btn"
          >
            {bridge.isAuthenticated && bridge.landlord
              ? `Chủ trọ: ${bridge.landlord.name}`
              : 'Tài khoản / Đăng nhập'}
          </button>

          <button
            type="button"
            onClick={() => setIsBuildingSetupOpen(true)}
            style={{ minHeight: `${MIN_TOUCH_TARGET_SIZE}px` }}
            className="px-3 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold border border-emerald-600 transition-colors"
            data-testid="open-building-setup-btn"
          >
            Đăng ký Diện tích & Phòng
          </button>

          <button
            type="button"
            onClick={() => setIsMobileViewport((prev) => !prev)}
            style={{ minHeight: `${MIN_TOUCH_TARGET_SIZE}px` }}
            className="px-3 py-2 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-bold border border-stone-600 transition-colors"
            data-testid="toggle-viewport-btn"
          >
            {isMobileViewport ? 'Chế độ Desktop' : 'Mobile 390x844'}
          </button>

          <button
            type="button"
            onClick={() => void bridge.openBookForFloor(bridge.currentFloor)}
            style={{ minHeight: `${MIN_TOUCH_TARGET_SIZE}px` }}
            className="px-3.5 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow transition-colors"
            data-testid="open-ledger-book-btn"
          >
            Mở Sổ Quản Lý F04
          </button>
        </div>
      </header>

      {/* Optional Error / Status Banner */}
      {bridge.error && (
        <div
          className="bg-red-900/90 text-red-100 px-4 py-2 text-xs font-medium"
          data-testid="bridge-error-banner"
        >
          Lỗi khởi tạo dữ liệu Local: {bridge.error}
        </div>
      )}

      {bridge.statusBanner && (
        <div
          className="bg-emerald-900/90 text-emerald-100 px-4 py-2 text-xs font-medium flex items-center justify-between gap-2"
          data-testid="bridge-status-banner"
        >
          <span>{bridge.statusBanner}</span>
          <button
            type="button"
            onClick={bridge.clearStatusBanner}
            style={{ minHeight: `${MIN_TOUCH_TARGET_SIZE}px` }}
            className="px-2.5 py-1 rounded bg-emerald-800 hover:bg-emerald-700 text-xs font-bold"
          >
            Ẩn
          </button>
        </div>
      )}

      {/* Main 3D Isometric Stage (z-index: 10) */}
      <div className="flex-1 p-2 md:p-4 flex flex-col">
        <Canvas3DStage
          roomsWithNotices={bridge.roomsWithNotices}
          totalFloors={bridge.totalFloors}
          viewMode={bridge.viewMode}
          activeFloorIndex={bridge.activeFloorIndex}
          currentBlockPresetId={bridge.currentBlockPresetId}
          onSelectBlockPreset={(presetId) => void bridge.applyBuildingBlockPreset(presetId)}
          onAttachRenderer={bridge.attachRenderer}
          onSelectFloor={(floorNum) => void bridge.openBookForFloor(floorNum)}
          onSelectFloorCutaway={(floorIndex) => void bridge.selectFloor(floorIndex)}
          onBackToBuilding={() => void bridge.backToBuilding()}
          onSelectRoom={(roomId, tab) => void bridge.openRoomDetailFromFloor(roomId, tab)}
          isMobileViewport={isMobileViewport}
        />
      </div>

      {/* Virtual Ledger Book Overlay (z-index: 20) */}
      <LedgerOverlayHost
        isBookOpen={bridge.isBookOpen}
        currentFloor={bridge.currentFloor}
        totalFloors={bridge.totalFloors}
        floorMap={bridge.floorMap}
        roomDetail={bridge.roomDetail}
        activeTab={bridge.activeTab}
        previewState={bridge.previewState}
        auditLogs={bridge.auditLogs}
        tenantRewardPoints={bridge.tenantRewardPoints}
        landlordReputation={bridge.landlordReputation}
        isMobileViewport={isMobileViewport}
        onFlipFloor={(floorNum) => void bridge.flipFloor(floorNum)}
        onOpenRoomDetail={(roomId) => void bridge.openRoomDetail(roomId)}
        onSwitchTab={(roomId, tab) => void bridge.switchRoomTab(roomId, tab)}
        onPreviewBilling={(roomId, e, w) => bridge.previewRoomBilling(roomId, e, w)}
        onCommitBillingReading={(roomId, e, w) =>
          void bridge.commitRoomBillingReading(roomId, e, w)
        }
        onUploadLocalBillImage={(roomId, dataUrl) =>
          void bridge.uploadLocalBillImage(roomId, dataUrl)
        }
        onApproveBillOneTouch={(roomId) => void bridge.approveRoomBillOneTouch(roomId)}
        onReportDeviceBroken={(roomId, deviceId) =>
          void bridge.reportDeviceBroken(roomId, deviceId)
        }
        onResolveDeviceMaintenance={(roomId, deviceId) =>
          void bridge.resolveDeviceMaintenance(roomId, deviceId)
        }
        onCloseRoomDetail={() => {
          if (bridge.viewMode === 'FLOOR_3D') {
            void bridge.closeLedgerBookTo3DScene();
          } else {
            void bridge.closeRoomDetailToFloorMap();
          }
        }}
        onCloseBook={() => void bridge.closeLedgerBookTo3DScene()}
      />

      {/* Landlord Login / Register Screen (z-index: 30) */}
      <LoginScreen
        isOpen={isLoginOpen}
        isMobileViewport={isMobileViewport}
        onLogin={async (phoneOrEmail, pin) => {
          await bridge.loginLandlord(phoneOrEmail, pin);
          setIsLoginOpen(false);
        }}
        onQuickDemoLogin={async () => {
          await bridge.loginDemoLandlord();
          setIsLoginOpen(false);
        }}
        onRegisterLandlord={async (input) => {
          await bridge.registerLandlord(input);
          setIsLoginOpen(false);
          setIsBuildingSetupOpen(true);
        }}
        onClose={() => setIsLoginOpen(false)}
      />

      {/* Building Area & Room Count Setup Modal (z-index: 35) */}
      <BuildingSetupModal
        isOpen={isBuildingSetupOpen}
        property={bridge.property}
        rooms={bridge.roomsWithNotices.map((item) => item.room)}
        isMobileViewport={isMobileViewport}
        onSaveBuilding={async (input) => {
          await bridge.registerOrUpdateBuilding(input);
        }}
        onClose={() => setIsBuildingSetupOpen(false)}
      />
    </main>
  );
}

export default App;
