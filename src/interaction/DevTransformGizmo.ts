import * as THREE from 'three';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { SelectionBox } from 'three/examples/jsm/interactive/SelectionBox.js';
import { RaycastManager } from './RaycastManager';
import { EventBus } from '../core/EventBus';
import { EditorVisualizers } from '../editor/EditorVisualizers';


export interface TransformSnapshot {
  objects: {
    uuid: string;
    object: THREE.Object3D;
    position: THREE.Vector3;
    rotation: THREE.Euler;
    scale: THREE.Vector3;
  }[];
}

export class DevTransformGizmo {
  private scene: THREE.Scene;
  private camera: THREE.Camera;
  private domElement: HTMLElement;
  private orbitControls: OrbitControls;
  private raycastManager: RaycastManager;

  private transformControls: TransformControls;
  private helper: THREE.Object3D;
  private isEnabled: boolean = false;
  private selectedObjects: THREE.Object3D[] = [];
  private dummyPivot: THREE.Group = new THREE.Group();
  private raycaster: THREE.Raycaster = new THREE.Raycaster();
  private mouse: THREE.Vector2 = new THREE.Vector2();

  private pivotStartPos = new THREE.Vector3();
  private pivotStartQuat = new THREE.Quaternion();
  private pivotStartScale = new THREE.Vector3();
  private objectStartStates: Map<THREE.Object3D, { pos: THREE.Vector3, quat: THREE.Quaternion, scale: THREE.Vector3 }> = new Map();

  private selectionBox: SelectionBox;
  private marqueeDiv: HTMLDivElement;
  private history: TransformSnapshot[] = [];
  private currentSnapshot: TransformSnapshot | null = null;
  private isMarqueeDragging: boolean = false;
  private marqueeStartPoint = new THREE.Vector2();
  
  public onTransformChange?: (objects: THREE.Object3D[]) => void;
  public onSelectionChange?: (objects: THREE.Object3D[]) => void;
  public onToggle?: (enabled: boolean) => void;

  private keyListener: (e: KeyboardEvent) => void;
  private pointerListener: (e: PointerEvent) => void;
  private pointerMoveListener: (e: PointerEvent) => void;
  private pointerUpListener: (e: PointerEvent) => void;

  constructor(
    scene: THREE.Scene,
    camera: THREE.Camera,
    domElement: HTMLElement,
    orbitControls: OrbitControls,
    raycastManager: RaycastManager
  ) {
    this.scene = scene;
    this.camera = camera;
    this.domElement = domElement;
    this.orbitControls = orbitControls;
    this.raycastManager = raycastManager;

    this.scene.add(this.dummyPivot);

    this.transformControls = new TransformControls(this.camera, this.domElement);
    this.transformControls.size = 0.75;
    this.transformControls.enabled = false;
    this.helper = this.transformControls.getHelper();
    this.helper.visible = false;
    this.scene.add(this.helper);

    this.selectionBox = new SelectionBox(this.camera, this.scene);
    
    // Inject CSS for marquee box
    if (!document.getElementById('gizmo-marquee-style')) {
      const style = document.createElement('style');
      style.id = 'gizmo-marquee-style';
      style.textContent = `
        .selectBox {
          border: 1px solid rgba(255, 255, 255, 0.8);
          background-color: rgba(255, 255, 255, 0.1);
          position: fixed;
          pointer-events: none;
          z-index: 9999;
          display: none;
        }
      `;
      document.head.appendChild(style);
    }
    
    this.marqueeDiv = document.createElement('div');
    this.marqueeDiv.classList.add('selectBox');
    this.domElement.parentElement?.appendChild(this.marqueeDiv);

    // Apply delta transforms to all selected objects
    this.transformControls.addEventListener('objectChange', () => {
      if (this.selectedObjects.length > 0) {
        
        // Calculate deltas from the dummy pivot's movement
        const deltaQuat = this.dummyPivot.quaternion.clone().multiply(this.pivotStartQuat.clone().invert());
        const deltaScale = this.dummyPivot.scale.clone().divide(this.pivotStartScale);

        for (const obj of this.selectedObjects) {
          const state = this.objectStartStates.get(obj);
          if (state) {
            // Apply scale (assuming local)
            obj.scale.copy(state.scale).multiply(deltaScale);
            
            // Apply rotation
            obj.quaternion.copy(deltaQuat).multiply(state.quat);
            
            // Apply translation (orbiting around pivot)
            const offset = state.pos.clone().sub(this.pivotStartPos);
            offset.applyQuaternion(deltaQuat);
            obj.position.copy(this.dummyPivot.position).add(offset);
          }
        }
        
        if (this.onTransformChange) {
          this.onTransformChange(this.selectedObjects);
        }
      }
    });

    this.transformControls.addEventListener('dragging-changed', (event) => {
      const isDragging = !!event.value;
      this.orbitControls.enabled = !isDragging;
      this.raycastManager.setEnabled(!isDragging && !this.isEnabled);

      if (isDragging) {
        // Drag started - capture snapshot
        this.currentSnapshot = {
          objects: this.selectedObjects.map(obj => ({
            uuid: obj.uuid,
            object: obj,
            position: obj.position.clone(),
            rotation: obj.rotation.clone(),
            scale: obj.scale.clone()
          }))
        };
      } else {
        // Drag ended
        if (this.currentSnapshot) {
          this.history.push(this.currentSnapshot);
          if (this.history.length > 50) this.history.shift(); // Max 50 undos
          this.currentSnapshot = null;
        }

        if (this.selectedObjects.length > 0) {
          if (this.onTransformChange) {
            this.onTransformChange(this.selectedObjects);
          }
          // Update start states for next drag
          this.cacheStartStates();
          EventBus.getInstance().emit('editor:rebuild_visualizers', {});
        }
      }
    });

    this.keyListener = this.handleKeyDown.bind(this);
    this.pointerListener = this.handlePointerDown.bind(this);
    this.pointerMoveListener = this.handlePointerMove.bind(this);
    this.pointerUpListener = this.handlePointerUp.bind(this);

    window.addEventListener('keydown', this.keyListener);
    this.domElement.addEventListener('pointerdown', this.pointerListener);
    this.domElement.addEventListener('pointermove', this.pointerMoveListener);
    window.addEventListener('pointerup', this.pointerUpListener); // window so it fires even if dragged outside
  }

  public setEnabled(enabled: boolean): void {
    if (this.isEnabled === enabled) return;
    this.isEnabled = enabled;
    this.transformControls.enabled = enabled && this.selectedObjects.length > 0;
    this.helper.visible = enabled && this.selectedObjects.length > 0;

    this.raycastManager.setEnabled(!enabled);

    if (!enabled && this.selectedObjects.length > 0) {
      this.detach();
    }

    if (this.onToggle) {
      this.onToggle(enabled);
    }
  }

  public toggle(): boolean {
    this.setEnabled(!this.isEnabled);
    return this.isEnabled;
  }

  public attachMultiple(objects: THREE.Object3D[]): void {
    if (objects.length === 0) {
      this.detach();
      return;
    }

    this.selectedObjects = [...objects];
    if (this.isEnabled) {
      this.transformControls.enabled = true;
      this.helper.visible = true;
    }
    
    // Calculate bounding box center of all selected objects
    const box = new THREE.Box3();
    for (const obj of objects) {
      box.expandByObject(obj);
    }
    
    const center = new THREE.Vector3();
    if (!box.isEmpty()) {
      box.getCenter(center);
    }
    
    this.dummyPivot.position.copy(center);
    this.dummyPivot.quaternion.identity();
    this.dummyPivot.scale.set(1, 1, 1);
    
    this.cacheStartStates();
    
    this.transformControls.attach(this.dummyPivot);

    if (this.onSelectionChange) {
      this.onSelectionChange(this.selectedObjects);
    }
    EventBus.getInstance().emit('editor:selection_changed', { selected: this.selectedObjects });
  }

  private cacheStartStates(): void {
    this.pivotStartPos.copy(this.dummyPivot.position);
    this.pivotStartQuat.copy(this.dummyPivot.quaternion);
    this.pivotStartScale.copy(this.dummyPivot.scale);
    
    this.objectStartStates.clear();
    for (const obj of this.selectedObjects) {
      this.objectStartStates.set(obj, {
        pos: obj.position.clone(),
        quat: obj.quaternion.clone(),
        scale: obj.scale.clone()
      });
    }
  }

  public detach(): void {
    this.transformControls.detach();
    this.transformControls.enabled = false;
    this.selectedObjects = [];
    this.objectStartStates.clear();
    this.isMarqueeDragging = false;
    this.marqueeDiv.style.display = 'none';
    if (this.onSelectionChange) {
      this.onSelectionChange([]);
    }
    EventBus.getInstance().emit('editor:selection_changed', { selected: [] });
  }

  public setMode(mode: 'translate' | 'rotate' | 'scale'): void {
    this.transformControls.setMode(mode);
  }

  public getMode(): string {
    return this.transformControls.getMode();
  }

  public getSelectedObjects(): THREE.Object3D[] {
    return this.selectedObjects;
  }

  public setSnapping(enabled: boolean): void {
    if (enabled) {
      this.transformControls.setTranslationSnap(0.1);
      this.transformControls.setRotationSnap(THREE.MathUtils.degToRad(15));
      this.transformControls.setScaleSnap(0.1);
    } else {
      this.transformControls.setTranslationSnap(null as any);
      this.transformControls.setRotationSnap(null as any);
      this.transformControls.setScaleSnap(null as any);
    }
  }

  public syncTransform(): void {
    if (this.selectedObjects.length > 0) {
      this.selectedObjects[0].updateMatrixWorld(true);
    }
  }

  private clipboard: THREE.Object3D[] = [];

  private handleKeyDown(e: KeyboardEvent): void {
    // Input guard: ignore hotkeys if typing in input, textarea, or contentEditable
    const active = document.activeElement;
    if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || (active as HTMLElement).isContentEditable)) {
      return;
    }

    if (e.key === 'g' || e.key === 'G') {
      this.toggle();
      return;
    }

    if (!this.isEnabled) return;

    if (e.ctrlKey || e.metaKey) {
      if (e.key === 'c' || e.key === 'C') {
        if (this.selectedObjects.length > 0) {
          this.clipboard = this.selectedObjects.map(obj => obj.clone());
          this.showToast(`Copied ${this.clipboard.length} object(s)`);
        }
        return;
      }
      if (e.key === 'v' || e.key === 'V') {
        if (this.clipboard.length > 0) {
          const pasted: THREE.Object3D[] = [];
          for (const clip of this.clipboard) {
            const clone = clip.clone();
            const id = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
              const r = Math.random() * 16 | 0;
              return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
            });
            
            // Re-name and setup userData for prefabs
            const baseName = clone.name.split('_')[1] || clone.name;
            clone.name = `prefab_${baseName}_${id.split('-')[0]}`;
            clone.userData = { ...clone.userData, isPrefab: true, prefabType: baseName, prefabId: id };
            
            // Offset to prevent z-fighting
            clone.position.add(new THREE.Vector3(0.1, 0, 0.1));
            
            // Remove any ghost visualizers cloned from the original
            const ghosts: THREE.Object3D[] = [];
            clone.traverse(child => {
              if (child.name === 'dev_visualizers_node') {
                ghosts.push(child);
              }
            });
            ghosts.forEach(g => {
              if (g.parent) g.parent.remove(g);
              // Dispose resources for safety
              g.traverse(gc => {
                if (gc instanceof THREE.LineSegments) gc.geometry.dispose();
                if (gc instanceof THREE.Sprite) { gc.material.map?.dispose(); gc.material.dispose(); }
              });
            });
            
            this.scene.add(clone);
            pasted.push(clone);
          }
          this.attachMultiple(pasted);
          this.showToast(`Pasted ${pasted.length} object(s)`);
          
          EventBus.getInstance().emit('editor:rebuild_visualizers', {});
          
          // Trigger save via change event
          if (this.onTransformChange) {
            this.onTransformChange(this.selectedObjects);
          }
        }
        return;
      }
    }

    if ((e.ctrlKey || e.metaKey) && (e.key === 'z' || e.key === 'Z')) {
      this.undo();
      return;
    }
    
    if (e.key === 'w' || e.key === 'W') {
      this.setMode('translate');
      this.showToast('Gizmo Mode: Translate (Move)');
    } else if (e.key === 'e' || e.key === 'E') {
      this.setMode('rotate');
      this.showToast('Gizmo Mode: Rotate');
    } else if (e.key === 'r' || e.key === 'R') {
      this.setMode('scale');
      this.showToast('Gizmo Mode: Scale');
    } else if (e.key === 'Delete' || e.key === 'Backspace') {
      if (this.selectedObjects.length > 0) {
        const deletedCount = this.selectedObjects.length;
        for (const obj of this.selectedObjects) {
          if (obj.parent) {
            obj.parent.remove(obj);
          }
        }
        this.detach();
        this.showToast(`Deleted ${deletedCount} object(s)`);
        
        // Trigger save via change event
        if (this.onTransformChange) {
          this.onTransformChange([]);
        }
      }
    } else if (e.key === 'Escape') {
      this.detach();
      this.showToast('Deselected object');
    }
  }

  public undo(): void {
    const snapshot = this.history.pop();
    if (snapshot) {
      for (const item of snapshot.objects) {
        if (item.object) {
          item.object.position.copy(item.position);
          item.object.rotation.copy(item.rotation);
          item.object.scale.copy(item.scale);
        }
      }
      
      // Update dummy box position if multi-selecting
      if (this.selectedObjects.length > 1) {
        const center = new THREE.Vector3();
        this.selectedObjects.forEach(obj => center.add(obj.position));
        center.divideScalar(this.selectedObjects.length);
        this.dummyPivot.position.copy(center);
        this.dummyPivot.rotation.set(0, 0, 0);
        this.dummyPivot.scale.set(1, 1, 1);
      }
      
      if (this.onTransformChange) {
        this.onTransformChange(this.selectedObjects);
      }
      this.showToast('Undo transform');
    } else {
      this.showToast('Nothing to undo');
    }
  }

  private handlePointerDown(e: PointerEvent): void {
    if (!this.isEnabled) return;
    if (this.transformControls.dragging) return;

    const rect = this.domElement.getBoundingClientRect();
    this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.scene.children, true);

    for (const hit of intersects) {
      let target: THREE.Object3D | null = hit.object;
      
      // Ignore helpers
      let isHelper = false;
      let curr: THREE.Object3D | null = target;
      while (curr) {
        if (
          curr.name === 'Editor_Helpers_Group' ||
          curr.userData.isHelper ||
          curr.name === 'dev_visualizers_node' ||
          curr.name === 'dev_selected_visualizer_node'
        ) {
          isHelper = true;
          break;
        }
        curr = curr.parent;
      }
      if (isHelper) continue;

      let lowestProp: THREE.Object3D | null = null;
      let highestProp: THREE.Object3D | null = null;
      while (target && target.parent && target.parent !== this.scene) {
        if (EditorVisualizers.isTrackedProp(target)) {
          if (!lowestProp) lowestProp = target;
          if (!target.userData?.isSubPart) {
            highestProp = target;
          }
        }
        target = target.parent;
      }

      const found = (e.altKey && lowestProp) ? lowestProp : (highestProp || lowestProp);

      if (found) {
        target = found;
        if (e.shiftKey) {
          const current = [...this.selectedObjects];
          if (!current.includes(target)) {
            current.push(target);
            this.attachMultiple(current);
          } else {
            this.attachMultiple(current.filter(o => o !== target));
          }
        } else {
          this.attachMultiple([target]);
        }
        return;
      }
    }
    
    // If clicked empty space
    if (!e.shiftKey) {
      this.detach();
    }
    
    // Only allow marquee drag on left click with Shift key to preserve camera orbit
    if (e.button === 0 && e.shiftKey) {
      this.isMarqueeDragging = true;
      this.marqueeStartPoint.set(e.clientX, e.clientY);
      this.marqueeDiv.style.left = e.clientX + 'px';
      this.marqueeDiv.style.top = e.clientY + 'px';
      this.marqueeDiv.style.width = '0px';
      this.marqueeDiv.style.height = '0px';
      this.marqueeDiv.style.display = 'block';
      this.orbitControls.enabled = false;
    }
  }

  private handlePointerMove(e: PointerEvent): void {
    if (!this.isMarqueeDragging) return;

    const currentX = e.clientX;
    const currentY = e.clientY;

    const left = Math.min(this.marqueeStartPoint.x, currentX);
    const top = Math.min(this.marqueeStartPoint.y, currentY);
    const width = Math.max(this.marqueeStartPoint.x, currentX) - left;
    const height = Math.max(this.marqueeStartPoint.y, currentY) - top;

    this.marqueeDiv.style.left = left + 'px';
    this.marqueeDiv.style.top = top + 'px';
    this.marqueeDiv.style.width = width + 'px';
    this.marqueeDiv.style.height = height + 'px';
  }

  private handlePointerUp(e: PointerEvent): void {
    if (!this.isMarqueeDragging) return;

    this.isMarqueeDragging = false;
    this.marqueeDiv.style.display = 'none';
    this.orbitControls.enabled = true;

    // Check if it was actually a drag (not just a click)
    const dx = Math.abs(e.clientX - this.marqueeStartPoint.x);
    const dy = Math.abs(e.clientY - this.marqueeStartPoint.y);
    if (dx < 5 && dy < 5) return;

    // Use SelectionBox to find objects
    const rect = this.domElement.getBoundingClientRect();
    const startPoint = new THREE.Vector3(
      ((this.marqueeStartPoint.x - rect.left) / rect.width) * 2 - 1,
      -((this.marqueeStartPoint.y - rect.top) / rect.height) * 2 + 1,
      0.5
    );
    const endPoint = new THREE.Vector3(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      -((e.clientY - rect.top) / rect.height) * 2 + 1,
      0.5
    );

    const collection = this.selectionBox.select(startPoint, endPoint);

    // Filter to valid parents (similar to raycaster logic)
    const newSelection = new Set<THREE.Object3D>([...this.selectedObjects]);

    for (const obj of collection) {
      // Ignore Editor helpers and visualizers
      let isHelper = false;
      let curr: THREE.Object3D | null = obj;
      while (curr) {
        if (
          curr.name === 'Editor_Helpers_Group' ||
          curr.userData.isHelper ||
          curr.name === 'dev_visualizers_node' ||
          curr.name === 'dev_selected_visualizer_node'
        ) {
          isHelper = true;
          break;
        }
        curr = curr.parent;
      }
      if (isHelper) continue;

      let target: THREE.Object3D | null = obj;
      let lowestProp: THREE.Object3D | null = null;
      let highestProp: THREE.Object3D | null = null;
      while (target && target.parent && target.parent !== this.scene) {
        if (EditorVisualizers.isTrackedProp(target)) {
          if (!lowestProp) lowestProp = target;
          if (!target.userData?.isSubPart) {
            highestProp = target;
          }
        }
        target = target.parent;
      }

      const found = (e.altKey && lowestProp) ? lowestProp : (highestProp || lowestProp);

      if (found) {
        newSelection.add(found);
      }
    }

    this.attachMultiple(Array.from(newSelection));
    if (newSelection.size > 0) {
      this.showToast(`Selected ${newSelection.size} object(s)`);
    }
  }

  private showToast(message: string): void {
    let toast = document.getElementById('gizmo-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'gizmo-toast';
      toast.style.position = 'fixed';
      toast.style.bottom = '24px';
      toast.style.right = '24px';
      toast.style.background = 'rgba(20, 26, 33, 0.88)';
      toast.style.color = '#e2e6e0';
      toast.style.fontFamily = 'monospace';
      toast.style.fontSize = '12px';
      toast.style.padding = '8px 14px';
      toast.style.borderRadius = '4px';
      toast.style.border = '1px solid rgba(255, 255, 255, 0.15)';
      toast.style.zIndex = '99999';
      toast.style.pointerEvents = 'none';
      toast.style.transition = 'opacity 0.25s ease';
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.style.opacity = '1';
    window.clearTimeout((this as unknown as { _toastTimer?: number })._toastTimer);
    (this as unknown as { _toastTimer?: number })._toastTimer = window.setTimeout(() => {
      if (toast) toast.style.opacity = '0';
    }, 2800);
  }

  public dispose(): void {
    window.removeEventListener('keydown', this.keyListener);
    this.domElement.removeEventListener('pointerdown', this.pointerListener);
    this.domElement.removeEventListener('pointermove', this.pointerMoveListener);
    window.removeEventListener('pointerup', this.pointerUpListener);
    this.transformControls.dispose();
    this.scene.remove(this.helper);
    this.marqueeDiv.remove();
  }
}



