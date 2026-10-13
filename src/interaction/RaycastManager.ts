import * as THREE from 'three';
import { EventBus } from '../core/EventBus';
import { GameState } from '../core/GameState';
import { GameStage } from '../types';

export class RaycastManager {
  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;
  private camera: THREE.Camera;
  private scene: THREE.Scene;
  private eventBus: EventBus;
  private isEnabled: boolean = true;
  private hoveredObject: THREE.Object3D | null = null;
  private exclusiveTargetId: string | null = null;

  private domElement: HTMLElement;

  constructor(scene: THREE.Scene, camera: THREE.Camera, domElement: HTMLElement) {
    this.scene = scene;
    this.camera = camera;
    this.domElement = domElement;
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.eventBus = EventBus.getInstance();

    this.setupListeners();
  }

  private setupListeners(): void {
    let startX = 0;
    let startY = 0;
    let startTime = 0;

    let hoverTimeout: number | null = null;

    this.domElement.addEventListener('mousemove', (e) => {
      this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
      
      if (!hoverTimeout) {
        hoverTimeout = window.setTimeout(() => {
          this.checkHover();
          hoverTimeout = null;
        }, 50); // ~20Hz throttle
      }
    });

    this.domElement.addEventListener('pointerdown', (e) => {
      if (e.button !== 0 || !this.isEnabled) return;
      startX = e.clientX;
      startY = e.clientY;
      startTime = performance.now();
    });

    this.domElement.addEventListener('pointerup', (e) => {
      if (e.button !== 0 || !this.isEnabled) return;
      const dist = Math.hypot(e.clientX - startX, e.clientY - startY);
      const elapsed = performance.now() - startTime;
      // Require minimal mouse movement (< 6px) to distinguish deliberate click from camera orbit drag
      if (dist < 6 && elapsed < 500) {
        this.checkClick();
      }
    });

    this.domElement.addEventListener('pointerleave', () => {
      if (this.hoveredObject) {
        this.hoveredObject = null;
        this.domElement.style.cursor = 'default';
        this.eventBus.emit('input:object_hovered', { objectId: null, label: '' });
      }
    });

    this.eventBus.on('camera:transition_start', () => {
      this.setEnabled(false);
      this.checkHover();
    });

    this.eventBus.on('camera:transition_end', () => {
      this.setEnabled(true);
      this.checkHover();
    });

    this.eventBus.on('inspect:open', () => {
      this.setEnabled(false);
      this.domElement.style.cursor = 'default';
      if (this.hoveredObject) {
        this.hoveredObject = null;
        this.eventBus.emit('input:object_hovered', { objectId: null, label: '' });
      }
    });

    this.eventBus.on('inspect:close', () => {
      this.setEnabled(true);
    });

    this.eventBus.on('ui:modal_opened', () => {
      this.setEnabled(false);
      this.domElement.style.cursor = 'default';
      if (this.hoveredObject) {
        this.hoveredObject = null;
        this.eventBus.emit('input:object_hovered', { objectId: null, label: '' });
      }
    });

    this.eventBus.on('ui:modal_closed', () => {
      this.setEnabled(true);
    });
  }

  public setExclusiveTarget(objectId: string | null): void {
    this.exclusiveTargetId = objectId;
  }

  public resolveInteractiveTarget(obj: THREE.Object3D | null): THREE.Object3D | null {
    return this.findInteractiveParent(obj);
  }

  public resolveInteractionLabel(name: string): string {
    return this.getInteractionLabel(name);
  }

  private findInteractiveParent(obj: THREE.Object3D | null): THREE.Object3D | null {
    let curr = obj;
    while (curr) {
      if (curr.name) {
        if (this.exclusiveTargetId) {
          if (curr.name === this.exclusiveTargetId || curr.name.includes(this.exclusiveTargetId)) {
            return curr;
          }
        } else {
          if (
            curr.name.startsWith('prop_') ||
            curr.name.startsWith('door_') ||
            curr.name.startsWith('crystal_') ||
            curr.name.startsWith('exit_') ||
            curr.name === 'exit_airlock_passage' ||
            curr.name === 'vault_crt_screen' ||
            curr.userData?.isInteractiveProp ||
            !!curr.userData?.interactionPrompt
          ) {
            return curr;
          }
          if (curr.name.startsWith('group_door_')) {
            const doorChild = curr.children.find((c) => c.name.startsWith('door_'));
            if (doorChild) return doorChild;
            return curr;
          }
          if (curr.name.startsWith('group_prop_')) {
            const propChild = curr.children.find((c) => c.name.startsWith('prop_'));
            if (propChild) return propChild;
            return curr;
          }
        }
      }
      curr = curr.parent;
    }
    return null;
  }

  private getInteractionLabel(name: string): string {
    if (name === 'prop_door' || name === 'exit_airlock_passage') {
      const stage = GameState.getInstance().getStage();
      if (stage === GameStage.ACT_7_SYNTHESIS_BLACKOUT || stage === GameStage.ACT_8_VELVET_LOUNGE) {
        return '[ENTER: VELVET LOUNGE]';
      }
      return '[CLICK TO INSPECT EXIT BLASTDOOR]';
    }

    const labels: Record<string, string> = {
      // Hub
      prop_envelope: '[CLICK TO UNSEAL DOSSIER]',
      prop_bell_jar: '[CLICK TO UNSEAT BELL JAR]',
      prop_key: '[CLICK TO EXAMINE KEY]',
      prop_vault: '[TUNE: HARMONIC APPARATUS]',
      prop_oscilloscope: '[TUNE: HARMONIC APPARATUS]',
      vault_crt_screen: '[TUNE: HARMONIC APPARATUS]',
      prop_telephone: '[CLICK TO LISTEN TO RECEIVER]',
      prop_brass_shunt: '[COLLECT: MACHINED BRASS SHUNT]',
      door_corridor: '[ENTER: OBSERVATION CORRIDOR]',
      door_corridor_passage: '[ENTER: OBSERVATION CORRIDOR]',
      door_portal_sleep_ward: '[ENTER: SLEEP WARD (SL4-02)]',
      door_portal_hydrotherapy: '[ENTER: HYDROTHERAPY SUITE (SL4-03)]',
      door_portal_audiology: '[ENTER: AUDIOLOGY VAULT (SL4-04B)]',
      door_portal_archive: '[ENTER: ARCHIVE & RECORDS (SL4-05)]',
      door_portal_directors_office: "[ENTER: DIRECTOR'S OFFICE (SL4-06)]",
      door_portal_synthesis: '[ENTER: SYNTHESIS CORE (SL4-07)]',
      door_portal_velvet_lounge: '[ENTER: VELVET LOUNGE (SL4-08)]',
      door_return_hub: '[RETURN: CENTRAL HUB]',
      prop_facility_map: '[EXAMINE: SUB-LEVEL 04 FACILITY BLUEPRINT]',
      prop_facility_directory: '[READ: DEPARTMENTAL ROSTER DIRECTORY]',
      prop_pneumatic_terminal: '[INSPECT: PNEUMATIC DOSSIER DISPATCH]',
      prop_waiting_bench: '[EXAMINE: INSTITUTIONAL WAITING BENCH]',
      prop_wall_clock: '[CHECK: SYNCHRONOUS SLAVE CLOCK]',

      // Sleep Ward
      prop_uv_toggle: '[TOGGLE: SURGICAL ULTRAVIOLET LAMP]',
      prop_trolley: '[INSPECT DISPENSARY CART & COMBINATION LOCK]',
      prop_trolley_lock: '[INSPECT DISPENSARY CART & COMBINATION LOCK]',
      prop_dial_0: '[ROTATE TUMBLER 1]',
      prop_dial_1: '[ROTATE TUMBLER 2]',
      prop_dial_2: '[ROTATE TUMBLER 3]',
      prop_clipboard_101: '[READ: SUBJECT 101 MEDICAL CHART]',
      prop_clipboard_102: '[READ: SUBJECT 102 MEDICAL CHART]',
      prop_clipboard_103: '[READ: SUBJECT 103 MEDICAL CHART]',
      prop_clipboard_104: '[READ: SUBJECT 104 (VACANT) CHART]',
      prop_cot_104: '[EXAMINE: VACANT COT 104]',
      prop_headboard_104: '[EXAMINE: COT 104 HEADBOARD]',
      crystal_01_quartz: '[COLLECT: PRISMATIC QUARTZ]',

      // Hydrotherapy
      prop_tub_1: '[EXAMINE: IMMERSION TUB 1 STENCIL]',
      prop_tub_2: '[EXAMINE: IMMERSION TUB 2 STENCIL]',
      prop_manifold: '[INSPECT PRESSURE MANIFOLD GAUGE]',
      prop_valve_0: '[ROTATE BRASS VALVE A (INTAKE)]',
      prop_valve_1: '[ROTATE BRASS VALVE B (RELIEF)]',
      prop_valve_2: '[ROTATE BRASS VALVE C (DRAIN)]',
      prop_drain: '[INSPECT FLOOR DRAIN HATCH]',
      prop_drain_lid: '[INSPECT FLOOR DRAIN HATCH]',
      crystal_02_bronze: '[COLLECT: DRAINED BRONZE]',

      // Audiology
      prop_audiology_score: '[EXAMINE: ACOUSTIC NOTATION SCORE]',
      prop_amplifier_monolith: '[INSPECT AMPLIFIER MONOLITH]',
      prop_amp_stack: '[TUNE AMPLIFIER HARMONIC FREQUENCY]',
      prop_speaker_cone: '[INSPECT 15-INCH SPEAKER CONE]',
      prop_acoustic_horn_left: '[INSPECT LEFT DIRECTIONAL HORN (45 DEG)]',
      prop_acoustic_horn_right: '[INSPECT RIGHT DIRECTIONAL HORN (135 DEG)]',
      prop_chladni_plate: '[INSPECT CHLADNI RESONANCE PLATE]',
      crystal_03_amethyst: '[COLLECT: AMETHYST CORE]',

      // Archive
      prop_cabinet_0: '[SEARCH: PATIENT ARCHIVE 042]',
      prop_cabinet_1: '[SEARCH: PATIENT ARCHIVE 067]',
      prop_cabinet_2: '[SEARCH: PATIENT ARCHIVE 088]',
      prop_cabinet_3: '[SEARCH: PATIENT ARCHIVE 099]',
      prop_cabinet_4: '[SEARCH: PATIENT ARCHIVE 101]',
      prop_cabinet_5: '[SEARCH: PATIENT ARCHIVE 102]',
      prop_cabinet_6: '[SEARCH: PATIENT ARCHIVE 103]',
      prop_cabinet_7: '[SEARCH: PATIENT CABINET 104]',
      prop_drawer_104: '[SEARCH: PATIENT DRAWER 104]',
      prop_microfiche_reader: '[ACCESS: OPTICAL MICROFICHE READER]',
      crystal_04_obsidian: '[COLLECT: PITCH-BLACK OBSIDIAN]',

      // Director's Office
      prop_void_phone: '[LIFT: UNPLUGGED ROTARY RECEIVER]',
      prop_director_desk: '[INSPECT MAHOGANY EXECUTIVE DESK]',
      prop_director_drawer: '[SEARCH: SECRET DESK DRAWER]',
      prop_tape_deck: '[INSPECT: REEL-TO-REEL TAPE DECK]',
      prop_carriage_clock: '[INSPECT: BRASS CARRIAGE CLOCK]',
      prop_executive_chair: '[EXAMINE: EXECUTIVE LEATHER CHAIR]',
      crystal_05_celadon: '[COLLECT: GLOWING CELADON CORE]',

      // Velvet Lounge
      prop_lounge_bar: '[INSPECT MAHOGANY BAR COUNTER]',
      prop_whiskey_glass: '[EXAMINE: AMBER WHISKEY & ICE]',
      prop_velvet_stool_1: '[EXAMINE: VELVET BAR STOOL]',
      prop_velvet_stool_2: '[EXAMINE: VELVET BAR STOOL]',
      prop_cocktail_table: '[EXAMINE: MARBLE COCKTAIL TABLE]',
      prop_bar_mirror_glass: '[INSPECT GILDED MIRROR REFLECTION]',
      prop_crystal_decanter: '[EXAMINE: CUT-CRYSTAL DECANTER]',
      prop_bar_mirror_silhouette: '[LOOK: SHADOW SILHOUETTE IN GLASS]',
      prop_galvanometer_grid: '[INSPECT: POWER BUS GALVANOMETER]',
      prop_switchboard: '[INSPECT: VINTAGE OPERATOR SWITCHBOARD]',
      prop_lounge_payphone: '[ANSWER: RINGING ANALOG PAYPHONE]'
    };

    return labels[name] || '[CLICK TO EXAMINE]';
  }

  private checkHover(): void {
    if (!this.isEnabled) {
      if (this.hoveredObject) {
        this.hoveredObject = null;
        this.domElement.style.cursor = 'default';
        this.eventBus.emit('input:object_hovered', { objectId: null, label: '' });
      }
      return;
    }

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.scene.children, true);

    if (intersects.length > 0) {
      for (const intersect of intersects) {
        // Ignore Editor helpers and visualizers
        let isHelper = false;
        let curr: THREE.Object3D | null = intersect.object;
        while (curr) {
          if (curr.name === 'Editor_Helpers_Group' || curr.userData.isHelper || curr.name === 'dev_visualizers_node') {
            isHelper = true;
            break;
          }
          curr = curr.parent;
        }
        if (isHelper) continue;

        const target = this.findInteractiveParent(intersect.object);
        if (target) {
          this.domElement.style.cursor = 'pointer';
          if (this.hoveredObject !== target) {
            this.hoveredObject = target;
            const label = target.userData.interactionPrompt || this.getInteractionLabel(target.name);
            this.eventBus.emit('input:object_hovered', { objectId: target.name, label });
          }
          return;
        } else {
          // Block X-ray vision: If we hit a solid opaque non-interactive object, abort the raycast
          const mat = (intersect.object as THREE.Mesh).material as THREE.Material | THREE.Material[];
          if (mat) {
            const checkSolid = (m: THREE.Material) => {
              if (m.transparent || m.opacity < 1) return false;
              if ('transmission' in m && (m as any).transmission > 0) return false;
              return true;
            };
            const isOpaque = Array.isArray(mat) ? mat.some(checkSolid) : checkSolid(mat);
            if (isOpaque) break;
          }
        }
      }
    }

    this.domElement.style.cursor = 'default';
    if (this.hoveredObject) {
      this.hoveredObject = null;
      this.eventBus.emit('input:object_hovered', { objectId: null, label: '' });
    }
  }

  private checkClick(): void {
    if (!this.isEnabled) return;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.scene.children, true);

    if (intersects.length > 0) {
      for (const intersect of intersects) {
        // Ignore Editor helpers and visualizers
        let isHelper = false;
        let curr: THREE.Object3D | null = intersect.object;
        while (curr) {
          if (curr.name === 'Editor_Helpers_Group' || curr.userData.isHelper || curr.name === 'dev_visualizers_node') {
            isHelper = true;
            break;
          }
          curr = curr.parent;
        }
        if (isHelper) continue;

        const target = this.findInteractiveParent(intersect.object);
        if (target) {
          this.eventBus.emit('input:object_clicked', {
            objectId: target.name,
            point: intersect.point,
            flavorText: target.userData.flavorText
          });
          return;
        } else {
          // Block X-ray vision
          const mat = (intersect.object as THREE.Mesh).material as THREE.Material | THREE.Material[];
          if (mat) {
            const checkSolid = (m: THREE.Material) => {
              if (m.transparent || m.opacity < 1) return false;
              if ('transmission' in m && (m as any).transmission > 0) return false;
              return true;
            };
            const isOpaque = Array.isArray(mat) ? mat.some(checkSolid) : checkSolid(mat);
            if (isOpaque) break;
          }
        }
      }
    }
  }

  public setEnabled(enabled: boolean): void {
    if (enabled) {
      const openModals = document.querySelectorAll(
        '.overlay-screen:not(.hidden), .diegetic-screen-overlay:not(.hidden), #modal-dossier:not(.hidden), #modal-settings:not(.hidden), #screen-facility-map:not(.hidden)'
      );
      if (openModals.length > 0) {
        this.isEnabled = false;
        return;
      }
    }
    this.isEnabled = enabled;
  }
}
