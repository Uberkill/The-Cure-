import { EventBus } from '../core/EventBus';
import { Telemetry } from '../core/Telemetry';

export class AudioEngine {
  private static instance: AudioEngine;
  private ctx: AudioContext | null = null;
  private telemetry: Telemetry;
  private isUnlocked: boolean = false;
  private masterGain: GainNode | null = null;

  // Active oscillators / sources for cleanup
  private activeNodes: Set<{ stop?: () => void; disconnect: () => void }> = new Set();

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

  // Master DynamicsCompressor to prevent digital clipping / sound cascading
  private compressor: DynamicsCompressorNode | null = null;

  // Active sweep tracking to prevent oscillator pileup during rapid frequency changes
  private activeSweepOsc: OscillatorNode | null = null;
  private activeSweepGain: GainNode | null = null;

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

  private setupUnlockListeners(): void {
    const unlock = () => {
      this.ensureContext();
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

    bus.on('settings:updated', (settings) => {
      if (settings.masterVolume !== undefined && this.masterGain && this.ctx) {
        const val = Math.max(0.0001, settings.masterVolume);
        this.masterGain.gain.setValueAtTime(val, this.ctx.currentTime);
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
        const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        this.ctx = new AudioContextClass();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(0.85, this.ctx.currentTime);

        // Hardware brickwall limiter / compressor: prevents digital clipping above 0 dBFS
        this.compressor = this.ctx.createDynamicsCompressor();
        this.compressor.threshold.setValueAtTime(-14, this.ctx.currentTime);
        this.compressor.knee.setValueAtTime(24, this.ctx.currentTime);
        this.compressor.ratio.setValueAtTime(10, this.ctx.currentTime);
        this.compressor.attack.setValueAtTime(0.003, this.ctx.currentTime);
        this.compressor.release.setValueAtTime(0.20, this.ctx.currentTime);

        this.masterGain.connect(this.compressor);
        this.compressor.connect(this.ctx.destination);
      } catch (err) {
        this.telemetry.record('warn', `AudioContext initialization failed: ${String(err)}`);
        return false;
      }
    }

    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().then(() => {
        this.isUnlocked = true;
      }).catch((err) => {
        this.telemetry.record('warn', `AudioContext resume failed: ${String(err)}`);
      });
    } else if (this.ctx && this.ctx.state === 'running') {
      this.isUnlocked = true;
    }

    return true;
  }

  public teardownScenarioAudio(): void {
    if (!this.ctx) return;

    if (this.payphoneInterval !== null) {
      window.clearInterval(this.payphoneInterval);
      this.payphoneInterval = null;
    }

    if (this.jazzInterval !== null) {
      window.clearInterval(this.jazzInterval);
      this.jazzInterval = null;
    }

    if (this.activeSweepOsc) {
      try {
        this.activeSweepOsc.stop();
        this.activeSweepOsc.disconnect();
      } catch {}
      this.activeSweepOsc = null;
      this.activeSweepGain = null;
    }

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
      this.droneGain.connect(this.masterGain);

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
      this.ballastGain.connect(this.masterGain);

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
      this.phoneGain.connect(this.masterGain);

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
    if (!this.ensureContext() || !this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1400, now);
    osc.frequency.exponentialRampToValueAtTime(220, now + 0.04);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.05);

    osc.onended = () => {
      try { gain.disconnect(); } catch {}
    };
  }

  public playPneumaticHiss(): void {
    if (!this.ensureContext() || !this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    const bufferSize = this.ctx.sampleRate * 1.5;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1200, now);
    filter.frequency.exponentialRampToValueAtTime(300, now + 1.4);
    filter.Q.setValueAtTime(3.0, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.3, now + 0.15);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.5);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    noise.start(now);
    noise.stop(now + 1.5);

    noise.onended = () => {
      try {
        filter.disconnect();
        gain.disconnect();
      } catch {}
    };
  }

  // --- Specific Chamber Soundscapes ---

  public playWaterDrip(): void {
    if (!this.ensureContext() || !this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    const baseFreq = 800 + Math.random() * 600;
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(baseFreq + 350, now + 0.06);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.09);

    osc.onended = () => {
      try { gain.disconnect(); } catch {}
    };
  }

  public playToneAlignmentSweep(freq: number): void {
    if (!this.ensureContext() || !this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;

    // Gracefully cut previous sweep to avoid voice cascading during rapid dial/slider manipulation
    if (this.activeSweepOsc && this.activeSweepGain) {
      try {
        this.activeSweepGain.gain.cancelScheduledValues(now);
        this.activeSweepGain.gain.setValueAtTime(this.activeSweepGain.gain.value, now);
        this.activeSweepGain.gain.linearRampToValueAtTime(0.0001, now + 0.02);
        this.activeSweepOsc.stop(now + 0.025);
      } catch {
        // Already stopped
      }
    }

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.08, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.25);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.26);

    this.activeSweepOsc = osc;
    this.activeSweepGain = gain;

    osc.onended = () => {
      try { gain.disconnect(); } catch {}
      if (this.activeSweepOsc === osc) {
        this.activeSweepOsc = null;
        this.activeSweepGain = null;
      }
    };
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
      gain.connect(this.masterGain);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 1.25);
      osc2.stop(now + 1.25);
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

  public playHandsetClick(): void {
    if (!this.ensureContext() || !this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.08);

    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.1);

    osc.onended = () => {
      try { gain.disconnect(); } catch {}
    };
  }

  public playLoungeJazzTheme(): void {
    if (!this.ensureContext() || !this.ctx || !this.masterGain) return;

    // Procedural Rhodes slow jazz progression (Dm9 - G13 - Cmaj9 - A7b9)
    const chords = [
      [293.66, 349.23, 440.00, 523.25], // Dm9
      [196.00, 246.94, 349.23, 440.00], // G13
      [261.63, 329.63, 392.00, 493.88], // Cmaj9
      [220.00, 277.18, 329.63, 415.30]  // A7b9
    ];

    let chordIdx = 0;
    const playChord = () => {
      if (!this.ctx || !this.masterGain) return;
      const now = this.ctx.currentTime;
      const notes = chords[chordIdx % chords.length];
      chordIdx++;

      notes.forEach((freq) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(0.001, now);
        gain.gain.exponentialRampToValueAtTime(0.06, now + 0.2);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.8);

        osc.connect(gain);
        gain.connect(this.masterGain!);

        osc.start(now);
        osc.stop(now + 3.0);
      });
    };

    playChord();
    this.jazzInterval = window.setInterval(playChord, 3200);
  }

  public speakTerminalMessage(onDone?: () => void): void {
    const text = 'The exit is open. The cure is spreading. Thank you for your compliance.';

    let resolved = false;
    const safeDone = () => {
      if (!resolved) {
        resolved = true;
        if (onDone) onDone();
      }
    };

    // Safety timeout: in headless browsers or systems without TTS voices, speech synthesis might hang or never fire onend
    const safetyTimer = window.setTimeout(safeDone, 3600);

    if ('speechSynthesis' in window) {
      try {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.pitch = 0.72;
        utterance.rate = 0.82;
        utterance.volume = 1.0;

        utterance.onend = () => {
          window.clearTimeout(safetyTimer);
          safeDone();
        };
        utterance.onerror = () => {
          window.clearTimeout(safetyTimer);
          safeDone();
        };
        window.speechSynthesis.speak(utterance);
      } catch {
        // Fallback handled by safetyTimer
      }
    }
  }

  public play528HzSonicBlast(durationSeconds: number = 4.0): void {
    if (!this.ensureContext() || !this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(528.0, now);

    // Concussive ear-splitting envelope
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.95, now + 0.05);
    gain.gain.setValueAtTime(0.95, now + durationSeconds - 0.2);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + durationSeconds);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + durationSeconds);
  }
}
