# ĐẶC TẢ YÊU CẦU PHẦN MỀM (SRS — SOFTWARE REQUIREMENTS SPECIFICATION)
## Dự án: QLNT — Nền tảng Quản lý Nhà trọ & Cư dân phong cách Game hóa

---

## 1. Quản lý cập nhật phiên bản (Document Change Log)

| Phiên bản | Ngày | Người thực hiện | Vai trò | Tóm tắt nội dung điều chỉnh | Trạng thái |
|---|---|---|---|---|---|
| **1.0** | 2026-11-07 | Agent BA | Senior BA | Khởi tạo tài liệu SRS chính thức:<br>- Đặc tả chi tiết 10 module chức năng đáp ứng đầy đủ yêu cầu nghiệp vụ trong BRD.<br>- Bổ sung đặc tả phân hệ Khách vãng lai (`FR-GUEST`) và Cổng QR tức thì cho Cán bộ Điện/Nước & Công an khu vực (`FR-PORTAL-QR`).<br>- Chi tiết hóa contract `IGameRenderer` đảm bảo khả năng chuyển đổi đồ họa từ 2D lên 2.5D/3D trơn tru.<br>- Thiết lập các yêu cầu phi chức năng (Hiệu năng 60 FPS, Offline Local-First, Bảo mật dữ liệu cá nhân). | Đã duyệt |
| **1.1** | 2026-11-09 | PM | Điều phối | Làm rõ đích 3D camera isometric cố định; P1 dựng renderer 3D đơn giản, các giai đoạn sau thay dần placeholder bằng asset 3D. | Đã duyệt định hướng |
| **1.2** | 2026-11-12 | Agent BA | BA Lead | Đồng bộ chuẩn hóa hợp đồng IGameRenderer/Vector3D và nhóm hàm Sổ F04; mở rộng mục 6 thành chuẩn 10 thực thể dữ liệu (UUID v4) bao phủ REF-MKT-002 & RoomAuditLog NT-03. | Đã duyệt định hướng |

---

## 2. Giới thiệu và Phạm vi hệ thống (Introduction & System Scope)

- **Mục đích:** Tài liệu này quy định chi tiết kỹ thuật và đặc tả chức năng phần mềm cho hệ thống **QLNT**. Đây là căn cứ kỹ thuật để Đội ngũ phát triển (Mảng B), Kiểm thử (QA/QC) và Vận hành (Mảng C) thực thi và nghiệm thu sản phẩm.
- **Ranh giới hệ thống:**
  - **Client Applications:** Ứng dụng Web Responsive (chạy trên Desktop & Mobile Browser), Ứng dụng Mobile Native (iOS, Android đóng gói bằng Capacitor), và Giao diện Web tức thì khi quét mã QR (Instant QR Web Portal).
  - **Core Business Engine (Headless Core):** Chạy bằng TypeScript thuần, quản lý toàn bộ trạng thái dữ liệu thật và quy tắc kinh doanh.
  - **Presentation Engine:** Đích là cảnh 3D camera isometric cố định. P1 dựng nền renderer 3D bằng hình khối và sprite/plane 2D; P2–P3 thay dần placeholder bằng asset 3D theo giá trị và kết quả kiểm thử, không yêu cầu chuyển engine giữa các giai đoạn.
  - **SaaS Backend Services:** REST API, Realtime WebSocket Gateway, Hệ quản trị cơ sở dữ liệu PostgreSQL (Row-Level Security đa người thuê), Hệ thống lưu trữ ảnh Object Storage.

---

## 3. Kiến trúc hệ thống & Giao tiếp lớp (System Architecture & Separation of Concerns)

Hệ thống tuân thủ nghiêm ngặt nguyên tắc `NT-01` (Hai lớp độc lập: Lớp game không bao giờ sửa dữ liệu thật, chỉ phản ánh dữ liệu thật).

### 3.1. Hợp đồng giao tiếp đồ họa (`IGameRenderer Interface`)
Tầng nghiệp vụ (Headless Domain Core) hoàn toàn không phụ thuộc vào thư viện vẽ canvas cụ thể. Mọi lệnh đồ họa và điều khiển hiển thị đều đi qua Single Source of Truth interface sau (khớp chuẩn `TECH_PROFILE.md` và `DAC_TA_SO_QUAN_LY_AO_SINGLE_PAGE_VA_RENDERER.md`):

```typescript
export interface Vector3D {
  x: number;
  y: number;
  z: number;
}

export type LedgerDetailTab = 'TAB_1_INFO_PAYMENT' | 'TAB_2_DEVICES' | 'TAB_3_HISTORY';

export interface IGameRenderer {
  // --- Nhóm 1: Điều khiển Cảnh 3D Tòa nhà & Avatar (Camera Isometric cố định) ---
  renderBuilding(buildingData: BuildingViewModel): void;
  spawnAvatar(avatarId: string, roomPosition: Vector3D, skinConfig: AvatarSkin): void;
  moveAvatar(avatarId: string, targetPosition: Vector3D, onComplete?: () => void): void;
  setDeviceStatus(roomId: string, deviceId: string, status: 'NORMAL' | 'BROKEN'): void; // Bật/tắt chấm than đỏ (NT-08)
  setRoomNotice(roomId: string, type: 'NONE' | 'PAYMENT_DUE' | 'BILL_PENDING'): void;   // Bật/tắt chấm than vàng (NT-08)
  playMinigameAction(actionType: string, toolSkin: string): void;

  // --- Nhóm 2: Điều khiển Sổ Quản lý Ảo F04 (QLNT-D010..D013 — Hybrid WebGL & DOM Overlay) ---
  /**
   * Kích hoạt hoạt ảnh 3D mở Sổ quản lý tháng và chuyển camera sang mặt bằng tầng 2D
   */
  openLedgerBook(monthKey: string, initialFloorIndex: number, floorMapData: FloorLedgerViewModel): Promise<void>;

  /**
   * Lật trang sổ sang tầng khác (hiệu ứng book-flip) và vẽ lại mặt bằng 2D của tầng đó
   */
  flipLedgerFloorPage(targetFloorIndex: number, floorMapData: FloorLedgerViewModel): Promise<void>;

  /**
   * Mở tờ chi tiết của 1 phòng ở chế độ Single-Page (QLNT-D013), mặc định mở TAB_1_INFO_PAYMENT
   */
  openRoomDetailSinglePage(roomId: string, activeTab: LedgerDetailTab, roomDetailData: RoomDetailViewModel): Promise<void>;

  /**
   * Chuyển qua lại giữa Trang 1 (Thông tin & Tiền), Trang 2 (Thiết bị), Trang 3 (Lịch sử)
   */
  switchRoomDetailPageTab(roomId: string, targetTab: LedgerDetailTab, roomDetailData: RoomDetailViewModel): Promise<void>;

  /**
   * Đồng bộ lại dữ liệu hiển thị sau khi Headless Core xử lý xong In-place Edit (QLNT-D011) hoặc duyệt bill
   */
  refreshRoomDetailView(roomId: string, updatedDetailData: RoomDetailViewModel): void;

  /**
   * Đóng cấp 1 (QLNT-D012): Đóng tờ chi tiết phòng, quay về trang mặt bằng 2D của tầng trong sổ
   */
  closeRoomDetailToFloorMap(updatedFloorMapData: FloorLedgerViewModel): Promise<void>;

  /**
   * Đóng cấp 2 (QLNT-D012): Gập cuốn sổ quản lý lại và trả camera về góc nhìn không gian 3D Isometric
   */
  closeLedgerBookTo3DScene(): Promise<void>;
}
```

---

## 4. Đặc tả yêu cầu chức năng chi tiết (Functional Requirements — FR)

### Module 1: Quản lý tòa nhà & Sơ đồ trực quan (`FR-BLD`)
- **FR-BLD-01 (Mô hình trực quan 3D camera cố định):**
  - Hệ thống cho phép chủ nhà cấu hình tòa nhà gồm: Số tầng, danh sách các phòng/tầng, khu để xe, lối đi và cầu thang.
  - Hiển thị trong cảnh 3D camera isometric cố định. P1 có thể dùng hình khối và sprite/plane 2D; mỗi phòng hiển thị mã phòng, tình trạng (Đang thuê / Còn trống / Đang sửa chữa) và có thể được chọn.
- **FR-BLD-02 (Phòng quản lý tập trung):**
  - Màn hình làm việc của chủ trọ ("Phòng quản lý") hiển thị tổng thể hoạt động: Tổng số phòng trống, số tiền chờ duyệt, số thiết bị đang báo hỏng. Chủ trọ điều hành mọi thao tác tại màn hình này.
- **FR-BLD-03 (Chế độ xem dự phòng — `R-16`):**
  - Cho phép chuyển đổi 1 chạm giữa chế độ xem Game trực quan và chế độ Bảng danh sách truyền thống (Table view) để tra cứu nhanh.

### Module 2: Avatar cư dân & Thẻ nhân vật (`FR-AVT`)
- **FR-AVT-01 (Avatar cư dân):**
  - Mỗi khách thuê khi vào trọ được cấp một Avatar sống trong phòng đã thuê. Khách có thể tùy chỉnh trang phục cơ bản cho avatar.
- **FR-AVT-02 (Thẻ nhân vật — Thông tin bảo mật):**
  - Khi chủ nhà nhấp vào avatar hoặc phòng trọ, màn hình "Thẻ nhân vật" mở ra: Hiển thị họ tên, SĐT, ngày bắt đầu thuê, thời hạn hợp đồng, số tiền cọc, số CCCD và tình trạng đóng tiền.
  - *Bảo mật:* Khách thuê khác và Sale trọ tuyệt đối không xem được thông tin thẻ nhân vật của phòng khác.

### Module 3: Quản lý thiết bị & Báo hỏng (`FR-DEV`)
- **FR-DEV-01 (Quản lý thiết bị cố định & bổ sung — `R-17`):**
  - Mỗi phòng gắn liền với danh mục thiết bị:
    - *Thiết bị mặc định (cố định):* Bóng đèn, vòi sen, bồn cầu, cửa khóa...
    - *Thiết bị tiện nghi bổ sung:* Tủ lạnh, giường, tủ quần áo, bếp từ, máy lạnh...
  - Khách trọ có thể kéo thả thay đổi vị trí đồ đạc hoặc đổi skin hiển thị trong game, nhưng tổng số lượng loại thiết bị bàn giao trong phòng phải được bảo toàn.
- **FR-DEV-02 (Báo hỏng & Hiển thị Chấm than đỏ — `R-18`, `NT-08`):**
  - Khách trọ hoặc chủ trọ chọn thiết bị và bấm "Báo hỏng" (kèm mô tả lỗi, tùy chọn gửi ảnh).
  - Renderer lập tức gắn icon **chấm than đỏ** nhấp nháy trên thiết bị đó trong không gian phòng game.
  - Icon chấm than đỏ duy trì liên tục cho đến khi được chủ nhà xác nhận sửa chữa.
- **FR-DEV-03 (Xác nhận sửa chữa & Nhật ký tài sản):**
  - Sau khi sửa chữa/thay thế, chủ nhà bấm "Xác nhận đã khắc phục" → Icon chấm than đỏ biến mất.
  - Hệ thống tự động ghi nhật ký: Ngày giờ báo hỏng, người báo, thời gian hoàn thành, chi phí sửa chữa (nếu có). Lưu vào lịch sử phòng và hồ sơ khách thuê.

### Module 4: Luồng đóng tiền trọ & Duyệt hóa đơn (`FR-PAY`)
- **FR-PAY-00 (Cơ chế Sổ quản lý ảo & Mặt bằng tầng 2D — `QLNT-D010`, `R-02`, `R-05`):**
  - **Hoạt ảnh:** Khi chủ nhà bắt đầu tác vụ quản lý thu tiền tại Phòng quản lý ảo, kích hoạt hoạt ảnh chủ nhà mở cuốn sổ quản lý.
  - **Định dạng cuốn sổ:** Mỗi cuốn sổ tương ứng với **1 tháng quản lý**.
  - **Trang mặt bằng tầng:** Trong sổ, các trang sắp xếp theo thứ tự tầng; mỗi trang thể hiện **mặt bằng 2D của 1 tầng**, hiển thị trực quan:
    - Phòng trống (phân biệt màu sắc trực quan).
    - Phòng đang có khách trọ.
    - Cảnh báo tại phòng: Icon **chấm than vàng** (đến kỳ đóng tiền hoặc có bill chờ duyệt) và Icon **chấm than đỏ** (có thiết bị báo hỏng).
  - **Bộ 3 trang giấy chi tiết phòng:** Khi chủ nhà chọn (click) vào 1 phòng trên trang mặt bằng 2D, cuốn sổ mở ra 3 trang giấy chi tiết của phòng đó:
    - **Trang 1 — Thông tin phòng & Thu tiền:** Chỉ số điện (cũ, mới, tiêu thụ), chỉ số nước (cũ, mới, tiêu thụ), danh sách thông tin cá nhân người đang trọ (Họ tên, CCCD, SĐT liên hệ), tình trạng thanh toán tiền trọ tháng hiện tại (kèm ảnh bill chuyển khoản nếu khách đã nộp), tình trạng phòng, nút chức năng *"Xác nhận đã nhận đủ tiền"* hoặc *"Từ chối bill"*.
    - **Trang 2 — Danh sách thiết bị phòng:** Danh mục toàn bộ trang thiết bị trong phòng (cố định và tiện nghi bổ sung) kèm trạng thái hiện tại (bình thường hoặc hỏng hóc).
    - **Trang 3 — Nhật ký lịch sử phòng:** Toàn bộ lịch sử các kỳ thanh toán tiền trọ trước đây, lịch sử hư hỏng/sửa chữa thiết bị và lịch sử các đợt khách thuê trước đây.
    - **Chỉnh sửa trực tiếp khi xem chi tiết (`QLNT-D011`):** Toàn bộ thông tin phòng trên Trang 1 (điện, nước, khách thuê, tình trạng phòng) và Trang 2 (danh mục, trạng thái thiết bị) có thể chỉnh sửa/thay đổi trực tiếp ngay tại chỗ (In-place Editing). Mọi thao tác thay đổi dữ liệu đều tự động ghi vết nhật ký vào Trang 3 (thời gian, trường thay đổi, giá trị cũ/mới) để bảo toàn tính toàn vẹn và minh bạch (`NT-03`).
  - **Phân cấp điều hướng đóng/thoát (`QLNT-D012`):**
    - Khi đang xem bộ 3 trang giấy chi tiết phòng: Thao tác đóng tờ chi tiết sẽ lật/gấp tờ giấy lại và trở về **trang mặt bằng 2D của tầng trong cuốn sổ**.
    - Khi đang ở trang mặt bằng tầng trong sổ: Thao tác đóng sổ sẽ kích hoạt hoạt ảnh **gập cuốn sổ lại và trở về góc nhìn không gian 3D** (Phòng quản lý ảo / Toàn cảnh tòa nhà).
- **FR-PAY-01 (Kỳ thu tiền & Gõ cửa nhắc nợ — `R-05`, `NT-08`):**
  - Khi đến kỳ thu tiền (được cấu hình trước theo chu kỳ tháng):
    - Cửa phòng của các khách trọ chưa đóng tiền (và biểu tượng phòng trên trang mặt bằng 2D của sổ) xuất hiện icon **chấm than vàng**.
    - Avatar chủ nhà tự động diễn hoạt hành động đi đến gõ cửa từng phòng để gửi thông báo nộp tiền thân thiện.
    - Ứng dụng gửi thông báo đẩy (push notification) chi tiết khoản tiền cần nộp (tiền phòng + tiền điện nước + dịch vụ).
- **FR-PAY-02 (Nộp bill chuyển khoản — Bản Miễn phí):**
  - Khách trọ mở app, xem hóa đơn và bấm nhiệm vụ *"Đóng tiền trọ"*.
  - Khách tải lên ảnh chụp màn hình biên lai chuyển khoản thành công từ app ngân hàng cá nhân.
  - Bấm "Xác nhận nộp tiền":
    - Hệ thống ghi nhận trạng thái hóa đơn là `CHỜ_DUYỆT`.
    - Diễn hoạt game: Avatar khách trọ tự động rời phòng, đi đến gặp avatar chủ nhà (hoặc phòng của chủ nhà) để đưa tiền.
- **FR-PAY-03 (Chủ nhà mở sổ duyệt bill & Hoàn tất nhiệm vụ — `R-05`, `QLNT-D010`):**
  - Chủ nhà nhận thông báo có bill mới, mở Sổ quản lý ảo của tháng, chọn phòng đang hiển thị chấm than vàng trên mặt bằng 2D.
  - Trên **Trang 1** của phòng trong sổ, chủ nhà xem ảnh chụp bill đối chiếu tài khoản thực tế.
  - Chủ nhà bấm nút **"Xác nhận đã nhận đủ tiền"**:
    - Trạng thái hóa đơn chuyển sang `ĐÃ_THANH_TOÁN`.
    - Icon chấm than vàng trước cửa phòng 3D và trên mặt bằng 2D của sổ lập tức biến mất.
    - Kích hoạt sự kiện hoàn thành nhiệm vụ và cộng điểm thưởng cho khách trọ.
- **FR-PAY-04 (Bản Trả phí — Tự động hóa qua VietQR động — `R-05b`):**
  - Hóa đơn sinh mã VietQR động chứa sẵn số tiền và mã hóa đơn riêng biệt từng phòng.
  - Khi khách quét QR chuyển khoản qua ngân hàng, Webhook ngân hàng bắn tín hiệu về backend: Hệ thống tự động khớp hóa đơn `ĐÃ_THANH_TOÁN` mà chủ nhà không cần kiểm tra thủ công.

### Module 5: Hệ sinh thái Gamification & Điểm thưởng (`FR-GAM`)
- **FR-GAM-01 (Quy tắc tích & trừ điểm):**
  - Nộp tiền trước hạn: Cộng `+100 điểm thưởng`.
  - Nộp tiền đúng hạn (trong kỳ): Cộng `+50 điểm thưởng`.
  - Quá hạn nhiệm vụ (sau ngày chốt): Mỗi ngày trễ hạn trừ `-10 điểm thưởng`.
- **FR-GAM-02 (Cửa hàng đổi quà — Shop):**
  - Cung cấp giao diện cửa hàng cho cư dân đổi điểm lấy:
    - *Trang trí phòng:* Thảm lót sàn, chậu cây, tranh treo tường, đèn trang trí.
    - *Skin thiết bị:* Đổi màu tủ lạnh, kiểu dáng giường, bàn học.
    - *Skin nhân vật & vũ khí:* Đổi nón, áo, skin chảo vàng, chổi phép thuật.
    - *Phiếu giảm giá (Voucher):* Đổi voucher giảm 50.000đ – 100.000đ tiền thuê phòng hoặc tiền internet tháng tiếp theo (theo ngân sách chủ nhà cho phép).
- **FR-GAM-03 (Mua Sao tặng chủ nhà & Xếp hạng uy tín — `R-21`):**
  - Khách trọ có thể dùng điểm thưởng để mua "Sao uy tín" tặng cho chủ trọ nhằm thể hiện sự hài lòng về dịch vụ.
  - Tổng số sao nhận được sẽ tích lũy thành điểm đánh giá uy tín của khu trọ, hiển thị công khai trên Bản đồ khu phố để thu hút khách thuê mới.

### Module 6: Minigame sinh hoạt & Xả giận (`FR-MINI`)
- **FR-MINI-01 (Minigame săn chuột, gián — `R-19`):**
  - Chuột hoặc gián xuất hiện ngẫu nhiên chạy trong khuôn viên hoặc phòng trọ.
  - Người dùng bấm vào avatar, chọn công cụ/vũ khí sinh hoạt (nồi, chảo, chổi, dép...) để điều khiển avatar đuổi bắt.
  - Bắt thành công: Hiển thị hoạt ảnh ăn mừng vui nhộn và thưởng điểm giải trí nhỏ (`+5 điểm`). Hoạt động không ảnh hưởng đến đồ vật thật.
- **FR-MINI-02 (Chế độ xả giận & NPC lao công — `R-07`, `R-08`):**
  - Cho phép người dùng vào chế độ đập phá đồ vật trong phòng riêng của mình để giải tỏa căng thẳng.
  - Các avatar khác tự động đứng ngoài vùng tương tác ở tư thế "hóng chuyện" (`NT-04`), không bị tác động.
  - Sau khi kết thúc, NPC lao công xuất hiện quét dọn, đồ vật khôi phục lại nguyên trạng, dữ liệu tài sản thật không thay đổi.

### Module 7: Phân quyền & Quản lý Sale trọ (`FR-SALE`)
- **FR-SALE-01 (Tạo tài khoản & Avatar Sale — `R-20`):**
  - Chủ nhà thêm SĐT/thông tin của cộng tác viên Sale → Hệ thống tự tạo tài khoản và sinh avatar Sale trọ có gắn nhãn nhận diện.
  - Quyền hoạt động có thời hạn cụ thể (mặc định 30 ngày, hết hạn Sale phải gửi yêu cầu gia hạn đến chủ nhà).
- **FR-SALE-02 (Ranh giới bảo mật nghiêm ngặt — `NT-07`):**
  - Avatar Sale được phép di chuyển tự do ở khuôn viên chung ngoài trời và bước vào các **phòng đang trống**.
  - Khi vào phòng trống: Sale có thể xem bộ dữ liệu tiếp thị (ảnh chụp góc rộng, diện tích m², danh mục đồ dùng có sẵn, giá thuê, lịch sử đánh giá của khách cũ) để tư vấn khách.
  - **Khóa cứng:** Nếu phòng đang ở trạng thái `ĐANG_THUÊ`, avatar Sale bị chặn không thể bước vào và không thể xem thông tin phòng.
- **FR-SALE-03 (Gắn bài đăng tiếp thị):**
  - Sale có thể dán link bài đăng quảng bá (Facebook, TikTok, Zalo) gắn liền với mã phòng trống để chủ nhà tiện theo dõi hiệu quả bán phòng.

### Module 8: Khách vãng lai & Tìm trọ (`FR-GUEST`)
- **FR-GUEST-01 (Truy cập không cần mật khẩu):**
  - Người tìm trọ truy cập qua link, quét QR dán tại cửa nhà trọ hoặc bản đồ khu phố: Có thể xem thông tin ngay qua tài khoản Khách (Guest Mode) hoặc đăng nhập nhanh 1 chạm bằng số điện thoại/OTP.
- **FR-GUEST-02 (Trải nghiệm xem phòng trống ảo):**
  - Khách vãng lai được điều khiển một avatar khách tham quan khuôn viên ngoài và các phòng trống.
  - Xem thông tin minh bạch: Giá thuê, tiền cọc, chi phí điện nước, hình ảnh thật và số sao uy tín của chủ nhà.
- **FR-GUEST-03 (Hẹn lịch & Chuyển đổi thành Khách trọ):**
  - Khách vãng lai bấm "Hẹn xem phòng" hoặc "Đăng ký thuê".
  - Khi chủ nhà duyệt hợp đồng thành công: Tài khoản khách vãng lai được liên kết với mã phòng và **tự động chuyển đổi thành Khách trọ chính thức**, kích hoạt đầy đủ các tính năng nhiệm vụ và cư dân.

### Module 9: Cổng dịch vụ công & Tiện ích QR tức thì (`FR-PORTAL-QR`)
- **FR-PORTAL-QR-01 (Cổng Cán bộ Điện lực / Cấp thoát nước):**
  - Cán bộ quét mã QR dán tại tủ công tơ điện/nước của nhà trọ → Mở ngay Web-app nhập chỉ số điện nước trong 1 giây.
  - Giao diện tối giản: Danh sách số phòng kèm trường nhập số điện cũ/mới, có nút chụp ảnh công tơ đối chứng.
  - Khi cán bộ bấm "Xác nhận gửi": Hệ thống tự động tính toán sản lượng tiêu thụ và tự động điền vào hóa đơn tiền phòng của từng khách trọ.
- **FR-PORTAL-QR-02 (Cổng Kiểm tra An ninh & PCCC — Công an khu vực):**
  - Cán bộ Công an khu vực quét mã QR an ninh tại cổng nhà trọ (kèm mã định danh công tác):
    - Tra cứu tức thì danh sách nhân khẩu đang cư trú thực tế tại cơ sở trọ (họ tên, CCCD, ngày bắt đầu ở) phục vụ rà soát tạm trú theo quy định VNeID.
    - Cập nhật biên bản kiểm tra định kỳ an toàn PCCC (Phòng cháy chữa cháy) và lối thoát hiểm.
    - Đăng tải thông báo an ninh, cảnh báo an toàn phòng ngừa trộm cắp gửi trực tiếp đến bảng tin chung của toàn bộ cư dân trong nhà trọ.

### Module 10: Bản đồ khu phố Hà Nội (`FR-MAP`)
- **FR-MAP-01 (Khám phá khu phố 3D camera cố định — `R-09`):**
  - Bản đồ mô phỏng các tuyến phố chính tại Hà Nội (Cầu Giấy, Đống Đa, Bách - Kinh - Xây...).
  - Chỉ hiển thị các tòa nhà trọ có bật chế độ "Công khai" và **chỉ hiển thị số lượng phòng đang trống** (`NT-06`).
- **FR-MAP-02 (Lọc & Tìm kiếm):**
  - Cho phép người tìm trọ lọc theo khoảng giá, khu vực quận/huyện, tiện ích có sẵn (có điều hòa, ban công, chỗ để xe).

---

## 5. Yêu cầu phi chức năng (Non-Functional Requirements — NFR)

1. **NFR-PERF (Hiệu năng đồ họa & Tải trang):**
   - Đặt mục tiêu tốc độ khung hình và tải cảnh cho renderer 3D trên nhóm thiết bị mục tiêu; ngưỡng nghiệm thu cụ thể cần được xác định sau prototype/đo hiệu năng, không mặc định 60 FPS trên mọi thiết bị.
   - Dung lượng tải ứng dụng ban đầu (Bundle size) dưới **3.5 MB**; thời gian mở Web-app qua quét mã QR dưới **2 giây**.
2. **NFR-REL (Độ tin cậy & Ngoại tuyến):**
   - Bản Miễn phí phải hoạt động độc lập và lưu trữ dữ liệu an toàn trên trình duyệt qua **IndexedDB (Dexie.js)** khi mất kết nối mạng.
   - Cơ chế tự động thử lại (Retry & Queue) khi có mạng để đồng bộ hóa biên lai và hóa đơn lên Cloud.
3. **NFR-SEC (Bảo mật & Quyền riêng tư):**
   - Toàn bộ kết nối sử dụng giao thức bảo mật HTTPS/WSS (TLS 1.3).
   - Dữ liệu định danh cá nhân nhạy cảm của khách thuê (số CCCD, hình ảnh căn cước, hợp đồng) phải được mã hóa ở mức cơ sở dữ liệu.
   - Cơ chế phân tách dữ liệu đa người thuê (Multi-tenant Data Isolation) bằng Row-Level Security trên PostgreSQL, đảm bảo tuyệt đối không rò rỉ dữ liệu giữa các chủ nhà trọ.

---

## 6. Mô hình dữ liệu & Thực thể chuẩn hóa (Standardized Data Schema — 10 Entities)

Hệ thống chuẩn hóa toàn diện 10 thực thể dữ liệu dùng khóa chính `UUID v4` đồng bộ giữa Local IndexedDB (Dexie.js) và Cloud PostgreSQL (Supabase Free qua Row-Level Security), bao phủ đầy đủ nghiệp vụ thực tế theo `REF-MKT-002` và nguyên tắc nhật ký bất biến `NT-03`:

1. **`landlords` (Chủ trọ / Tài khoản quản trị):**
   - `id`: UUID v4 (Primary Key)
   - `name`: string (Họ tên chủ nhà)
   - `phone`: string (SĐT định danh / Zalo)
   - `email`: string
   - `reputation_stars`: number (Điểm sao uy tín tích lũy, mặc định 5.0)
   - `package_tier`: 'FREE' | 'PRO' (Gói dịch vụ, Giai đoạn 1 mặc định FREE theo QLNT-D014)
   - `created_at`, `updated_at`: TIMESTAMP

2. **`properties` (Khu trọ / Tòa nhà — Tương ứng Building):**
   - `id`: UUID v4 (Primary Key)
   - `landlord_id`: UUID (FK -> landlords.id — RLS Tenant Key)
   - `name`: string (Tên tòa nhà / khu trọ)
   - `address`: string (Địa chỉ thực tế tại Hà Nội)
   - `total_floors`: number (Tổng số tầng)
   - `coordinates_3d`: Vector3D / JSON (Tọa độ logic trong không gian 3D Isometric)
   - `water_calc_method`: 'PER_M3' | 'PER_HEAD' (Phương pháp tính tiền nước: theo số m³ đồng hồ hoặc theo đầu người theo REF-MKT-002)
   - `is_public_on_map`: boolean (Cho phép hiển thị số phòng trống lên Bản đồ khu phố hay không)
   - `created_at`, `updated_at`: TIMESTAMP

3. **`rooms` (Phòng trọ):**
   - `id`: UUID v4 (Primary Key)
   - `property_id`: UUID (FK -> properties.id)
   - `floor_number`: number (Số tầng: 1, 2, 3...)
   - `room_number`: string (Mã phòng: 'P.101', 'P.201'...)
   - `area_sqm`: number (Diện tích phòng m²)
   - `price_base`: number (Giá thuê phòng cơ bản hàng tháng VNĐ)
   - `status`: 'EMPTY' | 'RENTED' | 'MAINTENANCE' (Trạng thái phòng)
   - `has_yellow_notice`: boolean (Cảnh báo chấm than vàng — tiền trọ / chờ duyệt bill)
   - `has_red_alert`: boolean (Cảnh báo chấm than đỏ — thiết bị báo hỏng)
   - `created_at`, `updated_at`: TIMESTAMP

4. **`tenants` (Khách thuê / Cư dân trọ):**
   - `id`: UUID v4 (Primary Key)
   - `room_id`: UUID (FK -> rooms.id, nullable khi trả phòng)
   - `full_name`: string (Họ và tên)
   - `phone`: string (SĐT liên hệ / Zalo)
   - `id_card_number`: string (CCCD 12 số định danh cá nhân)
   - `id_card_front_url`: string (Đường dẫn ảnh mặt trước CCCD — Cloudflare R2 Private Bucket qua Signed URL 15 phút)
   - `id_card_back_url`: string (Đường dẫn ảnh mặt sau CCCD — Cloudflare R2 Private Bucket qua Signed URL 15 phút)
   - `dob_or_hometown`: string (Năm sinh / quê quán theo REF-MKT-002)
   - `license_plate`: string (Biển số xe máy / xe điện gửi hầm xe theo REF-MKT-002)
   - `role`: 'PRIMARY_REP' | 'CO_TENANT' (Đại diện ký hợp đồng hay ở ghép theo REF-MKT-002)
   - `temporary_residence_status`: 'REGISTERED' | 'PENDING' (Tình trạng khai báo tạm trú VNeID theo REF-MKT-002)
   - `reward_points`: number (Điểm thưởng gamification tích lũy)
   - `avatar_skin_config`: JSON (Cấu hình ngoại hình, trang phục avatar trong game)
   - `created_at`, `updated_at`: TIMESTAMP

5. **`contracts` (Hợp đồng thuê trọ):**
   - `id`: UUID v4 (Primary Key)
   - `property_id`: UUID (FK -> properties.id)
   - `room_id`: UUID (FK -> rooms.id)
   - `tenant_rep_id`: UUID (FK -> tenants.id — Người đại diện ký)
   - `contract_start_date`: DATE (Ngày bắt đầu thuê)
   - `contract_end_date`: DATE (Thời hạn hợp đồng: 6 tháng, 12 tháng theo REF-MKT-002)
   - `deposit_amount`: number (Tiền đặt cọc, thường là 1 tháng tiền phòng)
   - `rental_price_agreed`: number (Giá thuê thỏa thuận VNĐ/tháng)
   - `payment_cycle_day`: number (Kỳ thu tiền hàng tháng: mùng 1 đến mùng 5)
   - `status`: 'ACTIVE' | 'EXPIRED' | 'TERMINATED'
   - `contract_file_url`: string (Ảnh hoặc file PDF hợp đồng trên R2)
   - `created_at`, `updated_at`: TIMESTAMP

6. **`billings` (Bảng kê thu tiền phòng & dịch vụ hàng tháng):**
   - `id`: UUID v4 (Primary Key)
   - `room_id`: UUID (FK -> rooms.id)
   - `month_key`: string (Định dạng 'YYYY-MM', tương ứng mỗi cuốn sổ quản lý)
   - `room_charge`: number (Tiền thuê phòng cố định)
   - `electric_charge`: number (Tiền điện theo chỉ số tiêu thụ)
   - `water_charge`: number (Tiền nước theo m³ hoặc khoán đầu người)
   - `service_charge`: number (Dịch vụ chung: rác, vệ sinh, thang máy, wifi theo REF-MKT-002)
   - `parking_charge`: number (Phí gửi xe máy / sạc xe điện theo REF-MKT-002)
   - `debt_or_discount`: number (Nợ cũ kỳ trước hoặc khấu trừ sửa chữa theo REF-MKT-002)
   - `total_amount`: number (Tổng cộng tiền phải thu)
   - `status`: 'UNPAID' | 'PENDING_APPROVAL' | 'PAID' | 'OVERDUE'
   - `due_date`: DATE (Hạn chót thanh toán trước khi bị phạt trừ điểm)
   - `created_at`, `updated_at`: TIMESTAMP

7. **`payment_records` (Biên lai nộp tiền & Đối soát thanh toán):**
   - `id`: UUID v4 (Primary Key)
   - `billing_id`: UUID (FK -> billings.id)
   - `room_id`: UUID (FK -> rooms.id)
   - `amount_paid`: number (Số tiền khách chuyển)
   - `payment_method`: 'MANUAL_TRANSFER' | 'CASH' | 'DYNAMIC_VIETQR' (Giai đoạn P1 hỗ trợ chuyển khoản thủ công có bill UNC)
   - `bill_image_url`: string (Ảnh chụp biên lai UNC — Lưu trữ Cloudflare R2 Private Bucket, cấp qua Signed URL 15 phút)
   - `payer_tenant_id`: UUID (FK -> tenants.id)
   - `approved_by_landlord_id`: UUID (FK -> landlords.id, nullable khi chưa duyệt)
   - `status`: 'PENDING' | 'APPROVED' | 'REJECTED'
   - `rejection_reason`: string (Lý do từ chối nếu bill không hợp lệ)
   - `paid_at`: TIMESTAMP (Thời điểm khách bấm nộp bill để tính điểm thưởng đúng hạn)
   - `approved_at`: TIMESTAMP (Thời điểm chủ trọ duyệt tiền trong Sổ F04)

8. **`meter_readings` (Chỉ số công tơ điện & đồng hồ nước):**
   - `id`: UUID v4 (Primary Key)
   - `room_id`: UUID (FK -> rooms.id)
   - `month_key`: string (Định dạng 'YYYY-MM')
   - `meter_type`: 'ELECTRIC' | 'WATER' (Phân loại công tơ điện hoặc nước)
   - `old_value`: number (Chỉ số cũ — tự động kế thừa từ tháng trước)
   - `new_value`: number (Chỉ số mới — nhập in-place edit trên Trang 1 hoặc quét QR)
   - `consumption`: number (Sản lượng tiêu thụ = new_value - old_value)
   - `unit_price`: number (Đơn giá điện: 3.800 đ/kWh, nước: 25.000 đ/m³)
   - `meter_photo_url`: string (Ảnh chụp mặt đồng hồ công tơ đối chứng)
   - `recorded_by_type`: 'LANDLORD' | 'PUBLIC_UTILITY_OFFICER' (Chủ trọ nhập hoặc cán bộ tiện ích quét QR)
   - `recorded_at`: TIMESTAMP

9. **`room_audit_logs` (Nhật ký biến động phòng — Append-only NT-03):**
   - `id`: UUID v4 (Primary Key)
   - `room_id`: UUID (FK -> rooms.id)
   - `actor_id`: UUID (ID của chủ trọ, khách trọ, cán bộ công an hoặc hệ thống)
   - `actor_type`: 'LANDLORD' | 'TENANT' | 'SYSTEM' | 'POLICE' | 'UTILITY_OFFICER'
   - `action_type`: 'FIELD_EDIT' | 'BILL_APPROVE' | 'DEVICE_CHANGE' | 'TENANT_MOVE' | 'CONTRACT_UPDATE'
   - `field_name`: string (Tên trường bị thay đổi, VD: 'new_electric_value', 'rental_price')
   - `old_value`: string / JSON (Giá trị trước khi sửa)
   - `new_value`: string / JSON (Giá trị sau khi sửa)
   - `description`: string (Mô tả hành động hiển thị trên Timeline Trang 3 Sổ F04)
   - `created_at`: TIMESTAMP (Thời điểm ghi nhận — Bất biến, không cho phép cập nhật hay xóa theo nguyên tắc NT-03)

10. **`maintenance_requests` (Yêu cầu báo hỏng & Sửa chữa thiết bị):**
    - `id`: UUID v4 (Primary Key)
    - `room_id`: UUID (FK -> rooms.id)
    - `device_name_or_id`: string (Tên thiết bị trong danh mục 10 thiết bị chuẩn REF-MKT-002: Điều hòa, Bình nóng lạnh, Giường, Tủ, Bếp, Bồn cầu...)
    - `requester_tenant_id`: UUID (FK -> tenants.id — Người phát hiện sự cố)
    - `issue_description`: string (Mô tả hiện tượng hỏng hóc)
    - `issue_photo_url`: string (Ảnh chụp thiết bị hỏng)
    - `status`: 'BROKEN' | 'IN_PROGRESS' | 'RESOLVED' (Gắn với chấm than đỏ)
    - `repair_cost`: number (Chi phí sửa chữa thực tế)
    - `reported_at`: TIMESTAMP (Thời điểm bật chấm than đỏ)
    - `resolved_at`: TIMESTAMP (Thời điểm chủ trọ xác nhận hoàn tất — tắt chấm than đỏ)
    - `resolved_by_landlord_id`: UUID (FK -> landlords.id)
