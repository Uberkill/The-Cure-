import { DiegeticScreenBase } from './DiegeticScreenBase';
import { Act08VelvetLoungeState } from '../../types/cure';

export class SwitchboardMirrorScreen extends DiegeticScreenBase<Act08VelvetLoungeState> {
  public readonly id: string = 'screen-switchboard-mirror';

  private state: Act08VelvetLoungeState = {
    decanterPlaced: false,
    switchboardPatched: false,
    payphoneRinging: false,
    complianceConfirmed: false
  };

  protected createModalElement(): HTMLElement {
    const el = document.createElement('div');
    el.id = this.id;
    el.className = 'overlay-screen diegetic-screen-overlay hidden';
    el.setAttribute('data-testid', 'screen-switchboard-mirror');
    el.innerHTML = `
      <div class="diegetic-housing switchboard-housing">
        <div class="diegetic-header">
          <span class="diegetic-model">OPERATOR SWITCHBOARD // SUBWAY DEPLOYMENT</span>
          <button class="diegetic-btn-close" id="btn-close-switchboard" aria-label="Step back">DISENGAGE</button>
        </div>
        <div class="diegetic-body">
          <div class="jack-matrix" id="jack-matrix">
            <button class="patch-jack" id="jack-trunk-104" data-testid="jack-trunk-104">TRUNK 104</button>
            <button class="patch-jack" id="jack-line-4" data-testid="jack-line-4">LINE 4</button>
          </div>
          <button class="answer-climax-btn" id="btn-answer-climax" data-testid="btn-answer-climax">
            LIFT PAYPHONE HANDSET
          </button>
        </div>
      </div>
    `;
    const btnClose = el.querySelector('#btn-close-switchboard');
    btnClose?.addEventListener('click', () => this.close());
    return el;
  }

  protected onOpened(): void {}
  protected onClosed(): void {}
  protected handleKeyDown(_e: KeyboardEvent): void {}

  public getState(): Act08VelvetLoungeState {
    return { ...this.state };
  }

  public hydrate(state: Act08VelvetLoungeState): void {
    this.state = { ...state };
  }

  public reset(): void {
    this.state = {
      decanterPlaced: false,
      switchboardPatched: false,
      payphoneRinging: false,
      complianceConfirmed: false
    };
  }

  public stepControl(_controlId: string, _delta: number): void {}
}
