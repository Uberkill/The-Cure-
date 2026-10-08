import * as THREE from 'three';
import { RoomScenario, HotspotAnchor } from '../types';
import { EventBus } from '../core/EventBus';
import { AudioEngine } from '../audio/AudioEngine';

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
    payphone: {
      id: 'payphone',
      name: 'IV. Ringing Payphone',
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

    // Dark Chevron Wood Parquet Floor
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(14, 14), matChevron);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this.group.add(floor);

    // Ceiling
    const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(14, 14), matMahogany);
    ceiling.position.y = 4.2;
    ceiling.rotation.x = Math.PI / 2;
    this.group.add(ceiling);

    // Heavy Pleated Red Velvet Curtain Walls
    const wallBack = new THREE.Mesh(new THREE.BoxGeometry(14, 4.2, 0.4), matVelvet);
    wallBack.position.set(0, 2.1, -7);
    this.group.add(wallBack);

    const wallFront = new THREE.Mesh(new THREE.BoxGeometry(14, 4.2, 0.4), matVelvet);
    wallFront.position.set(0, 2.1, 7);
    this.group.add(wallFront);

    const wallLeft = new THREE.Mesh(new THREE.BoxGeometry(0.4, 4.2, 14), matVelvet);
    wallLeft.position.set(-7, 2.1, 0);
    this.group.add(wallLeft);

    const wallRight = new THREE.Mesh(new THREE.BoxGeometry(0.4, 4.2, 14), matVelvet);
    wallRight.position.set(7, 2.1, 0);
    this.group.add(wallRight);

    // Long Smoked Mahogany Bar Counter
    const barGroup = new THREE.Group();
    barGroup.position.set(-2.2, 0, 0);
    barGroup.name = 'prop_lounge_bar';

    const barTop = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.14, 7.0), matMahogany);
    barTop.position.set(0, 1.1, 0);
    barTop.castShadow = true;
    barTop.receiveShadow = true;
    barGroup.add(barTop);

    const barBody = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.05, 6.8), matMahogany);
    barBody.position.set(0, 0.525, 0);
    barGroup.add(barBody);

    // Brass Footrail
    const footrail = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 6.8, 16), matBrass);
    footrail.position.set(0.7, 0.15, 0);
    barGroup.add(footrail);

    // Tumbler Glass with Melting Ice & Amber Whiskey
    const tumbler = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.05, 0.12, 16), matGlass);
    tumbler.position.set(0.1, 1.23, 0.5);
    tumbler.name = 'prop_whiskey_glass';
    barGroup.add(tumbler);

    const whiskey = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.048, 0.06, 16), matAmberLiquor);
    whiskey.position.set(0.1, 1.20, 0.5);
    barGroup.add(whiskey);

    this.group.add(barGroup);

    // Gilded Bar Mirror with Pitch-Black Silhouette Reflection
    const mirrorGroup = new THREE.Group();
    mirrorGroup.position.set(-2.2, 2.2, -3.2);
    mirrorGroup.name = 'prop_bar_mirror';

    const mirrorFrame = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.4, 0.06), matBrass);
    mirrorGroup.add(mirrorFrame);

    this.mirrorMesh = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.2, 0.04), new THREE.MeshStandardMaterial({
      color: 0x1f2420,
      roughness: 0.1,
      metalness: 0.95
    }));
    this.mirrorMesh.position.z = 0.02;
    this.mirrorMesh.name = 'prop_bar_mirror_glass';
    mirrorGroup.add(this.mirrorMesh);

    // The Silhouette Reflection (Uncanny Featureless Void Figure)
    const silhouetteHead = new THREE.Mesh(new THREE.SphereGeometry(0.18, 16, 16), matSilhouette);
    silhouetteHead.position.set(0, 0.1, 0.06);
    silhouetteHead.name = 'prop_bar_mirror_silhouette';
    mirrorGroup.add(silhouetteHead);

    const silhouetteShoulders = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.45, 0.08), matSilhouette);
    silhouetteShoulders.position.set(0, -0.25, 0.06);
    mirrorGroup.add(silhouetteShoulders);

    this.group.add(mirrorGroup);

    // The Solitary Ringing Analog Payphone on Far Wall
    const phoneGroup = new THREE.Group();
    phoneGroup.position.set(4.0, 1.8, -1.5);
    phoneGroup.name = 'prop_lounge_payphone';

    const phoneBox = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.7, 0.28), new THREE.MeshStandardMaterial({
      color: 0x1e2422,
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

    if (objectId.includes('mirror')) {
      audio.playToneAlignmentSweep(220);
      bus.emit('puzzle:mirror_inspected', {});
      bus.emit('ui:subtitle_changed', {
        text: 'You look into the dark gilded mirror. Your face is gone. Only an opaque, featureless black silhouette stares back.'
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
