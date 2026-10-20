import * as THREE from 'three';
import { Engine } from './core/Engine.js';
import { RoadNetwork } from './city/RoadNetwork.js';
import { CityBuilder } from './city/CityBuilder.js';
import { PropsSystem } from './city/PropsSystem.js';
import { TrafficLightSystem } from './city/TrafficLightSystem.js';
import { MonorailSystem } from './city/MonorailSystem.js';
import { Car } from './gameplay/Car.js';
import { PlayerCharacter } from './gameplay/PlayerCharacter.js';
import { InputManager } from './core/InputManager.js';
import { AudioManager } from './core/AudioManager.js';
import { GPSVisualizer } from './pathfinding/GPSVisualizer.js';
import { PassengerSystem } from './gameplay/PassengerSystem.js';
import { PedestrianSystem } from './pedestrians/PedestrianSystem.js';
import { TrafficSystem } from './traffic/TrafficSystem.js';
import { HUD } from './ui/HUD.js';

class GameApp {
  constructor() {
    this.canvasContainer = document.getElementById('canvas-container');
    this.hudContainer = document.getElementById('hud-overlay');

    // Clock for delta timing
    this.clock = new THREE.Clock();
    this.elapsedTime = 0;
    this.lastAStarRecalcTime = 0;

    // Driver Profile
    this.driverProfile = {
      name: 'Ace Driver',
      age: 24,
      carColor: '#ffb703',
      funSymbol: '⚡'
    };

    this.init();
  }

  init() {
    // 1. Initialize Three.js Engine & Renderer (Default to bright sunny DAY)
    this.engine = new Engine(this.canvasContainer);
    this.engine.setWeather('DAY');

    // 2. Build Road Network & Topological Graph for A*
    this.roadNetwork = new RoadNetwork();

    // 3. Build Procedural City with Realistic Architecture, Landmarks & Street Stalls
    this.cityBuilder = new CityBuilder(this.engine.scene, this.roadNetwork);
    this.cityBuilder.setWeatherMode('DAY');

    // 4. Initialize Player Taxi Car
    this.car = new Car(this.engine.scene);
    this.car.reset(0, 0, 0);

    // 5. Initialize On-Foot Driver Player Character (GTA Mode)
    this.playerCharacter = new PlayerCharacter(this.engine.scene);

    // 6. Initialize Sound Synthesizer (Web Audio API)
    this.audio = new AudioManager();

    // Unlock audio on first user gesture
    const unlockAudio = () => {
      this.audio.init();
      window.removeEventListener('click', unlockAudio);
      window.removeEventListener('keydown', unlockAudio);
    };
    window.addEventListener('click', unlockAudio);
    window.addEventListener('keydown', unlockAudio);

    // 7. Initialize GPS Visualizer (glowing path ribbon, beacon, graph debug)
    this.gps = new GPSVisualizer(this.engine.scene);

    // 8. Initialize Passenger Mission System (VIP Surgeons, Celebrities, Speed fiends)
    this.passengerSys = new PassengerSystem(this.engine.scene, this.roadNetwork, this.gps);
    this.passengerSys.startNewMission(this.car.position);

    // 9. Initialize Walking Pedestrians on Sidewalks
    this.pedestrianSys = new PedestrianSystem(this.engine.scene, this.roadNetwork);

    // 10. Initialize AI Traffic Cars Driving on the Roads
    this.trafficSys = new TrafficSystem(this.engine.scene, this.roadNetwork);

    // 11. Initialize Props System (Nitro pickups, Destructibles, Construction barricades)
    this.propsSys = new PropsSystem(this.engine.scene, this.roadNetwork, this.audio);

    // 12. Initialize Intersection Traffic Signals (Red/Yellow/Green)
    this.trafficLights = new TrafficLightSystem(this.engine.scene, this.roadNetwork);

    // 13. Initialize Elevated Monorail Bullet Train System
    this.monorailSys = new MonorailSystem(this.engine.scene, this.roadNetwork);

    // 14. Initialize Input Manager (Keyboard, Mouse Orbit, Gamepad Controller)
    this.input = new InputManager(this.engine.renderer.domElement);

    // Bind Input Action Callbacks
    this.input.on('cameraToggle', () => {
      const mode = this.engine.toggleCameraMode();
      const lbl = document.getElementById('lbl-camera');
      if (lbl) lbl.innerText = mode;
    });

    this.input.on('resetCar', () => {
      const nearest = this.roadNetwork.findNearestNode(this.car.position.x, this.car.position.z);
      if (nearest) {
        this.car.reset(nearest.node.x, nearest.node.z, this.car.heading);
      } else {
        this.car.reset(0, 0, 0);
      }
    });

    this.input.on('horn', () => this.audio.startHorn());
    this.input.on('hornRelease', () => this.audio.stopHorn());

    this.input.on('muteToggle', () => {
      const isMuted = this.audio.toggleMute();
      const lbl = document.getElementById('lbl-sound');
      if (lbl) lbl.innerText = isMuted ? 'MUTED' : 'SOUND ON';
    });

    this.input.on('toggleGraph', () => {
      this.gps.toggleDebugGraph(this.roadNetwork);
    });

    this.input.on('toggleAStarInspector', () => {
      this.hud.toggleInspector();
    });

    // Key T / Button: Summon Taxi in front of player
    this.input.on('callTaxi', () => {
      this.summonTaxiInFrontOfPlayer();
    });

    // Key F / Enter: Enter or Exit Vehicle (GTA-Style)
    this.input.on('enterExitVehicle', () => {
      if (this.playerCharacter.isActive) {
        // Re-enter taxi if close (< 3.4m)
        const dist = this.playerCharacter.position.distanceTo(this.car.position);
        if (dist < 3.4) {
          this.playerCharacter.enterCar();
          this.audio.setInTaxiState(true);
          this.audio.playPickupSound();
          this.hud.showActionToast('🚖 RE-ENTERED TAXI CAB • READY TO DRIVE');
        } else {
          this.hud.showActionToast(`⚠️ GET CLOSER TO TAXI TO ENTER (${Math.round(dist)}m away)`);
        }
      } else {
        // Exit taxi if car speed < 12 km/h
        if (this.car.getSpeedKmh() < 12) {
          this.playerCharacter.exitCar(this.car);
          this.audio.setInTaxiState(false);
          this.engine.setOnFootCameraYaw(this.playerCharacter.heading);
          const pHeading = this.playerCharacter.heading;
          const camDist = this.engine.onFootCamera.distance;
          const camH = this.engine.onFootCamera.height;
          this.engine.currentCameraPos.set(
            this.playerCharacter.position.x - Math.sin(pHeading) * camDist,
            this.playerCharacter.position.y + camH + 1.2,
            this.playerCharacter.position.z - Math.cos(pHeading) * camDist
          );
          this.engine.currentCameraTarget.set(
            this.playerCharacter.position.x,
            this.playerCharacter.position.y + camH,
            this.playerCharacter.position.z
          );
          this.audio.playPickupSound();
          this.hud.showActionToast('🚶 ON FOOT (WASD TO MOVE • MOUSE TO PAN • T TO CALL TAXI)');
        } else {
          this.hud.showActionToast('⚠️ SLOW DOWN TAXI TO EXIT!');
        }
      }
    });

    // Key E: Contextual Interaction (Food stalls, Safehouse bed, Citizens)
    this.input.on('interact', () => {
      if (!this.playerCharacter.isActive) return;
      const interactable = this.playerCharacter.nearbyInteractable;
      if (!interactable) return;

      if (interactable.type === 'CAR') {
        this.playerCharacter.enterCar();
        this.audio.setInTaxiState(true);
        this.audio.playPickupSound();
        this.hud.showActionToast('🚖 RE-ENTERED TAXI CAB');
      } else if (interactable.type === 'FOOD_STALL') {
        const stall = interactable.target;
        if (this.passengerSys.totalEarnings >= stall.price) {
          this.passengerSys.spendMoney(stall.price);
          this.playerCharacter.eatFood(40);
          this.audio.playPickupSound();
          this.hud.showActionToast(`😋 BOUGHT ${stall.item.toUpperCase()} (-$${stall.price.toFixed(2)}) • HP & STAMINA RESTORED!`);
        } else {
          this.hud.showPenaltyToast(`❌ NOT ENOUGH CASH FOR ${stall.item.toUpperCase()} ($${stall.price.toFixed(2)})`);
        }
      } else if (interactable.type === 'BED') {
        this.playerCharacter.health = this.playerCharacter.maxHealth;
        this.playerCharacter.stamina = this.playerCharacter.maxStamina;
        this.audio.playPickupSound();
        this.hud.showActionToast('🛏️ RESTED IN SAFEHOUSE BED • 100% HEALTH & STAMINA RESTORED!');
      } else if (interactable.type === 'NPC') {
        const ped = interactable.target;
        const dialogueLines = [
          "Hey driver! Keep the city moving, we appreciate the taxi service!",
          "Looking for good food? There are hot dog and pretzel stalls around town!",
          "Have you seen the Google campus? The Android mascot statue is really cool!",
          "Engine Company 51 has two heavy firetrucks ready for any emergencies.",
          "Metropolis General Hospital is just up the avenue with their trauma center.",
          "Precinct 99 officers are patrolling the streets today.",
          "Nice ride! If you visit the safehouse garage, you can tune your cab and refill nitro!"
        ];
        const randomQuote = dialogueLines[Math.floor(Math.random() * dialogueLines.length)];
        this.hud.showNpcDialogue(`${ped.archetype || 'Citizen'}`, randomQuote, '🚶');
        this.audio.playPickupSound();
      }
    });

    // 15. Initialize HUD
    this.hud = new HUD(this.hudContainer, {
      onCycleWeather: () => {
        const mode = this.engine.cycleWeather();
        this.cityBuilder.setWeatherMode(mode);
        const lbl = document.getElementById('lbl-weather');
        if (lbl) lbl.innerText = mode;
        return mode;
      },
      onToggleCamera: () => this.engine.toggleCameraMode(),
      onToggleSound: () => this.audio.toggleMute(),
      onResetCar: () => {
        const nearest = this.roadNetwork.findNearestNode(this.car.position.x, this.car.position.z);
        if (nearest) {
          this.car.reset(nearest.node.x, nearest.node.z, this.car.heading);
        } else {
          this.car.reset(0, 0, 0);
        }
      },
      onCallTaxi: () => this.summonTaxiInFrontOfPlayer(),
      onToggleGraph: () => this.gps.toggleDebugGraph(this.roadNetwork),
      onForceRecalc: () => this.passengerSys.recalculateRoute(this.car.position),
      onNextMission: () => this.passengerSys.startNewMission(this.car.position),
      onPreviewCarColor: (color) => {
        this.car.setCarColor(color);
      },
      onPreviewMascotSymbol: (symbol) => {
        this.car.setMascotSymbol(symbol);
      },
      onDriverRegistered: (profile) => {
        this.driverProfile = profile;
        this.car.setCarColor(profile.carColor);
        this.car.setMascotSymbol(profile.funSymbol);
        this.audio.init();
        this.audio.setInTaxiState(true);
        this.audio.playPickupSound();
      },
      onSetMusicVolume: (v) => this.audio.setMusicVolume(v),
      onToggleMusicMute: () => this.audio.toggleMusicMute(),
      onNextRadioStation: () => this.audio.nextRadioStation(),
      onPrevRadioStation: () => this.audio.prevRadioStation()
    }, this.input, this.audio);

    // Start 60 FPS Game Loop
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  animate() {
    requestAnimationFrame(this.animate);

    const delta = Math.min(this.clock.getDelta(), 0.1);
    this.elapsedTime += delta;

    // 1. Process Input
    const drivingInput = this.input.getDrivingInput();
    const cameraInput = this.input.getCameraInput();

    // 2. On-Foot vs Driving Simulation
    if (this.playerCharacter.isActive) {
      // Update On-Foot Character Movement, Sprinting, Jumping, Animation
      const onFootInput = this.input.getOnFootInput();
      this.playerCharacter.update(
        delta,
        onFootInput,
        this.cityBuilder,
        this.car,
        this.pedestrianSys,
        this.engine.getCameraYaw()
      );

      // Car remains parked
      this.car.speed *= 0.95;
      if (this.car.carGroup) {
        this.car.carGroup.position.copy(this.car.position);
        this.car.carGroup.rotation.y = this.car.heading;
      }

      // Camera follows on-foot player
      this.engine.updateCamera(delta, this.playerCharacter, cameraInput, true);

    } else {
      // Update Car Physics & Collisions with City Buildings
      this.car.update(delta, drivingInput, this.cityBuilder, this.audio);

      // Driver Safehouse Tuning & Refuel Check
      if (this.cityBuilder) {
        const safehouseEvent = this.cityBuilder.checkSafehouseZone(this.car, delta, this.audio);
        if (safehouseEvent && safehouseEvent.entered) {
          this.hud.showActionToast(safehouseEvent.message);
        }
      }

      // Camera follows vehicle
      this.engine.updateCamera(delta, this.car, cameraInput, false);
    }

    // 3. Update AI Traffic Cars & Check Vehicle-to-Vehicle Collisions
    if (this.trafficSys) {
      this.trafficSys.update(delta, this.car);
      this.trafficSys.checkCarCollisions(this.car, this.audio);
    }

    // 4. Update Sidewalk Pedestrians & Check Collisions
    if (this.pedestrianSys) {
      this.pedestrianSys.update(delta, this.car, this.audio);
      if (!this.playerCharacter.isActive) {
        const pedHit = this.pedestrianSys.checkCarCollisions(this.car, this.audio);
        if (pedHit && pedHit.hit) {
          this.passengerSys.deductFine(pedHit.penalty);
          this.hud.showPenaltyToast(pedHit.message);
        }
      }
    }

    // 5. Update Traffic Lights & Check Violations ($5 deduction per red light run)
    if (this.trafficLights) {
      this.trafficLights.update(delta);
      if (!this.playerCharacter.isActive) {
        const violation = this.trafficLights.checkRedLightViolation(this.car);
        if (violation && violation.violated) {
          this.passengerSys.deductFine(violation.fine || 5.0);
          this.hud.showPenaltyToast(violation.message || '🚨 RED LIGHT RUNNER! -$5.00 FINE');
        }
      }
    }

    // 6. Update Props System (Nitro pickups, Destructibles, Construction barricades)
    if (this.propsSys) {
      this.propsSys.update(delta, this.elapsedTime);
      if (!this.playerCharacter.isActive) {
        const propEvent = this.propsSys.checkCarInteractions(this.car, this.passengerSys);
        if (propEvent && propEvent.event) {
          if (propEvent.points) {
            this.passengerSys.awardBonus(propEvent.points / 10);
          }
          if (propEvent.message) {
            this.hud.showActionToast(propEvent.message);
          }
          if (propEvent.event === 'ROADBLOCK_HIT') {
            this.passengerSys.recalculateRoute(this.car.position);
          }
        }
      }
    }

    // 7. Update Elevated Monorail Train Loop
    if (this.monorailSys) {
      this.monorailSys.update(delta);
    }

    // 8. Update Passenger Mission State & Distance Checks
    const activeEntity = this.playerCharacter.isActive ? this.playerCharacter : this.car;
    const missionEvent = this.passengerSys.update(delta, this.elapsedTime, activeEntity, this.audio);
    if (missionEvent.event === 'DROPOFF_SUCCESS') {
      this.hud.showFareCelebration(missionEvent);
    }

    // 9. Dynamic A* Path Tracking & Recalculation
    if (this.elapsedTime - this.lastAStarRecalcTime > 1.5) {
      this.lastAStarRecalcTime = this.elapsedTime;
      if (Math.abs(this.car.speed) > 2) {
        this.passengerSys.recalculateRoute(this.car.position);
      }
    }

    // 10. Update GPS Visuals (animated ribbon & destination beacon)
    this.gps.update(delta, this.elapsedTime);

    // 11. Update City Animations (blinking aircraft lights, basketball players, beacons)
    this.cityBuilder.update(this.elapsedTime);

    // 12. Update HUD & Minimap with Radar markers, Food Stalls, Vitals, and Landmarks
    this.hud.update(
      this.car,
      this.passengerSys,
      this.input,
      this.roadNetwork,
      this.monorailSys,
      this.playerCharacter,
      this.cityBuilder
    );

    // 13. Render Scene
    this.engine.render();
  }

  /**
   * Summons the taxi cab directly in front of the on-foot player character.
   */
  summonTaxiInFrontOfPlayer() {
    if (!this.playerCharacter.isActive) {
      this.hud.showActionToast('🚖 ALREADY INSIDE TAXI! (Press F or Enter to exit on foot)');
      return;
    }

    const pPos = this.playerCharacter.position;
    const pHeading = this.playerCharacter.heading;

    // Preferred spawn distance in front of player
    const spawnDist = 4.6;
    let spawnX = pPos.x + Math.sin(pHeading) * spawnDist;
    let spawnZ = pPos.z + Math.cos(pHeading) * spawnDist;
    let spawnHeading = pHeading;

    // Check if the front spot is obstructed by a building or boundary
    if (this.cityBuilder) {
      const colFront = this.cityBuilder.checkCarCollision(spawnX, spawnZ, 1.8);
      if (colFront && colFront.collided) {
        // Try spawning to the right
        const rightX = pPos.x - Math.cos(pHeading) * 3.8;
        const rightZ = pPos.z + Math.sin(pHeading) * 3.8;
        const colRight = this.cityBuilder.checkCarCollision(rightX, rightZ, 1.8);

        if (!colRight || !colRight.collided) {
          spawnX = rightX;
          spawnZ = rightZ;
        } else {
          // Try spawning behind player
          const backX = pPos.x - Math.sin(pHeading) * 3.8;
          const backZ = pPos.z - Math.cos(pHeading) * 3.8;
          const colBack = this.cityBuilder.checkCarCollision(backX, backZ, 1.8);
          if (!colBack || !colBack.collided) {
            spawnX = backX;
            spawnZ = backZ;
          }
        }
      }
    }

    // Reset car position, velocity, and orientation
    this.car.reset(spawnX, spawnZ, spawnHeading);
    this.car.velY = 0;
    this.car.isInAir = false;
    this.car.speed = 0;
    this.car.lateralVelocity = 0;

    // Trigger visual beacon / warp ring effect
    this._triggerTaxiSummonVisual(spawnX, spawnZ);

    // Audio feedback: honk horn
    if (this.audio) {
      this.audio.playPickupSound();
      if (this.audio.startHorn) {
        this.audio.startHorn();
        setTimeout(() => this.audio.stopHorn(), 180);
      }
    }

    // HUD Action toast
    this.hud.showActionToast('🚖 TAXI SUMMONED! Parked right in front of you (Press F to drive)');

    // Recalculate GPS A* route from new car position if trip is active
    if (this.passengerSys && this.passengerSys.isTripActive()) {
      this.passengerSys.recalculateRoute(this.car.position);
    }
  }

  /**
   * Spawns a glowing neon warp ring and vertical holographic beacon when taxi arrives.
   */
  _triggerTaxiSummonVisual(x, z) {
    const ringGeo = new THREE.RingGeometry(0.5, 4.0, 32);
    ringGeo.rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xffb703,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.95
    });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.position.set(x, 0.08, z);
    this.engine.scene.add(ringMesh);

    // Holographic vertical beacon beam
    const beamGeo = new THREE.CylinderGeometry(0.4, 2.8, 14, 16, 1, true);
    const beamMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      transparent: true,
      opacity: 0.7,
      side: THREE.DoubleSide
    });
    const beamMesh = new THREE.Mesh(beamGeo, beamMat);
    beamMesh.position.set(x, 7.0, z);
    this.engine.scene.add(beamMesh);

    const startTime = performance.now();
    const animateSummon = () => {
      const elapsed = (performance.now() - startTime) / 1000;
      if (elapsed > 1.2) {
        this.engine.scene.remove(ringMesh);
        this.engine.scene.remove(beamMesh);
        ringGeo.dispose();
        ringMat.dispose();
        beamGeo.dispose();
        beamMat.dispose();
        return;
      }
      const progress = elapsed / 1.2;
      ringMesh.scale.set(1 + progress * 0.9, 1 + progress * 0.9, 1 + progress * 0.9);
      ringMat.opacity = 0.95 * (1 - progress);
      beamMat.opacity = 0.7 * (1 - progress);
      requestAnimationFrame(animateSummon);
    };
    animateSummon();
  }
}

// Bootstrap application on page load
window.addEventListener('DOMContentLoaded', () => {
  new GameApp();
});
