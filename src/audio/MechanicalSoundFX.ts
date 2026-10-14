export interface SweepTracker {
  osc: OscillatorNode | null;
  gain: GainNode | null;
}

function triggerHaptic(pattern: number | number[]): void {
  try {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      navigator.vibrate(pattern);
    }
  } catch {
    // Absorb permissions or execution context restrictions silently
  }
}

export class MechanicalSoundFX {
  public static playPaperRustle(ctx: AudioContext, destination: AudioNode, volume: number = 0.85): void {
    if (typeof ctx.createBuffer !== 'function' || typeof ctx.createBufferSource !== 'function') {
      return;
    }
    const now = ctx.currentTime;
    const bufferSize = Math.floor(ctx.sampleRate * 0.45);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    let filter = 0;
    for (let i = 0; i < bufferSize; i++) {
      const t = i / ctx.sampleRate;
      const raw = Math.random() * 2 - 1;
      filter += 0.25 * (raw - filter);
      const flutter = Math.sin(t * 35) * Math.sin(t * 70) * 0.5 + 0.5;
      const env = Math.pow(Math.sin((t / 0.45) * Math.PI), 1.8);
      data[i] = (filter * 0.7 + (Math.random() * 2 - 1) * 0.3) * env * flutter * 0.8;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const bq = ctx.createBiquadFilter();
    bq.type = 'bandpass';
    bq.frequency.setValueAtTime(1400, now);
    bq.Q.setValueAtTime(1.8, now);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(volume * 0.65, now);

    noise.connect(bq);
    bq.connect(gain);
    gain.connect(destination);

    noise.start(now);
    noise.stop(now + 0.45);

    noise.onended = () => {
      try {
        noise.disconnect();
        bq.disconnect();
        gain.disconnect();
      } catch (err: unknown) {
        void err;
      }
    };
  }

  public static playDoorHeavy(ctx: AudioContext, destination: AudioNode, volume: number = 0.95): void {
    triggerHaptic([25, 35, 25]);
    const now = ctx.currentTime;
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(65, now);
    osc1.frequency.exponentialRampToValueAtTime(35, now + 0.6);

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(180, now);
    osc2.frequency.exponentialRampToValueAtTime(70, now + 0.3);

    gain.gain.setValueAtTime(volume * 0.75, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.75);
    osc2.stop(now + 0.75);

    osc1.onended = () => {
      try {
        osc1.disconnect();
        osc2.disconnect();
        gain.disconnect();
      } catch (err: unknown) {
        void err;
      }
    };
  }

  public static playDoorLatch(ctx: AudioContext, destination: AudioNode, volume: number = 0.8): void {
    triggerHaptic(20);
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(950, now);
    osc.frequency.exponentialRampToValueAtTime(180, now + 0.08);

    gain.gain.setValueAtTime(volume * 0.6, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(gain);
    gain.connect(destination);

    osc.start(now);
    osc.stop(now + 0.13);

    osc.onended = () => {
      try {
        osc.disconnect();
        gain.disconnect();
      } catch (err: unknown) {
        void err;
      }
    };
  }

  public static playDrawerWood(ctx: AudioContext, destination: AudioNode, volume: number = 0.75): void {
    triggerHaptic(12);
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(65, now + 0.25);

    gain.gain.setValueAtTime(volume * 0.55, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

    osc.connect(gain);
    gain.connect(destination);

    osc.start(now);
    osc.stop(now + 0.32);

    osc.onended = () => {
      try {
        osc.disconnect();
        gain.disconnect();
      } catch (err: unknown) {
        void err;
      }
    };
  }

  public static playClockTick(ctx: AudioContext, destination: AudioNode, volume: number = 0.65): void {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1800, now);
    osc.frequency.exponentialRampToValueAtTime(550, now + 0.035);

    gain.gain.setValueAtTime(volume * 0.5, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    osc.connect(gain);
    gain.connect(destination);

    osc.start(now);
    osc.stop(now + 0.045);

    osc.onended = () => {
      try {
        osc.disconnect();
        gain.disconnect();
      } catch (err: unknown) {
        void err;
      }
    };
  }

  public static playSwitchKnife(ctx: AudioContext, destination: AudioNode, volume: number = 0.9): void {
    triggerHaptic(25);
    const now = ctx.currentTime;
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(1200, now);
    osc1.frequency.exponentialRampToValueAtTime(120, now + 0.12);

    osc2.type = 'sawtooth';
    osc2.frequency.setValueAtTime(220, now);
    osc2.frequency.exponentialRampToValueAtTime(50, now + 0.2);

    gain.gain.setValueAtTime(volume * 0.7, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.26);
    osc2.stop(now + 0.26);

    osc1.onended = () => {
      try {
        osc1.disconnect();
        osc2.disconnect();
        gain.disconnect();
      } catch (err: unknown) {
        void err;
      }
    };
  }

  public static playGlassClink(ctx: AudioContext, destination: AudioNode, volume: number = 0.7): void {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(2400, now);

    gain.gain.setValueAtTime(volume * 0.5, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    osc.connect(gain);
    gain.connect(destination);

    osc.start(now);
    osc.stop(now + 0.5);

    osc.onended = () => {
      try {
        osc.disconnect();
        gain.disconnect();
      } catch (err: unknown) {
        void err;
      }
    };
  }

  public static playSwitchToggle(ctx: AudioContext, destination: AudioNode, volume: number = 0.7): void {
    triggerHaptic(15);
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(250, now + 0.04);

    gain.gain.setValueAtTime(volume * 0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);

    osc.connect(gain);
    gain.connect(destination);

    osc.start(now);
    osc.stop(now + 0.05);

    osc.onended = () => {
      try {
        osc.disconnect();
        gain.disconnect();
      } catch (err: unknown) {
        void err;
      }
    };
  }

  public static playTumblerClick(ctx: AudioContext, destination: AudioNode): void {
    triggerHaptic(8);
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1400, now);
    osc.frequency.exponentialRampToValueAtTime(220, now + 0.04);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);

    osc.connect(gain);
    gain.connect(destination);
    osc.start(now);
    osc.stop(now + 0.05);

    osc.onended = () => {
      try {
        osc.disconnect();
        gain.disconnect();
      } catch (err: unknown) {
        void err;
      }
    };
  }

  public static playPneumaticHiss(ctx: AudioContext, destination: AudioNode): void {
    if (typeof ctx.createBuffer !== 'function' || typeof ctx.createBufferSource !== 'function') {
      return;
    }
    const now = ctx.currentTime;
    const bufferSize = Math.floor(ctx.sampleRate * 1.5);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1200, now);
    filter.frequency.exponentialRampToValueAtTime(300, now + 1.4);
    filter.Q.setValueAtTime(3.0, now);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.3, now + 0.15);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.5);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(destination);

    noise.start(now);
    noise.stop(now + 1.5);

    noise.onended = () => {
      try {
        noise.disconnect();
        filter.disconnect();
        gain.disconnect();
      } catch (err: unknown) {
        void err;
      }
    };
  }

  public static playWaterDrip(ctx: AudioContext, destination: AudioNode): void {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    const baseFreq = 800 + Math.random() * 600;
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(baseFreq + 350, now + 0.06);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(gain);
    gain.connect(destination);
    osc.start(now);
    osc.stop(now + 0.09);

    osc.onended = () => {
      try {
        osc.disconnect();
        gain.disconnect();
      } catch (err: unknown) {
        void err;
      }
    };
  }

  public static playToneAlignmentSweep(
    ctx: AudioContext,
    destination: AudioNode,
    freq: number,
    sweepTracker: SweepTracker
  ): void {
    const now = ctx.currentTime;

    if (sweepTracker.osc && sweepTracker.gain) {
      try {
        sweepTracker.gain.gain.cancelScheduledValues(now);
        sweepTracker.gain.gain.setValueAtTime(sweepTracker.gain.gain.value, now);
        sweepTracker.gain.gain.linearRampToValueAtTime(0.0001, now + 0.02);
        sweepTracker.osc.stop(now + 0.025);
      } catch (err: unknown) {
        void err;
      }
    }

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.08, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.25);

    osc.connect(gain);
    gain.connect(destination);
    osc.start(now);
    osc.stop(now + 0.26);

    sweepTracker.osc = osc;
    sweepTracker.gain = gain;

    osc.onended = () => {
      try {
        osc.disconnect();
        gain.disconnect();
      } catch (err: unknown) {
        void err;
      }
      if (sweepTracker.osc === osc) {
        sweepTracker.osc = null;
        sweepTracker.gain = null;
      }
    };
  }

  public static playHandsetClick(ctx: AudioContext, destination: AudioNode): void {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.05);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    osc.connect(gain);
    gain.connect(destination);
    osc.start(now);
    osc.stop(now + 0.06);

    osc.onended = () => {
      try {
        osc.disconnect();
        gain.disconnect();
      } catch (err: unknown) {
        void err;
      }
    };
  }
}
