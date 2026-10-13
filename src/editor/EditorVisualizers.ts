import * as THREE from 'three';

export class EditorVisualizers {
  private scene: THREE.Scene;
  private visualizerNodes: THREE.Group[] = [];
  private isEnabled: boolean = false;
  private isVisible: boolean = true;

  private selectedVisualizerNode: THREE.Group | null = null;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  public enable(): void {
    this.isEnabled = true;
    this.rebuild();
  }

  public disable(): void {
    this.isEnabled = false;
    this.clear();
  }

  public setVisible(visible: boolean): void {
    this.isVisible = visible;
    for (const vizNode of this.visualizerNodes) {
      vizNode.visible = visible;
    }
    if (this.selectedVisualizerNode) {
      this.selectedVisualizerNode.visible = visible;
    }
  }

  public static computeObjectLocalBox(root: THREE.Object3D): THREE.Box3 {
    const box = new THREE.Box3();
    root.updateWorldMatrix(true, true);
    const invRootMatrix = root.matrixWorld.clone().invert();

    let hasGeometry = false;
    root.traverse((node) => {
      if (node.name === 'dev_visualizers_node' || node.name === 'dev_selected_visualizer_node' || node.userData?.isHelper) return;
      if (node instanceof THREE.Mesh && node.geometry) {
        if (!node.geometry.boundingBox) {
          node.geometry.computeBoundingBox();
        }
        if (node.geometry.boundingBox) {
          const nodeToRootMatrix = invRootMatrix.clone().multiply(node.matrixWorld);
          const meshBox = node.geometry.boundingBox.clone().applyMatrix4(nodeToRootMatrix);
          box.union(meshBox);
          hasGeometry = true;
        }
      }
    });

    if (!hasGeometry) {
      box.makeEmpty();
    }
    return box;
  }

  public static isTrackedProp(obj: THREE.Object3D | null): boolean {
    if (!obj || !obj.name) return false;
    if (obj.userData?.isHelper || obj.name === 'dev_visualizers_node' || obj.name === 'dev_selected_visualizer_node') return false;
    return (
      !!obj.userData?.isPrefab ||
      !!obj.userData?.isInteractiveProp ||
      obj.name.startsWith('prop_') ||
      obj.name.startsWith('door_') ||
      obj.name.startsWith('crystal_') ||
      obj.name.startsWith('prefab_') ||
      obj.name === 'mesh_anechoic_baffles' ||
      obj.name === 'mesh_audio_cables' ||
      obj.name === 'mesh_back_bar_shelves'
    );
  }

  public setSelectedObject(obj: THREE.Object3D | null): void {
    this.clearSelectedVisualizer();
    if (!this.isEnabled || !obj) return;

    const localBox = EditorVisualizers.computeObjectLocalBox(obj);
    if (localBox.isEmpty()) return;

    const size = new THREE.Vector3();
    localBox.getSize(size);
    const center = new THREE.Vector3();
    localBox.getCenter(center);

    const vizNode = new THREE.Group();
    vizNode.name = 'dev_selected_visualizer_node';
    vizNode.userData.isHelper = true;
    vizNode.visible = this.isVisible;

    const boxGeo = new THREE.BoxGeometry(size.x, size.y, size.z);
    const edges = new THREE.EdgesGeometry(boxGeo);
    const wireframeMat = new THREE.LineBasicMaterial({
      color: 0xfbbf24,
      depthTest: false,
      transparent: true,
      opacity: 0.95
    });
    const line = new THREE.LineSegments(edges, wireframeMat);
    line.position.copy(center);
    line.renderOrder = 1001;
    vizNode.add(line);

    obj.add(vizNode);
    this.selectedVisualizerNode = vizNode;
  }

  private clearSelectedVisualizer(): void {
    if (this.selectedVisualizerNode) {
      if (this.selectedVisualizerNode.parent) {
        this.selectedVisualizerNode.parent.remove(this.selectedVisualizerNode);
      }
      this.selectedVisualizerNode.traverse((child) => {
        if (child instanceof THREE.LineSegments) {
          child.geometry.dispose();
          if (Array.isArray(child.material)) {
            child.material.forEach(m => m.dispose());
          } else {
            child.material.dispose();
          }
        }
      });
      this.selectedVisualizerNode = null;
    }
  }

  public rebuild(): void {
    this.clear();
    if (!this.isEnabled) return;

    const wireframeMat = new THREE.LineBasicMaterial({
      color: 0x00ff88,
      depthTest: false,
      transparent: true,
      opacity: 0.6
    });

    this.scene.traverse((child) => {
      if (child.name === 'dev_visualizers_node' || child.name === 'dev_selected_visualizer_node') return;
      if (child.userData?.isSubPart) return;

      if (EditorVisualizers.isTrackedProp(child)) {
        let parent = child.parent;
        let hasAssemblyAncestor = false;
        while (parent && parent !== this.scene) {
          if (EditorVisualizers.isTrackedProp(parent) && !parent.userData?.isSubPart) {
            hasAssemblyAncestor = true;
            break;
          }
          parent = parent.parent;
        }

        if (hasAssemblyAncestor && !child.userData?.allowIndependentVisualizer) {
          return;
        }

        const localBox = EditorVisualizers.computeObjectLocalBox(child);
        if (localBox.isEmpty()) return;

        const size = new THREE.Vector3();
        localBox.getSize(size);
        const center = new THREE.Vector3();
        localBox.getCenter(center);

        const vizNode = new THREE.Group();
        vizNode.name = 'dev_visualizers_node';
        vizNode.userData.isHelper = true;
        vizNode.visible = this.isVisible;

        const boxGeo = new THREE.BoxGeometry(size.x, size.y, size.z);
        const edges = new THREE.EdgesGeometry(boxGeo);
        const line = new THREE.LineSegments(edges, wireframeMat);
        
        line.position.copy(center);
        line.renderOrder = 999;
        vizNode.add(line);

        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#00ff88';
          ctx.font = 'bold 24px monospace';
          ctx.textAlign = 'center';
          ctx.fillText(child.name, 128, 40);
          
          const tex = new THREE.CanvasTexture(canvas);
          const spriteMat = new THREE.SpriteMaterial({ map: tex, depthTest: false });
          const sprite = new THREE.Sprite(spriteMat);
          
          sprite.position.copy(center);
          
          const scale = child.scale;
          const scaleAvg = (scale.x + scale.y + scale.z) / 3;
          sprite.position.y += (size.y / 2) + (0.1 / Math.max(0.001, scaleAvg));
          sprite.scale.set(0.5 / Math.max(0.001, scale.x), 0.125 / Math.max(0.001, scale.y), 1 / Math.max(0.001, scale.z));
          sprite.renderOrder = 1000;
          vizNode.add(sprite);
        }

        child.add(vizNode);
        this.visualizerNodes.push(vizNode);
      }
    });
  }

  private clear(): void {
    this.clearSelectedVisualizer();
    for (const vizNode of this.visualizerNodes) {
      if (vizNode.parent) {
        vizNode.parent.remove(vizNode);
      }
      
      vizNode.traverse((child) => {
        if (child instanceof THREE.LineSegments) {
          child.geometry.dispose();
          if (Array.isArray(child.material)) {
            child.material.forEach(m => m.dispose());
          } else {
            child.material.dispose();
          }
        } else if (child instanceof THREE.Sprite) {
          child.material.map?.dispose();
          child.material.dispose();
        }
      });
    }
    this.visualizerNodes = [];
  }
}
