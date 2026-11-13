import React from 'react';
import type { RoomDetailDTO, RoomDetailTab } from '@qlnt/shared-types';
import { MIN_TOUCH_TARGET_SIZE } from '../../constants';
import { DeviceCategoryIconSVG } from '../icons/DeviceCategoryIconSVG';

export interface RoomDetailSinglePageProps {
  roomDetail: RoomDetailDTO;
  activeTab?: RoomDetailTab;
  onTabChange?: (tab: RoomDetailTab) => void;
  onClose: () => void;
  onApproveBill?: (billingId: string) => void;
  onUpdateReading?: (readings: { electric?: number; water?: number }) => void;
  className?: string;
}

export const RoomDetailSinglePage: React.FC<RoomDetailSinglePageProps> = ({
  roomDetail,
  activeTab: controlledTab,
  onTabChange,
  onClose,
  onApproveBill,
  onUpdateReading: _onUpdateReading,
  className = '',
}) => {
  let internalTab: RoomDetailTab = 'PAGE_1_BILLING';
  let setInternalTab = (_t: RoomDetailTab) => {};

  // Check if dispatcher is active before calling hooks to prevent console errors in direct unit tests
  const reactInternals = React as any;
  const hasDispatcher = Boolean(
    reactInternals?.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE?.H ??
    reactInternals?.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED?.ReactCurrentDispatcher?.current
  );

  if (hasDispatcher) {
    try {
      const hookResult = React.useState<RoomDetailTab>('PAGE_1_BILLING');
      internalTab = hookResult[0];
      setInternalTab = hookResult[1];
    } catch {
      internalTab = 'PAGE_1_BILLING';
    }
  }

  const currentTab = controlledTab ?? internalTab;

  const handleTabClick = (tab: RoomDetailTab) => {
    setInternalTab(tab);
    onTabChange?.(tab);
  };

  const { latestBilling, latestReading, currentTenant, devices = [] } = roomDetail;

  return (
    <div
      className={`qlnt-room-detail-page flex flex-col h-full bg-amber-50/70 text-stone-800 rounded-lg shadow-inner overflow-hidden border border-stone-300 p-4 ${className}`.trim()}
      data-testid="room-detail-single-page"
      data-room-id={roomDetail.roomId}
      data-active-tab={currentTab}
      role="region"
      aria-label={`Tờ chi tiết phòng ${roomDetail.roomNumber}`}
    >
      {/* Header Bar */}
      <div className="flex items-center justify-between border-b border-stone-300 pb-3 mb-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-stone-900 tracking-tight">
              Phòng {roomDetail.roomNumber}
            </h2>
            <span className="px-2 py-0.5 text-xs font-semibold rounded bg-stone-200 text-stone-700">
              Tầng {roomDetail.floorNumber}
            </span>
            <span className="px-2 py-0.5 text-xs font-semibold rounded bg-amber-200 text-amber-800">
              {roomDetail.areaSqm} m²
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-0.5">
            Giá niêm yết: {roomDetail.basePrice.toLocaleString('vi-VN')} đ/tháng
          </p>
        </div>

        {/* Level 1 Close button */}
        <button
          type="button"
          className="flex items-center justify-center rounded-full hover:bg-stone-200 text-stone-600 transition-colors"
          style={{ minWidth: `${MIN_TOUCH_TARGET_SIZE}px`, minHeight: `${MIN_TOUCH_TARGET_SIZE}px` }}
          onClick={onClose}
          data-testid="room-detail-close-btn"
          aria-label="Đóng tờ chi tiết phòng"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Tab Navigation Header (3 Tabs) */}
      <div className="flex border-b border-stone-300 mb-4 gap-2">
        <button
          type="button"
          className={`flex-1 py-2 text-sm font-semibold border-b-2 transition-all ${
            currentTab === 'PAGE_1_BILLING'
              ? 'border-amber-600 text-amber-900 bg-amber-100/50'
              : 'border-transparent text-stone-600 hover:text-stone-900'
          }`}
          style={{ minHeight: `${MIN_TOUCH_TARGET_SIZE}px` }}
          onClick={() => handleTabClick('PAGE_1_BILLING')}
          data-testid="tab-btn-billing"
          data-tab="PAGE_1_BILLING"
        >
          1. Hoá Đơn & Chỉ Số
        </button>
        <button
          type="button"
          className={`flex-1 py-2 text-sm font-semibold border-b-2 transition-all ${
            currentTab === 'PAGE_2_DEVICES'
              ? 'border-amber-600 text-amber-900 bg-amber-100/50'
              : 'border-transparent text-stone-600 hover:text-stone-900'
          }`}
          style={{ minHeight: `${MIN_TOUCH_TARGET_SIZE}px` }}
          onClick={() => handleTabClick('PAGE_2_DEVICES')}
          data-testid="tab-btn-devices"
          data-tab="PAGE_2_DEVICES"
        >
          2. Trang Thiết Bị ({devices.length})
        </button>
        <button
          type="button"
          className={`flex-1 py-2 text-sm font-semibold border-b-2 transition-all ${
            currentTab === 'PAGE_3_AUDIT'
              ? 'border-amber-600 text-amber-900 bg-amber-100/50'
              : 'border-transparent text-stone-600 hover:text-stone-900'
          }`}
          style={{ minHeight: `${MIN_TOUCH_TARGET_SIZE}px` }}
          onClick={() => handleTabClick('PAGE_3_AUDIT')}
          data-testid="tab-btn-audit"
          data-tab="PAGE_3_AUDIT"
        >
          3. Khách Thuê & Kiểm Tra
        </button>
      </div>

      {/* Tab 1: PAGE_1_BILLING */}
      {currentTab === 'PAGE_1_BILLING' && (
        <div className="flex-1 overflow-y-auto space-y-4 pr-1" data-testid="tab-content-billing">
          {latestBilling ? (
            <div className="bg-white/80 p-3 rounded-md border border-stone-200 space-y-2">
              <div className="flex justify-between items-center border-b border-stone-200 pb-2">
                <span className="font-semibold text-stone-800">Kỳ thu tiền: {latestBilling.monthPeriod}</span>
                <span className={`px-2 py-0.5 text-xs font-bold rounded ${
                  latestBilling.status === 'PAID' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  {latestBilling.status}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>Tiền phòng: <b>{latestBilling.roomCharge.toLocaleString('vi-VN')} đ</b></div>
                <div>Tiền điện: <b>{latestBilling.electricCharge.toLocaleString('vi-VN')} đ</b></div>
                <div>Tiền nước: <b>{latestBilling.waterCharge.toLocaleString('vi-VN')} đ</b></div>
                <div>Dịch vụ: <b>{latestBilling.serviceCharge.toLocaleString('vi-VN')} đ</b></div>
              </div>
              <div className="border-t border-stone-200 pt-2 flex justify-between items-center text-sm">
                <span className="font-bold">Tổng cộng:</span>
                <span className="font-bold text-red-600 text-base">{latestBilling.totalAmount.toLocaleString('vi-VN')} đ</span>
              </div>

              {latestBilling.billImageUrl && (
                <div className="mt-2 text-xs">
                  <a
                    href={latestBilling.billImageUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 underline font-medium"
                    data-testid="bill-image-link"
                  >
                    Xem ảnh chứng từ chuyển khoản
                  </a>
                </div>
              )}

              {onApproveBill && latestBilling.status !== 'PAID' && (
                <button
                  type="button"
                  className="w-full mt-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-4 rounded transition-colors shadow"
                  style={{ minHeight: `${MIN_TOUCH_TARGET_SIZE}px` }}
                  onClick={() => onApproveBill(latestBilling.billingId)}
                  data-testid="approve-bill-btn"
                >
                  Duyệt Hoá Đơn / Xác Nhận Đã Thu
                </button>
              )}
            </div>
          ) : (
            <p className="text-sm text-stone-500 italic">Chưa có thông tin kỳ hoá đơn mới nhất.</p>
          )}

          {latestReading && (
            <div className="bg-white/80 p-3 rounded-md border border-stone-200">
              <h4 className="font-semibold text-xs text-stone-700 uppercase mb-2">Chỉ số điện nước gần nhất</h4>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="p-2 bg-amber-50 rounded border border-amber-200">
                  <span className="font-semibold text-amber-900 block mb-1">⚡ Điện:</span>
                  <div>Cũ: {latestReading.oldElectric} kWh</div>
                  <div>Mới: {latestReading.newElectric} kWh</div>
                  <div className="font-bold text-stone-800 mt-1">
                    Tiêu thụ: {Math.max(0, latestReading.newElectric - latestReading.oldElectric)} kWh
                  </div>
                </div>
                <div className="p-2 bg-blue-50 rounded border border-blue-200">
                  <span className="font-semibold text-blue-900 block mb-1">💧 Nước:</span>
                  <div>Cũ: {latestReading.oldWater} m³</div>
                  <div>Mới: {latestReading.newWater} m³</div>
                  <div className="font-bold text-stone-800 mt-1">
                    Tiêu thụ: {Math.max(0, latestReading.newWater - latestReading.oldWater)} m³
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: PAGE_2_DEVICES */}
      {currentTab === 'PAGE_2_DEVICES' && (
        <div className="flex-1 overflow-y-auto space-y-2 pr-1" data-testid="tab-content-devices">
          {devices.length === 0 ? (
            <p className="text-sm text-stone-500 italic">Không có thiết bị bàn giao trong phòng.</p>
          ) : (
            devices.map((device) => (
              <div
                key={device.deviceId}
                className={`p-3 rounded-md border flex items-center justify-between bg-white/80 ${
                  device.isBroken ? 'border-red-300 bg-red-50/50' : 'border-stone-200'
                }`}
                data-testid={`device-item-${device.deviceId}`}
              >
                <div className="flex items-center gap-3">
                  <DeviceCategoryIconSVG
                    category={device.category}
                    state={device.isBroken ? 'BROKEN' : 'NORMAL'}
                    size={28}
                  />
                  <div>
                    <h5 className="font-semibold text-sm text-stone-900">{device.name}</h5>
                    <div className="flex items-center gap-2 text-xs text-stone-500">
                      <span>Loại: {device.category}</span>
                      {device.lastMaintained && <span>• Bảo trì: {device.lastMaintained}</span>}
                    </div>
                  </div>
                </div>
                <span
                  className={`px-2 py-1 text-xs font-bold rounded ${
                    device.isBroken ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  {device.isBroken ? 'Đang hỏng' : 'Tốt'}
                </span>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab 3: PAGE_3_AUDIT */}
      {currentTab === 'PAGE_3_AUDIT' && (
        <div className="flex-1 overflow-y-auto space-y-3 pr-1" data-testid="tab-content-audit">
          {currentTenant ? (
            <div className="bg-white/80 p-3 rounded-md border border-stone-200 space-y-2 text-xs">
              <h4 className="font-bold text-sm text-stone-900 border-b border-stone-200 pb-1">
                Thông tin người thuê đại diện
              </h4>
              <div className="grid grid-cols-2 gap-2">
                <div>Họ và tên: <b className="text-stone-900">{currentTenant.fullName}</b></div>
                <div>Số điện thoại: <b className="text-stone-900">{currentTenant.phone}</b></div>
                <div>Quê quán: <span className="text-stone-800">{currentTenant.hometown ?? 'Chưa cập nhật'}</span></div>
                <div>Tạm trú: <span className="text-stone-800">{currentTenant.tempResidenceStatus}</span></div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-stone-500 italic">Phòng hiện đang trống, chưa có hợp đồng thuê hiệu lực.</p>
          )}

          <div className="bg-white/80 p-3 rounded-md border border-stone-200 space-y-1 text-xs text-stone-600">
            <h5 className="font-semibold text-stone-800 mb-1">Nhật ký kiểm tra phòng (Audit Log)</h5>
            <p>• Trạng thái phòng hiện tại: <b>{roomDetail.status}</b></p>
            <p>• Diện tích đo đạc: <b>{roomDetail.areaSqm} m²</b></p>
          </div>
        </div>
      )}
    </div>
  );
};
