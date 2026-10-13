import * as THREE from 'three';
import { RoomScenario, HotspotAnchor, CrystalId } from '../types';
import { EventBus } from '../core/EventBus';
import { AudioEngine } from '../audio/AudioEngine';
import { WiretapTapeDeckScreen } from '../ui/screens/WiretapTapeDeckScreen';
import { GameState } from '../core/GameState';

export class Room06_DirectorsOffice implements RoomScenario {
  public id = 'directors_office';
  public title = "The Director's Office";
  public actTitle = 'ACT VI • THE CORE';
  public roomCode = 'Executive Sanitarium 06 • The Absolute Void';
  public defaultHotspot = 'overview';

  public hotspots: Record<string, HotspotAnchor> = {
    overview: {
      id: 'overview',
      name: 'I. The Void',
      position: new THREE.Vector3(0, 1.8, 3.8),
      interactionPrompt: 'The Void Overview',
      cameraPreset: {
        name: 'overview',
        position: new THREE.Vector3(2.6, 2.2, 4.2),
        target: new THREE.Vector3(0, 0.9, 0)
      }
    },
    desk: {
      id: 'desk',
      name: 'II. Mahogany Desk',
      position: new THREE.Vector3(0, 1.2, 0),
      interactionPrompt: '[INSPECT DESK & TELEPHONE]',
      cameraPreset: {
        name: 'desk',
        position: new THREE.Vector3(0, 1.6, 1.8),
        target: new THREE.Vector3(0, 0.95, 0)
      }
    },
    door: {
      id: 'door',
      name: 'III. Hub Corridor',
      position: new THREE.Vector3(0, 1.8, 6.8),
      interactionPrompt: '[RETURN: CENTRAL HUB]',
      cameraPreset: {
        name: 'door',
        position: new THREE.Vector3(0, 1.8, 5.2),
        target: new THREE.Vector3(0, 1.8, 7.5)
      }
    },
    bookshelf: {
      id: 'bookshelf',
      name: 'IV. Executive Bookcase',
      position: new THREE.Vector3(-4.5, 1.8, 0),
      interactionPrompt: '[INSPECT DIRECTOR\'S LOG]',
      cameraPreset: {
        name: 'bookshelf',
        position: new THREE.Vector3(-3.2, 1.8, 1.2),
        target: new THREE.Vector3(-5.0, 1.8, 0)
      }
    },
    door_portal_synthesis: {
      id: 'door_portal_synthesis',
      name: 'V. Sub-Core Conduit Hatch',
      position: new THREE.Vector3(4.2, 1.8, -7.0),
      interactionPrompt: '[ENTER: SYNTHESIS CORE (SL4-07)]',
      cameraPreset: {
        name: 'door_portal_synthesis',
        position: new THREE.Vector3(4.2, 1.8, -5.2),
        target: new THREE.Vector3(4.2, 1.8, -7.85)
      }
    }
  };

  private group: THREE.Group | null = null;
  private crystalMesh: THREE.Mesh | null = null;
  private crystalLight: THREE.PointLight | null = null;
  private secretDrawerMesh: THREE.Mesh | null = null;
  private crystalCollected: boolean = false;
  private drawerUnlocked: boolean = false;
  private wiretapScreen: WiretapTapeDeckScreen = new WiretapTapeDeckScreen();
  private unsubscribers: (() => void)[] = [];

  public async buildScene(_scene: THREE.Scene): Promise<THREE.Group> {
    this.group = new THREE.Group();

    // Rehydrate state from GameState or Wiretap screen
    const hasCrystal = GameState.getInstance().hasCrystal('crystal_05_celadon');
    if (hasCrystal || this.wiretapScreen.isSafeUnlatched()) {
      this.drawerUnlocked = true;
      this.crystalCollected = hasCrystal;
    } else {
      this.drawerUnlocked = false;
      this.crystalCollected = false;
    }

    const bus = EventBus.getInstance();
    this.unsubscribers.push(
      bus.on('puzzle:safe_unlatched', () => {
        this.drawerUnlocked = true;
        if (this.secretDrawerMesh) {
          this.secretDrawerMesh.position.z = 0.55;
        }
        if (this.crystalMesh && !this.crystalCollected) {
          this.crystalMesh.position.z = 0.55;
          this.crystalMesh.visible = true;
          if (this.crystalLight) this.crystalLight.visible = true;
        }
      })
    );
    this.unsubscribers.push(
      bus.on('puzzle:crystal_collected', (payload) => {
        const data = payload as { crystalId?: string };
        if (data.crystalId === 'crystal_05_celadon') {
          this.drawerUnlocked = true;
          this.crystalCollected = true;
          if (this.secretDrawerMesh) {
            this.secretDrawerMesh.position.z = 0.55;
          }
          if (this.crystalMesh) {
            this.crystalMesh.visible = false;
          }
          if (this.crystalLight) {
            this.crystalLight.visible = false;
          }
        }
      })
    );

    // Materials
    const matMahogany = new THREE.MeshStandardMaterial({ color: 0x3d2314, roughness: 0.38 });
    const matPhone = new THREE.MeshStandardMaterial({ color: 0xe5e1d8, roughness: 0.38 });
    const matBrass = new THREE.MeshStandardMaterial({ color: 0xc28833, metalness: 0.85, roughness: 0.22 });
    const matAluminum = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.82, roughness: 0.28 });
    const matLeather = new THREE.MeshStandardMaterial({ color: 0x111613, roughness: 0.55 });
    const matGlass = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transmission: 0.9,
      roughness: 0.08,
      transparent: true,
      opacity: 0.88
    });
    const matAmberGlow = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
    const matCastIron = new THREE.MeshStandardMaterial({ color: 0x121513, metalness: 0.7, roughness: 0.65 });

    // Architectural Finishes
    const matWoodFloor = new THREE.MeshStandardMaterial({ color: 0x2b1c12, roughness: 0.45 });
    const matTeakWall = new THREE.MeshStandardMaterial({ color: 0x362114, roughness: 0.55, metalness: 0.1 });
    const matCeiling = new THREE.MeshStandardMaterial({ color: 0x1a211c, roughness: 0.75 });

    // Smoked Teak Parquet Floor (Brutalist Executive Suite)
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(14, 16), matWoodFloor);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this.group.add(floor);

    // Coffered Ceiling
    const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(14, 16), matCeiling);
    ceiling.position.y = 4.8;
    ceiling.rotation.x = Math.PI / 2;
    this.group.add(ceiling);

    const wallBack = new THREE.Mesh(new THREE.BoxGeometry(14, 5.0, 0.2), matTeakWall);
    wallBack.position.set(0, 2.4, -8);
    this.group.add(wallBack);

    const wallFront = new THREE.Mesh(new THREE.BoxGeometry(14, 5.0, 0.2), matTeakWall);
    wallFront.position.set(0, 2.4, 8);
    this.group.add(wallFront);

    const wallLeft = new THREE.Mesh(new THREE.BoxGeometry(0.2, 5.0, 16), matTeakWall);
    wallLeft.position.set(-7, 2.4, 0);
    this.group.add(wallLeft);

    const wallRight = new THREE.Mesh(new THREE.BoxGeometry(0.2, 5.0, 16), matTeakWall);
    wallRight.position.set(7, 2.4, 0);
    this.group.add(wallRight);

    // Return Door Frame
    const doorFrame = new THREE.Mesh(
      new THREE.BoxGeometry(1.6, 3.0, 0.16),
      new THREE.MeshStandardMaterial({ color: 0x242424, metalness: 0.4, roughness: 0.5 })
    );
    doorFrame.position.set(0, 1.5, 7.85);
    doorFrame.name = 'door_return_hub';
    this.group.add(doorFrame);

    // Connecting Hatch to Synthesis Core (Rear Wall Maintenance Portal)
    const synthDoorGroup = new THREE.Group();
    synthDoorGroup.position.set(4.2, 0, -7.85);
    synthDoorGroup.name = 'group_door_portal_synthesis';

    const synthDoorFrame = new THREE.Mesh(
      new THREE.BoxGeometry(1.8, 3.2, 0.24),
      new THREE.MeshStandardMaterial({ color: 0x1f2421, roughness: 0.6 })
    );
    synthDoorFrame.position.set(0, 1.6, 0);
    synthDoorFrame.raycast = () => {};
    synthDoorFrame.userData.isSubPart = true;
    synthDoorGroup.add(synthDoorFrame);

    const synthDoorPanel = new THREE.Mesh(
      new THREE.BoxGeometry(1.5, 2.9, 0.1),
      new THREE.MeshStandardMaterial({ color: 0x2b3831, metalness: 0.7, roughness: 0.3 })
    );
    synthDoorPanel.position.set(0, 1.45, 0.14);
    synthDoorPanel.name = 'door_portal_synthesis';
    synthDoorGroup.add(synthDoorPanel);

    const synthPlaque = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 0.16, 0.04),
      new THREE.MeshStandardMaterial({ color: 0xc28833, metalness: 0.8, roughness: 0.3 })
    );
    synthPlaque.position.set(0, 3.15, 0.14);
    synthPlaque.name = 'plaque_synthesis_hatch';
    synthPlaque.raycast = () => {};
    synthPlaque.userData.isSubPart = true;
    synthDoorGroup.add(synthPlaque);

    this.group.add(synthDoorGroup);

    // Floor-to-Ceiling Mahogany Bookcase
    const bookshelfGroup = new THREE.Group();
    bookshelfGroup.position.set(-6.5, 0, 0);
    bookshelfGroup.name = 'prop_director_bookshelf';
    bookshelfGroup.userData.interactionPrompt = '[INSPECT: DIRECTOR\'S LOGBOOK]';

    const shelfFrame = new THREE.Mesh(new THREE.BoxGeometry(0.7, 4.4, 4.8), matMahogany);
    shelfFrame.position.y = 2.2;
    shelfFrame.castShadow = true;
    shelfFrame.receiveShadow = true;
    bookshelfGroup.add(shelfFrame);

    const matBookLeather = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.7 });
    for (let s = 0; s < 5; s++) {
      const shelfY = 0.6 + s * 0.8;
      const shelfPlank = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.04, 4.6), matMahogany);
      shelfPlank.position.y = shelfY;
      shelfPlank.raycast = () => {};
      bookshelfGroup.add(shelfPlank);

      for (let b = -2.0; b <= 2.0; b += 0.4) {
        const bookH = 0.3 + ((Math.abs(b * 3)) % 0.25);
        const book = new THREE.Mesh(
          new THREE.BoxGeometry(0.35, bookH, 0.22),
          Math.sin(b * 5) > 0 ? matBookLeather : matLeather
        );
        book.position.set(0.05, shelfY + bookH / 2, b);
        book.raycast = () => {};
        bookshelfGroup.add(book);
      }
    }
    this.group.add(bookshelfGroup);

    // Executive Teak Credenza against back wall
    const credenza = new THREE.Mesh(
      new THREE.BoxGeometry(4.2, 0.95, 0.75),
      matMahogany
    );
    credenza.position.set(0, 0.475, -7.4);
    credenza.name = 'prop_director_credenza';
    credenza.castShadow = true;
    this.group.add(credenza);

    // Director's Confidential Leather Portfolio (Confession & Protocol Dossier)
    const dossierGroup = new THREE.Group();
    dossierGroup.position.set(1.2, 0.97, -7.4);
    dossierGroup.name = 'prop_director_dossier';

    const dossierBinder = new THREE.Mesh(
      new THREE.BoxGeometry(0.38, 0.04, 0.48),
      new THREE.MeshStandardMaterial({ color: 0x3d1d1d, roughness: 0.65 })
    );
    dossierBinder.castShadow = true;
    dossierBinder.userData.isSubPart = true;
    dossierGroup.add(dossierBinder);

    const dossierSeal = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.04, 0.015, 16),
      new THREE.MeshStandardMaterial({ color: 0x991b1b, roughness: 0.4 })
    );
    dossierSeal.position.set(0, 0.025, 0);
    dossierSeal.userData.isSubPart = true;
    dossierGroup.add(dossierSeal);

    this.group.add(dossierGroup);

    // Executive Desk Suite Group
    const deskGroup = new THREE.Group();
    deskGroup.name = 'prop_director_desk';

    // Massive Heavy Mahogany Desk Top
    const deskTop = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.14, 1.6), matMahogany);
    deskTop.position.set(0, 0.95, 0);
    deskTop.castShadow = true;
    deskTop.receiveShadow = true;
    deskGroup.add(deskTop);

    // Desk Pedestals (Left & Right)
    [-1.2, 1.2].forEach((x) => {
      const pedestal = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.88, 1.4), matMahogany);
      pedestal.position.set(x, 0.44, 0);
      pedestal.castShadow = true;
      pedestal.receiveShadow = true;
      deskGroup.add(pedestal);
    });

    // Dark Green Leather Desk Blotter Pad with Brass Corners (resting flush on mahogany desk surface y=1.02)
    const blotter = new THREE.Mesh(
      new THREE.BoxGeometry(1.3, 0.015, 0.75),
      new THREE.MeshStandardMaterial({ color: 0x18261e, roughness: 0.6 })
    );
    blotter.position.set(0, 1.028, 0.12);
    blotter.castShadow = true;
    blotter.raycast = () => {};
    deskGroup.add(blotter);

    // 4 Brass Corner Clips on Blotter
    [
      [-0.64, -0.24],
      [-0.64, 0.48],
      [0.64, -0.24],
      [0.64, 0.48]
    ].forEach(([cx, cz]) => {
      const clip = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.018, 0.04), matBrass);
      clip.position.set(cx, 1.044, cz);
      clip.raycast = () => {};
      deskGroup.add(clip);
    });

    // Heavy Crystal Glass Ashtray
    const ashtray = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.08, 0.04, 16), matGlass);
    ashtray.position.set(-0.55, 1.040, 0.35);
    ashtray.castShadow = true;
    ashtray.raycast = () => {};
    deskGroup.add(ashtray);

    // Unplugged Cream Bakelite Rotary Telephone
    const phoneGroup = new THREE.Group();
    phoneGroup.position.set(-0.85, 1.08, 0.12);
    phoneGroup.name = 'prop_void_phone';

    const phoneBase = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.12, 0.32), matPhone);
    phoneBase.castShadow = true;
    phoneGroup.add(phoneBase);

    // Brass Rotary Dial with Finger Stop
    const dial = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.02, 24), matBrass);
    dial.rotation.x = 0.3;
    dial.position.set(0, 0.08, 0.05);
    dial.castShadow = true;
    phoneGroup.add(dial);

    const fingerStop = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.025, 0.03), matBrass);
    fingerStop.position.set(0.065, 0.08, 0.08);
    phoneGroup.add(fingerStop);

    // Cradle Prongs & Handset
    const handset = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.07, 0.09), matPhone);
    handset.position.set(0, 0.16, -0.04);
    handset.castShadow = true;
    phoneGroup.add(handset);

    // Handset Coiled Cord
    const cordCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.18, 0.14, -0.04),
      new THREE.Vector3(-0.24, 0.06, 0.02),
      new THREE.Vector3(-0.20, 0.02, 0.12),
      new THREE.Vector3(-0.12, 0.02, 0.16)
    ]);
    const phoneCord = new THREE.Mesh(new THREE.TubeGeometry(cordCurve, 16, 0.008, 8, false), matPhone);
    phoneCord.raycast = () => {};
    phoneGroup.add(phoneCord);

    this.group.add(phoneGroup);

    // Articulated Nagra SN Reel-to-Reel Tape Deck (flush on desk surface y=1.02)
    const tapeDeckGroup = new THREE.Group();
    tapeDeckGroup.position.set(0.0, 1.07, -0.15);
    tapeDeckGroup.name = 'prop_tape_deck';

    const deckBody = new THREE.Mesh(
      new THREE.BoxGeometry(0.56, 0.10, 0.42),
      new THREE.MeshStandardMaterial({ color: 0x222b27, roughness: 0.5, metalness: 0.3 })
    );
    deckBody.castShadow = true;
    tapeDeckGroup.add(deckBody);

    // Feed and Takeup Spools (3-Spoke Aluminum Flanges)
    [-0.14, 0.14].forEach((xOff) => {
      const spoolGroup = new THREE.Group();
      spoolGroup.position.set(xOff, 0.06, -0.02);

      const spoolCore = new THREE.Mesh(new THREE.CylinderGeometry(0.095, 0.095, 0.016, 24), matAluminum);
      spoolGroup.add(spoolCore);

      const spindle = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.035, 12), matBrass);
      spoolGroup.add(spindle);

      tapeDeckGroup.add(spoolGroup);
    });

    // Center Tape Head Bridge
    const tapeBridge = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.035, 0.06), matCastIron);
    tapeBridge.position.set(0, 0.065, 0.08);
    tapeDeckGroup.add(tapeBridge);

    // VU Meter Display Window
    const vuWindow = new THREE.Mesh(new THREE.PlaneGeometry(0.14, 0.06), matAmberGlow);
    vuWindow.rotation.x = -Math.PI / 2;
    vuWindow.position.set(0, 0.052, -0.14);
    tapeDeckGroup.add(vuWindow);

    // Transport Keys (Play, Stop, Rewind)
    [-0.08, 0, 0.08].forEach((bx) => {
      const btn = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.02, 0.035), matAluminum);
      btn.position.set(bx, 0.055, 0.16);
      tapeDeckGroup.add(btn);
    });

    this.group.add(tapeDeckGroup);

    // Brass Desk Carriage Clock (11:03 Escapement Interlock, resting flush on desk surface y=1.02)
    const clockGroup = new THREE.Group();
    clockGroup.position.set(0.65, 1.1425, -0.15);
    clockGroup.name = 'prop_carriage_clock';

    // Top and Bottom Brass Baseplates
    [-0.11, 0.11].forEach((py) => {
      const plate = new THREE.Mesh(new THREE.BoxGeometry(0.20, 0.025, 0.16), matBrass);
      plate.position.y = py;
      plate.castShadow = true;
      clockGroup.add(plate);
    });

    // 4 Corner Brass Fluted Pillars
    [
      [-0.085, -0.065],
      [-0.085, 0.065],
      [0.085, -0.065],
      [0.085, 0.065]
    ].forEach(([cx, cz]) => {
      const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.22, 12), matBrass);
      pillar.position.set(cx, 0, cz);
      clockGroup.add(pillar);
    });

    // Beveled Crystal Glass Enclosure (front face at z = 0.070)
    const clockGlass = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.20, 0.14), matGlass);
    clockGroup.add(clockGlass);

    // Enamel White Clock Dial with Hands at 11:03 (recessed inside glass enclosure at z = 0.055)
    const dialPlate = new THREE.Mesh(
      new THREE.PlaneGeometry(0.13, 0.13),
      new THREE.MeshStandardMaterial({ color: 0xfafafa, roughness: 0.2 })
    );
    dialPlate.position.set(0, 0.01, 0.055);
    clockGroup.add(dialPlate);

    // Hour and Minute Hands (Inside glass enclosure with 3mm depth offset to prevent coplanar Z-fighting)
    const hourHand = new THREE.Mesh(new THREE.BoxGeometry(0.006, 0.035, 0.002), matCastIron);
    hourHand.rotation.z = 0.52; // ~11 o'clock
    hourHand.position.set(-0.01, 0.02, 0.058);
    clockGroup.add(hourHand);

    const minuteHand = new THREE.Mesh(new THREE.BoxGeometry(0.004, 0.05, 0.002), matCastIron);
    minuteHand.rotation.z = -0.31; // ~3 minutes past 12
    minuteHand.position.set(0.005, 0.025, 0.061);
    clockGroup.add(minuteHand);

    // Top Folding Brass Carry Handle
    const handle = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.009, 8, 24), matBrass);
    handle.position.set(0, 0.14, 0);
    handle.rotation.x = Math.PI / 2;
    clockGroup.add(handle);

    clockGroup.userData.interactionPrompt = '[INSPECT BRASS CARRIAGE CLOCK (11:03)]';
    this.group.add(clockGroup);

    // Secret Mahogany Drawer
    const drawerMat = new THREE.MeshStandardMaterial({ color: 0x140c08, roughness: 0.4 });
    this.secretDrawerMesh = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.12, 0.6), drawerMat);
    this.secretDrawerMesh.position.set(0.6, 0.88, 0.1);
    this.secretDrawerMesh.name = 'prop_director_drawer';
    this.secretDrawerMesh.userData.isSubPart = true;
    deskGroup.add(this.secretDrawerMesh);

    // Memory Crystal 05 (The Glowing Celadon Core)
    const crystalGeo = new THREE.DodecahedronGeometry(0.14, 0);
    const crystalMat = new THREE.MeshPhysicalMaterial({
      color: 0x86efac,
      transmission: 0.5,
      roughness: 0.1,
      metalness: 0.2,
      emissive: 0x22c55e,
      emissiveIntensity: 0.6
    });
    this.crystalMesh = new THREE.Mesh(crystalGeo, crystalMat);
    this.crystalMesh.position.set(0.6, 1.02, 0.1);
    this.crystalMesh.name = 'crystal_05_celadon';
    this.crystalMesh.castShadow = true;
    this.crystalMesh.visible = false;

    this.crystalLight = new THREE.PointLight(0x34d399, 1.5, 3);
    this.crystalLight.position.set(0, 0, 0);
    this.crystalLight.visible = false;
    this.crystalMesh.add(this.crystalLight);

    deskGroup.add(this.crystalMesh);

    this.group.add(deskGroup);

    // High-Backed Tufted Leather Executive Chair Behind Desk
    const chairGroup = new THREE.Group();
    chairGroup.position.set(0, 0, -1.05);
    chairGroup.name = 'prop_executive_chair';
    chairGroup.userData.flavorText = 'A high-backed executive chair upholstered in tufted black leather. It is cold to the touch.';

    const chairBase = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.38, 0.05, 16), matCastIron);
    chairBase.position.y = 0.025;
    chairGroup.add(chairBase);

    const chairStem = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.45, 12), matCastIron);
    chairStem.position.y = 0.25;
    chairGroup.add(chairStem);

    const chairSeat = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.12, 0.68), matLeather);
    chairSeat.position.y = 0.54;
    chairSeat.castShadow = true;
    chairGroup.add(chairSeat);

    const chairBack = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.82, 0.12), matLeather);
    chairBack.position.set(0, 0.98, -0.30);
    chairBack.rotation.x = -0.08;
    chairBack.castShadow = true;
    chairGroup.add(chairBack);

    this.group.add(chairGroup);

    // Suspended Downward Task Pendant Light Fixture
    const lampShade = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.38, 0.24, 24),
      new THREE.MeshStandardMaterial({ color: 0x18241e, metalness: 0.8, roughness: 0.25 })
    );
    lampShade.position.set(0, 4.6, 0);
    lampShade.raycast = () => {};
    this.group.add(lampShade);

    const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 1.2, 8), matCastIron);
    cord.position.set(0, 5.2, 0);
    cord.raycast = () => {};
    this.group.add(cord);

    // Single Harsh Surgical Downward Spotlight Focused on Desk
    const spot = new THREE.SpotLight(0xffffff, 3.4, 12, Math.PI / 6, 0.25);
    spot.position.set(0, 4.5, 0);
    spot.target = deskTop;
    spot.castShadow = true;
    this.group.add(spot);

    // Warm executive office fill illumination
    const officeCeilingLight = new THREE.PointLight(0xfffaed, 1.2, 16);
    officeCeilingLight.position.set(0, 4.2, 0);
    this.group.add(officeCeilingLight);

    const bookcaseLight = new THREE.PointLight(0xffeed1, 1.0, 10);
    bookcaseLight.position.set(-3.5, 2.5, 0);
    this.group.add(bookcaseLight);

    // Re-entry state restoration
    if (this.drawerUnlocked) {
      if (this.secretDrawerMesh) {
        this.secretDrawerMesh.position.z = 0.55;
      }
      if (this.crystalMesh) {
        this.crystalMesh.position.z = 0.55;
        if (!this.crystalCollected) {
          this.crystalMesh.visible = true;
          if (this.crystalLight) this.crystalLight.visible = true;
        }
      }
    }

    return this.group;
  }

  public teardown(scene: THREE.Scene): void {
    this.unsubscribers.forEach((u) => u());
    this.unsubscribers = [];
    this.wiretapScreen.teardown();
    if (this.crystalLight) {
      this.crystalLight.dispose();
      this.crystalLight = null;
    }
    if (this.group) {
      scene.remove(this.group);
      this.group = null;
    }
    this.crystalMesh = null;
    this.secretDrawerMesh = null;
  }

  public onObjectClick(objectId: string): boolean {
    const bus = EventBus.getInstance();
    const audio = AudioEngine.getInstance();

    if (objectId === 'door_return_hub') {
      bus.emit('scenario:switch_room', { targetRoomId: 'room_04', doorThresholdId: 'door_portal_directors_office' });
      return true;
    }

    if (objectId === 'door_portal_synthesis') {
      if (!this.crystalCollected && !GameState.getInstance().hasCrystal('crystal_05_celadon')) {
        bus.emit('camera:move_to_hotspot', { hotspotId: 'desk' });
        bus.emit('ui:subtitle_changed', {
          text: 'The Sub-Core Synthesis conduit is locked. Calibrate wiretap telemetry and retrieve Memory Crystal 05 first.'
        });
        return true;
      }
      audio.playPneumaticHiss();
      bus.emit('ui:subtitle_changed', {
        text: 'Descending maintenance conduit to Synthesis Core (SL4-07-SYN).'
      });
      bus.emit('scenario:switch_room', { targetRoomId: 'synthesis_blackout', doorThresholdId: 'door_portal_synthesis' });
      return true;
    }

    if (objectId === 'prop_tape_deck' || objectId === 'prop_carriage_clock') {
      if (this.drawerUnlocked || GameState.getInstance().hasCrystal('crystal_05_celadon')) {
        bus.emit('camera:move_to_hotspot', { hotspotId: 'desk' });
        bus.emit('ui:subtitle_changed', {
          text: 'The reel-to-reel deck is unspooled. Carriage clock set to 11:03. Celadon Core crystal secured.'
        });
        return true;
      }
      audio.playTumblerClick();
      bus.emit('camera:move_to_hotspot', { hotspotId: 'desk' });
      this.wiretapScreen.open();
      return true;
    }

    if (objectId === 'prop_director_desk' || objectId === 'prop_director_drawer') {
      audio.playTumblerClick();
      if (!this.drawerUnlocked) {
        bus.emit('ui:subtitle_changed', {
          text: 'The heavy mahogany executive desk is locked with a magnetic relay. An unplugged rotary telephone and wiretap tape deck rest on the surface.'
        });
      } else {
        bus.emit('ui:subtitle_changed', {
          text: 'The executive desk drawer is unsealed. The black void stretches endlessly into the distance.'
        });
      }
      return true;
    }

    if (objectId === 'prop_director_bookshelf' || objectId === 'prop_director_dossier') {
      audio.playTumblerClick();
      bus.emit('camera:move_to_hotspot', { hotspotId: 'bookshelf' });
      bus.emit('ui:subtitle_changed', {
        text: 'DIRECTOR\'S LOGBOOK // CONFIDENTIAL: "The wiretap carriage escapement must be synchronized at eleven-zero-three (11:03). Reduce playback speed to half-speed (0.5x) to reveal the voice beneath the tape hiss, then dial 1-1-0-3 on the rotary telephone exchange."'
      });
      bus.emit('ui:open_staff_roster', { staffId: 'vandermeer' });
      return true;
    }

    if (objectId === 'prop_director_credenza') {
      audio.playTumblerClick();
      bus.emit('ui:subtitle_changed', {
        text: 'Executive Credenza: Stamped clinical memoranda detailing Subject 104\'s scheduled extraction and memory calibration.'
      });
      return true;
    }

    if (objectId === 'prop_executive_chair') {
      audio.playTumblerClick();
      bus.emit('ui:subtitle_changed', {
        text: 'A high-backed executive chair upholstered in tufted black leather. It is cold to the touch.'
      });
      return true;
    }

    if (objectId === 'prop_void_phone') {
      audio.playHandsetClick();
      if (!this.drawerUnlocked) {
        if (!this.wiretapScreen.isSafeUnlatched()) {
          bus.emit('ui:subtitle_changed', {
            text: 'You lift the heavy receiver. Faint, wet breathing echoes... A voice whispers: "Align the carriage escapement at eleven-zero-three."'
          });
          return true;
        }
        this.drawerUnlocked = true;
        audio.playPneumaticHiss();
        if (this.secretDrawerMesh) {
          this.secretDrawerMesh.position.z = 0.55;
        }
        if (this.crystalMesh && !this.crystalCollected) {
          this.crystalMesh.position.z = 0.55;
          this.crystalMesh.visible = true;
          if (this.crystalLight) this.crystalLight.visible = true;
        }
        bus.emit('ui:subtitle_changed', {
          text: 'You lift the heavy receiver. Faint, wet breathing echoes. A magnetic relay clicks open a secret mahogany drawer, revealing the Celadon Core! Click the crystal to retrieve it.'
        });
      } else {
        bus.emit('ui:subtitle_changed', {
          text: 'You lift the receiver. Only shallow, rhythmic breathing against the microphone. The secret drawer remains extended.'
        });
      }
      return true;
    }

    if (objectId === 'crystal_05_celadon') {
      if (!this.drawerUnlocked) {
        bus.emit('ui:subtitle_changed', {
          text: 'The Glowing Celadon Core is locked inside the secret executive desk drawer.'
        });
        return true;
      }

      if (!this.crystalCollected && !GameState.getInstance().hasCrystal('crystal_05_celadon')) {
        this.crystalCollected = true;
        if (this.crystalMesh) this.crystalMesh.visible = false;
        if (this.crystalLight) this.crystalLight.visible = false;
        audio.playTumblerClick();
        bus.emit('puzzle:crystal_collected', {
          crystalId: 'crystal_05_celadon' as CrystalId,
          label: 'Glowing Celadon Core'
        });
        bus.emit('ui:subtitle_changed', {
          text: 'Memory Crystal 05 (Glowing Celadon Core) secured. All 5 fragments recovered! Return to the Central Hub for synthesis.'
        });
      }
      return true;
    }

    return false;
  }

  public update(_delta: number): void {
    if (this.crystalMesh && this.crystalMesh.visible) {
      this.crystalMesh.rotation.y += 0.02;
      this.crystalMesh.position.y = 1.02 + Math.sin(performance.now() * 0.003) * 0.03;
    }
  }
}
