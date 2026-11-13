# Aktoria Robotics — "Move here. Act there."

A museum-grade, high-craft interactive exhibition website designed from a blank canvas for **Aktoria Robotics** (San Francisco, CA). 

The platform demonstrates real-time cross-continental teleoperation of **I2RT YAM** robotic arms by trained operators in India for clients across Mexico, powered by spatial AR/VR digital twin simulations.

---

## The Signature Creative Concept: "Move here. Act there."

The signature interaction is simple:
1. **Hero**: A visitor drags a virtual operator handle on the left side of the screen and sees a simulated robotic gripper respond on the right in real time.
2. **Path Preservation**: When released, an orange trace preserves the path drawn.
3. **Continuity**: As the visitor scrolls, that same trace stretches into the India–Mexico connection, enters the 3D workspace as an operational trajectory, and resolves into the underline under the contact headline: *"Bring your workspace within reach."*

---

## The Six Exhibition Scenes

### 01 — The Interactive Hero ("Move here. Act there.")
- **Headline Entrance**: Reveals through two horizontal sliding masks as the camera settles.
- **Operator Handle**: Bounded believable workspace envelope (±60 mm) with keyboard arrow controls (`↑`, `↓`, `←`, `→`), visible reset button, and automated *"Play example"* motion sweep.
- **Mobile Friendly**: Touch dragging is confined strictly to the handle (`touch-action: none`) so the page scrolls naturally.
- **Simulated Gripper**: Kinematic end-effector with real-time finger travel, force telemetry, and preserved orange trajectory.

### 02 — Hardware Inspection ("Meet the arm.")
- **Pinned Composition**: Detailed shaded industrial render aligned with a technical blueprint / CAD wireframe outline.
- **Draggable Inspection Divider**: Smooth scanning slider revealing inner schematics and joint rotations.
- **Three Selectable Hotspots**:
  1. *Base Actuator*: DM6248 high-torque brushless motor with dual absolute magnetic encoders.
  2. *Articulated Arm*: 6-DOF carbon-aluminum linkages with zero-backlash cross-roller bearings.
  3. *Linear Gripper*: I2RT 95mm wide-throw parallel jaw with tactile strain sensing.
- **Seamless Transition**: Circular marker on the joint matches the map endpoint as the hardware dissolves into the geodesic route map.

### 03 — The Distance Between ("One operator. Two routes.")
- **Route Switcher**:
  - `[ Within India · ~5 ms ]`
  - `[ India → Mexico · ~125 ms ]`
- **Coordinated Action**: Animates map framing, updates the latency readout, shifts the active endpoint, and redraws the geodesic arc.
- **HQ Identified Separately**: San Francisco, CA highlighted as global headquarters with a separate ~180 ms research link.
- **"Send a Sample Signal"**: Slow visual pulse travels along the selected route with ACK confirmation.
- **Perspective Tilt**: Coordinate grid tilts in 3D perspective to form the floor grid of the remote workcell in Monterrey.

### 04 — Enter the Operator's Workspace ("See what the operator sees.")
- **Single Shared Three.js WebGL Scene**: Reused seamlessly between Scene 04 and Scene 05.
- **Three Camera Presets**:
  - `Operator`: Ergonomic VR seated view.
  - `Overhead`: Top-down orthographic plan view.
  - `Gripper Detail`: Macro inspection close-up.
- **Workspace Layers Panel**:
  - `Equipment labels`: 3D-anchored HTML badges with click-to-highlight and technical explanation sheets.
  - `Floor grid`: Millimeter calibration matrix.
  - `Motion path`: 3D AR trajectory spline.
- **Fallback**: Graceful step-through visualizer for environments without WebGL acceleration.

### 05 — Try One Teleoperation Task ("Pick. Move. Place.")
- **3-Step Simulation**:
  1. *Align*: Center gripper over workpiece cylinder.
  2. *Pinch*: Close parallel linear clamp with calibrated 15 N force.
  3. *Move & Place*: Transfer workpiece to target inspection zone and release.
- **Dual Modes**: *"Play demo"* (automated trajectory) and *"Try it myself"* (manual step buttons and mobile tap-to-select / tap-to-place).
- **Completion Telemetry**: Displays distance traveled, execution time, simulated latency buffer, and repeatability accuracy.
- **Trajectory Handoff**: Completed curve transitions directly into the contact headline underline.

### 06 — Contact ("Bring your workspace within reach.")
- **Quiet Ivory Composition**: Minimalist precision framed by the continuous teleoperation underline.
- **Primary Action**: *"Discuss a deployment"* opening an interactive modal with route latency options and fleet scope sizing.
- **Verified Link**: Links directly to `aktoria.com` and `contact@aktoria.com`.
- **Global / Regional Centers**: San Francisco (HQ), Noida (Operator Hubs), and Monterrey / Querétaro (Client Fleets).
- **Language Switcher**: Instant `EN` / `ES` toggle preserving scroll position, selected route, active camera view, and task progress.

---

## Verified User Journeys

The application has been verified against three complete end-to-end user journeys:
1. **Journey 1 (Desktop)**: Drags the hero operator handle, inspects the gripper hotspot with leader lines, switches to the Mexico route (~125 ms), and executes the pick-and-place task.
2. **Journey 2 (Spanish Mobile)**: Switches language to Español (`ES`), skips directly to the workspace, switches camera views, executes the tap-based task simulation, and submits the deployment inquiry.
3. **Journey 3 (Keyboard-Only & Reduced Motion)**: Navigates exclusively via keyboard with `prefers-reduced-motion` enabled, opens and closes the exhibition menu via Escape key, toggles both routes, runs the automated demo, and resets the simulation.

Automated verification suite:
```bash
node --experimental-strip-types tests/verify-journeys.ts
# Result: 36/36 tests passed (100% success)
```

---

## Asset Credits & Technical Reference

- **Robotic Manipulator Hardware**: Specifications, kinematics, and mechanical architecture based on the **I2RT YAM (Yet Another Manipulator)** open-architecture platform developed by **I2RT Robotics** (Fremont, CA).
- **Corporate Teleoperation References**: Teleoperation metrics, founder background, and verified contact path referenced from **Aktoria Robotics** (San Francisco, CA; `aktoria.com`).
- **Simulations**: All interactive workcells, trajectories, and latency pulses are illustrative simulations.

