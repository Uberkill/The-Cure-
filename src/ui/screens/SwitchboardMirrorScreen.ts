import { DiegeticScreenBase } from './DiegeticScreenBase';
import { Act08VelvetLoungeState } from '../../types/cure';
import { AudioEngine } from '../../audio/AudioEngine';
import { PatchMatrix, PatchSocket } from '../components/PatchMatrix';

export class SwitchboardMirrorScreen extends DiegeticScreenBase<Act08VelvetLoungeState> {
  public readonly id: string = 'screen-switchboard-mirror';

  private state: Act08VelvetLoungeState = {
    decanterPlaced: false,
    switchboardPatched: false,
    payphoneRinging: true,
    complianceConfirmed: false
  };

  private audioEngine: AudioEngine;
  private solveTimeoutId: number | null = null;
  private patchMatrix: PatchMatrix | null = null;

  private selectedTrunk: string | null = null;
  private selectedLine: string | null = null;

  private btnDecanterEl: HTMLButtonElement | null = null;
  private mirrorReflectionEl: HTMLElement | null = null;
  private trunkButtons: HTMLButtonElement[] = [];
  private lineButtons: HTMLButtonElement[] = [];
  private patchStatusEl: HTMLElement | null = null;
  private btnAnswerClimaxEl: HTMLButtonElement | null = null;

  public constructor() {
    super();
    this.audioEngine = AudioEngine.getInstance();
  }

  protected createModalElement(): HTMLElement {
    const el = document.createElement('div');
    el.id = this.id;
    el.className = 'overlay-screen diegetic-screen-overlay hidden';
    el.setAttribute('data-testid', 'screen-switchboard-mirror');
    el.innerHTML = `
      <div class="diegetic-housing switchboard-housing">
        <div class="diegetic-header">
          <span class="diegetic-model">OPERATOR SWITCHBOARD // SUBWAY DEPLOYMENT TERMINAL</span>
          <button class="diegetic-btn-close" id="btn-close-switchboard" aria-label="Step back">DISENGAGE</button>
        </div>
        <div class="diegetic-body">
          <div class="switchboard-console-layout">
            <div class="mirror-paradox-panel">
              <span class="panel-heading">GILDED OBSERVATION MIRROR // PARADOX ALIGNMENT</span>
              <div class="mirror-viewport" id="mirror-viewport">
                <div class="mirror-reflection-frame" id="mirror-reflection">
                  <div class="reflection-silhouette"></div>
                  <div class="reflection-table">
                    <span class="reflection-decanter-ghost" id="decanter-ghost">
                      [REFLECTED DECANTER PRESENT]
                    </span>
                  </div>
                </div>
              </div>
              <button class="btn-place-decanter" id="btn-place-decanter" data-testid="btn-place-decanter">
                PLACE CRYSTAL DECANTER ON PHYSICAL TABLE
              </button>
            </div>

            <div class="operator-switchboard-panel">
              <span class="panel-heading">1950s OPERATOR SWITCHBOARD // TRUNK PATCHBAY</span>
              
              <div class="patch-status-annunciator">
                <span class="patch-status-label" id="label-patch-status" data-testid="label-patch-status">
                  STATUS: OPEN CIRCUITS &bull; CONNECT TRUNK 104 TO LINE 4
                </span>
              </div>

              <div class="jacks-section" id="jacks-section"></div>

              <div class="climax-trigger-lane">
                <button class="answer-climax-btn" id="btn-answer-climax" data-testid="btn-answer-climax" disabled>
                  ANSWER RINGING PAYPHONE &bull; PARADOX ALIGNMENT REQUIRED
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    const btnClose = el.querySelector('#btn-close-switchboard');
    btnClose?.addEventListener('click', () => this.close());

    this.btnDecanterEl = el.querySelector('#btn-place-decanter');
    this.mirrorReflectionEl = el.querySelector('#mirror-reflection');
    this.patchStatusEl = el.querySelector('#label-patch-status');
    this.btnAnswerClimaxEl = el.querySelector('#btn-answer-climax');

    this.btnDecanterEl?.addEventListener('click', () => this.handleToggleDecanter());

    // Mount PatchMatrix with authentic brutalist jacks and catenary cords
    const jacksMount = el.querySelector('#jacks-section') as HTMLElement | null;
    if (jacksMount) {
      const sockets: PatchSocket[] = [
        { id: 'jack-trunk-101', label: 'TRUNK 101', roomCode: 'TRUNK 101', dataAttrs: { 'data-trunk': '101' } },
        { id: 'jack-trunk-102', label: 'TRUNK 102', roomCode: 'TRUNK 102', dataAttrs: { 'data-trunk': '102' } },
        { id: 'jack-trunk-103', label: 'TRUNK 103', roomCode: 'TRUNK 103', dataAttrs: { 'data-trunk': '103' } },
        { id: 'jack-trunk-104', label: 'TRUNK 104', roomCode: 'TRUNK 104', dataAttrs: { 'data-trunk': '104' } },
        { id: 'jack-line-1', label: 'LINE 1', roomCode: 'OUTPUT 1', dataAttrs: { 'data-line': '1' } },
        { id: 'jack-line-2', label: 'LINE 2', roomCode: 'OUTPUT 2', dataAttrs: { 'data-line': '2' } },
        { id: 'jack-line-3', label: 'LINE 3', roomCode: 'OUTPUT 3', dataAttrs: { 'data-line': '3' } },
        { id: 'jack-line-4', label: 'LINE 4', roomCode: 'OUTPUT 4', dataAttrs: { 'data-line': '4' } }
      ];

      this.patchMatrix = new PatchMatrix(jacksMount, {
        title: 'TRUNK & LINE MATRIX // DUAL-TIER PATCHBAY',
        gridColumns: 4,
        sockets,
        onSocketClick: (socketId: string) => {
          if (socketId.startsWith('jack-trunk-')) {
            const trunk = socketId.replace('jack-trunk-', '');
            this.handleSelectTrunk(trunk);
          } else if (socketId.startsWith('jack-line-')) {
            const line = socketId.replace('jack-line-', '');
            this.handleSelectLine(line);
          }
        }
      });
    }

    if (!this.patchMatrix) {
      ['101', '102', '103', '104'].forEach(t => {
        const btn = el.querySelector(`#jack-trunk-${t}`) as HTMLButtonElement;
        if (btn) {
          this.trunkButtons.push(btn);
          btn.addEventListener('click', () => this.handleSelectTrunk(t));
        }
      });

      ['1', '2', '3', '4'].forEach(l => {
        const btn = el.querySelector(`#jack-line-${l}`) as HTMLButtonElement;
        if (btn) {
          this.lineButtons.push(btn);
          btn.addEventListener('click', () => this.handleSelectLine(l));
        }
      });
    } else {
      ['101', '102', '103', '104'].forEach(t => {
        const btn = el.querySelector(`#jack-trunk-${t}`) as HTMLButtonElement;
        if (btn) this.trunkButtons.push(btn);
      });

      ['1', '2', '3', '4'].forEach(l => {
        const btn = el.querySelector(`#jack-line-${l}`) as HTMLButtonElement;
        if (btn) this.lineButtons.push(btn);
      });
    }

    this.btnAnswerClimaxEl?.addEventListener('click', () => this.handleAnswerClimax());

    return el;
  }

  private handleToggleDecanter(): void {
    if (this.state.complianceConfirmed) return;

    this.state.decanterPlaced = !this.state.decanterPlaced;
    this.audioEngine.playGlassClink();
    this.syncDom();

    if (this.state.decanterPlaced) {
      this.eventBus.emit('ui:subtitle_changed', {
        text: 'Crystal decanter set on the physical mahogany table. The gilded mirror reflection ripples and aligns with reality.'
      });
    } else {
      this.eventBus.emit('ui:subtitle_changed', {
        text: 'Decanter removed. The mirror returns to an opaque, uncanny dissonance.'
      });
    }
  }

  private handleSelectTrunk(trunk: string): void {
    if (this.state.complianceConfirmed) return;
    this.selectedTrunk = trunk;
    this.audioEngine.playSwitchToggle();
    this.checkPatchPair();
  }

  private handleSelectLine(line: string): void {
    if (this.state.complianceConfirmed) return;
    this.selectedLine = line;
    this.audioEngine.playSwitchToggle();
    this.checkPatchPair();
  }

  private checkPatchPair(): void {
    if (!this.selectedTrunk || !this.selectedLine) {
      this.syncDom();
      return;
    }

    if (this.selectedTrunk === '104' && this.selectedLine === '4') {
      this.state.switchboardPatched = true;
      this.audioEngine.playSwitchToggle();
      this.syncDom();

      this.eventBus.emit('ui:subtitle_changed', {
        text: 'Switchboard patched: Trunk 104 connected to Line 4. The solitary payphone rings deafeningly.'
      });
    } else {
      this.state.switchboardPatched = false;
      this.audioEngine.playTumblerClick();
      const t = this.selectedTrunk;
      const l = this.selectedLine;
      this.selectedTrunk = null;
      this.selectedLine = null;
      this.syncDom();

      this.eventBus.emit('ui:subtitle_changed', {
        text: `Patch rejected (Trunk ${t} -> Line ${l}): Line impedance mismatch. Connect Subject Trunk 104 to Origin Line 4.`
      });
    }
  }

  private checkClimaxReady(): boolean {
    return this.state.decanterPlaced && this.state.switchboardPatched;
  }

  private handleAnswerClimax(): void {
    if (!this.checkClimaxReady() || this.state.complianceConfirmed) return;

    this.state.complianceConfirmed = true;
    this.audioEngine.stopPayphoneRing();
    this.audioEngine.playHandsetClick();
    this.syncDom();

    this.eventBus.emit('ui:subtitle_changed', {
      text: 'You lift the receiver. Total acoustic vacuum. A deadened, familiar voice speaks through the earpiece...'
    });

    this.audioEngine.speakTerminalMessage(() => {
      this.eventBus.emit('ui:subtitle_changed', {
        text: '"The exit is open. The cure is spreading. Thank you for your compliance."'
      });

      this.audioEngine.play528HzSonicBlast(4.0);

      this.solveTimeoutId = window.setTimeout(() => {
        this.close();
        this.eventBus.emit('ui:view_changed', { view: 'terminal_blackout' });
        this.solveTimeoutId = null;
      }, 800);
    });
  }

  private syncDom(): void {
    if (!this.modalEl) return;

    // 1. Decanter button & mirror reflection
    if (this.btnDecanterEl) {
      this.btnDecanterEl.textContent = this.state.decanterPlaced
        ? 'DECANTER ALIGNED [CLICK TO REMOVE]'
        : 'PLACE CRYSTAL DECANTER ON PHYSICAL TABLE';
      if (this.state.decanterPlaced) {
        this.btnDecanterEl.classList.add('active');
      } else {
        this.btnDecanterEl.classList.remove('active');
      }
    }

    if (this.mirrorReflectionEl) {
      if (this.state.decanterPlaced) {
        this.mirrorReflectionEl.classList.add('aligned');
      } else {
        this.mirrorReflectionEl.classList.remove('aligned');
      }
    }

    // 2. Trunk buttons
    this.trunkButtons.forEach(btn => {
      const t = btn.getAttribute('data-trunk');
      if (this.selectedTrunk === t || (this.state.switchboardPatched && t === '104')) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // 3. Line buttons
    this.lineButtons.forEach(btn => {
      const l = btn.getAttribute('data-line');
      if (this.selectedLine === l || (this.state.switchboardPatched && l === '4')) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // 4. Patch status label
    if (this.patchStatusEl) {
      if (this.state.switchboardPatched) {
        this.patchStatusEl.textContent = 'CIRCUIT PATCHED // TRUNK 104 \u2192 LINE 4 LOCKED';
        this.patchStatusEl.style.color = '#4ade80';
      } else {
        this.patchStatusEl.textContent = 'STATUS: OPEN CIRCUITS \u2022 CONNECT TRUNK 104 TO LINE 4';
        this.patchStatusEl.style.color = '#94a3b8';
      }
    }

    // 5. Climax Button
    if (this.btnAnswerClimaxEl) {
      const isReady = this.checkClimaxReady();
      this.btnAnswerClimaxEl.disabled = !isReady || this.state.complianceConfirmed;

      if (this.state.complianceConfirmed) {
        this.btnAnswerClimaxEl.textContent = 'TRANSMISSION COMPLETE // COMPLIANCE CONFIRMED';
        this.btnAnswerClimaxEl.classList.add('unlocked');
      } else if (isReady) {
        this.btnAnswerClimaxEl.textContent = 'ANSWER RINGING PAYPHONE // INITIATE TRANSMISSION';
        this.btnAnswerClimaxEl.classList.add('ready');
      } else {
        this.btnAnswerClimaxEl.textContent = 'ANSWER RINGING PAYPHONE \u2022 PARADOX ALIGNMENT REQUIRED';
        this.btnAnswerClimaxEl.classList.remove('ready', 'unlocked');
      }
    }

    // 6. Sync PatchMatrix cord routing
    if (this.patchMatrix) {
      if (this.state.switchboardPatched) {
        this.patchMatrix.setConnection('jack-trunk-104', 'jack-line-4');
      } else if (this.selectedTrunk) {
        this.patchMatrix.setSelectedSocket(`jack-trunk-${this.selectedTrunk}`);
      } else {
        this.patchMatrix.clearConnections();
      }
    }
  }

  protected onOpened(): void {
    this.syncDom();
  }

  protected onClosed(): void {
    this.audioEngine.playDoorLatch();
    if (this.solveTimeoutId !== null) {
      window.clearTimeout(this.solveTimeoutId);
      this.solveTimeoutId = null;
    }
  }

  protected handleKeyDown(e: KeyboardEvent): void {
    if (this.state.complianceConfirmed) return;

    if (e.key === 'd' || e.key === 'D') {
      this.handleToggleDecanter();
    } else if (e.key === 'Enter') {
      if (this.checkClimaxReady()) this.handleAnswerClimax();
    }
  }

  public getState(): Act08VelvetLoungeState {
    return { ...this.state };
  }

  public hydrate(state: Act08VelvetLoungeState): void {
    this.state = { ...state };
    this.syncDom();
  }

  public reset(): void {
    this.state = {
      decanterPlaced: false,
      switchboardPatched: false,
      payphoneRinging: true,
      complianceConfirmed: false
    };
    this.selectedTrunk = null;
    this.selectedLine = null;
    this.syncDom();
  }

  public stepControl(controlId: string, _delta: number): void {
    if (controlId === 'decanter') {
      this.handleToggleDecanter();
    }
  }

  public override teardown(): void {
    if (this.patchMatrix) {
      this.patchMatrix.destroy();
      this.patchMatrix = null;
    }
    super.teardown();
  }
}
