/**
 * Singularity Collector — Velvet Black Hole & Ivory/Brass Accretion
 * Aesthetic: Absolute velvet matte black center with a thin, delicate accretion ring in polished brass/ivory (#e4d5b7).
 * Features:
 * - Dynamic magnetic pulse wave rendering during the 3.5s Magnetic Impulse buff.
 */

window.Singularity = (function() {
  let container = null;
  let auraGraphics = null;
  let magneticGraphics = null;
  let accretionGraphics = null;
  let coreGraphics = null;

  // State
  let x = window.innerWidth / 2;
  let y = window.innerHeight * 0.55;
  let targetX = x;
  let targetY = y;

  let baseRadius = 24;
  let currentRadius = 24;
  let pulseRadiusOffset = 0;
  let gravityRadius = 120;

  let rotationAngle = 0;
  let auraWaveOffset = 0;
  let lerpFactor = 0.22; // smooth, responsive tracking

  // Magnetic buff state
  let isMagneticActive = false;
  let magneticRatio = 0;
  let magneticPulseOffset = 0;

  function init(pixiStage) {
    container = new PIXI.Container();
    
    auraGraphics = new PIXI.Graphics();
    magneticGraphics = new PIXI.Graphics();
    accretionGraphics = new PIXI.Graphics();
    coreGraphics = new PIXI.Graphics();

    container.addChild(auraGraphics);
    container.addChild(magneticGraphics);
    container.addChild(accretionGraphics);
    container.addChild(coreGraphics);

    pixiStage.addChild(container);

    x = window.innerWidth / 2;
    y = window.innerHeight * 0.55;
    targetX = x;
    targetY = y;
  }

  function setTarget(newX, newY) {
    const margin = currentRadius + 12;
    const floorLimit = window.PhysicsEngine ? window.PhysicsEngine.getFloorY() - currentRadius : window.innerHeight - 120;
    targetX = Math.max(margin, Math.min(window.innerWidth - margin, newX));
    targetY = Math.max(margin + 50, Math.min(floorLimit, newY));
  }

  function triggerAbsorptionRecoil(massAmount = 1) {
    pulseRadiusOffset = Math.min(8, pulseRadiusOffset + 1.8 * Math.sqrt(massAmount));
  }

  function setRadius(r) {
    baseRadius = r;
  }

  function setGravityRange(range) {
    gravityRadius = range;
  }

  function setMagneticBuff(active, ratio = 0) {
    isMagneticActive = Boolean(active);
    magneticRatio = Math.max(0, Math.min(1, ratio));
  }

  function update(dt, timeSec) {
    x += (targetX - x) * Math.min(1, lerpFactor * (dt * 60));
    y += (targetY - y) * Math.min(1, lerpFactor * (dt * 60));

    // Spring damping on absorption recoil
    pulseRadiusOffset *= Math.pow(0.85, dt * 60);
    currentRadius = baseRadius + pulseRadiusOffset;

    rotationAngle += dt * (isMagneticActive ? 3.2 : 1.6);
    auraWaveOffset = (auraWaveOffset + dt * (isMagneticActive ? 60 : 30)) % 24;
    magneticPulseOffset = (magneticPulseOffset + dt * 140) % (gravityRadius || 200);

    render(timeSec);
  }

  function render(timeSec) {
    container.position.set(x, y);

    // ==========================================
    // 1. Subtle Space-Warp Gravitational Aura
    // ==========================================
    auraGraphics.clear();

    const effectiveGravityR = gravityRadius;

    // Soft outer gravity boundary
    auraGraphics
      .circle(0, 0, effectiveGravityR)
      .fill({ color: isMagneticActive ? 0x5C74B5 : 0xE4D5B7, alpha: isMagneticActive ? 0.04 : 0.015 })
      .stroke({ width: 1, color: isMagneticActive ? 0x5C74B5 : 0xE4D5B7, alpha: isMagneticActive ? 0.25 : 0.08 });

    // Concentric inward-traveling gravitational ripples
    const ringStep = isMagneticActive ? 18 : 22;
    for (let r = currentRadius * 1.25; r < effectiveGravityR; r += ringStep) {
      const currentR = r - (auraWaveOffset % ringStep);
      if (currentR > currentRadius * 1.15 && currentR < effectiveGravityR) {
        const factor = 1 - (currentR / effectiveGravityR);
        auraGraphics
          .circle(0, 0, currentR)
          .stroke({
            width: 1,
            color: isMagneticActive ? 0x7E99DE : 0xE4D5B7,
            alpha: factor * (isMagneticActive ? 0.22 : 0.09)
          });
      }
    }

    // ==========================================
    // 1.5. Magnetic Impulse Surge Wave (when active)
    // ==========================================
    magneticGraphics.clear();
    if (isMagneticActive && magneticRatio > 0) {
      const pulseR = currentRadius + (magneticPulseOffset % (effectiveGravityR - currentRadius));
      const pulseAlpha = (1 - (pulseR / effectiveGravityR)) * magneticRatio * 0.7;

      // Expanding electromagnetic shockwave ring
      magneticGraphics
        .circle(0, 0, pulseR)
        .stroke({ width: 2.5, color: 0x5C74B5, alpha: pulseAlpha });

      // Outer energetic halo
      magneticGraphics
        .circle(0, 0, effectiveGravityR)
        .stroke({ width: 2.0, color: 0xE4D5B7, alpha: 0.3 * magneticRatio });

      // Rotating magnetic field line arcs
      const fieldArcs = 3;
      for (let i = 0; i < fieldArcs; i++) {
        const start = -rotationAngle * 1.5 + (i * Math.PI * 2) / fieldArcs;
        magneticGraphics
          .arc(0, 0, currentRadius * 1.8 + Math.sin(timeSec * 6 + i) * 6, start, start + Math.PI * 0.45)
          .stroke({ width: 2.0, color: 0x8FAAE6, alpha: 0.5 * magneticRatio });
      }
    }

    // ==========================================
    // 2. Delicate Accretion Ring (Polished Brass / Ivory #e4d5b7)
    // ==========================================
    accretionGraphics.clear();

    const ringRadius = currentRadius * 1.22;
    const breathe = Math.sin(timeSec * 3.0) * 0.8;

    // Faint outer brass glow
    accretionGraphics
      .circle(0, 0, ringRadius + breathe + 3)
      .stroke({ width: 2.5, color: isMagneticActive ? 0x5C74B5 : 0xD4AF37, alpha: 0.25 });

    // Primary thin polished ivory/brass ring
    accretionGraphics
      .circle(0, 0, ringRadius + breathe)
      .stroke({ width: 1.5, color: 0xE4D5B7, alpha: 0.85 });

    // Soft rotating arc segment of polished brass highlight
    const arcSpan = Math.PI * 0.45;
    accretionGraphics
      .arc(0, 0, ringRadius + breathe, rotationAngle, rotationAngle + arcSpan)
      .stroke({ width: 2.0, color: 0xFFF6E5, alpha: 0.95 });

    accretionGraphics
      .arc(0, 0, ringRadius + breathe, rotationAngle + Math.PI, rotationAngle + Math.PI + arcSpan * 0.6)
      .stroke({ width: 1.8, color: isMagneticActive ? 0x8FAAE6 : 0xE5A93C, alpha: 0.75 });

    // ==========================================
    // 3. Absolute Velvet Matte Black Singularity Core
    // ==========================================
    coreGraphics.clear();

    coreGraphics
      .circle(0, 0, currentRadius)
      .fill({ color: 0x07080A, alpha: 1.0 });

    coreGraphics
      .circle(0, 0, currentRadius)
      .stroke({ width: 1.2, color: 0x000000, alpha: 1.0 });
  }

  function resize(w, h) {
    const floorLimit = window.PhysicsEngine ? window.PhysicsEngine.getFloorY() - currentRadius : h - 120;
    targetX = Math.min(targetX, w - currentRadius);
    targetY = Math.min(targetY, floorLimit);
  }

  return {
    init,
    update,
    setTarget,
    triggerAbsorptionRecoil,
    setRadius,
    setGravityRange,
    setMagneticBuff,
    resize,
    getX: () => x,
    getY: () => y,
    getRadius: () => currentRadius,
    getBaseRadius: () => baseRadius,
    getGravityRadius: () => gravityRadius
  };
})();
