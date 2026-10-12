import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { createRoom04Materials } from '../entities/room04/Room04Materials';

export class EditorPrefabs {

  public static spawnCustomModel(url: string, name: string): THREE.Group {
    const group = new THREE.Group();
    group.name = name + '_' + Math.random().toString(36).substr(2, 9);
    group.userData = {
      isPrefab: true,
      prefabType: 'CustomModel',
      prefabId: group.name,
      modelUrl: url
    };

    // Add a placeholder box while loading
    const geo = new THREE.BoxGeometry(0.5, 0.5, 0.5);
    const mat = new THREE.MeshStandardMaterial({ color: 0xa855f7, wireframe: true });
    const mesh = new THREE.Mesh(geo, mat);
    group.add(mesh);

    const loader = new GLTFLoader();
      loader.load(url, (gltf) => {
        group.remove(mesh);
        gltf.scene.traverse((c: any) => {
          if (c.isMesh) {
            c.castShadow = true;
            c.receiveShadow = true;
          }
        });
        group.add(gltf.scene);
    });

    return group;
  }

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
    group.name = 'prefab_' + type + '_' + id.split('-')[0];
    
    group.userData = { isPrefab: true, prefabType: type, prefabId: id };

    const matResult = createRoom04Materials();
    const mat = matResult.materials;

    switch (type) {
      case 'BauhausDesk': {
        const deskTop = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.1, 1.3), mat.smokedTeak);
        deskTop.position.set(0, 0.8, 0);
        deskTop.castShadow = true;
        deskTop.receiveShadow = true;
        group.add(deskTop);
        const legGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.8, 16);
        const posArray = [[-1.15, 0.4, 0.5], [-1.15, 0.4, -0.5], [1.15, 0.4, 0.5], [1.15, 0.4, -0.5]];
        for(const pos of posArray) {
          const leg = new THREE.Mesh(legGeo, mat.brushedChrome);
          leg.position.set(pos[0], pos[1], pos[2]);
          leg.castShadow = true;
          group.add(leg);
        }
        break;
      }
      case 'OfficeChair': {
        const chairSeat = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.05, 0.5), mat.sageAccent);
        chairSeat.position.set(0, 0.5, 0);
        chairSeat.castShadow = true;
        group.add(chairSeat);
        const chairBack = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.25, 0.05), mat.sageAccent);
        chairBack.position.set(0, 0.85, -0.22);
        chairBack.castShadow = true;
        group.add(chairBack);
        const legGeo = new THREE.CylinderGeometry(0.02, 0.015, 0.5, 12);
        const lpos = [[-0.24, 0.2], [0.24, 0.2], [-0.24, -0.2], [0.24, -0.2]];
        for(const pos of lpos) {
          const leg = new THREE.Mesh(legGeo, mat.brushedChrome);
          leg.position.set(pos[0], 0.25, pos[1]);
          leg.castShadow = true;
          group.add(leg);
        }
        const backSupportGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.4, 12);
        const bpos = [[-0.24, 0.7, -0.2], [0.24, 0.7, -0.2]];
        for(const pos of bpos) {
          const sup = new THREE.Mesh(backSupportGeo, mat.brushedChrome);
          sup.position.set(pos[0], pos[1], pos[2]);
          sup.castShadow = true;
          group.add(sup);
        }
        break;
      }
      case 'FilingCabinet': {
        const body = new THREE.Mesh(new THREE.BoxGeometry(0.6, 1.4, 0.7), mat.sageAccent);
        body.position.set(0, 0.7, 0);
        body.castShadow = true;
        body.receiveShadow = true;
        group.add(body);
        for(let i=0; i<4; i++) {
          const drawer = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.32, 0.02), mat.brushedChrome);
          drawer.position.set(0, 0.2 + (i * 0.33), 0.36);
          const handle = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.03, 0.04), mat.brassGold);
          handle.position.set(0, 0.2 + (i * 0.33), 0.38);
          group.add(drawer, handle);
        }
        break;
      }
      case 'RotaryPhone': {
        const base = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.1, 0.2), mat.vintageCream);
        base.position.set(0, 0.05, 0);
        const dial = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.02, 16), mat.brassGold);
        dial.position.set(0, 0.1, 0.05);
        dial.rotation.x = Math.PI / 6;
        const handset = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.04, 0.06), mat.vintageCream);
        handset.position.set(0, 0.12, -0.05);
        group.add(base, dial, handset);
        break;
      }
      case 'Painting': {
        const frame = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.8, 0.05), mat.smokedTeak);
        const canvas = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 0.7), mat.chalkUpperWall);
        canvas.position.z = 0.026;
        group.add(frame, canvas);
        break;
      }
      case 'Plant': {
        const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.18, 0.5, 24), mat.chalkUpperWall);
        pot.position.y = 0.25;
        pot.castShadow = true;
        group.add(pot);
        for (let i = 0; i < 5; i++) {
          const leaf = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.75, 4), mat.sageAccent);
          leaf.position.set((Math.random() - 0.5) * 0.1, 0.75, (Math.random() - 0.5) * 0.1);
          leaf.rotation.z = (Math.random() - 0.5) * 0.2;
          leaf.castShadow = true;
          group.add(leaf);
        }
        break;
      }
      case 'PointLight': {
        const light = new THREE.PointLight(0xffffff, 1, 10);
        light.castShadow = true;
        const sphere = new THREE.Mesh(new THREE.SphereGeometry(0.1, 16, 16), new THREE.MeshBasicMaterial({ color: 0xffffff }));
        group.add(light);
        group.add(sphere);
        group.userData.isLight = true;
        break;
      }
      case 'SpotLight': {
        const slight = new THREE.SpotLight(0xffffff, 1, 15, Math.PI/6, 0.5, 1);
        slight.castShadow = true;
        const cone = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.2, 16), new THREE.MeshBasicMaterial({ color: 0xffffff }));
        cone.rotation.x = -Math.PI / 2;
        group.add(slight);
        group.add(cone);
        group.userData.isLight = true;
        break;
      }
      case 'Clock': {
        const body = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.05, 32), mat.brushedChrome);
        body.rotation.x = Math.PI / 2;
        const face = new THREE.Mesh(new THREE.CircleGeometry(0.23, 32), mat.chalkUpperWall);
        face.position.z = 0.026;
        group.add(body, face);
        break;
      }
      case 'SurgicalLight': {
        const housing = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.1, 16), mat.titaniumChassis);
        housing.rotation.x = Math.PI / 2;
        const lens = new THREE.Mesh(new THREE.CircleGeometry(0.28, 16), mat.glass);
        lens.position.z = 0.051;
        const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.0, 8), mat.brushedChrome);
        arm.position.y = 0.5;
        group.add(housing, lens, arm);
        break;
      }
      case 'Rug': {
        const rug = new THREE.Mesh(
          new THREE.BoxGeometry(3.0, 0.02, 2.0),
          new THREE.MeshStandardMaterial({ color: 0x8b1e23, roughness: 1.0, bumpScale: 0.1 })
        );
        rug.position.y = 0.01;
        rug.receiveShadow = true;
        group.add(rug);
        break;
      }
      default: {
        const box = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), mat.chalkUpperWall);
        group.add(box);
        break;
      }
    }
    
    return group;
  }
}

