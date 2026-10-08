import * as THREE from 'three';
import { DecayLevel } from '../types';

export class HubDecayManager {
  private static instance: HubDecayManager;
  private currentLevel: DecayLevel = 0;

  private constructor() {}

  public static getInstance(): HubDecayManager {
    if (!HubDecayManager.instance) {
      HubDecayManager.instance = new HubDecayManager();
    }
    return HubDecayManager.instance;
  }

  public setDecayLevel(level: DecayLevel, hubGroup: THREE.Group): void {
    this.currentLevel = level;

    // Progressive color and roughness shifts
    const decayPalette = [
      { tileTint: 0xffffff, wallColor: 0xedf0eb, roughness: 0.25 }, // 0: Pristine
      { tileTint: 0xdfecd5, wallColor: 0xe0e4dd, roughness: 0.32 }, // 1: Bruising
      { tileTint: 0x8ea285, wallColor: 0xcdd2c9, roughness: 0.45 }, // 2: Seam weeping
      { tileTint: 0x5a6d53, wallColor: 0xb5bcb1, roughness: 0.65 }, // 3: Peeling / rot
      { tileTint: 0x364431, wallColor: 0x939c8e, roughness: 0.85 }  // 4: Total decay
    ];

    const currentPalette = decayPalette[level];

    hubGroup.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        if (child.material instanceof THREE.MeshStandardMaterial) {
          if (child.name === 'wall_green_tiles') {
            child.material.color.setHex(currentPalette.tileTint);
            child.material.roughness = currentPalette.roughness;
          } else if (child.name === 'wall_chalk_upper') {
            child.material.color.setHex(currentPalette.wallColor);
          }
        }
      }
    });
  }

  public getDecayLevel(): DecayLevel {
    return this.currentLevel;
  }
}
