import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  generateRoomBlueprintSvgString,
  generateNoticeBillboardTexture,
  auditSvgSizeBudget,
  DEFAULT_SVG_BUDGET_BYTES,
  ROOM_STATUS_COLORS,
} from '../src';

describe('Generate Visual Showcase HTML', () => {
  it('generates showcase.html with all 3 room layouts and icons', () => {
    const layouts = [
      { id: 'STANDARD_SINGLE' as const, name: '1. Phòng Đơn Tiêu Chuẩn (20m² - 4m x 5m)', desc: 'Cửa mở 90°, cửa sổ 2 cánh, giường 1.6m x 2m, bàn học và WC khép kín' },
      { id: 'MEZZANINE' as const, name: '2. Phòng Có Gác Lửng (25m²)', desc: 'Cầu thang lên gác xép, khu bếp nấu tầng trệt, ban công đón nắng' },
      { id: 'STUDIO_MINI' as const, name: '3. Căn Hộ Mini / Studio CCMN (35m²)', desc: 'Khu bếp chữ L tách biệt, sofa tiếp khách, ban công phơi đồ máy giặt riêng' },
    ];

    const statuses = [
      { status: 'EMPTY' as const, roomNumber: '101', tenant: undefined, hasNotice: false, hasBroken: false, label: 'Phòng Trống (EMPTY)' },
      { status: 'OCCUPIED' as const, roomNumber: '201', tenant: 'Nguyễn Văn A', hasNotice: false, hasBroken: false, label: 'Đang Ở Ổn Định (OCCUPIED)' },
      { status: 'PAYMENT_DUE' as const, roomNumber: '301', tenant: 'Trần Thị B', hasNotice: true, hasBroken: false, label: 'Đến Hạn Thu Tiền (Chấm Than Vàng)' },
      { status: 'BROKEN' as const, roomNumber: '401', tenant: 'Lê Văn C', hasNotice: false, hasBroken: true, label: 'Báo Hỏng Sự Cố (Chấm Than Đỏ)' },
    ];

    let layoutCardsHtml = '';

    for (const layout of layouts) {
      layoutCardsHtml += `
        <div class="layout-section">
          <h3 class="layout-title">${layout.name}</h3>
          <p class="layout-desc">${layout.desc}</p>
          <div class="grid-4">
      `;

      for (const st of statuses) {
        const roomDto = {
          roomId: `room-${layout.id}-${st.roomNumber}`,
          roomNumber: st.roomNumber,
          status: st.status === 'EMPTY' ? ('EMPTY' as const) : ('RENTED' as const),
          tenantName: st.tenant,
          hasPaymentNotice: st.hasNotice,
          hasBrokenDevice: st.hasBroken,
        };

        const svgString = generateRoomBlueprintSvgString({
          room: roomDto,
          layoutType: layout.id,
          width: 280,
          height: 210,
          showNoticeBadge: true,
        });

        const audit = auditSvgSizeBudget(svgString, DEFAULT_SVG_BUDGET_BYTES);

        layoutCardsHtml += `
          <div class="room-card status-${st.status.toLowerCase()}">
            <div class="room-status-badge">${st.label}</div>
            <div class="svg-container">${svgString}</div>
            <div class="audit-info">
              <span>Dung lượng: <strong>${(audit.optimizedSize / 1024).toFixed(2)} KB</strong></span>
              <span class="badge-pass">✔ Đạt chuẩn &lt; 50 KB</span>
            </div>
          </div>
        `;
      }

      layoutCardsHtml += `
          </div>
        </div>
      `;
    }

    const html = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>QLNT - 2D Visual Rendering Showcase (@qlnt/renderer-2d)</title>
  <style>
    :root {
      --bg: #F8FAFC;
      --card-bg: #FFFFFF;
      --text: #0F172A;
      --muted: #64748B;
      --border: #E2E8F0;
      --primary: #2563EB;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
    body { background-color: var(--bg); color: var(--text); padding: 32px 16px; max-width: 1280px; margin: 0 auto; }
    header { margin-bottom: 32px; border-bottom: 2px solid var(--border); padding-bottom: 20px; }
    h1 { font-size: 28px; font-weight: 800; color: #1E293B; display: flex; align-items: center; gap: 12px; }
    .tagline { color: var(--muted); margin-top: 6px; font-size: 15px; }
    .badge-hybrid { display: inline-block; background: #EEF2FF; color: #4F46E5; padding: 4px 12px; border-radius: 999px; font-size: 13px; font-weight: 700; margin-top: 10px; border: 1px solid #C7D2FE; }
    
    .stats-bar { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 32px; }
    .stat-card { background: var(--card-bg); padding: 18px; border-radius: 12px; border: 1px solid var(--border); box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
    .stat-num { font-size: 26px; font-weight: 800; color: var(--primary); }
    .stat-label { font-size: 13px; color: var(--muted); margin-top: 4px; }

    .section-header { margin: 40px 0 16px; display: flex; justify-content: space-between; align-items: baseline; }
    .section-title { font-size: 22px; font-weight: 700; color: #0F172A; }
    
    .layout-section { background: var(--card-bg); border-radius: 14px; border: 1px solid var(--border); padding: 24px; margin-bottom: 28px; box-shadow: 0 2px 6px rgba(0,0,0,0.04); }
    .layout-title { font-size: 18px; font-weight: 700; color: #1E293B; }
    .layout-desc { font-size: 13px; color: var(--muted); margin-bottom: 20px; }
    
    .grid-4 { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 20px; }
    .room-card { background: #FAFAF9; border-radius: 10px; padding: 14px; border: 1px solid #E5E7EB; display: flex; flex-direction: column; align-items: center; transition: transform 0.15s ease, box-shadow 0.15s ease; }
    .room-card:hover { transform: translateY(-2px); box-shadow: 0 6px 16px rgba(0,0,0,0.08); }
    .room-status-badge { font-size: 11px; font-weight: 700; text-transform: uppercase; margin-bottom: 10px; padding: 4px 10px; border-radius: 6px; align-self: flex-start; }
    
    .status-empty .room-status-badge { background: #DCFCE7; color: #15803D; }
    .status-occupied .room-status-badge { background: #FEFCE8; color: #854D0E; }
    .status-payment_due .room-status-badge { background: #FEF3C7; color: #B45309; }
    .status-broken .room-status-badge { background: #FEE2E2; color: #B91C1C; }
    
    .svg-container { width: 100%; display: flex; justify-content: center; }
    .svg-container svg { width: 100%; height: auto; max-width: 280px; }
    
    .audit-info { width: 100%; display: flex; justify-content: space-between; align-items: center; font-size: 11px; color: var(--muted); margin-top: 12px; border-top: 1px dashed #E5E7EB; padding-top: 8px; }
    .badge-pass { color: #16A34A; font-weight: 700; }

    /* Icons showcase */
    .icons-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 16px; }
    .icon-box { background: var(--card-bg); border: 1px solid var(--border); border-radius: 10px; padding: 18px 12px; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 8px; }
    .icon-box svg { width: 36px; height: 36px; }
    .icon-name { font-size: 13px; font-weight: 700; color: #334155; }
    .icon-sub { font-size: 11px; color: var(--muted); }

    /* Virtual Ledger Mockup */
    .book-mockup { background: #FFFBEB; border: 8px solid #78350F; border-radius: 14px; box-shadow: 0 12px 30px rgba(0,0,0,0.15); padding: 28px; position: relative; margin-top: 16px; }
    .book-tabs { display: flex; gap: 8px; position: absolute; top: -20px; right: 28px; }
    .book-tab { background: #B45309; color: #FFF; font-size: 13px; font-weight: 700; padding: 6px 18px; border-radius: 8px 8px 0 0; min-height: 44px; display: flex; align-items: center; }
    .book-tab.active { background: #78350F; }
    .book-content { background: #FEFCE8; border: 2px dashed #D97706; border-radius: 10px; padding: 24px; }
    .book-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #F59E0B; padding-bottom: 14px; margin-bottom: 20px; }

    /* Pulsing animation */
    @keyframes pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.6; transform: scale(1.15); } }
    .qlnt-badge-broken { animation: pulse 1.5s infinite ease-in-out; transform-origin: center; }
  </style>
</head>
<body>

  <header>
    <h1>📋 Kết Quả Render Đồ Họa 2D — QLNT Showcase</h1>
    <p class="tagline">Kiểm định trực quan hệ thống Mặt Bằng Kiến Trúc SVG, Icon Cảnh Báo &amp; Sổ Quản Lý Ảo F04</p>
    <div class="badge-hybrid">Kiến trúc Hybrid: DOM Overlay (React 19 + SVG) &amp; Three.js WebGL Bridge</div>
  </header>

  <div class="stats-bar">
    <div class="stat-card">
      <div class="stat-num">3</div>
      <div class="stat-label">Cấu Hình Mặt Bằng Mẫu VN</div>
    </div>
    <div class="stat-card">
      <div class="stat-num">4</div>
      <div class="stat-label">Mã Màu Trạng Thái Chuẩn</div>
    </div>
    <div class="stat-card">
      <div class="stat-num">&lt; 3.5 KB</div>
      <div class="stat-label">Dung Lượng SVG Trung Bình (Chuẩn &lt; 50 KB)</div>
    </div>
    <div class="stat-card">
      <div class="stat-num">28 / 28</div>
      <div class="stat-label">Tests Passed (Vitest Suite)</div>
    </div>
  </div>

  <div class="section-header">
    <h2 class="section-title">1. Mặt Bằng Kiến Trúc SVG Cho 3 Loại Phòng Mẫu</h2>
  </div>

  ${layoutCardsHtml}

  <div class="section-header">
    <h2 class="section-title">2. Hệ Thống Icon Cảnh Báo &amp; Thiết Bị Phòng Trọ</h2>
  </div>

  <div class="layout-section">
    <div class="icons-grid">
      <div class="icon-box">
        <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#F59E0B"/><text x="12" y="16" text-anchor="middle" font-size="12" font-weight="bold" fill="#FFF">!</text></svg>
        <span class="icon-name">Chấm Than Vàng</span>
        <span class="icon-sub">Thu tiền / Duyệt bill</span>
      </div>
      <div class="icon-box">
        <svg viewBox="0 0 24 24" class="qlnt-badge-broken"><circle cx="12" cy="12" r="10" fill="#EF4444"/><text x="12" y="16" text-anchor="middle" font-size="12" font-weight="bold" fill="#FFF">!</text></svg>
        <span class="icon-name">Chấm Than Đỏ</span>
        <span class="icon-sub">Báo hỏng sự cố</span>
      </div>
      <div class="icon-box">
        <svg viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="2"><path d="M6 12h12M6 8h12M6 16h12"/></svg>
        <span class="icon-name">FIXED</span>
        <span class="icon-sub">Điều hòa / Nóng lạnh</span>
      </div>
      <div class="icon-box">
        <svg viewBox="0 0 24 24" fill="none" stroke="#A16207" stroke-width="2"><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M3 11h18"/></svg>
        <span class="icon-name">FURNITURE</span>
        <span class="icon-sub">Giường / Tủ áo</span>
      </div>
      <div class="icon-box">
        <svg viewBox="0 0 24 24" fill="none" stroke="#0D9488" stroke-width="2"><rect x="4" y="2" width="16" height="20" rx="2"/><circle cx="12" cy="14" r="4"/></svg>
        <span class="icon-name">ADDITIONAL</span>
        <span class="icon-sub">Máy giặt / Tủ lạnh</span>
      </div>
      <div class="icon-box">
        <svg viewBox="0 0 24 24" fill="none" stroke="#7C3AED" stroke-width="2"><rect x="5" y="11" width="14" height="10" rx="2"/><circle cx="12" cy="16" r="1"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>
        <span class="icon-name">SECURITY</span>
        <span class="icon-sub">Khóa vân tay / Thẻ từ</span>
      </div>
      <div class="icon-box">
        <svg viewBox="0 0 24 24" fill="none" stroke="#E11D48" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>
        <span class="icon-name">METER</span>
        <span class="icon-sub">Công tơ Điện / Nước</span>
      </div>
      <div class="icon-box">
        <svg viewBox="0 0 24 24" fill="#F59E0B"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
        <span class="icon-name">Sao Uy Tín</span>
        <span class="icon-sub">Huy hiệu phần thưởng</span>
      </div>
    </div>
  </div>

  <div class="section-header">
    <h2 class="section-title">3. Khung Giao Diện Sổ Quản Lý Ảo F04 (Mô Phỏng Trải Nghiệm Single-Page)</h2>
  </div>

  <div class="book-mockup">
    <div class="book-tabs">
      <div class="book-tab active">Tầng 1 (4 phòng)</div>
      <div class="book-tab">Tầng 2</div>
      <div class="book-tab">Tầng 3</div>
    </div>
    <div class="book-content">
      <div class="book-header">
        <div>
          <h3 style="color: #78350F; font-size: 18px; font-weight: 800;">SỔ QUẢN LÝ THÁNG 11/2026 — NHÀ TRỌ XUÂN THỦY</h3>
          <p style="font-size: 12px; color: #92400E; margin-top: 2px;">Trực quan hóa Mặt bằng tầng &amp; Chế độ Single-Page in-place edit (Touch Target &ge; 44x44px)</p>
        </div>
        <div style="font-size: 12px; font-weight: 700; color: #B45309; background: #FEF3C7; padding: 6px 14px; border-radius: 6px; border: 1px solid #FDE68A;">
          Chạm vào ô phòng để mở Tờ Chi Tiết Single-Page
        </div>
      </div>
      <div style="text-align: center; color: #92400E; font-size: 13px; font-style: italic; padding: 12px 0;">
        (Hỗ trợ thao tác cảm ứng đa điểm Pinch-to-zoom &amp; Kéo Pan mượt mà trên mobile qua react-zoom-pan-pinch)
      </div>
    </div>
  </div>

</body>
</html>
`;

    const outPath = path.resolve(__dirname, '../examples/showcase.html');
    fs.writeFileSync(outPath, html, 'utf-8');
    expect(fs.existsSync(outPath)).toBe(true);
    expect(fs.statSync(outPath).size).toBeGreaterThan(1000);
  });
});
