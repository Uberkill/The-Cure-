import * as THREE from 'three';
import { RoomLayoutData } from '../types';

export class EditorServerSync {
  public static async saveLayout(data: RoomLayoutData): Promise<boolean> {
    try {
      if (typeof window !== 'undefined' && typeof window.fetch === 'function') {
        const base = (window.location && window.location.origin && window.location.origin !== 'null' && !window.location.origin.startsWith('file:'))
          ? window.location.origin
          : 'http://localhost';
        const url = new URL('/api/save-layout', base).toString();
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        if (response && response.ok) {
          console.log('[Dev Editor] Saved layout to server successfully.');
          return true;
        }
      }
    } catch {
      // Dev server unreachable or offline test environment - proceed to LocalStorage fallback
    }

    try {
      const current = localStorage.getItem('vault_editor_layout');
      let parsed = {};
      if (current) {
        parsed = JSON.parse(current);
      }
      const merged = { ...parsed, ...data };
      localStorage.setItem('vault_editor_layout', JSON.stringify(merged));
      return true;
    } catch (lsErr) {
      console.error('[Dev Editor] LocalStorage fallback failed.', lsErr);
      return false;
    }
  }

  public static async fetchLayout(): Promise<any> {
    try {
      if (typeof window !== 'undefined' && typeof window.fetch === 'function') {
        const base = (window.location && window.location.origin && window.location.origin !== 'null' && !window.location.origin.startsWith('file:'))
          ? window.location.origin
          : 'http://localhost';
        const url = new URL('/src/data/room_layout.json?t=' + Date.now(), base).toString();
        const resp = await fetch(url);
        if (resp && resp.ok) {
          return await resp.json();
        }
      }
    } catch {
      // Server fetch unavailable or offline test environment - proceed to LocalStorage fallback
    }
    
    try {
      const stored = localStorage.getItem('vault_editor_layout');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (err) {
      console.error(err);
    }
    return {};
  }

  public static applyOverridesToGroup(group: THREE.Object3D, layout: any): void {
    if (!layout || !group) return;
    group.traverse((child) => {
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
  }
}
