/**
 * Singularity Collector — UI Controller & DOM Interactions
 * Handles HUD numbers, floating text feedback, upgrades dock, combo resonance banner, and reset modal.
 */

window.GameUI = (function() {
  // Elements
  let elMatterCount = null;
  let elMassCount = null;
  let elComboDisplay = null;
  let elComboValue = null;
  let elComboBonus = null;
  let elComboBar = null;
  let elStartOverlay = null;

  // Modal elements
  let elSettingsModal = null;
  let elSettingsClose = null;
  let elLangSelect = null;
  
  let elResetModal = null;
  let elModalCancel = null;
  let elModalConfirm = null;

  // Leaderboard elements
  let elLbModal = null;
  let elLbClose = null;
  let elLbTabs = null;
  let elLbListContainer = null;
  let elLbUserScore = null;
  let elLbUserRank = null;
  let currentLbTab = 'leaderboard_week';

  // Rewarded Boost elements
  let elBtnBoost = null;
  let elBoostStatusText = null;
  let lastBoostActive = false;

  // Display counters with smooth rolling interpolation
  let displayedMass = 0;
  let displayedMatter = 0;
  let lastMultiplier = 1;

  function init() {
    elMatterCount = document.getElementById('matter-count');
    elMassCount = document.getElementById('mass-count');
    elComboDisplay = document.getElementById('combo-display');
    elComboValue = document.getElementById('combo-value');
    elComboBonus = document.getElementById('combo-bonus-text');
    elComboBar = document.getElementById('combo-bar');
    elStartOverlay = document.getElementById('start-overlay');

    elSettingsModal = document.getElementById('settings-modal');
    elSettingsClose = document.getElementById('settings-close-btn');
    elLangSelect = document.getElementById('settings-lang-select');

    elResetModal = document.getElementById('reset-modal');
    elModalCancel = document.getElementById('modal-cancel-btn');
    elModalConfirm = document.getElementById('modal-confirm-btn');

    elLbModal = document.getElementById('leaderboard-modal');
    elLbClose = document.getElementById('lb-close-btn');
    elLbTabs = document.querySelectorAll('.lb-tab-btn');
    elLbListContainer = document.getElementById('lb-list-container');
    elLbUserScore = document.getElementById('lb-user-score');
    elLbUserRank = document.getElementById('lb-user-rank');

    elBtnBoost = document.getElementById('btn-boost');
    elBoostStatusText = document.getElementById('boost-status-text');

    // i18n init
    if (window.i18n) {
      window.i18n.init();
      window.onLanguageChanged = () => {
        updateUpgradesDisplay();
        updateHUD();
        hideCombo(); // Refresh combo text next time it shows
        if (elBtnBoost) {
          const mgr = window.PlatformManager || window.YandexManager;
          const active = mgr && typeof mgr.isBoostActive === 'function' && mgr.isBoostActive();
          if (!active) {
            elBoostStatusText.textContent = window.i18n.t('boost_label');
          }
        }
        if (elLangSelect && window.i18n) {
          elLangSelect.value = window.i18n.getLang();
        }
        if (elLbModal && !elLbModal.classList.contains('hidden')) {
          loadAndRenderLeaderboard(currentLbTab);
        }
      };
    }

    setupUpgradeButtons();
    setupQuickControls();
    setupSettingsModal();
    setupResetModal();
    setupLeaderboardModal();
    setupBoostButton();
    updateUpgradesDisplay();

    // Start overlay dismiss on click or touch
    if (elStartOverlay) {
      const dismiss = (e) => {
        if (e && e.cancelable && e.type === 'touchstart') e.preventDefault();
        try { SoundEngine.init(); } catch (err) {}
        elStartOverlay.classList.add('fade-out');
        elStartOverlay.style.pointerEvents = 'none';
        setTimeout(() => {
          if (elStartOverlay && elStartOverlay.parentNode) {
            elStartOverlay.parentNode.removeChild(elStartOverlay);
          }
        }, 400);
      };

      elStartOverlay.addEventListener('touchstart', dismiss, { passive: false });
      elStartOverlay.addEventListener('pointerdown', dismiss);
      elStartOverlay.addEventListener('click', dismiss);
    }
  }

  function setupUpgradeButtons() {
    const upgradeKeys = ['radius', 'gravity', 'stream', 'density'];

    upgradeKeys.forEach(key => {
      const btn = document.getElementById(`upg-${key}`);
      if (!btn) return;

      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (Progression.canAfford(key)) {
          const success = Progression.buyUpgrade(key);
          if (success) {
            SoundEngine.playUpgradeSound();
            if (Progression.getState().hapticsEnabled && 'vibrate' in navigator) {
              try { navigator.vibrate(10); } catch(err) {}
            }
            if (window.i18n) {
              showToast(window.i18n.t('upgraded', {val: window.i18n.t(`upg_${key}_name`)}));
            }
            updateUpgradesDisplay();
          }
        }
      });
    });
  }

  function setupQuickControls() {
    // 1. Leaderboard Button
    const btnLeaderboard = document.getElementById('btn-leaderboard');
    if (btnLeaderboard) {
      btnLeaderboard.addEventListener('click', (e) => {
        e.stopPropagation();
        if (elLbModal) {
          elLbModal.classList.remove('hidden');
          loadAndRenderLeaderboard(currentLbTab);
        }
      });
    }

    // 2. Settings Button
    const btnSettings = document.getElementById('btn-settings');
    if (btnSettings) {
      btnSettings.addEventListener('click', (e) => {
        e.stopPropagation();
        if (elSettingsModal) {
          elSettingsModal.classList.remove('hidden');
        }
      });
    }
  }

  function setupSettingsModal() {
    if (elSettingsClose) {
      elSettingsClose.addEventListener('click', (e) => {
        e.stopPropagation();
        if (elSettingsModal) elSettingsModal.classList.add('hidden');
      });
    }

    if (elSettingsModal) {
      elSettingsModal.addEventListener('click', (e) => {
        if (e.target === elSettingsModal) {
          elSettingsModal.classList.add('hidden');
        }
      });
    }

    if (elLangSelect && window.i18n) {
      elLangSelect.value = window.i18n.getLang();
      elLangSelect.addEventListener('change', (e) => {
        window.i18n.setLang(e.target.value);
      });
    }

    // Sound Button in Settings
    const btnSound = document.getElementById('btn-sound');
    const iconSoundOn = document.getElementById('icon-sound-on');
    const iconSoundOff = document.getElementById('icon-sound-off');

    if (btnSound) {
      // Init state
      if (!Progression.getState().soundEnabled) {
         iconSoundOn.classList.add('hidden');
         iconSoundOff.classList.remove('hidden');
         btnSound.classList.remove('active');
      }

      btnSound.addEventListener('click', (e) => {
        e.stopPropagation();
        SoundEngine.init();
        const muted = SoundEngine.toggleMute();
        Progression.getState().soundEnabled = !muted;
        Progression.save();

        if (muted) {
          iconSoundOn.classList.add('hidden');
          iconSoundOff.classList.remove('hidden');
          btnSound.classList.remove('active');
          if (window.i18n) showToast(window.i18n.t('sound_off'));
        } else {
          iconSoundOn.classList.remove('hidden');
          iconSoundOff.classList.add('hidden');
          btnSound.classList.add('active');
          if (window.i18n) showToast(window.i18n.t('sound_on'));
        }
      });
    }

    // Haptics Button in Settings
    const btnHaptics = document.getElementById('btn-haptics');
    if (btnHaptics) {
      if (Progression.getState().hapticsEnabled) {
        btnHaptics.classList.add('active');
      }
      btnHaptics.addEventListener('click', (e) => {
        e.stopPropagation();
        const state = Progression.getState();
        state.hapticsEnabled = !state.hapticsEnabled;
        Progression.save();

        btnHaptics.classList.toggle('active', state.hapticsEnabled);
        if (state.hapticsEnabled) {
          if ('vibrate' in navigator) try { navigator.vibrate(10); } catch(err) {}
          if (window.i18n) showToast(window.i18n.t('vibro_on'));
        } else {
          if (window.i18n) showToast(window.i18n.t('vibro_off'));
        }
      });
    }

    // Favorites Button (VK Bridge)

    const btnFavorite = document.getElementById('btn-favorite');
    if (btnFavorite) {
      btnFavorite.addEventListener('click', (e) => {
        e.stopPropagation();
        const mgr = window.PlatformManager || window.YandexManager;
        if (mgr && typeof mgr.addToFavorites === 'function') {
          mgr.addToFavorites();
        } else {
          showToast('Нажмите Ctrl+D для закладки');
        }
      });
    }

    // Reset Button in Settings (Opens Confirm Dialog)
    const btnReset = document.getElementById('btn-reset');
    if (btnReset) {
      btnReset.addEventListener('click', (e) => {
        e.stopPropagation();
        if (elSettingsModal) elSettingsModal.classList.add('hidden');
        if (elResetModal) {
          elResetModal.classList.remove('hidden');
        }
      });
    }
  }

  function setupBoostButton() {
    if (!elBtnBoost) return;

    elBtnBoost.addEventListener('click', (e) => {
      e.stopPropagation();
      const mgr = window.PlatformManager || window.YandexManager;
      if (!mgr || typeof mgr.showRewardedVideo !== 'function') return;

      SoundEngine.init();
      mgr.showRewardedVideo(
        () => {
          SoundEngine.playPop(1.5, 0.25);
          if (Progression.getState().hapticsEnabled && 'vibrate' in navigator) {
            try { navigator.vibrate([25, 50, 25]); } catch(err) {}
          }
        },
        (err) => {
          console.warn('Rewarded ad failed or was closed:', err);
        }
      );
    });
  }

  function setupResetModal() {
    if (elModalCancel) {
      elModalCancel.addEventListener('click', (e) => {
        e.stopPropagation();
        if (elResetModal) elResetModal.classList.add('hidden');
      });
    }

    if (elModalConfirm) {
      elModalConfirm.addEventListener('click', (e) => {
        e.stopPropagation();
        Progression.resetProgress();
        PhysicsEngine.clearAll();
        VFXSystem.clearAll();
        displayedMass = 0;
        displayedMatter = 0;
        lastMultiplier = 1;
        hideCombo();
        updateUpgradesDisplay();
        if (elResetModal) elResetModal.classList.add('hidden');
        if (window.i18n) {
          showToast(window.i18n.t('reset_success') || 'Progress Reset');
        }
      });
    }

    if (elResetModal) {
      elResetModal.addEventListener('click', (e) => {
        if (e.target === elResetModal) {
          elResetModal.classList.add('hidden');
        }
      });
    }
  }

  function setupLeaderboardModal() {
    if (elLbClose) {
      elLbClose.addEventListener('click', (e) => {
        e.stopPropagation();
        if (elLbModal) elLbModal.classList.add('hidden');
      });
    }

    if (elLbModal) {
      elLbModal.addEventListener('click', (e) => {
        if (e.target === elLbModal) {
          elLbModal.classList.add('hidden');
        }
      });
    }

    if (elLbTabs) {
      elLbTabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
          e.stopPropagation();
          elLbTabs.forEach(t => t.classList.remove('active'));
          tab.classList.add('active');
          const tabKey = tab.getAttribute('data-tab');
          loadAndRenderLeaderboard(tabKey);
        });
      });
    }

    const elVkWrap = document.getElementById('lb-vk-action-wrap');
    const btnShowVkLb = document.getElementById('btn-show-vk-lb');
    const platform = window.PlatformManager || window.YandexManager;
    const isVk = (platform && typeof platform.getPlatform === 'function' && platform.getPlatform() === 'vk') ||
                 (typeof window.vkBridge !== 'undefined' && !window.ysdk);
    const urlParams = new URLSearchParams(window.location.search);
    const vkPlatform = urlParams.get('vk_platform') || '';
    const isOk = vkPlatform.startsWith('ok') || window.location.href.includes('ok.ru') || (document.referrer && document.referrer.includes('ok.ru'));

    if (elVkWrap) {
      // VKWebAppShowLeaderBoardBox is only available in VK; hide it in OK to keep UI clean and compliant
      elVkWrap.classList.toggle('hidden', !isVk || isOk);
    }

    if (btnShowVkLb) {
      btnShowVkLb.addEventListener('click', async (e) => {
        e.stopPropagation();
        if (platform && typeof platform.showVKLeaderboard === 'function') {
          try {
            await platform.showVKLeaderboard();
          } catch (err) {
            console.warn('[UI] VK Leaderboard error:', err);
          }
        }
      });
    }
  }

  const defaultAvatarSvg = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#E4D5B7" stroke-width="1.8"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 4-6 8-6s8 2 8 6"/></svg>`;

  function escapeHtml(str) {
    if (!str) return window.i18n ? window.i18n.t('stranger') : 'Странник';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  async function loadAndRenderLeaderboard(tabKey = 'leaderboard_week') {
    currentLbTab = tabKey;
    if (!elLbListContainer) return;
    elLbListContainer.innerHTML = `<div class="lb-loading">${window.i18n ? window.i18n.t('lb_loading') : 'Loading...'}</div>`;

    const elVkWrap = document.getElementById('lb-vk-action-wrap');
    const platform = window.PlatformManager || window.YandexManager;
    const isVk = (platform && typeof platform.getPlatform === 'function' && platform.getPlatform() === 'vk') ||
                 (typeof window.vkBridge !== 'undefined' && !window.ysdk);
    const urlParams = new URLSearchParams(window.location.search);
    const isOk = (urlParams.get('vk_platform') || '').startsWith('ok') || window.location.href.includes('ok.ru') || (document.referrer && document.referrer.includes('ok.ru'));
    if (elVkWrap) {
      elVkWrap.classList.toggle('hidden', !isVk || isOk);
    }

    let data;
    if (window.YandexManager && typeof window.YandexManager.getLeaderboardData === 'function') {
      data = await window.YandexManager.getLeaderboardData(tabKey);
    } else {
      data = {
        userRank: 1,
        userScore: (window.Progression ? window.Progression.getTotalMatter() : 0),
        entries: []
      };
    }

    if (elLbUserScore) {
      const sp = window.i18n ? window.i18n.t('spheres') : 'сфер';
      elLbUserScore.textContent = `${formatNumber(data.userScore)} ${sp}`;
    }
    if (elLbUserRank) {
      elLbUserRank.textContent = data.userRank ? `#${data.userRank}` : '#—';
    }

    if (!data.entries || data.entries.length === 0) {
      elLbListContainer.innerHTML = `<div class="lb-empty">${window.i18n ? window.i18n.t('lb_empty') : 'Empty'}</div>`;
      return;
    }

    const sp = window.i18n ? window.i18n.t('spheres') : 'сфер';

    let html = '';
    data.entries.forEach(entry => {
      let rankBadgeClass = 'rank-badge';
      if (entry.rank === 1) rankBadgeClass += ' rank-gold';
      else if (entry.rank === 2) rankBadgeClass += ' rank-silver';
      else if (entry.rank === 3) rankBadgeClass += ' rank-bronze';

      const avatarHtml = entry.avatar
        ? `<img class="lb-avatar-img" src="${entry.avatar}" alt="${entry.name}" />`
        : `<div class="lb-avatar-placeholder">${defaultAvatarSvg}</div>`;

      const userRowClass = entry.isUser ? 'is-current-user' : '';
      const userBadge = entry.isUser ? `<span class="lb-user-badge">${window.i18n ? window.i18n.t('you') : 'Вы'}</span>` : '';

      html += `
        <div class="lb-row ${userRowClass}">
          <div class="lb-row-left">
            <span class="${rankBadgeClass}">${entry.rank}</span>
            ${avatarHtml}
            <span class="lb-name lb-player-name" title="${entry.name}">${escapeHtml(entry.name)}${userBadge}</span>
          </div>
          <div class="lb-row-right">
            <span class="lb-score-num">${formatNumber(entry.score)}</span>
            <span class="lb-score-unit">${sp}</span>
          </div>
        </div>
      `;
    });

    elLbListContainer.innerHTML = html;
  }

  function updateHUD(dt) {
    const targetMass = Progression.getMass();
    const targetMatter = Progression.getTotalMatter();

    // Smooth counter roll
    if (displayedMass !== targetMass) {
      const diff = targetMass - displayedMass;
      displayedMass += Math.sign(diff) * Math.max(1, Math.ceil(Math.abs(diff) * 0.2));
      if (Math.abs(targetMass - displayedMass) < 1) displayedMass = targetMass;
      elMassCount.textContent = formatNumber(displayedMass);
    }

    if (displayedMatter !== targetMatter) {
      const diff = targetMatter - displayedMatter;
      displayedMatter += Math.sign(diff) * Math.max(1, Math.ceil(Math.abs(diff) * 0.2));
      if (Math.abs(targetMatter - displayedMatter) < 1) displayedMatter = targetMatter;
      elMatterCount.textContent = formatNumber(displayedMatter);
    }

    // Update upgrade buttons affordability state
    const upgradeKeys = ['radius', 'gravity', 'stream', 'density'];
    upgradeKeys.forEach(key => {
      const btn = document.getElementById(`upg-${key}`);
      if (!btn) return;

      const affordable = Progression.canAfford(key);
      btn.disabled = !affordable;
      btn.classList.toggle('affordable', affordable);
    });

    // Update Rewarded Video Boost Button status & countdown
    const boostMgr = window.PlatformManager || window.YandexManager;
    if (elBtnBoost && elBoostStatusText && boostMgr) {
      const isBoost = typeof boostMgr.isBoostActive === 'function' && boostMgr.isBoostActive();
      const remaining = typeof boostMgr.getBoostTimeRemaining === 'function' ? boostMgr.getBoostTimeRemaining() : 0;

      if (isBoost) {
        if (!lastBoostActive) {
          elBtnBoost.classList.add('active');
          lastBoostActive = true;
        }
        const secs = Math.ceil(remaining);
        const m = Math.floor(secs / 60);
        const s = secs % 60;
        const secUnit = window.i18n ? window.i18n.t('sec_short') : 's';
        const timeStr = m > 0 ? `${m}:${s < 10 ? '0' : ''}${s}` : `${s}${secUnit}`;
        elBoostStatusText.textContent = `${timeStr} (×2)`;
      } else {
        if (lastBoostActive) {
          elBtnBoost.classList.remove('active');
          lastBoostActive = false;
        }
        if (window.i18n) {
          elBoostStatusText.textContent = window.i18n.t('boost_label');
        }
      }
    }
  }

  function updateUpgradesDisplay() {
    const upgradeKeys = ['radius', 'gravity', 'stream', 'density'];

    upgradeKeys.forEach(key => {
      const cfg = Progression.getConfig(key);
      const lvl = Progression.getUpgradeLevel(key);
      const cost = Progression.getCost(key);

      const elLvl = document.getElementById(`lvl-${key}`);
      const elDesc = document.getElementById(`desc-${key}`);
      const elCost = document.getElementById(`cost-${key}`);
      const elName = document.querySelector(`#upg-${key} .pill-name`);

      if (elName && window.i18n) {
         elName.textContent = window.i18n.t(`upg_${key}_name`);
      }
      if (elLvl && window.i18n) elLvl.textContent = window.i18n.t('lvl', {val: lvl});
      if (elDesc) elDesc.textContent = cfg.formatDesc(lvl);
      if (elCost) elCost.textContent = formatNumber(cost);
    });
  }

  /**
   * Floating points feedback
   */
  function showFloatPoints(x, y, text, color = '#E4D5B7') {
    const floater = document.createElement('div');
    floater.className = 'float-text';
    floater.textContent = text;
    floater.style.left = `${x}px`;
    floater.style.top = `${y}px`;
    floater.style.color = color;

    document.getElementById('ui-layer').appendChild(floater);
    setTimeout(() => {
      if (floater.parentNode) floater.parentNode.removeChild(floater);
    }, 750);
  }

  /**
   * Gravitational Resonance (Combo) Display
   */
  function updateCombo(multiplier, streak, timerRatio) {
    if (!elComboDisplay) return;
    elComboDisplay.classList.remove('hidden');

    if (elComboValue) {
      elComboValue.textContent = `×${multiplier}`;
    }
    if (elComboBonus && window.i18n) {
      elComboBonus.textContent = window.i18n.t('resonance_desc', {val: (multiplier - 1) * 100});
    }

    // Pulse animation on multiplier level-up
    if (multiplier > lastMultiplier) {
      elComboDisplay.classList.remove('bump');
      void elComboDisplay.offsetWidth; // trigger reflow
      elComboDisplay.classList.add('bump');
      lastMultiplier = multiplier;
    }

    updateComboTimer(timerRatio);
  }

  function updateComboTimer(timerRatio) {
    if (elComboBar) {
      elComboBar.style.width = `${Math.min(100, Math.max(0, timerRatio * 100))}%`;
    }
  }

  function hideCombo() {
    if (elComboDisplay) {
      elComboDisplay.classList.add('hidden');
      elComboDisplay.classList.remove('bump');
    }
    lastMultiplier = 1;
  }

  function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast-msg';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 2000);
  }

  function formatNumber(num) {
    if (num >= 1000000000000) return (num / 1000000000000).toFixed(1) + 'T';
    if (num >= 1000000000) return (num / 1000000000).toFixed(1) + 'B';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 10000) return (num / 1000).toFixed(1) + 'K';
    return num.toLocaleString();
  }

  return {
    init,
    updateHUD,
    updateUpgradesDisplay,
    showFloatPoints,
    updateCombo,
    updateComboTimer,
    hideCombo,
    showToast
  };
})();
