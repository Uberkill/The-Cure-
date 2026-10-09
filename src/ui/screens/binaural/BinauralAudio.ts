export class BinauralAudio {
  private audioCtx: AudioContext | null = null;
  private oscNode: OscillatorNode | null = null;
  private gainNode: GainNode | null = null;

  public ensureAudio(initialFreqHz: number): void {
    try {
      if (!this.audioCtx) {
        const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (!AudioCtxClass) return;
        this.audioCtx = new AudioCtxClass();
      }

      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume().catch(() => {});
      }

      if (!this.oscNode && this.audioCtx) {
        this.oscNode = this.audioCtx.createOscillator();
        this.gainNode = this.audioCtx.createGain();
        this.oscNode.type = 'triangle';
        this.oscNode.frequency.setValueAtTime(initialFreqHz, this.audioCtx.currentTime);
        this.gainNode.gain.setValueAtTime(0.04, this.audioCtx.currentTime);
        this.oscNode.connect(this.gainNode);
        this.gainNode.connect(this.audioCtx.destination);
        this.oscNode.start();
      }
    } catch {
      // AudioContext unavailable in headless environments
    }
  }

  public updateResonance(freqHz: number, isNull: boolean): void {
    if (this.oscNode && this.audioCtx && this.gainNode) {
      this.oscNode.frequency.setTargetAtTime(freqHz, this.audioCtx.currentTime, 0.05);

      // Gain drops to 0 when in true acoustic null
      const targetGain = isNull ? 0.0 : 0.04;
      this.gainNode.gain.setTargetAtTime(targetGain, this.audioCtx.currentTime, 0.08);
    }
  }

  public teardownAudio(): void {
    try {
      if (this.oscNode) {
        this.oscNode.stop();
        this.oscNode.disconnect();
        this.oscNode = null;
      }
      if (this.gainNode) {
        this.gainNode.disconnect();
        this.gainNode = null;
      }
      if (this.audioCtx && this.audioCtx.state !== 'closed') {
        this.audioCtx.close().catch(() => {});
        this.audioCtx = null;
      }
    } catch {
      // Safe no-op
    }
  }
}
