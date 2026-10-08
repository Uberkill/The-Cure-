import * as THREE from 'three';
import { ProceduralTextures } from './ProceduralTextures';

export interface Room04Entities {
  group: THREE.Group;
  vaultGroup: THREE.Group;
  faceplate: THREE.Mesh;
  rotaryDial: THREE.Mesh;
  knifeSwitch: THREE.Group;
  specimenCore: THREE.Mesh;
  containmentBell: THREE.Mesh;
  smallBellJar: THREE.Mesh;
  cipherKey: THREE.Group;
  crimsonEnvelope: THREE.Mesh;
  telephone: THREE.Group;
  doorLed: THREE.Mesh;
  corridorDoor: THREE.Mesh;
  corridorLed: THREE.Mesh;
  updateOscilloscope: (freq: number, isResonating: boolean, time: number) => void;
}

export class ProceduralRoom04 {
  public static build(): Room04Entities {
    const rootGroup = new THREE.Group();
    rootGroup.name = 'Room04_Root';

    const { map: tileMap, bumpMap: tileBump } = ProceduralTextures.createCeramicGreenTiles();
    const terrazzoMap = ProceduralTextures.createTerrazzoFloor();
    const { texture: crtTexture, update: updateOscilloscope } = ProceduralTextures.createOscilloscopeTexture();

    const mat = {
      chalkUpperWall: new THREE.MeshStandardMaterial({
        color: 0xe2e6e0,
        roughness: 0.85,
        metalness: 0.02
      }),
      ceramicGreenTiles: new THREE.MeshStandardMaterial({
        roughness: 0.25,
        metalness: 0.12,
        map: tileMap,
        bumpMap: tileBump,
        bumpScale: 0.04
      }),
      terrazzoFloor: new THREE.MeshStandardMaterial({
        roughness: 0.22,
        metalness: 0.05,
        map: terrazzoMap
      }),
      brassGold: new THREE.MeshStandardMaterial({
        color: 0xc28833,
        roughness: 0.28,
        metalness: 0.85
      }),
      smokedTeak: new THREE.MeshStandardMaterial({
        color: 0x1f1a18,
        roughness: 0.50,
        metalness: 0.05
      }),
      titaniumChassis: new THREE.MeshStandardMaterial({
        color: 0x2c333a,
        roughness: 0.35,
        metalness: 0.75
      }),
      brushedChrome: new THREE.MeshStandardMaterial({
        color: 0xd4d8db,
        roughness: 0.22,
        metalness: 0.90
      }),
      crimsonEnvelope: new THREE.MeshStandardMaterial({
        color: 0x8b1e23,
        roughness: 0.45,
        metalness: 0.05
      }),
      vintageCream: new THREE.MeshStandardMaterial({
        color: 0xe8e4d8,
        roughness: 0.35,
        metalness: 0.05
      }),
      sageAccent: new THREE.MeshStandardMaterial({
        color: 0x2d4a3e,
        roughness: 0.30,
        metalness: 0.10
      }),
      glass: new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        transmission: 0.95,
        opacity: 1,
        transparent: false,
        roughness: 0.05,
        ior: 1.50,
        thickness: 0.12,
        depthWrite: true
      }),
      crtScreen: new THREE.MeshBasicMaterial({
        map: crtTexture,
        polygonOffset: true,
        polygonOffsetFactor: -1,
        polygonOffsetUnits: -1
      })
    };

    // 1. Floor
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(14, 14), mat.terrazzoFloor);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    rootGroup.add(floor);

    // 2. Walls
    // Back Wall with Split Wainscot and Architectural Forward Corridor Portal
    const backWallGroup = new THREE.Group();

    // Wainscot: split left (x: -7 to -1.0) and right (x: 1.0 to 7) to leave opening at center
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

    // Brass Dado Rail: split left and right
    const dadoLeft = new THREE.Mesh(new THREE.BoxGeometry(6.0, 0.05, 0.26), mat.brassGold);
    dadoLeft.position.set(-4.0, 2.22, -6.77);
    backWallGroup.add(dadoLeft);

    const dadoRight = new THREE.Mesh(new THREE.BoxGeometry(6.0, 0.05, 0.26), mat.brassGold);
    dadoRight.position.set(4.0, 2.22, -6.77);
    backWallGroup.add(dadoRight);

    // Upper Chalk Wall: lintel spanning full width above door (y > 3.2)
    const upperLintel = new THREE.Mesh(new THREE.BoxGeometry(14, 2.3, 0.2), mat.chalkUpperWall);
    upperLintel.position.set(0, 4.35, -6.8);
    upperLintel.receiveShadow = false;
    upperLintel.name = 'wall_chalk_upper';
    backWallGroup.add(upperLintel);

    // Upper Chalk Wall: left and right between dado rail and lintel
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

    // Forward Observation Corridor Architectural Portal (Centered at x = 0, z = -6.76)
    const corridorFrame = new THREE.Mesh(new THREE.BoxGeometry(2.04, 3.24, 0.24), mat.chalkUpperWall);
    corridorFrame.position.set(0, 1.6, -6.76);
    corridorFrame.receiveShadow = false;
    backWallGroup.add(corridorFrame);

    const archwayReveal = new THREE.Mesh(new THREE.BoxGeometry(1.88, 3.08, 0.22), mat.brassGold);
    archwayReveal.position.set(0, 1.54, -6.75);
    archwayReveal.receiveShadow = false;
    backWallGroup.add(archwayReveal);

    const corridorDoorMat = new THREE.MeshStandardMaterial({
      color: 0x18241e,
      roughness: 0.45,
      metalness: 0.35
    });
    const corridorDoor = new THREE.Mesh(new THREE.BoxGeometry(1.72, 2.96, 0.16), corridorDoorMat);
    corridorDoor.position.set(0, 1.48, -6.74);
    corridorDoor.name = 'door_corridor';
    corridorDoor.receiveShadow = false;
    backWallGroup.add(corridorDoor);

    const corridorPeephole = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.2, 16), mat.brassGold);
    corridorPeephole.rotation.x = Math.PI / 2;
    corridorPeephole.position.set(0, 2.0, -6.73);
    backWallGroup.add(corridorPeephole);

    const corridorLedMat = new THREE.MeshBasicMaterial({ color: 0x8b1e23 });
    const corridorLed = new THREE.Mesh(new THREE.SphereGeometry(0.025, 12, 12), corridorLedMat);
    corridorLed.position.set(0, 3.12, -6.73);
    corridorLed.name = 'corridor_led';
    backWallGroup.add(corridorLed);

    const brassArchLintel = new THREE.Mesh(new THREE.BoxGeometry(2.04, 0.06, 0.26), mat.brassGold);
    brassArchLintel.position.set(0, 3.22, -6.75);
    backWallGroup.add(brassArchLintel);

    rootGroup.add(backWallGroup);

    // Left Wall with Split Tile Wainscot & Exit Blastdoor Architectural Portal
    const leftWallGroup = new THREE.Group();

    // Wainscot: split back (z: -7 to -3.8) and front (z: -2.2 to +7) around door opening
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

    // Brass Dado Rail: split back and front
    const leftDadoBack = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.05, 3.2), mat.brassGold);
    leftDadoBack.position.set(-6.77, 2.22, -5.4);
    leftWallGroup.add(leftDadoBack);

    const leftDadoFront = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.05, 9.2), mat.brassGold);
    leftDadoFront.position.set(-6.77, 2.22, 2.4);
    leftWallGroup.add(leftDadoFront);

    // Upper Chalk Wall: lintel spanning full width above door (y > 3.2)
    const leftUpperLintel = new THREE.Mesh(new THREE.BoxGeometry(0.2, 2.3, 14), mat.chalkUpperWall);
    leftUpperLintel.position.set(-6.8, 4.35, 0);
    leftUpperLintel.receiveShadow = false;
    leftUpperLintel.name = 'wall_chalk_upper';
    leftWallGroup.add(leftUpperLintel);

    // Upper Chalk Wall: back and front between dado rail and lintel
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

    // Exit Blastdoor on Left Wall (Architectural Portal centered at z = -3.0)
    const exitDoorFrame = new THREE.Mesh(new THREE.BoxGeometry(0.24, 3.24, 1.64), mat.chalkUpperWall);
    exitDoorFrame.position.set(-6.74, 1.6, -3.0);
    exitDoorFrame.receiveShadow = false;
    leftWallGroup.add(exitDoorFrame);

    const exitArchReveal = new THREE.Mesh(new THREE.BoxGeometry(0.22, 3.08, 1.52), mat.brassGold);
    exitArchReveal.position.set(-6.73, 1.54, -3.0);
    exitArchReveal.receiveShadow = false;
    leftWallGroup.add(exitArchReveal);

    const exitDoorPanel = new THREE.Mesh(new THREE.BoxGeometry(0.18, 2.96, 1.40), mat.titaniumChassis);
    exitDoorPanel.position.set(-6.72, 1.48, -3.0);
    exitDoorPanel.name = 'prop_door';
    exitDoorPanel.receiveShadow = false;
    leftWallGroup.add(exitDoorPanel);

    const lockWheel = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.025, 12, 24), mat.brassGold);
    lockWheel.rotation.y = Math.PI / 2;
    lockWheel.position.set(-6.61, 1.5, -3.0);
    leftWallGroup.add(lockWheel);

    const exitPeephole = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.2, 16), mat.brassGold);
    exitPeephole.rotation.z = Math.PI / 2;
    exitPeephole.position.set(-6.61, 2.2, -3.0);
    leftWallGroup.add(exitPeephole);

    const exitRibTop = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.08, 1.3), mat.brushedChrome);
    exitRibTop.position.set(-6.61, 2.1, -3.0);
    leftWallGroup.add(exitRibTop);

    const exitRibBottom = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.08, 1.3), mat.brushedChrome);
    exitRibBottom.position.set(-6.61, 1.1, -3.0);
    leftWallGroup.add(exitRibBottom);

    const doorLedMat = new THREE.MeshBasicMaterial({ color: 0x8b1e23 });
    const doorLed = new THREE.Mesh(new THREE.SphereGeometry(0.025, 12, 12), doorLedMat);
    doorLed.position.set(-6.61, 3.25, -3.0);
    doorLed.name = 'door_led';
    leftWallGroup.add(doorLed);

    rootGroup.add(leftWallGroup);

    // Right Wall with Tile Wainscot & Ventilation Acoustic Panel
    const rightWallGroup = new THREE.Group();
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
    rootGroup.add(rightWallGroup);

    // Front Wall with Tile Wainscot & Intake Observation Window
    const frontWallGroup = new THREE.Group();
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

    const obsFrame = new THREE.Mesh(new THREE.BoxGeometry(3.6, 2.0, 0.24), mat.titaniumChassis);
    obsFrame.position.set(0, 3.2, 6.75);
    frontWallGroup.add(obsFrame);

    const obsGlass = new THREE.Mesh(new THREE.BoxGeometry(3.3, 1.8, 0.06), mat.vintageCream);
    obsGlass.position.set(0, 3.2, 6.74);
    frontWallGroup.add(obsGlass);
    rootGroup.add(frontWallGroup);

    // Architectural Ceiling & Cove Frame (y = 5.5)
    const ceilingGroup = new THREE.Group();
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
    rootGroup.add(ceilingGroup);

    // 3. Central Bauhaus Desk (y = 0.8, top surface at y = 0.85)
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
    rootGroup.add(deskGroup);

    // 4. Bauhaus Cantilever Chair (Marcel Breuer Cesca style, tucked behind desk at z = -0.65)
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

    rootGroup.add(chairGroup);

    // 5. Brutalist Planter Beside Desk
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
    rootGroup.add(planterGroup);

    // 6. The Central Vault Apparatus (Rests on desk top at y = 0.85)
    const vaultGroup = new THREE.Group();
    vaultGroup.name = 'prop_vault';
    vaultGroup.position.set(0, 0.85, 0);

    // Outer Chassis: 1.15 wide, 0.54 high, 0.76 deep. Bottom flush with desk top.
    const casing = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.54, 0.76), mat.titaniumChassis);
    casing.position.set(0, 0.27, 0);
    casing.castShadow = true;
    casing.receiveShadow = true;
    casing.name = 'prop_vault';
    vaultGroup.add(casing);

    // Inner console backing
    const fascia = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.46, 0.04), mat.smokedTeak);
    fascia.position.set(0, 0.27, 0.36);
    vaultGroup.add(fascia);

    // Left Console Faceplate (Chalk Accent)
    const faceplate = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.44, 0.02), mat.chalkUpperWall);
    faceplate.position.set(-0.25, 0.27, 0.385);
    faceplate.castShadow = true;
    faceplate.name = 'prop_vault';
    vaultGroup.add(faceplate);

    // Rotary Brass Dial on Left Faceplate
    const dialGeo = new THREE.CylinderGeometry(0.075, 0.075, 0.03, 32);
    const rotaryDial = new THREE.Mesh(dialGeo, mat.brassGold);
    rotaryDial.rotation.x = Math.PI / 2;
    rotaryDial.position.set(-0.25, 0.33, 0.405);
    rotaryDial.castShadow = true;
    rotaryDial.name = 'prop_vault';
    vaultGroup.add(rotaryDial);

    const dialIndicator = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.015, 12), mat.brassGold);
    dialIndicator.rotation.x = Math.PI / 2;
    dialIndicator.position.set(-0.25, 0.42, 0.40);
    vaultGroup.add(dialIndicator);

    // Knife Switch Relay on Left Faceplate
    const knifeSwitch = new THREE.Group();
    knifeSwitch.position.set(-0.25, 0.16, 0.40);
    const switchBase = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.14, 0.02), mat.brassGold);
    switchBase.position.set(0, 0, 0.01);
    knifeSwitch.add(switchBase);
    const switchLever = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.16, 12), mat.brushedChrome);
    switchLever.position.set(0, 0.04, 0.03);
    switchLever.rotation.x = -Math.PI / 4;
    knifeSwitch.add(switchLever);
    vaultGroup.add(knifeSwitch);

    // Right Console CRT Display Bezel & Screen
    const crtBezel = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.44, 0.02), mat.titaniumChassis);
    crtBezel.position.set(0.25, 0.27, 0.385);
    vaultGroup.add(crtBezel);

    const crt = new THREE.Mesh(new THREE.PlaneGeometry(0.40, 0.38), mat.crtScreen);
    crt.position.set(0.25, 0.27, 0.398);
    vaultGroup.add(crt);

    // Top Containment Glass Dome & Specimen Core
    const containmentBell = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.36, 24), mat.glass);
    containmentBell.position.set(0, 0.72, 0);
    containmentBell.castShadow = true;
    containmentBell.renderOrder = 10;
    vaultGroup.add(containmentBell);

    const coreGeo = new THREE.OctahedronGeometry(0.09, 0);
    const coreMat = new THREE.MeshStandardMaterial({
      color: 0x3d5e50,
      emissive: 0x2d4a3e,
      emissiveIntensity: 0.6,
      roughness: 0.1
    });
    const specimenCore = new THREE.Mesh(coreGeo, coreMat);
    specimenCore.position.set(0, 0.72, 0);
    specimenCore.renderOrder = 0;
    vaultGroup.add(specimenCore);

    rootGroup.add(vaultGroup);

    // 7. Small Glass Bell Jar with Brass Cipher Key (Rear-Right of desk)
    const smallBellJar = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.24, 20), mat.glass);
    smallBellJar.position.set(0.75, 0.97, -0.25);
    smallBellJar.name = 'prop_bell_jar';
    smallBellJar.renderOrder = 10;
    rootGroup.add(smallBellJar);

    const cipherKey = new THREE.Group();
    cipherKey.name = 'prop_key';
    cipherKey.position.set(0.75, 0.88, -0.25);
    cipherKey.renderOrder = 0;

    const keyBarrel = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.15, 16), mat.brassGold);
    keyBarrel.rotation.z = Math.PI / 2;
    cipherKey.add(keyBarrel);

    const keyRing = new THREE.Mesh(new THREE.TorusGeometry(0.035, 0.009, 12, 20), mat.brassGold);
    keyRing.position.x = -0.08;
    cipherKey.add(keyRing);

    const pin1 = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.025, 0.015), mat.brassGold);
    pin1.position.set(0.03, 0.016, 0);
    pin1.name = 'key_pin';
    cipherKey.add(pin1);

    const pin2 = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.032, 0.015), mat.brassGold);
    pin2.position.set(0.06, 0.020, 0);
    pin2.name = 'key_pin';
    cipherKey.add(pin2);

    rootGroup.add(cipherKey);

    // 8. Crimson Envelope (Front-Left of desk)
    const crimsonEnvelope = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.012, 0.32), mat.crimsonEnvelope);
    crimsonEnvelope.position.set(-0.75, 0.856, 0.22);
    crimsonEnvelope.rotation.y = 0.25;
    crimsonEnvelope.castShadow = true;
    crimsonEnvelope.receiveShadow = true;
    crimsonEnvelope.name = 'prop_envelope';
    rootGroup.add(crimsonEnvelope);

    // 9. Vintage Cream Rotary Phone (Front-Right of desk)
    const telephone = new THREE.Group();
    telephone.name = 'prop_telephone';
    telephone.position.set(0.75, 0.85, 0.22);
    telephone.rotation.y = -0.3;

    const phoneBase = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.08, 0.22), mat.vintageCream);
    phoneBase.position.y = 0.04;
    phoneBase.castShadow = true;
    telephone.add(phoneBase);

    const phoneDial = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.02, 20), mat.brushedChrome);
    phoneDial.rotation.x = 0.3;
    phoneDial.position.set(0, 0.085, 0.02);
    telephone.add(phoneDial);

    const handset = new THREE.Group();
    handset.position.set(0, 0.12, -0.04);

    const handsetBar = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.24, 16), mat.vintageCream);
    handsetBar.rotation.z = Math.PI / 2;
    handsetBar.castShadow = true;
    handset.add(handsetBar);

    const capGeo = new THREE.CylinderGeometry(0.035, 0.035, 0.025, 20);
    const earCap = new THREE.Mesh(capGeo, mat.vintageCream);
    earCap.rotation.z = Math.PI / 2;
    earCap.position.set(-0.11, 0, 0);
    earCap.castShadow = true;
    handset.add(earCap);

    const mouthCap = new THREE.Mesh(capGeo, mat.vintageCream);
    mouthCap.rotation.z = Math.PI / 2;
    mouthCap.position.set(0.11, 0, 0);
    mouthCap.castShadow = true;
    handset.add(mouthCap);

    telephone.add(handset);

    rootGroup.add(telephone);

    return {
      group: rootGroup,
      vaultGroup,
      faceplate,
      rotaryDial,
      knifeSwitch,
      specimenCore,
      containmentBell,
      smallBellJar,
      cipherKey,
      crimsonEnvelope,
      telephone,
      doorLed,
      corridorDoor,
      corridorLed,
      updateOscilloscope
    };
  }
}
