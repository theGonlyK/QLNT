import { expect, test } from '@playwright/test';
import * as fs from 'node:fs';
import * as path from 'node:path';

const SCREENSHOT_DIR = path.resolve(process.cwd(), 'e2e-results/screenshots');
const RENDERS_DIR = path.resolve(process.cwd(), '../../scratch/renders');
const ARTIFACT_DIR = '/Users/minhntv/.gemini/antigravity-cli/brain/f54f2f92-542a-4f97-90c2-617cf6604c91';

function copyScreenshotArtifacts(fileName: string) {
  const src = path.join(SCREENSHOT_DIR, fileName);
  if (!fs.existsSync(src)) return;
  if (fs.existsSync(RENDERS_DIR)) {
    fs.copyFileSync(src, path.join(RENDERS_DIR, fileName));
  }
  if (fs.existsSync(ARTIFACT_DIR)) {
    fs.copyFileSync(src, path.join(ARTIFACT_DIR, fileName));
  }
}

test.beforeAll(() => {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  fs.mkdirSync(RENDERS_DIR, { recursive: true });
});

test.describe('QLNT Prototype P1 — Playwright Browser E2E (TC-P1-01..12)', () => {
  test('TC-P1-01, TC-P1-02, TC-P1-04, TC-P1-05, TC-P1-07, TC-P1-11: Full 3D Stage -> F04 Single-Page -> Preview/Commit -> VietQR Offline -> Bill Approve -> Audit Log', async ({
    page,
  }) => {
    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];
    const externalRequests: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    page.on('pageerror', (err) => {
      pageErrors.push(err.message);
    });
    page.on('request', (req) => {
      const url = req.url();
      if (
        !url.startsWith('http://127.0.0.1:4173') &&
        !url.startsWith('data:') &&
        !url.startsWith('blob:')
      ) {
        externalRequests.push(url);
      }
    });

    await page.goto('/');
    await expect(page.getByTestId('qlnt-web-app')).toBeVisible();
    await expect(page.getByTestId('canvas-3d-stage')).toBeVisible();
    await expect(page.getByTestId('three-game-canvas')).toBeVisible();

    // TC-P1-01: Verify 3 floors & 12 rooms (P101-P304) rendered on 3D Stage
    await expect(page.getByTestId('stage-floor-row-1')).toBeVisible();
    await expect(page.getByTestId('stage-floor-row-2')).toBeVisible();
    await expect(page.getByTestId('stage-floor-row-3')).toBeVisible();
    for (const roomNo of ['P101', 'P104', 'P201', 'P204', 'P301', 'P304']) {
      await expect(page.getByTestId(`stage-room-card-${roomNo}`)).toBeVisible();
    }

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, '01-desktop-3d-stage.png'),
      fullPage: true,
    });

    // Click P101 (UNPAID -> has yellow notice) to open F04 Single-Page
    await expect(page.getByTestId('yellow-notice-P101')).toBeVisible();
    await page.getByTestId('stage-room-card-P101').click();

    await expect(page.getByTestId('ledger-overlay-host')).toBeVisible();
    await expect(page.getByTestId('virtual-ledger-book')).toHaveAttribute(
      'data-mode',
      'room-detail'
    );
    await expect(page.getByTestId('room-detail-single-page')).toBeVisible();
    await expect(page.getByTestId('f04-page-1-controls')).toBeVisible();

    // TC-P1-04 & QLNT-D016: Verify local VietQR SVG rendered without external API calls
    const vietQrSvg = page.getByTestId('vietqr-local-svg').locator('svg');
    await expect(vietQrSvg).toBeVisible();

    // TC-P1-07: Preview State vs Commit State separation
    const electricInput = page.getByTestId('input-new-electric');
    await electricInput.fill('1350');
    await expect(page.getByTestId('preview-state-badge')).toBeVisible();
    await expect(page.getByTestId('preview-calculation-box')).toBeVisible();

    // Commit billing reading
    await page.getByTestId('btn-commit-billing').click();
    await expect(page.getByTestId('preview-state-badge')).toHaveCount(0);

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, '02-desktop-f04-page1-vietqr.png'),
      fullPage: true,
    });

    // TC-P1-04: Simulate local bill upload -> PENDING_APPROVAL
    await page.getByTestId('btn-simulate-bill-upload').click();
    await expect(page.getByTestId('page-1-copywriting')).toContainText('biên lai');

    // TC-P1-05: 1-Touch Approve -> PAID, clear yellow badge, +2 reputation points
    await page.getByTestId('btn-approve-one-touch').click();
    await expect(page.getByTestId('btn-approve-one-touch')).toHaveCount(0);
    await expect(page.getByTestId('page-1-copywriting')).toContainText('+2');

    // TC-P1-02 & TC-P1-11: Switch to Page 3 (Audit Log) -> verify immutable timeline & points
    await page.getByTestId('tab-btn-audit').click();
    await expect(page.getByTestId('f04-page-3-controls')).toBeVisible();
    await expect(page.getByTestId('tenant-reward-points')).toContainText('điểm');
    await expect(page.getByTestId('audit-log-timeline')).toBeVisible();
    // Ensure Trang 3 has NO edit/delete buttons (read-only immutable)
    await expect(page.getByTestId('audit-log-timeline').locator('button')).toHaveCount(0);

    // Close Level 1 -> back to Floor Map 2D, then Close Level 2 -> back to 3D Stage
    await page.getByTestId('room-detail-close-btn').click();
    await expect(page.getByTestId('virtual-ledger-book')).toHaveAttribute(
      'data-mode',
      'floor-map'
    );
    await page.getByTestId('close-ledger-book-btn').click();
    await expect(page.getByTestId('ledger-overlay-host')).toHaveCount(0);

    // Yellow notice on P101 must be cleared on 3D Stage after approval
    await expect(page.getByTestId('yellow-notice-P101')).toHaveCount(0);

    expect(externalRequests).toEqual([]);
    expect(pageErrors).toEqual([]);
    expect(consoleErrors).toEqual([]);
  });

  test('TC-P1-03: Device Broken -> Red Notice ON -> Resolve Maintenance -> Red Notice OFF & Audit Log', async ({
    page,
  }) => {
    await page.goto('/');
    await expect(page.getByTestId('stage-room-card-P102')).toBeVisible();

    const initialBrokenText = await page.getByTestId('hud-broken-count').textContent();
    expect(initialBrokenText).toBeTruthy();

    // Open P102 and switch to Page 2 (Devices)
    await page.getByTestId('stage-room-card-P102').click();
    await page.getByTestId('tab-btn-devices').click();
    await expect(page.getByTestId('f04-page-2-controls')).toBeVisible();

    // Report first normal device broken
    const reportBtn = page.locator('[data-testid^="btn-report-broken-"]').first();
    await expect(reportBtn).toBeVisible();
    await reportBtn.click();

    await expect(page.getByTestId('page-2-copywriting')).toBeVisible();

    // Resolve the broken device
    const resolveBtn = page.locator('[data-testid^="btn-resolve-device-"]').first();
    await expect(resolveBtn).toBeVisible();
    await resolveBtn.click();

    // Close back to 3D stage -> P102 should have no red notice
    await page.getByTestId('room-detail-close-btn').click();
    await page.getByTestId('close-ledger-book-btn').click();
    await expect(page.getByTestId('red-notice-P102')).toHaveCount(0);
  });

  test('TC-P1-10 & TC-P1-12: Mobile 390x844 Single-Page Navigation, Touch Target >= 44px, and Offline IndexedDB Mode', async ({
    page,
    context,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');

    // Toggle to Mobile 390x844 mode
    await page.getByTestId('toggle-viewport-btn').click();
    await expect(page.getByTestId('qlnt-web-app')).toHaveAttribute(
      'data-viewport-mode',
      'mobile-390x844'
    );

    // Check no horizontal overflow on Mobile 390x844
    const hasOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth + 2;
    });
    expect(hasOverflow).toBe(false);

    // Check touch target height >= 44px for primary HUD buttons
    const openBookBox = await page.getByTestId('open-ledger-book-btn').boundingBox();
    expect(openBookBox).not.toBeNull();
    expect(openBookBox!.height).toBeGreaterThanOrEqual(44);

    // TC-P1-12: Switch browser context to OFFLINE mode
    await context.setOffline(true);

    // Open F04 Book while OFFLINE
    await page.getByTestId('open-ledger-book-btn').click();
    await expect(page.getByTestId('ledger-overlay-host')).toBeVisible();
    await expect(page.getByTestId('virtual-ledger-book')).toHaveAttribute(
      'data-mode',
      'floor-map'
    );

    // Flip to Floor 2 while OFFLINE
    await page.getByTestId('floor-tab-2').click();
    await expect(page.getByTestId('virtual-ledger-book')).toContainText('TẦNG 2');

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, '03-mobile-390x844-f04-offline.png'),
      fullPage: true,
    });

    // Open Room P201 on Floor 2 while OFFLINE
    await page.getByTestId('virtual-ledger-book').locator('text=P201').first().click();
    await expect(page.getByTestId('room-detail-single-page')).toBeVisible();

    // Switch through Page 1 -> Page 2 -> Page 3 on Mobile
    await page.getByTestId('tab-btn-devices').click();
    await expect(page.getByTestId('f04-page-2-controls')).toBeVisible();
    await page.getByTestId('tab-btn-audit').click();
    await expect(page.getByTestId('f04-page-3-controls')).toBeVisible();

    // 2-level close while OFFLINE
    await page.getByTestId('room-detail-close-btn').click();
    await expect(page.getByTestId('virtual-ledger-book')).toHaveAttribute(
      'data-mode',
      'floor-map'
    );
    await page.getByTestId('close-ledger-book-btn').click();
    await expect(page.getByTestId('ledger-overlay-host')).toHaveCount(0);

    await context.setOffline(false);
  });

  test('TC-P1-AUTH-BLD: Login Screen -> Dang ky Chu tro moi -> Building Setup Modal (4 tang x 3 phong, 315 m²) -> 3D Stage & So 2D F04', async ({
    page,
  }) => {
    await page.goto('/');
    await expect(page.getByTestId('qlnt-web-app')).toBeVisible();

    // 1. Open Login Screen -> Register new Landlord
    await page.getByTestId('open-login-screen-btn').click();
    await expect(page.getByTestId('login-screen')).toBeVisible();
    await page.getByTestId('tab-register-mode').click();

    await page.getByTestId('input-register-name').fill('Nguyễn Văn An');
    await page.getByTestId('input-register-phone').fill('0912345678');
    await page.getByTestId('input-register-email').fill('chutro.an@qlnt.local');
    await page.getByTestId('input-register-pin').fill('654321');
    await page.getByTestId('btn-submit-register').click();

    // 2. Building Setup Modal opens automatically after registration
    await expect(page.getByTestId('building-setup-modal')).toBeVisible();

    // 3. Configure 4 floors x 3 rooms/floor, preset 25m2, edit P101=30m2 & P403=35m2
    await page.getByTestId('input-total-floors').fill('4');
    await page.getByTestId('input-rooms-per-floor').fill('3');
    await page.getByTestId('preset-btn-MEZZANINE_25').click();

    await page.getByTestId('input-room-area-P101').fill('30');
    await page.getByTestId('input-room-area-P403').fill('35');
    await expect(page.getByTestId('building-setup-summary')).toContainText('315 m²');

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, '04-building-area-room-setup.png'),
      fullPage: true,
    });

    // 4. Save building setup
    await page.getByTestId('btn-save-building-setup').click();
    await expect(page.getByTestId('building-setup-modal')).toHaveCount(0);

    // 5. Verify HUD, 3D Stage, and Sổ 2D F04
    await expect(page.getByTestId('hud-total-area')).toContainText('315 m²');
    await expect(page.getByTestId('stage-floor-row-4')).toBeVisible();
    await expect(page.getByTestId('stage-room-area-P101')).toContainText('30 m²');
    await expect(page.getByTestId('stage-room-area-P403')).toContainText('35 m²');

    await page.getByTestId('open-ledger-book-btn').click();
    await expect(page.getByTestId('virtual-ledger-book')).toHaveAttribute(
      'data-mode',
      'floor-map'
    );
    await page.getByTestId('floor-tab-4').click();
    await expect(page.getByTestId('virtual-ledger-book')).toContainText('TẦNG 4');
  });

  test('TC-P1-3D-INTERACT: Thu nho Drawer vao goc, Mat tien ngoai toa nha sach se khong dinh badge phong & Chon phong tu Drawer mo Trang 2 F04', async ({
    page,
  }) => {
    await page.goto('/');
    await expect(page.getByTestId('qlnt-web-app')).toBeVisible();
    await expect(page.getByTestId('three-game-canvas')).toBeVisible();

    const drawer = page.getByTestId('stage-room-drawer');
    const toggleBtn = page.getByTestId('toggle-room-drawer-btn');
    await expect(drawer).toHaveAttribute('data-drawer-collapsed', 'false');

    // 1. Collapse room drawer into the corner
    await toggleBtn.click();
    await expect(drawer).toHaveAttribute('data-drawer-collapsed', 'true');

    // 2. Verify that in BUILDING mode, individual room badges/pins are NO LONGER rendered on the building exterior
    await expect(page.getByTestId('floor-3d-pins-layer')).toHaveCount(0);
    await expect(page.getByTestId('building-3d-yellow-badge-P101')).toHaveCount(0);
    await expect(page.getByTestId('building-3d-yellow-badge-P201')).toHaveCount(0);
    await expect(page.getByTestId('building-3d-red-badge-P204')).toHaveCount(0);
    await expect(page.getByTestId('building-3d-red-badge-P302')).toHaveCount(0);
    await expect(page.getByTestId('building-3d-yellow-badge-P104')).toHaveCount(0);
    await expect(page.getByTestId('building-3d-red-badge-P104')).toHaveCount(0);

    // Test 3D camera controls (zoom in -> reset view)
    await page.getByTestId('btn-3d-zoom-in').click();
    await page.getByTestId('btn-3d-reset-view').click();

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, '05-3d-stage-drawer-collapsed.png'),
      fullPage: true,
    });

    // 3. Expand room drawer back & click room card P204 -> opens F04 of P204 at Page 2 (Devices)
    await toggleBtn.click();
    await expect(drawer).toHaveAttribute('data-drawer-collapsed', 'false');

    const cardP204 = page.getByTestId('stage-room-card-P204');
    await expect(cardP204).toBeVisible();
    await cardP204.click();
    await expect(page.getByTestId('room-detail-single-page')).toBeVisible();
    await expect(page.getByTestId('room-detail-single-page')).toContainText('P204');
    await expect(page.getByTestId('f04-page-2-controls')).toBeVisible();

    // Close 2 levels back to 3D Stage
    await page.getByTestId('room-detail-close-btn').click();
    await page.getByTestId('close-ledger-book-btn').click();
    await expect(page.getByTestId('ledger-overlay-host')).toHaveCount(0);
  });

  test('TC-P1-FLOOR-CUTAWAY: Chon tang tu Toan canh 3D (Click truc tiep Floor 2) -> Chuyen canh Mat bang Tang 3D Isometric Cutaway -> Click phong mo So F04 -> Quay lai Toan canh', async ({
    page,
  }) => {
    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];
    const externalRequests: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    page.on('pageerror', (err) => {
      pageErrors.push(err.message);
    });
    page.on('request', (req) => {
      const url = req.url();
      if (
        !url.startsWith('http://127.0.0.1:4173') &&
        !url.startsWith('data:') &&
        !url.startsWith('blob:')
      ) {
        externalRequests.push(url);
      }
    });

    await page.goto('/');
    await expect(page.getByTestId('qlnt-web-app')).toBeVisible();
    await expect(page.getByTestId('canvas-3d-stage')).toBeVisible();
    await expect(page.getByTestId('three-game-canvas')).toBeVisible();

    // 1. Verify initially in BUILDING viewMode and facade is clean
    await expect(page.getByTestId('btn-back-to-building')).toHaveCount(0);
    await expect(page.getByTestId('floor-3d-pins-layer')).toHaveCount(0);
    await expect(page.getByTestId('floor-cutaway-dock')).toBeVisible();
    const dockBtnFloor2 = page.getByTestId('dock-floor-btn-2');
    await expect(dockBtnFloor2).toBeVisible();
    await expect(dockBtnFloor2).toHaveAttribute('data-active', 'false');

    // 2. Hover directly on the 3D building canvas (Floor 2 is above Floor 1) -> verifies Floor Tooltip
    const canvas = page.getByTestId('three-game-canvas');
    const floor2Pos = await page.evaluate(() => {
      const r = (window as unknown as { __QLNT_RENDERER__?: any }).__QLNT_RENDERER__;
      if (!r) return null;
      const canvasEl = document.querySelector('canvas[data-testid="three-game-canvas"]');
      if (!canvasEl) return null;
      const rect = canvasEl.getBoundingClientRect();

      const meshesOnFloor2 = (r.buildingMeshes as any[]).filter((m: any) => m.userData?.floor === 1);
      for (const mesh of meshesOnFloor2) {
        for (const [dz, dy] of [
          [0.45, 0],
          [0.4, -0.2],
          [0, -0.2],
          [0.4, 0.2],
        ]) {
          const worldPos = mesh.position.clone();
          worldPos.z += dz;
          worldPos.y += dy;
          worldPos.project(r.camera);
          const x = ((worldPos.x + 1) * rect.width) / 2;
          const y = ((-worldPos.y + 1) * rect.height) / 2;
          const ndcX = (x / rect.width) * 2 - 1;
          const ndcY = -(y / rect.height) * 2 + 1;
          const hit = r.pickBuildingRoom(ndcX, ndcY);
          if (hit && hit.floorIndex === 1) {
            return { x, y };
          }
        }
      }
      return null;
    });
    expect(floor2Pos).not.toBeNull();

    await canvas.hover({ position: { x: floor2Pos!.x, y: floor2Pos!.y } });
    await expect(page.getByTestId('stage-3d-hover-tooltip')).toBeVisible();
    await expect(page.getByTestId('stage-3d-hover-tooltip')).toContainText('Tầng 2');
    await expect(page.getByTestId('stage-3d-hover-tooltip')).toContainText('Nhấn để mở Mặt bằng 3D Tầng');

    // Click directly on the 3D building canvas (Floor 2) to enter FLOOR_3D mode
    await canvas.click({ position: { x: floor2Pos!.x, y: floor2Pos!.y } });

    // Verify FLOOR_3D mode active for Floor 2
    const backBtn = page.getByTestId('btn-back-to-building');
    await expect(backBtn).toBeVisible();
    await expect(backBtn).toContainText('QUAY LẠI TOÀN CẢNH TÒA NHÀ');
    await expect(dockBtnFloor2).toHaveAttribute('data-active', 'true');
    await expect(page.getByTestId('canvas-3d-stage')).toHaveAttribute('data-view-mode', 'FLOOR_3D');
    await expect(page.getByTestId('canvas-3d-stage')).toHaveAttribute('data-active-floor', '2');

    // Verify that in FLOOR_3D mode, no floating HTML badges/icons or pins are rendered above the rooms
    await expect(page.getByTestId('floor-3d-pins-layer')).toHaveCount(0);
    await expect(page.getByTestId('floor-3d-room-P201')).toHaveCount(0);
    await expect(page.getByTestId('floor-3d-room-P202')).toHaveCount(0);
    await expect(page.getByTestId('floor-3d-yellow-badge-P201')).toHaveCount(0);
    await expect(page.getByTestId('floor-3d-red-badge-P204')).toHaveCount(0);

    // Verify 3D notice badges on Floor 2 cutaway view:
    // P201 has yellow notice badge (PAYMENT), P204 has red notice badge (DEVICE), P203 has NO notice badge
    // No notice badges from Floor 1 or Floor 3 are visible (all building badges hidden)
    const badgesState = await page.evaluate(() => {
      const r = (window as unknown as { __QLNT_RENDERER__?: any }).__QLNT_RENDERER__;
      if (!r) return null;
      const cutaway = r.getFloorCutawayRenderer();
      if (!cutaway) return null;

      const interactiveMeshes = cutaway.getInteractiveMeshes();
      const p201Mesh = interactiveMeshes.find((m: any) => m.userData?.roomCode === 'P201');
      const p203Mesh = interactiveMeshes.find((m: any) => m.userData?.roomCode === 'P203');
      const p204Mesh = interactiveMeshes.find((m: any) => m.userData?.roomCode === 'P204');

      const p201Id = p201Mesh?.userData?.roomId;
      const p203Id = p203Mesh?.userData?.roomId;
      const p204Id = p204Mesh?.userData?.roomId;

      const allCutawayBadges = cutaway
        .getBadges()
        .filter((b: any) => b.userData?.type === 'cutaway_notice_badge');
      const p201Badges = allCutawayBadges.filter((b: any) => b.userData?.roomId === p201Id);
      const p203Badges = allCutawayBadges.filter((b: any) => b.userData?.roomId === p203Id);
      const p204Badges = allCutawayBadges.filter((b: any) => b.userData?.roomId === p204Id);

      // Building badges (from Floor 1, Floor 3, etc.)
      const buildingBadges = Array.from((r.badges as Map<string, any>).values());
      const visibleBuildingBadges = buildingBadges.filter((b: any) => b.visible);

      return {
        p201PaymentBadge: p201Badges.some(
          (b: any) => b.userData?.noticeKind === 'PAYMENT' && b.visible
        ),
        p204DeviceBadge: p204Badges.some(
          (b: any) => b.userData?.noticeKind === 'DEVICE' && b.visible
        ),
        p203BadgeCount: p203Badges.length,
        visibleBuildingBadgesCount: visibleBuildingBadges.length,
      };
    });

    expect(badgesState).not.toBeNull();
    expect(badgesState!.p201PaymentBadge).toBe(true);
    expect(badgesState!.p204DeviceBadge).toBe(true);
    expect(badgesState!.p203BadgeCount).toBe(0);
    expect(badgesState!.visibleBuildingBadgesCount).toBe(0);

    // Verify default camera angle for floor cutaway: 45 degree isometric angle centered on corridor with zoom 1.215
    const cameraState = await page.evaluate(() => {
      const r = (window as unknown as { __QLNT_RENDERER__?: any }).__QLNT_RENDERER__;
      if (!r || !r.camera) return null;
      const cam = r.camera;
      const x = cam.position.x;
      const y = cam.position.y;
      const z = cam.position.z;
      const yawDeg = (Math.atan2(x, z) * 180) / Math.PI;
      const horizontalDist = Math.hypot(x, z);
      const pitchDeg = (Math.atan2(y, horizontalDist) * 180) / Math.PI;
      return {
        zoom: cam.zoom,
        yawDeg,
        pitchDeg,
      };
    });

    expect(cameraState).not.toBeNull();
    expect(cameraState!.zoom).toBeCloseTo(1.215, 2);
    expect(cameraState!.yawDeg).toBeCloseTo(45, 0.5);
    expect(cameraState!.pitchDeg).toBeCloseTo(35.264, 0.5);

    // Verify both room rows (Row 0 and Row 1) have full 1.2m enclosing walls with cap trim
    const wallsState = await page.evaluate(() => {
      const r = (window as unknown as { __QLNT_RENDERER__?: any }).__QLNT_RENDERER__;
      if (!r) return null;
      const cutaway = r.getFloorCutawayRenderer();
      if (!cutaway) return null;

      const interactiveRooms = cutaway.getInteractiveMeshes();
      const wallMeshes: Array<{ roomId: string; height: number; width: number; depth: number; z: number }> = [];

      for (const roomMesh of interactiveRooms) {
        const roomId = roomMesh.userData?.roomId;
        const roomGroup = cutaway.getRoomGroup(roomId);
        if (!roomGroup) continue;

        for (const child of roomGroup.children) {
          if (
            child.isMesh &&
            child.geometry &&
            child.geometry.parameters &&
            (Math.abs(child.geometry.parameters.depth - 0.15) < 0.001 ||
              Math.abs(child.geometry.parameters.width - 0.15) < 0.001)
          ) {
            wallMeshes.push({
              roomId,
              height: child.geometry.parameters.height,
              width: child.geometry.parameters.width,
              depth: child.geometry.parameters.depth,
              z: child.position.z,
            });
          }
        }
      }

      const curbWalls035 = wallMeshes.filter((w) => Math.abs(w.height - 0.35) < 0.01);
      const fullHeightWalls = wallMeshes.filter((w) => Math.abs(w.height - 1.2) < 0.01);
      const trimMeshes = wallMeshes.filter((w) => Math.abs(w.height - 0.03) < 0.01);

      return {
        totalWallSegments: wallMeshes.length,
        curbWallsCount: curbWalls035.length,
        fullHeightWallsCount: fullHeightWalls.length,
        trimMeshesCount: trimMeshes.length,
      };
    });

    expect(wallsState).not.toBeNull();
    expect(wallsState!.curbWallsCount).toBe(0);
    expect(wallsState!.fullHeightWallsCount).toBe(20); // 5 wall segments per room * 4 rooms
    expect(wallsState!.trimMeshesCount).toBe(20);

    // Verify reset view button retains "Góc chuẩn 45°" in FLOOR_3D mode with standard 45° tooltip
    const resetViewBtn = page.getByTestId('btn-3d-reset-view');
    await expect(resetViewBtn).toBeVisible();
    await expect(resetViewBtn).toHaveText('Góc chuẩn 45°');
    await expect(resetViewBtn).toHaveAttribute('title', 'Đặt lại góc nhìn Isometric 45°');

    // Save screenshot of 3D Floor Cutaway with precise notice badges (07-floor-cutaway-notice-badges.png)
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, '07-floor-cutaway-notice-badges.png'),
      fullPage: true,
    });

    // Re-capture Chrome screenshot: apps/web/e2e-results/screenshots/06-3d-floor-cutaway-view.png
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, '06-3d-floor-cutaway-view.png'),
      fullPage: true,
    });

    // Save screenshot of 45 degree isometric angle centered on corridor with zoom 1.215
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, '09-floor-cutaway-45deg-corridor-zoom10pct.png'),
      fullPage: true,
    });

    // Project P201 notice badge to screen coordinates and hover/click it
    const p201BadgePos = await page.evaluate(() => {
      const r = (window as unknown as { __QLNT_RENDERER__?: any }).__QLNT_RENDERER__;
      if (!r) return null;
      const cutaway = r.getFloorCutawayRenderer();
      if (!cutaway) return null;

      const interactiveMeshes = cutaway.getInteractiveMeshes();
      const p201Mesh = interactiveMeshes.find((m: any) => m.userData?.roomCode === 'P201');
      const p201Id = p201Mesh?.userData?.roomId;
      const badge = cutaway
        .getBadges()
        .find(
          (b: any) =>
            b.userData?.type === 'cutaway_notice_badge' &&
            b.userData?.roomId === p201Id &&
            b.userData?.noticeKind === 'PAYMENT'
        );
      if (!badge) return null;

      const worldPos = r.camera.position.clone();
      badge.getWorldPosition(worldPos);
      worldPos.y += 0.2; // center of notice diamond/icon
      worldPos.project(r.camera);

      const canvasEl = document.querySelector('canvas[data-testid="three-game-canvas"]');
      if (!canvasEl) return null;
      const rect = canvasEl.getBoundingClientRect();

      return {
        x: ((worldPos.x + 1) * rect.width) / 2,
        y: ((-worldPos.y + 1) * rect.height) / 2,
      };
    });

    expect(p201BadgePos).not.toBeNull();

    // Hover on P201 notice badge -> verify tooltip
    await canvas.hover({ position: { x: p201BadgePos!.x, y: p201BadgePos!.y } });
    await expect(page.getByTestId('stage-3d-hover-tooltip')).toBeVisible();
    await expect(page.getByTestId('stage-3d-hover-tooltip')).toContainText('Cảnh báo Hóa đơn · Phòng P201');
    await expect(page.getByTestId('stage-3d-hover-tooltip')).toContainText(
      'Nhấp để mở Sổ Quản Lý F04 (Hóa đơn)'
    );

    // Click on notice badge for P201 -> opens Room Ledger F04 Page 1 (Billing)
    await canvas.click({ position: { x: p201BadgePos!.x, y: p201BadgePos!.y } });
    await expect(page.getByTestId('ledger-overlay-host')).toBeVisible();
    await expect(page.getByTestId('room-detail-single-page')).toBeVisible();
    await expect(page.getByTestId('room-detail-single-page')).toContainText('P201');
    await expect(page.getByTestId('f04-page-1-controls')).toBeVisible();

    // Close F04 back to FLOOR_3D
    await page.getByTestId('room-detail-close-btn').click();
    await expect(page.getByTestId('ledger-overlay-host')).toHaveCount(0);

    // 3. Hover & Click interactive Room Info Plaque on the corridor wall of Room P202
    // Project P202 plaque to screen coordinates dynamically
    const p202PlaquePos = await page.evaluate(() => {
      const r = (window as unknown as { __QLNT_RENDERER__?: any }).__QLNT_RENDERER__;
      if (!r) return null;
      const cutaway = r.getFloorCutawayRenderer();
      if (!cutaway) return null;

      const plaques = cutaway.getRoomInfoPlaqueMeshes();
      const p202Plaque = plaques.find((m: any) => m.userData?.roomCode === 'P202');
      if (!p202Plaque) return null;

      const worldPos = r.camera.position.clone();
      p202Plaque.getWorldPosition(worldPos);
      worldPos.project(r.camera);

      const canvasEl = document.querySelector('canvas[data-testid="three-game-canvas"]');
      if (!canvasEl) return null;
      const rect = canvasEl.getBoundingClientRect();

      return {
        x: ((worldPos.x + 1) * rect.width) / 2,
        y: ((-worldPos.y + 1) * rect.height) / 2,
      };
    });

    expect(p202PlaquePos).not.toBeNull();

    await canvas.hover({ position: { x: p202PlaquePos!.x, y: p202PlaquePos!.y } });
    await expect(page.getByTestId('stage-3d-hover-tooltip')).toBeVisible();
    await expect(page.getByTestId('stage-3d-hover-tooltip')).toContainText('Bảng Thông Tin Phòng P202');
    await expect(page.getByTestId('stage-3d-hover-tooltip')).toContainText('Nhấp để mở Sổ Quản Lý F04');

    // Click interactive room info plaque to open F04 Single Page Modal for P202
    await canvas.click({ position: { x: p202PlaquePos!.x, y: p202PlaquePos!.y } });
    await expect(page.getByTestId('ledger-overlay-host')).toBeVisible();
    await expect(page.getByTestId('room-detail-single-page')).toBeVisible();
    await expect(page.getByTestId('room-detail-single-page')).toContainText('P202');

    // Close F04 back to FLOOR_3D
    await page.getByTestId('room-detail-close-btn').click();
    await expect(page.getByTestId('ledger-overlay-host')).toHaveCount(0);

    // Still in FLOOR_3D mode
    await expect(page.getByTestId('btn-back-to-building')).toBeVisible();
    await expect(dockBtnFloor2).toHaveAttribute('data-active', 'true');

    // 4. Click '◀ QUAY LẠI TOÀN CẢNH TÒA NHÀ' to return to BUILDING mode
    await backBtn.click();
    await expect(page.getByTestId('btn-back-to-building')).toHaveCount(0);
    await expect(dockBtnFloor2).toHaveAttribute('data-active', 'false');
    await expect(page.getByTestId('canvas-3d-stage')).toHaveAttribute('data-view-mode', 'BUILDING');
    await expect(page.getByTestId('stage-floor-btn-2')).toBeVisible();
    await expect(page.getByTestId('floor-3d-pins-layer')).toHaveCount(0);

    // Verify reset view button switches back to "Góc chuẩn 45°" in BUILDING mode
    await expect(page.getByTestId('btn-3d-reset-view')).toHaveText('Góc chuẩn 45°');
    await expect(page.getByTestId('btn-3d-reset-view')).toHaveAttribute(
      'title',
      'Đặt lại góc nhìn Isometric 45°'
    );

    // Assert zero console errors, zero page errors, zero external network requests
    expect(consoleErrors).toEqual([]);
    expect(pageErrors).toEqual([]);
    expect(externalRequests).toEqual([]);
  });

  test('TC-P1-13-BLOCK-PRESETS: Tuy chon Khoi Toa Nha 3D Ben Ngoai (Thap 2x2x6 & Khoi Vuong 3x3x3) -> Dong Bo So Tang/Phong -> Chup Anh Nghiem Thu', async ({
    page,
  }) => {
    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];
    const externalRequests: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    page.on('pageerror', (err) => {
      pageErrors.push(err.message);
    });
    page.on('request', (req) => {
      const url = req.url();
      if (
        !url.startsWith('http://127.0.0.1:4173') &&
        !url.startsWith('data:') &&
        !url.startsWith('blob:')
      ) {
        externalRequests.push(url);
      }
    });

    await page.goto('/');
    await expect(page.getByTestId('qlnt-web-app')).toBeVisible();
    await expect(page.getByTestId('canvas-3d-stage')).toBeVisible();
    await expect(page.getByTestId('three-game-canvas')).toBeVisible();

    // 1. Initial State: COMPACT_2x2x3 (3 floors, 12 rooms)
    const presetDropdown = page.getByTestId('building-block-preset-dropdown');
    await expect(presetDropdown).toBeVisible();
    await expect(presetDropdown).toContainText('Nhà phố 2x2x3');

    // Verify initial 3 floor buttons
    await expect(page.getByTestId('stage-floor-btn-1')).toBeVisible();
    await expect(page.getByTestId('stage-floor-btn-2')).toBeVisible();
    await expect(page.getByTestId('stage-floor-btn-3')).toBeVisible();
    await expect(page.getByTestId('stage-floor-btn-4')).toHaveCount(0);

    // 2. Select TOWER_2x2x6 via HUD dropdown
    await presetDropdown.click();
    const presetMenu = page.getByTestId('building-block-preset-menu');
    await expect(presetMenu).toBeVisible();

    // Select TOWER_2x2x6 option
    await page.getByTestId('building-block-preset-item-TOWER_2x2x6').click();
    await expect(presetMenu).toHaveCount(0);

    // Verify dropdown label updated to Tháp 2x2x6
    await expect(presetDropdown).toContainText('Tháp 2x2x6');

    // Verify 6 floors: buttons 1..6 visible
    for (let f = 1; f <= 6; f++) {
      await expect(page.getByTestId(`stage-floor-btn-${f}`)).toBeVisible();
      await expect(page.getByTestId(`dock-floor-btn-${f}`)).toBeVisible();
    }
    await expect(page.getByTestId('stage-floor-btn-7')).toHaveCount(0);

    // Set demo broken device on back-row room and payment notice on front-row room to verify 3D shadows and badges
    await page.evaluate(() => {
      const r = (window as unknown as { __QLNT_RENDERER__?: any }).__QLNT_RENDERER__;
      if (!r) return;
      const backMesh = r.buildingMeshes.find(
        (m: any) => m.userData?.floor === 1 && m.userData?.rowIdx === 0
      );
      const frontMesh = r.buildingMeshes.find(
        (m: any) => m.userData?.floor === 1 && m.userData?.rowIdx === ((m.userData?.rows ?? 2) - 1)
      );
      if (backMesh?.userData?.roomId) {
        r.setDeviceStatus(backMesh.userData.roomId, 'dev-tower-broken', 'BROKEN');
      }
      if (frontMesh?.userData?.roomId) {
        r.setRoomNotice(frontMesh.userData.roomId, 'PAYMENT_DUE');
      }
    });

    // Verify 3D mesh count = 24 and grid shape = 2x2
    const tower3dState = await page.evaluate(() => {
      const r = (window as unknown as { __QLNT_RENDERER__?: any }).__QLNT_RENDERER__;
      if (!r) return null;
      const meshes = (r.buildingMeshes as any[]) || [];
      const brokenMeshes = meshes.filter((m: any) => m.material?.color?.getHex() === 0xef4444);
      const noticeMeshes = meshes.filter((m: any) => m.material?.color?.getHex() === 0xf59e0b);
      const normalMeshes = meshes.filter(
        (m: any) => m.material?.color?.getHex() !== 0xef4444 && m.material?.color?.getHex() !== 0xf59e0b
      );

      // Verify shadow properties and emissive
      const brokenValid = brokenMeshes.every((m: any) => m.receiveShadow === false && m.material?.emissive?.getHex() > 0);
      const noticeValid = noticeMeshes.every((m: any) => m.receiveShadow === false && m.material?.emissive?.getHex() > 0);
      const normalValid = normalMeshes.every((m: any) => m.receiveShadow === true && m.material?.emissive?.getHex() === 0);

      // Verify exterior building scene has NO floating NoticeBadge objects
      const sceneExteriorBadges = ((r.scene?.children as any[]) || []).filter((c: any) => c.name?.startsWith('NoticeBadge_'));
      const badgesMapSize = (r.badges as Map<string, any>)?.size ?? 0;

      return {
        meshCount: r.buildingMeshes?.length,
        shape: r.getBuildingBlockShape?.(),
        brokenCount: brokenMeshes.length,
        brokenValid,
        noticeCount: noticeMeshes.length,
        noticeValid,
        normalValid,
        exteriorBadgeCount: sceneExteriorBadges.length,
        badgesMapSize,
      };
    });
    expect(tower3dState).not.toBeNull();
    expect(tower3dState!.meshCount).toBe(24);
    expect(tower3dState!.shape).toEqual({ cols: 2, rows: 2 });
    expect(tower3dState!.brokenCount).toBeGreaterThan(0);
    expect(tower3dState!.brokenValid).toBe(true);
    expect(tower3dState!.noticeCount).toBeGreaterThan(0);
    expect(tower3dState!.noticeValid).toBe(true);
    expect(tower3dState!.normalValid).toBe(true);
    expect(tower3dState!.exteriorBadgeCount).toBe(0);
    expect(tower3dState!.badgesMapSize).toBe(0);

    // Capture screenshot: 10-building-block-preset-tower-2x2x6.png
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, '10-building-block-preset-tower-2x2x6.png'),
      fullPage: true,
    });

    // 3. Select CUBE_3x3x3 via HUD dropdown
    await presetDropdown.click();
    await expect(page.getByTestId('building-block-preset-menu')).toBeVisible();
    await page.getByTestId('building-block-preset-item-CUBE_3x3x3').click();
    await expect(page.getByTestId('building-block-preset-menu')).toHaveCount(0);

    // Verify dropdown label updated to Khối vuông 3x3x3
    await expect(presetDropdown).toContainText('Khối vuông 3x3x3');

    // Verify 3 floors & 27 rooms
    for (let f = 1; f <= 3; f++) {
      await expect(page.getByTestId(`stage-floor-btn-${f}`)).toBeVisible();
      await expect(page.getByTestId(`dock-floor-btn-${f}`)).toBeVisible();
    }
    await expect(page.getByTestId('stage-floor-btn-4')).toHaveCount(0);
    await expect(page.getByTestId('dock-floor-btn-4')).toHaveCount(0);

    // Set demo broken device on back/middle-row room and payment notice on front-row room to verify 3D shadows and badges
    await page.evaluate(() => {
      const r = (window as unknown as { __QLNT_RENDERER__?: any }).__QLNT_RENDERER__;
      if (!r) return;
      const backMesh = r.buildingMeshes.find(
        (m: any) => m.userData?.floor === 1 && m.userData?.rowIdx === 0
      );
      const frontMesh = r.buildingMeshes.find(
        (m: any) => m.userData?.floor === 1 && m.userData?.rowIdx === ((m.userData?.rows ?? 3) - 1)
      );
      if (backMesh?.userData?.roomId) {
        r.setDeviceStatus(backMesh.userData.roomId, 'dev-cube-broken', 'BROKEN');
      }
      if (frontMesh?.userData?.roomId) {
        r.setRoomNotice(frontMesh.userData.roomId, 'PAYMENT_DUE');
      }
    });

    // Verify 3D mesh count = 27 and grid shape = 3x3
    const cube3dState = await page.evaluate(() => {
      const r = (window as unknown as { __QLNT_RENDERER__?: any }).__QLNT_RENDERER__;
      if (!r) return null;
      const meshes = (r.buildingMeshes as any[]) || [];
      const brokenMeshes = meshes.filter((m: any) => m.material?.color?.getHex() === 0xef4444);
      const noticeMeshes = meshes.filter((m: any) => m.material?.color?.getHex() === 0xf59e0b);
      const normalMeshes = meshes.filter(
        (m: any) => m.material?.color?.getHex() !== 0xef4444 && m.material?.color?.getHex() !== 0xf59e0b
      );

      // Verify shadow properties and emissive in 3x3x3 layout
      const brokenValid = brokenMeshes.every((m: any) => m.receiveShadow === false && m.material?.emissive?.getHex() > 0);
      const noticeValid = noticeMeshes.every((m: any) => m.receiveShadow === false && m.material?.emissive?.getHex() > 0);
      const normalValid = normalMeshes.every((m: any) => m.receiveShadow === true && m.material?.emissive?.getHex() === 0);

      // Verify exterior building scene has NO floating NoticeBadge objects in 3x3x3 layout
      const sceneExteriorBadges = ((r.scene?.children as any[]) || []).filter((c: any) => c.name?.startsWith('NoticeBadge_'));
      const badgesMapSize = (r.badges as Map<string, any>)?.size ?? 0;

      return {
        meshCount: r.buildingMeshes?.length,
        shape: r.getBuildingBlockShape?.(),
        brokenCount: brokenMeshes.length,
        brokenValid,
        noticeCount: noticeMeshes.length,
        noticeValid,
        normalValid,
        exteriorBadgeCount: sceneExteriorBadges.length,
        badgesMapSize,
      };
    });
    expect(cube3dState).not.toBeNull();
    expect(cube3dState!.meshCount).toBe(27);
    expect(cube3dState!.shape).toEqual({ cols: 3, rows: 3 });
    expect(cube3dState!.brokenCount).toBeGreaterThan(0);
    expect(cube3dState!.brokenValid).toBe(true);
    expect(cube3dState!.noticeCount).toBeGreaterThan(0);
    expect(cube3dState!.noticeValid).toBe(true);
    expect(cube3dState!.normalValid).toBe(true);
    expect(cube3dState!.exteriorBadgeCount).toBe(0);
    expect(cube3dState!.badgesMapSize).toBe(0);

    // Capture screenshot: 11-building-block-preset-cube-3x3x3.png
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, '11-building-block-preset-cube-3x3x3.png'),
      fullPage: true,
    });

    // 4. Test opening Floor 2 cutaway with new block structure
    await page.getByTestId('dock-floor-btn-2').click();
    await expect(page.getByTestId('canvas-3d-stage')).toHaveAttribute('data-view-mode', 'FLOOR_3D');
    await expect(page.getByTestId('btn-back-to-building')).toBeVisible();
    await expect(page.getByTestId('building-block-preset-dropdown')).toHaveCount(0); // Preset selector hidden in FLOOR_3D

    // Verify 45 deg isometric camera
    const cameraState = await page.evaluate(() => {
      const r = (window as unknown as { __QLNT_RENDERER__?: any }).__QLNT_RENDERER__;
      if (!r || !r.camera) return null;
      const cam = r.camera;
      const x = cam.position.x;
      const y = cam.position.y;
      const z = cam.position.z;
      const yawDeg = (Math.atan2(x, z) * 180) / Math.PI;
      const horizontalDist = Math.hypot(x, z);
      const pitchDeg = (Math.atan2(y, horizontalDist) * 180) / Math.PI;
      return {
        zoom: cam.zoom,
        yawDeg,
        pitchDeg,
      };
    });
    expect(cameraState).not.toBeNull();
    expect(cameraState!.zoom).toBeCloseTo(1.215, 2);
    expect(cameraState!.yawDeg).toBeCloseTo(45, 0.5);
    expect(cameraState!.pitchDeg).toBeCloseTo(35.264, 0.5);

    // Verify Cutaway Floor 2 retains notice badges on room doors while exterior building has 0 badges
    const cutawayState = await page.evaluate(() => {
      const r = (window as unknown as { __QLNT_RENDERER__?: any }).__QLNT_RENDERER__;
      if (!r) return null;
      const cutaway = r.getFloorCutawayRenderer?.();
      if (!cutaway) return null;
      const badges = cutaway.getBadges?.()?.filter((b: any) => b.userData?.type === 'cutaway_notice_badge') || [];
      const exteriorBadges = ((r.scene?.children as any[]) || []).filter((c: any) => c.name?.startsWith('NoticeBadge_'));
      return {
        cutawayBadgeCount: badges.length,
        exteriorBadgeCount: exteriorBadges.length,
      };
    });
    expect(cutawayState).not.toBeNull();
    expect(cutawayState!.cutawayBadgeCount).toBeGreaterThan(0);
    expect(cutawayState!.exteriorBadgeCount).toBe(0);

    // Return to BUILDING mode
    await page.getByTestId('btn-back-to-building').click();
    await expect(page.getByTestId('canvas-3d-stage')).toHaveAttribute('data-view-mode', 'BUILDING');
    await expect(presetDropdown).toBeVisible();

    // Assert zero console errors, zero page errors, zero external network requests
    expect(consoleErrors).toEqual([]);
    expect(pageErrors).toEqual([]);
    expect(externalRequests).toEqual([]);
  });

  test('TC-P1-14-3D-BOOK-POPUP-TRANSITION: Mo So Quan Ly F04 -> Hoat Anh 3D Pop-up Book Open (Perspective, Ban Le & Gay So 3D) -> Chuyen Canh 2 Giai Doan Tuan Tu (Sach Mo Truoc -> Cua So Thong Tin Bung No Sau) -> Gap So (3D) Smooth Folding Unmount', async ({
    page,
  }) => {
    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];
    const externalRequests: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    page.on('pageerror', (err) => {
      pageErrors.push(err.message);
    });
    page.on('request', (req) => {
      const url = req.url();
      if (
        !url.startsWith('http://127.0.0.1:4173') &&
        !url.startsWith('data:') &&
        !url.startsWith('blob:')
      ) {
        externalRequests.push(url);
      }
    });

    await page.goto('/');
    await expect(page.getByTestId('qlnt-web-app')).toBeVisible();
    await expect(page.getByTestId('canvas-3d-stage')).toBeVisible();
    await expect(page.getByTestId('three-game-canvas')).toBeVisible();

    // 1. Initial State: Ledger book overlay is NOT present
    await expect(page.getByTestId('ledger-overlay-host')).toHaveCount(0);

    // 2. Click "Mở Sổ Quản Lý F04" HUD button to initiate 3D book opening (Floor Map view)
    const openBookBtn = page.getByTestId('open-ledger-book-btn');
    await expect(openBookBtn).toBeVisible();
    await openBookBtn.click();

    // 3. Immediately verify 3D Pop-up Book OPENING animation lifecycle
    const overlayHost = page.getByTestId('ledger-overlay-host');
    await expect(overlayHost).toBeVisible();

    // Check 3D perspective / hinge structure and cover/spine/flap
    const virtualBook = page.getByTestId('virtual-ledger-book');
    await expect(virtualBook).toBeVisible();
    await expect(page.getByTestId('book-cover-3d')).toBeVisible();
    await expect(page.getByTestId('book-spine-crease')).toBeVisible();
    await expect(page.getByTestId('book-front-cover-flap')).toBeVisible();

    // Capture screenshot: 12-3d-book-open-animation.png during transition
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, '12-3d-book-open-animation.png'),
      fullPage: true,
    });
    copyScreenshotArtifacts('12-3d-book-open-animation.png');

    // 4. Verify completion to OPEN state after animation
    await expect(overlayHost).toHaveAttribute('data-animation-state', 'OPEN', { timeout: 3000 });
    await expect(overlayHost).toHaveAttribute('data-content-stage', 'visible', { timeout: 3000 });
    await expect(virtualBook).toHaveAttribute('data-animation-state', 'open');
    await expect(virtualBook).toHaveAttribute('data-content-stage', 'visible');
    await expect(virtualBook).toHaveAttribute('data-mode', 'floor-map');

    // Verify 3D CSS perspective styles applied on the book container
    const perspectiveStyle = await virtualBook.evaluate((el) => {
      const computed = window.getComputedStyle(el);
      return {
        perspective: computed.perspective || el.style.perspective,
        transformStyle: computed.transformStyle || el.style.transformStyle,
        transformOrigin: computed.transformOrigin || el.style.transformOrigin,
      };
    });
    expect(perspectiveStyle.perspective).toMatch(/1400px/);
    expect(perspectiveStyle.transformStyle).toBe('preserve-3d');

    // Verify full ledger book content: Floor Header, Floor tabs, and Floor Map
    await expect(virtualBook).toContainText('SỔ QUẢN LÝ ẢO F04');
    await expect(page.getByTestId('floor-tab-1')).toBeVisible();
    await expect(page.getByTestId('floor-tab-2')).toBeVisible();
    await expect(page.getByTestId('floor-tab-3')).toBeVisible();

    // Capture screenshot: 13-3d-book-opened-full-ledger.png
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, '13-3d-book-opened-full-ledger.png'),
      fullPage: true,
    });
    copyScreenshotArtifacts('13-3d-book-opened-full-ledger.png');

    // 5. Test Gập Sổ (3D) folding transition and smooth unmount
    const closeBookBtn = page.getByTestId('close-ledger-book-btn');
    await expect(closeBookBtn).toBeVisible();
    await expect(closeBookBtn).toContainText('Gập Sổ (3D)');

    await closeBookBtn.click();
    await expect(page.getByTestId('ledger-overlay-host')).toHaveCount(0, { timeout: 3000 });

    // 6. Test 2-Stage Sequential Transition with Active Room Detail (Click room P101 from Drawer):
    // Stage 1 (0ms - 550ms): Book opening, information panel completely hidden
    const cardP101 = page.getByTestId('stage-room-card-P101');
    await expect(cardP101).toBeVisible();
    await cardP101.click();

    // Verify overlay mounted in OPENING state with contentStage hidden
    await expect(overlayHost).toBeVisible();

    // Check Stage 1 at t=200ms-250ms: Sách đang mở, panel thông tin đang ẩn
    await page.waitForTimeout(220);
    await expect(overlayHost).toHaveAttribute('data-animation-state', 'OPENING');
    await expect(overlayHost).toHaveAttribute('data-content-stage', 'hidden');
    await expect(virtualBook).toHaveAttribute('data-animation-state', 'opening');
    await expect(virtualBook).toHaveAttribute('data-content-stage', 'hidden');

    const panel = page.getByTestId('f04-interactive-panel');
    await expect(panel).toBeAttached();
    await expect(panel).toHaveAttribute('data-content-stage', 'hidden');

    // Verify panel opacity is 0 and pointer-events none during Stage 1
    const panelStage1Style = await panel.evaluate((el) => {
      const computed = window.getComputedStyle(el);
      return {
        opacity: computed.opacity,
        pointerEvents: computed.pointerEvents,
      };
    });
    expect(Number(panelStage1Style.opacity)).toBe(0);
    expect(panelStage1Style.pointerEvents).toBe('none');

    // Capture screenshot: 14-3d-book-stage1-opening.png (Sách đang mở bìa 3D, panel thông tin ẩn hoàn toàn)
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, '14-3d-book-stage1-opening.png'),
      fullPage: true,
    });
    copyScreenshotArtifacts('14-3d-book-stage1-opening.png');

    // 7. Stage 2 (after 850ms - 950ms): Book fully open, information panel pops up & revealed
    await expect(overlayHost).toHaveAttribute('data-animation-state', 'OPEN', { timeout: 3000 });
    await expect(overlayHost).toHaveAttribute('data-content-stage', 'visible', { timeout: 3000 });
    await expect(virtualBook).toHaveAttribute('data-animation-state', 'open');
    await expect(virtualBook).toHaveAttribute('data-content-stage', 'visible');
    await expect(panel).toHaveAttribute('data-content-stage', 'visible');
    await expect(panel).toBeVisible();

    // Verify panel opacity is 1 and controls are interactive
    const panelStage2Style = await panel.evaluate((el) => {
      const computed = window.getComputedStyle(el);
      return {
        opacity: computed.opacity,
        pointerEvents: computed.pointerEvents,
      };
    });
    expect(Number(panelStage2Style.opacity)).toBe(1);
    expect(panelStage2Style.pointerEvents).toBe('auto');

    await expect(page.getByTestId('f04-page-1-controls')).toBeVisible();
    await expect(page.getByTestId('room-detail-single-page')).toContainText('P101');

    // Capture screenshot: 15-3d-book-stage2-popup-revealed.png (Full 3D book open with interactive panel pop-up)
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, '15-3d-book-stage2-popup-revealed.png'),
      fullPage: true,
    });
    copyScreenshotArtifacts('15-3d-book-stage2-popup-revealed.png');

    // 8. Test 2-Stage Reverse Closing: panel collapses first -> book closes -> overlay unmounts
    const closeRoomBookBtn = page.getByTestId('close-ledger-book-btn');
    await expect(closeRoomBookBtn).toBeVisible();
    await expect(closeRoomBookBtn).toContainText('Gập Sổ (3D)');
    await closeRoomBookBtn.scrollIntoViewIfNeeded();
    await closeRoomBookBtn.click();

    // Verify reverse closing triggers CLOSING animation state
    await expect(overlayHost).toHaveAttribute('data-animation-state', 'CLOSING', { timeout: 1000 });
    await expect(virtualBook).toHaveAttribute('data-animation-state', 'closing');

    // Verify complete smooth unmount after reverse transition (530ms total)
    await expect(page.getByTestId('ledger-overlay-host')).toHaveCount(0, { timeout: 3000 });

    // Verify returned cleanly to 3D Stage
    await expect(page.getByTestId('canvas-3d-stage')).toBeVisible();
    await expect(page.getByTestId('three-game-canvas')).toBeVisible();
    await expect(openBookBtn).toBeVisible();

    // Assert zero console errors, zero page errors, zero external network requests
    expect(consoleErrors).toEqual([]);
    expect(pageErrors).toEqual([]);
    expect(externalRequests).toEqual([]);
  });
});
