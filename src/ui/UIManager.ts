import { EventBus } from '../core/EventBus';
import { SaveManager } from '../core/SaveManager';
import { AudioEngine } from '../audio/AudioEngine';
import { SaveGameData } from '../types';
import { FacilityMapScreen } from './screens/FacilityMapScreen';
import { CRTNodePatcher } from '../entities/CRTNodePatcher';

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
  private devAuthorized: boolean = false;

  private modalSettingsEl!: HTMLElement;
  private settingVolume!: HTMLInputElement;
  private settingSfxVolume!: HTMLInputElement;
  private settingAmbientVolume!: HTMLInputElement;
  private settingParallax!: HTMLInputElement;

  private inputDevCode!: HTMLInputElement | null;
  private btnSubmitDevCode!: HTMLElement | null;
  private devAuthFeedback!: HTMLElement | null;
  private devClearanceBadge!: HTMLElement | null;
  private devAuthForm!: HTMLElement | null;
  private devUnlockedControls!: HTMLElement | null;
  private btnDevToggleFromSettings!: HTMLElement | null;
  private btnDevRelock!: HTMLElement | null;
  private btnDev3dToggle!: HTMLElement | null;

  private volumeValEl!: HTMLElement;
  private sfxValEl!: HTMLElement;
  private ambientValEl!: HTMLElement;
  private btnCameraDisengage!: HTMLElement | null;
  private navDisengageTarget!: HTMLElement | null;
  private currentHotspotId: string = 'overview';
  private unsubscribers: Array<() => void> = [];
  private keydownHandler: ((e: KeyboardEvent) => void) | null = null;
  private mousemoveHandler: ((e: MouseEvent) => void) | null = null;

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
    this.settingParallax = document.getElementById('setting-parallax') as HTMLInputElement;

    this.inputDevCode = document.getElementById('input-dev-code') as HTMLInputElement | null;
    this.btnSubmitDevCode = document.getElementById('btn-submit-dev-code');
    this.devAuthFeedback = document.getElementById('dev-auth-feedback');
    this.devClearanceBadge = document.getElementById('dev-clearance-badge');
    this.devAuthForm = document.getElementById('dev-auth-form');
    this.devUnlockedControls = document.getElementById('dev-unlocked-controls');
    this.btnDevToggleFromSettings = document.getElementById('btn-dev-toggle-from-settings');
    this.btnDevRelock = document.getElementById('btn-dev-relock');
    this.btnDev3dToggle = document.getElementById('btn-dev-3d-toggle');

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
    this.btnCameraDisengage = document.getElementById('btn-camera-disengage');
    this.navDisengageTarget = document.getElementById('nav-disengage-target');
  }

  private setupListeners(): void {
    this.mousemoveHandler = (e: MouseEvent) => {
      if (this.reticleWrapEl) {
        this.reticleWrapEl.style.left = `${e.clientX}px`;
        this.reticleWrapEl.style.top = `${e.clientY}px`;
      }
    };
    window.addEventListener('mousemove', this.mousemoveHandler);

    this.unsubscribers.push(
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
      }),

      this.eventBus.on('save:updated', ({ save }) => {
        this.updateSaveCard(save);
      }),

      this.eventBus.on('save:cleared', () => {
        this.updateSaveCard();
      }),

      this.eventBus.on('input:object_hovered', ({ label }) => {
        if (label) {
          this.reticlePromptEl.textContent = label;
          this.reticlePromptEl.style.opacity = '1';
        } else {
          this.reticlePromptEl.style.opacity = '0';
        }
      }),

      this.eventBus.on('ui:chapter_display', (payload) => {
        this.displayChapterCard(payload.act, payload.title, payload.roomCode, payload.durationMs);
      }),

      this.eventBus.on('telemetry:log', ({ level, message }) => {
        if (this.telemetryEl) {
          this.telemetryEl.textContent = `DIAGNOSTIC: ${message.slice(0, 40)}`;
          if (level === 'error') {
            this.telemetryEl.style.color = 'var(--color-crimson-wax)';
          } else {
            this.telemetryEl.style.color = 'var(--ink-muted)';
          }
        }
      }),

      this.eventBus.on('camera:move_to_hotspot', ({ hotspotId }) => {
        this.setCameraHotspot(hotspotId);
      }),

      this.eventBus.on('scenario:switch_room', () => {
        this.setCameraHotspot('overview');
      })
    );

    const btnFacilityMap = document.getElementById('btn-facility-map-toggle');
    btnFacilityMap?.addEventListener('click', () => {
      this.eventBus.emit('ui:open_facility_map', {});
    });

    this.btnCameraDisengage?.addEventListener('click', () => {
      this.triggerCameraDisengage();
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

    this.keydownHandler = (e: KeyboardEvent) => {
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
          CRTNodePatcher.getInstance().close();
          handled = true;
        }

        const facilityMapEl = document.getElementById('screen-facility-map');
        if (facilityMapEl && !facilityMapEl.classList.contains('hidden')) {
          FacilityMapScreen.getInstance().close();
          handled = true;
        }

        if (handled) {
          e.stopImmediatePropagation();
        } else {
          // If no modal was open, back out of cinematic views
          this.triggerCameraDisengage();
        }
      }
    };
    window.addEventListener('keydown', this.keydownHandler);

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

    // Subtitles are permanent clinical transcripts and cannot be disabled
    this.subtitlesEnabled = true;

    // Parallax
    this.settingParallax?.addEventListener('change', () => {
      this.eventBus.emit('settings:updated', { mouseParallax: this.settingParallax.checked });
    });

    // Developer Mode Clearance Authentication
    this.initDevClearance();

    const handleAuthSubmit = () => {
      const code = this.inputDevCode?.value.trim();
      if (code === '333') {
        this.setDevAuthorized(true, true);
        if (this.devAuthFeedback) {
          this.devAuthFeedback.textContent = '[CLEARANCE GRANTED: LEVEL 3 AUTHORIZED]';
          this.devAuthFeedback.style.color = '#15803d';
          this.devAuthFeedback.classList.remove('hidden');
        }
        AudioEngine.getInstance().playTumblerClick();
      } else {
        if (this.devAuthFeedback) {
          this.devAuthFeedback.textContent = '[ACCESS DENIED: INVALID CLEARANCE CIPHER]';
          this.devAuthFeedback.style.color = 'var(--color-crimson-wax)';
          this.devAuthFeedback.classList.remove('hidden');
        }
        if (this.inputDevCode) {
          this.inputDevCode.style.borderColor = 'var(--color-crimson-wax)';
          setTimeout(() => {
            if (this.inputDevCode) this.inputDevCode.style.borderColor = '';
          }, 1500);
        }
      }
    };

    this.btnSubmitDevCode?.addEventListener('click', handleAuthSubmit);
    this.inputDevCode?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleAuthSubmit();
      }
    });

    this.btnDevRelock?.addEventListener('click', () => {
      this.setDevAuthorized(false, true);
      if (this.devAuthFeedback) {
        this.devAuthFeedback.textContent = '[CLEARANCE REVOKED: LOCKDOWN ENGAGED]';
        this.devAuthFeedback.style.color = 'var(--ink-secondary)';
        this.devAuthFeedback.classList.remove('hidden');
      }
      if (this.inputDevCode) this.inputDevCode.value = '';
    });

    this.btnDevToggleFromSettings?.addEventListener('click', () => {
      closeSettings();
      this.eventBus.emit('dev:toggle_gizmo', {});
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
    btnToggle?.addEventListener('click', () => {
      this.eventBus.emit('ui:open_asset_manifest', {});
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

  public isDevAuthorized(): boolean {
    return this.devAuthorized;
  }

  public setDevAuthorized(authorized: boolean, persist: boolean = true): void {
    this.devAuthorized = authorized;
    if (persist) {
      try {
        sessionStorage.setItem('vault_dev_authorized', authorized ? 'true' : 'false');
      } catch {}
    }

    if (this.btnDev3dToggle) {
      this.btnDev3dToggle.classList.toggle('hidden', !authorized);
    }

    if (this.devClearanceBadge) {
      if (authorized) {
        this.devClearanceBadge.textContent = 'LEVEL 3 // AUTHORIZED';
        this.devClearanceBadge.style.color = '#15803d';
        this.devClearanceBadge.style.borderColor = 'rgba(21, 128, 61, 0.4)';
      } else {
        this.devClearanceBadge.textContent = 'LEVEL 0 // LOCKED';
        this.devClearanceBadge.style.color = 'var(--color-crimson-wax)';
        this.devClearanceBadge.style.borderColor = 'rgba(139, 30, 35, 0.3)';
      }
    }

    if (this.devAuthForm) {
      this.devAuthForm.classList.toggle('hidden', authorized);
    }
    if (this.devUnlockedControls) {
      this.devUnlockedControls.classList.toggle('hidden', !authorized);
    }

    this.eventBus.emit('dev:authorized', { authorized });
  }

  private initDevClearance(): void {
    const params = new URLSearchParams(window.location.search);
    const urlAuthorized = params.get('dev') === 'true' || params.get('editor') === 'true';
    let sessionAuthorized = false;
    try {
      sessionAuthorized = sessionStorage.getItem('vault_dev_authorized') === 'true';
    } catch {}

    this.setDevAuthorized(urlAuthorized || sessionAuthorized, false);
  }

  private triggerCameraDisengage(): void {
    if (this.btnCameraDisengage) {
      this.btnCameraDisengage.classList.add('pressed');
      window.setTimeout(() => {
        this.btnCameraDisengage?.classList.remove('pressed');
      }, 150);
    }

    try {
      AudioEngine.getInstance().playTumblerClick();
    } catch (err: unknown) {
      void err;
    }

    this.eventBus.emit('camera:move_to_hotspot', { hotspotId: 'overview' });
  }

  private setCameraHotspot(hotspotId: string): void {
    this.currentHotspotId = hotspotId;
    if (!this.btnCameraDisengage) return;

    if (hotspotId !== 'overview') {
      this.btnCameraDisengage.classList.remove('hidden');
      this.btnCameraDisengage.setAttribute('aria-hidden', 'false');
      if (this.navDisengageTarget) {
        const cleanName = hotspotId.toUpperCase().replace(/^DOOR_PORTAL_/, 'TO ');
        this.navDisengageTarget.textContent = `// ${cleanName}`;
      }
    } else {
      this.btnCameraDisengage.classList.add('hidden');
      this.btnCameraDisengage.setAttribute('aria-hidden', 'true');
    }
  }

  public getCurrentHotspot(): string {
    return this.currentHotspotId;
  }

  public destroy(): void {
    if (this.keydownHandler) {
      window.removeEventListener('keydown', this.keydownHandler);
      this.keydownHandler = null;
    }
    if (this.mousemoveHandler) {
      window.removeEventListener('mousemove', this.mousemoveHandler);
      this.mousemoveHandler = null;
    }
    for (const unsub of this.unsubscribers) {
      unsub();
    }
    this.unsubscribers = [];
    if (this.chapterFadeTimeout !== null) {
      window.clearTimeout(this.chapterFadeTimeout);
      this.chapterFadeTimeout = null;
    }
    if (this.subtitleTimer !== null) {
      window.clearTimeout(this.subtitleTimer);
      this.subtitleTimer = null;
    }
  }
}
