/**
 * HUD manages the heads-up display, digital speedometer, taxi meter,
 * turn-by-turn navigation widget, 2D radar minimap, gamepad monitor,
 * and the educational A* Algorithm Inspector drawer.
 */
export class HUD {
  constructor(container, callbacks) {
    this.container = container;
    this.callbacks = callbacks || {};

    this.minimapCanvas = null;
    this.minimapCtx = null;
    this.isInspectorOpen = false;

    this._buildUI();
    this._bindEvents();
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

      <!-- SPEEDOMETER & TAXI METER (BOTTOM LEFT) -->
      <div class="hud-bottom-left">
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

    // Start Driving Button
    const startBtn = document.getElementById('btn-start-game');
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

        // Hide Modal
        if (regModalEl) regModalEl.classList.add('hidden');

        // Callback to persist driver profile and apply car visuals
        if (this.callbacks.onDriverRegistered) {
          this.callbacks.onDriverRegistered({
            name: nameVal,
            age: ageVal,
            carColor: selectedColor,
            funSymbol: selectedSymbol
          });
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
   */
  update(car, passengerSys, input, roadNetwork, monorailSys = null) {
    // 1. Speedometer & Gear
    const kmh = car.getSpeedKmh();
    document.getElementById('val-speed').innerText = kmh;

    // SVG Speed ring fill (Circumference = 2 * PI * 70 = ~440)
    const maxKmh = 140;
    const offset = 440 - (Math.min(kmh, maxKmh) / maxKmh) * 440;
    document.getElementById('speed-ring-fill').style.strokeDashoffset = offset;

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
    if (car.isDrifting && car.driftScore > 10) {
      driftBadge.classList.remove('hidden');
      document.getElementById('val-drift').innerText = car.driftScore;
    } else {
      driftBadge.classList.add('hidden');
    }

    // 2. Mission & Passenger Details
    const telemetry = passengerSys.getTelemetry(car.position);
    document.getElementById('val-total-cash').innerText = `$${telemetry.totalEarnings.toFixed(2)}`;
    document.getElementById('val-trips').innerText = telemetry.completedTrips;

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
      nameEl.innerText = telemetry.passenger.name;
      avatar.src = telemetry.passenger.avatar;

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

    document.getElementById('lbl-distance').innerText = `${telemetry.remainingDistance} m`;

    // Mission timer
    const mins = Math.floor(telemetry.tripTimeElapsed / 60).toString().padStart(2, '0');
    const secs = (telemetry.tripTimeElapsed % 60).toString().padStart(2, '0');
    document.getElementById('mission-timer').innerText = `${mins}:${secs}`;

    // 3. A* Navigation Data
    const aStar = telemetry.aStarResult;
    if (aStar && aStar.found) {
      document.getElementById('lbl-nodes-count').innerText = `${aStar.path.length} nodes`;

      // Turn instructions
      if (aStar.directions && aStar.directions.length > 0) {
        const nextStep = aStar.directions[0];
        document.getElementById('turn-instruction').innerText = nextStep.instruction;
        document.getElementById('turn-street').innerText = `${Math.round(nextStep.distance)}m on ${nextStep.streetName}`;

        const icon = document.getElementById('turn-icon');
        if (nextStep.instruction.includes('Right')) icon.innerText = '⮡';
        else if (nextStep.instruction.includes('Left')) icon.innerText = '⮠';
        else if (nextStep.instruction.includes('Arrive')) icon.innerText = '🏁';
        else icon.innerText = '⬆';
      }

      // Populate A* Inspector drawer
      if (this.isInspectorOpen) {
        document.getElementById('astat-nodes').innerText = aStar.nodesEvaluated;
        document.getElementById('astat-time').innerText = `${aStar.executionTimeMs.toFixed(2)} ms`;
        document.getElementById('astat-dist').innerText = `${Math.round(aStar.totalDistance)} m`;
        document.getElementById('astat-waypoints').innerText = aStar.path.length;

        // Steps list
        const stepsContainer = document.getElementById('astar-steps-list');
        stepsContainer.innerHTML = aStar.directions.map((d, i) => `
          <div class="step-item">
            <span class="step-index">#${i + 1}</span>
            <span class="step-text">${d.instruction}</span>
            <span class="step-dist">${d.distance > 0 ? Math.round(d.distance) + 'm' : ''}</span>
          </div>
        `).join('');
      }
    }

    // 4. Gamepad Status Overlay
    const gp = input.getGamepadTelemetry();
    const gpDot = document.getElementById('gp-dot');
    const gpName = document.getElementById('gp-name');
    const gpSticks = document.getElementById('gp-sticks');

    if (gp.connected) {
      gpDot.classList.add('online');
      gpName.innerText = `Gamepad: ${gp.name}`;
      gpSticks.style.display = 'flex';

      // Move left stick nub
      const nub = document.getElementById('gp-stick-l');
      nub.style.transform = `translate(${gp.steer * 14}px, 0px)`;

      // Update trigger bars
      const barLt = document.getElementById('gp-bar-lt');
      const barRt = document.getElementById('gp-bar-rt');
      barLt.style.height = `${Math.max(0, -gp.throttle) * 100}%`;
      barRt.style.height = `${Math.max(0, gp.throttle) * 100}%`;
    } else {
      gpDot.classList.remove('online');
      gpName.innerText = 'Gamepad: Disconnected (Plug In to Play)';
      gpSticks.style.display = 'none';
    }

    // 5. Draw 2D Radar Minimap
    this._renderMinimap(car, passengerSys, roadNetwork, aStar, monorailSys);
  }

  /**
   * Renders the 2D real-time radar minimap canvas.
   */
  _renderMinimap(car, passengerSys, roadNetwork, aStar, monorailSys = null) {
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
    const scaleX = (w - 24) / cityW;
    const scaleZ = (h - 24) / cityD;

    const toMapX = (worldX) => 12 + (worldX - bounds.minX) * scaleX;
    const toMapY = (worldZ) => 12 + (worldZ - bounds.minZ) * scaleZ;

    // Draw road grid lines
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 3;
    for (const seg of roadNetwork.roadSegments) {
      ctx.beginPath();
      ctx.moveTo(toMapX(seg.fromX), toMapY(seg.fromZ));
      ctx.lineTo(toMapX(seg.toX), toMapY(seg.toZ));
      ctx.stroke();
    }

    // Draw active A* Route
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

    // Draw Pickup Point (Green pulsing dot)
    if (passengerSys.pickupNode && passengerSys.state === 'PICKUP') {
      const px = toMapX(passengerSys.pickupNode.x);
      const py = toMapY(passengerSys.pickupNode.z);
      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.arc(px, py, 6, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw Destination Point (Cyan pulsing dot)
    if (passengerSys.destinationNode && passengerSys.state === 'IN_TRANSIT') {
      const dx = toMapX(passengerSys.destinationNode.x);
      const dy = toMapY(passengerSys.destinationNode.z);
      ctx.fillStyle = '#00f0ff';
      ctx.beginPath();
      ctx.arc(dx, dy, 7, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw Elevated Monorail Train (Sleek violet/purple dot)
    if (monorailSys && monorailSys.trainMesh) {
      const mx = toMapX(monorailSys.trainMesh.position.x);
      const my = toMapY(monorailSys.trainMesh.position.z);
      ctx.fillStyle = '#c084fc';
      ctx.beginPath();
      ctx.arc(mx, my, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw Player Taxi (Yellow directional arrow triangle)
    const cx = toMapX(car.position.x);
    const cy = toMapY(car.position.z);

    ctx.save();
    ctx.translate(cx, cy);
    // Heading in radians (in canvas coordinate space: rot around Y corresponds to 2D rotation)
    ctx.rotate(-car.heading);

    ctx.fillStyle = '#ffb703';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, 7);
    ctx.lineTo(5, -6);
    ctx.lineTo(0, -3);
    ctx.lineTo(-5, -6);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();

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
