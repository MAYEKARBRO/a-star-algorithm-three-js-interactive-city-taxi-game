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
   * Constructs the high-detail 3D Taxi Car model with aerodynamic sculpting,
   * detailed cockpit, sport wheels with brake calipers, composite lights, and NYC plates.
   */
  _buildCarModel() {
    // Car Body Container (for suspension roll & pitch tilt)
    this.bodyContainer = new THREE.Group();
    this.carGroup.add(this.bodyContainer);

    // Shared Materials
    this.bodyMaterial = new THREE.MeshStandardMaterial({
      color: 0xffb703,
      metalness: 0.75,
      roughness: 0.22
    });

    const darkTrimMat = new THREE.MeshStandardMaterial({
      color: 0x111827,
      roughness: 0.35,
      metalness: 0.75
    });

    const carbonMat = new THREE.MeshStandardMaterial({
      color: 0x18181b,
      roughness: 0.5,
      metalness: 0.8
    });

    const chromeMat = new THREE.MeshStandardMaterial({
      color: 0xf1f5f9,
      metalness: 0.95,
      roughness: 0.08
    });

    const glassMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      roughness: 0.05,
      metalness: 0.92,
      transparent: true,
      opacity: 0.65
    });

    // 1. Lower Main Body Chassis
    const bodyGeo = new THREE.BoxGeometry(2.1, 0.58, 4.3);
    const bodyMesh = new THREE.Mesh(bodyGeo, this.bodyMaterial);
    bodyMesh.position.y = 0.55;
    bodyMesh.castShadow = true;
    bodyMesh.receiveShadow = true;
    this.bodyContainer.add(bodyMesh);

    // 2. Sculpted Hood / Bonnet with Aerodynamic Bulge & Heat Vents
    const hoodGeo = new THREE.BoxGeometry(1.85, 0.14, 1.45);
    const hoodMesh = new THREE.Mesh(hoodGeo, this.bodyMaterial);
    hoodMesh.position.set(0, 0.82, 1.05);
    hoodMesh.castShadow = true;
    this.bodyContainer.add(hoodMesh);

    // Hood Power Bulge (Center Spine)
    const bulgeGeo = new THREE.BoxGeometry(0.75, 0.06, 1.15);
    const bulgeMesh = new THREE.Mesh(bulgeGeo, this.bodyMaterial);
    bulgeMesh.position.set(0, 0.9, 1.05);
    this.bodyContainer.add(bulgeMesh);

    // Twin Black Metallic Heat Extractor Hood Vents
    const ventGeo = new THREE.BoxGeometry(0.28, 0.02, 0.45);
    const ventL = new THREE.Mesh(ventGeo, carbonMat);
    ventL.position.set(-0.52, 0.9, 1.05);
    this.bodyContainer.add(ventL);

    const ventR = new THREE.Mesh(ventGeo, carbonMat);
    ventR.position.set(0.52, 0.9, 1.05);
    this.bodyContainer.add(ventR);

    // 3. Front Bumper, Radiator Grille & Carbon Chin Splitter
    const bumperGeo = new THREE.BoxGeometry(2.05, 0.36, 0.45);
    const bumperMesh = new THREE.Mesh(bumperGeo, this.bodyMaterial);
    bumperMesh.position.set(0, 0.42, 2.22);
    this.bodyContainer.add(bumperMesh);

    // Lower Front Chin Splitter (Carbon Fiber)
    const splitterGeo = new THREE.BoxGeometry(2.18, 0.06, 0.52);
    const splitter = new THREE.Mesh(splitterGeo, carbonMat);
    splitter.position.set(0, 0.22, 2.28);
    this.bodyContainer.add(splitter);

    // Splitter Winglet Endplates
    const wingletGeo = new THREE.BoxGeometry(0.06, 0.16, 0.35);
    const wingletL = new THREE.Mesh(wingletGeo, carbonMat);
    wingletL.position.set(-1.08, 0.29, 2.28);
    this.bodyContainer.add(wingletL);
    const wingletR = new THREE.Mesh(wingletGeo, carbonMat);
    wingletR.position.set(1.08, 0.29, 2.28);
    this.bodyContainer.add(wingletR);

    // Honeycomb Radiator Grille
    const grilleGeo = new THREE.BoxGeometry(1.3, 0.26, 0.08);
    const grilleMesh = new THREE.Mesh(grilleGeo, darkTrimMat);
    grilleMesh.position.set(0, 0.5, 2.42);
    this.bodyContainer.add(grilleMesh);

    // Chrome Grille Frame
    const gFrameGeo = new THREE.BoxGeometry(1.36, 0.3, 0.04);
    const gFrame = new THREE.Mesh(gFrameGeo, chromeMat);
    gFrame.position.set(0, 0.5, 2.4);
    this.bodyContainer.add(gFrame);

    // Taxi Medallion Shield Badge on Grille
    const medallionGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.04, 8);
    medallionGeo.rotateX(Math.PI / 2);
    const medallionMat = new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.9, roughness: 0.1 });
    const medallion = new THREE.Mesh(medallionGeo, medallionMat);
    medallion.position.set(0, 0.52, 2.47);
    this.bodyContainer.add(medallion);

    // 4. NYC Taxi License Plates (Front & Rear)
    const plateCanvas = document.createElement('canvas');
    plateCanvas.width = 128;
    plateCanvas.height = 64;
    const pCtx = plateCanvas.getContext('2d');
    pCtx.fillStyle = '#f8fafc';
    pCtx.fillRect(0, 0, 128, 64);
    pCtx.strokeStyle = '#0284c7';
    pCtx.lineWidth = 4;
    pCtx.strokeRect(4, 4, 120, 56);
    pCtx.fillStyle = '#0284c7';
    pCtx.font = 'bold 12px sans-serif';
    pCtx.textAlign = 'center';
    pCtx.fillText('NEW YORK', 64, 16);
    pCtx.fillStyle = '#0f172a';
    pCtx.font = 'bold 24px monospace';
    pCtx.fillText('TAXI-NYC', 64, 42);
    const plateTex = new THREE.CanvasTexture(plateCanvas);
    const plateMat = new THREE.MeshBasicMaterial({ map: plateTex });

    const plateGeo = new THREE.PlaneGeometry(0.55, 0.24);
    const frontPlate = new THREE.Mesh(plateGeo, plateMat);
    frontPlate.position.set(0, 0.32, 2.46);
    this.bodyContainer.add(frontPlate);

    const rearPlate = new THREE.Mesh(plateGeo, plateMat);
    rearPlate.position.set(0, 0.44, -2.26);
    rearPlate.rotateY(Math.PI);
    this.bodyContainer.add(rearPlate);

    // 5. Composite Headlights & Fog Lights
    const hlHousingGeo = new THREE.BoxGeometry(0.42, 0.16, 0.12);
    const hlLeftHousing = new THREE.Mesh(hlHousingGeo, darkTrimMat);
    hlLeftHousing.position.set(-0.72, 0.62, 2.26);
    this.bodyContainer.add(hlLeftHousing);
    const hlRightHousing = new THREE.Mesh(hlHousingGeo, darkTrimMat);
    hlRightHousing.position.set(0.72, 0.62, 2.26);
    this.bodyContainer.add(hlRightHousing);

    // Dual Projector LED Globes
    const projectorGeo = new THREE.SphereGeometry(0.065, 8, 8);
    const projectorMat = new THREE.MeshBasicMaterial({ color: 0xe0f2fe });
    const drlMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });

    [-0.8, -0.64, 0.64, 0.8].forEach(px => {
      const proj = new THREE.Mesh(projectorGeo, projectorMat);
      proj.position.set(px, 0.61, 2.33);
      this.bodyContainer.add(proj);
    });

    // Sleek LED DRL Eyebrow Strips
    const drlGeo = new THREE.BoxGeometry(0.38, 0.03, 0.05);
    const drlL = new THREE.Mesh(drlGeo, drlMat);
    drlL.position.set(-0.72, 0.69, 2.31);
    this.bodyContainer.add(drlL);
    const drlR = new THREE.Mesh(drlGeo, drlMat);
    drlR.position.set(0.72, 0.69, 2.31);
    this.bodyContainer.add(drlR);

    // Lower Bumper Corner Fog Lights (Warm Amber)
    const fogGeo = new THREE.BoxGeometry(0.22, 0.08, 0.05);
    const fogMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
    const fogL = new THREE.Mesh(fogGeo, fogMat);
    fogL.position.set(-0.82, 0.34, 2.42);
    this.bodyContainer.add(fogL);
    const fogR = new THREE.Mesh(fogGeo, fogMat);
    fogR.position.set(0.82, 0.34, 2.42);
    this.bodyContainer.add(fogR);

    // Real spotlights projecting ahead
    this.headlightSpotLeft = new THREE.SpotLight(0xfff4e6, 2.8, 50, Math.PI / 5, 0.35, 1.5);
    this.headlightSpotLeft.position.set(-0.72, 0.62, 2.3);
    this.headlightSpotLeft.target.position.set(-0.72, 0, 22);
    this.bodyContainer.add(this.headlightSpotLeft);
    this.bodyContainer.add(this.headlightSpotLeft.target);

    this.headlightSpotRight = new THREE.SpotLight(0xfff4e6, 2.8, 50, Math.PI / 5, 0.35, 1.5);
    this.headlightSpotRight.position.set(0.72, 0.62, 2.3);
    this.headlightSpotRight.target.position.set(0.72, 0, 22);
    this.bodyContainer.add(this.headlightSpotRight);
    this.bodyContainer.add(this.headlightSpotRight.target);

    // 6. Dual Side Aero Wing Mirrors with Reflective Glass & Indicator Strips
    const mirrorStemGeo = new THREE.CylinderGeometry(0.025, 0.035, 0.22, 6);
    mirrorStemGeo.rotateZ(Math.PI / 3);
    const mirrorHousingGeo = new THREE.BoxGeometry(0.16, 0.14, 0.24);
    const mirrorGlassGeo = new THREE.PlaneGeometry(0.12, 0.2);
    const amberIndicatorMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });

    // Left Wing Mirror
    const stemL = new THREE.Mesh(mirrorStemGeo, darkTrimMat);
    stemL.position.set(-1.08, 0.98, 0.72);
    this.bodyContainer.add(stemL);
    const housingL = new THREE.Mesh(mirrorHousingGeo, this.bodyMaterial);
    housingL.position.set(-1.18, 1.04, 0.72);
    this.bodyContainer.add(housingL);
    const glassL = new THREE.Mesh(mirrorGlassGeo, chromeMat);
    glassL.position.set(-1.1, 1.04, 0.72);
    glassL.rotateY(-Math.PI / 2);
    this.bodyContainer.add(glassL);
    const indL = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.04, 0.16), amberIndicatorMat);
    indL.position.set(-1.27, 1.04, 0.72);
    this.bodyContainer.add(indL);

    // Right Wing Mirror
    const stemR = new THREE.Mesh(mirrorStemGeo, darkTrimMat);
    stemR.position.set(1.08, 0.98, 0.72);
    stemR.rotateZ(-Math.PI * 2 / 3);
    this.bodyContainer.add(stemR);
    const housingR = new THREE.Mesh(mirrorHousingGeo, this.bodyMaterial);
    housingR.position.set(1.18, 1.04, 0.72);
    this.bodyContainer.add(housingR);
    const glassR = new THREE.Mesh(mirrorGlassGeo, chromeMat);
    glassR.position.set(1.1, 1.04, 0.72);
    glassR.rotateY(Math.PI / 2);
    this.bodyContainer.add(glassR);
    const indR = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.04, 0.16), amberIndicatorMat);
    indR.position.set(1.27, 1.04, 0.72);
    this.bodyContainer.add(indR);

    // 7. Side Skirts & Recessed Door Handles
    const skirtGeo = new THREE.BoxGeometry(0.08, 0.14, 2.9);
    const skirtL = new THREE.Mesh(skirtGeo, carbonMat);
    skirtL.position.set(-1.07, 0.28, 0);
    this.bodyContainer.add(skirtL);
    const skirtR = new THREE.Mesh(skirtGeo, carbonMat);
    skirtR.position.set(1.07, 0.28, 0);
    this.bodyContainer.add(skirtR);

    // Metallic Door Handles
    const handleGeo = new THREE.BoxGeometry(0.04, 0.05, 0.22);
    [-0.45, 0.35].forEach(hz => {
      const hL = new THREE.Mesh(handleGeo, chromeMat);
      hL.position.set(-1.07, 0.78, hz);
      this.bodyContainer.add(hL);
      const hR = new THREE.Mesh(handleGeo, chromeMat);
      hR.position.set(1.07, 0.78, hz);
      this.bodyContainer.add(hR);
    });

    // 8. Checkered NYC Taxi Side Decals
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

    // 9. Cabin Greenhouse & Tinted Glass Windows
    // Roof Frame
    const roofGeo = new THREE.BoxGeometry(1.68, 0.08, 2.2);
    const roofMesh = new THREE.Mesh(roofGeo, darkTrimMat);
    roofMesh.position.set(0, 1.48, -0.22);
    this.bodyContainer.add(roofMesh);

    // Tinted Panoramic Moonroof Glass Panel
    const moonroofGeo = new THREE.PlaneGeometry(1.3, 1.6);
    moonroofGeo.rotateX(-Math.PI / 2);
    const moonroof = new THREE.Mesh(moonroofGeo, glassMat);
    moonroof.position.set(0, 1.53, -0.22);
    this.bodyContainer.add(moonroof);

    // Sloped Front Windshield
    const frontWindshieldGeo = new THREE.PlaneGeometry(1.64, 0.76);
    const frontWindshield = new THREE.Mesh(frontWindshieldGeo, glassMat);
    frontWindshield.position.set(0, 1.18, 0.78);
    frontWindshield.rotateX(0.38);
    this.bodyContainer.add(frontWindshield);

    // Sloped Rear Windshield
    const rearWindshieldGeo = new THREE.PlaneGeometry(1.64, 0.74);
    const rearWindshield = new THREE.Mesh(rearWindshieldGeo, glassMat);
    rearWindshield.position.set(0, 1.18, -1.22);
    rearWindshield.rotateX(-0.4);
    this.bodyContainer.add(rearWindshield);

    // Side Cabin Windows
    const sideWinGeo = new THREE.PlaneGeometry(2.0, 0.52);
    const winLeft = new THREE.Mesh(sideWinGeo, glassMat);
    winLeft.position.set(-0.85, 1.2, -0.22);
    winLeft.rotateY(-Math.PI / 2);
    this.bodyContainer.add(winLeft);

    const winRight = new THREE.Mesh(sideWinGeo, glassMat);
    winRight.position.set(0.85, 1.2, -0.22);
    winRight.rotateY(Math.PI / 2);
    this.bodyContainer.add(winRight);

    // Cabin Structural Pillars (A, B, C Pillars)
    const pillarMat = darkTrimMat;
    const aPillarGeo = new THREE.BoxGeometry(0.08, 0.72, 0.08);
    const apL = new THREE.Mesh(aPillarGeo, pillarMat);
    apL.position.set(-0.84, 1.18, 0.72);
    apL.rotateX(0.35);
    this.bodyContainer.add(apL);
    const apR = new THREE.Mesh(aPillarGeo, pillarMat);
    apR.position.set(0.84, 1.18, 0.72);
    apR.rotateX(0.35);
    this.bodyContainer.add(apR);

    const bPillarGeo = new THREE.BoxGeometry(0.08, 0.55, 0.1);
    const bpL = new THREE.Mesh(bPillarGeo, pillarMat);
    bpL.position.set(-0.86, 1.2, -0.15);
    this.bodyContainer.add(bpL);
    const bpR = new THREE.Mesh(bPillarGeo, pillarMat);
    bpR.position.set(0.86, 1.2, -0.15);
    this.bodyContainer.add(bpR);

    // 10. Cockpit Interior (Dashboard, Steering Wheel, Bucket Seats, Heads-up Display)
    const dashGeo = new THREE.BoxGeometry(1.58, 0.3, 0.55);
    const dashMat = new THREE.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.9 });
    const dash = new THREE.Mesh(dashGeo, dashMat);
    dash.position.set(0, 0.94, 0.55);
    this.bodyContainer.add(dash);

    // Illuminated Speedometer Gauge Cluster Glow
    const gaugeGeo = new THREE.PlaneGeometry(0.35, 0.12);
    const gaugeMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
    const gauge = new THREE.Mesh(gaugeGeo, gaugeMat);
    gauge.position.set(-0.42, 1.02, 0.38);
    gauge.rotateX(-0.3);
    this.bodyContainer.add(gauge);

    // Center Console GPS Screen Glow
    const navScreenGeo = new THREE.PlaneGeometry(0.24, 0.16);
    const navScreenMat = new THREE.MeshBasicMaterial({ color: 0x10b981 });
    const navScreen = new THREE.Mesh(navScreenGeo, navScreenMat);
    navScreen.position.set(0, 0.98, 0.38);
    navScreen.rotateX(-0.3);
    this.bodyContainer.add(navScreen);

    // 3-Spoke Sport Steering Wheel
    const wheelTorusGeo = new THREE.TorusGeometry(0.16, 0.024, 8, 16);
    const steerMat = new THREE.MeshStandardMaterial({ color: 0x111827, metalness: 0.8 });
    const steerMesh = new THREE.Mesh(wheelTorusGeo, steerMat);
    steerMesh.position.set(-0.42, 1.05, 0.3);
    steerMesh.rotateX(0.4);
    this.bodyContainer.add(steerMesh);

    // Driver & Passenger Sport Bucket Seats
    const seatMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.8 });
    const seatBaseGeo = new THREE.BoxGeometry(0.5, 0.2, 0.5);
    const seatBackGeo = new THREE.BoxGeometry(0.48, 0.55, 0.16);
    const headrestGeo = new THREE.BoxGeometry(0.25, 0.16, 0.12);

    [-0.42, 0.42].forEach(sx => {
      const sBase = new THREE.Mesh(seatBaseGeo, seatMat);
      sBase.position.set(sx, 0.72, -0.05);
      this.bodyContainer.add(sBase);

      const sBack = new THREE.Mesh(seatBackGeo, seatMat);
      sBack.position.set(sx, 1.05, -0.25);
      sBack.rotateX(0.12);
      this.bodyContainer.add(sBack);

      const hRest = new THREE.Mesh(headrestGeo, seatMat);
      hRest.position.set(sx, 1.35, -0.28);
      this.bodyContainer.add(hRest);
    });

    // Rearview Mirror
    const rvmGeo = new THREE.BoxGeometry(0.24, 0.08, 0.04);
    const rvm = new THREE.Mesh(rvmGeo, chromeMat);
    rvm.position.set(0, 1.36, 0.62);
    this.bodyContainer.add(rvm);

    // 11. Rear Trunk Lid & Aerodynamic Lip Spoiler
    const trunkGeo = new THREE.BoxGeometry(1.82, 0.16, 1.1);
    const trunkMesh = new THREE.Mesh(trunkGeo, this.bodyMaterial);
    trunkMesh.position.set(0, 0.78, -1.55);
    this.bodyContainer.add(trunkMesh);

    // Carbon Lip Spoiler with Twin Stanchions
    const spoilerGeo = new THREE.BoxGeometry(1.88, 0.06, 0.26);
    const spoiler = new THREE.Mesh(spoilerGeo, carbonMat);
    spoiler.position.set(0, 0.94, -2.06);
    this.bodyContainer.add(spoiler);

    const stanchionGeo = new THREE.BoxGeometry(0.05, 0.12, 0.15);
    const stanL = new THREE.Mesh(stanchionGeo, carbonMat);
    stanL.position.set(-0.55, 0.86, -2.06);
    this.bodyContainer.add(stanL);
    const stanR = new THREE.Mesh(stanchionGeo, carbonMat);
    stanR.position.set(0.55, 0.86, -2.06);
    this.bodyContainer.add(stanR);

    // 12. Rear Bumper with Lower Race Diffuser
    const rearBumperGeo = new THREE.BoxGeometry(2.05, 0.38, 0.35);
    const rearBumper = new THREE.Mesh(rearBumperGeo, this.bodyMaterial);
    rearBumper.position.set(0, 0.42, -2.18);
    this.bodyContainer.add(rearBumper);

    // Carbon Diffuser with Vertical Aerodynamic Fins
    const diffuserGeo = new THREE.BoxGeometry(1.7, 0.12, 0.3);
    const diffuser = new THREE.Mesh(diffuserGeo, carbonMat);
    diffuser.position.set(0, 0.22, -2.2);
    this.bodyContainer.add(diffuser);

    const finGeo = new THREE.BoxGeometry(0.04, 0.14, 0.25);
    [-0.4, -0.15, 0.15, 0.4].forEach(fx => {
      const fin = new THREE.Mesh(finGeo, carbonMat);
      fin.position.set(fx, 0.22, -2.22);
      this.bodyContainer.add(fin);
    });

    // Twin Dual-Chrome Exhaust Tips
    const pipeGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.22, 12);
    pipeGeo.rotateX(Math.PI / 2);
    [-0.72, -0.6, 0.6, 0.72].forEach(px => {
      const pipe = new THREE.Mesh(pipeGeo, chromeMat);
      pipe.position.set(px, 0.3, -2.26);
      this.bodyContainer.add(pipe);
    });

    // 13. Modern Full-Width LED Taillight Bar
    const tlBarGeo = new THREE.BoxGeometry(1.9, 0.12, 0.06);
    const tlMat = new THREE.MeshStandardMaterial({
      color: 0xff0033,
      emissive: 0xff0033,
      emissiveIntensity: 0.65
    });
    const tlBar = new THREE.Mesh(tlBarGeo, tlMat);
    tlBar.position.set(0, 0.64, -2.21);
    this.bodyContainer.add(tlBar);
    this.taillightMeshes.push(tlBar);

    // Corner Taillight Modules
    const tlLeft = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.15, 0.06), tlMat);
    tlLeft.position.set(-0.72, 0.64, -2.22);
    this.bodyContainer.add(tlLeft);
    this.taillightMeshes.push(tlLeft);

    const tlRight = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.15, 0.06), tlMat);
    tlRight.position.set(0.72, 0.64, -2.22);
    this.bodyContainer.add(tlRight);
    this.taillightMeshes.push(tlRight);

    // Reversing Backup Light Strip
    const reverseGeo = new THREE.BoxGeometry(0.4, 0.04, 0.04);
    const reverseMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const revL = new THREE.Mesh(reverseGeo, reverseMat);
    revL.position.set(-0.4, 0.54, -2.22);
    this.bodyContainer.add(revL);
    const revR = new THREE.Mesh(reverseGeo, reverseMat);
    revR.position.set(0.4, 0.54, -2.22);
    this.bodyContainer.add(revR);

    // 14. Rooftop Aerodynamic TAXI Medallion Sign
    const signGeo = new THREE.BoxGeometry(0.95, 0.26, 0.4);
    const signMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0xffb703,
      emissiveIntensity: 0.85
    });
    this.signMesh = new THREE.Mesh(signGeo, signMat);
    this.signMesh.position.set(0, 1.65, -0.22);
    this.bodyContainer.add(this.signMesh);

    // Rooftop Sign Status Beacon Lamps (Green/Amber)
    const signBeaconGeo = new THREE.SphereGeometry(0.05, 6, 6);
    const beaconL = new THREE.Mesh(signBeaconGeo, new THREE.MeshBasicMaterial({ color: 0x10b981 }));
    beaconL.position.set(-0.44, 1.8, -0.22);
    this.bodyContainer.add(beaconL);
    const beaconR = new THREE.Mesh(signBeaconGeo, new THREE.MeshBasicMaterial({ color: 0xf59e0b }));
    beaconR.position.set(0.44, 1.8, -0.22);
    this.bodyContainer.add(beaconR);

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

    // 15. High-Detail Wheels with Sport 5-Spoke Rims & Red Brake Calipers
    this.frontLeftWheel = this._createWheel(-1.08, 0.38, 1.35, true);
    this.frontRightWheel = this._createWheel(1.08, 0.38, 1.35, true);
    this.rearLeftWheel = this._createWheel(-1.08, 0.38, -1.35, false);
    this.rearRightWheel = this._createWheel(1.08, 0.38, -1.35, false);
  }

  /**
   * Creates a detailed sport wheel with rubber tire, 5-spoke alloy rim,
   * ventilated brake rotor, and red sports brake caliper.
   */
  _createWheel(x, y, z, isFront) {
    const wheelAnchor = new THREE.Group();
    wheelAnchor.position.set(x, y, z);
    this.carGroup.add(wheelAnchor);

    // Wheel spin container (rotates with forward velocity)
    const spinGroup = new THREE.Group();
    wheelAnchor.add(spinGroup);

    // 1. Rubber Tire with Tread Profile
    const tireGeo = new THREE.CylinderGeometry(0.38, 0.38, 0.32, 20);
    tireGeo.rotateZ(Math.PI / 2);
    const tireMat = new THREE.MeshStandardMaterial({
      color: 0x141416,
      roughness: 0.92,
      metalness: 0.1
    });
    const tireMesh = new THREE.Mesh(tireGeo, tireMat);
    tireMesh.castShadow = true;
    spinGroup.add(tireMesh);

    // Tire Tread Ridge Ring
    const treadGeo = new THREE.TorusGeometry(0.375, 0.04, 8, 24);
    treadGeo.rotateY(Math.PI / 2);
    const treadMesh = new THREE.Mesh(treadGeo, tireMat);
    spinGroup.add(treadMesh);

    // 2. Silver Outer Alloy Rim Barrel
    const rimGeo = new THREE.CylinderGeometry(0.26, 0.26, 0.33, 16);
    rimGeo.rotateZ(Math.PI / 2);
    const rimMat = new THREE.MeshStandardMaterial({
      color: 0xd4d4d8,
      metalness: 0.9,
      roughness: 0.15
    });
    const rimMesh = new THREE.Mesh(rimGeo, rimMat);
    spinGroup.add(rimMesh);

    // 3. Center Hub Cap with Lug Bolts
    const hubGeo = new THREE.CylinderGeometry(0.09, 0.09, 0.34, 8);
    hubGeo.rotateZ(Math.PI / 2);
    const hubMat = new THREE.MeshStandardMaterial({ color: 0x18181b, metalness: 0.8 });
    const hubMesh = new THREE.Mesh(hubGeo, hubMat);
    spinGroup.add(hubMesh);

    // 5-Spoke Star Alloy Geometry
    const spokeMat = new THREE.MeshStandardMaterial({
      color: 0xe4e4e7,
      metalness: 0.92,
      roughness: 0.12
    });
    const spokeGeo = new THREE.BoxGeometry(0.34, 0.04, 0.07);

    for (let i = 0; i < 5; i++) {
      const angle = (i * Math.PI * 2) / 5;
      const spoke = new THREE.Mesh(spokeGeo, spokeMat);
      spoke.position.set((x > 0 ? 0.15 : -0.15), Math.sin(angle) * 0.13, Math.cos(angle) * 0.13);
      spoke.rotation.x = angle;
      spinGroup.add(spoke);
    }

    // 4. Ventilated Metallic Brake Rotor (Stationary relative to spin, turns with steering)
    const rotorGeo = new THREE.CylinderGeometry(0.23, 0.23, 0.04, 16);
    rotorGeo.rotateZ(Math.PI / 2);
    const rotorMat = new THREE.MeshStandardMaterial({
      color: 0xa1a1aa,
      metalness: 0.95,
      roughness: 0.25
    });
    const rotorMesh = new THREE.Mesh(rotorGeo, rotorMat);
    rotorMesh.position.set(x > 0 ? -0.06 : 0.06, 0, 0);
    wheelAnchor.add(rotorMesh);

    // 5. Bold Red Sport Brake Caliper
    const caliperGeo = new THREE.BoxGeometry(0.1, 0.14, 0.12);
    const caliperMat = new THREE.MeshStandardMaterial({
      color: 0xef4444,
      metalness: 0.7,
      roughness: 0.2
    });
    const caliperMesh = new THREE.Mesh(caliperGeo, caliperMat);
    caliperMesh.position.set(x > 0 ? -0.06 : 0.06, 0.15, 0.05);
    wheelAnchor.add(caliperMesh);

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
