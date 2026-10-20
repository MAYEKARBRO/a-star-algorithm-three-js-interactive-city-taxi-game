import * as THREE from 'three';
import { Engine } from './core/Engine.js';
import { RoadNetwork } from './city/RoadNetwork.js';
import { CityBuilder } from './city/CityBuilder.js';
import { PropsSystem } from './city/PropsSystem.js';
import { TrafficLightSystem } from './city/TrafficLightSystem.js';
import { MonorailSystem } from './city/MonorailSystem.js';
import { Car } from './gameplay/Car.js';
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

    // 3. Build Procedural City with 5 Distinct Architectural Patterns & Lush Trees
    this.cityBuilder = new CityBuilder(this.engine.scene, this.roadNetwork);

    // 4. Initialize Player Taxi Car
    this.car = new Car(this.engine.scene);
    this.car.reset(0, 0, 0);

    // 5. Initialize Sound Synthesizer (Web Audio API)
    this.audio = new AudioManager();

    // Unlock audio on first user gesture
    const unlockAudio = () => {
      this.audio.init();
      window.removeEventListener('click', unlockAudio);
      window.removeEventListener('keydown', unlockAudio);
    };
    window.addEventListener('click', unlockAudio);
    window.addEventListener('keydown', unlockAudio);

    // 6. Initialize GPS Visualizer (glowing path ribbon, beacon, graph debug)
    this.gps = new GPSVisualizer(this.engine.scene);

    // 7. Initialize Passenger Mission System (VIP Surgeons, Celebrities, Speed fiends)
    this.passengerSys = new PassengerSystem(this.engine.scene, this.roadNetwork, this.gps);
    this.passengerSys.startNewMission(this.car.position);

    // 8. Initialize Walking Pedestrians on Sidewalks
    this.pedestrianSys = new PedestrianSystem(this.engine.scene, this.roadNetwork);

    // 9. Initialize AI Traffic Cars Driving on the Roads
    this.trafficSys = new TrafficSystem(this.engine.scene, this.roadNetwork);

    // 10. Initialize Props System (Nitro pickups, Destructibles, Construction barricades)
    this.propsSys = new PropsSystem(this.engine.scene, this.roadNetwork, this.audio);

    // 11. Initialize Intersection Traffic Signals (Red/Yellow/Green)
    this.trafficLights = new TrafficLightSystem(this.engine.scene, this.roadNetwork);

    // 12. Initialize Elevated Monorail Bullet Train System
    this.monorailSys = new MonorailSystem(this.engine.scene, this.roadNetwork);

    // 13. Initialize Input Manager (Keyboard, Mouse Orbit, Gamepad Controller)
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

    // 14. Initialize HUD
    this.hud = new HUD(this.hudContainer, {
      onCycleWeather: () => {
        const mode = this.engine.cycleWeather();
        const lbl = document.getElementById('lbl-weather');
        if (lbl) lbl.innerText = mode;
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
        this.audio.playPickupSound();
      }
    });

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

    // 2. Update Car Physics & Collisions with City Buildings
    this.car.update(delta, drivingInput, this.cityBuilder, this.audio);

    // 3. Update AI Traffic Cars & Check Vehicle-to-Vehicle Collisions
    if (this.trafficSys) {
      this.trafficSys.update(delta, this.car);
      this.trafficSys.checkCarCollisions(this.car, this.audio);
    }

    // 4. Update Sidewalk Pedestrians & Check Car-Pedestrian Collisions
    if (this.pedestrianSys) {
      this.pedestrianSys.update(delta);
      const pedHit = this.pedestrianSys.checkCarCollisions(this.car, this.audio);
      if (pedHit && pedHit.hit) {
        // Deduct cash penalty from player
        this.passengerSys.deductFine(pedHit.penalty);
        // Show floating warning toast in HUD
        this.hud.showPenaltyToast(pedHit.message);
      }
    }

    // 5. Update Traffic Lights & Check Violations ($5 deduction per red light run)
    if (this.trafficLights) {
      this.trafficLights.update(delta);
      const violation = this.trafficLights.checkRedLightViolation(this.car);
      if (violation && violation.violated) {
        this.passengerSys.deductFine(violation.fine || 5.0);
        this.hud.showPenaltyToast(violation.message || '🚨 RED LIGHT RUNNER! -$5.00 FINE');
      }
    }

    // 6. Update Props System (Nitro pickups, Destructibles, Construction barricades)
    if (this.propsSys) {
      this.propsSys.update(delta, this.elapsedTime);
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

    // 7. Update Elevated Monorail Train Loop
    if (this.monorailSys) {
      this.monorailSys.update(delta);
    }

    // 8. Update Passenger Mission State & Distance Checks
    const missionEvent = this.passengerSys.update(delta, this.elapsedTime, this.car, this.audio);
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

    // 11. Update City Animations (blinking aircraft lights)
    this.cityBuilder.update(this.elapsedTime);

    // 12. Update Camera Tracking
    this.engine.updateCamera(delta, this.car, cameraInput);

    // 13. Update HUD & Minimap with Radar markers
    this.hud.update(this.car, this.passengerSys, this.input, this.roadNetwork, this.monorailSys);

    // 14. Render Scene
    this.engine.render();
  }
}

// Bootstrap application on page load
window.addEventListener('DOMContentLoaded', () => {
  new GameApp();
});
