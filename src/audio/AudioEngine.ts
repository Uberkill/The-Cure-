import { EventBus } from '../core/EventBus';
import { Telemetry } from '../core/Telemetry';
import { MechanicalSoundFX, SweepTracker } from './MechanicalSoundFX';
import {
  PropSoundType,
  SOUND_EFFECT_MANIFEST,
  ROOM_SOUNDSCAPE_MANIFEST,
  RoomSoundscapeDefinition
} from './AudioManifest';
import { GameState } from '../core/GameState';
import { GameStage } from '../types';
import { getAssetUrl } from '../utils/assetPath';

const STAGE_ORDER: GameStage[] = Object.values(GameStage);

function getStageTensionMultiplier(stage: GameStage): number {
  const index = STAGE_ORDER.indexOf(stage);
  if (index <= 0) return 0;
  return Math.min(1.0, index / (STAGE_ORDER.length - 1));
}

export class AudioEngine {
  private static instance: AudioEngine;
  private ctx: AudioContext | null = null;
  private telemetry: Telemetry;
  private isUnlocked: boolean = false;

  private masterGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private ambientGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private compressor: DynamicsCompressorNode | null = null;

  private persistedMasterVolume: number = 0.85;
  private persistedSfxVolume: number = 0.85;
  private persistedAmbientVolume: number = 0.75;

  private bufferCache: Map<string, AudioBuffer> = new Map();
  private pendingBufferLoads: Map<string, Promise<AudioBuffer | null>> = new Map();

  private musicElements: [HTMLAudioElement | null, HTMLAudioElement | null] = [null, null];
  private musicSourceNodes: [MediaElementAudioSourceNode | null, MediaElementAudioSourceNode | null] = [null, null];
  private musicChannelGains: [GainNode | null, GainNode | null] = [null, null];
  private activeMusicChannel: 0 | 1 = 0;
  private currentTrackName: string | null = null;

  private activeNodes: Set<{ stop?: () => void; disconnect: () => void }> = new Set();

  private soundscapeOsc1: OscillatorNode | null = null;
  private soundscapeOsc2: OscillatorNode | null = null;
  private soundscapeFilter: BiquadFilterNode | null = null;
  private soundscapeGain: GainNode | null = null;
  private currentRoomSoundscapeId: string | null = null;

  // Legacy procedural nodes
  private droneOscL: OscillatorNode | null = null;
  private droneOscR: OscillatorNode | null = null;
  private droneGain: GainNode | null = null;
  private isDronePlaying: boolean = false;

  private ballastGain: GainNode | null = null;
  private isBallastPlaying: boolean = false;

  private phoneGain: GainNode | null = null;
  private isPhonePlaying: boolean = false;

  private payphoneInterval: number | null = null;
  private jazzInterval: number | null = null;

  // Sweep tracker for tone alignment frequency sweeps
  private sweepTracker: SweepTracker = { osc: null, gain: null };

  private constructor() {
    this.telemetry = Telemetry.getInstance();
    this.setupUnlockListeners();
    this.setupListeners();
    this.setupVisibilityHandler();
  }

  public static getInstance(): AudioEngine {
    if (!AudioEngine.instance) {
      AudioEngine.instance = new AudioEngine();
    }
    return AudioEngine.instance;
  }

  public getAudioContext(): AudioContext | null {
    return this.ctx;
  }

  public getCurrentTrackName(): string | null {
    return this.currentTrackName;
  }

  private isAudioPrimed: boolean = false;

  private primeAudioElements(): void {
    if (this.isAudioPrimed) return;
    this.isAudioPrimed = true;

    for (const audio of this.musicElements) {
      if (audio) {
        audio.muted = true;
        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              audio.pause();
              audio.currentTime = 0;
              audio.muted = false;
            })
            .catch(() => {
              audio.muted = false;
            });
        }
      }
    }
  }

  private setupUnlockListeners(): void {
    const unlock = () => {
      this.ensureContext();
      this.primeAudioElements();
      if (this.ctx && this.ctx.state === 'running') {
        window.removeEventListener('pointerdown', unlock);
        window.removeEventListener('keydown', unlock);
        window.removeEventListener('click', unlock);
      }
    };
    window.addEventListener('pointerdown', unlock);
    window.addEventListener('keydown', unlock);
    window.addEventListener('click', unlock);
  }

  private setupListeners(): void {
    const bus = EventBus.getInstance();

    bus.on('audio:toggle_synth', ({ type, active }) => {
      this.ensureContext();
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      if (type === 'drone') this.toggleDrone(active);
      if (type === 'ballast') this.toggleBallast(active);
      if (type === 'phone') this.togglePhoneTone(active);
    });

    bus.on('audio:play_sfx', ({ sfx, volume }) => {
      this.playPropSound(sfx as PropSoundType, volume);
    });

    bus.on('audio:set_room_soundscape', ({ roomId }) => {
      this.transitionToRoomSoundscape(roomId);
    });

    bus.on('scenario:switch_room', ({ targetRoomId }) => {
      this.transitionToRoomSoundscape(targetRoomId);
    });

    bus.on('game:stage_transition', () => {
      if (this.currentRoomSoundscapeId) {
        this.updateSoundscapeTension();
      }
    });

    bus.on('settings:updated', (settings) => {
      if (settings.masterVolume !== undefined) {
        const val = Math.max(0.0001, Math.min(1.0, settings.masterVolume));
        this.persistedMasterVolume = val;
        if (this.masterGain && this.ctx) {
          this.masterGain.gain.setValueAtTime(val, this.ctx.currentTime);
        }
      }
      if (settings.sfxVolume !== undefined) {
        const val = Math.max(0.0001, Math.min(1.0, settings.sfxVolume));
        this.persistedSfxVolume = val;
        if (this.sfxGain && this.ctx) {
          this.sfxGain.gain.setValueAtTime(val, this.ctx.currentTime);
        }
      }
      if (settings.ambientVolume !== undefined) {
        const val = Math.max(0.0001, Math.min(1.0, settings.ambientVolume));
        this.persistedAmbientVolume = val;
        if (this.ambientGain && this.ctx) {
          this.ambientGain.gain.setValueAtTime(val, this.ctx.currentTime);
        }
      }
    });
  }

  private setupVisibilityHandler(): void {
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && this.ctx && this.ctx.state === 'running') {
        this.ctx.suspend().catch(() => {});
      } else if (!document.hidden && this.ctx && this.ctx.state === 'suspended' && this.isUnlocked) {
        this.ctx.resume().catch(() => {});
      }
    });
  }

  public ensureContext(): boolean {
    if (!this.ctx) {
      try {
        const AudioContextClass =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (!AudioContextClass) {
          return false;
        }

        this.ctx = new AudioContextClass();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(this.persistedMasterVolume, this.ctx.currentTime);

        this.sfxGain = this.ctx.createGain();
        this.sfxGain.gain.setValueAtTime(this.persistedSfxVolume, this.ctx.currentTime);
        this.sfxGain.connect(this.masterGain);

        this.ambientGain = this.ctx.createGain();
        this.ambientGain.gain.setValueAtTime(this.persistedAmbientVolume, this.ctx.currentTime);
        this.ambientGain.connect(this.masterGain);

        this.musicGain = this.ctx.createGain();
        this.musicGain.gain.setValueAtTime(1.0, this.ctx.currentTime);
        this.musicGain.connect(this.ambientGain);

        // DynamicsCompressor: Master brickwall limiter against digital clipping
        this.compressor = this.ctx.createDynamicsCompressor();
        this.compressor.threshold.setValueAtTime(-14, this.ctx.currentTime);
        this.compressor.knee.setValueAtTime(24, this.ctx.currentTime);
        this.compressor.ratio.setValueAtTime(10, this.ctx.currentTime);
        this.compressor.attack.setValueAtTime(0.003, this.ctx.currentTime);
        this.compressor.release.setValueAtTime(0.20, this.ctx.currentTime);

        this.masterGain.connect(this.compressor);
        this.compressor.connect(this.ctx.destination);

        // Pre-create dual channel elements for music crossfading
        this.initMusicChannels();
      } catch (err) {
        this.telemetry.record('warn', `AudioContext initialization failed: ${String(err)}`);
        return false;
      }
    }

    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx
        .resume()
        .then(() => {
          this.isUnlocked = true;
        })
        .catch((err) => {
          this.telemetry.record('warn', `AudioContext resume failed: ${String(err)}`);
        });
    } else if (this.ctx && this.ctx.state === 'running') {
      this.isUnlocked = true;
    }

    return true;
  }

  private initMusicChannels(): void {
    if (!this.ctx || !this.musicGain) return;

    for (let i = 0; i < 2; i++) {
      if (!this.musicElements[i]) {
        const audio = new Audio();
        audio.crossOrigin = 'anonymous';
        audio.loop = true;
        this.musicElements[i] = audio;

        const channelGain = this.ctx.createGain();
        channelGain.gain.setValueAtTime(0, this.ctx.currentTime);
        channelGain.connect(this.musicGain);
        this.musicChannelGains[i] = channelGain;

        if (typeof this.ctx.createMediaElementSource === 'function') {
          try {
            const source = this.ctx.createMediaElementSource(audio);
            source.connect(channelGain);
            this.musicSourceNodes[i] = source;
          } catch (err) {
            this.telemetry.record('warn', `createMediaElementSource failed on channel ${i}: ${String(err)}`);
          }
        }
      }
    }
  }

  // Pre-load and cache audio buffer
  public async loadAudioBuffer(url: string): Promise<AudioBuffer | null> {
    if (this.bufferCache.has(url)) {
      return this.bufferCache.get(url)!;
    }

    if (this.pendingBufferLoads.has(url)) {
      return this.pendingBufferLoads.get(url)!;
    }

    const loadPromise = (async () => {
      try {
        if (!this.ensureContext() || !this.ctx) return null;
        const res = await fetch(url);
        if (!res.ok) return null;
        const arrayBuf = await res.arrayBuffer();
        const decoded = await this.ctx.decodeAudioData(arrayBuf);
        this.bufferCache.set(url, decoded);
        return decoded;
      } catch {
        return null;
      } finally {
        this.pendingBufferLoads.delete(url);
      }
    })();

    this.pendingBufferLoads.set(url, loadPromise);
    return loadPromise;
  }

  public async playPropSound(soundType: PropSoundType, customVolume?: number): Promise<void> {
    if (!this.ensureContext() || !this.ctx || !this.sfxGain) return;

    const def = SOUND_EFFECT_MANIFEST[soundType];
    const volume = customVolume !== undefined ? customVolume : def ? def.defaultVolume : 0.8;
    const filename = def ? def.filename : `${soundType}.wav`;
    const sfxUrl = getAssetUrl(`assets/audio/sfx/${filename}`);

    let buffer = this.bufferCache.get(sfxUrl) || null;
    if (!buffer) {
      buffer = await this.loadAudioBuffer(sfxUrl);
    }

    if (buffer && this.ctx && this.sfxGain) {
      const source = this.ctx.createBufferSource();
      source.buffer = buffer;

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(volume, this.ctx.currentTime);

      source.connect(gain);
      gain.connect(this.sfxGain);

      this.registerActiveNode(source);
      source.start();

      source.onended = () => {
        this.unregisterActiveNode(source);
        try {
          source.disconnect();
          gain.disconnect();
        } catch (err: unknown) {
          void err;
        }
      };
      return;
    }

    // Procedural synthesis fallback
    this.playProceduralFallback(soundType, volume);
  }

  private playProceduralFallback(soundType: PropSoundType, volume: number): void {
    if (!this.ctx || !this.sfxGain) return;

    switch (soundType) {
      case 'paper_rustle':
        MechanicalSoundFX.playPaperRustle(this.ctx, this.sfxGain, volume);
        break;
      case 'door_heavy':
        MechanicalSoundFX.playDoorHeavy(this.ctx, this.sfxGain, volume);
        break;
      case 'door_latch':
        MechanicalSoundFX.playDoorLatch(this.ctx, this.sfxGain, volume);
        break;
      case 'drawer_wood':
        MechanicalSoundFX.playDrawerWood(this.ctx, this.sfxGain, volume);
        break;
      case 'clock_tick':
        MechanicalSoundFX.playClockTick(this.ctx, this.sfxGain, volume);
        break;
      case 'pneumatic_hiss':
        MechanicalSoundFX.playPneumaticHiss(this.ctx, this.sfxGain);
        break;
      case 'glass_clink':
        MechanicalSoundFX.playGlassClink(this.ctx, this.sfxGain, volume);
        break;
      case 'switch_knife':
        MechanicalSoundFX.playSwitchKnife(this.ctx, this.sfxGain, volume);
        break;
      case 'switch_toggle':
        MechanicalSoundFX.playSwitchToggle(this.ctx, this.sfxGain, volume);
        break;
      case 'tumbler_click':
        MechanicalSoundFX.playTumblerClick(this.ctx, this.sfxGain);
        break;
      case 'water_drip':
        MechanicalSoundFX.playWaterDrip(this.ctx, this.sfxGain);
        break;
      case 'handset_click':
        MechanicalSoundFX.playHandsetClick(this.ctx, this.sfxGain);
        break;
      default:
        MechanicalSoundFX.playTumblerClick(this.ctx, this.sfxGain);
        break;
    }
  }

  public async transitionToRoomSoundscape(roomId: string): Promise<void> {
    if (!this.ensureContext() || !this.ctx) return;
    if (this.currentRoomSoundscapeId === roomId) return;

    this.currentRoomSoundscapeId = roomId;
    const def = ROOM_SOUNDSCAPE_MANIFEST[roomId] || ROOM_SOUNDSCAPE_MANIFEST['room_04'];
    const customMp3Url = getAssetUrl(`assets/audio/music/${def.customTrackFilename}`);
    let customFileExists = false;

    try {
      const probeRes = await fetch(customMp3Url, { method: 'HEAD' });
      if (probeRes.ok) {
        customFileExists = true;
      }
    } catch {
      customFileExists = false;
    }

    if (customFileExists) {
      this.stopProceduralSoundscape();
      this.crossfadeToTrack(customMp3Url);
    } else {
      this.stopMusicTracks();
      this.startProceduralSoundscape(def);
    }
  }

  public getCurrentRoomSoundscapeId(): string | null {
    return this.currentRoomSoundscapeId;
  }

  private crossfadeToTrack(trackUrl: string): void {
    if (!this.ctx) return;

    const fromChannel = this.activeMusicChannel;
    const toChannel: 0 | 1 = fromChannel === 0 ? 1 : 0;
    this.activeMusicChannel = toChannel;

    const fromAudio = this.musicElements[fromChannel];
    const fromGain = this.musicChannelGains[fromChannel];
    const toAudio = this.musicElements[toChannel];
    const toGain = this.musicChannelGains[toChannel];

    if (!toAudio || !toGain) return;

    toAudio.src = trackUrl;
    toAudio.play().catch(() => {});

    const now = this.ctx.currentTime;
    toGain.gain.setValueAtTime(0.001, now);
    toGain.gain.linearRampToValueAtTime(1.0, now + 2.0);

    if (fromAudio && fromGain) {
      fromGain.gain.setValueAtTime(fromGain.gain.value, now);
      fromGain.gain.linearRampToValueAtTime(0.001, now + 1.8);

      window.setTimeout(() => {
        fromAudio.pause();
        fromAudio.src = '';
      }, 2000);
    }

    this.currentTrackName = trackUrl;
  }

  private stopMusicTracks(): void {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    for (let i = 0; i < 2; i++) {
      const audio = this.musicElements[i];
      const gain = this.musicChannelGains[i];
      if (audio && gain) {
        gain.gain.setValueAtTime(gain.gain.value, now);
        gain.gain.linearRampToValueAtTime(0.0001, now + 1.2);
        window.setTimeout(() => {
          audio.pause();
          audio.src = '';
        }, 1300);
      }
    }
    this.currentTrackName = null;
  }

  private startProceduralSoundscape(def: RoomSoundscapeDefinition): void {
    if (!this.ctx || !this.ambientGain) return;

    this.stopProceduralSoundscape();

    const now = this.ctx.currentTime;
    const stage = GameState.getInstance().getStage();
    const tensionMult = getStageTensionMultiplier(stage);

    this.soundscapeGain = this.ctx.createGain();
    this.soundscapeGain.gain.setValueAtTime(0.001, now);
    this.soundscapeGain.gain.linearRampToValueAtTime(0.22, now + 2.5);
    this.soundscapeGain.connect(this.ambientGain);

    this.soundscapeFilter = this.ctx.createBiquadFilter();
    this.soundscapeFilter.type = 'lowpass';
    const dynamicCutoff = Math.min(260, def.lowpassCutoff + tensionMult * 40);
    this.soundscapeFilter.frequency.setValueAtTime(dynamicCutoff, now);
    this.soundscapeFilter.connect(this.soundscapeGain);

    this.soundscapeOsc1 = this.ctx.createOscillator();
    this.soundscapeOsc1.type = def.tensionProfile === 'noir' ? 'triangle' : 'sine';
    this.soundscapeOsc1.frequency.setValueAtTime(def.baseFrequency, now);
    this.soundscapeOsc1.connect(this.soundscapeFilter);
    this.soundscapeOsc1.start(now);

    this.soundscapeOsc2 = this.ctx.createOscillator();
    this.soundscapeOsc2.type = 'sine';
    const detune = def.harmonicOffset + tensionMult * 1.2;
    this.soundscapeOsc2.frequency.setValueAtTime(def.baseFrequency + detune, now);
    this.soundscapeOsc2.connect(this.soundscapeFilter);
    this.soundscapeOsc2.start(now);
  }

  public updateSoundscapeTension(): void {
    if (!this.ctx || !this.soundscapeFilter || !this.soundscapeOsc2 || !this.currentRoomSoundscapeId) return;

    const def = ROOM_SOUNDSCAPE_MANIFEST[this.currentRoomSoundscapeId];
    if (!def) return;

    const stage = GameState.getInstance().getStage();
    const tensionMult = getStageTensionMultiplier(stage);
    const now = this.ctx.currentTime;

    const dynamicCutoff = Math.min(260, def.lowpassCutoff + tensionMult * 40);
    this.soundscapeFilter.frequency.exponentialRampToValueAtTime(dynamicCutoff, now + 3.0);

    const detune = def.harmonicOffset + tensionMult * 1.2;
    this.soundscapeOsc2.frequency.exponentialRampToValueAtTime(def.baseFrequency + detune, now + 3.0);
  }

  public stopProceduralSoundscape(): void {
    if (!this.ctx || !this.soundscapeGain) return;

    const now = this.ctx.currentTime;
    this.soundscapeGain.gain.setValueAtTime(this.soundscapeGain.gain.value, now);
    this.soundscapeGain.gain.linearRampToValueAtTime(0.0001, now + 1.2);

    const osc1 = this.soundscapeOsc1;
    const osc2 = this.soundscapeOsc2;
    const filter = this.soundscapeFilter;
    const gain = this.soundscapeGain;

    this.soundscapeOsc1 = null;
    this.soundscapeOsc2 = null;
    this.soundscapeFilter = null;
    this.soundscapeGain = null;

    window.setTimeout(() => {
      try {
        osc1?.stop();
        osc2?.stop();
        osc1?.disconnect();
        osc2?.disconnect();
        filter?.disconnect();
        gain?.disconnect();
      } catch (err: unknown) {
        void err;
      }
    }, 1300);
  }

  public teardownScenarioAudio(): void {
    if (!this.ctx) return;

    if (this.isDronePlaying) {
      this.toggleDrone(false);
    }

    if (this.payphoneInterval !== null) {
      window.clearInterval(this.payphoneInterval);
      this.payphoneInterval = null;
    }

    if (this.jazzInterval !== null) {
      window.clearInterval(this.jazzInterval);
      this.jazzInterval = null;
    }

    if (this.sweepTracker.osc) {
      try {
        this.sweepTracker.osc.stop();
        this.sweepTracker.osc.disconnect();
      } catch (err: unknown) {
        void err;
      }
      this.sweepTracker.osc = null;
      this.sweepTracker.gain = null;
    }

    this.stopProceduralSoundscape();

    for (const node of this.activeNodes) {
      try {
        if (typeof node.stop === 'function') node.stop();
        node.disconnect();
      } catch {
        // Node already terminated
      }
    }
    this.activeNodes.clear();
  }

  public toggleDrone(enable?: boolean): void {
    if (!this.ensureContext() || !this.ctx || !this.masterGain) return;
    const shouldEnable = enable !== undefined ? enable : !this.isDronePlaying;

    if (shouldEnable && !this.isDronePlaying) {
      const now = this.ctx.currentTime;
      this.droneGain = this.ctx.createGain();
      this.droneGain.gain.setValueAtTime(0.001, now);
      this.droneGain.gain.exponentialRampToValueAtTime(0.28, now + 2.0);
      this.droneGain.connect(this.ambientGain || this.masterGain);

      this.droneOscL = this.ctx.createOscillator();
      this.droneOscL.type = 'sine';
      this.droneOscL.frequency.setValueAtTime(45.0, now);

      this.droneOscR = this.ctx.createOscillator();
      this.droneOscR.type = 'sine';
      this.droneOscR.frequency.setValueAtTime(46.5, now);

      this.droneOscL.connect(this.droneGain);
      this.droneOscR.connect(this.droneGain);

      this.droneOscL.start();
      this.droneOscR.start();
      this.isDronePlaying = true;
    } else if (!shouldEnable && this.isDronePlaying && this.droneGain) {
      const now = this.ctx.currentTime;
      this.droneGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.8);
      setTimeout(() => {
        this.droneOscL?.stop();
        this.droneOscR?.stop();
        this.droneOscL?.disconnect();
        this.droneOscR?.disconnect();
        this.droneGain?.disconnect();
        this.isDronePlaying = false;
      }, 850);
    }
  }

  public toggleBallast(enable?: boolean): void {
    if (!this.ensureContext() || !this.ctx || !this.masterGain) return;
    const shouldEnable = enable !== undefined ? enable : !this.isBallastPlaying;

    if (shouldEnable && !this.isBallastPlaying) {
      const now = this.ctx.currentTime;
      this.ballastGain = this.ctx.createGain();
      this.ballastGain.gain.setValueAtTime(0.001, now);
      this.ballastGain.gain.exponentialRampToValueAtTime(0.045, now + 0.6);
      this.ballastGain.connect(this.ambientGain || this.masterGain);

      const osc = this.ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(120, now);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(120, now);
      filter.Q.setValueAtTime(12, now);

      osc.connect(filter);
      filter.connect(this.ballastGain);
      osc.start();
      this.isBallastPlaying = true;
    } else if (!shouldEnable && this.isBallastPlaying && this.ballastGain) {
      const now = this.ctx.currentTime;
      this.ballastGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.5);
      setTimeout(() => {
        this.ballastGain?.disconnect();
        this.isBallastPlaying = false;
      }, 550);
    }
  }

  public togglePhoneTone(enable?: boolean): void {
    if (!this.ensureContext() || !this.ctx || !this.masterGain) return;
    const shouldEnable = enable !== undefined ? enable : !this.isPhonePlaying;

    if (shouldEnable && !this.isPhonePlaying) {
      const now = this.ctx.currentTime;
      this.phoneGain = this.ctx.createGain();
      this.phoneGain.gain.setValueAtTime(0.001, now);
      this.phoneGain.gain.exponentialRampToValueAtTime(0.08, now + 0.4);
      this.phoneGain.connect(this.ambientGain || this.masterGain);

      const osc1 = this.ctx.createOscillator();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(350, now);

      const osc2 = this.ctx.createOscillator();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(440, now);

      osc1.connect(this.phoneGain);
      osc2.connect(this.phoneGain);
      osc1.start();
      osc2.start();
      this.isPhonePlaying = true;
    } else if (!shouldEnable && this.isPhonePlaying && this.phoneGain) {
      const now = this.ctx.currentTime;
      this.phoneGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.3);
      setTimeout(() => {
        this.phoneGain?.disconnect();
        this.isPhonePlaying = false;
      }, 350);
    }
  }

  public playTumblerClick(): void {
    this.playPropSound('tumbler_click');
  }

  public playPneumaticHiss(): void {
    this.playPropSound('pneumatic_hiss');
  }

  public playWaterDrip(): void {
    this.playPropSound('water_drip');
  }

  public playToneAlignmentSweep(freq: number): void {
    if (!this.ensureContext() || !this.ctx || !this.masterGain) return;
    MechanicalSoundFX.playToneAlignmentSweep(this.ctx, this.sfxGain || this.masterGain, freq, this.sweepTracker);
  }

  private registerActiveNode(node: { stop?: () => void; disconnect: () => void }): void {
    this.activeNodes.add(node);
  }

  private unregisterActiveNode(node: { stop?: () => void; disconnect: () => void }): void {
    this.activeNodes.delete(node);
  }

  public playPayphoneMechanicalRing(): void {
    if (!this.ensureContext() || !this.ctx || !this.masterGain) return;

    const ringBurst = () => {
      if (!this.ctx || !this.masterGain) return;
      const now = this.ctx.currentTime;

      // Authentic 1950s dual-gong bell: 850 Hz & 1050 Hz
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc1.type = 'sine';
      osc2.type = 'sine';
      osc1.frequency.setValueAtTime(850, now);
      osc2.frequency.setValueAtTime(1050, now);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.exponentialRampToValueAtTime(0.35, now + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.sfxGain || this.masterGain);

      this.registerActiveNode(osc1);
      this.registerActiveNode(osc2);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 1.25);
      osc2.stop(now + 1.25);

      osc1.onended = () => {
        this.unregisterActiveNode(osc1);
        this.unregisterActiveNode(osc2);
        try {
          osc1.disconnect();
          osc2.disconnect();
          gain.disconnect();
        } catch (err: unknown) {
          void err;
        }
      };
    };

    ringBurst();
    this.payphoneInterval = window.setInterval(ringBurst, 2800);
  }

  public stopPayphoneRing(): void {
    if (this.payphoneInterval !== null) {
      window.clearInterval(this.payphoneInterval);
      this.payphoneInterval = null;
    }
  }

  public playPaperRustle(volume?: number): void {
    this.playPropSound('paper_rustle', volume);
  }

  public playDoorHeavy(volume?: number): void {
    this.playPropSound('door_heavy', volume);
  }

  public playDoorLatch(volume?: number): void {
    this.playPropSound('door_latch', volume);
  }

  public playDrawerWood(volume?: number): void {
    this.playPropSound('drawer_wood', volume);
  }

  public playClockTick(volume?: number): void {
    this.playPropSound('clock_tick', volume);
  }

  public playGlassClink(volume?: number): void {
    this.playPropSound('glass_clink', volume);
  }

  public playSwitchKnife(volume?: number): void {
    this.playPropSound('switch_knife', volume);
  }

  public playSwitchToggle(volume?: number): void {
    this.playPropSound('switch_toggle', volume);
  }

  public playHandsetClick(): void {
    this.playPropSound('handset_click');
  }

  public playLoungeJazzTheme(): void {
    this.transitionToRoomSoundscape('velvet_lounge');
  }

  public speakTerminalMessage(onDone?: () => void): void {
    window.setTimeout(() => {
      if (onDone) onDone();
    }, 3600);
  }

  public play528HzSonicBlast(durationSeconds: number = 4.0): void {
    if (!this.ensureContext() || !this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(528.0, now);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.95, now + 0.05);
    gain.gain.setValueAtTime(0.95, now + durationSeconds - 0.2);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + durationSeconds);

    osc.connect(gain);
    gain.connect(this.masterGain);

    this.registerActiveNode(osc);

    osc.start(now);
    osc.stop(now + durationSeconds);

    osc.onended = () => {
      this.unregisterActiveNode(osc);
      try {
        osc.disconnect();
        gain.disconnect();
      } catch (err: unknown) {
        void err;
      }
    };
  }
}
