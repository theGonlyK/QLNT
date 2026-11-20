# Đặc tả Kỹ thuật (Spec): Góc 45 Độ Chuẩn Tại Hành Lang, Tầm Nhìn Thu Nhỏ 10%

- **Mã tính năng:** `QLNT-FEAT-FLOOR-CUTAWAY-45DEG-CORRIDOR-ZOOM-OUT-10PCT`
- **Phiên bản:** `1.0`
- **Ngày lập:** `2026-11-15`
- **Trạng thái:** `Dự thảo — Chờ Chủ dự án duyệt trước khi triển khai`

---

## 1. Mục tiêu Nghiệp vụ & Trải nghiệm Người dùng (UX/UI Goal)

Theo phản hồi làm rõ của người dùng:
1. **Góc camera mặc định khi mở tầng:**
   - Sử dụng **góc chuẩn 45 độ** (Isometric chuẩn: $\text{Yaw} = 45^\circ$, $\text{Pitch} = 35.264^\circ$) thay vì góc nhìn dọc $82^\circ$.
   - Tâm nhìn của camera (`lookAt`) mặc định hướng thẳng vào **hành lang trung tâm** (`(0, 0, 0)`), cân đối 2 dãy phòng ở hai bên trục chéo isometric.
2. **Tầm nhìn thu nhỏ lại 10% (Zoom Out 10%):**
   - Trước đây khi vào tầng, độ zoom gần là $1.35$.
   - Thu nhỏ lại 10% để mở rộng tầm mắt bao quát toàn bộ tầng:
     $$\text{Zoom} = 1.35 \times 0.9 = 1.215$$
   - Giúp toàn bộ hành lang và các phòng trên tầng hiển thị thông thoáng, không bị sát mép màn hình.
3. **Nút "Góc chuẩn 45°":**
   - Đặt lại nhãn nút là **"Góc chuẩn 45°"** cho cả khi xem toàn tòa nhà và khi ở trong tầng.
   - Khi đang ở mặt bằng tầng 3D (`FLOOR_3D`), click nút này sẽ khôi phục ngay về góc $45^\circ$, tâm hành lang, zoom $1.215$.

---

## 2. Bảng Đánh Giá Mức Độ Ảnh Hưởng (Impact Assessment)

| Thành phần / Module | Mức độ thay đổi | Chi tiết ảnh hưởng | Đánh giá an toàn |
| :--- | :---: | :--- | :--- |
| **`packages/shared-types` (common)** | **0% (KHÔNG ĐỔI)** | Giữ nguyên 100% các interface, kiểu dữ liệu DTO. | **Tuyệt đối an toàn**. |
| **`packages/renderer-3d`** | **Chỉnh sửa** | Trong `threeGameRenderer.ts`: `resetFloorIsometricCamera()` và `transitionToFloor()` đặt góc $\text{Yaw} = 45^\circ$, $\text{Pitch} = 35.264^\circ$, $\text{Zoom} = 1.215$, $\text{lookAt}(0, 0, 0)$. | Độc lập trong Three.js, cập nhật unit tests. |
| **`apps/web (Canvas3DStage)`** | **Chỉnh sửa** | Giữ nhãn nút "Góc chuẩn 45°", gọi reset góc 45° hành lang khi ở `FLOOR_3D`. | Nhất quán và trực quan cho người dùng. |
| **Kiểm thử Playwright E2E** | **Cập nhật** | Chạy kiểm thử tự động trên Chrome, chụp ảnh nghiệm thu góc 45° hành lang zoom 1.215. | Chạy toàn bộ E2E trên Chrome thật. |

---

## 3. Tiêu Chí Nghiệm Thu (Acceptance Criteria)

- **AC-1:** Khi mở tầng (`transitionToFloor`), camera lập tức ở góc 45 độ chuẩn Isometric ($\text{Yaw} = 45^\circ$, $\text{Pitch} = 35.264^\circ$), tâm nhìn ở hành lang.
- **AC-2:** Tầm nhìn thu nhỏ lại 10% ($\text{Zoom} = 1.215$), toàn bộ tầng và 2 dãy phòng hiển thị thông thoáng, đầy đủ tường 1.2m.
- **AC-3:** Nút "Góc chuẩn 45°" hoạt động mượt mà, bấm vào sẽ khôi phục góc 45 độ tâm hành lang zoom 1.215.
- **AC-4:** 100% unit tests và Playwright E2E test suites PASS, $0\%$ thay đổi `packages/shared-types`.
