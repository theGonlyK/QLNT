# QLNT — Quản lý phòng trọ, khách trọ

> Khởi tạo 2026-11-06 từ `3.DOC_AI/templates/du-an-base`. Nhãn `Cần xác nhận` là thông tin chưa được chốt.

## Hồ sơ nhanh

- **Mã dự án:** QLNT
- **Mục tiêu sản phẩm:** Quản lý phòng trọ và khách trọ mang lại trải nghiệm như chơi game; người thuê tìm phòng trên bản đồ khu phố ảo
- **Chủ dự án / người quyết định:** Người dùng (chủ workspace, thẩm quyền cao nhất); Phụ trách mảng A/B/C: Agent đề xuất, Người dùng phê duyệt
- **Phạm vi vòng đời hiện tại:** Khởi tạo (hoàn thành cổng Brief, chuyển sang Thiết kế kỹ thuật)
- **Mô hình kiến trúc:** SaaS Multi-tenant (nền tảng chung cho nhiều chủ trọ, chia sẻ bản đồ khu phố, phân tách dữ liệu)
- **Nhóm loại hình:** Web responsive + App mobile (đóng gói Capacitor từ 1 codebase)
- **Chiến lược đồ họa:** Giai đoạn 1 (P1 MVP) dùng 2D phẳng/isometric sprite đơn giản; Giai đoạn 2 nâng cấp lên 2.5D/3D (Three.js/WebGL); kiến trúc Headless tách lớp giúp đổi đồ họa dễ dàng
- **Thị trường đầu tiên:** Hà Nội — nhà trọ cho sinh viên, người đi làm
- **Môi trường triển khai:** Local Dev → Cloud Staging/Production
- **Repository Git:** `TEAM_ORCA/4.Du_an/QLNT` (Git riêng, nhánh `main`)
- **Trạng thái:** Đã qua cổng Brief → Chuẩn bị thiết kế kỹ thuật và kiến trúc mã nguồn

## Cách dùng khung

- Bắt đầu với phần lõi trong `01-quan-ly` đến `04-van-hanh`.
- Chỉ hoàn thiện mức cần thiết cho phạm vi hiện tại; cập nhật dần qua mỗi vòng đời.
- Phần nào chưa cần thì đánh dấu `Chưa áp dụng` hoặc để trong backlog, không tạo tài liệu cho đủ hình thức.
- Các yêu cầu riêng, dữ liệu, quyết định, mã nguồn và cấu hình thuộc repository của dự án này.
- Chỉ đề xuất chuyển tri thức nghiệp vụ sang `3.DOC_AI` nếu có thể tái sử dụng ở dự án khác; cần nguồn, phạm vi và người xác minh.

## Hồ sơ dự án

- `01-quan-ly/PROJECT_BRIEF.md`: mục tiêu, phạm vi, vai trò, vòng đời.
- `01-quan-ly/DECISIONS.md`: quyết định và người chốt.
- `02-nghiep-vu/`: yêu cầu, thuật ngữ, quy tắc và câu hỏi cần xác nhận.
- `03-ky-thuat/`: kiến trúc, công nghệ, tích hợp và môi trường.
- `04-van-hanh/`: chất lượng, phát hành, vận hành và cải tiến.

## Vòng đời và cổng duyệt (`Thử nghiệm`)

Áp dụng mô hình 3 mảng và cổng G1 (Yêu cầu sẵn sàng), G3 (Sẵn sàng phát hành) theo `3.DOC_AI/quan-tri/MO_HINH_VAN_HANH.md`. Ghi kết quả từng cổng vào `01-quan-ly/DECISIONS.md`.

## Chọn hồ sơ kỹ thuật

Loại hình và môi trường triển khai là hai chiều riêng, có thể kết hợp. Ghi rõ loại client (nếu có), nền tảng chạy, người dùng, kết nối, lưu trữ, bảo mật, môi trường triển khai và hạn chế vận hành trong `03-ky-thuat/TECH_PROFILE.md`. Không suy ra kiến trúc chỉ từ nhãn “web” hay “application”.

## Nhật ký cải tiến khung

Ghi các đề xuất rút ra sau mỗi vòng đời trong `04-van-hanh/IMPROVEMENTS.md`. Chỉ cập nhật bộ mẫu chung sau khi có căn cứ lặp lại hoặc người phụ trách phê duyệt.
