import * as THREE from 'three';

export enum GameStage {
  ACT_1_HUB_AWAKEN = 'ACT_1_HUB_AWAKEN',
  ACT_1_HUB_CORRIDOR_OPEN = 'ACT_1_HUB_CORRIDOR_OPEN',
  ACT_2_SLEEP_WARD = 'ACT_2_SLEEP_WARD',
  ACT_2_CRYSTAL_1_RECOVERED = 'ACT_2_CRYSTAL_1_RECOVERED',
  ACT_2_PATCH_1_COMPLETE = 'ACT_2_PATCH_1_COMPLETE',
  ACT_3_HYDROTHERAPY = 'ACT_3_HYDROTHERAPY',
  ACT_3_CRYSTAL_2_RECOVERED = 'ACT_3_CRYSTAL_2_RECOVERED',
  ACT_3_PATCH_2_COMPLETE = 'ACT_3_PATCH_2_COMPLETE',
  ACT_4_AUDIOLOGY = 'ACT_4_AUDIOLOGY',
  ACT_4_CRYSTAL_3_RECOVERED = 'ACT_4_CRYSTAL_3_RECOVERED',
  ACT_4_PATCH_3_COMPLETE = 'ACT_4_PATCH_3_COMPLETE',
  ACT_5_ARCHIVE = 'ACT_5_ARCHIVE',
  ACT_5_CRYSTAL_4_RECOVERED = 'ACT_5_CRYSTAL_4_RECOVERED',
  ACT_5_PATCH_4_COMPLETE = 'ACT_5_PATCH_4_COMPLETE',
  ACT_6_DIRECTORS_OFFICE = 'ACT_6_DIRECTORS_OFFICE',
  ACT_6_CRYSTAL_5_RECOVERED = 'ACT_6_CRYSTAL_5_RECOVERED',
  ACT_7_SYNTHESIS_BLACKOUT = 'ACT_7_SYNTHESIS_BLACKOUT',
  ACT_8_VELVET_LOUNGE = 'ACT_8_VELVET_LOUNGE',
  ACT_8_CONCUSSION_TERMINAL = 'ACT_8_CONCUSSION_TERMINAL'
}

export type CrystalId = 
  | 'crystal_01_quartz' 
  | 'crystal_02_bronze' 
  | 'crystal_03_amethyst' 
  | 'crystal_04_obsidian' 
  | 'crystal_05_celadon';

export type DecayLevel = 0 | 1 | 2 | 3 | 4;

export type ViewState = 'boot' | 'chamber' | 'dossier' | 'crt_patcher' | 'settings' | 'debrief' | 'terminal_blackout';

export interface GameSettings {
  masterVolume: number;
  ambientVolume: number;
  sfxVolume: number;
  mouseParallax: boolean;
  parallaxSensitivity: number;
  crtScanlines: boolean;
  subtitlesEnabled: boolean;
}

export interface CameraPreset {
  name: string;
  position: THREE.Vector3;
  target: THREE.Vector3;
  fov?: number;
}

export interface HotspotAnchor {
  id: string;
  name: string;
  position: THREE.Vector3;
  cameraPreset: CameraPreset;
  interactionPrompt: string;
}

export interface TelemetryRecord {
  timestamp: number;
  level: 'info' | 'warn' | 'error';
  message: string;
  context?: string;
}

export interface AudioLogMetadata {
  id: string;
  actTitle: string;
  dateStr: string;
  speaker: string;
  transcript: string;
}

export interface EventPayloadMap {
  'input:object_clicked': { objectId: string; point?: THREE.Vector3 };
  'input:object_hovered': { objectId: string | null; label: string };
  'game:stage_transition': { from: GameStage; to: GameStage };
  'scenario:switch_room': { targetRoomId: string; doorThresholdId?: string };
  'scenario:room_loaded': { roomId: string; actTitle: string };
  'puzzle:item_collected': { itemId: string };
  'puzzle:crystal_collected': { crystalId: CrystalId; label: string };
  'puzzle:crystal_slotted': { crystalId: CrystalId };
  'puzzle:crt_patch_opened': { crystalId: CrystalId };
  'puzzle:crt_patch_completed': { crystalId: CrystalId; log: AudioLogMetadata };
  'puzzle:rotary_dial_adjusted': { wheelIndex: number; value: number; unlocked: boolean };
  'puzzle:valve_rotated': { valveIndex: number; rotation: number; balanced: boolean };
  'puzzle:tone_aligned': { frequency: number; aligned: boolean };
  'puzzle:drawer_searched': { drawerId: string; foundCrystal: boolean };
  'puzzle:mirror_inspected': Record<string, never>;
  'puzzle:payphone_answered': Record<string, never>;
  'puzzle:key_aligned': { pinExtended: boolean };
  'puzzle:key_inserted': Record<string, never>;
  'puzzle:frequency_changed': { frequency: number; isResonating: boolean };
  'puzzle:switch_thrown': Record<string, never>;
  'camera:move_to_hotspot': { hotspotId: string; durationMs?: number };
  'camera:transition_start': Record<string, never>;
  'camera:transition_end': Record<string, never>;
  'inspect:open': { targetMesh?: THREE.Object3D; itemId?: string; title: string; subtitle: string };
  'inspect:close': Record<string, never>;
  'inventory:add': { itemId: string };
  'ui:inventory_updated': { inventory: string[] };
  'ui:view_changed': { view: ViewState };
  'ui:modal_opened': Record<string, never>;
  'ui:modal_closed': Record<string, never>;
  'ui:subtitle_changed': { text: string };
  'ui:chapter_display': { act: string; title: string; durationMs?: number };
  'audio:toggle_synth': { type: 'drone' | 'ballast' | 'phone'; active: boolean };
  'settings:updated': Partial<GameSettings>;
  'telemetry:log': TelemetryRecord;
  'editor:rebuild_visualizers': Record<string, never>;
  'editor:toggle_visualizers': { visible: boolean };
}

export type EventKey = keyof EventPayloadMap;
export type EventCallback<K extends EventKey> = (payload: EventPayloadMap[K]) => void;

export interface RoomScenario {
  id: string;
  title: string;
  actTitle: string;
  roomCode: string;
  defaultHotspot: string;
  hotspots: Record<string, HotspotAnchor>;
  buildScene(scene: THREE.Scene): Promise<THREE.Group>;
  teardown(scene: THREE.Scene): void;
  onObjectClick?(objectId: string): boolean;
  update?(delta: number): void;
}

export interface TransformData {
  x: number;
  y: number;
  z: number;
  rx: number;
  ry: number;
  rz: number;
  sx: number;
  sy: number;
  sz: number;
  animation?: {
    type: string;
    axis: string;
    start: number;
    end: number;
    trigger?: 'none' | 'click' | 'proximity';
    duration?: number; // in ms
    state?: boolean; // true = at end, false = at start
  };
  custom?: Record<string, any>;
}

export interface PrefabSpawnData {
  id: string;
  type: string;
  transform: TransformData;
}

export interface RoomLayoutData {
  prefabs?: PrefabSpawnData[];
  [meshId: string]: TransformData | PrefabSpawnData[] | undefined;
}
