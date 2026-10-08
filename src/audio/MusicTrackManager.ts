import { Telemetry } from '../core/Telemetry';
import { AudioEngine } from './AudioEngine';

export class MusicTrackManager {
  private static instance: MusicTrackManager;
  private currentAudio: HTMLAudioElement | null = null;
  private currentTrackName: string | null = null;
  private telemetry: Telemetry;
  private audioEngine: AudioEngine;
  private volume: number = 0.5;

  private constructor() {
    this.telemetry = Telemetry.getInstance();
    this.audioEngine = AudioEngine.getInstance();
  }

  public static getInstance(): MusicTrackManager {
    if (!MusicTrackManager.instance) {
      MusicTrackManager.instance = new MusicTrackManager();
    }
    return MusicTrackManager.instance;
  }

  public async playRoomTrack(trackFilename: string): Promise<void> {
    if (this.currentTrackName === trackFilename && this.currentAudio && !this.currentAudio.paused) {
      return;
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
    } catch (err) {
      this.telemetry.record('info', `Track '${trackFilename}' not available. Procedural audio on standby.`);
    }
  }

  private fadeOutCurrent(): void {
    if (!this.currentAudio) return;
    const audio = this.currentAudio;
    let vol = audio.volume;
    const fadeTimer = setInterval(() => {
      vol = Math.max(0, vol - 0.05);
      audio.volume = vol;
      if (vol <= 0.01) {
        clearInterval(fadeTimer);
        audio.pause();
        audio.src = '';
      }
    }, 50);
  }

  private fadeIn(audio: HTMLAudioElement): void {
    let vol = 0;
    const target = this.volume;
    const fadeTimer = setInterval(() => {
      vol = Math.min(target, vol + 0.05);
      audio.volume = vol;
      if (vol >= target - 0.01) {
        audio.volume = target;
        clearInterval(fadeTimer);
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
