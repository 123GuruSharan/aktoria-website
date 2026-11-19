import * as THREE from 'three';
import { YAMArmModel } from './YAMArmModel.ts';
import { WorkcellEnvironment } from './WorkcellEnvironment.ts';
import { store, CameraPreset } from '../store.ts';

export class WorkcellScene {
  public container: HTMLElement;
  public renderer: THREE.WebGLRenderer | null = null;
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;

  public arm: YAMArmModel;
  public env: WorkcellEnvironment;

  // Camera Presets
  private cameraPositions: Record<CameraPreset, { pos: THREE.Vector3; target: THREE.Vector3 }> = {
    operator: {
      pos: new THREE.Vector3(0, 0.88, 1.25),
      target: new THREE.Vector3(0, 0.46, 0.2),
    },
    overhead: {
      pos: new THREE.Vector3(0, 1.65, 0.22),
      target: new THREE.Vector3(0, 0.4, 0.22),
    },
    detail: {
      pos: new THREE.Vector3(0.28, 0.62, 0.42),
      target: new THREE.Vector3(0.14, 0.45, 0.22),
    },
  };

  private currentCamTarget = new THREE.Vector3(0, 0.46, 0.2);
  private desiredCamPos = new THREE.Vector3(0, 0.88, 1.25);
  private desiredCamTarget = new THREE.Vector3(0, 0.46, 0.2);

  // Orbit Drag State
  private isPointerDown = false;
  private prevPointerX = 0;
  private prevPointerY = 0;
  private spherical = new THREE.Spherical();
  private isUserInteracting = false;
  private userInteractionTimeout = 0;

  // Animation & Rendering Loop
  private isRunning = true;
  private isVisibleOnScreen = true;
  private animationId = 0;
  private isWebglSupported = true;

  // Task Animation State Machine
  public isPieceAttached = false;
  private autoDemoRunning = false;
  private autoDemoPaused = false;
  private activeJointAnim: {
    cancel: () => void;
    pause: () => void;
    resume: () => void;
  } | null = null;
  private autoStepTimeout = 0;
  private currentAutoStep = 0;
  private onAutoProgressCb?: (step: number) => void;
  private onAutoCompleteCb?: () => void;

  // Manual Gripper Target State
  private manualTargetPos = new THREE.Vector3(0.18, 0.44, 0.22);

  constructor(container: HTMLElement) {
    this.container = container;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0e1013);

    // Camera setup
    const aspect = (container.clientWidth || 800) / (container.clientHeight || 560);
    this.camera = new THREE.PerspectiveCamera(42, aspect, 0.1, 20);
    this.setCameraPreset('operator', true);

    // Check WebGL Support
    try {
      this.renderer = new THREE.WebGLRenderer({
        antialias: true,
        powerPreference: 'high-performance',
      });
      this.renderer.setSize(container.clientWidth || 800, container.clientHeight || 560);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
      this.renderer.toneMappingExposure = 1.1;
      this.container.appendChild(this.renderer.domElement);
    } catch {
      this.isWebglSupported = false;
      const fallback = document.getElementById('webgl-fallback');
      if (fallback) fallback.hidden = false;
    }

    // Add Workcell Environment
    this.env = new WorkcellEnvironment();
    this.scene.add(this.env.group);

    // Add Authentic YAM Arm Model
    this.arm = new YAMArmModel();
    this.arm.group.position.set(0, 0.405, 0.15);
    this.scene.add(this.arm.group);

    // Setup Lighting
    this.setupLighting();

    // Event Listeners for Orbit Drag, Resize & Visibility
    this.setupInteractions();

    // Start Rendering Loop
    if (this.isWebglSupported && this.renderer) {
      this.animate();
    }
  }

  private setupLighting() {
    // Soft Ambient light
    const ambLight = new THREE.AmbientLight(0xfff6ea, 0.7);
    this.scene.add(ambLight);

    // Key directional light with soft contact shadow
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.8);
    dirLight.position.set(1.5, 2.8, 1.8);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 6;
    dirLight.shadow.camera.left = -1.2;
    dirLight.shadow.camera.right = 1.2;
    dirLight.shadow.camera.top = 1.2;
    dirLight.shadow.camera.bottom = -1.2;
    dirLight.shadow.bias = -0.0005;
    this.scene.add(dirLight);

    // Cool cyan/blue rim light for industrial depth
    const rimLight = new THREE.DirectionalLight(0x00e5ff, 0.45);
    rimLight.position.set(-1.8, 1.2, -1.0);
    this.scene.add(rimLight);

    // Signal orange accent workcell spotlight
    const orangeSpot = new THREE.SpotLight(0xff5000, 2.2, 4.0, Math.PI / 4, 0.35);
    orangeSpot.position.set(0, 2.0, 0.4);
    orangeSpot.target = this.env.tableGroup;
    this.scene.add(orangeSpot);
  }

  private setupInteractions() {
    window.addEventListener('resize', this.onResize);

    // IntersectionObserver to pause rendering when offscreen
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          this.isVisibleOnScreen = entry.isIntersecting;
        });
      }, { threshold: 0.05 });
      observer.observe(this.container);
    }

    // Visibility change listener
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.isVisibleOnScreen = false;
      } else {
        this.isVisibleOnScreen = true;
      }
    });

    // Pointer events for orbit drag
    const dom = this.container;
    dom.addEventListener('pointerdown', (e) => {
      // On touch devices, allow camera orbit only if Explore View is active
      const isTouch = e.pointerType === 'touch';
      const isExploreActive = store.getState().exploreViewActive;
      if (isTouch && !isExploreActive) {
        return; // Don't block vertical page scroll on touch
      }

      this.isPointerDown = true;
      this.prevPointerX = e.clientX;
      this.prevPointerY = e.clientY;
      this.isUserInteracting = true;
      clearTimeout(this.userInteractionTimeout);
    });

    window.addEventListener('pointermove', (e) => {
      if (!this.isPointerDown) return;
      const dx = e.clientX - this.prevPointerX;
      const dy = e.clientY - this.prevPointerY;
      this.prevPointerX = e.clientX;
      this.prevPointerY = e.clientY;

      // Orbit camera around current target
      const offset = this.camera.position.clone().sub(this.currentCamTarget);
      this.spherical.setFromVector3(offset);
      this.spherical.theta -= dx * 0.006;
      this.spherical.phi = Math.max(0.15, Math.min(Math.PI / 2 - 0.05, this.spherical.phi - dy * 0.006));
      offset.setFromSpherical(this.spherical);
      this.camera.position.copy(this.currentCamTarget).add(offset);
      this.camera.lookAt(this.currentCamTarget);

      this.desiredCamPos.copy(this.camera.position);
    });

    window.addEventListener('pointerup', () => {
      this.isPointerDown = false;
      this.userInteractionTimeout = window.setTimeout(() => {
        this.isUserInteracting = false;
      }, 3500);
    });
  }

  public setCameraPreset(preset: CameraPreset, immediate = false) {
    const p = this.cameraPositions[preset];
    if (!p) return;
    this.desiredCamPos.copy(p.pos);
    this.desiredCamTarget.copy(p.target);
    this.isUserInteracting = false;

    if (immediate) {
      this.camera.position.copy(p.pos);
      this.currentCamTarget.copy(p.target);
      this.camera.lookAt(this.currentCamTarget);
    }
  }

  public resetCameraView() {
    const curPreset = store.getState().selectedCamera || 'operator';
    this.setCameraPreset(curPreset, false);
  }

  public setCameraCloserForTask(immediate = false) {
    // Closer framing for Scene 05 "Pick. Move. Place."
    const taskPos = new THREE.Vector3(0.14, 0.76, 0.92);
    const taskTarget = new THREE.Vector3(0, 0.44, 0.22);
    this.desiredCamPos.copy(taskPos);
    this.desiredCamTarget.copy(taskTarget);
    this.isUserInteracting = false;
    if (immediate) {
      this.camera.position.copy(taskPos);
      this.currentCamTarget.copy(taskTarget);
      this.camera.lookAt(this.currentCamTarget);
    }
  }

  public setCameraPullBackForContact(immediate = false) {
    // Pulled back overview for Scene 06 exit transition
    const exitPos = new THREE.Vector3(0, 1.05, 1.55);
    const exitTarget = new THREE.Vector3(0, 0.46, 0.2);
    this.desiredCamPos.copy(exitPos);
    this.desiredCamTarget.copy(exitTarget);
    this.isUserInteracting = false;
    if (immediate) {
      this.camera.position.copy(exitPos);
      this.currentCamTarget.copy(exitTarget);
      this.camera.lookAt(this.currentCamTarget);
    }
  }

  public setLayerVisible(layer: 'labels' | 'grid' | 'path', visible: boolean) {
    if (layer === 'grid') {
      this.env.setGridVisible(visible);
    } else if (layer === 'path') {
      this.env.setMotionPathVisible(visible);
    } else if (layer === 'labels') {
      const el = document.getElementById('anchored-labels-layer');
      if (el) el.style.display = visible ? 'block' : 'none';
    }
  }

  public onResize = () => {
    if (!this.renderer || !this.container) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  };

  /**
   * Project 3D objects to 2D HTML labels layer with occlusion check
   */
  private updateAnchoredLabels() {
    if (!store.getState().layers.labels) return;

    const labelArm = document.getElementById('label-arm');
    const labelTable = document.getElementById('label-table');
    const labelGripper = document.getElementById('label-gripper');
    const labelPiece = document.getElementById('label-piece');

    const width = this.container.clientWidth;
    const height = this.container.clientHeight;

    const projectToScreen = (worldPos: THREE.Vector3, element: HTMLElement | null) => {
      if (!element) return;
      const p = worldPos.clone().project(this.camera);
      // Behind camera check or outside frustum
      if (p.z > 1 || p.z < -1) {
        element.style.opacity = '0';
        element.style.pointerEvents = 'none';
        return;
      }
      element.style.opacity = '1';
      element.style.pointerEvents = 'auto';
      const x = (p.x * 0.5 + 0.5) * width;
      const y = (-(p.y * 0.5) + 0.5) * height;
      element.style.left = `${x}px`;
      element.style.top = `${y}px`;
    };

    projectToScreen(new THREE.Vector3(0, 0.65, 0.15), labelArm);
    projectToScreen(new THREE.Vector3(0.28, 0.38, 0.38), labelTable);
    const gripPos = new THREE.Vector3();
    this.arm.getGripperWorldPosition(gripPos);
    projectToScreen(gripPos, labelGripper);
    projectToScreen(this.env.workpieceMesh.position, labelPiece);
  }

  // ==========================================
  // KINEMATIC TASK ACTIONS (SCENE 05)
  // ==========================================

  public alignGripper(onComplete?: () => void) {
    // Pose 1: Approach orange workpiece with open gripper
    this.animateJoints(-0.35, 0.52, 0.95, -0.47, 0, 0.084, 800, () => {
      this.env.setWorkpieceHighlighted(true);
      store.update((s) => {
        s.task.gripperAligned = true;
        s.task.step = 2;
      });
      onComplete?.();
    });
  }

  public clampGripper(onComplete?: () => void) {
    // Pose 2: Lower slightly and clamp fingers securely around workpiece
    this.animateJoints(-0.35, 0.58, 1.05, -0.63, 0, 0.044, 550, () => {
      this.isPieceAttached = true;
      store.update((s) => {
        s.task.clamped = true;
        s.task.step = 3;
      });
      onComplete?.();
    });
  }

  public moveToDestination(onComplete?: () => void) {
    // Pose 3: Lift workpiece above table, then transport along curved orange arc
    // Step 3a: Lift vertically to clear table
    this.animateJoints(-0.35, 0.44, 0.82, -0.38, 0, 0.044, 500, () => {
      // Step 3b: Swing base yaw over to destination target zone
      this.animateJoints(0.35, 0.44, 0.82, -0.38, 0, 0.044, 800, () => {
        // Step 3c: Lower toward target zone
        this.animateJoints(0.35, 0.54, 0.98, -0.52, 0, 0.044, 500, () => {
          this.env.setTargetHighlighted(true);
          store.update((s) => {
            s.task.pieceMoved = true;
          });
          onComplete?.();
        });
      });
    });
  }

  public releaseWorkpiece(onComplete?: () => void) {
    // Pose 4: Lower into outlined target, open gripper, lift away and settle
    this.animateJoints(0.35, 0.58, 1.05, -0.63, 0, 0.084, 600, () => {
      this.isPieceAttached = false;
      this.env.workpieceMesh.position.copy(this.env.targetDropPos);
      this.env.triggerPlacementPulse();
      store.update((s) => {
        s.task.completed = true;
      });
      // Lift arm away and settle
      this.animateJoints(0.35, 0.45, 0.85, -0.4, 0, 0.084, 600, () => {
        onComplete?.();
      });
    });
  }

  // ==========================================
  // PLAY DEMO (AUTOMATED SEQUENCE WITH PAUSE/RESUME)
  // ==========================================

  public runAutoDemo(onProgress?: (step: number) => void, onComplete?: () => void) {
    this.resetTask();
    this.autoDemoRunning = true;
    this.autoDemoPaused = false;
    this.onAutoProgressCb = onProgress;
    this.onAutoCompleteCb = onComplete;
    this.executeAutoStep(1);
  }

  private executeAutoStep(step: number) {
    if (!this.autoDemoRunning || this.autoDemoPaused) return;
    this.currentAutoStep = step;
    this.onAutoProgressCb?.(step);

    if (step === 1) {
      this.alignGripper(() => {
        if (!this.autoDemoRunning || this.autoDemoPaused) return;
        this.autoStepTimeout = window.setTimeout(() => this.executeAutoStep(2), 400);
      });
    } else if (step === 2) {
      this.clampGripper(() => {
        if (!this.autoDemoRunning || this.autoDemoPaused) return;
        this.autoStepTimeout = window.setTimeout(() => this.executeAutoStep(3), 400);
      });
    } else if (step === 3) {
      this.moveToDestination(() => {
        if (!this.autoDemoRunning || this.autoDemoPaused) return;
        this.autoStepTimeout = window.setTimeout(() => {
          this.releaseWorkpiece(() => {
            this.autoDemoRunning = false;
            this.onAutoCompleteCb?.();
          });
        }, 400);
      });
    }
  }

  public pauseAutoDemo() {
    if (!this.autoDemoRunning) return;
    this.autoDemoPaused = true;
    clearTimeout(this.autoStepTimeout);
    this.activeJointAnim?.pause();
    store.update((s) => {
      s.task.isPaused = true;
    });
  }

  public resumeAutoDemo() {
    if (!this.autoDemoRunning || !this.autoDemoPaused) return;
    this.autoDemoPaused = false;
    store.update((s) => {
      s.task.isPaused = false;
    });
    if (this.activeJointAnim) {
      this.activeJointAnim.resume();
    } else {
      this.executeAutoStep(this.currentAutoStep || 1);
    }
  }

  public togglePauseDemo(): boolean {
    if (this.autoDemoPaused) {
      this.resumeAutoDemo();
      return false; // Not paused anymore
    } else {
      this.pauseAutoDemo();
      return true; // Is paused
    }
  }

  // ==========================================
  // MANUAL CONTROLS: "TRY IT YOURSELF"
  // ==========================================

  public manualMovePlanar(dx: number, dz: number) {
    this.manualTargetPos.x = Math.max(-0.28, Math.min(0.28, this.manualTargetPos.x + dx));
    this.manualTargetPos.z = Math.max(0.12, Math.min(0.34, this.manualTargetPos.z + dz));

    // Calculate approximate joint angles for (x, z)
    const j1 = -Math.atan2(this.manualTargetPos.x, this.manualTargetPos.z);
    const r = Math.sqrt(this.manualTargetPos.x ** 2 + this.manualTargetPos.z ** 2);
    const j2 = 0.35 + r * 0.4;
    const j3 = 0.75 + r * 0.3;
    const j4 = -0.3 - r * 0.2;

    this.arm.setJointAngles(j1, j2, j3, j4, 0);

    // Update carried workpiece position
    if (this.isPieceAttached) {
      const gripPos = new THREE.Vector3();
      this.arm.getGripperWorldPosition(gripPos);
      this.env.workpieceMesh.position.copy(gripPos);
      this.env.addTrajectoryPoint(gripPos);

      // Check proximity to target zone
      const distToTarget = gripPos.distanceTo(this.env.targetDropPos);
      this.env.setTargetHighlighted(distToTarget < 0.08);
    } else {
      // Check proximity to initial workpiece
      const gripPos = new THREE.Vector3();
      this.arm.getGripperWorldPosition(gripPos);
      this.env.addTrajectoryPoint(gripPos);

      const distToPiece = gripPos.distanceTo(this.env.initialPiecePos);
      const isAligned = distToPiece < 0.07;
      this.env.setWorkpieceHighlighted(isAligned);
      store.update((s) => {
        s.task.gripperAligned = isAligned;
        if (isAligned && s.task.step === 1) s.task.step = 2;
      });
    }
  }

  public manualLower() {
    const j1 = this.arm.baseJoint.rotation.y;
    const j2 = this.arm.shoulderJoint.rotation.x + 0.12;
    const j3 = this.arm.elbowJoint.rotation.x + 0.18;
    const j4 = this.arm.wristPitchJoint.rotation.x - 0.22;
    const ap = Math.abs(this.arm.jawLeft.position.x) * 2;
    this.animateJoints(j1, j2, j3, j4, 0, ap, 350);
  }

  public manualRaise() {
    const j1 = this.arm.baseJoint.rotation.y;
    const j2 = Math.max(0.35, this.arm.shoulderJoint.rotation.x - 0.12);
    const j3 = Math.max(0.65, this.arm.elbowJoint.rotation.x - 0.18);
    const j4 = this.arm.wristPitchJoint.rotation.x + 0.22;
    const ap = Math.abs(this.arm.jawLeft.position.x) * 2;
    this.animateJoints(j1, j2, j3, j4, 0, ap, 350);
  }

  public manualToggleGrip(): 'grasped' | 'placed' | 'dropped_recoverable' | 'opened_empty' {
    const isCurrentlyClosed = Math.abs(this.arm.jawLeft.position.x) * 2 < 0.06;

    if (!isCurrentlyClosed) {
      // Close Gripper Jaws
      this.arm.setGripperOpening(0.044);
      const gripPos = new THREE.Vector3();
      this.arm.getGripperWorldPosition(gripPos);
      const distToPiece = gripPos.distanceTo(this.env.workpieceMesh.position);

      if (distToPiece < 0.08) {
        this.isPieceAttached = true;
        store.update((s) => {
          s.task.clamped = true;
          s.task.step = 3;
        });
        return 'grasped';
      }
      return 'opened_empty';
    } else {
      // Open Gripper Jaws
      this.arm.setGripperOpening(0.084);
      if (this.isPieceAttached) {
        this.isPieceAttached = false;
        const gripPos = new THREE.Vector3();
        this.arm.getGripperWorldPosition(gripPos);
        const distToTarget = gripPos.distanceTo(this.env.targetDropPos);

        if (distToTarget < 0.09) {
          // Valid placement!
          this.env.workpieceMesh.position.copy(this.env.targetDropPos);
          this.env.triggerPlacementPulse();
          store.update((s) => {
            s.task.completed = true;
          });
          return 'placed';
        } else {
          // Misplaced drop — place object at valid supported position on table (recoverable!)
          this.env.workpieceMesh.position.set(
            Math.max(-0.35, Math.min(0.35, gripPos.x)),
            0.44, // Supported on table top
            Math.max(0.12, Math.min(0.35, gripPos.z))
          );
          this.env.setTargetHighlighted(false);
          return 'dropped_recoverable';
        }
      }
      return 'opened_empty';
    }
  }

  public resetTask() {
    this.autoDemoRunning = false;
    this.autoDemoPaused = false;
    clearTimeout(this.autoStepTimeout);
    this.activeJointAnim?.cancel();
    this.activeJointAnim = null;

    this.isPieceAttached = false;
    this.manualTargetPos.set(0.18, 0.44, 0.22);
    this.env.resetWorkpiece();

    this.arm.setJointAngles(0, 0.45, 0.85, -0.4, 0);
    this.arm.setGripperOpening(0.084);

    store.update((s) => {
      s.task.step = 1;
      s.task.gripperAligned = false;
      s.task.clamped = false;
      s.task.pieceMoved = false;
      s.task.completed = false;
      s.task.isPaused = false;
    });
  }

  private animateJoints(
    targetJ1: number,
    targetJ2: number,
    targetJ3: number,
    targetJ4: number,
    targetJ5: number,
    targetAperture: number,
    durationMs: number,
    callback?: () => void
  ) {
    const startJ1 = this.arm.baseJoint.rotation.y;
    const startJ2 = this.arm.shoulderJoint.rotation.x;
    const startJ3 = this.arm.elbowJoint.rotation.x;
    const startJ4 = this.arm.wristPitchJoint.rotation.x;
    const startJ5 = this.arm.wristRollJoint.rotation.y;
    const startAperture = Math.abs(this.arm.jawLeft.position.x) * 2;

    let startTime = performance.now();
    let elapsedBeforePause = 0;
    let isPaused = false;
    let isCancelled = false;
    let rId = 0;

    const step = (now: number) => {
      if (isCancelled) return;
      if (isPaused) return;

      const elapsed = now - startTime + elapsedBeforePause;
      const progress = Math.min(1, elapsed / durationMs);
      const ease = progress < 0.5 ? 2 * progress * progress : -1 + (4 - 2 * progress) * progress;

      const j1 = startJ1 + (targetJ1 - startJ1) * ease;
      const j2 = startJ2 + (targetJ2 - startJ2) * ease;
      const j3 = startJ3 + (targetJ3 - startJ3) * ease;
      const j4 = startJ4 + (targetJ4 - startJ4) * ease;
      const j5 = startJ5 + (targetJ5 - startJ5) * ease;
      const ap = startAperture + (targetAperture - startAperture) * ease;

      this.arm.setJointAngles(j1, j2, j3, j4, j5);
      this.arm.setGripperOpening(ap);

      const gripPos = new THREE.Vector3();
      this.arm.getGripperWorldPosition(gripPos);

      // Record trajectory path
      this.env.addTrajectoryPoint(gripPos);

      // If workpiece attached, lock position to gripper
      if (this.isPieceAttached) {
        this.env.workpieceMesh.position.copy(gripPos);
      }

      if (progress < 1) {
        rId = requestAnimationFrame(step);
      } else {
        this.activeJointAnim = null;
        callback?.();
      }
    };

    rId = requestAnimationFrame(step);

    this.activeJointAnim = {
      cancel: () => {
        isCancelled = true;
        cancelAnimationFrame(rId);
      },
      pause: () => {
        isPaused = true;
        elapsedBeforePause += performance.now() - startTime;
        cancelAnimationFrame(rId);
      },
      resume: () => {
        if (!isPaused) return;
        isPaused = false;
        startTime = performance.now();
        rId = requestAnimationFrame(step);
      },
    };
  }

  // ==========================================
  // MAIN RENDER LOOP
  // ==========================================
  private animate = () => {
    if (!this.isRunning) return;
    this.animationId = requestAnimationFrame(this.animate);

    // Pause rendering work if container is offscreen or hidden
    if (!this.isVisibleOnScreen) return;

    // Smooth camera preset interpolation when not user-dragging
    if (!this.isUserInteracting && !this.isPointerDown) {
      this.camera.position.lerp(this.desiredCamPos, 0.08);
      this.currentCamTarget.lerp(this.desiredCamTarget, 0.08);
      this.camera.lookAt(this.currentCamTarget);
    }

    // Keep workpiece attached if flagged
    if (this.isPieceAttached) {
      const gripPos = new THREE.Vector3();
      this.arm.getGripperWorldPosition(gripPos);
      this.env.workpieceMesh.position.copy(gripPos);
    }

    // Project 3D anchored HTML labels
    this.updateAnchoredLabels();

    if (this.renderer) {
      this.renderer.render(this.scene, this.camera);
    }
  };

  public destroy() {
    this.isRunning = false;
    cancelAnimationFrame(this.animationId);
    clearTimeout(this.userInteractionTimeout);
    clearTimeout(this.autoStepTimeout);
    this.activeJointAnim?.cancel();
    window.removeEventListener('resize', this.onResize);
    if (this.renderer && this.renderer.domElement) {
      this.renderer.domElement.remove();
      this.renderer.dispose();
    }
  }
}
