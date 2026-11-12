# Kế hoạch Kiểm thử, Ma trận Truy vết Test Case P1 & Quản trị Rủi ro Dữ liệu / Thanh toán — QLNT

- **Dự án:** Quản lý nhà trọ (QLNT)
- **Thực hiện:** QA Lead & QA Agent (Hoàn thành các task Sprint 1 của QA)
- **Ngày ban hành:** 2026-11-12
- **Trạng thái:** `Hoàn thành trong Sprint 1`
- **Căn cứ tham chiếu:**
  - `02-nghiep-vu/MA_TRAN_TRUY_VET_P1.md` (21 Tiêu chí nghiệm thu `AC-01` $\rightarrow$ `AC-21`)
  - `02-nghiep-vu/DAC_TA_SO_QUAN_LY_AO_SINGLE_PAGE_VA_RENDERER.md` (`QLNT-D010..D013`)
  - `04-van-hanh/HA_TANG_VA_VAN_HANH_HE_THONG.md` & `04-van-hanh/QUALITY_AND_RELEASE.md` (`QLNT-D014`)

---

## 1. Ma trận Truy vết từ Yêu cầu P1 & Tiêu chí Nghiệm thu (`AC-01..AC-21`) sang Kịch bản Kiểm thử (`Test Cases`)

| Mã TC | Ánh xạ AC & Yêu cầu | Phân hệ / Tính năng | Nội dung Kịch bản Kiểm thử (Test Scenario) | Kết quả Kỳ vọng (Expected Result) | Mức ưu tiên |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **TC-P1-01** | `AC-01`, `AC-02` (`R-01`, `F01`) | Thiết lập Tòa nhà, Tầng & Phòng | Chủ nhà tạo tòa nhà mới, thêm tầng và phòng (trống / có người ở), kiểm tra hiển thị trên cảnh 3D Isometric và Mặt bằng tầng 2D trong Sổ F04. | Dữ liệu lưu thành công vào `IndexedDB`/DB; cảnh 3D và mặt bằng 2D hiển thị đúng số tầng, số phòng và màu trạng thái. | **Cao** |
| **TC-P1-02** | `AC-03`, `AC-04` (`R-02`, `F02`) | Hồ sơ Khách thuê & Hợp đồng (Trang 1 Sổ F04) | Thêm/sửa thông tin khách thuê (Họ tên, SĐT, CCCD, Biển số xe) trực tiếp trên **Trang 1 (Single-Page F04)**. | Lưu đúng theo `landlord_id`; tự động ghi nhật ký vào Trang 3 (`NT-03`). | **Cao** |
| **TC-P1-03** | `AC-05`, `AC-06` (`R-03`, `R-04`) | Danh mục Thiết bị & Báo hỏng (Trang 2 Sổ F04) | Khách thuê gửi báo hỏng *Điều hòa*; kiểm tra cảnh báo và thao tác chủ nhà xác nhận đã sửa trên **Trang 2 (Single-Page F04)**. | Khi báo hỏng: hiện **Chấm than đỏ (`!`)** liên tục tại thiết bị & cửa phòng. Khi chủ nhà chuyển về `Bình thường`: tắt chấm than đỏ ngay và ghi vết vào Trang 3. | **Cao** |
| **TC-P1-04** | `AC-07`, `AC-08` (`R-05`, `QLNT-D005`) | Phát thông báo Thu tiền & Nộp ảnh Bill | Chủ nhà nhập chỉ số điện/nước mới tại Trang 1 $\rightarrow$ phát thông báo $\rightarrow$ khách nộp ảnh bill chuyển khoản (`< 300KB`). | Hiện **Chấm than vàng (`!`)** ở cửa phòng & mặt bằng 2D; hoạt ảnh Avatar chủ gõ cửa / Avatar khách nộp tiền chạy đúng; ảnh bill lưu vào `Private Bucket`. | **Cao** |
| **TC-P1-05** | `AC-09`, `AC-10` (`R-05`, `QLNT-D006`) | Chủ nhà Duyệt Bill & Cộng/Trừ Điểm thưởng | Chủ nhà mở Trang 1 Sổ F04, xem ảnh bill qua `Signed URL` và bấm **`[✓ Xác nhận đã nhận đủ tiền]`** (trường hợp đúng hạn & trễ hạn). | Đóng nhiệm vụ thu tiền, tắt chấm than vàng, cộng điểm nếu đúng hạn / trừ điểm nếu trễ hạn, ghi vết bất biến vào Trang 3. | **Cao** |
| **TC-P1-06** | `AC-11`, `AC-12` (`R-06`, `NT-06`, `F03`) | Phân quyền Sale trọ có thời hạn | Cấp quyền cho tài khoản Sale trọ $\rightarrow$ Sale đăng nhập xem tòa nhà và thử bấm vào phòng đang có khách thuê. | Sale có avatar riêng, chỉ vào được khuôn viên và **phòng trống (`EMPTY`)**, gắn được link bài đăng; bị chặn tuyệt đối (cả UI & API `403 Forbidden`) khi truy cập phòng đang có khách. | **Cao** |
| **TC-P1-07** | `AC-13`, `AC-14` (`R-07`, `R-08`, `NT-01`) | Ranh giới Lớp Game (Đập phá/Minigame) & Dữ liệu thật | Khách chơi minigame bắt chuột/gián hoặc đập phá đồ vật ảo trong phòng 3D, sau đó kiểm tra lại Trang 1-2-3 trong Sổ F04. | Chỉ thay đổi hiệu ứng đồ vật trong phiên game; **dữ liệu thật** (tiền phòng, hợp đồng, trạng thái thiết bị thật trong DB) giữ nguyên 100%. | **Cao** |
| **TC-P1-08** | `AC-15`, `AC-16` (`R-11..R-14`, `F07`) | Đổi điểm thưởng & Mua Sao uy tín tòa nhà | Khách dùng điểm thưởng đổi vật phẩm trang trí phòng, skin vũ khí minigame, voucher và mua Sao tặng chủ nhà. | Trừ điểm chính xác; vật phẩm/skin kích hoạt ngay; số Sao uy tín của tòa nhà tăng lên trên Bản đồ công khai (`F06`). | **Trung bình** |
| **TC-P1-09** | `AC-17`, `AC-18` (`R-09`, `NT-05`, `NT-06`) | Bản đồ Tìm phòng Công khai & Bảo vệ Riêng tư | Người tìm trọ mở bản đồ khu phố công khai (`F06`), xem thông tin tòa nhà và danh sách phòng. | Chỉ hiển thị **phòng trống** và số Sao uy tín; tuyệt đối không lộ tên/SĐT/CCCD khách đang thuê và không có bất kỳ nhãn cảm xúc tiêu cực nào gắn với cá nhân khách. | **Cao** |
| **TC-P1-10** | `AC-19` (`QLNT-D010..D013`, `F04`) | Chế độ Hiển thị **Single-Page** & Điều hướng Đóng/Mở 2 Cấp Sổ F04 | Trên màn hình dọc điện thoại (`360x800`), mở Sổ F04 $\rightarrow$ chọn tầng $\rightarrow$ chọn phòng P.201 $\rightarrow$ chuyển qua lại Trang 1, Trang 2, Trang 3 $\rightarrow$ bấm `[← Về mặt bằng tầng]` $\rightarrow$ bấm `[Đóng sổ về 3D]`. | Hiển thị đúng **từng trang đơn (Single-Page)** rõ nét, không tràn ngang; đóng cấp 1 về đúng mặt bằng tầng 2D; đóng cấp 2 gập sổ về đúng cảnh 3D. | **Cao** |
| **TC-P1-11** | `AC-20` (`QLNT-D011`, `NT-03`) | Chỉnh sửa trực tiếp (`In-place Edit`) & Nhật ký bất biến Trang 3 | Sửa chỉ số điện từ `1240` thành `1315`, sửa trạng thái thiết bị tại Trang 2, sau đó thử tìm cách xóa/sửa dòng log ở Trang 3. | Trang 1 & 2 cập nhật tức thì; Trang 3 tự động sinh dòng log mới ghi rõ thời gian, người sửa, giá trị cũ $\rightarrow$ mới; Trang 3 hoàn toàn `Read-only` (không thể sửa/xóa lịch sử). | **Cao** |
| **TC-P1-12** | `AC-21` (`R-15`, `R-16`, `QLNT-D014`) | Gói Miễn phí Offline & Tự động Hạ cấp Hiệu năng (`Auto-Fallback`) | (1) Ngắt mạng Internet và thao tác trên bản Miễn phí; (2) Giả lập tụt FPS `< 30` trên thiết bị yếu khi mở Sổ F04. | (1) App vẫn lưu/đọc mượt qua `IndexedDB`; (2) Khi `FPS < 30`, tự động phát `PERF_FPS_DROP` chuyển từ lật trang 3D sang **2D Slide-Card** mà không mất dữ liệu đang gõ. | **Cao** |

---

## 2. Danh mục Rủi ro Kiểm thử Trọng tâm: Dữ liệu, Riêng tư & Thanh toán (`QA Risk Matrix`)

| Nhóm rủi ro | Kịch bản lỗi nguy hiểm cần chặn (Negative / Edge Cases) | Biện pháp kiểm thử bắt buộc của QA |
| :--- | :--- | :--- |
| **1. Rủi ro Sai lệch Tiền trọ & Trạng thái Duyệt Bill** | • Nhập chỉ số điện/nước mới nhỏ hơn chỉ số cũ dẫn đến tiền âm.<br>• Khách bấm nộp bill liên tiếp nhiều lần (double-submit) hoặc chủ nhà bấm duyệt 2 lần gây cộng điểm thưởng nhân đôi. | • Kiểm thử biên (`Boundary Test`): chặn ngay khi `chỉ_số_mới < chỉ_số_cũ` (trừ khi tích chọn "Thay đồng hồ mới").<br>• Kiểm thử tính bất biến (`Idempotency`): khóa nút duyệt ngay sau lần bấm đầu tiên; 1 hóa đơn chỉ được cộng điểm thưởng tối đa 1 lần. |
| **2. Rủi ro Rò rỉ Dữ liệu Cá nhân & Đa Chủ trọ (`Multi-tenant Leak`)** | • Chủ trọ A đổi `roomId` trên URL/API để xem thông tin phòng của Chủ trọ B.<br>• Sale trọ hoặc người lạ đoán link ảnh để xem ảnh CCCD / ảnh bill chuyển khoản của khách. | • Kiểm thử chéo 2 tài khoản (`Tenant Isolation Test`) xác minh `Row-Level Security` chặn 100%.<br>• Kiểm thử truy cập trực tiếp URL ảnh trên Cloudflare R2 khi không có `Signed Token` hoặc sau khi quá 15 phút $\rightarrow$ bắt buộc trả về `403 Access Denied`. |
| **3. Rủi ro Mất đồng bộ giữa Cảnh 3D và Sổ F04 (`State Desync`)** | • Chủ nhà đã bấm duyệt bill hoặc sửa xong thiết bị trong Sổ F04 nhưng khi đóng sổ ra cảnh 3D thì chấm than vàng/đỏ vẫn còn treo trên cửa phòng. | • Kiểm thử chuỗi sự kiện `Event Bus`: ngay sau khi `closeRoomDetailToFloorMap` và `closeLedgerBookTo3DScene`, cảnh 3D phải đồng bộ 100% với trạng thái mới nhất trong `Headless Domain Core`. |
