/**
 * ============================================================================
 *                       A* (A-STAR) PATHFINDING ALGORITHM
 * ============================================================================
 * 
 * The A* algorithm is one of the most widely used and optimal pathfinding 
 * algorithms in computer science and game development. It finds the shortest
 * path between a start node and a target (goal) node on a weighted graph.
 * 
 * CORE FORMULA:
 *    f(n) = g(n) + h(n)
 * 
 *  - g(n): The exact cost from the start node to the current node n.
 *  - h(n): The heuristic estimated cost from node n to the goal node.
 *          Here we use Euclidean distance: sqrt(dx^2 + dz^2).
 *          Since Euclidean distance is "admissible" (it never overestimates the
 *          true road distance), A* is mathematically guaranteed to find the
 *          optimal (shortest) path!
 *  - f(n): The total estimated cost of the cheapest path through node n.
 * 
 * DATA STRUCTURES:
 *  - openSet:   Nodes discovered but not yet evaluated (we prioritize lowest fScore).
 *  - closedSet: Nodes that have already been evaluated.
 *  - cameFrom:  A map tracking which node led to which, used to reconstruct 
 *               the final path once the goal is reached.
 *  - gScore:    Cost map where gScore[nodeId] = shortest distance from start.
 *  - fScore:    Score map where fScore[nodeId] = gScore[nodeId] + h(nodeId, goal).
 * ============================================================================
 */

/**
 * Representation of a Node in the City Road Network.
 */
export class RoadNode {
  /**
   * @param {string} id - Unique identifier (e.g., 'intersection_2_3')
   * @param {number} x - 3D world X coordinate
   * @param {number} z - 3D world Z coordinate
   * @param {string} name - Street or intersection name
   */
  constructor(id, x, z, name = '') {
    this.id = id;
    this.x = x;
    this.z = z;
    this.name = name;
    /** @type {Array<{ targetId: string, distance: number, streetName: string }>} */
    this.neighbors = [];
  }

  /**
   * Connects this node to another node with an edge weight (distance).
   * @param {string} targetId
   * @param {number} distance
   * @param {string} streetName
   */
  addNeighbor(targetId, distance, streetName = '') {
    // Avoid duplicate neighbor connections
    if (!this.neighbors.some(n => n.targetId === targetId)) {
      this.neighbors.push({ targetId, distance, streetName });
    }
  }
}

/**
 * Graph representing the drivable road network of the city.
 */
export class RoadGraph {
  constructor() {
    /** @type {Map<string, RoadNode>} */
    this.nodes = new Map();
    /** @type {Set<string>} - Set of "nodeA--nodeB" blocked edge keys */
    this.blockedEdges = new Set();
  }

  /**
   * Helper to generate a normalized edge key between two node IDs.
   */
  _edgeKey(fromId, toId) {
    return [fromId, toId].sort().join('--');
  }

  /**
   * Dynamically blocks or unblocks a road segment (e.g. construction roadblock).
   * @param {string} fromId
   * @param {string} toId
   * @param {boolean} [isBlocked=true]
   */
  setEdgeBlocked(fromId, toId, isBlocked = true) {
    const key = this._edgeKey(fromId, toId);
    if (isBlocked) {
      this.blockedEdges.add(key);
    } else {
      this.blockedEdges.delete(key);
    }
  }

  /**
   * Checks if an edge between two nodes is currently closed/blocked.
   * @param {string} fromId
   * @param {string} toId
   * @returns {boolean}
   */
  isEdgeBlocked(fromId, toId) {
    return this.blockedEdges.has(this._edgeKey(fromId, toId));
  }

  /**
   * Clears all roadblocks.
   */
  clearBlockedEdges() {
    this.blockedEdges.clear();
  }

  /**
   * Adds a node to the road graph.
   * @param {string} id
   * @param {number} x
   * @param {number} z
   * @param {string} name
   * @returns {RoadNode}
   */
  addNode(id, x, z, name = '') {
    if (this.nodes.has(id)) {
      return this.nodes.get(id);
    }
    const node = new RoadNode(id, x, z, name);
    this.nodes.set(id, node);
    return node;
  }

  /**
   * Creates a bidirectional or unidirectional road segment between two nodes.
   * @param {string} fromId
   * @param {string} toId
   * @param {number} [customDistance] - Optional explicit distance
   * @param {string} [streetName] - Name of the street
   * @param {boolean} [bidirectional=true]
   */
  addEdge(fromId, toId, customDistance = null, streetName = '', bidirectional = true) {
    const nodeA = this.nodes.get(fromId);
    const nodeB = this.nodes.get(toId);

    if (!nodeA || !nodeB) {
      console.warn(`[RoadGraph] Cannot add edge between missing nodes: ${fromId} -> ${toId}`);
      return;
    }

    // Calculate Euclidean distance if not explicitly provided
    const distance = customDistance !== null 
      ? customDistance 
      : Math.hypot(nodeA.x - nodeB.x, nodeA.z - nodeB.z);

    nodeA.addNeighbor(toId, distance, streetName);
    if (bidirectional) {
      nodeB.addNeighbor(fromId, distance, streetName);
    }
  }

  /**
   * Finds the nearest road node to a given 3D world position (X, Z).
   * Useful to snap the car or passenger location to the road network.
   * @param {number} x
   * @param {number} z
   * @returns {{ node: RoadNode, distance: number } | null}
   */
  findNearestNode(x, z) {
    let nearest = null;
    let minDistanceSq = Infinity;

    for (const node of this.nodes.values()) {
      const dx = node.x - x;
      const dz = node.z - z;
      const distSq = dx * dx + dz * dz;

      if (distSq < minDistanceSq) {
        minDistanceSq = distSq;
        nearest = node;
      }
    }

    return nearest ? { node: nearest, distance: Math.sqrt(minDistanceSq) } : null;
  }

  /**
   * Returns a list of all nodes in the graph.
   * @returns {RoadNode[]}
   */
  getAllNodes() {
    return Array.from(this.nodes.values());
  }

  /**
   * Get a node by ID.
   * @param {string} id
   * @returns {RoadNode | undefined}
   */
  getNode(id) {
    return this.nodes.get(id);
  }
}

/**
 * Heuristic Function h(a, b):
 * Calculates straight-line (Euclidean) distance between two nodes.
 * Because straight-line distance is always <= road distance, it is an
 * "admissible heuristic" that guarantees finding the shortest path.
 * 
 * @param {RoadNode} nodeA
 * @param {RoadNode} nodeB
 * @returns {number}
 */
export function euclideanHeuristic(nodeA, nodeB) {
  const dx = nodeA.x - nodeB.x;
  const dz = nodeA.z - nodeB.z;
  return Math.sqrt(dx * dx + dz * dz);
}

/**
 * Reconstructs the path by tracing backward from the goal node to the start node
 * using the cameFrom map.
 * 
 * @param {Map<string, string>} cameFrom - Map where cameFrom[childId] = parentId
 * @param {string} currentId - The goal node ID
 * @param {RoadGraph} graph - The road graph
 * @returns {RoadNode[]} - An ordered array of nodes from start to goal
 */
function reconstructPath(cameFrom, currentId, graph) {
  const totalPath = [graph.getNode(currentId)];
  
  while (cameFrom.has(currentId)) {
    currentId = cameFrom.get(currentId);
    totalPath.unshift(graph.getNode(currentId));
  }
  
  return totalPath;
}

/**
 * Generates turn-by-turn driving instructions from a sequence of road nodes.
 * @param {RoadNode[]} path
 * @returns {Array<{ instruction: string, streetName: string, distance: number, angle: number }>}
 */
export function generateTurnDirections(path) {
  if (!path || path.length < 2) return [];

  const directions = [];

  for (let i = 0; i < path.length - 1; i++) {
    const current = path[i];
    const next = path[i + 1];
    const prev = i > 0 ? path[i - 1] : null;

    // Find the street name connecting current and next
    const edge = current.neighbors.find(n => n.targetId === next.id);
    const streetName = edge ? edge.streetName : 'City Street';
    const segmentDist = edge ? edge.distance : Math.hypot(next.x - current.x, next.z - current.z);

    if (i === 0) {
      directions.push({
        instruction: `Depart towards ${streetName || next.name}`,
        streetName,
        distance: segmentDist,
        angle: 0
      });
      continue;
    }

    // Calculate angle between (prev -> current) and (current -> next)
    const v1x = current.x - prev.x;
    const v1z = current.z - prev.z;
    const v2x = next.x - current.x;
    const v2z = next.z - current.z;

    const angle1 = Math.atan2(v1z, v1x);
    const angle2 = Math.atan2(v2z, v2x);
    let deltaAngle = (angle2 - angle1) * (180 / Math.PI);

    // Normalize to [-180, 180]
    while (deltaAngle > 180) deltaAngle -= 360;
    while (deltaAngle < -180) deltaAngle += 360;

    let turnText = 'Continue straight';
    if (deltaAngle > 40 && deltaAngle < 135) turnText = 'Turn Right';
    else if (deltaAngle >= 135) turnText = 'Sharp Right / U-turn';
    else if (deltaAngle < -40 && deltaAngle > -135) turnText = 'Turn Left';
    else if (deltaAngle <= -135) turnText = 'Sharp Left / U-turn';
    else if (deltaAngle > 15) turnText = 'Bear Right';
    else if (deltaAngle < -15) turnText = 'Bear Left';

    directions.push({
      instruction: `${turnText} onto ${streetName || next.name}`,
      streetName,
      distance: segmentDist,
      angle: deltaAngle
    });
  }

  // Final destination reached instruction
  directions.push({
    instruction: `Arrive at destination: ${path[path.length - 1].name}`,
    streetName: path[path.length - 1].name,
    distance: 0,
    angle: 0
  });

  return directions;
}

/**
 * Finds the shortest path between startNodeId and goalNodeId using the A* Algorithm.
 * 
 * @param {RoadGraph} graph - The road graph containing all nodes and edges
 * @param {string} startNodeId - The ID of the starting node
 * @param {string} goalNodeId - The ID of the target/destination node
 * @param {Function} [heuristic=euclideanHeuristic] - Heuristic function h(n)
 * @returns {{
 *   found: boolean,
 *   path: RoadNode[],
 *   totalDistance: number,
 *   nodesEvaluated: number,
 *   executionTimeMs: number,
 *   directions: Array<{ instruction: string, streetName: string, distance: number }>
 * }}
 */
export function findAStarPath(graph, startNodeId, goalNodeId, heuristic = euclideanHeuristic) {
  const startTime = performance.now();

  const startNode = graph.getNode(startNodeId);
  const goalNode = graph.getNode(goalNodeId);

  // Guard: Check if start and goal nodes exist in the graph
  if (!startNode || !goalNode) {
    return {
      found: false,
      path: [],
      totalDistance: 0,
      nodesEvaluated: 0,
      executionTimeMs: 0,
      directions: []
    };
  }

  // Trivial case: already at the goal
  if (startNodeId === goalNodeId) {
    return {
      found: true,
      path: [startNode],
      totalDistance: 0,
      nodesEvaluated: 1,
      executionTimeMs: performance.now() - startTime,
      directions: [{ instruction: 'Already at destination', streetName: startNode.name, distance: 0 }]
    };
  }

  // --------------------------------------------------------------------------
  // STEP 1: INITIALIZATION
  // --------------------------------------------------------------------------

  // openSet: Set of discovered nodes that need to be evaluated.
  // Initially, only the start node is in the openSet.
  const openSet = new Set([startNodeId]);

  // closedSet: Set of nodes that have already been evaluated.
  const closedSet = new Set();

  // cameFrom[n]: The node immediately preceding n on the cheapest known path.
  const cameFrom = new Map();

  // gScore[n]: The cost of the cheapest path from start to n currently known.
  // Default is Infinity for all nodes.
  const gScore = new Map();
  gScore.set(startNodeId, 0);

  // fScore[n]: Current best guess for total cost through node n: f(n) = g(n) + h(n).
  const fScore = new Map();
  fScore.set(startNodeId, heuristic(startNode, goalNode));

  let nodesEvaluatedCount = 0;

  // --------------------------------------------------------------------------
  // STEP 2: MAIN SEARCH LOOP
  // --------------------------------------------------------------------------
  while (openSet.size > 0) {
    // Find the node in openSet with the lowest fScore.
    let currentId = null;
    let lowestFScore = Infinity;

    for (const nodeId of openSet) {
      const score = fScore.get(nodeId) ?? Infinity;
      if (score < lowestFScore) {
        lowestFScore = score;
        currentId = nodeId;
      }
    }

    // If no valid node was found, break out (unreachable)
    if (currentId === null) break;

    const currentNode = graph.getNode(currentId);
    nodesEvaluatedCount++;

    // ------------------------------------------------------------------------
    // STEP 3: GOAL REACHED CHECK
    // ------------------------------------------------------------------------
    if (currentId === goalNodeId) {
      const path = reconstructPath(cameFrom, currentId, graph);
      const totalDistance = gScore.get(goalNodeId) || 0;
      const directions = generateTurnDirections(path);
      const executionTimeMs = performance.now() - startTime;

      return {
        found: true,
        path,
        totalDistance,
        nodesEvaluated: nodesEvaluatedCount,
        executionTimeMs,
        directions
      };
    }

    // Move current node from openSet to closedSet
    openSet.delete(currentId);
    closedSet.add(currentId);

    // ------------------------------------------------------------------------
    // STEP 4: EVALUATE NEIGHBORS
    // ------------------------------------------------------------------------
    for (const neighborInfo of currentNode.neighbors) {
      const neighborId = neighborInfo.targetId;

      // Ignore neighbors that have already been fully evaluated
      if (closedSet.has(neighborId)) {
        continue;
      }

      // Ignore edges blocked by road construction / roadblocks
      if (graph.isEdgeBlocked && graph.isEdgeBlocked(currentId, neighborId)) {
        continue;
      }

      // Calculate tentative gScore: cost from start to current + edge distance to neighbor
      const tentativeGScore = (gScore.get(currentId) ?? Infinity) + neighborInfo.distance;
      const currentNeighborGScore = gScore.get(neighborId) ?? Infinity;

      // If this path to neighbor is better than any previous one:
      if (tentativeGScore < currentNeighborGScore) {
        // Record this step on the best path
        cameFrom.set(neighborId, currentId);
        gScore.set(neighborId, tentativeGScore);

        const neighborNode = graph.getNode(neighborId);
        // f(n) = g(n) + h(n)
        const estimatedTotal = tentativeGScore + heuristic(neighborNode, goalNode);
        fScore.set(neighborId, estimatedTotal);

        // Add to openSet if not already present
        if (!openSet.has(neighborId)) {
          openSet.add(neighborId);
        }
      }
    }
  }

  // --------------------------------------------------------------------------
  // STEP 5: NO PATH FOUND (Disconnected graph)
  // --------------------------------------------------------------------------
  return {
    found: false,
    path: [],
    totalDistance: 0,
    nodesEvaluated: nodesEvaluatedCount,
    executionTimeMs: performance.now() - startTime,
    directions: []
  };
}
