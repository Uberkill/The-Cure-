import * as THREE from 'three';
import { Room04MaterialPalette } from './Room04Materials';

export interface Room04PropsEntities {
  smallBellJar: THREE.Mesh;
  cipherKey: THREE.Group;
  crimsonEnvelope: THREE.Mesh;
  telephone: THREE.Group;
  brassShunt: THREE.Mesh;
}

export function buildRoom04Props(mat: Room04MaterialPalette): Room04PropsEntities {
  // Small Glass Bell Jar with Brass Cipher Key (Rear-Right of desk)
  const smallBellJar = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.24, 20), mat.glass);
  smallBellJar.position.set(0.75, 0.97, -0.25);
  smallBellJar.name = 'prop_bell_jar';
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

  // Crimson Envelope (Front-Left of desk)
  const crimsonEnvelope = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.012, 0.32), mat.crimsonEnvelope);
  crimsonEnvelope.position.set(-0.75, 0.856, 0.22);
  crimsonEnvelope.rotation.y = 0.25;
  crimsonEnvelope.castShadow = true;
  crimsonEnvelope.receiveShadow = true;
  crimsonEnvelope.name = 'prop_envelope';

  // Vintage Cream Rotary Phone (Front-Right of desk)
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

  // Machined Brass Shunt (Center-Right of desk)
  const brassShunt = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.12, 20), mat.brassGold);
  brassShunt.position.set(0.35, 0.86, 0.15);
  brassShunt.rotation.z = Math.PI / 2;
  brassShunt.castShadow = true;
  brassShunt.name = 'prop_brass_shunt';

  return { smallBellJar, cipherKey, crimsonEnvelope, telephone, brassShunt };
}
