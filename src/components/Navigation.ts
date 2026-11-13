import { i18n } from '../i18n.ts';
import { store } from '../store.ts';

export class Navigation {
  private menuToggleBtn: HTMLButtonElement | null = null;
  private menuCloseBtn: HTMLButtonElement | null = null;
  private menuDialog: HTMLElement | null = null;
  private lastFocusedElement: HTMLElement | null = null;
  private chapterDots: NodeListOf<HTMLButtonElement> | null = null;

  constructor() {
    this.menuToggleBtn = document.getElementById('menu-toggle') as HTMLButtonElement | null;
    this.menuCloseBtn = document.getElementById('menu-close') as HTMLButtonElement | null;
    this.menuDialog = document.getElementById('fullscreen-menu');
    this.chapterDots = document.querySelectorAll('.chapter-dot');

    this.bindEvents();
    this.initScrollSpy();
  }

  private bindEvents() {
    // Menu Toggle
    this.menuToggleBtn?.addEventListener('click', () => this.openMenu());
    this.menuCloseBtn?.addEventListener('click', () => this.closeMenu());

    // Close on backdrop click
    this.menuDialog?.querySelector('.menu-backdrop')?.addEventListener('click', () => this.closeMenu());

    // Keyboard support: Escape closes menu, focus trap
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isMenuOpen()) {
        this.closeMenu();
      }
    });

    // Menu Card Navigation
    document.querySelectorAll('.menu-card').forEach((card) => {
      card.addEventListener('click', (e) => {
        const targetId = (e.currentTarget as HTMLElement).getAttribute('data-jump');
        if (targetId) {
          this.closeMenu();
          const targetEl = document.getElementById(targetId);
          if (targetEl) {
            targetEl.scrollIntoView({ behavior: 'smooth' });
          }
        }
      });
    });

    // Chapter Dot Navigation
    this.chapterDots?.forEach((dot) => {
      dot.addEventListener('click', () => {
        const targetId = dot.getAttribute('data-target');
        if (targetId) {
          const targetEl = document.getElementById(targetId);
          if (targetEl) {
            targetEl.scrollIntoView({ behavior: 'smooth' });
          }
        }
      });
    });

    // Language buttons
    document.querySelectorAll('[data-lang]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const lang = btn.getAttribute('data-lang') as 'en' | 'es';
        if (lang) {
          i18n.setLocale(lang);
        }
      });
    });
  }

  public isMenuOpen(): boolean {
    return this.menuDialog ? !this.menuDialog.hidden : false;
  }

  public openMenu() {
    if (!this.menuDialog) return;
    this.lastFocusedElement = document.activeElement as HTMLElement;
    this.menuDialog.hidden = false;
    this.menuToggleBtn?.setAttribute('aria-expanded', 'true');
    this.menuCloseBtn?.focus();
    document.body.style.overflow = 'hidden';
  }

  public closeMenu() {
    if (!this.menuDialog) return;
    this.menuDialog.hidden = true;
    this.menuToggleBtn?.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
    this.lastFocusedElement?.focus();
  }

  private initScrollSpy() {
    const sections = document.querySelectorAll<HTMLElement>('.scene-section');
    if (!sections.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.35) {
            const id = entry.target.id;
            store.update((s) => {
              s.currentScene = id;
            });
            this.updateActiveChapter(id);
          }
        });
      },
      { threshold: [0.35, 0.6] }
    );

    sections.forEach((s) => observer.observe(s));
  }

  private updateActiveChapter(sceneId: string) {
    this.chapterDots?.forEach((dot) => {
      const isCurrent = dot.getAttribute('data-target') === sceneId;
      dot.classList.toggle('active', isCurrent);
      dot.setAttribute('aria-selected', isCurrent ? 'true' : 'false');
    });
  }
}

