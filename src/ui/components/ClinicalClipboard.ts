/**
 * Reusable Vintage Clinical Patient Clipboard Component.
 * Simulates a 1970s aluminium/Masonite medical clipboard with heavy brass spring clip,
 * Form 104-MED patient chart paper, tabbed subject selection (101-104),
 * vitals ECG/EEG waveform trace, typewriter notes, and rubber stamps.
 */

import { AudioEngine } from '../../audio/AudioEngine';

export interface PatientRecord {
  id: string;
  cot: string;
  name: string;
  status: string;
  cardiacBpm: number;
  notes: string;
  stamp?: string;
  isVacant?: boolean;
}

export const PATIENT_RECORDS: Record<string, PatientRecord> = {
  '101': {
    id: '101',
    cot: 'COT 101',
    name: 'SUBJECT 101 // MALE (ADMITTED 1974-03-12)',
    status: 'SOMNIFEROUS INDUCTION ACTIVE',
    cardiacBpm: 68,
    notes: 'Limbic sedation holding at therapeutic baseline. Resting cardiac tempo calibrated at 68 BPM. WARNING: Peristaltic infusion rate must match cardiac rhythm exactly to avoid autonomic neuro-shock.',
    stamp: 'CLASSIFIED CLINICAL RECORD'
  },
  '102': {
    id: '102',
    cot: 'COT 102',
    name: 'SUBJECT 102 // FEMALE (ADMITTED 1974-03-19)',
    status: 'VOCAL DESENSITIZATION COMPLETE',
    cardiacBpm: 72,
    notes: 'Acoustic vocal pathway severed under subliminal tone protocol. Subject is non-reactive. Mnemonic quartz crystal (Crystal 01) removed and secured inside Mobile Dispensary Cart under secondary lock.',
    stamp: 'MONITORED REGIMEN'
  },
  '103': {
    id: '103',
    cot: 'COT 103',
    name: 'SUBJECT 103 // MALE (ADMITTED 1974-04-02)',
    status: 'PHASE DEPRIVATION SLEEP',
    cardiacBpm: 62,
    notes: 'Continuous sleep cycle maintained via triple chemical infusion. NOTE: Mobile Dispensary Cart is double-locked. Outer security shutter is keyed to the 3-digit intake ID of the transferred subject [Vacant Cot 104].',
    stamp: 'RESTRICTED CLEARANCE'
  },
  '104': {
    id: '104',
    cot: 'COT 104 [VACANT]',
    name: 'SUBJECT 104 // UNKNOWN (TRANSFERRED)',
    status: 'COT VACANT • TRANSFERRED TO RECEPTION',
    cardiacBpm: 0,
    notes: 'Cot vacant. Subject transferred to Sterile Reception (Room 04). Patient Intake ID: 104. Sedative formulation was recorded directly on headboard under diagnostic ultraviolet illumination: [NITROUS] - [BROMIDE] - [VALERIAN].',
    stamp: 'TRANSFERRED TO ROOM 04',
    isVacant: true
  }
};

export interface ClinicalClipboardOptions {
  initialSubject?: string;
  onSelectSubject?: (id: string) => void;
  records?: Record<string, PatientRecord>;
  formHeader?: string;
  institutionHeader?: string;
  embossTitle?: string;
}

export class ClinicalClipboard {
  private container: HTMLElement;
  private currentSubjectId: string = '101';
  private tabButtons: Map<string, HTMLButtonElement> = new Map();
  private bodyEl: HTMLElement;
  private onSelectSubject?: (subjectId: string) => void;
  private records: Record<string, PatientRecord>;
  private formHeader: string;
  private institutionHeader: string;

  constructor(mountPoint: HTMLElement, options: ClinicalClipboardOptions = {}) {
    this.records = options.records || PATIENT_RECORDS;
    this.formHeader = options.formHeader || 'FORM 104-MED // WARD 02 SOMNIFEROUS LEDGER';
    this.institutionHeader = options.institutionHeader || 'ST. DYMPNA CLINICAL RESEARCH FACILITY';
    this.currentSubjectId = options.initialSubject || Object.keys(this.records)[0] || '101';
    this.onSelectSubject = options.onSelectSubject;

    this.container = document.createElement('div');
    this.container.className = 'clinical-clipboard-widget';
    this.container.setAttribute('role', 'region');
    this.container.setAttribute('aria-label', 'Clinical Patient Clipboard');

    // Heavy brass spring clip at top
    const clipEl = document.createElement('div');
    clipEl.className = 'clipboard-brass-clip';
    const emboss = options.embossTitle || 'SANITARIUM RECORD DEPT';
    clipEl.innerHTML = `
      <div class="clip-bracket">
        <div class="clip-rivet"></div>
        <span class="clip-emboss">${emboss}</span>
        <div class="clip-rivet"></div>
      </div>
      <div class="clip-spring-arm"></div>
    `;
    this.container.appendChild(clipEl);

    // Clipboard tabs bar
    const tabsBar = document.createElement('div');
    tabsBar.className = 'clipboard-tabs-bar';
    Object.keys(this.records).forEach(id => {
      const rec = this.records[id];
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `clipboard-tab-btn ${id === this.currentSubjectId ? 'active' : ''}`;
      btn.id = `tab-patient-${id}`;
      btn.setAttribute('data-testid', `tab-patient-${id}`);
      btn.textContent = rec.cot || (id === '104' ? 'COT 104 [VACANT]' : `SUBJECT ${id}`);
      btn.addEventListener('click', () => this.selectSubject(id));
      this.tabButtons.set(id, btn);
      tabsBar.appendChild(btn);
    });
    this.container.appendChild(tabsBar);

    // Paper dossier body
    this.bodyEl = document.createElement('div');
    this.bodyEl.className = 'clipboard-paper-body';
    this.container.appendChild(this.bodyEl);

    this.renderRecord(this.currentSubjectId);
    mountPoint.appendChild(this.container);
  }

  public selectSubject(subjectId: string): void {
    if (!this.records[subjectId]) return;
    if (this.currentSubjectId !== subjectId) {
      AudioEngine.getInstance().playPaperRustle();
    }
    this.currentSubjectId = subjectId;

    this.tabButtons.forEach((btn, id) => {
      if (id === subjectId) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    this.renderRecord(subjectId);
    if (this.onSelectSubject) {
      this.onSelectSubject(subjectId);
    }
  }

  private renderRecord(subjectId: string): void {
    const record = this.records[subjectId];
    if (!record) return;

    this.bodyEl.innerHTML = `
      <div class="paper-header">
        <div class="paper-title-block">
          <span class="paper-institution">${this.institutionHeader}</span>
          <span class="paper-form-id">${this.formHeader}</span>
        </div>
        <div class="paper-meta-badge ${record.isVacant ? 'badge-vacant' : ''}">
          ${record.cot}
        </div>
      </div>

      <div class="paper-divider"></div>

      <div class="patient-info-grid">
        <div class="info-field">
          <span class="field-label">SUBJECT IDENTIFIER:</span>
          <span class="field-value">${record.name}</span>
        </div>
        <div class="info-field">
          <span class="field-label">CLINICAL STATUS:</span>
          <span class="field-value status-highlight">${record.status}</span>
        </div>
        <div class="info-field">
          <span class="field-label">ATTENDING PHYSICIAN:</span>
          <span class="field-value">DR. K. VANCE // ARCHIVE CHIEF</span>
        </div>
        <div class="info-field">
          <span class="field-label">RESTING CARDIAC RATE:</span>
          <span class="field-value">${record.cardiacBpm > 0 ? `${record.cardiacBpm} BPM` : 'N/A (DISCHARGED)'}</span>
        </div>
      </div>

      <div class="vitals-strip-section">
        <span class="strip-label">TELEMETRY STRIP // LIMBIC ACTIVITY:</span>
        <div class="vitals-strip-graph">
          <svg viewBox="0 0 400 36" preserveAspectRatio="none" class="vitals-svg">
            <path d="${this.generateEcgPath(record.cardiacBpm)}" fill="none" stroke="#2D4A3E" stroke-width="1.8" />
          </svg>
        </div>
      </div>

      <div class="clinical-notes-section">
        <span class="notes-heading">PHYSICIAN OBSERVATION NOTES:</span>
        <div class="notes-typewriter-text" data-testid="clipboard-notes-text">
          ${record.notes}
        </div>
      </div>

      ${record.stamp ? `
        <div class="paper-rubber-stamp ${record.isVacant ? 'stamp-red' : 'stamp-amber'}">
          ${record.stamp}
        </div>
      ` : ''}
    `;
  }

  private generateEcgPath(bpm: number): string {
    if (bpm === 0) {
      return 'M 0 18 L 400 18';
    }
    const points: string[] = ['M 0 18'];
    const period = 50;
    for (let x = 0; x < 400; x += period) {
      points.push(`L ${x + 10} 18`);
      points.push(`L ${x + 14} 14`);
      points.push(`L ${x + 18} 18`);
      points.push(`L ${x + 22} 24`);
      points.push(`L ${x + 26} 4`);
      points.push(`L ${x + 30} 30`);
      points.push(`L ${x + 34} 18`);
      points.push(`L ${x + period} 18`);
    }
    return points.join(' ');
  }

  public getSubjectId(): string {
    return this.currentSubjectId;
  }

  public destroy(): void {
    this.container.remove();
  }
}
