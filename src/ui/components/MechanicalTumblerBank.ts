/**
 * Reusable Vintage Mechanical Tumbler Bank Widget.
 * Simulates a bank of heavy metal combination tumbler wheels with
 * cylindrical bevels, knurled thumbwheels, ratcheted mechanical step rotation,
 * and keyboard navigation.
 */

export interface TumblerWheelConfig {
  id: string;
  options: string[] | number[];
  initialIndex?: number;
  label?: string;
}

export interface TumblerBankOptions {
  wheels: TumblerWheelConfig[];
  onChange?: (values: string[]) => void;
  onUnlock?: () => void;
  targetCombination?: string[];
}

export class MechanicalTumblerBank {
  private container: HTMLElement;
  private wheels: TumblerWheelConfig[];
  private currentIndices: number[];
  private wheelElements: HTMLElement[] = [];
  private onChange?: (values: string[]) => void;
  private onUnlock?: () => void;
  private targetCombination?: string[];

  constructor(mountPoint: HTMLElement, options: TumblerBankOptions) {
    this.wheels = options.wheels;
    this.onChange = options.onChange;
    this.onUnlock = options.onUnlock;
    this.targetCombination = options.targetCombination;
    this.currentIndices = this.wheels.map(w => w.initialIndex ?? 0);

    this.container = document.createElement('div');
    this.container.className = 'mechanical-tumbler-bank-widget';
    this.container.setAttribute('role', 'group');
    this.container.setAttribute('aria-label', 'Mechanical Tumbler Combination Bank');

    const bankHousing = document.createElement('div');
    bankHousing.className = 'tumbler-bank-housing';

    this.wheels.forEach((wheel, idx) => {
      const wheelCol = document.createElement('div');
      wheelCol.className = 'tumbler-wheel-column';

      if (wheel.label) {
        const lbl = document.createElement('span');
        lbl.className = 'tumbler-column-label';
        lbl.textContent = wheel.label;
        wheelCol.appendChild(lbl);
      }

      // Step Up button
      const btnUp = document.createElement('button');
      btnUp.type = 'button';
      btnUp.className = 'tumbler-step-btn step-up';
      btnUp.setAttribute('aria-label', `Rotate ${wheel.label || `Wheel ${idx + 1}`} up`);
      btnUp.innerHTML = '&#9650;';
      btnUp.addEventListener('click', () => this.stepWheel(idx, -1));
      wheelCol.appendChild(btnUp);

      // Drum viewport
      const drumViewport = document.createElement('div');
      drumViewport.className = 'tumbler-drum-viewport';
      drumViewport.setAttribute('role', 'spinbutton');
      drumViewport.setAttribute('tabindex', '0');
      drumViewport.setAttribute('aria-label', wheel.label || `Wheel ${idx + 1}`);

      const drumFace = document.createElement('div');
      drumFace.className = 'tumbler-drum-face';
      drumFace.id = `tumbler-drum-${idx}`;
      drumViewport.appendChild(drumFace);
      this.wheelElements.push(drumFace);

      drumViewport.addEventListener('click', () => this.stepWheel(idx, 1));
      drumViewport.addEventListener('keydown', (e: KeyboardEvent) => {
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          this.stepWheel(idx, -1);
        } else if (e.key === 'ArrowDown' || e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
          this.stepWheel(idx, 1);
        }
      });

      wheelCol.appendChild(drumViewport);

      // Step Down button
      const btnDown = document.createElement('button');
      btnDown.type = 'button';
      btnDown.className = 'tumbler-step-btn step-down';
      btnDown.setAttribute('aria-label', `Rotate ${wheel.label || `Wheel ${idx + 1}`} down`);
      btnDown.innerHTML = '&#9660;';
      btnDown.addEventListener('click', () => this.stepWheel(idx, 1));
      wheelCol.appendChild(btnDown);

      bankHousing.appendChild(wheelCol);
    });

    this.container.appendChild(bankHousing);
    mountPoint.appendChild(this.container);

    this.updateDisplay();
  }

  public stepWheel(wheelIndex: number, direction: number): void {
    const wheel = this.wheels[wheelIndex];
    const total = wheel.options.length;
    this.currentIndices[wheelIndex] = (this.currentIndices[wheelIndex] + direction + total) % total;

    this.updateDisplay();

    const currentValues = this.getValues();
    if (this.onChange) {
      this.onChange(currentValues);
    }

    if (this.targetCombination) {
      const isMatched = this.targetCombination.every((val, i) => val === currentValues[i]);
      if (isMatched && this.onUnlock) {
        this.onUnlock();
      }
    }
  }

  public setValues(values: (string | number)[]): void {
    values.forEach((val, idx) => {
      if (idx < this.wheels.length) {
        const matchIdx = this.wheels[idx].options.findIndex(opt => String(opt) === String(val));
        if (matchIdx !== -1) {
          this.currentIndices[idx] = matchIdx;
        }
      }
    });
    this.updateDisplay();
  }

  public getValues(): string[] {
    return this.wheels.map((w, idx) => String(w.options[this.currentIndices[idx]]));
  }

  private updateDisplay(): void {
    this.wheelElements.forEach((el, idx) => {
      const wheel = this.wheels[idx];
      const currVal = String(wheel.options[this.currentIndices[idx]]);
      el.textContent = currVal;

      if (this.targetCombination && this.targetCombination[idx] === currVal) {
        el.classList.add('aligned');
      } else {
        el.classList.remove('aligned');
      }
    });
  }

  public destroy(): void {
    this.container.remove();
  }
}
