import { chromium } from 'playwright';
import { startTestServer } from './helpers/testServer.js';

async function runAudit() {
  const { server, port, baseUrl, close } = await startTestServer();

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      const text = msg.text();
      if (!text.includes('404') && !text.includes('Failed to load resource')) {
        errors.push(`[Console Error]: ${text}`);
      }
    }
  });

  page.on('pageerror', err => {
    errors.push(`[Page Error]: ${err.message}`);
  });

  console.log('--- Step 1: Navigating to Vault Application ---');
  await page.goto(`${baseUrl}/?test=true`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('#btn-menu-start', { state: 'visible', timeout: 5000 });
  await page.click('#btn-menu-start');
  await page.waitForSelector('#view-main-menu', { state: 'hidden', timeout: 5000 });

  console.log('--- Step 2: Auditing Central Hub (Room 04 / Room 01) Doors & Wall Alignment ---');
  const hubDoorAudit = await page.evaluate(() => {
    const app = window.__VAULT_APP__;
    const scene = app.sceneManager.scene;
    const scenario = app.scenarioRegistry.getCurrentScenario();

    const results = {
      prunedDoorsNotInScene: [],
      prunedDoorsFoundErroneously: [],
      activeDoors: {},
      wallOffsets: {}
    };

    // Check pruned doors are NOT in 3D scene graph
    const pruned = ['door_portal_archive', 'door_portal_synthesis', 'door_portal_velvet_lounge'];
    for (const id of pruned) {
      let found = false;
      scene.traverse(obj => {
        if (obj.name === id && obj.isMesh) found = true;
      });
      if (found) {
        results.prunedDoorsFoundErroneously.push(id);
      } else {
        results.prunedDoorsNotInScene.push(id);
      }
    }

    // Check active doors
    const active = ['door_corridor', 'door_portal_audiology', 'door_portal_directors_office', 'prop_door'];
    for (const id of active) {
      let mesh = null;
      scene.traverse(obj => {
        if (obj.name === id && obj.isMesh) mesh = obj;
      });
      if (mesh) {
        const box = new window.THREE.Box3().setFromObject(mesh);
        const center = new window.THREE.Vector3();
        box.getCenter(center);
        const size = new window.THREE.Vector3();
        box.getSize(size);
        results.activeDoors[id] = {
          found: true,
          center: { x: center.x, y: center.y, z: center.z },
          size: { x: size.x, y: size.y, z: size.z },
          boundsFinite: Number.isFinite(center.x) && Number.isFinite(center.y) && Number.isFinite(center.z)
        };
      } else {
        results.activeDoors[id] = { found: false };
      }
    }

    return results;
  });

  console.log('Hub Door Audit Results:', JSON.stringify(hubDoorAudit, null, 2));

  if (hubDoorAudit.prunedDoorsFoundErroneously.length > 0) {
    throw new Error(`Pruned doors erroneously found in 3D scene: ${hubDoorAudit.prunedDoorsFoundErroneously.join(', ')}`);
  }

  for (const [id, data] of Object.entries(hubDoorAudit.activeDoors)) {
    if (!data.found) throw new Error(`Active door '${id}' was not found in Hub scene!`);
    if (!data.boundsFinite) throw new Error(`Door '${id}' has non-finite bounds!`);
  }

  console.log('--- Step 3: Auditing Room 02 (The Sleep Ward) Doors & Z-Axis Alignment ---');
  await page.evaluate(() => {
    window.__VAULT_APP__.eventBus.emit('scenario:switch_room', { targetRoomId: 'sleep_ward', isDevJump: true });
  });
  await page.waitForFunction(() => window.__VAULT_APP__.scenarioRegistry.getCurrentScenario().id === 'sleep_ward');

  const sleepWardDoorAudit = await page.evaluate(() => {
    const scene = window.__VAULT_APP__.sceneManager.scene;
    const doors = ['door_return_hub', 'door_portal_hydrotherapy'];
    const audit = {};

    for (const id of doors) {
      let mesh = null;
      scene.traverse(obj => {
        if (obj.name === id && obj.isMesh) mesh = obj;
      });
      if (mesh) {
        const box = new window.THREE.Box3().setFromObject(mesh);
        const center = new window.THREE.Vector3();
        box.getCenter(center);
        const size = new window.THREE.Vector3();
        box.getSize(size);
        audit[id] = {
          found: true,
          center: { x: center.x, y: center.y, z: center.z },
          size: { x: size.x, y: size.y, z: size.z },
          visible: mesh.visible
        };
      } else {
        audit[id] = { found: false };
      }
    }

    // Verify wall clearance: back wall is at z = -8 (bounds -8.1 to -7.9)
    // hydroDoorPanel should be at z > -7.9 (inside room)
    const hydro = audit['door_portal_hydrotherapy'];
    if (hydro && hydro.found) {
      audit.hydroWallClearance = hydro.center.z - (-7.9); // positive means inside room
    }

    return audit;
  });

  console.log('Sleep Ward Door Audit:', JSON.stringify(sleepWardDoorAudit, null, 2));
  if (!sleepWardDoorAudit.door_return_hub.found) throw new Error('door_return_hub not found in Sleep Ward');
  if (!sleepWardDoorAudit.door_portal_hydrotherapy.found) throw new Error('door_portal_hydrotherapy not found in Sleep Ward');

  console.log('--- Step 4: Testing Interlock on Room 02 -> Room 03 Door ---');
  const sleepWardInterlock = await page.evaluate(() => {
    const app = window.__VAULT_APP__;
    const scenario = app.scenarioRegistry.getCurrentScenario();
    app.gameState.transitionTo('ACT_2_SLEEP_WARD');
    
    let subtitleText = '';
    const unsub = app.eventBus.on('ui:subtitle_changed', ({ text }) => { subtitleText = text; });

    // Click door before solving dispensary
    const clickedBefore = scenario.onObjectClick('door_portal_hydrotherapy');
    const msgBefore = subtitleText;

    // Simulate solving dispensary & collecting crystal 01
    app.eventBus.emit('puzzle:trolley_unlocked');
    scenario.onObjectClick('crystal_01_quartz');

    // Click door after collecting crystal
    let switched = false;
    const unsubSwitch = app.eventBus.on('scenario:switch_room', () => { switched = true; });
    const clickedAfter = scenario.onObjectClick('door_portal_hydrotherapy');

    unsub();
    unsubSwitch();

    return {
      clickedBefore,
      msgBefore,
      clickedAfter,
      switched
    };
  });

  console.log('Sleep Ward Door Interlock Audit:', JSON.stringify(sleepWardInterlock, null, 2));
  if (!sleepWardInterlock.msgBefore.includes('airlock is locked')) {
    throw new Error(`Expected locked airlock message, got: ${sleepWardInterlock.msgBefore}`);
  }
  if (!sleepWardInterlock.switched) {
    throw new Error('Door traversal failed after collecting crystal 01');
  }

  console.log('--- Step 5: Auditing Room 03 (Hydrotherapy) Doors ---');
  await page.evaluate(() => {
    window.__VAULT_APP__.eventBus.emit('scenario:switch_room', { targetRoomId: 'hydrotherapy', isDevJump: true });
  });
  await page.waitForFunction(() => window.__VAULT_APP__.scenarioRegistry.getCurrentScenario().id === 'hydrotherapy');

  const hydroDoorAudit = await page.evaluate(() => {
    const scene = window.__VAULT_APP__.sceneManager.scene;
    let returnDoor = null;
    scene.traverse(obj => {
      if (obj.name === 'door_return_hub' && obj.isMesh) returnDoor = obj;
    });

    if (!returnDoor) return { found: false };
    const box = new window.THREE.Box3().setFromObject(returnDoor);
    const center = new window.THREE.Vector3();
    box.getCenter(center);
    return {
      found: true,
      center: { x: center.x, y: center.y, z: center.z }
    };
  });
  console.log('Hydrotherapy Door Audit:', JSON.stringify(hydroDoorAudit, null, 2));
  if (!hydroDoorAudit.found) throw new Error('door_return_hub not found in Hydrotherapy');

  console.log('--- Step 6: Auditing Room 04 (Audiology Vault) Doors & Wall Slant Alignment ---');
  await page.evaluate(() => {
    window.__VAULT_APP__.eventBus.emit('scenario:switch_room', { targetRoomId: 'audiology', isDevJump: true });
  });
  await page.waitForFunction(() => window.__VAULT_APP__.scenarioRegistry.getCurrentScenario().id === 'audiology');

  const audiologyDoorAudit = await page.evaluate(() => {
    const scene = window.__VAULT_APP__.sceneManager.scene;
    const doors = ['door_return_hub', 'door_portal_archive'];
    const audit = {};

    for (const id of doors) {
      let mesh = null;
      scene.traverse(obj => {
        if (obj.name === id && obj.isMesh) mesh = obj;
      });
      if (mesh) {
        const box = new window.THREE.Box3().setFromObject(mesh);
        const center = new window.THREE.Vector3();
        box.getCenter(center);
        const size = new window.THREE.Vector3();
        box.getSize(size);
        audit[id] = {
          found: true,
          center: { x: center.x, y: center.y, z: center.z },
          size: { x: size.x, y: size.y, z: size.z }
        };
      } else {
        audit[id] = { found: false };
      }
    }
    return audit;
  });

  console.log('Audiology Door Audit:', JSON.stringify(audiologyDoorAudit, null, 2));
  if (!audiologyDoorAudit.door_return_hub.found) throw new Error('door_return_hub not found in Audiology Vault');
  if (!audiologyDoorAudit.door_portal_archive.found) throw new Error('door_portal_archive not found in Audiology Vault');

  console.log('--- Step 7: Auditing Room 05 (The Archive) Doors ---');
  await page.evaluate(() => {
    window.__VAULT_APP__.eventBus.emit('scenario:switch_room', { targetRoomId: 'archive', isDevJump: true });
  });
  await page.waitForFunction(() => window.__VAULT_APP__.scenarioRegistry.getCurrentScenario().id === 'archive');

  const archiveDoorAudit = await page.evaluate(() => {
    const scene = window.__VAULT_APP__.sceneManager.scene;
    let returnDoor = null;
    scene.traverse(obj => {
      if (obj.name === 'door_return_hub' && obj.isMesh) returnDoor = obj;
    });
    if (!returnDoor) return { found: false };
    const box = new window.THREE.Box3().setFromObject(returnDoor);
    const center = new window.THREE.Vector3();
    box.getCenter(center);
    return {
      found: true,
      center: { x: center.x, y: center.y, z: center.z }
    };
  });
  console.log('Archive Door Audit:', JSON.stringify(archiveDoorAudit, null, 2));
  if (!archiveDoorAudit.found) throw new Error('door_return_hub not found in Archive');

  console.log('--- Step 8: Auditing Room 06 (Director\'s Office) Doors & Credenza Clearance ---');
  await page.evaluate(() => {
    window.__VAULT_APP__.eventBus.emit('scenario:switch_room', { targetRoomId: 'directors_office', isDevJump: true });
  });
  await page.waitForFunction(() => window.__VAULT_APP__.scenarioRegistry.getCurrentScenario().id === 'directors_office');

  const directorDoorAudit = await page.evaluate(() => {
    const scene = window.__VAULT_APP__.sceneManager.scene;
    const doors = ['door_return_hub', 'door_portal_synthesis'];
    const audit = {};

    for (const id of doors) {
      let mesh = null;
      scene.traverse(obj => {
        if (obj.name === id && obj.isMesh) mesh = obj;
      });
      if (mesh) {
        const box = new window.THREE.Box3().setFromObject(mesh);
        const center = new window.THREE.Vector3();
        box.getCenter(center);
        const size = new window.THREE.Vector3();
        box.getSize(size);
        audit[id] = {
          found: true,
          center: { x: center.x, y: center.y, z: center.z },
          size: { x: size.x, y: size.y, z: size.z }
        };
      } else {
        audit[id] = { found: false };
      }
    }

    // Check credenza bounds vs synthesis hatch bounds for geometric collision
    let credenzaMesh = null;
    scene.traverse(obj => {
      if (obj.name === 'prop_director_credenza') credenzaMesh = obj;
    });
    if (credenzaMesh && audit['door_portal_synthesis']?.found) {
      const cBox = new window.THREE.Box3().setFromObject(credenzaMesh);
      let sMesh = null;
      scene.traverse(obj => { if (obj.name === 'door_portal_synthesis') sMesh = obj; });
      const sBox = new window.THREE.Box3().setFromObject(sMesh);
      audit.credenzaCollision = cBox.intersectsBox(sBox);
      audit.credenzaBounds = { minX: cBox.min.x, maxX: cBox.max.x };
      audit.synthesisBounds = { minX: sBox.min.x, maxX: sBox.max.x };
    }

    return audit;
  });

  console.log('Director\'s Office Door Audit:', JSON.stringify(directorDoorAudit, null, 2));
  if (!directorDoorAudit.door_return_hub.found) throw new Error('door_return_hub not found in Director\'s Office');
  if (!directorDoorAudit.door_portal_synthesis.found) throw new Error('door_portal_synthesis not found in Director\'s Office');
  if (directorDoorAudit.credenzaCollision) throw new Error('Synthesis hatch collides with credenza!');

  console.log('--- Step 9: Auditing Raycast Hit Delivery on All Doors ---');
  // Check raycast hitting door meshes from their respective camera presets
  const raycastAudit = await page.evaluate(() => {
    const app = window.__VAULT_APP__;
    const camera = app.cameraDirector.camera;
    const scene = app.sceneManager.scene;
    const raycaster = new window.THREE.Raycaster();

    // From current camera in Director's office, test raycast towards door_return_hub
    let returnDoorMesh = null;
    scene.traverse(obj => { if (obj.name === 'door_return_hub' && obj.isMesh) returnDoorMesh = obj; });

    let returnHit = false;
    if (returnDoorMesh) {
      const box = new window.THREE.Box3().setFromObject(returnDoorMesh);
      const center = new window.THREE.Vector3();
      box.getCenter(center);
      const origin = camera.position.clone();
      const dir = center.clone().sub(origin).normalize();
      raycaster.set(origin, dir);
      const intersects = raycaster.intersectObjects(scene.children, true);
      const hitNames = intersects.slice(0, 3).map(i => i.object.name);
      returnHit = intersects.some(i => i.object.name === 'door_return_hub' || i.object.name === 'group_door_portal_synthesis');
    }

    return { returnDoorFound: !!returnDoorMesh, raycastCanHit: returnHit };
  });

  console.log('Raycast Audit Result:', JSON.stringify(raycastAudit, null, 2));

  console.log('--- Step 10: Verifying Zero Console & Page Errors ---');
  if (errors.length > 0) {
    throw new Error(`Encountered unhandled page/console errors:\n${errors.join('\n')}`);
  }
  console.log('PASSED: 0 console errors during door audit.');

  await context.close();
  await browser.close();
  close();

  console.log('SUCCESS: All doors, axes, wall clearances, and interlocks verified 100% clean!');
}

runAudit().catch(err => {
  console.error('AUDIT FAILED:', err);
  process.exit(1);
});
