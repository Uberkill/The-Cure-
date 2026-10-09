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
      name: 'III. Gilded Mirror',
      position: new THREE.Vector3(-1.4, 2.0, -2.8),
      interactionPrompt: '[INSPECT REFLECTION]',
      cameraPreset: {
        name: 'mirror',
        position: new THREE.Vector3(-1.4, 1.8, -1.0),
        target: new THREE.Vector3(-1.4, 1.8, -2.9)
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
  private payphoneAnswered: boolean = false;
  private switchboardScreen: SwitchboardMirrorScreen = new SwitchboardMirrorScreen();

  public async buildScene(_scene: THREE.Scene): Promise<THREE.Group> {
    this.group = new THREE.Group();

    // David Lynchian Materials: Heavy Red Velvet & Smoked Mahogany
    const matVelvet = new THREE.MeshStandardMaterial({
      color: 0x661217,
      roughness: 0.95,
      metalness: 0.05
    });
    const matMahogany = new THREE.MeshStandardMaterial({
      color: 0x1f140e,
      roughness: 0.25,
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
    const matGlass = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transmission: 0.9,
      roughness: 0.1,
      transparent: true,
      opacity: 0.85
    });
    const matAmberLiquor = new THREE.MeshStandardMaterial({
      color: 0xd97706,
      roughness: 0.2
    });
    const matSilhouette = new THREE.MeshBasicMaterial({
      color: 0x050505
    });

    // Floor: Black-and-white chevron zigzag
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(16, 16), matChevron);
    floor.rotation.x = -Math.PI / 2;
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

    // Mahogany Bar Counter
    const barTop = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.12, 1.2), matMahogany);
    barTop.position.set(-1.8, 1.05, 0);
    barTop.castShadow = true;
    this.group.add(barTop);

    // The Solitary Lowball Glass of Amber Whiskey
    const glassGroup = new THREE.Group();
    glassGroup.position.set(-1.4, 1.15, 0);
    glassGroup.name = 'prop_whiskey_glass';

    const tumbler = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.07, 0.14, 16), matGlass);
    glassGroup.add(tumbler);

    const whiskey = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.065, 0.08, 16), matAmberLiquor);
    whiskey.position.y = -0.02;
    glassGroup.add(whiskey);
    this.group.add(glassGroup);

    // The Large Gilded Mirror
    const mirrorFrame = new THREE.Mesh(new THREE.BoxGeometry(2.4, 3.2, 0.12), matBrass);
    mirrorFrame.position.set(-1.4, 2.1, -5.7);
    this.group.add(mirrorFrame);

    this.mirrorMesh = new THREE.Mesh(new THREE.PlaneGeometry(2.1, 2.9), new THREE.MeshStandardMaterial({
      color: 0x111613,
      metalness: 0.95,
      roughness: 0.05
    }));
    this.mirrorMesh.position.set(-1.4, 2.1, -5.63);
    this.mirrorMesh.name = 'prop_lounge_mirror';
    this.group.add(this.mirrorMesh);

    // Featureless Black Silhouette
    const silhouette = new THREE.Mesh(new THREE.CapsuleGeometry(0.35, 1.1, 8, 16), matSilhouette);
    silhouette.position.set(-1.4, 1.8, -5.55);
    silhouette.name = 'prop_silhouette';
    this.group.add(silhouette);

    // Vintage Operator Switchboard Wall Terminal
    const switchboardGroup = new THREE.Group();
    switchboardGroup.position.set(1.2, 1.8, 0);
    switchboardGroup.rotation.y = -Math.PI / 2;
    switchboardGroup.name = 'prop_switchboard';

    const switchboardCase = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 0.8, 0.2),
      new THREE.MeshStandardMaterial({ color: 0x19211c, roughness: 0.6, metalness: 0.3 })
    );
    switchboardGroup.add(switchboardCase);

    const jackFace = new THREE.Mesh(
      new THREE.PlaneGeometry(1.0, 0.6),
      new THREE.MeshStandardMaterial({ color: 0x090e0c, roughness: 0.2 })
    );
    jackFace.position.z = 0.101;
    switchboardGroup.add(jackFace);
    this.group.add(switchboardGroup);

    // Ringing Vintage Payphone on Wall
    const phoneGroup = new THREE.Group();
    phoneGroup.position.set(2.6, 1.8, -1.5);
    phoneGroup.name = 'prop_lounge_payphone';

    const phoneBox = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.7, 0.25), new THREE.MeshStandardMaterial({
      color: 0x1f2924,
      roughness: 0.3,
      metalness: 0.8
    }));
    phoneBox.name = 'prop_lounge_payphone';
    phoneGroup.add(phoneBox);

    const rotaryDial = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.02, 16), matBrass);
    rotaryDial.rotation.x = Math.PI / 2;
    rotaryDial.position.set(0, 0.08, 0.15);
    phoneGroup.add(rotaryDial);

    // Handset receiver
    this.payphoneMesh = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.5, 0.12), new THREE.MeshStandardMaterial({
      color: 0x111613,
      roughness: 0.4
    }));
    this.payphoneMesh.position.set(-0.24, 0.02, 0.1);
    this.payphoneMesh.name = 'prop_lounge_payphone';
    phoneGroup.add(this.payphoneMesh);

    this.group.add(phoneGroup);

    // Mood Lighting: Low Amber Pendant Pools
    const amberSpot1 = new THREE.SpotLight(0xf59e0b, 2.4, 8, Math.PI / 5, 0.35);
    amberSpot1.position.set(-2.2, 3.8, 0);
    amberSpot1.target = barTop;
    amberSpot1.castShadow = true;
    this.group.add(amberSpot1);

    const amberSpot2 = new THREE.SpotLight(0xf59e0b, 1.8, 8, Math.PI / 5, 0.35);
    amberSpot2.position.set(4.0, 3.8, -1.5);
    amberSpot2.target = phoneBox;
    this.group.add(amberSpot2);

    // Start authentic mechanical payphone ring and Rhodes jazz loop
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
  }

  public onObjectClick(objectId: string): boolean {
    const bus = EventBus.getInstance();
    const audio = AudioEngine.getInstance();

    if (objectId === 'prop_switchboard') {
      audio.playTumblerClick();
      bus.emit('camera:move_to_hotspot', { hotspotId: 'switchboard' });
      this.switchboardScreen.open();
      return true;
    }

    if (objectId.includes('mirror')) {
      audio.playToneAlignmentSweep(220);
      bus.emit('puzzle:mirror_inspected', {});
      bus.emit('camera:move_to_hotspot', { hotspotId: 'mirror' });
      this.switchboardScreen.open();
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
      if (!this.payphoneAnswered) {
        this.payphoneAnswered = true;

        // 1. Instantly silence the mechanical ring
        audio.stopPayphoneRing();
        audio.playHandsetClick();

        if (this.payphoneMesh) {
          this.payphoneMesh.rotation.z = 0.4;
          this.payphoneMesh.position.x -= 0.1;
        }

        bus.emit('ui:subtitle_changed', {
          text: 'You lift the receiver. Total acoustic vacuum. A deadened, familiar voice speaks through the earpiece...'
        });

        // 2. Play spoken message: "The exit is open. The cure is spreading. Thank you for your compliance."
        audio.speakTerminalMessage(() => {
          // 3. Immediately on completion, trigger the 528 Hz sonic blast concussion!
          bus.emit('ui:subtitle_changed', {
            text: '"The exit is open. The cure is spreading. Thank you for your compliance."'
          });

          audio.play528HzSonicBlast(4.0);

          // 4. Cut to pure terminal blackout
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
