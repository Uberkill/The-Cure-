import * as THREE from 'three';
import { RoomScenario, HotspotAnchor, GameStage, DecayLevel } from '../types';
import { ProceduralRoom04, Room04Entities } from '../entities/ProceduralRoom04';
import { EventBus } from '../core/EventBus';
import { GameState } from '../core/GameState';
import { AudioEngine } from '../audio/AudioEngine';
import { HubDecayManager } from '../entities/HubDecayManager';

export class Room04_SterileChamber implements RoomScenario {
  public id = 'room_04';
  public title = 'The Sterile Chamber';
  public actTitle = 'ACT I • THE RECEPTION';
  public roomCode = 'Room 04 • Sanatorium of Cognitive Alignment';
  public defaultHotspot = 'overview';

  public hotspots: Record<string, HotspotAnchor> = {
    overview: {
      id: 'overview',
      name: 'I. Overview',
      position: new THREE.Vector3(0, 1.2, 0),
      interactionPrompt: 'Chamber Overview',
      cameraPreset: {
        name: 'overview',
        position: new THREE.Vector3(4.2, 2.6, 4.4),
        target: new THREE.Vector3(0, 0.85, 0)
      }
    },
    vault: {
      id: 'vault',
      name: 'II. The Vault & CRT',
      position: new THREE.Vector3(0, 1.25, 0),
      interactionPrompt: '[INSPECT CRT OSCILLOSCOPE]',
      cameraPreset: {
        name: 'vault',
        position: new THREE.Vector3(0, 1.35, 1.75),
        target: new THREE.Vector3(0, 1.15, 0)
      }
    },
    telephone: {
      id: 'telephone',
      name: 'III. The Telephone',
      position: new THREE.Vector3(0.75, 0.9, 0.22),
      interactionPrompt: '[CLICK TO LISTEN]',
      cameraPreset: {
        name: 'telephone',
        position: new THREE.Vector3(0.75, 1.45, 0.85),
        target: new THREE.Vector3(0.75, 0.9, 0.22)
      }
    },
    envelope: {
      id: 'envelope',
      name: 'IV. The Envelope',
      position: new THREE.Vector3(-0.75, 0.88, 0.22),
      interactionPrompt: '[CLICK TO READ DOSSIER]',
      cameraPreset: {
        name: 'envelope',
        position: new THREE.Vector3(-0.75, 1.65, 0.55),
        target: new THREE.Vector3(-0.75, 0.88, 0.22)
      }
    },
    corridor: {
      id: 'corridor',
      name: 'V. Observation Corridor',
      position: new THREE.Vector3(0, 1.8, -6.5),
      interactionPrompt: '[ENTER: OBSERVATION CORRIDOR]',
      cameraPreset: {
        name: 'corridor',
        position: new THREE.Vector3(0, 1.8, -4.0),
        target: new THREE.Vector3(0, 1.8, -6.75)
      }
    },
    door: {
      id: 'door',
      name: 'VI. The Exit Blastdoor',
      position: new THREE.Vector3(-6.75, 1.6, -3.0),
      interactionPrompt: '[CLICK TO INSPECT EXIT]',
      cameraPreset: {
        name: 'door',
        position: new THREE.Vector3(-3.2, 1.8, -3.0),
        target: new THREE.Vector3(-6.75, 1.8, -3.0)
      }
    }
  };

  private entities: Room04Entities | null = null;
  private unsubscribers: Array<() => void> = [];
  private audioElement: AudioEngine;
  private decayManager: HubDecayManager;

  private exitBlownOpen: boolean = false;

  public constructor() {
    this.audioElement = AudioEngine.getInstance();
    this.decayManager = HubDecayManager.getInstance();
  }

  public async buildScene(_scene: THREE.Scene): Promise<THREE.Group> {
    this.entities = ProceduralRoom04.build();

    this.setupEventListeners();

    // Reapply progressive decay based on authoritative GameState stage
    const stage = GameState.getInstance().getStage();
    let decayLevel: DecayLevel = 0;
    if (stage >= GameStage.ACT_5_PATCH_4_COMPLETE) decayLevel = 4;
    else if (stage >= GameStage.ACT_4_PATCH_3_COMPLETE) decayLevel = 3;
    else if (stage >= GameStage.ACT_3_PATCH_2_COMPLETE) decayLevel = 2;
    else if (stage >= GameStage.ACT_2_PATCH_1_COMPLETE) decayLevel = 1;
    this.decayManager.setDecayLevel(decayLevel, this.entities.group);

    if (stage >= GameStage.ACT_7_SYNTHESIS_BLACKOUT) {
      this.exitBlownOpen = true;
      (this.entities.doorLed.material as THREE.MeshBasicMaterial).color.setHex(0x4ade80);
    }
    if (stage >= GameStage.ACT_1_HUB_CORRIDOR_OPEN) {
      (this.entities.corridorLed.material as THREE.MeshBasicMaterial).color.setHex(0x4ade80);
    }

    return this.entities.group;
  }

  private setupEventListeners(): void {
    const bus = EventBus.getInstance();

    const unsubStage = bus.on('game:stage_transition', ({ to }) => {
      if (!this.entities) return;

      if (to === GameStage.ACT_1_HUB_CORRIDOR_OPEN) {
        this.animateDepressurization();
      }

      if (to === GameStage.ACT_2_PATCH_1_COMPLETE) {
        this.decayManager.setDecayLevel(1, this.entities.group);
      } else if (to === GameStage.ACT_3_PATCH_2_COMPLETE) {
        this.decayManager.setDecayLevel(2, this.entities.group);
      } else if (to === GameStage.ACT_4_PATCH_3_COMPLETE) {
        this.decayManager.setDecayLevel(3, this.entities.group);
      } else if (to === GameStage.ACT_5_PATCH_4_COMPLETE) {
        this.decayManager.setDecayLevel(4, this.entities.group);
      } else if (to === GameStage.ACT_7_SYNTHESIS_BLACKOUT) {
        this.triggerActVIIBlackout();
      }
    });
    this.unsubscribers.push(unsubStage);

    const unsubFreq = bus.on('puzzle:frequency_changed', ({ frequency }) => {
      if (!this.entities) return;
      const angle = ((frequency - 400) / 300) * Math.PI * 2;
      this.entities.rotaryDial.rotation.z = angle;
    });
    this.unsubscribers.push(unsubFreq);

    const unsubSwitch = bus.on('puzzle:switch_thrown', () => {
      this.animateKnifeSwitch();
    });
    this.unsubscribers.push(unsubSwitch);
  }

  private getNextSpokeRoomId(): string {
    const stage = GameState.getInstance().getStage();
    if (stage <= GameStage.ACT_2_CRYSTAL_1_RECOVERED) return 'sleep_ward';
    if (stage <= GameStage.ACT_3_CRYSTAL_2_RECOVERED) return 'hydrotherapy';
    if (stage <= GameStage.ACT_4_CRYSTAL_3_RECOVERED) return 'audiology';
    if (stage <= GameStage.ACT_5_CRYSTAL_4_RECOVERED) return 'archive';
    return 'directors_office';
  }

  private animateDepressurization(): void {
    if (!this.entities) return;
    (this.entities.corridorLed.material as THREE.MeshBasicMaterial).color.setHex(0x4ade80);
    this.audioElement.playPneumaticHiss();
  }

  private animateKnifeSwitch(): void {
    if (!this.entities) return;
    const knife = this.entities.knifeSwitch;
    const startRot = knife.rotation.x;
    const targetRot = startRot - 0.95;
    const startTime = performance.now();

    const switchAnim = () => {
      const elapsed = (performance.now() - startTime) / 300;
      if (elapsed < 1) {
        knife.rotation.x = startRot + (targetRot - startRot) * elapsed;
        requestAnimationFrame(switchAnim);
      } else {
        knife.rotation.x = targetRot;
      }
    };
    switchAnim();
    this.audioElement.playTumblerClick();
  }

  private triggerActVIIBlackout(): void {
    if (!this.entities) return;
    const bus = EventBus.getInstance();

    // 1. Cut all lights
    this.entities.group.traverse((child) => {
      if (child instanceof THREE.Light) {
        child.intensity = 0;
      }
    });

    // 2. Play 3s acoustic void and blow exit door open
    setTimeout(() => {
      this.audioElement.playPneumaticHiss();
      this.exitBlownOpen = true;

      // Glow amber through open exit door on left wall
      const exitGlow = new THREE.PointLight(0xf59e0b, 3.5, 12);
      exitGlow.position.set(-6.6, 1.8, -3.0);
      this.entities?.group.add(exitGlow);

      bus.emit('ui:subtitle_changed', {
        text: 'The heavy blast door unseals with a deafening concussive gasp of air. Warm amber light spills through the threshold.'
      });
    }, 3000);
  }

  public teardown(_scene: THREE.Scene): void {
    for (const unsub of this.unsubscribers) unsub();
    this.unsubscribers = [];
    this.entities = null;
  }

  public onObjectClick(objectId: string): boolean {
    const bus = EventBus.getInstance();

    if (objectId === 'door_corridor') {
      const stage = GameState.getInstance().getStage();
      if (stage >= GameStage.ACT_1_HUB_CORRIDOR_OPEN) {
        bus.emit('scenario:switch_room', { targetRoomId: this.getNextSpokeRoomId() });
      } else {
        bus.emit('camera:move_to_hotspot', { hotspotId: 'corridor' });
        bus.emit('ui:subtitle_changed', {
          text: 'The observation corridor is sealed. Complete the Phase I harmonic tuning to 528 Hz on the desk terminal.'
        });
      }
      return true;
    }

    if (objectId === 'prop_door') {
      const stage = GameState.getInstance().getStage();
      if (this.exitBlownOpen || stage >= GameStage.ACT_7_SYNTHESIS_BLACKOUT) {
        bus.emit('scenario:switch_room', { targetRoomId: 'velvet_lounge' });
      } else {
        bus.emit('camera:move_to_hotspot', { hotspotId: 'door' });
        bus.emit('ui:subtitle_changed', {
          text: 'The heavy steel exit blastdoor is locked from the outside. The indicator light is red.'
        });
      }
      return true;
    }

    if (objectId === 'prop_vault' || objectId === 'prop_oscilloscope') {
      return false; // Handled cleanly by GameState without re-emitting or recursion
    }

    return false;
  }

  public update(_delta: number): void {
    if (this.entities) {
      this.entities.updateOscilloscope(440, false, performance.now() * 0.001);
    }
  }
}
