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

  protected previousActiveElement: HTMLElement | null = null;

  constructor() {
    this.eventBus = EventBus.getInstance();
  }

  public isOpen(): boolean {
    return this.isVisible;
  }

  public open(_initialData?: unknown): void {
    if (this.isVisible && this.modalEl && !this.modalEl.classList.contains('hidden')) return;
    this.isVisible = true;

    this.previousActiveElement = (typeof document !== 'undefined' && document.activeElement instanceof HTMLElement)
      ? document.activeElement
      : null;

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
    if (!this.isVisible && (!this.modalEl || this.modalEl.classList.contains('hidden'))) return;
    this.isVisible = false;

    if (this.modalEl) {
      this.modalEl.classList.add('hidden');
    }

    this.unbindKeyboardTrapping();

    if (this.previousActiveElement && typeof this.previousActiveElement.focus === 'function') {
      try {
        this.previousActiveElement.focus();
      } catch {
        // Safe focus restoration
      }
      this.previousActiveElement = null;
    }

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
        e.stopImmediatePropagation();
        this.close();
      } else if (e.key === 'Tab' && this.modalEl) {
        const focusable = Array.from(
          this.modalEl.querySelectorAll<HTMLElement>(
            'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
          )
        ).filter(el => el.offsetParent !== null || el.offsetWidth > 0 || el.offsetHeight > 0);

        if (focusable.length > 0) {
          const first = focusable[0];
          const last = focusable[focusable.length - 1];

          if (e.shiftKey) {
            if (document.activeElement === first || !this.modalEl.contains(document.activeElement)) {
              e.preventDefault();
              last.focus();
            }
          } else {
            if (document.activeElement === last || !this.modalEl.contains(document.activeElement)) {
              e.preventDefault();
              first.focus();
            }
          }
        } else {
          e.preventDefault();
        }
      } else {
        this.handleKeyDown(e);
      }
    };
    window.addEventListener('keydown', this.keydownHandler, true);
  }

  protected unbindKeyboardTrapping(): void {
    if (this.keydownHandler) {
      window.removeEventListener('keydown', this.keydownHandler, true);
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
