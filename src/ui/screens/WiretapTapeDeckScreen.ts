import { DiegeticScreenBase } from './DiegeticScreenBase';
import { Act06DirectorState } from '../../types/cure';

export class WiretapTapeDeckScreen extends DiegeticScreenBase<Act06DirectorState> {
  public readonly id: string = 'screen-wiretap-tapedeck';

  private state: Act06DirectorState = {
    wiretapTapeSpeed: 'normal',
    dialedSequence: '',
    carriageClockTime: '12:00',
    safeUnlatched: false
  };

  protected createModalElement(): HTMLElement {
    const el = document.createElement('div');
    el.id = this.id;
    el.className = 'overlay-screen diegetic-screen-overlay hidden';
    el.setAttribute('data-testid', 'screen-wiretap-tapedeck');
    el.innerHTML = `
      <div class="diegetic-housing wiretap-housing">
        <div class="diegetic-header">
          <span class="diegetic-model">NAGRA SN REEL-TO-REEL // EXECUTIVE TERMINAL</span>
          <button class="diegetic-btn-close" id="btn-close-wiretap" aria-label="Step back">DISENGAGE</button>
        </div>
        <div class="diegetic-body">
          <div class="tape-deck-spools">
            <div class="spool left-spool" id="spool-left"></div>
            <div class="spool right-spool" id="spool-right"></div>
          </div>
          <div class="tape-controls">
            <button id="btn-tape-play" data-testid="btn-tape-play">PLAY</button>
            <button id="btn-tape-halfspeed" data-testid="btn-tape-halfspeed">HALF-SPEED</button>
            <button id="btn-tape-rewind" data-testid="btn-tape-rewind">REWIND</button>
          </div>
          <div class="rotary-phone-faceplate">
            <div class="rotary-dial-wheel" id="rotary-wheel" data-testid="rotary-wheel"></div>
          </div>
        </div>
      </div>
    `;
    const btnClose = el.querySelector('#btn-close-wiretap');
    btnClose?.addEventListener('click', () => this.close());
    return el;
  }

  protected onOpened(): void {}
  protected onClosed(): void {}
  protected handleKeyDown(_e: KeyboardEvent): void {}

  public getState(): Act06DirectorState {
    return { ...this.state };
  }

  public hydrate(state: Act06DirectorState): void {
    this.state = { ...state };
  }

  public reset(): void {
    this.state = {
      wiretapTapeSpeed: 'normal',
      dialedSequence: '',
      carriageClockTime: '12:00',
      safeUnlatched: false
    };
  }

  public stepControl(_controlId: string, _delta: number): void {}
}
