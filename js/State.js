/**
 * Singularity Collector — State Management Interface
 * Provides direct access and synchronization with Progression state and starting capital.
 */

window.GameState = (function() {
  'use strict';

  function getState() {
    return window.Progression ? window.Progression.getState() : null;
  }

  function getMass() {
    return window.Progression ? window.Progression.getMass() : 0;
  }

  function getTotalMatter() {
    return window.Progression ? window.Progression.getTotalMatter() : 0;
  }

  function getUpgradeLevel(key) {
    return window.Progression ? window.Progression.getUpgradeLevel(key) : 1;
  }

  function buyUpgrade(key) {
    return window.Progression ? window.Progression.buyUpgrade(key) : false;
  }

  function resetProgress() {
    if (window.Progression) {
      window.Progression.resetProgress();
    }
  }

  return {
    getState,
    getMass,
    getTotalMatter,
    getUpgradeLevel,
    buyUpgrade,
    resetProgress
  };
})();

// Compatibility alias
window.State = window.GameState;
