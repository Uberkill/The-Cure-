import { IDiegeticScreen } from './IDiegeticScreen';
import { EventBus } from '../../core/EventBus';

/**
 * Abstract base class providing modal DOM lifecycle, focus trapping,
 * Escape key routing, and clean resource teardown for diegetic screens.
 */
export abstract class DiegeticScreenBase<TState = Record<string, unknown>> implements IDiegeticScreen<TState> {
  public abstract readonly id: string;
  public readonly isModal: boolean = true;

  protected modalEl: HTMLElement | null = null;
  protected eventBus: EventBus;
  protected isVisible: boolean = false;
  protected keydownHandler: ((e: KeyboardEvent) => void) | null = null;

  constructor() {
    this.eventBus = EventBus.getInstance();
  }

  public isOpen(): boolean {
    return this.isVisible;
  }

  public open(_initialData?: unknown): void {
    if (this.isVisible) return;
    this.isVisible = true;

    if (!this.modalEl) {
      this.modalEl = this.createModalElement();
      document.body.appendChild(this.modalEl);
    }

    this.modalEl.classList.remove('hidden');
    this.bindKeyboardTrapping();
    this.eventBus.emit('ui:modal_opened', {});
    this.onOpened();
  }

  public close(): void {
    if (!this.isVisible) return;
    this.isVisible = false;

    if (this.modalEl) {
      this.modalEl.classList.add('hidden');
    }

    this.unbindKeyboardTrapping();
    this.eventBus.emit('ui:modal_closed', {});
    this.onClosed();
  }

  public teardown(): void {
    this.close();
    if (this.modalEl && this.modalEl.parentNode) {
      this.modalEl.parentNode.removeChild(this.modalEl);
      this.modalEl = null;
    }
  }

  protected bindKeyboardTrapping(): void {
    this.keydownHandler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        const settingsEl = document.getElementById('modal-settings');
        if (settingsEl && !settingsEl.classList.contains('hidden')) {
          return;
        }
        e.preventDefault();
        this.close();
      } else {
        this.handleKeyDown(e);
      }
    };
    window.addEventListener('keydown', this.keydownHandler, false);
  }

  protected unbindKeyboardTrapping(): void {
    if (this.keydownHandler) {
      window.removeEventListener('keydown', this.keydownHandler, false);
      this.keydownHandler = null;
    }
  }

  protected abstract createModalElement(): HTMLElement;
  protected abstract onOpened(): void;
  protected abstract onClosed(): void;
  protected abstract handleKeyDown(e: KeyboardEvent): void;

  public abstract getState(): TState;
  public abstract hydrate(state: TState): void;
  public abstract reset(): void;
  public abstract stepControl(controlId: string, delta: number): void;
}
