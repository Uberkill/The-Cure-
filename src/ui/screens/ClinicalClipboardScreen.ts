import { DiegeticScreenBase } from './DiegeticScreenBase';
import { ClinicalClipboard } from '../components/ClinicalClipboard';
import { AudioEngine } from '../../audio/AudioEngine';

export interface ClinicalClipboardState {
  activeSubject: string;
}

export class ClinicalClipboardScreen extends DiegeticScreenBase<ClinicalClipboardState> {
  public readonly id: string = 'screen-clinical-clipboard';

  private clipboardWidget: ClinicalClipboard | null = null;
  private clipboardMount: HTMLElement | null = null;
  private currentSubject: string = '101';

  protected createModalElement(): HTMLElement {
    const el = document.createElement('div');
    el.id = this.id;
    el.className = 'overlay-screen diegetic-screen-overlay hidden';
    el.setAttribute('data-testid', 'screen-clinical-clipboard');
    el.innerHTML = `
      <div class="diegetic-housing clipboard-modal-housing">
        <div class="diegetic-header">
          <span class="diegetic-model">ST. DYMPNA SANITARIUM // WARD 02 CLINICAL RECORDS</span>
          <button class="diegetic-btn-close" id="btn-close-clipboard" data-testid="btn-close-clipboard" aria-label="Step back">DISENGAGE</button>
        </div>
        <div class="diegetic-body clipboard-modal-body" id="clipboard-mount-container">
        </div>
      </div>
    `;

    const btnClose = el.querySelector('#btn-close-clipboard');
    btnClose?.addEventListener('click', () => this.close());

    // Click outside backdrop to dismiss
    el.addEventListener('click', (e) => {
      if (e.target === el) {
        this.close();
      }
    });

    this.clipboardMount = el.querySelector('#clipboard-mount-container');
    if (this.clipboardMount) {
      this.clipboardWidget = new ClinicalClipboard(this.clipboardMount, {
        initialSubject: this.currentSubject,
        onSelectSubject: (id) => {
          this.currentSubject = id;
        }
      });
    }

    return el;
  }

  public open(subjectId?: string): void {
    if (subjectId) {
      this.currentSubject = subjectId;
      if (this.clipboardWidget) {
        this.clipboardWidget.selectSubject(subjectId);
      }
    }
    super.open();
  }

  protected onOpened(): void {
    AudioEngine.getInstance().playPaperRustle();
    if (this.clipboardWidget) {
      this.clipboardWidget.selectSubject(this.currentSubject);
    }
  }

  protected onClosed(): void {
    AudioEngine.getInstance().playDoorLatch();
  }

  protected handleKeyDown(e: KeyboardEvent): void {
    // Arrow keys switch tabs between 101, 102, 103, 104
    const subjects = ['101', '102', '103', '104'];
    const idx = subjects.indexOf(this.currentSubject);
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      const nextIdx = (idx + 1) % subjects.length;
      this.selectSubject(subjects[nextIdx]);
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      const prevIdx = (idx - 1 + subjects.length) % subjects.length;
      this.selectSubject(subjects[prevIdx]);
    }
  }

  public selectSubject(subjectId: string): void {
    this.currentSubject = subjectId;
    if (this.clipboardWidget) {
      this.clipboardWidget.selectSubject(subjectId);
    }
  }

  public getState(): ClinicalClipboardState {
    return { activeSubject: this.currentSubject };
  }

  public hydrate(state: ClinicalClipboardState): void {
    if (state && state.activeSubject) {
      this.selectSubject(state.activeSubject);
    }
  }

  public reset(): void {
    this.selectSubject('101');
  }

  public stepControl(controlId: string, delta: number): void {
    if (controlId === 'subject') {
      const subjects = ['101', '102', '103', '104'];
      const idx = subjects.indexOf(this.currentSubject);
      const nextIdx = (idx + delta + subjects.length) % subjects.length;
      this.selectSubject(subjects[nextIdx]);
    }
  }

  public override teardown(): void {
    if (this.clipboardWidget) {
      this.clipboardWidget.destroy();
      this.clipboardWidget = null;
    }
    super.teardown();
  }
}
