/**
 * Standard lifecycle and state contract for all diegetic hardware screens.
 */

export interface IDiegeticScreen<TState = Record<string, unknown>> {
  readonly id: string;
  readonly isModal: boolean;
  isOpen(): boolean;

  open(initialData?: unknown): void;
  close(): void;
  teardown(): void;

  getState(): TState;
  hydrate(state: TState): void;
  reset(): void;

  stepControl(controlId: string, delta: number): void;
}
