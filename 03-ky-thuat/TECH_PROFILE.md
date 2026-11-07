# Hồ sơ kỹ thuật và môi trường — QLNT

Trạng thái: `Đề xuất mảng B (Dự thảo)` — 2026-11-07.

## 1. Phân loại kỹ thuật đã xác nhận

- **Mô hình kiến trúc:** SaaS Multi-tenant (đa chủ trọ, chia sẻ nền tảng và bản đồ chung; phân tách dữ liệu logic theo `landlord_id` / tenant).
- **Chiến lược đồ họa 2 giai đoạn (Two-Stage Presentation Strategy):**
  - **Giai đoạn 1 (P1 MVP — Hiện tại):** Sử dụng mô hình 2D phẳng / 2D isometric tối giản (sprites, tilemap 2D, hoạt ảnh 2D cơ bản). Ưu tiên kiểm chứng hoàn chỉnh toàn bộ luồng nghiệp vụ, tính năng quản lý, thao tác thủ công, gamification; đảm bảo hiệu năng siêu nhẹ và mượt mà trên mọi trình duyệt web và thiết bị mobile cấu hình thấp.
  - **Giai đoạn 2 (P2–P3 — Nâng cấp):** Nâng cấp đồ họa lên 2.5D pseudo-3D hoặc 3D isometric (Three.js / WebGL / Low-poly 3D models).
- **Yêu cầu cốt lõi về kiến trúc:** **Chuẩn bị sẵn sàng để chuyển đổi đồ họa mà không phải đập đi xây lại logic nghiệp vụ** (áp dụng kiến trúc Headless Domain Core & Presentation Adapter).
- **Client:** Web Responsive + Mobile App (đóng gói bằng Capacitor/PWA từ một codebase duy nhất, hỗ trợ Android & iOS).
- **Môi trường triển khai:** Local Dev → Cloud Staging/Production.

---

## 2. Kiến trúc giải pháp (Architecture Design)

Hệ thống được thiết kế theo mô hình phân tầng nghiêm ngặt (Strict Layered / Clean Architecture) để đảm bảo nguyên tắc `NT-01` (Lớp game tách rời Lớp dữ liệu thật):

```
+--------------------------------------------------------------------------+
|                       TẦNG HIỂN THỊ (PRESENTATION LAYER)                 |
|                                                                          |
|   [Giai đoạn 1: Canvas 2D Engine]  <--- Thay thế --->  [Giai đoạn 2: Three.js 3D] |
|     (PixiJS / HTML5 2D Canvas)                               (WebGL / 2.5D 3D)   |
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
2. **Interface `IGameRenderer`:** Định nghĩa tập lệnh trừu tượng cho game:
   - `renderBuilding(buildingData)`
   - `spawnAvatar(avatarId, roomPosition, skinConfig)`
   - `moveAvatar(avatarId, targetPosition, onComplete)`
   - `setDeviceStatus(deviceId, status: 'NORMAL' | 'BROKEN')` -> Hiển thị chấm than đỏ
   - `setRoomNotice(roomId, type: 'PAYMENT_DUE')` -> Hiển thị chấm than vàng
   - `playMinigameAction(actionType, toolSkin)`
3. **Khi nâng cấp từ 2D lên 2.5D/3D:** Chỉ cần cài đặt một class mới `ThreeJsRenderer implements IGameRenderer`. 100% logic nghiệp vụ, tính toán tiền nong, phân quyền, API và database được giữ nguyên hoàn toàn.

---

## 3. Thành phần công nghệ đề xuất (Tech Stack)

| Thành phần | Lựa chọn đề xuất | Lý do & Đánh đổi |
|---|---|---|
| **Frontend Framework** | **TypeScript + Vue 3 / React (Vite)** | Hiện đại, tốc độ build nhanh, dễ bảo trì, hệ sinh thái phong phú |
| **Styling** | **Tailwind CSS** | Xây dựng giao diện danh sách dự phòng (`R-16`), modal nộp bill, popup thẻ nhân vật nhanh, gọn |
| **Engine đồ họa 2D (P1)** | **PixiJS (hoặc Phaser 3 / HTML5 Canvas 2D)** | **Ưu điểm:** Cực nhẹ, render 2D/isometric siêu mượt (60fps trên mobile), hỗ trợ sprite animation, particle effect (chấm than, khói, nhặt đồ). Dễ đóng gói vào adapter. |
| **Engine nâng cấp (P2/P3)** | **Three.js / WebGL** | Chuyển sang 2.5D/3D isometric góc nhìn nghiêng cố định khi nghiệp vụ đã ổn định |
| **Mobile App Wrapper** | **Capacitor (Ionic)** | 1 codebase web duy nhất chạy thẳng trên trình duyệt, đồng thời đóng gói thành app native iOS và Android; gọi camera chụp ảnh chuyển khoản (`R-05`) mượt mà |
| **Client Local DB (Offline)** | **IndexedDB (Dexie.js)** | Hỗ trợ bản Miễn phí chạy mượt khi không có mạng; đồng bộ dữ liệu lên cloud khi nâng cấp |
| **Backend & SaaS Database** | **PostgreSQL (Multi-tenant) + Node.js (Fastify/NestJS) hoặc Supabase** | Hỗ trợ phân quyền dữ liệu chặt chẽ theo `landlord_id` (Row-Level Security), có sẵn WebSocket Realtime để bắn sự kiện khi khách nộp tiền hoặc chủ duyệt bill |
| **Lưu trữ file/ảnh** | **S3-compatible Object Storage (MinIO / Cloudflare R2 / Supabase Storage)** | Chi phí rẻ, lưu trữ ảnh chụp chuyển khoản, ảnh phòng của Sale trọ |

---

## 4. Lộ trình triển khai kỹ thuật (Technical Roadmap)

- **Bước 1 (Foundation & Core Business):** 
  - Dựng khung dự án Frontend (Vite + TypeScript + Tailwind).
  - Cài đặt State Management và Headless Core (Model: Tòa nhà, Tầng, Phòng, Khách, Thiết bị, Hóa đơn).
  - Cài đặt `IGameRenderer` interface.
- **Bước 2 (2D Canvas Renderer — P1):**
  - Dựng renderer 2D hiển thị tòa nhà dạng ô lưới (tilemap), tầng và phòng.
  - Vẽ avatar 2D di chuyển đơn giản giữa các phòng.
  - Hiển thị chấm than đỏ (báo hỏng thiết bị) và chấm than vàng (kỳ đóng tiền trọ).
  - Tích hợp minigame chuột/gián và xả giận dạng 2D sprites.
- **Bước 3 (Thao tác nghiệp vụ & Đóng gói Mobile):**
  - Tích hợp modal upload ảnh bill chuyển khoản, nút chủ nhà duyệt tiền.
  - Tích hợp shop đổi điểm (quà, skin, sao uy tín).
  - Đóng gói Capacitor chạy thử nghiệm trên Android/iOS.
- **Bước 4 (Chuẩn bị cổng nâng cấp 2.5D/3D):**
  - Viết module thử nghiệm `ThreeJsRenderer` thay thế `PixiJsRenderer` để chứng minh tính linh hoạt của kiến trúc.
