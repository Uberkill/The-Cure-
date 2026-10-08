import * as THREE from 'three';
import { ProceduralTextures } from '../ProceduralTextures';

export interface Room04MaterialPalette {
  chalkUpperWall: THREE.MeshStandardMaterial;
  ceramicGreenTiles: THREE.MeshStandardMaterial;
  terrazzoFloor: THREE.MeshStandardMaterial;
  brassGold: THREE.MeshStandardMaterial;
  smokedTeak: THREE.MeshStandardMaterial;
  titaniumChassis: THREE.MeshStandardMaterial;
  brushedChrome: THREE.MeshStandardMaterial;
  crimsonEnvelope: THREE.MeshStandardMaterial;
  vintageCream: THREE.MeshStandardMaterial;
  sageAccent: THREE.MeshStandardMaterial;
  glass: THREE.MeshPhysicalMaterial;
  crtScreen: THREE.MeshBasicMaterial;
}

export interface Room04MaterialResult {
  materials: Room04MaterialPalette;
  updateOscilloscope: (freq: number, isResonating: boolean, time: number) => void;
}

export function createRoom04Materials(): Room04MaterialResult {
  const { map: tileMap, bumpMap: tileBump } = ProceduralTextures.createCeramicGreenTiles();
  const terrazzoMap = ProceduralTextures.createTerrazzoFloor();
  const { texture: crtTexture, update: updateOscilloscope } = ProceduralTextures.createOscilloscopeTexture();

  const materials: Room04MaterialPalette = {
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

  return { materials, updateOscilloscope };
}
