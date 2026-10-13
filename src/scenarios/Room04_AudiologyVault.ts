import * as THREE from 'three';
import { RoomScenario, HotspotAnchor, CrystalId } from '../types';
import { EventBus } from '../core/EventBus';
import { GameState } from '../core/GameState';
import { AudioEngine } from '../audio/AudioEngine';
import { BinauralSynthesizerScreen } from '../ui/screens/BinauralSynthesizerScreen';

export class Room04_AudiologyVault implements RoomScenario {
  public id = 'audiology';
  public title = 'The Audiology Vault';
  public actTitle = 'ACT IV • THE REALITY FRACTURE';
  public roomCode = 'Acoustic Vault 04 • Decoupled Resonance';
  public defaultHotspot = 'overview';

  public hotspots: Record<string, HotspotAnchor> = {
    overview: {
      id: 'overview',
      name: 'I. Vault Overview',
      position: new THREE.Vector3(0, 2.0, 4.0),
      interactionPrompt: 'Audiology Overview',
      cameraPreset: {
        name: 'overview',
        position: new THREE.Vector3(3.4, 2.6, 4.6),
        target: new THREE.Vector3(0, 1.0, 0)
      }
    },
    monolith: {
      id: 'monolith',
      name: 'II. Amplifier Monolith',
      position: new THREE.Vector3(-1.6, 1.4, -1.2),
      interactionPrompt: '[INSPECT AMPLIFIER MONOLITH]',
      cameraPreset: {
        name: 'monolith',
        position: new THREE.Vector3(-0.6, 1.8, 0.4),
        target: new THREE.Vector3(-1.8, 1.4, -1.4)
      }
    },
    chladni: {
      id: 'chladni',
      name: 'III. Chladni Resonator',
      position: new THREE.Vector3(0, 1.4, 0),
      interactionPrompt: '[INSPECT CHLADNI RESONATOR]',
      cameraPreset: {
        name: 'chladni',
        position: new THREE.Vector3(0, 1.9, 1.7),
        target: new THREE.Vector3(0, 0.9, 0)
      }
    },
    door: {
      id: 'door',
      name: 'IV. Hub Corridor',
      position: new THREE.Vector3(0, 1.8, 6.8),
      interactionPrompt: '[RETURN: CENTRAL HUB]',
      cameraPreset: {
        name: 'door',
        position: new THREE.Vector3(0, 1.8, 5.2),
        target: new THREE.Vector3(0, 1.8, 7.8)
      }
    },
    workstation: {
      id: 'workstation',
      name: 'V. Technician Workstation',
      position: new THREE.Vector3(-3.2, 1.2, 3.0),
      interactionPrompt: '[INSPECT TECHNICIAN LOGBOOK]',
      cameraPreset: {
        name: 'workstation',
        position: new THREE.Vector3(-2.2, 1.6, 3.8),
        target: new THREE.Vector3(-3.4, 0.9, 3.0)
      }
    },
    door_portal_archive: {
      id: 'door_portal_archive',
      name: 'VI. Records Archive Gate',
      position: new THREE.Vector3(3.2, 1.8, -7.0),
      interactionPrompt: '[ENTER: ARCHIVE & RECORDS (SL4-05)]',
      cameraPreset: {
        name: 'door_portal_archive',
        position: new THREE.Vector3(3.2, 1.8, -5.2),
        target: new THREE.Vector3(3.2, 1.8, -7.85)
      }
    }
  };

  private group: THREE.Group | null = null;
  private crystalMesh: THREE.Mesh | null = null;
  private crystalLight: THREE.PointLight | null = null;
  private crystalCollected: boolean = false;
  private ampTuned: boolean = false;
  private currentToneFreq: number = 600;
  private binauralScreen: BinauralSynthesizerScreen;
  private unsubscribers: Array<() => void> = [];

  private chladniTexture: THREE.CanvasTexture | null = null;
  private readonly solfeggioFrequencies = [528, 590, 652, 714, 741, 852];
  private freqIndex: number = 0;

  public constructor() {
    this.binauralScreen = new BinauralSynthesizerScreen();
  }

  public async buildScene(_scene: THREE.Scene): Promise<THREE.Group> {
    this.group = new THREE.Group();

    const hasCrystal = GameState.getInstance().hasCrystal('crystal_03_amethyst');
    if (hasCrystal || this.binauralScreen.isAcousticNullAchieved()) {
      this.ampTuned = true;
      this.crystalCollected = hasCrystal;
      this.currentToneFreq = 741;
    } else {
      this.ampTuned = false;
      this.crystalCollected = false;
      this.currentToneFreq = 600;
    }

    const unsubNull = EventBus.getInstance().on('puzzle:acoustic_null_achieved', () => {
      this.ampTuned = true;
      this.currentToneFreq = 741;
      if (this.crystalMesh && !this.crystalCollected) {
        this.crystalMesh.visible = true;
        if (this.crystalLight) this.crystalLight.visible = true;
      }
    });
    this.unsubscribers.push(unsubNull);

    const unsub = EventBus.getInstance().on('puzzle:crystal_collected', (payload) => {
      if (payload.crystalId === 'crystal_03_amethyst') {
        this.ampTuned = true;
        this.crystalCollected = true;
        this.currentToneFreq = 741;
        if (this.crystalMesh) {
          this.crystalMesh.visible = false;
        }
        if (this.crystalLight) {
          this.crystalLight.visible = false;
        }
      }
    });
    this.unsubscribers.push(unsub);

    // High-Fidelity Materials
    const matWall = new THREE.MeshStandardMaterial({ color: 0x1c211e, roughness: 0.85 });
    const matFloor = new THREE.MeshStandardMaterial({ color: 0x222624, roughness: 0.35 });
    const matAmp = new THREE.MeshStandardMaterial({ color: 0x111312, roughness: 0.4, metalness: 0.85 });
    const matGrille = new THREE.MeshStandardMaterial({ color: 0x272e2a, roughness: 0.9 });
    const matAmberGlow = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
    const matBrass = new THREE.MeshStandardMaterial({ color: 0xc28833, metalness: 0.85, roughness: 0.25 });
    const matCastIron = new THREE.MeshStandardMaterial({ color: 0x0f1311, metalness: 0.7, roughness: 0.65 });
    const matRubber = new THREE.MeshStandardMaterial({ color: 0x0a0c0b, roughness: 0.95 });
    const matFoam = new THREE.MeshStandardMaterial({ color: 0x121714, roughness: 0.98 });
    const matConcrete = new THREE.MeshStandardMaterial({ color: 0x2a312d, roughness: 0.75 });

    // Terrazzo Floor (Elongated acoustic bunker)
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(10, 16), matFloor);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this.group.add(floor);

    // Ceiling
    const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(10, 16), matWall);
    ceiling.position.y = 4.4;
    ceiling.rotation.x = Math.PI / 2;
    this.group.add(ceiling);

    // Slanted Non-Euclidean Walls (converging inward)
    const wallBack = new THREE.Mesh(new THREE.BoxGeometry(10, 4.6, 0.2), matWall);
    wallBack.position.set(0, 2.3, -8);
    wallBack.rotation.x = 0.05;
    this.group.add(wallBack);

    const wallFront = new THREE.Mesh(new THREE.BoxGeometry(10, 4.6, 0.2), matWall);
    wallFront.position.set(0, 2.3, 8);
    wallFront.rotation.x = -0.05;
    this.group.add(wallFront);

    // Return Door to Hub
    const returnDoor = new THREE.Mesh(
      new THREE.BoxGeometry(1.6, 3.0, 0.22),
      new THREE.MeshStandardMaterial({ color: 0x3d4a41, metalness: 0.4, roughness: 0.4 })
    );
    returnDoor.position.set(0, 1.5, 7.85);
    returnDoor.rotation.x = -0.05;
    returnDoor.name = 'door_return_hub';
    this.group.add(returnDoor);

    // Connecting Door to Archive & Records (Security Gate on Rear Wall)
    const archiveDoorGroup = new THREE.Group();
    archiveDoorGroup.position.set(3.2, 0, -7.85);
    archiveDoorGroup.rotation.x = 0.05;
    archiveDoorGroup.name = 'group_door_portal_archive';

    const archiveDoorFrame = new THREE.Mesh(
      new THREE.BoxGeometry(1.8, 3.2, 0.24),
      new THREE.MeshStandardMaterial({ color: 0x242d2a, roughness: 0.6 })
    );
    archiveDoorFrame.position.set(0, 1.6, 0);
    archiveDoorFrame.raycast = () => {};
    archiveDoorFrame.userData.isSubPart = true;
    archiveDoorGroup.add(archiveDoorFrame);

    const archiveDoorPanel = new THREE.Mesh(
      new THREE.BoxGeometry(1.5, 2.9, 0.1),
      new THREE.MeshStandardMaterial({ color: 0x3d4a41, metalness: 0.6, roughness: 0.4 })
    );
    archiveDoorPanel.position.set(0, 1.45, 0.14);
    archiveDoorPanel.name = 'door_portal_archive';
    archiveDoorGroup.add(archiveDoorPanel);

    const archivePlaque = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 0.16, 0.04),
      new THREE.MeshStandardMaterial({ color: 0xc28833, metalness: 0.8, roughness: 0.3 })
    );
    archivePlaque.position.set(0, 3.15, 0.14);
    archivePlaque.name = 'plaque_archive_gate';
    archivePlaque.raycast = () => {};
    archivePlaque.userData.isSubPart = true;
    archiveDoorGroup.add(archivePlaque);

    this.group.add(archiveDoorGroup);

    const wallLeft = new THREE.Mesh(new THREE.BoxGeometry(0.2, 4.6, 16), matWall);
    wallLeft.position.set(-5, 2.3, 0);
    wallLeft.rotation.z = -0.05;
    this.group.add(wallLeft);

    const wallRight = new THREE.Mesh(new THREE.BoxGeometry(0.2, 4.6, 16), matWall);
    wallRight.position.set(5, 2.3, 0);
    wallRight.rotation.z = 0.05;
    this.group.add(wallRight);

    // Anechoic Baffle Wedge Panels on Walls (decorative; raycast disabled)
    this.group.add(this.createAnechoicWallBaffles(matFoam));

    // Graphic Acoustic Notation Score on Rear Wall
    const paintingFrame = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.8, 0.04), new THREE.MeshStandardMaterial({ color: 0x141a21 }));
    paintingFrame.position.set(0, 2.4, -7.85);
    paintingFrame.rotation.x = 0.05;
    const paintingCanvas = new THREE.Mesh(
      new THREE.BoxGeometry(2.2, 1.6, 0.06),
      new THREE.MeshStandardMaterial({ color: 0x9ca3af, roughness: 0.9 })
    );
    paintingCanvas.position.set(0, 2.4, -7.83);
    paintingCanvas.rotation.x = 0.05;
    paintingCanvas.name = 'prop_audiology_score';
    this.group.add(paintingFrame);
    this.group.add(paintingCanvas);

    // Technician Workstation Alcove (Left Wall at z=3.0)
    const workstationGroup = new THREE.Group();
    workstationGroup.position.set(-3.6, 0, 3.0);
    workstationGroup.name = 'prop_technician_desk';

    // Workstation Table Frame & Legs
    const deskBase = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.76, 0.8), matCastIron);
    deskBase.position.y = 0.38;
    deskBase.castShadow = true;
    deskBase.receiveShadow = true;
    workstationGroup.add(deskBase);

    // Linoleum Workstation Desktop
    const deskTop = new THREE.Mesh(
      new THREE.BoxGeometry(1.5, 0.05, 0.88),
      new THREE.MeshStandardMaterial({ color: 0x1f2e26, roughness: 0.5, metalness: 0.2 })
    );
    deskTop.position.y = 0.785;
    deskTop.castShadow = true;
    workstationGroup.add(deskTop);

    // Gooseneck Inspection Lamp with Warm Glow
    const deskLamp = new THREE.Group();
    deskLamp.position.set(-3.6, 0, 3.0);
    deskLamp.name = 'prop_technician_lamp';
    deskLamp.userData.isSubPart = true;

    const lampArm = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.45, 12), matBrass);
    lampArm.position.set(-0.55, 1.0, -0.25);
    lampArm.rotation.z = -0.25;
    deskLamp.add(lampArm);

    const lampShade = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.12, 16), matAmp);
    lampShade.position.set(-0.48, 1.18, -0.25);
    lampShade.rotation.z = 0.5;
    deskLamp.add(lampShade);

    const deskLight = new THREE.PointLight(0xfef08a, 1.2, 4);
    deskLight.position.set(-0.45, 1.15, -0.25);
    deskLamp.add(deskLight);
    this.group.add(deskLamp);

    // Open Laboratory Spiral Logbook (Diegetic Clue Item, resting on workstation desktop)
    const journalGroup = new THREE.Group();
    journalGroup.position.set(-3.5, 0.82, 3.05);
    journalGroup.name = 'prop_audiology_journal';
    journalGroup.userData.interactionPrompt = '[READ: AUDIOLOGY LAB JOURNAL]';

    const journalCover = new THREE.Mesh(
      new THREE.BoxGeometry(0.44, 0.02, 0.32),
      new THREE.MeshStandardMaterial({ color: 0x1e3a2b, roughness: 0.8 })
    );
    journalCover.castShadow = true;
    journalGroup.add(journalCover);

    const journalPages = new THREE.Mesh(
      new THREE.BoxGeometry(0.41, 0.024, 0.29),
      new THREE.MeshStandardMaterial({ color: 0xe2d9c2, roughness: 0.9 })
    );
    journalPages.position.y = 0.012;
    journalGroup.add(journalPages);

    for (let r = -0.12; r <= 0.12; r += 0.03) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.015, 0.003, 6, 12), matBrass);
      ring.position.set(-0.205, 0.025, r);
      ring.rotation.y = Math.PI / 2;
      ring.raycast = () => {};
      journalGroup.add(ring);
    }

    this.group.add(workstationGroup);
    this.group.add(journalGroup);

    // Directional Acoustic Horn Assemblies (45 deg Left, 135 deg Right)
    const hornLeft = this.createAcousticHorn(
      'prop_acoustic_horn_left',
      Math.PI / 4,
      new THREE.Vector3(-2.6, 0, 0.4),
      matAmp,
      matBrass,
      matCastIron
    );
    this.group.add(hornLeft);

    const hornRight = this.createAcousticHorn(
      'prop_acoustic_horn_right',
      (3 * Math.PI) / 4,
      new THREE.Vector3(2.6, 0, 0.4),
      matAmp,
      matBrass,
      matCastIron
    );
    this.group.add(hornRight);

    // Central Chladni Resonance Table & Sand Plate
    this.chladniTexture = this.createChladniTexture(this.ampTuned);
    const matChladniPlate = new THREE.MeshStandardMaterial({
      map: this.chladniTexture,
      roughness: 0.25,
      metalness: 0.75
    });
    const chladniTable = this.createChladniTable(matConcrete, matBrass, matChladniPlate);
    this.group.add(chladniTable);

    // Floor Cabling Network (decorative; raycast disabled)
    this.group.add(this.createAudioCables(matRubber));

    // Towering 1960s Tube Amplifier Monolith
    const ampGroup = new THREE.Group();
    ampGroup.position.set(-2.0, 0, -1.8);
    ampGroup.name = 'prop_amplifier_monolith';

    // 3 Stacked Amplifier Cabinets
    for (let i = 0; i < 3; i++) {
      const cab = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.9, 0.8), matAmp);
      cab.position.y = 0.45 + i * 0.95;
      cab.name = 'prop_amp_stack';
      cab.userData.isSubPart = true;
      ampGroup.add(cab);

      // Speaker grille
      const grille = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.75, 0.05), matGrille);
      grille.position.set(0, 0.45 + i * 0.95, 0.42);
      ampGroup.add(grille);

      // Top Unit: Controls & Vacuum Tubes
      if (i === 2) {
        // Tuning Scale Panel
        const dialPanel = new THREE.Mesh(
          new THREE.BoxGeometry(0.75, 0.16, 0.02),
          new THREE.MeshStandardMaterial({ color: 0x0f1311, roughness: 0.3 })
        );
        dialPanel.position.set(-0.25, 0.45 + i * 0.95 + 0.2, 0.44);
        dialPanel.raycast = () => {};
        ampGroup.add(dialPanel);

        // Tuning Dial Knobs
        [-0.45, -0.25, -0.05].forEach((kx) => {
          const knob = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.025, 16), matBrass);
          knob.rotation.x = Math.PI / 2;
          knob.position.set(kx, 0.45 + i * 0.95 + 0.2, 0.455);
          knob.raycast = () => {};
          ampGroup.add(knob);
        });

        // Dual Backlit VU Meters
        [0.25, 0.48].forEach((vx) => {
          const meterHousing = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.12, 0.02), matBrass);
          meterHousing.position.set(vx, 0.45 + i * 0.95 + 0.2, 0.44);
          meterHousing.raycast = () => {};
          ampGroup.add(meterHousing);

          const meterGlass = new THREE.Mesh(new THREE.PlaneGeometry(0.15, 0.09), matAmberGlow);
          meterGlass.position.set(vx, 0.45 + i * 0.95 + 0.2, 0.452);
          meterGlass.raycast = () => {};
          ampGroup.add(meterGlass);
        });

        // 4 Glowing Vacuum Tubes in Steel Cage
        for (let t = 0; t < 4; t++) {
          const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.16, 12), matAmberGlow);
          tube.position.set(-0.45 + t * 0.3, 0.95 + i * 0.95, 0.1);
          tube.raycast = () => {};
          ampGroup.add(tube);
        }

        // Heavy Power Transformer Core
        const transformer = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.28, 0.25), matCastIron);
        transformer.position.set(0.35, 0.95 + i * 0.95 + 0.04, -0.15);
        transformer.raycast = () => {};
        ampGroup.add(transformer);
      }
    }

    // Torn 15-inch Speaker Cone housing the crystal
    const cone = new THREE.Mesh(
      new THREE.CylinderGeometry(0.35, 0.1, 0.18, 24),
      new THREE.MeshStandardMaterial({ color: 0x1e2420, roughness: 0.95 })
    );
    cone.rotation.x = Math.PI / 2;
    cone.position.set(0, 1.4, 0.46);
    cone.name = 'prop_speaker_cone';
    cone.userData.isSubPart = true;
    ampGroup.add(cone);

    // Memory Crystal 03 (Amethyst / Fractured Core)
    const crystalGeo = new THREE.IcosahedronGeometry(0.12, 0);
    const crystalMat = new THREE.MeshPhysicalMaterial({
      color: 0x9333ea,
      transmission: 0.6,
      roughness: 0.15,
      emissive: 0x581c87,
      emissiveIntensity: 0.4
    });
    this.crystalMesh = new THREE.Mesh(crystalGeo, crystalMat);
    this.crystalMesh.position.set(0, 1.4, 0.65);
    this.crystalMesh.name = 'crystal_03_amethyst';
    this.crystalMesh.visible = false;

    this.crystalLight = new THREE.PointLight(0xc084fc, 1.5, 3);
    this.crystalLight.position.set(0, 0, 0);
    this.crystalLight.visible = false;
    this.crystalMesh.add(this.crystalLight);

    ampGroup.add(this.crystalMesh);

    this.group.add(ampGroup);

    // Moody Lighting Pools
    const ampLight = new THREE.PointLight(0xf59e0b, 1.8, 10);
    ampLight.position.set(-2.0, 2.5, -1.0);
    this.group.add(ampLight);

    const chladniSpot = new THREE.SpotLight(0xa78bfa, 2.2, 8, Math.PI / 6, 0.3);
    chladniSpot.position.set(0, 3.8, 0);
    chladniSpot.target = chladniTable;
    chladniSpot.castShadow = true;
    this.group.add(chladniSpot);

    // Re-entry state restoration
    if (this.ampTuned) {
      this.currentToneFreq = 741;
      if (this.crystalMesh && !this.crystalCollected) {
        this.crystalMesh.visible = true;
        if (this.crystalLight) this.crystalLight.visible = true;
      }
    }

    return this.group;
  }

  private createAcousticHorn(
    name: string,
    angleY: number,
    position: THREE.Vector3,
    matMetal: THREE.Material,
    matBrass: THREE.Material,
    matTripod: THREE.Material
  ): THREE.Group {
    const hornGroup = new THREE.Group();
    hornGroup.name = name;
    hornGroup.position.copy(position);
    hornGroup.rotation.y = angleY;

    // Tripod Stand Base
    const tripodCenter = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.95, 16), matTripod);
    tripodCenter.position.y = 0.55;
    tripodCenter.castShadow = true;
    tripodCenter.raycast = () => {};
    hornGroup.add(tripodCenter);

    // 3 Splayed Tripod Legs
    for (let leg = 0; leg < 3; leg++) {
      const legAngle = (leg * Math.PI * 2) / 3;
      const legMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.65, 8), matTripod);
      legMesh.position.set(Math.sin(legAngle) * 0.22, 0.25, Math.cos(legAngle) * 0.22);
      legMesh.rotation.x = 0.35 * Math.cos(legAngle);
      legMesh.rotation.z = -0.35 * Math.sin(legAngle);
      legMesh.castShadow = true;
      legMesh.raycast = () => {};
      hornGroup.add(legMesh);
    }

    // Stepper Motor Turret & Degree Collar
    const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.09, 0.12, 24), matBrass);
    collar.position.y = 1.05;
    collar.castShadow = true;
    collar.raycast = () => {};
    hornGroup.add(collar);

    // Horizontal Horn Assembly Pivot
    const pivot = new THREE.Group();
    pivot.position.set(0, 1.15, 0);

    // Rear Compression Driver
    const driver = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.22, 0.28), matMetal);
    driver.position.set(0, 0, -0.22);
    driver.castShadow = true;
    driver.raycast = () => {};
    pivot.add(driver);

    // Driver Brass Heat Fins
    for (let f = -0.08; f <= 0.08; f += 0.04) {
      const fin = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.015, 0.26), matBrass);
      fin.position.set(0, f, -0.22);
      fin.raycast = () => {};
      pivot.add(fin);
    }

    // Flared Exponential Horn Body
    const hornGeo = new THREE.CylinderGeometry(0.38, 0.09, 0.65, 24, 1, true);
    hornGeo.rotateX(Math.PI / 2);
    const hornMesh = new THREE.Mesh(hornGeo, matMetal);
    hornMesh.position.set(0, 0, 0.28);
    hornMesh.castShadow = true;
    hornMesh.raycast = () => {};
    pivot.add(hornMesh);

    // Horn Mouth Brass Ring
    const mouthRim = new THREE.Mesh(new THREE.TorusGeometry(0.38, 0.018, 12, 32), matBrass);
    mouthRim.position.set(0, 0, 0.605);
    mouthRim.castShadow = true;
    mouthRim.raycast = () => {};
    pivot.add(mouthRim);

    // Raycast Collider Mesh
    const hitCollider = new THREE.Mesh(
      new THREE.BoxGeometry(0.85, 1.35, 1.1),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    hitCollider.position.set(0, 0.7, 0.1);
    hornGroup.add(hitCollider);

    hornGroup.add(pivot);
    hornGroup.userData.interactionPrompt = name.includes('left')
      ? '[INSPECT LEFT DIRECTIONAL HORN (45 DEG)]'
      : '[INSPECT RIGHT DIRECTIONAL HORN (135 DEG)]';

    return hornGroup;
  }

  private createChladniTable(
    matConcrete: THREE.Material,
    matBrass: THREE.Material,
    matPlate: THREE.Material
  ): THREE.Group {
    const tableGroup = new THREE.Group();
    tableGroup.name = 'prop_chladni_plate';
    tableGroup.position.set(0, 0, 0);

    // Heavy Brutalist Pedestal
    const base = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.15, 1.0), matConcrete);
    base.position.y = 0.075;
    base.castShadow = true;
    base.receiveShadow = true;
    base.raycast = () => {};
    tableGroup.add(base);

    const column = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.65, 0.75), matConcrete);
    column.position.y = 0.475;
    column.castShadow = true;
    column.receiveShadow = true;
    column.raycast = () => {};
    tableGroup.add(column);

    const tabletop = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.08, 1.1), matConcrete);
    tabletop.position.y = 0.84;
    tabletop.castShadow = true;
    tabletop.raycast = () => {};
    tableGroup.add(tabletop);

    // Central Electromagnetic Transducer
    const transducer = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.08, 24), matBrass);
    transducer.position.y = 0.92;
    transducer.castShadow = true;
    transducer.raycast = () => {};
    tableGroup.add(transducer);

    // Chladni Brass Plate with Sand Nodal Ring Texture
    const plate = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.02, 0.85), matPlate);
    plate.position.y = 0.97;
    plate.castShadow = true;
    plate.receiveShadow = true;
    tableGroup.add(plate);

    // 4 Corner Vibration Isolation Damper Posts
    [
      [-0.45, -0.45],
      [-0.45, 0.45],
      [0.45, -0.45],
      [0.45, 0.45]
    ].forEach(([x, z]) => {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.08, 12), matBrass);
      post.position.set(x, 0.92, z);
      post.castShadow = true;
      post.raycast = () => {};
      tableGroup.add(post);
    });

    tableGroup.userData.interactionPrompt = '[INSPECT CHLADNI RESONANCE PLATE]';
    return tableGroup;
  }

  private createChladniTexture(isResonant: boolean): THREE.CanvasTexture {
    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    // Dark brushed bronze base
    ctx.fillStyle = '#1c221e';
    ctx.fillRect(0, 0, size, size);

    const cx = size / 2;
    const cy = size / 2;
    const r = size * 0.46;

    // Outer circular brass lip
    ctx.strokeStyle = '#c28833';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(194, 136, 51, 0.35)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(cx, cy, r - 12, 0, Math.PI * 2);
    ctx.stroke();

    // Sand particles along Chladni nodal lines
    const m = 5;
    const n = 4;
    ctx.fillStyle = isResonant ? '#86efac' : '#e2e8f0';

    const count = 3800;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const rad = Math.sqrt(Math.random()) * 0.88;
      const nx = Math.cos(angle) * rad;
      const ny = Math.sin(angle) * rad;

      const field =
        Math.sin(n * Math.PI * nx) * Math.cos(m * Math.PI * ny) -
        Math.cos(m * Math.PI * nx) * Math.sin(n * Math.PI * ny);

      if (Math.abs(field) < (isResonant ? 0.08 : 0.20)) {
        const px = cx + nx * r;
        const py = cy + ny * r;
        ctx.beginPath();
        ctx.arc(px, py, isResonant ? 1.2 : 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  private createAnechoicWallBaffles(matFoam: THREE.Material): THREE.Group {
    const bafflesGroup = new THREE.Group();
    bafflesGroup.name = 'mesh_anechoic_baffles';

    const createBaffleRow = (width: number, height: number, z: number, rotY: number, x: number) => {
      const rowGroup = new THREE.Group();
      rowGroup.position.set(x, 2.2, z);
      rowGroup.rotation.y = rotY;

      const wedgeW = 0.40;
      const wedgeH = 0.75;
      const cols = Math.floor(width / wedgeW);
      const rows = Math.floor(height / wedgeH);

      const prismGeo = new THREE.CylinderGeometry(0.12, 0.12, wedgeH - 0.04, 3);
      prismGeo.rotateX(Math.PI / 2);

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const wedge = new THREE.Mesh(prismGeo, matFoam);
          wedge.position.set(
            (c - cols / 2 + 0.5) * wedgeW,
            (r - rows / 2 + 0.5) * wedgeH,
            0.08
          );
          wedge.rotation.z = (r + c) % 2 === 0 ? 0 : Math.PI / 2;
          wedge.castShadow = false;
          wedge.receiveShadow = true;
          wedge.userData.isSubPart = true;
          rowGroup.add(wedge);
        }
      }
      rowGroup.userData.isSubPart = true;
      return rowGroup;
    };

    bafflesGroup.add(createBaffleRow(4.0, 3.2, -7.85, 0, -2.8));
    bafflesGroup.add(createBaffleRow(4.0, 3.2, -7.85, 0, 2.8));
    bafflesGroup.add(createBaffleRow(10.0, 3.2, 0, Math.PI / 2, -4.85));
    bafflesGroup.add(createBaffleRow(10.0, 3.2, 0, -Math.PI / 2, 4.85));

    return bafflesGroup;
  }

  private createAudioCables(matRubber: THREE.Material): THREE.Group {
    const cableGroup = new THREE.Group();
    cableGroup.name = 'mesh_audio_cables';

    // Cable: Monolith -> Left Horn
    const cable1Geo = new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(-2.0, 0.04, -1.4),
        new THREE.Vector3(-2.4, 0.02, -0.6),
        new THREE.Vector3(-2.6, 0.02, 0.2)
      ]),
      16, 0.022, 6, false
    );
    const cable1 = new THREE.Mesh(cable1Geo, matRubber);
    cable1.userData.isSubPart = true;
    cableGroup.add(cable1);

    // Cable: Monolith -> Chladni Table
    const cable2Geo = new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(-1.8, 0.04, -1.4),
        new THREE.Vector3(-1.2, 0.02, -0.8),
        new THREE.Vector3(-0.6, 0.02, -0.2),
        new THREE.Vector3(0.0, 0.02, -0.1)
      ]),
      20, 0.025, 6, false
    );
    const cable2 = new THREE.Mesh(cable2Geo, matRubber);
    cable2.userData.isSubPart = true;
    cableGroup.add(cable2);

    // Cable: Chladni Table -> Right Horn
    const cable3Geo = new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(0.1, 0.02, -0.1),
        new THREE.Vector3(1.2, 0.02, -0.1),
        new THREE.Vector3(2.0, 0.02, 0.1),
        new THREE.Vector3(2.6, 0.02, 0.2)
      ]),
      20, 0.022, 6, false
    );
    const cable3 = new THREE.Mesh(cable3Geo, matRubber);
    cable3.userData.isSubPart = true;
    cableGroup.add(cable3);

    return cableGroup;
  }

  public teardown(scene: THREE.Scene): void {
    this.unsubscribers.forEach((u) => u());
    this.unsubscribers = [];
    this.binauralScreen.teardown();
    if (this.chladniTexture) {
      this.chladniTexture.dispose();
      this.chladniTexture = null;
    }
    if (this.group) {
      scene.remove(this.group);
      this.group = null;
    }
    if (this.crystalLight) {
      this.crystalLight.dispose();
      this.crystalLight = null;
    }
    this.crystalMesh = null;
  }

  public onObjectClick(objectId: string): boolean {
    const bus = EventBus.getInstance();
    const audio = AudioEngine.getInstance();

    if (objectId === 'door_return_hub') {
      bus.emit('scenario:switch_room', { targetRoomId: 'room_04', doorThresholdId: 'door_portal_audiology' });
      return true;
    }

    if (objectId === 'door_portal_archive') {
      if (!this.crystalCollected && !GameState.getInstance().hasCrystal('crystal_03_amethyst')) {
        bus.emit('camera:move_to_hotspot', { hotspotId: 'monolith' });
        bus.emit('ui:subtitle_changed', {
          text: 'The Records Archive pneumatic gate is sealed. Achieve acoustic null and retrieve Memory Crystal 03 first.'
        });
        return true;
      }
      audio.playPneumaticHiss();
      bus.emit('ui:subtitle_changed', {
        text: 'Traversing security corridor to Archive & Records (SL4-05-ARC).'
      });
      bus.emit('scenario:switch_room', { targetRoomId: 'archive', doorThresholdId: 'door_portal_archive' });
      return true;
    }

    if (objectId === 'prop_audiology_journal' || objectId === 'prop_technician_desk') {
      audio.playTumblerClick();
      bus.emit('camera:move_to_hotspot', { hotspotId: 'workstation' });
      bus.emit('ui:subtitle_changed', {
        text: 'DR. ARIS AUDIOLOGY PROTOCOL: "Standing waves require destructive cancellation. Orient Left Horn to 45 deg, Right Horn to 135 deg, Carrier to 600 Hz, and invert phase by 180 deg to achieve acoustic null. Alternatively, a manual 741 Hz sweep on the amplifier stack bypasses the clamp."'
      });
      bus.emit('ui:open_staff_roster', { staffId: 'vance' });
      return true;
    }

    if (objectId === 'prop_audiology_score') {
      audio.playToneAlignmentSweep(440);
      bus.emit('ui:subtitle_changed', {
        text: 'Graphic Acoustic Score: "Acoustic Decoupling Protocol: 741 Hz Solfeggio Frequency dissolves psychic dampening."'
      });
      return true;
    }

    if (objectId === 'prop_chladni_plate') {
      audio.playToneAlignmentSweep(this.currentToneFreq);
      bus.emit('camera:move_to_hotspot', { hotspotId: 'chladni' });
      if (this.ampTuned || GameState.getInstance().hasCrystal('crystal_03_amethyst')) {
        bus.emit('ui:subtitle_changed', {
          text: 'The Chladni plate shows settled nodal geometry. Phase cancellation confirmed at 741 Hz.'
        });
      } else {
        bus.emit('ui:subtitle_changed', {
          text: 'Chladni plate agitated. Silica sand scatters chaotically until dual horns achieve phase cancellation.'
        });
        this.binauralScreen.open();
      }
      return true;
    }

    if (objectId === 'prop_acoustic_horn_left') {
      audio.playToneAlignmentSweep(this.currentToneFreq);
      bus.emit('camera:move_to_hotspot', { hotspotId: 'monolith' });
      bus.emit('ui:subtitle_changed', {
        text: 'Left Acoustic Horn: Flared directional emitter. Target calibration: 45 degrees.'
      });
      if (!this.ampTuned) {
        this.binauralScreen.open();
      }
      return true;
    }

    if (objectId === 'prop_acoustic_horn_right') {
      audio.playToneAlignmentSweep(this.currentToneFreq);
      bus.emit('camera:move_to_hotspot', { hotspotId: 'monolith' });
      bus.emit('ui:subtitle_changed', {
        text: 'Right Acoustic Horn: Flared directional emitter. Target calibration: 135 degrees.'
      });
      if (!this.ampTuned) {
        this.binauralScreen.open();
      }
      return true;
    }

    if (objectId === 'prop_amplifier_monolith') {
      if (this.ampTuned || GameState.getInstance().hasCrystal('crystal_03_amethyst')) {
        audio.playToneAlignmentSweep(741);
        bus.emit('camera:move_to_hotspot', { hotspotId: 'monolith' });
        bus.emit('ui:subtitle_changed', {
          text: 'The amplifier vibrates in steady 741 Hz Solfeggio resonance. Diaphragm decoupled and Memory Crystal 03 secured.'
        });
        return true;
      }
      audio.playTumblerClick();
      bus.emit('camera:move_to_hotspot', { hotspotId: 'monolith' });
      this.binauralScreen.open();
      return true;
    }

    if (objectId === 'prop_amp_stack' || objectId === 'prop_speaker_cone') {
      if (this.ampTuned) {
        audio.playToneAlignmentSweep(741);
        bus.emit('ui:subtitle_changed', {
          text: 'The amplifier vibrates in steady 741 Hz Solfeggio resonance. The speaker diaphragm is fully decoupled.'
        });
        return true;
      }

      this.freqIndex = (this.freqIndex + 1) % this.solfeggioFrequencies.length;
      this.currentToneFreq = this.solfeggioFrequencies[this.freqIndex];
      audio.playToneAlignmentSweep(this.currentToneFreq);

      bus.emit('ui:subtitle_changed', {
        text: `Amplifier Harmonic Sweep: ${this.currentToneFreq} Hz. Calibrate to 741 Hz Solfeggio to vibrate diaphragm.`
      });

      if (this.currentToneFreq === 741 && !this.ampTuned) {
        this.ampTuned = true;
        audio.playTumblerClick();
        if (this.crystalMesh) {
          this.crystalMesh.visible = true;
          if (this.crystalLight) this.crystalLight.visible = true;
        }
        bus.emit('puzzle:acoustic_null_achieved', {});
        bus.emit('ui:subtitle_changed', {
          text: 'Resonance achieved at 741 Hz! The speaker cone vibrates violently and unlatches the Amethyst crystal. Click the crystal to retrieve it.'
        });
      }
      return true;
    }

    if (objectId === 'crystal_03_amethyst') {
      if (!this.ampTuned) {
        bus.emit('ui:subtitle_changed', {
          text: 'The Amethyst Core crystal is held firmly in the clamped speaker diaphragm.'
        });
        return true;
      }

      if (!this.crystalCollected && !GameState.getInstance().hasCrystal('crystal_03_amethyst')) {
        this.crystalCollected = true;
        if (this.crystalMesh) this.crystalMesh.visible = false;
        if (this.crystalLight) this.crystalLight.visible = false;
        audio.playTumblerClick();
        bus.emit('puzzle:crystal_collected', {
          crystalId: 'crystal_03_amethyst' as CrystalId,
          label: 'Amethyst Core'
        });
        bus.emit('ui:subtitle_changed', {
          text: 'Memory Crystal 03 (Amethyst Core) secured. Return to the Central Hub to slot into the CRT Oscilloscope.'
        });
      }
      return true;
    }

    if (objectId === 'mesh_anechoic_baffles') {
      bus.emit('ui:subtitle_changed', {
        text: 'Dense polyurethane acoustic wedges line the chamber perimeter, absorbing all room reflections.'
      });
      return true;
    }

    if (objectId === 'mesh_audio_cables') {
      bus.emit('ui:subtitle_changed', {
        text: 'Heavy rubberized coaxial umbilical cables link the amplifier monolith directly to the Chladni plate.'
      });
      return true;
    }

    return false;
  }

  public update(_delta: number): void {
    if (this.crystalMesh && this.crystalMesh.visible) {
      this.crystalMesh.rotation.y += 0.02;
      this.crystalMesh.position.y = 1.4 + Math.sin(performance.now() * 0.003) * 0.03;
    }
  }
}
