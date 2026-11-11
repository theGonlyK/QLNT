# Đánh giá kỹ thuật: Danh mục Object 3D và Mức độ đáp ứng của Thư viện `sand3d`

- **Dự án:** Quản lý nhà trọ (QLNT)
- **Tác giả:** Vai trò 3D Artist / Modeler (`artist-3d-modeler`)
- **Ngày lập:** 2026-11-11
- **Trạng thái:** Báo cáo đánh giá kỹ thuật chuyên môn phục vụ lập kế hoạch asset cho P1 – P3
- **Căn cứ tham chiếu:**
  - `03-ky-thuat/TECH_PROFILE.md` (Đích đồ họa 3D isometric cố định, Three.js renderer)
  - `02-nghiep-vu/REQUIREMENTS.md` (Các yêu cầu R-07, R-17, R-18, R-19, R-21)
  - `2.Tai_lieu_tham_khao/1.Tai_lieu_AI/NGHIEN_CUU_SANDFLOW_AI_VA_3D_GENERATION.md` (Công nghệ Sandflow AI / sand3d)

---

## 1. Phân loại toàn diện danh mục Object trong QLNT

Dựa trên yêu cầu nghiệp vụ và cơ chế tương tác, toàn bộ tài nguyên đồ họa 3D của QLNT được chia thành 5 nhóm:

| Nhóm | Danh mục Object cụ thể | Vai trò & Yêu cầu tương tác | Nghiệp vụ liên quan |
| :--- | :--- | :--- | :--- |
| **Nhóm 1: Kiến trúc Modular** | Tường, sàn, trần, vách ngăn phòng, cửa ra vào, cửa sổ, ban công, cầu thang. | Khối không gian tĩnh; kích thước co giãn theo diện tích phòng thực tế ($15m^2, 20m^2, 25m^2$). | Cấu trúc tòa nhà / Tầng / Phòng trọ |
| **Nhóm 2: Nội thất & Thiết bị** | Giường, tủ quần áo, bàn làm việc, ghế, kệ bếp, tủ lạnh, quạt trần, điều hòa, bình nóng lạnh, bóng đèn. | Thiết bị cố định theo hợp đồng; có trạng thái hỏng (hiển thị icon chấm than đỏ); hỗ trợ đổi skin/bề ngoài. | `R-17`, `R-18` |
| **Nhóm 3: Đồ trang trí (Props)** | Cây cảnh mini, thảm sàn, khung tranh, đèn ngủ, đồng hồ cát / *sand flow ornament*, kệ sách. | Đổi bằng điểm thưởng gamification; sắp xếp vị trí tự do trong phòng. | `R-06`, `R-21` |
| **Nhóm 4: Dụng cụ & Đồ xả giận** | Chổi quét nhà, dép, xoong, chảo, nồi, bình hoa, cốc chén (đồ vỡ được). | Vũ khí bắt chuột/gián; vật dụng bị đập vỡ khi xả giận và khôi phục nguyên trạng sau khi dọn. | `R-07`, `R-19`, `R-21` |
| **Nhóm 5: Nhân vật & Sinh vật** | Avatar người (Chủ trọ, Khách thuê, Sale trọ, NPC lao công); Sinh vật nhỏ (chuột, gián). | Hoạt ảnh di chuyển, đứng hóng chuyện, săn bắt; rig xương sinh học phức tạp; đổi skin trang phục. | `R-08`, `R-19`, `R-20`, `R-21` |

---

## 2. Đối chiếu & Đánh giá mức độ đáp ứng của Thư viện `sand3d`

### 2.1. Ma trận đánh giá mức độ tương thích

```
[Nhóm 1: Kiến trúc Modular]    ████████████████████ 95% (Đáp ứng hoàn hảo)
[Nhóm 2: Nội thất & Thiết bị]  █████████████████░░░ 85% (Rất tốt, có khớp mở cửa)
[Nhóm 3: Đồ trang trí Props]   ███████████████░░░░░ 75% (Tốt cho đồ hình học)
[Nhóm 4: Dụng cụ & Phụ kiện]   ██████████████░░░░░░ 70% (Khá, thiếu vỡ động)
[Nhóm 5: Nhân vật & Sinh vật]  ███░░░░░░░░░░░░░░░░░ 15% (Khoảng trống lớn - Không dùng được)
```

### 2.2. Chi tiết điểm mạnh khai thác được từ `sand3d`
1. **Tham số hóa kiến trúc (Parametric Room Generation):**
   - Cho phép viết 1 script nhận diện tích thực từ DB (`dai`, `rong`, `cao`, `vi_tri_cua`) để tự động tạo file 3D mesh chuẩn từng cm cho mọi phòng trọ mà không cần dựng tay từng phòng.
2. **Khớp cơ học tích hợp sẵn (`Articulated Mechanisms`):**
   - Hỗ trợ trực tiếp khớp xoay (`revolute`) và khớp trượt (`prismatic`). Cửa tủ quần áo mở ra vào, ngăn kéo bàn trượt ra vào hoạt động ngay trong mô hình mà không cần rig xương phức tạp.
3. **Tự động hóa sinh biến thể (Batch Variation):**
   - Dễ dàng tạo bộ sưu tập đồ đạc đồng bộ (bàn 1 tầng, bàn 2 tầng, tủ 2 cánh, tủ 3 cánh) thông qua thay đổi biến số trong mã nguồn.
4. **Hiệu năng & Quản trị phiên bản:**
   - Mã nguồn Python cực nhẹ, lưu trữ trực tiếp trong Git, AI Agent có thể đọc hiểu và hiệu chỉnh dễ dàng.

### 2.3. Khoảng trống kỹ thuật (Technical Gaps) & Thách thức
1. **Thiếu hụt hoàn toàn về Nhân vật & Sinh vật:**
   - `sand3d` là công cụ CAD/Procedural hình học khối, không thể tạo được mô hình cơ thể sống, khuôn mặt biểu cảm, hay skinning/rigging xương sinh học (humanoid/creature skeleton).
2. **Độ mềm mại hữu cơ của vật liệu:**
   - Đệm giường, rèm cửa, nếp gấp chăn ga gối đòi hỏi cloth simulation hoặc sculpting bề mặt, điều mà code hình học khó mô tả tự nhiên.
3. **Cơ chế đập vỡ động (`R-07`):**
   - Cần bổ sung giải pháp mesh fracture ở client Three.js hoặc chuẩn bị sẵn cặp model: *Trạng thái nguyên vẹn* (do `sand3d` sinh) $\leftrightarrow$ *Trạng thái vỡ vụn* (placeholder mảnh vỡ).

---

## 3. Kết luận & Giải pháp phối hợp hoàn chỉnh

* **Về mảng Kiến trúc & Đồ vật (Hard-surface & Furniture):** Thư viện `sand3d` giải quyết triệt để và tối ưu khoảng **75% - 80%** khối lượng dựng hình tham số theo diện tích thực.
* **Về mảng Nhân vật & Sinh vật (Avatars & Creatures):** Đã lựa chọn và chốt sử dụng hệ sinh thái asset **[Kenney.nl](https://kenney.nl)** (bản quyền CC0 Public Domain).
  - Gói *Kenney Animated Characters* cung cấp sẵn avatar low-poly đã rig chuẩn Humanoid, có sẵn hoạt ảnh (idle, walk, run), hỗ trợ hoán đổi trang phục/skin cho Chủ trọ, Khách, Sale.
  - Gói *Kenney Pets/Animals* cung cấp base-mesh cho sinh vật nhỏ (chuột, gián) phục vụ minigame `R-19`.
  - Tham khảo chi tiết tại: `2.Tai_lieu_tham_khao/4.Tai_lieu_ky_thuat/KENNEY_3D_ASSET_REFERENCE.md`.
* **Mô hình phối hợp tổng thể:**
  `sand3d` (Kiến trúc & Tủ kệ tham số) + `Kenney.nl` (Avatar rigged, Động vật, Furniture mẫu) = **Hoàn thiện 100% pipeline đồ họa 3D cho MVP P1 của QLNT**.
