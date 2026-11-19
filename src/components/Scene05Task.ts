import { store, TaskMode } from '../store.ts';
import { WorkcellScene } from '../three/WorkcellScene.ts';
import { i18n } from '../i18n.ts';

export class Scene05Task {
  private workcellScene: WorkcellScene;
  private btnModeAuto: HTMLElement | null = null;
  private btnModeManual: HTMLElement | null = null;
  private btnPause: HTMLElement | null = null;
  private taskPauseLabel: HTMLElement | null = null;
  private btnReset: HTMLElement | null = null;
  private btnReplay: HTMLElement | null = null;

  // Direct manual action buttons
  private btnLower: HTMLButtonElement | null = null;
  private btnRaise: HTMLButtonElement | null = null;
  private btnGrip: HTMLButtonElement | null = null;

  // Step Action Buttons
  private btnAlign: HTMLButtonElement | null = null;
  private btnPinch: HTMLButtonElement | null = null;
  private btnMove: HTMLButtonElement | null = null;
  private btnRelease: HTMLButtonElement | null = null;

  // Step cards
  private stepCards: NodeListOf<HTMLElement> | null = null;
  private manualHintText: HTMLElement | null = null;
  private completionBanner: HTMLElement | null = null;

  constructor(workcellScene: WorkcellScene) {
    this.workcellScene = workcellScene;

    this.btnModeAuto = document.getElementById('btn-mode-auto');
    this.btnModeManual = document.getElementById('btn-mode-manual');
    this.btnPause = document.getElementById('btn-task-pause');
    this.taskPauseLabel = document.getElementById('task-pause-label');
    this.btnReset = document.getElementById('btn-task-reset');
    this.btnReplay = document.getElementById('btn-task-replay');

    this.btnLower = document.getElementById('btn-task-lower') as HTMLButtonElement | null;
    this.btnRaise = document.getElementById('btn-task-raise') as HTMLButtonElement | null;
    this.btnGrip = document.getElementById('btn-task-grip') as HTMLButtonElement | null;

    this.btnAlign = document.getElementById('btn-task-align') as HTMLButtonElement | null;
    this.btnPinch = document.getElementById('btn-task-pinch') as HTMLButtonElement | null;
    this.btnMove = document.getElementById('btn-task-move') as HTMLButtonElement | null;
    this.btnRelease = document.getElementById('btn-task-release') as HTMLButtonElement | null;

    this.stepCards = document.querySelectorAll('.step-card');
    this.manualHintText = document.getElementById('manual-hint-text');
    this.completionBanner = document.getElementById('task-completion-banner');

    this.bindEvents();
    this.setMode('auto');
  }

  private bindEvents() {
    // Mode Switching
    this.btnModeAuto?.addEventListener('click', () => {
      this.setMode('auto');
      this.playAutoDemo();
    });

    this.btnModeManual?.addEventListener('click', () => {
      this.setMode('manual');
      this.resetTask();
    });

    // Pause / Resume for Automatic Demo
    this.btnPause?.addEventListener('click', () => {
      const isPaused = this.workcellScene.togglePauseDemo();
      if (this.taskPauseLabel) {
        this.taskPauseLabel.textContent = isPaused ? i18n.t('task.resume') : i18n.t('task.pause');
      }
      this.btnPause?.classList.toggle('active', isPaused);
    });

    // Reset & Replay
    this.btnReset?.addEventListener('click', () => {
      this.resetTask();
    });

    this.btnReplay?.addEventListener('click', () => {
      this.playAutoDemo();
    });

    // Direct Manual Action Buttons (Lower, Raise, Grip/Release)
    this.btnLower?.addEventListener('click', () => {
      this.workcellScene.manualLower();
    });

    this.btnRaise?.addEventListener('click', () => {
      this.workcellScene.manualRaise();
    });

    this.btnGrip?.addEventListener('click', () => {
      const result = this.workcellScene.manualToggleGrip();
      if (result === 'placed') {
        this.onTaskCompleted();
      } else if (result === 'grasped') {
        if (this.manualHintText) {
          this.manualHintText.textContent = i18n.t('task.manualHint3');
        }
      } else if (result === 'dropped_recoverable') {
        if (this.manualHintText) {
          this.manualHintText.textContent = i18n.t('task.misplaced');
        }
      }
    });

    // Step-by-Step Buttons (for backwards-compatibility and guidance)
    this.btnAlign?.addEventListener('click', () => this.onManualAlign());
    this.btnPinch?.addEventListener('click', () => this.onManualPinch());
    this.btnMove?.addEventListener('click', () => this.onManualMove());
    this.btnRelease?.addEventListener('click', () => this.onManualRelease());

    // Keyboard Navigation for Simulation Controls
    window.addEventListener('keydown', (e) => {
      // Only process when in manual mode or canvas/dock focused
      if (store.getState().task.mode !== 'manual') return;

      const stepSize = 0.02;
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        this.workcellScene.manualMovePlanar(-stepSize, 0);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        this.workcellScene.manualMovePlanar(stepSize, 0);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        this.workcellScene.manualMovePlanar(0, -stepSize);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        this.workcellScene.manualMovePlanar(0, stepSize);
      } else if (e.key === 'PageDown' || e.code === 'KeyS') {
        this.workcellScene.manualLower();
      } else if (e.key === 'PageUp' || e.code === 'KeyW') {
        this.workcellScene.manualRaise();
      } else if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        const res = this.workcellScene.manualToggleGrip();
        if (res === 'placed') this.onTaskCompleted();
        else if (res === 'dropped_recoverable' && this.manualHintText) {
          this.manualHintText.textContent = i18n.t('task.misplaced');
        }
      }
    });

    // Scroll Transition into Chapter 05: Moves camera closer
    const scene05 = document.getElementById('scene-05');
    if (scene05) {
      window.addEventListener('scroll', () => {
        const rect = scene05.getBoundingClientRect();
        const windowH = window.innerHeight;
        if (rect.top <= windowH * 0.5 && rect.bottom >= windowH * 0.2) {
          this.workcellScene.setCameraCloserForTask();
        }
      }, { passive: true });
    }
  }

  public setMode(mode: TaskMode) {
    store.update((s) => {
      s.task.mode = mode;
    });

    this.btnModeAuto?.classList.toggle('active', mode === 'auto');
    this.btnModeAuto?.setAttribute('aria-selected', mode === 'auto' ? 'true' : 'false');

    this.btnModeManual?.classList.toggle('active', mode === 'manual');
    this.btnModeManual?.setAttribute('aria-selected', mode === 'manual' ? 'true' : 'false');

    const dock = document.getElementById('manual-control-dock');
    if (dock) {
      dock.style.opacity = mode === 'manual' ? '1' : '0.6';
    }

    if (this.btnPause) {
      this.btnPause.style.display = mode === 'auto' ? 'inline-flex' : 'none';
    }
  }

  public playAutoDemo() {
    if (this.completionBanner) this.completionBanner.hidden = true;
    if (this.taskPauseLabel) this.taskPauseLabel.textContent = i18n.t('task.pause');
    this.btnPause?.classList.remove('active');
    this.updateActiveStepCard(1);

    this.workcellScene.runAutoDemo(
      (step) => {
        this.updateActiveStepCard(step);
      },
      () => {
        this.onTaskCompleted();
      }
    );
  }

  public resetTask() {
    this.workcellScene.resetTask();
    if (this.completionBanner) this.completionBanner.hidden = true;
    if (this.taskPauseLabel) this.taskPauseLabel.textContent = i18n.t('task.pause');
    this.btnPause?.classList.remove('active');
    this.updateActiveStepCard(1);

    if (this.btnAlign) this.btnAlign.disabled = false;
    if (this.btnPinch) this.btnPinch.disabled = true;
    if (this.btnMove) this.btnMove.disabled = true;
    if (this.btnRelease) this.btnRelease.disabled = true;

    if (this.manualHintText) {
      this.manualHintText.textContent = i18n.t('task.manualHint1');
    }
  }

  private onManualAlign() {
    if (this.btnAlign) this.btnAlign.disabled = true;
    this.workcellScene.alignGripper(() => {
      this.updateActiveStepCard(2);
      if (this.btnPinch) this.btnPinch.disabled = false;
      if (this.manualHintText) {
        this.manualHintText.textContent = i18n.t('task.manualHint2');
      }
    });
  }

  private onManualPinch() {
    if (this.btnPinch) this.btnPinch.disabled = true;
    this.workcellScene.clampGripper(() => {
      this.updateActiveStepCard(3);
      if (this.btnMove) this.btnMove.disabled = false;
      if (this.manualHintText) {
        this.manualHintText.textContent = i18n.t('task.manualHint3');
      }
    });
  }

  private onManualMove() {
    if (this.btnMove) this.btnMove.disabled = true;
    this.workcellScene.moveToDestination(() => {
      if (this.btnRelease) this.btnRelease.disabled = false;
      if (this.manualHintText) {
        this.manualHintText.textContent = i18n.t('task.manualHint4');
      }
    });
  }

  private onManualRelease() {
    if (this.btnRelease) this.btnRelease.disabled = true;
    this.workcellScene.releaseWorkpiece(() => {
      this.onTaskCompleted();
    });
  }

  private onTaskCompleted() {
    if (this.completionBanner) this.completionBanner.hidden = false;

    // Connect recorded 3D trajectory to Scene 06 headline continuous underline
    const points = this.workcellScene.env.getTrajectoryPoints();
    const underline = document.getElementById('contact-underline-path');
    if (underline && points.length > 2) {
      const minX = Math.min(...points.map((p) => p.x));
      const maxX = Math.max(...points.map((p) => p.x));
      const rangeX = maxX - minX || 1;

      const d = points
        .map((p, i) => {
          const sx = ((p.x - minX) / rangeX) * 800;
          const sy = 12 + (p.y - 0.44) * 40;
          return `${i === 0 ? 'M' : 'L'} ${sx.toFixed(1)} ${sy.toFixed(1)}`;
        })
        .join(' ');

      underline.setAttribute('d', d);
      underline.style.strokeDasharray = 'none';
      underline.style.stroke = '#FF5000';
    }
  }

  private updateActiveStepCard(step: number) {
    this.stepCards?.forEach((card) => {
      const cardStep = parseInt(card.getAttribute('data-step') || '1', 10);
      const isActive = cardStep === step;
      card.classList.toggle('active', isActive);

      const stateEl = card.querySelector('.step-state');
      if (stateEl) {
        if (cardStep < step) {
          stateEl.textContent = '✓ DONE';
        } else if (cardStep === step) {
          stateEl.textContent = '• ACTIVE';
        } else {
          stateEl.textContent = '• WAITING';
        }
      }
    });
  }
}
