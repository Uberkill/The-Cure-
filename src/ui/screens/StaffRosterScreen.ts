import { DiegeticScreenBase } from './DiegeticScreenBase';
import { AudioEngine } from '../../audio/AudioEngine';

export interface ShiftLogEntry {
  time: string;
  location: string;
  entry: string;
}

export interface StaffDossier {
  id: string;
  name: string;
  role: string;
  wing: string;
  serialNumber: string;
  clearance: string;
  shiftHours: string;
  stamp: string;
  dutyLogs: ShiftLogEntry[];
  clinicalNotes: string;
  personalJournal: string;
  puzzleClueSummary: string;
}

export const STAFF_DOSSIERS: Record<string, StaffDossier> = {
  rostova: {
    id: 'rostova',
    name: 'ORDERLY K. ROSTOVA',
    role: 'Ward Attendant & Environmental Custodian',
    wing: 'Central Concourse (SL4-01-HUB)',
    serialNumber: 'ORD-74-099',
    clearance: 'Tier 1 • Environmental Maintenance',
    shiftHours: '05:00 - 13:00 (Morning Rounds)',
    stamp: 'DUTY CYCLE VERIFIED',
    dutyLogs: [
      { time: '05:30', location: 'Central Atrium', entry: 'Terrazzo floor polished. Fluorescent ballast 4B hum normalized to 60 Hz.' },
      { time: '06:15', location: 'Sterile Desk', entry: 'Inspection of apparatus. Borosilicate bell jar vacuum seal intact. Brass fuse shunt verified in position.' },
      { time: '08:00', location: 'Pneumatic Terminal', entry: 'Intake terminal pressurized at 145 kPa. Waste incinerator conduit cleared.' },
      { time: '11:45', location: 'North Corridor', entry: 'Observation corridor airlock inspection. Harmonic relay locked at 528 Hz baseline.' }
    ],
    clinicalNotes: 'All public concourse apparatus nominal. Central corridor blastdoor locked by pneumatic pressure seal until 528 Hz Lissajous resonance is completed on Tektronix 545B terminal.',
    personalJournal: 'The facility is too cold today. When I was polishing by the East wall at 03:00, the synchronous slave clock stuttered backwards for three seconds. When I peered into the Sleep Ward viewport, the linens on Cot 104 were rumpled, but the clipboard said the patient was already transferred to Reception. None of the physicians make eye contact anymore. I sign my log, take my pay slip, and do not ask questions.',
    puzzleClueSummary: 'Central Concourse: Slot the brass shunt into the fuse block on the desk, then sweep frequency to 528 Hz on the Tektronix 545B CRT.'
  },
  thorne: {
    id: 'thorne',
    name: 'DR. ARIS THORNE',
    role: 'Chief Somnologist & Attending Physician',
    wing: 'Wing A • Somnambulist Sleep Ward (SL4-02-SLP)',
    serialNumber: 'MED-71-402',
    clearance: 'Tier 3 • Clinical Somnology',
    shiftHours: '06:00 - 14:00 (Clinical Rounds)',
    stamp: 'CLINICAL CONFIDENTIAL',
    dutyLogs: [
      { time: '06:30', location: 'Ward Dormitory', entry: 'Morning rounds on Subjects 101, 102, 103. Limbic chemical sedation stable.' },
      { time: '08:30', location: 'Dispensary Cart', entry: 'Calibrated peristaltic drip. Aligned outer shutter lock to patient intake ID [1 - 0 - 4].' },
      { time: '10:00', location: 'Infusion Station', entry: 'Pacing infusion rate to resting cardiac tempo (68 BPM) to prevent neuro-shock.' },
      { time: '13:15', location: 'Cot 104', entry: 'Ultraviolet examination of headboard. Chemical triad [NITROUS - BROMIDE - VALERIAN] verified.' }
    ],
    clinicalNotes: 'The three-phase chemical regimen successfully dampens cognitive resistance. Mobile dispensary cart requires two-stage unlatching: 3-tumbler intake combination (1-0-4) followed by 68 BPM cardiac matching and sedative triad alignment.',
    personalJournal: 'We are not curing these people. When we retrieve the quartz crystal from the dispensary tray, the patient\'s limbic responses do not heal—they vanish entirely. Yesterday, Director Vandermeer ordered Cot 104 emptied and transferred to the central reception chamber without my counter-signature. I found scratch marks on the headboard in 104\'s frantic handwriting: "WHO AM I". I hid the mnemonic quartz crystal in the locked mobile cart. God forgive us.',
    puzzleClueSummary: 'Sleep Ward: Align tumblers to 1-0-4, match drip rate to 68 BPM, calibrate sedative triad (Nitrous, Bromide, Valerian), then collect the physical crystal.'
  },
  vance: {
    id: 'vance',
    name: 'SENIOR TECHNICIAN M. VANCE',
    role: 'Acoustic Resonance & Pneumatic Specialist',
    wing: 'Wing B • Audiology Vault & Sound Lock (SL4-04-AUD)',
    serialNumber: 'ENG-69-118',
    clearance: 'Tier 3 • Acoustic Resonance',
    shiftHours: '08:00 - 16:30 (Resonance Duty)',
    stamp: 'ACOUSTIC TEST CERTIFIED',
    dutyLogs: [
      { time: '08:45', location: 'Audiology Sound Lock', entry: 'Acoustic baffle foam inspection. Sound lock door pressurized.' },
      { time: '10:30', location: 'Flared Horn Arrays', entry: 'Directional horn calibration: Left Horn aligned to 45 deg, Right Horn to 135 deg.' },
      { time: '12:00', location: 'Chladni Table', entry: 'Binaural carrier generator tuned to 600 Hz. Phase inversion switch verified at 180 deg.' },
      { time: '15:15', location: 'Monolith Amplifier', entry: 'Secondary 741 Hz Solfeggio harmonic sweep tested for acoustic clamp release.' }
    ],
    clinicalNotes: 'Standing wave nodes create complete destructive phase cancellation. When horn angles (45 deg / 135 deg), carrier frequency (600 Hz), and 180 deg phase inversion align, acoustic null releases the clamped speaker cone.',
    personalJournal: 'The standing wave is not merely sound—it is an acoustic mirror. When I wear the Western Electric headphones in the monitoring alcove, I hear voices speaking between 590 Hz and 610 Hz. They are reciting the patient intake pledges from five years ago. I asked the Director why the acoustic baffling has fingernail scratches along the lower edges. He told me to adjust my angles and mind my decibels. I keep my silicone plugs in even when I sleep.',
    puzzleClueSummary: 'Audiology Vault: Orient Left Horn to 45 deg, Right Horn to 135 deg, set carrier to 600 Hz, flip phase toggle to 180 deg, then collect the amethyst crystal.'
  },
  cross: {
    id: 'cross',
    name: 'ARCHIVIST EVELYN CROSS',
    role: 'Chief Custodian of Microfilm & Records',
    wing: 'Wing B • Microfilm Depository (SL4-05-ARC)',
    serialNumber: 'ARC-66-024',
    clearance: 'Tier 4 • Archival Retention',
    shiftHours: '09:00 - 17:00 (Depository Custody)',
    stamp: 'PERMANENT RETENTION ARCHIVE',
    dutyLogs: [
      { time: '09:30', location: 'Microfilm Storage', entry: 'Security cabinet inspection. Cabinet 01 through Cabinet 07 indices cross-checked.' },
      { time: '11:15', location: 'Sorting Desk', entry: 'Oak card catalog verified. Subject 104 index card points to Sector GAMMA-07 dispatch.' },
      { time: '13:45', location: 'Microfiche Reader', entry: 'Optical condenser focus calibrated to 0.85 index. Film gate alignment true.' },
      { time: '16:00', location: 'Cabinet 7 (Drawer 104)', entry: 'Pneumatic transit lock engaged. Obsidian crystal safely retained inside drawer.' }
    ],
    clinicalNotes: 'Master intake organigram for Subject 104 is locked in Filing Cabinet 7 (Drawer 104). Pneumatic release unlatches exclusively upon canister delivery from Sector GAMMA-07 at 0.85 optical focus.',
    personalJournal: 'I found a yellowed intake requisition slip from 1968 signed by Evelyn Cross, requesting admission into the Cognitive Alignment program for severe melancholia. The signature is mine. The handwriting is mine. But I have worked here for eight years, haven\'t I? I checked the personnel registry: there have been four "Evelyn Crosses" since 1960. When the canister arrived today from GAMMA-07 with Subject 104\'s file, I did not burn it. I locked it into Drawer 104. If they erase me tomorrow, the next archivist will read this.',
    puzzleClueSummary: 'The Archive: Align microfiche optical focus to 0.85, launch canister from Sector GAMMA-07, open unsealed Drawer 104, and collect the obsidian crystal.'
  },
  vandermeer: {
    id: 'vandermeer',
    name: 'DIRECTOR H. VANDERMEER',
    role: 'Director of Cognitive Alignment & Project Legion',
    wing: 'Sector C • Executive Directorate & Deep Core (SL4-06-DIR)',
    serialNumber: 'DIR-62-001',
    clearance: 'Directorate Alpha • Sovereign Command',
    shiftHours: 'Continuous Residence (Executive Sanctum)',
    stamp: 'DIRECTORATE ALPHA • CONFIDENTIAL',
    dutyLogs: [
      { time: '07:30', location: 'Executive Desk', entry: 'Master synchronization of carriage escapement clock at eleven-zero-three (11:03).' },
      { time: '09:00', location: 'Wiretap Deck', entry: 'Intercepted surveillance reel loaded. Half-speed playback (0.5x) confirmed.' },
      { time: '11:03', location: 'Rotary Exchange', entry: 'Dialed 1-1-0-3 into executive telephone exchange. Magnetic drawer relay verified.' },
      { time: '18:00', location: 'Void Partition', entry: 'Final extraction protocol initiated for Subject 104. Alignment cycle nearing completion.' }
    ],
    clinicalNotes: 'The five memory crystals (Quartz, Bronze, Amethyst, Obsidian, Celadon) represent the fractured components of the human conscience. When all five are gathered and patched, emotional memory is permanently excised.',
    personalJournal: 'My daughter was eleven years and three months old when she died in the sub-level drainage flood. Eleven-zero-three. I built this facility so no human soul would ever have to bear that agony again. But to eliminate grief, one must eliminate love. To eliminate terror, one must eliminate will. Today I placed my own excised remorse into the Glowing Celadon Core and sealed it in my desk drawer. When the unplugged telephone rings across the void, there is no one left inside me to answer it.',
    puzzleClueSummary: 'Director\'s Office: Set tape speed to 0.5x, listen to the 11:03 whisper, set clock to 11:03, dial 1-1-0-3 on the rotary phone, and retrieve the celadon crystal.'
  }
};

export interface StaffRosterState {
  activeStaffId: string;
}

export class StaffRosterScreen extends DiegeticScreenBase<StaffRosterState> {
  public readonly id: string = 'screen-staff-roster';
  private static instance: StaffRosterScreen | null = null;
  private activeStaffId: string = 'rostova';

  private tabButtons: Map<string, HTMLButtonElement> = new Map();
  private dossierHeaderEl: HTMLElement | null = null;
  private dutyLogContainerEl: HTMLElement | null = null;
  private clinicalNotesEl: HTMLElement | null = null;
  private personalJournalEl: HTMLElement | null = null;
  private puzzleClueEl: HTMLElement | null = null;
  private stampBadgeEl: HTMLElement | null = null;

  public constructor() {
    super();
    this.setupBusListeners();
  }

  public static getInstance(): StaffRosterScreen {
    if (!StaffRosterScreen.instance) {
      StaffRosterScreen.instance = new StaffRosterScreen();
    }
    return StaffRosterScreen.instance;
  }

  private setupBusListeners(): void {
    this.eventBus.on('ui:open_staff_roster', ({ staffId }) => {
      this.open(staffId);
    });
  }

  public override open(staffId?: string): void {
    if (staffId && STAFF_DOSSIERS[staffId]) {
      this.activeStaffId = staffId;
    }
    if (this.isVisible) {
      this.renderActiveDossier();
      return;
    }
    super.open();
  }

  protected createModalElement(): HTMLElement {
    const el = document.createElement('div');
    el.id = this.id;
    el.className = 'overlay-screen diegetic-screen-overlay hidden';
    el.setAttribute('data-testid', 'screen-staff-roster');

    el.innerHTML = `
      <div class="diegetic-housing staff-roster-housing">
        <div class="diegetic-header">
          <div style="display: flex; align-items: center; gap: 12px;">
            <span class="diegetic-model">FORM 108-STAFF // SANATORIUM PERSONNEL LEDGER & SHIFT ROSTER</span>
          </div>
          <button class="diegetic-btn-close" id="btn-close-roster" data-testid="btn-close-roster" aria-label="Step back">DISENGAGE</button>
        </div>

        <div class="staff-roster-container">
          <!-- Personnel Tab Bar -->
          <div class="staff-roster-tabs" role="tablist">
            <button class="staff-tab-btn" data-staff="rostova" id="tab-staff-rostova">K. ROSTOVA<br><span class="tab-subtitle">CONCOURSE</span></button>
            <button class="staff-tab-btn" data-staff="thorne" id="tab-staff-thorne">DR. THORNE<br><span class="tab-subtitle">WING A • SLEEP</span></button>
            <button class="staff-tab-btn" data-staff="vance" id="tab-staff-vance">TECH VANCE<br><span class="tab-subtitle">WING B • AUD</span></button>
            <button class="staff-tab-btn" data-staff="cross" id="tab-staff-cross">E. CROSS<br><span class="tab-subtitle">WING B • ARC</span></button>
            <button class="staff-tab-btn" data-staff="vandermeer" id="tab-staff-vandermeer">DR. VANDERMEER<br><span class="tab-subtitle">SECTOR C • DIR</span></button>
          </div>

          <!-- Active Personnel Sheet (Vintage Cardstock Clipboard) -->
          <div class="staff-dossier-paper" id="staff-dossier-sheet">
            <div class="clipboard-metal-clip">
              <span class="clip-rivet"></span>
              <span class="clip-label">ST. DYMPNA SANATORIUM • PERSONNEL DEPT</span>
              <span class="clip-rivet"></span>
            </div>

            <!-- Header Info Box -->
            <div class="dossier-header-grid" id="dossier-header">
              <!-- Rendered dynamically -->
            </div>

            <!-- Two-Column Body: Left is Official Shift Log & Clinical Protocol; Right is Personal Confession Journal -->
            <div class="dossier-body-grid">
              <div class="dossier-col-official">
                <div class="dossier-section-title">DAILY WALKTHROUGH & SHIFT INSPECTION SCHEDULE</div>
                <div class="duty-log-table-wrap">
                  <table class="duty-log-table" id="duty-log-table">
                    <thead>
                      <tr>
                        <th style="width: 70px;">TIME</th>
                        <th style="width: 140px;">STATION</th>
                        <th>OBSERVATION / MAINTENANCE SIGN-OFF</th>
                      </tr>
                    </thead>
                    <tbody id="duty-log-tbody">
                      <!-- Dynamically rendered -->
                    </tbody>
                  </table>
                </div>

                <div class="dossier-section-title" style="margin-top: 16px;">OFFICIAL CLINICAL PROTOCOL & DISPATCH DIRECTIVE</div>
                <div class="dossier-protocol-box" id="dossier-protocol">
                  <!-- Dynamically rendered -->
                </div>

                <div class="dossier-clue-badge" id="dossier-clue-summary">
                  <!-- Dynamically rendered -->
                </div>
              </div>

              <div class="dossier-col-personal">
                <div class="dossier-section-title" style="color: var(--color-ink-faint, #64748b);">CONFIDENTIAL JOURNAL / RECOVERED FIELD NOTES</div>
                <div class="personal-journal-box" id="personal-journal">
                  <!-- Dynamically rendered -->
                </div>

                <div class="stamp-badge-wrap" id="stamp-badge-wrap">
                  <span class="stamp-badge stamp-classified" id="stamp-badge-text">CLASSIFIED</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    const btnClose = el.querySelector('#btn-close-roster');
    btnClose?.addEventListener('click', () => this.close());

    el.addEventListener('click', (e) => {
      if (e.target === el) {
        this.close();
      }
    });

    // Wire Tab Buttons
    const tabs = el.querySelectorAll<HTMLButtonElement>('.staff-tab-btn');
    tabs.forEach((btn) => {
      const staffId = btn.getAttribute('data-staff');
      if (staffId) {
        this.tabButtons.set(staffId, btn);
        btn.addEventListener('click', () => {
          AudioEngine.getInstance().playTumblerClick();
          this.selectTab(staffId);
        });
      }
    });

    this.dossierHeaderEl = el.querySelector('#dossier-header');
    this.dutyLogContainerEl = el.querySelector('#duty-log-tbody');
    this.clinicalNotesEl = el.querySelector('#dossier-protocol');
    this.personalJournalEl = el.querySelector('#personal-journal');
    this.puzzleClueEl = el.querySelector('#dossier-clue-summary');
    this.stampBadgeEl = el.querySelector('#stamp-badge-text');

    return el;
  }

  protected onOpened(): void {
    this.renderActiveDossier();
  }

  protected onClosed(): void {
    // No-op
  }

  protected handleKeyDown(e: KeyboardEvent): void {
    const staffIds = ['rostova', 'thorne', 'vance', 'cross', 'vandermeer'];
    const idx = staffIds.indexOf(this.activeStaffId);
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === 'd' || e.key === 'D') {
      const nextIdx = (idx + 1) % staffIds.length;
      AudioEngine.getInstance().playTumblerClick();
      this.selectTab(staffIds[nextIdx]);
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp' || e.key === 'a' || e.key === 'A') {
      const prevIdx = (idx - 1 + staffIds.length) % staffIds.length;
      AudioEngine.getInstance().playTumblerClick();
      this.selectTab(staffIds[prevIdx]);
    }
  }

  public selectTab(staffId: string): void {
    if (!STAFF_DOSSIERS[staffId]) return;
    this.activeStaffId = staffId;
    this.renderActiveDossier();
  }

  private renderActiveDossier(): void {
    const data = STAFF_DOSSIERS[this.activeStaffId];
    if (!data) return;

    // Update active tab buttons
    this.tabButtons.forEach((btn, id) => {
      if (id === this.activeStaffId) {
        btn.classList.add('active');
        btn.setAttribute('aria-selected', 'true');
      } else {
        btn.classList.remove('active');
        btn.setAttribute('aria-selected', 'false');
      }
    });

    // Render Header Info
    if (this.dossierHeaderEl) {
      this.dossierHeaderEl.innerHTML = `
        <div class="dossier-header-item">
          <span class="dossier-label">EMPLOYEE NAME</span>
          <span class="dossier-val-highlight">${data.name}</span>
        </div>
        <div class="dossier-header-item">
          <span class="dossier-label">ASSIGNED SECTOR</span>
          <span class="dossier-val">${data.wing}</span>
        </div>
        <div class="dossier-header-item">
          <span class="dossier-label">SERIAL NUMBER</span>
          <span class="dossier-val">${data.serialNumber}</span>
        </div>
        <div class="dossier-header-item">
          <span class="dossier-label">CLEARANCE LEVEL</span>
          <span class="dossier-val">${data.clearance}</span>
        </div>
        <div class="dossier-header-item" style="grid-column: span 2;">
          <span class="dossier-label">SCHEDULED SHIFT HOURS</span>
          <span class="dossier-val">${data.shiftHours}</span>
        </div>
      `;
    }

    // Render Duty Log Table
    if (this.dutyLogContainerEl) {
      this.dutyLogContainerEl.innerHTML = data.dutyLogs.map(log => `
        <tr>
          <td class="log-time">${log.time}</td>
          <td class="log-loc">${log.location}</td>
          <td class="log-entry">${log.entry}</td>
        </tr>
      `).join('');
    }

    // Render Clinical Notes
    if (this.clinicalNotesEl) {
      this.clinicalNotesEl.textContent = data.clinicalNotes;
    }

    // Render Puzzle Clue Badge
    if (this.puzzleClueEl) {
      this.puzzleClueEl.innerHTML = `<strong>CHAMBER DIRECTIVE:</strong> ${data.puzzleClueSummary}`;
    }

    // Render Personal Journal
    if (this.personalJournalEl) {
      this.personalJournalEl.textContent = `"${data.personalJournal}"`;
    }

    // Render Stamp
    if (this.stampBadgeEl) {
      this.stampBadgeEl.textContent = data.stamp;
    }
  }

  public getState(): StaffRosterState {
    return { activeStaffId: this.activeStaffId };
  }

  public hydrate(state: StaffRosterState): void {
    if (state && state.activeStaffId) {
      this.selectTab(state.activeStaffId);
    }
  }

  public reset(): void {
    this.selectTab('rostova');
  }

  public stepControl(controlId: string, delta: number): void {
    if (controlId === 'tab') {
      const staffIds = ['rostova', 'thorne', 'vance', 'cross', 'vandermeer'];
      const idx = staffIds.indexOf(this.activeStaffId);
      const nextIdx = (idx + delta + staffIds.length) % staffIds.length;
      this.selectTab(staffIds[nextIdx]);
    }
  }
}
