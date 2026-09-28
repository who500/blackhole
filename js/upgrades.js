/**
 * Singularity Collector — Progression & Balanced Upgrade System
 * Deeper, smoother progression curve with balanced exponential cost scaling and combo multipliers.
 */

window.Progression = (function() {
  const STORAGE_KEY = 'singularity_collector_slate_v2';

  const STARTING_MASS = 20;

  let state = {
    mass: STARTING_MASS,
    totalMatter: 0,
    totalAbsorbed: 0,
    upgrades: {
      radius: 1,
      gravity: 1,
      stream: 1,
      density: 1
    },
    soundEnabled: true,
    hapticsEnabled: true
  };

  /**
   * Screen scale factor: scales all physics dimensions relative to a 900px reference.
   * On a 360px wide phone, scale ≈ 0.60. On 1920px desktop, scale ≈ 1.5 (capped at 1.6).
   * Prevents the black hole and gravity aura from overwhelming small screens.
   */
  function getScreenScale() {
    const minDim = Math.min(window.innerWidth, window.innerHeight);
    // Reference: 900px min-dimension = scale 1.0
    const raw = minDim / 900;
    return Math.max(0.50, Math.min(1.65, raw));
  }

  // Expose globally so physics.js can use it for ball sizing
  window.getScreenScale = getScreenScale;

  // Progressive upgrade configs: accessible start with smooth long-term scaling
  const UPGRADE_CONFIGS = {
    radius: {
      id: 'radius',
      name: 'Размер дыры',
      shortName: 'Размер',
      baseCost: 14,
      calcCost: (lvl) => Math.floor(14 * Math.pow(1.15, lvl - 1)),
      calcRadius: (lvl) => Math.round(24 + 75 * (1 - Math.exp(-(lvl - 1) / 35)) + (lvl - 1) * 0.25),
      formatDesc: (lvl) => `${Math.round(24 + 75 * (1 - Math.exp(-(lvl - 1) / 35)) + (lvl - 1) * 0.25)}px`
    },
    gravity: {
      id: 'gravity',
      name: 'Сила притяжения',
      shortName: 'Магнит',
      baseCost: 18,
      calcCost: (lvl) => Math.floor(18 * Math.pow(1.15, lvl - 1)),
      calcStrength: (lvl) => 1.0 + (lvl - 1) * 0.10,
      calcRange: (lvl) => 120 + 160 * (1 - Math.exp(-(lvl - 1) / 40)) + (lvl - 1) * 1.0,
      calcVortex: (lvl) => 1.0 + (lvl - 1) * 0.08,
      formatDesc: (lvl) => `${(1.0 + (lvl - 1) * 0.10).toFixed(1)}x`
    },
    stream: {
      id: 'stream',
      name: 'Частота сфер',
      shortName: 'Поток',
      baseCost: 25,
      calcCost: (lvl) => Math.floor(25 * Math.pow(1.15, lvl - 1)),
      calcInterval: (lvl) => Math.max(0.025, 0.90 / (1 + (lvl - 1) * 0.08)),
      formatDesc: (lvl) => `${(1 / Math.max(0.025, 0.90 / (1 + (lvl - 1) * 0.08))).toFixed(1)}${window.i18n ? window.i18n.t('per_sec') : '/с'}`
    },
    density: {
      id: 'density',
      name: 'Ценность сфер',
      shortName: 'Доход',
      baseCost: 35,
      calcCost: (lvl) => Math.floor(35 * Math.pow(1.15, lvl - 1)),
      calcMultiplier: (lvl) => Math.pow(1.15, lvl - 1),
      formatDesc: (lvl) => {
        const mult = Math.pow(1.15, lvl - 1);
        return mult >= 1000 ? `${(mult / 1000).toFixed(1)}K×` : `${mult.toFixed(1)}×`;
      }
    }
  };

  function getCost(upgradeKey) {
    const cfg = UPGRADE_CONFIGS[upgradeKey];
    if (!cfg) return Infinity;
    const lvl = state.upgrades[upgradeKey] || 1;
    if (typeof cfg.calcCost === 'function') {
      return cfg.calcCost(lvl);
    }
    return Math.floor(cfg.baseCost * Math.pow(1.15, lvl - 1));
  }

  function canAfford(upgradeKey) {
    return state.mass >= getCost(upgradeKey);
  }

  function buyUpgrade(upgradeKey) {
    const cost = getCost(upgradeKey);
    if (state.mass >= cost) {
      state.mass -= cost;
      state.upgrades[upgradeKey] = (state.upgrades[upgradeKey] || 1) + 1;
      
      applyUpgradesToGame();
      save();
      return true;
    }
    return false;
  }

  /**
   * Add matter with direct combo multiplier and x2 Rewarded Boost applied to mass
   */
  function addMatter(count = 1, baseMass = 1, comboMultiplier = 1) {
    const densityMult = UPGRADE_CONFIGS.density.calcMultiplier(state.upgrades.density);
    const mgr = window.PlatformManager || window.YandexManager;
    const boostMult = (mgr && typeof mgr.isBoostActive === 'function' && mgr.isBoostActive()) ? 2 : 1;
    const earnedMass = Math.max(1, Math.round(baseMass * densityMult * comboMultiplier * boostMult));
    
    state.totalMatter += count;
    state.totalAbsorbed = state.totalMatter;
    state.mass += earnedMass;

    // Send score update to Leaderboards with throttling
    if (mgr && typeof mgr.submitScore === 'function') {
      mgr.submitScore(state.totalMatter);
    }

    return earnedMass;
  }

  function applyUpgradesToGame() {
    const scale = getScreenScale();
    const radius = UPGRADE_CONFIGS.radius.calcRadius(state.upgrades.radius) * scale;
    const gravRange = UPGRADE_CONFIGS.gravity.calcRange(state.upgrades.gravity) * scale;
    
    if (window.Singularity) {
      window.Singularity.setRadius(radius);
      window.Singularity.setGravityRange(gravRange);
    }
  }

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (typeof parsed.mass === 'number') state.mass = parsed.mass;
        if (typeof parsed.totalMatter === 'number') {
          state.totalMatter = parsed.totalMatter;
          state.totalAbsorbed = parsed.totalMatter;
        } else if (typeof parsed.totalAbsorbed === 'number') {
          state.totalMatter = parsed.totalAbsorbed;
          state.totalAbsorbed = parsed.totalAbsorbed;
        }
        if (parsed.upgrades) {
          state.upgrades = Object.assign(state.upgrades, parsed.upgrades);
        }
        if (typeof parsed.soundEnabled === 'boolean') state.soundEnabled = parsed.soundEnabled;
        if (typeof parsed.hapticsEnabled === 'boolean') state.hapticsEnabled = parsed.hapticsEnabled;
      }

      // Fresh session starting capital guarantee
      if (state.totalMatter === 0 && state.mass < STARTING_MASS) {
        state.mass = STARTING_MASS;
      }
    } catch (e) {
      console.warn('Failed to load save from localStorage:', e);
    }
  }

  function save() {
    try {
      state.totalAbsorbed = state.totalMatter;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.warn('Failed to save to localStorage:', e);
    }

    // Mirror save to Yandex Cloud Storage
    if (window.YandexManager && typeof window.YandexManager.saveCloudData === 'function') {
      window.YandexManager.saveCloudData(state);
    }
  }

  /**
   * Seamlessly merges cloud data if it contains superior progress
   */
  function applyCloudData(cloudData) {
    if (!cloudData) return;
    let modified = false;

    if (typeof cloudData.mass === 'number' && cloudData.mass > state.mass) {
      state.mass = cloudData.mass;
      modified = true;
    }

    const cloudTotal = (typeof cloudData.totalAbsorbed === 'number')
      ? cloudData.totalAbsorbed
      : (typeof cloudData.totalMatter === 'number' ? cloudData.totalMatter : 0);

    if (cloudTotal > state.totalMatter) {
      state.totalMatter = cloudTotal;
      state.totalAbsorbed = cloudTotal;
      modified = true;
    }

    if (cloudData.upgrades) {
      Object.keys(cloudData.upgrades).forEach(key => {
        const cloudLvl = cloudData.upgrades[key];
        if (typeof cloudLvl === 'number' && cloudLvl > (state.upgrades[key] || 1)) {
          state.upgrades[key] = cloudLvl;
          modified = true;
        }
      });
    }

    if (modified) {
      applyUpgradesToGame();
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch (e) {}
      if (window.GameUI && typeof window.GameUI.updateUpgradesDisplay === 'function') {
        window.GameUI.updateUpgradesDisplay();
      }
    }
  }

  /**
   * Reliably wipes state and localStorage back to initial defaults
   */
  function resetProgress() {
    state.mass = STARTING_MASS;
    state.totalMatter = 0;
    state.totalAbsorbed = 0;
    state.upgrades = {
      radius: 1,
      gravity: 1,
      stream: 1,
      density: 1
    };
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.warn('LocalStorage reset note:', e);
    }
    applyUpgradesToGame();

    if (window.YandexManager) {
      if (typeof window.YandexManager.saveCloudData === 'function') {
        window.YandexManager.saveCloudData(state);
      }
      if (typeof window.YandexManager.submitScore === 'function') {
        window.YandexManager.submitScore(0, true);
      }
    }
  }

  return {
    init: () => {
      load();
      applyUpgradesToGame();
    },
    getState: () => state,
    getConfig: (key) => UPGRADE_CONFIGS[key],
    getCost,
    canAfford,
    buyUpgrade,
    addMatter,
    applyUpgradesToGame,
    applyCloudData,
    save,
    resetProgress,
    getMass: () => state.mass,
    getTotalMatter: () => state.totalMatter,
    getTotalAbsorbed: () => state.totalMatter,
    getUpgradeLevel: (key) => state.upgrades[key] || 1,
    configs: UPGRADE_CONFIGS
  };
})();

