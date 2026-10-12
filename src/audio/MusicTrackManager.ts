import { Telemetry } from '../core/Telemetry';
import { AudioEngine } from './AudioEngine';
import { EventBus } from '../core/EventBus';

export class MusicTrackManager {
  private static instance: MusicTrackManager;
  private currentAudio: HTMLAudioElement | null = null;
  private currentTrackName: string | null = null;
  private telemetry: Telemetry;
  private audioEngine: AudioEngine;
  private volume: number = 0.5;
  private fadeOutTimer: number | null = null;
  private fadeInTimer: number | null = null;

  private constructor() {
    this.telemetry = Telemetry.getInstance();
    this.audioEngine = AudioEngine.getInstance();
    this.setupListeners();
  }

  public static getInstance(): MusicTrackManager {
    if (!MusicTrackManager.instance) {
      MusicTrackManager.instance = new MusicTrackManager();
    }
    return MusicTrackManager.instance;
  }

  private setupListeners(): void {
    const bus = EventBus.getInstance();
    bus.on('settings:updated', (settings) => {
      if (settings.masterVolume !== undefined) {
        this.setVolume(settings.masterVolume);
      }
    });

    document.addEventListener('visibilitychange', () => {
      if (this.currentAudio) {
        if (document.hidden && !this.currentAudio.paused) {
          this.currentAudio.pause();
        } else if (!document.hidden && this.currentAudio.paused && this.currentTrackName) {
          this.currentAudio.play().catch(() => {});
        }
      }
    });
  }

  public async playRoomTrack(trackFilename: string): Promise<void> {
    if (this.currentTrackName === trackFilename && this.currentAudio && !this.currentAudio.paused) {
      return;
    }

    try {
      const manifestRes = await fetch('/assets/manifest.json');
      if (manifestRes.ok) {
        const manifest = await manifestRes.json();
        if (manifest.music && !manifest.music.includes(trackFilename)) {
          this.telemetry.record('info', `Custom track '${trackFilename}' not in asset manifest. Procedural audio on standby.`);
          return;
        }
      }
    } catch {
      // Fall through if manifest is unavailable
    }

    const trackUrl = `/assets/audio/music/${trackFilename}`;

    try {
      const response = await fetch(trackUrl, { method: 'HEAD' });
      if (!response.ok) {
        this.telemetry.record('info', `Custom track '${trackFilename}' not found. Procedural audio on standby.`);
        return;
      }

      this.fadeOutCurrent();

      const nextAudio = new Audio(trackUrl);
      nextAudio.loop = true;
      nextAudio.volume = 0;

      await nextAudio.play();
      this.currentAudio = nextAudio;
      this.currentTrackName = trackFilename;
      this.fadeIn(nextAudio);

      this.telemetry.record('info', `Playing custom audio track: ${trackFilename}`);
    } catch {
      this.telemetry.record('info', `Track '${trackFilename}' not available. Procedural audio on standby.`);
    }
  }

  private fadeOutCurrent(): void {
    if (this.fadeOutTimer !== null) {
      window.clearInterval(this.fadeOutTimer);
      this.fadeOutTimer = null;
    }
    if (!this.currentAudio) return;

    const audio = this.currentAudio;
    let vol = audio.volume;
    this.fadeOutTimer = window.setInterval(() => {
      vol = Math.max(0, vol - 0.05);
      audio.volume = vol;
      if (vol <= 0.01) {
        if (this.fadeOutTimer !== null) {
          window.clearInterval(this.fadeOutTimer);
          this.fadeOutTimer = null;
        }
        audio.pause();
        audio.src = '';
      }
    }, 50);
  }

  private fadeIn(audio: HTMLAudioElement): void {
    if (this.fadeInTimer !== null) {
      window.clearInterval(this.fadeInTimer);
      this.fadeInTimer = null;
    }

    let vol = 0;
    const target = this.volume;
    this.fadeInTimer = window.setInterval(() => {
      vol = Math.min(target, vol + 0.05);
      audio.volume = vol;
      if (vol >= target - 0.01) {
        audio.volume = target;
        if (this.fadeInTimer !== null) {
          window.clearInterval(this.fadeInTimer);
          this.fadeInTimer = null;
        }
      }
    }, 50);
  }

  public stop(): void {
    this.fadeOutCurrent();
    this.currentTrackName = null;
    this.audioEngine.toggleDrone(false);
  }

  public setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume));
    if (this.currentAudio) {
      this.currentAudio.volume = this.volume;
    }
  }
}
