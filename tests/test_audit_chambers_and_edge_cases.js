import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';
import { startTestServer } from './helpers/testServer.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SCREENSHOTS_DIR = path.resolve(__dirname, '../screenshots');

export async function runSuite(page, baseUrl) {
  console.log('--- Step 1: Bootstrap App with Test Flag ---');
  await page.goto(`${baseUrl}/?test=true&fps=true`);
  await page.waitForSelector('#btn-menu-start', { state: 'visible', timeout: 5000 });
  await page.click('#btn-menu-start');
  await page.waitForTimeout(400);

  console.log('--- Step 2: Room Transitions, Soundscape Routing & LightRig Isolation ---');
  const roomsToAudit = [
    { id: 'room_04', track: 'room_04', expectedFixtures: ['room04_desk_spot'] },
    { id: 'sleep_ward', track: 'sleep_ward', expectedFixtures: ['room02_fill_1', 'room02_uv_1'] },
    { id: 'hydrotherapy', track: 'hydrotherapy', expectedFixtures: ['room03_tub_cold_spot', 'room03_manifold_fill'] },
    { id: 'audiology', track: 'audiology', expectedFixtures: ['room04_amp_light', 'room04_chladni_spot'] },
    { id: 'archive', track: 'archive', expectedFixtures: ['room05_microfiche_desk_lamp', 'room05_aisle_light_1'] },
    { id: 'directors_office', track: 'directors_office', expectedFixtures: ['room06_desk_spot', 'room06_ceiling_fill', 'room06_bookcase_light'] },
    { id: 'synthesis_blackout', track: 'synthesis_blackout', expectedFixtures: ['room07_arc_light', 'room07_beacon_1'] },
    { id: 'velvet_lounge', track: 'velvet_lounge', expectedFixtures: ['velvet_bar_spot', 'velvet_phone_spot'] }
  ];

  for (const r of roomsToAudit) {
    console.log(`Auditing room transition to: ${r.id}`);
    const auditResult = await page.evaluate(async (roomSpec) => {
      const app = (window).__VAULT_APP__;
      const bus = app?.eventBus;
      const musicMgr = app?.musicManager;
      const lightRig = (window).LightRigManager?.getInstance();

      if (bus) {
        bus.emit('scenario:switch_room', { targetRoomId: roomSpec.id });
      }

      await new Promise((resolve) => setTimeout(resolve, 300));

      const activeTrack = musicMgr ? musicMgr.getCurrentTrackId() : null;
      const allFixtures = lightRig ? lightRig.getAll() : [];
      const fixtureIds = allFixtures.map((f) => f.id);
      const fixtureRooms = allFixtures.map((f) => f.room);

      return {
        activeTrack,
        fixtureIds,
        fixtureRooms
      };
    }, r);

    // Verify soundscape routing
    if (auditResult.activeTrack && auditResult.activeTrack !== r.track) {
      throw new Error(`Soundscape mismatch for ${r.id}: expected ${r.track}, got ${auditResult.activeTrack}`);
    }

    // Verify LightRigManager fixture presence and isolation
    for (const expectedId of r.expectedFixtures) {
      if (!auditResult.fixtureIds.includes(expectedId)) {
        throw new Error(`LightRigManager missing fixture ${expectedId} in chamber ${r.id}. Active fixtures: ${auditResult.fixtureIds.join(', ')}`);
      }
    }

    // Verify cross-room fixture leaks do not exist
    const invalidRooms = auditResult.fixtureRooms.filter((rm) => rm !== r.id);
    if (invalidRooms.length > 0) {
      throw new Error(`Cross-room fixture leak in ${r.id}: detected fixtures belonging to room(s) ${invalidRooms.join(', ')}`);
    }

    console.log(`PASSED: ${r.id} routing verified. Track=${auditResult.activeTrack}, Fixtures=[${auditResult.fixtureIds.join(', ')}]`);
  }

  console.log('--- Step 3: Escape Key Priority & Camera Disengage Interlock ---');
  // Return to Room 04 and navigate to a hotspot
  await page.evaluate(() => {
    const app = (window).__VAULT_APP__;
    const bus = app?.eventBus;
    bus?.emit('scenario:switch_room', { targetRoomId: 'room_04' });
    bus?.emit('camera:move_to_hotspot', { hotspotId: 'desk' });
  });
  await page.waitForTimeout(300);

  const initialHotspot = await page.evaluate(() => {
    const app = (window).__VAULT_APP__;
    return app?.uiManager?.getCurrentHotspot();
  });
  console.log(`Current hotspot engaged: ${initialHotspot}`);

  // Open asset manifest modal
  await page.evaluate(() => {
    const app = (window).__VAULT_APP__;
    app?.eventBus?.emit('ui:open_asset_manifest', {});
  });
  await page.waitForTimeout(200);

  const isManifestOpen = await page.evaluate(() => {
    const el = document.getElementById('modal-inventory');
    return el && !el.classList.contains('hidden');
  });
  if (!isManifestOpen) {
    throw new Error('Asset manifest failed to open');
  }

  // Press Escape once: Should close manifest modal WITHOUT disengaging camera
  console.log('Pressing Escape to close modal...');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(200);

  const afterFirstEscape = await page.evaluate(() => {
    const manifest = document.getElementById('modal-inventory');
    const app = (window).__VAULT_APP__;
    return {
      manifestClosed: manifest ? manifest.classList.contains('hidden') : true,
      currentHotspot: app?.uiManager?.getCurrentHotspot()
    };
  });

  if (!afterFirstEscape.manifestClosed) {
    throw new Error('Modal did not close on first Escape press');
  }
  if (afterFirstEscape.currentHotspot === 'overview') {
    throw new Error('Camera disengaged prematurely to overview on modal dismissal Escape press');
  }
  console.log(`PASSED: Modal closed while hotspot remained engaged: ${afterFirstEscape.currentHotspot}`);

  // Press Escape second time: Should disengage camera to overview
  console.log('Pressing Escape with no modals open to trigger camera disengage...');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(200);

  const afterSecondEscapeHotspot = await page.evaluate(() => {
    const app = (window).__VAULT_APP__;
    return app?.uiManager?.getCurrentHotspot();
  });

  if (afterSecondEscapeHotspot !== 'overview') {
    throw new Error(`Expected camera to disengage to overview on second Escape press, got: ${afterSecondEscapeHotspot}`);
  }
  console.log('PASSED: Camera cleanly disengaged to overview on second Escape press.');

  console.log('--- Step 4: RaycastManager Inspection Modal Suppression & Pointer Tracking ---');
  const raycastAudit = await page.evaluate(() => {
    const app = (window).__VAULT_APP__;
    const raycastMgr = app?.raycastManager;
    const inspectModal = document.getElementById('modal-inspect');

    if (!raycastMgr) return { skipped: true };

    // Initially enabled
    raycastMgr.setEnabled(true);
    const initiallyEnabled = raycastMgr.isEnabled;

    // Show inspect modal
    if (inspectModal) inspectModal.classList.remove('hidden');
    raycastMgr.setEnabled(true);
    const enabledDuringModal = raycastMgr.isEnabled;

    // Hide inspect modal
    if (inspectModal) inspectModal.classList.add('hidden');
    raycastMgr.setEnabled(true);
    const enabledAfterModal = raycastMgr.isEnabled;

    return {
      skipped: false,
      initiallyEnabled,
      enabledDuringModal,
      enabledAfterModal
    };
  });

  if (!raycastAudit.skipped) {
    if (!raycastAudit.initiallyEnabled) {
      throw new Error('RaycastManager should be enabled initially');
    }
    if (raycastAudit.enabledDuringModal) {
      throw new Error('RaycastManager should be suppressed when #modal-inspect is active');
    }
    if (!raycastAudit.enabledAfterModal) {
      throw new Error('RaycastManager should be re-enabled after #modal-inspect is closed');
    }
    console.log('PASSED: RaycastManager inspection modal suppression verified.');
  }

  console.log('--- Step 5: Capture Verification Screenshot ---');
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'audit_chambers_and_edge_cases_verified.png') });
  console.log('SUCCESS: All chamber audit, soundscape, LightRig isolation, and edge-case assertions passed.');
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));
if (isMain) {
  const { baseUrl, close } = await startTestServer();
  console.log(`Chamber Audit & Edge Cases test server running on ${baseUrl}`);
  const browser = await chromium.launch({
    headless: true,
    args: ['--use-gl=angle', '--use-angle=default', '--autoplay-policy=no-user-gesture-required']
  });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  let exitCode = 0;
  try {
    await runSuite(page, baseUrl);
  } catch (err) {
    console.error('TEST FAILED:', err);
    exitCode = 1;
  } finally {
    await browser.close();
    close();
    process.exit(exitCode);
  }
}
