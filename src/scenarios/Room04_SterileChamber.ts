import * as THREE from 'three';
import { RoomScenario, HotspotAnchor, GameStage, DecayLevel } from '../types';
import { ProceduralRoom04, Room04Entities } from '../entities/ProceduralRoom04';
import { EventBus } from '../core/EventBus';
import { GameState } from '../core/GameState';
import { AudioEngine } from '../audio/AudioEngine';
import { HubDecayManager } from '../entities/HubDecayManager';
import { ModelLoader } from '../loaders/ModelLoader';
import { TektronixCrtScreen } from '../ui/screens/TektronixCrtScreen';
import { EditorServerSync } from '../editor/EditorServerSync';
import { EditorPrefabs } from '../editor/EditorPrefabs';

export class Room04_SterileChamber implements RoomScenario {
  public id = 'room_04';
  public title = 'The Sterile Chamber';
  public actTitle = 'ACT I • THE RECEPTION';
  public roomCode = 'Room 01 • The Sterile Concourse';
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
      interactionPrompt: '[UNSEAL: CLINICAL DOSSIER]',
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
    },
    door_portal_sleep_ward: {
      id: 'door_portal_sleep_ward',
      name: 'VII. Sleep Ward Portal',
      position: new THREE.Vector3(0, 1.8, -6.74),
      interactionPrompt: '[ENTER: SLEEP WARD (SL4-02)]',
      cameraPreset: {
        name: 'door_portal_sleep_ward',
        position: new THREE.Vector3(0, 1.9, -4.8),
        target: new THREE.Vector3(0, 1.8, -6.74)
      }
    },
    door_portal_hydrotherapy: {
      id: 'door_portal_hydrotherapy',
      name: 'V. Hydrotherapy Concourse',
      position: new THREE.Vector3(0, 1.8, -6.72),
      interactionPrompt: '[ENTER: HYDROTHERAPY SUITE (SL4-03)]',
      cameraPreset: {
        name: 'door_portal_hydrotherapy',
        position: new THREE.Vector3(0, 1.9, -4.6),
        target: new THREE.Vector3(0, 1.8, -6.72)
      }
    },
    door_portal_audiology: {
      id: 'door_portal_audiology',
      name: 'VIII. Audiology Vault Portal',
      position: new THREE.Vector3(6.74, 1.8, 0),
      interactionPrompt: '[ENTER: AUDIOLOGY VAULT (SL4-04B)]',
      cameraPreset: {
        name: 'door_portal_audiology',
        position: new THREE.Vector3(4.8, 1.9, 0),
        target: new THREE.Vector3(6.74, 1.8, 0)
      }
    },
    door_portal_archive: {
      id: 'door_portal_archive',
      name: 'IX. Archive & Records Portal',
      position: new THREE.Vector3(6.74, 1.8, 0),
      interactionPrompt: '[ENTER: ARCHIVE & RECORDS (SL4-05)]',
      cameraPreset: {
        name: 'door_portal_archive',
        position: new THREE.Vector3(4.8, 1.9, 0),
        target: new THREE.Vector3(6.74, 1.8, 0)
      }
    },
    door_portal_directors_office: {
      id: 'door_portal_directors_office',
      name: "X. Director's Suite Portal",
      position: new THREE.Vector3(3.8, 1.8, 6.74),
      interactionPrompt: "[ENTER: DIRECTOR'S OFFICE (SL4-06)]",
      cameraPreset: {
        name: 'door_portal_directors_office',
        position: new THREE.Vector3(2.8, 1.9, 4.8),
        target: new THREE.Vector3(3.8, 1.8, 6.74)
      }
    },
    door_portal_synthesis: {
      id: 'door_portal_synthesis',
      name: 'XI. Synthesis Core Portal',
      position: new THREE.Vector3(3.8, 1.8, 6.74),
      interactionPrompt: '[ENTER: SYNTHESIS CORE (SL4-07)]',
      cameraPreset: {
        name: 'door_portal_synthesis',
        position: new THREE.Vector3(2.8, 1.9, 4.8),
        target: new THREE.Vector3(0, 1.0, 0)
      }
    },
    door_portal_velvet_lounge: {
      id: 'door_portal_velvet_lounge',
      name: 'XII. Velvet Lounge Portal',
      position: new THREE.Vector3(-6.74, 1.8, 2.8),
      interactionPrompt: '[ENTER: VELVET LOUNGE (SL4-08)]',
      cameraPreset: {
        name: 'door_portal_velvet_lounge',
        position: new THREE.Vector3(-4.8, 1.9, 2.2),
        target: new THREE.Vector3(0, 1.0, 0)
      }
    }
  };

  protected entities: Room04Entities | null = null;
  protected unsubscribers: Array<() => void> = [];
  protected audioElement: AudioEngine;
  protected decayManager: HubDecayManager;

  protected exitBlownOpen: boolean = false;
  protected tektronixScreen: TektronixCrtScreen;

  public constructor() {
    this.audioElement = AudioEngine.getInstance();
    this.decayManager = HubDecayManager.getInstance();
    this.tektronixScreen = new TektronixCrtScreen();
  }

  public async buildScene(_scene: THREE.Scene): Promise<THREE.Group> {
    this.entities = ProceduralRoom04.build();

    this.setupEventListeners();

    // Reapply progressive decay based on authoritative GameState stage
    const gs = GameState.getInstance();
    const stage = gs.getStage();
    let decayLevel: DecayLevel = 0;
    if (gs.isCrystalPatched('crystal_04_obsidian')) decayLevel = 4;
    else if (gs.isCrystalPatched('crystal_03_amethyst')) decayLevel = 3;
    else if (gs.isCrystalPatched('crystal_02_bronze')) decayLevel = 2;
    else if (gs.isCrystalPatched('crystal_01_quartz')) decayLevel = 1;
    this.decayManager.setDecayLevel(decayLevel, this.entities.group);

    // Dev layout overrides MUST be applied BEFORE stage-specific overrides
    await this.applyDevLayoutOverridesAsync();

    if (GameState.getInstance().hasItem('prop_key')) {
      const keyMesh = this.entities.group.getObjectByName('prop_key');
      if (keyMesh) keyMesh.visible = false;
    }
    if (GameState.getInstance().hasItem('prop_brass_shunt')) {
        const shuntMesh = this.entities.group.getObjectByName('prop_brass_shunt');
        if (shuntMesh) shuntMesh.visible = false;
      }
      if (GameState.getInstance().hasItem('prop_envelope')) {
        const envMesh = this.entities.group.getObjectByName('prop_envelope');
        if (envMesh) envMesh.visible = false;
      }

    if (stage >= GameStage.ACT_7_SYNTHESIS_BLACKOUT) {
      this.exitBlownOpen = true;
      (this.entities.doorLed.material as THREE.MeshBasicMaterial).color.setHex(0x4ade80);
      const exitDoor = this.entities.exitDoorPanel;
      exitDoor.position.z = exitDoor.userData.animEnd !== undefined ? exitDoor.userData.animEnd : -4.35;
    }
    if (stage >= GameStage.ACT_1_HUB_CORRIDOR_OPEN) {
      this.corridorDoorOpen = true;
      (this.entities.corridorLed.material as THREE.MeshBasicMaterial).color.setHex(0x4ade80);
      const door = this.entities.corridorDoor;
      door.rotation.y = door.userData.animEnd !== undefined ? door.userData.animEnd : -Math.PI / 2.2;
    }

    // Optional override for self-contained hero props if custom Blender .glb models are present in /assets/models/
    try {
      const loader = ModelLoader.getInstance();
      
      const propsToLoad = [
        { name: 'prop_telephone', fallback: this.entities.telephone },
        { name: 'prop_desk', fallback: this.entities.desk },
        { name: 'prop_chair', fallback: this.entities.chair },
        { name: 'prop_planter', fallback: this.entities.planter },
        { name: 'prop_key', fallback: this.entities.cipherKey }
      ];

      for (const p of propsToLoad) {
        if (!p.fallback) continue;
        const custom = await loader.loadProp(p.name, () => p.fallback as THREE.Group);
        if (custom !== p.fallback) {
          custom.userData = { ...p.fallback.userData };
          // Fix memory leak: dispose fallback geometry before removing
          p.fallback.traverse((child) => {
            if (child instanceof THREE.Mesh) {
              if (child.geometry) child.geometry.dispose();
              if (child.material) {
                if (Array.isArray(child.material)) {
                  child.material.forEach((m) => { if (m.dispose) m.dispose(); });
                } else if (child.material.dispose) {
                  child.material.dispose();
                }
              }
            }
          });
          this.entities.group.remove(p.fallback);
          custom.name = p.name;
          this.entities.group.add(custom);
        }
      }
    } catch {
      // Procedural fallback already active
    }

    // Wall-mounted Sub-Level 04 Facility Blueprint board next to corridor portal
    const mapGroup = new THREE.Group();
    mapGroup.name = 'prop_facility_map';
    mapGroup.position.set(2.2, 1.7, -6.65);

    const frameMat = new THREE.MeshStandardMaterial({ color: 0x242d28, metalness: 0.6, roughness: 0.4 });
    const mapFrame = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.72, 0.04), frameMat);
    mapFrame.castShadow = true;
    mapGroup.add(mapFrame);

    const boardMat = new THREE.MeshStandardMaterial({
      color: 0x0f2938,
      emissive: 0x081a24,
      emissiveIntensity: 0.35,
      roughness: 0.3
    });
    const mapBoard = new THREE.Mesh(new THREE.PlaneGeometry(0.92, 0.64), boardMat);
    mapBoard.position.z = 0.022;
    mapGroup.add(mapBoard);

    mapGroup.userData.interactionPrompt = '[EXAMINE: SUB-LEVEL 04 FACILITY BLUEPRINT]';
    this.entities.group.add(mapGroup);

    this.updatePortalLeds();

    return this.entities.group;
  }

  private async applyDevLayoutOverridesAsync(): Promise<void> {
    if (!this.entities) return;
    
    
    const layout = await EditorServerSync.fetchLayout();
      
      this.entities!.group.traverse((child) => {
        let meshLayout = layout[child.name] as any;
        if (!meshLayout && layout.overrides) meshLayout = layout.overrides[child.name];
      if (meshLayout) {
        if (meshLayout.x !== undefined) {
          child.position.set(meshLayout.x, meshLayout.y, meshLayout.z);
          child.rotation.set(meshLayout.rx, meshLayout.ry, meshLayout.rz);
          child.scale.set(meshLayout.sx, meshLayout.sy, meshLayout.sz);
          if (meshLayout.animation) {
            child.userData.animType = meshLayout.animation.type;
            child.userData.animAxis = meshLayout.animation.axis;
            child.userData.animStart = meshLayout.animation.start;
            child.userData.animEnd = meshLayout.animation.end;
            child.userData.animTrigger = meshLayout.animation.trigger || 'none';
            child.userData.animDuration = meshLayout.animation.duration || 800;
            child.userData.animState = false;
          }
          child.updateMatrixWorld();
        }
        if (meshLayout.interactionPrompt !== undefined) child.userData.interactionPrompt = meshLayout.interactionPrompt;
        if (meshLayout.flavorText !== undefined) child.userData.flavorText = meshLayout.flavorText;
      }
    });
    
    
    if (layout.prefabs && Array.isArray(layout.prefabs)) {
      for (const p of layout.prefabs) {
        let prefab;
          if (p.type === 'CustomModel') {
            prefab = EditorPrefabs.spawnCustomModel(p.modelUrl, p.id);
          } else {
            prefab = EditorPrefabs.spawn(p.type);
          }
        prefab.userData.prefabId = p.id;
        prefab.position.set(p.transform.x, p.transform.y, p.transform.z);
        prefab.rotation.set(p.transform.rx, p.transform.ry, p.transform.rz);
        prefab.scale.set(p.transform.sx, p.transform.sy, p.transform.sz);
        if (p.lightColor !== undefined && prefab.userData.isLight) {
            const l = prefab.children.find((c: any) => c.isLight) as any;
            if (l) {
              l.color.setHex(p.lightColor);
              l.intensity = p.lightIntensity;
            }
          }
          if (p.paintingUrl) {
            prefab.userData.paintingUrl = p.paintingUrl;
            const canvasMesh = prefab.children[1] as any;
            if (canvasMesh && canvasMesh.material) {
              const loader = new THREE.TextureLoader();
              loader.load(p.paintingUrl, (tex) => {
                canvasMesh.material.map = tex;
                canvasMesh.material.color.setHex(0xffffff);
                canvasMesh.material.needsUpdate = true;
              });
            }
          }
          if (p.transform.animation) {
          prefab.userData.animType = p.transform.animation.type;
          prefab.userData.animAxis = p.transform.animation.axis;
          prefab.userData.animStart = p.transform.animation.start;
          prefab.userData.animEnd = p.transform.animation.end;
          prefab.userData.animTrigger = p.transform.animation.trigger || 'none';
          prefab.userData.animDuration = p.transform.animation.duration || 800;
          prefab.userData.animState = false;
        }
        this.entities!.group.add(prefab);
      }
    }
  }

  private setupEventListeners(): void {
    const bus = EventBus.getInstance();

    const unsubInv = bus.on('inventory:add', ({ itemId }) => {
      if (itemId === 'prop_key') {
        const keyMesh = this.entities?.group.getObjectByName('prop_key');
        if (keyMesh) keyMesh.visible = false;
      }
      if (itemId === 'prop_brass_shunt') {
          const shuntMesh = this.entities?.group.getObjectByName('prop_brass_shunt');
          if (shuntMesh) shuntMesh.visible = false;
        }
        if (itemId === 'prop_envelope') {
          const envMesh = this.entities?.group.getObjectByName('prop_envelope');
          if (envMesh) envMesh.visible = false;
        }
    });

    const unsubStage = bus.on('game:stage_transition', ({ to }) => {
      if (!this.entities) return;

      this.updatePortalLeds();

      if (to === GameStage.ACT_1_HUB_CORRIDOR_OPEN) {
        this.animatePressureRelease();
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
    this.unsubscribers.push(unsubStage, unsubInv);

    const unsubPatch = bus.on('puzzle:crt_patch_completed', () => {
      this.updatePortalLeds();
    });
    this.unsubscribers.push(unsubPatch);

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

  private updatePortalLeds(): void {
    if (!this.entities?.portalLeds) return;
    const gs = GameState.getInstance();
    const stage = gs.getStage();

    const portalStatusMap: Record<string, { unlocked: boolean; cleared: boolean }> = {
      door_portal_sleep_ward: {
        unlocked: stage >= GameStage.ACT_1_HUB_CORRIDOR_OPEN,
        cleared: gs.isCrystalPatched('crystal_01_quartz')
      },
      door_portal_hydrotherapy: {
        unlocked: stage >= GameStage.ACT_2_PATCH_1_COMPLETE,
        cleared: gs.isCrystalPatched('crystal_02_bronze')
      },
      door_portal_audiology: {
        unlocked: stage >= GameStage.ACT_3_PATCH_2_COMPLETE,
        cleared: gs.isCrystalPatched('crystal_03_amethyst')
      },
      door_portal_archive: {
        unlocked: stage >= GameStage.ACT_4_PATCH_3_COMPLETE,
        cleared: gs.isCrystalPatched('crystal_04_obsidian')
      },
      door_portal_directors_office: {
        unlocked: stage >= GameStage.ACT_5_PATCH_4_COMPLETE,
        cleared: gs.isCrystalPatched('crystal_05_celadon')
      },
      door_portal_synthesis: {
        unlocked: stage >= GameStage.ACT_7_SYNTHESIS_BLACKOUT,
        cleared: gs.isSynthesisComplete()
      },
      door_portal_velvet_lounge: {
        unlocked: stage >= GameStage.ACT_8_VELVET_LOUNGE,
        cleared: false
      }
    };

    const redColor = 0x8b1e23;
    const amberColor = 0xf59e0b;
    const greenColor = 0x4ade80;

    for (const [doorId, status] of Object.entries(portalStatusMap)) {
      const led = this.entities.portalLeds[doorId];
      if (!led || !(led.material instanceof THREE.MeshBasicMaterial)) continue;

      if (status.cleared) {
        led.material.color.setHex(greenColor);
      } else if (status.unlocked) {
        led.material.color.setHex(amberColor);
      } else {
        led.material.color.setHex(redColor);
      }
    }

    if (this.entities.corridorLed && this.entities.corridorLed.material instanceof THREE.MeshBasicMaterial) {
      if (stage >= GameStage.ACT_1_HUB_CORRIDOR_OPEN) {
        this.entities.corridorLed.material.color.setHex(greenColor);
      } else {
        this.entities.corridorLed.material.color.setHex(redColor);
      }
    }
  }

  private getNextSpokeRoomId(): string {
    const gameState = GameState.getInstance();
    if (!gameState.isCrystalPatched('crystal_01_quartz')) return 'sleep_ward';
    if (!gameState.isCrystalPatched('crystal_02_bronze')) return 'hydrotherapy';
    if (!gameState.isCrystalPatched('crystal_03_amethyst')) return 'audiology';
    if (!gameState.isCrystalPatched('crystal_04_obsidian')) return 'archive';
    return 'directors_office';
  }

  private animatePressureRelease(): void {
    if (!this.entities) return;
    this.updatePortalLeds();
    this.audioElement.playTumblerClick();
  }

  private animateCorridorDoorOpen(): void {
    if (!this.entities) return;
    this.audioElement.playPneumaticHiss();

    const door = this.entities.corridorDoor;
    const targetRot = door.userData.animEnd !== undefined ? door.userData.animEnd : -Math.PI / 2.2;
    const startRot = door.userData.animStart !== undefined ? door.userData.animStart : door.rotation.y;
    door.rotation.y = startRot;
    const startTime = performance.now();
    const anim = () => {
      const elapsed = (performance.now() - startTime) / 800;
      if (elapsed < 1) {
        door.rotation.y = startRot + (targetRot - startRot) * Math.sin((elapsed * Math.PI) / 2);
        requestAnimationFrame(anim);
      } else {
        door.rotation.y = targetRot;
      }
    };
    anim();
  }

  private animateKnifeSwitch(): void {
    if (!this.entities) return;
    const knife = this.entities.knifeSwitch;
    const startRot = knife.userData.animStart !== undefined ? knife.userData.animStart : knife.rotation.x;
    const targetRot = knife.userData.animEnd !== undefined ? knife.userData.animEnd : startRot - 0.95;
    knife.rotation.x = startRot;
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

      if (this.entities) {
        (this.entities.doorLed.material as THREE.MeshBasicMaterial).color.setHex(0x4ade80);
        const exitDoor = this.entities.exitDoorPanel;
        const targetZ = exitDoor.userData.animEnd !== undefined ? exitDoor.userData.animEnd : -4.35;
        const startZ = exitDoor.userData.animStart !== undefined ? exitDoor.userData.animStart : exitDoor.position.z;
        exitDoor.position.z = startZ;
        const startTime = performance.now();
        const anim = () => {
          const elapsed = (performance.now() - startTime) / 1200;
          if (elapsed < 1) {
            exitDoor.position.z = startZ + (targetZ - startZ) * Math.sin((elapsed * Math.PI) / 2);
            requestAnimationFrame(anim);
          } else {
            exitDoor.position.z = targetZ;
          }
        };
        anim();
      }

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
    this.tektronixScreen.teardown();
    this.entities = null;
    this.isTransitioning = false;
    this.corridorDoorOpen = false;
  }

  protected isTransitioning: boolean = false;
  protected corridorDoorOpen: boolean = false;

  public onObjectClick(objectId: string): boolean {
    const bus = EventBus.getInstance();

    if (objectId === 'prop_brass_shunt') {
      if (this.entities?.brassShunt) {
        this.entities.brassShunt.visible = false;
      }
      GameState.getInstance().addItem('prop_brass_shunt');
      bus.emit('inventory:add', { itemId: 'prop_brass_shunt' });
      this.audioElement.playTumblerClick();
      bus.emit('ui:subtitle_changed', {
        text: 'Cold machined brass shunt acquired. Knurled industrial cylinder designed to seat inside a ceramic fuse terminal.'
      });
      return true;
    }

    if (objectId === 'prop_envelope') {
      this.audioElement.playTumblerClick();
      bus.emit('camera:move_to_hotspot', { hotspotId: 'envelope' });
      bus.emit('ui:view_changed', { view: 'dossier' });
      return true;
    }

    if (objectId === 'prop_bell_jar' || objectId === 'prop_key') {
      this.audioElement.playTumblerClick();
      if (GameState.getInstance().hasItem('prop_key')) {
        bus.emit('ui:subtitle_changed', { text: 'The glass isolation bell jar is empty.' });
      } else {
        bus.emit('inspect:open', {
          itemId: 'prop_key',
          targetMesh: null as any,
          title: 'OBSERVATION CIPHER KEY',
          subtitle: 'Room 04 • The Sterile Chamber'
        });
      }
      return true;
    }

    if (objectId === 'prop_telephone') {
      this.audioElement.playTumblerClick();
      bus.emit('camera:move_to_hotspot', { hotspotId: 'telephone' });
      bus.emit('ui:subtitle_changed', {
        text: 'A soothing, monotone voice whispers from the receiver: "Who are you? The numbers on the envelope are not a cage; they are your calibration. Complete the circuit on the desk."'
      });
      return true;
    }



    if (objectId === 'door_portal_sleep_ward') {
      const stage = GameState.getInstance().getStage();
      if (stage < GameStage.ACT_1_HUB_CORRIDOR_OPEN) {
        bus.emit('camera:move_to_hotspot', { hotspotId: 'door_portal_sleep_ward' });
        bus.emit('ui:subtitle_changed', {
          text: 'The Sleep Ward pneumatic lock is active. Complete Phase I harmonic tuning to 528 Hz on the central CRT oscilloscope.'
        });
        return true;
      }

      if (!GameState.getInstance().hasItem('prop_key')) {
        bus.emit('camera:move_to_hotspot', { hotspotId: 'door_portal_sleep_ward' });
        bus.emit('ui:subtitle_changed', {
          text: 'The pressure seal is released, but the mechanical cipher lock requires a heavy brass key.'
        });
        return true;
      }

      const pending = GameState.getInstance().getPendingCrystal();
      if (pending) {
        bus.emit('camera:move_to_hotspot', { hotspotId: 'vault' });
        bus.emit('ui:subtitle_changed', {
          text: 'A memory crystal is recovered. Slot it into the CRT oscilloscope at the central desk before proceeding deeper into the facility.'
        });
        return true;
      }

      if (this.isTransitioning) return true;
      this.isTransitioning = true;
      AudioEngine.getInstance().playPneumaticHiss();
      bus.emit('ui:subtitle_changed', {
        text: 'Traversing observation corridor to Sleep Ward (SL4-02-SLP).'
      });
      bus.emit('scenario:switch_room', { targetRoomId: 'sleep_ward', doorThresholdId: 'door_portal_sleep_ward' });
      return true;
    }

    if (objectId === 'door_portal_hydrotherapy') {
      const stage = GameState.getInstance().getStage();
      if (stage < GameStage.ACT_2_PATCH_1_COMPLETE) {
        bus.emit('camera:move_to_hotspot', { hotspotId: 'door_portal_hydrotherapy' });
        bus.emit('ui:subtitle_changed', {
          text: 'Hydrotherapy Suite interlock active. Recover and patch Memory Crystal 01 from Sleep Ward first.'
        });
        return true;
      }

      const pending = GameState.getInstance().getPendingCrystal();
      if (pending) {
        bus.emit('camera:move_to_hotspot', { hotspotId: 'vault' });
        bus.emit('ui:subtitle_changed', {
          text: 'A memory crystal is recovered. Slot it into the CRT oscilloscope at the central desk before proceeding deeper into the facility.'
        });
        return true;
      }

      if (this.isTransitioning) return true;
      this.isTransitioning = true;
      AudioEngine.getInstance().playPneumaticHiss();
      bus.emit('ui:subtitle_changed', {
        text: 'Traversing concourse to Hydrotherapy Suite (SL4-03-HYD).'
      });
      bus.emit('scenario:switch_room', { targetRoomId: 'hydrotherapy', doorThresholdId: 'door_portal_hydrotherapy' });
      return true;
    }

    if (objectId === 'door_portal_audiology') {
      const stage = GameState.getInstance().getStage();
      if (stage < GameStage.ACT_3_PATCH_2_COMPLETE) {
        bus.emit('camera:move_to_hotspot', { hotspotId: 'door_portal_audiology' });
        bus.emit('ui:subtitle_changed', {
          text: 'Audiology Vault acoustic seal active. Solve hydraulic pressure balance in Hydrotherapy Suite first.'
        });
        return true;
      }

      const pending = GameState.getInstance().getPendingCrystal();
      if (pending) {
        bus.emit('camera:move_to_hotspot', { hotspotId: 'vault' });
        bus.emit('ui:subtitle_changed', {
          text: 'A memory crystal is recovered. Slot it into the CRT oscilloscope at the central desk before proceeding deeper into the facility.'
        });
        return true;
      }

      if (this.isTransitioning) return true;
      this.isTransitioning = true;
      AudioEngine.getInstance().playPneumaticHiss();
      bus.emit('ui:subtitle_changed', {
        text: 'Traversing corridor to Audiology Vault (SL4-04B-AUD).'
      });
      bus.emit('scenario:switch_room', { targetRoomId: 'audiology', doorThresholdId: 'door_portal_audiology' });
      return true;
    }

    if (objectId === 'door_portal_archive') {
      const stage = GameState.getInstance().getStage();
      if (stage < GameStage.ACT_4_PATCH_3_COMPLETE) {
        bus.emit('camera:move_to_hotspot', { hotspotId: 'door_portal_archive' });
        bus.emit('ui:subtitle_changed', {
          text: 'Archive & Records security gate sealed. Synthesize Chladni resonance in Audiology Vault first.'
        });
        return true;
      }

      const pending = GameState.getInstance().getPendingCrystal();
      if (pending) {
        bus.emit('camera:move_to_hotspot', { hotspotId: 'vault' });
        bus.emit('ui:subtitle_changed', {
          text: 'A memory crystal is recovered. Slot it into the CRT oscilloscope at the central desk before proceeding deeper into the facility.'
        });
        return true;
      }

      if (this.isTransitioning) return true;
      this.isTransitioning = true;
      AudioEngine.getInstance().playPneumaticHiss();
      bus.emit('ui:subtitle_changed', {
        text: 'Traversing corridor to Archive & Records (SL4-05-ARC).'
      });
      bus.emit('scenario:switch_room', { targetRoomId: 'archive', doorThresholdId: 'door_portal_archive' });
      return true;
    }

    if (objectId === 'door_portal_directors_office') {
      const stage = GameState.getInstance().getStage();
      if (stage < GameStage.ACT_5_PATCH_4_COMPLETE) {
        bus.emit('camera:move_to_hotspot', { hotspotId: 'door_portal_directors_office' });
        bus.emit('ui:subtitle_changed', {
          text: "Director's Suite administrative lock engaged. Retrieve and calibrate Obsidian Crystal from Archive first."
        });
        return true;
      }

      const pending = GameState.getInstance().getPendingCrystal();
      if (pending) {
        bus.emit('camera:move_to_hotspot', { hotspotId: 'vault' });
        bus.emit('ui:subtitle_changed', {
          text: 'A memory crystal is recovered. Slot it into the CRT oscilloscope at the central desk before proceeding deeper into the facility.'
        });
        return true;
      }

      if (this.isTransitioning) return true;
      this.isTransitioning = true;
      AudioEngine.getInstance().playPneumaticHiss();
      bus.emit('ui:subtitle_changed', {
        text: "Traversing private concourse to Director's Office (SL4-06-DIR)."
      });
      bus.emit('scenario:switch_room', { targetRoomId: 'directors_office', doorThresholdId: 'door_portal_directors_office' });
      return true;
    }

    if (objectId === 'door_portal_synthesis') {
      const stage = GameState.getInstance().getStage();
      if (stage < GameStage.ACT_7_SYNTHESIS_BLACKOUT) {
        bus.emit('camera:move_to_hotspot', { hotspotId: 'door_portal_synthesis' });
        bus.emit('ui:subtitle_changed', {
          text: 'Synthesis Core heavy blast airlock sealed. High-voltage cathode acceleration requires alignment of all prior sectors.'
        });
        return true;
      }

      if (this.isTransitioning) return true;
      this.isTransitioning = true;
      AudioEngine.getInstance().playPneumaticHiss();
      bus.emit('ui:subtitle_changed', {
        text: 'Traversing high-voltage airlock to Synthesis Core (SL4-07-SYN).'
      });
      bus.emit('scenario:switch_room', { targetRoomId: 'synthesis_blackout', doorThresholdId: 'door_portal_synthesis' });
      return true;
    }

    if (objectId === 'door_portal_velvet_lounge') {
      const stage = GameState.getInstance().getStage();
      if (stage < GameStage.ACT_8_VELVET_LOUNGE) {
        bus.emit('camera:move_to_hotspot', { hotspotId: 'door_portal_velvet_lounge' });
        bus.emit('ui:subtitle_changed', {
          text: 'Velvet Lounge solarium corridor locked. Complete the Synthesis Core cathode balancing circuit first.'
        });
        return true;
      }

      if (this.isTransitioning) return true;
      this.isTransitioning = true;
      AudioEngine.getInstance().playPneumaticHiss();
      bus.emit('ui:subtitle_changed', {
        text: 'Entering Velvet Lounge (SL4-08-VEL).'
      });
      bus.emit('scenario:switch_room', { targetRoomId: 'velvet_lounge', doorThresholdId: 'door_portal_velvet_lounge' });
      return true;
    }

    if (objectId === 'door_corridor' || objectId === 'door_corridor_passage') {
      const stage = GameState.getInstance().getStage();
      if (stage >= GameStage.ACT_1_HUB_CORRIDOR_OPEN) {
        if (!GameState.getInstance().hasItem('prop_key')) {
          bus.emit('camera:move_to_hotspot', { hotspotId: 'corridor' });
          bus.emit('ui:subtitle_changed', { text: 'The pressure seal is released, but the mechanical cipher lock requires a heavy brass key.' });
          return true;
        }

        const pending = GameState.getInstance().getPendingCrystal();
        if (pending) {
          bus.emit('camera:move_to_hotspot', { hotspotId: 'vault' });
          bus.emit('ui:subtitle_changed', {
            text: 'A memory crystal is recovered. Slot it into the CRT oscilloscope at the central desk before proceeding deeper into the facility.'
          });
          return true;
        }
        
        if (!this.corridorDoorOpen) {
          this.corridorDoorOpen = true;
          this.animateCorridorDoorOpen();
          bus.emit('ui:subtitle_changed', { text: 'Cipher key engaged. The observation corridor unseals.' });
          return true;
        }

        if (!this.isTransitioning) {
          this.isTransitioning = true;
          bus.emit('scenario:switch_room', { targetRoomId: this.getNextSpokeRoomId() });
        }
      } else {
        bus.emit('camera:move_to_hotspot', { hotspotId: 'corridor' });
        bus.emit('ui:subtitle_changed', {
          text: 'The observation corridor is sealed. Complete the Phase I harmonic tuning to 528 Hz on the desk terminal.'
        });
      }
      return true;
    }

    if (objectId === 'prop_door' || objectId === 'exit_airlock_passage') {
      const stage = GameState.getInstance().getStage();
      if (this.exitBlownOpen || stage >= GameStage.ACT_7_SYNTHESIS_BLACKOUT) {
        const targetRoom = stage >= GameStage.ACT_8_VELVET_LOUNGE ? 'velvet_lounge' : 'synthesis_blackout';
        bus.emit('scenario:switch_room', { targetRoomId: targetRoom });
      } else {
        bus.emit('camera:move_to_hotspot', { hotspotId: 'door' });
        bus.emit('ui:subtitle_changed', {
          text: 'The heavy steel exit blastdoor is locked from the outside. The indicator light is red.'
        });
      }
      return true;
    }

    if (objectId === 'prop_facility_map') {
      bus.emit('camera:move_to_hotspot', { hotspotId: 'corridor' });
      bus.emit('ui:open_facility_map', {});
      return true;
    }

    if (objectId === 'prop_facility_directory') {
      this.audioElement.playTumblerClick();
      bus.emit('camera:move_to_hotspot', { hotspotId: 'corridor' });
      bus.emit('ui:open_staff_roster', { staffId: 'rostova' });
      return true;
    }

    if (objectId === 'prop_pneumatic_terminal') {
      this.audioElement.playPneumaticHiss();
      bus.emit('camera:move_to_hotspot', { hotspotId: 'corridor' });
      bus.emit('ui:subtitle_changed', {
        text: 'Pneumatic Dispatch Terminal Model 72: Vacuum conduits pressurized at 145 kPa. Intake routing specimen canisters to peripheral sanatorium wings.'
      });
      return true;
    }

    if (objectId === 'prop_waiting_bench') {
      this.audioElement.playTumblerClick();
      bus.emit('camera:move_to_hotspot', { hotspotId: 'desk' });
      bus.emit('ui:subtitle_changed', {
        text: 'Institutional waiting bench: Bent teak shell with tubular chrome chassis. Cold, utilitarian, and designed for prolonged clinical observation.'
      });
      return true;
    }

    if (objectId === 'prop_wall_clock') {
      this.audioElement.playTumblerClick();
      bus.emit('camera:move_to_hotspot', { hotspotId: 'corridor' });
      bus.emit('ui:subtitle_changed', {
        text: 'Synchronous slave wall clock: Bakelite casing hums with a 50 Hz pulse. The sweep hand steps with a dry, mechanical tick.'
      });
      return true;
    }

    if (objectId === 'prop_oscilloscope' || objectId === 'vault_crt_screen' || objectId === 'prop_vault') {
      const stage = GameState.getInstance().getStage();
      if (stage === GameStage.ACT_1_HUB_AWAKEN) {
        bus.emit('camera:move_to_hotspot', { hotspotId: 'vault' });
        this.tektronixScreen.open();
        return true;
      }

      const pending = GameState.getInstance().getPendingCrystal();
      if (pending) {
        bus.emit('camera:move_to_hotspot', { hotspotId: 'vault' });
        bus.emit('puzzle:crt_patch_opened', { crystalId: pending });
        return true;
      }

      bus.emit('camera:move_to_hotspot', { hotspotId: 'vault' });
      bus.emit('ui:subtitle_changed', {
        text: 'Tektronix 545B oscilloscope calibrated. No unpatched crystals pending.'
      });
      return true;
    }

    return false;
  }

  public update(_delta: number): void {
    if (this.entities) {
      this.entities.updateOscilloscope(440, false, performance.now() * 0.001);
    }
  }
}

