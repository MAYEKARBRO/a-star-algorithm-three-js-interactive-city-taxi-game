import * as THREE from 'three';

/**
 * Car represents the player-driven 3D Taxi with arcade vehicle physics,
 * suspension tilt, turning wheels, drift mechanics, headlights, and audio hookups.
 */
export class Car {
  constructor(scene) {
    this.scene = scene;

    // Physics & State Variables
    this.position = new THREE.Vector3(0, 0.5, 0);
    this.heading = 0; // Rotation around Y axis (radians)
    this.speed = 0;   // Forward velocity (units/sec, roughly m/s)
    this.steeringAngle = 0; // Front wheel steer angle (-maxSteer to +maxSteer)

    // Handling Constants
    this.maxSpeed = 38.0;         // ~135 km/h
    this.maxReverseSpeed = -14.0; // ~50 km/h
    this.acceleration = 24.0;
    this.brakeForce = 38.0;
    this.reverseAcceleration = 16.0;
    this.friction = 7.0;          // Rolling resistance / natural deceleration
    this.maxSteerAngle = 0.58;    // ~33 degrees
    this.steerSpeed = 3.5;
    this.steerReturnSpeed = 5.0;

    // Drift & Traction
    this.isDrifting = false;
    this.lateralVelocity = 0;
    this.driftScore = 0;
    this.totalDriftScore = 0;

    // Nitro Boost System
    this.nitro = 100; // Tank percentage 0 - 100
    this.isBoosting = false;

    // Stunt Airtime & Jump Physics
    this.velY = 0;
    this.isInAir = false;
    this.airtimeScore = 0;

    // Neon Underglow
    this.underglowMat = null;

    // Body Roll & Pitch (Suspension simulation)
    this.bodyRoll = 0;
    this.bodyPitch = 0;

    // Visual Mesh Hierarchy
    this.carGroup = new THREE.Group();
    this.chassisMesh = null;
    this.frontLeftWheel = null;
    this.frontRightWheel = null;
    this.rearLeftWheel = null;
    this.rearRightWheel = null;
    this.taxiSignLight = null;
    this.headlightSpotLeft = null;
    this.headlightSpotRight = null;
    this.taillightMeshes = [];

    // Particle Systems (Tire smoke, turbo flames, & crash sparks)
    this.particles = [];
    this.particleGroup = new THREE.Group();
    this.scene.add(this.particleGroup);

    this._buildCarModel();
    this.scene.add(this.carGroup);
  }

  /**
   * Constructs the 3D Taxi Car model with Three.js geometries.
   */
  _buildCarModel() {
    // Car Body Container (for suspension roll & pitch tilt)
    this.bodyContainer = new THREE.Group();
    this.carGroup.add(this.bodyContainer);

    // 1. Lower Chassis (Yellow Taxi Color default)
    this.bodyMaterial = new THREE.MeshStandardMaterial({
      color: 0xffb703,
      metalness: 0.7,
      roughness: 0.25
    });

    const bodyGeo = new THREE.BoxGeometry(2.1, 0.7, 4.4);
    const bodyMesh = new THREE.Mesh(bodyGeo, this.bodyMaterial);
    bodyMesh.position.y = 0.55;
    bodyMesh.castShadow = true;
    bodyMesh.receiveShadow = true;
    this.bodyContainer.add(bodyMesh);

    // Neon Underglow Light Ribbon beneath chassis
    const underglowGeo = new THREE.PlaneGeometry(2.3, 4.2);
    underglowGeo.rotateX(-Math.PI / 2);
    this.underglowMat = new THREE.MeshBasicMaterial({
      color: 0xffb703,
      transparent: true,
      opacity: 0.65,
      side: THREE.DoubleSide
    });
    this.underglowMesh = new THREE.Mesh(underglowGeo, this.underglowMat);
    this.underglowMesh.position.y = 0.08;
    this.bodyContainer.add(this.underglowMesh);

    // 2. Cabin & Roof
    const cabinGeo = new THREE.BoxGeometry(1.8, 0.65, 2.4);
    const cabinMat = new THREE.MeshStandardMaterial({
      color: 0x111827,
      roughness: 0.1,
      metalness: 0.9
    });
    const cabinMesh = new THREE.Mesh(cabinGeo, cabinMat);
    cabinMesh.position.set(0, 1.15, -0.2);
    cabinMesh.castShadow = true;
    this.bodyContainer.add(cabinMesh);

    // 3. Tinted Windshield & Windows
    const glassMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      roughness: 0.05,
      metalness: 0.95,
      transparent: true,
      opacity: 0.75
    });
    const frontWindshieldGeo = new THREE.PlaneGeometry(1.7, 0.7);
    const frontWindshield = new THREE.Mesh(frontWindshieldGeo, glassMat);
    frontWindshield.position.set(0, 1.15, 1.01);
    frontWindshield.rotateX(0.25);
    this.bodyContainer.add(frontWindshield);

    // 4. Checkered Taxi Side Decals
    const checkerCanvas = document.createElement('canvas');
    checkerCanvas.width = 128;
    checkerCanvas.height = 32;
    const cCtx = checkerCanvas.getContext('2d');
    cCtx.fillStyle = '#000000';
    cCtx.fillRect(0, 0, 128, 32);
    cCtx.fillStyle = '#ffffff';
    for (let i = 0; i < 8; i++) {
      if (i % 2 === 0) {
        cCtx.fillRect(i * 16, 0, 16, 16);
        cCtx.fillRect((i + 1) * 16, 16, 16, 16);
      }
    }
    const checkerTex = new THREE.CanvasTexture(checkerCanvas);
    const decalMat = new THREE.MeshBasicMaterial({ map: checkerTex });

    const decalGeoLeft = new THREE.PlaneGeometry(3.6, 0.25);
    const decalLeft = new THREE.Mesh(decalGeoLeft, decalMat);
    decalLeft.position.set(-1.06, 0.65, 0);
    decalLeft.rotateY(-Math.PI / 2);
    this.bodyContainer.add(decalLeft);

    const decalGeoRight = new THREE.PlaneGeometry(3.6, 0.25);
    const decalRight = new THREE.Mesh(decalGeoRight, decalMat);
    decalRight.position.set(1.06, 0.65, 0);
    decalRight.rotateY(Math.PI / 2);
    this.bodyContainer.add(decalRight);

    // 5. Rooftop TAXI Sign
    const signGeo = new THREE.BoxGeometry(0.8, 0.25, 0.35);
    const signMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0xffb703,
      emissiveIntensity: 0.8
    });
    const signMesh = new THREE.Mesh(signGeo, signMat);
    signMesh.position.set(0, 1.58, -0.2);
    this.bodyContainer.add(signMesh);

    // 6. Headlights & Spotlights
    const lightGlowMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const hlGeo = new THREE.BoxGeometry(0.35, 0.15, 0.05);

    const hlLeft = new THREE.Mesh(hlGeo, lightGlowMat);
    hlLeft.position.set(-0.7, 0.6, 2.21);
    this.bodyContainer.add(hlLeft);

    const hlRight = new THREE.Mesh(hlGeo, lightGlowMat);
    hlRight.position.set(0.7, 0.6, 2.21);
    this.bodyContainer.add(hlRight);

    // Real spotlights projecting ahead
    this.headlightSpotLeft = new THREE.SpotLight(0xfff4e6, 2.5, 45, Math.PI / 5, 0.35, 1.5);
    this.headlightSpotLeft.position.set(-0.7, 0.6, 2.2);
    this.headlightSpotLeft.target.position.set(-0.7, 0, 20);
    this.bodyContainer.add(this.headlightSpotLeft);
    this.bodyContainer.add(this.headlightSpotLeft.target);

    this.headlightSpotRight = new THREE.SpotLight(0xfff4e6, 2.5, 45, Math.PI / 5, 0.35, 1.5);
    this.headlightSpotRight.position.set(0.7, 0.6, 2.2);
    this.headlightSpotRight.target.position.set(0.7, 0, 20);
    this.bodyContainer.add(this.headlightSpotRight);
    this.bodyContainer.add(this.headlightSpotRight.target);

    // 7. Taillights (Red LED)
    const tlMat = new THREE.MeshStandardMaterial({
      color: 0xff0033,
      emissive: 0xff0033,
      emissiveIntensity: 0.5
    });
    const tlLeft = new THREE.Mesh(hlGeo, tlMat);
    tlLeft.position.set(-0.7, 0.6, -2.21);
    this.bodyContainer.add(tlLeft);
    this.taillightMeshes.push(tlLeft);

    const tlRight = new THREE.Mesh(hlGeo, tlMat);
    tlRight.position.set(0.7, 0.6, -2.21);
    this.bodyContainer.add(tlRight);
    this.taillightMeshes.push(tlRight);

    // 8. Wheels (Front steering & Rear drive)
    this.frontLeftWheel = this._createWheel(-1.08, 0.38, 1.35, true);
    this.frontRightWheel = this._createWheel(1.08, 0.38, 1.35, true);
    this.rearLeftWheel = this._createWheel(-1.08, 0.38, -1.35, false);
    this.rearRightWheel = this._createWheel(1.08, 0.38, -1.35, false);
  }

  _createWheel(x, y, z, isFront) {
    const wheelAnchor = new THREE.Group();
    wheelAnchor.position.set(x, y, z);
    this.carGroup.add(wheelAnchor);

    // Wheel spin container
    const spinGroup = new THREE.Group();
    wheelAnchor.add(spinGroup);

    // Rubber Tire
    const tireGeo = new THREE.CylinderGeometry(0.38, 0.38, 0.3, 16);
    tireGeo.rotateZ(Math.PI / 2);
    const tireMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.9 });
    const tireMesh = new THREE.Mesh(tireGeo, tireMat);
    tireMesh.castShadow = true;
    spinGroup.add(tireMesh);

    // Silver Alloy Rim
    const rimGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.32, 8);
    rimGeo.rotateZ(Math.PI / 2);
    const rimMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.8, roughness: 0.2 });
    const rimMesh = new THREE.Mesh(rimGeo, rimMat);
    spinGroup.add(rimMesh);

    return {
      anchor: wheelAnchor,
      spinGroup,
      isFront
    };
  }

  /**
   * Updates car movement, arcade physics, collision, and visual tilt.
   * @param {number} delta - Frame delta time (seconds)
   * @param {Object} input - { throttle: number (-1 to 1), steer: number (-1 to 1), handbrake: boolean }
   * @param {import('../city/CityBuilder.js').CityBuilder} cityBuilder
   * @param {import('../core/AudioManager.js').AudioManager} [audio]
   */
  update(delta, input, cityBuilder, audio) {
    delta = Math.min(delta, 0.1); // Clamp delta against massive frame drops

    const throttle = input.throttle || 0; // 1 = gas, -1 = reverse/brake
    const steer = input.steer || 0;       // -1 = left, 1 = right
    const handbrake = !!input.handbrake;

    // 1. Steering Dynamics (Smoothed)
    if (Math.abs(steer) > 0.05) {
      this.steeringAngle = THREE.MathUtils.lerp(
        this.steeringAngle,
        steer * this.maxSteerAngle,
        this.steerSpeed * delta
      );
    } else {
      this.steeringAngle = THREE.MathUtils.lerp(
        this.steeringAngle,
        0,
        this.steerReturnSpeed * delta
      );
    }

    // 2. Acceleration, Braking & Friction
    if (throttle > 0.05) {
      // Forward gas
      if (this.speed < 0) {
        // Braking while reversing
        this.speed += this.brakeForce * delta;
      } else {
        this.speed += this.acceleration * throttle * delta;
      }
    } else if (throttle < -0.05) {
      // Brake or Reverse
      if (this.speed > 0.5) {
        // Active Braking
        this.speed -= this.brakeForce * Math.abs(throttle) * delta;
      } else {
        // Reverse
        this.speed -= this.reverseAcceleration * Math.abs(throttle) * delta;
      }
    } else {
      // Coasting / natural rolling friction
      if (this.speed > 0) {
        this.speed = Math.max(0, this.speed - this.friction * delta);
      } else if (this.speed < 0) {
        this.speed = Math.min(0, this.speed + this.friction * delta);
      }
    }

    // Nitro Boost Acceleration
    const isNitroPressed = !!input.nitro;
    if (isNitroPressed && this.nitro > 0) {
      this.isBoosting = true;
      this.nitro = Math.max(0, this.nitro - 35 * delta);
      this.speed += 35 * delta;
      this._emitTurboFlames(this.rearLeftWheel.anchor.position);
      this._emitTurboFlames(this.rearRightWheel.anchor.position);
    } else {
      this.isBoosting = false;
      this.nitro = Math.min(100, this.nitro + 6 * delta); // Passive recharge
    }

    // Handbrake physics
    if (handbrake) {
      this.isDrifting = Math.abs(this.speed) > 10;
      this.speed = THREE.MathUtils.lerp(this.speed, 0, delta * 3.5);
    } else {
      this.isDrifting = Math.abs(this.speed) > 18 && Math.abs(this.steeringAngle) > 0.35;
    }

    // Clamp speed limits (Boost raises max speed up to ~175 km/h)
    const effectiveMaxSpeed = this.isBoosting ? 48.0 : this.maxSpeed;
    this.speed = THREE.MathUtils.clamp(this.speed, this.maxReverseSpeed, effectiveMaxSpeed);

    // Stunt Airtime & Jump Physics
    if (this.isInAir) {
      this.velY -= 30 * delta; // Gravity
      this.position.y += this.velY * delta;
      this.airtimeScore += Math.floor(delta * 350);

      if (this.position.y <= 0.5) {
        this.position.y = 0.5;
        this.velY = 0;
        this.isInAir = false;
        this.bodyPitch = -0.15; // Suspension squash on landing!
      }
    }

    // 3. Drift scoring & smoke particles
    if (this.isDrifting) {
      const points = Math.floor(Math.abs(this.speed) * 8 * delta);
      this.driftScore += points;
      this.totalDriftScore += points;

      this._emitTireSmoke(this.rearLeftWheel.anchor.position);
      this._emitTireSmoke(this.rearRightWheel.anchor.position);

      if (audio) {
        audio.playDriftScreech(Math.min(1.0, Math.abs(this.speed) / 25));
      }
    } else {
      this.driftScore = 0;
      if (audio) {
        audio.stopDriftScreech();
      }
    }

    // 4. Heading & Angular Turning
    // Turning sensitivity reduces smoothly at top speed for highway stability
    const speedRatio = Math.abs(this.speed) / this.maxSpeed;
    const steerFactor = (1.0 - speedRatio * 0.45);
    const turnRate = (this.speed / 4.4) * Math.sin(this.steeringAngle) * steerFactor;
    this.heading -= turnRate * delta;

    // 5. Position Integration
    const forwardX = Math.sin(this.heading);
    const forwardZ = Math.cos(this.heading);

    this.position.x += forwardX * this.speed * delta;
    this.position.z += forwardZ * this.speed * delta;

    // 6. Collision Detection with City Buildings
    if (cityBuilder) {
      const col = cityBuilder.checkCarCollision(this.position.x, this.position.z, 2.0);
      if (col && col.collided) {
        // Elastic rebound push out of wall
        this.position.x += col.normalX * (col.overlap + 0.1);
        this.position.z += col.normalZ * (col.overlap + 0.1);

        // Crash spark burst
        this._emitCrashSparks(this.position);

        // Speed drop & audio impact
        if (Math.abs(this.speed) > 5) {
          if (audio) audio.playCrashSound(Math.min(1.0, Math.abs(this.speed) / 25));
          this.speed *= -0.35; // Rebound bounce
        } else {
          this.speed = 0;
        }
      }
    }

    // 7. Suspension Lean Simulation (Roll & Pitch)
    const targetRoll = -(this.speed / this.maxSpeed) * this.steeringAngle * 0.28;
    const targetPitch = (throttle > 0 ? -0.06 : (throttle < 0 ? 0.08 : 0)) * (Math.abs(this.speed) / this.maxSpeed);

    this.bodyRoll = THREE.MathUtils.lerp(this.bodyRoll, targetRoll, delta * 8);
    this.bodyPitch = THREE.MathUtils.lerp(this.bodyPitch, targetPitch, delta * 8);

    this.bodyContainer.rotation.z = this.bodyRoll;
    this.bodyContainer.rotation.x = this.bodyPitch;

    // 8. Update Wheels Rotation & Steer
    const wheelCircumference = 2 * Math.PI * 0.38;
    const wheelRotDelta = (this.speed * delta) / wheelCircumference;

    this.frontLeftWheel.anchor.rotation.y = this.steeringAngle;
    this.frontRightWheel.anchor.rotation.y = this.steeringAngle;

    this.frontLeftWheel.spinGroup.rotation.x += wheelRotDelta;
    this.frontRightWheel.spinGroup.rotation.x += wheelRotDelta;
    this.rearLeftWheel.spinGroup.rotation.x += wheelRotDelta;
    this.rearRightWheel.spinGroup.rotation.x += wheelRotDelta;

    // 9. Taillight brightness on brake / reverse
    const isBraking = (throttle < 0 && this.speed > 0) || handbrake;
    const intensity = isBraking ? 1.8 : 0.4;
    for (const tl of this.taillightMeshes) {
      tl.material.emissiveIntensity = intensity;
    }

    // 10. Update Car Transform in Scene
    this.carGroup.position.copy(this.position);
    this.carGroup.rotation.y = this.heading;

    // 11. Update Smoke & Spark Particles
    this._updateParticles(delta);

    // Audio Engine pitch update
    if (audio) {
      const rpm = Math.abs(this.speed) / this.maxSpeed;
      audio.updateEnginePitch(rpm, throttle > 0.1);
    }
  }

  _emitTireSmoke(localPos) {
    // Spawn a smoke puff in world space
    const worldPos = new THREE.Vector3().copy(localPos).applyMatrix4(this.carGroup.matrixWorld);
    const size = 0.3 + Math.random() * 0.3;
    const geo = new THREE.SphereGeometry(size, 6, 6);
    const mat = new THREE.MeshBasicMaterial({
      color: 0x94a3b8,
      transparent: true,
      opacity: 0.6
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(worldPos);
    mesh.position.y = 0.2;
    this.particleGroup.add(mesh);

    this.particles.push({
      mesh,
      mat,
      life: 0.5,
      maxLife: 0.5,
      velY: 0.8 + Math.random() * 0.6,
      growRate: 1.5
    });
  }

  _emitCrashSparks(worldPos) {
    for (let i = 0; i < 12; i++) {
      const geo = new THREE.SphereGeometry(0.12, 4, 4);
      const mat = new THREE.MeshBasicMaterial({ color: 0xffd166 });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(
        worldPos.x + (Math.random() - 0.5) * 1.5,
        worldPos.y + 0.5 + Math.random() * 0.8,
        worldPos.z + (Math.random() - 0.5) * 1.5
      );
      this.particleGroup.add(mesh);

      this.particles.push({
        mesh,
        mat,
        life: 0.4,
        maxLife: 0.4,
        velX: (Math.random() - 0.5) * 12,
        velY: 2 + Math.random() * 6,
        velZ: (Math.random() - 0.5) * 12
      });
    }
  }

  _emitTurboFlames(localPos) {
    const worldPos = new THREE.Vector3().copy(localPos).applyMatrix4(this.carGroup.matrixWorld);
    const geo = new THREE.SphereGeometry(0.18, 4, 4);
    const mat = new THREE.MeshBasicMaterial({
      color: Math.random() > 0.5 ? 0x00f0ff : 0x38bdf8,
      transparent: true,
      opacity: 0.9
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(worldPos);
    mesh.position.y += 0.2;
    this.particleGroup.add(mesh);

    this.particles.push({
      mesh,
      mat,
      life: 0.25,
      maxLife: 0.25,
      velY: (Math.random() - 0.2) * 2,
      velX: (Math.random() - 0.5) * 3,
      velZ: (Math.random() - 0.5) * 3
    });
  }

  _updateParticles(delta) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= delta;

      if (p.life <= 0) {
        this.particleGroup.remove(p.mesh);
        if (p.mesh && p.mesh.geometry) p.mesh.geometry.dispose();
        if (p.mat && p.mat.dispose) p.mat.dispose();
        this.particles.splice(i, 1);
        continue;
      }

      const progress = p.life / p.maxLife;
      if (p.mat && p.mat.opacity !== undefined) {
        p.mat.opacity = progress * 0.8;
      }

      if (p.velX !== undefined) {
        // Spark & flame physics
        p.mesh.position.x += p.velX * delta;
        p.mesh.position.y += p.velY * delta;
        p.mesh.position.z += p.velZ * delta;
        p.velY -= 12 * delta; // Gravity
      } else {
        // Smoke physics
        p.mesh.position.y += p.velY * delta;
        const scale = 1 + (1 - progress) * p.growRate;
        p.mesh.scale.set(scale, scale, scale);
      }
    }
  }

  /**
   * Resets car position and orientation (e.g. after crash or flip).
   */
  reset(x = 0, z = 0, heading = 0) {
    this.position.set(x, 0.5, z);
    this.heading = heading;
    this.speed = 0;
    this.steeringAngle = 0;
    this.carGroup.position.copy(this.position);
    this.carGroup.rotation.y = this.heading;
    this.bodyContainer.rotation.set(0, 0, 0);
  }

  /**
   * Returns current car speed in KM/H for HUD speedometer.
   */
  getSpeedKmh() {
    return Math.abs(Math.round(this.speed * 3.6));
  }

  /**
   * Dynamically changes the player's car chassis color and neon underglow.
   * @param {string | number} colorHex
   */
  setCarColor(colorHex) {
    if (this.bodyMaterial) {
      this.bodyMaterial.color.set(colorHex);
    }
    if (this.underglowMat) {
      this.underglowMat.color.set(colorHex);
    }
  }

  /**
   * Launches car into the air on a stunt ramp jump.
   * @param {number} upwardVelocity
   */
  launchStuntJump(upwardVelocity = 18) {
    this.isInAir = true;
    this.velY = upwardVelocity;
    this.bodyPitch = 0.22; // Nose-up launch angle
  }

  /**
   * Refills nitro tank.
   * @param {number} amount
   */
  addNitro(amount = 100) {
    this.nitro = Math.min(100, this.nitro + amount);
  }

  /**
   * Emits fiery blue/orange turbo jet particles from exhaust pipes.
   */
  _emitTurboFlames(localPos) {
    const worldPos = new THREE.Vector3().copy(localPos).applyMatrix4(this.carGroup.matrixWorld);
    const geo = new THREE.SphereGeometry(0.2, 4, 4);
    const color = Math.random() > 0.4 ? 0x00f0ff : 0xf97316; // Cyan or flame orange
    const mat = new THREE.MeshBasicMaterial({ color });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(worldPos.x, 0.4, worldPos.z);
    this.particleGroup.add(mesh);

    this.particles.push({
      mesh,
      life: 0.25,
      maxLife: 0.25,
      velX: (Math.random() - 0.5) * 2,
      velY: Math.random() * 2,
      velZ: (Math.random() - 0.5) * 2
    });
  }

  /**
   * Updates the mascot fun symbol on the taxi sign or hood.
   * @param {string} symbol - e.g. '⚡', '🚀', '🔥', '👑'
   */
  setMascotSymbol(symbol) {
    this.mascotSymbol = symbol;

    // Create custom canvas texture for rooftop sign with driver's mascot symbol
    const signCanvas = document.createElement('canvas');
    signCanvas.width = 256;
    signCanvas.height = 128;
    const sCtx = signCanvas.getContext('2d');
    sCtx.fillStyle = '#ffb703';
    sCtx.fillRect(0, 0, 256, 128);

    sCtx.fillStyle = '#000000';
    sCtx.font = 'bold 44px sans-serif';
    sCtx.textAlign = 'center';
    sCtx.textBaseline = 'middle';
    sCtx.fillText(`${symbol} TAXI ${symbol}`, 128, 64);

    const signTex = new THREE.CanvasTexture(signCanvas);
    if (this.signMesh) {
      this.signMesh.material = new THREE.MeshStandardMaterial({
        map: signTex,
        roughness: 0.2,
        emissive: 0xffb703,
        emissiveIntensity: 0.6
      });
    }
  }

  /**
   * Returns current gear: 'P', 'R', 'N', 'D'.
   */
  getGear() {
    if (Math.abs(this.speed) < 0.2) return 'P';
    if (this.speed < -0.2) return 'R';
    return 'D';
  }
}
