import { store, CameraPreset } from '../store.ts';
import { WorkcellScene } from '../three/WorkcellScene.ts';
import { i18n } from '../i18n.ts';

export class Scene04Workspace {
  private workcellScene: WorkcellScene;
  private objectSheet: HTMLElement | null = null;
  private sheetTitle: HTMLElement | null = null;
  private sheetTag: HTMLElement | null = null;
  private sheetBody: HTMLElement | null = null;

  constructor(workcellScene: WorkcellScene) {
    this.workcellScene = workcellScene;
    this.objectSheet = document.getElementById('object-sheet');
    this.sheetTitle = document.getElementById('sheet-object-title');
    this.sheetTag = document.getElementById('sheet-object-tag');
    this.sheetBody = document.getElementById('sheet-object-body');

    this.bindEvents();
  }

  private bindEvents() {
    // Camera Presets
    document.querySelectorAll('.preset-btn').forEach((btn) => {
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
        const targetObj = (e.currentTarget as HTMLElement).getAttribute('data-target-object');
        if (targetObj) {
          this.openObjectExplanation(targetObj);
        }
      });
    });

    // Close Object Sheet
    document.getElementById('sheet-close-btn')?.addEventListener('click', () => {
      if (this.objectSheet) this.objectSheet.hidden = true;
    });

    // Update explanation sheet on language change
    i18n.onLocaleChange(() => {
      const currentTarget = this.objectSheet?.getAttribute('data-active-target');
      if (currentTarget) {
        this.openObjectExplanation(currentTarget);
      }
    });
  }

  public setCamera(preset: CameraPreset) {
    store.update((s) => {
      s.selectedCamera = preset;
    });

    document.querySelectorAll('.preset-btn').forEach((btn) => {
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

    if (this.sheetTag) this.sheetTag.textContent = i18n.t(`sheet.${target}.tag`);
    if (this.sheetTitle) this.sheetTitle.textContent = i18n.t(`sheet.${target}.title`);
    if (this.sheetBody) this.sheetBody.textContent = i18n.t(`sheet.${target}.desc`);
  }
}

