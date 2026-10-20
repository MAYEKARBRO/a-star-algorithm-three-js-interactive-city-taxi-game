import * as THREE from 'three';
import { findAStarPath } from '../pathfinding/astar.js';

/**
 * PoliceSystem manages:
 * - Driver Wanted Heat Level (0 to 3 Stars)
 * - Police Interceptor Cruiser with flashing emergency red/blue siren lightbar
 * - A* Pathfinding Pursuit AI: Police dynamically uses A* to calculate the shortest
 *   intercept route to chase down the player taxi!
 */
export class PoliceSystem {
  constructor(scene, roadNetwork, audio) {
    this.scene = scene;
    this.roadNetwork = roadNetwork;
    this.audio = audio;

    this.heatLevel = 0; // 0, 1, 2, 3 Stars
    this.heatCooldownTimer = 0;
    this.isChasing = false;

    // Police Vehicle State
    this.policeGroup = new THREE.Group();
    this.policePosition = new THREE.Vector3(0, 0.5, 0);
    this.policeHeading = 0;
    this.policeSpeed = 0;
    this.policeMaxSpeed = 34.0; // Fast interceptor (~120 km/h)

    // A* Navigation Tracking
    this.currentAStarPath = [];
    this.pathWaypointIndex = 0;
    this.lastAStarRecalc = 0;

    // Siren strobe state
    this.sirenTimer = 0;
    this.sirenLeftMat = null;
    this.sirenRightMat = null;

    this._buildPoliceCruiser();
    this.scene.add(this.policeGroup);
    this.policeGroup.visible = false;
  }

  _buildPoliceCruiser() {
    // 1. Black & White Police Body
    const bodyGeo = new THREE.BoxGeometry(2.1, 0.7, 4.4);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x111827, // Black
      metalness: 0.8,
      roughness: 0.2
    });
    const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
    bodyMesh.position.y = 0.55;
    bodyMesh.castShadow = true;
    this.policeGroup.add(bodyMesh);

    // White door panel inserts
    const doorGeo = new THREE.BoxGeometry(2.14, 0.65, 1.8);
    const doorMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.3 });
    const doorMesh = new THREE.Mesh(doorGeo, doorMat);
    doorMesh.position.set(0, 0.55, 0);
    this.policeGroup.add(doorMesh);

    // Cabin
    const cabinGeo = new THREE.BoxGeometry(1.8, 0.65, 2.3);
    const cabinMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.1, metalness: 0.9 });
    const cabinMesh = new THREE.Mesh(cabinGeo, cabinMat);
    cabinMesh.position.set(0, 1.15, -0.2);
    this.policeGroup.add(cabinMesh);

    // 2. Emergency Lightbar on Roof (Flashing Red & Blue)
    const barFrameGeo = new THREE.BoxGeometry(1.4, 0.12, 0.35);
    const barFrameMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.9 });
    const barFrame = new THREE.Mesh(barFrameGeo, barFrameMat);
    barFrame.position.set(0, 1.55, -0.2);
    this.policeGroup.add(barFrame);

    const lightGeo = new THREE.BoxGeometry(0.55, 0.16, 0.3);
    this.sirenLeftMat = new THREE.MeshBasicMaterial({ color: 0xef4444 }); // Red
    const sirenLeft = new THREE.Mesh(lightGeo, this.sirenLeftMat);
    sirenLeft.position.set(-0.4, 1.62, -0.2);
    this.policeGroup.add(sirenLeft);

    this.sirenRightMat = new THREE.MeshBasicMaterial({ color: 0x3b82f6 }); // Blue
    const sirenRight = new THREE.Mesh(lightGeo, this.sirenRightMat);
    sirenRight.position.set(0.4, 1.62, -0.2);
    this.policeGroup.add(sirenRight);

    // 3. Wheels
    const tireGeo = new THREE.CylinderGeometry(0.38, 0.38, 0.3, 16);
    tireGeo.rotateZ(Math.PI / 2);
    const tireMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.9 });

    const wheelOffsets = [
      [-1.08, 0.38, 1.35],
      [1.08, 0.38, 1.35],
      [-1.08, 0.38, -1.35],
      [1.08, 0.38, -1.35]
    ];
    for (const [wx, wy, wz] of wheelOffsets) {
      const wMesh = new THREE.Mesh(tireGeo, tireMat);
      wMesh.position.set(wx, wy, wz);
      this.policeGroup.add(wMesh);
    }
  }

  /**
   * Increases wanted heat level (max 3 stars).
   * @param {number} amount
   * @param {import('../gameplay/Car.js').Car} playerCar
   */
  addHeat(amount, playerCar) {
    this.heatLevel = Math.min(3, this.heatLevel + amount);
    this.heatCooldownTimer = 22.0; // 22 seconds without crimes to clear heat

    if (this.heatLevel >= 1 && !this.isChasing) {
      this._deployPoliceCruiser(playerCar);
    }
  }

  /**
   * Spawns the police cruiser behind the player on an adjacent road node.
   */
  _deployPoliceCruiser(playerCar) {
    this.isChasing = true;
    this.policeGroup.visible = true;

    // Find node behind the player
    const nearest = this.roadNetwork.findNearestNode(playerCar.position.x, playerCar.position.z);
    if (nearest && nearest.node.neighbors.length > 0) {
      const spawnNodeId = nearest.node.neighbors[0].targetId;
      const spawnNode = this.roadNetwork.graph.getNode(spawnNodeId);
      if (spawnNode) {
        this.policePosition.set(spawnNode.x, 0.5, spawnNode.z);
      } else {
        this.policePosition.set(playerCar.position.x - 30, 0.5, playerCar.position.z - 30);
      }
    }

    this.policeSpeed = 15;
    this.policeGroup.position.copy(this.policePosition);

    if (this.audio) {
      this.audio.startPoliceSiren();
    }
  }

  /**
   * Updates police chase AI using real-time A* pathfinding.
   * @param {number} delta
   * @param {number} elapsedTime
   * @param {import('../gameplay/Car.js').Car} playerCar
   * @returns {{ busted?: boolean, message?: string }}
   */
  update(delta, elapsedTime, playerCar) {
    if (this.heatLevel <= 0) return {};

    // Heat cooldown
    this.heatCooldownTimer -= delta;
    if (this.heatCooldownTimer <= 0) {
      this.heatLevel = Math.max(0, this.heatLevel - 1);
      if (this.heatLevel > 0) {
        this.heatCooldownTimer = 15.0;
      } else {
        this.isChasing = false;
        this.policeGroup.visible = false;
        if (this.audio) this.audio.stopPoliceSiren();
        return { message: '🚓 POLICE EVADED! HEAT CLEARED' };
      }
    }

    // Siren Lightbar Strobe Animation
    this.sirenTimer += delta * 12;
    const isRedPhase = Math.sin(this.sirenTimer) > 0;
    this.sirenLeftMat.color.setHex(isRedPhase ? 0xff0033 : 0x220000);
    this.sirenRightMat.color.setHex(isRedPhase ? 0x001133 : 0x00f0ff);

    if (!this.isChasing) return {};

    // ------------------------------------------------------------------------
    // A* PATHFINDING POLICE PURSUIT AI
    // ------------------------------------------------------------------------
    if (elapsedTime - this.lastAStarRecalc > 1.4) {
      this.lastAStarRecalc = elapsedTime;

      const policeNode = this.roadNetwork.findNearestNode(this.policePosition.x, this.policePosition.z);
      const playerNode = this.roadNetwork.findNearestNode(playerCar.position.x, playerCar.position.z);

      if (policeNode && playerNode) {
        // Run A* algorithm to find optimal pursuit path to player!
        const result = findAStarPath(this.roadNetwork.graph, policeNode.node.id, playerNode.node.id);
        if (result.found && result.path.length > 0) {
          this.currentAStarPath = result.path;
          this.pathWaypointIndex = 0;
        }
      }
    }

    // Steer towards next A* waypoint
    let targetX = playerCar.position.x;
    let targetZ = playerCar.position.z;

    if (this.currentAStarPath && this.currentAStarPath.length > 0) {
      const nextWp = this.currentAStarPath[this.pathWaypointIndex];
      if (nextWp) {
        targetX = nextWp.x;
        targetZ = nextWp.z;

        // Check if waypoint reached
        const distToWp = Math.hypot(this.policePosition.x - targetX, this.policePosition.z - targetZ);
        if (distToWp < 6.0 && this.pathWaypointIndex < this.currentAStarPath.length - 1) {
          this.pathWaypointIndex++;
        }
      }
    }

    // Direct pursuit steering
    const dx = targetX - this.policePosition.x;
    const dz = targetZ - this.policePosition.z;
    const targetHeading = Math.atan2(dx, dz);

    // Smoothly rotate heading towards target
    let angleDiff = targetHeading - this.policeHeading;
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

    this.policeHeading += angleDiff * Math.min(1.0, delta * 4.0);

    // Accelerate
    this.policeSpeed = THREE.MathUtils.lerp(this.policeSpeed, this.policeMaxSpeed, delta * 2.0);

    this.policePosition.x += Math.sin(this.policeHeading) * this.policeSpeed * delta;
    this.policePosition.z += Math.cos(this.policeHeading) * this.policeSpeed * delta;

    this.policeGroup.position.copy(this.policePosition);
    this.policeGroup.rotation.y = this.policeHeading;

    // Check if player is intercepted / busted
    const distToPlayer = Math.hypot(this.policePosition.x - playerCar.position.x, this.policePosition.z - playerCar.position.z);
    if (distToPlayer < 4.5 && Math.abs(playerCar.speed) < 4.0) {
      this.heatLevel = 0;
      this.isChasing = false;
      this.policeGroup.visible = false;
      if (this.audio) this.audio.stopPoliceSiren();

      return {
        busted: true,
        message: '🚨 BUSTED BY POLICE! -$100 FINE DEDUCTED'
      };
    }

    return {};
  }

  get wantedLevel() {
    return this.heatLevel;
  }

  get copCars() {
    return [{
      active: this.isChasing && this.policeGroup.visible,
      mesh: this.policeGroup
    }];
  }
}
