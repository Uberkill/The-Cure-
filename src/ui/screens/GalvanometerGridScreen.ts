import { DiegeticScreenBase } from './DiegeticScreenBase';
import { Act07SynthesisState } from '../../types/cure';
import { AudioEngine } from '../../audio/AudioEngine';
import { StripChartRecorder } from '../components/StripChartRecorder';

export class GalvanometerGridScreen extends DiegeticScreenBase<Act07SynthesisState> {
  public readonly id: string = 'screen-galvanometer-grid';

  private state: Act07SynthesisState = {
    insertedCrystals: ['crystal_01_quartz', 'crystal_02_bronze', 'crystal_03_amethyst', 'crystal_04_obsidian', 'crystal_05_celadon'],
    shuntResistances: [50, 150, 20, 180, 100],
    gridBalanced: false
  };

  private audioEngine: AudioEngine;
  private solveTimeoutId: number | null = null;
  private breakerTripped: boolean = false;
  private chartRecorder: StripChartRecorder | null = null;

  private needleEls: HTMLElement[] = [];
  private sliderEls: HTMLInputElement[] = [];
  private labelEls: HTMLElement[] = [];
  private btnBusLeverEl: HTMLButtonElement | null = null;
  private breakerStatusEl: HTMLElement | null = null;
  private btnResetBreakerEl: HTMLButtonElement | null = null;
  private lastShuntAudioTime: number = 0;
  private lastShuntAudioVal: number[] = [50, 150, 20, 180, 100];

  public constructor() {
    super();
    this.audioEngine = AudioEngine.getInstance();
  }

  protected createModalElement(): HTMLElement {
    const el = document.createElement('div');
    el.id = this.id;
    el.className = 'overlay-screen diegetic-screen-overlay hidden';
    el.setAttribute('data-testid', 'screen-galvanometer-grid');
    el.innerHTML = `
      <div class="diegetic-housing galvanometer-housing">
        <div class="diegetic-header">
          <span class="diegetic-model">PRIMARY POWER DISTRIBUTION BUS // 5-CHANNEL GALVANOMETER GRID</span>
          <button class="diegetic-btn-close" id="btn-close-galvanometer" aria-label="Step back">DISENGAGE</button>
        </div>
        <div class="diegetic-body">
          <div class="galvanometer-console-layout">
            <div class="breaker-annunciator-bar" id="breaker-bar">
              <span class="breaker-status-text" id="label-breaker-status" data-testid="label-breaker-status">
                CIRCUIT BUS ARMED &bull; NOMINAL LOAD REQUIRED: 100 &Omega; PER CHANNEL
              </span>
              <button class="btn-reset-breaker hidden" id="btn-reset-breaker" data-testid="btn-reset-breaker">
                RESET MASTER BREAKER
              </button>
            </div>

            <div id="chart-recorder-mount"></div>

            <div class="galvanometer-channels-grid">
              ${[0, 1, 2, 3, 4].map(i => `
                <div class="channel-bay" data-channel="${i}">
                  <span class="channel-title">CH 0${i + 1} &bull; SENSOR</span>
                  <div class="meter-housing">
                    <div class="meter-scale-face">
                      <div class="meter-scale-ticks"></div>
                      <div class="meter-center-green-zone"></div>
                      <div class="meter-needle-arm" id="meter-needle-${i}" data-testid="meter-needle-${i}"></div>
                    </div>
                  </div>
                  <div class="shunt-slider-rack">
                    <label for="slider-shunt-${i}">LOAD RESISTANCE</label>
                    <input type="range" min="0" max="200" step="5" value="${this.state.shuntResistances[i]}" id="slider-shunt-${i}" data-testid="slider-shunt-${i}">
                    <span class="shunt-value-pill" id="label-shunt-${i}" data-testid="label-shunt-${i}">${this.state.shuntResistances[i]} &Omega;</span>
                  </div>
                </div>
              `).join('')}
            </div>

            <div class="bus-lever-action-bay">
              <button class="main-bus-lever" id="btn-bus-lever" data-testid="btn-bus-lever" disabled>
                DISENGAGE HYDRAULIC BLAST CLAMPS &bull; EQUILIBRIUM REQUIRED
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    const btnClose = el.querySelector('#btn-close-galvanometer');
    btnClose?.addEventListener('click', () => this.close());

    this.breakerStatusEl = el.querySelector('#label-breaker-status');
    this.btnResetBreakerEl = el.querySelector('#btn-reset-breaker');
    this.btnBusLeverEl = el.querySelector('#btn-bus-lever');

    this.btnResetBreakerEl?.addEventListener('click', () => this.handleResetBreaker());

    for (let i = 0; i < 5; i++) {
      const needle = el.querySelector(`#meter-needle-${i}`) as HTMLElement;
      const slider = el.querySelector(`#slider-shunt-${i}`) as HTMLInputElement;
      const label = el.querySelector(`#label-shunt-${i}`) as HTMLElement;

      if (needle) this.needleEls.push(needle);
      if (label) this.labelEls.push(label);
      if (slider) {
        this.sliderEls.push(slider);
        slider.addEventListener('input', () => {
          const val = parseInt(slider.value, 10);
          this.handleSliderChange(i, val);
        });
      }
    }

    // Mount StripChartRecorder for live polygraph monitoring
    const chartMount = el.querySelector('#chart-recorder-mount') as HTMLElement | null;
    if (chartMount) {
      this.chartRecorder = new StripChartRecorder(chartMount, {
        label: 'POLYGRAPH RECORDER // BUS IMPEDANCE HARMONICS',
        initialSpeed: 25,
        frequencyHz: 2.5,
        amplitude: 24
      });
    }

    this.btnBusLeverEl?.addEventListener('click', () => this.handleLeverThrow());

    return el;
  }

  private handleSliderChange(channelIndex: number, resistance: number): void {
    if (this.breakerTripped || this.state.gridBalanced) return;

    this.state.shuntResistances[channelIndex] = resistance;
    const prev = this.lastShuntAudioVal[channelIndex] ?? resistance;
    const now = performance.now();
    if (Math.abs(resistance - prev) >= 10 && now - this.lastShuntAudioTime > 50) {
      this.audioEngine.playTumblerClick();
      this.lastShuntAudioVal[channelIndex] = resistance;
      this.lastShuntAudioTime = now;
    }

    // Overload safety check: if pushed to max (200 Ohms), trip the circuit breaker!
    if (resistance >= 200) {
      this.handleTripBreaker(channelIndex);
      return;
    }

    this.syncDom();

    if (this.checkGridBalanced()) {
      this.audioEngine.playTumblerClick();
      this.eventBus.emit('ui:subtitle_changed', {
        text: 'All 5 power channels balanced at 100 Ohms. Main hydraulic bus lever unlocked.'
      });
    }
  }

  private handleTripBreaker(channelIndex: number): void {
    this.breakerTripped = true;
    this.audioEngine.playSwitchKnife();
    this.syncDom();

    this.eventBus.emit('ui:subtitle_changed', {
      text: `Master circuit breaker tripped: Channel 0${channelIndex + 1} overloaded (200 Ohms). Reset breaker to restore bus.`
    });
  }

  private handleResetBreaker(): void {
    this.breakerTripped = false;
    // Reset shunts to initial unbalanced values, NOT 100 (which would auto-solve)
    this.state.shuntResistances = [50, 150, 20, 180, 100];
    this.lastShuntAudioVal = [50, 150, 20, 180, 100];
    this.audioEngine.playSwitchKnife();
    this.syncDom();

    this.eventBus.emit('ui:subtitle_changed', {
      text: 'Master circuit breaker reset. Bus rearmed to default resistance distribution.'
    });
  }

  private checkGridBalanced(): boolean {
    if (this.breakerTripped) return false;
    return this.state.shuntResistances.every(r => Math.abs(r - 100) <= 5);
  }

  private handleLeverThrow(): void {
    if (!this.checkGridBalanced() || this.state.gridBalanced) return;

    this.state.gridBalanced = true;
    this.audioEngine.playSwitchKnife();
    window.setTimeout(() => {
      this.audioEngine.playDoorHeavy();
    }, 200);
    window.setTimeout(() => {
      this.audioEngine.playPneumaticHiss();
    }, 450);
    this.syncDom();

    this.eventBus.emit('puzzle:synthesis_complete', {});

    this.eventBus.emit('ui:subtitle_changed', {
      text: 'Main hydraulic bus lever thrown. Blastdoor pneumatic seals disengaged. Threshold to Velvet Lounge unsealed.'
    });

    this.solveTimeoutId = window.setTimeout(() => {
      this.close();
      this.solveTimeoutId = null;
    }, 1200);
  }

  private syncDom(): void {
    if (!this.modalEl) return;

    // 1. Breaker status bar
    if (this.breakerStatusEl && this.btnResetBreakerEl) {
      if (this.breakerTripped) {
        this.breakerStatusEl.textContent = 'BREAKER TRIPPED // RESISTANCE OVERLOAD ON BUS';
        this.breakerStatusEl.style.color = '#ef4444';
        this.btnResetBreakerEl.classList.remove('hidden');
      } else if (this.state.gridBalanced) {
        this.breakerStatusEl.textContent = 'CIRCUIT BUS BALANCED // BLASTDOOR DECOUPLED';
        this.breakerStatusEl.style.color = '#22c55e';
        this.btnResetBreakerEl.classList.add('hidden');
      } else {
        this.breakerStatusEl.textContent = 'CIRCUIT BUS ARMED \u2022 NOMINAL LOAD REQUIRED: 100 \u03A9 PER CHANNEL';
        this.breakerStatusEl.style.color = '#94a3b8';
        this.btnResetBreakerEl.classList.add('hidden');
      }
    }

    // 2. Meters and sliders
    for (let i = 0; i < 5; i++) {
      const r = this.state.shuntResistances[i];
      const deflection = (r - 100) * 0.45; // -45 deg to +45 deg

      if (this.needleEls[i]) {
        this.needleEls[i].style.transform = `rotate(${deflection}deg)`;
      }

      if (this.sliderEls[i]) {
        this.sliderEls[i].value = r.toString();
        this.sliderEls[i].disabled = this.breakerTripped || this.state.gridBalanced;
      }

      if (this.labelEls[i]) {
        this.labelEls[i].textContent = `${r} \u03A9`;
        if (Math.abs(r - 100) <= 5) {
          this.labelEls[i].classList.add('balanced');
        } else {
          this.labelEls[i].classList.remove('balanced');
        }
      }
    }

    // 3. Bus Lever
    if (this.btnBusLeverEl) {
      const isReady = this.checkGridBalanced();
      this.btnBusLeverEl.disabled = !isReady || this.state.gridBalanced;

      if (this.state.gridBalanced) {
        this.btnBusLeverEl.textContent = 'BLASTDOOR SEALS DISENGAGED // EGRESS UNLOCKED';
        this.btnBusLeverEl.classList.add('unlocked');
      } else if (isReady) {
        this.btnBusLeverEl.textContent = 'PULL BUS LEVER // DISENGAGE HYDRAULIC BLAST CLAMPS';
        this.btnBusLeverEl.classList.add('ready');
      } else {
        this.btnBusLeverEl.textContent = 'DISENGAGE HYDRAULIC BLAST CLAMPS \u2022 EQUILIBRIUM REQUIRED';
        this.btnBusLeverEl.classList.remove('ready', 'unlocked');
      }
    }

    // 4. Strip Chart dynamic impedance monitor
    if (this.chartRecorder) {
      if (this.breakerTripped) {
        this.chartRecorder.setSpeed(0);
      } else if (this.state.gridBalanced) {
        this.chartRecorder.setSpeed(25);
        this.chartRecorder.setAmplitude(2);
      } else {
        this.chartRecorder.setSpeed(25);
        const totalImbalance = this.state.shuntResistances.reduce(
          (sum, r) => sum + Math.abs(r - 100),
          0
        );
        const dynamicAmp = Math.min(36, 4 + (totalImbalance / 500) * 32);
        this.chartRecorder.setAmplitude(dynamicAmp);
      }
    }
  }

  protected onOpened(): void {
    if (!this.breakerTripped) {
      this.chartRecorder?.setSpeed(25);
    }
    this.syncDom();
  }

  protected onClosed(): void {
    this.audioEngine.playDoorLatch();
    this.chartRecorder?.setSpeed(0);
    if (this.solveTimeoutId !== null) {
      window.clearTimeout(this.solveTimeoutId);
      this.solveTimeoutId = null;
    }
  }

  protected handleKeyDown(e: KeyboardEvent): void {
    if (this.state.gridBalanced) return;

    if (e.key === 'r' || e.key === 'R') {
      if (this.breakerTripped) this.handleResetBreaker();
    } else if (e.key === 'Enter') {
      if (this.checkGridBalanced()) this.handleLeverThrow();
    }
  }

  public getState(): Act07SynthesisState {
    return { ...this.state };
  }

  public hydrate(state: Act07SynthesisState): void {
    this.state = { ...state };
    this.syncDom();
  }

  public reset(): void {
    this.state = {
      insertedCrystals: ['crystal_01_quartz', 'crystal_02_bronze', 'crystal_03_amethyst', 'crystal_04_obsidian', 'crystal_05_celadon'],
      shuntResistances: [50, 150, 20, 180, 100],
      gridBalanced: false
    };
    this.breakerTripped = false;
    this.syncDom();
  }

  public stepControl(controlId: string, delta: number): void {
    const idx = parseInt(controlId.replace('shunt_', ''), 10);
    if (!isNaN(idx) && idx >= 0 && idx < 5) {
      const current = this.state.shuntResistances[idx];
      this.handleSliderChange(idx, Math.max(0, Math.min(200, current + delta)));
    }
  }

  public override teardown(): void {
    if (this.chartRecorder) {
      this.chartRecorder.destroy();
      this.chartRecorder = null;
    }
    super.teardown();
  }
}
