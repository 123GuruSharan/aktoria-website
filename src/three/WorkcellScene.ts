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
      pos: new THREE.Vector3(0, 1.65, 0.24),
      target: new THREE.Vector3(0, 0.4, 0.22),
    },
    detail: {
      pos: new THREE.Vector3(0.28, 0.62, 0.44),
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

  // Animation & Rendering
  private isRunning = true;
  private animationId = 0;
  private isWebglSupported = true;

  // Task Animation State Machine
  public isPieceAttached = false;
  private autoDemoRunning = false;

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

    // Add YAM Arm Model
    this.arm = new YAMArmModel();
    // Mount arm on workbench
    this.arm.group.position.set(0, 0.405, 0.15);
    this.scene.add(this.arm.group);

    // Studio Lighting
    this.setupLighting();

    // Event Listeners for Orbit Drag and Resize
    this.setupInteractions();

    // Start Rendering Loop
    if (this.isWebglSupported && this.renderer) {
      this.animate();
    }
  }

  private setupLighting() {
    // Ambient light
    const ambLight = new THREE.AmbientLight(0xfff6ea, 0.65);
    this.scene.add(ambLight);

    // Key directional light with soft shadow
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

    // Blue/cyan rim light for industrial depth
    const rimLight = new THREE.DirectionalLight(0x00e5ff, 0.5);
    rimLight.position.set(-1.8, 1.2, -1.0);
    this.scene.add(rimLight);

    // Orange accent workcell spotlight
    const orangeSpot = new THREE.SpotLight(0xff5000, 2.0, 4.0, Math.PI / 4, 0.3);
    orangeSpot.position.set(0, 2.0, 0.4);
    orangeSpot.target = this.env.tableGroup;
    this.scene.add(orangeSpot);
  }

  private setupInteractions() {
    window.addEventListener('resize', this.onResize);

    // Pointer events for orbit drag
    const dom = this.container;
    dom.addEventListener('pointerdown', (e) => {
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
      this.spherical.phi = Math.max(0.1, Math.min(Math.PI / 2 - 0.05, this.spherical.phi - dy * 0.006));
      offset.setFromSpherical(this.spherical);
      this.camera.position.copy(this.currentCamTarget).add(offset);
      this.camera.lookAt(this.currentCamTarget);

      this.desiredCamPos.copy(this.camera.position);
    });

    window.addEventListener('pointerup', () => {
      this.isPointerDown = false;
      this.userInteractionTimeout = window.setTimeout(() => {
        this.isUserInteracting = false;
      }, 4000);
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
    const curPreset = store.getState().selectedCamera;
    this.setCameraPreset(curPreset, false);
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
   * Project 3D objects to 2D HTML labels layer
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
      // Behind camera check
      if (p.z > 1) {
        element.style.opacity = '0';
        return;
      }
      element.style.opacity = '1';
      const x = (p.x * 0.5 + 0.5) * width;
      const y = (-(p.y * 0.5) + 0.5) * height;
      element.style.left = `${x}px`;
      element.style.top = `${y}px`;
    };

    projectToScreen(new THREE.Vector3(0, 0.65, 0.15), labelArm);
    projectToScreen(new THREE.Vector3(0.28, 0.38, 0.4), labelTable);
    const gripPos = new THREE.Vector3();
    this.arm.getGripperWorldPosition(gripPos);
    projectToScreen(gripPos, labelGripper);
    projectToScreen(this.env.workpieceMesh.position, labelPiece);
  }

  // ==========================================
  // KINEMATIC TASK ACTIONS (SCENE 05)
  // ==========================================

  public alignGripper(onComplete?: () => void) {
    // Kinematic target: pose arm over workpiece (j1 ~ -0.4, j2 ~ 0.55, j3 ~ 0.9, j4 ~ -0.45)
    this.animateJoints(-0.35, 0.52, 0.95, -0.47, 0, 0.084, 800, () => {
      store.update((s) => {
        s.task.gripperAligned = true;
        s.task.step = 2;
      });
      onComplete?.();
    });
  }

  public clampGripper(onComplete?: () => void) {
    // Lower slightly and clamp fingers onto workpiece (aperture 0.044m)
    this.animateJoints(-0.35, 0.58, 1.05, -0.63, 0, 0.044, 500, () => {
      this.isPieceAttached = true;
      store.update((s) => {
        s.task.clamped = true;
        s.task.step = 3;
      });
      onComplete?.();
    });
  }

  public moveToDestination(onComplete?: () => void) {
    // Raise arm in an arc and swing base over to target zone
    this.animateJoints(0.35, 0.52, 0.95, -0.47, 0, 0.044, 1200, () => {
      store.update((s) => {
        s.task.pieceMoved = true;
      });
      onComplete?.();
    });
  }

  public releaseWorkpiece(onComplete?: () => void) {
    // Lower slightly, open jaws, detach workpiece
    this.animateJoints(0.35, 0.58, 1.05, -0.63, 0, 0.084, 600, () => {
      this.isPieceAttached = false;
      this.env.workpieceMesh.position.copy(this.env.targetDropPos);
      store.update((s) => {
        s.task.completed = true;
      });
      // Move arm slightly up to clear
      this.animateJoints(0.35, 0.45, 0.85, -0.4, 0, 0.084, 500, () => {
        onComplete?.();
      });
    });
  }

  public runAutoDemo(onProgress?: (step: number) => void, onComplete?: () => void) {
    if (this.autoDemoRunning) return;
    this.autoDemoRunning = true;
    this.resetTask();

    onProgress?.(1);
    this.alignGripper(() => {
      setTimeout(() => {
        onProgress?.(2);
        this.clampGripper(() => {
          setTimeout(() => {
            onProgress?.(3);
            this.moveToDestination(() => {
              setTimeout(() => {
                this.releaseWorkpiece(() => {
                  this.autoDemoRunning = false;
                  onComplete?.();
                });
              }, 400);
            });
          }, 400);
        });
      }, 400);
    });
  }

  public resetTask() {
    this.isPieceAttached = false;
    this.env.resetWorkpiece();
    this.arm.setJointAngles(0, 0.45, 0.85, -0.4, 0);
    this.arm.setGripperOpening(0.084);
    store.update((s) => {
      s.task.step = 1;
      s.task.gripperAligned = false;
      s.task.clamped = false;
      s.task.pieceMoved = false;
      s.task.completed = false;
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

    const startTime = performance.now();

    const step = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / durationMs);
      // Smooth easeInOutQuad
      const ease = progress < 0.5 ? 2 * progress * progress : -1 + (4 - 2 * progress) * progress;

      const j1 = startJ1 + (targetJ1 - startJ1) * ease;
      const j2 = startJ2 + (targetJ2 - startJ2) * ease;
      const j3 = startJ3 + (targetJ3 - startJ3) * ease;
      const j4 = startJ4 + (targetJ4 - startJ4) * ease;
      const j5 = startJ5 + (targetJ5 - startJ5) * ease;
      const ap = startAperture + (targetAperture - startAperture) * ease;

      this.arm.setJointAngles(j1, j2, j3, j4, j5);
      this.arm.setGripperOpening(ap);

      // If workpiece is attached, lock its position to the gripper
      if (this.isPieceAttached) {
        const gripPos = new THREE.Vector3();
        this.arm.getGripperWorldPosition(gripPos);
        this.env.workpieceMesh.position.copy(gripPos);
      }

      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        callback?.();
      }
    };

    requestAnimationFrame(step);
  }

  // ==========================================
  // MAIN RENDER LOOP
  // ==========================================
  private animate = () => {
    if (!this.isRunning) return;
    this.animationId = requestAnimationFrame(this.animate);

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
    window.removeEventListener('resize', this.onResize);
    if (this.renderer && this.renderer.domElement) {
      this.renderer.domElement.remove();
      this.renderer.dispose();
    }
  }
}

