# Hồ sơ kỹ thuật và môi trường — QLNT

Trạng thái: `Đề xuất mảng B (Dự thảo)` — cập nhật lộ trình đồ họa 2026-11-09; engine cụ thể và ngưỡng hiệu năng còn cần đánh giá kỹ thuật.

## 1. Phân loại kỹ thuật đã xác nhận

- **Mô hình kiến trúc:** SaaS Multi-tenant (đa chủ trọ, chia sẻ nền tảng và bản đồ chung; phân tách dữ liệu logic theo `landlord_id` / tenant).
- **Đích đồ họa:** Thế giới 3D với camera isometric cố định; không hỗ trợ xoay camera tự do trong phạm vi hiện tại.
- **Lộ trình đồ họa tăng dần:** (1) dựng prototype 3D bằng hình khối đơn giản; (2) MVP dùng hình khối và sprite/plane 2D trong không gian 3D để kiểm chứng nghiệp vụ và hiệu năng; (3) thay dần các thành phần có giá trị bằng object, vật liệu và hoạt ảnh 3D; (4) mở rộng chất lượng và phạm vi cảnh 3D theo kết quả thử nghiệm. 2.5D có thể là cách thể hiện trung gian, không phải đích cuối.
- **Yêu cầu cốt lõi về kiến trúc:** Dữ liệu và nghiệp vụ không phụ thuộc renderer/asset; bắt đầu bằng renderer và hệ tọa độ 3D để tránh phải thay engine khi nâng chất lượng hình ảnh. Có thể giữ nguyên phần lớn domain, nhưng renderer, asset, tương tác không gian, hiệu năng và kiểm thử vẫn cần thay đổi theo từng bước.
- **Client:** Web Responsive + Mobile App (đóng gói bằng Capacitor/PWA từ một codebase duy nhất, hỗ trợ Android & iOS).
- **Môi trường triển khai:** Local Dev → Cloud Staging/Production.

---

## 2. Kiến trúc giải pháp (Architecture Design)

Hệ thống được thiết kế theo mô hình phân tầng nghiêm ngặt (Strict Layered / Clean Architecture) để đảm bảo nguyên tắc `NT-01` (Lớp game tách rời Lớp dữ liệu thật):

```
+--------------------------------------------------------------------------+
|                       TẦNG HIỂN THỊ (PRESENTATION LAYER)                 |
|                                                                          |
|   [3D Renderer — prototype hình khối/sprite] ---> [3D Renderer — object 3D hoàn thiện] |
|                Camera isometric cố định; nâng dần asset và chi tiết cảnh                 |
|                 \                                              /         |
|                  +--------------------+-----------------------+          |
|                                       |                                  |
|                            [IGameRenderer Interface]                     |
|                   (Contract chuẩn: render, moveAvatar, ...)              |
+---------------------------------------^----------------------------------+
                                        | (Subscribes Domain Events)
+---------------------------------------v----------------------------------+
|                   TẦNG TRUNG GIAN SỰ KIỆN (EVENT BUS / BRIDGE)           |
|         Event Bus: EVT_ROOM_CLICKED, EVT_PAYMENT_VERIFIED, ...           |
+---------------------------------------^----------------------------------+
|                   TẦNG NGHIỆP VỤ LÕI (HEADLESS DOMAIN CORE)              |
|                                                                          |
|   - Quản lý trạng thái (State Store: Zustand / Pinia / TypeScript Core)  |
|   - Nghiệp vụ: Phòng, Tầng, Khách trọ, Thiết bị, Hóa đơn, Nhiệm vụ       |
|   - Gamification Engine: Tính điểm thưởng, trừ điểm, shop đổi quà        |
|   - Offline / Cache Manager: IndexedDB (Dexie.js)                        |
+---------------------------------------^----------------------------------+
                                        | (REST / WebSocket / Sync)
+---------------------------------------v----------------------------------+
|                      TẦNG HẠ TẦNG & DỮ LIỆU (BACKEND & SAAS)             |
|                                                                          |
|   - Cloud Database: PostgreSQL (Multi-tenant với Row-Level Security)     |
|   - Backend API: Node.js (NestJS / Fastify) hoặc BaaS (Supabase)        |
|   - Realtime WebSocket: Đồng bộ sự kiện giữa chủ nhà, khách trọ, sale    |
|   - Storage: Lưu trữ ảnh chụp bill chuyển khoản, ảnh phòng, avatar       |
+--------------------------------------------------------------------------+
```

### Chi tiết cơ chế "Dễ chuyển đổi đồ họa" (Pluggable Renderer):
1. **Headless Domain Core:** Toàn bộ dữ liệu thật và quy tắc nghiệp vụ (thêm khách, duyệt tiền, báo hỏng, trừ điểm, tính sao uy tín) được viết bằng Pure TypeScript / State Store độc lập hoàn toàn với Canvas/DOM.
2. **Interface `IGameRenderer`:** Định nghĩa tập lệnh trừu tượng cho game và phân hệ Sổ quản lý ảo F04 (chi tiết tại `02-nghiep-vu/DAC_TA_SO_QUAN_LY_AO_SINGLE_PAGE_VA_RENDERER.md`):
   - *Nhóm cảnh 3D tòa nhà & avatar:*
     - `renderBuilding(buildingData)`
     - `spawnAvatar(avatarId, roomPosition, skinConfig)`
     - `moveAvatar(avatarId, targetPosition, onComplete)`
     - `setDeviceStatus(roomId, deviceId, status: 'NORMAL' | 'BROKEN')` -> Hiển thị/tắt chấm than đỏ
     - `setRoomNotice(roomId, type: 'NONE' | 'PAYMENT_DUE' | 'BILL_PENDING')` -> Hiển thị/tắt chấm than vàng
     - `playMinigameAction(actionType, toolSkin)`
   - *Nhóm điều khiển Sổ quản lý ảo F04 (`QLNT-D010`..`QLNT-D013` — học hỏi từ `REF-BIZ-001`):*
     - `openLedgerBook(monthKey, initialFloorIndex, floorMapData)` -> Hoạt ảnh chủ nhà mở sổ quản lý tháng, hiển thị mặt bằng 2D tầng
     - `flipLedgerFloorPage(targetFloorIndex, floorMapData)` -> Hiệu ứng lật trang chuyển tầng trong sổ
     - `openRoomDetailSinglePage(roomId, activeTab, roomDetailData)` -> Mở tờ chi tiết phòng ở chế độ **Single-Page** (`QLNT-D013`)
     - `switchRoomDetailPageTab(roomId, targetTab, roomDetailData)` -> Chuyển qua lại giữa Trang 1 (Thông tin & Tiền), Trang 2 (Thiết bị), Trang 3 (Lịch sử)
     - `refreshRoomDetailView(roomId, updatedDetailData)` -> Đồng bộ lại giao diện sau khi Headless Core xử lý xong `in-place edit` (`QLNT-D011`) và ghi vết Trang 3 (`NT-03`)
     - `closeRoomDetailToFloorMap(updatedFloorMapData)` -> Đóng cấp 1 (`QLNT-D012`): Đóng tờ chi tiết quay về mặt bằng tầng trong sổ
     - `closeLedgerBookTo3DScene()` -> Đóng cấp 2 (`QLNT-D012`): Gập sổ quay về không gian 3D Isometric
3. **Khi nâng cấp hình ảnh theo giai đoạn:** Giữ cùng nền tảng renderer 3D và thay dần placeholder/sprite bằng asset 3D. Domain nghiệp vụ, phân quyền, API và database được tách khỏi renderer; không giả định mọi thứ presentation giữ nguyên — mapping asset, animation, picking/tương tác không gian, hiệu năng và QA cần được cập nhật.

---

## 3. Thành phần công nghệ đề xuất (Tech Stack)

| Thành phần | Lựa chọn đề xuất | Lý do & Đánh đổi |
|---|---|---|
| **Frontend Framework** | **TypeScript + Vue 3 / React (Vite)** | Hiện đại, tốc độ build nhanh, dễ bảo trì, hệ sinh thái phong phú |
| **Styling** | **Tailwind CSS** | Xây dựng giao diện danh sách dự phòng (`R-16`), modal nộp bill, popup thẻ nhân vật nhanh, gọn |
| **Nền tảng renderer 3D (đề xuất)** | **Three.js / WebGL** | Dựng cảnh 3D ngay từ prototype với camera isometric cố định; dùng hình khối và plane/sprite 2D trước, sau đó thay dần bằng model 3D. Giảm rủi ro phải chuyển engine; vẫn cần kiểm thử hiệu năng trên thiết bị mục tiêu. |
| **Mobile App Wrapper** | **Capacitor (Ionic)** | 1 codebase web duy nhất chạy thẳng trên trình duyệt, đồng thời đóng gói thành app native iOS và Android; gọi camera chụp ảnh chuyển khoản (`R-05`) mượt mà |
| **Client Local DB (Offline)** | **IndexedDB (Dexie.js)** | Hỗ trợ bản Miễn phí chạy mượt khi không có mạng; đồng bộ dữ liệu lên cloud khi nâng cấp |
| **Backend & SaaS Database** | **PostgreSQL (Multi-tenant) + Node.js (Fastify/NestJS) hoặc Supabase** | Hỗ trợ phân quyền dữ liệu chặt chẽ theo `landlord_id` (Row-Level Security), có sẵn WebSocket Realtime để bắn sự kiện khi khách nộp tiền hoặc chủ duyệt bill |
| **Lưu trữ file/ảnh** | **S3-compatible Object Storage (MinIO / Cloudflare R2 / Supabase Storage)** | Chi phí rẻ, lưu trữ ảnh chụp chuyển khoản, ảnh phòng của Sale trọ |

---

## 4. Lộ trình triển khai kỹ thuật (Technical Roadmap)

- **Bước 1 (Foundation & Core Business):**
  - Dựng khung dự án Frontend (Vite + TypeScript + Tailwind).
  - Cài đặt State Management và Headless Core (Model: Tòa nhà, Tầng, Phòng, Khách, Thiết bị, Hóa đơn).
  - Cài đặt hợp đồng presentation và renderer 3D tối thiểu với camera cố định; xác định hệ tọa độ logic tòa nhà/phòng độc lập tọa độ màn hình.
- **Bước 2 (Prototype 3D và MVP hình khối — P1):**
  - Dựng một tòa nhà/tầng/phòng bằng hình khối đơn giản trong cảnh 3D; camera isometric cố định.
  - Dùng avatar/đồ vật dạng sprite hoặc plane 2D khi phù hợp; hỗ trợ chọn phòng/đồ vật và hiển thị trạng thái nghiệp vụ.
  - Kiểm chứng luồng đóng tiền, báo hỏng, avatar và minigame trong phạm vi MVP; đo hiệu năng trên thiết bị mục tiêu.
- **Bước 3 (Thay dần asset và mở rộng cảnh — P2):**
  - Thay các placeholder có giá trị người dùng nhìn thấy bằng object 3D đơn giản; giữ camera cố định và renderer.
  - Mở rộng bản đồ/khu vực theo yêu cầu P2; bổ sung vật liệu, chiều sâu và hoạt ảnh theo từng phần được duyệt.
- **Bước 4 (Hoàn thiện 3D — P3):**
  - Nâng chất lượng model, ánh sáng, animation và tối ưu; chỉ mở rộng phạm vi 3D khi số liệu thử nghiệm chứng minh giá trị.
- **Bước 5 (Thao tác nghiệp vụ & Đóng gói Mobile):**
  - Tích hợp modal upload ảnh bill chuyển khoản, nút chủ nhà duyệt tiền.
  - Tích hợp shop đổi điểm (quà, skin, sao uy tín).
  - Đóng gói Capacitor chạy thử nghiệm trên Android/iOS; kiểm tra tải cảnh và hiệu năng trên thiết bị mục tiêu.
