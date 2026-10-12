import * as THREE from 'three';
import { HotspotAnchor } from '../types';
import { Room04_SterileChamber } from './Room04_SterileChamber';
import { EventBus } from '../core/EventBus';
import { GalvanometerGridScreen } from '../ui/screens/GalvanometerGridScreen';
import { AudioEngine } from '../audio/AudioEngine';
import { GameState } from '../core/GameState';

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

      // Overloaded Specimen Cathode Core Discharge
      if (this.entities.specimenCore) {
        (this.entities.specimenCore.material as THREE.MeshStandardMaterial).emissive.setHex(0x4ade80);
        (this.entities.specimenCore.material as THREE.MeshStandardMaterial).emissiveIntensity = 2.4;

        const coreAura = new THREE.PointLight(0x4ade80, 2.2, 5);
        coreAura.position.copy(this.entities.specimenCore.position);
        coreAura.name = 'mesh_cathode_discharge_light';
        this.entities.vaultGroup.add(coreAura);

        const fluxRing = new THREE.Mesh(
          new THREE.TorusGeometry(0.24, 0.012, 8, 24),
          new THREE.MeshBasicMaterial({ color: 0x86efac })
        );
        fluxRing.position.copy(this.entities.specimenCore.position);
        fluxRing.rotation.x = Math.PI / 3;
        fluxRing.raycast = () => {};
        this.entities.vaultGroup.add(fluxRing);
      }

      // Articulated 5-Channel Galvanometer Grid Wall Console
      const gridConsole = new THREE.Group();
      gridConsole.position.set(-3.2, 1.4, 0.0);
      gridConsole.rotation.y = Math.PI / 2;
      gridConsole.name = 'prop_galvanometer_grid';

      const panelMesh = new THREE.Mesh(
        new THREE.BoxGeometry(1.85, 1.15, 0.22),
        new THREE.MeshStandardMaterial({ color: 0x161e1a, roughness: 0.55, metalness: 0.5 })
      );
      panelMesh.castShadow = true;
      gridConsole.add(panelMesh);

      const matMeterFace = new THREE.MeshBasicMaterial({ color: 0x86efac });
      const matMeterBezel = new THREE.MeshStandardMaterial({ color: 0xc28833, metalness: 0.85, roughness: 0.25 });

      [-0.72, -0.36, 0.0, 0.36, 0.72].forEach((mx) => {
        const meterCase = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.22, 0.04), matMeterBezel);
        meterCase.position.set(mx, 0.32, 0.12);
        meterCase.raycast = () => {};
        gridConsole.add(meterCase);

        const meterScale = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 0.16), matMeterFace);
        meterScale.position.set(mx, 0.32, 0.142);
        meterScale.raycast = () => {};
        gridConsole.add(meterScale);

        const needle = new THREE.Mesh(
          new THREE.BoxGeometry(0.006, 0.12, 0.002),
          new THREE.MeshBasicMaterial({ color: 0x0a0f0d })
        );
        needle.position.set(mx, 0.30, 0.144);
        needle.raycast = () => {};
        gridConsole.add(needle);

        const sliderTrack = new THREE.Mesh(
          new THREE.BoxGeometry(0.04, 0.32, 0.02),
          new THREE.MeshStandardMaterial({ color: 0x080b09, roughness: 0.8 })
        );
        sliderTrack.position.set(mx, -0.05, 0.12);
        sliderTrack.raycast = () => {};
        gridConsole.add(sliderTrack);

        const sliderKnob = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.04, 0.03), matMeterBezel);
        sliderKnob.position.set(mx, -0.05, 0.135);
        sliderKnob.raycast = () => {};
        gridConsole.add(sliderKnob);
      });

      const breakerBox = new THREE.Mesh(
        new THREE.BoxGeometry(0.18, 0.22, 0.06),
        new THREE.MeshStandardMaterial({ color: 0x991b1b, roughness: 0.4 })
      );
      breakerBox.position.set(0.78, 0.32, 0.15);
      breakerBox.raycast = () => {};
      gridConsole.add(breakerBox);

      const busLever = new THREE.Mesh(
        new THREE.BoxGeometry(0.55, 0.08, 0.08),
        new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.3, metalness: 0.6 })
      );
      busLever.position.set(0, -0.38, 0.16);
      busLever.raycast = () => {};
      gridConsole.add(busLever);

      gridConsole.userData.interactionPrompt = '[INSPECT: POWER BUS GALVANOMETER]';
      this.entities.group.add(gridConsole);

      // Heavy Copper Power Conduits Running from Console to Vault
      const busbarGeo = new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3([
          new THREE.Vector3(-3.2, 0.8, 0.0),
          new THREE.Vector3(-2.2, 0.2, 0.0),
          new THREE.Vector3(-1.2, 0.2, 0.0),
          new THREE.Vector3(0.0, 0.4, 0.0)
        ]),
        24, 0.05, 8, false
      );
      const busbar = new THREE.Mesh(
        busbarGeo,
        new THREE.MeshStandardMaterial({ color: 0xb45309, metalness: 0.85, roughness: 0.25 })
      );
      busbar.raycast = () => {};
      this.entities.group.add(busbar);

      // Floor Debris (scattered fallen tiles; decorative)
      for (let d = 0; d < 8; d++) {
        const debrisTile = new THREE.Mesh(
          new THREE.BoxGeometry(0.35, 0.02, 0.35),
          new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.8 })
        );
        debrisTile.position.set(-1.5 + (Math.random() - 0.5) * 3, 0.012, (Math.random() - 0.5) * 3);
        debrisTile.rotation.y = Math.random() * Math.PI;
        debrisTile.raycast = () => {};
        this.entities.group.add(debrisTile);
      }
    }

    if (GameState.getInstance().isSynthesisComplete()) {
      this.galvanometerScreen.hydrate({
        insertedCrystals: ['crystal_01_quartz', 'crystal_02_bronze', 'crystal_03_amethyst', 'crystal_04_obsidian', 'crystal_05_celadon'],
        shuntResistances: [100, 100, 100, 100, 100],
        gridBalanced: true
      });
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
      if (this.galvanometerScreen.getState().gridBalanced || GameState.getInstance().isSynthesisComplete()) {
        bus.emit('scenario:switch_room', { targetRoomId: 'velvet_lounge' });
      } else {
        bus.emit('ui:subtitle_changed', {
          text: 'The heavy blastdoor is electromagnetically locked. The galvanometer circuit bus remains unbalanced.'
        });
      }
      return true;
    }

    if (objectId === 'prop_galvanometer_grid') {
      if (this.galvanometerScreen.getState().gridBalanced || GameState.getInstance().isSynthesisComplete()) {
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
