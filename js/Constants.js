/**
 * Singularity Collector — Game Balance Constants & Progression Model
 * Balanced for an engaging early game (levels 1-6 in first 2 mins) and sustained long-term progression.
 */

window.GameConstants = (function() {
  'use strict';

  /**
   * Progressive balanced cost calculation:
   * Uses 1.16x geometric scaling so costs steadily outpace base income and prevent infinite spam loops.
   */
  function calcCost(baseCost, lvl) {
    return Math.floor(baseCost * Math.pow(1.16, lvl - 1));
  }

  return {
    // Starting Economy Capital
    STARTING_MASS: 20,

    // Base Sphere Values
    SPHERE_BASE_MASS: 2,
    GOLD_SPHERE_MULT: 15,
    GOLD_SPHERE_MASS: 30, // 15x standard sphere base mass
    MICRO_PEARL_MASS: 2,  // 100% of standard sphere base mass
    BUBBLE_SPHERE_MASS: 16,
    MAGNET_SPHERE_MASS: 10,

    // Spawn Probabilities (Total 100%)
    SPAWN_RATES: {
      cluster: 0.035, // ~3.5%
      magnet: 0.015,  // ~1.5%
      gold: 0.050,    // 5.0%
      standard: 0.900 // ~90.0%
    },

    // Rewarded Video Ad 2x Boost Parameters
    BOOST: {
      DURATION_SECONDS: 60, // 1 minute
      FREQUENCY_MULTIPLIER: 2, // 2x sphere spawn frequency
      VALUE_MULTIPLIER: 2 // 2x sphere value/mass
    },

    // Gravitational Resonance (Combo) Ladder
    COMBO: {
      BURN_TIME: 2.5, // 2.5s window
      STREAK_THRESHOLDS: [
        { minStreak: 75, multiplier: 32 },
        { minStreak: 52, multiplier: 24 },
        { minStreak: 36, multiplier: 16 },
        { minStreak: 24, multiplier: 12 },
        { minStreak: 15, multiplier: 8 },
        { minStreak: 9,  multiplier: 5 },
        { minStreak: 5,  multiplier: 3 },
        { minStreak: 2,  multiplier: 2 }
      ],
      getMultiplier: function(streak) {
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
    },

    calcCost,

    // Upgrade Configurations
    UPGRADES: {
      radius: {
        id: 'radius',
        name: 'Размер дыры',
        shortName: 'Размер',
        baseCost: 14,
        calcCost: (lvl) => calcCost(14, lvl),
        calcRadius: (lvl) => Math.round(24 + 70 * (1 - Math.exp(-(lvl - 1) / 45)) + (lvl - 1) * 0.20),
        formatDesc: (lvl) => `${Math.round(24 + 70 * (1 - Math.exp(-(lvl - 1) / 45)) + (lvl - 1) * 0.20)}px`
      },
      gravity: {
        id: 'gravity',
        name: 'Сила притяжения',
        shortName: 'Магнит',
        baseCost: 18,
        calcCost: (lvl) => calcCost(18, lvl),
        calcStrength: (lvl) => 1.0 + (lvl - 1) * 0.08,
        calcRange: (lvl) => 120 + 150 * (1 - Math.exp(-(lvl - 1) / 50)) + (lvl - 1) * 0.8,
        calcVortex: (lvl) => 1.0 + (lvl - 1) * 0.06,
        formatDesc: (lvl) => `${(1.0 + (lvl - 1) * 0.08).toFixed(1)}x`
      },
      stream: {
        id: 'stream',
        name: 'Частота сфер',
        shortName: 'Поток',
        baseCost: 25,
        calcCost: (lvl) => calcCost(25, lvl),
        calcInterval: (lvl) => Math.max(0.04, 0.90 / (1 + (lvl - 1) * 0.07)),
        formatDesc: (lvl) => `${(1 / Math.max(0.04, 0.90 / (1 + (lvl - 1) * 0.07))).toFixed(1)}${window.i18n ? window.i18n.t('per_sec') : '/s'}`
      },
      density: {
        id: 'density',
        name: 'Ценность сфер',
        shortName: 'Доход',
        baseCost: 35,
        calcCost: (lvl) => calcCost(35, lvl),
        calcMultiplier: (lvl) => Math.pow(1.09, lvl - 1),
        formatDesc: (lvl) => {
          const mult = Math.pow(1.09, lvl - 1);
          return mult >= 1000 ? `${(mult / 1000).toFixed(1)}K×` : `${mult.toFixed(1)}×`;
        }
      }
    }
  };
})();

// Compatibility alias
window.Constants = window.GameConstants;
