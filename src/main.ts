import { i18n } from './i18n.ts';
import { WorkcellScene } from './three/WorkcellScene.ts';
import { Navigation } from './components/Navigation.ts';
import { Scene01Hero } from './components/Scene01Hero.ts';
import { Scene02Inspection } from './components/Scene02Inspection.ts';
import { Scene03Distance } from './components/Scene03Distance.ts';
import { Scene04Workspace } from './components/Scene04Workspace.ts';
import { Scene05Task } from './components/Scene05Task.ts';
import { Scene06Contact } from './components/Scene06Contact.ts';
import { SharedTrace } from './components/SharedTrace.ts';

document.addEventListener('DOMContentLoaded', () => {
  // 1. Initialize Translations
  i18n.applyTranslations();

  // 2. Initialize Shared Three.js Scene (Reused across Scene 04 & Scene 05)
  const threeWrapper = document.getElementById('three-canvas-wrapper');
  let workcellScene: WorkcellScene | null = null;
  if (threeWrapper) {
    workcellScene = new WorkcellScene(threeWrapper);
  }

  // 3. Initialize UI Navigation & Global Trace
  new Navigation();
  new SharedTrace();

  // 4. Initialize Individual Exhibition Scenes
  new Scene01Hero();
  new Scene02Inspection();
  new Scene03Distance();

  if (workcellScene) {
    new Scene04Workspace(workcellScene);
    new Scene05Task(workcellScene);
  }

  new Scene06Contact();

  console.log('[Aktoria Robotics] Exhibition experience initialized.');
});

