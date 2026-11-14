# Báo cáo Kiểm thử Trình duyệt Thực tế (Playwright E2E) — Prototype P1 (`@qlnt/web`)

- **Dự án:** Quản lý nhà trọ (QLNT)
- **Ngày kiểm thử:** `2026-11-14`
- **Môi trường thực thi:** Google Chrome (`channel: 'chrome'`, headless) qua `@playwright/test` trên `vite preview` cục bộ (`http://127.0.0.1:4173`, `$0`, không kết nối bên thứ 3 theo `QLNT-D016`)
- **Bộ test thực thi:** [`apps/web/e2e/p1-flows.spec.ts`](../apps/web/e2e/p1-flows.spec.ts)
- **Kết quả tổng hợp:** **3/3 E2E Test Suites PASS (`3.8s`)**, **0 console errors**, **0 page errors**, **0 external network requests**.

---

## 1. Bảng Kết quả Ánh xạ Kịch bản Kiểm thử `TC-P1-01..12`

| Mã TC | Nội dung Kiểm thử | Kết quả | Bằng chứng / Ghi chú Thực tế |
| :---: | :--- | :---: | :--- |
| **TC-P1-01** | Tòa nhà 3 tầng, 12 phòng (`P101`–`P304`) trên Cảnh 3D Isometric & Mặt bằng 2D | **PASS** | Hiển thị đủ 3 tầng và 12 phòng trên `canvas-3d-stage` & `virtual-ledger-book`, lưu `IndexedDB`. |
| **TC-P1-02** | Hồ sơ Khách thuê & Hợp đồng (Trang 1 Sổ F04) + Nhật ký Trang 3 | **PASS** | Hiển thị thông tin khách thuê, ghi nhận biến động vào `audit-log-timeline` Trang 3. |
| **TC-P1-03** | Báo hỏng Thiết bị Trang 2 → Bật Chấm than đỏ → Hoàn tất sửa chữa → Tắt Chấm than đỏ | **PASS** | Nút `Báo hỏng` bật cảnh báo đỏ, nút `Hoàn tất sửa chữa` tắt `red-notice-P102` trên Cảnh 3D. |
| **TC-P1-04** | Chốt chỉ số Điện/Nước → Sinh **VietQR SVG Offline** → Tải ảnh Bill local | **PASS** | `vietqr-local-svg` kết xuất `<svg>` cục bộ, `0` request mạng ngoài; nút `Gửi Bill Mẫu` chuyển sang `PENDING_APPROVAL`. |
| **TC-P1-05** | Chủ trọ Duyệt Bill 1 Chạm → Đóng nhiệm vụ thu tiền, tắt Chấm than vàng, `+2` Sao Uy Tín | **PASS** | `btn-approve-one-touch` tắt `yellow-notice-P101` trên Cảnh 3D và cộng `+2` điểm uy tín trên Trang 3. |
| **TC-P1-06** | Phân quyền Sale trọ & Chặn API `403` (`Multi-tenant` Cloud) | **N/A (Pha sau)** | Ngoài phạm vi Prototype P1 local (`QLNT-D016` chưa kết nối Cloud/Auth). |
| **TC-P1-07** | Ranh giới `Preview State` (nhập nháp chưa lưu) ↔ `Commit State` (dữ liệu thật) | **PASS** | Nhập điện mới `1350` hiển thị `preview-state-badge` & `preview-calculation-box`; bấm `Lưu chốt số` mới ghi thật. |
| **TC-P1-08** | Đổi điểm thưởng & Mua Sao uy tín tòa nhà (`F07`) | **N/A (Pha sau)** | Trang 3 đã hiển thị điểm Sao Uy Tín hiện tại; luồng đổi voucher thuộc pha sau. |
| **TC-P1-09** | Bản đồ Tìm phòng Công khai (`F06`) & Bảo vệ Riêng tư | **N/A (Pha sau)** | Ngoài phạm vi Prototype P1 (tập trung Sổ Quản lý Ảo F04). |
| **TC-P1-10** | Giao diện **Mobile `390x844`** `Single-Page` 3 Trang, vùng chạm `>= 44px`, Đóng Sổ 2 cấp | **PASS** | Không tràn ngang (`scrollWidth <= clientWidth + 2`), nút bấm `>= 44px`, chuyển tầng & đóng 2 cấp mượt. |
| **TC-P1-11** | Chỉnh sửa trực tiếp (`In-place Edit`) & Nhật ký bất biến Trang 3 (`Read-only`) | **PASS** | `audit-log-timeline` Trang 3 có `0` nút sửa/xóa (`Read-only` hoàn toàn). |
| **TC-P1-12** | Chế độ **Offline (`setOffline(true)`)** đọc/ghi mượt qua `IndexedDB` | **PASS** | Mở Sổ F04, chuyển tầng 2, mở phòng `P201`, chuyển Trang 1→2→3 và đóng Sổ 2 cấp thành công khi ngắt mạng hoàn toàn. |

---

## 2. Ảnh Chụp Màn hình Đối chứng

* Desktop Cảnh 3D Isometric: `apps/web/e2e-results/screenshots/01-desktop-3d-stage.png`
* Desktop Sổ F04 Trang 1 (VietQR Offline & Chốt điện nước): `apps/web/e2e-results/screenshots/02-desktop-f04-page1-vietqr.png`
* Mobile `390x844` Sổ F04 Offline Mode: `apps/web/e2e-results/screenshots/03-mobile-390x844-f04-offline.png`
