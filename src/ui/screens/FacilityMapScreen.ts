import { DiegeticScreenBase } from './DiegeticScreenBase';
import { GameState } from '../../core/GameState';
import { GameStage } from '../../types';
import { AudioEngine } from '../../audio/AudioEngine';

export interface SectorDefinition {
  id: string;
  code: string;
  name: string;
  subtitle: string;
  gridArea: string;
  description: string;
  apparatus: string;
  apparatusSummary: string;
  iconPath: string;
  pressure: string;
  acoustics: string;
  harmonic: string;
  patientObservation: string;
  svgX: number;
  svgY: number;
  svgWidth: number;
  svgHeight: number;
  corridorStart: [number, number];
  corridorEnd: [number, number];
}

export interface FacilityMapState {
  currentRoomId: string;
  selectedSectorId: string;
}

const FACILITY_SECTORS: SectorDefinition[] = [
  {
    id: 'room_04',
    code: 'SL4-04-HUB',
    name: 'STERILE RECEPTION',
    subtitle: 'Central Decontamination & Alignment Hub',
    gridArea: 'hub',
    description: 'Central hexagonal atrium equipped with Tektronix 545B harmonic oscilloscope apparatus, pneumatic intake conduits, and observation access corridors.',
    apparatus: 'Tektronix 545B Oscilloscope / Phase I Harmonic Resonator',
    apparatusSummary: 'TEKTRONIX 545B CRT',
    iconPath: '<path d="M1 8 C 4 2, 6 2, 8 8 C 10 14, 12 14, 15 8" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
    pressure: '101.3 kPa (NOMINAL SEAL)',
    acoustics: '45 Hz CONTINUOUS DRONE',
    harmonic: '528 Hz BASELINE SYNC',
    patientObservation: 'SUBJECT 104 CONSCIOUSNESS: AWAKENED // COGNITIVE ALIGNMENT CYCLE I IN PROGRESS',
    svgX: 235,
    svgY: 150,
    svgWidth: 110,
    svgHeight: 70,
    corridorStart: [290, 185],
    corridorEnd: [290, 185]
  },
  {
    id: 'sleep_ward',
    code: 'SL4-02-SLP',
    name: 'SLEEP WARD',
    subtitle: 'Somnambulist Isolation Unit',
    gridArea: 'spoke-nw',
    description: 'Long-term patient dormitories fitted with ultraviolet de-germing lamps, observation clipboards, and locked mobile dispensary cart units.',
    apparatus: 'Mobile Dispensary Cart / Peristaltic Drip Manifold',
    apparatusSummary: 'DISPENSARY CART',
    iconPath: '<path d="M1 8 L 5 8 L 7 3 L 9 13 L 11 8 L 15 8" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>',
    pressure: '98.7 kPa (NEGATIVE ISOLATION)',
    acoustics: 'SLOW CARDIAC MONITORS (68 BPM)',
    harmonic: 'UV CHEMICAL TRIAD (VALERIAN)',
    patientObservation: 'SUBJECT 104 STATUS: CARDIAC INDUCED REST (68 BPM) // SOMNAMBULIC CYCLE STABLE',
    svgX: 45,
    svgY: 40,
    svgWidth: 125,
    svgHeight: 65,
    corridorStart: [245, 160],
    corridorEnd: [165, 105]
  },
  {
    id: 'hydrotherapy',
    code: 'SL4-03-HYD',
    name: 'HYDROTHERAPY SUITE',
    subtitle: 'Sub-Thermal Immersion & Drainage',
    gridArea: 'spoke-n',
    description: 'Dual deep porcelain immersion basins connected to high-pressure pneumatic hydraulic manifold with balance sight glass columns.',
    apparatus: 'Triple-Valve Hydraulic Manifold / Immersion Basins',
    apparatusSummary: 'HYDRAULIC MANIFOLD',
    iconPath: '<path d="M1 6 Q 4 3, 8 6 T 15 6 M 1 10 Q 4 7, 8 10 T 15 10" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
    pressure: '145.2 kPa (PNEUMATIC LINE BALANCED)',
    acoustics: 'ACOUSTIC WATER CAVITATION',
    harmonic: '6-LITER FLUID CONSERVATION',
    patientObservation: 'SUBJECT 104 IMMERSION PROTOCOL: SUB-THERMAL EQUILIBRIUM RECORDED',
    svgX: 228,
    svgY: 25,
    svgWidth: 124,
    svgHeight: 65,
    corridorStart: [290, 150],
    corridorEnd: [290, 90]
  },
  {
    id: 'audiology',
    code: 'SL4-04B-AUD',
    name: 'AUDIOLOGY VAULT',
    subtitle: 'Acoustic Resonance Chamber',
    gridArea: 'spoke-ne',
    description: 'Heavy acoustic dampening chamber housing dual flared brass directional horns and central Chladni binaural synthesizer monolith.',
    apparatus: 'Binaural Synthesizer Monolith / Flared Horn Arrays',
    apparatusSummary: 'CHLADNI MONOLITH',
    iconPath: '<path d="M2 5 L 6 5 L 11 2 L 11 14 L 6 11 L 2 11 Z M 13 5 C 14.5 6.5, 14.5 9.5, 13 11" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>',
    pressure: '101.3 kPa (ANECHOIC DAMPENED)',
    acoustics: 'PURE SINE OSCILLATION (741 Hz)',
    harmonic: 'BINAURAL STANDING WAVE',
    patientObservation: 'SUBJECT 104 AUDITORY REFLEX: STANDING FREQUENCY COUPLING DETECTED',
    svgX: 410,
    svgY: 40,
    svgWidth: 125,
    svgHeight: 65,
    corridorStart: [335, 160],
    corridorEnd: [415, 105]
  },
  {
    id: 'archive',
    code: 'SL4-05-ARC',
    name: 'ARCHIVE & RECORDS',
    subtitle: 'Microfilm Storage & Optical Terminals',
    gridArea: 'spoke-e',
    description: 'Cold storage microfilm depository containing security document cabinets, steel shelving, and 16mm microfiche reader terminal.',
    apparatus: 'Motorized Microfiche Reader / Film Gate Projection Unit',
    apparatusSummary: 'MICROFICHE READER',
    iconPath: '<circle cx="5" cy="8" r="3.5" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="11" cy="8" r="3.5" fill="none" stroke="currentColor" stroke-width="1.5"/><line x1="5" y1="4.5" x2="11" y2="4.5" stroke="currentColor" stroke-width="1.5"/>',
    pressure: '100.8 kPa (DESICCATED STORAGE)',
    acoustics: 'INTERMITTENT MOTOR ROTATION',
    harmonic: '16mm FRAME REGISTRATION',
    patientObservation: 'SUBJECT 104 DOSSIER INDEX: RECORD 104 RETENTION VERIFIED IN DEPOSITORY',
    svgX: 415,
    svgY: 155,
    svgWidth: 125,
    svgHeight: 65,
    corridorStart: [345, 185],
    corridorEnd: [415, 185]
  },
  {
    id: 'directors_office',
    code: 'SL4-06-DIR',
    name: "DIRECTOR'S OFFICE",
    subtitle: 'Administration & Surveillance Quarters',
    gridArea: 'spoke-se',
    description: 'Executive mahogany quarters containing brass carriage clock escapement, reel-to-reel wiretap recorder, and dead telephone receiver.',
    apparatus: 'Nagra SN Reel-to-Reel Tape Deck / Brass Escapement Clock',
    apparatusSummary: 'NAGRA TAPE DECK',
    iconPath: '<circle cx="8" cy="8" r="6.5" fill="none" stroke="currentColor" stroke-width="1.5"/><polyline points="8,4 8,8 11,8" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>',
    pressure: '101.4 kPa (PRESSURIZED SUITE)',
    acoustics: 'TICKING ESCAPEMENT (11:03 AM)',
    harmonic: 'WIRETAP TAPE TRANSPORTS',
    patientObservation: 'ADMINISTRATIVE SURVEILLANCE: EXECUTIVE SURVEILLANCE PROTOCOLS MONITORED',
    svgX: 410,
    svgY: 270,
    svgWidth: 125,
    svgHeight: 65,
    corridorStart: [335, 210],
    corridorEnd: [415, 270]
  },
  {
    id: 'synthesis_blackout',
    code: 'SL4-07-SYN',
    name: 'SYNTHESIS CORE',
    subtitle: 'High-Voltage Cathode Acceleration',
    gridArea: 'spoke-s',
    description: 'High-amperage cathode array encased behind blast shielding, regulated by a 5-channel galvanometer resistance bridge.',
    apparatus: '5-Channel Galvanometer Balancing Grid',
    apparatusSummary: 'GALVANOMETER GRID',
    iconPath: '<path d="M9 1 L 4 9 L 8 9 L 7 15 L 12 7 L 8 7 Z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>',
    pressure: '72.1 kPa (VACUUM EXHAUST HOLD)',
    acoustics: '500A BUSBAR HUM & CRACKLE',
    harmonic: '100Ω WHEATSTONE RESISTANCE',
    patientObservation: 'CATHODE STABILIZATION: MAXIMUM ENERGY FLUX DISCHARGING TOWARD CORE TERMINAL',
    svgX: 228,
    svgY: 280,
    svgWidth: 124,
    svgHeight: 65,
    corridorStart: [290, 220],
    corridorEnd: [290, 280]
  },
  {
    id: 'velvet_lounge',
    code: 'SL4-08-VEL',
    name: 'VELVET LOUNGE',
    subtitle: 'The Solarium & Final Intercept',
    gridArea: 'spoke-sw',
    description: 'Art Deco private quarters with walnut cocktail bar, mirror reflection surface, and 1950s manual telephone switchboard.',
    apparatus: '3-Line Audio Patch Switchboard / Payphone Terminal',
    apparatusSummary: 'SWITCHBOARD MATRIX',
    iconPath: '<circle cx="4" cy="5" r="1.8" fill="currentColor"/><circle cx="12" cy="5" r="1.8" fill="currentColor"/><circle cx="8" cy="11" r="1.8" fill="currentColor"/><path d="M4 5 C 4 11, 8 11, 8 11" fill="none" stroke="currentColor" stroke-width="1.2"/>',
    pressure: '101.3 kPa (ISOLATED CABIN)',
    acoustics: 'SOLITARY RINGING CADENCE',
    harmonic: '3-CHANNEL AUDIO INTERCEPT',
    patientObservation: 'FINAL INTERCEPT: TELEPHONE LINE 3 RECEPTIVE TO INCOMING FREQUENCY TRANSMISSION',
    svgX: 45,
    svgY: 270,
    svgWidth: 125,
    svgHeight: 65,
    corridorStart: [245, 210],
    corridorEnd: [165, 270]
  }
];

export class FacilityMapScreen extends DiegeticScreenBase<FacilityMapState> {
  public readonly id: string = 'screen-facility-map';
  private static instance: FacilityMapScreen | null = null;
  private currentRoomId: string = 'room_04';
  private selectedSectorId: string = 'room_04';
  private statusMessageEl: HTMLElement | null = null;

  public constructor() {
    super();
    this.setupBusListeners();
  }

  public static getInstance(): FacilityMapScreen {
    if (!FacilityMapScreen.instance) {
      FacilityMapScreen.instance = new FacilityMapScreen();
    }
    return FacilityMapScreen.instance;
  }

  private setupBusListeners(): void {
    this.eventBus.on('ui:open_facility_map', () => {
      this.open();
    });

    this.eventBus.on('scenario:switch_room', ({ targetRoomId }) => {
      this.currentRoomId = targetRoomId;
      this.selectedSectorId = targetRoomId;
      if (this.isVisible) {
        this.renderMap();
      }
    });

    this.eventBus.on('game:stage_transition', () => {
      if (this.isVisible) {
        this.renderMap();
      }
    });

    this.eventBus.on('puzzle:crt_patch_completed', () => {
      if (this.isVisible) {
        this.renderMap();
      }
    });
  }

  protected createModalElement(): HTMLElement {
    const el = document.createElement('div');
    el.id = this.id;
    el.className = 'overlay-screen diegetic-screen-overlay hidden';
    el.setAttribute('data-testid', 'modal-facility-map');
    el.innerHTML = `
      <div class="diegetic-housing facility-map-housing" style="display: flex; flex-direction: column;">
        <!-- Header with clearly separated left and right flex groups -->
        <div class="diegetic-header">
          <div class="facility-header-left">
            <span class="diegetic-model">SANATORIUM OF COGNITIVE ALIGNMENT // ARCHITECTURAL DOSSIER SUB-LEVEL 04</span>
            <span class="doc-tag" style="font-family: var(--font-mono); font-size: 10px; color: var(--color-sage-deep); background: rgba(45, 74, 62, 0.08); padding: 2px 8px; border-radius: 2px; border: 1px solid var(--color-sage-deep);">DOC-SL4-MAP-73</span>
          </div>
          
          <div class="facility-header-right">
            <span class="stamp-badge stamp-restricted">CLASSIFIED RECORD</span>
            <button class="pill-btn nav-btn" id="btn-facility-map-close" aria-label="Close Blueprint">CLOSE DOSSIER</button>
          </div>
        </div>
        
        <div class="facility-map-body">
          <!-- Left Column: Floorplan Blueprint & Sector Manifest -->
          <div class="facility-blueprint-viewport">
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(20, 26, 33, 0.15); padding-bottom: 6px; flex-shrink: 0;">
              <span style="font-family: var(--font-mono); font-size: 10px; letter-spacing: 0.2em; color: var(--color-sage-deep); font-weight: 700;">TOPOLOGICAL ARCHITECTURAL DRAFTING</span>
              <span style="font-family: var(--font-mono); font-size: 10px; color: var(--ink-muted);">SCALE: 1:250 // METRIC DRAFTING</span>
            </div>

            <!-- Architectural Floorplan SVG (Expands into viewport) -->
            <div class="facility-svg-container" id="facility-svg-wrapper"></div>

            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 4px; flex-shrink: 0;">
              <span id="map-progress-counter" style="font-family: var(--font-mono); font-size: 10px; letter-spacing: 0.16em; color: var(--ink-secondary); font-weight: 700;">FACILITY SECTORS MANIFEST</span>
              <div id="map-progress-pips" style="display: flex; gap: 5px; align-items: center;"></div>
            </div>

            <!-- 8 Sector Cards Roster -->
            <div class="facility-grid" id="facility-sectors-container"></div>
          </div>

          <!-- Right Column: Case File Dossier Panel -->
          <div class="facility-dossier-panel">
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(20, 26, 33, 0.14); padding-bottom: 8px; flex-shrink: 0;">
              <div style="display: flex; align-items: center; gap: 8px;">
                <span id="map-sector-icon-badge" style="display: inline-flex; align-items: center; color: var(--color-sage-deep);"></span>
                <span style="font-family: var(--font-mono); font-size: 10px; letter-spacing: 0.22em; color: var(--color-sage-deep); font-weight: 700;">CLINICAL CASE FILE</span>
              </div>
              <span id="map-stamp-badge" class="stamp-badge stamp-active">CURRENT POSITION</span>
            </div>

            <div>
              <h2 id="map-sector-title" style="font-family: var(--font-serif); font-size: 24px; margin: 0 0 4px 0; color: var(--ink-primary); font-weight: 600; line-height: 1.15;">STERILE RECEPTION</h2>
              <div id="map-sector-code" style="font-size: 11px; color: var(--color-sage-deep); font-family: var(--font-mono); letter-spacing: 0.12em; margin-top: 2px;">SL4-04-HUB • CENTRAL HUB</div>
            </div>

            <!-- Atmospheric & Harmonic Telemetry Card -->
            <div class="dossier-card">
              <div class="dossier-card-title">ATMOSPHERIC TELEMETRY & RESONANCE</div>
              <div style="display: flex; justify-content: space-between; font-family: var(--font-mono); font-size: 11px; padding: 2px 0; border-bottom: 1px dashed rgba(20, 26, 33, 0.08);">
                <span style="color: var(--ink-muted);">BAROMETRIC PRESSURE:</span>
                <span id="map-tel-pressure" style="color: var(--color-sage-deep); font-weight: 600;">101.3 kPa (NOMINAL SEAL)</span>
              </div>
              <div style="display: flex; justify-content: space-between; font-family: var(--font-mono); font-size: 11px; padding: 2px 0; border-bottom: 1px dashed rgba(20, 26, 33, 0.08);">
                <span style="color: var(--ink-muted);">ROOM TONE / ACOUSTICS:</span>
                <span id="map-tel-acoustics" style="color: var(--ink-primary);">45 Hz CONTINUOUS DRONE</span>
              </div>
              <div style="display: flex; justify-content: space-between; font-family: var(--font-mono); font-size: 11px; padding: 2px 0;">
                <span style="color: var(--ink-muted);">OPERATING HARMONIC:</span>
                <span id="map-tel-harmonic" style="color: var(--color-sage-deep); font-weight: 600;">528 Hz BASELINE SYNC</span>
              </div>
            </div>

            <!-- Architectural Survey Notes Card -->
            <div class="dossier-card">
              <div class="dossier-card-title">ARCHITECTURAL SURVEY NOTES</div>
              <div id="map-sector-desc" class="dossier-card-body">Central hexagonal atrium.</div>
            </div>

            <!-- Primary Diegetic Apparatus Specification Card -->
            <div class="dossier-card">
              <div class="dossier-card-title">PRIMARY DIEGETIC APPARATUS</div>
              <div id="map-sector-apparatus" class="dossier-card-body" style="font-family: var(--font-mono); font-weight: 600; color: var(--color-sage-deep);">
                Tektronix 545B Oscilloscope
              </div>
            </div>

            <!-- Subject 104 Clinical Observation Card -->
            <div class="dossier-card">
              <div class="dossier-card-title">SUBJECT 104 OBSERVATION STATUS</div>
              <div id="map-sector-patient" class="dossier-card-body" style="font-size: 11.5px; line-height: 1.45; color: var(--ink-secondary);">
                SUBJECT 104 CONSCIOUSNESS: AWAKENED // COGNITIVE ALIGNMENT CYCLE I IN PROGRESS
              </div>
            </div>

            <!-- Security Clearance & Interlock Status Card -->
            <div class="dossier-card">
              <div class="dossier-card-title">SECURITY STATUS & INTERLOCK</div>
              <div id="map-sector-condition" class="dossier-card-body" style="font-family: var(--font-mono); color: var(--ink-primary);">
                PRIMARY INVESTIGATION // ACTIVE ENTITY DETECTED
              </div>
            </div>

            <!-- Transit Action Console -->
            <div style="margin-top: auto; display: flex; flex-direction: column; gap: 8px; padding-top: 10px; border-top: 1px solid rgba(20, 26, 33, 0.12); flex-shrink: 0;">
              <div id="map-transit-status" style="font-family: var(--font-mono); font-size: 10px; line-height: 1.4; color: var(--color-crimson-wax); min-height: 22px;"></div>
              <button id="btn-facility-transit" class="pill-btn" style="width: 100%; padding: 12px; font-weight: 700; letter-spacing: 0.14em;">
                INITIATE SECTOR TRANSIT
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    const btnClose = el.querySelector('#btn-facility-map-close');
    btnClose?.addEventListener('click', () => this.close());

    const btnTransit = el.querySelector('#btn-facility-transit') as HTMLButtonElement;
    btnTransit?.addEventListener('click', () => this.handleTransitClick());

    this.statusMessageEl = el.querySelector('#map-transit-status');

    return el;
  }

  protected onOpened(): void {
    this.renderMap();
  }

  protected onClosed(): void {
    if (this.statusMessageEl) {
      this.statusMessageEl.textContent = '';
    }
  }

  protected handleKeyDown(e: KeyboardEvent): void {
    // Keyboard shortcuts: 1-8 to cycle sectors
    const keyNum = parseInt(e.key, 10);
    if (!isNaN(keyNum) && keyNum >= 1 && keyNum <= FACILITY_SECTORS.length) {
      this.selectedSectorId = FACILITY_SECTORS[keyNum - 1].id;
      this.renderMap();
    }
  }

  public isSectorUnlocked(sectorId: string): boolean {
    const gs = GameState.getInstance();
    const stage = gs.getStage();

    if (sectorId === 'room_04') return true;
    if (sectorId === 'sleep_ward') return stage >= GameStage.ACT_1_HUB_CORRIDOR_OPEN;
    if (sectorId === 'hydrotherapy') return stage >= GameStage.ACT_2_PATCH_1_COMPLETE;
    if (sectorId === 'audiology') return stage >= GameStage.ACT_3_PATCH_2_COMPLETE;
    if (sectorId === 'archive') return stage >= GameStage.ACT_4_PATCH_3_COMPLETE;
    if (sectorId === 'directors_office') return stage >= GameStage.ACT_5_PATCH_4_COMPLETE;
    if (sectorId === 'synthesis_blackout') return stage >= GameStage.ACT_7_SYNTHESIS_BLACKOUT;
    if (sectorId === 'velvet_lounge') return stage >= GameStage.ACT_8_VELVET_LOUNGE;

    return false;
  }

  public isSectorCleared(sectorId: string): boolean {
    const gs = GameState.getInstance();
    if (sectorId === 'sleep_ward') return gs.isCrystalPatched('crystal_01_quartz');
    if (sectorId === 'hydrotherapy') return gs.isCrystalPatched('crystal_02_bronze');
    if (sectorId === 'audiology') return gs.isCrystalPatched('crystal_03_amethyst');
    if (sectorId === 'archive') return gs.isCrystalPatched('crystal_04_obsidian');
    if (sectorId === 'directors_office') return gs.isCrystalPatched('crystal_05_celadon');
    if (sectorId === 'synthesis_blackout') return gs.isSynthesisComplete();
    return false;
  }

  public isSectorDiscovered(sectorId: string): boolean {
    if (sectorId === 'room_04') return true;
    const gs = GameState.getInstance();
    if (gs.hasVisitedRoom(sectorId)) return true;
    if (this.isSectorCleared(sectorId)) return true;
    return false;
  }

  private renderMap(): void {
    if (!this.modalEl) return;
    this.renderSvgFloorplan();
    this.renderSectorCards();
    this.updateProgressIndicator();
    this.updateDossierPanel();
  }

  private updateProgressIndicator(): void {
    if (!this.modalEl) return;
    const counterEl = this.modalEl.querySelector('#map-progress-counter');
    const pipsContainer = this.modalEl.querySelector('#map-progress-pips');

    const clearedCount = FACILITY_SECTORS.filter((s) => this.isSectorCleared(s.id)).length;
    // Room 04 baseline aligned
    const totalAligned = Math.min(8, clearedCount + 1);

    if (counterEl) {
      counterEl.textContent = `FACILITY PROGRESS: ${totalAligned} / 8 SECTORS ALIGNED`;
    }

    if (pipsContainer) {
      pipsContainer.innerHTML = '';
      FACILITY_SECTORS.forEach((sec) => {
        const isCurrent = sec.id === this.currentRoomId;
        const isCleared = this.isSectorCleared(sec.id);
        const pip = document.createElement('span');
        pip.className = `progress-pip ${isCurrent ? 'active' : isCleared ? 'cleared' : ''}`;
        pip.title = `${sec.name} (${sec.code})`;
        pipsContainer.appendChild(pip);
      });
    }
  }

  private renderSvgFloorplan(): void {
    if (!this.modalEl) return;
    const wrapper = this.modalEl.querySelector('#facility-svg-wrapper');
    if (!wrapper) return;

    let corridorsSvg = '';
    FACILITY_SECTORS.forEach((sec) => {
      if (sec.id === 'room_04') return;
      const isDiscovered = this.isSectorDiscovered(sec.id);
      const isUnlocked = this.isSectorUnlocked(sec.id);
      const corridorColor = isDiscovered
        ? 'var(--color-sage-deep, #2d4a3e)'
        : isUnlocked
        ? 'var(--color-brass-cast, #c28833)'
        : '#94a3b8';
      const strokeDash = isDiscovered ? 'none' : '4 3';

      corridorsSvg += `
        <line x1="${sec.corridorStart[0]}" y1="${sec.corridorStart[1]}"
              x2="${sec.corridorEnd[0]}" y2="${sec.corridorEnd[1]}"
              stroke="${corridorColor}" stroke-width="6" stroke-linecap="square" />
        <line x1="${sec.corridorStart[0]}" y1="${sec.corridorStart[1]}"
              x2="${sec.corridorEnd[0]}" y2="${sec.corridorEnd[1]}"
              stroke="#ffffff" stroke-width="2" stroke-dasharray="${strokeDash}" />
      `;
    });

    let roomsSvg = '';
    FACILITY_SECTORS.forEach((sec) => {
      const isCurrent = sec.id === this.currentRoomId;
      const isSelected = sec.id === this.selectedSectorId;
      const isDiscovered = this.isSectorDiscovered(sec.id);
      const isUnlocked = this.isSectorUnlocked(sec.id);
      const isCleared = this.isSectorCleared(sec.id);

      const strokeColor = isSelected
        ? 'var(--color-brass-cast, #c28833)'
        : isCurrent
        ? 'var(--color-sage-deep, #2d4a3e)'
        : isDiscovered
        ? '#2d4a3e'
        : isUnlocked
        ? '#c28833'
        : '#94a3b8';

      const strokeWidth = isSelected ? '3' : isCurrent ? '2.5' : '1.5';
      const fillColor = isDiscovered ? '#ffffff' : 'url(#hatch-redact)';

      let beaconSvg = '';
      if (isCurrent) {
        beaconSvg = `
          <circle cx="${sec.svgX + sec.svgWidth - 14}" cy="${sec.svgY + 14}" r="5" fill="#16a34a" class="svg-beacon-dot" />
          <circle cx="${sec.svgX + sec.svgWidth - 14}" cy="${sec.svgY + 14}" r="2.5" fill="#ffffff" />
        `;
      }

      let contentSvg = '';
      if (isDiscovered) {
        const statusText = isCurrent ? '[YOU ARE HERE]' : isCleared ? '[CLEARED]' : '[SURVEYED]';
        const statusColor = isCleared ? '#15803d' : isCurrent ? '#16a34a' : '#2d4a3e';

        contentSvg = `
          <!-- Custom Vector Icon inside room node -->
          <g transform="translate(${sec.svgX + 8}, ${sec.svgY + 8})" color="#2d4a3e" style="width: 14px; height: 14px;">
            <svg width="14" height="14" viewBox="0 0 16 16">${sec.iconPath}</svg>
          </g>
          <text x="${sec.svgX + 26}" y="${sec.svgY + 18}" font-family="var(--font-mono)" font-size="8.5" font-weight="600" fill="#2d4a3e" letter-spacing="0.08em">${sec.code}</text>
          <text x="${sec.svgX + 8}" y="${sec.svgY + 34}" font-family="var(--font-sans)" font-size="10" font-weight="700" fill="#141a21">${sec.name}</text>
          <text x="${sec.svgX + 8}" y="${sec.svgY + 47}" font-family="var(--font-mono)" font-size="7.5" fill="#576574">${sec.apparatusSummary}</text>
          <text x="${sec.svgX + 8}" y="${sec.svgY + 59}" font-family="var(--font-mono)" font-size="7.5" font-weight="700" fill="${statusColor}">${statusText}</text>
        `;
      } else {
        const promptText = isUnlocked ? '[AWAITING ENTRY]' : '[RESTRICTED]';
        const promptColor = isUnlocked ? '#b45309' : '#dc2626';

        contentSvg = `
          <text x="${sec.svgX + 8}" y="${sec.svgY + 16}" font-family="var(--font-mono)" font-size="8.5" fill="#64748b">SL4-??</text>
          <rect x="${sec.svgX + 8}" y="${sec.svgY + 23}" width="${sec.svgWidth - 28}" height="14" fill="#141a21" rx="1" />
          <text x="${sec.svgX + 12}" y="${sec.svgY + 34}" font-family="var(--font-mono)" font-size="8" font-weight="700" fill="#f8faf7" letter-spacing="0.1em">UNSURVEYED</text>
          <text x="${sec.svgX + 8}" y="${sec.svgY + 54}" font-family="var(--font-mono)" font-size="7.5" font-weight="700" fill="${promptColor}">${promptText}</text>
        `;
      }

      roomsSvg += `
        <g class="svg-room-node ${isSelected ? 'selected' : ''}" data-sector-id="${sec.id}">
          <rect x="${sec.svgX}" y="${sec.svgY}" width="${sec.svgWidth}" height="${sec.svgHeight}"
                fill="${fillColor}" stroke="${strokeColor}" stroke-width="${strokeWidth}"
                stroke-dasharray="${isDiscovered ? 'none' : '4 3'}" rx="4" />
          ${contentSvg}
          ${beaconSvg}
        </g>
      `;
    });

    wrapper.innerHTML = `
      <svg viewBox="0 0 580 370" class="facility-blueprint-svg">
        <defs>
          <pattern id="hatch-redact" width="8" height="8" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
            <line x1="0" y1="0" x2="0" y2="8" stroke="rgba(20, 26, 33, 0.16)" stroke-width="2.5" />
          </pattern>
        </defs>

        <!-- Drafting Grid Lines covering full 580x370 -->
        <g stroke="rgba(45, 74, 62, 0.08)" stroke-width="1">
          <line x1="40" y1="0" x2="40" y2="370" />
          <line x1="120" y1="0" x2="120" y2="370" />
          <line x1="200" y1="0" x2="200" y2="370" />
          <line x1="280" y1="0" x2="280" y2="370" />
          <line x1="360" y1="0" x2="360" y2="370" />
          <line x1="440" y1="0" x2="440" y2="370" />
          <line x1="520" y1="0" x2="520" y2="370" />

          <line x1="0" y1="50" x2="580" y2="50" />
          <line x1="0" y1="110" x2="580" y2="110" />
          <line x1="0" y1="170" x2="580" y2="170" />
          <line x1="0" y1="230" x2="580" y2="230" />
          <line x1="0" y1="290" x2="580" y2="290" />
          <line x1="0" y1="350" x2="580" y2="350" />
        </g>

        <!-- Compass Cardinal Marker -->
        <g transform="translate(550, 25)" font-family="var(--font-mono)" font-size="8" fill="#576574" text-anchor="middle">
          <line x1="0" y1="-12" x2="0" y2="12" stroke="#576574" stroke-width="1" />
          <line x1="-12" y1="0" x2="12" y2="0" stroke="#576574" stroke-width="1" />
          <text x="0" y="-14">N</text>
        </g>

        <!-- Corridors -->
        ${corridorsSvg}

        <!-- Room Nodes -->
        ${roomsSvg}
      </svg>
    `;

    // Attach click events on SVG nodes
    const svgNodes = wrapper.querySelectorAll('.svg-room-node');
    svgNodes.forEach((node) => {
      node.addEventListener('click', () => {
        const sectorId = node.getAttribute('data-sector-id');
        if (sectorId) {
          this.selectedSectorId = sectorId;
          this.renderMap();
        }
      });
    });
  }

  private renderSectorCards(): void {
    if (!this.modalEl) return;
    const container = this.modalEl.querySelector('#facility-sectors-container');
    if (!container) return;

    container.innerHTML = '';

    FACILITY_SECTORS.forEach((sec) => {
      const isCurrent = sec.id === this.currentRoomId;
      const isSelected = sec.id === this.selectedSectorId;
      const isDiscovered = this.isSectorDiscovered(sec.id);
      const isUnlocked = this.isSectorUnlocked(sec.id);
      const isCleared = this.isSectorCleared(sec.id);

      const card = document.createElement('div');
      card.className = `facility-sector-card ${isSelected ? 'selected' : ''} ${isCurrent ? 'current' : ''} ${!isDiscovered ? 'unvisited' : ''}`;
      card.setAttribute('data-sector-id', sec.id);

      let statusBadge = '<span style="color: var(--ink-muted); font-size: 8.5px; font-family: var(--font-mono);">SEALED</span>';
      if (isCurrent) {
        statusBadge = '<span style="color: #15803d; font-weight: 700; font-size: 8.5px; font-family: var(--font-mono);">ACTIVE</span>';
      } else if (isCleared) {
        statusBadge = '<span style="color: var(--color-sage-deep); font-weight: 700; font-size: 8.5px; font-family: var(--font-mono);">CLEARED</span>';
      } else if (isDiscovered) {
        statusBadge = '<span style="color: var(--color-sage-deep); font-size: 8.5px; font-family: var(--font-mono);">SURVEYED</span>';
      } else if (isUnlocked) {
        statusBadge = '<span style="color: var(--color-brass-cast); font-weight: 700; font-size: 8.5px; font-family: var(--font-mono);">UNSEALED</span>';
      }

      const displayCode = isDiscovered ? sec.code : 'SL4-??';
      const displayName = isDiscovered ? sec.name : '<span class="redaction-bar">████████</span>';

      card.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2px;">
          <div style="display: flex; align-items: center; gap: 4px;">
            ${isDiscovered ? `<span style="display: inline-flex; width: 12px; height: 12px; color: var(--color-sage-deep);"><svg width="12" height="12" viewBox="0 0 16 16">${sec.iconPath}</svg></span>` : ''}
            <span style="font-size: 9px; font-family: var(--font-mono); color: var(--color-sage-deep); font-weight: 600;">${displayCode}</span>
          </div>
          ${statusBadge}
        </div>
        <div style="font-size: 11px; font-weight: 600; color: var(--ink-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
          ${displayName}
        </div>
      `;

      card.addEventListener('click', () => {
        this.selectedSectorId = sec.id;
        this.renderMap();
      });

      container.appendChild(card);
    });
  }

  private updateDossierPanel(): void {
    if (!this.modalEl) return;
    const sector = FACILITY_SECTORS.find((s) => s.id === this.selectedSectorId) || FACILITY_SECTORS[0];

    const iconBadgeEl = this.modalEl.querySelector('#map-sector-icon-badge');
    const stampEl = this.modalEl.querySelector('#map-stamp-badge');
    const titleEl = this.modalEl.querySelector('#map-sector-title');
    const codeEl = this.modalEl.querySelector('#map-sector-code');
    const descEl = this.modalEl.querySelector('#map-sector-desc');
    const appEl = this.modalEl.querySelector('#map-sector-apparatus');
    const condEl = this.modalEl.querySelector('#map-sector-condition');
    const patientEl = this.modalEl.querySelector('#map-sector-patient');
    const btnTransit = this.modalEl.querySelector('#btn-facility-transit') as HTMLButtonElement;

    const telPressureEl = this.modalEl.querySelector('#map-tel-pressure');
    const telAcousticsEl = this.modalEl.querySelector('#map-tel-acoustics');
    const telHarmonicEl = this.modalEl.querySelector('#map-tel-harmonic');

    const isCurrent = sector.id === this.currentRoomId;
    const isDiscovered = this.isSectorDiscovered(sector.id);
    const isUnlocked = this.isSectorUnlocked(sector.id);
    const isCleared = this.isSectorCleared(sector.id);

    // Update icon badge in header
    if (iconBadgeEl) {
      if (isDiscovered) {
        iconBadgeEl.innerHTML = `<svg width="14" height="14" viewBox="0 0 16 16">${sector.iconPath}</svg>`;
      } else {
        iconBadgeEl.innerHTML = '';
      }
    }

    // Update stamp badge
    if (stampEl) {
      if (isCurrent) {
        stampEl.className = 'stamp-badge stamp-active';
        stampEl.textContent = 'CURRENT POSITION';
      } else if (isCleared) {
        stampEl.className = 'stamp-badge stamp-cleared';
        stampEl.textContent = 'CRYSTAL PATCHED';
      } else if (isDiscovered) {
        stampEl.className = 'stamp-badge stamp-cleared';
        stampEl.textContent = 'SURVEY UNSEALED';
      } else if (isUnlocked) {
        stampEl.className = 'stamp-badge stamp-ready';
        stampEl.textContent = 'CLEARANCE GRANTED';
      } else {
        stampEl.className = 'stamp-badge stamp-restricted';
        stampEl.textContent = 'PROTOCOL SEALED';
      }
    }

    if (titleEl) {
      if (isDiscovered) {
        titleEl.textContent = sector.name;
      } else {
        titleEl.innerHTML = '<span class="redaction-bar" style="font-size: 22px;">██████████████</span>';
      }
    }

    if (codeEl) {
      if (isDiscovered) {
        codeEl.textContent = `${sector.code} • ${sector.subtitle}`;
      } else {
        codeEl.textContent = 'SL4-??-??? • [CLASSIFIED SANATORIUM SECTOR]';
      }
    }

    if (descEl) {
      if (isDiscovered) {
        descEl.textContent = sector.description;
      } else {
        descEl.innerHTML = `
          <div class="redaction-bar" style="margin-bottom: 6px;">████████████████████████████████████████</div>
          <div class="redaction-bar" style="margin-bottom: 8px;">██████████████████████████</div>
          <div style="font-size: 11px; color: var(--ink-secondary); font-style: italic; line-height: 1.4;">
            SEALED RECORD. Traverse observation corridor to survey chamber interior and log architectural telemetry.
          </div>
        `;
      }
    }

    if (appEl) {
      if (isDiscovered) {
        appEl.textContent = sector.apparatus;
      } else {
        appEl.innerHTML = '<span class="redaction-bar">████████████████████</span>';
      }
    }

    // Telemetry section
    if (telPressureEl) {
      telPressureEl.innerHTML = isDiscovered ? sector.pressure : '<span class="redaction-bar">████████████</span>';
    }
    if (telAcousticsEl) {
      telAcousticsEl.innerHTML = isDiscovered ? sector.acoustics : '<span class="redaction-bar">████████████████</span>';
    }
    if (telHarmonicEl) {
      telHarmonicEl.innerHTML = isDiscovered ? sector.harmonic : '<span class="redaction-bar">████████████</span>';
    }

    // Subject 104 clinical note
    if (patientEl) {
      patientEl.innerHTML = isDiscovered ? sector.patientObservation : '<span class="redaction-bar">████████████████████████████████████████</span>';
    }

    // Clinical security status (no puzzle hints / RPG quest spoilers)
    if (condEl) {
      if (isCurrent) {
        condEl.textContent = 'PRIMARY INVESTIGATION // ACTIVE ENTITY DETECTED';
      } else if (isCleared) {
        condEl.textContent = 'COGNITIVE HARMONIC LOCKED // SECTOR ALIGNED';
      } else if (isUnlocked) {
        condEl.textContent = 'ATMOSPHERIC PRESSURE NOMINAL // PASSAGE UNSEALED';
      } else {
        condEl.textContent = 'PRESSURE SEAL ACTIVE // INTERLOCK RESTRICTED';
      }
    }

    if (btnTransit) {
      if (isCurrent) {
        btnTransit.disabled = true;
        btnTransit.textContent = 'CURRENT LOCATION (HERE)';
        btnTransit.style.opacity = '0.5';
        btnTransit.style.cursor = 'not-allowed';
      } else if (!isUnlocked) {
        btnTransit.disabled = true;
        btnTransit.textContent = 'ACCESS RESTRICTED (SEALED)';
        btnTransit.style.opacity = '0.4';
        btnTransit.style.cursor = 'not-allowed';
      } else {
        btnTransit.disabled = false;
        btnTransit.textContent = `TRANSIT TO ${sector.name}`;
        btnTransit.style.opacity = '1.0';
        btnTransit.style.cursor = 'pointer';
      }
    }
  }

  private handleTransitClick(): void {
    const sector = FACILITY_SECTORS.find((s) => s.id === this.selectedSectorId);
    if (!sector) return;

    if (sector.id === this.currentRoomId) return;

    if (!this.isSectorUnlocked(sector.id)) {
      if (this.statusMessageEl) {
        this.statusMessageEl.textContent = 'CLEARANCE RESTRICTED: COMPLETE PRIOR HARMONIC ALIGNMENT PROTOCOLS FIRST.';
      }
      return;
    }

    const gs = GameState.getInstance();
    const pending = gs.getPendingCrystal();

    if (pending && sector.id !== 'room_04') {
      if (this.statusMessageEl) {
        this.statusMessageEl.textContent = 'UNPATCHED MEMORY CRYSTAL DETECTED. RETURN TO CENTRAL HUB CRT OSCILLOSCOPE TO CALIBRATE BEFORE TRANSIT.';
      }
      return;
    }

    // Mark room visited upon initiating transit
    gs.markRoomVisited(sector.id);

    this.close();
    AudioEngine.getInstance().playPneumaticHiss();
    this.eventBus.emit('ui:subtitle_changed', {
      text: `Transit corridor pressurized. Arriving at ${sector.name} (${sector.code}).`
    });
    this.eventBus.emit('scenario:switch_room', { targetRoomId: sector.id });
  }

  public getState(): FacilityMapState {
    return {
      currentRoomId: this.currentRoomId,
      selectedSectorId: this.selectedSectorId
    };
  }

  public hydrate(state: FacilityMapState): void {
    this.currentRoomId = state.currentRoomId;
    this.selectedSectorId = state.selectedSectorId;
    if (this.isVisible) {
      this.renderMap();
    }
  }

  public reset(): void {
    this.currentRoomId = 'room_04';
    this.selectedSectorId = 'room_04';
    if (this.isVisible) {
      this.renderMap();
    }
  }

  public stepControl(_controlId: string, _delta: number): void {}
}
