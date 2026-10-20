import * as THREE from 'three';

/**
 * MonorailSystem adds an elevated high-speed metro monorail railway
 * curving 11 meters above city avenues with an automated bullet train.
 */
export class MonorailSystem {
  constructor(scene, roadNetwork) {
    this.scene = scene;
    this.roadNetwork = roadNetwork;

    this.group = new THREE.Group();
    this.scene.add(this.group);

    this.trainProgress = 0;
    this.trainSpeed = 0.035; // Loop progression speed

    this._buildTrackAndPillars();
    this._buildBulletTrain();
  }

  _buildTrackAndPillars() {
    const spacing = this.roadNetwork.spacing;
    const rX = this.roadNetwork.halfSizeX - spacing;
    const rZ = this.roadNetwork.halfSizeZ - spacing;

    // Curved loop track 11 meters high
    const trackPoints = [
      new THREE.Vector3(-rX, 11, -rZ),
      new THREE.Vector3(rX, 11, -rZ),
      new THREE.Vector3(rX, 11, rZ),
      new THREE.Vector3(-rX, 11, rZ)
    ];

    this.trackCurve = new THREE.CatmullRomCurve3(trackPoints, true, 'catmullrom', 0.25);

    // Concrete Track Beam
    const tubeGeo = new THREE.TubeGeometry(this.trackCurve, 80, 0.6, 8, true);
    const beamMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.7 });
    const beamMesh = new THREE.Mesh(tubeGeo, beamMat);
    beamMesh.castShadow = true;
    this.group.add(beamMesh);

    // Glowing Cyan Power Rail
    const railMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
    const railGeo = new THREE.TubeGeometry(this.trackCurve, 80, 0.15, 6, true);
    const railMesh = new THREE.Mesh(railGeo, railMat);
    this.group.add(railMesh);

    // Support Concrete Pillars placed along the track
    const pillarMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.8 });
    const pillarGeo = new THREE.CylinderGeometry(0.5, 0.7, 11, 8);

    for (let t = 0; t < 1.0; t += 0.08) {
      const p = this.trackCurve.getPointAt(t);
      const pillar = new THREE.Mesh(pillarGeo, pillarMat);
      pillar.position.set(p.x, 5.5, p.z);
      pillar.castShadow = true;
      this.group.add(pillar);
    }
  }

  _buildBulletTrain() {
    this.trainGroup = new THREE.Group();

    // 3 Connected Train Cars
    const carMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      metalness: 0.8,
      roughness: 0.2
    });

    const windowMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });

    for (let c = 0; c < 3; c++) {
      const carGroup = new THREE.Group();
      carGroup.position.z = c * 7.5;

      // Streamlined Car Body
      const bGeo = new THREE.BoxGeometry(2.2, 1.8, 6.8);
      const bMesh = new THREE.Mesh(bGeo, carMat);
      bMesh.position.y = 0.9;
      bMesh.castShadow = true;
      carGroup.add(bMesh);

      // Glowing Passenger Window Strips
      const wGeo = new THREE.PlaneGeometry(6.0, 0.6);

      const wLeft = new THREE.Mesh(wGeo, windowMat);
      wLeft.position.set(-1.12, 1.0, 0);
      wLeft.rotateY(-Math.PI / 2);
      carGroup.add(wLeft);

      const wRight = new THREE.Mesh(wGeo, windowMat);
      wRight.position.set(1.12, 1.0, 0);
      wRight.rotateY(Math.PI / 2);
      carGroup.add(wRight);

      // Front Headlights on lead car
      if (c === 0) {
        const hlGeo = new THREE.SphereGeometry(0.35, 8, 8);
        const hlMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const hl = new THREE.Mesh(hlGeo, hlMat);
        hl.position.set(0, 0.8, -3.42);
        carGroup.add(hl);
      }

      this.trainGroup.add(carGroup);
    }

    this.group.add(this.trainGroup);
  }

  /**
   * Updates monorail train movement along the curved overhead track loop.
   * @param {number} delta
   */
  update(delta) {
    this.trainProgress = (this.trainProgress + this.trainSpeed * delta) % 1.0;

    const trainPos = this.trackCurve.getPointAt(this.trainProgress);
    const lookAtPos = this.trackCurve.getPointAt((this.trainProgress + 0.01) % 1.0);

    this.trainGroup.position.copy(trainPos);
    this.trainGroup.lookAt(lookAtPos);
  }

  get trainMesh() {
    return this.trainGroup;
  }
}
