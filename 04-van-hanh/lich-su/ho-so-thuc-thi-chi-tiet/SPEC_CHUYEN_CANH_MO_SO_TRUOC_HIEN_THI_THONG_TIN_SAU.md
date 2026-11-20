# ĐẶC TẢ YÊU CẦU: CHUYỂN CẢNH MỞ SỔ 3D TUẦN TỰ (SÁCH MỞ RA TRƯỚC -> CỬA SỔ THÔNG TIN HIỂN THỊ SAU)

- **Mã tài liệu:** `SPEC-QLNT-TRANSITION-STAGED-BOOK-POPUP-001`
- **Dự án:** QLNT — Quản Lý Nhà Trọ (Prototype P1)
- **Tác giả:** BA Lead (Gemini)
- **Ngày lập:** 2026-11-16
- **Trạng thái:** Dự thảo / Chờ xác nhận từ người dùng

---

## 1. Bối cảnh & Mục tiêu

### 1.1. Vấn đề hiện tại
- Khi người dùng click vào một phòng (từ mặt bằng tầng 3D Cutaway, thẻ phòng, hoặc nút "Mở Sổ Quản Lý F04"), lớp phủ `LedgerOverlayHost` xuất hiện.
- Mặc dù cuốn sổ `VirtualLedgerBook` đã có hoạt ảnh 3D lật mở (`bookOpenHinge`), nhưng:
  1. Cửa sổ thông tin phòng (`f04-interactive-panel` bên dưới) và nội dung chữ/form chi tiết (`RoomDetailSinglePage` bên trong sổ) **hiển thị ngay lập tức từ mili-giây thứ 0**.
  2. Người dùng nhìn thấy toàn bộ bảng biểu, nút bấm, số liệu xuất hiện cùng lúc với lúc cuốn sách đang xoay, làm lu mờ hoàn toàn hiệu ứng mở sách, không đạt được trải nghiệm thị giác "mở sách pop-up" ấn tượng như trong clip mẫu.

### 1.2. Mục tiêu mong muốn
- Thiết lập **chu trình chuyển cảnh 2 giai đoạn tuần tự (2-Stage Sequential Transition)**:
  - **Giai đoạn 1 (0ms - 550ms): Quyển sách mở ra:**
    - Khởi đầu với giao diện cuốn sổ bìa da 3D (bìa đóng kín trang nhã với vân da và chữ vàng dập chìm).
    - Bìa sách lật mở sang trái quanh trục bản lề gáy sách (Hinge flip mở 180 độ phẳng phiu).
    - Trong suốt giai đoạn này: **Cửa sổ thông tin hoàn toàn chưa hiển thị**, người dùng chỉ tập trung vào hiệu ứng chuyển động của cuốn sách.
  - **Giai đoạn 2 (550ms - 950ms): Cửa sổ thông tin bung nở hiển thị:**
    - Ngay sau khi quyển sách mở ra phẳng hoàn chỉnh, cửa sổ thông tin phòng (gồm trang chi tiết trong sổ và bảng điều khiển tương tác bên dưới) mới kích hoạt hiệu ứng **Pop-up 3D**:
    - Trồi lên / bung nở từ trong lòng cuốn sách (`translateY(24px) scale(0.94) opacity(0)` $\rightarrow$ `translateY(0) scale(1) opacity(1)`) theo gia tốc tự nhiên (spring-like curve).
  - **Giai đoạn Đóng/Gập Sổ (Reverse):**
    - Cửa sổ thông tin thu gọn và biến mất nhanh (150ms - 200ms).
    - Sau đó bìa sách mới gập lại về gáy và đóng hoàn toàn về không gian 3D.

---

## 2. Máy Trạng Thái Chu Trình Chuyển Cảnh (State Machine)

```mermaid
stateDiagram-v2
    [*] --> CLOSED
    CLOSED --> BOOK_OPENING: Click mở phòng / mở sổ
    
    state BOOK_OPENING {
        direction LR
        [*] --> FlapCoverHingeOpen
        FlapCoverHingeOpen --> BookFlatOpen
        note right of BookCover: Bìa sách 3D lật mở (0 - 550ms)\nCửa sổ thông tin: ẨN HOÀN TOÀN
    }
    
    BOOK_OPENING --> CONTENT_POPUP: Timer 550ms (Sách đã mở xong)
    
    state CONTENT_POPUP {
        direction LR
        [*] --> UnfoldCard3D
        UnfoldCard3D --> FadeInInteractivePanel
        note right of Content: Cửa sổ thông tin trồi lên (550ms - 950ms)\nBung nở từ lòng sách
    }
    
    CONTENT_POPUP --> FULLY_OPEN: Timer 950ms (Hoàn tất)
    
    state FULLY_OPEN {
        note right of Idle: Người dùng xem và thao tác bình thường
    }
    
    FULLY_OPEN --> CONTENT_FOLDING: Click "Gập Sổ" / Đóng
    
    state CONTENT_FOLDING {
        direction LR
        [*] --> FadeOutInfo
        note right of CloseInfo: Thu gọn cửa sổ thông tin trước (0 - 200ms)
    }
    
    CONTENT_FOLDING --> BOOK_CLOSING: Timer 200ms
    
    state BOOK_CLOSING {
        direction LR
        [*] --> FlapCoverHingeClose
        note right of CloseBook: Bìa sách 3D gập lại về gáy (200ms - 550ms)
    }
    
    BOOK_CLOSING --> CLOSED: Timer 550ms (Unmount sạch sẽ)
```

---

## 3. Đặc tả Chi tiết Thành phần Giao diện & Kỹ thuật

### 3.1. Bìa sách lúc đóng & hoạt ảnh mở bìa (`VirtualLedgerBook`)
- **Bìa sách trước (Front Cover Flap):**
  - Khi bắt đầu mở: Bìa da nâu gập kín (`rotateY(0deg)` ở vị trí đóng), che phủ toàn bộ nội dung.
  - Trên bìa có:
    - Viền may chỉ vàng giả da dập nổi.
    - Huy hiệu đồng hoặc nhãn giấy phong cách sổ bìa da cổ điển: *"SỔ QUẢN LÝ PHÒNG — TOÀ NHÀ F04"*.
  - Hoạt ảnh lật mở (`bookCoverOpenAnimation`): Bìa trước lật mở quanh trục lề trái từ `rotateY(0deg)` $\rightarrow$ `rotateY(-180deg)` (hoặc phối cảnh perspective xoay mở mượt mà).
  - Khi bìa mở ra, lộ ra 2 trang sổ trắng ngà (`#FAF7EE`) có đường gáy sách đổ bóng 3D chân thực.

### 3.2. Cửa sổ thông tin phòng (`RoomDetailSinglePage` & `f04-interactive-panel`)
- **Trạng thái ẩn trong Phase 1:**
  - `data-content-stage="HIDDEN"`: `opacity: 0`, `pointer-events: none`, `transform: translateY(20px) scale(0.95)`.
- **Trạng thái bung nở trong Phase 2:**
  - `data-content-stage="POPPING_UP"` / `"VISIBLE"`:
  - Hoạt ảnh CSS `@keyframes popUpContentRise`:
    - `0%`: `opacity: 0; transform: translateY(25px) scale(0.92);`
    - `70%`: `opacity: 1; transform: translateY(-4px) scale(1.01);`
    - `100%`: `opacity: 1; transform: translateY(0px) scale(1);`
  - Thời gian: `400ms`, curve: `cubic-bezier(0.16, 1, 0.3, 1)`.
- **Vị trí và thẩm mỹ:**
  - Bảng thông tin phòng (các thẻ: Chỉ số điện nước, Tải ảnh hoá đơn, VietQR Offline, Báo hỏng thiết bị, Sao uy tín) trồi lên tuần tự, tạo cảm giác như một khối mô hình sách pop-up bung nở đứng dậy từ giữa trang sổ.

### 3.3. Tương thích & Bảo toàn Kiến trúc
- **Tập trung vào UI Layer:** Toàn bộ logic diễn hoạt nằm tại `packages/renderer-2d` và `apps/web`.
- **0% thay đổi** trong `packages/shared-types` (`common`).
- **Giữ nguyên 100% các ID, test-ids, accessibility** (`data-testid="f04-interactive-panel"`, `data-testid="room-detail-single-page"`, `data-testid="virtual-ledger-book"`...).
