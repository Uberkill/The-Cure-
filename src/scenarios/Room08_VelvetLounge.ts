import * as THREE from 'three';
import { RoomScenario, HotspotAnchor } from '../types';
import { EventBus } from '../core/EventBus';
import { AudioEngine } from '../audio/AudioEngine';
import { SwitchboardMirrorScreen } from '../ui/screens/SwitchboardMirrorScreen';

export class Room08_VelvetLounge implements RoomScenario {
  public id = 'velvet_lounge';
  public title = 'The Velvet Lounge';
  public actTitle = 'ACT VIII • THE ESCAPE / THE DEPLOYMENT';
  public roomCode = 'Sector 00 • Sub-Baltic Velvet Bar';
  public defaultHotspot = 'overview';

  public hotspots: Record<string, HotspotAnchor> = {
    overview: {
      id: 'overview',
      name: 'I. The Lounge',
      position: new THREE.Vector3(0, 1.8, 3.8),
      interactionPrompt: 'Velvet Lounge Overview',
      cameraPreset: {
        name: 'overview',
        position: new THREE.Vector3(3.4, 2.2, 4.6),
        target: new THREE.Vector3(0, 1.0, 0)
      }
    },
    bar: {
      id: 'bar',
      name: 'II. The Mahogany Bar',
      position: new THREE.Vector3(-1.2, 1.2, 0),
      interactionPrompt: '[INSPECT BAR & DRINK]',
      cameraPreset: {
        name: 'bar',
        position: new THREE.Vector3(-0.2, 1.6, 1.4),
        target: new THREE.Vector3(-1.4, 1.1, 0)
      }
    },
    mirror: {
      id: 'mirror',
      name: 'III. Gilded Mirror & Table',
      position: new THREE.Vector3(-1.4, 1.8, -2.6),
      interactionPrompt: '[INSPECT REFLECTION & TABLE]',
      cameraPreset: {
        name: 'mirror',
        position: new THREE.Vector3(-1.4, 1.8, -2.6),
        target: new THREE.Vector3(-1.4, 1.8, -5.7)
      }
    },
    switchboard: {
      id: 'switchboard',
      name: 'IV. Operator Switchboard',
      position: new THREE.Vector3(1.2, 1.8, 0),
      interactionPrompt: '[INSPECT SWITCHBOARD]',
      cameraPreset: {
        name: 'switchboard',
        position: new THREE.Vector3(0.2, 1.8, 1.2),
        target: new THREE.Vector3(1.2, 1.6, 0)
      }
    },
    payphone: {
      id: 'payphone',
      name: 'V. Ringing Payphone',
      position: new THREE.Vector3(2.6, 1.7, -1.5),
      interactionPrompt: '[ANSWER: THE PHANTOM RECEIVER]',
      cameraPreset: {
        name: 'payphone',
        position: new THREE.Vector3(1.6, 1.8, -0.6),
        target: new THREE.Vector3(2.6, 1.7, -1.5)
      }
    }
  };

  private group: THREE.Group | null = null;
  private payphoneMesh: THREE.Mesh | null = null;
  private mirrorMesh: THREE.Mesh | null = null;
  private decanterMesh: THREE.Group | null = null;
  private payphoneAnswered: boolean = false;
  private switchboardScreen: SwitchboardMirrorScreen = new SwitchboardMirrorScreen();

  public async buildScene(_scene: THREE.Scene): Promise<THREE.Group> {
    this.group = new THREE.Group();

    // David Lynchian Materials: Heavy Red Velvet, Smoked Mahogany, Polished Brass
    const matVelvet = new THREE.MeshStandardMaterial({
      color: 0x661217,
      roughness: 0.95,
      metalness: 0.05
    });
    const matMahogany = new THREE.MeshStandardMaterial({
      color: 0x1f140e,
      roughness: 0.28,
      metalness: 0.1
    });
    const matBrass = new THREE.MeshStandardMaterial({
      color: 0xc28833,
      metalness: 0.85,
      roughness: 0.25
    });
    const matChevron = new THREE.MeshStandardMaterial({
      color: 0x141615,
      roughness: 0.35
    });
    const matMarble = new THREE.MeshStandardMaterial({
      color: 0x272b28,
      roughness: 0.2,
      metalness: 0.15
    });
    const matGlass = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transmission: 0.9,
      roughness: 0.08,
      transparent: true,
      opacity: 0.9
    });
    const matAmberLiquor = new THREE.MeshStandardMaterial({
      color: 0xd97706,
      roughness: 0.15
    });
    const matSilhouette = new THREE.MeshBasicMaterial({
      color: 0x050505
    });
    const matLeather = new THREE.MeshStandardMaterial({
      color: 0x4a0e12,
      roughness: 0.55
    });
    const matCastIron = new THREE.MeshStandardMaterial({
      color: 0x111613,
      metalness: 0.7,
      roughness: 0.65
    });

    // Floor: Black-and-white chevron zigzag
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(16, 16), matChevron);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this.group.add(floor);

    // Ceiling & Deep Red Velvet Drapes
    const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(16, 16), new THREE.MeshBasicMaterial({ color: 0x050505 }));
    ceiling.position.y = 4.2;
    ceiling.rotation.x = Math.PI / 2;
    this.group.add(ceiling);

    const drapesBack = new THREE.Mesh(new THREE.BoxGeometry(16, 4.2, 0.4), matVelvet);
    drapesBack.position.set(0, 2.1, -6);
    this.group.add(drapesBack);

    const drapesLeft = new THREE.Mesh(new THREE.BoxGeometry(0.4, 4.2, 16), matVelvet);
    drapesLeft.position.set(-6, 2.1, 0);
    this.group.add(drapesLeft);

    const drapesRight = new THREE.Mesh(new THREE.BoxGeometry(0.4, 4.2, 16), matVelvet);
    drapesRight.position.set(6, 2.1, 0);
    this.group.add(drapesRight);

    // Return Door to Hub / Previous Chamber
    const returnDoor = new THREE.Mesh(
      new THREE.BoxGeometry(1.6, 3.0, 0.15),
      new THREE.MeshStandardMaterial({ color: 0x221a18, metalness: 0.3, roughness: 0.6 })
    );
    returnDoor.position.set(0, 1.5, 5.9);
    returnDoor.name = 'door_return_hub';
    this.group.add(returnDoor);

    // Mahogany Bar Infrastructure
    const barGroup = new THREE.Group();
    barGroup.name = 'prop_lounge_bar';
    barGroup.position.set(-1.8, 0, 0);

    // Solid Bar Counter Base
    const barBase = new THREE.Mesh(new THREE.BoxGeometry(3.5, 0.98, 1.05), matMahogany);
    barBase.position.y = 0.49;
    barBase.castShadow = true;
    barBase.receiveShadow = true;
    barGroup.add(barBase);

    // Beveled Bar Counter Top
    const barTop = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.12, 1.25), matMahogany);
    barTop.position.y = 1.04;
    barTop.castShadow = true;
    barGroup.add(barTop);

    // Polished Brass Tubular Foot Rail
    const footRail = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 3.4, 16), matBrass);
    footRail.rotation.z = Math.PI / 2;
    footRail.position.set(0, 0.18, 0.60);
    footRail.castShadow = true;
    footRail.raycast = () => {};
    barGroup.add(footRail);

    // Brass Foot Rail Brackets
    [-1.2, 0, 1.2].forEach((bx) => {
      const bracket = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.12, 12), matBrass);
      bracket.rotation.x = Math.PI / 2;
      bracket.position.set(bx, 0.18, 0.54);
      bracket.raycast = () => {};
      barGroup.add(bracket);
    });

    // Lowball Glass with Amber Whiskey & Ice
    const glassGroup = new THREE.Group();
    glassGroup.position.set(0.4, 1.14, 0.1);
    glassGroup.name = 'prop_whiskey_glass';

    const tumbler = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.07, 0.14, 16), matGlass);
    glassGroup.add(tumbler);

    const whiskey = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.065, 0.08, 16), matAmberLiquor);
    whiskey.position.y = -0.02;
    glassGroup.add(whiskey);
    barGroup.add(glassGroup);

    this.group.add(barGroup);

    // Two Tufted Burgundy Leather Bar Stools
    [-2.8, -1.2].forEach((sx) => {
      const stoolGroup = new THREE.Group();
      stoolGroup.position.set(sx, 0, 1.0);
      stoolGroup.name = 'mesh_bar_stool';

      const stoolBase = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.26, 0.04, 24), matBrass);
      stoolBase.position.y = 0.02;
      stoolBase.raycast = () => {};
      stoolGroup.add(stoolBase);

      const stoolStem = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.70, 16), matBrass);
      stoolStem.position.y = 0.38;
      stoolStem.raycast = () => {};
      stoolGroup.add(stoolStem);

      const stoolSeat = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.23, 0.12, 24), matLeather);
      stoolSeat.position.y = 0.75;
      stoolSeat.castShadow = true;
      stoolSeat.raycast = () => {};
      stoolGroup.add(stoolSeat);

      this.group!.add(stoolGroup);
    });

    // Back-Bar Mirrored Liquor Shelving
    const backBarGroup = new THREE.Group();
    backBarGroup.position.set(-5.6, 1.8, 0);
    backBarGroup.name = 'mesh_back_bar_shelves';

    const shelfBack = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 2.4, 3.2),
      new THREE.MeshStandardMaterial({ color: 0x14100d, roughness: 0.3, metalness: 0.4 })
    );
    backBarGroup.add(shelfBack);

    // 3 Glass Shelves with Bottles
    [-0.6, 0.0, 0.6].forEach((sy) => {
      const shelfGlass = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.03, 3.0), matGlass);
      shelfGlass.position.set(0.18, sy, 0);
      shelfGlass.raycast = () => {};
      backBarGroup.add(shelfGlass);

      // Vintage Bottles along shelf
      [-1.1, -0.6, -0.1, 0.4, 0.9].forEach((bz) => {
        const bottleColor = Math.random() > 0.5 ? 0x064e3b : 0xd97706;
        const bottle = new THREE.Mesh(
          new THREE.CylinderGeometry(0.05, 0.05, 0.28, 12),
          new THREE.MeshPhysicalMaterial({ color: bottleColor, roughness: 0.1, transmission: 0.7 })
        );
        bottle.position.set(0.18, sy + 0.155, bz);
        bottle.raycast = () => {};
        backBarGroup.add(bottle);
      });
    });
    this.group.add(backBarGroup);

    // The Gilded Mirror on Back Wall
    const mirrorFrame = new THREE.Mesh(new THREE.BoxGeometry(2.4, 3.2, 0.12), matBrass);
    mirrorFrame.position.set(-1.4, 2.1, -5.7);
    this.group.add(mirrorFrame);

    this.mirrorMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(2.1, 2.9),
      new THREE.MeshStandardMaterial({
        color: 0x111613,
        metalness: 0.95,
        roughness: 0.05
      })
    );
    this.mirrorMesh.position.set(-1.4, 2.1, -5.63);
    this.mirrorMesh.name = 'prop_bar_mirror_glass';
    this.group.add(this.mirrorMesh);

    // Featureless Black Silhouette in Mirror
    const silhouette = new THREE.Mesh(new THREE.CapsuleGeometry(0.35, 1.1, 8, 16), matSilhouette);
    silhouette.position.set(-1.4, 1.8, -5.55);
    silhouette.name = 'prop_bar_mirror_silhouette';
    this.group.add(silhouette);

    // Round Pedestal Marble Cocktail Table in front of Mirror
    const tableGroup = new THREE.Group();
    tableGroup.position.set(-1.4, 0, -4.5);
    tableGroup.name = 'mesh_mirror_cocktail_table';

    const tableBase = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.38, 0.04, 24), matBrass);
    tableBase.position.y = 0.02;
    tableBase.raycast = () => {};
    tableGroup.add(tableBase);

    const tableStem = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.82, 16), matBrass);
    tableStem.position.y = 0.44;
    tableStem.raycast = () => {};
    tableGroup.add(tableStem);

    const tableTop = new THREE.Mesh(new THREE.CylinderGeometry(0.68, 0.68, 0.05, 32), matMarble);
    tableTop.position.y = 0.87;
    tableTop.castShadow = true;
    tableTop.receiveShadow = true;
    tableTop.raycast = () => {};
    tableGroup.add(tableTop);

    // The Faceted Crystal Decanter (Key puzzle prop)
    this.decanterMesh = new THREE.Group();
    this.decanterMesh.position.set(0, 0.90, 0);
    this.decanterMesh.name = 'prop_crystal_decanter';

    const decanterBody = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.32, 0.22), matGlass);
    decanterBody.position.y = 0.16;
    decanterBody.castShadow = true;
    this.decanterMesh.add(decanterBody);

    const decanterLiquid = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.22, 0.18), matAmberLiquor);
    decanterLiquid.position.y = 0.12;
    this.decanterMesh.add(decanterLiquid);

    const decanterNeck = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.06, 0.10, 16), matGlass);
    decanterNeck.position.y = 0.37;
    this.decanterMesh.add(decanterNeck);

    const decanterStopper = new THREE.Mesh(new THREE.OctahedronGeometry(0.07, 0), matGlass);
    decanterStopper.position.y = 0.47;
    this.decanterMesh.add(decanterStopper);

    this.decanterMesh.userData.interactionPrompt = '[EXAMINE: CUT-CRYSTAL DECANTER]';
    tableGroup.add(this.decanterMesh);

    this.group.add(tableGroup);

    // Articulated Vintage Operator PBX Switchboard
    const switchboardGroup = new THREE.Group();
    switchboardGroup.position.set(1.2, 1.8, 0);
    switchboardGroup.rotation.y = -Math.PI / 2;
    switchboardGroup.name = 'prop_switchboard';

    const switchboardCase = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 0.85, 0.24),
      new THREE.MeshStandardMaterial({ color: 0x19211c, roughness: 0.6, metalness: 0.3 })
    );
    switchboardGroup.add(switchboardCase);

    const jackFace = new THREE.Mesh(
      new THREE.PlaneGeometry(1.0, 0.55),
      new THREE.MeshStandardMaterial({ color: 0x090e0c, roughness: 0.2 })
    );
    jackFace.position.z = 0.121;
    switchboardGroup.add(jackFace);

    // 4x4 Brass Jack Matrix & Jewel Indicators
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        const jx = -0.38 + c * 0.25;
        const jy = -0.18 + r * 0.12;

        const jack = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.02, 16), matBrass);
        jack.rotation.x = Math.PI / 2;
        jack.position.set(jx, jy, 0.125);
        jack.raycast = () => {};
        switchboardGroup.add(jack);

        // Indicator Jewel Light above jack
        const lampMat = r === 3 ? new THREE.MeshBasicMaterial({ color: 0xef4444 }) : new THREE.MeshBasicMaterial({ color: 0xf59e0b });
        const lamp = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.015, 12), lampMat);
        lamp.rotation.x = Math.PI / 2;
        lamp.position.set(jx, jy + 0.045, 0.125);
        lamp.raycast = () => {};
        switchboardGroup.add(lamp);
      }
    }

    // Lower Slanted Key Shelf with Brass Toggle Keys
    const keyShelf = new THREE.Mesh(
      new THREE.BoxGeometry(1.15, 0.12, 0.25),
      new THREE.MeshStandardMaterial({ color: 0x141a16, roughness: 0.5 })
    );
    keyShelf.position.set(0, -0.42, 0.16);
    keyShelf.rotation.x = 0.3;
    keyShelf.raycast = () => {};
    switchboardGroup.add(keyShelf);

    [-0.35, -0.12, 0.12, 0.35].forEach((kx) => {
      const toggleKey = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.06, 12), matBrass);
      toggleKey.position.set(kx, -0.38, 0.24);
      toggleKey.rotation.x = -0.4;
      toggleKey.raycast = () => {};
      switchboardGroup.add(toggleKey);
    });

    this.group.add(switchboardGroup);

    // Wall Vintage Payphone with Armored Cord & Acoustic Wings
    const phoneGroup = new THREE.Group();
    phoneGroup.position.set(2.6, 1.8, -1.5);
    phoneGroup.name = 'prop_lounge_payphone';

    // Acoustic Privacy Wings
    [-0.28, 0.28].forEach((wx) => {
      const wing = new THREE.Mesh(
        new THREE.BoxGeometry(0.04, 0.95, 0.45),
        new THREE.MeshStandardMaterial({ color: 0x141816, roughness: 0.7 })
      );
      wing.position.set(wx, 0, 0.1);
      wing.raycast = () => {};
      phoneGroup.add(wing);
    });

    const phoneBox = new THREE.Mesh(
      new THREE.BoxGeometry(0.38, 0.72, 0.25),
      new THREE.MeshStandardMaterial({ color: 0x1f2924, roughness: 0.3, metalness: 0.8 })
    );
    phoneBox.name = 'prop_lounge_payphone';
    phoneGroup.add(phoneBox);

    // Instruction Placard
    const placard = new THREE.Mesh(
      new THREE.PlaneGeometry(0.26, 0.14),
      new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.4 })
    );
    placard.position.set(0, 0.22, 0.126);
    placard.raycast = () => {};
    phoneGroup.add(placard);

    const rotaryDial = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.02, 16), matBrass);
    rotaryDial.rotation.x = Math.PI / 2;
    rotaryDial.position.set(0, -0.02, 0.135);
    rotaryDial.raycast = () => {};
    phoneGroup.add(rotaryDial);

    // Handset receiver
    this.payphoneMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 0.5, 0.12),
      new THREE.MeshStandardMaterial({ color: 0x111613, roughness: 0.4 })
    );
    this.payphoneMesh.position.set(-0.24, 0.02, 0.12);
    this.payphoneMesh.name = 'prop_lounge_payphone';
    phoneGroup.add(this.payphoneMesh);

    // Armored Flexible Metal Cord (Curved tube)
    const cordCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.24, -0.22, 0.12),
      new THREE.Vector3(-0.20, -0.45, 0.10),
      new THREE.Vector3(-0.08, -0.42, 0.08),
      new THREE.Vector3(0.0, -0.35, 0.10)
    ]);
    const cord = new THREE.Mesh(new THREE.TubeGeometry(cordCurve, 16, 0.012, 8, false), matCastIron);
    cord.raycast = () => {};
    phoneGroup.add(cord);

    this.group.add(phoneGroup);

    // Mood Lighting: Warm Amber Spotlights
    const barSpot = new THREE.SpotLight(0xf59e0b, 2.6, 9, Math.PI / 5, 0.35);
    barSpot.position.set(-1.8, 3.8, 0);
    barSpot.target = barTop;
    barSpot.castShadow = true;
    this.group.add(barSpot);

    const tableSpot = new THREE.SpotLight(0xf59e0b, 2.2, 8, Math.PI / 6, 0.3);
    tableSpot.position.set(-1.4, 3.8, -4.5);
    tableSpot.target = tableTop;
    tableSpot.castShadow = true;
    this.group.add(tableSpot);

    const phoneSpot = new THREE.SpotLight(0xf59e0b, 1.8, 8, Math.PI / 5, 0.35);
    phoneSpot.position.set(2.6, 3.8, -1.5);
    phoneSpot.target = phoneBox;
    this.group.add(phoneSpot);

    // Audio Ambiance
    const audio = AudioEngine.getInstance();
    audio.playLoungeJazzTheme();
    audio.playPayphoneMechanicalRing();

    return this.group;
  }

  public teardown(scene: THREE.Scene): void {
    const audio = AudioEngine.getInstance();
    audio.stopPayphoneRing();
    audio.teardownScenarioAudio();
    this.switchboardScreen.teardown();

    if (this.group) {
      scene.remove(this.group);
      this.group = null;
    }
    this.payphoneMesh = null;
    this.mirrorMesh = null;
    this.decanterMesh = null;
  }

  public onObjectClick(objectId: string): boolean {
    const bus = EventBus.getInstance();
    const audio = AudioEngine.getInstance();

    if (objectId === 'door_return_hub') {
      bus.emit('scenario:switch_room', { targetRoomId: 'room_04' });
      return true;
    }

    if (objectId === 'prop_switchboard') {
      audio.playTumblerClick();
      bus.emit('camera:move_to_hotspot', { hotspotId: 'switchboard' });
      this.switchboardScreen.open();
      return true;
    }

    if (objectId === 'prop_crystal_decanter' || objectId.includes('mirror')) {
      audio.playToneAlignmentSweep(220);
      bus.emit('puzzle:mirror_inspected', {});
      bus.emit('camera:move_to_hotspot', { hotspotId: 'mirror' });
      this.switchboardScreen.open();
      return true;
    }

    if (objectId === 'prop_bar_mirror_glass' || objectId === 'prop_bar_mirror_silhouette') {
      audio.playTumblerClick();
      bus.emit('camera:move_to_hotspot', { hotspotId: 'mirror' });
      bus.emit('ui:subtitle_changed', {
        text: 'The gilded mirror reflects a hollow silhouette staring back. Place the crystal decanter to clarify the alignment.'
      });
      return true;
    }

    if (objectId.includes('whiskey') || objectId.includes('bar')) {
      audio.playTumblerClick();
      bus.emit('ui:subtitle_changed', {
        text: 'The amber liquid is cold. The ice cubes have long ceased melting. The payphone continues to ring.'
      });
      return true;
    }

    if (objectId.includes('payphone')) {
      const state = this.switchboardScreen.getState();
      if (!state.switchboardPatched || !state.decanterPlaced) {
        audio.playTumblerClick();
        bus.emit('ui:subtitle_changed', {
          text: 'The rotary payphone rings erratically. The circuit is dead until the decanter is placed and the switchboard trunk line is connected.'
        });
        return true;
      }
      if (!this.payphoneAnswered) {
        this.payphoneAnswered = true;

        audio.stopPayphoneRing();
        audio.playHandsetClick();

        if (this.payphoneMesh) {
          this.payphoneMesh.rotation.z = 0.4;
          this.payphoneMesh.position.x -= 0.1;
        }

        bus.emit('ui:subtitle_changed', {
          text: 'You lift the receiver. Total acoustic vacuum. A deadened, familiar voice speaks through the earpiece...'
        });

        audio.speakTerminalMessage(() => {
          bus.emit('ui:subtitle_changed', {
            text: '"The exit is open. The cure is spreading. Thank you for your compliance."'
          });

          audio.play528HzSonicBlast(4.0);

          setTimeout(() => {
            bus.emit('ui:view_changed', { view: 'terminal_blackout' });
          }, 800);
        });
      }
      return true;
    }

    return false;
  }
}
