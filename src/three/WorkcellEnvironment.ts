import * as THREE from 'three';

export class WorkcellEnvironment {
  public group: THREE.Group;
  public tableGroup: THREE.Group;
  public workpieceMesh: THREE.Mesh;
  public targetZoneGroup: THREE.Group;
  public floorGrid: THREE.GridHelper;
  public motionPathGroup: THREE.Group;
  private pathLine: THREE.Line;

  // Workpiece Coordinates
  public readonly initialPiecePos = new THREE.Vector3(0.18, 0.44, 0.22);
  public readonly targetDropPos = new THREE.Vector3(-0.18, 0.44, 0.22);

  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'WorkcellEnvironment';

    // 1. Floor Grid (Millimeter Precision Matrix)
    this.floorGrid = new THREE.GridHelper(3.0, 30, 0xff5000, 0x2a2f37);
    this.floorGrid.position.y = 0;
    this.group.add(this.floorGrid);

    // Subtle dark floor plane for catching shadows
    const floorGeo = new THREE.PlaneGeometry(6, 6);
    const floorMat = new THREE.ShadowMaterial({ opacity: 0.35 });
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

    // 3. The Workpiece (Machined Test Cylinder)
    const pieceGeo = new THREE.CylinderGeometry(0.022, 0.022, 0.065, 32);
    const pieceMat = new THREE.MeshStandardMaterial({
      color: 0x00e5ff, // High-contrast cyan anodized finish
      roughness: 0.2,
      metalness: 0.8,
      emissive: 0x003344,
      emissiveIntensity: 0.3,
    });
    this.workpieceMesh = new THREE.Mesh(pieceGeo, pieceMat);
    this.workpieceMesh.position.copy(this.initialPiecePos);
    this.workpieceMesh.castShadow = true;
    this.workpieceMesh.receiveShadow = true;
    this.group.add(this.workpieceMesh);

    // Initial Pick Origin Marker Ring
    const pickRing = new THREE.Mesh(
      new THREE.RingGeometry(0.025, 0.03, 32),
      new THREE.MeshBasicMaterial({ color: 0x00e5ff, side: THREE.DoubleSide })
    );
    pickRing.rotation.x = -Math.PI / 2;
    pickRing.position.set(this.initialPiecePos.x, 0.406, this.initialPiecePos.z);
    this.group.add(pickRing);

    // 4. Target Destination Placement Zone (Marked Inspection Box)
    this.targetZoneGroup = new THREE.Group();
    this.targetZoneGroup.position.copy(this.targetDropPos);
    this.targetZoneGroup.position.y = 0.406;
    this.group.add(this.targetZoneGroup);

    // Square boundary outline
    const targetBorder = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.PlaneGeometry(0.08, 0.08)),
      new THREE.LineBasicMaterial({ color: 0xff5000, linewidth: 2 })
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
      const dot = new THREE.Mesh(new THREE.SphereGeometry(0.006, 16, 16), new THREE.MeshBasicMaterial({ color: 0xff5000 }));
      dot.position.copy(pt);
      this.motionPathGroup.add(dot);
    });
  }

  public resetWorkpiece() {
    this.workpieceMesh.position.copy(this.initialPiecePos);
    this.workpieceMesh.rotation.set(0, 0, 0);
  }

  public setGridVisible(visible: boolean) {
    this.floorGrid.visible = visible;
  }

  public setMotionPathVisible(visible: boolean) {
    this.motionPathGroup.visible = visible;
  }
}

