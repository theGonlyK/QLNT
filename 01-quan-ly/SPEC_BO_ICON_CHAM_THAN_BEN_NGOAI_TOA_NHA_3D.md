# Đặc tả Kỹ thuật (Spec): Bỏ Hoàn Toàn Icon Dấu Chấm Than Ở Khu Vực Bên Ngoài Tòa Nhà 3D

- **Mã tính năng:** `QLNT-FEAT-REMOVE-EXTERIOR-NOTICE-BADGES`
- **Phiên bản:** `1.0`
- **Ngày lập:** `2026-11-15`
- **Trạng thái:** `Dự thảo — Chờ Chủ dự án duyệt trước khi triển khai`

---

## 1. Mục tiêu Nghiệp vụ & Trải nghiệm Người dùng (UX/UI Goal)

1. **Tối Giản Hóa & Giữ Sự Thanh Thoát Cho Hình Khối Tòa Nhà Bên Ngoài:**
   - Ở góc nhìn toàn cảnh tòa nhà (`viewMode === 'BUILDING_3D'`), các khối phòng đã có màu sắc trực quan đại diện cho trạng thái:
     * **Màu đỏ (`0xef4444` + emissive):** Phòng có thiết bị báo hỏng.
     * **Màu vàng/cam (`0xf59e0b` + emissive):** Phòng có khoản thu chờ đóng / hóa đơn chờ duyệt.
     * **Màu xanh (`baseColor`):** Phòng hoạt động bình thường.
   - Việc hiển thị thêm các icon dấu chấm than 3D (`NoticeBadge`) lơ lửng ngoài mặt tiền hoặc trên nóc khối phòng khiến hình khối kiến trúc bị rối rắm, rườm rà và che khuất các góc nhìn khác khi thay đổi layout toà nhà.
   - **Đề xuất đã thống nhất:** Bỏ hoàn toàn các icon dấu chấm than 3D ở khu vực bên ngoài tòa nhà. Toàn cảnh tòa nhà trở nên tinh gọn, sạch đẹp, đúng phong cách kiến trúc mô phỏng hiện đại.

2. **Bảo Lưu 100% Icon Dấu Chấm Than Trong Mặt Bằng Tầng (Floor Cutaway):**
   - Khi chủ trọ bấm chọn một tầng để vào chế độ **Mặt bằng tầng 3D Cutaway** (`viewMode === 'FLOOR_3D'`), các dấu chấm than 3D gắn trên cửa gỗ / bảng số phòng của từng phòng vẫn được giữ nguyên vẹn.
   - Chủ trọ vẫn có thể click trực tiếp vào dấu chấm than ở cửa phòng để mở nhanh Sổ Quản Lý F04 vào đúng tab Công nợ hoặc Thiết bị.

---

## 2. Bảng Đánh Giá Mức Độ Ảnh Hưởng (Impact Assessment)

| Thành phần / Module | Mức độ thay đổi | Chi tiết ảnh hưởng | Đánh giá an toàn |
| :--- | :---: | :--- | :--- |
| **`packages/shared-types` (common)** | **0% (KHÔNG ĐỔI)** | Giữ nguyên 100% các interface và kiểu dữ liệu DTO. | **Tuyệt đối an toàn**. |
| **`packages/renderer-3d`** | **Chỉnh sửa** | Trong `threeGameRenderer.ts`: Bỏ việc tạo và hiển thị `NoticeBadge` trong scene chính ngoài toà nhà; `setRoomNotice()` và `setDeviceStatus()` chỉ cập nhật màu sắc khối phòng `updateRoomMeshColor()`. Giữ nguyên 100% `NoticeBadge` trong `FloorCutawayRenderer`. | Độc lập trong Three.js, có unit tests bảo vệ. |
| **`apps/web`** | **Không đổi** | Giao diện thanh chọn tầng, drawer danh sách phòng và Sổ F04 hoạt động bình thường. | An toàn tuyệt đối. |
| **Kiểm thử Unit & E2E** | **Cập nhật** | Cập nhật tests kiểm tra 0 exterior badges, chụp ảnh nghiệm thu toà nhà sạch sẽ trên Google Chrome. | Xác minh tự động qua Chrome. |

---

## 3. Tiêu Chí Nghiệm Thu (Acceptance Criteria)

- **AC-1:** Ở góc nhìn tòa nhà bên ngoài (`viewMode === 'BUILDING_3D'`), không còn bất kỳ icon dấu chấm than 3D nào lơ lửng trên các khối phòng.
- **AC-2:** Các khối phòng báo hỏng (đỏ) và nợ tiền (cam) vẫn hiển thị màu sắc rực rỡ và đổ bóng chuẩn xác.
- **AC-3:** Khi mở mặt bằng tầng 3D Cutaway (`viewMode === 'FLOOR_3D'`), các icon dấu chấm than trong tầng vẫn xuất hiện chính xác tại cửa từng phòng và click mở được Sổ F04.
- **AC-4:** $100\%$ unit tests và Playwright E2E test suites PASS trên Google Chrome. $0\%$ thay đổi `packages/shared-types`.
