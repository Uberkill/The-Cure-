import { DiegeticScreenBase } from './DiegeticScreenBase';
import { Act06DirectorState } from '../../types/cure';
import { AudioEngine } from '../../audio/AudioEngine';
import { RotaryDial } from '../components/RotaryDial';
import { ReelTapeTransport, TransportState } from '../components/ReelTapeTransport';

export class WiretapTapeDeckScreen extends DiegeticScreenBase<Act06DirectorState> {
  public readonly id: string = 'screen-wiretap-tapedeck';

  private state: Act06DirectorState = {
    wiretapTapeSpeed: 'normal',
    dialedSequence: '',
    carriageClockTime: '12:00',
    safeUnlatched: false
  };

  private audioEngine: AudioEngine;
  private solveTimeoutId: number | null = null;
  private isPlaying: boolean = false;
  private rotaryDial: RotaryDial | null = null;
  private tapeTransport: ReelTapeTransport | null = null;

  private clockHours: number = 12;
  private clockMinutes: number = 0;

  private spoolLeftEl: HTMLElement | null = null;
  private spoolRightEl: HTMLElement | null = null;
  private transcriptEl: HTMLElement | null = null;
  private labelClockEl: HTMLElement | null = null;
  private labelDialedEl: HTMLElement | null = null;
  private btnUnlatchEl: HTMLButtonElement | null = null;

  public constructor() {
    super();
    this.audioEngine = AudioEngine.getInstance();
  }

  protected createModalElement(): HTMLElement {
    const el = document.createElement('div');
    el.id = this.id;
    el.className = 'overlay-screen diegetic-screen-overlay hidden';
    el.setAttribute('data-testid', 'screen-wiretap-tapedeck');
    el.innerHTML = `
      <div class="diegetic-housing wiretap-housing">
        <div class="diegetic-header">
          <span class="diegetic-model">NAGRA SN REEL-TO-REEL // EXECUTIVE AUDIOMETRIC CONSOLE</span>
          <button class="diegetic-btn-close" id="btn-close-wiretap" aria-label="Step back">DISENGAGE</button>
        </div>
        <div class="diegetic-body">
          <div class="wiretap-console-layout">
            <div class="tape-deck-panel">
              <div id="tape-transport-mount"></div>
              <div class="deck-top-spools" style="display: none;">
                <div class="spool-housing">
                  <div class="spool-hub left-spool" id="spool-left" data-testid="spool-left">
                    <div class="spool-spoke"></div>
                    <div class="spool-spoke"></div>
                    <div class="spool-spoke"></div>
                  </div>
                  <span class="spool-label">FEED REEL</span>
                </div>
                <div class="deck-vu-meter">
                  <span class="vu-title">DECIBEL LEVEL</span>
                  <div class="vu-needle-slot">
                    <div class="vu-needle" id="vu-needle"></div>
                  </div>
                  <span class="vu-scale">-20 &bull; -10 &bull; 0 &bull; +3 dB</span>
                </div>
                <div class="spool-housing">
                  <div class="spool-hub right-spool" id="spool-right" data-testid="spool-right">
                    <div class="spool-spoke"></div>
                    <div class="spool-spoke"></div>
                    <div class="spool-spoke"></div>
                  </div>
                  <span class="spool-label">TAKEUP REEL</span>
                </div>
              </div>

              <div class="tape-transcript-bay">
                <span class="bay-sublabel">MAGNETIC TAPE TRANSCRIPTION MONITOR</span>
                <div class="tape-transcript-text" id="tape-transcript" data-testid="tape-transcript">
                  [STANDBY // TAPE LOADED &bull; SELECT PLAYBACK SPEED]
                </div>
              </div>

              <div class="tape-transport-controls">
                <div class="transport-buttons">
                  <button class="btn-transport" id="btn-tape-play" data-testid="btn-tape-play">PLAY</button>
                  <button class="btn-transport" id="btn-tape-stop" data-testid="btn-tape-stop">STOP</button>
                  <button class="btn-transport" id="btn-tape-rewind" data-testid="btn-tape-rewind">REWIND</button>
                </div>
                <div class="speed-selector-cluster">
                  <span class="speed-title">SPEED CALIBRATION:</span>
                  <button class="btn-speed active" id="btn-speed-normal" data-testid="btn-speed-normal">1.0x [NORMAL]</button>
                  <button class="btn-speed" id="btn-speed-half" data-testid="btn-speed-half">0.5x [HALF-SPEED]</button>
                </div>
              </div>
            </div>

            <div class="executive-clock-panel">
              <div class="clock-escapement-bay">
                <span class="bay-title">DESK CARRIAGE CLOCK // ESCAPEMENT INTERLOCK</span>
                <div class="clock-face-display">
                  <span class="clock-time-value" id="label-clock-time" data-testid="label-clock-time">12:00</span>
                  <span class="clock-meridiem">AM</span>
                </div>
                <div class="clock-controls-grid">
                  <div class="clock-control-col">
                    <span class="col-title">HOUR</span>
                    <div class="btn-row">
                      <button class="btn-clock-step" id="btn-hour-minus" data-testid="btn-hour-minus">[ - ]</button>
                      <button class="btn-clock-step" id="btn-hour-plus" data-testid="btn-hour-plus">[ + ]</button>
                    </div>
                  </div>
                  <div class="clock-control-col">
                    <span class="col-title">MINUTE</span>
                    <div class="btn-row">
                      <button class="btn-clock-step" id="btn-min-minus" data-testid="btn-min-minus">[ - ]</button>
                      <button class="btn-clock-step" id="btn-min-plus" data-testid="btn-min-plus">[ + ]</button>
                    </div>
                  </div>
                </div>
              </div>

              <div class="rotary-phone-bay">
                <span class="bay-title">ROTARY RELAY OVERRIDE</span>
                <div class="dialed-readout">
                  <span class="dialed-label">DIALED:</span>
                  <span class="dialed-buffer" id="label-dialed-number" data-testid="label-dialed-number">----</span>
                  <button class="btn-clear-dial" id="btn-dial-clear" data-testid="btn-dial-clear">RESET</button>
                </div>
                <div id="rotary-dial-mount"></div>
              </div>

              <div class="safe-unlatch-lane">
                <button class="btn-unlatch-safe" id="btn-unlatch-safe" data-testid="btn-unlatch-safe" disabled>
                  MAGNETIC RELAY ENGAGED &bull; 11:03 REQUIRED
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    const btnClose = el.querySelector('#btn-close-wiretap');
    btnClose?.addEventListener('click', () => this.close());

    this.spoolLeftEl = el.querySelector('#spool-left');
    this.spoolRightEl = el.querySelector('#spool-right');
    this.transcriptEl = el.querySelector('#tape-transcript');
    this.labelClockEl = el.querySelector('#label-clock-time');
    this.labelDialedEl = el.querySelector('#label-dialed-number');
    this.btnUnlatchEl = el.querySelector('#btn-unlatch-safe');

    // Mount ReelTapeTransport
    const tapeMount = el.querySelector('#tape-transport-mount') as HTMLElement | null;
    if (tapeMount) {
      this.tapeTransport = new ReelTapeTransport(tapeMount, {
        label: 'NAGRA SN // WIRETAP SURVEILLANCE RECORDER',
        onStateChange: (state: TransportState) => {
          if (state === 'play') {
            this.handlePlayTape();
          } else if (state === 'stop') {
            this.handleStopTape();
          } else if (state === 'rewind') {
            this.handleRewindTape();
          }
        }
      });
    }

    // Mount RotaryDial
    const rotaryMount = el.querySelector('#rotary-dial-mount') as HTMLElement | null;
    if (rotaryMount) {
      this.rotaryDial = new RotaryDial(rotaryMount, {
        onDigitDialed: (digit: number) => {
          this.handleDialDigit(digit.toString());
        }
      });
    }

    // Transport buttons
    const btnPlay = el.querySelector('#btn-tape-play');
    btnPlay?.addEventListener('click', () => this.handlePlayTape());

    const btnStop = el.querySelector('#btn-tape-stop');
    btnStop?.addEventListener('click', () => this.handleStopTape());

    const btnRewind = el.querySelector('#btn-tape-rewind');
    btnRewind?.addEventListener('click', () => this.handleRewindTape());

    // Speed buttons
    const btnSpeedNorm = el.querySelector('#btn-speed-normal');
    btnSpeedNorm?.addEventListener('click', () => this.setTapeSpeed('normal'));

    const btnSpeedHalf = el.querySelector('#btn-speed-half');
    btnSpeedHalf?.addEventListener('click', () => this.setTapeSpeed('half'));

    // Clock buttons
    const btnHrPlus = el.querySelector('#btn-hour-plus');
    btnHrPlus?.addEventListener('click', () => this.adjustHour(1));

    const btnHrMinus = el.querySelector('#btn-hour-minus');
    btnHrMinus?.addEventListener('click', () => this.adjustHour(-1));

    const btnMinPlus = el.querySelector('#btn-min-plus');
    btnMinPlus?.addEventListener('click', () => this.adjustMinute(1));

    const btnMinMinus = el.querySelector('#btn-min-minus');
    btnMinMinus?.addEventListener('click', () => this.adjustMinute(-1));

    // Fallback rotary buttons if RotaryDial was not mounted
    if (!this.rotaryDial) {
      for (let d = 0; d <= 9; d++) {
        const btnDigit = el.querySelector(`#btn-dial-${d}`);
        btnDigit?.addEventListener('click', () => this.handleDialDigit(d.toString()));
      }
    }

    const btnClear = el.querySelector('#btn-dial-clear');
    btnClear?.addEventListener('click', () => this.clearDialedSequence());

    this.btnUnlatchEl?.addEventListener('click', () => {
      if (this.checkUnlockCondition()) {
        this.handleSolveTrigger();
      }
    });

    return el;
  }

  private handlePlayTape(): void {
    if (this.state.safeUnlatched) return;
    this.isPlaying = true;
    this.audioEngine.playTumblerClick();
    this.syncDom();
  }

  private handleStopTape(): void {
    this.isPlaying = false;
    this.audioEngine.playTumblerClick();
    this.syncDom();
  }

  private handleRewindTape(): void {
    this.isPlaying = true;
    this.state.wiretapTapeSpeed = 'rewind';
    this.audioEngine.playTumblerClick();
    this.syncDom();
  }

  private setTapeSpeed(speed: 'normal' | 'half'): void {
    this.state.wiretapTapeSpeed = speed;
    this.audioEngine.playTumblerClick();
    this.syncDom();
  }

  private adjustHour(delta: number): void {
    if (this.state.safeUnlatched) return;
    this.clockHours = ((this.clockHours - 1 + delta + 12) % 12) + 1;
    this.updateClockTime();
  }

  private adjustMinute(delta: number): void {
    if (this.state.safeUnlatched) return;
    this.clockMinutes = (this.clockMinutes + delta + 60) % 60;
    this.updateClockTime();
  }

  private updateClockTime(): void {
    const hh = this.clockHours.toString().padStart(2, '0');
    const mm = this.clockMinutes.toString().padStart(2, '0');
    this.state.carriageClockTime = `${hh}:${mm}`;
    this.audioEngine.playTumblerClick();
    this.syncDom();

    if (this.checkUnlockCondition()) {
      this.handleSolveTrigger();
    }
  }

  private handleDialDigit(digit: string): void {
    if (this.state.safeUnlatched) return;
    this.audioEngine.playTumblerClick();
    this.state.dialedSequence = (this.state.dialedSequence + digit).slice(-8);
    this.syncDom();

    if (this.checkUnlockCondition()) {
      this.handleSolveTrigger();
    }
  }

  private clearDialedSequence(): void {
    this.state.dialedSequence = '';
    this.audioEngine.playTumblerClick();
    this.syncDom();
  }

  private checkUnlockCondition(): boolean {
    const clockOk = this.state.carriageClockTime === '11:03';
    const dialedOk = this.state.dialedSequence.endsWith('1103');
    return clockOk || dialedOk;
  }

  public handleSolveTrigger(): void {
    if (this.state.safeUnlatched) return;
    this.state.safeUnlatched = true;

    this.audioEngine.playPneumaticHiss();
    this.audioEngine.playTumblerClick();
    this.syncDom();

    this.eventBus.emit('puzzle:safe_unlatched', {});

    this.eventBus.emit('ui:subtitle_changed', {
      text: 'Executive escapement aligns at 11:03. Magnetic relay disengaged. Secret mahogany drawer unlatches. Retrieve the Glowing Celadon Core crystal from the drawer.'
    });

    this.solveTimeoutId = window.setTimeout(() => {
      this.close();
      this.solveTimeoutId = null;
    }, 1200);
  }

  private syncDom(): void {
    if (!this.modalEl) return;

    // 1. Spool rotations
    if (this.spoolLeftEl && this.spoolRightEl) {
      this.spoolLeftEl.classList.remove('spinning-normal', 'spinning-half', 'spinning-rewind');
      this.spoolRightEl.classList.remove('spinning-normal', 'spinning-half', 'spinning-rewind');

      if (this.isPlaying) {
        const cls = this.state.wiretapTapeSpeed === 'half'
          ? 'spinning-half'
          : this.state.wiretapTapeSpeed === 'rewind'
            ? 'spinning-rewind'
            : 'spinning-normal';
        this.spoolLeftEl.classList.add(cls);
        this.spoolRightEl.classList.add(cls);
      }
    }

    // 2. Transcript
    if (this.transcriptEl) {
      if (!this.isPlaying) {
        this.transcriptEl.textContent = '[STANDBY // TAPE TRANSPORT HALTED • SELECT PLAY]';
        this.transcriptEl.style.color = '#94a3b8';
      } else if (this.state.wiretapTapeSpeed === 'rewind') {
        this.transcriptEl.textContent = '[HIGH-SPEED REWIND // SPOOLING BACKWARD]';
        this.transcriptEl.style.color = '#f59e0b';
      } else if (this.state.wiretapTapeSpeed === 'normal') {
        this.transcriptEl.textContent = '[1.0x PLAYBACK // HIGH-SPEED CHATTER: "...kzhht--limbic--fzzzt--unintelligible--switch to half-speed..."]';
        this.transcriptEl.style.color = '#4ade80';
      } else if (this.state.wiretapTapeSpeed === 'half') {
        this.transcriptEl.textContent = '[0.5x DECODED: "...Director memorandum: Limbic excision verified. Escapement lock: Three minutes past eleven (11:03)..."]';
        this.transcriptEl.style.color = '#38bdf8';
      }
    }

    // 3. Speed button highlights
    const btnNorm = this.modalEl.querySelector('#btn-speed-normal');
    const btnHalf = this.modalEl.querySelector('#btn-speed-half');
    if (this.state.wiretapTapeSpeed === 'half') {
      btnHalf?.classList.add('active');
      btnNorm?.classList.remove('active');
    } else {
      btnNorm?.classList.add('active');
      btnHalf?.classList.remove('active');
    }

    // 4. Clock readout
    if (this.labelClockEl) {
      this.labelClockEl.textContent = this.state.carriageClockTime;
    }

    // 5. Dialed sequence readout
    if (this.labelDialedEl) {
      this.labelDialedEl.textContent = this.state.dialedSequence ? this.state.dialedSequence : '----';
    }

    // 6. Safe button & Solved status
    if (this.btnUnlatchEl) {
      const isReady = this.checkUnlockCondition();
      this.btnUnlatchEl.disabled = !isReady || this.state.safeUnlatched;
      if (this.state.safeUnlatched) {
        this.btnUnlatchEl.textContent = 'DRAWER UNLATCHED // CELADON CORE SECURED';
        this.btnUnlatchEl.classList.add('unlocked');
      } else if (isReady) {
        this.btnUnlatchEl.textContent = 'RELAY DISENGAGED // UNLATCH SECRET DRAWER';
        this.btnUnlatchEl.classList.add('ready');
      } else {
        this.btnUnlatchEl.textContent = 'MAGNETIC RELAY ENGAGED • 11:03 REQUIRED';
        this.btnUnlatchEl.classList.remove('ready', 'unlocked');
      }
    }

    // 7. Sync tape transport widget
    if (this.tapeTransport) {
      this.tapeTransport.setSpeedMultiplier(this.state.wiretapTapeSpeed === 'half' ? 0.5 : 1.0);
      if (this.isPlaying) {
        this.tapeTransport.setState(this.state.wiretapTapeSpeed === 'rewind' ? 'rewind' : 'play');
      } else {
        this.tapeTransport.setState('stop');
      }
    }
  }

  protected onOpened(): void {
    this.syncDom();
  }

  protected onClosed(): void {
    this.isPlaying = false;
    this.tapeTransport?.setState('stop');
    if (this.solveTimeoutId !== null) {
      window.clearTimeout(this.solveTimeoutId);
      this.solveTimeoutId = null;
    }
  }

  protected handleKeyDown(e: KeyboardEvent): void {
    if (this.state.safeUnlatched) return;

    if (e.key >= '0' && e.key <= '9') {
      this.handleDialDigit(e.key);
    } else if (e.key === ' ') {
      e.preventDefault();
      if (this.isPlaying) {
        this.handleStopTape();
      } else {
        this.handlePlayTape();
      }
    } else if (e.key === 'ArrowUp') {
      this.adjustMinute(1);
    } else if (e.key === 'ArrowDown') {
      this.adjustMinute(-1);
    }
  }

  public getState(): Act06DirectorState {
    return { ...this.state };
  }

  public hydrate(state: Act06DirectorState): void {
    this.state = { ...state };
    if (this.state.carriageClockTime) {
      const parts = this.state.carriageClockTime.split(':');
      if (parts[0]) this.clockHours = parseInt(parts[0], 10);
      if (parts[1]) this.clockMinutes = parseInt(parts[1], 10);
    }
    this.syncDom();
  }

  public isSafeUnlatched(): boolean {
    return this.state.safeUnlatched;
  }

  public reset(): void {
    this.state = {
      wiretapTapeSpeed: 'normal',
      dialedSequence: '',
      carriageClockTime: '12:00',
      safeUnlatched: false
    };
    this.clockHours = 12;
    this.clockMinutes = 0;
    this.isPlaying = false;
    this.syncDom();
  }

  public stepControl(controlId: string, delta: number): void {
    if (controlId === 'minute') {
      this.adjustMinute(delta);
    } else if (controlId === 'hour') {
      this.adjustHour(delta);
    }
  }

  public override teardown(): void {
    if (this.tapeTransport) {
      this.tapeTransport.destroy();
      this.tapeTransport = null;
    }
    if (this.rotaryDial) {
      this.rotaryDial.destroy();
      this.rotaryDial = null;
    }
    super.teardown();
  }
}
