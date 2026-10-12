/**
 * Type definitions for The Cure: Room 04 psychological puzzle system.
 * Defines state slices for all eight acts, ensuring deterministic hydration and persistence.
 */

export interface Act01SterileState {
  telephoneAnswered: boolean;
  brassShuntInserted: boolean;
  frequencyHz: number;
  phaseOffsetDeg: number;
  harmonicLocked: boolean;
  knifeSwitchThrown: boolean;
}

export interface Act02SleepWardState {
  uvLightActive: boolean;
  shutterUnlocked: boolean;
  shutterDigits: [number, number, number];
  ivDripBpm: number;
  ivCalibrated: boolean;
  tumblerGlyphs: [string, string, string];
  cartUnlocked: boolean;
}

export interface Act03HydrotherapyState {
  tubWaterLevels: [number, number, number]; // Discrete steps 0..4
  submergedValveOpen: boolean;
  manifoldBalanced: boolean;
}

export interface Act04AudiologyState {
  leftHornAngleDeg: number;
  rightHornAngleDeg: number;
  phaseInverted: boolean;
  carrierFreqHz: number;
  acousticNullAchieved: boolean;
}

export interface Act05ArchiveState {
  microfilmMounted: boolean;
  opticFocusLevel: number;
  dispatchCoordinate: string;
  canisterDelivered: boolean;
}

export interface Act06DirectorState {
  wiretapTapeSpeed: 'normal' | 'half' | 'rewind';
  dialedSequence: string;
  carriageClockTime: string;
  safeUnlatched: boolean;
}

export interface Act07SynthesisState {
  insertedCrystals: string[];
  shuntResistances: [number, number, number, number, number]; // 0..200 Ohms
  gridBalanced: boolean;
}

export interface Act08VelvetLoungeState {
  decanterPlaced: boolean;
  switchboardPatched: boolean;
  payphoneRinging: boolean;
  complianceConfirmed: boolean;
}

export interface CureGameStateSlice {
  act01: Act01SterileState;
  act02: Act02SleepWardState;
  act03: Act03HydrotherapyState;
  act04: Act04AudiologyState;
  act05: Act05ArchiveState;
  act06: Act06DirectorState;
  act07: Act07SynthesisState;
  act08: Act08VelvetLoungeState;
}
