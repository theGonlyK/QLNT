# Định Vị Chính Xác Biểu Tượng Chấm Than Trạng Thái Trên Từng Phòng Của Tòa Nhà 3D Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Đảm bảo các biểu tượng trạng thái chấm than Vàng (`PAYMENT_DUE` / `BILL_PENDING`) và chấm than Đỏ (`BROKEN`) hiển thị chính xác tại đúng vị trí không gian của từng phòng đang báo cáo vấn đề trên Tòa nhà 3D (không bị chồng tại một điểm), tự động di chuyển theo khi xoay/zoom tòa nhà và cho phép click trực tiếp vào chấm than của phòng nào để mở ngay Sổ F04 của phòng đó.

**Architecture:** Khắc phục việc lệch định danh `roomId` (UUID thực vs `room-1..N`) và tọa độ cố định `(0, 2.5, 0)` trong `ThreeGameRenderer` bằng cơ chế ánh xạ `bindRoomIds()` và tính toán tọa độ mặt tiền riêng cho từng phòng `getRoomBadgeAnchor(roomId, slot)`. Đồng thời cung cấp `getProjectedRoomPositions()` để `Canvas3DStage.tsx` ghim chính xác nhãn phòng + huy hiệu chấm than Vàng/Đỏ có thể tương tác lên đúng từng khối phòng trên tòa nhà 3D.

**Tech Stack:** Three.js (`THREE.Vector3.project`, `NoticeBadge`), React 19, TypeScript 5.8, Tailwind CSS v4, Vitest, Playwright Chrome E2E.

**Spec:** [SPEC_HIEN_THI_TRANG_THAI_CHAM_THAN_3D_THEO_PHONG.md](file:///Users/minhntv/Documents/Work/MinhNTV/TEAM_ORCA/4.Du_an/QLNT/01-quan-ly/SPEC_HIEN_THI_TRANG_THAI_CHAM_THAN_3D_THEO_PHONG.md)

## Global Constraints

- **0% sửa `common`:** Tuyệt đối không chỉnh sửa `packages/shared-types`, `packages/domain-core`, `packages/renderer-2d`.
- **Định vị độc lập từng phòng:** Hai phòng khác nhau (`P101` ở Tầng 1 và `P204` ở Tầng 2) phải có tọa độ `NoticeBadge` 3D và tọa độ chiếu màn hình hoàn toàn tách biệt, đúng vị trí khối hộp của phòng đó.
- **Tự động xóa khi xử lý xong:** Khi duyệt hóa đơn (`approveRoomBillOneTouch`) hoặc hoàn tất sửa thiết bị (`resolveDeviceMaintenance`), chấm than tại phòng đó trên tòa nhà 3D phải biến mất ngay lập tức.

---

### Task 1: Sửa định vị `NoticeBadge` 3D theo từng phòng & bổ sung `bindRoomIds` + `getProjectedRoomPositions` trong `@qlnt/renderer-3d`

**Files:**
- Modify: [threeGameRenderer.ts](file:///Users/minhntv/Documents/Work/MinhNTV/TEAM_ORCA/4.Du_an/QLNT/packages/renderer-3d/src/threeGameRenderer.ts)
- Test: [threeGameRenderer.test.ts](file:///Users/minhntv/Documents/Work/MinhNTV/TEAM_ORCA/4.Du_an/QLNT/packages/renderer-3d/tests/threeGameRenderer.test.ts)

- [ ] **Step 1:** Viết unit test trong `threeGameRenderer.test.ts` kiểm tra:
  - Khi gọi `bindRoomIds` cho 12 phòng (`P101`..`P304`) rồi gọi `setRoomNotice(p101Id, 'PAYMENT_DUE')` và `setDeviceStatus(p204Id, 'ac', 'BROKEN')`, hai `NoticeBadge` được tạo tại **2 tọa độ `(x, y, z)` hoàn toàn khác nhau**, khớp với `mesh.position` của `P101` (Tầng 1, phòng 1) và `P204` (Tầng 2, phòng 4), nằm ở mặt trước (`z > 0`) để không bị tầng trên che.
  - Hàm `getProjectedRoomPositions(800, 600)` trả về danh sách tọa độ màn hình `(screenX, screenY)` riêng biệt cho từng phòng.
- [ ] **Step 2:** Chạy `pnpm --filter @qlnt/renderer-3d test` xác nhận test mới FAIL.
- [ ] **Step 3:** Cập nhật `threeGameRenderer.ts`:
  - Thêm `bindRoomIds(mappings: Array<{ roomId: string; floorIndex: number; roomIndex: number; roomNumber?: string }>): void`.
  - Thêm helper nội bộ `findRoomMesh(roomId: string): THREE.Mesh | undefined` tìm theo `mesh.userData['roomId'] === roomId || mesh.userData['legacyRoomId'] === roomId`.
  - Thêm `getRoomBadgeAnchor(roomId: string, kind: 'ROOM_NOTICE' | 'DEVICE_BROKEN'): Vector3D`:
    - Nếu tìm thấy `mesh`: trả về `{ x: mesh.position.x + (kind === 'DEVICE_BROKEN' ? 0.18 : -0.18), y: mesh.position.y + 0.15, z: mesh.position.z + 0.72 }`.
  - Trong `setRoomNotice(roomId, type)` và `setDeviceStatus(roomId, deviceId, status)`:
    - Đặt `NoticeBadge` tại `getRoomBadgeAnchor(roomId, ...)` và gọi `badge.setAnchorPosition(anchor.x, anchor.y, anchor.z)`.
    - Cập nhật màu khối phòng đúng cho `mesh` của `roomId` (không còn fallback `roomId === 'room-1'` làm đổi màu nhầm phòng 1).
  - Thêm `getProjectedRoomPositions(width: number, height: number): Array<{ floorIndex: number; roomIndex: number; roomId: string; roomNumber?: string; x: number; y: number }>`.
- [ ] **Step 4:** Chạy `pnpm --filter @qlnt/renderer-3d typecheck test build` xác nhận PASS 100%.

---

### Task 2: Đồng bộ `bindRoomIds` trong `LedgerController` & Hiển thị Chấm than Trạng thái tại từng phòng trên Tòa nhà 3D trong `Canvas3DStage.tsx`

**Files:**
- Modify: [ledgerController.ts](file:///Users/minhntv/Documents/Work/MinhNTV/TEAM_ORCA/4.Du_an/QLNT/apps/web/src/bridge/ledgerController.ts)
- Modify: [Canvas3DStage.tsx](file:///Users/minhntv/Documents/Work/MinhNTV/TEAM_ORCA/4.Du_an/QLNT/apps/web/src/components/Canvas3DStage.tsx)
- Test: [uiAndResponsive.test.ts](file:///Users/minhntv/Documents/Work/MinhNTV/TEAM_ORCA/4.Du_an/QLNT/apps/web/tests/uiAndResponsive.test.ts)

- [ ] **Step 1:** Trong `LedgerController.syncAllToRenderer()` (`ledgerController.ts`):
  - Sau `renderBuilding`, nhóm `this.rooms` theo từng tầng (`1..total_floors`), sắp xếp theo `room_number`, và nếu `this.renderer` có method `bindRoomIds` thì gọi `bindRoomIds` để gắn đúng `room.id` và `room.room_number` vào từng khối hộp 3D trước khi chạy vòng lặp `setRoomNotice` và `setDeviceStatus`.
- [ ] **Step 2:** Trong `Canvas3DStage.tsx`:
  - Tính toán vị trí ghim 2D/3D cho từng phòng trên tòa nhà 3D (lấy từ `renderer.getProjectedRoomPositions(width, height)` khi WebGL sẵn sàng và cập nhật khi xoay/zoom/resize, kèm công thức tọa độ dự phòng Isometric chuẩn để SSR/unit test cũng render đầy đủ):
  - Tại đúng tọa độ mỗi phòng trên mô hình Tòa nhà 3D, hiển thị cụm ghim trạng thái (`data-testid="building-3d-pin-${room.room_number}"`):
    - Nhãn mã phòng nhỏ gọn (`P101`..`P304`).
    - Nếu phòng có `noticeType !== 'NONE'` (`PAYMENT_DUE` / `BILL_PENDING`): hiển thị chấm than vàng **`!`** (`data-testid="building-3d-yellow-badge-${room.room_number}"`) ngay tại phòng đó; click vào mở ngay `onSelectRoom(room.id, 'PAGE_1_BILLING')`.
    - Nếu phòng có `hasBrokenDevice === true`: hiển thị chấm than đỏ **`!`** (`data-testid="building-3d-red-badge-${room.room_number}"`) ngay tại phòng đó; click vào mở ngay `onSelectRoom(room.id, 'PAGE_2_DEVICES')`.
- [ ] **Step 3:** Bổ sung unit test trong `uiAndResponsive.test.ts` kiểm tra các chấm than trên tòa nhà 3D (`building-3d-yellow-badge-P101`, `building-3d-red-badge-P204`, `building-3d-red-badge-P302`) chỉ xuất hiện đúng ở những phòng đang có vấn đề và không xuất hiện ở phòng đã đóng đủ tiền/không hỏng (`P104`, `P304`).
- [ ] **Step 4:** Chạy `pnpm --filter @qlnt/web typecheck test` xác nhận PASS.

---

### Task 3: Kiểm thử Playwright Chrome E2E & Cập nhật Báo cáo

**Files:**
- Modify: [p1-flows.spec.ts](file:///Users/minhntv/Documents/Work/MinhNTV/TEAM_ORCA/4.Du_an/QLNT/apps/web/e2e/p1-flows.spec.ts)
- Modify: [BAO_CAO_KIEM_THU_PLAYWRIGHT_P1.md](file:///Users/minhntv/Documents/Work/MinhNTV/TEAM_ORCA/4.Du_an/QLNT/04-van-hanh/BAO_CAO_KIEM_THU_PLAYWRIGHT_P1.md)

- [ ] **Step 1:** Cập nhật kịch bản `TC-P1-3D-INTERACT` trong `p1-flows.spec.ts`:
  - Thu nhỏ danh sách phòng vào góc (`toggle-room-drawer-btn`).
  - Kiểm tra trên Tòa nhà 3D: các phòng đang có vấn đề (`P101`, `P102`, `P103`, `P201`, `P202` có `building-3d-yellow-badge-*`; `P204`, `P302` có `building-3d-red-badge-*`) đều hiển thị chấm than tại tọa độ `(x, y)` **riêng biệt của từng phòng**; trong khi `P104` và `P304` không có chấm than.
  - Chụp lại ảnh `05-3d-stage-drawer-collapsed.png` làm bằng chứng trực quan.
  - Click trực tiếp vào chấm than đỏ trên tòa nhà 3D của phòng `P204` (`building-3d-red-badge-P204`) -> xác nhận mở đúng **Sổ Quản Lý F04 của phòng P204 tại Trang 2 (Thiết bị & Bảo trì)**!
- [ ] **Step 2:** Chạy `pnpm turbo run typecheck test build` và `pnpm --filter @qlnt/web test:e2e`.
