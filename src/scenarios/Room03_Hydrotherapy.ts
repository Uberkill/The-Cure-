import * as THREE from 'three';
import { RoomScenario, HotspotAnchor, CrystalId } from '../types';
import { EventBus } from '../core/EventBus';
import { GameState } from '../core/GameState';
import { AudioEngine } from '../audio/AudioEngine';
import { HydraulicManifoldScreen } from '../ui/screens/HydraulicManifoldScreen';
import { ProceduralTextures } from '../entities/ProceduralTextures';
import { LightRigManager } from '../rendering/LightRigManager';

export class Room03_Hydrotherapy implements RoomScenario {
  public id = 'hydrotherapy';
  public title = 'The Hydrotherapy Room';
  public actTitle = 'ACT III • THE SECOND DESCENT';
  public roomCode = 'Immersion Facility 03 • Sub-Waterline Basin';
  public defaultHotspot = 'overview';

  public hotspots: Record<string, HotspotAnchor> = {
    overview: {
      id: 'overview',
      name: 'I. Basin Overview',
      position: new THREE.Vector3(0, 2.0, 4.5),
      interactionPrompt: 'Immersion Basin Overview',
      cameraPreset: {
        name: 'overview',
        position: new THREE.Vector3(3.6, 2.8, 5.0),
        target: new THREE.Vector3(0, 0.8, 0)
      }
    },
    tubs: {
      id: 'tubs',
      name: 'II. Immersion Tubs',
      position: new THREE.Vector3(-1.8, 1.2, 0),
      interactionPrompt: '[INSPECT PORCELAIN TUBS]',
      cameraPreset: {
        name: 'tubs',
        position: new THREE.Vector3(-0.8, 1.8, 1.5),
        target: new THREE.Vector3(-2.0, 0.7, 0)
      }
    },
    manifold: {
      id: 'manifold',
      name: 'III. Pressure Manifold',
      position: new THREE.Vector3(2.2, 1.5, -2.0),
      interactionPrompt: '[INSPECT PRESSURE MANIFOLD]',
      cameraPreset: {
        name: 'manifold',
        position: new THREE.Vector3(1.2, 1.6, -1.0),
        target: new THREE.Vector3(2.4, 1.5, -2.0)
      }
    },
    door: {
      id: 'door',
      name: 'IV. Hub Corridor',
      position: new THREE.Vector3(0, 1.8, 6.0),
      interactionPrompt: '[RETURN: CENTRAL HUB]',
      cameraPreset: {
        name: 'door',
        position: new THREE.Vector3(0, 1.8, 4.2),
        target: new THREE.Vector3(0, 1.8, 6.2)
      }
    }
  };

  private group: THREE.Group | null = null;
  private crystalMesh: THREE.Mesh | null = null;
  private crystalLight: THREE.PointLight | null = null;
  private crystalCollected: boolean = false;
  private manifoldBalanced: boolean = false;
  private valveRotations = [0, 0, 0];
  private valveMeshes: THREE.Mesh[] = [];
  private drainLidMesh: THREE.Mesh | null = null;
  private manifoldScreen: HydraulicManifoldScreen;
  private unsubscribers: Array<() => void> = [];

  public constructor() {
    this.manifoldScreen = new HydraulicManifoldScreen();
  }

  public async buildScene(_scene: THREE.Scene): Promise<THREE.Group> {
    this.group = new THREE.Group();

    const hasCrystal = GameState.getInstance().hasCrystal('crystal_02_bronze');
    if (hasCrystal || this.manifoldScreen.isManifoldBalanced()) {
      this.manifoldBalanced = true;
      this.crystalCollected = hasCrystal;
      this.valveRotations = [2, 1, 3];
    } else {
      this.manifoldBalanced = false;
      this.crystalCollected = false;
      this.valveRotations = [0, 0, 0];
    }

    const unsubManifold = EventBus.getInstance().on('puzzle:manifold_balanced', () => {
      this.manifoldBalanced = true;
      if (this.drainLidMesh) {
        this.drainLidMesh.position.x = 0.25;
      }
      if (this.crystalMesh && !this.crystalCollected) {
        this.crystalMesh.visible = true;
        if (this.crystalLight) this.crystalLight.visible = true;
      }
      this.valveRotations = [2, 1, 3];
      this.valveMeshes.forEach((mesh, idx) => {
        mesh.rotation.z = this.valveRotations[idx] * (Math.PI / 2);
      });
    });
    this.unsubscribers.push(unsubManifold);

    const unsub = EventBus.getInstance().on('puzzle:crystal_collected', (payload) => {
      if (payload.crystalId === 'crystal_02_bronze') {
        this.manifoldBalanced = true;
        this.crystalCollected = true;
        if (this.drainLidMesh) {
          this.drainLidMesh.position.x = 0.25;
        }
        if (this.crystalMesh) {
          this.crystalMesh.visible = false;
        }
        if (this.crystalLight) {
          this.crystalLight.visible = false;
        }
        this.valveRotations = [2, 1, 3];
        this.valveMeshes.forEach((mesh, idx) => {
          mesh.rotation.z = this.valveRotations[idx] * (Math.PI / 2);
        });
      }
    });
    this.unsubscribers.push(unsub);

    const matHexTile = new THREE.MeshStandardMaterial({ color: 0x2e4e4a, roughness: 0.2, metalness: 0.1 });
    const matWall = new THREE.MeshStandardMaterial({ color: 0xccd5cc, roughness: 0.6 });
    const matPorcelain = new THREE.MeshStandardMaterial({ color: 0xf5f8f5, roughness: 0.15, metalness: 0.05 });
    const matChrome = new THREE.MeshStandardMaterial({ color: 0xe2e6e9, metalness: 0.9, roughness: 0.15 });
    const matBrass = new THREE.MeshStandardMaterial({ color: 0xc28833, metalness: 0.85, roughness: 0.25 });
    const matCastIron = new THREE.MeshStandardMaterial({ color: 0x1f2421, metalness: 0.6, roughness: 0.7 });

    const greenTileData = ProceduralTextures.createCeramicGreenTiles();
    const matWetTiles = new THREE.MeshStandardMaterial({
      color: 0x8fe3d4,
      map: greenTileData.map,
      bumpMap: greenTileData.bumpMap,
      bumpScale: 0.04,
      roughness: 0.16,
      metalness: 0.10
    });

    const matWater = new THREE.MeshPhysicalMaterial({
      color: 0x38bdf8,
      transmission: 0.85,
      roughness: 0.05,
      transparent: true,
      opacity: 0.75
    });
    const matGlass = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transmission: 0.9,
      roughness: 0.08,
      transparent: true,
      opacity: 0.85
    });
    const matWood = new THREE.MeshStandardMaterial({ color: 0x785135, roughness: 0.8 });
    const matCanvas = new THREE.MeshStandardMaterial({ color: 0x5a6351, roughness: 0.9 });

    // Wet Hexagonal Turquoise Floor
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(14, 14), matHexTile);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this.group.add(floor);

    // Ceiling & Upper Walls
    const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(14, 14), matWall);
    ceiling.position.y = 4.5;
    ceiling.rotation.x = Math.PI / 2;
    this.group.add(ceiling);

    const wallBack = new THREE.Mesh(new THREE.BoxGeometry(14, 4.5, 0.2), matWall);
    wallBack.position.set(0, 2.25, -7);
    this.group.add(wallBack);

    const wallFront = new THREE.Mesh(new THREE.BoxGeometry(14, 4.5, 0.2), matWall);
    wallFront.position.set(0, 2.25, 7);
    this.group.add(wallFront);

    // Tiled Lower Wainscot Walls (Subterranean glazed bath walls)
    const wainscotBack = new THREE.Mesh(new THREE.BoxGeometry(14, 2.6, 0.22), matWetTiles);
    wainscotBack.position.set(0, 1.3, -6.9);
    wainscotBack.raycast = () => {};
    this.group.add(wainscotBack);

    const wainscotTrimBack = new THREE.Mesh(new THREE.BoxGeometry(14, 0.04, 0.24), matBrass);
    wainscotTrimBack.position.set(0, 2.62, -6.9);
    wainscotTrimBack.raycast = () => {};
    this.group.add(wainscotTrimBack);

    const wainscotLeft = new THREE.Mesh(new THREE.BoxGeometry(0.22, 2.6, 14), matWetTiles);
    wainscotLeft.position.set(-6.9, 1.3, 0);
    wainscotLeft.raycast = () => {};
    this.group.add(wainscotLeft);

    const wainscotTrimLeft = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.04, 14), matBrass);
    wainscotTrimLeft.position.set(-6.9, 2.62, 0);
    wainscotTrimLeft.raycast = () => {};
    this.group.add(wainscotTrimLeft);

    const wainscotRight = new THREE.Mesh(new THREE.BoxGeometry(0.22, 2.6, 14), matWetTiles);
    wainscotRight.position.set(6.9, 1.3, 0);
    wainscotRight.raycast = () => {};
    this.group.add(wainscotRight);

    const wainscotTrimRight = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.04, 14), matBrass);
    wainscotTrimRight.position.set(6.9, 2.62, 0);
    wainscotTrimRight.raycast = () => {};
    this.group.add(wainscotTrimRight);

    // Front wainscot flanking return doorway (X = -0.9 to 0.9 open)
    const wainscotFrontL = new THREE.Mesh(new THREE.BoxGeometry(5.9, 2.6, 0.22), matWetTiles);
    wainscotFrontL.position.set(-3.95, 1.3, 6.9);
    wainscotFrontL.raycast = () => {};
    this.group.add(wainscotFrontL);

    const wainscotTrimFrontL = new THREE.Mesh(new THREE.BoxGeometry(5.9, 0.04, 0.24), matBrass);
    wainscotTrimFrontL.position.set(-3.95, 2.62, 6.9);
    wainscotTrimFrontL.raycast = () => {};
    this.group.add(wainscotTrimFrontL);

    const wainscotFrontR = new THREE.Mesh(new THREE.BoxGeometry(5.9, 2.6, 0.22), matWetTiles);
    wainscotFrontR.position.set(3.95, 1.3, 6.9);
    wainscotFrontR.raycast = () => {};
    this.group.add(wainscotFrontR);

    const wainscotTrimFrontR = new THREE.Mesh(new THREE.BoxGeometry(5.9, 0.04, 0.24), matBrass);
    wainscotTrimFrontR.position.set(3.95, 2.62, 6.9);
    wainscotTrimFrontR.raycast = () => {};
    this.group.add(wainscotTrimFrontR);

    // Sanitary Perimeter Cove Baseboard
    const coveMat = new THREE.MeshStandardMaterial({ color: 0x18241e, roughness: 0.25 });
    const coveL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.12, 14), coveMat);
    coveL.position.set(-6.96, 0.06, 0);
    coveL.raycast = () => {};
    this.group.add(coveL);
    const coveR = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.12, 14), coveMat);
    coveR.position.set(6.96, 0.06, 0);
    coveR.raycast = () => {};
    this.group.add(coveR);

    // Return Door to Central Concourse / Sleep Ward
    const returnDoorGroup = new THREE.Group();
    returnDoorGroup.position.set(0, 0, 6.9);

    const returnDoorFrame = new THREE.Mesh(new THREE.BoxGeometry(1.8, 3.2, 0.24), matHexTile);
    returnDoorFrame.position.set(0, 1.6, 0);
    returnDoorFrame.raycast = () => {};
    returnDoorFrame.userData.isSubPart = true;
    returnDoorGroup.add(returnDoorFrame);

    const returnDoor = new THREE.Mesh(new THREE.BoxGeometry(1.5, 2.9, 0.1), matChrome);
    returnDoor.position.set(0, 1.45, -0.14);
    returnDoor.name = 'door_return_hub';
    returnDoorGroup.add(returnDoor);

    const returnPlaque = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.16, 0.04), matBrass);
    returnPlaque.position.set(0, 3.15, -0.14);
    returnPlaque.name = 'plaque_sleep_ward_concourse';
    returnPlaque.raycast = () => {};
    returnPlaque.userData.isSubPart = true;
    returnDoorGroup.add(returnPlaque);

    this.group.add(returnDoorGroup);

    const wallLeft = new THREE.Mesh(new THREE.BoxGeometry(0.2, 4.5, 14), matWall);
    wallLeft.position.set(-7, 2.25, 0);
    this.group.add(wallLeft);

    const wallRight = new THREE.Mesh(new THREE.BoxGeometry(0.2, 4.5, 14), matWall);
    wallRight.position.set(7, 2.25, 0);
    this.group.add(wallRight);

    // 2 Deep Porcelain Immersion Tubs with Inner Cavities & Water Meshes
    [-2.2, 0.8].forEach((x, idx) => {
      const tubGroup = new THREE.Group();
      tubGroup.position.set(x, 0, 0);
      tubGroup.name = `prop_tub_${idx + 1}`;

      // Hollow porcelain tub assembly (base floor and 4 rim walls framing open interior cavity)
      const tubFloor = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.15, 2.4), matPorcelain);
      tubFloor.position.y = 0.075;
      tubFloor.castShadow = true;
      tubFloor.receiveShadow = true;
      tubGroup.add(tubFloor);

      // Contact shadow plane under tub
      const tubAO = new THREE.Mesh(
        new THREE.PlaneGeometry(1.6, 2.6),
        new THREE.MeshBasicMaterial({ color: 0x141816, transparent: true, opacity: 0.32, depthWrite: false })
      );
      tubAO.rotation.x = -Math.PI / 2;
      tubAO.position.set(0, 0.003, 0);
      tubAO.raycast = () => {};
      tubGroup.add(tubAO);

      const tubWallLeft = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.75, 2.4), matPorcelain);
      tubWallLeft.position.set(-0.645, 0.525, 0);
      tubWallLeft.castShadow = true;
      tubGroup.add(tubWallLeft);

      const tubWallRight = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.75, 2.4), matPorcelain);
      tubWallRight.position.set(0.645, 0.525, 0);
      tubWallRight.castShadow = true;
      tubGroup.add(tubWallRight);

      const tubWallBack = new THREE.Mesh(new THREE.BoxGeometry(1.18, 0.75, 0.11), matPorcelain);
      tubWallBack.position.set(0, 0.525, -1.145);
      tubWallBack.castShadow = true;
      tubGroup.add(tubWallBack);

      const tubWallFront = new THREE.Mesh(new THREE.BoxGeometry(1.18, 0.75, 0.11), matPorcelain);
      tubWallFront.position.set(0, 0.525, 1.145);
      tubWallFront.castShadow = true;
      tubGroup.add(tubWallFront);

      // Recessed porcelain basin bottom liner
      const basinInterior = new THREE.Mesh(
        new THREE.BoxGeometry(1.18, 0.02, 2.18),
        new THREE.MeshStandardMaterial({ color: 0xe2e8e2, roughness: 0.1, metalness: 0.05 })
      );
      basinInterior.position.y = 0.16;
      basinInterior.raycast = () => {};
      tubGroup.add(basinInterior);

      // Translucent Turquoise Water Surface
      const waterMesh = new THREE.Mesh(new THREE.PlaneGeometry(1.14, 2.14), matWater);
      waterMesh.rotation.x = -Math.PI / 2;
      waterMesh.position.y = 0.68;
      waterMesh.raycast = () => {};
      tubGroup.add(waterMesh);

      // Canvas Restraint Straps spanning across rim
      [-0.55, 0.55].forEach((sz) => {
        const strap = new THREE.Mesh(new THREE.BoxGeometry(1.26, 0.02, 0.08), matCanvas);
        strap.position.set(0, 0.91, sz);
        strap.castShadow = true;
        strap.raycast = () => {};
        tubGroup.add(strap);

        const buckle = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.03, 0.10), matBrass);
        buckle.position.set(0, 0.92, sz);
        buckle.raycast = () => {};
        tubGroup.add(buckle);
      });

      // Overhead Steel Winch & Cable Rigging
      const winchCable = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 2.5, 8), matChrome);
      winchCable.position.set(0, 2.2, 0);
      winchCable.raycast = () => {};
      tubGroup.add(winchCable);

      const winchHarness = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.08, 0.4), matChrome);
      winchHarness.position.set(0, 1.0, 0);
      winchHarness.raycast = () => {};
      tubGroup.add(winchHarness);

      // Dual Chrome Mixer Tap
      const tap = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.35, 12), matChrome);
      tap.position.set(0, 0.95, -1.05);
      tap.raycast = () => {};
      tubGroup.add(tap);

      [-0.1, 0.1].forEach((hx) => {
        const handle = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.02, 0.06), matChrome);
        handle.position.set(hx, 1.1, -1.05);
        handle.raycast = () => {};
        tubGroup.add(handle);
      });

      // Wooden Duckboard Floor Walkway beside tub
      const duckboardGroup = new THREE.Group();
      duckboardGroup.position.set(0.9, 0.02, 0);
      duckboardGroup.raycast = () => {};

      for (let s = -1.0; s <= 1.0; s += 0.22) {
        const slat = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.025, 0.16), matWood);
        slat.position.z = s;
        slat.castShadow = true;
        slat.receiveShadow = true;
        slat.raycast = () => {};
        duckboardGroup.add(slat);
      }
      tubGroup.add(duckboardGroup);

      this.group!.add(tubGroup);
    });

    // Articulated Wall Piping Manifold with Borosilicate Sight Columns
    const manifoldGroup = new THREE.Group();
    manifoldGroup.position.set(4.0, 1.5, -2.0);
    manifoldGroup.name = 'prop_manifold';

    const pipeMain = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 2.8, 16), matChrome);
    pipeMain.rotation.z = Math.PI / 2;
    manifoldGroup.add(pipeMain);

    // Vertical Supply Pipes to Ceiling and Floor
    [-1.2, 1.2].forEach((px) => {
      const vPipe = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 4.0, 16), matChrome);
      vPipe.position.set(px, 0.5, 0);
      vPipe.raycast = () => {};
      manifoldGroup.add(vPipe);
    });

    // Main Brass Pressure Gauge
    const gauge = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.06, 24), matBrass);
    gauge.rotation.x = Math.PI / 2;
    gauge.position.set(0, 0.35, 0.08);
    manifoldGroup.add(gauge);

    // 3 Valves & Vertical Sight Glass Columns
    [-0.8, 0, 0.8].forEach((xOffset, i) => {
      const valveWheel = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.03, 8, 24), matBrass);
      valveWheel.position.set(xOffset, 0, 0.15);
      valveWheel.name = `prop_valve_${i}`;
      valveWheel.userData.isSubPart = true;
      manifoldGroup.add(valveWheel);
      this.valveMeshes.push(valveWheel);

      // Vertical Borosilicate Glass Sight Column
      const sightTube = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.52, 16), matGlass);
      sightTube.position.set(xOffset, -0.42, 0.10);
      sightTube.raycast = () => {};
      manifoldGroup.add(sightTube);

      [-0.24, 0.24].forEach((my) => {
        const ring = new THREE.Mesh(new THREE.CylinderGeometry(0.052, 0.052, 0.04, 16), matBrass);
        ring.position.set(xOffset, -0.42 + my, 0.10);
        ring.raycast = () => {};
        manifoldGroup.add(ring);
      });

      const floatBall = new THREE.Mesh(
        new THREE.SphereGeometry(0.032, 12, 12),
        new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.3 })
      );
      floatBall.position.set(xOffset, -0.42 + (i === 1 ? 0.08 : -0.06), 0.10);
      floatBall.raycast = () => {};
      manifoldGroup.add(floatBall);
    });

    this.group.add(manifoldGroup);

    // Floor Drain with Hatch
    const drainGroup = new THREE.Group();
    drainGroup.position.set(1.5, 0.02, 1.8);
    drainGroup.name = 'prop_drain';

    const drainRim = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.04, 24), matCastIron);
    drainGroup.add(drainRim);

    this.drainLidMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.03, 24), matCastIron);
    this.drainLidMesh.position.y = 0.02;
    this.drainLidMesh.name = 'prop_drain_lid';
    this.drainLidMesh.userData.isSubPart = true;
    drainGroup.add(this.drainLidMesh);

    // Memory Crystal 02 (Oxidized Bronze / Amber Tint)
    const crystalGeo = new THREE.DodecahedronGeometry(0.12, 0);
    const crystalMat = new THREE.MeshPhysicalMaterial({
      color: 0xc28833,
      transmission: 0.4,
      roughness: 0.25,
      metalness: 0.65,
      emissive: 0x7a4c10,
      emissiveIntensity: 0.35
    });
    this.crystalMesh = new THREE.Mesh(crystalGeo, crystalMat);
    this.crystalMesh.position.set(1.5, 0.25, 1.8);
    this.crystalMesh.name = 'crystal_02_bronze';
    this.crystalMesh.visible = false;

    this.crystalLight = new THREE.PointLight(0xf59e0b, 1.5, 3);
    this.crystalLight.position.set(0, 0, 0);
    this.crystalLight.visible = false;
    this.crystalMesh.add(this.crystalLight);

    this.group.add(this.crystalMesh);

    this.group.add(drainGroup);

    // Washroom luminaires and spotlights
    const fixturesGroup = new THREE.Group();
    fixturesGroup.name = 'group_hydro_light_fixtures';

    // 1. Dual Suspended Porcelain Washroom Pendant Fixtures (tubs and manifold)
    [
      { x: -0.7, z: 0.0 },
      { x: 0.0, z: -5.8 }
    ].forEach((pos) => {
      const pendantGroup = new THREE.Group();
      pendantGroup.position.set(pos.x, 0, pos.z);
      pendantGroup.raycast = () => {};

      // Ceiling canopy collar
      const canopy = new THREE.Mesh(new THREE.CylinderGeometry(0.10, 0.10, 0.04, 16), matCastIron);
      canopy.position.set(0, 4.48, 0);
      canopy.raycast = () => {};
      pendantGroup.add(canopy);

      // Galvanized pipe drop stem (y = 4.5 down to y = 3.65)
      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.85, 12), matChrome);
      stem.position.set(0, 4.05, 0);
      stem.raycast = () => {};
      pendantGroup.add(stem);

      // Porcelain conical shade (y = 3.52)
      const shade = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.46, 0.26, 24), matPorcelain);
      shade.position.set(0, 3.52, 0);
      shade.raycast = () => {};
      pendantGroup.add(shade);

      // Machined brass rim bezel
      const rim = new THREE.Mesh(new THREE.TorusGeometry(0.46, 0.014, 12, 24), matBrass);
      rim.rotation.x = Math.PI / 2;
      rim.position.set(0, 3.39, 0);
      rim.raycast = () => {};
      pendantGroup.add(rim);

      // Emissive diffuser lens
      const lens = new THREE.Mesh(
        new THREE.CircleGeometry(0.44, 24),
        new THREE.MeshBasicMaterial({ color: 0xffffff })
      );
      lens.rotation.x = Math.PI / 2;
      lens.position.set(0, 3.40, 0);
      lens.raycast = () => {};
      pendantGroup.add(lens);

      fixturesGroup.add(pendantGroup);
    });

    // 2. Four Marine / Sanatorium Vapor-Tight Cage Wall Fixtures
    const cageLampMat = new THREE.MeshStandardMaterial({
      color: 0xfffaeb,
      emissive: 0xfef08a,
      emissiveIntensity: 0.55,
      roughness: 0.2
    });

    const cageWallConfigs = [
      { x: -3.5, y: 2.4, z: -6.82, rotY: 0 },
      { x: 3.5, y: 2.4, z: -6.82, rotY: 0 },
      { x: -6.82, y: 2.4, z: 0, rotY: Math.PI / 2 },
      { x: 6.82, y: 2.4, z: 0, rotY: -Math.PI / 2 }
    ];

    cageWallConfigs.forEach((cfg) => {
      const cageGroup = new THREE.Group();
      cageGroup.position.set(cfg.x, cfg.y, cfg.z);
      cageGroup.rotation.y = cfg.rotY;
      cageGroup.raycast = () => {};

      // Cast-iron wall base plate
      const basePlate = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.03, 16), matCastIron);
      basePlate.rotation.x = Math.PI / 2;
      basePlate.raycast = () => {};
      cageGroup.add(basePlate);

      // Protective ribbed glass globe
      const globe = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.12, 16), cageLampMat);
      globe.position.z = 0.07;
      globe.rotation.x = Math.PI / 2;
      globe.raycast = () => {};
      cageGroup.add(globe);

      // Brass wire guard rings
      const cageGuard = new THREE.Mesh(new THREE.TorusGeometry(0.055, 0.007, 8, 16), matBrass);
      cageGuard.position.z = 0.07;
      cageGuard.raycast = () => {};
      cageGroup.add(cageGuard);

      fixturesGroup.add(cageGroup);
    });

    this.group.add(fixturesGroup);

    // Anchored Cold Surgical Spotlight (originating inside the central tub pendant)
    const coldSpot = new THREE.SpotLight(0xa5d6cb, 2.2, 12, Math.PI / 3.4, 0.40, 1.1);
    coldSpot.position.set(-0.7, 3.39, 0);
    coldSpot.target.position.set(-0.7, 0.6, 0);
    this.group.add(coldSpot.target);
    coldSpot.castShadow = true;
    this.group.add(coldSpot);

    LightRigManager.getInstance().register({
      id: 'room03_tub_cold_spot',
      name: 'Hydrotherapy Tub Pendant Spot',
      room: 'hydrotherapy',
      type: 'spot',
      light: coldSpot,
      target: coldSpot.target,
      initialPosition: coldSpot.position.clone(),
      initialTarget: coldSpot.target.position.clone()
    });

    // Secondary Warm Fill over the Hydraulic Manifold
    const manifoldFill = new THREE.PointLight(0xa5d6cb, 1.1, 9);
    manifoldFill.position.set(0, 3.35, -5.8);
    this.group.add(manifoldFill);

    LightRigManager.getInstance().register({
      id: 'room03_manifold_fill',
      name: 'Hydrotherapy Manifold Fill',
      room: 'hydrotherapy',
      type: 'point',
      light: manifoldFill,
      initialPosition: manifoldFill.position.clone()
    });

    // Re-entry state restoration
    if (this.manifoldBalanced) {
      if (this.drainLidMesh) {
        this.drainLidMesh.position.x = 0.25;
      }
      if (this.crystalMesh && !this.crystalCollected) {
        this.crystalMesh.visible = true;
        if (this.crystalLight) this.crystalLight.visible = true;
      }
      this.valveRotations = [2, 1, 3];
      this.valveMeshes.forEach((mesh, idx) => {
        mesh.rotation.z = this.valveRotations[idx] * (Math.PI / 2);
      });
    }

    return this.group;
  }

  public teardown(scene: THREE.Scene): void {
    LightRigManager.getInstance().clear('hydrotherapy');
    this.unsubscribers.forEach(u => u());
    this.unsubscribers = [];
    this.manifoldScreen.teardown();
    if (this.crystalLight) {
      this.crystalLight.dispose();
      this.crystalLight = null;
    }
    if (this.group) {
      scene.remove(this.group);
      this.group = null;
    }
    this.valveMeshes = [];
    this.crystalMesh = null;
    this.drainLidMesh = null;
  }

  private calculatePressure(): number {
    const diff0 = (this.valveRotations[0] - 2 + 4) % 4;
    const diff1 = (this.valveRotations[1] - 1 + 4) % 4;
    const diff2 = (this.valveRotations[2] - 3 + 4) % 4;
    return diff0 * 25 + diff1 * 35 + diff2 * 15;
  }

  public onObjectClick(objectId: string): boolean {
    const bus = EventBus.getInstance();
    const audio = AudioEngine.getInstance();

    if (objectId === 'door_return_hub') {
      audio.playDoorHeavy();
      bus.emit('scenario:switch_room', { targetRoomId: 'room_04', doorThresholdId: 'door_portal_hydrotherapy' });
      return true;
    }

    if (objectId === 'door_portal_sleep_ward') {
      audio.playDoorLatch();
      bus.emit('scenario:switch_room', { targetRoomId: 'sleep_ward', doorThresholdId: 'door_portal_sleep_ward' });
      return true;
    }

    if (objectId === 'prop_drain' || objectId === 'prop_drain_lid') {
      audio.playDoorLatch();
      if (this.manifoldScreen.getState().manifoldBalanced || GameState.getInstance().hasCrystal('crystal_02_bronze')) {
        bus.emit('ui:subtitle_changed', {
          text: 'The heavy cast-iron floor drain hatch is unsealed. The sump chamber beneath is drained.'
        });
      } else {
        bus.emit('camera:move_to_hotspot', { hotspotId: 'manifold' });
        bus.emit('ui:subtitle_changed', {
          text: 'The floor drain hatch is clamped shut by hydraulic pressure. Balance the manifold to 0.0 PSI on the wall terminal.'
        });
      }
      return true;
    }

    if (objectId === 'prop_tub_1') {
      audio.playWaterDrip();
      bus.emit('ui:subtitle_changed', {
        text: 'Tub 1 Stencil: "Intake Valve A calibration: Half-turn (Pos 2). Relief Valve B: Quarter-turn (Pos 1)."'
      });
      return true;
    }

    if (objectId === 'prop_tub_2' || objectId.startsWith('prop_tub_')) {
      audio.playWaterDrip();
      bus.emit('ui:subtitle_changed', {
        text: 'Tub 2 Stencil: "Drain Valve C calibration: Three-quarter turn (Pos 3). Target: 0.0 PSI for drain release."'
      });
      return true;
    }

    if (objectId === 'prop_manifold') {
      if (this.manifoldBalanced || GameState.getInstance().hasCrystal('crystal_02_bronze')) {
        bus.emit('camera:move_to_hotspot', { hotspotId: 'manifold' });
        bus.emit('ui:subtitle_changed', {
          text: 'Hydrostatic manifold locked at 0.0 PSI. Floor drain hatch unsealed and Memory Crystal 02 secured.'
        });
        return true;
      }
      audio.playTumblerClick();
      bus.emit('camera:move_to_hotspot', { hotspotId: 'manifold' });
      this.manifoldScreen.open();
      return true;
    }

    if (objectId.startsWith('prop_valve_')) {
      if (this.manifoldBalanced) {
        bus.emit('ui:subtitle_changed', {
          text: 'The manifold is locked at 0.0 PSI. The floor drain hatch is already open.'
        });
        return true;
      }

      const valveIdx = parseInt(objectId.split('_')[2], 10);
      if (isNaN(valveIdx) || valveIdx < 0 || valveIdx > 2) return true;

      this.valveRotations[valveIdx] = (this.valveRotations[valveIdx] + 1) % 4;
      if (this.valveMeshes[valveIdx]) {
        this.valveMeshes[valveIdx].rotation.z += Math.PI / 2;
      }
      audio.playTumblerClick();

      const pressure = this.calculatePressure();
      const valveNames = ['A (Intake)', 'B (Relief)', 'C (Drain)'];
      bus.emit('ui:subtitle_changed', {
        text: `Valve ${valveNames[valveIdx]} rotated. Manifold Pressure: ${pressure} PSI.`
      });

      if (pressure === 0 && !this.manifoldBalanced) {
        this.manifoldBalanced = true;
        audio.playPneumaticHiss();
        if (this.drainLidMesh) {
          this.drainLidMesh.position.x = 0.25;
        }
        if (this.crystalMesh) {
          this.crystalMesh.visible = true;
          if (this.crystalLight) this.crystalLight.visible = true;
        }
        bus.emit('puzzle:manifold_balanced', {});
        bus.emit('ui:subtitle_changed', {
          text: 'Pressure reaches 0.0 PSI. The floor drain hatch pops open, exposing an Oxidized Bronze crystal. Click the crystal to retrieve it.'
        });
      }
      return true;
    }

    if (objectId === 'crystal_02_bronze') {
      if (!this.manifoldBalanced) {
        bus.emit('ui:subtitle_changed', {
          text: 'The Oxidized Bronze crystal is sealed beneath the locked hydrostatic floor drain.'
        });
        return true;
      }

      if (!this.crystalCollected && !GameState.getInstance().hasCrystal('crystal_02_bronze')) {
        this.crystalCollected = true;
        if (this.crystalMesh) this.crystalMesh.visible = false;
        if (this.crystalLight) this.crystalLight.visible = false;
        audio.playGlassClink();
        bus.emit('puzzle:crystal_collected', {
          crystalId: 'crystal_02_bronze' as CrystalId,
          label: 'Drained Bronze'
        });
        bus.emit('ui:subtitle_changed', {
          text: 'Memory Crystal 02 (Drained Bronze) secured. Return to the Central Hub to slot into the CRT Oscilloscope.'
        });
      }
      return true;
    }

    return false;
  }

  public update(_delta: number): void {
    if (this.crystalMesh && this.crystalMesh.visible) {
      this.crystalMesh.rotation.y += 0.02;
      this.crystalMesh.position.y = 0.25 + Math.sin(performance.now() * 0.003) * 0.03;
    }
  }
}
