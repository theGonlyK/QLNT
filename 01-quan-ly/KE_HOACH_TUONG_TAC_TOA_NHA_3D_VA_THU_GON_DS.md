# Tương Tác Trực Tiếp Tòa Nhà 3D Mở Sổ Phòng & Thu Nhỏ Danh Sách Phòng/Tầng Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Cho phép người dùng tương tác trực tiếp với mô hình Tòa nhà 3D Isometric (click vào phòng trên 3D để mở Sổ phòng F04, hover làm nổi bật phòng + tooltip, xoay/zoom góc nhìn) và thu nhỏ/mở rộng bảng Danh sách phòng & tầng vào góc màn hình.

**Architecture:** Mở rộng `ThreeGameRenderer` trong `@qlnt/renderer-3d` để căn giữa khối tòa nhà 3D, phân biệt màu/viền từng phòng, bổ sung `THREE.Raycaster` (`pickBuildingRoom`), highlight phòng đang hover (`setHoveredRoom`), và điều khiển góc nhìn camera (`orbitCamera`, `zoomCamera`, `resetIsometricCamera`) mà không thay đổi `IGameRenderer` trong `@qlnt/shared-types`. Tại `@qlnt/web`, cập nhật `Canvas3DStage.tsx` để kết nối pointer events trên `<canvas>` với `onSelectRoom` / `onSelectFloor` và chuyển danh sách phòng & tầng thành panel có thể thu nhỏ gọn vào góc.

**Tech Stack:** Three.js (`THREE.Raycaster`, `OrthographicCamera`), React 19, TypeScript 5.8, Tailwind CSS v4, Vitest, Playwright Chrome E2E.

**Spec:** [SPEC_TUONG_TAC_TOA_NHA_3D_VA_THU_GON_DS.md](file:///Users/minhntv/Documents/Work/MinhNTV/TEAM_ORCA/4.Du_an/QLNT/01-quan-ly/SPEC_TUONG_TAC_TOA_NHA_3D_VA_THU_GON_DS.md)

## Global Constraints

- **0% sửa `common`:** Tuyệt đối không chỉnh sửa `packages/shared-types`, `packages/domain-core`, `packages/renderer-2d`.
- **Giữ nguyên tương thích `IGameRenderer`:** Các method tương tác bổ sung trên `ThreeGameRenderer` là public method mở rộng của class `ThreeGameRenderer`, không phá vỡ interface `IGameRenderer`.
- **Touch target `>= 44px` & Mobile `390x844`:** Tất cả các nút điều khiển góc nhìn 3D và nút thu nhỏ/mở rộng danh sách phòng phải có `minHeight: 44px`.

---

### Task 1: Bổ sung Raycasting, Highlight Hover, Căn giữa Tòa nhà & Điều khiển Camera vào `@qlnt/renderer-3d`

**Files:**
- Modify: [threeGameRenderer.ts](file:///Users/minhntv/Documents/Work/MinhNTV/TEAM_ORCA/4.Du_an/QLNT/packages/renderer-3d/src/threeGameRenderer.ts)
- Test: `packages/renderer-3d/tests/threeGameRenderer.test.ts` (bổ sung test case cho `pickBuildingRoom`, `setHoveredRoom`, `orbitCamera`, `zoomCamera`, `resetIsometricCamera`).

- [ ] **Step 1:** Viết unit test kiểm thử:
  - `renderBuilding` căn giữa tòa nhà quanh `(0, y, 0)` và gắn `userData: { type: 'building', floor, room, roomId }`.
  - `pickBuildingRoom(0, 0)` trả về thông tin phòng (`{ floorIndex, roomIndex, roomId }`) khi tia raycast trúng khối phòng, và `null` khi ra ngoài.
  - `setHoveredRoom(floorIndex, roomIndex)` làm sáng vật liệu (`emissive`) của đúng khối phòng đó và reset phòng cũ.
  - `zoomCamera` / `orbitCamera` / `resetIsometricCamera` cập nhật đúng `camera.zoom` và `camera.position`.
- [ ] **Step 2:** Chạy `pnpm --filter @qlnt/renderer-3d test` xác nhận FAIL trước khi sửa.
- [ ] **Step 3:** Triển khai trong `threeGameRenderer.ts` (lưu map mesh theo `${floor}-${room}`, raycast trên mảng building meshes, hỗ trợ `orbitCamera`, `zoomCamera`, `resetIsometricCamera`).
- [ ] **Step 4:** Chạy `pnpm --filter @qlnt/renderer-3d typecheck test build` xác nhận PASS 100%.

---

### Task 2: Cập nhật `Canvas3DStage.tsx` — Tương tác trực tiếp 3D Canvas & Thu nhỏ Danh sách Phòng/Tầng vào góc

**Files:**
- Modify: [Canvas3DStage.tsx](file:///Users/minhntv/Documents/Work/MinhNTV/TEAM_ORCA/4.Du_an/QLNT/apps/web/src/components/Canvas3DStage.tsx)
- Test: [uiAndResponsive.test.ts](file:///Users/minhntv/Documents/Work/MinhNTV/TEAM_ORCA/4.Du_an/QLNT/apps/web/tests/uiAndResponsive.test.ts)

- [ ] **Step 1:** Bổ sung unit test kiểm tra `Canvas3DStage` có:
  - Nút thu nhỏ/mở rộng danh sách phòng & tầng (`data-testid="toggle-room-drawer-btn"`), `min-height: 44px`.
  - Trạng thái thu gọn vào góc (`data-drawer-collapsed="true" | "false"`).
  - Các nút điều khiển góc nhìn 3D (`btn-3d-zoom-in`, `btn-3d-zoom-out`, `btn-3d-reset-view`).
- [ ] **Step 2:** Cập nhật `Canvas3DStage.tsx`:
  - Giữ tham chiếu `rendererRef` tới `ThreeGameRenderer`.
  - Bắt sự kiện pointer trên `<canvas data-testid="three-game-canvas">`:
    - Di chuyển chuột (`onPointerMove`): tính tọa độ chuẩn hóa NDC `[-1, 1]`, gọi `renderer.pickBuildingRoom(ndcX, ndcY)` -> nếu trúng phòng, tìm `RoomQuickPickItem` tương ứng theo `(floorIndex + 1, roomIndex)`, gọi `renderer.setHoveredRoom(floorIndex, roomIndex)` và hiện **Tooltip nổi** (`data-testid="stage-3d-hover-tooltip"`) ngay trên canvas (`P101 • Tầng 1 • 22 m² • Nhấn để mở sổ phòng`).
    - Kéo chuột (`onPointerDown` + `onPointerMove` với khoảng cách `> 5px`): gọi `renderer.orbitCamera(deltaX * 0.01)` để xoay quanh tòa nhà 3D.
    - Nhả chuột không kéo (`<= 5px`): gọi `renderer.pickBuildingRoom(ndcX, ndcY)` -> ánh xạ ra đúng `room.id` và gọi `onSelectRoom(room.id, ...)` để **mở Sổ Quản Lý Phòng F04**.
    - Cuộn chuột (`onWheel`): phóng to/thu nhỏ nhẹ `renderer.zoomCamera(...)`.
  - Chuyển danh sách phòng & tầng sang **Corner Collapsible Drawer** ở góc dưới-trái:
    - Mặc định mở hoặc có thể bấm nút **"Thu nhỏ vào góc"** (`toggle-room-drawer-btn`) để thu gọn thành 1 nút pill nhỏ ở góc (`📋 Danh sách Phòng (12)`), nhường trọn không gian cho tòa nhà 3D!
- [ ] **Step 3:** Chạy `pnpm --filter @qlnt/web typecheck test` xác nhận PASS.

---

### Task 3: Kiểm thử Trình duyệt Playwright E2E & Cập nhật Tài liệu

**Files:**
- Modify: [p1-flows.spec.ts](file:///Users/minhntv/Documents/Work/MinhNTV/TEAM_ORCA/4.Du_an/QLNT/apps/web/e2e/p1-flows.spec.ts)
- Modify: `4.Du_an/QLNT/04-van-hanh/BAO_CAO_KIEM_THU_PLAYWRIGHT_P1.md`

- [ ] **Step 1:** Bổ sung kịch bản E2E kiểm thử:
  - Thu nhỏ danh sách phòng & tầng vào góc (`toggle-room-drawer-btn`) -> xác nhận `stage-room-drawer` có `data-drawer-collapsed="true"` và không che sân khấu 3D; chụp ảnh `05-3d-stage-drawer-collapsed.png`.
  - Click vào tọa độ trung tâm của tòa nhà 3D trên `<canvas data-testid="three-game-canvas">` -> xác nhận mở đúng **Sổ Quản Lý Phòng F04 (`room-detail-single-page`)**!
  - Mở rộng lại danh sách phòng từ góc -> xác nhận hoạt động bình thường trên cả Desktop và Mobile `390×844`.
- [ ] **Step 2:** Chạy `pnpm turbo run typecheck test build` và `pnpm --filter @qlnt/web test:e2e`.
