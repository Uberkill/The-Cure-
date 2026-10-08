import * as THREE from 'three';

export class EditorPrefabs {
  public static generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  public static spawn(type: string): THREE.Group {
    const group = new THREE.Group();
    const id = this.generateUUID();
    group.name = `prefab_${type}_${id.split('-')[0]}`;
    
    // Add custom property to identify as prefab
    group.userData = { isPrefab: true, prefabType: type, prefabId: id };

    switch (type) {
      case 'Painting': {
        const frame = new THREE.Mesh(
          new THREE.BoxGeometry(1.2, 0.8, 0.05),
          new THREE.MeshStandardMaterial({ color: 0x3e2723, roughness: 0.8 })
        );
        const canvas = new THREE.Mesh(
          new THREE.PlaneGeometry(1.1, 0.7),
          new THREE.MeshStandardMaterial({ color: 0xcccccc, roughness: 1.0 })
        );
        canvas.position.z = 0.026;
        group.add(frame, canvas);
        break;
      }
      case 'Plant': {
        const pot = new THREE.Mesh(
          new THREE.CylinderGeometry(0.2, 0.15, 0.3, 16),
          new THREE.MeshStandardMaterial({ color: 0xd4a373, roughness: 0.9 })
        );
        pot.position.y = 0.15;
        const leaves = new THREE.Mesh(
          new THREE.SphereGeometry(0.3, 8, 8),
          new THREE.MeshStandardMaterial({ color: 0x2d6a4f, roughness: 0.6 })
        );
        leaves.position.y = 0.5;
        group.add(pot, leaves);
        break;
      }
      case 'Clock': {
        const body = new THREE.Mesh(
          new THREE.CylinderGeometry(0.25, 0.25, 0.05, 32),
          new THREE.MeshStandardMaterial({ color: 0xf3f4f6, metalness: 0.2 })
        );
        body.rotation.x = Math.PI / 2;
        group.add(body);
        break;
      }
      default: {
        const box = new THREE.Mesh(
          new THREE.BoxGeometry(0.5, 0.5, 0.5),
          new THREE.MeshStandardMaterial({ color: 0xff00ff })
        );
        group.add(box);
        break;
      }
    }
    
    return group;
  }
}
