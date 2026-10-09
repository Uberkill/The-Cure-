export const BINAURAL_HTML_TEMPLATE = `
  <div class="diegetic-housing binaural-housing">
    <div class="diegetic-header">
      <span class="diegetic-model">BINAURAL PHASE SYNTHESIZER // VAULT 04 • ACOUSTIC ATTENUATION</span>
      <button class="diegetic-btn-close" id="btn-close-binaural" aria-label="Step back">DISENGAGE</button>
    </div>
    <div class="diegetic-body">
      <div class="binaural-main-panel">
        <div class="chladni-viewport-container">
          <span class="viewport-title">CHLADNI SAND NODAL RESONANCE PLATE</span>
          <canvas id="chladni-canvas" data-testid="chladni-canvas" width="360" height="360"></canvas>
          <div class="chladni-glare-overlay"></div>
        </div>

        <div class="acoustic-controls-rack">
          <div class="horns-cluster">
            <div class="control-lane">
              <label for="slider-horn-left">LEFT AZIMUTH HORN [DEG]</label>
              <input type="range" min="0" max="180" value="0" id="slider-horn-left" data-testid="slider-horn-left">
              <span class="readout-pill" id="label-horn-left" data-testid="label-horn-left">0&deg;</span>
            </div>
            <div class="control-lane">
              <label for="slider-horn-right">RIGHT AZIMUTH HORN [DEG]</label>
              <input type="range" min="0" max="180" value="180" id="slider-horn-right" data-testid="slider-horn-right">
              <span class="readout-pill" id="label-horn-right" data-testid="label-horn-right">180&deg;</span>
            </div>
          </div>

          <div class="phase-freq-cluster">
            <div class="control-lane">
              <label>WAVE INTERACTION PHASE</label>
              <button class="btn-phase-toggle" id="btn-toggle-phase" data-testid="btn-toggle-phase">
                PHASE: 0&deg; [IN-PHASE]
              </button>
            </div>
            <div class="control-lane">
              <label for="slider-carrier-freq">SOLFEGGIO CARRIER FREQUENCY [HZ]</label>
              <input type="range" min="300" max="900" value="600" id="slider-carrier-freq" data-testid="slider-carrier-freq">
              <span class="readout-pill" id="label-carrier-freq" data-testid="label-carrier-freq">600 HZ</span>
            </div>
          </div>

          <div class="unseal-action-lane">
            <button class="btn-unseal-monolith" id="btn-unseal-monolith" data-testid="btn-unseal-monolith" disabled>
              ACOUSTIC DISSONANCE ACTIVE &bull; DESTRUCTIVE NULL REQUIRED
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
`;
