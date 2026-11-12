# Quy chuẩn Camera Isometric, Hệ tọa độ 3D, Sprite/Placeholder 2D & Checklist Brief Asset 3D — QLNT

- **Dự án:** Quản lý nhà trọ (QLNT)
- **Thực hiện:** Tech Contributor + 2D Visual Lead/Agent + 3D Artist Lead/Agent (Hoàn thành các task Sprint 1 của Tech, 2D Visual và 3D Artist)
- **Ngày ban hành:** 2026-11-12
- **Trạng thái:** `Hoàn thành trong Sprint 1`
- **Căn cứ tham chiếu:**
  - `01-quan-ly/DECISIONS.md` (`QLNT-D008`, `QLNT-D010..D014`)
  - `03-ky-thuat/DANH_GIA_THU_VIEN_3D_OBJECTS.md` (`REF-TECH-001`)
  - `.agents/skills/artist-3d-modeler/SKILL.md` (Quy chuẩn pipeline `sand3d` & `Kenney CC0`)

---

## 1. Thông số Camera Isometric Cố định & Hệ Tọa độ Logic 3D (`Tech Contributor`)

### 1.1. Cấu hình Camera Isometric trong Three.js (`QLNT-D008`)
- **Loại Camera:** `THREE.OrthographicCamera` (không biến dạng phối cảnh xa gần, giữ đúng phong cách game quản lý tòa nhà/căn hộ Isometric).
- **Góc nhìn chuẩn (True Isometric / Dimetric Game Angle):**
  - Góc xoay ngang (Azimuth / Yaw): **`45°`** (`Math.PI / 4`).
  - Góc chúc xuống (Elevation / Pitch): **`35.264°`** (`Math.atan(1 / Math.sqrt(2))`) hoặc **`30°` Dimetric** cố định — **khóa xoay tự do (`enableRotate = false`)**, chỉ cho phép **Pan (kéo ngang/dọc theo tầng)** và **Zoom (phóng to/thu nhỏ có giới hạn `minZoom = 0.6`, `maxZoom = 2.5`)**.
- **Chuyển cảnh vào Sổ quản lý ảo F04:** Khi mở Sổ F04, Camera thực hiện hiệu ứng nội suy mượt (`GSAP / Lerp` trong `450ms`) hướng xuống mặt bàn quản lý hoặc chuyển sang lớp `Single-Page Book Viewport` chính diện.

### 1.2. Hệ Tọa độ Logic Độc lập Màn hình (`World & Grid Coordinate System`)
- **Trục tọa độ Thế giới (`Right-handed Y-up` chuẩn Three.js & glTF):**
  - `X`: Chiều ngang mặt tiền tòa nhà (Trái $\rightarrow$ Phải).
  - `Y`: Chiều cao tầng nhà (Dưới $\rightarrow$ Trên, `1 tầng = 3.0m`).
  - `Z`: Chiều sâu phòng/hành lang (Sau $\rightarrow$ Trước).
- **Đơn vị chuẩn (`Unit Scale`):** `1 unit Three.js = 1.0 mét` ngoài đời thực.
- **Kích thước ô lưới chuẩn (`Grid Tile`):**
  - `1 ô lưới nội thất = 1.0m x 1.0m`.
  - `1 module phòng trọ tiêu chuẩn P1 = 4.0m (Rộng X) x 5.0m (Sâu Z) x 3.0m (Cao Y)` (tương ứng diện tích `20m²`).
- **Tọa độ Logic lưu trong Database / Headless Core:** Lưu theo bộ `(floorIndex, roomGridX, roomGridZ, localSlotId)` hoàn toàn độc lập với tọa độ pixel trên màn hình thiết bị.

---

## 2. Quy chuẩn Sprite 2D, Mặt bằng Tầng 2D & Placeholder trong Cảnh 3D (`2D Visual Lead & Agent`)

### 2.1. Quy chuẩn Mặt bằng Tầng 2D & Trang Sổ Quản lý Ảo F04 (`QLNT-D010..D013`)
- **Định dạng xuất file:** `SVG` (vector sắc nét ở mọi mức zoom trên mobile) kết hợp `WebP / PNG 2x` cho chất liệu giấy sổ tay.
- **Tỷ lệ khung trang đơn (`Single-Page Aspect Ratio`):** Thiết kế theo tỷ lệ dọc **`9:16` / `3:4` co giãn linh hoạt (Responsive Card)**, lề an toàn `16px`, kích thước chữ tối thiểu `14px` (tiêu đề `18px`), độ tương phản chữ/nền giấy đạt chuẩn `WCAG AA (>= 4.5:1)`.
- **Bảng mã màu trạng thái phòng trên Mặt bằng 2D:**
  - `Phòng trống (EMPTY)`: Nền xanh lá nhạt (`#DCFCE7`), viền `#22C55E`.
  - `Phòng đang ở ổn định (OCCUPIED)`: Nền trắng kem giấy sổ (`#FEFCE8`), viền `#A16207`.
  - `Chờ duyệt Bill / Đến hạn thu tiền (Chấm than vàng)`: Viền vàng cam (`#F59E0B`) + Icon **Chấm than vàng (`!`)** góc phải trên (`24x24px`).
  - `Có thiết bị báo hỏng (Chấm than đỏ)`: Viền đỏ (`#EF4444`) + Icon **Chấm than đỏ (`!`)** nhấp nháy nhẹ (`24x24px`).

### 2.2. Quy chuẩn Sprite / Plane 2D (`Billboard`) trong Không gian 3D (Giai đoạn MVP P1)
- **Kích thước Sprite Sheet / Atlas:** `512x512px` hoặc `1024x1024px` (`Power-of-Two`), định dạng `WebP / KTX2`, nền trong suốt (`Alpha Test = 0.5` để tránh lỗi sắp xếp chiều sâu `Z-sorting` trong Three.js).
- **Điểm neo (`Pivot / Anchor Point`):** Đặt tại **chính giữa đáy (`Bottom-Center: 0.5, 0.0`)** để nhân vật/đồ vật đứng khít trên mặt sàn `Y = 0` của tầng.
- **Tiêu chí nâng cấp từ Placeholder 2D sang Object 3D thực thụ:**
  1. Thành phần có tương tác trực tiếp tần suất cao (Cuốn sổ quản lý ảo F04, Cửa phòng gõ cửa, Điều hòa/Bình nóng lạnh báo hỏng).
  2. FPS trung bình trên thiết bị mobile tầm trung vẫn duy trì ổn định **`>= 45 FPS`** và tổng dung lượng cảnh sau khi thay model 3D vẫn **`< 5 MB`**.
  3. Đã có model `.glb` đạt chuẩn kiểm định từ pipeline `sand3d` hoặc thư viện `Kenney CC0`.

---

## 3. Checklist Brief Đầu vào & Lộ trình Chuyển đổi 5 Nhóm Asset 3D (`3D Artist Lead & Agent`)

### 3.1. Checklist Brief Bắt buộc trước khi Sản xuất / Tuyển chọn mỗi Model 3D
Mỗi yêu cầu tạo hoặc nhập model 3D bắt buộc điền đủ 7 mục sau (theo chuẩn `artist-3d-modeler`):
1. **Mã & Tên Asset:** (VD: `PRP_LedgerBook_01`, `FUR_AirConditioner_01`).
2. **Nguồn sử dụng ưu tiên (`$0 Cost`):** Chọn từ thư viện `Kenney Furniture Kit (CC0)` / `Quaternius (CC0)` hoặc sinh qua `sand3d` (Modular Low-poly).
3. **Kích thước bao (`Bounding Box` theo mét):** Khớp tuyệt đối với hệ lưới `1 unit = 1m`.
4. **Điểm gốc (`Origin / Pivot`):** `Bottom-Center` `(0, 0, 0)` tại mặt tiếp xúc sàn/tường.
5. **Ngân sách Đa giác (`Triangle Budget`):**
   - Đồ vật nhỏ / Thiết bị phòng: **`<= 300 – 800 tris`**.
   - Phòng trọ modular / Cuốn sổ 3D: **`<= 1.500 – 2.500 tris`**.
   - Tổng toàn cảnh hiển thị cùng lúc: **`<= 35.000 tris`**, **`<= 50 Draw Calls`** (ưu tiên dùng `THREE.InstancedMesh` cho các phòng/cửa giống nhau).
6. **Vật liệu (`Material`):** Dùng chung **01 Color Palette Atlas (`256x256px` hoặc `512x512px`)** dạng `MeshStandardMaterial / MeshLambertMaterial` để gộp Draw Call.
7. **Định dạng xuất chuẩn:** `.glb` (glTF 2.0 Binary) nén `Meshopt / Draco`.

### 3.2. Thứ tự Ưu tiên Chuyển đổi 5 Nhóm Asset 3D theo Giai đoạn

| Thứ tự ưu tiên | Nhóm Asset 3D | Danh mục chi tiết trong nhóm | Giai đoạn thực hiện | Nguồn Asset (Miễn phí `$0`) |
| :---: | :--- | :--- | :---: | :--- |
| **Ưu tiên 1 (Làm ngay ở P1)** | **Nhóm 1: Khung Tòa nhà, Tầng & Cửa phòng Modular** | Sàn tầng, Tường cắt mặt trước (Cutaway Wall), Cửa phòng trọ (có gắn vị trí treo Chấm than Vàng/Đỏ), Cầu thang bộ | **P1 (MVP)** | Dựng hình khối Modular (`BoxGeometry` / `Kenney Modular`) |
| **Ưu tiên 2 (Trọng tâm P1)** | **Nhóm 2: Bàn Quản lý & Cuốn Sổ Quản lý Ảo F04** | Bàn làm việc chủ trọ, Cuốn sổ quản lý ảo 3D (Bìa sổ mở ra chuyển tiếp mượt sang giao diện Mặt bằng tầng & Single-Page) | **P1 (MVP)** | `DiogoNeves/graphics-pop-up-book` + `Kenney CC0` |
| **Ưu tiên 3 (P1 $\rightarrow$ P2)** | **Nhóm 3: 10 Thiết bị Phòng trọ Cốt lõi (`R-04`)** | Điều hòa, Bình nóng lạnh, Giường, Tủ quần áo, Bàn bếp, Bệt vệ sinh, Tủ lạnh, Máy giặt, Khóa cửa, Đồng hồ điện/nước | **P1 dùng Sprite/Block $\rightarrow$ P2 thay `.glb` CC0** | `Kenney Furniture Kit (CC0)` (Sẵn có 100%, không cần chờ Blender) |
| **Ưu tiên 4 (P2)** | **Nhóm 4: Avatar Chủ trọ, Khách thuê & Sale trọ** | Nhân vật Low-poly đi bộ gõ cửa, nộp phong bì tiền, đứng xem phòng trống | **P1 dùng Billboard Sprite $\rightarrow$ P2 dùng `.glb` Rigged** | `Quaternius Animated Characters (CC0)` |
| **Ưu tiên 5 (P2/P3)** | **Nhóm 5: Đạo cụ Minigame & Trang trí Đổi điểm (`F05`, `F07`)** | Chuột, Gián, Chổi, Dép, Nồi/Chảo, Cây cảnh trang trí phòng, Biển hiệu Sao uy tín tòa nhà | **P2 / P3** | `Kenney CC0` + `sand3d` (khi bật pipeline Blender) |
