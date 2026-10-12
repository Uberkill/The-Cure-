import { DiegeticScreenBase } from './DiegeticScreenBase';
import { Act03HydrotherapyState } from '../../types/cure';
import { AudioEngine } from '../../audio/AudioEngine';
import { CrystalId } from '../../types';

export class HydraulicManifoldScreen extends DiegeticScreenBase<Act03HydrotherapyState> {
  public readonly id: string = 'screen-hydraulic-manifold';

  private state: Act03HydrotherapyState = {
    tubWaterLevels: [4, 2, 0],
    submergedValveOpen: false,
    manifoldBalanced: false
  };

  private audioEngine: AudioEngine;
  private solveTimeoutId: number | null = null;

  private needleEl: HTMLElement | null = null;
  private labelPressureEl: HTMLElement | null = null;
  private waterLevelEls: HTMLElement[] = [];
  private levelReadoutEls: HTMLElement[] = [];
  private valveEls: HTMLButtonElement[] = [];
  private btnEmergencyDumpEl: HTMLButtonElement | null = null;
  private btnUnsealDrainEl: HTMLButtonElement | null = null;

  public constructor() {
    super();
    this.audioEngine = AudioEngine.getInstance();
  }

  protected createModalElement(): HTMLElement {
    const el = document.createElement('div');
    el.id = this.id;
    el.className = 'overlay-screen diegetic-screen-overlay hidden';
    el.setAttribute('data-testid', 'screen-hydraulic-manifold');
    el.innerHTML = `
      <div class="diegetic-housing manifold-housing">
        <div class="diegetic-header">
          <span class="diegetic-model">HYDROSTATIC MANIFOLD // IMMERSION BASIN 03 • SIPHON BALANCE</span>
          <button class="diegetic-btn-close" id="btn-close-manifold" aria-label="Step back">DISENGAGE</button>
        </div>
        <div class="diegetic-body">
          <div class="manifold-top-readout">
            <div class="bourdon-gauge-panel">
              <span class="gauge-title">DIFFERENTIAL PRESSURE (PSI)</span>
              <div class="bourdon-dial" id="bourdon-dial">
                <div class="gauge-tick-ring"></div>
                <div class="gauge-needle" id="gauge-needle" style="transform: rotate(45deg);"></div>
                <div class="gauge-center-cap"></div>
              </div>
              <span class="gauge-readout-value" id="label-pressure-psi" data-testid="label-pressure-psi">45.0 PSI</span>
            </div>

            <div class="sight-tubes-bank">
              <div class="sight-tube-col">
                <span class="tube-label">BASIN 01</span>
                <div class="sight-glass-well" id="sight-glass-0">
                  <div class="water-column" id="water-col-0" style="height: 100%;"></div>
                </div>
                <span class="tube-readout" id="readout-col-0">4 / 4</span>
              </div>
              <div class="sight-tube-col">
                <span class="tube-label">BASIN 02</span>
                <div class="sight-glass-well" id="sight-glass-1">
                  <div class="water-column" id="water-col-1" style="height: 50%;"></div>
                </div>
                <span class="tube-readout" id="readout-col-1">2 / 4</span>
              </div>
              <div class="sight-tube-col">
                <span class="tube-label">BASIN 03</span>
                <div class="sight-glass-well" id="sight-glass-2">
                  <div class="water-column" id="water-col-2" style="height: 0%;"></div>
                </div>
                <span class="tube-readout" id="readout-col-2">0 / 4</span>
              </div>
            </div>
          </div>

          <div class="manifold-controls-apron">
            <div class="valves-row">
              <button class="valve-wheel" id="valve-a" data-testid="valve-a">
                <span class="valve-name">VALVE A</span>
                <span class="valve-action">TRANSFER [1 &rarr; 2]</span>
              </button>
              <button class="valve-wheel" id="valve-b" data-testid="valve-b">
                <span class="valve-name">VALVE B</span>
                <span class="valve-action">TRANSFER [2 &rarr; 3]</span>
              </button>
              <button class="valve-wheel" id="valve-c" data-testid="valve-c">
                <span class="valve-name">VALVE C</span>
                <span class="valve-action">TRANSFER [3 &rarr; 1]</span>
              </button>
            </div>

            <div class="manifold-actions-row">
              <button class="emergency-dump-lever" id="btn-emergency-dump" data-testid="btn-emergency-dump">
                EMERGENCY SUMP BLOWOUT [RESET CHARGE]
              </button>
              <button class="btn-unseal-drain" id="btn-unseal-drain" data-testid="btn-unseal-drain" disabled>
                DRAIN GRATE SEALED &bull; 0.0 PSI REQUIRED
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    const btnClose = el.querySelector('#btn-close-manifold');
    btnClose?.addEventListener('click', () => this.close());

    this.needleEl = el.querySelector('#gauge-needle');
    this.labelPressureEl = el.querySelector('#label-pressure-psi');

    this.waterLevelEls = [
      el.querySelector('#water-col-0') as HTMLElement,
      el.querySelector('#water-col-1') as HTMLElement,
      el.querySelector('#water-col-2') as HTMLElement
    ];

    this.levelReadoutEls = [
      el.querySelector('#readout-col-0') as HTMLElement,
      el.querySelector('#readout-col-1') as HTMLElement,
      el.querySelector('#readout-col-2') as HTMLElement
    ];

    const vA = el.querySelector('#valve-a') as HTMLButtonElement;
    const vB = el.querySelector('#valve-b') as HTMLButtonElement;
    const vC = el.querySelector('#valve-c') as HTMLButtonElement;

    vA?.addEventListener('click', () => this.handleValveClick(0));
    vB?.addEventListener('click', () => this.handleValveClick(1));
    vC?.addEventListener('click', () => this.handleValveClick(2));
    this.valveEls = [vA, vB, vC];

    this.btnEmergencyDumpEl = el.querySelector('#btn-emergency-dump');
    this.btnEmergencyDumpEl?.addEventListener('click', () => this.handleEmergencyDump());

    this.btnUnsealDrainEl = el.querySelector('#btn-unseal-drain');
    this.btnUnsealDrainEl?.addEventListener('click', () => this.handleUnsealDrainClick());

    return el;
  }

  private calculatePressure(): number {
    const diff = Math.max(...this.state.tubWaterLevels) - Math.min(...this.state.tubWaterLevels);
    return Math.round(diff * 11.25 * 10) / 10;
  }

  private handleValveClick(valveIndex: number): void {
    if (this.state.manifoldBalanced) return;

    const levels = [...this.state.tubWaterLevels] as [number, number, number];

    let transferred = false;
    if (valveIndex === 0) {
      // Valve A: Transfer 1 -> 2
      if (levels[0] > 0 && levels[1] < 4) {
        levels[0]--;
        levels[1]++;
        transferred = true;
      }
    } else if (valveIndex === 1) {
      // Valve B: Transfer 2 -> 3
      if (levels[1] > 0 && levels[2] < 4) {
        levels[1]--;
        levels[2]++;
        transferred = true;
      }
    } else if (valveIndex === 2) {
      // Valve C: Transfer 3 -> 1
      if (levels[2] > 0 && levels[0] < 4) {
        levels[2]--;
        levels[0]++;
        transferred = true;
      }
    }

    if (transferred) {
      this.state.tubWaterLevels = levels;
      this.audioEngine.playWaterDrip();
      this.audioEngine.playTumblerClick();
      this.syncDom();

      const pressure = this.calculatePressure();
      if (pressure === 0.0) {
        this.handleBalanceAchieved();
      }
    } else {
      this.audioEngine.playTumblerClick();
      this.eventBus.emit('ui:subtitle_changed', {
        text: 'Valve resistance threshold reached. Target chamber capacity full or source chamber empty.'
      });
    }
  }

  private handleEmergencyDump(): void {
    if (this.state.manifoldBalanced) return;

    this.state.tubWaterLevels = [4, 2, 0];
    this.audioEngine.playPneumaticHiss();
    this.syncDom();

    this.eventBus.emit('ui:subtitle_changed', {
      text: 'Emergency sump blowout engaged. Hydraulic fluid flushed and reset to default charge [ 4 - 2 - 0 ].'
    });
  }

  private handleBalanceAchieved(): void {
    if (this.state.manifoldBalanced) return;
    this.state.manifoldBalanced = true;

    this.audioEngine.playPneumaticHiss();
    this.syncDom();

    this.eventBus.emit('puzzle:crystal_collected', {
      crystalId: 'crystal_02_bronze' as CrystalId,
      label: 'Drained Bronze'
    });

    this.eventBus.emit('ui:subtitle_changed', {
      text: 'Hydrostatic equilibrium confirmed [ 2 - 2 - 2 ]. Pressure stabilizes at 0.0 PSI. The floor drain hatch pops open, exposing the Oxidized Bronze crystal.'
    });

    this.solveTimeoutId = window.setTimeout(() => {
      this.close();
      this.solveTimeoutId = null;
    }, 1200);
  }

  private handleUnsealDrainClick(): void {
    if (this.calculatePressure() !== 0.0) return;
    this.handleBalanceAchieved();
  }

  protected onOpened(): void {
    this.syncDom();
  }

  protected onClosed(): void {
    if (this.solveTimeoutId !== null) {
      window.clearTimeout(this.solveTimeoutId);
      this.solveTimeoutId = null;
    }
  }

  protected handleKeyDown(e: KeyboardEvent): void {
    if (this.state.manifoldBalanced) return;

    if (e.key === '1' || e.key.toLowerCase() === 'a') {
      this.handleValveClick(0);
    } else if (e.key === '2' || e.key.toLowerCase() === 'b') {
      this.handleValveClick(1);
    } else if (e.key === '3' || e.key.toLowerCase() === 'c') {
      this.handleValveClick(2);
    } else if (e.key.toLowerCase() === 'r') {
      this.handleEmergencyDump();
    }
  }

  private syncDom(): void {
    const levels = this.state.tubWaterLevels;
    const psi = this.calculatePressure();

    if (this.labelPressureEl) {
      this.labelPressureEl.textContent = `${psi.toFixed(1)} PSI`;
    }

    if (this.needleEl) {
      // Map 0..60 PSI to -90deg..+90deg
      const angleDeg = -90 + (Math.min(psi, 60) / 60) * 180;
      this.needleEl.style.transform = `rotate(${angleDeg}deg)`;
    }

    levels.forEach((lvl, idx) => {
      const colEl = this.waterLevelEls[idx];
      const readoutEl = this.levelReadoutEls[idx];
      if (colEl) {
        colEl.style.height = `${(lvl / 4) * 100}%`;
      }
      if (readoutEl) {
        readoutEl.textContent = `${lvl} / 4`;
      }
    });

    const isSolved = this.state.manifoldBalanced;
    this.valveEls.forEach((btn) => {
      if (btn) btn.disabled = isSolved;
    });

    if (this.btnEmergencyDumpEl) {
      this.btnEmergencyDumpEl.disabled = isSolved;
    }

    if (this.btnUnsealDrainEl) {
      if (isSolved) {
        this.btnUnsealDrainEl.disabled = true;
        this.btnUnsealDrainEl.textContent = 'DRAIN HATCH UNSEALED • BRONZE CRYSTAL RECOVERED';
        this.btnUnsealDrainEl.classList.add('unlocked');
      } else if (psi === 0.0) {
        this.btnUnsealDrainEl.disabled = false;
        this.btnUnsealDrainEl.textContent = 'EQUILIBRIUM ACHIEVED • UNSEAL DRAIN GRATE';
        this.btnUnsealDrainEl.classList.add('ready');
      } else {
        this.btnUnsealDrainEl.disabled = true;
        this.btnUnsealDrainEl.textContent = `DRAIN GRATE SEALED • ${psi.toFixed(1)} PSI DIFFERENTIAL`;
        this.btnUnsealDrainEl.classList.remove('ready', 'unlocked');
      }
    }
  }

  public getState(): Act03HydrotherapyState {
    return { ...this.state };
  }

  public hydrate(state: Act03HydrotherapyState): void {
    this.state = { ...state };
    this.syncDom();
  }

  public reset(): void {
    this.state = {
      tubWaterLevels: [4, 2, 0],
      submergedValveOpen: false,
      manifoldBalanced: false
    };
    this.syncDom();
  }

  public stepControl(controlId: string, _delta: number): void {
    if (controlId === 'valve_a') this.handleValveClick(0);
    else if (controlId === 'valve_b') this.handleValveClick(1);
    else if (controlId === 'valve_c') this.handleValveClick(2);
    else if (controlId === 'emergency_dump') this.handleEmergencyDump();
  }
}
