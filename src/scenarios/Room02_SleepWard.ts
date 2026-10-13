import * as THREE from 'three';
import { RoomScenario, HotspotAnchor, CrystalId } from '../types';
import { EventBus } from '../core/EventBus';
import { GameState } from '../core/GameState';
import { AudioEngine } from '../audio/AudioEngine';
import { DispensaryCartScreen } from '../ui/screens/DispensaryCartScreen';
import { ClinicalClipboardScreen } from '../ui/screens/ClinicalClipboardScreen';

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
        position: new THREE.Vector3(3.8, 2.5, 4.8),
        target: new THREE.Vector3(0, 0.9, 0)
      }
    },
    cots: {
      id: 'cots',
      name: 'II. Observation Cots',
      position: new THREE.Vector3(-1.4, 1.0, 0),
      interactionPrompt: '[INSPECT PATIENT CLIPBOARDS]',
      cameraPreset: {
        name: 'cots',
        position: new THREE.Vector3(-0.6, 1.6, 1.2),
        target: new THREE.Vector3(-1.6, 0.8, -0.4)
      }
    },
    trolley: {
      id: 'trolley',
      name: 'III. Dispensary Cart',
      position: new THREE.Vector3(1.8, 1.1, -1.2),
      interactionPrompt: '[INSPECT DISPENSARY CART]',
      cameraPreset: {
        name: 'trolley',
        position: new THREE.Vector3(1.5, 1.6, 0.2),
        target: new THREE.Vector3(1.8, 0.95, -1.2)
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
      position: new THREE.Vector3(-2.8, 1.2, 4.5),
      interactionPrompt: '[EXAMINE: VACANT COT 104]',
      cameraPreset: {
        name: 'cot104',
        position: new THREE.Vector3(-1.2, 1.6, 5.2),
        target: new THREE.Vector3(-2.8, 1.1, 3.8)
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

    // Architectural Shell: Long Clinical Ward
    const matWall = new THREE.MeshStandardMaterial({ color: 0xedf0eb, roughness: 0.5 });
    const matTiles = new THREE.MeshStandardMaterial({ color: 0x243d33, roughness: 0.25 });
    const matMetal = new THREE.MeshStandardMaterial({ color: 0xd4d8db, metalness: 0.85, roughness: 0.2 });
    const matOlive = new THREE.MeshStandardMaterial({ color: 0x3d4a3b, roughness: 0.8 });
    const matBrass = new THREE.MeshStandardMaterial({ color: 0xc28833, metalness: 0.8, roughness: 0.3 });

    // Terrazzo Floor
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(12, 16), new THREE.MeshStandardMaterial({ color: 0xd0d5cd, roughness: 0.3 }));
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this.group.add(floor);

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

    const wallLeft = new THREE.Mesh(new THREE.BoxGeometry(0.2, 4.2, 16), matWall);
    wallLeft.position.set(-6, 2.1, 0);
    this.group.add(wallLeft);

    const wallRight = new THREE.Mesh(new THREE.BoxGeometry(0.2, 4.2, 16), matWall);
    wallRight.position.set(6, 2.1, 0);
    this.group.add(wallRight);

    // Green Wainscot along walls
    const wainscotL = new THREE.Mesh(new THREE.BoxGeometry(0.22, 1.6, 16), matTiles);
    wainscotL.position.set(-5.9, 0.8, 0);
    this.group.add(wainscotL);

    // 4 Military Observation Cots
    const cotZPositions = [-4.5, -1.5, 1.5, 4.5];
    cotZPositions.forEach((z, idx) => {
      const cotGroup = new THREE.Group();
      cotGroup.position.set(-2.8, 0, z);
      cotGroup.name = idx === 3 ? 'prop_cot_104' : `prop_cot_${101 + idx}`;

      // Steel frame
      const frame = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.45, 2.2), matMetal);
      frame.position.y = 0.25;
      frame.castShadow = true;
      cotGroup.add(frame);

      // Mattress
      const mattress = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.2, 2.1), matOlive);
      mattress.position.y = 0.55;
      cotGroup.add(mattress);

      // Headboard
      const headboard = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.65, 0.06), matMetal);
      headboard.position.set(0, 0.55, -1.05);
      headboard.name = idx === 3 ? 'prop_headboard_104' : `prop_headboard_${101 + idx}`;
      headboard.userData.isSubPart = true;
      headboard.castShadow = true;
      cotGroup.add(headboard);

      // Pillow
      const pillow = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.1, 0.4), new THREE.MeshStandardMaterial({ color: 0xedf0eb }));
      pillow.position.set(0, 0.68, -0.75);
      if (idx === 3) {
        pillow.rotation.y = 0.35;
        pillow.position.x = 0.15;
      }
      cotGroup.add(pillow);

      // Patient Clipboard at foot of bed
      const clipboardGroup = new THREE.Group();
      clipboardGroup.position.set(0, 0.66, 0.95);
      clipboardGroup.name = `prop_clipboard_${101 + idx}`;
      clipboardGroup.userData.isSubPart = true;

      const clipboardBoard = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.03, 0.46), matBrass);
      clipboardBoard.castShadow = true;
      clipboardGroup.add(clipboardBoard);

      const paperSheet = new THREE.Mesh(
        new THREE.PlaneGeometry(0.28, 0.40),
        new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.85 })
      );
      paperSheet.rotation.x = -Math.PI / 2;
      paperSheet.position.y = 0.016;
      clipboardGroup.add(paperSheet);

      const metalClip = new THREE.Mesh(
        new THREE.BoxGeometry(0.12, 0.02, 0.05),
        matMetal
      );
      metalClip.position.set(0, 0.02, -0.18);
      clipboardGroup.add(metalClip);

      cotGroup.add(clipboardGroup);

      this.group!.add(cotGroup);
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

    createUVSign('HE CANNOT STOP CRYING', '// THE CURE EXTRACTS THE TEARS', -4.5);
    createUVSign('THE VOCAL CORDS ARE RESISTANCE', '// CUT THEM TO CURE THEM', -1.5);
    createUVSign('PATIENT ZERO // INTAKE ID: 104', '[ NITROUS ] - [ BROMIDE ] - [ VALERIAN ]', 4.5, '#fbbf24');
    
    // Chemical symbols on headboard of 104 (facing into ward down cot)
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
    const hcMesh = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.32), hcMat);
    hcMesh.position.set(-2.8, 1.25, 3.48);
    hcMesh.rotation.y = 0;
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
    this.crystalMesh.position.set(0, 1.08, 0);
    this.crystalMesh.name = 'crystal_01_quartz';
    this.crystalMesh.visible = this.trolleyUnlocked && !this.crystalCollected;
    trolleyGroup.add(this.crystalMesh);

    this.crystalLight = new THREE.PointLight(0xa5f3fc, 1.5, 3.0);
    this.crystalLight.position.set(0, 1.08, 0);
    this.crystalLight.visible = this.trolleyUnlocked && !this.crystalCollected;
    trolleyGroup.add(this.crystalLight);

    this.group.add(trolleyGroup);

    // Ward Partition Curtain Rails & Drapes between Cots (drawn back against wall)
    [-3.0, 0.0, 3.0].forEach((cz) => {
      const rail = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 3.6, 12), matMetal);
      rail.position.set(-4.0, 3.8, cz);
      rail.raycast = () => {};
      this.group!.add(rail);

      const curtain = new THREE.Mesh(new THREE.BoxGeometry(0.12, 2.4, 0.4), matOlive);
      curtain.position.set(-5.6, 2.5, cz);
      curtain.castShadow = true;
      curtain.raycast = () => {};
      this.group!.add(curtain);
    });

    // Bedside Vitals Stands next to Cots
    cotZPositions.forEach((z) => {
      const stand = new THREE.Mesh(
        new THREE.BoxGeometry(0.48, 0.65, 0.48),
        new THREE.MeshStandardMaterial({ color: 0xd4d8db, roughness: 0.4, metalness: 0.6 })
      );
      stand.position.set(-4.5, 0.325, z - 0.75);
      stand.castShadow = true;
      stand.raycast = () => {};
      this.group!.add(stand);
    });

    // Right-Wall Oxygen Valve Manifold & Conduits
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

    // Overhead Clinical Fluorescent Lights
    const light1 = new THREE.PointLight(0xf4f9f4, 1.2, 12);
    light1.position.set(0, 3.8, -3);
    this.group.add(light1);

    const light2 = new THREE.PointLight(0xf4f9f4, 1.2, 12);
    light2.position.set(0, 3.8, 3);
    this.group.add(light2);

    this.fluorescentLights = [light1, light2];

    // UV Blacklights (initialized dim)
    const uvLight1 = new THREE.PointLight(0x7c3aed, 0, 14);
    uvLight1.position.set(-2, 3.8, -2);
    this.group.add(uvLight1);

    const uvLight2 = new THREE.PointLight(0x6366f1, 0, 14);
    uvLight2.position.set(-2, 3.8, 2);
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
      this.fluorescentLights.forEach(l => { l.intensity = 0.05; });
      this.uvLights.forEach(l => { l.intensity = 3.5; });
      this.uvDecals.forEach(m => { (m.material as THREE.MeshBasicMaterial).opacity = 1.0; });
      EventBus.getInstance().emit('ui:subtitle_changed', {
        text: 'Surgical ultraviolet lamp engaged. Deep indigo blacklight reveals luminescent handwriting across the ward and glowing chemical formulas above Vacant Cot 104.'
      });
    } else {
      this.fluorescentLights.forEach(l => { l.intensity = 1.2; });
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
