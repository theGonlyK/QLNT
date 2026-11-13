# Khung Đánh giá Cuối Sprint 1 & Biên bản Xác nhận Chốt Cổng G1 — QLNT

- **Dự án:** Quản lý nhà trọ (QLNT)
- **Thực hiện:** Knowledge Governance Lead & Agent phối hợp PM Lead và 8 Team Lead
- **Ngày ban hành:** 2026-11-12 (Cập nhật Biên bản Chốt Cổng G1: `2026-11-13`)
- **Trạng thái:** **`ĐÃ CHỐT CỔNG G1 (2026-11-13 — QLNT-D015)`** — 9/9 Lead xác nhận đủ điều kiện; Chủ dự án đã phê duyệt chuyển pha Xây dựng (`Sprint 2`).
- **Căn cứ tham chiếu:**
  - `3.DOC_AI/quan-tri/MO_HINH_VAN_HANH.md` (Quy định Cổng G1 — Yêu cầu & Thiết kế sẵn sàng)
  - `3.DOC_AI/quan-tri/RULES_CORE.md` (Quy tắc 1–10)
  - `01-quan-ly/DECISIONS.md` (`QLNT-D001` $\rightarrow$ `QLNT-D015`)
  - `01-quan-ly/HO_SO_DIEU_PHOI_SPRINT_1_VA_QUY_MO_HA_TANG.md`

---

## 1. Khung Tiêu chí Đánh giá Hoàn thành Sprint 1 (Sprint 1 Evaluation Framework)

Để đảm bảo tính khách quan theo đúng `RULES_CORE.md`, mọi đầu ra của các vai trò trong Sprint 1 được đối chiếu trực tiếp qua bảng bằng chứng sau:

| STT | Mảng / Vai trò | Đầu ra mục tiêu của Sprint 1 | Tài liệu Bằng chứng Thực tế (Verified Deliverable) | Mã Task GitHub (`theGonlyK/QLNT`) | Trạng thái Đối chiếu |
| :---: | :--- | :--- | :--- | :--- | :---: |
| **1** | **PM (`PM Lead` & `PM Agent`)** | Bản đồ phụ thuộc, tiêu chí chốt task, điều phối Issue & quyết định `QLNT-D001..D014` | • [`01-quan-ly/HO_SO_DIEU_PHOI_SPRINT_1_VA_QUY_MO_HA_TANG.md`](file:///Users/uni/Documents/AI/AI-Workspace/AI-Workspace/TEAM_ORCA/4.Du_an/QLNT/01-quan-ly/HO_SO_DIEU_PHOI_SPRINT_1_VA_QUY_MO_HA_TANG.md)<br>• [`01-quan-ly/DECISIONS.md`](file:///Users/uni/Documents/AI/AI-Workspace/AI-Workspace/TEAM_ORCA/4.Du_an/QLNT/01-quan-ly/DECISIONS.md) | `#8`, `#11`, `#20`, `#21`, `#48` (`CLOSED / Done`) | **Đạt 100%** |
| **2** | **Marketing (`Marketing Lead` & `Agent`)** | Khảo sát thị trường Hà Nội, danh mục phần mềm tham khảo & Bộ biểu mẫu hợp đồng/bàn giao/hóa đơn thực tế VN (`#1`) | • [`02-nghiep-vu/NGHIEN_CUU_THI_TRUONG.md`](file:///Users/uni/Documents/AI/AI-Workspace/AI-Workspace/TEAM_ORCA/4.Du_an/QLNT/02-nghiep-vu/NGHIEN_CUU_THI_TRUONG.md)<br>• [`DANH_MUC_PHAN_MEM_QUAN_LY_NHA_TRO.md`](file:///Users/uni/Documents/AI/AI-Workspace/AI-Workspace/TEAM_ORCA/2.Tai_lieu_tham_khao/3.Tai_lieu_nghiep_vu/DANH_MUC_PHAN_MEM_QUAN_LY_NHA_TRO.md)<br>• [`BO_BIEU_MAU_HOP_DONG_BAN_GIAO_HOA_DON_VN.md`](file:///Users/uni/Documents/AI/AI-Workspace/AI-Workspace/TEAM_ORCA/2.Tai_lieu_tham_khao/3.Tai_lieu_nghiep_vu/BO_BIEU_MAU_HOP_DONG_BAN_GIAO_HOA_DON_VN.md) | `#1`, `#15`, `#31`, `#32`, `#33`, `#44` (`CLOSED / Done`) | **Đạt 100%** |
| **3** | **BA (`BA Lead` & `BA Agent`)** | Yêu cầu P1, Ma trận truy vết 21 AC, Ma trận so sánh SP, Luồng nghiệp vụ & Đặc tả Single-Page Sổ quản lý ảo F04 (`#2`, `#4`) | • [`02-nghiep-vu/REQUIREMENTS.md`](file:///Users/uni/Documents/AI/AI-Workspace/AI-Workspace/TEAM_ORCA/4.Du_an/QLNT/02-nghiep-vu/REQUIREMENTS.md) & [`SRS.md`](file:///Users/uni/Documents/AI/AI-Workspace/AI-Workspace/TEAM_ORCA/4.Du_an/QLNT/02-nghiep-vu/SRS.md)<br>• [`02-nghiep-vu/MA_TRAN_TRUY_VET_P1.md`](file:///Users/uni/Documents/AI/AI-Workspace/AI-Workspace/TEAM_ORCA/4.Du_an/QLNT/02-nghiep-vu/MA_TRAN_TRUY_VET_P1.md)<br>• [`02-nghiep-vu/DAC_TA_SO_QUAN_LY_AO_SINGLE_PAGE_VA_RENDERER.md`](file:///Users/uni/Documents/AI/AI-Workspace/AI-Workspace/TEAM_ORCA/4.Du_an/QLNT/02-nghiep-vu/DAC_TA_SO_QUAN_LY_AO_SINGLE_PAGE_VA_RENDERER.md)<br>• [`02-nghiep-vu/MA_TRAN_SO_SANH_SAN_PHAM_QLNT.md`](file:///Users/uni/Documents/AI/AI-Workspace/AI-Workspace/TEAM_ORCA/4.Du_an/QLNT/02-nghiep-vu/MA_TRAN_SO_SANH_SAN_PHAM_QLNT.md) | `#2`, `#4`, `#12`, `#22`, `#23`, `#24`, `#43`, `#45` (`CLOSED / Done`) | **Đạt 100%** |
| **4** | **UX (`UX Lead` & `UX Agent`)** | Thiết kế luồng quản lý phòng/khách, thu tiền/báo hỏng & Wireframe Single-Page trên Mobile | • [`02-nghiep-vu/THIET_KE_UX_FLOW_VA_MOBILE_P1.md`](file:///Users/uni/Documents/AI/AI-Workspace/AI-Workspace/TEAM_ORCA/4.Du_an/QLNT/02-nghiep-vu/THIET_KE_UX_FLOW_VA_MOBILE_P1.md) | `#14`, `#28`, `#29`, `#30` (`CLOSED / Done`) | **Đạt 100%** |
| **5** | **Tech (`Tech Lead` & `Contributor`)** | Kiến trúc tách tầng `IGameRenderer`, Camera Isometric, hệ tọa độ 3D & Hồ sơ hạ tầng vận hành ưu tiên `$0 First` tại `04-van-hanh/` (`#9`) | • [`03-ky-thuat/TECH_PROFILE.md`](file:///Users/uni/Documents/AI/AI-Workspace/AI-Workspace/TEAM_ORCA/4.Du_an/QLNT/03-ky-thuat/TECH_PROFILE.md)<br>• [`04-van-hanh/HA_TANG_VA_VAN_HANH_HE_THONG.md`](file:///Users/uni/Documents/AI/AI-Workspace/AI-Workspace/TEAM_ORCA/4.Du_an/QLNT/04-van-hanh/HA_TANG_VA_VAN_HANH_HE_THONG.md) | `#9`, `#13`, `#25`, `#26`, `#27`, `#42`, `#47` (`CLOSED / Done`) | **Đạt 100%** |
| **6** | **2D Visual & 3D Artist** | Quy chuẩn Sprite/Mặt bằng 2D, tiêu chí nâng cấp 3D, Checklist Brief 3D & Lộ trình 5 nhóm Asset | • [`03-ky-thuat/QUY_CHUAN_2D_VA_BRIEF_ASSET_3D.md`](file:///Users/uni/Documents/AI/AI-Workspace/AI-Workspace/TEAM_ORCA/4.Du_an/QLNT/03-ky-thuat/QUY_CHUAN_2D_VA_BRIEF_ASSET_3D.md)<br>• [`03-ky-thuat/DANH_GIA_THU_VIEN_3D_OBJECTS.md`](file:///Users/uni/Documents/AI/AI-Workspace/AI-Workspace/TEAM_ORCA/4.Du_an/QLNT/03-ky-thuat/DANH_GIA_THU_VIEN_3D_OBJECTS.md) | `#17`, `#18`, `#36`, `#37`, `#38`, `#39` (`CLOSED / Done`) | **Đạt 100%** |
| **7** | **QA (`QA Lead` & `QA Agent`)** | Ma trận Test Case P1 (`TC-P1-01..12`), rủi ro dữ liệu/thanh toán & Chuẩn chất lượng/phát hành | • [`04-van-hanh/KE_HOACH_VA_MA_TRAN_KIEM_THU_P1.md`](file:///Users/uni/Documents/AI/AI-Workspace/AI-Workspace/TEAM_ORCA/4.Du_an/QLNT/04-van-hanh/KE_HOACH_VA_MA_TRAN_KIEM_THU_P1.md)<br>• [`04-van-hanh/QUALITY_AND_RELEASE.md`](file:///Users/uni/Documents/AI/AI-Workspace/AI-Workspace/TEAM_ORCA/4.Du_an/QLNT/04-van-hanh/QUALITY_AND_RELEASE.md) | `#16`, `#34`, `#35` (`CLOSED / Done`) | **Đạt 100%** |
| **8** | **Knowledge Governance** | Đồng bộ Sổ đăng ký tri thức (`#7`), rà soát định kỳ đợt 1 (`2026-11-13`), Khung đánh giá Sprint 1 & Đề xuất cải tiến (`IMPROVEMENTS.md`) | • [`3.DOC_AI/quan-tri/SO_DANG_KY_TRI_THUC.md`](file:///Users/uni/Documents/AI/AI-Workspace/AI-Workspace/TEAM_ORCA/3.DOC_AI/quan-tri/SO_DANG_KY_TRI_THUC.md)<br>• [`04-van-hanh/KHUNG_DANH_GIA_VA_NGHIEM_THU_SPRINT_1.md`](file:///Users/uni/Documents/AI/AI-Workspace/AI-Workspace/TEAM_ORCA/4.Du_an/QLNT/04-van-hanh/KHUNG_DANH_GIA_VA_NGHIEM_THU_SPRINT_1.md)<br>• [`04-van-hanh/IMPROVEMENTS.md`](file:///Users/uni/Documents/AI/AI-Workspace/AI-Workspace/TEAM_ORCA/4.Du_an/QLNT/04-van-hanh/IMPROVEMENTS.md) | `#7`, `#19`, `#40`, `#41`, `#46` (`CLOSED / Done`) | **Đạt 100%** |

---

## 2. Biên bản Xác nhận (Sign-off) của PM Lead & 8 Team Lead làm Căn cứ Chốt Cổng G1

Theo quy định tại [`3.DOC_AI/quan-tri/MO_HINH_VAN_HANH.md`](file:///Users/uni/Documents/AI/AI-Workspace/AI-Workspace/TEAM_ORCA/3.DOC_AI/quan-tri/MO_HINH_VAN_HANH.md), điều kiện bắt buộc để vượt **Cổng G1 – Yêu cầu sẵn sàng (`Thiết kế → Xây dựng`)** gồm:
1. **Mảng A (Thiết kế nghiệp vụ):** Yêu cầu nghiệp vụ đã có đầy đủ tiêu chí nghiệm thu (`02-nghiep-vu/`).
2. **Mảng B & C (Kỹ thuật & Vận hành):** Xác nhận tính khả thi kỹ thuật, kiến trúc, quy chuẩn asset, kế hoạch kiểm thử và phương án vận hành (`03-ky-thuat/`, `04-van-hanh/`).

Dưới đây là kết quả xác nhận chính thức của **PM Lead** và **08 Team Lead** (tổng cộng **9/9 Lead**):

| STT | Vị trí Lead | Nội dung Xác nhận Đủ Điều kiện (Sign-off Statement) | Điểm nghẽn thiết kế còn tồn đọng? | Kết luận Xác nhận G1 |
| :---: | :--- | :--- | :---: | :---: |
| **1** | **BA Lead**<br>*(Mảng A)* | Đã hoàn tất 100% bộ đặc tả nghiệp vụ P1 (`BRD.md`, `SRS.md`, `USE_CASES.md`, `MA_TRAN_TRUY_VET_P1.md` với 18 chức năng & 21 tiêu chí nghiệm thu `AC-01..AC-21`). Đặc tả Sổ quản lý ảo F04 chế độ **Single-Page** (`DAC_TA_SO_QUAN_LY_AO_SINGLE_PAGE_VA_RENDERER.md`) đã tích hợp đầy đủ Data Dictionary từ bộ biểu mẫu thực tế VN (`REF-MKT-002`) và hợp đồng `IGameRenderer`. Đủ 100% đầu vào để Dev viết code. | **Không (`0`)** | **XÁC NHẬN ĐẠT G1** |
| **2** | **Marketing Lead**<br>*(Mảng A)* | Đã hoàn tất báo cáo nghiên cứu thị trường Hà Nội (`NGHIEN_CUU_THI_TRUONG.md`), bộ biểu mẫu hợp đồng thuê trọ, biên bản bàn giao thiết bị & phiếu thu điện/nước thực tế tại VN (`BO_BIEU_MAU_HOP_DONG_BAN_GIAO_HOA_DON_VN.md` - `#1`) và danh mục đối chiếu phần mềm nhà trọ VN (`DANH_MUC_PHAN_MEM_QUAN_LY_NHA_TRO.md`). Đủ căn cứ thực tiễn cho P1. | **Không (`0`)** | **XÁC NHẬN ĐẠT G1** |
| **3** | **UX Lead**<br>*(Mảng A)* | Đã hoàn tất thiết kế luồng tương tác và Wireframe chi tiết cho Mobile (`THIET_KE_UX_FLOW_VA_MOBILE_P1.md`), giải quyết triệt để bài toán hiển thị **Single-Page** trên màn hình dọc (`390x844`), vùng chạm $\ge 44\times44\text{px}$, cơ chế chuyển trang `Swipe/Tab` và tách bạch `Preview State` (3D) với `Commit State` (DB). | **Không (`0`)** | **XÁC NHẬN ĐẠT G1** |
| **4** | **Tech Lead**<br>*(Mảng B & C)* | Đã xác nhận **100% khả thi kỹ thuật** trong `TECH_PROFILE.md` và `HA_TANG_VA_VAN_HANH_HE_THONG.md`: kiến trúc tách tầng `Headless Core` $\leftrightarrow$ `IGameRenderer` (6 hàm điều khiển Sổ F04 + Event Bus), phương án render Hybrid (3D Shell + 2D SVG/HTML Single-Page Overlay đảm bảo 60fps trên mobile), và kiến trúc hạ tầng ưu tiên **dễ & không mất phí (`$0 First`: Local-First `IndexedDB` + `Cloudflare Pages` + `Supabase Free Tier` + `Cloudflare R2 Free 10GB`)** theo `QLNT-D014`. | **Không (`0`)**<br>*(Issue `#3, #10` là cài đặt công cụ đầu Sprint 2)* | **XÁC NHẬN ĐẠT G1** |
| **5** | **2D Visual Lead**<br>*(Mảng B)* | Đã chốt đầy đủ quy chuẩn kỹ thuật trong `QUY_CHUAN_2D_VA_BRIEF_ASSET_3D.md`: sử dụng `SVG / High-DPI Canvas 2x`, hệ lưới `64 PPU`, bảng mã màu chuẩn cho 5 trạng thái phòng và bộ icon chấm than vàng/đỏ. Sẵn sàng sản xuất gói SVG/Sprite placeholder trong Sprint 2. | **Không (`0`)** | **XÁC NHẬN ĐẠT G1** |
| **6** | **3D Artist Lead**<br>*(Mảng B)* | Đã chốt Checklist Brief đầu vào, giới hạn kỹ thuật (`< 1.500–3.000 tris`, `< 30 draw calls`, `glTF 2.0 / .glb`) và thứ tự ưu tiên chuyển đổi 5 nhóm Object (`sand3d` code-first cho kiến trúc/sổ 3D/nội thất + `Kenney CC0` cho nhân vật/sinh vật). Sẵn sàng dựng asset mẫu trong Sprint 2. | **Không (`0`)**<br>*(Issue `#6` cài đặt Blender chạy ở Sprint 2)* | **XÁC NHẬN ĐẠT G1** |
| **7** | **QA Lead**<br>*(Mảng B & C)* | Đã lập đầy đủ Kế hoạch và Ma trận kiểm thử P1 (`KE_HOACH_VA_MA_TRAN_KIEM_THU_P1.md` với 12 kịch bản `TC-P1-01..TC-P1-12` bao phủ 100% `AC-01..AC-21`) và chuẩn hóa quy trình kiểm soát chất lượng/phát hành tại `04-van-hanh/QUALITY_AND_RELEASE.md` (gồm cả quy trình đánh giá lại 2 chiều khi thay đổi chi phí). | **Không (`0`)**<br>*(Issue `#5` cài openpyxl không chặn test Markdown)* | **XÁC NHẬN ĐẠT G1** |
| **8** | **Knowledge Governance Lead**<br>*(Mảng C)* | Đã hoàn thành kiểm tra chất lượng tài liệu Sprint 1, cập nhật `IMPROVEMENTS.md` và hoàn tất đợt rà soát định kỳ kho tri thức lần 1 (`2026-11-13`) trên `SO_DANG_KY_TRI_THUC.md` (7/7 mục đạt chuẩn). Toàn bộ 48/48 Issues của QLNT đã nằm đúng trong repo `theGonlyK/QLNT`. | **Không (`0`)** | **XÁC NHẬN ĐẠT G1** |
| **9** | **PM Lead**<br>*(Điều phối chung)* | Đã đối chiếu toàn diện mục tiêu Sprint 1 với kết quả thực tế: **44/44 Task thiết kế & quản trị thuộc Sprint 1 đã hoàn thành 100% (`CLOSED / Done`)**, 04 Issue công cụ máy trạm (`#3, #5, #6, #10`) được quản lý đúng trạng thái chờ đầu Sprint 2. Đã cập nhật quy tắc điều phối độ ưu tiên động & agent trống (`RULES_CORE.md` Mục 10). | **Không (`0`)** | **ĐỀ XUẤT CHỦ DỰ ÁN CHỐT CỔNG G1** |

---

## 3. Danh mục 4 Issue Công cụ Tạm hoãn sang Chặng Khởi động Sprint 2 (`On-Hold` -> `Sprint 2 Setup`)

Theo chỉ đạo của Chủ dự án, 4 Issue liên quan đến cài đặt công cụ máy trạm chưa xử lý trong pha thiết kế tài liệu Sprint 1 và sẽ được mở khóa ngay ở đầu Sprint 2 khi bắt đầu viết code / dựng asset:
- `ISS-03` (`#3`): Khởi tạo môi trường PoC (`pnpm`, `Vite`, `Three.js`) đo kiểm thực tế trên mobile.
- `ISS-05` (`#5`): Cài đặt thư viện Python (`openpyxl`, `pandas`) đọc trực tiếp file Excel `.xlsx`.
- `ISS-06` (`#6`): Cài đặt `Blender 4.x`, `Python >= 3.11 (bpy)` và `gltf-transform` cho pipeline `sand3d`.
- `ISS-10` (`#10`): Cài đặt `Docker / OrbStack` và Cloud CLI trên máy trạm (tùy chọn khi cần chạy container local; ưu tiên phương án `$0 First` không bắt buộc phụ thuộc Docker ở đầu Sprint 2).

---

## 4. Biên bản Chốt Cổng G1 Chính thức (`Gate G1 Decision Record — QLNT-D015`)

- **Thời điểm chốt:** `2026-11-13 16:38 (+07:00)`
- **Người phê duyệt:** **Chủ dự án** (Thẩm quyền cao nhất) — Chỉ đạo: *"Đồng ý Chốt cổng G1, PM hãy lưu trữ và quản lý thông tin này"*.
- **Quyết định lưu sổ:** `QLNT-D015` tại [`01-quan-ly/DECISIONS.md`](file:///Users/uni/Documents/AI/AI-Workspace/AI-Workspace/TEAM_ORCA/4.Du_an/QLNT/01-quan-ly/DECISIONS.md).
- **Kết luận Quản trị:**
  1. **Cổng G1 (`Yêu cầu & Thiết kế sẵn sàng`) chính thức `ĐẠT (PASSED)`** — đóng băng bộ hồ sơ thiết kế P1 (`02-nghiep-vu/`, `03-ky-thuat/`, `04-van-hanh/`) làm chuẩn tham chiếu xây dựng mã nguồn và asset.
  2. **Toàn bộ 45/45 Task thiết kế & quản trị của Sprint 1** trong `theGonlyK/QLNT` đã hoàn tất, lưu vết và đóng (`CLOSED / Done`).
  3. **Trạng thái bước tiếp theo:** Chuyển vòng đời sang **Pha Xây dựng (`Sprint 2`)**; PM giữ danh mục 15 Task Sprint 2 ở trạng thái chờ phê duyệt kế hoạch (`01-quan-ly/KE_HOACH_SPRINT_2_PROTOTYPE_P1.md`) trước khi kích hoạt thực thi.

