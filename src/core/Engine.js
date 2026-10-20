import * as THREE from 'three';

/**
 * Engine manages the Three.js WebGL scene, rendering pipeline, lighting,
 * atmospheric day/night cycles, and dynamic camera tracking.
 */
export class Engine {
  constructor(canvasContainer) {
    this.container = canvasContainer;

    // 1. Scene & Renderer
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0e17);

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.container.appendChild(this.renderer.domElement);

    // 2. Camera Setup
    this.camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.5,
      1200
    );
    this.camera.position.set(0, 15, -25);

    // Camera Modes: 'CHASE' | 'HOOD' | 'ORBIT'
    this.cameraMode = 'CHASE';
    this.cameraModes = ['CHASE', 'HOOD', 'ORBIT'];
    this.cameraModeIndex = 0;

    // Chase Camera parameters
    this.chaseOffset = new THREE.Vector3(0, 4.2, -9.5);
    this.chaseTargetOffset = new THREE.Vector3(0, 1.2, 4.0);
    this.currentCameraPos = new THREE.Vector3();
    this.currentCameraTarget = new THREE.Vector3();

    // Orbit Camera angles (for mouse/right stick)
    this.orbitTheta = 0;
    this.orbitPhi = 0.4;
    this.orbitDistance = 14;

    // On-Foot 3rd Person Pan Camera (GTA Style)
    this.onFootCamera = {
      yaw: 0,
      pitch: 0.26,
      distance: 5.2,
      height: 1.5,
      sensitivity: 2.2,
      manualCooldown: 0,
      backwardTimer: 0
    };

    // 3. Lighting Setup
    this._setupLighting();
    this._initRainParticles();
    this._initClouds();

    // 4. Time of Day Environment
    this.weatherMode = 'DAY'; // 'DAY' | 'SUNSET' | 'NIGHT' | 'RAIN'
    this.setWeather('DAY');

    // Resize listener
    window.addEventListener('resize', () => this._onWindowResize());
  }

  _setupLighting() {
    // Ambient / Hemisphere Light
    this.hemiLight = new THREE.HemisphereLight(0x7dd3fc, 0x1e293b, 1.0);
    this.scene.add(this.hemiLight);

    // Main Directional Light (Sun/Moon with shadows)
    this.dirLight = new THREE.DirectionalLight(0xfff7ed, 2.6);
    this.dirLight.position.set(70, 140, 70);
    this.dirLight.castShadow = true;
    this.dirLight.shadow.mapSize.width = 2048;
    this.dirLight.shadow.mapSize.height = 2048;
    this.dirLight.shadow.camera.near = 10;
    this.dirLight.shadow.camera.far = 450;
    this.dirLight.shadow.camera.left = -140;
    this.dirLight.shadow.camera.right = 140;
    this.dirLight.shadow.camera.top = 140;
    this.dirLight.shadow.camera.bottom = -140;
    this.dirLight.shadow.bias = -0.0004;
    this.scene.add(this.dirLight);

    // Secondary City Fill Light (Soft upward/lateral fill for illuminated roads & buildings)
    this.cityFillLight = new THREE.DirectionalLight(0x38bdf8, 1.2);
    this.cityFillLight.position.set(-80, 50, -80);
    this.scene.add(this.cityFillLight);

    // Atmospheric Fog (Gentle & soft)
    this.scene.fog = new THREE.FogExp2(0x1e293b, 0.0025);
  }

  _initRainParticles() {
    const rainCount = 1800;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(rainCount * 3);
    const velocities = new Float32Array(rainCount);

    for (let i = 0; i < rainCount; i++) {
      positions[i * 3 + 0] = (Math.random() - 0.5) * 140;
      positions[i * 3 + 1] = Math.random() * 45;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 140;
      velocities[i] = 30 + Math.random() * 25;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.rainVelocities = velocities;

    const material = new THREE.PointsMaterial({
      color: 0xbae6fd,
      size: 0.32,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending
    });

    this.rainParticles = new THREE.Points(geometry, material);
    this.rainParticles.visible = false;
    this.scene.add(this.rainParticles);
  }

  _initClouds() {
    this.cloudGroup = new THREE.Group();
    this.scene.add(this.cloudGroup);

    this.cloudMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.95,
      metalness: 0.05,
      flatShading: true,
      transparent: true,
      opacity: 0.92
    });

    this.clouds = [];
    const cloudCount = 28;

    for (let i = 0; i < cloudCount; i++) {
      const singleCloud = new THREE.Group();
      const puffCount = 5 + Math.floor(Math.random() * 5);
      const baseScale = 4.5 + Math.random() * 5.0;

      for (let j = 0; j < puffCount; j++) {
        const radius = (0.7 + Math.random() * 0.7) * baseScale;
        const puffGeo = new THREE.DodecahedronGeometry(radius, 1);
        const puffMesh = new THREE.Mesh(puffGeo, this.cloudMaterial);

        puffMesh.position.set(
          (j - puffCount / 2) * (baseScale * 0.85) + (Math.random() - 0.5) * 4,
          (Math.random() - 0.2) * (baseScale * 0.45),
          (Math.random() - 0.5) * (baseScale * 0.85)
        );
        singleCloud.add(puffMesh);
      }

      singleCloud.position.set(
        (Math.random() - 0.5) * 480,
        55 + Math.random() * 30,
        (Math.random() - 0.5) * 480
      );

      const speed = 2.0 + Math.random() * 3.5;
      this.cloudGroup.add(singleCloud);
      this.clouds.push({ mesh: singleCloud, speed });
    }
  }

  _updateClouds(delta) {
    if (!this.clouds) return;
    for (const cloud of this.clouds) {
      cloud.mesh.position.x += cloud.speed * delta;
      if (cloud.mesh.position.x > 260) {
        cloud.mesh.position.x = -260;
        cloud.mesh.position.z = (Math.random() - 0.5) * 480;
      }
    }
  }

  /**
   * Sets the atmospheric weather & lighting mode.
   * @param {'NIGHT' | 'SUNSET' | 'DAY'} mode
   */
  setWeather(mode) {
    this.weatherMode = mode;

    if (mode === 'NIGHT') {
      // Vibrant, luminous neon night with clear visibility
      this.scene.background.setHex(0x131d36);
      this.scene.fog.color.setHex(0x131d36);
      this.scene.fog.density = 0.0022;

      this.hemiLight.color.setHex(0x93c5fd);
      this.hemiLight.groundColor.setHex(0x1e293b);
      this.hemiLight.intensity = 0.95;

      this.dirLight.color.setHex(0xa5f3fc);
      this.dirLight.intensity = 1.6;

      this.cityFillLight.color.setHex(0xc084fc);
      this.cityFillLight.intensity = 1.0;

      this.renderer.toneMappingExposure = 1.35;

    } else if (mode === 'SUNSET') {
      // Warm, joyful golden hour with violet tones
      this.scene.background.setHex(0x4a1d47);
      this.scene.fog.color.setHex(0x4a1d47);
      this.scene.fog.density = 0.002;

      this.hemiLight.color.setHex(0xfb7185);
      this.hemiLight.groundColor.setHex(0x2d1537);
      this.hemiLight.intensity = 1.1;

      this.dirLight.color.setHex(0xfbbf24);
      this.dirLight.intensity = 2.8;

      this.cityFillLight.color.setHex(0xf472b6);
      this.cityFillLight.intensity = 1.2;

      this.renderer.toneMappingExposure = 1.4;

    } else if (mode === 'DAY') {
      // Bright, cheerful, joyful blue sky and sunny day
      this.scene.background.setHex(0x60a5fa);
      this.scene.fog.color.setHex(0x93c5fd);
      this.scene.fog.density = 0.0015;

      this.hemiLight.color.setHex(0xffffff);
      this.hemiLight.groundColor.setHex(0x86efac);
      this.hemiLight.intensity = 1.3;

      this.dirLight.color.setHex(0xfffaed);
      this.dirLight.intensity = 3.2;

      this.cityFillLight.color.setHex(0xdbeafe);
      this.cityFillLight.intensity = 1.1;

      this.renderer.toneMappingExposure = 1.35;

    } else if (mode === 'RAIN') {
      // Moody cinematic rainstorm with atmospheric wet reflections
      this.scene.background.setHex(0x1e293b);
      this.scene.fog.color.setHex(0x334155);
      this.scene.fog.density = 0.0035;

      this.hemiLight.color.setHex(0x94a3b8);
      this.hemiLight.groundColor.setHex(0x0f172a);
      this.hemiLight.intensity = 0.85;

      this.dirLight.color.setHex(0xcfd8dc);
      this.dirLight.intensity = 1.3;

      this.cityFillLight.color.setHex(0x475569);
      this.cityFillLight.intensity = 0.9;

      this.renderer.toneMappingExposure = 1.1;
    }

    if (this.cloudMaterial) {
      if (mode === 'DAY') {
        this.cloudMaterial.color.setHex(0xffffff);
        this.cloudMaterial.opacity = 0.94;
      } else if (mode === 'SUNSET') {
        this.cloudMaterial.color.setHex(0xfecdd3);
        this.cloudMaterial.opacity = 0.90;
      } else if (mode === 'NIGHT') {
        this.cloudMaterial.color.setHex(0x334155);
        this.cloudMaterial.opacity = 0.78;
      } else if (mode === 'RAIN') {
        this.cloudMaterial.color.setHex(0x1e293b);
        this.cloudMaterial.opacity = 0.96;
      }
    }

    if (this.rainParticles) {
      this.rainParticles.visible = (mode === 'RAIN');
    }
  }

  cycleWeather() {
    const modes = ['DAY', 'SUNSET', 'NIGHT', 'RAIN'];
    const nextIndex = (modes.indexOf(this.weatherMode) + 1) % modes.length;
    this.setWeather(modes[nextIndex]);
    return modes[nextIndex];
  }

  toggleCameraMode() {
    this.cameraModeIndex = (this.cameraModeIndex + 1) % this.cameraModes.length;
    this.cameraMode = this.cameraModes[this.cameraModeIndex];
    return this.cameraMode;
  }

  /**
   * Returns current on-foot camera horizontal yaw angle in radians.
   */
  getCameraYaw() {
    return this.onFootCamera ? this.onFootCamera.yaw : 0;
  }

  /**
   * Sets on-foot camera yaw (e.g. when exiting taxi to match car orientation).
   */
  setOnFootCameraYaw(yaw) {
    if (this.onFootCamera) {
      this.onFootCamera.yaw = yaw;
      this.onFootCamera.manualCooldown = 0;
      this.onFootCamera.backwardTimer = 0;
    }
  }

  /**
   * Updates camera tracking based on car position and user input.
   * @param {number} delta
   * @param {import('../gameplay/Car.js').Car|import('../gameplay/PlayerCharacter.js').PlayerCharacter} targetEntity
   * @param {{ deltaX: number, deltaY: number, zoom: number }} cameraInput
   * @param {boolean} isOnFoot
   */
  updateCamera(delta, targetEntity, cameraInput, isOnFoot = false) {
    const targetPos = targetEntity.position;
    const targetHeading = targetEntity.heading;

    if (isOnFoot) {
      // 1. Third-Person On-Foot Camera (GTA Style)
      // Process Right Joystick / Mouse manual camera panning
      const manualYawDelta = cameraInput ? (cameraInput.deltaX || 0) : 0;
      const manualPitchDelta = cameraInput ? (cameraInput.deltaY || 0) : 0;
      const isManualPanning = Math.abs(manualYawDelta) > 0.001 || Math.abs(manualPitchDelta) > 0.001;

      if (isManualPanning) {
        this.onFootCamera.yaw += manualYawDelta * this.onFootCamera.sensitivity;
        this.onFootCamera.pitch = Math.max(
          -0.15,
          Math.min(1.15, this.onFootCamera.pitch - manualPitchDelta * this.onFootCamera.sensitivity)
        );
        this.onFootCamera.manualCooldown = 0.85; // Pause auto-follow during and briefly after manual pan
      } else if (this.onFootCamera.manualCooldown > 0) {
        this.onFootCamera.manualCooldown -= delta;
      }

      if (cameraInput && cameraInput.zoom) {
        this.onFootCamera.distance = Math.max(2.5, Math.min(10.0, this.onFootCamera.distance + cameraInput.zoom * 1.5));
      }

      // 2. Natural Auto-Follow Behind Character:
      // When moving and not manually panning, camera naturally glides directly behind character's back
      const isMoving = targetEntity.speed > 0.35;
      if (isMoving && this.onFootCamera.manualCooldown <= 0) {
        let diff = targetHeading - this.onFootCamera.yaw;
        while (diff < -Math.PI) diff += Math.PI * 2;
        while (diff > Math.PI) diff -= Math.PI * 2;

        // If pulling backward (diff > ~130 deg), don't flip camera 180 immediately to avoid jitter
        const isMovingBackward = Math.abs(diff) > 2.25;
        if (isMovingBackward) {
          this.onFootCamera.backwardTimer = (this.onFootCamera.backwardTimer || 0) + delta;
        } else {
          this.onFootCamera.backwardTimer = 0;
        }

        if (!isMovingBackward || this.onFootCamera.backwardTimer > 1.1) {
          const followSpeed = targetEntity.isSprinting ? 4.6 : 3.2;
          this.onFootCamera.yaw += diff * Math.min(1.0, delta * followSpeed);
        }

        // Gently return pitch to comfortable default (0.24 rad)
        this.onFootCamera.pitch = THREE.MathUtils.lerp(this.onFootCamera.pitch, 0.24, delta * 1.2);
      }

      const yaw = this.onFootCamera.yaw;
      const pitch = this.onFootCamera.pitch;
      const dist = this.onFootCamera.distance;

      // Spherical position offset behind target
      const offsetX = Math.sin(yaw) * Math.cos(pitch) * dist;
      const offsetZ = Math.cos(yaw) * Math.cos(pitch) * dist;
      const offsetY = Math.sin(pitch) * dist + this.onFootCamera.height;

      const targetCamX = targetPos.x - offsetX;
      const targetCamY = targetPos.y + offsetY;
      const targetCamZ = targetPos.z - offsetZ;

      const smoothFactor = Math.min(1.0, delta * 14.0);
      this.currentCameraPos.x = THREE.MathUtils.lerp(this.currentCameraPos.x, targetCamX, smoothFactor);
      this.currentCameraPos.y = THREE.MathUtils.lerp(this.currentCameraPos.y, targetCamY, smoothFactor);
      this.currentCameraPos.z = THREE.MathUtils.lerp(this.currentCameraPos.z, targetCamZ, smoothFactor);

      // Target to look at is player's torso / head
      const lookTargetX = targetPos.x;
      const lookTargetY = targetPos.y + this.onFootCamera.height;
      const lookTargetZ = targetPos.z;

      this.currentCameraTarget.x = THREE.MathUtils.lerp(this.currentCameraTarget.x, lookTargetX, smoothFactor);
      this.currentCameraTarget.y = THREE.MathUtils.lerp(this.currentCameraTarget.y, lookTargetY, smoothFactor);
      this.currentCameraTarget.z = THREE.MathUtils.lerp(this.currentCameraTarget.z, lookTargetZ, smoothFactor);

      this.camera.position.copy(this.currentCameraPos);
      this.camera.lookAt(this.currentCameraTarget);

      this.camera.fov = 60;
      this.camera.updateProjectionMatrix();

    } else if (this.cameraMode === 'CHASE') {
      // 2. Dynamic Third-Person Vehicle Chase Camera
      const forwardX = Math.sin(targetHeading);
      const forwardZ = Math.cos(targetHeading);

      const speedFactor = Math.min(1.0, Math.abs(targetEntity.speed) / (targetEntity.maxSpeed || 38));
      this.camera.fov = THREE.MathUtils.lerp(this.camera.fov, 60 + speedFactor * 14, delta * 4);
      this.camera.updateProjectionMatrix();

      const backDistance = 9.0 + speedFactor * 3.0;
      const height = 4.2 + speedFactor * 0.5;

      const targetCamX = targetPos.x - forwardX * backDistance;
      const targetCamZ = targetPos.z - forwardZ * backDistance;
      const targetCamY = targetPos.y + height;

      const smoothFactor = Math.min(1.0, delta * 9.0);
      this.currentCameraPos.x = THREE.MathUtils.lerp(this.currentCameraPos.x, targetCamX, smoothFactor);
      this.currentCameraPos.y = THREE.MathUtils.lerp(this.currentCameraPos.y, targetCamY, smoothFactor);
      this.currentCameraPos.z = THREE.MathUtils.lerp(this.currentCameraPos.z, targetCamZ, smoothFactor);

      const lookAheadDist = 3.5 + speedFactor * 4.0;
      const lookTargetX = targetPos.x + forwardX * lookAheadDist;
      const lookTargetZ = targetPos.z + forwardZ * lookAheadDist;
      const lookTargetY = targetPos.y + 1.2;

      this.currentCameraTarget.x = THREE.MathUtils.lerp(this.currentCameraTarget.x, lookTargetX, smoothFactor);
      this.currentCameraTarget.y = THREE.MathUtils.lerp(this.currentCameraTarget.y, lookTargetY, smoothFactor);
      this.currentCameraTarget.z = THREE.MathUtils.lerp(this.currentCameraTarget.z, lookTargetZ, smoothFactor);

      this.camera.position.copy(this.currentCameraPos);
      this.camera.lookAt(this.currentCameraTarget);

    } else if (this.cameraMode === 'HOOD') {
      // 2. Cockpit / Hood Camera
      const forwardX = Math.sin(targetHeading);
      const forwardZ = Math.cos(targetHeading);

      this.camera.position.set(
        targetPos.x + forwardX * 1.3,
        targetPos.y + 1.2,
        targetPos.z + forwardZ * 1.3
      );
      this.camera.lookAt(
        targetPos.x + forwardX * 25,
        targetPos.y + 1.1,
        targetPos.z + forwardZ * 25
      );

    } else if (this.cameraMode === 'ORBIT') {
      // 3. Free Orbit / Mouse Drag Camera
      this.orbitTheta += cameraInput.deltaX;
      this.orbitPhi = Math.max(0.1, Math.min(Math.PI / 2.2, this.orbitPhi + cameraInput.deltaY));
      this.orbitDistance = Math.max(6, Math.min(35, this.orbitDistance + cameraInput.zoom * 2));

      const camX = targetPos.x + this.orbitDistance * Math.sin(this.orbitTheta) * Math.cos(this.orbitPhi);
      const camY = targetPos.y + this.orbitDistance * Math.sin(this.orbitPhi);
      const camZ = targetPos.z + this.orbitDistance * Math.cos(this.orbitTheta) * Math.cos(this.orbitPhi);

      this.camera.position.set(camX, camY, camZ);
      this.camera.lookAt(targetPos.x, targetPos.y + 1.0, targetPos.z);
    }

    // Update rain particles falling animation centered on player
    if (this.rainParticles && this.rainParticles.visible) {
      this.rainParticles.position.x = targetPos.x;
      this.rainParticles.position.z = targetPos.z;
      const posAttr = this.rainParticles.geometry.attributes.position;
      const positions = posAttr.array;
      for (let i = 0; i < this.rainVelocities.length; i++) {
        positions[i * 3 + 1] -= this.rainVelocities[i] * delta;
        if (positions[i * 3 + 1] < 0) {
          positions[i * 3 + 1] = 40 + Math.random() * 5;
          positions[i * 3 + 0] = (Math.random() - 0.5) * 140;
          positions[i * 3 + 2] = (Math.random() - 0.5) * 140;
        }
      }
      posAttr.needsUpdate = true;
    }

    // Update drifting volumetric clouds
    this._updateClouds(delta);

    // Keep directional sunlight centered around player for crisp shadow maps
    this.dirLight.position.set(targetPos.x + 60, 120, targetPos.z + 60);
    this.dirLight.target.position.copy(targetPos);
    this.dirLight.target.updateMatrixWorld();
  }

  _onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }
}
