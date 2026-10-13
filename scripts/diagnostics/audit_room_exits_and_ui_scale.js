import { chromium } from 'playwright';
import { startTestServer } from '../../tests/helpers/testServer.js';

async function runAudit() {
  const { server, port, baseUrl, close } = await startTestServer();

  const browser = await chromium.launch({
    headless: true,
    args: ['--use-gl=angle', '--use-angle=default']
  });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  const errors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      const text = msg.text();
      if (!text.includes('404') && !text.includes('Failed to load resource')) {
        errors.push(`[Console Error]: ${text}`);
      }
    }
  });

  page.on('pageerror', (err) => {
    errors.push(`[Page Error]: ${err.message}`);
  });

  console.log('--- Step 1: Bootstrap Application at 1920x1080 ---');
  await page.goto(`${baseUrl}/?test=true`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('#btn-menu-start', { state: 'visible', timeout: 6000 });
  await page.click('#btn-menu-start');
  await page.waitForSelector('#view-main-menu', { state: 'hidden', timeout: 6000 });

  const rooms = [
    { id: 'room_04', name: 'Sterile Reception (Hub)' },
    { id: 'sleep_ward', name: 'Sleep Ward (Room 02)' },
    { id: 'hydrotherapy', name: 'Hydrotherapy (Room 03)' },
    { id: 'audiology', name: 'Audiology Vault (Room 04B)' },
    { id: 'archive', name: 'Archive & Records (Room 05)' },
    { id: 'directors_office', name: "Director's Office (Room 06)" },
    { id: 'synthesis_blackout', name: 'Synthesis Core (Room 07)' },
    { id: 'velvet_lounge', name: 'Velvet Lounge (Room 08)' }
  ];

  console.log('\n--- Step 2: Audit Exit & Return Doors Across All Chambers ---');
  const doorReports = [];

  for (const r of rooms) {
    await page.evaluate(async (roomId) => {
      const app = window.__VAULT_APP__;
      await app.scenarioRegistry.loadScenarioById(roomId, app.sceneManager.scene);
      await new Promise((resolve) => setTimeout(resolve, 150));
    }, r.id);

    const report = await page.evaluate(async (roomMeta) => {
      const app = window.__VAULT_APP__;
      const THREE = window.THREE;
      const scene = app.sceneManager.scene;
      const camera = app.cameraDirector.camera;
      const raycastMgr = app.raycastManager;
      const scenario = app.scenarioRegistry.getCurrentScenario();

      const doors = [];
      scene.traverse((obj) => {
        if (obj.name && (obj.name.startsWith('door_') || obj.name === 'prop_door' || obj.name.startsWith('exit_'))) {
          doors.push(obj);
        }
      });

      const overviewPreset = scenario.hotspots?.overview?.cameraPreset || {
        position: camera.position.clone(),
        target: app.cameraDirector.controls.target.clone()
      };

      const doorAudits = [];

      for (const doorObj of doors) {
        const box = new THREE.Box3().setFromObject(doorObj);
        const center = new THREE.Vector3();
        box.getCenter(center);
        const size = new THREE.Vector3();
        box.getSize(size);

        // Test 1: From default overview camera
        camera.position.copy(overviewPreset.position);
        app.cameraDirector.controls.target.copy(overviewPreset.target);
        camera.updateMatrixWorld();
        camera.updateProjectionMatrix();

        const screenPosOverview = center.clone().project(camera);
        const inFrustumOverview =
          screenPosOverview.x >= -1.0 &&
          screenPosOverview.x <= 1.0 &&
          screenPosOverview.y >= -1.0 &&
          screenPosOverview.y <= 1.0 &&
          screenPosOverview.z > 0 &&
          screenPosOverview.z < 1.0;

        // Raycast towards center from overview camera
        const rayOverview = new THREE.Raycaster();
        rayOverview.setFromCamera(new THREE.Vector2(screenPosOverview.x, screenPosOverview.y), camera);
        const hitsOverview = rayOverview.intersectObjects(scene.children, true);

        let hitDoorOverview = false;
        let firstHitOverview = hitsOverview[0]?.object?.name || '(nothing)';
        for (const hit of hitsOverview) {
          if (hit.object.name === 'Editor_Helpers_Group' || hit.object.userData.isHelper || hit.object.name === 'dev_visualizers_node' || hit.object.name === 'X' || hit.object.name === 'Y' || hit.object.name === 'Z') continue;
          const target = raycastMgr.findInteractiveParent(hit.object);
          if (target && target.name === doorObj.name) {
            hitDoorOverview = true;
            break;
          }
          const mat = hit.object.material;
          if (mat) {
            const checkSolid = (m) => !m.transparent && m.opacity >= 1 && (!('transmission' in m) || m.transmission === 0);
            const isOpaque = Array.isArray(mat) ? mat.some(checkSolid) : checkSolid(mat);
            if (isOpaque) break;
          }
        }

        // Test 2: Point camera directly at door (from 3.2m inside the room facing the door)
        let dirToRoom = new THREE.Vector3(0, 0.8, 0).sub(center);
        dirToRoom.y = 0;
        dirToRoom.normalize();
        if (dirToRoom.lengthSq() < 0.001) dirToRoom.set(0, 0, 1);
        const facePos = center.clone().add(dirToRoom.clone().multiplyScalar(3.2)).add(new THREE.Vector3(0, 0.3, 0));
        camera.position.copy(facePos);
        camera.lookAt(center);
        camera.updateMatrixWorld();

        const screenPosDirect = center.clone().project(camera);
        const rayDirect = new THREE.Raycaster();
        rayDirect.setFromCamera(new THREE.Vector2(screenPosDirect.x, screenPosDirect.y), camera);
        const hitsDirect = rayDirect.intersectObjects(scene.children, true);

        let hitDoorDirect = false;
        let firstHitDirect = hitsDirect[0]?.object?.name || '(nothing)';
        for (const hit of hitsDirect) {
          if (hit.object.name === 'Editor_Helpers_Group' || hit.object.userData.isHelper || hit.object.name === 'dev_visualizers_node' || hit.object.name === 'X' || hit.object.name === 'Y' || hit.object.name === 'Z') continue;
          const target = raycastMgr.findInteractiveParent(hit.object);
          if (target && target.name === doorObj.name) {
            hitDoorDirect = true;
            break;
          }
          const mat = hit.object.material;
          if (mat) {
            const checkSolid = (m) => !m.transparent && m.opacity >= 1 && (!('transmission' in m) || m.transmission === 0);
            const isOpaque = Array.isArray(mat) ? mat.some(checkSolid) : checkSolid(mat);
            if (isOpaque) break;
          }
        }

        // Test 3: Direct scenario click event
        let emittedSwitch = null;
        const unsub = app.eventBus.on('scenario:switch_room', (payload) => {
          emittedSwitch = payload;
        });
        let handled = false;
        try {
          handled = scenario.onObjectClick(doorObj.name);
        } catch (e) {
          handled = false;
        }
        unsub();

        doorAudits.push({
          doorName: doorObj.name,
          worldCenter: { x: parseFloat(center.x.toFixed(2)), y: parseFloat(center.y.toFixed(2)), z: parseFloat(center.z.toFixed(2)) },
          size: { x: parseFloat(size.x.toFixed(2)), y: parseFloat(size.y.toFixed(2)), z: parseFloat(size.z.toFixed(2)) },
          inFrustumOverview,
          hitDoorOverview,
          firstHitOverview,
          hitDoorDirect,
          firstHitDirect,
          directClickHandled: handled,
          emittedSwitch
        });
      }

      return {
        roomId: roomMeta.id,
        roomName: roomMeta.name,
        doorCount: doors.length,
        doorAudits
      };
    }, r);

    doorReports.push(report);
    console.log(`[${r.name}] Found ${report.doorCount} doors:`);
    for (const d of report.doorAudits) {
      console.log(`  - ${d.doorName}: inFrustum=${d.inFrustumOverview}, hitOverview=${d.hitDoorOverview} (firstHit=${d.firstHitOverview}), hitDirect=${d.hitDoorDirect} (firstHitDirect=${d.firstHitDirect}), directClick=${d.directClickHandled}, target=${d.emittedSwitch?.targetRoomId || 'none'}`);
    }
  }

  console.log('\n--- Step 3: Audit UI Modal & Diegetic Screen Scales (1920x1080 Viewport) ---');
  // Load hub to test UI screens
  await page.evaluate(async () => {
    const app = window.__VAULT_APP__;
    await app.scenarioRegistry.loadScenarioById('room_04', app.sceneManager.scene);
  });

  const uiScales = [];
  const screenDefs = [
    { name: 'Tektronix CRT Oscilloscope', roomId: 'room_04', selector: '#modal-crt-patcher .crt-patch-housing' },
    { name: 'Facility Map Dossier', roomId: 'room_04', selector: '#screen-facility-map .facility-map-housing' },
    { name: 'Staff Roster Screen', roomId: 'room_04', selector: '#screen-staff-roster .staff-roster-housing' },
    { name: 'Classified Dossier Paper', roomId: 'room_04', selector: '#modal-dossier .dossier-paper' },
    { name: 'Settings Dossier Modal', roomId: 'room_04', selector: '#modal-settings .settings-dossier' },
    { name: 'Inventory Modal', roomId: 'room_04', selector: '#modal-inventory .dossier-paper' },
    { name: 'Dispensary Cart Screen', roomId: 'sleep_ward', selector: '#screen-dispensary-cart .diegetic-housing' },
    { name: 'Clinical Clipboard Screen', roomId: 'sleep_ward', selector: '#screen-clinical-clipboard .clipboard-modal-housing' },
    { name: 'Hydraulic Manifold Screen', roomId: 'hydrotherapy', selector: '#screen-hydraulic-manifold .diegetic-housing' },
    { name: 'Binaural Synthesizer Screen', roomId: 'audiology', selector: '#screen-binaural-synthesizer .binaural-housing' },
    { name: 'Microfiche Viewer Screen', roomId: 'archive', selector: '#screen-microfiche-viewer .microfiche-housing' },
    { name: 'Wiretap Tape Deck Screen', roomId: 'directors_office', selector: '#screen-wiretap-tapedeck .wiretap-housing' },
    { name: 'Galvanometer Grid Screen', roomId: 'synthesis_blackout', selector: '#screen-galvanometer-grid .galvanometer-housing' },
    { name: 'Switchboard Mirror Screen', roomId: 'velvet_lounge', selector: '#screen-switchboard-mirror .switchboard-housing' }
  ];

  for (const s of screenDefs) {
    const scale = await page.evaluate(async (def) => {
      const app = window.__VAULT_APP__;
      const vpW = window.innerWidth;
      const vpH = window.innerHeight;

      // Load scenario if needed
      if (app.scenarioRegistry.getCurrentScenario()?.id !== def.roomId) {
        await app.scenarioRegistry.loadScenarioById(def.roomId, app.sceneManager.scene);
        await new Promise((r) => setTimeout(r, 100));
      }

      // Execute open
      const scenario = app.scenarioRegistry.getCurrentScenario();
      if (def.name === 'Tektronix CRT Oscilloscope') app.crtNodePatcher.open();
      else if (def.name === 'Facility Map Dossier') app.facilityMapScreen.open();
      else if (def.name === 'Staff Roster Screen') app.staffRosterScreen.open();
      else if (def.name === 'Classified Dossier Paper') document.getElementById('modal-dossier')?.classList.remove('hidden');
      else if (def.name === 'Settings Dossier Modal') document.getElementById('modal-settings')?.classList.remove('hidden');
      else if (def.name === 'Inventory Modal') document.getElementById('modal-inventory')?.classList.remove('hidden');
      else if (def.name === 'Dispensary Cart Screen') scenario?.dispensaryScreen?.open();
      else if (def.name === 'Clinical Clipboard Screen') scenario?.clipboardScreen?.open('101');
      else if (def.name === 'Hydraulic Manifold Screen') scenario?.manifoldScreen?.open();
      else if (def.name === 'Binaural Synthesizer Screen') scenario?.binauralScreen?.open();
      else if (def.name === 'Microfiche Viewer Screen') scenario?.microficheScreen?.open();
      else if (def.name === 'Wiretap Tape Deck Screen') scenario?.wiretapScreen?.open();
      else if (def.name === 'Galvanometer Grid Screen') scenario?.galvanometerScreen?.open();
      else if (def.name === 'Switchboard Mirror Screen') scenario?.switchboardScreen?.open();

      await new Promise((r) => setTimeout(r, 60));

      const el = document.querySelector(def.selector);
      if (!el) {
        return { name: def.name, found: false };
      }

      const rect = el.getBoundingClientRect();
      const comp = window.getComputedStyle(el);

      // Execute close
      if (def.name === 'Tektronix CRT Oscilloscope') app.crtNodePatcher.close();
      else if (def.name === 'Facility Map Dossier') app.facilityMapScreen.close();
      else if (def.name === 'Staff Roster Screen') app.staffRosterScreen.close();
      else if (def.name === 'Classified Dossier Paper') document.getElementById('modal-dossier')?.classList.add('hidden');
      else if (def.name === 'Settings Dossier Modal') document.getElementById('modal-settings')?.classList.add('hidden');
      else if (def.name === 'Inventory Modal') document.getElementById('modal-inventory')?.classList.add('hidden');
      else if (def.name === 'Dispensary Cart Screen') scenario?.dispensaryScreen?.close();
      else if (def.name === 'Clinical Clipboard Screen') scenario?.clipboardScreen?.close();
      else if (def.name === 'Hydraulic Manifold Screen') scenario?.manifoldScreen?.close();
      else if (def.name === 'Binaural Synthesizer Screen') scenario?.binauralScreen?.close();
      else if (def.name === 'Microfiche Viewer Screen') scenario?.microficheScreen?.close();
      else if (def.name === 'Wiretap Tape Deck Screen') scenario?.wiretapScreen?.close();
      else if (def.name === 'Galvanometer Grid Screen') scenario?.galvanometerScreen?.close();
      else if (def.name === 'Switchboard Mirror Screen') scenario?.switchboardScreen?.close();

      return {
        name: def.name,
        found: true,
        selector: def.selector,
        width: Math.round(rect.width),
        height: Math.round(rect.height),
        widthVpPercent: parseFloat(((rect.width / vpW) * 100).toFixed(1)),
        heightVpPercent: parseFloat(((rect.height / vpH) * 100).toFixed(1)),
        maxWidthCss: comp.maxWidth,
        maxHeightCss: comp.maxHeight
      };
    }, s);

    uiScales.push(scale);
  }

  console.log('\nUI Screen Dimensions at 1920x1080 Viewport:');
  for (const s of uiScales) {
    if (s.found) {
      console.log(`  - ${s.name}: ${s.width}px x ${s.height}px (${s.widthVpPercent}% W x ${s.heightVpPercent}% H), css max-width: ${s.maxWidthCss}`);
    } else {
      console.log(`  - ${s.name}: NOT FOUND or ERRORED`);
    }
  }

  await browser.close();
  close();
  return { doorReports, uiScales, errors };
}

runAudit()
  .then(() => {
    console.log('\nAudit completed successfully.');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Audit failed with error:', err);
    process.exit(1);
  });
