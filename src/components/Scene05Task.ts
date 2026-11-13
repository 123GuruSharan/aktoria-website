import { store, TaskMode } from '../store.ts';
import { WorkcellScene } from '../three/WorkcellScene.ts';
import { i18n } from '../i18n.ts';

export class Scene05Task {
  private workcellScene: WorkcellScene;
  private btnModeAuto: HTMLElement | null = null;
  private btnModeManual: HTMLElement | null = null;
  private btnReset: HTMLElement | null = null;
  private btnReplay: HTMLElement | null = null;

  // Manual Step Action Buttons
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
    this.btnReset = document.getElementById('btn-task-reset');
    this.btnReplay = document.getElementById('btn-task-replay');

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
    this.btnModeAuto?.addEventListener('click', () => {
      this.setMode('auto');
      this.playAutoDemo();
    });

    this.btnModeManual?.addEventListener('click', () => {
      this.setMode('manual');
      this.resetTask();
    });

    this.btnReset?.addEventListener('click', () => {
      this.resetTask();
    });

    this.btnReplay?.addEventListener('click', () => {
      this.playAutoDemo();
    });

    // Manual Step Actions (Tap-to-select and Tap-to-place)
    this.btnAlign?.addEventListener('click', () => {
      this.onManualAlign();
    });

    this.btnPinch?.addEventListener('click', () => {
      this.onManualPinch();
    });

    this.btnMove?.addEventListener('click', () => {
      this.onManualMove();
    });

    this.btnRelease?.addEventListener('click', () => {
      this.onManualRelease();
    });
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
  }

  public playAutoDemo() {
    if (this.completionBanner) this.completionBanner.hidden = true;
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
    // Notify underline in scene 6
    const underline = document.getElementById('contact-underline-path');
    if (underline) {
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

