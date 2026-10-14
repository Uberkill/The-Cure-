import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
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
  deskGroup.userData.flavorText = [
    'An institutional heavy metal desk. The drawers have been welded shut to prevent hoarding.',
    'There are faint scratch marks near the welded seams. Someone desperately tried to get inside.',
    'The metal is cold. Whatever was in those drawers is long gone.'
  ];

  const deskTop = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.1, 1.3), mat.smokedTeak);
  deskTop.position.set(0, 0.8, 0);
  deskTop.castShadow = true;
  deskTop.receiveShadow = true;
  deskGroup.add(deskTop);

  const legRadius = 0.025;
  const legPositions: [number, number, number][] = [
    [-1.15, 0.4, 0.5],
    [-1.15, 0.4, -0.5],
    [1.15, 0.4, 0.5],
    [1.15, 0.4, -0.5]
  ];
  const legGeos = legPositions.map((pos) => {
    const geo = new THREE.CylinderGeometry(legRadius, legRadius, 0.8, 16);
    geo.translate(pos[0], pos[1], pos[2]);
    return geo;
  });
  const mergedDeskLegsGeo = mergeGeometries(legGeos);
  const deskLegs = new THREE.Mesh(mergedDeskLegsGeo, mat.brushedChrome);
  deskLegs.castShadow = true;
  deskGroup.add(deskLegs);

  // Standard 4-Leg Office Chair
  const chairGroup = new THREE.Group();
  chairGroup.name = 'prop_chair';
  chairGroup.userData.flavorText = [
    'A sterile medical-grade vinyl chair. The upholstery squeaks faintly against the ambient hum of the facility.',
    'There are deep indentations in the cushion, suggesting someone sat here for days on end without moving.',
    'A faint serial number is stamped on the back leg: DEPT-COG-ALGN-004.'
  ];
  chairGroup.position.set(0, 0, -0.65);

  // Merged Seat & Backrest Cushions
  const seatGeo = new THREE.BoxGeometry(0.55, 0.05, 0.5);
  seatGeo.translate(0, 0.5, 0);
  const backGeo = new THREE.BoxGeometry(0.55, 0.25, 0.05);
  backGeo.translate(0, 0.85, -0.22);
  const chairCushions = new THREE.Mesh(mergeGeometries([seatGeo, backGeo]), mat.sageAccent);
  chairCushions.castShadow = true;
  chairGroup.add(chairCushions);

  // Merged 4 Legs & Backrest Chrome Supports
  const chairLegPositions: [number, number][] = [
    [-0.24, 0.2],
    [0.24, 0.2],
    [-0.24, -0.2],
    [0.24, -0.2]
  ];
  const chairFrameGeos = chairLegPositions.map((pos) => {
    const geo = new THREE.CylinderGeometry(0.02, 0.015, 0.5, 12);
    geo.translate(pos[0], 0.25, pos[1]);
    return geo;
  });
  const supportLGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.4, 12);
  supportLGeo.translate(-0.24, 0.7, -0.2);
  const supportRGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.4, 12);
  supportRGeo.translate(0.24, 0.7, -0.2);
  chairFrameGeos.push(supportLGeo, supportRGeo);

  const chairFrame = new THREE.Mesh(mergeGeometries(chairFrameGeos), mat.brushedChrome);
  chairFrame.castShadow = true;
  chairGroup.add(chairFrame);

  // Brutalist Planter Beside Desk
  const planterGroup = new THREE.Group();
  planterGroup.name = 'prop_planter';
  planterGroup.userData.flavorText = [
    'A brutalist concrete planter. The soil is completely dry and smells faintly of ozone.',
    'Digging a finger into the dirt reveals a hard, metallic surface an inch below. Not a real planter.',
    'The synthetic plant leaves are covered in a thin layer of grey dust.'
  ];
  planterGroup.position.set(2.2, 0, -0.2);

  const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.18, 0.5, 24), mat.chalkUpperWall);
  pot.position.y = 0.25;
  pot.castShadow = true;
  pot.receiveShadow = true;
  planterGroup.add(pot);

  const leafOffsets: [number, number, number][] = [
    [-0.03, 0.75, 0.02],
    [0.04, 0.74, -0.03],
    [0.01, 0.77, 0.04],
    [-0.04, 0.73, -0.02],
    [0.02, 0.76, 0.01]
  ];
  const leafGeos = leafOffsets.map(([lx, ly, lz]) => {
    const geo = new THREE.ConeGeometry(0.04, 0.75, 4);
    geo.translate(lx, ly, lz);
    return geo;
  });
  const leaves = new THREE.Mesh(mergeGeometries(leafGeos), mat.sageAccent);
  leaves.castShadow = true;
  planterGroup.add(leaves);

  return { deskGroup, chairGroup, planterGroup };
}
