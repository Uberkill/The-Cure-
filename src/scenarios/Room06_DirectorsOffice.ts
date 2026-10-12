import * as THREE from 'three';
import { RoomScenario, HotspotAnchor, CrystalId } from '../types';
import { EventBus } from '../core/EventBus';
import { AudioEngine } from '../audio/AudioEngine';
import { WiretapTapeDeckScreen } from '../ui/screens/WiretapTapeDeckScreen';
import { GameState } from '../core/GameState';

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
  private wiretapScreen: WiretapTapeDeckScreen = new WiretapTapeDeckScreen();
  private unsubscribers: (() => void)[] = [];

  public async buildScene(_scene: THREE.Scene): Promise<THREE.Group> {
    this.group = new THREE.Group();

    // Rehydrate state from GameState
    this.drawerUnlocked = GameState.getInstance().hasCrystal('crystal_05_celadon');
    this.crystalCollected = this.drawerUnlocked;

    const bus = EventBus.getInstance();
    this.unsubscribers.push(
      bus.on('puzzle:crystal_collected', (payload) => {
        const data = payload as { crystalId?: string };
        if (data.crystalId === 'crystal_05_celadon') {
          this.drawerUnlocked = true;
          this.crystalCollected = true;
          if (this.secretDrawerMesh) {
            this.secretDrawerMesh.position.z += 0.45;
          }
          if (this.crystalMesh) {
            this.crystalMesh.visible = false;
          }
        }
      })
    );

    // Materials
    const matVoid = new THREE.MeshBasicMaterial({ color: 0x000000 });
    const matMahogany = new THREE.MeshStandardMaterial({ color: 0x1c120c, roughness: 0.32 });
    const matPhone = new THREE.MeshStandardMaterial({ color: 0xe5e1d8, roughness: 0.38 });
    const matBrass = new THREE.MeshStandardMaterial({ color: 0xc28833, metalness: 0.85, roughness: 0.22 });
    const matAluminum = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.82, roughness: 0.28 });
    const matLeather = new THREE.MeshStandardMaterial({ color: 0x111613, roughness: 0.55 });
    const matGlass = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transmission: 0.9,
      roughness: 0.08,
      transparent: true,
      opacity: 0.88
    });
    const matAmberGlow = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
    const matCastIron = new THREE.MeshStandardMaterial({ color: 0x121513, metalness: 0.7, roughness: 0.65 });

    // Infinite Dark Floor
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), matVoid);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this.group.add(floor);

    // Return Door (A solitary floating portal frame in the black void)
    const doorFrame = new THREE.Mesh(
      new THREE.BoxGeometry(1.6, 3.0, 0.12),
      new THREE.MeshStandardMaterial({ color: 0x242424, emissive: 0x111111 })
    );
    doorFrame.position.set(0, 1.5, 4.9);
    doorFrame.name = 'door_return_hub';
    this.group.add(doorFrame);

    // Executive Desk Suite Group
    const deskGroup = new THREE.Group();
    deskGroup.name = 'prop_director_desk';

    // Massive Heavy Mahogany Desk Top
    const deskTop = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.14, 1.6), matMahogany);
    deskTop.position.set(0, 0.95, 0);
    deskTop.castShadow = true;
    deskTop.receiveShadow = true;
    deskGroup.add(deskTop);

    // Desk Pedestals (Left & Right)
    [-1.2, 1.2].forEach((x) => {
      const pedestal = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.88, 1.4), matMahogany);
      pedestal.position.set(x, 0.44, 0);
      pedestal.castShadow = true;
      pedestal.receiveShadow = true;
      deskGroup.add(pedestal);
    });

    // Dark Green Leather Desk Blotter Pad with Brass Corners (resting flush on mahogany desk surface y=1.02)
    const blotter = new THREE.Mesh(
      new THREE.BoxGeometry(1.3, 0.015, 0.75),
      new THREE.MeshStandardMaterial({ color: 0x18261e, roughness: 0.6 })
    );
    blotter.position.set(0, 1.028, 0.12);
    blotter.castShadow = true;
    blotter.raycast = () => {};
    deskGroup.add(blotter);

    // 4 Brass Corner Clips on Blotter
    [
      [-0.64, -0.24],
      [-0.64, 0.48],
      [0.64, -0.24],
      [0.64, 0.48]
    ].forEach(([cx, cz]) => {
      const clip = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.018, 0.04), matBrass);
      clip.position.set(cx, 1.044, cz);
      clip.raycast = () => {};
      deskGroup.add(clip);
    });

    // Heavy Crystal Glass Ashtray
    const ashtray = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.08, 0.04, 16), matGlass);
    ashtray.position.set(-0.55, 1.040, 0.35);
    ashtray.castShadow = true;
    ashtray.raycast = () => {};
    deskGroup.add(ashtray);

    // Unplugged Cream Bakelite Rotary Telephone
    const phoneGroup = new THREE.Group();
    phoneGroup.position.set(-0.85, 1.08, 0.12);
    phoneGroup.name = 'prop_void_phone';

    const phoneBase = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.12, 0.32), matPhone);
    phoneBase.castShadow = true;
    phoneGroup.add(phoneBase);

    // Brass Rotary Dial with Finger Stop
    const dial = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.02, 24), matBrass);
    dial.rotation.x = 0.3;
    dial.position.set(0, 0.08, 0.05);
    dial.castShadow = true;
    phoneGroup.add(dial);

    const fingerStop = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.025, 0.03), matBrass);
    fingerStop.position.set(0.065, 0.08, 0.08);
    phoneGroup.add(fingerStop);

    // Cradle Prongs & Handset
    const handset = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.07, 0.09), matPhone);
    handset.position.set(0, 0.16, -0.04);
    handset.castShadow = true;
    phoneGroup.add(handset);

    // Handset Coiled Cord
    const cordCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.18, 0.14, -0.04),
      new THREE.Vector3(-0.24, 0.06, 0.02),
      new THREE.Vector3(-0.20, 0.02, 0.12),
      new THREE.Vector3(-0.12, 0.02, 0.16)
    ]);
    const phoneCord = new THREE.Mesh(new THREE.TubeGeometry(cordCurve, 16, 0.008, 8, false), matPhone);
    phoneCord.raycast = () => {};
    phoneGroup.add(phoneCord);

    deskGroup.add(phoneGroup);

    // Articulated Nagra SN Reel-to-Reel Tape Deck (flush on desk surface y=1.02)
    const tapeDeckGroup = new THREE.Group();
    tapeDeckGroup.position.set(0.0, 1.07, -0.15);
    tapeDeckGroup.name = 'prop_tape_deck';

    const deckBody = new THREE.Mesh(
      new THREE.BoxGeometry(0.56, 0.10, 0.42),
      new THREE.MeshStandardMaterial({ color: 0x222b27, roughness: 0.5, metalness: 0.3 })
    );
    deckBody.castShadow = true;
    tapeDeckGroup.add(deckBody);

    // Feed and Takeup Spools (3-Spoke Aluminum Flanges)
    [-0.14, 0.14].forEach((xOff) => {
      const spoolGroup = new THREE.Group();
      spoolGroup.position.set(xOff, 0.06, -0.02);

      const spoolCore = new THREE.Mesh(new THREE.CylinderGeometry(0.095, 0.095, 0.016, 24), matAluminum);
      spoolGroup.add(spoolCore);

      const spindle = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.035, 12), matBrass);
      spoolGroup.add(spindle);

      tapeDeckGroup.add(spoolGroup);
    });

    // Center Tape Head Bridge
    const tapeBridge = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.035, 0.06), matCastIron);
    tapeBridge.position.set(0, 0.065, 0.08);
    tapeDeckGroup.add(tapeBridge);

    // VU Meter Display Window
    const vuWindow = new THREE.Mesh(new THREE.PlaneGeometry(0.14, 0.06), matAmberGlow);
    vuWindow.rotation.x = -Math.PI / 2;
    vuWindow.position.set(0, 0.052, -0.14);
    tapeDeckGroup.add(vuWindow);

    // Transport Keys (Play, Stop, Rewind)
    [-0.08, 0, 0.08].forEach((bx) => {
      const btn = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.02, 0.035), matAluminum);
      btn.position.set(bx, 0.055, 0.16);
      tapeDeckGroup.add(btn);
    });

    deskGroup.add(tapeDeckGroup);

    // Brass Desk Carriage Clock (11:03 Escapement Interlock, resting flush on desk surface y=1.02)
    const clockGroup = new THREE.Group();
    clockGroup.position.set(0.65, 1.1425, -0.15);
    clockGroup.name = 'prop_carriage_clock';

    // Top and Bottom Brass Baseplates
    [-0.11, 0.11].forEach((py) => {
      const plate = new THREE.Mesh(new THREE.BoxGeometry(0.20, 0.025, 0.16), matBrass);
      plate.position.y = py;
      plate.castShadow = true;
      clockGroup.add(plate);
    });

    // 4 Corner Brass Fluted Pillars
    [
      [-0.085, -0.065],
      [-0.085, 0.065],
      [0.085, -0.065],
      [0.085, 0.065]
    ].forEach(([cx, cz]) => {
      const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.22, 12), matBrass);
      pillar.position.set(cx, 0, cz);
      clockGroup.add(pillar);
    });

    // Beveled Crystal Glass Enclosure (front face at z = 0.070)
    const clockGlass = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.20, 0.14), matGlass);
    clockGroup.add(clockGlass);

    // Enamel White Clock Dial with Hands at 11:03 (recessed inside glass enclosure at z = 0.055)
    const dialPlate = new THREE.Mesh(
      new THREE.PlaneGeometry(0.13, 0.13),
      new THREE.MeshStandardMaterial({ color: 0xfafafa, roughness: 0.2 })
    );
    dialPlate.position.set(0, 0.01, 0.055);
    clockGroup.add(dialPlate);

    // Hour and Minute Hands (Inside glass enclosure with 3mm depth offset to prevent coplanar Z-fighting)
    const hourHand = new THREE.Mesh(new THREE.BoxGeometry(0.006, 0.035, 0.002), matCastIron);
    hourHand.rotation.z = 0.52; // ~11 o'clock
    hourHand.position.set(-0.01, 0.02, 0.058);
    clockGroup.add(hourHand);

    const minuteHand = new THREE.Mesh(new THREE.BoxGeometry(0.004, 0.05, 0.002), matCastIron);
    minuteHand.rotation.z = -0.31; // ~3 minutes past 12
    minuteHand.position.set(0.005, 0.025, 0.061);
    clockGroup.add(minuteHand);

    // Top Folding Brass Carry Handle
    const handle = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.009, 8, 24), matBrass);
    handle.position.set(0, 0.14, 0);
    handle.rotation.x = Math.PI / 2;
    clockGroup.add(handle);

    clockGroup.userData.interactionPrompt = '[INSPECT BRASS CARRIAGE CLOCK (11:03)]';
    deskGroup.add(clockGroup);

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

    this.group.add(deskGroup);

    // High-Backed Tufted Leather Executive Chair Behind Desk
    const chairGroup = new THREE.Group();
    chairGroup.position.set(0, 0, -1.05);
    chairGroup.name = 'mesh_executive_chair';

    const chairBase = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.38, 0.05, 16), matCastIron);
    chairBase.position.y = 0.025;
    chairBase.raycast = () => {};
    chairGroup.add(chairBase);

    const chairStem = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.45, 12), matCastIron);
    chairStem.position.y = 0.25;
    chairStem.raycast = () => {};
    chairGroup.add(chairStem);

    const chairSeat = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.12, 0.68), matLeather);
    chairSeat.position.y = 0.54;
    chairSeat.castShadow = true;
    chairSeat.raycast = () => {};
    chairGroup.add(chairSeat);

    const chairBack = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.82, 0.12), matLeather);
    chairBack.position.set(0, 0.98, -0.30);
    chairBack.rotation.x = -0.08;
    chairBack.castShadow = true;
    chairBack.raycast = () => {};
    chairGroup.add(chairBack);

    this.group.add(chairGroup);

    // Suspended Downward Task Pendant Light Fixture
    const lampShade = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.38, 0.24, 24),
      new THREE.MeshStandardMaterial({ color: 0x18241e, metalness: 0.8, roughness: 0.25 })
    );
    lampShade.position.set(0, 4.6, 0);
    lampShade.raycast = () => {};
    this.group.add(lampShade);

    const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 1.2, 8), matCastIron);
    cord.position.set(0, 5.2, 0);
    cord.raycast = () => {};
    this.group.add(cord);

    // Single Harsh Surgical Downward Spotlight Focused on Desk
    const spot = new THREE.SpotLight(0xffffff, 3.4, 12, Math.PI / 6, 0.25);
    spot.position.set(0, 4.5, 0);
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
    this.unsubscribers.forEach((u) => u());
    this.unsubscribers = [];
    this.wiretapScreen.teardown();
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

    if (objectId === 'prop_tape_deck' || objectId === 'prop_carriage_clock') {
      if (this.drawerUnlocked || GameState.getInstance().hasCrystal('crystal_05_celadon')) {
        bus.emit('camera:move_to_hotspot', { hotspotId: 'desk' });
        bus.emit('ui:subtitle_changed', {
          text: 'The reel-to-reel deck is unspooled. Carriage clock set to 11:03. Celadon Core crystal secured.'
        });
        return true;
      }
      audio.playTumblerClick();
      bus.emit('camera:move_to_hotspot', { hotspotId: 'desk' });
      this.wiretapScreen.open();
      return true;
    }

    if (objectId === 'prop_director_desk' || objectId === 'prop_director_drawer') {
      audio.playTumblerClick();
      if (!this.drawerUnlocked) {
        bus.emit('ui:subtitle_changed', {
          text: 'The heavy mahogany executive desk is locked with a magnetic relay. An unplugged rotary telephone and wiretap tape deck rest on the surface.'
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
        if (!this.wiretapScreen.getState().safeUnlatched) {
          bus.emit('ui:subtitle_changed', {
            text: 'You lift the heavy receiver. Faint, wet breathing echoes... A voice whispers: "Align the carriage escapement at eleven-zero-three."'
          });
          return true;
        }
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
      if (!this.crystalCollected && !GameState.getInstance().hasCrystal('crystal_05_celadon')) {
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
