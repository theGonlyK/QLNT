# ĐẶC TẢ KỸ THUẬT & UX (SPEC): TƯƠNG TÁC TRỰC TIẾP TÒA NHÀ 3D MỞ SỔ PHÒNG & THU NHỎ DANH SÁCH PHÒNG/TẦNG VÀO GÓC

- **Mã tài liệu:** `QLNT-SPEC-P4-3D-INTERACT`
- **Ngày lập:** `2026-11-14`
- **Người lập:** BA Lead / Kiến trúc sư (Antigravity)
- **Phạm vi gói:** `apps/web` (`@qlnt/web`) & `packages/renderer-3d` (`@qlnt/renderer-3d`)
- **Trạng thái:** `Chờ chủ dự án duyệt (Confirmation Gate)`

---

## 1. Mục tiêu & Yêu cầu Người dùng

1. **Tương tác trực tiếp với Tòa nhà 3D để mở Sổ phòng (F04):**
   - Tòa nhà 3D Isometric hiển thị rõ ràng ở trung tâm sân khấu WebGL (`Canvas3DStage.tsx`), căn giữa khung nhìn theo số tầng (`totalFloors`) và số phòng/tầng (`roomsPerFloor`).
   - Hỗ trợ **Raycasting (Click & Hover)** trực tiếp trên `<canvas data-testid="three-game-canvas">`:
     - **Hover vào khối phòng trên tòa nhà 3D:** Khối phòng phát sáng nổi bật (emissive highlight), đổi con trỏ chuột thành `pointer` và hiển thị tooltip nổi thông tin phòng (`P101 • Tầng 1 • 22 m² • Trạng thái / Tên khách`).
     - **Click trực tiếp vào khối phòng trên tòa nhà 3D:** Mở thẳng **Sổ Quản Lý Phòng F04 (`openRoomDetail`)** đúng phòng đó (nếu phòng có thiết bị báo hỏng, ưu tiên mở tab `PAGE_2_DEVICES`; mặc định mở `PAGE_1_BILLING`).
   - Hỗ trợ **Điều khiển góc nhìn 3D trực quan**: Kéo chuột/chạm để xoay góc nhìn quanh tòa nhà (`OrbitControls` hoặc điều khiển xoay/pan mượt mà) + cuộn chuột/nút `+ / - / Đặt lại Isometric` để phóng to/thu nhỏ tòa nhà, mà vẫn phân biệt chính xác giữa thao tác kéo xoay (drag) và click chọn phòng.

2. **Thu nhỏ Danh sách Phòng & Tầng vào góc:**
   - Bảng danh sách phòng & tầng (`stage-room-drawer`) không còn che phủ cố định 65% sân khấu 3D.
   - Tích hợp nút **"Thu nhỏ vào góc" / "Mở danh sách phòng"** (`data-testid="toggle-room-drawer-btn"`, chiều cao tối thiểu `44px`):
     - **Trạng thái Thu nhỏ (Dock ở góc dưới-trái hoặc góc trên-phải):** Hiển thị gọn như một viên thuốc/thẻ nhỏ ở góc (`📋 Danh sách Phòng & Tầng (12)` + badge số phòng chờ thu/báo hỏng), trả lại toàn bộ không gian sân khấu cho tòa nhà 3D.
     - **Trạng thái Mở rộng (Floating Panel ở góc):** Hiển thị danh sách phòng theo từng tầng trong khung cuộn nhỏ gọn đặt ở góc, có thể bấm để chọn nhanh phòng hoặc bấm thu gọn lại bất cứ lúc nào.

---

## 2. Bảng Đánh giá Tác động (Impact Assessment Table)

> [!IMPORTANT]
> Cam kết tuân thủ quy tắc `user_global`: **Không sửa đổi bất kỳ dòng code nào trong `packages/shared-types` (`common`)**, `packages/domain-core`, và `packages/renderer-2d`.

| STT | Hạng mục / File bị ảnh hưởng | Loại thay đổi | Mức độ ảnh hưởng | Chi tiết tác động |
| :--- | :--- | :---: | :---: | :--- |
| 1 | `packages/shared-types/**` (`common`) | **Không sửa** | `0%` | Giữ nguyên 100% `IGameRenderer` và toàn bộ DTO/Entity. |
| 2 | `packages/domain-core/**` & `packages/renderer-2d/**` | **Không sửa** | `0%` | Giữ nguyên 100%. |
| 3 | `packages/renderer-3d/src/threeGameRenderer.ts` | **Cập nhật** | Thấp | Căn giữa tòa nhà 3D quanh gốc tọa độ `(0,0,0)` theo `totalFloors` & `roomsPerFloor`; bổ sung màu phân tầng/mái/cửa sổ nhẹ nhàng; bổ sung helper `pickBuildingRoom(ndcX, ndcY)` (THREE.Raycaster), `setHoveredRoom(floorIndex, roomIndex)`, `rotateCamera(deltaYaw)` / `zoomCamera(factor)` / `resetIsometricCamera()`. |
| 4 | `apps/web/src/components/Canvas3DStage.tsx` | **Cập nhật** | Trung bình | Gắn sự kiện Pointer (click chọn phòng 3D vs drag xoay góc nhìn, hover hiển thị tooltip phòng), thêm thanh công cụ góc nhìn 3D (`Zoom +`, `Zoom -`, `Góc chuẩn 45°`), và biến bảng danh sách phòng/tầng thành **Corner Collapsible Drawer** có nút thu nhỏ vào góc (`toggle-room-drawer-btn`). |
| 5 | `packages/renderer-3d/tests/*.test.ts`, `apps/web/tests/uiAndResponsive.test.ts`, `apps/web/e2e/p1-flows.spec.ts` | **Cập nhật & Bổ sung** | Thấp | Thêm unit test cho `pickBuildingRoom()` / `setHoveredRoom()`, unit test UI cho nút thu nhỏ danh sách vào góc, và E2E test kiểm tra click vào canvas 3D mở sổ phòng + thu nhỏ/mở rộng danh sách phòng vào góc. |

---

## 3. Tiêu chí Nghiệm thu (Acceptance Criteria)

- **AC-3D-01:** Khối tòa nhà 3D hiển thị rõ ở chính giữa khung hình, không bị danh sách phòng che khuất khi thu nhỏ vào góc.
- **AC-3D-02:** Bấm vào nút **"Thu nhỏ vào góc" (`toggle-room-drawer-btn`)** sẽ thu gọn bảng danh sách phòng & tầng thành một thẻ nhỏ nằm gọn ở góc; bấm lại sẽ mở rộng danh sách phòng & tầng.
- **AC-3D-03:** Click trực tiếp lên khối phòng trên `<canvas data-testid="three-game-canvas">` (thông qua Raycasting `pickBuildingRoom`) sẽ ánh xạ đúng sang phòng tương ứng (`rooms` theo `floor_number` và thứ tự phòng trên tầng) và mở **Sổ Quản Lý Phòng F04 (`room-detail-single-page`)**.
- **AC-3D-04:** Kéo chuột trên canvas 3D hoặc bấm nút xoay/zoom có thể xoay góc nhìn quanh tòa nhà và thu phóng mượt mà; nút **"Góc chuẩn 45°"** đưa camera về đúng góc Isometric chuẩn.
- **AC-3D-05:** Toàn bộ Unit Tests + Build + Playwright Chrome E2E PASS 100%, nút bấm đạt `minHeight >= 44px`, không tràn ngang trên Mobile `390×844`.
