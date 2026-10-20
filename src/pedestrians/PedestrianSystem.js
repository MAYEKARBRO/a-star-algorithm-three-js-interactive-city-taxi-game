import * as THREE from 'three';

/**
 * Pedestrian represents a realistic autonomous citizen walking along city sidewalks.
 * Features 4 distinct archetypes (Business, Jogger, Smartphone Texter, Casual Commuter),
 * multi-joint articulated limbs (elbows & knees), reactive evasion AI for car proximity/horn,
 * natural crosswalk pauses, and a smooth knockdown & recovery animation sequence.
 */
class Pedestrian {
  constructor(scene, sidewalkX, sidewalkZ, direction, streetLength, isHorizontal, archetype = null) {
    this.scene = scene;
    this.startX = sidewalkX;
    this.startZ = sidewalkZ;
    this.direction = direction; // 1 or -1
    this.streetLength = streetLength;
    this.isHorizontal = isHorizontal;

    // Pick Archetype
    const archetypes = ['BUSINESS', 'JOGGER', 'SMARTPHONE', 'CASUAL'];
    this.archetype = archetype || archetypes[Math.floor(Math.random() * archetypes.length)];

    // Archetype-specific walk speed
    if (this.archetype === 'JOGGER') {
      this.speed = 2.9 + Math.random() * 0.5; // Jogger ~3.2 m/s
    } else if (this.archetype === 'SMARTPHONE') {
      this.speed = 1.3 + Math.random() * 0.4; // Casual browser ~1.4 m/s
    } else {
      this.speed = 1.6 + Math.random() * 0.5; // Business/Casual ~1.8 m/s
    }

    this.state = 'WALKING'; // 'WALKING' | 'LOOKING' | 'STARTLED' | 'FALLEN' | 'RECOVERING'
    this.fallTimer = 0;
    this.recoverTimer = 0;
    this.startleTimer = 0;
    this.lookTimer = 0;
    this.walkAnimTime = Math.random() * 10;
    this.headLookAngle = 0;

    // Realistic palette assignments
    this._assignColorPalette();

    this.group = new THREE.Group();
    this.group.position.set(sidewalkX, 0.35, sidewalkZ);
    this._buildArticulatedMesh();
    this.scene.add(this.group);
  }

  _assignColorPalette() {
    // Skin tones
    const skinTones = [0xfde047, 0xf5d0a9, 0xd4a373, 0xb07238, 0x8d5524, 0x4a2c11];
    this.skinColor = skinTones[Math.floor(Math.random() * skinTones.length)];

    // Hair colors
    const hairColors = [0x111827, 0x3f220d, 0x78350f, 0xd97706, 0x94a3b8];
    this.hairColor = hairColors[Math.floor(Math.random() * hairColors.length)];

    if (this.archetype === 'BUSINESS') {
      const suits = [0x1e293b, 0x0f172a, 0x334155, 0x1e3a8a];
      this.suitColor = suits[Math.floor(Math.random() * suits.length)];
      this.tieColor = Math.random() > 0.5 ? 0xd90429 : 0x0284c7;
      this.shoeColor = 0x0f172a;
    } else if (this.archetype === 'JOGGER') {
      const hoodies = [0xef4444, 0x10b981, 0x06b6d4, 0xf59e0b, 0xa855f7];
      this.hoodieColor = hoodies[Math.floor(Math.random() * hoodies.length)];
      this.shortsColor = 0x1e293b;
      this.shoeColor = 0xffffff;
    } else if (this.archetype === 'SMARTPHONE') {
      const jackets = [0x3b82f6, 0xec4899, 0x64748b, 0x059669];
      this.jacketColor = jackets[Math.floor(Math.random() * jackets.length)];
      this.pantsColor = 0x1e40af; // Denim blue
      this.shoeColor = 0xf8fafc;
    } else {
      // Casual Commuter
      const coats = [0x78350f, 0x475569, 0x1e293b, 0x854d0e];
      this.coatColor = coats[Math.floor(Math.random() * coats.length)];
      this.pantsColor = 0x334155;
      this.shoeColor = 0x451a03;
    }
  }

  /**
   * Constructs the articulated low-poly human model with upper/lower limbs,
   * head rotation node, and archetype-specific equipment (briefcase, phone, coffee cup).
   */
  _buildArticulatedMesh() {
    const skinMat = new THREE.MeshStandardMaterial({ color: this.skinColor, roughness: 0.8 });
    const hairMat = new THREE.MeshStandardMaterial({ color: this.hairColor, roughness: 0.9 });

    // 1. Torso Hierarchy (Chest + Waist)
    let torsoMat, pantsMat;
    if (this.archetype === 'BUSINESS') {
      torsoMat = new THREE.MeshStandardMaterial({ color: this.suitColor, roughness: 0.65 });
      pantsMat = torsoMat;
    } else if (this.archetype === 'JOGGER') {
      torsoMat = new THREE.MeshStandardMaterial({ color: this.hoodieColor, roughness: 0.7 });
      pantsMat = new THREE.MeshStandardMaterial({ color: this.shortsColor, roughness: 0.8 });
    } else if (this.archetype === 'SMARTPHONE') {
      torsoMat = new THREE.MeshStandardMaterial({ color: this.jacketColor, roughness: 0.7 });
      pantsMat = new THREE.MeshStandardMaterial({ color: this.pantsColor, roughness: 0.85 });
    } else {
      torsoMat = new THREE.MeshStandardMaterial({ color: this.coatColor, roughness: 0.75 });
      pantsMat = new THREE.MeshStandardMaterial({ color: this.pantsColor, roughness: 0.8 });
    }

    // Upper Torso (Chest & Shoulders)
    const chestGeo = new THREE.BoxGeometry(0.58, 0.46, 0.36);
    this.chest = new THREE.Mesh(chestGeo, torsoMat);
    this.chest.position.y = 1.18;
    this.chest.castShadow = true;
    this.group.add(this.chest);

    // Business Tie & Shirt Collar
    if (this.archetype === 'BUSINESS') {
      const shirtGeo = new THREE.PlaneGeometry(0.2, 0.28);
      const shirt = new THREE.Mesh(shirtGeo, new THREE.MeshBasicMaterial({ color: 0xffffff }));
      shirt.position.set(0, 0.08, 0.185);
      this.chest.add(shirt);

      const tieGeo = new THREE.PlaneGeometry(0.08, 0.34);
      const tie = new THREE.Mesh(tieGeo, new THREE.MeshBasicMaterial({ color: this.tieColor }));
      tie.position.set(0, 0.02, 0.19);
      this.chest.add(tie);
    }

    // Lower Torso / Waist with Belt
    const waistGeo = new THREE.BoxGeometry(0.52, 0.32, 0.33);
    const waist = new THREE.Mesh(waistGeo, pantsMat);
    waist.position.y = 0.86;
    waist.castShadow = true;
    this.group.add(waist);

    // 2. Neck & Head with Independent Turning Node
    this.neckAnchor = new THREE.Group();
    this.neckAnchor.position.set(0, 1.42, 0);
    this.group.add(this.neckAnchor);

    const headGeo = new THREE.SphereGeometry(0.23, 8, 8);
    this.headMesh = new THREE.Mesh(headGeo, skinMat);
    this.headMesh.position.y = 0.22;
    this.neckAnchor.add(this.headMesh);

    // Hair or Headwear
    if (this.archetype === 'JOGGER') {
      // Baseball cap with backward brim
      const capMat = new THREE.MeshStandardMaterial({ color: this.hoodieColor, roughness: 0.7 });
      const capMesh = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.14, 0.32), capMat);
      capMesh.position.y = 0.35;
      this.neckAnchor.add(capMesh);

      const brimMesh = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.03, 0.18), capMat);
      brimMesh.position.set(0, 0.3, -0.22);
      this.neckAnchor.add(brimMesh);
    } else {
      // Standard Hair Cap
      const hairGeo = new THREE.BoxGeometry(0.34, 0.16, 0.34);
      const hair = new THREE.Mesh(hairGeo, hairMat);
      hair.position.y = 0.34;
      this.neckAnchor.add(hair);
    }

    // 3. Articulated Legs (Upper Thigh + Lower Shin with Knee Joint)
    const shoeMat = new THREE.MeshStandardMaterial({ color: this.shoeColor, roughness: 0.6 });

    // Left Leg
    this.leftThighAnchor = new THREE.Group();
    this.leftThighAnchor.position.set(-0.16, 0.72, 0);
    this.group.add(this.leftThighAnchor);

    const thighGeo = new THREE.BoxGeometry(0.18, 0.38, 0.2);
    const lThigh = new THREE.Mesh(thighGeo, pantsMat);
    lThigh.position.y = -0.19;
    lThigh.castShadow = true;
    this.leftThighAnchor.add(lThigh);

    // Left Knee & Shin
    this.leftKneeAnchor = new THREE.Group();
    this.leftKneeAnchor.position.set(0, -0.38, 0);
    this.leftThighAnchor.add(this.leftKneeAnchor);

    const shinGeo = new THREE.BoxGeometry(0.16, 0.38, 0.18);
    const lShin = new THREE.Mesh(shinGeo, pantsMat);
    lShin.position.y = -0.19;
    lShin.castShadow = true;
    this.leftKneeAnchor.add(lShin);

    const lShoe = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.14, 0.3), shoeMat);
    lShoe.position.set(0, -0.38, 0.06);
    this.leftKneeAnchor.add(lShoe);

    // Right Leg
    this.rightThighAnchor = new THREE.Group();
    this.rightThighAnchor.position.set(0.16, 0.72, 0);
    this.group.add(this.rightThighAnchor);

    const rThigh = new THREE.Mesh(thighGeo, pantsMat);
    rThigh.position.y = -0.19;
    rThigh.castShadow = true;
    this.rightThighAnchor.add(rThigh);

    this.rightKneeAnchor = new THREE.Group();
    this.rightKneeAnchor.position.set(0, -0.38, 0);
    this.rightThighAnchor.add(this.rightKneeAnchor);

    const rShin = new THREE.Mesh(shinGeo, pantsMat);
    rShin.position.y = -0.19;
    rShin.castShadow = true;
    this.rightKneeAnchor.add(rShin);

    const rShoe = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.14, 0.3), shoeMat);
    rShoe.position.set(0, -0.38, 0.06);
    this.rightKneeAnchor.add(rShoe);

    // 4. Articulated Arms (Upper Arm + Forearm with Elbow Joint)
    // Left Arm
    this.leftShoulderAnchor = new THREE.Group();
    this.leftShoulderAnchor.position.set(-0.36, 1.35, 0);
    this.group.add(this.leftShoulderAnchor);

    const upperArmGeo = new THREE.BoxGeometry(0.14, 0.32, 0.14);
    const lUpperArm = new THREE.Mesh(upperArmGeo, torsoMat);
    lUpperArm.position.y = -0.16;
    this.leftShoulderAnchor.add(lUpperArm);

    this.leftElbowAnchor = new THREE.Group();
    this.leftElbowAnchor.position.set(0, -0.32, 0);
    this.leftShoulderAnchor.add(this.leftElbowAnchor);

    const forearmGeo = new THREE.BoxGeometry(0.12, 0.3, 0.12);
    const lForearm = new THREE.Mesh(forearmGeo, torsoMat);
    lForearm.position.y = -0.15;
    this.leftElbowAnchor.add(lForearm);

    // Right Arm
    this.rightShoulderAnchor = new THREE.Group();
    this.rightShoulderAnchor.position.set(0.36, 1.35, 0);
    this.group.add(this.rightShoulderAnchor);

    const rUpperArm = new THREE.Mesh(upperArmGeo, torsoMat);
    rUpperArm.position.y = -0.16;
    this.rightShoulderAnchor.add(rUpperArm);

    this.rightElbowAnchor = new THREE.Group();
    this.rightElbowAnchor.position.set(0, -0.32, 0);
    this.rightShoulderAnchor.add(this.rightElbowAnchor);

    const rForearm = new THREE.Mesh(forearmGeo, torsoMat);
    rForearm.position.y = -0.15;
    this.rightElbowAnchor.add(rForearm);

    // 5. Archetype-Specific Handheld Props
    if (this.archetype === 'BUSINESS') {
      // Leather Executive Briefcase
      const caseMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.4, metalness: 0.3 });
      const briefcase = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.34, 0.44), caseMat);
      briefcase.position.set(0.08, -0.28, 0.05);
      this.rightElbowAnchor.add(briefcase);

    } else if (this.archetype === 'SMARTPHONE') {
      // Bent arm texting on smartphone
      this.rightShoulderAnchor.rotation.x = -0.6;
      this.rightElbowAnchor.rotation.x = -0.9;

      const phoneMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.8 });
      const phone = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.16, 0.02), phoneMat);
      phone.position.set(0, -0.3, 0.12);
      this.rightElbowAnchor.add(phone);

      // Glowing Cyan Screen
      const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.06, 0.13), new THREE.MeshBasicMaterial({ color: 0x00f0ff }));
      screen.position.set(0, -0.3, 0.135);
      this.rightElbowAnchor.add(screen);

    } else if (this.archetype === 'CASUAL') {
      // Holding paper coffee cup
      this.rightShoulderAnchor.rotation.x = -0.35;
      this.rightElbowAnchor.rotation.x = -0.6;

      const cupMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.9 });
      const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.05, 0.16, 8), cupMat);
      cup.position.set(0, -0.28, 0.1);
      this.rightElbowAnchor.add(cup);
    }

    this._updateRotation();
  }

  _updateRotation() {
    if (this.isHorizontal) {
      this.group.rotation.y = this.direction > 0 ? Math.PI / 2 : -Math.PI / 2;
    } else {
      this.group.rotation.y = this.direction > 0 ? 0 : Math.PI;
    }
  }

  /**
   * Knocks the pedestrian down dynamically when hit by a car.
   */
  knockdown() {
    if (this.state === 'FALLEN' || this.state === 'RECOVERING') return;

    this.state = 'FALLEN';
    this.fallTimer = 3.0; // Seconds to lie down

    // Realistic tumble & lateral tilt
    this.group.rotation.x = -Math.PI / 2.15;
    this.group.rotation.z = (Math.random() - 0.5) * 0.7;
    this.group.position.y = 0.42;

    // Reset leg & arm angles to ragdoll rest
    this.leftThighAnchor.rotation.x = 0.3;
    this.rightThighAnchor.rotation.x = -0.2;
    this.leftShoulderAnchor.rotation.x = -1.2;
    this.rightShoulderAnchor.rotation.x = -1.2;
  }

  /**
   * Triggers startled reaction when car is dangerously close or honks horn.
   */
  startle(car) {
    if (this.state !== 'WALKING') return;

    this.state = 'STARTLED';
    this.startleTimer = 2.2;

    // Jump back away from roadway
    const jumpOffset = (Math.random() > 0.5 ? 0.8 : -0.8);
    if (this.isHorizontal) {
      this.group.position.z += jumpOffset;
    } else {
      this.group.position.x += jumpOffset;
    }

    // Defensive hand gesture
    this.leftShoulderAnchor.rotation.x = -1.6;
    this.rightShoulderAnchor.rotation.x = -1.6;
    this.leftShoulderAnchor.rotation.z = 0.4;
    this.rightShoulderAnchor.rotation.z = -0.4;
  }

  /**
   * Updates pedestrian movement, articulated gait, awareness, and knockdown recovery.
   * @param {number} delta
   * @param {import('../gameplay/Car.js').Car} [playerCar]
   * @param {import('../core/AudioManager.js').AudioManager} [audio]
   */
  update(delta, playerCar, audio) {
    // 1. Fall & Recovery State Machine
    if (this.state === 'FALLEN') {
      this.fallTimer -= delta;
      if (this.fallTimer <= 0) {
        // Transition to sitting up groggily
        this.state = 'RECOVERING';
        this.recoverTimer = 1.8;
        this.group.rotation.x = -Math.PI / 3.8; // Sitting up
      }
      return;
    }

    if (this.state === 'RECOVERING') {
      this.recoverTimer -= delta;
      if (this.recoverTimer <= 0) {
        // Stand back up smoothly
        this.state = 'WALKING';
        this.group.position.y = 0.35;
        this.group.rotation.x = 0;
        this.group.rotation.z = 0;
        this._updateRotation();
      }
      return;
    }

    // 2. React to Car Proximity / Honk
    if (playerCar) {
      const dx = playerCar.position.x - this.group.position.x;
      const dz = playerCar.position.z - this.group.position.z;
      const distSq = dx * dx + dz * dz;

      const isCarNear = distSq < 7.0 * 7.0;
      const isHonking = !!(audio && audio.isHonking);

      if ((isCarNear || isHonking) && this.state === 'WALKING' && Math.abs(playerCar.speed) > 2) {
        this.startle(playerCar);
      }
    }

    if (this.state === 'STARTLED') {
      this.startleTimer -= delta;
      if (this.startleTimer <= 0) {
        this.state = 'WALKING';
        this._updateRotation();
      }
    }

    // 3. Sidewalk Navigation
    const currentSpeed = this.state === 'STARTLED' ? this.speed * 1.5 : this.speed;
    this.walkAnimTime += delta * 6.5 * (currentSpeed / 1.8);

    const moveDist = currentSpeed * this.direction * delta;
    if (this.isHorizontal) {
      this.group.position.x += moveDist;
      if (Math.abs(this.group.position.x - this.startX) > this.streetLength / 2) {
        this.direction *= -1;
        this._updateRotation();
      }
    } else {
      this.group.position.z += moveDist;
      if (Math.abs(this.group.position.z - this.startZ) > this.streetLength / 2) {
        this.direction *= -1;
        this._updateRotation();
      }
    }

    // 4. Realistic Walking Biomechanics (Thighs + Knee bends + Opposite Arm Swing)
    const stride = Math.sin(this.walkAnimTime);

    // Thigh swing
    this.leftThighAnchor.rotation.x = stride * 0.55;
    this.rightThighAnchor.rotation.x = -stride * 0.55;

    // Knee bend: knees bend on the backward leg swing, straight on forward plant
    this.leftKneeAnchor.rotation.x = Math.max(0, -stride) * 0.65;
    this.rightKneeAnchor.rotation.x = Math.max(0, stride) * 0.65;

    // Arms swing in counter-balance (unless holding props)
    if (this.state !== 'STARTLED') {
      this.leftShoulderAnchor.rotation.x = -stride * 0.45;

      if (this.archetype === 'SMARTPHONE') {
        // Holding phone steadily, slight bob
        this.rightShoulderAnchor.rotation.x = -0.6 + Math.cos(this.walkAnimTime) * 0.08;
      } else if (this.archetype === 'CASUAL') {
        // Holding coffee cup
        this.rightShoulderAnchor.rotation.x = -0.35 + Math.cos(this.walkAnimTime) * 0.06;
      } else {
        // Business / Jogger full arm swing
        this.rightShoulderAnchor.rotation.x = stride * 0.45;
      }
    }

    // Natural Head Scanning (Looking around at storefronts / street)
    this.headLookAngle = Math.sin(this.walkAnimTime * 0.4) * 0.28;
    this.neckAnchor.rotation.y = this.headLookAngle;
  }
}

/**
 * PedestrianSystem manages realistic city crowds walking on sidewalks,
 * detects vehicle collisions, and issues traffic safety cash fines.
 */
export class PedestrianSystem {
  constructor(scene, roadNetwork) {
    this.scene = scene;
    this.roadNetwork = roadNetwork;

    this.pedestrians = [];
    this.totalPedestrianHits = 0;

    this._spawnCrowd();
  }

  _spawnCrowd() {
    const spacing = this.roadNetwork.spacing;
    const roadWidth = this.roadNetwork.getCityBounds().roadWidth;
    const sidewalkOffset = roadWidth / 2 + 2.2; // Walkway center
    const blockLength = spacing - roadWidth - 4;

    const archetypes = ['BUSINESS', 'JOGGER', 'SMARTPHONE', 'CASUAL'];
    let archIdx = 0;

    // Spawn diverse pedestrians across all blocks of the city grid
    for (let ix = 0; ix < this.roadNetwork.gridSizeX - 1; ix++) {
      for (let iz = 0; iz < this.roadNetwork.gridSizeZ - 1; iz++) {
        const x1 = ix * spacing - this.roadNetwork.halfSizeX;
        const z1 = iz * spacing - this.roadNetwork.halfSizeZ;
        const blockCenterX = x1 + spacing / 2;
        const blockCenterZ = z1 + spacing / 2;

        // Pedestrian A on East-West sidewalk
        const pedA = new Pedestrian(
          this.scene,
          blockCenterX + (Math.random() - 0.5) * (blockLength * 0.65),
          blockCenterZ - sidewalkOffset,
          Math.random() > 0.5 ? 1 : -1,
          blockLength,
          true,
          archetypes[archIdx++ % archetypes.length]
        );
        this.pedestrians.push(pedA);

        // Pedestrian B on North-South sidewalk
        const pedB = new Pedestrian(
          this.scene,
          blockCenterX + sidewalkOffset,
          blockCenterZ + (Math.random() - 0.5) * (blockLength * 0.65),
          Math.random() > 0.5 ? 1 : -1,
          blockLength,
          false,
          archetypes[archIdx++ % archetypes.length]
        );
        this.pedestrians.push(pedB);
      }
    }
  }

  /**
   * Checks collision with the player car.
   * If collision occurs, knocks pedestrian down and deducts driver cash fine.
   * @param {import('../gameplay/Car.js').Car} car
   * @param {import('../core/AudioManager.js').AudioManager} [audio]
   * @returns {{ hit: boolean, penalty: number, message: string } | null}
   */
  checkCarCollisions(car, audio) {
    const carPos = car.position;
    const hitRadius = 2.2;

    for (const ped of this.pedestrians) {
      if (ped.state === 'FALLEN' || ped.state === 'RECOVERING') continue;

      const dx = carPos.x - ped.group.position.x;
      const dz = carPos.z - ped.group.position.z;
      const distSq = dx * dx + dz * dz;

      // Check if car touched pedestrian at any noticeable speed
      if (distSq < hitRadius * hitRadius) {
        ped.knockdown();
        this.totalPedestrianHits++;

        // Slight speed loss to car on impact
        car.speed *= 0.65;

        const penalty = 50.0; // Deduct $50 fine

        if (audio) {
          audio.playPedestrianHitSound();
        }

        return {
          hit: true,
          penalty,
          message: `⚠️ PEDESTRIAN HIT! -$${penalty.toFixed(2)} FINE DEDUCTED`
        };
      }
    }

    return null;
  }

  /**
   * Updates all realistic pedestrians with reactive car avoidance.
   * @param {number} delta
   * @param {import('../gameplay/Car.js').Car} [playerCar]
   * @param {import('../core/AudioManager.js').AudioManager} [audio]
   */
  update(delta, playerCar, audio) {
    for (const ped of this.pedestrians) {
      ped.update(delta, playerCar, audio);
    }
  }
}
