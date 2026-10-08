import * as THREE from 'three';
import { EventBus } from '../core/EventBus';

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

    this.domElement.addEventListener('mousemove', (e) => {
      this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
      this.checkHover();
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
      this.isEnabled = false;
      this.domElement.style.cursor = 'default';
    });

    this.eventBus.on('camera:transition_end', () => {
      this.isEnabled = true;
    });

    this.eventBus.on('inspect:open', () => {
      this.isEnabled = false;
      this.domElement.style.cursor = 'default';
      if (this.hoveredObject) {
        this.hoveredObject = null;
        this.eventBus.emit('input:object_hovered', { objectId: null, label: '' });
      }
    });

    this.eventBus.on('inspect:close', () => {
      this.isEnabled = true;
    });

    this.eventBus.on('ui:modal_opened', () => {
      this.isEnabled = false;
      this.domElement.style.cursor = 'default';
      if (this.hoveredObject) {
        this.hoveredObject = null;
        this.eventBus.emit('input:object_hovered', { objectId: null, label: '' });
      }
    });

    this.eventBus.on('ui:modal_closed', () => {
      this.isEnabled = true;
    });
  }

  public setExclusiveTarget(objectId: string | null): void {
    this.exclusiveTargetId = objectId;
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
            curr.name.startsWith('crystal_')
          ) {
            return curr;
          }
        }
      }
      curr = curr.parent;
    }
    return null;
  }

  private getInteractionLabel(name: string): string {
    const labels: Record<string, string> = {
      // Hub
      prop_envelope: '[CLICK TO UNSEAL DOSSIER]',
      prop_bell_jar: '[CLICK TO UNSEAT BELL JAR]',
      prop_key: '[CLICK TO EXAMINE KEY]',
      prop_vault: '[CLICK TO INSPECT VAULT & CRT]',
      prop_oscilloscope: '[CLICK TO INSPECT CRT OSCILLOSCOPE]',
      prop_door: '[CLICK TO INSPECT EXIT BLASTDOOR]',
      prop_telephone: '[CLICK TO LISTEN TO RECEIVER]',
      door_corridor: '[ENTER: OBSERVATION CORRIDOR]',
      door_return_hub: '[RETURN: CENTRAL HUB]',

      // Sleep Ward
      prop_trolley_lock: '[ADJUST: 3-DIGIT ROTARY LOCK]',
      prop_dial_0: '[ROTATE TUMBLER 1]',
      prop_dial_1: '[ROTATE TUMBLER 2]',
      prop_dial_2: '[ROTATE TUMBLER 3]',
      prop_clipboard_101: '[READ: PATIENT 101 CLIPBOARD]',
      prop_clipboard_102: '[READ: PATIENT 102 CLIPBOARD]',
      prop_clipboard_103: '[READ: PATIENT 103 CIPHER CLIPBOARD]',
      crystal_01_quartz: '[COLLECT: PRISMATIC QUARTZ]',

      // Hydrotherapy
      prop_manifold: '[INSPECT PRESSURE MANIFOLD]',
      prop_valve_0: '[ROTATE BRASS VALVE A]',
      prop_valve_1: '[ROTATE BRASS VALVE B]',
      prop_valve_2: '[ROTATE BRASS VALVE C]',
      prop_drain: '[INSPECT FLOOR DRAIN HATCH]',
      crystal_02_bronze: '[COLLECT: DRAINED BRONZE]',

      // Audiology
      prop_amplifier_monolith: '[INSPECT AMPLIFIER MONOLITH]',
      prop_amp_stack: '[TUNE AMPLIFIER FREQUENCY]',
      prop_speaker_cone: '[INSPECT 15-INCH SPEAKER CONE]',
      crystal_03_amethyst: '[COLLECT: AMETHYST CORE]',

      // Archive
      prop_drawer_104: '[SEARCH: PATIENT DRAWER 104]',
      crystal_04_obsidian: '[COLLECT: PITCH-BLACK OBSIDIAN]',

      // Director's Office
      prop_void_phone: '[LISTEN: UNPLUGGED TELEPHONE]',
      prop_director_desk: '[INSPECT MAHOGANY DESK]',
      crystal_05_celadon: '[COLLECT: GLOWING CELADON]',

      // Velvet Lounge
      prop_lounge_bar: '[INSPECT MAHOGANY BAR COUNTER]',
      prop_whiskey_glass: '[INSPECT AMBER WHISKEY]',
      prop_bar_mirror_glass: '[INSPECT GILDED MIRROR REFLECTION]',
      prop_bar_mirror_silhouette: '[LOOK: SHADOW SILHOUETTE]',
      prop_lounge_payphone: '[ANSWER: RINGING PAYPHONE]'
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
      const target = this.findInteractiveParent(intersects[0].object);
      if (target) {
        this.domElement.style.cursor = 'pointer';
        if (this.hoveredObject !== target) {
          this.hoveredObject = target;
          const label = this.getInteractionLabel(target.name);
          this.eventBus.emit('input:object_hovered', { objectId: target.name, label });
        }
        return;
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
      const target = this.findInteractiveParent(intersects[0].object);
      if (target) {
        this.eventBus.emit('input:object_clicked', {
          objectId: target.name,
          point: intersects[0].point
        });
      }
    }
  }

  public setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }
}
