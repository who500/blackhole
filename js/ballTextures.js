/**
 * Singularity Collector — Ceramic, Amber & Anomaly Procedural Sphere Textures
 * Textures:
 * - Ceramic palettes (Dusty Rose, Sage, Terracotta, Sand, Cream, Slate)
 * - Rare Golden Sphere (Polished Amber / Gold)
 * - Cluster Sphere & Micro-Pearls (Prismatic Iridescent Pearl)
 * - Antigravity Bubble (Translucent Aquamarine Aerogel)
 * - Magnetic Sphere (Deep Indigo & Brass with Magnetic Field Ring)
 */

window.BallTextures = (function() {
  const textureCache = new Map();
  let defaultTexture = null;
  let goldTexture = null;
  let clusterTexture = null;
  let microPearlTexture = null;
  let bubbleTexture = null;
  let magnetTexture = null;
  let dustParticleTexture = null;

  // Natural Ceramic & Earth Tone Palettes
  const CERAMIC_PALETTES = [
    {
      name: 'dusty_rose',
      label: 'Пыльная роза',
      main: '#C48B8B',
      highlight: '#E8C6C6',
      rim: '#9B6464',
      hex: 0xC48B8B
    },
    {
      name: 'sage',
      label: 'Шалфей',
      main: '#8DA580',
      highlight: '#C4D4BC',
      rim: '#677E5B',
      hex: 0x8DA580
    },
    {
      name: 'terracotta',
      label: 'Терракота',
      main: '#C8814E',
      highlight: '#E8AD83',
      rim: '#975727',
      hex: 0xC8814E
    },
    {
      name: 'sand',
      label: 'Теплый песок',
      main: '#D8BA8E',
      highlight: '#F0DEC4',
      rim: '#A78758',
      hex: 0xD8BA8E
    },
    {
      name: 'cream',
      label: 'Молочный крем',
      main: '#EDE6D6',
      highlight: '#FAF7F0',
      rim: '#BFB5A2',
      hex: 0xEDE6D6
    },
    {
      name: 'slate',
      label: 'Базальтовый сланец',
      main: '#8E959E',
      highlight: '#C8CDD4',
      rim: '#686F78',
      hex: 0x8E959E
    }
  ];

  // Rare Golden Sphere
  const GOLD_PALETTE = {
    name: 'gold',
    label: 'Золото',
    main: '#E5A93C',
    highlight: '#FFF3B8',
    rim: '#A67215',
    glow: '#E5A93C',
    hex: 0xE5A93C
  };

  // Anomaly 1: Cluster Sphere (Iridescent Pearl)
  const CLUSTER_PALETTE = {
    name: 'cluster',
    label: 'Кластер',
    main: '#EAE6F2',
    highlight: '#FFFFFF',
    rim: '#C9BEDE',
    accent: '#BCAEE0',
    hex: 0xEAE6F2
  };

  // Anomaly 2: Antigravity Bubble (Translucent Aquamarine Aerogel)
  const BUBBLE_PALETTE = {
    name: 'bubble',
    label: 'Антиграв',
    main: '#7CE8D5',
    highlight: '#E2FEF9',
    rim: '#3BAFA0',
    hex: 0x7CE8D5
  };

  // Anomaly 3: Magnetic Sphere (Deep Indigo & Brass)
  const MAGNET_PALETTE = {
    name: 'magnet',
    label: 'Магнит',
    main: '#283452',
    highlight: '#E4D5B7',
    rim: '#161D2E',
    accent: '#5C74B5',
    hex: 0x283452
  };

  /**
   * Generates a tactile matte ceramic sphere texture
   */
  function createCeramicCanvas(palette, size = 64, isGold = false) {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    const cx = size * 0.5;
    const cy = size * 0.5;
    const r = size * 0.42;

    if (isGold) {
      const glowGrad = ctx.createRadialGradient(cx, cy, r * 0.8, cx, cy, r * 1.18);
      glowGrad.addColorStop(0, 'rgba(229, 169, 60, 0.45)');
      glowGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = glowGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, r * 1.18, 0, Math.PI * 2);
      ctx.fill();
    }

    const lx = cx - r * 0.32;
    const ly = cy - r * 0.35;

    const bodyGrad = ctx.createRadialGradient(lx, ly, r * 0.08, cx, cy, r);
    bodyGrad.addColorStop(0, palette.highlight);
    bodyGrad.addColorStop(0.35, palette.main);
    bodyGrad.addColorStop(0.85, palette.rim);
    bodyGrad.addColorStop(1, '#1a181640');

    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.clip();

    ctx.fillStyle = bodyGrad;
    ctx.fill();

    const specGrad = ctx.createRadialGradient(lx, ly, 0, lx, ly, r * (isGold ? 0.45 : 0.55));
    if (isGold) {
      specGrad.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
      specGrad.addColorStop(0.25, 'rgba(255, 245, 180, 0.6)');
      specGrad.addColorStop(1, 'rgba(255, 245, 180, 0)');
    } else {
      specGrad.addColorStop(0, 'rgba(255, 255, 255, 0.65)');
      specGrad.addColorStop(0.4, 'rgba(255, 255, 255, 0.25)');
      specGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    }
    ctx.fillStyle = specGrad;
    ctx.beginPath();
    ctx.arc(lx, ly, r * (isGold ? 0.45 : 0.55), 0, Math.PI * 2);
    ctx.fill();

    const bounceGrad = ctx.createRadialGradient(cx + r * 0.2, cy + r * 0.38, 0, cx, cy, r);
    bounceGrad.addColorStop(0, 'rgba(255, 255, 255, 0.14)');
    bounceGrad.addColorStop(0.7, 'transparent');
    ctx.fillStyle = bounceGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
    return canvas;
  }

  /**
   * Generates Iridescent Pearl Cluster sphere texture
   */
  function createClusterCanvas(size = 72) {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    const cx = size * 0.5;
    const cy = size * 0.5;
    const r = size * 0.42;

    // Soft pearlescent halo
    const halo = ctx.createRadialGradient(cx, cy, r * 0.85, cx, cy, r * 1.15);
    halo.addColorStop(0, 'rgba(200, 190, 225, 0.35)');
    halo.addColorStop(1, 'transparent');
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(cx, cy, r * 1.15, 0, Math.PI * 2);
    ctx.fill();

    const lx = cx - r * 0.32;
    const ly = cy - r * 0.35;

    // Prismatic pearl gradient
    const pearlGrad = ctx.createRadialGradient(lx, ly, r * 0.05, cx, cy, r);
    pearlGrad.addColorStop(0, '#FFFFFF');
    pearlGrad.addColorStop(0.3, '#FAF7FD');
    pearlGrad.addColorStop(0.65, '#E5DDF5');
    pearlGrad.addColorStop(0.88, '#C4B4E2');
    pearlGrad.addColorStop(1, '#8B7AA8');

    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.clip();

    ctx.fillStyle = pearlGrad;
    ctx.fill();

    // Rainbow iridescent sheen
    const iri = ctx.createLinearGradient(cx - r, cy - r, cx + r, cy + r);
    iri.addColorStop(0, 'rgba(255, 200, 220, 0.15)');
    iri.addColorStop(0.35, 'rgba(255, 255, 200, 0.15)');
    iri.addColorStop(0.7, 'rgba(180, 245, 230, 0.15)');
    iri.addColorStop(1, 'rgba(200, 190, 255, 0.18)');
    ctx.fillStyle = iri;
    ctx.fill();

    // Silk specular highlight
    const spec = ctx.createRadialGradient(lx, ly, 0, lx, ly, r * 0.4);
    spec.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
    spec.addColorStop(0.35, 'rgba(255, 255, 255, 0.4)');
    spec.addColorStop(1, 'transparent');
    ctx.fillStyle = spec;
    ctx.beginPath();
    ctx.arc(lx, ly, r * 0.4, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
    return canvas;
  }

  /**
   * Generates Micro-Pearl texture (for cluster fragmentation)
   */
  function createMicroPearlCanvas(size = 36) {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    const cx = size * 0.5;
    const cy = size * 0.5;
    const r = size * 0.42;

    const lx = cx - r * 0.3;
    const ly = cy - r * 0.35;

    const grad = ctx.createRadialGradient(lx, ly, 0, cx, cy, r);
    grad.addColorStop(0, '#FFFFFF');
    grad.addColorStop(0.4, '#F5F0FC');
    grad.addColorStop(0.85, '#D5C8EC');
    grad.addColorStop(1, '#9F8CBF');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();

    const spec = ctx.createRadialGradient(lx, ly, 0, lx, ly, r * 0.35);
    spec.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
    spec.addColorStop(1, 'transparent');
    ctx.fillStyle = spec;
    ctx.beginPath();
    ctx.arc(lx, ly, r * 0.35, 0, Math.PI * 2);
    ctx.fill();

    return canvas;
  }

  /**
   * Generates Translucent Aerogel Bubble canvas texture
   */
  function createBubbleCanvas(size = 72) {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    const cx = size * 0.5;
    const cy = size * 0.5;
    const r = size * 0.42;

    // Soft outer aerogel aura
    const halo = ctx.createRadialGradient(cx, cy, r * 0.75, cx, cy, r * 1.15);
    halo.addColorStop(0, 'rgba(124, 232, 213, 0.35)');
    halo.addColorStop(1, 'transparent');
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(cx, cy, r * 1.15, 0, Math.PI * 2);
    ctx.fill();

    // Translucent glass sphere body
    const bodyGrad = ctx.createRadialGradient(cx - r * 0.25, cy - r * 0.25, r * 0.1, cx, cy, r);
    bodyGrad.addColorStop(0, 'rgba(235, 254, 252, 0.45)');
    bodyGrad.addColorStop(0.5, 'rgba(124, 232, 213, 0.18)');
    bodyGrad.addColorStop(0.85, 'rgba(75, 195, 178, 0.45)');
    bodyGrad.addColorStop(1, 'rgba(40, 160, 145, 0.75)');

    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.clip();

    ctx.fillStyle = bodyGrad;
    ctx.fill();

    // Twin specular reflection arcs (classic soap bubble highlights)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.78, Math.PI * 1.05, Math.PI * 1.45);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.78, Math.PI * 0.15, Math.PI * 0.42);
    ctx.stroke();

    ctx.restore();
    return canvas;
  }

  /**
   * Generates Magnetic Sphere texture with indigo core and brass magnetic ring
   */
  function createMagnetCanvas(size = 72) {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    const cx = size * 0.5;
    const cy = size * 0.5;
    const r = size * 0.42;

    // Magnetic field aura ring
    const magAura = ctx.createRadialGradient(cx, cy, r * 0.8, cx, cy, r * 1.18);
    magAura.addColorStop(0, 'rgba(92, 116, 181, 0.4)');
    magAura.addColorStop(0.6, 'rgba(92, 116, 181, 0.2)');
    magAura.addColorStop(1, 'transparent');
    ctx.fillStyle = magAura;
    ctx.beginPath();
    ctx.arc(cx, cy, r * 1.18, 0, Math.PI * 2);
    ctx.fill();

    const lx = cx - r * 0.32;
    const ly = cy - r * 0.35;

    // Deep Indigo Sphere Core
    const bodyGrad = ctx.createRadialGradient(lx, ly, r * 0.08, cx, cy, r);
    bodyGrad.addColorStop(0, '#5A6F9E');
    bodyGrad.addColorStop(0.35, '#283452');
    bodyGrad.addColorStop(0.85, '#141B2D');
    bodyGrad.addColorStop(1, '#0C101B');

    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.clip();

    ctx.fillStyle = bodyGrad;
    ctx.fill();

    // Equatorial Brass Magnetic Ring
    ctx.strokeStyle = '#E4D5B7';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.ellipse(cx, cy, r * 0.88, r * 0.32, -Math.PI / 6, 0, Math.PI * 2);
    ctx.stroke();

    // Specular highlight
    const spec = ctx.createRadialGradient(lx, ly, 0, lx, ly, r * 0.4);
    spec.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
    spec.addColorStop(0.4, 'rgba(228, 213, 183, 0.4)');
    spec.addColorStop(1, 'transparent');
    ctx.fillStyle = spec;
    ctx.beginPath();
    ctx.arc(lx, ly, r * 0.4, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
    return canvas;
  }

  // Soft dust particle canvas
  function createDustCanvas(size = 32) {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    const cx = size * 0.5;
    const cy = size * 0.5;
    const r = size * 0.45;

    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    grad.addColorStop(0, 'rgba(240, 235, 225, 0.95)');
    grad.addColorStop(0.35, 'rgba(228, 213, 183, 0.5)');
    grad.addColorStop(1, 'transparent');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();

    return canvas;
  }

  function initTextures() {
    CERAMIC_PALETTES.forEach(pal => {
      const canvas = createCeramicCanvas(pal, 72, false);
      const texture = PIXI.Texture.from(canvas);
      textureCache.set(pal.name, {
        texture,
        palette: pal
      });
    });

    // 1. Gold Texture
    const goldCanvas = createCeramicCanvas(GOLD_PALETTE, 80, true);
    goldTexture = PIXI.Texture.from(goldCanvas);
    textureCache.set('gold', {
      texture: goldTexture,
      palette: GOLD_PALETTE
    });

    // 2. Cluster Texture & Micro-Pearl Texture
    const clusterCanvas = createClusterCanvas(76);
    clusterTexture = PIXI.Texture.from(clusterCanvas);
    textureCache.set('cluster', {
      texture: clusterTexture,
      palette: CLUSTER_PALETTE
    });

    const microPearlCanvas = createMicroPearlCanvas(36);
    microPearlTexture = PIXI.Texture.from(microPearlCanvas);
    textureCache.set('micro_pearl', {
      texture: microPearlTexture,
      palette: CLUSTER_PALETTE
    });

    // 3. Antigravity Bubble Texture
    const bubbleCanvas = createBubbleCanvas(76);
    bubbleTexture = PIXI.Texture.from(bubbleCanvas);
    textureCache.set('bubble', {
      texture: bubbleTexture,
      palette: BUBBLE_PALETTE
    });

    // 4. Magnetic Sphere Texture
    const magnetCanvas = createMagnetCanvas(76);
    magnetTexture = PIXI.Texture.from(magnetCanvas);
    textureCache.set('magnet', {
      texture: magnetTexture,
      palette: MAGNET_PALETTE
    });

    const dustCanvas = createDustCanvas(32);
    dustParticleTexture = PIXI.Texture.from(dustCanvas);
    defaultTexture = textureCache.get('dusty_rose').texture;
  }

  function getRandomPalette() {
    return CERAMIC_PALETTES[Math.floor(Math.random() * CERAMIC_PALETTES.length)];
  }

  function getTexture(name) {
    const item = textureCache.get(name);
    return item ? item.texture : defaultTexture;
  }

  return {
    init: initTextures,
    getTexture,
    getGoldTexture: () => goldTexture,
    getGoldPalette: () => GOLD_PALETTE,
    getClusterTexture: () => clusterTexture,
    getClusterPalette: () => CLUSTER_PALETTE,
    getMicroPearlTexture: () => microPearlTexture,
    getBubbleTexture: () => bubbleTexture,
    getBubblePalette: () => BUBBLE_PALETTE,
    getMagnetTexture: () => magnetTexture,
    getMagnetPalette: () => MAGNET_PALETTE,
    getParticleTexture: () => dustParticleTexture,
    getRandomPalette,
    palettes: CERAMIC_PALETTES,
    goldPalette: GOLD_PALETTE,
    clusterPalette: CLUSTER_PALETTE,
    bubblePalette: BUBBLE_PALETTE,
    magnetPalette: MAGNET_PALETTE
  };
})();
