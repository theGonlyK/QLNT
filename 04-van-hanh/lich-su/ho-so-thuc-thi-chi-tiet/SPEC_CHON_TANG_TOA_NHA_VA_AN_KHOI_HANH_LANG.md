# Đặc tả Kỹ thuật (Spec): Chọn Theo Tầng Ở Mô Hình Tòa Nhà & Ẩn Khối Vuông Ở Hành Lang Khi Mở Mặt Bằng Tầng

- **Mã tính năng:** `QLNT-FEAT-FLOOR-PICK-CLEAN-CORRIDOR`
- **Phiên bản:** `1.0`
- **Ngày lập:** `2026-11-15`
- **Trạng thái:** `Dự thảo — Chờ Chủ dự án duyệt trước khi triển khai`

---

## 1. Mục tiêu Thay Đổi (Objective & UX Simplification)

1. **Đơn giản hóa Tương tác ở Toàn cảnh Tòa nhà 3D (`viewMode === 'BUILDING'`):**
   - **Bỏ chọn từng phòng riêng lẻ ở bên ngoài:** Không còn ghim nhãn phòng hoặc badge từng phòng lên mặt tiền tòa nhà; không click từng phòng để mở Sổ F04 khi đang ở góc nhìn tổng thể tòa nhà.
   - **Chuyển thành Tương tác theo Tầng (Floor Selection):**
     + Khi rê chuột vào bất kỳ khối phòng nào của Tầng `f`: Toàn bộ các phòng của Tầng `f` cùng phát sáng viền (Floor Hover Glow).
     + Tooltip hiển thị thông tin tổng hợp của Tầng: `Tầng ${f + 1} · ${số phòng} phòng · ${diện tích} m² (Nhấp để mở Mặt bằng Tầng 3D)`.
     + Khi click vào bất kỳ khối phòng nào của Tầng `f` (hoặc bấm nút ở Bottom Dock): Thực hiện chọn tầng `selectFloor(f)` và chuyển cảnh vào Mặt bằng 3D của Tầng đó.
2. **Ẩn hoàn toàn các khối vuông tòa nhà khi mở Mặt bằng Tầng 3D (`viewMode === 'FLOOR_3D'`):**
   - Khắc phục triệt để hiện tượng: Các khối vuông của tầng hiện tại (`buildingMeshes`) vẫn lấp ló ở giữa hành lang cutaway.
   - Khi vào `transitionToFloor(floorIndex)`: Ẩn $100\%$ các `buildingMeshes` (`mesh.visible = false` cho toàn bộ các khối tòa nhà).
   - Không gian hành lang trung tâm, cửa thang máy, sàn gỗ và nội thất của `FloorCutawayRenderer` hiển thị sạch sẽ, thoáng đãng, chuẩn xác như video TikTok mẫu.
   - Khi bấm `◀ QUAY LẠI TOÀN CẢNH TÒA NHÀ` (`transitionToBuilding`): Phục hồi hiển thị lại toàn bộ các khối vuông tòa nhà (`mesh.visible = true`).

---

## 2. Bảng Đánh Giá Mức Độ Ảnh Hưởng (Impact Assessment)

| Thành phần / Module | Mức độ thay đổi | Chi tiết ảnh hưởng | Đánh giá an toàn |
| :--- | :---: | :--- | :--- |
| **`packages/shared-types` (common)** | **0% (KHÔNG ĐỔI)** | Không thay đổi bất kỳ interface hay schema dữ liệu nào. | **Tuyệt đối an toàn**. |
| **`packages/renderer-3d`** | **Chỉnh sửa nhỏ** | 1. Sửa `transitionToFloor(floorIndex)`: Đặt `mesh.visible = false` cho toàn bộ `buildingMeshes`.<br>2. Bổ sung `setHoveredFloor(floorIndex: number | null)` trong `ThreeGameRenderer`: Phát sáng toàn bộ các khối phòng của tầng đang hover. | Rất rõ ràng, không làm gãy các phương thức cũ; bổ sung unit test kiểm tra ẩn mesh. |
| **`apps/web/src/components/Canvas3DStage.tsx`** | **Điều chỉnh UI** | 1. Ở `BUILDING` mode: Raycast bắt tầng -> gọi `setHoveredFloor(floorIndex)`, hiển thị tooltip Tầng; click chuột gọi `onSelectFloorCutaway(hit.floorIndex)`.<br>2. Bỏ render các badge/nhãn từng phòng ở ngoài tòa nhà (chỉ hiển thị nhãn/badge trên Mặt bằng Tầng 3D hoặc trong Drawer). | Giao diện ngoài tòa nhà trở nên tinh gọn, đúng trọng tâm điều hướng. |
| **Kiểm thử Playwright E2E** | **Cập nhật** | Cập nhật kịch bản E2E: click vào khối tầng trên tòa nhà 3D để vào mặt bằng tầng; kiểm tra không còn khối vuông building nổi ở hành lang. | Chạy toàn bộ unit tests và Playwright E2E trên Chrome thật. |

---

## 3. Tiêu Chí Nghiệm Thu (Acceptance Criteria)

- **AC-1:** Ở chế độ Toàn cảnh Tòa nhà, rê chuột vào bất kỳ phòng nào thì cả tầng đó phát sáng đồng bộ, tooltip hiện thông tin tầng; click vào khối bất kỳ của tầng thì chuyển cảnh mở Mặt bằng Tầng 3D.
- **AC-2:** Ở chế độ Toàn cảnh Tòa nhà, không còn nút bấm / nhãn riêng lẻ từng phòng đè lên mặt tiền.
- **AC-3:** Khi đã mở Mặt bằng Tầng 3D, hành lang trung tâm hoàn toàn thông thoáng, không còn khối vuông nào của tòa nhà lọt vào.
- **AC-4:** Khi bấm `◀ QUAY LẠI TOÀN CẢNH TÒA NHÀ`, toàn bộ các khối vuông của tòa nhà hiện lại đầy đủ và camera reset về góc 45°.
- **AC-5:** Toàn bộ unit tests và 6/6 kịch bản Playwright E2E PASS; $0\%$ thay đổi `packages/shared-types`.
