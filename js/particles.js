/**
 * Singularity Collector — ASMR Ceramic Dust & Shockwave VFX System
 * Soft ceramic dust sparks, subtle ivory/brass ripples, and smooth dissipation.
 */

window.VFXSystem = (function() {
  let container = null;
  let rippleGraphics = null;
  const particles = [];
  const ripples = [];
  const MAX_PARTICLES = 160;

  function init(pixiStage) {
    container = new PIXI.Container();
    rippleGraphics = new PIXI.Graphics();
    
    container.addChild(rippleGraphics);
    pixiStage.addChild(container);
  }

  /**
   * Spawn subtle ceramic dust sparks when a ball collapses into the black hole
   */
  function emitAbsorptionBurst(x, y, colorHex = 0xE4D5B7, count = 8, isGold = false) {
    if (!BallTextures.getParticleTexture()) return;

    const actualCount = Math.min(count, MAX_PARTICLES - particles.length);
    for (let i = 0; i < actualCount; i++) {
      const sprite = new PIXI.Sprite(BallTextures.getParticleTexture());
      sprite.anchor.set(0.5);
      sprite.x = x;
      sprite.y = y;
      sprite.tint = isGold ? 0xE5A93C : colorHex;

      const angle = Math.random() * Math.PI * 2;
      const speed = isGold ? (Math.random() * 120 + 35) : (Math.random() * 85 + 25);
      const scale = isGold ? (Math.random() * 0.35 + 0.2) : (Math.random() * 0.25 + 0.15);
      sprite.scale.set(scale);

      container.addChild(sprite);

      particles.push({
        sprite,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        alpha: 0.9,
        decay: Math.random() * 2.8 + 2.2, // quick fade ~0.35s
        scaleSpeed: 0.9
      });
    }
  }

  /**
   * Subtle dissipation puff when a ball decays on the floor
   */
  function emitDissolvePuff(x, y, colorHex = 0x8E959E) {
    if (!BallTextures.getParticleTexture()) return;

    for (let i = 0; i < 4; i++) {
      const sprite = new PIXI.Sprite(BallTextures.getParticleTexture());
      sprite.anchor.set(0.5);
      sprite.x = x + (Math.random() - 0.5) * 12;
      sprite.y = y + (Math.random() - 0.5) * 6;
      sprite.tint = colorHex;
      sprite.scale.set(0.18);
      sprite.alpha = 0.5;

      container.addChild(sprite);

      particles.push({
        sprite,
        vx: (Math.random() - 0.5) * 20,
        vy: -Math.random() * 25 - 10,
        alpha: 0.5,
        decay: 1.8,
        scaleSpeed: 0.6
      });
    }
  }

  /**
   * Subtle expanding ivory/gold shockwave ring
   */
  function emitShockwave(x, y, maxRadius = 110, colorHex = 0xE4D5B7) {
    ripples.push({
      x,
      y,
      radius: 8,
      maxRadius,
      colorHex,
      alpha: 0.65,
      speed: 160
    });
  }

  function update(dt, holeX, holeY, holeRadius) {
    // 1. Update Particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.sprite.x += p.vx * dt;
      p.sprite.y += p.vy * dt;

      p.alpha -= p.decay * dt;
      p.sprite.alpha = Math.max(0, p.alpha);
      p.sprite.scale.x *= Math.max(0, 1 - p.scaleSpeed * dt);
      p.sprite.scale.y = p.sprite.scale.x;

      if (p.alpha <= 0 || p.sprite.scale.x <= 0.03) {
        container.removeChild(p.sprite);
        p.sprite.destroy();
        particles.splice(i, 1);
      }
    }

    // 2. Render & Update Shockwave Ripples
    rippleGraphics.clear();
    for (let i = ripples.length - 1; i >= 0; i--) {
      const r = ripples[i];
      r.radius += r.speed * dt;
      r.alpha -= dt * 1.8;

      if (r.alpha <= 0 || r.radius >= r.maxRadius) {
        ripples.splice(i, 1);
        continue;
      }

      rippleGraphics
        .circle(r.x, r.y, r.radius)
        .stroke({
          width: Math.max(1, (1 - r.radius / r.maxRadius) * 2.2),
          color: r.colorHex,
          alpha: r.alpha
        });
    }
  }

  function clearAll() {
    for (const p of particles) {
      container.removeChild(p.sprite);
      p.sprite.destroy();
    }
    particles.length = 0;
    ripples.length = 0;
    if (rippleGraphics) rippleGraphics.clear();
  }

  return {
    init,
    emitAbsorptionBurst,
    emitDissolvePuff,
    emitShockwave,
    update,
    clearAll
  };
})();
