# Chất lượng, Kiểm thử và Phát hành (Quality & Release) — QLNT

- **Trạng thái:** `Đã phê duyệt (Theo quyết định QLNT-D013, QLNT-D014, QLNT-D016)`
- **Tài liệu hạ tầng đi kèm:** [HA_TANG_VA_VAN_HANH_HE_THONG.md](file:///Users/uni/Documents/AI/AI-Workspace/AI-Workspace/TEAM_ORCA/4.Du_an/QLNT/04-van-hanh/HA_TANG_VA_VAN_HANH_HE_THONG.md)

---

## 1. Cách kiểm thử phù hợp phạm vi (Testing Strategy)

1. **Kiểm thử Đơn vị Nghiệp vụ Lõi (`Unit Test` — Headless Domain Core):**
   - Kiểm thử 100% logic nghiệp vụ tách rời đồ họa (`NT-01`): tính tiền điện/nước, nộp bill chuyển khoản $\rightarrow$ bật chấm than vàng $\rightarrow$ chủ nhà duyệt bill $\rightarrow$ tắt chấm than vàng & cộng điểm thưởng (`R-05`, `QLNT-D006`), báo hỏng thiết bị $\rightarrow$ bật chấm than đỏ (`R-04`), chỉnh sửa trực tiếp (`in-place edit`) tự động ghi vết vào Trang 3 Lịch sử (`QLNT-D011`, `NT-03`).
2. **Kiểm thử Tương tác & Hiển thị Sổ quản lý ảo F04 (`UI/UX & 3D Renderer Test`):**
   - Kiểm thử luồng đóng/mở 2 cấp (`QLNT-D012`) và chế độ hiển thị **Single-Page** cho bộ 3 trang chi tiết phòng (`QLNT-D013`).
   - Kiểm thử hiệu năng trên thiết bị di động tầm trung: đảm bảo tốc độ tải cảnh `< 1.5s` trên mạng 4G, duy trì `30–60 FPS`, và tự động chuyển về chế độ **2D Slide-Card** khi `FPS < 30` hoặc thiết bị `RAM < 3GB`.
3. **Kiểm thử Bảo mật & Phân quyền Đa Chủ trọ (`Security & Multi-tenant Test`):**
   - Kiểm thử cách ly dữ liệu theo `landlord_id` (Row-Level Security) giữa các chủ trọ.
   - Kiểm thử quyền của Sale trọ (`F03`) và Bản đồ công khai (`F06`): chỉ truy cập được phòng trống (`NT-06`), bị chặn tuyệt đối khi cố truy cập phòng đang có khách.
   - Kiểm thử link ảnh bill/CCCD (`Private Signed URL`) tự động hết hạn sau 15 phút.

---

## 2. Tiêu chí hoàn thành (Definition of Done — DoD)

- **Đối với Hồ sơ Thiết kế & Đặc tả (Cổng G1 — Sprint 1):**
  - Đầy đủ đặc tả quy trình Single-Page Sổ F04, hợp đồng `IGameRenderer`, Wireframe Mobile, quy chuẩn Asset 2D/3D và 100% tiêu chí nghiệm thu `AC-01..AC-21` được ánh xạ sang kịch bản kiểm thử.
- **Đối với Tính năng Lập trình (Sprint 2+ & Cổng G3):**
  - Code tuân thủ nghiêm ngặt kiến trúc tách tầng (`Headless Domain Core` $\leftrightarrow$ `Event Bus` $\leftrightarrow$ `IGameRenderer`).
  - Pass 100% `typecheck`, `lint`, `unit test` và các ca kiểm thử P1 của QA Lead.
  - Vượt qua toàn bộ danh mục kiểm tra môi trường `X02_Checklist_Check Enviroment (STG) Before build.xlsx`.

---

## 3. Quy trình Review / Thẩm định (Review Workflow)

1. **Tác giả thực thi (`Agent / Dev Contributor`):** Thực hiện task trên nhánh riêng, tự kiểm tra theo checklist trong `04-van-hanh/HA_TANG_VA_VAN_HANH_HE_THONG.md`.
2. **Rà soát Chuyên môn (`Team Lead` — BA Lead / Tech Lead / UX Lead / QA Lead):** Kiểm tra chéo tính tuân thủ kiến trúc `NT-01..NT-06`, hiệu năng và bảo mật.
3. **Kiểm soát Tri thức & Quản lý (`Knowledge Governance Lead` & `PM Lead`):** Đối chiếu mục tiêu Sprint trên Orca / GitHub Project `#2` và trình Chủ dự án tại các cổng quyết định `G1`, `G3`.

---

## 4. Cách phát hành / Triển khai & Kiểm soát Chi phí (Release, Deployment & Cost Control)

- **Nguyên tắc ưu tiên số 1 ("Dễ & Không mất phí — `$0 First`") & Thư viện cục bộ (`QLNT-D016`):**
  - **Trong Sprint 2 (Prototype P1):** Chạy 100% cục bộ (`Local Vite Server` + `IndexedDB` + thư viện cài đặt cục bộ như VietQR EMVCo/NAPAS 247 offline); **chưa kết nối bên thứ 3**. Mọi đề xuất deploy hoặc kết nối ra dịch vụ bên thứ 3 phải báo Chủ dự án confirm trước (`QLNT-D016`).
  - **Khi được Chủ dự án confirm mở kết nối Cloud ở Giai đoạn 1 (`$0/tháng` — Free Tier):** Tự động hóa qua **GitHub Actions CI/CD** $\rightarrow$ triển khai Frontend & 3D Assets lên **Cloudflare Pages**, kết nối **Supabase Free Tier (Singapore)** và **Cloudflare R2 Free Tier (`10GB`, `0đ Egress`)** kết hợp lưu trữ cục bộ **`IndexedDB` (Local-First)**.
- **Quy trình bắt buộc khi đề xuất tăng hoặc giảm chi phí (Chuyển sang Giai đoạn 2 hoặc 3):**
  - Mọi đề xuất thay đổi làm tăng/giảm chi phí (như thuê VPS Việt Nam `4 vCPU, 8GB RAM` ở Giai đoạn 2 hay tách cụm HA ở Giai đoạn 3) **bắt buộc phải lập báo cáo đánh giá lại 2 chiều**:
    1. **Đánh giá lại cấu trúc hạ tầng:** Đã tối ưu hết mức ở tầng Client (`IndexedDB`), nén ảnh `< 300KB`, nén 3D `.glb` và Cache trên Cloudflare Edge để giữ mức `$0/tháng` hay chưa?
    2. **Đánh giá lại phạm vi triển khai:** Có thể điều chỉnh phạm vi tính năng (ví dụ: giới hạn thời gian lưu ảnh bill sau khi đã duyệt xong, phân tầng tính năng Realtime) để không phát sinh chi phí hay không?
  - Chỉ thực hiện nâng cấp/thay đổi sau khi Chủ dự án phê duyệt kết quả đánh giá lại này.

---

## 5. Kế hoạch Rollback / Khôi phục (Rollback & Disaster Recovery)

1. **Rollback Ứng dụng Web / 3D Client (< 2 phút):**
   - Trên Cloudflare Pages: kích hoạt **Instant Rollback** về bản build ổn định ngay trước đó với 1 thao tác.
   - Trên VPS Docker Compose: giữ lại tag Docker image của 3 phiên bản gần nhất (`v-current`, `v-prev-1`, `v-prev-2`) để chạy `docker compose up -d` khôi phục tức thì.
2. **Sao lưu & Khôi phục Cơ sở dữ liệu (RPO < 24h, RTO < 30 phút):**
   - Tự động chạy cronjob `pg_dump` nén và mã hóa mỗi đêm lúc `02:00 AM`, đẩy lên bucket sao lưu riêng trên **Cloudflare R2** (lưu trữ xoay vòng 14 ngày).
   - Mọi migration cơ sở dữ liệu bắt buộc có script `up` và `down` đã được kiểm thử trên môi trường `STG` trước khi chạy trên `PROD`.

---

## 6. Người chịu trách nhiệm vận hành (Operational Ownership)

- **Phê duyệt tối cao (Cổng G1, G3 & Ngân sách hạ tầng):** Chủ dự án (Người dùng).
- **Chịu trách nhiệm kỹ thuật, kiến trúc & vận hành máy chủ/Cloud:** `Tech Lead` phối hợp `Mảng C (Quản lý vận hành)`.
- **Thực thi lập trình & tuân thủ chuẩn vận hành:** Toàn bộ `Dev / Tech Contributor` bám theo tài liệu trong `04-van-hanh/`.
- **Kiểm định chất lượng & nghiệm thu môi trường STG/PROD:** `QA Lead` & `QA Agent`.
