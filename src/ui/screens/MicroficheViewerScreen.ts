import { DiegeticScreenBase } from './DiegeticScreenBase';
import { Act05ArchiveState } from '../../types/cure';
import { AudioEngine } from '../../audio/AudioEngine';

export class MicroficheViewerScreen extends DiegeticScreenBase<Act05ArchiveState> {
  public readonly id: string = 'screen-microfiche-viewer';

  private state: Act05ArchiveState = {
    microfilmMounted: false,
    opticFocusLevel: 0.2,
    dispatchCoordinate: '',
    canisterDelivered: false
  };

  private audioEngine: AudioEngine;
  private solveTimeoutId: number | null = null;

  private selectedSector: string = 'ALPHA';
  private selectedStation: string = '01';

  private btnMountFilmEl: HTMLButtonElement | null = null;
  private documentViewEl: HTMLElement | null = null;
  private focusSliderEl: HTMLInputElement | null = null;
  private focusLabelEl: HTMLElement | null = null;
  private sectorButtons: HTMLButtonElement[] = [];
  private stationInputEl: HTMLInputElement | null = null;
  private coordinateLabelEl: HTMLElement | null = null;
  private btnLaunchEl: HTMLButtonElement | null = null;
  private hopperStatusEl: HTMLElement | null = null;

  public constructor() {
    super();
    this.audioEngine = AudioEngine.getInstance();
  }

  protected createModalElement(): HTMLElement {
    const el = document.createElement('div');
    el.id = this.id;
    el.className = 'overlay-screen diegetic-screen-overlay hidden';
    el.setAttribute('data-testid', 'screen-microfiche-viewer');
    el.innerHTML = `
      <div class="diegetic-housing microfiche-housing">
        <div class="diegetic-header">
          <span class="diegetic-model">OPTICAL MICROFICHE VIEWER // ARCHIVAL STORAGE SECTOR 05</span>
          <button class="diegetic-btn-close" id="btn-close-microfiche" aria-label="Step back">DISENGAGE</button>
        </div>
        <div class="diegetic-body">
          <div class="microfiche-console-layout">
            <div class="microfiche-projector-bay">
              <div class="projector-bezel">
                <div class="projection-screen" id="projection-screen">
                  <div class="projection-glass-glare"></div>
                  <div class="microfilm-document" id="microfilm-document">
                    <div class="doc-header">
                      <span class="doc-classification">RESTRICTED // SANATORIUM DIRECTIVE 09</span>
                      <span class="doc-title">SUBJECT 104 DISPATCH INDEX</span>
                    </div>
                    <div class="doc-body">
                      <p>EXCISION DIVISION: DEPT OF ACOUSTIC DISSOCIATION</p>
                      <p>PRIMARY ARCHIVAL VAULT: <span class="doc-highlight">SECTOR GAMMA</span></p>
                      <p>CANISTER PNEUMATIC TERMINAL: <span class="doc-highlight">STATION 07</span></p>
                      <p class="doc-note">DIRECTIVE: INSERT BRASS CANISTER &amp; ENGAGE VACUUM MANIFOLD TO RETRIEVE OBSIDIAN CORE.</p>
                    </div>
                  </div>
                  <div class="film-unmounted-notice" id="film-unmounted-notice">
                    NO FILM MOUNTED IN OPTICAL CARRIER.<br>INSERT MICROFILM REEL TO PROJECT.
                  </div>
                </div>
              </div>

              <div class="projector-controls-rack">
                <button class="btn-mount-film" id="btn-mount-film" data-testid="btn-mount-film">
                  MOUNT MICROFILM REEL [CLICK TO INSERT]
                </button>
                <div class="optic-focus-lane">
                  <label for="slider-optic-focus">OPTICAL LENS FOCUS</label>
                  <div class="focus-input-row">
                    <button class="btn-focus-step" id="btn-focus-minus" data-testid="btn-focus-minus">[ - ]</button>
                    <input type="range" min="0" max="100" value="20" id="slider-optic-focus" data-testid="slider-optic-focus">
                    <button class="btn-focus-step" id="btn-focus-plus" data-testid="btn-focus-plus">[ + ]</button>
                  </div>
                  <span class="focus-readout-pill" id="label-optic-focus" data-testid="label-optic-focus">20% [DEFOCUSED]</span>
                </div>
              </div>
            </div>

            <div class="pneumatic-dispatch-bay">
              <div class="bay-header">
                <span class="bay-title">PNEUMATIC TUBE TRANSPORT TERMINAL</span>
                <span class="hopper-status" id="hopper-status" data-testid="hopper-status">IDLE // TUBE VACUUM ARMED</span>
              </div>

              <div class="sector-matrix">
                <span class="matrix-label">SELECT DESTINATION SECTOR</span>
                <div class="sector-buttons-grid">
                  <button class="btn-sector active" data-sector="ALPHA" id="btn-sec-alpha">ALPHA</button>
                  <button class="btn-sector" data-sector="BETA" id="btn-sec-beta">BETA</button>
                  <button class="btn-sector" data-sector="GAMMA" id="btn-sec-gamma" data-testid="btn-sec-gamma">GAMMA</button>
                  <button class="btn-sector" data-sector="DELTA" id="btn-sec-delta">DELTA</button>
                </div>
              </div>

              <div class="station-selector-lane">
                <label for="input-dispatch-station">TERMINAL STATION (01 - 12)</label>
                <div class="station-input-row">
                  <input type="text" maxlength="2" value="01" id="input-dispatch-station" data-testid="input-dispatch-station">
                  <span class="coordinate-pill" id="label-dispatch-coordinate" data-testid="label-dispatch-coordinate">ALPHA-01</span>
                </div>
              </div>

              <div class="dispatch-action-lane">
                <button class="btn-pneumatic-launch" id="btn-pneumatic-launch" data-testid="btn-pneumatic-launch">
                  ENGAGE HIGH-VACUUM DISPATCH [LAUNCH]
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    const btnClose = el.querySelector('#btn-close-microfiche');
    btnClose?.addEventListener('click', () => this.close());

    this.btnMountFilmEl = el.querySelector('#btn-mount-film');
    this.documentViewEl = el.querySelector('#microfilm-document');
    this.focusSliderEl = el.querySelector('#slider-optic-focus');
    this.focusLabelEl = el.querySelector('#label-optic-focus');
    this.stationInputEl = el.querySelector('#input-dispatch-station');
    this.coordinateLabelEl = el.querySelector('#label-dispatch-coordinate');
    this.btnLaunchEl = el.querySelector('#btn-pneumatic-launch');
    this.hopperStatusEl = el.querySelector('#hopper-status');

    this.btnMountFilmEl?.addEventListener('click', () => this.handleMountFilmToggle());

    this.focusSliderEl?.addEventListener('input', () => {
      const val = parseInt(this.focusSliderEl!.value, 10) / 100;
      this.setFocusLevel(val);
    });

    const btnFocusMinus = el.querySelector('#btn-focus-minus');
    btnFocusMinus?.addEventListener('click', () => {
      this.setFocusLevel(Math.max(0, this.state.opticFocusLevel - 0.05));
    });

    const btnFocusPlus = el.querySelector('#btn-focus-plus');
    btnFocusPlus?.addEventListener('click', () => {
      this.setFocusLevel(Math.min(1.0, this.state.opticFocusLevel + 0.05));
    });

    const sectors = ['ALPHA', 'BETA', 'GAMMA', 'DELTA'];
    sectors.forEach(sec => {
      const btn = el.querySelector(`[data-sector="${sec}"]`) as HTMLButtonElement;
      if (btn) {
        this.sectorButtons.push(btn);
        btn.addEventListener('click', () => this.handleSelectSector(sec));
      }
    });

    this.stationInputEl?.addEventListener('input', () => {
      let val = this.stationInputEl!.value.trim();
      if (val.length === 1 && !isNaN(parseInt(val, 10))) {
        val = `0${val}`;
      }
      this.selectedStation = val;
      this.updateCoordinate();
    });

    this.btnLaunchEl?.addEventListener('click', () => this.handleLaunchDispatch());

    return el;
  }

  private handleMountFilmToggle(): void {
    if (this.state.canisterDelivered) return;

    this.state.microfilmMounted = !this.state.microfilmMounted;
    this.audioEngine.playTumblerClick();
    this.syncDom();

    if (this.state.microfilmMounted) {
      this.eventBus.emit('ui:subtitle_changed', {
        text: 'Microfilm reel mounted into optical carriage. Adjust optical focus ring to resolve emulsion.'
      });
    } else {
      this.eventBus.emit('ui:subtitle_changed', {
        text: 'Microfilm reel disengaged from carrier.'
      });
    }
  }

  private setFocusLevel(level: number): void {
    this.state.opticFocusLevel = Math.round(level * 100) / 100;
    this.audioEngine.playTumblerClick();
    this.syncDom();
  }

  private handleSelectSector(sector: string): void {
    this.selectedSector = sector;
    this.audioEngine.playTumblerClick();
    this.updateCoordinate();
  }

  private updateCoordinate(): void {
    const formatted = `${this.selectedSector}-${this.selectedStation.padStart(2, '0')}`;
    this.state.dispatchCoordinate = formatted;
    this.syncDom();
  }

  private handleLaunchDispatch(): void {
    if (this.state.canisterDelivered) return;

    if (!this.state.microfilmMounted) {
      this.audioEngine.playHandsetClick();
      this.eventBus.emit('ui:subtitle_changed', {
        text: 'Terminal interlock: Mount and inspect microfilm directory before initiating dispatch.'
      });
      return;
    }

    const targetCoord = 'GAMMA-07';
    if (this.state.dispatchCoordinate === targetCoord) {
      this.handleSolveTrigger();
    } else {
      this.audioEngine.playHandsetClick();
      if (this.hopperStatusEl) {
        this.hopperStatusEl.textContent = 'DISPATCH FAILED // INVALID SECTOR ROUTING';
        this.hopperStatusEl.style.color = '#ef4444';
      }
      this.eventBus.emit('ui:subtitle_changed', {
        text: `Dispatch to ${this.state.dispatchCoordinate} rejected: Pneumatic routing error. Consult focused directory.`
      });
    }
  }

  public handleSolveTrigger(): void {
    if (this.state.canisterDelivered) return;
    this.state.canisterDelivered = true;

    this.audioEngine.playPneumaticHiss();
    this.audioEngine.playTumblerClick();
    this.syncDom();

    this.eventBus.emit('puzzle:canister_delivered', {});

    this.eventBus.emit('ui:subtitle_changed', {
      text: 'Pneumatic vacuum engaged. Canister arrives with a metallic clang from Sector GAMMA-07, unlatching Filing Drawer 104. Retrieve the Pitch-Black Obsidian crystal from the drawer.'
    });

    this.solveTimeoutId = window.setTimeout(() => {
      this.close();
      this.solveTimeoutId = null;
    }, 1200);
  }

  private syncDom(): void {
    if (!this.modalEl) return;

    // 1. Film mount button
    if (this.btnMountFilmEl) {
      this.btnMountFilmEl.textContent = this.state.microfilmMounted
        ? 'MICROFILM REEL MOUNTED: ARCHIVE-104 [CLICK TO EJECT]'
        : 'MOUNT MICROFILM REEL [CLICK TO INSERT]';
      if (this.state.microfilmMounted) {
        this.btnMountFilmEl.classList.add('active');
      } else {
        this.btnMountFilmEl.classList.remove('active');
      }
    }

    // 2. Optical screen visibility and focus blur
    const unmountedNotice = this.modalEl.querySelector('#film-unmounted-notice') as HTMLElement;
    if (unmountedNotice) {
      unmountedNotice.style.display = this.state.microfilmMounted ? 'none' : 'block';
    }

    if (this.documentViewEl) {
      this.documentViewEl.style.display = this.state.microfilmMounted ? 'block' : 'none';

      // Distance from optimal focal band [0.85, 0.90]
      let dist = 0;
      if (this.state.opticFocusLevel < 0.85) {
        dist = 0.85 - this.state.opticFocusLevel;
      } else if (this.state.opticFocusLevel > 0.90) {
        dist = this.state.opticFocusLevel - 0.90;
      }

      const blurPx = Math.round(dist * 20 * 10) / 10;
      const opacity = Math.max(0.25, 1 - dist * 1.5);
      this.documentViewEl.style.filter = `blur(${blurPx}px)`;
      this.documentViewEl.style.opacity = `${opacity}`;
    }

    // 3. Focus slider and label
    if (this.focusSliderEl) {
      this.focusSliderEl.value = `${Math.round(this.state.opticFocusLevel * 100)}`;
    }
    if (this.focusLabelEl) {
      const pct = Math.round(this.state.opticFocusLevel * 100);
      const isSharp = this.state.opticFocusLevel >= 0.85 && this.state.opticFocusLevel <= 0.90;
      this.focusLabelEl.textContent = `${pct}% [${isSharp ? 'RESOLVED' : 'DEFOCUSED'}]`;
      if (isSharp) {
        this.focusLabelEl.classList.add('focused');
      } else {
        this.focusLabelEl.classList.remove('focused');
      }
    }

    // 4. Sector buttons
    this.sectorButtons.forEach(btn => {
      if (btn.getAttribute('data-sector') === this.selectedSector) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // 5. Station input and coordinate label
    if (this.stationInputEl) {
      this.stationInputEl.value = this.selectedStation;
    }
    if (this.coordinateLabelEl) {
      this.coordinateLabelEl.textContent = this.state.dispatchCoordinate || `${this.selectedSector}-${this.selectedStation.padStart(2, '0')}`;
    }

    // 6. Solved state
    if (this.state.canisterDelivered) {
      if (this.hopperStatusEl) {
        this.hopperStatusEl.textContent = 'CANISTER DELIVERED // OBSIDIAN CORE UNLATCHED';
        this.hopperStatusEl.style.color = '#22c55e';
      }
      if (this.btnLaunchEl) {
        this.btnLaunchEl.disabled = true;
        this.btnLaunchEl.textContent = 'DISPATCH COMPLETED';
      }
      if (this.btnMountFilmEl) {
        this.btnMountFilmEl.disabled = true;
      }
    }
  }

  protected onOpened(): void {
    if (!this.state.dispatchCoordinate) {
      this.updateCoordinate();
    }
    this.syncDom();
  }

  protected onClosed(): void {
    if (this.solveTimeoutId !== null) {
      window.clearTimeout(this.solveTimeoutId);
      this.solveTimeoutId = null;
    }
  }

  protected handleKeyDown(e: KeyboardEvent): void {
    if (this.state.canisterDelivered) return;

    if (e.key === '[' || e.key === '-') {
      this.setFocusLevel(Math.max(0, this.state.opticFocusLevel - 0.05));
    } else if (e.key === ']' || e.key === '=') {
      this.setFocusLevel(Math.min(1.0, this.state.opticFocusLevel + 0.05));
    } else if (e.key === 'm' || e.key === 'M') {
      this.handleMountFilmToggle();
    } else if (e.key === 'Enter') {
      this.handleLaunchDispatch();
    }
  }

  public getState(): Act05ArchiveState {
    return { ...this.state };
  }

  public hydrate(state: Act05ArchiveState): void {
    this.state = { ...state };
    if (this.state.dispatchCoordinate) {
      const parts = this.state.dispatchCoordinate.split('-');
      if (parts[0]) this.selectedSector = parts[0];
      if (parts[1]) this.selectedStation = parts[1];
    }
    this.syncDom();
  }

  public isCanisterDelivered(): boolean {
    return this.state.canisterDelivered;
  }

  public reset(): void {
    this.state = {
      microfilmMounted: false,
      opticFocusLevel: 0.2,
      dispatchCoordinate: '',
      canisterDelivered: false
    };
    this.selectedSector = 'ALPHA';
    this.selectedStation = '01';
    this.syncDom();
  }

  public stepControl(controlId: string, delta: number): void {
    if (controlId === 'focus') {
      this.setFocusLevel(Math.max(0, Math.min(1.0, this.state.opticFocusLevel + delta)));
    }
  }
}
