export type PropSoundType =
  | 'paper_rustle'
  | 'door_heavy'
  | 'door_latch'
  | 'drawer_wood'
  | 'clock_tick'
  | 'pneumatic_hiss'
  | 'glass_clink'
  | 'switch_knife'
  | 'switch_toggle'
  | 'tumbler_click'
  | 'water_drip'
  | 'handset_click';

export interface SoundEffectDefinition {
  id: PropSoundType;
  label: string;
  category: 'paper' | 'door' | 'switch' | 'furniture' | 'clock' | 'fluid' | 'general';
  filename: string;
  defaultVolume: number;
}

export const SOUND_EFFECT_MANIFEST: Record<PropSoundType, SoundEffectDefinition> = {
  paper_rustle: {
    id: 'paper_rustle',
    label: 'Cellulose Dossier Rustle',
    category: 'paper',
    filename: 'paper_rustle.wav',
    defaultVolume: 0.85
  },
  door_heavy: {
    id: 'door_heavy',
    label: 'Steel Blastdoor Unseal',
    category: 'door',
    filename: 'door_heavy.wav',
    defaultVolume: 0.95
  },
  door_latch: {
    id: 'door_latch',
    label: 'Deadbolt Pressure Latch',
    category: 'door',
    filename: 'door_latch.wav',
    defaultVolume: 0.80
  },
  drawer_wood: {
    id: 'drawer_wood',
    label: 'Teak Drawer Slide & Stop',
    category: 'furniture',
    filename: 'drawer_wood.wav',
    defaultVolume: 0.75
  },
  clock_tick: {
    id: 'clock_tick',
    label: 'Synchronous Clock Escapement',
    category: 'clock',
    filename: 'clock_tick.wav',
    defaultVolume: 0.65
  },
  pneumatic_hiss: {
    id: 'pneumatic_hiss',
    label: 'Pneumatic Airlock Exhaust',
    category: 'general',
    filename: 'pneumatic_hiss.wav',
    defaultVolume: 0.75
  },
  glass_clink: {
    id: 'glass_clink',
    label: 'Borosilicate / Crystal Tap',
    category: 'fluid',
    filename: 'glass_clink.wav',
    defaultVolume: 0.70
  },
  switch_knife: {
    id: 'switch_knife',
    label: 'High-Voltage Knife Switch',
    category: 'switch',
    filename: 'switch_knife.wav',
    defaultVolume: 0.90
  },
  switch_toggle: {
    id: 'switch_toggle',
    label: 'Bakelite Toggle Snap',
    category: 'switch',
    filename: 'switch1.wav',
    defaultVolume: 0.70
  },
  tumbler_click: {
    id: 'tumbler_click',
    label: 'Brass Tumbler Detent',
    category: 'switch',
    filename: 'click1.wav',
    defaultVolume: 0.65
  },
  water_drip: {
    id: 'water_drip',
    label: 'Peristaltic Saline Drip',
    category: 'fluid',
    filename: 'rollover1.wav',
    defaultVolume: 0.60
  },
  handset_click: {
    id: 'handset_click',
    label: 'Rotary Cradle Hang-up',
    category: 'general',
    filename: 'mouseclick1.wav',
    defaultVolume: 0.75
  }
};

export interface RoomSoundscapeDefinition {
  roomId: string;
  actTitle: string;
  roomCode: string;
  title: string;
  customTrackFilename: string;
  baseFrequency: number;
  harmonicOffset: number;
  lowpassCutoff: number;
  pulseBpm?: number;
  tensionProfile: 'sterile' | 'somniferous' | 'subterranean' | 'resonant' | 'archival' | 'executive' | 'electrical' | 'noir';
}

export const ROOM_SOUNDSCAPE_MANIFEST: Record<string, RoomSoundscapeDefinition> = {
  room_04: {
    roomId: 'room_04',
    actTitle: 'ACT I',
    roomCode: 'SL4-04-HUB',
    title: 'The Sterile Reception',
    customTrackFilename: 'room_04.mp3',
    baseFrequency: 60.0,
    harmonicOffset: 1.5,
    lowpassCutoff: 160.0,
    tensionProfile: 'sterile'
  },
  sleep_ward: {
    roomId: 'sleep_ward',
    actTitle: 'ACT II',
    roomCode: 'SL4-02-SLP',
    title: 'The Sleep Ward',
    customTrackFilename: 'sleep_ward.mp3',
    baseFrequency: 54.0,
    harmonicOffset: 2.2,
    lowpassCutoff: 140.0,
    pulseBpm: 68.0,
    tensionProfile: 'somniferous'
  },
  hydrotherapy: {
    roomId: 'hydrotherapy',
    actTitle: 'ACT III',
    roomCode: 'SL4-03-HYD',
    title: 'Hydrotherapy Suite',
    customTrackFilename: 'hydrotherapy.mp3',
    baseFrequency: 48.0,
    harmonicOffset: 1.8,
    lowpassCutoff: 180.0,
    tensionProfile: 'subterranean'
  },
  audiology: {
    roomId: 'audiology',
    actTitle: 'ACT IV',
    roomCode: 'SL4-04-AUD',
    title: 'The Audiology Vault',
    customTrackFilename: 'audiology.mp3',
    baseFrequency: 62.0,
    harmonicOffset: 3.5,
    lowpassCutoff: 210.0,
    tensionProfile: 'resonant'
  },
  archive: {
    roomId: 'archive',
    actTitle: 'ACT V',
    roomCode: 'SL4-05-ARC',
    title: 'The Archive',
    customTrackFilename: 'archive.mp3',
    baseFrequency: 45.0,
    harmonicOffset: 1.2,
    lowpassCutoff: 130.0,
    tensionProfile: 'archival'
  },
  directors_office: {
    roomId: 'directors_office',
    actTitle: 'ACT VI',
    roomCode: 'SL4-06-DIR',
    title: "The Director's Office",
    customTrackFilename: 'directors_office.mp3',
    baseFrequency: 52.0,
    harmonicOffset: 2.0,
    lowpassCutoff: 170.0,
    tensionProfile: 'executive'
  },
  synthesis_blackout: {
    roomId: 'synthesis_blackout',
    actTitle: 'ACT VII',
    roomCode: 'SL4-07-SYN',
    title: 'Synthesis Chamber',
    customTrackFilename: 'synthesis.mp3',
    baseFrequency: 50.0,
    harmonicOffset: 4.8,
    lowpassCutoff: 240.0,
    tensionProfile: 'electrical'
  },
  velvet_lounge: {
    roomId: 'velvet_lounge',
    actTitle: 'ACT VIII',
    roomCode: 'SL4-08-VLX',
    title: 'The Velvet Lounge',
    customTrackFilename: 'velvet_lounge.mp3',
    baseFrequency: 43.0,
    harmonicOffset: 2.6,
    lowpassCutoff: 190.0,
    tensionProfile: 'noir'
  }
};
