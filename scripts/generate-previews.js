import fs from 'fs';

const baseHtml = fs.readFileSync('dist/index.html', 'utf-8');
const cssMatch = baseHtml.match(/<link rel="stylesheet"[^>]+href="([^"]+)">/);
const cssHref = cssMatch ? cssMatch[1] : './assets/index-CCQ4q4VC.css';

function makePreview(pct, activePart = null) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Meet the arm - ${pct}%</title>
  <link rel="stylesheet" href="${cssHref}" />
  <style>
    body { margin: 0; padding: 0; background: #121316; }
    .scene-section { min-height: 100vh; }
    #inspect-graphite-stage { --split: ${pct}%; }
  </style>
</head>
<body>
  <section id="scene-02" class="scene-section scene-inspect" aria-label="Scene 02: Hardware Inspection">
    <div class="inspect-graphite-stage" id="inspect-graphite-stage">
      <div class="inspect-headline-block">
        <div class="inspect-tag-row">
          <span class="inspect-tag-label">HARDWARE INSPECTION</span>
          <div class="inspect-tag-line"></div>
        </div>
        <h2 class="inspect-headline">Meet the arm.</h2>
      </div>

      <div class="inspect-viewport" id="inspect-viewport">
        <!-- Layer 1: Registered CAD Outline (Masked by --split) -->
        <div class="inspect-layer layer-outline" id="layer-outline">
          <img src="./assets/arm-outline.png" alt="CAD Wireframe Outline" class="inspect-arm-img" id="img-outline" />
        </div>

        <!-- Layer 2: Original Full-color Photographic Arm (Masked by --split) -->
        <div class="inspect-layer layer-photo" id="layer-photo">
          <img src="./assets/arm-photo.png" alt="Photographic Arm" class="inspect-arm-img" id="img-photo" />
        </div>

        <!-- Draggable Orange Split Divider -->
        <div id="inspect-divider" class="inspect-divider" role="separator" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100">
          <div class="divider-line"></div>
          <div class="divider-handle-circle" aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="8 7 3 12 8 17" />
              <polyline points="16 7 21 12 16 17" />
            </svg>
          </div>
        </div>

        <!-- SVG Leader Overlay (1024 x 682) -->
        <svg class="inspect-leader-svg" id="inspect-leader-svg" viewBox="0 0 1024 682" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
          <circle id="marker-gripper" cx="200" cy="447" r="1" opacity="0" pointer-events="none" />
          <circle id="marker-elbow" cx="711" cy="107" r="1" opacity="0" pointer-events="none" />
          <circle id="marker-base" cx="843" cy="520" r="1" opacity="0" pointer-events="none" />

          <g id="hotspot-leader-group" class="hotspot-leader-group ${activePart ? 'active' : ''}">
            ${activePart === 'gripper' ? `
              <polyline class="hotspot-leader-line" points="200,447 157,393 117,393" />
              <circle class="hotspot-anchor-dot" cx="200" cy="447" r="5" />
              <text class="hotspot-leader-text" x="110" y="397" text-anchor="end">Gripper</text>
            ` : activePart === 'elbow' ? `
              <polyline class="hotspot-leader-line" points="711,107 653,57 607,57" />
              <circle class="hotspot-anchor-dot" cx="711" cy="107" r="5" />
              <text class="hotspot-leader-text" x="600" y="61" text-anchor="end">Elbow</text>
            ` : activePart === 'base' ? `
              <polyline class="hotspot-leader-line" points="843,520 780,593 727,593" />
              <circle class="hotspot-anchor-dot" cx="843" cy="520" r="5" />
              <text class="hotspot-leader-text" x="720" y="597" text-anchor="end">Base</text>
            ` : ''}
          </g>
        </svg>
      </div>

      <!-- Bottom Controls: Three Part Tabs [ Base ] [ Elbow ] [ Gripper ] -->
      <div class="inspect-bottom-bar">
        <div class="part-tabs-group" role="tablist">
          <button type="button" class="part-tab ${activePart === 'base' ? 'active' : ''}">Base</button>
          <button type="button" class="part-tab ${activePart === 'elbow' ? 'active' : ''}">Elbow</button>
          <button type="button" class="part-tab ${activePart === 'gripper' ? 'active' : ''}">Gripper</button>
        </div>
      </div>
    </div>
  </section>
</body>
</html>`;
}

// 0%: full linework (no part selected)
fs.writeFileSync('dist/preview-0.html', makePreview(0, null));
// 50%: split view (clean resting pose with no part selected, or active part)
fs.writeFileSync('dist/preview-50.html', makePreview(50, null));
// 100%: full photograph
fs.writeFileSync('dist/preview-100.html', makePreview(100, null));
// Also a preview with gripper active for inspection
fs.writeFileSync('dist/preview-50-part.html', makePreview(50, 'gripper'));

// Mobile preview specifically sized for 390x844 viewport
const mobileHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=390, initial-scale=1.0" />
  <title>Meet the arm - Mobile 50%</title>
  <link rel="stylesheet" href="${cssHref}" />
  <style>
    html, body { width: 390px; height: 844px; overflow: hidden; margin: 0; background: #121316; }
    #scene-02, #inspect-graphite-stage { width: 390px !important; max-width: 390px !important; height: 844px !important; min-height: 844px !important; --split: 50%; }
    .inspect-viewport { width: 390px !important; height: 844px !important; }
    .inspect-bottom-bar { width: 340px !important; max-width: 340px !important; left: 50% !important; transform: translateX(-50%) !important; }
    .part-tabs-group { width: 100% !important; gap: 8px !important; }
    .part-tab { flex: 1 !important; min-width: 0 !important; height: 42px !important; font-size: 13px !important; padding: 0 4px !important; }
  </style>
</head>
<body>
  <section id="scene-02" class="scene-section scene-inspect">
    <div class="inspect-graphite-stage" id="inspect-graphite-stage">
      <div class="inspect-headline-block">
        <div class="inspect-tag-row">
          <span class="inspect-tag-label">HARDWARE INSPECTION</span>
          <div class="inspect-tag-line"></div>
        </div>
        <h2 class="inspect-headline">Meet the arm.</h2>
      </div>

      <div class="inspect-viewport" id="inspect-viewport">
        <div class="inspect-layer layer-outline" id="layer-outline">
          <img src="./assets/arm-outline.png" alt="CAD Outline" class="inspect-arm-img" />
        </div>
        <div class="inspect-layer layer-photo" id="layer-photo">
          <img src="./assets/arm-photo.png" alt="Photo Arm" class="inspect-arm-img" />
        </div>
        <div id="inspect-divider" class="inspect-divider">
          <div class="divider-line"></div>
          <div class="divider-handle-circle">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="8 7 3 12 8 17" />
              <polyline points="16 7 21 12 16 17" />
            </svg>
          </div>
        </div>
      </div>

      <div class="inspect-bottom-bar">
        <div class="part-tabs-group">
          <button type="button" class="part-tab">Base</button>
          <button type="button" class="part-tab">Elbow</button>
          <button type="button" class="part-tab">Gripper</button>
        </div>
      </div>
    </div>
  </section>
</body>
</html>`;
fs.writeFileSync('dist/preview-mobile-50.html', mobileHtml);

console.log('Wrote dist/preview-0.html, preview-50.html, preview-100.html, preview-50-part.html, preview-mobile-50.html');
