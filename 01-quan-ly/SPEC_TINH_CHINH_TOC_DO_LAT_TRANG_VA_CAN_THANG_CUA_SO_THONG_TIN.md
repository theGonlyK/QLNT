# ĐẶC TẢ KỸ THUẬT & UX (SPEC): LÀM CHẬM HOẠT ẢNH LẬT TỪNG TRANG SÁCH & CĂN THẲNG VUÔNG VỨC CỬA SỔ THÔNG TIN PHÒNG

- **Dự án:** Quản Lý Nhà Trọ 3D (`QLNT`) — Phân hệ Sổ Quản Lý Ảo `F04`
- **Ngày lập:** 2026-11-16
- **Trạng thái:** Dự thảo chờ Chủ dự án xác nhận
- **Ràng buộc kiến trúc:**
  - Tuân thủ tuyệt đối `NT-01` (Headless Core độc lập) và khuyến nghị UX tại `REF_SO_QUAN_LY_AO_3D.md` (góc nhìn trực diện phẳng `Orthographic / Flat view` khi đọc và nhập liệu thông tin phòng).
  - **0% thay đổi** trong `packages/shared-types` (`common`).

---

## 1. Phân Tích Nguyên Nhân Hiện Trạng & Yêu Cầu Tinh Chỉnh

### 1.1. Vì sao cửa sổ thông tin sau khi mở bị hiển thị "xiêu vẹo"?
Qua kiểm tra ảnh nghiệm thu `19-3d-book-room-info-page-revealed.png` và mã nguồn `VirtualLedgerBook.tsx`:
1. **Góc xoay lệch trục cố định ở trạng thái `open`:**
   - Hiện tại, khi `animationState === 'open'`, thẻ gốc `VirtualLedgerBook` vẫn bị áp cứng `transformOrigin: 'left top'` kèm `transform: 'rotateX(16deg) rotateY(-2deg)'`.
   - Việc xoay đồng thời cả 2 trục `rotateX(16deg)` và `rotateY(-2deg)` quanh điểm neo góc trái trên (`left top`) làm toàn bộ khung sổ bị kéo lệch thành một hình thang méo về bên phải: thanh tiêu đề trên cùng bị dốc chéo xuống, cạnh trái và cạnh phải không đối xứng, chữ viết và các ô nhập liệu bị nghiêng lệch ("xiêu vẹo").
2. **Giải pháp triệt để:**
   - Đổi điểm neo của cuốn sổ về chính giữa (`transformOrigin: 'center center'`), loại bỏ hoàn toàn góc nghiêng lệch `rotateY(-2deg)`.
   - Khi sách đang mở (`animationState === 'opening'`), cuốn sách chỉ hơi nghiêng đối xứng nhẹ (`rotateX(10deg)`) và **tự động cân bằng về góc phẳng trực diện hoàn toàn (`transform: 'none'` / `rotateX(0deg) rotateY(0deg)`) ngay khi mở xong (`animationState === 'open'`)**.
   - Cả trang trái, trang phải (`popup-standup-card`) và bảng điều khiển tương tác (`f04-interactive-panel`) khi ở trạng thái `contentStage === 'visible'` đều nằm phẳng trực diện 100% (`rotateX(0deg) scale(1)`), các cạnh ngang/dọc vuông góc $90^\circ$ sắc nét, dễ đọc và dễ thao tác.

### 1.2. Vì sao hiệu ứng mở sách và lật trang quá nhanh?
1. **Thời lượng hiện tại quá ngắn (`550ms`):**
   - Toàn bộ nắp bìa và 3 tờ trang sách (`book-flip-sheet-1..3`) hoàn tất lật mở chỉ trong `0.55 giây` (`70ms`, `140ms`, `210ms`), khiến mắt người chưa kịp nhìn rõ từng trang giấy đang lật qua gáy sách.
2. **Giải pháp làm chậm nhịp hoạt ảnh (~2.5 lần, mượt mà và rõ nét):**
   - **Pha 1 & 2 — Mở nắp bìa & Lật từng trang sách (`0ms – 1400ms`, tổng `1.4 giây`):**
     - **Nắp bìa cứng (`book-front-cover-flap`):** Mở từ `0ms` trong **`750ms`** (`0ms → 750ms`).
     - **Trang lật 1 (`book-flip-sheet-1` — Trang Mục Lục 6 ô màu):** Bắt đầu ở `220ms`, lật chậm trong **`800ms`** (`220ms → 1020ms`).
     - **Trang lật 2 (`book-flip-sheet-2` — Trang Sơ Đồ Tầng):** Bắt đầu ở `450ms`, lật chậm trong **`750ms`** (`450ms → 1200ms`).
     - **Trang lật 3 (`book-flip-sheet-3` — Trang Dẫn Nhập Hồ Sơ):** Bắt đầu ở `680ms`, lật chậm trong **`720ms`** (`680ms → 1400ms`).
   - **Pha 3 — Hiện Cửa Sổ Thông Tin Phòng Ngay Ngắn (`1400ms – 2100ms`, thời lượng `700ms`):**
     - Đúng mốc `1400ms` (khi tờ giấy thứ 3 vừa đáp xuống hoàn tất), cuốn sách cân bằng về tư thế phẳng trực diện `0deg`, đồng thời kích hoạt `contentStage = 'popping'` trong **`700ms`** (`1400ms → 2100ms`) trước khi sang `'visible'`.
   - **Lật trang nội bộ khi chọn phòng / chuyển tầng (`innerPageTurnFlip`):**
     - Tăng thời lượng từ `420ms` lên **`750ms`** để động tác lật trang trong sổ khoan thai, rõ ràng.
   - **Chu trình Gập Sổ Ngược (`Closing`, tổng `1000ms`):**
     - Giai đoạn 1 (`0ms – 400ms`): Thu gọn cửa sổ thông tin (`400ms`).
     - Giai đoạn 2 (`400ms – 1000ms`): Quạt gập ngược các trang sách và đóng bìa (`600ms`).

---

## 2. Bảng So Sánh Thông Số Trước & Sau Tinh Chỉnh

| Hạng mục | Trước tinh chỉnh | Sau tinh chỉnh | Mục đích UX |
|---|---|---|---|
| **Điểm neo khung sổ (`transformOrigin`)** | `'left top'` (lệch góc trái trên) | `'center center'` (chính tâm đối xứng) | Loại bỏ hiện tượng méo khung về một phía. |
| **Góc khung sổ sau khi mở (`animationState = 'open'`)** | `rotateX(16deg) rotateY(-2deg)` (nghiêng & vẹo) | `rotateX(0deg) rotateY(0deg)` (thẳng phẳng 100%) | Cửa sổ thông tin vuông vức, không xiêu vẹo, chữ sắc nét. |
| **Thời gian mở bìa & lật 3 trang sách (Pha 1 & 2)** | `550ms` (0.55 giây) | **`1400ms` (1.40 giây)** | Nhìn rõ từng trang giấy (Mục lục, Sơ đồ tầng, Hồ sơ) lật qua gáy sách. |
| **Độ trễ & thời lượng từng trang lật (`Sheet 1 / 2 / 3`)** | `70ms / 140ms / 210ms` (dài `340–390ms`) | **`220ms / 450ms / 680ms` (dài `720–800ms`)** | Tách nhịp rõ ràng giữa từng tờ trang sách. |
| **Thời gian hiện cửa sổ thông tin (Pha 3 `popping`)** | `500ms` (`550ms → 1050ms`) | **`700ms` (`1400ms → 2100ms`)** | Chuyển tiếp êm ái, đĩnh đạc sau khi lật trang xong. |
| **Thời gian lật trang nội bộ (`isPageTurning`)** | `420ms` | **`750ms`** | Lật trang chuyển phòng/tầng chậm rãi, tự nhiên. |

---

## 3. Bảng Đánh Giá Vùng Ảnh Hưởng (Impact Assessment)

| STT | Khu vực / Module | Tệp tin ảnh hưởng | Mức độ ảnh hưởng | Nội dung thay đổi | Biện pháp kiểm soát rủi ro |
|---|---|---|---|---|---|
| 1 | **Common (`packages/shared-types`)** | *Không có* | **0% (Không ảnh hưởng)** | Giữ nguyên 100% schema và types. | Tuyệt đối không chỉnh sửa `packages/shared-types`. |
| 2 | **Renderer 2D (`@qlnt/renderer-2d`)** | `packages/renderer-2d/src/components/ledger/VirtualLedgerBook.tsx` | **Trung bình** | Chuyển `transformOrigin` về `'center center'`, đặt góc khi `open` là `'rotateX(0deg) rotateY(0deg)'` (vuông vức 100%); tăng thời lượng mở sách & lật 3 trang lên `1400ms`, `popping` lên `700ms`, lật nội bộ lên `750ms`. | Cập nhật đồng bộ unit tests trong `virtualLedgerBook.test.ts`. |
| 3 | **Web UI Host (`@qlnt/web`)** | `apps/web/src/components/LedgerOverlayHost.tsx` | **Thấp** | Cập nhật bộ định thời mở sổ (`openTimer1: 1400ms`, `openTimer2: 2100ms`), lật trang nội bộ (`750ms`), và thời lượng đóng sổ mặc định. | Giữ tương thích với tham số tùy chọn trong `closeLedgerStagedWithTransition`. |
| 4 | **Unit Tests** | `packages/renderer-2d/test/virtualLedgerBook.test.ts`, `apps/web/tests/uiAndResponsive.test.ts` | **Thấp** | Xác minh `transform: 'rotateX(0deg) rotateY(0deg)'`, `transformOrigin: 'center center'` ở trạng thái `open` và các mốc thời lượng mới. | Đảm bảo 100% unit tests PASS. |
| 5 | **Playwright E2E Tests** | `apps/web/e2e/p1-flows.spec.ts` | **Thấp** | Kiểm thử tại `t = 550ms` (giữa pha lật từng trang `1400ms`) các tờ trang đang lật mở và thông tin phòng đang ẩn; sau `2100ms` cửa sổ thông tin hiện phẳng vuông vức (`0deg`). Chụp ảnh nghiệm thu mới. | Tăng nhẹ timeout chờ mở hoàn tất (`timeout: 4000`) để phù hợp hoạt ảnh chậm `2100ms`. |

---

## 4. Tiêu Chí Nghiệm Thu (Definition of Done - DoD)

1. Hoạt ảnh mở bìa và lật từng trang sách diễn ra chậm rãi trong **`1400ms` (1.4 giây)**, tách nhịp rõ rệt giữa Nắp bìa (`0ms`), Tờ 1 (`220ms`), Tờ 2 (`450ms`), Tờ 3 (`680ms`).
2. Sau khi mở xong (`animationState === 'open'`, `contentStage === 'visible'`), toàn bộ cuốn sổ và cửa sổ thông tin phòng hiển thị **thẳng, phẳng, vuông vức tuyệt đối (`rotateX(0deg) rotateY(0deg)`, `transformOrigin: 'center center'`)**, không còn bị nghiêng lệch hay xiêu vẹo.
3. Toàn bộ Unit Tests và 8/8 Playwright Chrome E2E Suites đạt PASS 100%, kèm 2 ảnh chụp nghiệm thu thực tế (`20-3d-book-slow-page-flip-midway.png` và `21-3d-book-opened-straight-aligned-room-info.png`).
