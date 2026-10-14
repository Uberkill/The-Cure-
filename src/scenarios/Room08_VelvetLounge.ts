import * as THREE from 'three';
import { RoomScenario, HotspotAnchor } from '../types';
import { EventBus } from '../core/EventBus';
import { AudioEngine } from '../audio/AudioEngine';
import { SwitchboardMirrorScreen } from '../ui/screens/SwitchboardMirrorScreen';
import { LightRigManager } from '../rendering/LightRigManager';

export class Room08_VelvetLounge implements RoomScenario {
  public id = 'velvet_lounge';
  public title = 'The Velvet Lounge';
  public actTitle = 'ACT VIII • THE ESCAPE / THE DEPLOYMENT';
  public roomCode = 'Sector 00 • Sub-Baltic Velvet Bar';
  public defaultHotspot = 'overview';

  public hotspots: Record<string, HotspotAnchor> = {
    overview: {
      id: 'overview',
      name: 'I. The Lounge',
      position: new THREE.Vector3(0, 1.8, 3.8),
      interactionPrompt: 'Velvet Lounge Overview',
      cameraPreset: {
        name: 'overview',
        position: new THREE.Vector3(3.4, 2.2, 4.6),
        target: new THREE.Vector3(0, 1.0, 0)
      }
    },
    bar: {
      id: 'bar',
      name: 'II. The Mahogany Bar',
      position: new THREE.Vector3(-1.2, 1.2, 0),
      interactionPrompt: '[INSPECT BAR & DRINK]',
      cameraPreset: {
        name: 'bar',
        position: new THREE.Vector3(-0.2, 1.6, 1.4),
        target: new THREE.Vector3(-1.4, 1.1, 0)
      }
    },
    mirror: {
      id: 'mirror',
      name: 'III. Gilded Mirror & Table',
      position: new THREE.Vector3(-1.4, 1.8, -2.6),
      interactionPrompt: '[INSPECT REFLECTION & TABLE]',
      cameraPreset: {
        name: 'mirror',
        position: new THREE.Vector3(-1.4, 1.8, -2.6),
        target: new THREE.Vector3(-1.4, 1.8, -5.7)
      }
    },
    switchboard: {
      id: 'switchboard',
      name: 'IV. Operator Switchboard',
      position: new THREE.Vector3(1.2, 1.8, 0),
      interactionPrompt: '[INSPECT SWITCHBOARD]',
      cameraPreset: {
        name: 'switchboard',
        position: new THREE.Vector3(0.2, 1.8, 1.2),
        target: new THREE.Vector3(1.2, 1.6, 0)
      }
    },
    payphone: {
      id: 'payphone',
      name: 'V. Ringing Payphone',
      position: new THREE.Vector3(2.6, 1.7, -1.5),
      interactionPrompt: '[ANSWER: THE PHANTOM RECEIVER]',
      cameraPreset: {
        name: 'payphone',
        position: new THREE.Vector3(1.6, 1.8, -0.6),
        target: new THREE.Vector3(2.6, 1.7, -1.5)
      }
    }
  };

  private group: THREE.Group | null = null;
  private payphoneMesh: THREE.Mesh | null = null;
  private mirrorMesh: THREE.Mesh | null = null;
  private decanterMesh: THREE.Group | null = null;
  private payphoneAnswered: boolean = false;
  private switchboardScreen: SwitchboardMirrorScreen = new SwitchboardMirrorScreen();

  public async buildScene(_scene: THREE.Scene): Promise<THREE.Group> {
    this.group = new THREE.Group();

    const matVelvet = new THREE.MeshStandardMaterial({
      color: 0x661217,
      roughness: 0.95,
      metalness: 0.05
    });
    const matMahogany = new THREE.MeshStandardMaterial({
      color: 0x1f140e,
      roughness: 0.28,
      metalness: 0.1
    });
    const matBrass = new THREE.MeshStandardMaterial({
      color: 0xc28833,
      metalness: 0.85,
      roughness: 0.25
    });
    const matChevron = new THREE.MeshStandardMaterial({
      color: 0x141615,
      roughness: 0.35
    });
    const matMarble = new THREE.MeshStandardMaterial({
      color: 0x272b28,
      roughness: 0.2,
      metalness: 0.15
    });
    const matGlass = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transmission: 0.9,
      roughness: 0.08,
      transparent: true,
      opacity: 0.9
    });
    const matAmberLiquor = new THREE.MeshStandardMaterial({
      color: 0xd97706,
      roughness: 0.15
    });
    const matSilhouette = new THREE.MeshBasicMaterial({
      color: 0x050505
    });
    const matLeather = new THREE.MeshStandardMaterial({
      color: 0x4a0e12,
      roughness: 0.55
    });
    const matCastIron = new THREE.MeshStandardMaterial({
      color: 0x111613,
      metalness: 0.7,
      roughness: 0.65
    });

    // Floor: Black-and-white chevron zigzag (Expansive Sub-Baltic Velvet Lounge)
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(16, 18), matChevron);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this.group.add(floor);

    // Ceiling & Deep Red Velvet Drapes
    const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(16, 18), new THREE.MeshBasicMaterial({ color: 0x050505 }));
    ceiling.position.y = 4.2;
    ceiling.rotation.x = Math.PI / 2;
    this.group.add(ceiling);

    const drapesBack = new THREE.Mesh(new THREE.BoxGeometry(16, 4.2, 0.4), matVelvet);
    drapesBack.position.set(0, 2.1, -6.5);
    this.group.add(drapesBack);

    const drapesLeft = new THREE.Mesh(new THREE.BoxGeometry(0.4, 4.2, 18), matVelvet);
    drapesLeft.position.set(-7.5, 2.1, 0);
    this.group.add(drapesLeft);

    const drapesRight = new THREE.Mesh(new THREE.BoxGeometry(0.4, 4.2, 18), matVelvet);
    drapesRight.position.set(7.5, 2.1, 0);
    this.group.add(drapesRight);

    // Return Door to Hub / Previous Chamber
    const returnDoor = new THREE.Mesh(
      new THREE.BoxGeometry(1.6, 3.0, 0.15),
      new THREE.MeshStandardMaterial({ color: 0x221a18, metalness: 0.3, roughness: 0.6 })
    );
    returnDoor.position.set(0, 1.5, 8.85);
    returnDoor.name = 'door_return_hub';
    this.group.add(returnDoor);

    // Mahogany Bar Infrastructure
    const barGroup = new THREE.Group();
    barGroup.name = 'prop_lounge_bar';
    barGroup.position.set(-1.8, 0, 0);

    // Solid Bar Counter Base
    const barBase = new THREE.Mesh(new THREE.BoxGeometry(3.5, 0.98, 1.05), matMahogany);
    barBase.position.y = 0.49;
    barBase.castShadow = true;
    barBase.receiveShadow = true;
    barGroup.add(barBase);

    // Beveled Bar Counter Top
    const barTop = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.12, 1.25), matMahogany);
    barTop.position.y = 1.04;
    barTop.castShadow = true;
    barGroup.add(barTop);

    // Polished Brass Tubular Foot Rail
    const footRail = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 3.4, 16), matBrass);
    footRail.rotation.z = Math.PI / 2;
    footRail.position.set(0, 0.18, 0.60);
    footRail.castShadow = true;
    footRail.raycast = () => {};
    barGroup.add(footRail);

    // Brass Foot Rail Brackets
    const bracketGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.12, 12);
    [-1.2, 0, 1.2].forEach((bx) => {
      const bracket = new THREE.Mesh(bracketGeo, matBrass);
      bracket.rotation.x = Math.PI / 2;
      bracket.position.set(bx, 0.18, 0.54);
      bracket.raycast = () => {};
      barGroup.add(bracket);
    });

    // Lowball Glass with Amber Whiskey & Ice (resting flush on bar counter top y=1.10)
    const glassGroup = new THREE.Group();
    glassGroup.position.set(-1.4, 1.10, 0.1);
    glassGroup.name = 'prop_whiskey_glass';

    const tumbler = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.07, 0.14, 16), matGlass);
    tumbler.position.y = 0.07;
    glassGroup.add(tumbler);

    const whiskey = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.065, 0.08, 16), matAmberLiquor);
    whiskey.position.y = 0.05;
    glassGroup.add(whiskey);

    this.group.add(barGroup);
    this.group.add(glassGroup);

    // Contact shadow plane under mahogany bar counter
    const barAO = new THREE.Mesh(
      new THREE.PlaneGeometry(3.9, 1.3),
      new THREE.MeshBasicMaterial({ color: 0x050706, transparent: true, opacity: 0.42, depthWrite: false })
    );
    barAO.rotation.x = -Math.PI / 2;
    barAO.position.set(-1.8, 0.003, 0);
    barAO.raycast = () => {};
    this.group.add(barAO);

    // Two Tufted Burgundy Leather Bar Stools (Shared Geometries)
    const stoolBaseGeo = new THREE.CylinderGeometry(0.24, 0.26, 0.04, 24);
    const stoolStemGeo = new THREE.CylinderGeometry(0.035, 0.035, 0.70, 16);
    const stoolSeatGeo = new THREE.CylinderGeometry(0.25, 0.23, 0.12, 24);
    const stoolAOGeo = new THREE.PlaneGeometry(0.65, 0.65);

    [-2.8, -1.2].forEach((sx, idx) => {
      const stoolGroup = new THREE.Group();
      stoolGroup.position.set(sx, 0, 1.0);
      stoolGroup.name = `prop_velvet_stool_${idx + 1}`;
      stoolGroup.userData.flavorText = [
        'A plush burgundy velvet bar stool with polished brass trim.',
        'The velvet pile is worn thin in the center. The brass footrest is dull and pitted with dried water droplets.',
        'A faded brass tag under the seat reads: "RECREATION WARD SL4-08 • PROPERTY OF DEPARTMENT OF COGNITIVE ALIGNMENT".'
      ];

      const stoolBase = new THREE.Mesh(stoolBaseGeo, matBrass);
      stoolBase.position.y = 0.02;
      stoolGroup.add(stoolBase);

      const stoolStem = new THREE.Mesh(stoolStemGeo, matBrass);
      stoolStem.position.y = 0.38;
      stoolGroup.add(stoolStem);

      const stoolSeat = new THREE.Mesh(stoolSeatGeo, matLeather);
      stoolSeat.position.y = 0.75;
      stoolSeat.castShadow = true;
      stoolGroup.add(stoolSeat);

      this.group!.add(stoolGroup);

      const stoolAO = new THREE.Mesh(
        stoolAOGeo,
        new THREE.MeshBasicMaterial({ color: 0x050706, transparent: true, opacity: 0.35, depthWrite: false })
      );
      stoolAO.rotation.x = -Math.PI / 2;
      stoolAO.position.set(sx, 0.003, 1.0);
      stoolAO.raycast = () => {};
      this.group!.add(stoolAO);
    });

    // Back-Bar Mirrored Liquor Shelving
    const backBarGroup = new THREE.Group();
    backBarGroup.position.set(-5.6, 1.8, 0);
    backBarGroup.name = 'mesh_back_bar_shelves';

    const shelfBack = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 2.4, 3.2),
      new THREE.MeshStandardMaterial({ color: 0x14100d, roughness: 0.3, metalness: 0.4 })
    );
    shelfBack.userData.isSubPart = true;
    backBarGroup.add(shelfBack);

    // 3 Glass Shelves with Bottles (Shared Geometries)
    const shelfGlassGeo = new THREE.BoxGeometry(0.35, 0.03, 3.0);
    const bottleGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.28, 12);

    [-0.6, 0.0, 0.6].forEach((sy) => {
      const shelfGlass = new THREE.Mesh(shelfGlassGeo, matGlass);
      shelfGlass.position.set(0.18, sy, 0);
      shelfGlass.userData.isSubPart = true;
      backBarGroup.add(shelfGlass);

      // Vintage Bottles along shelf
      [-1.1, -0.6, -0.1, 0.4, 0.9].forEach((bz) => {
        const bottleColor = Math.random() > 0.5 ? 0x064e3b : 0xd97706;
        const bottle = new THREE.Mesh(
          bottleGeo,
          new THREE.MeshPhysicalMaterial({ color: bottleColor, roughness: 0.1, transmission: 0.7 })
        );
        bottle.position.set(0.18, sy + 0.155, bz);
        bottle.userData.isSubPart = true;
        backBarGroup.add(bottle);
      });
    });
    this.group.add(backBarGroup);

    // The Gilded Mirror on Back Wall
    const mirrorFrame = new THREE.Mesh(new THREE.BoxGeometry(2.4, 3.2, 0.12), matBrass);
    mirrorFrame.position.set(-1.4, 2.1, -5.7);
    this.group.add(mirrorFrame);

    this.mirrorMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(2.1, 2.9),
      new THREE.MeshStandardMaterial({
        color: 0x111613,
        metalness: 0.95,
        roughness: 0.05
      })
    );
    this.mirrorMesh.position.set(-1.4, 2.1, -5.63);
    this.mirrorMesh.name = 'prop_bar_mirror_glass';
    this.group.add(this.mirrorMesh);

    // Featureless Black Silhouette in Mirror
    const silhouette = new THREE.Mesh(new THREE.CapsuleGeometry(0.35, 1.1, 8, 16), matSilhouette);
    silhouette.position.set(-1.4, 1.8, -5.55);
    silhouette.name = 'prop_bar_mirror_silhouette';
    silhouette.userData.isSubPart = true;
    this.group.add(silhouette);

    // Round Pedestal Marble Cocktail Table in front of Mirror
    const tableGroup = new THREE.Group();
    tableGroup.position.set(-1.4, 0, -4.5);
    tableGroup.name = 'prop_cocktail_table';
    tableGroup.userData.flavorText = [
      'A round pedestal cocktail table topped with green-veined marble.',
      'Condensation rings have stained the marble surface in concentric patterns, resembling acoustic Chladni rings.',
      'Underneath the rim of the table, someone scratched a tally mark: four vertical slashes, crossed through.'
    ];

    const tableBase = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.38, 0.04, 24), matBrass);
    tableBase.position.y = 0.02;
    tableGroup.add(tableBase);

    const tableStem = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.82, 16), matBrass);
    tableStem.position.y = 0.44;
    tableGroup.add(tableStem);

    const tableTop = new THREE.Mesh(new THREE.CylinderGeometry(0.68, 0.68, 0.05, 32), matMarble);
    tableTop.position.y = 0.87;
    tableTop.castShadow = true;
    tableTop.receiveShadow = true;
    tableGroup.add(tableTop);

    // Vintage Shaded Brass Cocktail Table Lamp
    const tableLampGroup = new THREE.Group();
    tableLampGroup.position.set(0.32, 0.895, 0.22);
    tableLampGroup.name = 'prop_cocktail_table_lamp';
    tableLampGroup.userData.isSubPart = true;

    const lampBase = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.075, 0.02, 16), matBrass);
    lampBase.position.y = 0.01;
    lampBase.castShadow = true;
    lampBase.raycast = () => {};
    tableLampGroup.add(lampBase);

    const lampStem = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.26, 12), matBrass);
    lampStem.position.y = 0.14;
    lampStem.castShadow = true;
    lampStem.raycast = () => {};
    tableLampGroup.add(lampStem);

    const matSilkShade = new THREE.MeshStandardMaterial({
      color: 0xfef3c7,
      roughness: 0.75,
      emissive: 0xfde047,
      emissiveIntensity: 0.35
    });
    const lampShade = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.13, 0.13, 20), matSilkShade);
    lampShade.position.y = 0.26;
    lampShade.castShadow = true;
    lampShade.raycast = () => {};
    tableLampGroup.add(lampShade);

    const tableLampBulb = new THREE.Mesh(
      new THREE.SphereGeometry(0.025, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0xfef08a })
    );
    tableLampBulb.position.y = 0.22;
    tableLampBulb.raycast = () => {};
    tableLampGroup.add(tableLampBulb);

    const tableLampLight = new THREE.PointLight(0xfef08a, 0.85, 3.5);
    tableLampLight.position.set(0, 0.22, 0);
    tableLampGroup.add(tableLampLight);

    tableGroup.add(tableLampGroup);

    // The Faceted Crystal Decanter (Key puzzle prop, resting flush on marble cocktail table y=0.895)
    this.decanterMesh = new THREE.Group();
    this.decanterMesh.position.set(-1.4, 0.895, -4.5);
    this.decanterMesh.name = 'prop_crystal_decanter';

    const decanterBody = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.32, 0.22), matGlass);
    decanterBody.position.y = 0.16;
    decanterBody.castShadow = true;
    this.decanterMesh.add(decanterBody);

    const decanterLiquid = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.22, 0.18), matAmberLiquor);
    decanterLiquid.position.y = 0.12;
    this.decanterMesh.add(decanterLiquid);

    const decanterNeck = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.06, 0.10, 16), matGlass);
    decanterNeck.position.y = 0.37;
    this.decanterMesh.add(decanterNeck);

    const decanterStopper = new THREE.Mesh(new THREE.OctahedronGeometry(0.07, 0), matGlass);
    decanterStopper.position.y = 0.47;
    this.decanterMesh.add(decanterStopper);

    this.decanterMesh.userData.interactionPrompt = '[EXAMINE: CUT-CRYSTAL DECANTER]';

    this.group.add(tableGroup);

    // Contact shadow plane under round marble cocktail table
    const tableAO = new THREE.Mesh(
      new THREE.PlaneGeometry(1.2, 1.2),
      new THREE.MeshBasicMaterial({ color: 0x050706, transparent: true, opacity: 0.38, depthWrite: false })
    );
    tableAO.rotation.x = -Math.PI / 2;
    tableAO.position.set(-1.4, 0.003, -4.5);
    tableAO.raycast = () => {};
    this.group.add(tableAO);

    this.group.add(this.decanterMesh);

    // Articulated Vintage Operator PBX Switchboard
    const switchboardGroup = new THREE.Group();
    switchboardGroup.position.set(1.2, 1.8, 0);
    switchboardGroup.rotation.y = -Math.PI / 2;
    switchboardGroup.name = 'prop_switchboard';

    const switchboardCase = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 0.85, 0.24),
      new THREE.MeshStandardMaterial({ color: 0x19211c, roughness: 0.6, metalness: 0.3 })
    );
    switchboardGroup.add(switchboardCase);

    const jackFace = new THREE.Mesh(
      new THREE.PlaneGeometry(1.0, 0.55),
      new THREE.MeshStandardMaterial({ color: 0x090e0c, roughness: 0.2 })
    );
    jackFace.position.z = 0.121;
    switchboardGroup.add(jackFace);

    // 4x4 Brass Jack Matrix & Jewel Indicators (Shared Geometries)
    const jackGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.02, 16);
    const indicatorLampGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.015, 12);

    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        const jx = -0.38 + c * 0.25;
        const jy = -0.18 + r * 0.12;

        const jack = new THREE.Mesh(jackGeo, matBrass);
        jack.rotation.x = Math.PI / 2;
        jack.position.set(jx, jy, 0.125);
        jack.raycast = () => {};
        switchboardGroup.add(jack);

        // Indicator Jewel Light above jack
        const lampMat = r === 3 ? new THREE.MeshBasicMaterial({ color: 0xef4444 }) : new THREE.MeshBasicMaterial({ color: 0xf59e0b });
        const lamp = new THREE.Mesh(indicatorLampGeo, lampMat);
        lamp.rotation.x = Math.PI / 2;
        lamp.position.set(jx, jy + 0.045, 0.125);
        lamp.raycast = () => {};
        switchboardGroup.add(lamp);
      }
    }

    // Lower Slanted Key Shelf with Brass Toggle Keys
    const keyShelf = new THREE.Mesh(
      new THREE.BoxGeometry(1.15, 0.12, 0.25),
      new THREE.MeshStandardMaterial({ color: 0x141a16, roughness: 0.5 })
    );
    keyShelf.position.set(0, -0.42, 0.16);
    keyShelf.rotation.x = 0.3;
    keyShelf.raycast = () => {};
    switchboardGroup.add(keyShelf);

    const toggleKeyGeo = new THREE.CylinderGeometry(0.01, 0.01, 0.06, 12);
    [-0.35, -0.12, 0.12, 0.35].forEach((kx) => {
      const toggleKey = new THREE.Mesh(toggleKeyGeo, matBrass);
      toggleKey.position.set(kx, -0.38, 0.24);
      toggleKey.rotation.x = -0.4;
      toggleKey.raycast = () => {};
      switchboardGroup.add(toggleKey);
    });

    // Operator PBX Routing Directory Card resting on key shelf
    const directoryCard = new THREE.Mesh(
      new THREE.BoxGeometry(0.35, 0.015, 0.22),
      new THREE.MeshStandardMaterial({ color: 0xfef08a, roughness: 0.9 })
    );
    directoryCard.position.set(-0.25, -0.36, 0.22);
    directoryCard.rotation.x = 0.3;
    directoryCard.name = 'prop_switchboard_directory';
    directoryCard.userData.interactionPrompt = '[READ: PBX DIRECTORY]';
    switchboardGroup.add(directoryCard);

    // Structural Tubular Steel Support Legs for PBX Console (Shared Geometries)
    const legGeo = new THREE.CylinderGeometry(0.018, 0.018, 1.37, 12);
    const footGeo = new THREE.CylinderGeometry(0.045, 0.045, 0.03, 12);

    [-0.52, 0.52].forEach((lx) => {
      const leg = new THREE.Mesh(legGeo, matCastIron);
      leg.position.set(lx, -1.11, 0);
      leg.raycast = () => {};
      leg.userData.isSubPart = true;
      switchboardGroup.add(leg);

      const foot = new THREE.Mesh(footGeo, matBrass);
      foot.position.set(lx, -1.785, 0);
      foot.raycast = () => {};
      foot.userData.isSubPart = true;
      switchboardGroup.add(foot);
    });

    this.group.add(switchboardGroup);

    // Grounded Operator PBX Partition Backdrop & Station
    const operatorAlcoveGroup = new THREE.Group();
    operatorAlcoveGroup.position.set(1.2, 0, 0);
    operatorAlcoveGroup.raycast = () => {};
    operatorAlcoveGroup.userData.isSubPart = true;

    // Heavy Baltic Mahogany Partition Wall behind switchboard
    const pbxPartition = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 2.5, 1.8),
      matMahogany
    );
    pbxPartition.position.set(0.24, 1.25, 0);
    pbxPartition.raycast = () => {};
    pbxPartition.userData.isSubPart = true;
    operatorAlcoveGroup.add(pbxPartition);

    // Brass Header Trim atop partition
    const pbxHeader = new THREE.Mesh(
      new THREE.BoxGeometry(0.16, 0.05, 1.84),
      matBrass
    );
    pbxHeader.position.set(0.24, 2.525, 0);
    pbxHeader.raycast = () => {};
    pbxHeader.userData.isSubPart = true;
    operatorAlcoveGroup.add(pbxHeader);

    // Industrial Floor Cable Trunking Collar & Vertical Riser
    const pbxCollar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.14, 0.06, 16),
      matCastIron
    );
    pbxCollar.position.set(0, 0.03, 0);
    pbxCollar.raycast = () => {};
    pbxCollar.userData.isSubPart = true;
    operatorAlcoveGroup.add(pbxCollar);

    const pbxConduit = new THREE.Mesh(
      new THREE.CylinderGeometry(0.035, 0.035, 0.9, 12),
      matCastIron
    );
    pbxConduit.position.set(0, 0.45, -0.05);
    pbxConduit.raycast = () => {};
    pbxConduit.userData.isSubPart = true;
    operatorAlcoveGroup.add(pbxConduit);

    // Operator Swivel Stool
    const pbxStoolBase = new THREE.Mesh(
      new THREE.CylinderGeometry(0.18, 0.2, 0.03, 16),
      matCastIron
    );
    pbxStoolBase.position.set(-0.45, 0.015, 0);
    pbxStoolBase.raycast = () => {};
    pbxStoolBase.userData.isSubPart = true;
    operatorAlcoveGroup.add(pbxStoolBase);

    const pbxStoolStem = new THREE.Mesh(
      new THREE.CylinderGeometry(0.025, 0.025, 0.58, 12),
      matBrass
    );
    pbxStoolStem.position.set(-0.45, 0.305, 0);
    pbxStoolStem.raycast = () => {};
    pbxStoolStem.userData.isSubPart = true;
    operatorAlcoveGroup.add(pbxStoolStem);

    const pbxStoolSeat = new THREE.Mesh(
      new THREE.CylinderGeometry(0.2, 0.2, 0.08, 16),
      matLeather
    );
    pbxStoolSeat.position.set(-0.45, 0.635, 0);
    pbxStoolSeat.raycast = () => {};
    pbxStoolSeat.userData.isSubPart = true;
    operatorAlcoveGroup.add(pbxStoolSeat);

    this.group.add(operatorAlcoveGroup);

    // Contact shadow plane under PBX console & station
    const switchboardAO = new THREE.Mesh(
      new THREE.PlaneGeometry(1.6, 2.2),
      new THREE.MeshBasicMaterial({ color: 0x050706, transparent: true, opacity: 0.38, depthWrite: false })
    );
    switchboardAO.rotation.x = -Math.PI / 2;
    switchboardAO.position.set(1.2, 0.003, 0);
    switchboardAO.raycast = () => {};
    this.group.add(switchboardAO);

    // Floor-Anchored Baltic Mahogany Acoustic Telephone Kiosk
    const kioskGroup = new THREE.Group();
    kioskGroup.position.set(2.6, 0, -1.5);
    kioskGroup.raycast = () => {};
    kioskGroup.userData.isSubPart = true;

    // Ground Plinth Base
    const kioskBase = new THREE.Mesh(
      new THREE.BoxGeometry(0.88, 0.08, 0.82),
      matMahogany
    );
    kioskBase.position.set(0, 0.04, 0);
    kioskBase.raycast = () => {};
    kioskBase.userData.isSubPart = true;
    kioskGroup.add(kioskBase);

    // Brass Plinth Kick-Plate
    const kioskKickPlate = new THREE.Mesh(
      new THREE.BoxGeometry(0.90, 0.03, 0.84),
      matBrass
    );
    kioskKickPlate.position.set(0, 0.015, 0);
    kioskKickPlate.raycast = () => {};
    kioskKickPlate.userData.isSubPart = true;
    kioskGroup.add(kioskKickPlate);

    // Full-Height Mahogany Acoustic Backing Wall
    const kioskBack = new THREE.Mesh(
      new THREE.BoxGeometry(0.88, 2.42, 0.06),
      matMahogany
    );
    kioskBack.position.set(0, 1.25, -0.38);
    kioskBack.raycast = () => {};
    kioskBack.userData.isSubPart = true;
    kioskGroup.add(kioskBack);

    // Kiosk Acoustic Side Wings (Floor-to-Canopy)
    const kioskSideGeo = new THREE.BoxGeometry(0.05, 2.38, 0.76);
    [-0.415, 0.415].forEach((kx) => {
      const side = new THREE.Mesh(kioskSideGeo, matMahogany);
      side.position.set(kx, 1.25, 0);
      side.raycast = () => {};
      side.userData.isSubPart = true;
      kioskGroup.add(side);
    });

    // Kiosk Overhead Canopy Hood with Brass Crown Molding
    const kioskCanopy = new THREE.Mesh(
      new THREE.BoxGeometry(0.92, 0.12, 0.86),
      matMahogany
    );
    kioskCanopy.position.set(0, 2.47, 0);
    kioskCanopy.raycast = () => {};
    kioskCanopy.userData.isSubPart = true;
    kioskGroup.add(kioskCanopy);

    const kioskCrown = new THREE.Mesh(
      new THREE.BoxGeometry(0.96, 0.04, 0.90),
      matBrass
    );
    kioskCrown.position.set(0, 2.54, 0);
    kioskCrown.raycast = () => {};
    kioskCrown.userData.isSubPart = true;
    kioskGroup.add(kioskCrown);

    this.group.add(kioskGroup);

    // Contact shadow plane under Telephone Kiosk
    const kioskAO = new THREE.Mesh(
      new THREE.PlaneGeometry(1.3, 1.3),
      new THREE.MeshBasicMaterial({ color: 0x050706, transparent: true, opacity: 0.42, depthWrite: false })
    );
    kioskAO.rotation.x = -Math.PI / 2;
    kioskAO.position.set(2.6, 0.003, -1.5);
    kioskAO.raycast = () => {};
    this.group.add(kioskAO);

    // Wall Vintage Payphone with Armored Cord & Acoustic Wings
    const phoneGroup = new THREE.Group();
    phoneGroup.position.set(2.6, 1.8, -1.5);
    phoneGroup.name = 'prop_lounge_payphone';

    // Acoustic Privacy Wings (Shared Geometry)
    const wingGeo = new THREE.BoxGeometry(0.04, 0.95, 0.45);
    [-0.28, 0.28].forEach((wx) => {
      const wing = new THREE.Mesh(wingGeo, new THREE.MeshStandardMaterial({ color: 0x141816, roughness: 0.7 }));
      wing.position.set(wx, 0, 0.1);
      wing.raycast = () => {};
      phoneGroup.add(wing);
    });

    const phoneBox = new THREE.Mesh(
      new THREE.BoxGeometry(0.38, 0.72, 0.25),
      new THREE.MeshStandardMaterial({ color: 0x1f2924, roughness: 0.3, metalness: 0.8 })
    );
    phoneBox.name = 'prop_lounge_payphone';
    phoneBox.userData.isSubPart = true;
    phoneGroup.add(phoneBox);

    // Instruction Placard
    const placard = new THREE.Mesh(
      new THREE.PlaneGeometry(0.26, 0.14),
      new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.4 })
    );
    placard.position.set(0, 0.22, 0.126);
    placard.raycast = () => {};
    phoneGroup.add(placard);

    const rotaryDial = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.02, 16), matBrass);
    rotaryDial.rotation.x = Math.PI / 2;
    rotaryDial.position.set(0, -0.02, 0.135);
    rotaryDial.raycast = () => {};
    phoneGroup.add(rotaryDial);

    // Handset receiver
    this.payphoneMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 0.5, 0.12),
      new THREE.MeshStandardMaterial({ color: 0x111613, roughness: 0.4 })
    );
    this.payphoneMesh.position.set(-0.24, 0.02, 0.12);
    this.payphoneMesh.name = 'prop_lounge_payphone';
    this.payphoneMesh.userData.isSubPart = true;
    phoneGroup.add(this.payphoneMesh);

    // Armored Flexible Metal Cord (Curved tube)
    const cordCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.24, -0.22, 0.12),
      new THREE.Vector3(-0.20, -0.45, 0.10),
      new THREE.Vector3(-0.08, -0.42, 0.08),
      new THREE.Vector3(0.0, -0.35, 0.10)
    ]);
    const cord = new THREE.Mesh(new THREE.TubeGeometry(cordCurve, 16, 0.012, 8, false), matCastIron);
    cord.raycast = () => {};
    phoneGroup.add(cord);

    // Brass Hood Fixture over Payphone
    const phoneHood = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.08, 0.06, 16), matBrass);
    phoneHood.position.set(0, 0.44, 0.16);
    phoneHood.raycast = () => {};
    phoneHood.userData.isSubPart = true;
    phoneGroup.add(phoneHood);

    const phoneHoodBulb = new THREE.Mesh(
      new THREE.SphereGeometry(0.025, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0xfef08a })
    );
    phoneHoodBulb.position.set(0, 0.41, 0.16);
    phoneHoodBulb.raycast = () => {};
    phoneHoodBulb.userData.isSubPart = true;
    phoneGroup.add(phoneHoodBulb);

    this.group.add(phoneGroup);

    // Colonnade: 4 Fluted Mahogany & Brass Architectural Columns (Shared Geometries)
    const colBaseGeo = new THREE.BoxGeometry(0.68, 0.22, 0.68);
    const colShaftGeo = new THREE.CylinderGeometry(0.22, 0.25, 3.76, 16);
    const colCapitalGeo = new THREE.BoxGeometry(0.72, 0.22, 0.72);
    const colAOGeo = new THREE.PlaneGeometry(1.15, 1.15);
    const colAOMat = new THREE.MeshBasicMaterial({ color: 0x050706, transparent: true, opacity: 0.35, depthWrite: false });

    [
      [-4.2, -3.0],
      [-4.2, 3.0],
      [4.2, -3.0],
      [4.2, 3.0]
    ].forEach(([cx, cz]) => {
      const colGroup = new THREE.Group();
      colGroup.position.set(cx, 0, cz);
      colGroup.raycast = () => {};
      colGroup.userData.isSubPart = true;

      const base = new THREE.Mesh(colBaseGeo, matBrass);
      base.position.y = 0.11;
      base.raycast = () => {};
      colGroup.add(base);

      const shaft = new THREE.Mesh(colShaftGeo, matMahogany);
      shaft.position.y = 2.10;
      shaft.castShadow = true;
      shaft.receiveShadow = true;
      shaft.raycast = () => {};
      colGroup.add(shaft);

      const capital = new THREE.Mesh(colCapitalGeo, matBrass);
      capital.position.y = 4.09;
      capital.raycast = () => {};
      colGroup.add(capital);

      this.group!.add(colGroup);

      const colAO = new THREE.Mesh(colAOGeo, colAOMat);
      colAO.rotation.x = -Math.PI / 2;
      colAO.position.set(cx, 0.003, cz);
      colAO.raycast = () => {};
      this.group!.add(colAO);
    });

    // Deep Crimson Bordered Velvet Area Rugs (Shared Geometries)
    const rugGeo = new THREE.PlaneGeometry(3.6, 6.4);
    const matCrimsonRug = new THREE.MeshStandardMaterial({
      color: 0x480d12,
      roughness: 0.92,
      metalness: 0.05
    });

    // Rug 1: Anchoring Bar and Stools
    const rugBar = new THREE.Mesh(rugGeo, matCrimsonRug);
    rugBar.rotation.x = -Math.PI / 2;
    rugBar.position.set(-2.2, 0.002, 0);
    rugBar.receiveShadow = true;
    rugBar.raycast = () => {};
    this.group.add(rugBar);

    // Rug 2: Anchoring Conversational Seating
    const rugLounge = new THREE.Mesh(rugGeo, matCrimsonRug);
    rugLounge.rotation.x = -Math.PI / 2;
    rugLounge.position.set(3.4, 0.002, 1.8);
    rugLounge.receiveShadow = true;
    rugLounge.raycast = () => {};
    this.group.add(rugLounge);

    // Perimeter Tufted Burgundy Velvet Banquette Booths (Shared Geometries)
    const banquetteBaseGeo = new THREE.BoxGeometry(1.1, 0.42, 2.4);
    const banquetteCushionGeo = new THREE.BoxGeometry(0.95, 0.14, 2.3);
    const banquetteBackGeo = new THREE.BoxGeometry(0.28, 0.95, 2.4);
    const banquetteTableBaseGeo = new THREE.CylinderGeometry(0.22, 0.25, 0.03, 16);
    const banquetteTableStemGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.58, 12);
    const banquetteTableTopGeo = new THREE.CylinderGeometry(0.45, 0.45, 0.04, 24);

    [
      { x: 5.6, z: 1.8, rotY: -Math.PI / 2 },
      { x: -5.6, z: 1.8, rotY: Math.PI / 2 }
    ].forEach((cfg) => {
      const boothGroup = new THREE.Group();
      boothGroup.position.set(cfg.x, 0, cfg.z);
      boothGroup.rotation.y = cfg.rotY;
      boothGroup.raycast = () => {};
      boothGroup.userData.isSubPart = true;

      const bBase = new THREE.Mesh(banquetteBaseGeo, matMahogany);
      bBase.position.set(0, 0.21, 0);
      bBase.raycast = () => {};
      boothGroup.add(bBase);

      const bCushion = new THREE.Mesh(banquetteCushionGeo, matVelvet);
      bCushion.position.set(0.05, 0.49, 0);
      bCushion.raycast = () => {};
      boothGroup.add(bCushion);

      const bBack = new THREE.Mesh(banquetteBackGeo, matVelvet);
      bBack.position.set(-0.41, 0.88, 0);
      bBack.raycast = () => {};
      boothGroup.add(bBack);

      // Cocktail Table in front of Booth
      const tBase = new THREE.Mesh(banquetteTableBaseGeo, matBrass);
      tBase.position.set(0.95, 0.015, 0);
      tBase.raycast = () => {};
      boothGroup.add(tBase);

      const tStem = new THREE.Mesh(banquetteTableStemGeo, matBrass);
      tStem.position.set(0.95, 0.31, 0);
      tStem.raycast = () => {};
      boothGroup.add(tStem);

      const tTop = new THREE.Mesh(banquetteTableTopGeo, matMarble);
      tTop.position.set(0.95, 0.62, 0);
      tTop.castShadow = true;
      tTop.receiveShadow = true;
      tTop.raycast = () => {};
      boothGroup.add(tTop);

      this.group!.add(boothGroup);
    });

    // Suspended Fluted Amber Glass & Brass Bar Pendants (Shared Geometries)
    const matAmberPendant = new THREE.MeshPhysicalMaterial({
      color: 0xd97706,
      roughness: 0.15,
      transmission: 0.6,
      emissive: 0xb45309,
      emissiveIntensity: 0.45
    });

    const pCordGeo = new THREE.CylinderGeometry(0.006, 0.006, 1.45, 8);
    const pCapGeo = new THREE.CylinderGeometry(0.04, 0.08, 0.05, 16);
    const pShadeGeo = new THREE.CylinderGeometry(0.08, 0.24, 0.22, 24);
    const pBulbGeo = new THREE.SphereGeometry(0.055, 12, 12);

    [-2.7, -0.9].forEach((px) => {
      const pendantGroup = new THREE.Group();
      pendantGroup.position.set(px, 0, 0);
      pendantGroup.raycast = () => {};
      pendantGroup.userData.isSubPart = true;

      const pCord = new THREE.Mesh(pCordGeo, matCastIron);
      pCord.position.set(0, 3.455, 0);
      pCord.raycast = () => {};
      pendantGroup.add(pCord);

      const pCap = new THREE.Mesh(pCapGeo, matBrass);
      pCap.position.set(0, 2.73, 0);
      pCap.raycast = () => {};
      pendantGroup.add(pCap);

      const pShade = new THREE.Mesh(pShadeGeo, matAmberPendant);
      pShade.position.set(0, 2.62, 0);
      pShade.raycast = () => {};
      pendantGroup.add(pShade);

      const pBulb = new THREE.Mesh(pBulbGeo, new THREE.MeshBasicMaterial({ color: 0xfef08a }));
      pBulb.position.set(0, 2.58, 0);
      pBulb.raycast = () => {};
      pendantGroup.add(pBulb);

      this.group!.add(pendantGroup);
    });

    // Scalloped Brass Wall Sconces Along Velvet Drapes (Shared Geometries)
    const sPlateGeo = new THREE.BoxGeometry(0.12, 0.24, 0.025);
    const sArmGeo = new THREE.CylinderGeometry(0.01, 0.01, 0.12, 8);
    const sCupGeo = new THREE.CylinderGeometry(0.04, 0.025, 0.04, 12);
    const sShadeGeo = new THREE.CylinderGeometry(0.035, 0.045, 0.12, 12);
    const matSconceShade = new THREE.MeshBasicMaterial({ color: 0xfef08a });

    [-4.8, 2.2].forEach((sx) => {
      const sconceGroup = new THREE.Group();
      sconceGroup.position.set(sx, 2.2, -6.28);
      sconceGroup.raycast = () => {};
      sconceGroup.userData.isSubPart = true;

      const sPlate = new THREE.Mesh(sPlateGeo, matBrass);
      sPlate.raycast = () => {};
      sconceGroup.add(sPlate);

      const sArm = new THREE.Mesh(sArmGeo, matBrass);
      sArm.rotation.x = Math.PI / 2;
      sArm.position.set(0, -0.02, 0.06);
      sArm.raycast = () => {};
      sconceGroup.add(sArm);

      const sCup = new THREE.Mesh(sCupGeo, matBrass);
      sCup.position.set(0, 0.04, 0.12);
      sCup.raycast = () => {};
      sconceGroup.add(sCup);

      const sShade = new THREE.Mesh(sShadeGeo, matSconceShade);
      sShade.position.set(0, 0.12, 0.12);
      sShade.raycast = () => {};
      sconceGroup.add(sShade);

      this.group!.add(sconceGroup);

      const sLight = new THREE.PointLight(0xf59e0b, 0.8, 5);
      sLight.position.set(sx, 2.32, -6.15);
      this.group!.add(sLight);
    });

    // Mood Lighting: Grounded Warm Amber Spotlights
    const barSpot = new THREE.SpotLight(0xf59e0b, 3.2, 7, Math.PI / 4, 0.4);
    barSpot.position.set(-1.8, 2.55, 0);
    barSpot.target = barTop;
    barSpot.castShadow = true;
    this.group.add(barSpot);

    const tableSpot = new THREE.SpotLight(0xf59e0b, 2.4, 7, Math.PI / 5, 0.3);
    tableSpot.position.set(-1.4, 3.4, -4.5);
    tableSpot.target = tableTop;
    tableSpot.castShadow = true;
    this.group.add(tableSpot);

    const phoneSpot = new THREE.SpotLight(0xf59e0b, 2.4, 6, Math.PI / 4, 0.35);
    phoneSpot.position.set(2.6, 2.22, -1.34);
    phoneSpot.target = phoneBox;
    this.group.add(phoneSpot);

    // Register Fixtures with LightRigManager for dynamic positioning & live dev tuning
    const lightRig = LightRigManager.getInstance();
    lightRig.register({
      id: 'velvet_bar_spot',
      name: 'Bar Key Spotlight',
      room: 'velvet_lounge',
      type: 'spot',
      light: barSpot,
      target: barTop,
      initialPosition: barSpot.position.clone(),
      initialTarget: barTop.position.clone()
    });

    lightRig.register({
      id: 'velvet_table_spot',
      name: 'Decanter Table Spotlight',
      room: 'velvet_lounge',
      type: 'spot',
      light: tableSpot,
      target: tableTop,
      initialPosition: tableSpot.position.clone(),
      initialTarget: tableTop.position.clone()
    });

    lightRig.register({
      id: 'velvet_phone_spot',
      name: 'Telephone Kiosk Spotlight',
      room: 'velvet_lounge',
      type: 'spot',
      light: phoneSpot,
      target: phoneBox,
      initialPosition: phoneSpot.position.clone(),
      initialTarget: phoneBox.position.clone()
    });

    // Audio Ambiance
    const audio = AudioEngine.getInstance();
    audio.playLoungeJazzTheme();
    audio.playPayphoneMechanicalRing();

    return this.group;
  }

  public teardown(scene: THREE.Scene): void {
    LightRigManager.getInstance().clear('velvet_lounge');

    const audio = AudioEngine.getInstance();
    audio.stopPayphoneRing();
    audio.teardownScenarioAudio();
    this.switchboardScreen.teardown();

    if (this.group) {
      scene.remove(this.group);
      this.group = null;
    }
    this.payphoneMesh = null;
    this.mirrorMesh = null;
    this.decanterMesh = null;
  }

  public onObjectClick(objectId: string): boolean {
    const bus = EventBus.getInstance();
    const audio = AudioEngine.getInstance();

    if (objectId === 'door_return_hub') {
      audio.playDoorHeavy();
      bus.emit('scenario:switch_room', { targetRoomId: 'room_04', doorThresholdId: 'door_portal_velvet_lounge' });
      return true;
    }

    if (objectId === 'prop_switchboard') {
      audio.playSwitchToggle();
      bus.emit('camera:move_to_hotspot', { hotspotId: 'switchboard' });
      this.switchboardScreen.open();
      return true;
    }

    if (objectId === 'prop_switchboard_directory') {
      audio.playPaperRustle();
      bus.emit('camera:move_to_hotspot', { hotspotId: 'switchboard' });
      bus.emit('ui:subtitle_changed', {
        text: 'PBX ROUTING DIRECTORY: "TRUNK 101: Infirmary (SEVERED) | TRUNK 102: Hydrotherapy (OFFLINE) | TRUNK 103: Sound Lab (ISOLATED) | TRUNK 104: Subject 104 Terminal ---> ROUTE TO LINE 4 TO CONNECT OUTSIDE PAYPHONE CIRCUIT."'
      });
      return true;
    }

    if (objectId === 'prop_crystal_decanter' || objectId.includes('mirror')) {
      audio.playGlassClink();
      bus.emit('puzzle:mirror_inspected', {});
      bus.emit('camera:move_to_hotspot', { hotspotId: 'mirror' });
      this.switchboardScreen.open();
      return true;
    }

    if (objectId === 'prop_bar_mirror_glass' || objectId === 'prop_bar_mirror_silhouette') {
      audio.playGlassClink();
      bus.emit('camera:move_to_hotspot', { hotspotId: 'mirror' });
      bus.emit('ui:subtitle_changed', {
        text: 'The gilded mirror reflects a hollow silhouette staring back. Place the crystal decanter to clarify the alignment.'
      });
      return true;
    }

    if (objectId.startsWith('prop_velvet_stool_') || objectId === 'prop_cocktail_table') {
      audio.playTumblerClick();
      return false;
    }

    if (objectId.includes('whiskey') || objectId.includes('bar')) {
      audio.playGlassClink();
      bus.emit('ui:subtitle_changed', {
        text: 'The amber liquid is cold. The ice cubes have long ceased melting. The payphone continues to ring.'
      });
      return true;
    }

    if (objectId.includes('payphone')) {
      const state = this.switchboardScreen.getState();
      if (!state.switchboardPatched || !state.decanterPlaced) {
        audio.playTumblerClick();
        bus.emit('ui:subtitle_changed', {
          text: 'The rotary payphone rings erratically. The circuit is dead until the decanter is placed and the switchboard trunk line is connected.'
        });
        return true;
      }
      if (!this.payphoneAnswered) {
        this.payphoneAnswered = true;

        audio.stopPayphoneRing();
        audio.playHandsetClick();

        if (this.payphoneMesh) {
          this.payphoneMesh.rotation.z = 0.4;
          this.payphoneMesh.position.x -= 0.1;
        }

        bus.emit('ui:subtitle_changed', {
          text: 'You lift the receiver. Total acoustic vacuum. A deadened, familiar voice speaks through the earpiece...'
        });

        audio.speakTerminalMessage(() => {
          bus.emit('ui:subtitle_changed', {
            text: '"The exit is open. The cure is spreading. Thank you for your compliance."'
          });

          audio.play528HzSonicBlast(4.0);

          setTimeout(() => {
            bus.emit('ui:view_changed', { view: 'terminal_blackout' });
          }, 800);
        });
      }
      return true;
    }

    return false;
  }
}
