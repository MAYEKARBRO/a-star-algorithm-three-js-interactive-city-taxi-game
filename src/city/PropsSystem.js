import * as THREE from 'three';

/**
 * PropsSystem manages interactive, physics-driven destructible street props:
 * - Fire Hydrants: Cap blows off with massive erupting vertical water geysers.
 * - Cardboard Crates: Shatter into tumbling cardboard fragment panels.
 * - Trash Cans: Tumble and roll across asphalt with flying lids and litter debris.
 * - Road Cones: Positioned at street corners for drifting; launch into the air when blasted.
 * - Road Barricades: Sawhorse hazard barriers that snap into splintering halves.
 * - Nitro Pickups: Floating rotating canisters that refill the turbo tank.
 * - Road Construction Zones: Blocks road segments to force real-time A* detours.
 */
export class PropsSystem {
  constructor(scene, roadNetwork, audio) {
    this.scene = scene;
    this.roadNetwork = roadNetwork;
    this.audio = audio;

    this.group = new THREE.Group();
    this.scene.add(this.group);

    // Particle Group for water geysers, litter debris, and sparks
    this.particles = [];
    this.particleGroup = new THREE.Group();
    this.scene.add(this.particleGroup);

    // Physics dynamic flying props (cones, lids, trash cans, barricade halves)
    this.flyingProps = [];

    this.nitroPickups = [];
    this.destructibles = [];

    this.activeRoadblockSegment = null;
    this.roadblockTimer = 0;

    this._spawnNitroPickups();
    this._spawnDestructibleProps();
    this._setupInitialRoadblock();
  }

  /**
   * Spawns rotating Nitro boost pickups on roads and alleys.
   */
  _spawnNitroPickups() {
    const spacing = this.roadNetwork.spacing;
    const locations = [
      { x: spacing * 0.5, z: spacing * 0.5 },
      { x: -spacing * 1.5, z: -spacing * 0.5 },
      { x: spacing * 2.5, z: -spacing * 1.5 },
      { x: -spacing * 0.5, z: spacing * 2.5 },
      { x: 0, z: spacing * 1.5 },
      { x: spacing * 1.5, z: -spacing * 2.5 }
    ];

    const canMat = new THREE.MeshStandardMaterial({
      color: 0x00f0ff,
      emissive: 0x00f0ff,
      emissiveIntensity: 0.8,
      metalness: 0.9,
      roughness: 0.1
    });

    for (const loc of locations) {
      const pGroup = new THREE.Group();
      pGroup.position.set(loc.x, 1.4, loc.z);

      // Canister bottle
      const canGeo = new THREE.CylinderGeometry(0.35, 0.35, 1.4, 12);
      const canMesh = new THREE.Mesh(canGeo, canMat);
      pGroup.add(canMesh);

      // Glowing rotating energy ring
      const ringGeo = new THREE.TorusGeometry(0.7, 0.08, 8, 16);
      const ringMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      pGroup.add(ringMesh);

      this.group.add(pGroup);
      this.nitroPickups.push({
        group: pGroup,
        canMesh,
        ringMesh,
        x: loc.x,
        z: loc.z,
        active: true,
        respawnTimer: 0
      });
    }
  }

  /**
   * Spawns all destructible street props: Hydrants, Crates, Trash Cans, Cones, and Barricades.
   */
  _spawnDestructibleProps() {
    const spacing = this.roadNetwork.spacing;
    const roadWidth = this.roadNetwork.getCityBounds().roadWidth;
    const curbOffset = roadWidth / 2 + 1.2;
    const laneOffset = roadWidth / 2 - 1.2;

    // -------------------------------------------------------------
    // 1. FIRE HYDRANTS
    // -------------------------------------------------------------
    const hydrantMat = new THREE.MeshStandardMaterial({ color: 0xef4444, metalness: 0.85, roughness: 0.2 });
    const capMat = new THREE.MeshStandardMaterial({ color: 0xb91c1c, metalness: 0.9, roughness: 0.2 });

    for (let i = 0; i < 8; i++) {
      const hx = ((i % 4) - 1.5) * spacing + curbOffset;
      const hz = (Math.floor(i / 4) - 0.5) * spacing * 2.5 + curbOffset;

      const hydrantGroup = new THREE.Group();
      hydrantGroup.position.set(hx, 0.35, hz);

      const baseGeo = new THREE.CylinderGeometry(0.25, 0.3, 0.9, 8);
      const baseMesh = new THREE.Mesh(baseGeo, hydrantMat);
      baseMesh.position.y = 0.45;
      baseMesh.castShadow = true;
      hydrantGroup.add(baseMesh);

      const topGeo = new THREE.SphereGeometry(0.24, 8, 8);
      const topMesh = new THREE.Mesh(topGeo, capMat);
      topMesh.position.y = 0.9;
      hydrantGroup.add(topMesh);

      // Side nozzles
      const nozGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.7, 6);
      nozGeo.rotateZ(Math.PI / 2);
      const nozMesh = new THREE.Mesh(nozGeo, capMat);
      nozMesh.position.y = 0.55;
      hydrantGroup.add(nozMesh);

      this.group.add(hydrantGroup);
      this.destructibles.push({
        type: 'HYDRANT',
        group: hydrantGroup,
        capMesh: topMesh,
        x: hx,
        z: hz,
        broken: false,
        waterGeyser: false
      });
    }

    // -------------------------------------------------------------
    // 2. CARDBOARD CRATES
    // -------------------------------------------------------------
    const crateMat = new THREE.MeshStandardMaterial({ color: 0xc28251, roughness: 0.95 }); // Cardboard tan
    const tapeMat = new THREE.MeshStandardMaterial({ color: 0x925b2a, roughness: 0.7 }); // Packing tape

    for (let i = 0; i < 10; i++) {
      const cx = (i % 5 - 2) * spacing - curbOffset;
      const cz = ((i * 2) % 5 - 2) * spacing + curbOffset;

      const crateGroup = new THREE.Group();
      crateGroup.position.set(cx, 0.6, cz);

      const boxGeo = new THREE.BoxGeometry(1.2, 1.2, 1.2);
      const boxMesh = new THREE.Mesh(boxGeo, crateMat);
      boxMesh.castShadow = true;
      crateGroup.add(boxMesh);

      // Tape bands
      const tapeGeo = new THREE.BoxGeometry(1.22, 0.18, 1.22);
      const tapeMesh = new THREE.Mesh(tapeGeo, tapeMat);
      crateGroup.add(tapeMesh);

      this.group.add(crateGroup);
      this.destructibles.push({
        type: 'CRATE',
        group: crateGroup,
        x: cx,
        z: cz,
        broken: false
      });
    }

    // -------------------------------------------------------------
    // 3. TRASH CANS
    // -------------------------------------------------------------
    const canBodyMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.7, roughness: 0.4 });
    const canLidMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8, roughness: 0.3 });

    for (let i = 0; i < 10; i++) {
      const tx = ((i * 3) % 5 - 2) * spacing + curbOffset + 0.6;
      const tz = (i % 4 - 1.5) * spacing - curbOffset;

      const canGroup = new THREE.Group();
      canGroup.position.set(tx, 0.6, tz);

      // Cylindrical Can Body
      const canGeo = new THREE.CylinderGeometry(0.42, 0.38, 1.1, 10);
      const canMesh = new THREE.Mesh(canGeo, canBodyMat);
      canMesh.castShadow = true;
      canGroup.add(canMesh);

      // Domed Lid
      const lidGeo = new THREE.SphereGeometry(0.44, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2);
      const lidMesh = new THREE.Mesh(lidGeo, canLidMat);
      lidMesh.position.y = 0.55;
      canGroup.add(lidMesh);

      this.group.add(canGroup);
      this.destructibles.push({
        type: 'TRASH_CAN',
        group: canGroup,
        lidMesh,
        canMesh,
        x: tx,
        z: tz,
        broken: false
      });
    }

    // -------------------------------------------------------------
    // 4. ROAD TRAFFIC CONES (Placed around apexes for drifting)
    // -------------------------------------------------------------
    const coneMat = new THREE.MeshStandardMaterial({ color: 0xff6600, roughness: 0.4 }); // Fluorescent orange
    const stripeMat = new THREE.MeshBasicMaterial({ color: 0xffffff }); // Reflective white vinyl
    const baseMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.9 }); // Black heavy base

    for (let i = 0; i < 6; i++) {
      const cornerX = (i % 3 - 1) * spacing + laneOffset;
      const cornerZ = (Math.floor(i / 3) - 0.5) * spacing * 2 + laneOffset;

      // Cluster of 3 cones in a curve around the corner
      for (let c = 0; c < 3; c++) {
        const angle = (c * 0.45);
        const coneX = cornerX + Math.sin(angle) * 3.5;
        const coneZ = cornerZ + Math.cos(angle) * 3.5;

        const coneGroup = new THREE.Group();
        coneGroup.position.set(coneX, 0.05, coneZ);

        // Base square plate
        const bGeo = new THREE.BoxGeometry(0.5, 0.08, 0.5);
        const bMesh = new THREE.Mesh(bGeo, baseMat);
        bMesh.position.y = 0.04;
        coneGroup.add(bMesh);

        // Cone body
        const cGeo = new THREE.ConeGeometry(0.24, 0.85, 10);
        const cMesh = new THREE.Mesh(cGeo, coneMat);
        cMesh.position.y = 0.46;
        cMesh.castShadow = true;
        coneGroup.add(cMesh);

        // White reflective band
        const sGeo = new THREE.CylinderGeometry(0.14, 0.17, 0.22, 10);
        const sMesh = new THREE.Mesh(sGeo, stripeMat);
        sMesh.position.y = 0.44;
        coneGroup.add(sMesh);

        this.group.add(coneGroup);
        this.destructibles.push({
          type: 'ROAD_CONE',
          group: coneGroup,
          x: coneX,
          z: coneZ,
          broken: false
        });
      }
    }

    // -------------------------------------------------------------
    // 5. ROAD HAZARD SAWHORSE BARRICADES
    // -------------------------------------------------------------
    const woodMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.7 });
    const stripedMat = this._createStripedBarricadeMaterial();

    for (let i = 0; i < 6; i++) {
      const bx = ((i * 2) % 5 - 2) * spacing;
      const bz = (i % 3 - 1) * spacing + laneOffset;

      const barGroup = new THREE.Group();
      barGroup.position.set(bx, 0.5, bz);

      // Striped crossboard
      const boardGeo = new THREE.BoxGeometry(2.4, 0.35, 0.08);
      const boardMesh = new THREE.Mesh(boardGeo, stripedMat);
      boardMesh.position.y = 0.4;
      boardMesh.castShadow = true;
      barGroup.add(boardMesh);

      // A-frame wooden legs
      const legGeo = new THREE.BoxGeometry(0.08, 0.95, 0.08);
      const leg1 = new THREE.Mesh(legGeo, woodMat);
      leg1.position.set(-1.0, 0, -0.15); leg1.rotation.x = 0.18;
      barGroup.add(leg1);
      const leg2 = new THREE.Mesh(legGeo, woodMat);
      leg2.position.set(-1.0, 0, 0.15); leg2.rotation.x = -0.18;
      barGroup.add(leg2);
      const leg3 = new THREE.Mesh(legGeo, woodMat);
      leg3.position.set(1.0, 0, -0.15); leg3.rotation.x = 0.18;
      barGroup.add(leg3);
      const leg4 = new THREE.Mesh(legGeo, woodMat);
      leg4.position.set(1.0, 0, 0.15); leg4.rotation.x = -0.18;
      barGroup.add(leg4);

      // Flashing amber beacon
      const beaconGeo = new THREE.BoxGeometry(0.2, 0.2, 0.2);
      const beaconMat = new THREE.MeshBasicMaterial({ color: 0xfbbf24 });
      const beaconMesh = new THREE.Mesh(beaconGeo, beaconMat);
      beaconMesh.position.set(0, 0.65, 0);
      barGroup.add(beaconMesh);

      this.group.add(barGroup);
      this.destructibles.push({
        type: 'BARRICADE',
        group: barGroup,
        boardMesh,
        x: bx,
        z: bz,
        broken: false
      });
    }
  }

  _createStripedBarricadeMaterial() {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 128, 32);
    ctx.fillStyle = '#ff6600';
    for (let x = -32; x < 160; x += 32) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + 16, 0);
      ctx.lineTo(x + 32, 32);
      ctx.lineTo(x + 16, 32);
      ctx.fill();
    }
    const tex = new THREE.CanvasTexture(canvas);
    return new THREE.MeshStandardMaterial({ map: tex, roughness: 0.6 });
  }

  /**
   * Sets up dynamic construction roadblocks that force real-time A* detours.
   */
  _setupInitialRoadblock() {
    this._toggleRoadblock();
  }

  _toggleRoadblock() {
    if (this.activeRoadblockSegment) {
      this.roadNetwork.graph.setEdgeBlocked(
        this.activeRoadblockSegment.fromNodeId,
        this.activeRoadblockSegment.toNodeId,
        false
      );
      if (this.activeRoadblockMesh) {
        this.group.remove(this.activeRoadblockMesh);
        this.activeRoadblockMesh = null;
      }
    }

    const candidateIntersections = this.roadNetwork.intersections.filter(
      i => (i.gridX === 2 || i.gridX === 4) && i.gridZ === 3
    );
    if (candidateIntersections.length < 2) return;

    const nodeA = candidateIntersections[0];
    const nodeB = this.roadNetwork.intersections.find(
      i => i.gridX === nodeA.gridX && i.gridZ === nodeA.gridZ + 1
    );
    if (!nodeB) return;

    const midX = (nodeA.x + nodeB.x) / 2;
    const midZ = (nodeA.z + nodeB.z) / 2;

    this.roadNetwork.graph.setEdgeBlocked(nodeA.id, nodeB.id, true);
    this.activeRoadblockSegment = {
      fromNodeId: nodeA.id,
      toNodeId: nodeB.id,
      streetName: nodeA.avenueName || 'Broadway Ave'
    };

    const barGroup = new THREE.Group();
    barGroup.position.set(midX, 0, midZ);

    const barGeo = new THREE.BoxGeometry(12, 1.6, 0.6);
    const barMesh = new THREE.Mesh(barGeo, this._createStripedBarricadeMaterial());
    barMesh.position.y = 0.8;
    barMesh.castShadow = true;
    barGroup.add(barMesh);

    this.activeRoadblockMesh = barGroup;
    this.group.add(barGroup);

    return this.activeRoadblockSegment;
  }

  /**
   * Checks collisions between player car and props (Nitro, Hydrants, Crates, Cans, Cones, Barricades).
   * @param {import('../gameplay/Car.js').Car} car
   * @param {import('../gameplay/PassengerSystem.js').PassengerSystem} [passengerSys]
   * @returns {{ event?: string, points?: number, message?: string }}
   */
  checkCarInteractions(car, passengerSys) {
    const carPos = car.position;
    const carSpeed = Math.abs(car.speed);

    // 1. Nitro Boost Pickups
    for (const nitro of this.nitroPickups) {
      if (!nitro.active) continue;
      const dist = Math.hypot(carPos.x - nitro.x, carPos.z - nitro.z);
      if (dist < 2.5) {
        nitro.active = false;
        nitro.group.visible = false;
        nitro.respawnTimer = 15.0;

        car.addNitro(100);
        if (this.audio) this.audio.playNitroSound();
        this._emitNitroSparks(nitro.group.position);

        return {
          event: 'NITRO_COLLECTED',
          message: '⚡ NITRO BOOST READY! [SHIFT]'
        };
      }
    }

    // 2. Destructible Street Props
    for (const prop of this.destructibles) {
      if (prop.broken) continue;
      const dist = Math.hypot(carPos.x - prop.x, carPos.z - prop.z);
      const hitRadius = (prop.type === 'BARRICADE' ? 2.5 : 2.0);

      if (dist < hitRadius && carSpeed > 3.5) {
        prop.broken = true;

        // Calculate impact physics launch vector
        const hitAngle = Math.atan2(prop.x - carPos.x, prop.z - carPos.z);
        const impulse = 8 + carSpeed * 0.45;
        const velX = Math.sin(hitAngle) * impulse + (Math.random() - 0.5) * 4;
        const velZ = Math.cos(hitAngle) * impulse + (Math.random() - 0.5) * 4;
        const velY = 4 + Math.random() * 5;

        // A. FIRE HYDRANT: Cap explodes off, water geyser erupts
        if (prop.type === 'HYDRANT') {
          prop.waterGeyser = true;
          prop.group.rotation.z = Math.PI / 3.5;

          // Detach and launch cap
          if (prop.capMesh) {
            prop.group.remove(prop.capMesh);
            this.scene.add(prop.capMesh);
            prop.capMesh.position.set(prop.x, 1.2, prop.z);
            this.flyingProps.push({
              mesh: prop.capMesh,
              velX: velX * 1.2,
              velY: velY + 4,
              velZ: velZ * 1.2,
              rotX: Math.random() * 12,
              rotY: Math.random() * 12,
              rotZ: Math.random() * 12
            });
          }

          if (this.audio) this.audio.playHydrantGeyserSound();
          return {
            event: 'HYDRANT_BURST',
            points: 100,
            message: '🌊 FIRE HYDRANT EXPLODED! WATER GEYSER! +$100'
          };
        }

        // B. CARDBOARD CRATE: Shatters into tumbling fragment panels
        else if (prop.type === 'CRATE') {
          prop.group.visible = false;
          this._emitCrateDebris(prop.group.position, velX, velZ);
          if (this.audio) this.audio.playCrateSmashSound();
          return {
            event: 'CRATE_SMASH',
            points: 50,
            message: '📦 CARDBOARD CRATE SHATTERED! +$50'
          };
        }

        // C. TRASH CAN: Tumbles and rolls, lid pops off, litter scatters
        else if (prop.type === 'TRASH_CAN') {
          prop.group.visible = false;

          // Spawn flying tumbling can
          const canClone = prop.canMesh.clone();
          this.scene.add(canClone);
          canClone.position.set(prop.x, 0.6, prop.z);
          this.flyingProps.push({
            mesh: canClone,
            velX: velX * 0.9,
            velY: velY + 2,
            velZ: velZ * 0.9,
            rotX: 8,
            rotY: 5,
            rotZ: 10
          });

          // Spawn flying lid
          const lidClone = prop.lidMesh.clone();
          this.scene.add(lidClone);
          lidClone.position.set(prop.x, 1.1, prop.z);
          this.flyingProps.push({
            mesh: lidClone,
            velX: velX * 1.3,
            velY: velY + 6,
            velZ: velZ * 1.3,
            rotX: 15,
            rotY: 10,
            rotZ: 6
          });

          // Emit scattering paper / trash debris
          this._emitTrashLitter(prop.group.position, velX, velZ);

          if (this.audio && this.audio.playTrashCanClatterSound) {
            this.audio.playTrashCanClatterSound();
          } else if (this.audio) {
            this.audio.playCrateSmashSound();
          }

          return {
            event: 'TRASH_CAN_SMASH',
            points: 50,
            message: '🗑️ TRASH CAN SMASHED! DEBRIS SCATTER! +$50'
          };
        }

        // D. ROAD CONE: Blasted into the air, extra bonus when drifting
        else if (prop.type === 'ROAD_CONE') {
          this.group.remove(prop.group);
          this.scene.add(prop.group);
          this.flyingProps.push({
            mesh: prop.group,
            velX: velX * 1.4,
            velY: velY + 7, // High arc launch
            velZ: velZ * 1.4,
            rotX: (Math.random() - 0.5) * 16,
            rotY: (Math.random() - 0.5) * 16,
            rotZ: (Math.random() - 0.5) * 16
          });

          if (this.audio && this.audio.playConeHitSound) {
            this.audio.playConeHitSound();
          }

          if (car.isDrifting) {
            return {
              event: 'CONE_DRIFT_SMASH',
              points: 75,
              message: '🔶 DRIFT CONE BLAST! +$75 BONUS'
            };
          } else {
            return {
              event: 'CONE_SMASH',
              points: 25,
              message: '🔶 ROAD CONE BLASTED! +$25'
            };
          }
        }

        // E. BARRICADE: Snaps into flying halves with splinter debris
        else if (prop.type === 'BARRICADE') {
          prop.group.visible = false;
          this._emitBarricadeShatter(prop.group.position, velX, velZ);
          if (this.audio) this.audio.playCrateSmashSound();
          return {
            event: 'BARRICADE_SMASH',
            points: 75,
            message: '🚧 BARRICADE OBLITERATED! +$75'
          };
        }
      }
    }

    return {};
  }

  _emitNitroSparks(pos) {
    for (let i = 0; i < 16; i++) {
      const geo = new THREE.SphereGeometry(0.15, 4, 4);
      const mat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(pos.x, pos.y, pos.z);
      this.particleGroup.add(mesh);

      this.particles.push({
        mesh,
        life: 0.5,
        maxLife: 0.5,
        velX: (Math.random() - 0.5) * 8,
        velY: 2 + Math.random() * 5,
        velZ: (Math.random() - 0.5) * 8
      });
    }
  }

  _emitCrateDebris(pos, pushX = 0, pushZ = 0) {
    for (let i = 0; i < 9; i++) {
      const geo = new THREE.BoxGeometry(0.4, 0.4, 0.08); // Cardboard panels
      const mat = new THREE.MeshStandardMaterial({ color: 0xc28251, roughness: 0.9 });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(pos.x, pos.y + 0.4, pos.z);
      this.particleGroup.add(mesh);

      this.particles.push({
        mesh,
        life: 1.4,
        maxLife: 1.4,
        velX: pushX * 0.4 + (Math.random() - 0.5) * 8,
        velY: 4 + Math.random() * 6,
        velZ: pushZ * 0.4 + (Math.random() - 0.5) * 8,
        rotX: (Math.random() - 0.5) * 14,
        rotY: (Math.random() - 0.5) * 14
      });
    }
  }

  _emitTrashLitter(pos, pushX = 0, pushZ = 0) {
    const colors = [0xf8fafc, 0xfef08a, 0x93c5fd, 0xe2e8f0];
    for (let i = 0; i < 12; i++) {
      const geo = new THREE.PlaneGeometry(0.25, 0.35);
      const mat = new THREE.MeshBasicMaterial({
        color: colors[i % colors.length],
        side: THREE.DoubleSide
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(pos.x, pos.y + 0.5, pos.z);
      this.particleGroup.add(mesh);

      this.particles.push({
        mesh,
        life: 1.6,
        maxLife: 1.6,
        velX: pushX * 0.3 + (Math.random() - 0.5) * 7,
        velY: 3.5 + Math.random() * 5,
        velZ: pushZ * 0.3 + (Math.random() - 0.5) * 7,
        rotX: (Math.random() - 0.5) * 18,
        rotY: (Math.random() - 0.5) * 18
      });
    }
  }

  _emitBarricadeShatter(pos, pushX = 0, pushZ = 0) {
    for (let i = 0; i < 6; i++) {
      const geo = new THREE.BoxGeometry(0.7, 0.2, 0.1);
      const mat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.7 });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(pos.x, pos.y + 0.4, pos.z);
      this.particleGroup.add(mesh);

      this.particles.push({
        mesh,
        life: 1.5,
        maxLife: 1.5,
        velX: pushX * 0.5 + (Math.random() - 0.5) * 9,
        velY: 5 + Math.random() * 5,
        velZ: pushZ * 0.5 + (Math.random() - 0.5) * 9,
        rotX: (Math.random() - 0.5) * 12,
        rotZ: (Math.random() - 0.5) * 12
      });
    }
  }

  _emitWaterSpray(pos) {
    // High-pressure vertical water fountain geyser particles (shooting 12m high)
    for (let i = 0; i < 4; i++) {
      const geo = new THREE.SphereGeometry(0.22, 4, 4);
      const mat = new THREE.MeshBasicMaterial({
        color: Math.random() > 0.4 ? 0x67e8f9 : 0xbae6fd,
        transparent: true,
        opacity: 0.85
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(
        pos.x + (Math.random() - 0.5) * 0.35,
        0.8,
        pos.z + (Math.random() - 0.5) * 0.35
      );
      this.particleGroup.add(mesh);

      this.particles.push({
        mesh,
        life: 1.1,
        maxLife: 1.1,
        velX: (Math.random() - 0.5) * 2.8,
        velY: 13 + Math.random() * 7, // Blasting upward geyser
        velZ: (Math.random() - 0.5) * 2.8
      });
    }
  }

  /**
   * Updates animations, rotating nitro pickups, water fountains, and physics particles.
   * @param {number} delta
   * @param {number} elapsedTime
   */
  update(delta, elapsedTime) {
    // 1. Rotate Nitro Pickups & handle respawn
    for (const nitro of this.nitroPickups) {
      if (nitro.active) {
        nitro.canMesh.rotation.y += delta * 2.5;
        nitro.ringMesh.rotation.x += delta * 3.0;
        nitro.group.position.y = 1.4 + Math.sin(elapsedTime * 4) * 0.2;
      } else {
        nitro.respawnTimer -= delta;
        if (nitro.respawnTimer <= 0) {
          nitro.active = true;
          nitro.group.visible = true;
        }
      }
    }

    // 2. Active Water Hydrant Geysers
    for (const prop of this.destructibles) {
      if (prop.type === 'HYDRANT' && prop.waterGeyser) {
        this._emitWaterSpray(prop.group.position);
      }
    }

    // 3. Update physics for flying props (launched cones, trash cans, lids, caps)
    for (let i = this.flyingProps.length - 1; i >= 0; i--) {
      const p = this.flyingProps[i];
      p.mesh.position.x += p.velX * delta;
      p.mesh.position.y += p.velY * delta;
      p.mesh.position.z += p.velZ * delta;

      if (p.rotX) p.mesh.rotation.x += p.rotX * delta;
      if (p.rotY) p.mesh.rotation.y += p.rotY * delta;
      if (p.rotZ) p.mesh.rotation.z += p.rotZ * delta;

      p.velY -= 20 * delta; // Gravity

      // Ground bounce & friction
      if (p.mesh.position.y <= 0.2) {
        p.mesh.position.y = 0.2;
        p.velY = -p.velY * 0.35; // Dampened bounce
        p.velX *= 0.85;
        p.velZ *= 0.85;

        // Stop rolling if slow
        if (Math.hypot(p.velX, p.velZ) < 0.3 && Math.abs(p.velY) < 0.5) {
          this.flyingProps.splice(i, 1);
        }
      }
    }

    // 4. Update particle physics
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= delta;

      if (p.life <= 0) {
        this.particleGroup.remove(p.mesh);
        p.mesh.geometry.dispose();
        this.particles.splice(i, 1);
        continue;
      }

      p.mesh.position.x += p.velX * delta;
      p.mesh.position.y += p.velY * delta;
      p.mesh.position.z += p.velZ * delta;

      if (p.rotX) p.mesh.rotation.x += p.rotX * delta;
      if (p.rotY) p.mesh.rotation.y += p.rotY * delta;

      p.velY -= 16 * delta; // Gravity

      const progress = p.life / p.maxLife;
      if (p.mesh.material && p.mesh.material.opacity !== undefined) {
        p.mesh.material.opacity = progress;
      }
    }
  }
}
