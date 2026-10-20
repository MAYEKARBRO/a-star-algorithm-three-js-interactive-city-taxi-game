/**
 * HUD manages the heads-up display, digital speedometer, taxi meter,
 * turn-by-turn navigation widget, 2D radar minimap, gamepad monitor,
 * and the educational A* Algorithm Inspector drawer.
 */
export class HUD {
  constructor(container, callbacks, input = null, audio = null) {
    this.container = container;
    this.callbacks = callbacks || {};
    this.input = input;
    this.audio = audio;
    this.dualJoysticksInitialized = false;

    this.minimapCanvas = null;
    this.minimapCtx = null;
    this.isInspectorOpen = false;

    this._buildUI();
    this._bindEvents();
    if (this.input) {
      this._initDualJoysticks(this.input);
    }
  }

  _buildUI() {
    this.container.innerHTML = `
      <!-- TOP STATUS BAR -->
      <header class="hud-topbar">
        <div class="hud-brand">
          <div class="brand-badge" id="brand-mascot">⚡ TAXI</div>
          <span class="brand-title">METROPOLIS A* NAVIGATOR</span>
        </div>

        <!-- DRIVER LICENSE BADGE (Top Center Left) -->
        <div id="driver-license-badge" class="driver-license-badge">
          <span class="dl-symbol" id="dl-symbol">⚡</span>
          <div class="dl-info">
            <span class="dl-name" id="dl-name">Ace Driver</span>
            <span class="dl-age" id="dl-age">Age 24 • Pro Driver</span>
          </div>
          <span class="dl-color-dot" id="dl-color-dot" style="background:#ffb703;"></span>
        </div>

        <div class="hud-top-actions">
          <button id="btn-weather" class="hud-btn" title="Toggle Day/Sunset/Night">
            <span class="icon">☀️</span> <span id="lbl-weather">DAY</span>
          </button>
          <button id="btn-camera" class="hud-btn" title="Toggle Camera (C)">
            <span class="icon">🎥</span> <span id="lbl-camera">CHASE</span>
          </button>
          <button id="btn-sound" class="hud-btn" title="Toggle Audio (M)">
            <span class="icon">🔊</span> <span id="lbl-sound">SOUND ON</span>
          </button>
          <button id="btn-call-taxi" class="hud-btn hud-btn-gold" title="Summon Taxi in front of you (Key T)">
            <span class="icon">🚖</span> CALL TAXI
          </button>
          <button id="btn-reset" class="hud-btn hud-btn-warning" title="Reset Car (R)">
            <span class="icon">🔄</span> RESET
          </button>
          <button id="btn-graph" class="hud-btn hud-btn-accent" title="Toggle 3D A* Road Graph (G)">
            <span class="icon">🌐</span> A* GRAPH
          </button>
          <button id="btn-inspector" class="hud-btn hud-btn-primary" title="Open A* Path Telemetry (I)">
            <span class="icon">⚡</span> A* INSPECTOR
          </button>
        </div>
      </header>

      <!-- GTA TOP-RIGHT CASH COUNTER -->
      <div id="gta-money-panel" class="gta-money-panel">
        <div class="gta-cash-label">TOTAL EARNED CASH</div>
        <div class="gta-money-row">
          <span class="gta-currency">$</span>
          <span id="gta-cash-val">150.00</span>
        </div>
        <div id="gta-cash-diff" class="gta-cash-diff hidden">+$50.00</div>
      </div>

      <!-- PLAYER VITALS CARD (HP & STAMINA) -->
      <div id="player-vitals-card" class="player-vitals-card">
        <div class="vitals-mode-badge driving" id="vitals-mode-badge">🚖 DRIVING CAB</div>
        <div class="vitals-bar-row">
          <span class="vitals-lbl">HP</span>
          <div class="vitals-track">
            <div id="vitals-health-fill" class="vitals-fill health-fill" style="width: 100%;"></div>
          </div>
          <span id="vitals-health-val" class="vitals-num">100</span>
        </div>
        <div class="vitals-bar-row">
          <span class="vitals-lbl">STA</span>
          <div class="vitals-track">
            <div id="vitals-stamina-fill" class="vitals-fill stamina-fill" style="width: 100%;"></div>
          </div>
          <span id="vitals-stamina-val" class="vitals-num">100</span>
        </div>
      </div>

      <!-- GTA INTERACTION PROMPT -->
      <div id="interaction-prompt" class="interaction-prompt hidden">
        <span class="prompt-key" id="prompt-key">E</span>
        <span class="prompt-text" id="prompt-text">INTERACT</span>
      </div>

      <!-- GTA NPC DIALOGUE BOX -->
      <div id="npc-dialogue-box" class="npc-dialogue-box hidden">
        <div class="npc-diag-avatar" id="npc-diag-avatar">🚶</div>
        <div class="npc-diag-content">
          <div class="npc-diag-header">
            <span class="npc-diag-name" id="npc-diag-name">Citizen</span>
            <span class="npc-diag-tag">METROPOLIS NPC</span>
          </div>
          <div class="npc-diag-text" id="npc-diag-text">"Hey driver! Beautiful day for a ride around Metropolis!"</div>
        </div>
      </div>

      <!-- FLOATING PENALTY TOAST -->
      <div id="penalty-toast" class="penalty-toast hidden">
        ⚠️ PEDESTRIAN HIT! -$50.00 FINE
      </div>

      <!-- FLOATING ACTION TOAST -->
      <div id="action-toast" class="action-toast hidden"></div>

      <!-- DRIVER REGISTRATION ONBOARDING MODAL -->
      <div id="modal-registration" class="modal-registration">
        <div class="reg-modal-content">
          <div class="reg-header">
            <div class="reg-badge">🚖 CITY CAB COMMISSION</div>
            <h2 class="reg-title">TAXI DRIVER ENROLLMENT</h2>
            <p class="reg-sub">Enter your credentials and customize your ride before hitting the road!</p>
          </div>

          <div class="reg-form">
            <div class="form-group">
              <label for="driver-input-name">DRIVER NAME</label>
              <input type="text" id="driver-input-name" class="reg-input" value="Ace Driver" maxlength="20" placeholder="e.g. Maverick Fox" />
            </div>

            <div class="form-group">
              <label for="driver-input-age">DRIVER AGE</label>
              <input type="number" id="driver-input-age" class="reg-input" value="24" min="18" max="99" />
            </div>

            <div class="form-group">
              <label>PREFERRED CAR COLOR</label>
              <div class="color-palette" id="color-palette">
                <button type="button" class="color-swatch active" data-color="#ffb703" style="background:#ffb703;" title="Taxi Yellow"></button>
                <button type="button" class="color-swatch" data-color="#00f0ff" style="background:#00f0ff;" title="Electric Cyan"></button>
                <button type="button" class="color-swatch" data-color="#ef4444" style="background:#ef4444;" title="Cherry Red"></button>
                <button type="button" class="color-swatch" data-color="#10b981" style="background:#10b981;" title="Emerald Green"></button>
                <button type="button" class="color-swatch" data-color="#a855f7" style="background:#a855f7;" title="Neon Violet"></button>
                <button type="button" class="color-swatch" data-color="#f97316" style="background:#f97316;" title="Sunset Orange"></button>
                <button type="button" class="color-swatch" data-color="#f1f5f9" style="background:#f1f5f9;" title="Pearl White"></button>
                <button type="button" class="color-swatch" data-color="#1e293b" style="background:#1e293b;" title="Midnight Carbon"></button>
              </div>
            </div>

            <div class="form-group">
              <label>PREFERRED FUN MASCOT SYMBOL</label>
              <div class="symbol-palette" id="symbol-palette">
                <button type="button" class="symbol-btn active" data-symbol="⚡">⚡ Lightning</button>
                <button type="button" class="symbol-btn" data-symbol="🚀">🚀 Rocket</button>
                <button type="button" class="symbol-btn" data-symbol="🔥">🔥 Fire</button>
                <button type="button" class="symbol-btn" data-symbol="👑">👑 Crown</button>
                <button type="button" class="symbol-btn" data-symbol="⭐">⭐ Star</button>
                <button type="button" class="symbol-btn" data-symbol="💎">💎 Diamond</button>
                <button type="button" class="symbol-btn" data-symbol="🏎️">🏎️ Turbo</button>
                <button type="button" class="symbol-btn" data-symbol="🍀">🍀 Lucky</button>
                <button type="button" class="symbol-btn" data-symbol="👾">👾 Alien</button>
              </div>
            </div>

            <button type="button" id="btn-start-game" class="hud-btn hud-btn-primary btn-start-driving">
              START DRIVING NOW ➔
            </button>
          </div>
        </div>
      </div>

      <!-- CINEMATIC "WELCOME TO MAYEKARBRO CITY" TITLE CARD SCREEN -->
      <div id="welcome-city-screen" class="welcome-city-screen hidden">
        <div class="welcome-backdrop-grid"></div>
        <div class="welcome-card">
          <div class="welcome-header-badge">
            <span class="wcb-star">★</span>
            <span>METROPOLIS TRANSIT &amp; TAXI COMMISSION</span>
            <span class="wcb-star">★</span>
          </div>

          <div class="welcome-hero-text">
            <div class="welcome-sub-greeting">WELCOME TO</div>
            <h1 class="welcome-title">
              <span class="wt-line wt-mayekarbro">MAYEKARBRO</span>
              <span class="wt-line wt-city">CITY</span>
            </h1>
          </div>

          <div class="welcome-divider">
            <span class="wd-line"></span>
            <span class="wd-symbol" id="welcome-mascot-icon">⚡</span>
            <span class="wd-line"></span>
          </div>

          <div class="welcome-driver-callout">
            <div class="wdc-badge-pill">
              <span class="wdc-label">AUTHORIZED OPERATOR:</span>
              <span class="wdc-name" id="welcome-driver-name">ACE DRIVER</span>
            </div>
            <div class="wdc-meta" id="welcome-driver-meta">LICENSED CAB OPERATOR • VEHICLE READY</div>
          </div>

          <!-- DYNAMIC PROGRESS LAUNCH BAR -->
          <div class="welcome-loader-track">
            <div id="welcome-loader-fill" class="welcome-loader-fill"></div>
          </div>

          <div class="welcome-skip-hint">CLICK ANYWHERE OR PRESS [SPACE] TO LAUNCH ➔</div>
        </div>
      </div>

      <!-- MISSION CARD (TOP LEFT) -->
      <aside id="mission-card" class="hud-card mission-card">
        <div class="mission-header">
          <span id="mission-badge" class="badge badge-pickup">PICKUP PASSENGER</span>
          <span id="mission-timer" class="mission-timer">00:00</span>
        </div>
        <div class="passenger-body">
          <img id="passenger-avatar" class="passenger-avatar" src="/assets/passenger1.jpg" alt="Passenger" />
          <div class="passenger-details">
            <div id="vip-role-tag" class="vip-role-tag hidden">👑 VIP SURGEON</div>
            <h4 id="passenger-name" class="passenger-name">Alex Vance</h4>
            <p id="passenger-dialogue" class="passenger-dialogue">"Waiting at Grand Central Station, step on it!"</p>
            <div class="destination-row">
              <span class="dest-label">DESTINATION:</span>
              <span id="destination-name" class="dest-target">Times Neon Plaza</span>
            </div>
            <!-- VIP COMFORT METER -->
            <div id="comfort-container" class="comfort-container hidden">
              <div class="comfort-label">
                <span>PASSENGER COMFORT</span>
                <span id="comfort-val">100%</span>
              </div>
              <div class="comfort-track">
                <div id="comfort-fill" class="comfort-fill" style="width: 100%;"></div>
              </div>
            </div>
            <div class="dest-meta">
              <span>Dist: <b id="lbl-distance">0 m</b></span>
              <span>A* Path: <b id="lbl-nodes-count">0 nodes</b></span>
            </div>
          </div>
        </div>
      </aside>

      <!-- TURN-BY-TURN GPS BANNER (TOP CENTER) -->
      <div id="gps-turn-banner" class="hud-card gps-banner">
        <div class="turn-icon" id="turn-icon">➔</div>
        <div class="turn-content">
          <div class="turn-instruction" id="turn-instruction">A* Calculating Route...</div>
          <div class="turn-street" id="turn-street">Follow the glowing neon road path</div>
        </div>
      </div>

      <!-- TAXI RADIO & MUSIC VOLUME ADJUST BAR (LEFT SIDE) -->
      <aside id="taxi-radio-panel" class="taxi-radio-panel">
        <div class="radio-header">
          <div class="radio-title-row">
            <span class="radio-icon">📻</span>
            <div class="radio-title-col">
              <span class="radio-tag">TAXI FM RADIO</span>
              <span id="radio-station-name" class="radio-station">88.5 NEON SYNTH</span>
            </div>
          </div>
          <!-- ANIMATED EQUALIZER BARS -->
          <div class="radio-eq" id="radio-eq">
            <span class="eq-bar eq-1"></span>
            <span class="eq-bar eq-2"></span>
            <span class="eq-bar eq-3"></span>
            <span class="eq-bar eq-4"></span>
          </div>
        </div>

        <div class="radio-track-row">
          <span class="track-status playing" id="radio-track-status">▶ PLAYING</span>
          <span class="track-title" id="radio-track-title">Midnight Highway</span>
        </div>

        <!-- VERTICAL VOLUME SLIDER BAR -->
        <div class="radio-vol-section">
          <button type="button" id="btn-radio-vol-up" class="radio-vol-step-btn" title="Volume Up">+</button>
          
          <div class="radio-slider-container">
            <div class="radio-track-visual">
              <div id="radio-vol-fill" class="radio-vol-fill" style="height: 65%;"></div>
            </div>
            <input type="range" id="radio-vol-slider" class="radio-range-vertical" min="0" max="100" value="65" orient="vertical" title="Music Volume" />
          </div>

          <button type="button" id="btn-radio-vol-down" class="radio-vol-step-btn" title="Volume Down">-</button>
          <div class="radio-vol-badge">
            <span class="radio-vol-label">VOL</span>
            <span id="radio-vol-num" class="radio-vol-val">65%</span>
          </div>
        </div>

        <!-- RADIO CONTROLS FOOTER -->
        <div class="radio-footer-controls">
          <button type="button" id="btn-radio-prev" class="radio-ctrl-btn" title="Previous Station (⏮)">⏮</button>
          <button type="button" id="btn-radio-mute" class="radio-ctrl-btn" title="Mute/Unmute Radio">🔊</button>
          <button type="button" id="btn-radio-next" class="radio-ctrl-btn" title="Next Station (⏭)">⏭</button>
        </div>
      </aside>

      <!-- SPEEDOMETER & TAXI METER (BOTTOM LEFT) -->
      <div class="hud-bottom-left" id="driving-dashboard">
        <!-- TAXI FARE METER -->
        <div class="hud-card taxi-meter">
          <div class="meter-row">
            <span class="meter-label">TOTAL CASH</span>
            <span id="val-total-cash" class="meter-val text-green">$0.00</span>
          </div>
          <div class="meter-row">
            <span class="meter-label">TRIPS COMPLETED</span>
            <span id="val-trips" class="meter-val">0</span>
          </div>
          <div id="drift-badge" class="drift-badge hidden">
            DRIFT <span id="val-drift">0</span> PTS
          </div>
        </div>

        <!-- DIGITAL SPEEDOMETER -->
        <div class="speedometer-widget">
          <svg class="speed-ring" viewBox="0 0 160 160">
            <circle class="ring-bg" cx="80" cy="80" r="70" />
            <circle id="speed-ring-fill" class="ring-fill" cx="80" cy="80" r="70" />
          </svg>
          <div class="speed-content">
            <span id="val-speed" class="speed-number">0</span>
            <span class="speed-unit">KM/H</span>
            <div class="gear-selector">
              <span class="gear" id="gear-p">P</span>
              <span class="gear" id="gear-r">R</span>
              <span class="gear" id="gear-n">N</span>
              <span class="gear active" id="gear-d">D</span>
            </div>
          </div>
        </div>

        <!-- NITRO BOOST METER -->
        <div class="nitro-gauge">
          <div class="nitro-gauge-header">
            <span>⚡ NITRO [SHIFT]</span>
            <span id="val-nitro">100%</span>
          </div>
          <div class="nitro-track">
            <div id="nitro-fill" class="nitro-fill" style="width: 100%;"></div>
          </div>
        </div>
      </div>

      <!-- ON-FOOT QUICK ACTION DOCK (GTA STYLE - NO BULKY JOYSTICK OVERLAYS) -->
      <div id="onfoot-overlay" class="onfoot-overlay hidden">
        <div class="onfoot-actions-dock" id="onfoot-actions-dock">
          <button type="button" id="btn-onfoot-sprint" class="onfoot-action-btn btn-sprint" title="Sprint (Shift / L-Stick)">
            <span class="oab-icon">⚡</span>
            <span class="oab-lbl">SPRINT</span>
          </button>
          <button type="button" id="btn-onfoot-jump" class="onfoot-action-btn btn-jump" title="Jump (Space)">
            <span class="oab-icon">⬆️</span>
            <span class="oab-lbl">JUMP</span>
          </button>
          <button type="button" id="btn-onfoot-call-taxi" class="onfoot-action-btn btn-call-taxi" title="Summon Taxi in front of you (Key T)">
            <span class="oab-icon">📡</span>
            <span class="oab-lbl">CALL TAXI</span>
          </button>
          <button type="button" id="btn-onfoot-interact" class="onfoot-action-btn btn-interact" title="Interact (E)">
            <span class="oab-icon">💬</span>
            <span class="oab-lbl" id="lbl-onfoot-interact">INTERACT</span>
          </button>
          <button type="button" id="btn-onfoot-car" class="onfoot-action-btn btn-car" title="Enter Taxi (F)">
            <span class="oab-icon">🚖</span>
            <span class="oab-lbl">ENTER CAB</span>
          </button>
        </div>
      </div>

      <!-- MINIMAP RADAR & GAMEPAD STATUS (BOTTOM RIGHT) -->
      <div class="hud-bottom-right">
        <!-- GAMEPAD STATUS OVERLAY -->
        <div id="gamepad-badge" class="gamepad-card">
          <div class="gamepad-header">
            <span class="gp-dot" id="gp-dot"></span>
            <span id="gp-name">Gamepad: Disconnected</span>
          </div>
          <div class="gp-sticks" id="gp-sticks">
            <div class="stick-box">
              <div class="stick-nub" id="gp-stick-l"></div>
            </div>
            <div class="gp-triggers">
              <span class="trigger-bar" id="gp-bar-lt" title="LT / Brake"></span>
              <span class="trigger-bar" id="gp-bar-rt" title="RT / Gas"></span>
            </div>
          </div>
        </div>

        <!-- RADAR MINIMAP -->
        <div class="minimap-container">
          <canvas id="minimap-canvas" width="220" height="220"></canvas>
          <div class="minimap-overlay-label">GPS RADAR</div>
          <button id="btn-recalc" class="minimap-recalc-btn" title="Force A* Recalculate">⚡ RECALC</button>
        </div>
      </div>

      <!-- A* ALGORITHM INSPECTOR DRAWER (MODAL) -->
      <div id="astar-drawer" class="astar-drawer hidden">
        <div class="drawer-header">
          <div class="drawer-title">
            <span class="icon">⚡</span> A* (A-STAR) PATHFINDING TELEMETRY
          </div>
          <button id="btn-close-drawer" class="close-btn">&times;</button>
        </div>

        <div class="drawer-body">
          <div class="drawer-section">
            <div class="section-title">CORE EQUATION & HEURISTIC</div>
            <div class="equation-box">
              <code>f(n) = g(n) + h(n)</code>
              <p><b>g(n):</b> Exact road travel distance from start node to current node n.</p>
              <p><b>h(n):</b> Admissible Euclidean heuristic: <code>√((x₂ - x₁)² + (z₂ - z₁)²)</code>.</p>
              <p><b>f(n):</b> Lowest predicted total cost to reach destination.</p>
            </div>
          </div>

          <div class="drawer-stats-grid">
            <div class="stat-card">
              <span class="stat-lbl">NODES EVALUATED</span>
              <span id="astat-nodes" class="stat-val text-blue">0</span>
            </div>
            <div class="stat-card">
              <span class="stat-lbl">EXECUTION TIME</span>
              <span id="astat-time" class="stat-val text-green">0.00 ms</span>
            </div>
            <div class="stat-card">
              <span class="stat-lbl">ROUTE DISTANCE</span>
              <span id="astat-dist" class="stat-val text-amber">0 m</span>
            </div>
            <div class="stat-card">
              <span class="stat-lbl">PATH WAYPOINTS</span>
              <span id="astat-waypoints" class="stat-val">0</span>
            </div>
          </div>

          <div class="drawer-section">
            <div class="section-title">TURN-BY-TURN STEP DECOMPOSITION</div>
            <div id="astar-steps-list" class="steps-list">
              <!-- Dynamically populated -->
            </div>
          </div>

          <div class="drawer-actions">
            <button id="btn-drawer-graph" class="hud-btn hud-btn-accent">Toggle 3D Road Graph Visualizer (G)</button>
          </div>
        </div>
      </div>

      <!-- MISSION COMPLETED CELEBRATION MODAL -->
      <div id="modal-celebration" class="modal-celebration hidden">
        <div class="modal-content">
          <div class="confetti-icon">🎉</div>
          <h2 class="modal-title">FARE COMPLETED!</h2>
          <div class="stars-row">★★★★★</div>
          <p id="celebration-quote" class="modal-quote">"Awesome driving! Keep the change!"</p>

          <div class="fare-breakdown">
            <div class="breakdown-row"><span>Base Fare:</span> <span id="cb-base">$15.00</span></div>
            <div class="breakdown-row"><span>Distance Fare:</span> <span id="cb-dist">$0.00</span></div>
            <div class="breakdown-row"><span>Speed Bonus:</span> <span id="cb-time" class="text-green">+$0.00</span></div>
            <div class="breakdown-row"><span>Drift Bonus:</span> <span id="cb-drift" class="text-amber">+$0.00</span></div>
            <div class="breakdown-total"><span>TOTAL EARNINGS:</span> <span id="cb-total" class="text-green">$0.00</span></div>
          </div>

          <button id="btn-next-fare" class="hud-btn hud-btn-primary btn-large">NEXT PASSENGER ➔</button>
        </div>
      </div>
    `;

    // Cache elements
    this.minimapCanvas = document.getElementById('minimap-canvas');
    this.minimapCtx = this.minimapCanvas.getContext('2d');
  }

  _bindEvents() {
    // Weather button
    document.getElementById('btn-weather').addEventListener('click', () => {
      if (this.callbacks.onCycleWeather) {
        const mode = this.callbacks.onCycleWeather();
        document.getElementById('lbl-weather').innerText = mode;
      }
    });

    // Camera button
    document.getElementById('btn-camera').addEventListener('click', () => {
      if (this.callbacks.onToggleCamera) {
        const mode = this.callbacks.onToggleCamera();
        document.getElementById('lbl-camera').innerText = mode;
      }
    });

    // Sound button
    document.getElementById('btn-sound').addEventListener('click', () => {
      if (this.callbacks.onToggleSound) {
        const isMuted = this.callbacks.onToggleSound();
        document.getElementById('lbl-sound').innerText = isMuted ? 'MUTED' : 'SOUND ON';
      }
    });

    // Call Taxi top button
    const btnCallTaxi = document.getElementById('btn-call-taxi');
    if (btnCallTaxi) {
      btnCallTaxi.addEventListener('click', () => {
        if (this.callbacks.onCallTaxi) {
          this.callbacks.onCallTaxi();
        } else if (this.input) {
          this.input.triggerAction('callTaxi');
        }
      });
    }

    // Reset button
    document.getElementById('btn-reset').addEventListener('click', () => {
      if (this.callbacks.onResetCar) this.callbacks.onResetCar();
    });

    // 3D Graph button
    document.getElementById('btn-graph').addEventListener('click', () => {
      if (this.callbacks.onToggleGraph) this.callbacks.onToggleGraph();
    });

    // Inspector button
    document.getElementById('btn-inspector').addEventListener('click', () => {
      this.toggleInspector();
    });

    document.getElementById('btn-close-drawer').addEventListener('click', () => {
      this.toggleInspector(false);
    });

    document.getElementById('btn-drawer-graph').addEventListener('click', () => {
      if (this.callbacks.onToggleGraph) this.callbacks.onToggleGraph();
    });

    document.getElementById('btn-recalc').addEventListener('click', () => {
      if (this.callbacks.onForceRecalc) this.callbacks.onForceRecalc();
    });

    document.getElementById('btn-next-fare').addEventListener('click', () => {
      document.getElementById('modal-celebration').classList.add('hidden');
      if (this.callbacks.onNextMission) this.callbacks.onNextMission();
    });

    // Taxi Radio & Volume Slider Events
    const volSlider = document.getElementById('radio-vol-slider');
    if (volSlider) {
      volSlider.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value) / 100;
        if (this.callbacks.onSetMusicVolume) this.callbacks.onSetMusicVolume(val);
        else if (this.audio) this.audio.setMusicVolume(val);
      });
    }

    const btnVolUp = document.getElementById('btn-radio-vol-up');
    if (btnVolUp) {
      btnVolUp.addEventListener('click', () => {
        if (!this.audio) return;
        const current = this.audio.getMusicVolume ? this.audio.getMusicVolume() : 0.65;
        const next = Math.min(1.0, current + 0.05);
        if (this.callbacks.onSetMusicVolume) this.callbacks.onSetMusicVolume(next);
        else this.audio.setMusicVolume(next);
        if (volSlider) volSlider.value = Math.round(next * 100);
      });
    }

    const btnVolDown = document.getElementById('btn-radio-vol-down');
    if (btnVolDown) {
      btnVolDown.addEventListener('click', () => {
        if (!this.audio) return;
        const current = this.audio.getMusicVolume ? this.audio.getMusicVolume() : 0.65;
        const next = Math.max(0.0, current - 0.05);
        if (this.callbacks.onSetMusicVolume) this.callbacks.onSetMusicVolume(next);
        else this.audio.setMusicVolume(next);
        if (volSlider) volSlider.value = Math.round(next * 100);
      });
    }

    const btnNextStation = document.getElementById('btn-radio-next');
    if (btnNextStation) {
      btnNextStation.addEventListener('click', () => {
        if (this.callbacks.onNextRadioStation) this.callbacks.onNextRadioStation();
        else if (this.audio) this.audio.nextRadioStation();
      });
    }

    const btnPrevStation = document.getElementById('btn-radio-prev');
    if (btnPrevStation) {
      btnPrevStation.addEventListener('click', () => {
        if (this.callbacks.onPrevRadioStation) this.callbacks.onPrevRadioStation();
        else if (this.audio) this.audio.prevRadioStation();
      });
    }

    const btnRadioMute = document.getElementById('btn-radio-mute');
    if (btnRadioMute) {
      btnRadioMute.addEventListener('click', () => {
        if (this.callbacks.onToggleMusicMute) this.callbacks.onToggleMusicMute();
        else if (this.audio) this.audio.toggleMusicMute();
      });
    }

    // Driver Registration Form State
    let selectedColor = '#ffb703';
    let selectedSymbol = '⚡';

    const nameInputEl = document.getElementById('driver-input-name');
    const ageInputEl = document.getElementById('driver-input-age');
    const regModalEl = document.getElementById('modal-registration');

    // Prevent 3D scene from intercepting clicks and keystrokes on inputs
    [nameInputEl, ageInputEl].forEach(inputEl => {
      if (!inputEl) return;
      ['keydown', 'keyup', 'keypress', 'mousedown', 'mouseup', 'click'].forEach(evt => {
        inputEl.addEventListener(evt, (e) => e.stopPropagation());
      });
    });

    // Color Swatches Selection
    const swatches = document.querySelectorAll('.color-swatch');
    swatches.forEach(swatch => {
      swatch.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        swatches.forEach(s => s.classList.remove('active'));
        swatch.classList.add('active');
        selectedColor = swatch.getAttribute('data-color') || swatch.dataset.color;

        // Instant live preview of car color on the 3D model!
        if (this.callbacks.onPreviewCarColor) {
          this.callbacks.onPreviewCarColor(selectedColor);
        }
      });
    });

    // Mascot Symbols Selection
    const symbolBtns = document.querySelectorAll('.symbol-btn');
    symbolBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        symbolBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedSymbol = btn.getAttribute('data-symbol') || btn.dataset.symbol;

        // Instant live preview of mascot symbol on car rooftop sign!
        if (this.callbacks.onPreviewMascotSymbol) {
          this.callbacks.onPreviewMascotSymbol(selectedSymbol);
        }
      });
    });

    // Start Driving Button -> Cinematic Welcome Title Screen Transition
    const startBtn = document.getElementById('btn-start-game');
    const welcomeScreenEl = document.getElementById('welcome-city-screen');
    const welcomeNameEl = document.getElementById('welcome-driver-name');
    const welcomeMetaEl = document.getElementById('welcome-driver-meta');
    const welcomeIconEl = document.getElementById('welcome-mascot-icon');
    const welcomeFillEl = document.getElementById('welcome-loader-fill');

    if (startBtn) {
      startBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();

        const nameVal = nameInputEl ? (nameInputEl.value.trim() || 'Ace Driver') : 'Ace Driver';
        const ageVal = ageInputEl ? (parseInt(ageInputEl.value) || 24) : 24;

        // Update HUD License Badge in topbar
        document.getElementById('dl-name').innerText = nameVal;
        document.getElementById('dl-age').innerText = `Age ${ageVal} • Licensed`;
        document.getElementById('dl-symbol').innerText = selectedSymbol;
        document.getElementById('dl-color-dot').style.background = selectedColor;
        document.getElementById('brand-mascot').innerText = `${selectedSymbol} TAXI`;

        // Hide Driver Registration Modal
        if (regModalEl) regModalEl.classList.add('hidden');

        // Play audio feedback chime
        if (this.audio) {
          if (this.audio.init) this.audio.init();
          if (this.audio.playPickupSound) this.audio.playPickupSound();
        }

        // Setup and launch the stylized "WELCOME TO MAYEKARBRO CITY" card
        if (welcomeScreenEl) {
          if (welcomeNameEl) welcomeNameEl.innerText = nameVal.toUpperCase();
          if (welcomeMetaEl) welcomeMetaEl.innerText = `AGE ${ageVal} • TAXI LICENSE #099 ACTIVE • READY FOR PICKUPS`;
          if (welcomeIconEl) welcomeIconEl.innerText = selectedSymbol;

          // Reveal with smooth entrance animation
          welcomeScreenEl.classList.remove('hidden', 'welcome-exit');
          welcomeScreenEl.classList.add('welcome-active');

          // Reset and trigger loader bar animation
          if (welcomeFillEl) {
            welcomeFillEl.style.animation = 'none';
            void welcomeFillEl.offsetWidth;
            welcomeFillEl.style.animation = 'welcomeLoaderBar 2.5s cubic-bezier(0.16, 1, 0.3, 1) forwards';
          }

          let hasDismissed = false;
          const dismissWelcome = () => {
            if (hasDismissed) return;
            hasDismissed = true;

            welcomeScreenEl.classList.add('welcome-exit');
            window.removeEventListener('keydown', onKeyDismiss);
            welcomeScreenEl.removeEventListener('click', dismissWelcome);

            setTimeout(() => {
              welcomeScreenEl.classList.add('hidden');
              welcomeScreenEl.classList.remove('welcome-active', 'welcome-exit');

              // Callback to persist driver profile and start gameplay
              if (this.callbacks.onDriverRegistered) {
                this.callbacks.onDriverRegistered({
                  name: nameVal,
                  age: ageVal,
                  carColor: selectedColor,
                  funSymbol: selectedSymbol
                });
              }

              this.showActionToast('🚖 WELCOME TO MAYEKARBRO CITY! PRESS W/↑ TO ACCELERATE');
            }, 480);
          };

          const onKeyDismiss = (evt) => {
            if (evt.code === 'Space' || evt.code === 'Enter') {
              dismissWelcome();
            }
          };

          window.addEventListener('keydown', onKeyDismiss);
          welcomeScreenEl.addEventListener('click', dismissWelcome);

          // Auto-advance after 2.6 seconds if user doesn't click
          setTimeout(dismissWelcome, 2600);
        } else {
          // Fallback if welcome screen element is not present
          if (this.callbacks.onDriverRegistered) {
            this.callbacks.onDriverRegistered({
              name: nameVal,
              age: ageVal,
              carColor: selectedColor,
              funSymbol: selectedSymbol
            });
          }
        }
      });
    }

    // Allow re-opening driver registration anytime by clicking License Badge
    const licenseBadge = document.getElementById('driver-license-badge');
    if (licenseBadge) {
      licenseBadge.style.cursor = 'pointer';
      licenseBadge.title = 'Click to edit your Driver Profile, Car Color, or Mascot';
      licenseBadge.addEventListener('click', (e) => {
        e.stopPropagation();
        if (regModalEl) {
          regModalEl.classList.remove('hidden');
          if (nameInputEl) nameInputEl.focus();
        }
      });
    }
  }

  /**
   * Initializes Left and Right Virtual Joysticks & action buttons for on-foot player controls.
   * - Left Joystick: 360-degree analog movement
   * - Right Joystick: 360-degree analog camera panning & tilt
   * - Action Buttons: Sprint (hold/toggle), Jump, Interact, Enter/Exit Cab
   * @param {import('../core/InputManager.js').InputManager} input
   */
  _initDualJoysticks(input) {
    if (!input || this.dualJoysticksInitialized) return;
    this.dualJoysticksInitialized = true;

    const setupJoystick = (baseEl, knobEl, onMove, onRelease) => {
      if (!baseEl || !knobEl) return;
      let activePointerId = null;
      let startX = 0;
      let startY = 0;
      const maxRadius = 46; // max travel distance in pixels

      const handlePointerDown = (e) => {
        if (activePointerId !== null) return;
        activePointerId = e.pointerId;
        baseEl.setPointerCapture(e.pointerId);

        const rect = baseEl.getBoundingClientRect();
        startX = rect.left + rect.width / 2;
        startY = rect.top + rect.height / 2;

        handlePointerMove(e);
      };

      const handlePointerMove = (e) => {
        if (e.pointerId !== activePointerId) return;
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        const dist = Math.hypot(dx, dy);
        const clampedDist = Math.min(dist, maxRadius);
        const angle = Math.atan2(dy, dx);

        const knobX = Math.cos(angle) * clampedDist;
        const knobY = Math.sin(angle) * clampedDist;

        knobEl.style.transform = `translate3d(${knobX}px, ${knobY}px, 0)`;

        // Normalized outputs -1 to 1:
        // Horizontal: right (+1), left (-1)
        // Vertical: pushing up (+1) is negative screen Y, pushing down (-1) is positive screen Y
        const normX = knobX / maxRadius;
        const normY = -knobY / maxRadius;

        onMove(normX, normY);
      };

      const handlePointerUp = (e) => {
        if (e.pointerId !== activePointerId) return;
        activePointerId = null;
        try {
          baseEl.releasePointerCapture(e.pointerId);
        } catch (_) {}

        knobEl.style.transition = 'transform 0.16s cubic-bezier(0.2, 0.9, 0.3, 1)';
        knobEl.style.transform = 'translate3d(0, 0, 0)';
        setTimeout(() => {
          knobEl.style.transition = '';
        }, 180);

        onRelease();
      };

      baseEl.addEventListener('pointerdown', handlePointerDown);
      baseEl.addEventListener('pointermove', handlePointerMove);
      baseEl.addEventListener('pointerup', handlePointerUp);
      baseEl.addEventListener('pointercancel', handlePointerUp);
    };

    // 1. Left Joystick: Move Character (if present)
    const leftBase = document.getElementById('joy-base-left');
    const leftKnob = document.getElementById('joy-knob-left');
    if (leftBase && leftKnob) {
      setupJoystick(
        leftBase,
        leftKnob,
        (x, y) => input.setLeftJoystick(x, y),
        () => input.setLeftJoystick(0, 0)
      );
    }

    // 2. Right Joystick: Pan Around Camera (if present)
    const rightBase = document.getElementById('joy-base-right');
    const rightKnob = document.getElementById('joy-knob-right');
    if (rightBase && rightKnob) {
      setupJoystick(
        rightBase,
        rightKnob,
        (x, y) => input.setRightJoystick(x, y),
        () => input.setRightJoystick(0, 0)
      );
    }

    // 3. Action Buttons (Sprint, Jump, Interact, Enter Cab)
    const btnSprint = document.getElementById('btn-onfoot-sprint');
    const btnJump = document.getElementById('btn-onfoot-jump');
    const btnInteract = document.getElementById('btn-onfoot-interact');
    const btnCar = document.getElementById('btn-onfoot-car');

    if (btnSprint) {
      let isSprintToggled = false;
      const startSprint = (e) => {
        e.preventDefault();
        input.setVirtualAction('sprint', true);
        btnSprint.classList.add('active');
      };
      const endSprint = (e) => {
        e.preventDefault();
        if (!isSprintToggled) {
          input.setVirtualAction('sprint', false);
          btnSprint.classList.remove('active');
        }
      };
      btnSprint.addEventListener('pointerdown', startSprint);
      btnSprint.addEventListener('pointerup', endSprint);
      btnSprint.addEventListener('pointercancel', endSprint);

      btnSprint.addEventListener('dblclick', (e) => {
        e.preventDefault();
        isSprintToggled = !isSprintToggled;
        input.setVirtualAction('sprint', isSprintToggled);
        btnSprint.classList.toggle('active', isSprintToggled);
      });
    }

    if (btnJump) {
      btnJump.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        input.setVirtualAction('jump', true);
        btnJump.classList.add('active');
        setTimeout(() => {
          input.setVirtualAction('jump', false);
          btnJump.classList.remove('active');
        }, 160);
      });
    }

    if (btnInteract) {
      btnInteract.addEventListener('click', (e) => {
        e.preventDefault();
        input.triggerAction('interact');
      });
    }

    const btnCallTaxiDock = document.getElementById('btn-onfoot-call-taxi');
    if (btnCallTaxiDock) {
      btnCallTaxiDock.addEventListener('click', (e) => {
        e.preventDefault();
        input.triggerAction('callTaxi');
      });
    }

    if (btnCar) {
      btnCar.addEventListener('click', (e) => {
        e.preventDefault();
        input.triggerAction('enterExitVehicle');
      });
    }
  }

  /**
   * Displays an animated red penalty warning when hitting a pedestrian.
   * @param {string} message
   */
  showPenaltyToast(message) {
    const toast = document.getElementById('penalty-toast');
    if (!toast) return;
    toast.innerText = message;
    toast.classList.remove('hidden');
    toast.classList.add('toast-shake');

    clearTimeout(this.toastTimeout);
    this.toastTimeout = setTimeout(() => {
      toast.classList.add('hidden');
      toast.classList.remove('toast-shake');
    }, 2800);
  }

  /**
   * Displays a vibrant animated action toast (Stunt airtime, hydrant smash, police alert, etc.)
   * @param {string} message
   */
  showActionToast(message) {
    const toast = document.getElementById('action-toast');
    if (!toast) return;
    toast.innerText = message;
    toast.classList.remove('hidden');

    clearTimeout(this.actionToastTimeout);
    this.actionToastTimeout = setTimeout(() => {
      toast.classList.add('hidden');
    }, 2400);
  }

  toggleInspector(forceState = null) {
    this.isInspectorOpen = forceState !== null ? forceState : !this.isInspectorOpen;
    const drawer = document.getElementById('astar-drawer');
    if (this.isInspectorOpen) {
      drawer.classList.remove('hidden');
    } else {
      drawer.classList.add('hidden');
    }
  }

  /**
   * Updates HUD telemetry every frame.
   * @param {import('../gameplay/Car.js').Car} car
   * @param {import('../gameplay/PassengerSystem.js').PassengerSystem} passengerSys
   * @param {import('../core/InputManager.js').InputManager} input
   * @param {import('../city/RoadNetwork.js').RoadNetwork} roadNetwork
   * @param {import('../city/MonorailSystem.js').MonorailSystem} [monorailSys]
   * @param {import('../gameplay/PlayerCharacter.js').PlayerCharacter} [playerCharacter]
   * @param {import('../city/CityBuilder.js').CityBuilder} [cityBuilder]
   */
  update(car, passengerSys, input, roadNetwork, monorailSys = null, playerCharacter = null, cityBuilder = null) {
    // 1. Speedometer & Gear
    const kmh = car.getSpeedKmh();
    const speedEl = document.getElementById('val-speed');
    if (speedEl) speedEl.innerText = kmh;

    // SVG Speed ring fill (Circumference = 2 * PI * 70 = ~440)
    const maxKmh = 140;
    const offset = 440 - (Math.min(kmh, maxKmh) / maxKmh) * 440;
    const ringEl = document.getElementById('speed-ring-fill');
    if (ringEl) ringEl.style.strokeDashoffset = offset;

    const gear = car.getGear();
    ['p', 'r', 'n', 'd'].forEach(g => {
      const el = document.getElementById(`gear-${g}`);
      if (el) el.classList.toggle('active', g.toUpperCase() === gear);
    });

    // Nitro gauge meter
    const nitroEl = document.getElementById('val-nitro');
    const nitroFillEl = document.getElementById('nitro-fill');
    if (nitroEl && nitroFillEl) {
      const pct = Math.round((car.nitro / car.maxNitro) * 100);
      nitroEl.innerText = `${pct}%`;
      nitroFillEl.style.width = `${pct}%`;
      nitroFillEl.classList.toggle('boosting', !!car.isBoosting);
    }

    // Drift badge
    const driftBadge = document.getElementById('drift-badge');
    if (driftBadge) {
      if (car.isDrifting && car.driftScore > 10) {
        driftBadge.classList.remove('hidden');
        document.getElementById('val-drift').innerText = car.driftScore;
      } else {
        driftBadge.classList.add('hidden');
      }
    }

    // 2. Mission & Passenger Details
    const telemetry = passengerSys.getTelemetry(playerCharacter && playerCharacter.isActive ? playerCharacter.position : car.position);
    const meterCashEl = document.getElementById('val-total-cash');
    if (meterCashEl) meterCashEl.innerText = `$${telemetry.totalEarnings.toFixed(2)}`;
    const tripsEl = document.getElementById('val-trips');
    if (tripsEl) tripsEl.innerText = telemetry.completedTrips;

    // ---------------------------------------------------------
    // TOP-RIGHT GTA CASH COUNTER WITH ANIMATED DIFF
    // ---------------------------------------------------------
    const gtaCashEl = document.getElementById('gta-cash-val');
    const gtaDiffEl = document.getElementById('gta-cash-diff');
    if (gtaCashEl) {
      const currentCash = telemetry.totalEarnings;
      gtaCashEl.innerText = currentCash.toFixed(2);

      if (this.lastCash !== undefined && Math.abs(currentCash - this.lastCash) > 0.01) {
        const diff = currentCash - this.lastCash;
        if (gtaDiffEl) {
          gtaDiffEl.innerText = diff > 0 ? `+$${diff.toFixed(2)}` : `-$${Math.abs(diff).toFixed(2)}`;
          gtaDiffEl.className = diff > 0 ? 'gta-cash-diff text-green' : 'gta-cash-diff text-red';
          gtaDiffEl.classList.remove('hidden');

          clearTimeout(this.cashDiffTimeout);
          this.cashDiffTimeout = setTimeout(() => {
            if (gtaDiffEl) gtaDiffEl.classList.add('hidden');
          }, 2200);
        }
      }
      this.lastCash = currentCash;
    }

    // ---------------------------------------------------------
    // PLAYER CHARACTER VITALS & DRIVING/ON-FOOT MODE
    // ---------------------------------------------------------
    if (playerCharacter) {
      const hpFill = document.getElementById('vitals-health-fill');
      const hpVal = document.getElementById('vitals-health-val');
      const staFill = document.getElementById('vitals-stamina-fill');
      const staVal = document.getElementById('vitals-stamina-val');
      const modeBadge = document.getElementById('vitals-mode-badge');

      const hpPct = Math.max(0, Math.min(100, Math.round((playerCharacter.health / playerCharacter.maxHealth) * 100)));
      const staPct = Math.max(0, Math.min(100, Math.round((playerCharacter.stamina / playerCharacter.maxStamina) * 100)));

      if (hpFill) hpFill.style.width = `${hpPct}%`;
      if (hpVal) hpVal.innerText = hpPct;
      if (staFill) staFill.style.width = `${staPct}%`;
      if (staVal) staVal.innerText = staPct;

      if (modeBadge) {
        if (playerCharacter.isActive) {
          modeBadge.innerText = '🚶 ON FOOT • WASD TO MOVE • MOUSE TO PAN (T: CALL TAXI)';
          modeBadge.className = 'vitals-mode-badge on-foot';
        } else {
          modeBadge.innerText = '🚖 DRIVING CAB (EXIT: F)';
          modeBadge.className = 'vitals-mode-badge driving';
        }
      }

      // Toggle On-Foot Actions Overlay vs Driving Dashboard
      const onFootOverlay = document.getElementById('onfoot-overlay') || document.getElementById('dual-joystick-overlay');
      const drivingDash = document.getElementById('driving-dashboard');

      if (playerCharacter.isActive) {
        if (onFootOverlay) onFootOverlay.classList.remove('hidden');
        if (drivingDash) drivingDash.classList.add('hidden');

        // Dynamically style action buttons according to nearby proximity
        const btnCar = document.getElementById('btn-onfoot-car');
        const btnInteract = document.getElementById('btn-onfoot-interact');
        const lblInteract = document.getElementById('lbl-onfoot-interact');

        if (playerCharacter.nearbyInteractable) {
          const it = playerCharacter.nearbyInteractable;
          if (it.type === 'CAR') {
            if (btnCar) btnCar.classList.add('pulse-glow');
            if (btnInteract) btnInteract.classList.remove('pulse-glow');
          } else {
            if (btnCar) btnCar.classList.remove('pulse-glow');
            if (btnInteract) {
              btnInteract.classList.add('pulse-glow');
              if (lblInteract) {
                lblInteract.innerText = it.type === 'FOOD_STALL' ? 'BUY FOOD' : (it.type === 'BED' ? 'REST BED' : 'TALK');
              }
            }
          }
        } else {
          if (btnCar) btnCar.classList.remove('pulse-glow');
          if (btnInteract) {
            btnInteract.classList.remove('pulse-glow');
            if (lblInteract) lblInteract.innerText = 'INTERACT';
          }
        }
      } else {
        if (onFootOverlay) onFootOverlay.classList.add('hidden');
        if (drivingDash) drivingDash.classList.remove('hidden');
      }

      // ---------------------------------------------------------
      // TAXI RADIO & MUSIC VOLUME ADJUST BAR UPDATE
      // ---------------------------------------------------------
      if (this.audio) {
        const stationEl = document.getElementById('radio-station-name');
        const trackEl = document.getElementById('radio-track-title');
        const statusEl = document.getElementById('radio-track-status');
        const eqEl = document.getElementById('radio-eq');
        const volNumEl = document.getElementById('radio-vol-num');
        const volFillEl = document.getElementById('radio-vol-fill');
        const muteBtn = document.getElementById('btn-radio-mute');

        const st = this.audio.getCurrentStation ? this.audio.getCurrentStation() : null;
        if (st && stationEl) stationEl.innerText = st.name;
        if (st && trackEl) trackEl.innerText = st.track;

        const isPlaying = !playerCharacter.isActive && !this.audio.isMusicMuted && !this.audio.isMuted;
        if (statusEl) {
          statusEl.innerText = playerCharacter.isActive ? '⏸ OUTSIDE TAXI' : (this.audio.isMusicMuted ? '🔇 MUTED' : '▶ PLAYING');
          statusEl.className = isPlaying ? 'track-status playing' : 'track-status paused';
        }
        if (eqEl) {
          if (isPlaying) eqEl.classList.remove('paused');
          else eqEl.classList.add('paused');
        }

        const volPct = Math.round((this.audio.getMusicVolume ? this.audio.getMusicVolume() : 0.65) * 100);
        if (volNumEl) volNumEl.innerText = `${volPct}%`;
        if (volFillEl) volFillEl.style.height = `${volPct}%`;
        if (muteBtn) {
          muteBtn.innerText = (this.audio.isMusicMuted || this.audio.isMuted) ? '🔇' : '🔊';
        }
      }

      // Interaction Prompt
      const promptEl = document.getElementById('interaction-prompt');
      const promptKey = document.getElementById('prompt-key');
      const promptText = document.getElementById('prompt-text');

      if (promptEl && promptKey && promptText) {
        if (playerCharacter.nearbyInteractable) {
          promptKey.innerText = playerCharacter.nearbyInteractable.key || 'E';
          promptText.innerText = playerCharacter.nearbyInteractable.prompt;
          promptEl.classList.remove('hidden');
        } else if (!playerCharacter.isActive && kmh < 12) {
          promptKey.innerText = 'F';
          promptText.innerText = 'EXIT TAXI & EXPLORE CITY';
          promptEl.classList.remove('hidden');
        } else {
          promptEl.classList.add('hidden');
        }
      }
    }

    // VIP Role tag & comfort meter
    const vipTag = document.getElementById('vip-role-tag');
    const comfortBox = document.getElementById('comfort-container');
    const comfortFill = document.getElementById('comfort-fill');
    const comfortVal = document.getElementById('comfort-val');

    if (telemetry.passenger && telemetry.passenger.role) {
      if (vipTag) {
        vipTag.classList.remove('hidden');
        vipTag.innerText = telemetry.passenger.role.title || 'VIP PASSENGER';
      }
      if (comfortBox && telemetry.passenger.comfortMeter !== undefined) {
        comfortBox.classList.remove('hidden');
        const comf = Math.round(telemetry.passenger.comfortMeter);
        if (comfortVal) comfortVal.innerText = `${comf}%`;
        if (comfortFill) {
          comfortFill.style.width = `${comf}%`;
          comfortFill.classList.toggle('low', comf < 35);
        }
      }
    } else {
      if (vipTag) vipTag.classList.add('hidden');
      if (comfortBox) comfortBox.classList.add('hidden');
    }

    const missionBadge = document.getElementById('mission-badge');
    const destName = document.getElementById('destination-name');
    const avatar = document.getElementById('passenger-avatar');
    const nameEl = document.getElementById('passenger-name');
    const dialogueEl = document.getElementById('passenger-dialogue');

    if (telemetry.passenger) {
      if (nameEl) nameEl.innerText = telemetry.passenger.name;
      if (avatar) avatar.src = telemetry.passenger.avatar;

      if (missionBadge && destName && dialogueEl) {
        if (telemetry.state === 'PICKUP') {
          missionBadge.className = 'badge badge-pickup';
          missionBadge.innerText = 'PICKUP PASSENGER';
          destName.innerText = telemetry.pickupNode ? telemetry.pickupNode.name : 'Pickup Point';
          dialogueEl.innerText = `"${telemetry.passenger.dialoguePickup}"`;
        } else if (telemetry.state === 'IN_TRANSIT') {
          missionBadge.className = 'badge badge-transit';
          missionBadge.innerText = 'IN TRANSIT';
          destName.innerText = telemetry.destinationNode ? telemetry.destinationNode.name : 'Destination';
          dialogueEl.innerText = `Heading to ${destName.innerText}!`;
        }
      }
    }

    const distEl = document.getElementById('lbl-distance');
    if (distEl) distEl.innerText = `${telemetry.remainingDistance} m`;

    // Mission timer
    const timerEl = document.getElementById('mission-timer');
    if (timerEl) {
      const mins = Math.floor(telemetry.tripTimeElapsed / 60).toString().padStart(2, '0');
      const secs = (telemetry.tripTimeElapsed % 60).toString().padStart(2, '0');
      timerEl.innerText = `${mins}:${secs}`;
    }

    // 3. A* Navigation Data
    const aStar = telemetry.aStarResult;
    if (aStar && aStar.found) {
      const nodesCountEl = document.getElementById('lbl-nodes-count');
      if (nodesCountEl) nodesCountEl.innerText = `${aStar.path.length} nodes`;

      // Turn instructions
      if (aStar.directions && aStar.directions.length > 0) {
        const nextStep = aStar.directions[0];
        const turnInstEl = document.getElementById('turn-instruction');
        const turnStreetEl = document.getElementById('turn-street');
        if (turnInstEl) turnInstEl.innerText = nextStep.instruction;
        if (turnStreetEl) turnStreetEl.innerText = `${Math.round(nextStep.distance)}m on ${nextStep.streetName}`;

        const icon = document.getElementById('turn-icon');
        if (icon) {
          if (nextStep.instruction.includes('Right')) icon.innerText = '⮡';
          else if (nextStep.instruction.includes('Left')) icon.innerText = '⮠';
          else if (nextStep.instruction.includes('Arrive')) icon.innerText = '🏁';
          else icon.innerText = '⬆';
        }
      }

      // Populate A* Inspector drawer
      if (this.isInspectorOpen) {
        document.getElementById('astat-nodes').innerText = aStar.nodesEvaluated;
        document.getElementById('astat-time').innerText = `${aStar.executionTimeMs.toFixed(2)} ms`;
        document.getElementById('astat-dist').innerText = `${Math.round(aStar.totalDistance)} m`;
        document.getElementById('astat-waypoints').innerText = aStar.path.length;

        const stepsContainer = document.getElementById('astar-steps-list');
        if (stepsContainer) {
          stepsContainer.innerHTML = aStar.directions.map((d, i) => `
            <div class="step-item">
              <span class="step-index">#${i + 1}</span>
              <span class="step-text">${d.instruction}</span>
              <span class="step-dist">${d.distance > 0 ? Math.round(d.distance) + 'm' : ''}</span>
            </div>
          `).join('');
        }
      }
    }

    // 4. Gamepad Status Overlay
    const gp = input.getGamepadTelemetry();
    const gpDot = document.getElementById('gp-dot');
    const gpName = document.getElementById('gp-name');
    const gpSticks = document.getElementById('gp-sticks');

    if (gp.connected) {
      if (gpDot) gpDot.classList.add('online');
      if (gpName) gpName.innerText = `Gamepad: ${gp.name}`;
      if (gpSticks) gpSticks.style.display = 'flex';

      const nub = document.getElementById('gp-stick-l');
      if (nub) nub.style.transform = `translate(${gp.steer * 14}px, 0px)`;

      const barLt = document.getElementById('gp-bar-lt');
      const barRt = document.getElementById('gp-bar-rt');
      if (barLt) barLt.style.height = `${Math.max(0, -gp.throttle) * 100}%`;
      if (barRt) barRt.style.height = `${Math.max(0, gp.throttle) * 100}%`;
    } else {
      if (gpDot) gpDot.classList.remove('online');
      if (gpName) gpName.innerText = 'Gamepad: Disconnected (Plug In to Play)';
      if (gpSticks) gpSticks.style.display = 'none';
    }

    // 5. Draw 2D Radar Minimap with Landmarks, Food Stalls, and Player
    this._renderMinimap(car, passengerSys, roadNetwork, aStar, monorailSys, playerCharacter, cityBuilder);
  }

  /**
   * Displays GTA-style dialogue box when interacting with a pedestrian citizen.
   * @param {string} npcName
   * @param {string} message
   * @param {string} [avatar='🚶']
   */
  showNpcDialogue(npcName, message, avatar = '🚶') {
    const box = document.getElementById('npc-dialogue-box');
    if (!box) return;
    const nameEl = document.getElementById('npc-diag-name');
    const textEl = document.getElementById('npc-diag-text');
    const avEl = document.getElementById('npc-diag-avatar');

    if (nameEl) nameEl.innerText = npcName;
    if (textEl) textEl.innerText = `"${message}"`;
    if (avEl) avEl.innerText = avatar;

    box.classList.remove('hidden');

    clearTimeout(this.npcDialogueTimeout);
    this.npcDialogueTimeout = setTimeout(() => {
      box.classList.add('hidden');
    }, 4500);
  }

  /**
   * Renders the 2D real-time radar minimap canvas with:
   * Basketball Court, Safehouse, Central Gardens, Hospital, Police, Fire, Google HQ, Food Stalls.
   */
  _renderMinimap(car, passengerSys, roadNetwork, aStar, monorailSys = null, playerCharacter = null, cityBuilder = null) {
    if (!this.minimapCtx) return;
    const ctx = this.minimapCtx;
    const w = this.minimapCanvas.width;
    const h = this.minimapCanvas.height;

    ctx.clearRect(0, 0, w, h);

    // Dark radar background
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, w, h);

    // City Bounds map scaling
    const bounds = roadNetwork.getCityBounds();
    const cityW = bounds.maxX - bounds.minX;
    const cityD = bounds.maxZ - bounds.minZ;
    const scaleX = (w - 28) / cityW;
    const scaleZ = (h - 28) / cityD;

    const toMapX = (worldX) => 14 + (worldX - bounds.minX) * scaleX;
    const toMapY = (worldZ) => 14 + (worldZ - bounds.minZ) * scaleZ;

    // 1. Draw Central Park Green Lawn
    const parkMinX = toMapX(-70);
    const parkMinZ = toMapY(-70);
    const parkMaxX = toMapX(70);
    const parkMaxZ = toMapY(70);
    ctx.fillStyle = 'rgba(21, 128, 61, 0.35)';
    ctx.fillRect(parkMinX, parkMinZ, parkMaxX - parkMinX, parkMaxZ - parkMinZ);

    // 2. Draw road grid lines
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 3;
    for (const seg of roadNetwork.roadSegments) {
      ctx.beginPath();
      ctx.moveTo(toMapX(seg.fromX), toMapY(seg.fromZ));
      ctx.lineTo(toMapX(seg.toX), toMapY(seg.toZ));
      ctx.stroke();
    }

    // 3. Draw active A* Route
    if (aStar && aStar.path && aStar.path.length > 1) {
      ctx.strokeStyle = passengerSys.state === 'PICKUP' ? '#10b981' : '#00f0ff';
      ctx.lineWidth = 4;
      ctx.shadowColor = ctx.strokeStyle;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.moveTo(toMapX(aStar.path[0].x), toMapY(aStar.path[0].z));
      for (let i = 1; i < aStar.path.length; i++) {
        ctx.lineTo(toMapX(aStar.path[i].x), toMapY(aStar.path[i].z));
      }
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    // 4. Draw Key City Landmarks with Badges & Icons
    const landmarks = [
      { name: 'Safehouse', icon: '🏠', x: -175, z: 175, color: '#f59e0b' },
      { name: 'Basketball', icon: '🏀', x: 105, z: -105, color: '#3b82f6' },
      { name: 'Garden', icon: '🌳', x: 0, z: 0, color: '#10b981' },
      { name: 'Hospital', icon: '🏥', x: 175, z: 175, color: '#ef4444' },
      { name: 'Police', icon: '🚓', x: -105, z: -175, color: '#00f0ff' },
      { name: 'Fire Dept', icon: '🚒', x: -175, z: -105, color: '#f97316' },
      { name: 'Google HQ', icon: '🌐', x: 105, z: 105, color: '#4285F4' },
      { name: 'Residential', icon: '🏡', x: -105, z: 245, color: '#a855f7' }
    ];

    for (const lm of landmarks) {
      const lx = toMapX(lm.x);
      const ly = toMapY(lm.z);

      // Glowing pin badge background
      ctx.fillStyle = lm.color;
      ctx.shadowColor = lm.color;
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(lx, ly, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Icon emoji label
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(lm.icon, lx, ly);

      // Landmark label above icon
      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 8px sans-serif';
      ctx.fillText(lm.name, lx, ly - 9);
    }

    // 5. Draw Street Food Stalls
    if (cityBuilder && cityBuilder.foodStalls) {
      ctx.fillStyle = '#f59e0b';
      for (const stall of cityBuilder.foodStalls) {
        const sx = toMapX(stall.x);
        const sy = toMapY(stall.z);

        ctx.beginPath();
        ctx.arc(sx, sy, 3.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.font = '8px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(stall.icon || '🌭', sx, sy - 5);
      }
    }

    // 6. Draw Pickup Point (Green pulsing circle)
    if (passengerSys.pickupNode && passengerSys.state === 'PICKUP') {
      const px = toMapX(passengerSys.pickupNode.x);
      const py = toMapY(passengerSys.pickupNode.z);
      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.arc(px, py, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    // 7. Draw Destination Point (Cyan pulsing circle)
    if (passengerSys.destinationNode && passengerSys.state === 'IN_TRANSIT') {
      const dx = toMapX(passengerSys.destinationNode.x);
      const dy = toMapY(passengerSys.destinationNode.z);
      ctx.fillStyle = '#00f0ff';
      ctx.beginPath();
      ctx.arc(dx, dy, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    // 8. Draw Elevated Monorail Train (Violet dot)
    if (monorailSys && monorailSys.trainMesh) {
      const mx = toMapX(monorailSys.trainMesh.position.x);
      const my = toMapY(monorailSys.trainMesh.position.z);
      ctx.fillStyle = '#c084fc';
      ctx.beginPath();
      ctx.arc(mx, my, 4.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // 9. Draw Player Taxi Vehicle
    const cx = toMapX(car.position.x);
    const cy = toMapY(car.position.z);

    if (playerCharacter && playerCharacter.isActive) {
      // Parked Car as yellow outline rectangle
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(-car.heading);
      ctx.fillStyle = '#ffb703';
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.fillRect(-3, -5, 6, 10);
      ctx.strokeRect(-3, -5, 6, 10);
      ctx.restore();

      // On-Foot Player Character as Cyan Pulsing Dot with Pointer
      const px = toMapX(playerCharacter.position.x);
      const py = toMapY(playerCharacter.position.z);

      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(-playerCharacter.heading);

      ctx.fillStyle = '#00f0ff';
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(0, 0, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Pointer direction
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, 7);
      ctx.stroke();
      ctx.restore();

      // "YOU" Label
      ctx.fillStyle = '#00f0ff';
      ctx.font = 'bold 8px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('YOU', px, py - 7);

    } else {
      // Driving Car as Yellow Arrow
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(-car.heading);

      ctx.fillStyle = '#ffb703';
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, 8);
      ctx.lineTo(6, -6);
      ctx.lineTo(0, -3);
      ctx.lineTo(-6, -6);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    // Radar border ring
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, w - 2, h - 2);
  }

  /**
   * Shows the celebration modal when a fare completes.
   * @param {Object} fareData
   */
  showFareCelebration(fareData) {
    document.getElementById('celebration-quote').innerText = fareData.message || 'Great trip!';
    document.getElementById('cb-base').innerText = `$${fareData.baseFare.toFixed(2)}`;
    document.getElementById('cb-dist').innerText = `$${fareData.distFare.toFixed(2)}`;
    document.getElementById('cb-time').innerText = `+$${fareData.timeBonus.toFixed(2)}`;
    document.getElementById('cb-drift').innerText = `+$${fareData.driftBonus.toFixed(2)}`;
    document.getElementById('cb-total').innerText = `$${fareData.fare.toFixed(2)}`;

    document.getElementById('modal-celebration').classList.remove('hidden');
  }
}
