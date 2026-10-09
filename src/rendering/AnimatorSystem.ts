import * as THREE from 'three';
import { EventBus } from '../core/EventBus';

interface ActiveAnimation {
  object: THREE.Object3D;
  start: number;
  end: number;
  axis: 'x' | 'y' | 'z';
  type: 'rotation' | 'position';
  duration: number;
  elapsed: number;
  targetState: boolean; // true = moving to end, false = moving to start
}

export class AnimatorSystem {
  private static instance: AnimatorSystem;
  private activeAnimations: ActiveAnimation[] = [];
  private eventBus: EventBus;
  private scene!: THREE.Scene;
  private playerCamera!: THREE.Camera;

  private constructor() {
    this.eventBus = EventBus.getInstance();
  }

  public static getInstance(): AnimatorSystem {
    if (!AnimatorSystem.instance) {
      AnimatorSystem.instance = new AnimatorSystem();
    }
    return AnimatorSystem.instance;
  }

  public init(scene: THREE.Scene, camera: THREE.Camera): void {
    this.scene = scene;
    this.playerCamera = camera;
    
    this.eventBus.on('input:object_clicked', ({ objectId }) => {
      this.triggerClick(objectId);
    });
  }

  public triggerClick(objectId: string): void {
    if (!this.scene) return;
    const obj = this.scene.getObjectByName(objectId);
    if (!obj || !obj.userData) return;

    if (obj.userData.animTrigger === 'click' && obj.userData.animType) {
      this.toggleAnimation(obj);
    }
  }

  private toggleAnimation(obj: THREE.Object3D): void {
    const isAtEnd = obj.userData.animState === true;
    const targetState = !isAtEnd;
    
    const startVal = obj.userData.animStart !== undefined ? obj.userData.animStart : 0;
    const endVal = obj.userData.animEnd !== undefined ? obj.userData.animEnd : 0;
    const duration = obj.userData.animDuration || 800;
    
    // Remove existing animation for this object if any
    this.activeAnimations = this.activeAnimations.filter(a => a.object !== obj);
    
    // Add new animation
    this.activeAnimations.push({
      object: obj,
      start: targetState ? startVal : endVal,
      end: targetState ? endVal : startVal,
      axis: obj.userData.animAxis as 'x'|'y'|'z',
      type: obj.userData.animType as 'rotation'|'position',
      duration,
      elapsed: 0,
      targetState
    });
  }

  public update(delta: number): void {
    if (!this.scene) return;
    
    // 1. Process active interpolations
    for (let i = this.activeAnimations.length - 1; i >= 0; i--) {
      const anim = this.activeAnimations[i];
      anim.elapsed += (delta * 1000); // delta is in seconds
      
      const progress = Math.min(1.0, anim.elapsed / anim.duration);
      // Sine easing
      const eased = Math.sin((progress * Math.PI) / 2);
      const current = anim.start + (anim.end - anim.start) * eased;
      
      if (anim.type === 'rotation') {
        anim.object.rotation[anim.axis] = current;
      } else {
        anim.object.position[anim.axis] = current;
      }
      
      if (progress >= 1.0) {
        anim.object.userData.animState = anim.targetState;
        this.activeAnimations.splice(i, 1);
      }
    }

    // 2. Proximity Triggers
    if (this.playerCamera) {
      const playerPos = this.playerCamera.position;
      this.scene.traverse((child) => {
        if (child.userData && child.userData.animTrigger === 'proximity' && child.userData.animType) {
          // get absolute world position of child
          const childWorldPos = new THREE.Vector3();
          child.getWorldPosition(childWorldPos);
          const dist = playerPos.distanceTo(childWorldPos);
          const isAtEnd = child.userData.animState === true;
          const shouldBeAtEnd = dist < 2.5; // Trigger distance

          if (shouldBeAtEnd !== isAtEnd) {
            // Only trigger if not already animating towards the target state
            const existingAnim = this.activeAnimations.find(a => a.object === child);
            if (!existingAnim || existingAnim.targetState !== shouldBeAtEnd) {
              this.toggleAnimation(child);
            }
          }
        }
      });
    }
  }
}
