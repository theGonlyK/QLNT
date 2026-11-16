# KẾ HOẠCH TRIỂN KHAI: HIỆU ỨNG CHUYỂN CẢNH MỞ SỔ 3D TUẦN TỰ (SÁCH MỞ RA TRƯỚC -> CỬA SỔ THÔNG TIN HIỂN THỊ SAU)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Hiện thực hóa hiệu ứng chuyển cảnh 2 giai đoạn tuần tự khi người dùng mở sổ phòng F04: Quyển sách 3D lật mở ra trước (0 - 550ms, cửa sổ thông tin ẩn hoàn toàn), sau khi sách mở phẳng hoàn tất thì cửa sổ thông tin phòng mới xuất hiện bằng hiệu ứng Pop-up 3D trồi lên từ trang sách (550ms - 950ms). Khi đóng/gập sổ, cửa sổ thông tin thu gọn trước rồi bìa sách mới gập lại.

**Architecture:** Mở rộng máy trạng thái chuyển cảnh trong `LedgerOverlayHost` (`@qlnt/web`) và `VirtualLedgerBook` (`@qlnt/renderer-2d`) thành 5 pha rõ ràng: `CLOSED` $\rightarrow$ `BOOK_OPENING` (chỉ diễn hoạt bìa sách lật mở) $\rightarrow$ `CONTENT_POPUP` (kích hoạt pop-up trồi lên cho cửa sổ thông tin) $\rightarrow$ `FULLY_OPEN` (người dùng tương tác) $\rightarrow$ `CONTENT_FOLDING` (thu gọn panel thông tin) $\rightarrow$ `BOOK_CLOSING` (gập bìa sách) $\rightarrow$ `CLOSED`.

**Architecture Diagram:**

```mermaid
graph TD
    subgraph "App Stage (3D Canvas / Cutaway / HUD)"
        A[Click Phòng / Click 'Mở Sổ F04'] -->|isBookOpen = true| B[LedgerOverlayHost]
    end

    subgraph "Phase 1: 0ms - 550ms (Quyển Sách Mở Ra)"
        B --> C[VirtualLedgerBook: animationState = 'opening']
        C --> D[Front Cover Flap Xoay Mở 3D Perspective]
        C --> E[Cửa Sổ Thông Tin: HIDDEN opacity = 0]
    end

    subgraph "Phase 2: 550ms - 950ms (Cửa Sổ Thông Tin Hiển Thị)"
        D -->|Timer 550ms| F[Trạng thái: CONTENT_POPUP]
        F --> G[Trang Chi Tiết Phòng RoomDetail Pop-up Trồi Lên]
        F --> H[f04-interactive-panel Bung Nở Pop-up Slide-Up]
    end

    subgraph "Pha Tương Tác: FULLY_OPEN"
        G --> I[Người Dùng Xem Số Liệu / Chốt Số / VietQR]
        H --> I
    end

    subgraph "Pha Đóng / Gập Sổ (Reverse Transition)"
        I -->|Click 'Gập Sổ (3D)'| J[CONTENT_FOLDING 180ms: Panel Thu Gọn]
        J --> K[BOOK_CLOSING 350ms: Bìa Sách Gập Về Gáy]
        K --> L[Unmount Overlay & Trả Focus Về 3D Scene]
    end
```

**Tech Stack:** React 19, TypeScript, CSS 3D Transforms (`perspective`, `rotateY`, `transform-origin: left center`, `preserve-3d`), Vitest, Playwright (Google Chrome Headless).

**Spec:** [SPEC_CHUYEN_CANH_MO_SO_TRUOC_HIEN_THI_THONG_TIN_SAU.md](file:///Users/minhntv/Documents/Work/MinhNTV/TEAM_ORCA/4.Du_an/QLNT/01-quan-ly/SPEC_CHUYEN_CANH_MO_SO_TRUOC_HIEN_THI_THONG_TIN_SAU.md)

## Global Constraints
- **0% thay đổi** trong `packages/shared-types` (`common`).
- Tất cả unit tests ($181/181$) và Playwright E2E suites ($8/8$) phải tiếp tục PASS 100%.
- Giữ nguyên toàn bộ `data-testid` để không phá vỡ bất kỳ test case hiện có nào (`f04-interactive-panel`, `room-detail-single-page`, `virtual-ledger-book`, `close-ledger-book-btn`...).
- Tài liệu và mã nguồn tuân thủ tiêu chuẩn tiếng Việt theo quy định của `TEAM_ORCA`.

---

## Bảng Đánh Giá Vùng Ảnh Hưởng (Impact Assessment)

| STT | Khu vực / Module | Tệp tin ảnh hưởng | Mức độ ảnh hưởng | Nội dung thay đổi | Biện pháp kiểm soát rủi ro |
|---|---|---|---|---|---|
| 1 | **Common (`packages/shared-types`)** | Không có | **0% (Không ảnh hưởng)** | Giữ nguyên 100% schema, types, interfaces hiện tại. | Nghiêm cấm sửa đổi thư mục `packages/shared-types`. |
| 2 | **Renderer 2D (`@qlnt/renderer-2d`)** | `packages/renderer-2d/src/components/ledger/VirtualLedgerBook.tsx` | Trung bình | Bổ sung `contentStage?: 'hidden' \| 'popping' \| 'visible' \| 'folding'` hoặc tự điều phối delay sau khi bìa sách mở hoàn tất. Thêm bìa da mặt trước `book-front-cover-flap` xoay mở chân thực. | Bảo đảm fallback mặc định hiển thị bình thường nếu không truyền prop; unit test xác minh style 3D. |
| 3 | **Web UI Host (`@qlnt/web`)** | `apps/web/src/components/LedgerOverlayHost.tsx` | Trung bình | Cập nhật bộ điều phối `animationState`: `OPENING` (0-550ms: chỉ sách mở, panel thông tin `data-stage="hidden"`), sau đó kích hoạt `CONTENT_POPUP` (550-950ms: panel thông tin trồi lên). Khi đóng: thu gọn panel (180ms) $\rightarrow$ gập sách (350ms). | Đảm bảo các action chốt số, duyệt bill, QR hoạt động trơn tru sau khi pop-up mở xong. |
| 4 | **Kiểm thử Unit Tests** | `packages/renderer-2d/test/virtualLedgerBook.test.ts`, `apps/web/tests/uiAndResponsive.test.ts` | Thấp | Bổ sung test case kiểm tra thuộc tính `data-content-stage` trong các pha chuyển cảnh. | Chạy toàn bộ 181 unit tests tự động để đảm bảo không hồi quy. |
| 5 | **Kiểm thử E2E Playwright** | `apps/web/e2e/p1-flows.spec.ts` | Thấp | Cập nhật test case số 8: xác minh tại $t=200\text{ms}$ panel thông tin đang ẩn hoặc đang mở bìa, tại $t=700\text{ms}+$ panel thông tin đã hiển thị và sẵn sàng tương tác. Chụp ảnh nghiệm thu chuyển cảnh. | Chạy Playwright trên Google Chrome kiểm tra zero console error. |

---

## Danh Sách Task Chi Tiết

### Task 1: Nâng cấp `VirtualLedgerBook` với bìa da 3D và quản lý hiển thị tuần tự nội dung trang
**Files:**
- Modify: `packages/renderer-2d/src/components/ledger/VirtualLedgerBook.tsx`
- Test: `packages/renderer-2d/test/virtualLedgerBook.test.ts`

**Interfaces:**
- Consumes: `VirtualLedgerBookProps`
- Produces: `contentStage?: 'hidden' | 'popping' | 'visible' | 'folding'`, bìa sách trước `book-front-cover-flap` với hoạt ảnh lật mở mượt mà.

- [ ] **Step 1: Viết failing test cho `contentStage` và `book-front-cover-flap`**
  Cập nhật `packages/renderer-2d/test/virtualLedgerBook.test.ts` để kiểm tra khi `contentStage = 'hidden'`, nội dung `<main>` có class hoặc style ẩn; khi `contentStage = 'visible'` hoặc `'popping'` thì hiển thị.
- [ ] **Step 2: Chạy test để xác nhận FAIL**
  `pnpm --filter @qlnt/renderer-2d test`
- [ ] **Step 3: Triển khai hiệu ứng bìa sách 3D và điều khiển ẩn/hiện trang sách tuần tự**
  Thêm bìa da mặt trước (flap lật mở 3D) và điều chỉnh CSS `@keyframes pagePopUpUnfold` được kích hoạt theo `contentStage`.
- [ ] **Step 4: Chạy lại test để xác nhận PASS**
  `pnpm --filter @qlnt/renderer-2d test`
- [ ] **Step 5: Commit Git**
  `git commit -m "feat(renderer-2d): nang cap bia sach 3d va hieu ung tuan tu cho VirtualLedgerBook"`

---

### Task 2: Điều phối chu trình 2 giai đoạn chuyển cảnh trong `LedgerOverlayHost`
**Files:**
- Modify: `apps/web/src/components/LedgerOverlayHost.tsx`
- Test: `apps/web/tests/uiAndResponsive.test.ts`

**Interfaces:**
- Quản lý timeline:
  - $0\text{ms} - 550\text{ms}$: Sách lật mở bìa (`bookAnimState = 'opening'`). Cửa sổ thông tin (`f04-interactive-panel`) ở trạng thái ẩn (`opacity-0 pointer-events-none`).
  - $550\text{ms} - 950\text{ms}$: Sách mở phẳng. Cửa sổ thông tin kích hoạt `@keyframes popUpContentRise` (trồi lên từ trang sách kèm shadow mềm mại, `opacity: 1`, `pointer-events: auto`).
  - Khi người dùng bấm "Gập Sổ (3D)": Cửa sổ thông tin thu gọn (180ms) $\rightarrow$ Bìa sách gập về gáy (350ms) $\rightarrow$ Đóng overlay hoàn toàn.

- [ ] **Step 1: Viết test cho máy trạng thái chu trình 2 giai đoạn trong `LedgerOverlayHost`**
- [ ] **Step 2: Chạy test để xác nhận FAIL**
  `pnpm --filter @qlnt/web test`
- [ ] **Step 3: Hiện thực hóa logic điều phối 2 giai đoạn và CSS 3D Pop-up**
- [ ] **Step 4: Chạy test để xác nhận PASS**
  `pnpm --filter @qlnt/web test`
- [ ] **Step 5: Commit Git**
  `git commit -m "feat(web-ui): dieu phoi chu trinh chuyen canh 2 giai doan sach mo truoc cua so thong tin hien sau"`

---

### Task 3: Chạy toàn bộ Unit Tests & tích hợp Build
**Files:**
- Toàn bộ 5 packages

- [ ] **Step 1: Chạy build toàn hệ thống**
  `pnpm build`
- [ ] **Step 2: Chạy toàn bộ unit tests**
  `pnpm test` (kỳ vọng 181/181 tests PASS)
- [ ] **Step 3: Commit Git**
  `git commit -m "test: bao dam 100% unit tests pass sau khi nang cap chuyen canh mo so tuan tu"`

---

### Task 4: Cập nhật Playwright Chrome E2E Test & Chụp ảnh nghiệm thu
**Files:**
- Modify: `apps/web/e2e/p1-flows.spec.ts`

- [ ] **Step 1: Cập nhật test case số 8 trong `p1-flows.spec.ts`**
  Kiểm tra tại $t = 250\text{ms}$ khi sách đang mở: panel thông tin ở trạng thái đang ẩn / chờ pop-up.
  Kiểm tra tại $t = 800\text{ms}$: panel thông tin đã trồi lên hoàn chỉnh, hiển thị đầy đủ các nút bấm chốt số / hóa đơn.
  Chụp ảnh nghiệm thu:
  - `14-3d-book-stage1-opening.png`: Sách đang mở bìa (chưa có cửa sổ thông tin).
  - `15-3d-book-stage2-popup-revealed.png`: Cửa sổ thông tin bung nở trồi lên từ sách hoàn chỉnh.
- [ ] **Step 2: Chạy Playwright test suite**
  `pnpm --filter @qlnt/web exec playwright test`
- [ ] **Step 3: Commit Git**
  `git commit -m "test(e2e): kiem thu tu dong chuyen canh mo so truoc hien thong tin sau va chup anh nghiem thu"`
