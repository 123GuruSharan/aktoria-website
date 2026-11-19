import { store, CameraPreset } from '../store.ts';
import { WorkcellScene } from '../three/WorkcellScene.ts';
import { i18n } from '../i18n.ts';

export class Scene04Workspace {
  private workcellScene: WorkcellScene;
  private objectSheet: HTMLElement | null = null;
  private sheetTitle: HTMLElement | null = null;
  private sheetTag: HTMLElement | null = null;
  private sheetBody: HTMLElement | null = null;
  private btnExploreView: HTMLElement | null = null;
  private exploreViewLabel: HTMLElement | null = null;
  private lastFocusedTrigger: HTMLElement | null = null;

  constructor(workcellScene: WorkcellScene) {
    this.workcellScene = workcellScene;
    this.objectSheet = document.getElementById('object-sheet');
    this.sheetTitle = document.getElementById('sheet-object-title');
    this.sheetTag = document.getElementById('sheet-object-tag');
    this.sheetBody = document.getElementById('sheet-object-body');
    this.btnExploreView = document.getElementById('btn-explore-view');
    this.exploreViewLabel = document.getElementById('explore-view-label');

    this.bindEvents();
  }

  private bindEvents() {
    // Camera Presets
    document.querySelectorAll('.preset-btn[data-preset]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const preset = (e.currentTarget as HTMLElement).getAttribute('data-preset') as CameraPreset;
        if (preset) {
          this.setCamera(preset);
        }
      });
    });

    // Reset View Button
    document.getElementById('btn-cam-reset')?.addEventListener('click', () => {
      this.workcellScene.resetCameraView();
    });

    // Explicit "Explore view" Button (prevents touch scroll conflicts on mobile)
    this.btnExploreView?.addEventListener('click', () => {
      const isCurrentlyActive = store.getState().exploreViewActive;
      const nextActive = !isCurrentlyActive;
      store.update((s) => {
        s.exploreViewActive = nextActive;
      });

      this.btnExploreView?.classList.toggle('active', nextActive);
      this.btnExploreView?.setAttribute('aria-pressed', nextActive ? 'true' : 'false');
      if (this.exploreViewLabel) {
        this.exploreViewLabel.textContent = nextActive
          ? i18n.t('workcell.exitExplore')
          : i18n.t('workcell.exploreView');
      }

      const canvasWrapper = document.getElementById('three-canvas-wrapper');
      if (canvasWrapper) {
        canvasWrapper.classList.toggle('explore-active', nextActive);
      }
    });

    // Workspace Layers Toggles
    const toggleLayers = [
      { id: 'toggle-layer-labels', layer: 'labels' as const },
      { id: 'toggle-layer-grid', layer: 'grid' as const },
      { id: 'toggle-layer-path', layer: 'path' as const },
    ];

    toggleLayers.forEach(({ id, layer }) => {
      const btn = document.getElementById(id);
      btn?.addEventListener('click', () => {
        const currentVal = store.getState().layers[layer];
        const nextVal = !currentVal;
        store.update((s) => {
          s.layers[layer] = nextVal;
        });
        btn.classList.toggle('active', nextVal);
        btn.setAttribute('aria-pressed', nextVal ? 'true' : 'false');
        this.workcellScene.setLayerVisible(layer, nextVal);
      });
    });

    // Anchored 3D Label Clicks
    document.querySelectorAll('.anchor-label').forEach((labelBtn) => {
      labelBtn.addEventListener('click', (e) => {
        const currentTarget = e.currentTarget as HTMLElement;
        this.lastFocusedTrigger = currentTarget;
        const targetObj = currentTarget.getAttribute('data-target-object');
        if (targetObj) {
          this.openObjectExplanation(targetObj);
        }
      });
    });

    // Close Object Sheet
    document.getElementById('sheet-close-btn')?.addEventListener('click', () => {
      this.closeObjectExplanation();
    });

    // Escape Key support for Object Sheet
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.objectSheet && !this.objectSheet.hidden) {
        this.closeObjectExplanation();
      }
    });

    // Update explanation sheet on language change
    i18n.onLocaleChange(() => {
      const currentTarget = this.objectSheet?.getAttribute('data-active-target');
      if (currentTarget) {
        this.openObjectExplanation(currentTarget);
      }
      if (this.exploreViewLabel) {
        const isExp = store.getState().exploreViewActive;
        this.exploreViewLabel.textContent = isExp
          ? i18n.t('workcell.exitExplore')
          : i18n.t('workcell.exploreView');
      }
    });
  }

  public setCamera(preset: CameraPreset) {
    store.update((s) => {
      s.selectedCamera = preset;
    });

    document.querySelectorAll('.preset-btn[data-preset]').forEach((btn) => {
      const isActive = btn.getAttribute('data-preset') === preset;
      btn.classList.toggle('active', isActive);
      btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    });

    this.workcellScene.setCameraPreset(preset, false);
  }

  public openObjectExplanation(target: string) {
    if (!this.objectSheet) return;
    this.objectSheet.setAttribute('data-active-target', target);
    this.objectSheet.hidden = false;
    this.objectSheet.classList.add('visible');

    if (this.sheetTag) this.sheetTag.textContent = i18n.t(`sheet.${target}.tag`);
    if (this.sheetTitle) this.sheetTitle.textContent = i18n.t(`sheet.${target}.title`);
    if (this.sheetBody) this.sheetBody.textContent = i18n.t(`sheet.${target}.desc`);

    // Focus the close button for accessibility
    const closeBtn = document.getElementById('sheet-close-btn');
    closeBtn?.focus();
  }

  public closeObjectExplanation() {
    if (!this.objectSheet) return;
    this.objectSheet.classList.remove('visible');
    this.objectSheet.hidden = true;

    // Restore focus to triggering button
    if (this.lastFocusedTrigger) {
      this.lastFocusedTrigger.focus();
      this.lastFocusedTrigger = null;
    }
  }
}
