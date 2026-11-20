# ĐẶC TẢ KỸ THUẬT & ĐỒ HỌA 3D (SPEC): TĂNG ĐỘ SÁNG VÀ BỔ SUNG ĐÈN ĐIỆN CHIẾU SÁNG BÊN TRONG CÁC PHÒNG MẶT CẮT TẦNG (FLOOR CUTAWAY 3D)

- **Dự án:** Quản Lý Nhà Trọ 3D (`QLNT`) — Phân hệ Mặt Bằng Tầng 3D Cutaway
- **Ngày lập:** 2026-11-16
- **Trạng thái:** Dự thảo chờ Chủ dự án xác nhận
- **Ràng buộc kiến trúc:**
  - Tuân thủ tuyệt đối `NT-01` (Headless Core độc lập).
  - **0% thay đổi** trong `packages/shared-types` (`common`).
  - Bảo toàn 100% giá trị màu gốc `0x8b5a2b` của sàn gỗ sồi và cấu hình mặc định của `setupIsometricLighting` để tương thích ngược toàn bộ Unit Tests hiện hành.

---

## 1. Phân Tích Hiện Trạng & Giải Pháp Ánh Sáng Đèn Điện 3D

### 1.1. Nguyên nhân mặt cắt các phòng hiện tại bị tối
Qua ảnh nghiệm thu mặt bằng tầng 3D Cutaway (`09-floor-cutaway-45deg-corridor-zoom10pct.png`):
1. Cảnh 3D chỉ sử dụng 1 nguồn `AmbientLight` (`0.6`) và 1 `DirectionalLight` (`1.2`) từ ngoài chiếu xuống, khiến các bức tường cao `1.2m` đổ bóng tối sẫm phủ kín lên sàn phòng và nội thất bên trong.
2. Bên trong mỗi phòng chưa có nguồn sáng đèn điện cục bộ (`PointLight`) hay bóng đèn trực quan, nên không gian phòng có cảm giác thiếu sinh khí và hơi tối.

### 1.2. Giải pháp Chiếu Sáng Đèn Điện Nội Thất (`FloorCutawayRenderer` & `ThreeGameRenderer`)
1. **Đèn điện trần từng phòng (`THREE.PointLight`):**
   - Mỗi phòng trong `FloorCutawayRenderer.createRoomMeshGroup()` được lắp 1 nguồn sáng `THREE.PointLight` tại vị trí trung tâm phía trên phòng `(0, 1.85, 0)`:
     - Màu ánh sáng đèn LED ấm dễ chịu: `0xfff1c9` (tông vàng trắng 3200K tự nhiên).
     - Cường độ sáng (`intensity`): **`8.5`** cho phòng đang thuê (`OCCUPIED`) và **`4.5`** cho phòng trống (`VACANT`), tầm phủ `distance: 8.0`, suy giảm tự nhiên `decay: 1.35`.
     - Gắn `userData: { type: 'room_electric_light', roomId: roomConfig.roomId }`.
2. **Đèn gắn tường phát sáng trực quan (`room_lamp_fixture`):**
   - Gắn trên mép trên tường hậu của mỗi phòng một cụm đèn LED treo tường nhỏ gọn gồm đế kim loại (`0x334155`) và chao bóng đèn phát sáng (`color: 0xfff8e7`, `emissive: 0xffe49e`, `emissiveIntensity: 1.8` khi có khách thuê / `0.9` khi trống), giúp người dùng nhìn thấy trực tiếp nguồn đèn điện chiếu xuống giường, bàn và sàn gỗ.
3. **Ánh sáng vòm hắt trần mặt cắt (`THREE.HemisphereLight`) & Làm sáng tường nội thất:**
   - Thêm `THREE.HemisphereLight(0xfffdf5, 0xd6c7b2, 0.95)` vào `FloorCutawayRenderer.group` (chỉ có hiệu lực khi xem mặt bằng tầng 3D Cutaway và tự động dọn dẹp khi thoát).
   - Nâng màu sơn tường nội thất từ xám tối `0xe0ded8` lên trắng kem sáng ấm **`0xf5f2eb`** và tinh chỉnh `roughness: 0.5` cho sàn gỗ sồi `0x8b5a2b` để phản chiếu ánh đèn điện rực rỡ, ấm cúng.
4. **Tăng nhẹ ánh sáng tổng thể khi vào chế độ `FLOOR_3D` (`ThreeGameRenderer.ts`):**
   - Trong `transitionToFloor()`: nâng `lighting.ambient.intensity` lên `0.95` và `lighting.directional.intensity` lên `1.45`.
   - Trong `transitionToBuilding()`: khôi phục nguyên trạng (`ambient: 0.6`, `directional: 1.2`) để giữ đúng sắc độ kiến trúc bên ngoài tòa nhà.

---

## 2. Bảng Đánh Giá Vùng Ảnh Hưởng (Impact Assessment)

| STT | Khu vực / Module | Tệp tin ảnh hưởng | Mức độ ảnh hưởng | Nội dung thay đổi | Biện pháp kiểm soát rủi ro |
|---|---|---|---|---|---|
| 1 | **Common (`packages/shared-types`)** | *Không có* | **0% (Không ảnh hưởng)** | Giữ nguyên 100% schema và types. | Tuyệt đối không chỉnh sửa `packages/shared-types`. |
| 2 | **Renderer 3D — Cutaway (`@qlnt/renderer-3d`)** | `packages/renderer-3d/src/cutaway/floorCutawayRenderer.ts` | **Trung bình** | Bổ sung `HemisphereLight` cho mặt cắt tầng, `PointLight` đèn điện cho từng phòng, cụm bóng đèn phát sáng (`room_lamp_fixture`), làm sáng sơn tường `0xf5f2eb` và phản xạ sàn gỗ. | Giữ nguyên màu sàn `0x8b5a2b` và `corridorMat` `0xcbd5e1` để bảo toàn 100% test hiện tại; dọn dẹp sạch tài nguyên đèn khi `clear()`/`dispose()`. |
| 3 | **Renderer 3D — Orchestrator (`@qlnt/renderer-3d`)** | `packages/renderer-3d/src/ThreeGameRenderer.ts` | **Thấp** | Nâng `ambient` (`0.95`) và `directional` (`1.45`) trong `transitionToFloor()`; khôi phục (`0.6` / `1.2`) trong `transitionToBuilding()`. | Không sửa mặc định của `isometricLighting.ts`. |
| 4 | **Unit & E2E Tests** | `packages/renderer-3d/tests/floorCutawayRenderer.test.ts`, `apps/web/e2e/p1-flows.spec.ts` | **Thấp** | Bổ sung unit test xác minh mỗi phòng có `PointLight` + `room_lamp_fixture` và `HemisphereLight` mặt cắt; chụp ảnh nghiệm thu ánh sáng phòng 3D trên Chrome. | Chạy 100% unit tests (`181+`) và 8/8 Playwright Chrome E2E Suites PASS. |

---

## 3. Tiêu Chí Nghiệm Thu (Definition of Done - DoD)

1. Mỗi phòng trong Mặt bằng Tầng 3D Cutaway có `THREE.PointLight` ánh sáng vàng ấm (`0xfff1c9`) và cụm đèn phát sáng trực quan (`room_lamp_fixture`).
2. Không gian nội thất các phòng (sàn gỗ, giường, bàn, tủ, cửa gỗ) sáng rõ, ấm áp như có đèn điện chiếu vào; khi quay lại toàn cảnh tòa nhà (`transitionToBuilding`), ánh sáng trở về mặc định (`0.6` / `1.2`).
3. Toàn bộ Unit Tests (`@qlnt/renderer-3d` và cả workspace) cùng 8/8 Playwright Chrome E2E Suites đạt PASS 100%, kèm ảnh chụp nghiệm thu thực tế `22-3d-floor-cutaway-electric-lit-rooms.png`.
