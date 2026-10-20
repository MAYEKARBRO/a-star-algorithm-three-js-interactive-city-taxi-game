import * as THREE from 'three';

/**
 * GPSVisualizer renders the visual representations of the A* path in the 3D world:
 * - Glowing navigation spline/ribbon on the road surface
 * - Pulsing waypoint rings at intersections along the route
 * - 3D destination holographic beacon with vertical beam
 * - Optional debug mode rendering the entire A* road graph (nodes & edges)
 */
export class GPSVisualizer {
  constructor(scene) {
    this.scene = scene;

    this.gpsGroup = new THREE.Group();
    this.scene.add(this.gpsGroup);

    // Navigation path ribbon mesh
    this.pathLineMesh = null;
    this.waypointMarkers = [];

    // Destination beacon
    this.beaconGroup = new THREE.Group();
    this.scene.add(this.beaconGroup);
    this.beaconGroup.visible = false;
    this._buildDestinationBeacon();

    // Debug graph visualizer group
    this.debugGraphGroup = new THREE.Group();
    this.scene.add(this.debugGraphGroup);
    this.debugGraphGroup.visible = false;
    this.isDebugGraphVisible = false;

    // Current active path nodes
    /** @type {import('./astar.js').RoadNode[]} */
    this.currentPathNodes = [];
    this.currentWaypointIndex = 0;
  }

  /**
   * Constructs a holographic glowing cylinder beacon at the destination.
   */
  _buildDestinationBeacon() {
    // 1. Vertical laser light beam
    const beamGeo = new THREE.CylinderGeometry(0.5, 1.5, 30, 16, 1, true);
    const beamMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      transparent: true,
      opacity: 0.35,
      side: THREE.DoubleSide
    });
    const beam = new THREE.Mesh(beamGeo, beamMat);
    beam.position.y = 15;
    this.beaconGroup.add(beam);

    // 2. Pulsing ground rings
    const ringGeo1 = new THREE.RingGeometry(2.0, 2.5, 32);
    ringGeo1.rotateX(-Math.PI / 2);
    const ringMat1 = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.8
    });
    this.beaconRing1 = new THREE.Mesh(ringGeo1, ringMat1);
    this.beaconRing1.position.y = 0.2;
    this.beaconGroup.add(this.beaconRing1);

    const ringGeo2 = new THREE.RingGeometry(3.5, 4.0, 32);
    ringGeo2.rotateX(-Math.PI / 2);
    const ringMat2 = new THREE.MeshBasicMaterial({
      color: 0xff007f,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.6
    });
    this.beaconRing2 = new THREE.Mesh(ringGeo2, ringMat2);
    this.beaconRing2.position.y = 0.2;
    this.beaconGroup.add(this.beaconRing2);

    // 3. Floating 3D diamond icon
    const diamondGeo = new THREE.OctahedronGeometry(1.2, 0);
    const diamondMat = new THREE.MeshStandardMaterial({
      color: 0x00f0ff,
      emissive: 0x00f0ff,
      emissiveIntensity: 0.6,
      roughness: 0.2
    });
    this.beaconDiamond = new THREE.Mesh(diamondGeo, diamondMat);
    this.beaconDiamond.position.y = 3.5;
    this.beaconGroup.add(this.beaconDiamond);
  }

  /**
   * Updates the GPS visual path with the newly computed A* path nodes.
   * @param {import('./astar.js').RoadNode[]} pathNodes
   * @param {'pickup' | 'dropoff'} type
   */
  setPath(pathNodes, type = 'dropoff') {
    this.currentPathNodes = pathNodes || [];
    this.currentWaypointIndex = 0;

    // Clear previous path mesh & markers
    this._clearPathVisuals();

    if (!pathNodes || pathNodes.length < 2) {
      this.beaconGroup.visible = false;
      return;
    }

    const pathColor = type === 'pickup' ? 0x10b981 : 0x00f0ff; // Emerald for pickup, Cyan for dropoff
    const glowColor = type === 'pickup' ? 0x059669 : 0x0284c7;

    // 1. Create 3D Ribbon / Spline along road surface
    const points = pathNodes.map(n => new THREE.Vector3(n.x, 0.18, n.z));
    const curve = new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.2);
    const curvePoints = curve.getPoints(pathNodes.length * 8);

    // Create a flat ribbon geometry along the curve
    const ribbonWidth = 2.4;
    const vertices = [];
    const uvs = [];

    for (let i = 0; i < curvePoints.length; i++) {
      const p = curvePoints[i];
      let tangent = new THREE.Vector3();
      if (i < curvePoints.length - 1) {
        tangent.subVectors(curvePoints[i + 1], p).normalize();
      } else {
        tangent.subVectors(p, curvePoints[i - 1]).normalize();
      }

      const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();

      // Left vertex
      vertices.push(
        p.x + normal.x * (ribbonWidth / 2),
        p.y,
        p.z + normal.z * (ribbonWidth / 2)
      );
      uvs.push(0, i / curvePoints.length);

      // Right vertex
      vertices.push(
        p.x - normal.x * (ribbonWidth / 2),
        p.y,
        p.z - normal.z * (ribbonWidth / 2)
      );
      uvs.push(1, i / curvePoints.length);
    }

    const indices = [];
    for (let i = 0; i < curvePoints.length - 1; i++) {
      const i2 = i * 2;
      indices.push(i2, i2 + 1, i2 + 2);
      indices.push(i2 + 1, i2 + 3, i2 + 2);
    }

    const ribbonGeo = new THREE.BufferGeometry();
    ribbonGeo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    ribbonGeo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    ribbonGeo.setIndex(indices);
    ribbonGeo.computeVertexNormals();

    // Procedural animated dashed GPS texture
    const ribbonCanvas = document.createElement('canvas');
    ribbonCanvas.width = 128;
    ribbonCanvas.height = 256;
    const rCtx = ribbonCanvas.getContext('2d');
    rCtx.fillStyle = 'rgba(0,0,0,0)';
    rCtx.fillRect(0, 0, 128, 256);

    // Outer glow
    rCtx.strokeStyle = type === 'pickup' ? '#10b981' : '#00f0ff';
    rCtx.lineWidth = 14;
    rCtx.beginPath();
    rCtx.moveTo(64, 0); rCtx.lineTo(64, 256);
    rCtx.stroke();

    // Inner bright core chevron arrows
    rCtx.fillStyle = '#ffffff';
    for (let y = 16; y < 256; y += 48) {
      rCtx.beginPath();
      rCtx.moveTo(64, y);
      rCtx.lineTo(94, y + 24);
      rCtx.lineTo(64, y + 16);
      rCtx.lineTo(34, y + 24);
      rCtx.closePath();
      rCtx.fill();
    }

    this.ribbonTex = new THREE.CanvasTexture(ribbonCanvas);
    this.ribbonTex.wrapS = THREE.RepeatWrapping;
    this.ribbonTex.wrapT = THREE.RepeatWrapping;
    this.ribbonTex.repeat.set(1, pathNodes.length * 2);

    const ribbonMat = new THREE.MeshBasicMaterial({
      map: this.ribbonTex,
      transparent: true,
      opacity: 0.9,
      side: THREE.DoubleSide
    });

    this.pathLineMesh = new THREE.Mesh(ribbonGeo, ribbonMat);
    this.gpsGroup.add(this.pathLineMesh);

    // 2. Add glowing rings at each A* waypoint node
    for (let i = 1; i < pathNodes.length - 1; i++) {
      const node = pathNodes[i];
      const ringGeo = new THREE.RingGeometry(1.2, 1.8, 16);
      ringGeo.rotateX(-Math.PI / 2);
      const ringMat = new THREE.MeshBasicMaterial({
        color: pathColor,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.7
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.position.set(node.x, 0.22, node.z);
      this.gpsGroup.add(ringMesh);
      this.waypointMarkers.push(ringMesh);
    }

    // 3. Set Destination Beacon position
    const destNode = pathNodes[pathNodes.length - 1];
    this.beaconGroup.position.set(destNode.x, 0, destNode.z);
    this.beaconGroup.visible = true;

    // Update beacon color
    const beaconColor = type === 'pickup' ? 0x10b981 : 0x00f0ff;
    this.beaconRing1.material.color.setHex(beaconColor);
    this.beaconDiamond.material.color.setHex(beaconColor);
    this.beaconDiamond.material.emissive.setHex(beaconColor);
  }

  _clearPathVisuals() {
    if (this.pathLineMesh) {
      this.gpsGroup.remove(this.pathLineMesh);
      this.pathLineMesh.geometry.dispose();
      this.pathLineMesh.material.dispose();
      this.pathLineMesh = null;
    }

    for (const marker of this.waypointMarkers) {
      this.gpsGroup.remove(marker);
      marker.geometry.dispose();
      marker.material.dispose();
    }
    this.waypointMarkers = [];
  }

  /**
   * Toggles debug rendering of all A* road graph nodes and edges in 3D.
   * @param {import('../city/RoadNetwork.js').RoadNetwork} roadNetwork
   */
  toggleDebugGraph(roadNetwork) {
    this.isDebugGraphVisible = !this.isDebugGraphVisible;
    this.debugGraphGroup.visible = this.isDebugGraphVisible;

    if (this.isDebugGraphVisible && this.debugGraphGroup.children.length === 0) {
      this._buildDebugGraph(roadNetwork);
    }

    return this.isDebugGraphVisible;
  }

  _buildDebugGraph(roadNetwork) {
    const nodes = roadNetwork.graph.getAllNodes();
    const nodeMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const landmarkNodeMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
    const sphereGeo = new THREE.SphereGeometry(1.0, 8, 8);

    // 1. Render all nodes as spheres
    for (const node of nodes) {
      const isLandmark = roadNetwork.landmarks.some(l => l.name === node.name);
      const sphere = new THREE.Mesh(sphereGeo, isLandmark ? landmarkNodeMat : nodeMat);
      sphere.position.set(node.x, 1.2, node.z);
      this.debugGraphGroup.add(sphere);
    }

    // 2. Render all edges as cyan laser lines
    const linePositions = [];
    const visitedEdges = new Set();

    for (const node of nodes) {
      for (const neighbor of node.neighbors) {
        const edgeKey = [node.id, neighbor.targetId].sort().join('--');
        if (!visitedEdges.has(edgeKey)) {
          visitedEdges.add(edgeKey);
          const targetNode = roadNetwork.graph.getNode(neighbor.targetId);
          if (targetNode) {
            linePositions.push(node.x, 1.2, node.z);
            linePositions.push(targetNode.x, 1.2, targetNode.z);
          }
        }
      }
    }

    const lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
    const lineMat = new THREE.LineBasicMaterial({ color: 0x00f0ff, transparent: true, opacity: 0.6 });
    const lines = new THREE.LineSegments(lineGeo, lineMat);
    this.debugGraphGroup.add(lines);
  }

  /**
   * Updates animations: scrolling GPS texture, pulsing beacon rings, rotating diamond.
   * @param {number} delta
   * @param {number} elapsedTime
   */
  update(delta, elapsedTime) {
    // Scroll GPS texture forward
    if (this.ribbonTex) {
      this.ribbonTex.offset.y -= delta * 1.5;
    }

    // Animate destination beacon
    if (this.beaconGroup.visible) {
      // Rotating diamond
      this.beaconDiamond.rotation.y += delta * 2.0;
      this.beaconDiamond.position.y = 3.5 + Math.sin(elapsedTime * 3) * 0.4;

      // Pulsing rings
      const scale1 = 1 + Math.sin(elapsedTime * 4) * 0.15;
      this.beaconRing1.scale.set(scale1, scale1, scale1);

      const scale2 = 1 + Math.cos(elapsedTime * 3) * 0.2;
      this.beaconRing2.scale.set(scale2, scale2, scale2);
    }
  }
}
