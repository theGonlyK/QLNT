# ĐẶC TẢ KỸ THUẬT & UX (SPEC): HOẠT ẢNH QUYỂN SÁCH MỞ RA TỪNG TRANG SÁCH SAU ĐÓ MỚI TỚI TRANG THÔNG TIN PHÒNG

- **Dự án:** Quản Lý Nhà Trọ 3D (`QLNT`) — Phân hệ Sổ Quản Lý Ảo `F04`
- **Ngày lập:** 2026-11-16
- **Trạng thái:** Dự thảo chờ Chủ dự án xác nhận
- **Nguồn tham chiếu trực quan:** Video TikTok `https://vt.tiktok.com/ZSpb4UNd8/` (`@dealonai/video/7700936172813487412`, khung hình `t = 2.50s` đến `t = 4.50s`)
- **Ràng buộc kiến trúc:**
  - Tuân thủ tuyệt đối `NT-01` (Headless Core độc lập).
  - **0% thay đổi** trong `packages/shared-types` (`common`).
  - Duy trì 100% tương thích ngược với bộ 181 Unit Tests và 8 Playwright E2E Test Suites hiện hành.

---

## 1. Phân Tích Chi Tiết Chuỗi Hoạt Ảnh Từ Video Gốc (`t = 2.50s` → `t = 4.50s`)

Qua trích xuất từng khung hình liên tiếp cách nhau `0.2s` của đoạn mở sách trong video mẫu (`video-page-flip-2.png` → `video-page-flip-8.png`), cơ chế vật lý của cuốn sách diễn ra theo **3 pha nối tiếp rõ rệt**:

1. **Pha 1 — Quyển Sách Đóng & Mở Nắp Bìa Cứng (`0ms – 380ms`):**
   - Cuốn sách có bìa cứng màu vàng hổ phách, gáy sách dày, cạnh phải lộ rõ khối trang giấy trắng xếp chồng (`book-page-block-edges`) và dây ruy-băng đánh dấu trang màu xanh đậm (`book-ribbon-bookmark`) thò ra ở khe dưới gáy sách.
   - Nắp bìa trước (`book-front-cover-flap`) bắt đầu lật mở từ `0°` sang `-180°` quanh lề gáy sách.

2. **Pha 2 — Lật Mở Từng Trang Sách Nối Tiếp Nhau (`70ms – 550ms`, Staggered Page-by-Page Fanning):**
   - Ngay khi nắp bìa vừa nhấc lên, **từng tờ trang sách bên trong không nằm im mà lần lượt lật mở nối tiếp nhau như cánh quạt giấy (fanning pages)** từ phải sang trái:
     - **Trang lật 1 (`book-flip-sheet-1` — Trang Mục Lục / `Contents`):** Bắt đầu lật ở `70ms` (`rotateY(0deg -> -180deg)`). Mặt trang in tiêu đề *"MỤC LỤC HỒ SƠ TÒA NHÀ F04 (CONTENTS)"*, danh sách chương mục các tầng và **6 ô vuông màu sắc trực quan** (Xanh lam, Tím, Hồng, Xanh lá, Đỏ cam, Vàng — giống hệt tờ `Contents` trong khung hình `video-page-flip-4.png`).
     - **Trang lật 2 (`book-flip-sheet-2` — Trang Tổng Quan Mặt Bằng Tầng):** Bắt đầu lật nối tiếp ở `140ms` (`rotateY(0deg -> -180deg)`), tạo khoảng tách lớp 3D giữa các tờ giấy đang bay trong không trung (`-75°`, `-40°`, `-15°` như khung hình `video-page-flip-5.png`).
     - **Trang lật 3 (`book-flip-sheet-3` — Trang Chuyển Tiếp Hồ Sơ Phòng):** Bắt đầu lật ở `210ms` và đáp xuống phẳng phiu lúc `550ms`, mặt sau in thông tin văn bản của trang trái để lộ ra **Trang Thông Tin Phòng**.
   - Trong suốt Pha 1 & Pha 2 (`0ms – 550ms`), **Trang Thông Tin Phòng** (`virtual-ledger-book-main`, `popup-standup-card`, `f04-interactive-panel`) được giữ ở trạng thái `contentStage = 'hidden'` để người dùng thưởng thức trọn vẹn hiệu ứng quyển sách mở ra từng trang giấy.

3. **Pha 3 — Hiện Trang Thông Tin Phòng & Bung Pop-Up 3D Dựng Đứng (`550ms – 1050ms`):**
   - Ngay khi tờ giấy thứ 3 vừa đáp xuống hoàn tất (`550ms`), cuốn sách dừng ở tư thế Mở Đôi Hai Trang (`Two-Page Spread`, khung hình `video-page-flip-6.png`).
   - Lúc này mới tới **Trang Thông Tin Phòng**:
     - **Trang Trái (`book-page-left`):** Hiện rõ hồ sơ địa chính phòng, thông tin khách thuê và chỉ số công tơ điện nước.
     - **Trang Phải (`book-page-right`) & Bảng Điều Khiển (`f04-interactive-panel`):** Chuyển sang `contentStage = 'popping'` rồi `'visible'`, kích hoạt hoạt ảnh `@keyframes popUpStandUp` bật dựng đứng $90^\circ$ vuông góc khỏi mặt giấy kèm bóng đổ `popup-shadow-ground` loang rộng trên mặt trang giấy (khung hình `video-page-flip-7.png` & `8.png`).

4. **Hiệu Ứng Lật Trang Khi Chuyển Từ Mặt Bằng Tầng Sang Thông Tin Phòng (`In-Book Page Turn`):**
   - Khi cuốn sổ đang mở ở chế độ Mặt bằng tầng (`floor-map`) và người dùng nhấn vào một Phòng để mở **Trang Thông Tin Phòng** (hoặc khi chuyển đổi giữa các Tầng / các Trang 1-2-3 của phòng), một tờ giấy chuyển trang (`book-inner-turning-sheet`) sẽ thực hiện hoạt ảnh lật trang `@keyframes innerPageTurnFlip` (`420ms`) qua gáy sách trước khi trang thông tin phòng mới hiện định hình.

5. **Chu Trình Gập Sổ Ngược (`Reverse Staged Closing`, `0ms – 600ms`):**
   - **Giai đoạn 1 (`0ms – 250ms`, `contentStage = 'folding'`):** Thẻ thông tin phòng và bảng tương tác gập bẹp nằm sát xuống mặt trang giấy (`rotateX(0deg -> -90deg)`).
   - **Giai đoạn 2 (`250ms – 600ms`, `animationState = 'CLOSING'`):** Các tờ giấy (`book-flip-sheet-3 -> 2 -> 1`) cùng nắp bìa (`book-front-cover-flap`) quạt ngược từ trái về phải (`rotateY(-180deg -> 0deg)`) đóng kín cuốn sổ lại trước khi unmount.

---

## 2. Cấu Trúc DOM & Thuộc Tính Kiểm Thử (`data-testid`)

Trong `VirtualLedgerBook.tsx` (`@qlnt/renderer-2d`):
- `data-testid="book-front-cover-flap"`: Nắp bìa cứng mặt trước lật mở đầu tiên (`0ms – 380ms`).
- `data-testid="book-flip-pages-stack"`: Khung chứa tập các trang sách lật mở nối tiếp nhau (`pointer-events-none`, `transform-style: preserve-3d`).
  - `data-testid="book-flip-sheet-1"`: Tờ trang 1 — Trang Mục Lục (`Contents` với 6 ô vuông màu sắc như video gốc, lật từ `70ms – 460ms`).
  - `data-testid="book-flip-sheet-2"`: Tờ trang 2 — Trang Sơ Đồ Kỹ Thuật & Tổng Quan Tầng (lật từ `140ms – 530ms`).
  - `data-testid="book-flip-sheet-3"`: Tờ trang 3 — Trang Dẫn Nhập Hồ Sơ Địa Chính Phòng (lật từ `210ms – 550ms`).
- `data-testid="book-page-block-edges"`: Hiệu ứng độ dày các lớp giấy trắng xếp chồng ở mép cuốn sách.
- `data-testid="book-ribbon-bookmark"`: Dải ruy-băng đánh dấu trang màu xanh navy thò ra ở cạnh dưới gáy sách (chuẩn theo video gốc).
- `data-testid="book-inner-turning-sheet"`: Tờ giấy lật chuyển cảnh nội bộ khi người dùng chuyển từ trang Sơ đồ tầng sang trang Thông tin phòng (hoặc đổi tầng/tab).

---

## 3. Bảng Đánh Giá Vùng Ảnh Hưởng (Impact Assessment)

| STT | Khu vực / Module | Tệp tin ảnh hưởng | Mức độ ảnh hưởng | Nội dung thay đổi | Biện pháp kiểm soát rủi ro |
|---|---|---|---|---|---|
| 1 | **Common (`packages/shared-types`)** | *Không có* | **0% (Không ảnh hưởng)** | Giữ nguyên 100% schema và interfaces hiện tại. | Tuyệt đối không chỉnh sửa `packages/shared-types`. |
| 2 | **Renderer 2D (`@qlnt/renderer-2d`)** | `packages/renderer-2d/src/components/ledger/VirtualLedgerBook.tsx` | **Trung bình** | Bổ sung tập 3 trang giấy lật lệch pha (`book-flip-sheet-1..3`), trang Mục lục 6 ô màu giống video, độ dày mép giấy (`book-page-block-edges`), dây ruy-băng (`book-ribbon-bookmark`), và tờ lật nội bộ (`book-inner-turning-sheet`) khi chuyển sang trang thông tin phòng. | Giữ nguyên toàn bộ props và `data-testid` hiện hữu; bổ sung unit tests kiểm tra từng tờ trang lật. |
| 3 | **Web UI Host (`@qlnt/web`)** | `apps/web/src/components/LedgerOverlayHost.tsx` | **Thấp** | Tinh chỉnh đồng bộ chu trình mở từng trang sách (`0ms – 550ms`) trước khi kích hoạt hiển thị & dựng đứng trang thông tin phòng (`550ms – 1050ms`). | Bảo toàn 100% logic chốt số điện nước, VietQR offline, duyệt bill và nhật ký kiểm toán. |
| 4 | **Unit Tests** | `packages/renderer-2d/test/virtualLedgerBook.test.ts`, `apps/web/tests/uiAndResponsive.test.ts` | **Thấp** | Bổ sung unit test xác minh cấu trúc 3 tờ trang sách lật tuần tự (`book-flip-sheet-1..3`), ruy-băng, mép giấy và lật trang nội bộ. | Chạy toàn bộ 181+ unit tests đảm bảo 100% PASS. |
| 5 | **Playwright E2E Tests** | `apps/web/e2e/p1-flows.spec.ts` | **Thấp** | Kiểm thử tự động trên Chrome: xác minh tại pha mở sách các tờ `book-flip-sheet-1..3` đang lật và trang thông tin phòng đang ẩn; sau khi lật xong từng trang mới hiện trang thông tin phòng. Chụp ảnh nghiệm thu thực tế. | Zero console errors, zero page errors, zero external network requests. |

---

## 4. Tiêu Chí Nghiệm Thu (Definition of Done - DoD)

1. Khi bấm mở sổ (hoặc bấm chọn phòng mở sổ), quyển sách mở nắp bìa và **lật mở từng trang sách nối tiếp nhau (`book-flip-sheet-1` → `book-flip-sheet-2` → `book-flip-sheet-3`)** với hiệu ứng cánh quạt 3D mượt mà giống hệt video TikTok (`video-page-flip-3.png` → `video-page-flip-5.png`).
2. Trong suốt quá trình từng trang sách đang lật mở (`0ms – 550ms`), trang thông tin phòng hoàn toàn chưa xuất hiện (`opacity: 0, pointer-events: none`).
3. Chỉ sau khi tờ trang sách cuối cùng lật mở xong (`≥ 550ms`), **Trang Thông Tin Phòng** mới hiện ra và dựng đứng thẻ Pop-up 3D (`popUpStandUp`) kèm bóng đổ trên mặt giấy.
4. Khi đang ở trong sổ và bấm chọn một phòng (chuyển từ Sơ đồ tầng sang Trang thông tin phòng) hoặc chuyển tầng, có hiệu ứng lật trang giấy (`book-inner-turning-sheet`) mượt mà.
5. 100% Unit Tests và 8/8 Playwright Chrome E2E Suites đạt PASS, kèm ảnh chụp nghiệm thu thực tế lưu tại thư mục Artifacts.
