import * as THREE from 'three';

export class WorkcellEnvironment {
  public group: THREE.Group;
  public tableGroup: THREE.Group;
  public workpieceMesh: THREE.Mesh;
  public targetZoneGroup: THREE.Group;
  public floorGrid: THREE.GridHelper;
  public motionPathGroup: THREE.Group;
  private pathLine: THREE.Line;

  // Target zone highlight materials
  private targetBorderMat: THREE.LineBasicMaterial;
  private targetFillMesh: THREE.Mesh;

  // Workpiece material
  private pieceMat: THREE.MeshStandardMaterial;

  // Dynamic Live Gripper Trajectory Line
  public liveTrajectoryLine: THREE.Line;
  private trajectoryPoints: THREE.Vector3[] = [];
  private maxTrajectoryPoints = 120;
  private trajectoryGeometry: THREE.BufferGeometry;

  // Workpiece Coordinates
  public readonly initialPiecePos = new THREE.Vector3(0.18, 0.44, 0.22);
  public readonly targetDropPos = new THREE.Vector3(-0.18, 0.44, 0.22);

  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'WorkcellEnvironment';

    // 1. Floor Grid (Restrained Millimeter Precision Matrix)
    this.floorGrid = new THREE.GridHelper(3.0, 30, 0xff5000, 0x22262c);
    this.floorGrid.position.y = 0;
    this.group.add(this.floorGrid);

    // Subtle dark floor plane for catching soft contact shadows
    const floorGeo = new THREE.PlaneGeometry(6, 6);
    const floorMat = new THREE.ShadowMaterial({ opacity: 0.4 });
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.receiveShadow = true;
    this.group.add(floorMesh);

    // 2. Heavy-Duty Teleoperation Workbench Table
    this.tableGroup = new THREE.Group();
    this.tableGroup.position.set(0, 0, 0.15);
    this.group.add(this.tableGroup);

    // Table Top (Brushed Aluminum / Steel)
    const tableTopGeo = new THREE.BoxGeometry(0.85, 0.05, 0.65);
    const tableTopMat = new THREE.MeshStandardMaterial({
      color: 0x1d2024,
      roughness: 0.3,
      metalness: 0.85,
    });
    const tableTop = new THREE.Mesh(tableTopGeo, tableTopMat);
    tableTop.position.y = 0.38;
    tableTop.castShadow = true;
    tableTop.receiveShadow = true;
    this.tableGroup.add(tableTop);

    // Signal orange table rim highlight
    const rimMat = new THREE.MeshStandardMaterial({ color: 0xff5000, roughness: 0.3 });
    const tableRim = new THREE.Mesh(new THREE.BoxGeometry(0.86, 0.006, 0.66), rimMat);
    tableRim.position.y = 0.405;
    this.tableGroup.add(tableRim);

    // Table Legs (4x Dark Tubular Steel)
    const legGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.38, 16);
    const legMat = new THREE.MeshStandardMaterial({ color: 0x111316, roughness: 0.4, metalness: 0.8 });
    const legPositions = [
      [-0.38, 0.19, -0.28],
      [0.38, 0.19, -0.28],
      [-0.38, 0.19, 0.28],
      [0.38, 0.19, 0.28],
    ];
    legPositions.forEach(([x, y, z]) => {
      const leg = new THREE.Mesh(legGeo, legMat);
      leg.position.set(x, y, z);
      leg.castShadow = true;
      this.tableGroup.add(leg);
    });

    // Optomechanical AR Fiducial Markers on Table Surface (AprilTag style)
    const fiducialMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const fiducialBorderMat = new THREE.MeshBasicMaterial({ color: 0x0c0d0f });
    const fiducialCoords = [
      [-0.35, 0.406, -0.24],
      [0.35, 0.406, -0.24],
      [-0.35, 0.406, 0.24],
      [0.35, 0.406, 0.24],
    ];
    fiducialCoords.forEach(([x, y, z]) => {
      const border = new THREE.Mesh(new THREE.PlaneGeometry(0.04, 0.04), fiducialBorderMat);
      border.rotation.x = -Math.PI / 2;
      border.position.set(x, y, z);
      const inner = new THREE.Mesh(new THREE.PlaneGeometry(0.024, 0.024), fiducialMat);
      inner.rotation.x = -Math.PI / 2;
      inner.position.set(x, y + 0.001, z);
      this.tableGroup.add(border);
      this.tableGroup.add(inner);
    });

    // 3. The Workpiece (One Authentic Signal Orange Machined Cylinder)
    const pieceGeo = new THREE.CylinderGeometry(0.022, 0.022, 0.065, 32);
    this.pieceMat = new THREE.MeshStandardMaterial({
      color: 0xff5000, // Signal Orange workpiece per requirement
      roughness: 0.25,
      metalness: 0.4,
      emissive: 0x331100,
      emissiveIntensity: 0.2,
    });
    this.workpieceMesh = new THREE.Mesh(pieceGeo, this.pieceMat);
    this.workpieceMesh.position.copy(this.initialPiecePos);
    this.workpieceMesh.castShadow = true;
    this.workpieceMesh.receiveShadow = true;
    this.group.add(this.workpieceMesh);

    // Initial Pick Origin Marker Ring
    const pickRing = new THREE.Mesh(
      new THREE.RingGeometry(0.026, 0.032, 32),
      new THREE.MeshBasicMaterial({ color: 0xff5000, side: THREE.DoubleSide })
    );
    pickRing.rotation.x = -Math.PI / 2;
    pickRing.position.set(this.initialPiecePos.x, 0.406, this.initialPiecePos.z);
    this.group.add(pickRing);

    // 4. Target Destination Placement Zone (Clearly Outlined Placement Target)
    this.targetZoneGroup = new THREE.Group();
    this.targetZoneGroup.position.copy(this.targetDropPos);
    this.targetZoneGroup.position.y = 0.406;
    this.group.add(this.targetZoneGroup);

    // Target fill surface (illuminates on highlight)
    this.targetFillMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(0.08, 0.08),
      new THREE.MeshBasicMaterial({ color: 0xff5000, transparent: true, opacity: 0.1 })
    );
    this.targetFillMesh.rotation.x = -Math.PI / 2;
    this.targetZoneGroup.add(this.targetFillMesh);

    // Square boundary outline
    this.targetBorderMat = new THREE.LineBasicMaterial({ color: 0xff5000, linewidth: 2 });
    const targetBorder = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.PlaneGeometry(0.08, 0.08)),
      this.targetBorderMat
    );
    targetBorder.rotation.x = -Math.PI / 2;
    this.targetZoneGroup.add(targetBorder);

    // Center crosshair
    const crossGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-0.02, 0.001, 0),
      new THREE.Vector3(0.02, 0.001, 0),
      new THREE.Vector3(0, 0.001, -0.02),
      new THREE.Vector3(0, 0.001, 0.02),
    ]);
    const crossMat = new THREE.LineBasicMaterial({ color: 0xff5000 });
    const crossLine = new THREE.LineSegments(crossGeo, crossMat);
    this.targetZoneGroup.add(crossLine);

    // 5. 3D Motion Path Spline (Luminous Orange Arc from Origin to Destination)
    this.motionPathGroup = new THREE.Group();
    this.group.add(this.motionPathGroup);

    const curve = new THREE.QuadraticBezierCurve3(
      this.initialPiecePos.clone().add(new THREE.Vector3(0, 0.04, 0)),
      new THREE.Vector3(0, 0.65, 0.22), // Arch apex
      this.targetDropPos.clone().add(new THREE.Vector3(0, 0.04, 0))
    );
    const points = curve.getPoints(40);
    const pathGeo = new THREE.BufferGeometry().setFromPoints(points);
    const pathMat = new THREE.LineDashedMaterial({
      color: 0xff5000,
      dashSize: 0.02,
      gapSize: 0.01,
      linewidth: 2,
    });
    this.pathLine = new THREE.Line(pathGeo, pathMat);
    this.pathLine.computeLineDistances();
    this.motionPathGroup.add(this.pathLine);

    // Waypoint dots along the curve
    [points[0], points[20], points[40]].forEach((pt) => {
      const dot = new THREE.Mesh(
        new THREE.SphereGeometry(0.006, 16, 16),
        new THREE.MeshBasicMaterial({ color: 0xff5000 })
      );
      dot.position.copy(pt);
      this.motionPathGroup.add(dot);
    });

    // 6. Dynamic Live Gripper Trajectory Ribbon
    const posBuffer = new Float32Array(this.maxTrajectoryPoints * 3);
    this.trajectoryGeometry = new THREE.BufferGeometry();
    this.trajectoryGeometry.setAttribute('position', new THREE.BufferAttribute(posBuffer, 3));
    this.trajectoryGeometry.setDrawRange(0, 0);

    const liveMat = new THREE.LineBasicMaterial({
      color: 0xff5000,
      linewidth: 2,
      transparent: true,
      opacity: 0.9,
    });
    this.liveTrajectoryLine = new THREE.Line(this.trajectoryGeometry, liveMat);
    this.group.add(this.liveTrajectoryLine);
  }

  /**
   * Append a point to the live dynamic trajectory line
   */
  public addTrajectoryPoint(point: THREE.Vector3) {
    if (this.trajectoryPoints.length > 0) {
      const last = this.trajectoryPoints[this.trajectoryPoints.length - 1];
      if (last.distanceTo(point) < 0.005) return; // Ignore micro-jitters
    }

    if (this.trajectoryPoints.length >= this.maxTrajectoryPoints) {
      this.trajectoryPoints.shift();
    }
    this.trajectoryPoints.push(point.clone());

    const positions = this.trajectoryGeometry.attributes.position.array as Float32Array;
    for (let i = 0; i < this.trajectoryPoints.length; i++) {
      positions[i * 3] = this.trajectoryPoints[i].x;
      positions[i * 3 + 1] = this.trajectoryPoints[i].y;
      positions[i * 3 + 2] = this.trajectoryPoints[i].z;
    }
    this.trajectoryGeometry.attributes.position.needsUpdate = true;
    this.trajectoryGeometry.setDrawRange(0, this.trajectoryPoints.length);
  }

  public clearTrajectory() {
    this.trajectoryPoints = [];
    this.trajectoryGeometry.setDrawRange(0, 0);
  }

  public getTrajectoryPoints(): THREE.Vector3[] {
    return [...this.trajectoryPoints];
  }

  public setWorkpieceHighlighted(highlighted: boolean) {
    this.pieceMat.emissive.setHex(highlighted ? 0xff5000 : 0x331100);
    this.pieceMat.emissiveIntensity = highlighted ? 0.7 : 0.2;
    this.workpieceMesh.scale.setScalar(highlighted ? 1.08 : 1.0);
  }

  public setTargetHighlighted(highlighted: boolean) {
    (this.targetFillMesh.material as THREE.MeshBasicMaterial).opacity = highlighted ? 0.4 : 0.1;
    this.targetBorderMat.color.setHex(highlighted ? 0xffffff : 0xff5000);
    this.targetZoneGroup.scale.setScalar(highlighted ? 1.15 : 1.0);
  }

  public triggerPlacementPulse() {
    const origScale = 1.0;
    let frame = 0;
    const pulseAnim = () => {
      frame++;
      const s = 1.0 + 0.3 * Math.sin((frame / 20) * Math.PI);
      this.targetZoneGroup.scale.setScalar(s);
      if (frame < 20) {
        requestAnimationFrame(pulseAnim);
      } else {
        this.targetZoneGroup.scale.setScalar(origScale);
        this.setTargetHighlighted(false);
      }
    };
    pulseAnim();
  }

  public resetWorkpiece() {
    this.workpieceMesh.position.copy(this.initialPiecePos);
    this.workpieceMesh.rotation.set(0, 0, 0);
    this.setWorkpieceHighlighted(false);
    this.setTargetHighlighted(false);
    this.clearTrajectory();
  }

  public setGridVisible(visible: boolean) {
    this.floorGrid.visible = visible;
  }

  public setMotionPathVisible(visible: boolean) {
    this.motionPathGroup.visible = visible;
  }
}
