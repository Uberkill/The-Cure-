import * as THREE from 'three';
import { RoomScenario, HotspotAnchor, CrystalId } from '../types';
import { EventBus } from '../core/EventBus';
import { AudioEngine } from '../audio/AudioEngine';

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
    }
  };

  private group: THREE.Group | null = null;
  private crystalMesh: THREE.Mesh | null = null;
  private crystalCollected: boolean = false;
  private trolleyUnlocked: boolean = false;
  private digits = [0, 0, 0];
  private digitMeshes: THREE.Mesh[] = [];

  public async buildScene(_scene: THREE.Scene): Promise<THREE.Group> {
    this.group = new THREE.Group();

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

      // Steel frame
      const frame = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.45, 2.2), matMetal);
      frame.position.y = 0.25;
      frame.castShadow = true;
      cotGroup.add(frame);

      // Mattress
      const mattress = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.2, 2.1), matOlive);
      mattress.position.y = 0.55;
      cotGroup.add(mattress);

      // Pillow
      const pillow = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.1, 0.4), new THREE.MeshStandardMaterial({ color: 0xedf0eb }));
      pillow.position.set(0, 0.68, -0.75);
      if (idx === 3) {
        // Bed 104 is vacant and disheveled
        pillow.rotation.y = 0.35;
        pillow.position.x = 0.15;
      }
      cotGroup.add(pillow);

      // Patient Clipboard at foot of bed (High-contrast brass board with white clinical paper sheet)
      const clipboardGroup = new THREE.Group();
      clipboardGroup.position.set(0, 0.66, 0.95);
      clipboardGroup.name = `prop_clipboard_${101 + idx}`;

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

    // Stainless Dispensary Trolley
    const trolleyGroup = new THREE.Group();
    trolleyGroup.position.set(1.8, 0, -1.2);
    trolleyGroup.name = 'prop_trolley';

    const trolleyCart = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.9, 0.8), matMetal);
    trolleyCart.position.y = 0.5;
    trolleyCart.name = 'prop_trolley_lock';
    trolleyGroup.add(trolleyCart);

    // 3 Rotary Tumbler Dials on front
    for (let i = 0; i < 3; i++) {
      const dial = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.03, 16), matBrass);
      dial.rotation.x = Math.PI / 2;
      dial.position.set(-0.2 + i * 0.2, 0.75, 0.42);
      dial.name = `prop_dial_${i}`;
      trolleyGroup.add(dial);
      this.digitMeshes.push(dial);
    }

    // Memory Crystal 01 (Prismatic Quartz)
    const crystalGeo = new THREE.OctahedronGeometry(0.12, 0);
    const crystalMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transmission: 0.9,
      opacity: 1,
      transparent: true,
      roughness: 0.05,
      ior: 1.54,
      emissive: 0xdfe8e2,
      emissiveIntensity: 0.2
    });
    this.crystalMesh = new THREE.Mesh(crystalGeo, crystalMat);
    this.crystalMesh.position.set(0, 1.05, 0);
    this.crystalMesh.name = 'crystal_01_quartz';
    this.crystalMesh.visible = false;
    trolleyGroup.add(this.crystalMesh);

    this.group.add(trolleyGroup);

    // Overhead Clinical Fluorescent Lights
    const light1 = new THREE.PointLight(0xf4f9f4, 1.2, 12);
    light1.position.set(0, 3.8, -3);
    this.group.add(light1);

    const light2 = new THREE.PointLight(0xf4f9f4, 1.2, 12);
    light2.position.set(0, 3.8, 3);
    this.group.add(light2);

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

  public teardown(scene: THREE.Scene): void {
    if (this.group) {
      scene.remove(this.group);
      this.group = null;
    }
    this.digitMeshes = [];
    this.crystalMesh = null;
  }

  public onObjectClick(objectId: string): boolean {
    const bus = EventBus.getInstance();
    const audio = AudioEngine.getInstance();

    if (objectId === 'door_return_hub') {
      bus.emit('scenario:switch_room', { targetRoomId: 'room_04' });
      return true;
    }

    if (objectId.startsWith('prop_clipboard_')) {
      audio.playTumblerClick();
      const subjectNum = objectId.split('_')[2];
      if (subjectNum === '101') {
        bus.emit('ui:subtitle_changed', {
          text: 'Chart 101 [Subject 101]: "Limbic sedation holding. Mirror recognition eliminated. Progressive alignment confirmed."'
        });
      } else if (subjectNum === '102') {
        bus.emit('ui:subtitle_changed', {
          text: 'Chart 102 [Subject 102]: "Vocal desensitization complete. Mnemonic quartz crystal secured inside dispensary cart."'
        });
      } else if (subjectNum === '103') {
        bus.emit('ui:subtitle_changed', {
          text: 'Chart 103 [Subject 103]: "Dispensary cart tumbler access is keyed to the 3-digit intake number of the transferred subject."'
        });
      } else if (subjectNum === '104') {
        bus.emit('ui:subtitle_changed', {
          text: 'Chart 104 [Subject 104 • VACANT]: "Cot vacant. Subject transferred to Sterile Reception (Room 04). Patient Intake ID: 104."'
        });
      }
      return true;
    }

    if (objectId === 'prop_trolley_lock') {
      audio.playTumblerClick();
      bus.emit('ui:subtitle_changed', {
        text: `Dispensary Cart Lock [ ${this.digits[0]} - ${this.digits[1]} - ${this.digits[2]} ]: Stenciled label reads: "SEDATIVE DISPENSARY — ENTER 3-DIGIT PATIENT INTAKE ID TO RELEASE DRAWER".`
      });
      return true;
    }

    if (objectId.startsWith('prop_dial_')) {
      if (this.trolleyUnlocked) {
        bus.emit('ui:subtitle_changed', {
          text: 'Dispensary Cart is unlocked [ 1 - 0 - 4 ]. The tray is extended.'
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

      bus.emit('ui:subtitle_changed', {
        text: `Dispensary Cart Tumblers: [ ${this.digits[0]} - ${this.digits[1]} - ${this.digits[2]} ]`
      });

      // Target code is 1-0-4
      if (this.digits[0] === 1 && this.digits[1] === 0 && this.digits[2] === 4) {
        if (!this.trolleyUnlocked) {
          this.trolleyUnlocked = true;
          audio.playPneumaticHiss();
          if (this.crystalMesh) this.crystalMesh.visible = true;
          bus.emit('ui:subtitle_changed', {
            text: 'Tumblers align: 1-0-4. The dispensary tray clicks open, revealing a pristine Prismatic Quartz crystal.'
          });
        }
      }
      return true;
    }

    if (objectId === 'crystal_01_quartz') {
      if (!this.crystalCollected) {
        this.crystalCollected = true;
        if (this.crystalMesh) this.crystalMesh.visible = false;
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
    }
  }
}
