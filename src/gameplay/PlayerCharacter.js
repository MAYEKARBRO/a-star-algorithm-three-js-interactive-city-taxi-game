import * as THREE from 'three';

/**
 * PlayerCharacter handles the on-foot third-person driver experience:
 * - Freely walking, sprinting, and jumping around the 3D metropolis
 * - Entering and exiting the taxi vehicle (GTA-style with 'F' or 'Enter')
 * - Buying food from street food stalls to restore health/stamina
 * - Conversing with sidewalk citizens and NPCs
 * - Visiting and resting inside the enterable safehouse
 */
export class PlayerCharacter {
  constructor(scene) {
    this.scene = scene;

    // State & Visibility
    this.isActive = false; // true = on foot, false = inside taxi
    this.position = new THREE.Vector3(0, 0, 0);
    this.heading = 0; // Rotation around Y axis
    this.speed = 0;

    // Movement Parameters (m/s)
    this.walkSpeed = 4.2;
    this.sprintSpeed = 7.8;
    this.turnSpeed = 14.0;
    this.maxSpeed = this.sprintSpeed;

    // Jumping & Gravity
    this.velY = 0;
    this.isGrounded = true;
    this.gravity = 26.0;
    this.jumpForce = 8.5;

    // Player Vitals
    this.health = 100;
    this.maxHealth = 100;
    this.stamina = 100;
    this.maxStamina = 100;
    this.isSprinting = false;

    // Animation & Walk Cycle
    this.walkAnimTime = 0;

    // Proximity / Interaction State
    this.nearbyInteractable = null; // { type: 'CAR'|'FOOD_STALL'|'NPC'|'BED', target: any, prompt: string }

    // 3D Visual Mesh Group
    this.group = new THREE.Group();
    this.group.visible = false;
    this.scene.add(this.group);

    this._buildCharacterModel();
  }

  /**
   * Constructs an articulated 3D model for the driver:
   * Stylish leather driver jacket, denim pants, driver's cap with mascot symbol, and sneakers.
   */
  _buildCharacterModel() {
    this.charRoot = new THREE.Group();
    this.group.add(this.charRoot);

    // Materials
    this.jacketMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.65, metalness: 0.2 }); // Charcoal Leather
    this.shirtMat = new THREE.MeshStandardMaterial({ color: 0xffb703, roughness: 0.7 }); // Taxi Gold shirt
    this.pantsMat = new THREE.MeshStandardMaterial({ color: 0x1e3a8a, roughness: 0.85 }); // Denim Blue
    this.skinMat = new THREE.MeshStandardMaterial({ color: 0xf5d0a9, roughness: 0.8 });
    this.shoeMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.4 }); // White sneakers
    this.capMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.7 });

    // 1. Torso
    const torsoGeo = new THREE.BoxGeometry(0.62, 0.52, 0.38);
    this.torso = new THREE.Mesh(torsoGeo, this.jacketMat);
    this.torso.position.y = 1.18;
    this.torso.castShadow = true;
    this.charRoot.add(this.torso);

    // Inner Gold Taxi Shirt
    const shirtGeo = new THREE.PlaneGeometry(0.22, 0.44);
    const shirt = new THREE.Mesh(shirtGeo, this.shirtMat);
    shirt.position.set(0, 0, 0.195);
    this.torso.add(shirt);

    // Belt & Waist
    const waistGeo = new THREE.BoxGeometry(0.56, 0.28, 0.35);
    const waist = new THREE.Mesh(waistGeo, this.pantsMat);
    waist.position.y = 0.85;
    waist.castShadow = true;
    this.charRoot.add(waist);

    // 2. Head & Driver Cap
    this.neck = new THREE.Group();
    this.neck.position.set(0, 1.45, 0);
    this.charRoot.add(this.neck);

    const headGeo = new THREE.SphereGeometry(0.24, 8, 8);
    this.head = new THREE.Mesh(headGeo, this.skinMat);
    this.head.position.y = 0.22;
    this.neck.add(this.head);

    // Driver's Cap with forward visor
    const capCrownGeo = new THREE.CylinderGeometry(0.26, 0.28, 0.16, 12);
    const capCrown = new THREE.Mesh(capCrownGeo, this.capMat);
    capCrown.position.y = 0.36;
    this.neck.add(capCrown);

    const visorGeo = new THREE.BoxGeometry(0.28, 0.04, 0.2);
    const visor = new THREE.Mesh(visorGeo, this.capMat);
    visor.position.set(0, 0.32, 0.26);
    visor.rotateX(0.12);
    this.neck.add(visor);

    // Gold Driver Badge on front of cap
    const badgeGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.03, 8);
    badgeGeo.rotateX(Math.PI / 2);
    const badgeMat = new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.9, roughness: 0.1 });
    const badge = new THREE.Mesh(badgeGeo, badgeMat);
    badge.position.set(0, 0.38, 0.28);
    this.neck.add(badge);

    // Sunglasses
    const glassesGeo = new THREE.BoxGeometry(0.36, 0.08, 0.1);
    const glassesMat = new THREE.MeshBasicMaterial({ color: 0x09090b });
    const glasses = new THREE.Mesh(glassesGeo, glassesMat);
    glasses.position.set(0, 0.24, 0.22);
    this.neck.add(glasses);

    // 3. Articulated Legs (Upper Thighs + Lower Knees/Shins)
    // Left Leg
    this.leftThigh = new THREE.Group();
    this.leftThigh.position.set(-0.16, 0.72, 0);
    this.charRoot.add(this.leftThigh);

    const thighGeo = new THREE.BoxGeometry(0.2, 0.42, 0.22);
    const lThighMesh = new THREE.Mesh(thighGeo, this.pantsMat);
    lThighMesh.position.y = -0.21;
    lThighMesh.castShadow = true;
    this.leftThigh.add(lThighMesh);

    this.leftKnee = new THREE.Group();
    this.leftKnee.position.set(0, -0.42, 0);
    this.leftThigh.add(this.leftKnee);

    const shinGeo = new THREE.BoxGeometry(0.18, 0.42, 0.2);
    const lShinMesh = new THREE.Mesh(shinGeo, this.pantsMat);
    lShinMesh.position.y = -0.21;
    lShinMesh.castShadow = true;
    this.leftKnee.add(lShinMesh);

    const shoeGeo = new THREE.BoxGeometry(0.2, 0.15, 0.34);
    const lShoe = new THREE.Mesh(shoeGeo, this.shoeMat);
    lShoe.position.set(0, -0.42, 0.07);
    this.leftKnee.add(lShoe);

    // Right Leg
    this.rightThigh = new THREE.Group();
    this.rightThigh.position.set(0.16, 0.72, 0);
    this.charRoot.add(this.rightThigh);

    const rThighMesh = new THREE.Mesh(thighGeo, this.pantsMat);
    rThighMesh.position.y = -0.21;
    rThighMesh.castShadow = true;
    this.rightThigh.add(rThighMesh);

    this.rightKnee = new THREE.Group();
    this.rightKnee.position.set(0, -0.42, 0);
    this.rightThigh.add(this.rightKnee);

    const rShinMesh = new THREE.Mesh(shinGeo, this.pantsMat);
    rShinMesh.position.y = -0.21;
    rShinMesh.castShadow = true;
    this.rightKnee.add(rShinMesh);

    const rShoe = new THREE.Mesh(shoeGeo, this.shoeMat);
    rShoe.position.set(0, -0.42, 0.07);
    this.rightKnee.add(rShoe);

    // 4. Articulated Arms (Shoulders + Elbows/Hands)
    // Left Arm
    this.leftShoulder = new THREE.Group();
    this.leftShoulder.position.set(-0.38, 1.35, 0);
    this.charRoot.add(this.leftShoulder);

    const armGeo = new THREE.BoxGeometry(0.15, 0.34, 0.15);
    const lArmMesh = new THREE.Mesh(armGeo, this.jacketMat);
    lArmMesh.position.y = -0.17;
    this.leftShoulder.add(lArmMesh);

    this.leftElbow = new THREE.Group();
    this.leftElbow.position.set(0, -0.34, 0);
    this.leftShoulder.add(this.leftElbow);

    const forearmGeo = new THREE.BoxGeometry(0.13, 0.32, 0.13);
    const lForearmMesh = new THREE.Mesh(forearmGeo, this.jacketMat);
    lForearmMesh.position.y = -0.16;
    this.leftElbow.add(lForearmMesh);

    const handGeo = new THREE.BoxGeometry(0.11, 0.14, 0.12);
    const lHand = new THREE.Mesh(handGeo, this.skinMat);
    lHand.position.set(0, -0.36, 0);
    this.leftElbow.add(lHand);

    // Right Arm
    this.rightShoulder = new THREE.Group();
    this.rightShoulder.position.set(0.38, 1.35, 0);
    this.charRoot.add(this.rightShoulder);

    const rArmMesh = new THREE.Mesh(armGeo, this.jacketMat);
    rArmMesh.position.y = -0.17;
    this.rightShoulder.add(rArmMesh);

    this.rightElbow = new THREE.Group();
    this.rightElbow.position.set(0, -0.34, 0);
    this.rightShoulder.add(this.rightElbow);

    const rForearmMesh = new THREE.Mesh(forearmGeo, this.jacketMat);
    rForearmMesh.position.y = -0.16;
    this.rightElbow.add(rForearmMesh);

    const rHand = new THREE.Mesh(handGeo, this.skinMat);
    rHand.position.set(0, -0.36, 0);
    this.rightElbow.add(rHand);
  }

  /**
   * Spawns player on-foot right beside the taxi.
   * @param {import('./Car.js').Car} car
   */
  exitCar(car) {
    this.isActive = true;
    this.group.visible = true;

    // Position player beside the driver's side door
    const exitOffset = 1.8;
    this.position.set(
      car.position.x - Math.cos(car.heading) * exitOffset,
      0.35,
      car.position.z + Math.sin(car.heading) * exitOffset
    );
    this.heading = car.heading - Math.PI / 2;
    this.speed = 0;
    this.velY = 0;
    this.isGrounded = true;

    this.group.position.copy(this.position);
    this.charRoot.rotation.y = this.heading;
  }

  /**
   * Hides on-foot player when entering the taxi.
   */
  enterCar() {
    this.isActive = false;
    this.group.visible = false;
    this.speed = 0;
    this.nearbyInteractable = null;
  }

  /**
   * Updates on-foot character movement, sprinting, jumping, collision, and animation.
   * @param {number} delta
   * @param {Object} input - { moveX, moveZ, sprint, jump }
   * @param {import('../city/CityBuilder.js').CityBuilder} cityBuilder
   * @param {import('./Car.js').Car} car
   * @param {import('../pedestrians/PedestrianSystem.js').PedestrianSystem} [pedestrians]
   * @param {number} [cameraYaw=0] - Horizontal rotation angle of the third-person camera
   */
  update(delta, input, cityBuilder, car, pedestrians, cameraYaw = 0) {
    if (!this.isActive) return;

    delta = Math.min(delta, 0.1);

    const moveX = input.moveX || 0; // -1 to 1 (A/D or Left Stick X)
    const moveZ = input.moveZ || 0; // -1 to 1 (W/S or Left Stick Y)
    const isSprintInput = !!input.sprint;
    const isJumpInput = !!input.jump;

    // Convert stick/key input into world direction relative to current camera yaw angle
    // In our coordinate system:
    // camFwd: vector along camera view direction into the scene
    const camFwdX = Math.sin(cameraYaw);
    const camFwdZ = Math.cos(cameraYaw);
    // camRight: vector perpendicular to camera view pointing to screen RIGHT
    const camRightX = -Math.cos(cameraYaw);
    const camRightZ = Math.sin(cameraYaw);

    // moveZ: +1 (UP/W) moves Front along camera view; -1 (DOWN/S) moves Back towards camera
    // moveX: +1 (RIGHT/D) moves Right on screen; -1 (LEFT/A) moves Left on screen
    const worldMoveX = camFwdX * moveZ + camRightX * moveX;
    const worldMoveZ = camFwdZ * moveZ + camRightZ * moveX;
    const inputMagnitude = Math.min(1.0, Math.hypot(worldMoveX, worldMoveZ));
    const hasMoveInput = inputMagnitude > 0.08;

    // 1. Stamina & Sprinting
    if (hasMoveInput && isSprintInput && this.stamina > 5) {
      this.isSprinting = true;
      this.stamina = Math.max(0, this.stamina - 22 * delta);
    } else {
      this.isSprinting = false;
      this.stamina = Math.min(this.maxStamina, this.stamina + 14 * delta);
    }

    const targetMaxSpeed = this.isSprinting ? this.sprintSpeed : this.walkSpeed;
    const targetSpeed = hasMoveInput ? targetMaxSpeed * inputMagnitude : 0;
    this.speed = THREE.MathUtils.lerp(this.speed, targetSpeed, delta * 12);

    // 2. Heading Rotation toward Movement Direction
    if (hasMoveInput) {
      const targetHeading = Math.atan2(worldMoveX, worldMoveZ);
      // Smooth shortest-arc rotation
      let diff = targetHeading - this.heading;
      while (diff < -Math.PI) diff += Math.PI * 2;
      while (diff > Math.PI) diff -= Math.PI * 2;
      this.heading += diff * Math.min(1.0, this.turnSpeed * delta);
    }
    this.charRoot.rotation.y = this.heading;

    // 3. Forward Movement
    if (this.speed > 0.05) {
      const forwardX = Math.sin(this.heading);
      const forwardZ = Math.cos(this.heading);

      const nextX = this.position.x + forwardX * this.speed * delta;
      const nextZ = this.position.z + forwardZ * this.speed * delta;

      // Check collision with city buildings
      let canMove = true;
      if (cityBuilder) {
        const col = cityBuilder.checkCarCollision(nextX, nextZ, 0.6);
        if (col && col.collided) {
          canMove = false;
        }
      }

      if (canMove) {
        this.position.x = nextX;
        this.position.z = nextZ;
      }
    }

    // 4. Jumping & Vertical Gravity
    if (isJumpInput && this.isGrounded) {
      this.velY = this.jumpForce;
      this.isGrounded = false;
    }

    if (!this.isGrounded) {
      this.velY -= this.gravity * delta;
      this.position.y += this.velY * delta;

      if (this.position.y <= 0.35) {
        this.position.y = 0.35;
        this.velY = 0;
        this.isGrounded = true;
      }
    } else {
      this.position.y = 0.35;
    }

    this.group.position.copy(this.position);

    // 5. Walking & Running Articulated Animation
    if (this.speed > 0.2 && this.isGrounded) {
      this.walkAnimTime += delta * (this.isSprinting ? 14 : 9);
      const stride = Math.sin(this.walkAnimTime);

      // Thighs swing
      this.leftThigh.rotation.x = stride * (this.isSprinting ? 0.8 : 0.55);
      this.rightThigh.rotation.x = -stride * (this.isSprinting ? 0.8 : 0.55);

      // Knee articulation (bends backwards on recovery)
      this.leftKnee.rotation.x = Math.max(0, -stride) * (this.isSprinting ? 1.0 : 0.7);
      this.rightKnee.rotation.x = Math.max(0, stride) * (this.isSprinting ? 1.0 : 0.7);

      // Arms counter-swing
      this.leftShoulder.rotation.x = -stride * (this.isSprinting ? 0.75 : 0.45);
      this.rightShoulder.rotation.x = stride * (this.isSprinting ? 0.75 : 0.45);

      // Torso slight vertical bob
      this.torso.position.y = 1.18 + Math.abs(Math.sin(this.walkAnimTime * 2)) * 0.04;
    } else if (this.isGrounded) {
      // Idle Rest Pose
      this.leftThigh.rotation.x = THREE.MathUtils.lerp(this.leftThigh.rotation.x, 0, delta * 8);
      this.rightThigh.rotation.x = THREE.MathUtils.lerp(this.rightThigh.rotation.x, 0, delta * 8);
      this.leftKnee.rotation.x = THREE.MathUtils.lerp(this.leftKnee.rotation.x, 0, delta * 8);
      this.rightKnee.rotation.x = THREE.MathUtils.lerp(this.rightKnee.rotation.x, 0, delta * 8);
      this.leftShoulder.rotation.x = THREE.MathUtils.lerp(this.leftShoulder.rotation.x, 0, delta * 8);
      this.rightShoulder.rotation.x = THREE.MathUtils.lerp(this.rightShoulder.rotation.x, 0, delta * 8);
      this.torso.position.y = 1.18;
    } else {
      // In-Air Jumping Pose
      this.leftThigh.rotation.x = 0.45;
      this.rightThigh.rotation.x = -0.3;
      this.leftKnee.rotation.x = 0.6;
      this.rightKnee.rotation.x = 0.4;
      this.leftShoulder.rotation.x = -0.7;
      this.rightShoulder.rotation.x = -0.7;
    }

    // 6. Check Proximity to Interactable Objects
    this._checkProximities(car, cityBuilder, pedestrians);
  }

  _checkProximities(car, cityBuilder, pedestrians) {
    this.nearbyInteractable = null;

    // 1. Proximity to Taxi Vehicle
    const carDist = this.position.distanceTo(car.position);
    if (carDist < 3.2) {
      this.nearbyInteractable = {
        type: 'CAR',
        target: car,
        key: 'F',
        prompt: 'ENTER TAXI CAB'
      };
      return;
    }

    // 2. Proximity to Food Stalls
    if (cityBuilder && cityBuilder.foodStalls) {
      for (const stall of cityBuilder.foodStalls) {
        const stallDist = Math.hypot(this.position.x - stall.x, this.position.z - stall.z);
        if (stallDist < 3.0) {
          this.nearbyInteractable = {
            type: 'FOOD_STALL',
            target: stall,
            key: 'E',
            prompt: `BUY ${stall.name.toUpperCase()} ($${stall.price.toFixed(2)})`
          };
          return;
        }
      }
    }

    // 3. Proximity to Safehouse Rest Bed
    if (cityBuilder && cityBuilder.safehouseBedPos) {
      const bedDist = Math.hypot(
        this.position.x - cityBuilder.safehouseBedPos.x,
        this.position.z - cityBuilder.safehouseBedPos.z
      );
      if (bedDist < 2.5) {
        this.nearbyInteractable = {
          type: 'BED',
          target: cityBuilder.safehouseBedPos,
          key: 'E',
          prompt: 'REST IN SAFEHOUSE (RESTORE HEALTH)'
        };
        return;
      }
    }

    // 4. Proximity to Pedestrian NPCs
    if (pedestrians && pedestrians.pedestrians) {
      for (const ped of pedestrians.pedestrians) {
        if (ped.state === 'FALLEN' || ped.state === 'RECOVERING') continue;
        const pedDist = Math.hypot(
          this.position.x - ped.group.position.x,
          this.position.z - ped.group.position.z
        );
        if (pedDist < 2.5) {
          this.nearbyInteractable = {
            type: 'NPC',
            target: ped,
            key: 'E',
            prompt: `TALK TO ${ped.archetype} CITIZEN`
          };
          return;
        }
      }
    }
  }

  /**
   * Consumes food item: restores health and stamina.
   * @param {number} healthAmount
   */
  eatFood(healthAmount = 50) {
    this.health = Math.min(this.maxHealth, this.health + healthAmount);
    this.stamina = this.maxStamina;
  }
}
