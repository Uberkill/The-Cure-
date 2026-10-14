import * as THREE from 'three';
import { RoomScenario, HotspotAnchor, CrystalId } from '../types';
import { EventBus } from '../core/EventBus';
import { AudioEngine } from '../audio/AudioEngine';
import { MicroficheViewerScreen } from '../ui/screens/MicroficheViewerScreen';
import { GameState } from '../core/GameState';
import { LightRigManager } from '../rendering/LightRigManager';

export class Room05_Archive implements RoomScenario {
  public id = 'archive';
  public title = 'The Archive';
  public actTitle = 'ACT V • THE DEEP SICKNESS';
  public roomCode = 'Institutional Archive 05 • Records Labyrinth';
  public defaultHotspot = 'overview';

  public hotspots: Record<string, HotspotAnchor> = {
    overview: {
      id: 'overview',
      name: 'I. Archive Labyrinth',
      position: new THREE.Vector3(0, 2.2, 4.0),
      interactionPrompt: 'Archive Overview',
      cameraPreset: {
        name: 'overview',
        position: new THREE.Vector3(3.2, 2.8, 4.8),
        target: new THREE.Vector3(0, 1.0, 0)
      }
    },
    drawers: {
      id: 'drawers',
      name: 'II. Patient Drawer 104',
      position: new THREE.Vector3(-0.8, 1.4, -0.6),
      interactionPrompt: '[SEARCH FILING CABINETS]',
      cameraPreset: {
        name: 'drawers',
        position: new THREE.Vector3(-0.2, 1.6, 0.8),
        target: new THREE.Vector3(-1.0, 1.2, -0.8)
      }
    },
    microfiche: {
      id: 'microfiche',
      name: 'III. Microfiche Terminal',
      position: new THREE.Vector3(1.4, 1.4, -0.6),
      interactionPrompt: '[ACCESS OPTICAL READER]',
      cameraPreset: {
        name: 'microfiche',
        position: new THREE.Vector3(1.4, 1.5, 0.4),
        target: new THREE.Vector3(1.4, 1.1, -0.6)
      }
    },
    door: {
      id: 'door',
      name: 'IV. Hub Corridor',
      position: new THREE.Vector3(0, 1.8, 8.8),
      interactionPrompt: '[RETURN: CENTRAL HUB]',
      cameraPreset: {
        name: 'door',
        position: new THREE.Vector3(0, 1.8, 6.8),
        target: new THREE.Vector3(0, 1.8, 9.8)
      }
    },
    catalog: {
      id: 'catalog',
      name: 'V. Oak Card Catalog Bank',
      position: new THREE.Vector3(-3.2, 1.4, 3.5),
      interactionPrompt: '[INSPECT CARD CATALOG]',
      cameraPreset: {
        name: 'catalog',
        position: new THREE.Vector3(-2.2, 1.6, 4.4),
        target: new THREE.Vector3(-3.4, 1.2, 3.5)
      }
    }
  };

  private group: THREE.Group | null = null;
  private crystalMesh: THREE.Mesh | null = null;
  private crystalLight: THREE.PointLight | null = null;
  private crystalCollected: boolean = false;
  private drawerOpen: boolean = false;
  private drawer104Mesh: THREE.Group | THREE.Mesh | null = null;
  private microficheScreen: MicroficheViewerScreen = new MicroficheViewerScreen();
  private unsubscribers: (() => void)[] = [];

  public async buildScene(_scene: THREE.Scene): Promise<THREE.Group> {
    this.group = new THREE.Group();

    // Rehydrate state from GameState or Microfiche screen
    const hasCrystal = GameState.getInstance().hasCrystal('crystal_04_obsidian');
    if (hasCrystal || this.microficheScreen.isCanisterDelivered()) {
      this.drawerOpen = true;
      this.crystalCollected = hasCrystal;
    } else {
      this.drawerOpen = false;
      this.crystalCollected = false;
    }

    const bus = EventBus.getInstance();
    this.unsubscribers.push(
      bus.on('puzzle:canister_delivered', () => {
        this.drawerOpen = true;
        if (this.drawer104Mesh) {
          this.drawer104Mesh.position.z = 0.45;
        }
        if (this.crystalMesh && !this.crystalCollected) {
          this.crystalMesh.visible = true;
          if (this.crystalLight) this.crystalLight.visible = true;
        }
      })
    );
    this.unsubscribers.push(
      bus.on('puzzle:crystal_collected', (payload) => {
        const data = payload as { crystalId?: string };
        if (data.crystalId === 'crystal_04_obsidian') {
          this.drawerOpen = true;
          this.crystalCollected = true;
          if (this.drawer104Mesh) {
            this.drawer104Mesh.position.z = 0.45;
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

    const matCab = new THREE.MeshStandardMaterial({ color: 0x283629, roughness: 0.6, metalness: 0.3 });
    const matWall = new THREE.MeshStandardMaterial({ color: 0x162018, roughness: 0.8 });
    const matCord = new THREE.MeshStandardMaterial({ color: 0x0a0c0a, roughness: 0.95 });
    const matBrass = new THREE.MeshStandardMaterial({ color: 0xc28833, metalness: 0.8, roughness: 0.3 });

    // Sickly dark floor (Expansive records repository)
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(12, 20), new THREE.MeshStandardMaterial({ color: 0x101612, roughness: 0.6 }));
    floor.rotation.x = -Math.PI / 2;
    this.group.add(floor);

    // Ceiling & Walls (Towering 6.0m double-height records vault)
    const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(12, 20), matWall);
    ceiling.position.y = 6.0;
    ceiling.rotation.x = Math.PI / 2;
    this.group.add(ceiling);

    const wallBack = new THREE.Mesh(new THREE.BoxGeometry(12, 6.2, 0.2), matWall);
    wallBack.position.set(0, 3.1, -10);
    this.group.add(wallBack);

    const wallFront = new THREE.Mesh(new THREE.BoxGeometry(12, 6.2, 0.2), matWall);
    wallFront.position.set(0, 3.1, 10);
    this.group.add(wallFront);

    const wallLeft = new THREE.Mesh(new THREE.BoxGeometry(0.2, 6.2, 20), matWall);
    wallLeft.position.set(-6, 3.1, 0);
    this.group.add(wallLeft);

    const wallRight = new THREE.Mesh(new THREE.BoxGeometry(0.2, 6.2, 20), matWall);
    wallRight.position.set(6, 3.1, 0);
    this.group.add(wallRight);

    // Overhead Steel Gantry Crane Beam
    const gantry = new THREE.Mesh(
      new THREE.BoxGeometry(0.35, 0.45, 20),
      new THREE.MeshStandardMaterial({ color: 0x1f2924, metalness: 0.8, roughness: 0.3 })
    );
    gantry.position.set(0, 5.75, 0);
    gantry.raycast = () => {};
    this.group.add(gantry);

    // Return Door to Concourse / Audiology Vault
    const returnDoorGroup = new THREE.Group();
    returnDoorGroup.position.set(0, 0, 9.85);

    const returnDoorFrame = new THREE.Mesh(
      new THREE.BoxGeometry(1.8, 3.2, 0.24),
      new THREE.MeshStandardMaterial({ color: 0x18241d, roughness: 0.6 })
    );
    returnDoorFrame.position.set(0, 1.6, 0);
    returnDoorFrame.raycast = () => {};
    returnDoorFrame.userData.isSubPart = true;
    returnDoorGroup.add(returnDoorFrame);

    const returnDoor = new THREE.Mesh(
      new THREE.BoxGeometry(1.5, 2.9, 0.1),
      new THREE.MeshStandardMaterial({ color: 0x223025, metalness: 0.5, roughness: 0.4 })
    );
    returnDoor.position.set(0, 1.45, -0.14);
    returnDoor.name = 'door_return_hub';
    returnDoorGroup.add(returnDoor);

    const returnPlaque = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 0.16, 0.04),
      new THREE.MeshStandardMaterial({ color: 0xc28833, metalness: 0.8, roughness: 0.3 })
    );
    returnPlaque.position.set(0, 3.15, -0.14);
    returnPlaque.name = 'plaque_audiology_concourse';
    returnPlaque.raycast = () => {};
    returnPlaque.userData.isSubPart = true;
    returnDoorGroup.add(returnPlaque);

    this.group.add(returnDoorGroup);

    // Oak Card Catalog Bank (Mid-century institutional record index)
    const catalogGroup = new THREE.Group();
    catalogGroup.position.set(-3.8, 0, 3.5);
    catalogGroup.rotation.y = Math.PI / 4;
    catalogGroup.name = 'prop_card_catalog';

    const matOak = new THREE.MeshStandardMaterial({ color: 0x3d2817, roughness: 0.6, metalness: 0.1 });
    const catalogBody = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.5, 0.65), matOak);
    catalogBody.position.y = 0.95;
    catalogBody.castShadow = true;
    catalogBody.receiveShadow = true;
    catalogGroup.add(catalogBody);

    const catalogLegs = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.2, 0.55), matBrass);
    catalogLegs.position.y = 0.1;
    catalogGroup.add(catalogLegs);

    // Contact shadow plane under catalog bank
    const catalogAO = new THREE.Mesh(
      new THREE.PlaneGeometry(1.6, 0.8),
      new THREE.MeshBasicMaterial({ color: 0x141816, transparent: true, opacity: 0.32, depthWrite: false })
    );
    catalogAO.rotation.x = -Math.PI / 2;
    catalogAO.position.set(0, 0.003, 0);
    catalogAO.raycast = () => {};
    catalogGroup.add(catalogAO);

    for (let cr = 0; cr < 4; cr++) {
      for (let cc = 0; cc < 4; cc++) {
        const dx = -0.48 + cc * 0.32;
        const dy = 0.45 + cr * 0.32;

        const drawerPlate = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.26, 0.02), matOak);
        drawerPlate.position.set(dx, dy, 0.33);
        drawerPlate.raycast = () => {};
        catalogGroup.add(drawerPlate);

        const brassPull = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.04, 0.03), matBrass);
        brassPull.position.set(dx, dy, 0.35);
        brassPull.raycast = () => {};
        catalogGroup.add(brassPull);

        const labelSlot = new THREE.Mesh(
          new THREE.PlaneGeometry(0.09, 0.04),
          new THREE.MeshStandardMaterial({ color: 0xf5eedb, roughness: 0.9 })
        );
        labelSlot.position.set(dx, dy + 0.06, 0.352);
        labelSlot.raycast = () => {};
        catalogGroup.add(labelSlot);
      }
    }

    catalogGroup.userData.interactionPrompt = '[SEARCH: OAK CARD CATALOG]';
    this.group.add(catalogGroup);

    // Physical Microfilm Canister 104 (Resting on catalog top ledge)
    const canisterGroup = new THREE.Group();
    canisterGroup.position.set(-3.5, 1.74, 3.4);
    canisterGroup.name = 'prop_film_canister_104';
    canisterGroup.userData.interactionPrompt = '[EXAMINE: MICROFILM CANISTER 104]';

    const canBody = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.12, 0.08, 24),
      new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.85, roughness: 0.25 })
    );
    canBody.castShadow = true;
    canisterGroup.add(canBody);

    const canLabel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.122, 0.122, 0.03, 24, 1, true),
      new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.8 })
    );
    canisterGroup.add(canLabel);

    this.group.add(canisterGroup);

    // Carpet of Coiling Telephone Cords on the floor
    for (let c = 0; c < 24; c++) {
      const radius = 0.4 + Math.random() * 0.8;
      const cord = new THREE.Mesh(new THREE.TorusGeometry(radius, 0.02, 6, 24), matCord);
      cord.rotation.x = Math.PI / 2;
      cord.position.set((Math.random() - 0.5) * 8, 0.02, (Math.random() - 0.5) * 8);
      this.group.add(cord);
    }

    // Spiraling Steel Filing Cabinets Labyrinth
    const cabinetPositions = [
      [-2.4, -2.0, 0],
      [-2.4, 0.0, 0],
      [-2.4, 2.0, 0],
      [2.4, -2.0, Math.PI],
      [2.4, 0.0, Math.PI],
      [2.4, 2.0, Math.PI],
      [0.0, -3.8, Math.PI / 2],
      [-1.0, -0.8, -Math.PI / 4]
    ];

    cabinetPositions.forEach((pos, idx) => {
      const cabGroup = new THREE.Group();
      cabGroup.position.set(pos[0], 0, pos[1]);
      cabGroup.rotation.y = pos[2];
      cabGroup.name = `prop_cabinet_${idx}`;

      // Filing cabinet body (4 drawers tall)
      const body = new THREE.Mesh(new THREE.BoxGeometry(1.0, 2.4, 1.2), matCab);
      body.position.y = 1.2;
      body.castShadow = true;
      cabGroup.add(body);

      // Drawer handles
      for (let d = 0; d < 4; d++) {
        const handle = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.04, 0.04), matBrass);
        handle.position.set(0, 0.45 + d * 0.55, 0.62);
        cabGroup.add(handle);
      }

      // Designate idx 7 as Drawer 104
      if (idx === 7) {
        const drawerGroup = new THREE.Group();
        drawerGroup.position.set(0, 1.0, 0.5);
        drawerGroup.name = 'prop_drawer_104';
        drawerGroup.userData.isSubPart = true;

        // Outer drawer chassis shell
        const drawerMat = new THREE.MeshStandardMaterial({ color: 0x1a261c, roughness: 0.5, metalness: 0.4 });
        const drawerBody = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.45, 0.9), drawerMat);
        drawerGroup.add(drawerBody);

        // Stamped brass label cardholder
        const labelHolder = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.12, 0.02), matBrass);
        labelHolder.position.set(0, 0, 0.46);
        labelHolder.raycast = () => {};
        drawerGroup.add(labelHolder);

        // Aged paper label insert
        const labelPaper = new THREE.Mesh(
          new THREE.PlaneGeometry(0.2, 0.08),
          new THREE.MeshStandardMaterial({ color: 0xdcd1b4, roughness: 0.9 })
        );
        labelPaper.position.set(0, 0, 0.472);
        labelPaper.raycast = () => {};
        drawerGroup.add(labelPaper);

        // Recessed brass drawer pull handle
        const drawerHandle = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.05, 0.05), matBrass);
        drawerHandle.position.set(0, 0.1, 0.48);
        drawerHandle.raycast = () => {};
        drawerGroup.add(drawerHandle);

        // Chromed steel suspension side slide rails
        for (const side of [-0.43, 0.43]) {
          const rail = new THREE.Mesh(
            new THREE.BoxGeometry(0.02, 0.04, 0.88),
            new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.9, roughness: 0.2 })
          );
          rail.position.set(side, 0, 0);
          rail.raycast = () => {};
          drawerGroup.add(rail);
        }

        // Hanging Manila folder dividers
        const manilaMat = new THREE.MeshStandardMaterial({ color: 0xc4b595, roughness: 0.8 });
        const tabMat = new THREE.MeshStandardMaterial({ color: 0xb5a07c, roughness: 0.7 });
        for (let f = 0; f < 7; f++) {
          const folder = new THREE.Mesh(new THREE.BoxGeometry(0.78, 0.36, 0.015), manilaMat);
          folder.position.set(0, 0.02, -0.3 + f * 0.1);
          folder.raycast = () => {};
          drawerGroup.add(folder);

          const tab = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.04, 0.015), tabMat);
          tab.position.set(-0.25 + (f % 3) * 0.25, 0.21, -0.3 + f * 0.1);
          tab.raycast = () => {};
          drawerGroup.add(tab);
        }

        this.drawer104Mesh = drawerGroup;
        cabGroup.add(this.drawer104Mesh);

        // Memory Crystal 04 (Pitch-Black Obsidian)
        const crystalGeo = new THREE.OctahedronGeometry(0.12, 0);
        const crystalMat = new THREE.MeshStandardMaterial({
          color: 0x050706,
          roughness: 0.1,
          metalness: 0.9,
          emissive: 0x0d120f,
          emissiveIntensity: 0.2
        });
        this.crystalMesh = new THREE.Mesh(crystalGeo, crystalMat);
        this.crystalMesh.position.set(0, 0.28, 0);
        this.crystalMesh.name = 'crystal_04_obsidian';
        this.crystalMesh.visible = false;

        this.crystalLight = new THREE.PointLight(0x818cf8, 1.5, 3);
        this.crystalLight.position.set(0, 0, 0);
        this.crystalLight.visible = false;
        this.crystalMesh.add(this.crystalLight);

        drawerGroup.add(this.crystalMesh);
      }

      this.group!.add(cabGroup);
    });

    // Dedicated Microfiche Reader Console Table
    const readerDesk = new THREE.Group();
    readerDesk.position.set(1.4, 0, -0.6);
    readerDesk.name = 'prop_microfiche_reader';

    // Stand base / pedestal chassis
    const standMat = new THREE.MeshStandardMaterial({ color: 0x1e2822, roughness: 0.7, metalness: 0.3 });
    const stand = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.85, 0.8), standMat);
    stand.position.y = 0.425;
    stand.castShadow = true;
    readerDesk.add(stand);

    // Contact shadow plane under reader desk
    const readerDeskAO = new THREE.Mesh(
      new THREE.PlaneGeometry(1.4, 1.0),
      new THREE.MeshBasicMaterial({ color: 0x141816, transparent: true, opacity: 0.32, depthWrite: false })
    );
    readerDeskAO.rotation.x = -Math.PI / 2;
    readerDeskAO.position.set(0, 0.003, 0);
    readerDeskAO.raycast = () => {};
    readerDesk.add(readerDeskAO);

    // Beveled desktop trim
    const trimMat = new THREE.MeshStandardMaterial({ color: 0x334139, roughness: 0.4, metalness: 0.6 });
    const deskTrim = new THREE.Mesh(new THREE.BoxGeometry(1.24, 0.04, 0.84), trimMat);
    deskTrim.position.y = 0.86;
    deskTrim.raycast = () => {};
    readerDesk.add(deskTrim);

    // Lower equipment louver vents
    const ventMat = new THREE.MeshStandardMaterial({ color: 0x111613, roughness: 0.9 });
    for (let v = 0; v < 5; v++) {
      const ventSlot = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.015, 0.01), ventMat);
      ventSlot.position.set(0, 0.2 + v * 0.04, 0.405);
      ventSlot.raycast = () => {};
      readerDesk.add(ventSlot);
    }

    // Microfilm transport deck
    const deckMat = new THREE.MeshStandardMaterial({ color: 0x25322a, roughness: 0.5, metalness: 0.4 });
    const deck = new THREE.Mesh(new THREE.BoxGeometry(0.88, 0.06, 0.52), deckMat);
    deck.position.set(0, 0.91, 0.08);
    deck.raycast = () => {};
    readerDesk.add(deck);

    // Lateral Motorized Film Spools
    const spoolAluMat = new THREE.MeshStandardMaterial({ color: 0x9ca3af, metalness: 0.85, roughness: 0.25 });
    const filmMat = new THREE.MeshStandardMaterial({ color: 0x090d0b, roughness: 0.3, metalness: 0.2 });

    for (const [spoolX, fillRadius] of [[-0.28, 0.09], [0.28, 0.06]] as const) {
      const spindle = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.08, 16), matBrass);
      spindle.position.set(spoolX, 0.96, 0.12);
      spindle.raycast = () => {};
      readerDesk.add(spindle);

      for (const flangeY of [0.935, 0.985]) {
        const flange = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.006, 24), spoolAluMat);
        flange.position.set(spoolX, flangeY, 0.12);
        flange.raycast = () => {};
        readerDesk.add(flange);
      }

      const filmPack = new THREE.Mesh(new THREE.CylinderGeometry(fillRadius, fillRadius, 0.04, 20), filmMat);
      filmPack.position.set(spoolX, 0.96, 0.12);
      filmPack.raycast = () => {};
      readerDesk.add(filmPack);
    }

    // Glass sandwich film gate
    const glassGateMat = new THREE.MeshPhysicalMaterial({
      color: 0x6ee7b7,
      transparent: true,
      opacity: 0.45,
      transmission: 0.6,
      roughness: 0.1
    });
    const lowerPlate = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.01, 0.14), glassGateMat);
    lowerPlate.position.set(0, 0.945, 0.12);
    lowerPlate.raycast = () => {};
    readerDesk.add(lowerPlate);

    const upperPlate = new THREE.Mesh(new THREE.BoxGeometry(0.20, 0.01, 0.12), glassGateMat);
    upperPlate.position.set(0, 0.965, 0.12);
    upperPlate.raycast = () => {};
    readerDesk.add(upperPlate);

    // 16mm Film Strip spanning through gate
    const filmStrip = new THREE.Mesh(
      new THREE.BoxGeometry(0.56, 0.002, 0.045),
      new THREE.MeshStandardMaterial({ color: 0x111815, roughness: 0.2, transparent: true, opacity: 0.85 })
    );
    filmStrip.position.set(0, 0.955, 0.12);
    filmStrip.raycast = () => {};
    readerDesk.add(filmStrip);

    // 3-Position Optical Lens Turret (under projection housing)
    const turretBase = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.02, 16), matBrass);
    turretBase.position.set(0, 1.01, 0.12);
    turretBase.raycast = () => {};
    readerDesk.add(turretBase);

    for (let l = 0; l < 3; l++) {
      const angle = (l * 2 * Math.PI) / 3;
      const lensBarrel = new THREE.Mesh(
        new THREE.CylinderGeometry(0.018, 0.022, 0.04, 12),
        new THREE.MeshStandardMaterial({ color: 0x222a24, metalness: 0.8, roughness: 0.3 })
      );
      lensBarrel.position.set(Math.cos(angle) * 0.035, 0.99, 0.12 + Math.sin(angle) * 0.035);
      lensBarrel.raycast = () => {};
      readerDesk.add(lensBarrel);
    }

    // Manual focus knob on right side
    const focusKnob = new THREE.Mesh(
      new THREE.CylinderGeometry(0.035, 0.035, 0.025, 20),
      new THREE.MeshStandardMaterial({ color: 0x111613, metalness: 0.5, roughness: 0.4 })
    );
    focusKnob.rotation.z = Math.PI / 2;
    focusKnob.position.set(0.445, 0.95, 0.08);
    focusKnob.raycast = () => {};
    readerDesk.add(focusKnob);

    // Microfilm projector hood
    const hoodMat = new THREE.MeshStandardMaterial({ color: 0x2b3831, roughness: 0.5, metalness: 0.3 });
    const hood = new THREE.Mesh(new THREE.BoxGeometry(0.70, 0.50, 0.45), hoodMat);
    hood.position.set(0, 1.15, -0.05);
    readerDesk.add(hood);

    // Visor hood perimeter cowl framing (hollowed bezel leaving screen cavity open)
    const cowlTop = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.07, 0.08), hoodMat);
    cowlTop.position.set(0, 1.375, 0.18);
    cowlTop.raycast = () => {};
    readerDesk.add(cowlTop);

    const cowlBottom = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.07, 0.08), hoodMat);
    cowlBottom.position.set(0, 0.925, 0.18);
    cowlBottom.raycast = () => {};
    readerDesk.add(cowlBottom);

    const cowlLeft = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.38, 0.08), hoodMat);
    cowlLeft.position.set(-0.305, 1.15, 0.18);
    cowlLeft.raycast = () => {};
    readerDesk.add(cowlLeft);

    const cowlRight = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.38, 0.08), hoodMat);
    cowlRight.position.set(0.305, 1.15, 0.18);
    cowlRight.raycast = () => {};
    readerDesk.add(cowlRight);

    // Illuminated CRT phosphor screen face (recessed inside cowl rim, fully visible)
    const screenFace = new THREE.Mesh(
      new THREE.PlaneGeometry(0.50, 0.38),
      new THREE.MeshStandardMaterial({
        color: 0x22c55e,
        emissive: 0x15803d,
        emissiveIntensity: 0.65,
        roughness: 0.2
      })
    );
    screenFace.position.set(0, 1.15, 0.178);
    readerDesk.add(screenFace);

    // Desk Task Lamp (vintage gooseneck archivist lamp)
    const lampBase = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.02, 16), matBrass);
    lampBase.position.set(-0.48, 0.89, -0.22);
    lampBase.raycast = () => {};
    readerDesk.add(lampBase);

    const gooseneck = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.32, 12), matBrass);
    gooseneck.position.set(-0.44, 1.05, -0.15);
    gooseneck.rotation.z = -0.3;
    gooseneck.rotation.x = 0.2;
    gooseneck.raycast = () => {};
    readerDesk.add(gooseneck);

    const lampshade = new THREE.Mesh(
      new THREE.ConeGeometry(0.07, 0.10, 16, 1, true),
      new THREE.MeshStandardMaterial({ color: 0x1f3427, roughness: 0.5 })
    );
    lampshade.position.set(-0.35, 1.18, -0.05);
    lampshade.rotation.x = Math.PI * 0.75;
    lampshade.rotation.z = -0.3;
    lampshade.raycast = () => {};
    readerDesk.add(lampshade);

    const lampLight = new THREE.PointLight(0xfef08a, 0.5, 2.5);
    lampLight.position.set(-0.35, 1.14, -0.05);
    readerDesk.add(lampLight);

    LightRigManager.getInstance().register({
      id: 'room05_microfiche_desk_lamp',
      name: 'Microfiche Reader Task Lamp',
      room: 'archive',
      type: 'point',
      light: lampLight,
      initialPosition: lampLight.position.clone()
    });

    // Archivist Index Card Box
    const cardBox = new THREE.Mesh(
      new THREE.BoxGeometry(0.22, 0.12, 0.30),
      new THREE.MeshStandardMaterial({ color: 0x543d2b, roughness: 0.7 })
    );
    cardBox.position.set(0.45, 0.94, -0.15);
    cardBox.raycast = () => {};
    readerDesk.add(cardBox);

    this.group.add(readerDesk);

    // Archivist Evelyn Cross's Retention Ledger & Duty Register
    const ledgerGroup = new THREE.Group();
    ledgerGroup.position.set(1.60, 0.90, -0.65);
    ledgerGroup.name = 'prop_cross_ledger';

    const ledgerBinder = new THREE.Mesh(
      new THREE.BoxGeometry(0.36, 0.04, 0.48),
      new THREE.MeshStandardMaterial({ color: 0x24352b, roughness: 0.75 })
    );
    ledgerBinder.castShadow = true;
    ledgerBinder.userData.isSubPart = true;
    ledgerGroup.add(ledgerBinder);

    const ledgerPages = new THREE.Mesh(
      new THREE.PlaneGeometry(0.32, 0.44),
      new THREE.MeshStandardMaterial({ color: 0xf5eedb, roughness: 0.85 })
    );
    ledgerPages.rotation.x = -Math.PI / 2;
    ledgerPages.position.y = 0.022;
    ledgerPages.userData.isSubPart = true;
    ledgerGroup.add(ledgerPages);

    const ledgerTag = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 0.01, 0.04),
      new THREE.MeshStandardMaterial({ color: 0xc28833, metalness: 0.8, roughness: 0.3 })
    );
    ledgerTag.position.set(0, 0.024, -0.18);
    ledgerTag.userData.isSubPart = true;
    ledgerGroup.add(ledgerTag);

    this.group.add(ledgerGroup);

    // Industrial Utility Shelving Racks & Cardboard Transfer Boxes
    const matShelfSteel = new THREE.MeshStandardMaterial({ color: 0x1e2722, metalness: 0.6, roughness: 0.5 });
    const matBoxKraft = new THREE.MeshStandardMaterial({ color: 0x856e52, roughness: 0.85 });
    const matBoxLabel = new THREE.MeshStandardMaterial({ color: 0xd6cebe, roughness: 0.9 });
    const matCanisterAlu = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.8, roughness: 0.3 });

    const buildShelvingUnit = (x: number, z: number, rotY: number) => {
      const unit = new THREE.Group();
      unit.position.set(x, 0, z);
      unit.rotation.y = rotY;

      // 4 Upright slotted angle posts
      const postGeo = new THREE.BoxGeometry(0.05, 3.6, 0.05);
      for (const px of [-1.15, 1.15]) {
        for (const pz of [-0.35, 0.35]) {
          const post = new THREE.Mesh(postGeo, matShelfSteel);
          post.position.set(px, 1.8, pz);
          post.raycast = () => {};
          unit.add(post);
        }
      }

      // 4 Shelf tiers
      const shelfGeo = new THREE.BoxGeometry(2.36, 0.03, 0.72);
      for (let s = 0; s < 4; s++) {
        const shelfY = 0.4 + s * 0.9;
        const shelf = new THREE.Mesh(shelfGeo, matShelfSteel);
        shelf.position.set(0, shelfY, 0);
        shelf.raycast = () => {};
        unit.add(shelf);

        // Kraft Archive Boxes ("Bankers Boxes")
        for (let b = 0; b < 3; b++) {
          const boxGroup = new THREE.Group();
          const bx = -0.75 + b * 0.75;
          boxGroup.position.set(bx, shelfY + 0.17, 0);

          const boxBody = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.32, 0.44), matBoxKraft);
          boxBody.raycast = () => {};
          boxGroup.add(boxBody);

          const label = new THREE.Mesh(new THREE.PlaneGeometry(0.20, 0.09), matBoxLabel);
          label.position.set(0, 0, 0.222);
          label.raycast = () => {};
          boxGroup.add(label);

          boxGroup.raycast = () => {};
          unit.add(boxGroup);
        }

        // Stacks of 16mm Microfilm Canister Tins
        if (s === 1 || s === 3) {
          for (let c = 0; c < 2; c++) {
            const tinCan = new THREE.Mesh(
              new THREE.CylinderGeometry(0.12, 0.12, 0.05, 20),
              matCanisterAlu
            );
            tinCan.position.set(0.85, shelfY + 0.03 + c * 0.055, 0.1);
            tinCan.raycast = () => {};
            unit.add(tinCan);
          }
        }
      }

      return unit;
    };

    // Rear wall archive shelving racks
    const rearShelf1 = buildShelvingUnit(-3.2, -6.4, 0);
    this.group.add(rearShelf1);
    const rearShelf2 = buildShelvingUnit(3.2, -6.4, 0);
    this.group.add(rearShelf2);

    // Left wall secondary archive shelving
    const leftShelf = buildShelvingUnit(-6.3, 0.5, Math.PI / 2);
    this.group.add(leftShelf);

    // Suspended Industrial Fluorescent Trough Lights
    const matTrough = new THREE.MeshStandardMaterial({ color: 0x1f2b23, metalness: 0.5, roughness: 0.6 });
    const matTube = new THREE.MeshStandardMaterial({
      color: 0x86efac,
      emissive: 0x4ade80,
      emissiveIntensity: 0.8,
      roughness: 0.2
    });

    for (const lz of [-6.0, -2.0, 2.0, 6.0]) {
      const fixture = new THREE.Group();
      fixture.position.set(0, 4.1, lz);

      const trough = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.1, 0.45), matTrough);
      trough.raycast = () => {};
      fixture.add(trough);

      for (const tx of [-0.12, 0.12]) {
        const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 2.2, 12), matTube);
        tube.rotation.z = Math.PI / 2;
        tube.position.set(0, -0.06, tx);
        tube.raycast = () => {};
        fixture.add(tube);
      }

      for (const cx of [-0.9, 0.9]) {
        const chain = new THREE.Mesh(
          new THREE.CylinderGeometry(0.005, 0.005, 0.3, 6),
          new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.8 })
        );
        chain.position.set(cx, 0.15, 0);
        chain.raycast = () => {};
        fixture.add(chain);
      }

      this.group.add(fixture);
    }

    // Sickly Chemical Green Overhead Lighting across full archive aisles
    [-3.0, 3.0].forEach((gz, idx) => {
      const greenLight = new THREE.PointLight(0x4ade80, 1.1, 12);
      greenLight.position.set(0, 4.0, gz);
      this.group!.add(greenLight);

      LightRigManager.getInstance().register({
        id: `room05_aisle_light_${idx + 1}`,
        name: `Archive Aisle Green Luminaire ${idx + 1}`,
        room: 'archive',
        type: 'point',
        light: greenLight,
        initialPosition: greenLight.position.clone()
      });
    });

    // Re-entry state restoration
    if (this.drawerOpen) {
      if (this.drawer104Mesh) {
        this.drawer104Mesh.position.z = 0.45;
      }
      if (this.crystalMesh && !this.crystalCollected) {
        this.crystalMesh.visible = true;
        if (this.crystalLight) this.crystalLight.visible = true;
      }
    }

    return this.group;
  }

  public teardown(scene: THREE.Scene): void {
    LightRigManager.getInstance().clear('archive');
    this.unsubscribers.forEach(u => u());
    this.unsubscribers = [];
    this.microficheScreen.teardown();
    if (this.crystalLight) {
      this.crystalLight.dispose();
      this.crystalLight = null;
    }
    if (this.group) {
      scene.remove(this.group);
      this.group.traverse((child) => {
        if ((child as THREE.Mesh).geometry) {
          (child as THREE.Mesh).geometry.dispose();
        }
        if ((child as THREE.Mesh).material) {
          const mat = (child as THREE.Mesh).material;
          if (Array.isArray(mat)) {
            mat.forEach(m => m.dispose());
          } else {
            mat.dispose();
          }
        }
      });
      this.group = null;
    }
    this.crystalMesh = null;
    this.drawer104Mesh = null;
  }

  private readonly cabinetLore: Record<string, string> = {
    prop_cabinet_0: 'Cabinet 042: "Subject 042: Cerebral alignment incomplete. Immersion discontinued."',
    prop_cabinet_1: 'Cabinet 067: "Subject 067: Vocal cords excised. Subject non-compliant."',
    prop_cabinet_2: 'Cabinet 088: "Subject 088: Transferred to Audiology Vault for acoustic desensitization."',
    prop_cabinet_3: 'Cabinet 099: "Subject 099: Records missing. Master index points to Subject 104 in Cabinet 7."',
    prop_cabinet_4: 'Cabinet 101: "Subject 101: Memory wiped. Sleep cycle stabilized in Ward 02."',
    prop_cabinet_5: 'Cabinet 102: "Subject 102: Relocated to Hydrotherapy sub-waterline facility."',
    prop_cabinet_6: 'Cabinet 103: "Subject 103: Dossier archived. Cipher key retrieved."'
  };

  public onObjectClick(objectId: string): boolean {
    const bus = EventBus.getInstance();
    const audio = AudioEngine.getInstance();

    if (objectId === 'door_return_hub') {
      audio.playDoorHeavy();
      bus.emit('scenario:switch_room', { targetRoomId: 'room_04', doorThresholdId: 'door_portal_archive' });
      return true;
    }

    if (objectId === 'door_portal_audiology') {
      audio.playDoorHeavy();
      bus.emit('scenario:switch_room', { targetRoomId: 'audiology', doorThresholdId: 'door_portal_audiology' });
      return true;
    }

    if (objectId === 'prop_card_catalog') {
      audio.playDrawerWood();
      bus.emit('camera:move_to_hotspot', { hotspotId: 'catalog' });
      bus.emit('ui:subtitle_changed', {
        text: 'OAK CARD CATALOG // SUBJECT 104 INDEX CARD: "Pneumatic Dispatch Destination: Sector GAMMA-07. Optical Reader Condenser Focus: 0.85. Master dossier stored in Cabinet 7 (Drawer 104)."'
      });
      return true;
    }

    if (objectId === 'prop_cross_ledger') {
      audio.playPaperRustle();
      bus.emit('camera:move_to_hotspot', { hotspotId: 'microfiche' });
      bus.emit('ui:subtitle_changed', {
        text: 'Form 108-STAFF [Archivist E. Cross]: Retention custody register & microfilm security indices.'
      });
      bus.emit('ui:open_staff_roster', { staffId: 'cross' });
      return true;
    }

    if (objectId === 'prop_film_canister_104') {
      audio.playTumblerClick();
      bus.emit('ui:subtitle_changed', {
        text: 'Canister 104 (Marked GAMMA-07): "Microfilm organigram ready for inspection. Access the Microfiche Terminal to align optical focus at 0.85 and dispatch pneumatic canister."'
      });
      return true;
    }

    if (objectId === 'prop_microfiche_reader') {
      if (this.drawerOpen || GameState.getInstance().hasCrystal('crystal_04_obsidian')) {
        bus.emit('camera:move_to_hotspot', { hotspotId: 'microfiche' });
        bus.emit('ui:subtitle_changed', {
          text: 'The microfiche directory indicates Sector GAMMA-07 dispatch completed. Obsidian crystal secured.'
        });
        return true;
      }
      audio.playTumblerClick();
      bus.emit('camera:move_to_hotspot', { hotspotId: 'microfiche' });
      this.microficheScreen.open();
      return true;
    }

    if (objectId in this.cabinetLore) {
      audio.playDrawerWood();
      bus.emit('ui:subtitle_changed', {
        text: this.cabinetLore[objectId]
      });
      return true;
    }

    if (objectId === 'prop_cabinet_7' || objectId === 'prop_drawer_104') {
      audio.playDrawerWood();

      if (!this.microficheScreen.isCanisterDelivered() && !this.drawerOpen) {
        bus.emit('ui:subtitle_changed', {
          text: 'Filing Drawer 104 is locked by the pneumatic transit relay. Dispatch canister from Sector GAMMA-07 on the Microfiche terminal.'
        });
        return true;
      }

      if (!this.drawerOpen) {
        this.drawerOpen = true;
        if (this.drawer104Mesh) {
          this.drawer104Mesh.position.z = 0.45;
        }
        if (this.crystalMesh && !this.crystalCollected) {
          this.crystalMesh.visible = true;
          if (this.crystalLight) this.crystalLight.visible = true;
        }
        audio.playPneumaticHiss();
        bus.emit('ui:subtitle_changed', {
          text: 'Filing Drawer 104 slides outward on oiled tracks, revealing a jagged Pitch-Black Obsidian crystal. Click the crystal to retrieve it.'
        });
      } else {
        bus.emit('ui:subtitle_changed', {
          text: 'The files in Drawer 104 are shredded to pulp. The obsidian crystal sits in the center.'
        });
      }
      return true;
    }

    if (objectId === 'crystal_04_obsidian') {
      if (!this.drawerOpen) {
        bus.emit('ui:subtitle_changed', {
          text: 'The Pitch-Black Obsidian crystal is sealed inside locked Filing Drawer 104.'
        });
        return true;
      }

      if (!this.crystalCollected && !GameState.getInstance().hasCrystal('crystal_04_obsidian')) {
        this.crystalCollected = true;
        if (this.crystalMesh) this.crystalMesh.visible = false;
        if (this.crystalLight) this.crystalLight.visible = false;
        audio.playGlassClink();
        bus.emit('puzzle:crystal_collected', {
          crystalId: 'crystal_04_obsidian' as CrystalId,
          label: 'Pitch-Black Obsidian'
        });
        bus.emit('ui:subtitle_changed', {
          text: 'Memory Crystal 04 (Pitch-Black Obsidian) secured. The walls shudder. Return to the Central Hub.'
        });
      }
      return true;
    }

    return false;
  }

  public update(_delta: number): void {
    if (this.crystalMesh && this.crystalMesh.visible) {
      this.crystalMesh.rotation.y += 0.02;
      this.crystalMesh.position.y = 1.25 + Math.sin(performance.now() * 0.003) * 0.03;
    }
  }
}
