# Kế Hoạch Triển Khai (Plan): Góc Nhìn Mặc Định Dọc Hành Lang & Đầy Đủ Tường Cho 2 Dãy Phòng 3D

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Thiết lập góc nhìn camera mặc định khi mở tầng chạy dọc theo hành lang trung tâm, đồng thời nâng chiều cao tường ngoài của dãy phòng Row 1 lên đầy đủ 1.2m đồng bộ như dãy phòng Row 0 theo đúng hình ảnh người dùng yêu cầu.

---

### Bảng Đánh Giá Mức Độ Ảnh Hưởng (Impact Assessment)

| Hạng mục / Module | Mức độ thay đổi | Chi tiết ảnh hưởng | Đánh giá an toàn |
| :--- | :---: | :--- | :--- |
| **`packages/shared-types` (common)** | **0% (KHÔNG ĐỔI)** | Giữ nguyên 100% các interface, kiểu dữ liệu DTO. | **Tuyệt đối an toàn**. |
| **`packages/renderer-3d`** | **Chỉnh sửa** | 1. `floorCutawayRenderer.ts`: Sửa tường ngoài Row 1 từ $0.35\text{m}$ thành $H = 1.2\text{m}$ có nẹp viền đen.<br>2. `threeGameRenderer.ts`: Cập nhật `transitionToFloor` sang góc nhìn dọc hành lang (Yaw $\approx 82^\circ$, Pitch $\approx 56^\circ$, Zoom $\approx 1.12$) và bổ sung `resetFloorIsometricCamera()`. | Độc lập trong scene Three.js, bổ sung unit tests. |
| **`apps/web`** | **Chỉnh sửa** | Trong `Canvas3DStage.tsx`: Nút "Góc chuẩn" sẽ gọi `resetFloorIsometricCamera()` khi đang ở `FLOOR_3D` và `resetIsometricCamera()` khi ở `BUILDING`. | Nâng cao trải nghiệm điều hướng cho người dùng. |
| **Kiểm thử Playwright E2E** | **Cập nhật** | Kiểm tra hiển thị đầy đủ tường cả 2 dãy phòng, chụp ảnh minh chứng thực tế góc nhìn mới theo yêu cầu. | Chạy toàn bộ E2E trên Chrome thật và chụp ảnh minh chứng. |

---

## Chi tiết các bước triển khai (Tasks)

### Task 1: Nâng chiều cao tường ngoài Row 1 thành đầy đủ 1.2m có nẹp viền
**Mục tiêu:** Cả 2 dãy phòng đều có 4 bức tường bao quanh đồng đều $1.2\text{m}$, không còn tình trạng dãy phòng phía trước bị trơ/trống tường.
- [x] **File cần sửa:** `packages/renderer-3d/src/cutaway/floorCutawayRenderer.ts`
- [x] Tại dòng tạo tường ngoài của Row 1:
  - Thay thế `addWallSegment(W, 0.35, T, 0, 0, D / 2 - T / 2)` bằng `addWallSegment(W, H, T, 0, 0, D / 2 - T / 2)`.
  - Hàm `addWallSegment` sẽ tự động tạo phân đoạn tường cao $1.2\text{m}$ cùng nẹp viền đen cap trim ($0.03\text{m}$) trên đỉnh tường.
- [x] Bổ sung/cập nhật unit tests trong `packages/renderer-3d/tests/floorCutawayRenderer.test.ts`.

### Task 2: Cài đặt góc nhìn camera mặc định dọc hành lang khi mở tầng
**Mục tiêu:** Khi mở tầng, camera lập tức hiển thị góc nhìn dọc theo hành lang trung tâm giữa 2 dãy phòng giống ảnh chụp thực tế.
- [x] **File cần sửa:** `packages/renderer-3d/src/threeGameRenderer.ts`
- [x] Trong `transitionToFloor(floorIndex: number)`:
  - Đặt góc camera:
    - Yaw: $82^\circ$ (`THREE.MathUtils.degToRad(82)`).
    - Pitch: $56^\circ$ (`THREE.MathUtils.degToRad(56)`).
    - Zoom: $1.12$.
    - `camera.position.set(distance * Math.sin(yawRad) * Math.cos(pitchRad), distance * Math.sin(pitchRad), distance * Math.cos(yawRad) * Math.cos(pitchRad))`.
    - `camera.lookAt(0, 0, 0)`.
- [x] Thêm phương thức `resetFloorIsometricCamera()` trong `ThreeGameRenderer`:
  - Khôi phục lại góc nhìn chuẩn của mặt bằng tầng (Yaw $82^\circ$, Pitch $56^\circ$, Zoom $1.12$).
- [x] Cập nhật unit tests trong `packages/renderer-3d/tests/threeGameRenderer.test.ts`.

### Task 3: Cập nhật nút "Góc chuẩn" trong `Canvas3DStage.tsx`
**Mục tiêu:** Người dùng ấn "Góc chuẩn" khi đang ở `FLOOR_3D` sẽ quay về góc nhìn dọc hành lang của tầng.
- [x] **File cần sửa:** `apps/web/src/components/Canvas3DStage.tsx`
- [x] Tại sự kiện `onClick` của nút "Góc chuẩn":
  - Nếu `viewMode === 'FLOOR_3D'`: gọi `rendererRef.current?.resetFloorIsometricCamera?.() ?? rendererRef.current?.resetIsometricCamera()`.
  - Nếu `viewMode === 'BUILDING'`: gọi `rendererRef.current?.resetIsometricCamera()`.
- [x] Cập nhật unit test trong `apps/web/tests/uiAndResponsive.test.ts`.

### Task 4: Kiểm thử tự động & Chụp ảnh minh chứng Playwright E2E
**Mục tiêu:** Xác minh toàn bộ hệ thống hoạt động ổn định, chụp ảnh so sánh góc nhìn mới.
- [x] Chạy `pnpm turbo run typecheck test build` xác nhận $100\%$ PASS.
- [x] Cập nhật kịch bản Playwright E2E trong `apps/web/e2e/p1-flows.spec.ts`:
  - Mở Tầng 2: kiểm tra góc camera và cả 2 dãy phòng đều có tường bao quanh đầy đủ.
  - Chụp ảnh minh chứng thực tế lưu tại `apps/web/e2e-results/screenshots/08-floor-cutaway-vertical-corridor-view.png`.
- [x] Báo cáo nghiệm thu hoàn tất cho người dùng.
