# Khung Đánh giá Cuối Sprint 1 & Checklist Nghiệm thu Cổng G1 — QLNT

- **Dự án:** Quản lý nhà trọ (QLNT)
- **Thực hiện:** Knowledge Governance Lead & Agent phối hợp PM Lead
- **Ngày ban hành:** 2026-11-12
- **Trạng thái:** `Đang áp dụng để nghiệm thu Sprint 1 & Cổng G1`
- **Căn cứ tham chiếu:**
  - `3.DOC_AI/quan-tri/MO_HINH_VAN_HANH.md` (Quy định Cổng G1 — Yêu cầu & Thiết kế sẵn sàng)
  - `01-quan-ly/DECISIONS.md` (`QLNT-D001` $\rightarrow$ `QLNT-D014`)
  - `01-quan-ly/HO_SO_DIEU_PHOI_SPRINT_1_VA_QUY_MO_HA_TANG.md`

---

## 1. Khung Tiêu chí Đánh giá Hoàn thành Sprint 1 (Sprint 1 Evaluation Framework)

Để đảm bảo tính khách quan theo đúng `RULES_CORE.md`, mọi đầu ra của các vai trò trong Sprint 1 được đối chiếu trực tiếp qua bảng bằng chứng sau:

| STT | Mảng / Vai trò | Đầu ra mục tiêu của Sprint 1 | Tài liệu Bằng chứng Thực tế (Verified Deliverable) | Trạng thái Đối chiếu |
| :---: | :--- | :--- | :--- | :---: |
| **1** | **PM (`PM Lead` & `PM Agent`)** | Bản đồ phụ thuộc, tiêu chí chốt task, điều phối Issue & quyết định `QLNT-D001..D014` | • [`01-quan-ly/HO_SO_DIEU_PHOI_SPRINT_1_VA_QUY_MO_HA_TANG.md`](../01-quan-ly/HO_SO_DIEU_PHOI_SPRINT_1_VA_QUY_MO_HA_TANG.md)<br>• [`01-quan-ly/DECISIONS.md`](../01-quan-ly/DECISIONS.md) | **Đạt 100%** |
| **2** | **Marketing (`Marketing Lead` & `Agent`)** | Khảo sát thị trường Hà Nội, danh mục phần mềm tham khảo & Bộ biểu mẫu hợp đồng/bàn giao/hóa đơn thực tế VN (`#1`) | • [`02-nghiep-vu/NGHIEN_CUU_THI_TRUONG.md`](../02-nghiep-vu/NGHIEN_CUU_THI_TRUONG.md)<br>• [`DANH_MUC_PHAN_MEM_QUAN_LY_NHA_TRO.md`](../../../2.Tai_lieu_tham_khao/3.Tai_lieu_nghiep_vu/DANH_MUC_PHAN_MEM_QUAN_LY_NHA_TRO.md)<br>• [`BO_BIEU_MAU_HOP_DONG_BAN_GIAO_HOA_DON_VN.md`](../../../2.Tai_lieu_tham_khao/3.Tai_lieu_nghiep_vu/BO_BIEU_MAU_HOP_DONG_BAN_GIAO_HOA_DON_VN.md) | **Đạt 100%** |
| **3** | **BA (`BA Lead` & `BA Agent`)** | Yêu cầu P1, Ma trận truy vết 21 AC, Luồng nghiệp vụ & Đặc tả Single-Page Sổ quản lý ảo F04 (`#2`, `#4`) | • [`02-nghiep-vu/REQUIREMENTS.md`](../02-nghiep-vu/REQUIREMENTS.md) & [`SRS.md`](../02-nghiep-vu/SRS.md)<br>• [`02-nghiep-vu/MA_TRAN_TRUY_VET_P1.md`](../02-nghiep-vu/MA_TRAN_TRUY_VET_P1.md)<br>• [`02-nghiep-vu/DAC_TA_SO_QUAN_LY_AO_SINGLE_PAGE_VA_RENDERER.md`](../02-nghiep-vu/DAC_TA_SO_QUAN_LY_AO_SINGLE_PAGE_VA_RENDERER.md) | **Đạt 100%** |
| **4** | **UX (`UX Lead` & `UX Agent`)** | Thiết kế luồng quản lý phòng/khách, thu tiền/báo hỏng & Wireframe Single-Page trên Mobile | • [`02-nghiep-vu/THIET_KE_UX_FLOW_VA_MOBILE_P1.md`](../02-nghiep-vu/THIET_KE_UX_FLOW_VA_MOBILE_P1.md) | **Đạt 100%** |
| **5** | **Tech (`Tech Lead` & `Contributor`)** | Kiến trúc tách tầng `IGameRenderer`, Camera Isometric, hệ tọa độ 3D & Hồ sơ hạ tầng vận hành ưu tiên `$0` tại `04-van-hanh/` (`#9`) | • [`03-ky-thuat/TECH_PROFILE.md`](../03-ky-thuat/TECH_PROFILE.md)<br>• [`04-van-hanh/HA_TANG_VA_VAN_HANH_HE_THONG.md`](HA_TANG_VA_VAN_HANH_HE_THONG.md) | **Đạt 100%** |
| **6** | **2D Visual & 3D Artist** | Quy chuẩn Sprite/Mặt bằng 2D, tiêu chí nâng cấp 3D, Checklist Brief 3D & Lộ trình 5 nhóm Asset | • [`03-ky-thuat/QUY_CHUAN_2D_VA_BRIEF_ASSET_3D.md`](../03-ky-thuat/QUY_CHUAN_2D_VA_BRIEF_ASSET_3D.md)<br>• [`03-ky-thuat/DANH_GIA_THU_VIEN_3D_OBJECTS.md`](../03-ky-thuat/DANH_GIA_THU_VIEN_3D_OBJECTS.md) | **Đạt 100%** |
| **7** | **QA (`QA Lead` & `QA Agent`)** | Ma trận Test Case P1 (`TC-P1-01..12`), rủi ro dữ liệu/thanh toán & Chuẩn chất lượng/phát hành | • [`04-van-hanh/KE_HOACH_VA_MA_TRAN_KIEM_THU_P1.md`](KE_HOACH_VA_MA_TRAN_KIEM_THU_P1.md)<br>• [`04-van-hanh/QUALITY_AND_RELEASE.md`](QUALITY_AND_RELEASE.md) | **Đạt 100%** |
| **8** | **Knowledge Governance** | Đồng bộ Sổ đăng ký tri thức (`#7`), Khung đánh giá Sprint 1 & Đề xuất cải tiến (`IMPROVEMENTS.md`) | • [`3.DOC_AI/quan-tri/SO_DANG_KY_TRI_THUC.md`](../../../3.DOC_AI/quan-tri/SO_DANG_KY_TRI_THUC.md)<br>• [`04-van-hanh/KHUNG_DANH_GIA_VA_NGHIEM_THU_SPRINT_1.md`](KHUNG_DANH_GIA_VA_NGHIEM_THU_SPRINT_1.md) | **Đạt 100%** |

---

## 2. Danh mục 4 Issue Công cụ & Cập nhật Hiện trạng Máy trạm Kỹ thuật chính `MinhNTV`

Theo chỉ đạo của Chủ dự án, các Issue liên quan đến cài đặt công cụ máy trạm phục vụ pha thực thi Code/3D đã được rà soát và nâng cấp trực tiếp trên máy trạm Kỹ thuật chính (`MinhNTV`) ngày 2026-11-12:
- **Cập nhật hiện trạng môi trường thực thi máy trạm `MinhNTV`:**
  - `Node.js v24` (`v24.14.0`) và `pnpm v12` (`12.18.0`) đã sẵn sàng, tháo gỡ điểm nghẽn môi trường cho `ISS-03` (`#3`).
  - `Python 3.11` (`3.11.18`) đã cài đặt sẵn sàng, đáp ứng yêu cầu `Python >= 3.11` của `sand3d` và hỗ trợ xử lý file cho `ISS-05` (`#5`), `ISS-06` (`#6`).
  - `Docker v28` (`Docker version 28.3.2`) và `Docker Compose v2.39` (`v2.39.1-desktop.1`) đã hoạt động tốt, tháo gỡ điểm nghẽn môi trường container cục bộ cho `ISS-10` (`#10`).
- **Trạng thái theo dõi:**
  - `ISS-03` (`#3`): Đã có đủ Node.js v24 & pnpm v12; sẵn sàng tạo branch PoC (`vite`, `three`) khi chuyển sang pha viết code.
  - `ISS-05` (`#5`): Python 3.11 sẵn sàng; cài đặt `openpyxl`/`pandas` khi cần trích xuất trực tiếp file Excel.
  - `ISS-06` (`#6`): Python 3.11 sẵn sàng; cài đặt `Blender 4.x (bpy)` và `@gltf-transform/cli` khi bắt đầu chạy script sinh model `.glb` thực tế trong P2.
  - `ISS-10` (`#10`): Docker v28 & Docker Compose v2.39 sẵn sàng; tiếp tục bổ sung cấu hình `docker-compose.yml` cho Local Dev và CI/CD STG Checklist theo kế hoạch.
