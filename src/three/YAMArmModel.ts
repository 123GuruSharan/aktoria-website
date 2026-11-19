import * as THREE from 'three';

/**
 * Procedural 3D model of the I2RT YAM-06 6-DOF Robotic Manipulator
 * Featuring authentic Ivory slotted links, Matte-Black rotary actuators with perimeter hex bolts,
 * braided black cable conduit, and a 95mm linear parallel gripper.
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
  private matIvoryLink: THREE.MeshStandardMaterial;
  private matSlotRecess: THREE.MeshStandardMaterial;
  private matAnodizedBlack: THREE.MeshStandardMaterial;
  private matBrushedSteel: THREE.MeshStandardMaterial;
  private matSignalOrange: THREE.MeshStandardMaterial;
  private matRubberPad: THREE.MeshStandardMaterial;
  private matBraidedCable: THREE.MeshStandardMaterial;

  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'YAM_Manipulator_Root';

    // 1. Initialize Industrial Materials
    this.matIvoryLink = new THREE.MeshStandardMaterial({
      color: 0xeae6df, // Authentic warm ivory matching photographic arm
      roughness: 0.35,
      metalness: 0.08,
    });

    this.matSlotRecess = new THREE.MeshStandardMaterial({
      color: 0x141619, // Deep graphite inner cutout slot
      roughness: 0.7,
      metalness: 0.2,
    });

    this.matAnodizedBlack = new THREE.MeshStandardMaterial({
      color: 0x121417, // Matte anodized black for actuator housings
      roughness: 0.32,
      metalness: 0.85,
    });

    this.matBrushedSteel = new THREE.MeshStandardMaterial({
      color: 0xd8dde3, // Stainless steel hex bolts & linear rails
      roughness: 0.2,
      metalness: 0.95,
    });

    this.matSignalOrange = new THREE.MeshStandardMaterial({
      color: 0xff5000,
      roughness: 0.2,
      metalness: 0.4,
      emissive: 0x441100,
      emissiveIntensity: 0.25,
    });

    this.matRubberPad = new THREE.MeshStandardMaterial({
      color: 0xff5000,
      roughness: 0.85,
      metalness: 0.05,
    });

    this.matBraidedCable = new THREE.MeshStandardMaterial({
      color: 0x1a1c20,
      roughness: 0.8,
      metalness: 0.1,
    });

    // 2. Base Pedestal (Matte Black with 4 Steel Mounting Bolts)
    const pedestalGeo = new THREE.CylinderGeometry(0.12, 0.14, 0.04, 32);
    const pedestalMesh = new THREE.Mesh(pedestalGeo, this.matAnodizedBlack);
    pedestalMesh.position.y = 0.02;
    pedestalMesh.castShadow = true;
    pedestalMesh.receiveShadow = true;
    this.group.add(pedestalMesh);

    // 4x Perimeter Mounting Hex Bolts
    for (let i = 0; i < 4; i++) {
      const angle = (i * Math.PI) / 2 + Math.PI / 4;
      const bolt = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.009, 0.045, 12), this.matBrushedSteel);
      bolt.position.set(Math.cos(angle) * 0.12, 0.025, Math.sin(angle) * 0.12);
      bolt.castShadow = true;
      this.group.add(bolt);
    }

    // Silkscreen Brand Mark on Base Pedestal
    const brandStrip = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.008, 0.002), this.matSignalOrange);
    brandStrip.position.set(0, 0.025, 0.138);
    this.group.add(brandStrip);

    // 3. Base Yaw Joint (Rotates around Y-axis)
    this.baseJoint = new THREE.Group();
    this.baseJoint.position.y = 0.04;
    this.group.add(this.baseJoint);

    const baseHousing = new THREE.Mesh(new THREE.CylinderGeometry(0.092, 0.092, 0.08, 32), this.matAnodizedBlack);
    baseHousing.position.y = 0.04;
    baseHousing.castShadow = true;
    this.baseJoint.add(baseHousing);

    // Signal orange accent ring on base
    const baseOrangeRing = new THREE.Mesh(new THREE.TorusGeometry(0.094, 0.0035, 16, 32), this.matSignalOrange);
    baseOrangeRing.rotation.x = Math.PI / 2;
    baseOrangeRing.position.y = 0.04;
    this.baseJoint.add(baseOrangeRing);

    // Shoulder fork brackets
    const forkLeft = new THREE.Mesh(new THREE.BoxGeometry(0.028, 0.14, 0.065), this.matAnodizedBlack);
    forkLeft.position.set(0.066, 0.12, 0);
    forkLeft.castShadow = true;
    this.baseJoint.add(forkLeft);

    const forkRight = forkLeft.clone();
    forkRight.position.x = -0.066;
    this.baseJoint.add(forkRight);

    // 4. Shoulder Pitch Joint (DM-series Actuator Drum with Perimeter Bolts)
    this.shoulderJoint = new THREE.Group();
    this.shoulderJoint.position.set(0, 0.17, 0);
    this.baseJoint.add(this.shoulderJoint);

    const shoulderActuator = new THREE.Mesh(new THREE.CylinderGeometry(0.064, 0.064, 0.145, 32), this.matAnodizedBlack);
    shoulderActuator.rotation.z = Math.PI / 2;
    shoulderActuator.castShadow = true;
    this.shoulderJoint.add(shoulderActuator);

    // Perimeter silver bolts on shoulder drum
    for (let i = 0; i < 6; i++) {
      const bAngle = (i * Math.PI) / 3;
      const shBolt = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.15, 8), this.matBrushedSteel);
      shBolt.rotation.z = Math.PI / 2;
      shBolt.position.set(0, Math.cos(bAngle) * 0.048, Math.sin(bAngle) * 0.048);
      this.shoulderJoint.add(shBolt);
    }

    // 5. Upper Arm Spar (Link 1 — Ivory Slotted Link ~0.34m length)
    const upperArm = new THREE.Group();
    
    // Main Ivory Link Spar
    const upperSpar = new THREE.Mesh(new THREE.BoxGeometry(0.048, 0.34, 0.042), this.matIvoryLink);
    upperSpar.position.y = 0.17;
    upperSpar.castShadow = true;
    upperSpar.receiveShadow = true;
    upperArm.add(upperSpar);

    // Slotted hollow cutout in center of ivory link (matches photo)
    const upperSlot = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.22, 0.022), this.matSlotRecess);
    upperSlot.position.set(0, 0.17, 0);
    upperArm.add(upperSlot);

    // Cable guide clip and braided cable segment
    const clip1 = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.016, 0.05), this.matAnodizedBlack);
    clip1.position.set(0.026, 0.17, 0);
    upperArm.add(clip1);

    const cableCurve1 = new THREE.CubicBezierCurve3(
      new THREE.Vector3(0.032, 0.02, 0.03),
      new THREE.Vector3(0.04, 0.12, 0.04),
      new THREE.Vector3(0.04, 0.24, 0.04),
      new THREE.Vector3(0.032, 0.34, 0.02)
    );
    const cableMesh1 = new THREE.Mesh(new THREE.TubeGeometry(cableCurve1, 16, 0.007, 8, false), this.matBraidedCable);
    cableMesh1.castShadow = true;
    upperArm.add(cableMesh1);

    this.shoulderJoint.add(upperArm);

    // 6. Elbow Pitch Joint (Rotary Drum with Silver Perimeter Bolts)
    this.elbowJoint = new THREE.Group();
    this.elbowJoint.position.set(0, 0.34, 0);
    upperArm.add(this.elbowJoint);

    const elbowActuator = new THREE.Mesh(new THREE.CylinderGeometry(0.054, 0.054, 0.115, 32), this.matAnodizedBlack);
    elbowActuator.rotation.z = Math.PI / 2;
    elbowActuator.castShadow = true;
    this.elbowJoint.add(elbowActuator);

    for (let i = 0; i < 6; i++) {
      const bAngle = (i * Math.PI) / 3;
      const elBolt = new THREE.Mesh(new THREE.CylinderGeometry(0.0035, 0.0035, 0.12, 8), this.matBrushedSteel);
      elBolt.rotation.z = Math.PI / 2;
      elBolt.position.set(0, Math.cos(bAngle) * 0.04, Math.sin(bAngle) * 0.04);
      this.elbowJoint.add(elBolt);
    }

    // 7. Forearm Spar (Link 2 — Ivory Slotted Link ~0.30m length)
    const forearm = new THREE.Group();
    const forearmMesh = new THREE.Mesh(new THREE.BoxGeometry(0.042, 0.30, 0.038), this.matIvoryLink);
    forearmMesh.position.y = 0.15;
    forearmMesh.castShadow = true;
    forearmMesh.receiveShadow = true;
    forearm.add(forearmMesh);

    // Slotted cutout in forearm
    const forearmSlot = new THREE.Mesh(new THREE.BoxGeometry(0.044, 0.18, 0.018), this.matSlotRecess);
    forearmSlot.position.set(0, 0.15, 0);
    forearm.add(forearmSlot);

    // Forearm braided cable segment
    const cableCurve2 = new THREE.CubicBezierCurve3(
      new THREE.Vector3(0.028, 0.02, 0.025),
      new THREE.Vector3(0.034, 0.10, 0.03),
      new THREE.Vector3(0.034, 0.20, 0.03),
      new THREE.Vector3(0.026, 0.29, 0.02)
    );
    const cableMesh2 = new THREE.Mesh(new THREE.TubeGeometry(cableCurve2, 16, 0.006, 8, false), this.matBraidedCable);
    cableMesh2.castShadow = true;
    forearm.add(cableMesh2);

    this.elbowJoint.add(forearm);

    // 8. Wrist Pitch Joint
    this.wristPitchJoint = new THREE.Group();
    this.wristPitchJoint.position.set(0, 0.30, 0);
    forearm.add(this.wristPitchJoint);

    const wristPitchMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.038, 0.085, 24), this.matAnodizedBlack);
    wristPitchMesh.rotation.z = Math.PI / 2;
    wristPitchMesh.castShadow = true;
    this.wristPitchJoint.add(wristPitchMesh);

    // 9. Wrist Roll Joint
    this.wristRollJoint = new THREE.Group();
    this.wristRollJoint.position.set(0, 0.04, 0);
    this.wristPitchJoint.add(this.wristRollJoint);

    const wristRollMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.034, 0.036, 0.05, 24), this.matAnodizedBlack);
    wristRollMesh.position.y = 0.025;
    wristRollMesh.castShadow = true;
    this.wristRollJoint.add(wristRollMesh);

    // 10. 95mm Linear Parallel Gripper
    this.gripperGroup = new THREE.Group();
    this.gripperGroup.position.set(0, 0.05, 0);
    this.wristRollJoint.add(this.gripperGroup);

    // Gripper Palm Base (Matte Black)
    const palm = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.03, 0.05), this.matAnodizedBlack);
    palm.position.y = 0.015;
    palm.castShadow = true;
    this.gripperGroup.add(palm);

    // Linear Slide Rail (Stainless Steel)
    const slideRail = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.008, 0.015), this.matBrushedSteel);
    slideRail.position.y = 0.032;
    this.gripperGroup.add(slideRail);

    // Center optical sensor dot (Signal Orange)
    const centerSensor = new THREE.Mesh(new THREE.SphereGeometry(0.004, 16, 16), this.matSignalOrange);
    centerSensor.position.set(0, 0.034, 0.02);
    this.gripperGroup.add(centerSensor);

    // Left Finger Jaw Assembly
    const jawGeo = new THREE.BoxGeometry(0.014, 0.08, 0.026);
    this.jawLeft = new THREE.Mesh(jawGeo, this.matAnodizedBlack);
    this.jawLeft.position.set(-0.042, 0.07, 0);
    this.jawLeft.castShadow = true;
    this.gripperGroup.add(this.jawLeft);

    const padLeft = new THREE.Mesh(new THREE.BoxGeometry(0.004, 0.04, 0.022), this.matRubberPad);
    padLeft.position.set(0.007, 0.015, 0);
    this.jawLeft.add(padLeft);

    // Right Finger Jaw Assembly
    this.jawRight = new THREE.Mesh(jawGeo, this.matAnodizedBlack);
    this.jawRight.position.set(0.042, 0.07, 0);
    this.jawRight.castShadow = true;
    this.gripperGroup.add(this.jawRight);

    const padRight = new THREE.Mesh(new THREE.BoxGeometry(0.004, 0.04, 0.022), this.matRubberPad);
    padRight.position.set(-0.007, 0.015, 0);
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
    const offset = new THREE.Vector3(0, 0.07, 0).applyQuaternion(
      this.gripperGroup.getWorldQuaternion(new THREE.Quaternion())
    );
    targetVec.add(offset);
    return targetVec;
  }
}
