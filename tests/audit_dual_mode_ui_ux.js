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

function checkCollision(rectA, rectB, margin = 0) {
  if (!rectA || !rectB) return false;
  return !(
    rectA.right + margin <= rectB.left ||
    rectA.left - margin >= rectB.right ||
    rectA.bottom + margin <= rectB.top ||
    rectA.top - margin >= rectB.bottom
  );
}

export async function runUiUxAudit() {
  const { baseUrl, close } = await startTestServer();
  console.log(`UI/UX Dual-Mode Audit Server running on ${baseUrl}`);

  const browser = await chromium.launch({
    headless: true,
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--autoplay-policy=no-user-gesture-required']
  });

  const findings = [];

  try {
    // =========================================================================
    // SECTION 1: 3-WAY TOGGLE DETERMINISM & HARDWARE AUTO-DETECTION
    // =========================================================================
    console.log('\n======================================================');
    console.log('PART 1: TESTING DETERMINISM OF 3-WAY TOGGLE (AUTO / DESKTOP / TOUCH)');
    console.log('======================================================');

    // 1A: Desktop Context (1440x900, fine pointer)
    const desktopContext = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      hasTouch: false,
      isMobile: false
    });
    const desktopPage = await desktopContext.newPage();
    await desktopPage.goto(`${baseUrl}/?test=true`, { waitUntil: 'networkidle' });

    // Initial Auto Mode on Desktop Viewport
    let autoResolved = await desktopPage.evaluate(() => ({
      uiMode: document.documentElement.dataset.uiMode,
      pref: window.__VAULT_APP__?.uiManager?.getUiMode()?.preference,
      resolved: window.__VAULT_APP__?.uiManager?.getUiMode()?.mode,
      btnAutoActive: document.getElementById('setting-ui-mode-auto')?.classList.contains('active')
    }));
    console.log('1A. Auto on Desktop (1440x900):', autoResolved);
    if (autoResolved.resolved !== 'desktop') {
      findings.push({ severity: 'CRITICAL', test: '1A_auto_desktop', message: `Expected 'desktop', got ${autoResolved.resolved}` });
    }

    // Dynamic Auto Resize: shrink to 768px width -> should resolve to 'touch'
    await desktopPage.setViewportSize({ width: 768, height: 1024 });
    await desktopPage.waitForFunction(() => document.documentElement.dataset.uiMode === 'touch', { timeout: 3000 });
    let autoResized = await desktopPage.evaluate(() => document.documentElement.dataset.uiMode);
    console.log('1A. Auto after resize to 768x1024:', autoResized);
    if (autoResized !== 'touch') {
      findings.push({ severity: 'HIGH', test: '1A_auto_resize_shrink', message: `Expected 'touch' on 768px, got ${autoResized}` });
    }

    // Dynamic Auto Resize: enlarge back to 1440px width -> should resolve to 'desktop'
    await desktopPage.setViewportSize({ width: 1440, height: 900 });
    await desktopPage.waitForFunction(() => document.documentElement.dataset.uiMode === 'desktop', { timeout: 3000 });
    let autoEnlarged = await desktopPage.evaluate(() => document.documentElement.dataset.uiMode);
    console.log('1A. Auto after resize to 1440x900:', autoEnlarged);
    if (autoEnlarged !== 'desktop') {
      findings.push({ severity: 'HIGH', test: '1A_auto_resize_enlarge', message: `Expected 'desktop' on 1440px, got ${autoEnlarged}` });
    }

    // 1B: Explicit PC DESKTOP Mode Determinism
    // Click [ PC DESKTOP ]
    await desktopPage.click('#btn-menu-start');
    await desktopPage.waitForTimeout(300);
    await desktopPage.click('#btn-settings-toggle');
    await desktopPage.waitForSelector('#modal-settings:not(.hidden)', { timeout: 2000 });
    await desktopPage.click('#setting-ui-mode-desktop');
    await desktopPage.waitForTimeout(100);

    let desktopExplicit = await desktopPage.evaluate(() => ({
      uiMode: document.documentElement.dataset.uiMode,
      pref: window.__VAULT_APP__?.uiManager?.getUiMode()?.preference,
      isDesktopActive: document.getElementById('setting-ui-mode-desktop')?.classList.contains('active'),
      isAutoActive: document.getElementById('setting-ui-mode-auto')?.classList.contains('active'),
      isTouchActive: document.getElementById('setting-ui-mode-touch')?.classList.contains('active')
    }));
    console.log('1B. Explicit PC DESKTOP set:', desktopExplicit);
    if (desktopExplicit.uiMode !== 'desktop' || !desktopExplicit.isDesktopActive) {
      findings.push({ severity: 'CRITICAL', test: '1B_explicit_desktop', message: 'Failed to explicitly activate PC Desktop mode' });
    }

    // Shrink window to 375x667 while explicit PC DESKTOP is active: MUST NOT switch to touch!
    await desktopPage.setViewportSize({ width: 375, height: 667 });
    await desktopPage.waitForTimeout(100);
    let desktopLockedOnShrink = await desktopPage.evaluate(() => document.documentElement.dataset.uiMode);
    console.log('1B. PC DESKTOP after shrink to 375x667:', desktopLockedOnShrink);
    if (desktopLockedOnShrink !== 'desktop') {
      findings.push({ severity: 'CRITICAL', test: '1B_desktop_regression_shield', message: `Desktop mode leaked to '${desktopLockedOnShrink}' on narrow resize!` });
    }

    // 1C: Explicit TOUCH / TABLET Mode Determinism
    await desktopPage.setViewportSize({ width: 1440, height: 900 });
    await desktopPage.click('#setting-ui-mode-touch');
    await desktopPage.waitForTimeout(100);

    let touchExplicit = await desktopPage.evaluate(() => ({
      uiMode: document.documentElement.dataset.uiMode,
      pref: window.__VAULT_APP__?.uiManager?.getUiMode()?.preference,
      isTouchActive: document.getElementById('setting-ui-mode-touch')?.classList.contains('active'),
      isAutoActive: document.getElementById('setting-ui-mode-auto')?.classList.contains('active'),
      isDesktopActive: document.getElementById('setting-ui-mode-desktop')?.classList.contains('active')
    }));
    console.log('1C. Explicit TOUCH set:', touchExplicit);
    if (touchExplicit.uiMode !== 'touch' || !touchExplicit.isTouchActive) {
      findings.push({ severity: 'CRITICAL', test: '1C_explicit_touch', message: 'Failed to explicitly activate Touch mode' });
    }

    // Enlarge window to 3840x2160 (4K): MUST STAY touch!
    await desktopPage.setViewportSize({ width: 3840, height: 2160 });
    await desktopPage.waitForTimeout(100);
    let touchLockedOnEnlarge = await desktopPage.evaluate(() => document.documentElement.dataset.uiMode);
    console.log('1C. TOUCH mode after resize to 4K:', touchLockedOnEnlarge);
    if (touchLockedOnEnlarge !== 'touch') {
      findings.push({ severity: 'CRITICAL', test: '1C_touch_lock', message: `Touch mode leaked to '${touchLockedOnEnlarge}' on 4K resize!` });
    }

    // Return to Auto
    await desktopPage.click('#setting-ui-mode-auto');
    await desktopPage.waitForTimeout(100);
    let returnAuto = await desktopPage.evaluate(() => ({
      pref: window.__VAULT_APP__?.uiManager?.getUiMode()?.preference,
      mode: document.documentElement.dataset.uiMode
    }));
    console.log('1D. Returned to AUTO on 4K:', returnAuto);
    if (returnAuto.pref !== 'auto' || returnAuto.mode !== 'desktop') {
      findings.push({ severity: 'HIGH', test: '1D_return_auto', message: 'Failed to return to auto mode' });
    }

    await desktopContext.close();

    // =========================================================================
    // SECTION 2: VIEWPORT-SPECIFIC UI/UX OVERFLOW & COLLISION AUDIT
    // =========================================================================
    console.log('\n======================================================');
    console.log('PART 2: SCREEN-BY-SCREEN COLLISION, OVERFLOW & HIT TARGET AUDIT');
    console.log('======================================================');

    const testProfiles = [
      { name: 'mobile_small_se', width: 375, height: 667, dpr: 2, isMobile: true, hasTouch: true },
      { name: 'mobile_portrait_iphone', width: 390, height: 844, dpr: 3, isMobile: true, hasTouch: true },
      { name: 'tablet_portrait_ipad', width: 768, height: 1024, dpr: 2, isMobile: true, hasTouch: true },
      { name: 'desktop_1080p', width: 1920, height: 1080, dpr: 1, isMobile: false, hasTouch: false }
    ];

    for (const profile of testProfiles) {
      console.log(`\n--- Auditing Profile: ${profile.name} (${profile.width}x${profile.height}) ---`);
      const ctx = await browser.newContext({
        viewport: { width: profile.width, height: profile.height },
        deviceScaleFactor: profile.dpr,
        isMobile: profile.isMobile,
        hasTouch: profile.hasTouch
      });
      const page = await ctx.newPage();

      // Clear save to guarantee pristine start
      await page.goto(baseUrl, { waitUntil: 'networkidle' });
      await page.evaluate(() => localStorage.clear());
      await page.reload({ waitUntil: 'networkidle' });

      // -----------------------------------------------------------------------
      // 1. Audit Main Menu
      // -----------------------------------------------------------------------
      const menuAudit = await page.evaluate(() => {
        const titleEl = document.querySelector('#view-main-menu h1');
        const startBtn = document.getElementById('btn-menu-start');
        const settingsBtn = document.getElementById('btn-menu-settings');
        const footerEl = document.querySelector('#view-main-menu > div:last-child');
        
        const titleRect = titleEl?.getBoundingClientRect();
        const startRect = startBtn?.getBoundingClientRect();
        const settingsRect = settingsBtn?.getBoundingClientRect();
        const footerRect = footerEl?.getBoundingClientRect();

        const docW = document.documentElement.scrollWidth;
        const winW = window.innerWidth;
        const hasHOverflow = docW > winW;

        return {
          hasHOverflow,
          docW,
          winW,
          titleRect: titleRect ? { width: titleRect.width, height: titleRect.height, left: titleRect.left, right: titleRect.right } : null,
          titleFits: titleRect ? titleRect.left >= 0 && titleRect.right <= winW : false,
          startRect: startRect ? { width: startRect.width, height: startRect.height, top: startRect.top, bottom: startRect.bottom } : null,
          settingsRect: settingsRect ? { width: settingsRect.width, height: settingsRect.height, top: settingsRect.top, bottom: settingsRect.bottom } : null,
          footerFits: footerRect ? footerRect.bottom <= window.innerHeight : true
        };
      });

      console.log(`[${profile.name}] Main Menu: H-Overflow: ${menuAudit.hasHOverflow}, Title Fits: ${menuAudit.titleFits}, Start Btn: ${menuAudit.startRect?.width}x${menuAudit.startRect?.height}`);
      if (menuAudit.hasHOverflow) {
        findings.push({ severity: 'HIGH', profile: profile.name, screen: 'main_menu', message: `Horizontal overflow: doc width ${menuAudit.docW}px > window ${menuAudit.winW}px` });
      }
      if (!menuAudit.titleFits) {
        findings.push({ severity: 'HIGH', profile: profile.name, screen: 'main_menu', message: 'Main menu title clips window bounds' });
      }

      await page.screenshot({ path: path.join(AUDIT_DIR, `audit_${profile.name}_01_main_menu.png`) });

      // -----------------------------------------------------------------------
      // 2. Audit Orientation Dossier Form 104-O (Slide 1, 2, 3)
      // -----------------------------------------------------------------------
      await page.click('#btn-menu-start');
      await page.waitForTimeout(400);

      // Slide 1
      const slide1Audit = await page.evaluate(() => {
        const dossier = document.querySelector('.orientation-dossier');
        const dossierRect = dossier?.getBoundingClientRect();
        const tabs = document.querySelector('.orientation-tabs-bar');
        const tab3 = document.querySelector('.orientation-tab-btn[data-step="2"]');
        const seal = dossier?.querySelector('.wax-seal');
        const stamp = dossier?.querySelector('.classified-stamp');
        const prevBtn = document.getElementById('btn-orientation-prev');
        const nextBtn = document.getElementById('btn-orientation-next');
        const bodyEl = document.querySelector('.orientation-body');

        const tab3Rect = tab3?.getBoundingClientRect();
        const sealRect = seal?.getBoundingClientRect();
        const stampRect = stamp?.getBoundingClientRect();
        const prevRect = prevBtn?.getBoundingClientRect();
        const nextRect = nextBtn?.getBoundingClientRect();
        const dossierH = dossierRect?.height || 0;
        const winH = window.innerHeight;

        return {
          dossierFitsY: dossierRect ? dossierRect.top >= 0 && dossierRect.bottom <= winH + 2 : false,
          dossierFitsX: dossierRect ? dossierRect.left >= 0 && dossierRect.right <= window.innerWidth : false,
          tab3AndSealCollide: tab3Rect && sealRect ? !(tab3Rect.right <= sealRect.left || tab3Rect.left >= sealRect.right || tab3Rect.bottom <= sealRect.top || tab3Rect.top >= sealRect.bottom) : false,
          stampAndSealCollide: stampRect && sealRect ? !(stampRect.right <= sealRect.left || stampRect.left >= sealRect.right || stampRect.bottom <= sealRect.top || stampRect.top >= sealRect.bottom) : false,
          nextBtnClickable: nextRect ? nextRect.bottom <= winH && nextRect.top >= 0 && nextRect.height >= 30 : false,
          bodyScrollable: bodyEl ? bodyEl.scrollHeight > bodyEl.clientHeight : false,
          sealRect: sealRect ? { left: sealRect.left, right: sealRect.right, top: sealRect.top, bottom: sealRect.bottom } : null,
          tab3Rect: tab3Rect ? { left: tab3Rect.left, right: tab3Rect.right, top: tab3Rect.top, bottom: tab3Rect.bottom } : null
        };
      });

      console.log(`[${profile.name}] Orientation Step 1: Fits Y: ${slide1Audit.dossierFitsY}, Tab3/Seal Collide: ${slide1Audit.tab3AndSealCollide}, Next Btn: ${slide1Audit.nextBtnClickable}`);
      if (!slide1Audit.dossierFitsY) {
        findings.push({ severity: 'HIGH', profile: profile.name, screen: 'orientation_step1', message: 'Dossier overflows viewport height' });
      }
      if (slide1Audit.tab3AndSealCollide) {
        findings.push({ severity: 'CRITICAL', profile: profile.name, screen: 'orientation_step1', message: 'Wax seal collides with Tab 3 (EGRESS)' });
      }
      await page.screenshot({ path: path.join(AUDIT_DIR, `audit_${profile.name}_02_orientation_step1.png`) });

      // Slide 2: Controls
      await page.click('#btn-orientation-next');
      await page.waitForTimeout(250);

      const slide2Audit = await page.evaluate(() => {
        const dossier = document.querySelector('.orientation-dossier');
        const dossierRect = dossier?.getBoundingClientRect();
        const nextBtn = document.getElementById('btn-orientation-next');
        const nextRect = nextBtn?.getBoundingClientRect();
        const cards = Array.from(document.querySelectorAll('#slide-step-2 .control-card'));
        const bodyEl = document.querySelector('.orientation-body');

        // Check if any control cards are clipped horizontally
        const cardsClipped = cards.some(c => {
          const r = c.getBoundingClientRect();
          return r.left < 0 || r.right > window.innerWidth;
        });

        // Check if touch bindings are rendered in touch mode
        const isTouchMode = document.documentElement.dataset.uiMode === 'touch';
        const desktopSpans = Array.from(document.querySelectorAll('#slide-step-2 .binding-desktop'));
        const touchSpans = Array.from(document.querySelectorAll('#slide-step-2 .binding-touch'));

        return {
          dossierFitsY: dossierRect ? dossierRect.bottom <= window.innerHeight + 2 : false,
          nextBtnClickable: nextRect ? nextRect.bottom <= window.innerHeight && nextRect.top >= 0 : false,
          cardsClipped,
          isTouchMode,
          bindingsCorrect: isTouchMode
            ? touchSpans.every(s => window.getComputedStyle(s).display !== 'none') && desktopSpans.every(s => window.getComputedStyle(s).display === 'none')
            : desktopSpans.every(s => window.getComputedStyle(s).display !== 'none') && touchSpans.every(s => window.getComputedStyle(s).display === 'none')
        };
      });

      console.log(`[${profile.name}] Orientation Step 2: Next Clickable: ${slide2Audit.nextBtnClickable}, Cards Clipped: ${slide2Audit.cardsClipped}, Bindings Match Mode: ${slide2Audit.bindingsCorrect}`);
      if (!slide2Audit.bindingsCorrect) {
        findings.push({ severity: 'HIGH', profile: profile.name, screen: 'orientation_step2', message: 'Bindings visibility did not match active UI mode' });
      }
      if (slide2Audit.cardsClipped) {
        findings.push({ severity: 'HIGH', profile: profile.name, screen: 'orientation_step2', message: 'Control cards clipped horizontally' });
      }
      await page.screenshot({ path: path.join(AUDIT_DIR, `audit_${profile.name}_03_orientation_step2.png`) });

      // Slide 3: Egress & Awaken
      await page.click('#btn-orientation-next');
      await page.waitForTimeout(250);

      const slide3Audit = await page.evaluate(() => {
        const nextBtn = document.getElementById('btn-orientation-next');
        const nextRect = nextBtn?.getBoundingClientRect();
        return {
          awakenBtnVisible: nextRect ? nextRect.bottom <= window.innerHeight && nextRect.top >= 0 : false,
          awakenBtnText: nextBtn?.textContent?.trim()
        };
      });

      console.log(`[${profile.name}] Orientation Step 3: Awaken Btn Visible: ${slide3Audit.awakenBtnVisible} ("${slide3Audit.awakenBtnText}")`);
      if (!slide3Audit.awakenBtnVisible) {
        findings.push({ severity: 'HIGH', profile: profile.name, screen: 'orientation_step3', message: 'Acknowledge & Awaken button is offscreen or hidden' });
      }
      await page.screenshot({ path: path.join(AUDIT_DIR, `audit_${profile.name}_04_orientation_step3.png`) });

      // Click Awaken & Enter Chamber
      await page.click('#btn-orientation-next');
      await page.waitForTimeout(1200);

      // -----------------------------------------------------------------------
      // 3. Audit Chamber In-Game HUD (Collisions, Overlaps, Touch Targets)
      // -----------------------------------------------------------------------
      const hudAudit = await page.evaluate(() => {
        const mapBtn = document.getElementById('btn-facility-map-toggle');
        const invBtn = document.getElementById('btn-inventory-toggle');
        const settingsBtn = document.getElementById('btn-settings-toggle');
        const disengageBtn = document.getElementById('btn-camera-disengage');
        const cinematicHeader = document.getElementById('cinematic-header');
        const subtitle = document.getElementById('observation-subtitle');

        const mapRect = mapBtn?.getBoundingClientRect();
        const invRect = invBtn?.getBoundingClientRect();
        const setRect = settingsBtn?.getBoundingClientRect();
        const disengageRect = disengageBtn?.getBoundingClientRect();
        const cineRect = cinematicHeader?.getBoundingClientRect();

        // Check collision between top-right group and cinematic header
        const mapOrInvCollidesCine = cineRect && (
          (mapRect && !(mapRect.right <= cineRect.left || mapRect.left >= cineRect.right || mapRect.bottom <= cineRect.top || mapRect.top >= cineRect.bottom)) ||
          (invRect && !(invRect.right <= cineRect.left || invRect.left >= cineRect.right || invRect.bottom <= cineRect.top || invRect.top >= cineRect.bottom))
        );

        // Check simulated hotspot collision with mapBtn
        const topBarCollision = mapRect && disengageRect && disengageRect.width > 0 && (
          !(disengageRect.right <= mapRect.left || disengageRect.left >= mapRect.right || disengageRect.bottom <= mapRect.top || disengageRect.top >= mapRect.bottom)
        );

        return {
          mapRect: mapRect ? { width: mapRect.width, height: mapRect.height, left: mapRect.left, right: mapRect.right, top: mapRect.top } : null,
          invRect: invRect ? { width: invRect.width, height: invRect.height, left: invRect.left, right: invRect.right, top: invRect.top } : null,
          setRect: setRect ? { width: setRect.width, height: setRect.height, left: setRect.left, right: setRect.right, bottom: setRect.bottom } : null,
          mapOrInvCollidesCine,
          topBarCollision,
          mapTouchTargetOk: mapRect ? mapRect.height >= 38 && mapRect.width >= 44 : false,
          invTouchTargetOk: invRect ? invRect.height >= 40 && invRect.width >= 40 : false,
          setTouchTargetOk: setRect ? setRect.height >= 38 && setRect.width >= 38 : false
        };
      });

      console.log(`[${profile.name}] Chamber HUD: MapBtn: ${hudAudit.mapRect?.width}x${hudAudit.mapRect?.height}, InvBtn: ${hudAudit.invRect?.width}x${hudAudit.invRect?.height}, Collides Cine: ${hudAudit.mapOrInvCollidesCine}`);
      if (hudAudit.mapOrInvCollidesCine) {
        findings.push({ severity: 'HIGH', profile: profile.name, screen: 'chamber_hud', message: 'Top-right navigation buttons collide with Cinematic Film Header' });
      }

      await page.screenshot({ path: path.join(AUDIT_DIR, `audit_${profile.name}_05_chamber_hud.png`) });

      // -----------------------------------------------------------------------
      // 4. Audit Settings Modal (UI Mode Buttons, Scroll, Close Accessibility)
      // -----------------------------------------------------------------------
      await page.click('#btn-settings-toggle');
      await page.waitForTimeout(300);

      const settingsAudit = await page.evaluate(() => {
        const modal = document.getElementById('modal-settings');
        const dossier = modal?.querySelector('.settings-dossier');
        const dossierRect = dossier?.getBoundingClientRect();
        const modeGroup = modal?.querySelector('.ui-mode-toggle-group');
        const modeGroupRect = modeGroup?.getBoundingClientRect();
        const btnAuto = document.getElementById('setting-ui-mode-auto');
        const btnDesktop = document.getElementById('setting-ui-mode-desktop');
        const btnTouch = document.getElementById('setting-ui-mode-touch');
        const closeBtn = document.getElementById('btn-close-settings');
        const closeX = document.getElementById('btn-close-settings-x');
        const saveBtn = document.getElementById('btn-save-game');
        const purgeBtn = document.getElementById('btn-reset-save');

        const btnAutoRect = btnAuto?.getBoundingClientRect();
        const btnDesktopRect = btnDesktop?.getBoundingClientRect();
        const btnTouchRect = btnTouch?.getBoundingClientRect();
        const closeRect = closeBtn?.getBoundingClientRect();
        const closeXRect = closeX?.getBoundingClientRect();

        // Check if mode buttons overflow their parent
        const modeButtonsOverflowGroup = modeGroupRect && (
          (btnTouchRect && btnTouchRect.right > modeGroupRect.right + 2) ||
          (btnAutoRect && btnAutoRect.left < modeGroupRect.left - 2)
        );

        // Check if mode group overflows dossier
        const modeGroupOverflowsDossier = modeGroupRect && dossierRect && (
          modeGroupRect.right > dossierRect.right || modeGroupRect.left < dossierRect.left
        );

        return {
          dossierRect: dossierRect ? { width: dossierRect.width, height: dossierRect.height, top: dossierRect.top, bottom: dossierRect.bottom } : null,
          dossierFitsViewportY: dossierRect ? dossierRect.bottom <= window.innerHeight + 2 && dossierRect.top >= 0 : false,
          modeGroupRect: modeGroupRect ? { width: modeGroupRect.width, right: modeGroupRect.right } : null,
          modeButtonsOverflowGroup,
          modeGroupOverflowsDossier,
          closeXAccessible: closeXRect ? closeXRect.top >= 0 && closeXRect.right <= window.innerWidth : false,
          closeBottomVisibleOrScrollable: dossier ? dossier.scrollHeight > dossier.clientHeight || (closeRect && closeRect.bottom <= window.innerHeight) : false
        };
      });

      console.log(`[${profile.name}] Settings Modal: Fits Y: ${settingsAudit.dossierFitsViewportY}, Mode Buttons Overflow Group: ${settingsAudit.modeButtonsOverflowGroup}, Mode Group Overflow Dossier: ${settingsAudit.modeGroupOverflowsDossier}`);
      if (settingsAudit.modeButtonsOverflowGroup || settingsAudit.modeGroupOverflowsDossier) {
        findings.push({ severity: 'CRITICAL', profile: profile.name, screen: 'settings_modal', message: 'UI Mode toggle buttons overflow their container or the modal card' });
      }
      if (!settingsAudit.dossierFitsViewportY) {
        findings.push({ severity: 'HIGH', profile: profile.name, screen: 'settings_modal', message: 'Settings modal exceeds viewport height' });
      }

      await page.screenshot({ path: path.join(AUDIT_DIR, `audit_${profile.name}_06_settings_modal.png`) });

      // Close settings modal
      await page.click('#btn-close-settings-x');
      await page.waitForTimeout(200);

      // -----------------------------------------------------------------------
      // 5. Audit Facility Map Screen
      // -----------------------------------------------------------------------
      await page.click('#btn-facility-map-toggle');
      await page.waitForTimeout(300);

      const mapAudit = await page.evaluate(() => {
        const housing = document.querySelector('.facility-map-housing');
        const housingRect = housing?.getBoundingClientRect();
        const header = housing?.querySelector('.diegetic-header');
        const headerRect = header?.getBoundingClientRect();
        const closeBtn = document.getElementById('btn-facility-map-close');
        const closeRect = closeBtn?.getBoundingClientRect();
        const bodyEl = document.querySelector('.facility-map-body');
        const sectors = Array.from(document.querySelectorAll('.facility-sector-card'));

        // Check if sector cards meet touch target guidelines in touch mode
        const isTouch = document.documentElement.dataset.uiMode === 'touch';
        const smallSectors = isTouch ? sectors.filter(s => s.getBoundingClientRect().height < 40) : [];

        // Check if close button collides with title
        const titleEl = housing?.querySelector('.diegetic-title');
        const titleRect = titleEl?.getBoundingClientRect();
        const titleCloseCollide = titleRect && closeRect ? !(titleRect.right <= closeRect.left || titleRect.left >= closeRect.right || titleRect.bottom <= closeRect.top || titleRect.top >= closeRect.bottom) : false;

        return {
          housingFitsY: housingRect ? housingRect.bottom <= window.innerHeight + 2 && housingRect.top >= 0 : false,
          housingFitsX: housingRect ? housingRect.left >= 0 && housingRect.right <= window.innerWidth : false,
          titleCloseCollide,
          smallSectorsCount: smallSectors.length,
          closeAccessible: closeRect ? closeRect.top >= 0 && closeRect.right <= window.innerWidth : false,
          bodyScrollable: bodyEl ? bodyEl.scrollHeight > bodyEl.clientHeight : false
        };
      });

      console.log(`[${profile.name}] Facility Map: Fits Y: ${mapAudit.housingFitsY}, Title/Close Collide: ${mapAudit.titleCloseCollide}, Small Sectors: ${mapAudit.smallSectorsCount}`);
      if (!mapAudit.housingFitsY) {
        findings.push({ severity: 'HIGH', profile: profile.name, screen: 'facility_map', message: 'Facility Map housing overflows viewport height' });
      }
      if (mapAudit.titleCloseCollide) {
        findings.push({ severity: 'CRITICAL', profile: profile.name, screen: 'facility_map', message: 'Facility Map title collides with Close button' });
      }

      await page.screenshot({ path: path.join(AUDIT_DIR, `audit_${profile.name}_07_facility_map.png`) });

      // Close facility map
      await page.click('#btn-facility-map-close');
      await page.waitForTimeout(200);

      // -----------------------------------------------------------------------
      // 6. Audit Asset Manifest Ledger (Inventory)
      // -----------------------------------------------------------------------
      await page.click('#btn-inventory-toggle');
      await page.waitForTimeout(300);

      const inventoryAudit = await page.evaluate(() => {
        const container = document.querySelector('.manifest-case-container');
        const containerRect = container?.getBoundingClientRect();
        const header = container?.querySelector('.manifest-case-header');
        const closeBtn = document.getElementById('btn-close-inventory');
        const closeRect = closeBtn?.getBoundingClientRect();
        const titleEl = container?.querySelector('.manifest-case-title');
        const titleRect = titleEl?.getBoundingClientRect();
        const trayNav = document.querySelector('.manifest-tray-nav');
        const tabs = Array.from(document.querySelectorAll('.manifest-tab-btn'));

        const titleCloseCollide = titleRect && closeRect ? !(titleRect.right <= closeRect.left || titleRect.left >= closeRect.right || titleRect.bottom <= closeRect.top || titleRect.top >= closeRect.bottom) : false;

        // Check if tray nav is scrollable or tabs squished
        const anyTabTooNarrow = tabs.some(t => t.getBoundingClientRect().width < 60);

        return {
          containerFitsY: containerRect ? containerRect.bottom <= window.innerHeight + 2 && containerRect.top >= 0 : false,
          containerFitsX: containerRect ? containerRect.left >= 0 && containerRect.right <= window.innerWidth : false,
          titleCloseCollide,
          anyTabTooNarrow,
          closeAccessible: closeRect ? closeRect.top >= 0 && closeRect.right <= window.innerWidth : false
        };
      });

      console.log(`[${profile.name}] Asset Manifest: Fits Y: ${inventoryAudit.containerFitsY}, Title/Close Collide: ${inventoryAudit.titleCloseCollide}, Any Tab Narrow: ${inventoryAudit.anyTabTooNarrow}`);
      if (!inventoryAudit.containerFitsY) {
        findings.push({ severity: 'HIGH', profile: profile.name, screen: 'asset_manifest', message: 'Asset Manifest container overflows viewport height' });
      }
      if (inventoryAudit.titleCloseCollide) {
        findings.push({ severity: 'CRITICAL', profile: profile.name, screen: 'asset_manifest', message: 'Asset Manifest title collides with Close button' });
      }

      await page.screenshot({ path: path.join(AUDIT_DIR, `audit_${profile.name}_08_asset_manifest.png`) });

      await ctx.close();
    }

    console.log('\n======================================================');
    console.log(`AUDIT COMPLETE. Total Findings: ${findings.length}`);
    console.log('======================================================');
    console.log(JSON.stringify(findings, null, 2));

    fs.writeFileSync(
      path.join(AUDIT_DIR, 'dual_mode_audit_results.json'),
      JSON.stringify(findings, null, 2),
      'utf8'
    );

    return findings;

  } finally {
    await browser.close();
    close();
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runUiUxAudit().then(findings => {
    if (findings.filter(f => f.severity === 'CRITICAL').length > 0) {
      console.error('Audit encountered CRITICAL defects.');
      process.exitCode = 1;
    } else {
      console.log('Audit completed with 0 critical defects.');
      process.exitCode = 0;
    }
  }).catch(err => {
    console.error('Fatal audit failure:', err);
    process.exitCode = 1;
  });
}
