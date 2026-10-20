import * as THREE from 'three';

/**
 * CityBuilder procedurally creates the 3D drivable city:
 * - Varied buildings with 5 distinct architectural patterns & textures
 * - Asphalt roadways with lane markings & zebra crosswalks
 * - Elevated sidewalks with curbs & pedestrian walkways
 * - Streetlights with night glow fixtures
 * - Lush city trees and park foliage
 * - Rooftop helipads, antennas, and AC mechanical units
 * - Efficient bounding boxes for car collision detection
 */
export class CityBuilder {
  constructor(scene, roadNetwork) {
    this.scene = scene;
    this.roadNetwork = roadNetwork;
    this.cityGroup = new THREE.Group();
    this.scene.add(this.cityGroup);

    // Bounding boxes for car collision detection
    /** @type {Array<{ minX: number, maxX: number, minZ: number, maxZ: number, height: number }>} */
    this.buildingColliders = [];

    // Animated meshes (blinking lights, rotating beacons)
    this.animatedElements = [];

    // Cached procedural textures and materials
    this.textures = this._createProceduralTextures();
    this.materials = this._createMaterials();

    this._buildRoadsAndSidewalks();
    this._buildCityBlocks();
    this._buildStreetFurniture();
  }

  /**
   * Generates high-resolution procedural canvas textures for distinct building patterns.
   * Eliminates asset load errors and provides crisp, vibrant visuals.
   */
  _createProceduralTextures() {
    const textures = {};

    // -------------------------------------------------------------
    // Pattern 1: Modern Glass Curtain Skyscraper
    // -------------------------------------------------------------
    {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 512;
      const ctx = canvas.getContext('2d');

      // Base glass color (deep navy/slate)
      ctx.fillStyle = '#0a192f';
      ctx.fillRect(0, 0, 512, 512);

      // Grid mullions and reflective office windows
      const cols = 8;
      const rows = 16;
      const colWidth = 512 / cols;
      const rowHeight = 512 / rows;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const x = c * colWidth + 4;
          const y = r * rowHeight + 4;
          const w = colWidth - 8;
          const h = rowHeight - 8;

          // Some offices are illuminated with warm/cool lighting
          const isLit = Math.random() > 0.45;
          if (isLit) {
            const hue = Math.random() > 0.7 ? '#ffd166' : '#90e0ef';
            ctx.fillStyle = hue;
            ctx.shadowColor = hue;
            ctx.shadowBlur = 4;
          } else {
            ctx.fillStyle = '#112240';
            ctx.shadowBlur = 0;
          }
          ctx.fillRect(x, y, w, h);

          // Subtle horizontal window blind louvers
          ctx.fillStyle = 'rgba(0,0,0,0.2)';
          ctx.fillRect(x, y + h * 0.4, w, 2);
        }
      }

      // Metallic structural frame lines
      ctx.strokeStyle = '#233554';
      ctx.lineWidth = 3;
      for (let c = 0; c <= cols; c++) {
        ctx.beginPath();
        ctx.moveTo(c * colWidth, 0);
        ctx.lineTo(c * colWidth, 512);
        ctx.stroke();
      }

      const tex = new THREE.CanvasTexture(canvas);
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      textures.glassCurtain = tex;
    }

    // -------------------------------------------------------------
    // Pattern 2: Cyberpunk / Commercial Neon Billboards
    // -------------------------------------------------------------
    {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 512;
      const ctx = canvas.getContext('2d');

      // Dark carbon matte base
      ctx.fillStyle = '#0d1117';
      ctx.fillRect(0, 0, 512, 512);

      // Neon vertical stripes
      const neonColors = ['#ff007f', '#00f0ff', '#7928ca', '#00ff88'];
      for (let i = 0; i < 6; i++) {
        const x = 30 + i * 85;
        const color = neonColors[i % neonColors.length];
        ctx.strokeStyle = color;
        ctx.lineWidth = 6;
        ctx.shadowColor = color;
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.moveTo(x, 10);
        ctx.lineTo(x, 502);
        ctx.stroke();
      }

      // Digital storefront & holographic displays
      ctx.shadowBlur = 8;
      ctx.fillStyle = '#161b22';
      ctx.fillRect(40, 200, 432, 120);
      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 2;
      ctx.strokeRect(40, 200, 432, 120);

      ctx.fillStyle = '#ff007f';
      ctx.font = 'bold 36px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('NEO TAXI AI', 256, 260);

      ctx.fillStyle = '#00f0ff';
      ctx.font = 'bold 18px monospace';
      ctx.fillText('METROPOLIS TRANSIT HUB', 256, 295);

      const tex = new THREE.CanvasTexture(canvas);
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      textures.cyberNeon = tex;
    }

    // -------------------------------------------------------------
    // Pattern 3: Art-Deco / Stepped Architecture
    // -------------------------------------------------------------
    {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 512;
      const ctx = canvas.getContext('2d');

      // Warm limestone / champagne stone
      ctx.fillStyle = '#2b2621';
      ctx.fillRect(0, 0, 512, 512);

      // Fluted pilasters and decorative gold vertical lines
      const cols = 12;
      const w = 512 / cols;
      for (let c = 0; c < cols; c++) {
        const x = c * w;
        ctx.fillStyle = c % 2 === 0 ? '#383029' : '#4a3f35';
        ctx.fillRect(x, 0, w, 512);

        // Windows with amber art-deco glow
        for (let y = 20; y < 500; y += 45) {
          ctx.fillStyle = Math.random() > 0.4 ? '#f4a261' : '#1a1614';
          ctx.fillRect(x + 6, y, w - 12, 28);

          // Brass geometric window grill
          ctx.strokeStyle = '#e76f51';
          ctx.lineWidth = 1;
          ctx.strokeRect(x + 6, y, w - 12, 28);
        }
      }

      const tex = new THREE.CanvasTexture(canvas);
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      textures.artDeco = tex;
    }

    // -------------------------------------------------------------
    // Pattern 4: Residential Brick & Terraced Balconies
    // -------------------------------------------------------------
    {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 512;
      const ctx = canvas.getContext('2d');

      // Modern warm charcoal & terracotta brick tone
      ctx.fillStyle = '#1c1e21';
      ctx.fillRect(0, 0, 512, 512);

      const floors = 10;
      const units = 6;
      const fH = 512 / floors;
      const uW = 512 / units;

      for (let f = 0; f < floors; f++) {
        for (let u = 0; u < units; u++) {
          const bx = u * uW + 8;
          const by = f * fH + 8;
          const bw = uW - 16;
          const bh = fH - 16;

          // Balcony recess
          ctx.fillStyle = '#121416';
          ctx.fillRect(bx, by, bw, bh);

          // Glass balcony railing
          ctx.fillStyle = 'rgba(78, 168, 222, 0.4)';
          ctx.fillRect(bx, by + bh * 0.55, bw, bh * 0.45);

          // Window with soft warm light
          ctx.fillStyle = Math.random() > 0.5 ? '#ffe8d6' : '#22252a';
          ctx.fillRect(bx + 4, by + 4, bw - 8, bh * 0.5);
        }
      }

      const tex = new THREE.CanvasTexture(canvas);
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      textures.residential = tex;
    }

    // -------------------------------------------------------------
    // Pattern 5: Diagrid / Honeycomb Parametric Architecture
    // -------------------------------------------------------------
    {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 512;
      const ctx = canvas.getContext('2d');

      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, 512, 512);

      // Diagrid cross beams
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 6;
      ctx.shadowColor = '#0284c7';
      ctx.shadowBlur = 6;

      const spacing = 64;
      for (let x = -512; x <= 1024; x += spacing) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x + 512, 512);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(x, 512);
        ctx.lineTo(x + 512, 0);
        ctx.stroke();
      }

      // Interior geometric glow cells
      ctx.fillStyle = 'rgba(56, 189, 248, 0.15)';
      for (let y = 0; y < 512; y += 64) {
        for (let x = 0; x < 512; x += 64) {
          if (Math.random() > 0.5) {
            ctx.beginPath();
            ctx.arc(x + 32, y + 32, 14, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      const tex = new THREE.CanvasTexture(canvas);
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      textures.diagrid = tex;
    }

    // -------------------------------------------------------------
    // Road Asphalt with Lane Markings
    // -------------------------------------------------------------
    {
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 256;
      const ctx = canvas.getContext('2d');

      // Dark asphalt with subtle noise
      ctx.fillStyle = '#1a1d20';
      ctx.fillRect(0, 0, 256, 256);

      // Road grain
      for (let i = 0; i < 300; i++) {
        const x = Math.random() * 256;
        const y = Math.random() * 256;
        const c = 20 + Math.random() * 20;
        ctx.fillStyle = `rgb(${c},${c},${c})`;
        ctx.fillRect(x, y, 2, 2);
      }

      // Double yellow center divider
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(124, 0, 3, 256);
      ctx.fillRect(130, 0, 3, 256);

      // Dashed white lane dividers
      ctx.fillStyle = '#f8fafc';
      for (let y = 10; y < 256; y += 40) {
        ctx.fillRect(60, y, 3, 20);
        ctx.fillRect(193, y, 3, 20);
      }

      const tex = new THREE.CanvasTexture(canvas);
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      textures.asphalt = tex;
    }

    // -------------------------------------------------------------
    // Sidewalk Concrete Pavers
    // -------------------------------------------------------------
    {
      const canvas = document.createElement('canvas');
      canvas.width = 128;
      canvas.height = 128;
      const ctx = canvas.getContext('2d');

      ctx.fillStyle = '#475569';
      ctx.fillRect(0, 0, 128, 128);

      // Paving tile lines
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 2;
      for (let i = 0; i <= 128; i += 32) {
        ctx.beginPath();
        ctx.moveTo(i, 0); ctx.lineTo(i, 128); ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, i); ctx.lineTo(128, i); ctx.stroke();
      }

      const tex = new THREE.CanvasTexture(canvas);
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      textures.sidewalk = tex;
    }

    return textures;
  }

  _createMaterials() {
    return {
      glass: new THREE.MeshStandardMaterial({
        map: this.textures.glassCurtain,
        roughness: 0.2,
        metalness: 0.85,
        color: 0x88ccff
      }),
      cyber: new THREE.MeshStandardMaterial({
        map: this.textures.cyberNeon,
        roughness: 0.35,
        metalness: 0.6,
        emissive: 0x110022,
        emissiveIntensity: 0.4
      }),
      artDeco: new THREE.MeshStandardMaterial({
        map: this.textures.artDeco,
        roughness: 0.65,
        metalness: 0.3,
        color: 0xd4a373
      }),
      residential: new THREE.MeshStandardMaterial({
        map: this.textures.residential,
        roughness: 0.7,
        metalness: 0.15
      }),
      diagrid: new THREE.MeshStandardMaterial({
        map: this.textures.diagrid,
        roughness: 0.25,
        metalness: 0.9,
        color: 0x70d6ff
      }),
      roof: new THREE.MeshStandardMaterial({
        color: 0x1e293b,
        roughness: 0.9,
        metalness: 0.1
      }),
      curb: new THREE.MeshStandardMaterial({
        color: 0x64748b,
        roughness: 0.8
      })
    };
  }

  /**
   * Generates continuous ground asphalt, roads, and sidewalks with curbs.
   */
  _buildRoadsAndSidewalks() {
    const bounds = this.roadNetwork.getCityBounds();
    const cityWidth = bounds.maxX - bounds.minX + 100;
    const cityDepth = bounds.maxZ - bounds.minZ + 100;

    // Ground plane underneath entire city
    const groundGeo = new THREE.PlaneGeometry(cityWidth, cityDepth);
    groundGeo.rotateX(-Math.PI / 2);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.95,
      metalness: 0.05
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.position.y = -0.05;
    ground.receiveShadow = true;
    this.cityGroup.add(ground);

    // Build Road Segments
    const roadMat = new THREE.MeshStandardMaterial({
      map: this.textures.asphalt,
      roughness: 0.8,
      metalness: 0.1
    });

    const roadWidth = bounds.roadWidth; // 16 units

    for (const segment of this.roadNetwork.roadSegments) {
      const isHorizontal = segment.orientation === 'horizontal';
      const length = Math.hypot(segment.toX - segment.fromX, segment.toZ - segment.fromZ) + roadWidth;
      const midX = (segment.fromX + segment.toX) / 2;
      const midZ = (segment.fromZ + segment.toZ) / 2;

      const roadGeo = new THREE.PlaneGeometry(
        isHorizontal ? length : roadWidth,
        isHorizontal ? roadWidth : length
      );
      roadGeo.rotateX(-Math.PI / 2);

      // Clone texture so repeat matches orientation
      const segTex = this.textures.asphalt.clone();
      segTex.needsUpdate = true;
      if (isHorizontal) {
        segTex.repeat.set(length / 20, 1);
      } else {
        segTex.repeat.set(1, length / 20);
      }
      const segMat = new THREE.MeshStandardMaterial({
        map: segTex,
        roughness: 0.8,
        metalness: 0.1
      });

      const roadMesh = new THREE.Mesh(roadGeo, segMat);
      roadMesh.position.set(midX, 0.01, midZ);
      roadMesh.receiveShadow = true;
      this.cityGroup.add(roadMesh);
    }

    // Build Intersections
    const interGeo = new THREE.PlaneGeometry(roadWidth, roadWidth);
    interGeo.rotateX(-Math.PI / 2);
    const interMat = new THREE.MeshStandardMaterial({
      color: 0x1f2429,
      roughness: 0.8
    });

    for (const inter of this.roadNetwork.intersections) {
      const interMesh = new THREE.Mesh(interGeo, interMat);
      interMesh.position.set(inter.x, 0.015, inter.z);
      interMesh.receiveShadow = true;
      this.cityGroup.add(interMesh);

      // Crosswalks on each of the 4 edges of the intersection
      this._addCrosswalk(inter.x, inter.z + roadWidth / 2, roadWidth, true);
      this._addCrosswalk(inter.x, inter.z - roadWidth / 2, roadWidth, true);
      this._addCrosswalk(inter.x + roadWidth / 2, inter.z, roadWidth, false);
      this._addCrosswalk(inter.x - roadWidth / 2, inter.z, roadWidth, false);
    }
  }

  _addCrosswalk(x, z, width, horizontal) {
    const stripeCount = 6;
    const stripeLen = 3.5;
    const stripeWidth = 1.0;
    const spacing = width / (stripeCount + 1);

    const stripeMat = new THREE.MeshBasicMaterial({ color: 0xf1f5f9 });

    for (let i = 1; i <= stripeCount; i++) {
      const offset = (i - (stripeCount + 1) / 2) * spacing;
      const geo = new THREE.PlaneGeometry(
        horizontal ? stripeWidth : stripeLen,
        horizontal ? stripeLen : stripeWidth
      );
      geo.rotateX(-Math.PI / 2);

      const mesh = new THREE.Mesh(geo, stripeMat);
      mesh.position.set(
        horizontal ? x + offset : x,
        0.02,
        horizontal ? z : z + offset
      );
      this.cityGroup.add(mesh);
    }
  }

  /**
   * Builds distinct city blocks populated with high-rises, skyscrapers, plazas, and parks.
   */
  _buildCityBlocks() {
    const spacing = this.roadNetwork.spacing;
    const roadWidth = this.roadNetwork.getCityBounds().roadWidth;
    const blockSize = spacing - roadWidth; // Block interior width (~54 units)
    const sidewalkWidth = 3.5;
    const buildingAreaSize = blockSize - sidewalkWidth * 2;

    const materialsList = [
      this.materials.glass,
      this.materials.cyber,
      this.materials.artDeco,
      this.materials.residential,
      this.materials.diagrid
    ];

    for (let ix = 0; ix < this.roadNetwork.gridSizeX - 1; ix++) {
      for (let iz = 0; iz < this.roadNetwork.gridSizeZ - 1; iz++) {
        const x1 = ix * spacing - this.roadNetwork.halfSizeX;
        const z1 = iz * spacing - this.roadNetwork.halfSizeZ;
        const blockCenterX = x1 + spacing / 2;
        const blockCenterZ = z1 + spacing / 2;

        // Elevated sidewalk foundation for the block
        const sidewalkGeo = new THREE.BoxGeometry(blockSize, 0.35, blockSize);
        const sidewalkMesh = new THREE.Mesh(sidewalkGeo, new THREE.MeshStandardMaterial({
          map: this.textures.sidewalk,
          roughness: 0.8
        }));
        sidewalkMesh.position.set(blockCenterX, 0.175, blockCenterZ);
        sidewalkMesh.receiveShadow = true;
        this.cityGroup.add(sidewalkMesh);

        // Special Central Park block at center
        const isCentralPark = (ix === 2 && iz === 2) || (ix === 3 && iz === 2);
        if (isCentralPark) {
          this._buildParkBlock(blockCenterX, blockCenterZ, buildingAreaSize);
          continue;
        }

        // Standard building block: select 1 to 2 buildings of varied patterns
        const blockType = (ix + iz * 3) % 5;
        this._buildBlockBuildings(blockCenterX, blockCenterZ, buildingAreaSize, blockType, materialsList);
      }
    }
  }

  /**
   * Builds 1, 2, or 4 varied architecture buildings inside a city block.
   */
  _buildBlockBuildings(centerX, centerZ, areaSize, blockType, materialsList) {
    // Variety of building heights: 30 to 110 units
    const baseHeight = 35 + ((centerX * 7 + centerZ * 13) % 65);
    const primaryMat = materialsList[blockType % materialsList.length];
    const secondaryMat = materialsList[(blockType + 2) % materialsList.length];

    if (baseHeight > 75) {
      // Single monumental skyscraper with stepped setbacks / spire
      const w = areaSize * 0.85;
      const d = areaSize * 0.85;
      const h1 = baseHeight * 0.65;
      const h2 = baseHeight * 0.35;

      // Base tower
      const bGeo = new THREE.BoxGeometry(w, h1, d);
      const bMesh = new THREE.Mesh(bGeo, primaryMat);
      bMesh.position.set(centerX, h1 / 2 + 0.35, centerZ);
      bMesh.castShadow = true;
      bMesh.receiveShadow = true;
      this.cityGroup.add(bMesh);

      // Stepped tier 2
      const tGeo = new THREE.BoxGeometry(w * 0.7, h2, d * 0.7);
      const tMesh = new THREE.Mesh(tGeo, secondaryMat);
      tMesh.position.set(centerX, h1 + h2 / 2 + 0.35, centerZ);
      tMesh.castShadow = true;
      this.cityGroup.add(tMesh);

      // Rooftop spire or helipad
      this._addRooftopDetails(centerX, centerZ, h1 + h2 + 0.35, w * 0.7, d * 0.7);

      // Collider
      const halfW = w / 2;
      const halfD = d / 2;
      this.buildingColliders.push({
        minX: centerX - halfW,
        maxX: centerX + halfW,
        minZ: centerZ - halfD,
        maxZ: centerZ + halfD,
        height: baseHeight
      });

    } else {
      // Split into 2 twin or asymmetrical buildings
      const halfArea = areaSize * 0.42;
      const offsetX = areaSize * 0.22;
      const hA = Math.max(22, baseHeight * 0.85);
      const hB = Math.max(18, baseHeight * 0.65);

      // Building A
      const bGeoA = new THREE.BoxGeometry(halfArea * 1.8, hA, halfArea);
      const bMeshA = new THREE.Mesh(bGeoA, primaryMat);
      bMeshA.position.set(centerX, hA / 2 + 0.35, centerZ - offsetX);
      bMeshA.castShadow = true;
      bMeshA.receiveShadow = true;
      this.cityGroup.add(bMeshA);
      this._addRooftopDetails(centerX, centerZ - offsetX, hA + 0.35, halfArea * 1.8, halfArea);

      this.buildingColliders.push({
        minX: centerX - (halfArea * 1.8) / 2,
        maxX: centerX + (halfArea * 1.8) / 2,
        minZ: (centerZ - offsetX) - halfArea / 2,
        maxZ: (centerZ - offsetX) + halfArea / 2,
        height: hA
      });

      // Building B
      const bGeoB = new THREE.BoxGeometry(halfArea * 1.8, hB, halfArea);
      const bMeshB = new THREE.Mesh(bGeoB, secondaryMat);
      bMeshB.position.set(centerX, hB / 2 + 0.35, centerZ + offsetX);
      bMeshB.castShadow = true;
      bMeshB.receiveShadow = true;
      this.cityGroup.add(bMeshB);
      this._addRooftopDetails(centerX, centerZ + offsetX, hB + 0.35, halfArea * 1.8, halfArea);

      this.buildingColliders.push({
        minX: centerX - (halfArea * 1.8) / 2,
        maxX: centerX + (halfArea * 1.8) / 2,
        minZ: (centerZ + offsetX) - halfArea / 2,
        maxZ: (centerZ + offsetX) + halfArea / 2,
        height: hB
      });
    }
  }

  /**
   * Adds rooftop helipad, antennas with blinking warning lights, and AC mechanical units.
   */
  _addRooftopDetails(x, z, roofY, width, depth) {
    // Mechanical room / elevator penthouse
    const mechW = width * 0.35;
    const mechD = depth * 0.35;
    const mechH = 4;
    const mechGeo = new THREE.BoxGeometry(mechW, mechH, mechD);
    const mechMesh = new THREE.Mesh(mechGeo, this.materials.roof);
    mechMesh.position.set(x + width * 0.15, roofY + mechH / 2, z + depth * 0.15);
    this.cityGroup.add(mechMesh);

    // Helipad if roof is large enough
    if (width > 24 && depth > 24) {
      const heliCanvas = document.createElement('canvas');
      heliCanvas.width = 128;
      heliCanvas.height = 128;
      const hCtx = heliCanvas.getContext('2d');
      hCtx.fillStyle = '#1e293b';
      hCtx.fillRect(0, 0, 128, 128);

      hCtx.strokeStyle = '#eab308';
      hCtx.lineWidth = 6;
      hCtx.beginPath();
      hCtx.arc(64, 64, 52, 0, Math.PI * 2);
      hCtx.stroke();

      hCtx.fillStyle = '#eab308';
      hCtx.font = 'bold 64px sans-serif';
      hCtx.textAlign = 'center';
      hCtx.textBaseline = 'middle';
      hCtx.fillText('H', 64, 64);

      const heliTex = new THREE.CanvasTexture(heliCanvas);
      const heliGeo = new THREE.PlaneGeometry(width * 0.5, depth * 0.5);
      heliGeo.rotateX(-Math.PI / 2);
      const heliMesh = new THREE.Mesh(heliGeo, new THREE.MeshBasicMaterial({ map: heliTex }));
      heliMesh.position.set(x - width * 0.15, roofY + 0.05, z - depth * 0.15);
      this.cityGroup.add(heliMesh);
    }

    // Communication antenna with flashing red beacon
    const mastH = 12;
    const mastGeo = new THREE.CylinderGeometry(0.15, 0.4, mastH, 8);
    const mastMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9 });
    const mastMesh = new THREE.Mesh(mastGeo, mastMat);
    mastMesh.position.set(x, roofY + mastH / 2, z);
    this.cityGroup.add(mastMesh);

    // Blinking red beacon light at top
    const beaconGeo = new THREE.SphereGeometry(0.45, 8, 8);
    const beaconMat = new THREE.MeshBasicMaterial({ color: 0xff0044 });
    const beaconMesh = new THREE.Mesh(beaconGeo, beaconMat);
    beaconMesh.position.set(x, roofY + mastH, z);
    this.cityGroup.add(beaconMesh);

    this.animatedElements.push({
      type: 'blink',
      mesh: beaconMesh,
      mat: beaconMat,
      frequency: 2.0 + Math.random()
    });
  }

  /**
   * Builds an urban park with greenery, walking paths, fountains, and trees.
   */
  _buildParkBlock(centerX, centerZ, size) {
    // Green grass lawn
    const grassGeo = new THREE.BoxGeometry(size, 0.4, size);
    const grassMat = new THREE.MeshStandardMaterial({
      color: 0x2d6a4f,
      roughness: 0.95
    });
    const grassMesh = new THREE.Mesh(grassGeo, grassMat);
    grassMesh.position.set(centerX, 0.2, centerZ);
    grassMesh.receiveShadow = true;
    this.cityGroup.add(grassMesh);

    // Central circular fountain / monument
    const fountainGeo = new THREE.CylinderGeometry(6, 6, 1.2, 16);
    const fountainMat = new THREE.MeshStandardMaterial({ color: 0x0077b6, metalness: 0.4, roughness: 0.2 });
    const fountainMesh = new THREE.Mesh(fountainGeo, fountainMat);
    fountainMesh.position.set(centerX, 0.8, centerZ);
    this.cityGroup.add(fountainMesh);

    // Trees arranged along the park borders
    const half = size * 0.38;
    const treeOffsets = [
      [-half, -half], [half, -half], [-half, half], [half, half],
      [0, -half], [0, half], [-half, 0], [half, 0]
    ];
    for (const [ox, oz] of treeOffsets) {
      this._addTree(centerX + ox, centerZ + oz);
    }
  }

  /**
   * Adds stylized low-poly trees with 3 distinct styles (Lush Green, Cherry Blossom, Evergreen).
   */
  _addTree(x, z, style = 0) {
    const trunkGeo = new THREE.CylinderGeometry(0.3, 0.5, 3.5, 6);
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x582f0e, roughness: 0.9 });
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.set(x, 1.75, z);
    trunk.castShadow = true;
    this.cityGroup.add(trunk);

    if (style === 1) {
      // Style 1: Cherry Blossom / Flowering Pink Tree
      const flowerMat = new THREE.MeshStandardMaterial({ color: 0xf472b6, roughness: 0.7 });
      const mainGeo = new THREE.SphereGeometry(2.4, 8, 8);
      const mainFoliage = new THREE.Mesh(mainGeo, flowerMat);
      mainFoliage.position.set(x, 4.6, z);
      mainFoliage.castShadow = true;
      this.cityGroup.add(mainFoliage);

      const topGeo = new THREE.SphereGeometry(1.6, 6, 6);
      const topFoliage = new THREE.Mesh(topGeo, flowerMat);
      topFoliage.position.set(x + 0.5, 5.8, z - 0.4);
      this.cityGroup.add(topFoliage);

    } else if (style === 2) {
      // Style 2: Conical / Cypress Evergreen Tree
      const coneMat = new THREE.MeshStandardMaterial({ color: 0x10b981, roughness: 0.8 });
      const foliageGeo = new THREE.ConeGeometry(2.2, 5.5, 7);
      const foliage = new THREE.Mesh(foliageGeo, coneMat);
      foliage.position.set(x, 5.0, z);
      foliage.castShadow = true;
      this.cityGroup.add(foliage);

    } else {
      // Style 0: Lush Bright Deciduous Green Tree
      const greenMat = new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.7 });
      const sphereGeo1 = new THREE.SphereGeometry(2.2, 8, 8);
      const f1 = new THREE.Mesh(sphereGeo1, greenMat);
      f1.position.set(x, 4.4, z);
      f1.castShadow = true;
      this.cityGroup.add(f1);

      const sphereGeo2 = new THREE.SphereGeometry(1.7, 7, 7);
      const f2 = new THREE.Mesh(sphereGeo2, greenMat);
      f2.position.set(x - 0.5, 5.4, z + 0.4);
      this.cityGroup.add(f2);
    }
  }

  /**
   * Adds street furniture: modern LED streetlights, sidewalk trees along all avenues, and flower planters.
   */
  _buildStreetFurniture() {
    const spacing = this.roadNetwork.spacing;
    const roadWidth = this.roadNetwork.getCityBounds().roadWidth;
    const halfW = roadWidth / 2 + 1.8;

    const lampMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8 });
    const lightGlowMat = new THREE.MeshBasicMaterial({ color: 0xffedd5 });

    // 1. Streetlamps at intersection corners
    for (let ix = 0; ix < this.roadNetwork.gridSizeX; ix++) {
      for (let iz = 0; iz < this.roadNetwork.gridSizeZ; iz++) {
        const cx = ix * spacing - this.roadNetwork.halfSizeX;
        const cz = iz * spacing - this.roadNetwork.halfSizeZ;

        const corners = [
          [cx + halfW, cz + halfW],
          [cx - halfW, cz - halfW]
        ];

        for (const [lx, lz] of corners) {
          const poleH = 7.5;
          const poleGeo = new THREE.CylinderGeometry(0.12, 0.18, poleH, 6);
          const poleMesh = new THREE.Mesh(poleGeo, lampMat);
          poleMesh.position.set(lx, poleH / 2, lz);
          this.cityGroup.add(poleMesh);

          const armGeo = new THREE.BoxGeometry(1.8, 0.12, 0.15);
          const armMesh = new THREE.Mesh(armGeo, lampMat);
          armMesh.position.set(lx - 0.7, poleH, lz);
          this.cityGroup.add(armMesh);

          const bulbGeo = new THREE.SphereGeometry(0.35, 8, 8);
          const bulbMesh = new THREE.Mesh(bulbGeo, lightGlowMat);
          bulbMesh.position.set(lx - 1.4, poleH - 0.1, lz);
          this.cityGroup.add(bulbMesh);
        }
      }
    }

    // 2. Abundant Trees Placed Along Every Sidewalk Block
    const treeSidewalkDist = roadWidth / 2 + 2.8;
    for (let ix = 0; ix < this.roadNetwork.gridSizeX - 1; ix++) {
      for (let iz = 0; iz < this.roadNetwork.gridSizeZ - 1; iz++) {
        const x1 = ix * spacing - this.roadNetwork.halfSizeX;
        const z1 = iz * spacing - this.roadNetwork.halfSizeZ;
        const blockCenterX = x1 + spacing / 2;
        const blockCenterZ = z1 + spacing / 2;

        const styleA = (ix + iz) % 3;
        const styleB = (ix * 2 + iz) % 3;

        // Along East-West Sidewalks
        this._addTree(blockCenterX - 14, blockCenterZ - treeSidewalkDist, styleA);
        this._addTree(blockCenterX + 14, blockCenterZ - treeSidewalkDist, styleB);
        this._addTree(blockCenterX - 14, blockCenterZ + treeSidewalkDist, styleB);
        this._addTree(blockCenterX + 14, blockCenterZ + treeSidewalkDist, styleA);

        // Along North-South Sidewalks
        this._addTree(blockCenterX - treeSidewalkDist, blockCenterZ - 14, styleB);
        this._addTree(blockCenterX - treeSidewalkDist, blockCenterZ + 14, styleA);
        this._addTree(blockCenterX + treeSidewalkDist, blockCenterZ - 14, styleA);
        this._addTree(blockCenterX + treeSidewalkDist, blockCenterZ + 14, styleB);
      }
    }
  }

  /**
   * Checks collision between a point (or circle around the car) and all city buildings.
   * @param {number} carX
   * @param {number} carZ
   * @param {number} [radius=1.8]
   * @returns {{ collided: boolean, normalX: number, normalZ: number, overlap: number } | null}
   */
  checkCarCollision(carX, carZ, radius = 1.8) {
    for (const b of this.buildingColliders) {
      // Find closest point on building AABB to car center
      const closestX = Math.max(b.minX, Math.min(carX, b.maxX));
      const closestZ = Math.max(b.minZ, Math.min(carZ, b.maxZ));

      const dx = carX - closestX;
      const dz = carZ - closestZ;
      const distSq = dx * dx + dz * dz;

      if (distSq < radius * radius) {
        const dist = Math.sqrt(distSq) || 0.001;
        const overlap = radius - dist;
        return {
          collided: true,
          normalX: dx / dist,
          normalZ: dz / dist,
          overlap
        };
      }
    }
    return null;
  }

  /**
   * Update animated components like blinking rooftop aircraft beacons.
   * @param {number} elapsedTime
   */
  update(elapsedTime) {
    for (const item of this.animatedElements) {
      if (item.type === 'blink') {
        const isOn = Math.sin(elapsedTime * item.frequency * Math.PI * 2) > 0;
        item.mesh.visible = isOn;
      }
    }
  }
}
