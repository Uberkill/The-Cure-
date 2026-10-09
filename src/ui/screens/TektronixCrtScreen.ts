import { DiegeticScreenBase } from './DiegeticScreenBase';
import { Act01SterileState } from '../../types/cure';
import { GameState } from '../../core/GameState';
import { GameStage } from '../../types';

export class TektronixCrtScreen extends DiegeticScreenBase<Act01SterileState> {
  public readonly id: string = 'screen-tektronix-crt';

  private state: Act01SterileState = {
    telephoneAnswered: false,
    brassShuntInserted: false,
    frequencyHz: 440,
    phaseOffsetDeg: 0,
    harmonicLocked: false,
    knifeSwitchThrown: false
  };

  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private animFrameId: number | null = null;

  private audioCtx: AudioContext | null = null;
  private oscNode: OscillatorNode | null = null;
  private gainNode: GainNode | null = null;

  private slotShuntEl: HTMLElement | null = null;
  private dialFrequencyEl: HTMLInputElement | null = null;
  private labelFrequencyEl: HTMLElement | null = null;
  private btnKnifeSwitchEl: HTMLButtonElement | null = null;
  private solveTimeoutId: number | null = null;

  protected createModalElement(): HTMLElement {
    const el = document.createElement('div');
    el.id = this.id;
    el.className = 'overlay-screen diegetic-screen-overlay hidden';
    el.setAttribute('data-testid', 'screen-tektronix-crt');
    el.innerHTML = `
      <div class="diegetic-housing tektronix-housing">
        <div class="diegetic-header">
          <span class="diegetic-model">TEKTRONIX TYPE 545B • HARMONIC MONITOR</span>
          <button class="diegetic-btn-close" id="btn-close-crt" aria-label="Step back">DISENGAGE</button>
        </div>
        <div class="diegetic-body">
          <div class="crt-viewport-container">
            <canvas id="tektronix-canvas" data-testid="oscilloscope-canvas" width="600" height="320"></canvas>
            <div class="crt-phosphor-glare"></div>
          </div>
          <div class="crt-controls-apron">
            <div class="fuse-socket" id="fuse-socket-shunt" data-testid="fuse-socket-shunt">
              <span class="socket-label">CERAMIC SHUNT RECEPTACLE</span>
              <div class="shunt-slot" id="slot-shunt" role="button" tabindex="0">EMPTY [CLICK TO INSERT]</div>
            </div>
            <div class="dial-cluster">
              <label for="dial-frequency">CALIBRATION FREQUENCY (HZ)</label>
              <input type="range" min="400" max="700" value="440" id="dial-frequency" data-testid="dial-frequency">
              <span id="label-frequency" data-testid="label-frequency">440.0 HZ</span>
            </div>
            <div class="switch-cluster">
              <button class="knife-switch-handle" id="btn-knife-switch" disabled data-testid="btn-knife-switch">
                THROW PRIMARY RELAY
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    const btnClose = el.querySelector('#btn-close-crt');
    btnClose?.addEventListener('click', () => this.close());

    this.canvas = el.querySelector('#tektronix-canvas') as HTMLCanvasElement;
    if (this.canvas) {
      this.ctx = this.canvas.getContext('2d');
    }

    this.slotShuntEl = el.querySelector('#slot-shunt') as HTMLElement;
    this.dialFrequencyEl = el.querySelector('#dial-frequency') as HTMLInputElement;
    this.labelFrequencyEl = el.querySelector('#label-frequency') as HTMLElement;
    this.btnKnifeSwitchEl = el.querySelector('#btn-knife-switch') as HTMLButtonElement;

    this.bindControlEvents();

    return el;
  }

  private bindControlEvents(): void {
    this.slotShuntEl?.addEventListener('click', () => {
      this.handleShuntClick();
    });

    this.dialFrequencyEl?.addEventListener('input', () => {
      this.ensureAudio();
      const val = parseInt(this.dialFrequencyEl!.value, 10);
      this.state.frequencyHz = val;
      if (this.labelFrequencyEl) {
        this.labelFrequencyEl.textContent = `${val}.0 HZ`;
      }
      this.updateResonance();
    });

    this.btnKnifeSwitchEl?.addEventListener('click', () => {
      this.handleKnifeSwitch();
    });
  }

  private handleShuntClick(): void {
    if (this.state.brassShuntInserted) return;

    const gs = GameState.getInstance();
    // Accept prop_brass_shunt or prop_key
    if (gs.hasItem('prop_brass_shunt') || gs.hasItem('prop_key')) {
      this.state.brassShuntInserted = true;
      if (this.slotShuntEl) {
        this.slotShuntEl.textContent = 'BRASS SHUNT SEATED';
        this.slotShuntEl.classList.add('installed');
      }
      this.eventBus.emit('ui:subtitle_changed', {
        text: 'Brass shunt seated firmly in ceramic spring clips. Tube filaments glow warm orange.'
      });
      this.ensureAudio();
      this.updateResonance();
    } else {
      this.eventBus.emit('ui:subtitle_changed', {
        text: 'The ceramic fuse block is empty. A heavy brass shunt is required to bridge the relay coil.'
      });
    }
  }

  private updateResonance(): void {
    const is528 = Math.abs(this.state.frequencyHz - 528) <= 2;
    this.state.harmonicLocked = is528 && this.state.brassShuntInserted;

    if (this.oscNode && this.audioCtx && this.gainNode) {
      this.oscNode.frequency.setTargetAtTime(this.state.frequencyHz, this.audioCtx.currentTime, 0.05);
      const targetGain = this.state.brassShuntInserted ? (is528 ? 0.08 : 0.02) : 0;
      this.gainNode.gain.setTargetAtTime(targetGain, this.audioCtx.currentTime, 0.05);
    }

    if (this.btnKnifeSwitchEl) {
      if (this.state.harmonicLocked && !this.state.knifeSwitchThrown) {
        this.btnKnifeSwitchEl.disabled = false;
        this.btnKnifeSwitchEl.classList.add('ready');
      } else {
        this.btnKnifeSwitchEl.disabled = true;
        this.btnKnifeSwitchEl.classList.remove('ready');
      }
    }

    // Emit frequency changed for backwards compatibility
    this.eventBus.emit('puzzle:frequency_changed', {
      frequency: this.state.frequencyHz,
      isResonating: is528
    });
  }

  private handleKnifeSwitch(): void {
    if (!this.state.harmonicLocked || this.state.knifeSwitchThrown) return;

    this.state.knifeSwitchThrown = true;
    if (this.btnKnifeSwitchEl) {
      this.btnKnifeSwitchEl.disabled = true;
      this.btnKnifeSwitchEl.textContent = 'RELAY ENGAGED';
    }
    if (this.dialFrequencyEl) {
      this.dialFrequencyEl.disabled = true;
    }
    if (this.slotShuntEl) {
      this.slotShuntEl.style.pointerEvents = 'none';
    }

    this.eventBus.emit('puzzle:switch_thrown', {});
    GameState.getInstance().transitionTo(GameStage.ACT_1_HUB_CORRIDOR_OPEN);
    this.eventBus.emit('ui:subtitle_changed', {
      text: 'Knife switch thrown. Relay coil snaps shut. The forward observation corridor pressure seal unlatches with a concussive gasp.'
    });

    this.solveTimeoutId = window.setTimeout(() => {
      this.close();
      this.solveTimeoutId = null;
    }, 800);
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
        this.oscNode.type = 'sine';
        this.oscNode.frequency.setValueAtTime(this.state.frequencyHz, this.audioCtx.currentTime);
        this.gainNode.gain.setValueAtTime(0, this.audioCtx.currentTime);
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

  protected onOpened(): void {
    this.syncDomState();
    this.startCanvasRenderLoop();
  }

  protected onClosed(): void {
    if (this.solveTimeoutId !== null) {
      window.clearTimeout(this.solveTimeoutId);
      this.solveTimeoutId = null;
    }
    this.stopCanvasRenderLoop();
    this.teardownAudio();
  }

  protected handleKeyDown(_e: KeyboardEvent): void {}

  private syncDomState(): void {
    if (this.slotShuntEl) {
      if (this.state.brassShuntInserted) {
        this.slotShuntEl.textContent = 'BRASS SHUNT SEATED';
        this.slotShuntEl.classList.add('installed');
        this.slotShuntEl.style.pointerEvents = this.state.knifeSwitchThrown ? 'none' : 'auto';
      } else {
        this.slotShuntEl.textContent = 'EMPTY [CLICK TO INSERT]';
        this.slotShuntEl.classList.remove('installed');
        this.slotShuntEl.style.pointerEvents = 'auto';
      }
    }

    if (this.dialFrequencyEl) {
      this.dialFrequencyEl.value = String(this.state.frequencyHz);
      this.dialFrequencyEl.disabled = this.state.knifeSwitchThrown;
    }

    if (this.labelFrequencyEl) {
      this.labelFrequencyEl.textContent = `${this.state.frequencyHz}.0 HZ`;
    }

    this.updateResonance();
  }

  private startCanvasRenderLoop(): void {
    if (this.animFrameId) return;

    const render = () => {
      this.drawTrace();
      this.animFrameId = requestAnimationFrame(render);
    };
    render();
  }

  private stopCanvasRenderLoop(): void {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
  }

  private drawTrace(): void {
    if (!this.ctx || !this.canvas) return;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const ctx = this.ctx;

    // Background fade for phosphor trace persistence
    ctx.fillStyle = 'rgba(5, 10, 6, 0.25)';
    ctx.fillRect(0, 0, w, h);

    // Reticle grid
    ctx.strokeStyle = 'rgba(74, 222, 128, 0.08)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 0; x < w; x += 40) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
    }
    for (let y = 0; y < h; y += 40) {
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
    }
    ctx.stroke();

    const t = performance.now() * 0.003;
    ctx.lineWidth = 2;

    if (!this.state.brassShuntInserted) {
      // Disordered low-amplitude baseline jitter
      ctx.strokeStyle = 'rgba(74, 222, 128, 0.4)';
      ctx.beginPath();
      const midY = h / 2;
      for (let x = 0; x < w; x += 5) {
        const jitter = (Math.random() - 0.5) * 4;
        if (x === 0) ctx.moveTo(x, midY + jitter);
        else ctx.lineTo(x, midY + jitter);
      }
      ctx.stroke();
    } else if (this.state.harmonicLocked) {
      // Resonant Lissajous Harmonic Ring at 528 Hz
      ctx.strokeStyle = '#4ade80';
      ctx.shadowColor = '#4ade80';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      const radiusX = 120 + Math.sin(t * 2) * 6;
      const radiusY = 90 + Math.cos(t * 2) * 6;
      const cx = w / 2;
      const cy = h / 2;
      for (let angle = 0; angle <= Math.PI * 2; angle += 0.05) {
        const lx = cx + Math.sin(angle * 1) * radiusX;
        const ly = cy + Math.cos(angle * 1 + t) * radiusY;
        if (angle === 0) ctx.moveTo(lx, ly);
        else ctx.lineTo(lx, ly);
      }
      ctx.closePath();
      ctx.stroke();
      ctx.shadowBlur = 0;
    } else {
      // Sine wave with variable frequency
      ctx.strokeStyle = 'rgba(74, 222, 128, 0.75)';
      ctx.beginPath();
      const midY = h / 2;
      const cycles = (this.state.frequencyHz / 400) * 4;
      for (let x = 0; x < w; x += 2) {
        const wave = Math.sin((x / w) * Math.PI * 2 * cycles + t * 4) * 50;
        if (x === 0) ctx.moveTo(x, midY + wave);
        else ctx.lineTo(x, midY + wave);
      }
      ctx.stroke();
    }
  }

  public getState(): Act01SterileState {
    return { ...this.state };
  }

  public hydrate(state: Act01SterileState): void {
    this.state = { ...state };
    this.syncDomState();
  }

  public reset(): void {
    this.state = {
      telephoneAnswered: false,
      brassShuntInserted: false,
      frequencyHz: 440,
      phaseOffsetDeg: 0,
      harmonicLocked: false,
      knifeSwitchThrown: false
    };
    this.syncDomState();
  }

  public stepControl(controlId: string, delta: number): void {
    if (controlId === 'frequency') {
      this.state.frequencyHz = Math.max(400, Math.min(700, this.state.frequencyHz + delta));
      this.syncDomState();
    }
  }
}
