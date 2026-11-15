# Đặc tả Kỹ thuật (Spec): Góc Nhìn Mặc Định Dọc Hành Lang & Đầy Đủ Tường Cắt Lửng Cho 2 Dãy Phòng 3D

- **Mã tính năng:** `QLNT-FEAT-FLOOR-CUTAWAY-PERSPECTIVE-AND-FULL-WALLS`
- **Phiên bản:** `1.0`
- **Ngày lập:** `2026-11-15`
- **Trạng thái:** `Dự thảo — Chờ Chủ dự án duyệt trước khi triển khai`

---

## 1. Mục tiêu Nghiệp vụ & Trải nghiệm Người dùng (UX/UI Goal)

Dựa trên yêu cầu và ảnh chụp thực tế màn hình của người dùng:

1. **Đầy đủ tường cho cả 2 dãy phòng (Full Cutaway Walls on Both Room Rows):**
   - **Hiện trạng:** Trước đây bức tường ngoài của Dãy phòng Row 1 được hạ thấp xuống mức $0.35\text{m}$ (`addWallSegment(W, 0.35, T, ...)`), dẫn đến việc khi xoay sang góc nhìn dọc hành lang thì một dãy phòng trông như bị "trống mất một bức tường".
   - **Giải pháp:** Nâng toàn bộ các đoạn tường ngoài của Row 1 lên chiều cao chuẩn $H = 1.2\text{m}$ đồng bộ với Row 0 và các tường ngăn khác, bổ sung nẹp viền đỉnh tường màu sẫm (`#1e293b`).
   - **Kết quả:** Cả 2 dãy phòng đều có đầy đủ 4 bức tường bao quanh cao $1.2\text{m}$ ngăn nắp, đồng bộ, chỉ chừa đúng lối cửa ra vào $1.0\text{m}$ dẫn ra hành lang.

2. **Góc nhìn camera mặc định khi mở tầng (Default Camera View for Floor Cutaway):**
   - **Hiện trạng:** Khi chuyển cảnh vào tầng (`transitionToFloor`), camera mặc định đang đặt ở góc chéo isometric $45^\circ$ (Pitch $35.264^\circ$, Yaw $45^\circ$). Người dùng phải dùng chuột kéo xoay mới ra được góc nhìn ưng ý.
   - **Giải pháp:** Thiết lập góc nhìn mặc định khi mở tầng (`transitionToFloor`) chuẩn xác theo đúng hình ảnh người dùng đã chụp:
     - **Hướng nhìn dọc hành lang:** Camera nhìn từ đầu hành lang dọc theo trục hành lang trung tâm, đặt hành lang chạy thẳng đứng ở giữa màn hình.
     - **Hai dãy phòng 2 bên:** Dãy phòng bên trái và dãy phòng bên phải hiển thị cân đối, thấy rõ toàn bộ giường ngủ, bàn làm việc, cửa gỗ mở hé, bảng số phòng, bảng thông tin và dấu chấm than cảnh báo.
     - **Góc camera tối ưu:**
       - **Góc xoay (Yaw):** $\approx 82^\circ - 85^\circ$ (nhìn dọc hành lang với độ nghiêng nhẹ tạo chiều sâu 3D).
       - **Góc ngẩng (Pitch):** $\approx 55^\circ - 58^\circ$ (góc nhìn từ trên xuống cao hơn chuẩn 35°, giúp thấy rõ toàn bộ không gian bên trong cả 2 dãy phòng mà không bị che khuất).
       - **Độ thu phóng (Zoom):** $\approx 1.1 - 1.15$ (toàn bộ các phòng trên tầng hiển thị vừa vặn, không bị tràn màn hình).
   - **Nút "Góc chuẩn" / Reset View:** Khi đang ở `FLOOR_3D`, nếu người dùng xoay camera tự do và bấm nút "Góc chuẩn", camera sẽ tự động quay trở về góc nhìn dọc hành lang chuẩn này thay vì góc $45^\circ$ của tòa nhà ngoài.

---

## 2. Bảng Đánh Giá Mức Độ Ảnh Hưởng (Impact Assessment)

| Thành phần / Module | Mức độ thay đổi | Chi tiết ảnh hưởng | Đánh giá an toàn |
| :--- | :---: | :--- | :--- |
| **`packages/shared-types` (common)** | **0% (KHÔNG ĐỔI)** | Giữ nguyên 100% các interface, kiểu dữ liệu DTO. | **Tuyệt đối an toàn**. |
| **`packages/renderer-3d`** | **Chỉnh sửa** | 1. `floorCutawayRenderer.ts`: Sửa tường ngoài Row 1 thành chiều cao $H = 1.2\text{m}$ đầy đủ nẹp cap.<br>2. `threeGameRenderer.ts`: Cập nhật `transitionToFloor` sang góc camera dọc hành lang (Yaw $\approx 82^\circ$, Pitch $\approx 56^\circ$, Zoom $\approx 1.1$). Cung cấp hàm `resetFloorIsometricCamera()`. | Trực quan, tối ưu hình học Three.js, bổ sung unit tests. |
| **`apps/web (Canvas3DStage)`** | **Chỉnh sửa** | Khi ở `FLOOR_3D`, nút "Góc chuẩn" gọi `resetFloorIsometricCamera()` để khôi phục góc nhìn dọc tầng thay vì góc $45^\circ$ của toàn tòa nhà. | Tăng tính tiện dụng cho người dùng khi điều hướng. |
| **Kiểm thử Playwright E2E** | **Cập nhật** | Kiểm tra hiển thị đầy đủ tường cả 2 dãy phòng, chụp ảnh minh chứng thực tế góc nhìn mới theo yêu cầu. | Chạy toàn bộ E2E trên Chrome thật. |

---

## 3. Tiêu Chí Nghiệm Thu (Acceptance Criteria)

- **AC-1:** Khi mở bất kỳ tầng nào (ví dụ Tầng 2), camera mặc định lập tức hiển thị góc nhìn dọc hành lang ở giữa, 2 dãy phòng ở 2 bên giống $100\%$ ảnh chụp người dùng cung cấp.
- **AC-2:** Cả 2 dãy phòng (Row 0 và Row 1) đều có đầy đủ 4 bức tường cao $1.2\text{m}$ bao quanh, không còn tình trạng 1 dãy phòng bị thấp/trống tường.
- **AC-3:** Bấm nút "Góc chuẩn" trong mặt bằng tầng sẽ đặt lại đúng góc nhìn dọc hành lang này.
- **AC-4:** Bấm "Quay lại toàn cảnh tòa nhà", camera quay lại góc chuẩn $45^\circ$ của mô hình tòa nhà bên ngoài.
- **AC-5:** $100\%$ unit tests và Playwright E2E test suites PASS, $0\%$ thay đổi `packages/shared-types`.
