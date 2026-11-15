# Đặc tả Kỹ thuật (Spec): Bảng Số Phòng Nét Trên Cửa, Cánh Cửa Gỗ & Bảng Thông Tin Tường Mở Sổ F04

- **Mã tính năng:** `QLNT-FEAT-DOOR-BOARD-INFO-PLAQUE`
- **Phiên bản:** `1.0`
- **Ngày lập:** `2026-11-15`
- **Trạng thái:** `Dự thảo — Chờ Chủ dự án duyệt trước khi triển khai`

---

## 1. Mục tiêu Nghiệp vụ & Trải nghiệm Người dùng (UX/UI Goal)

1. **Gỡ bỏ số phòng và icon bay lơ lửng trên không trung:**
   - Trong Mặt bằng Tầng 3D (`FLOOR_3D`), gỡ bỏ hoàn toàn các icon HTML overlay và các badge 3D (`!` Vàng, `!` Đỏ, `Z Z`) đang bay trên đỉnh phòng.
   - Không gian phía trên các phòng thông thoáng, không còn các chi tiết trôi nổi che khuất tầm nhìn nội thất bên trong.
2. **Bảng số phòng sắc nét đặt ngay trên cửa phòng (Over-door Room Number Plaque):**
   - Vị trí: Gắn cố định ở thanh ngang phía trên khung cửa mỗi phòng, nhìn ra hướng hành lang.
   - Độ sắc nét: Sử dụng High-resolution Canvas Texture ($512 \times 160$ px, tăng hệ số lấy mẫu và anisotropic filtering), nền màu đen ánh kim viền vàng kim (`#fbbf24`), chữ in hoa đậm nét màu vàng sáng (`#fde047`), nhìn rõ nét ở mọi cự ly camera.
3. **Thêm cánh cửa gỗ tự nhiên cho mỗi căn phòng:**
   - Tại khung cửa lối vào phòng:
     - Dựng khung cửa (Door Frame) và **cánh cửa gỗ** (Wood Door Leaf) bằng vật liệu gỗ tự nhiên màu nâu ấm (`#8b4513` / `#9a3412`).
     - Có chi tiết panô huỳnh cửa gỗ và tay nắm kim loại vàng đồng/inox bạc sáng bóng (`#f59e0b` / `#e2e8f0`).
     - Cánh cửa mở hé $35^\circ - 45^\circ$ vào bên trong phòng tạo chiều sâu và cảm giác chào đón chân thực.
4. **Bảng thông tin gắn trên bức tường bên phải cửa phòng (Interactive Room Info Plaque):**
   - Vị trí: Gắn trên vách tường hành lang ngay bên phải cửa phòng / bảng số phòng.
   - Nội dung hiển thị sắc nét:
     - Dòng 1: Mã phòng & Diện tích (VD: `PHÒNG P201 · 25 m²`)
     - Dòng 2: Tên khách thuê (VD: `Đỗ Quang Minh` hoặc `Phòng trống`)
     - Dòng 3: Trạng thái (VD: `🟡 Chờ thu 3.5tr` / `🔴 Hỏng điều hòa` / `🟢 Bình thường`)
     - Dòng 4: Chỉ dẫn tương tác `👉 Nhấn mở Sổ F04`
   - Tương tác:
     - Rê chuột vào bảng thông tin: Bảng phát sáng nhẹ (hover glow), con trỏ đổi thành bàn tay (`pointer`).
     - **Ấn vào Bảng thông tin: Mở ngay Sổ Quản Lý Phòng F04 của căn phòng đó** (nếu có thiết bị hỏng mở Trang 2 Thiết bị, nếu chờ thu mở Trang 1 Hóa đơn).

---

## 2. Bảng Đánh Giá Mức Độ Ảnh Hưởng (Impact Assessment)

| Thành phần / Module | Mức độ thay đổi | Chi tiết ảnh hưởng | Đánh giá an toàn |
| :--- | :---: | :--- | :--- |
| **`packages/shared-types` (common)** | **0% (KHÔNG ĐỔI)** | Không thay đổi bất kỳ interface hay DTO nào. | **Tuyệt đối an toàn**. |
| **`packages/renderer-3d`** | **Mở rộng** | 1. `FloorCutawayRenderer`: Dựng cánh cửa gỗ mở hé, làm nét bảng số phòng trên cửa, gỡ badge bay trên không, tạo mesh `RoomInfoPlaque` bên phải cửa.<br>2. `ThreeGameRenderer`: Hỗ trợ raycast bắt click bảng thông tin (`pickRoomInfoPlaque`). | Tận dụng sẵn Three.js mesh & canvas textures, bổ sung unit test. |
| **`apps/web (Canvas3DStage)`** | **Chỉnh sửa** | 1. Bỏ overlay `projectedRoomBadges` khi ở `FLOOR_3D`.<br>2. Xử lý click trúng bảng thông tin phòng -> gọi mở Sổ F04. | Giao diện 3D sạch, trực quan theo đúng mô tả của người dùng. |
| **Kiểm thử Playwright E2E** | **Cập nhật** | Kiểm tra click bảng thông tin phòng trên tường mở đúng Sổ F04; xác nhận không còn icon nổi lơ lửng. | Chạy toàn bộ E2E trên Chrome thật và chụp ảnh minh chứng. |

---

## 3. Tiêu Chí Nghiệm Thu (Acceptance Criteria)

- **AC-1:** Không còn số phòng hay icon nào bay lơ lửng trên không trung trong Mặt bằng Tầng 3D.
- **AC-2:** Mỗi phòng đều có cánh cửa gỗ mở hé tự nhiên kèm tay nắm kim loại.
- **AC-3:** Bảng số phòng (`P201`, `P202`...) đặt ngay trên cửa phòng hiển thị cực kỳ sắc nét, viền vàng kim tương phản cao.
- **AC-4:** Bức tường bên phải cửa có Bảng thông tin hiển thị diện tích, khách thuê, trạng thái; ấn vào Bảng thông tin này mở ngay Sổ Quản Lý Phòng F04 của phòng đó.
- **AC-5:** 100% unit tests và 6/6 kịch bản Playwright E2E PASS; $0\%$ thay đổi `packages/shared-types`.
