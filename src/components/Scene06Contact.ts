import { store } from '../store.ts';
import { i18n } from '../i18n.ts';

export class Scene06Contact {
  private btnOpenDeployment: HTMLElement | null = null;
  private modalEl: HTMLElement | null = null;
  private modalCloseBtn: HTMLElement | null = null;

  // Modal Form
  private formModalEl: HTMLFormElement | null = null;
  private modalSuccessBanner: HTMLElement | null = null;
  private btnModalSubmit: HTMLButtonElement | null = null;

  // Inline Form (staggered reveal)
  private formInlineEl: HTMLFormElement | null = null;
  private inlineSuccessBanner: HTMLElement | null = null;
  private btnInlineSubmit: HTMLButtonElement | null = null;

  // SVG Underline
  private underlinePath: SVGPathElement | null = null;

  constructor() {
    this.btnOpenDeployment = document.getElementById('btn-open-deployment');
    this.modalEl = document.getElementById('deployment-modal');
    this.modalCloseBtn = document.getElementById('modal-close');

    this.formModalEl = document.getElementById('deployment-form') as HTMLFormElement | null;
    this.modalSuccessBanner = document.getElementById('form-success-banner');
    this.btnModalSubmit = document.getElementById('btn-modal-submit') as HTMLButtonElement | null;

    this.formInlineEl = document.getElementById('contact-inline-form') as HTMLFormElement | null;
    this.inlineSuccessBanner = document.getElementById('inline-success-banner');
    this.btnInlineSubmit = document.getElementById('btn-inline-submit') as HTMLButtonElement | null;

    this.underlinePath = document.getElementById('contact-underline-path') as unknown as SVGPathElement | null;

    this.bindEvents();
    this.syncRoutes();
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

    // Handle Inline Form Submission
    this.formInlineEl?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleFormSubmit(this.formInlineEl, this.inlineSuccessBanner, this.btnInlineSubmit);
    });

    // Handle Modal Form Submission
    this.formModalEl?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleFormSubmit(this.formModalEl, this.modalSuccessBanner, this.btnModalSubmit, true);
    });

    // Sync year in footer
    const yrEl = document.getElementById('current-year');
    if (yrEl) yrEl.textContent = new Date().getFullYear().toString();
  }

  public openModal() {
    if (!this.modalEl) return;
    this.syncRoutes();
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

  private syncRoutes() {
    const cur = store.getState().selectedRoute;
    const val = cur === 'india' ? 'ind-ind' : 'ind-mex';

    const routeModal = document.getElementById('form-route') as HTMLSelectElement | null;
    if (routeModal) routeModal.value = val;

    const routeInline = document.getElementById('contact-route') as HTMLSelectElement | null;
    if (routeInline) routeInline.value = val;
  }

  private handleFormSubmit(
    form: HTMLFormElement | null,
    banner: HTMLElement | null,
    submitBtn: HTMLButtonElement | null,
    isModal = false
  ) {
    if (!form || !banner) return;

    // Validate required fields
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    // Display sending state
    const originalText = submitBtn?.innerHTML || '';
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = `<span>${i18n.t('modal.submitting') || 'Transmitting...'}</span>`;
    }

    // Simulate verified dispatch to contact@aktoria.com endpoint
    window.setTimeout(() => {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
      }

      form.hidden = true;
      banner.hidden = false;

      if (isModal) {
        window.setTimeout(() => {
          this.closeModal();
          window.setTimeout(() => {
            form.hidden = false;
            form.reset();
            banner.hidden = true;
          }, 400);
        }, 3200);
      }
    }, 700);
  }

  /**
   * Called to update the continuous underline based on the task trajectory
   */
  public updateUnderlineFromTrace(tracePoints: Array<{ x: number; y: number }>) {
    if (!this.underlinePath || tracePoints.length < 2) return;
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
