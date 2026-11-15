# Đặc tả Kỹ thuật (Spec): Hiệu Ứng Chuyển Cảnh Mở Sổ Quản Lý ẢO 3D (3D Pop-up / Flipbook Metaphor)

- **Mã tính năng:** `QLNT-FEAT-3D-BOOK-OPEN-POPUP-TRANSITION`
- **Phiên bản:** `1.0`
- **Ngày lập:** `2026-11-16`
- **Trạng thái:** `Dự thảo — Chờ Chủ dự án duyệt trước khi triển khai`
- **Tài liệu tham khảo đối chiếu:** `REF-BIZ-001` (`2.Tai_lieu_tham_khao/3.Tai_lieu_nghiep_vu/REF_SO_QUAN_LY_AO_3D.md`) và Video tham khảo "Augmented Physics 3D Book" (@techartist_ / dealonai).

---

## 1. Mục tiêu Nghiệp vụ & Trải nghiệm Người dùng (UX/UI Goal)

Học tập hiệu ứng từ video tham khảo clip thực tế:
1. **Ẩn dụ Cuốn Sổ Quản Lý 3D Pop-up (3D Interactive Book Metaphor):**
   - Thay vì việc Sổ F04 xuất hiện đột ngột (instant pop-in) dạng modal phẳng thông thường:
   - Khi chủ trọ ấn **"Mở Sổ Quản Lý F04"** (hoặc click chọn phòng để mở chi tiết sổ):
     - **Giai đoạn 1 — Xuất hiện bìa sổ 3D:** Cuốn sổ với bìa da nâu cao cấp, viền chỉ khâu thủ công, gáy sổ chắc chắn xuất hiện ở góc nhìn 3D có chiều sâu phối cảnh (`perspective: 1400px`).
     - **Giai đoạn 2 — Hoạt ảnh mở bìa & lật trang đối xứng (Hinge Opening & Page Unfolding):**
       * Bìa sổ bên trái và các trang giấy mở bung ra quanh trục gáy sổ trung tâm (spine axis), góc mở từ $0^\circ$ lật mượt mà ra $180^\circ$ (thời lượng $\approx 0.65\text{s}$, gia tốc chuyển động `cubic-bezier(0.34, 1.56, 0.64, 1)` đàn hồi nhẹ tự nhiên).
       * Nếp gấp gáy sổ (crease) có hiệu ứng đổ bóng mờ (spine shadow gradient) chuyển dần từ đậm sang sáng khi sổ mở phẳng.
     - **Giai đoạn 3 — Nội dung Pop-up vươn lên (Pop-up Unfolding):**
       * Nội dung trang sổ (Mặt bằng tầng hoặc Tờ kẹp chi tiết phòng với các tab Thu tiền, Thiết bị, Lịch sử, VietQR) bung mở đứng dậy từ nếp gấp trung tâm với hiệu ứng 3D pop-up mượt mà, sẵn sàng tương tác tức thì.
2. **Hoạt ảnh Gập Sổ (Book Closing Animation):**
   - Khi chủ trọ bấm nút **`[Gập Sổ (3D)]`**:
     * Trang sổ và bìa sổ gập ngược lại theo trục bản lề gáy sổ ($\approx 0.45\text{s}$).
     * Quyển sổ khép lại phẳng phiu và nhẹ nhàng biến mất, trả lại tầm nhìn toàn cảnh toà nhà/mặt bằng 3D.
3. **Hiệu năng & Khả năng tiếp cận:**
   - Hoạt ảnh 3D chạy mượt mà 60fps trên cả Desktop và Mobile mà không gây nghẽn WebGL.
   - Giữ nguyên $100\%$ tính năng nhập liệu, thanh toán VietQR và touch-target $\ge 44\text{px}$.

---

## 2. Bảng Đánh Giá Mức Độ Ảnh Hưởng (Impact Assessment)

| Thành phần / Module | Mức độ thay đổi | Chi tiết ảnh hưởng | Đánh giá an toàn |
| :--- | :---: | :--- | :--- |
| **`packages/shared-types` (common)** | **0% (KHÔNG ĐỔI)** | Giữ nguyên 100% các interface và kiểu dữ liệu DTO hiện có. | **Tuyệt đối an toàn**. |
| **`packages/renderer-2d`** | **Chỉnh sửa** | Trong `VirtualLedgerBook.tsx` & style CSS: Bổ sung cấu trúc bìa sổ 3D (`BookCover3D`), hiệu ứng lật mở trang theo trục bản lề 3D `perspective` + `transform-style: preserve-3d`, nếp gấp gáy sổ và hoạt ảnh pop-up. | Gói gọn trong renderer-2d, có unit test kiểm chứng. |
| **`apps/web (LedgerOverlayHost)`** | **Chỉnh sửa** | Quản lý trạng thái chuyển cảnh `isOpening` / `isClosing` để kích hoạt animation mở/gập sổ êm ái trước khi unmount. | Đảm bảo không bị tắt đột ngột. |
| **Kiểm thử Unit & E2E** | **Cập nhật** | Thêm unit tests cho các trạng thái hoạt ảnh mở/gập sổ; kiểm thử Playwright Chrome xác nhận hiệu ứng mở sách mượt mà. | Xác minh tự động qua Chrome. |

---

## 3. Tiêu Chí Nghiệm Thu (Acceptance Criteria)

- **AC-1:** Khi bấm "Mở Sổ Quản Lý F04" hoặc click mở phòng, xuất hiện hoạt ảnh mở bìa sổ và lật trang 3D mượt mà ($\approx 0.65\text{s}$) từ nếp gấp gáy sổ, không xuất hiện giật cục.
- **AC-2:** Khi bấm "Gập Sổ (3D)", bìa và trang sổ gập lại tự nhiên trước khi đóng hẳn.
- **AC-3:** Toàn bộ nội dung trang (Sơ đồ mặt bằng, Tab hóa đơn, Danh sách cư dân, VietQR offline) hiển thị đầy đủ, sắc nét, tương tác mượt mà sau khi mở sổ.
- **AC-4:** $100\%$ unit tests và Playwright E2E suites PASS trên Google Chrome. $0\%$ thay đổi `packages/shared-types`.
- **AC-5:** Sau khi hoàn thành và nghiệm thu, thực hiện lệnh đưa máy macOS về chế độ Sleep an toàn (`pmset sleepnow`) theo quyền đã được cấp.
