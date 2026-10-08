import * as THREE from 'three';
import { RoomScenario, HotspotAnchor, CrystalId } from '../types';
import { EventBus } from '../core/EventBus';
import { AudioEngine } from '../audio/AudioEngine';

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
        position: new THREE.Vector3(3.2, 2.6, 4.6),
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
    door: {
      id: 'door',
      name: 'III. Hub Corridor',
      position: new THREE.Vector3(0, 1.8, 5.5),
      interactionPrompt: '[RETURN: CENTRAL HUB]',
      cameraPreset: {
        name: 'door',
        position: new THREE.Vector3(0, 1.8, 3.8),
        target: new THREE.Vector3(0, 1.8, 5.8)
      }
    }
  };

  private group: THREE.Group | null = null;
  private crystalMesh: THREE.Mesh | null = null;
  private crystalCollected: boolean = false;
  private ampTuned: boolean = false;
  private currentToneFreq: number = 600;

  public async buildScene(_scene: THREE.Scene): Promise<THREE.Group> {
    this.group = new THREE.Group();

    // Warped Non-Euclidean Wall Materials
    const matWall = new THREE.MeshStandardMaterial({ color: 0x1f2421, roughness: 0.8 });
    const matAmp = new THREE.MeshStandardMaterial({ color: 0x111312, roughness: 0.4, metalness: 0.8 });
    const matGrille = new THREE.MeshStandardMaterial({ color: 0x2d332f, roughness: 0.9 });
    const matAmberGlow = new THREE.MeshBasicMaterial({ color: 0xf59e0b });

    // Terrazzo Floor
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(12, 12), new THREE.MeshStandardMaterial({ color: 0x222624, roughness: 0.4 }));
    floor.rotation.x = -Math.PI / 2;
    this.group.add(floor);

    // Ceiling
    const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(12, 12), matWall);
    ceiling.position.y = 4.2;
    ceiling.rotation.x = Math.PI / 2;
    this.group.add(ceiling);

    // Slanted Non-Euclidean Walls (converging inward)
    const wallBack = new THREE.Mesh(new THREE.BoxGeometry(12, 4.4, 0.2), matWall);
    wallBack.position.set(0, 2.2, -6);
    wallBack.rotation.x = 0.08;
    this.group.add(wallBack);

    const wallFront = new THREE.Mesh(new THREE.BoxGeometry(12, 4.4, 0.2), matWall);
    wallFront.position.set(0, 2.2, 6);
    wallFront.rotation.x = -0.08;
    this.group.add(wallFront);

    // Return Door to Hub
    const returnDoor = new THREE.Mesh(new THREE.BoxGeometry(1.6, 3.0, 0.22), new THREE.MeshStandardMaterial({ color: 0x3d4a41 }));
    returnDoor.position.set(0, 1.5, 5.9);
    returnDoor.name = 'door_return_hub';
    this.group.add(returnDoor);

    const wallLeft = new THREE.Mesh(new THREE.BoxGeometry(0.2, 4.4, 12), matWall);
    wallLeft.position.set(-6, 2.2, 0);
    wallLeft.rotation.z = -0.08;
    this.group.add(wallLeft);

    const wallRight = new THREE.Mesh(new THREE.BoxGeometry(0.2, 4.4, 12), matWall);
    wallRight.position.set(6, 2.2, 0);
    wallRight.rotation.z = 0.08;
    this.group.add(wallRight);

    // Smeared Bauhaus Paintings on Wall
    const paintingFrame = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.8, 0.04), new THREE.MeshStandardMaterial({ color: 0x141a21 }));
    paintingFrame.position.set(0, 2.4, -5.85);
    const paintingCanvas = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.6, 0.06), new THREE.MeshStandardMaterial({ color: 0x9ca3af, roughness: 0.9 }));
    paintingCanvas.position.set(0, 2.4, -5.83);
    this.group.add(paintingFrame);
    this.group.add(paintingCanvas);

    // Towering 1960s Tube Amplifier Monolith
    const ampGroup = new THREE.Group();
    ampGroup.position.set(-2.0, 0, -1.8);
    ampGroup.name = 'prop_amplifier_monolith';

    // 3 Stacked Amplifier Cabinets
    for (let i = 0; i < 3; i++) {
      const cab = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.9, 0.8), matAmp);
      cab.position.y = 0.45 + i * 0.95;
      cab.name = 'prop_amp_stack';
      ampGroup.add(cab);

      // Speaker grille
      const grille = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.75, 0.05), matGrille);
      grille.position.set(0, 0.45 + i * 0.95, 0.42);
      ampGroup.add(grille);

      // Glowing vacuum tubes on top unit
      if (i === 2) {
        for (let t = 0; t < 4; t++) {
          const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.16, 12), matAmberGlow);
          tube.position.set(-0.45 + t * 0.3, 0.95 + i * 0.95, 0.1);
          ampGroup.add(tube);
        }
      }
    }

    // Torn 15-inch Speaker Cone housing the crystal
    const cone = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.1, 0.18, 24), new THREE.MeshStandardMaterial({ color: 0x1e2420, roughness: 0.95 }));
    cone.rotation.x = Math.PI / 2;
    cone.position.set(0, 1.4, 0.46);
    cone.name = 'prop_speaker_cone';
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
    ampGroup.add(this.crystalMesh);

    this.group.add(ampGroup);

    // Dim, moody amber lighting
    const ampLight = new THREE.PointLight(0xf59e0b, 1.6, 10);
    ampLight.position.set(-2.0, 2.5, -1.0);
    this.group.add(ampLight);

    return this.group;
  }

  public teardown(scene: THREE.Scene): void {
    if (this.group) {
      scene.remove(this.group);
      this.group = null;
    }
    this.crystalMesh = null;
  }

  public onObjectClick(objectId: string): boolean {
    const bus = EventBus.getInstance();
    const audio = AudioEngine.getInstance();

    if (objectId === 'door_return_hub') {
      bus.emit('scenario:switch_room', { targetRoomId: 'room_04' });
      return true;
    }

    if (objectId === 'prop_amplifier_monolith' || objectId === 'prop_amp_stack' || objectId === 'prop_speaker_cone') {
      this.currentToneFreq = (this.currentToneFreq + 47) % 300 + 550;
      audio.playToneAlignmentSweep(this.currentToneFreq);

      bus.emit('ui:subtitle_changed', {
        text: `Amplifier Harmonic Sweep: ${this.currentToneFreq} Hz. Matching 741 Hz will trigger speaker diaphragm resonance.`
      });

      // Target resonance frequency: 741 Hz (within 15 Hz)
      if (Math.abs(this.currentToneFreq - 741) < 25 && !this.ampTuned) {
        this.ampTuned = true;
        audio.playTumblerClick();
        if (this.crystalMesh) this.crystalMesh.visible = true;
        bus.emit('ui:subtitle_changed', {
          text: 'Resonance achieved at 741 Hz. The speaker cone vibrates violently and dislodges an Amethyst crystal.'
        });
      }
      return true;
    }

    if (objectId === 'crystal_03_amethyst') {
      if (!this.crystalCollected) {
        this.crystalCollected = true;
        if (this.crystalMesh) this.crystalMesh.visible = false;
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

    return false;
  }

  public update(_delta: number): void {
    if (this.crystalMesh && this.crystalMesh.visible) {
      this.crystalMesh.rotation.y += 0.02;
    }
  }
}
