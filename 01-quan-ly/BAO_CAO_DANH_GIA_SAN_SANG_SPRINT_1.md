# Báo cáo Đánh giá Độc lập của các Lead về Mức độ Sẵn sàng, Tài liệu, Môi trường & Công cụ — Sprint 1 (QLNT)

- **Dự án:** Quản lý nhà trọ (QLNT)
- **Ngày đánh giá:** 2026-11-12
- **Trạng thái:** Đã hoàn thành rà soát độc lập từ 9 Lead chuyên môn; tổng hợp thành danh sách Issue quản trị trên Orca (`theGonlyK/QLNT` & GitHub Project #2).
- **Phương pháp:** Mỗi vị trí Lead tự độc lập kiểm tra: (1) Tài liệu & Đầu vào nghiệp vụ; (2) Công cụ, thư viện & môi trường thực thi; (3) Rủi ro & điểm nghẽn; (4) Phương án đề xuất và vị trí xử lý.

---

## 1. Báo cáo độc lập — [BA Lead] (Phân tích nghiệp vụ)
- **Phạm vi phụ trách:** `DI_...DYE` (Task cha) và 3 subtask (`DI_...ERU`, `DI_...ERY`, `DI_...ERc`).
- **Kiểm tra tài liệu & điều kiện thực hiện:**
  - **Đạt (100%):** Đã hoàn thành [BRD.md](file:///Users/uni/Documents/AI/AI-Workspace/AI-Workspace/TEAM_ORCA/4.Du_an/QLNT/02-nghiep-vu/BRD.md), [SRS.md](file:///Users/uni/Documents/AI/AI-Workspace/AI-Workspace/TEAM_ORCA/4.Du_an/QLNT/02-nghiep-vu/SRS.md), [USE_CASES.md](file:///Users/uni/Documents/AI/AI-Workspace/AI-Workspace/TEAM_ORCA/4.Du_an/QLNT/02-nghiep-vu/USE_CASES.md), [GLOSSARY.md](file:///Users/uni/Documents/AI/AI-Workspace/AI-Workspace/TEAM_ORCA/4.Du_an/QLNT/02-nghiep-vu/GLOSSARY.md), và [MA_TRAN_TRUY_VET_P1.md](file:///Users/uni/Documents/AI/AI-Workspace/AI-Workspace/TEAM_ORCA/4.Du_an/QLNT/02-nghiep-vu/MA_TRAN_TRUY_VET_P1.md) (18 chức năng, 14 yêu cầu, 21 tiêu chí nghiệm thu AC-01 đến AC-21).
  - **Còn thiếu / Chưa đủ:** Chưa có bộ biểu mẫu hợp đồng thuê trọ, biên bản bàn giao thiết bị, và mẫu hóa đơn điện/nước chuẩn hóa theo thực tế tại Việt Nam để chốt chính xác kiểu dữ liệu, ràng buộc (validation rules) và công thức tính điện nước bậc thang/đồng giá khi chủ trọ thao tác `in-place edit` trên Trang 1 & Trang 2 của Sổ quản lý ảo F04 (`QLNT-D010`, `QLNT-D011`).
- **Kiểm tra công cụ, môi trường, thư viện:**
  - Skill chuẩn `3.DOC_AI/skills/business-analysis/SKILL.md` đã sẵn sàng.
  - Thiếu thư viện Python (`openpyxl`, `python-docx`, `pypdf`) trong môi trường máy trạm để đọc/trích xuất tự động các biểu mẫu Word/Excel/PDF khi Marketing bàn giao về kho tham khảo.
- **Rủi ro phát hiện:**
  - Nếu không chốt sớm danh mục trường dữ liệu chuẩn từ biểu mẫu thực tế, Tech và UX có nguy cơ thiết kế thiếu trường trên Trang 1 (Thu tiền) và Trang 2 (Thiết bị) của Sổ quản lý ảo.
- **Đề xuất & Vị trí xử lý:**
  - **Đề xuất:** Marketing Agent ưu tiên thu thập và nạp tối thiểu 03 mẫu (Hợp đồng thuê trọ, Biên bản bàn giao tài sản phòng, Phiếu thu tiền điện nước) vào `2.Tai_lieu_tham_khao/3.Tai_lieu_nghiep_vu/`; sau đó BA Lead chuẩn hóa thành bảng Data Dictionary cho Sổ quản lý ảo.
  - **Vị trí xử lý:** `Marketing Agent` (thu thập) $\rightarrow$ `BA Lead` & `BA Agent` (chuẩn hóa đặc tả).

---

## 2. Báo cáo độc lập — [Tech Lead] (Kiến trúc & Kỹ thuật)
- **Phạm vi phụ trách:** `DI_...DYQ` (Task cha) và 3 subtask (`DI_...ERk`, `DI_...ERo`, `DI_...ERw`).
- **Kiểm tra tài liệu & điều kiện thực hiện:**
  - **Đạt:** Đã có [TECH_PROFILE.md](file:///Users/uni/Documents/AI/AI-Workspace/AI-Workspace/TEAM_ORCA/4.Du_an/QLNT/03-ky-thuat/TECH_PROFILE.md), báo cáo 5 nhóm object [DANH_GIA_THU_VIEN_3D_OBJECTS.md](file:///Users/uni/Documents/AI/AI-Workspace/AI-Workspace/TEAM_ORCA/4.Du_an/QLNT/03-ky-thuat/DANH_GIA_THU_VIEN_3D_OBJECTS.md) và tài liệu tham khảo Sổ ảo 3D [REF_SO_QUAN_LY_AO_3D.md](file:///Users/uni/Documents/AI/AI-Workspace/AI-Workspace/TEAM_ORCA/2.Tai_lieu_tham_khao/3.Tai_lieu_nghiep_vu/REF_SO_QUAN_LY_AO_3D.md).
  - **Còn thiếu:** Trong `TECH_PROFILE.md`, giao diện `IGameRenderer` mới chỉ định nghĩa các hàm cho tòa nhà/avatar (`renderBuilding`, `spawnAvatar`, `setDeviceStatus`), **chưa cập nhật hợp đồng giao tiếp cho phân hệ Sổ quản lý ảo F04** (`openLedgerBook`, `selectFloorPage`, `openRoomDetailSheet`, `updateRoomFieldInPlace`, `closeDetailSheet`, `closeLedgerBook`) theo quyết định `QLNT-D010`, `QLNT-D011`, `QLNT-D012`.
- **Kiểm tra công cụ, môi trường, thư viện:**
  - Máy trạm đã có `Node.js v23.11.0` và `npm`.
  - **Chưa có:** Trình quản lý gói tốc độ cao `pnpm` (hoặc `bun`); repo `4.Du_an/QLNT` hiện mới có tài liệu Markdown, chưa khởi tạo khung mã nguồn (`package.json`, `tsconfig.json`, `vite`, `three`, `@types/three`, `zustand`/`pinia`, `tailwindcss`, `@capacitor/core`) trên nhánh thử nghiệm kỹ thuật (PoC/Spike) để đo đạc FPS và bộ nhớ thực tế giữa 2 phương án *Three.js Mesh + CanvasTexture* và *Three.js + DOM Overlay*.
  - Nhóm công cụ AI hỗ trợ code (`repomix`, `planning-with-files`, `superpowers`) trong `SO_DANG_KY_CONG_CU_AI.md` đang ở trạng thái `Hoãn đến khi có repo sản phẩm` — cần xin chủ dự án kích hoạt khi bắt đầu dựng PoC.
- **Rủi ro phát hiện:**
  - Đánh giá hiệu năng WebGL/Three.js trên mobile mà không có môi trường PoC thực tế dễ dẫn đến sai lệch ước lượng FPS và hiện tượng tràn bộ nhớ (CanvasTexture memory leak) khi lật nhiều trang sổ.
- **Đề xuất & Vị trí xử lý:**
  - **Đề xuất:** (1) Cập nhật ngay đặc tả `IGameRenderer` và Event Bus cho Sổ quản lý ảo F04 trong `03-ky-thuat/TECH_PROFILE.md`; (2) Cài đặt `pnpm` và tạo branch PoC gắn với task `DI_...ERk` để benchmark 2 phương án render Sổ 3D.
  - **Vị trí xử lý:** `Tech Lead` & `Tech Contributor`.

---

## 3. Báo cáo độc lập — [UX Lead] (Thiết kế trải nghiệm & Giao diện)
- **Phạm vi phụ trách:** `DI_...DYY` (Task cha) và 3 subtask (`DI_...ER8`, `DI_...ESA`, `DI_...ESI`).
- **Kiểm tra tài liệu & điều kiện thực hiện:**
  - **Đạt:** Đã nhận đủ Use Cases, RTM P1 và tài liệu tham khảo Sổ quản lý ảo 3D (`REF-BIZ-001`).
  - **Còn thiếu:** Chưa có thư mục lưu trữ hồ sơ thiết kế trải nghiệm trong repo dự án (cần khởi tạo `4.Du_an/QLNT/02-nghiep-vu/ux-ui/` hoặc `03-ky-thuat/ux-ui/`); chưa chốt khung kích thước màn hình chuẩn (Viewport Breakpoints: ví dụ Mobile Portrait `390x844` vs Landscape) khi mở Sổ quản lý ảo 3D để đảm bảo vùng chạm (touch target $\ge 44\times44\text{px}$) trên mặt bằng tầng 2D và 3 trang chi tiết không bị quá nhỏ.
- **Kiểm tra công cụ, môi trường, thư viện:**
  - Máy trạm không cài Figma Desktop. Để đảm bảo lưu trữ trực tiếp trong Git và dễ truy vết theo chuẩn AI-first, UX Agent cần sử dụng sơ đồ luồng `Mermaid` kết hợp **HTML/Tailwind CSS Interactive Wireframe Prototype** (chạy trực tiếp trên trình duyệt Chrome sẵn có).
- **Rủi ro phát hiện:**
  - Hiển thị đồng thời 3 trang giấy chi tiết (Trang 1: Thu tiền, Trang 2: Thiết bị, Trang 3: Lịch sử) trên màn hình dọc (Portrait) của điện thoại sẽ gây chữ nhỏ, khó thao tác `in-place edit`. Cần quy định cơ chế vuốt chuyển tab trang giấy (Swipe/Tab) trên mobile thay vì dàn ngang cả 3 trang cùng lúc.
- **Đề xuất & Vị trí xử lý:**
  - **Đề xuất:** Quy chuẩn hóa đầu ra UX bằng bộ tài liệu Markdown + Mermaid Flow + HTML/Tailwind Interactive Prototype cho Sổ quản lý ảo F04; bổ sung quy tắc hiển thị theo từng trang đơn (Single-page view + Tab/Swipe chuyển trang 1-2-3) trên màn hình dọc di động.
  - **Vị trí xử lý:** `UX Lead` & `UX Agent` (phối hợp `Tech Lead`).

---

## 4. Báo cáo độc lập — [Marketing Lead] (Nghiên cứu thị trường & Tham khảo nghiệp vụ)
- **Phạm vi phụ trách:** `DI_...DYo` (Task cha) và 3 subtask (`DI_...ESQ`, `DI_...ESY`, `DI_...ESc`).
- **Kiểm tra tài liệu & điều kiện thực hiện:**
  - **Đạt:** Đã hoàn thành báo cáo desk research `02-nghiep-vu/NGHIEN_CUU_THI_TRUONG.md`, báo cáo khảo cứu `BAO_CAO_THAM_KHAO_3D_BOOK.md` và tài liệu tham khảo nghiệp vụ `REF_SO_QUAN_LY_AO_3D.md`.
  - **Còn thiếu:**
    1. Chưa thực hiện thu thập bộ biểu mẫu hợp đồng thuê nhà trọ, nội quy phòng trọ, biên bản giao nhận thiết bị, hóa đơn tiền trọ đại trà tại Việt Nam theo chỉ đạo của Chủ dự án để lưu vào `2.Tai_lieu_tham_khao/3.Tai_lieu_nghiep_vu/`.
    2. Chưa có bảng đối sánh chi tiết giao diện/luồng nhập liệu của các phần mềm quản lý trọ phổ biến tại VN (ví dụ: *Mona House, iTro, LOZIDO, Quản Lý Trọ*) để rút ra bài học tối ưu thao tác nhập số điện/nước nhanh.
- **Kiểm tra công cụ, môi trường, thư viện:**
  - Công cụ tìm kiếm web (`search_web`, `read_url_content`) hoạt động tốt (không dùng `firecrawl` theo sổ đăng ký công cụ).
- **Rủi ro phát hiện:**
  - Các mẫu hợp đồng thuê trọ thu thập trên mạng có thể cũ hoặc chưa cập nhật theo Luật Nhà ở 2023 / Luật Căn cước 2023 (thay CMND bằng CCCD/Định danh điện tử).
- **Đề xuất & Vị trí xử lý:**
  - **Đề xuất:** Lập tức thực hiện thu thập, phân loại và chú giải nguồn gốc bộ biểu mẫu hợp đồng/hóa đơn thuê trọ chuẩn tại VN + đối sánh 3 phần mềm quản lý trọ nội địa, nạp vào `2.Tai_lieu_tham_khao/3.Tai_lieu_nghiep_vu/`.
  - **Vị trí xử lý:** `Marketing Lead` & `Marketing Agent`.

---

## 5. Báo cáo độc lập — [QA Lead] (Kiểm thử & Đảm bảo chất lượng)
- **Phạm vi phụ trách:** `DI_...DY4` (Task cha) và 2 subtask (`DI_...ESo`, `DI_...ESw`).
- **Kiểm tra tài liệu & điều kiện thực hiện:**
  - **Đạt:** Đã có ma trận truy vết P1 (`MA_TRAN_TRUY_VET_P1.md`) với 21 tiêu chí nghiệm thu AC-01 đến AC-21 và skill `3.DOC_AI/skills/qa-test-case/SKILL.md`.
  - **Còn thiếu:** Các biểu mẫu chuẩn X02 trong `1.Bieu_Mau/1. Test cases/` đang ở định dạng `.xlsx` và `.xlsm` nhị phân; chưa được trích xuất cấu trúc cột ra mẫu Markdown/CSV trong `4.Du_an/QLNT/04-van-hanh/` để QA Agent viết test case và so sánh diff trên Git.
- **Kiểm tra công cụ, môi trường, thư viện:**
  - **Thiếu thư viện Python đọc Excel:** Máy trạm hiện dùng `Python 3.9.6` nhưng **chưa cài đặt `openpyxl` và `pandas`**, khiến QA Agent không thể chạy script đọc trực tiếp các file `.xlsx`/`.xlsm` trong `1.Bieu_Mau/`.
  - **Thiếu trình duyệt Playwright:** Dù `playwright-mcp` đã đăng ký trong `.mcp.json`, lệnh `playwright` CLI và browser binaries chưa được cài đặt sẵn phục vụ kiểm thử tự động về sau.
- **Rủi ro phát hiện:**
  - Nếu lưu test case của dự án QLNT dưới dạng file `.xlsx` nhị phân sẽ không thể review dòng lệnh (Git diff) và khó liên kết tự động với các mã yêu cầu `R-01`..`R-21` trên GitHub.
- **Đề xuất & Vị trí xử lý:**
  - **Đề xuất:** (1) Cài đặt gói Python `openpyxl` (hoặc dùng môi trường ảo `.venv`) để đọc biểu mẫu X02; (2) Chuẩn hóa mẫu Test Case & Kịch bản kiểm thử P1 dưới dạng Markdown/CSV tại `4.Du_an/QLNT/04-van-hanh/TEST_CASES_P1.md` (có script xuất sang `.xlsx` chuẩn X02 khi cần bàn giao).
  - **Vị trí xử lý:** `QA Lead` & `QA Agent` (phối hợp `Tech Lead` hỗ trợ cài đặt thư viện).

---

## 6. Báo cáo độc lập — [2D Visual Lead] (Thiết kế hình ảnh & Placeholder 2D)
- **Phạm vi phụ trách:** `DI_...DZI` (Task cha) và 2 subtask (`DI_...ES0`, `DI_...ES4`).
- **Kiểm tra tài liệu & điều kiện thực hiện:**
  - **Đạt:** Đã có định hướng lộ trình đồ họa `QLNT-D008` và kiến trúc Sổ quản lý ảo F04 (`QLNT-D010`).
  - **Còn thiếu:** Chưa có thông số **Pixel-per-Unit (PPU)**, kích thước khung текстура (Texture Atlas resolution: `1024x1024` hay `2048x2048`), bảng mã màu chuẩn (Color Palette) cho các trạng thái phòng trên mặt bằng tầng 2D (Phòng trống, Đang ở, Chấm than vàng nợ tiền, Chấm than đỏ báo hỏng) từ Tech Lead và UX Lead.
- **Kiểm tra công cụ, môi trường, thư viện:**
  - Công cụ sinh ảnh (`generate_image`) và xử lý SVG/Canvas sẵn sàng.
  - Cần bổ sung thư viện Python `Pillow` (`PIL`) nếu cần cắt ghép sprite sheet hoặc nén ảnh tự động.
- **Rủi ro phát hiện:**
  - Nếu làm ảnh bitmap độ phân giải thấp cho trang mặt bằng tầng 2D, khi người dùng zoom cận cảnh vào Sổ quản lý ảo trên màn hình Retina/FHD sẽ bị vỡ hạt (blurry text/icons).
- **Đề xuất & Vị trí xử lý:**
  - **Đề xuất:** Sử dụng định dạng **SVG / High-DPI Canvas 2x** cho mặt bằng tầng 2D và hệ thống icon cảnh báo (chấm than vàng/đỏ); chốt bảng thông số kỹ thuật Texture & Sprite Spec phối hợp cùng Tech Lead.
  - **Vị trí xử lý:** `2D Visual Lead` & `2D Agent` (phối hợp `Tech Lead`, `UX Lead`).

---

## 7. Báo cáo độc lập — [3D Artist Lead] (Mô hình 3D & Pipeline Asset)
- **Phạm vi phụ trách:** `DI_...DZQ` (Task cha) và 2 subtask (`DI_...ETI`, `DI_...ETQ`).
- **Kiểm tra tài liệu & điều kiện thực hiện:**
  - **Đạt:** Đã có báo cáo đánh giá 5 nhóm object [DANH_GIA_THU_VIEN_3D_OBJECTS.md](file:///Users/uni/Documents/AI/AI-Workspace/AI-Workspace/TEAM_ORCA/4.Du_an/QLNT/03-ky-thuat/DANH_GIA_THU_VIEN_3D_OBJECTS.md), tài liệu tham khảo [KENNEY_3D_ASSET_REFERENCE.md](file:///Users/uni/Documents/AI/AI-Workspace/AI-Workspace/TEAM_ORCA/2.Tai_lieu_tham_khao/4.Tai_lieu_ky_thuat/KENNEY_3D_ASSET_REFERENCE.md), và mã nguồn thư viện `sand3d` đã clone sẵn tại `2.Tai_lieu_tham_khao/1.Tai_lieu_AI/sand3d/`.
  - **Còn thiếu:** Chưa tải các gói file `.glb`/`.fbx` thực tế của *Kenney Animated Characters* và *Kenney Furniture Kit* (CC0) về thư mục tài nguyên của dự án để kiểm tra cấu trúc xương (rigging) và tỷ lệ kích thước với mô hình do `sand3d` sinh ra.
- **Kiểm tra công cụ, môi trường, thư viện (Điểm nghẽn quan trọng):**
  - Dù `sand3d` đã được duyệt trong `SO_DANG_KY_CONG_CU_AI.md` và có mã nguồn trong repo, kiểm tra môi trường máy trạm phát hiện:
    1. **Chưa cài đặt ứng dụng `Blender` (`blender` CLI không tồn tại trong `/Applications` và `PATH`).**
    2. **Môi trường Python hiện tại là `Python 3.9.6`**, trong khi `sand3d/pyproject.toml` yêu cầu **`Python >= 3.11`** và thư viện **`bpy` (Blender Python API)**.
    3. **Chưa cài đặt `@gltf-transform/cli`** để nén và kiểm tra polycount/texture của file `.glb` xuất ra.
- **Rủi ro phát hiện:**
  - Trong Sprint 1, các task của 3D Artist chỉ dừng ở mức **lập checklist brief đầu vào và đề xuất thứ tự chuyển đổi asset (tài liệu thiết kế)** nên **không bị chặn** bởi việc thiếu Blender. Tuy nhiên, ngay khi bước sang giai đoạn chạy script `sand3d` sinh model `.glb` thực tế (P1 Prototype / P2), pipeline sẽ bị lỗi nếu chưa cài đặt Blender 4.x + Python 3.11 (`bpy`).
- **Đề xuất & Vị trí xử lý:**
  - **Đề xuất:**
    1. Trong Sprint 1: Hoàn thành 100% tài liệu Checklist Brief 3D và lộ trình chuyển đổi asset 5 nhóm mà không cần chạy Blender.
    2. Chuẩn bị môi trường cho giai đoạn dựng model: Cài đặt `Blender 4.x` (hoặc `Python 3.11` + `pip install bpy` + `pip install -e 2.Tai_lieu_tham_khao/1.Tai_lieu_AI/sand3d`) và `@gltf-transform/cli`.
  - **Vị trí xử lý:** `3D Artist Lead` & `3D Agent` (phối hợp `Tech Lead` thiết lập môi trường).

---

## 8. Báo cáo độc lập — [Knowledge Governance Lead] (Quản trị tri thức)
- **Phạm vi phụ trách:** `DI_...D7s` (Task cha) và 1 subtask (`DI_...ETY`).
- **Kiểm tra tài liệu & điều kiện thực hiện:**
  - **Đạt:** Đã có `RULES_CORE.md`, `MO_HINH_VAN_HANH.md`, `SO_DANG_KY_TRI_THUC.md`, `SO_DANG_KY_CONG_CU_AI.md` và `HANDOVER.md`.
  - **Còn thiếu / Chưa đồng bộ:**
    1. Hai tài liệu tham khảo giá trị cao đã được tạo mới và duyệt đưa vào sử dụng (`REF_SO_QUAN_LY_AO_3D.md` và `KENNEY_3D_ASSET_REFERENCE.md`), nhưng **bảng danh mục trong `3.DOC_AI/quan-tri/SO_DANG_KY_TRI_THUC.md` vẫn đang để trống**, chưa ghi nhận mã tri thức, nguồn gốc và trạng thái.
    2. Trong `3.DOC_AI/.claude-plugin/plugin.json`, phiên bản đã nâng lên `0.1.5` nhưng trong `3.DOC_AI/HANDOVER.md` (mục 3) vẫn ghi phiên bản hiện tại là `0.1.4`.
    3. Có thư mục `.agents/skills/` đang ở trạng thái untracked cần kiểm tra đồng bộ trong Git.
- **Kiểm tra công cụ, môi trường, thư viện:**
  - Đầy đủ công cụ kiểm tra Markdown và Git.
- **Rủi ro phát hiện:**
  - Nếu không đăng ký các tài liệu tham khảo mới vào `SO_DANG_KY_TRI_THUC.md`, các agent ở phiên làm việc sau có thể bỏ sót nguồn chuẩn khi tra cứu trong đợt rà soát định kỳ (2026-11-13).
- **Đề xuất & Vị trí xử lý:**
  - **Đề xuất:** Cập nhật `SO_DANG_KY_TRI_THUC.md` bổ sung các mục tri thức/tham khảo đã xác lập; đồng bộ số phiên bản plugin `0.1.5` trong `HANDOVER.md`.
  - **Vị trí xử lý:** `Knowledge Governance Lead` & `Knowledge Governance Agent`.

---

## 9. Báo cáo độc lập & Tổng hợp điều phối — [PM Lead] (Quản lý dự án)
- **Phạm vi phụ trách:** `DI_...DX8` (Task cha) và 2 subtask (`DI_...ERI`, `DI_...ERM`).
- **Kiểm tra tài liệu & điều kiện thực hiện:**
  - **Đạt:** Toàn bộ 30 task của Sprint 1 trên GitHub Project #2 (`QLNT`) đã được chuẩn hóa mô tả, gán đầy đủ 3 trường phân loại (`Vai trò`, `Cấp độ`, `Lead phụ trách`).
  - **Còn thiếu:**
    1. Chưa có tài liệu tổng hợp **Bản đồ phụ thuộc công việc (Dependency Map) & Checklist Definition of Ready (DoR) của Sprint 1** lưu chính thức tại `4.Du_an/QLNT/01-quan-ly/` để Chủ dự án có căn cứ duyệt mở Sprint.
    2. Trên GitHub Project #2 hiện chưa có trường phân loại giữa `Sprint Task` và `Issue / Risk` khi đưa danh sách Issue từ báo cáo của các Lead lên quản lý chung.
- **Kiểm tra công cụ, môi trường, thư viện:**
  - `gh` CLI hoạt động tốt, kết nối đầy đủ tới repo `theGonlyK/QLNT` và GitHub Project #2.
  - Cần cài đặt `openpyxl` (cùng nhu cầu với QA Lead) nếu PM cần trích xuất dữ liệu từ biểu mẫu `1.Bieu_Mau/2. PM/TEMP_PROJECT_PLAN_v1.0.xlsx`.
- **Rủi ro phát hiện:**
  - Nếu các Issue phát sinh từ đánh giá của 9 Lead không được theo dõi tập trung trên hệ thống Issue của dự án (`theGonlyK/QLNT`) và liên kết vào Project #2, các điểm nghẽn về công cụ (Blender/Python 3.11, `openpyxl`) và tài liệu (biểu mẫu VN, hợp đồng `IGameRenderer` cho F04) sẽ làm chậm tiến độ ngay khi Sprint 1 bắt đầu.
- **Tổng hợp danh sách Issue dự án & Phương án xử lý (Cập nhật lên hệ thống Quản lý Issue của Orca):**

| Mã Issue | Tên Issue | Mức độ | Nguồn báo cáo | Phương án đề xuất | Vị trí xử lý |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **ISS-01** | `[Issue][BA/Marketing] Thiếu bộ biểu mẫu hợp đồng, bàn giao thiết bị & hóa đơn trọ thực tế tại VN cho Sổ quản lý ảo F04` | Cao | BA Lead, Marketing Lead | Marketing thu thập tối thiểu 3 bộ biểu mẫu chuẩn theo luật VN hiện hành nạp vào `2.Tai_lieu_tham_khao/3.Tai_lieu_nghiep_vu/`; BA chuẩn hóa Data Dictionary cho 3 trang Sổ F04. | `Marketing Agent` $\rightarrow$ `BA Lead` |
| **ISS-02** | `[Issue][Tech] Hợp đồng IGameRenderer chưa có đặc tả interface & event cho Sổ quản lý ảo F04 (QLNT-D010..D012)` | Cao | Tech Lead | Bổ sung các method điều khiển Sổ 3D (`openLedgerBook`, `selectFloorPage`, `openRoomDetailSheet`, `updateRoomFieldInPlace`, đóng 2 cấp) vào `03-ky-thuat/TECH_PROFILE.md`. | `Tech Lead`, `Tech Contributor` |
| **ISS-03** | `[Issue][Tech] Chưa khởi tạo môi trường PoC (pnpm, Vite, Three.js) để đo kiểm hiệu năng Sổ quản lý ảo 3D trên mobile` | Trung bình | Tech Lead | Cài đặt `pnpm`, tạo branch PoC gắn task `DI_...ERk` để benchmark thực tế giữa phương án *Three.js CanvasTexture* và *DOM Overlay* trước khi chốt giải pháp render. | `Tech Lead`, `Tech Contributor` |
| **ISS-04** | `[Issue][UX/2D] Chưa chốt quy chuẩn hiển thị 3 trang chi tiết Sổ F04 trên màn hình dọc (Mobile Portrait) và tỷ lệ PPU/SVG` | Cao | UX Lead, 2D Visual Lead | Quy định cơ chế xem từng trang đơn kết hợp vuốt/tab chuyển Trang 1-2-3 trên mobile portrait; dùng SVG/High-DPI Canvas 2x cho mặt bằng tầng 2D và chốt kích thước vùng chạm $\ge 44\times44\text{px}$. | `UX Lead`, `2D Visual Lead` |
| **ISS-05** | `[Issue][QA/PM] Thiếu thư viện Python (openpyxl, pandas) để đọc biểu mẫu X02 (.xlsx/.xlsm) và xuất mẫu Test Case Markdown` | Trung bình | QA Lead, PM Lead | Cài đặt `openpyxl`, `pandas` trong môi trường Python/venv; trích xuất cấu trúc chuẩn X02 sang mẫu Markdown/CSV trong `04-van-hanh/` để quản lý phiên bản trên Git. | `QA Lead`, `Tech Lead` |
| **ISS-06** | `[Issue][3D Artist] Máy trạm chưa cài đặt Blender 4.x, Python >= 3.11 (bpy) và gltf-transform cho pipeline sand3d` | Trung bình (Chặn ở P2) | 3D Artist Lead | Sprint 1 vẫn hoàn thành bình thường các tài liệu Brief 3D; trước khi chạy script sinh model `.glb` thực tế cần cài Blender 4.x + Python 3.11 (`bpy`) + `@gltf-transform/cli` và tải gói asset mẫu Kenney CC0. | `3D Artist Lead`, `Tech Lead` |
| **ISS-07** | `[Issue][Knowledge Governance] Sổ đăng ký tri thức (SO_DANG_KY_TRI_THUC.md) chưa cập nhật các tài liệu tham khảo mới và lệch version plugin` | Thấp | Knowledge Governance Lead | Đăng ký `REF_SO_QUAN_LY_AO_3D.md`, `KENNEY_3D_ASSET_REFERENCE.md`, `NGHIEN_CUU_SANDFLOW_AI_VA_3D_GENERATION.md` vào `SO_DANG_KY_TRI_THUC.md` và đồng bộ version `0.1.5` trong `HANDOVER.md`. | `Knowledge Governance Lead` |
| **ISS-08** | `[Issue][PM] Cần lập tài liệu Bản đồ phụ thuộc (Dependency Map) & Checklist sẵn sàng (DoR) trình Chủ dự án duyệt mở Sprint 1` | Cao | PM Lead | Tổng hợp tài liệu kế hoạch và điều kiện sẵn sàng tại `01-quan-ly/SPRINT_1_READINESS_AND_DEPENDENCIES.md` để trình Chủ dự án phê duyệt. | `PM Lead`, `PM Agent` |
