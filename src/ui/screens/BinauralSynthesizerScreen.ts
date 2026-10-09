import { DiegeticScreenBase } from './DiegeticScreenBase';
import { Act04AudiologyState } from '../../types/cure';
import { AudioEngine } from '../../audio/AudioEngine';
import { CrystalId } from '../../types';

interface ChladniParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

export class BinauralSynthesizerScreen extends DiegeticScreenBase<Act04AudiologyState> {
  public readonly id: string = 'screen-binaural-synthesizer';

  private state: Act04AudiologyState = {
    leftHornAngleDeg: 0,
    rightHornAngleDeg: 180,
    phaseInverted: false,
    carrierFreqHz: 600,
    acousticNullAchieved: false
  };

  private audioEngine: AudioEngine;
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private animFrameId: number | null = null;
  private particles: ChladniParticle[] = [];

  private audioCtx: AudioContext | null = null;
  private oscNode: OscillatorNode | null = null;
  private gainNode: GainNode | null = null;
  private solveTimeoutId: number | null = null;

  private sliderHornLeftEl: HTMLInputElement | null = null;
  private sliderHornRightEl: HTMLInputElement | null = null;
  private sliderFreqEl: HTMLInputElement | null = null;
  private btnPhaseEl: HTMLButtonElement | null = null;
  private labelHornLeftEl: HTMLElement | null = null;
  private labelHornRightEl: HTMLElement | null = null;
  private labelFreqEl: HTMLElement | null = null;
  private btnUnsealMonolithEl: HTMLButtonElement | null = null;

  public constructor() {
    super();
    this.audioEngine = AudioEngine.getInstance();
    this.initParticles();
  }

  private initParticles(): void {
    this.particles = [];
    const count = 180;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.sqrt(Math.random()) * 0.9;
      this.particles.push({
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius,
        vx: 0,
        vy: 0
      });
    }
  }

  protected createModalElement(): HTMLElement {
    const el = document.createElement('div');
    el.id = this.id;
    el.className = 'overlay-screen diegetic-screen-overlay hidden';
    el.setAttribute('data-testid', 'screen-binaural-synthesizer');
    el.innerHTML = `
      <div class="diegetic-housing binaural-housing">
        <div class="diegetic-header">
          <span class="diegetic-model">BINAURAL PHASE SYNTHESIZER // VAULT 04 • ACOUSTIC ATTENUATION</span>
          <button class="diegetic-btn-close" id="btn-close-binaural" aria-label="Step back">DISENGAGE</button>
        </div>
        <div class="diegetic-body">
          <div class="binaural-main-panel">
            <div class="chladni-viewport-container">
              <span class="viewport-title">CHLADNI SAND NODAL RESONANCE PLATE</span>
              <canvas id="chladni-canvas" data-testid="chladni-canvas" width="360" height="360"></canvas>
              <div class="chladni-glare-overlay"></div>
            </div>

            <div class="acoustic-controls-rack">
              <div class="horns-cluster">
                <div class="control-lane">
                  <label for="slider-horn-left">LEFT AZIMUTH HORN [DEG]</label>
                  <input type="range" min="0" max="180" value="0" id="slider-horn-left" data-testid="slider-horn-left">
                  <span class="readout-pill" id="label-horn-left" data-testid="label-horn-left">0&deg;</span>
                </div>
                <div class="control-lane">
                  <label for="slider-horn-right">RIGHT AZIMUTH HORN [DEG]</label>
                  <input type="range" min="0" max="180" value="180" id="slider-horn-right" data-testid="slider-horn-right">
                  <span class="readout-pill" id="label-horn-right" data-testid="label-horn-right">180&deg;</span>
                </div>
              </div>

              <div class="phase-freq-cluster">
                <div class="control-lane">
                  <label>WAVE INTERACTION PHASE</label>
                  <button class="btn-phase-toggle" id="btn-toggle-phase" data-testid="btn-toggle-phase">
                    PHASE: 0&deg; [IN-PHASE]
                  </button>
                </div>
                <div class="control-lane">
                  <label for="slider-carrier-freq">SOLFEGGIO CARRIER FREQUENCY [HZ]</label>
                  <input type="range" min="300" max="900" value="600" id="slider-carrier-freq" data-testid="slider-carrier-freq">
                  <span class="readout-pill" id="label-carrier-freq" data-testid="label-carrier-freq">600 HZ</span>
                </div>
              </div>

              <div class="unseal-action-lane">
                <button class="btn-unseal-monolith" id="btn-unseal-monolith" data-testid="btn-unseal-monolith" disabled>
                  ACOUSTIC DISSONANCE ACTIVE &bull; DESTRUCTIVE NULL REQUIRED
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    const btnClose = el.querySelector('#btn-close-binaural');
    btnClose?.addEventListener('click', () => this.close());

    this.canvas = el.querySelector('#chladni-canvas');
    if (this.canvas) {
      this.ctx = this.canvas.getContext('2d');
    }

    this.sliderHornLeftEl = el.querySelector('#slider-horn-left');
    this.sliderHornRightEl = el.querySelector('#slider-horn-right');
    this.sliderFreqEl = el.querySelector('#slider-carrier-freq');
    this.btnPhaseEl = el.querySelector('#btn-toggle-phase');

    this.labelHornLeftEl = el.querySelector('#label-horn-left');
    this.labelHornRightEl = el.querySelector('#label-horn-right');
    this.labelFreqEl = el.querySelector('#label-carrier-freq');
    this.btnUnsealMonolithEl = el.querySelector('#btn-unseal-monolith');

    this.sliderHornLeftEl?.addEventListener('input', (e) => {
      this.state.leftHornAngleDeg = parseInt((e.target as HTMLInputElement).value, 10);
      this.updateResonance();
    });

    this.sliderHornRightEl?.addEventListener('input', (e) => {
      this.state.rightHornAngleDeg = parseInt((e.target as HTMLInputElement).value, 10);
      this.updateResonance();
    });

    this.sliderFreqEl?.addEventListener('input', (e) => {
      this.state.carrierFreqHz = parseInt((e.target as HTMLInputElement).value, 10);
      this.updateResonance();
    });

    this.btnPhaseEl?.addEventListener('click', () => {
      if (this.state.acousticNullAchieved) return;
      this.state.phaseInverted = !this.state.phaseInverted;
      this.audioEngine.playTumblerClick();
      this.updateResonance();
    });

    this.btnUnsealMonolithEl?.addEventListener('click', () => {
      if (!this.state.acousticNullAchieved) return;
      this.handleSolveTrigger();
    });

    return el;
  }

  private checkNullCondition(): boolean {
    const leftOk = Math.abs(this.state.leftHornAngleDeg - 45) <= 5;
    const rightOk = Math.abs(this.state.rightHornAngleDeg - 135) <= 5;
    const phaseOk = this.state.phaseInverted;
    const freqOk = Math.abs(this.state.carrierFreqHz - 741) <= 5;
    return leftOk && rightOk && phaseOk && freqOk;
  }

  private updateResonance(): void {
    this.ensureAudio();
    const isNull = this.checkNullCondition();

    // Audio frequency and gain updates
    if (this.oscNode && this.audioCtx && this.gainNode) {
      this.oscNode.frequency.setTargetAtTime(this.state.carrierFreqHz, this.audioCtx.currentTime, 0.05);

      // Gain drops to 0 when in true acoustic null
      const targetGain = isNull ? 0.0 : 0.04;
      this.gainNode.gain.setTargetAtTime(targetGain, this.audioCtx.currentTime, 0.08);
    }

    this.syncDom();

    if (isNull && !this.state.acousticNullAchieved) {
      this.handleSolveTrigger();
    }
  }

  private handleSolveTrigger(): void {
    if (this.state.acousticNullAchieved) return;
    this.state.acousticNullAchieved = true;

    this.audioEngine.playTumblerClick();
    this.syncDom();

    this.eventBus.emit('puzzle:crystal_collected', {
      crystalId: 'crystal_03_amethyst' as CrystalId,
      label: 'Amethyst Core'
    });

    this.eventBus.emit('ui:subtitle_changed', {
      text: 'Destructive acoustic cancellation confirmed [ 45° | 135° | 180° | 741 Hz ]. Absolute room silence achieved. Amethyst Core crystal unlatched.'
    });

    this.solveTimeoutId = window.setTimeout(() => {
      this.close();
      this.solveTimeoutId = null;
    }, 1200);
  }

  private ensureAudio(): void {
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
        this.oscNode.frequency.setValueAtTime(this.state.carrierFreqHz, this.audioCtx.currentTime);
        this.gainNode.gain.setValueAtTime(0.04, this.audioCtx.currentTime);
        this.oscNode.connect(this.gainNode);
        this.gainNode.connect(this.audioCtx.destination);
        this.oscNode.start();
      }
    } catch {
      // AudioContext unavailable in headless environments
    }
  }

  private teardownAudio(): void {
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

  private startRenderLoop(): void {
    if (this.animFrameId) return;

    const render = () => {
      this.drawChladniPlate();
      this.animFrameId = requestAnimationFrame(render);
    };
    render();
  }

  private stopRenderLoop(): void {
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
  }

  private drawChladniPlate(): void {
    if (!this.ctx || !this.canvas) return;
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const cx = w / 2;
    const cy = h / 2;
    const r = w * 0.45;

    // Dark background fade
    ctx.fillStyle = 'rgba(12, 16, 14, 0.3)';
    ctx.fillRect(0, 0, w, h);

    // Circular plate border
    ctx.strokeStyle = '#2d3830';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();

    const isNull = this.checkNullCondition();
    const freqFactor = (this.state.carrierFreqHz - 300) / 600;
    const m = 3 + Math.floor(freqFactor * 4);
    const n = 2 + Math.floor(freqFactor * 3);

    // Update and draw sand particles
    ctx.fillStyle = isNull ? '#a78bfa' : '#4ade80';

    for (const p of this.particles) {
      if (!isNull) {
        // High modal agitation
        const field = Math.sin(n * Math.PI * p.x) * Math.cos(m * Math.PI * p.y) -
                      Math.cos(m * Math.PI * p.x) * Math.sin(n * Math.PI * p.y);
        const jitter = (Math.random() - 0.5) * 0.04;
        p.vx += field * 0.005 + jitter * 0.1;
        p.vy += field * 0.005 + jitter * 0.1;
        p.vx *= 0.85;
        p.vy *= 0.85;
      } else {
        // Settled into clean nodal mandala
        const targetX = Math.round(p.x * 4) / 4;
        const targetY = Math.round(p.y * 4) / 4;
        p.vx = (targetX - p.x) * 0.08;
        p.vy = (targetY - p.y) * 0.08;
      }

      p.x += p.vx;
      p.y += p.vy;

      // Keep within circular plate
      const dist = Math.sqrt(p.x * p.x + p.y * p.y);
      if (dist > 0.9) {
        p.x = (p.x / dist) * 0.88;
        p.y = (p.y / dist) * 0.88;
      }

      const screenX = cx + p.x * r;
      const screenY = cy + p.y * r;

      ctx.beginPath();
      ctx.arc(screenX, screenY, isNull ? 2.0 : 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  protected onOpened(): void {
    this.syncDom();
    this.ensureAudio();
    this.startRenderLoop();
  }

  protected onClosed(): void {
    if (this.solveTimeoutId !== null) {
      window.clearTimeout(this.solveTimeoutId);
      this.solveTimeoutId = null;
    }
    this.stopRenderLoop();
    this.teardownAudio();
  }

  protected handleKeyDown(e: KeyboardEvent): void {
    if (this.state.acousticNullAchieved) return;

    if (e.key === ' ') {
      e.preventDefault();
      this.state.phaseInverted = !this.state.phaseInverted;
      this.updateResonance();
    } else if (e.key === 'ArrowUp') {
      this.state.carrierFreqHz = Math.min(900, this.state.carrierFreqHz + 10);
      this.updateResonance();
    } else if (e.key === 'ArrowDown') {
      this.state.carrierFreqHz = Math.max(300, this.state.carrierFreqHz - 10);
      this.updateResonance();
    }
  }

  private syncDom(): void {
    const isLocked = this.state.acousticNullAchieved;

    if (this.sliderHornLeftEl) {
      this.sliderHornLeftEl.value = String(this.state.leftHornAngleDeg);
      this.sliderHornLeftEl.disabled = isLocked;
    }
    if (this.sliderHornRightEl) {
      this.sliderHornRightEl.value = String(this.state.rightHornAngleDeg);
      this.sliderHornRightEl.disabled = isLocked;
    }
    if (this.sliderFreqEl) {
      this.sliderFreqEl.value = String(this.state.carrierFreqHz);
      this.sliderFreqEl.disabled = isLocked;
    }

    if (this.labelHornLeftEl) {
      this.labelHornLeftEl.textContent = `${this.state.leftHornAngleDeg}°`;
    }
    if (this.labelHornRightEl) {
      this.labelHornRightEl.textContent = `${this.state.rightHornAngleDeg}°`;
    }
    if (this.labelFreqEl) {
      this.labelFreqEl.textContent = `${this.state.carrierFreqHz} HZ`;
    }

    if (this.btnPhaseEl) {
      this.btnPhaseEl.disabled = isLocked;
      if (this.state.phaseInverted) {
        this.btnPhaseEl.textContent = 'PHASE: 180° [INVERTED]';
        this.btnPhaseEl.classList.add('inverted');
      } else {
        this.btnPhaseEl.textContent = 'PHASE: 0° [IN-PHASE]';
        this.btnPhaseEl.classList.remove('inverted');
      }
    }

    if (this.btnUnsealMonolithEl) {
      if (isLocked) {
        this.btnUnsealMonolithEl.disabled = true;
        this.btnUnsealMonolithEl.textContent = 'ACOUSTIC NULL ACHIEVED • AMETHYST CORE RELEASED';
        this.btnUnsealMonolithEl.classList.add('unlocked');
      } else if (this.checkNullCondition()) {
        this.btnUnsealMonolithEl.disabled = false;
        this.btnUnsealMonolithEl.textContent = 'INTERFERENCE CANCELED • UNSEAL CORE';
        this.btnUnsealMonolithEl.classList.add('ready');
      } else {
        this.btnUnsealMonolithEl.disabled = true;
        this.btnUnsealMonolithEl.textContent = 'ACOUSTIC DISSONANCE ACTIVE • DESTRUCTIVE NULL REQUIRED';
        this.btnUnsealMonolithEl.classList.remove('ready', 'unlocked');
      }
    }
  }

  public getState(): Act04AudiologyState {
    return { ...this.state };
  }

  public hydrate(state: Act04AudiologyState): void {
    this.state = { ...state };
    this.syncDom();
  }

  public reset(): void {
    this.state = {
      leftHornAngleDeg: 0,
      rightHornAngleDeg: 180,
      phaseInverted: false,
      carrierFreqHz: 600,
      acousticNullAchieved: false
    };
    this.syncDom();
  }

  public stepControl(controlId: string, delta: number): void {
    if (controlId === 'horn_left') {
      this.state.leftHornAngleDeg = Math.max(0, Math.min(180, this.state.leftHornAngleDeg + delta));
      this.updateResonance();
    } else if (controlId === 'horn_right') {
      this.state.rightHornAngleDeg = Math.max(0, Math.min(180, this.state.rightHornAngleDeg + delta));
      this.updateResonance();
    } else if (controlId === 'phase_toggle') {
      this.state.phaseInverted = !this.state.phaseInverted;
      this.updateResonance();
    } else if (controlId === 'frequency') {
      this.state.carrierFreqHz = Math.max(300, Math.min(900, this.state.carrierFreqHz + delta));
      this.updateResonance();
    }
  }
}
