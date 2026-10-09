import * as THREE from 'three';
import { HotspotAnchor } from '../types';
import { Room04_SterileChamber } from './Room04_SterileChamber';
import { EventBus } from '../core/EventBus';
import { GalvanometerGridScreen } from '../ui/screens/GalvanometerGridScreen';
import { AudioEngine } from '../audio/AudioEngine';

export class Room07_SynthesisChamber extends Room04_SterileChamber {
  public override id = 'synthesis_blackout';
  public override title = 'The Synthesis Chamber';
  public override actTitle = 'ACT VII • THE SYNTHESIS / EGRESS';
  public override roomCode = 'Airlock Sector 07 • Threshold';
  public override defaultHotspot = 'door';

  public override hotspots: Record<string, HotspotAnchor> = {
    door: {
      id: 'door',
      name: 'I. The Open Blastdoor Threshold',
      position: new THREE.Vector3(-6.75, 1.6, -3.0),
      interactionPrompt: '[ENTER: VELVET LOUNGE]',
      cameraPreset: {
        name: 'door',
        position: new THREE.Vector3(-3.2, 1.8, -3.0),
        target: new THREE.Vector3(-6.75, 1.8, -3.0)
      }
    },
    overview: {
      id: 'overview',
      name: 'II. Blackout Chamber',
      position: new THREE.Vector3(0, 1.2, 0),
      interactionPrompt: 'Blackout Overview',
      cameraPreset: {
        name: 'overview',
        position: new THREE.Vector3(4.2, 2.6, 4.4),
        target: new THREE.Vector3(0, 0.85, 0)
      }
    },
    vault: {
      id: 'vault',
      name: 'III. Overloaded Apparatus',
      position: new THREE.Vector3(0, 1.25, 0),
      interactionPrompt: '[INSPECT OVERLOADED APPARATUS]',
      cameraPreset: {
        name: 'vault',
        position: new THREE.Vector3(0, 1.35, 1.75),
        target: new THREE.Vector3(0, 1.15, 0)
      }
    },
    grid: {
      id: 'grid',
      name: 'IV. Galvanometer Grid',
      position: new THREE.Vector3(-3.0, 1.4, 0.0),
      interactionPrompt: '[INSPECT POWER BUS]',
      cameraPreset: {
        name: 'grid',
        position: new THREE.Vector3(-1.8, 1.5, 0.0),
        target: new THREE.Vector3(-3.0, 1.4, 0.0)
      }
    },
    corridor: {
      id: 'corridor',
      name: 'V. Sealed Corridor',
      position: new THREE.Vector3(0, 1.8, -6.5),
      interactionPrompt: '[INSPECT SEALED CORRIDOR]',
      cameraPreset: {
        name: 'corridor',
        position: new THREE.Vector3(0, 1.8, -4.0),
        target: new THREE.Vector3(0, 1.8, -6.75)
      }
    }
  };

  private galvanometerScreen: GalvanometerGridScreen = new GalvanometerGridScreen();

  public override async buildScene(scene: THREE.Scene): Promise<THREE.Group> {
    const group = await super.buildScene(scene);

    if (this.entities) {
      this.entities.group.traverse((child) => {
        if (child instanceof THREE.Light) {
          child.intensity = 0;
        }
      });

      this.exitBlownOpen = true;
      (this.entities.doorLed.material as THREE.MeshBasicMaterial).color.setHex(0x4ade80);
      const exitDoor = this.entities.exitDoorPanel;
      exitDoor.position.z = exitDoor.userData.animEnd !== undefined ? exitDoor.userData.animEnd : -4.35;

      this.corridorDoorOpen = false;
      const corridorDoor = this.entities.corridorDoor;
      corridorDoor.rotation.y = 0;
      (this.entities.corridorLed.material as THREE.MeshBasicMaterial).color.setHex(0xef4444);

      const exitGlow = new THREE.PointLight(0xf59e0b, 3.8, 14);
      exitGlow.position.set(-6.6, 1.8, -3.0);
      exitGlow.name = 'amber_exit_spill_light';
      this.entities.group.add(exitGlow);

      // Galvanometer Grid Wall Console Mesh
      const gridConsole = new THREE.Group();
      gridConsole.position.set(-3.2, 1.4, 0.0);
      gridConsole.rotation.y = Math.PI / 2;
      gridConsole.name = 'prop_galvanometer_grid';

      const panelMesh = new THREE.Mesh(
        new THREE.BoxGeometry(1.6, 0.9, 0.15),
        new THREE.MeshStandardMaterial({ color: 0x18201c, roughness: 0.6, metalness: 0.4 })
      );
      gridConsole.add(panelMesh);

      // 5 miniature dials on panel
      [-0.6, -0.3, 0, 0.3, 0.6].forEach(x => {
        const dial = new THREE.Mesh(
          new THREE.CylinderGeometry(0.08, 0.08, 0.03, 16),
          new THREE.MeshStandardMaterial({ color: 0x090e0c, roughness: 0.2 })
        );
        dial.rotation.x = Math.PI / 2;
        dial.position.set(x, 0.15, 0.09);
        gridConsole.add(dial);
      });

      this.entities.group.add(gridConsole);
    }

    return group;
  }

  public override teardown(scene: THREE.Scene): void {
    this.galvanometerScreen.teardown();
    super.teardown(scene);
  }

  public override onObjectClick(objectId: string): boolean {
    const bus = EventBus.getInstance();
    const audio = AudioEngine.getInstance();

    if (objectId === 'prop_door' || objectId === 'exit_airlock_passage') {
      bus.emit('scenario:switch_room', { targetRoomId: 'velvet_lounge' });
      return true;
    }

    if (objectId === 'prop_galvanometer_grid') {
      if (this.galvanometerScreen.getState().gridBalanced) {
        bus.emit('camera:move_to_hotspot', { hotspotId: 'grid' });
        bus.emit('ui:subtitle_changed', {
          text: 'The 5-channel circuit bus is balanced at 100 Ohms. Hydraulic blast clamps released.'
        });
        return true;
      }
      audio.playTumblerClick();
      bus.emit('camera:move_to_hotspot', { hotspotId: 'grid' });
      this.galvanometerScreen.open();
      return true;
    }

    if (objectId === 'door_corridor' || objectId === 'door_corridor_passage') {
      bus.emit('camera:move_to_hotspot', { hotspotId: 'corridor' });
      bus.emit('ui:subtitle_changed', {
        text: 'The observation corridor behind you has collapsed under containment pressure. Egress through the unsealed blastdoor.'
      });
      return true;
    }

    if (objectId === 'prop_vault' || objectId === 'prop_oscilloscope') {
      bus.emit('camera:move_to_hotspot', { hotspotId: 'vault' });
      bus.emit('ui:subtitle_changed', {
        text: 'All 5 mnemonic crystals have merged in the cathode core. Synthesis complete. The facility is venting atmosphere.'
      });
      return true;
    }

    if (objectId === 'prop_telephone') {
      bus.emit('camera:move_to_hotspot', { hotspotId: 'telephone' });
      bus.emit('ui:subtitle_changed', {
        text: 'The receiver emits only faint, rhythmic wet breathing against the microphone.'
      });
      return true;
    }

    return super.onObjectClick(objectId);
  }
}
