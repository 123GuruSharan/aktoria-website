import { store } from '../store.ts';
import { i18n } from '../i18n.ts';

export class Scene02Inspection {
  private stageEl: HTMLElement | null = null;
  private dividerEl: HTMLElement | null = null;
  private photoLayerEl: HTMLElement | null = null;
  private outlineLayerEl: HTMLElement | null = null;
  private viewportEl: HTMLElement | null = null;
  private leaderGroup: SVGGElement | null = null;
  private leaderPolyline: SVGPolylineElement | null = null;
  private anchorDot: SVGCircleElement | null = null;
  private leaderText: SVGTextElement | null = null;

  private isDraggingDivider = false;
  private userHasDragged = false;
  private splitPercent = 50;
  private currentPart: 'base' | 'elbow' | 'gripper' | null = null;

  // Component coordinates in 1024 x 682 image space
  private readonly partAnchors: Record<
    'base' | 'elbow' | 'gripper',
    { anchor: [number, number]; points: string; textPos: [number, number]; key: string }
  > = {
    gripper: {
      anchor: [200, 447],
      points: '200,447 157,393 117,393',
      textPos: [110, 397],
      key: 'inspect.spotGripper',
    },
    elbow: {
      anchor: [711, 107],
      points: '711,107 653,57 607,57',
      textPos: [600, 61],
      key: 'inspect.spotElbow',
    },
    base: {
      anchor: [843, 520],
      points: '843,520 780,593 727,593',
      textPos: [720, 597],
      key: 'inspect.spotBase',
    },
  };

  constructor() {
    this.stageEl = document.getElementById('inspect-graphite-stage');
    this.dividerEl = document.getElementById('inspect-divider');
    this.photoLayerEl = document.getElementById('layer-photo');
    this.outlineLayerEl = document.getElementById('layer-outline');
    this.viewportEl = document.getElementById('inspect-viewport');
    this.leaderGroup = document.getElementById('hotspot-leader-group') as unknown as SVGGElement | null;
    this.leaderPolyline = document.getElementById('hotspot-leader-polyline') as unknown as SVGPolylineElement | null;
    this.anchorDot = document.getElementById('hotspot-anchor-dot') as unknown as SVGCircleElement | null;
    this.leaderText = document.getElementById('hotspot-leader-text') as unknown as SVGTextElement | null;

    this.bindEvents();
    // Start at 50% split with no part selected (clean full-arm view)
    this.setSplitRatio(0.5);
    this.initScrollTransition();
  }

  private bindEvents() {
    // -------------------------------------------------------------------------
    // 1. Draggable Split Divider (Mouse & Touch)
    // -------------------------------------------------------------------------
    if (this.dividerEl && this.viewportEl) {
      this.dividerEl.addEventListener('pointerdown', (e) => {
        this.isDraggingDivider = true;
        this.userHasDragged = true;
        this.dividerEl?.classList.add('dragging');
        this.dividerEl?.setPointerCapture(e.pointerId);
      });

      this.viewportEl.addEventListener('pointermove', (e) => {
        if (!this.isDraggingDivider || !this.viewportEl) return;
        const rect = this.viewportEl.getBoundingClientRect();
        const rawX = e.clientX - rect.left;
        const ratio = Math.max(0, Math.min(1, rawX / rect.width));
        this.setSplitRatio(ratio);
      });

      const onPointerUp = (e: PointerEvent) => {
        if (!this.isDraggingDivider) return;
        this.isDraggingDivider = false;
        this.dividerEl?.classList.remove('dragging');
        try {
          this.dividerEl?.releasePointerCapture(e.pointerId);
        } catch {
          // ignore
        }
      };

      this.dividerEl.addEventListener('pointerup', onPointerUp);
      this.dividerEl.addEventListener('pointercancel', onPointerUp);
    }

    // -------------------------------------------------------------------------
    // 2. Keyboard Arrow Keys (Left / Right / Home / End)
    // -------------------------------------------------------------------------
    this.dividerEl?.addEventListener('keydown', (e) => {
      const step = e.shiftKey ? 1 : 4;
      if (e.key === 'ArrowLeft') {
        this.userHasDragged = true;
        this.setSplitRatio(Math.max(0, (this.splitPercent - step) / 100));
        e.preventDefault();
      } else if (e.key === 'ArrowRight') {
        this.userHasDragged = true;
        this.setSplitRatio(Math.min(1, (this.splitPercent + step) / 100));
        e.preventDefault();
      } else if (e.key === 'Home') {
        this.userHasDragged = true;
        this.setSplitRatio(0);
        e.preventDefault();
      } else if (e.key === 'End') {
        this.userHasDragged = true;
        this.setSplitRatio(1);
        e.preventDefault();
      }
    });

    // -------------------------------------------------------------------------
    // 3. Part Selection Tabs [ Base ] [ Elbow ] [ Gripper ]
    // -------------------------------------------------------------------------
    document.querySelectorAll('.part-tab, .hotspot-tab').forEach((tab) => {
      tab.addEventListener('click', (e) => {
        const el = e.currentTarget as HTMLElement;
        let part = (el.getAttribute('data-part') || el.getAttribute('data-spot')) as 'base' | 'elbow' | 'gripper' | 'arm';
        if (part === 'arm') part = 'elbow';
        if (part && (part === 'base' || part === 'elbow' || part === 'gripper')) {
          this.selectPart(part);
        }
      });
    });

    // -------------------------------------------------------------------------
    // 4. Internationalization Locale Changes
    // -------------------------------------------------------------------------
    i18n.onLocaleChange(() => {
      if (this.currentPart) {
        this.updateLeaderDisplay(this.currentPart);
      }
    });
  }

  /**
   * Sets the split reveal position between 0 and 1.
   * Updates CSS variable --split on the comparison stage.
   * At 0%: 100% outline visible.
   * At 100%: 100% photo visible.
   * At 50%: left 50% photo, right 50% outline.
   */
  public setSplitRatio(ratio: number) {
    this.splitPercent = Math.max(0, Math.min(100, Math.round(ratio * 100)));

    if (this.stageEl) {
      this.stageEl.style.setProperty('--split', `${this.splitPercent}%`);
    }

    if (this.dividerEl) {
      this.dividerEl.style.left = `${this.splitPercent}%`;
      this.dividerEl.setAttribute('aria-valuenow', this.splitPercent.toString());
    }

    // Direct clip-path fallback for both layers
    if (this.photoLayerEl) {
      this.photoLayerEl.style.clipPath = `inset(0 calc(100% - ${this.splitPercent}%) 0 0)`;
    }
    if (this.outlineLayerEl) {
      this.outlineLayerEl.style.clipPath = `inset(0 0 0 ${this.splitPercent}%)`;
    }

    store.update((s) => {
      s.inspectDividerRatio = ratio;
    });
  }

  // Backward-compatible alias
  public setDividerRatio(ratio: number) {
    this.setSplitRatio(ratio);
  }

  /**
   * Selects an arm component to highlight with leader line and label.
   */
  public selectPart(part: 'base' | 'elbow' | 'gripper') {
    this.currentPart = part;

    // Update active tab styles
    document.querySelectorAll('.part-tab, .hotspot-tab').forEach((tab) => {
      const p = tab.getAttribute('data-part') || tab.getAttribute('data-spot');
      const isTarget = p === part || (p === 'arm' && part === 'elbow');
      tab.classList.toggle('active', isTarget);
      tab.setAttribute('aria-selected', isTarget ? 'true' : 'false');
    });

    // Show leader line group
    if (this.leaderGroup) {
      this.leaderGroup.classList.add('active');
    }

    // Update leader line and label
    this.updateLeaderDisplay(part);

    store.update((s) => {
      s.inspectHotspot = part === 'elbow' ? 'arm' : part;
    });
  }

  private updateLeaderDisplay(part: 'base' | 'elbow' | 'gripper') {
    const config = this.partAnchors[part];
    if (!config) return;

    if (this.leaderPolyline) {
      this.leaderPolyline.setAttribute('points', config.points);
    }
    if (this.anchorDot) {
      this.anchorDot.setAttribute('cx', config.anchor[0].toString());
      this.anchorDot.setAttribute('cy', config.anchor[1].toString());
    }
    if (this.leaderText) {
      this.leaderText.setAttribute('x', config.textPos[0].toString());
      this.leaderText.setAttribute('y', config.textPos[1].toString());
      this.leaderText.textContent = i18n.t(config.key);
    }
  }

  /**
   * Scroll transition: As the graphite stage rises into view,
   * if the visitor hasn't manually dragged, the divider sweeps from 100% to 50%.
   * Uses the same --split variable.
   */
  private initScrollTransition() {
    const prefersReducedMotion = typeof window !== 'undefined' && window.matchMedia
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false;
    if (prefersReducedMotion) {
      this.setSplitRatio(0.5);
      return;
    }

    const sceneEl = document.getElementById('scene-02');
    if (!sceneEl) return;

    window.addEventListener('scroll', () => {
      if (this.userHasDragged) return;

      const rect = sceneEl.getBoundingClientRect();
      const vh = window.innerHeight;

      // When Scene 02 is entering the viewport
      if (rect.top <= vh && rect.bottom >= 0) {
        // Transition progress from rect.top = vh down to rect.top <= 0
        const progress = Math.min(1, Math.max(0, (vh - rect.top) / (vh * 0.9)));
        // Sweep divider from 100% down to 50%
        const sweepRatio = 1.0 - progress * 0.5;
        this.setSplitRatio(sweepRatio);
      }
    });
  }
}
