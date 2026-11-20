# Kế Hoạch Triển Khai: Chọn Theo Tầng Ở Mô Hình Tòa Nhà & Ẩn Khối Vuông Ở Hành Lang

- **Mã kế hoạch:** `QLNT-PLAN-FLOOR-PICK-CLEAN-CORRIDOR`
- **Tài liệu đặc tả (Spec):** `4.Du_an/QLNT/01-quan-ly/SPEC_CHON_TANG_TOA_NHA_VA_AN_KHOI_HANH_LANG.md`
- **Ngày lập:** `2026-11-15`
- **Trạng thái:** `Dự thảo — Chờ Chủ dự án duyệt trước khi triển khai`
- **Ranh giới cốt lõi:** **0% thay đổi `packages/shared-types` (common)**.

---

## 1. Phân Rã Các Task Triển Khai

### Task 1: Ẩn 100% Khối Vuông Tòa Nhà Khi Vào Mặt Bằng Tầng & Thêm Highlight Cả Tầng (@qlnt/renderer-3d)
- **Tệp tin:**
  - `packages/renderer-3d/src/threeGameRenderer.ts`
  - `packages/renderer-3d/tests/threeGameRenderer.test.ts`
- **Nội dung:**
  - Sửa `transitionToFloor(floorIndex: number)`:
    ```typescript
    // Ẩn toàn bộ các khối building meshes để không bị lộ khối vuông ở hành lang
    for (const mesh of this.buildingMeshes) {
      mesh.visible = false;
    }
    ```
  - Thêm phương thức `setHoveredFloor(floorIndex: number | null)` trong `ThreeGameRenderer`:
    + Khi `floorIndex !== null`: tìm tất cả `buildingMeshes` có `mesh.userData['floor'] === floorIndex` và đặt `emissive.setHex(0xfbbf24)` với `emissiveIntensity = 0.5`. Các tầng khác reset emissive về 0.
    + Khi `floorIndex === null`: reset toàn bộ emissive.
  - Viết unit test xác minh `transitionToFloor` ẩn toàn bộ building meshes và `transitionToBuilding` khôi phục lại hiển thị.

---

### Task 2: Chuyển Tương Tác Ngoài Tòa Nhà Sang Chọn Tầng & Dọn Dẹp UI Canvas3DStage (@qlnt/web)
- **Tệp tin:**
  - `apps/web/src/components/Canvas3DStage.tsx`
  - `apps/web/tests/uiAndResponsive.test.ts`
- **Nội dung:**
  - Trong `handleCanvasPointerMove`:
    + Khi `viewMode === 'BUILDING'`: Bắt `hit = pickBuildingRoom(ndc)` -> nếu trúng thì gọi `renderer.setHoveredFloor(hit.floorIndex)`, hiển thị Tooltip Tầng (`Tầng ${hit.floorIndex + 1} · ${số phòng} phòng · ${tổng DT} m² · Nhấn để mở Mặt bằng 3D Tầng`). Nếu không trúng, gọi `renderer.setHoveredFloor(null)`.
  - Trong `handleCanvasPointerUp`:
    + Khi `viewMode === 'BUILDING'`: Click chuột vào bất kỳ khối phòng nào thuộc tầng -> gọi ngay `onSelectFloorCutaway(hit.floorIndex)` để chuyển cảnh vào Mặt bằng Tầng 3D.
  - Trong phần render overlay badges:
    + Khi `viewMode === 'BUILDING'`: Không render nhãn phòng hay chấm than từng phòng đè lên mặt tiền tòa nhà (giữ tòa nhà sạch sẽ, chỉ hiển thị số tầng tổng quan).
    + Khi `viewMode === 'FLOOR_3D'`: Chỉ hiển thị các nhãn/badge của chính Mặt bằng Tầng 3D cutaway.

---

### Task 3: Cập Nhật Kiểm Thử E2E Playwright & Báo Cáo
- **Tệp tin:**
  - `apps/web/e2e/p1-flows.spec.ts`
  - `04-van-hanh/BAO_CAO_KIEM_THU_PLAYWRIGHT_P1.md`
- **Nội dung:**
  - Cập nhật test suite E2E:
    + Kiểm tra click trực tiếp lên khối tầng trên canvas 3D tòa nhà để vào mặt bằng tầng.
    + Xác nhận hành lang tầng sạch sẽ, không còn khối vuông của tòa nhà.
    + Chụp lại ảnh screenshot mới: `apps/web/e2e-results/screenshots/06-3d-floor-cutaway-view.png`.
  - Chạy `pnpm turbo run typecheck test build` và `pnpm --filter @qlnt/web test:e2e` đảm bảo toàn bộ PASS.
