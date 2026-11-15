# Kế Hoạch Triển Khai: Bảng Số Phòng Nét Trên Cửa, Cánh Cửa Gỗ & Bảng Thông Tin Tường Mở Sổ F04

- **Mã kế hoạch:** `QLNT-PLAN-DOOR-BOARD-INFO-PLAQUE`
- **Tài liệu đặc tả (Spec):** `4.Du_an/QLNT/01-quan-ly/SPEC_CUA_GO_BANG_SO_VA_BANG_THONG_TIN_PHONG_3D.md`
- **Ngày lập:** `2026-11-15`
- **Trạng thái:** `Dự thảo — Chờ Chủ dự án duyệt trước khi triển khai`
- **Ranh giới cốt lõi:** **0% thay đổi `packages/shared-types` (common)**.

---

## 1. Phân Rã Các Task Triển Khai

### Task 1: Dựng Cánh Cửa Gỗ, Làm Nét Bảng Số Cửa & Tạo Bảng Thông Tin Tường (@qlnt/renderer-3d)
- **Tệp tin:**
  - `packages/renderer-3d/src/cutaway/floorCutawayRenderer.ts`
  - `packages/renderer-3d/src/threeGameRenderer.ts`
  - `packages/renderer-3d/tests/floorCutawayRenderer.test.ts`
- **Nội dung:**
  1. **Gỡ bỏ badge bay trên không:** Loại bỏ việc khởi tạo `yellowBadge`, `redBadge`, `sleepingBadge` bay tại $y = 1.8$.
  2. **Thêm cánh cửa gỗ:**
     - Tạo hàm `createWoodDoor(row: number)`: gồm khung cửa gỗ sẫm, cánh cửa gỗ nâu tự nhiên có huỳnh cửa, tay nắm kim loại vàng/bạc, mở hé góc $35^\circ$ vào trong phòng.
  3. **Làm nét bảng số phòng trên cửa:**
     - Đặt bảng số phòng ngay trên đỉnh khung cửa (`Over-door header`).
     - Tăng kích thước canvas texture lên $512 \times 160$, áp dụng font chữ đậm nét `bold 80px`, nền đen ánh kim viền vàng gold `#f59e0b`.
  4. **Tạo Bảng thông tin phòng trên tường bên phải cửa:**
     - Tạo hàm `createRoomInfoBoard(roomConfig, row: number)`:
       * Mesh hình chữ nhật gắn trên vách tường bên phải cửa.
       * Texture $512 \times 320$ sắc nét: Mã phòng & DT (`P201 · 25m²`), Tên khách (`Đỗ Quang Minh`), Trạng thái (`🟡 Chờ thu` / `🔴 Hỏng điều hòa` / `🟢 Bình thường`), Dòng chỉ dẫn `👉 Mở Sổ F04`.
       * Gắn `userData['type'] = 'room_info_board'`, `userData['roomId'] = roomConfig.roomId`.
     - Bổ sung vào danh sách raycast interactive meshes của renderer.
  5. **Bổ sung raycast picking:**
     - `pickRoomInfoPlaque(ndcX, ndcY)` trong `ThreeGameRenderer`.
  6. **Unit Tests:**
     - Kiểm tra có cánh cửa gỗ, có bảng số phòng trên cửa, có bảng thông tin tường, không còn badge bay $y=1.8$.

---

### Task 2: Kết Nối Bảng Thông Tin Với Sổ F04 & Dọn Dẹp Badge Lơ Lửng (@qlnt/web)
- **Tệp tin:**
  - `apps/web/src/components/Canvas3DStage.tsx`
  - `apps/web/tests/uiAndResponsive.test.ts`
- **Nội dung:**
  1. Gỡ bỏ hoàn toàn `projectedRoomBadges` (nhãn phòng và icon tròn lơ lửng) khi `viewMode === 'FLOOR_3D'`.
  2. Trong `handleCanvasPointerMove`:
     - Khi rê chuột vào Bảng thông tin phòng trên tường: Làm sáng viền bảng thông tin, đổi con trỏ sang dạng click (`pointer`), hiển thị tooltip chỉ dẫn mở Sổ F04.
  3. Trong `handleCanvasPointerUp`:
     - Khi click vào Bảng thông tin phòng: Gọi ngay `onSelectRoom(roomId, tab)` để mở Sổ Quản Lý Phòng F04 của phòng đó (ưu tiên tab thiết bị nếu có hỏng hóc, hóa đơn nếu có chờ thu).
  4. Unit Tests: Kiểm tra không render badge bay trên không trong FLOOR_3D, click bảng thông tin gọi mở Sổ F04.

---

### Task 3: Kiểm Thử E2E Playwright Trên Chrome & Chụp Ảnh Minh Chứng
- **Tệp tin:**
  - `apps/web/e2e/p1-flows.spec.ts`
  - `04-van-hanh/BAO_CAO_KIEM_THU_PLAYWRIGHT_P1.md`
- **Nội dung:**
  1. Cập nhật Playwright test:
     - Xác nhận trong FLOOR_3D không còn badge nổi trên đầu phòng.
     - Xác nhận cánh cửa gỗ và bảng thông tin trên tường xuất hiện.
     - Click vào Bảng thông tin phòng P202 -> mở đúng Sổ F04 của P202.
     - Chụp lại ảnh minh chứng: `apps/web/e2e-results/screenshots/06-3d-floor-cutaway-view.png`.
  2. Chạy `pnpm turbo run typecheck test build` và `pnpm --filter @qlnt/web test:e2e` (100% PASS).
