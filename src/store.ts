export type RouteOption = 'india' | 'mexico';
export type CameraPreset = 'operator' | 'overhead' | 'detail';
export type TaskMode = 'auto' | 'manual';
export type TaskStep = 1 | 2 | 3;

export interface Point2D {
  x: number;
  y: number;
}

export interface AppState {
  currentScene: string;
  selectedRoute: RouteOption;
  selectedCamera: CameraPreset;
  layers: {
    labels: boolean;
    grid: boolean;
    path: boolean;
  };
  inspectHotspot: 'base' | 'arm' | 'gripper';
  inspectDividerRatio: number; // 0 to 1
  heroHandle: {
    x: number;
    y: number;
    isDragging: boolean;
    hasMoved: boolean;
    trace: Point2D[];
  };
  task: {
    mode: TaskMode;
    step: TaskStep;
    gripperAligned: boolean;
    clamped: boolean;
    pieceMoved: boolean;
    completed: boolean;
    gripperPos: { x: number; y: number; z: number };
    recordedPath: Array<{ x: number; y: number; z: number }>;
  };
}

class Store {
  private state: AppState = {
    currentScene: 'scene-01',
    selectedRoute: 'mexico',
    selectedCamera: 'operator',
    layers: {
      labels: true,
      grid: true,
      path: true,
    },
    inspectHotspot: 'base',
    inspectDividerRatio: 0.5,
    heroHandle: {
      x: 0,
      y: 0,
      isDragging: false,
      hasMoved: false,
      trace: [],
    },
    task: {
      mode: 'auto',
      step: 1,
      gripperAligned: false,
      clamped: false,
      pieceMoved: false,
      completed: false,
      gripperPos: { x: 0, y: 1.2, z: 0.3 },
      recordedPath: [],
    },
  };

  private listeners: Set<(state: AppState) => void> = new Set();

  public getState(): AppState {
    return this.state;
  }

  public subscribe(fn: (state: AppState) => void) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  public update(updater: (state: AppState) => void) {
    updater(this.state);
    this.notify();
  }

  private notify() {
    this.listeners.forEach((fn) => fn(this.state));
  }
}

export const store = new Store();

