import * as THREE from 'three';

/**
 * Pedestrian represents an autonomous walking citizen on the city sidewalks.
 * Features animated walking limbs, collision with car, and knockdown ragdoll fall.
 */
class Pedestrian {
  constructor(scene, sidewalkX, sidewalkZ, direction, streetLength, isHorizontal) {
    this.scene = scene;
    this.startX = sidewalkX;
    this.startZ = sidewalkZ;
    this.direction = direction; // 1 or -1
    this.streetLength = streetLength;
    this.isHorizontal = isHorizontal;

    this.speed = 1.6 + Math.random() * 0.8; // Walk speed m/s
    this.state = 'WALKING'; // 'WALKING' | 'FALLEN' | 'RECOVERING'
    this.fallTimer = 0;
    this.walkAnimTime = Math.random() * 10;

    // Pick vibrant, joyful clothes colors
    const shirtColors = [
      0xef4444, // Red
      0x3b82f6, // Vibrant Blue
      0x10b981, // Emerald Green
      0xf59e0b, // Amber
      0x8b5cf6, // Violet
      0xec4899, // Hot Pink
      0x06b6d4, // Cyan
      0x84cc16  // Lime
    ];
    this.shirtColor = shirtColors[Math.floor(Math.random() * shirtColors.length)];

    this.group = new THREE.Group();
    this.group.position.set(sidewalkX, 0.35, sidewalkZ);
    this._buildMesh();
    this.scene.add(this.group);
  }

  _buildMesh() {
    // 1. Torso
    const torsoGeo = new THREE.BoxGeometry(0.55, 0.75, 0.35);
    const torsoMat = new THREE.MeshStandardMaterial({
      color: this.shirtColor,
      roughness: 0.6
    });
    this.torso = new THREE.Mesh(torsoGeo, torsoMat);
    this.torso.position.y = 1.05;
    this.torso.castShadow = true;
    this.group.add(this.torso);

    // 2. Head with hair
    const skinTones = [0xffd166, 0xe0ac69, 0xc68642, 0x8d5524];
    const skinColor = skinTones[Math.floor(Math.random() * skinTones.length)];
    const headGeo = new THREE.SphereGeometry(0.24, 8, 8);
    const headMat = new THREE.MeshStandardMaterial({ color: skinColor, roughness: 0.7 });
    this.head = new THREE.Mesh(headGeo, headMat);
    this.head.position.y = 1.62;
    this.group.add(this.head);

    // Hair / Cap
    const hairGeo = new THREE.BoxGeometry(0.35, 0.16, 0.35);
    const hairMat = new THREE.MeshStandardMaterial({
      color: Math.random() > 0.5 ? 0x1f2937 : 0xd97706,
      roughness: 0.9
    });
    const hair = new THREE.Mesh(hairGeo, hairMat);
    hair.position.y = 1.78;
    this.group.add(hair);

    // 3. Legs (Swinging anchors)
    const legMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.8 });
    const legGeo = new THREE.BoxGeometry(0.2, 0.7, 0.22);

    this.leftLegAnchor = new THREE.Group();
    this.leftLegAnchor.position.set(-0.16, 0.7, 0);
    const lLeg = new THREE.Mesh(legGeo, legMat);
    lLeg.position.y = -0.35;
    lLeg.castShadow = true;
    this.leftLegAnchor.add(lLeg);
    this.group.add(this.leftLegAnchor);

    this.rightLegAnchor = new THREE.Group();
    this.rightLegAnchor.position.set(0.16, 0.7, 0);
    const rLeg = new THREE.Mesh(legGeo, legMat);
    rLeg.position.y = -0.35;
    rLeg.castShadow = true;
    this.rightLegAnchor.add(rLeg);
    this.group.add(this.rightLegAnchor);

    // 4. Arms
    const armMat = new THREE.MeshStandardMaterial({ color: this.shirtColor, roughness: 0.6 });
    const armGeo = new THREE.BoxGeometry(0.15, 0.6, 0.15);

    this.leftArmAnchor = new THREE.Group();
    this.leftArmAnchor.position.set(-0.35, 1.35, 0);
    const lArm = new THREE.Mesh(armGeo, armMat);
    lArm.position.y = -0.3;
    this.leftArmAnchor.add(lArm);
    this.group.add(this.leftArmAnchor);

    this.rightArmAnchor = new THREE.Group();
    this.rightArmAnchor.position.set(0.35, 1.35, 0);
    const rArm = new THREE.Mesh(armGeo, armMat);
    rArm.position.y = -0.3;
    this.rightArmAnchor.add(rArm);
    this.group.add(this.rightArmAnchor);

    // Orient in walking direction
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
   * Knocks the pedestrian down onto the ground when hit by car.
   */
  knockdown() {
    if (this.state === 'FALLEN') return;

    this.state = 'FALLEN';
    this.fallTimer = 5.0; // Seconds to stay down before getting up

    // Dramatic sideways / backward fall tilt
    this.group.rotation.x = -Math.PI / 2.2;
    this.group.position.y = 0.45;
  }

  /**
   * Updates pedestrian movement, walk cycle, and recovery.
   * @param {number} delta
   */
  update(delta) {
    if (this.state === 'FALLEN') {
      this.fallTimer -= delta;
      if (this.fallTimer <= 0) {
        // Recover and stand back up
        this.state = 'WALKING';
        this.group.position.y = 0.35;
        this.group.rotation.x = 0;
        this.group.rotation.z = 0;
        this._updateRotation();
      }
      return;
    }

    // Walking movement along sidewalk
    this.walkAnimTime += delta * 6 * (this.speed / 2.0);

    const moveDist = this.speed * this.direction * delta;
    if (this.isHorizontal) {
      this.group.position.x += moveDist;
      // Bounce back at end of street block
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

    // Walking animation: swinging limbs
    const swingAngle = Math.sin(this.walkAnimTime) * 0.6;
    this.leftLegAnchor.rotation.x = swingAngle;
    this.rightLegAnchor.rotation.x = -swingAngle;
    this.leftArmAnchor.rotation.x = -swingAngle * 0.8;
    this.rightArmAnchor.rotation.x = swingAngle * 0.8;
  }
}

/**
 * PedestrianSystem manages city crowds walking on sidewalks,
 * detects vehicle collisions, and issues cash fines.
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

    for (let ix = 0; ix < this.roadNetwork.gridSizeX - 1; ix++) {
      for (let iz = 0; iz < this.roadNetwork.gridSizeZ - 1; iz++) {
        const x1 = ix * spacing - this.roadNetwork.halfSizeX;
        const z1 = iz * spacing - this.roadNetwork.halfSizeZ;
        const blockCenterX = x1 + spacing / 2;
        const blockCenterZ = z1 + spacing / 2;

        // Spawn 2 pedestrians per city block on opposite sidewalks
        const pedA = new Pedestrian(
          this.scene,
          blockCenterX + (Math.random() - 0.5) * (blockLength * 0.6),
          blockCenterZ - sidewalkOffset,
          Math.random() > 0.5 ? 1 : -1,
          blockLength,
          true
        );
        this.pedestrians.push(pedA);

        const pedB = new Pedestrian(
          this.scene,
          blockCenterX + sidewalkOffset,
          blockCenterZ + (Math.random() - 0.5) * (blockLength * 0.6),
          Math.random() > 0.5 ? 1 : -1,
          blockLength,
          false
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
      if (ped.state === 'FALLEN') continue;

      const dx = carPos.x - ped.group.position.x;
      const dz = carPos.z - ped.group.position.z;
      const distSq = dx * dx + dz * dz;

      // Check if car touched pedestrian at any noticeable speed
      if (distSq < hitRadius * hitRadius) {
        ped.knockdown();
        this.totalPedestrianHits++;

        // Slight speed loss to car
        car.speed *= 0.7;

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
   * Updates all walking pedestrians.
   * @param {number} delta
   */
  update(delta) {
    for (const ped of this.pedestrians) {
      ped.update(delta);
    }
  }
}
