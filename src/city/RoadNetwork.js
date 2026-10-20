import { RoadGraph } from '../pathfinding/astar.js';

/**
 * RoadNetwork defines the street grid, intersections, and landmarks of the 3D city,
 * and constructs the topological RoadGraph used by the A* pathfinding system.
 */
export class RoadNetwork {
  constructor() {
    this.graph = new RoadGraph();

    // City grid configuration
    this.gridSizeX = 7; // Number of North-South avenues
    this.gridSizeZ = 7; // Number of East-West streets
    this.spacing = 70;  // Distance between intersections (meters)
    this.halfSizeX = ((this.gridSizeX - 1) * this.spacing) / 2;
    this.halfSizeZ = ((this.gridSizeZ - 1) * this.spacing) / 2;

    this.avenueNames = [
      'Broadway Ave',
      'Neon Boulevard',
      'Cyber Expressway',
      'Central Park Ave',
      'Grand Avenue',
      'Skyline Parkway',
      'Sunset Drive'
    ];

    this.streetNames = [
      '1st Marina St',
      'Tech Boulevard',
      'Plaza Promenade',
      'Center Street',
      'Emerald Way',
      'Innovation Ave',
      'Summit Road'
    ];

    // Landmarks mapped to specific intersection grid coordinates [ix, iz]
    this.landmarks = [
      { id: 'grand_central', name: 'Grand Central Station', gridX: 3, gridZ: 3, district: 'Downtown Central' },
      { id: 'times_square', name: 'Times Neon Plaza', gridX: 1, gridZ: 2, district: 'Cyber District' },
      { id: 'skyline_tower', name: 'Skyline Financial Center', gridX: 5, gridZ: 1, district: 'Financial District' },
      { id: 'emerald_park', name: 'Emerald Park Pavilion', gridX: 2, gridZ: 4, district: 'Park District' },
      { id: 'marina_bay', name: 'Cyber Bay Marina', gridX: 0, gridZ: 0, district: 'Marina Waterfront' },
      { id: 'metropolis_hotel', name: 'Metropolis Luxury Hotel', gridX: 5, gridZ: 5, district: 'Midtown' },
      { id: 'sunset_plaza', name: 'Sunset Boulevard Shops', gridX: 6, gridZ: 3, district: 'West End' },
      { id: 'tech_campus', name: 'Nexus Tech Campus', gridX: 1, gridZ: 5, district: 'Silicon Quarter' },
      { id: 'vanguard_art', name: 'Vanguard Contemporary Art', gridX: 4, gridZ: 2, district: 'Cultural Center' },
      { id: 'summit_deck', name: 'Summit Observation Hub', gridX: 6, gridZ: 6, district: 'Sky District' }
    ];

    this.intersections = [];
    this.roadSegments = [];

    this._buildNetwork();
  }

  /**
   * Builds the intersections and connects them with road segments in the graph.
   */
  _buildNetwork() {
    // 1. Create Intersection Nodes
    for (let ix = 0; ix < this.gridSizeX; ix++) {
      for (let iz = 0; iz < this.gridSizeZ; iz++) {
        const x = ix * this.spacing - this.halfSizeX;
        const z = iz * this.spacing - this.halfSizeZ;
        const nodeId = `node_${ix}_${iz}`;

        // Check if this intersection is a landmark
        const landmark = this.landmarks.find(l => l.gridX === ix && l.gridZ === iz);
        const avenueName = this.avenueNames[ix] || `Avenue ${ix + 1}`;
        const streetName = this.streetNames[iz] || `Street ${iz + 1}`;
        const name = landmark ? landmark.name : `${avenueName} & ${streetName}`;

        const node = this.graph.addNode(nodeId, x, z, name);
        this.intersections.push({
          id: nodeId,
          gridX: ix,
          gridZ: iz,
          x,
          z,
          name,
          avenueName,
          streetName,
          isLandmark: !!landmark,
          landmarkData: landmark || null
        });
      }
    }

    // 2. Connect Intersections horizontally (along X) and vertically (along Z)
    // Add midpoint waypoints for smoother navigation tracking and realistic GPS ribbons!
    for (let ix = 0; ix < this.gridSizeX; ix++) {
      for (let iz = 0; iz < this.gridSizeZ; iz++) {
        const fromId = `node_${ix}_${iz}`;
        const fromNode = this.graph.getNode(fromId);

        // East-West connections (along X axis)
        if (ix < this.gridSizeX - 1) {
          const toId = `node_${ix + 1}_${iz}`;
          const toNode = this.graph.getNode(toId);
          const streetName = this.streetNames[iz];

          // Create a midpoint waypoint
          const midX = (fromNode.x + toNode.x) / 2;
          const midZ = fromNode.z;
          const midId = `mid_x_${ix}_${ix + 1}_z_${iz}`;
          this.graph.addNode(midId, midX, midZ, streetName);

          // Connect from -> mid -> to
          const distHalf = this.spacing / 2;
          this.graph.addEdge(fromId, midId, distHalf, streetName, true);
          this.graph.addEdge(midId, toId, distHalf, streetName, true);

          this.roadSegments.push({
            fromX: fromNode.x,
            fromZ: fromNode.z,
            toX: toNode.x,
            toZ: toNode.z,
            streetName,
            orientation: 'horizontal'
          });
        }

        // North-South connections (along Z axis)
        if (iz < this.gridSizeZ - 1) {
          const toId = `node_${ix}_${iz + 1}`;
          const toNode = this.graph.getNode(toId);
          const avenueName = this.avenueNames[ix];

          // Create a midpoint waypoint
          const midX = fromNode.x;
          const midZ = (fromNode.z + toNode.z) / 2;
          const midId = `mid_z_${iz}_${iz + 1}_x_${ix}`;
          this.graph.addNode(midId, midX, midZ, avenueName);

          // Connect from -> mid -> to
          const distHalf = this.spacing / 2;
          this.graph.addEdge(fromId, midId, distHalf, avenueName, true);
          this.graph.addEdge(midId, toId, distHalf, avenueName, true);

          this.roadSegments.push({
            fromX: fromNode.x,
            fromZ: fromNode.z,
            toX: toNode.x,
            toZ: toNode.z,
            streetName: avenueName,
            orientation: 'vertical'
          });
        }
      }
    }
  }

  /**
   * Selects a random landmark or intersection as a passenger pickup or destination.
   * @param {string[]} [excludeNodeIds=[]]
   * @returns {{ node: import('../pathfinding/astar.js').RoadNode, landmark: any }}
   */
  getRandomDestination(excludeNodeIds = []) {
    // Prefer landmark locations for engaging mission names, fallback to any intersection
    const candidateIntersections = this.intersections.filter(i => !excludeNodeIds.includes(i.id));
    if (candidateIntersections.length === 0) {
      return { node: this.graph.getNode(this.intersections[0].id), landmark: this.intersections[0] };
    }

    const selected = candidateIntersections[Math.floor(Math.random() * candidateIntersections.length)];
    const node = this.graph.getNode(selected.id);
    return {
      node,
      name: selected.name,
      district: selected.landmarkData ? selected.landmarkData.district : 'Metropolis Center'
    };
  }

  /**
   * Finds the closest road intersection/waypoint to a given coordinate.
   * @param {number} x
   * @param {number} z
   */
  findNearestNode(x, z) {
    return this.graph.findNearestNode(x, z);
  }

  /**
   * Returns city bounds for bounding boxes, collision, or camera limits.
   */
  getCityBounds() {
    return {
      minX: -this.halfSizeX - 15,
      maxX: this.halfSizeX + 15,
      minZ: -this.halfSizeZ - 15,
      maxZ: this.halfSizeZ + 15,
      roadWidth: 16
    };
  }
}
