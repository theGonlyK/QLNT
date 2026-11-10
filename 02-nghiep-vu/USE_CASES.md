# ĐẶC TẢ USE CASE VÀ LUỒNG GIAO DỊCH (USE CASES & TRANSACTION FLOWS)
## Dự án: QLNT — Nền tảng Quản lý Nhà trọ & Cư dân phong cách Game hóa

---

## 1. Quản lý cập nhật phiên bản (Document Change Log)

| Phiên bản | Ngày | Người thực hiện | Vai trò | Tóm tắt nội dung điều chỉnh | Trạng thái |
|---|---|---|---|---|---|
| **1.0** | 2026-11-07 | Agent BA | Senior BA | Khởi tạo tài liệu đặc tả Use Case chi tiết:<br>- Tổng hợp danh mục 26 Use Case (UC) phân theo 8 phân hệ.<br>- Đặc tả chi tiết 8 Use Case cốt lõi kèm luồng giao dịch (Transaction Flow giữa UI ↔ Core Domain ↔ Game Renderer).<br>- Quy định rõ điều kiện tiên quyết, hậu điều kiện và luồng ngoại lệ. | Đã duyệt |

---

## 2. Danh mục Use Case tổng thể (Use Case Catalog)

| Mã UC | Tên Use Case | Actor chính | Actor phụ / Hệ thống | Ưu tiên |
|---|---|---|---|---|
| **Phân hệ 1: Quản lý Không gian & Tòa nhà 3D (`UC-BLD`)** | | | | |
| `UC-BLD-01` | Cấu hình không gian tòa nhà & phòng trọ | Chủ nhà | Renderer 3D camera cố định | P1 |
| `UC-BLD-02` | Xem tổng quan "Phòng quản lý ảo" | Chủ nhà | Renderer 3D camera cố định | P1 |
| `UC-BLD-03` | Chuyển đổi giao diện Game ↔ Bảng danh sách | Chủ nhà, Khách | Presentation Adapter | P1 |
| **Phân hệ 2: Khách trọ & Thẻ nhân vật (`UC-TNT`)** | | | | |
| `UC-TNT-01` | Tiếp nhận khách mới & Sinh avatar phòng | Chủ nhà | Khách trọ | P1 |
| `UC-TNT-02` | Tra cứu & Cập nhật "Thẻ nhân vật" | Chủ nhà | Database | P1 |
| `UC-TNT-03` | Trả phòng & Lưu trữ hồ sơ lịch sử | Chủ nhà | Khách trọ | P1 |
| **Phân hệ 3: Thiết bị & Báo hỏng (`UC-DEV`)** | | | | |
| `UC-DEV-01` | Quản lý danh mục thiết bị bàn giao phòng | Chủ nhà | Khách trọ | P1 |
| `UC-DEV-02` | Khách/Chủ báo hỏng thiết bị (Bật chấm than đỏ) | Khách trọ, Chủ | Renderer 3D camera cố định | P1 |
| `UC-DEV-03` | Chủ nhà xác nhận hoàn tất sửa chữa (Tắt chấm than đỏ) | Chủ nhà | Khách trọ, Renderer | P1 |
| `UC-DEV-04` | Khách trọ tùy biến vị trí & skin đồ vật | Khách trọ | Renderer 3D camera cố định | P1 |
| **Phân hệ 4: Luồng đóng tiền trọ & Duyệt bill (`UC-PAY`)** | | | | |
| `UC-PAY-01` | Kích hoạt kỳ thu tiền & Avatar gõ cửa (Bật chấm than vàng) | Hệ thống (Cron) | Chủ nhà, Khách, Renderer | P1 |
| `UC-PAY-02` | Khách nộp bill ảnh chuyển khoản & Avatar đi giao tiền | Khách trọ | Chủ nhà, Renderer | P1 |
| `UC-PAY-03` | Chủ nhà kiểm tra & Duyệt bill (Tắt chấm than vàng, cộng điểm) | Chủ nhà | Khách trọ, Renderer | P1 |
| `UC-PAY-04` | Đối soát tự động qua VietQR động (Bản Trả phí) | Khách trọ | Ngân hàng / Webhook | P3 |
| **Phân hệ 5: Gamification, Điểm thưởng & Minigame (`UC-GAM`)** | | | | |
| `UC-GAM-01` | Hệ thống tự động tính thưởng/trừ điểm hạn nộp tiền | Hệ thống | Khách trọ | P1 |
| `UC-GAM-02` | Đổi quà, skin avatar/vũ khí, voucher từ Shop điểm | Khách trọ | Chủ nhà (duyệt voucher) | P1 |
| `UC-GAM-03` | Mua "Sao uy tín" tặng chủ nhà trọ | Khách trọ | Chủ nhà, Bản đồ | P1 |
| `UC-GAM-04` | Chơi minigame săn chuột, gián bằng vật dụng gia đình | Khách trọ, Chủ | Renderer 3D camera cố định | P1 |
| `UC-GAM-05` | Chế độ xả giận đập phá & NPC lao công dọn dẹp | Khách trọ, Chủ | Renderer 3D camera cố định | P1 |
| **Phân hệ 6: Mạng lưới Sale trọ nội bộ (`UC-SAL`)** | | | | |
| `UC-SAL-01` | Tạo tài khoản & Cấp thời hạn cho Sale trọ | Chủ nhà | Sale trọ | P2 |
| `UC-SAL-02` | Avatar Sale tham quan khuôn viên & Xem dữ liệu phòng trống | Sale trọ | Renderer 3D camera cố định | P2 |
| `UC-SAL-03` | Sale gắn bài đăng quảng bá vào phòng trống | Sale trọ | Chủ nhà | P2 |
| **Phân hệ 7: Khách vãng lai & Bản đồ khu phố ảo (`UC-GST`)** | | | | |
| `UC-GST-01` | Khách vãng lai xem phòng trống & Đặt lịch hẹn | Khách vãng lai | Chủ nhà, Sale | P2 |
| `UC-GST-02` | Dạo chơi & Lọc phòng trên Bản đồ khu phố Hà Nội | Khách vãng lai | Renderer 3D camera cố định | P2 |
| **Phân hệ 8: Cổng dịch vụ công & Tiện ích QR (`UC-PUB`)** | | | | |
| `UC-PUB-01` | Cán bộ quét QR tủ điện/nước nhập chỉ số công tơ | Cán bộ Điện/Nước | Chủ nhà, Khách trọ | P2 |
| `UC-PUB-02` | Công an khu vực quét QR tra cứu an ninh & Đăng thông báo | Công an khu vực | Chủ nhà, Cư dân trọ | P2 |

---

## 3. Đặc tả chi tiết Use Case & Luồng giao dịch cốt lõi

### `UC-PAY-01`: Kích hoạt kỳ thu tiền & Diễn hoạt Avatar gõ cửa (Bật chấm than vàng)
- **Actor chính:** Hệ thống (System Scheduler) hoặc Chủ trọ bấm kích hoạt thủ công.
- **Actor phụ:** Khách trọ, Game Renderer.
- **Tiền điều kiện:** Phòng ở trạng thái `ĐANG_THUÊ` và có hợp đồng còn hiệu lực.
- **Hậu điều kiện:**
  - Hóa đơn tháng được tạo với trạng thái `CHỜ_THANH_TOÁN`.
  - Icon chấm than vàng hiển thị nhấp nháy trước cửa phòng trên sơ đồ game.
  - Avatar chủ nhà hoàn thành hoạt ảnh đi gõ cửa các phòng.

#### Luồng giao dịch chính (Main Flow):
1. Đến ngày cấu hình kỳ thu tiền (hoặc chủ nhà bấm nút "Phát thông báo thu tiền tháng này" tại Phòng quản lý).
2. Tầng Core tạo bản ghi `Invoice` cho từng phòng với trạng thái `UNPAID` (tiền phòng + tiền điện nước + tiền dịch vụ).
3. Tầng Core phát sự kiện `EVT_PAYMENT_DUE(roomId, invoiceId)`.
4. Renderer gọi lệnh `setRoomPaymentAlert(roomId, true)`: Hiển thị icon **chấm than vàng** nhấp nháy trên cánh cửa phòng.
5. Renderer gọi lệnh `moveAvatar(landlordAvatarId, doorPosition)`: Avatar chủ nhà bước đến đứng trước cửa phòng.
6. Renderer gọi lệnh `playAvatarAction('KNOCK_DOOR')`: Avatar giơ tay gõ cửa, xuất hiện bong bóng thoại nhỏ *"Đến kỳ tiền phòng rồi bạn nhé! 🛎️"*.
7. Hệ thống gửi thông báo đẩy (push notification) đến điện thoại của khách thuê kèm chi tiết hóa đơn.

---

### `UC-PAY-02`: Khách nộp bill ảnh & Diễn hoạt Avatar đi giao tiền
- **Actor chính:** Khách trọ.
- **Actor phụ:** Chủ nhà, Game Renderer.
- **Màn hình liên quan:** Màn hình "Nhiệm vụ đóng tiền trọ" (`SCR-TNT-PAY`).
- **Tiền điều kiện:** Hóa đơn phòng đang ở trạng thái `CHỜ_THANH_TOÁN`.

#### Luồng giao dịch chính (Main Flow):
1. Khách trọ đăng nhập app, thấy chấm than vàng trên cửa phòng mình và danh sách nhiệm vụ nổi bật: *"Nhiệm vụ: Đóng tiền trọ tháng X"*.
2. Khách chọn nhiệm vụ, xem thông tin số tiền và số tài khoản chủ nhà. Khách chuyển khoản từ app ngân hàng cá nhân, sau đó tải ảnh chụp biên lai giao dịch thành công lên hệ thống.
3. Khách bấm nút **"Xác nhận nộp tiền"**.
4. Tầng Core tải ảnh bill lên Object Storage, cập nhật hóa đơn sang trạng thái `CHỜ_DUYỆT` (`PENDING_APPROVAL`), lưu thời gian nộp để tính điểm thưởng.
5. Tầng Core phát sự kiện `EVT_TENANT_SUBMIT_PAYMENT(tenantId, landlordId)`.
6. Renderer gọi lệnh `moveAvatar(tenantAvatarId, landlordOfficePos)`: Avatar khách cầm phong bì/xấp tiền đi từ phòng mình đến phòng quản lý/chỗ đứng của avatar chủ nhà.
7. Diễn hoạt hành động cúi chào và trao tiền (`PAY_MONEY`).
8. Cửa phòng **vẫn giữ icon chấm than vàng** (chờ chủ duyệt).
9. Hệ thống gửi thông báo đẩy đến app của chủ nhà: *"Phòng [Số phòng] vừa nộp bill chuyển khoản, vui lòng kiểm tra và duyệt!"*.

---

### `UC-PAY-03`: Chủ nhà kiểm tra & Duyệt nộp tiền (Tắt chấm than vàng, cộng điểm)
- **Actor chính:** Chủ nhà.
- **Actor phụ:** Khách trọ, Game Renderer.
- **Màn hình liên quan:** Popup "Duyệt hóa đơn phòng [X]" (`SCR-LL-APPROVE-PAY`).

#### Luồng giao dịch chính (Main Flow):
1. Chủ nhà mở app, nhấp vào thông báo hoặc click vào phòng đang có bill chờ duyệt.
2. Màn hình hiển thị ảnh chụp bill rõ nét. Chủ nhà kiểm tra tài khoản ngân hàng thực tế thấy tiền đã vào đúng số tiền.
3. Chủ nhà bấm nút **"Xác nhận đã nhận đủ tiền"**.
4. Tầng Core cập nhật hóa đơn sang trạng thái `ĐÃ_THANH_TOÁN` (`PAID`).
5. Tính toán điểm thưởng:
   - Nếu nộp trước hạn: Cộng `+100 điểm thưởng`.
   - Nếu nộp đúng hạn: Cộng `+50 điểm thưởng`.
   - Nếu nộp trễ hạn: Trừ điểm theo số ngày trễ (`-10 điểm/ngày`).
6. Core phát lệnh `setRoomPaymentAlert(roomId, false)`: **Icon chấm than vàng ở cửa phòng lập tức biến mất**.
7. Renderer hiển thị hiệu ứng sao lấp lánh trên đầu avatar khách kèm số điểm cộng `+50 Điểm thưởng! ⭐`.
8. Hệ thống gửi thông báo đến khách trọ: *"Chủ nhà đã duyệt thanh toán thành công! Bạn nhận được +50 điểm thưởng."*

#### Luồng ngoại lệ (Alternative Flow — Từ chối bill):
- Nếu tiền chưa về hoặc ảnh bill sai, chủ nhà bấm "Từ chối", nhập lý do.
- Hóa đơn quay về trạng thái `CHỜ_THANH_TOÁN`. Icon chấm than vàng tiếp tục giữ nguyên. App khách nhận thông báo nộp lại bill.

---

### `UC-DEV-02` & `UC-DEV-03`: Báo hỏng thiết bị & Xác nhận sửa chữa
- **Actor:** Khách trọ, Chủ nhà, Game Renderer.
- **Màn hình liên quan:** Màn hình "Danh mục thiết bị phòng" (`SCR-ROOM-DEVICES`).

#### Luồng giao dịch chính:
1. **Báo hỏng (`UC-DEV-02`):**
   - Khách trọ hoặc chủ trọ nhấp vào phòng, chọn thiết bị hỏng (VD: Máy lạnh).
   - Chọn "Báo hỏng", nhập mô tả lỗi (kèm tùy chọn chụp ảnh).
   - Bấm "Gửi báo hỏng" → Tầng Core cập nhật thiết bị sang trạng thái `BROKEN`.
   - Renderer gọi `setDeviceBrokenAlert(deviceId, true)`: Xuất hiện icon **chấm than đỏ** nhấp nháy trực tiếp trên hình ảnh chiếc máy lạnh trong phòng.
   - Chủ nhà nhận thông báo sự cố đỏ.
2. **Nghiệm thu sửa chữa (`UC-DEV-03`):**
   - Thợ sửa chữa hoàn tất tại phòng thực tế.
   - Chủ nhà vào app, mở thiết bị đang báo hỏng, bấm nút **"Xác nhận đã sửa chữa xong"** (nhập chi phí sửa chữa nếu có).
   - Hệ thống cập nhật trạng thái thiết bị về `NORMAL`.
   - Renderer gọi `setDeviceBrokenAlert(deviceId, false)`: **Icon chấm than đỏ lập tức biến mất**.
   - Hệ thống tự động ghi nhật ký sửa chữa vào bảng lịch sử thiết bị gắn với phòng và khách thuê.

---

### `UC-GAM-02` & `UC-GAM-03`: Đổi quà từ Shop & Mua Sao tặng chủ nhà
- **Actor:** Khách trọ, Chủ nhà.
- **Màn hình liên quan:** Màn hình "Cửa hàng đổi thưởng" (`SCR-REWARD-SHOP`).

#### Luồng giao dịch chính:
1. **Đổi quà / Skin đồ vật / Vũ khí (`UC-GAM-02`):**
   - Khách mở Shop, xem số dư điểm thưởng tích lũy.
   - Chọn vật phẩm: Skin chảo vàng, chổi phép thuật, thảm vintage, hoặc voucher giảm tiền thuê kỳ sau.
   - Bấm "Đổi ngay" → Hệ thống trừ điểm tương ứng trong ví.
   - Renderer lập tức cập nhật giao diện phòng hoặc trang bị vũ khí mới cho avatar.
2. **Mua "Sao uy tín" tặng chủ nhà (`UC-GAM-03`):**
   - Khách trọ chọn mục "Tặng sao cho Chủ trọ" (100 điểm = 1 Ngôi sao uy tín ⭐).
   - Khách bấm tặng kèm lời nhắn nhận xét dịch vụ.
   - Hệ thống trừ điểm của khách, cộng `+1` vào tổng điểm uy tín của chủ trọ.
   - Diễn hoạt: Avatar khách bắn tim/tung sao về phía phòng quản lý.
   - Thứ hạng và số sao của nhà trọ trên Bản đồ khu phố Hà Nội tự động tăng lên.

---

### `UC-SAL-02`: Avatar Sale tham quan khuôn viên & Xem dữ liệu phòng trống
- **Actor:** Sale trọ.
- **Tiền điều kiện:** Tài khoản Sale còn thời hạn hiệu lực do chủ trọ cấp.

#### Luồng giao dịch & Ranh giới bảo mật:
1. Sale đăng nhập tài khoản → Hệ thống sinh avatar Sale xuất hiện ở cổng khu trọ.
2. Sale điều khiển avatar đi lại trong sân chung, cầu thang và hành lang.
3. **Thao tác vào phòng trống:**
   - Sale click vào một phòng đang ở trạng thái `CÒN_TRỐNG`.
   - Hệ thống kiểm tra hợp lệ → Avatar Sale bước vào trong phòng.
   - Màn hình hiển thị cửa sổ thông tin tư vấn: Ảnh chụp phòng góc rộng, diện tích m², danh sách đồ đạc sẵn có, giá thuê, tiền cọc và số sao đánh giá cũ.
   - Sale có thể copy link hoặc gắn link bài viết chào phòng của mình.
4. **Xử lý vi phạm khi cố tình vào phòng có khách (`NT-07`):**
   - Sale click vào phòng đang ở trạng thái `ĐANG_THUÊ`.
   - **Hệ thống chặn cứng:** Avatar Sale bị dội lại trước cửa phòng, cánh cửa hiện icon ổ khóa đỏ 🔒.
   - Xuất hiện cảnh báo trên màn hình Sale: *"Phòng đang có cư dân sinh sống! Quyền riêng tư được bảo vệ tuyệt đối."*
   - Tuyệt đối không hiển thị thông tin bên trong phòng.

---

### `UC-PUB-01`: Cán bộ Điện/Nước quét QR nhập chỉ số công tơ
- **Actor:** Cán bộ Điện lực / Nhân viên cấp nước.
- **Màn hình liên quan:** Cổng Web tức thì "Ghi chỉ số điện nước" (`SCR-QR-UTILITY`).

#### Luồng giao dịch chính:
1. Cán bộ đến tủ công tơ điện/nước của nhà trọ, dùng camera điện thoại hoặc Zalo quét mã QR gắn tại tủ.
2. Trình duyệt mở ngay trang ghi số không cần đăng nhập (xác thực qua token gắn trong mã QR tĩnh của tủ).
3. Màn hình hiển thị danh sách toàn bộ các phòng kèm chỉ số tháng trước. Cán bộ nhập chỉ số mới cho từng phòng (hoặc chụp ảnh công tơ đính kèm đối chứng).
4. Bấm nút **"Gửi chỉ số tháng này"**.
5. Hệ thống tự động tính: `Sản lượng tiêu thụ = Chỉ số mới - Chỉ số cũ`.
6. Hệ thống nhân với đơn giá điện/nước của nhà trọ → Tự động điền số tiền điện nước vào bản ghi `Invoice` của từng phòng.
7. Bắn thông báo đến chủ trọ: *"Cán bộ đã cập nhật chỉ số điện nước tháng này thành công!"*.

---

### `UC-PUB-02`: Công an khu vực quét QR tra cứu an ninh & Đăng thông báo
- **Actor:** Cán bộ Công an khu vực.
- **Màn hình liên quan:** Cổng an ninh địa bàn "Tra cứu an ninh & PCCC" (`SCR-QR-POLICE`).

#### Luồng giao dịch chính:
1. Cán bộ Công an quét mã QR an ninh dán tại cổng nhà trọ.
2. Cán bộ nhập mã PIN/mã định danh công tác được cấp trước đó để mở khóa thông tin hành chính.
3. Hệ thống hiển thị danh sách cư dân thực tế đang ở tại cơ sở: Họ và tên, Ngày sinh, Số CCCD, Quê quán, Phòng đang ở, Ngày bắt đầu ở (phục vụ đối soát tạm trú/VNeID).
4. Cán bộ có thể tích chọn biên bản kiểm tra định kỳ an toàn PCCC (bình chữa cháy, lối thoát hiểm).
5. Cán bộ soạn thông báo an ninh phòng ngừa tội phạm/PCCC và bấm "Gửi thông báo".
6. Thông báo lập tức xuất hiện trên bảng tin trung tâm của ứng dụng, hiển thị trực tiếp đến toàn bộ cư dân và chủ trọ.
