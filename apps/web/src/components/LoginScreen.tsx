import React, { useState } from 'react';
import { MIN_TOUCH_TARGET_SIZE } from '@qlnt/renderer-2d';
import type { Landlord } from '@qlnt/shared-types';
import type { RegisterLandlordInput } from '../bridge/ledgerController';

export interface LoginScreenProps {
  isOpen: boolean;
  isMobileViewport?: boolean;
  onLogin: (phoneOrEmail: string, pin: string) => Promise<void>;
  onQuickDemoLogin: () => Promise<void>;
  onRegisterLandlord: (input: RegisterLandlordInput) => Promise<void>;
  onClose?: () => void;
}

type AuthTabMode = 'LOGIN' | 'REGISTER';

export const LoginScreen: React.FC<LoginScreenProps> = ({
  isOpen,
  isMobileViewport = false,
  onLogin,
  onQuickDemoLogin,
  onRegisterLandlord,
  onClose,
}) => {
  const [mode, setMode] = useState<AuthTabMode>('LOGIN');
  const [identity, setIdentity] = useState('0988123456');
  const [loginPin, setLoginPin] = useState('123456');

  const [registerName, setRegisterName] = useState('');
  const [registerPhone, setRegisterPhone] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPin, setRegisterPin] = useState('');
  const [packageTier, setPackageTier] = useState<Landlord['package_tier']>('FREE');

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) {
    return null;
  }

  const handleLoginSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      await onLogin(identity.trim(), loginPin.trim());
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Đăng nhập thất bại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickDemo = async () => {
    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      await onQuickDemoLogin();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Không thể đăng nhập Demo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegisterSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      await onRegisterLandlord({
        name: registerName.trim(),
        phone: registerPhone.trim(),
        email: registerEmail.trim() || undefined,
        pin: registerPin.trim(),
        packageTier,
      });
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Đăng ký Chủ trọ thất bại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-stone-950/80 backdrop-blur-sm p-3 overflow-y-auto"
      style={{ zIndex: 30 }}
      data-testid="login-screen"
      role="dialog"
      aria-modal="true"
      aria-label="Đăng nhập hoặc Đăng ký Chủ trọ"
    >
      <div
        className={`w-full rounded-2xl bg-amber-50 border-2 border-amber-900/40 shadow-2xl text-stone-900 overflow-hidden ${
          isMobileViewport ? 'max-w-[374px]' : 'max-w-md'
        }`}
      >
        {/* Warm Ledger Header */}
        <div className="bg-stone-900 text-amber-100 px-4 py-3.5 border-b border-amber-800/60 flex items-start justify-between gap-2">
          <div>
            <p className="text-[11px] uppercase tracking-wider font-bold text-amber-400">
              Sổ Quản Lý Nhà Trọ 100% Local-First
            </p>
            <h2 className="text-base font-extrabold text-amber-100 mt-0.5">
              Cổng Chủ Trọ QLNT
            </h2>
          </div>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              style={{ minHeight: `${MIN_TOUCH_TARGET_SIZE}px` }}
              className="px-3 py-2 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-bold border border-stone-600 transition-colors"
              data-testid="btn-close-login-screen"
            >
              Đóng
            </button>
          )}
        </div>

        {/* Mode Tabs */}
        <div className="grid grid-cols-2 gap-2 p-3 bg-amber-100/70 border-b border-amber-200">
          <button
            type="button"
            onClick={() => {
              setMode('LOGIN');
              setErrorMessage(null);
            }}
            style={{ minHeight: `${MIN_TOUCH_TARGET_SIZE}px` }}
            className={`px-3 py-2 rounded-xl text-xs font-bold border transition-colors ${
              mode === 'LOGIN'
                ? 'bg-amber-700 text-white border-amber-800 shadow-sm'
                : 'bg-white text-stone-700 border-stone-300 hover:bg-amber-50'
            }`}
            data-testid="tab-login-mode"
          >
            Đăng nhập Chủ trọ
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('REGISTER');
              setErrorMessage(null);
            }}
            style={{ minHeight: `${MIN_TOUCH_TARGET_SIZE}px` }}
            className={`px-3 py-2 rounded-xl text-xs font-bold border transition-colors ${
              mode === 'REGISTER'
                ? 'bg-amber-700 text-white border-amber-800 shadow-sm'
                : 'bg-white text-stone-700 border-stone-300 hover:bg-amber-50'
            }`}
            data-testid="tab-register-mode"
          >
            Đăng ký Chủ trọ mới
          </button>
        </div>

        <div className="p-4 space-y-3">
          {errorMessage && (
            <div
              className="rounded-lg bg-red-100 border border-red-300 px-3 py-2 text-xs font-semibold text-red-800"
              data-testid="login-error-banner"
            >
              {errorMessage}
            </div>
          )}

          {mode === 'LOGIN' ? (
            <form onSubmit={(e) => void handleLoginSubmit(e)} className="space-y-3">
              <label className="block text-xs font-bold text-stone-700">
                <span>Số điện thoại hoặc Email</span>
                <input
                  type="text"
                  value={identity}
                  onChange={(e) => setIdentity(e.target.value)}
                  placeholder="0988123456 hoặc email"
                  required
                  className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-sm font-semibold text-stone-900 focus:border-amber-600 focus:outline-none"
                  data-testid="input-login-identity"
                />
              </label>

              <label className="block text-xs font-bold text-stone-700">
                <span>Mã PIN cục bộ</span>
                <input
                  type="password"
                  value={loginPin}
                  onChange={(e) => setLoginPin(e.target.value)}
                  placeholder="Nhập mã PIN (mặc định: 123456)"
                  required
                  className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-sm font-semibold text-stone-900 focus:border-amber-600 focus:outline-none"
                  data-testid="input-login-pin"
                />
              </label>

              <p className="text-[11px] text-stone-600 bg-amber-100/80 border border-amber-200 rounded-lg px-2.5 py-2">
                Tài khoản Demo Hà Nội: <strong>0988123456</strong> • PIN:{' '}
                <strong>123456</strong> (Lưu offline 100% trên IndexedDB).
              </p>

              <button
                type="submit"
                disabled={isSubmitting}
                style={{ minHeight: `${MIN_TOUCH_TARGET_SIZE}px` }}
                className="w-full rounded-xl bg-amber-700 hover:bg-amber-600 disabled:opacity-60 text-white text-sm font-bold px-4 py-2.5 shadow transition-colors"
                data-testid="btn-submit-login"
              >
                {isSubmitting ? 'Đang kiểm tra...' : 'Đăng nhập Sổ Quản Lý'}
              </button>

              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-stone-300" />
                <span className="shrink mx-2 text-[11px] font-semibold text-stone-500">
                  hoặc
                </span>
                <div className="flex-grow border-t border-stone-300" />
              </div>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => void handleQuickDemo()}
                style={{ minHeight: `${MIN_TOUCH_TARGET_SIZE}px` }}
                className="w-full rounded-xl bg-stone-800 hover:bg-stone-700 disabled:opacity-60 text-amber-200 text-xs font-bold px-4 py-2.5 border border-stone-700 shadow-sm transition-colors"
                data-testid="btn-quick-demo-login"
              >
                ⚡ Đăng nhập nhanh Chủ trọ Demo Hà Nội (12 phòng)
              </button>
            </form>
          ) : (
            <form onSubmit={(e) => void handleRegisterSubmit(e)} className="space-y-2.5">
              <label className="block text-xs font-bold text-stone-700">
                <span>Họ và tên Chủ trọ *</span>
                <input
                  type="text"
                  value={registerName}
                  onChange={(e) => setRegisterName(e.target.value)}
                  placeholder="VD: Trần Quốc Tuấn"
                  required
                  className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm font-semibold text-stone-900 focus:border-amber-600 focus:outline-none"
                  data-testid="input-register-name"
                />
              </label>

              <label className="block text-xs font-bold text-stone-700">
                <span>Số điện thoại (10 số) *</span>
                <input
                  type="tel"
                  value={registerPhone}
                  onChange={(e) => setRegisterPhone(e.target.value)}
                  placeholder="0912345678"
                  required
                  className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm font-semibold text-stone-900 focus:border-amber-600 focus:outline-none"
                  data-testid="input-register-phone"
                />
              </label>

              <label className="block text-xs font-bold text-stone-700">
                <span>Email (không bắt buộc)</span>
                <input
                  type="email"
                  value={registerEmail}
                  onChange={(e) => setRegisterEmail(e.target.value)}
                  placeholder="tuan.tran@qlnt.local"
                  className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm font-semibold text-stone-900 focus:border-amber-600 focus:outline-none"
                  data-testid="input-register-email"
                />
              </label>

              <label className="block text-xs font-bold text-stone-700">
                <span>Mã PIN đăng nhập (4-8 ký tự) *</span>
                <input
                  type="password"
                  value={registerPin}
                  onChange={(e) => setRegisterPin(e.target.value)}
                  placeholder="VD: 654321"
                  required
                  className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm font-semibold text-stone-900 focus:border-amber-600 focus:outline-none"
                  data-testid="input-register-pin"
                />
              </label>

              <div className="space-y-1">
                <span className="block text-xs font-bold text-stone-700">
                  Gói quản lý
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPackageTier('FREE')}
                    style={{ minHeight: `${MIN_TOUCH_TARGET_SIZE}px` }}
                    className={`rounded-lg px-3 py-2 text-xs font-bold border transition-colors ${
                      packageTier === 'FREE'
                        ? 'bg-emerald-700 text-white border-emerald-800'
                        : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-50'
                    }`}
                    data-testid="btn-tier-FREE"
                  >
                    Gói FREE ($0 First)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPackageTier('PRO')}
                    style={{ minHeight: `${MIN_TOUCH_TARGET_SIZE}px` }}
                    className={`rounded-lg px-3 py-2 text-xs font-bold border transition-colors ${
                      packageTier === 'PRO'
                        ? 'bg-amber-700 text-white border-amber-800'
                        : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-50'
                    }`}
                    data-testid="btn-tier-PRO"
                  >
                    Gói PRO (Nhiều tòa)
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                style={{ minHeight: `${MIN_TOUCH_TARGET_SIZE}px` }}
                className="w-full rounded-xl bg-amber-700 hover:bg-amber-600 disabled:opacity-60 text-white text-sm font-bold px-4 py-2.5 shadow transition-colors"
                data-testid="btn-submit-register"
              >
                {isSubmitting
                  ? 'Đang tạo tài khoản...'
                  : 'Tạo Tài Khoản & Thiết Lập Tòa Nhà'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
