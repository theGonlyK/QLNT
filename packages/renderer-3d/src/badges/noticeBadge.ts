import * as THREE from 'three';

export type NoticeBadgeType = 'PAYMENT_DUE' | 'BILL_PENDING' | 'BROKEN' | 'NONE';

export const NOTICE_COLORS = {
  PAYMENT_DUE: 0xf59e0b, // Amber / Yellow
  BILL_PENDING: 0xf59e0b, // Amber / Yellow
  BROKEN: 0xef4444, // Red
  NONE: 0x9ca3af, // Gray
} as const;

/**
 * 3D Notice Badge featuring an exclamation mark icon with smooth bobbing
 * and rotation animation.
 *
 * Types:
 * - PAYMENT_DUE / BILL_PENDING: Yellow (#F59E0B)
 * - BROKEN: Red (#EF4444)
 */
export class NoticeBadge extends THREE.Group {
  private badgeType: NoticeBadgeType;
  private readonly stemMesh: THREE.Mesh<THREE.CylinderGeometry, THREE.MeshStandardMaterial>;
  private readonly dotMesh: THREE.Mesh<THREE.SphereGeometry, THREE.MeshStandardMaterial>;
  private readonly ringMesh: THREE.Mesh<THREE.TorusGeometry, THREE.MeshBasicMaterial>;

  private baseY: number = 0;
  private elapsed: number = 0;
  public bobbingSpeed: number = 3.5;
  public bobbingAmplitude: number = 0.08;
  public rotationSpeed: number = 1.2;

  constructor(type: NoticeBadgeType = 'PAYMENT_DUE', initialPosition?: { x: number; y: number; z: number }) {
    super();
    this.name = `NoticeBadge_${type}`;
    this.badgeType = type;

    const color = this.getColorForType(type);

    // 1. Stem of the exclamation mark (tapered cylinder)
    const stemGeo = new THREE.CylinderGeometry(0.08, 0.04, 0.35, 16);
    const stemMat = new THREE.MeshStandardMaterial({
      color,
      roughness: 0.3,
      metalness: 0.1,
      emissive: color,
      emissiveIntensity: 0.3,
    });
    this.stemMesh = new THREE.Mesh(stemGeo, stemMat);
    this.stemMesh.position.y = 0.28;

    // 2. Dot of the exclamation mark (sphere)
    const dotGeo = new THREE.SphereGeometry(0.055, 16, 16);
    const dotMat = new THREE.MeshStandardMaterial({
      color,
      roughness: 0.3,
      metalness: 0.1,
      emissive: color,
      emissiveIntensity: 0.3,
    });
    this.dotMesh = new THREE.Mesh(dotGeo, dotMat);
    this.dotMesh.position.y = 0.055;

    // 3. Glowing outer pulse ring
    const ringGeo = new THREE.TorusGeometry(0.28, 0.015, 8, 24);
    const ringMat = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.6,
    });
    this.ringMesh = new THREE.Mesh(ringGeo, ringMat);
    this.ringMesh.position.y = 0.2;
    this.ringMesh.rotation.x = Math.PI / 2;

    this.add(this.stemMesh, this.dotMesh, this.ringMesh);

    if (initialPosition) {
      this.position.set(initialPosition.x, initialPosition.y, initialPosition.z);
      this.baseY = initialPosition.y;
    } else {
      this.baseY = this.position.y;
    }

    if (type === 'NONE') {
      this.visible = false;
    }
  }

  /**
   * Sets the badge type and updates material colors accordingly.
   */
  setType(type: NoticeBadgeType): void {
    this.badgeType = type;
    if (type === 'NONE') {
      this.visible = false;
      return;
    }

    this.visible = true;
    const color = this.getColorForType(type);

    this.stemMesh.material.color.setHex(color);
    this.stemMesh.material.emissive.setHex(color);
    this.dotMesh.material.color.setHex(color);
    this.dotMesh.material.emissive.setHex(color);
    this.ringMesh.material.color.setHex(color);
  }

  getType(): NoticeBadgeType {
    return this.badgeType;
  }

  /**
   * Sets the anchor position and updates the baseY for bobbing.
   */
  setAnchorPosition(x: number, y: number, z: number): void {
    this.position.set(x, y, z);
    this.baseY = y;
  }

  /**
   * Advances the bobbing and rotation animation.
   *
   * @param delta - Time delta in seconds.
   */
  update(delta: number): void {
    if (!this.visible) return;

    this.elapsed += delta;
    this.position.y =
      this.baseY + Math.sin(this.elapsed * this.bobbingSpeed) * this.bobbingAmplitude;
    this.rotation.y += delta * this.rotationSpeed;

    // Subtle breathing pulse on the ring
    const scale = 1 + Math.sin(this.elapsed * 5) * 0.08;
    this.ringMesh.scale.set(scale, scale, scale);
  }

  /**
   * Cleanly disposes geometries and materials.
   */
  dispose(): void {
    this.stemMesh.geometry.dispose();
    this.stemMesh.material.dispose();
    this.dotMesh.geometry.dispose();
    this.dotMesh.material.dispose();
    this.ringMesh.geometry.dispose();
    this.ringMesh.material.dispose();
    this.clear();
  }

  private getColorForType(type: NoticeBadgeType): number {
    return NOTICE_COLORS[type] ?? NOTICE_COLORS.NONE;
  }
}
