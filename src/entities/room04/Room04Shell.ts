import * as THREE from 'three';
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
}

export function buildRoom04Shell(mat: Room04MaterialPalette): Room04ShellEntities {
  // 1. Floor
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(14, 14), mat.terrazzoFloor);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  floor.name = 'shell_floor';

  // 2. Back Wall with Split Wainscot and Architectural Forward Corridor Portal
  const backWallGroup = new THREE.Group();
  backWallGroup.name = 'group_wall_back';

  const backTileLeft = new THREE.Mesh(new THREE.BoxGeometry(6.0, 2.2, 0.22), mat.ceramicGreenTiles);
  backTileLeft.position.set(-4.0, 1.1, -6.78);
  backTileLeft.receiveShadow = false;
  backTileLeft.name = 'wall_green_tiles';
  backWallGroup.add(backTileLeft);

  const backTileRight = new THREE.Mesh(new THREE.BoxGeometry(6.0, 2.2, 0.22), mat.ceramicGreenTiles);
  backTileRight.position.set(4.0, 1.1, -6.78);
  backTileRight.receiveShadow = false;
  backTileRight.name = 'wall_green_tiles';
  backWallGroup.add(backTileRight);

  const dadoLeft = new THREE.Mesh(new THREE.BoxGeometry(6.0, 0.05, 0.26), mat.brassGold);
  dadoLeft.position.set(-4.0, 2.22, -6.77);
  backWallGroup.add(dadoLeft);

  const dadoRight = new THREE.Mesh(new THREE.BoxGeometry(6.0, 0.05, 0.26), mat.brassGold);
  dadoRight.position.set(4.0, 2.22, -6.77);
  backWallGroup.add(dadoRight);

  const upperLintel = new THREE.Mesh(new THREE.BoxGeometry(14, 2.3, 0.2), mat.chalkUpperWall);
  upperLintel.position.set(0, 4.35, -6.8);
  upperLintel.receiveShadow = false;
  upperLintel.name = 'wall_chalk_upper';
  backWallGroup.add(upperLintel);

  const upperLeft = new THREE.Mesh(new THREE.BoxGeometry(6.0, 0.98, 0.2), mat.chalkUpperWall);
  upperLeft.position.set(-4.0, 2.71, -6.8);
  upperLeft.receiveShadow = false;
  upperLeft.name = 'wall_chalk_upper';
  backWallGroup.add(upperLeft);

  const upperRight = new THREE.Mesh(new THREE.BoxGeometry(6.0, 0.98, 0.2), mat.chalkUpperWall);
  upperRight.position.set(4.0, 2.71, -6.8);
  upperRight.receiveShadow = false;
  upperRight.name = 'wall_chalk_upper';
  backWallGroup.add(upperRight);

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
  revealLeft.position.set(-0.84, 1.51, -6.75);
  backWallGroup.add(revealLeft);

  const revealRight = new THREE.Mesh(new THREE.BoxGeometry(0.03, 3.02, 0.24), mat.brassGold);
  revealRight.position.set(0.84, 1.51, -6.75);
  backWallGroup.add(revealRight);

  const revealTop = new THREE.Mesh(new THREE.BoxGeometry(1.68, 0.03, 0.24), mat.brassGold);
  revealTop.position.set(0, 3.01, -6.75);
  backWallGroup.add(revealTop);

  // Recessed Corridor Passage Void (extends back to z = -7.8)
  const corridorVoidBack = new THREE.Mesh(new THREE.PlaneGeometry(1.68, 3.0), mat.ceramicGreenTiles);
  corridorVoidBack.position.set(0, 1.5, -7.8);
  corridorVoidBack.name = 'corridor_passage';
  backWallGroup.add(corridorVoidBack);

  const corridorVoidFloor = new THREE.Mesh(new THREE.PlaneGeometry(1.68, 1.04), mat.terrazzoFloor);
  corridorVoidFloor.position.set(0, 0.001, -7.28);
  corridorVoidFloor.rotation.x = -Math.PI / 2;
  backWallGroup.add(corridorVoidFloor);

  const corridorVoidCeil = new THREE.Mesh(new THREE.PlaneGeometry(1.68, 1.04), mat.chalkUpperWall);
  corridorVoidCeil.position.set(0, 3.0, -7.28);
  corridorVoidCeil.rotation.x = Math.PI / 2;
  backWallGroup.add(corridorVoidCeil);

  const corridorVoidLeft = new THREE.Mesh(new THREE.PlaneGeometry(1.04, 3.0), mat.chalkUpperWall);
  corridorVoidLeft.position.set(-0.84, 1.5, -7.28);
  corridorVoidLeft.rotation.y = Math.PI / 2;
  backWallGroup.add(corridorVoidLeft);

  const corridorVoidRight = new THREE.Mesh(new THREE.PlaneGeometry(1.04, 3.0), mat.chalkUpperWall);
  corridorVoidRight.position.set(0.84, 1.5, -7.28);
  corridorVoidRight.rotation.y = -Math.PI / 2;
  backWallGroup.add(corridorVoidRight);

  // Sliding Corridor Door (recessed in track, slides along X into right pocket)
  const corridorDoorMat = new THREE.MeshStandardMaterial({
    color: 0x18241e,
    roughness: 0.45,
    metalness: 0.35
  });
  const corridorDoor = new THREE.Mesh(new THREE.BoxGeometry(1.68, 2.96, 0.10), corridorDoorMat);
  corridorDoor.position.set(0, 1.48, -6.72);
  corridorDoor.name = 'door_corridor';
  corridorDoor.receiveShadow = false;

  const corridorPeephole = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.16, 16), mat.brassGold);
  corridorPeephole.rotation.x = Math.PI / 2;
  corridorPeephole.position.set(0, 0.52, 0.055);
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

  // 3. Left Wall with Split Tile Wainscot & Exit Blastdoor Architectural Portal
  const leftWallGroup = new THREE.Group();

  const leftTileBack = new THREE.Mesh(new THREE.BoxGeometry(0.22, 2.2, 3.2), mat.ceramicGreenTiles);
  leftTileBack.position.set(-6.78, 1.1, -5.4);
  leftTileBack.receiveShadow = false;
  leftTileBack.name = 'wall_green_tiles';
  leftWallGroup.add(leftTileBack);

  const leftTileFront = new THREE.Mesh(new THREE.BoxGeometry(0.22, 2.2, 9.2), mat.ceramicGreenTiles);
  leftTileFront.position.set(-6.78, 1.1, 2.4);
  leftTileFront.receiveShadow = false;
  leftTileFront.name = 'wall_green_tiles';
  leftWallGroup.add(leftTileFront);

  const leftDadoBack = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.05, 3.2), mat.brassGold);
  leftDadoBack.position.set(-6.77, 2.22, -5.4);
  leftWallGroup.add(leftDadoBack);

  const leftDadoFront = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.05, 9.2), mat.brassGold);
  leftDadoFront.position.set(-6.77, 2.22, 2.4);
  leftWallGroup.add(leftDadoFront);

  const leftUpperLintel = new THREE.Mesh(new THREE.BoxGeometry(0.2, 2.3, 14), mat.chalkUpperWall);
  leftUpperLintel.position.set(-6.8, 4.35, 0);
  leftUpperLintel.receiveShadow = false;
  leftUpperLintel.name = 'wall_chalk_upper';
  leftWallGroup.add(leftUpperLintel);

  const leftUpperBack = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.98, 3.2), mat.chalkUpperWall);
  leftUpperBack.position.set(-6.8, 2.71, -5.4);
  leftUpperBack.receiveShadow = false;
  leftUpperBack.name = 'wall_chalk_upper';
  leftWallGroup.add(leftUpperBack);

  const leftUpperFront = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.98, 9.2), mat.chalkUpperWall);
  leftUpperFront.position.set(-6.8, 2.71, 2.4);
  leftUpperFront.receiveShadow = false;
  leftUpperFront.name = 'wall_chalk_upper';
  leftWallGroup.add(leftUpperFront);

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
  exitRevealBack.position.set(-6.75, 1.51, -3.64);
  leftWallGroup.add(exitRevealBack);

  const exitRevealFront = new THREE.Mesh(new THREE.BoxGeometry(0.24, 3.02, 0.03), mat.brassGold);
  exitRevealFront.position.set(-6.75, 1.51, -2.36);
  leftWallGroup.add(exitRevealFront);

  const exitRevealTop = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.03, 1.28), mat.brassGold);
  exitRevealTop.position.set(-6.75, 3.01, -3.0);
  leftWallGroup.add(exitRevealTop);

  // Recessed Airlock Exit Passage Void (extends back to x = -7.8)
  const exitVoidOuter = new THREE.Mesh(new THREE.PlaneGeometry(1.28, 3.0), mat.titaniumChassis);
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

  const ventFrame = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.4, 2.4), mat.smokedTeak);
  ventFrame.position.set(6.68, 3.2, 0);
  rightWallGroup.add(ventFrame);

  for (let s = -0.5; s <= 0.5; s += 0.25) {
    const slat = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.03, 2.2), mat.brassGold);
    slat.position.set(6.67, 3.2 + s, 0);
    rightWallGroup.add(slat);
  }

  // Clinical Blueprint / Gallery Painting on Right Wall
  const paintingGroup = new THREE.Group();
  paintingGroup.name = 'prop_painting';
  paintingGroup.position.set(6.67, 3.4, 3.2);

  const paintingFrame = new THREE.Mesh(new THREE.BoxGeometry(0.04, 1.4, 1.8), mat.smokedTeak);
  paintingFrame.castShadow = true;
  paintingGroup.add(paintingFrame);

  const paintingCanvas = new THREE.Mesh(new THREE.PlaneGeometry(1.68, 1.28), mat.chalkUpperWall);
  paintingCanvas.rotation.y = -Math.PI / 2;
  paintingCanvas.position.x = -0.022;
  paintingGroup.add(paintingCanvas);

  rightWallGroup.add(paintingGroup);

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
  frontWallGroup.add(obsFrame);

  const obsGlass = new THREE.Mesh(new THREE.BoxGeometry(3.3, 1.8, 0.02), mat.vintageCream);
  obsGlass.position.set(0, 3.2, 6.67);
  frontWallGroup.add(obsGlass);

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
    exitDoorPanel
  };
}
