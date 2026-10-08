import * as THREE from 'three';

export class EditorState {
  private static instance: EditorState;
  
  public selectedObjects: THREE.Object3D[] = [];
  public onSelectionChanged: () => void = () => {};

  private constructor() {}

  public static getInstance(): EditorState {
    if (!EditorState.instance) {
      EditorState.instance = new EditorState();
    }
    return EditorState.instance;
  }

  public select(object: THREE.Object3D, multi: boolean = false): void {
    if (multi) {
      if (!this.selectedObjects.includes(object)) {
        this.selectedObjects.push(object);
      }
    } else {
      this.selectedObjects = [object];
    }
    this.onSelectionChanged();
  }

  public deselect(object: THREE.Object3D): void {
    this.selectedObjects = this.selectedObjects.filter(o => o !== object);
    this.onSelectionChanged();
  }

  public clearSelection(): void {
    if (this.selectedObjects.length > 0) {
      this.selectedObjects = [];
      this.onSelectionChanged();
    }
  }

  public getPrimarySelection(): THREE.Object3D | null {
    return this.selectedObjects.length > 0 ? this.selectedObjects[0] : null;
  }
}
