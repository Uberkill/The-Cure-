import * as THREE from 'three';

export class EditorVisualizers {
  private scene: THREE.Scene;
  private visualizerNodes: THREE.Group[] = [];
  private isEnabled: boolean = false;
  private isVisible: boolean = true;

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
      // Don't recurse into our own visualizers
      if (child.name === 'dev_visualizers_node') return;

      if (child.name && (child.name.startsWith('prop_') || child.name.startsWith('door_') || child.name.startsWith('crystal_') || child.name.startsWith('prefab_'))) {
        
        // Temporarily reset transform to get pristine local bounding box
        const oldPos = child.position.clone();
        const oldRot = child.rotation.clone();
        const oldScale = child.scale.clone();
        
        child.position.set(0, 0, 0);
        child.rotation.set(0, 0, 0);
        child.scale.set(1, 1, 1);
        child.updateMatrixWorld(true);
        
        const localBox = new THREE.Box3().setFromObject(child);
        
        // Restore transform
        child.position.copy(oldPos);
        child.rotation.copy(oldRot);
        child.scale.copy(oldScale);
        child.updateMatrixWorld(true);

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
          
          // Inverse scale to maintain text readability when object is scaled
          const scaleAvg = (oldScale.x + oldScale.y + oldScale.z) / 3;
          sprite.position.y += (size.y / 2) + (0.1 / scaleAvg);
          sprite.scale.set(0.5 / oldScale.x, 0.125 / oldScale.y, 1 / oldScale.z);
          sprite.renderOrder = 1000;
          vizNode.add(sprite);
        }

        child.add(vizNode);
        this.visualizerNodes.push(vizNode);
      }
    });
  }

  private clear(): void {
    for (const vizNode of this.visualizerNodes) {
      if (vizNode.parent) {
        vizNode.parent.remove(vizNode);
      }
      
      vizNode.traverse((child) => {
        if (child instanceof THREE.LineSegments) {
          child.geometry.dispose();
        } else if (child instanceof THREE.Sprite) {
          child.material.map?.dispose();
          child.material.dispose();
        }
      });
    }
    this.visualizerNodes = [];
  }
}
