import * as THREE from 'three';
import { RoomScenario, HotspotAnchor, CrystalId } from '../types';
import { EventBus } from '../core/EventBus';
import { AudioEngine } from '../audio/AudioEngine';

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
  private crystalCollected: boolean = false;
  private manifoldBalanced: boolean = false;
  private valveRotations = [0, 0, 0];
  private valveMeshes: THREE.Mesh[] = [];
  private drainLidMesh: THREE.Mesh | null = null;

  public async buildScene(_scene: THREE.Scene): Promise<THREE.Group> {
    this.group = new THREE.Group();

    const matHexTile = new THREE.MeshStandardMaterial({ color: 0x2e4e4a, roughness: 0.2, metalness: 0.1 });
    const matWall = new THREE.MeshStandardMaterial({ color: 0xccd5cc, roughness: 0.6 });
    const matPorcelain = new THREE.MeshStandardMaterial({ color: 0xf5f8f5, roughness: 0.15, metalness: 0.05 });
    const matChrome = new THREE.MeshStandardMaterial({ color: 0xe2e6e9, metalness: 0.9, roughness: 0.15 });
    const matBrass = new THREE.MeshStandardMaterial({ color: 0xc28833, metalness: 0.85, roughness: 0.25 });
    const matCastIron = new THREE.MeshStandardMaterial({ color: 0x1f2421, metalness: 0.6, roughness: 0.7 });

    // Wet Hexagonal Turquoise Floor
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(14, 14), matHexTile);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this.group.add(floor);

    // Ceiling & Walls
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

    // Return Door
    const returnDoor = new THREE.Mesh(new THREE.BoxGeometry(1.6, 3.0, 0.22), matChrome);
    returnDoor.position.set(0, 1.5, 6.9);
    returnDoor.name = 'door_return_hub';
    this.group.add(returnDoor);

    const wallLeft = new THREE.Mesh(new THREE.BoxGeometry(0.2, 4.5, 14), matWall);
    wallLeft.position.set(-7, 2.25, 0);
    this.group.add(wallLeft);

    const wallRight = new THREE.Mesh(new THREE.BoxGeometry(0.2, 4.5, 14), matWall);
    wallRight.position.set(7, 2.25, 0);
    this.group.add(wallRight);

    // 2 Deep Porcelain Immersion Tubs
    [-2.2, 0.8].forEach((x, idx) => {
      const tubGroup = new THREE.Group();
      tubGroup.position.set(x, 0, 0);
      tubGroup.name = `prop_tub_${idx + 1}`;

      // Outer body
      const tubBody = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.9, 2.4), matPorcelain);
      tubBody.position.y = 0.45;
      tubBody.castShadow = true;
      tubGroup.add(tubBody);

      // Overhead steel winch & cable
      const winchCable = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 2.5, 8), matChrome);
      winchCable.position.set(0, 2.2, 0);
      tubGroup.add(winchCable);

      const winchHarness = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.08, 0.4), matChrome);
      winchHarness.position.set(0, 1.0, 0);
      tubGroup.add(winchHarness);

      // Chrome dry tap
      const tap = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.35, 12), matChrome);
      tap.position.set(0, 0.95, -1.0);
      tubGroup.add(tap);

      this.group!.add(tubGroup);
    });

    // Wall Piping Manifold with 3 Brass Valves
    const manifoldGroup = new THREE.Group();
    manifoldGroup.position.set(4.0, 1.5, -2.0);
    manifoldGroup.name = 'prop_manifold';

    const pipeMain = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 2.8, 16), matChrome);
    pipeMain.rotation.z = Math.PI / 2;
    manifoldGroup.add(pipeMain);

    // Gauge
    const gauge = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.06, 24), matBrass);
    gauge.rotation.x = Math.PI / 2;
    gauge.position.set(0, 0.3, 0.08);
    manifoldGroup.add(gauge);

    // 3 Valves
    [-0.8, 0, 0.8].forEach((xOffset, i) => {
      const valveWheel = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.03, 8, 24), matBrass);
      valveWheel.position.set(xOffset, 0, 0.15);
      valveWheel.name = `prop_valve_${i}`;
      manifoldGroup.add(valveWheel);
      this.valveMeshes.push(valveWheel);
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
    this.group.add(this.crystalMesh);

    this.group.add(drainGroup);

    // Lighting: Cold Surgical Spotlight
    const coldSpot = new THREE.SpotLight(0xa5d6cb, 1.8, 14, Math.PI / 4, 0.4);
    coldSpot.position.set(0, 4.2, 0);
    coldSpot.castShadow = true;
    this.group.add(coldSpot);

    // Re-entry state restoration
    if (this.manifoldBalanced) {
      if (this.drainLidMesh) {
        this.drainLidMesh.position.x += 0.25;
      }
      if (this.crystalMesh && !this.crystalCollected) {
        this.crystalMesh.visible = true;
      }
      this.valveRotations = [2, 1, 3];
      this.valveMeshes.forEach((mesh, idx) => {
        mesh.rotation.z = this.valveRotations[idx] * (Math.PI / 2);
      });
    }

    return this.group;
  }

  public teardown(scene: THREE.Scene): void {
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
      bus.emit('scenario:switch_room', { targetRoomId: 'room_04' });
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
      audio.playTumblerClick();
      const currentPressure = this.calculatePressure();
      bus.emit('ui:subtitle_changed', {
        text: `Manifold Pressure Gauge: ${currentPressure} PSI. Calibrate Valves A, B, and C to depressurize to 0 PSI.`
      });
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
          this.drainLidMesh.position.x += 0.25;
        }
        if (this.crystalMesh) {
          this.crystalMesh.visible = true;
        }
        bus.emit('ui:subtitle_changed', {
          text: 'Pressure reaches 0.0 PSI. The floor drain hatch pops open, exposing an Oxidized Bronze crystal.'
        });
      }
      return true;
    }

    if (objectId === 'crystal_02_bronze') {
      if (!this.crystalCollected) {
        this.crystalCollected = true;
        if (this.crystalMesh) this.crystalMesh.visible = false;
        audio.playTumblerClick();
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
    }
  }
}
