import * as THREE from 'three';
import { Room04MaterialPalette } from './Room04Materials';

export interface Room04ApparatusEntities {
  vaultGroup: THREE.Group;
  faceplate: THREE.Mesh;
  rotaryDial: THREE.Mesh;
  knifeSwitch: THREE.Group;
  specimenCore: THREE.Mesh;
  containmentBell: THREE.Mesh;
}

export function buildRoom04Apparatus(mat: Room04MaterialPalette): Room04ApparatusEntities {
  const vaultGroup = new THREE.Group();
  vaultGroup.name = 'prop_vault';
  vaultGroup.position.set(0, 0.85, 0);

  // Outer Chassis
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

  return {
    vaultGroup,
    faceplate,
    rotaryDial,
    knifeSwitch,
    specimenCore,
    containmentBell
  };
}
