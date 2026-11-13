export class SharedTrace {
  private tracePath: SVGPathElement | null = null;
  private traceHead: SVGCircleElement | null = null;
  private animId = 0;

  constructor() {
    this.tracePath = document.getElementById('global-trace-path') as unknown as SVGPathElement | null;
    this.traceHead = document.getElementById('global-trace-head') as unknown as SVGCircleElement | null;

    this.bindEvents();
    this.startTraceLoop();
  }

  private bindEvents() {
    window.addEventListener('scroll', () => this.updateTrace());
    window.addEventListener('resize', () => this.updateTrace());
  }

  private startTraceLoop() {
    const loop = () => {
      this.updateTrace();
      this.animId = requestAnimationFrame(loop);
    };
    this.animId = requestAnimationFrame(loop);
  }

  private updateTrace() {
    if (!this.tracePath || !this.traceHead) return;

    // Calculate scroll progress across document
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const scrollY = window.scrollY;
    const progress = docHeight > 0 ? Math.min(1, Math.max(0, scrollY / docHeight)) : 0;

    // Detect anchor elements in viewport
    const handleEl = document.getElementById('operator-handle');
    const anchorEl = document.getElementById('robot-fingertip-handle') || document.getElementById('fingertip-anchor-point');
    const markerEl = document.getElementById('marker-gripper');
    const mapNodeEl = document.getElementById('node-mexico-dest');
    const workcellEl = document.getElementById('shared-workcell-stage');
    const underlineEl = document.getElementById('contact-underline-path');

    const vpW = window.innerWidth;
    const vpH = window.innerHeight;

    let p1 = { x: vpW * 0.25, y: vpH * 0.5 };
    let p2 = { x: vpW * 0.75, y: vpH * 0.5 };

    // Get live bounding boxes if visible
    if (handleEl && anchorEl && progress < 0.22) {
      const hRect = handleEl.getBoundingClientRect();
      const aRect = anchorEl.getBoundingClientRect();
      p1 = { x: hRect.left + hRect.width / 2, y: hRect.top + hRect.height / 2 };
      p2 = { x: aRect.left + aRect.width / 2, y: aRect.top + aRect.height / 2 };
    } else if (markerEl && progress >= 0.22 && progress < 0.45) {
      const mRect = markerEl.getBoundingClientRect();
      p1 = { x: vpW * 0.2, y: mRect.top + mRect.height / 2 };
      p2 = { x: mRect.left + mRect.width / 2, y: mRect.top + mRect.height / 2 };
    } else if (mapNodeEl && progress >= 0.45 && progress < 0.65) {
      const nRect = mapNodeEl.getBoundingClientRect();
      p1 = { x: vpW * 0.65, y: nRect.top - 20 };
      p2 = { x: nRect.left + nRect.width / 2, y: nRect.top + nRect.height / 2 };
    } else if (workcellEl && progress >= 0.65 && progress < 0.85) {
      const wRect = workcellEl.getBoundingClientRect();
      p1 = { x: wRect.left + wRect.width * 0.35, y: wRect.top + wRect.height * 0.45 };
      p2 = { x: wRect.left + wRect.width * 0.65, y: wRect.top + wRect.height * 0.45 };
    } else if (underlineEl && progress >= 0.85) {
      const uRect = underlineEl.getBoundingClientRect();
      p1 = { x: uRect.left, y: uRect.top + uRect.height / 2 };
      p2 = { x: uRect.right, y: uRect.top + uRect.height / 2 };
    }

    // Connect with smooth curved spline
    const midX = (p1.x + p2.x) / 2;
    const midY = (p1.y + p2.y) / 2 - 30 * Math.sin(progress * Math.PI);
    const d = `M ${p1.x.toFixed(1)} ${p1.y.toFixed(1)} Q ${midX.toFixed(1)} ${midY.toFixed(1)} ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;

    this.tracePath.setAttribute('d', d);
    this.traceHead.setAttribute('cx', p2.x.toFixed(1));
    this.traceHead.setAttribute('cy', p2.y.toFixed(1));

    // Hide trace head if out of bounds
    const isVisible = p2.y > 0 && p2.y < vpH;
    this.traceHead.style.opacity = isVisible ? '1' : '0';
  }

  public destroy() {
    cancelAnimationFrame(this.animId);
  }
}
