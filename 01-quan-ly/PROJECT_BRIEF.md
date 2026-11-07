# Tóm tắt dự án

- **Sản phẩm/dự án:** QLNT — Quản lý phòng trọ, khách trọ
- **Mục tiêu và vấn đề cần giải quyết:** Quản lý nhà trọ và khách trọ **với trải nghiệm như đang chơi game hơn là đang quản lý thật**; người thuê tìm trọ trong thế giới game. Chỉ số thành công: Cần xác nhận
- **Người dùng/đối tượng sử dụng:** Quản trị hệ thống, chủ nhà trọ, khách trọ (người thuê), sale trọ (chủ nhà tạo tài khoản, avatar tham quan phòng trống có thời hạn)
- **Thị trường đầu tiên:** Nhà trọ cho sinh viên và người đi làm tại Hà Nội
- **Chủ dự án:** Người dùng (chủ workspace, thẩm quyền phê duyệt cao nhất)
- **Người phụ trách mảng (tạm thời giai đoạn Khởi tạo):** Agent đề xuất kỹ thuật (Mảng B), chuẩn hóa nghiệp vụ (Mảng A) và lập kế hoạch vận hành (Mảng C); Người dùng xem xét và phê duyệt.
- **Đội ngũ đi kèm từng mảng:** Agent hỗ trợ thực thi theo từng vai trò subagent
- **Vòng đời/phạm vi đang thực hiện:** Khởi tạo (hoàn tất cổng Brief, chuyển sang Thiết kế kỹ thuật)
- **Mô hình triển khai:** SaaS Multi-tenant (nền tảng chung cho nhiều chủ nhà trọ độc lập, dùng chung bản đồ khu phố; dữ liệu phân tách theo từng chủ trọ)
- **Chiến lược đồ họa & công nghệ:** Mô hình 2 giai đoạn:
  - *Giai đoạn 1 (P1 MVP):* 2D / isometric phẳng, sprite và hoạt ảnh đơn giản, ưu tiên thể hiện trọn vẹn nghiệp vụ/chức năng, chạy nhẹ và mượt trên mọi thiết bị.
  - *Giai đoạn 2 (P2-P3):* Nâng cấp lên 2.5D / 3D (Three.js / WebGL).
  - *Kiến trúc:* Tách biệt hoàn toàn tầng Dữ liệu/Nghiệp vụ (Headless Core) với tầng Hiển thị (Renderer Adapter) để chuyển đổi và nâng cấp đồ họa dễ dàng.
- **Client:** Web responsive + App mobile (đóng gói bằng Capacitor/PWA từ 1 codebase)
- **Git repository:** `TEAM_ORCA/4.Du_an/QLNT` (nhánh `main`)
- **Ngày cập nhật:** 2026-11-07

## Phạm vi

### Bao gồm

- Nhà trọ 2.5D, khách trọ là avatar, nghiệp vụ quản lý thể hiện bằng hoạt ảnh (game phản ánh dữ liệu thật, không thay đổi dữ liệu thật)
- Quản lý trang thiết bị mặc định/bổ sung, cảnh báo hỏng (chấm than đỏ), cập nhật bảo trì và nhật ký sự cố từng phòng/khách
- Quy trình đóng tiền trọ: bản Miễn phí thao tác thủ công (avatar chủ nhà gõ cửa nhắc tiền, chấm than vàng, khách làm nhiệm vụ nộp ảnh bill, avatar khách giao tiền, thưởng/trừ điểm đúng/trễ hạn); bản Trả phí tự động tích hợp QR/cổng thanh toán
- Minigame săn bắt sinh vật nhỏ (chuột, gián) bằng vật dụng gia đình (nồi chảo, chổi dép)
- Chế độ xả giận: đập phá đồ vật, NPC lao công dọn dẹp
- Vai trò Sale trọ: chủ nhà cấp quyền có thời hạn để xem phòng trống, lấy dữ liệu mời chào và gắn bài đăng
- Tìm trọ trong thế giới game; chủ trọ đăng phòng trống và liên hệ
- Gói miễn phí dạng game (offline) và gói trả phí
- Hỗ trợ kết nối thiết bị ngoại vi (tùy chọn)
- Chi tiết: `02-nghiep-vu/REQUIREMENTS.md`

### Chưa bao gồm

- Thị trường ngoài Hà Nội (giai đoạn đầu)
- Mạng lưới môi giới/hoa hồng tự động đa cấp phức tạp (chỉ hỗ trợ vai trò Sale trọ cơ bản do chủ nhà quản lý)

## Thành công được xác định như thế nào

- Cần xác nhận

## Rủi ro, phụ thuộc và câu hỏi cần chốt

- Câu hỏi cần chốt trước cổng Brief: xem `02-nghiep-vu/REQUIREMENTS.md` mục "Câu hỏi cần làm rõ".
- Rủi ro: chi phí làm game (đồ họa, hoạt ảnh, vật lý) cao hơn hẳn phần mềm quản lý; cần làm P1 gọn và thử với 5–10 chủ trọ.
- Rủi ro: thao tác nhầm dữ liệu thật vì tưởng là game; lộ thông tin khách trọ; tin đăng lừa đảo; mâu thuẫn giữa offline và bản đồ online.
- Phụ thuộc: kết nối thanh toán QR và thiết bị ngoại vi (mảng B đánh giá); văn bản pháp lý về cư trú, PCCC, bảo vệ dữ liệu cá nhân cần xác minh.
- Nghiên cứu thị trường: `02-nghiep-vu/NGHIEN_CUU_THI_TRUONG.md`.
