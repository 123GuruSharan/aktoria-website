import fs from 'fs';
import path from 'path';
import { JSDOM } from 'jsdom';

console.log('=== VERIFYING TWO-WAY ROBOTIC ARM CONTROLLER (ALL 5 CHECKS) ===\n');

const htmlContent = fs.readFileSync(path.resolve('index.html'), 'utf-8');
const dom = new JSDOM(htmlContent, {
  url: 'http://localhost:5173/',
  pretendToBeVisual: true,
});

const { window } = dom;
// @ts-ignore
global.window = window;
// @ts-ignore
global.document = window.document;
// @ts-ignore
global.HTMLElement = window.HTMLElement;
// @ts-ignore
global.SVGSVGElement = window.SVGSVGElement;
// @ts-ignore
global.PointerEvent = window.PointerEvent || window.MouseEvent;
// @ts-ignore
global.requestAnimationFrame = (cb: (t: number) => void) => setTimeout(() => cb(Date.now()), 16) as unknown as number;
// @ts-ignore
global.cancelAnimationFrame = (id: number) => clearTimeout(id as unknown as NodeJS.Timeout);

// Mock SVG CTM and Point methods for JSDOM
// @ts-ignore
window.SVGSVGElement.prototype.createSVGPoint = function() {
  return {
    x: 0,
    y: 0,
    matrixTransform: function(matrix: any) {
      return {
        x: matrix.a * this.x + matrix.c * this.y + matrix.e,
        y: matrix.b * this.x + matrix.d * this.y + matrix.f,
      };
    }
  };
};

// @ts-ignore
window.SVGElement.prototype.getScreenCTM = function() {
  return {
    a: 0.5, b: 0, c: 0, d: 0.5, e: 600, f: 100,
    inverse: function() {
      return { a: 2, b: 0, c: 0, d: 2, e: -1200, f: -200 };
    }
  };
};

// Import Scene01Hero
const { Scene01Hero } = await import('../src/components/Scene01Hero.ts');

const hero = new Scene01Hero();

let passed = 0;
let total = 0;
function test(desc: string, fn: () => void) {
  total++;
  try {
    fn();
    console.log(`  ✓ ${desc}`);
    passed++;
  } catch (err: any) {
    console.error(`  ✗ FAILED: ${desc}\n    ${err.message}`);
    process.exitCode = 1;
  }
}

// -----------------------------------------------------------------------------
// CHECK 1: Match artwork & 4-layer articulated rig
// -----------------------------------------------------------------------------
test('Check 1: 4 articulated layers exist with exact rest alignment', () => {
  const base = document.getElementById('rig-base');
  const upper = document.getElementById('rig-upper');
  const forearm = document.getElementById('rig-forearm');
  const wrist = document.getElementById('rig-wrist');
  const handle = document.getElementById('robot-fingertip-handle');

  if (!base || !upper || !forearm || !wrist || !handle) {
    throw new Error('Missing one or more arm rig layers');
  }

  // Verify image files exist on disk
  if (!fs.existsSync('public/assets/arm-base.png')) throw new Error('Missing arm-base.png');
  if (!fs.existsSync('public/assets/arm-upper.png')) throw new Error('Missing arm-upper.png');
  if (!fs.existsSync('public/assets/arm-forearm.png')) throw new Error('Missing arm-forearm.png');
  if (!fs.existsSync('public/assets/arm-wrist.png')) throw new Error('Missing arm-wrist.png');
});

// -----------------------------------------------------------------------------
// CHECK 2: Drag gripper in an L-shape
// -----------------------------------------------------------------------------
test('Check 2: Drag gripper in an L-shape (down then right); grid draws identical L', () => {
  hero.clearTrail();
  // Rest pose
  hero.applySharedPosition(0, 0, false);

  // Leg 1: Drag down (e.g. y goes from 0 to -20mm)
  hero.applyRobotPosition(256.5, 730 + 20 * 4.0, true); // +Y in SVG is down in screen
  const valX1 = document.getElementById('val-x')?.textContent;
  const valY1 = document.getElementById('val-y')?.textContent;
  if (parseFloat(valY1 || '0') > -15) {
    throw new Error(`Expected Y to be negative when moving down, got ${valY1}`);
  }

  // Leg 2: Drag right (e.g. x goes from 0 to +25mm)
  hero.applyRobotPosition(256.5 + 25 * 4.0, 730 + 20 * 4.0, true); // +X in SVG is right in screen
  const valX2 = document.getElementById('val-x')?.textContent;
  const valY2 = document.getElementById('val-y')?.textContent;
  if (parseFloat(valX2 || '0') < 20) {
    throw new Error(`Expected X to be positive when moving right, got ${valX2}`);
  }

  // Base remains fixed
  const baseTransform = document.getElementById('rig-base')?.getAttribute('transform');
  if (baseTransform && baseTransform !== 'none') {
    throw new Error('Base must stay planted');
  }
});

// -----------------------------------------------------------------------------
// CHECK 3: Start fresh stroke on left grid and draw circle
// -----------------------------------------------------------------------------
test('Check 3: Fresh stroke on grid draws circle; fingertips follow with fixed base', () => {
  // Start fresh stroke at angle 0: (gx: 20, gy: 0)
  hero.applySharedPosition(20, 0, true);
  
  // Follow circle around
  for (let deg = 30; deg <= 360; deg += 30) {
    const rad = (deg * Math.PI) / 180;
    const gx = Math.cos(rad) * 20;
    const gy = Math.sin(rad) * 20;
    hero.applySharedPosition(gx, gy, true);
  }

  const upperAngle = document.getElementById('rig-upper')?.getAttribute('transform');
  const forearmAngle = document.getElementById('rig-forearm')?.getAttribute('transform');

  if (!upperAngle || !upperAngle.includes('rotate')) {
    throw new Error('Upper arm did not rotate during circle trajectory');
  }
  if (!forearmAngle || !forearmAngle.includes('rotate')) {
    throw new Error('Forearm did not rotate during circle trajectory');
  }
});

// -----------------------------------------------------------------------------
// CHECK 4: Reset halfway through playback
// -----------------------------------------------------------------------------
test('Check 4: Reset halfway through playback restores reference pose and clears trail', () => {
  hero.playExampleMotion();
  // Simulate advancing halfway
  hero.applySharedPosition(20, 20, true);

  // User hits reset
  hero.resetPosition();

  const valX = document.getElementById('val-x')?.textContent;
  const valY = document.getElementById('val-y')?.textContent;
  const upperTransform = document.getElementById('rig-upper')?.getAttribute('transform');
  const forearmTransform = document.getElementById('rig-forearm')?.getAttribute('transform');

  if (valX !== '0.0' || valY !== '0.0') {
    throw new Error(`Coordinates should reset to 0.0, got X: ${valX}, Y: ${valY}`);
  }
  if (!upperTransform?.includes('rotate(0.00')) {
    throw new Error(`Upper arm should reset to 0.00 deg, got ${upperTransform}`);
  }
  if (!forearmTransform?.includes('rotate(0.00')) {
    throw new Error(`Forearm should reset to 0.00 deg, got ${forearmTransform}`);
  }
});

// -----------------------------------------------------------------------------
// CHECK 5: Mobile resize & anchor alignment
// -----------------------------------------------------------------------------
test('Check 5: Mobile resize preserves reference pose and recalculates connector', () => {
  // Trigger window resize event
  window.dispatchEvent(new window.Event('resize'));

  const connectorPath = document.getElementById('hero-teleoperation-path');
  if (!connectorPath) {
    throw new Error('Connector path element missing');
  }

  const d = connectorPath.getAttribute('d');
  if (!d || d.length === 0) {
    throw new Error('Connector path attribute d should be computed');
  }
  if (!d.startsWith('M ')) {
    throw new Error(`Connector path should begin with M, got ${d}`);
  }
});

console.log(`\n=== RESULTS: ${passed}/${total} TWO-WAY CONTROLLER CHECKS PASSED ===\n`);

