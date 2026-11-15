# Đặc tả Kỹ thuật (Spec): Tùy Chọn Khối Tòa Nhà 3D Bên Ngoài (Block Shape Presets)

- **Mã tính năng:** `QLNT-FEAT-BUILDING-3D-BLOCK-SHAPE-PRESETS`
- **Phiên bản:** `1.0`
- **Ngày lập:** `2026-11-15`
- **Trạng thái:** `Dự thảo — Chờ Chủ dự án duyệt trước khi triển khai`

---

## 1. Mục tiêu Nghiệp vụ & Trải nghiệm Người dùng (UX/UI Goal)

Hiện tại, mô hình 3D toàn cảnh tòa nhà bên ngoài (`ThreeGameRenderer.renderBuilding`) chỉ xếp các khối phòng theo **1 hàng ngang duy nhất dọc trục X** ($z = 0$). Điều này khiến tòa nhà trông như một "bức tường phẳng" mỏng dính, không phản ánh chiều sâu kiến trúc thực tế của nhà trọ (vốn có 2 dãy phòng đối diện qua hành lang trung tâm như trong chế độ xem cắt tầng Cutaway).

Tính năng này mang lại:
1. **Khối kiến trúc 3D có chiều sâu đa chiều:**
   - Dựng các khối phòng theo ma trận 3D thực thụ: $\text{Số phòng mặt ngang } (X) \times \text{Số dãy phòng theo chiều sâu } (Z) \times \text{Số tầng } (Y)$.
   - Giữa 2 dãy phòng theo trục $Z$ có khe hở hành lang/thông tầng nhẹ ($0.25\text{m}$) tạo cảm giác kiến trúc chân thực, đồng nhất với mặt bằng 2 dãy phòng của Cutaway.
2. **Bộ Tỉ Lệ Khối Chuẩn Kiến Trúc (Preset Catalog):**
   - **`TOWER_2x2x6` (Tháp Nhà Ống Cao Tầng):** $2 \times 2 \times 6$ ($4$ phòng/tầng, $6$ tầng, tổng $24$ phòng). Dáng tháp đô thị vươn cao, thanh thoát.
   - **`CCMN_3x2x4` (Chung Cư Mini Tiêu Chuẩn):** $3 \times 2 \times 4$ ($6$ phòng/tầng, $4$ tầng, tổng $24$ phòng). Tỉ lệ chữ nhật hoàng kim, phổ biến nhất ở Hà Nội.
   - **`CUBE_3x3x3` (Khối Vuông Lập Phương):** $3 \times 3 \times 3$ ($9$ phòng/tầng, $3$ tầng, tổng $27$ phòng). Khối Cube vững chãi, cân xứng $(1:1:1)$.
   - **`COMPACT_2x2x3` (Nhà Phố 3 Tầng):** $2 \times 2 \times 3$ ($4$ phòng/tầng, $3$ tầng, tổng $12$ phòng). Nhỏ gọn, ấm cúng (trùng khớp dữ liệu ban đầu).
   - **`LONG_4x2x2` (Dãy Trọ Ngang Ven Đô):** $4 \times 2 \times 2$ ($8$ phòng/tầng, $2$ tầng, tổng $16$ phòng). Trải dài theo bề ngang $X$, thấp tầng.
   - **`CUSTOM` (Tùy chỉnh tự do):** Thanh trượt điều chỉnh $X (1\dots4)$, $Z (1\dots3)$, $Y (1\dots6)$.
3. **Hai Vị Trí Điều Khiển Đồng Bộ:**
   - **Thanh HUD trên Canvas 3D:** Nút bấm chọn nhanh kèm dropdown các preset khối (`🏛️ Khối toà nhà: [Preset ▼]`), click là tòa nhà biến đổi ngay lập tức, chuyển mượt mà.
   - **Modal "Đăng ký Diện tích & Phòng":** Tích hợp bộ chọn hình khối kiến trúc trực quan kèm preview thông số tầng và phòng.
4. **Đồng Bộ Hoàn Chỉnh CSDL Local-First:**
   - Khi chọn khối, hệ thống tự động cập nhật số tầng $Y$ và số phòng $X \times Z$ vào IndexedDB Dexie.
   - Đồng bộ tức thì với thanh chọn tầng, số lượng huy hiệu chấm than, Sổ Quản Lý F04 và Mặt bằng tầng Cutaway.

---

## 2. Bảng Đánh Giá Mức Độ Ảnh Hưởng (Impact Assessment)

| Thành phần / Module | Mức độ thay đổi | Chi tiết ảnh hưởng | Đánh giá an toàn |
| :--- | :---: | :--- | :--- |
| **`packages/shared-types` (common)** | **0% (KHÔNG ĐỔI)** | Giữ nguyên 100% các interface và kiểu dữ liệu hiện có. Không sửa đổi package chung. | **Tuyệt đối an toàn**. |
| **`packages/renderer-3d`** | **Chỉnh sửa** | Trong `ThreeGameRenderer`: Hỗ trợ layout phòng 3D theo lưới $(colsX, rowsZ)$ trên mỗi tầng $f$, căn giữa khối quanh $(0, y, 0)$; cập nhật `getRoomBadgeAnchor()` và raycasting picking theo tọa độ lưới 3D mới. | Độc lập trong Three.js, có unit tests bảo vệ. |
| **`apps/web (ledgerController)`** | **Chỉnh sửa** | Thêm danh mục `BUILDING_BLOCK_PRESETS`, hàm `applyBuildingBlockPreset()` đồng bộ cấu trúc phòng/tầng vào IndexedDB Dexie và gửi sang renderer. | Kế thừa logic sinh phòng hiện tại, tương thích ngược 100%. |
| **`apps/web (Canvas3DStage)`** | **Chỉnh sửa** | Thêm menu chọn nhanh Preset hình khối toà nhà trên thanh công cụ HUD (bên cạnh nút điều khiển góc nhìn / zoom). | Đảm bảo touch-target $\ge 44\text{px}$, responsive Desktop + Mobile. |
| **`apps/web (BuildingSetupModal)`** | **Chỉnh sửa** | Thêm thẻ chọn Preset hình khối kiến trúc để người dùng xem và áp dụng trực tiếp khi cấu hình tòa nhà. | Tự động điền số tầng và số phòng theo preset. |
| **Kiểm thử Unit & E2E** | **Bổ sung** | Thêm unit tests cho `ThreeGameRenderer` (lưới 3D X×Z×Y, badge anchor) và Playwright E2E kiểm tra chọn preset khối hiển thị chuẩn xác trên Chrome. | Xác minh tự động qua Chrome. |

---

## 3. Danh Mục Presets & Tỉ Lệ Hình Học Chi Tiết

Mỗi phòng đơn vị bên ngoài có kích thước cơ sở: Chiều ngang $sx = 1.0$, Chiều cao $sy = 1.0$, Chiều sâu $sz = 1.0$, khe hở phòng $gapX = 0.1$, khe hành lang $gapZ = 0.25$, chiều cao tầng $gapY = 0.1$.

1. **`TOWER_2x2x6` (Tháp Nhà Ống Cao Tầng):**
   - $X = 2$ phòng, $Z = 2$ dãy, $Y = 6$ tầng $\rightarrow 4$ phòng/tầng, tổng **$24$ phòng**.
   - Kích thước tổng thể: Ngang $\approx 2.1\text{m}$, Sâu $\approx 2.25\text{m}$, Cao $\approx 6.6\text{m}$ (tỉ lệ cao vượt trội $\sim 1 : 1 : 3$).
2. **`CCMN_3x2x4` (Chung Cư Mini Tiêu Chuẩn):**
   - $X = 3$ phòng, $Z = 2$ dãy, $Y = 4$ tầng $\rightarrow 6$ phòng/tầng, tổng **$24$ phòng**.
   - Kích thước tổng thể: Ngang $\approx 3.2\text{m}$, Sâu $\approx 2.25\text{m}$, Cao $\approx 4.4\text{m}$ (tỉ lệ chữ nhật cân xứng).
3. **`CUBE_3x3x3` (Khối Vuông Lập Phương):**
   - $X = 3$ phòng, $Z = 3$ dãy, $Y = 3$ tầng $\rightarrow 9$ phòng/tầng, tổng **$27$ phòng**.
   - Kích thước tổng thể: Ngang $\approx 3.2\text{m}$, Sâu $\approx 3.4\text{m}$, Cao $\approx 3.3\text{m}$ (tỉ lệ lập phương $1 : 1 : 1$).
4. **`COMPACT_2x2x3` (Nhà Phố 3 Tầng - Mặc định):**
   - $X = 2$ phòng, $Z = 2$ dãy, $Y = 3$ tầng $\rightarrow 4$ phòng/tầng, tổng **$12$ phòng**.
   - Kích thước tổng thể: Ngang $\approx 2.1\text{m}$, Sâu $\approx 2.25\text{m}$, Cao $\approx 3.3\text{m}$.
5. **`LONG_4x2x2` (Dãy Trọ Ngang Ven Đô):**
   - $X = 4$ phòng, $Z = 2$ dãy, $Y = 2$ tầng $\rightarrow 8$ phòng/tầng, tổng **$16$ phòng**.
   - Kích thước tổng thể: Ngang $\approx 4.3\text{m}$, Sâu $\approx 2.25\text{m}$, Cao $\approx 2.2\text{m}$ (dáng trải dài).

---

## 4. Tiêu Chí Nghiệm Thu (Acceptance Criteria)

- **AC-1:** Giao diện 3D HUD hiển thị bộ chọn `🏛️ Khối toà nhà` với đầy đủ 5 presets kiến trúc + tùy chọn tùy chỉnh.
- **AC-2:** Khi chọn preset (ví dụ $2\times2\times6$ hoặc $3\times3\times3$), `ThreeGameRenderer` dựng lại tòa nhà bên ngoài với đúng cấu trúc $X$ cột $\times Z$ hàng $\times Y$ tầng, có chiều sâu 3D và khe thông tầng trung tâm $0.25\text{m}$.
- **AC-3:** Các huy hiệu chấm than cảnh báo ngoài tòa nhà (`NoticeBadge`) định vị chính xác trên mặt ngoài của từng khối phòng theo tọa độ lưới 3D.
- **AC-4:** Số tầng và số phòng được cập nhật tự động và đồng bộ vào IndexedDB Local-First; thanh chọn tầng và Sổ Quản Lý F04 mở đúng số tầng/phòng tương ứng.
- **AC-5:** Trong modal "Đăng ký Diện tích & Phòng", tích hợp bộ chọn Preset hình khối, cho phép áp dụng nhanh vào cấu hình tòa nhà.
- **AC-6:** 100% unit tests và Playwright E2E test suites PASS, $0\%$ thay đổi `packages/shared-types`.
