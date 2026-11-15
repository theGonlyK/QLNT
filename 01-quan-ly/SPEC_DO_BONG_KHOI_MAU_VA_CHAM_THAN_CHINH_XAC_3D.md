# Đặc tả Kỹ thuật (Spec): Điều Chỉnh Đổ Bóng Khối Màu & Đánh Dấu Chấm Than Chính Xác Vào Từng Khối 3D

- **Mã tính năng:** `QLNT-FEAT-3D-ALERT-SHADOW-AND-ACCURATE-NOTICE-BADGES`
- **Phiên bản:** `1.0`
- **Ngày lập:** `2026-11-15`
- **Trạng thái:** `Dự thảo — Chờ Chủ dự án duyệt trước khi triển khai`

---

## 1. Mục tiêu Nghiệp vụ & Trải nghiệm Người dùng (UX/UI Goal)

Khi người dùng chuyển đổi các kiểu khối toà nhà (như Tháp $2\times2\times6$, Khối vuông $3\times3\times3$):
1. **Khắc phục lỗi lệch dấu chấm than cảnh báo (`NoticeBadge`):**
   - **Hiện trạng:** Công thức cũ hardcode `anchor.z = mesh.position.z + 0.72` (vốn tính cho toà nhà 1 hàng phẳng cũ). Khi toà nhà chuyển thành lưới 3D đa chiều $X \times Z \times Y$, dấu chấm than của các phòng hàng sau (Row 0) bị đẩy về phía trước $+0.72\text{m}$, đâm xuyên vào hoặc cắm nhầm lên khối phòng của hàng trước (Row 1), khiến dấu chấm than đỏ/vàng nằm trên khối phòng xanh bình thường, còn khối đỏ/vàng lại không có dấu chấm than.
   - **Giải pháp:** Cập nhật `getRoomBadgeAnchor(roomId)` tính toán neo chính xác tuyệt đối theo vị trí 3D thực tế của chính khối phòng đó:
     - Với khối phòng hàng trước (`rowIdx === rows - 1`): Neo mặt tiền phía trước nhô nhẹ ra ngoài bề mặt phòng (`z = mesh.position.z + sz/2 + 0.15`, `y = mesh.position.y + 0.25`).
     - Với khối phòng hàng sau / hàng giữa (`rowIdx < rows - 1`): Neo ở **đỉnh trên cùng của chính khối phòng đó** (`y = mesh.position.y + sy/2 + 0.25`, `x = mesh.position.x`, `z = mesh.position.z`) hoặc nhô cao lên mặt ngoài nhìn thấy được từ camera Isometric $45^\circ$. Dấu chấm than luôn cắm đúng $100\%$ vào khối phòng mang màu cảnh báo tương ứng.
2. **Điều chỉnh đổ bóng & độ sáng khối cảnh báo (khối có màu khác mặc định):**
   - **Hiện trạng:** Các khối báo hỏng (đỏ `0xff4444`) và nợ tiền/chờ thu (cam `0xd97706`) hiện đang bật `receiveShadow = true` với vật liệu `MeshLambertMaterial` thuần túy. Khi bị bóng râm của các tầng phía trên đổ xuống, khối màu đỏ/cam bị sẫm tối thành màu đen/nâu bẩn xỉn màu, mất đi tính chất trực quan của một khối cảnh báo nổi bật.
   - **Giải pháp:**
     - Thiết lập `receiveShadow = false` cho các khối phòng có màu cảnh báo để chúng không bị bóng râm của tầng trên đè tối đen, giữ cho màu sắc cảnh báo luôn tươi sáng, rõ ràng và rực rỡ từ mọi góc nhìn.
     - Bổ sung ánh sáng tự thân nhẹ (`emissive: 0x441111` cho khối đỏ báo hỏng; `emissive: 0x331c00` cho khối cam nợ tiền) để bề mặt các khối này luôn rực sáng chuẩn phong cách game 3D isometric hiện đại.
     - Vẫn giữ `castShadow = true` để khối phòng vẫn đổ bóng tự nhiên lên nền sàn và các bề mặt xung quanh.

---

## 2. Bảng Đánh Giá Mức Độ Ảnh Hưởng (Impact Assessment)

| Thành phần / Module | Mức độ thay đổi | Chi tiết ảnh hưởng | Đánh giá an toàn |
| :--- | :---: | :--- | :--- |
| **`packages/shared-types` (common)** | **0% (KHÔNG ĐỔI)** | Giữ nguyên 100% các interface và kiểu dữ liệu DTO hiện có. | **Tuyệt đối an toàn**. |
| **`packages/renderer-3d`** | **Chỉnh sửa** | Trong `ThreeGameRenderer.ts`: Sửa `getRoomBadgeAnchor()` neo chuẩn xác theo tọa độ từng khối phòng 3D; sửa `updateRoomMeshColor()` bổ sung `emissive` và tắt `receiveShadow` cho khối cảnh báo đỏ/cam. | Độc lập trong Three.js, có unit tests bảo vệ. |
| **`apps/web`** | **Không đổi** | Cả `ledgerController`, `Canvas3DStage`, `BuildingSetupModal` đã kết nối hoàn chỉnh. | Không phát sinh rủi ro giao diện. |
| **Kiểm thử Unit & E2E** | **Cập nhật** | Bổ sung unit tests cho toạ độ anchor đa chiều và thuộc tính vật liệu cảnh báo; cập nhật ảnh chụp Playwright Chrome nghiệm thu. | Xác minh tự động qua Chrome. |

---

## 3. Tiêu Chí Nghiệm Thu (Acceptance Criteria)

- **AC-1:** Khi toà nhà ở bất kỳ layout nào (mặc định $2\times2\times3$, tháp $2\times2\times6$, lập phương $3\times3\times3$...), dấu chấm than đỏ và vàng phải cắm chính xác $100\%$ vào đúng khối phòng tương ứng, không bị cắm nhầm sang khối phòng khác hay chìm vào bên trong.
- **AC-2:** Các khối có màu khác mặc định (đỏ, cam) không bị bóng râm của tầng trên đè tối sầm, màu sắc luôn tươi sáng, sắc nét và có chiều sâu thẩm mỹ cao.
- **AC-3:** Toàn bộ $146+$ unit tests và $7/7$ test suites Playwright E2E chạy trên Google Chrome đạt PASS $100\%$, chụp ảnh nghiệm thu xác nhận.
- **AC-4:** $0\%$ thay đổi mã nguồn trong `packages/shared-types`.
