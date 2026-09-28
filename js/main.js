/**
 * Singularity Collector — Master Application Entry & Game Loop
 * Warm Dark Slate & Ceramic Edition with Subtle Parallax Background Dust
 */

(async function() {
  'use strict';

  // Prevent zoom, pinch, context menu, and mobile pull-to-refresh
  window.addEventListener('contextmenu', (e) => e.preventDefault());
  window.addEventListener('selectstart', (e) => e.preventDefault());
  document.addEventListener('gesturestart', (e) => e.preventDefault());
  document.addEventListener('gesturechange', (e) => e.preventDefault());
  document.addEventListener('gestureend', (e) => e.preventDefault());

  // Robust interactive target check (supports text nodes, SVGs, and modal containers)
  function isInteractiveTarget(target) {
    if (!target) return false;
    const el = (target instanceof Element) ? target : target.parentElement;
    if (!el || typeof el.closest !== 'function') return false;
    return Boolean(
      el.closest('button') ||
      el.closest('.modal-backdrop') ||
      el.closest('.modal-card') ||
      el.closest('.lb-list-wrap') ||
      el.closest('.lb-list') ||
      el.closest('.lb-row') ||
      el.closest('select') ||
      el.closest('input')
    );
  }

  // Prevent drag scrolling on canvas, while allowing native scrolling in modals & interactive UI
  document.body.addEventListener('touchmove', (e) => {
    if (isInteractiveTarget(e.target)) {
      return;
    }
    if (e.cancelable) {
      e.preventDefault();
    }
  }, { passive: false });

  // 1. Initialize PixiJS v8 Application (Pure warm dark basalt background)
  const app = new PIXI.Application();
  await app.init({
    resizeTo: window,
    resolution: Math.min(window.devicePixelRatio || 1, 2),
    autoDensity: true,
    backgroundColor: 0x131417,
    antialias: true
  });

  const container = document.getElementById('game-container');
  container.appendChild(app.canvas);

  // 2. Subtle Background Cosmic Dust (60-80 micro-particles, alpha 0.15-0.4, slow parallax drift)
  const bgContainer = new PIXI.Container();
  app.stage.addChild(bgContainer);

  const dustCount = 70;
  const dustParticles = [];
  for (let i = 0; i < dustCount; i++) {
    const size = Math.random() * 1.5 + 1.0; // 1.0 to 2.5px
    const alpha = Math.random() * 0.25 + 0.15; // 0.15 to 0.40
    const color = Math.random() > 0.4 ? 0xE4D5B7 : 0xD8BA8E;

    const p = new PIXI.Graphics()
      .circle(0, 0, size * 0.5)
      .fill({ color, alpha });

    p.x = Math.random() * window.innerWidth;
    p.y = Math.random() * window.innerHeight;
    p.speedY = Math.random() * 9 + 4; // slow drift 4-13 px/sec
    p.speedX = (Math.random() - 0.5) * 2;
    p.baseAlpha = alpha;
    p.pulseOffset = Math.random() * Math.PI * 2;
    p.pulseSpeed = Math.random() * 1.5 + 0.8;

    bgContainer.addChild(p);
    dustParticles.push(p);
  }

  // 3. Initialize Game Subsystems immediately so interaction is never blocked
  BallTextures.init();
  VFXSystem.init(app.stage);
  PhysicsEngine.init(app.stage);
  Singularity.init(app.stage);
  Progression.init();
  GameUI.init();

  // Initialize Multi-Platform SDK (VK Games / Yandex Games / Standalone)
  const platform = window.PlatformManager || window.YandexManager;
  if (platform && typeof platform.init === 'function') {
    Promise.race([
      platform.init(),
      new Promise((resolve) => setTimeout(resolve, 3500))
    ]).catch((err) => {
      console.warn('[PlatformManager] Background init fallback:', err);
    });
  }

  // 4. Input Tracking (Lerp Follower & Dual Pointer/Touch Support for Mobile)
  let hasInteracted = false;
  let isPointerDown = false;

  function dismissOverlay() {
    const overlay = document.getElementById('start-overlay');
    if (overlay) {
      overlay.classList.add('fade-out');
      overlay.style.pointerEvents = 'none';
      setTimeout(() => {
        if (overlay.parentNode) {
          overlay.parentNode.removeChild(overlay);
        }
      }, 400);
    }
  }

  function handleInteraction(clientX, clientY) {
    if (!hasInteracted) {
      hasInteracted = true;
      try {
        SoundEngine.init();
      } catch (err) {
        console.warn('Audio init error:', err);
      }
      try {
        if (window.YandexManager && typeof window.YandexManager.startSession === 'function') {
          window.YandexManager.startSession();
        }
      } catch (err) {
        console.warn('Yandex session start error:', err);
      }
      dismissOverlay();
    }
    if (typeof clientX === 'number' && typeof clientY === 'number') {
      Singularity.setTarget(clientX, clientY);
    }
  }


  // Direct dismissal listeners on start-overlay
  const startOverlayEl = document.getElementById('start-overlay');
  if (startOverlayEl) {
    const onStartTouch = (e) => {
      if (e.cancelable && e.type === 'touchstart') e.preventDefault();
      const cx = (e.touches && e.touches[0]) ? e.touches[0].clientX : (e.clientX || window.innerWidth / 2);
      const cy = (e.touches && e.touches[0]) ? e.touches[0].clientY : (e.clientY || window.innerHeight * 0.55);
      handleInteraction(cx, cy);
    };
    startOverlayEl.addEventListener('touchstart', onStartTouch, { passive: false });
    startOverlayEl.addEventListener('pointerdown', onStartTouch);
    startOverlayEl.addEventListener('click', onStartTouch);
  }

  // Pointer Events (Mouse, Stylus & Pointer-capable touch)
  window.addEventListener('pointerdown', (e) => {
    if (isInteractiveTarget(e.target)) return;
    isPointerDown = true;
    handleInteraction(e.clientX, e.clientY);
  });

  window.addEventListener('pointermove', (e) => {
    if (e.pointerType === 'mouse' || isPointerDown) {
      if (isInteractiveTarget(e.target)) return;
      handleInteraction(e.clientX, e.clientY);
    }
  });

  window.addEventListener('pointerup', () => {
    isPointerDown = false;
  });

  window.addEventListener('pointercancel', () => {
    isPointerDown = false;
  });

  // Native Mobile Touch Events (iOS Safari, Android WebViews, Yandex in-app browser)
  window.addEventListener('touchstart', (e) => {
    if (isInteractiveTarget(e.target)) return;
    isPointerDown = true;
    if (e.touches && e.touches.length > 0) {
      handleInteraction(e.touches[0].clientX, e.touches[0].clientY);
    }
  }, { passive: true });

  window.addEventListener('touchmove', (e) => {
    if (isInteractiveTarget(e.target)) return;
    if (e.cancelable) {
      e.preventDefault(); // Prevents mobile browser gesture cancelling touch tracking
    }
    if (e.touches && e.touches.length > 0) {
      handleInteraction(e.touches[0].clientX, e.touches[0].clientY);
    }
  }, { passive: false });

  window.addEventListener('touchend', () => {
    isPointerDown = false;
  });

  window.addEventListener('touchcancel', () => {
    isPointerDown = false;
  });

  // 5. Window Resize Handling
  window.addEventListener('resize', () => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    PhysicsEngine.resize(w, h);
    Singularity.resize(w, h);
    
    // Dynamically re-scale the black hole and gravity aura sizes
    if (window.Progression && typeof window.Progression.applyUpgradesToGame === 'function') {
      window.Progression.applyUpgradesToGame();
    }
  });

  // 6. Master Fixed-Timestep Loop
  const FIXED_DT = PhysicsEngine.FIXED_DT;
  let accumulator = 0;
  let lastTime = performance.now();
  let totalTime = 0;
  let autosaveTimer = 0;

  function loop(currentTime) {
    const deltaMs = currentTime - lastTime;
    let frameTime = deltaMs / 1000;
    if (frameTime > 0.25) frameTime = 0.25;
    lastTime = currentTime;
    totalTime += frameTime;

    // Fixed timestep physics update (60Hz)
    accumulator += frameTime;
    while (accumulator >= FIXED_DT) {
      PhysicsEngine.updatePhysics(FIXED_DT);
      PhysicsEngine.updateSpawner(FIXED_DT);
      accumulator -= FIXED_DT;
    }

    // Gentle idle floating if player hasn't interacted yet
    if (!hasInteracted) {
      const floorY = PhysicsEngine.getFloorY();
      const idleX = (window.innerWidth / 2) + Math.sin(totalTime * 1.1) * (window.innerWidth * 0.14);
      const idleY = (floorY * 0.6) + Math.cos(totalTime * 1.6) * 30;
      Singularity.setTarget(idleX, idleY);
    }

    // Update background micro-dust particles
    for (let i = 0; i < dustParticles.length; i++) {
      const p = dustParticles[i];
      p.y += p.speedY * frameTime;
      p.x += p.speedX * frameTime;
      if (p.y > window.innerHeight + 10) {
        p.y = -10;
        p.x = Math.random() * window.innerWidth;
      }
      if (p.x < -10) p.x = window.innerWidth + 10;
      if (p.x > window.innerWidth + 10) p.x = -10;
      p.alpha = p.baseAlpha * (0.8 + 0.2 * Math.sin(totalTime * p.pulseSpeed + p.pulseOffset));
    }

    // Render & animations
    Singularity.update(frameTime, totalTime);
    VFXSystem.update(frameTime, Singularity.getX(), Singularity.getY(), Singularity.getRadius());
    GameUI.updateHUD(frameTime);

    // Yandex Active Gameplay & Ad Timer
    if (window.YandexManager && typeof window.YandexManager.update === 'function') {
      window.YandexManager.update(frameTime);
    }

    // Periodic Autosave every 4 seconds
    autosaveTimer += frameTime;
    if (autosaveTimer >= 4) {
      Progression.save();
      autosaveTimer = 0;
    }

    requestAnimationFrame(loop);
  }

  // Pre-spawn initial spheres
  for (let i = 0; i < 4; i++) {
    PhysicsEngine.updateSpawner(0.9);
  }

  requestAnimationFrame(loop);
})();
