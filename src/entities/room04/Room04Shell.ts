import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { Room04MaterialPalette } from './Room04Materials';

export interface Room04ShellEntities {
  floor: THREE.Mesh;
  backWallGroup: THREE.Group;
  leftWallGroup: THREE.Group;
  rightWallGroup: THREE.Group;
  frontWallGroup: THREE.Group;
  ceilingGroup: THREE.Group;
  corridorDoor: THREE.Mesh;
  corridorLed: THREE.Mesh;
  doorLed: THREE.Mesh;
  exitDoorPanel: THREE.Mesh;
  portalLeds: Record<string, THREE.Mesh>;
  spokeDoors: Record<string, THREE.Mesh>;
}

function createSpokePortal(
  id: string,
  sectorCode: string,
  sectorName: string,
  pos: [number, number, number],
  rotY: number,
  mat: Room04MaterialPalette,
  isHeavyBlastdoor: boolean = false
): { group: THREE.Group; doorMesh: THREE.Mesh; ledMesh: THREE.Mesh } {
  const group = new THREE.Group();
  group.name = `group_${id}`;
  group.position.set(pos[0], pos[1], pos[2]);
  group.rotation.y = rotY;
  group.userData = { sectorCode, sectorName };

  const width = isHeavyBlastdoor ? 1.5 : 1.34;
  const height = 2.92;
  const jambThickness = 0.16;

  // Merged chalk frame (jamb left, jamb right, lintel in 1 draw call)
  const jambLeftGeo = new THREE.BoxGeometry(jambThickness, height, 0.24);
  jambLeftGeo.translate(-width / 2 - jambThickness / 2, height / 2, 0);

  const jambRightGeo = new THREE.BoxGeometry(jambThickness, height, 0.24);
  jambRightGeo.translate(width / 2 + jambThickness / 2, height / 2, 0);

  const lintelGeo = new THREE.BoxGeometry(width + jambThickness * 2, 0.18, 0.24);
  lintelGeo.translate(0, height + 0.09, 0);

  const mergedFrameGeo = mergeGeometries([jambLeftGeo, jambRightGeo, lintelGeo]);
  const frameMesh = new THREE.Mesh(mergedFrameGeo, mat.chalkUpperWall);
  frameMesh.name = id;
  frameMesh.userData.isSubPart = true;
  group.add(frameMesh);

  // Merged brass details (reveals + handle/wheel + plaque in 1 draw call)
  const revealLGeo = new THREE.BoxGeometry(0.025, height, 0.20);
  revealLGeo.translate(-width / 2, height / 2, 0.01);

  const revealRGeo = new THREE.BoxGeometry(0.025, height, 0.20);
  revealRGeo.translate(width / 2, height / 2, 0.01);

  const revealTopGeo = new THREE.BoxGeometry(width, 0.025, 0.20);
  revealTopGeo.translate(0, height, 0.01);

  const plaqueGeo = new THREE.BoxGeometry(0.88, 0.14, 0.03);
  plaqueGeo.translate(0, height + 0.40, 0.05);

  const bulkheadHousingGeo = new THREE.BoxGeometry(0.22, 0.09, 0.08);
  bulkheadHousingGeo.translate(0, height + 0.54, 0.06);

  const brassGeos: THREE.BufferGeometry[] = [revealLGeo, revealRGeo, revealTopGeo, plaqueGeo, bulkheadHousingGeo];
  if (isHeavyBlastdoor) {
    const wheelGeo = new THREE.TorusGeometry(0.14, 0.02, 12, 24);
    wheelGeo.translate(0, height / 2, 0.05);
    brassGeos.push(wheelGeo);
  } else {
    const handleGeo = new THREE.BoxGeometry(0.04, 0.28, 0.06);
    handleGeo.translate(width * 0.35, height / 2, 0.05);
    brassGeos.push(handleGeo);
  }

  const mergedBrassGeo = mergeGeometries(brassGeos);
  const brassMesh = new THREE.Mesh(mergedBrassGeo, mat.brassGold);
  brassMesh.name = id;
  brassMesh.userData.isSubPart = true;
  group.add(brassMesh);

  // Interactive Door Slab
  const doorMat = isHeavyBlastdoor ? mat.titaniumChassis : new THREE.MeshStandardMaterial({
    color: 0x18241e,
    roughness: 0.45,
    metalness: 0.35
  });
  const doorMesh = new THREE.Mesh(new THREE.BoxGeometry(width - 0.04, height - 0.04, 0.08), doorMat);
  doorMesh.position.set(0, height / 2, 0.05);
  doorMesh.name = id;
  doorMesh.receiveShadow = false;
  group.add(doorMesh);

  // Status Indicator LED
  const ledMat = new THREE.MeshBasicMaterial({ color: 0x8b1e23 });
  const ledMesh = new THREE.Mesh(new THREE.SphereGeometry(0.028, 12, 12), ledMat);
  ledMesh.position.set(0, height + 0.24, 0.08);
  ledMesh.name = id;
  group.add(ledMesh);

  // Warm bulkhead lens
  const bulkheadLensMat = new THREE.MeshStandardMaterial({
    color: 0xfffaeb,
    emissive: 0xfde68a,
    emissiveIntensity: 0.55,
    roughness: 0.2
  });
  const bulkheadLens = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.038, 0.16, 16), bulkheadLensMat);
  bulkheadLens.rotation.z = Math.PI / 2;
  bulkheadLens.position.set(0, height + 0.54, 0.09);
  bulkheadLens.raycast = () => {};
  group.add(bulkheadLens);

  return { group, doorMesh, ledMesh };
}

export function buildRoom04Shell(mat: Room04MaterialPalette): Room04ShellEntities {
  const portalLeds: Record<string, THREE.Mesh> = {};
  const spokeDoors: Record<string, THREE.Mesh> = {};
  // 1. Floor
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(14, 14), mat.terrazzoFloor);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  floor.name = 'shell_floor';

  // 2. Back Wall with Split Wainscot and Architectural Forward Corridor Portal
  const backWallGroup = new THREE.Group();
  backWallGroup.name = 'group_wall_back';

  // Contact Ambient Occlusion Shadow Plane (under desk & chair)
  const deskContactAO = new THREE.Mesh(
    new THREE.PlaneGeometry(3.0, 1.8),
    new THREE.MeshBasicMaterial({ color: 0x141816, transparent: true, opacity: 0.28, depthWrite: false })
  );
  deskContactAO.rotation.x = -Math.PI / 2;
  deskContactAO.position.set(0, 0.003, 0.1);
  deskContactAO.raycast = () => {};
  backWallGroup.add(deskContactAO);

  // Architectural Concourse Wing Header Plaques (North, East, South)
  const plaqueNorthGeo = new THREE.BoxGeometry(2.4, 0.16, 0.04);
  plaqueNorthGeo.translate(0, 3.42, -6.74);
  const plaqueEastGeo = new THREE.BoxGeometry(0.04, 0.16, 2.4);
  plaqueEastGeo.translate(6.74, 3.42, 0);
  const plaqueSouthGeo = new THREE.BoxGeometry(2.4, 0.16, 0.04);
  plaqueSouthGeo.translate(0, 3.42, 6.74);
  const mergedHeaderPlaques = mergeGeometries([plaqueNorthGeo, plaqueEastGeo, plaqueSouthGeo]);
  const headerPlaquesMesh = new THREE.Mesh(mergedHeaderPlaques, mat.brassGold);
  headerPlaquesMesh.name = 'concourse_header_plaques';
  headerPlaquesMesh.userData.isSubPart = true;
  headerPlaquesMesh.castShadow = false;
  backWallGroup.add(headerPlaquesMesh);

  const backTileLeftGeo = new THREE.BoxGeometry(6.0, 2.2, 0.22);
  backTileLeftGeo.translate(-4.0, 1.1, -6.78);
  const backTileRightGeo = new THREE.BoxGeometry(6.0, 2.2, 0.22);
  backTileRightGeo.translate(4.0, 1.1, -6.78);
  const mergedBackTilesGeo = mergeGeometries([backTileLeftGeo, backTileRightGeo]);
  const backTilesMesh = new THREE.Mesh(mergedBackTilesGeo, mat.ceramicGreenTiles);
  backTilesMesh.receiveShadow = false;
  backTilesMesh.name = 'wall_green_tiles';
  backWallGroup.add(backTilesMesh);

  const dadoLeftGeo = new THREE.BoxGeometry(5.64, 0.05, 0.26);
  dadoLeftGeo.translate(-3.82, 2.22, -6.77);
  const dadoRightGeo = new THREE.BoxGeometry(5.64, 0.05, 0.26);
  dadoRightGeo.translate(3.82, 2.22, -6.77);
  const mergedDadoGeo = mergeGeometries([dadoLeftGeo, dadoRightGeo]);
  const dadoMesh = new THREE.Mesh(mergedDadoGeo, mat.brassGold);
  backWallGroup.add(dadoMesh);

  const upperLintelGeo = new THREE.BoxGeometry(14, 2.3, 0.2);
  upperLintelGeo.translate(0, 4.35, -6.8);
  const upperLeftGeo = new THREE.BoxGeometry(6.0, 0.98, 0.2);
  upperLeftGeo.translate(-4.0, 2.71, -6.8);
  const upperRightGeo = new THREE.BoxGeometry(6.0, 0.98, 0.2);
  upperRightGeo.translate(4.0, 2.71, -6.8);
  const mergedBackUpperGeo = mergeGeometries([upperLintelGeo, upperLeftGeo, upperRightGeo]);
  const backUpperMesh = new THREE.Mesh(mergedBackUpperGeo, mat.chalkUpperWall);
  backUpperMesh.receiveShadow = false;
  backUpperMesh.name = 'wall_chalk_upper';
  backWallGroup.add(backUpperMesh);

  // Forward Corridor Portal Jambs & Recessed Passage (No solid blocking slab)
  const corridorJambLeft = new THREE.Mesh(new THREE.BoxGeometry(0.18, 3.20, 0.28), mat.chalkUpperWall);
  corridorJambLeft.position.set(-0.93, 1.6, -6.76);
  corridorJambLeft.receiveShadow = false;
  corridorJambLeft.name = 'corridor_jamb_left';
  backWallGroup.add(corridorJambLeft);

  const corridorJambRight = new THREE.Mesh(new THREE.BoxGeometry(0.18, 3.20, 0.28), mat.chalkUpperWall);
  corridorJambRight.position.set(0.93, 1.6, -6.76);
  corridorJambRight.receiveShadow = false;
  corridorJambRight.name = 'corridor_jamb_right';
  backWallGroup.add(corridorJambRight);

  const corridorLintel = new THREE.Mesh(new THREE.BoxGeometry(2.04, 0.18, 0.28), mat.chalkUpperWall);
  corridorLintel.position.set(0, 3.11, -6.76);
  corridorLintel.receiveShadow = false;
  corridorLintel.name = 'corridor_lintel';
  backWallGroup.add(corridorLintel);

  // Decorative Brass Arch Reveal Liners
  const revealLeft = new THREE.Mesh(new THREE.BoxGeometry(0.03, 3.02, 0.24), mat.brassGold);
  revealLeft.position.set(-0.84, 1.51, -6.73);
  revealLeft.name = 'corridor_reveal_left';
  backWallGroup.add(revealLeft);

  const revealRight = new THREE.Mesh(new THREE.BoxGeometry(0.03, 3.02, 0.24), mat.brassGold);
  revealRight.position.set(0.84, 1.51, -6.73);
  revealRight.name = 'corridor_reveal_right';
  backWallGroup.add(revealRight);

  const revealTop = new THREE.Mesh(new THREE.BoxGeometry(1.68, 0.03, 0.24), mat.brassGold);
  revealTop.position.set(0, 3.01, -6.73);
  revealTop.name = 'corridor_reveal_top';
  backWallGroup.add(revealTop);

  // Recessed Corridor Passage Void (extends back to z = -7.8)
  const voidBlackMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
  const corridorVoidBack = new THREE.Mesh(new THREE.PlaneGeometry(1.68, 3.0), voidBlackMat);
  corridorVoidBack.position.set(0, 1.5, -8.8);
  corridorVoidBack.name = 'door_corridor_passage';
  backWallGroup.add(corridorVoidBack);

  const corridorVoidFloor = new THREE.Mesh(new THREE.PlaneGeometry(1.68, 2.04), mat.terrazzoFloor);
  corridorVoidFloor.position.set(0, 0.001, -7.78);
  corridorVoidFloor.rotation.x = -Math.PI / 2;
  backWallGroup.add(corridorVoidFloor);

  const corridorVoidCeil = new THREE.Mesh(new THREE.PlaneGeometry(1.68, 2.04), mat.chalkUpperWall);
  corridorVoidCeil.position.set(0, 3.0, -7.78);
  corridorVoidCeil.rotation.x = Math.PI / 2;
  backWallGroup.add(corridorVoidCeil);

  const corridorVoidLeft = new THREE.Mesh(new THREE.PlaneGeometry(2.04, 3.0), mat.chalkUpperWall);
  corridorVoidLeft.position.set(-0.84, 1.5, -7.78);
  corridorVoidLeft.rotation.y = Math.PI / 2;
  backWallGroup.add(corridorVoidLeft);

  const corridorVoidRight = new THREE.Mesh(new THREE.PlaneGeometry(2.04, 3.0), mat.chalkUpperWall);
  corridorVoidRight.position.set(0.84, 1.5, -7.78);
  corridorVoidRight.rotation.y = -Math.PI / 2;
  backWallGroup.add(corridorVoidRight);

  // Sliding Corridor Door (hinged at left edge for swinging)
  const corridorDoorMat = new THREE.MeshStandardMaterial({
    color: 0x18241e,
    roughness: 0.45,
    metalness: 0.35
  });
  const corridorDoorGeo = new THREE.BoxGeometry(1.68, 2.96, 0.10);
  corridorDoorGeo.translate(1.68 / 2, 0, 0); // shift origin to left edge
  corridorDoorGeo.computeBoundingBox();
  corridorDoorGeo.computeBoundingSphere();
  const corridorDoor = new THREE.Mesh(corridorDoorGeo, corridorDoorMat);
  corridorDoor.position.set(-1.68 / 2, 1.48, -6.72);
  corridorDoor.name = 'door_corridor';
  corridorDoor.receiveShadow = false;

  const corridorPeephole = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.16, 16), mat.brassGold);
  corridorPeephole.rotation.x = Math.PI / 2;
  corridorPeephole.position.set(1.68 / 2, 0.52, 0.055); // offset to center of the visual door

  corridorPeephole.name = 'corridor_peephole';
  corridorDoor.add(corridorPeephole);

  backWallGroup.add(corridorDoor);

  const corridorLedMat = new THREE.MeshBasicMaterial({ color: 0x8b1e23 });
  const corridorLed = new THREE.Mesh(new THREE.SphereGeometry(0.025, 12, 12), corridorLedMat);
  corridorLed.position.set(0, 3.12, -6.61);
  corridorLed.name = 'corridor_led';
  backWallGroup.add(corridorLed);

  const brassArchLintel = new THREE.Mesh(new THREE.BoxGeometry(2.04, 0.06, 0.26), mat.brassGold);
  brassArchLintel.position.set(0, 3.22, -6.75);
  brassArchLintel.name = 'corridor_arch_lintel';
  backWallGroup.add(brassArchLintel);

  const sleepPlaque = new THREE.Mesh(new THREE.BoxGeometry(0.96, 0.14, 0.03), mat.brassGold);
  sleepPlaque.position.set(0, 3.42, -6.74);
  sleepPlaque.name = 'plaque_door_portal_sleep_ward';
  sleepPlaque.userData.isSubPart = true;
  backWallGroup.add(sleepPlaque);

  portalLeds['door_portal_sleep_ward'] = corridorLed;
  spokeDoors['door_portal_sleep_ward'] = corridorDoor;
  portalLeds['door_portal_hydrotherapy'] = corridorLed;
  spokeDoors['door_portal_hydrotherapy'] = corridorDoor;

  // 3. Left Wall with Split Tile Wainscot & Exit Blastdoor Architectural Portal
  const leftWallGroup = new THREE.Group();

  const leftTileBackGeo = new THREE.BoxGeometry(0.22, 2.2, 3.2);
  leftTileBackGeo.translate(-6.78, 1.1, -5.4);
  const leftTileFrontGeo = new THREE.BoxGeometry(0.22, 2.2, 9.2);
  leftTileFrontGeo.translate(-6.78, 1.1, 2.4);
  const mergedLeftTilesGeo = mergeGeometries([leftTileBackGeo, leftTileFrontGeo]);
  const leftTilesMesh = new THREE.Mesh(mergedLeftTilesGeo, mat.ceramicGreenTiles);
  leftTilesMesh.receiveShadow = false;
  leftTilesMesh.name = 'wall_green_tiles';
  leftWallGroup.add(leftTilesMesh);

  const leftDadoBackGeo = new THREE.BoxGeometry(0.26, 0.05, 3.2);
  leftDadoBackGeo.translate(-6.77, 2.22, -5.4);
  const leftDadoFrontGeo = new THREE.BoxGeometry(0.26, 0.05, 9.2);
  leftDadoFrontGeo.translate(-6.77, 2.22, 2.4);
  const mergedLeftDadoGeo = mergeGeometries([leftDadoBackGeo, leftDadoFrontGeo]);
  const leftDadoMesh = new THREE.Mesh(mergedLeftDadoGeo, mat.brassGold);
  leftWallGroup.add(leftDadoMesh);

  const leftUpperLintelGeo = new THREE.BoxGeometry(0.2, 2.3, 14);
  leftUpperLintelGeo.translate(-6.8, 4.35, 0);
  const leftUpperBackGeo = new THREE.BoxGeometry(0.2, 0.98, 3.2);
  leftUpperBackGeo.translate(-6.8, 2.71, -5.4);
  const leftUpperFrontGeo = new THREE.BoxGeometry(0.2, 0.98, 9.2);
  leftUpperFrontGeo.translate(-6.8, 2.71, 2.4);
  const mergedLeftUpperGeo = mergeGeometries([leftUpperLintelGeo, leftUpperBackGeo, leftUpperFrontGeo]);
  const leftUpperMesh = new THREE.Mesh(mergedLeftUpperGeo, mat.chalkUpperWall);
  leftUpperMesh.receiveShadow = false;
  leftUpperMesh.name = 'wall_chalk_upper';
  leftWallGroup.add(leftUpperMesh);

  // Left Exit Portal Jambs & Recessed Airlock Passage (No solid blocking slab)
  const exitJambBack = new THREE.Mesh(new THREE.BoxGeometry(0.28, 3.20, 0.18), mat.chalkUpperWall);
  exitJambBack.position.set(-6.76, 1.6, -3.73);
  exitJambBack.receiveShadow = false;
  exitJambBack.name = 'exit_jamb_back';
  leftWallGroup.add(exitJambBack);

  const exitJambFront = new THREE.Mesh(new THREE.BoxGeometry(0.28, 3.20, 0.18), mat.chalkUpperWall);
  exitJambFront.position.set(-6.76, 1.6, -2.27);
  exitJambFront.receiveShadow = false;
  exitJambFront.name = 'exit_jamb_front';
  leftWallGroup.add(exitJambFront);

  const exitLintel = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.18, 1.64), mat.chalkUpperWall);
  exitLintel.position.set(-6.76, 3.11, -3.0);
  exitLintel.receiveShadow = false;
  exitLintel.name = 'exit_lintel';
  leftWallGroup.add(exitLintel);

  // Decorative Brass Arch Reveal Liners for Exit
  const exitRevealBack = new THREE.Mesh(new THREE.BoxGeometry(0.24, 3.02, 0.03), mat.brassGold);
  exitRevealBack.position.set(-6.73, 1.51, -3.64);
  exitRevealBack.name = 'exit_reveal_back';
  leftWallGroup.add(exitRevealBack);

  const exitRevealFront = new THREE.Mesh(new THREE.BoxGeometry(0.24, 3.02, 0.03), mat.brassGold);
  exitRevealFront.position.set(-6.73, 1.51, -2.36);
  exitRevealFront.name = 'exit_reveal_front';
  leftWallGroup.add(exitRevealFront);

  const exitRevealTop = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.03, 1.28), mat.brassGold);
  exitRevealTop.position.set(-6.73, 3.01, -3.0);
  exitRevealTop.name = 'exit_reveal_top';
  leftWallGroup.add(exitRevealTop);

  // Recessed Airlock Exit Passage Void (extends back to x = -7.8)
  const exitVoidBlackMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
  const exitVoidOuter = new THREE.Mesh(new THREE.PlaneGeometry(1.28, 3.0), exitVoidBlackMat);
  exitVoidOuter.position.set(-7.8, 1.5, -3.0);
  exitVoidOuter.rotation.y = Math.PI / 2;
  exitVoidOuter.name = 'exit_airlock_passage';
  leftWallGroup.add(exitVoidOuter);

  const exitVoidFloor = new THREE.Mesh(new THREE.PlaneGeometry(1.04, 1.28), mat.terrazzoFloor);
  exitVoidFloor.position.set(-7.28, 0.001, -3.0);
  exitVoidFloor.rotation.x = -Math.PI / 2;
  leftWallGroup.add(exitVoidFloor);

  const exitVoidCeil = new THREE.Mesh(new THREE.PlaneGeometry(1.04, 1.28), mat.chalkUpperWall);
  exitVoidCeil.position.set(-7.28, 3.0, -3.0);
  exitVoidCeil.rotation.x = Math.PI / 2;
  leftWallGroup.add(exitVoidCeil);

  const exitVoidBack = new THREE.Mesh(new THREE.PlaneGeometry(1.04, 3.0), mat.brushedChrome);
  exitVoidBack.position.set(-7.28, 1.5, -3.64);
  leftWallGroup.add(exitVoidBack);

  const exitVoidFront = new THREE.Mesh(new THREE.PlaneGeometry(1.04, 3.0), mat.brushedChrome);
  exitVoidFront.position.set(-7.28, 1.5, -2.36);
  leftWallGroup.add(exitVoidFront);

  // Sliding Heavy Blastdoor Panel (slides in Z along wall pocket behind exitJambBack)
  const exitDoorPanel = new THREE.Mesh(new THREE.BoxGeometry(0.12, 2.96, 1.36), mat.titaniumChassis);
  exitDoorPanel.position.set(-6.72, 1.48, -3.0);
  exitDoorPanel.name = 'prop_door';
  exitDoorPanel.receiveShadow = false;

  const lockWheel = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.025, 12, 24), mat.brassGold);
  lockWheel.rotation.y = Math.PI / 2;
  lockWheel.position.set(0.08, 0.02, 0);
  lockWheel.name = 'exit_lock_wheel';
  exitDoorPanel.add(lockWheel);

  const exitPeephole = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.16, 16), mat.brassGold);
  exitPeephole.rotation.z = Math.PI / 2;
  exitPeephole.position.set(0.08, 0.72, 0);
  exitPeephole.name = 'exit_peephole';
  exitDoorPanel.add(exitPeephole);

  const exitRibTop = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.08, 1.26), mat.brushedChrome);
  exitRibTop.position.set(0.07, 0.62, 0);
  exitRibTop.name = 'exit_rib_top';
  exitDoorPanel.add(exitRibTop);

  const exitRibBottom = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.08, 1.26), mat.brushedChrome);
  exitRibBottom.position.set(0.07, -0.38, 0);
  exitRibBottom.name = 'exit_rib_bottom';
  exitDoorPanel.add(exitRibBottom);

  leftWallGroup.add(exitDoorPanel);

  const doorLedMat = new THREE.MeshBasicMaterial({ color: 0x8b1e23 });
  const doorLed = new THREE.Mesh(new THREE.SphereGeometry(0.025, 12, 12), doorLedMat);
  doorLed.position.set(-6.61, 3.25, -3.0);
  doorLed.name = 'door_led';
  leftWallGroup.add(doorLed);

  portalLeds['door_portal_velvet_lounge'] = doorLed;
  spokeDoors['door_portal_velvet_lounge'] = exitDoorPanel;

  const exitPlaque = new THREE.Mesh(new THREE.BoxGeometry(0.96, 0.14, 0.03), mat.brassGold);
  exitPlaque.position.set(-6.73, 3.42, -3.0);
  exitPlaque.rotation.y = Math.PI / 2;
  exitPlaque.name = 'plaque_exit_blastdoor';
  exitPlaque.userData.isSubPart = true;
  leftWallGroup.add(exitPlaque);

  // 4. Right Wall with Tile Wainscot & Ventilation Acoustic Panel
  const rightWallGroup = new THREE.Group();
  rightWallGroup.name = 'group_wall_right';
  const rightTile = new THREE.Mesh(new THREE.BoxGeometry(0.22, 2.2, 14), mat.ceramicGreenTiles);
  rightTile.position.set(6.78, 1.1, 0);
  rightTile.receiveShadow = false;
  rightTile.name = 'wall_green_tiles';
  rightWallGroup.add(rightTile);

  const rightUpper = new THREE.Mesh(new THREE.BoxGeometry(0.2, 3.3, 14), mat.chalkUpperWall);
  rightUpper.position.set(6.8, 3.85, 0);
  rightUpper.receiveShadow = false;
  rightUpper.name = 'wall_chalk_upper';
  rightWallGroup.add(rightUpper);

  const rightDado = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.05, 14), mat.brassGold);
  rightDado.position.set(6.77, 2.22, 0);
  rightWallGroup.add(rightDado);

  const ventFrame = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.2, 2.0), mat.smokedTeak);
  ventFrame.position.set(6.68, 3.85, -3.5);
  rightWallGroup.add(ventFrame);

  const slatGeos: THREE.BufferGeometry[] = [];
  for (let s = -0.4; s <= 0.4; s += 0.2) {
    const geo = new THREE.BoxGeometry(0.10, 0.03, 1.8);
    geo.translate(6.67, 3.85 + s, -3.5);
    slatGeos.push(geo);
  }
  const mergedSlatsGeo = mergeGeometries(slatGeos);
  const slatsMesh = new THREE.Mesh(mergedSlatsGeo, mat.brassGold);
  slatsMesh.userData.isSubPart = true;
  rightWallGroup.add(slatsMesh);

  // Clinical Blueprint / Gallery Painting on Right Wall
  const paintingGroup = new THREE.Group();
  paintingGroup.name = 'prop_painting';
  paintingGroup.position.set(6.67, 2.3, 3.5);

  const paintingFrame = new THREE.Mesh(new THREE.BoxGeometry(0.04, 1.4, 1.8), mat.smokedTeak);
  paintingFrame.castShadow = true;
  paintingGroup.add(paintingFrame);

  const paintingCanvas = new THREE.Mesh(new THREE.PlaneGeometry(1.68, 1.28), mat.chalkUpperWall);
  paintingCanvas.rotation.y = -Math.PI / 2;
  paintingCanvas.position.x = -0.022;
  paintingGroup.add(paintingCanvas);

  rightWallGroup.add(paintingGroup);

  const audiologyPortal = createSpokePortal('door_portal_audiology', 'SL4-04B-AUD', 'AUDIOLOGY VAULT', [6.62, 0, 0], -Math.PI / 2, mat);
  rightWallGroup.add(audiologyPortal.group);
  portalLeds['door_portal_audiology'] = audiologyPortal.ledMesh;
  spokeDoors['door_portal_audiology'] = audiologyPortal.doorMesh;
  portalLeds['door_portal_archive'] = audiologyPortal.ledMesh;
  spokeDoors['door_portal_archive'] = audiologyPortal.doorMesh;

  // 5. Front Wall with Tile Wainscot & Intake Observation Window
  const frontWallGroup = new THREE.Group();
  frontWallGroup.name = 'group_wall_front';
  const frontTile = new THREE.Mesh(new THREE.BoxGeometry(14, 2.2, 0.22), mat.ceramicGreenTiles);
  frontTile.position.set(0, 1.1, 6.78);
  frontTile.receiveShadow = false;
  frontTile.name = 'wall_green_tiles';
  frontWallGroup.add(frontTile);

  const frontUpper = new THREE.Mesh(new THREE.BoxGeometry(14, 3.3, 0.2), mat.chalkUpperWall);
  frontUpper.position.set(0, 3.85, 6.8);
  frontUpper.receiveShadow = false;
  frontUpper.name = 'wall_chalk_upper';
  frontWallGroup.add(frontUpper);

  const frontDado = new THREE.Mesh(new THREE.BoxGeometry(14, 0.05, 0.26), mat.brassGold);
  frontDado.position.set(0, 2.22, 6.77);
  frontWallGroup.add(frontDado);

  const obsFrame = new THREE.Mesh(new THREE.BoxGeometry(3.6, 2.0, 0.18), mat.titaniumChassis);
  obsFrame.position.set(0, 3.2, 6.66);
  obsFrame.name = 'obs_frame';
  frontWallGroup.add(obsFrame);

  const obsGlass = new THREE.Mesh(new THREE.BoxGeometry(3.3, 1.8, 0.02), mat.vintageCream);
  obsGlass.position.set(0, 3.2, 6.67);
  obsGlass.name = 'obs_glass';
  frontWallGroup.add(obsGlass);

  const dirPortal = createSpokePortal('door_portal_directors_office', 'SL4-06-DIR', "DIRECTOR'S OFFICE", [3.8, 0, 6.62], Math.PI, mat);
  frontWallGroup.add(dirPortal.group);
  portalLeds['door_portal_directors_office'] = dirPortal.ledMesh;
  spokeDoors['door_portal_directors_office'] = dirPortal.doorMesh;
  portalLeds['door_portal_synthesis'] = dirPortal.ledMesh;
  spokeDoors['door_portal_synthesis'] = dirPortal.doorMesh;

  // 6. Architectural Ceiling & Cove Frame (y = 5.5)
  const ceilingGroup = new THREE.Group();
  ceilingGroup.name = 'group_ceiling';
  const ceilingSlab = new THREE.Mesh(new THREE.PlaneGeometry(14, 14), mat.chalkUpperWall);
  ceilingSlab.position.set(0, 5.5, 0);
  ceilingSlab.rotation.x = Math.PI / 2;
  ceilingSlab.receiveShadow = true;
  ceilingGroup.add(ceilingSlab);

  const coveBorder = new THREE.Mesh(new THREE.BoxGeometry(7.0, 0.08, 7.0), mat.chalkUpperWall);
  coveBorder.position.set(0, 5.46, 0);
  ceilingGroup.add(coveBorder);

  const coveAccent = new THREE.Mesh(new THREE.BoxGeometry(6.6, 0.02, 6.6), mat.brassGold);
  coveAccent.position.set(0, 5.44, 0);
  ceilingGroup.add(coveAccent);

  // Motionless White Surgical Ceiling Luminaire (Physical Light Source directly above central apparatus desk)
  const luminaireHousing = new THREE.Mesh(new THREE.BoxGeometry(3.0, 0.06, 1.8), mat.luminaireHousing);
  luminaireHousing.position.set(0, 5.42, 0.2);
  luminaireHousing.name = 'luminaire_housing';
  ceilingGroup.add(luminaireHousing);

  const luminaireDiffuser = new THREE.Mesh(new THREE.PlaneGeometry(2.8, 1.6), mat.luminaireDiffuser);
  luminaireDiffuser.rotation.x = Math.PI / 2;
  luminaireDiffuser.position.set(0, 5.385, 0.2);
  luminaireDiffuser.name = 'luminaire_diffuser';
  ceilingGroup.add(luminaireDiffuser);

  // 7. Suspended Surgical Task Luminaire (Directly Over Central Examination Desk)
  const taskLuminaireGroup = new THREE.Group();
  taskLuminaireGroup.name = 'task_luminaire_pendant';
  taskLuminaireGroup.position.set(0, 0, 0.1);

  // Tubular brushed chrome suspension rod
  const suspensionRod = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 2.45, 12), mat.brushedChrome);
  suspensionRod.position.set(0, 4.15, 0);
  suspensionRod.raycast = () => {};
  taskLuminaireGroup.add(suspensionRod);

  // Spun-metal surgical conical shade (dark titanium exterior)
  const shadeCowl = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.45, 0.28, 28, 1, true), mat.titaniumChassis);
  shadeCowl.position.set(0, 2.76, 0);
  shadeCowl.raycast = () => {};
  taskLuminaireGroup.add(shadeCowl);

  // Merged brass elements: ceiling canopy collar + ball swivel coupler + rim bezel
  const canopyGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.05, 16);
  canopyGeo.translate(0, 5.42, 0);

  const swivelGeo = new THREE.SphereGeometry(0.065, 16, 16);
  swivelGeo.translate(0, 2.92, 0);

  const bezelGeo = new THREE.TorusGeometry(0.45, 0.016, 12, 28);
  bezelGeo.rotateX(Math.PI / 2);
  bezelGeo.translate(0, 2.62, 0);

  const mergedLuminaireBrassGeo = mergeGeometries([canopyGeo, swivelGeo, bezelGeo]);
  const luminaireBrassMesh = new THREE.Mesh(mergedLuminaireBrassGeo, mat.brassGold);
  luminaireBrassMesh.raycast = () => {};
  taskLuminaireGroup.add(luminaireBrassMesh);

  // High-intensity white frosted diffuser lens
  const diffuserLens = new THREE.Mesh(new THREE.CircleGeometry(0.43, 28), mat.luminaireDiffuser);
  diffuserLens.position.set(0, 2.63, 0);
  diffuserLens.rotation.x = Math.PI / 2;
  diffuserLens.raycast = () => {};
  taskLuminaireGroup.add(diffuserLens);

  ceilingGroup.add(taskLuminaireGroup);

  return {
    floor,
    backWallGroup,
    leftWallGroup,
    rightWallGroup,
    frontWallGroup,
    ceilingGroup,
    corridorDoor,
    corridorLed,
    doorLed,
    exitDoorPanel,
    portalLeds,
    spokeDoors
  };
}
