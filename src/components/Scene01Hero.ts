import { store } from '../store.ts';

interface TrailPoint {
  x: number; // in mm
  y: number; // in mm
  isNewStroke?: boolean;
}

export class Scene01Hero {
  // Left Grid Controller Elements
  private handleEl: HTMLElement | null = null;
  private envelopeEl: HTMLElement | null = null;
  private traceCanvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private valXEl: HTMLElement | null = null;
  private valYEl: HTMLElement | null = null;

  // Right Photographic Arm Rig Elements
  private riggedArmSvg: SVGSVGElement | null = null;
  private rigUpper: SVGGElement | null = null;
  private rigForearm: SVGGElement | null = null;
  private rigWrist: SVGGElement | null = null;
  private robotFingertipHandle: SVGGElement | null = null;

  // Orange Connector Overlay
  private traceOverlaySvg: SVGSVGElement | null = null;
  private teleoperationPath: SVGPathElement | null = null;
  private traceHead: SVGCircleElement | null = null;

  // Arm Kinematic Geometry Constants (viewBox: 0 0 1536 1024)
  private readonly Sx = 1264; // Shoulder pivot X
  private readonly Sy = 643;  // Shoulder pivot Y
  private readonly Ex0 = 1067; // Elbow pivot X at rest
  private readonly Ey0 = 160;  // Elbow pivot Y at rest
  private readonly Tx0 = 256.5; // Gripper fingertip center X at rest
  private readonly Ty0 = 730;   // Gripper fingertip center Y at rest

  private readonly L1: number;
  private readonly L2: number;
  private readonly phi1_0: number;
  private readonly phi2_0: number;

  // Mapping Scale: 4.0 pixels in SVG per mm in grid
  private readonly SCALE = 4.0;
  private readonly maxGridRange = 60; // mm

  // Shared Gripper Position (Single source of truth)
  private sharedGridX = 0; // mm
  private sharedGridY = 0; // mm
  private currentRobotX = 256.5; // SVG coordinate
  private currentRobotY = 730;   // SVG coordinate

  // Dragging state: 'none' | 'grid' | 'robot'
  private activeDragSource: 'none' | 'grid' | 'robot' = 'none';

  // Trail history on left drawing grid (keeps earlier strokes and extends from tip)
  private trailPoints: TrailPoint[] = [];

  private isExamplePlaying = false;
  private animFrameId = 0;

  constructor() {
    // 1. Resolve DOM elements
    this.handleEl = document.getElementById('operator-handle');
    this.envelopeEl = document.getElementById('handle-envelope');
    this.traceCanvas = document.getElementById('hero-trace-canvas') as HTMLCanvasElement | null;
    if (this.traceCanvas) {
      this.ctx = this.traceCanvas.getContext('2d');
    }

    this.valXEl = document.getElementById('val-x');
    this.valYEl = document.getElementById('val-y');

    this.riggedArmSvg = document.getElementById('rigged-arm-svg') as unknown as SVGSVGElement | null;
    this.rigUpper = document.getElementById('rig-upper') as unknown as SVGGElement | null;
    this.rigForearm = document.getElementById('rig-forearm') as unknown as SVGGElement | null;
    this.rigWrist = document.getElementById('rig-wrist') as unknown as SVGGElement | null;
    this.robotFingertipHandle = document.getElementById('robot-fingertip-handle') as unknown as SVGGElement | null;

    this.traceOverlaySvg = document.getElementById('hero-trace-overlay-svg') as unknown as SVGSVGElement | null;
    this.teleoperationPath = document.getElementById('hero-teleoperation-path') as unknown as SVGPathElement | null;
    this.traceHead = document.getElementById('hero-trace-head') as unknown as SVGCircleElement | null;

    // 2. Compute Kinematic Link Constants
    this.L1 = Math.hypot(this.Ex0 - this.Sx, this.Ey0 - this.Sy); // ~521.6px
    this.L2 = Math.hypot(this.Tx0 - this.Ex0, this.Ty0 - this.Ey0); // ~990.9px
    this.phi1_0 = Math.atan2(this.Ey0 - this.Sy, this.Ex0 - this.Sx); // rest angle Link 1
    this.phi2_0 = Math.atan2(this.Ty0 - this.Ey0, this.Tx0 - this.Ex0); // rest angle Link 2

    // 3. Initialize Canvas & Event Listeners
    this.initCanvasSize();
    this.bindEvents();
    this.triggerEntrance();

    // 4. Initial Pose Solve and Render
    this.applySharedPosition(0, 0, false);
  }

  private initCanvasSize() {
    if (!this.traceCanvas || !this.envelopeEl) return;
    this.traceCanvas.width = this.envelopeEl.clientWidth;
    this.traceCanvas.height = this.envelopeEl.clientHeight;
    this.redrawTrailCanvas();
  }

  private triggerEntrance() {
    setTimeout(() => {
      document.querySelector('.headline-mask-wrapper')?.classList.add('revealed');
    }, 100);
  }

  // =========================================================================
  // ANALYTIC 2-LINK INVERSE KINEMATICS (IK) SOLVER
  // =========================================================================
  private solveIK(targetX: number, targetY: number) {
    const dx = targetX - this.Sx;
    const dy = targetY - this.Sy;
    let dist = Math.hypot(dx, dy);

    // Reachability boundaries
    const distMax = (this.L1 + this.L2) * 0.99; // ~1497px
    const distMin = Math.abs(this.L2 - this.L1) + 20; // ~489px

    let clamped = false;
    if (dist > distMax) {
      targetX = this.Sx + (dx / dist) * distMax;
      targetY = this.Sy + (dy / dist) * distMax;
      dist = distMax;
      clamped = true;
    } else if (dist < distMin) {
      targetX = this.Sx + (dx / dist) * distMin;
      targetY = this.Sy + (dy / dist) * distMin;
      dist = distMin;
      clamped = true;
    }

    const targetAngle = Math.atan2(targetY - this.Sy, targetX - this.Sx);
    const cosA = Math.max(-1, Math.min(1, (this.L1 * this.L1 + dist * dist - this.L2 * this.L2) / (2 * this.L1 * dist)));
    const angleA = Math.acos(cosA);

    // Choose elbow-up configuration (minimum Ey in screen coordinates)
    const phi1_up = targetAngle - angleA;
    const phi1_down = targetAngle + angleA;
    const Ey_up = this.Sy + this.L1 * Math.sin(phi1_up);
    const Ey_down = this.Sy + this.L1 * Math.sin(phi1_down);

    const phi1 = (Ey_up < Ey_down) ? phi1_up : phi1_down;
    const Ex = this.Sx + this.L1 * Math.cos(phi1);
    const Ey = this.Sy + this.L1 * Math.sin(phi1);

    const phi2 = Math.atan2(targetY - Ey, targetX - Ex);

    // Angular displacements from starting reference pose
    const dTheta1 = this.normalizeAngle(phi1 - this.phi1_0);
    const dTheta2 = this.normalizeAngle(phi2 - this.phi2_0);
    const relTheta2 = this.normalizeAngle(dTheta2 - dTheta1);

    return {
      reachableX: targetX,
      reachableY: targetY,
      dTheta1_deg: (dTheta1 * 180) / Math.PI,
      relTheta2_deg: (relTheta2 * 180) / Math.PI,
      clamped,
    };
  }

  private normalizeAngle(angle: number): number {
    let a = angle % (2 * Math.PI);
    if (a > Math.PI) a -= 2 * Math.PI;
    if (a < -Math.PI) a += 2 * Math.PI;
    return a;
  }

  // =========================================================================
  // TWO-WAY CONTROLLER SYNCHRONIZATION
  // =========================================================================
  /**
   * Applies a shared gripper position in grid coordinates (mm).
   * Solves IK, enforces physical arm limits, updates arm joint angles,
   * positions the grid cursor, extends the trail, updates X/Y readout,
   * and draws the orange connector between both controllers.
   */
  public applySharedPosition(gridX: number, gridY: number, recordStroke = true) {
    // 1. Convert grid (mm) to target robot coordinates (SVG pixels)
    const rawRobotX = this.Tx0 + gridX * this.SCALE;
    const rawRobotY = this.Ty0 - gridY * this.SCALE;

    // 2. Solve IK with reachability clamping
    const ik = this.solveIK(rawRobotX, rawRobotY);

    // 3. Convert final reachable position back to grid coordinates (mm)
    this.currentRobotX = ik.reachableX;
    this.currentRobotY = ik.reachableY;
    this.sharedGridX = (this.currentRobotX - this.Tx0) / this.SCALE;
    this.sharedGridY = -(this.currentRobotY - this.Ty0) / this.SCALE;

    // 4. Update Arm Joint Transforms (Upper arm rotates around shoulder; Forearm around elbow; Wrist at wrist)
    const rot1 = Math.abs(ik.dTheta1_deg) < 0.001 ? 0 : ik.dTheta1_deg;
    const rot2 = Math.abs(ik.relTheta2_deg) < 0.001 ? 0 : ik.relTheta2_deg;
    if (this.rigUpper) {
      this.rigUpper.setAttribute(
        'transform',
        `rotate(${rot1.toFixed(2)}, ${this.Sx}, ${this.Sy})`
      );
    }
    if (this.rigForearm) {
      this.rigForearm.setAttribute(
        'transform',
        `rotate(${rot2.toFixed(2)}, ${this.Ex0}, ${this.Ey0})`
      );
    }
    if (this.rigWrist) {
      this.rigWrist.setAttribute(
        'transform',
        `rotate(0, 577, 463)`
      );
    }

    // 5. Update Left Grid Handle DOM Position
    if (this.handleEl && this.envelopeEl) {
      const w = this.envelopeEl.clientWidth;
      const scale = (w * 0.38) / this.maxGridRange;
      const px = this.sharedGridX * scale;
      const py = -this.sharedGridY * scale;
      this.handleEl.style.transform = `translate(${px}px, ${py}px)`;
      this.handleEl.setAttribute('aria-valuenow', this.sharedGridX.toFixed(0));
    }

    // 6. Update Telemetry X/Y Readout
    if (this.valXEl) this.valXEl.textContent = this.sharedGridX.toFixed(1);
    if (this.valYEl) this.valYEl.textContent = this.sharedGridY.toFixed(1);

    // 7. Extend Trail on Left Drawing Grid
    if (recordStroke) {
      this.recordTrailPoint(this.sharedGridX, this.sharedGridY);
    }

    // 8. Update Orange Connector Path
    this.updateOrangeConnector();

    // 9. Sync with global store
    store.update((s) => {
      s.heroHandle.x = this.sharedGridX;
      s.heroHandle.y = this.sharedGridY;
    });
  }

  /**
   * Called when dragging directly on the robot fingertips in SVG space.
   */
  public applyRobotPosition(robotX: number, robotY: number, recordStroke = true) {
    const rawGridX = (robotX - this.Tx0) / this.SCALE;
    const rawGridY = -(robotY - this.Ty0) / this.SCALE;
    this.applySharedPosition(rawGridX, rawGridY, recordStroke);
  }

  // =========================================================================
  // TRAIL DRAWING (Preserves earlier strokes & extends from tip)
  // =========================================================================
  private recordTrailPoint(gx: number, gy: number, isNew = false) {
    this.trailPoints.push({ x: gx, y: gy, isNewStroke: isNew });
    if (this.trailPoints.length > 800) {
      this.trailPoints.shift();
    }
    this.redrawTrailCanvas();
  }

  private redrawTrailCanvas() {
    if (!this.ctx || !this.traceCanvas || !this.envelopeEl) return;
    const w = this.traceCanvas.width;
    const h = this.traceCanvas.height;
    const cx = w / 2;
    const cy = h / 2;
    const scale = (w * 0.38) / this.maxGridRange;

    this.ctx.clearRect(0, 0, w, h);
    if (this.trailPoints.length < 2) return;

    this.ctx.beginPath();
    this.ctx.strokeStyle = '#FF5000';
    this.ctx.lineWidth = 2.5;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';

    for (let i = 0; i < this.trailPoints.length; i++) {
      const pt = this.trailPoints[i];
      const px = cx + pt.x * scale;
      const py = cy - pt.y * scale;

      if (i === 0 || pt.isNewStroke) {
        this.ctx.moveTo(px, py);
      } else {
        this.ctx.lineTo(px, py);
      }
    }
    this.ctx.stroke();
  }

  public clearTrail() {
    this.trailPoints = [];
    if (this.ctx && this.traceCanvas) {
      this.ctx.clearRect(0, 0, this.traceCanvas.width, this.traceCanvas.height);
    }
  }

  // =========================================================================
  // ORANGE CONNECTOR TRACE OVERLAY
  // =========================================================================
  private updateOrangeConnector() {
    if (!this.teleoperationPath || !this.traceOverlaySvg || !this.handleEl) return;

    const svgRect = this.traceOverlaySvg.getBoundingClientRect();
    const svgLeft = svgRect.left || 0;
    const svgTop = svgRect.top || 0;

    // Start point: Screen center of left grid controller handle
    const handleRect = this.handleEl.getBoundingClientRect();
    const startX = (handleRect.width ? handleRect.left + handleRect.width / 2 : 120) - svgLeft;
    const startY = (handleRect.height ? handleRect.top + handleRect.height / 2 : 200) - svgTop;

    // End point: Screen center of robot gripper fingertips
    let endX = startX + 300;
    let endY = startY;

    if (this.riggedArmSvg && this.robotFingertipHandle) {
      const ctm = this.robotFingertipHandle.getScreenCTM();
      if (ctm) {
        const pt = this.riggedArmSvg.createSVGPoint();
        pt.x = 0;
        pt.y = 0;
        const screenP = pt.matrixTransform(ctm);
        endX = screenP.x - svgLeft;
        endY = screenP.y - svgTop;
      } else {
        const rRect = this.robotFingertipHandle.getBoundingClientRect();
        endX = (rRect.width ? rRect.left + rRect.width / 2 : 450) - svgLeft;
        endY = (rRect.height ? rRect.top + rRect.height / 2 : 200) - svgTop;
      }
    }

    const dx = endX - startX;
    const dy = endY - startY;

    // Dynamic bezier curve flexes with operator deflection
    const flexX = (this.sharedGridX / this.maxGridRange) * 45;
    const flexY = -(this.sharedGridY / this.maxGridRange) * 45;

    const cp1X = startX + dx * 0.38 + flexX;
    const cp1Y = startY + dy * 0.12 + flexY;
    const cp2X = startX + dx * 0.68 - flexX * 0.5;
    const cp2Y = startY + dy * 0.82 - flexY * 0.5;

    const d = `M ${startX.toFixed(1)} ${startY.toFixed(1)} C ${cp1X.toFixed(1)} ${cp1Y.toFixed(1)}, ${cp2X.toFixed(1)} ${cp2Y.toFixed(1)}, ${endX.toFixed(1)} ${endY.toFixed(1)}`;
    this.teleoperationPath.setAttribute('d', d);

    if (this.traceHead) {
      this.traceHead.setAttribute('cx', endX.toFixed(1));
      this.traceHead.setAttribute('cy', endY.toFixed(1));
    }
  }

  // =========================================================================
  // EVENT BINDINGS (Two-Way Mouse, Touch & Keyboard Arrow Controls)
  // =========================================================================
  private bindEvents() {
    window.addEventListener('resize', () => {
      this.initCanvasSize();
      this.updateOrangeConnector();
    });

    // -----------------------------------------------------------------------
    // CONTROLLER 1: Left Grid Handle Dragging
    // -----------------------------------------------------------------------
    if (this.handleEl && this.envelopeEl) {
      this.handleEl.addEventListener('pointerdown', (e) => {
        if (this.isExamplePlaying) {
          cancelAnimationFrame(this.animFrameId);
          this.isExamplePlaying = false;
        }
        this.activeDragSource = 'grid';
        this.handleEl?.setPointerCapture(e.pointerId);
        // Start a new stroke in trail
        this.recordTrailPoint(this.sharedGridX, this.sharedGridY, true);
      });

      this.envelopeEl.addEventListener('pointermove', (e) => {
        if (this.activeDragSource !== 'grid' || !this.envelopeEl) return;
        const rect = this.envelopeEl.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        const pixelDx = e.clientX - centerX;
        const pixelDy = e.clientY - centerY;

        const scale = this.maxGridRange / (rect.width * 0.38);
        const gx = Math.max(-this.maxGridRange, Math.min(this.maxGridRange, pixelDx * scale));
        const gy = Math.max(-this.maxGridRange, Math.min(this.maxGridRange, -pixelDy * scale));

        this.applySharedPosition(gx, gy, true);
      });

      const onGridEnd = (e: PointerEvent) => {
        if (this.activeDragSource === 'grid') {
          this.activeDragSource = 'none';
          try {
            this.handleEl?.releasePointerCapture(e.pointerId);
          } catch {
            // ignore
          }
        }
      };

      this.handleEl.addEventListener('pointerup', onGridEnd);
      this.handleEl.addEventListener('pointercancel', onGridEnd);
    }

    // -----------------------------------------------------------------------
    // CONTROLLER 2: Robot Fingertip Dragging (Direct Manipulation on Arm)
    // -----------------------------------------------------------------------
    if (this.robotFingertipHandle && this.riggedArmSvg) {
      this.robotFingertipHandle.addEventListener('pointerdown', (e) => {
        if (this.isExamplePlaying) {
          cancelAnimationFrame(this.animFrameId);
          this.isExamplePlaying = false;
        }
        this.activeDragSource = 'robot';
        this.robotFingertipHandle?.classList.add('dragging');
        this.robotFingertipHandle?.setPointerCapture(e.pointerId);
        // Start a new stroke in trail
        this.recordTrailPoint(this.sharedGridX, this.sharedGridY, true);
      });

      window.addEventListener('pointermove', (e) => {
        if (this.activeDragSource !== 'robot' || !this.riggedArmSvg) return;

        // Convert client screen coordinates to SVG viewBox coordinate space
        const pt = this.riggedArmSvg.createSVGPoint();
        pt.x = e.clientX;
        pt.y = e.clientY;
        const ctm = this.riggedArmSvg.getScreenCTM();
        if (ctm) {
          const svgP = pt.matrixTransform(ctm.inverse());
          this.applyRobotPosition(svgP.x, svgP.y, true);
        }
      });

      const onRobotEnd = (e: PointerEvent) => {
        if (this.activeDragSource === 'robot') {
          this.activeDragSource = 'none';
          this.robotFingertipHandle?.classList.remove('dragging');
          try {
            this.robotFingertipHandle?.releasePointerCapture(e.pointerId);
          } catch {
            // ignore
          }
        }
      };

      this.robotFingertipHandle.addEventListener('pointerup', onRobotEnd);
      this.robotFingertipHandle.addEventListener('pointercancel', onRobotEnd);
    }

    // -----------------------------------------------------------------------
    // Keyboard Arrow Keys Controls
    // -----------------------------------------------------------------------
    window.addEventListener('keydown', (e) => {
      const step = e.shiftKey ? 1 : 4; // mm (Shift for fine 1mm nudge)
      let moved = false;
      let nextX = this.sharedGridX;
      let nextY = this.sharedGridY;

      if (e.key === 'ArrowUp') {
        nextY = Math.min(this.maxGridRange, nextY + step);
        moved = true;
      } else if (e.key === 'ArrowDown') {
        nextY = Math.max(-this.maxGridRange, nextY - step);
        moved = true;
      } else if (e.key === 'ArrowLeft') {
        nextX = Math.max(-this.maxGridRange, nextX - step);
        moved = true;
      } else if (e.key === 'ArrowRight') {
        nextX = Math.min(this.maxGridRange, nextX + step);
        moved = true;
      }

      if (moved) {
        if (this.isExamplePlaying) {
          cancelAnimationFrame(this.animFrameId);
          this.isExamplePlaying = false;
        }
        this.applySharedPosition(nextX, nextY, true);
        e.preventDefault();
      }
    });

    // -----------------------------------------------------------------------
    // Reset Button
    // -----------------------------------------------------------------------
    document.getElementById('btn-hero-reset')?.addEventListener('click', () => {
      this.resetPosition();
    });

    // -----------------------------------------------------------------------
    // Play Example Button
    // -----------------------------------------------------------------------
    document.getElementById('btn-hero-example')?.addEventListener('click', () => {
      this.playExampleMotion();
    });
  }

  // =========================================================================
  // ACTIONS: PLAY EXAMPLE & RESET
  // =========================================================================
  /**
   * Traces a smooth circle in both views, drawing on the grid and bending the arm.
   */
  public playExampleMotion() {
    if (this.isExamplePlaying) return;
    this.isExamplePlaying = true;
    cancelAnimationFrame(this.animFrameId);

    // Start a new stroke in trail
    const radius = 34; // mm
    const duration = 2800; // ms
    const startTime = performance.now();

    // Initial point
    this.recordTrailPoint(0, radius, true);

    const step = (now: number) => {
      const elapsed = now - startTime;
      const t = Math.min(1, elapsed / duration);

      // Parametric circle: angle 0 to 2*PI
      const angle = t * 2 * Math.PI;
      const gx = Math.sin(angle) * radius;
      const gy = Math.cos(angle) * radius;

      this.applySharedPosition(gx, gy, true);

      if (t < 1) {
        this.animFrameId = requestAnimationFrame(step);
      } else {
        // Settle smoothly back at starting pose
        this.applySharedPosition(0, 0, false);
        this.isExamplePlaying = false;
      }
    };

    this.animFrameId = requestAnimationFrame(step);
  }

  /**
   * Reset returns the arm to starting pose, centers grid cursor, and clears trail.
   */
  public resetPosition() {
    this.isExamplePlaying = false;
    cancelAnimationFrame(this.animFrameId);
    this.clearTrail();
    this.applySharedPosition(0, 0, false);
  }

  public destroy() {
    cancelAnimationFrame(this.animFrameId);
  }
}
