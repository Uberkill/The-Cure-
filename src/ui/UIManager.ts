import { EventBus } from '../core/EventBus';
import { SaveManager } from '../core/SaveManager';
import { AudioEngine } from '../audio/AudioEngine';
import { SaveGameData } from '../types';

export class UIManager {
  private eventBus: EventBus;

  private subtitleEl!: HTMLElement;
  private reticleWrapEl!: HTMLElement;
  private reticlePromptEl!: HTMLElement;
  private telemetryEl!: HTMLElement;

  private cinematicHeaderEl!: HTMLElement;
  private actTagTextEl!: HTMLElement;
  private filmTitleTextEl!: HTMLElement;
  private filmSubtitleTextEl!: HTMLElement;
  private chapterFadeTimeout: number | null = null;
  private subtitleTimer: number | null = null;
  private subtitlesEnabled: boolean = true;

  private modalSettingsEl!: HTMLElement;
  private settingVolume!: HTMLInputElement;
  private settingSfxVolume!: HTMLInputElement;
  private settingAmbientVolume!: HTMLInputElement;
  private settingSubtitles!: HTMLInputElement;
  private settingParallax!: HTMLInputElement;
  private settingScanlines!: HTMLInputElement;

  private volumeValEl!: HTMLElement;
  private sfxValEl!: HTMLElement;
  private ambientValEl!: HTMLElement;

  private saveRoomNameEl!: HTMLElement;
  private saveStageNameEl!: HTMLElement;
  private saveCrystalsCountEl!: HTMLElement;
  private saveTimestampLabelEl!: HTMLElement;
  private btnSaveGame!: HTMLElement;
  private btnExportSave!: HTMLElement;
  private btnImportSave!: HTMLElement;
  private inputImportSave!: HTMLInputElement;
  private btnResetSave!: HTMLElement;
  private btnRecenterCamera!: HTMLElement;
  private settingsTelemetryEl!: HTMLElement;

  constructor() {
    this.eventBus = EventBus.getInstance();

    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('test')) {
      const style = document.createElement('style');
      style.textContent = `
        * {
          transition: none !important;
          animation: none !important;
        }
      `;
      document.head.appendChild(style);
    }

    this.cacheDomElements();
    this.setupListeners();
    this.setupSettingsModal();
    this.setupInventoryModal();
    this.setupAudioButtons();
  }

  private cacheDomElements(): void {
    this.subtitleEl = document.getElementById('observation-subtitle')!;
    this.reticleWrapEl = document.querySelector('.center-reticle-wrap') as HTMLElement;
    this.reticlePromptEl = document.getElementById('reticle-prompt')!;
    this.telemetryEl = document.getElementById('telemetry-status')!;

    this.cinematicHeaderEl = document.getElementById('cinematic-header')!;
    this.actTagTextEl = document.getElementById('act-tag-text')!;
    this.filmTitleTextEl = document.getElementById('film-title-text')!;
    this.filmSubtitleTextEl = document.getElementById('film-subtitle-text')!;

    this.modalSettingsEl = document.getElementById('modal-settings')!;
    this.settingVolume = document.getElementById('setting-volume') as HTMLInputElement;
    this.settingSfxVolume = document.getElementById('setting-sfx-volume') as HTMLInputElement;
    this.settingAmbientVolume = document.getElementById('setting-ambient-volume') as HTMLInputElement;
    this.settingSubtitles = document.getElementById('setting-subtitles') as HTMLInputElement;
    this.settingParallax = document.getElementById('setting-parallax') as HTMLInputElement;
    this.settingScanlines = document.getElementById('setting-scanlines') as HTMLInputElement;

    this.volumeValEl = document.getElementById('volume-val')!;
    this.sfxValEl = document.getElementById('sfx-val')!;
    this.ambientValEl = document.getElementById('ambient-val')!;

    this.saveRoomNameEl = document.getElementById('save-room-name')!;
    this.saveStageNameEl = document.getElementById('save-stage-name')!;
    this.saveCrystalsCountEl = document.getElementById('save-crystals-count')!;
    this.saveTimestampLabelEl = document.getElementById('save-timestamp-label')!;
    this.btnSaveGame = document.getElementById('btn-save-game')!;
    this.btnExportSave = document.getElementById('btn-export-save')!;
    this.btnImportSave = document.getElementById('btn-import-save')!;
    this.inputImportSave = document.getElementById('input-import-save') as HTMLInputElement;
    this.btnResetSave = document.getElementById('btn-reset-save')!;
    this.btnRecenterCamera = document.getElementById('btn-recenter-camera')!;
    this.settingsTelemetryEl = document.getElementById('settings-telemetry')!;
  }

  private setupListeners(): void {
    window.addEventListener('mousemove', (e) => {
      if (this.reticleWrapEl) {
        this.reticleWrapEl.style.left = `${e.clientX}px`;
        this.reticleWrapEl.style.top = `${e.clientY}px`;
      }
    });

    this.eventBus.on('ui:subtitle_changed', ({ text }) => {
      if (!this.subtitlesEnabled) {
        this.subtitleEl.style.opacity = '0';
        return;
      }
      this.subtitleEl.textContent = text;
      this.subtitleEl.style.opacity = '1';
      if (this.subtitleTimer !== null) {
        window.clearTimeout(this.subtitleTimer);
        this.subtitleTimer = null;
      }
      this.subtitleTimer = window.setTimeout(() => {
        this.subtitleEl.style.opacity = '0';
        this.subtitleTimer = null;
      }, 5000);
    });

    this.eventBus.on('save:updated', ({ save }) => {
      this.updateSaveCard(save);
    });

    this.eventBus.on('save:cleared', () => {
      this.updateSaveCard();
    });

    this.eventBus.on('input:object_hovered', ({ label }) => {
      if (label) {
        this.reticlePromptEl.textContent = label;
        this.reticlePromptEl.style.opacity = '1';
      } else {
        this.reticlePromptEl.style.opacity = '0';
      }
    });

    this.eventBus.on('ui:chapter_display', (payload) => {
        this.displayChapterCard(payload.act, payload.title, payload.roomCode, payload.durationMs);
    });

    this.eventBus.on('telemetry:log', ({ level, message }) => {
      if (this.telemetryEl) {
        this.telemetryEl.textContent = `DIAGNOSTIC: ${message.slice(0, 40)}`;
        if (level === 'error') {
          this.telemetryEl.style.color = 'var(--color-crimson-wax)';
        } else {
          this.telemetryEl.style.color = 'var(--ink-muted)';
        }
      }
    });

    this.eventBus.on('ui:inventory_updated', ({ inventory }) => {
      const invList = document.getElementById('inventory-list');
      if (invList) {
        invList.innerHTML = '';
        if (inventory.length === 0) {
          invList.innerHTML = '<div style="color: var(--ink-muted); font-size: 12px; font-style: italic; text-align: center; margin-top: 20px;">No items acquired.</div>';
        }
        inventory.forEach(item => {
          const slot = document.createElement('div');
          slot.style.cssText = 'padding: 12px; border: 1px solid rgba(20, 26, 33, 0.15); font-family: var(--font-mono); font-size: 12px; background: rgba(0,0,0,0.02); color: var(--ink-primary); border-left: 4px solid var(--color-sage-deep);';
          
          let itemName = item;
          let itemDesc = 'A strange artifact collected during the investigation.';
          if (item === 'prop_key') {
            itemName = 'Heavy Brass Tuning Key';
            itemDesc = 'Machined from solid brass. Used to unseal the forward observation corridor.';
          } else if (item === 'prop_brass_shunt') {
              itemName = 'Machined Brass Shunt';
              itemDesc = 'Knurled industrial cylinder designed to seat inside a ceramic fuse terminal.';
            } else if (item === 'prop_envelope') {
              itemName = 'Intake Protocol Dossier';
              itemDesc = 'Sanatorium Sector 04 - Subject 104 intake instructions. [CLICK TO READ]';
            }
          
          if (item === 'prop_envelope') {
              slot.style.cursor = 'pointer';
              slot.addEventListener('click', () => {
                const invEl = document.getElementById('modal-inventory');
                if (invEl) {
                  invEl.classList.add('hidden');
                  this.eventBus.emit('ui:modal_closed', {});
                }
                this.eventBus.emit('ui:view_changed', { view: 'dossier' });
              });
            }
            slot.innerHTML = `<strong style="display: block; margin-bottom: 4px; font-size: 14px;">${itemName}</strong><span style="color: var(--ink-secondary); font-size: 11px;">${itemDesc}</span>`;
            invList.appendChild(slot);
          });
      }
    });

    const btnFacilityMap = document.getElementById('btn-facility-map-toggle');
    btnFacilityMap?.addEventListener('click', () => {
      this.eventBus.emit('ui:open_facility_map', {});
    });

    // Initial persistent chapter display
    this.displayChapterCard('ACT I • THE RECEPTION', 'The Sterile Concourse', 'Room 01', 30000);
  }

  private displayChapterCard(act: string, title: string, roomCode?: string, durationMs?: number): void {
    if (!this.cinematicHeaderEl) return;

    if (this.chapterFadeTimeout !== null) {
      window.clearTimeout(this.chapterFadeTimeout);
      this.chapterFadeTimeout = null;
    }

    this.actTagTextEl.textContent = act;
    this.filmTitleTextEl.textContent = title;
    this.filmSubtitleTextEl.textContent = roomCode
      ? `${roomCode} • Sanatorium of Cognitive Alignment`
      : 'Sanatorium of Cognitive Alignment';
    this.cinematicHeaderEl.classList.remove('faded');
    this.cinematicHeaderEl.style.opacity = '';
      if (durationMs) {
        this.chapterFadeTimeout = window.setTimeout(() => {
          if (this.cinematicHeaderEl) this.cinematicHeaderEl.classList.add('faded');
        }, durationMs);
      }
  }

  private updateSaveCard(save?: SaveGameData): void {
    const data = save || SaveManager.getInstance().createSaveData();
    if (this.saveRoomNameEl) {
      const roomMap: Record<string, string> = {
        room_04: 'Sterile Reception',
        sleep_ward: 'Sleep Ward',
        hydrotherapy: 'Hydrotherapy Suite',
        audiology: 'Audiology Vault',
        archive: 'Microfiche Archive',
        directors_office: "Director's Office",
        synthesis_blackout: 'Synthesis Core',
        velvet_lounge: 'Velvet Lounge'
      };
      this.saveRoomNameEl.textContent = roomMap[data.currentRoomId] || data.currentRoomId;
    }
    if (this.saveStageNameEl) {
      this.saveStageNameEl.textContent = data.currentStage.replace(/_/g, ' ');
    }
    if (this.saveCrystalsCountEl) {
      const count = (data.collectedCrystals || []).length;
      this.saveCrystalsCountEl.textContent = `${count} / 5 Secured`;
    }
    if (this.saveTimestampLabelEl) {
      const date = new Date(data.timestamp);
      this.saveTimestampLabelEl.textContent = `Archived: ${date.toLocaleTimeString()} (${date.toLocaleDateString()})`;
    }
  }

  private updateDiagnosticsTelemetry(): void {
    if (!this.settingsTelemetryEl) return;
    const room = SaveManager.getInstance().getLastKnownRoomId();
    this.settingsTelemetryEl.textContent = `DIAGNOSTIC: ACTIVE SECTOR [${room.toUpperCase()}] // AUDIO SYNTHESIS: OPERATIONAL`;
  }

  private setupSettingsModal(): void {
    const btnToggle = document.getElementById('btn-settings-toggle');
    const btnClose = document.getElementById('btn-close-settings');
    const btnCloseX = document.getElementById('btn-close-settings-x');

    const openSettings = () => {
      this.updateSaveCard();
      this.updateDiagnosticsTelemetry();
      this.modalSettingsEl.classList.remove('hidden');
      this.eventBus.emit('ui:modal_opened', {});
    };

    const closeSettings = () => {
      this.modalSettingsEl.classList.add('hidden');
      this.eventBus.emit('ui:modal_closed', {});
    };

    btnToggle?.addEventListener('click', openSettings);
    btnClose?.addEventListener('click', closeSettings);
    btnCloseX?.addEventListener('click', closeSettings);

    this.modalSettingsEl.addEventListener('click', (e) => {
      if (e.target === this.modalSettingsEl) {
        closeSettings();
      }
    });

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        let handled = false;
        if (!this.modalSettingsEl.classList.contains('hidden')) {
          closeSettings();
          handled = true;
        }
        
        const dossierEl = document.getElementById('modal-dossier');
        if (dossierEl && !dossierEl.classList.contains('hidden')) {
          dossierEl.classList.add('hidden');
          this.eventBus.emit('ui:modal_closed', {});
          handled = true;
        }

        const inspectEl = document.getElementById('modal-inspect');
        if (inspectEl && !inspectEl.classList.contains('hidden')) {
          inspectEl.classList.add('hidden');
          document.querySelector('.ui-layer')?.classList.remove('hidden');
          document.getElementById('inventory-bar')?.classList.remove('hidden');
          this.eventBus.emit('inspect:close', {});
          this.eventBus.emit('ui:modal_closed', {});
          handled = true;
        }

        const crtPatcherEl = document.getElementById('modal-crt-patcher');
        if (crtPatcherEl && !crtPatcherEl.classList.contains('hidden')) {
          crtPatcherEl.classList.add('hidden');
          this.eventBus.emit('ui:modal_closed', {});
          handled = true;
        }

        const invEl = document.getElementById('modal-inventory');
        if (invEl && !invEl.classList.contains('hidden')) {
          invEl.classList.add('hidden');
          this.eventBus.emit('ui:modal_closed', {});
          handled = true;
        }

        const facilityMapEl = document.getElementById('screen-facility-map');
        if (facilityMapEl && !facilityMapEl.classList.contains('hidden')) {
          facilityMapEl.classList.add('hidden');
          this.eventBus.emit('ui:modal_closed', {});
          handled = true;
        }

        if (handled) {
          e.stopPropagation();
        } else {
          // If no modal was open, back out of cinematic views
          this.eventBus.emit('camera:move_to_hotspot', { hotspotId: 'overview' });
        }
      }
    });

    // Volume sliders
    this.settingVolume?.addEventListener('input', () => {
      const vol = parseFloat(this.settingVolume.value);
      if (this.volumeValEl) {
        this.volumeValEl.textContent = `${Math.round(vol * 100)}%`;
      }
      this.eventBus.emit('settings:updated', { masterVolume: vol });
    });

    this.settingSfxVolume?.addEventListener('input', () => {
      const vol = parseFloat(this.settingSfxVolume.value);
      if (this.sfxValEl) {
        this.sfxValEl.textContent = `${Math.round(vol * 100)}%`;
      }
      this.eventBus.emit('settings:updated', { sfxVolume: vol });
    });

    this.settingAmbientVolume?.addEventListener('input', () => {
      const vol = parseFloat(this.settingAmbientVolume.value);
      if (this.ambientValEl) {
        this.ambientValEl.textContent = `${Math.round(vol * 100)}%`;
      }
      this.eventBus.emit('settings:updated', { ambientVolume: vol });
    });

    // Subtitles toggle
    this.settingSubtitles?.addEventListener('change', () => {
      this.subtitlesEnabled = this.settingSubtitles.checked;
      if (!this.subtitlesEnabled) {
        this.subtitleEl.style.opacity = '0';
      }
      this.eventBus.emit('settings:updated', { subtitlesEnabled: this.subtitlesEnabled });
    });

    // Parallax & scanlines
    this.settingParallax?.addEventListener('change', () => {
      this.eventBus.emit('settings:updated', { mouseParallax: this.settingParallax.checked });
    });

    this.settingScanlines?.addEventListener('change', () => {
      const scanlines = document.querySelector('.crt-scanline-mesh') as HTMLElement;
      if (scanlines) {
        scanlines.style.display = this.settingScanlines.checked ? 'block' : 'none';
      }
      this.eventBus.emit('settings:updated', { crtScanlines: this.settingScanlines.checked });
    });

    // Re-center camera
    this.btnRecenterCamera?.addEventListener('click', () => {
      closeSettings();
      this.eventBus.emit('camera:move_to_hotspot', { hotspotId: 'overview' });
    });

    // Save Game button
    this.btnSaveGame?.addEventListener('click', () => {
      const saved = SaveManager.getInstance().saveGame();
      this.updateSaveCard(saved);
      if (this.saveTimestampLabelEl) {
        this.saveTimestampLabelEl.textContent = `Manual archive recorded at ${new Date().toLocaleTimeString()}`;
      }
      this.eventBus.emit('ui:subtitle_changed', {
        text: 'Patient Intake Record manually serialized to browser storage.'
      });
    });

    // Export save file
    this.btnExportSave?.addEventListener('click', () => {
      SaveManager.getInstance().exportSaveFile();
    });

    // Import save file
    this.btnImportSave?.addEventListener('click', () => {
      this.inputImportSave?.click();
    });

    this.inputImportSave?.addEventListener('change', async () => {
      const file = this.inputImportSave.files?.[0];
      if (file) {
        const success = await SaveManager.getInstance().importSaveFile(file);
        if (success) {
          this.updateSaveCard();
          closeSettings();
        }
      }
      this.inputImportSave.value = '';
    });

    // Purge / Reset save
    this.btnResetSave?.addEventListener('click', () => {
      const confirmed = window.confirm('PURGE RECORD: Clear all recovered crystals, inventory assets, and unlocked clearance back to Act I?');
      if (confirmed) {
        closeSettings();
        AudioEngine.getInstance().teardownScenarioAudio();
        SaveManager.getInstance().purgeSave();
        this.eventBus.emit('scenario:switch_room', { targetRoomId: 'room_04' });
        this.eventBus.emit('camera:move_to_hotspot', { hotspotId: 'overview' });
        this.eventBus.emit('ui:subtitle_changed', {
          text: 'Record purged. Returning to Sterile Chamber baseline.'
        });
      }
    });
  }

  private setupInventoryModal(): void {
    const btnToggle = document.getElementById('btn-inventory-toggle');
    const btnClose = document.getElementById('btn-close-inventory');
    const btnCloseX = document.getElementById('btn-close-inventory-x');
    const modal = document.getElementById('modal-inventory');

    const openInventory = () => {
      if (modal) {
        modal.classList.remove('hidden');
        this.eventBus.emit('ui:modal_opened', {});
      }
    };

    const closeInventory = () => {
      if (modal) {
        modal.classList.add('hidden');
        this.eventBus.emit('ui:modal_closed', {});
      }
    };

    btnToggle?.addEventListener('click', openInventory);
    btnClose?.addEventListener('click', closeInventory);
    btnCloseX?.addEventListener('click', closeInventory);

    modal?.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeInventory();
      }
    });
  }

  private setupAudioButtons(): void {
    const btnDrone = document.getElementById('btn-drone');
    btnDrone?.addEventListener('click', () => {
      btnDrone.classList.toggle('active');
      this.eventBus.emit('audio:toggle_synth', {
        type: 'drone',
        active: btnDrone.classList.contains('active')
      });
    });
  }

}
