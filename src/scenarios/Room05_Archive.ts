import * as THREE from 'three';
import { RoomScenario, HotspotAnchor, CrystalId } from '../types';
import { EventBus } from '../core/EventBus';
import { AudioEngine } from '../audio/AudioEngine';
import { MicroficheViewerScreen } from '../ui/screens/MicroficheViewerScreen';
import { GameState } from '../core/GameState';

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
      position: new THREE.Vector3(1.6, 1.4, -1.2),
      interactionPrompt: '[ACCESS OPTICAL READER]',
      cameraPreset: {
        name: 'microfiche',
        position: new THREE.Vector3(1.6, 1.5, -0.2),
        target: new THREE.Vector3(1.6, 1.1, -1.2)
      }
    },
    door: {
      id: 'door',
      name: 'IV. Hub Corridor',
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
  private drawerOpen: boolean = false;
  private drawer104Mesh: THREE.Mesh | null = null;
  private microficheScreen: MicroficheViewerScreen = new MicroficheViewerScreen();
  private unsubscribers: (() => void)[] = [];

  public async buildScene(_scene: THREE.Scene): Promise<THREE.Group> {
    this.group = new THREE.Group();

    // Rehydrate state from GameState
    this.drawerOpen = GameState.getInstance().hasCrystal('crystal_04_obsidian');
    this.crystalCollected = this.drawerOpen;

    const bus = EventBus.getInstance();
    this.unsubscribers.push(
      bus.on('puzzle:crystal_collected', (payload) => {
        const data = payload as { crystalId?: string };
        if (data.crystalId === 'crystal_04_obsidian') {
          this.drawerOpen = true;
          this.crystalCollected = true;
          if (this.drawer104Mesh) {
            this.drawer104Mesh.position.z += 0.45;
          }
          if (this.crystalMesh) {
            this.crystalMesh.visible = false;
          }
        }
      })
    );

    const matCab = new THREE.MeshStandardMaterial({ color: 0x283629, roughness: 0.6, metalness: 0.3 });
    const matWall = new THREE.MeshStandardMaterial({ color: 0x162018, roughness: 0.8 });
    const matCord = new THREE.MeshStandardMaterial({ color: 0x0a0c0a, roughness: 0.95 });
    const matBrass = new THREE.MeshStandardMaterial({ color: 0xc28833, metalness: 0.8, roughness: 0.3 });

    // Sickly dark floor
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(14, 14), new THREE.MeshStandardMaterial({ color: 0x101612, roughness: 0.6 }));
    floor.rotation.x = -Math.PI / 2;
    this.group.add(floor);

    // Ceiling & Walls
    const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(14, 14), matWall);
    ceiling.position.y = 4.4;
    ceiling.rotation.x = Math.PI / 2;
    this.group.add(ceiling);

    const wallBack = new THREE.Mesh(new THREE.BoxGeometry(14, 4.4, 0.2), matWall);
    wallBack.position.set(0, 2.2, -7);
    this.group.add(wallBack);

    const wallFront = new THREE.Mesh(new THREE.BoxGeometry(14, 4.4, 0.2), matWall);
    wallFront.position.set(0, 2.2, 7);
    this.group.add(wallFront);

    // Return Door
    const returnDoor = new THREE.Mesh(new THREE.BoxGeometry(1.6, 3.0, 0.22), new THREE.MeshStandardMaterial({ color: 0x223025 }));
    returnDoor.position.set(0, 1.5, 6.9);
    returnDoor.name = 'door_return_hub';
    this.group.add(returnDoor);

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
        this.drawer104Mesh = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.45, 0.9), new THREE.MeshStandardMaterial({ color: 0x1a261c, roughness: 0.5 }));
        this.drawer104Mesh.position.set(0, 1.0, 0.5);
        this.drawer104Mesh.name = 'prop_drawer_104';
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
        this.crystalMesh.position.set(0, 1.25, 0.7);
        this.crystalMesh.name = 'crystal_04_obsidian';
        this.crystalMesh.visible = false;
        cabGroup.add(this.crystalMesh);
      }

      this.group!.add(cabGroup);
    });

    // Dedicated Microfiche Reader Console Table
    const readerDesk = new THREE.Group();
    readerDesk.position.set(1.6, 0, -1.2);
    readerDesk.name = 'prop_microfiche_reader';

    // Stand base
    const standMat = new THREE.MeshStandardMaterial({ color: 0x1e2822, roughness: 0.7 });
    const stand = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.85, 0.8), standMat);
    stand.position.y = 0.425;
    stand.castShadow = true;
    readerDesk.add(stand);

    // Microfilm projector hood
    const hood = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.45, 0.5), new THREE.MeshStandardMaterial({ color: 0x2b3831, roughness: 0.5 }));
    hood.position.set(0, 1.05, 0);
    readerDesk.add(hood);

    // Illuminated screen face
    const screenFace = new THREE.Mesh(
      new THREE.PlaneGeometry(0.45, 0.35),
      new THREE.MeshStandardMaterial({
        color: 0x22c55e,
        emissive: 0x15803d,
        emissiveIntensity: 0.6,
        roughness: 0.2
      })
    );
    screenFace.position.set(0, 1.05, 0.251);
    readerDesk.add(screenFace);

    this.group.add(readerDesk);

    // Sickly Chemical Green Overhead Lighting
    const greenLight = new THREE.PointLight(0x4ade80, 1.4, 12);
    greenLight.position.set(0, 4.0, 0);
    this.group.add(greenLight);

    // Re-entry state restoration
    if (this.drawerOpen) {
      if (this.drawer104Mesh) {
        this.drawer104Mesh.position.z += 0.45;
      }
      if (this.crystalMesh && !this.crystalCollected) {
        this.crystalMesh.visible = true;
      }
    }

    return this.group;
  }

  public teardown(scene: THREE.Scene): void {
    this.unsubscribers.forEach(u => u());
    this.unsubscribers = [];
    this.microficheScreen.teardown();
    if (this.group) {
      scene.remove(this.group);
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
      bus.emit('scenario:switch_room', { targetRoomId: 'room_04' });
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
      audio.playTumblerClick();
      bus.emit('ui:subtitle_changed', {
        text: this.cabinetLore[objectId]
      });
      return true;
    }

    if (objectId === 'prop_cabinet_7' || objectId === 'prop_drawer_104') {
      audio.playTumblerClick();

      if (!this.drawerOpen) {
        this.drawerOpen = true;
        if (this.drawer104Mesh) {
          this.drawer104Mesh.position.z += 0.45;
        }
        if (this.crystalMesh) {
          this.crystalMesh.visible = true;
        }
        audio.playPneumaticHiss();
        bus.emit('ui:subtitle_changed', {
          text: 'Filing Drawer 104 slides outward on oiled tracks, revealing a jagged Pitch-Black Obsidian crystal.'
        });
      } else {
        bus.emit('ui:subtitle_changed', {
          text: 'The files in Drawer 104 are shredded to pulp. The obsidian crystal sits in the center.'
        });
      }
      return true;
    }

    if (objectId === 'crystal_04_obsidian') {
      if (!this.crystalCollected && !GameState.getInstance().hasCrystal('crystal_04_obsidian')) {
        this.crystalCollected = true;
        if (this.crystalMesh) this.crystalMesh.visible = false;
        audio.playTumblerClick();
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
    }
  }
}
