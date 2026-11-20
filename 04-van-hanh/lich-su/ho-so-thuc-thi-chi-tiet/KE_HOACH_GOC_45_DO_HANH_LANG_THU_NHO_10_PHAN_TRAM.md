# Kế Hoạch Triển Khai (Plan): Góc 45 Độ Chuẩn Tại Hành Lang, Tầm Nhìn Thu Nhỏ 10%

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Điều chỉnh camera mặc định khi mở tầng về góc 45 độ chuẩn Isometric tâm hành lang, thu nhỏ tầm nhìn 10% (Zoom 1.215) theo đúng mong muốn của người dùng.

---

### Bảng Đánh Giá Mức Độ Ảnh Hưởng (Impact Assessment)

| Hạng mục / Module | Mức độ thay đổi | Chi tiết ảnh hưởng | Đánh giá an toàn |
| :--- | :---: | :--- | :--- |
| **`packages/shared-types` (common)** | **0% (KHÔNG ĐỔI)** | Giữ nguyên 100% các interface, kiểu dữ liệu DTO. | **Tuyệt đối an toàn**. |
| **`packages/renderer-3d`** | **Chỉnh sửa** | Trong `threeGameRenderer.ts`: cập nhật `resetFloorIsometricCamera` với Yaw $45^\circ$, Pitch $35.264^\circ$, Zoom $1.215$, lookAt $(0, 0, 0)$. | Độc lập trong scene Three.js, bổ sung unit tests. |
| **`apps/web`** | **Chỉnh sửa** | Trong `Canvas3DStage.tsx`: nút "Góc chuẩn 45°" reset về góc 45° hành lang zoom 1.215. | Nâng cao trải nghiệm điều hướng cho người dùng. |
| **Kiểm thử Playwright E2E** | **Cập nhật** | Kiểm tra hiển thị góc 45° hành lang zoom 1.215, chụp ảnh minh chứng thực tế lưu tại `09-floor-cutaway-45deg-corridor-zoom10pct.png`. | Chạy toàn bộ E2E trên Chrome thật. |

---

## Chi tiết các bước triển khai (Tasks)

### Task 1: Cập nhật camera về góc 45° chuẩn tại hành lang, zoom 1.215 trong `ThreeGameRenderer`
**Mục tiêu:** Góc nhìn khi mở tầng là góc 45 độ isometric chuẩn, tâm nhìn ở hành lang, tầm nhìn thu nhỏ 10% (Zoom = 1.215).
- [x] **File cần sửa:** `packages/renderer-3d/src/threeGameRenderer.ts`
- [x] Trong `resetFloorIsometricCamera()`:
  - Yaw: $45^\circ$ (`THREE.MathUtils.degToRad(45)`).
  - Pitch: $35.264^\circ$ (`THREE.MathUtils.degToRad(35.264)`).
  - Zoom: $1.215$ (thu nhỏ 10% so với mức cận cảnh 1.35 trước đây).
  - `lookAt(0, 0, 0)` (tâm hành lang trung tâm).
- [x] Cập nhật unit test trong `packages/renderer-3d/tests/threeGameRenderer.test.ts`.

### Task 2: Giữ nhãn nút "Góc chuẩn 45°" và đồng bộ sự kiện trong `Canvas3DStage.tsx`
**Mục tiêu:** Nút bấm mang tên "Góc chuẩn 45°", click vào sẽ khôi phục góc 45° hành lang zoom 1.215.
- [x] **File cần sửa:** `apps/web/src/components/Canvas3DStage.tsx`
- [x] Giữ nhãn nút là "Góc chuẩn 45°" và title tương ứng.
- [x] Cập nhật unit tests trong `apps/web/tests/uiAndResponsive.test.ts`.

### Task 3: Kiểm thử tự động & Chụp ảnh minh chứng Playwright E2E
**Mục tiêu:** Xác minh toàn bộ hệ thống hoạt động ổn định, chụp ảnh so sánh góc nhìn 45° mới.
- [x] Chạy `pnpm turbo run typecheck test build` xác nhận $100\%$ PASS.
- [x] Cập nhật kịch bản Playwright E2E trong `apps/web/e2e/p1-flows.spec.ts`:
  - Mở Tầng 2: kiểm tra camera ở góc 45 độ chuẩn, zoom 1.215, tâm nhìn hành lang, cả 2 dãy phòng có tường 1.2m đầy đủ.
  - Chụp ảnh minh chứng thực tế lưu tại `apps/web/e2e-results/screenshots/09-floor-cutaway-45deg-corridor-zoom10pct.png`.
- [x] Báo cáo nghiệm thu hoàn tất cho người dùng.
