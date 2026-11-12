# Chất lượng, Kiểm thử và Phát hành (Quality & Release) — QLNT

- **Trạng thái:** `Đã phê duyệt (Theo quyết định QLNT-D013, QLNT-D014)`
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

## 4. Cách phát hành / Triển khai (Release & Deployment Pipeline)

- **Giai đoạn 1 (Sprint 1–3 — Staging & MVP Demo):**
  - Tự động hóa qua **GitHub Actions CI/CD** $\rightarrow$ triển khai Frontend & 3D Assets lên **Cloudflare Pages**, kết nối **Supabase (Singapore)** và **Cloudflare R2 (Private Storage)**.
- **Giai đoạn 2 (Pilot Thực tế tại Hà Nội — 50 đến 300 chủ trọ):**
  - Triển khai trên **01 Cloud VPS tại Việt Nam (`4 vCPU, 8GB RAM, 100GB NVMe SSD`)** chạy **Docker Compose** (`Caddy + API + PostgreSQL 16 + Redis 7`), đứng sau **Cloudflare CDN & R2**.
- **Giai đoạn 3 (Scale-up SaaS — > 1.000 chủ trọ):**
  - Nâng cấp lên cụm HA tách rời **02 App Nodes (`4 vCPU, 8GB RAM`)** và **01 Dedicated DB Node (`4 vCPU, 16GB RAM, 250GB NVMe`)**.

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
