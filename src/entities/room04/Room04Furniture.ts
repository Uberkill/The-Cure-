import * as THREE from 'three';
import { Room04MaterialPalette } from './Room04Materials';

export interface Room04FurnitureEntities {
  deskGroup: THREE.Group;
  chairGroup: THREE.Group;
  planterGroup: THREE.Group;
}

export function buildRoom04Furniture(mat: Room04MaterialPalette): Room04FurnitureEntities {
  // Central Bauhaus Desk (y = 0.8, top surface at y = 0.85)
  const deskGroup = new THREE.Group();
  deskGroup.name = 'prop_desk';

  const deskTop = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.1, 1.3), mat.smokedTeak);
  deskTop.position.set(0, 0.8, 0);
  deskTop.castShadow = true;
  deskTop.receiveShadow = true;
  deskGroup.add(deskTop);

  const legRadius = 0.025;
  const legGeo = new THREE.CylinderGeometry(legRadius, legRadius, 0.8, 16);
  const legPositions: [number, number, number][] = [
    [-1.15, 0.4, 0.5],
    [-1.15, 0.4, -0.5],
    [1.15, 0.4, 0.5],
    [1.15, 0.4, -0.5]
  ];
  for (const pos of legPositions) {
    const leg = new THREE.Mesh(legGeo, mat.brushedChrome);
    leg.position.set(pos[0], pos[1], pos[2]);
    leg.castShadow = true;
    deskGroup.add(leg);
  }

  // Bauhaus Cantilever Chair (Marcel Breuer Cesca style, tucked behind desk at z = -0.65)
  const chairGroup = new THREE.Group();
  chairGroup.name = 'prop_chair';
  chairGroup.position.set(0, 0, -0.65);

  const chairSeat = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.04, 0.48), mat.sageAccent);
  chairSeat.position.set(0, 0.52, 0);
  chairSeat.castShadow = true;
  chairGroup.add(chairSeat);

  const chairBack = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.3, 0.03), mat.sageAccent);
  chairBack.position.set(0, 0.8, -0.22);
  chairBack.castShadow = true;
  chairGroup.add(chairBack);

  const chairTubeGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.52, 12);
  const chairTubeL = new THREE.Mesh(chairTubeGeo, mat.brushedChrome);
  chairTubeL.position.set(-0.25, 0.26, 0);
  chairTubeL.castShadow = true;
  chairGroup.add(chairTubeL);

  const chairTubeR = new THREE.Mesh(chairTubeGeo, mat.brushedChrome);
  chairTubeR.position.set(0.25, 0.26, 0);
  chairTubeR.castShadow = true;
  chairGroup.add(chairTubeR);

  // Brutalist Planter Beside Desk
  const planterGroup = new THREE.Group();
  planterGroup.position.set(2.2, 0, -0.2);

  const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.18, 0.5, 24), mat.chalkUpperWall);
  pot.position.y = 0.25;
  pot.castShadow = true;
  pot.receiveShadow = true;
  planterGroup.add(pot);

  for (let i = 0; i < 5; i++) {
    const leaf = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.75, 4), mat.sageAccent);
    leaf.position.set((Math.random() - 0.5) * 0.1, 0.75, (Math.random() - 0.5) * 0.1);
    leaf.rotation.z = (Math.random() - 0.5) * 0.2;
    leaf.castShadow = true;
    planterGroup.add(leaf);
  }

  return { deskGroup, chairGroup, planterGroup };
}
