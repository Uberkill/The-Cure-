import * as THREE from 'three';
import { createRoom04Materials } from './room04/Room04Materials';
import { buildRoom04Shell } from './room04/Room04Shell';
import { buildRoom04Furniture } from './room04/Room04Furniture';
import { buildRoom04Apparatus } from './room04/Room04Apparatus';
import { buildRoom04Props } from './room04/Room04Props';

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
  brassShunt: THREE.Mesh;
  desk: THREE.Group;
  chair: THREE.Group;
  planter: THREE.Group;
  doorLed: THREE.Mesh;
  exitDoorPanel: THREE.Mesh;
  corridorDoor: THREE.Mesh;
  corridorLed: THREE.Mesh;
  updateOscilloscope: (freq: number, isResonating: boolean, time: number) => void;
}

export class ProceduralRoom04 {
  public static build(): Room04Entities {
    const rootGroup = new THREE.Group();
    rootGroup.name = 'Room04_Root';

    const { materials, updateOscilloscope } = createRoom04Materials();

    const shell = buildRoom04Shell(materials);
    rootGroup.add(shell.floor);
    rootGroup.add(shell.backWallGroup);
    rootGroup.add(shell.leftWallGroup);
    rootGroup.add(shell.rightWallGroup);
    rootGroup.add(shell.frontWallGroup);
    rootGroup.add(shell.ceilingGroup);

    const furniture = buildRoom04Furniture(materials);
    rootGroup.add(furniture.deskGroup);
    rootGroup.add(furniture.chairGroup);
    rootGroup.add(furniture.planterGroup);

    const apparatus = buildRoom04Apparatus(materials);
    rootGroup.add(apparatus.vaultGroup);

    const props = buildRoom04Props(materials);
    rootGroup.add(props.smallBellJar);
    rootGroup.add(props.cipherKey);
    rootGroup.add(props.crimsonEnvelope);
    rootGroup.add(props.telephone);
    rootGroup.add(props.brassShunt);

    return {
      group: rootGroup,
      vaultGroup: apparatus.vaultGroup,
      faceplate: apparatus.faceplate,
      rotaryDial: apparatus.rotaryDial,
      knifeSwitch: apparatus.knifeSwitch,
      specimenCore: apparatus.specimenCore,
      containmentBell: apparatus.containmentBell,
      smallBellJar: props.smallBellJar,
      cipherKey: props.cipherKey,
      crimsonEnvelope: props.crimsonEnvelope,
      telephone: props.telephone,
      brassShunt: props.brassShunt,
      desk: furniture.deskGroup,
      chair: furniture.chairGroup,
      planter: furniture.planterGroup,
      doorLed: shell.doorLed,
      exitDoorPanel: shell.exitDoorPanel,
      corridorDoor: shell.corridorDoor,
      corridorLed: shell.corridorLed,
      updateOscilloscope
    };
  }
}
