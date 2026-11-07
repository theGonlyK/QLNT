# TÀI LIỆU YÊU CẦU NGHIỆP VỤ (BRD — BUSINESS REQUIREMENTS DOCUMENT)
## Dự án: QLNT — Nền tảng Quản lý Nhà trọ & Cư dân phong cách Game hóa

---

## 1. Quản lý cập nhật phiên bản (Document Change Log)

| Phiên bản | Ngày | Người thực hiện | Vai trò | Tóm tắt nội dung điều chỉnh | Trạng thái |
|---|---|---|---|---|---|
| **1.0** | 2026-11-07 | Agent BA | Senior BA | Khởi tạo tài liệu BRD chính thức sau khi hoàn thành cổng Brief:<br>- Xác định tầm nhìn, bài toán kinh doanh và thị trường mục tiêu Hà Nội.<br>- Định nghĩa rõ các nền tảng triển khai (Web responsive, Mobile app qua Capacitor, Web-app tức thì qua QR, SaaS Multi-tenant).<br>- Bổ sung đầy đủ 6 phân khúc người dùng (Chủ trọ, Khách trọ, Sale trọ, Khách vãng lai tìm phòng, Cán bộ điện/nước, Công an khu vực).<br>- Chuẩn hóa các quy tắc nghiệp vụ cốt lõi, cơ chế gamification, lộ trình 3 giai đoạn (P1/P2/P3) và chỉ số đo lường thành công. | Đã duyệt |

---

## 2. Tổng quan dự án (Executive Summary & Product Vision)

- **Tên dự án:** QLNT (Quản lý Nhà trọ & Cư dân).
- **Tầm nhìn sản phẩm (Vision):** Xây dựng một nền tảng quản lý nhà trọ độc đáo, **mang lại trải nghiệm như đang chơi game mô phỏng quản lý (Simulation Game) hơn là một phần mềm quản trị khô khan**. 
  - Chủ nhà ngồi tại "Phòng quản lý ảo" để vận hành toàn bộ cơ sở phòng trọ, theo dõi sự cố và duyệt thanh toán.
  - Khách trọ tương tác qua avatar, thực hiện các việc cần làm (đóng tiền, báo hỏng, giữ gìn vệ sinh) như các "nhiệm vụ game" để tích lũy điểm thưởng.
  - Người tìm trọ khám phá các phòng trống thông qua việc dạo chơi trên bản đồ khu phố ảo 2D/2.5D.
- **Thị trường mục tiêu ban đầu:** Thành phố Hà Nội (tập trung vào các khu vực tập trung đông sinh viên và người đi làm trẻ tuổi: Cầu Giấy, Đống Đa, Thanh Xuân, Hai Bà Trưng, Nam/Bắc Từ Liêm).
- **Nguyên tắc thiết kế tối thượng:** *"Game ở bề mặt, dữ liệu thật ở bên trong"* — Lớp game giúp trực quan hóa và tạo cảm xúc tương tác thú vị, nhưng dữ liệu pháp lý và tài chính luôn bảo toàn tính chính xác và an toàn tuyệt đối.

---

## 3. Vấn đề thực tế và Mục tiêu kinh doanh (Problem Statement & Business Objectives)

### 3.1. Các vấn đề nhức nhối trong quản lý nhà trọ hiện nay
1. **Thu tiền trọ chậm trễ và tâm lý ngại đòi nợ:** Việc nhắc nợ qua tin nhắn/gặp mặt trực tiếp dễ gây căng thẳng, khó chịu trong mối quan hệ chủ - khách.
2. **Theo dõi sự cố và cơ sở vật chất rời rạc:** Việc báo hỏng đồ (điều hòa, bóng đèn, tủ lạnh...) chủ yếu qua Zalo/tin nhắn, dễ bị trôi tin, không có lịch sử bàn giao và thời gian xử lý rõ ràng.
3. **Phần mềm quản lý hiện tại khô khan, khó dùng:** Các công cụ phổ biến hiện nay thiết kế theo dạng bảng biểu kế toán/Excel, gây rào cản lớn với những chủ nhà trọ lớn tuổi hoặc người không thạo phần mềm.
4. **Phụ thuộc môi giới bên ngoài và tin đăng ảo:** Khách tìm trọ gặp nhiều bẫy "tin ảo/ảnh giả", trong khi chủ trọ mất nhiều phí hoa hồng môi giới mà không kiểm soát được thông tin truyền thông.
5. **Ghi chỉ số điện nước thủ công:** Mỗi tháng chủ nhà hoặc nhân viên điện nước phải đi từng phòng/tủ công tơ chép tay số điện nước rồi gõ lại vào máy, dễ sai sót và mất công.

### 3.2. Mục tiêu kinh doanh (Business Objectives)
- **Giảm 60% tỷ lệ đóng tiền trễ hạn:** Nhờ cơ chế nhắc nợ thân thiện (avatar gõ cửa, chấm than vàng) kết hợp động lực thưởng điểm nhiệm vụ.
- **Minh bạch 100% nhật ký tài sản:** Mọi sự cố hỏng hóc và thay thế thiết bị đều được lưu vết chi tiết theo phòng và từng đời khách thuê.
- **Rút ngắn chu kỳ lấp đầy phòng trống:** Kết nối trực tiếp người tìm trọ qua bản đồ khu phố và mạng lưới Sale trọ nội bộ, duy trì tỷ lệ lấp đầy phòng đạt trên 95%.
- **Tự động hóa số liệu điện nước và an ninh địa bàn:** Đơn vị hỗ trợ (điện lực/nước/công an) tương tác trực tiếp qua cổng QR, giảm 80% thời gian chốt số và đối soát tạm trú.

---

## 4. Nền tảng triển khai (Delivery & Deployment Platforms)

Hệ thống được thiết kế đa nền tảng linh hoạt, tiếp cận đúng theo hành vi của từng đối tượng người dùng:

1. **Giao diện Web Responsive (Web / Mobile Web):**
   - Hoạt động mượt mà trên trình duyệt máy tính và điện thoại thông minh (Chrome, Safari, Zalo in-app browser).
   - Dành cho chủ nhà trọ ngồi quản lý tập trung và khách vãng lai lướt xem phòng mà không cần cài app.
2. **Ứng dụng di động Native (Mobile App — Android & iOS):**
   - Đóng gói bằng **Capacitor/PWA** từ một codebase duy nhất.
   - Hỗ trợ thông báo đẩy (Push Notification) tức thì, gọi camera chụp ảnh biên lai chuyển khoản và truy cập mượt mà trên smartphone.
3. **Cổng Web-App tức thì qua mã QR (Instant QR Web Portal):**
   - Cho phép người dùng quét mã QR bằng camera điện thoại hoặc Zalo để mở ngay màn hình chức năng chuyên biệt trong 1 giây mà **không cần cài đặt app hay tạo tài khoản rườm rà**.
   - Ứng dụng: Cán bộ điện lực quét QR nhập số điện/nước; Công an khu vực quét QR tra cứu an ninh; Người tìm trọ quét QR trước cửa xem thông số phòng trống.
4. **Mô hình kiến trúc đám mây SaaS Multi-tenant:**
   - Hệ thống dùng chung nền tảng và bản đồ khu phố, nhưng phân tách dữ liệu an toàn theo từng chủ nhà (`landlord_id`).
   - Hỗ trợ cả cơ chế **Local-First (Offline)** cho bản Miễn phí trên trình duyệt/máy cá nhân và **Cloud Realtime Sync** cho bản Trả phí.

---

## 5. Phân khúc người dùng & Chân dung các bên liên quan (Stakeholder Personas)

| Phân khúc | Đối tượng cụ thể | Điểm chạm (Touchpoint) | Nhu cầu cốt lõi trong hệ thống |
|---|---|---|---|
| **1. Chủ nhà trọ** | Cá nhân hoặc hộ kinh doanh sở hữu từ 5–50 phòng trọ | Web App / Mobile App | Quản lý tòa nhà tại một màn hình, theo dõi thiết bị báo hỏng (chấm than đỏ), duyệt tiền trọ thủ công/tự động, quản lý tài khoản Sale trọ. |
| **2. Khách trọ** | Sinh viên, người lao động trẻ đang thuê phòng | Mobile App / Web App | Xem hóa đơn, nhận nhiệm vụ đóng tiền trọ (chấm than vàng), nộp ảnh bill chuyển khoản, tích lũy điểm thưởng đổi quà/voucher, báo hỏng thiết bị, chơi minigame diệt chuột/xả giận. |
| **3. Sale trọ (Cộng tác viên)** | Môi giới trọ do chủ nhà ủy quyền có thời hạn | Web App / Mobile App | Đăng nhập avatar Sale tham quan khuôn viên và các phòng **đang trống** để lấy ảnh thật, diện tích, trang thiết bị đi mời chào; gắn bài đăng quảng bá; **bị cấm tuyệt đối vào phòng có khách**. |
| **4. Khách vãng lai / Người tìm phòng** | Người có nhu cầu tìm thuê trọ tại Hà Nội | Web / Quét QR cửa trọ / Bản đồ khu phố | Đăng nhập 1 lần hoặc dùng chế độ Khách; dạo xem phòng trống, xem đánh giá sao uy tín thật của chủ nhà; hẹn lịch xem phòng. **Tự động chuyển thành Khách trọ khi ký hợp đồng**. |
| **5. Đơn vị dịch vụ kỹ thuật (Điện/Nước)** | Cán bộ điện lực, thợ ghi đồng hồ nước, thợ sửa chữa | Quét mã QR tại tủ điện/công tơ nước | Quét QR vào web-app tức thì; nhập nhanh chỉ số điện nước định kỳ hoặc cập nhật biên bản nghiệm thu sửa chữa thiết bị. |
| **6. Cơ quan chức năng địa phương** | Cảnh sát khu vực, cán bộ kiểm tra PCCC phường/xã | Quét mã QR an ninh tại cổng nhà trọ | Quét mã xác thực; tra cứu danh sách nhân khẩu lưu trú thực tế phục vụ rà soát tạm trú/VNeID; kiểm tra an toàn PCCC; gửi thông báo an ninh trật tự đến cư dân. |
| **7. Quản trị hệ thống (Admin)** | Đội ngũ vận hành nền tảng SaaS QLNT | Web Admin Portal | Quản trị các tenant chủ trọ, duyệt tin đăng bản đồ khu phố, kiểm duyệt báo cáo tin sai sự thật, duy trì hạ tầng. |

---

## 6. Quy tắc nghiệp vụ cốt lõi (Core Business Rules)

- **BR-01 (Hai lớp độc lập):** Lớp game và Lớp dữ liệu thật phân tách tuyệt đối. Thao tác game (đập phá đồ, săn chuột gián) không bao giờ làm biến đổi dữ liệu tài chính hoặc số lượng tài sản thật.
- **BR-02 (Game phản ánh dữ liệu thật):** Mọi thay đổi dữ liệu thật đều được chuyển hóa thành diễn hoạt tương ứng trong thế giới game (Ví dụ: Tiền nộp thành công → Avatar đi gặp chủ nhà giao tiền).
- **BR-03 (Bảo vệ riêng tư & Tâm lý tích cực — `NT-05`):** Không bao giờ hiển thị chỉ số cảm xúc tiêu cực, không "bêu tên" hoặc chấm điểm xấu đối với cá nhân khách trọ. Trạng thái avatar chỉ gắn với sự việc khách quan.
- **BR-04 (Bảo mật bản đồ công khai — `NT-06`):** Trên bản đồ khu phố, người ngoài chỉ nhìn thấy thông tin phòng còn trống và thông tin liên hệ của chủ trọ. Tuyệt đối không để lộ danh tính hay số lượng phòng đang có người ở.
- **BR-05 (Ranh giới bảo mật của Sale trọ — `NT-07`):** Avatar Sale chỉ được phép đi lại ở khuôn viên chung và bước vào phòng đang trống. Hệ thống khóa cứng quyền truy cập vào phòng đang có khách ở.
- **BR-06 (Quy ước thị giác màu cảnh báo — `NT-08`):**
  - **Chấm than đỏ:** Dành riêng cho sự cố hỏng hóc thiết bị/phòng trọ.
  - **Chấm than vàng:** Dành riêng cho nhắc nhở kỳ thanh toán tiền trọ và hạn nhiệm vụ tài chính.
- **BR-07 (Duyệt nộp tiền trọ bản Miễn phí):** Khách gửi ảnh chụp bill chuyển khoản → Avatar khách tự đi giao tiền → Cửa phòng vẫn giữ chấm than vàng cho đến khi **Chủ nhà bấm nút "Xác nhận đã nhận đủ tiền"** trên app thì nhiệm vụ mới hoàn tất.
- **BR-08 (Kinh tế điểm thưởng Gamification):** Nộp tiền sớm/đúng hạn được cộng điểm thưởng; nộp trễ hạn bị trừ điểm thưởng nhiệm vụ. Điểm thưởng có giá trị quy đổi trong hệ sinh thái game (đổi skin, quà tặng, voucher giảm giá hoặc tặng sao uy tín cho chủ nhà).

---

## 7. Mô hình kinh doanh & Doanh thu (Business & Monetization Model)

Hệ thống áp dụng mô hình **Freemium** linh hoạt:
1. **Gói Miễn phí (Free Tier):**
   - Phù hợp với chủ trọ quy mô nhỏ (≤ 10-15 phòng).
   - Sử dụng đầy đủ trải nghiệm game 2D, quản lý thiết bị, quy trình nộp tiền thủ công qua ảnh chụp bill và tính điểm thưởng.
   - Dữ liệu chạy offline hoặc lưu trữ đám mây cơ bản.
2. **Gói Trả phí (Pro/Premium Tier):**
   - Tự động hóa hoàn toàn: Đối soát thanh toán tự động qua VietQR động liên kết ngân hàng (tiền về tự khớp lệnh, không cần chủ nhà kiểm tra tài khoản).
   - Không giới hạn số phòng, đồng bộ đám mây đa thiết bị thời gian thực.
   - Tin đăng nổi bật (VIP) trên bản đồ khu phố Hà Nội.
   - Kết nối thiết bị ngoại vi thông minh (khóa vân tay, camera cổng, cảm biến báo cháy).
3. **Doanh thu bổ sung (Add-on Services):**
   - Mua các gói đồ trang trí cao cấp, skin avatar/vũ khí đặc biệt.
   - Chiết khấu dịch vụ giới thiệu kết nối phòng thành công.

---

## 8. Lộ trình phát triển sản phẩm (Phased Roadmap)

```
[ P1: MVP Cốt lõi & Đồ họa 2D ] ---> [ P2: Kết nối Người thuê, Sale & Bản đồ ] ---> [ P3: Tự động hóa & IoT ]
```

- **P1 — Bản thử cảm giác game & Nghiệp vụ cơ bản (Hiện tại):**
  - Dựng tòa nhà dạng 2D phẳng / isometric tilemap đơn giản.
  - Avatar cư dân, thẻ nhân vật, quản lý phòng và thiết bị.
  - Báo hỏng thiết bị (chấm than đỏ) và nhật ký lịch sử.
  - Luồng đóng tiền thủ công: Avatar chủ gõ cửa, chấm than vàng, nộp bill ảnh, avatar đi trả tiền, chủ duyệt tiền.
  - Hệ sinh thái điểm thưởng (đổi quà, skin, vũ khí, voucher, sao uy tín) và minigame săn chuột/gián, xả giận.
  - Thử nghiệm với 5–10 chủ nhà trọ tại Hà Nội.
- **P2 — Kết nối người thuê & Mở rộng cộng tác:**
  - Bản đồ khu phố Hà Nội 2.5D hiển thị phòng trống và sao uy tín chủ nhà.
  - Phân quyền vai trò Sale trọ xem phòng trống có thời hạn và gắn bài đăng.
  - Cổng QR Web-app cho Cán bộ điện/nước nhập số và Công an khu vực kiểm tra an ninh.
  - Khách vãng lai xem phòng và luồng chuyển trọ tự động.
- **P3 — Trả phí, Tự động hóa & Nâng cấp 3D:**
  - Nâng cấp đồ họa lên 2.5D/3D (Three.js / WebGL) qua interface `IGameRenderer` đã chuẩn hóa.
  - Tích hợp đối soát thanh toán tự động qua ngân hàng.
  - Kết nối cảm biến IoT (báo cháy, khóa thông minh).

---

## 9. Tiêu chí thành công & Chỉ số đo lường (Success Metrics & KPIs)

1. **Hiệu quả nghiệp vụ:**
   - 90% các khoản tiền trọ được giải quyết và duyệt trong vòng 3 ngày kể từ kỳ báo tiền.
   - 100% sự cố hỏng hóc có thời gian xử lý được ghi vết và cập nhật minh bạch.
2. **Trải nghiệm người dùng (Engagement):**
   - Tỷ lệ cư dân mở ứng dụng tương tác (làm nhiệm vụ, chơi minigame, đổi điểm) đạt ít nhất 3 lần/tuần.
   - Tỷ lệ hài lòng của chủ nhà về mức độ tiện lợi đạt trên 85%.
3. **Hiệu năng kỹ thuật:**
   - Ứng dụng chạy mượt mà 60 FPS trên 98% thiết bị di động thử nghiệm.
   - Thời gian quét mã QR mở web-app nhập số điện/nước hoặc tra cứu an ninh dưới 2 giây.
