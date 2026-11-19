import { store, RouteOption } from '../store.ts';

export class Scene03Distance {
  private btnIndia: HTMLElement | null = null;
  private btnMexico: HTMLElement | null = null;
  private slidingPill: HTMLElement | null = null;
  private btnSignal: HTMLElement | null = null;

  // Latency & Telemetry display
  private statLatencyVal: HTMLElement | null = null;
  private statRouteTag: HTMLElement | null = null;
  private signalStatusPill: HTMLElement | null = null;
  private headerLatencyPill: HTMLElement | null = null;

  // SVG Elements
  private mapPerspectiveFrame: HTMLElement | null = null;
  private mapGeoGrid: SVGElement | null = null;
  private worldContinents: SVGElement | null = null;
  private routePathIndia: SVGPathElement | null = null;
  private routePathMexico: SVGPathElement | null = null;
  private pulseParticle: SVGCircleElement | null = null;
  private nodeIndiaDest: SVGGElement | null = null;
  private nodeMexicoDest: SVGGElement | null = null;

  // Animation State
  private isPulseAnimating = false;
  private pulseAnimId = 0;

  constructor() {
    this.btnIndia = document.getElementById('btn-route-india');
    this.btnMexico = document.getElementById('btn-route-mexico');
    this.slidingPill = document.getElementById('route-sliding-pill');
    this.btnSignal = document.getElementById('btn-send-signal');

    this.statLatencyVal = document.getElementById('stat-latency-val');
    this.statRouteTag = document.getElementById('stat-route-tag');
    this.signalStatusPill = document.getElementById('signal-status-pill');
    this.headerLatencyPill = document.getElementById('header-latency-pill');

    this.mapPerspectiveFrame = document.getElementById('map-perspective-frame');
    this.mapGeoGrid = document.getElementById('map-geo-grid') as unknown as SVGElement | null;
    this.worldContinents = document.querySelector('.world-continents') as unknown as SVGElement | null;
    this.routePathIndia = document.getElementById('route-path-india') as unknown as SVGPathElement | null;
    this.routePathMexico = document.getElementById('route-path-mexico') as unknown as SVGPathElement | null;
    this.pulseParticle = document.getElementById('signal-pulse-particle') as unknown as SVGCircleElement | null;
    this.nodeIndiaDest = document.getElementById('node-india-dest') as unknown as SVGGElement | null;
    this.nodeMexicoDest = document.getElementById('node-mexico-dest') as unknown as SVGGElement | null;

    this.bindEvents();
    this.setRoute('mexico');
    this.initScrollTransition();
  }

  private bindEvents() {
    this.btnIndia?.addEventListener('click', () => {
      this.setRoute('india');
      // If signal pulse is running when user changes route, restart on new route
      if (this.isPulseAnimating) {
        cancelAnimationFrame(this.pulseAnimId);
        this.isPulseAnimating = false;
        this.sendSampleSignal();
      }
    });

    this.btnMexico?.addEventListener('click', () => {
      this.setRoute('mexico');
      // If signal pulse is running when user changes route, restart on new route
      if (this.isPulseAnimating) {
        cancelAnimationFrame(this.pulseAnimId);
        this.isPulseAnimating = false;
        this.sendSampleSignal();
      }
    });

    this.btnSignal?.addEventListener('click', () => {
      cancelAnimationFrame(this.pulseAnimId);
      this.isPulseAnimating = false;
      this.sendSampleSignal();
    });
  }

  public setRoute(route: RouteOption) {
    store.update((s) => {
      s.selectedRoute = route;
    });

    const isIndia = route === 'india';

    // Update Tab Buttons and Sliding Pill
    this.btnIndia?.classList.toggle('active', isIndia);
    this.btnIndia?.setAttribute('aria-selected', isIndia ? 'true' : 'false');

    this.btnMexico?.classList.toggle('active', !isIndia);
    this.btnMexico?.setAttribute('aria-selected', !isIndia ? 'true' : 'false');

    if (this.slidingPill) {
      this.slidingPill.style.transform = isIndia ? 'translateX(0%)' : 'translateX(100%)';
    }

    // Update Telemetry Display with Company-Reported Figures
    if (this.statLatencyVal) {
      this.statLatencyVal.textContent = isIndia ? '~5' : '~125';
    }
    if (this.statRouteTag) {
      this.statRouteTag.textContent = isIndia
        ? 'NOIDA, INDIA • DOMESTIC WORKCELL'
        : 'NOIDA, INDIA • MONTERREY, MEXICO';
    }
    if (this.headerLatencyPill) {
      this.headerLatencyPill.textContent = isIndia ? '~5ms LATENCY' : '~125ms LATENCY';
    }

    // Update SVG Route Paths & Nodes
    if (this.routePathIndia && this.routePathMexico) {
      this.routePathIndia.style.opacity = isIndia ? '1' : '0.2';
      this.routePathIndia.style.strokeWidth = isIndia ? '3.5' : '1.5';

      this.routePathMexico.style.opacity = !isIndia ? '1' : '0.2';
      this.routePathMexico.style.strokeWidth = !isIndia ? '3.5' : '1.5';
    }

    if (this.nodeIndiaDest && this.nodeMexicoDest) {
      this.nodeIndiaDest.style.opacity = isIndia ? '1' : '0.35';
      this.nodeMexicoDest.style.opacity = !isIndia ? '1' : '0.35';
    }

    // Position Signal Pulse Particle at Operator Origin
    if (this.pulseParticle) {
      this.pulseParticle.setAttribute('cx', '800');
      this.pulseParticle.setAttribute('cy', '310');
      this.pulseParticle.style.opacity = '1';
    }
  }

  public sendSampleSignal() {
    this.isPulseAnimating = true;

    const route = store.getState().selectedRoute;
    const isIndia = route === 'india';
    const pathEl = isIndia ? this.routePathIndia : this.routePathMexico;
    const targetNode = isIndia ? this.nodeIndiaDest : this.nodeMexicoDest;
    const latencyStr = isIndia ? '~5 ms' : '~125 ms';

    if (!pathEl || !this.pulseParticle) {
      this.isPulseAnimating = false;
      return;
    }

    const pathLength = pathEl.getTotalLength();
    const startTime = performance.now();
    // Allow visitor to comfortably follow the illustrative playback pulse
    const duration = isIndia ? 750 : 1450;

    if (this.signalStatusPill) {
      this.signalStatusPill.textContent = `ILLUSTRATIVE PLAYBACK // TRANSMITTING SIGNAL (${latencyStr})`;
    }

    const animatePulse = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);

      // Smooth travel along path
      const currentDist = progress * pathLength;
      const point = pathEl.getPointAtLength(currentDist);

      if (this.pulseParticle) {
        this.pulseParticle.setAttribute('cx', point.x.toFixed(1));
        this.pulseParticle.setAttribute('cy', point.y.toFixed(1));
      }

      if (progress < 1 && this.isPulseAnimating) {
        this.pulseAnimId = requestAnimationFrame(animatePulse);
      } else if (this.isPulseAnimating) {
        // Destination marker briefly expands and settles on arrival
        if (targetNode) {
          targetNode.classList.add('arrival-flash');
          targetNode.animate(
            [
              { transform: 'scale(1)' },
              { transform: 'scale(1.35)' },
              { transform: 'scale(1)' },
            ],
            { duration: 600, easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)' }
          );
          setTimeout(() => targetNode.classList.remove('arrival-flash'), 650);
        }

        if (this.signalStatusPill) {
          this.signalStatusPill.textContent = `ILLUSTRATIVE PLAYBACK // SIGNAL DELIVERED (${latencyStr})`;
        }
        this.isPulseAnimating = false;
      }
    };

    this.pulseAnimId = requestAnimationFrame(animatePulse);
  }

  /**
   * Coordinated, reversible scroll transition from Chapter 03 Route Map into Chapter 04 Remote Workspace:
   * 1. Destination marker becomes the visual focus.
   * 2. Map camera moves toward that marker.
   * 3. Geographic outlines fade as the coordinate grid tilts into perspective.
   * 4. Workbench emerges at destination marker.
   */
  private initScrollTransition() {
    const scene03 = document.getElementById('scene-03');
    if (!scene03 || !this.mapPerspectiveFrame) return;

    const onScroll = () => {
      const rect = scene03.getBoundingClientRect();
      const windowH = window.innerHeight;

      // When the bottom of Scene 03 begins to exit the viewport
      const exitProgress = Math.min(1, Math.max(0, (windowH * 0.4 - rect.bottom) / (windowH * 0.7)));

      if (exitProgress > 0) {
        // Tilt grid in 3D perspective
        const tiltDeg = exitProgress * 52;
        const scale = 1 - exitProgress * 0.12;
        const translateY = exitProgress * 50;

        this.mapPerspectiveFrame!.style.transform = `perspective(900px) rotateX(${tiltDeg.toFixed(1)}deg) scale(${scale.toFixed(3)}) translateY(${translateY.toFixed(1)}px)`;
        this.mapPerspectiveFrame!.style.transformOrigin = '50% 85%';

        // Fade out geographic continent outlines while sharpening perspective grid
        if (this.worldContinents) {
          this.worldContinents.style.opacity = `${(1 - exitProgress * 1.2).toFixed(2)}`;
        }
        if (this.mapGeoGrid) {
          this.mapGeoGrid.style.opacity = `${(0.25 + exitProgress * 0.45).toFixed(2)}`;
        }

        // Selected destination node focuses and highlights
        const route = store.getState().selectedRoute;
        const targetNode = route === 'india' ? this.nodeIndiaDest : this.nodeMexicoDest;
        if (targetNode) {
          targetNode.style.filter = `drop-shadow(0 0 ${exitProgress * 12}px #FF5000)`;
        }
      } else {
        // Reset cleanly to default resting view
        this.mapPerspectiveFrame!.style.transform = 'none';
        if (this.worldContinents) {
          this.worldContinents.style.opacity = '1';
        }
        if (this.nodeMexicoDest) this.nodeMexicoDest.style.filter = 'none';
        if (this.nodeIndiaDest) this.nodeIndiaDest.style.filter = 'none';
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }
}
