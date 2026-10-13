import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { Room04MaterialPalette } from './Room04Materials';

export interface Room04PropsEntities {
  smallBellJar: THREE.Mesh;
  cipherKey: THREE.Group;
  crimsonEnvelope: THREE.Mesh;
  telephone: THREE.Group;
  brassShunt: THREE.Mesh;
  facilityDirectory: THREE.Group;
  pneumaticTerminal: THREE.Group;
  waitingBench: THREE.Group;
  wallClock: THREE.Group;
}

export function buildRoom04Props(mat: Room04MaterialPalette): Room04PropsEntities {
  // 1. Small Glass Bell Jar with Brass Cipher Key (Rear-Right of desk)
  const smallBellJar = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.24, 20), mat.glass);
  smallBellJar.position.set(0.75, 0.97, -0.25);
  smallBellJar.name = 'prop_bell_jar';
  smallBellJar.userData.flavorText = 'A vacuum-sealed borosilicate bell jar. It isolates its contents from the environment.';
  smallBellJar.renderOrder = 10;

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

  // 2. Crimson Envelope (Front-Left of desk)
  const crimsonEnvelope = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.012, 0.32), mat.crimsonEnvelope);
  crimsonEnvelope.position.set(-0.75, 0.856, 0.22);
  crimsonEnvelope.rotation.y = 0.25;
  crimsonEnvelope.castShadow = true;
  crimsonEnvelope.receiveShadow = true;
  crimsonEnvelope.name = 'prop_envelope';
  crimsonEnvelope.userData.flavorText = 'A heavy crimson envelope. Department of Cognitive Alignment embossed on the front.';

  // 3. Vintage Cream Rotary Phone (Front-Right of desk)
  const telephone = new THREE.Group();
  telephone.name = 'prop_telephone';
  telephone.userData.flavorText = 'A bakelite rotary telephone. The line is dead, but it still hums faintly.';
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

  // 4. Machined Brass Shunt (Center-Right of desk)
  const brassShunt = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.12, 20), mat.brassGold);
  brassShunt.position.set(0.35, 0.86, 0.15);
  brassShunt.rotation.z = Math.PI / 2;
  brassShunt.castShadow = true;
  brassShunt.name = 'prop_brass_shunt';

  // 5. Institutional Clinical Staff Duty Roster & Inspection Clipboard (Left Wall)
  const facilityDirectory = new THREE.Group();
  facilityDirectory.name = 'prop_facility_directory';
  facilityDirectory.position.set(-6.62, 2.3, 0);
  facilityDirectory.rotation.y = Math.PI / 2;
  facilityDirectory.userData.flavorText = "Institutional Clinical Personnel Ledger and Shift Roster. A hardboard clipboard mounted to the smoked teak board holds the shift schedules, inspection walkthrough logs, and confidential field notes for the 5 sanatorium duty staff.";

  const dirFrameGeo = new THREE.BoxGeometry(1.4, 1.8, 0.05);
  const dirFrame = new THREE.Mesh(dirFrameGeo, mat.smokedTeak);
  dirFrame.userData.isSubPart = true;
  facilityDirectory.add(dirFrame);

  const dirFeltGeo = new THREE.PlaneGeometry(1.28, 1.68);
  const dirFelt = new THREE.Mesh(dirFeltGeo, mat.sageAccent);
  dirFelt.position.z = 0.026;
  dirFelt.userData.isSubPart = true;
  facilityDirectory.add(dirFelt);

  const railGeos: THREE.BufferGeometry[] = [];
  for (let y = -0.6; y <= 0.6; y += 0.2) {
    const rail = new THREE.BoxGeometry(1.2, 0.015, 0.01);
    rail.translate(0, y, 0.03);
    railGeos.push(rail);
  }
  const mergedRails = mergeGeometries(railGeos);
  const railsMesh = new THREE.Mesh(mergedRails, mat.brassGold);
  railsMesh.userData.isSubPart = true;
  facilityDirectory.add(railsMesh);

  // Mounted Inspection Clipboard (Center of Board)
  const clipBoardBack = new THREE.Mesh(
    new THREE.BoxGeometry(0.48, 0.72, 0.016),
    mat.smokedTeak
  );
  clipBoardBack.position.set(0, 0, 0.042);
  clipBoardBack.userData.isSubPart = true;
  facilityDirectory.add(clipBoardBack);

  const clipPaper = new THREE.Mesh(
    new THREE.PlaneGeometry(0.44, 0.66),
    new THREE.MeshStandardMaterial({ color: 0xf8f7f2, roughness: 0.9 })
  );
  clipPaper.position.set(0, -0.01, 0.052);
  clipPaper.userData.isSubPart = true;
  facilityDirectory.add(clipPaper);

  const clipHead = new THREE.Mesh(
    new THREE.BoxGeometry(0.20, 0.05, 0.025),
    mat.brassGold
  );
  clipHead.position.set(0, 0.32, 0.06);
  clipHead.userData.isSubPart = true;
  facilityDirectory.add(clipHead);

  // 6. Pneumatic Dossier Dispatch Terminal (Right Wall)
  const pneumaticTerminal = new THREE.Group();
  pneumaticTerminal.name = 'prop_pneumatic_terminal';
  pneumaticTerminal.position.set(6.62, 2.0, 1.6);
  pneumaticTerminal.rotation.y = -Math.PI / 2;
  pneumaticTerminal.userData.flavorText = "Pneumatic Dispatch Terminal Model 72. High-speed vacuum conduit routing specimen tubes and patient intake dossiers to peripheral wings.";

  const pneuBoxGeo = new THREE.BoxGeometry(0.44, 0.72, 0.22);
  const pneuBox = new THREE.Mesh(pneuBoxGeo, mat.titaniumChassis);
  pneuBox.userData.isSubPart = true;
  pneumaticTerminal.add(pneuBox);

  const tubeLGeo = new THREE.CylinderGeometry(0.04, 0.04, 2.8, 16);
  tubeLGeo.translate(-0.12, 1.4, -0.04);
  const tubeRGeo = new THREE.CylinderGeometry(0.04, 0.04, 2.8, 16);
  tubeRGeo.translate(0.12, 1.4, -0.04);
  const collarGeo = new THREE.BoxGeometry(0.36, 0.06, 0.16);
  collarGeo.translate(0, 0.32, 0.06);
  const mergedTubes = mergeGeometries([tubeLGeo, tubeRGeo, collarGeo]);
  const tubesMesh = new THREE.Mesh(mergedTubes, mat.brushedChrome);
  tubesMesh.userData.isSubPart = true;
  pneumaticTerminal.add(tubesMesh);

  const pneuHatchGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.04, 20);
  pneuHatchGeo.rotateX(Math.PI / 2);
  pneuHatchGeo.translate(0, 0, 0.12);
  const pneuHatch = new THREE.Mesh(pneuHatchGeo, mat.brassGold);
  pneuHatch.userData.isSubPart = true;
  pneumaticTerminal.add(pneuHatch);

  // 7. Sanatorium Waiting Bench (Front Wall)
  const waitingBench = new THREE.Group();
  waitingBench.name = 'prop_waiting_bench';
  waitingBench.position.set(-3.8, 0, 6.4);
  waitingBench.userData.flavorText = "A low institutional waiting bench constructed from bent teak and tubular chrome. The foam padding has hardened with age.";

  const benchSeatGeo = new THREE.BoxGeometry(2.2, 0.08, 0.6);
  benchSeatGeo.translate(0, 0.44, 0);
  const benchBackGeo = new THREE.BoxGeometry(2.2, 0.36, 0.06);
  benchBackGeo.translate(0, 0.68, 0.27);
  const mergedBenchWood = mergeGeometries([benchSeatGeo, benchBackGeo]);
  const benchWoodMesh = new THREE.Mesh(mergedBenchWood, mat.smokedTeak);
  benchWoodMesh.userData.isSubPart = true;
  waitingBench.add(benchWoodMesh);

  const legLGeo = new THREE.BoxGeometry(0.05, 0.44, 0.64);
  legLGeo.translate(-0.95, 0.22, 0);
  const legRGeo = new THREE.BoxGeometry(0.05, 0.44, 0.64);
  legRGeo.translate(0.95, 0.22, 0);
  const mergedLegs = mergeGeometries([legLGeo, legRGeo]);
  const legsMesh = new THREE.Mesh(mergedLegs, mat.brushedChrome);
  legsMesh.userData.isSubPart = true;
  waitingBench.add(legsMesh);

  // 8. Synchronous Slave Wall Clock (North Wall above central arch)
  const wallClock = new THREE.Group();
  wallClock.name = 'prop_wall_clock';
  wallClock.position.set(0, 4.0, -6.62);
  wallClock.userData.flavorText = "A synchronized master-slave wall clock. Its sweep-second hand clicks once every thirty seconds with a hollow mechanical shudder.";

  const clockHousingGeo = new THREE.CylinderGeometry(0.32, 0.32, 0.06, 32);
  clockHousingGeo.rotateX(Math.PI / 2);
  const clockHousing = new THREE.Mesh(clockHousingGeo, mat.smokedTeak);
  clockHousing.userData.isSubPart = true;
  wallClock.add(clockHousing);

  const clockFaceGeo = new THREE.CylinderGeometry(0.28, 0.28, 0.02, 32);
  clockFaceGeo.rotateX(Math.PI / 2);
  clockFaceGeo.translate(0, 0, 0.025);
  const clockFace = new THREE.Mesh(clockFaceGeo, mat.chalkUpperWall);
  clockFace.userData.isSubPart = true;
  wallClock.add(clockFace);

  const handHGeo = new THREE.BoxGeometry(0.015, 0.14, 0.005);
  handHGeo.translate(0, 0.06, 0.04);
  const handMGeo = new THREE.BoxGeometry(0.010, 0.22, 0.005);
  handMGeo.rotateZ(Math.PI / 3);
  handMGeo.translate(0.07, 0.04, 0.04);
  const rimGeo = new THREE.TorusGeometry(0.30, 0.015, 12, 32);
  rimGeo.translate(0, 0, 0.03);
  const mergedClockBrass = mergeGeometries([handHGeo, handMGeo, rimGeo]);
  const clockBrassMesh = new THREE.Mesh(mergedClockBrass, mat.brassGold);
  clockBrassMesh.userData.isSubPart = true;
  wallClock.add(clockBrassMesh);

  return {
    smallBellJar,
    cipherKey,
    crimsonEnvelope,
    telephone,
    brassShunt,
    facilityDirectory,
    pneumaticTerminal,
    waitingBench,
    wallClock
  };
}
