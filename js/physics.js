/**
 * Singularity Collector — Fixed Timestep Physics & Anomaly Simulation System
 * Anomalies:
 * 1. Cluster Sphere (Prism) — bursts into 8-10 micro-pearls that fly outward 80-120px and get pulled back
 * 2. Antigravity Bubble (Aerogel) — drifts upward from bottom with sinusoidal sway, +2 combo boost if caught
 * 3. Magnetic Sphere (Impulse) — 3.5s buff with 2.2x pull radius & enhanced vortex pulling all resting spheres
 */

window.PhysicsEngine = (function() {
  const FIXED_DT = 1 / 60;
  let ballContainer = null;
  let floorGraphics = null;
  const balls = [];
  const ballPool = [];
  const MAX_ON_SCREEN_BALLS = 180;
  let nextBallId = 1;
  let isSimulationPaused = false;

  // Floor line Y (positioned cleanly above compact dock)
  let floorY = window.innerHeight - 90;

  function obtainBall(texture) {
    let b;
    if (ballPool.length > 0) {
      b = ballPool.pop();
      b.sprite.texture = texture;
      b.sprite.visible = true;
      b.sprite.alpha = 1;
      b.sprite.rotation = 0;
    } else {
      const sprite = new PIXI.Sprite(texture);
      sprite.anchor.set(0.5);
      b = { sprite, id: nextBallId++ };
    }
    return b;
  }

  function releaseBall(b) {
    if (!b || !b.sprite) return;
    if (b.sprite.parent) {
      b.sprite.parent.removeChild(b.sprite);
    }
    b.sprite.visible = false;
    ballPool.push(b);
  }

  // Spawners
  let spawnTimer = 0;
  let bubbleSpawnTimer = 0;

  // Floor decay settings
  const FLOOR_LIFETIME = 8.5; // seconds before dissolve
  const BLINK_WARNING_TIME = 2.5; // seconds before dissolve when blinking starts

  // Gravitational Resonance (Combo) Settings
  let comboStreak = 0;
  let comboTimer = 0;
  const COMBO_MAX_TIME = 2.5; // Generous 2.5s burn window to traverse the screen

  // Magnetic Impulse 3.5-second Buff
  let magneticBuffTimer = 0;
  const MAGNETIC_BUFF_DURATION = 3.5;

  function init(pixiStage) {
    floorGraphics = new PIXI.Graphics();
    pixiStage.addChild(floorGraphics);

    ballContainer = new PIXI.Container();
    pixiStage.addChild(ballContainer);

    updateFloorDimensions(window.innerWidth, window.innerHeight);
  }

  function updateFloorDimensions(w, h) {
    // The upgrade dock wraps into 2 rows on mobile (<= 640px) and gets taller.
    const dockHeight = (w <= 640) ? 140 : 85;
    floorY = Math.max(200, h - dockHeight);
    renderFloorGutter(w, h);
  }

  function renderFloorGutter(w, h) {
    if (!floorGraphics) return;
    floorGraphics.clear();

    floorGraphics
      .rect(0, floorY, w, h - floorY)
      .fill({ color: 0x101114, alpha: 0.75 });

    floorGraphics
      .moveTo(0, floorY)
      .lineTo(w, floorY)
      .stroke({ width: 1.5, color: 0x2A2D35, alpha: 0.95 });

    floorGraphics
      .moveTo(0, floorY + 1.5)
      .lineTo(w, floorY + 1.5)
      .stroke({ width: 1, color: 0x1E2026, alpha: 0.8 });
  }

  function getComboMultiplier(streak) {
    if (streak >= 75) return 32;
    if (streak >= 52) return 24;
    if (streak >= 36) return 16;
    if (streak >= 24) return 12;
    if (streak >= 15) return 8;
    if (streak >= 9)  return 5;
    if (streak >= 5)  return 3;
    if (streak >= 2)  return 2;
    return 1;
  }

  /**
   * Spawns falling spheres (Standard, Gold, Cluster, Magnet)
   */
  function spawnBall() {
    const rand = Math.random();

    let type = 'standard';
    let palette, texture, radius, mass;

    if (rand < 0.035) {
      // 1. Cluster Sphere (Призма) ~3.5%
      type = 'cluster';
      palette = BallTextures.getClusterPalette();
      texture = BallTextures.getClusterTexture();
      radius = 19;
      mass = 4;
    } else if (rand < 0.050) {
      // 2. Magnetic Sphere (Импульс) ~1.5%
      type = 'magnet';
      palette = BallTextures.getMagnetPalette();
      texture = BallTextures.getMagnetTexture();
      radius = 18;
      mass = 10;
    } else if (rand < 0.100) {
      // 3. Gold Sphere ~5.0% (Reward is 15x standard sphere value: 15 * 2 = 30)
      type = 'gold';
      palette = BallTextures.getGoldPalette();
      texture = BallTextures.getGoldTexture();
      radius = 21;
      mass = 30;
    } else {
      // Standard Ceramic Spheres ~90% (Base mass increased from 1 to 2)
      type = 'standard';
      palette = BallTextures.getRandomPalette();
      texture = BallTextures.getTexture(palette.name);
      radius = Math.random() * 2.5 + 13.5;
      mass = 2;
    }

    // Scale ball radius proportionally to screen size
    const sScale = (typeof window.getScreenScale === 'function') ? window.getScreenScale() : 1;
    radius = radius * sScale;


    if (!texture) return;

    const b = obtainBall(texture);
    const sprite = b.sprite;

    // Scaling based on internal canvas dimension
    let canvasInternalR = 30.2;
    if (type === 'gold') canvasInternalR = 33.6;
    if (type === 'cluster' || type === 'magnet') canvasInternalR = 31.9;

    const baseScale = radius / canvasInternalR;
    sprite.scale.set(baseScale);

    const margin = radius + 24;
    const x = Math.random() * (window.innerWidth - margin * 2) + margin;
    const y = -radius - Math.random() * 30;

    sprite.x = x;
    sprite.y = y;
    ballContainer.addChild(sprite);

    b.palette = palette;
    b.type = type;
    b.isGold = (type === 'gold');
    b.isCluster = (type === 'cluster');
    b.isMagnet = (type === 'magnet');
    b.isBubble = false;
    b.isMicro = false;
    b.mass = mass;
    b.radius = radius;
    b.baseScale = baseScale;
    b.x = x;
    b.y = y;
    b.vx = (Math.random() - 0.5) * 24;
    b.vy = Math.random() * 35 + 65;
    b.ax = 0;
    b.ay = 0;
    b.isResting = false;
    b.restingTime = 0;
    b.squash = 1.0;
    b.shrinkScale = 1.0;

    balls.push(b);
  }

  /**
   * Spawns ascending Antigravity Bubble in lower third (~2.5% occurrence)
   */
  function spawnBubble() {
    const texture = BallTextures.getBubbleTexture();
    const palette = BallTextures.getBubblePalette();
    if (!texture) return;

    let radius = 22;
    const sScale = (typeof window.getScreenScale === 'function') ? window.getScreenScale() : 1;
    radius = radius * sScale;
    
    const baseScale = radius / 31.9;

    const b = obtainBall(texture);
    const sprite = b.sprite;
    sprite.scale.set(baseScale);

    const x = Math.random() * (window.innerWidth - 100) + 50;
    const y = floorY - 15 - Math.random() * 25; // bottom third

    sprite.x = x;
    sprite.y = y;
    ballContainer.addChild(sprite);

    b.palette = palette;
    b.type = 'bubble';
    b.isGold = false;
    b.isCluster = false;
    b.isMagnet = false;
    b.isBubble = true;
    b.isMicro = false;
    b.mass = 16;
    b.radius = radius;
    b.baseScale = baseScale;
    b.x = x;
    b.y = y;
    b.vx = 0;
    b.vy = -(Math.random() * 20 + 55); // upward drift!
    b.ax = 0;
    b.ay = 0;
    b.timeAlive = 0;
    b.wobblePhase = Math.random() * Math.PI * 2;
    b.isResting = false;
    b.restingTime = 0;
    b.squash = 1.0;
    b.shrinkScale = 1.0;

    balls.push(b);
  }

  /**
   * Explodes Cluster Sphere into 8-10 micro-pearls scattering outward 80-120px
   */
  function triggerClusterBurst(holeX, holeY) {
    const pearlTexture = BallTextures.getMicroPearlTexture();
    const palette = BallTextures.getClusterPalette();
    if (!pearlTexture) return;

    const count = 8 + Math.floor(Math.random() * 3); // 8 to 10 micro-pearls
    let radius = 6.5;
    const sScale = (typeof window.getScreenScale === 'function') ? window.getScreenScale() : 1;
    radius = radius * sScale;

    const baseScale = radius / 15.1;

    for (let i = 0; i < count; i++) {
      const b = obtainBall(pearlTexture);
      const sprite = b.sprite;
      sprite.scale.set(baseScale);

      const angle = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.35;
      const speed = 210 + Math.random() * 70; // radial scatter

      const x = holeX + Math.cos(angle) * 8;
      const y = holeY + Math.sin(angle) * 8;

      sprite.x = x;
      sprite.y = y;
      ballContainer.addChild(sprite);

      b.palette = palette;
      b.type = 'micro';
      b.isGold = false;
      b.isCluster = false;
      b.isMagnet = false;
      b.isBubble = false;
      b.isMicro = true;
      b.mass = 2;
      b.radius = radius;
      b.baseScale = baseScale;
      b.x = x;
      b.y = y;
      b.vx = Math.cos(angle) * speed;
      b.vy = Math.sin(angle) * speed;
      b.ax = 0;
      b.ay = 0;
      b.isResting = false;
      b.restingTime = 0;
      b.squash = 1.0;
      b.shrinkScale = 1.0;

      balls.push(b);
    }
  }

  /**
   * Fixed Timestep Physics Update (60Hz)
   */
  function updatePhysics(dt) {
    if (isSimulationPaused) return;

    const holeX = Singularity.getX();
    const holeY = Singularity.getY();
    const holeCoreRadius = Singularity.getRadius();
    const baseGravityRadius = Singularity.getGravityRadius();

    // ====================================================
    // MAGNETIC IMPULSE BUFF (3.5s Delta-Time Manager)
    // ====================================================
    if (magneticBuffTimer > 0) {
      magneticBuffTimer -= dt;
      if (magneticBuffTimer <= 0) magneticBuffTimer = 0;
    }
    const isMagnetic = magneticBuffTimer > 0;
    const magneticRatio = isMagnetic ? (magneticBuffTimer / MAGNETIC_BUFF_DURATION) : 0;

    // Notify Singularity to render expanding magnetic shockwave wave
    Singularity.setMagneticBuff(isMagnetic, magneticRatio);

    // Buff scales pull radius 2.2x and dramatically boosts suction
    const effectiveGravityRadius = baseGravityRadius * (isMagnetic ? 2.2 : 1.0);

    const gravLvl = Progression.getUpgradeLevel('gravity');
    const gravStrengthMult = Progression.getConfig('gravity').calcStrength(gravLvl) * (isMagnetic ? 2.6 : 1.0);
    const vortexMult = Progression.getConfig('gravity').calcVortex(gravLvl) * (isMagnetic ? 2.2 : 1.0);

    // ====================================================
    // COMBO / RESONANCE TIMER DECAY
    // ====================================================
    if (comboTimer > 0) {
      comboTimer -= dt;
      const ratio = Math.max(0, comboTimer / COMBO_MAX_TIME);
      if (window.GameUI && typeof window.GameUI.updateComboTimer === 'function') {
        GameUI.updateComboTimer(ratio);
      }
      if (comboTimer <= 0) {
        comboStreak = 0;
        if (window.GameUI && typeof window.GameUI.hideCombo === 'function') {
          GameUI.hideCombo();
        }
      }
    }

    for (let i = balls.length - 1; i >= 0; i--) {
      const b = balls[i];

      b.ax = 0;
      b.ay = 0;

      const dx = holeX - b.x;
      const dy = holeY - b.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Magnetic impulse stirs awake all resting balls across the screen
      if (isMagnetic && b.isResting) {
        b.isResting = false;
        b.restingTime = 0;
      }

      // ====================================================
      // 1. EVENT HORIZON ABSORPTION
      // ====================================================
      const absorbThreshold = holeCoreRadius + (b.isMicro ? 2 : b.radius * 0.4);
      if (dist <= absorbThreshold) {
        // Special Anomaly Absorption Behaviors
        if (b.type === 'cluster') {
          // Cluster explosion: spawns 8-10 micro-pearls
          SoundEngine.playPop('cluster');
          if (Progression.getState().hapticsEnabled && 'vibrate' in navigator) {
            try { navigator.vibrate(12); } catch(e) {}
          }
          Singularity.triggerAbsorptionRecoil(4);
          VFXSystem.emitAbsorptionBurst(b.x, b.y, 0xEAE6F2, 12);
          triggerClusterBurst(holeX, holeY);
          if (window.GameUI) {
            GameUI.showFloatPoints(b.x, b.y, 'КЛАСТЕР!', '#EAE6F2');
          }
        } else if (b.type === 'bubble') {
          // Antigravity bubble: +2 to combo streak & high reward
          comboStreak += 2;
          comboTimer = COMBO_MAX_TIME;
          const multiplier = getComboMultiplier(comboStreak);
          SoundEngine.playBubblePop();
          if (Progression.getState().hapticsEnabled && 'vibrate' in navigator) {
            try { navigator.vibrate(14); } catch(e) {}
          }
          Singularity.triggerAbsorptionRecoil(b.mass);
          VFXSystem.emitAbsorptionBurst(b.x, b.y, 0x7CE8D5, 14);
          const earnedMass = Progression.addMatter(1, b.mass, multiplier);
          if (window.GameUI) {
            if (multiplier > 1 && typeof GameUI.updateCombo === 'function') {
              GameUI.updateCombo(multiplier, comboStreak, 1.0);
            }
            GameUI.showFloatPoints(b.x, b.y, `+${earnedMass} АНТИГРАВ`, '#7CE8D5');
          }
        } else if (b.type === 'magnet') {
          // Magnetic sphere: activates 3.5s pull buff
          magneticBuffTimer = MAGNETIC_BUFF_DURATION;
          comboStreak++;
          comboTimer = COMBO_MAX_TIME;
          const multiplier = getComboMultiplier(comboStreak);
          SoundEngine.playMagneticPulse();
          if (Progression.getState().hapticsEnabled && 'vibrate' in navigator) {
            try { navigator.vibrate([15, 25, 20]); } catch(e) {}
          }
          Singularity.triggerAbsorptionRecoil(b.mass);
          VFXSystem.emitShockwave(holeX, holeY, baseGravityRadius * 1.5, 0x5C74B5);
          const earnedMass = Progression.addMatter(1, b.mass, multiplier);
          if (window.GameUI) {
            if (multiplier > 1 && typeof GameUI.updateCombo === 'function') {
              GameUI.updateCombo(multiplier, comboStreak, 1.0);
            }
            GameUI.showFloatPoints(b.x, b.y, `МАГНИТ 3.5с (+${earnedMass})`, '#8FAAE6');
          }
        } else if (b.isMicro) {
          // Micro-pearl from cluster: gives full standard sphere base mass & boosts combo streak
          comboStreak++;
          comboTimer = COMBO_MAX_TIME;
          const multiplier = getComboMultiplier(comboStreak);
          SoundEngine.playMicroPop();
          if (Progression.getState().hapticsEnabled && 'vibrate' in navigator) {
            try { navigator.vibrate(4); } catch(e) {}
          }
          const earnedMass = Progression.addMatter(1, b.mass, multiplier);
          Singularity.triggerAbsorptionRecoil(1);
          VFXSystem.emitAbsorptionBurst(b.x, b.y, 0xEAE6F2, 4);
          if (window.GameUI) {
            if (multiplier > 1 && typeof GameUI.updateCombo === 'function') {
              GameUI.updateCombo(multiplier, comboStreak, 1.0);
            }
            if (Math.random() < 0.4) {
              GameUI.showFloatPoints(b.x, b.y, `+${earnedMass}`, '#FAF7FD');
            }
          }
        } else {
          // Standard / Gold spheres
          SoundEngine.playPop(b.type);
          if (Progression.getState().hapticsEnabled && 'vibrate' in navigator) {
            try { navigator.vibrate(b.isGold ? 18 : 8); } catch(e) {}
          }
          Singularity.triggerAbsorptionRecoil(b.mass);
          VFXSystem.emitAbsorptionBurst(b.x, b.y, b.palette.hex, b.isGold ? 16 : 7, b.isGold);
          if (b.isGold) {
            VFXSystem.emitShockwave(holeX, holeY, baseGravityRadius * 0.85, 0xE5A93C);
          }
          comboStreak++;
          comboTimer = COMBO_MAX_TIME;
          const multiplier = getComboMultiplier(comboStreak);
          const earnedMass = Progression.addMatter(1, b.mass, multiplier);

          if (window.GameUI) {
            if (multiplier > 1 && typeof GameUI.updateCombo === 'function') {
              GameUI.updateCombo(multiplier, comboStreak, 1.0);
            }
            const textColor = b.isGold ? '#E5A93C' : b.palette.main;
            let label = b.isGold ? `+${earnedMass} ЗОЛОТО` : `+${earnedMass}`;
            if (multiplier > 1) label += ` ×${multiplier}`;
            GameUI.showFloatPoints(b.x, b.y, label, textColor);
          }
        }

        // Clean up absorbed ball to pool
        releaseBall(b);
        balls.splice(i, 1);
        continue;
      }

      // ====================================================
      // 2. GRAVITATIONAL FUNNEL & VORTEX
      // ====================================================
      if (dist < effectiveGravityRadius) {
        b.isResting = false;
        b.restingTime = 0;
        b.sprite.alpha = 1;

        const normX = dx / dist;
        const normY = dy / dist;
        const factor = 1 - (dist / effectiveGravityRadius);

        // Radial suction pull
        const pull = gravStrengthMult * (1 / (dist * 0.01 + 0.45)) * factor * 540;
        b.ax += normX * pull;
        b.ay += normY * pull;

        // Tangential Coriolis swirl
        const perpX = -normY;
        const perpY = normX;
        const vortex = vortexMult * factor * 250;
        b.ax += perpX * vortex;
        b.ay += perpY * vortex;

        // Viscous cosmic damping in funnel
        b.vx *= 0.980;
        b.vy *= 0.980;
      } else {
        // Outside gravity well
        if (b.isBubble) {
          // Antigravity bubble floats UPWARD with gentle sinusoidal sway
          b.timeAlive = (b.timeAlive || 0) + dt;
          b.ay -= 20; // upward buoyancy
          b.vy = Math.max(-85, Math.min(-45, b.vy));
          b.vx = Math.sin(b.timeAlive * 3.0 + b.wobblePhase) * 32;

          // Escapes through top edge
          if (b.y < -b.radius - 20) {
            VFXSystem.emitDissolvePuff(b.x, b.y, 0x7CE8D5);
            releaseBall(b);
            balls.splice(i, 1);
            continue;
          }
        } else if (b.isMicro) {
          // Micro-pearl decelerates in cosmic space
          b.vx *= 0.97;
          b.vy *= 0.97;
          b.ay += 60;
        } else {
          // Normal downward gravity
          b.ay += b.isGold ? 290 : 250;
          b.vx *= 0.995;
          b.vy *= 0.998;
        }
      }

      // Symplectic Euler integration
      b.vx += b.ax * dt;
      b.vy += b.ay * dt;
      b.x += b.vx * dt;
      b.y += b.vy * dt;

      // ====================================================
      // 3. FLOOR COLLISION & RESTING TIMER (non-bubbles)
      // ====================================================
      if (!b.isBubble && !b.isMicro) {
        if (b.y + b.radius >= floorY) {
          b.y = floorY - b.radius;
          if (Math.abs(b.vy) > 22) {
            b.vy = -b.vy * 0.32;
            b.squash = 1.3;
          } else {
            b.vy = 0;
            b.isResting = true;
          }
          b.vx *= 0.86;
        }

        // Screen left & right bounce
        const leftLimit = b.radius + 6;
        const rightLimit = window.innerWidth - b.radius - 6;
        if (b.x < leftLimit) {
          b.x = leftLimit;
          b.vx = -b.vx * 0.45;
        } else if (b.x > rightLimit) {
          b.x = rightLimit;
          b.vx = -b.vx * 0.45;
        }

        // Resting Lifetime Decay
        if (b.isResting) {
          b.restingTime += dt;
          if (b.restingTime >= FLOOR_LIFETIME - BLINK_WARNING_TIME) {
            const remaining = FLOOR_LIFETIME - b.restingTime;
            const progress = 1 - Math.max(0, remaining / BLINK_WARNING_TIME);
            const blink = 0.35 + 0.65 * Math.abs(Math.sin((b.restingTime - (FLOOR_LIFETIME - BLINK_WARNING_TIME)) * 9));
            b.sprite.alpha = blink;
            b.shrinkScale = 1.0 - progress * 0.35;
          } else {
            b.sprite.alpha = 1;
            b.shrinkScale = 1.0;
          }

          if (b.restingTime >= FLOOR_LIFETIME) {
            VFXSystem.emitDissolvePuff(b.x, b.y, b.palette.hex);
            releaseBall(b);
            balls.splice(i, 1);
            continue;
          }
        } else {
          b.shrinkScale = 1.0;
          b.sprite.alpha = 1;
        }
      }
    }

    // ====================================================
    // 4. SOFT HORIZONTAL SPREAD ON FLOOR
    // ====================================================
    for (let i = 0; i < balls.length; i++) {
      const b1 = balls[i];
      if (!b1.isResting) continue;

      for (let j = i + 1; j < balls.length; j++) {
        const b2 = balls[j];
        if (!b2.isResting) continue;

        const sepX = b2.x - b1.x;
        const minDist = b1.radius + b2.radius;
        if (Math.abs(sepX) < minDist && Math.abs(b2.y - b1.y) < minDist * 0.8) {
          const overlap = minDist - Math.abs(sepX);
          const push = overlap * 0.22;
          const sign = sepX >= 0 ? 1 : -1;
          b1.x -= sign * push;
          b2.x += sign * push;
        }
      }
    }

    // ====================================================
    // 5. SQUASH & STRETCH RENDER UPDATE
    // ====================================================
    for (let i = 0; i < balls.length; i++) {
      const b = balls[i];
      b.sprite.x = b.x;
      b.sprite.y = b.y;

      const speed = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
      const dx = holeX - b.x;
      const dy = holeY - b.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      let stretchX = 1;
      let squashY = 1;

      if (b.isBubble) {
        // Gentle bubble breathing wobble
        const wobble = 1 + Math.sin((b.timeAlive || 0) * 4) * 0.08;
        stretchX = wobble;
        squashY = 1 / wobble;
      } else if (dist < holeCoreRadius * 2.2) {
        // Spaghettification near singularity
        b.sprite.rotation = Math.atan2(dy, dx);
        stretchX = 1 + (1 - dist / (holeCoreRadius * 2.2)) * 1.35;
        squashY = 1 / Math.sqrt(stretchX);
      } else if (speed > 35) {
        // Speed elongation
        b.sprite.rotation = Math.atan2(b.vy, b.vx);
        stretchX = 1 + Math.min(speed / 600, 1.2) * 0.65;
        squashY = 1 / Math.sqrt(stretchX);
      } else {
        b.squash += (1 - b.squash) * 0.18;
        stretchX = b.squash;
        squashY = 1 / b.squash;
      }

      const shrink = b.shrinkScale || 1.0;
      b.sprite.scale.set(b.baseScale * stretchX * shrink, b.baseScale * squashY * shrink);
    }
  }

  function updateSpawner(dt) {
    if (isSimulationPaused) return;

    const streamLvl = Progression.getUpgradeLevel('stream');
    let interval = Progression.getConfig('stream').calcInterval(streamLvl);

    const mgr = window.PlatformManager || window.YandexManager;
    const isBoost = (mgr && typeof mgr.isBoostActive === 'function' && mgr.isBoostActive());
    if (isBoost) {
      interval *= 0.5; // Double the sphere falling frequency!
    }

    // Standard sphere spawner
    spawnTimer += dt;
    while (spawnTimer >= interval) {
      if (balls.length < MAX_ON_SCREEN_BALLS) {
        spawnBall();
      }
      spawnTimer -= interval;
    }

    // Antigravity Bubble spawner (~every 7-9 seconds, or ~4s with boost)
    const bubbleInterval = isBoost ? 4.0 : 7.8;
    bubbleSpawnTimer += dt;
    if (bubbleSpawnTimer >= bubbleInterval) {
      if (balls.length < MAX_ON_SCREEN_BALLS) {
        spawnBubble();
      }
      bubbleSpawnTimer = 0;
    }
  }

  function resize(w, h) {
    updateFloorDimensions(w, h);
  }

  function clearAll() {
    for (const b of balls) {
      releaseBall(b);
    }
    balls.length = 0;
    comboStreak = 0;
    comboTimer = 0;
    magneticBuffTimer = 0;
    if (window.GameUI && typeof window.GameUI.hideCombo === 'function') {
      GameUI.hideCombo();
    }
  }

  function setPaused(state) {
    isSimulationPaused = Boolean(state);
  }

  return {
    init,
    updatePhysics,
    updateSpawner,
    resize,
    clearAll,
    setPaused,
    isPaused: () => isSimulationPaused,
    getFloorY: () => floorY,
    getBallCount: () => balls.length,
    FIXED_DT
  };
})();

// Compatibility aliases for simulation and renderer specifications
window.Simulation = window.PhysicsEngine;
window.BallRenderer = window.BallTextures;

