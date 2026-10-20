import * as THREE from 'three';

/**
 * TrafficVehicle represents an autonomous NPC vehicle driving along city lanes.
 * Supports 5 distinct vehicle models:
 * - BUS: Large urban transit bus with tinted windows & glowing marquee
 * - AMBULANCE: Emergency response van with red cross & flashing beacons
 * - TRUCK: Heavy-duty cab with large cargo shipping container
 * - SUV: Rugged utility vehicle with roof racks & rear spare tire
 * - SEDAN: Streamlined personal car in vibrant metallic colors
 */
class TrafficVehicle {
  constructor(scene, startX, startZ, isHorizontal, direction, roadNetwork, type = 'SEDAN') {
    this.scene = scene;
    this.roadNetwork = roadNetwork;
    this.isHorizontal = isHorizontal;
    this.direction = direction; // 1 or -1
    this.type = type;

    this.group = new THREE.Group();
    this.wheelMeshes = [];
    this.collisionRadius = 2.8;

    // Type-specific specs & builder
    if (this.type === 'BUS') {
      this.speed = 9.0 + Math.random() * 2.5;
      this.collisionRadius = 4.2;
      this._buildBus();
    } else if (this.type === 'AMBULANCE') {
      this.speed = 13.5 + Math.random() * 3.5;
      this.collisionRadius = 3.2;
      this._buildAmbulance();
    } else if (this.type === 'TRUCK') {
      this.speed = 8.5 + Math.random() * 2.5;
      this.collisionRadius = 3.9;
      this._buildTruck();
    } else if (this.type === 'SUV') {
      this.speed = 11.5 + Math.random() * 3.5;
      this.collisionRadius = 2.9;
      this._buildSUV();
    } else {
      this.speed = 11.0 + Math.random() * 4.5;
      this.collisionRadius = 2.6;
      this._buildSedan();
    }

    this.currentSpeed = this.speed;
    this.group.position.set(startX, 0.45, startZ);
    this.scene.add(this.group);

    this._updateRotation();
  }

  // -------------------------------------------------------------
  // 1. CITY TRANSIT BUS
  // -------------------------------------------------------------
  _buildBus() {
    const busMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.35, metalness: 0.5 }); // Metro Blue
    const stripeMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.4 }); // Transit Yellow
    const glassMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.1, metalness: 0.9 });

    // Main Bus Body
    const bodyGeo = new THREE.BoxGeometry(2.3, 1.8, 7.2);
    const body = new THREE.Mesh(bodyGeo, busMat);
    body.position.y = 1.35;
    body.castShadow = true;
    this.group.add(body);

    // Yellow lower belt stripe
    const stripeGeo = new THREE.BoxGeometry(2.34, 0.32, 7.22);
    const stripe = new THREE.Mesh(stripeGeo, stripeMat);
    stripe.position.y = 0.85;
    this.group.add(stripe);

    // Panoramic side window strips
    const winGeo = new THREE.BoxGeometry(2.36, 0.6, 6.2);
    const win = new THREE.Mesh(winGeo, glassMat);
    win.position.set(0, 1.6, -0.2);
    this.group.add(win);

    // Front Windshield
    const frontWinGeo = new THREE.BoxGeometry(2.1, 0.8, 0.1);
    const frontWin = new THREE.Mesh(frontWinGeo, glassMat);
    frontWin.position.set(0, 1.5, 3.61);
    this.group.add(frontWin);

    // Front Destination LED Marquee
    const signGeo = new THREE.BoxGeometry(1.6, 0.25, 0.08);
    const signMat = new THREE.MeshBasicMaterial({ color: 0xfbbf24 });
    const sign = new THREE.Mesh(signGeo, signMat);
    sign.position.set(0, 2.05, 3.62);
    this.group.add(sign);

    // Rooftop AC pods
    const acGeo = new THREE.BoxGeometry(1.5, 0.3, 1.6);
    const acMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.6 });
    const ac1 = new THREE.Mesh(acGeo, acMat);
    ac1.position.set(0, 2.4, 0.8);
    this.group.add(ac1);
    const ac2 = new THREE.Mesh(acGeo, acMat);
    ac2.position.set(0, 2.4, -1.8);
    this.group.add(ac2);

    // Lights
    this._addHeadAndTaillights(1.15, 3.61, -3.61);

    // 6 Wheels (Front pair, double rear tandem)
    this._addWheels([
      [-1.15, 0.4, 2.3], [1.15, 0.4, 2.3],
      [-1.15, 0.4, -1.8], [1.15, 0.4, -1.8],
      [-1.15, 0.4, -2.9], [1.15, 0.4, -2.9]
    ], 0.38);
  }

  // -------------------------------------------------------------
  // 2. EMERGENCY AMBULANCE
  // -------------------------------------------------------------
  _buildAmbulance() {
    const whiteMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.25, metalness: 0.4 });
    const redMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.3 });
    const glassMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.1, metalness: 0.8 });

    // Rear Patient Box Module
    const boxGeo = new THREE.BoxGeometry(2.15, 1.6, 3.2);
    const boxMesh = new THREE.Mesh(boxGeo, whiteMat);
    boxMesh.position.set(0, 1.25, -0.7);
    boxMesh.castShadow = true;
    this.group.add(boxMesh);

    // Red Emergency Stripe
    const stripeGeo = new THREE.BoxGeometry(2.18, 0.35, 3.22);
    const stripe = new THREE.Mesh(stripeGeo, redMat);
    stripe.position.set(0, 1.25, -0.7);
    this.group.add(stripe);

    // Red Medical Crosses on Sides
    const crossVGeo = new THREE.BoxGeometry(2.2, 0.5, 0.16);
    const crossHGeo = new THREE.BoxGeometry(2.2, 0.16, 0.5);
    const crossV = new THREE.Mesh(crossVGeo, redMat);
    crossV.position.set(0, 1.5, -0.7);
    this.group.add(crossV);
    const crossH = new THREE.Mesh(crossHGeo, redMat);
    crossH.position.set(0, 1.5, -0.7);
    this.group.add(crossH);

    // Front Driver Cab
    const cabGeo = new THREE.BoxGeometry(2.05, 1.2, 1.7);
    const cab = new THREE.Mesh(cabGeo, whiteMat);
    cab.position.set(0, 1.05, 1.7);
    cab.castShadow = true;
    this.group.add(cab);

    // Windshield
    const winGeo = new THREE.BoxGeometry(1.8, 0.55, 0.8);
    const win = new THREE.Mesh(winGeo, glassMat);
    win.position.set(0, 1.35, 1.8);
    this.group.add(win);

    // Flashing Emergency Beacon Lightbar
    this.beaconLeftMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
    this.beaconRightMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
    const bGeo = new THREE.BoxGeometry(0.35, 0.14, 0.2);
    const bL = new THREE.Mesh(bGeo, this.beaconLeftMat);
    bL.position.set(-0.45, 2.15, 1.5);
    this.group.add(bL);
    const bR = new THREE.Mesh(bGeo, this.beaconRightMat);
    bR.position.set(0.45, 2.15, 1.5);
    this.group.add(bR);

    // Lights
    this._addHeadAndTaillights(1.0, 2.56, -2.31);

    // 4 Wheels
    this._addWheels([
      [-1.05, 0.35, 1.6], [1.05, 0.35, 1.6],
      [-1.05, 0.35, -1.4], [1.05, 0.35, -1.4]
    ], 0.35);
  }

  // -------------------------------------------------------------
  // 3. HEAVY CARGO DELIVERY TRUCK
  // -------------------------------------------------------------
  _buildTruck() {
    const cabMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.35, metalness: 0.6 }); // Crimson cab
    const cargoMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.5, metalness: 0.3 }); // White container
    const glassMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.1, metalness: 0.9 });

    // Front Truck Cab
    const cabGeo = new THREE.BoxGeometry(2.2, 1.7, 2.1);
    const cab = new THREE.Mesh(cabGeo, cabMat);
    cab.position.set(0, 1.3, 1.9);
    cab.castShadow = true;
    this.group.add(cab);

    // Cab Windshield
    const winGeo = new THREE.BoxGeometry(2.0, 0.6, 0.8);
    const win = new THREE.Mesh(winGeo, glassMat);
    win.position.set(0, 1.6, 2.1);
    this.group.add(win);

    // Large Shipping Cargo Container
    const cargoGeo = new THREE.BoxGeometry(2.35, 2.1, 4.6);
    const cargo = new THREE.Mesh(cargoGeo, cargoMat);
    cargo.position.set(0, 1.5, -1.4);
    cargo.castShadow = true;
    this.group.add(cargo);

    // Metal Chassis rails
    const frameGeo = new THREE.BoxGeometry(1.6, 0.35, 6.2);
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.8 });
    const frame = new THREE.Mesh(frameGeo, frameMat);
    frame.position.y = 0.55;
    this.group.add(frame);

    // Vertical Chrome Exhaust Pipe
    const pipeGeo = new THREE.CylinderGeometry(0.08, 0.08, 1.8, 8);
    const pipeMat = new THREE.MeshStandardMaterial({ color: 0xcfd8dc, metalness: 0.9, roughness: 0.2 });
    const pipe = new THREE.Mesh(pipeGeo, pipeMat);
    pipe.position.set(1.05, 1.9, 0.9);
    this.group.add(pipe);

    // Lights
    this._addHeadAndTaillights(1.1, 2.96, -3.71);

    // 6 Heavy Wheels
    this._addWheels([
      [-1.12, 0.42, 1.8], [1.12, 0.42, 1.8],
      [-1.12, 0.42, -1.8], [1.12, 0.42, -1.8],
      [-1.12, 0.42, -2.9], [1.12, 0.42, -2.9]
    ], 0.42);
  }

  // -------------------------------------------------------------
  // 4. RUGGED URBAN SUV
  // -------------------------------------------------------------
  _buildSUV() {
    const colors = [0x15803d, 0x0369a1, 0x475569, 0xb45309];
    const suvColor = colors[Math.floor(Math.random() * colors.length)];
    const suvMat = new THREE.MeshStandardMaterial({ color: suvColor, roughness: 0.35, metalness: 0.5 });
    const glassMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.1, metalness: 0.85 });

    // Lower SUV Body
    const bodyGeo = new THREE.BoxGeometry(2.05, 0.75, 4.3);
    const body = new THREE.Mesh(bodyGeo, suvMat);
    body.position.y = 0.65;
    body.castShadow = true;
    this.group.add(body);

    // Upper Cabin
    const cabGeo = new THREE.BoxGeometry(1.75, 0.65, 2.7);
    const cab = new THREE.Mesh(cabGeo, glassMat);
    cab.position.set(0, 1.25, -0.2);
    this.group.add(cab);

    // Roof Rack Rails
    const railGeo = new THREE.BoxGeometry(0.08, 0.08, 2.2);
    const railMat = new THREE.MeshStandardMaterial({ color: 0x111827, metalness: 0.8 });
    const rL = new THREE.Mesh(railGeo, railMat);
    rL.position.set(-0.75, 1.62, -0.2);
    this.group.add(rL);
    const rR = new THREE.Mesh(railGeo, railMat);
    rR.position.set(0.75, 1.62, -0.2);
    this.group.add(rR);

    // Rear Mounted Spare Tire
    const spareGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.25, 12);
    spareGeo.rotateX(Math.PI / 2);
    const tireMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.9 });
    const spare = new THREE.Mesh(spareGeo, tireMat);
    spare.position.set(0, 0.85, -2.25);
    this.group.add(spare);

    // Lights
    this._addHeadAndTaillights(1.0, 2.16, -2.16);

    // 4 Wheels
    this._addWheels([
      [-1.0, 0.36, 1.3], [1.0, 0.36, 1.3],
      [-1.0, 0.36, -1.3], [1.0, 0.36, -1.3]
    ], 0.36);
  }

  // -------------------------------------------------------------
  // 5. COLORFUL CITY SEDAN
  // -------------------------------------------------------------
  _buildSedan() {
    const colors = [
      0xef4444, // Red
      0x00f0ff, // Cyan
      0x10b981, // Emerald
      0xf97316, // Orange
      0xa855f7, // Violet
      0xf8fafc, // Pearl White
      0xec4899, // Hot Pink
      0xeab308  // Sunny Gold
    ];
    const sedanColor = colors[Math.floor(Math.random() * colors.length)];
    const bodyMat = new THREE.MeshStandardMaterial({ color: sedanColor, roughness: 0.28, metalness: 0.6 });
    const glassMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.1, metalness: 0.85 });

    // Lower Chassis
    const bodyGeo = new THREE.BoxGeometry(1.9, 0.65, 3.8);
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.5;
    body.castShadow = true;
    this.group.add(body);

    // Cabin / Glass
    const cabGeo = new THREE.BoxGeometry(1.6, 0.55, 2.0);
    const cab = new THREE.Mesh(cabGeo, glassMat);
    cab.position.set(0, 1.05, -0.1);
    this.group.add(cab);

    // Lights
    this._addHeadAndTaillights(0.95, 1.91, -1.91);

    // 4 Wheels
    this._addWheels([
      [-0.95, 0.32, 1.1], [0.95, 0.32, 1.1],
      [-0.95, 0.32, -1.1], [0.95, 0.32, -1.1]
    ], 0.32);
  }

  // Helper for headlights & taillights
  _addHeadAndTaillights(width, frontZ, rearZ) {
    const hlGeo = new THREE.BoxGeometry(0.3, 0.12, 0.05);
    const hlMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const hlL = new THREE.Mesh(hlGeo, hlMat);
    hlL.position.set(-width * 0.6, 0.58, frontZ);
    this.group.add(hlL);
    const hlR = new THREE.Mesh(hlGeo, hlMat);
    hlR.position.set(width * 0.6, 0.58, frontZ);
    this.group.add(hlR);

    const tlMat = new THREE.MeshBasicMaterial({ color: 0xff0044 });
    const tlL = new THREE.Mesh(hlGeo, tlMat);
    tlL.position.set(-width * 0.6, 0.58, rearZ);
    this.group.add(tlL);
    const tlR = new THREE.Mesh(hlGeo, tlMat);
    tlR.position.set(width * 0.6, 0.58, rearZ);
    this.group.add(tlR);
  }

  // Helper for wheels
  _addWheels(positions, radius) {
    const tireGeo = new THREE.CylinderGeometry(radius, radius, 0.26, 12);
    tireGeo.rotateZ(Math.PI / 2);
    const tireMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.9 });

    for (const [wx, wy, wz] of positions) {
      const wMesh = new THREE.Mesh(tireGeo, tireMat);
      wMesh.position.set(wx, wy, wz);
      this.group.add(wMesh);
      this.wheelMeshes.push(wMesh);
    }
  }

  _updateRotation() {
    if (this.isHorizontal) {
      this.group.rotation.y = this.direction > 0 ? Math.PI / 2 : -Math.PI / 2;
    } else {
      this.group.rotation.y = this.direction > 0 ? 0 : Math.PI;
    }
  }

  /**
   * Updates vehicle movement and wraps around city borders.
   * @param {number} delta
   * @param {import('../gameplay/Car.js').Car} playerCar
   */
  update(delta, playerCar) {
    const bounds = this.roadNetwork.getCityBounds();

    // Strobe ambulance emergency beacons
    if (this.type === 'AMBULANCE' && this.beaconLeftMat) {
      const strobe = (Date.now() % 360 < 180);
      this.beaconLeftMat.color.setHex(strobe ? 0xef4444 : 0x220505);
      this.beaconRightMat.color.setHex(!strobe ? 0x00f0ff : 0x021f2d);
    }

    // Collision avoidance with player car ahead
    const dx = playerCar.position.x - this.group.position.x;
    const dz = playerCar.position.z - this.group.position.z;
    const distSq = dx * dx + dz * dz;

    if (distSq < 144) { // within 12 meters
      this.currentSpeed = THREE.MathUtils.lerp(this.currentSpeed, 2.0, delta * 3.5);
    } else {
      this.currentSpeed = THREE.MathUtils.lerp(this.currentSpeed, this.speed, delta * 2.0);
    }

    const move = this.currentSpeed * this.direction * delta;

    if (this.isHorizontal) {
      this.group.position.x += move;
      if (this.direction > 0 && this.group.position.x > bounds.maxX) {
        this.group.position.x = bounds.minX;
      } else if (this.direction < 0 && this.group.position.x < bounds.minX) {
        this.group.position.x = bounds.maxX;
      }
    } else {
      this.group.position.z += move;
      if (this.direction > 0 && this.group.position.z > bounds.maxZ) {
        this.group.position.z = bounds.minZ;
      } else if (this.direction < 0 && this.group.position.z < bounds.minZ) {
        this.group.position.z = bounds.maxZ;
      }
    }

    // Spin wheels
    const wheelRot = (this.currentSpeed * delta) / 0.35;
    for (const w of this.wheelMeshes) {
      w.rotation.x += wheelRot;
    }
  }
}

/**
 * TrafficSystem manages autonomous AI city traffic with rich vehicle variety.
 */
export class TrafficSystem {
  constructor(scene, roadNetwork) {
    this.scene = scene;
    this.roadNetwork = roadNetwork;
    this.trafficCars = [];

    this._spawnTraffic();
  }

  _spawnTraffic() {
    const laneOffset = 3.8;
    const spacing = this.roadNetwork.spacing;

    // Vehicle distribution roster
    const vehicleRoster = [
      'BUS', 'AMBULANCE', 'TRUCK', 'SUV', 'SEDAN',
      'BUS', 'TRUCK', 'SEDAN', 'AMBULANCE', 'SUV',
      'BUS', 'TRUCK', 'SEDAN', 'SUV', 'SEDAN',
      'BUS', 'TRUCK', 'AMBULANCE', 'SUV', 'SEDAN'
    ];

    let vIdx = 0;

    // Spawn 20 vehicles across streets and avenues
    for (let i = 0; i < 7; i++) {
      // East-West streets
      const streetZ = (i * spacing - this.roadNetwork.halfSizeZ);
      const vType1 = vehicleRoster[vIdx++ % vehicleRoster.length];
      const carA = new TrafficVehicle(
        this.scene,
        -this.roadNetwork.halfSizeX + Math.random() * 220,
        streetZ + laneOffset,
        true,
        1,
        this.roadNetwork,
        vType1
      );
      this.trafficCars.push(carA);

      const vType2 = vehicleRoster[vIdx++ % vehicleRoster.length];
      const carB = new TrafficVehicle(
        this.scene,
        this.roadNetwork.halfSizeX - Math.random() * 220,
        streetZ - laneOffset,
        true,
        -1,
        this.roadNetwork,
        vType2
      );
      this.trafficCars.push(carB);

      // North-South avenues
      if (i < 6) {
        const avenueX = (i * spacing - this.roadNetwork.halfSizeX);
        const vType3 = vehicleRoster[vIdx++ % vehicleRoster.length];
        const carC = new TrafficVehicle(
          this.scene,
          avenueX - laneOffset,
          -this.roadNetwork.halfSizeZ + Math.random() * 220,
          false,
          1,
          this.roadNetwork,
          vType3
        );
        this.trafficCars.push(carC);
      }
    }
  }

  /**
   * Checks collision with player car taking into account vehicle size.
   * @param {import('../gameplay/Car.js').Car} playerCar
   * @param {import('../core/AudioManager.js').AudioManager} [audio]
   */
  checkCarCollisions(playerCar, audio) {
    const pPos = playerCar.position;

    for (const vehicle of this.trafficCars) {
      const cPos = vehicle.group.position;
      const dx = pPos.x - cPos.x;
      const dz = pPos.z - cPos.z;
      const distSq = dx * dx + dz * dz;
      const colDist = vehicle.collisionRadius;

      if (distSq < colDist * colDist) {
        const dist = Math.sqrt(distSq) || 0.01;
        const overlap = colDist - dist;

        // Push vehicles apart
        const nx = dx / dist;
        const nz = dz / dist;
        playerCar.position.x += nx * (overlap + 0.15);
        playerCar.position.z += nz * (overlap + 0.15);

        if (Math.abs(playerCar.speed) > 3) {
          playerCar.speed *= -0.3;
          if (audio) {
            audio.playCrashSound(0.65);
            audio.startHorn();
            setTimeout(() => audio.stopHorn(), 320);
          }
        }
      }
    }
  }

  /**
   * Updates all traffic vehicles.
   * @param {number} delta
   * @param {import('../gameplay/Car.js').Car} playerCar
   */
  update(delta, playerCar) {
    for (const vehicle of this.trafficCars) {
      vehicle.update(delta, playerCar);
    }
  }
}
