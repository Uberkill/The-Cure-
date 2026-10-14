import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { startTestServer } from './helpers/testServer.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const AUDIT_DIR = process.env.AUDIT_DIR || path.join(__dirname, '..', 'screenshots', 'responsive_audit');

if (!fs.existsSync(AUDIT_DIR)) {
  fs.mkdirSync(AUDIT_DIR, { recursive: true });
}

const VIEWPORTS = [
  { name: 'mobile_portrait_iphone', width: 390, height: 844, dpr: 3, isMobile: true, hasTouch: true },
  { name: 'mobile_small_se', width: 375, height: 667, dpr: 2, isMobile: true, hasTouch: true },
  { name: 'mobile_landscape', width: 844, height: 390, dpr: 3, isMobile: true, hasTouch: true },
  { name: 'tablet_portrait', width: 768, height: 1024, dpr: 2, isMobile: true, hasTouch: true },
  { name: 'desktop_1080p', width: 1920, height: 1080, dpr: 1, isMobile: false, hasTouch: false },
  { name: 'desktop_4k', width: 3840, height: 2160, dpr: 1.5, isMobile: false, hasTouch: false }
];

async function runAudit() {
  const { baseUrl, close } = await startTestServer();
  console.log(`Responsive Audit Server running on ${baseUrl}`);

  const browser = await chromium.launch({
    headless: true,
    args: ['--use-gl=angle', '--use-angle=default', '--autoplay-policy=no-user-gesture-required']
  });

  const auditReport = [];

  for (const vp of VIEWPORTS) {
    console.log(`\n========================================`);
    console.log(`AUDITING VIEWPORT: ${vp.name} (${vp.width}x${vp.height}, DPR ${vp.dpr})`);
    console.log(`========================================`);

    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: vp.dpr,
      isMobile: vp.isMobile,
      hasTouch: vp.hasTouch
    });
    const page = await context.newPage();

    await page.goto(baseUrl, { waitUntil: 'networkidle' });

    // 1. Audit Main Menu
    const menuAudit = await page.evaluate(() => {
      const menu = document.getElementById('view-main-menu');
      const doc = document.documentElement;
      const body = document.body;
      const startBtn = document.getElementById('btn-menu-start');
      const startRect = startBtn ? startBtn.getBoundingClientRect() : null;

      return {
        hasHorizontalOverflow: doc.scrollWidth > window.innerWidth || body.scrollWidth > window.innerWidth,
        docScrollWidth: doc.scrollWidth,
        windowWidth: window.innerWidth,
        docScrollHeight: doc.scrollHeight,
        windowHeight: window.innerHeight,
        startBtnVisible: !!startBtn && startRect && startRect.bottom <= window.innerHeight && startRect.right <= window.innerWidth,
        startBtnRect: startRect ? { width: startRect.width, height: startRect.height, top: startRect.top, left: startRect.left } : null
      };
    });

    await page.screenshot({ path: path.join(AUDIT_DIR, `${vp.name}_01_main_menu.png`) });
    console.log(`[Main Menu] Overflow: ${menuAudit.hasHorizontalOverflow ? 'YES (OVERFLOW!)' : 'None'}, Start button fits: ${menuAudit.startBtnVisible}`);

    // 2. Open Orientation Form 104-O
    await page.click('#btn-menu-start');
    await page.waitForTimeout(450);

    const orientationAudit = await page.evaluate(() => {
      const modal = document.getElementById('view-orientation');
      const card = modal?.querySelector('.orientation-dossier');
      const cardRect = card ? card.getBoundingClientRect() : null;
      const nextBtn = document.getElementById('btn-orientation-next');
      const nextRect = nextBtn ? nextBtn.getBoundingClientRect() : null;

      // Check Slide 2 control cards
      return {
        modalVisible: modal && !modal.classList.contains('hidden'),
        cardRect: cardRect ? { width: cardRect.width, height: cardRect.height, top: cardRect.top, bottom: cardRect.bottom, left: cardRect.left, right: cardRect.right } : null,
        cardOverflowsViewportY: cardRect ? (cardRect.bottom > window.innerHeight || cardRect.top < 0) : false,
        cardOverflowsViewportX: cardRect ? (cardRect.right > window.innerWidth || cardRect.left < 0) : false,
        nextBtnFitsScreen: nextRect ? (nextRect.bottom <= window.innerHeight && nextRect.top >= 0) : false
      };
    });

    await page.screenshot({ path: path.join(AUDIT_DIR, `${vp.name}_02_orientation_step1.png`) });
    console.log(`[Orientation Step 1] Overflow Y: ${orientationAudit.cardOverflowsViewportY}, Overflow X: ${orientationAudit.cardOverflowsViewportX}, Next Btn visible: ${orientationAudit.nextBtnFitsScreen}`);

    // Check Orientation Step 2 (Controls Grid)
    await page.click('#btn-orientation-next');
    await page.waitForTimeout(300);
    const step2Audit = await page.evaluate(() => {
      const card = document.querySelector('.orientation-dossier');
      const cardRect = card ? card.getBoundingClientRect() : null;
      const grid = document.querySelector('.orientation-controls-grid');
      const gridRect = grid ? grid.getBoundingClientRect() : null;
      return {
        cardHeight: cardRect?.height,
        gridHeight: gridRect?.height,
        cardBottom: cardRect?.bottom,
        windowHeight: window.innerHeight,
        overflowsBottom: cardRect ? cardRect.bottom > window.innerHeight : false
      };
    });
    await page.screenshot({ path: path.join(AUDIT_DIR, `${vp.name}_03_orientation_step2.png`) });
    console.log(`[Orientation Step 2] Overflows bottom: ${step2Audit.overflowsBottom} (Card bottom: ${step2Audit.cardBottom}px vs Screen: ${step2Audit.windowHeight}px)`);

    // Advance to Step 3 and Awaken to Chamber
    await page.click('#btn-orientation-next');
    await page.waitForTimeout(200);
    await page.click('#btn-orientation-next'); // Acknowledge & Awaken
    await page.waitForTimeout(1400);

    // 3. Chamber In-Game HUD Audit
    const hudAudit = await page.evaluate(() => {
      const mapBtn = document.getElementById('btn-facility-map-toggle');
      const invBtn = document.getElementById('btn-inventory-toggle');
      const settingsBtn = document.getElementById('btn-settings-toggle');
      const disengageBtn = document.getElementById('btn-camera-disengage');
      const subtitle = document.getElementById('observation-subtitle');

      const mapRect = mapBtn?.getBoundingClientRect();
      const invRect = invBtn?.getBoundingClientRect();
      const setRect = settingsBtn?.getBoundingClientRect();
      const subRect = subtitle?.getBoundingClientRect();

      // Check touch target accessibility (< 44px is fail for touch)
      return {
        mapBtn: mapRect ? { width: mapRect.width, height: mapRect.height, right: mapRect.right, top: mapRect.top } : null,
        invBtn: invRect ? { width: invRect.width, height: invRect.height, right: invRect.right, top: invRect.top } : null,
        settingsBtn: setRect ? { width: setRect.width, height: setRect.height, right: setRect.right, bottom: setRect.bottom } : null,
        subtitle: subRect ? { width: subRect.width, bottom: subRect.bottom } : null,
        hasHudCollision: mapRect && invRect ? (mapRect.right > invRect.left && mapRect.left < invRect.right) : false
      };
    });

    await page.screenshot({ path: path.join(AUDIT_DIR, `${vp.name}_04_chamber_hud.png`) });
    console.log(`[Chamber HUD] Settings button: ${hudAudit.settingsBtn?.width}x${hudAudit.settingsBtn?.height}px`);

    // 4. Open Settings Modal
    await page.click('#btn-settings-toggle');
    await page.waitForTimeout(300);

    const settingsAudit = await page.evaluate(() => {
      const modal = document.getElementById('modal-settings');
      const paper = modal?.querySelector('.dossier-paper');
      const paperRect = paper?.getBoundingClientRect();
      const closeBtn = document.getElementById('btn-close-settings');
      const closeRect = closeBtn?.getBoundingClientRect();

      return {
        paperRect: paperRect ? { width: paperRect.width, height: paperRect.height, top: paperRect.top, bottom: paperRect.bottom } : null,
        overflowsBottom: paperRect ? paperRect.bottom > window.innerHeight : false,
        overflowsTop: paperRect ? paperRect.top < 0 : false,
        closeBtnAccessible: closeRect ? (closeRect.top >= 0 && closeRect.bottom <= window.innerHeight) : false
      };
    });

    await page.screenshot({ path: path.join(AUDIT_DIR, `${vp.name}_05_settings_modal.png`) });
    console.log(`[Settings Modal] Overflows bottom: ${settingsAudit.overflowsBottom}, Close btn accessible: ${settingsAudit.closeBtnAccessible}`);

    // Close settings modal
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);

    // 5. Open Facility Map Screen
    await page.click('#btn-facility-map-toggle');
    await page.waitForTimeout(300);

    const mapAudit = await page.evaluate(() => {
      const screen = document.getElementById('screen-facility-map');
      const container = screen?.querySelector('.blueprint-container');
      const containerRect = container?.getBoundingClientRect();
      const closeBtn = document.getElementById('btn-close-facility-map');
      const closeRect = closeBtn?.getBoundingClientRect();

      return {
        mapVisible: screen && !screen.classList.contains('hidden'),
        containerRect: containerRect ? { width: containerRect.width, height: containerRect.height } : null,
        overflowsWindowX: containerRect ? containerRect.width > window.innerWidth : false,
        overflowsWindowY: containerRect ? containerRect.height > window.innerHeight : false,
        closeBtnAccessible: closeRect ? (closeRect.top >= 0 && closeRect.bottom <= window.innerHeight) : false
      };
    });

    await page.screenshot({ path: path.join(AUDIT_DIR, `${vp.name}_06_facility_map.png`) });
    console.log(`[Facility Map] Overflows X: ${mapAudit.overflowsWindowX}, Overflows Y: ${mapAudit.overflowsWindowY}, Close accessible: ${mapAudit.closeBtnAccessible}`);

    // Close Facility Map
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);

    // 6. Open Asset Manifest Ledger (Inventory)
    await page.click('#btn-inventory-toggle');
    await page.waitForTimeout(300);

    const ledgerAudit = await page.evaluate(() => {
      const screen = document.getElementById('screen-asset-manifest');
      const dossier = screen?.querySelector('.manifest-dossier');
      const dossierRect = dossier?.getBoundingClientRect();
      const closeBtn = document.getElementById('btn-close-asset-manifest');
      const closeRect = closeBtn?.getBoundingClientRect();

      return {
        ledgerVisible: screen && !screen.classList.contains('hidden'),
        dossierRect: dossierRect ? { width: dossierRect.width, height: dossierRect.height, bottom: dossierRect.bottom } : null,
        overflowsWindowX: dossierRect ? dossierRect.width > window.innerWidth : false,
        overflowsWindowY: dossierRect ? dossierRect.height > window.innerHeight : false,
        closeBtnAccessible: closeRect ? (closeRect.top >= 0 && closeRect.bottom <= window.innerHeight) : false
      };
    });

    await page.screenshot({ path: path.join(AUDIT_DIR, `${vp.name}_07_asset_manifest.png`) });
    console.log(`[Asset Manifest] Overflows X: ${ledgerAudit.overflowsWindowX}, Overflows Y: ${ledgerAudit.overflowsWindowY}, Close accessible: ${ledgerAudit.closeBtnAccessible}`);

    // Close Asset Manifest
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);

    auditReport.push({
      viewport: vp,
      menu: menuAudit,
      orientation: orientationAudit,
      orientationStep2: step2Audit,
      hud: hudAudit,
      settings: settingsAudit,
      map: mapAudit,
      ledger: ledgerAudit
    });

    await context.close();
  }

  await browser.close();
  close();

  fs.writeFileSync(
    path.join(AUDIT_DIR, 'audit_summary.json'),
    JSON.stringify(auditReport, null, 2),
    'utf8'
  );
  console.log(`\nAudit completed! Summary saved to ${path.join(AUDIT_DIR, 'audit_summary.json')}`);
}

runAudit().catch(err => {
  console.error('Audit run failed:', err);
  process.exit(1);
});
