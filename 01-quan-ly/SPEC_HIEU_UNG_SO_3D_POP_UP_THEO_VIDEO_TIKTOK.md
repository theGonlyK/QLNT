# ĐẶC TẢ YÊU CẦU: TÁI TẠO HOẠT ẢNH QUYỂN SÁCH POP-UP 3D CHUẨN XÁC THEO VIDEO TIKTOK

- **Mã tài liệu:** `SPEC-QLNT-3D-POPUP-BOOK-REPLICATION-002`
- **Dự án:** QLNT — Quản Lý Nhà Trọ (Prototype P1)
- **Nguồn tham chiếu:** Video TikTok `https://vt.tiktok.com/ZSpb4UNd8/` ("Augmented Physics / TechArtist" - Sách giáo khoa 3D Pop-up)
- **Tác giả:** BA Lead (Gemini)
- **Ngày lập:** 2026-11-16
- **Trạng thái:** Dự thảo / Chờ xác nhận từ người dùng

---

## 1. Phân Tích Chi Tiết Hoạt Ảnh Trong Video Gốc

Qua phân tích từng khung hình (`book-anim-1.png` đến `book-anim-5.png`), cơ chế hoạt ảnh của cuốn sách trong video bao gồm các yếu tố cốt lõi:

```
+-------------------------------------------------------------------------------+
|                                    MẶT BÀN                                    |
|                                                                               |
|             +-----------------------+   +-----------------------+             |
|             |      TRANG TRÁI       | | |      TRANG PHẢI       |             |
|             |                       | | |                       |             |
|             |  [HỒ SƠ PHÒNG / CHỮ]  | | |   +---------------+   |             |
|             |                       | | |   | CỬA SỔ POP-UP |   |             |
|             |  - Thông tin khách    | | |   |  3D DỰNG ĐỨNG |   |             |
|             |  - Tiền phòng, điện   | | |   | (Chốt số, QR, |   |             |
|             |  - Chỉ số công tơ     | | |   |  Hóa đơn, v.v)|   |             |
|             |                       | | |   +---------------+   |             |
|             |                       | | |   |/ / / bóng đổ / / /|             |
|             +-----------------------+ | +-----------------------+             |
|                        |                  |                                   |
|                        +---- GÁY SÁCH ----+                                   |
|                              (Spine)                                          |
+-------------------------------------------------------------------------------+
```

### 1.1. Bố cục không gian 3D (3D Perspective Stage)
- Cuốn sách không hiển thị phẳng 2D chính diện, mà nằm trên một mặt phẳng không gian với góc phối cảnh nghiêng tự nhiên:
  - `perspective: 1600px`
  - Góc nghiêng: `rotateX(18deg) rotateY(-3deg)`
  - Độ dày tập giấy (`book-paper-stack`): Các cạnh giấy có viền nhiều lớp giả lập tập giấy dày dặn của cuốn sổ bìa cứng.

### 1.2. Hoạt ảnh Mở Sách (Book Cover Hinge Opening)
- Ban đầu: Sách đóng lại, nằm nghiêng trên bàn với bìa da vàng/nâu sẫm sang trọng.
- Khi mở: Bìa trước lật mở từ phải qua trái quanh trục gáy sách ($0^\circ \rightarrow -180^\circ$) với chuyển động vật lý mượt mà (damping/spring).
- Khi mở hoàn tất: Trải phẳng thành **hai trang sách (Two-Page Spread)**:
  - **Trang Trái:** Trang tài liệu giấy in nét chữ mực (chứa thông tin phòng, hợp đồng, người thuê, công tơ số điện nước).
  - **Trang Phải:** Trang nền kẻ ô / vẽ phác thảo, đóng vai trò là "bệ đỡ" cho mô hình/cửa sổ pop-up.

### 1.3. Hoạt ảnh Pop-up Dựng Đứng từ Trang Giấy (Fold-Up Pop-Up Mechanic)
- Đây là điểm đặc trưng cốt lõi trong video:
  - Trên trang sách phải, cửa sổ thông tin (hoặc thẻ chi tiết) ban đầu nằm bẹp phẳng trên mặt trang (`rotateX(-90deg)`, `transform-origin: bottom center`).
  - Khi sách vừa mở phẳng: Cửa sổ thông tin **bật dựng đứng dậy vuông góc khỏi mặt trang giấy** (`rotateX(-90deg) -> rotateX(0deg)`).
  - Chân đế của cửa sổ gắn chặt vào nếp gấp trang giấy.
  - Phía sau và dưới chân cửa sổ có **bóng đổ mềm mại (soft drop shadow)** in hình xuống mặt trang giấy, tạo cảm giác một vật thể 3D thực thụ đang vươn lên trong không gian.

### 1.4. Chu trình Gập Sách Ngược (Closing Fold-Down)
- Khi người dùng bấm *"Gập Sổ (3D)"*:
  - Cửa sổ thông tin pop-up gập bẹp trở lại mặt giấy (`rotateX(0deg) -> rotateX(-85deg)`).
  - Sau đó bìa sách bên phải gập úp lại vào gáy để đóng kín cuốn sách.
  - Cuốn sách thu nhỏ và biến mất mượt mà để trả lại góc nhìn 3D toà nhà.

---

## 2. Quy Cách Thiết Kế Thành Phần Giao Diện

### 2.1. Nâng cấp `VirtualLedgerBook` (@qlnt/renderer-2d)
- Chuyển cấu trúc container thành **Quyển Sách 3D Mở Đôi (Two-Page Spread 3D Book)**:
  - `book-spread-container`: Phối cảnh `perspective: 1600px`, `transform: rotateX(16deg)`.
  - `book-page-left`: Trang sổ hồ sơ giấy ngà:
    - Tiêu đề phong cách vintage dập chữ nổi: *SỔ QUẢN LÝ PHÒNG — TOÀ NHÀ F04*.
    - Bảng thông tin hợp đồng, giá thuê, người thuê, điểm uy tín.
    - Bản vẽ mặt cắt công tơ / đồ thị tiêu thụ điện nước.
  - `book-page-right`: Trang bệ phóng Pop-up 3D:
    - Bề mặt trang sách có nếp gấp chân đế.
    - Cửa sổ pop-up dựng đứng (`popup-standup-card`):
      - Cửa sổ thông tin tương tác: Bảng chốt số điện nước, VietQR Offline, Tải hóa đơn, Nút bấm 1-chạm.
      - Hoạt ảnh CSS `@keyframes popUpStandUp`:
        - `0%`: `transform: rotateX(-90deg) scale(0.9); opacity: 0;`
        - `60%`: `transform: rotateX(8deg) scale(1.02); opacity: 1;`
        - `100%`: `transform: rotateX(0deg) scale(1); opacity: 1;`
      - Bóng đổ động `@keyframes shadowSpread`: nới rộng bóng đổ in xuống mặt trang giấy khi vật thể bật đứng dậy.

### 2.2. Tích hợp trong `LedgerOverlayHost` (@qlnt/web)
- Hợp nhất cửa sổ điều khiển `f04-interactive-panel` trực tiếp vào cấu trúc Pop-Up của trang phải, thay vì tách làm 2 khối trên/dưới.
- Khi người dùng xem ở chế độ Mobile (390x844): Cuốn sách tự động chuyển thành góc nhìn tối ưu cho màn hình dọc (adaptive vertical pop-up).

---

## 3. Ràng Buộc & Tiêu Chuẩn
- **0% thay đổi** trong `packages/shared-types` (`common`).
- Bảo toàn đầy đủ tất cả các tính năng nghiệp vụ: Chốt chỉ số điện nước, Duyệt hoá đơn 1-chạm, Tải ảnh hóa đơn local, Mã VietQR offline, Ghi RoomAuditLog.
- Giữ nguyên 100% các `data-testid` để tương thích kiểm thử tự động.
- 181/181 unit tests PASS, 8/8 Playwright Chrome E2E suites PASS.
