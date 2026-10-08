import * as THREE from 'three';

export class EditorVisualizers {
  private scene: THREE.Scene;
  private visualizerGroup: THREE.Group;
  private isEnabled: boolean = false;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.visualizerGroup = new THREE.Group();
    this.visualizerGroup.name = 'dev_visualizers';
    this.scene.add(this.visualizerGroup);
  }

  public enable(): void {
    this.isEnabled = true;
    this.rebuild();
  }

  public disable(): void {
    this.isEnabled = false;
    this.clear();
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
      if (child === this.visualizerGroup) return;

      if (child.name && (child.name.startsWith('prop_') || child.name.startsWith('door_') || child.name.startsWith('crystal_'))) {
        
        // Calculate the bounding box of the interactive group/mesh
        const box = new THREE.Box3().setFromObject(child);
        if (box.isEmpty()) return;

        const size = new THREE.Vector3();
        box.getSize(size);
        const center = new THREE.Vector3();
        box.getCenter(center);

        const boxGeo = new THREE.BoxGeometry(size.x, size.y, size.z);
        const edges = new THREE.EdgesGeometry(boxGeo);
        const line = new THREE.LineSegments(edges, wireframeMat);
        
        line.position.copy(center);
        line.renderOrder = 999; // Render on top of everything
        this.visualizerGroup.add(line);

        // Add floating text sprite for the name
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
          sprite.position.y += size.y / 2 + 0.1; // Hover slightly above
          sprite.scale.set(0.5, 0.125, 1);
          sprite.renderOrder = 1000;
          this.visualizerGroup.add(sprite);
        }
      }
    });
  }

  private clear(): void {
    while (this.visualizerGroup.children.length > 0) {
      const child = this.visualizerGroup.children[0];
      if (child instanceof THREE.LineSegments) {
        child.geometry.dispose();
      } else if (child instanceof THREE.Sprite) {
        child.material.map?.dispose();
        child.material.dispose();
      }
      this.visualizerGroup.remove(child);
    }
  }
}
