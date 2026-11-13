import fs from 'fs';
import path from 'path';
import { JSDOM } from 'jsdom';

console.log('=== VERIFYING HARDWARE INSPECTION "MEET THE ARM" SCENE ===\n');

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
global.SVGElement = window.SVGElement;
// @ts-ignore
global.PointerEvent = window.PointerEvent || window.MouseEvent;

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

// Import Scene02Inspection
const { Scene02Inspection } = await import('../src/components/Scene02Inspection.ts');
const inspect = new Scene02Inspection();

// -----------------------------------------------------------------------------
// CHECK 1: Full-width graphite stage & Typography hierarchy
// -----------------------------------------------------------------------------
test('Check 1: Dark graphite stage with "Meet the arm." in upper left', () => {
  const stage = document.getElementById('inspect-graphite-stage');
  const headline = stage?.querySelector('.inspect-headline');
  const tagLabel = stage?.querySelector('.inspect-tag-label');

  if (!stage) throw new Error('Missing #inspect-graphite-stage');
  if (!headline || !headline.textContent?.includes('Meet the arm.')) {
    throw new Error('Missing or incorrect headline text');
  }
  if (!tagLabel || !tagLabel.textContent?.includes('HARDWARE INSPECTION')) {
    throw new Error('Missing or incorrect tag label');
  }
});

// -----------------------------------------------------------------------------
// CHECK 2: Two identical stacked layers (Photo and Outline)
// -----------------------------------------------------------------------------
test('Check 2: Photo and Outline layers exist with matching assets and 50% rest clip', () => {
  const photoLayer = document.getElementById('layer-photo');
  const outlineLayer = document.getElementById('layer-outline');
  const imgPhoto = document.getElementById('img-photo') as HTMLImageElement | null;
  const imgOutline = document.getElementById('img-outline') as HTMLImageElement | null;

  if (!photoLayer || !outlineLayer) throw new Error('Missing photo or outline layer');
  if (!imgPhoto || !imgPhoto.src.includes('arm-photo.png')) {
    throw new Error('Photo img element missing or incorrect src');
  }
  if (!imgOutline || !imgOutline.src.includes('arm-outline.png')) {
    throw new Error('Outline img element missing or incorrect src');
  }

  // Verify assets exist on disk
  if (!fs.existsSync('public/assets/arm-photo.png')) throw new Error('Missing public/assets/arm-photo.png');
  if (!fs.existsSync('public/assets/arm-outline.png')) throw new Error('Missing public/assets/arm-outline.png');

  // Verify initial 50% resting clip-path
  const clip = photoLayer.style.clipPath;
  if (!clip.includes('50%')) {
    throw new Error(`Expected clipPath to contain 50%, got ${clip}`);
  }
});

// -----------------------------------------------------------------------------
// CHECK 3: Slider reveals 0%, 50%, and 100% cleanly
// -----------------------------------------------------------------------------
test('Check 3: Slider reveals 0% (full outline), 50% (split), 100% (full photo)', () => {
  const photoLayer = document.getElementById('layer-photo');
  const divider = document.getElementById('inspect-divider');

  // Test 0%
  inspect.setDividerRatio(0);
  if (!photoLayer?.style.clipPath.includes('0%')) {
    throw new Error(`0% clipPath failed, got ${photoLayer?.style.clipPath}`);
  }
  if (divider?.style.left !== '0%') {
    throw new Error(`0% divider position failed, got ${divider?.style.left}`);
  }

  // Test 100%
  inspect.setDividerRatio(1);
  if (!photoLayer?.style.clipPath.includes('100%')) {
    throw new Error(`100% clipPath failed, got ${photoLayer?.style.clipPath}`);
  }
  if (divider?.style.left !== '100%') {
    throw new Error(`100% divider position failed, got ${divider?.style.left}`);
  }

  // Test 50%
  inspect.setDividerRatio(0.5);
  if (!photoLayer?.style.clipPath.includes('50%')) {
    throw new Error(`50% clipPath failed, got ${photoLayer?.style.clipPath}`);
  }
  if (divider?.style.left !== '50%') {
    throw new Error(`50% divider position failed, got ${divider?.style.left}`);
  }
});

// -----------------------------------------------------------------------------
// CHECK 4: Three part controls (Base, Elbow, Gripper) with leader lines
// -----------------------------------------------------------------------------
test('Check 4: Part buttons (Base, Elbow, Gripper) update active state and leader line', () => {
  const polyline = document.getElementById('hotspot-leader-polyline');
  const anchorDot = document.getElementById('hotspot-anchor-dot');
  const leaderText = document.getElementById('hotspot-leader-text');

  // Test Gripper
  inspect.selectPart('gripper');
  if (anchorDot?.getAttribute('cx') !== '200' || anchorDot?.getAttribute('cy') !== '447') {
    throw new Error(`Gripper anchor dot mismatch: ${anchorDot?.getAttribute('cx')}, ${anchorDot?.getAttribute('cy')}`);
  }
  if (leaderText?.textContent !== 'Gripper') {
    throw new Error(`Gripper label text mismatch: ${leaderText?.textContent}`);
  }

  // Test Elbow
  inspect.selectPart('elbow');
  if (anchorDot?.getAttribute('cx') !== '711' || anchorDot?.getAttribute('cy') !== '107') {
    throw new Error(`Elbow anchor dot mismatch: ${anchorDot?.getAttribute('cx')}, ${anchorDot?.getAttribute('cy')}`);
  }
  if (leaderText?.textContent !== 'Elbow') {
    throw new Error(`Elbow label text mismatch: ${leaderText?.textContent}`);
  }

  // Test Base
  inspect.selectPart('base');
  if (anchorDot?.getAttribute('cx') !== '843' || anchorDot?.getAttribute('cy') !== '520') {
    throw new Error(`Base anchor dot mismatch: ${anchorDot?.getAttribute('cx')}, ${anchorDot?.getAttribute('cy')}`);
  }
  if (leaderText?.textContent !== 'Base') {
    throw new Error(`Base label text mismatch: ${leaderText?.textContent}`);
  }
});

console.log(`\n=== RESULTS: ${passed}/${total} HARDWARE INSPECTION CHECKS PASSED ===\n`);

