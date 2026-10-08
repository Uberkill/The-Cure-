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

  // Standard 4-Leg Office Chair
  const chairGroup = new THREE.Group();
  chairGroup.name = 'prop_chair';
  chairGroup.position.set(0, 0, -0.65);

  // Seat
  const chairSeat = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.05, 0.5), mat.sageAccent);
  chairSeat.position.set(0, 0.5, 0);
  chairSeat.castShadow = true;
  chairGroup.add(chairSeat);

  // Backrest
  const chairBack = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.25, 0.05), mat.sageAccent);
  chairBack.position.set(0, 0.85, -0.22);
  chairBack.castShadow = true;
  chairGroup.add(chairBack);

  // 4 Legs
  const chairLegGeo = new THREE.CylinderGeometry(0.02, 0.015, 0.5, 12);
  const chairLegPositions: [number, number][] = [
    [-0.24, 0.2],  // Front Left
    [0.24, 0.2],   // Front Right
    [-0.24, -0.2], // Back Left
    [0.24, -0.2]   // Back Right
  ];
  for (const pos of chairLegPositions) {
    const leg = new THREE.Mesh(chairLegGeo, mat.brushedChrome);
    leg.position.set(pos[0], 0.25, pos[1]);
    leg.castShadow = true;
    chairGroup.add(leg);
  }

  // Backrest supports (extending from back legs)
  const backSupportGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.4, 12);
  const supportL = new THREE.Mesh(backSupportGeo, mat.brushedChrome);
  supportL.position.set(-0.24, 0.7, -0.2);
  supportL.castShadow = true;
  chairGroup.add(supportL);

  const supportR = new THREE.Mesh(backSupportGeo, mat.brushedChrome);
  supportR.position.set(0.24, 0.7, -0.2);
  supportR.castShadow = true;
  chairGroup.add(supportR);

  // Brutalist Planter Beside Desk
  const planterGroup = new THREE.Group();
  planterGroup.name = 'prop_planter';
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
