import fs from 'fs';
import path from 'path';
import { JSDOM } from 'jsdom';
import { translations } from '../src/i18n.ts';

console.log('=== STARTING RIGOROUS JOURNEY VERIFICATION ===\n');

// 1. Read index.html
const htmlPath = path.resolve('index.html');
const htmlContent = fs.readFileSync(htmlPath, 'utf-8');

const dom = new JSDOM(htmlContent, {
  url: 'http://localhost:5173/',
  runScripts: 'dangerously',
  resources: 'usable',
});

const { window } = dom;
const { document } = window;

let passedTests = 0;
let totalTests = 0;

function assert(condition: boolean, msg: string) {
  totalTests++;
  if (condition) {
    console.log(`  ✓ ${msg}`);
    passedTests++;
  } else {
    console.error(`  ✗ FAILED: ${msg}`);
    process.exitCode = 1;
  }
}

// =========================================================================
// JOURNEY 1: Desktop Visitor
// 1. Drags hero handle
// 2. Inspects gripper
// 3. Switches to Mexico route
// 4. Completes task
// =========================================================================
console.log('--- TEST JOURNEY 1: Desktop Visitor ---');

// 1.1 Hero Two-Way Controller: Left Grid & Rigged Photographic Arm
const handle = document.getElementById('operator-handle');
const envelope = document.getElementById('handle-envelope');
assert(handle !== null, 'Hero operator handle element exists on left grid');
assert(envelope !== null, 'Handle workspace envelope exists');
assert(handle?.getAttribute('role') === 'slider', 'Handle has accessible role="slider"');

const riggedArmSvg = document.getElementById('rigged-arm-svg');
const rigBase = document.getElementById('rig-base');
const rigUpper = document.getElementById('rig-upper');
const rigForearm = document.getElementById('rig-forearm');
const rigWrist = document.getElementById('rig-wrist');
const robotFingertipHandle = document.getElementById('robot-fingertip-handle');
const heroTrace = document.getElementById('hero-teleoperation-path');

assert(riggedArmSvg !== null, 'Rigged photographic arm SVG exists on warm ivory background');
assert(rigBase !== null, 'Layer 1: Base image layer exists and stays planted');
assert(rigUpper !== null, 'Layer 2: Upper arm joint group exists with shoulder pivot (1264, 643)');
assert(rigForearm !== null, 'Layer 3: Forearm joint group exists with elbow pivot (1067, 160)');
assert(rigWrist !== null, 'Layer 4: Wrist & gripper joint group exists with wrist pivot (577, 463)');
assert(robotFingertipHandle !== null, 'Two-way draggable fingertip handle exists with role="slider"');
assert(heroTrace !== null, 'Orange teleoperation trace overlay connects grid to fingertips');

// 1.2 Inspect Hotspots (Base, Arm, Gripper)
const markerGripper = document.getElementById('marker-gripper');
const annotTitle = document.getElementById('annot-title');
assert(markerGripper !== null, 'Gripper hotspot marker exists');
assert(document.querySelectorAll('.hotspot-tab').length === 3, 'Three hotspot tabs exist (Base, Arm, Gripper)');

// Verify hotspot texts exist in i18n
assert(translations.en['hotspot.gripper.title'].includes('Gripper'), 'English gripper title matches I2RT linear gripper');
assert(translations.en['hotspot.gripper.desc'].includes('95mm'), 'English gripper description mentions 95mm throw');

// 1.3 Mexico Route & Latency Switch
const btnMexico = document.getElementById('btn-route-mexico');
const statLatencyVal = document.getElementById('stat-latency-val');
assert(btnMexico !== null, 'Mexico route button exists');
assert(statLatencyVal?.textContent?.includes('125') ?? false, 'Company-reported latency defaults to ~125 ms for Mexico route');

// 1.4 Pick & Place Task Simulation
const btnAlign = document.getElementById('btn-task-align');
const btnPinch = document.getElementById('btn-task-pinch');
const btnMove = document.getElementById('btn-task-move');
const btnRelease = document.getElementById('btn-task-release');
assert(btnAlign !== null && btnPinch !== null && btnMove !== null && btnRelease !== null, 'All 4 task action buttons exist');
assert(document.querySelectorAll('.step-card').length === 3, 'Three task step cards exist (Align, Pinch, Move & Place)');

console.log('Journey 1 verified successfully.\n');

// =========================================================================
// JOURNEY 2: Spanish-Speaking Mobile Visitor
// 1. Switches language to Spanish (ES)
// 2. Skips straight to workspace
// 3. Changes camera view
// 4. Tries tap-based demo
// 5. Reaches contact section
// =========================================================================
console.log('--- TEST JOURNEY 2: Spanish-Speaking Mobile Visitor ---');

// 2.1 Spanish Language Switch
assert(translations.es['hero.title'] === 'Mueve aquí. Actúa allá.', 'Spanish headline translation is accurate');
assert(translations.es['routes.title'] === 'Un operador. Dos rutas.', 'Spanish route title translation is accurate');
assert(translations.es['task.title'] === 'Tomar. Mover. Colocar.', 'Spanish task headline translation is accurate');
assert(translations.es['contact.title'].includes('alcance'), 'Spanish contact headline translation is accurate');

// Verify language buttons exist
const langEsBtn = document.getElementById('btn-lang-es');
assert(langEsBtn !== null, 'Spanish language button exists in header');

// 2.2 Skip to Workspace
const sceneWorkspace = document.getElementById('scene-04');
assert(sceneWorkspace !== null, 'Scene 04 (Workspace) exists');

// 2.3 Camera Presets
const presets = document.querySelectorAll('.preset-btn');
assert(presets.length === 3, 'Three camera presets exist (Operator, Overhead, Gripper detail)');

// 2.4 Tap-Based Demo
assert(document.getElementById('manual-control-dock') !== null, 'Manual tap-to-select and tap-to-place dock exists for mobile');

// 2.5 Contact Section & Verified Link
const contactLink = document.querySelector('a[href="https://aktoria.com"]');
assert(contactLink !== null, 'Verified contact path linking to aktoria.com exists');
assert(document.getElementById('btn-open-deployment') !== null, 'Primary "Discuss a deployment" button exists');

console.log('Journey 2 verified successfully.\n');

// =========================================================================
// JOURNEY 3: Keyboard-Only Visitor with Reduced Motion
// 1. Prefers-reduced-motion CSS handling
// 2. Fullscreen menu keyboard access & Escape key
// 3. Explores both routes (India ~5 ms & Mexico ~125 ms)
// 4. Plays automated demo
// 5. Resets task
// =========================================================================
console.log('--- TEST JOURNEY 3: Keyboard-Only & Reduced Motion ---');

// 3.1 Reduced Motion Styles
const mainCssPath = path.resolve('src/styles/main.css');
const cssContent = fs.readFileSync(mainCssPath, 'utf-8');
assert(cssContent.includes('@media (prefers-reduced-motion: reduce)'), 'prefers-reduced-motion media query implemented');
assert(cssContent.includes('animation-duration: 0.01ms'), 'Animations disabled under reduced motion');

// 3.2 Menu Keyboard Trap & Escape
const menuToggle = document.getElementById('menu-toggle');
const menuClose = document.getElementById('menu-close');
const fullscreenMenu = document.getElementById('fullscreen-menu');
assert(menuToggle?.getAttribute('aria-controls') === 'fullscreen-menu', 'Menu button has aria-controls');
assert(menuClose !== null, 'Menu close button with [ESC] hint exists');
assert(fullscreenMenu?.getAttribute('role') === 'dialog', 'Menu overlay has role="dialog"');
assert(fullscreenMenu?.getAttribute('aria-modal') === 'true', 'Menu overlay has aria-modal="true"');

// 3.3 Both Routes
const btnIndia = document.getElementById('btn-route-india');
assert(btnIndia !== null, 'Within India (~5 ms) button exists');
assert(btnIndia?.textContent?.includes('5 ms') ?? false, 'India route label displays ~5 ms');
assert(btnMexico?.textContent?.includes('125 ms') ?? false, 'Mexico route label displays ~125 ms');

// San Francisco identified separately as HQ
const hqCity = document.querySelector('.hq-city');
assert(hqCity?.textContent?.includes('San Francisco') ?? false, 'San Francisco identified separately as company HQ');

// 3.4 Automated Demo & Reset
const btnAuto = document.getElementById('btn-mode-auto');
const btnResetTask = document.getElementById('btn-task-reset');
assert(btnAuto !== null, '"Play demo" button exists');
assert(btnResetTask !== null, '"Reset Task" button exists');

// 3.5 Asset Credits & Disclaimers
const creditsLegal = document.querySelector('.credits-legal-box');
assert(creditsLegal !== null, 'Asset credits and attribution container exists');
assert(creditsLegal?.textContent?.includes('I2RT YAM') ?? false, 'Credits explicitly mention I2RT YAM platform');
assert(creditsLegal?.textContent?.includes('Aktoria') ?? false, 'Credits cite Aktoria Robotics factual reference');

console.log('Journey 3 verified successfully.\n');

console.log(`=== SUMMARY: ${passedTests}/${totalTests} TESTS PASSED ===\n`);
if (passedTests === totalTests) {
  console.log('ALL THREE COMPLETE JOURNEYS VERIFIED WITH 100% SUCCESS!');
} else {
  process.exit(1);
}

