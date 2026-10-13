import * as THREE from 'three';
import { RoomScenario, HotspotAnchor, CrystalId } from '../types';
import { EventBus } from '../core/EventBus';
import { GameState } from '../core/GameState';
import { AudioEngine } from '../audio/AudioEngine';
import { DispensaryCartScreen } from '../ui/screens/DispensaryCartScreen';
import { ClinicalClipboardScreen } from '../ui/screens/ClinicalClipboardScreen';
import { ProceduralTextures } from '../entities/ProceduralTextures';

export class Room02_SleepWard implements RoomScenario {
  public id = 'sleep_ward';
  public title = 'The Sleep Ward';
  public actTitle = 'ACT II • THE FIRST DESCENT';
  public roomCode = 'Observation Ward 02 • Subjects 101–103';
  public defaultHotspot = 'overview';

  public hotspots: Record<string, HotspotAnchor> = {
    overview: {
      id: 'overview',
      name: 'I. Ward Overview',
      position: new THREE.Vector3(0, 1.8, 4.2),
      interactionPrompt: 'Ward Overview',
      cameraPreset: {
        name: 'overview',
        position: new THREE.Vector3(2.2, 2.4, 6.2),
        target: new THREE.Vector3(0, 1.0, 0)
      }
    },
    cots: {
      id: 'cots',
      name: 'II. Observation Cots',
      position: new THREE.Vector3(-2.8, 1.0, 0),
      interactionPrompt: '[INSPECT PATIENT CLIPBOARDS]',
      cameraPreset: {
        name: 'cots',
        position: new THREE.Vector3(-1.0, 1.7, 0.5),
        target: new THREE.Vector3(-3.8, 0.9, 0)
      }
    },
    trolley: {
      id: 'trolley',
      name: 'III. Dispensary Cart',
      position: new THREE.Vector3(2.0, 1.1, -1.5),
      interactionPrompt: '[INSPECT DISPENSARY CART]',
      cameraPreset: {
        name: 'trolley',
        position: new THREE.Vector3(0.6, 1.6, -1.5),
        target: new THREE.Vector3(2.0, 0.95, -1.5)
      }
    },
    door: {
      id: 'door',
      name: 'IV. Hub Corridor',
      position: new THREE.Vector3(0, 1.8, 6.0),
      interactionPrompt: '[RETURN: CENTRAL HUB]',
      cameraPreset: {
        name: 'door',
        position: new THREE.Vector3(0, 1.8, 4.5),
        target: new THREE.Vector3(0, 1.8, 6.2)
      }
    },
    cot104: {
      id: 'cot104',
      name: 'V. Vacant Cot 104',
      position: new THREE.Vector3(-3.5, 1.1, 4.2),
      interactionPrompt: '[EXAMINE: VACANT COT 104]',
      cameraPreset: {
        name: 'cot104',
        position: new THREE.Vector3(-1.4, 1.6, 4.2),
        target: new THREE.Vector3(-4.5, 1.0, 4.2)
      }
    },
    door_portal_hydrotherapy: {
      id: 'door_portal_hydrotherapy',
      name: 'VI. Hydrotherapy Archway',
      position: new THREE.Vector3(0, 1.8, -7.0),
      interactionPrompt: '[ENTER: HYDROTHERAPY SUITE (SL4-03)]',
      cameraPreset: {
        name: 'door_portal_hydrotherapy',
        position: new THREE.Vector3(0, 1.8, -5.2),
        target: new THREE.Vector3(0, 1.8, -7.9)
      }
    }
  };

  private group: THREE.Group | null = null;
  private crystalMesh: THREE.Mesh | null = null;
  private crystalCollected: boolean = false;
  private shutterUnlocked: boolean = false;
  private trolleyUnlocked: boolean = false;
  private digits = [0, 0, 0];
  private digitMeshes: THREE.Mesh[] = [];

  private uvActive: boolean = false;
  private crystalLight: THREE.PointLight | null = null;
  private fluorescentLights: THREE.PointLight[] = [];
  private uvLights: THREE.PointLight[] = [];
  private trofferMat: THREE.MeshStandardMaterial | null = null;
  private uvTrofferMat: THREE.MeshStandardMaterial | null = null;
  private uvDecals: THREE.Mesh[] = [];
  private dispensaryScreen: DispensaryCartScreen;
  private clipboardScreen: ClinicalClipboardScreen;
  private unsubscribers: Array<() => void> = [];

  public constructor() {
    this.dispensaryScreen = new DispensaryCartScreen();
    this.clipboardScreen = new ClinicalClipboardScreen();
  }

  public async buildScene(_scene: THREE.Scene): Promise<THREE.Group> {
    this.group = new THREE.Group();

    const hasCrystal = GameState.getInstance().hasCrystal('crystal_01_quartz');
    if (hasCrystal) {
      this.shutterUnlocked = true;
      this.trolleyUnlocked = true;
      this.crystalCollected = true;
      this.digits = [1, 0, 4];
    } else if (this.trolleyUnlocked || this.dispensaryScreen.isCartUnlocked()) {
      this.shutterUnlocked = true;
      this.trolleyUnlocked = true;
      this.crystalCollected = false;
      this.digits = [1, 0, 4];
    } else if (this.shutterUnlocked) {
      this.trolleyUnlocked = false;
      this.crystalCollected = false;
      this.digits = [1, 0, 4];
    } else {
      this.shutterUnlocked = false;
      this.trolleyUnlocked = false;
      this.crystalCollected = false;
      this.digits = [0, 0, 0];
    }

    const unsub = EventBus.getInstance().on('puzzle:crystal_collected', (payload) => {
      if (payload.crystalId === 'crystal_01_quartz') {
        this.shutterUnlocked = true;
        this.trolleyUnlocked = true;
        this.crystalCollected = true;
        if (this.crystalMesh) {
          this.crystalMesh.visible = false;
        }
        if (this.crystalLight) {
          this.crystalLight.visible = false;
        }
        this.digits = [1, 0, 4];
        this.digitMeshes.forEach((mesh, idx) => {
          mesh.rotation.z = (Math.PI * 2 * this.digits[idx]) / 10;
        });
      }
    });
    this.unsubscribers.push(unsub);

    const unsubTrolley = EventBus.getInstance().on('puzzle:trolley_unlocked', () => {
      this.shutterUnlocked = true;
      this.trolleyUnlocked = true;
      this.digits = [1, 0, 4];
      if (this.crystalMesh && !this.crystalCollected) {
        this.crystalMesh.visible = true;
      }
      if (this.crystalLight && !this.crystalCollected) {
        this.crystalLight.visible = true;
      }
      this.digitMeshes.forEach((mesh, idx) => {
        mesh.rotation.z = (Math.PI * 2 * this.digits[idx]) / 10;
      });
    });
    this.unsubscribers.push(unsubTrolley);

    const unsubShutter = EventBus.getInstance().on('puzzle:shutter_unlocked', () => {
      this.shutterUnlocked = true;
      this.digits = [1, 0, 4];
      this.digitMeshes.forEach((mesh, idx) => {
        mesh.rotation.z = (Math.PI * 2 * this.digits[idx]) / 10;
      });
    });
    this.unsubscribers.push(unsubShutter);

    const unsubDigits = EventBus.getInstance().on('puzzle:shutter_digits_changed', ({ digits }) => {
      this.digits = [...digits];
      this.digitMeshes.forEach((mesh, idx) => {
        mesh.rotation.z = (Math.PI * 2 * this.digits[idx]) / 10;
      });
    });
    this.unsubscribers.push(unsubDigits);

    // Architectural Shell: Long Clinical Ward Materials
    const matWall = new THREE.MeshStandardMaterial({ color: 0xedf0eb, roughness: 0.55 });
    const greenTileData = ProceduralTextures.createCeramicGreenTiles();
    const matTiles = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: greenTileData.map,
      bumpMap: greenTileData.bumpMap,
      bumpScale: 0.04,
      roughness: 0.22,
      metalness: 0.05
    });
    const matMetal = new THREE.MeshStandardMaterial({ color: 0xd4d8db, metalness: 0.85, roughness: 0.2 });
    const matOlive = new THREE.MeshStandardMaterial({ color: 0x3d4a3b, roughness: 0.8 });
    const matBrass = new THREE.MeshStandardMaterial({ color: 0xc28833, metalness: 0.8, roughness: 0.3 });

    // Terrazzo Floor with authentic aggregate and brass joints
    const floorTex = ProceduralTextures.createTerrazzoFloor();
    floorTex.repeat.set(6, 8);
    const floorMat = new THREE.MeshStandardMaterial({
      map: floorTex,
      roughness: 0.28,
      metalness: 0.08
    });
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(12, 16), floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this.group.add(floor);

    // Floor Brass Expansion Joints Grid
    const jointMat = new THREE.MeshStandardMaterial({ color: 0xb59b72, metalness: 0.85, roughness: 0.25 });
    for (let jx = -4.0; jx <= 4.0; jx += 2.0) {
      const jointX = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.005, 16.0), jointMat);
      jointX.position.set(jx, 0.002, 0);
      jointX.raycast = () => {};
      this.group.add(jointX);
    }
    for (let jz = -6.0; jz <= 6.0; jz += 2.0) {
      const jointZ = new THREE.Mesh(new THREE.BoxGeometry(12.0, 0.005, 0.02), jointMat);
      jointZ.position.set(0, 0.002, jz);
      jointZ.raycast = () => {};
      this.group.add(jointZ);
    }

    // Sanitary Perimeter Cove Base
    const coveMat = new THREE.MeshStandardMaterial({ color: 0x1e3328, roughness: 0.3 });
    const coveL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.12, 16), coveMat);
    coveL.position.set(-5.96, 0.06, 0);
    coveL.raycast = () => {};
    this.group.add(coveL);
    const coveR = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.12, 16), coveMat);
    coveR.position.set(5.96, 0.06, 0);
    coveR.raycast = () => {};
    this.group.add(coveR);

    // Ceiling
    const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(12, 16), matWall);
    ceiling.position.y = 4.2;
    ceiling.rotation.x = Math.PI / 2;
    this.group.add(ceiling);

    // Walls
    const wallBack = new THREE.Mesh(new THREE.BoxGeometry(12, 4.2, 0.2), matWall);
    wallBack.position.set(0, 2.1, -8);
    this.group.add(wallBack);

    const wallFront = new THREE.Mesh(new THREE.BoxGeometry(12, 4.2, 0.2), matWall);
    wallFront.position.set(0, 2.1, 8);
    this.group.add(wallFront);

    // Return Door to Hub
    const returnDoor = new THREE.Mesh(new THREE.BoxGeometry(1.6, 3.0, 0.22), matMetal);
    returnDoor.position.set(0, 1.5, 7.9);
    returnDoor.name = 'door_return_hub';
    this.group.add(returnDoor);

    // Connecting Door to Hydrotherapy Suite (En-suite Archway)
    const hydroDoorGroup = new THREE.Group();
    hydroDoorGroup.position.set(0, 0, -7.9);
    hydroDoorGroup.name = 'group_door_portal_hydrotherapy';

    const hydroDoorFrame = new THREE.Mesh(new THREE.BoxGeometry(1.8, 3.2, 0.24), matTiles);
    hydroDoorFrame.position.set(0, 1.6, 0);
    hydroDoorFrame.raycast = () => {};
    hydroDoorFrame.userData.isSubPart = true;
    hydroDoorGroup.add(hydroDoorFrame);

    const hydroDoorPanel = new THREE.Mesh(new THREE.BoxGeometry(1.5, 2.9, 0.1), matMetal);
    hydroDoorPanel.position.set(0, 1.45, 0.14);
    hydroDoorPanel.name = 'door_portal_hydrotherapy';
    hydroDoorGroup.add(hydroDoorPanel);

    const hydroPlaque = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.16, 0.04), matBrass);
    hydroPlaque.position.set(0, 3.15, 0.14);
    hydroPlaque.name = 'plaque_hydrotherapy_suite';
    hydroPlaque.raycast = () => {};
    hydroPlaque.userData.isSubPart = true;
    hydroDoorGroup.add(hydroPlaque);

    this.group.add(hydroDoorGroup);

    const wallLeft = new THREE.Mesh(new THREE.BoxGeometry(0.2, 4.2, 16), matWall);
    wallLeft.position.set(-6, 2.1, 0);
    this.group.add(wallLeft);

    const wallRight = new THREE.Mesh(new THREE.BoxGeometry(0.2, 4.2, 16), matWall);
    wallRight.position.set(6, 2.1, 0);
    this.group.add(wallRight);

    // Green Wainscot along walls with top brass trim
    const wainscotL = new THREE.Mesh(new THREE.BoxGeometry(0.22, 1.6, 16), matTiles);
    wainscotL.position.set(-5.9, 0.8, 0);
    wainscotL.raycast = () => {};
    this.group.add(wainscotL);

    const wainscotR = new THREE.Mesh(new THREE.BoxGeometry(0.22, 1.6, 16), matTiles);
    wainscotR.position.set(5.9, 0.8, 0);
    wainscotR.raycast = () => {};
    this.group.add(wainscotR);

    const wainscotTrimL = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.04, 16), matBrass);
    wainscotTrimL.position.set(-5.9, 1.62, 0);
    wainscotTrimL.raycast = () => {};
    this.group.add(wainscotTrimL);

    const wainscotTrimR = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.04, 16), matBrass);
    wainscotTrimR.position.set(5.9, 1.62, 0);
    wainscotTrimR.raycast = () => {};
    this.group.add(wainscotTrimR);

    // Left Row: 4 Patient Observation Cots (101-104) Oriented Perpendicular to Wall (Facing Central Aisle)
    const leftCotZPositions = [-4.2, -1.5, 1.2, 4.2];
    leftCotZPositions.forEach((z, idx) => {
      const cotGroup = new THREE.Group();
      cotGroup.position.set(-3.9, 0, z);
      cotGroup.name = idx === 3 ? 'prop_cot_104' : `prop_cot_${101 + idx}`;

      // Tubular steel cot frame (elongated along X, facing center aisle)
      const frame = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.45, 1.1), matMetal);
      frame.position.y = 0.25;
      frame.castShadow = true;
      cotGroup.add(frame);

      // Hospital mattress with institutional olive vinyl cover
      const mattress = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.2, 1.05), matOlive);
      mattress.position.y = 0.55;
      cotGroup.add(mattress);

      // Steel headboard against left wall
      const headboard = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.65, 1.1), matMetal);
      headboard.position.set(-1.05, 0.55, 0);
      headboard.name = idx === 3 ? 'prop_headboard_104' : `prop_headboard_${101 + idx}`;
      headboard.userData.isSubPart = true;
      headboard.castShadow = true;
      cotGroup.add(headboard);

      // Headrest Pillow near headboard
      const pillow = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.1, 0.8), new THREE.MeshStandardMaterial({ color: 0xedf0eb }));
      pillow.position.set(-0.75, 0.68, 0);
      if (idx === 3) {
        pillow.rotation.y = 0.35;
        pillow.position.z = 0.15;
      }
      cotGroup.add(pillow);

      // Folded institutional wool blanket or rumpled unbuckled restraints for Cot 104
      if (idx !== 3) {
        const blanket = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.08, 1.04), new THREE.MeshStandardMaterial({ color: 0x4a5d4e, roughness: 0.9 }));
        blanket.position.set(0.5, 0.68, 0);
        blanket.raycast = () => {};
        cotGroup.add(blanket);
      } else {
        // Unbuckled leather restraints dangling off sides of vacant cot
        const leatherMat = new THREE.MeshStandardMaterial({ color: 0x3d2817, roughness: 0.7 });
        [-0.4, 0.2].forEach(rx => {
          const strap = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.35, 1.14), leatherMat);
          strap.position.set(rx, 0.48, 0);
          strap.raycast = () => {};
          cotGroup.add(strap);
        });
      }

      // Patient Clipboard at foot of bed (facing central aisle)
      const clipboardGroup = new THREE.Group();
      clipboardGroup.position.set(-2.86, 0.96, z);
      clipboardGroup.rotation.z = -0.18;
      clipboardGroup.name = `prop_clipboard_${101 + idx}`;
      clipboardGroup.userData.interactionPrompt = `[EXAMINE: PATIENT ${101 + idx} INTAKE CLIPBOARD]`;

      const clipboardBoard = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.03, 0.32), matBrass);
      clipboardBoard.castShadow = true;
      clipboardGroup.add(clipboardBoard);

      const paperSheet = new THREE.Mesh(
        new THREE.PlaneGeometry(0.40, 0.28),
        new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.85 })
      );
      paperSheet.rotation.x = -Math.PI / 2;
      paperSheet.position.y = 0.016;
      clipboardGroup.add(paperSheet);

      const metalClip = new THREE.Mesh(
        new THREE.BoxGeometry(0.05, 0.02, 0.12),
        matMetal
      );
      metalClip.position.set(0.18, 0.02, 0);
      clipboardGroup.add(metalClip);

      this.group!.add(clipboardGroup);
      this.group!.add(cotGroup);
    });

    // Right Row: 3 Observation Cots (105-107) Facing Inward (Leaves z = -1.5 for Dispensary Bay)
    const rightCotZPositions = [-4.2, 1.2, 4.2];
    rightCotZPositions.forEach((z, rIdx) => {
      const dormCotGroup = new THREE.Group();
      dormCotGroup.position.set(3.9, 0, z);
      dormCotGroup.name = `dorm_cot_${105 + rIdx}`;
      dormCotGroup.userData.isSubPart = true;
      dormCotGroup.raycast = () => {};

      const frame = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.45, 1.1), matMetal);
      frame.position.y = 0.25;
      frame.castShadow = true;
      frame.raycast = () => {};
      dormCotGroup.add(frame);

      const mattress = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.2, 1.05), matOlive);
      mattress.position.y = 0.55;
      mattress.raycast = () => {};
      dormCotGroup.add(mattress);

      const headboard = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.65, 1.1), matMetal);
      headboard.position.set(1.05, 0.55, 0);
      headboard.castShadow = true;
      headboard.raycast = () => {};
      dormCotGroup.add(headboard);

      const pillow = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.1, 0.8), new THREE.MeshStandardMaterial({ color: 0xedf0eb }));
      pillow.position.set(0.75, 0.68, 0);
      pillow.raycast = () => {};
      dormCotGroup.add(pillow);

      const blanket = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.08, 1.04), new THREE.MeshStandardMaterial({ color: 0x3d4a3b, roughness: 0.9 }));
      blanket.position.set(-0.5, 0.68, 0);
      blanket.raycast = () => {};
      dormCotGroup.add(blanket);

      this.group!.add(dormCotGroup);
    });

    // Surgical UV Lamp Wall Toggle
    const uvToggleGroup = new THREE.Group();
    uvToggleGroup.position.set(-5.88, 1.8, 6.2);
    uvToggleGroup.name = 'prop_uv_toggle';

    const switchPlate = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.35, 0.22), matMetal);
    switchPlate.castShadow = true;
    uvToggleGroup.add(switchPlate);

    const switchLever = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.08, 16), matBrass);
    switchLever.rotation.z = Math.PI / 3;
    switchLever.position.set(0.03, 0, 0);
    uvToggleGroup.add(switchLever);

    this.group.add(uvToggleGroup);

    // Glowing UV Stencil Texture on Tile Wall
    this.uvDecals = [];
    const createUVSign = (text1: string, text2: string | null, z: number, color: string = '#4ade80') => {
      const cvs = document.createElement('canvas');
      cvs.width = 512;
      cvs.height = 128;
      const c = cvs.getContext('2d')!;
      c.fillStyle = '#000000';
      c.fillRect(0, 0, 512, 128);
      c.fillStyle = color;
      c.font = '20px monospace';
      c.textAlign = 'center';
      c.fillText(text1, 256, 40);
      if (text2) c.fillText(text2, 256, 80);

      const tex = new THREE.CanvasTexture(cvs);
      const mat = new THREE.MeshBasicMaterial({
        map: tex, transparent: true, opacity: 0.0, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, depthWrite: false
      });
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(3, 0.75), mat);
      mesh.position.set(-5.88, 2.2, z);
      mesh.rotation.y = Math.PI / 2;
      this.group!.add(mesh);
      this.uvDecals.push(mesh);
      return mesh;
    };

    createUVSign('HE CANNOT STOP CRYING', '// THE CURE EXTRACTS THE TEARS', -4.2);
    createUVSign('THE VOCAL CORDS ARE RESISTANCE', '// CUT THEM TO CURE THEM', -1.5);
    createUVSign('PATIENT ZERO // INTAKE ID: 104', '[ NITROUS ] - [ BROMIDE ] - [ VALERIAN ]', 4.2, '#fbbf24');
    
    // Chemical symbols on headboard of Cot 104 (facing inward down bed toward aisle)
    const headboardCvs = document.createElement('canvas');
    headboardCvs.width = 512;
    headboardCvs.height = 128;
    const hc = headboardCvs.getContext('2d')!;
    hc.fillStyle = '#000000';
    hc.fillRect(0, 0, 512, 128);
    hc.fillStyle = '#fbbf24';
    hc.font = 'bold 24px monospace';
    hc.textAlign = 'center';
    hc.fillText('[ NITROUS ] - [ BROMIDE ] - [ VALERIAN ]', 256, 64);
    
    const hcTex = new THREE.CanvasTexture(headboardCvs);
    const hcMat = new THREE.MeshBasicMaterial({ map: hcTex, transparent: true, opacity: 0.0, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, depthWrite: false });
    const hcMesh = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 0.28), hcMat);
    hcMesh.position.set(-4.91, 0.85, 4.2);
    hcMesh.rotation.y = Math.PI / 2;
    this.group.add(hcMesh);
    this.uvDecals.push(hcMesh);

    // Articulated St. Jude Emergency Dispensary Trolley
    const trolleyGroup = new THREE.Group();
    trolleyGroup.position.set(1.8, 0, -1.2);
    trolleyGroup.name = 'prop_trolley';

    // 4 Tubular Vertical Posts & Casters
    [
      [-0.56, -0.36],
      [-0.56, 0.36],
      [0.56, -0.36],
      [0.56, 0.36]
    ].forEach(([px, pz]) => {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.92, 12), matMetal);
      post.position.set(px, 0.49, pz);
      post.castShadow = true;
      post.raycast = () => {};
      trolleyGroup.add(post);

      const wheelFork = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.04, 0.03), matMetal);
      wheelFork.position.set(px, 0.06, pz);
      wheelFork.raycast = () => {};
      trolleyGroup.add(wheelFork);

      const wheel = new THREE.Mesh(
        new THREE.CylinderGeometry(0.04, 0.04, 0.025, 16),
        new THREE.MeshStandardMaterial({ color: 0x111613, roughness: 0.8 })
      );
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(px, 0.04, pz);
      wheel.raycast = () => {};
      trolleyGroup.add(wheel);
    });

    // 3 Lipped Stainless Steel Shelves
    [0.12, 0.52, 0.92].forEach((sy) => {
      const shelf = new THREE.Mesh(new THREE.BoxGeometry(1.18, 0.03, 0.78), matMetal);
      shelf.position.y = sy;
      shelf.castShadow = true;
      shelf.receiveShadow = true;
      shelf.raycast = () => {};
      trolleyGroup.add(shelf);
    });

    // Rear Tubular Push Handle Bar
    const handleBar = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.74, 12), matMetal);
    handleBar.rotation.x = Math.PI / 2;
    handleBar.position.set(-0.62, 0.94, 0);
    handleBar.raycast = () => {};
    trolleyGroup.add(handleBar);

    // Combination Lock Tumbler Housing
    const trolleyCart = new THREE.Mesh(
      new THREE.BoxGeometry(0.68, 0.22, 0.16),
      new THREE.MeshStandardMaterial({ color: 0x3d4a41, metalness: 0.6, roughness: 0.35 })
    );
    trolleyCart.position.set(0, 0.74, 0.36);
    trolleyCart.name = 'prop_trolley_lock';
    trolleyCart.userData.isSubPart = true;
    trolleyCart.castShadow = true;
    trolleyGroup.add(trolleyCart);

    // 3 Rotary Tumbler Dials on lock face
    for (let i = 0; i < 3; i++) {
      const dial = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.03, 16), matBrass);
      dial.rotation.x = Math.PI / 2;
      dial.rotation.z = (Math.PI * 2 * this.digits[i]) / 10;
      dial.position.set(-0.2 + i * 0.2, 0.74, 0.45);
      dial.name = `prop_dial_${i}`;
      dial.userData.isSubPart = true;
      trolleyGroup.add(dial);
      this.digitMeshes.push(dial);
    }

    // Upright Stainless IV Drip Pole
    const ivPole = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 1.45, 12), matMetal);
    ivPole.position.set(-0.52, 1.25, -0.32);
    ivPole.castShadow = true;
    ivPole.raycast = () => {};
    trolleyGroup.add(ivPole);

    // IV Crossbar & 3 Glass Infusion Flasks
    const ivCross = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.015, 0.50), matMetal);
    ivCross.position.set(-0.52, 1.95, -0.32);
    ivCross.raycast = () => {};
    trolleyGroup.add(ivCross);

    const matFlaskGlass = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transmission: 0.85,
      roughness: 0.1,
      transparent: true,
      opacity: 0.8
    });
    [-0.20, 0, 0.20].forEach((fz, fi) => {
      const flask = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.18, 16), matFlaskGlass);
      flask.position.set(-0.52, 1.82, -0.32 + fz);
      flask.raycast = () => {};
      trolleyGroup.add(flask);

      const fluidColors = [0x10b981, 0xf59e0b, 0xef4444];
      const fluid = new THREE.Mesh(
        new THREE.CylinderGeometry(0.04, 0.04, 0.12, 12),
        new THREE.MeshStandardMaterial({ color: fluidColors[fi], roughness: 0.2 })
      );
      fluid.position.set(-0.52, 1.80, -0.32 + fz);
      fluid.raycast = () => {};
      trolleyGroup.add(fluid);
    });

    // Memory Crystal 01 (Prismatic Quartz)
    const crystalGeo = new THREE.OctahedronGeometry(0.12, 0);
    const crystalMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transmission: 0.9,
      opacity: 1,
      transparent: true,
      roughness: 0.05,
      ior: 1.54,
      emissive: 0x99ddff,
      emissiveIntensity: 0.35
    });
    this.crystalMesh = new THREE.Mesh(crystalGeo, crystalMat);
    this.crystalMesh.position.set(1.8, 1.08, -1.2);
    this.crystalMesh.name = 'crystal_01_quartz';
    this.crystalMesh.visible = this.trolleyUnlocked && !this.crystalCollected;
    this.group.add(this.crystalMesh);

    this.crystalLight = new THREE.PointLight(0xa5f3fc, 1.5, 3.0);
    this.crystalLight.position.set(1.8, 1.08, -1.2);
    this.crystalLight.visible = this.trolleyUnlocked && !this.crystalCollected;
    this.group.add(this.crystalLight);

    this.group.add(trolleyGroup);

    // Ward Partition Curtain Rails & Drapes between Cots (Left & Right Rows)
    [-2.85, 0.0, 2.7].forEach((cz) => {
      const railL = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 2.8, 12), matMetal);
      railL.position.set(-4.2, 3.6, cz);
      railL.rotation.z = Math.PI / 2;
      railL.raycast = () => {};
      this.group!.add(railL);

      const curtainL = new THREE.Mesh(new THREE.BoxGeometry(0.12, 2.6, 0.45), matOlive);
      curtainL.position.set(-5.6, 2.3, cz);
      curtainL.castShadow = true;
      curtainL.raycast = () => {};
      this.group!.add(curtainL);
    });

    [-2.85, 2.7].forEach((cz) => {
      const railR = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 2.8, 12), matMetal);
      railR.position.set(4.2, 3.6, cz);
      railR.rotation.z = Math.PI / 2;
      railR.raycast = () => {};
      this.group!.add(railR);

      const curtainR = new THREE.Mesh(new THREE.BoxGeometry(0.12, 2.6, 0.45), matOlive);
      curtainR.position.set(5.6, 2.3, cz);
      curtainR.castShadow = true;
      curtainR.raycast = () => {};
      this.group!.add(curtainR);
    });

    // Bedside Vitals Nightstands & Drug Lockers (Left Row)
    leftCotZPositions.forEach((z) => {
      const standGroup = new THREE.Group();
      standGroup.position.set(-4.95, 0.35, z + 0.85);
      standGroup.raycast = () => {};

      const standBody = new THREE.Mesh(
        new THREE.BoxGeometry(0.48, 0.70, 0.44),
        new THREE.MeshStandardMaterial({ color: 0xd4d8db, roughness: 0.35, metalness: 0.65 })
      );
      standBody.castShadow = true;
      standBody.raycast = () => {};
      standGroup.add(standBody);

      const pullHandle = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.04, 0.14), matBrass);
      pullHandle.position.set(0.25, 0.12, 0);
      pullHandle.raycast = () => {};
      standGroup.add(pullHandle);

      this.group!.add(standGroup);
    });

    // Bedside Vitals Nightstands (Right Row)
    rightCotZPositions.forEach((z) => {
      const standGroup = new THREE.Group();
      standGroup.position.set(4.95, 0.35, z + 0.85);
      standGroup.raycast = () => {};

      const standBody = new THREE.Mesh(
        new THREE.BoxGeometry(0.48, 0.70, 0.44),
        new THREE.MeshStandardMaterial({ color: 0xd4d8db, roughness: 0.35, metalness: 0.65 })
      );
      standBody.castShadow = true;
      standBody.raycast = () => {};
      standGroup.add(standBody);

      const pullHandle = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.04, 0.14), matBrass);
      pullHandle.position.set(-0.25, 0.12, 0);
      pullHandle.raycast = () => {};
      standGroup.add(pullHandle);

      this.group!.add(standGroup);
    });

    // Wall-Mounted Medical Gas Service Panels (Oxygen & Vacuum behind each headboard)
    leftCotZPositions.forEach((z) => {
      const gasPanel = new THREE.Group();
      gasPanel.position.set(-5.88, 1.85, z);
      gasPanel.raycast = () => {};

      const panelBox = new THREE.Mesh(
        new THREE.BoxGeometry(0.06, 0.42, 0.75),
        new THREE.MeshStandardMaterial({ color: 0x233229, roughness: 0.5 })
      );
      panelBox.raycast = () => {};
      gasPanel.add(panelBox);

      const o2Port = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.04, 12), new THREE.MeshStandardMaterial({ color: 0x10b981, roughness: 0.4 }));
      o2Port.rotation.z = Math.PI / 2;
      o2Port.position.set(0.04, 0.06, -0.2);
      o2Port.raycast = () => {};
      gasPanel.add(o2Port);

      const vacPort = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.04, 12), new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.4 }));
      vacPort.rotation.z = Math.PI / 2;
      vacPort.position.set(0.04, 0.06, 0.2);
      vacPort.raycast = () => {};
      gasPanel.add(vacPort);

      this.group!.add(gasPanel);
    });

    rightCotZPositions.forEach((z) => {
      const gasPanel = new THREE.Group();
      gasPanel.position.set(5.88, 1.85, z);
      gasPanel.raycast = () => {};

      const panelBox = new THREE.Mesh(
        new THREE.BoxGeometry(0.06, 0.42, 0.75),
        new THREE.MeshStandardMaterial({ color: 0x233229, roughness: 0.5 })
      );
      panelBox.raycast = () => {};
      gasPanel.add(panelBox);

      const o2Port = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.04, 12), new THREE.MeshStandardMaterial({ color: 0x10b981, roughness: 0.4 }));
      o2Port.rotation.z = Math.PI / 2;
      o2Port.position.set(-0.04, 0.06, -0.2);
      o2Port.raycast = () => {};
      gasPanel.add(o2Port);

      const vacPort = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.04, 12), new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.4 }));
      vacPort.rotation.z = Math.PI / 2;
      vacPort.position.set(-0.04, 0.06, 0.2);
      vacPort.raycast = () => {};
      gasPanel.add(vacPort);

      this.group!.add(gasPanel);
    });

    // Cast-Iron Steam Radiators at Ward End Walls
    const matCastIron = new THREE.MeshStandardMaterial({ color: 0x2b2d2f, roughness: 0.75 });
    [[-3.8, -7.75], [3.8, -7.75], [-3.8, 7.75], [3.8, 7.75]].forEach(([rx, rz]) => {
      const radGroup = new THREE.Group();
      radGroup.position.set(rx, 0.55, rz);
      radGroup.raycast = () => {};

      const radBody = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.9, 0.2), matCastIron);
      radBody.castShadow = true;
      radBody.raycast = () => {};
      radGroup.add(radBody);

      for (let rib = -0.5; rib <= 0.5; rib += 0.12) {
        const fin = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.86, 0.24), matCastIron);
        fin.position.x = rib;
        fin.raycast = () => {};
        radGroup.add(fin);
      }

      this.group!.add(radGroup);
    });

    // Overhead HVAC Supply Ventilation Ducts along ceiling margins
    const matDuct = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.5, roughness: 0.4 });
    [-4.8, 4.8].forEach((dx) => {
      const duct = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.35, 15.0), matDuct);
      duct.position.set(dx, 4.0, 0);
      duct.raycast = () => {};
      this.group!.add(duct);
    });

    // Right-Wall Main Oxygen Valve Manifold & Conduits
    const o2Manifold = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 0.45, 1.8),
      new THREE.MeshStandardMaterial({ color: 0x22352b, roughness: 0.5 })
    );
    o2Manifold.position.set(5.88, 1.6, 0);
    o2Manifold.raycast = () => {};
    this.group.add(o2Manifold);

    [-0.6, -0.2, 0.2, 0.6].forEach((mz) => {
      const valveGauge = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.04, 16), matBrass);
      valveGauge.rotation.z = Math.PI / 2;
      valveGauge.position.set(5.82, 1.6, mz);
      valveGauge.raycast = () => {};
      this.group!.add(valveGauge);
    });

    // Dr. Thorne's Somnology Duty Roster & Clipboard (Physician Station)
    const thorneStationGroup = new THREE.Group();
    thorneStationGroup.position.set(5.88, 1.65, -1.8);
    thorneStationGroup.rotation.y = -Math.PI / 2;
    thorneStationGroup.name = 'prop_thorne_clipboard';

    const thorneBoard = new THREE.Mesh(
      new THREE.BoxGeometry(0.38, 0.54, 0.03),
      new THREE.MeshStandardMaterial({ color: 0x5a3d28, roughness: 0.7 })
    );
    thorneBoard.castShadow = true;
    thorneBoard.userData.isSubPart = true;
    thorneStationGroup.add(thorneBoard);

    const thornePaper = new THREE.Mesh(
      new THREE.PlaneGeometry(0.32, 0.46),
      new THREE.MeshStandardMaterial({ color: 0xf5f0e1, roughness: 0.85 })
    );
    thornePaper.position.z = 0.018;
    thornePaper.userData.isSubPart = true;
    thorneStationGroup.add(thornePaper);

    const thorneClip = new THREE.Mesh(
      new THREE.BoxGeometry(0.16, 0.04, 0.04),
      matBrass
    );
    thorneClip.position.set(0, 0.23, 0.025);
    thorneClip.userData.isSubPart = true;
    thorneStationGroup.add(thorneClip);

    this.group.add(thorneStationGroup);

    // Continuous Overhead Linear Fluorescent Troffers ("Line Lights")
    this.trofferMat = new THREE.MeshStandardMaterial({
      color: 0xedf4ee,
      emissive: 0xd6edd9,
      emissiveIntensity: 1.8,
      roughness: 0.3
    });

    this.uvTrofferMat = new THREE.MeshStandardMaterial({
      color: 0x221338,
      emissive: 0x1a102a,
      emissiveIntensity: 0.1,
      roughness: 0.5
    });

    [-1.8, 1.8].forEach((lx) => {
      const trofferGroup = new THREE.Group();
      trofferGroup.position.set(lx, 3.82, 0);
      trofferGroup.raycast = () => {};

      // Cold-rolled steel housing channel
      const channel = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.14, 12.6), matMetal);
      channel.raycast = () => {};
      trofferGroup.add(channel);

      // Ribbed acrylic diffuser lens (main linear fluorescent light)
      const diffuser = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.03, 12.4), this.trofferMat!);
      diffuser.position.y = -0.06;
      diffuser.raycast = () => {};
      trofferGroup.add(diffuser);

      // UV tube channel
      const uvTube = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.02, 12.4), this.uvTrofferMat!);
      uvTube.position.y = -0.08;
      uvTube.raycast = () => {};
      trofferGroup.add(uvTube);

      // Suspension down-rods to ceiling (y = 4.2)
      [-4.0, 0.0, 4.0].forEach((rz) => {
        const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.38, 8), matMetal);
        rod.position.set(0, 0.22, rz);
        rod.raycast = () => {};
        trofferGroup.add(rod);
      });

      this.group!.add(trofferGroup);
    });

    // 4 Soft Central Fill Lights along the central ceiling spline
    this.fluorescentLights = [];
    [-4.5, -1.5, 1.5, 4.5].forEach((fz) => {
      const fillLight = new THREE.PointLight(0xf2f7f2, 1.0, 10);
      fillLight.position.set(0, 3.7, fz);
      this.group!.add(fillLight);
      this.fluorescentLights.push(fillLight);
    });

    // UV Blacklights (initialized dim)
    const uvLight1 = new THREE.PointLight(0x7c3aed, 0, 14);
    uvLight1.position.set(-1.5, 3.7, -2.0);
    this.group.add(uvLight1);

    const uvLight2 = new THREE.PointLight(0x6366f1, 0, 14);
    uvLight2.position.set(-1.5, 3.7, 2.0);
    this.group.add(uvLight2);

    this.uvLights = [uvLight1, uvLight2];

    // Re-entry state restoration
    if (this.trolleyUnlocked) {
      this.digits = [1, 0, 4];
      this.digitMeshes.forEach((mesh, idx) => {
        mesh.rotation.z = this.digits[idx] * ((Math.PI * 2) / 10);
      });
      if (this.crystalMesh && !this.crystalCollected) {
        this.crystalMesh.visible = true;
      }
    }

    return this.group;
  }

  private toggleUvMode(): void {
    this.uvActive = !this.uvActive;
    const audio = AudioEngine.getInstance();
    audio.playTumblerClick();

    if (this.uvActive) {
      if (this.trofferMat) {
        this.trofferMat.emissive.setHex(0x181e1a);
        this.trofferMat.emissiveIntensity = 0.2;
      }
      if (this.uvTrofferMat) {
        this.uvTrofferMat.emissive.setHex(0x7c3aed);
        this.uvTrofferMat.emissiveIntensity = 2.5;
      }
      this.fluorescentLights.forEach(l => { l.intensity = 0.06; });
      this.uvLights.forEach(l => { l.intensity = 3.6; });
      this.uvDecals.forEach(m => { (m.material as THREE.MeshBasicMaterial).opacity = 1.0; });
      EventBus.getInstance().emit('ui:subtitle_changed', {
        text: 'Surgical ultraviolet lamp engaged. Deep indigo blacklight reveals luminescent handwriting across the ward and glowing chemical formulas above Vacant Cot 104.'
      });
    } else {
      if (this.trofferMat) {
        this.trofferMat.emissive.setHex(0xd6edd9);
        this.trofferMat.emissiveIntensity = 1.8;
      }
      if (this.uvTrofferMat) {
        this.uvTrofferMat.emissive.setHex(0x1a102a);
        this.uvTrofferMat.emissiveIntensity = 0.1;
      }
      this.fluorescentLights.forEach(l => { l.intensity = 1.0; });
      this.uvLights.forEach(l => { l.intensity = 0.0; });
      this.uvDecals.forEach(m => { (m.material as THREE.MeshBasicMaterial).opacity = 0.0; });
      EventBus.getInstance().emit('ui:subtitle_changed', {
        text: 'Ultraviolet lamp disengaged. Cold white fluorescent light restored.'
      });
    }
  }

  public teardown(scene: THREE.Scene): void {
    this.unsubscribers.forEach(u => u());
    this.unsubscribers = [];
    this.dispensaryScreen.teardown();
    this.clipboardScreen.teardown();
    if (this.trofferMat) {
      this.trofferMat.dispose();
      this.trofferMat = null;
    }
    if (this.uvTrofferMat) {
      this.uvTrofferMat.dispose();
      this.uvTrofferMat = null;
    }
    if (this.crystalLight) {
      this.crystalLight.dispose();
      this.crystalLight = null;
    }
    if (this.group) {
      scene.remove(this.group);
      this.group = null;
    }
    this.digitMeshes = [];
    this.crystalMesh = null;
    this.uvDecals = [];
    this.fluorescentLights = [];
    this.uvLights = [];
  }

  public onObjectClick(objectId: string): boolean {
    const bus = EventBus.getInstance();
    const audio = AudioEngine.getInstance();

    if (objectId === 'door_return_hub') {
      bus.emit('scenario:switch_room', { targetRoomId: 'room_04', doorThresholdId: 'door_portal_sleep_ward' });
      return true;
    }

    if (objectId === 'door_portal_hydrotherapy') {
      if (!this.crystalCollected && !GameState.getInstance().hasCrystal('crystal_01_quartz')) {
        bus.emit('camera:move_to_hotspot', { hotspotId: 'trolley' });
        bus.emit('ui:subtitle_changed', {
          text: 'The Hydrotherapy Suite airlock is locked. Recover and collect Memory Crystal 01 from the dispensary cart first.'
        });
        return true;
      }
      audio.playPneumaticHiss();
      bus.emit('ui:subtitle_changed', {
        text: 'Traversing en-suite corridor to Hydrotherapy Suite (SL4-03-HYD).'
      });
      bus.emit('scenario:switch_room', { targetRoomId: 'hydrotherapy', doorThresholdId: 'door_portal_hydrotherapy' });
      return true;
    }

    if (objectId === 'prop_thorne_clipboard') {
      audio.playTumblerClick();
      bus.emit('camera:move_to_hotspot', { hotspotId: 'trolley' });
      bus.emit('ui:subtitle_changed', {
        text: 'Form 108-STAFF [Dr. A. Thorne]: Chief Somnologist shift log & chemical titration protocols.'
      });
      bus.emit('ui:open_staff_roster', { staffId: 'thorne' });
      return true;
    }

    if (objectId === 'prop_uv_toggle') {
      this.toggleUvMode();
      return true;
    }

    if (objectId === 'prop_trolley' || objectId === 'prop_trolley_lock') {
      if (this.crystalCollected || GameState.getInstance().hasCrystal('crystal_01_quartz')) {
        bus.emit('camera:move_to_hotspot', { hotspotId: 'trolley' });
        bus.emit('ui:subtitle_changed', {
          text: 'Dispensary Cart is unlocked [ 1 - 0 - 4 ]. The stainless tray is unsealed and empty. Memory Crystal 01 has been secured.'
        });
        return true;
      }
      if (this.trolleyUnlocked) {
        bus.emit('camera:move_to_hotspot', { hotspotId: 'trolley' });
        bus.emit('ui:subtitle_changed', {
          text: 'The dispensary drawer is open, exposing the floating Prismatic Quartz crystal. Click the crystal to retrieve it.'
        });
        return true;
      }
      audio.playTumblerClick();
      bus.emit('camera:move_to_hotspot', { hotspotId: 'trolley' });
      this.dispensaryScreen.setShutterDigits(this.digits as [number, number, number]);
      this.dispensaryScreen.open();
      if (!this.shutterUnlocked) {
        bus.emit('ui:subtitle_changed', {
          text: `Dispensary Cart outer security shutter is locked [ ${this.digits.join(' - ')} ]. Align the 3 tumblers to Patient 104's intake ID to expose the infusion console.`
        });
      } else {
        bus.emit('ui:subtitle_changed', {
          text: 'Security shutter retracted [ 1 - 0 - 4 ]. Calibrate peristaltic infusion (68 BPM) and sedative triad.'
        });
      }
      return true;
    }

    if (objectId === 'prop_cot_104' || objectId === 'prop_headboard_104') {
      audio.playTumblerClick();
      bus.emit('camera:move_to_hotspot', { hotspotId: 'cot104' });
      if (this.uvActive) {
        bus.emit('ui:subtitle_changed', {
          text: 'Under ultraviolet illumination, frantic glowing amber text on Cot 104 reads: [ NITROUS ] - [ BROMIDE ] - [ VALERIAN ].'
        });
      } else {
        bus.emit('ui:subtitle_changed', {
          text: 'Cot 104 restraints are unbuckled and linens rumpled. Faint scratch marks are visible on the headboard, illegible under standard fluorescent light.'
        });
      }
      return true;
    }

    if (objectId.startsWith('prop_clipboard_')) {
      audio.playTumblerClick();
      const subjectNum = objectId.split('_')[2];
      this.clipboardScreen.open(subjectNum);
      if (subjectNum === '101') {
        bus.emit('ui:subtitle_changed', {
          text: 'Chart 101 [Subject 101]: "Limbic sedation holding. Resting cardiac tempo: 68 BPM. Infusion rate must match cardiac rhythm to prevent neuro-shock."'
        });
      } else if (subjectNum === '102') {
        bus.emit('ui:subtitle_changed', {
          text: 'Chart 102 [Subject 102]: "Vocal desensitization complete. Mnemonic quartz crystal secured inside dispensary cart."'
        });
      } else if (subjectNum === '103') {
        bus.emit('ui:subtitle_changed', {
          text: 'Chart 103 [Subject 103]: "Mobile dispensary cart is double-locked. Outer security shutter is keyed to the 3-digit intake ID of the transferred subject [Vacant Cot 104]."'
        });
      } else if (subjectNum === '104') {
        bus.emit('ui:subtitle_changed', {
          text: 'Chart 104 [Subject 104 • VACANT]: "Cot vacant. Subject transferred to Sterile Reception (Room 04). Patient Intake ID: 104. Chemical sedation regimen logged under diagnostic UV illumination."'
        });
      }
      return true;
    }

    if (objectId.startsWith('prop_dial_')) {
      if (this.trolleyUnlocked) {
        bus.emit('ui:subtitle_changed', {
          text: 'Dispensary Cart is fully unlatched [ 1 - 0 - 4 ]. The tray is extended.'
        });
        return true;
      }

      audio.playTumblerClick();
      const dialIdx = parseInt(objectId.split('_')[2], 10);
      if (isNaN(dialIdx) || dialIdx < 0 || dialIdx > 2) return true;

      this.digits[dialIdx] = (this.digits[dialIdx] + 1) % 10;

      // Animate dial rotation
      if (this.digitMeshes[dialIdx]) {
        this.digitMeshes[dialIdx].rotation.z += (Math.PI * 2) / 10;
      }

      this.dispensaryScreen.setShutterDigits(this.digits as [number, number, number]);

      // Check if 1-0-4 aligns
      if (this.digits[0] === 1 && this.digits[1] === 0 && this.digits[2] === 4) {
        if (!this.shutterUnlocked) {
          this.shutterUnlocked = true;
          audio.playPneumaticHiss();
          bus.emit('ui:subtitle_changed', {
            text: 'Tumblers align: [ 1 - 0 - 4 ]. Outer security shutter unlatches, exposing the electronic Sedative Calibrator.'
          });
        }
      } else {
        this.shutterUnlocked = false;
        bus.emit('ui:subtitle_changed', {
          text: `Dispensary Cart Tumblers: [ ${this.digits[0]} - ${this.digits[1]} - ${this.digits[2]} ] (Shutter Locked)`
        });
      }
      return true;
    }

    if (objectId === 'crystal_01_quartz') {
      if (!this.crystalCollected && !GameState.getInstance().hasCrystal('crystal_01_quartz')) {
        if (!this.trolleyUnlocked && this.digits[0] === 1 && this.digits[1] === 0 && this.digits[2] === 4) {
          this.trolleyUnlocked = true;
        }
        if (!this.trolleyUnlocked) {
          bus.emit('ui:subtitle_changed', {
            text: 'The Prismatic Quartz is sealed inside the locked dispensary drawer.'
          });
          return true;
        }
        this.crystalCollected = true;
        if (this.crystalMesh) this.crystalMesh.visible = false;
        if (this.crystalLight) this.crystalLight.visible = false;
        audio.playTumblerClick();
        bus.emit('puzzle:crystal_collected', {
          crystalId: 'crystal_01_quartz' as CrystalId,
          label: 'Prismatic Quartz'
        });
        bus.emit('ui:subtitle_changed', {
          text: 'Memory Crystal 01 (Prismatic Quartz) secured. Return to the Central Hub to slot into the CRT Oscilloscope.'
        });
      }
      return true;
    }

    return false;
  }

  public update(_delta: number): void {
    if (this.crystalMesh && this.crystalMesh.visible) {
      this.crystalMesh.rotation.y += 0.02;
      this.crystalMesh.position.y = 1.08 + Math.sin(performance.now() * 0.003) * 0.03;
      if (this.crystalLight) {
        this.crystalLight.position.y = this.crystalMesh.position.y;
        this.crystalLight.intensity = 1.2 + Math.sin(performance.now() * 0.005) * 0.3;
      }
    }
  }
}
