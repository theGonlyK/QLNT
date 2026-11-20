# Đặc tả Kỹ thuật (Spec): Điều Chỉnh Dấu Chấm Than Cảnh Báo Vào Đúng Phòng Khi Mở Tầng 3D

- **Mã tính năng:** `QLNT-FEAT-FLOOR-CUTAWAY-NOTICE-BADGES`
- **Phiên bản:** `1.0`
- **Ngày lập:** `2026-11-15`
- **Trạng thái:** `Dự thảo — Chờ Chủ dự án duyệt trước khi triển khai`

---

## 1. Mục tiêu Nghiệp vụ & Trải nghiệm Người dùng (UX/UI Goal)

### Hiện trạng & Nguyên nhân lỗi
1. **Lỗi dấu chấm than trôi nổi sai vị trí:**
   - Trong `threeGameRenderer.ts`, các `NoticeBadge` (dấu chấm than 3D vàng/đỏ) được tạo ở cấp toàn tòa nhà gắn vào tọa độ các khối hộp bên ngoài (`this.buildingMeshes`).
   - Khi người dùng chọn mở một tầng (`transitionToFloor` / `renderFloorCutaway`): chỉ có `this.buildingMeshes` bị ẩn (`visible = false`), trong khi toàn bộ `this.badges` của cả 3 tầng vẫn giữ nguyên trạng thái hiển thị và giữ nguyên tọa độ cũ trong không gian 3D.
   - Hậu quả: Dấu chấm than của Tầng 1 và Tầng 3 bay lơ lửng giữa không trung của Tầng 2; đồng thời dấu chấm than của Tầng 2 nằm ở tọa độ mặt tiền bên ngoài cũ ($Z = 0.72$), lệch hoàn toàn so với phòng thực tế trong mặt bằng tầng cutaway ($Z = \pm 3.05$).

### Mục tiêu giải pháp
1. **Cô lập theo tầng khi mở mặt bằng tầng:**
   - Khi ở chế độ mặt bằng tầng (`viewMode === 'FLOOR_3D'`):
     - Ẩn $100\%$ các dấu chấm than của toàn tòa nhà (`this.badges.forEach(b => b.visible = false)`).
     - Chỉ hiển thị các dấu chấm than cảnh báo của **các phòng thuộc tầng đang mở**.
2. **Định vị chính xác dấu chấm than vào từng phòng tương ứng:**
   - Tại mỗi phòng có vấn đề cần xử lý:
     - **Chấm than vàng (`!` - `PAYMENT_DUE` / `BILL_PENDING`):** Hiển thị khi phòng có tiền trọ chưa đóng hoặc bill chờ duyệt.
     - **Chấm than đỏ (`!` - `BROKEN`):** Hiển thị khi phòng có thiết bị (điều hòa, bình nóng lạnh...) báo hỏng hóc.
     - **Vị trí neo 3D chuẩn xác:** Đặt nhấp nhô (bobbing) nhẹ nhàng ngay phía trên khu vực cửa ra vào / bảng thông tin của phòng đó (độ cao $Y \approx 1.65 - 1.85\text{m}$, phía trên khung cửa $1.2\text{m}$), nhìn cực kỳ rõ ràng từ góc camera isometric nhìn xuống.
     - Nếu một phòng có cả 2 cảnh báo: Chấm than vàng tách nhẹ sang trái ($-X$), Chấm than đỏ tách nhẹ sang phải ($+X$), không đè chồng lên nhau.
3. **Tương tác trực tiếp trên 3D:**
   - Rê chuột vào dấu chấm than: Đổi con trỏ thành dạng bàn tay (`pointer`).
   - Click vào dấu chấm than vàng: Mở ngay **Sổ Quản Lý Phòng F04 — Trang 1 Hóa đơn** của phòng đó.
   - Click vào dấu chấm than đỏ: Mở ngay **Sổ Quản Lý Phòng F04 — Trang 2 Thiết bị** của phòng đó.
4. **Khôi phục khi quay lại toàn cảnh tòa nhà:**
   - Khi bấm quay lại toàn cảnh tòa nhà (`transitionToBuilding`): Toàn bộ dấu chấm than của các tầng trên mô hình tòa nhà bên ngoài được khôi phục hiển thị đầy đủ (`visible = true`).

---

## 2. Bảng Đánh Giá Mức Độ Ảnh Hưởng (Impact Assessment)

| Thành phần / Module | Mức độ thay đổi | Chi tiết ảnh hưởng | Đánh giá an toàn |
| :--- | :---: | :--- | :--- |
| **`packages/shared-types` (common)** | **0% (KHÔNG ĐỔI)** | Giữ nguyên 100% các interface, kiểu dữ liệu DTO. | **Tuyệt đối an toàn**. |
| **`packages/renderer-3d`** | **Mở rộng** | 1. `threeGameRenderer.ts`: Khi `transitionToFloor` thì ẩn các building badges; khi `transitionToBuilding` thì hiện lại.<br>2. `floorCutawayRenderer.ts`: Thêm `NoticeBadge` cho từng phòng theo cấu hình `roomConfig.hasPaymentNotice` và `roomConfig.hasBrokenDevice`, đặt tại tọa độ phòng cutaway, cập nhật hoạt ảnh bobbing và hỗ trợ raycasting click. | Trực tiếp xử lý trên scene graph của Three.js, bổ sung unit tests. |
| **`apps/web`** | **Chỉnh sửa** | Trong `Canvas3DStage.tsx`: Xử lý click trúng dấu chấm than trên sàn tầng để mở Sổ F04 đúng trang Hóa đơn / Thiết bị. | Nâng cao trải nghiệm người dùng, click vào cảnh báo mở ngay việc cần làm. |
| **Kiểm thử Playwright E2E** | **Cập nhật** | Bổ sung kiểm tra vị trí dấu chấm than trên tầng, click dấu chấm than mở đúng trang sổ F04. | Chạy toàn bộ E2E trên Chrome thật và chụp ảnh minh chứng. |

---

## 3. Tiêu Chí Nghiệm Thu (Acceptance Criteria)

- **AC-1:** Khi mở một tầng (ví dụ Tầng 2), tuyệt đối không có dấu chấm than của các tầng khác (Tầng 1, Tầng 3) bay lơ lửng trong cảnh.
- **AC-2:** Phòng P201 (chờ thu) có dấu chấm than vàng nhấp nhô ngay phía trên cửa / bảng thông tin của phòng P201; Phòng P204 (hỏng điều hòa) có dấu chấm than đỏ nhấp nhô ngay phía trên cửa / bảng thông tin của phòng P204.
- **AC-3:** Phòng bình thường (như P203) tuyệt đối không có dấu chấm than cảnh báo nào.
- **AC-4:** Click vào dấu chấm than vàng mở đúng Trang 1 Hóa đơn Sổ F04; Click vào dấu chấm than đỏ mở đúng Trang 2 Thiết bị Sổ F04.
- **AC-5:** Khi bấm "Quay lại toàn cảnh tòa nhà", các dấu chấm than của toàn bộ tòa nhà bên ngoài hiển thị bình thường.
- **AC-6:** $100\%$ unit tests và Playwright E2E test suites PASS, $0\%$ thay đổi `packages/shared-types`.
