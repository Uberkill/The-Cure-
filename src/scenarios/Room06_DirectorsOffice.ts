import * as THREE from 'three';
import { RoomScenario, HotspotAnchor, CrystalId } from '../types';
import { EventBus } from '../core/EventBus';
import { AudioEngine } from '../audio/AudioEngine';

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
      position: new THREE.Vector3(0, 1.8, 5.0),
      interactionPrompt: '[RETURN: CENTRAL HUB]',
      cameraPreset: {
        name: 'door',
        position: new THREE.Vector3(0, 1.8, 3.5),
        target: new THREE.Vector3(0, 1.8, 5.2)
      }
    }
  };

  private group: THREE.Group | null = null;
  private crystalMesh: THREE.Mesh | null = null;
  private secretDrawerMesh: THREE.Mesh | null = null;
  private crystalCollected: boolean = false;
  private drawerUnlocked: boolean = false;

  public async buildScene(_scene: THREE.Scene): Promise<THREE.Group> {
    this.group = new THREE.Group();

    // Pitch-black void materials
    const matVoid = new THREE.MeshBasicMaterial({ color: 0x000000 });
    const matMahogany = new THREE.MeshStandardMaterial({ color: 0x1f140e, roughness: 0.35 });
    const matPhone = new THREE.MeshStandardMaterial({ color: 0xe5e1d8, roughness: 0.4 });
    const matBrass = new THREE.MeshStandardMaterial({ color: 0xc28833, metalness: 0.85, roughness: 0.25 });

    // Infinite Dark Floor
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), matVoid);
    floor.rotation.x = -Math.PI / 2;
    this.group.add(floor);

    // Return Door (A solitary glowing doorframe floating in the black void)
    const doorFrame = new THREE.Mesh(new THREE.BoxGeometry(1.6, 3.0, 0.1), new THREE.MeshStandardMaterial({ color: 0x222222, emissive: 0x111111 }));
    doorFrame.position.set(0, 1.5, 4.9);
    doorFrame.name = 'door_return_hub';
    this.group.add(doorFrame);

    // Massive Heavy Mahogany Desk
    const deskGroup = new THREE.Group();
    deskGroup.name = 'prop_director_desk';

    const deskTop = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.14, 1.6), matMahogany);
    deskTop.position.set(0, 0.95, 0);
    deskTop.castShadow = true;
    deskTop.receiveShadow = true;
    deskGroup.add(deskTop);

    // Desk Pedestals
    [-1.2, 1.2].forEach((x) => {
      const pedestal = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.88, 1.4), matMahogany);
      pedestal.position.set(x, 0.44, 0);
      deskGroup.add(pedestal);
    });

    // Unplugged Cream Rotary Telephone (No wall cord)
    const phoneGroup = new THREE.Group();
    phoneGroup.position.set(-0.8, 1.02, 0.1);
    phoneGroup.name = 'prop_void_phone';

    const base = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.12, 0.32), matPhone);
    phoneGroup.add(base);

    const dial = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.02, 16), matBrass);
    dial.rotation.x = 0.3;
    dial.position.set(0, 0.08, 0.04);
    phoneGroup.add(dial);

    const handset = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.06, 0.08), matPhone);
    handset.position.set(0, 0.15, -0.04);
    phoneGroup.add(handset);

    deskGroup.add(phoneGroup);

    // Secret Mahogany Drawer
    const drawerMat = new THREE.MeshStandardMaterial({ color: 0x140c08, roughness: 0.4 });
    this.secretDrawerMesh = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.12, 0.6), drawerMat);
    this.secretDrawerMesh.position.set(0.6, 0.88, 0.1);
    this.secretDrawerMesh.name = 'prop_director_drawer';
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
    deskGroup.add(this.crystalMesh);

    deskGroup.add(phoneGroup);
    this.group.add(deskGroup);

    // Single Harsh Surgical Downward Spotlight
    const spot = new THREE.SpotLight(0xffffff, 3.2, 12, Math.PI / 6, 0.25);
    spot.position.set(0, 5.0, 0);
    spot.target = deskTop;
    spot.castShadow = true;
    this.group.add(spot);

    // Re-entry state restoration
    if (this.drawerUnlocked) {
      if (this.secretDrawerMesh) {
        this.secretDrawerMesh.position.z += 0.45;
      }
      if (this.crystalMesh && !this.crystalCollected) {
        this.crystalMesh.position.z += 0.45;
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
    this.crystalMesh = null;
    this.secretDrawerMesh = null;
  }

  public onObjectClick(objectId: string): boolean {
    const bus = EventBus.getInstance();
    const audio = AudioEngine.getInstance();

    if (objectId === 'door_return_hub') {
      bus.emit('scenario:switch_room', { targetRoomId: 'room_04' });
      return true;
    }

    if (objectId === 'prop_director_desk' || objectId === 'prop_director_drawer') {
      audio.playTumblerClick();
      if (!this.drawerUnlocked) {
        bus.emit('ui:subtitle_changed', {
          text: 'The heavy mahogany executive desk is locked with a magnetic relay. An unplugged rotary telephone rests on the surface.'
        });
      } else {
        bus.emit('ui:subtitle_changed', {
          text: 'The executive desk drawer is unsealed. The black void stretches endlessly into the distance.'
        });
      }
      return true;
    }

    if (objectId === 'prop_void_phone') {
      audio.playHandsetClick();
      if (!this.drawerUnlocked) {
        this.drawerUnlocked = true;
        audio.playPneumaticHiss();
        if (this.secretDrawerMesh) {
          this.secretDrawerMesh.position.z += 0.45;
        }
        if (this.crystalMesh) {
          this.crystalMesh.position.z += 0.45;
          this.crystalMesh.visible = true;
        }
        bus.emit('ui:subtitle_changed', {
          text: 'You lift the heavy receiver. Faint, wet breathing echoes. A magnetic relay clicks open a secret mahogany drawer, revealing the Celadon Core!'
        });
      } else {
        bus.emit('ui:subtitle_changed', {
          text: 'You lift the receiver. Only shallow, rhythmic breathing against the microphone. The secret drawer remains extended.'
        });
      }
      return true;
    }

    if (objectId === 'crystal_05_celadon') {
      if (!this.crystalCollected) {
        this.crystalCollected = true;
        if (this.crystalMesh) this.crystalMesh.visible = false;
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
    }
  }
}
