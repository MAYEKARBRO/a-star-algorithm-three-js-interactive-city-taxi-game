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

    // Animated meshes (blinking lights, rotating beacons, neon signs, basketballs)
    this.animatedElements = [];
    this.basketballPlayers = [];
    this.buildingNeonElements = [];
    this.forestAnimals = [];
    this.forestPuddles = [];
    this.currentWeatherMode = 'DAY';

    // Interactive Safehouse Tuning Bay & Bed
    this.safehouseLocation = null;
    this.safehouseBedPos = null;
    this.safehouseCooldown = 0;

    // Interactive Food Stalls
    this.foodStalls = [];

    // Cached procedural textures and materials
    this.textures = this._createProceduralTextures();
    this.materials = this._createMaterials();

    this._buildRoadsAndSidewalks();
    this._buildCityBlocks();
    this._buildFoodStalls();
    this._buildStreetFurniture();
    this._buildPerimeterForest();
  }

  /**
   * Generates high-resolution procedural canvas textures for distinct building patterns.
   * Eliminates asset load errors and provides crisp, vibrant visuals.
   */
  _createProceduralTextures() {
    const textures = {};

    // Helper: configure repeat wrapping
    const setupTex = (canvas) => {
      const tex = new THREE.CanvasTexture(canvas);
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      return tex;
    };

    // -------------------------------------------------------------
    // Pattern 1: Ultra-Realistic Modern Glass Curtain Skyscraper
    // -------------------------------------------------------------
    {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 512;
      const ctx = canvas.getContext('2d');

      // Realistic sky-to-ground reflective gradient
      const grad = ctx.createLinearGradient(0, 0, 0, 512);
      grad.addColorStop(0, '#0a192f');
      grad.addColorStop(0.3, '#132c4a');
      grad.addColorStop(0.7, '#1b3a57');
      grad.addColorStop(1, '#0c1b2a');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 512, 512);

      const cols = 8;
      const rows = 16;
      const colW = 512 / cols;
      const rowH = 512 / rows;

      // Floor slab spandrels and window bays
      for (let r = 0; r < rows; r++) {
        const y = r * rowH;

        // Dark horizontal spandrel beam
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, y, 512, 4);

        // Windows in this floor
        for (let c = 0; c < cols; c++) {
          const x = c * colW;
          const winX = x + 3;
          const winY = y + 4;
          const winW = colW - 6;
          const winH = rowH - 6;

          // Glass specular gradient
          const winGrad = ctx.createLinearGradient(winX, winY, winX, winY + winH);
          const isLit = ((c * 7 + r * 13) % 10) > 4;

          if (isLit) {
            const warm = ((c + r) % 3) === 0;
            const glowCol = warm ? '#fef08a' : '#bfdbfe';
            winGrad.addColorStop(0, glowCol);
            winGrad.addColorStop(0.6, warm ? '#ca8a04' : '#3b82f6');
            winGrad.addColorStop(1, '#1e293b');
          } else {
            winGrad.addColorStop(0, '#1e3a5f');
            winGrad.addColorStop(0.5, '#0f2338');
            winGrad.addColorStop(1, '#071320');
          }
          ctx.fillStyle = winGrad;
          ctx.fillRect(winX, winY, winW, winH);

          // Horizontal venetian blinds
          if (isLit && Math.random() > 0.4) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
            const blindCount = 4;
            for (let b = 1; b <= blindCount; b++) {
              ctx.fillRect(winX, winY + (winH / (blindCount + 1)) * b, winW, 1.5);
            }
          }

          // Specular glass highlight reflection across diagonal
          ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
          ctx.beginPath();
          ctx.moveTo(winX, winY);
          ctx.lineTo(winX + winW * 0.4, winY);
          ctx.lineTo(winX, winY + winH * 0.7);
          ctx.closePath();
          ctx.fill();
        }
      }

      // Vertical structural aluminum mullions
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 3;
      for (let c = 0; c <= cols; c++) {
        ctx.beginPath();
        ctx.moveTo(c * colW, 0);
        ctx.lineTo(c * colW, 512);
        ctx.stroke();
      }

      textures.glassCurtain = setupTex(canvas);
    }

    // -------------------------------------------------------------
    // Pattern 2: Cyberpunk / Commercial Storefronts
    // -------------------------------------------------------------
    {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 512;
      const ctx = canvas.getContext('2d');

      ctx.fillStyle = '#0b0f19';
      ctx.fillRect(0, 0, 512, 512);

      // Dark metallic facade panels
      for (let y = 0; y < 512; y += 64) {
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 2;
        ctx.strokeRect(0, y, 512, 64);
      }

      // Neon vertical stripes
      const neonColors = ['#ff007f', '#00f0ff', '#a855f7', '#10b981'];
      for (let i = 0; i < 5; i++) {
        const x = 50 + i * 100;
        const color = neonColors[i % neonColors.length];
        ctx.strokeStyle = color;
        ctx.lineWidth = 5;
        ctx.shadowColor = color;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.moveTo(x, 15);
        ctx.lineTo(x, 495);
        ctx.stroke();
      }

      // Digital storefront & holographic displays
      ctx.shadowBlur = 12;
      ctx.fillStyle = '#111827';
      ctx.fillRect(40, 190, 432, 130);
      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 3;
      ctx.strokeRect(40, 190, 432, 130);

      ctx.fillStyle = '#ff007f';
      ctx.font = 'bold 38px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('NEO METROPOLIS', 256, 250);

      ctx.fillStyle = '#00f0ff';
      ctx.font = 'bold 18px monospace';
      ctx.fillText('A* AUTONOMOUS TAXI TRANSIT', 256, 290);

      textures.cyberNeon = setupTex(canvas);
    }

    // -------------------------------------------------------------
    // Pattern 3: Art-Deco / Stepped Architecture & Limestone
    // -------------------------------------------------------------
    {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 512;
      const ctx = canvas.getContext('2d');

      // Warm limestone & sandstone tone
      ctx.fillStyle = '#26221d';
      ctx.fillRect(0, 0, 512, 512);

      const cols = 8;
      const w = 512 / cols;
      for (let c = 0; c < cols; c++) {
        const x = c * w;
        ctx.fillStyle = c % 2 === 0 ? '#383129' : '#453c33';
        ctx.fillRect(x, 0, w, 512);

        // Fluted vertical relief lines
        ctx.strokeStyle = '#574c40';
        ctx.lineWidth = 2;
        ctx.strokeRect(x + 2, 0, w - 4, 512);

        // Ornate Art-Deco Amber Windows
        for (let y = 16; y < 500; y += 48) {
          const isLit = ((c * 5 + y) % 7) > 2;
          ctx.fillStyle = isLit ? '#f59e0b' : '#1c1917';
          ctx.fillRect(x + 8, y, w - 16, 32);

          // Brass geometric window grill
          ctx.strokeStyle = '#d97706';
          ctx.lineWidth = 1.5;
          ctx.strokeRect(x + 8, y, w - 16, 32);

          // Diagonal decorative chevron inside window
          ctx.beginPath();
          ctx.moveTo(x + 8, y + 16);
          ctx.lineTo(x + w / 2, y + 6);
          ctx.lineTo(x + w - 8, y + 16);
          ctx.stroke();
        }
      }

      textures.artDeco = setupTex(canvas);
    }

    // -------------------------------------------------------------
    // Pattern 4: Residential Brick & Terraced Balconies
    // -------------------------------------------------------------
    {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 512;
      const ctx = canvas.getContext('2d');

      // Realistic running bond brick masonry
      ctx.fillStyle = '#3b1d1d';
      ctx.fillRect(0, 0, 512, 512);

      const floors = 8;
      const units = 4;
      const fH = 512 / floors;
      const uW = 512 / units;

      for (let f = 0; f < floors; f++) {
        for (let u = 0; u < units; u++) {
          const bx = u * uW + 10;
          const by = f * fH + 10;
          const bw = uW - 20;
          const bh = fH - 20;

          // Balcony recess
          ctx.fillStyle = '#18181b';
          ctx.fillRect(bx, by, bw, bh);

          // Glass balcony railing with teal reflection
          ctx.fillStyle = 'rgba(56, 189, 248, 0.45)';
          ctx.fillRect(bx, by + bh * 0.52, bw, bh * 0.48);
          ctx.strokeStyle = '#94a3b8';
          ctx.lineWidth = 2;
          ctx.strokeRect(bx, by + bh * 0.52, bw, bh * 0.48);

          // Interior room window with warm residential glow
          ctx.fillStyle = ((f + u * 3) % 4) > 1 ? '#fef3c7' : '#27272a';
          ctx.fillRect(bx + 6, by + 4, bw - 12, bh * 0.46);
        }
      }

      textures.residential = setupTex(canvas);
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

      // Diamond diagrid steel truss beams
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 5;
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
      ctx.fillStyle = 'rgba(56, 189, 248, 0.2)';
      for (let y = 0; y < 512; y += 64) {
        for (let x = 0; x < 512; x += 64) {
          if (((x + y) % 128) === 0) {
            ctx.beginPath();
            ctx.arc(x + 32, y + 32, 14, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      textures.diagrid = setupTex(canvas);
    }

    // -------------------------------------------------------------
    // Pattern 6: Hospital Medical Tower Facade
    // -------------------------------------------------------------
    {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 512;
      const ctx = canvas.getContext('2d');

      // Sterile modern white architectural composite cladding
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(0, 0, 512, 512);

      // Horizontal medical blue ribbon windows
      const floors = 8;
      const fH = 512 / floors;
      for (let f = 0; f < floors; f++) {
        const y = f * fH;
        // Joint seam
        ctx.fillStyle = '#cbd5e1';
        ctx.fillRect(0, y, 512, 4);

        // Ribbon window
        ctx.fillStyle = '#0369a1';
        ctx.fillRect(16, y + 14, 480, fH - 28);

        // Turquoise glass reflection
        ctx.fillStyle = 'rgba(56, 189, 248, 0.35)';
        ctx.fillRect(16, y + 14, 480, (fH - 28) * 0.4);

        // Medical window dividers
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 2;
        for (let x = 16; x < 496; x += 40) {
          ctx.beginPath();
          ctx.moveTo(x, y + 14);
          ctx.lineTo(x, y + fH - 14);
          ctx.stroke();
        }
      }

      textures.hospitalFacade = setupTex(canvas);
    }

    // -------------------------------------------------------------
    // Pattern 7: Police Station Reinforced Granite & Glass
    // -------------------------------------------------------------
    {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 512;
      const ctx = canvas.getContext('2d');

      // Stately dark charcoal granite
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, 0, 512, 512);

      // Heavy granite stone block joints
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 3;
      for (let y = 0; y <= 512; y += 64) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(512, y);
        ctx.stroke();
      }
      for (let x = 0; x <= 512; x += 128) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, 512);
        ctx.stroke();
      }

      // Police Blue illumination horizontal bands
      ctx.fillStyle = '#1d4ed8';
      ctx.shadowColor = '#3b82f6';
      ctx.shadowBlur = 8;
      ctx.fillRect(0, 240, 512, 12);
      ctx.shadowBlur = 0;

      textures.policeFacade = setupTex(canvas);
    }

    // -------------------------------------------------------------
    // Pattern 8: Classic Red Brick Firehouse
    // -------------------------------------------------------------
    {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 512;
      const ctx = canvas.getContext('2d');

      // Traditional firehouse brick
      ctx.fillStyle = '#7f1d1d';
      ctx.fillRect(0, 0, 512, 512);

      // Mortar lines
      ctx.strokeStyle = '#450a0a';
      ctx.lineWidth = 2;
      const brickH = 16;
      const brickW = 32;
      for (let y = 0; y < 512; y += brickH) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(512, y);
        ctx.stroke();

        const offset = ((y / brickH) % 2) * (brickW / 2);
        for (let x = offset; x < 512; x += brickW) {
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x, y + brickH);
          ctx.stroke();
        }
      }

      // Arched garage lintels in limestone
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(40, 480, 432, 24);

      textures.firehouseBrick = setupTex(canvas);
    }

    // -------------------------------------------------------------
    // Pattern 9: Google Tech Campus Curved Solar Glass
    // -------------------------------------------------------------
    {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 512;
      const ctx = canvas.getContext('2d');

      // Modern crystalline turquoise/cyan solar glass
      ctx.fillStyle = '#0f766e';
      ctx.fillRect(0, 0, 512, 512);

      const rows = 12;
      const rowH = 512 / rows;
      for (let r = 0; r < rows; r++) {
        const y = r * rowH;
        // White modern spandrel beam
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(0, y, 512, 6);

        // Glass gradient with sky reflection
        const winGrad = ctx.createLinearGradient(0, y + 6, 0, y + rowH);
        winGrad.addColorStop(0, '#38bdf8');
        winGrad.addColorStop(0.5, '#0ea5e9');
        winGrad.addColorStop(1, '#0284c7');
        ctx.fillStyle = winGrad;
        ctx.fillRect(0, y + 6, 512, rowH - 6);

        // Sleek white vertical mullions
        ctx.strokeStyle = '#f1f5f9';
        ctx.lineWidth = 2;
        for (let x = 0; x <= 512; x += 42) {
          ctx.beginPath();
          ctx.moveTo(x, y + 6);
          ctx.lineTo(x, y + rowH);
          ctx.stroke();
        }
      }

      textures.googleCampus = setupTex(canvas);
    }

    // -------------------------------------------------------------
    // Pattern 10: Suburban Residential Clapboard Siding
    // -------------------------------------------------------------
    {
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 256;
      const ctx = canvas.getContext('2d');

      ctx.fillStyle = '#f1f5f9';
      ctx.fillRect(0, 0, 256, 256);

      // Horizontal siding planks with drop shadows
      const plankH = 16;
      for (let y = 0; y < 256; y += plankH) {
        // Plank gradient
        const pGrad = ctx.createLinearGradient(0, y, 0, y + plankH);
        pGrad.addColorStop(0, '#f8fafc');
        pGrad.addColorStop(0.85, '#e2e8f0');
        pGrad.addColorStop(1, '#94a3b8');
        ctx.fillStyle = pGrad;
        ctx.fillRect(0, y, 256, plankH);

        // Shadow groove under each lap plank
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.fillRect(0, y + plankH - 2, 256, 2);
      }

      textures.suburbanSiding = setupTex(canvas);
    }

    // -------------------------------------------------------------
    // Pattern 11: Parquet Hardwood Floor for Safehouse Interior
    // -------------------------------------------------------------
    {
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 256;
      const ctx = canvas.getContext('2d');

      // Warm honey-oak parquet
      ctx.fillStyle = '#78350f';
      ctx.fillRect(0, 0, 256, 256);

      const blockS = 32;
      for (let y = 0; y < 256; y += blockS) {
        for (let x = 0; x < 256; x += blockS) {
          const isHoriz = ((x / blockS + y / blockS) % 2) === 0;
          ctx.fillStyle = isHoriz ? '#92400e' : '#b45309';
          ctx.fillRect(x, y, blockS, blockS);

          ctx.strokeStyle = '#451a03';
          ctx.lineWidth = 1.5;
          ctx.strokeRect(x, y, blockS, blockS);

          // Internal planks
          const strips = 4;
          const stripW = blockS / strips;
          for (let s = 1; s < strips; s++) {
            ctx.beginPath();
            if (isHoriz) {
              ctx.moveTo(x, y + s * stripW);
              ctx.lineTo(x + blockS, y + s * stripW);
            } else {
              ctx.moveTo(x + s * stripW, y);
              ctx.lineTo(x + s * stripW, y + blockS);
            }
            ctx.stroke();
          }
        }
      }

      textures.hardwood = setupTex(canvas);
    }

    // -------------------------------------------------------------
    // Pattern 12: Moroccan Geometric Rug for Safehouse Living Room
    // -------------------------------------------------------------
    {
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 256;
      const ctx = canvas.getContext('2d');

      ctx.fillStyle = '#f8fafc'; // Off-white wool base
      ctx.fillRect(0, 0, 256, 256);

      // Charcoal geometric diamond trellis
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 4;
      for (let i = -128; i <= 384; i += 64) {
        ctx.beginPath();
        ctx.moveTo(i, 0); ctx.lineTo(i + 256, 256); ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(i, 256); ctx.lineTo(i + 256, 0); ctx.stroke();
      }

      textures.rug = setupTex(canvas);
    }

    // -------------------------------------------------------------
    // Pattern 13: Glowing TV Screen
    // -------------------------------------------------------------
    {
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 144;
      const ctx = canvas.getContext('2d');

      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, 256, 144);

      // Mini game screen graphics
      ctx.fillStyle = '#10b981';
      ctx.font = 'bold 18px monospace';
      ctx.fillText('GTA: METROPOLIS 3D', 20, 36);

      ctx.fillStyle = '#38bdf8';
      ctx.font = '14px monospace';
      ctx.fillText('STATUS: SAFE & SECURE', 20, 64);
      ctx.fillText('GARAGE: TUNED • 100% NITRO', 20, 88);

      // Radar graphic on TV
      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(200, 72, 32, 0, Math.PI * 2);
      ctx.stroke();

      textures.tvScreen = setupTex(canvas);
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
      ctx.fillStyle = '#181b1e';
      ctx.fillRect(0, 0, 256, 256);

      // Road grain
      for (let i = 0; i < 400; i++) {
        const x = Math.random() * 256;
        const y = Math.random() * 256;
        const c = 22 + Math.random() * 22;
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

      textures.asphalt = setupTex(canvas);
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

      textures.sidewalk = setupTex(canvas);
    }

    // -------------------------------------------------------------
    // Forest Grass & Moss Loam Ground Texture
    // -------------------------------------------------------------
    {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 512;
      const ctx = canvas.getContext('2d');

      // Base lush dark emerald green
      ctx.fillStyle = '#14532d';
      ctx.fillRect(0, 0, 512, 512);

      // Fine grass blades and clover texture
      for (let i = 0; i < 4000; i++) {
        const x = Math.random() * 512;
        const y = Math.random() * 512;
        const len = 3 + Math.random() * 7;
        const shade = Math.random() > 0.5 ? '#166534' : (Math.random() > 0.5 ? '#15803d' : '#22c55e');
        ctx.strokeStyle = shade;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + (Math.random() - 0.5) * 4, y - len);
        ctx.stroke();
      }

      // Mossy loam patches
      for (let i = 0; i < 60; i++) {
        const cx = Math.random() * 512;
        const cy = Math.random() * 512;
        const rad = 10 + Math.random() * 24;
        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, rad);
        grad.addColorStop(0, 'rgba(21, 128, 61, 0.45)');
        grad.addColorStop(1, 'rgba(20, 83, 45, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(cx, cy, rad, 0, Math.PI * 2);
        ctx.fill();
      }

      textures.forestGrass = setupTex(canvas);
    }

    // -------------------------------------------------------------
    // Mud-Red Walking Pavement (Terracotta Clay Brick Pavers)
    // -------------------------------------------------------------
    {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 512;
      const ctx = canvas.getContext('2d');

      // Base earthy mud-red / terracotta tone
      ctx.fillStyle = '#7f1d1d';
      ctx.fillRect(0, 0, 512, 512);

      // Paved clay pavers in running bond pattern
      const rows = 16;
      const cols = 8;
      const rowH = 512 / rows;
      const colW = 512 / cols;

      for (let r = 0; r < rows; r++) {
        const y = r * rowH;
        const xOffset = (r % 2 === 0) ? 0 : colW / 2;

        for (let c = -1; c <= cols; c++) {
          const x = c * colW + xOffset;
          const pW = colW - 4;
          const pH = rowH - 4;

          // Mud-red brick gradient
          const brickGrad = ctx.createLinearGradient(x, y, x, y + pH);
          const toneChoice = (r * 3 + c * 5) % 4;
          if (toneChoice === 0) {
            brickGrad.addColorStop(0, '#991b1b');
            brickGrad.addColorStop(1, '#7f1d1d');
          } else if (toneChoice === 1) {
            brickGrad.addColorStop(0, '#a82c2c');
            brickGrad.addColorStop(1, '#8b1e1e');
          } else if (toneChoice === 2) {
            brickGrad.addColorStop(0, '#881337');
            brickGrad.addColorStop(1, '#701a35');
          } else {
            brickGrad.addColorStop(0, '#b91c1c');
            brickGrad.addColorStop(1, '#991b1b');
          }

          ctx.fillStyle = brickGrad;
          ctx.fillRect(x + 2, y + 2, pW, pH);

          // Subtle stone flecks & clay highlights
          ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
          ctx.fillRect(x + 4, y + 3, pW * 0.4, 2);

          // Darker bevel shadow
          ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
          ctx.fillRect(x + 2, y + pH - 1, pW, 2);
          ctx.fillRect(x + pW - 1, y + 2, 2, pH);
        }
      }

      // Mortar joint grid lines
      ctx.strokeStyle = '#450a0a';
      ctx.lineWidth = 3;
      for (let r = 0; r <= rows; r++) {
        ctx.beginPath();
        ctx.moveTo(0, r * rowH);
        ctx.lineTo(512, r * rowH);
        ctx.stroke();
      }

      textures.mudRedPavement = setupTex(canvas);
    }

    return textures;
  }

  _createMaterials() {
    return {
      glass: new THREE.MeshStandardMaterial({
        map: this.textures.glassCurtain,
        roughness: 0.15,
        metalness: 0.88,
        color: 0x90e0ef
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
      hospital: new THREE.MeshStandardMaterial({
        map: this.textures.hospitalFacade,
        roughness: 0.2,
        metalness: 0.4
      }),
      police: new THREE.MeshStandardMaterial({
        map: this.textures.policeFacade,
        roughness: 0.3,
        metalness: 0.7
      }),
      firehouse: new THREE.MeshStandardMaterial({
        map: this.textures.firehouseBrick,
        roughness: 0.8,
        metalness: 0.1
      }),
      google: new THREE.MeshStandardMaterial({
        map: this.textures.googleCampus,
        roughness: 0.1,
        metalness: 0.85
      }),
      suburbanSiding: new THREE.MeshStandardMaterial({
        map: this.textures.suburbanSiding,
        roughness: 0.75,
        metalness: 0.1
      }),
      hardwood: new THREE.MeshStandardMaterial({
        map: this.textures.hardwood,
        roughness: 0.45,
        metalness: 0.15
      }),
      rug: new THREE.MeshStandardMaterial({
        map: this.textures.rug,
        roughness: 0.95
      }),
      tv: new THREE.MeshStandardMaterial({
        map: this.textures.tvScreen,
        emissive: 0x00f0ff,
        emissiveIntensity: 0.5,
        roughness: 0.2
      }),
      forestGrass: new THREE.MeshStandardMaterial({
        map: this.textures.forestGrass,
        color: 0x15803d,
        roughness: 0.85,
        metalness: 0.05
      }),
      mudRedPavement: new THREE.MeshStandardMaterial({
        map: this.textures.mudRedPavement,
        color: 0x991b1b,
        roughness: 0.78,
        metalness: 0.12
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
    const cityWidth = bounds.maxX - bounds.minX + 360;
    const cityDepth = bounds.maxZ - bounds.minZ + 360;

    // Ground plane underneath entire city and surrounding wilderness
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

        // 1. Special Central Park 2x2 blocks at the center of 9x9 grid
        const isCentralPark = (ix === 3 && iz === 3) || (ix === 4 && iz === 3) || (ix === 3 && iz === 4) || (ix === 4 && iz === 4);
        if (isCentralPark) {
          this._buildParkBlock(blockCenterX, blockCenterZ, buildingAreaSize);
          continue;
        }

        // 2. Driver's Enterable Safehouse & Workshop Garage at block [1, 6]
        if (ix === 1 && iz === 6) {
          this._buildEnterableSafehouse(blockCenterX, blockCenterZ, buildingAreaSize);
          continue;
        }

        // 3. Downtown Street Basketball Court at block [5, 2]
        if (ix === 5 && iz === 2) {
          this._buildBasketballCourt(blockCenterX, blockCenterZ, buildingAreaSize);
          continue;
        }

        // 4. Metropolis General Hospital & ER Ambulance Bay at block [6, 6]
        if (ix === 6 && iz === 6) {
          this._buildHospital(blockCenterX, blockCenterZ, buildingAreaSize);
          continue;
        }

        // 5. Metropolis Police Department (Precinct 99) at block [2, 1]
        if (ix === 2 && iz === 1) {
          this._buildPoliceStation(blockCenterX, blockCenterZ, buildingAreaSize);
          continue;
        }

        // 6. Metropolis Fire Department (Station 51) at block [1, 2]
        if (ix === 1 && iz === 2) {
          this._buildFireStation(blockCenterX, blockCenterZ, buildingAreaSize);
          continue;
        }

        // 7. Google Tech Campus & Android Plaza at block [5, 5]
        if (ix === 5 && iz === 5) {
          this._buildGoogleHQ(blockCenterX, blockCenterZ, buildingAreaSize);
          continue;
        }

        // 8. Maplewood Residential Neighbourhood at block [2, 7]
        if (ix === 2 && iz === 7) {
          this._buildResidentialQuarter(blockCenterX, blockCenterZ, buildingAreaSize);
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

      // Add radiant nighttime neon light trims, vertical edge bars & glowing cornices
      this._addBuildingNeonLights(centerX, centerZ, w, d, h1, blockType, 0);
      this._addBuildingNeonLights(centerX, centerZ, w * 0.7, d * 0.7, h2, blockType + 1, h1);

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
      this._addBuildingNeonLights(centerX, centerZ - offsetX, halfArea * 1.8, halfArea, hA, blockType, 0);
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
      this._addBuildingNeonLights(centerX, centerZ + offsetX, halfArea * 1.8, halfArea, hB, blockType + 2, 0);
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
   * Builds the Driver's Enterable Safehouse & Speed Shop Garage:
   * Walk-in living quarters with hardwood floors, sofa, TV, kitchenette, bed,
   * connecting garage workshop with hydraulic car lift, toolboxes, and nitro tuning bay.
   */
  _buildEnterableSafehouse(centerX, centerZ, size) {
    this.safehouseLocation = {
      x: centerX - 5,
      z: centerZ,
      radius: 9.5
    };

    // Bed rest location inside living quarters
    this.safehouseBedPos = {
      x: centerX + 13.5,
      y: 0.35,
      z: centerZ - 6.5
    };

    const safehouseGroup = new THREE.Group();
    this.cityGroup.add(safehouseGroup);

    // =============================================================
    // 1. WORKSHOP GARAGE (LEFT SIDE: centerX - 18 to centerX + 2.5)
    // =============================================================
    // Concrete Workshop Floor
    const floorGeo = new THREE.BoxGeometry(20, 0.38, 24);
    const floorMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.7 });
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.position.set(centerX - 8, 0.19, centerZ);
    floorMesh.receiveShadow = true;
    safehouseGroup.add(floorMesh);

    // Smooth asphalt approach ramp connecting street to garage bay
    const rampGeo = new THREE.BoxGeometry(16, 0.36, 12);
    const rampMat = new THREE.MeshStandardMaterial({ color: 0x1f2429, roughness: 0.85 });
    const rampMesh = new THREE.Mesh(rampGeo, rampMat);
    rampMesh.position.set(centerX - 8, 0.18, centerZ + 16);
    rampMesh.receiveShadow = true;
    safehouseGroup.add(rampMesh);

    // Yellow-Black Hazard Floor Stripes
    const stripeGeo = new THREE.PlaneGeometry(18, 0.8);
    stripeGeo.rotateX(-Math.PI / 2);
    const stripeMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
    const stripeMesh = new THREE.Mesh(stripeGeo, stripeMat);
    stripeMesh.position.set(centerX - 8, 0.39, centerZ + 11.5);
    safehouseGroup.add(stripeMesh);

    // Industrial Steel Columns
    const steelMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.85, roughness: 0.3 });
    const roofMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.7, roughness: 0.4 });
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.8 });

    const postGeo = new THREE.BoxGeometry(0.5, 7.5, 0.5);
    const colCoords = [
      [centerX - 17.5, centerZ - 11.5],
      [centerX + 2.0, centerZ - 11.5],
      [centerX - 17.5, centerZ + 11.5],
      [centerX + 2.0, centerZ + 11.5]
    ];
    for (const [cx, cz] of colCoords) {
      const col = new THREE.Mesh(postGeo, steelMat);
      col.position.set(cx, 3.75, cz);
      col.castShadow = true;
      safehouseGroup.add(col);
    }

    // Corrugated Steel Roof over Garage
    const roofGeo = new THREE.BoxGeometry(20.5, 0.4, 25);
    const roof = new THREE.Mesh(roofGeo, roofMat);
    roof.position.set(centerX - 8, 7.8, centerZ);
    roof.rotateX(-0.05);
    roof.castShadow = true;
    safehouseGroup.add(roof);

    // Garage Left Wall & Back Wall
    const backWall = new THREE.Mesh(new THREE.BoxGeometry(19.5, 7.5, 0.6), wallMat);
    backWall.position.set(centerX - 8, 3.75, centerZ - 11.7);
    backWall.castShadow = true;
    safehouseGroup.add(backWall);

    const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.6, 7.5, 23.5), wallMat);
    leftWall.position.set(centerX - 17.8, 3.75, centerZ);
    leftWall.castShadow = true;
    safehouseGroup.add(leftWall);

    // Glowing Neon Sign: "DRIVER SAFEHOUSE & SPEED SHOP"
    const signCanvas = document.createElement('canvas');
    signCanvas.width = 512;
    signCanvas.height = 128;
    const sCtx = signCanvas.getContext('2d');
    sCtx.fillStyle = '#090d16';
    sCtx.fillRect(0, 0, 512, 128);
    sCtx.strokeStyle = '#00f0ff';
    sCtx.lineWidth = 6;
    sCtx.strokeRect(6, 6, 500, 116);
    sCtx.fillStyle = '#ffb703';
    sCtx.font = 'bold 34px sans-serif';
    sCtx.textAlign = 'center';
    sCtx.fillText('🚕 DRIVER SAFEHOUSE 🔧', 256, 52);
    sCtx.fillStyle = '#00f0ff';
    sCtx.font = 'bold 20px monospace';
    sCtx.fillText('SPEED SHOP • NITRO REFILL • 24/7', 256, 92);

    const signTex = new THREE.CanvasTexture(signCanvas);
    const signMat = new THREE.MeshStandardMaterial({
      map: signTex,
      emissive: 0x00f0ff,
      emissiveIntensity: 0.85,
      roughness: 0.2
    });
    const signMesh = new THREE.Mesh(new THREE.BoxGeometry(16, 2.4, 0.4), signMat);
    signMesh.position.set(centerX - 8, 8.6, centerZ + 12);
    safehouseGroup.add(signMesh);

    this.animatedElements.push({
      type: 'neonFlicker',
      mat: signMat,
      baseIntensity: 0.85
    });

    // 2-Post Hydraulic Car Lift
    const liftMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.8, roughness: 0.25 });
    const liftArmMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.6 });
    const liftColGeo = new THREE.BoxGeometry(0.4, 5.8, 0.4);

    const liftColL = new THREE.Mesh(liftColGeo, liftMat);
    liftColL.position.set(centerX - 11, 2.9, centerZ);
    safehouseGroup.add(liftColL);

    const liftColR = new THREE.Mesh(liftColGeo, liftMat);
    liftColR.position.set(centerX - 5, 2.9, centerZ);
    safehouseGroup.add(liftColR);

    const beamMesh = new THREE.Mesh(new THREE.BoxGeometry(6.4, 0.25, 0.3), liftMat);
    beamMesh.position.set(centerX - 8, 5.6, centerZ);
    safehouseGroup.add(beamMesh);

    const armMesh = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.15, 3.8), liftArmMat);
    armMesh.position.set(centerX - 8, 0.5, centerZ);
    safehouseGroup.add(armMesh);

    // Workshop Furniture: Tool Chests, Workbenches, Tires & Air Compressor
    const chestMat = new THREE.MeshStandardMaterial({ color: 0xd90429, metalness: 0.7, roughness: 0.3 });
    const toolChest = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.8, 1.0), chestMat);
    toolChest.position.set(centerX - 15.5, 1.1, centerZ - 6);
    safehouseGroup.add(toolChest);

    const workbench = new THREE.Mesh(new THREE.BoxGeometry(4.2, 1.2, 1.4), steelMat);
    workbench.position.set(centerX - 8, 0.8, centerZ - 10);
    safehouseGroup.add(workbench);

    // Stacked Racing Tires
    const tireMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.9 });
    const tireGeo = new THREE.CylinderGeometry(0.55, 0.55, 0.45, 16);
    for (let t = 0; t < 4; t++) {
      const tire = new THREE.Mesh(tireGeo, tireMat);
      tire.position.set(centerX - 1.5, 0.25 + t * 0.45, centerZ - 8);
      safehouseGroup.add(tire);
    }

    // 55-Gallon Oil Drums
    const drumColors = [0x00f0ff, 0xef4444, 0xf59e0b];
    const drumGeo = new THREE.CylinderGeometry(0.42, 0.42, 1.2, 12);
    drumColors.forEach((col, idx) => {
      const drum = new THREE.Mesh(drumGeo, new THREE.MeshStandardMaterial({ color: col, metalness: 0.7 }));
      drum.position.set(centerX - 0.5, 0.8, centerZ - 5 + idx * 1.1);
      safehouseGroup.add(drum);
    });

    // =============================================================
    // 2. ENTERABLE LIVING QUARTERS (RIGHT SIDE: centerX + 2.5 to centerX + 18.5)
    // =============================================================
    const houseW = 16;
    const houseD = 22;
    const houseH = 5.6;
    const houseCenterX = centerX + 10.5;

    // Hardwood Floor
    const woodFloor = new THREE.Mesh(new THREE.BoxGeometry(houseW, 0.38, houseD), this.materials.hardwood);
    woodFloor.position.set(houseCenterX, 0.19, centerZ);
    woodFloor.receiveShadow = true;
    safehouseGroup.add(woodFloor);

    // Warm Interior Point Light
    const houseLight = new THREE.PointLight(0xffedd5, 1.4, 20);
    houseLight.position.set(houseCenterX, 4.8, centerZ);
    safehouseGroup.add(houseLight);

    // Exterior Perimeter Walls
    const brickMat = new THREE.MeshStandardMaterial({ color: 0x9a3412, roughness: 0.85 }); // Warm brick red

    // Back Exterior Wall
    const hBackWall = new THREE.Mesh(new THREE.BoxGeometry(houseW, houseH, 0.6), brickMat);
    hBackWall.position.set(houseCenterX, houseH / 2 + 0.38, centerZ - houseD / 2);
    hBackWall.castShadow = true;
    safehouseGroup.add(hBackWall);

    // Right Exterior Wall
    const hRightWall = new THREE.Mesh(new THREE.BoxGeometry(0.6, houseH, houseD), brickMat);
    hRightWall.position.set(houseCenterX + houseW / 2, houseH / 2 + 0.38, centerZ);
    hRightWall.castShadow = true;
    safehouseGroup.add(hRightWall);

    // Front Exterior Wall with OPEN ENTRANCE DOORWAY (width 4.5m)
    // Left piece
    const hFrontLeft = new THREE.Mesh(new THREE.BoxGeometry(5.5, houseH, 0.6), brickMat);
    hFrontLeft.position.set(houseCenterX - 5.25, houseH / 2 + 0.38, centerZ + houseD / 2);
    hFrontLeft.castShadow = true;
    safehouseGroup.add(hFrontLeft);

    // Right piece
    const hFrontRight = new THREE.Mesh(new THREE.BoxGeometry(5.5, houseH, 0.6), brickMat);
    hFrontRight.position.set(houseCenterX + 5.25, houseH / 2 + 0.38, centerZ + houseD / 2);
    hFrontRight.castShadow = true;
    safehouseGroup.add(hFrontRight);

    // Door Header Archway
    const hDoorHeader = new THREE.Mesh(new THREE.BoxGeometry(5.2, 1.8, 0.6), brickMat);
    hDoorHeader.position.set(houseCenterX, houseH - 0.9 + 0.38, centerZ + houseD / 2);
    safehouseGroup.add(hDoorHeader);

    // Welcoming Safehouse Mat
    const welcomeMat = new THREE.Mesh(
      new THREE.PlaneGeometry(3.6, 1.6),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.9 })
    );
    welcomeMat.rotateX(-Math.PI / 2);
    welcomeMat.position.set(houseCenterX, 0.39, centerZ + houseD / 2 + 0.8);
    safehouseGroup.add(welcomeMat);

    // Dividing Wall between Garage and Living Room (with connecting open doorway)
    // Back dividing segment
    const divBack = new THREE.Mesh(new THREE.BoxGeometry(0.6, houseH, 8), wallMat);
    divBack.position.set(houseCenterX - houseW / 2, houseH / 2 + 0.38, centerZ - 7);
    safehouseGroup.add(divBack);

    // Front dividing segment
    const divFront = new THREE.Mesh(new THREE.BoxGeometry(0.6, houseH, 8), wallMat);
    divFront.position.set(houseCenterX - houseW / 2, houseH / 2 + 0.38, centerZ + 7);
    safehouseGroup.add(divFront);

    // Dividing door header
    const divHeader = new THREE.Mesh(new THREE.BoxGeometry(0.6, 1.8, 6), wallMat);
    divHeader.position.set(houseCenterX - houseW / 2, houseH - 0.9 + 0.38, centerZ);
    safehouseGroup.add(divHeader);

    // House Flat Roof with modern skylight trim
    const hRoof = new THREE.Mesh(new THREE.BoxGeometry(houseW + 0.8, 0.4, houseD + 0.8), roofMat);
    hRoof.position.set(houseCenterX, houseH + 0.38, centerZ);
    hRoof.castShadow = true;
    safehouseGroup.add(hRoof);

    // =============================================================
    // 3. LIVING ROOM INTERIOR FURNITURE
    // =============================================================
    // Moroccan Area Rug
    const rugMesh = new THREE.Mesh(new THREE.PlaneGeometry(6.4, 5.0), this.materials.rug);
    rugMesh.rotateX(-Math.PI / 2);
    rugMesh.position.set(houseCenterX + 1.0, 0.40, centerZ + 2.5);
    safehouseGroup.add(rugMesh);

    // Plush Modern L-Sofa (Charcoal Leather + Mustard Cushions)
    const sofaMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.8 });
    const cushionMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.7 });

    const sofaBase = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.5, 1.8), sofaMat);
    sofaBase.position.set(houseCenterX + 1.0, 0.65, centerZ + 1.0);
    safehouseGroup.add(sofaBase);

    const sofaBack = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.9, 0.4), sofaMat);
    sofaBack.position.set(houseCenterX + 1.0, 1.1, centerZ + 0.2);
    safehouseGroup.add(sofaBack);

    const sofaLounge = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.5, 2.2), sofaMat);
    sofaLounge.position.set(houseCenterX - 0.3, 0.65, centerZ + 2.2);
    safehouseGroup.add(sofaLounge);

    // Accent Pillows
    const pillow1 = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.5, 0.25), cushionMat);
    pillow1.position.set(houseCenterX + 2.5, 1.0, centerZ + 0.5);
    safehouseGroup.add(pillow1);

    // Coffee Table with soda can and magazine
    const tableMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.6 });
    const coffeeTable = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.45, 1.2), tableMat);
    coffeeTable.position.set(houseCenterX + 1.2, 0.62, centerZ + 3.2);
    safehouseGroup.add(coffeeTable);

    // 65" Wall-Mounted Flat-Screen TV (Displaying GTA / CCTV Graphics)
    const tvFrame = new THREE.Mesh(
      new THREE.BoxGeometry(3.6, 2.1, 0.15),
      new THREE.MeshStandardMaterial({ color: 0x09090b, roughness: 0.2 })
    );
    tvFrame.position.set(houseCenterX + 1.0, 2.8, centerZ + houseD / 2 - 0.45);
    safehouseGroup.add(tvFrame);

    const tvScreen = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 1.9), this.materials.tv);
    tvScreen.rotateY(Math.PI);
    tvScreen.position.set(houseCenterX + 1.0, 2.8, centerZ + houseD / 2 - 0.55);
    safehouseGroup.add(tvScreen);

    // Kitchenette: Counter with fridge and microwave
    const counterMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.3, metalness: 0.6 });
    const counter = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.1, 3.8), counterMat);
    counter.position.set(houseCenterX - houseW / 2 + 1.3, 0.95, centerZ - 2.5);
    safehouseGroup.add(counter);

    const fridge = new THREE.Mesh(
      new THREE.BoxGeometry(1.4, 2.4, 1.4),
      new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.8, roughness: 0.2 })
    );
    fridge.position.set(houseCenterX - houseW / 2 + 1.3, 1.6, centerZ - 5.5);
    safehouseGroup.add(fridge);

    // =============================================================
    // 4. BEDROOM SECTION & INTERACTIVE REST BED
    // =============================================================
    const bedX = houseCenterX + 3.0;
    const bedZ = centerZ - 6.5;

    // Bedframe & Mattress
    const bedFrame = new THREE.Mesh(
      new THREE.BoxGeometry(3.2, 0.5, 4.2),
      new THREE.MeshStandardMaterial({ color: 0x3f220d, roughness: 0.8 })
    );
    bedFrame.position.set(bedX, 0.65, bedZ);
    safehouseGroup.add(bedFrame);

    // Headboard
    const headboard = new THREE.Mesh(
      new THREE.BoxGeometry(3.2, 1.6, 0.3),
      new THREE.MeshStandardMaterial({ color: 0x3f220d, roughness: 0.8 })
    );
    headboard.position.set(bedX, 1.2, bedZ - 2.0);
    safehouseGroup.add(headboard);

    // Navy Duvet Blanket
    const duvet = new THREE.Mesh(
      new THREE.BoxGeometry(3.0, 0.4, 3.0),
      new THREE.MeshStandardMaterial({ color: 0x1e3a8a, roughness: 0.7 })
    );
    duvet.position.set(bedX, 0.9, bedZ + 0.5);
    safehouseGroup.add(duvet);

    // Two Fluffy White Pillows
    const pillowMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.9 });
    const pL = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.25, 0.7), pillowMat);
    pL.position.set(bedX - 0.7, 0.95, bedZ - 1.3);
    safehouseGroup.add(pL);

    const pR = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.25, 0.7), pillowMat);
    pR.position.set(bedX + 0.7, 0.95, bedZ - 1.3);
    safehouseGroup.add(pR);

    // Bedside Table with Nightstand Lamp
    const nightstand = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.8, 1.0), tableMat);
    nightstand.position.set(bedX + 2.2, 0.8, bedZ - 1.5);
    safehouseGroup.add(nightstand);

    const lampShade = new THREE.Mesh(
      new THREE.CylinderGeometry(0.25, 0.35, 0.5, 12),
      new THREE.MeshBasicMaterial({ color: 0xfef08a })
    );
    lampShade.position.set(bedX + 2.2, 1.5, bedZ - 1.5);
    safehouseGroup.add(lampShade);

    // Driver's Stash Safe with Cash Stacks
    const safeBox = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 1.2, 1.0),
      new THREE.MeshStandardMaterial({ color: 0x18181b, metalness: 0.9, roughness: 0.2 })
    );
    safeBox.position.set(bedX - 2.2, 1.0, bedZ - 1.5);
    safehouseGroup.add(safeBox);

    // =============================================================
    // 5. COLLIDERS (ONLY PERIMETER WALLS - LEAVING ALL DOORS OPEN!)
    // =============================================================
    this.buildingColliders.push(
      // Garage back wall
      { minX: centerX - 18, maxX: centerX + 2.5, minZ: centerZ - 12.2, maxZ: centerZ - 11.2, height: 8 },
      // Garage left wall
      { minX: centerX - 18.2, maxX: centerX - 17.2, minZ: centerZ - 12, maxZ: centerZ + 12, height: 8 },
      // House back exterior wall
      { minX: houseCenterX - houseW / 2, maxX: houseCenterX + houseW / 2, minZ: centerZ - houseD / 2 - 0.5, maxZ: centerZ - houseD / 2 + 0.5, height: houseH },
      // House right exterior wall
      { minX: houseCenterX + houseW / 2 - 0.5, maxX: houseCenterX + houseW / 2 + 0.5, minZ: centerZ - houseD / 2, maxZ: centerZ + houseD / 2, height: houseH },
      // House front exterior wall (LEFT of open entrance door)
      { minX: houseCenterX - houseW / 2, maxX: houseCenterX - 2.4, minZ: centerZ + houseD / 2 - 0.5, maxZ: centerZ + houseD / 2 + 0.5, height: houseH },
      // House front exterior wall (RIGHT of open entrance door)
      { minX: houseCenterX + 2.4, maxX: houseCenterX + houseW / 2, minZ: centerZ + houseD / 2 - 0.5, maxZ: centerZ + houseD / 2 + 0.5, height: houseH },
      // Dividing wall back segment
      { minX: houseCenterX - houseW / 2 - 0.4, maxX: houseCenterX - houseW / 2 + 0.4, minZ: centerZ - 11, maxZ: centerZ - 3, height: houseH },
      // Dividing wall front segment
      { minX: houseCenterX - houseW / 2 - 0.4, maxX: houseCenterX - houseW / 2 + 0.4, minZ: centerZ + 3, maxZ: centerZ + 11, height: houseH },
      // Bed collider
      { minX: bedX - 1.8, maxX: bedX + 1.8, minZ: bedZ - 2.2, maxZ: bedZ + 2.2, height: 1.5 }
    );
  }

  /**
   * Builds Metropolis General Hospital & Trauma Center:
   * 8-story clean medical tower with reflective ribbon windows, rooftop helipad,
   * illuminated Red Cross neon emblem, ER ambulance bay with 2 parked 3D ambulances.
   */
  _buildHospital(centerX, centerZ, size) {
    const hospGroup = new THREE.Group();
    this.cityGroup.add(hospGroup);

    // 1. Hospital Foundation Plaza
    const plazaGeo = new THREE.BoxGeometry(size * 0.92, 0.4, size * 0.92);
    const plazaMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.8 });
    const plaza = new THREE.Mesh(plazaGeo, plazaMat);
    plaza.position.set(centerX, 0.2, centerZ);
    plaza.receiveShadow = true;
    hospGroup.add(plaza);

    // 2. Main 8-Story Medical Tower
    const towerW = 34;
    const towerD = 30;
    const towerH = 46;
    const towerGeo = new THREE.BoxGeometry(towerW, towerH, towerD);
    const tower = new THREE.Mesh(towerGeo, this.materials.hospital);
    tower.position.set(centerX - 4, towerH / 2 + 0.4, centerZ - 2);
    tower.castShadow = true;
    tower.receiveShadow = true;
    hospGroup.add(tower);

    // 3. Illuminated 3D Red Cross Neon Emblem on Facade
    const crossMat = new THREE.MeshStandardMaterial({
      color: 0xef4444,
      emissive: 0xef4444,
      emissiveIntensity: 0.95,
      roughness: 0.2
    });
    const crossHoriz = new THREE.Mesh(new THREE.BoxGeometry(6.4, 2.0, 0.6), crossMat);
    crossHoriz.position.set(centerX - 4, 38, centerZ + towerD / 2 - 1.7);
    hospGroup.add(crossHoriz);

    const crossVert = new THREE.Mesh(new THREE.BoxGeometry(2.0, 6.4, 0.6), crossMat);
    crossVert.position.set(centerX - 4, 38, centerZ + towerD / 2 - 1.7);
    hospGroup.add(crossVert);

    // Hospital Glowing Sign
    const signCanvas = document.createElement('canvas');
    signCanvas.width = 512;
    signCanvas.height = 128;
    const ctx = signCanvas.getContext('2d');
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, 512, 128);
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 4;
    ctx.strokeRect(6, 6, 500, 116);
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 30px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🏥 METROPOLIS GENERAL HOSPITAL', 256, 54);
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 20px monospace';
    ctx.fillText('EMERGENCY & TRAUMA CENTER • 24/7', 256, 94);

    const hSignTex = new THREE.CanvasTexture(signCanvas);
    const hSignMat = new THREE.MeshStandardMaterial({ map: hSignTex, emissive: 0x0284c7, emissiveIntensity: 0.5 });
    const hSignMesh = new THREE.Mesh(new THREE.BoxGeometry(22, 2.6, 0.4), hSignMat);
    hSignMesh.position.set(centerX - 4, 31, centerZ + towerD / 2 - 1.7);
    hospGroup.add(hSignMesh);

    // 4. Rooftop Helipad with Medical Cross
    const heliGeo = new THREE.BoxGeometry(16, 0.4, 16);
    const heliMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.7 });
    const heli = new THREE.Mesh(heliGeo, heliMat);
    heli.position.set(centerX - 4, towerH + 0.6, centerZ - 2);
    hospGroup.add(heli);

    // Helipad Red Cross Marker
    const hCrossH = new THREE.Mesh(new THREE.PlaneGeometry(8, 2.2), crossMat);
    hCrossH.rotateX(-Math.PI / 2);
    hCrossH.position.set(centerX - 4, towerH + 0.82, centerZ - 2);
    hospGroup.add(hCrossH);

    const hCrossV = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 8), crossMat);
    hCrossV.rotateX(-Math.PI / 2);
    hCrossV.position.set(centerX - 4, towerH + 0.82, centerZ - 2);
    hospGroup.add(hCrossV);

    // 5. Ground Floor Emergency Room (ER) Ambulance Bay Overhang
    const canopyGeo = new THREE.BoxGeometry(24, 0.4, 14);
    const canopyMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.7, roughness: 0.3 });
    const canopy = new THREE.Mesh(canopyGeo, canopyMat);
    canopy.position.set(centerX - 4, 5.2, centerZ + 18);
    hospGroup.add(canopy);

    // Canopy Support Posts
    const cPostGeo = new THREE.CylinderGeometry(0.25, 0.25, 5.2, 8);
    const cPostMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.8 });
    const p1 = new THREE.Mesh(cPostGeo, cPostMat);
    p1.position.set(centerX - 15, 2.6, centerZ + 24);
    hospGroup.add(p1);
    const p2 = new THREE.Mesh(cPostGeo, cPostMat);
    p2.position.set(centerX + 7, 2.6, centerZ + 24);
    hospGroup.add(p2);

    // 6. Parked 3D Ambulances (2 Ambulances)
    this._addParkedAmbulance(hospGroup, centerX - 10, centerZ + 18, 0);
    this._addParkedAmbulance(hospGroup, centerX + 2, centerZ + 18, 0);

    // Landscaped shrubs & decorative trees
    this._addTree(centerX + 18, centerZ - 8, 2);
    this._addTree(centerX + 18, centerZ + 8, 0);

    // Collider for hospital tower
    this.buildingColliders.push({
      minX: (centerX - 4) - towerW / 2,
      maxX: (centerX - 4) + towerW / 2,
      minZ: (centerZ - 2) - towerD / 2,
      maxZ: (centerZ - 2) + towerD / 2,
      height: towerH
    });
  }

  /**
   * Helper to construct a detailed 3D Ambulance model.
   */
  _addParkedAmbulance(group, x, z, heading = 0) {
    const ambGroup = new THREE.Group();
    ambGroup.position.set(x, 0.35, z);
    ambGroup.rotation.y = heading;
    group.add(ambGroup);

    // Materials
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.3 }); // White body
    const redStripeMat = new THREE.MeshStandardMaterial({ color: 0xd90429, roughness: 0.5 }); // Red stripe
    const glassMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.1 });
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.9 });

    // Chassis Box
    const body = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.8, 5.2), bodyMat);
    body.position.y = 1.2;
    body.castShadow = true;
    ambGroup.add(body);

    // Red Side Decal Stripe
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(2.44, 0.4, 5.0), redStripeMat);
    stripe.position.y = 1.1;
    ambGroup.add(stripe);

    // Front Windshield
    const windshield = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.7, 0.1), glassMat);
    windshield.position.set(0, 1.4, 2.61);
    ambGroup.add(windshield);

    // Flashing Red & Blue Beacon Lightbar on Roof
    const beaconMat = new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0xef4444, emissiveIntensity: 0.9 });
    const beacon = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.25, 0.4), beaconMat);
    beacon.position.set(0, 2.2, 1.2);
    ambGroup.add(beacon);

    this.animatedElements.push({
      type: 'neonFlicker',
      mat: beaconMat,
      baseIntensity: 0.9
    });

    // Wheels (4 cylinders)
    const wheelGeo = new THREE.CylinderGeometry(0.42, 0.42, 0.3, 12);
    wheelGeo.rotateZ(Math.PI / 2);
    const wCoords = [[-1.2, 1.6], [1.2, 1.6], [-1.2, -1.6], [1.2, -1.6]];
    for (const [wx, wz] of wCoords) {
      const w = new THREE.Mesh(wheelGeo, wheelMat);
      w.position.set(wx, 0.42, wz);
      ambGroup.add(w);
    }
  }

  /**
   * Builds Metropolis Police Department (Precinct 99):
   * Dark granite civic architecture, MPD badge, flashing blue beacons,
   * security motor pool with 2 parked Police Cruiser Interceptors.
   */
  _buildPoliceStation(centerX, centerZ, size) {
    const polGroup = new THREE.Group();
    this.cityGroup.add(polGroup);

    // 1. Reinforced Granite Plaza
    const plazaGeo = new THREE.BoxGeometry(size * 0.92, 0.4, size * 0.92);
    const plaza = new THREE.Mesh(plazaGeo, new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.9 }));
    plaza.position.set(centerX, 0.2, centerZ);
    polGroup.add(plaza);

    // 2. Main Station Headquarters Tower (4-Story Fortress)
    const bW = 32;
    const bD = 28;
    const bH = 28;
    const building = new THREE.Mesh(new THREE.BoxGeometry(bW, bH, bD), this.materials.police);
    building.position.set(centerX - 4, bH / 2 + 0.4, centerZ - 4);
    building.castShadow = true;
    building.receiveShadow = true;
    polGroup.add(building);

    // 3. Metropolis Police Badge & Marquee Sign
    const badgeMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.9, roughness: 0.2 });
    const badge = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, 0.3, 8), badgeMat);
    badge.rotateX(Math.PI / 2);
    badge.position.set(centerX - 4, 22, centerZ + bD / 2 - 3.8);
    polGroup.add(badge);

    const signCanvas = document.createElement('canvas');
    signCanvas.width = 512;
    signCanvas.height = 128;
    const ctx = signCanvas.getContext('2d');
    ctx.fillStyle = '#0b1329';
    ctx.fillRect(0, 0, 512, 128);
    ctx.strokeStyle = '#2563eb';
    ctx.lineWidth = 4;
    ctx.strokeRect(6, 6, 500, 116);
    ctx.fillStyle = '#60a5fa';
    ctx.font = 'bold 30px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🚓 METROPOLIS POLICE DEPT', 256, 54);
    ctx.fillStyle = '#f59e0b';
    ctx.font = 'bold 20px monospace';
    ctx.fillText('PRECINCT 99 • METRO DIVISION', 256, 94);

    const signTex = new THREE.CanvasTexture(signCanvas);
    const signMat = new THREE.MeshStandardMaterial({ map: signTex, emissive: 0x1d4ed8, emissiveIntensity: 0.6 });
    const sign = new THREE.Mesh(new THREE.BoxGeometry(20, 2.5, 0.4), signMat);
    sign.position.set(centerX - 4, 16, centerZ + bD / 2 - 3.8);
    polGroup.add(sign);

    // Flashing Police Blue Beacons on entrance
    const blueBeaconMat = new THREE.MeshStandardMaterial({
      color: 0x00f0ff,
      emissive: 0x00f0ff,
      emissiveIntensity: 0.95
    });
    const b1 = new THREE.Mesh(new THREE.SphereGeometry(0.35, 8, 8), blueBeaconMat);
    b1.position.set(centerX - 9, 7.5, centerZ + bD / 2 - 3.6);
    polGroup.add(b1);
    const b2 = new THREE.Mesh(new THREE.SphereGeometry(0.35, 8, 8), blueBeaconMat);
    b2.position.set(centerX + 1, 7.5, centerZ + bD / 2 - 3.6);
    polGroup.add(b2);

    this.animatedElements.push({
      type: 'neonFlicker',
      mat: blueBeaconMat,
      baseIntensity: 0.95
    });

    // 4. Secure Gated Motor Pool with 2 Parked Police Cruisers
    this._addParkedPoliceCruiser(polGroup, centerX - 10, centerZ + 18, 0);
    this._addParkedPoliceCruiser(polGroup, centerX + 2, centerZ + 18, 0);

    // Collider for station
    this.buildingColliders.push({
      minX: (centerX - 4) - bW / 2,
      maxX: (centerX - 4) + bW / 2,
      minZ: (centerZ - 4) - bD / 2,
      maxZ: (centerZ - 4) + bD / 2,
      height: bH
    });
  }

  /**
   * Helper to construct a detailed 3D Police Interceptor Cruiser.
   */
  _addParkedPoliceCruiser(group, x, z, heading = 0) {
    const carGroup = new THREE.Group();
    carGroup.position.set(x, 0.35, z);
    carGroup.rotation.y = heading;
    group.add(carGroup);

    // Black & White interceptor chassis
    const blackMat = new THREE.MeshStandardMaterial({ color: 0x09090b, roughness: 0.3 });
    const whiteMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.3 });
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.9 });

    // Lower Chassis (Black)
    const base = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.8, 4.8), blackMat);
    base.position.y = 0.6;
    base.castShadow = true;
    carGroup.add(base);

    // White Doors & Roof Cabin
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.7, 2.6), whiteMat);
    cabin.position.set(0, 1.3, -0.2);
    carGroup.add(cabin);

    // Front Push Bumper
    const pushBumper = new THREE.Mesh(
      new THREE.BoxGeometry(2.4, 0.6, 0.3),
      new THREE.MeshStandardMaterial({ color: 0x27272a, metalness: 0.8 })
    );
    pushBumper.position.set(0, 0.6, 2.45);
    carGroup.add(pushBumper);

    // Aerodynamic Emergency Lightbar (Red + Blue)
    const lightbarMat = new THREE.MeshStandardMaterial({
      color: 0x2563eb,
      emissive: 0x2563eb,
      emissiveIntensity: 0.95
    });
    const lightbar = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.18, 0.4), lightbarMat);
    lightbar.position.set(0, 1.75, -0.2);
    carGroup.add(lightbar);

    this.animatedElements.push({
      type: 'neonFlicker',
      mat: lightbarMat,
      baseIntensity: 0.95
    });

    // Wheels
    const wheelGeo = new THREE.CylinderGeometry(0.38, 0.38, 0.28, 12);
    wheelGeo.rotateZ(Math.PI / 2);
    const wCoords = [[-1.15, 1.5], [1.15, 1.5], [-1.15, -1.5], [1.15, -1.5]];
    for (const [wx, wz] of wCoords) {
      const w = new THREE.Mesh(wheelGeo, wheelMat);
      w.position.set(wx, 0.38, wz);
      carGroup.add(w);
    }
  }

  /**
   * Builds Metropolis Fire Department (Station 51):
   * 2-story classic red brick firehouse, historic bell tower,
   * and 2 heavy red 3D Firetrucks equipped with chrome ladders, hose reels, and beacons.
   */
  _buildFireStation(centerX, centerZ, size) {
    const fireGroup = new THREE.Group();
    this.cityGroup.add(fireGroup);

    // 1. Concrete Apron Driveway with yellow caution chevrons
    const apron = new THREE.Mesh(
      new THREE.BoxGeometry(size * 0.92, 0.4, size * 0.92),
      new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.8 })
    );
    apron.position.set(centerX, 0.2, centerZ);
    fireGroup.add(apron);

    // 2. Historic Red Brick Firehouse
    const fW = 32;
    const fD = 26;
    const fH = 18;
    const firehouse = new THREE.Mesh(new THREE.BoxGeometry(fW, fH, fD), this.materials.firehouse);
    firehouse.position.set(centerX - 4, fH / 2 + 0.4, centerZ - 6);
    firehouse.castShadow = true;
    firehouse.receiveShadow = true;
    fireGroup.add(firehouse);

    // 3. Historic Bell Tower
    const towerH = 10;
    const bTower = new THREE.Mesh(new THREE.BoxGeometry(6, towerH, 6), this.materials.firehouse);
    bTower.position.set(centerX + 8, fH + towerH / 2 + 0.4, centerZ - 6);
    fireGroup.add(bTower);

    // Golden Fire Bell
    const bell = new THREE.Mesh(
      new THREE.CylinderGeometry(0.8, 1.2, 1.4, 12),
      new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.9, roughness: 0.2 })
    );
    bell.position.set(centerX + 8, fH + towerH + 0.8, centerZ - 6);
    fireGroup.add(bell);

    // 4. Gold Lettering Sign: "METROPOLIS FIRE DEPT - STATION 51"
    const signCanvas = document.createElement('canvas');
    signCanvas.width = 512;
    signCanvas.height = 128;
    const ctx = signCanvas.getContext('2d');
    ctx.fillStyle = '#450a0a';
    ctx.fillRect(0, 0, 512, 128);
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 4;
    ctx.strokeRect(6, 6, 500, 116);
    ctx.fillStyle = '#fde047';
    ctx.font = 'bold 30px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🚒 METROPOLIS FIRE DEPT', 256, 52);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px monospace';
    ctx.fillText('STATION 51 • ENGINE COMPANY', 256, 92);

    const signTex = new THREE.CanvasTexture(signCanvas);
    const signMat = new THREE.MeshStandardMaterial({ map: signTex, emissive: 0xd97706, emissiveIntensity: 0.4 });
    const sign = new THREE.Mesh(new THREE.BoxGeometry(20, 2.5, 0.4), signMat);
    sign.position.set(centerX - 5, 14, centerZ + fD / 2 - 5.8);
    fireGroup.add(sign);

    // 5. Two Arched Apparatus Roll-Up Garage Bay Doors
    const doorMat = new THREE.MeshStandardMaterial({ color: 0x991b1b, metalness: 0.5, roughness: 0.4 });
    const d1 = new THREE.Mesh(new THREE.BoxGeometry(8, 9, 0.3), doorMat);
    d1.position.set(centerX - 12, 4.9, centerZ + fD / 2 - 5.8);
    fireGroup.add(d1);

    const d2 = new THREE.Mesh(new THREE.BoxGeometry(8, 9, 0.3), doorMat);
    d2.position.set(centerX - 2, 4.9, centerZ + fD / 2 - 5.8);
    fireGroup.add(d2);

    // 6. Two Heavy 3D Firetrucks (one on apron, one inside bay)
    this._addHeavyFiretruck(fireGroup, centerX - 12, centerZ + 16, 0);
    this._addHeavyFiretruck(fireGroup, centerX + 12, centerZ + 12, 0);

    // Collider for firehouse
    this.buildingColliders.push({
      minX: (centerX - 4) - fW / 2,
      maxX: (centerX - 4) + fW / 2,
      minZ: (centerZ - 6) - fD / 2,
      maxZ: (centerZ - 6) + fD / 2,
      height: fH
    });
  }

  /**
   * Helper to construct a heavy 3D Fire Engine Truck.
   */
  _addHeavyFiretruck(group, x, z, heading = 0) {
    const truck = new THREE.Group();
    truck.position.set(x, 0.35, z);
    truck.rotation.y = heading;
    group.add(truck);

    const redMat = new THREE.MeshStandardMaterial({ color: 0xd90429, roughness: 0.25, metalness: 0.3 });
    const chromeMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.95, roughness: 0.1 });
    const yellowMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.8 });
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.9 });

    // Main Red Firetruck Body (Length: 8.5m, Width: 2.8m, Height: 2.8m)
    const body = new THREE.Mesh(new THREE.BoxGeometry(2.8, 2.4, 8.2), redMat);
    body.position.y = 1.6;
    body.castShadow = true;
    truck.add(body);

    // Front Chrome Bumper & Grill
    const bumper = new THREE.Mesh(new THREE.BoxGeometry(3.0, 0.8, 0.4), chromeMat);
    bumper.position.set(0, 0.8, 4.2);
    truck.add(bumper);

    // Dual Cab Windshield
    const windshield = new THREE.Mesh(
      new THREE.BoxGeometry(2.6, 1.0, 0.1),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.1 })
    );
    windshield.position.set(0, 2.0, 4.11);
    truck.add(windshield);

    // Chrome Aerial Rescue Ladder on Roof
    const ladderTurntable = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 0.4, 16), chromeMat);
    ladderTurntable.position.set(0, 2.9, -1.8);
    truck.add(ladderTurntable);

    const ladder = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.3, 7.2), chromeMat);
    ladder.position.set(0, 3.2, 1.0);
    ladder.castShadow = true;
    truck.add(ladder);

    // Coiled Yellow Fire Hose on Side
    const hose = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.6, 12), yellowMat);
    hose.rotateZ(Math.PI / 2);
    hose.position.set(1.42, 1.8, -0.5);
    truck.add(hose);

    // Roof Emergency Red Strobes
    const beaconMat = new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0xef4444, emissiveIntensity: 0.95 });
    const beaconL = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.3, 0.4), beaconMat);
    beaconL.position.set(-0.9, 2.9, 3.2);
    truck.add(beaconL);

    const beaconR = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.3, 0.4), beaconMat);
    beaconR.position.set(0.9, 2.9, 3.2);
    truck.add(beaconR);

    this.animatedElements.push({
      type: 'neonFlicker',
      mat: beaconMat,
      baseIntensity: 0.95
    });

    // 6 Heavy Wheels
    const wheelGeo = new THREE.CylinderGeometry(0.55, 0.55, 0.4, 16);
    wheelGeo.rotateZ(Math.PI / 2);
    const wCoords = [
      [-1.45, 2.8], [1.45, 2.8],
      [-1.45, -1.6], [1.45, -1.6],
      [-1.45, -2.8], [1.45, -2.8]
    ];
    for (const [wx, wz] of wCoords) {
      const w = new THREE.Mesh(wheelGeo, wheelMat);
      w.position.set(wx, 0.55, wz);
      truck.add(w);
    }
  }

  /**
   * Builds Google Tech Campus (Silicon Metropolis):
   * Ultra-modern crystalline turquoise glass tower, multi-colored illuminated Google marquee,
   * and outdoor tech plaza with a 3D Green Android mascot statue and umbrella cafe tables.
   */
  _buildGoogleHQ(centerX, centerZ, size) {
    const googleGroup = new THREE.Group();
    this.cityGroup.add(googleGroup);

    // 1. High-Tech White Granite Plaza
    const plaza = new THREE.Mesh(
      new THREE.BoxGeometry(size * 0.92, 0.4, size * 0.92),
      new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.7 })
    );
    plaza.position.set(centerX, 0.2, centerZ);
    plaza.receiveShadow = true;
    googleGroup.add(plaza);

    // 2. Modern Glass Tech Tower
    const bW = 34;
    const bD = 28;
    const bH = 50;
    const tower = new THREE.Mesh(new THREE.BoxGeometry(bW, bH, bD), this.materials.google);
    tower.position.set(centerX - 4, bH / 2 + 0.4, centerZ - 4);
    tower.castShadow = true;
    tower.receiveShadow = true;
    googleGroup.add(tower);

    // 3. Multi-Colored Google Marquee Logo Sign on Tower
    const signCanvas = document.createElement('canvas');
    signCanvas.width = 512;
    signCanvas.height = 128;
    const ctx = signCanvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 512, 128);

    // Draw Google's official colors for each letter
    ctx.font = 'bold 64px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const letters = [
      { char: 'G', col: '#4285F4' },
      { char: 'o', col: '#EA4335' },
      { char: 'o', col: '#FBBC05' },
      { char: 'g', col: '#4285F4' },
      { char: 'l', col: '#34A853' },
      { char: 'e', col: '#EA4335' }
    ];

    let startX = 140;
    for (const l of letters) {
      ctx.fillStyle = l.col;
      ctx.fillText(l.char, startX, 64);
      startX += 46;
    }

    const gSignTex = new THREE.CanvasTexture(signCanvas);
    const gSignMat = new THREE.MeshStandardMaterial({ map: gSignTex, roughness: 0.1 });
    const gSign = new THREE.Mesh(new THREE.BoxGeometry(20, 4.5, 0.4), gSignMat);
    gSign.position.set(centerX - 4, 38, centerZ + bD / 2 - 3.8);
    googleGroup.add(gSign);

    // 4. Tech Plaza: 3D Green Android Mascot Statue
    const androidPlaza = new THREE.Group();
    androidPlaza.position.set(centerX + 12, 0.4, centerZ + 12);
    googleGroup.add(androidPlaza);

    // Pedestal
    const ped = new THREE.Mesh(
      new THREE.CylinderGeometry(2.4, 2.6, 1.2, 16),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.5 })
    );
    ped.position.y = 0.6;
    androidPlaza.add(ped);

    // Android Mascot Model (Green Lime)
    const androidMat = new THREE.MeshStandardMaterial({ color: 0xa4c639, roughness: 0.3 }); // Android Green
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

    // Torso Cylinder
    const aTorso = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 1.8, 16), androidMat);
    aTorso.position.y = 2.2;
    androidPlaza.add(aTorso);

    // Head Dome (Half Sphere)
    const aHead = new THREE.Mesh(new THREE.SphereGeometry(1.2, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2), androidMat);
    aHead.position.y = 3.15;
    androidPlaza.add(aHead);

    // Eyes
    const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), eyeMat);
    eyeL.position.set(-0.45, 3.6, 1.1);
    androidPlaza.add(eyeL);

    const eyeR = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), eyeMat);
    eyeR.position.set(0.45, 3.6, 1.1);
    androidPlaza.add(eyeR);

    // Antennas
    const antGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.6, 6);
    const antL = new THREE.Mesh(antGeo, androidMat);
    antL.position.set(-0.55, 4.3, 0);
    antL.rotation.z = 0.35;
    androidPlaza.add(antL);

    const antR = new THREE.Mesh(antGeo, androidMat);
    antR.position.set(0.55, 4.3, 0);
    antR.rotation.z = -0.35;
    androidPlaza.add(antR);

    // Pill Arms
    const armGeo = new THREE.CylinderGeometry(0.28, 0.28, 1.3, 8);
    const aArmL = new THREE.Mesh(armGeo, androidMat);
    aArmL.position.set(-1.6, 2.2, 0);
    androidPlaza.add(aArmL);

    const aArmR = new THREE.Mesh(armGeo, androidMat);
    aArmR.position.set(1.6, 2.2, 0);
    androidPlaza.add(aArmR);

    // 5. Tech Outdoor Cafe Tables & Primary Color Umbrellas
    const steelMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8, roughness: 0.3 });
    const umbrellaColors = [0x4285f4, 0xea4335, 0xfbbc05, 0x34a853];
    const cafeOffsets = [
      [-10, 14], [-2, 14], [-6, 20]
    ];
    cafeOffsets.forEach(([ox, oz], idx) => {
      const uMat = new THREE.MeshStandardMaterial({ color: umbrellaColors[idx % 4], roughness: 0.6 });
      const uCone = new THREE.Mesh(new THREE.ConeGeometry(2.0, 0.8, 12), uMat);
      uCone.position.set(centerX + ox, 3.2, centerZ + oz);
      googleGroup.add(uCone);

      const uPole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 3.2, 6), steelMat);
      uPole.position.set(centerX + ox, 1.6, centerZ + oz);
      googleGroup.add(uPole);

      const table = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 0.1, 12), steelMat);
      table.position.set(centerX + ox, 0.9, centerZ + oz);
      googleGroup.add(table);
    });

    // Collider for Google campus
    this.buildingColliders.push({
      minX: (centerX - 4) - bW / 2,
      maxX: (centerX - 4) + bW / 2,
      minZ: (centerZ - 4) - bD / 2,
      maxZ: (centerZ - 4) + bD / 2,
      height: bH
    });
  }

  /**
   * Builds Maplewood Suburban Residential Neighbourhood:
   * 4 suburban homes with pitched gabled roofs, chimneys, front lawns,
   * white picket fences, mailboxes, and driveways.
   */
  _buildResidentialQuarter(centerX, centerZ, size) {
    const resGroup = new THREE.Group();
    this.cityGroup.add(resGroup);

    // 1. Lush Green Lawn Base for the Block
    const lawn = new THREE.Mesh(
      new THREE.BoxGeometry(size * 0.94, 0.38, size * 0.94),
      new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.9 })
    );
    lawn.position.set(centerX, 0.19, centerZ);
    lawn.receiveShadow = true;
    resGroup.add(lawn);

    // 4 Suburban Single-Family Homes
    const houseConfigs = [
      { ox: -14, oz: -14, wallColor: 0xfef08a, roofColor: 0x1e293b, roofStyle: 'gable' }, // Cream Colonial
      { ox: 14, oz: -14, wallColor: 0xa7f3d0, roofColor: 0x9a3412, roofStyle: 'hip' },   // Mint Craftsman
      { ox: -14, oz: 14, wallColor: 0xbae6fd, roofColor: 0x475569, roofStyle: 'gable' },  // Sky Blue Cape Cod
      { ox: 14, oz: 14, wallColor: 0xfed7aa, roofColor: 0x78350f, roofStyle: 'ranch' }    // Peach Ranch
    ];

    for (const h of houseConfigs) {
      const hx = centerX + h.ox;
      const hz = centerZ + h.oz;
      const hW = 16;
      const hD = 14;
      const hH = 6.5;

      // House Body
      const hMesh = new THREE.Mesh(
        new THREE.BoxGeometry(hW, hH, hD),
        new THREE.MeshStandardMaterial({ color: h.wallColor, roughness: 0.75 })
      );
      hMesh.position.set(hx, hH / 2 + 0.38, hz);
      hMesh.castShadow = true;
      resGroup.add(hMesh);

      // Pitched Gabled Roof (Prism / Pyramid Geometry)
      const roofMat = new THREE.MeshStandardMaterial({ color: h.roofColor, roughness: 0.8 });
      const roofH = 4.2;
      const roof = new THREE.Mesh(new THREE.ConeGeometry(Math.hypot(hW, hD) * 0.58, roofH, 4), roofMat);
      roof.position.set(hx, hH + roofH / 2 + 0.38, hz);
      roof.rotation.y = Math.PI / 4;
      roof.castShadow = true;
      resGroup.add(roof);

      // Brick Chimney
      const chimney = new THREE.Mesh(
        new THREE.BoxGeometry(1.2, 5.5, 1.2),
        new THREE.MeshStandardMaterial({ color: 0x7f1d1d, roughness: 0.9 })
      );
      chimney.position.set(hx + 4.5, hH + 2.0, hz - 2.5);
      chimney.castShadow = true;
      resGroup.add(chimney);

      // Mailbox on post
      const post = new THREE.Mesh(
        new THREE.CylinderGeometry(0.08, 0.08, 1.2, 6),
        new THREE.MeshStandardMaterial({ color: 0x582f0e })
      );
      post.position.set(hx, 0.6, hz + hD / 2 + 3.0);
      resGroup.add(post);

      const box = new THREE.Mesh(
        new THREE.BoxGeometry(0.35, 0.3, 0.6),
        new THREE.MeshStandardMaterial({ color: 0x1e293b })
      );
      box.position.set(hx, 1.2, hz + hD / 2 + 3.0);
      resGroup.add(box);

      // Front Lawn Tree
      this._addTree(hx - 8, hz + hD / 2 + 2, 1);

      // Colliders for each house
      this.buildingColliders.push({
        minX: hx - hW / 2,
        maxX: hx + hW / 2,
        minZ: hz - hD / 2,
        maxZ: hz + hD / 2,
        height: hH + roofH
      });
    }
  }

  /**
   * Spawns 6 interactive Street Food Stalls with canopies, heat lamps,
   * menu pricing, and vendor NPCs at key pedestrian sidewalks.
   */
  _buildFoodStalls() {
    const stallsConfig = [
      {
        id: 'hotdog_safehouse',
        name: "Joe's Famous Hot Dogs",
        item: 'Hot Dog & Soda',
        price: 5.0,
        x: -160,
        z: 160,
        canopyColor: 0xef4444, // Red & White stripes
        icon: '🌭'
      },
      {
        id: 'pretzel_park',
        name: 'Central Park Pretzel & Coffee',
        item: 'Fresh Pretzel & Latte',
        price: 4.0,
        x: -15,
        z: -15,
        canopyColor: 0x10b981, // Emerald Green stripes
        icon: '🥨'
      },
      {
        id: 'wraps_hospital',
        name: 'QuickBite Healthy Wraps',
        item: 'Fresh Avocado Wrap',
        price: 6.0,
        x: 160,
        z: 160,
        canopyColor: 0x0284c7, // Sky Blue stripes
        icon: '🌯'
      },
      {
        id: 'burger_google',
        name: 'Android Gourmet Burgers',
        item: 'Double Cheeseburger',
        price: 8.0,
        x: 90,
        z: 90,
        canopyColor: 0xf59e0b, // Amber Gold stripes
        icon: '🍔'
      },
      {
        id: 'donuts_police',
        name: "Cop's Donut & Coffee Depot",
        item: 'Glazed Donut & Espresso',
        price: 3.0,
        x: -90,
        z: -160,
        canopyColor: 0x3b82f6, // Royal Blue stripes
        icon: '🍩'
      },
      {
        id: 'pizza_downtown',
        name: 'Empire Pizza Slice',
        item: 'Pepperoni Pizza Slice',
        price: 4.0,
        x: 90,
        z: -90,
        canopyColor: 0xd97706, // Brick Red/Orange stripes
        icon: '🍕'
      }
    ];

    for (const conf of stallsConfig) {
      this.foodStalls.push(conf);

      const cartGroup = new THREE.Group();
      cartGroup.position.set(conf.x, 0.35, conf.z);
      this.cityGroup.add(cartGroup);

      // Cart Body & Counter
      const cartMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.4 });
      const woodTrimMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.7 });

      const cartBody = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.2, 1.4), cartMat);
      cartBody.position.y = 0.6;
      cartBody.castShadow = true;
      cartGroup.add(cartBody);

      // Counter Top
      const counterTop = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.15, 1.6), woodTrimMat);
      counterTop.position.y = 1.25;
      cartGroup.add(counterTop);

      // Cart Wheels (2 large spoked wheels)
      const wheelGeo = new THREE.CylinderGeometry(0.48, 0.48, 0.12, 16);
      wheelGeo.rotateZ(Math.PI / 2);
      const wheelMat = new THREE.MeshStandardMaterial({ color: 0x18181b, metalness: 0.7 });

      const w1 = new THREE.Mesh(wheelGeo, wheelMat);
      w1.position.set(-1.3, 0.48, 0);
      cartGroup.add(w1);

      const w2 = new THREE.Mesh(wheelGeo, wheelMat);
      w2.position.set(1.3, 0.48, 0);
      cartGroup.add(w2);

      // Striped Overhead Canopy
      const canopyGeo = new THREE.ConeGeometry(2.2, 0.9, 10);
      const canopyMat = new THREE.MeshStandardMaterial({ color: conf.canopyColor, roughness: 0.6 });
      const canopy = new THREE.Mesh(canopyGeo, canopyMat);
      canopy.position.y = 2.8;
      canopy.castShadow = true;
      cartGroup.add(canopy);

      // Canopy Brass Support Poles
      const poleGeo = new THREE.CylinderGeometry(0.04, 0.04, 1.6, 6);
      const poleMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.8 });
      const pL = new THREE.Mesh(poleGeo, poleMat);
      pL.position.set(-1.1, 2.0, 0);
      cartGroup.add(pL);

      const pR = new THREE.Mesh(poleGeo, poleMat);
      pR.position.set(1.1, 2.0, 0);
      cartGroup.add(pR);

      // Heated Glass Food Warmer Display Case
      const warmer = new THREE.Mesh(
        new THREE.BoxGeometry(1.2, 0.6, 0.8),
        new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.6, roughness: 0.1 })
      );
      warmer.position.set(0, 1.6, 0);
      cartGroup.add(warmer);

      // Cozy Warm Heat Lamp
      const heatLight = new THREE.PointLight(0xf59e0b, 1.0, 6.0);
      heatLight.position.set(0, 2.4, 0);
      cartGroup.add(heatLight);

      // Vendor NPC Standing Behind Cart
      const vendor = new THREE.Group();
      vendor.position.set(0, 0, -1.1);
      cartGroup.add(vendor);

      // White Apron Body
      const vBody = new THREE.Mesh(
        new THREE.BoxGeometry(0.5, 0.9, 0.3),
        new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.8 })
      );
      vBody.position.y = 0.9;
      vendor.add(vBody);

      // Head
      const vHead = new THREE.Mesh(
        new THREE.SphereGeometry(0.2, 8, 8),
        new THREE.MeshStandardMaterial({ color: 0xf5d0a9, roughness: 0.8 })
      );
      vHead.position.y = 1.5;
      vendor.add(vHead);

      // White Chef Hat
      const chefHat = new THREE.Mesh(
        new THREE.CylinderGeometry(0.24, 0.22, 0.35, 10),
        new THREE.MeshStandardMaterial({ color: 0xffffff })
      );
      chefHat.position.y = 1.8;
      vendor.add(chefHat);
    }
  }

  /**
   * Builds the Downtown Street Basketball Court:
   * Regulation painted court, 2 hoops with backboards & nets, chain-link fence,
   * floodlights, spectator bleachers, and animated streetball players.
   */
  _buildBasketballCourt(centerX, centerZ, size) {
    const courtGroup = new THREE.Group();
    this.cityGroup.add(courtGroup);

    // 1. Raised Concrete Slab Foundation
    const slabGeo = new THREE.BoxGeometry(34, 0.38, 20);
    const slabMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.8 });
    const slab = new THREE.Mesh(slabGeo, slabMat);
    slab.position.set(centerX, 0.19, centerZ);
    slab.receiveShadow = true;
    courtGroup.add(slab);

    // 2. High-Contrast Streetball Court Texture (Royal Blue & Terracotta Red)
    const courtCanvas = document.createElement('canvas');
    courtCanvas.width = 512;
    courtCanvas.height = 256;
    const cCtx = courtCanvas.getContext('2d');

    // Royal Blue Outer Court Surface
    cCtx.fillStyle = '#1d4ed8';
    cCtx.fillRect(0, 0, 512, 256);

    // Terracotta Red Center & 3-Point Paint Areas
    cCtx.fillStyle = '#c2410c';
    cCtx.fillRect(32, 24, 448, 208);

    // Inner Court Royal Blue
    cCtx.fillStyle = '#2563eb';
    cCtx.fillRect(40, 32, 432, 192);

    // Paint / Key Area Red Rectangles
    cCtx.fillStyle = '#dc2626';
    cCtx.fillRect(40, 92, 90, 72);
    cCtx.fillRect(382, 92, 90, 72);

    // Crisp White Regulation Court Lines
    cCtx.strokeStyle = '#ffffff';
    cCtx.lineWidth = 4;

    // Court Perimeter Boundary
    cCtx.strokeRect(40, 32, 432, 192);

    // Half-Court Division Line
    cCtx.beginPath();
    cCtx.moveTo(256, 32);
    cCtx.lineTo(256, 224);
    cCtx.stroke();

    // Center Jump Circle
    cCtx.beginPath();
    cCtx.arc(256, 128, 42, 0, Math.PI * 2);
    cCtx.stroke();

    // Center Basketball Graphic
    cCtx.fillStyle = '#f97316';
    cCtx.beginPath();
    cCtx.arc(256, 128, 24, 0, Math.PI * 2);
    cCtx.fill();
    cCtx.strokeStyle = '#000000';
    cCtx.lineWidth = 2;
    cCtx.stroke();

    // Free Throw Circles
    cCtx.strokeStyle = '#ffffff';
    cCtx.lineWidth = 3;
    cCtx.beginPath();
    cCtx.arc(130, 128, 36, 0, Math.PI * 2);
    cCtx.stroke();
    cCtx.beginPath();
    cCtx.arc(382, 128, 36, 0, Math.PI * 2);
    cCtx.stroke();

    // 3-Point Arcs
    cCtx.beginPath();
    cCtx.arc(60, 128, 92, -Math.PI / 2.3, Math.PI / 2.3);
    cCtx.stroke();
    cCtx.beginPath();
    cCtx.arc(452, 128, 92, Math.PI - Math.PI / 2.3, Math.PI + Math.PI / 2.3);
    cCtx.stroke();

    const courtTex = new THREE.CanvasTexture(courtCanvas);
    const courtPlaneGeo = new THREE.PlaneGeometry(32, 18);
    courtPlaneGeo.rotateX(-Math.PI / 2);
    const courtPlaneMat = new THREE.MeshStandardMaterial({
      map: courtTex,
      roughness: 0.65,
      metalness: 0.1
    });
    const courtMesh = new THREE.Mesh(courtPlaneGeo, courtPlaneMat);
    courtMesh.position.set(centerX, 0.39, centerZ);
    courtMesh.receiveShadow = true;
    courtGroup.add(courtMesh);

    // 3. Regulation Basketball Hoops (West & East Ends)
    const steelMat = new THREE.MeshStandardMaterial({ color: 0x111827, metalness: 0.9, roughness: 0.2 });
    const rimMat = new THREE.MeshStandardMaterial({ color: 0xf97316, metalness: 0.8, roughness: 0.2 });
    const netMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.9, wireframe: true });
    const glassMat = new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.7, roughness: 0.1 });

    const hoopPositions = [
      { x: centerX - 14.5, rotY: 0 },
      { x: centerX + 14.5, rotY: Math.PI }
    ];

    for (const h of hoopPositions) {
      const hGroup = new THREE.Group();
      hGroup.position.set(h.x, 0, centerZ);
      hGroup.rotation.y = h.rotY;

      // Heavy Duty Angled Gooseneck Steel Support Post
      const postGeo = new THREE.CylinderGeometry(0.14, 0.18, 4.4, 8);
      const post = new THREE.Mesh(postGeo, steelMat);
      post.position.set(-1.0, 2.2, 0);
      post.castShadow = true;
      hGroup.add(post);

      // Black Protective Padding at post base
      const padGeo = new THREE.BoxGeometry(0.6, 1.8, 0.6);
      const pad = new THREE.Mesh(padGeo, new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.9 }));
      pad.position.set(-1.0, 0.9, 0);
      hGroup.add(pad);

      // Overhang Extension Arm
      const armGeo = new THREE.BoxGeometry(1.4, 0.12, 0.12);
      const arm = new THREE.Mesh(armGeo, steelMat);
      arm.position.set(-0.35, 3.8, 0);
      hGroup.add(arm);

      // Acrylic Backboard
      const bbGeo = new THREE.BoxGeometry(0.06, 1.2, 1.8);
      const bb = new THREE.Mesh(bbGeo, glassMat);
      bb.position.set(0.35, 3.8, 0);
      bb.castShadow = true;
      hGroup.add(bb);

      // White Inner Target Box on Backboard
      const targetGeo = new THREE.BoxGeometry(0.07, 0.5, 0.65);
      const target = new THREE.Mesh(targetGeo, new THREE.MeshBasicMaterial({ color: 0xffffff }));
      target.position.set(0.36, 3.7, 0);
      hGroup.add(target);

      // Orange Steel Breakaway Rim
      const rimGeo = new THREE.TorusGeometry(0.32, 0.032, 8, 16);
      rimGeo.rotateX(Math.PI / 2);
      const rim = new THREE.Mesh(rimGeo, rimMat);
      rim.position.set(0.72, 3.3, 0);
      hGroup.add(rim);

      // Hanging White Chain/Nylon Net
      const netGeo = new THREE.ConeGeometry(0.3, 0.45, 12, 1, true);
      const net = new THREE.Mesh(netGeo, netMat);
      net.position.set(0.72, 3.05, 0);
      hGroup.add(net);

      courtGroup.add(hGroup);
    }

    // 4. Perimeter Galvanized Chain-Link Fence
    const fenceMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      metalness: 0.85,
      roughness: 0.4,
      wireframe: true
    });
    const postMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.8 });

    const fenceH = 4.2;
    const fWest = new THREE.Mesh(new THREE.PlaneGeometry(20, fenceH), fenceMat);
    fWest.position.set(centerX - 17, fenceH / 2 + 0.38, centerZ);
    fWest.rotateY(Math.PI / 2);
    courtGroup.add(fWest);

    const fEast = new THREE.Mesh(new THREE.PlaneGeometry(20, fenceH), fenceMat);
    fEast.position.set(centerX + 17, fenceH / 2 + 0.38, centerZ);
    fEast.rotateY(-Math.PI / 2);
    courtGroup.add(fEast);

    // North & South fences with open entrance gates
    [-10, 10].forEach(fz => {
      const f1 = new THREE.Mesh(new THREE.PlaneGeometry(13, fenceH), fenceMat);
      f1.position.set(centerX - 9.5, fenceH / 2 + 0.38, centerZ + fz);
      courtGroup.add(f1);

      const f2 = new THREE.Mesh(new THREE.PlaneGeometry(13, fenceH), fenceMat);
      f2.position.set(centerX + 9.5, fenceH / 2 + 0.38, centerZ + fz);
      courtGroup.add(f2);
    });

    // 5. 4x Corner Floodlight Towers
    const cornerFloodlights = [
      [centerX - 17, centerZ - 10],
      [centerX + 17, centerZ - 10],
      [centerX - 17, centerZ + 10],
      [centerX + 17, centerZ + 10]
    ];
    for (const [fx, fz] of cornerFloodlights) {
      const poleGeo = new THREE.CylinderGeometry(0.18, 0.28, 10, 8);
      const pole = new THREE.Mesh(poleGeo, postMat);
      pole.position.set(fx, 5, fz);
      courtGroup.add(pole);

      const bankGeo = new THREE.BoxGeometry(1.6, 0.6, 0.8);
      const bank = new THREE.Mesh(bankGeo, steelMat);
      bank.position.set(fx, 9.8, fz);
      bank.lookAt(centerX, 1, centerZ);
      courtGroup.add(bank);

      const bulbGeo = new THREE.SphereGeometry(0.28, 8, 8);
      const bulb = new THREE.Mesh(bulbGeo, new THREE.MeshBasicMaterial({ color: 0xffedd5 }));
      bulb.position.set(fx, 9.7, fz);
      courtGroup.add(bulb);
    }

    // 6. Sideline Aluminum Bleachers & Amenities
    const bleacherGeo = new THREE.BoxGeometry(12, 1.6, 2.5);
    const bleacherMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9, roughness: 0.2 });
    const bleachers = new THREE.Mesh(bleacherGeo, bleacherMat);
    bleachers.position.set(centerX, 0.9, centerZ - 12);
    courtGroup.add(bleachers);

    // 7. Animated Streetball Players & Bouncing Basketball
    const p1 = this._createBallerMesh(0xd90429, 0xffffff); // Red Jersey #23
    p1.position.set(centerX - 4, 0.38, centerZ);
    courtGroup.add(p1);

    const ballGeo = new THREE.SphereGeometry(0.26, 12, 12);
    const ballMat = new THREE.MeshStandardMaterial({ color: 0xea580c, roughness: 0.5 });
    const ballMesh = new THREE.Mesh(ballGeo, ballMat);
    ballMesh.position.set(centerX - 3.4, 1.2, centerZ);
    ballMesh.castShadow = true;
    courtGroup.add(ballMesh);

    const p2 = this._createBallerMesh(0x2563eb, 0xfacc15); // Blue Jersey #30
    p2.position.set(centerX - 1.5, 0.38, centerZ);
    p2.rotation.y = Math.PI;
    courtGroup.add(p2);

    const p3 = this._createBallerMesh(0x16a34a, 0xffffff); // Green Jersey #7
    p3.position.set(centerX + 6, 0.38, centerZ + 4);
    p3.rotation.y = -Math.PI / 3;
    courtGroup.add(p3);

    this.basketballPlayers.push({
      playerMesh: p1,
      ballMesh: ballMesh,
      basePos: new THREE.Vector3(centerX - 4, 0.38, centerZ)
    });

    // Perimeter fencing colliders
    this.buildingColliders.push(
      { minX: centerX - 18, maxX: centerX - 16, minZ: centerZ - 10, maxZ: centerZ + 10, height: 4 },
      { minX: centerX + 16, maxX: centerX + 18, minZ: centerZ - 10, maxZ: centerZ + 10, height: 4 },
      { minX: centerX - 6, maxX: centerX + 6, minZ: centerZ - 13.5, maxZ: centerZ - 11.5, height: 2 }
    );
  }

  /**
   * Helper to build a stylized low-poly street basketball player.
   */
  _createBallerMesh(jerseyColor, numberColor) {
    const baller = new THREE.Group();
    // Torso in athletic jersey
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.85, 0.35), new THREE.MeshStandardMaterial({ color: jerseyColor, roughness: 0.6 }));
    torso.position.y = 1.35;
    baller.add(torso);

    // Head with athletic sweatband
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.24, 8, 8), new THREE.MeshStandardMaterial({ color: 0x8d5524 }));
    head.position.y = 1.95;
    baller.add(head);

    const band = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.04, 6, 16), new THREE.MeshBasicMaterial({ color: numberColor }));
    band.rotateX(Math.PI / 2);
    band.position.y = 2.02;
    baller.add(band);

    // Basketball shorts
    const shorts = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.55, 0.38), new THREE.MeshStandardMaterial({ color: jerseyColor }));
    shorts.position.y = 0.85;
    baller.add(shorts);

    // Legs & sneakers
    const legGeo = new THREE.BoxGeometry(0.18, 0.65, 0.18);
    const legMat = new THREE.MeshStandardMaterial({ color: 0x8d5524 });
    const shoeMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
    [-0.16, 0.16].forEach(lx => {
      const leg = new THREE.Mesh(legGeo, legMat);
      leg.position.set(lx, 0.45, 0);
      baller.add(leg);

      const shoe = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.16, 0.35), shoeMat);
      shoe.position.set(lx, 0.08, 0.06);
      baller.add(shoe);
    });

    return baller;
  }

  /**
   * Builds dense perimeter forest woodlands surrounding the metropolis
   * and extra-dense scenic alpine groves at the 4 corner vertices.
   */
  _buildPerimeterForest() {
    const bounds = this.roadNetwork.getCityBounds();
    const forestGroup = new THREE.Group();
    this.cityGroup.add(forestGroup);

    // Outer perimeter extents
    const minX = bounds.minX - 10;
    const maxX = bounds.maxX + 10;
    const minZ = bounds.minZ - 10;
    const maxZ = bounds.maxZ + 10;

    // 1. North & South Forest Borders
    for (let x = minX - 60; x <= maxX + 60; x += 18) {
      for (let zOffset = 25; zOffset <= 120; zOffset += 24) {
        // North border
        const jxN = x + (Math.random() - 0.5) * 12;
        const jzN = maxZ + zOffset + (Math.random() - 0.5) * 10;
        this._addForestTree(forestGroup, jxN, jzN);

        // South border
        const jxS = x + (Math.random() - 0.5) * 12;
        const jzS = minZ - zOffset + (Math.random() - 0.5) * 10;
        this._addForestTree(forestGroup, jxS, jzS);
      }
    }

    // 2. East & West Forest Borders
    for (let z = minZ - 60; z <= maxZ + 60; z += 18) {
      for (let xOffset = 25; xOffset <= 120; xOffset += 24) {
        // East border
        const jxE = maxX + xOffset + (Math.random() - 0.5) * 10;
        const jzE = z + (Math.random() - 0.5) * 12;
        this._addForestTree(forestGroup, jxE, jzE);

        // West border
        const jxW = minX - xOffset + (Math.random() - 0.5) * 10;
        const jzW = z + (Math.random() - 0.5) * 12;
        this._addForestTree(forestGroup, jxW, jzW);
      }
    }

    // 3. Dense Mountain Groves & Rocky Crags at 4 Corner Vertices
    const corners = [
      { cx: minX - 65, cz: minZ - 65 }, // North-West
      { cx: maxX + 65, cz: minZ - 65 }, // North-East
      { cx: minX - 65, cz: maxZ + 65 }, // South-West
      { cx: maxX + 65, cz: maxZ + 65 }  // South-East
    ];

    for (const c of corners) {
      // 40+ Towering Conifers per corner vertex
      for (let i = 0; i < 42; i++) {
        const tx = c.cx + (Math.random() - 0.5) * 90;
        const tz = c.cz + (Math.random() - 0.5) * 90;
        this._addForestTree(forestGroup, tx, tz, true);
      }

      // Massive Granite Ridge Boulders
      for (let b = 0; b < 10; b++) {
        const bx = c.cx + (Math.random() - 0.5) * 75;
        const bz = c.cz + (Math.random() - 0.5) * 75;
        const bScale = 3.5 + Math.random() * 4.5;
        const rockGeo = new THREE.DodecahedronGeometry(bScale, 0);
        const rockMat = new THREE.MeshStandardMaterial({
          color: Math.random() > 0.5 ? 0x475569 : 0x334155,
          roughness: 0.95
        });
        const rock = new THREE.Mesh(rockGeo, rockMat);
        rock.position.set(bx, bScale * 0.45, bz);
        rock.rotation.set(Math.random() * 3, Math.random() * 3, Math.random() * 3);
        rock.castShadow = true;
        forestGroup.add(rock);
      }

      // Scenic Mountain Hillock Mounds
      const moundGeo = new THREE.SphereGeometry(32, 12, 8);
      const moundMat = new THREE.MeshStandardMaterial({ color: 0x14532d, roughness: 0.95 });
      const mound = new THREE.Mesh(moundGeo, moundMat);
      mound.position.set(c.cx, -20, c.cz);
      mound.scale.set(1.4, 0.45, 1.4);
      forestGroup.add(mound);
    }
  }

  /**
   * Helper to spawn individual forest evergreen pine or lush broadleaf tree.
   */
  _addForestTree(group, x, z, isAlpine = false) {
    const isPine = isAlpine || Math.random() > 0.35;
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x3f220d, roughness: 0.95 });

    if (isPine) {
      // Tall Multi-Tiered Mountain Evergreen Pine
      const hScale = isAlpine ? (1.3 + Math.random() * 0.4) : (0.9 + Math.random() * 0.3);
      const trunkH = 5.5 * hScale;
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.35 * hScale, 0.6 * hScale, trunkH, 6), trunkMat);
      trunk.position.set(x, trunkH / 2, z);
      trunk.castShadow = true;
      group.add(trunk);

      // 3 Conical Needle Foliage Tiers
      const pineColors = [0x14532d, 0x166534, 0x15803d];
      const tier1 = new THREE.Mesh(new THREE.ConeGeometry(3.6 * hScale, 4.2 * hScale, 7), new THREE.MeshStandardMaterial({ color: pineColors[0], roughness: 0.8 }));
      tier1.position.set(x, trunkH + 1.2 * hScale, z);
      tier1.castShadow = true;
      group.add(tier1);

      const tier2 = new THREE.Mesh(new THREE.ConeGeometry(2.7 * hScale, 3.6 * hScale, 7), new THREE.MeshStandardMaterial({ color: pineColors[1], roughness: 0.8 }));
      tier2.position.set(x, trunkH + 3.4 * hScale, z);
      tier2.castShadow = true;
      group.add(tier2);

      const tier3 = new THREE.Mesh(new THREE.ConeGeometry(1.6 * hScale, 2.8 * hScale, 7), new THREE.MeshStandardMaterial({ color: pineColors[2], roughness: 0.8 }));
      tier3.position.set(x, trunkH + 5.2 * hScale, z);
      tier3.castShadow = true;
      group.add(tier3);

    } else {
      // Lush Deciduous Broadleaf Forest Tree
      const trunkH = 4.0;
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.5, trunkH, 6), trunkMat);
      trunk.position.set(x, trunkH / 2, z);
      trunk.castShadow = true;
      group.add(trunk);

      const foliageMat = new THREE.MeshStandardMaterial({
        color: Math.random() > 0.4 ? 0x15803d : 0x16a34a,
        roughness: 0.75
      });
      const crown1 = new THREE.Mesh(new THREE.SphereGeometry(3.0, 8, 8), foliageMat);
      crown1.position.set(x, trunkH + 2.2, z);
      crown1.castShadow = true;
      group.add(crown1);

      const crown2 = new THREE.Mesh(new THREE.SphereGeometry(2.2, 7, 7), foliageMat);
      crown2.position.set(x + 0.8, trunkH + 3.6, z - 0.6);
      crown2.castShadow = true;
      group.add(crown2);
    }
  }

  /**
   * Checks if player taxi has entered the Driver Safehouse tuning bay.
   * If entered, refuels nitro to 100%, cleans car, and triggers reward.
   * @param {import('../gameplay/Car.js').Car} car
   * @param {number} delta
   * @param {import('../core/AudioManager.js').AudioManager} [audio]
   * @returns {{ entered: boolean, message: string } | null}
   */
  checkSafehouseZone(car, delta, audio) {
    if (!this.safehouseLocation) return null;

    if (this.safehouseCooldown > 0) {
      this.safehouseCooldown -= delta;
    }

    const dx = car.position.x - this.safehouseLocation.x;
    const dz = car.position.z - this.safehouseLocation.z;
    const distSq = dx * dx + dz * dz;

    if (distSq < this.safehouseLocation.radius * this.safehouseLocation.radius && Math.abs(car.speed) < 14) {
      if (this.safehouseCooldown <= 0) {
        this.safehouseCooldown = 10.0; // 10 second cooldown
        car.nitro = 100;
        if (audio) {
          audio.playPickupSound();
        }
        return {
          entered: true,
          message: '🛠️ SAFEHOUSE: TAXI TUNED & NITRO 100% REFILLED!'
        };
      }
    }
    return null;
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
   * Adds glowing neon architectural edge lighting, corner strips, and rooftop cornices to skyscrapers.
   * Luminous and brilliant during NIGHT and RAIN weather modes.
   */
  _addBuildingNeonLights(x, z, width, depth, height, colorIndex = 0, baseYOffset = 0) {
    const neonColors = [
      0x00f0ff, // Cyber Cyan
      0xff007f, // Hot Magenta / Neon Pink
      0xffb703, // Golden Amber
      0xa855f7, // Electric Purple
      0x10b981, // Emerald Matrix Green
      0x38bdf8  // Vivid Sky Blue
    ];
    const color = neonColors[colorIndex % neonColors.length];
    const secondaryColor = neonColors[(colorIndex + 2) % neonColors.length];

    const neonMat = new THREE.MeshStandardMaterial({
      color: color,
      emissive: color,
      emissiveIntensity: 0.08,
      roughness: 0.2,
      metalness: 0.8
    });
    this.buildingNeonElements.push({ mat: neonMat, baseIntensity: 2.8, color, factor: 1.0 });

    const stripThickness = 0.35;
    const halfW = width / 2;
    const halfD = depth / 2;
    const baseFloorY = baseYOffset + 0.35;
    const midY = baseFloorY + height / 2;
    const roofY = baseFloorY + height;

    // 1. Four vertical corner strips
    const corners = [
      [-halfW, -halfD],
      [halfW, -halfD],
      [-halfW, halfD],
      [halfW, halfD]
    ];
    const vGeo = new THREE.BoxGeometry(stripThickness, height, stripThickness);
    for (const [cx, cz] of corners) {
      const vStrip = new THREE.Mesh(vGeo, neonMat);
      vStrip.position.set(x + cx, midY, z + cz);
      this.cityGroup.add(vStrip);
    }

    // 2. Rooftop perimeter neon cornice band
    const hMat = new THREE.MeshStandardMaterial({
      color: secondaryColor,
      emissive: secondaryColor,
      emissiveIntensity: 0.08,
      roughness: 0.2,
      metalness: 0.8
    });
    this.buildingNeonElements.push({ mat: hMat, baseIntensity: 2.5, color: secondaryColor, factor: 0.95 });

    const bandXGeo = new THREE.BoxGeometry(width + 0.2, stripThickness, stripThickness);
    const bandZGeo = new THREE.BoxGeometry(stripThickness, stripThickness, depth + 0.2);

    const b1 = new THREE.Mesh(bandXGeo, hMat);
    b1.position.set(x, roofY, z - halfD);
    this.cityGroup.add(b1);

    const b2 = new THREE.Mesh(bandXGeo, hMat);
    b2.position.set(x, roofY, z + halfD);
    this.cityGroup.add(b2);

    const b3 = new THREE.Mesh(bandZGeo, hMat);
    b3.position.set(x - halfW, roofY, z);
    this.cityGroup.add(b3);

    const b4 = new THREE.Mesh(bandZGeo, hMat);
    b4.position.set(x + halfW, roofY, z);
    this.cityGroup.add(b4);

    // 3. For skyscrapers > 45m, add an intermediate mid-level neon accent band
    if (height > 45) {
      const midBandY = baseFloorY + height * 0.55;
      const m1 = new THREE.Mesh(bandXGeo, neonMat);
      m1.position.set(x, midBandY, z - halfD);
      this.cityGroup.add(m1);

      const m2 = new THREE.Mesh(bandXGeo, neonMat);
      m2.position.set(x, midBandY, z + halfD);
      this.cityGroup.add(m2);

      const m3 = new THREE.Mesh(bandZGeo, neonMat);
      m3.position.set(x - halfW, midBandY, z);
      this.cityGroup.add(m3);

      const m4 = new THREE.Mesh(bandZGeo, neonMat);
      m4.position.set(x + halfW, midBandY, z);
      this.cityGroup.add(m4);
    }
  }

  /**
   * Sets the atmospheric weather mode and updates all building neon lights.
   * During NIGHT and RAIN, neon glows intensely across the entire city!
   * @param {'NIGHT' | 'SUNSET' | 'DAY' | 'RAIN'} mode
   */
  setWeatherMode(mode) {
    this.currentWeatherMode = mode;
    let targetIntensity = 0.08;
    if (mode === 'NIGHT') {
      targetIntensity = 2.85;
    } else if (mode === 'RAIN') {
      targetIntensity = 2.2;
    } else if (mode === 'SUNSET') {
      targetIntensity = 0.95;
    }

    for (const item of this.buildingNeonElements) {
      if (item.mat) {
        item.mat.emissiveIntensity = targetIntensity * (item.factor || 1.0);
      }
    }
  }

  /**
   * Builds the lush perimeter forest spanning the outer edges and the 4 corner vertices of the city:
   * - Lush green grass terrain ground planes covering outer margin and corners
   * - Rolling low-poly mountain foothills & wildflower meadows
   * - 24+ reflective water puddles with smooth river pebbles and green reeds
   * - Dense forest trees (Deciduous Oaks, Flowering Cherries, Conical Evergreens)
   * - Animated 3D wildlife: Grazing Deer, Hopping Bunnies, and Trotting Foxes
   */
  _buildPerimeterForest() {
    const forestGroup = new THREE.Group();
    this.cityGroup.add(forestGroup);

    const grassMat = this.materials.forestGrass || new THREE.MeshStandardMaterial({
      color: 0x15803d,
      roughness: 0.85
    });
    const mudRedMat = this.materials.mudRedPavement || new THREE.MeshStandardMaterial({
      color: 0x991b1b,
      roughness: 0.78,
      metalness: 0.12
    });
    const curbMat = this.materials.curb || new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.85
    });
    const sidewalkMat = new THREE.MeshStandardMaterial({
      map: this.textures.sidewalk,
      roughness: 0.8
    });

    // =============================================================
    // 1. PERIMETER ROAD SIDEWALK (from road edge 288 to 294)
    // =============================================================
    // North & South outer sidewalks
    const swBeltGeo = new THREE.BoxGeometry(576, 0.14, 6);
    const swNorth = new THREE.Mesh(swBeltGeo, sidewalkMat);
    swNorth.position.set(0, 0.07, 291);
    swNorth.receiveShadow = true;
    forestGroup.add(swNorth);

    const swSouth = new THREE.Mesh(swBeltGeo, sidewalkMat);
    swSouth.position.set(0, 0.07, -291);
    swSouth.receiveShadow = true;
    forestGroup.add(swSouth);

    // East & West outer sidewalks
    const swSideGeo = new THREE.BoxGeometry(6, 0.14, 576);
    const swEast = new THREE.Mesh(swSideGeo, sidewalkMat);
    swEast.position.set(291, 0.07, 0);
    swEast.receiveShadow = true;
    forestGroup.add(swEast);

    const swWest = new THREE.Mesh(swSideGeo, sidewalkMat);
    swWest.position.set(-291, 0.07, 0);
    swWest.receiveShadow = true;
    forestGroup.add(swWest);

    // 4 Corner sidewalk junctions
    const swCornerGeo = new THREE.BoxGeometry(6, 0.14, 6);
    for (const [cx, cz] of [[291, 291], [-291, 291], [291, -291], [-291, -291]]) {
      const swCorner = new THREE.Mesh(swCornerGeo, sidewalkMat);
      swCorner.position.set(cx, 0.07, cz);
      swCorner.receiveShadow = true;
      forestGroup.add(swCorner);
    }

    // =============================================================
    // 2. WALKING MUD-RED COLOUR PAVEMENT PROMENADE (from 294 to 304)
    // Cleanly separates the city roads/sidewalks from the green forest!
    // =============================================================
    const promThick = 10; // 10 meters wide walking promenade
    const promElevation = 0.16;

    // North & South Mud-Red Promenade Belts (center Z = ±299)
    const promHorizGeo = new THREE.BoxGeometry(588, promElevation, promThick);
    const promNorth = new THREE.Mesh(promHorizGeo, mudRedMat);
    promNorth.position.set(0, promElevation / 2, 299);
    promNorth.receiveShadow = true;
    forestGroup.add(promNorth);

    const promSouth = new THREE.Mesh(promHorizGeo, mudRedMat);
    promSouth.position.set(0, promElevation / 2, -299);
    promSouth.receiveShadow = true;
    forestGroup.add(promSouth);

    // East & West Mud-Red Promenade Belts (center X = ±299)
    const promVertGeo = new THREE.BoxGeometry(promThick, promElevation, 588);
    const promEast = new THREE.Mesh(promVertGeo, mudRedMat);
    promEast.position.set(299, promElevation / 2, 0);
    promEast.receiveShadow = true;
    forestGroup.add(promEast);

    const promWest = new THREE.Mesh(promVertGeo, mudRedMat);
    promWest.position.set(-299, promElevation / 2, 0);
    promWest.receiveShadow = true;
    forestGroup.add(promWest);

    // 4 Corner Promenade Plaza Squares
    const promCornerGeo = new THREE.BoxGeometry(promThick, promElevation, promThick);
    for (const [cx, cz] of [[299, 299], [-299, 299], [299, -299], [-299, -299]]) {
      const promCorner = new THREE.Mesh(promCornerGeo, mudRedMat);
      promCorner.position.set(cx, promElevation / 2, cz);
      promCorner.receiveShadow = true;
      forestGroup.add(promCorner);
    }

    // Raised Stone Curb Borders along both edges of the mud-red promenade
    const curbH = 0.22;
    const curbW = 0.35;
    const curbHorizGeo = new THREE.BoxGeometry(608, curbH, curbW);
    const curbVertGeo = new THREE.BoxGeometry(curbW, curbH, 608);

    // Inner Curbs at ±294 (bordering sidewalk)
    for (const z of [294, -294]) {
      const c = new THREE.Mesh(curbHorizGeo, curbMat);
      c.position.set(0, curbH / 2, z);
      forestGroup.add(c);
    }
    for (const x of [294, -294]) {
      const c = new THREE.Mesh(curbVertGeo, curbMat);
      c.position.set(x, curbH / 2, 0);
      forestGroup.add(c);
    }

    // Outer Curbs at ±304 (bordering green forest floor)
    for (const z of [304, -304]) {
      const c = new THREE.Mesh(curbHorizGeo, curbMat);
      c.position.set(0, curbH / 2, z);
      forestGroup.add(c);
    }
    for (const x of [304, -304]) {
      const c = new THREE.Mesh(curbVertGeo, curbMat);
      c.position.set(x, curbH / 2, 0);
      forestGroup.add(c);
    }

    // Decorative Promenade Lanterns & Wooden Park Benches
    const lanternMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8 });
    const lampGlowMat = new THREE.MeshBasicMaterial({ color: 0xfbbf24 });
    const benchWoodMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.7 });

    const spawnPromenadeFurniture = (px, pz, rotY) => {
      // Pedestrian promenade lamp post
      const poleGeo = new THREE.CylinderGeometry(0.08, 0.12, 4.2, 6);
      const pole = new THREE.Mesh(poleGeo, lanternMat);
      pole.position.set(px, 2.1, pz);
      forestGroup.add(pole);

      const lampHead = new THREE.Mesh(new THREE.DodecahedronGeometry(0.28, 1), lampGlowMat);
      lampHead.position.set(px, 4.3, pz);
      forestGroup.add(lampHead);

      // Wooden park bench overlooking the forest
      const bench = new THREE.Group();
      bench.position.set(px + (rotY === 0 ? 3.5 : 0), 0.2, pz + (rotY !== 0 ? 3.5 : 0));
      bench.rotation.y = rotY;

      const seat = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.1, 0.6), benchWoodMat);
      seat.position.y = 0.45;
      bench.add(seat);

      const backrest = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.5, 0.1), benchWoodMat);
      backrest.position.set(0, 0.75, -0.25);
      bench.add(backrest);

      const leg1 = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.45, 0.5), lanternMat);
      leg1.position.set(-0.85, 0.22, 0);
      bench.add(leg1);
      const leg2 = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.45, 0.5), lanternMat);
      leg2.position.set(0.85, 0.22, 0);
      bench.add(leg2);

      forestGroup.add(bench);
    };

    // Place promenade lamps & benches every ~48m
    for (let pos = -240; pos <= 240; pos += 48) {
      spawnPromenadeFurniture(pos, 299, 0);
      spawnPromenadeFurniture(pos, -299, Math.PI);
      spawnPromenadeFurniture(299, pos, Math.PI / 2);
      spawnPromenadeFurniture(-299, pos, -Math.PI / 2);
    }

    // =============================================================
    // 3. GREEN FOREST FLOOR (STRICTLY OUTSIDE ±304 - ZERO ROAD OVERLAP!)
    // =============================================================
    const forestInnerBound = 304;
    const forestOuterBound = 540;
    const forestBeltThick = forestOuterBound - forestInnerBound; // 236 meters
    const forestCenter = (forestInnerBound + forestOuterBound) / 2; // 422 meters
    const innerCitySpan = forestInnerBound * 2; // 608 meters

    // 4 Corner Vertices Quadrants (size 236 x 236, center ±422, ±422)
    const cGeo = new THREE.PlaneGeometry(forestBeltThick, forestBeltThick);
    cGeo.rotateX(-Math.PI / 2);

    for (const [cx, cz] of [
      [forestCenter, forestCenter],    // North-East Vertex
      [-forestCenter, forestCenter],   // North-West Vertex
      [forestCenter, -forestCenter],   // South-East Vertex
      [-forestCenter, -forestCenter]   // South-West Vertex
    ]) {
      const cMesh = new THREE.Mesh(cGeo, grassMat);
      cMesh.position.set(cx, 0.02, cz);
      cMesh.receiveShadow = true;
      forestGroup.add(cMesh);
    }

    // 4 Outer Edge Belts
    // North & South edge belts: width = innerCitySpan (608), depth = forestBeltThick (236)
    const edgeNSGeo = new THREE.PlaneGeometry(innerCitySpan, forestBeltThick);
    edgeNSGeo.rotateX(-Math.PI / 2);

    const northMesh = new THREE.Mesh(edgeNSGeo, grassMat);
    northMesh.position.set(0, 0.02, forestCenter);
    northMesh.receiveShadow = true;
    forestGroup.add(northMesh);

    const southMesh = new THREE.Mesh(edgeNSGeo, grassMat);
    southMesh.position.set(0, 0.02, -forestCenter);
    southMesh.receiveShadow = true;
    forestGroup.add(southMesh);

    // East & West edge belts: width = forestBeltThick (236), depth = innerCitySpan (608)
    const edgeEWGeo = new THREE.PlaneGeometry(forestBeltThick, innerCitySpan);
    edgeEWGeo.rotateX(-Math.PI / 2);

    const eastMesh = new THREE.Mesh(edgeEWGeo, grassMat);
    eastMesh.position.set(forestCenter, 0.02, 0);
    eastMesh.receiveShadow = true;
    forestGroup.add(eastMesh);

    const westMesh = new THREE.Mesh(edgeEWGeo, grassMat);
    westMesh.position.set(-forestCenter, 0.02, 0);
    westMesh.receiveShadow = true;
    forestGroup.add(westMesh);

    // -------------------------------------------------------------
    // 2. Rolling Foothills / Low-Poly Forest Mounds
    // -------------------------------------------------------------
    const hillMat = new THREE.MeshStandardMaterial({
      color: 0x14532d,
      roughness: 0.95,
      flatShading: true
    });
    const hillLocs = [
      [360, 420, 32, 10], [-360, 420, 36, 12], [420, 340, 34, 11], [-420, 340, 30, 9],
      [360, -420, 34, 11], [-360, -420, 38, 13], [420, -340, 32, 10], [-420, -340, 35, 12],
      [0, 440, 45, 14], [0, -440, 45, 14], [440, 0, 45, 14], [-440, 0, 45, 14],
      [220, 430, 30, 9], [-220, 430, 30, 9], [220, -430, 30, 9], [-220, -430, 30, 9]
    ];

    for (const [hx, hz, hRadius, hHeight] of hillLocs) {
      const hillGeo = new THREE.ConeGeometry(hRadius, hHeight, 8);
      const hillMesh = new THREE.Mesh(hillGeo, hillMat);
      hillMesh.position.set(hx, hHeight / 2 - 0.5, hz);
      forestGroup.add(hillMesh);
    }

    // -------------------------------------------------------------
    // 3. Reflective Forest Water Puddles with Stones & Reeds
    // -------------------------------------------------------------
    const puddleLocations = [
      // North-East Corner Vertex
      [325, 325, 6.5], [370, 365, 8.0], [410, 330, 5.5],
      // North-West Corner Vertex
      [-325, 325, 7.0], [-370, 365, 8.5], [-415, 335, 5.0],
      // South-East Corner Vertex
      [330, -330, 6.5], [380, -370, 8.0], [355, -415, 5.5],
      // South-West Corner Vertex
      [-330, -330, 7.5], [-375, -375, 8.0], [-415, -340, 6.0],
      // North Edge Belt
      [-160, 340, 5.8], [0, 360, 8.2], [170, 345, 6.2],
      // South Edge Belt
      [-170, -345, 6.0], [15, -365, 7.8], [180, -340, 6.5],
      // East Edge Belt
      [345, -160, 6.0], [365, 20, 8.0], [340, 165, 6.2],
      // West Edge Belt
      [-345, -160, 6.2], [-365, 0, 8.4], [-340, 165, 5.8]
    ];

    for (const [px, pz, pRadius] of puddleLocations) {
      this._createPuddle(px, pz, pRadius, forestGroup);
    }

    // -------------------------------------------------------------
    // 4. Dense Forest Trees in Corners and Perimeter Belts
    // -------------------------------------------------------------
    // Corners dense tree groves
    const cornerBases = [
      [340, 340], [-340, 340], [340, -340], [-340, -340]
    ];
    for (const [bx, bz] of cornerBases) {
      for (let i = 0; i < 22; i++) {
        const angle = Math.random() * Math.PI * 2;
        const dist = 10 + Math.random() * 85;
        const tx = bx + Math.cos(angle) * dist;
        const tz = bz + Math.sin(angle) * dist;
        const style = i % 3;
        this._addTree(tx, tz, style);
      }
    }

    // Edge belts trees
    for (let i = -240; i <= 240; i += 40) {
      // North edge trees
      this._addTree(i + (Math.random() - 0.5) * 15, 335 + Math.random() * 50, (i + 1) % 3);
      this._addTree(i + (Math.random() - 0.5) * 15, 390 + Math.random() * 40, (i + 2) % 3);

      // South edge trees
      this._addTree(i + (Math.random() - 0.5) * 15, -335 - Math.random() * 50, (i + 2) % 3);
      this._addTree(i + (Math.random() - 0.5) * 15, -390 - Math.random() * 40, (i + 0) % 3);

      // East edge trees
      this._addTree(335 + Math.random() * 50, i + (Math.random() - 0.5) * 15, (i + 0) % 3);
      this._addTree(390 + Math.random() * 40, i + (Math.random() - 0.5) * 15, (i + 1) % 3);

      // West edge trees
      this._addTree(-335 - Math.random() * 50, i + (Math.random() - 0.5) * 15, (i + 1) % 3);
      this._addTree(-390 - Math.random() * 40, i + (Math.random() - 0.5) * 15, (i + 2) % 3);
    }

    // -------------------------------------------------------------
    // 5. Forest Wildlife Animals (Deer, Rabbits, Foxes)
    // -------------------------------------------------------------
    // A. Forest Deer (10 deer grazing in clearings near puddles)
    const deerSpawns = [
      [340, 335, 0.4], [380, 380, -1.2], [-340, 335, 1.8], [-385, 370, -0.6],
      [345, -345, 2.2], [370, -390, -2.5], [-345, -345, -0.8], [-380, -385, 0.9],
      [30, 365, 3.14], [-20, -365, 0.0]
    ];
    for (const [dx, dz, dh] of deerSpawns) {
      this._createDeer(dx, dz, dh, forestGroup);
    }

    // B. Wild Rabbits / Bunnies (16 hopping bunnies in flower glades)
    const rabbitSpawns = [
      [315, 310], [350, 330], [-315, 310], [-355, 320],
      [320, -315], [360, -330], [-320, -315], [-360, -330],
      [-130, 335], [130, 335], [-130, -335], [130, -335],
      [335, -120], [335, 120], [-335, -120], [-335, 120]
    ];
    for (const [rx, rz] of rabbitSpawns) {
      this._createRabbit(rx, rz, Math.random() * Math.PI * 2, forestGroup);
    }

    // C. Forest Foxes (8 trotting agile foxes along tree margins)
    const foxSpawns = [
      [390, 340, 0.8], [-390, 340, -1.5], [390, -340, 2.1], [-390, -340, -0.4],
      [0, 385, 1.2], [0, -385, -2.0], [385, 0, -0.7], [-385, 0, 2.3]
    ];
    for (const [fx, fz, fh] of foxSpawns) {
      this._createFox(fx, fz, fh, forestGroup);
    }
  }

  /**
   * Spawns an organic reflective water puddle with glossy ripple material, river rocks, and reeds.
   */
  _createPuddle(x, z, radius, parentGroup) {
    const puddleGeo = new THREE.CircleGeometry(radius, 20);
    puddleGeo.rotateX(-Math.PI / 2);
    const puddleMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      roughness: 0.08,
      metalness: 0.88,
      transparent: true,
      opacity: 0.86
    });
    const puddleMesh = new THREE.Mesh(puddleGeo, puddleMat);
    puddleMesh.position.set(x, 0.04, z);
    parentGroup.add(puddleMesh);

    this.forestPuddles.push({
      mesh: puddleMesh,
      mat: puddleMat,
      radius,
      phase: Math.random() * Math.PI * 2
    });

    // River pebbles encircling bank
    const pebbleMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.8 });
    const pebbleCount = 8 + Math.floor(radius * 1.2);
    for (let i = 0; i < pebbleCount; i++) {
      const angle = (i / pebbleCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.2;
      const rDist = radius * (0.95 + Math.random() * 0.15);
      const px = x + Math.cos(angle) * rDist;
      const pz = z + Math.sin(angle) * rDist;
      const pScale = 0.35 + Math.random() * 0.45;
      const pebble = new THREE.Mesh(new THREE.DodecahedronGeometry(pScale, 1), pebbleMat);
      pebble.position.set(px, 0.15, pz);
      pebble.rotation.set(Math.random(), Math.random(), Math.random());
      parentGroup.add(pebble);
    }

    // Fresh water cattails / reeds
    const reedMat = new THREE.MeshStandardMaterial({ color: 0x166534, roughness: 0.8 });
    const cattailHeadMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.9 });
    const reedCount = 4 + Math.floor(Math.random() * 4);
    for (let i = 0; i < reedCount; i++) {
      const angle = (i / reedCount) * Math.PI * 2 + Math.random() * 0.4;
      const rx = x + Math.cos(angle) * (radius * 1.05);
      const rz = z + Math.sin(angle) * (radius * 1.05);

      const stalkH = 1.4 + Math.random() * 0.8;
      const stalk = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, stalkH, 5), reedMat);
      stalk.position.set(rx, stalkH / 2, rz);
      parentGroup.add(stalk);

      const headH = 0.45;
      const cattail = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, headH, 5), cattailHeadMat);
      cattail.position.set(rx, stalkH - 0.1, rz);
      parentGroup.add(cattail);
    }
  }

  /**
   * Procedural low-poly 3D Deer with graceful posture, branched antlers, and grazing cycle.
   */
  _createDeer(x, z, heading, parentGroup) {
    const deer = new THREE.Group();
    deer.position.set(x, 0, z);
    deer.rotation.y = heading;
    parentGroup.add(deer);

    const brownMat = new THREE.MeshStandardMaterial({ color: 0x92400e, roughness: 0.8 });
    const bellyMat = new THREE.MeshStandardMaterial({ color: 0xfef08a, roughness: 0.85 });
    const hoofMat = new THREE.MeshStandardMaterial({ color: 0x1c1917, roughness: 0.9 });
    const antlerMat = new THREE.MeshStandardMaterial({ color: 0xd6d3d1, roughness: 0.5 });
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x09090b });

    // Torso & Creamy Underbelly
    const bodyMesh = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.95, 1.8), brownMat);
    bodyMesh.position.set(0, 1.6, 0);
    deer.add(bodyMesh);

    const bellyMesh = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.3, 1.3), bellyMat);
    bellyMesh.position.set(0, 1.25, 0.05);
    deer.add(bellyMesh);

    // Neck (angled forward)
    const neckMesh = new THREE.Mesh(new THREE.BoxGeometry(0.42, 1.1, 0.45), brownMat);
    neckMesh.position.set(0, 2.1, 0.75);
    neckMesh.rotation.x = -0.32;
    deer.add(neckMesh);

    // Head Group (Pivoting for grazing animation)
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 2.65, 0.95);
    deer.add(headGroup);

    const headMesh = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.48, 0.72), brownMat);
    headMesh.position.set(0, 0, 0.15);
    headGroup.add(headMesh);

    const snout = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.3, 0.4), bellyMat);
    snout.position.set(0, -0.08, 0.58);
    headGroup.add(snout);

    const noseTip = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.12, 0.12), hoofMat);
    noseTip.position.set(0, 0.02, 0.78);
    headGroup.add(noseTip);

    // Eyes
    const eyeL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.08), eyeMat);
    eyeL.position.set(-0.25, 0.12, 0.3);
    headGroup.add(eyeL);
    const eyeR = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.08), eyeMat);
    eyeR.position.set(0.25, 0.12, 0.3);
    headGroup.add(eyeR);

    // Ears
    const earGeo = new THREE.BoxGeometry(0.12, 0.35, 0.15);
    const earL = new THREE.Mesh(earGeo, brownMat);
    earL.position.set(-0.28, 0.28, -0.05);
    earL.rotation.z = 0.4;
    headGroup.add(earL);

    const earR = new THREE.Mesh(earGeo, brownMat);
    earR.position.set(0.28, 0.28, -0.05);
    earR.rotation.z = -0.4;
    headGroup.add(earR);

    // Branched Antlers
    const antlerMainGeo = new THREE.CylinderGeometry(0.04, 0.06, 0.8, 5);
    const antlerLeft = new THREE.Mesh(antlerMainGeo, antlerMat);
    antlerLeft.position.set(-0.22, 0.52, 0);
    antlerLeft.rotation.z = 0.35;
    antlerLeft.rotation.x = -0.2;
    headGroup.add(antlerLeft);

    const branchL = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.04, 0.4, 4), antlerMat);
    branchL.position.set(-0.35, 0.68, 0.1);
    branchL.rotation.z = 0.8;
    headGroup.add(branchL);

    const antlerRight = new THREE.Mesh(antlerMainGeo, antlerMat);
    antlerRight.position.set(0.22, 0.52, 0);
    antlerRight.rotation.z = -0.35;
    antlerRight.rotation.x = -0.2;
    headGroup.add(antlerRight);

    const branchR = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.04, 0.4, 4), antlerMat);
    branchR.position.set(0.35, 0.68, 0.1);
    branchR.rotation.z = -0.8;
    headGroup.add(branchR);

    // Four Slender Legs
    const legs = [];
    const legOffsets = [
      [-0.32, 0.65],
      [0.32, 0.65],
      [-0.32, -0.65],
      [0.32, -0.65]
    ];

    for (const [lx, lz] of legOffsets) {
      const legPivot = new THREE.Group();
      legPivot.position.set(lx, 1.45, lz);
      deer.add(legPivot);

      const upperLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.07, 0.75, 5), brownMat);
      upperLeg.position.set(0, -0.35, 0);
      legPivot.add(upperLeg);

      const lowerLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.05, 0.75, 5), hoofMat);
      lowerLeg.position.set(0, -0.85, 0);
      legPivot.add(lowerLeg);

      legs.push(legPivot);
    }

    // Cute Tail
    const tailMesh = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.32, 0.15), bellyMat);
    tailMesh.position.set(0, 1.75, -0.95);
    tailMesh.rotation.x = -0.4;
    deer.add(tailMesh);

    this.forestAnimals.push({
      type: 'deer',
      group: deer,
      headGroup,
      legs,
      homeX: x,
      homeZ: z,
      wanderRadius: 18 + Math.random() * 12,
      speed: 0.9 + Math.random() * 0.4,
      phase: Math.random() * 100,
      grazingTimer: Math.random() * 6,
      isGrazing: false
    });
  }

  /**
   * Procedural low-poly Rabbit / Bunny with perky ears, fluffy tail, and lively parabolic hops.
   */
  _createRabbit(x, z, heading, parentGroup) {
    const bunny = new THREE.Group();
    bunny.position.set(x, 0, z);
    bunny.rotation.y = heading;
    parentGroup.add(bunny);

    const furMat = new THREE.MeshStandardMaterial({
      color: Math.random() > 0.4 ? 0xf8fafc : 0xd97706,
      roughness: 0.9
    });
    const innerEarMat = new THREE.MeshStandardMaterial({ color: 0xf472b6, roughness: 0.6 });
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x1e1b4b });
    const noseMat = new THREE.MeshBasicMaterial({ color: 0xfb7185 });

    // Rounded Body
    const bodyGeo = new THREE.SphereGeometry(0.38, 7, 7);
    bodyGeo.scale(0.8, 0.85, 1.15);
    const bodyMesh = new THREE.Mesh(bodyGeo, furMat);
    bodyMesh.position.set(0, 0.34, 0);
    bunny.add(bodyMesh);

    // Head & Nose
    const headMesh = new THREE.Mesh(new THREE.SphereGeometry(0.24, 7, 7), furMat);
    headMesh.position.set(0, 0.52, 0.28);
    bunny.add(headMesh);

    const nose = new THREE.Mesh(new THREE.SphereGeometry(0.05, 5, 5), noseMat);
    nose.position.set(0, 0.52, 0.5);
    bunny.add(nose);

    const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.04, 5, 5), eyeMat);
    eyeL.position.set(-0.16, 0.58, 0.38);
    bunny.add(eyeL);
    const eyeR = new THREE.Mesh(new THREE.SphereGeometry(0.04, 5, 5), eyeMat);
    eyeR.position.set(0.16, 0.58, 0.38);
    bunny.add(eyeR);

    // Upright Long Ears
    const earGeo = new THREE.BoxGeometry(0.09, 0.45, 0.12);
    const earL = new THREE.Mesh(earGeo, furMat);
    earL.position.set(-0.1, 0.85, 0.22);
    earL.rotation.z = 0.15;
    bunny.add(earL);

    const earR = new THREE.Mesh(earGeo, furMat);
    earR.position.set(0.1, 0.85, 0.22);
    earR.rotation.z = -0.15;
    bunny.add(earR);

    const innerEarGeo = new THREE.BoxGeometry(0.05, 0.35, 0.04);
    const inL = new THREE.Mesh(innerEarGeo, innerEarMat);
    inL.position.set(-0.1, 0.85, 0.27);
    inL.rotation.z = 0.15;
    bunny.add(inL);

    const inR = new THREE.Mesh(innerEarGeo, innerEarMat);
    inR.position.set(0.1, 0.85, 0.27);
    inR.rotation.z = -0.15;
    bunny.add(inR);

    // Puffy Cotton-Tail
    const tail = new THREE.Mesh(new THREE.SphereGeometry(0.13, 6, 6), furMat);
    tail.position.set(0, 0.36, -0.42);
    bunny.add(tail);

    // Paws
    const pawGeo = new THREE.BoxGeometry(0.12, 0.08, 0.24);
    const pawL = new THREE.Mesh(pawGeo, furMat);
    pawL.position.set(-0.18, 0.04, -0.05);
    bunny.add(pawL);

    const pawR = new THREE.Mesh(pawGeo, furMat);
    pawR.position.set(0.18, 0.04, -0.05);
    bunny.add(pawR);

    this.forestAnimals.push({
      type: 'rabbit',
      group: bunny,
      earL,
      earR,
      homeX: x,
      homeZ: z,
      wanderRadius: 10 + Math.random() * 8,
      hopFreq: 5.5 + Math.random() * 2.0,
      hopDist: 0.8 + Math.random() * 0.4,
      phase: Math.random() * 100,
      isResting: false,
      restTimer: Math.random() * 4
    });
  }

  /**
   * Procedural low-poly Forest Fox with orange-red coat, pointed black ears, and a swishing white-tipped bushy tail.
   */
  _createFox(x, z, heading, parentGroup) {
    const fox = new THREE.Group();
    fox.position.set(x, 0, z);
    fox.rotation.y = heading;
    parentGroup.add(fox);

    const orangeMat = new THREE.MeshStandardMaterial({ color: 0xea580c, roughness: 0.75 });
    const whiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.8 });
    const blackMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.85 });
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x09090b });

    // Agile Torso & White Bib
    const bodyMesh = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.7, 1.5), orangeMat);
    bodyMesh.position.set(0, 0.95, 0);
    fox.add(bodyMesh);

    const chestMesh = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.52, 0.5), whiteMat);
    chestMesh.position.set(0, 0.95, 0.52);
    fox.add(chestMesh);

    // Head & Muzzle
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 1.35, 0.75);
    fox.add(headGroup);

    const headMesh = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.44, 0.55), orangeMat);
    headMesh.position.set(0, 0, 0);
    headGroup.add(headMesh);

    const snout = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.45, 5), whiteMat);
    snout.rotation.x = Math.PI / 2;
    snout.position.set(0, -0.06, 0.42);
    headGroup.add(snout);

    const noseTip = new THREE.Mesh(new THREE.SphereGeometry(0.06, 5, 5), blackMat);
    noseTip.position.set(0, -0.06, 0.65);
    headGroup.add(noseTip);

    // Eyes
    const eyeL = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.06), eyeMat);
    eyeL.position.set(-0.2, 0.1, 0.22);
    headGroup.add(eyeL);
    const eyeR = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.06), eyeMat);
    eyeR.position.set(0.2, 0.1, 0.22);
    headGroup.add(eyeR);

    // Alert Pointed Ears (with black backs)
    const earGeo = new THREE.ConeGeometry(0.14, 0.35, 4);
    const earL = new THREE.Mesh(earGeo, blackMat);
    earL.position.set(-0.2, 0.35, -0.05);
    earL.rotation.z = 0.3;
    headGroup.add(earL);

    const earR = new THREE.Mesh(earGeo, blackMat);
    earR.position.set(0.2, 0.35, -0.05);
    earR.rotation.z = -0.3;
    headGroup.add(earR);

    // Bushy Fox Tail with distinctive Snow-White Tip!
    const tailGroup = new THREE.Group();
    tailGroup.position.set(0, 1.0, -0.75);
    fox.add(tailGroup);

    const tailMain = new THREE.Mesh(new THREE.ConeGeometry(0.3, 1.05, 6), orangeMat);
    tailMain.position.set(0, -0.4, -0.35);
    tailMain.rotation.x = -1.25;
    tailGroup.add(tailMain);

    const tailTip = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.45, 6), whiteMat);
    tailTip.position.set(0, -0.75, -0.75);
    tailTip.rotation.x = -1.25;
    tailGroup.add(tailTip);

    // Four Black-Socked Legs
    const legs = [];
    const legOffsets = [
      [-0.24, 0.5],
      [0.24, 0.5],
      [-0.24, -0.5],
      [0.24, -0.5]
    ];

    for (const [lx, lz] of legOffsets) {
      const legPivot = new THREE.Group();
      legPivot.position.set(lx, 0.9, lz);
      fox.add(legPivot);

      const legMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.05, 0.9, 5), blackMat);
      legMesh.position.set(0, -0.45, 0);
      legPivot.add(legMesh);

      legs.push(legPivot);
    }

    this.forestAnimals.push({
      type: 'fox',
      group: fox,
      tailGroup,
      headGroup,
      legs,
      homeX: x,
      homeZ: z,
      wanderRadius: 24 + Math.random() * 15,
      speed: 1.5 + Math.random() * 0.6,
      phase: Math.random() * 100
    });
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
   * Update animated components:
   * - Blinking rooftop aircraft beacons & neon signs
   * - Basketball court dribbling physics
   * - Water puddles specular wave shimmer
   * - Forest Wildlife: Grazing Deer, Hopping Bunnies, Trotting Foxes
   * - Building Neon Night illumination pulse
   * @param {number} elapsedTime
   */
  update(elapsedTime) {
    // 1. Blinking aircraft beacons & neon flickers
    for (const item of this.animatedElements) {
      if (item.type === 'blink') {
        const isOn = Math.sin(elapsedTime * item.frequency * Math.PI * 2) > 0;
        item.mesh.visible = isOn;
      } else if (item.type === 'neonFlicker') {
        const flicker = Math.sin(elapsedTime * 14) > 0.94 ? 0.35 : 1.0;
        item.mat.emissiveIntensity = item.baseIntensity * flicker;
      }
    }

    // 2. Animate basketball court players & bouncing ball
    for (const bp of this.basketballPlayers) {
      if (bp.ballMesh) {
        const bounceCycle = Math.abs(Math.sin(elapsedTime * 8.5));
        bp.ballMesh.position.y = 0.45 + bounceCycle * 1.1;
      }
    }

    // 3. Animate reflective water puddles in forest
    for (const puddle of this.forestPuddles) {
      const wave = Math.sin(elapsedTime * 2.5 + puddle.phase) * 0.015;
      puddle.mesh.scale.set(1 + wave, 1, 1 + wave);
    }

    // 4. Animate Forest Wildlife
    for (const animal of this.forestAnimals) {
      if (animal.type === 'deer') {
        // Deer grazing and wandering logic
        const t = elapsedTime * animal.speed * 0.35 + animal.phase;
        animal.grazingTimer += 0.016;

        if (animal.grazingTimer > 9.0) {
          animal.isGrazing = true;
          if (animal.grazingTimer > 14.0) {
            animal.isGrazing = false;
            animal.grazingTimer = 0;
          }
        }

        if (animal.isGrazing) {
          // Head lowered to grass to graze
          animal.headGroup.rotation.x = 0.72 + Math.sin(elapsedTime * 3) * 0.08;
          for (const leg of animal.legs) leg.rotation.x = 0;
        } else {
          // Walking along gentle roaming perimeter
          animal.headGroup.rotation.x = Math.sin(elapsedTime * 2.2) * 0.06;
          const targetX = animal.homeX + Math.cos(t) * animal.wanderRadius;
          const targetZ = animal.homeZ + Math.sin(t * 0.75) * animal.wanderRadius;
          const dx = targetX - animal.group.position.x;
          const dz = targetZ - animal.group.position.z;

          animal.group.position.x += dx * 0.04;
          animal.group.position.z += dz * 0.04;
          if (Math.hypot(dx, dz) > 0.01) {
            animal.group.rotation.y = Math.atan2(dx, dz);
          }

          // Leg swing stride
          const legSwing = Math.sin(elapsedTime * 3.8 + animal.phase) * 0.35;
          animal.legs[0].rotation.x = legSwing;
          animal.legs[1].rotation.x = -legSwing;
          animal.legs[2].rotation.x = -legSwing;
          animal.legs[3].rotation.x = legSwing;
        }

      } else if (animal.type === 'rabbit') {
        // Bunny hopping physics cycle
        animal.restTimer += 0.016;
        if (animal.restTimer > 4.5) {
          animal.isResting = true;
          if (animal.restTimer > 7.0) {
            animal.isResting = false;
            animal.restTimer = 0;
          }
        }

        if (animal.isResting) {
          // Twitch ears & nose while resting
          animal.group.position.y = 0;
          animal.earL.rotation.z = 0.15 + Math.sin(elapsedTime * 14 + animal.phase) * 0.08;
          animal.earR.rotation.z = -0.15 - Math.sin(elapsedTime * 14 + animal.phase) * 0.08;
        } else {
          // Parabolic hop trajectory
          const hopCycle = Math.abs(Math.sin(elapsedTime * animal.hopFreq));
          animal.group.position.y = hopCycle * 0.65;

          const t = elapsedTime * 0.3 + animal.phase;
          const targetX = animal.homeX + Math.cos(t) * animal.wanderRadius;
          const targetZ = animal.homeZ + Math.sin(t) * animal.wanderRadius;
          const dx = targetX - animal.group.position.x;
          const dz = targetZ - animal.group.position.z;

          if (hopCycle > 0.1) {
            animal.group.position.x += dx * 0.035;
            animal.group.position.z += dz * 0.035;
          }
          if (Math.hypot(dx, dz) > 0.01) {
            animal.group.rotation.y = Math.atan2(dx, dz);
          }
        }

      } else if (animal.type === 'fox') {
        // Agile trotting and fluid bushy tail swish
        const t = elapsedTime * animal.speed * 0.4 + animal.phase;
        const targetX = animal.homeX + Math.cos(t) * animal.wanderRadius;
        const targetZ = animal.homeZ + Math.sin(t * 1.2) * animal.wanderRadius;
        const dx = targetX - animal.group.position.x;
        const dz = targetZ - animal.group.position.z;

        animal.group.position.x += dx * 0.05;
        animal.group.position.z += dz * 0.05;
        if (Math.hypot(dx, dz) > 0.01) {
          animal.group.rotation.y = Math.atan2(dx, dz);
        }

        // Tail swish
        animal.tailGroup.rotation.y = Math.sin(elapsedTime * 4.2 + animal.phase) * 0.45;

        // Alternating trot legs
        const trotSwing = Math.sin(elapsedTime * 6.5 + animal.phase) * 0.4;
        animal.legs[0].rotation.x = trotSwing;
        animal.legs[1].rotation.x = -trotSwing;
        animal.legs[2].rotation.x = -trotSwing;
        animal.legs[3].rotation.x = trotSwing;
      }
    }
  }
}
