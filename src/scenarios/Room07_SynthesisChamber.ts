import * as THREE from 'three';
import { HotspotAnchor } from '../types';
import { Room04_SterileChamber } from './Room04_SterileChamber';
import { EventBus } from '../core/EventBus';
import { GalvanometerGridScreen } from '../ui/screens/GalvanometerGridScreen';
import { AudioEngine } from '../audio/AudioEngine';
import { GameState } from '../core/GameState';
import { LightRigManager } from '../rendering/LightRigManager';

export class Room07_SynthesisChamber extends Room04_SterileChamber {
  public override id = 'synthesis_blackout';
  public override title = 'The Synthesis Chamber';
  public override actTitle = 'ACT VII • THE SYNTHESIS / EGRESS';
  public override roomCode = 'Airlock Sector 07 • Threshold';
  public override defaultHotspot = 'overview';

  public override hotspots: Record<string, HotspotAnchor> = {
    door: {
      id: 'door',
      name: 'I. The Open Blastdoor Threshold',
      position: new THREE.Vector3(-6.75, 1.6, -3.0),
      interactionPrompt: '[ENTER: VELVET LOUNGE]',
      cameraPreset: {
        name: 'door',
        position: new THREE.Vector3(-3.2, 1.8, -3.0),
        target: new THREE.Vector3(-6.75, 1.8, -3.0)
      }
    },
    overview: {
      id: 'overview',
      name: 'II. Blackout Chamber',
      position: new THREE.Vector3(0, 1.2, 0),
      interactionPrompt: 'Blackout Overview',
      cameraPreset: {
        name: 'overview',
        position: new THREE.Vector3(4.2, 2.6, 4.4),
        target: new THREE.Vector3(0, 0.85, 0)
      }
    },
    vault: {
      id: 'vault',
      name: 'III. Overloaded Apparatus',
      position: new THREE.Vector3(0, 1.25, 0),
      interactionPrompt: '[INSPECT OVERLOADED APPARATUS]',
      cameraPreset: {
        name: 'vault',
        position: new THREE.Vector3(0, 1.35, 1.75),
        target: new THREE.Vector3(0, 1.15, 0)
      }
    },
    grid: {
      id: 'grid',
      name: 'IV. Galvanometer Grid',
      position: new THREE.Vector3(-3.0, 1.4, 0.0),
      interactionPrompt: '[INSPECT POWER BUS]',
      cameraPreset: {
        name: 'grid',
        position: new THREE.Vector3(-1.8, 1.5, 0.0),
        target: new THREE.Vector3(-3.0, 1.4, 0.0)
      }
    },
    corridor: {
      id: 'corridor',
      name: 'V. Sealed Corridor',
      position: new THREE.Vector3(0, 1.8, -6.5),
      interactionPrompt: '[INSPECT SEALED CORRIDOR]',
      cameraPreset: {
        name: 'corridor',
        position: new THREE.Vector3(0, 1.8, -4.0),
        target: new THREE.Vector3(0, 1.8, -6.75)
      }
    }
  };

  private galvanometerScreen: GalvanometerGridScreen = new GalvanometerGridScreen();
  private arcLight: THREE.PointLight | null = null;
  private arcTimerId: number | null = null;
  private arcTimeoutId: number | null = null;
  private schematicTexture: THREE.CanvasTexture | null = null;
  private emergencyBeacons: THREE.PointLight[] = [];

  public override async buildScene(scene: THREE.Scene): Promise<THREE.Group> {
    const group = await super.buildScene(scene);

    if (this.entities) {
      const entities = this.entities;
      // 1. Total facility blackout: kill all standard ambient and directional illumination
      entities.group.traverse((child) => {
        if (child instanceof THREE.Light) {
          child.intensity = 0;
        }
      });

      // 2. Blastdoor & Emergency Status
      this.exitBlownOpen = true;
      (this.entities.doorLed.material as THREE.MeshBasicMaterial).color.setHex(0x4ade80);
      const exitDoor = this.entities.exitDoorPanel;
      exitDoor.position.z = exitDoor.userData.animEnd !== undefined ? exitDoor.userData.animEnd : -4.35;

      this.corridorDoorOpen = false;
      const corridorDoor = this.entities.corridorDoor;
      corridorDoor.rotation.y = 0;
      (this.entities.corridorLed.material as THREE.MeshBasicMaterial).color.setHex(0xef4444);

      // Radial spoke portals: emergency containment lockdown
      if (this.entities.portalLeds) {
        for (const [doorId, led] of Object.entries(this.entities.portalLeds)) {
          if (led && led.material instanceof THREE.MeshBasicMaterial) {
            if (doorId === 'door_portal_velvet_lounge') {
              const isBalanced = this.galvanometerScreen.getState().gridBalanced || GameState.getInstance().isSynthesisComplete();
              led.material.color.setHex(isBalanced ? 0x4ade80 : 0xf59e0b);
            } else {
              led.material.color.setHex(0x8b1e23);
            }
          }
        }
      }

      // Amber spill light through the partially opened exit blastdoor
      const exitGlow = new THREE.PointLight(0xf59e0b, 3.8, 14);
      exitGlow.position.set(-6.6, 1.8, -3.0);
      exitGlow.name = 'amber_exit_spill_light';
      this.entities.group.add(exitGlow);

      // 3. Overloaded Specimen Cathode Core Discharge
      if (this.entities.specimenCore) {
        (this.entities.specimenCore.material as THREE.MeshStandardMaterial).emissive.setHex(0x4ade80);
        (this.entities.specimenCore.material as THREE.MeshStandardMaterial).emissiveIntensity = 2.4;

        const coreAura = new THREE.PointLight(0x4ade80, 2.2, 5);
        coreAura.position.copy(this.entities.specimenCore.position);
        coreAura.name = 'mesh_cathode_discharge_light';
        this.entities.vaultGroup.add(coreAura);

        const fluxRingGeo = new THREE.TorusGeometry(0.24, 0.012, 8, 24);
        fluxRingGeo.computeBoundingBox();
        const fluxRing = new THREE.Mesh(
          fluxRingGeo,
          new THREE.MeshBasicMaterial({ color: 0x86efac })
        );
        fluxRing.position.copy(this.entities.specimenCore.position);
        fluxRing.rotation.x = Math.PI / 3;
        fluxRing.raycast = () => {};
        fluxRing.userData.isSubPart = true;
        this.entities.vaultGroup.add(fluxRing);
      }

      // 4. Industrial 5-Channel Galvanometer Grid Substation Bay
      const gridConsole = new THREE.Group();
      gridConsole.position.set(-3.2, 1.4, 0.0);
      gridConsole.rotation.y = Math.PI / 2;
      gridConsole.name = 'prop_galvanometer_grid';
      gridConsole.userData.interactionPrompt = '[INSPECT: POWER BUS GALVANOMETER]';

      // Primary Substation Switchgear Cabinet
      const panelGeo = new THREE.BoxGeometry(2.1, 1.45, 0.35);
      panelGeo.computeBoundingBox();
      const panelMesh = new THREE.Mesh(
        panelGeo,
        new THREE.MeshStandardMaterial({ color: 0x161e1a, roughness: 0.55, metalness: 0.65 })
      );
      panelMesh.castShadow = true;
      gridConsole.add(panelMesh);

      // Floor-to-Ceiling Structural Steel Stanchions
      const matStanchion = new THREE.MeshStandardMaterial({ color: 0x0f1713, roughness: 0.7, metalness: 0.8 });
      [-1.05, 1.05].forEach((sx) => {
        const colGeo = new THREE.BoxGeometry(0.12, 3.6, 0.16);
        colGeo.computeBoundingBox();
        const colMesh = new THREE.Mesh(colGeo, matStanchion);
        colMesh.position.set(sx, 0.4, -0.05);
        colMesh.raycast = () => {};
        colMesh.userData.isSubPart = true;
        gridConsole.add(colMesh);

        const baseGeo = new THREE.BoxGeometry(0.24, 0.08, 0.28);
        baseGeo.computeBoundingBox();
        const basePlate = new THREE.Mesh(baseGeo, matStanchion);
        basePlate.position.set(sx, -1.36, -0.05);
        basePlate.raycast = () => {};
        basePlate.userData.isSubPart = true;
        gridConsole.add(basePlate);

        const ceilingBracketGeo = new THREE.BoxGeometry(0.24, 0.08, 0.28);
        ceilingBracketGeo.computeBoundingBox();
        const ceilingBracket = new THREE.Mesh(ceilingBracketGeo, matStanchion);
        ceilingBracket.position.set(sx, 2.16, -0.05);
        ceilingBracket.raycast = () => {};
        ceilingBracket.userData.isSubPart = true;
        gridConsole.add(ceilingBracket);
      });

      // Top High-Voltage Ceramic Busbar Standoff Insulators
      const matCeramic = new THREE.MeshStandardMaterial({ color: 0xa35a38, roughness: 0.35, metalness: 0.1 });
      const matBrassTerminal = new THREE.MeshStandardMaterial({ color: 0xc28833, metalness: 0.85, roughness: 0.25 });

      [-0.72, -0.36, 0.0, 0.36, 0.72].forEach((mx) => {
        const insGeo = new THREE.CylinderGeometry(0.035, 0.035, 0.14, 12);
        insGeo.computeBoundingBox();
        const insulator = new THREE.Mesh(insGeo, matCeramic);
        insulator.position.set(mx, 0.62, 0.18);
        insulator.raycast = () => {};
        insulator.userData.isSubPart = true;
        gridConsole.add(insulator);

        const nutGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.04, 6);
        nutGeo.computeBoundingBox();
        const nutMesh = new THREE.Mesh(nutGeo, matBrassTerminal);
        nutMesh.position.set(mx, 0.71, 0.18);
        nutMesh.raycast = () => {};
        nutMesh.userData.isSubPart = true;
        gridConsole.add(nutMesh);
      });

      // 5 Analog Galvanometer Needle Meter Bays & Shunt Tracks
      const matMeterFace = new THREE.MeshBasicMaterial({ color: 0x86efac });
      const matMeterBezel = new THREE.MeshStandardMaterial({ color: 0xc28833, metalness: 0.85, roughness: 0.25 });

      [-0.72, -0.36, 0.0, 0.36, 0.72].forEach((mx) => {
        const meterCaseGeo = new THREE.BoxGeometry(0.26, 0.22, 0.04);
        meterCaseGeo.computeBoundingBox();
        const meterCase = new THREE.Mesh(meterCaseGeo, matMeterBezel);
        meterCase.position.set(mx, 0.32, 0.19);
        meterCase.raycast = () => {};
        meterCase.userData.isSubPart = true;
        gridConsole.add(meterCase);

        const scaleGeo = new THREE.PlaneGeometry(0.22, 0.16);
        scaleGeo.computeBoundingBox();
        const meterScale = new THREE.Mesh(scaleGeo, matMeterFace);
        meterScale.position.set(mx, 0.32, 0.212);
        meterScale.raycast = () => {};
        meterScale.userData.isSubPart = true;
        gridConsole.add(meterScale);

        const needleGeo = new THREE.BoxGeometry(0.006, 0.12, 0.002);
        needleGeo.computeBoundingBox();
        const needle = new THREE.Mesh(needleGeo, new THREE.MeshBasicMaterial({ color: 0x0a0f0d }));
        needle.position.set(mx, 0.30, 0.214);
        needle.raycast = () => {};
        needle.userData.isSubPart = true;
        gridConsole.add(needle);

        const trackGeo = new THREE.BoxGeometry(0.04, 0.32, 0.02);
        trackGeo.computeBoundingBox();
        const sliderTrack = new THREE.Mesh(
          trackGeo,
          new THREE.MeshStandardMaterial({ color: 0x080b09, roughness: 0.8 })
        );
        sliderTrack.position.set(mx, -0.05, 0.19);
        sliderTrack.raycast = () => {};
        sliderTrack.userData.isSubPart = true;
        gridConsole.add(sliderTrack);

        const knobGeo = new THREE.BoxGeometry(0.08, 0.04, 0.03);
        knobGeo.computeBoundingBox();
        const sliderKnob = new THREE.Mesh(knobGeo, matMeterBezel);
        sliderKnob.position.set(mx, -0.05, 0.205);
        sliderKnob.raycast = () => {};
        sliderKnob.userData.isSubPart = true;
        gridConsole.add(sliderKnob);
      });

      // Master Circuit Breaker Box & Bus Lever
      const breakerGeo = new THREE.BoxGeometry(0.22, 0.26, 0.08);
      breakerGeo.computeBoundingBox();
      const breakerBox = new THREE.Mesh(
        breakerGeo,
        new THREE.MeshStandardMaterial({ color: 0x991b1b, roughness: 0.4 })
      );
      breakerBox.position.set(0.82, 0.32, 0.21);
      breakerBox.raycast = () => {};
      breakerBox.userData.isSubPart = true;
      gridConsole.add(breakerBox);

      const leverGeo = new THREE.BoxGeometry(0.65, 0.09, 0.09);
      leverGeo.computeBoundingBox();
      const busLever = new THREE.Mesh(
        leverGeo,
        new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.3, metalness: 0.6 })
      );
      busLever.position.set(0, -0.42, 0.22);
      busLever.raycast = () => {};
      busLever.userData.isSubPart = true;
      gridConsole.add(busLever);

      this.entities.group.add(gridConsole);

      // Contact shadow plane under substation switchgear cabinet
      const gridAO = new THREE.Mesh(
        new THREE.PlaneGeometry(1.6, 2.4),
        new THREE.MeshBasicMaterial({ color: 0x050a07, transparent: true, opacity: 0.45, depthWrite: false })
      );
      gridAO.rotation.x = -Math.PI / 2;
      gridAO.position.set(-3.2, 0.003, 0.0);
      gridAO.raycast = () => {};
      this.entities.group.add(gridAO);

      // 5. Heavy Copper Power Conduit Runs (from central cathode to substation bay)
      const busbarGeo = new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3([
          new THREE.Vector3(-3.2, 0.75, 0.0),
          new THREE.Vector3(-2.2, 0.12, 0.0),
          new THREE.Vector3(-1.0, 0.12, 0.0),
          new THREE.Vector3(0.0, 0.35, 0.0)
        ]),
        32, 0.065, 10, false
      );
      busbarGeo.computeBoundingBox();
      const busbar = new THREE.Mesh(
        busbarGeo,
        new THREE.MeshStandardMaterial({ color: 0xb45309, metalness: 0.85, roughness: 0.25 })
      );
      busbar.raycast = () => {};
      busbar.userData.isSubPart = true;
      this.entities.group.add(busbar);

      // Floor Saddle Clamps
      const matClamp = new THREE.MeshStandardMaterial({ color: 0x1f2937, metalness: 0.7, roughness: 0.4 });
      [-0.9, -2.1].forEach((cx) => {
        const clampGeo = new THREE.BoxGeometry(0.14, 0.14, 0.18);
        clampGeo.computeBoundingBox();
        const clamp = new THREE.Mesh(clampGeo, matClamp);
        clamp.position.set(cx, 0.07, 0.0);
        clamp.raycast = () => {};
        clamp.userData.isSubPart = true;
        entities.group.add(clamp);
      });

      // 6. Wall-Mounted High-Voltage Power Bus Blueprint Schematic
      const schematicGroup = new THREE.Group();
      schematicGroup.position.set(-3.2, 1.8, -1.6);
      schematicGroup.rotation.y = Math.PI / 2;
      schematicGroup.name = 'prop_bus_schematic';
      schematicGroup.userData.interactionPrompt = '[INSPECT: BUS SCHEMATIC]';

      const schematicFrameGeo = new THREE.BoxGeometry(1.05, 0.78, 0.04);
      schematicFrameGeo.computeBoundingBox();
      const schematicFrame = new THREE.Mesh(
        schematicFrameGeo,
        new THREE.MeshStandardMaterial({ color: 0x1e2924, metalness: 0.8, roughness: 0.3 })
      );
      schematicGroup.add(schematicFrame);

      this.schematicTexture = this.createSchematicTexture();
      const schematicPaperGeo = new THREE.PlaneGeometry(0.98, 0.70);
      schematicPaperGeo.computeBoundingBox();
      const schematicPaper = new THREE.Mesh(
        schematicPaperGeo,
        new THREE.MeshStandardMaterial({ map: this.schematicTexture, roughness: 0.85 })
      );
      schematicPaper.position.z = 0.024;
      schematicGroup.add(schematicPaper);

      this.entities.group.add(schematicGroup);

      // 7. Disaster Storytelling: Fractured Ceiling Tiles & Debris
      const matDebrisTile = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.85 });
      const matPlasterChunk = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.9 });
      const debrisOffsets = [
        { x: -1.2, z: 0.4, w: 0.42, h: 0.36, r: 0.3 },
        { x: -2.0, z: -0.8, w: 0.38, h: 0.48, r: 1.1 },
        { x: -0.6, z: -1.2, w: 0.45, h: 0.32, r: 2.2 },
        { x: 0.8, z: 0.9, w: 0.36, h: 0.36, r: 0.8 },
        { x: 1.4, z: -0.6, w: 0.48, h: 0.40, r: 1.7 },
        { x: -2.4, z: 1.1, w: 0.32, h: 0.44, r: 0.5 },
        { x: 0.3, z: 1.6, w: 0.40, h: 0.34, r: 2.8 },
        { x: -1.5, z: -1.8, w: 0.35, h: 0.35, r: 1.4 },
        { x: 1.8, z: 1.2, w: 0.44, h: 0.38, r: 0.9 },
        { x: -0.2, z: -2.0, w: 0.36, h: 0.42, r: 2.1 }
      ];

      debrisOffsets.forEach((d, idx) => {
        const dGeo = new THREE.BoxGeometry(d.w, 0.025, d.h);
        dGeo.computeBoundingBox();
        const debrisMesh = new THREE.Mesh(dGeo, idx % 2 === 0 ? matDebrisTile : matPlasterChunk);
        debrisMesh.position.set(d.x, 0.013, d.z);
        debrisMesh.rotation.y = d.r;
        debrisMesh.raycast = () => {};
        debrisMesh.userData.isSubPart = true;
        entities.group.add(debrisMesh);
      });

      // Severed Overhead Conduits Dangling from Ceiling
      const matFlexConduit = new THREE.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.7 });
      const matCopperWire = new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.9, roughness: 0.25 });
      const matConduitCollar = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.8, roughness: 0.3 });

      const conduit1Geo = new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3([
          new THREE.Vector3(-1.8, 3.6, -1.2),
          new THREE.Vector3(-1.8, 3.1, -1.2),
          new THREE.Vector3(-1.75, 2.6, -1.15)
        ]),
        12, 0.035, 8, false
      );
      conduit1Geo.computeBoundingBox();
      const conduit1 = new THREE.Mesh(conduit1Geo, matFlexConduit);
      conduit1.raycast = () => {};
      conduit1.userData.isSubPart = true;
      this.entities.group.add(conduit1);

      // Conduit 1 Terminating Collar & Exposed Frayed Copper Wires
      const collar1 = new THREE.Mesh(new THREE.CylinderGeometry(0.046, 0.046, 0.05, 12), matConduitCollar);
      collar1.position.set(-1.75, 2.60, -1.15);
      collar1.raycast = () => {};
      collar1.userData.isSubPart = true;
      this.entities.group.add(collar1);

      [
        [-0.015, -0.05, 0.012],
        [0.018, -0.045, -0.01],
        [-0.012, -0.065, -0.014],
        [0.014, -0.055, 0.018]
      ].forEach(([wx, wy, wz]) => {
        const wire = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.003, 0.07, 6), matCopperWire);
        wire.position.set(-1.75 + wx, 2.58 + wy, -1.15 + wz);
        wire.rotation.z = wx * 8;
        wire.rotation.x = wz * 8;
        wire.raycast = () => {};
        wire.userData.isSubPart = true;
        entities.group.add(wire);
      });

      // Emissive High-Voltage Arc Spark Node
      const sparkNode = new THREE.Mesh(
        new THREE.SphereGeometry(0.022, 8, 8),
        new THREE.MeshBasicMaterial({ color: 0x67e8f9 })
      );
      sparkNode.position.set(-1.75, 2.52, -1.15);
      sparkNode.raycast = () => {};
      sparkNode.userData.isSubPart = true;
      this.entities.group.add(sparkNode);

      const conduit2Geo = new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3([
          new THREE.Vector3(1.4, 3.6, -1.6),
          new THREE.Vector3(1.4, 3.2, -1.55),
          new THREE.Vector3(1.45, 2.7, -1.5)
        ]),
        12, 0.03, 8, false
      );
      conduit2Geo.computeBoundingBox();
      const conduit2 = new THREE.Mesh(conduit2Geo, matFlexConduit);
      conduit2.raycast = () => {};
      conduit2.userData.isSubPart = true;
      this.entities.group.add(conduit2);

      const collar2 = new THREE.Mesh(new THREE.CylinderGeometry(0.040, 0.040, 0.04, 12), matConduitCollar);
      collar2.position.set(1.45, 2.70, -1.5);
      collar2.raycast = () => {};
      collar2.userData.isSubPart = true;
      this.entities.group.add(collar2);

      [
        [-0.01, -0.04, 0.01],
        [0.012, -0.045, -0.01]
      ].forEach(([wx, wy, wz]) => {
        const wire = new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.003, 0.05, 6), matCopperWire);
        wire.position.set(1.45 + wx, 2.68 + wy, -1.5 + wz);
        wire.raycast = () => {};
        wire.userData.isSubPart = true;
        entities.group.add(wire);
      });

      // Subtle Electrical Arc Flicker Light at severed conduit
      const arcLight = new THREE.PointLight(0x67e8f9, 0, 8);
      arcLight.position.set(-1.75, 2.52, -1.15);
      arcLight.name = 'light_electrical_arc_flicker';
      this.entities.group.add(arcLight);
      this.arcLight = arcLight;

      LightRigManager.getInstance().register({
        id: 'room07_arc_light',
        name: 'Synthesis Chamber Arc Spark Light',
        room: 'synthesis_blackout',
        type: 'point',
        light: arcLight,
        initialPosition: arcLight.position.clone()
      });

      // Wall-Mounted Industrial Emergency Bulkhead Beacons
      const matBeaconGuard = new THREE.MeshStandardMaterial({ color: 0x111827, metalness: 0.8, roughness: 0.4 });
      const matBeaconLens = new THREE.MeshStandardMaterial({
        color: 0xd97706,
        emissive: 0xb45309,
        emissiveIntensity: 0.85,
        roughness: 0.25
      });

      [
        { pos: new THREE.Vector3(3.2, 2.2, 1.8), rotY: -Math.PI / 3 },
        { pos: new THREE.Vector3(-1.8, 2.2, 3.4), rotY: Math.PI / 4 }
      ].forEach(({ pos, rotY }, bIdx) => {
        const bGroup = new THREE.Group();
        bGroup.position.copy(pos);
        bGroup.rotation.y = rotY;
        bGroup.raycast = () => {};
        bGroup.userData.isSubPart = true;

        const bPlate = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.28, 0.05), matBeaconGuard);
        bPlate.raycast = () => {};
        bGroup.add(bPlate);

        const bDome = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.075, 0.16, 12), matBeaconLens);
        bDome.position.z = 0.09;
        bDome.rotation.x = Math.PI / 2;
        bDome.raycast = () => {};
        bGroup.add(bDome);

        const bGuardRing = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.008, 6, 16), matBeaconGuard);
        bGuardRing.position.z = 0.12;
        bGuardRing.raycast = () => {};
        bGroup.add(bGuardRing);

        entities.group.add(bGroup);

        const bLight = new THREE.PointLight(0xd97706, 0.65, 5);
        bLight.position.copy(pos);
        entities.group.add(bLight);
        this.emergencyBeacons.push(bLight);

        LightRigManager.getInstance().register({
          id: `room07_beacon_${bIdx + 1}`,
          name: `Synthesis Emergency Beacon ${bIdx + 1}`,
          room: 'synthesis_blackout',
          type: 'point',
          light: bLight,
          initialPosition: bLight.position.clone()
        });
      });

      const triggerArc = () => {
        if (!this.arcLight) return;
        this.arcLight.intensity = 2.4;
        this.arcTimeoutId = window.setTimeout(() => {
          if (this.arcLight) this.arcLight.intensity = 0;
          this.arcTimeoutId = window.setTimeout(() => {
            if (this.arcLight) this.arcLight.intensity = 1.8;
            this.arcTimeoutId = window.setTimeout(() => {
              if (this.arcLight) this.arcLight.intensity = 0;
            }, 60);
          }, 80);
        }, 50);
      };

      this.arcTimerId = window.setInterval(() => {
        triggerArc();
      }, 3500);
    }

    if (GameState.getInstance().isSynthesisComplete()) {
      this.galvanometerScreen.hydrate({
        insertedCrystals: ['crystal_01_quartz', 'crystal_02_bronze', 'crystal_03_amethyst', 'crystal_04_obsidian', 'crystal_05_celadon'],
        shuntResistances: [100, 100, 100, 100, 100],
        gridBalanced: true
      });
    }

    return group;
  }

  private createSchematicTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 768;
    const ctx = canvas.getContext('2d');
    if (!ctx) return new THREE.CanvasTexture(canvas);

    // Deep cyan blueprint background
    ctx.fillStyle = '#0b1d2e';
    ctx.fillRect(0, 0, 1024, 768);

    // Technical grid lines
    ctx.strokeStyle = '#163652';
    ctx.lineWidth = 1;
    for (let x = 0; x < 1024; x += 32) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 768);
      ctx.stroke();
    }
    for (let y = 0; y < 768; y += 32) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(1024, y);
      ctx.stroke();
    }

    // Border frames
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 3;
    ctx.strokeRect(24, 24, 976, 720);
    ctx.lineWidth = 1;
    ctx.strokeRect(30, 30, 964, 708);

    // Blueprint title header
    ctx.fillStyle = '#bae6fd';
    ctx.font = 'bold 24px "Courier New", monospace';
    ctx.fillText('FACILITY PRIMARY POWER BUS DISTRIBUTION // SUB-LEVEL 04', 50, 72);
    ctx.font = '15px "Courier New", monospace';
    ctx.fillStyle = '#7dd3fc';
    ctx.fillText('SCHEMATIC REF: DWG-SL4-07-SYN // 5-CHANNEL TRANSDUCER SHUNT MATRIX', 50, 100);

    // Header divider
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(50, 118);
    ctx.lineTo(974, 118);
    ctx.stroke();

    // 5 Channel circuit diagrams
    const channels = [
      { name: 'CH-01: SLEEP WARD (QUARTZ)', target: '100 OHMS' },
      { name: 'CH-02: HYDROTHERAPY (BRONZE)', target: '100 OHMS' },
      { name: 'CH-03: AUDIOLOGY (AMETHYST)', target: '100 OHMS' },
      { name: 'CH-04: ARCHIVE (OBSIDIAN)', target: '100 OHMS' },
      { name: 'CH-05: DIRECTORATE (CELADON)', target: '100 OHMS' }
    ];

    channels.forEach((ch, idx) => {
      const y = 168 + idx * 78;

      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(70, y);
      ctx.lineTo(210, y);
      ctx.stroke();

      // Shunt resistor symbol
      ctx.strokeStyle = '#e0f2fe';
      ctx.strokeRect(210, y - 16, 120, 32);
      ctx.fillStyle = '#075985';
      ctx.fillRect(211, y - 15, 118, 30);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 13px "Courier New", monospace';
      ctx.fillText('R-SHUNT', 238, y + 5);

      // Galvanometer loop
      ctx.strokeStyle = '#38bdf8';
      ctx.beginPath();
      ctx.moveTo(330, y);
      ctx.lineTo(430, y);
      ctx.arc(455, y, 24, Math.PI, -Math.PI);
      ctx.moveTo(480, y);
      ctx.lineTo(580, y);
      ctx.stroke();

      // Galvanometer "G" glyph
      ctx.fillStyle = '#4ade80';
      ctx.font = 'bold 18px "Courier New", monospace';
      ctx.fillText('G', 448, y + 6);

      // Channel title and specification
      ctx.fillStyle = '#e0f2fe';
      ctx.font = '14px "Courier New", monospace';
      ctx.fillText(ch.name, 600, y - 4);
      ctx.fillStyle = '#4ade80';
      ctx.font = 'bold 14px "Courier New", monospace';
      ctx.fillText(`NOMINAL LOAD: ${ch.target} (0 mA DEFLECTION)`, 600, y + 16);
    });

    // Specifications & Interlock rules box
    ctx.fillStyle = '#0c4a6e';
    ctx.fillRect(50, 580, 924, 138);
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2;
    ctx.strokeRect(50, 580, 924, 138);

    ctx.fillStyle = '#fef08a';
    ctx.font = 'bold 17px "Courier New", monospace';
    ctx.fillText('CALIBRATION SPECIFICATION & INTERLOCK PROTOCOL:', 70, 614);
    ctx.fillStyle = '#ffffff';
    ctx.font = '14px "Courier New", monospace';
    ctx.fillText('1. NOMINAL BALANCED LOAD: 100 OHMS PER CHANNEL ACROSS ALL 5 KNIFE SHUNTS.', 70, 642);
    ctx.fillText('2. MASTER BREAKER TRIP THRESHOLD: 200 OHMS MAXIMUM LOAD DIFFERENTIAL PER CHANNEL.', 70, 666);
    ctx.fillText('3. HYDRAULIC EGRESS INTERLOCK: DISENGAGES BLAST CLAMPS UPON 5-CHANNEL EQUILIBRIUM.', 70, 690);

    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    return tex;
  }

  public override teardown(scene: THREE.Scene): void {
    if (this.arcTimerId !== null) {
      clearInterval(this.arcTimerId);
      this.arcTimerId = null;
    }
    if (this.arcTimeoutId !== null) {
      clearTimeout(this.arcTimeoutId);
      this.arcTimeoutId = null;
    }
    if (this.arcLight) {
      this.arcLight.dispose();
      this.arcLight = null;
    }
    this.emergencyBeacons.forEach((b) => b.dispose());
    this.emergencyBeacons = [];
    if (this.schematicTexture) {
      this.schematicTexture.dispose();
      this.schematicTexture = null;
    }
    this.galvanometerScreen.teardown();
    LightRigManager.getInstance().clear('synthesis_blackout');
    super.teardown(scene);
  }

  public override onObjectClick(objectId: string): boolean {
    const bus = EventBus.getInstance();
    const audio = AudioEngine.getInstance();

    if (objectId === 'prop_door' || objectId === 'exit_airlock_passage') {
      if (this.galvanometerScreen.getState().gridBalanced || GameState.getInstance().isSynthesisComplete()) {
        audio.playDoorHeavy();
        bus.emit('scenario:switch_room', { targetRoomId: 'velvet_lounge' });
      } else {
        bus.emit('ui:subtitle_changed', {
          text: 'The heavy blastdoor is electromagnetically locked. The galvanometer circuit bus remains unbalanced.'
        });
      }
      return true;
    }

    if (objectId === 'door_portal_velvet_lounge') {
      if (this.galvanometerScreen.getState().gridBalanced || GameState.getInstance().isSynthesisComplete()) {
        audio.playDoorHeavy();
        bus.emit('scenario:switch_room', { targetRoomId: 'velvet_lounge', doorThresholdId: 'door_portal_velvet_lounge' });
      } else {
        bus.emit('ui:subtitle_changed', {
          text: 'Velvet Lounge blastdoor electromagnetically clamped. The galvanometer circuit bus remains unbalanced.'
        });
      }
      return true;
    }

    // Intercept spoke portals during blackout to prevent breaking emergency containment
    if (
      objectId === 'door_portal_sleep_ward' ||
      objectId === 'door_portal_hydrotherapy' ||
      objectId === 'door_portal_audiology' ||
      objectId === 'door_portal_archive' ||
      objectId === 'door_portal_directors_office' ||
      objectId === 'door_portal_synthesis'
    ) {
      audio.playDoorLatch();
      bus.emit('ui:subtitle_changed', {
        text: 'EMERGENCY CONTAINMENT INTERLOCK // Sector blast bulkheads sealed under atmospheric containment protocol. Balance power bus at galvanometer grid.'
      });
      return true;
    }

    if (objectId === 'prop_bus_schematic') {
      audio.playPaperRustle();
      bus.emit('camera:move_to_hotspot', { hotspotId: 'grid' });
      bus.emit('ui:subtitle_changed', {
        text: 'POWER BUS SCHEMATIC // SUB-LEVEL 04: "Nominal operating load: 100 OHMS per channel across all 5 shunt channels. Breaker trip calibrated at 200 OHMS total differential imbalance. Balance all channels to 100 OHMS to unseal emergency egress."'
      });
      return true;
    }

    if (objectId === 'prop_galvanometer_grid') {
      if (this.galvanometerScreen.getState().gridBalanced || GameState.getInstance().isSynthesisComplete()) {
        bus.emit('camera:move_to_hotspot', { hotspotId: 'grid' });
        bus.emit('ui:subtitle_changed', {
          text: 'The 5-channel circuit bus is balanced at 100 Ohms. Hydraulic blast clamps released.'
        });
        return true;
      }
      audio.playSwitchKnife();
      bus.emit('camera:move_to_hotspot', { hotspotId: 'grid' });
      this.galvanometerScreen.open();
      return true;
    }

    if (objectId === 'door_corridor' || objectId === 'door_corridor_passage') {
      bus.emit('ui:subtitle_changed', {
        text: 'The observation corridor behind you has collapsed under containment pressure. Egress through the unsealed blastdoor.'
      });
      return true;
    }

    if (objectId === 'prop_vault' || objectId === 'prop_oscilloscope') {
      bus.emit('camera:move_to_hotspot', { hotspotId: 'vault' });
      bus.emit('ui:subtitle_changed', {
        text: 'All 5 mnemonic crystals have merged in the cathode core. Synthesis complete. The facility is venting atmosphere.'
      });
      return true;
    }

    if (objectId === 'prop_telephone') {
      bus.emit('camera:move_to_hotspot', { hotspotId: 'telephone' });
      bus.emit('ui:subtitle_changed', {
        text: 'The receiver emits only faint, rhythmic wet breathing against the microphone.'
      });
      return true;
    }

    return super.onObjectClick(objectId);
  }
}
