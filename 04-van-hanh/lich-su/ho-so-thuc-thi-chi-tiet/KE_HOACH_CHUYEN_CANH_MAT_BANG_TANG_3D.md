# Kế Hoạch Triển Khai: Chuyển Cảnh Mặt Bằng Tầng 3D Isometric & Tương Tác Căn Phòng

- **Mã kế hoạch:** `QLNT-PLAN-3D-FLOOR-CUTAWAY`
- **Tài liệu đặc tả (Spec):** `4.Du_an/QLNT/01-quan-ly/SPEC_CHUYEN_CANH_MAT_BANG_TANG_3D.md`
- **Ngày lập:** `2026-11-15`
- **Trạng thái:** `Dự thảo — Chờ Chủ dự án duyệt trước khi triển khai`
- **Ranh giới cốt lõi (Core Constraint):** **0% thay đổi `packages/shared-types` (common)**.

---

## 1. Phân Rã Các Hạng Mục Công Việc (Task Decomposition)

### Task 1: Engine 3D Mặt Bằng Tầng Cutaway (@qlnt/renderer-3d)
- **Tệp chỉnh sửa/tạo mới:**
  - Tạo mới: `packages/renderer-3d/src/cutaway/floorCutawayRenderer.ts`
  - Chỉnh sửa: `packages/renderer-3d/src/threeGameRenderer.ts`
  - Export: `packages/renderer-3d/src/index.ts`
  - Kiểm thử: `packages/renderer-3d/tests/floorCutawayRenderer.test.ts`
- **Mục tiêu:**
  - Xây dựng module `FloorCutawayRenderer` dựng toàn bộ mặt bằng của một tầng dạng 3D Isometric Cutaway:
    + Tường lửng/kính viền khung đen quanh từng phòng ($1.2$m chiều cao), sàn gỗ cho phòng, sàn gạch xám cho hành lang.
    + Bố trí nội thất procedurally hoặc từ GLTF cache: giường ngủ (`bedSingle`), bàn làm việc (`desk`), ghế xoay (`chair`).
    + Đặt avatar 3D cho phòng có khách thuê (`OCCUPIED`).
    + Đặt Notice Badges (`!` Vàng chưa nộp tiền, `!` Đỏ hỏng thiết bị) tại vị trí nổi trên từng phòng.
  - Tích hợp vào `ThreeGameRenderer`:
    + `renderFloorCutaway(floorIndex: number, rooms: RoomDetailDTO[]): Promise<void>`
    + `clearFloorCutaway(): void`
    + `pickFloorRoom(ndcX: number, ndcY: number): PickedFloorRoom | null`
    + `setFloorHoveredRoom(roomIndex: number | null): void`
    + `transitionToFloor(floorIndex: number): Promise<void>` (chuyển động camera zoom in vào tầng)
    + `transitionToBuilding(): Promise<void>` (chuyển động camera zoom out về toàn cảnh tòa nhà)
- **Kiểm thử Unit Test:**
  - Khởi tạo mặt bằng tầng $4$ phòng với nội thất và kiểm tra số mesh được thêm vào scene.
  - Raycast picking trả về đúng `roomId` và `roomIndex`.
  - Chuyển cảnh camera cập nhật đúng góc nhìn và vị trí.

---

### Task 2: Quản Lý Trạng Thái Chuyển Cảnh & Bridge (@qlnt/web)
- **Tệp chỉnh sửa:**
  - `apps/web/src/bridge/ledgerController.ts`
  - `apps/web/src/bridge/useRendererBridge.ts`
  - Kiểm thử: `apps/web/tests/ledgerController.test.ts`
- **Mục tiêu:**
  - Bổ sung trạng thái vào `LedgerController`:
    + `viewMode: 'BUILDING' | 'FLOOR_3D'` (mặc định `'BUILDING'`)
    + `activeFloorIndex: number` (mặc định $0$)
    + `selectFloor(floorIndex: number): Promise<void>` -> chuyển `viewMode = 'FLOOR_3D'`, gọi `renderer.transitionToFloor(floorIndex)` và `renderer.renderFloorCutaway(floorIndex, floorRooms)`.
    + `backToBuilding(): Promise<void>` -> chuyển `viewMode = 'BUILDING'`, gọi `renderer.transitionToBuilding()` và phục hồi mô hình tòa nhà.
    + `openRoomDetailFromFloor(roomId: string, tab?: RoomDetailTab): Promise<void>` -> mở thẳng Sổ phòng F04 từ phòng đang chọn trên mặt bằng tầng 3D.
  - Expose toàn bộ qua `useRendererBridge` hook để component React dễ dàng sử dụng.
- **Kiểm thử Unit Test:**
  - Test chuyển đổi trạng thái `selectFloor` và `backToBuilding`.
  - Test gọi đúng action mở Sổ F04 tương ứng `roomId`.

---

### Task 3: Giao Diện Tương Tác Sân Khấu 3D (@qlnt/web)
- **Tệp chỉnh sửa:**
  - `apps/web/src/components/Canvas3DStage.tsx`
  - `apps/web/src/App.tsx`
  - Kiểm thử: `apps/web/tests/uiAndResponsive.test.ts`
- **Mục tiêu:**
  - Nâng cấp `Canvas3DStage.tsx`:
    + Khi ở chế độ `BUILDING`:
      * Click trực tiếp vào khối tầng hoặc nút chọn tầng sẽ kích hoạt `selectFloor(floorIndex)`.
      * Bổ sung nút "Khám phá Mặt bằng Tầng 3D" trên HUD hoặc click trực tiếp vào tòa nhà.
    + Khi ở chế độ `FLOOR_3D`:
      * Nút `◀ Toàn Cảnh Tòa Nhà` (chuẩn touch target $\ge 44$px) đặt ở góc trên-trái để quay lại.
      * Thanh phân khu/tầng ở đáy màn hình: Dãy nút `[Tầng 1] [Tầng 2] [Tầng 3]...` (phong cách tương tự video TikTok, có indicator sáng cho tầng hiện tại).
      * Rê chuột lên căn phòng trên mặt bằng 3D: Hiện tooltip nổi (Mã phòng, Khách thuê, Diện tích, Giá thuê, Trạng thái điện/nước/thiết bị).
      * Click vào căn phòng trên mặt bằng 3D: Mở trực tiếp Sổ Quản Lý Phòng F04 của phòng đó.
      * Click vào Chấm than Vàng (!) mở ngay Trang 1 Hóa đơn; Click Chấm than Đỏ (!) mở ngay Trang 2 Thiết bị.
      * Tương thích hoàn hảo với Corner Drawer (danh sách phòng & tầng có thể mở rộng/thu gọn ở góc mà không che khuất mặt bằng 3D).

---

### Task 4: Kiểm Thử E2E Playwright Trên Trình Duyệt Chrome Thật & Cập Nhật Tài Liệu
- **Tệp chỉnh sửa:**
  - `apps/web/e2e/p1-flows.spec.ts`
  - `04-van-hanh/BAO_CAO_KIEM_THU_PLAYWRIGHT_P1.md`
  - `01-quan-ly/implementation_plan.md`
- **Mục tiêu:**
  - Bổ sung kịch bản kiểm thử tự động Playwright E2E: `TC-P1-FLOOR-CUTAWAY`:
    1. Vào ứng dụng ở chế độ Tòa nhà 3D.
    2. Click chọn Tầng 2 trên mô hình 3D hoặc thanh điều hướng.
    3. Xác nhận chuyển cảnh sang chế độ `FLOOR_3D`: Xuất hiện mặt bằng tầng 3D, thanh chuyển tầng ở đáy, nút `◀ Toàn Cảnh Tòa Nhà`.
    4. Rê chuột và click vào phòng P202 trên mặt bằng 3D -> Xác nhận mở Sổ Quản Lý Phòng F04 của P202.
    5. Đóng Sổ F04 -> Bấm nút `◀ Toàn Cảnh Tòa Nhà` -> Xác nhận chuyển cảnh quay về Tòa nhà 3D ban đầu.
    6. Chụp ảnh minh chứng thực tế trên Chrome: `apps/web/e2e-results/screenshots/06-3d-floor-cutaway-view.png`.
  - Chạy toàn bộ test suites (`pnpm turbo run typecheck test build` và `playwright test`).
  - Cập nhật báo cáo kiểm thử và sổ bàn giao.
