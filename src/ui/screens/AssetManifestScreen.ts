import { DiegeticScreenBase } from './DiegeticScreenBase';
import { GameState } from '../../core/GameState';
import { AudioEngine } from '../../audio/AudioEngine';
import { CrystalId } from '../../types';

export interface ManifestItemDef {
  id: string;
  name: string;
  tray: 'hardware' | 'crystals' | 'records';
  sector: string;
  serialNumber: string;
  composition: string;
  description: string;
  clinicalNotes: string;
  ledColor?: string;
  canInspect3D?: boolean;
  documentType?: 'dossier' | 'roster';
  memoryLogSubtitle?: string;
}

export const MANIFEST_CATALOG: Record<string, ManifestItemDef> = {
  prop_key: {
    id: 'prop_key',
    name: 'HEAVY BRASS TUNING KEY',
    tray: 'hardware',
    sector: 'Central Concourse (SL4-01-HUB)',
    serialNumber: 'KY-545B-BRS',
    composition: 'Machined Yellow Brass (CuZn37)',
    description: 'Machined from solid yellow brass with dual calibrated pitch prongs.',
    clinicalNotes: 'Acoustic alignment tool used to mechanically couple the harmonic lockpins in the observation corridor airlock. Retains heavy friction markings along the central flutes.',
    canInspect3D: true
  },
  prop_brass_shunt: {
    id: 'prop_brass_shunt',
    name: 'MACHINED BRASS SHUNT',
    tray: 'hardware',
    sector: 'Central Concourse (SL4-01-HUB)',
    serialNumber: 'SHT-74-100',
    composition: 'Knurled Industrial Brass / Solid Core',
    description: 'Heavy knurled brass conductor cylinder.',
    clinicalNotes: 'Specially weighted conductor shunt designed to complete the high-voltage heater supply across the Tektronix 545B ceramic fuse terminal. Surface exhibits minor electrical arcing pitting from repeated 528 Hz Lissajous resonance cycles.',
    canInspect3D: false
  },
  crystal_01_quartz: {
    id: 'crystal_01_quartz',
    name: 'PRISMATIC QUARTZ CORE',
    tray: 'crystals',
    sector: 'Sleep Ward (SL4-02-SLP)',
    serialNumber: 'CRY-01-QZ',
    composition: 'SiO2 Piezoelectric Matrix',
    ledColor: '#38bdf8',
    description: 'High-purity quartz crystal recovered from Subject 104 dispensary trolley.',
    clinicalNotes: 'Extracted from the dispensary cart after 68 BPM cardiac titration. Exhibits coherent optical refraction under ultraviolet stimulation. Memory traces document Subject 104 entering autonomic trance.',
    memoryLogSubtitle: 'Memory Log 01 [Somnambulist Sleep Ward]: Resting cardiac rhythm 68 BPM. Chemical sedation holding. Subject 104 limbic decoupling verified.'
  },
  crystal_02_bronze: {
    id: 'crystal_02_bronze',
    name: 'OXIDIZED BRONZE CORE',
    tray: 'crystals',
    sector: 'Hydrotherapy Suite (SL4-03-HYD)',
    serialNumber: 'CRY-02-BRZ',
    composition: 'Cu-Sn Metallic Alloy Crystal',
    ledColor: '#f59e0b',
    description: 'Hydrostatically sealed metallic crystal extracted from Basin B floor drain.',
    clinicalNotes: 'Retrieved following siphon balance at differential hydrostatic zero. Surface bears heavy verdigris oxidation and mineral encrustation from immersion tank cycles.',
    memoryLogSubtitle: 'Memory Log 02 [Hydrotherapy]: Liquid siphon balance achieved at 0.0 PSI. Submersion therapy completed; patient vocal resistance quenched.'
  },
  crystal_03_amethyst: {
    id: 'crystal_03_amethyst',
    name: 'AMETHYST CORE',
    tray: 'crystals',
    sector: 'Audiology Vault (SL4-04-AUD)',
    serialNumber: 'CRY-03-AMY',
    composition: 'SiO2 Ferric-Doped Violet Matrix',
    ledColor: '#c084fc',
    description: 'Acoustically tuned violet core extracted from the flared speaker monolith.',
    clinicalNotes: 'Released after 180° acoustic null at 600 Hz carrier frequency. Resonates audibly in human hearing range when handled without insulated rubber tongs.',
    memoryLogSubtitle: 'Memory Log 03 [Audiology Vault]: Binaural carrier null at 600 Hz. Auditory hallucinations eliminated; speaker diaphragm released.'
  },
  crystal_04_obsidian: {
    id: 'crystal_04_obsidian',
    name: 'PITCH-BLACK OBSIDIAN CORE',
    tray: 'crystals',
    sector: 'The Archive & Records (SL4-05-ARC)',
    serialNumber: 'CRY-04-OBS',
    composition: 'Vitreous Volcanic Silicate Matrix',
    ledColor: '#818cf8',
    description: 'Dense volcanic glass matrix retrieved from Pneumatic Transit Drawer 104.',
    clinicalNotes: 'Delivered via pneumatic capsule from Sector GAMMA-07. Completely light-absorbent core encoding microfiche index reels and classified clinical destruction orders.',
    memoryLogSubtitle: 'Memory Log 04 [The Archive]: Canister received from Sector GAMMA-07. Patient 104 case files scheduled for complete obliteration.'
  },
  crystal_05_celadon: {
    id: 'crystal_05_celadon',
    name: 'GLOWING CELADON CORE',
    tray: 'crystals',
    sector: 'Director\'s Office (SL4-06-DIR)',
    serialNumber: 'CRY-05-CEL',
    composition: 'Nephrite Silicate Luminescent Matrix',
    ledColor: '#34d399',
    description: 'Rare luminescent jade crystal locked inside the executive desk credenza.',
    clinicalNotes: 'Unlatched by entering secret dial code 1-1-0-3 on the executive rotary telephone. Radiates steady pale green bioluminescent glow matching the facility master clock.',
    memoryLogSubtitle: 'Memory Log 05 [Director\'s Office]: Half-speed playback unlatched. Director Vandermeer: "The patient is not a subject. The patient is the architect."'
  },
  prop_envelope: {
    id: 'prop_envelope',
    name: 'INTAKE PROTOCOL DOSSIER [FORM 104-ALPHA]',
    tray: 'records',
    sector: 'Central Concourse (SL4-01-HUB)',
    serialNumber: 'DOC-74-001',
    composition: 'Manila Rag Paper / Brass Fastener',
    description: 'Clinical admission envelope containing Subject 104 psychological evaluation.',
    clinicalNotes: 'Found sealed on the central reception desk. Classified red wax seal broken. Notes detail cognitive baseline and instructions for Tektronix CRT 528 Hz calibration.',
    documentType: 'dossier'
  },
  prop_thorne_clipboard: {
    id: 'prop_thorne_clipboard',
    name: 'CLINICAL PERSONNEL ROSTER [FORM 108-STAFF]',
    tray: 'records',
    sector: 'Facility-Wide Administration',
    serialNumber: 'DIR-74-ROSTER',
    composition: 'Oak Clipboard / Form 108 Sheets',
    description: 'Comprehensive duty logs and schedules for attending physicians, orderlies, and technicians.',
    clinicalNotes: 'Cross-sector shift records documenting Dr. Thorne, Orderly Rostova, Technician Vance, Archivist Cross, and Director Vandermeer.',
    documentType: 'roster'
  }
};

export const CRYSTAL_ORDER: CrystalId[] = [
  'crystal_01_quartz',
  'crystal_02_bronze',
  'crystal_03_amethyst',
  'crystal_04_obsidian',
  'crystal_05_celadon'
];

export interface AssetManifestState {
  activeTray: 'all' | 'hardware' | 'crystals' | 'records';
  selectedItemId: string | null;
}

export class AssetManifestScreen extends DiegeticScreenBase<AssetManifestState> {
  private static instance: AssetManifestScreen | null = null;
  public readonly id = 'asset_manifest';

  private activeTray: 'all' | 'hardware' | 'crystals' | 'records' = 'all';
  private selectedItemId: string | null = null;

  // DOM Elements
  private tabButtons: Map<string, HTMLButtonElement> = new Map();
  private countBadgeAll: HTMLElement | null = null;
  private countBadgeHardware: HTMLElement | null = null;
  private countBadgeCrystals: HTMLElement | null = null;
  private countBadgeRecords: HTMLElement | null = null;
  private inventoryListEl: HTMLElement | null = null;

  // Detail Elements
  private detailBlueprintEl: HTMLElement | null = null;
  private detailNameEl: HTMLElement | null = null;
  private detailSectorEl: HTMLElement | null = null;
  private detailSerialEl: HTMLElement | null = null;
  private detailCompositionEl: HTMLElement | null = null;
  private detailNotesEl: HTMLElement | null = null;
  private detailActionsEl: HTMLElement | null = null;

  private unsubscribers: Array<() => void> = [];

  public static getInstance(): AssetManifestScreen {
    if (!AssetManifestScreen.instance) {
      AssetManifestScreen.instance = new AssetManifestScreen();
    }
    return AssetManifestScreen.instance;
  }

  public constructor() {
    super();
    if (typeof document !== 'undefined' && document.getElementById('modal-inventory')) {
      this.modalEl = this.createModalElement();
      this.updateBadges();
    }
    this.setupEventSubscriptions();
  }

  private setupEventSubscriptions(): void {
    const unsubInvAdd = this.eventBus.on('inventory:add', ({ itemId }) => {
      if (itemId) {
        this.selectedItemId = itemId;
      }
      this.updateBadges();
      if (this.isVisible) {
        this.renderActiveTray();
        this.renderDetailPane();
      }
    });
    this.unsubscribers.push(unsubInvAdd);

    const unsubInv = this.eventBus.on('ui:inventory_updated', () => {
      this.updateBadges();
      if (this.isVisible) {
        this.renderActiveTray();
        this.renderDetailPane();
      }
    });
    this.unsubscribers.push(unsubInv);

    const unsubCrystal = this.eventBus.on('puzzle:crystal_collected', ({ crystalId }) => {
      if (crystalId) {
        this.selectedItemId = crystalId;
      }
      this.updateBadges();
      if (this.isVisible) {
        this.renderActiveTray();
        this.renderDetailPane();
      }
    });
    this.unsubscribers.push(unsubCrystal);

    const unsubCrt = this.eventBus.on('puzzle:crt_patch_completed', () => {
      this.updateBadges();
      if (this.isVisible) {
        this.renderActiveTray();
        this.renderDetailPane();
      }
    });
    this.unsubscribers.push(unsubCrt);

    const unsubOpen = this.eventBus.on('ui:open_asset_manifest', (payload) => {
      if (payload.trayId) {
        this.activeTray = payload.trayId;
      }
      if (payload.itemId) {
        this.selectedItemId = payload.itemId;
      }
      this.open();
    });
    this.unsubscribers.push(unsubOpen);
  }

  protected createModalElement(): HTMLElement {
    // If #modal-inventory already exists in DOM (from index.html), adopt it
    let el = document.getElementById('modal-inventory');
    if (!el) {
      el = document.createElement('div');
      el.id = 'modal-inventory';
      el.className = 'overlay-screen hidden';
      el.style.zIndex = '15000';
      el.setAttribute('role', 'dialog');
      el.setAttribute('aria-modal', 'true');
    }

    el.innerHTML = `
      <div class="manifest-case-container">
        <!-- Case Header -->
        <div class="manifest-case-header">
          <div class="manifest-header-titles">
            <span class="manifest-header-code">DEPT. OF COGNITIVE ALIGNMENT // FORM 104-INV</span>
            <h2 class="manifest-header-title">Acquired Specimens &amp; Artifact Requisition Ledger</h2>
          </div>
          <div class="manifest-header-right">
            <div class="manifest-stamp-badge">REQUISITION VERIFIED</div>
            <button class="modal-close-x" id="btn-close-inventory-x" aria-label="Close inventory">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        </div>

        <!-- Classification Sub-Bar -->
        <div class="manifest-sub-bar">
          <span class="manifest-sub-text">FACILITY CLEARANCE: TIER 3 CLINICAL • SPECIMEN VAULT EVIDENCE CASE</span>
          <span class="manifest-sub-status" id="manifest-clock-status">SYNCHRONIZED TO CENTRAL CONCOURSE</span>
        </div>

        <!-- Master-Detail Dual Pane Layout -->
        <div class="manifest-body-grid">
          <!-- Left Pane: Tray Tabs and Item List -->
          <div class="manifest-left-pane">
            <div class="manifest-tray-nav" role="tablist">
              <button class="manifest-tray-tab active" data-tray="all" id="tab-tray-all" role="tab" aria-selected="true">
                <span class="tray-tab-label">ALL ASSETS</span>
                <span class="tray-tab-badge" id="badge-count-all">0</span>
              </button>
              <button class="manifest-tray-tab" data-tray="hardware" id="tab-tray-hardware" role="tab" aria-selected="false">
                <span class="tray-tab-label">TRAY 01: HARDWARE &amp; TOOLS</span>
                <span class="tray-tab-badge" id="badge-count-hardware">0</span>
              </button>
              <button class="manifest-tray-tab" data-tray="crystals" id="tab-tray-crystals" role="tab" aria-selected="false">
                <span class="tray-tab-label">TRAY 02: MEMORY CRYSTALS</span>
                <span class="tray-tab-badge" id="badge-count-crystals">0/5</span>
              </button>
              <button class="manifest-tray-tab" data-tray="records" id="tab-tray-records" role="tab" aria-selected="false">
                <span class="tray-tab-label">TRAY 03: ARCHIVAL RECORDS</span>
                <span class="tray-tab-badge" id="badge-count-records">0</span>
              </button>
            </div>

            <!-- Content Bay for Active Tray -->
            <div class="manifest-tray-content" id="manifest-tray-viewport">
              <div id="inventory-list" class="manifest-items-list">
                <!-- Dynamically populated -->
              </div>
            </div>
          </div>

          <!-- Right Pane: Tactical Specimen Dossier & Inspection Bay -->
          <div class="manifest-right-pane" id="manifest-detail-pane">
            <div class="manifest-specimen-blueprint" id="manifest-blueprint-mount">
              <!-- Technical SVG Blueprint -->
            </div>

            <div class="manifest-meta-table">
              <div class="manifest-meta-row">
                <span class="manifest-meta-label">SPECIMEN DESIGNATION</span>
                <span class="manifest-meta-val" id="manifest-detail-name">--</span>
              </div>
              <div class="manifest-meta-row">
                <span class="manifest-meta-label">ORIGIN SECTOR</span>
                <span class="manifest-meta-val" id="manifest-detail-sector">--</span>
              </div>
              <div class="manifest-meta-row">
                <span class="manifest-meta-label">SERIAL / LOT NUMBER</span>
                <span class="manifest-meta-val" id="manifest-detail-serial">--</span>
              </div>
              <div class="manifest-meta-row">
                <span class="manifest-meta-label">PHYSICAL COMPOSITION</span>
                <span class="manifest-meta-val" id="manifest-detail-composition">--</span>
              </div>
            </div>

            <div class="manifest-notes-container">
              <div class="manifest-notes-label">FORENSIC &amp; CLINICAL NOTES</div>
              <div class="manifest-notes-content" id="manifest-detail-notes">Select a specimen pod from the left tray to examine requisition data.</div>
            </div>

            <div class="manifest-actions-bar" id="manifest-detail-actions">
              <!-- Action buttons dynamically inserted -->
            </div>
          </div>
        </div>

        <!-- Case Footer -->
        <div class="manifest-case-footer">
          <span class="manifest-footer-tip">CLICK SPECIMEN POD TO INSPECT • ESC OR BACKDROP TO DISMISS</span>
          <button class="pill-btn" id="btn-close-inventory">Return to Chamber</button>
        </div>
      </div>
    `;

    // Wire Close Buttons
    const btnClose = el.querySelector('#btn-close-inventory');
    const btnCloseX = el.querySelector('#btn-close-inventory-x');
    btnClose?.addEventListener('click', () => this.close());
    btnCloseX?.addEventListener('click', () => this.close());

    el.addEventListener('click', (e) => {
      if (e.target === el) {
        this.close();
      }
    });

    // Wire Tabs
    const tabs = el.querySelectorAll<HTMLButtonElement>('.manifest-tray-tab');
    tabs.forEach((tab) => {
      const tray = tab.getAttribute('data-tray') as 'all' | 'hardware' | 'crystals' | 'records';
      if (tray) {
        this.tabButtons.set(tray, tab);
        tab.addEventListener('click', () => {
          AudioEngine.getInstance().playTumblerClick();
          this.selectTray(tray);
        });
      }
    });

    // Cache element references
    this.countBadgeAll = el.querySelector('#badge-count-all');
    this.countBadgeHardware = el.querySelector('#badge-count-hardware');
    this.countBadgeCrystals = el.querySelector('#badge-count-crystals');
    this.countBadgeRecords = el.querySelector('#badge-count-records');
    this.inventoryListEl = el.querySelector('#inventory-list');

    this.detailBlueprintEl = el.querySelector('#manifest-blueprint-mount');
    this.detailNameEl = el.querySelector('#manifest-detail-name');
    this.detailSectorEl = el.querySelector('#manifest-detail-sector');
    this.detailSerialEl = el.querySelector('#manifest-detail-serial');
    this.detailCompositionEl = el.querySelector('#manifest-detail-composition');
    this.detailNotesEl = el.querySelector('#manifest-detail-notes');
    this.detailActionsEl = el.querySelector('#manifest-detail-actions');

    return el;
  }

  protected onOpened(): void {
    AudioEngine.getInstance().playPneumaticHiss();
    this.updateBadges();
    this.ensureValidSelection();
    this.renderActiveTray();
    this.renderDetailPane();
  }

  protected onClosed(): void {
    AudioEngine.getInstance().playDoorLatch();
  }

  protected handleKeyDown(e: KeyboardEvent): void {
    const trays: Array<'all' | 'hardware' | 'crystals' | 'records'> = ['all', 'hardware', 'crystals', 'records'];
    const idx = trays.indexOf(this.activeTray);
    if (e.key === 'Tab') {
      e.preventDefault();
      const nextIdx = (idx + (e.shiftKey ? -1 : 1) + trays.length) % trays.length;
      AudioEngine.getInstance().playTumblerClick();
      this.selectTray(trays[nextIdx]);
    }
  }

  public selectTray(tray: 'all' | 'hardware' | 'crystals' | 'records'): void {
    this.activeTray = tray;
    this.ensureValidSelection();
    this.renderActiveTray();
    this.renderDetailPane();
  }

  public selectItem(itemId: string): void {
    if (this.selectedItemId !== itemId) {
      if (itemId.startsWith('CR-') || itemId.startsWith('crystal')) {
        AudioEngine.getInstance().playGlassClink();
      } else if (itemId.includes('envelope') || itemId.includes('dossier') || itemId.includes('ledger') || itemId.includes('slip') || itemId.startsWith('DOC-') || itemId.startsWith('MEMO-')) {
        AudioEngine.getInstance().playPaperRustle();
      } else {
        AudioEngine.getInstance().playTumblerClick();
      }
    }
    this.selectedItemId = itemId;
    this.renderActiveTray();
    this.renderDetailPane();
  }

  private updateBadges(): void {
    const gs = GameState.getInstance();
    const inventory = gs.getInventory();
    const collected = gs.getCollectedCrystals();
    const patched = gs.getPatchedCrystals();
    const securedCrystals = CRYSTAL_ORDER.filter(id => collected.includes(id) || patched.includes(id));

    // Hardware count
    const hwCount = inventory.filter(id => {
      const def = MANIFEST_CATALOG[id];
      return !def || def.tray === 'hardware';
    }).length;

    // Records count
    const recCount = inventory.filter(id => {
      const def = MANIFEST_CATALOG[id];
      return def && def.tray === 'records';
    }).length;

    const totalCount = hwCount + recCount + securedCrystals.length;

    if (this.countBadgeAll) this.countBadgeAll.textContent = `${totalCount}`;
    if (this.countBadgeHardware) this.countBadgeHardware.textContent = `${hwCount}`;
    if (this.countBadgeCrystals) this.countBadgeCrystals.textContent = `${securedCrystals.length}/5`;
    if (this.countBadgeRecords) this.countBadgeRecords.textContent = `${recCount}`;
  }

  private getItemsForTray(tray: 'all' | 'hardware' | 'crystals' | 'records'): string[] {
    const gs = GameState.getInstance();
    const inventory = gs.getInventory();
    const collected = gs.getCollectedCrystals();
    const patched = gs.getPatchedCrystals();
    const securedCrystals = CRYSTAL_ORDER.filter(id => collected.includes(id) || patched.includes(id));

    if (tray === 'all') {
      return [...inventory, ...securedCrystals];
    }

    if (tray === 'crystals') {
      return securedCrystals;
    }

    if (tray === 'hardware') {
      return inventory.filter(id => {
        const def = MANIFEST_CATALOG[id];
        return !def || def.tray === 'hardware';
      });
    }

    // records
    return inventory.filter(id => {
      const def = MANIFEST_CATALOG[id];
      return def && def.tray === 'records';
    });
  }

  private ensureValidSelection(): void {
    const items = this.getItemsForTray(this.activeTray);
    if (items.length > 0) {
      if (!this.selectedItemId || !items.includes(this.selectedItemId)) {
        this.selectedItemId = items[0];
      }
    } else {
      this.selectedItemId = null;
    }
  }

  private renderActiveTray(): void {
    // Update active tab styles
    this.tabButtons.forEach((btn, tray) => {
      if (tray === this.activeTray) {
        btn.classList.add('active');
        btn.setAttribute('aria-selected', 'true');
      } else {
        btn.classList.remove('active');
        btn.setAttribute('aria-selected', 'false');
      }
    });

    if (!this.inventoryListEl) return;
    this.inventoryListEl.innerHTML = '';

    const items = this.getItemsForTray(this.activeTray);

    if (items.length === 0) {
      const emptyCard = document.createElement('div');
      emptyCard.className = 'manifest-empty-slot';
      if (this.activeTray === 'all') {
        emptyCard.textContent = '[ SPECIMEN VAULT VACANT // NO ASSETS ACQUIRED ]';
      } else if (this.activeTray === 'crystals') {
        emptyCard.textContent = '[ SPECIMEN PODS VACANT // NO MEMORY CRYSTALS SECURED ]';
      } else if (this.activeTray === 'hardware') {
        emptyCard.textContent = '[ SPECIMEN POD VACANT // AWAITING TOOL REQUISITION ]';
      } else {
        emptyCard.textContent = '[ SPECIMEN POD VACANT // NO ARCHIVAL RECORDS RECOVERED ]';
      }
      this.inventoryListEl.appendChild(emptyCard);
      return;
    }

    const gs = GameState.getInstance();

    items.forEach((itemId) => {
      const def = MANIFEST_CATALOG[itemId] || {
        id: itemId,
        name: itemId.toUpperCase().replace(/^PROP_/, '').replace(/_/g, ' '),
        tray: 'hardware',
        sector: 'Sub-Facility Perimeter',
        serialNumber: 'SPEC-74-UNK',
        composition: 'Unclassified Apparatus Alloy',
        description: 'An unidentified specimen collected during the descent.',
        clinicalNotes: 'Awaiting laboratory triage and spectroscopic analysis.'
      };

      const card = document.createElement('div');
      card.className = `manifest-item-card ${this.selectedItemId === itemId ? 'selected' : ''}`;
      card.setAttribute('data-item-id', itemId);

      if (def.tray === 'crystals') {
        const hasCrystal = gs.hasCrystal(itemId as CrystalId);
        const isPatched = gs.isCrystalPatched(itemId as CrystalId);
        const ledColor = def.ledColor || '#38bdf8';

        let statusText = 'LOCKED IN CHAMBER';
        let statusClass = 'status-locked';
        if (isPatched) {
          statusText = 'CRADLED IN CRT';
          statusClass = 'status-cradled';
        } else if (hasCrystal) {
          statusText = 'SECURED IN POD';
          statusClass = 'status-secured';
        }

        card.innerHTML = `
          <div class="crystal-pod-indicator">
            <span class="crystal-led ${hasCrystal ? 'active' : ''}" style="--led-color: ${ledColor};"></span>
            <span class="crystal-code">${def.serialNumber}</span>
          </div>
          <div class="manifest-card-body">
            <strong class="manifest-card-name">${def.name}</strong>
            <span class="manifest-card-sector">${def.sector}</span>
          </div>
          <div class="manifest-card-status ${statusClass}">${statusText}</div>
        `;
      } else {
        card.innerHTML = `
          <div class="manifest-card-icon-col">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
              ${this.getItemIconSvg(def.id)}
            </svg>
          </div>
          <div class="manifest-card-body">
            <strong class="manifest-card-name">${def.name}</strong>
            <span class="manifest-card-sector">${def.sector}</span>
            <span class="manifest-card-desc">${def.description}</span>
          </div>
          <div class="manifest-card-status status-secured">IN REQUISITION</div>
        `;
      }

      card.addEventListener('click', () => {
        this.selectItem(itemId);
      });

      this.inventoryListEl!.appendChild(card);
    });
  }

  private getItemIconSvg(itemId: string): string {
    if (itemId === 'prop_key') {
      return '<circle cx="7.5" cy="15.5" r="5.5"></circle><path d="m21 2-9.6 9.6"></path><path d="m15.5 7.5 3 3"></path>';
    }
    if (itemId === 'prop_brass_shunt') {
      return '<rect x="4" y="8" width="16" height="8" rx="2"></rect><line x1="8" y1="8" x2="8" y2="16"></line><line x1="16" y1="8" x2="16" y2="16"></line>';
    }
    if (itemId === 'prop_envelope') {
      return '<rect width="20" height="16" x="2" y="4" rx="2"></rect><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>';
    }
    if (itemId === 'prop_thorne_clipboard') {
      return '<rect width="16" height="20" x="4" y="2" rx="2"></rect><line x1="8" y1="6" x2="16" y2="6"></line><line x1="8" y1="11" x2="16" y2="11"></line><line x1="8" y1="16" x2="13" y2="16"></line>';
    }
    return '<circle cx="12" cy="12" r="9"></circle><path d="M12 8v8"></path><path d="M8 12h8"></path>';
  }

  private renderDetailPane(): void {
    if (!this.selectedItemId) {
      if (this.detailNameEl) this.detailNameEl.textContent = 'NO SPECIMEN SELECTED';
      if (this.detailSectorEl) this.detailSectorEl.textContent = '--';
      if (this.detailSerialEl) this.detailSerialEl.textContent = '--';
      if (this.detailCompositionEl) this.detailCompositionEl.textContent = '--';
      if (this.detailNotesEl) this.detailNotesEl.textContent = 'Select an item or crystal from the requisition trays on the left.';
      if (this.detailBlueprintEl) this.detailBlueprintEl.innerHTML = '';
      if (this.detailActionsEl) this.detailActionsEl.innerHTML = '';
      return;
    }

    const def = MANIFEST_CATALOG[this.selectedItemId] || {
      id: this.selectedItemId,
      name: this.selectedItemId.toUpperCase().replace(/^PROP_/, '').replace(/_/g, ' '),
      tray: 'hardware',
      sector: 'Sub-Facility Perimeter',
      serialNumber: 'SPEC-74-UNK',
      composition: 'Unclassified Apparatus Alloy',
      description: 'An unidentified specimen collected during the descent.',
      clinicalNotes: 'Awaiting laboratory triage and spectroscopic analysis.'
    };

    if (this.detailNameEl) this.detailNameEl.textContent = def.name;
    if (this.detailSectorEl) this.detailSectorEl.textContent = def.sector;
    if (this.detailSerialEl) this.detailSerialEl.textContent = def.serialNumber;
    if (this.detailCompositionEl) this.detailCompositionEl.textContent = def.composition;
    if (this.detailNotesEl) this.detailNotesEl.textContent = def.clinicalNotes;

    // Render Technical Orthographic SVG Blueprint
    if (this.detailBlueprintEl) {
      this.detailBlueprintEl.innerHTML = this.generateBlueprintSvg(def);
    }

    // Render Action Buttons
    if (this.detailActionsEl) {
      this.detailActionsEl.innerHTML = '';
      const gs = GameState.getInstance();

      if (def.canInspect3D) {
        const btnInspect = document.createElement('button');
        btnInspect.className = 'manifest-action-btn';
        btnInspect.id = 'btn-manifest-inspect';
        btnInspect.innerHTML = `
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
          </svg>
          EXAMINE 3D ARTIFACT
        `;
        btnInspect.addEventListener('click', () => {
          this.close();
          this.eventBus.emit('inspect:open', {
            itemId: def.id,
            title: def.name,
            subtitle: def.description
          });
        });
        this.detailActionsEl.appendChild(btnInspect);
      }

      if (def.documentType === 'dossier') {
        const btnDossier = document.createElement('button');
        btnDossier.className = 'manifest-action-btn';
        btnDossier.id = 'btn-manifest-read';
        btnDossier.innerHTML = `
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
          </svg>
          READ INTAKE DOSSIER
        `;
        btnDossier.addEventListener('click', () => {
          this.close();
          this.eventBus.emit('ui:view_changed', { view: 'dossier' });
        });
        this.detailActionsEl.appendChild(btnDossier);
      }

      if (def.documentType === 'roster') {
        const btnRoster = document.createElement('button');
        btnRoster.className = 'manifest-action-btn';
        btnRoster.id = 'btn-manifest-roster';
        btnRoster.innerHTML = `
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
            <circle cx="9" cy="7" r="4"></circle>
            <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
          </svg>
          OPEN STAFF ROSTER
        `;
        btnRoster.addEventListener('click', () => {
          this.close();
          this.eventBus.emit('ui:open_staff_roster', { staffId: 'rostova' });
        });
        this.detailActionsEl.appendChild(btnRoster);
      }

      if (def.tray === 'crystals') {
        const hasCrystal = gs.hasCrystal(def.id as CrystalId);
        if (hasCrystal && def.memoryLogSubtitle) {
          const btnReplay = document.createElement('button');
          btnReplay.className = 'manifest-action-btn';
          btnReplay.id = 'btn-manifest-replay';
          btnReplay.innerHTML = `
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polygon points="5 3 19 12 5 21 5 3"></polygon>
            </svg>
            REPLAY MEMORY LOG
          `;
          btnReplay.addEventListener('click', () => {
            AudioEngine.getInstance().playTumblerClick();
            this.eventBus.emit('ui:subtitle_changed', { text: def.memoryLogSubtitle! });
          });
          this.detailActionsEl.appendChild(btnReplay);
        }
      }
    }
  }

  private generateBlueprintSvg(def: ManifestItemDef): string {
    const isCrystal = def.tray === 'crystals';
    const color = def.ledColor || '#2d4a3e';

    if (isCrystal) {
      return `
        <svg viewBox="0 0 320 180" class="blueprint-svg">
          <defs>
            <pattern id="bp-grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(45, 74, 62, 0.12)" stroke-width="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="#edf0eb" />
          <rect width="100%" height="100%" fill="url(#bp-grid)" />
          
          <!-- Outer technical frame -->
          <rect x="10" y="10" width="300" height="160" fill="none" stroke="rgba(45, 74, 62, 0.35)" stroke-width="1" />
          <line x1="160" y1="10" x2="160" y2="170" stroke="rgba(45, 74, 62, 0.2)" stroke-dasharray="3,3" />
          <line x1="10" y1="90" x2="310" y2="90" stroke="rgba(45, 74, 62, 0.2)" stroke-dasharray="3,3" />

          <!-- Crystal Octahedron Projection -->
          <polygon points="160,35 220,90 160,145 100,90" fill="none" stroke="${color}" stroke-width="1.8" />
          <polygon points="160,35 180,90 160,145 140,90" fill="none" stroke="${color}" stroke-width="1.2" stroke-opacity="0.65" />
          <line x1="100" y1="90" x2="220" y2="90" stroke="${color}" stroke-width="1" stroke-opacity="0.5" />

          <!-- Dimension markings -->
          <line x1="75" y1="35" x2="75" y2="145" stroke="#4a5568" stroke-width="1" />
          <line x1="70" y1="35" x2="80" y2="35" stroke="#4a5568" stroke-width="1" />
          <line x1="70" y1="145" x2="80" y2="145" stroke="#4a5568" stroke-width="1" />
          <text x="65" y="93" fill="#141a21" font-size="9" font-family="monospace" text-anchor="end">110mm</text>

          <text x="20" y="25" fill="#2d4a3e" font-size="9" font-family="monospace" font-weight="bold">SPECIMEN ORTHOGRAPHIC [ELEVATION]</text>
          <text x="20" y="160" fill="#718096" font-size="8" font-family="monospace">SCALE: 1:1 // REF: ${def.serialNumber}</text>
        </svg>
      `;
    }

    // Hardware / Tool Blueprint
    return `
      <svg viewBox="0 0 320 180" class="blueprint-svg">
        <defs>
          <pattern id="bp-grid-hw" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(45, 74, 62, 0.12)" stroke-width="1"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="#edf0eb" />
        <rect width="100%" height="100%" fill="url(#bp-grid-hw)" />

        <rect x="10" y="10" width="300" height="160" fill="none" stroke="rgba(45, 74, 62, 0.35)" stroke-width="1" />
        <line x1="160" y1="10" x2="160" y2="170" stroke="rgba(45, 74, 62, 0.2)" stroke-dasharray="3,3" />
        <line x1="10" y1="90" x2="310" y2="90" stroke="rgba(45, 74, 62, 0.2)" stroke-dasharray="3,3" />

        <!-- Machined mechanical silhouette -->
        <rect x="90" y="70" width="140" height="40" rx="3" fill="rgba(45, 74, 62, 0.04)" stroke="#2d4a3e" stroke-width="1.8" />
        <circle cx="120" cy="90" r="10" fill="none" stroke="#2d4a3e" stroke-width="1.2" />
        <line x1="145" y1="70" x2="145" y2="110" stroke="#2d4a3e" stroke-width="1" stroke-dasharray="2,2" />
        <line x1="175" y1="70" x2="175" y2="110" stroke="#2d4a3e" stroke-width="1" stroke-dasharray="2,2" />
        <rect x="230" y="80" width="25" height="20" fill="none" stroke="#2d4a3e" stroke-width="1.5" />

        <text x="20" y="25" fill="#2d4a3e" font-size="9" font-family="monospace" font-weight="bold">COMPONENT SCHEMATIC // TOP PROFILE</text>
        <text x="20" y="160" fill="#718096" font-size="8" font-family="monospace">MACHINED BRASS // MAT SPEC 74B</text>
      </svg>
    `;
  }

  public getState(): AssetManifestState {
    return {
      activeTray: this.activeTray,
      selectedItemId: this.selectedItemId
    };
  }

  public hydrate(state: AssetManifestState): void {
    if (state.activeTray) this.activeTray = state.activeTray;
    if (state.selectedItemId) this.selectedItemId = state.selectedItemId;
    if (this.isVisible) {
      this.renderActiveTray();
      this.renderDetailPane();
    }
  }

  public reset(): void {
    this.activeTray = 'all';
    this.selectedItemId = null;
    if (this.isVisible) {
      this.renderActiveTray();
      this.renderDetailPane();
    }
  }

  public stepControl(_controlId: string, _delta: number): void {
    // No-op
  }

  public override teardown(): void {
    this.unsubscribers.forEach(u => u());
    this.unsubscribers = [];
    super.teardown();
  }
}
