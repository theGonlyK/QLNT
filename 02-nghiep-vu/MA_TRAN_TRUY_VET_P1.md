# MA TRẬN TRUY VẾT YÊU CẦU & DANH MỤC CHỨC NĂNG P1 (REQUIREMENTS TRACEABILITY MATRIX — RTM)
## Dự án: QLNT — Nền tảng Quản lý Nhà trọ & Cư dân phong cách Game hóa
## Giai đoạn: P1 — Bản thử cảm giác game (MVP Core)

---

## 1. Quản lý cập nhật phiên bản (Document Change Log)

| Phiên bản | Ngày | Người thực hiện | Vai trò | Tóm tắt nội dung điều chỉnh | Trạng thái |
|---|---|---|---|---|---|
| **1.0** | 2026-11-11 | Gemini (Antigravity) | BA Lead | Khởi tạo Ma trận truy vết yêu cầu (RTM) và Danh mục chức năng chi tiết cho giai đoạn P1 theo chỉ đạo của Chủ dự án. Chuẩn hóa liên kết từ Quyết định/BRD -> Yêu cầu (R) -> Chức năng (FDD) -> SRS -> Use Case -> Tiêu chí nghiệm thu (AC). | Đã lập (Dự thảo bàn giao) |

---

## 2. Mục tiêu và Phạm vi giai đoạn P1

- **Mục tiêu cốt lõi P1:** Kiểm chứng toàn diện cảm giác trải nghiệm "quản lý nhà trọ như chơi game" với nhóm 5–10 chủ trọ đầu tiên tại Hà Nội; vận hành trơn tru luồng nghiệp vụ thực tế (quản lý phòng, cư dân, đóng tiền trọ thủ công, quản lý thiết bị/báo hỏng, minigame giải trí).
- **Nguyên tắc kỹ thuật tối thượng:**
  - `NT-01`: Hai lớp độc lập — Lớp game chỉ hiển thị và phản ánh biến động dữ liệu thật, không trực tiếp thay đổi dữ liệu thật.
  - `NT-02`: Game phản ánh trung thực mọi thay đổi của dữ liệu thật.
  - `NT-04`: Đập phá chỉ áp dụng cho đồ vật, không tác động avatar người thật.
  - `NT-08`: Chấm than đỏ gắn với sự cố thiết bị; chấm than vàng gắn với nhắc đóng tiền trọ.
  - `QLNT-D008`: Đích đồ họa 3D camera isometric cố định. Giai đoạn P1 dựng renderer 3D đơn giản bằng hình khối/plane và sprite 2D trong không gian 3D.

---

## 3. Danh mục chức năng phạm vi P1 (Functional Breakdown for P1)

| Nhóm phân hệ | Mã chức năng | Tên chức năng chi tiết | Mô tả tóm tắt phạm vi P1 |
|---|---|---|---|
| **F01. Tòa nhà & Không gian** | `F01.1` | Dựng tòa nhà & phòng trọ 3D isometric | Dựng tòa nhà nhiều tầng, phòng, khuôn viên bằng hình khối/plane 2D trong không gian 3D camera cố định. |
| | `F01.2` | Phòng Quản lý ảo tập trung | Bàn làm việc ảo của chủ trọ, truy cập toàn bộ tác vụ quản trị tại một màn hình. |
| | `F01.3` | Chế độ xem danh sách bảng dự phòng | Chế độ chuyển đổi xem bảng biểu truyền thống cho người dùng không quen thao tác game. |
| **F02. Cư dân & Nhân vật** | `F02.1` | Tiếp nhận khách & Cấp avatar | Nhập thông tin khách thuê thật -> sinh avatar khách thuê tương ứng trong tòa nhà. |
| | `F02.2` | Quản lý Thẻ nhân vật & Hồ sơ | Xem thông tin hợp đồng, tiền phòng, trạng thái cư trú qua Thẻ nhân vật. |
| | `F02.3` | Hoạt ảnh nghiệp vụ cư dân | Diễn hoạt avatar khi nhận phòng, trả phòng, gia hạn hợp đồng. |
| **F03. Thiết bị & Báo hỏng** | `F03.1` | Bàn giao danh mục thiết bị | Quản lý thiết bị cố định (bắt buộc) và bổ sung theo từng phòng. |
| | `F03.2` | Báo hỏng & Chấm than đỏ | Khách/chủ báo hỏng đồ đạc -> cắm icon chấm than đỏ nhấp nháy tại thiết bị. |
| | `F03.3` | Nghiệm thu sửa chữa & Nhật ký | Chủ xác nhận sửa xong -> tắt chấm than đỏ, ghi vết vào nhật ký lịch sử phòng. |
| | `F03.4` | Tùy biến vị trí & Skin đồ đạc | Cho phép sắp xếp lại hoặc đổi skin đồ vật nhưng bảo toàn số lượng thực tế. |
| **F04. Thu chi & Tiền trọ** | `F04.1` | Mở Sổ quản lý ảo & Mặt bằng 2D tầng | Hoạt ảnh chủ nhà mở sổ quản lý. Mỗi cuốn sổ là 1 tháng. Mỗi trang sổ thể hiện mặt bằng 2D của 1 tầng (phòng trống, phòng đang trọ, cảnh báo chấm than vàng/đỏ). |
| | `F04.2` | Bộ 3 trang giấy chi tiết & Chỉnh sửa trực tiếp | Khi chọn 1 phòng trên mặt bằng 2D, mở ra 3 trang: (1) Thông tin phòng, số điện/nước, danh sách người trọ, tiền trọ & duyệt bill; (2) Danh sách thiết bị & trạng thái; (3) Lịch sử phòng. Cho phép chỉnh sửa trực tiếp toàn bộ thông tin phòng ngay khi đang xem chi tiết; tự động ghi nhật ký lưu vết vào Trang 3 (QLNT-D011). |
| | `F04.3` | Hoạt ảnh Chủ gõ cửa & Chấm than vàng | Kích hoạt đợt thu -> avatar chủ đi gõ cửa các phòng nhắc tiền, cửa phòng hiện icon chấm than vàng. |
| | `F04.4` | Khách nộp bill & Chủ duyệt trong sổ | Khách nộp ảnh biên lai -> avatar đi nộp tiền; chủ kiểm tra bill ảnh trên trang giấy phòng trong sổ, bấm "Xác nhận đã nhận đủ tiền" -> tắt chấm than vàng, cộng/trừ điểm thưởng. |
| **F05. Gamification & Minigame**| `F05.1` | Cơ chế tích điểm & Thưởng nhiệm vụ | Đóng tiền đúng hạn hoặc hoàn thành việc nhà được cộng điểm thưởng. |
| | `F05.2` | Cửa hàng đổi quà / Skin / Vũ khí | Dùng điểm thưởng đổi skin avatar, skin đồ đạc, skin công cụ minigame. |
| | `F05.3` | Mua Sao tặng Chủ nhà tích lũy uy tín| Khách dùng điểm mua sao tặng chủ nhà (dữ liệu thật tích lũy uy tín). |
| | `F05.4` | Minigame săn Chuột / Gián | Sinh vật nhỏ chạy ngẫu nhiên; avatar cầm nồi, chảo, chổi, dép để bắt xả stress. |
| | `F05.5` | Chế độ xả giận & NPC Lao công | Đập phá đồ đạc (dữ liệu thật không đổi), NPC lao công tới quét dọn hồi phục. Avatar hóng chuyện. |
| **F09. Nền tảng & Hệ thống** | `F09.1` | Bản miễn phí Local-First & Multi-tenant| Vận hành offline/local độc lập cho chủ nhà, cấu trúc sẵn sàng cho SaaS multi-tenant. |
| | `F09.2` | Web Responsive + App Mobile | Giao diện chạy mượt trên Web và Mobile Browser/Capacitor. |

---

## 4. Ma trận truy vết yêu cầu P1 (Traceability Matrix)

| Req ID | Tên yêu cầu | FDD ID | Căn cứ nguồn (Decisions/BRD) | Module SRS | Ca sử dụng (Use Case) | Tiêu chí nghiệm thu cốt lõi (Acceptance Criteria) | Trạng thái |
|---|---|---|---|---|---|---|---|
| **R-01** | Dựng nhà trọ 3D camera isometric | `F01.1` | `QLNT-D001`<br>`QLNT-D008`<br>BRD §2 | `FR-BLD-01`<br>`FR-BLD-02` | `UC-BLD-01` | **AC-01.1:** Dựng được mô hình 3D camera cố định (góc nhìn isometric) gồm các tầng và phòng.<br>**AC-01.2:** Click chọn phòng chuyển đổi góc nhìn focus vào phòng mượt mà.<br>**AC-01.3:** P1 hiển thị đúng hình khối/plane placeholder theo tỷ lệ thiết kế. | Đã chốt định hướng |
| **R-02** | Phòng quản lý ảo tập trung | `F01.2` | `QLNT-D002`<br>BRD §2 | `FR-BLD-03` | `UC-BLD-02` | **AC-02.1:** Chủ trọ truy cập được bảng điều khiển toàn diện từ phòng làm việc ảo.<br>**AC-02.2:** Xem được tổng số phòng trống, số phòng nợ tiền, sự cố chưa sửa tại 1 màn hình. | Đã chốt định hướng |
| **R-03** | Avatar khách trọ & Thẻ nhân vật | `F02.1`<br>`F02.2` | `QLNT-D002`<br>`QLNT-D005`<br>BRD §4.2 | `FR-AVT-01`<br>`FR-AVT-02` | `UC-AVT-01` | **AC-03.1:** Khi thêm khách thuê mới, tự sinh 1 avatar trong phòng tương ứng.<br>**AC-03.2:** Bấm vào avatar hiển thị "Thẻ nhân vật" chứa đúng thông tin hợp đồng, CCCD, liên hệ.<br>**AC-03.3:** Chỉ chủ trọ và chính khách đó mới xem được dữ liệu riêng tư (NT-06). | Đã chốt |
| **R-04** | Nghiệp vụ thể hiện bằng hoạt ảnh | `F02.3` | `QLNT-D002`<br>NT-02 | `FR-AVT-03` | `UC-AVT-02` | **AC-04.1:** Nhận phòng: Avatar xách vali vào phòng.<br>**AC-04.2:** Trả phòng: Avatar xách vali rời tòa nhà, phòng chuyển trạng thái trống.<br>**AC-04.3:** Hoạt ảnh không làm sai lệch trạng thái lưu trữ thực tế. | Đã chốt |
| **R-05** | Luồng đóng tiền trọ thủ công & Sổ quản lý ảo (Bản Miễn phí) | `F04.1`<br>`F04.2`<br>`F04.3`<br>`F04.4` | `QLNT-D005`<br>`QLNT-D006`<br>`QLNT-D010`<br>`QLNT-D011`<br>`QLNT-D012`<br>BRD §5.1 | `FR-PAY-01`<br>`FR-PAY-02`<br>`FR-PAY-03` | `UC-PAY-01`<br>`UC-PAY-02`<br>`UC-PAY-03` | **AC-05.1:** Hoạt ảnh chủ nhà mở sổ quản lý ảo (mỗi cuốn sổ là 1 tháng). Mỗi trang sổ là mặt bằng 2D của 1 tầng hiển thị phòng trống, phòng đang trọ và cảnh báo chấm than vàng/đỏ.<br>**AC-05.2:** Chọn 1 phòng trên mặt bằng tầng mở ra bộ 3 trang giấy: (1) Số điện/nước, danh sách cá nhân người trọ, tình trạng tiền trọ & duyệt bill, tình trạng phòng; (2) Danh mục thiết bị & trạng thái; (3) Lịch sử liên quan đến phòng. Toàn bộ các trường thông tin phòng có thể chỉnh sửa trực tiếp (In-place edit) ngay khi đang xem chi tiết phòng; mọi biến động tự động ghi nhật ký lưu vết vào Trang 3 (QLNT-D011).<br>**AC-05.3:** Đến kỳ thu tiền, avatar chủ đi gõ cửa nhắc tiền, cửa phòng (và phòng trên mặt bằng 2D) hiện **chấm than vàng**.<br>**AC-05.4:** Khách nộp ảnh biên lai chuyển khoản -> avatar khách tự đi nộp tiền cho chủ.<br>**AC-05.5:** Chủ kiểm tra bill ảnh trên trang giấy phòng trong sổ, bấm "Xác nhận đã nhận đủ tiền" -> Icon chấm than vàng tắt (ở cả cửa phòng 3D và mặt bằng 2D), hóa đơn chuyển trạng thái "Đã thanh toán", khách đúng hạn được cộng điểm thưởng.<br>**AC-05.6:** Phân cấp điều hướng đóng/thoát (QLNT-D012): Đang xem chi tiết phòng, bấm đóng tờ chi tiết sẽ trở về trang mặt bằng 2D của tầng trong sổ; đang ở trang mặt bằng tầng trong sổ, bấm đóng sổ sẽ kích hoạt hoạt ảnh gập sổ và trở về không gian 3D. | Đã chốt |
| **R-06** | Nhiệm vụ sinh ra từ việc thật | `F05.1` | `QLNT-D005`<br>BRD §5.1 | `FR-GAM-01` | `UC-GAM-01` | **AC-06.1:** Danh sách nhiệm vụ khớp với thực tế: Đóng tiền trọ đúng hạn, kiểm tra đồ đạc, dọn dẹp.<br>**AC-06.2:** Hoàn thành nhiệm vụ cập nhật điểm tích lũy ngay lập tức. | Đã chốt |
| **R-07** | Chế độ xả giận đập phá đồ đạc | `F05.5` | `QLNT-D003`<br>`QLNT-D005`<br>NT-04 | `FR-MINI-02` | `UC-MINI-02` | **AC-07.1:** Người dùng có thể click đập vỡ đồ vật trong phòng để xả stress.<br>**AC-07.2:** Dữ liệu tài sản thật của phòng KHÔNG bị thay đổi (NT-01, NT-04).<br>**AC-07.3:** NPC lao công xuất hiện dọn dẹp và đưa đồ vật về trạng thái nguyên vẹn ban đầu. | Đã chốt |
| **R-08** | Avatar đứng ngoài hóng chuyện | `F05.5` | `QLNT-D003`<br>NT-04 | `FR-MINI-02` | `UC-MINI-02` | **AC-08.1:** Trong lúc đập phá, avatar người thật di chuyển ra góc ngoài quan sát.<br>**AC-08.2:** Avatar có animation biểu cảm ngạc nhiên/hóng chuyện, tuyệt đối không bị thương tổn. | Đã chốt |
| **R-13** | Bản Miễn phí độc lập/thủ công | `F09.1` | `QLNT-D005`<br>BRD §4.4 | `FR-SYS-01` | `UC-SYS-01` | **AC-13.1:** Chạy độc lập không phụ thuộc kết nối cổng thanh toán ngân hàng tự động.<br>**AC-13.2:** Dữ liệu lưu trữ an toàn, có khả năng nâng cấp lên bản Trả phí (P3) không mất dữ liệu. | Đã chốt |
| **R-15** | Đa nền tảng Web & Mobile | `F09.2` | `QLNT-D004`<br>`QLNT-D007` | `FR-SYS-02` | Toàn hệ thống | **AC-15.1:** Giao diện co giãn chuẩn trên cả Desktop Browser và Mobile Browser.<br>**AC-15.2:** Thao tác chạm cảm ứng (touch/tap) trên mobile mượt mà, tốc độ phản hồi đạt 60 FPS. | Đã chốt định hướng |
| **R-16** | Chế độ xem bảng danh sách | `F01.3` | `REQUIREMENTS.md` | `FR-BLD-04` | `UC-BLD-03` | **AC-16.1:** Cung cấp nút chuyển đổi sang giao diện bảng dữ liệu (Data Grid/Table).<br>**AC-16.2:** Mọi thông tin phòng, khách, tiền trọ, báo hỏng đều xem và lọc được dạng bảng. | Đã chốt |
| **R-17** | Quản lý thiết bị phòng trọ | `F03.1`<br>`F03.4` | `QLNT-D005`<br>BRD §5.2 | `FR-DEV-01` | `UC-DEV-01` | **AC-17.1:** Mỗi phòng thiết lập được danh mục thiết bị cố định (giường, tủ, điều hòa...).<br>**AC-17.2:** Khách có thể đổi vị trí hoặc skin đồ vật nhưng không được xóa thiết bị bắt buộc. | Đã chốt |
| **R-18** | Báo hỏng & Lịch sử thiết bị | `F03.2`<br>`F03.3` | `QLNT-D005`<br>NT-08 | `FR-DEV-02`<br>`FR-DEV-03` | `UC-DEV-02`<br>`UC-DEV-03` | **AC-18.1:** Khách bấm báo hỏng -> thiết bị hiển thị **chấm than đỏ** liên tục đến khi sửa xong.<br>**AC-18.2:** Chủ nhà cập nhật đã sửa -> tắt chấm than đỏ.<br>**AC-18.3:** Lưu toàn bộ lịch sử hư hỏng, ngày sửa, chi phí vào nhật ký phòng. | Đã chốt |
| **R-19** | Minigame săn chuột / gián | `F05.4` | `QLNT-D005`<br>BRD §5.3 | `FR-MINI-01` | `UC-MINI-01` | **AC-19.1:** Chuột/gián chạy ngẫu nhiên trong khuôn viên hoặc phòng trọ.<br>**AC-19.2:** Avatar dùng chảo, chổi, dép để bắt, ghi điểm giải trí nhẹ nhàng, không tác động dữ liệu thật. | Đã chốt |
| **R-21** | Tích điểm & Cửa hàng đổi quà / Sao | `F05.1`<br>`F05.2`<br>`F05.3` | `QLNT-D006`<br>BRD §5.4 | `FR-GAM-02`<br>`FR-GAM-03` | `UC-GAM-02`<br>`UC-GAM-03` | **AC-21.1:** Khách dùng điểm đổi skin đồ đạc, skin avatar, skin vũ khí minigame.<br>**AC-21.2:** Khách dùng điểm mua sao tặng chủ nhà -> uy tín của chủ nhà tăng lên. | Đã chốt |

---

## 5. Kế hoạch bàn giao kỹ thuật & kiểm thử (Handover Plan)

1. **Bàn giao cho UX / Visual Artist (2D & 3D):**
   - Bộ quy cách trạng thái chấm than: Chấm than vàng (Tiền trọ `F04`), Chấm than đỏ (Báo hỏng `F03`).
   - Danh sách vật phẩm & vũ khí minigame P1: Nồi, chảo, chổi, dép.
   - Quy cách sprite/placeholder 2D đặt trong không gian 3D camera isometric cố định.
2. **Bàn giao cho Tech Lead:**
   - Hợp đồng `IGameRenderer` bảo đảm nguyên tắc 2 lớp độc lập (`NT-01`).
   - Cấu trúc dữ liệu Local-First/Offline cho bản Miễn phí (`R-13`).
3. **Bàn giao cho QA Lead:**
   - Ma trận này là căn cứ trực tiếp để QA sinh kịch bản kiểm thử theo template X02 cho 14 yêu cầu P1.
