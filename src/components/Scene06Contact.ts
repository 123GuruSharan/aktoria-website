import { store } from '../store.ts';

export class Scene06Contact {
  private btnOpenDeployment: HTMLElement | null = null;
  private modalEl: HTMLElement | null = null;
  private modalCloseBtn: HTMLElement | null = null;
  private formEl: HTMLFormElement | null = null;
  private successBanner: HTMLElement | null = null;
  private underlinePath: SVGPathElement | null = null;

  constructor() {
    this.btnOpenDeployment = document.getElementById('btn-open-deployment');
    this.modalEl = document.getElementById('deployment-modal');
    this.modalCloseBtn = document.getElementById('modal-close');
    this.formEl = document.getElementById('deployment-form') as HTMLFormElement | null;
    this.successBanner = document.getElementById('form-success-banner');
    this.underlinePath = document.getElementById('contact-underline-path') as unknown as SVGPathElement | null;

    this.bindEvents();
    this.syncRouteInModal();
  }

  private bindEvents() {
    this.btnOpenDeployment?.addEventListener('click', () => this.openModal());
    this.modalCloseBtn?.addEventListener('click', () => this.closeModal());
    this.modalEl?.querySelector('.modal-backdrop')?.addEventListener('click', () => this.closeModal());

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.modalEl && !this.modalEl.hidden) {
        this.closeModal();
      }
    });

    this.formEl?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleFormSubmit();
    });

    // Sync year
    const yrEl = document.getElementById('current-year');
    if (yrEl) yrEl.textContent = new Date().getFullYear().toString();
  }

  public openModal() {
    if (!this.modalEl) return;
    this.syncRouteInModal();
    this.modalEl.hidden = false;
    document.body.style.overflow = 'hidden';
    const firstInput = this.modalEl.querySelector('input') as HTMLInputElement | null;
    firstInput?.focus();
  }

  public closeModal() {
    if (!this.modalEl) return;
    this.modalEl.hidden = true;
    document.body.style.overflow = '';
    this.btnOpenDeployment?.focus();
  }

  private syncRouteInModal() {
    const routeSelect = document.getElementById('form-route') as HTMLSelectElement | null;
    if (routeSelect) {
      const cur = store.getState().selectedRoute;
      routeSelect.value = cur === 'india' ? 'ind-ind' : 'ind-mex';
    }
  }

  private handleFormSubmit() {
    if (this.formEl && this.successBanner) {
      this.formEl.hidden = true;
      this.successBanner.hidden = false;
      setTimeout(() => {
        this.closeModal();
        setTimeout(() => {
          this.formEl!.hidden = false;
          this.formEl!.reset();
          this.successBanner!.hidden = true;
        }, 500);
      }, 3500);
    }
  }

  /**
   * Called to update the continuous underline based on the task trajectory
   */
  public updateUnderlineFromTrace(tracePoints: Array<{ x: number; y: number }>) {
    if (!this.underlinePath || tracePoints.length < 2) return;
    // Map points to SVG coordinate box (800 x 24)
    const minX = Math.min(...tracePoints.map((p) => p.x));
    const maxX = Math.max(...tracePoints.map((p) => p.x));
    const rangeX = maxX - minX || 1;

    const d = tracePoints
      .map((p, i) => {
        const sx = ((p.x - minX) / rangeX) * 800;
        const sy = 12 + (p.y / 60) * 8;
        return `${i === 0 ? 'M' : 'L'} ${sx.toFixed(1)} ${sy.toFixed(1)}`;
      })
      .join(' ');

    this.underlinePath.setAttribute('d', d);
  }
}

