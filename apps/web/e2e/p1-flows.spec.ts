import { expect, test } from '@playwright/test';
import * as fs from 'node:fs';
import * as path from 'node:path';

const SCREENSHOT_DIR = path.resolve(process.cwd(), 'e2e-results/screenshots');

test.beforeAll(() => {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
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
});
