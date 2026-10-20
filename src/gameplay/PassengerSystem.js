import * as THREE from 'three';
import { findAStarPath } from '../pathfinding/astar.js';

/**
 * PassengerSystem orchestrates taxi pickups, drop-offs, fare calculations,
 * and dynamic A* route planning.
 */
export class PassengerSystem {
  constructor(scene, roadNetwork, gpsVisualizer) {
    this.scene = scene;
    this.roadNetwork = roadNetwork;
    this.gps = gpsVisualizer;

    // Passenger visual mesh in 3D world
    this.passengerGroup = new THREE.Group();
    this.scene.add(this.passengerGroup);
    this._buildPassengerCharacter();

    // Mission State
    this.state = 'IDLE'; // 'PICKUP' | 'IN_TRANSIT' | 'COMPLETED'
    this.currentPassenger = null;
    this.pickupNode = null;
    this.destinationNode = null;

    // Active A* navigation data
    this.activeAStarResult = null;

    // Financials & Progression
    this.totalEarnings = 0;
    this.completedTrips = 0;
    this.currentTripDistance = 0;
    this.tripTimeElapsed = 0;
    this.timeLimit = 60; // seconds for bonus
    this.comfortMeter = 100; // 0 - 100% for VIP rides

    // Passenger Profile Roster with VIP & Emergency Roles
    this.passengerProfiles = [
      {
        name: 'Dr. Julian Hayes',
        role: 'EMERGENCY SURGEON',
        avatar: '/assets/passenger1.jpg',
        dialoguePickup: "Emergency hospital transfer! Hit the gas, siren blazing!",
        dialogueDropoff: "Lives saved today, driver! Phenomenal speed!",
        bonusPerSecond: 2.0,
        isEmergency: true
      },
      {
        name: 'Stella Monet',
        role: 'VIP CELEBRITY',
        avatar: '/assets/passenger2.jpg',
        dialoguePickup: "To the Grand Premiere! Keep it ultra-smooth, no crashes!",
        dialogueDropoff: "Pure luxury! Five stars for first class chauffeur service!",
        bonusPerSecond: 1.5,
        isVip: true
      },
      {
        name: 'Rex "Nitro" Walker',
        role: 'SPEED DEMON',
        avatar: '/assets/passenger1.jpg',
        dialoguePickup: "To the Summit Skyline deck! Keep this beast above 75 km/h!",
        dialogueDropoff: "Adrenaline overload! You are an absolute road legend!",
        bonusPerSecond: 1.8,
        isSpeedFiend: true
      },
      {
        name: 'Sophia Chen',
        role: 'AI TECH ARCHITECT',
        avatar: '/assets/passenger2.jpg',
        dialoguePickup: "To Grand Central Station as fast as A* can calculate!",
        dialogueDropoff: "Saved my keynote presentation! Optimal pathing!",
        bonusPerSecond: 1.4
      }
    ];

    this.profileIndex = 0;
  }

  _buildPassengerCharacter() {
    // Stylized low-poly pedestrian character
    const charGroup = new THREE.Group();

    // Body (Torso)
    const torsoGeo = new THREE.BoxGeometry(0.7, 0.9, 0.4);
    const torsoMat = new THREE.MeshStandardMaterial({ color: 0x3b82f6 });
    const torso = new THREE.Mesh(torsoGeo, torsoMat);
    torso.position.y = 1.35;
    charGroup.add(torso);

    // Head
    const headGeo = new THREE.SphereGeometry(0.3, 8, 8);
    const headMat = new THREE.MeshStandardMaterial({ color: 0xffd166 });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 2.05;
    charGroup.add(head);

    // Sunglasses
    const glassesGeo = new THREE.BoxGeometry(0.4, 0.12, 0.1);
    const glassesMat = new THREE.MeshBasicMaterial({ color: 0x0f172a });
    const glasses = new THREE.Mesh(glassesGeo, glassesMat);
    glasses.position.set(0, 2.08, 0.28);
    charGroup.add(glasses);

    // Legs
    const legGeo = new THREE.BoxGeometry(0.25, 0.9, 0.3);
    const legMat = new THREE.MeshStandardMaterial({ color: 0x1e293b });

    const leftLeg = new THREE.Mesh(legGeo, legMat);
    leftLeg.position.set(-0.2, 0.45, 0);
    charGroup.add(leftLeg);

    const rightLeg = new THREE.Mesh(legGeo, legMat);
    rightLeg.position.set(0.2, 0.45, 0);
    charGroup.add(rightLeg);

    // Waving Arm (animated)
    this.wavingArm = new THREE.Group();
    this.wavingArm.position.set(0.45, 1.7, 0);

    const armGeo = new THREE.BoxGeometry(0.18, 0.7, 0.18);
    const armMat = new THREE.MeshStandardMaterial({ color: 0x3b82f6 });
    const armMesh = new THREE.Mesh(armGeo, armMat);
    armMesh.position.y = -0.3;
    this.wavingArm.add(armMesh);
    charGroup.add(this.wavingArm);

    this.passengerGroup.add(charGroup);
    this.passengerGroup.visible = false;
  }

  /**
   * Starts a new passenger mission cycle.
   * @param {THREE.Vector3} carPosition
   */
  startNewMission(carPosition) {
    // Select passenger profile
    this.currentPassenger = this.passengerProfiles[this.profileIndex % this.passengerProfiles.length];
    this.profileIndex++;

    // Pick a pickup point near or across town
    const pickupLoc = this.roadNetwork.getRandomDestination();
    this.pickupNode = pickupLoc.node;

    // Pick a distinct destination point
    let dropLoc = this.roadNetwork.getRandomDestination([this.pickupNode.id]);
    this.destinationNode = dropLoc.node;

    // Place passenger 3D model slightly on the sidewalk next to pickup node
    this.passengerGroup.position.set(this.pickupNode.x + 3.0, 0.35, this.pickupNode.z + 3.0);
    this.passengerGroup.visible = true;

    this.state = 'PICKUP';
    this.tripTimeElapsed = 0;

    // Compute A* path from car's current nearest node to Pickup Point A
    this.recalculateRoute(carPosition);
  }

  /**
   * Recalculates the optimal A* path based on car's current position and state.
   * @param {THREE.Vector3} carPosition
   */
  recalculateRoute(carPosition) {
    const nearestStart = this.roadNetwork.findNearestNode(carPosition.x, carPosition.z);
    if (!nearestStart) return;

    const targetNode = this.state === 'PICKUP' ? this.pickupNode : this.destinationNode;
    if (!targetNode) return;

    // ------------------------------------------------------------------------
    // RUN THE A* (A-STAR) ALGORITHM
    // ------------------------------------------------------------------------
    const result = findAStarPath(this.roadNetwork.graph, nearestStart.node.id, targetNode.id);

    this.activeAStarResult = result;
    this.currentTripDistance = result.totalDistance;

    // Update 3D GPS navigation visuals
    this.gps.setPath(result.path, this.state === 'PICKUP' ? 'pickup' : 'dropoff');

    return result;
  }

  /**
   * Main mission update loop. Checks trigger distances, passenger pickup, and dropoff.
   * @param {number} delta
   * @param {number} elapsedTime
   * @param {import('./Car.js').Car} car
   * @param {import('../core/AudioManager.js').AudioManager} [audio]
   * @returns {{ event?: string, fare?: number, message?: string }}
   */
  update(delta, elapsedTime, car, audio) {
    // Animate passenger waving hand
    if (this.state === 'PICKUP') {
      this.wavingArm.rotation.z = Math.sin(elapsedTime * 8) * 0.4 + 1.2;
    }

    // Check distances to active target
    if (this.state === 'PICKUP') {
      const distToPickup = Math.hypot(car.position.x - this.pickupNode.x, car.position.z - this.pickupNode.z);

      // Pickup trigger (within 7 meters of pickup node at reasonable speed)
      if (distToPickup < 7.5 && Math.abs(car.speed) < 14) {
        this.state = 'IN_TRANSIT';
        this.passengerGroup.visible = false; // Passenger enters the taxi!
        this.tripTimeElapsed = 0;

        if (audio) {
          audio.playPickupSound();
        }

        // Recalculate A* route from car's position to destination Point B!
        this.recalculateRoute(car.position);

        return {
          event: 'PICKUP_SUCCESS',
          message: `${this.currentPassenger.name}: "${this.currentPassenger.dialoguePickup}"`
        };
      }

    } else if (this.state === 'IN_TRANSIT') {
      this.tripTimeElapsed += delta;
      const distToDropoff = Math.hypot(car.position.x - this.destinationNode.x, car.position.z - this.destinationNode.z);

      // Drop-off trigger (within 8 meters of destination node at low speed)
      if (distToDropoff < 8.0 && Math.abs(car.speed) < 12) {
        this.state = 'COMPLETED';

        // Calculate Fare Breakdown
        const baseFare = 15.0;
        const distFare = (this.currentTripDistance / 10) * 0.85;
        const timeBonus = Math.max(0, (this.timeLimit - this.tripTimeElapsed) * this.currentPassenger.bonusPerSecond);
        const driftBonus = Math.floor(car.totalDriftScore / 100);
        const totalTripFare = Math.round((baseFare + distFare + timeBonus + driftBonus) * 100) / 100;

        this.totalEarnings += totalTripFare;
        this.completedTrips++;

        if (audio) {
          audio.playCashDropoffSound();
        }

        // Hide GPS path
        this.gps.setPath([]);

        const resultEvent = {
          event: 'DROPOFF_SUCCESS',
          fare: totalTripFare,
          baseFare,
          distFare: Math.round(distFare * 100) / 100,
          timeBonus: Math.round(timeBonus * 100) / 100,
          driftBonus,
          message: `${this.currentPassenger.name}: "${this.currentPassenger.dialogueDropoff}"`
        };

        // Reset drift score for next trip
        car.totalDriftScore = 0;

        return resultEvent;
      }
    }

    return {};
  }

  /**
   * Returns telemetry for HUD: mission status, active passenger, remaining distance.
   * @param {THREE.Vector3} carPosition
   */
  getTelemetry(carPosition) {
    let remainingDistance = 0;
    const targetNode = this.state === 'PICKUP' ? this.pickupNode : this.destinationNode;

    if (targetNode) {
      remainingDistance = Math.hypot(carPosition.x - targetNode.x, carPosition.z - targetNode.z);
    }

    return {
      state: this.state,
      passenger: this.currentPassenger ? {
        ...this.currentPassenger,
        comfortMeter: this.comfortMeter
      } : null,
      pickupNode: this.pickupNode,
      destinationNode: this.destinationNode,
      remainingDistance: Math.round(remainingDistance),
      totalEarnings: this.totalEarnings,
      completedTrips: this.completedTrips,
      aStarResult: this.activeAStarResult,
      tripTimeElapsed: Math.round(this.tripTimeElapsed)
    };
  }

  /**
   * Awards bonus cash (e.g. stunt jumps, hydrant smash, crate break).
   * @param {number} amount
   */
  awardBonus(amount) {
    this.totalEarnings += amount;
    return this.totalEarnings;
  }

  /**
   * Deducts a cash fine (e.g. hitting a pedestrian or busted by police).
   * @param {number} amount
   */
  deductFine(amount) {
    this.totalEarnings = Math.max(0, this.totalEarnings - amount);
    return this.totalEarnings;
  }
}
