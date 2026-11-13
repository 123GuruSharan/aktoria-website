import * as THREE from 'three';

/**
 * Procedural 3D model of the I2RT YAM-06 6-DOF Robotic Manipulator
 * Featuring DM-series brushless actuators, carbon-fiber linkages,
 * and a 95mm wide-throw linear parallel gripper.
 */
export class YAMArmModel {
  public group: THREE.Group;
  
  // Joint Groups for Forward Kinematics
  public baseJoint: THREE.Group;
  public shoulderJoint: THREE.Group;
  public elbowJoint: THREE.Group;
  public wristPitchJoint: THREE.Group;
  public wristRollJoint: THREE.Group;
  public gripperGroup: THREE.Group;
  
  // Gripper Jaws
  public jawLeft: THREE.Mesh;
  public jawRight: THREE.Mesh;

  // Materials
  private matCarbonDark: THREE.MeshStandardMaterial;
  private matAnodizedBlack: THREE.MeshStandardMaterial;
  private matBrushedSteel: THREE.MeshStandardMaterial;
  private matSignalOrange: THREE.MeshStandardMaterial;
  private matRubberPad: THREE.MeshStandardMaterial;

  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'YAM_Manipulator_Root';

    // Initialize Industrial Materials
    this.matCarbonDark = new THREE.MeshStandardMaterial({
      color: 0x181a1d,
      roughness: 0.5,
      metalness: 0.2,
    });

    this.matAnodizedBlack = new THREE.MeshStandardMaterial({
      color: 0x111316,
      roughness: 0.3,
      metalness: 0.85,
    });

    this.matBrushedSteel = new THREE.MeshStandardMaterial({
      color: 0xc8cdd3,
      roughness: 0.25,
      metalness: 0.95,
    });

    this.matSignalOrange = new THREE.MeshStandardMaterial({
      color: 0xff5000,
      roughness: 0.2,
      metalness: 0.4,
      emissive: 0x551100,
      emissiveIntensity: 0.2,
    });

    this.matRubberPad = new THREE.MeshStandardMaterial({
      color: 0xff5000,
      roughness: 0.8,
      metalness: 0.05,
    });

    // 1. Base Mounting Pedestal (Fixed)
    const pedestalGeo = new THREE.CylinderGeometry(0.12, 0.14, 0.04, 32);
    const pedestalMesh = new THREE.Mesh(pedestalGeo, this.matAnodizedBlack);
    pedestalMesh.position.y = 0.02;
    pedestalMesh.castShadow = true;
    pedestalMesh.receiveShadow = true;
    this.group.add(pedestalMesh);

    // Pedestal bolt details
    for (let i = 0; i < 4; i++) {
      const angle = (i * Math.PI) / 2 + Math.PI / 4;
      const bolt = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.045, 12), this.matBrushedSteel);
      bolt.position.set(Math.cos(angle) * 0.12, 0.025, Math.sin(angle) * 0.12);
      this.group.add(bolt);
    }

    // 2. Base Yaw Joint (Rotates around Y)
    this.baseJoint = new THREE.Group();
    this.baseJoint.position.y = 0.04;
    this.group.add(this.baseJoint);

    const baseHousing = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.08, 32), this.matAnodizedBlack);
    baseHousing.position.y = 0.04;
    baseHousing.castShadow = true;
    this.baseJoint.add(baseHousing);

    // Orange accent ring on base
    const baseOrangeRing = new THREE.Mesh(new THREE.TorusGeometry(0.092, 0.004, 16, 32), this.matSignalOrange);
    baseOrangeRing.rotation.x = Math.PI / 2;
    baseOrangeRing.position.y = 0.04;
    this.baseJoint.add(baseOrangeRing);

    // Shoulder fork bracket
    const forkLeft = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.14, 0.06), this.matCarbonDark);
    forkLeft.position.set(0.065, 0.12, 0);
    forkLeft.castShadow = true;
    this.baseJoint.add(forkLeft);

    const forkRight = forkLeft.clone();
    forkRight.position.x = -0.065;
    this.baseJoint.add(forkRight);

    // 3. Shoulder Pitch Joint (DM6248 Actuator)
    this.shoulderJoint = new THREE.Group();
    this.shoulderJoint.position.set(0, 0.17, 0);
    this.baseJoint.add(this.shoulderJoint);

    const shoulderActuator = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.14, 32), this.matAnodizedBlack);
    shoulderActuator.rotation.z = Math.PI / 2;
    shoulderActuator.castShadow = true;
    this.shoulderJoint.add(shoulderActuator);

    const shoulderOrangeCap = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.145, 24), this.matSignalOrange);
    shoulderOrangeCap.rotation.z = Math.PI / 2;
    this.shoulderJoint.add(shoulderOrangeCap);

    // Upper Arm Spar (Link 1, ~0.34m length)
    const upperArm = new THREE.Group();
    const sparGeo = new THREE.BoxGeometry(0.045, 0.34, 0.04);
    const sparMesh = new THREE.Mesh(sparGeo, this.matCarbonDark);
    sparMesh.position.y = 0.17;
    sparMesh.castShadow = true;
    upperArm.add(sparMesh);

    // Longitudinal Orange Pinstripe on Upper Arm
    const pinstripe = new THREE.Mesh(new THREE.BoxGeometry(0.048, 0.28, 0.005), this.matSignalOrange);
    pinstripe.position.set(0, 0.17, 0.021);
    upperArm.add(pinstripe);

    this.shoulderJoint.add(upperArm);

    // 4. Elbow Pitch Joint (DM4340 Actuator)
    this.elbowJoint = new THREE.Group();
    this.elbowJoint.position.set(0, 0.34, 0);
    upperArm.add(this.elbowJoint);

    const elbowActuator = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.11, 32), this.matAnodizedBlack);
    elbowActuator.rotation.z = Math.PI / 2;
    elbowActuator.castShadow = true;
    this.elbowJoint.add(elbowActuator);

    const elbowBearing = new THREE.Mesh(new THREE.TorusGeometry(0.051, 0.003, 16, 32), this.matBrushedSteel);
    elbowBearing.rotation.y = Math.PI / 2;
    this.elbowJoint.add(elbowBearing);

    // Forearm Spar (Link 2, ~0.30m length)
    const forearm = new THREE.Group();
    const forearmMesh = new THREE.Mesh(new THREE.BoxGeometry(0.038, 0.30, 0.035), this.matCarbonDark);
    forearmMesh.position.y = 0.15;
    forearmMesh.castShadow = true;
    forearm.add(forearmMesh);

    this.elbowJoint.add(forearm);

    // 5. Wrist Pitch Joint
    this.wristPitchJoint = new THREE.Group();
    this.wristPitchJoint.position.set(0, 0.30, 0);
    forearm.add(this.wristPitchJoint);

    const wristPitchMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.08, 24), this.matAnodizedBlack);
    wristPitchMesh.rotation.z = Math.PI / 2;
    this.wristPitchJoint.add(wristPitchMesh);

    // 6. Wrist Roll Joint
    this.wristRollJoint = new THREE.Group();
    this.wristRollJoint.position.set(0, 0.04, 0);
    this.wristPitchJoint.add(this.wristRollJoint);

    const wristRollMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.034, 0.05, 24), this.matAnodizedBlack);
    wristRollMesh.position.y = 0.025;
    this.wristRollJoint.add(wristRollMesh);

    // 7. 95mm Linear Parallel Gripper
    this.gripperGroup = new THREE.Group();
    this.gripperGroup.position.set(0, 0.05, 0);
    this.wristRollJoint.add(this.gripperGroup);

    // Gripper Palm Base
    const palm = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.03, 0.05), this.matAnodizedBlack);
    palm.position.y = 0.015;
    palm.castShadow = true;
    this.gripperGroup.add(palm);

    // Linear Slide Rail
    const slideRail = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.008, 0.015), this.matBrushedSteel);
    slideRail.position.y = 0.032;
    this.gripperGroup.add(slideRail);

    // Center optical sensor dot
    const centerSensor = new THREE.Mesh(new THREE.SphereGeometry(0.004, 16, 16), this.matSignalOrange);
    centerSensor.position.set(0, 0.034, 0.02);
    this.gripperGroup.add(centerSensor);

    // Left Finger Jaw Assembly
    const jawGeo = new THREE.BoxGeometry(0.012, 0.08, 0.025);
    this.jawLeft = new THREE.Mesh(jawGeo, this.matAnodizedBlack);
    this.jawLeft.position.set(-0.042, 0.07, 0);
    this.jawLeft.castShadow = true;
    this.gripperGroup.add(this.jawLeft);

    const padLeft = new THREE.Mesh(new THREE.BoxGeometry(0.004, 0.04, 0.022), this.matRubberPad);
    padLeft.position.set(0.006, 0.015, 0);
    this.jawLeft.add(padLeft);

    // Right Finger Jaw Assembly
    this.jawRight = new THREE.Mesh(jawGeo, this.matAnodizedBlack);
    this.jawRight.position.set(0.042, 0.07, 0);
    this.jawRight.castShadow = true;
    this.gripperGroup.add(this.jawRight);

    const padRight = new THREE.Mesh(new THREE.BoxGeometry(0.004, 0.04, 0.022), this.matRubberPad);
    padRight.position.set(-0.006, 0.015, 0);
    this.jawRight.add(padRight);

    // Set Default Natural Rest Pose
    this.setJointAngles(0, 0.45, 0.85, -0.4, 0);
    this.setGripperOpening(0.084); // Open ~84mm
  }

  /**
   * Set joint angles in radians
   */
  public setJointAngles(j1: number, j2: number, j3: number, j4: number, j5: number) {
    this.baseJoint.rotation.y = j1;
    this.shoulderJoint.rotation.x = j2;
    this.elbowJoint.rotation.x = j3;
    this.wristPitchJoint.rotation.x = j4;
    this.wristRollJoint.rotation.y = j5;
  }

  /**
   * Set linear gripper opening width (0.01m to 0.095m)
   */
  public setGripperOpening(apertureMeters: number) {
    const halfWidth = Math.max(0.01, Math.min(0.095, apertureMeters)) / 2;
    this.jawLeft.position.x = -halfWidth;
    this.jawRight.position.x = halfWidth;
  }

  /**
   * Returns current world position of the gripper pinch center point
   */
  public getGripperWorldPosition(targetVec: THREE.Vector3): THREE.Vector3 {
    this.gripperGroup.getWorldPosition(targetVec);
    // Offset slightly downwards along gripper fingers
    const offset = new THREE.Vector3(0, 0.07, 0).applyQuaternion(this.gripperGroup.getWorldQuaternion(new THREE.Quaternion()));
    targetVec.add(offset);
    return targetVec;
  }
}

