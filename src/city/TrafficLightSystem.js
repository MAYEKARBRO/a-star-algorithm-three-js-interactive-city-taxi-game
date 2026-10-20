import * as THREE from 'three';

/**
 * TrafficLightSystem operates 3-phase automated traffic signals at city intersections,
 * manages red/yellow/green lens illumination, and checks red-light violations.
 */
export class TrafficLightSystem {
  constructor(scene, roadNetwork) {
    this.scene = scene;
    this.roadNetwork = roadNetwork;

    this.group = new THREE.Group();
    this.scene.add(this.group);

    // Signals collection
    this.signals = [];

    // Cycle Timer:
    // Phase 0: NS Green, EW Red (11s)
    // Phase 1: NS Yellow, EW Red (3s)
    // Phase 2: NS Red, EW Green (11s)
    // Phase 3: NS Red, EW Yellow (3s)
    this.phase = 0;
    this.phaseTimer = 11.0;
    this.violationCooldown = 0;

    this._buildTrafficSignals();
  }

  _buildTrafficSignals() {
    const spacing = this.roadNetwork.spacing;
    const roadWidth = this.roadNetwork.getCityBounds().roadWidth;
    const offset = roadWidth / 2 + 1.2;

    const postMat = new THREE.MeshStandardMaterial({ color: 0x1f2937, metalness: 0.8 });

    // Place traffic light gantries at 9 central intersections
    for (let ix = 1; ix < this.roadNetwork.gridSizeX - 1; ix += 2) {
      for (let iz = 1; iz < this.roadNetwork.gridSizeZ - 1; iz += 2) {
        const cx = ix * spacing - this.roadNetwork.halfSizeX;
        const cz = iz * spacing - this.roadNetwork.halfSizeZ;

        // Create 2 diagonal signal posts per intersection
        const corners = [
          { x: cx + offset, z: cz + offset, rotY: Math.PI / 4 },
          { x: cx - offset, z: cz - offset, rotY: -Math.PI * 0.75 }
        ];

        for (const c of corners) {
          const poleGroup = new THREE.Group();
          poleGroup.position.set(c.x, 0, c.z);
          poleGroup.rotation.y = c.rotY;

          // Main vertical mast
          const mastGeo = new THREE.CylinderGeometry(0.18, 0.25, 7.5, 8);
          const mast = new THREE.Mesh(mastGeo, postMat);
          mast.position.y = 3.75;
          poleGroup.add(mast);

          // Horizontal arm overhanging the intersection
          const armGeo = new THREE.BoxGeometry(4.5, 0.18, 0.18);
          const arm = new THREE.Mesh(armGeo, postMat);
          arm.position.set(-2.0, 7.2, 0);
          poleGroup.add(arm);

          // North-South Signal Housing
          const nsHousing = this._createSignalHead();
          nsHousing.group.position.set(-3.2, 6.2, 0);
          poleGroup.add(nsHousing.group);

          // East-West Signal Housing (facing 90 deg perpendicular)
          const ewHousing = this._createSignalHead();
          ewHousing.group.position.set(-1.4, 6.2, 0);
          ewHousing.group.rotation.y = Math.PI / 2;
          poleGroup.add(ewHousing.group);

          this.group.add(poleGroup);
          this.signals.push({
            cx,
            cz,
            nsHousing,
            ewHousing
          });
        }
      }
    }
  }

  _createSignalHead() {
    const group = new THREE.Group();

    // Black housing box
    const boxGeo = new THREE.BoxGeometry(0.7, 1.8, 0.5);
    const boxMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.8 });
    const box = new THREE.Mesh(boxGeo, boxMat);
    group.add(box);

    // 3 Lenses: Red (top), Yellow (mid), Green (bot)
    const lensGeo = new THREE.SphereGeometry(0.22, 12, 12);

    const redMat = new THREE.MeshBasicMaterial({ color: 0x450a0a });
    const redMesh = new THREE.Mesh(lensGeo, redMat);
    redMesh.position.set(0, 0.55, 0.22);
    group.add(redMesh);

    const yelMat = new THREE.MeshBasicMaterial({ color: 0x451a03 });
    const yelMesh = new THREE.Mesh(lensGeo, yelMat);
    yelMesh.position.set(0, 0, 0.22);
    group.add(yelMesh);

    const grnMat = new THREE.MeshBasicMaterial({ color: 0x052e16 });
    const grnMesh = new THREE.Mesh(lensGeo, grnMat);
    grnMesh.position.set(0, -0.55, 0.22);
    group.add(grnMesh);

    return {
      group,
      redMesh, redMat,
      yelMesh, yelMat,
      grnMesh, grnMat,
      setState: (color) => {
        // Reset dims
        redMat.color.setHex(0x450a0a);
        yelMat.color.setHex(0x451a03);
        grnMat.color.setHex(0x052e16);

        if (color === 'RED') {
          redMat.color.setHex(0xff0033);
        } else if (color === 'YELLOW') {
          yelMat.color.setHex(0xfbbf24);
        } else if (color === 'GREEN') {
          grnMat.color.setHex(0x22c55e);
        }
      }
    };
  }

  /**
   * Returns current state for a given direction ('NS' or 'EW').
   * @param {'NS' | 'EW'} direction
   * @returns {'RED' | 'YELLOW' | 'GREEN'}
   */
  getStateForDirection(direction) {
    if (direction === 'NS') {
      if (this.phase === 0) return 'GREEN';
      if (this.phase === 1) return 'YELLOW';
      return 'RED';
    } else {
      if (this.phase === 2) return 'GREEN';
      if (this.phase === 3) return 'YELLOW';
      return 'RED';
    }
  }

  /**
   * Checks if player car blew through a red light at an intersection.
   * Deducts $5.00 per red light breach with a cooldown latch.
   * @param {import('../gameplay/Car.js').Car} car
   * @returns {{ violated: boolean, fine?: number, message?: string }}
   */
  checkRedLightViolation(car) {
    if (this.violationCooldown > 0) return { violated: false };
    if (Math.abs(car.speed) < 8) return { violated: false };

    // Determine direction from car heading
    const isNS = Math.abs(Math.sin(car.heading)) < 0.707;
    const activeColor = this.getStateForDirection(isNS ? 'NS' : 'EW');

    if (activeColor === 'RED') {
      // Check if inside any intersection box
      for (const sig of this.signals) {
        const dist = Math.hypot(car.position.x - sig.cx, car.position.z - sig.cz);
        if (dist < 10.0) {
          this.violationCooldown = 4.0; // 4s cooldown latch
          return {
            violated: true,
            fine: 5.0,
            message: '🚨 RED LIGHT RUNNER! -$5.00 FINE'
          };
        }
      }
    }

    return { violated: false };
  }

  /**
   * Updates traffic light phase cycles and lens lighting.
   * @param {number} delta
   */
  update(delta) {
    if (this.violationCooldown > 0) {
      this.violationCooldown -= delta;
    }

    this.phaseTimer -= delta;

    if (this.phaseTimer <= 0) {
      this.phase = (this.phase + 1) % 4;
      this.phaseTimer = (this.phase === 1 || this.phase === 3) ? 3.0 : 11.0;

      // Update signal lights
      const nsState = this.getStateForDirection('NS');
      const ewState = this.getStateForDirection('EW');

      for (const sig of this.signals) {
        sig.nsHousing.setState(nsState);
        sig.ewHousing.setState(ewState);
      }
    }
  }
}
