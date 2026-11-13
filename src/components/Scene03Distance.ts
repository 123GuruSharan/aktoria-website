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
  private routePathIndia: SVGPathElement | null = null;
  private routePathMexico: SVGPathElement | null = null;
  private pulseParticle: SVGCircleElement | null = null;
  private nodeIndiaDest: SVGGElement | null = null;
  private nodeMexicoDest: SVGGElement | null = null;

  private isPulseAnimating = false;

  constructor() {
    this.btnIndia = document.getElementById('btn-route-india');
    this.btnMexico = document.getElementById('btn-route-mexico');
    this.slidingPill = document.getElementById('route-sliding-pill');
    this.btnSignal = document.getElementById('btn-send-signal');

    this.statLatencyVal = document.getElementById('stat-latency-val');
    this.statRouteTag = document.getElementById('stat-route-tag');
    this.signalStatusPill = document.getElementById('signal-status-pill');
    this.headerLatencyPill = document.getElementById('header-latency-pill');

    this.routePathIndia = document.getElementById('route-path-india') as unknown as SVGPathElement | null;
    this.routePathMexico = document.getElementById('route-path-mexico') as unknown as SVGPathElement | null;
    this.pulseParticle = document.getElementById('signal-pulse-particle') as unknown as SVGCircleElement | null;
    this.nodeIndiaDest = document.getElementById('node-india-dest') as unknown as SVGGElement | null;
    this.nodeMexicoDest = document.getElementById('node-mexico-dest') as unknown as SVGGElement | null;

    this.bindEvents();
    this.setRoute('mexico');
  }

  private bindEvents() {
    this.btnIndia?.addEventListener('click', () => this.setRoute('india'));
    this.btnMexico?.addEventListener('click', () => this.setRoute('mexico'));
    this.btnSignal?.addEventListener('click', () => this.sendSampleSignal());
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

    // Update Telemetry Display
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
    }
  }

  public sendSampleSignal() {
    if (this.isPulseAnimating) return;
    this.isPulseAnimating = true;

    const route = store.getState().selectedRoute;
    const pathEl = route === 'india' ? this.routePathIndia : this.routePathMexico;
    const targetNode = route === 'india' ? this.nodeIndiaDest : this.nodeMexicoDest;

    if (!pathEl || !this.pulseParticle) {
      this.isPulseAnimating = false;
      return;
    }

    const pathLength = pathEl.getTotalLength();
    const startTime = performance.now();
    // Allow user to follow visually (~1.4s)
    const duration = route === 'india' ? 800 : 1600;

    if (this.signalStatusPill) {
      this.signalStatusPill.textContent = `TRANSMITTING UDP PACKET // ${route.toUpperCase()} ROUTE`;
    }

    const animatePulse = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      // Smooth travel along path
      const currentDist = progress * pathLength;
      const point = pathEl.getPointAtLength(currentDist);

      this.pulseParticle?.setAttribute('cx', point.x.toFixed(1));
      this.pulseParticle?.setAttribute('cy', point.y.toFixed(1));

      if (progress < 1) {
        requestAnimationFrame(animatePulse);
      } else {
        // Arrival flash at target endpoint
        if (targetNode) {
          targetNode.classList.add('arrival-flash');
          setTimeout(() => targetNode.classList.remove('arrival-flash'), 600);
        }
        if (this.signalStatusPill) {
          const latency = route === 'india' ? '5.2 ms' : '124.8 ms';
          this.signalStatusPill.textContent = `ACK RECEIVED // ROUND-TRIP LATENCY: ${latency}`;
        }
        this.isPulseAnimating = false;
      }
    };

    requestAnimationFrame(animatePulse);
  }
}

