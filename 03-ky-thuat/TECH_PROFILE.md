# Hồ sơ kỹ thuật và môi trường — QLNT

Trạng thái: `Đã phê duyệt — Chuẩn hóa kỹ thuật theo TECH-STD-001 (2026-11-12)` — Hệ thống hóa kiến trúc Hybrid WebGL 3D + DOM Overlay, chuẩn hóa hợp đồng `IGameRenderer` và chốt cấu hình Tech Stack.

## 1. Phân loại kỹ thuật đã xác nhận

- **Mô hình kiến trúc:** SaaS Multi-tenant (đa chủ trọ, chia sẻ nền tảng và bản đồ chung; phân tách dữ liệu logic theo `landlord_id` / tenant với Row-Level Security).
- **Đích đồ họa & Kiến trúc Hiển thị:** Thế giới 3D với camera isometric cố định kết hợp kiến trúc **Hybrid WebGL 3D + DOM Overlay** (Three.js dựng cảnh tòa nhà 3D và hoạt ảnh mở/gập sổ; DOM Overlay React 19 + SVG thể hiện mặt bằng 2D tầng và bộ 3 trang chi tiết phòng Single-Page).
- **Lộ trình đồ họa tăng dần:** (1) dựng prototype 3D bằng hình khối đơn giản; (2) MVP dùng hình khối và sprite/plane 2D trong không gian 3D để kiểm chứng nghiệp vụ và hiệu năng; (3) thay dần các thành phần có giá trị bằng object, vật liệu và hoạt ảnh 3D; (4) mở rộng chất lượng và phạm vi cảnh 3D theo kết quả thử nghiệm. 2.5D có thể là cách thể hiện trung gian, không phải đích cuối.
- **Yêu cầu cốt lõi về kiến trúc:** Dữ liệu và nghiệp vụ độc lập hoàn toàn với renderer/asset (`Headless Domain Core` viết bằng Pure TypeScript + Zustand); bắt đầu bằng renderer và hệ tọa độ `Vector3D` chuẩn hóa để tránh phải thay engine khi nâng chất lượng hình ảnh.
- **Client:** Web Responsive + Mobile App (đóng gói bằng Capacitor từ một codebase duy nhất, hỗ trợ Android & iOS).
- **Môi trường triển khai & Chuẩn vận hành cho Dev (`QLNT-D014`):** Local Dev → Cloud Staging (Cloudflare Pages + Supabase + Cloudflare R2) → Production (VPS Việt Nam `4 vCPU, 8GB RAM, 100GB NVMe` chạy Docker Compose + Cloudflare R2/CDN). Chi tiết quy mô cấu hình, bảo mật `RLS`/`Signed URL` và ngưỡng tự động hạ cấp hiệu năng (`FPS < 30` hoặc `RAM < 3GB`) được quản lý tập trung tại [`../04-van-hanh/HA_TANG_VA_VAN_HANH_HE_THONG.md`](../04-van-hanh/HA_TANG_VA_VAN_HANH_HE_THONG.md) và [`../04-van-hanh/QUALITY_AND_RELEASE.md`](../04-van-hanh/QUALITY_AND_RELEASE.md).
- **Tài liệu chuẩn hóa kỹ thuật:** Chi tiết 7 điểm cải thiện được quy định tại [`DANH_SACH_CAI_THIEN_VA_CHUAN_HOA_KY_THUAT.md`](DANH_SACH_CAI_THIEN_VA_CHUAN_HOA_KY_THUAT.md).

---

## 2. Kiến trúc giải pháp (Architecture Design)

Hệ thống được thiết kế theo mô hình phân tầng nghiêm ngặt (Strict Layered / Clean Architecture) để đảm bảo nguyên tắc `NT-01` (Lớp game tách rời Lớp dữ liệu thật):

```
+--------------------------------------------------------------------------+
|                  TẦNG HIỂN THỊ HYBRID (PRESENTATION LAYER)               |
|                                                                          |
|   [Three.js WebGL Canvas]                   [DOM Overlay React 19 + SVG] |
|   - Tòa nhà 3D Isometric & Camera cố định   - Mặt bằng tầng 2D tương tác |
|   - Hoạt ảnh 3D mở/gập bìa Sổ F04          - Tờ chi tiết Single-Page    |
|   - Avatar di chuyển, hiệu ứng minigame     - In-place Edit, Form Input  |
|                 \                                              /         |
|                  +--------------------+-----------------------+          |
|                                       |                                  |
|                            [IGameRenderer Interface]                     |
|                      (Contract chuẩn hóa duy nhất)                       |
+---------------------------------------^----------------------------------+
                                        | (Subscribes Domain Events)
+---------------------------------------v----------------------------------+
|                   TẦNG TRUNG GIAN SỰ KIỆN (EVENT BUS / BRIDGE)           |
|         Event Bus: EVT_ROOM_CLICKED, EVT_PAYMENT_VERIFIED, ...           |
+---------------------------------------^----------------------------------+
|                   TẦNG NGHIỆP VỤ LÕI (HEADLESS DOMAIN CORE)              |
|                                                                          |
|   - Quản lý trạng thái (State Store: Zustand / Pure TypeScript)          |
|   - Nghiệp vụ: Phòng, Tầng, Khách trọ, Thiết bị, Hóa đơn, Nhiệm vụ       |
|   - Gamification Engine: Tính điểm thưởng, trừ điểm, shop đổi quà        |
|   - Offline / Local-first: IndexedDB (Dexie.js) + Outbox Mutation Queue   |
|   - Nhật ký phòng bất biến: RoomAuditLog (Trang 3 Sổ F04 - NT-03)        |
+---------------------------------------^----------------------------------+
                                        | (REST / WebSocket / Outbox Sync)
+---------------------------------------v----------------------------------+
|                      TẦNG HẠ TẦNG & DỮ LIỆU (BACKEND & SAAS)             |
|                                                                          |
|   - Cloud Database: PostgreSQL 16 (Supabase Free - RLS theo landlord_id) |
|   - Edge Function: Cloudflare Workers (Ký Presigned URL 15 phút)         |
|   - Storage: Cloudflare R2 Free Tier (10GB Private Bucket, 0đ Egress)    |
|   - Realtime WebSocket: Đồng bộ sự kiện giữa chủ nhà, khách trọ, sale    |
+--------------------------------------------------------------------------+
```

### Chi tiết cơ chế "Dễ chuyển đổi đồ họa" (Pluggable Renderer):
1. **Headless Domain Core:** Toàn bộ dữ liệu thật và quy tắc nghiệp vụ (thêm khách, duyệt tiền, báo hỏng, trừ điểm, tính sao uy tín) được viết bằng Pure TypeScript / Zustand Store độc lập hoàn toàn với Canvas/DOM.
2. **Interface `IGameRenderer` (Single Source of Truth):** Định nghĩa tập lệnh trừu tượng cho game và phân hệ Sổ quản lý ảo F04 (chi tiết tại [`../02-nghiep-vu/DAC_TA_SO_QUAN_LY_AO_SINGLE_PAGE_VA_RENDERER.md`](../02-nghiep-vu/DAC_TA_SO_QUAN_LY_AO_SINGLE_PAGE_VA_RENDERER.md)):

```typescript
export interface Vector3D {
  x: number;
  y: number;
  z: number;
}

export type DeviceStatus = 'NORMAL' | 'BROKEN';
export type RoomNoticeType = 'NONE' | 'PAYMENT_DUE' | 'BILL_PENDING';
export type RoomDetailTab = 'PAGE_1_BILLING' | 'PAGE_2_DEVICES' | 'PAGE_3_AUDIT';

export interface IGameRenderer {
  // === Nhóm cảnh 3D tòa nhà & avatar ===
  renderBuilding(buildingData: BuildingRenderDTO): Promise<void>;
  spawnAvatar(avatarId: string, roomPosition: Vector3D, skinConfig: AvatarSkinDTO): void;
  moveAvatar(avatarId: string, targetPosition: Vector3D, onComplete?: () => void): void;
  setDeviceStatus(roomId: string, deviceId: string, status: DeviceStatus): void;
  setRoomNotice(roomId: string, type: RoomNoticeType): void;
  playMinigameAction(actionType: string, toolSkin?: string): Promise<void>;

  // === Nhóm điều khiển Sổ quản lý ảo F04 (QLNT-D010..D013) ===
  openLedgerBook(monthKey: string, initialFloorIndex: number, floorMapData: FloorMapDTO): Promise<void>;
  flipLedgerFloorPage(targetFloorIndex: number, floorMapData: FloorMapDTO): Promise<void>;
  openRoomDetailSinglePage(roomId: string, activeTab: RoomDetailTab, roomDetailData: RoomDetailDTO): Promise<void>;
  switchRoomDetailPageTab(roomId: string, targetTab: RoomDetailTab, roomDetailData: RoomDetailDTO): Promise<void>;
  refreshRoomDetailView(roomId: string, updatedDetailData: RoomDetailDTO): void;
  closeRoomDetailToFloorMap(updatedFloorMapData: FloorMapDTO): Promise<void>;
  closeLedgerBookTo3DScene(): Promise<void>;
}
```

3. **Kiến trúc Hybrid Three.js WebGL & DOM Overlay:**
   - **Three.js WebGL:** Đảm nhận kết xuất không gian 3D Isometric (tòa nhà, avatar) và hoạt ảnh mở/gập bìa sổ 3D khi chủ nhà vào/ra phân hệ Sổ F04.
   - **DOM Overlay (React 19 + Tailwind CSS + SVG):** Hiển thị mặt bằng tầng 2D và bộ 3 trang chi tiết phòng Single-Page (`QLNT-D013`). Cho phép người dùng chỉnh sửa trực tiếp (`in-place edit`), nhập chỉ số điện nước, xem ảnh bill đối chứng bằng các thành phần HTML native sắc nét, tối ưu trải nghiệm gõ bàn phím và khả năng tương thích trên thiết bị di động.

---

## 3. Thành phần công nghệ chuẩn hóa (Tech Stack)

Cấu hình công nghệ đã được chốt chính thức tại [`DANH_SACH_CAI_THIEN_VA_CHUAN_HOA_KY_THUAT.md`](DANH_SACH_CAI_THIEN_VA_CHUAN_HOA_KY_THUAT.md):

| Thành phần | Lựa chọn chính thức | Lý do & Vai trò |
|---|---|---|
| **Frontend Framework** | **React 19 + TypeScript** | Phiên bản React mới nhất với Actions, `useActionState`, tối ưu render form nhập liệu, hỗ trợ strict typing với TypeScript |
| **Build Tool & HMR** | **Vite 6** | Tốc độ khởi động và Hot Module Replacement cực nhanh, tối ưu build tĩnh cho Cloudflare Pages |
| **Styling** | **Tailwind CSS v4** | Xây dựng giao diện DOM Overlay, mặt bằng 2D SVG, Single-Page Ledger và mobile responsive nhanh chóng, dung lượng gọn nhẹ |
| **State Management** | **Zustand** | Quản lý trạng thái Headless Domain Core độc lập, cực nhẹ (< 1KB), zero boilerplate |
| **Renderer 3D** | **Three.js / WebGL** | Dựng cảnh 3D Isometric với camera Orthographic cố định; hỗ trợ tải model `.glb` nhẹ và hoạt ảnh mở sổ |
| **Client Local DB (Offline)** | **IndexedDB (Dexie.js)** | Hỗ trợ lưu trữ Local-first mượt mà khi ngoại tuyến; tích hợp Outbox Mutation Queue đồng bộ Cloud khi có mạng |
| **Mobile App Shell** | **Capacitor 6** | 1 codebase web duy nhất chạy thẳng trên trình duyệt, đồng thời đóng gói thành app native iOS và Android; gọi camera chụp ảnh chuyển khoản (`R-05`) và CCCD |
| **Backend & Cloud DB** | **Supabase Free Tier (PostgreSQL 16)** | Hỗ trợ phân quyền dữ liệu chặt chẽ theo `landlord_id` (Row-Level Security), có sẵn WebSocket Realtime, chi phí $0/tháng |
| **Edge Compute & Storage** | **Cloudflare Workers & R2 Storage** | Worker cấp Presigned URL 15 phút (`900s`), Private Bucket R2 10GB miễn phí, 0đ phí băng thông Egress |

---

## 4. Lược đồ Dữ liệu 10 Bảng Chuẩn hóa (Schema Overview)

Hệ thống quản lý dữ liệu theo mô hình 10 thực thể quan hệ (Relational Entities), 100% sử dụng khóa chính `UUID v4` và phân vùng Multi-tenant theo `landlord_id` (chi tiết định nghĩa trường tại [`DANH_SACH_CAI_THIEN_VA_CHUAN_HOA_KY_THUAT.md`](DANH_SACH_CAI_THIEN_VA_CHUAN_HOA_KY_THUAT.md)):

1. `landlords`: Tài khoản chủ nhà trọ (name, phone, email, reputation_stars, package_tier).
2. `properties`: Khu trọ / Tòa nhà (landlord_id, name, address, total_floors, coordinates_3d, is_public_on_map, water_calc_method, electric_unit_price, water_unit_price, service_fee).
3. `rooms`: Phòng trọ (landlord_id, property_id, floor_number, room_number, area_sqm, base_price, deposit_amount, status).
4. `tenants`: Khách thuê & người ở ghép (landlord_id, room_id, full_name, phone, id_card_number, id_card_front_url, id_card_back_url, birth_year, hometown, vehicle_plate, role, temp_residence_status, reward_points, avatar_skin_config).
5. `contracts`: Hợp đồng thuê phòng (landlord_id, room_id, tenant_id, start_date, end_date, duration_months, monthly_rent, deposit_paid, payment_cycle_day, status).
6. `billings`: Hóa đơn kỳ thu tiền phòng hàng tháng (landlord_id, room_id, contract_id, month_period, room_charge, electric_charge, water_charge, service_charge, vehicle_charge, previous_debt, total_amount, status, bill_image_url).
7. `payment_records`: Phiếu thu & giao dịch thanh toán (landlord_id, billing_id, room_id, amount_paid, payment_method, payment_date, verified_by, note).
8. `meter_readings`: Chỉ số công tơ điện và đồng hồ nước (landlord_id, room_id, billing_id, month_period, old_electric, new_electric, electric_consumed, old_water, new_water, water_consumed, meter_photo_url, recorded_by, recorded_at).
9. `room_audit_logs`: Nhật ký biến động phòng Append-Only theo `NT-03` (landlord_id, room_id, actor_id, actor_role, action_type, change_summary, old_data, new_data, created_at bất biến).
10. `maintenance_requests`: Yêu cầu báo hỏng & sửa chữa thiết bị theo F02 (landlord_id, room_id, tenant_id, device_name, device_category, issue_description, photo_url, status, reported_at, resolved_at, repair_cost, resolved_by).

---

## 5. Lộ trình triển khai kỹ thuật (Technical Roadmap)

- **Bước 1 (Foundation & Core Business):**
  - Dựng khung dự án Frontend (React 19 + TypeScript + Vite + Tailwind + Zustand).
  - Cài đặt State Management và Headless Core (10 Entities, Business Rules NT-01..NT-08, Dexie.js schema).
  - Cài đặt hợp đồng presentation `IGameRenderer` chuẩn hóa và renderer 3D tối thiểu với camera cố định; xác định hệ tọa độ logic tòa nhà/phòng độc lập tọa độ màn hình (`Vector3D`).
- **Bước 2 (Prototype 3D và MVP hình khối — P1):**
  - Dựng một tòa nhà/tầng/phòng bằng hình khối đơn giản trong cảnh 3D; camera isometric cố định.
  - Cài đặt DOM Overlay cho Sổ quản lý ảo F04 (Mặt bằng tầng 2D SVG và Single-Page Trang 1-2-3 in-place edit).
  - Tích hợp Outbox Mutation Queue đồng bộ Cloud qua Supabase Free Tier.
  - Kiểm chứng luồng đóng tiền, báo hỏng, avatar và minigame trong phạm vi MVP; đo hiệu năng trên thiết bị mục tiêu.
- **Bước 3 (Thay dần asset và mở rộng cảnh — P2):**
  - Thay các placeholder có giá trị người dùng nhìn thấy bằng object 3D đơn giản; giữ camera cố định và renderer.
  - Mở rộng bản đồ/khu vực theo yêu cầu P2; bổ sung vật liệu, chiều sâu và hoạt ảnh theo từng phần được duyệt.
- **Bước 4 (Hoàn thiện 3D — P3):**
  - Nâng chất lượng model, ánh sáng, animation và tối ưu; chỉ mở rộng phạm vi 3D khi số liệu thử nghiệm chứng minh giá trị.
- **Bước 5 (Thao tác nghiệp vụ & Đóng gói Mobile):**
  - Tích hợp modal upload ảnh bill chuyển khoản, nút chủ nhà duyệt tiền kết nối Cloudflare Worker Signed URL.
  - Tích hợp shop đổi điểm (quà, skin, sao uy tín).
  - Đóng gói Capacitor chạy thử nghiệm trên Android/iOS; kiểm tra tải cảnh và hiệu năng trên thiết bị mục tiêu.
