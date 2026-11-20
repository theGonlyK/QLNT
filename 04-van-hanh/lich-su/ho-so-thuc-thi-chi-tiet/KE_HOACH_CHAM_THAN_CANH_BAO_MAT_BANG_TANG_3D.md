# Kế Hoạch Triển Khai (Plan): Điều Chỉnh Dấu Chấm Than Cảnh Báo Vào Đúng Phòng Khi Mở Tầng 3D

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Khắc phục triệt để lỗi dấu chấm than cảnh báo bay lệch phòng/lệch tầng khi mở mặt bằng tầng 3D, định vị chính xác chấm than vàng/đỏ vào đúng phòng tương ứng và hỗ trợ click mở trực tiếp trang Sổ F04.

---

### Bảng Đánh Giá Mức Độ Ảnh Hưởng (Impact Assessment)

| Hạng mục / Module | Mức độ thay đổi | Chi tiết ảnh hưởng | Đánh giá an toàn |
| :--- | :---: | :--- | :--- |
| **`packages/shared-types` (common)** | **0% (KHÔNG ĐỔI)** | Giữ nguyên 100% các interface, kiểu dữ liệu DTO. | **Tuyệt đối an toàn**. |
| **`packages/renderer-3d`** | **Mở rộng** | 1. `threeGameRenderer.ts`: Quản lý ẩn toàn bộ `this.badges` khi vào tầng (`transitionToFloor`), khôi phục khi quay lại (`transitionToBuilding`).<br>2. `floorCutawayRenderer.ts`: Render `NoticeBadge` trực tiếp cho từng phòng có cảnh báo (`hasPaymentNotice`, `hasBrokenDevice`), định vị tại lối vào phòng độ cao $Y = 1.7\text{m}$, cập nhật bobbing animation, hỗ trợ `pickNoticeBadge`. | Độc lập trong scene Three.js, bổ sung unit tests. |
| **`apps/web`** | **Chỉnh sửa** | Trong `Canvas3DStage.tsx`: Xử lý click trúng dấu chấm than trên sàn tầng để mở Sổ F04 đúng trang Hóa đơn / Thiết bị. | Nâng cao trải nghiệm người dùng, click vào cảnh báo mở ngay việc cần làm. |
| **Kiểm thử Playwright E2E** | **Cập nhật** | Bổ sung kiểm tra vị trí dấu chấm than trên tầng, click dấu chấm than mở đúng trang sổ F04. | Chạy toàn bộ E2E trên Chrome thật và chụp ảnh minh chứng. |

---

## Chi tiết các bước triển khai (Tasks)

### Task 1: Quản lý ẩn/hiện building badges trong `ThreeGameRenderer`
**Mục tiêu:** Đảm bảo khi mở tầng, không còn bất kỳ dấu chấm than nào của mô hình tòa nhà bên ngoài (đặc biệt là của các tầng khác) sót lại trong scene.
- [x] **File cần sửa:** `packages/renderer-3d/src/threeGameRenderer.ts`
- [x] Trong `transitionToFloor(floorIndex: number)`:
  - Duyệt qua `this.badges.values()` và gán `badge.visible = false` cho tất cả các badges cấp tòa nhà.
- [x] Trong `transitionToBuilding()`:
  - Duyệt qua `this.badges.values()` và gán `badge.visible = true` để phục hồi lại các chấm than cảnh báo của toàn tòa nhà.
- [x] Bổ sung/cập nhật unit tests trong `packages/renderer-3d/tests/threeGameRenderer.test.ts`.

### Task 2: Dựng `NoticeBadge` chuẩn xác vào từng phòng trong `FloorCutawayRenderer`
**Mục tiêu:** Mỗi phòng có cảnh báo trên tầng đang mở sẽ hiển thị dấu chấm than vàng / đỏ nhấp nhô nhẹ nhàng ngay tại phòng đó.
- [x] **File cần sửa:** `packages/renderer-3d/src/cutaway/floorCutawayRenderer.ts`
- [x] Trong `createRoomMeshGroup`:
  - Kiểm tra `roomConfig.hasPaymentNotice` (hoặc `roomConfig.noticeType !== 'NONE'`):
    - Khởi tạo `NoticeBadge` màu vàng (`PAYMENT_DUE` hoặc `BILL_PENDING`).
    - Neo tại vị trí trên đỉnh cửa / bảng thông tin của phòng:
      - Nếu có cả cảnh báo đỏ: neo tại $X = \text{posX} - 0.25$, $Y = 1.7\text{m}$, $Z = \text{doorZ}$.
      - Nếu chỉ có cảnh báo vàng: neo tại $X = \text{posX}$, $Y = 1.7\text{m}$, $Z = \text{doorZ}$.
    - Gán `userData = { type: 'cutaway_notice_badge', roomId: roomConfig.roomId, noticeKind: 'PAYMENT' }`.
    - Thêm vào danh sách `this.badges` và `this.group`.
  - Kiểm tra `roomConfig.hasBrokenDevice`:
    - Khởi tạo `NoticeBadge` màu đỏ (`BROKEN`).
    - Neo tại vị trí trên đỉnh cửa / bảng thông tin của phòng:
      - Nếu có cả cảnh báo vàng: neo tại $X = \text{posX} + 0.25$, $Y = 1.7\text{m}$, $Z = \text{doorZ}$.
      - Nếu chỉ có cảnh báo đỏ: neo tại $X = \text{posX}$, $Y = 1.7\text{m}$, $Z = \text{doorZ}$.
    - Gán `userData = { type: 'cutaway_notice_badge', roomId: roomConfig.roomId, noticeKind: 'DEVICE' }`.
    - Thêm vào danh sách `this.badges` và `this.group`.
- [x] Thêm phương thức `pickNoticeBadge(raycaster)` để phát hiện click vào dấu chấm than.
- [x] Đảm bảo `update(delta)` cập nhật hoạt ảnh bobbing cho tất cả các badge trong `this.badges`.
- [x] Đảm bảo `clear()` giải phóng (dispose) sạch sẽ toàn bộ các badge.
- [x] Bổ sung unit tests trong `packages/renderer-3d/tests/floorCutawayRenderer.test.ts`.

### Task 3: Bắt sự kiện click vào dấu chấm than trong `Canvas3DStage.tsx`
**Mục tiêu:** Click vào dấu chấm than trên phòng sẽ mở ngay trang Sổ F04 tương ứng.
- [x] **File cần sửa:** `packages/renderer-3d/src/threeGameRenderer.ts` & `apps/web/src/components/Canvas3DStage.tsx`
- [x] Trong `ThreeGameRenderer`: Cung cấp hàm `pickFloorNoticeBadge(ndcX, ndcY)` gọi xuống `floorCutawayRenderer.pickNoticeBadge`.
- [x] Trong `Canvas3DStage.tsx`:
  - Khi người dùng click chuột trong `viewMode === 'FLOOR_3D'`:
    - Kiểm tra `pickFloorNoticeBadge`:
      - Nếu trúng badge `PAYMENT`: gọi `onSelectRoom(roomId, 'PAGE_1_BILLING')`.
      - Nếu trúng badge `DEVICE`: gọi `onSelectRoom(roomId, 'PAGE_2_DEVICES')`.
    - Khi rê chuột (pointer move): nếu trúng notice badge thì đổi con trỏ thành `pointer` và hiển thị tooltip thích hợp.
- [x] Cập nhật unit tests trong `apps/web/tests/uiAndResponsive.test.ts`.

### Task 4: Kiểm thử tự động & Chụp ảnh minh chứng Playwright E2E
**Mục tiêu:** Đảm bảo toàn bộ hệ sinh thái test vượt qua $100\%$ và ghi lại bằng chứng trực quan.
- [x] Chạy `pnpm turbo run typecheck test build` xác nhận $100\%$ test pass.
- [x] Cập nhật kịch bản Playwright E2E trong `apps/web/e2e/p1-flows.spec.ts`:
  - Kiểm tra khi mở Tầng 2: Phòng P201 có chấm than vàng, P204 có chấm than đỏ, P203 không có chấm than, không có chấm than của Tầng 1/Tầng 3.
  - Kiểm tra click vào chấm than vàng phòng P201 -> Sổ F04 mở ngay Trang 1 Hóa đơn.
  - Chụp ảnh minh chứng thực tế lưu tại `apps/web/e2e-results/screenshots/07-floor-cutaway-notice-badges.png`.
- [x] Báo cáo nghiệm thu hoàn tất.
