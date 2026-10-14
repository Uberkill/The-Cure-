import { Telemetry } from '../core/Telemetry';
import { AudioEngine } from './AudioEngine';

export class MusicTrackManager {
  private static instance: MusicTrackManager;
  private telemetry: Telemetry;
  private audioEngine: AudioEngine;

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

  public async playRoomTrack(trackFilenameOrRoomId: string): Promise<void> {
    // Map filename to roomId if needed
    let roomId = trackFilenameOrRoomId;
    if (trackFilenameOrRoomId.includes('.')) {
      const clean = trackFilenameOrRoomId.replace(/\.(mp3|ogg|wav)$/i, '');
      if (clean === 'room_04_theme') roomId = 'room_04';
      else if (clean === 'chamber_exploration') roomId = 'room_04';
      else roomId = clean;
    }

    this.telemetry.record('info', `Routing room track request '${trackFilenameOrRoomId}' to sector '${roomId}'`);
    await this.audioEngine.transitionToRoomSoundscape(roomId);
  }

  public getCurrentRoomId(): string | null {
    return this.audioEngine.getCurrentRoomSoundscapeId();
  }

  public getCurrentTrackId(): string | null {
    return this.audioEngine.getCurrentRoomSoundscapeId();
  }

  public stop(): void {
    this.audioEngine.stopProceduralSoundscape();
  }

  public setVolume(volume: number): void {
    // Controlled via AudioEngine master & ambient settings
    void volume;
  }
}
