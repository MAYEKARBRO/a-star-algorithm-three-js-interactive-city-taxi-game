# 🚖 Metropolis A* Navigator

> A high-performance, smooth 3D taxi driving web application built with **Three.js** and **Vite**, featuring an educational, real-time **A\* (A-Star) Pathfinding Algorithm** navigating passengers across a procedural metropolis.

![Game Banner](public/assets/passenger1.jpg)

---

## ✨ Features

- **⚡ Core A\* Pathfinding Algorithm:**
  - Admissible Euclidean distance heuristic guarantees the optimal shortest route between pickup (Point A) and destination (Point B).
  - Handles **dynamic road construction detours** in real-time when street edges are obstructed.
  - Interactive **A\* Inspector Drawer** displays live telemetry: evaluated open-set nodes, execution latency in milliseconds, route distance, and turn-by-turn directions.
  - Interactive **3D Graph Visualizer** (`G` key) renders all 49 topological intersection nodes and road edges in real-time.

- **🏙️ Dynamic 3D Metropolis:**
  - 5 distinct procedural architectural building styles with illuminated facade window patterns, roof air conditioners, and flashing aviation beacons.
  - Lush vegetation: deciduous green trees, cherry blossoms, and evergreen cypress trees.
  - Sidewalks populated by walking pedestrian NPCs with ragdoll knockdowns and fine deductions on collision.

- **🚌 Diverse City Traffic:**
  - AI traffic vehicles navigating road lanes:
    - **City Transit Buses:** 7.2m long dual-axle buses with panoramic passenger windows and glowing LED destination marquees.
    - **Emergency Ambulances:** White medical vans with red cross emblems and flashing emergency strobe lightbars.
    - **Heavy Cargo Trucks:** High chrome exhaust stacks with heavy freight shipping containers.
    - **Urban SUVs:** Rugged utility vehicles with roof rack rails and rear-mounted spare tires.
    - **Personal Sedans:** Vibrant metallic paint finishes.

- **🚥 3-Phase Intersection Traffic Lights:**
  - Automated signal gantries at major crossroads cycling through **Green (11s)**, **Yellow (3s)**, and **Red (11s)**.
  - Running a red light incurs an immediate **$5.00 Fine** with warning toasts.

- **🚝 Overhead Elevated Monorail:**
  - 11-meter-high curved concrete track beam with support pillars looping around the skyline.
  - 3-car futuristic bullet train with glowing windows and power rail traveling continuously around the metropolis.

- **🏎️ Nitro Turbo & Interactive Street Props:**
  - **Nitro Boost Pickups:** Floating cyan canisters refill the `⚡ NITRO [SHIFT]` tank. Unleash high-speed bursts with turbo exhaust flames and dynamic camera FOV zoom.
  - **Destructible Fire Hydrants:** Smashing into hydrants erupts vertical water geysers (`+$100 PTS`) with spray audio.
  - **Wooden Crates:** Shatter on impact into flying wood debris (`+$75 PTS`).

- **☁️ Volumetric Drifting Clouds & 4 Weather Modes:**
  - 28 low-poly volumetric clouds drifting across the sky.
  - 4 dynamic weather presets (**Day ☀️**, **Sunset 🌅**, **Night 🌙**, **Rain 🌧️** with 1,800 falling 3D raindrops).

- **👑 VIP Passenger Missions:**
  - **Dr. Julian Hayes (Emergency Surgeon):** Life-saving emergency transfer with high-speed time bonuses.
  - **Stella Monet (VIP Celebrity):** Features a live **Passenger Comfort Meter (100%)** that decreases on collisions.
  - **Rex "Nitro" Walker (Speed Demon):** Demands non-stop high velocity.

- **🚖 Driver Enrollment & Customization:**
  - Customized driver license profile: Driver Name, Age, 8 car paint finishes, and 9 rooftop fun mascot symbols (⚡, 🔥, 👑, 🚀, 💎, 🐉, 🎯, 🌟, 🏎️).

---

## 🎮 Controls

| Action | Keyboard | Joystick / Gamepad Controller |
| :--- | :--- | :--- |
| **Accelerate / Throttle** | `W` or `↑` | Right Trigger (`RT`) / Left Stick Up |
| **Brake / Reverse** | `S` or `↓` | Left Trigger (`LT`) / Left Stick Down |
| **Steer Left / Right** | `A` / `D` or `←` / `→` | Left Analog Stick (`X-Axis`) |
| **Handbrake / Drift** | `Spacebar` | Face Button `A` / `X` |
| **Nitro Turbo Boost** | `Shift` (Left / Right) | Face Button `B` / `Y` |
| **Sound Horn** | `H` | Left Stick Click (`L3`) |
| **Switch Camera View** | `C` | Button `Select` / D-Pad Up |
| **Toggle 3D A\* Graph** | `G` | Right Stick Click (`R3`) |
| **Open A\* Telemetry Inspector** | `I` | Button `Start` / Menu |
| **Reset Vehicle Position** | `R` | Button `Back` / D-Pad Down |
| **Mute / Unmute Audio** | `M` | - |
| **Orbit Camera** | Mouse Drag (Orbit Mode) | Right Analog Stick |

---

## 🛠️ Tech Stack

- **Graphics & 3D:** [Three.js](https://threejs.org/)
- **Build Tool & Bundler:** [Vite](https://vitejs.dev/)
- **Audio:** Web Audio API (procedural synthesis for engine RPM, tire screech, turbo whoosh, sirens, and crash impacts)
- **Controls:** HTML5 Gamepad API + Keyboard/Mouse event listeners
- **Styling:** Vanilla CSS with glassmorphism, responsive HUD widgets, and custom SVG gauges

---

## 🚀 Getting Started Locally

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- `npm`

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/<YOUR_USERNAME>/<REPO_NAME>.git
   cd <REPO_NAME>
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:5173/`.

### Production Build
```bash
npm run build
npm run preview
```

---

## 📐 The A\* Algorithm Implementation

Located in [`src/pathfinding/astar.js`](src/pathfinding/astar.js):

$$\mathbf{f(n) = g(n) + h(n)}$$

- **$g(n)$ (Exact Cost):** Total accumulated road distance from start intersection to node $n$.
- **$h(n)$ (Heuristic Function):** Euclidean distance to target node $h(n) = \sqrt{(x_{\text{goal}} - x_n)^2 + (z_{\text{goal}} - z_n)^2}$.
- **Admissibility:** Since Euclidean straight-line distance never overestimates actual road distance on a grid, A\* is guaranteed to produce the optimal shortest path.

---

## 📄 License
MIT License. Feel free to use and adapt!
